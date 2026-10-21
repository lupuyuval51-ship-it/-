"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useT } from "@/components/I18nProvider";
import { ANGLE_RANGE, LEVER_SLIDER_MIN, leverBalanceDistance, leverTorque, projectilePath, projectileRange, type LeverSim, type ProjectileSim } from "@/lib/game/challenges/simulations";
import type { PublicChallenge } from "@/lib/game/challenges/grade";

type SimChallenge = Extract<PublicChallenge, { type: "simulation" }>;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCED).matches, () => false);

/**
 * The game's own "Reduce motion" switch (pause menu) puts `.reduce-motion` on the play screen. Its CSS stops CSS animations
 * and transitions, but not the SVG `<animateMotion>` of the flying ball, so the panel asks its host as well as the system.
 */
export const inCalmHost = (el: Pick<Element, "closest"> | null): boolean => el?.closest(".reduce-motion") != null;

const SPEED_STEP = 0.5;
const DISTANCE_STEP = 0.05;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Lowest value of the speed slider. A range input only stops on `min + k·step`, so with `min` 1 a top speed such as 22.3 could
 * never be chosen (the slider stops at 22) and a target only reachable at full speed was out of reach. The grid is laid from
 * the top speed down instead; for a whole or half top speed (every authored game) this is still 1.
 */
export function speedSliderMin(sim: Pick<ProjectileSim, "maxSpeed">): number {
  return round2(sim.maxSpeed - SPEED_STEP * Math.floor((sim.maxSpeed - 1) / SPEED_STEP + 1e-9));
}

/** The preview's "balanced": exactly the grader's rule (within the tolerance of the balance point), so it never says "balanced" for a wrong answer, or "heavier" for a right one. */
export function leverBalanced(sim: LeverSim, distance: number): boolean {
  return Math.abs(distance - leverBalanceDistance(sim)) <= sim.tolerance + 1e-9; // the grader's margin for floating-point error
}

/**
 * Pixels per metre on the lever drawing (beam 40…560, pivot at 300). 24 up to the usual 10 m; a longer lever (the schema
 * allows 20 m) is drawn smaller, so the weight the learner moves stays on the beam instead of sliding off the picture.
 */
export const leverScale = (sim: Pick<LeverSim, "maxDistance" | "leftDistance">): number => Math.min(24, 240 / Math.max(sim.maxDistance, sim.leftDistance, 1));
const projectileHit = (sim: ProjectileSim, angle: number, speed: number) => Math.abs(projectileRange(speed, angle, sim.gravity) - sim.targetDistance) <= sim.tolerance + 1e-9;

/**
 * Where the sliders start: on a value the slider can show (its step grid), and never on an answer that is already right, so
 * a lever that happens to balance at 5 m (equal weights, the left one at 5 m) or a target that the half-speed 45° shot hits
 * is not solved by pressing "check" without touching anything.
 */
export function simStart(sim: SimChallenge["sim"]): { angle: number; speed: number; distance: number } {
  if (sim.kind === "projectile") {
    const min = speedSliderMin(sim);
    const snap = (v: number) => Math.min(sim.maxSpeed, round2(min + Math.max(0, Math.round((v - min) / SPEED_STEP)) * SPEED_STEP));
    const first = snap(Math.round(sim.maxSpeed / 2));
    const speed = [first, snap(sim.maxSpeed / 4), sim.maxSpeed].find((s) => !projectileHit(sim, 45, s)) ?? first;
    return { angle: 45, speed, distance: 5 };
  }
  const top = round2(LEVER_SLIDER_MIN + Math.floor((sim.maxDistance - LEVER_SLIDER_MIN) / DISTANCE_STEP + 1e-9) * DISTANCE_STEP);
  const first = Math.min(top, 5);
  const balance = leverBalanceDistance(sim);
  const farEnd = Math.abs(top - balance) >= Math.abs(LEVER_SLIDER_MIN - balance) ? top : LEVER_SLIDER_MIN;
  const distance = [first, farEnd].find((d) => !leverBalanced(sim, d)) ?? first;
  return { angle: 45, speed: 10, distance };
}

/** Live physics preview. The preview uses the same public formulas; correctness is still decided by the server. */
export function SimulationPanel({ challenge, disabled, onChange }: { challenge: SimChallenge; disabled: boolean; onChange: (params: Record<string, number>) => void }) {
  const t = useT();
  const systemReduced = useReducedMotion();
  const [calmHost, setCalmHost] = useState(false);
  // the play screen's switch cannot change while a challenge is open (the pause menu replaces the panel), so one look on mount is enough
  const host = useCallback((el: HTMLDivElement | null) => { if (el) setCalmHost(inCalmHost(el)); }, []);
  const reduced = systemReduced || calmHost;
  const sim = challenge.sim;
  const [start] = useState(() => simStart(sim));
  const [angle, setAngle] = useState(start.angle);
  const [speed, setSpeed] = useState(start.speed);
  const [distance, setDistance] = useState(start.distance);

  useEffect(() => {
    onChange(sim.kind === "projectile" ? { angle, speed } : { distance });
  }, [angle, speed, distance, sim.kind, onChange]);

  if (sim.kind === "projectile") {
    const range = projectileRange(speed, angle, sim.gravity);
    const path = projectilePath(speed, angle, sim.gravity);
    const W = Math.max(sim.targetDistance * 1.25, range * 1.1, 20);
    const peak = Math.max(...path.map((p) => p.y), 5);
    const H = peak * 1.25;
    const sx = (x: number) => 20 + (x / W) * 560;
    const sy = (y: number) => 170 - (y / H) * 150;
    const d = path.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
    const flight = Math.min(2.2, Math.max(0.7, ((2 * speed * Math.sin((angle * Math.PI) / 180)) / sim.gravity) * 0.8));
    const hold = 0.8;
    const keyAt = (flight / (flight + hold)).toFixed(3);
    const tickStep = W > 60 ? 10 : 5;
    const ticks = Array.from({ length: Math.floor(W / tickStep) }, (_, i) => (i + 1) * tickStep);
    return (
      <div ref={host} className="space-y-3">
        <svg viewBox="0 0 600 190" className="w-full rounded-xl bg-ink-900" role="img" aria-label={t("a11y.sim.projectile", { d: range.toFixed(1), target: sim.targetDistance })} style={{ direction: "ltr" }}>
          <defs>
            <linearGradient id="lu-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0b1230" />
              <stop offset="1" stopColor="#1a2860" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="600" height="190" fill="url(#lu-sky)" rx="12" />
          <rect x="0" y="170" width="600" height="20" fill="#14204a" />
          <line x1="20" y1="170" x2="580" y2="170" stroke="#3a4a8f" strokeWidth="2" />
          {ticks.map((m) => (
            <g key={m}>
              <line x1={sx(m)} y1="170" x2={sx(m)} y2="176" stroke="#5b6bb0" strokeWidth="1.5" />
              <text x={sx(m)} y="187" fill="#8a97c9" fontSize="10" textAnchor="middle">{m}</text>
            </g>
          ))}
          <rect x={sx(sim.targetDistance - sim.tolerance)} y="160" width={Math.max(4, sx(sim.targetDistance + sim.tolerance) - sx(sim.targetDistance - sim.tolerance))} height="10" fill="#a3ff4f" opacity="0.85" rx="2" />
          <line x1={sx(sim.targetDistance)} y1="170" x2={sx(sim.targetDistance)} y2="138" stroke="#a3ff4f" strokeWidth="2" />
          <polygon points={`${sx(sim.targetDistance)},138 ${sx(sim.targetDistance) + 16},144 ${sx(sim.targetDistance)},150`} fill="#a3ff4f" />
          <polyline fill="none" stroke="#22e6ff" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" opacity="0.8" points={path.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")} />
          <circle cx={sx(range)} cy={170} r="5" fill="#ff4fd8" opacity="0.9" />
          <g transform={`translate(${sx(0)} 170) rotate(${-angle})`}>
            <rect x="-4" y="-6" width="38" height="12" rx="5" fill="#9aa6d4" />
            <rect x="26" y="-8" width="10" height="16" rx="3" fill="#6f7bb0" />
          </g>
          <circle cx={sx(0)} cy="170" r="9" fill="#2a3769" stroke="#9aa6d4" strokeWidth="2" />
          {!reduced && (
            <circle r="6" fill="#ffd23f" key={`${angle}-${speed}-${sim.gravity}`}>
              <animateMotion path={d} dur={`${(flight + hold).toFixed(2)}s`} keyPoints="0;1;1" keyTimes={`0;${keyAt};1`} calcMode="linear" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
        <p className="text-sm text-muted">{t("sim.target", { d: sim.targetDistance })} · {t("sim.gravity", { g: sim.gravity })}</p>
        <p className="text-sm font-medium text-neon" data-testid="predicted" role="status" aria-live="polite">{t("sim.range", { d: range.toFixed(1) })}</p>
        <label className="block space-y-1 text-sm">
          <span>{t("sim.angle")}: <b>{angle}°</b></span>
          <input type="range" min={ANGLE_RANGE.min} max={ANGLE_RANGE.max} value={angle} disabled={disabled} onChange={(e) => setAngle(Number(e.target.value))} className="h-11 w-full accent-[var(--color-neon)]" aria-label={t("sim.angle")} aria-valuetext={t("a11y.unit.deg", { n: angle })} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("sim.speed")}: <b>{t("sim.unit.mps", { n: speed })}</b></span>
          <input type="range" min={speedSliderMin(sim)} max={sim.maxSpeed} step={SPEED_STEP} value={speed} disabled={disabled} onChange={(e) => setSpeed(Number(e.target.value))} className="h-11 w-full accent-[var(--color-neon)]" aria-label={t("sim.speed")} aria-valuetext={t("a11y.unit.mps", { n: speed })} />
        </label>
      </div>
    );
  }

  const torque = leverTorque(sim, distance);
  const balanced = leverBalanced(sim, distance);
  // a balanced beam (as the grader counts it) lies level, so the picture never contradicts the "balanced" label under it
  const tilt = balanced ? 0 : Math.max(-14, Math.min(14, torque * 0.35));
  const px = leverScale(sim);
  // the drawing is left to right; a Hebrew unit label ("5 ק״ג") is drawn right to left inside it, so it reads in the right order
  const kg = (n: number) => { const text = t("sim.unit.kg", { n }); return { text, direction: /[\u0590-\u05FF]/.test(text) ? ("rtl" as const) : ("ltr" as const) }; };
  const leftKg = kg(sim.leftWeight), rightKg = kg(sim.rightWeight);
  return (
    <div ref={host} className="space-y-3">
      <svg viewBox="0 0 600 200" className="w-full rounded-xl bg-ink-900" role="img" aria-label={t("a11y.sim.lever", { state: balanced ? t("sim.lever.balanced") : torque > 0 ? t("sim.lever.leftHeavy") : t("sim.lever.rightHeavy") })} style={{ direction: "ltr" }}>
        <polygon points="300,170 280,195 320,195" fill="#2a3769" />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "300px 170px", transition: reduced ? "none" : "transform 0.6s cubic-bezier(0.3, 1.5, 0.5, 1)" }}>
          <rect x="40" y="162" width="520" height="10" rx="4" fill={balanced ? "#a3ff4f" : "#9aa6d4"} />
          <rect x={300 - sim.leftDistance * px - 24} y={162 - 18 - sim.leftWeight * 0.2} width="48" height={18 + sim.leftWeight * 0.2} fill="#ff4fd8" rx="4" />
          <text x={300 - sim.leftDistance * px} y="150" fontSize="13" fill="#fff" textAnchor="middle" direction={leftKg.direction}>{leftKg.text}</text>
          <rect x={300 + distance * px - 24} y={162 - 18 - sim.rightWeight * 0.2} width="48" height={18 + sim.rightWeight * 0.2} fill="#22e6ff" rx="4" />
          <text x={300 + distance * px} y="150" fontSize="13" fill="#fff" textAnchor="middle" direction={rightKg.direction}>{rightKg.text}</text>
        </g>
      </svg>
      <p className={balanced ? "text-sm font-semibold text-lime" : "text-sm font-medium text-neon"} data-testid="lever-state" aria-live="polite">
        {balanced ? t("sim.lever.balanced") : torque > 0 ? t("sim.lever.leftHeavy") : t("sim.lever.rightHeavy")}
      </p>
      <p className="text-sm text-muted">{t("sim.lever.left", { w: sim.leftWeight, d: sim.leftDistance })} · {t("sim.lever.right", { w: sim.rightWeight })}</p>
      <label className="block space-y-1 text-sm">
        <span>{t("sim.lever.distance")}: <b>{t("sim.unit.m", { n: distance })}</b></span>
        <input type="range" min={LEVER_SLIDER_MIN} max={sim.maxDistance} step={DISTANCE_STEP} value={distance} disabled={disabled} onChange={(e) => setDistance(Number(e.target.value))} className="h-11 w-full accent-[var(--color-neon)]" aria-label={t("sim.lever.distance")} aria-valuetext={t("a11y.unit.m", { n: distance })} />
      </label>
    </div>
  );
}
