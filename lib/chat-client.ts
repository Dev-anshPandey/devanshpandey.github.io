import { z } from "zod";
import type { PortfolioMessage } from "./chat-types";
export const CHAT_STORAGE_KEY = "devansh-portfolio-chat:v2";
const storedMessage = z.object({
  id: z.string().max(100),
  role: z.enum(["user", "assistant"]),
  parts: z
    .array(z.object({ type: z.literal("text"), text: z.string().max(16000) }))
    .max(8),
  metadata: z
    .object({
      section: z
        .enum(["me", "projects", "skills", "fun", "contact"])
        .optional(),
      suggestions: z.array(z.string().max(160)).max(3).optional(),
      sources: z
        .array(
          z.object({
            id: z.enum(["software-mobile", "applied-ai", "forward-deployed"]),
            title: z.string().max(80),
          }),
        )
        .max(3)
        .optional(),
      mode: z.enum(["local", "model", "resume"]).optional(),
      interrupted: z.boolean().optional(),
    })
    .optional(),
});
export function readStoredChat(value: string | null): PortfolioMessage[] {
  if (!value || value.length > 300000) return [];
  try {
    const parsed = z.array(storedMessage).max(60).safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
export function boundedHistory(messages: PortfolioMessage[]) {
  const result = [];
  let remaining = 28000;
  for (const message of messages.slice(-20).reverse()) {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
    if (text.length > remaining) break;
    if (!text.trim()) continue;
    remaining -= text.length;
    result.unshift({
      id: message.id,
      role: message.role,
      parts: [{ type: "text" as const, text }],
    });
  }
  return result;
}
export class ChatRequestError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export async function resilientFetch(
  url: RequestInfo | URL,
  init?: RequestInit,
  feedback?: (seconds: number, limited: boolean) => void,
  fetcher: typeof fetch = fetch,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const signal = AbortSignal.any([
        ...(init?.signal ? [init.signal] : []),
        AbortSignal.timeout(30000),
      ]);
      const response = await fetcher(url, { ...init, signal });
      if (
        response.ok &&
        response.headers.get("content-type")?.includes("text/event-stream")
      )
        return response;
      let message = "I couldn’t read the response. Please try again.";
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (typeof body.error === "string") message = body.error;
      }
      const retryable =
        response.status === 429 || response.status >= 500 || response.ok;
      const seconds =
        response.status === 429
          ? Math.min(
              60,
              Math.max(1, Number(response.headers.get("retry-after")) || 60),
            )
          : 2 ** attempt;
      feedback?.(seconds, response.status === 429);
      if (!retryable || attempt === 2)
        throw new ChatRequestError(message, response.status);
      await response.body?.cancel().catch(() => {});
      await backoff(seconds * 1000, init?.signal);
    } catch (error) {
      if (init?.signal?.aborted) throw error;
      if (error instanceof ChatRequestError) throw error;
      if (attempt === 2)
        throw new ChatRequestError(
          "I couldn’t connect just now. Your message is saved—check your connection and try again.",
        );
      feedback?.(2 ** attempt, false);
      await backoff(2 ** attempt * 1000, init?.signal);
    }
  }
  throw new ChatRequestError("Please try that question again.");
}
function backoff(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    function abort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}
