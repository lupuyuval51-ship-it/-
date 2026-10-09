import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { PROGRESS_PERIODS, type ProgressPeriod } from '@shared/constants';
import { qk } from '../../api/queryClient';
import { Card, LinkButton, PageHeader, QueryState, Segmented } from '../../components/ui';
import { progressApi } from '../../features/progress/api';
import { InsightList } from '../../features/progress/InsightList';
import { RecordList } from '../../features/progress/RecordList';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { AchievementsCard } from './sections/AchievementsCard';
import { ActivityCard } from './sections/ActivityCard';
import { BodyWeightCard } from './sections/BodyWeightCard';
import { ConsistencyCard } from './sections/ConsistencyCard';
import { MuscleGroupsCard } from './sections/MuscleGroupsCard';
import { NutritionHistoryCard } from './sections/NutritionHistoryCard';
import { StrengthCard } from './sections/StrengthCard';
import { SummarySection } from './sections/SummarySection';
import '../../styles/progress.css';

const DEFAULT_PERIOD: ProgressPeriod = 30;

function parsePeriod(raw: string | null): ProgressPeriod {
  const n = Number(raw);
  return (PROGRESS_PERIODS as readonly number[]).includes(n) ? (n as ProgressPeriod) : DEFAULT_PERIOD;
}

export default function ProgressPage() {
  const { t } = useI18n();
  useDocumentTitle(t('progress.title'));
  const [params, setParams] = useSearchParams();
  const period = parsePeriod(params.get('period'));
  const overview = useQuery({ queryKey: qk.progress(period), queryFn: () => progressApi.overview(period), placeholderData: keepPreviousData });

  const setPeriod = (p: ProgressPeriod) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('period', String(p));
        return next;
      },
      { replace: true },
    );

  return (
    <div className="progress-page">
      <PageHeader
        title={t('progress.title')}
        subtitle={t('progress.subtitle')}
        actions={
          <Segmented
            label={t('progress.period.label')}
            hideLabel
            options={PROGRESS_PERIODS.map((p) => ({ value: p, label: t('progress.period.days', { count: p }) }))}
            value={period}
            onChange={setPeriod}
          />
        }
      />
      <div className="stack-lg">
        <div className={`stack${overview.isPlaceholderData ? ' is-refreshing' : ''}`} aria-busy={overview.isFetching}>
          <QueryState query={overview}>
            {(o) => (
              <>
                <SummarySection overview={o} />
                <Card title={t('progress.insights.title')} className="progress-insights">
                  <InsightList insights={o.insights} />
                </Card>
                <div className="progress-grid">
                  <ActivityCard overview={o} />
                  <ConsistencyCard consistency={o.consistency} />
                  <MuscleGroupsCard groups={o.muscleGroupSets} />
                  <NutritionHistoryCard overview={o} />
                </div>
                <Card title={t('progress.records.title')} className="progress-records">
                  <RecordList records={o.records} emptyText={t('progress.records.empty')} />
                </Card>
              </>
            )}
          </QueryState>
        </div>
        <StrengthCard />
        <BodyWeightCard />
        <AchievementsCard />
        <Card title={t('progress.history.title')} className="progress-history">
          <div className="row-between">
            <p className="muted">{t('progress.history.body')}</p>
            <LinkButton to="/workouts/history" icon="calendar" iconEnd="chevronRight">
              {t('progress.history.link')}
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
