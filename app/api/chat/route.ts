import { chatSchema, readLimitedJson } from "@/lib/chat-validation";
import { rateLimit } from "@/lib/rate-limit";
import { createAnswerResponse } from "@/lib/chat-response";
import { fastReply, policyReply } from "@/lib/chat-policy";
export const runtime = "nodejs";
export const maxDuration = 30;
const failure = (
  message: string,
  status: number,
  headers: Record<string, string> = {},
) =>
  Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
export async function POST(request: Request) {
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }
  if (process.env.SITE_URL) {
    try {
      allowed.add(new URL(process.env.SITE_URL).origin);
    } catch {
      console.warn("[portfolio owner] SITE_URL must be a valid origin.");
    }
  }
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  const origin = request.headers.get("origin");
  if (origin && !allowed.has(origin))
    return failure("Please send this question from my portfolio page.", 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return failure("Please send a text question through the chat.", 415);
  let parsed;
  try {
    parsed = chatSchema.safeParse(await readLimitedJson(request));
  } catch (error) {
    return failure(
      error instanceof RangeError
        ? "That message is too large. Please send a shorter question."
        : "I couldn’t read that message. Please try typing it again.",
      error instanceof RangeError ? 413 : 400,
    );
  }
  if (!parsed.success)
    return failure(
      "Please send a question between 1 and 1,000 characters. Clear the chat if its history is too long.",
      400,
    );
  const messages = parsed.data.messages.map((m) => ({
    ...m,
    parts: m.parts.map((p) => ({
      ...p,
      text: p.text.replace(
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
        "",
      ),
    })),
  }));
  const question = messages
    .at(-1)!
    .parts.map((p) => p.text)
    .join("");
  // Cheap, deterministic small talk does not need a provider key or paid quota.
  if (fastReply(question) || policyReply(question))
    return createAnswerResponse(messages, {
      signal: request.signal,
      allowModel: false,
    });
  let allowModel = true;
  try {
    const result = await rateLimit(request);
    if (!result.success) {
      const seconds = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      );
      return failure(
        `I’m getting a lot of questions. Please try again in ${seconds} seconds.`,
        429,
        { "Retry-After": String(seconds) },
      );
    }
  } catch {
    allowModel = false;
    console.warn(
      "[portfolio owner] Shared rate limiting is unavailable. Paid generation is disabled; résumé-only fallback remains available.",
    );
  }
  return createAnswerResponse(messages, { signal: request.signal, allowModel });
}
