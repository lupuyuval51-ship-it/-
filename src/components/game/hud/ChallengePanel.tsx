"use client";

import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, CircleCheck, CircleX, X } from "lucide-react";
import { useDir, useT } from "@/components/I18nProvider";
import { Badge, Button, cx } from "@/components/ui";
import type { Answer, PublicChallenge } from "@/lib/game/challenges/grade";
import type { Block } from "@/lib/game/spec/schema";
import { radioStep, radioTabIndex } from "@/lib/game/a11y/scene";
import { scrollCue } from "@/lib/layout";
import { useLayout } from "../useLayout";
import { Confetti } from "./Confetti";
import { safePadX } from "./hudLayout";
import { useDialogFocus } from "./useDialogFocus";
import { useKeyboardInset } from "./useKeyboardInset";
import { ProgramBuilder } from "./ProgramBuilder";
import { SimulationPanel } from "./SimulationPanel";
import { MathText } from "@/components/ui/MathText";
import { isArithmetic } from "@/lib/i18n/bidi";

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
    // (a line of plain arithmetic, such as an answer "4/8" or "2/3 = 4/6", is maths, not code)
    if (line.trim() && CODE_LINE.test(line) && CODE_HINT.test(line) && !isArithmetic(line)) code.push(line);
    else {
      if (line.trim() === "" && code.length) { code.push(""); continue; }
      flush();
      // a line of bare arithmetic keeps the direction around it (it lines up with a Hebrew prompt), drawn left to right inside
      if (line.trim()) out.push(<p key={`p${out.length}`} dir={isArithmetic(line) ? undefined : "auto"} className="whitespace-pre-wrap"><MathText text={line} /></p>);
    }
  }
  flush();
  return <div className={cx("space-y-1.5", className)}>{out}</div>;
}

/** Text of several lines (a revealed solution: one step or pair per line): maths inside a Hebrew line is drawn left to right, each line on its own. */
function MathLines({ text }: { text: string }) {
  return <>{text.split("\n").map((line, i) => <Fragment key={i}>{i > 0 && "\n"}<MathText text={line} /></Fragment>)}</>;
}

const blockText = (b: Block, t: ReturnType<typeof useT>, depth = 0): string[] => {
  const pad = "  ".repeat(depth);
  if (b.t === "move") return [pad + t("block.move")];
  if (b.t === "left") return [pad + t("block.left")];
  if (b.t === "right") return [pad + t("block.right")];
  if (b.t === "repeat") return [pad + t("block.repeat", { n: b.n }), ...b.body.flatMap((x) => blockText(x, t, depth + 1))];
  return [pad + t("block.if"), ...b.body.flatMap((x) => blockText(x, t, depth + 1)), pad + t("block.else"), ...b.else.flatMap((x) => blockText(x, t, depth + 1))];
};

/** The names a revealed simulation solution is written with: the same labels as its sliders, never the raw parameter keys. */
const SIM_PARAM_LABEL = { angle: "sim.angle", speed: "sim.speed", distance: "sim.lever.distance" } as const;

export function revealSummary(ch: PublicChallenge, reveal: Record<string, unknown>, t: ReturnType<typeof useT>): string {
  switch (ch.type) {
    case "choice": return ch.options.find((o) => o.id === reveal.optionId)?.text ?? "";
    case "numeric": return `${reveal.value}${ch.unit ? ` ${ch.unit}` : ""}`;
    case "sequence": return (reveal.order as string[]).map((id, i) => `${i + 1}. ${ch.items.find((x) => x.id === id)?.text ?? ""}`).join("\n");
    case "match": {
      // The pairs are written in the opaque ids this player was shown, where a term and its answer never share an id
      // (looking the answer up by the term's own id printed "term: " with nothing after it). A reveal without pairs
      // keeps the old lookup by the same id.
      const pairs = Array.isArray(reveal.pairs) ? (reveal.pairs as unknown[]) : [];
      const rightOf = (leftId: string) => {
        const pair = pairs.find((p): p is { leftId: unknown; rightId: unknown } => typeof p === "object" && p !== null && (p as { leftId?: unknown }).leftId === leftId);
        return pair ? pair.rightId : pairs.length ? undefined : leftId;
      };
      return ch.lefts.map((l) => `${l.text}: ${ch.rights.find((r) => r.id === rightOf(l.id))?.text ?? ""}`).join("\n");
    }
    case "program": return (reveal.program as Block[]).flatMap((b) => blockText(b, t)).join("\n");
    case "simulation": return Object.entries(reveal.params as Record<string, number>).map(([k, v]) => `${k in SIM_PARAM_LABEL ? t(SIM_PARAM_LABEL[k as keyof typeof SIM_PARAM_LABEL]) : k}: ${v}`).join(", ");
  }
}

/**
 * Reports whether part of the scrolling body is hidden below its fold, now and whenever that can change: a scroll, a new
 * window size, and a change of size of the body or of either column inside it. The answer column grows when the verdict,
 * the explanation or a hint is added under the last option; the body itself keeps its height then (it is already as tall
 * as the panel allows), so watching only the body and the question missed exactly the moment the cue is needed.
 * Returns the function that stops watching.
 */
export function watchBelowFold(el: HTMLElement, onChange: (below: boolean) => void): () => void {
  const update = () => onChange(scrollCue(el.scrollTop, el.clientHeight, el.scrollHeight).below);
  update();
  el.addEventListener("scroll", update, { passive: true });
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
  ro?.observe(el);
  for (const child of Array.from(el.children)) ro?.observe(child);
  window.addEventListener("resize", update);
  return () => {
    el.removeEventListener("scroll", update);
    ro?.disconnect();
    window.removeEventListener("resize", update);
  };
}

/**
 * The verdict of each slot of the order on screen. A wrong order comes back with one verdict per slot; once the player
 * takes items out, the rest move up and a slot's old verdict was about another item. A slot keeps its verdict only while
 * it still holds the item that was graded there (then the verdict is still exactly true); otherwise it has none.
 */
export function slotVerdicts(order: readonly string[], graded: readonly string[], inPlace: readonly boolean[]): (boolean | undefined)[] {
  return order.map((id, i) => (i < inPlace.length && graded[i] === id ? inPlace[i] : undefined));
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
  /** Shown inside a page (the practice screen) instead of covering the whole play screen: it is not lifted above the keyboard. */
  embedded?: boolean;
}

export function ChallengePanel({ challenge, stationLabel, result, hint, busy, onSubmit, onHint, onClose, embedded = false }: Props) {
  const t = useT();
  const resolved = result?.resolved ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
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
  // focus lands on the first answer control (not on "close"), is trapped inside the panel and returns to the HUD afterwards
  useDialogFocus(ref, '[role="radio"][tabindex="0"], input, [data-block], [data-item], [data-left]');
  // a wrong answer gives the panel a short shake (skipped when the player prefers reduced motion)
  // Only the scrolling body shakes: the close button and the footer stay put so a tap right after "check" still lands.
  useEffect(() => {
    const el = bodyRef.current;
    if (!result || result.correct || !el || typeof el.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || el.closest(".reduce-motion")) return;
    el.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-9px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }],
      { duration: 420, easing: "ease-in-out" },
    );
  }, [result]);

  // Scroll affordance: a fade + chevron shows while more content is hidden below the fold of the body.
  useEffect(() => {
    const el = bodyRef.current;
    return el ? watchBelowFold(el, setMoreBelow) : undefined;
  }, []);

  const submit = () => {
    if (!answer || busy || resolved) return;
    onSubmit(answer);
  };
  // One always-mounted live region: result and hint are announced even though their visible boxes appear later.
  const spoken = result ? t(result.correct ? "a11y.result.correct" : "a11y.result.incorrect", { feedback: result.feedback }) + (result.resolved ? "" : ` ${t(result.attemptsLeft === 1 ? "challenge.attemptsLeft.one" : "challenge.attemptsLeft", { n: result.attemptsLeft })}`) + (result.explanation ? ` ${t("challenge.explanation")}: ${result.explanation}` : "") : "";
  const setProgram = useCallback((program: Block[]) => setAnswer(program.length ? { type: "program", program } : null), []);
  const setSim = useCallback((params: Record<string, number>) => setAnswer({ type: "simulation", params }), []);

  const { shortLandscape } = useLayout();
  // On phones whose on-screen keyboard only covers the page (it does not resize it), the sheet lifts above the keyboard so
  // the answer field and the "Check" button stay visible while typing a number.
  const kb = useKeyboardInset();
  const lifted = kb > 0 && !embedded;
  // The sheet shrinks when the keyboard opens: keep the field being typed in inside the part of it that is still visible.
  useEffect(() => {
    if (!lifted) return;
    const el = document.activeElement;
    if (el instanceof HTMLElement && ref.current?.contains(el)) el.scrollIntoView({ block: "nearest" });
  }, [lifted, kb, ref]);
  // A phone held sideways has room for two panes: the question on one side, the answers (and the verdict) on the other,
  // each scrolling on its own. The robot and simulation widgets are wide, so they keep one column. Only classes change
  // between the layouts, never the element tree, so turning the phone does not reset a half-made answer.
  const split = shortLandscape && challenge.type !== "program" && challenge.type !== "simulation";
  return (
    <div className={cx("absolute inset-0 z-30 flex justify-center bg-ink-950/70 backdrop-blur-sm pointer-coarse:bg-ink-950/85 pointer-coarse:backdrop-blur-none", shortLandscape ? "items-center p-2" : "items-end p-0 sm:items-center sm:p-4")} style={{ ...(shortLandscape ? safePadX("0.5rem") : {}), ...(lifted ? { paddingBottom: kb, alignItems: "flex-end" } : {}) }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="challenge-title" data-testid="challenge-panel" data-challenge={challenge.id} data-type={challenge.type} data-compact={shortLandscape ? "1" : undefined} style={lifted ? { maxHeight: `calc(100dvh - ${kb}px - 0.5rem)` } : undefined} className={cx("lu-pop relative flex w-full max-w-2xl flex-col overflow-hidden border border-line bg-ink-800 shadow-e3 md:max-w-3xl", shortLandscape ? "max-h-[calc(100dvh-1rem)] rounded-2xl" : "max-h-[94dvh] rounded-t-3xl sm:rounded-3xl")}>
        {result?.correct && <Confetti />}
        <header className={cx("relative z-20 flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-line", shortLandscape ? "p-2.5" : "p-3 sm:p-4")}>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium text-neon">{stationLabel}</p>
            <h2 id="challenge-title" dir="auto" className={cx("font-bold", shortLandscape ? "text-base" : "text-base sm:text-lg")}>{challenge.title}</h2>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="violet">{t("challenge.level", { n: challenge.level })}</Badge>
              {!shortLandscape && <Badge>{t(`challengeType.${challenge.type}`)}</Badge>}
              {challenge.timeLimitSec && <Badge tone="amber">{t("challenge.timeLimit", { n: challenge.timeLimitSec })}</Badge>}
              {/* last, and on one line: a long concept used to wrap into a tall pill and push the question down on a small phone */}
              {!shortLandscape && <Badge className="min-w-0 max-w-full" title={`${t("challenge.concept")}: ${challenge.concept}`}><span dir="auto" className="truncate">{t("challenge.concept")}: {challenge.concept}</span></Badge>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} aria-label={t("common.close")} aria-keyshortcuts="Escape" data-testid="challenge-x" className="relative z-20 size-11 shrink-0 touch-manipulation !p-0"><X aria-hidden className="size-5" /></Button>
        </header>

        <div role="status" aria-live="polite" className="sr-only" data-testid="challenge-live">
          {spoken && <p key={`r-${result?.attemptsLeft}-${result?.correct}-${result?.feedback}`}>{spoken}</p>}
          {hint && <p>{t("challenge.hintShown")}: {hint}</p>}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={bodyRef} data-testid="challenge-body" className={split ? "grid min-h-0 flex-1 grid-cols-2 grid-rows-1 gap-3 overflow-hidden p-3" : cx("min-h-0 flex-1 overflow-y-auto overscroll-contain", shortLandscape ? "space-y-2 p-3" : "space-y-4 p-4")}>
          <div className={split ? "min-h-0 overflow-y-auto pe-1" : undefined} data-testid="challenge-question">
            <RichText text={challenge.prompt} />
          </div>

          <div className={split ? "min-h-0 space-y-2 overflow-y-auto ps-1" : cx(shortLandscape ? "space-y-2" : "space-y-4")} data-testid="challenge-answer">
            {challenge.type === "choice" && <ChoiceInput compact={shortLandscape} challenge={challenge} disabled={resolved || busy} result={result} onChange={(optionId) => setAnswer({ type: "choice", optionId })} />}
            {challenge.type === "numeric" && <NumericInput challenge={challenge} disabled={resolved || busy} onChange={(value) => setAnswer(value === null ? null : { type: "numeric", value })} onEnter={submit} />}
            {challenge.type === "sequence" && <SequenceInput challenge={challenge} disabled={resolved || busy} result={result} onChange={(order) => setAnswer(order ? { type: "sequence", order } : null)} />}
            {challenge.type === "match" && <MatchInput challenge={challenge} disabled={resolved || busy} result={result} onChange={(pairs) => setAnswer(pairs ? { type: "match", pairs } : null)} />}
            {challenge.type === "program" && <ProgramBuilder challenge={challenge} trail={trail} disabled={resolved || busy} onChange={setProgram} />}
            {challenge.type === "simulation" && <SimulationPanel challenge={challenge} disabled={resolved || busy} onChange={setSim} />}

            {hint && (
              <div className="rounded-xl border border-amber/40 bg-amber/10 p-3 text-sm" data-testid="hint" role="note">
                <b className="text-amber">{t("challenge.hintShown")}: </b>
                <span dir="auto"><MathText text={hint} /></span>
              </div>
            )}

            {result && (
              <div data-testid="result" className={cx("space-y-2 rounded-xl border p-3 text-sm", result.correct ? "border-lime/50 bg-lime/10" : "border-rose/50 bg-rose/10")}>
                <p className="font-semibold">
                  {result.correct ? <><CircleCheck aria-hidden className="inline size-4 align-[-2px]" /> {t("challenge.correct")}</> : <><CircleX aria-hidden className="inline size-4 align-[-2px]" /> {t("challenge.incorrect")}</>}
                  {result.pointsAwarded > 0 && <span className="ms-2 text-lime">{t("challenge.points", { n: result.pointsAwarded })}</span>}
                </p>
                <p dir="auto"><MathText text={result.feedback} /></p>
                {!result.resolved && <p className="text-muted">{t(result.attemptsLeft === 1 ? "challenge.attemptsLeft.one" : "challenge.attemptsLeft", { n: result.attemptsLeft })}</p>}
                {result.revealed && result.reveal && (
                  <div className="space-y-1 rounded-lg bg-ink-900 p-2">
                    <p className="text-xs text-amber">{t("challenge.revealed")}</p>
                    <pre dir="auto" className="whitespace-pre-wrap text-sm"><MathLines text={revealSummary(challenge, result.reveal, t)} /></pre>
                  </div>
                )}
                {result.explanation && (
                  <p dir="auto" className="rounded-lg bg-ink-900 p-2"><b className="text-neon">{t("challenge.explanation")}: </b><MathText text={result.explanation} /></p>
                )}
              </div>
            )}
          </div>
        </div>
        {moreBelow && (
          <div aria-hidden="true" data-testid="challenge-scroll-cue" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-10 items-end justify-center bg-gradient-to-t from-ink-800 via-ink-800/80 to-transparent pb-0.5 text-neon">
            <ChevronDown className="size-5 animate-bounce motion-reduce:animate-none" />
          </div>
        )}
        </div>

        <footer className={cx("relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-ink-800", shortLandscape ? "p-2" : lifted ? "p-3" : "p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]")}>
          {!resolved && challenge.hasHint && !hint ? <Button variant="ghost" size="sm" onClick={onHint} disabled={busy}>{t("challenge.hint")}</Button> : <span />}
          {resolved ? (
            <Button onClick={onClose} data-testid="challenge-close" className="touch-manipulation">{t("challenge.close")}</Button>
          ) : (
            <Button onClick={submit} disabled={!answer || busy} aria-busy={busy} data-testid="challenge-submit" className="touch-manipulation">{busy ? t("common.loading") : t("challenge.check")}</Button>
          )}
        </footer>
      </div>
    </div>
  );
}

// ───────────────────────── input widgets ─────────────────────────

function ChoiceInput({ challenge, compact = false, disabled, result, onChange }: { compact?: boolean; challenge: Extract<PublicChallenge, { type: "choice" }>; disabled: boolean; result: AnswerResult | null; onChange: (id: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [seen, setSeen] = useState<AnswerResult | null>(null);
  // Derived-state adjustment during render: remember which option the player had picked when a wrong result arrived.
  if (result !== seen) {
    setSeen(result);
    setLastWrong(result && !result.correct ? picked : null);
  }
  const revealed = result?.reveal?.optionId as string | undefined;
  const dir = useDir();
  const group = useRef<HTMLDivElement>(null);
  const checkedIndex = challenge.options.findIndex((o) => o.id === picked);
  const t = useT();
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
    <div ref={group} role="radiogroup" aria-label={challenge.title} className={cx("space-y-2")}>
      {challenge.options.map((o, idx) => {
        const isPicked = picked === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={isPicked}
            tabIndex={radioTabIndex(idx, checkedIndex)}
            disabled={disabled}
            data-option={o.id}
            onKeyDown={(e) => {
              const n = radioStep(e.key, idx, challenge.options.length, dir === "rtl");
              if (n === null) return;
              e.preventDefault();
              const next = challenge.options[n]!;
              setPicked(next.id);
              onChange(next.id);
              group.current?.querySelectorAll<HTMLElement>('[role="radio"]')[n]?.focus();
            }}
            onClick={() => { setPicked(o.id); onChange(o.id); }}
            className={cx("flex w-full items-start gap-3 rounded-xl border px-3 text-start text-sm transition-colors", compact ? "min-h-11 py-1.5" : "min-h-12 py-2.5",
              isPicked ? "border-neon bg-neon/10" : "border-line bg-ink-900 hover:border-neon/50",
              lastWrong === o.id && !isPicked && "border-rose/60",
              revealed === o.id && "border-lime bg-lime/10",
              result?.correct && isPicked && "border-lime bg-lime/10")}
          >
            <span aria-hidden="true" className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-xs font-bold leading-none", isPicked ? "border-neon bg-neon text-ink-950" : "border-muted text-muted")}>{idx + 1}</span>
            <RichText text={o.text} className="min-w-0 flex-1" />
            {revealed === o.id && <span className="sr-only">({t("challenge.correct")})</span>}
            {lastWrong === o.id && !isPicked && <span className="sr-only">({t("challenge.incorrect")})</span>}
          </button>
        );
      })}
    </div>
  );
}

function NumericInput({ challenge, disabled, onChange, onEnter }: { challenge: Extract<PublicChallenge, { type: "numeric" }>; disabled: boolean; onChange: (v: number | null) => void; onEnter: () => void }) {
  const t = useT();
  const [text, setText] = useState("");
  const unitId = useId();
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted">{t("challenge.numeric.label")}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          autoComplete="off"
          aria-describedby={challenge.unit ? unitId : undefined}
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
          className="w-44 max-w-full rounded-xl border border-line bg-ink-900 px-3 py-2.5 text-lg focus:border-neon focus:outline-none"
        />
        {challenge.unit && <span id={unitId} className="text-muted" dir="auto">{challenge.unit}</span>}
      </div>
    </label>
  );
}

function SequenceInput({ challenge, disabled, result, onChange }: { challenge: Extract<PublicChallenge, { type: "sequence" }>; disabled: boolean; result: AnswerResult | null; onChange: (order: string[] | null) => void }) {
  const t = useT();
  const [order, setOrder] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const focusNext = useRef<string | null>(null);
  const pool = challenge.items.filter((i) => !order.includes(i.id));
  // Derived-state adjustment during render: the order that a new result graded (the list is locked while it is checked).
  const [graded, setGraded] = useState<{ result: AnswerResult | null; order: string[] }>({ result: null, order: [] });
  if (result !== graded.result) setGraded({ result, order });
  const rawInPlace = result?.detail?.inPlace;
  const inPlace = Array.isArray(rawInPlace) ? (rawInPlace as boolean[]) : [];
  const verdicts = result && !result.correct ? slotVerdicts(order, graded.order, inPlace) : [];
  const update = (next: string[], spoken: string, focus: string) => { setOrder(next); setNote(spoken); focusNext.current = focus; onChange(next.length === challenge.items.length ? next : null); };
  // The button that was pressed leaves its list, so keyboard / TalkBack focus is handed to a sensible neighbour.
  useEffect(() => {
    const sel = focusNext.current;
    focusNext.current = null;
    if (sel) (root.current?.querySelector<HTMLElement>(sel) ?? root.current?.querySelector<HTMLElement>("[data-item], [data-order]"))?.focus();
  });
  return (
    <div className="space-y-3" ref={root}>
      <p className="text-sm text-muted">{t("challenge.sequence.help")}</p>
      <p role="status" aria-live="polite" className="sr-only">{note}</p>
      <ol className="space-y-1.5" aria-label={t("a11y.seq.order")}>
        {order.map((id, i) => {
          const item = challenge.items.find((x) => x.id === id)!;
          return (
            <li key={id}>
              <button type="button" disabled={disabled} data-order={id} aria-label={t("a11y.seq.item", { n: i + 1, text: item.text })} onClick={() => update(order.filter((x) => x !== id), t("a11y.seq.removed", { text: item.text }), `[data-item="${id}"]`)} className={cx("flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm", verdicts[i] === undefined ? "border-neon/50 bg-neon/10" : verdicts[i] ? "border-lime/60 bg-lime/10" : "border-rose/60 bg-rose/10")}>
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-700 text-xs">{i + 1}</span>
                <span aria-hidden dir="auto" className="min-w-0 whitespace-pre-wrap break-words font-mono"><MathText text={item.text} /></span>
              </button>
              {verdicts[i] !== undefined && <span className="sr-only">{t(verdicts[i] ? "challenge.correct" : "challenge.incorrect")}</span>}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("a11y.seq.pool")}>
        {pool.map((i) => (
          <button key={i.id} type="button" disabled={disabled} data-item={i.id} onClick={() => update([...order, i.id], t("a11y.seq.added", { n: order.length + 1, total: challenge.items.length, text: i.text }), "[data-item]")} className="min-h-11 rounded-xl border border-line bg-ink-900 px-3 py-2 text-start text-sm hover:border-neon/60">
            <span dir="auto" className="whitespace-pre-wrap break-words font-mono"><MathText text={i.text} /></span>
          </button>
        ))}
      </div>
      {order.length > 0 && !disabled && <Button type="button" variant="ghost" size="sm" onClick={() => update([], t("a11y.seq.cleared"), "[data-item]")}>{t("challenge.sequence.reset")}</Button>}
    </div>
  );
}

function MatchInput({ challenge, disabled, result, onChange }: { challenge: Extract<PublicChallenge, { type: "match" }>; disabled: boolean; result: AnswerResult | null; onChange: (pairs: { leftId: string; rightId: string }[] | null) => void }) {
  const t = useT();
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [left, setLeft] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const focusNext = useRef<string | null>(null);
  const right = (result?.detail?.right as Record<string, boolean> | undefined) ?? {};
  const palette = ["#22e6ff", "#ff4fd8", "#a3ff4f", "#ffc63d", "#8b5cf6", "#ff5c8a"];
  const usedRights = new Set(Object.values(pairs));
  const leftText = (id: string) => challenge.lefts.find((l) => l.id === id)?.text ?? "";
  const rightText = (id: string) => challenge.rights.find((r) => r.id === id)?.text ?? "";
  const emit = (p: Record<string, string>) => onChange(Object.keys(p).length === challenge.lefts.length ? Object.entries(p).map(([leftId, rightId]) => ({ leftId, rightId })) : null);
  const colorOf = (leftId: string) => palette[challenge.lefts.findIndex((l) => l.id === leftId) % palette.length]!;
  // A pressed button becomes disabled or changes role in the flow, so hand focus to the next thing the player needs.
  useEffect(() => {
    const sel = focusNext.current;
    focusNext.current = null;
    if (sel) (root.current?.querySelector<HTMLElement>(sel) ?? root.current?.querySelector<HTMLElement>("[data-left]"))?.focus();
  });
  return (
    <div className="space-y-3" ref={root}>
      <p className="text-sm text-muted">{t("challenge.match.help")}</p>
      <p role="status" aria-live="polite" className="sr-only">{note}</p>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-2" role="group" aria-label={t("a11y.match.terms")}>
          {challenge.lefts.map((l) => (
            <button key={l.id} type="button" disabled={disabled} data-left={l.id} data-paired={pairs[l.id] ? "1" : undefined} aria-pressed={left === l.id}
              onClick={() => { setLeft(l.id); setNote(t("a11y.match.pickLeft", { text: l.text })); focusNext.current = "[data-right]:not(:disabled)"; }} style={{ borderColor: pairs[l.id] ? colorOf(l.id) : undefined }}
              className={cx("min-h-11 w-full rounded-xl border px-3 py-2.5 text-start text-sm", left === l.id ? "border-neon bg-neon/10" : "border-line bg-ink-900", result && !result.correct && l.id in right && (right[l.id] ? "bg-lime/10" : "bg-rose/10"))}>
              <span dir="auto" className="break-words"><MathText text={l.text} /></span>
              {pairs[l.id] && <span className="sr-only"> ({t("a11y.match.pairedWith", { text: rightText(pairs[l.id]!) })})</span>}
              {result && !result.correct && l.id in right && <span className="sr-only"> ({t(right[l.id] ? "challenge.correct" : "challenge.incorrect")})</span>}
            </button>
          ))}
        </div>
        <div className="space-y-2" role="group" aria-label={t("a11y.match.answers")}>
          {challenge.rights.map((r) => {
            const owner = Object.entries(pairs).find(([, v]) => v === r.id)?.[0];
            return (
              <button key={r.id} type="button" disabled={disabled || !left || usedRights.has(r.id)} data-right={r.id}
                onClick={() => {
                  if (!left) return;
                  const next = { ...pairs, [left]: r.id };
                  setPairs(next);
                  setNote(t("a11y.match.paired", { left: leftText(left), right: r.text, n: Object.keys(next).length, total: challenge.lefts.length }));
                  focusNext.current = "[data-left]:not([data-paired])";
                  setLeft(null);
                  emit(next);
                }}
                style={{ borderColor: owner ? colorOf(owner) : undefined }}
                className="min-h-11 w-full rounded-xl border border-line bg-ink-900 px-3 py-2.5 text-start text-sm enabled:hover:border-neon/60 disabled:opacity-70">
                <span dir="auto" className="break-words"><MathText text={r.text} /></span>
                {owner && <span className="sr-only"> ({t("a11y.match.pairedWith", { text: leftText(owner) })})</span>}
              </button>
            );
          })}
        </div>
      </div>
      {Object.keys(pairs).length > 0 && !disabled && <Button type="button" variant="ghost" size="sm" data-testid="match-reset" onClick={() => { setPairs({}); setLeft(null); setNote(t("a11y.match.cleared")); focusNext.current = "[data-left]"; onChange(null); }}>{t("challenge.match.reset")}</Button>}
    </div>
  );
}
