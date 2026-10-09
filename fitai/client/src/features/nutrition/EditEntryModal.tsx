import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { MEAL_TYPES, type MealType } from '@shared/constants';
import { round1, scaleNutrients, type Macros } from '@shared/nutrition';
import { updateLogEntrySchema, type UpdateLogEntryInput } from '@shared/schemas/nutrition';
import type { FoodLogEntryDTO } from '@shared/types';
import { Badge, Button, Modal, Notice, NumberField, Segmented, SelectField, Switch, TextField, useConfirm, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { deleteEntry, updateEntry } from './api';
import { zodFieldErrors } from './forms';
import { useNutritionInvalidation, useUserToday } from './hooks';
import { MacroGrid } from './Macros';
import { amountError, convertAmount, gramsFor, maxLogDate, type AmountMode } from './portion';

const entryMacros = (e: FoodLogEntryDTO): Macros => ({ kcal: e.kcal, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG, fiberG: e.fiberG });

/** Edit amount / meal / date of a logged entry, correct its nutrients manually or revert a correction. */
export function EditEntryModal({ entry, open, onClose }: { entry: FoodLogEntryDTO | null; open: boolean; onClose(): void }) {
  if (!entry || !open) return null;
  return <EditEntryInner key={entry.id} entry={entry} onClose={onClose} />;
}

function EditEntryInner({ entry, onClose }: { entry: FoodLogEntryDTO; onClose(): void }) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const invalidate = useNutritionInvalidation();
  const today = useUserToday();

  const ref = entry.foodRef ?? null;
  const hasAmount = entry.grams != null;
  const isQuickAdd = entry.foodId == null && entry.grams == null;
  const name = lt(entry.foodName);

  const [mode, setMode] = useState<AmountMode>(entry.servings != null && ref ? 'servings' : 'grams');
  const [amount, setAmount] = useState<number | null>(entry.servings != null && ref ? entry.servings : entry.grams);
  const [meal, setMeal] = useState<MealType>(entry.mealType);
  const [day, setDay] = useState(entry.date);
  const [correcting, setCorrecting] = useState(isQuickAdd);
  const [values, setValues] = useState<Record<keyof Macros, number | null>>(entryMacros(entry));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const servingGrams = ref?.servingGrams ?? 1;
  const grams = hasAmount ? gramsFor(mode, amount, servingGrams) : null;
  const amountChanged = hasAmount && grams != null && Math.abs(grams - (entry.grams ?? 0)) > 0.05;
  const amountProblem = hasAmount ? amountError(mode, amount, servingGrams) : null;

  let preview = entryMacros(entry);
  if (correcting) preview = { kcal: values.kcal ?? 0, proteinG: values.proteinG ?? 0, carbsG: values.carbsG ?? 0, fatG: values.fatG ?? 0, fiberG: values.fiberG ?? 0 };
  else if (amountChanged && !entry.isCorrected && grams != null) {
    if (ref) preview = scaleNutrients(ref.per100g, grams);
    else {
      const f = grams / (entry.grams ?? grams);
      preview = { kcal: round1(entry.kcal * f), proteinG: round1(entry.proteinG * f), carbsG: round1(entry.carbsG * f), fatG: round1(entry.fatG * f), fiberG: round1(entry.fiberG * f) };
    }
  }

  const onDone = (res: { day: Parameters<typeof invalidate>[0] }, message: string) => {
    invalidate(res.day);
    toast.success(message);
    onClose();
  };
  const save = useMutation({
    mutationFn: (patch: UpdateLogEntryInput) => updateEntry(entry.id, patch),
    onSuccess: (res) => onDone(res, t('nutrition.entry.saved')),
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });
  const revert = useMutation({
    mutationFn: () => updateEntry(entry.id, { correction: null }),
    onSuccess: (res) => onDone(res, t('nutrition.entry.reverted')),
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });
  const remove = useMutation({
    mutationFn: () => deleteEntry(entry.id),
    onSuccess: (res) => onDone(res, t('nutrition.meals.deleted')),
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });
  const busy = save.isPending || revert.isPending || remove.isPending;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const patch: UpdateLogEntryInput = {};
    if (day !== entry.date) patch.date = day;
    if (meal !== entry.mealType) patch.mealType = meal;
    if (hasAmount) {
      if (amountProblem) {
        setErrors({ amount: fieldErrorMessage(amountProblem, i18n) ?? '' });
        return;
      }
      if (amountChanged || (mode === 'servings' && amount !== entry.servings)) {
        if (mode === 'grams') patch.grams = grams!;
        else patch.servings = amount!;
      }
    }
    // Nulls (cleared fields) are rejected by the schema below and shown as field errors.
    if (correcting) patch.correction = values as Macros;
    if (day > maxLogDate(today)) {
      setErrors({ date: t('nutrition.date.futureLimit') });
      return;
    }
    const parsed = updateLogEntrySchema.safeParse(patch);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error, i18n));
      return;
    }
    setErrors({});
    if (Object.keys(patch).length === 0) return onClose();
    save.mutate(patch);
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: t('nutrition.meals.deleteTitle'),
      body: t('nutrition.meals.deleteBody', { name, meal: t(`enums.mealType.${entry.mealType}`) }),
      confirmLabel: t('common.actions.delete'),
      danger: true,
    });
    if (ok) remove.mutate();
  };

  const setValue = (k: keyof Macros) => (v: number | null) => setValues((cur) => ({ ...cur, [k]: v }));
  const valueFields: [keyof Macros, string, number][] = [
    ['kcal', t('nutrition.custom.kcal'), 1],
    ['proteinG', t('nutrition.custom.protein'), 0.1],
    ['carbsG', t('nutrition.custom.carbs'), 0.1],
    ['fatG', t('nutrition.custom.fat'), 0.1],
    ['fiberG', t('nutrition.custom.fiber'), 0.1],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={t('nutrition.entry.title')}
      footer={
        <div className="row-between nutri-modal-footer">
          <Button variant="danger" icon="trash" onClick={onDelete} loading={remove.isPending} disabled={busy}>
            {t('nutrition.entry.deleteEntry')}
          </Button>
          <div className="row">
            <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
            <Button variant="primary" icon="check" onClick={() => submit()} loading={save.isPending} disabled={busy}>
              {t('common.actions.save')}
            </Button>
          </div>
        </div>
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        <div className="row">
          <strong>{name}</strong>
          {entry.isCorrected && <Badge tone="info">{t('nutrition.meals.corrected')}</Badge>}
        </div>

        {hasAmount ? (
          <div className="stack-sm">
            {ref && (
              <Segmented<AmountMode>
                label={t('nutrition.entry.amount')}
                size="sm"
                value={mode}
                onChange={(m) => {
                  setAmount((a) => convertAmount(mode, m, a, servingGrams));
                  setMode(m);
                }}
                options={[
                  { value: 'grams', label: t('nutrition.entry.grams') },
                  { value: 'servings', label: t('nutrition.entry.servingsOf', { label: lt(ref.servingLabel) || t('nutrition.units.servingDefault', { grams: ref.servingGrams }) }) },
                ]}
              />
            )}
            <NumberField
              label={t('nutrition.entry.amount')}
              value={amount}
              onChange={setAmount}
              step={mode === 'grams' ? 1 : 0.25}
              inputMode="decimal"
              unit={mode === 'grams' ? t('common.units.g') : t('nutrition.entry.servings')}
              error={errors.amount}
              name="amount"
            />
            {entry.isCorrected && <Notice tone="info">{t('nutrition.entry.correctedKept')}</Notice>}
            {!ref && !isQuickAdd && <p className="small muted">{t('nutrition.entry.foodGone')}</p>}
          </div>
        ) : (
          <p className="small muted">{t('nutrition.entry.noAmount')}</p>
        )}

        <div className="grid-2">
          <SelectField
            label={t('nutrition.meal.label')}
            value={meal}
            onChange={(e) => setMeal(e.target.value as MealType)}
            options={MEAL_TYPES.map((m) => ({ value: m, label: t(`enums.mealType.${m}`) }))}
          />
          <TextField label={t('nutrition.date.label')} type="date" value={day} max={maxLogDate(today)} onChange={(e) => setDay(e.target.value)} error={errors.date} />
        </div>

        {isQuickAdd ? (
          <h3 className="section-title">{t('nutrition.entry.valuesTitle')}</h3>
        ) : (
          <Switch label={t('nutrition.entry.correctToggle')} hint={t('nutrition.entry.correctHint')} checked={correcting} onChange={setCorrecting} />
        )}
        {correcting && (
          <div className="grid-2">
            {valueFields.map(([k, label, step]) => (
              <NumberField
                key={k}
                label={label}
                value={values[k]}
                onChange={setValue(k)}
                step={step}
                inputMode="decimal"
                min={0}
                error={errors[`correction.${k}`]}
                name={k}
              />
            ))}
          </div>
        )}

        <section className="stack-sm" aria-label={t('nutrition.entry.preview')}>
          <h3 className="section-title">{t('nutrition.entry.preview')}</h3>
          <MacroGrid m={preview} live />
        </section>

        {entry.isCorrected && ref && (
          <Button variant="secondary" icon="refresh" onClick={() => revert.mutate()} loading={revert.isPending} disabled={busy}>
            {t('nutrition.entry.revert')}
          </Button>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
