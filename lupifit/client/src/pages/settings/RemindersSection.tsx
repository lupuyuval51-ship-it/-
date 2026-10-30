/**
 * Reminder preferences (PATCH /api/settings) and how reminders reach the user: in the Android app,
 * notifications scheduled on the phone; otherwise phone notifications (Web Push) when the server has
 * them configured, or in-app reminders with optional browser notifications while the app is open.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { MAX_MEAL_REMINDERS, remindersSchema } from '@shared/schemas/profile';
import type { ProfileDTO, ReminderSettings } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { Button, ChipGroup, IconButton, Notice, Switch, TextField, useToast } from '../../components/ui';
import { applyProfileChange, updateSettings } from '../../features/profile/api';
import { firstInvalidField, validate } from '../../features/profile/draft';
import { FieldSlot, useWeekdayOptions } from '../../features/profile/fields';
import { focusField, localizeIssues, serverFieldErrors, type FieldErrors } from '../../features/profile/validation';
import { PhoneRemindersControl } from '../../features/gamification/PhoneRemindersControl';
import { fetchPushConfig } from '../../features/push/push';
import { PushNotificationsControl } from '../../features/push/PushNotificationsControl';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { platform } from '../../platform';
import { SectionCard, useSectionForm } from './sectionForm';

type Permission = NotificationPermission | 'unsupported';

function currentPermission(): Permission {
  return typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported';
}

function NotificationPermissionControl() {
  const { t } = useI18n();
  const toast = useToast();
  const [permission, setPermission] = useState<Permission>(currentPermission);
  const [pending, setPending] = useState(false);

  const request = async () => {
    if (permission === 'unsupported') return;
    setPending(true);
    try {
      // Older Safari only supports the callback form.
      const result = await new Promise<NotificationPermission>((resolve) => {
        const maybe = window.Notification.requestPermission(resolve);
        if (maybe && typeof maybe.then === 'function') void maybe.then(resolve);
      });
      setPermission(result);
      if (result === 'granted') toast.success(t('settings.reminders.permission.grantedToast'));
      else toast.info(t('settings.reminders.permission.deniedToast'));
    } catch {
      setPermission(currentPermission());
    } finally {
      setPending(false);
    }
  };

  const message =
    permission === 'granted'
      ? t('settings.reminders.permission.granted')
      : permission === 'denied'
        ? t('settings.reminders.permission.denied')
        : permission === 'unsupported'
          ? t('settings.reminders.permission.unsupported')
          : t('settings.reminders.permission.default');

  return (
    <div className="stack-sm">
      <span className="field-label">{t('settings.reminders.permission.label')}</span>
      <p className="small muted" aria-live="polite">
        {message}
      </p>
      {permission === 'default' && (
        <div>
          <Button size="sm" icon="bell" onClick={request} loading={pending}>
            {t('settings.reminders.permission.request')}
          </Button>
        </div>
      )}
    </div>
  );
}

export function RemindersSection({ profile }: { profile: ProfileDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const queryClient = useQueryClient();
  const weekdays = useWeekdayOptions('short');
  const source = useMemo<ReminderSettings>(() => profile.reminders, [profile.reminders]);
  const form = useSectionForm('reminders', source);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const r = form.values;
  const phoneReminders = platform.reminders.supported();
  const push = useQuery({ queryKey: qk.push, queryFn: fetchPushConfig, staleTime: 5 * 60_000, enabled: !phoneReminders });

  const mutation = useMutation({
    mutationFn: ({ reminders }: { reminders: ReminderSettings; submitted: ReminderSettings }) => updateSettings({ reminders }),
    onSuccess: async (res, { submitted }) => {
      form.commit(res.profile.reminders, submitted);
      toast.success(t('settings.saved'));
      await applyProfileChange(queryClient, res.profile);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'validation_error') {
        const fe = serverFieldErrors(err.details, i18n);
        setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k.replace(/^reminders\./, ''), v])));
      }
      setFormError(errorMessage(err, i18n, 'settings'));
    },
  });

  const set = (patch: Partial<ReminderSettings>) => {
    form.set(patch);
    setErrors({});
  };

  const onSubmit = () => {
    setFormError(null);
    const result = validate(remindersSchema, r);
    if (!result.ok) {
      setErrors(localizeIssues(result.issues, i18n, false));
      focusField(firstInvalidField(['workoutDays', 'workoutTime', 'mealTimes'], result.issues), formRef.current ?? document);
      return;
    }
    mutation.mutate({ reminders: result.data, submitted: r });
  };

  return (
    <SectionCard
      id="settings-reminders"
      title={t('settings.reminders.title')}
      subtitle={t('settings.reminders.subtitle')}
      dirty={form.dirty}
      saving={mutation.isPending}
      error={formError}
      formRef={formRef}
      onSubmit={onSubmit}
      onDiscard={() => {
        form.reset();
        setErrors({});
        setFormError(null);
      }}
    >
      <Switch label={t('settings.reminders.enabled')} checked={r.enabled} onChange={(enabled) => set({ enabled })} />
      {r.enabled && (
        <div className="stack profile-subsection">
          <FieldSlot name="workoutDays">
            <ChipGroup
              label={t('settings.reminders.workoutDays')}
              options={weekdays}
              value={r.workoutDays.map(String)}
              onChange={(v) => set({ workoutDays: v.map(Number).sort((a, b) => a - b) })}
              error={errors.workoutDays}
            />
          </FieldSlot>
          <FieldSlot name="workoutTime" className="profile-time-field">
            <TextField
              type="time"
              label={t('settings.reminders.workoutTime')}
              value={r.workoutTime}
              onChange={(e) => set({ workoutTime: e.target.value })}
              error={errors.workoutTime}
              required
              dir="ltr"
              name="workoutTime"
            />
          </FieldSlot>
          <Switch label={t('settings.reminders.mealLogging')} checked={r.mealLogging} onChange={(mealLogging) => set({ mealLogging })} />
          {r.mealLogging && (
            <FieldSlot name="mealTimes">
              <fieldset className="field">
                <legend className="field-label">{t('settings.reminders.mealTimes')}</legend>
                <ul className="profile-time-list">
                  {r.mealTimes.map((time, i) => (
                    <li key={i} className="row">
                      <TextField
                        type="time"
                        label={t('settings.reminders.mealTime', { n: i + 1 })}
                        value={time}
                        onChange={(e) => set({ mealTimes: r.mealTimes.map((x, j) => (j === i ? e.target.value : x)) })}
                        error={errors[`mealTimes.${i}`]}
                        required
                        dir="ltr"
                        fieldClassName="profile-time-field"
                      />
                      <IconButton icon="trash" label={t('settings.reminders.removeMealTime', { n: i + 1 })} onClick={() => set({ mealTimes: r.mealTimes.filter((_, j) => j !== i) })} />
                    </li>
                  ))}
                </ul>
                <div>
                  <Button size="sm" icon="plus" onClick={() => set({ mealTimes: [...r.mealTimes, '12:00'] })} disabled={r.mealTimes.length >= MAX_MEAL_REMINDERS}>
                    {t('settings.reminders.addMealTime')}
                  </Button>
                </div>
              </fieldset>
            </FieldSlot>
          )}
        </div>
      )}
      {phoneReminders ? (
        // Android app: reminders are scheduled on the phone itself.
        <PhoneRemindersControl remindersOn={profile.reminders.enabled} />
      ) : push.isPending ? null : push.data?.enabled ? (
        <PushNotificationsControl
          config={push.data}
          remindersOn={profile.reminders.enabled}
          // Without push, notifications can still show while the app is open in a tab.
          unsupportedExtra={currentPermission() === 'unsupported' ? null : <NotificationPermissionControl />}
        />
      ) : (
        <>
          <NotificationPermissionControl />
          <Notice tone="info" icon="info">
            {t('settings.reminders.honestNote')}
          </Notice>
        </>
      )}
    </SectionCard>
  );
}
