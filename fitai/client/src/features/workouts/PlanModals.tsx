import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { addWorkoutSchema, createPlanSchema, WORKOUT_FOCUSES } from '@shared/schemas/workouts';
import type { ApplyProgressionResponse, PrescriptionTargets, WorkoutPlanDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Badge, Button, EmptyState, Modal, Notice, SelectField, TextAreaField, TextField, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { addWorkout, createPlan } from './api';

function firstErrors(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/** "Create a custom plan": name + description → empty plan with one day. */
export function CustomPlanModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useIdempotentMutation((input: { name: string; description: string }, key) => createPlan(input, key), {
    onSuccess: (plan) => {
      queryClient.setQueryData(qk.plan(plan.id), plan);
      void queryClient.invalidateQueries({ queryKey: qk.plans });
      toast.success(t('workouts.toasts.created'));
      onClose();
      navigate(`/workouts/plans/${plan.id}`);
    },
  });
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setErrors({});
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = createPlanSchema.safeParse({ name, description });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    create.mutate(parsed.data);
  };

  return (
    <Modal open={open} onClose={onClose} title={t('workouts.custom.title')} size="sm">
      <form className="stack" onSubmit={submit} noValidate>
        <p className="muted small">{t('workouts.custom.intro')}</p>
        {create.isError && <Notice tone="danger">{errorMessage(create.error, i18n, 'workouts')}</Notice>}
        <TextField label={t('workouts.custom.name')} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} error={fieldErrorMessage(errors.name, i18n)} autoFocus />
        <TextAreaField label={t('workouts.custom.description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} />
        <div className="modal-actions">
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button type="submit" variant="primary" loading={create.isPending}>
            {t('workouts.custom.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** "Add day": name + optional training focus. */
export function AddDayModal({ open, onClose, plan, onAdded }: { open: boolean; onClose(): void; plan: WorkoutPlanDTO; onAdded(plan: WorkoutPlanDTO): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const add = useIdempotentMutation((input: { name: string; focus: string }, key) => addWorkout(plan.id, input, key), {
    onSuccess: (updated) => {
      toast.success(t('workouts.toasts.dayAdded'));
      onAdded(updated);
      onClose();
    },
  });
  useEffect(() => {
    if (open) {
      setName(t('workouts.detail.dayNumber', { n: plan.workouts.length + 1 }));
      setFocus('');
      setErrors({});
      add.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = addWorkoutSchema.safeParse({ name, focus });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    add.mutate(parsed.data);
  };

  return (
    <Modal open={open} onClose={onClose} title={t('workouts.addDay.title')} size="sm">
      <form className="stack" onSubmit={submit} noValidate>
        {add.isError && <Notice tone="danger">{errorMessage(add.error, i18n, 'workouts')}</Notice>}
        <TextField label={t('workouts.addDay.name')} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} error={fieldErrorMessage(errors.name, i18n)} autoFocus />
        <SelectField
          label={t('workouts.addDay.focus')}
          hint={t('workouts.editor.focusHint')}
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          options={[{ value: '', label: t('workouts.editor.focusNone') }, ...WORKOUT_FOCUSES.map((f) => ({ value: f, label: t(`workouts.focus.${f}`) }))]}
        />
        <div className="modal-actions">
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button type="submit" variant="primary" loading={add.isPending}>
            {t('workouts.addDay.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Summary of an "apply progression" run (honest empty state without history). */
export function ProgressionResultModal({ result, onClose }: { result: ApplyProgressionResponse | null; onClose(): void }) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const { formatWeight } = useUnits();
  const names = new Map(result?.plan.workouts.flatMap((w) => w.exercises.map((x) => [x.id, lt(x.exercise.name)] as const)) ?? []);
  const describe = (p: PrescriptionTargets) => {
    const reps =
      p.repMin != null
        ? `${p.repMax != null && p.repMax !== p.repMin ? `${p.repMin}–${p.repMax}` : p.repMin} ${t('common.units.reps')}`
        : p.targetSeconds != null
          ? t('workouts.exercise.seconds', { seconds: p.targetSeconds })
          : null;
    return [reps, p.targetWeightKg != null ? formatWeight(p.targetWeightKg) : null].filter(Boolean).join(' · ');
  };
  return (
    <Modal
      open={result != null}
      onClose={onClose}
      title={t('workouts.progression.title')}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('common.actions.done')}
        </Button>
      }
    >
      {result && result.changes.length === 0 ? (
        <EmptyState compact icon="chart" title={t('workouts.progression.noneTitle')} body={t('workouts.progression.noneBody')} />
      ) : (
        result && (
          <div className="stack" aria-live="polite">
            <p>
              <strong>{t('workouts.progression.changed', { count: result.changes.length })}</strong>
            </p>
            <ul className="list">
              {result.changes.map((c) => (
                <li key={c.planExerciseId} className="list-item progression-change">
                  <div className="picker-item-body">
                    <strong>{names.get(c.planExerciseId) ?? c.exerciseId}</strong>
                    <div className="row small">
                      <Badge tone="success">{t(`workouts.progression.actions.${c.action}`)}</Badge>
                      <span className="muted">
                        {t('workouts.progression.before')}: {describe(c.before) || '—'}
                      </span>
                      <span>
                        {t('workouts.progression.after')}: <strong>{describe(c.after) || '—'}</strong>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </Modal>
  );
}
