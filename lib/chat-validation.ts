import { z } from "zod";
import { MAX_INPUT, MAX_BODY_BYTES } from "./chat-config";
export { MAX_INPUT, MAX_BODY_BYTES } from "./chat-config";
const messageSchema = z.object({
  id: z.string().min(1).max(100),
  role: z.enum(["user", "assistant"]),
  parts: z
    .array(z.object({ type: z.literal("text"), text: z.string().max(12000) }))
    .min(1)
    .max(8),
});
export const chatSchema = z
  .object({ messages: z.array(messageSchema).min(1).max(20) })
  .superRefine(({ messages }, ctx) => {
    let total = 0;
    for (const message of messages) {
      const text = message.parts.map((p) => p.text).join("");
      total += text.length;
      if (
        message.role === "user" &&
        (!text.trim() || text.length > MAX_INPUT)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Questions must be between 1 and 1,000 characters.",
        });
      }
    }
    if (total > 32000 || messages.at(-1)?.role !== "user") {
      ctx.addIssue({
        code: "custom",
        message: "Invalid conversation history.",
      });
    }
  });

export async function readLimitedJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    throw new RangeError("Request too large");
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing request body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError("Request too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
