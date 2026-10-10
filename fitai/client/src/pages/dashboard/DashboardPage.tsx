import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { Card, LinkButton, PageHeader, QueryState } from '../../components/ui';
import { useDashboard } from '../../features/dashboard/api';
import { GettingStartedCard } from '../../features/dashboard/GettingStartedCard';
import { NextWorkoutCard } from '../../features/dashboard/NextWorkoutCard';
import { NutritionTodayCard } from '../../features/dashboard/NutritionTodayCard';
import { QuickActions } from '../../features/dashboard/QuickActions';
import { ResumeBanner } from '../../features/dashboard/ResumeBanner';
import { WeeklyGoalCard } from '../../features/dashboard/WeeklyGoalCard';
import { localClock } from '../../features/gamification/reminders';
import { InsightList } from '../../features/progress/InsightList';
import { LogBodyWeightModal } from '../../features/progress/LogBodyWeightModal';
import { RecordList } from '../../features/progress/RecordList';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import '../../styles/progress.css';
import '../../styles/dashboard.css';
import '../../styles/ux-session.css';

function greetingKey(minutes: number) {
  const hour = Math.floor(minutes / 60);
  if (hour >= 5 && hour < 12) return 'dashboard.greeting.morning' as const;
  if (hour >= 12 && hour < 17) return 'dashboard.greeting.afternoon' as const;
  if (hour >= 17 && hour < 22) return 'dashboard.greeting.evening' as const;
  return 'dashboard.greeting.night' as const;
}

export default function DashboardPage() {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const query = useDashboard();
  const [weightOpen, setWeightOpen] = useState(false);
  useDocumentTitle(t('dashboard.title'));

  const clock = localClock(new Date(), user?.timezone ?? 'UTC');
  const name = user?.displayName ?? '';

  return (
    <div className="dashboard">
      <PageHeader
        title={t(greetingKey(clock.minutes), { name })}
        subtitle={formatDate(query.data?.today ?? clock.date, { weekday: 'long', day: 'numeric', month: 'long' })}
      />
      <QueryState query={query}>
        {(data) => (
          <div className="stack">
            {data.activeSession && <ResumeBanner session={data.activeSession} />}
            <div className="dash-grid">
              <NextWorkoutCard data={data} />
              <GettingStartedCard data={data} />
              <NutritionTodayCard nutrition={data.nutritionToday} />
              <WeeklyGoalCard data={data} />
              <Card
                title={t('dashboard.insights.title')}
                className="dash-insights"
                actions={
                  <LinkButton to="/progress" variant="ghost" size="sm" iconEnd="chevronRight">
                    {t('dashboard.insights.viewAll')}
                  </LinkButton>
                }
              >
                <InsightList insights={data.insights} limit={2} />
              </Card>
              <Card
                title={t('dashboard.records.title')}
                className="dash-records"
                actions={
                  <LinkButton to="/progress" variant="ghost" size="sm" iconEnd="chevronRight">
                    {t('dashboard.records.viewAll')}
                  </LinkButton>
                }
              >
                <RecordList records={data.recentRecords} emptyText={t('dashboard.records.empty')} />
              </Card>
              <QuickActions onLogWeight={() => setWeightOpen(true)} />
            </div>
          </div>
        )}
      </QueryState>
      <LogBodyWeightModal open={weightOpen} onClose={() => setWeightOpen(false)} />
    </div>
  );
}
