import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MockLanguageModelV4 } from "ai/test";
import { simulateReadableStream } from "ai";
import { ProfileCard } from "../components/profile-card";
import { createAnswerResponse } from "../lib/chat-response";
import {
  createPortfolioModel,
  DEFAULT_GROQ_MODEL,
  resetProviderCooldown,
  providerReady,
  retryAfterMs,
  MAX_OUTPUT_TOKENS,
} from "../lib/groq";
import { constructRetrievalQuery, retrieve } from "../lib/retrieval";
import { predefinedCard, cardKinds } from "../lib/portfolio-response";
import { estimateTokens, modelHistory } from "../lib/prompt-budget";
import { buildSystemPrompt } from "../lib/system-prompt";
import { MemoryLimiter } from "../lib/rate-limit";
import { POST } from "../app/api/chat/route";
import type { PortfolioMessage, ChatMetadata } from "../lib/chat-types";
const msg = (
  text: string,
  role: "user" | "assistant" = "user",
): PortfolioMessage => ({
  id: crypto.randomUUID(),
  role,
  parts: [{ type: "text", text }],
});
async function answer(
  query: string,
  options: Parameters<typeof createAnswerResponse>[1] = {},
  history: PortfolioMessage[] = [],
) {
  const body = await createAnswerResponse([...history, msg(query)], {
    ...options,
    paced: false,
  }).text();
  const events = body
    .split("\n")
    .filter((l) => l.startsWith("data: {"))
    .map((l) => JSON.parse(l.slice(6)));
  return {
    text: events
      .filter((e) => e.type === "text-delta")
      .map((e) => e.delta)
      .join(""),
    metadata: events.find((e) => e.type === "finish")
      ?.messageMetadata as ChatMetadata,
    body,
  };
}
function wire(content: string) {
  return Response.json({
    id: "test",
    object: "chat.completion",
    created: 0,
    model: DEFAULT_GROQ_MODEL,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  });
}
const never = new MockLanguageModelV4({
  doGenerate: async () => {
    assert.fail("Provider must not run");
  },
  doStream: async () => {
    assert.fail("Provider must not run");
  },
});
for (const query of [
  "hi",
  "thanks",
  "contact",
  "download resume",
  "GitHub",
  "LinkedIn",
])
  test(`limit reached: ${query} uses general local answer`, async () => {
    const a = await answer(query, { allowModel: false, model: never });
    assert.ok(a.text);
    assert.equal(a.metadata.mode, "local");
  });
for (const [query, kind] of [
  ["Me", "about"],
  ["Projects", "projects"],
  ["Education", "education"],
  ["Tell me about your experience", "experience"],
  ["Skills", "skills"],
  ["Contact", "contact"],
  ["Resume", "resume"],
  ["Tell me about The Chronicle", "project-detail"],
  ["Tell me about Vitals", "project-detail"],
  ["What AI work have you done?", "ai-experience"],
  ["What mobile development have you done?", "mobile-experience"],
] as const) {
  test(`zero-API ${query} renders the same structured card`, async () => {
    const a = await answer(query, { allowModel: false });
    assert.equal(a.metadata.card?.kind, kind);
    assert.ok(a.text.length > 20);
    const html = renderToStaticMarkup(<ProfileCard card={a.metadata.card} />);
    assert.match(html, /rich-card/);
    assert.match(html, /<h2>/);
    if (kind === "education" || kind === "about") assert.match(html, /8.18/);
    if (kind === "projects")
      assert.match(html, /Exly Creator App[\s\S]*Chronicle[\s\S]*Kaash[\s\S]*Mutual Network/);
  });
}
for (const query of ["Me", "Projects", "Tell me about your experience"])
  test(`generated ${query} uses relevant sources and validated card content`, async () => {
    let calls = 0;
    const expected = constructRetrievalQuery(query).intent;
    const card = predefinedCard(expected.kind as "about");
    const model = createPortfolioModel(async (_input, init) => {
      calls++;
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, DEFAULT_GROQ_MODEL);
      assert.equal(body.max_completion_tokens ?? body.max_tokens, 600);
      assert.equal(body.stream, undefined);
      const instructions = body.messages
        .filter((m: { role: string }) => m.role === "system")
        .map((m: { content: string }) => m.content)
        .join("");
      assert.match(instructions, /<portfolio_context>/);
      assert.match(instructions, /SOURCE:/);
      assert.ok(
        instructions.includes(query === "Projects" ? "Chronicle" : "Exly"),
      );
      return wire(
        JSON.stringify({
          ...card.content,
          intro: "I build grounded AI experiences and production mobile apps.",
        }),
      );
    }, "test-placeholder");
    const a = await answer(query, { model });
    assert.equal(calls, 1);
    assert.equal(a.metadata.mode, "rag-model");
    assert.equal(
      a.metadata.card?.content.intro,
      "I build grounded AI experiences and production mobile apps.",
    );
    assert.ok(a.metadata.sources?.length);
  });
for (const status of [429, 401, 403, 404, 500, 503])
  for (const query of ["Me", "Projects", "What did you do at Exly?"])
    test(`${status} on ${query} falls back without retry or raw errors`, async () => {
      let calls = 0;
      const model = createPortfolioModel(async () => {
        calls++;
        return Response.json(
          { error: { message: "SECRET_PROVIDER_DETAIL", type: "error" } },
          { status, headers: { "retry-after": "1" } },
        );
      }, "test-placeholder");
      const a = await answer(query, { model });
      assert.equal(calls, 1);
      assert.ok(a.text.length > 30);
      assert.doesNotMatch(a.body, /SECRET_PROVIDER_DETAIL/);
      if (query !== "What did you do at Exly?") assert.ok(a.metadata.card);
      else assert.match(a.text, /Exly/);
      resetProviderCooldown();
    });
test("429 cooldown respects Retry-After and is temporary", async () => {
  const now = Date.now();
  assert.equal(retryAfterMs("2", now), 2000);
  assert.equal(
    retryAfterMs(new Date(now + 3000).toUTCString(), now) > 1900,
    true,
  );
  const model = createPortfolioModel(
    async () =>
      Response.json(
        { error: { message: "limited" } },
        { status: 429, headers: { "retry-after": "0.02" } },
      ),
    "test-placeholder",
  );
  await answer("Me", { model });
  assert.equal(providerReady(), false);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(providerReady(), true);
});
for (const malformed of [
  "",
  "{}",
  "not json",
  JSON.stringify({
    intro: "<script>bad</script>",
    experienceSummary: "",
    projectSummaries: [],
  }),
])
  test(`invalid structured response falls back: ${malformed.slice(0, 20)}`, async () => {
    const model = createPortfolioModel(
      async () => wire(malformed),
      "test-placeholder",
    );
    const a = await answer("Me", { model });
    assert.equal(a.metadata.mode, "predefined-fallback");
    assert.match(a.metadata.card!.content.intro, /Devansh/);
  });
test("timeout cancels generation and renders a complete About fallback", async () => {
  const model = createPortfolioModel(
    async (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("timeout", "TimeoutError")),
          { once: true },
        );
      }),
    "test-placeholder",
  );
  const keepAlive = setTimeout(() => {}, 1000);
  const a = await answer("Me", { model, timeoutMs: 30 });
  clearTimeout(keepAlive);
  assert.equal(a.metadata.mode, "predefined-fallback");
  assert.ok(a.metadata.card);
});
test("network failure falls back", async () => {
  const model = createPortfolioModel(async () => {
    throw new TypeError("DNS failed");
  }, "test-placeholder");
  const a = await answer("Me", { model });
  assert.equal(a.metadata.mode, "predefined-fallback");
});
test("ordinary text streams generated output and includes retrieved context", async () => {
  const model = new MockLanguageModelV4({
    doStream: async (options) => {
      assert.match(JSON.stringify(options.prompt), /UKG/);
      return {
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "x" },
            {
              type: "text-delta",
              id: "x",
              delta: "At UKG I automated data validation using Python.",
            },
            { type: "text-end", id: "x" },
          ],
        }),
      };
    },
  });
  const a = await answer("What did you do at UKG?", { model });
  assert.equal(a.metadata.mode, "rag-model");
  assert.match(a.text, /automated/);
});
test("Chronicle follow-up preserves topic without inventing a model", async () => {
  const history = [
    msg("Tell me about The Chronicle"),
    msg("Chronicle is my personalized AI newspaper.", "assistant"),
  ];
  const resolved = constructRetrievalQuery(
    "What model did you use there?",
    history,
  );
  assert.equal(resolved.contextEntity, "Chronicle");
  const chunks = await retrieve(resolved.query);
  assert.ok(chunks.length);
  assert.ok(chunks.every((c) => /Chronicle/i.test(c.title)));
  const a = await answer(
    "What model did you use there?",
    { model: never },
    history,
  );
  assert.match(a.text, /doesn't specify the model/);
});
test("education retrieval excludes projects and experiences", async () => {
  const chunks = await retrieve(
    constructRetrievalQuery("What's his education?").query,
  );
  assert.ok(chunks.length);
  assert.ok(chunks.every((c) => c.section === "education"));
  assert.match(chunks[0].text, /8.18/);
});
test("Exly and project retrieval is focused, not an entire corpus dump", async () => {
  for (const q of [
    "What did Devansh do at Exly?",
    "Tell me about The Chronicle",
  ]) {
    const chunks = await retrieve(constructRetrievalQuery(q).query);
    assert.ok(chunks.length > 0 && chunks.length <= 6);
    assert.ok(
      chunks.every((c) =>
        new RegExp(q.includes("Exly") ? "Exly" : "Chronicle", "i").test(
          c.title,
        ),
      ),
    );
  }
});
for (const q of [
  "What's your favorite movie?",
  "Tell me about Finite Press",
])
  test(`unknown facts remain unknown: ${q}`, async () => {
    const a = await answer(q, { allowModel: false });
    assert.equal(a.metadata.mode, "unknown-fallback");
  });
test("all predefined card kinds have usable content", () => {
  for (const kind of cardKinds) {
    const card = predefinedCard(
      kind,
      kind === "project-detail" ? "chronicle" : undefined,
    );
    assert.ok(card.content.intro);
  }
});
test("context and history budgets stay bounded", () => {
  const history = Array.from({ length: 15 }, () =>
    msg("long ".repeat(500), "assistant"),
  );
  history.push(msg("What did you do at Exly?"));
  const bounded = modelHistory(history);
  assert.ok(bounded.length <= 7);
  assert.ok(estimateTokens(JSON.stringify(bounded)) < 1200);
  const prompt = buildSystemPrompt("context ".repeat(5000), "recruiter");
  assert.ok(estimateTokens(prompt) < 4100);
  assert.equal(MAX_OUTPUT_TOKENS, 600);
});
test("six model-eligible requests per minute", () => {
  const limiter = new MemoryLimiter();
  for (let i = 0; i < 6; i++)
    assert.equal(limiter.check("visitor", 0).success, true);
  assert.equal(limiter.check("visitor", 1).success, false);
  assert.equal(limiter.check("visitor", 60000).success, true);
});
test("no hosted embedding dependency or provider credentials in client source", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.dependencies["@ai-sdk/openai"], undefined);
  const retrieval = readFileSync("lib/retrieval.ts", "utf8");
  assert.doesNotMatch(retrieval, /\bfetch\(|embeddingModel\(/);
  for (const file of readdirSync("components").filter((f) => /tsx$/.test(f)))
    assert.doesNotMatch(
      readFileSync(`components/${file}`, "utf8"),
      /GROQ_API_KEY|createPortfolioModel|api\.groq\.com/,
    );
});

test("route asks Groq first for all questions and uses general answers after limit reached", async () => {
  const previousKey = process.env.GROQ_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.GROQ_API_KEY = "test-placeholder";
  resetProviderCooldown();
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return wire(JSON.stringify(predefinedCard("about").content));
  };
  const request = (question: string) => new Request("http://localhost:3000/api/chat", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [msg(question)] }),
  });
  try {
    for (let i = 0; i < 6; i++) {
      const body = await (await POST(request("Me"))).text();
      assert.match(body, /"mode":"rag-model"/);
    }
    assert.equal(calls, 6);
    const limited = await POST(request("Me"));
    assert.equal(limited.status, 200);
    const body = await limited.text();
    assert.match(body, /"mode":"predefined-fallback"/);
    assert.match(body, /"kind":"about"/);
    assert.equal(calls, 6);
    const limitedGreeting = await (await POST(request("hi"))).text();
    assert.match(limitedGreeting, /"mode":"local"/);
    assert.equal(calls, 6);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});

test("employer work questions retrieve unique roles without treating projects as jobs", async () => {
  const chunks = await retrieve(constructRetrievalQuery("What did you work on at Exly?").query);
  assert.equal(chunks.length, 2);
  assert.ok(chunks.every(c => c.section === "experience" && /Exly/i.test(c.title)));
  assert.ok(chunks.some(c => /Junior Software Engineer/.test(c.title)));
  assert.ok(chunks.some(c => /Software Engineering Intern/.test(c.title)));
});
