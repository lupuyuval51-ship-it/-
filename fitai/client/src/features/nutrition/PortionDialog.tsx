import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { MEAL_TYPES, type MealType } from '@shared/constants';
import type { CreateLogEntryInput } from '@shared/schemas/nutrition';
import type { FoodDTO, LogEntryResponse } from '@shared/types';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Modal, Notice, NumberField, Segmented, SelectField, TextField, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { fetchAlternatives, logFood, nk } from './api';
import { ConflictBadges, useServingLabel } from './FoodBits';
import { useNutritionInvalidation, useUserToday } from './hooks';
import { MacroGrid, MacroLine, useMacroFormat } from './Macros';
import { amountError, convertAmount, gramsFor, maxLogDate, previewNutrients, quickAmounts, type AmountMode } from './portion';

export type PortionSource = CreateLogEntryInput['source'];

interface PortionDialogProps {
  food: FoodDTO | null;
  open: boolean;
  onClose(): void;
  date: string;
  mealType: MealType;
  source?: PortionSource;
  /** Pre-filled amount in grams (e.g. the last logged amount). Defaults to one serving. */
  initialGrams?: number | null;
  onLogged?(res: LogEntryResponse): void;
}

/**
 * Amount picker for one food: grams or servings, live nutrient preview, meal & date,
 * diet-conflict warning and compatible alternatives. Logging is idempotent and the
 * dialog closes on success so the user can keep adding foods.
 */
export function PortionDialog(props: PortionDialogProps) {
  if (!props.food || !props.open) return null;
  return <PortionDialogInner key={props.food.id} {...props} food={props.food} />;
}

function PortionDialogInner({ food, open, onClose, date, mealType, source = 'manual', initialGrams, onLogged }: PortionDialogProps & { food: FoodDTO }) {
  const i18n = useI18n();
  const { t, lt, formatNumber } = i18n;
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
  const today = useUserToday();
  const servingLabel = useServingLabel();
  const f = useMacroFormat();

  const [current, setCurrent] = useState<FoodDTO>(food);
  const [mode, setMode] = useState<AmountMode>('grams');
  const [amount, setAmount] = useState<number | null>(initialGrams && initialGrams > 0 ? initialGrams : food.serving.grams);
  const [meal, setMeal] = useState<MealType>(mealType);
  const [day, setDay] = useState(date);
  const [touched, setTouched] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(food.conflicts.length > 0);

  const alternatives = useQuery({
    queryKey: nk.alternatives(current.id),
    queryFn: () => fetchAlternatives(current.id),
    enabled: open && showAlternatives,
    staleTime: 5 * 60_000,
  });

  const per100 = current.per100g;
  const preview = previewNutrients(per100, mode, amount, current.serving.grams);
  const error = amountError(mode, amount, current.serving.grams);
  const dateInvalid = !day || day > maxLogDate(today);
  const name = lt(current.name);

  const mutation = useIdempotentMutation((vars: CreateLogEntryInput, key: string) => logFood(vars, key), {
    onSuccess: (res) => {
      invalidate(res.day);
      toast.success(t('nutrition.portion.logged', { name, meal: t(`enums.mealType.${res.entry.mealType}`) }));
      onLogged?.(res);
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  const switchFood = (alt: FoodDTO) => {
    setCurrent(alt);
    setMode('grams');
    setAmount(alt.serving.grams);
    setTouched(false);
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (error || dateInvalid || mutation.isPending) return;
    mutation.mutate({
      date: day,
      mealType: meal,
      foodId: current.id,
      ...(mode === 'grams' ? { grams: gramsFor('grams', amount, current.serving.grams)! } : { servings: amount! }),
      source,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('nutrition.portion.title', { name })}
      footer={
        <>
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button variant="primary" icon="check" loading={mutation.isPending} onClick={() => submit()}>
            {t('nutrition.portion.log')}
          </Button>
        </>
      }
    >
      <form className="stack portion-form" onSubmit={submit} noValidate>
        <div className="stack-sm">
          <div className="row small muted">
            {current.brand && <span>{current.brand}</span>}
            <Badge>{t(`enums.foodCategory.${current.category}`)}</Badge>
            {current.isOwn && <Badge tone="info">{t('nutrition.portion.myFood')}</Badge>}
          </div>
          <div className="small">
            <span className="muted">{t('nutrition.portion.per100')}: </span>
            <MacroLine m={{ kcal: per100.kcal, proteinG: per100.protein, carbsG: per100.carbs, fatG: per100.fat, fiberG: per100.fiber }} />
          </div>
        </div>

        {current.conflicts.length > 0 && (
          <Notice tone="warning" title={t('nutrition.portion.conflictsTitle')}>
            <div className="food-badges">
              <ConflictBadges conflicts={current.conflicts} />
            </div>
          </Notice>
        )}

        <Segmented<AmountMode>
          label={t('nutrition.portion.unitLabel')}
          value={mode}
          onChange={(m) => {
            setAmount((a) => convertAmount(mode, m, a, current.serving.grams));
            setMode(m);
          }}
          options={[
            { value: 'grams', label: t('nutrition.portion.grams') },
            { value: 'servings', label: `${t('nutrition.portion.servings')} · ${servingLabel(current.serving)}` },
          ]}
        />
        <NumberField
          label={t('nutrition.portion.amountLabel')}
          value={amount}
          onChange={setAmount}
          step={mode === 'grams' ? 1 : 0.25}
          inputMode="decimal"
          unit={mode === 'grams' ? t('common.units.g') : t('nutrition.portion.servings')}
          error={touched && error ? fieldErrorMessage(error, i18n) : null}
          required
          name="amount"
        />
        <div className="chips" role="group" aria-label={t('nutrition.portion.quickPick')}>
          {quickAmounts(mode, current.serving.grams).map((q) => (
            <button key={q} type="button" className={`chip${amount === q ? ' chip-active' : ''}`} aria-pressed={amount === q} onClick={() => setAmount(q)}>
              {mode === 'grams' ? t('nutrition.units.grams', { value: formatNumber(q) }) : t('nutrition.units.servings', { count: q })}
            </button>
          ))}
        </div>

        <section className="stack-sm" aria-label={t('nutrition.portion.preview')}>
          <h3 className="section-title">{t('nutrition.portion.preview')}</h3>
          <MacroGrid m={preview} live />
        </section>

        <div className="grid-2">
          <SelectField
            label={t('nutrition.meal.label')}
            value={meal}
            onChange={(e) => setMeal(e.target.value as MealType)}
            options={MEAL_TYPES.map((m) => ({ value: m, label: t(`enums.mealType.${m}`) }))}
          />
          <TextField
            label={t('nutrition.date.label')}
            type="date"
            value={day}
            max={maxLogDate(today)}
            onChange={(e) => setDay(e.target.value)}
            error={touched && dateInvalid ? t('nutrition.date.futureLimit') : null}
          />
        </div>

        <div className="stack-sm">
          <Button variant="ghost" size="sm" icon={showAlternatives ? 'chevronUp' : 'swap'} aria-expanded={showAlternatives} onClick={() => setShowAlternatives((v) => !v)}>
            {showAlternatives ? t('nutrition.portion.alternativesHide') : t('nutrition.portion.alternativesShow')}
          </Button>
          {showAlternatives && (
            <section aria-label={t('nutrition.portion.alternativesTitle')} className="stack-sm">
              <h3 className="section-title">{t('nutrition.portion.alternativesTitle')}</h3>
              {alternatives.isPending ? (
                <LoadingState compact />
              ) : alternatives.isError ? (
                <ErrorState compact error={alternatives.error} onRetry={() => void alternatives.refetch()} />
              ) : alternatives.data.length === 0 ? (
                <EmptyState compact icon="search" title={t('nutrition.portion.alternativesEmpty')} />
              ) : (
                <ul className="list">
                  {alternatives.data.map((alt) => (
                    <li key={alt.id} className="list-item">
                      <div className="food-item-body">
                        <strong>{lt(alt.name)}</strong>
                        <span className="small muted num">
                          {t('nutrition.units.perHundred', { kcal: f.kcal(alt.per100g.kcal) })} · {t('common.macros.protein')} {f.gramsText(alt.per100g.protein)}
                        </span>
                      </div>
                      <Button size="sm" onClick={() => switchFood(alt)} aria-label={t('nutrition.portion.useAlternative', { name: lt(alt.name) })}>
                        {t('nutrition.portion.use')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
