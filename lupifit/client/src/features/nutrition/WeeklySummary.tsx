import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BarChart } from '../../components/charts/Charts';
import { Card, EmptyState, QueryState, Segmented, Stat } from '../../components/ui';
import { useI18n } from '../../i18n';
import { storage } from '../../lib/storage';
import { fetchSummary, nk } from './api';
import { useMacroFormat } from './Macros';

type Period = 7 | 30;
const PERIOD_KEY = 'fitai.nutrition.trendPeriod';

/** Calories per day vs target (7 or 30 days), with averages over logged days only. */
export function WeeklySummary({ to }: { to: string }) {
  const { t, formatDate } = useI18n();
  const f = useMacroFormat();
  const [days, setDays] = useState<Period>(() => (storage.get<number>(PERIOD_KEY) === 30 ? 30 : 7));
  const query = useQuery({
    queryKey: nk.summary(days, to),
    queryFn: ({ signal }) => fetchSummary(days, to, signal),
    placeholderData: keepPreviousData,
  });

  return (
    <Card
      title={t('nutrition.weekly.title')}
      actions={
        <Segmented<Period>
          label={t('nutrition.weekly.period')}
          hideLabel
          size="sm"
          value={days}
          onChange={(d) => {
            setDays(d);
            storage.set(PERIOD_KEY, d);
          }}
          options={[
            { value: 7, label: t('nutrition.weekly.days7') },
            { value: 30, label: t('nutrition.weekly.days30') },
          ]}
        />
      }
    >
      <QueryState query={query}>
        {(s) =>
          s.daysLogged === 0 ? (
            <EmptyState compact icon="chart" title={t('nutrition.weekly.empty')} />
          ) : (
            <div className="stack">
              <BarChart
                title={t('nutrition.weekly.chartTitle')}
                height={180}
                data={s.days.map((d) => ({
                  label: days === 7 ? formatDate(d.date, { weekday: 'short', day: undefined, month: undefined }) : formatDate(d.date, { day: 'numeric', month: 'numeric' }),
                  value: d.entryCount > 0 ? Math.round(d.totals.kcal) : null,
                }))}
                formatValue={(v) => f.kcal(v)}
                reference={s.targets ? { value: s.targets.calories, label: t('nutrition.weekly.target') } : undefined}
              />
              <div className="nutri-stats">
                <Stat
                  icon="flame"
                  label={t('nutrition.weekly.avgCalories')}
                  value={s.averages ? f.kcalText(s.averages.kcal) : '—'}
                  hint={s.targets ? t('nutrition.weekly.ofTarget', { target: f.kcalText(s.targets.calories) }) : undefined}
                />
                <Stat
                  icon="target"
                  tone="info"
                  label={t('nutrition.weekly.avgProtein')}
                  value={s.averages ? f.gramsText(s.averages.proteinG) : '—'}
                  hint={s.targets ? t('nutrition.weekly.ofTarget', { target: f.gramsText(s.targets.proteinG) }) : undefined}
                />
                <Stat
                  icon="calendar"
                  tone="success"
                  label={t('nutrition.weekly.daysLogged')}
                  value={t('nutrition.weekly.daysLoggedValue', { logged: s.daysLogged, total: s.days.length })}
                />
              </div>
              <p className="small muted">{t('nutrition.weekly.loggedOnly')}</p>
            </div>
          )
        }
      </QueryState>
    </Card>
  );
}
