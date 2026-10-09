import type { ProgressOverviewDTO } from '@shared/types';
import { Card, Icon, Stat, type IconName } from '../../../components/ui';
import { durationText, useFmt } from '../../../features/progress/format';
import { useUnits } from '../../../hooks/useUnits';
import { useI18n } from '../../../i18n';

function Trend({ current, previous, previousText, period }: { current: number; previous: number; previousText: string; period: number }) {
  const { t } = useI18n();
  const dir = current > previous ? 'up' : current < previous ? 'down' : 'same';
  const icon: IconName = dir === 'up' ? 'arrowUp' : dir === 'down' ? 'arrowDown' : 'minus';
  const label = t(dir === 'up' ? 'progress.summary.trendUp' : dir === 'down' ? 'progress.summary.trendDown' : 'progress.summary.trendSame');
  return (
    <span className={`trend trend-${dir}`}>
      <Icon name={icon} size={14} label={label} />
      <span>{t('progress.summary.previous', { count: period, value: previousText })}</span>
    </span>
  );
}

/** Period totals with comparison arrows against the previous period of equal length. */
export function SummarySection({ overview }: { overview: ProgressOverviewDTO }) {
  const { t, formatNumber } = useI18n();
  const { formatWeight } = useUnits();
  const fmt = useFmt();
  const w = overview.workouts;
  return (
    <Card title={t('progress.summary.title')} className="progress-summary">
      <div className="summary-grid">
        <Stat
          icon="dumbbell"
          label={t('progress.summary.workouts')}
          value={formatNumber(w.count)}
          hint={<Trend current={w.count} previous={w.previousCount} previousText={formatNumber(w.previousCount)} period={overview.period} />}
        />
        <Stat
          icon="chart"
          tone="info"
          label={t('progress.summary.volume')}
          value={formatWeight(w.totalVolumeKg)}
          hint={<Trend current={w.totalVolumeKg} previous={w.previousVolumeKg} previousText={formatWeight(w.previousVolumeKg)} period={overview.period} />}
        />
        <Stat icon="clock" label={t('progress.summary.time')} value={durationText(w.totalDurationSeconds, fmt)} />
        <Stat icon="check" tone="info" label={t('progress.summary.sets')} value={formatNumber(w.totalSets)} />
        <Stat icon="refresh" label={t('progress.summary.reps')} value={formatNumber(w.totalReps)} />
        <Stat icon="calendar" tone="info" label={t('progress.summary.perWeek')} value={formatNumber(w.averagePerWeek)} />
      </div>
    </Card>
  );
}
