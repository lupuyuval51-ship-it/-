import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LIMITS } from '@shared/constants';
import { isWorkoutFocus, WORKOUT_FOCUSES } from '@shared/schemas/workouts';
import type { ExerciseSummaryDTO, PlanWorkoutDTO, WorkoutPlanDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Badge, Button, Card, EmptyState, IconButton, Notice, NumberField, Segmented, SelectField, TextAreaField, TextField, useToast } from '../../components/ui';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { ExercisePicker } from '../exercises/ExercisePicker';
import { AlternativesModal } from './AlternativesModal';
import { formatRest } from './format';
import { updateWorkout } from './api';
import {
  REST_PRESETS,
  draftFromWorkout,
  isDraftDirty,
  moveItem,
  newDraftExercise,
  replaceDraftExercise,
  setMode,
  toUpdateInput,
  validateDraft,
  type DayDraft,
  type DraftExercise,
  type DraftValidation,
} from './draft';

const RPE_OPTIONS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const CUSTOM = 'custom';

/**
 * Edit mode for one workout day: a local draft (sets, reps or time, rest, RPE, target
 * weight, notes, order, replacements, additions, removals) saved in one PUT. Cancel
 * restores the saved day. `onDirtyChange` feeds the page's unsaved-changes guard.
 */
export function WorkoutDayEditor({
  plan,
  workout,
  dayNumber,
  onDone,
  onDirtyChange,
}: {
  plan: WorkoutPlanDTO;
  workout: PlanWorkoutDTO;
  dayNumber: number;
  onDone(): void;
  onDirtyChange(dirty: boolean): void;
}) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const toast = useToast();
  const queryClient = useQueryClient();
  const original = useMemo(() => draftFromWorkout(workout), [workout]);
  const [draft, setDraft] = useState<DayDraft>(original);
  const [showErrors, setShowErrors] = useState(false);
  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'replace'; key: string } | null>(null);
  const [alternativesFor, setAlternativesFor] = useState<string | null>(null);
  const dirty = isDraftDirty(draft, original);
  const validation = useMemo(() => validateDraft(draft), [draft]);
  const nameRef = useRef<HTMLInputElement>(null);

  // Keyboard/screen-reader users land in the editor that replaced the "Edit day" button.
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const save = useMutation({
    mutationFn: () => updateWorkout(plan.id, workout.id, toUpdateInput(draft)),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.plan(plan.id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.plans });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success(t('workouts.toasts.saved'));
      onDirtyChange(false);
      onDone();
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'workouts')),
  });

  const updateRow = (key: string, patch: Partial<DraftExercise> | ((row: DraftExercise) => DraftExercise)) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((x) => (x.key === key ? (typeof patch === 'function' ? patch(x) : { ...x, ...patch }) : x)) }));

  const onSubmit = () => {
    if (!validation.valid) {
      setShowErrors(true);
      return;
    }
    save.mutate();
  };

  const draftIds = draft.exercises.map((x) => x.exerciseId);
  const altRow = draft.exercises.find((x) => x.key === alternativesFor) ?? null;
  const focusOptions = [
    { value: '', label: t('workouts.editor.focusNone') },
    ...WORKOUT_FOCUSES.map((f) => ({ value: f, label: t(`workouts.focus.${f}`) })),
    ...(draft.focus && !isWorkoutFocus(draft.focus) ? [{ value: draft.focus, label: draft.focus }] : []),
  ];
  const atLimit = draft.exercises.length >= LIMITS.exercisesPerWorkoutMax;
  const errorsShown: DraftValidation = showErrors ? validation : { valid: true, rows: {} };

  return (
    <Card
      as="article"
      className="day-card day-card-editing"
      title={t('workouts.editor.title', { name: workout.name || t('workouts.detail.dayNumber', { n: dayNumber }) })}
      subtitle={t('workouts.detail.dayNumber', { n: dayNumber })}
      actions={dirty ? <Badge tone="warning">{t('workouts.editor.unsaved')}</Badge> : undefined}
    >
      <form
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid-2">
          <TextField
            ref={nameRef}
            label={t('workouts.editor.dayName')}
            value={draft.name}
            maxLength={LIMITS.textShortMax}
            required
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            error={errorsShown.name ? fieldErrorMessage(errorsShown.name, i18n) : undefined}
          />
          <SelectField
            label={t('workouts.editor.focus')}
            hint={t('workouts.editor.focusHint')}
            value={draft.focus}
            options={focusOptions}
            onChange={(e) => setDraft((d) => ({ ...d, focus: e.target.value }))}
          />
        </div>
        <TextAreaField label={t('workouts.editor.dayNotes')} value={draft.notes} rows={2} maxLength={1000} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />

        {draft.exercises.length === 0 ? (
          <EmptyState compact icon="dumbbell" title={t('workouts.editor.empty')} />
        ) : (
          <ol className="editor-list">
            {draft.exercises.map((row, index) => (
              <EditorRow
                key={row.key}
                row={row}
                index={index}
                count={draft.exercises.length}
                errors={errorsShown.rows[row.key] ?? {}}
                onChange={(patch) => updateRow(row.key, patch)}
                onMove={(dir) => setDraft((d) => ({ ...d, exercises: moveItem(d.exercises, index, index + dir) }))}
                onRemove={() => setDraft((d) => ({ ...d, exercises: d.exercises.filter((x) => x.key !== row.key) }))}
                onReplace={() => setAlternativesFor(row.key)}
              />
            ))}
          </ol>
        )}

        <div className="row">
          <Button icon="plus" onClick={() => setPicker({ mode: 'add' })} disabled={atLimit}>
            {t('workouts.editor.addExercise')}
          </Button>
          {atLimit && <span className="small muted">{t('workouts.editor.limitReached', { max: LIMITS.exercisesPerWorkoutMax })}</span>}
        </div>

        {showErrors && !validation.valid && <Notice tone="danger">{t('workouts.editor.invalid')}</Notice>}

        <div className="sticky-actions editor-actions">
          <Button
            onClick={() => {
              setDraft(original);
              onDirtyChange(false);
              onDone();
            }}
            disabled={save.isPending}
          >
            {t('workouts.editor.cancel')}
          </Button>
          <Button type="submit" variant="primary" icon="check" loading={save.isPending}>
            {t('workouts.editor.save')}
          </Button>
        </div>
      </form>

      {altRow && (
        <AlternativesModal
          open
          onClose={() => setAlternativesFor(null)}
          planId={plan.id}
          workoutId={workout.id}
          planExerciseId={altRow.id ?? null}
          exercise={altRow.exercise}
          excludeIds={draftIds}
          onSelect={(e) => {
            updateRow(altRow.key, (r) => replaceDraftExercise(r, e));
            setAlternativesFor(null);
          }}
          onBrowse={() => {
            setPicker({ mode: 'replace', key: altRow.key });
            setAlternativesFor(null);
          }}
        />
      )}
      <ExercisePicker
        open={picker != null}
        onClose={() => setPicker(null)}
        excludeIds={draftIds}
        title={picker?.mode === 'replace' ? t('workouts.alternatives.title', { name: lt(draft.exercises.find((x) => picker.mode === 'replace' && x.key === picker.key)?.exercise.name) }) : t('workouts.editor.pickerTitle')}
        onSelect={(e: ExerciseSummaryDTO) => {
          if (picker?.mode === 'replace') updateRow(picker.key, (r) => replaceDraftExercise(r, e));
          else setDraft((d) => ({ ...d, exercises: [...d.exercises, newDraftExercise(e)] }));
        }}
      />
    </Card>
  );
}

function EditorRow({
  row,
  index,
  count,
  errors,
  onChange,
  onMove,
  onRemove,
  onReplace,
}: {
  row: DraftExercise;
  index: number;
  count: number;
  errors: DraftValidation['rows'][string];
  onChange(patch: Partial<DraftExercise> | ((row: DraftExercise) => DraftExercise)): void;
  onMove(dir: -1 | 1): void;
  onRemove(): void;
  onReplace(): void;
}) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const { toDisplay, fromDisplay, weightUnit } = useUnits();
  const name = lt(row.exercise.name);
  const restIsPreset = row.restSeconds != null && (REST_PRESETS as readonly number[]).includes(row.restSeconds);
  const [customRest, setCustomRest] = useState(!restIsPreset);
  const headingId = useId();
  const err = (field: keyof typeof errors) => (errors[field] ? fieldErrorMessage(errors[field], i18n) : undefined);

  return (
    <li className="editor-row" aria-labelledby={headingId}>
      <div className="editor-row-head">
        <span className="exercise-index" aria-hidden="true">
          {index + 1}
        </span>
        <div className="editor-row-title">
          <strong id={headingId}>{name}</strong>
          <div className="row small">
            {!row.id && <Badge tone="info">{t('workouts.editor.newBadge')}</Badge>}
            {row.originalExerciseId && <Badge tone="primary">{t('workouts.editor.replacedBadge')}</Badge>}
            <span className="muted">{row.exercise.primaryMuscles.map((m) => t(`enums.muscle.${m}`)).join(' · ')}</span>
          </div>
        </div>
        <div className="editor-row-actions">
          <IconButton icon="arrowUp" size="sm" label={t('workouts.editor.moveUp', { name })} onClick={() => onMove(-1)} disabled={index === 0} />
          <IconButton icon="arrowDown" size="sm" label={t('workouts.editor.moveDown', { name })} onClick={() => onMove(1)} disabled={index === count - 1} />
          <Button size="sm" icon="swap" onClick={onReplace} aria-label={t('workouts.editor.replaceLabel', { name })}>
            {t('workouts.editor.replace')}
          </Button>
          <IconButton icon="trash" size="sm" variant="ghost" label={t('workouts.editor.remove', { name })} onClick={onRemove} />
        </div>
      </div>

      <div className="editor-grid">
        <NumberField label={t('workouts.editor.sets')} value={row.sets} min={1} max={10} onChange={(v) => onChange({ sets: v })} error={err('sets')} />
        <div className="editor-target">
          <Segmented<'reps' | 'time'>
            label={t('workouts.editor.target')}
            size="sm"
            value={row.mode}
            onChange={(mode) => onChange((r) => setMode(r, mode))}
            options={[
              { value: 'reps', label: t('workouts.editor.targetReps') },
              { value: 'time', label: t('workouts.editor.targetTime') },
            ]}
          />
        </div>
        {row.mode === 'reps' ? (
          <>
            <NumberField label={t('workouts.editor.repMin')} value={row.repMin} min={1} max={100} onChange={(v) => onChange({ repMin: v })} error={err('repMin')} />
            <NumberField label={t('workouts.editor.repMax')} value={row.repMax} min={1} max={100} onChange={(v) => onChange({ repMax: v })} error={err('repMax')} />
          </>
        ) : (
          <NumberField label={t('workouts.editor.seconds')} value={row.targetSeconds} min={5} max={7200} onChange={(v) => onChange({ targetSeconds: v })} error={err('targetSeconds')} />
        )}
        <SelectField
          label={t('workouts.editor.rest')}
          value={customRest ? CUSTOM : String(row.restSeconds)}
          onChange={(e) => {
            if (e.target.value === CUSTOM) setCustomRest(true);
            else {
              setCustomRest(false);
              onChange({ restSeconds: Number(e.target.value) });
            }
          }}
          options={[...REST_PRESETS.map((s) => ({ value: String(s), label: formatRest(s, i18n) })), { value: CUSTOM, label: t('workouts.editor.restCustom') }]}
          error={!customRest ? err('restSeconds') : undefined}
        />
        {customRest && (
          <NumberField label={t('workouts.editor.restSeconds')} value={row.restSeconds} min={0} max={600} onChange={(v) => onChange({ restSeconds: v })} error={err('restSeconds')} />
        )}
        <SelectField
          label={t('workouts.editor.rpe')}
          value={row.targetRpe == null ? '' : String(row.targetRpe)}
          onChange={(e) => onChange({ targetRpe: e.target.value === '' ? null : Number(e.target.value) })}
          options={[
            { value: '', label: t('workouts.editor.rpeNone') },
            ...(row.targetRpe != null && !RPE_OPTIONS.includes(row.targetRpe) ? [{ value: String(row.targetRpe), label: String(row.targetRpe) }] : []),
            ...RPE_OPTIONS.map((r) => ({ value: String(r), label: i18n.formatNumber(r) })),
          ]}
          error={err('targetRpe')}
        />
        <NumberField
          label={t('workouts.editor.weight')}
          unit={weightUnit}
          value={toDisplay(row.targetWeightKg)}
          min={0}
          step={0.5}
          inputMode="decimal"
          onChange={(v) => onChange({ targetWeightKg: fromDisplay(v) })}
          error={err('targetWeightKg')}
        />
      </div>
      <TextField label={t('workouts.editor.notes')} value={row.notes} maxLength={500} onChange={(e) => onChange({ notes: e.target.value })} error={err('notes')} />
    </li>
  );
}
