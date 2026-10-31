import raw from "../data/generated/knowledge.json";
import {
  cosine,
  localEmbedding,
  tokens,
  type KnowledgeBase,
} from "./knowledge-schema";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
export const knowledge = raw as KnowledgeBase;
const stop = new Set([
  "the",
  "a",
  "an",
  "i",
  "you",
  "your",
  "me",
  "my",
  "is",
  "are",
  "about",
  "tell",
  "what",
  "how",
  "do",
  "can",
  "and",
  "in",
  "of",
  "to",
  "have",
  "has",
  "did",
  "with",
  "more",
]);
export function searchChunks(query: string, vector?: number[]) {
  const expanded = query
    .replace(/experience|experiencia|अनुभव/gi, "experience Exly UKG Dao")
    .replace(/education|degree|शिक्षा/gi, "education KIET CGPA")
    .replace(/proyectos|प्रोजेक्ट/gi, "projects")
    .replace(/कौशल|compétences/gi, "skills");
  const terms = [
    ...new Set(tokens(expanded).filter((t) => !stop.has(t) && t.length > 1)),
  ];
  const queryVector = vector || localEmbedding(expanded);
  return knowledge.chunks
    .map((chunk) => {
      const body = chunk.text.toLowerCase();
      const lexical =
        terms.reduce(
          (score, term) => score + (body.includes(term) ? 1 : 0),
          0,
        ) / Math.max(terms.length, 1);
      const semantic =
        vector || knowledge.embedding.provider === "local-hash"
          ? cosine(queryVector, chunk.embedding)
          : 0;
      const sectionBonus = expanded.toLowerCase().includes(chunk.section)
        ? 0.2
        : 0;
      return {
        ...chunk,
        score: lexical * 0.8 + semantic * 0.2 + sectionBonus,
        lexical,
      };
    })
    .filter((chunk) => chunk.lexical > 0 || (vector && chunk.score > 0.08))
    .sort((a, b) => b.score - a.score);
}
export async function retrieve(query: string, signal?: AbortSignal) {
  let vector: number[] | undefined;
  if (knowledge.embedding.provider === "openai" && process.env.OPENAI_API_KEY) {
    try {
      vector = (
        await embed({
          model: openai.embeddingModel(knowledge.embedding.model),
          value: query,
          maxRetries: 0,
          abortSignal: signal,
        })
      ).embedding;
    } catch {
      console.warn(
        "[portfolio] Query embedding unavailable; using lexical retrieval.",
      );
    }
  }
  const seen = new Set<string>();
  return searchChunks(query, vector)
    .filter((chunk) => {
      const key = chunk.text.replace(/\s+/g, "").slice(0, 140);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}
