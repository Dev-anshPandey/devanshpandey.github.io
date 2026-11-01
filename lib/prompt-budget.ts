import type { ModelMessage } from "ai";
import type { PortfolioMessage } from "./chat-types";
// Conservative budgeting estimate (not a tokenizer); non-ASCII gets extra weight.
export function estimateTokens(text: string) {
  return Math.ceil(
    [...text].reduce((n, c) => n + (c.charCodeAt(0) > 127 ? 1 : 1 / 3), 0),
  );
}
export function trimToTokens(text: string, max: number) {
  let used = 0,
    out = "";
  for (const c of text) {
    used += c.charCodeAt(0) > 127 ? 1 : 1 / 3;
    if (used > max) break;
    out += c;
  }
  return out;
}
export function modelHistory(messages: PortfolioMessage[]): ModelMessage[] {
  const prior: ModelMessage[] = [];
  let remaining = 800;
  for (const message of messages.slice(0, -1).slice(-6).reverse()) {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
    const limited = trimToTokens(text, Math.min(remaining, 350));
    if (!limited) continue;
    prior.unshift({
      role: message.role === "user" ? "user" : "assistant",
      content: limited,
    });
    remaining -= estimateTokens(limited);
    if (remaining <= 0) break;
  }
  const last = messages.at(-1)!;
  return [
    ...prior,
    {
      role: "user",
      content: trimToTokens(
        last.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join(""),
        1000,
      ),
    },
  ];
}
