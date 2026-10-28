import { Button, EmptyState } from '../../components/ui';
import { useI18n } from '../../i18n';
import { activeFilterCount, DEFAULT_LIBRARY_STATE, hasCriteria, type LibraryState } from './filters';

const SUGGESTED_TERMS = ['squat', 'press', 'row', 'plank', 'curl', 'lunge'] as const;

/** Recent searches as one-tap chips with a "clear all". Renders nothing when empty. */
export function RecentSearches({ items, onPick, onClear }: { items: string[]; onPick(q: string): void; onClear(): void }) {
  const { t } = useI18n();
  if (items.length === 0) return null;
  return (
    <section className="ux-recent" aria-label={t('exercises.recent.title')}>
      <span className="ux-recent-title">{t('exercises.recent.title')}</span>
      <ul className="ux-chip-row" role="list">
        {items.map((q) => (
          <li key={q}>
            <button type="button" className="chip" onClick={() => onPick(q)}>
              {q}
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" icon="close" onClick={onClear}>
        {t('exercises.recent.clear')}
      </Button>
    </section>
  );
}

/**
 * Zero-results state that explains what was searched and offers the next step: relax a
 * filter, drop the search, or try a common term / a recent search.
 */
export function NoResults({
  state,
  recents,
  onApply,
}: {
  state: LibraryState;
  recents: string[];
  onApply(next: LibraryState): void;
}) {
  const { t } = useI18n();
  const criteria = hasCriteria(state);
  const filters = activeFilterCount(state);
  const tryTerms = [...recents.slice(0, 3), ...SUGGESTED_TERMS.map((k) => t(`exercises.suggestions.term.${k}`))].filter(
    (q, i, all) => q.toLowerCase() !== state.q.toLowerCase() && all.findIndex((x) => x.toLowerCase() === q.toLowerCase()) === i,
  );
  return (
    <div className="ux-no-results">
      <EmptyState
        icon="search"
        title={criteria ? t('exercises.results.emptyTitle') : t('exercises.results.emptyLibrary')}
        body={state.q ? t('exercises.results.emptySearch', { q: state.q }) : criteria ? t('exercises.results.emptyFilters') : undefined}
        action={
          criteria ? (
            <div className="row">
              {state.q && filters > 0 && (
                <Button variant="primary" icon="filter" onClick={() => onApply({ ...DEFAULT_LIBRARY_STATE, q: state.q })}>
                  {t('exercises.suggestions.dropFilters')}
                </Button>
              )}
              {state.availableOnly && (
                <Button icon="dumbbell" onClick={() => onApply({ ...state, availableOnly: false, pages: 1 })}>
                  {t('exercises.suggestions.allEquipment')}
                </Button>
              )}
              {state.q && (
                <Button icon="close" onClick={() => onApply({ ...state, q: '', pages: 1 })}>
                  {t('exercises.search.clear')}
                </Button>
              )}
              {!state.q && filters > 0 && (
                <Button variant="primary" icon="close" onClick={() => onApply(DEFAULT_LIBRARY_STATE)}>
                  {t('exercises.filters.clear')}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
      {state.q && (
        <section className="ux-suggestions" aria-label={t('exercises.suggestions.title')}>
          <p className="muted small">{t('exercises.suggestions.tip')}</p>
          <span className="ux-recent-title">{t('exercises.suggestions.title')}</span>
          <ul className="ux-chip-row" role="list">
            {tryTerms.slice(0, 6).map((q) => (
              <li key={q}>
                <button type="button" className="chip" onClick={() => onApply({ ...DEFAULT_LIBRARY_STATE, q })}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
