import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
  type LanguageModel,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { profile } from "../data/profile";
import {
  fastReply,
  policyReply,
  contextualSuggestions,
  languageOf,
  unknownReply,
} from "./chat-policy";
import { knowledge, retrieve } from "./retrieval";
import { buildSystemPrompt } from "./system-prompt";
import type { ChatMetadata, PortfolioMessage } from "./chat-types";

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(done, ms);
    function done() {
      signal?.removeEventListener("abort", abort);
      resolve();
    }
    function abort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
let warnedMissingKey = false;

export function createAnswerResponse(
  messages: PortfolioMessage[],
  options: {
    signal?: AbortSignal;
    allowModel?: boolean;
    model?: LanguageModel;
    paced?: boolean;
  } = {},
) {
  const textOf = (message: PortfolioMessage) =>
    message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
  const query = textOf(messages.at(-1)!);
  const fast = fastReply(query);
  const policy = policyReply(query);
  return createUIMessageStreamResponse({
    headers: { "Cache-Control": "no-store" },
    stream: createUIMessageStream<PortfolioMessage>({
      execute: async ({ writer }) => {
        const messageId = crypto.randomUUID(),
          textId = crypto.randomUUID();
        const metadata: ChatMetadata = {
          suggestions: fast?.suggestions || contextualSuggestions(query),
          mode: "local",
        };
        writer.write({ type: "start", messageId, messageMetadata: metadata });
        writer.write({ type: "text-start", id: textId });
        const emit = async (text: string) => {
          for (const token of text.match(/\S+\s*|\s+/g) || []) {
            if (options.signal?.aborted) return;
            writer.write({ type: "text-delta", id: textId, delta: token });
            if (options.paced !== false) await wait(12, options.signal);
          }
        };
        try {
          if (fast || policy) await emit(fast?.text || policy!);
          else {
            const history = messages
              .slice(-7, -1)
              .map(textOf)
              .join("\n")
              .slice(-4500);
            const followup =
              /tell me more|second|first|third|fourth|continue|that|those|it work|और|दूसर/i.test(
                query,
              );
            const ordinal = query
              .match(/\b(first|second|third|fourth)\b/i)?.[1]
              ?.toLowerCase();
            const mentioned = profile.projects
              .filter((project) => history.includes(project.title))
              .sort(
                (a, b) => history.indexOf(a.title) - history.indexOf(b.title),
              );
            const referred = ordinal
              ? mentioned[
                  ["first", "second", "third", "fourth"].indexOf(ordinal)
                ]
              : undefined;
            const contextQuery = referred
              ? referred.title
              : followup
                ? `${history}\n${query}`
                : query;
            const sources = await retrieve(contextQuery, options.signal);
            metadata.sources = [...new Set(sources.map((s) => s.resumeId))].map(
              (id) => ({
                id,
                title: knowledge.resumes.find((r) => r.id === id)!.label,
              }),
            );
            const fallback = () => {
              if (/contact|email|github|linkedin|reach|संपर्क/i.test(query))
                return `You can reach me at [${profile.contact.email}](mailto:${profile.contact.email}), or find me on [GitHub](${profile.contact.github}) and [LinkedIn](${profile.contact.linkedin}). You can also download my three résumé versions in Contact.`;
              if (/resume|résumé|cv|download/i.test(query))
                return "I have three résumé versions: Software / Mobile Engineer, Applied AI / GenAI, and Forward Deployed Engineer. Open Contact to download a privacy-safe version of each.";
              if (!sources.length)
                return languageOf(query) === "hi"
                  ? "यह जानकारी मेरे रिज़्यूमे में नहीं है। Contact सेक्शन से मुझसे सीधे संपर्क कर सकते हैं।"
                  : unknownReply;
              // Verbatim extracts preserve exact claims when generation is unavailable.
              const selected = sources
                .slice(0, 2)
                .map((s) => s.text.replace(/\n/g, " ").slice(0, 750));
              return `Here’s what my résumés say:\n\n${selected.map((s) => `> ${s}`).join("\n\n")}\n\nYou can find the full versions in Contact.`;
            };
            const canGenerate =
              options.model ||
              (options.allowModel !== false && process.env.OPENAI_API_KEY);
            if (!canGenerate) {
              if (!process.env.OPENAI_API_KEY && !warnedMissingKey) {
                console.warn(
                  "[portfolio owner] OPENAI_API_KEY is missing. Visitors receive local greetings and résumé extracts. Configure the server key to enable generated answers.",
                );
                warnedMissingKey = true;
              }
              metadata.mode = "resume";
              await emit(fallback());
            } else {
              metadata.mode = "model";
              const audience =
                messages
                  .filter((m) => m.role === "user")
                  .map(textOf)
                  .join(" ")
                  .match(
                    /\b(?:i am|i'm|as) (?:a |an )?(recruiter|developer|client)\b/i,
                  )?.[1] || "not specified";
              const context = sources
                .map((s) => `[${s.resumeId} / ${s.section}]\n${s.text}`)
                .join("\n\n");
              let emitted = false;
              try {
                const result = streamText({
                  model:
                    options.model ||
                    openai(process.env.OPENAI_MODEL || "gpt-5.4-mini"),
                  instructions: buildSystemPrompt(context, audience),
                  messages: await convertToModelMessages(messages),
                  maxOutputTokens: 1400,
                  maxRetries: 2,
                  onError: () => {},
                  abortSignal: AbortSignal.any([
                    ...(options.signal ? [options.signal] : []),
                    AbortSignal.timeout(22000),
                  ]),
                  providerOptions: { openai: { store: false } },
                });
                const reader = result.stream.getReader();
                try {
                  while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value.type === "text-delta") {
                      emitted = true;
                      writer.write({
                        type: "text-delta",
                        id: textId,
                        delta: value.text,
                      });
                    }
                    if (value.type === "error" || value.type === "abort")
                      throw new Error("Generation interrupted");
                  }
                } finally {
                  reader.releaseLock();
                }
                if (!emitted) {
                  metadata.mode = "resume";
                  await emit(fallback());
                }
              } catch {
                if (options.signal?.aborted) return;
                console.warn(
                  "[portfolio owner] Model request failed or timed out. Check provider key, model access, quota and network. Provider details are withheld.",
                );
                if (emitted) metadata.interrupted = true;
                else {
                  metadata.mode = "resume";
                  await emit(fallback());
                }
              }
            }
          }
          writer.write({ type: "text-end", id: textId });
          writer.write({
            type: "finish",
            finishReason: "stop",
            messageMetadata: metadata,
          });
        } catch {
          if (!options.signal?.aborted) {
            writer.write({
              type: "text-delta",
              id: textId,
              delta:
                "I lost my place for a moment. Please try again, or explore the sections below.",
            });
            writer.write({ type: "text-end", id: textId });
            writer.write({
              type: "finish",
              messageMetadata: { ...metadata, interrupted: true },
            });
          }
        }
      },
      onError: () => "I couldn’t finish that reply. Please try again.",
    }),
  });
}
