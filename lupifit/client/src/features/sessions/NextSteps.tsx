import { Card, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useDashboard } from '../dashboard/api';
import { weekOutlook } from '../dashboard/today';

/** "What now?" after finishing: the next plan workout, weekly progress and recovery actions. */
export function NextSteps() {
  const { t } = useI18n();
  const { data } = useDashboard();
  const outlook = data ? weekOutlook(data) : null;
  const next = data?.nextWorkout ?? null;
  return (
    <Card title={t('session.summary.next.title')}>
      <div className="stack-sm">
        {data && outlook && (
          <p data-testid="next-steps-text">
            {outlook.status === 'met'
              ? t('session.summary.next.goalMet')
              : t('session.summary.next.remaining', { completed: data.weeklyGoal.completed, target: data.weeklyGoal.target })}
            {next ? ` ${t('session.summary.next.upNext', { name: next.name })}` : ''}
          </p>
        )}
        <p className="small muted">{t('session.summary.next.recovery')}</p>
        <div className="next-steps">
          <LinkButton to="/nutrition/log" icon="apple" variant="primary">
            {t('session.summary.next.logMeal')}
          </LinkButton>
          {next ? (
            <LinkButton to={`/workouts/plans/${next.planId}`} icon="calendar">
              {t('session.summary.next.viewPlan')}
            </LinkButton>
          ) : (
            <LinkButton to="/workouts" icon="dumbbell">
              {t('session.summary.toWorkouts')}
            </LinkButton>
          )}
        </div>
      </div>
    </Card>
  );
}
