"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { rewardBus } from "@/lib/bus";
import type { Reward } from "@/services/data/reducers";

interface Burst extends Reward {
  id: number;
}

let n = 0;

/** חגיגת הצלחה: טוסט XP קטן, ואנימציית קונפטי מלאה להישגים ולעליית רמה */
export function RewardHost() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    return rewardBus.on((rewards) => {
      const items = rewards.map((r) => ({ ...r, id: ++n }));
      setBursts((cur) => [...cur, ...items].slice(-4));
      if (rewards.some((r) => r.kind !== "xp")) setConfetti((c) => c + 1);
      items.forEach((b) => setTimeout(() => setBursts((cur) => cur.filter((x) => x.id !== b.id)), b.kind === "xp" ? 2800 : 5000));
    });
  }, []);

  return (
    <>
      {confetti > 0 && <Confetti key={confetti} />}
      <div className="pointer-events-none fixed inset-x-0 top-16 z-[95] flex flex-col items-center gap-2 px-4 lg:top-4" aria-live="polite">
        {bursts.map((b) => (
          <div
            key={b.id}
            role="status"
            data-testid={`reward-${b.kind}`}
            className={`flex animate-pop items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-glow ${b.kind === "xp" ? "bg-card" : "bg-gradient-to-l from-primary to-accent text-primary-foreground"}`}
          >
            {b.kind === "xp" ? <Zap className="size-5 text-warning" /> : b.kind === "level" ? <Sparkles className="size-5" /> : <Trophy className="size-5" />}
            <div>
              <p className="text-sm font-extrabold">{b.title}</p>
              {b.detail && <p className="text-xs opacity-80">{b.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const COLORS = ["#8b5cf6", "#06b6d4", "#3b82f6", "#f59e0b", "#10b981", "#ec4899"];

function Confetti() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2600);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[94] overflow-hidden">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 97) % 100}%`,
            background: COLORS[i % COLORS.length],
            animation: `confetti-fall ${1.6 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.06}s forwards`,
            transform: `rotate(${i * 40}deg)`,
          }}
        />
      ))}
      <style>{`@keyframes confetti-fall{to{transform:translateY(105vh) rotate(540deg);opacity:.9}}`}</style>
    </div>
  );
}
