"use client";

import Link from "next/link";
import { Award, BookOpen, Circle, CircleCheck, Flame, Gem, LayoutTemplate, Pause } from "lucide-react";
import { NpcIcon } from "@/components/ui/icons";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Arrow, Badge, Button, ProgressBar, Stars, cx } from "@/components/ui";
import type { RenderProfile } from "@/config/graphics";
import type { Interactable } from "@/lib/game/engine/runtime";
import type { PublicSpec } from "@/lib/game/spec/public";
import type { Boss, Npc } from "@/lib/game/spec/schema";
import { bossProgress, missionUnlocked, objectiveProgress, type ClientState, type LearningSummary } from "@/lib/game/state/progress";
import { stickTravel, stickVector, TOUCH_METRICS } from "@/lib/layout";
import type { InputState } from "../input";
import { interactablePrompt } from "@/lib/game/a11y/scene";
import { useLayout } from "../useLayout";
import { Confetti } from "./Confetti";
import { applyDeadzone, bottomAboveControls, bottomEdge, controlsInsetStyle, landscapeStrip, safePadAll, safePadX } from "./hudLayout";
import { SPRINT_IDLE, isSprinting, sprintCancel, sprintPress, sprintRelease, sprintStickReleased, sprintToggle, type SprintState } from "./sprintLatch";
import { useDialogFocus } from "./useDialogFocus";

// ───────────────────────── toasts ─────────────────────────

export interface Toast {
  id: number;
  text: string;
  tone: "good" | "info" | "warn";
}

/** `top` (px) is the bottom edge of the top bar, measured by `TopBar`, so a toast never covers the status chips under it. */
export function Toasts({ toasts, top }: { toasts: Toast[]; top?: number }) {
  const { shortLandscape } = useLayout();
  return (
    <div className={cx("pointer-events-none absolute inset-x-0 z-20 flex flex-col items-center gap-2", top === undefined && (shortLandscape ? "top-12" : "top-16"))} style={{ ...safePadX("1rem"), ...(top === undefined ? {} : { top }) }} role="status" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className={cx("lu-pop max-w-full rounded-2xl border px-4 py-2 text-center text-sm font-semibold shadow-e2 backdrop-blur", x.tone === "good" ? "border-lime/50 bg-lime/15 text-lime" : x.tone === "warn" ? "border-amber/50 bg-amber/15 text-amber" : "border-neon/50 bg-ink-800/90 text-neon")}>
          {x.text}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── score popups + tutorial ─────────────────────────

export interface Popup {
  id: number;
  text: string;
  tone: "good" | "gold";
}

/** Floating "+100" style rewards above the middle of the screen. */
export function ScorePopups({ popups }: { popups: Popup[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[38%] z-20" aria-hidden>
      {popups.map((p, i) => (
        <span key={p.id} style={{ left: `${50 + (i % 3) * 6 - 6}%` }} className={cx("lu-float absolute text-3xl font-extrabold drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] sm:text-4xl", p.tone === "gold" ? "text-amber" : "text-lime")}>
          {p.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Title card shown for a few seconds when an area opens. The text lives in CSS (`content: attr(...)`), so it adds no
 * duplicate of the area name or mission title to the page's text.
 */
export function AreaBanner({ name, subtitle, calm = false, below }: { name: string; subtitle?: string; /** Reduced motion: the card just appears for a few seconds (the slide-in animation would otherwise be cut to nothing). */ calm?: boolean; /** Pixels from the top that the card must stay under (the top bar), so it never covers the HUD on a short screen. */ below?: number }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!calm) return;
    const id = setTimeout(() => setGone(true), 3200);
    return () => clearTimeout(id);
  }, [calm]);
  // Decorative title card: the area name is already announced by the top bar, so the card is hidden from assistive tech.
  return (
    <div aria-hidden="true" data-testid="area-banner" data-title={name} className="lu-banner z-20" style={{ ...(below === undefined ? {} : { top: `max(20%, ${below}px)` }), ...(calm ? { animation: "none", opacity: gone ? 0 : 1 } : {}) }}>
      <span className="lu-banner-title" dir="auto">{name}</span>
      {subtitle && <span className="lu-banner-sub" dir="auto">{subtitle}</span>}
    </div>
  );
}

/**
 * One-time, non-blocking hint card for new players.
 * Touch screens get a short card (three one-line tips) that sits just above the on-screen controls, or between them on a
 * phone held sideways, and only its button takes touches, so it never blocks the joystick or covers the middle of the world.
 */
export function TutorialCard({ touch, onDismiss }: { touch: boolean; onDismiss: () => void }) {
  const t = useT();
  const { shortLandscape, touchScale } = useLayout();
  if (!touch) {
    return (
      <div className={cx("pointer-events-none absolute z-20 flex justify-center", shortLandscape ? "bottom-3 start-3 justify-start" : "inset-x-0 bottom-48 px-4 sm:inset-x-auto sm:bottom-6 sm:start-4 sm:justify-start sm:px-0")} data-testid="tutorial-card" data-compact={shortLandscape ? "1" : undefined}>
        <div className="lu-pop pointer-events-auto w-full max-w-sm space-y-1.5 rounded-2xl border border-neon/40 bg-ink-900/85 p-3 shadow-e3 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-wide text-neon">{t("hud.tutorial.title")}</p>
          <ul className="space-y-1 text-xs text-muted">
            <li>{t("hud.tutorial.move")}</li>
            <li>{t("hud.tutorial.guide")}</li>
            <li>{t("hud.tutorial.interact")}</li>
          </ul>
          <div className="flex justify-end"><Button size="sm" onClick={onDismiss} data-testid="tutorial-ok">{t("hud.tutorial.ok")}</Button></div>
        </div>
      </div>
    );
  }
  const style = shortLandscape ? { ...landscapeStrip("compact"), bottom: bottomEdge(0.5) } : { bottom: bottomAboveControls(touchScale, 0.5) };
  return (
    <div className={cx("pointer-events-none absolute z-20 flex justify-center", !shortLandscape && "inset-x-0 px-3")} style={style} data-testid="tutorial-card" data-compact={shortLandscape ? "1" : undefined}>
      <div className="lu-pop w-full max-w-sm rounded-2xl border border-neon/40 bg-ink-900/85 px-3 py-2 shadow-e3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 text-xs font-bold uppercase tracking-wide text-neon">{t("hud.tutorial.title")}</p>
          <Button size="sm" onClick={onDismiss} data-testid="tutorial-ok" className="pointer-events-auto shrink-0">{t("hud.tutorial.ok")}</Button>
        </div>
        <ul className="space-y-0.5 text-[0.8125rem] leading-snug text-muted">
          <li>{t("hud.tutorial.move.touch")}</li>
          {!shortLandscape && <li>{t("hud.tutorial.guide.short")}</li>}
          <li>{t("hud.tutorial.interact.short", { label: t("touch.interact") })}</li>
        </ul>
      </div>
    </div>
  );
}

// ───────────────────────── top bar + missions ─────────────────────────

export function TopBar({ spec, client, areaName, score, maxScore, onPause, demo, engine = false, catalog = false, collect, onHeadBottom }: { spec: PublicSpec; client: ClientState; areaName: string; score: number; maxScore: number; onPause: () => void; demo: boolean; engine?: boolean; catalog?: boolean; collect?: { have: number; total: number }; /** Reports the bottom edge (px) of the folded bar (status chips and missions button), so toasts can sit right under it. */ onHeadBottom?: (px: number) => void }) {
  const t = useT();
  const head = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = head.current, btn = toggle.current;
    if (!el || !btn || !onHeadBottom) return;
    // the folded bar ends with the missions button; toasts start right under it
    const report = () => onHeadBottom(Math.round(btn.getBoundingClientRect().bottom));
    report();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(report);
    ro?.observe(el);
    ro?.observe(btn);
    window.addEventListener("resize", report);
    return () => { ro?.disconnect(); window.removeEventListener("resize", report); };
  }, [onHeadBottom]);
  // How the game was made is part of the game's honest label (demo template / built from the player's own material). It lives
  // inside the solid area card, not as a floating chip over the world, where it used to cover station labels.
  const source = demo ? { text: t("hud.demo"), hint: t("demo.badge.hint"), Icon: LayoutTemplate, tone: "bg-amber/15 text-amber" } : engine ? { text: t("engine.badge"), hint: t("engine.badge.hint"), Icon: BookOpen, tone: "bg-lime/15 text-lime" } : catalog ? { text: t("catalog.badge"), hint: t("catalog.badge.hint"), Icon: BookOpen, tone: "bg-neon/15 text-neon" } : null;
  // Phones start with the mission list folded so it does not cover the world; larger screens show it.
  const { shortLandscape, missionsOpen } = useLayout();
  const [open, setOpen] = useState(() => typeof window === "undefined" || missionsOpen);
  // Rotating to a short landscape screen folds the list; the player can still open it.
  const [lastShort, setLastShort] = useState(shortLandscape);
  if (lastShort !== shortLandscape) {
    setLastShort(shortLandscape);
    setOpen(missionsOpen);
  }
  const active = spec.missions.filter((m) => !client.missionsDone.includes(m.id) && missionUnlocked(client, m) && m.areaId === client.areaId);
  const shown = active.length ? active : spec.missions.filter((m) => !client.missionsDone.includes(m.id) && missionUnlocked(client, m)).slice(0, 1);
  return (
    <>
      {/* One column, so nothing is positioned by a fixed offset: with a 200% system font the rows simply grow and wrap
          instead of overlapping the mission list. Row 1: [back · area · score · pause], row 2: status chips, then missions. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex max-h-dvh flex-col items-start gap-1.5" style={{ ...safePadX(), paddingTop: `max(${shortLandscape ? "0.375rem" : "0.75rem"}, env(safe-area-inset-top, 0px))`, paddingBottom: shortLandscape ? "0.375rem" : "0.75rem" }} data-testid="hud-top" data-compact={shortLandscape ? "1" : undefined}>
        <div ref={head} className="pointer-events-none flex w-full flex-col items-start gap-1.5">
          <div className="flex w-full flex-wrap items-stretch gap-2">
            <Link href="/games" aria-label={t("hud.exit")} className="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-ink-900/80 backdrop-blur hover:bg-ink-700">
              <Arrow back />
            </Link>
            <div className="pointer-events-auto min-w-[7rem] flex-1 rounded-xl border border-line bg-ink-900/80 px-3 py-1.5 backdrop-blur sm:max-w-xs sm:flex-none">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-tight text-muted">
                {/* with a source label the card's first line is that label (the caption stays for screen readers, and shows again from the sm breakpoint up, where there is room), so the card is no taller */}
                <span className={cx("uppercase tracking-wide", source && "sr-only sm:not-sr-only")}>{t("hud.area")}</span>
                {source && (
                  <span title={source.hint} data-testid="source-badge" className={cx("inline-flex max-w-full items-start gap-1 rounded-md px-1.5 py-px text-xs font-semibold", source.tone)}>
                    <source.Icon aria-hidden className="mt-px hidden size-3 shrink-0 min-[24rem]:block" /><span dir="auto" className="min-w-0 break-words">{source.text}</span>
                  </span>
                )}
              </p>
              <p dir="auto" className="break-words text-sm font-semibold" data-testid="area-name">{areaName}</p>
            </div>
            <div className="pointer-events-auto shrink-0 rounded-xl border border-line bg-ink-900/80 px-3 py-1.5 text-end backdrop-blur" aria-live="off" role="group" aria-label={t("a11y.score", { score, max: maxScore })}>
              <p className="text-xs uppercase tracking-wide text-muted" aria-hidden>{t("hud.score")}</p>
              <p dir="ltr" aria-hidden className="whitespace-nowrap text-end text-sm font-bold tabular-nums" data-testid="score">{score}<span className="text-muted"> / {maxScore}</span></p>
            </div>
            <Button variant="secondary" size="sm" onClick={onPause} aria-label={t("hud.pause")} aria-keyshortcuts="Escape" data-testid="pause-button" className="pointer-events-auto min-w-11 shrink-0 self-stretch"><Pause aria-hidden className="size-4" /></Button>
          </div>
          <div className={cx("pointer-events-auto flex flex-wrap items-center gap-1.5 empty:hidden", shortLandscape && "shrink-0")}>
            {/* the chips are see-through by design; a dark plate under each keeps a station label behind it from garbling the text */}
            {collect && collect.total > 0 && (
              <span className="rounded-full bg-ink-900/85">
                <Badge tone="lime" data-testid="collect-count" title={t("hud.collect.count", { have: collect.have, total: collect.total })}>
                  <span className="sr-only">{t("hud.collect.count", { have: collect.have, total: collect.total })}</span>
                  <span aria-hidden className="inline-flex items-center gap-1"><Gem className="size-3.5" /> {collect.have}/{collect.total}</span>
                </Badge>
              </span>
            )}
            <BossHealth spec={spec} client={client} />
            {client.streak >= 2 && <span className="rounded-full bg-ink-900/85"><Badge tone="amber" className="lu-pop" data-testid="streak"><Flame aria-hidden className="size-3.5" /> {t("hud.streak", { n: client.streak })}</Badge></span>}
          </div>
        </div>
        <aside className="pointer-events-auto flex min-h-0 w-[min(20rem,calc(100vw-1.5rem))] flex-col" aria-label={t("hud.missions")}>
          <button ref={toggle} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="hud-missions" className="mb-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-ink-900/80 px-3 py-2 text-start text-sm font-semibold backdrop-blur">
            <span>{t("hud.missions")} · {client.missionsDone.length}/{spec.missions.length}</span>
            <span aria-hidden>{open ? "▾" : "▸"}</span>
          </button>
          {open && (
            <div id="hud-missions" className="min-h-0 space-y-2 overflow-y-auto rounded-xl border border-line bg-ink-900/80 p-3 backdrop-blur" style={{ maxHeight: "min(24rem, 50dvh)" }} data-testid="missions">
              <ProgressBar value={client.missionsDone.length} max={spec.missions.length} label={t("hud.missions")} />
              {shown.map((m) => (
                <div key={m.id} className="space-y-1">
                  <p dir="auto" className="text-sm font-semibold">{m.title}{m.optional && <Badge tone="violet" className="ms-2 align-middle" data-testid="side-mission">{t("mission.side")}</Badge>}</p>
                  <ul className="space-y-0.5 text-[0.8125rem] leading-snug">
                    {m.objectives.map((o, i) => {
                      const p = objectiveProgress(spec, client, m, i);
                      return (
                        <li key={i} dir="auto" className={cx("flex items-start gap-1.5", p.done ? "text-lime" : "text-muted")}>
                          {p.done ? <CircleCheck aria-hidden className="mt-0.5 size-3.5 shrink-0" /> : <Circle aria-hidden className="mt-0.5 size-3.5 shrink-0" />}
                          <span>{p.done && <span className="sr-only">{t("hud.mission.done")}: </span>}{o.text}{p.target > 1 && ` (${p.current}/${p.target})`}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

// ───────────────────────── objective marker ─────────────────────────

/**
 * Positioned imperatively by GuideProjector (every frame) — React only mounts it. It is placed with screen coordinates
 * (a pixel translate from the top-left corner), so it is anchored with the physical `left-0`: a logical `start-0` would
 * anchor it to the right edge in Hebrew and push the marker off screen.
 */
export function GuideMarker({ markerRef }: { markerRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={markerRef} aria-hidden data-testid="guide-marker" data-show="0" className="pointer-events-none absolute left-0 top-0 z-[5] opacity-0 transition-opacity duration-200" style={{ willChange: "transform" }}>
      <div className="flex flex-col items-center gap-1">
        <svg width="26" height="26" viewBox="0 0 24 24" className="drop-shadow-[0_0_6px_var(--color-neon)]"><path d="M12 3l9 17-9-5-9 5 9-17z" fill="var(--color-neon)" stroke="#06101f" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        <div dir="auto" className="max-w-[60vw] truncate rounded-full border border-neon/50 bg-ink-900/85 px-2.5 py-0.5 text-xs font-semibold text-neon backdrop-blur" />
      </div>
    </div>
  );
}

// ───────────────────────── interact prompt ─────────────────────────

export function InteractPrompt({ target, touch, onActivate }: { target: Interactable | null; touch: boolean; onActivate: () => void }) {
  const t = useT();
  const { shortLandscape, touchScale } = useLayout();
  if (!target) return null;
  const { text, enabled } = interactablePrompt(target, t);
  // Touch screens: the prompt floats just above the controls (portrait) or in the free strip between the stick and the
  // buttons (phone held sideways), so it is never half-hidden behind the joystick. Keyboard and mouse keep the old spots.
  const sideways = touch && shortLandscape;
  const style = !touch ? undefined : sideways ? { ...landscapeStrip("compact"), bottom: bottomEdge(0.75) } : { bottom: bottomAboveControls(touchScale, 0.5) };
  const place = !touch ? cx("inset-x-0 px-4", shortLandscape ? "bottom-3" : touchScale === "large" ? "bottom-36" : "bottom-28 sm:bottom-10") : sideways ? "" : "inset-x-0 px-3";
  return (
    <div className={cx("pointer-events-none absolute z-10 flex justify-center", place)} style={style}>
      <button type="button" onClick={onActivate} data-testid="interact-prompt" data-kind={target.kind} data-id={target.id} aria-keyshortcuts={touch ? undefined : "E"} aria-disabled={enabled ? undefined : true} className={cx("pointer-events-auto lu-pop flex min-h-12 max-w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-e2 backdrop-blur", enabled ? "border-neon/60 bg-ink-900/90 text-text" : "border-line bg-ink-900/80 text-muted")}>
        {!touch && <kbd aria-hidden className="grid size-7 place-items-center rounded-md border border-line bg-ink-700 font-mono text-xs">{t("prompt.key")}</kbd>}
        <span dir="auto" className="min-w-0 break-words text-start">{text}</span>
      </button>
    </div>
  );
}

// ───────────────────────── touch controls ─────────────────────────

/**
 * Joystick on the left, actions on the right, in both languages: like every game controller this layout is not mirrored
 * for right-to-left text (`direction: ltr` below), so the thumbs find the same controls whatever the UI language.
 * In every scale the "Use" button is the one in the bottom-right corner (landscape: Run, Jump, Use from left to right).
 * `ready` lights the action button when something can be used right now.
 */
export function TouchControls({ input, onInteract, hasJump, ready = false }: { input: InputState; onInteract: () => void; hasJump: boolean; ready?: boolean }) {
  const t = useT();
  const { touchScale } = useLayout();
  const m = TOUCH_METRICS[touchScale];
  const base = useRef<HTMLDivElement>(null);
  const knobEl = useRef<HTMLDivElement>(null);
  // the knob is moved straight on the element: a state update per pointer event re-rendered the controls ~60-120 times a second
  const geo = useRef<{ cx: number; cy: number; travel: number } | null>(null);
  const placeKnob = (x: number, y: number) => { if (knobEl.current) knobEl.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`; };
  const pid = useRef<number | null>(null);
  // "Run": hold to run while held, tap to keep running until the stick is let go (see sprintLatch.ts)
  const sprintState = useRef<SprintState>(SPRINT_IDLE);
  const [running, setRunning] = useState(false);
  const setSprint = (next: SprintState) => {
    sprintState.current = next;
    const on = isSprinting(next);
    input.sprintHeld = on;
    setRunning(on);
  };
  const move = (e: React.PointerEvent, fresh = false) => {
    // the stick does not move while it is held, so its box is measured once per touch (not twice per pointer event)
    if (fresh || !geo.current) {
      const r = base.current!.getBoundingClientRect();
      geo.current = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, travel: stickTravel(r.width, knobEl.current?.getBoundingClientRect().width ?? 56) };
    }
    const g = geo.current;
    const v = stickVector(e.clientX - g.cx, e.clientY - g.cy, g.travel);
    placeKnob(v.kx, v.ky);
    input.stick = applyDeadzone(v.x, v.y); // the knob follows the thumb exactly; only the steering ignores a resting thumb
  };
  const end = () => {
    pid.current = null;
    geo.current = null;
    placeKnob(0, 0);
    input.stick = { x: 0, y: 0 };
    setSprint(sprintStickReleased(sprintState.current));
  };
  // Landscape: keep the controls clear of the notch / rounded corners and the gesture bar.
  return (
    <div className={cx("pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between", m.pad)} style={{ direction: "ltr", ...controlsInsetStyle(touchScale) }} data-testid="touch-controls" data-scale={touchScale}>
      {/* the invisible ring around the stick (before:) widens the touch area by 12px, so a thumb that lands just outside still steers */}
      <div ref={base} role="application" aria-label={t("a11y.joystick")} className={cx("pointer-events-auto relative max-h-[34vw] max-w-[34vw] touch-none select-none rounded-full border border-line bg-ink-900/70 before:absolute before:-inset-3 before:rounded-full before:content-['']", m.stick)}
        onPointerDown={(e) => { if (pid.current !== null && pid.current !== e.pointerId) return; pid.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); move(e, true); }}
        onPointerMove={(e) => { if (pid.current === e.pointerId) move(e); }} onPointerUp={(e) => { if (pid.current === e.pointerId) end(); }} onPointerCancel={(e) => { if (pid.current === e.pointerId) end(); }} onLostPointerCapture={(e) => { if (pid.current === e.pointerId) end(); }}>
        <div ref={knobEl} className={cx("absolute left-1/2 top-1/2 rounded-full border border-neon/60 bg-neon/20", m.knob)} />
      </div>
      <div className={cx("pointer-events-auto flex items-end", touchScale === "compact" ? "flex-row" : "flex-col items-end", m.gap)}>
        <button type="button" aria-label={t("a11y.sprint")} aria-pressed={running} data-running={running ? "1" : "0"} className={cx("grid touch-none select-none place-items-center rounded-full border text-xs font-semibold active:bg-neon/30", m.sprint, running ? "border-neon bg-neon/25" : "border-line bg-ink-900/70")}
          onPointerDown={() => setSprint(sprintPress(sprintState.current, performance.now()))} onPointerUp={() => setSprint(sprintRelease(sprintState.current, performance.now()))} onPointerCancel={() => setSprint(sprintCancel(sprintState.current))} onLostPointerCapture={() => setSprint(sprintCancel(sprintState.current))}
          onClick={(e) => { if (e.detail === 0) setSprint(sprintToggle(sprintState.current)); }}>{t("touch.sprint")}</button>
        <div className={cx("flex", m.gap)}>
          {/* jump reacts on press (not on release) so a platform jump feels instant; a keyboard / screen-reader activation has detail 0 */}
          {hasJump && <button type="button" className={cx("grid touch-none select-none place-items-center rounded-full border border-line bg-ink-900/70 font-semibold active:bg-neon/30", m.action)} onPointerDown={() => input.queueJump()} onClick={(e) => { if (e.detail === 0) input.queueJump(); }}>{t("touch.jump")}</button>}
          <button type="button" className={cx("grid select-none place-items-center rounded-full border font-semibold active:bg-neon/40", m.action, ready ? "border-neon bg-neon/30 ring-2 ring-neon/60" : "border-neon/50 bg-neon/15")} onClick={onInteract} data-testid="touch-interact" data-ready={ready ? "1" : "0"}>{t("touch.interact")}</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── boss ─────────────────────────

/** Health bar of the boss being fought in the current area (visible once the battle has started). */
function BossHealth({ spec, client }: { spec: PublicSpec; client: ClientState }) {
  const t = useT();
  const boss = (spec.bosses ?? []).find((b) => b.areaId === client.areaId && (() => { const p = bossProgress(b, client); return p.done > 0 && !p.defeated; })());
  if (!boss) return null;
  const p = bossProgress(boss, client);
  const left = p.total - p.done;
  return (
    <div className="flex items-center gap-2 rounded-full border border-rose/50 bg-ink-900/85 px-3 py-1 text-xs backdrop-blur" data-testid="boss-health" data-left={left} data-total={p.total} role="img" aria-label={`${boss.name}: ${t("boss.health")} ${left}/${p.total}`}>
      <span dir="auto" className="max-w-[9rem] truncate font-semibold text-rose">{boss.name}</span>
      <span aria-hidden className="flex gap-0.5">{Array.from({ length: p.total }, (_, i) => <span key={i} className={cx("h-2 w-4 rounded-sm", i < left ? "bg-rose" : "bg-ink-600")} />)}</span>
    </div>
  );
}

/** What a boss says when the player walks up: who it is, how the battle goes and where the next round is. */
export function BossCard({ boss, client, stationLabel, onClose }: { boss: Boss; client: ClientState; stationLabel: (stationId: string) => string; onClose: () => void }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  useDialogFocus(box);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (["Escape", "Enter", "KeyE", "Space"].includes(e.code)) { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const p = bossProgress(boss, client);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm pointer-coarse:bg-ink-950/85 pointer-coarse:backdrop-blur-none" style={safePadAll()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={boss.name} data-testid="boss-card" className="lu-pop max-h-full w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl border border-rose/60 bg-ink-800 p-5 shadow-e3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-11 place-items-center rounded-full" style={{ background: boss.look.color + "33", border: `2px solid ${boss.look.color}`, color: boss.look.color }}><NpcIcon shape={boss.look.shape} className="size-6" /></span>
          <div>
            <h2 dir="auto" className="text-lg font-bold" style={{ color: boss.look.color }}>{boss.name}</h2>
            <p dir="auto" className="text-xs text-muted">{boss.title}</p>
          </div>
        </div>
        <p dir="auto" className="leading-relaxed">{p.defeated ? boss.defeatLine : boss.intro}</p>
        <div className="space-y-1.5 rounded-xl bg-ink-900 p-3 text-sm" data-testid="boss-progress" data-done={p.done} data-total={p.total}>
          <p className="flex items-center justify-between gap-2 font-semibold">
            <span>{t("boss.health")}</span>
            <span className="text-xs text-muted">{p.defeated ? t("boss.defeated") : t("boss.round", { n: p.done + 1, total: p.total })}</span>
          </p>
          <div aria-hidden className="flex gap-1">{boss.phaseStationIds.map((id, i) => <span key={id} className={cx("h-2.5 flex-1 rounded-sm", i < p.total - p.done ? "bg-rose" : "bg-ink-600")} />)}</div>
          {!p.defeated && <p dir="auto" className="text-muted">{t("boss.next", { n: p.nextPhase + 1 })} <span className="text-text">({stationLabel(boss.phaseStationIds[p.nextPhase]!)})</span></p>}
        </div>
        <div className="flex justify-end"><Button onClick={onClose} data-testid="boss-close">{t("boss.close")}</Button></div>
      </div>
    </div>
  );
}

// ───────────────────────── dialogue / lore ─────────────────────────

export function Dialogue({ npc, onClose, onLine }: { npc: Npc; onClose: () => void; onLine: () => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const { shortLandscape } = useLayout();
  const last = i >= npc.lines.length - 1;
  const box = useRef<HTMLDivElement>(null);
  useDialogFocus(box, "[data-testid=dialogue-next]");
  const next = () => (last ? onClose() : (setI(i + 1), onLine()));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
      else if (["Enter", "Space", "KeyE"].includes(e.code)) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div className={cx("absolute inset-x-0 bottom-0 z-30 flex justify-center", shortLandscape ? "p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" : "p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]")} style={safePadX(shortLandscape ? "0.5rem" : "0.75rem")}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={npc.name} data-testid="dialogue" className={cx("lu-pop w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-ink-800/95 shadow-e3 backdrop-blur", shortLandscape ? "max-h-[calc(100dvh-1rem)] space-y-1.5 p-3" : "space-y-3 p-4")}>
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 place-items-center rounded-full" style={{ background: npc.look.color + "33", border: `2px solid ${npc.look.color}`, color: npc.look.color }}><NpcIcon shape={npc.look.shape} className="size-5" /></span>
          <div>
            <p className="font-bold" dir="auto">{npc.name}</p>
            <p className="text-xs text-muted" dir="auto">{npc.role}</p>
          </div>
        </div>
        <p dir="auto" role="status" aria-live="polite" onClick={next} className={cx("cursor-pointer leading-relaxed", shortLandscape ? "text-sm" : "min-h-12 text-base")}>{npc.lines[i]}</p>
        {last && npc.hint && <p dir="auto" className="rounded-lg border border-amber/40 bg-amber/10 p-2 text-sm"><b className="text-amber">{t("dialogue.hint", { name: npc.name })}: </b>{npc.hint}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted">{i + 1}/{npc.lines.length}</span>
          <Button size="sm" onClick={next} data-testid="dialogue-next">{last ? t("dialogue.close") : t("dialogue.next")}</Button>
        </div>
      </div>
    </div>
  );
}

export function LoreCard({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  useDialogFocus(box);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (["Escape", "Enter", "KeyE", "Space"].includes(e.code)) { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm pointer-coarse:bg-ink-950/85 pointer-coarse:backdrop-blur-none" style={safePadAll()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} data-testid="lore-card" className="lu-pop max-h-full overflow-y-auto w-full max-w-lg space-y-3 rounded-2xl border border-violet/50 bg-ink-800 p-5 shadow-e3">
        <h2 dir="auto" className="text-lg font-bold text-violet-soft">{title}</h2>
        <p dir="auto" className="leading-relaxed">{text}</p>
        <div className="flex justify-end"><Button onClick={onClose}>{t("lore.close")}</Button></div>
      </div>
    </div>
  );
}

// ───────────────────────── pause + completion ─────────────────────────

export function PauseMenu({ profile, reduceMotion, onReduceMotion, sfx, music, guide, onSfx, onMusic, onGuide, onResume, onRestart, source, vibration, touch = false }: { profile: RenderProfile; reduceMotion: boolean; onReduceMotion: (v: boolean) => void; sfx: boolean; music: boolean; guide: boolean; onSfx: (v: boolean) => void; onMusic: (v: boolean) => void; onGuide: (v: boolean) => void; onResume: () => void; onRestart: () => void; /** A touch screen: the controls list names the on-screen buttons instead of keys. */ touch?: boolean; /** Only offered where the browser can vibrate and the host has no vibration setting of its own. */ vibration?: { on: boolean; onChange: (v: boolean) => void }; /** How the game was made; the full explanation is readable here (the top bar's tooltip is not reachable by touch). */ source?: "demo" | "engine" | "catalog" }) {
  const t = useT();
  const { shortLandscape } = useLayout();
  const [confirm, setConfirm] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDialogFocus(box, "[data-testid=resume-button]");
  // Safe centering: the outer box aligns to the start and the dialog uses `my-auto`, so a dialog taller than the
  // screen starts at the top edge (never clipped above it) and scrolls inside itself (`max-h-full`).
  const row = cx("flex min-h-11 items-center justify-between gap-3 rounded-xl bg-ink-900 px-3 text-sm", shortLandscape ? "py-1.5" : "py-2.5");
  const check = "size-5 shrink-0 accent-[var(--color-neon)]";
  const note = cx("rounded-xl bg-ink-900 px-3 text-sm text-muted", shortLandscape ? "py-1.5" : "py-2.5");
  return (
    <div data-testid="pause-backdrop" className="absolute inset-0 z-40 flex items-start justify-center overflow-hidden bg-ink-950/75 backdrop-blur-sm pointer-coarse:bg-ink-950/90 pointer-coarse:backdrop-blur-none" style={safePadAll(shortLandscape ? "0.5rem" : "1rem")}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={t("hud.paused")} data-testid="pause-menu" className={cx("lu-pop my-auto max-h-full w-full overflow-y-auto overscroll-contain rounded-3xl border border-line bg-ink-800 shadow-e3", shortLandscape ? "max-w-3xl space-y-2 p-3" : "max-w-md space-y-4 p-5 md:max-w-xl")}>
        <h2 className={cx("font-bold", shortLandscape ? "text-lg" : "text-xl")}>{t("hud.paused")}</h2>
        {/* a phone held sideways has no room for one tall column: toggles on one side, the rest (and "Resume") on the other */}
        <div className={cx(shortLandscape ? "grid grid-cols-2 items-start gap-3" : "space-y-4")}>
          <div className={cx(shortLandscape ? "space-y-1.5" : "space-y-2")}>
            <label className={row}><span>{t("hud.sound")}</span><input type="checkbox" checked={sfx} onChange={(e) => onSfx(e.target.checked)} className={check} /></label>
            <label className={row}><span>{t("hud.music")}</span><input type="checkbox" checked={music} onChange={(e) => onMusic(e.target.checked)} className={check} /></label>
            <label className={row}><span>{t("hud.guide")}</span><input type="checkbox" checked={guide} onChange={(e) => onGuide(e.target.checked)} className={check} data-testid="guide-toggle" /></label>
            {vibration && <label className={row}><span>{t("hud.vibration")}</span><input type="checkbox" checked={vibration.on} onChange={(e) => vibration.onChange(e.target.checked)} className={check} data-testid="vibration-toggle" /></label>}
            <label className={row}><span>{t("hud.reduceMotion")}</span><input type="checkbox" checked={reduceMotion} onChange={(e) => onReduceMotion(e.target.checked)} className={check} data-testid="motion-toggle" /></label>
            <p className={note} data-testid="quality-note">{t("hud.quality")}: <b className="text-text">{t(`tier.short.${profile.tier}`)}</b> — {t("hud.quality.granted", { tier: t(`tier.${profile.tier}`) })}</p>
            {source && <p dir="auto" className={note} data-testid="source-note"><b className="text-text">{source === "demo" ? t("hud.demo") : source === "catalog" ? t("catalog.badge") : t("engine.badge")}</b> — {source === "demo" ? t("demo.badge.hint") : source === "catalog" ? t("catalog.badge.hint") : t("engine.badge.hint")}</p>}
          </div>
          <div className={cx(shortLandscape ? "space-y-2" : "space-y-4")}>
            <details className="rounded-xl bg-ink-900 px-3 py-2 text-sm">
              <summary className={cx("cursor-pointer font-medium", shortLandscape ? "py-2" : "py-3")}>{t("hud.controls")}</summary>
              <ul className="mt-2 space-y-1 text-muted">
                {touch
                  ? (["move", "look", "jump", "sprint", "interact", "pause"] as const).map((k) => <li key={k}>{t(`hud.controls.touch.${k}`, { label: t(k === "jump" ? "touch.jump" : k === "sprint" ? "touch.sprint" : "touch.interact") })}</li>)
                  : (["move", "look", "jump", "sprint", "interact", "describe", "pause"] as const).map((k) => <li key={k}>{t(`hud.controls.${k}`)}</li>)}
              </ul>
            </details>
            {/* resume / restart / exit share one grid and fill their cells */}
            <div data-testid="pause-actions" className="grid grid-cols-2 gap-2">
              <Button onClick={onResume} data-testid="resume-button" className="col-span-2 w-full">{t("hud.resume")}</Button>
              {!confirm ? <Button variant="secondary" onClick={() => setConfirm(true)} className="w-full" data-testid="restart-button">{t("hud.restart")}</Button> : (
                <div className="col-span-full space-y-2 rounded-xl border border-rose/40 p-3 text-sm"><p>{t("hud.restart.confirm")}</p><div className="flex gap-2"><Button variant="danger" size="sm" onClick={onRestart}>{t("common.yes")}</Button><Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>{t("common.no")}</Button></div></div>
              )}
              <Link href="/games" data-testid="exit-link" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 text-center text-sm font-semibold hover:bg-text/10">{t("hud.exit")}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoneOverlay({ summary, gameId, sessionId, onReplay }: { summary: LearningSummary; gameId: string; sessionId: string; onReplay: () => void }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  useDialogFocus(box, "[data-testid=results-link]");
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center overflow-hidden bg-ink-950/80 backdrop-blur pointer-coarse:bg-ink-950/90 pointer-coarse:backdrop-blur-none" style={safePadAll("0.5rem")}>
      <Confetti />
      <div ref={box} role="dialog" aria-modal="true" aria-label={t("done.title")} data-testid="done-overlay" className="lu-pop my-auto max-h-full w-full max-w-md space-y-4 overflow-y-auto rounded-3xl border border-lime/40 bg-ink-800 p-6 text-center shadow-e3">
        <h2 className="text-2xl font-extrabold text-lime">{t("done.title")}</h2>
        <Stars n={summary.stars} size="lg" />
        <p className="text-lg" data-testid="final-score">{t("done.score", { score: summary.score, max: summary.maxScore })}</p>
        {summary.achievements.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">{summary.achievements.map((a) => <Badge key={a} tone="amber"><Award aria-hidden className="size-3.5" /> {t(`ach.${a}` as never)}</Badge>)}</div>
        )}
        <div className="flex flex-col gap-2">
          <Link href={`/games/${gameId}/results/${sessionId}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neon px-4 text-sm font-semibold text-ink-950 hover:brightness-110" data-testid="results-link">{t("done.results")}</Link>
          <Button variant="secondary" onClick={onReplay}>{t("done.replay")}</Button>
          <Link href="/games" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-text/10">{t("done.library")}</Link>
        </div>
      </div>
    </div>
  );
}
