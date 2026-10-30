import { useState } from 'react';
import { Switch } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useSessionPrefs } from './prefs';
import { readTimerMuted, writeTimerMuted } from './storage';
import { wakeLockSupported } from './wakeLock';

export const SHORTCUTS = [
  { keys: 'C', action: 'complete' },
  { keys: 'U', action: 'undo' },
  { keys: '[ ]', action: 'navigate' },
  { keys: 'R', action: 'rest' },
  { keys: 'P', action: 'pause' },
] as const;

/** Per-device workout settings (screen wake lock, haptics, sound, auto-advance) and desktop shortcuts. */
export function SessionPrefsPanel() {
  const { t } = useI18n();
  const [prefs, update] = useSessionPrefs();
  const [muted, setMuted] = useState(readTimerMuted);
  const supported = wakeLockSupported();
  return (
    <details className="session-prefs card">
      <summary>{t('session.prefs.title')}</summary>
      <div className="stack-sm session-prefs-body">
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
        <div className="session-shortcuts">
          <h3 className="section-title">{t('session.shortcuts.title')}</h3>
          <dl className="kv">
            {SHORTCUTS.map((s) => (
              <div key={s.action} className="session-shortcut">
                <dt>
                  <kbd>{s.keys}</kbd>
                </dt>
                <dd>{t(`session.shortcuts.${s.action}`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </details>
  );
}
