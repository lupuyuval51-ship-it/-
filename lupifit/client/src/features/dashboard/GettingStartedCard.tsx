import type { DashboardDTO } from '@shared/types';
import { Card, Icon, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';
import { gettingStarted, type StartStep } from './today';

const TARGETS: Record<StartStep['key'], string> = {
  plan: '/workouts?tab=generate',
  workout: '/workouts',
  meal: '/nutrition/log',
};

/** Three-step checklist for new users (no finished workout yet); disappears after the first one. */
export function GettingStartedCard({ data }: { data: Pick<DashboardDTO, 'activePlan' | 'lastWorkout' | 'nutritionToday'> }) {
  const { t } = useI18n();
  const steps = gettingStarted(data);
  if (!steps) return null;
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <Card title={t('dashboard.start.title')} subtitle={t('dashboard.start.progress', { done: doneCount, total: steps.length })} className="dash-start">
      <ol className="dash-start-list">
        {steps.map((s) => (
          <li key={s.key} className={`dash-start-item${s.done ? ' dash-start-item-done' : ''}`}>
            <span className="dash-start-mark" aria-hidden="true">
              {s.done ? <Icon name="check" size={16} /> : null}
            </span>
            <div className="dash-start-item-body">
              <strong className="dash-start-title">{t(`dashboard.start.steps.${s.key}.title`)}</strong>
              <p className="small muted">{t(`dashboard.start.steps.${s.key}.body`)}</p>
            </div>
            {s.done ? (
              <span className="visually-hidden">{t('dashboard.start.done')}</span>
            ) : (
              <LinkButton to={TARGETS[s.key]} size="sm" variant="secondary">
                {t(`dashboard.start.steps.${s.key}.action`)}
              </LinkButton>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
