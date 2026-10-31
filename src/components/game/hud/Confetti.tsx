"use client";

const CONFETTI = ["#22e6ff", "#ff4fd8", "#a3ff4f", "#ffc63d", "#8b5cf6"];

/** A one-shot burst of paper confetti (pure CSS; positions are deterministic, so it renders identically on server and client). */
export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-testid="confetti">
      {Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
        const r = 140 + ((i * 53) % 150);
        return (
          <i key={i} className="lu-confetti" style={{ backgroundColor: CONFETTI[i % CONFETTI.length], "--dx": `${Math.cos(a) * r}px`, "--dy": `${Math.sin(a) * r * 0.8 - 40}px`, "--rot": `${(i * 97) % 540}deg`, animationDelay: `${(i % 5) * 20}ms` } as React.CSSProperties} />
        );
      })}
    </div>
  );
}
