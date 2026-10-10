"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { ANGLE_RANGE, leverTorque, projectilePath, projectileRange } from "@/lib/game/challenges/simulations";
import type { PublicChallenge } from "@/lib/game/challenges/grade";

type SimChallenge = Extract<PublicChallenge, { type: "simulation" }>;

/** Live physics preview. The preview uses the same public formulas; correctness is still decided by the server. */
export function SimulationPanel({ challenge, disabled, onChange }: { challenge: SimChallenge; disabled: boolean; onChange: (params: Record<string, number>) => void }) {
  const t = useT();
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
    return (
      <div className="space-y-3">
        <svg viewBox="0 0 600 190" className="w-full rounded-xl bg-ink-900" role="img" aria-label="trajectory" style={{ direction: "ltr" }}>
          <line x1="20" y1="170" x2="580" y2="170" stroke="#2a3769" strokeWidth="2" />
          <rect x={sx(sim.targetDistance - sim.tolerance)} y="160" width={Math.max(4, sx(sim.targetDistance + sim.tolerance) - sx(sim.targetDistance - sim.tolerance))} height="10" fill="#a3ff4f" opacity="0.8" rx="2" />
          <text x={sx(sim.targetDistance)} y="154" fill="#a3ff4f" fontSize="13" textAnchor="middle">🎯</text>
          <polyline fill="none" stroke="#22e6ff" strokeWidth="3" points={path.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")} />
          <circle cx={sx(range)} cy={170} r="5" fill="#ff4fd8" />
        </svg>
        <p className="text-sm text-muted">{t("sim.target", { d: sim.targetDistance })} · {t("sim.gravity", { g: sim.gravity })}</p>
        <p className="text-sm font-medium text-neon" data-testid="predicted">{t("sim.range", { d: range.toFixed(1) })}</p>
        <label className="block space-y-1 text-sm">
          <span>{t("sim.angle")}: <b>{angle}°</b></span>
          <input type="range" min={ANGLE_RANGE.min} max={ANGLE_RANGE.max} value={angle} disabled={disabled} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-[var(--color-neon)]" aria-label={t("sim.angle")} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("sim.speed")}: <b>{speed} m/s</b></span>
          <input type="range" min={1} max={sim.maxSpeed} step={0.5} value={speed} disabled={disabled} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full accent-[var(--color-neon)]" aria-label={t("sim.speed")} />
        </label>
      </div>
    );
  }

  const torque = leverTorque(sim, distance);
  const tilt = Math.max(-14, Math.min(14, torque * 0.35));
  return (
    <div className="space-y-3">
      <svg viewBox="0 0 600 200" className="w-full rounded-xl bg-ink-900" role="img" aria-label="lever" style={{ direction: "ltr" }}>
        <polygon points="300,170 280,195 320,195" fill="#2a3769" />
        <g transform={`rotate(${tilt} 300 170)`}>
          <rect x="40" y="162" width="520" height="10" rx="4" fill="#9aa6d4" />
          <rect x={300 - sim.leftDistance * 24 - 24} y={162 - 18 - sim.leftWeight * 0.2} width="48" height={18 + sim.leftWeight * 0.2} fill="#ff4fd8" rx="4" />
          <text x={300 - sim.leftDistance * 24} y="150" fontSize="13" fill="#fff" textAnchor="middle">{sim.leftWeight} kg</text>
          <rect x={300 + distance * 24 - 24} y={162 - 18 - sim.rightWeight * 0.2} width="48" height={18 + sim.rightWeight * 0.2} fill="#22e6ff" rx="4" />
          <text x={300 + distance * 24} y="150" fontSize="13" fill="#fff" textAnchor="middle">{sim.rightWeight} kg</text>
        </g>
      </svg>
      <p className="text-sm text-muted">{t("sim.lever.left", { w: sim.leftWeight, d: sim.leftDistance })} · {t("sim.lever.right", { w: sim.rightWeight })}</p>
      <label className="block space-y-1 text-sm">
        <span>{t("sim.lever.distance")}: <b>{distance} m</b></span>
        <input type="range" min={0.5} max={sim.maxDistance} step={0.05} value={distance} disabled={disabled} onChange={(e) => setDistance(Number(e.target.value))} className="w-full accent-[var(--color-neon)]" aria-label={t("sim.lever.distance")} />
      </label>
    </div>
  );
}
