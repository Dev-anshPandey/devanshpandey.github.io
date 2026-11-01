import {
  predefinedCard,
  cardPlainText,
  unknownPortfolioAnswer,
  type ResponseCard,
} from "./portfolio-response";
import type { PortfolioIntent } from "./intent";
import { usefulTerms, type searchChunks } from "./retrieval";
export type AnswerMode =
  | "local"
  | "rag-model"
  | "predefined-fallback"
  | "retrieval-fallback"
  | "unknown-fallback";
export function buildRetrievalFallback(
  query: string,
  sources: ReturnType<typeof searchChunks>,
  intent: PortfolioIntent,
): { text: string; mode: AnswerMode; card?: ResponseCard } {
  if (intent.kind !== "general-portfolio" && intent.kind !== "unknown") {
    const card = predefinedCard(intent.kind, intent.projectId);
    return {
      text: cardPlainText(card),
      card,
      mode: intent.local ? "local" : "predefined-fallback",
    };
  }
  // A topic match alone does not establish an answer to a missing attribute.
  if (
    /favorite|favourite|movie|hobby|hobbies|salary|compensation/i.test(query) &&
    !sources.some((s) =>
      /favorite|favourite|movie|hobby|hobbies|salary|compensation/i.test(
        s.text,
      ),
    )
  )
    return { text: unknownPortfolioAnswer, mode: "unknown-fallback" };
  if (
    /\b(model|models)\b/i.test(query) &&
    !sources.some((s) =>
      /\b(gpt[- ]\d|claude[- ]\d|gemini[- ]\d|llama[- ]\d|model (name|used|was))\b/i.test(
        s.text,
      ),
    )
  )
    return {
      text: "My portfolio describes the LLM workflow, but it doesn't specify the model used for that project. You can reach me through Contact for that detail.",
      mode: "unknown-fallback",
    };
  const terms = usefulTerms(query);
  const passages = sources
    .flatMap((s) =>
      s.text
        .split(/\n•\s*/)
        .slice(1)
        .map((text) => ({
          text: text.replace(/\s+/g, " ").trim(),
          title: s.title,
          score: terms.reduce(
            (n, t) => n + (text.toLowerCase().includes(t) ? 1 : 0),
            0,
          ),
        })),
    )
    .sort((a, b) => b.score - a.score);
  const chosen: typeof passages = [];
  for (const p of passages)
    if (!chosen.some((x) => x.text === p.text) && p.text.length < 650) {
      chosen.push(p);
      if (chosen.length === 3) break;
    }
  if (chosen.length)
    return {
      text: `From my portfolio (${sources[0].title}):\n\n${chosen.map((p) => `- ${p.text}`).join("\n")}`,
      mode: "retrieval-fallback",
    };
  if (sources.length && sources[0].text.length < 900)
    return {
      text: sources[0].text.replace(/\n/g, " "),
      mode: "retrieval-fallback",
    };
  return { text: unknownPortfolioAnswer, mode: "unknown-fallback" };
}
