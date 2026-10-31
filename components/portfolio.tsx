"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Code2,
  Copy,
  Layers3,
  Mail,
  Moon,
  RotateCcw,
  Smile,
  Sparkles,
  Square,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { presets, profile, sectionSummary, type Section } from "@/data/profile";
import { MAX_INPUT } from "@/lib/chat-config";
import {
  boundedHistory,
  CHAT_STORAGE_KEY,
  ChatRequestError,
  readStoredChat,
  resilientFetch,
} from "@/lib/chat-client";
import { contextualSuggestions, fastReply } from "@/lib/chat-policy";
import type { PortfolioMessage } from "@/lib/chat-types";
import { ProfileCard } from "./profile-card";
import { CursorTrail } from "./cursor-trail";
import { DevanshAvatar, type Expression } from "./devansh-avatar";
import { MessageContent } from "./message-content";

const icons = {
  me: Smile,
  projects: BriefcaseBusiness,
  skills: Layers3,
  fun: Sparkles,
  contact: Mail,
};
const textOf = (m: PortfolioMessage) =>
  m.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
export function Portfolio() {
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [retrying, setRetrying] = useState("");
  const [ready, setReady] = useState(false);
  const [showQuestions, setShowQuestions] = useState(true);
  const [expression, setExpression] = useState<Expression>("happy");
  const [wave, setWave] = useState(1);
  const [copied, setCopied] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [transport] = useState(
    () =>
      new DefaultChatTransport<PortfolioMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages: boundedHistory(messages) },
        }),
        fetch: (url, options) =>
          resilientFetch(url, options, (seconds, limited) => {
            setRetrying(`Reconnecting in ${seconds}s…`);
            if (limited) setCooldown(seconds);
          }),
      }),
  );
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    clearError,
    stop,
    regenerate,
  } = useChat<PortfolioMessage>({ transport });
  const { resolvedTheme, setTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const sending = useRef(false);
  const persistedAt = useRef(0);
  const busy = status === "submitted" || status === "streaming";
  const started = messages.length > 0;
  const last = messages.at(-1);
  const hasReply = last?.role === "assistant" && textOf(last).length > 0;
  const avatarExpression: Expression = error
    ? "oops"
    : status === "submitted"
      ? "thinking"
      : status === "streaming"
        ? "talking"
        : expression;

  useEffect(() => {
    try {
      setMessages(readStoredChat(localStorage.getItem(CHAT_STORAGE_KEY)));
    } catch {
      setStorageNotice("Chat history is available for this visit only.");
    }
    setReady(true);
  }, [setMessages]);
  useEffect(() => {
    if (!ready || (busy && Date.now() - persistedAt.current < 500)) return;
    persistedAt.current = Date.now();
    try {
      const saved = messages
        .slice(-60)
        .map((m, index, all) =>
          busy && index === all.length - 1 && m.role === "assistant"
            ? { ...m, metadata: { ...m.metadata, interrupted: true } }
            : m,
        );
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      setStorageNotice(
        "Browser storage is full or unavailable; this chat won’t survive a refresh.",
      );
    }
  }, [messages, ready, busy]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    const area = scrollRef.current;
    if (area && nearBottom.current)
      area.scrollTo({
        top: area.scrollHeight,
        behavior: reducedMotion || busy ? "instant" : "smooth",
      });
  }, [messages, busy, reducedMotion, error, notice]);
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
    }
  }, [input]);
  useEffect(() => {
    const timer = setTimeout(() => setExpression("idle"), 3000);
    return () => clearTimeout(timer);
  }, [expression, wave]);
  useEffect(() => {
    if (!busy) {
      sending.current = false;
      setRetrying("");
    }
  }, [busy]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(""), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  function ask(text: string) {
    if (busy || sending.current || !ready) return;
    if (!text.trim()) {
      setNotice("Type a question first—I’m listening.");
      inputRef.current?.focus();
      return;
    }
    if (text.length > MAX_INPUT) {
      setNotice(
        `Please keep your question under ${MAX_INPUT.toLocaleString()} characters.`,
      );
      return;
    }
    const fast = fastReply(text);
    if (cooldown && !fast) {
      setNotice(
        `You can send another question in ${cooldown}s. The portfolio sections still work.`,
      );
      return;
    }
    clearError();
    setNotice("");
    nearBottom.current = true;
    setInput("");
    if (fast) {
      setExpression(fast.expression);
      setWave((value) => value + 1);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          parts: [{ type: "text", text: text.trim() }],
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: fast.text }],
          metadata: { suggestions: fast.suggestions, mode: "local" },
        },
      ]);
      return;
    }
    sending.current = true;
    void sendMessage({ text: text.trim() }).finally(() => {
      sending.current = false;
    });
  }
  function choose(section: Section) {
    if (busy || sending.current || !ready) return;
    clearError();
    setNotice("");
    nearBottom.current = true;
    const preset = presets.find((p) => p.id === section)!;
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: preset.question }],
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        metadata: {
          section,
          suggestions: contextualSuggestions(preset.question),
          mode: "resume",
        },
        parts: [{ type: "text", text: sectionSummary(section) }],
      },
    ]);
  }
  async function stopReply() {
    await stop();
    sending.current = false;
    setMessages((current) =>
      current.map((m, i) =>
        i === current.length - 1 && m.role === "assistant"
          ? { ...m, metadata: { ...m.metadata, interrupted: true } }
          : m,
      ),
    );
  }
  async function clear() {
    await stop();
    sending.current = false;
    setMessages([]);
    clearError();
    setInput("");
    setNotice("");
    nearBottom.current = true;
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      /* In-memory clearing still works. */
    }
    inputRef.current?.focus();
  }
  function retry(messageId?: string) {
    if (busy || sending.current || cooldown) return;
    clearError();
    sending.current = true;
    nearBottom.current = true;
    void regenerate(messageId ? { messageId } : undefined).finally(() => {
      sending.current = false;
    });
  }
  async function copy(message: PortfolioMessage) {
    try {
      await navigator.clipboard.writeText(textOf(message));
      setCopied(message.id);
    } catch {
      setNotice(
        "Copy isn’t available in this browser. You can select the reply text instead.",
      );
    }
  }
  const categories = (
    <div
      className={`categories ${started ? "compact" : ""}`}
      aria-label="Explore my portfolio"
    >
      {presets.map(({ id, label }) => {
        const Icon = icons[id];
        return (
          <motion.button
            key={id}
            type="button"
            className={`category category-${id}`}
            onClick={() => choose(id)}
            disabled={busy || !ready}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          >
            <Icon size={18} strokeWidth={1.65} />
            <span>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
  const friendlyError =
    error instanceof ChatRequestError
      ? error.message
      : "The connection was interrupted. Your message and any partial reply are still here.";

  return (
    <main className={`portfolio ${started ? "in-chat" : ""}`}>
      <CursorTrail />
      <a className="skip-link" href={started ? "#conversation" : "#question"}>
        Skip to conversation
      </a>
      <header className="topbar">
        <div className="topbar-left">
          <a className="wordmark" href="/" aria-label="Devansh home">
            <Code2 size={20} />
            <span>
              {profile.name}
              <span className="wordmark-dot">.</span>
            </span>
          </a>
          <span className="availability">
            <span />
            Let’s talk
          </span>
        </div>
        <div className="topbar-actions">
          {started && (
            <button
              className="icon-button"
              onClick={() => void clear()}
              aria-label="Clear chat"
              title="Clear chat"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button
            className="icon-button"
            aria-label={
              ready && resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            title="Toggle color theme"
          >
            {ready && resolvedTheme === "dark" ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>
        </div>
      </header>
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.section
            className="hero"
            key="hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
          >
            <div className="hero-mark" aria-hidden="true">
              <Code2 size={28} />
            </div>
            <p className="greeting">
              Hey, I’m {profile.name} <span>👋</span>
            </p>
            <h1>{profile.headline}</h1>
            <p className="hero-subtitle">{profile.subtitle}</p>
            <div className="hero-character">
              <DevanshAvatar expression={avatarExpression} wave={wave} />
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="chat"
            className="chat-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            onAnimationComplete={() => {
              const area = scrollRef.current;
              if (area && nearBottom.current)
                area.scrollTop = area.scrollHeight;
            }}
          >
            <div className="compact-identity">
              <DevanshAvatar
                compact
                expression={avatarExpression}
                wave={wave}
              />
              <div>
                <strong>{profile.name}</strong>
                <span>My experience. In conversation.</span>
              </div>
              <span className="ai-label">AI portfolio</span>
            </div>
            <div
              className="conversation"
              id="conversation"
              tabIndex={-1}
              ref={scrollRef}
              onScroll={() => {
                const el = scrollRef.current;
                if (el)
                  nearBottom.current =
                    el.scrollHeight - el.scrollTop - el.clientHeight < 120;
              }}
            >
              <div
                className="messages"
                role="log"
                aria-label="Conversation"
                aria-live="polite"
                aria-relevant="additions"
                aria-busy={busy}
              >
                {messages.map((message, index) => (
                  <motion.article
                    key={message.id}
                    className={`message ${message.role}`}
                    aria-label={
                      message.role === "user"
                        ? "Your message"
                        : "Devansh’s reply"
                    }
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  >
                    {message.role === "assistant" &&
                    message.metadata?.section ? (
                      <ProfileCard section={message.metadata.section} />
                    ) : message.role === "assistant" ? (
                      <MessageContent text={textOf(message)} />
                    ) : (
                      <div className="message-text">{textOf(message)}</div>
                    )}
                    {message.role === "assistant" && textOf(message) && (
                      <>
                        <div className="message-tools">
                          <button
                            onClick={() => void copy(message)}
                            aria-label="Copy reply"
                          >
                            {copied === message.id ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}{" "}
                            {copied === message.id ? "Copied" : "Copy"}
                          </button>
                          {index === messages.length - 1 && (
                            <button
                              disabled={busy || cooldown > 0}
                              onClick={() => retry(message.id)}
                            >
                              <RotateCcw size={13} />
                              Regenerate
                            </button>
                          )}
                          {message.metadata?.mode === "resume" &&
                            !message.metadata.section && (
                              <span>Résumé extracts</span>
                            )}
                        </div>
                        {message.metadata?.sources?.length ? (
                          <div className="answer-sources">
                            Sources:{" "}
                            {message.metadata.sources.map((source) => (
                              <a
                                key={source.id}
                                href={`/api/resume/${source.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {source.title}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        {message.metadata?.interrupted && (
                          <div className="partial-note">
                            This reply was interrupted.{" "}
                            <button
                              disabled={busy || cooldown > 0}
                              onClick={() =>
                                ask(
                                  "Continue your previous answer from where it stopped, without repeating it.",
                                )
                              }
                            >
                              Continue
                            </button>
                          </div>
                        )}
                        {(!busy || index < messages.length - 1) && (
                          <div
                            className="followups"
                            aria-label="Suggested follow-up questions"
                          >
                            {(
                              message.metadata?.suggestions ||
                              contextualSuggestions(textOf(message))
                            )
                              .slice(0, 3)
                              .map((question) => (
                                <button
                                  key={question}
                                  disabled={busy || cooldown > 0}
                                  onClick={() => ask(question)}
                                >
                                  {question}
                                  <ArrowUpRight size={13} />
                                </button>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.article>
                ))}
                {busy && !hasReply && (
                  <div className="typing" role="status">
                    <span />
                    <span />
                    <span />
                    <span className="sr-only">Thinking…</span>
                  </div>
                )}
                {busy && retrying && (
                  <p className="retry-status" role="status">
                    {retrying}
                  </p>
                )}
                {error && (
                  <div className="chat-error" role="alert">
                    <strong>Let’s try that again.</strong>
                    <p>{friendlyError}</p>
                    <div className="error-actions">
                      <button
                        disabled={busy || cooldown > 0}
                        onClick={() => retry()}
                      >
                        {cooldown
                          ? `Retry in ${cooldown}s`
                          : "Retry this message"}
                      </button>
                      {hasReply && (
                        <button
                          onClick={() =>
                            ask(
                              "Continue your previous answer from where it stopped.",
                            )
                          }
                        >
                          Continue
                        </button>
                      )}
                      <button
                        className="icon-button"
                        aria-label="Dismiss error"
                        onClick={clearError}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={`composer-area ${started ? "docked" : "landing-composer"}`}
      >
        {started && (
          <div className="quick-questions">
            <button
              className="questions-toggle"
              onClick={() => setShowQuestions((v) => !v)}
            >
              {showQuestions ? "Hide" : "Show"} quick questions
            </button>
            {showQuestions && categories}
          </div>
        )}
        {notice && (
          <p className="input-notice" role="alert">
            {notice}
          </p>
        )}
        <form
          className={`composer ${input.includes("\n") ? "multiline" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <label className="sr-only" htmlFor="question">
            Ask Devansh a question
          </label>
          <textarea
            ref={inputRef}
            id="question"
            name="question"
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (notice) setNotice("");
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="Ask me anything…"
            autoComplete="off"
            disabled={busy || !ready}
            aria-describedby="chat-note"
            aria-invalid={input.length > MAX_INPUT}
          />
          {busy ? (
            <button
              type="button"
              className="send"
              aria-label="Stop generating"
              onClick={() => void stopReply()}
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              className="send"
              aria-label="Send question"
              disabled={!ready || input.length > MAX_INPUT}
            >
              <ArrowUp size={22} />
            </button>
          )}
        </form>
        {!started && categories}
        <p className="chat-note" id="chat-note">
          {input.length > 850
            ? `${input.length.toLocaleString()} / ${MAX_INPUT.toLocaleString()} characters`
            : cooldown
              ? `Another question in ${cooldown}s. You can still say hi.`
              : storageNotice ||
                "AI answers from my résumés. Chat saved on this device."}
        </p>
      </div>
      {!started && (
        <div className="background-name" aria-hidden="true">
          {profile.name}
        </div>
      )}
    </main>
  );
}
