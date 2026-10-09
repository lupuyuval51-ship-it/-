import type { ProgressOverviewDTO } from '@shared/types';
import { BarChart } from '../../../components/charts/Charts';
import { Card } from '../../../components/ui';
import { useUnits } from '../../../hooks/useUnits';
import { useI18n } from '../../../i18n';

/** Workouts per week (with the weekly goal as reference line) and daily training volume. */
export function ActivityCard({ overview }: { overview: ProgressOverviewDTO }) {
  const { t, formatDate, formatNumber } = useI18n();
  const units = useUnits();
  const goal = overview.consistency.weeklyGoal;
  const weekly = overview.weekly.map((w) => ({ label: formatDate(w.weekStart), value: w.workouts }));
  const daily = overview.daily.map((d) => ({ label: formatDate(d.date), value: units.toDisplay(d.volumeKg) ?? 0 }));
  const dailyTitle = t('progress.activity.dailyChart', { unit: units.weightUnit });
  return (
    <Card title={t('progress.activity.title')} className="progress-activity">
      <div className="stack">
        <div>
          <h3 className="chart-heading">{t('progress.activity.weeklyChart')}</h3>
          <BarChart
            data={weekly}
            title={t('progress.activity.weeklyChart')}
            reference={{ value: goal, label: t('progress.activity.goalLine', { count: goal }) }}
            formatValue={(v) => formatNumber(v)}
            emptyMessage={t('progress.activity.empty')}
          />
        </div>
        <div>
          <h3 className="chart-heading">{dailyTitle}</h3>
          <BarChart data={daily} title={dailyTitle} tone="info" formatValue={(v) => formatNumber(v, { maximumFractionDigits: 0 })} emptyMessage={t('progress.activity.emptyVolume')} />
        </div>
      </div>
    </Card>
  );
}
