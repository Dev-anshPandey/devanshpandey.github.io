# Devansh — conversational portfolio

Current work-in-progress snapshot: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Framer Motion, Vercel AI SDK 7 with direct OpenAI, and Upstash Redis. See [DESIGN-SPEC.md](DESIGN-SPEC.md) for reference measurements and differences.

## Run locally

Requires Node 22+. Run `npm ci`, copy `.env.example` to `.env.local`, then run `npm run dev`. Open http://localhost:3000. Greetings, rich cards and streamed résumé extracts work without a provider key. Set `OPENAI_API_KEY` and an account-enabled `OPENAI_MODEL` for generated answers. Secrets stay server-side.

## Résumé knowledge and privacy

The three supplied résumés are the factual source. Original PDFs/DOCX files belong in ignored `resumes/`; never commit them. Run `npm run ingest -- resumes --offline` for deterministic local hashed retrieval vectors, or `npm run ingest -- resumes` with an OpenAI key for semantic embeddings. `OPENAI_EMBEDDING_MODEL` defaults to `text-embedding-3-small`. Review generated JSON for private details before publishing. The script removes detected phones and labeled home addresses before indexing; automated redaction still needs human review.

Structured versions and the chunk index are in `data/generated/`. The committed index uses offline vectors, not OpenAI embeddings. Ingestion accepts exactly three PDF/DOCX files, preserves source wording and separate résumé variants, and extracts public contact links. The server retrieves relevant chunks and gives them to the model with strict grounding instructions. Missing facts use a contact fallback; conflicts should remain attributed rather than resolved by invention.

`data/profile.ts` supplies the curated rich cards and public links. Keep its facts aligned with the generated source data. Contact provides three privacy-safe PDF downloads through `/api/resume/[id]`, reconstructed from sanitized data; they do not reproduce the original layouts or expose original files.

## Interface

The original layered SVG avatar is in `components/devansh-avatar.tsx`: blink, breathing, gaze, wave and chat states. Change this component to customize it or replace its two usages in `components/portfolio.tsx` with your image. `public/avatar.svg` is the older placeholder and is not the active avatar.

`components/cursor-trail.tsx` provides a fading, speed-responsive blue/cyan/violet canvas trail. It scales for device pixel ratio, reduces work on low-power/touch devices, pauses when idle/hidden, and respects reduced motion. Its appearance intentionally approximates the reference rather than copying its simulation.

Chat supports safe Markdown, three follow-ups, copy, regenerate, Stop/Continue, bounded history, local-device persistence, Clear chat, near-bottom auto-scroll, keyboard submission, and accessible status/error states. Greetings are local. Model/network failures fall back to source extracts or preserve partial output. Transport retries transient failures with backoff. Input is capped at 1,000 characters; request bodies at 64 KiB; server context at 20 messages/32,000 characters. Model output is capped at 1,400 tokens and generation at 22 seconds.

Production paid generation requires Upstash Redis plus a random `RATE_LIMIT_SALT` of at least 32 characters. Limits are 10 requests/minute per hashed trusted Vercel IP. If shared limiting is unavailable, paid generation is disabled and source fallback remains available. Local development uses a shared memory bucket. Conversation is stored in browser localStorage; Clear removes it. Generated replies send bounded conversation and retrieved public résumé excerpts to OpenAI; provider response storage is disabled.

## Verification and remaining checks

- `npm test`: 63 tests pass, including 48 sample prompts, validation, rate limits, source retrieval, provider errors, partial streams, transport retries and corrupted storage.
- `npm run build`: production webpack build passed. Webpack is explicit because the local environment blocked Turbopack's build subprocess.
- `npm run audit:public`: passed; original résumés, local secrets and artifacts are ignored.
- Desktop landing, original avatar and instant greeting were inspected in the browser.
- Final mobile/dark/interaction regression checks and visual inspection of the reconstructed PDF downloads remain in progress at this checkpoint.
- No real OpenAI key was configured: live provider generation, semantic embeddings and distributed Redis behavior still need deployment verification. Tests cover mocked streams and errors, not model factual accuracy guarantees.

## Deploy to Vercel

Import this repository with the Next.js preset, root directory `.`, Node 22+, install `npm ci`, build `npm run build`. Set `OPENAI_API_KEY`, optional `OPENAI_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_SALT`, and canonical `SITE_URL` for the intended environment. Generate a salt with `openssl rand -hex 32`. Run semantic ingestion locally if desired, review and commit only sanitized outputs, then deploy. Check a real streamed answer, rate limits, source links and all three downloads before production promotion. This application needs a server runtime; GitHub Pages cannot run its API routes.

## Source map

- `app/`: page, styles, metadata, chat API and résumé download API.
- `components/`: portfolio UI, avatar, cursor trail, safe Markdown, rich cards and theme provider.
- `data/`: public profile and sanitized generated résumé data/index.
- `lib/`: retrieval, prompts, chat policy/protocol/client/validation, rate limiting and PDF generation.
- `scripts/`: PDF/DOCX ingestion and public-data audit.
- `tests/`: prompt fixtures and automated tests.
- `.env.example`: all required server configuration names, no credentials.

The branch preserves the repository's existing static-site files. The Next.js app is a separate implementation at the repository root; no default-branch merge or production promotion is part of this checkpoint.
