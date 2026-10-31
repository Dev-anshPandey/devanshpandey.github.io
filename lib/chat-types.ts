import type { UIMessage } from "ai";
import type { Section } from "../data/profile";
export type ChatMetadata = {
  section?: Section;
  suggestions?: string[];
  sources?: { id: string; title: string }[];
  mode?: "local" | "model" | "resume";
  interrupted?: boolean;
};
export type PortfolioMessage = UIMessage<ChatMetadata>;
