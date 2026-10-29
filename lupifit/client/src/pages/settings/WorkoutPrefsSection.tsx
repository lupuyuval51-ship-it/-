/** Workout settings that follow the account to every device (kept locally first, so they also work offline). */
import { Card, Switch } from '../../components/ui';
import { useSessionPrefs } from '../../features/sessions/prefs';
import { wakeLockSupported } from '../../features/sessions/wakeLock';
import { readTimerMuted, writeTimerMuted } from '../../features/sessions/storage';
import { useState } from 'react';
import { useI18n } from '../../i18n';

export function WorkoutPrefsSection() {
  const { t } = useI18n();
  const [prefs, update] = useSessionPrefs();
  const [muted, setMuted] = useState(readTimerMuted);
  const supported = wakeLockSupported();
  return (
    <Card id="settings-workout" title={t('settings.workout.title')} subtitle={t('settings.workout.subtitle')} className="settings-section">
      <div className="stack-sm">
        <Switch
          label={t('session.prefs.wakeLock')}
          hint={supported ? undefined : t('session.prefs.wakeLockUnsupported')}
          checked={prefs.wakeLock && supported}
          disabled={!supported}
          onChange={(v) => update({ wakeLock: v })}
        />
        <Switch
          label={t('session.prefs.sound')}
          checked={!muted}
          onChange={(v) => {
            writeTimerMuted(!v);
            setMuted(!v);
          }}
        />
        <Switch label={t('session.prefs.vibrate')} hint={t('session.prefs.vibrateHint')} checked={prefs.vibrate} onChange={(v) => update({ vibrate: v })} />
        <Switch label={t('session.prefs.autoAdvance')} checked={prefs.autoAdvance} onChange={(v) => update({ autoAdvance: v })} />
      </div>
    </Card>
  );
}
