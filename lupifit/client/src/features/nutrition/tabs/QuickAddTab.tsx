import { useState, type FormEvent } from 'react';
import type { MealType } from '@shared/constants';
import { quickAddSchema, type QuickAddInput } from '@shared/schemas/nutrition';
import { Button, Card, NumberField, TextField, useToast } from '../../../components/ui';
import { useIdempotentMutation } from '../../../hooks/useIdempotentMutation';
import { useI18n } from '../../../i18n';
import { errorMessage } from '../../../lib/errors';
import { sendOrQueue } from '../../offline/hooks';
import { quickAdd } from '../api';
import { zodFieldErrors } from '../forms';
import { useNutritionInvalidation } from '../hooks';

const EMPTY = { name: '', kcal: null as number | null, proteinG: null as number | null, carbsG: null as number | null, fatG: null as number | null, fiberG: null as number | null };

/** Log calories (and optional macros) without a database food. */
export function QuickAddTab({ date, mealType }: { date: string; mealType: MealType }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mealName = t(`enums.mealType.${mealType}`);

  const mutation = useIdempotentMutation((input: QuickAddInput, key: string) => sendOrQueue({ type: 'quick_add', input }, key, () => quickAdd(input, key)), {
    // Run even without a connection: sendOrQueue keeps the entry on this device instead of the mutation pausing.
    networkMode: 'always',
    onSuccess: (r, { vars }) => {
      if (r.queued) {
        toast.show(t('nutrition.offline.saved', { name: vars.name, meal: t(`enums.mealType.${vars.mealType}`) }), 'info');
        setForm(EMPTY);
        return;
      }
      const res = r.res;
      invalidate(res.day);
      toast.success(t('nutrition.quick.added', { name: vars.name, meal: t(`enums.mealType.${res.entry.mealType}`) }));
      setForm(EMPTY);
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    const parsed = quickAddSchema.safeParse({
      date,
      mealType,
      // A description is optional: fall back to a generic "Quick add" so calories can be logged in one field.
      name: form.name.trim() || t('nutrition.meals.quickAdd'),
      kcal: form.kcal,
      proteinG: form.proteinG ?? undefined,
      carbsG: form.carbsG ?? undefined,
      fatG: form.fatG ?? undefined,
      fiberG: form.fiberG ?? undefined,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error, i18n));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  const num = (key: 'kcal' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG', label: string, required = false) => (
    <NumberField
      label={label}
      value={form[key]}
      onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
      step={key === 'kcal' ? 1 : 0.1}
      inputMode="decimal"
      min={0}
      required={required}
      error={errors[key]}
      name={key}
    />
  );

  return (
    <Card title={t('nutrition.quick.title')} subtitle={t('nutrition.quick.intro')}>
      <form className="stack" onSubmit={submit} noValidate>
        <TextField
          label={t('nutrition.quick.name')}
          placeholder={t('nutrition.quick.namePlaceholder')}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
          hint={t('nutrition.quick.nameHint')}
          maxLength={120}
          name="name"
        />
        {num('kcal', t('nutrition.quick.kcal'), true)}
        <p className="small muted">{t('nutrition.quick.optional')}</p>
        <div className="grid-2">
          {num('proteinG', t('nutrition.quick.protein'))}
          {num('carbsG', t('nutrition.quick.carbs'))}
          {num('fatG', t('nutrition.quick.fat'))}
          {num('fiberG', t('nutrition.quick.fiber'))}
        </div>
        <Button type="submit" variant="primary" icon="plus" loading={mutation.isPending}>
          {t('nutrition.quick.submit', { meal: mealName })}
        </Button>
      </form>
    </Card>
  );
}
