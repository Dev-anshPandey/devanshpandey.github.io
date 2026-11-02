import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  generateText,
  Output,
  type LanguageModel,
} from "ai";
import { fastReply, policyReply, contextualSuggestions } from "./chat-policy";
import { constructRetrievalQuery, knowledge, retrieve } from "./retrieval";
import { buildSystemPrompt } from "./system-prompt";
import {
  createPortfolioModel,
  providerReady,
  classifyProviderFailure,
  MAX_OUTPUT_TOKENS,
  GENERATION_TIMEOUT_MS,
} from "./groq";
import { buildRetrievalFallback } from "./fallback-response";
import {
  cardTextSchema,
  validateCardText,
  cardPlainText,
} from "./portfolio-response";
import { modelHistory } from "./prompt-budget";
import type { ChatMetadata, PortfolioMessage } from "./chat-types";
export function createAnswerResponse(
  messages: PortfolioMessage[],
  options: {
    signal?: AbortSignal;
    allowModel?: boolean;
    model?: LanguageModel;
    paced?: boolean;
    timeoutMs?: number;
  } = {},
) {
  const textOf = (m: PortfolioMessage) =>
    m.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
  const query = textOf(messages.at(-1)!);
  return createUIMessageStreamResponse({
    headers: { "Cache-Control": "no-store" },
    stream: createUIMessageStream<PortfolioMessage>({
      execute: async ({ writer }) => {
        const id = crypto.randomUUID();
        const metadata: ChatMetadata = {
          suggestions: contextualSuggestions(query),
          mode: "local",
        };
        writer.write({
          type: "start",
          messageId: crypto.randomUUID(),
          messageMetadata: metadata,
        });
        writer.write({ type: "text-start", id });
        const emit = (text: string) => {
          if (!options.signal?.aborted)
            writer.write({ type: "text-delta", id, delta: text });
        };
        const finish = () => {
          if (!options.signal?.aborted) {
            writer.write({ type: "text-end", id });
            writer.write({
              type: "finish",
              finishReason: "stop",
              messageMetadata: metadata,
            });
          }
        };
        try {
          const fast = fastReply(query),
            policy = policyReply(query);
          if (fast || policy) {
            metadata.suggestions = fast?.suggestions || metadata.suggestions;
            emit(fast?.text || policy!);
            finish();
            return;
          }
          const resolved = constructRetrievalQuery(
            query,
            messages.slice(0, -1),
          );
          const sources = await retrieve(resolved.query, options.signal);
          const fallback = buildRetrievalFallback(
            resolved.query,
            sources,
            resolved.intent,
          );
          metadata.sources = [...new Set(sources.map((s) => s.resumeId))].map(
            (id) => ({
              id,
              title: knowledge.resumes.find((r) => r.id === id)?.label || "Original portfolio",
            }),
          );
          const useFallback = () => {
            metadata.mode = fallback.mode;
            metadata.card = fallback.card;
            emit(fallback.text);
          };
          if (
            resolved.intent.local ||
            fallback.mode === "unknown-fallback" ||
            options.allowModel === false ||
            (!options.model && (!process.env.GROQ_API_KEY || !providerReady()))
          ) {
            useFallback();
            finish();
            return;
          }
          const model = options.model || createPortfolioModel();
          const abortSignal = AbortSignal.any([
            ...(options.signal ? [options.signal] : []),
            AbortSignal.timeout(options.timeoutMs || GENERATION_TIMEOUT_MS),
          ]);
          const audience =
            messages
              .filter((m) => m.role === "user")
              .map(textOf)
              .join(" ")
              .match(
                /\b(?:i am|i'm|as) (?:a |an )?(recruiter|developer|client)\b/i,
              )?.[1] || "not specified";
          const context = sources
            .map(
              (s) =>
                `SOURCE: ${s.resumeId} / ${s.title}\nRECORD TYPE: ${s.section === "projects" ? "PROJECT (not an employment position)" : s.section}\n${s.text}\nEND SOURCE`,
            )
            .join("\n\n");
          const cardInstruction = fallback.card
            ? `Return text for the ${fallback.card.kind} card. intro: concise answer to the question. experienceSummary: one factual short sentence (or empty if irrelevant). projectSummaries: ${fallback.card.kind === "projects" || fallback.card.kind === "project-detail" ? `include exactly these IDs: ${fallback.card.content.projectSummaries.map((p) => p.id).join(", ")}; descriptions must be grounded in retrieved project sources` : "return an empty array"}. No presentation markup.`
            : "";
          const settings = {
            model,
            instructions: buildSystemPrompt(context, audience, cardInstruction),
            messages: modelHistory(messages),
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            maxRetries: 0,
            abortSignal,
            providerOptions: {
              groq: {
                reasoningEffort: "low",
                reasoningFormat: "hidden",
                structuredOutputs: true,
                strictJsonSchema: true,
              },
            },
          };
          let emitted = false;
          try {
            if (fallback.card) {
              const result = await generateText({
                ...settings,
                output: Output.object({ schema: cardTextSchema }),
              });
              const content = validateCardText(result.output, fallback.card);
              metadata.card = { ...fallback.card, content };
              metadata.mode = "rag-model";
              emit(cardPlainText(metadata.card));
            } else {
              const result = streamText({ ...settings, onError: () => {} });
              const reader = result.stream.getReader();
              let buffered = "";
              try {
                while (true) {
                  const { value, done } = await reader.read();
                  if (done) break;
                  if (value.type === "text-delta") {
                    buffered += value.text;
                    if (emitted || buffered.trim().length >= 40) {
                      emit(buffered);
                      buffered = "";
                      emitted = true;
                    }
                  }
                  if (value.type === "error") throw value.error;
                  if (value.type === "abort")
                    throw new DOMException("Timed out", "TimeoutError");
                }
              } finally {
                reader.releaseLock();
              }
              if (buffered.trim()) {
                emit(buffered);
                emitted = true;
              }
              if (!emitted) throw new Error("Empty provider response");
              metadata.mode = "rag-model";
            }
          } catch (error) {
            if (options.signal?.aborted) return;
            console.warn(
              `[portfolio] Groq ${classifyProviderFailure(error)}; using fallback`,
            );
            if (emitted) {
              metadata.mode = "rag-model";
              metadata.interrupted = true;
            } else useFallback();
          }
          finish();
        } catch {
          if (!options.signal?.aborted) {
            metadata.mode = "unknown-fallback";
            emit(
              "I don't have that information in my portfolio. You can explore my experience, projects, skills, or Contact.",
            );
            finish();
          }
        }
      },
      onError: () =>
        "You can explore my experience, projects, skills, or Contact.",
    }),
  });
}
