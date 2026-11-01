import type { ReactNode } from 'react';
import type { GeneratedPlan, GenerationNote } from '@lupu-fit/shared';
import { nameOfExercise } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';
import { Card } from '../../ui/kit.tsx';
import { ExerciseLine, PrescriptionLine } from './ExerciseLine.tsx';

/** Translate a generation note code into a sentence; exercise ids become localized names. */
export function noteText(n: GenerationNote, t: (k: string, p?: Record<string, string | number>) => string, lang: 'he' | 'en'): string {
  switch (n.code) {
    case 'exercise_swapped': return t('workouts.note.exercise_swapped', { from: nameOfExercise(n.from, lang), to: nameOfExercise(n.to, lang) });
    case 'exercise_dropped': return t('workouts.note.exercise_dropped', { from: nameOfExercise(n.from, lang) });
    case 'time_trimmed': return n.removed > 0 ? t('workouts.note.time_trimmed', { removed: n.removed }) : t('workouts.note.time_trimmed_sets');
    case 'slot_unfilled': return t('workouts.note.slot_unfilled', { day: t(`workouts.day.${n.day}`) });
    case 'recovery_day_added': return t('workouts.note.recovery_day_added');
    case 'minor_no_deficit': return t('workouts.note.minor_no_deficit');
  }
}

export function PlanNotes({ notes }: { notes: readonly GenerationNote[] }): ReactNode {
  const { t, lang } = useLang();
  if (notes.length === 0) return null;
  return (
    <div className="stack-sm">
      <strong>{t('workouts.gen.notes')}</strong>
      <ul className="wk-note-list small">{notes.map((n, i) => <li key={i}>{noteText(n, t, lang)}</li>)}</ul>
    </div>
  );
}

export function PlanPreview({ plan }: { plan: GeneratedPlan }): ReactNode {
  const { t } = useLang();
  return (
    <div className="stack">
      {plan.days.map((d, i) => (
        <Card key={i} as="article" className="wk-day">
          <div className="wk-day-title"><h3>{t('workouts.plan.dayTitle', { n: i + 1, name: t(`workouts.day.${d.day}`) })}</h3><span className="small muted">{t('workouts.unit.minutes', { n: d.estimatedMinutes })}</span></div>
          <ul className="wk-ex-list">
            {d.exercises.map((e, j) => <li key={j}><ExerciseLine exerciseId={e.exerciseId}><PrescriptionLine p={e.prescription} /></ExerciseLine></li>)}
          </ul>
        </Card>
      ))}
      <PlanNotes notes={plan.notes} />
    </div>
  );
}
