import { config } from "dotenv";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  cleanResumeText,
  localEmbedding,
  redactPrivateData,
  type KnowledgeBase,
  type ResumeData,
  type ResumeSection,
} from "../lib/knowledge-schema";

config({ path: ".env.local", quiet: true });
config({ quiet: true });
const sourceDirectory = path.resolve(process.argv[2] || "resumes");
const files = (await readdir(sourceDirectory))
  .filter((f) => /\.(pdf|docx)$/i.test(f))
  .sort();
if (files.length !== 3)
  throw new Error(
    "Place exactly three PDF/DOCX résumés in the input directory. Raw files stay ignored by Git.",
  );
const headings: Record<string, ResumeSection> = {
  summary: "summary",
  profile: "summary",
  "technical skills": "skills",
  skills: "skills",
  experience: "experience",
  "professional experience": "experience",
  projects: "projects",
  education: "education",
  certifications: "certifications",
  "education & certifications": "education",
};
const resumes: ResumeData[] = [];
for (const file of files) {
  const buffer = await readFile(path.join(sourceDirectory, file));
  let raw = "",
    links: string[] = [];
  if (file.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      raw = (await parser.getText()).text;
      const info = await parser.getInfo({ parsePageInfo: true });
      links = info.pages.flatMap((p) => p.links.map((l) => l.url));
    } finally {
      await parser.destroy();
    }
  } else {
    raw = (await mammoth.extractRawText({ buffer })).value;
    const html = (await mammoth.convertToHtml({ buffer })).value;
    links = [...html.matchAll(/href="([^"]+)"/g)].map((match) =>
      match[1].replace(/&amp;/g, "&"),
    );
  }
  const text = cleanResumeText(redactPrivateData(raw));
  if (text.length < 200)
    throw new Error(
      `${file}: insufficient extractable text. OCR scanned résumés first; no empty knowledge files were written.`,
    );
  const sections: Record<ResumeSection, string[]> = {
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    education: [],
    certifications: [],
  };
  let active: ResumeSection | null = null;
  for (const line of text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)) {
    if (/^--\s*\d+ of \d+\s*--$/.test(line)) continue;
    const heading = headings[line.toLowerCase()];
    if (heading) {
      active = heading;
      continue;
    }
    if (/^Certifications:/i.test(line)) {
      active = "certifications";
      sections.certifications.push(line.replace(/^Certifications:\s*/i, ""));
      continue;
    }
    if (active) sections[active].push(line);
  }
  const block = (lines: string[]) =>
    lines
      .join("\n")
      .split(
        /\n(?=[A-Z][^\n•]{4,}(?:Platform|Assistant|Newspaper|Engineer|Intern|Consultant|App|\|))/,
      )
      .filter(Boolean);
  links = [
    ...new Set([...links, ...(text.match(/https?:\/\/[^\s<>]+/g) || [])]),
  ].filter((url) => /^https:\/\//.test(url));
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const label = /Forward_Deployed/i.test(file)
    ? "Forward Deployed Engineer"
    : /Resume_Devansh/i.test(file)
      ? "Applied AI / GenAI"
      : "Software / Mobile Engineer";
  const id = label.startsWith("Forward")
    ? "forward-deployed"
    : label.startsWith("Applied")
      ? "applied-ai"
      : "software-mobile";
  resumes.push({
    id,
    label,
    name: text.split("\n")[0].replace(/DEVANSH PANDEY/i, "Devansh Pandey"),
    sourceFile: file,
    summary: sections.summary.join(" "),
    experience: block(sections.experience),
    projects: block(sections.projects),
    skills: sections.skills,
    education: sections.education,
    certifications: sections.certifications,
    links,
    contact: {
      email,
      github: links.find((l) => /github\.com\//.test(l)) || "",
      linkedin: links.find((l) => /linkedin\.com\//.test(l)) || "",
      portfolio: links.find((l) => /is-a\.dev/.test(l)) || "",
    },
  });
}
const chunks: KnowledgeBase["chunks"] = [];
for (const resume of resumes)
  for (const section of Object.keys(headings)
    .map((k) => headings[k])
    .filter((s, i, a) => a.indexOf(s) === i)) {
    const body = Array.isArray(resume[section])
      ? resume[section].join("\n")
      : resume[section];
    const lines = body.split("\n");
    let text = "";
    const flush = () => {
      if (text.trim())
        chunks.push({
          id: `${resume.id}-${section}-${chunks.length}`,
          resumeId: resume.id,
          section,
          text: text.trim(),
          embedding: [],
        });
    };
    for (const line of lines) {
      if (text.length + line.length > 900 && text.length) {
        flush();
        text = text.split("\n").slice(-2).join("\n") + "\n";
      }
      text += line + "\n";
    }
    flush();
  }
let embedding: KnowledgeBase["embedding"] = {
  provider: "local-hash",
  model: "lexical-hash-v1",
  dimensions: 256,
};
if (process.env.OPENAI_API_KEY && !process.argv.includes("--offline")) {
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  const result = await embedMany({
    model: openai.embeddingModel(model),
    values: chunks.map((c) => c.text),
    maxRetries: 2,
  });
  result.embeddings.forEach((vector, i) => {
    chunks[i].embedding = vector;
  });
  embedding = {
    provider: "openai",
    model,
    dimensions: result.embeddings[0].length,
  };
} else
  chunks.forEach((c) => {
    c.embedding = localEmbedding(c.text);
  });
const knowledge: KnowledgeBase = { version: 1, embedding, resumes, chunks };
await mkdir("data/generated", { recursive: true });
for (const resume of resumes)
  await writeFile(
    `data/generated/${resume.id}.json`,
    JSON.stringify(resume, null, 2) + "\n",
  );
await writeFile(
  "data/generated/knowledge.json",
  JSON.stringify(knowledge) + "\n",
);
console.log(
  `Ingested ${resumes.length} sanitized résumés and ${chunks.length} chunks. Embeddings: ${embedding.provider}. Review generated JSON before committing.`,
);
