import { supplementalProjects } from "../data/portfolio-supplement";
import {
  localEmbedding,
  type KnowledgeBase,
  type ResumeData,
  type ResumeSection,
} from "./knowledge-schema";
/** Preserve role/project boundaries. Short education/skill records stay whole;
 * long clusters split at bullet boundaries around 250–600 English tokens. */
export function buildKnowledge(resumes: ResumeData[]): KnowledgeBase {
  const chunks: KnowledgeBase["chunks"] = [];
  const add = (
    resume: ResumeData,
    section: ResumeSection,
    title: string,
    body: string,
  ) => {
    const units = body.split(/\n(?=•)/);
    let text = "";
    const flush = () => {
      if (text.trim())
        chunks.push({
          id: `${resume.id}-${section}-${chunks.length}`,
          resumeId: resume.id,
          section,
          title,
          text: text.trim(),
          embedding: localEmbedding(`${title}\n${text}`),
        });
      text = "";
    };
    for (const unit of units) {
      if (text.length + unit.length > 2200 && text) flush();
      if (unit.length > 2400) {
        for (const sentence of unit.match(/[^.!?]+[.!?]?/g) || [unit]) {
          if (text.length + sentence.length > 2200 && text) flush();
          text += sentence + " ";
        }
      } else text += unit + "\n";
    }
    flush();
  };
  for (const resume of resumes) {
    add(resume, "summary", "About Devansh", resume.summary);
    for (const block of resume.experience)
      add(
        resume,
        "experience",
        block.split("\n").slice(0, 2).join(" — "),
        block,
      );
    // PDF extraction can separate a project's heading from its bullet block.
    let project = "";
    for (const block of resume.projects) {
      if (/^[^\n•]+(?:20\d\d)/.test(block)) {
        if (project) add(resume, "projects", project.split("\n")[0], project);
        project = block;
      } else project += "\n" + block;
    }
    if (project) add(resume, "projects", project.split("\n")[0], project);
    for (const section of ["skills", "education", "certifications"] as const)
      add(resume, section, section, resume[section].join("\n"));
    add(
      resume,
      "contact",
      "Public contact and résumé",
      `${resume.label} résumé. Email: ${resume.contact.email}. GitHub: ${resume.contact.github}. LinkedIn: ${resume.contact.linkedin}. Download: /api/resume/${resume.id}`,
    );
  }
  for (const project of supplementalProjects) {
    const text = `${project.title} — ${project.category}\n${project.description}\nTechnologies: Flutter, Dart, device sensors, local caching, charts.\nProject: ${project.url}`;
    chunks.push({ id: `portfolio-${project.id}`, resumeId: "portfolio", section: "projects", title: project.title, text, embedding: localEmbedding(`${project.title}\n${text}`) });
  }
  return {
    version: 1,
    embedding: {
      provider: "local-hash",
      model: "lexical-hash-v1",
      dimensions: 256,
    },
    resumes,
    chunks,
  };
}
