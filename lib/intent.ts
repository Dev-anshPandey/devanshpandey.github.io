import { allProjects } from "../data/portfolio-supplement";
import type { CardKind } from "./portfolio-response";
export type PortfolioIntent = {
  kind: CardKind | "general-portfolio" | "unknown";
  projectId?: string;
  local: boolean;
};
export const projectAliases = allProjects.map((p) => ({
  id: p.id,
  title: p.title,
  aliases: [
    p.title.toLowerCase(),
    ...(p.id === "creator-ai"
      ? ["creator assistant", "creator-specific", "creator app"]
      : []),
    ...(p.id === "chronicle" ? ["the chronicle"] : []),
  ],
}));
export function detectIntent(query: string): PortfolioIntent {
  const q = query
    .toLowerCase()
    .trim()
    .replace(/[?.!]+$/, "");
  if (
    /\b(contact|email|github|linkedin|reach you|reach devansh|संपर्क)\b/i.test(
      q,
    )
  )
    return { kind: "contact", local: true };
  if (/\b(resume|résumé|cv)\b/i.test(q)) return { kind: "resume", local: true };
  if (
    /^(me|about|about me|tell me about (yourself|devansh)( pandey)?|introduce yourself|who is devansh( pandey)?)$/.test(
      q,
    )
  )
    return { kind: "about", local: false };
  if (/education|degree|cgpa|college|university|शिक्षा/i.test(q))
    return { kind: "education", local: false };
  const project = projectAliases.find((p) =>
    p.aliases.some((a) => q.includes(a)),
  );
  if (
    project &&
    !/\b(model|which|how|why|database|hosting|cost|metric|users|latency|architecture|stack|technology|technologies)\b/.test(
      q,
    )
  )
    return { kind: "project-detail", projectId: project.id, local: false };
  if (
    !project &&
    /\b(projects|built|building)\b|प्रोजेक्ट/.test(q) &&
    !/exly|ukg|dao|\b(ai|mobile|flutter|react native)\b/.test(q)
  )
    return { kind: "projects", local: false };
  if (/\b(skills|toolkit|technologies do you know)\b|कौशल|compétences/.test(q))
    return { kind: "skills", local: false };
  if (
    /\b(ai|genai|generative ai|rag|llm)\b/.test(q) &&
    /experience|work have|work you|have you done|tools have/.test(q) &&
    !/exly|ukg|dao|chronicle/.test(q)
  )
    return { kind: "ai-experience", local: false };
  if (
    /\b(mobile|react native|flutter)\b/.test(q) &&
    /experience|development|work have|have you done/.test(q) &&
    !/exly|ukg|dao|chronicle/.test(q)
  )
    return { kind: "mobile-experience", local: false };
  if (
    /experience|work history|employment|career|experiencia|अनुभव/.test(q) &&
    !/exly|ukg|dao|chronicle|kaash/.test(q)
  )
    return { kind: "experience", local: false };
  return { kind: "general-portfolio", local: false };
}
