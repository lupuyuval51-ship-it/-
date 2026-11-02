import { useQuery } from '@tanstack/react-query';
import type { ProfileInput } from '@lupu-fit/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client.ts';
import { localIso } from '../components/home/dates.ts';
import { weekStartOf } from '../components/workouts/weekUtil.ts';
import { IS_DEVICE } from '../env.ts';
import { fmt, useLang } from '../i18n/index.tsx';
import { Banner, Button, LinkButton } from '../ui/kit.tsx';
import { ensureBackupSince, markCheckinSeen, readBackupState, readCheckinSeen, shouldShowBackup, shouldShowCheckin, snoozeBackup, summarizeLastWeek, type BackupState, type DatedRow, type WeightRow } from './checkin.ts';
import { isMinorAge } from './schedule.ts';
import { useAutomationSettings } from './settings.ts';
import '../styles/automation.css';

/** Calm, dismissible Home banners: weekly check-in and (Device Mode) monthly backup reminder. Nothing is sent anywhere. */
export function AutomationBanners({ profile }: { profile: Pick<ProfileInput, 'age' | 'daysPerWeek'> }): ReactNode {
  const { t, lang } = useLang();
  const { settings } = useAutomationSettings();
  const today = localIso();
  const wantCheckin = settings.auto.weeklyCheckin; const wantBackup = settings.auto.backupReminder && IS_DEVICE;
  // Same query keys as Home, so these share the cache and cost no extra requests.
  const sessions = useQuery({ queryKey: ['sessions', 'list'], enabled: wantCheckin || wantBackup, queryFn: () => api.get<{ sessions: DatedRow[] }>('/api/sessions', { limit: 100 }) });
  const weights = useQuery({ queryKey: ['weights', 'count'], enabled: wantCheckin || wantBackup, queryFn: () => api.get<{ entries: WeightRow[] }>('/api/weights', { days: 3650 }) });
  const [seen, setSeen] = useState<string | null>(() => readCheckinSeen());
  const [backup, setBackup] = useState<BackupState>(() => readBackupState());
  useEffect(() => { if (wantBackup) { ensureBackupSince(today); setBackup(readBackupState()); } }, [wantBackup, today]);

  const rows = sessions.data?.sessions; const wts = weights.data?.entries;
  if (!rows || !wts) return null;
  const hasHistory = rows.length > 0 || wts.length > 0;
  const showCheckin = shouldShowCheckin({ enabled: wantCheckin, today, lang, seenWeek: seen, hasHistory });
  const showBackup = shouldShowBackup({ enabled: wantBackup, isDevice: IS_DEVICE, today, state: backup, hasData: hasHistory });
  const sum = summarizeLastWeek({ today, lang, goal: profile.daysPerWeek, sessions: rows, weights: wts, includeWeight: !isMinorAge(profile.age) });
  const thisWeek = weekStartOf(today, lang);
  const dismissCheckin = (): void => { markCheckinSeen(thisWeek); setSeen(thisWeek); };

  return (
    <>
      {showCheckin ? (
        <Banner>
          <div className="stack-sm auto-banner" data-testid="weekly-checkin">
            <strong>{t('automation.checkin.title')}</strong>
            <span>{t('automation.checkin.workouts', { done: sum.done, goal: sum.goal })}{sum.done >= sum.goal ? ` ${t('automation.checkin.goalHit')}` : ''}</span>
            {sum.weightDeltaKg !== null ? <span>{t('automation.checkin.weight', { delta: `${sum.weightDeltaKg > 0 ? '+' : ''}${fmt.num(sum.weightDeltaKg, 1)}`, unit: t('unit.kg') })}</span> : null}
            <div className="row-wrap">
              <LinkButton size="sm" to="/progress" onClick={dismissCheckin}>{t('automation.checkin.cta')}</LinkButton>
              <Button size="sm" variant="ghost" onClick={dismissCheckin}>{t('automation.checkin.dismiss')}</Button>
            </div>
          </div>
        </Banner>
      ) : null}
      {showBackup ? (
        <Banner>
          <div className="stack-sm auto-banner" data-testid="backup-reminder">
            <strong>{t('automation.backup.title')}</strong>
            <span>{t('automation.backup.body')}</span>
            <div className="row-wrap">
              <LinkButton size="sm" to="/profile" onClick={() => { snoozeBackup(today); setBackup(readBackupState()); }}>{t('automation.backup.cta')}</LinkButton>
              <Button size="sm" variant="ghost" onClick={() => { snoozeBackup(today); setBackup(readBackupState()); }}>{t('automation.backup.dismiss')}</Button>
            </div>
          </div>
        </Banner>
      ) : null}
    </>
  );
}
