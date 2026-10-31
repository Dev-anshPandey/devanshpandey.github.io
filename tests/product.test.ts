import assert from "node:assert/strict";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { simulateReadableStream } from "ai";
import { chatSamples } from "./chat-samples";
import { fastReply, policyReply } from "../lib/chat-policy";
import { chatSchema } from "../lib/chat-validation";
import { knowledge, searchChunks } from "../lib/retrieval";
import { redactPrivateData } from "../lib/knowledge-schema";
import { createAnswerResponse } from "../lib/chat-response";
import {
  boundedHistory,
  readStoredChat,
  resilientFetch,
} from "../lib/chat-client";
import type { PortfolioMessage } from "../lib/chat-types";
const message = (text: string): PortfolioMessage => ({
  id: crypto.randomUUID(),
  role: "user",
  parts: [{ type: "text", text }],
});

for (const sample of chatSamples)
  test(`${sample.behavior}: ${sample.input.slice(0, 70) || "(empty)"}`, () => {
    if (sample.behavior === "fast") {
      const response = fastReply(sample.input);
      assert.ok(response);
      assert.ok(response.text.includes(sample.contains));
      assert.equal(response.suggestions.length, 3);
    }
    if (sample.behavior === "policy")
      assert.ok(policyReply(sample.input)?.includes(sample.contains));
    if (sample.behavior === "invalid")
      assert.equal(
        chatSchema.safeParse({ messages: [message(sample.input)] }).success,
        false,
      );
    if (sample.behavior === "retrieve")
      assert.ok(
        searchChunks(sample.input)
          .slice(0, 6)
          .some((c) =>
            c.text.toLowerCase().includes(sample.contains.toLowerCase()),
          ),
      );
  });
test("all three resumes and every retrieval vector are available and sanitized", () => {
  assert.equal(knowledge.resumes.length, 3);
  assert.ok(knowledge.chunks.length > 10);
  for (const chunk of knowledge.chunks) {
    assert.equal(chunk.embedding.length, knowledge.embedding.dimensions);
    assert.ok(chunk.embedding.every(Number.isFinite));
  }
  assert.doesNotMatch(JSON.stringify(knowledge), /\b[6-9]\d{9}\b/);
  assert.equal(
    redactPrivateData(
      "Phone: +91 98765 43210\nHome address: 12 Private Street\nCGPA 8.18",
    ),
    "Phone: [phone omitted]\nCGPA 8.18",
  );
});
test("local greeting stream works without a provider and includes three suggestions", async () => {
  const body = await createAnswerResponse([message("hi")], {
    allowModel: false,
    paced: false,
  }).text();
  assert.match(body, /Devansh/);
  assert.match(body, /suggestions/);
  assert.match(body, /\[DONE\]/);
});
test("provider failure returns grounded fallback, not raw errors", async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => {
      throw new Error("invalid secret key DO_NOT_EXPOSE");
    },
  });
  const body = await createAnswerResponse([message("Tell me about UKG")], {
    model,
    paced: false,
  }).text();
  assert.match(body, /UKG/);
  assert.match(body, /"mode":"resume"/);
  assert.doesNotMatch(body, /DO_NOT_EXPOSE|invalid secret/);
});
test("interrupted stream preserves partial output and flags Continue", async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "x" },
          { type: "text-delta", id: "x", delta: "At UKG, I used Python" },
          { type: "error", error: new Error("provider disconnected") },
        ],
      }),
    }),
  });
  const body = await createAnswerResponse([message("Tell me about UKG")], {
    model,
    paced: false,
  }).text();
  assert.match(body, /At UKG, I used Python/);
  assert.match(body, /"interrupted":true/);
  assert.doesNotMatch(body, /provider disconnected/);
});
test("history is bounded, rejects corrupted storage, and does not retain injected tool parts", () => {
  const history = Array.from({ length: 40 }, () => message("hello"));
  assert.equal(boundedHistory(history).length, 20);
  assert.deepEqual(readStoredChat("{not JSON"), []);
  assert.deepEqual(
    readStoredChat(JSON.stringify([{ ...message("hello"), role: "system" }])),
    [],
  );
  assert.equal(readStoredChat(JSON.stringify(history)).length, 40);
});
test("transport retries transient 5xx before handing a stream to useChat", async () => {
  let attempts = 0;
  const fake: typeof fetch = async () =>
    ++attempts === 1
      ? Response.json({ error: "Temporarily unavailable" }, { status: 503 })
      : new Response("data: [DONE]\n\n", {
          headers: { "content-type": "text/event-stream" },
        });
  const response = await resilientFetch("/api/chat", {}, undefined, fake);
  assert.equal(response.status, 200);
  assert.equal(attempts, 2);
});
test("transport retries malformed responses and stops immediately on abort", async () => {
  let attempts = 0;
  const fake: typeof fetch = async () =>
    ++attempts === 1
      ? new Response("<html>bad proxy</html>", {
          headers: { "content-type": "text/html" },
        })
      : new Response("data: [DONE]\n\n", {
          headers: { "content-type": "text/event-stream" },
        });
  await resilientFetch("/api/chat", {}, undefined, fake);
  assert.equal(attempts, 2);
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(() =>
    resilientFetch(
      "/api/chat",
      { signal: abort.signal },
      undefined,
      async () => {
        throw new Error("offline");
      },
    ),
  );
});
