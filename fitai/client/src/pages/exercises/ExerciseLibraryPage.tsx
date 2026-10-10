import { keepPreviousData, queryOptions, useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router';
import type { ExerciseListItemDTO, ExerciseListQuery } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Badge, Button, ErrorState, Notice, PageHeader, Skeleton } from '../../components/ui';
import { exerciseKeys, fetchExerciseFacets, fetchExercises } from '../../features/exercises/api';
import { ExerciseCard } from '../../features/exercises/ExerciseCard';
import {
  activeFilterCount,
  changeFilters,
  clearFilters,
  DEFAULT_LIBRARY_STATE,
  hasCriteria,
  LIBRARY_PAGE_SIZE,
  librarySearchString,
  MAX_LIBRARY_PAGES,
  parseLibraryState,
  serializeLibraryState,
  toFilterQuery,
  toListQuery,
  type LibraryFilters as Filters,
  type LibraryState,
} from '../../features/exercises/filters';
import { LibraryFilters } from '../../features/exercises/LibraryFilters';
import { libraryScrollPositions, type LibraryNavState } from '../../features/exercises/navigation';
import { addRecentSearch, clearRecentSearches, readRecentSearches } from '../../features/exercises/recentSearches';
import { SearchBox } from '../../features/exercises/SearchBox';
import { NoResults, RecentSearches } from '../../features/exercises/SearchHelp';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import '../../styles/exercises.css';
import '../../styles/ux-workouts.css';

const listOptions = (params: ExerciseListQuery) =>
  queryOptions({ queryKey: qk.exercises(params), queryFn: ({ signal }) => fetchExercises(params, signal) });

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="ex-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card ex-card ex-card-skeleton">
          <Skeleton height={84} width={84} radius={12} />
          <div className="ex-card-body">
            <Skeleton height={20} width="70%" />
            <Skeleton height={14} width="45%" />
            <Skeleton height={22} width="80%" radius={999} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Searchable exercise library. Search, filters and the number of loaded pages live in
 * the URL (shareable; back/forward steps through them). Page 1 keeps showing the
 * previous results while new ones load; "Load more" appends further pages.
 */
export default function ExerciseLibraryPage() {
  const { t, locale, formatNumber } = useI18n();
  useDocumentTitle(t('exercises.title'));
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigationType = useNavigationType();
  const state = useMemo(() => parseLibraryState(searchParams), [searchParams]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => readRecentSearches());
  const remember = useCallback((q: string) => setRecents(addRecentSearch(q)), []);
  const filtersId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  // Index of the result to focus once "Load more" has added it (see below).
  const focusIndex = useRef<number | null>(null);

  /** Writes the state to the URL (a new history entry unless `replace`). */
  const apply = useCallback(
    (next: LibraryState, replace = false) => {
      const params = serializeLibraryState(next);
      if (params.toString() === serializeLibraryState(stateRef.current).toString()) return;
      // Any other change cancels a pending "focus the first new result".
      focusIndex.current = null;
      setSearchParams(params, { replace });
    },
    [setSearchParams],
  );
  // Chips, selects and switches refine the same view: replace the history entry so Back
  // leaves the library instead of stepping through every filter click.
  const setFilters = (patch: Partial<Filters>) => apply(changeFilters(stateRef.current, patch), true);
  // Refining a search replaces the history entry; starting or clearing one adds an entry.
  const onSearch = useCallback(
    (q: string) => {
      const prev = stateRef.current;
      apply(changeFilters(prev, { q }), prev.q !== '' && q !== '');
    },
    [apply],
  );

  // ---------------------------------------------------------------- Data
  const filterQuery = useMemo(() => toFilterQuery(state), [state]);
  const first = useQuery({ ...listOptions(toListQuery(state, 1, locale)), placeholderData: keepPreviousData });
  // Only pages that can hold results are requested (a shared `?page=40` must not fire 39 requests).
  const pagesWithResults = first.data && !first.isPlaceholderData ? Math.max(1, Math.ceil(first.data.total / LIBRARY_PAGE_SIZE)) : 1;
  const extra = useQueries({
    queries: Array.from({ length: Math.min(state.pages, pagesWithResults) - 1 }, (_, i) => listOptions(toListQuery(state, i + 2, locale))),
  });
  const facets = useQuery({
    queryKey: exerciseKeys.facets(filterQuery),
    queryFn: ({ signal }) => fetchExerciseFacets(filterQuery, signal),
    placeholderData: keepPreviousData,
  });

  const total = first.data?.total ?? 0;
  const items: ExerciseListItemDTO[] = [...(first.data?.items ?? [])];
  let pendingPage = false;
  let failedPage: (typeof extra)[number] | null = null;
  for (const page of extra) {
    if (!page.data) {
      if (page.isError) failedPage = page;
      else pendingPage = true;
      break;
    }
    items.push(...page.data.items);
  }
  const updating = first.isPlaceholderData;
  const allLoaded = first.data != null && !pendingPage;
  const canLoadMore = !updating && !failedPage && !pendingPage && items.length < total && state.pages < MAX_LIBRARY_PAGES;

  // ---------------------------------------------------------------- Focus & scroll
  // After "Load more", focus moves to the first newly loaded result (keyboard & screen readers).
  useEffect(() => {
    const index = focusIndex.current;
    if (index == null || items.length <= index) return;
    focusIndex.current = null;
    gridRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus();
  }, [items.length]);

  // Coming back with Back restores the scroll position the results were left at.
  const restoreDone = useRef(false);
  useEffect(() => {
    if (restoreDone.current) return;
    const y = navigationType === 'POP' ? libraryScrollPositions.get(location.key) : undefined;
    if (y == null) {
      restoreDone.current = true;
      return;
    }
    if (!allLoaded) return;
    restoreDone.current = true;
    // Runs after the app shell's scroll-to-top for the route change.
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: y }));
    return () => window.cancelAnimationFrame(frame);
  }, [allLoaded, location.key, navigationType]);
  const rememberScroll = () => {
    libraryScrollPositions.set(location.key, window.scrollY);
    // Opening a result means the search was useful.
    remember(stateRef.current.q);
  };
  const pickSearch = (q: string) => {
    apply(changeFilters(stateRef.current, { q }), stateRef.current.q !== '');
    remember(q);
  };

  const loadMore = () => {
    // Continue from the pages actually shown (a too-large `page` in the URL is ignored).
    apply({ ...stateRef.current, pages: Math.min(stateRef.current.pages, pagesWithResults) + 1 }, true);
    focusIndex.current = items.length;
  };

  // ---------------------------------------------------------------- Render
  const activeCount = activeFilterCount(state);
  const navState: LibraryNavState = { librarySearch: librarySearchString(state), depth: 1 };

  let results: ReactNode;
  if (first.isPending) {
    results = <SkeletonGrid count={6} />;
  } else if (first.isError || !first.data) {
    results = <ErrorState error={first.error} onRetry={() => void first.refetch()} />;
  } else if (total === 0) {
    results = <NoResults state={state} recents={recents} onApply={(next) => apply(next, true)} />;
  } else {
    results = (
      <>
        {first.data.approximate && state.q && !updating && <Notice tone="info">{t('exercises.results.approximate', { q: state.q })}</Notice>}
        <div
          ref={gridRef}
          className={`ex-grid${updating ? ' ex-grid-updating' : ''}`}
          role="list"
          aria-label={t('exercises.results.label')}
          aria-busy={updating || pendingPage}
        >
          {items.map((e, i) => (
            <div role="listitem" key={e.id} className="ex-grid-item">
              <ExerciseCard exercise={e} index={i} navState={navState} onNavigate={rememberScroll} highlight={state.q} />
            </div>
          ))}
        </div>
        {pendingPage && <SkeletonGrid count={3} />}
        {failedPage && (
          <ErrorState compact title={t('exercises.results.loadMoreError')} error={failedPage.error} onRetry={() => void failedPage.refetch()} />
        )}
        <div className="ex-more">
          <p className="muted small">{t('exercises.results.showing', { shown: formatNumber(items.length), total: formatNumber(total) })}</p>
          {(canLoadMore || pendingPage) && (
            <Button onClick={loadMore} loading={pendingPage} icon="chevronDown">
              {t('exercises.results.loadMore')}
            </Button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="ex-library">
      <PageHeader title={t('exercises.title')} subtitle={t('exercises.subtitle')} />
      <div className="ex-toolbar">
        <SearchBox value={state.q} onCommit={onSearch} onSubmit={remember} />
        <Button className="ex-filters-toggle" icon="filter" aria-expanded={filtersOpen} aria-controls={filtersId} onClick={() => setFiltersOpen((v) => !v)}>
          {filtersOpen ? t('exercises.filters.hide') : t('exercises.filters.show')}
          {activeCount > 0 && <Badge tone="primary">{t('exercises.filters.active', { count: activeCount })}</Badge>}
        </Button>
      </div>
      {state.q === '' && <RecentSearches items={recents} onPick={pickSearch} onClear={() => { clearRecentSearches(); setRecents([]); }} />}
      <section id={filtersId} className={`card ex-filters${filtersOpen ? ' ex-filters-open' : ''}`} aria-label={t('exercises.filters.title')}>
        <LibraryFilters filters={state} facets={facets.data} onChange={setFilters} />
      </section>
      <div className="ex-results-bar">
        <p className="ex-results-count" aria-live="polite" aria-atomic="true">
          {first.isPending ? t('common.states.loading') : updating ? t('exercises.results.updating') : first.data ? state.q ? t('exercises.results.countFor', { count: total, q: state.q }) : t('exercises.results.count', { count: total }) : ''}
        </p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" icon="close" onClick={() => apply(clearFilters(stateRef.current), true)}>
            {t('exercises.filters.clear')}
          </Button>
        )}
      </div>
      {results}
    </div>
  );
}
