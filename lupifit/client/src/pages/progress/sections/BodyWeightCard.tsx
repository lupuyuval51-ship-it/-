import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { TREND_PERIODS, type TrendPeriod } from '@shared/schemas/progress';
import { qk } from '../../../api/queryClient';
import { LineChart } from '../../../components/charts/Charts';
import { Button, Card, ErrorState, IconButton, LoadingState, Segmented, Stat, useConfirm, useToast } from '../../../components/ui';
import { BodyWeightForm } from '../../../features/progress/BodyWeightForm';
import { invalidateAfterBodyWeight, progressApi } from '../../../features/progress/api';
import { signedWeightText, useFmt } from '../../../features/progress/format';
import { oneOf, useUrlState } from '../../../features/progress/useUrlState';
import { useUnits } from '../../../hooks/useUnits';
import { useI18n } from '../../../i18n';
import { errorMessage } from '../../../lib/errors';

const VISIBLE_ENTRIES = 8;

/** Trend chart, logging form and the list of weigh-ins (with delete). */
export function BodyWeightCard() {
  const i18n = useI18n();
  const { t, formatDate, formatNumber } = i18n;
  const units = useUnits();
  const fmt = useFmt();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [range, setRange] = useUrlState<TrendPeriod>('bw', oneOf(TREND_PERIODS), 90);
  const [showAll, setShowAll] = useState(false);
  const query = useQuery({ queryKey: qk.bodyWeight(range), queryFn: () => progressApi.bodyWeight(range), placeholderData: keepPreviousData });
  const remove = useMutation({
    mutationFn: (id: string) => progressApi.deleteBodyWeight(id),
    onSuccess: async () => {
      toast.success(t('progress.bodyWeight.deleted'));
      await invalidateAfterBodyWeight(queryClient);
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'progress')),
  });

  const rangeOptions = TREND_PERIODS.map((p) => ({ value: p, label: t(p === 30 ? 'progress.range.d30' : p === 90 ? 'progress.range.d90' : 'progress.range.d365') }));
  const chartTitle = t('progress.bodyWeight.chartTitle', { unit: units.weightUnit });
  const entries = query.data?.entries ?? [];
  const first = entries[0];
  const last = entries[entries.length - 1];
  const newestFirst = [...entries].reverse();
  const visible = showAll ? newestFirst : newestFirst.slice(0, VISIBLE_ENTRIES);

  const onDelete = async (id: string, date: string, kg: number) => {
    const dateText = formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
    const ok = await confirm({
      title: t('progress.bodyWeight.deleteTitle'),
      body: t('progress.bodyWeight.deleteBody', { weight: units.formatWeight(kg), date: dateText }),
      confirmLabel: t('common.actions.delete'),
      danger: true,
    });
    if (ok) remove.mutate(id);
  };

  return (
    <Card
      title={t('progress.bodyWeight.title')}
      className="progress-bodyweight"
      actions={<Segmented<TrendPeriod> label={t('progress.range.label')} hideLabel options={rangeOptions} value={range} onChange={setRange} size="sm" />}
    >
      <div className="bw-layout">
        <div className="stack">
          {query.isPending ? (
            <LoadingState compact />
          ) : query.isError ? (
            <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <>
              <div className="bw-stats">
                <Stat icon="scale" label={t('progress.bodyWeight.latest')} value={last ? units.formatWeight(last.weightKg) : '—'} hint={last ? formatDate(last.date) : undefined} />
                <Stat
                  icon="chart"
                  tone="info"
                  label={t('progress.bodyWeight.change')}
                  value={first && last && entries.length > 1 ? signedWeightText(last.weightKg - first.weightKg, fmt) : '—'}
                  hint={t('progress.bodyWeight.entriesCount', { count: entries.length })}
                />
              </div>
              {entries.length === 1 && <p className="small muted progress-sparse">{t('progress.bodyWeight.sparseOne')}</p>}
              {entries.length > 1 && <p className="small muted progress-sparse">{t('progress.bodyWeight.fluctuationNote')}</p>}
              <div aria-live="polite">
                <h3 className="chart-heading">{chartTitle}</h3>
                <LineChart
                  data={entries.map((e) => ({ label: formatDate(e.date), value: units.toDisplay(e.weightKg) }))}
                  title={chartTitle}
                  tone="info"
                  formatValue={(v) => formatNumber(v)}
                  emptyMessage={t('progress.bodyWeight.empty')}
                />
              </div>
              {entries.length > 0 && (
                <div>
                  <h3 className="section-title">{t('progress.bodyWeight.entries')}</h3>
                  <ul className="list bw-entries">
                    {visible.map((e) => {
                      const dateText = formatDate(e.date, { day: 'numeric', month: 'short', year: 'numeric' });
                      return (
                        <li key={e.id} className="list-item">
                          <div className="bw-entry-body">
                            <strong className="num">{units.formatWeight(e.weightKg)}</strong>
                            <span className="muted small">
                              {dateText}
                              {e.note ? ` · ${e.note}` : ''}
                            </span>
                          </div>
                          <IconButton
                            icon="trash"
                            size="sm"
                            label={t('progress.bodyWeight.delete', { date: dateText })}
                            loading={remove.isPending && remove.variables === e.id}
                            onClick={() => void onDelete(e.id, e.date, e.weightKg)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                  {newestFirst.length > VISIBLE_ENTRIES && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                      {showAll ? t('common.actions.showLess') : t('common.actions.showMore')}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <section className="bw-form-panel" aria-labelledby="bw-form-title">
          <h3 id="bw-form-title" className="section-title">
            {t('progress.bodyWeight.formTitle')}
          </h3>
          <BodyWeightForm />
        </section>
      </div>
    </Card>
  );
}
