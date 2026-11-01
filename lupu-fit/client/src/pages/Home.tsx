import type { ReactNode } from 'react';
import { useLang } from '../i18n/index.tsx';
import { useProfile } from '../app/session.ts';
import { ErrorState, Loading } from '../ui/kit.tsx';
import { localIso } from '../components/home/dates.ts';
import { Checklist, MenuTeaser, NutritionCard, QuickActions, ReadinessCard, ResumeCard, TodayWorkoutCard, WeekCard, XpStrip, useActiveSession, useChecklist, useSessionList } from '../components/home/HomeCards.tsx';
import '../styles/home.css';

export default function Home(): ReactNode {
  const { t } = useLang();
  const profileQ = useProfile();
  const active = useActiveSession();
  const sessions = useSessionList();
  const today = localIso();
  const checklist = useChecklist(!!profileQ.data, today);

  if (profileQ.isLoading) return <Loading />;
  if (profileQ.isError) return <ErrorState error={profileQ.error} onRetry={() => void profileQ.refetch()} />;
  const data = profileQ.data;
  if (!data) return <ErrorState error={new Error('profile_required')} />;
  const { profile, targets } = data;
  const activeSession = active.data?.session ?? null;

  return (
    <div className="stack">
      <h1>{profile.displayName ? t('home.greetingName', { name: profile.displayName }) : t('home.greeting')}</h1>
      {activeSession ? <ResumeCard session={activeSession} /> : null}
      <div className="home-grid">
        <div className="stack">
          <TodayWorkoutCard profile={profile} today={today} primary={!activeSession && !active.isLoading} />
          <WeekCard goal={profile.daysPerWeek} sessions={sessions.data?.sessions} today={today} />
          <ReadinessCard today={today} />
        </div>
        <div className="stack">
          <NutritionCard today={today} targets={targets} />
          <MenuTeaser today={today} profile={profile} targets={targets} />
          <XpStrip />
        </div>
      </div>
      {checklist.ready ? <Checklist items={checklist.items} /> : null}
      <QuickActions />
    </div>
  );
}
