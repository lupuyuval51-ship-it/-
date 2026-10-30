/**
 * "Phone notifications" in the reminder settings: turn Web Push on or off for this device and
 * send a test. Rendered only when the server has push configured (see RemindersSection).
 * Permission is requested only from the enable tap. Secondary/ghost buttons only: the
 * section's Save is the one filled action.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { PushConfigResponse } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Notice, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { disablePush, enablePush, notificationPermission, ownEndpoint, pushSupported, sendTestPush, syncPushSubscription } from './push';

type View = 'checking' | 'unsupported' | 'denied' | 'off' | 'on';
type Busy = 'enable' | 'disable' | 'test' | null;

export function PushNotificationsControl({
  config,
  remindersOn,
  unsupportedExtra,
}: {
  config: PushConfigResponse;
  /** Saved reminder switch: when off, nothing is sent even with notifications on. */
  remindersOn: boolean;
  /** Shown under the "unsupported" message (e.g. the in-tab browser notification control). */
  unsupportedExtra?: ReactNode;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const queryClient = useQueryClient();
  const userId = useAuth().user?.id;
  const [view, setView] = useState<View>('checking');
  const [busy, setBusy] = useState<Busy>(null);

  const refresh = useCallback(async () => {
    if (!pushSupported()) return setView('unsupported');
    if (notificationPermission() === 'denied') return setView('denied');
    setView(userId && (await ownEndpoint(userId)) ? 'on' : 'off');
  }, [userId]);

  useEffect(() => {
    void refresh();
    // Coming back from the system settings may have changed the permission.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const done = async () => {
    await refresh();
    await queryClient.invalidateQueries({ queryKey: qk.push });
  };

  const enable = async () => {
    if (!userId || !config.publicKey) return;
    setBusy('enable');
    try {
      const result = await enablePush(userId, config.publicKey);
      if (result === 'on') toast.success(t('settings.reminders.push.enabledToast'));
      else if (result === 'dismissed' || result === 'denied') toast.info(t('settings.reminders.push.dismissedToast'));
      await done();
    } catch (err) {
      toast.error(err instanceof ApiError ? errorMessage(err, i18n, 'settings') : t('settings.reminders.push.failed'));
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const disable = async () => {
    setBusy('disable');
    try {
      await disablePush();
      toast.success(t('settings.reminders.push.disabledToast'));
      await done();
    } catch (err) {
      toast.error(errorMessage(err, i18n, 'settings'));
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    if (!userId) return;
    setBusy('test');
    try {
      const attempt = async () => sendTestPush((await ownEndpoint(userId)) ?? undefined);
      let result;
      try {
        result = await attempt();
      } catch (err) {
        // The server forgot this device (e.g. "log out of all devices"): register it again once.
        if (!(err instanceof ApiError && err.status === 404)) throw err;
        await syncPushSubscription(userId);
        result = await attempt();
      }
      if (result.sent > 0) toast.success(t('settings.reminders.push.testSent'));
      else toast.error(t('settings.reminders.push.testFailed'));
      await done();
    } catch (err) {
      toast.error(err instanceof ApiError ? errorMessage(err, i18n, 'settings') : t('settings.reminders.push.testFailed'));
    } finally {
      setBusy(null);
    }
  };

  if (view === 'checking') return null;

  return (
    <div className="stack-sm" data-testid="push-notifications">
      <span className="field-label">{t('settings.reminders.push.label')}</span>
      <div aria-live="polite" className="stack-sm">
        {view === 'unsupported' && <p className="small muted">{t('settings.reminders.push.unsupported')}</p>}
        {view === 'denied' && (
          // A steady state, not an urgent alert: role="note" rather than role="alert".
          <Notice tone="info" icon="warning" title={t('settings.reminders.push.denied')}>
            {t('settings.reminders.push.deniedHelp')}
          </Notice>
        )}
        {view === 'off' && <p className="small muted">{t('settings.reminders.push.offHint')}</p>}
        {view === 'on' && (
          <>
            <p className="small">{t('settings.reminders.push.on')}</p>
            {config.devices > 1 && <p className="small muted">{t('settings.reminders.push.devices', { count: config.devices })}</p>}
            {!remindersOn && <p className="small muted">{t('settings.reminders.push.remindersOff')}</p>}
          </>
        )}
      </div>
      {view === 'unsupported' && unsupportedExtra}
      {view === 'off' && (
        <div>
          <Button size="sm" icon="bell" onClick={enable} loading={busy === 'enable'} disabled={busy !== null}>
            {t('settings.reminders.push.enable')}
          </Button>
        </div>
      )}
      {view === 'on' && (
        <div className="row">
          <Button size="sm" icon="send" onClick={test} loading={busy === 'test'} disabled={busy !== null}>
            {t('settings.reminders.push.test')}
          </Button>
          <Button size="sm" variant="ghost" onClick={disable} loading={busy === 'disable'} disabled={busy !== null}>
            {t('settings.reminders.push.disable')}
          </Button>
        </div>
      )}
    </div>
  );
}
