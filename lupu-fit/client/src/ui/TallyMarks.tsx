import type { ReactNode } from 'react';

/**
 * Training-log tally: groups of five (four strokes + a diagonal slash). Completed marks use --text, the current
 * milestone mark uses --tally-active, remaining marks use --border. Never a ring.
 */
export function TallyMarks({ total, done, label }: { total: number; done: number; label: string }): ReactNode {
  const groups = Math.ceil(total / 5);
  const state = (i: number): 'done' | 'active' | 'rest' => (i < done ? (i === done - 1 ? 'active' : 'done') : 'rest');
  return (
    <div className="tally" role="img" aria-label={label}>
      {Array.from({ length: groups }, (_, g) => {
        const n = Math.min(5, total - g * 5);
        return (
          <svg key={g} className="tally-group" viewBox="0 0 48 36" aria-hidden="true" focusable="false">
            {Array.from({ length: Math.min(n, 4) }, (_, k) => <line key={k} className={state(g * 5 + k)} x1={6 + k * 10} y1="4" x2={6 + k * 10} y2="32" />)}
            {n === 5 ? <line className={state(g * 5 + 4)} x1="2" y1="28" x2="46" y2="8" /> : null}
          </svg>
        );
      })}
    </div>
  );
}
