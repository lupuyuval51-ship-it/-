import { useQuery } from '@tanstack/react-query';
import type { MealType } from '@shared/constants';
import type { FoodDTO } from '@shared/types';
import { EmptyState, Notice, QueryState } from '../../../components/ui';
import { useI18n } from '../../../i18n';
import { fetchSuggestions, nk } from '../api';
import { FoodListItem } from '../FoodBits';
import { useMacroFormat } from '../Macros';
import { MealSuggestionCard } from '../SuggestionCard';

/** Meal ideas for the selected meal (compatible with the user's diet) and single foods that close the biggest gap. */
export function SuggestionsTab({ date, mealType, onSelect }: { date: string; mealType: MealType; onSelect(food: FoodDTO, grams: number): void }) {
  const { t, tx } = useI18n();
  const f = useMacroFormat();
  const query = useQuery({
    queryKey: nk.suggestions(date, mealType),
    queryFn: ({ signal }) => fetchSuggestions(date, mealType, signal),
  });
  return (
    <QueryState query={query}>
      {(s) => (
        <div className="stack">
          {s.remaining == null ? (
            <Notice tone="info">{t('nutrition.suggestions.noTargets')}</Notice>
          ) : s.remaining.kcal > 0 ? (
            <p className="small muted" aria-live="polite">
              {t('nutrition.suggestions.remaining', { kcal: f.kcal(s.remaining.kcal), protein: f.g(Math.max(0, s.remaining.proteinG)) })}
            </p>
          ) : (
            <Notice tone="info">{t('nutrition.suggestions.targetsReached')}</Notice>
          )}
          <h2 className="section-title">{t('nutrition.suggestions.title', { meal: t(`enums.mealType.${mealType}`) })}</h2>
          {s.meals.length === 0 ? (
            <EmptyState compact icon="sparkles" title={t('nutrition.suggestions.empty')} body={t('nutrition.suggestions.emptyBody')} />
          ) : (
            <div className="suggestion-grid">
              {s.meals.map((m) => (
                <MealSuggestionCard key={m.slug} meal={m} date={date} mealType={mealType} />
              ))}
            </div>
          )}
          {s.foods.length > 0 && (
            <section className="stack-sm">
              <h2 className="section-title">{tx(`nutrition.suggestions.foodsTitle.${s.foods[0]!.reason}`, undefined, t('nutrition.suggestions.foodsTitle.high_protein'))}</h2>
              <ul className="list">
                {s.foods.map((item) => (
                  <FoodListItem
                    key={item.food.id}
                    food={item.food}
                    onSelect={(food) => onSelect(food, item.grams)}
                    extra={`${t('nutrition.units.grams', { value: f.g(item.grams) })} · ${f.kcalText(item.nutrients.kcal)} · ${f.macroShort(item.nutrients)}`}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </QueryState>
  );
}
