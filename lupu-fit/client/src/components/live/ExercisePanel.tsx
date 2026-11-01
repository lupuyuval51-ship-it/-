import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ExerciseVideo } from '../ExerciseVideo.tsx';
import { exById, exName } from '../../data/content.ts';
import { useLang, useT } from '../../i18n/index.tsx';
import { fmt } from '../../i18n/index.tsx';
import type { Badge, Defaults, LastPerformance, LiveExercise } from '../../lib/liveSession.ts';
import { Tag } from '../../ui/kit.tsx';
import { LastBadge, ProgressionBadge } from './Badges.tsx';
import { SetLogger, SetRows, type LoggedValues, type RowData } from './SetLogger.tsx';

export function PrescriptionChips({ ex, timed }: { ex: LiveExercise; timed: boolean }): ReactNode {
  const t = useT(); const p = ex.planned;
  const reps = p.repsMin === p.repsMax ? `${p.repsMax}` : `${p.repsMin}–${p.repsMax}`;
  return (
    <div className="row-wrap live-chips">
      <Tag>{timed ? t('live.chip.setsSec', { sets: p.sets, sec: p.durationSec ?? 0 }) : t('live.chip.setsReps', { sets: p.sets, reps })}</Tag>
      {p.loadKg ? <Tag><span className="num">{fmt.num(p.loadKg, 2)}</span> {t('unit.kg')}</Tag> : null}
      {p.restSec > 0 ? <Tag>{t('live.chip.rest', { sec: p.restSec })}</Tag> : null}
      <Tag>{t('live.chip.rpe', { rpe: fmt.num(p.rpe, 1) })}</Tag>
    </div>
  );
}

/** Everything for the current exercise, top to bottom: video, name, prescription, history, progression, set rows, logger. */
export function ExercisePanel({ ex, rows, timed, showWeight, last, badge, defaults, maxRpe, primary, busy, canUndo, compactVideo, onLog, onUndo }: {
  ex: LiveExercise; rows: RowData[]; timed: boolean; showWeight: boolean; last: LastPerformance | null; badge: Badge; defaults: Defaults; maxRpe: number;
  primary: boolean; busy: boolean; canUndo: boolean; compactVideo?: boolean; onLog: (v: LoggedValues) => void; onUndo: () => void;
}): ReactNode {
  const t = useT(); const { lang } = useLang();
  const def = exById(ex.exerciseId);
  const name = def ? exName(def, lang) : ex.exerciseId;
  const plannedLabel = timed ? t('live.set.plannedSec', { sec: ex.planned.durationSec ?? 0 }) : t('live.set.plannedReps', { reps: ex.planned.repsMin === ex.planned.repsMax ? ex.planned.repsMax : `${ex.planned.repsMin}–${ex.planned.repsMax}` });
  return (
    <article className="stack" data-testid="exercise-panel">
      {compactVideo ? null : <ExerciseVideo exerciseId={ex.exerciseId} size="md" alt={name} {...(def ? { steps: lang === 'he' ? def.stepsHe : def.stepsEn } : {})} />}
      <h2 className="live-name"><Link to={`/exercises/${ex.exerciseId}`}>{name}</Link></h2>
      <PrescriptionChips ex={ex} timed={timed} />
      <div className="row-wrap">
        <LastBadge last={last} timed={timed} />
        <ProgressionBadge badge={badge} />
      </div>
      <SetRows rows={rows} plannedSets={ex.planned.sets} plannedLabel={plannedLabel} />
      <SetLogger key={ex.id} timed={timed} showWeight={showWeight} defaults={defaults} maxRpe={maxRpe} primary={primary} busy={busy} canUndo={canUndo} onLog={onLog} onUndo={onUndo} />
    </article>
  );
}
