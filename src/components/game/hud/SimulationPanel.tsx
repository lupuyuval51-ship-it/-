"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useT } from "@/components/I18nProvider";
import { ANGLE_RANGE, leverTorque, projectilePath, projectileRange } from "@/lib/game/challenges/simulations";
import type { PublicChallenge } from "@/lib/game/challenges/grade";

type SimChallenge = Extract<PublicChallenge, { type: "simulation" }>;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCED).matches, () => false);

/** Live physics preview. The preview uses the same public formulas; correctness is still decided by the server. */
export function SimulationPanel({ challenge, disabled, onChange }: { challenge: SimChallenge; disabled: boolean; onChange: (params: Record<string, number>) => void }) {
  const t = useT();
  const reduced = useReducedMotion();
  const sim = challenge.sim;
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(sim.kind === "projectile" ? Math.round(sim.maxSpeed / 2) : 10);
  const [distance, setDistance] = useState(sim.kind === "lever" ? Math.min(sim.maxDistance, 5) : 5);

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
      <div className="space-y-3">
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
          <input type="range" min={ANGLE_RANGE.min} max={ANGLE_RANGE.max} value={angle} disabled={disabled} onChange={(e) => setAngle(Number(e.target.value))} className="h-10 w-full accent-[var(--color-neon)]" aria-label={t("sim.angle")} aria-valuetext={t("a11y.unit.deg", { n: angle })} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("sim.speed")}: <b>{speed} m/s</b></span>
          <input type="range" min={1} max={sim.maxSpeed} step={0.5} value={speed} disabled={disabled} onChange={(e) => setSpeed(Number(e.target.value))} className="h-10 w-full accent-[var(--color-neon)]" aria-label={t("sim.speed")} aria-valuetext={t("a11y.unit.mps", { n: speed })} />
        </label>
      </div>
    );
  }

  const torque = leverTorque(sim, distance);
  const tilt = Math.max(-14, Math.min(14, torque * 0.35));
  const balanced = Math.abs(torque) < 0.35;
  return (
    <div className="space-y-3">
      <svg viewBox="0 0 600 200" className="w-full rounded-xl bg-ink-900" role="img" aria-label={t("a11y.sim.lever", { state: balanced ? t("sim.lever.balanced") : torque > 0 ? t("sim.lever.leftHeavy") : t("sim.lever.rightHeavy") })} style={{ direction: "ltr" }}>
        <polygon points="300,170 280,195 320,195" fill="#2a3769" />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "300px 170px", transition: reduced ? "none" : "transform 0.6s cubic-bezier(0.3, 1.5, 0.5, 1)" }}>
          <rect x="40" y="162" width="520" height="10" rx="4" fill={balanced ? "#a3ff4f" : "#9aa6d4"} />
          <rect x={300 - sim.leftDistance * 24 - 24} y={162 - 18 - sim.leftWeight * 0.2} width="48" height={18 + sim.leftWeight * 0.2} fill="#ff4fd8" rx="4" />
          <text x={300 - sim.leftDistance * 24} y="150" fontSize="13" fill="#fff" textAnchor="middle">{sim.leftWeight} kg</text>
          <rect x={300 + distance * 24 - 24} y={162 - 18 - sim.rightWeight * 0.2} width="48" height={18 + sim.rightWeight * 0.2} fill="#22e6ff" rx="4" />
          <text x={300 + distance * 24} y="150" fontSize="13" fill="#fff" textAnchor="middle">{sim.rightWeight} kg</text>
        </g>
      </svg>
      <p className={balanced ? "text-sm font-semibold text-lime" : "text-sm font-medium text-neon"} data-testid="lever-state" aria-live="polite">
        {balanced ? t("sim.lever.balanced") : torque > 0 ? t("sim.lever.leftHeavy") : t("sim.lever.rightHeavy")}
      </p>
      <p className="text-sm text-muted">{t("sim.lever.left", { w: sim.leftWeight, d: sim.leftDistance })} · {t("sim.lever.right", { w: sim.rightWeight })}</p>
      <label className="block space-y-1 text-sm">
        <span>{t("sim.lever.distance")}: <b>{distance} m</b></span>
        <input type="range" min={0.5} max={sim.maxDistance} step={0.05} value={distance} disabled={disabled} onChange={(e) => setDistance(Number(e.target.value))} className="h-10 w-full accent-[var(--color-neon)]" aria-label={t("sim.lever.distance")} aria-valuetext={t("a11y.unit.m", { n: distance })} />
      </label>
    </div>
  );
}
