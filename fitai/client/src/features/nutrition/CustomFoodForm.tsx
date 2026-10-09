import { useState, type FormEvent } from 'react';
import { ALLERGENS, ANIMAL_SOURCES, FOOD_CATEGORIES, FOOD_CONTAINS, type Allergen, type AnimalSource, type FoodCategory, type FoodContains } from '@shared/constants';
import { customFoodSchema, type CustomFoodInput } from '@shared/schemas/nutrition';
import type { FoodDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { Button, ChipGroup, Notice, NumberField, SelectField, TextField } from '../../components/ui';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { serverFieldErrors, zodFieldErrors } from './forms';

interface FormState {
  name: string;
  brand: string;
  barcode: string;
  category: FoodCategory | '';
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodiumMg: number | null;
  servingGrams: number | null;
  servingLabel: string;
  allergens: Allergen[];
  animalSource: AnimalSource;
  contains: FoodContains[];
}

function initialState(food?: FoodDTO, barcode?: string): FormState {
  if (!food) {
    return {
      name: '',
      brand: '',
      barcode: barcode ?? '',
      category: '',
      kcal: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      sugar: null,
      sodiumMg: null,
      servingGrams: 100,
      servingLabel: '',
      allergens: [],
      animalSource: 'none',
      contains: [],
    };
  }
  return {
    name: food.name.en,
    brand: food.brand ?? '',
    barcode: food.barcode ?? '',
    category: food.category,
    kcal: food.per100g.kcal,
    protein: food.per100g.protein,
    carbs: food.per100g.carbs,
    fat: food.per100g.fat,
    fiber: food.per100g.fiber,
    sugar: food.per100g.sugar,
    sodiumMg: food.per100g.sodiumMg,
    servingGrams: food.serving.grams,
    servingLabel: food.serving.label.en,
    allergens: food.allergens,
    animalSource: food.animalSource,
    contains: food.contains,
  };
}

function toInput(s: FormState): Record<string, unknown> {
  return {
    name: s.name,
    brand: s.brand.trim() || null,
    barcode: s.barcode.trim() || null,
    category: s.category || undefined,
    per100g: { kcal: s.kcal, protein: s.protein, carbs: s.carbs, fat: s.fat, fiber: s.fiber ?? 0, sugar: s.sugar, sodiumMg: s.sodiumMg },
    servingGrams: s.servingGrams,
    servingLabel: s.servingLabel,
    allergens: s.allergens,
    animalSource: s.animalSource,
    contains: s.contains,
  };
}

/** Create / edit form for a user food. Validates with the shared schema before submitting. */
export function CustomFoodForm({
  food,
  prefillBarcode,
  submitLabel,
  pending,
  serverError,
  onSubmit,
  onCancel,
}: {
  food?: FoodDTO;
  prefillBarcode?: string;
  submitLabel: string;
  pending: boolean;
  serverError?: unknown;
  onSubmit(input: CustomFoodInput): void;
  onCancel?(): void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const [s, setS] = useState<FormState>(() => initialState(food, prefillBarcode));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof FormState>(k: K) => (v: FormState[K]) => setS((cur) => ({ ...cur, [k]: v }));

  const fieldErrors = { ...(serverError instanceof ApiError && serverError.code === 'validation_error' ? serverFieldErrors(serverError.fieldErrors, i18n) : {}), ...errors };
  const err = (path: string) => fieldErrors[path] ?? null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const parsed = customFoodSchema.safeParse(toInput(s));
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error, i18n));
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  const num = (key: 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodiumMg', label: string, required = false) => (
    <NumberField
      label={label}
      value={s[key]}
      onChange={set(key)}
      step={key === 'kcal' || key === 'sodiumMg' ? 1 : 0.1}
      inputMode="decimal"
      min={0}
      required={required}
      error={err(`per100g.${key}`)}
      name={key}
    />
  );

  return (
    <form className="stack" onSubmit={submit} noValidate>
      {serverError != null && !(serverError instanceof ApiError && serverError.code === 'validation_error') && (
        <Notice tone="danger">{errorMessage(serverError, i18n, 'nutrition')}</Notice>
      )}
      <div className="grid-2">
        <TextField label={t('nutrition.custom.name')} value={s.name} onChange={(e) => set('name')(e.target.value)} error={err('name')} required maxLength={120} name="name" />
        <TextField label={t('nutrition.custom.brand')} value={s.brand} onChange={(e) => set('brand')(e.target.value)} error={err('brand')} maxLength={80} name="brand" />
        <SelectField
          label={t('nutrition.custom.category')}
          value={s.category}
          onChange={(e) => set('category')(e.target.value as FoodCategory | '')}
          error={err('category')}
          required
          options={[{ value: '', label: '—' }, ...FOOD_CATEGORIES.map((c) => ({ value: c, label: t(`enums.foodCategory.${c}`) }))]}
          name="category"
        />
        <TextField
          label={t('nutrition.custom.barcode')}
          hint={t('nutrition.custom.barcodeHint')}
          value={s.barcode}
          onChange={(e) => set('barcode')(e.target.value.replace(/\D/g, '').slice(0, 14))}
          error={err('barcode')}
          inputMode="numeric"
          dir="ltr"
          name="barcode"
        />
      </div>

      <fieldset className="nutri-fieldset">
        <legend className="field-label">{t('nutrition.custom.per100')}</legend>
        <div className="grid-3">
          {num('kcal', t('nutrition.custom.kcal'), true)}
          {num('protein', t('nutrition.custom.protein'), true)}
          {num('carbs', t('nutrition.custom.carbs'), true)}
          {num('fat', t('nutrition.custom.fat'), true)}
          {num('fiber', t('nutrition.custom.fiber'))}
          {num('sugar', t('nutrition.custom.sugar'))}
          {num('sodiumMg', t('nutrition.custom.sodium'))}
        </div>
        {err('per100g') && (
          <p className="field-error" role="alert">
            {err('per100g')}
          </p>
        )}
      </fieldset>

      <div className="grid-2">
        <NumberField
          label={t('nutrition.custom.servingGrams')}
          value={s.servingGrams}
          onChange={set('servingGrams')}
          step={1}
          inputMode="decimal"
          min={1}
          unit={t('common.units.g')}
          required
          error={err('servingGrams')}
          name="servingGrams"
        />
        <TextField
          label={t('nutrition.custom.servingLabel')}
          hint={t('nutrition.custom.servingLabelHint')}
          value={s.servingLabel}
          onChange={(e) => set('servingLabel')(e.target.value)}
          error={err('servingLabel')}
          maxLength={60}
          name="servingLabel"
        />
      </div>

      <ChipGroup<Allergen>
        label={t('nutrition.custom.allergens')}
        options={ALLERGENS.map((a) => ({ value: a, label: t(`enums.allergen.${a}`) }))}
        value={s.allergens}
        onChange={set('allergens')}
      />
      <SelectField
        label={t('nutrition.custom.animalSource')}
        value={s.animalSource}
        onChange={(e) => set('animalSource')(e.target.value as AnimalSource)}
        options={ANIMAL_SOURCES.map((a) => ({ value: a, label: t(`nutrition.custom.animal.${a}`) }))}
        name="animalSource"
      />
      <ChipGroup<FoodContains>
        label={t('nutrition.custom.contains')}
        options={FOOD_CONTAINS.map((c) => ({ value: c, label: t(`nutrition.custom.containsOptions.${c}`) }))}
        value={s.contains}
        onChange={set('contains')}
      />
      <div className="row nutri-form-actions">
        {onCancel && <Button onClick={onCancel}>{t('common.actions.cancel')}</Button>}
        <Button type="submit" variant="primary" icon="check" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
