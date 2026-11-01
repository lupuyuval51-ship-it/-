import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Prescription } from '@lupu-fit/shared';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';
import { nameOfExercise } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';

/** sets × reps (or seconds), rest, RPE and an optional load. Every number is from the prescription itself. */
export function PrescriptionLine({ p, showLoad = true }: { p: Prescription; showLoad?: boolean }): ReactNode {
  const { t } = useLang();
  const reps = p.repsMin === p.repsMax ? `${p.repsMax}` : `${p.repsMin}–${p.repsMax}`;
  return (
    <span className="small muted">
      {p.durationSec ? <><span className="num">{p.sets} × {p.durationSec}</span> {t('unit.sec')}</> : <><span className="num">{p.sets} × {reps}</span> {t('unit.reps')}</>}
      {' · '}{t('workouts.presc.rest', { sec: p.restSec })}
      {' · '}{t('workouts.presc.rpe', { rpe: p.rpe })}
      {showLoad && p.loadKg ? <>{' · '}<span className="num">{p.loadKg}</span> {t('unit.kg')}</> : null}
    </span>
  );
}

export function ExerciseLine({ exerciseId, children, actions }: { exerciseId: string; children?: ReactNode; actions?: ReactNode }): ReactNode {
  const { t, lang } = useLang();
  const name = nameOfExercise(exerciseId, lang);
  return (
    <div className="wk-ex">
      <Link to={`/exercises/${exerciseId}`} aria-label={t('workouts.detail.exerciseLink', { name })}><ExerciseVideoThumb exerciseId={exerciseId} alt={name} /></Link>
      <div className="wk-ex-body">
        <Link to={`/exercises/${exerciseId}`} className="wk-ex-name">{name}</Link>
        {children}
        {actions}
      </div>
    </div>
  );
}
