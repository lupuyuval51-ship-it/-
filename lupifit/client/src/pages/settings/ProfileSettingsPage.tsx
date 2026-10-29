import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router';
import { useAuth } from '../../auth/AuthProvider';
import { ErrorState, LoadingState, PageHeader, useConfirm } from '../../components/ui';
import { useProfile } from '../../features/profile/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n, type TKey } from '../../i18n';
import { AccountSection } from './AccountSection';
import { PrivacySection } from './PrivacySection';
import { BodySection, NutritionSection, TrainingSection } from './ProfileSections';
import { RemindersSection } from './RemindersSection';
import { PageGuardContext } from './sectionForm';
import { SecuritySection } from './SecuritySection';
import { TargetsSection } from './TargetsSection';
import { WorkoutPrefsSection } from './WorkoutPrefsSection';
import '../../styles/profile.css';

const SECTIONS: { id: string; label: TKey }[] = [
  { id: 'settings-account', label: 'settings.account.title' },
  { id: 'settings-body', label: 'settings.body.title' },
  { id: 'settings-training', label: 'settings.training.title' },
  { id: 'settings-nutrition', label: 'settings.nutrition.title' },
  { id: 'settings-targets', label: 'settings.targets.title' },
  { id: 'settings-reminders', label: 'settings.reminders.title' },
  { id: 'settings-workout', label: 'settings.workout.title' },
  { id: 'settings-security', label: 'settings.security.title' },
  { id: 'settings-privacy', label: 'settings.privacy.title' },
];

/** Tracks unsaved sections and confirms before leaving the page with changes. */
function usePageGuardState() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [dirty, setDirtyMap] = useState<Record<string, boolean>>({});
  const leaving = useRef(false);
  const anyDirty = Object.values(dirty).some(Boolean);

  const setDirty = useCallback((id: string, value: boolean) => {
    setDirtyMap((m) => (Boolean(m[id]) === value ? m : { ...m, [id]: value }));
  }, []);
  const allowLeave = useCallback(() => {
    leaving.current = true;
  }, []);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => anyDirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname);
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    void confirm({ title: t('settings.leave.title'), body: t('settings.leave.body'), confirmLabel: t('settings.leave.confirm'), danger: true }).then((ok) => {
      const b = blockerRef.current;
      if (b.state !== 'blocked') return;
      if (ok) b.proceed();
      else b.reset();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state]);

  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [anyDirty]);

  return useMemo(() => ({ setDirty, allowLeave }), [setDirty, allowLeave]);
}

export default function ProfileSettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const profile = useProfile();
  const guard = usePageGuardState();
  useDocumentTitle(t('settings.title'));

  return (
    <PageGuardContext.Provider value={guard}>
      <div className="settings-page">
        <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
        <nav className="settings-nav" aria-label={t('settings.sectionsNav')}>
          <ul className="chips">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a className="chip" href={`#${s.id}`}>
                  {t(s.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {user && <AccountSection user={user} />}
        {profile.isPending ? (
          <LoadingState />
        ) : profile.isError ? (
          <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
        ) : (
          <>
            <BodySection profile={profile.data} />
            <TrainingSection profile={profile.data} />
            <NutritionSection profile={profile.data} />
            <TargetsSection profile={profile.data} />
            <RemindersSection profile={profile.data} />
          </>
        )}
        <WorkoutPrefsSection />
        <SecuritySection />
        <PrivacySection />
      </div>
    </PageGuardContext.Provider>
  );
}
