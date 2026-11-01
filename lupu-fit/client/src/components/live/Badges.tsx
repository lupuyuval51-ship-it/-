import type { ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import type { Badge, LastPerformance } from '../../lib/liveSession.ts';
import { Tag } from '../../ui/kit.tsx';

export function ProgressionBadge({ badge }: { badge: Badge }): ReactNode {
  const t = useT();
  switch (badge.kind) {
    case 'none': return null;
    case 'increase': return <Tag tone="success">{t('live.progression.increase', { kg: fmt.num(badge.kg, 2) })}</Tag>;
    case 'deload': return <Tag tone="warning">{t('live.progression.deload')}</Tag>;
    case 'hold': return <Tag>{t('live.progression.hold')}</Tag>;
    case 'frozen': return <Tag tone="warning">{t('live.progression.frozen')}</Tag>;
    case 'minorReps': return <Tag>{t('live.progression.minorReps', { max: badge.max })}</Tag>;
    case 'minorKeep': return <Tag>{t('live.progression.minorKeep')}</Tag>;
  }
}

export function LastBadge({ last, timed }: { last: LastPerformance | null; timed: boolean }): ReactNode {
  const t = useT();
  if (!last) return <span className="small muted">{t('live.noHistory')}</span>;
  const reps = last.repsMin === null || last.repsMax === null ? null : last.repsMin === last.repsMax ? `${last.repsMax}` : `${last.repsMin}–${last.repsMax}`;
  return (
    <Tag>
      {t('live.last')}: <span className="num">{last.count}×{timed || reps === null ? fmt.num(last.durationSec ?? 0) : reps}</span>
      {timed || reps === null ? <> {t('unit.sec')}</> : null}
      {!timed && last.weightKg ? <> · <span className="num">{fmt.num(last.weightKg, 2)}</span> {t('unit.kg')}</> : null}
    </Tag>
  );
}
