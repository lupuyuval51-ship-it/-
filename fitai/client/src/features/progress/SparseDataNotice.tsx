import type { ProgressPeriod } from '@shared/constants';
import type { ProgressOverviewDTO } from '@shared/types';
import { Button, Card, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';
import '../../styles/ux-progress.css';
import { sparseGuidance } from './sparse';

/** Plain-language help for when the period holds too little data for trends — with a next step for each gap. */
export function SparseDataNotice({ overview, onPeriod }: { overview: ProgressOverviewDTO; onPeriod(p: ProgressPeriod): void }) {
  const { t } = useI18n();
  const { hints, longerPeriod } = sparseGuidance(overview);
  if (hints.length === 0) return null;
  return (
    <Card title={t('progress.sparse.title')} subtitle={t('progress.sparse.subtitle')} className="progress-sparse-card">
      <ul className="progress-sparse-list">
        {hints.map((h) => (
          <li key={h}>
            <span>{t(`progress.sparse.${h}`, { period: overview.period, count: overview.workouts.count })}</span>
            {h === 'no_workouts' && (
              <span className="row">
                {longerPeriod && (
                  <Button size="sm" variant="secondary" onClick={() => onPeriod(longerPeriod)}>
                    {t('progress.sparse.tryLonger', { count: longerPeriod })}
                  </Button>
                )}
                <LinkButton to="/workouts" size="sm" variant="ghost" iconEnd="chevronRight">
                  {t('progress.sparse.openWorkouts')}
                </LinkButton>
              </span>
            )}
            {h === 'no_meals' && (
              <LinkButton to="/nutrition/log" size="sm" variant="ghost" iconEnd="chevronRight">
                {t('progress.nutrition.logFood')}
              </LinkButton>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
