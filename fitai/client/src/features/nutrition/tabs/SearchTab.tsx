import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FOOD_CATEGORIES, type FoodCategory } from '@shared/constants';
import type { FoodDTO } from '@shared/types';
import { Button, EmptyState, ErrorState, LoadingState, SelectField, Switch } from '../../../components/ui';
import { useI18n } from '../../../i18n';
import { storage } from '../../../lib/storage';
import { nk, searchFoods } from '../api';
import { FoodListItem } from '../FoodBits';
import { useDebounced } from '../hooks';

const COMPATIBLE_KEY = 'fitai.nutrition.compatibleOnly';

/** Debounced bilingual food search with a diet filter and category filter. */
export function SearchTab({ onSelect, onCreateCustom, onQuickAdd }: { onSelect(food: FoodDTO): void; onCreateCustom(): void; onQuickAdd(): void }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<FoodCategory | ''>('');
  const [compatibleOnly, setCompatibleOnly] = useState(() => storage.get<boolean>(COMPATIBLE_KEY) === true);
  const debounced = useDebounced(q.trim(), 300);
  const params = { q: debounced, category: category || undefined, compatibleOnly, limit: 30 };
  const query = useQuery({
    queryKey: nk.foods(params),
    queryFn: ({ signal }) => searchFoods(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return (
    <div className="stack">
      <div className="nutri-search-bar">
        <div className="field nutri-search-field">
          <label className="field-label" htmlFor="food-search">
            {t('nutrition.search.label')}
          </label>
          <input
            id="food-search"
            className="input"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={t('nutrition.search.placeholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <SelectField
          label={t('nutrition.search.category')}
          value={category}
          onChange={(e) => setCategory(e.target.value as FoodCategory | '')}
          options={[{ value: '', label: t('nutrition.search.allCategories') }, ...FOOD_CATEGORIES.map((c) => ({ value: c, label: t(`enums.foodCategory.${c}`) }))]}
          fieldClassName="nutri-category"
        />
      </div>
      <Switch
        label={t('nutrition.search.compatibleOnly')}
        checked={compatibleOnly}
        onChange={(v) => {
          setCompatibleOnly(v);
          storage.set(COMPATIBLE_KEY, v);
        }}
      />
      {query.isPending ? (
        <LoadingState compact />
      ) : query.isError ? (
        <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          compact
          icon="search"
          title={t('nutrition.search.noResults')}
          body={t('nutrition.search.noResultsBody')}
          action={
            <div className="row">
              <Button size="sm" icon="plus" onClick={onCreateCustom}>
                {t('nutrition.search.createCustom')}
              </Button>
              <Button size="sm" variant="ghost" icon="flame" onClick={onQuickAdd}>
                {t('nutrition.search.quickAdd')}
              </Button>
            </div>
          }
        />
      ) : (
        <section className="stack-sm">
          <p className="small muted" aria-live="polite">
            {debounced ? t('nutrition.search.results', { count: query.data.length }) : t('nutrition.search.popular')}
          </p>
          <ul className="list" aria-busy={query.isFetching || undefined}>
            {query.data.map((food) => (
              <FoodListItem key={food.id} food={food} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
