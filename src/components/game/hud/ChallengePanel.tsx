"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Badge, Button, cx } from "@/components/ui";
import type { Answer, PublicChallenge } from "@/lib/game/challenges/grade";
import type { Block } from "@/lib/game/spec/schema";
import { Confetti } from "./Confetti";
import { ProgramBuilder } from "./ProgramBuilder";
import { SimulationPanel } from "./SimulationPanel";

export interface AnswerResult {
  correct: boolean;
  feedback: string;
  detail?: Record<string, unknown>;
  resolved: boolean;
  revealed: boolean;
  pointsAwarded: number;
  attemptsLeft: number;
  explanation?: string;
  reveal?: Record<string, unknown>;
}

const CODE_LINE = /^[\s\w'"()[\]{}.,:;=<>+\-*/%!&|#\\^~@$?]*$/;
const CODE_HINT = /[=()<>:+*/[\]{}]|^\s{2,}\S/;

/** Prompts may mix prose and code (in any language): code lines render left-to-right in a monospace block. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let code: string[] = [];
  const flush = () => {
    if (code.length) {
      out.push(<pre key={`c${out.length}`} dir="ltr" className="my-2 overflow-x-auto rounded-lg bg-ink-900 p-3 text-start font-mono text-sm text-lime">{code.join("\n")}</pre>);
      code = [];
    }
  };
  for (const line of lines) {
    if (line.trim() && CODE_LINE.test(line) && CODE_HINT.test(line)) code.push(line);
    else {
      if (line.trim() === "" && code.length) { code.push(""); continue; }
      flush();
      if (line.trim()) out.push(<p key={`p${out.length}`} dir="auto" className="whitespace-pre-wrap">{line}</p>);
    }
  }
  flush();
  return <div className={cx("space-y-1.5", className)}>{out}</div>;
}

const blockText = (b: Block, t: ReturnType<typeof useT>, depth = 0): string[] => {
  const pad = "  ".repeat(depth);
  if (b.t === "move") return [pad + t("block.move")];
  if (b.t === "left") return [pad + t("block.left")];
  if (b.t === "right") return [pad + t("block.right")];
  if (b.t === "repeat") return [pad + t("block.repeat", { n: b.n }), ...b.body.flatMap((x) => blockText(x, t, depth + 1))];
  return [pad + t("block.if"), ...b.body.flatMap((x) => blockText(x, t, depth + 1)), pad + t("block.else"), ...b.else.flatMap((x) => blockText(x, t, depth + 1))];
};

function revealSummary(ch: PublicChallenge, reveal: Record<string, unknown>, t: ReturnType<typeof useT>): string {
  switch (ch.type) {
    case "choice": return ch.options.find((o) => o.id === reveal.optionId)?.text ?? "";
    case "numeric": return `${reveal.value}${ch.unit ? ` ${ch.unit}` : ""}`;
    case "sequence": return (reveal.order as string[]).map((id, i) => `${i + 1}. ${ch.items.find((x) => x.id === id)?.text ?? ""}`).join("\n");
    case "match": return ch.lefts.map((l) => `${l.text} → ${ch.rights.find((r) => r.id === l.id)?.text ?? ""}`).join("\n");
    case "program": return (reveal.program as Block[]).flatMap((b) => blockText(b, t)).join("\n");
    case "simulation": return Object.entries(reveal.params as Record<string, number>).map(([k, v]) => `${k}: ${v}`).join(", ");
  }
}

interface Props {
  challenge: PublicChallenge;
  stationLabel: string;
  result: AnswerResult | null;
  hint: string | null;
  busy: boolean;
  onSubmit: (a: Answer) => void;
  onHint: () => void;
  onClose: () => void;
}

export function ChallengePanel({ challenge, stationLabel, result, hint, busy, onSubmit, onHint, onClose }: Props) {
  const t = useT();
  const resolved = result?.resolved ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const trail = challenge.type === "program" ? ((result?.detail?.trail as { x: number; y: number }[] | undefined) ?? null) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" && !busy) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [busy, onClose]);
  useEffect(() => ref.current?.querySelector<HTMLElement>("button, input")?.focus(), []);
  // a wrong answer gives the panel a short shake (skipped when the player prefers reduced motion)
  useEffect(() => {
    const el = ref.current;
    if (!result || result.correct || !el || typeof el.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-9px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }],
      { duration: 420, easing: "ease-in-out" },
    );
  }, [result]);

  const submit = () => {
    if (!answer || busy || resolved) return;
    onSubmit(answer);
  };
  const setProgram = useCallback((program: Block[]) => setAnswer(program.length ? { type: "program", program } : null), []);
  const setSim = useCallback((params: Record<string, number>) => setAnswer({ type: "simulation", params }), []);

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="challenge-title" data-testid="challenge-panel" data-challenge={challenge.id} data-type={challenge.type} className="lu-pop relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-ink-800 shadow-2xl sm:rounded-3xl">
        {result?.correct && <Confetti />}
        <header className="flex items-start justify-between gap-3 border-b border-line p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-neon">{stationLabel}</p>
            <h2 id="challenge-title" dir="auto" className="text-lg font-bold">{challenge.title}</h2>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="violet">{t("challenge.level", { n: challenge.level })}</Badge>
              <Badge>{t("challenge.concept")}: {challenge.concept}</Badge>
              <Badge>{t(`challengeType.${challenge.type}`)}</Badge>
              {challenge.timeLimitSec && <Badge tone="amber">{t("challenge.timeLimit", { n: challenge.timeLimitSec })}</Badge>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} aria-label={t("common.close")}>✕</Button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <RichText text={challenge.prompt} />

          {challenge.type === "choice" && <ChoiceInput challenge={challenge} disabled={resolved || busy} result={result} onChange={(optionId) => setAnswer({ type: "choice", optionId })} />}
          {challenge.type === "numeric" && <NumericInput challenge={challenge} disabled={resolved || busy} onChange={(value) => setAnswer(value === null ? null : { type: "numeric", value })} onEnter={submit} />}
          {challenge.type === "sequence" && <SequenceInput challenge={challenge} disabled={resolved || busy} result={result} onChange={(order) => setAnswer(order ? { type: "sequence", order } : null)} />}
          {challenge.type === "match" && <MatchInput challenge={challenge} disabled={resolved || busy} result={result} onChange={(pairs) => setAnswer(pairs ? { type: "match", pairs } : null)} />}
          {challenge.type === "program" && <ProgramBuilder challenge={challenge} trail={trail} disabled={resolved || busy} onChange={setProgram} />}
          {challenge.type === "simulation" && <SimulationPanel challenge={challenge} disabled={resolved || busy} onChange={setSim} />}

          {hint && (
            <div className="rounded-xl border border-amber/40 bg-amber/10 p-3 text-sm" data-testid="hint">
              <b className="text-amber">{t("challenge.hintShown")}: </b>
              <span dir="auto">{hint}</span>
            </div>
          )}

          {result && (
            <div data-testid="result" className={cx("space-y-2 rounded-xl border p-3 text-sm", result.correct ? "border-lime/50 bg-lime/10" : "border-rose/50 bg-rose/10")} role="status" aria-live="polite">
              <p className="font-semibold">
                {result.correct ? `✓ ${t("challenge.correct")}` : `✗ ${t("challenge.incorrect")}`}
                {result.pointsAwarded > 0 && <span className="ms-2 text-lime">{t("challenge.points", { n: result.pointsAwarded })}</span>}
              </p>
              <p dir="auto">{result.feedback}</p>
              {!result.resolved && <p className="text-muted">{t("challenge.attemptsLeft", { n: result.attemptsLeft })}</p>}
              {result.revealed && result.reveal && (
                <div className="space-y-1 rounded-lg bg-ink-900 p-2">
                  <p className="text-xs text-amber">{t("challenge.revealed")}</p>
                  <pre dir="auto" className="whitespace-pre-wrap text-sm">{revealSummary(challenge, result.reveal, t)}</pre>
                </div>
              )}
              {result.explanation && (
                <p dir="auto" className="rounded-lg bg-ink-900 p-2"><b className="text-neon">{t("challenge.explanation")}: </b>{result.explanation}</p>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-3">
          {!resolved && challenge.hasHint && !hint ? <Button variant="ghost" size="sm" onClick={onHint} disabled={busy}>{t("challenge.hint")}</Button> : <span />}
          {resolved ? (
            <Button onClick={onClose} data-testid="challenge-close">{t("challenge.close")}</Button>
          ) : (
            <Button onClick={submit} disabled={!answer || busy} data-testid="challenge-submit">{busy ? t("common.loading") : t("challenge.check")}</Button>
          )}
        </footer>
      </div>
    </div>
  );
}

// ───────────────────────── input widgets ─────────────────────────

function ChoiceInput({ challenge, disabled, result, onChange }: { challenge: Extract<PublicChallenge, { type: "choice" }>; disabled: boolean; result: AnswerResult | null; onChange: (id: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [seen, setSeen] = useState<AnswerResult | null>(null);
  // Derived-state adjustment during render: remember which option the player had picked when a wrong result arrived.
  if (result !== seen) {
    setSeen(result);
    setLastWrong(result && !result.correct ? picked : null);
  }
  const revealed = result?.reveal?.optionId as string | undefined;
  // number keys pick an option (desktop shortcut)
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest("input, textarea, select")) return;
      const n = Number(e.key);
      const o = Number.isInteger(n) && n >= 1 ? challenge.options[n - 1] : undefined;
      if (o) {
        setPicked(o.id);
        onChange(o.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [challenge.options, disabled, onChange]);
  return (
    <div role="radiogroup" aria-label={challenge.title} className="space-y-2">
      {challenge.options.map((o, idx) => {
        const isPicked = picked === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={isPicked}
            disabled={disabled}
            data-option={o.id}
            onClick={() => { setPicked(o.id); onChange(o.id); }}
            className={cx("flex w-full min-h-12 items-start gap-3 rounded-xl border px-3 py-2.5 text-start text-sm transition-colors",
              isPicked ? "border-neon bg-neon/10" : "border-line bg-ink-900 hover:border-neon/50",
              lastWrong === o.id && !isPicked && "border-rose/60",
              revealed === o.id && "border-lime bg-lime/10",
              result?.correct && isPicked && "border-lime bg-lime/10")}
          >
            <span aria-hidden="true" className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold leading-none", isPicked ? "border-neon bg-neon text-ink-950" : "border-muted text-muted")}>{idx + 1}</span>
            <RichText text={o.text} />
          </button>
        );
      })}
    </div>
  );
}

function NumericInput({ challenge, disabled, onChange, onEnter }: { challenge: Extract<PublicChallenge, { type: "numeric" }>; disabled: boolean; onChange: (v: number | null) => void; onEnter: () => void }) {
  const t = useT();
  const [text, setText] = useState("");
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted">{t("challenge.numeric.label")}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          autoComplete="off"
          disabled={disabled}
          placeholder={t("challenge.numeric.placeholder")}
          value={text}
          data-testid="numeric-input"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            const n = Number(v.replace(",", ".").trim());
            onChange(v.trim() !== "" && Number.isFinite(n) ? n : null);
          }}
          className="w-44 rounded-xl border border-line bg-ink-900 px-3 py-2.5 text-lg focus:border-neon focus:outline-none"
        />
        {challenge.unit && <span className="text-muted" dir="auto">{challenge.unit}</span>}
      </div>
    </label>
  );
}

function SequenceInput({ challenge, disabled, result, onChange }: { challenge: Extract<PublicChallenge, { type: "sequence" }>; disabled: boolean; result: AnswerResult | null; onChange: (order: string[] | null) => void }) {
  const t = useT();
  const [order, setOrder] = useState<string[]>([]);
  const pool = challenge.items.filter((i) => !order.includes(i.id));
  const inPlace = (result?.detail?.inPlace as boolean[] | undefined) ?? [];
  const update = (next: string[]) => { setOrder(next); onChange(next.length === challenge.items.length ? next : null); };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("challenge.sequence.help")}</p>
      <ol className="space-y-1.5" aria-label="your order">
        {order.map((id, i) => {
          const item = challenge.items.find((x) => x.id === id)!;
          return (
            <li key={id}>
              <button type="button" disabled={disabled} onClick={() => update(order.filter((x) => x !== id))} className={cx("flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm", result && !result.correct && inPlace.length ? (inPlace[i] ? "border-lime/60 bg-lime/10" : "border-rose/60 bg-rose/10") : "border-neon/50 bg-neon/10")}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-700 text-xs">{i + 1}</span>
                <span dir="auto" className="whitespace-pre-wrap font-mono">{item.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2" aria-label="available items">
        {pool.map((i) => (
          <button key={i.id} type="button" disabled={disabled} data-item={i.id} onClick={() => update([...order, i.id])} className="rounded-xl border border-line bg-ink-900 px-3 py-2 text-start text-sm hover:border-neon/60">
            <span dir="auto" className="whitespace-pre-wrap font-mono">{i.text}</span>
          </button>
        ))}
      </div>
      {order.length > 0 && !disabled && <Button type="button" variant="ghost" size="sm" onClick={() => update([])}>{t("challenge.sequence.reset")}</Button>}
    </div>
  );
}

function MatchInput({ challenge, disabled, result, onChange }: { challenge: Extract<PublicChallenge, { type: "match" }>; disabled: boolean; result: AnswerResult | null; onChange: (pairs: { leftId: string; rightId: string }[] | null) => void }) {
  const t = useT();
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [left, setLeft] = useState<string | null>(null);
  const right = (result?.detail?.right as Record<string, boolean> | undefined) ?? {};
  const palette = ["#22e6ff", "#ff4fd8", "#a3ff4f", "#ffc63d", "#8b5cf6", "#ff5c8a"];
  const usedRights = new Set(Object.values(pairs));
  const emit = (p: Record<string, string>) => onChange(Object.keys(p).length === challenge.lefts.length ? Object.entries(p).map(([leftId, rightId]) => ({ leftId, rightId })) : null);
  const colorOf = (leftId: string) => palette[challenge.lefts.findIndex((l) => l.id === leftId) % palette.length]!;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("challenge.match.help")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {challenge.lefts.map((l) => (
            <button key={l.id} type="button" disabled={disabled} data-left={l.id} onClick={() => setLeft(l.id)} style={{ borderColor: pairs[l.id] ? colorOf(l.id) : undefined }}
              className={cx("w-full rounded-xl border px-3 py-2.5 text-start text-sm", left === l.id ? "border-neon bg-neon/10" : "border-line bg-ink-900", result && !result.correct && l.id in right && (right[l.id] ? "bg-lime/10" : "bg-rose/10"))}>
              <span dir="auto">{l.text}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {challenge.rights.map((r) => {
            const owner = Object.entries(pairs).find(([, v]) => v === r.id)?.[0];
            return (
              <button key={r.id} type="button" disabled={disabled || !left || usedRights.has(r.id)} data-right={r.id}
                onClick={() => { if (!left) return; const next = { ...pairs, [left]: r.id }; setPairs(next); setLeft(null); emit(next); }}
                style={{ borderColor: owner ? colorOf(owner) : undefined }}
                className="w-full rounded-xl border border-line bg-ink-900 px-3 py-2.5 text-start text-sm enabled:hover:border-neon/60 disabled:opacity-70">
                <span dir="auto">{r.text}</span>
              </button>
            );
          })}
        </div>
      </div>
      {Object.keys(pairs).length > 0 && !disabled && <Button type="button" variant="ghost" size="sm" onClick={() => { setPairs({}); setLeft(null); onChange(null); }}>{t("challenge.match.reset")}</Button>}
    </div>
  );
}
