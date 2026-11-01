import { ACTIVITY_LEVELS, ALLERGENS, DIET_TYPES, DIETARY_RESTRICTIONS, DIFFICULTIES, EQUIPMENT, GOALS, INJURY_AREAS, LIMITS, PLACES, ProfileInputSchema, SEXES, type ProfileInput } from '@lupu-fit/shared';
import type { ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import { Button, ChipGroup, NumberStepper, Segmented, Select, TextInput } from '../../ui/kit.tsx';

const toggle = <T,>(arr: readonly T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const opts = <T extends string>(vals: readonly T[], t: (k: string) => string, ns: string) => vals.map((v) => ({ value: v, label: t(`label.${ns}.${v}`) }));

/** Pure validation used by the form and tests. */
export function validateProfile(p: ProfileInput): { ok: true; data: ProfileInput } | { ok: false; paths: string[] } {
  const r = ProfileInputSchema.safeParse(p);
  return r.success ? { ok: true, data: r.data } : { ok: false, paths: [...new Set(r.error.issues.map((i) => i.path.join('.')))] };
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
        <NumberStepper label={t('profile.f.age')} value={value.age} onChange={(v) => set('age', Math.round(v ?? LIMITS.age.min))} min={LIMITS.age.min} max={LIMITS.age.max} />
        <NumberStepper label={t('profile.f.height')} suffix={t('unit.cm')} value={value.heightCm} onChange={(v) => set('heightCm', v ?? LIMITS.heightCm.min)} min={LIMITS.heightCm.min} max={LIMITS.heightCm.max} />
        <NumberStepper label={t('profile.f.weight')} suffix={t('unit.kg')} value={value.weightKg} onChange={(v) => set('weightKg', v ?? LIMITS.weightKg.min)} min={LIMITS.weightKg.min} max={LIMITS.weightKg.max} step={0.5} decimals={1} />
      </div>
      {value.units === 'imperial' ? <span className="small muted">{t('profile.imperialHint', { lb: fmt.num(lb, 1), ft: Math.floor(totalIn / 12), inch: totalIn % 12 })}</span> : null}
      <Select label={t('profile.f.goal')} value={value.goal} onChange={(e) => set('goal', e.target.value as ProfileInput['goal'])} options={opts(GOALS, t, 'goal')} />
      <Select label={t('profile.f.experience')} value={value.experience} onChange={(e) => set('experience', e.target.value as ProfileInput['experience'])} options={opts(DIFFICULTIES, t, 'difficulty')} />
      <Select label={t('profile.f.place')} value={value.place} onChange={(e) => set('place', e.target.value as ProfileInput['place'])} options={opts(PLACES, t, 'place')} />
      <div className="grid-2">
        <NumberStepper label={t('profile.f.days')} value={value.daysPerWeek} onChange={(v) => set('daysPerWeek', Math.round(v ?? 1))} min={LIMITS.daysPerWeek.min} max={LIMITS.daysPerWeek.max} />
        <NumberStepper label={t('profile.f.minutes')} suffix={t('unit.min')} value={value.sessionMinutes} onChange={(v) => set('sessionMinutes', Math.round(v ?? LIMITS.sessionMinutes.min))} min={LIMITS.sessionMinutes.min} max={LIMITS.sessionMinutes.max} step={5} />
      </div>
      <Select label={t('profile.f.activity')} value={value.activityLevel} onChange={(e) => set('activityLevel', e.target.value as ProfileInput['activityLevel'])} options={opts(ACTIVITY_LEVELS, t, 'activity')} />
      <ChipGroup label={t('profile.f.equipment')} options={opts(EQUIPMENT, t, 'equipment')} selected={value.equipment} onToggle={(v) => set('equipment', toggle(value.equipment, v))} />
      <ChipGroup label={t('profile.f.injuries')} options={opts(INJURY_AREAS, t, 'injury')} selected={value.injuries} onToggle={(v) => set('injuries', toggle(value.injuries, v))} />
      <Select label={t('profile.f.diet')} value={value.diet} onChange={(e) => set('diet', e.target.value as ProfileInput['diet'])} options={opts(DIET_TYPES, t, 'diet')} />
      <ChipGroup label={t('profile.f.allergies')} options={opts(ALLERGENS, t, 'allergen')} selected={value.allergies} onToggle={(v) => set('allergies', toggle(value.allergies, v))} />
      <ChipGroup label={t('profile.f.restrictions')} options={opts(DIETARY_RESTRICTIONS, t, 'restriction')} selected={value.restrictions} onToggle={(v) => set('restrictions', toggle(value.restrictions, v))} />
      <div className="stack-sm">
        <NumberStepper label={t('profile.f.customKcal')} suffix={t('unit.kcal')} value={value.customKcal ?? null} onChange={(v) => set('customKcal', v === null ? undefined : Math.round(v))} min={800} max={6000} step={50} />
        <span className="small muted">{t('profile.customKcalHint')}</span>
        {value.customKcal !== undefined ? <Button size="sm" variant="ghost" onClick={() => set('customKcal', undefined)}>{t('profile.clearCustomKcal')}</Button> : null}
      </div>
      <Button type="submit" variant="primary" disabled={saving}>{saving ? t('profile.saving') : t('action.save')}</Button>
    </form>
  );
}
