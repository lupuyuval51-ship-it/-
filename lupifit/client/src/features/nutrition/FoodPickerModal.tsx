import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { FoodDTO } from '@shared/types';
import { EmptyState, ErrorState, LoadingState, Modal } from '../../components/ui';
import { useI18n } from '../../i18n';
import { nk, searchFoods } from './api';
import { FoodListItem } from './FoodBits';
import { useDebounced } from './hooks';

/** Search-and-pick dialog (used to replace a photo item's database match). */
export function FoodPickerModal({ open, onClose, onSelect, initialQuery = '' }: { open: boolean; onClose(): void; onSelect(food: FoodDTO): void; initialQuery?: string }) {
  if (!open) return null;
  return <PickerInner onClose={onClose} onSelect={onSelect} initialQuery={initialQuery} />;
}

function PickerInner({ onClose, onSelect, initialQuery }: { onClose(): void; onSelect(food: FoodDTO): void; initialQuery: string }) {
  const { t } = useI18n();
  const [q, setQ] = useState(initialQuery);
  const debounced = useDebounced(q.trim(), 300);
  const params = { q: debounced, limit: 20 };
  const query = useQuery({ queryKey: nk.foods(params), queryFn: ({ signal }) => searchFoods(params, signal), placeholderData: keepPreviousData });
  return (
    <Modal open onClose={onClose} title={t('nutrition.photo.pickerTitle')} size="lg">
      <div className="stack">
        <input
          className="input"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label={t('nutrition.search.label')}
          placeholder={t('nutrition.search.placeholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {query.isPending ? (
          <LoadingState compact />
        ) : query.isError ? (
          <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data.length === 0 ? (
          <EmptyState compact icon="search" title={t('nutrition.search.noResults')} />
        ) : (
          <ul className="list picker-list">
            {query.data.map((food) => (
              <FoodListItem
                key={food.id}
                food={food}
                onSelect={(f) => {
                  onSelect(f);
                  onClose();
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
