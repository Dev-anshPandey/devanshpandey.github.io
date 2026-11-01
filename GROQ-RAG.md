# Groq RAG implementation

This upgrade stays on `chatbot-ui`. The existing portrait, fluid cursor, theme, typography, layout, animations and project-card markup remain intact. Quick questions now enter the same server pipeline as typed questions. React selects the existing card layout; the model supplies validated text only.

## Pipeline

```text
Sanitized résumé JSON + verified original portfolio details
  → section-aware ingestion → local 256-dimensional hash vectors
  → data/generated/knowledge.json (36 chunks)

Question → validation/policy/local intent
  → conversational entity resolution → hybrid local retrieval
  → up to six relevant, deduplicated chunks
  → GroqCloud / openai/gpt-oss-120b
  → validated card text or ordinary streamed Markdown
  → existing React cards/chat

Provider unavailable or application limit reached
  → recognized intent: predefined text + same card
  → arbitrary portfolio question: selected source passages
  → unsupported fact: explicit unknown answer + portfolio suggestions
```

There are no OpenAI-hosted API calls, hosted embeddings, hosted vector database, or LangChain runtime. `openai/` in the model identifier is Groq's model naming convention. Historical OpenAI/Anthropic/LangChain references in Devansh's professional profile are facts, not application dependencies.

## Sources and retrieval

Three sanitized résumé variants provide employment, project, skills, education and public contact facts. `data/portfolio-supplement.ts` adds Vitals from the original repository's `index.html`, with an explicit source link. The four-project overview remains unchanged; Vitals is available as a named project card and in retrieval. FinitePress is absent from verified sources and is not invented. No specific Chronicle model is documented; follow-up questions about it say so.

Ingestion keeps role/project boundaries, merges extracted project headings with their bullets, and splits long clusters at bullet/sentence boundaries near 2,200 characters (roughly 250–600 English tokens). Short education, skills and contact sections stay intact. Each chunk retains source ID, section, title, text and local vector. Runtime deduplication removes strongly overlapping same-section passages and repeated company/role records across résumé variants.

Ranking combines lexical coverage (0.5), local cosine similarity (0.15), entity coverage (0.55), section relevance (0.35; supporting About sections 0.25), and focused entity-title matches (0.35). Named company/project queries require that entity in the chunk title. Education and broad project queries filter to their sections. Unsupported queries can retrieve zero chunks. Ordinary queries use up to six, with a 10,000-character pre-prompt cap. Exact lexical matching and aliases matter most; local hash vectors are not learned semantic embeddings.

The last six history messages resolve references such as “there,” “that project,” and “the second one.” The model sees at most six prior messages, trimmed to an estimated 800 tokens total, plus the current question. History resolves topics but is never an authority for factual claims. Source labels are exposed; retrieval scores and provider diagnostics are not.

## Generation and budgets

`lib/groq.ts` is the single code configuration point: default model `openai/gpt-oss-120b`, output maximum **600 tokens**, request deadline **18 seconds**, SDK `maxRetries: 0`. `GROQ_MODEL` can override the default with an account-enabled model supporting the needed response format.

Structured cards use non-streaming `generateText` with strict `Output.object`; partial JSON never appears in the UI. The schema allows only intro, experience summary, and project descriptions with canonical IDs. React supplies titles, dates, links, icons and markup. Invalid, empty or presentation-code output falls back. Ordinary answers stream text. Interrupted useful text is retained with the existing Continue control.

Typical input is roughly 1,500–4,500 estimated tokens, depending on retrieved sections/history. Context is capped at 2,500 estimated tokens, prior history at 800, and the current question at 1,000 characters. Static rules and the card instruction add roughly 950–1,200 estimated tokens. The estimator deliberately counts ASCII at one token per three characters and non-ASCII at one each; it is conservative budgeting, not a model tokenizer. A maximal multilingual request can approach 5,500 estimated tokens. No full résumé corpus is sent.

The prompt treats source documents, visitor messages and history as untrusted data, refuses instructions embedded in them, disallows unsupported claims, distinguishes API providers from model names, and preserves dates. Prompting cannot guarantee factual accuracy; review live model answers before production promotion.

## Failure and rate-limit behavior

Missing key, auth/permission failure, unavailable model, 429/quota exhaustion, network errors, 5xx, timeout, malformed/empty structured output all use fallback. A provider 429 gets **zero retries**, logs only a safe category/rate headers server-side, and honors `Retry-After` with a temporary process-local cooldown. It never permanently disables generation. Separate Vercel instances may each make one initial request; shared application limiting is independent of this cooldown.

Production generation requires Upstash and a random salt of at least 32 characters. Limit: **six eligible requests per minute per hashed trusted Vercel client IP**. Other hosts use a shared bucket unless a trusted proxy adapter is supplied. Redis failure/missing configuration fails closed for generation while returning usable fallback, HTTP 200. Local development uses memory limiting. Greetings, thanks, navigation/contact/resume and missing-key mode skip the generation limiter. The frontend never retries HTTP 429; ordinary transport failures retain bounded retry behavior.

Predefined cards cover About, experience, education, skills, project overview, individual known projects, contact, résumé, AI experience and mobile experience. Specific employer/technical questions use original relevant bullet passages when generation is unavailable. Unsupported attributes (for example an undocumented model or favorite movie) stay unknown. Zero-API mode retains every navigation/card/download/retrieval function indefinitely.

## Configuration and deployment

1. Use Node 22+, run `npm install`, copy `.env.example` to `.env.local`.
2. Set `GROQ_API_KEY` server-side. Optional `GROQ_MODEL` defaults to `openai/gpt-oss-120b`. Leaving the key blank enables zero-API mode.
3. For production generation set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_SALT` (generate with `openssl rand -hex 32`), and canonical `SITE_URL`.
4. Run `npm run typecheck`, `npm test`, `npm run audit:public`, `npm run build`; use `npm run dev` locally.
5. Import the branch into Vercel using the Next.js preset, root `.`, Node 22+, build `npm run build`. Add environment variables to the intended environment and redeploy. GitHub Pages cannot execute these server routes.
6. Verify a real generated About/project card, an ordinary streamed employer answer, source/download links and shared Redis limiting on a preview before production promotion. Automated tests use mocks and spend no quota. A separate live smoke test verified the configured Groq key, structured About/Projects/Chronicle generation, streamed Exly answers and the unsupported-model follow-up.

To update knowledge, put the three source PDF/DOCX files in ignored `resumes/`, run `npm run ingest -- resumes --offline`, and manually review sanitized `data/generated/` outputs before committing. The offline flag remains accepted for compatibility; all ingestion is now local. Update curated `data/profile.ts` facts and supplemental source records together. Original PDFs, phone numbers, private addresses and credentials must not be published. The current avatar remains `public/devansh-portrait-shoulders.png`.

## Changed implementation files

- Provider/configuration: `lib/groq.ts`, `.env.example`, `package.json`, lockfile.
- RAG: `lib/knowledge-build.ts`, `knowledge-schema.ts`, `retrieval.ts`, `intent.ts`, `prompt-budget.ts`, `system-prompt.ts`; `scripts/ingest.ts`; `data/generated/knowledge.json`; `data/portfolio-supplement.ts`.
- Response/fallback: `lib/chat-response.ts`, `portfolio-response.ts`, `fallback-response.ts`, `chat-types.ts`, `chat-policy.ts`, `chat-client.ts`, `rate-limit.ts`; `app/api/chat/route.ts`.
- Minimal UI wiring: `components/portfolio.tsx`, `components/profile-card.tsx`.
- Verification: `tests/groq-rag.test.tsx`, existing chat/product fixtures, `scripts/audit-public.ts`.

Earlier uncommitted visual/portrait work is retained; it is not part of this backend redesign.

Official references: [Groq GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b), [structured outputs](https://console.groq.com/docs/structured-outputs), [AI SDK Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq), [Groq rate limits](https://console.groq.com/docs/rate-limits).

## Verification results

The full mocked suite passed 120 tests. Typecheck, public-source audit and production build passed. Browser checks confirmed that Me and Projects quick buttons return the existing rich cards, with canonical links and source attribution. Live Groq smoke tests succeeded with the user-provided key stored only in ignored `.env.local`. Production Vercel environment configuration and shared Redis verification remain deployment steps.

Final HTTP smoke test: homepage 200 with the current portrait, `/api/chat` 200 with `rag-model` About-card metadata and first-person generated text. The final browser-control session was unavailable; the earlier zero-API Me/Projects browser checks passed. `tsconfig.json` excludes ignored `tmp/` and `artifacts/` directories so diagnostic/dependency backups cannot enter the application typecheck. The local dependency files were restored from npm cache after SHA-512 lockfile verification; no package versions were changed by that repair.
