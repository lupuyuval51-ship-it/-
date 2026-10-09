import { useQuery } from '@tanstack/react-query';
import type { FoodDTO } from '@shared/types';
import { EmptyState, QueryState } from '../../../components/ui';
import { useI18n } from '../../../i18n';
import { fetchFrequent, fetchRecent, nk } from '../api';
import { FoodListItem } from '../FoodBits';

/** Recently or frequently logged foods, pre-filled with the last amount. */
export function HistoryTab({ kind, onSelect }: { kind: 'recent' | 'frequent'; onSelect(food: FoodDTO, grams: number): void }) {
  const { t, formatNumber } = useI18n();
  const query = useQuery({
    queryKey: kind === 'recent' ? nk.recent : nk.frequent,
    queryFn: kind === 'recent' ? fetchRecent : fetchFrequent,
  });
  return (
    <QueryState
      query={query}
      isEmpty={(d) => d.length === 0}
      empty={<EmptyState icon={kind === 'recent' ? 'clock' : 'trophy'} title={t(kind === 'recent' ? 'nutrition.history.recentEmpty' : 'nutrition.history.frequentEmpty')} />}
    >
      {(items) => (
        <ul className="list">
          {items.map((item) => (
            <FoodListItem
              key={item.food.id}
              food={item.food}
              onSelect={(food) => onSelect(food, item.lastGrams)}
              extra={`${t('nutrition.history.lastAmount', { grams: formatNumber(item.lastGrams) })} · ${t('nutrition.units.times', { count: item.timesLogged })}`}
            />
          ))}
        </ul>
      )}
    </QueryState>
  );
}
