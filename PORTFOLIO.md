# Devansh conversational portfolio

Next.js App Router, TypeScript, Tailwind, Framer Motion and Vercel AI SDK, using GroqCloud for generation and entirely local retrieval.

See [GROQ-RAG.md](GROQ-RAG.md) for the current architecture, source provenance, response modes, budgets, rate limits, environment configuration, tests and Vercel deployment instructions. See [DESIGN-SPEC.md](DESIGN-SPEC.md) for the reference design study.

## Local run

```sh
npm install
cp .env.example .env.local
npm run dev
```

Node 22+ is required. No API key is needed for cards, source retrieval, contact links or sanitized résumé downloads. Set server-only `GROQ_API_KEY` for generated responses. Never use a `NEXT_PUBLIC_` provider credential. Production generation additionally requires the Upstash configuration in `.env.example`.

## Editing content

Edit `data/profile.ts` for curated public facts and card links. Source résumés belong in ignored `resumes/`; rebuild sanitized JSON with `npm run ingest -- resumes --offline`. Review generated data before publishing. Supplemental verified legacy-project facts live in `data/portfolio-supplement.ts`. Downloads under `/api/resume/[id]` are reconstructed from sanitized JSON, not the original PDFs.

The active portrait is `public/devansh-portrait-shoulders.png`; presentation and circular crop are in `components/devansh-avatar.tsx`. The fluid cursor remains in `lib/fluid-cursor.ts` and `components/cursor-trail.tsx`.

## Checks

```sh
npm run typecheck
npm test
npm run audit:public
npm run build
```

The tests mock provider responses and do not spend Groq quota. A real account-enabled model and distributed Redis behavior still need a deployment smoke test. This branch preserves the original static site alongside the Next.js app; no default-branch merge or production promotion is included.

## Visual revision — 31 October 2026

Removed Fun from navigation, cards and persisted section validation. Home uses four compact buttons and viewport-height sizing. Desktop 1440×900 and phone 375×667 were checked for zero page overflow. Reduced-motion preferences disable the fluid and portrait animation. The fluid reproduces the broad rainbow flow and lingering curls from the video, but exact frame-for-frame equivalence to the reference is not asserted.

The portrait was generated with the built-in image-generation tool from the supplied photograph, then refined with this prompt: “Transform this portrait into a clearly stylized 3D Memoji-like personal emoji head; smooth matte skin, big expressive brown eyes, sculpted black quiff, simplified beard and mustache; retain likeness, warm brown skin, tilak and gentle smile; head only on transparent background.” The original photograph is not included in the repository.

## Portrait and GPU cursor refinement

The supplied 1254×1254 transparent PNG is now used directly, without lossy image optimization. The cursor uses an original WebGL2 implementation in `lib/fluid-cursor.ts`, with a 128-cell velocity field and a separate 1024-cell pigment field (short-axis dimensions). A pressure solve, low vorticity confinement, high-resolution advection and gradient shading preserve smooth translucent rainbow folds. Parameters were compared against the live reference using matching pointer sweeps. Exact pixel identity is not guaranteed because input timing and rendering differ. WebGL2/float-render-target support is required for this decorative effect; unsupported devices retain the functional portfolio without a cursor effect. Reduced motion disables it. GPU resources and listeners are released on cleanup.

## Head-and-shoulders portrait

The active asset is `public/devansh-portrait-shoulders.png`, a 1254×1254 transparent PNG. It was edited with the built-in image-generation tool using the approved face portrait and original photo as references. Prompt: preserve the approved face and hairstyle, extend the portrait with natural neck, both shoulders and upper chest in the reference black T-shirt, no hands or exposed arms, transparent background, framing for a circular profile photograph. The circle clips the shirt naturally at its bottom edge.
