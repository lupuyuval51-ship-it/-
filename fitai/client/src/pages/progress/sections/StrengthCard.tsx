import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TREND_PERIODS, type TrendPeriod } from '@shared/schemas/progress';
import { formatClock } from '@shared/training';
import type { ExerciseProgressDTO, ExerciseProgressPointDTO } from '@shared/types';
import { qk } from '../../../api/queryClient';
import { LineChart } from '../../../components/charts/Charts';
import { Card, EmptyState, ErrorState, LoadingState, Segmented, SelectField } from '../../../components/ui';
import { progressApi } from '../../../features/progress/api';
import { RecordList } from '../../../features/progress/RecordList';
import { useUnits } from '../../../hooks/useUnits';
import { useI18n } from '../../../i18n';

type Metric = 'est1rm' | 'maxWeight' | 'maxReps' | 'maxDuration' | 'volume';

const WEIGHT_METRICS: Metric[] = ['est1rm', 'maxWeight', 'volume'];

const VALUE: Record<Metric, (p: ExerciseProgressPointDTO) => number | null> = {
  est1rm: (p) => p.bestEst1rmKg,
  maxWeight: (p) => p.maxWeightKg,
  maxReps: (p) => p.maxReps,
  maxDuration: (p) => p.maxDurationSeconds,
  volume: (p) => (p.volumeKg > 0 ? p.volumeKg : null),
};

/** Metrics that make sense for the exercise's tracking type (and that have data). */
function metricsFor(data: ExerciseProgressDTO): Metric[] {
  const has = (m: Metric) => data.points.some((p) => VALUE[m](p) != null);
  switch (data.trackingType) {
    case 'weight_reps':
      return WEIGHT_METRICS;
    case 'reps':
      return ['maxReps', ...(['maxWeight', 'volume'] as Metric[]).filter(has)];
    case 'time':
      return ['maxDuration'];
  }
}

export function StrengthCard() {
  const { t, lt, formatDate, formatNumber } = useI18n();
  const units = useUnits();
  const [range, setRange] = useState<TrendPeriod>(90);
  const [selected, setSelected] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric | null>(null);

  const trained = useQuery({ queryKey: qk.trainedExercises, queryFn: progressApi.trainedExercises });
  const exercises = trained.data?.exercises ?? [];
  const exerciseId = selected && exercises.some((e) => e.exerciseId === selected) ? selected : (exercises[0]?.exerciseId ?? null);
  const detail = useQuery({
    queryKey: qk.exerciseProgress(exerciseId ?? '', range),
    queryFn: () => progressApi.exercise(exerciseId!, range),
    enabled: exerciseId != null,
    placeholderData: keepPreviousData,
  });

  const rangeOptions = TREND_PERIODS.map((p) => ({ value: p, label: t(p === 30 ? 'progress.range.d30' : p === 90 ? 'progress.range.d90' : 'progress.range.d365') }));

  let body;
  if (trained.isPending) body = <LoadingState compact />;
  else if (trained.isError) body = <ErrorState compact error={trained.error} onRetry={() => void trained.refetch()} />;
  else if (!exercises.length) body = <EmptyState compact icon="chart" title={t('progress.strength.empty')} />;
  else {
    const data = detail.data && detail.data.exerciseId === exerciseId ? detail.data : undefined;
    const available = data ? metricsFor(data) : [];
    const active = metric && available.includes(metric) ? metric : available[0];
    const isWeight = active === 'est1rm' || active === 'maxWeight' || active === 'volume';
    const points =
      data && active
        ? data.points.map((p) => {
            const v = VALUE[active](p);
            return { label: formatDate(p.date), value: v == null ? null : isWeight ? units.toDisplay(v) : v };
          })
        : [];
    const metricLabel = active ? t(`progress.strength.metrics.${active}`) : '';
    const chartTitle = `${t('progress.strength.chartTitle', { metric: metricLabel, exercise: data ? lt(data.name) : '' })}${isWeight ? ` (${units.weightUnit})` : ''}`;
    body = (
      <div className="stack">
        <div className="strength-controls">
          <SelectField
            label={t('progress.strength.exercise')}
            value={exerciseId ?? ''}
            onChange={(e) => setSelected(e.target.value)}
            options={exercises.map((e) => ({ value: e.exerciseId, label: `${lt(e.name)} · ${t('progress.strength.sessions', { count: e.sessions })}` }))}
          />
          <Segmented<TrendPeriod> label={t('progress.range.label')} options={rangeOptions} value={range} onChange={setRange} size="sm" />
        </div>
        {detail.isPending ? (
          <LoadingState compact />
        ) : detail.isError ? (
          <ErrorState compact error={detail.error} onRetry={() => void detail.refetch()} />
        ) : data ? (
          <>
            {available.length > 1 && (
              <Segmented<Metric>
                label={t('progress.strength.metric')}
                options={available.map((m) => ({ value: m, label: t(`progress.strength.metrics.${m}`) }))}
                value={active ?? null}
                onChange={setMetric}
                size="sm"
              />
            )}
            <div aria-live="polite" aria-busy={detail.isFetching}>
              <h3 className="chart-heading">{chartTitle}</h3>
              <LineChart
                data={points}
                title={chartTitle}
                formatValue={(v) => (active === 'maxDuration' ? formatClock(v) : formatNumber(v))}
                emptyMessage={t('progress.strength.noPoints')}
              />
            </div>
            <div>
              <h3 className="section-title">{t('progress.strength.records')}</h3>
              <RecordList records={data.records.slice(0, 5)} showExercise={false} emptyText={t('progress.strength.noRecords')} />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <Card title={t('progress.strength.title')} subtitle={t('progress.strength.subtitle')} className="progress-strength">
      {body}
    </Card>
  );
}
