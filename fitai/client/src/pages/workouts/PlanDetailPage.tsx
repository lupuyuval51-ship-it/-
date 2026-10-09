import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { LIMITS } from '@shared/constants';
import { updatePlanSchema } from '@shared/schemas/workouts';
import type { ApplyProgressionResponse, WorkoutPlanDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  Notice,
  PageHeader,
  QueryState,
  Stat,
  TextAreaField,
  TextField,
  useConfirm,
  useToast,
} from '../../components/ui';
import { applyProgression, deleteWorkout, duplicateWorkout, fetchPlan, regenerateWorkout, reorderWorkouts, updatePlan } from '../../features/workouts/api';
import { nextWorkoutIndex } from '../../features/workouts/format';
import { useStartWorkout, useUnsavedChangesGuard } from '../../features/workouts/hooks';
import { AddDayModal, ProgressionResultModal } from '../../features/workouts/PlanModals';
import { STATUS_TONE, usePlanActions } from '../../features/workouts/PlanList';
import { GenerationNotesCard, WeeklyVolumeCard } from '../../features/workouts/PlanNotes';
import { WorkoutDayCard } from '../../features/workouts/WorkoutDayCard';
import { WorkoutDayEditor } from '../../features/workouts/WorkoutDayEditor';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import '../../styles/workouts.css';

/** /workouts/plans/:planId — plan details, generator explanations and day editing. */
export default function PlanDetailPage() {
  const { t } = useI18n();
  const { planId = '' } = useParams();
  const query = useQuery({ queryKey: qk.plan(planId), queryFn: ({ signal }) => fetchPlan(planId, signal), enabled: planId !== '' });
  useDocumentTitle(query.data?.name ?? t('workouts.title'));

  const notFound = query.isError && query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
  if (notFound) {
    return (
      <div className="stack-lg">
        <PageHeader title={t('workouts.detail.notFoundTitle')} backTo="/workouts" backLabel={t('workouts.detail.backToPlans')} />
        <EmptyState
          icon="search"
          title={t('workouts.detail.notFoundTitle')}
          body={t('workouts.detail.notFoundBody')}
          action={
            <LinkButton to="/workouts" variant="primary">
              {t('workouts.detail.backToPlans')}
            </LinkButton>
          }
        />
      </div>
    );
  }
  return <QueryState query={query}>{(plan) => <PlanDetail plan={plan} />}</QueryState>;
}

function PlanDetail({ plan }: { plan: WorkoutPlanDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  /** Day whose "Edit day" button gets focus back when its editor closes (keyboard users). */
  const [returnFocusId, setReturnFocusId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [progression, setProgression] = useState<ApplyProgressionResponse | null>(null);
  useUnsavedChangesGuard(dirty);

  const actions = usePlanActions({
    onDeleted: () => navigate('/workouts', { replace: true }),
    onDuplicated: (copy) => navigate(`/workouts/plans/${copy.id}`),
  });
  const { start, pendingId } = useStartWorkout();

  const applyUpdate = (updated: WorkoutPlanDTO) => {
    queryClient.setQueryData(qk.plan(updated.id), updated);
    void queryClient.invalidateQueries({ queryKey: qk.plans });
    void queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };
  const onError = (err: unknown) => toast.error(errorMessage(err, i18n, 'workouts'));

  const duplicateDay = useIdempotentMutation((workoutId: string, key) => duplicateWorkout(plan.id, workoutId, key), {
    onSuccess: (p) => {
      applyUpdate(p);
      toast.success(t('workouts.toasts.dayDuplicated'));
    },
    onError,
  });
  const regenerateDay = useIdempotentMutation((workoutId: string, key) => regenerateWorkout(plan.id, workoutId, key), {
    onSuccess: (p) => {
      applyUpdate(p);
      toast.success(t('workouts.toasts.dayRegenerated'));
    },
    onError,
  });
  const deleteDay = useMutation({
    mutationFn: (workoutId: string) => deleteWorkout(plan.id, workoutId),
    onSuccess: (p) => {
      applyUpdate(p);
      toast.success(t('workouts.toasts.dayDeleted'));
    },
    onError,
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderWorkouts(plan.id, ids),
    onSuccess: (p) => {
      applyUpdate(p);
      toast.success(t('workouts.toasts.reordered'));
    },
    onError,
  });
  const progress = useIdempotentMutation((_: void, key) => applyProgression(plan.id, key), {
    onSuccess: (res) => {
      applyUpdate(res.plan);
      setProgression(res);
    },
    onError,
  });

  const busy = duplicateDay.isPending || regenerateDay.isPending || deleteDay.isPending || reorder.isPending;
  const planBusy = actions.activate.isPending || actions.duplicate.isPending || actions.archiving || actions.removing || progress.isPending;
  // While a day is open in the editor, actions that rewrite or leave the plan wait: applying
  // progression would silently diverge from the editor's draft, duplicate/delete navigate away.
  const editing = editingDayId != null;
  const nextIndex = plan.status === 'active' ? nextWorkoutIndex(plan) : -1;
  const maxDays = plan.workouts.length >= LIMITS.workoutsPerPlanMax;

  return (
    <div className="stack-lg plan-detail">
      <PlanHeader plan={plan} />

      <div className="plan-actions" role="group" aria-label={t('workouts.list.moreActions', { name: plan.name })}>
        {plan.status !== 'active' && (
          <Button variant="primary" icon="check" onClick={() => actions.activate.mutate(plan.id)} loading={actions.activate.isPending} disabled={planBusy}>
            {t('workouts.actions.activate')}
          </Button>
        )}
        <Button icon="copy" onClick={() => actions.duplicate.mutate(plan.id)} loading={actions.duplicate.isPending} disabled={planBusy || editing}>
          {t('workouts.actions.duplicate')}
        </Button>
        <Button icon="chart" onClick={() => progress.mutate()} loading={progress.isPending} disabled={planBusy || editing}>
          {t('workouts.actions.applyProgression')}
        </Button>
        {plan.status !== 'archived' && (
          <Button icon="download" variant="ghost" onClick={() => void actions.archive(plan.id)} disabled={planBusy}>
            {t('workouts.actions.archive')}
          </Button>
        )}
        <Button icon="trash" variant="ghost" className="btn-danger-text" onClick={() => void actions.remove(plan.id)} disabled={planBusy || editing}>
          {t('workouts.actions.delete')}
        </Button>
      </div>
      {editing && <p className="small muted">{t('workouts.detail.finishEditingFirst')}</p>}

      {plan.status === 'archived' && <Notice tone="warning">{t('workouts.detail.archivedNotice')}</Notice>}

      <GenerationNotesCard notes={plan.generationNotes} />

      <section className="stack" aria-labelledby="plan-days-title">
        <div className="row-between">
          <h2 className="section-title" id="plan-days-title">
            {t('workouts.detail.days')}
          </h2>
          <Button size="sm" icon="plus" onClick={() => setAddDayOpen(true)} disabled={maxDays || editingDayId != null || busy}>
            {t('workouts.actions.addDay')}
          </Button>
        </div>
        {plan.workouts.map((w, i) =>
          editingDayId === w.id ? (
            <WorkoutDayEditor
              key={w.id}
              plan={plan}
              workout={w}
              dayNumber={i + 1}
              onDone={() => {
                setReturnFocusId(w.id);
                setEditingDayId(null);
              }}
              onDirtyChange={setDirty}
            />
          ) : (
            <WorkoutDayCard
              key={w.id}
              workout={w}
              dayNumber={i + 1}
              dayCount={plan.workouts.length}
              isNext={i === nextIndex}
              startPending={pendingId === w.id}
              busy={busy}
              locked={editingDayId != null}
              maxDaysReached={maxDays}
              focusEdit={returnFocusId === w.id}
              onEditFocused={() => setReturnFocusId(null)}
              actions={{
                onStart: () => start(w.id),
                onEdit: () => setEditingDayId(w.id),
                onDuplicate: () => duplicateDay.mutate(w.id),
                onRegenerate: async () => {
                  if (await confirm({ title: t('workouts.confirm.regenerateTitle'), body: t('workouts.confirm.regenerateBody'), confirmLabel: t('workouts.confirm.regenerateConfirm') })) {
                    regenerateDay.mutate(w.id);
                  }
                },
                onDelete: async () => {
                  if (await confirm({ title: t('workouts.confirm.deleteDayTitle'), body: t('workouts.confirm.deleteDayBody'), confirmLabel: t('workouts.actions.deleteDay'), danger: true })) {
                    deleteDay.mutate(w.id);
                  }
                },
                onMove: (dir) => {
                  const ids = plan.workouts.map((x) => x.id);
                  const j = i + dir;
                  if (j < 0 || j >= ids.length) return;
                  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
                  reorder.mutate(ids);
                },
              }}
            />
          ),
        )}
      </section>

      <WeeklyVolumeCard plan={plan} />

      <AddDayModal open={addDayOpen} onClose={() => setAddDayOpen(false)} plan={plan} onAdded={applyUpdate} />
      <ProgressionResultModal result={progression} onClose={() => setProgression(null)} />
    </div>
  );
}

/** Title block with inline editing of name & description, status and key facts. */
function PlanHeader({ plan }: { plan: WorkoutPlanDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: (patch: { name: string; description: string }) => updatePlan(plan.id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.plan(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.plans });
      toast.success(t('workouts.toasts.detailsSaved'));
      setEditing(false);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = updatePlanSchema.safeParse({ name, description });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    save.mutate({ name: parsed.data.name ?? plan.name, description: parsed.data.description ?? '' });
  };

  return (
    <div className="stack">
      {editing ? (
        <>
          <PageHeader title={plan.name} backTo="/workouts" backLabel={t('workouts.detail.backToPlans')} />
          <Card as="section">
            <form className="stack" onSubmit={submit} noValidate>
              {save.isError && <Notice tone="danger">{errorMessage(save.error, i18n, 'workouts')}</Notice>}
              <TextField label={t('workouts.detail.nameLabel')} value={name} onChange={(e) => setName(e.target.value)} required maxLength={LIMITS.textShortMax} error={fieldErrorMessage(errors.name, i18n)} autoFocus />
              <TextAreaField label={t('workouts.detail.descriptionLabel')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} />
              <div className="row">
                <Button
                  onClick={() => {
                    setEditing(false);
                    setErrors({});
                    save.reset();
                  }}
                  disabled={save.isPending}
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button type="submit" variant="primary" loading={save.isPending}>
                  {t('common.actions.save')}
                </Button>
              </div>
            </form>
          </Card>
        </>
      ) : (
        <PageHeader
          title={plan.name}
          subtitle={plan.description ? <bdi>{plan.description}</bdi> : undefined}
          backTo="/workouts"
          backLabel={t('workouts.detail.backToPlans')}
          actions={
            <Button
              size="sm"
              icon="edit"
              onClick={() => {
                setName(plan.name);
                setDescription(plan.description);
                setEditing(true);
              }}
            >
              {t('workouts.actions.editDetails')}
            </Button>
          }
        />
      )}
      <div className="row">
        <Badge tone={STATUS_TONE[plan.status]}>{t(`enums.planStatus.${plan.status}`)}</Badge>
        <Badge tone={plan.source === 'generated' ? 'primary' : 'neutral'} icon={plan.source === 'generated' ? 'sparkles' : undefined}>
          {t(`workouts.source.${plan.source}`)}
        </Badge>
      </div>
      <div className="grid-4 plan-stats">
        <Stat icon="target" label={t('workouts.detail.goal')} value={plan.goal ? t(`enums.goal.${plan.goal}`) : t('workouts.detail.notSet')} />
        <Stat icon="list" label={t('workouts.detail.split')} value={t(`enums.splitType.${plan.splitType}`)} />
        <Stat icon="calendar" label={t('workouts.detail.daysPerWeek')} value={i18n.formatNumber(plan.daysPerWeek ?? plan.workouts.length)} />
        <Stat
          icon="clock"
          label={t('workouts.detail.minutes')}
          value={plan.sessionMinutes != null ? `${i18n.formatNumber(plan.sessionMinutes)} ${t('common.units.min')}` : t('workouts.detail.notSet')}
        />
      </div>
    </div>
  );
}
