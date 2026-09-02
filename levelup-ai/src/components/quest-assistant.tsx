"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  CircleHelp,
  LoaderCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useApp } from "./context";
import { api } from "@/lib/client";
import { questMessages } from "@/lib/quest-i18n";
import { Button, Notice } from "./ui";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isDemo?: boolean;
  source?: "hint" | "demo" | "ai" | "user";
};

function AnswerText({ content }: { content: string }) {
  return (
    <div className="quest-answer-text">
      {content
        .split(/(```[\s\S]*?```)/g)
        .filter(Boolean)
        .map((block, index) => {
          if (block.startsWith("```"))
            return (
              <pre key={index} dir="ltr">
                <code>
                  {block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")}
                </code>
              </pre>
            );
          return (
            <p key={index}>
              {block.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
                part.startsWith("**") ? (
                  <strong key={i}>{part.slice(2, -2)}</strong>
                ) : part.startsWith("`") ? (
                  <code key={i} dir="auto">
                    {part.slice(1, -1)}
                  </code>
                ) : (
                  part
                ),
              )}
            </p>
          );
        })}
    </div>
  );
}

export default function QuestAssistant({
  gameId,
  topic,
  inGame = false,
}: {
  gameId?: string;
  topic?: string;
  inGame?: boolean;
}) {
  const { locale, state, setState } = useApp();
  const q = questMessages[locale];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [demoProvider, setDemoProvider] = useState<boolean | null>(null);
  const [reload, setReload] = useState(0);
  const log = useRef<HTMLDivElement>(null);
  const scope = gameId || "general";
  const draftKey = `levelup-game-question:${state.user.id}:${scope}`;
  useEffect(() => {
    let current = true;
    setLoading(true);
    setMessages([]);
    setError("");
    setRemaining(null);
    setDemoProvider(null);
    try {
      setDraft(localStorage.getItem(draftKey) || "");
    } catch {
      setDraft("");
    }
    api(
      "/games/messages" +
        (gameId ? "?gameId=" + encodeURIComponent(gameId) : ""),
    )
      .then((r) => {
        if (current) {
          setMessages(r.messages || []);
          setRemaining(r.remaining ?? null);
          setDemoProvider(Boolean(r.isDemo));
        }
      })
      .catch((e) => {
        if (current) setError(e.message || q.chatError);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [draftKey, gameId, q.chatError, reload]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy]);
  const edit = (value: string) => {
    setDraft(value);
    try {
      localStorage.setItem(draftKey, value);
    } catch {
      /* Server messages remain available. */
    }
  };
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || remaining === 0) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/games/ask", {
        ...(gameId ? { gameId } : {}),
        message: text,
      });
      setMessages((previous) => [
        ...previous,
        { id: `local-${Date.now()}`, role: "user", content: text },
        { ...result.message, source: result.message.source || result.source },
      ]);
      setRemaining(result.remaining ?? null);
      if (result.state) setState(result.state);
      edit("");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const prompts = [q.promptExplain, q.promptRules, q.promptHint];
  return (
    <section
      className={"quest-chat-panel" + (inGame ? " in-game" : "")}
      aria-label={q.assistantLabel}
    >
      <div className="quest-chat-context">
        <span className="quest-assistant-mark">
          <Sparkles size={20} />
        </span>
        <div>
          <strong>{q.assistantLabel}</strong>
          <span>{topic || q.assistantReady}</span>
        </div>
        <span className="quest-connection">
          <Check size={13} />
          {demoProvider === null ? q.loading : demoProvider ? q.demo : "AI"}
        </span>
      </div>
      {inGame && <p className="quest-chat-paused">{q.pausedForChat}</p>}
      <div
        ref={log}
        className="quest-conversation"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        data-testid="game-conversation"
        aria-label={q.assistantLabel}
      >
        {loading ? (
          <div className="quest-inline-loading">
            <LoaderCircle className="spin" size={22} />
            <span>{q.loading}</span>
          </div>
        ) : messages.length ? (
          messages.map((message) => (
            <article
              className={"quest-message " + message.role}
              key={message.id}
            >
              <span className="quest-message-author">
                {message.role === "user" ? (
                  q.me
                ) : (
                  <>
                    <Sparkles size={14} />
                    {q.assistantLabel}
                  </>
                )}
              </span>
              <AnswerText content={message.content} />
              {message.role === "assistant" && (
                <span className="quest-message-source">
                  {message.source === "hint"
                    ? q.hintAnswer
                    : message.isDemo
                      ? q.demoAnswer
                      : q.liveAnswer}
                </span>
              )}
            </article>
          ))
        ) : (
          <div className="quest-chat-empty">
            <span className="quest-empty-symbol">
              <MessageCircle size={30} />
            </span>
            <h2>{q.emptyChat}</h2>
            <p>{q.assistantSubtitle}</p>
            <div className="quest-question-prompts">
              {prompts.map((prompt, index) => (
                <button type="button" key={prompt} onClick={() => edit(prompt)}>
                  <span>
                    {index === 0 ? (
                      <BookOpen size={18} />
                    ) : index === 1 ? (
                      <CircleHelp size={18} />
                    ) : (
                      <Sparkles size={18} />
                    )}
                  </span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {busy && (
          <div className="quest-thinking" role="status">
            <LoaderCircle className="spin" size={16} />
            {q.thinking}
          </div>
        )}
      </div>
      {error && (
        <Notice type="error">
          {error}
          <Button variant="tertiary" onClick={() => setReload((x) => x + 1)}>
            {q.retry}
          </Button>
        </Notice>
      )}
      {remaining === 0 && <Notice>{q.noMessages}</Notice>}
      <form className="quest-composer" onSubmit={send}>
        <label htmlFor={"question-" + scope}>{q.questionLabel}</label>
        <div className="quest-composer-field">
          <textarea
            id={"question-" + scope}
            data-testid="game-question-input"
            value={draft}
            maxLength={1500}
            rows={2}
            placeholder={q.questionPlaceholder}
            onChange={(e) => edit(e.target.value)}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            data-testid="game-question-send"
            aria-label={q.send}
            title={q.send}
            disabled={!draft.trim() || busy || loading || remaining === 0}
          >
            {busy ? (
              <LoaderCircle className="spin" size={21} />
            ) : (
              <ArrowUp size={23} />
            )}
          </button>
        </div>
        <small>
          {remaining !== null ? (
            <>
              {q.messagesRemaining}: <b>{remaining}</b>
            </>
          ) : (
            q.assistantScope
          )}
        </small>
      </form>
    </section>
  );
}
