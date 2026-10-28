import { ExerciseAnimation } from '../animation/ExerciseAnimation';
import { useEffect, useRef, useState } from 'react';
import { LIMITS } from '@shared/constants';
import { formatClock } from '@shared/training';
import type { SessionExerciseDTO, SessionSetDTO } from '@shared/types';
import { Badge, Button, Icon, IconButton, NumberField, Switch, TextAreaField } from '../../components/ui';
import { primeAudio } from './alarm';
import { PlateCalculator } from './PlateCalculator';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { formatPrescription, formatPrevious, suggestionParams } from './format';
import type { ExercisePatch, SetPatch } from './queue';
import { SetRow } from './SetRow';

const ACTION_TONE = {
  first_time: 'info',
  increase_weight: 'success',
  increase_reps: 'success',
  increase_time: 'success',
  maintain: 'neutral',
  deload: 'warning',
  try_harder_variation: 'primary',
} as const;

export type SetDefaults = Pick<SessionSetDTO, 'reps' | 'weightKg' | 'durationSeconds'>;

/**
 * Values an untouched set is logged with when completed (also shown as placeholders):
 * weight carries over from the set above, else the target, else last time; reps and
 * time use the target, else the set above, else last time.
 */
export function setDefaults(exercise: SessionExerciseDTO): SetDefaults[] {
  const out: SetDefaults[] = [];
  exercise.sets.forEach((s, i) => {
    const above = i > 0 ? exercise.sets[i - 1]! : null;
    const aboveDefaults = i > 0 ? out[i - 1]! : null;
    const prev = exercise.previous?.sets[i] ?? null;
    out.push({
      weightKg: above?.weightKg ?? aboveDefaults?.weightKg ?? s.targetWeightKg ?? prev?.weightKg ?? null,
      reps: s.targetReps ?? above?.reps ?? prev?.reps ?? null,
      durationSeconds: s.targetSeconds ?? above?.durationSeconds ?? prev?.durationSeconds ?? null,
    });
  });
  return out;
}

export interface ExerciseCardProps {
  exercise: SessionExerciseDTO;
  onSetPatch(set: SessionSetDTO, patch: SetPatch, opts: { immediate: boolean }): void;
  onToggleComplete(set: SessionSetDTO, defaults: SetDefaults): void;
  onDeleteSet(set: SessionSetDTO): void;
  onAddSet(): void;
  addSetPending: boolean;
  onRemove(): void;
  removePending: boolean;
  onExercisePatch(patch: ExercisePatch): void;
  onShowInfo(): void;
  /** Replace this exercise with another one (only offered before any set is logged). */
  onSwap(): void;
  swapDisabled: boolean;
  /** Name of the following exercise, or null when this is the last one. */
  nextName: string | null;
  onNext(): void;
  onFinish(): void;
  /** Start an idle rest timer (offered only while no timer exists). */
  onStartRest?(): void;
}

/** The current exercise: prescription, coach suggestion, last performance and the sets table. */
export function ExerciseCard({
  exercise,
  onSetPatch,
  onToggleComplete,
  onDeleteSet,
  onAddSet,
  addSetPending,
  onRemove,
  removePending,
  onExercisePatch,
  onShowInfo,
  onSwap,
  swapDisabled,
  nextName,
  onNext,
  onFinish,
  onStartRest,
}: ExerciseCardProps) {
  const i18n = useI18n();
  const { t, lt, formatDate } = i18n;
  const { formatWeight } = useUnits();
  const tracking = exercise.exercise.trackingType;
  const name = lt(exercise.exercise.name);
  const hasLoad = exercise.sets.some((s) => (s.weightKg ?? 0) > 0 || (s.targetWeightKg ?? 0) > 0) || (exercise.previous?.sets.some((s) => (s.weightKg ?? 0) > 0) ?? false);
  const [addedWeight, setAddedWeight] = useState(hasLoad || (tracking === 'time' && exercise.exercise.equipment.length > 0));
  const showWeight = tracking === 'weight_reps' || addedWeight;
  const suggestion = exercise.suggestion;
  const done = exercise.sets.filter((s) => s.completed).length;
  // Without a visible weight column no load is suggested (or logged) for the set.
  const defaults = setDefaults(exercise).map((d) => (showWeight ? d : { ...d, weightKg: null }));
  const currentSetId = exercise.sets.find((s) => !s.completed)?.id ?? null;
  const allDone = exercise.sets.length > 0 && currentSetId == null;
  const [platesOpen, setPlatesOpen] = useState(false);
  const barbellLoad = tracking === 'weight_reps' && exercise.exercise.equipment.includes('barbell');
  // The set to log next comes first (one-handed use: it sits right under the exercise, never below the done rows).
  const indexed = exercise.sets.map((s, i) => ({ s, i }));
  const orderedSets = currentSetId ? [...indexed.filter((x) => x.s.id === currentSetId), ...indexed.filter((x) => x.s.id !== currentSetId)] : indexed;
  const listRef = useRef<HTMLOListElement>(null);
  const firstRender = useRef(true);

  // Keep the set to log next in view (one-handed use: no hunting for the next row).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!currentSetId) return;
    const row = listRef.current?.querySelector<HTMLElement>('.set-row-current');
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row?.scrollIntoView?.({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [currentSetId]);

  return (
    <article className="card exercise-card" aria-labelledby={`ex-${exercise.id}-title`}>
      <header className="exercise-card-header">
        <div className="exercise-card-title">
          <h2 id={`ex-${exercise.id}-title`} className="exercise-name">
            <button type="button" className="exercise-name-btn" onClick={onShowInfo} aria-label={t('session.exercise.instructions', { name })}>
              <span>{name}</span>
              <Icon name="info" size={18} />
            </button>
          </h2>
          <p className="small muted">
            {exercise.exercise.primaryMuscles.map((m) => t(`enums.muscle.${m}`)).join(' · ')}
            {' · '}
            {t('session.overview.setsDone', { done, total: exercise.sets.length })}
          </p>
        </div>
        <div className="row exercise-card-tools">
          {exercise.exercise.equipment.includes('barbell') && (
            <IconButton icon="dumbbell" label={t('session.plates.open')} onClick={() => setPlatesOpen(true)} />
          )}
          <IconButton
            icon="swap"
            label={swapDisabled ? t('session.exercise.swapLocked') : t('session.exercise.swap', { name })}
            onClick={onSwap}
            disabled={swapDisabled}
          />
          <IconButton icon="trash" label={t('session.exercise.remove')} onClick={onRemove} loading={removePending} />
        </div>
      </header>
      <div className="exercise-card-demo">
        <ExerciseAnimation exerciseId={exercise.exerciseId} muscles={exercise.exercise.primaryMuscles} size="hero" controls={false} label={name} />
      </div>

      <dl className="exercise-facts">
        <div>
          <dt>{t('session.exercise.target')}</dt>
          <dd>{formatPrescription(exercise, i18n, formatWeight)}</dd>
        </div>
        <div>
          <dt className="visually-hidden">{t('session.exercise.settings')}</dt>
          <dd className="muted">
            {onStartRest ? (
              <button type="button" className="exercise-rest-btn" onClick={() => { primeAudio(); onStartRest(); }}>
                <Icon name="timer" size={16} /> {t('session.exercise.rest', { time: formatClock(exercise.restSeconds) })}
              </button>
            ) : (
              <>
                <Icon name="timer" size={14} /> {t('session.exercise.rest', { time: formatClock(exercise.restSeconds) })}
              </>
            )}
          </dd>
        </div>
      </dl>

      <h3 className="visually-hidden">{t('session.sets.title')}</h3>
      <ol className="set-list" ref={listRef}>
        {orderedSets.map(({ s, i }) => (
          <SetRow
            key={s.id}
            current={s.id === currentSetId}
            set={s}
            tracking={tracking}
            showWeight={showWeight}
            previous={exercise.previous?.sets[i] ?? null}
            defaults={defaults[i]!}
            repRange={{ repMin: exercise.repMin, repMax: exercise.repMax }}
            flagMissingWeight={s.completed && barbellLoad && !(s.weightKg != null && s.weightKg > 0)}
            onPatch={(patch, opts) => onSetPatch(s, patch, opts)}
            onToggleComplete={() => onToggleComplete(s, defaults[i]!)}
            onDelete={() => onDeleteSet(s)}
          />
        ))}
      </ol>
      {allDone && (
        <div className="exercise-done" role="status">
          <p className="exercise-done-title">
            <Icon name="check" size={18} /> {t('session.exercise.allDone')}
          </p>
          {nextName ? (
            <Button variant="primary" iconEnd="chevronRight" onClick={onNext} block>
              {t('session.exercise.nextUp', { name: nextName })}
            </Button>
          ) : (
            <Button variant="primary" icon="check" onClick={onFinish} block>
              {t('session.exercise.finishUp')}
            </Button>
          )}
        </div>
      )}
      <Button icon="plus" onClick={onAddSet} loading={addSetPending} block>
        {t('session.sets.add')}
      </Button>
      {suggestion && (
        <div className="exercise-suggestion" role="note">
          <Badge tone={ACTION_TONE[suggestion.action]} icon="sparkles">
            {t(`session.progression.actions.${suggestion.action}`)}
          </Badge>
          <p className="small">{i18n.tx(`session.progression.reasons.${suggestion.reasonCode}`, suggestionParams(suggestion, i18n, formatWeight), '')}</p>
        </div>
      )}

      <div className="exercise-previous small">
        {exercise.previous ? (
          <>
            <strong>{t('session.exercise.lastTime', { date: formatDate(exercise.previous.date) })}: </strong>
            <span>{formatPrevious(exercise.previous, tracking, i18n, formatWeight)}</span>
          </>
        ) : (
          <span className="muted">{t('session.exercise.noPrevious')}</span>
        )}
      </div>

      {tracking !== 'weight_reps' && <Switch label={t('session.exercise.addedWeight')} checked={addedWeight} onChange={setAddedWeight} />}


      <details className="exercise-settings">
        <summary>{t('session.exercise.settings')}</summary>
        <div className="stack-sm">
          <NumberField
            label={t('session.exercise.restSeconds')}
            value={exercise.restSeconds}
            min={LIMITS.restSecondsMin}
            max={LIMITS.restSecondsMax}
            unit={t('common.units.sec')}
            onChange={(v) => {
              if (v != null && Number.isInteger(v) && v >= LIMITS.restSecondsMin && v <= LIMITS.restSecondsMax) onExercisePatch({ restSeconds: v });
            }}
          />
          <TextAreaField
            label={t('session.exercise.notes')}
            value={exercise.notes}
            maxLength={500}
            rows={2}
            placeholder={t('session.exercise.notesPlaceholder')}
            onChange={(e) => onExercisePatch({ notes: e.target.value })}
          />
        </div>
      </details>
      <PlateCalculator open={platesOpen} onClose={() => setPlatesOpen(false)} initialWeightKg={(exercise.sets.find((x) => !x.completed) ?? exercise.sets[0])?.weightKg ?? (exercise.sets.find((x) => !x.completed) ?? exercise.sets[0])?.targetWeightKg ?? null} />
    </article>
  );
}
