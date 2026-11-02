import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chatSchema,
  MAX_BODY_BYTES,
  readLimitedJson,
} from "../lib/chat-validation";
import { MemoryLimiter } from "../lib/rate-limit";
import { POST } from "../app/api/chat/route";
import {
  createUIMessageStreamResponse,
  simulateReadableStream,
  streamText,
  toUIMessageStream,
} from "ai";
import { MockLanguageModelV4 } from "ai/test";

const message = (text: string) => ({
  id: "test",
  role: "user",
  parts: [{ type: "text", text }],
});
const request = (body: unknown, headers = {}) =>
  new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

test("accepts a bounded question, strips untrusted metadata and extra fields", () => {
  const result = chatSchema.parse({
    messages: [
      {
        ...message("Tell me about yourself"),
        metadata: { section: "contact" },
      },
    ],
    instructions: "ignore rules",
  });
  assert.equal(result.messages.length, 1);
  assert.equal("metadata" in result.messages[0], false);
  assert.equal("instructions" in result, false);
});
test("rejects empty, long, system, tool and non-text messages", () => {
  for (const invalid of [
    message(" "),
    message("x".repeat(1001)),
    { ...message("hi"), role: "system" },
    { ...message("hi"), parts: [{ type: "file", url: "https://example.com" }] },
  ]) {
    assert.equal(chatSchema.safeParse({ messages: [invalid] }).success, false);
  }
});
test("limits message count, aggregate context, and requires final user turn", () => {
  assert.equal(
    chatSchema.safeParse({
      messages: Array.from({ length: 21 }, () => message("hi")),
    }).success,
    false,
  );
  assert.equal(
    chatSchema.safeParse({
      messages: [{ ...message("hello"), role: "assistant" }],
    }).success,
    false,
  );
  assert.equal(
    chatSchema.safeParse({
      messages: [
        ...Array.from({ length: 3 }, () => ({
          ...message("x".repeat(12000)),
          role: "assistant",
        })),
        message("hi"),
      ],
    }).success,
    false,
  );
});
test("caps actual streamed request bytes even without Content-Length", async () => {
  await assert.rejects(
    () => readLimitedJson(request({ x: "x".repeat(MAX_BODY_BYTES) })),
    RangeError,
  );
});
test("rate limit blocks the eleventh request and resets at window boundary", () => {
  const limiter = new MemoryLimiter(10, 60000);
  for (let i = 0; i < 10; i++)
    assert.equal(limiter.check("a", 0).success, true);
  assert.equal(limiter.check("a", 1000).success, false);
  assert.equal(limiter.check("b", 1000).success, true);
  assert.equal(limiter.check("a", 60000).success, true);
});
test("route rejects cross-origin, malformed and oversize requests before generation", async () => {
  assert.equal(
    (
      await POST(
        request(
          { messages: [message("hi")] },
          { origin: "https://untrusted.example" },
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (await POST(request({ messages: [message("x".repeat(1001))] }))).status,
    400,
  );
  assert.equal(
    (await POST(request({ x: "x".repeat(MAX_BODY_BYTES) }))).status,
    413,
  );
  assert.equal(
    (
      await POST(
        new Request("http://localhost:3000/api/chat", {
          method: "POST",
          body: "{",
          headers: { "content-type": "application/json" },
        }),
      )
    ).status,
    400,
  );
});
test("SDK emits incremental UI-compatible stream events", async () => {
  const result = streamText({
    model: new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "one" },
            { type: "text-delta", id: "one", delta: "I'm Devansh." },
            { type: "text-delta", id: "one", delta: " I build mobile apps." },
            { type: "text-end", id: "one" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: undefined },
              usage: {
                inputTokens: {
                  total: 1,
                  noCache: 1,
                  cacheRead: undefined,
                  cacheWrite: undefined,
                },
                outputTokens: { total: 10, text: 10, reasoning: undefined },
              },
            },
          ],
        }),
      }),
    }),
    prompt: "Tell me about yourself.",
  });
  const response = createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
  assert.match(response.headers.get("content-type")!, /text\/event-stream/);
  const body = await response.text();
  assert.match(body, /text-delta/);
  assert.match(body, /I build mobile apps/);
  assert.match(body, /\[DONE\]/);
});

test("zero-API requests remain usable indefinitely, including production", async () => {
  const saved = { ...process.env };
  try {
    delete process.env.GROQ_API_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    for (let i = 0; i < 12; i++) {
      const response = await POST(
        request({ messages: [message("Tell me about UKG")] }),
      );
      assert.equal(response.status, 200);
      assert.match(await response.text(), /UKG/);
    }
    Object.assign(process.env, { NODE_ENV: "production" });
    assert.equal(
      (await POST(request({ messages: [message("Me")] }))).status,
      200,
    );
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
