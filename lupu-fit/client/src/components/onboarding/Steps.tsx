import {
  ACTIVITY_LEVELS, ALLERGENS, DIET_TYPES, DIETARY_RESTRICTIONS, DIFFICULTIES, GOALS, INJURY_AREAS, LANGUAGES, LIMITS, KCAL_FLOOR, PLACES, SEXES, THEMES, UNITS,
  type NutritionNote, type NutritionTargets,
} from '@lupu-fit/shared';
import type { ReactNode } from 'react';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import { setTheme } from '../../lib/theme.ts';
import { Banner, Card, ChipGroup, NumberStepper, Segmented, Select, TextInput, Toggle } from '../../ui/kit.tsx';
import { DEFAULT_EQUIPMENT, GEAR_OPTIONS, type DraftData, type FieldErrors } from './model.ts';

export interface StepProps { d: DraftData; set: (patch: Partial<DraftData>) => void; errors: FieldErrors }
const toggleIn = <T,>(list: readonly T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function AboutStep({ d, set, errors }: StepProps): ReactNode {
  const t = useT();
  const minor = d.age !== null && d.age >= LIMITS.age.min && d.age <= 17;
  return (
    <div className="stack">
      <TextInput label={t('onboarding.about.name')} hint={t('onboarding.about.nameHint')} autoComplete="nickname" maxLength={60} value={d.displayName} onChange={(e) => set({ displayName: e.target.value })} />
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.about.sex')}</span>
        <Segmented label={t('onboarding.about.sex')} value={d.sex} options={SEXES.map((s) => ({ value: s, label: t(`label.sex.${s}`) }))} onChange={(sex) => set({ sex })} />
        <span className="hint">{t('onboarding.about.sexHint')}</span>
      </div>
      <div className="onb-grid">
        <div className="stack-sm">
          <NumberStepper label={t('onboarding.about.age')} suffix={t('unit.years')} value={d.age} min={0} max={150} onChange={(age) => set({ age })} />
          <span className={errors.age ? 'field-error' : 'hint'} role={errors.age ? 'alert' : undefined}>{errors.age ? t(errors.age, { min: LIMITS.age.min, max: LIMITS.age.max }) : t('onboarding.about.range', { min: LIMITS.age.min, max: LIMITS.age.max })}</span>
        </div>
        <div className="stack-sm">
          <NumberStepper label={t('onboarding.about.height')} suffix={t('unit.cm')} value={d.heightCm} min={0} max={300} onChange={(heightCm) => set({ heightCm })} />
          <span className={errors.heightCm ? 'field-error' : 'hint'} role={errors.heightCm ? 'alert' : undefined}>{errors.heightCm ? t(errors.heightCm, { min: LIMITS.heightCm.min, max: LIMITS.heightCm.max }) : t('onboarding.about.range', { min: LIMITS.heightCm.min, max: LIMITS.heightCm.max })}</span>
        </div>
        <div className="stack-sm">
          <NumberStepper label={t('onboarding.about.weight')} suffix={t('unit.kg')} value={d.weightKg} min={0} max={500} step={0.5} decimals={1} onChange={(weightKg) => set({ weightKg })} />
          <span className={errors.weightKg ? 'field-error' : 'hint'} role={errors.weightKg ? 'alert' : undefined}>{errors.weightKg ? t(errors.weightKg, { min: LIMITS.weightKg.min, max: LIMITS.weightKg.max }) : t('onboarding.about.range', { min: LIMITS.weightKg.min, max: LIMITS.weightKg.max })}</span>
        </div>
      </div>
      {minor ? <Banner>{t('onboarding.about.minorNotice')}</Banner> : null}
    </div>
  );
}

export function ExperienceStep({ d, set }: StepProps): ReactNode {
  const t = useT();
  return (
    <div className="stack">
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.experience.level')}</span>
        <Segmented label={t('onboarding.experience.level')} value={d.experience} options={DIFFICULTIES.map((x) => ({ value: x, label: t(`label.difficulty.${x}`) }))} onChange={(experience) => set({ experience })} />
        <span className="hint">{t(`onboarding.experience.desc.${d.experience}`)}</span>
      </div>
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.experience.injuries')}</span>
        <ChipGroup label={t('onboarding.experience.injuries')} options={INJURY_AREAS.map((x) => ({ value: x, label: t(`label.injury.${x}`) }))} selected={d.injuries} onToggle={(x) => set({ injuries: toggleIn(d.injuries, x) })} />
        <span className="hint">{d.injuries.length === 0 ? t('onboarding.experience.noInjuries') : t('onboarding.experience.injuriesHint')}</span>
      </div>
      <Banner tone="warn">{t('onboarding.injuryDisclaimer')}</Banner>
    </div>
  );
}

export function GoalStep({ d, set }: StepProps): ReactNode {
  const t = useT();
  const minorCut = d.age !== null && d.age >= LIMITS.age.min && d.age <= 17 && d.goal === 'fat_loss';
  return (
    <div className="stack">
      <ChipGroup label={t('onboarding.goal.title')} options={GOALS.map((g) => ({ value: g, label: t(`label.goal.${g}`) }))} selected={[d.goal]} onToggle={(goal) => set({ goal })} />
      <Card><p>{t(`onboarding.goal.desc.${d.goal}`)}</p></Card>
      {minorCut ? <Banner>{t('onboarding.note.minor_no_deficit')}</Banner> : null}
    </div>
  );
}

export function TrainingStep({ d, set, errors }: StepProps): ReactNode {
  const t = useT();
  const gear = d.place !== 'gym';
  return (
    <div className="stack">
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.training.place')}</span>
        <Segmented label={t('onboarding.training.place')} value={d.place} options={PLACES.map((p) => ({ value: p, label: t(`label.place.${p}`) }))} onChange={(place) => set({ place, equipment: [...DEFAULT_EQUIPMENT[place]] })} />
      </div>
      {gear ? (
        <div className="stack-sm">
          <span className="field-label">{t('onboarding.training.equipment')}</span>
          <ChipGroup label={t('onboarding.training.equipment')} options={GEAR_OPTIONS.map((x) => ({ value: x, label: t(`label.equipment.${x}`) }))} selected={d.equipment} onToggle={(x) => set({ equipment: toggleIn(d.equipment, x) })} />
          <span className="hint">{d.equipment.length === 0 ? t('onboarding.training.noGear') : t('onboarding.training.gearHint')}</span>
        </div>
      ) : <p className="hint">{t('onboarding.training.gymHint')}</p>}
      <div className="onb-grid">
        <div className="stack-sm">
          <NumberStepper label={t('onboarding.training.days')} suffix={t('unit.perWeek')} value={d.daysPerWeek} min={0} max={14} onChange={(v) => set({ daysPerWeek: v ?? 0 })} />
          {errors.daysPerWeek ? <span className="field-error" role="alert">{t(errors.daysPerWeek, { min: LIMITS.daysPerWeek.min, max: LIMITS.daysPerWeek.max })}</span> : null}
        </div>
        <div className="stack-sm">
          <NumberStepper label={t('onboarding.training.minutes')} suffix={t('unit.min')} value={d.sessionMinutes} min={0} max={300} step={5} onChange={(v) => set({ sessionMinutes: v ?? 0 })} />
          {errors.sessionMinutes ? <span className="field-error" role="alert">{t(errors.sessionMinutes, { min: LIMITS.sessionMinutes.min, max: LIMITS.sessionMinutes.max })}</span> : <span className="hint">{t('onboarding.about.range', { min: LIMITS.sessionMinutes.min, max: LIMITS.sessionMinutes.max })}</span>}
        </div>
      </div>
      {d.daysPerWeek === LIMITS.daysPerWeek.max ? <Banner>{t('onboarding.training.sevenDays', { n: LIMITS.maxLiftingDays })}</Banner> : null}
    </div>
  );
}

export function PreferencesStep({ d, set }: StepProps): ReactNode {
  const t = useT(); const { setLang } = useLang();
  return (
    <div className="stack">
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.prefs.language')}</span>
        <Segmented label={t('onboarding.prefs.language')} value={d.language} options={LANGUAGES.map((l) => ({ value: l, label: t(`onboarding.prefs.lang.${l}`) }))} onChange={(language) => { setLang(language); set({ language }); }} />
      </div>
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.prefs.theme')}</span>
        <Segmented label={t('onboarding.prefs.theme')} value={d.theme} options={THEMES.map((x) => ({ value: x, label: t(`onboarding.prefs.themes.${x}`) }))} onChange={(theme) => { setTheme(theme); set({ theme }); }} />
      </div>
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.prefs.units')}</span>
        <Segmented label={t('onboarding.prefs.units')} value={d.units} options={UNITS.map((x) => ({ value: x, label: t(`onboarding.prefs.unitNames.${x}`) }))} onChange={(units) => set({ units })} />
        <span className="hint">{t('onboarding.prefs.unitsHint')}</span>
      </div>
    </div>
  );
}

export function NutritionStep({ d, set, errors, kcalNow }: StepProps & { kcalNow: number | null }): ReactNode {
  const t = useT();
  const minor = d.age !== null && d.age >= LIMITS.age.min && d.age <= 17;
  return (
    <div className="stack">
      <Select label={t('onboarding.nutrition.activity')} value={d.activityLevel} onChange={(e) => set({ activityLevel: e.target.value as DraftData['activityLevel'] })} options={ACTIVITY_LEVELS.map((x) => ({ value: x, label: t(`label.activity.${x}`) }))} />
      <Select label={t('onboarding.nutrition.diet')} value={d.diet} onChange={(e) => set({ diet: e.target.value as DraftData['diet'] })} options={DIET_TYPES.map((x) => ({ value: x, label: t(`label.diet.${x}`) }))} />
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.nutrition.allergies')}</span>
        <ChipGroup label={t('onboarding.nutrition.allergies')} options={ALLERGENS.map((x) => ({ value: x, label: t(`label.allergen.${x}`) }))} selected={d.allergies} onToggle={(x) => set({ allergies: toggleIn(d.allergies, x) })} />
        <span className="hint">{t('disclaimer.allergen')}</span>
      </div>
      <div className="stack-sm">
        <span className="field-label">{t('onboarding.nutrition.restrictions')}</span>
        <ChipGroup label={t('onboarding.nutrition.restrictions')} options={DIETARY_RESTRICTIONS.map((x) => ({ value: x, label: t(`label.restriction.${x}`) }))} selected={d.restrictions} onToggle={(x) => set({ restrictions: toggleIn(d.restrictions, x) })} />
      </div>
      <div className="stack-sm">
        <Toggle label={t('onboarding.nutrition.custom')} checked={d.customKcal !== null} onChange={(on) => set({ customKcal: on ? (kcalNow ?? 2000) : null })} />
        {d.customKcal !== null ? (
          <>
            <NumberStepper label={t('onboarding.nutrition.customKcal')} suffix={t('unit.kcal')} value={d.customKcal} min={0} max={10000} step={50} onChange={(customKcal) => set({ customKcal })} />
            {errors.customKcal ? <span className="field-error" role="alert">{t(errors.customKcal)}</span> : null}
            <span className="hint">{minor ? t('onboarding.nutrition.floorMinor') : t('onboarding.nutrition.floor', { floor: fmt.num(KCAL_FLOOR[d.sex]) })}</span>
          </>
        ) : <span className="hint">{t('onboarding.nutrition.customOff')}</span>}
      </div>
    </div>
  );
}

const NOTE_ORDER: NutritionNote[] = ['minor_no_deficit', 'floor_applied', 'custom_clamped', 'deficit_capped_at_bmr', 'carb_floor_raised_kcal', 'bmi_adjusted_protein'];

export function ReviewStep({ d, targets }: { d: DraftData; targets: NutritionTargets | null }): ReactNode {
  const t = useT();
  const rows: [string, string][] = [
    [t('onboarding.review.goal'), t(`label.goal.${d.goal}`)],
    [t('onboarding.review.place'), t(`label.place.${d.place}`)],
    [t('onboarding.review.schedule'), `${d.daysPerWeek} × ${d.sessionMinutes} ${t('unit.min')}`],
    [t('onboarding.review.level'), t(`label.difficulty.${d.experience}`)],
  ];
  return (
    <div className="stack">
      <Card>
        <dl className="onb-summary">
          {rows.map(([k, v]) => <div key={k}><dt className="muted small">{k}</dt><dd className="strong">{v}</dd></div>)}
        </dl>
      </Card>
      {targets ? (
        <div className="stack" data-testid="review-nutrition">
          <h3>{t('onboarding.review.targets')}</h3>
          <div className="grid-2">
            <div className="kpi"><span className="label">{t('onboarding.review.bmr')}</span><span className="num-lg" data-testid="bmr">{fmt.num(targets.bmr)}</span></div>
            <div className="kpi"><span className="label">{t('onboarding.review.tdee')}</span><span className="num-lg" data-testid="tdee">{fmt.num(targets.tdee)}</span></div>
            <div className="kpi"><span className="label">{t('onboarding.review.target')}</span><span className="num-lg accent" data-testid="target">{fmt.num(targets.kcal)}</span></div>
            <div className="kpi"><span className="label">{t('onboarding.review.protein')}</span><span className="num-lg" data-testid="protein">{fmt.num(targets.proteinG)}</span></div>
            <div className="kpi"><span className="label">{t('onboarding.review.carbs')}</span><span className="num-lg" data-testid="carbs">{fmt.num(targets.carbsG)}</span></div>
            <div className="kpi"><span className="label">{t('onboarding.review.fat')}</span><span className="num-lg" data-testid="fat">{fmt.num(targets.fatG)}</span></div>
          </div>
          <p className="small muted">{t('onboarding.review.units', { kcal: t('unit.kcal'), g: t('unit.g') })}</p>
          {NOTE_ORDER.filter((n) => targets.notes.includes(n)).map((n) => <Banner key={n} {...(n === 'minor_no_deficit' ? {} : { tone: 'warn' as const })}>{t(`onboarding.note.${n}`)}</Banner>)}
        </div>
      ) : <Banner tone="warn">{t('onboarding.review.needBasics')}</Banner>}
      <Banner tone="warn">{t('onboarding.injuryDisclaimer')}</Banner>
      <Banner>{t('disclaimer.health')}</Banner>
    </div>
  );
}
