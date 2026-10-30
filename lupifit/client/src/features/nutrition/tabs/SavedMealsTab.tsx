import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import type { MealType } from '@shared/constants';
import { saveMealFromDaySchema } from '@shared/schemas/nutrition';
import type { SavedMealDTO } from '@shared/types';
import { Badge, Button, EmptyState, IconButton, Modal, QueryState, TextField, useConfirm, useToast } from '../../../components/ui';
import { useIdempotentMutation } from '../../../hooks/useIdempotentMutation';
import { useI18n } from '../../../i18n';
import { errorMessage } from '../../../lib/errors';
import { deleteSavedMeal, fetchDay, fetchSavedMeals, logSavedMeal, nk, saveMealFromDay } from '../api';
import { zodFieldErrors } from '../forms';
import { useMealLabel, useNutritionInvalidation } from '../hooks';
import { MacroLine } from '../Macros';

/** Saved meals: log one to the selected meal & date, delete, or save the current meal as a new one. */
export function SavedMealsTab({ date, mealType }: { date: string; mealType: MealType }) {
  const i18n = useI18n();
  const { t } = i18n;
  const labels = useMealLabel();
  const [saveOpen, setSaveOpen] = useState(false);
  const meals = useQuery({ queryKey: nk.savedMeals, queryFn: fetchSavedMeals });
  const day = useQuery({ queryKey: nk.day(date), queryFn: ({ signal }) => fetchDay(date, signal) });
  const canSave = (day.data?.meals[mealType].entries ?? []).some((e) => e.foodId != null && e.grams != null);
  const mealName = labels.meal(mealType);

  return (
    <div className="stack">
      <div className="nutri-save-current">
        <Button icon="plus" onClick={() => setSaveOpen(true)} disabled={!canSave}>
          {t('nutrition.saved.saveCurrent', { meal: mealName })}
        </Button>
        <p className="small muted">
          {canSave ? t('nutrition.saved.saveCurrentHint', { meal: mealName, date: labels.date(date) }) : t('nutrition.saved.nothingToSave', { meal: mealName })}
        </p>
      </div>
      <QueryState
        query={meals}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon="list" title={t('nutrition.saved.empty')} body={t('nutrition.saved.emptyBody')} />}
      >
        {(list) => (
          <ul className="list">
            {list.map((m) => (
              <SavedMealRow key={m.id} meal={m} date={date} mealType={mealType} />
            ))}
          </ul>
        )}
      </QueryState>
      {saveOpen && <SaveMealModal date={date} mealType={mealType} onClose={() => setSaveOpen(false)} />}
    </div>
  );
}

function SavedMealRow({ meal, date, mealType }: { meal: SavedMealDTO; date: string; mealType: MealType }) {
  const i18n = useI18n();
  const { t, lt, formatNumber } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const invalidate = useNutritionInvalidation();
  const mealName = t(`enums.mealType.${mealType}`);
  const hasConflicts = meal.items.some((i) => i.food.conflicts.length > 0);

  const log = useIdempotentMutation((_: void, key: string) => logSavedMeal(meal.id, { date, mealType }, key), {
    onSuccess: (res) => {
      invalidate(res.day);
      toast.success(t('nutrition.saved.logged', { name: meal.name, meal: mealName }));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });
  const remove = useMutation({
    mutationFn: () => deleteSavedMeal(meal.id),
    onSuccess: () => {
      invalidate();
      toast.success(t('nutrition.saved.deleted'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  return (
    <li className="list-item saved-meal">
      <div className="food-item-body">
        <div className="row">
          <strong>{meal.name}</strong>
          {meal.mealType && <Badge>{t(`enums.mealType.${meal.mealType}`)}</Badge>}
          <span className="small muted">{t('nutrition.saved.items', { count: meal.items.length })}</span>
        </div>
        <span className="small muted">
          {meal.items
            .map((i) => `${lt(i.food.name)} (${t('nutrition.units.grams', { value: formatNumber(i.grams) })}${i.isCorrected ? `, ${t('nutrition.meals.corrected').toLocaleLowerCase(i18n.intlLocale)}` : ''})`)
            .join(' · ')}
        </span>
        <MacroLine m={meal.totals} className="small" />
        {meal.items.some((i) => i.isCorrected) && <span className="small muted">{t('nutrition.saved.correctionsKept')}</span>}
        {hasConflicts && (
          <Badge tone="warning" icon="warning">
            {t('nutrition.saved.conflictWarning')}
          </Badge>
        )}
      </div>
      <div className="food-item-actions">
        <IconButton
          icon="trash"
          size="sm"
          label={t('nutrition.saved.delete', { name: meal.name })}
          loading={remove.isPending}
          onClick={async () => {
            const ok = await confirm({
              title: t('nutrition.saved.deleteTitle'),
              body: t('nutrition.saved.deleteBody', { name: meal.name }),
              confirmLabel: t('common.actions.delete'),
              danger: true,
            });
            if (ok) remove.mutate();
          }}
        />
        <Button
          size="sm"
          variant="primary"
          icon="plus"
          loading={log.isPending}
          onClick={async () => {
            // Foods that conflict with the user's allergies / diet need an explicit "yes" before they are logged.
            if (hasConflicts) {
              const ok = await confirm({
                title: t('nutrition.saved.conflictConfirmTitle'),
                body: t('nutrition.saved.conflictConfirmBody', { name: meal.name }),
                confirmLabel: t('nutrition.portion.logAnyway'),
                danger: meal.items.some((i) => i.food.conflicts.some((c) => c.type === 'allergen')),
              });
              if (!ok) return;
            }
            log.mutate();
          }}
          aria-label={t('nutrition.saved.logTo', { name: meal.name, meal: mealName })}>
          {t('nutrition.saved.log')}
        </Button>
      </div>
    </li>
  );
}

function SaveMealModal({ date, mealType, onClose }: { date: string; mealType: MealType; onClose(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
  const mealName = t(`enums.mealType.${mealType}`);
  const [name, setName] = useState(t('nutrition.saved.defaultName', { meal: mealName.toLocaleLowerCase(i18n.intlLocale) }));
  const [error, setError] = useState<string | null>(null);
  const save = useIdempotentMutation((vars: { date: string; mealType: MealType; name: string }, key: string) => saveMealFromDay(vars, key), {
    onSuccess: (meal) => {
      invalidate();
      toast.success(t('nutrition.saved.savedToast', { name: meal.name }));
      onClose();
    },
    onError: (err) => setError(errorMessage(err, i18n, 'nutrition')),
  });
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const parsed = saveMealFromDaySchema.safeParse({ date, mealType, name });
    if (!parsed.success) {
      setError(zodFieldErrors(parsed.error, i18n).name ?? t('errors.validation_error'));
      return;
    }
    setError(null);
    save.mutate(parsed.data);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={t('nutrition.saved.saveTitle')}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button variant="primary" icon="check" loading={save.isPending} onClick={() => submit()}>
            {t('nutrition.saved.save')}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="stack">
        <TextField label={t('nutrition.saved.nameLabel')} value={name} onChange={(e) => setName(e.target.value)} error={error} required autoFocus maxLength={120} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
