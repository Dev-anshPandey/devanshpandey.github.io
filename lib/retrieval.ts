import raw from "../data/generated/knowledge.json";
import {
  cosine,
  localEmbedding,
  tokens,
  type KnowledgeBase,
} from "./knowledge-schema";
import { profile } from "../data/profile";
import { detectIntent, projectAliases, type PortfolioIntent } from "./intent";
export const knowledge = raw as KnowledgeBase;
const stop = new Set(
  "the a an i you your me my is are about tell what how do can and in of to have has did with more he his devansh pandey it that there this which was used use work worked done please on at for does explain".split(
    " ",
  ),
);
export const usefulTerms = (text: string) => [
  ...new Set(
    tokens(text)
      .map((t) => t.replace(/\.$/, ""))
      .filter((t) => !stop.has(t) && t.length > 1),
  ),
];
const companies = [
  ...new Set(
    knowledge.resumes
      .flatMap((r) =>
        r.experience.map((b) => b.split("\n")[1]?.replace(/\s*\(.*/, "")),
      )
      .filter(Boolean),
  ),
];
export const entities = [
  ...projectAliases.map((p) => ({
    name: p.title,
    aliases: p.aliases,
    section: "projects",
  })),
  ...companies.map((name) => ({
    name,
    aliases: [name.toLowerCase()],
    section: "experience",
  })),
  { name: "KIET", aliases: ["kiet"], section: "education" },
  ...profile.skills
    .concat(profile.learning)
    .map((name) => ({
      name,
      aliases: [name.toLowerCase()],
      section: "skills",
    })),
];
const includes = (text: string, alias: string) =>
  new RegExp(
    `(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`,
    "i",
  ).test(text);
export function matchedEntities(text: string) {
  return entities.filter((e) => e.aliases.some((a) => includes(text, a)));
}
export type HistoryItem = {
  role: string;
  parts: { type: string; text?: string }[];
};
export function constructRetrievalQuery(
  question: string,
  history: HistoryItem[] = [],
) {
  const intent = detectIntent(question);
  const explicit = matchedEntities(question);
  let contextEntity = "";
  const recent = history.slice(-6);
  const ordinal = question
    .match(/\b(first|second|third|fourth)\b/i)?.[1]
    ?.toLowerCase();
  if (
    ordinal &&
    recent.some((m) =>
      /projects|built/i.test(m.parts.map((p) => p.text || "").join(" ")),
    )
  )
    contextEntity =
      profile.projects[["first", "second", "third", "fourth"].indexOf(ordinal)]
        ?.title || "";
  else if (
    !explicit.some(
      (e) => e.section === "projects" || e.section === "experience",
    ) &&
    /\b(it|that|there|those|they|model|stack|architecture|continue|more|database)\b/i.test(
      question,
    )
  ) {
    for (const m of [...recent].reverse()) {
      const matches = matchedEntities(
        m.parts.map((p) => p.text || "").join(" "),
      ).filter((e) => e.section === "projects" || e.section === "experience");
      if (matches.length) {
        contextEntity = matches[0].name;
        break;
      }
    }
  }
  const categories: Partial<Record<PortfolioIntent["kind"], string>> = {
    about: "summary experience education skills",
    experience: "experience roles companies Exly UKG Dao Studio",
    education: "education KIET CGPA B.Tech",
    skills: "skills React Native Flutter Python TypeScript AI",
    projects: "projects Exly Creator Chronicle Kaash Mutual Network Vitals",
    "ai-experience": "RAG AI LLM creator-specific Creator App Chronicle",
    "mobile-experience": "React Native Flutter mobile iOS Android",
    contact: "contact email github linkedin",
    resume: "contact résumé resume",
  };
  return {
    query:
      `${question} ${contextEntity} ${categories[intent.kind] || ""}`.trim(),
    intent,
    contextEntity,
  };
}
export function searchChunks(query: string, vector?: number[]) {
  const expanded = query
    .replace(/\b(total\s+)?exp\b/gi, "experience")
    .replace(/\b(tech\s+stack|stack)\b/gi, "skills technologies")
    .replace(/\b(school|studied|study|academics|grade|marks|b\.?tech)\b/gi, "education KIET")
    .replace(/\b(jobs?|roles?|positions?|internships?|intern|employers?|companies|company|tenure)\b/gi, "$& experience")
    .replace(/experiencia|अनुभव/gi, "experience")
    .replace(/शिक्षा/gi, "education KIET")
    .replace(/proyectos|प्रोजेक्ट/gi, "projects")
    .replace(/कौशल|compétences/gi, "skills")
    .replace(/\b(companies|company|employers|employer)\b/gi, "$& experience");
  const terms = usefulTerms(expanded),
    qv = vector || localEmbedding(expanded);
  const matches = matchedEntities(expanded);
  const topic = matches.filter(
    (e) => e.section === "projects" || e.section === "experience",
  );
  const employerRoles =
    topic.some((e) => e.section === "experience") &&
    !topic.some((e) => e.section === "projects") &&
    /work|role|experience|job|position|responsibilit|compan|intern/i.test(
      expanded,
    ) &&
    !/project|creator|course|\bRAG\b|\bAI\b/i.test(expanded);
  const category = employerRoles
    ? "experience"
    : /\bsummary|background|profile|overview|bio\b/i.test(expanded)
      ? "summary"
      : /education|degree|cgpa|gpa|college|university|school|kiet/i.test(
            expanded,
          )
        ? "education"
        : /\bprojects?|apps?|applications?\b/i.test(expanded) && !topic.length
          ? "projects"
          : /\b(experience|companies|company|employers?|roles?|jobs?|internships?|intern|exp)\b/i.test(
                expanded,
              ) && !topic.some((e) => e.section === "projects")
            ? "experience"
            : /\b(skills?|stack|technologies|tools)\b/i.test(expanded)
              ? "skills"
              : "";
  return knowledge.chunks
    .map((chunk) => {
      const body = `${chunk.section} ${chunk.title || ""}\n${chunk.text}`;
      const lexical =
        terms.reduce((n, t) => n + (includes(body, t) ? 1 : 0), 0) /
        Math.max(terms.length, 1);
      const exact =
        matches.filter((e) => e.aliases.some((a) => includes(body, a))).length /
        Math.max(matches.length, 1);
      const focused =
        !topic.length ||
        topic.some((e) =>
          e.aliases.some((a) => includes(chunk.title || "", a)),
        );
      const sectionBoost =
        category === chunk.section?.toLowerCase()?.trim() ? 0.35 :
        category === "summary" && ["experience", "education"].includes(chunk.section) ? 0.25 : 0;
      const score =
        lexical * 0.5 +
        Math.max(0, cosine(qv, chunk.embedding)) * 0.15 +
        exact * 0.55 +
        sectionBoost +
        (topic.length && focused ? 0.35 : 0);
      return {
        ...chunk,
        title: chunk.title || chunk.section,
        score,
        lexical,
        focused,
      };
    })
    .filter(
      (c) =>
        (c.lexical > 0 || c.section === category) &&
        c.score >= 0.2 &&
        c.focused &&
        (!category || category !== "education" || c.section === "education") &&
        (!category || category !== "projects" || c.section === "projects") &&
        (!category || category !== "experience" || c.section === "experience"),
    )
    .sort((a, b) => b.score - a.score);
}
function overlap(a: string, b: string) {
  const sa = new Set(usefulTerms(a)),
    sb = new Set(usefulTerms(b));
  return (
    [...sa].filter((t) => sb.has(t)).length /
    Math.max(1, Math.min(sa.size, sb.size))
  );
}
function roleIdentity(title: string) {
  const company = title.match(/Exly|UKG|Dao Studio/i)?.[0]?.toLowerCase();
  const role = title.match(/Junior Software Engineer|Software Engineering Intern|Software Engineer Intern|Data Services Consultant I/i)?.[0]?.toLowerCase();
  return company && role ? `${company}:${role}` : "";
}
export async function retrieve(query: string, _signal?: AbortSignal) {
  const selected: ReturnType<typeof searchChunks> = [];
  let remaining = 10000;
  for (const chunk of searchChunks(query)) {
    if (/\bsummary\b/i.test(query) && chunk.section === "summary" && selected.some(c => c.section === "summary")) continue;
    if (chunk.section === "experience" && roleIdentity(chunk.title) && selected.some(c => c.section === "experience" && roleIdentity(c.title) === roleIdentity(chunk.title))) continue;
    if (
      selected.some(
        (c) =>
          c.section === chunk.section && overlap(c.text, chunk.text) > 0.78,
      )
    )
      continue;
    if (chunk.text.length > remaining) continue;
    selected.push(chunk);
    remaining -= chunk.text.length;
    if (selected.length === 6) break;
  }
  if (
    selected.length === 0 &&
    !/favorite|favourite|movie|hobby|hobbies|recipe|weather|bitcoin|finite\s+press/i.test(
      query,
    )
  ) {
    const baseline = [
      knowledge.chunks.find((c) => c.section === "summary"),
      ...knowledge.chunks.filter((c) => c.section === "experience"),
      knowledge.chunks.find((c) => c.section === "skills"),
      knowledge.chunks.find((c) => c.section === "education"),
    ].filter(Boolean) as ReturnType<typeof searchChunks>;

    for (const chunk of baseline) {
      if (
        chunk.section === "experience" &&
        roleIdentity(chunk.title) &&
        selected.some(
          (c) =>
            c.section === "experience" &&
            roleIdentity(c.title) === roleIdentity(chunk.title),
        )
      )
        continue;
      if (
        selected.some(
          (c) =>
            c.section === chunk.section && overlap(c.text, chunk.text) > 0.78,
        )
      )
        continue;
      if (chunk.text.length > remaining) continue;
      selected.push(chunk);
      remaining -= chunk.text.length;
      if ((selected as ReturnType<typeof searchChunks>).length >= 6) break;
    }
  }
  return selected;
}
