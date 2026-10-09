import { useQuery } from '@tanstack/react-query';
import { Card, EmptyState, LinkButton, QueryState } from '../../components/ui';
import { useI18n } from '../../i18n';
import { fetchSuggestions, nk } from './api';
import { MealSuggestionCard } from './SuggestionCard';

/** Dashboard card: the top two meal ideas for the user's next meal, each loggable in one tap. */
export function NextMealCard({ date }: { date: string }) {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: nk.suggestions(date, 'next'),
    queryFn: ({ signal }) => fetchSuggestions(date, undefined, signal),
  });
  const meal = query.data?.mealType;
  return (
    <Card
      title={meal ? t('nutrition.suggestions.title', { meal: t(`enums.mealType.${meal}`) }) : t('nutrition.suggestions.cardTitle')}
      actions={
        meal ? (
          <LinkButton size="sm" variant="ghost" iconEnd="chevronRight" to={`/nutrition/log?date=${date}&meal=${meal}&tab=suggestions`}>
            {t('nutrition.suggestions.more')}
          </LinkButton>
        ) : null
      }
    >
      <QueryState
        query={query}
        isEmpty={(d) => d.meals.length === 0}
        empty={<EmptyState compact icon="sparkles" title={t('nutrition.suggestions.empty')} body={t('nutrition.suggestions.emptyBody')} />}
      >
        {(d) => (
          <div className="stack">
            {d.meals.slice(0, 2).map((m) => (
              <MealSuggestionCard key={m.slug} meal={m} date={d.date} mealType={d.mealType} compact />
            ))}
          </div>
        )}
      </QueryState>
    </Card>
  );
}
