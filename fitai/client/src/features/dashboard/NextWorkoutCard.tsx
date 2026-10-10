import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { DashboardDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { Badge, Button, Card, EmptyState, LinkButton, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { relativeTimeText, useFmt } from '../progress/format';
import { focusLabel } from '../workouts/format';
import { startPlanWorkout } from './api';
import { todayPlan } from './today';

/** Next plan day with a one-tap start, or a clear path to creating a plan. */
export function NextWorkoutCard({ data }: { data: Pick<DashboardDTO, 'today' | 'activePlan' | 'nextWorkout' | 'activeSession' | 'lastWorkout' | 'weeklyGoal' | 'weekDays'> }) {
  const i18n = useI18n();
  const { t, formatDate } = i18n;
  const fmt = useFmt();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activePlan, nextWorkout, activeSession, lastWorkout } = data;

  const start = useIdempotentMutation((planWorkoutId: string, key: string) => startPlanWorkout(planWorkoutId, key), {
    onSuccess: async () => {
      toast.success(t('dashboard.nextWorkout.started'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.activeSession }),
        queryClient.invalidateQueries({ queryKey: qk.dashboard }),
      ]);
      navigate('/workouts/session');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'session_already_active') {
        void queryClient.invalidateQueries({ queryKey: qk.activeSession });
        navigate('/workouts/session');
        return;
      }
      toast.error(errorMessage(err, i18n, 'dashboard'));
    },
  });

  const last = lastWorkout && (
    <p className="muted small dash-last">
      {t('dashboard.nextWorkout.lastWorkout', {
        name: lastWorkout.name,
        when: relativeTimeText(lastWorkout.endedAt, Date.now(), { ...fmt, formatDate }),
      })}
    </p>
  );

  if (!activePlan) {
    return (
      <Card title={t('dashboard.nextWorkout.title')} className="dash-next">
        <EmptyState
          compact
          icon="dumbbell"
          title={t('dashboard.nextWorkout.noPlanTitle')}
          body={t('dashboard.nextWorkout.noPlanBody')}
          action={
            <LinkButton to="/workouts?tab=generate" variant="primary" icon="sparkles">
              {t('dashboard.nextWorkout.generate')}
            </LinkButton>
          }
        />
        {last}
      </Card>
    );
  }

  if (!nextWorkout) {
    return (
      <Card title={t('dashboard.nextWorkout.title')} className="dash-next">
        <EmptyState
          compact
          icon="dumbbell"
          title={t('dashboard.nextWorkout.emptyPlanTitle')}
          body={t('dashboard.nextWorkout.emptyPlanBody')}
          action={
            <LinkButton to={`/workouts/plans/${activePlan.id}`} variant="secondary">
              {t('dashboard.nextWorkout.viewPlan')}
            </LinkButton>
          }
        />
        {last}
      </Card>
    );
  }

  const today = todayPlan(data);
  const nextFocus = focusLabel(nextWorkout.focus, i18n);
  return (
    <Card title={t('dashboard.nextWorkout.title')} className="dash-next">
      <div className="stack-sm">
        <h3 className="dash-next-name">{nextWorkout.name}</h3>
        {nextFocus && nextFocus !== nextWorkout.name && <p className="muted">{nextFocus}</p>}
        <div className="row">
          <Badge tone="info" icon="list">
            {t('dashboard.nextWorkout.exercises', { count: nextWorkout.exerciseCount })}
          </Badge>
          {nextWorkout.estimatedMinutes != null && (
            <Badge tone="neutral" icon="clock">
              {t('dashboard.nextWorkout.minutes', { count: nextWorkout.estimatedMinutes })}
            </Badge>
          )}
        </div>
        <p className="small faint">{t('dashboard.nextWorkout.fromPlan', { plan: activePlan.name })}</p>
      </div>
      <p className="dash-today-reason small" aria-live="polite" data-testid="today-reason">
        {t(`dashboard.today.reason.${today.reason}`, { count: today.outlook.daysLeft, days: today.outlook.daysLeft })}
      </p>
      <div className="row dash-next-actions">
        {activeSession ? (
          // The resume banner above is the single primary action while a workout is open.
          <span className="small muted">{t('dashboard.today.finishFirst')}</span>
        ) : (
          <Button variant={today.kind === 'trained' ? 'secondary' : 'primary'} icon="play" loading={start.isPending} onClick={() => start.mutate(nextWorkout.workoutId)}>
            {today.kind === 'trained' ? t('dashboard.today.startAnyway') : t('dashboard.nextWorkout.start')}
          </Button>
        )}
        <LinkButton to={`/workouts/plans/${nextWorkout.planId}`} variant="ghost">
          {t('dashboard.nextWorkout.viewPlan')}
        </LinkButton>
      </div>
      {last}
    </Card>
  );
}
