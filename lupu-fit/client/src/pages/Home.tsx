import type { ReactNode } from 'react';
import { useLang } from '../i18n/index.tsx';
import { useProfile } from '../app/session.ts';
import { ErrorState } from '../ui/kit.tsx';
import { PageHeader, SkeletonCard } from '../ui/patterns.tsx';
import { localIso } from '../components/home/dates.ts';
import { Checklist, KpiStrip, MenuTeaser, NutritionCard, QuickActions, ReadinessCard, ResumeCard, TodayWorkoutCard, XpStrip, useActiveSession, useChecklist, useSessionList } from '../components/home/HomeCards.tsx';
import '../styles/home.css';

export default function Home(): ReactNode {
  const { t } = useLang();
  const profileQ = useProfile();
  const active = useActiveSession();
  const sessions = useSessionList();
  const today = localIso();
  const checklist = useChecklist(!!profileQ.data, today);

  if (profileQ.isLoading) return <div className="stack" role="status" aria-busy="true"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  if (profileQ.isError) return <ErrorState error={profileQ.error} onRetry={() => void profileQ.refetch()} />;
  const data = profileQ.data;
  if (!data) return <ErrorState error={new Error('profile_required')} />;
  const { profile, targets } = data;
  const activeSession = active.data?.session ?? null;

  return (
    <div className="stack">
      <PageHeader title={profile.displayName ? t('home.greetingName', { name: profile.displayName }) : t('home.greeting')} />
      {activeSession ? <ResumeCard session={activeSession} /> : active.isLoading ? <SkeletonCard /> : null}
      {activeSession ? null : <TodayWorkoutCard profile={profile} today={today} primary={!active.isLoading} />}
      <KpiStrip goal={profile.daysPerWeek} sessions={sessions.data?.sessions} today={today} targets={targets} />
      {checklist.ready && checklist.isNew ? <Checklist items={checklist.items} /> : null}
      <div className="home-grid">
        <div className="stack">
          <ReadinessCard today={today} />
          <XpStrip />
        </div>
        <div className="stack">
          <NutritionCard today={today} targets={targets}><MenuTeaser embedded today={today} profile={profile} targets={targets} /></NutritionCard>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
