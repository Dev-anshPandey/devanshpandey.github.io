import type { UIMessage } from "ai";
import type { Section } from "../data/profile";
import type { ResponseCard } from "./portfolio-response";
import type { AnswerMode } from "./fallback-response";
export type ChatMetadata = {
  card?: ResponseCard;
  section?: Section;
  suggestions?: string[];
  sources?: { id: string; title: string }[];
  mode?: AnswerMode | "model" | "resume";
  interrupted?: boolean;
};
export type PortfolioMessage = UIMessage<ChatMetadata>;
