import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import type { PlanStatus } from '@shared/constants';
import type { WorkoutPlanDTO, WorkoutPlanSummaryDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Badge, Button, Card, EmptyState, ErrorState, LinkButton, LoadingState, Notice, QueryState, Skeleton, useConfirm, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { activatePlan, archivePlan, deletePlan, duplicatePlan, fetchPlan, fetchPlans, workoutKeys } from './api';
import { focusLabel, nextWorkoutIndex } from './format';
import { useStartWorkout } from './hooks';
import { CustomPlanModal } from './PlanModals';

export const STATUS_TONE: Record<PlanStatus, 'success' | 'neutral' | 'warning'> = { active: 'success', draft: 'neutral', archived: 'warning' };

/** Activate / duplicate / archive / delete with toasts, confirmations and cache updates. */
export function usePlanActions(opts: { onDeleted?(id: string): void; onDuplicated?(plan: WorkoutPlanDTO): void } = {}) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const onError = (err: unknown) => toast.error(errorMessage(err, i18n, 'workouts'));
  const refresh = (plan?: WorkoutPlanDTO) => {
    if (plan) queryClient.setQueryData(qk.plan(plan.id), plan);
    void queryClient.invalidateQueries({ queryKey: qk.plans });
    void queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };
  const activate = useMutation({
    mutationFn: activatePlan,
    onSuccess: (plan) => {
      // The previously active plan became a draft: refetch every cached plan.
      void queryClient.invalidateQueries({ queryKey: ['plan'] });
      refresh(plan);
      toast.success(t('workouts.toasts.activated'));
    },
    onError,
  });
  const archive = useMutation({
    mutationFn: archivePlan,
    onSuccess: (plan) => {
      refresh(plan);
      toast.success(t('workouts.toasts.archived'));
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: deletePlan,
    onSuccess: (_res, id) => {
      opts.onDeleted?.(id);
      queryClient.removeQueries({ queryKey: qk.plan(id) });
      refresh();
      toast.success(t('workouts.toasts.deleted'));
    },
    onError,
  });
  const duplicate = useIdempotentMutation((id: string, key) => duplicatePlan(id, key), {
    onSuccess: (plan) => {
      refresh(plan);
      toast.success(t('workouts.toasts.duplicated'));
      opts.onDuplicated?.(plan);
    },
    onError,
  });
  return {
    activate,
    duplicate,
    archive: async (id: string) => {
      if (await confirm({ title: t('workouts.confirm.archivePlanTitle'), body: t('workouts.confirm.archivePlanBody'), confirmLabel: t('workouts.actions.archive') })) {
        return archive.mutateAsync(id).catch(() => undefined);
      }
      return undefined;
    },
    archiving: archive.isPending,
    remove: async (id: string) => {
      if (await confirm({ title: t('workouts.confirm.deletePlanTitle'), body: t('workouts.confirm.deletePlanBody'), confirmLabel: t('workouts.actions.delete'), danger: true })) {
        return remove.mutateAsync(id).then(() => true).catch(() => false);
      }
      return false;
    },
    removing: remove.isPending,
  };
}

/** "My plans" tab: active plan with its next workout, other plans, archived plans. */
export function PlanList({ onGenerate }: { onGenerate(): void }) {
  const { t } = useI18n();
  const [showArchived, setShowArchived] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const query = useQuery({ queryKey: workoutKeys.plansList(showArchived), queryFn: ({ signal }) => fetchPlans(showArchived, signal) });

  return (
    <div className="stack-lg">
      <QueryState
        query={query}
        isEmpty={(plans) => plans.length === 0 && !showArchived}
        empty={
          <EmptyState
            icon="dumbbell"
            title={t('workouts.list.emptyTitle')}
            body={t('workouts.list.emptyBody')}
            action={
              <div className="row">
                <Button variant="primary" icon="sparkles" onClick={onGenerate}>
                  {t('workouts.list.generateFirst')}
                </Button>
                <Button icon="plus" onClick={() => setCustomOpen(true)}>
                  {t('workouts.list.createCustom')}
                </Button>
              </div>
            }
          />
        }
      >
        {(plans) => {
          const active = plans.find((p) => p.status === 'active');
          const drafts = plans.filter((p) => p.status === 'draft');
          const archived = plans.filter((p) => p.status === 'archived');
          return (
            <>
              {active ? (
                <ActivePlanCard summary={active} />
              ) : (
                <Notice tone="info" title={t('workouts.list.noActiveTitle')}>
                  {t('workouts.list.noActiveBody')}
                </Notice>
              )}
              <section className="stack" aria-labelledby="other-plans-title">
                <div className="row-between">
                  <h2 className="section-title" id="other-plans-title">
                    {t('workouts.list.otherPlans')}
                  </h2>
                  <div className="row">
                    <Button size="sm" variant="primary" icon="sparkles" onClick={onGenerate}>
                      {t('workouts.list.newPlan')}
                    </Button>
                    <Button size="sm" icon="plus" onClick={() => setCustomOpen(true)}>
                      {t('workouts.list.createCustom')}
                    </Button>
                  </div>
                </div>
                {drafts.length === 0 ? (
                  <p className="empty-inline">{t('common.states.empty')}</p>
                ) : (
                  <ul className="plan-list">
                    {drafts.map((p) => (
                      <PlanListItem key={p.id} plan={p} />
                    ))}
                  </ul>
                )}
              </section>
              {showArchived && (
                <section className="stack" aria-labelledby="archived-plans-title">
                  <h2 className="section-title" id="archived-plans-title">
                    {t('workouts.list.archivedPlans')}
                  </h2>
                  {archived.length === 0 ? (
                    <p className="empty-inline">{t('common.states.empty')}</p>
                  ) : (
                    <ul className="plan-list">
                      {archived.map((p) => (
                        <PlanListItem key={p.id} plan={p} />
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </>
          );
        }}
      </QueryState>
      {!query.isPending && !query.isError && (query.data?.length || showArchived) ? (
        <div>
          <Button variant="ghost" size="sm" icon={showArchived ? 'chevronUp' : 'chevronDown'} onClick={() => setShowArchived((v) => !v)} aria-expanded={showArchived}>
            {showArchived ? t('workouts.list.hideArchived') : t('workouts.list.showArchived')}
          </Button>
        </div>
      ) : null}
      <CustomPlanModal open={customOpen} onClose={() => setCustomOpen(false)} />
    </div>
  );
}

function PlanFacts({ plan }: { plan: WorkoutPlanSummaryDTO }) {
  const { t } = useI18n();
  return (
    <div className="row small muted plan-facts">
      {plan.goal && <span>{t(`enums.goal.${plan.goal}`)}</span>}
      <span>{t(`enums.splitType.${plan.splitType}`)}</span>
      <span>{t('workouts.list.workoutsCount', { count: plan.workoutCount })}</span>
      <span>{t('workouts.list.exercisesCount', { count: plan.exerciseCount })}</span>
      {plan.sessionMinutes != null && <span>{t('workouts.detail.estimated', { minutes: plan.sessionMinutes })}</span>}
    </div>
  );
}

/** The active plan with its next workout and a one-tap "Start workout". */
function ActivePlanCard({ summary }: { summary: WorkoutPlanSummaryDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const detail = useQuery({ queryKey: qk.plan(summary.id), queryFn: ({ signal }) => fetchPlan(summary.id, signal) });
  const { start, pendingId } = useStartWorkout();
  return (
    <Card
      className="active-plan-card"
      title={
        <span className="row">
          <span>{summary.name}</span>
          <Badge tone="success" icon="check">
            {t('workouts.list.activePlan')}
          </Badge>
        </span>
      }
      actions={
        <LinkButton to={`/workouts/plans/${summary.id}`} size="sm" iconEnd="chevronRight">
          {t('workouts.actions.open')}
        </LinkButton>
      }
    >
      <PlanFacts plan={summary} />
      <div className="next-workout" aria-live="polite">
        {detail.isPending ? (
          <Skeleton height={56} />
        ) : detail.isError ? (
          <ErrorState compact error={detail.error} onRetry={() => void detail.refetch()} />
        ) : detail.data.workouts.length ? (
          (() => {
            const next = detail.data.workouts[nextWorkoutIndex(detail.data)]!;
            const focus = focusLabel(next.focus, i18n);
            return (
              <div className="row-between">
                <div>
                  <div className="small muted">{t('workouts.list.nextWorkout')}</div>
                  <strong className="next-workout-name">{next.name}</strong>
                  <div className="small muted row">
                    {focus && focus !== next.name && <span>{focus}</span>}
                    <span>{t('workouts.list.exercisesCount', { count: next.exercises.length })}</span>
                    {next.estimatedMinutes != null && <span>{t('workouts.detail.estimated', { minutes: next.estimatedMinutes })}</span>}
                  </div>
                </div>
                <Button variant="primary" size="lg" icon="play" onClick={() => start(next.id)} loading={pendingId === next.id} disabled={next.exercises.length === 0}>
                  {t('workouts.actions.start')}
                </Button>
              </div>
            );
          })()
        ) : (
          <LoadingState compact />
        )}
      </div>
    </Card>
  );
}

function PlanListItem({ plan }: { plan: WorkoutPlanSummaryDTO }) {
  const i18n = useI18n();
  const { t, formatDate } = i18n;
  const actions = usePlanActions();
  const busy = actions.activate.isPending || actions.duplicate.isPending || actions.archiving || actions.removing;
  return (
    <li className="plan-item card">
      <div className="plan-item-main">
        <div className="row">
          <Link to={`/workouts/plans/${plan.id}`} className="plan-item-name link">
            {plan.name}
          </Link>
          <Badge tone={STATUS_TONE[plan.status]}>{t(`enums.planStatus.${plan.status}`)}</Badge>
          <Badge tone={plan.source === 'generated' ? 'primary' : 'neutral'} icon={plan.source === 'generated' ? 'sparkles' : undefined}>
            {t(`workouts.source.${plan.source}`)}
          </Badge>
        </div>
        <PlanFacts plan={plan} />
        <div className="small faint">{t('workouts.list.updated', { date: formatDate(plan.updatedAt) })}</div>
      </div>
      <div className="plan-item-actions" role="group" aria-label={t('workouts.list.moreActions', { name: plan.name })}>
        <LinkButton to={`/workouts/plans/${plan.id}`} size="sm">
          {t('workouts.list.open')}
        </LinkButton>
        {plan.status !== 'active' && (
          <Button size="sm" icon="check" onClick={() => actions.activate.mutate(plan.id)} loading={actions.activate.isPending} disabled={busy}>
            {t('workouts.actions.activate')}
          </Button>
        )}
        <Button size="sm" variant="ghost" icon="copy" onClick={() => actions.duplicate.mutate(plan.id)} loading={actions.duplicate.isPending} disabled={busy}>
          {t('workouts.actions.duplicate')}
        </Button>
        {plan.status !== 'archived' && (
          <Button size="sm" variant="ghost" icon="download" onClick={() => void actions.archive(plan.id)} disabled={busy}>
            {t('workouts.actions.archive')}
          </Button>
        )}
        <Button size="sm" variant="ghost" icon="trash" className="btn-danger-text" onClick={() => void actions.remove(plan.id)} disabled={busy}>
          {t('workouts.actions.delete')}
        </Button>
      </div>
    </li>
  );
}
