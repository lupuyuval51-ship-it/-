/**
 * Tally — LUPIFIT's signature progress mark: training-journal tick marks, filled from the inline-start
 * (right-to-left in Hebrew). Done = ink, current = orange ("orange is now"), pending = muted.
 * Every mark is real data (a set, a workout this week, an onboarding step), never decoration.
 * Above MAX_MARKS it falls back to a thin meter so it stays legible.
 */
const MAX_MARKS = 40;

export function Tally({
  total,
  done,
  current,
  size = 'sm',
  label,
}: {
  total: number;
  done: number;
  /** Index (0-based) of the mark that is "now"; defaults to the first not-done mark when omitted. Pass null for none. */
  current?: number | null;
  size?: 'sm' | 'md';
  /** Accessible label. Omit when visible text next to the tally already says the same (it is then aria-hidden). */
  label?: string;
}) {
  const safeTotal = Math.max(0, Math.floor(total));
  const safeDone = Math.max(0, Math.min(safeTotal, Math.floor(done)));
  const now = current === undefined ? (safeDone < safeTotal ? safeDone : null) : current;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  if (safeTotal > MAX_MARKS) {
    const pct = safeTotal ? (safeDone / safeTotal) * 100 : 0;
    return (
      <span className={`tally tally-meter tally-${size}`} {...a11y}>
        <span className="tally-meter-fill" style={{ inlineSize: `${pct}%` }} />
      </span>
    );
  }
  return (
    <span className={`tally tally-${size}`} {...a11y}>
      {Array.from({ length: safeTotal }, (_, i) => (
        <span
          key={i}
          className={`tally-mark${i < safeDone ? ' tally-done' : ''}${i === now ? ' tally-now' : ''}${i % 5 === 4 && i < safeTotal - 1 ? ' tally-gap' : ''}`}
        />
      ))}
    </span>
  );
}
