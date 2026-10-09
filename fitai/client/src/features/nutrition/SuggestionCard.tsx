import { useState } from 'react';
import type { MealType } from '@shared/constants';
import type { LogTemplateInput } from '@shared/schemas/nutrition';
import type { MealSuggestionDTO } from '@shared/types';
import { Badge, Button, Icon, Segmented, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { logSuggestion } from './api';
import { useNutritionInvalidation } from './hooks';
import { MacroLine } from './Macros';
import { rescaleMeal } from './portion';

const SCALES = [0.5, 0.75, 1, 1.25, 1.5] as const;

/** A suggested meal: reasons, ingredients, totals, adjustable portion and a one-tap "log" action. */
export function MealSuggestionCard({ meal, date, mealType, compact = false }: { meal: MealSuggestionDTO; date: string; mealType: MealType; compact?: boolean }) {
  const i18n = useI18n();
  const { t, tx, lt, formatNumber } = i18n;
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
  const [scale, setScale] = useState(meal.scale);
  const { items, totals } = rescaleMeal(meal.items, meal.scale, scale);
  const name = lt(meal.name);

  const log = useIdempotentMutation((vars: LogTemplateInput, key: string) => logSuggestion(meal.slug, vars, key), {
    onSuccess: (res) => {
      invalidate(res.day);
      toast.success(t('nutrition.suggestions.logged', { name, meal: t(`enums.mealType.${mealType}`) }));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  return (
    <article className="suggestion-card" aria-label={name}>
      <header className="row-between suggestion-head">
        <h3 className="suggestion-name">{name}</h3>
        <span className="small muted row">
          <Icon name="clock" size={14} />
          {t('nutrition.suggestions.prep', { count: meal.prepMinutes })}
        </span>
      </header>
      {!compact && lt(meal.description) && <p className="small muted">{lt(meal.description)}</p>}
      {meal.reasons.length > 0 && (
        <div className="food-badges">
          {meal.reasons.map((r) => (
            <Badge key={r} tone={r === 'high_protein' ? 'primary' : r === 'matches_diet' ? 'success' : 'info'}>
              {tx(`nutrition.suggestions.reasons.${r}`, undefined, r)}
            </Badge>
          ))}
        </div>
      )}
      <ul className="suggestion-items small" aria-label={t('nutrition.suggestions.ingredients')}>
        {items.map((i, idx) => (
          <li key={`${idx}-${i.food.id}`}>
            <span>{lt(i.food.name)}</span>
            <span className="muted num">{t('nutrition.units.grams', { value: formatNumber(i.grams) })}</span>
          </li>
        ))}
      </ul>
      <MacroLine m={totals} />
      {!compact && (
        <Segmented<number>
          label={t('nutrition.suggestions.portion')}
          size="sm"
          value={scale}
          onChange={setScale}
          options={SCALES.map((s) => ({ value: s, label: t('nutrition.suggestions.portionValue', { value: formatNumber(s, { maximumFractionDigits: 2 }) }) }))}
        />
      )}
      <Button
        variant="primary"
        size="sm"
        icon="plus"
        loading={log.isPending}
        onClick={() => log.mutate({ date, mealType, scale })}
        aria-label={t('nutrition.suggestions.logThisLabel', { name })}
      >
        {compact ? t('nutrition.suggestions.logThis') : t('nutrition.suggestions.logMeal')}
      </Button>
    </article>
  );
}
