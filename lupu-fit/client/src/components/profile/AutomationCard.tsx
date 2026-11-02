import type { ProfileInput } from '@lupu-fit/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { deliveryMode, permissionState, requestPermission, type PermState } from '../../automation/delivery.ts';
import { inQuietHours, isMinorAge, suggestWeekdays } from '../../automation/schedule.ts';
import { MEAL_KINDS, parseHhmm, useAutomationSettings, type AutomationSettings, type MealKind, type Weekday } from '../../automation/settings.ts';
import { IS_DEVICE } from '../../env.ts';
import { useLang } from '../../i18n/index.tsx';
import { Banner, Select, TextInput, Toggle } from '../../ui/kit.tsx';
import '../../styles/automation.css';

type ReminderKey = 'workout' | 'meals' | 'weigh' | 'streak' | 'rest';
const DAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Settings > Automation: opt-in local reminders (default OFF) and small in-app automations. Everything stays on this device. */
export function AutomationCard({ profile }: { profile: Pick<ProfileInput, 'age' | 'daysPerWeek'> }): ReactNode {
  const { t, lang } = useLang();
  const { settings: s, update } = useAutomationSettings();
  const mode = deliveryMode();
  const [perm, setPerm] = useState<PermState>('prompt');
  const [blocked, setBlocked] = useState(false);
  useEffect(() => { let on = true; void permissionState().then((p) => { if (on) setPerm(p); }); return () => { on = false; }; }, []);

  const minor = isMinorAge(profile.age);
  const order = lang === 'he' ? DAYS : ([1, 2, 3, 4, 5, 6, 0] as const);
  const dayShort = (d: number): string => t(`automation.dayShort.d${d}`); const dayLong = (d: number): string => t(`automation.dayLong.d${d}`);
  const clash = (hhmm: string): boolean => { const p = parseHhmm(hhmm); return !!p && inQuietHours(p.hour * 60 + p.minute, s.quiet); };
  const trainDays: readonly Weekday[] = s.workout.days ?? suggestWeekdays(profile.daysPerWeek);

  /** Turning a reminder ON is the only place the OS permission is requested (once; later taps reuse the answer). */
  const setReminder = async (key: ReminderKey, on: boolean): Promise<void> => {
    if (on) {
      const st = await requestPermission();
      setPerm(st);
      if (st !== 'granted') { setBlocked(true); return; }
      setBlocked(false);
    }
    update((cur) => ({ ...cur, [key]: { ...cur[key], on } }) as AutomationSettings);
  };
  const patch = <K extends ReminderKey>(key: K, p: Partial<AutomationSettings[K]>): void => update((cur) => ({ ...cur, [key]: { ...cur[key], ...p } }));
  const toggleDay = (d: Weekday): void => update((cur) => {
    const base = cur.workout.days ?? suggestWeekdays(profile.daysPerWeek);
    const next = base.includes(d) ? base.filter((x) => x !== d) : [...base, d].sort();
    return { ...cur, workout: { ...cur.workout, days: next } };
  });
  const toggleMeal = (k: MealKind): void => update((cur) => ({ ...cur, meals: { ...cur.meals, kinds: cur.meals.kinds.includes(k) ? cur.meals.kinds.filter((x) => x !== k) : MEAL_KINDS.filter((x) => x === k || cur.meals.kinds.includes(x)) } }));
  const timeField = (label: string, value: string, onChange: (v: string) => void, warn = true): ReactNode => (
    <TextInput label={label} type="time" className="num" value={value} onChange={(e) => { if (parseHhmm(e.target.value)) onChange(e.target.value); }} {...(warn && clash(value) ? { hint: t('automation.quietClash') } : {})} />
  );
  const row = (key: ReminderKey, fields: ReactNode): ReactNode => (
    <div className="auto-row" data-testid={`auto-${key}`}>
      <Toggle label={t(`automation.${key}.label`)} checked={s[key].on} onChange={(v) => void setReminder(key, v)} />
      <span className="small muted">{t(`automation.${key}.hint`)}</span>
      {s[key].on ? <div className="auto-fields">{fields}</div> : null}
    </div>
  );

  return (
    <div className="stack auto-card">
      <p className="small muted">{t('automation.intro')}</p>

      {mode === 'none' ? <Banner tone="warn">{t('automation.note.none')}</Banner> : (
        <>
          <Banner tone={mode === 'web' ? 'warn' : undefined}>{t(mode === 'web' ? 'automation.note.web' : 'automation.note.native')}</Banner>
          {blocked || perm === 'denied' ? <Banner tone="warn"><span data-testid="auto-denied">{t('automation.denied')}</span></Banner> : null}

          {row('workout', (
            <>
              <div className="row-wrap" role="group" aria-label={t('automation.days')}>
                {order.map((d) => <button type="button" key={d} className="chip" aria-pressed={trainDays.includes(d)} aria-label={dayLong(d)} onClick={() => toggleDay(d)}>{dayShort(d)}</button>)}
              </div>
              {timeField(t('automation.time'), s.workout.time, (v) => patch('workout', { time: v }))}
            </>
          ))}

          {minor ? <p className="small muted">{t('automation.note.minor')}</p> : (
            <>
              {row('meals', (
                <>
                  <div className="row-wrap" role="group" aria-label={t('automation.meals.which')}>
                    {MEAL_KINDS.map((k) => <button type="button" key={k} className="chip" aria-pressed={s.meals.kinds.includes(k)} onClick={() => toggleMeal(k)}>{t(`automation.meals.${k}`)}</button>)}
                  </div>
                  {MEAL_KINDS.filter((k) => s.meals.kinds.includes(k)).map((k) => <div key={k}>{timeField(t(`automation.meals.${k}`), s.meals.times[k], (v) => update((cur) => ({ ...cur, meals: { ...cur.meals, times: { ...cur.meals.times, [k]: v } } })))}</div>)}
                </>
              ))}
              {row('weigh', (
                <>
                  <Select label={t('automation.day')} value={String(s.weigh.day)} options={order.map((d) => ({ value: String(d), label: dayLong(d) }))} onChange={(e) => patch('weigh', { day: Number(e.target.value) as Weekday })} />
                  {timeField(t('automation.time'), s.weigh.time, (v) => patch('weigh', { time: v }))}
                </>
              ))}
            </>
          )}

          {row('streak', timeField(t('automation.time'), s.streak.time, (v) => patch('streak', { time: v })))}
          {row('rest', timeField(t('automation.time'), s.rest.time, (v) => patch('rest', { time: v })))}

          <div className="auto-row" data-testid="auto-quiet">
            <Toggle label={t('automation.quiet.label')} checked={s.quiet.on} onChange={(v) => update((cur) => ({ ...cur, quiet: { ...cur.quiet, on: v } }))} />
            <span className="small muted">{t('automation.quiet.hint')}</span>
            {s.quiet.on ? (
              <div className="auto-fields">
                {timeField(t('automation.quiet.from'), s.quiet.start, (v) => update((cur) => ({ ...cur, quiet: { ...cur.quiet, start: v } })), false)}
                {timeField(t('automation.quiet.to'), s.quiet.end, (v) => update((cur) => ({ ...cur, quiet: { ...cur.quiet, end: v } })), false)}
              </div>
            ) : null}
          </div>
        </>
      )}

      <h3 className="auto-sub">{t('automation.inapp.title')}</h3>
      <Toggle label={t('automation.inapp.restTimer')} checked={s.auto.restTimer} onChange={(v) => update((cur) => ({ ...cur, auto: { ...cur.auto, restTimer: v } }))} />
      <Toggle label={t('automation.inapp.weeklyCheckin')} checked={s.auto.weeklyCheckin} onChange={(v) => update((cur) => ({ ...cur, auto: { ...cur.auto, weeklyCheckin: v } }))} />
      {IS_DEVICE ? (
        <>
          <Toggle label={t('automation.inapp.backupReminder')} checked={s.auto.backupReminder} onChange={(v) => update((cur) => ({ ...cur, auto: { ...cur.auto, backupReminder: v } }))} />
          <span className="small muted">{t('automation.inapp.backupHint')}</span>
        </>
      ) : null}
    </div>
  );
}
