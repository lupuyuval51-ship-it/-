import type { ProgressOverviewDTO } from '@shared/types';
import { Card, Icon, ProgressRing } from '../../../components/ui';
import { useI18n } from '../../../i18n';

export function ConsistencyCard({ consistency: c }: { consistency: ProgressOverviewDTO['consistency'] }) {
  const { t } = useI18n();
  return (
    <Card title={t('progress.consistency.title')} className="progress-consistency">
      <div className="consistency">
        <ProgressRing value={c.percent} max={100} size={104} tone="success" label={t('progress.consistency.ringLabel', { percent: c.percent })}>
          <strong className="ring-value num">{c.weeksTotal ? `${c.percent}%` : '—'}</strong>
        </ProgressRing>
        <div className="stack-sm">
          <strong>{c.weeksTotal ? t('progress.consistency.weeksMet', { met: c.weeksMet, total: c.weeksTotal }) : t('progress.consistency.noWeeks')}</strong>
          <span className="muted">{t('progress.consistency.goal', { count: c.weeklyGoal })}</span>
          <span className={`streak-pill${c.currentStreakWeeks ? '' : ' streak-pill-empty'}`}>
            <Icon name="flame" size={16} />
            {c.currentStreakWeeks ? t('progress.consistency.streak', { count: c.currentStreakWeeks }) : t('progress.consistency.noStreak')}
          </span>
        </div>
      </div>
      <p className="faint small consistency-rule">{t('progress.consistency.rule')}</p>
    </Card>
  );
}
