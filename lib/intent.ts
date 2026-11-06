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
    /\b(contact|email|github|linkedin|reach you|reach devansh|phone|connect|संपर्क)\b/i.test(
      q,
    )
  )
    return { kind: "contact", local: true };
  if (/\b(resume|résumé|cv|download resume)\b/i.test(q))
    return { kind: "resume", local: true };
  if (
    /^(me|about|about me|bio|profile|background|overview|who are you|who is devansh|why should i hire you)$/i.test(
      q,
    ) ||
    /\b(about (me|devansh|yourself|you)|introduce yourself|tell me about (yourself|devansh|you))\b/i.test(
      q,
    ) ||
    /\b(your |devansh['’]s )?(background|bio|profile overview)\b/i.test(q)
  )
    return { kind: "about", local: false };
  if (
    /\b(education|degree|cgpa|gpa|college|university|school|academics|study|studied|btech|b\.tech|kiet|grade|marks)\b|शिक्षा/i.test(
      q,
    )
  )
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
    /\b(ai|genai|generative ai|rag|llm|llms|embeddings?|langchain|openai|anthropic|vector)\b/i.test(
      q,
    ) &&
    /experience|work|built|done|tools|projects?/i.test(q) &&
    !/exly|ukg|dao|chronicle/.test(q)
  )
    return { kind: "ai-experience", local: false };
  if (
    /\b(mobile|react native|flutter|ios|android)\b/i.test(q) &&
    /experience|development|work|done|built|shipped/i.test(q) &&
    !/exly|ukg|dao|chronicle/.test(q)
  )
    return { kind: "mobile-experience", local: false };
  if (
    !project &&
    /\b(projects?|built|building|portfolio|apps?|applications?)\b|प्रोजेक्ट/i.test(
      q,
    ) &&
    !/exly|ukg|dao|\b(ai|mobile|flutter|react native)\b/.test(q)
  )
    return { kind: "projects", local: false };
  if (
    /\b(skills?|toolkit|stack|tech stack|technologies|tools|languages|frameworks|what do you know|what can you use)\b|कौशल|compétences/i.test(
      q,
    )
  )
    return { kind: "skills", local: false };
  if (
    /^(experience|work experience|professional experience|career|अनुभव)$/i.test(q) ||
    /\b(tell me about (your |devansh['’]s )?experience|overview of (your |devansh['’]s )?experience)\b|अपने अनुभव के बारे में/i.test(
      q,
    )
  )
    return { kind: "experience", local: false };
  return { kind: "general-portfolio", local: false };
}
