import type { ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import type { Badge, LastPerformance } from '../../lib/liveSession.ts';

/** One compact line: what the progression engine suggests (or why the load is held). */
export function ProgressionBadge({ badge }: { badge: Badge }): ReactNode {
  const t = useT();
  switch (badge.kind) {
    case 'none': return null;
    case 'increase': return <span className="lv-line lv-up">{t('live.progression.increase', { kg: fmt.num(badge.kg, 2) })}</span>;
    case 'deload': return <span className="lv-line lv-warn">{t('live.progression.deload')}</span>;
    case 'hold': return <span className="lv-line">{t('live.progression.hold')}</span>;
    case 'frozen': return <span className="lv-line lv-warn">{t('live.progression.frozen')}</span>;
    case 'minorReps': return <span className="lv-line">{t('live.progression.minorReps', { max: badge.max })}</span>;
    case 'minorKeep': return <span className="lv-line">{t('live.progression.minorKeep')}</span>;
  }
}

/** One compact line: previous performance of this exercise. */
export function LastBadge({ last, timed }: { last: LastPerformance | null; timed: boolean }): ReactNode {
  const t = useT();
  if (!last) return <span className="lv-line">{t('live.noHistory')}</span>;
  const reps = last.repsMin === null || last.repsMax === null ? null : last.repsMin === last.repsMax ? `${last.repsMax}` : `${last.repsMin}–${last.repsMax}`;
  return (
    <span className="lv-line">
      {t('live.last')}: <span className="num">{last.count}×{timed || reps === null ? fmt.num(last.durationSec ?? 0) : reps}</span>
      {timed || reps === null ? <> {t('unit.sec')}</> : null}
      {!timed && last.weightKg ? <> · <span className="num">{fmt.num(last.weightKg, 2)}</span> {t('unit.kg')}</> : null}
    </span>
  );
}
