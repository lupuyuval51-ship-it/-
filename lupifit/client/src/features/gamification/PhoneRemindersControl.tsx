/**
 * "Phone notifications" in the reminder settings of the Android app (`platform.reminders` supported):
 * the reminders are scheduled on the phone itself. Notification permission is asked only from the tap on
 * "Allow notifications" (Android 13+). Secondary button only: the section's Save is the one filled action.
 */
import { useCallback, useEffect, useState } from 'react';
import { Button, Notice, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { platform, type NotificationPermission } from '../../platform';
import { requestReminderSync } from './phoneReminders';

export function PhoneRemindersControl({ remindersOn }: { remindersOn: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'checking'>('checking');
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => setPermission(await platform.reminders.permission()), []);

  useEffect(() => {
    void refresh();
    // Coming back from Android's settings may have changed the permission.
    return platform.onResume(() => void refresh());
  }, [refresh]);

  const allow = async () => {
    setPending(true);
    try {
      const result = await platform.reminders.request();
      setPermission(result);
      if (result === 'granted') {
        toast.success(t('settings.reminders.phone.grantedToast'));
        requestReminderSync();
      } else {
        toast.info(t('settings.reminders.phone.deniedToast'));
      }
    } finally {
      setPending(false);
    }
  };

  if (permission === 'checking') return null;

  return (
    <div className="stack-sm" data-testid="phone-notifications">
      <span className="field-label">{t('settings.reminders.phone.label')}</span>
      <div aria-live="polite" className="stack-sm">
        {permission === 'granted' && (
          <>
            <p className="small">{t('settings.reminders.phone.on')}</p>
            {!remindersOn && <p className="small muted">{t('settings.reminders.phone.remindersOff')}</p>}
          </>
        )}
        {permission === 'prompt' && <p className="small muted">{t('settings.reminders.phone.prompt')}</p>}
        {permission === 'denied' && (
          <Notice tone="info" icon="warning" title={t('settings.reminders.phone.denied')}>
            {t('settings.reminders.phone.deniedHelp')}
          </Notice>
        )}
      </div>
      {permission === 'prompt' && (
        <div>
          <Button size="sm" icon="bell" onClick={allow} loading={pending}>
            {t('settings.reminders.phone.allow')}
          </Button>
        </div>
      )}
    </div>
  );
}
