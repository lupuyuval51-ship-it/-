import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Prescription } from '@lupu-fit/shared';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';
import { nameOfExercise } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';

/** Line 1: sets × reps (or seconds) and the load. Line 2: rest and RPE. Every number is from the prescription itself. */
export function PrescriptionLine({ p, showLoad = true }: { p: Prescription; showLoad?: boolean }): ReactNode {
  const { t } = useLang();
  const reps = p.repsMin === p.repsMax ? `${p.repsMax}` : `${p.repsMin}–${p.repsMax}`;
  return (
    <span className="wk-presc">
      <span className="wk-presc-main">
        {p.durationSec ? <><span className="num">{p.sets} × {p.durationSec}</span> {t('unit.sec')}</> : <><span className="num">{p.sets} × {reps}</span> {t('unit.reps')}</>}
        {showLoad && p.loadKg ? <>{' · '}<span className="num">{p.loadKg}</span> {t('unit.kg')}</> : null}
      </span>
      <span className="small muted">{t('workouts.presc.rest', { sec: p.restSec })}{' · '}{t('workouts.presc.rpe', { rpe: p.rpe })}</span>
    </span>
  );
}

export function ExerciseLine({ exerciseId, children, actions, large = false, index }: { exerciseId: string; children?: ReactNode; actions?: ReactNode; large?: boolean; index?: number }): ReactNode {
  const { t, lang } = useLang();
  const name = nameOfExercise(exerciseId, lang);
  return (
    <div className="wk-ex">
      {index !== undefined ? <span className="wk-ex-no num" aria-hidden="true">{index}</span> : null}
      <Link to={`/exercises/${exerciseId}`} aria-label={t('workouts.detail.exerciseLink', { name })}><ExerciseVideoThumb exerciseId={exerciseId} alt={name} large={large} /></Link>
      <div className="wk-ex-body">
        <Link to={`/exercises/${exerciseId}`} className="wk-ex-name">{name}</Link>
        {children}
        {actions}
      </div>
    </div>
  );
}
