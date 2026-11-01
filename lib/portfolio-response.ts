import { allProjects } from "../data/portfolio-supplement";
import { z } from "zod";
import { profile, sectionSummary } from "../data/profile";
import mobile from "../data/generated/software-mobile.json";

export const cardKinds = [
  "about",
  "experience",
  "education",
  "skills",
  "projects",
  "project-detail",
  "contact",
  "resume",
  "ai-experience",
  "mobile-experience",
] as const;
export type CardKind = (typeof cardKinds)[number];
// Model-controlled text only. URLs, titles, dates, icons and layout remain canonical.
export const cardTextSchema = z
  .object({
    intro: z.string().trim().min(1).max(900),
    experienceSummary: z.string().max(500),
    projectSummaries: z
      .array(
        z
          .object({
            id: z.string().max(80),
            description: z.string().trim().min(1).max(600),
          })
          .strict(),
      )
      .max(4),
  })
  .strict();
export type CardText = z.infer<typeof cardTextSchema>;
export const responseCardSchema = z.object({
  kind: z.enum(cardKinds),
  projectId: z.string().max(80).optional(),
  content: cardTextSchema,
});
export type ResponseCard = z.infer<typeof responseCardSchema>;
export const experienceFacts = mobile.experience.map((block) => {
  const [role, company, ...lines] = block.split("\n");
  return {
    role,
    company,
    description: lines
      .join(" ")
      .replace(/•\s*/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  };
});
export const unknownPortfolioAnswer =
  "I don't have that information in my portfolio. You can ask me about my experience, projects, skills, education, or contact details.";
export function predefinedCard(
  kind: CardKind,
  projectId?: string,
): ResponseCard {
  const project = allProjects.find((p) => p.id === projectId);
  const intros: Record<CardKind, string> = {
    about: sectionSummary("me"),
    experience:
      "My professional experience spans production mobile applications, AI integrations, and data automation at Exly, UKG, and Dao Studio.",
    education: `I earned my ${profile.education.degree} at ${profile.education.institution}, with a CGPA of ${profile.education.cgpa}.`,
    skills:
      "I build production mobile applications and grounded AI experiences.",
    projects: "Here are the projects I've worked on.",
    "project-detail": project?.description || unknownPortfolioAnswer,
    contact: sectionSummary("contact"),
    resume: sectionSummary("contact"),
    "ai-experience":
      "At Exly, I integrated OpenAI and Anthropic LLM APIs into production workflows and contributed to creator-specific RAG assistants. My Chronicle project uses retrieval, grounding, summarization, and structured generation for personalized news editions.",
    "mobile-experience":
      "I built and shipped production React Native and Flutter features at Exly, including real-time chat, video calling, notifications, deep links, and release workflows. My mobile projects include Kaash and Mutual Network.",
  };
  return {
    kind,
    ...(projectId ? { projectId } : {}),
    content: {
      intro: intros[kind],
      experienceSummary: profile.experience,
      projectSummaries: (kind === "project-detail" ? allProjects : profile.projects)
        .filter((p) => kind !== "project-detail" || p.id === projectId)
        .map((p) => ({ id: p.id, description: p.description })),
    },
  };
}
export function validateCardText(value: unknown, card: ResponseCard): CardText {
  const parsed = cardTextSchema.parse(value);
  const expected =
    card.kind === "projects"
      ? profile.projects.map((p) => p.id)
      : card.kind === "project-detail"
        ? [card.projectId!]
        : [];
  if (
    expected.length &&
    (parsed.projectSummaries.length !== expected.length ||
      new Set(parsed.projectSummaries.map((p) => p.id)).size !==
        expected.length ||
      parsed.projectSummaries.some((p) => !expected.includes(p.id)))
  )
    throw new Error("Invalid project content");
  if (
    /<[^>]+>|```/.test(
      parsed.intro +
        parsed.experienceSummary +
        parsed.projectSummaries.map((p) => p.description).join(" "),
    )
  )
    throw new Error("Presentation content rejected");
  return parsed;
}
export function cardPlainText(card: ResponseCard) {
  if (card.kind === "projects" || card.kind === "project-detail")
    return card.content.projectSummaries
      .map(
        (p) =>
          `${allProjects.find((item) => item.id === p.id)?.title}: ${p.description}`,
      )
      .join("\n\n");
  return card.content.intro;
}
