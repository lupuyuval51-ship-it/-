import { ACTIVITY_LEVELS, ALLERGENS, DIET_TYPES, DIETARY_RESTRICTIONS, DIFFICULTIES, EQUIPMENT, GOALS, INJURY_AREAS, PLACES, ProfileInputSchema, SEXES, type ProfileInput } from '@lupu-fit/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import { Button, ChipGroup, Segmented, Select, TextInput } from '../../ui/kit.tsx';

const toggle = <T,>(arr: readonly T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const opts = <T extends string>(vals: readonly T[], t: (k: string) => string, ns: string) => vals.map((v) => ({ value: v, label: t(`label.${ns}.${v}`) }));

/** Pure validation used by the form and tests. */
export function validateProfile(p: ProfileInput): { ok: true; data: ProfileInput } | { ok: false; paths: string[] } {
  const r = ProfileInputSchema.safeParse(p);
  return r.success ? { ok: true, data: r.data } : { ok: false, paths: [...new Set(r.error.issues.map((i) => i.path.join('.')))] };
}

/** Free-typing numeric field: no per-keystroke clamping (the kit stepper would turn "4" into the minimum). Range errors show on save. */
function NumField({ label, value, onChange, error, suffix, optional }: { label: string; value: number | undefined; onChange: (n: number | undefined) => void; error?: string | undefined; suffix?: string; optional?: boolean }): ReactNode {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => { setText((cur) => (Number(cur.replace(',', '.')) === value || (cur === '' && value === undefined) ? cur : value === undefined ? '' : String(value))); }, [value]);
  return (
    <TextInput label={suffix ? `${label} (${suffix})` : label} inputMode="decimal" autoComplete="off" value={text} error={error}
      onChange={(e) => {
        const raw = e.target.value; setText(raw);
        if (raw.trim() === '') { onChange(optional ? undefined : Number.NaN); return; }
        const n = Number(raw.replace(',', '.'));
        onChange(Number.isFinite(n) ? n : Number.NaN);
      }} />
  );
}

export function ProfileForm({ value, onChange, onLanguage, onTheme, onSave, saving, errors }: {
  value: ProfileInput; onChange: (p: ProfileInput) => void; onLanguage: (l: 'he' | 'en') => void; onTheme: (th: 'dark' | 'light' | 'system') => void;
  onSave: () => void; saving: boolean; errors: string[];
}): ReactNode {
  const t = useT();
  const set = <K extends keyof ProfileInput>(k: K, v: ProfileInput[K]) => onChange({ ...value, [k]: v });
  const err = (k: string) => (errors.includes(k) ? t('state.invalid') : undefined);
  const lb = Math.round(value.weightKg * 2.20462 * 10) / 10;
  const totalIn = Math.round(value.heightCm / 2.54);
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
      <TextInput label={t('profile.f.displayName')} value={value.displayName ?? ''} maxLength={60} onChange={(e) => set('displayName', e.target.value)} error={err('displayName')} />
      <Segmented label={t('profile.f.language')} value={value.language} onChange={onLanguage} options={[{ value: 'he', label: t('profile.lang.he') }, { value: 'en', label: t('profile.lang.en') }]} />
      <Segmented label={t('profile.f.theme')} value={value.theme} onChange={onTheme} options={[{ value: 'dark', label: t('profile.theme.dark') }, { value: 'light', label: t('profile.theme.light') }, { value: 'system', label: t('profile.theme.system') }]} />
      <Segmented label={t('profile.f.units')} value={value.units} onChange={(v) => set('units', v)} options={[{ value: 'metric', label: t('profile.units.metric') }, { value: 'imperial', label: t('profile.units.imperial') }]} />
      <Select label={t('profile.f.sex')} value={value.sex} onChange={(e) => set('sex', e.target.value as ProfileInput['sex'])} options={opts(SEXES, t, 'sex')} />
      <div className="grid-3">
        <NumField label={t('profile.f.age')} value={value.age} onChange={(n) => set('age', n as number)} error={err('age')} />
        <NumField label={t('profile.f.height')} suffix={t('unit.cm')} value={value.heightCm} onChange={(n) => set('heightCm', n as number)} error={err('heightCm')} />
        <NumField label={t('profile.f.weight')} suffix={t('unit.kg')} value={value.weightKg} onChange={(n) => set('weightKg', n as number)} error={err('weightKg')} />
      </div>
      {value.units === 'imperial' && Number.isFinite(lb) && Number.isFinite(totalIn) ? <span className="small muted">{t('profile.imperialHint', { lb: fmt.num(lb, 1), ft: Math.floor(totalIn / 12), inch: totalIn % 12 })}</span> : null}
      <Select label={t('profile.f.goal')} value={value.goal} onChange={(e) => set('goal', e.target.value as ProfileInput['goal'])} options={opts(GOALS, t, 'goal')} />
      <Select label={t('profile.f.experience')} value={value.experience} onChange={(e) => set('experience', e.target.value as ProfileInput['experience'])} options={opts(DIFFICULTIES, t, 'difficulty')} />
      <Select label={t('profile.f.place')} value={value.place} onChange={(e) => set('place', e.target.value as ProfileInput['place'])} options={opts(PLACES, t, 'place')} />
      <div className="grid-2">
        <NumField label={t('profile.f.days')} value={value.daysPerWeek} onChange={(n) => set('daysPerWeek', n as number)} error={err('daysPerWeek')} />
        <NumField label={t('profile.f.minutes')} suffix={t('unit.min')} value={value.sessionMinutes} onChange={(n) => set('sessionMinutes', n as number)} error={err('sessionMinutes')} />
      </div>
      <Select label={t('profile.f.activity')} value={value.activityLevel} onChange={(e) => set('activityLevel', e.target.value as ProfileInput['activityLevel'])} options={opts(ACTIVITY_LEVELS, t, 'activity')} />
      <ChipGroup label={t('profile.f.equipment')} options={opts(EQUIPMENT, t, 'equipment')} selected={value.equipment} onToggle={(v) => set('equipment', toggle(value.equipment, v))} />
      <ChipGroup label={t('profile.f.injuries')} options={opts(INJURY_AREAS, t, 'injury')} selected={value.injuries} onToggle={(v) => set('injuries', toggle(value.injuries, v))} />
      <Select label={t('profile.f.diet')} value={value.diet} onChange={(e) => set('diet', e.target.value as ProfileInput['diet'])} options={opts(DIET_TYPES, t, 'diet')} />
      <ChipGroup label={t('profile.f.allergies')} options={opts(ALLERGENS, t, 'allergen')} selected={value.allergies} onToggle={(v) => set('allergies', toggle(value.allergies, v))} />
      <ChipGroup label={t('profile.f.restrictions')} options={opts(DIETARY_RESTRICTIONS, t, 'restriction')} selected={value.restrictions} onToggle={(v) => set('restrictions', toggle(value.restrictions, v))} />
      <div className="stack-sm">
        <NumField optional label={t('profile.f.customKcal')} suffix={t('unit.kcal')} value={value.customKcal} onChange={(n) => set('customKcal', n)} error={err('customKcal')} />
        <span className="small muted">{t('profile.customKcalHint')}</span>
        {value.customKcal !== undefined ? <Button size="sm" variant="ghost" onClick={() => set('customKcal', undefined)}>{t('profile.clearCustomKcal')}</Button> : null}
      </div>
      <Button type="submit" variant="primary" disabled={saving}>{saving ? t('profile.saving') : t('action.save')}</Button>
    </form>
  );
}
