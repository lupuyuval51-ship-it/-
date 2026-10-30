import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { ProfileDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Button, EmptyState, LoadingState, Notice, QueryState } from '../../components/ui';
import { useI18n } from '../../i18n';
import { fetchProfile } from '../workouts/api';
import { fetchReadyList, readyKeys } from './api';
import { ReadyCard } from './ReadyCard';
import { ReadyFilters } from './ReadyFilters';
import {
  activeMoreFilters,
  asGearPlace,
  detailSearch,
  emptyKind,
  listSearch,
  NO_LIST_FILTERS,
  readListFilters,
  resolveContext,
  withListFilters,
  type EmptyKind,
  type ListFilters,
} from './filters';
import { useReadyPrefs } from './useReadyPrefs';
import '../../styles/ready.css';

/** The "Ready workouts" tab of /workouts: filters, results and the way into a workout. */
export function ReadyTab() {
  // The profile only prefills the place and the gear; if it cannot be loaded the tab still works with defaults.
  const profile = useQuery({ queryKey: qk.profile, queryFn: ({ signal }) => fetchProfile(signal), staleTime: 5 * 60_000 });
  if (profile.isPending) return <LoadingState compact />;
  return <ReadyBrowser profile={profile.data ?? null} />;
}

function ReadyBrowser({ profile }: { profile: ProfileDTO | null }) {
  const { t } = useI18n();
  const titleId = useId();
  const { prefs, update } = useReadyPrefs();
  const [params, setParams] = useSearchParams();
  const ctx = useMemo(() => resolveContext(prefs, profile), [prefs, profile]);
  const filters = useMemo(() => readListFilters(params), [params]);
  const [moreOpen, setMoreOpen] = useState(() => activeMoreFilters(filters) > 0);
  const gridRef = useRef<HTMLDivElement>(null);

  const setFilters = (patch: Partial<ListFilters>) => setParams(withListFilters(params, { ...filters, ...patch }), { replace: true });
  const gearPlace = asGearPlace(ctx.location);

  const list = useInfiniteQuery({
    queryKey: readyKeys.list({ location: ctx.location, equipment: gearPlace ? ctx.equipment : null, mode: ctx.mode, ...filters }),
    queryFn: ({ pageParam, signal }) => fetchReadyList(listSearch(ctx, filters, pageParam), signal),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.workouts.length > 0 && pages.reduce((n, p) => n + p.workouts.length, 0) < last.total ? pages.length + 1 : undefined),
    // Keep the previous answer on screen while a changed filter loads, so the chips and counts do not jump.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const first = list.data?.pages[0];
  // The link carries the context (place, gear, sport) so the workout page shows what this list was built for.
  const search = detailSearch({ location: ctx.location, equipment: gearPlace ? ctx.equipment : null, sport: ctx.sport });
  const from = `?${withListFilters(new URLSearchParams({ tab: 'ready' }), filters).toString()}`;

  const showMore = async () => {
    const before = list.data?.pages.reduce((n, p) => n + p.workouts.length, 0) ?? 0;
    await list.fetchNextPage();
    // Keyboard and screen-reader users continue from the first new workout, not from the top of the page.
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-index="${before}"]`)?.focus());
  };

  return (
    <div className="ready-tab stack">
      <p className="muted ready-intro">{t('ready.intro')}</p>
      <div className="ready-layout">
        <ReadyFilters
          ctx={ctx}
          filters={filters}
          facets={first?.facets}
          moreOpen={moreOpen}
          onToggleMore={() => setMoreOpen((o) => !o)}
          onLocation={(location) => update({ location })}
          onEquipment={(equipment) => gearPlace && update({ equipment: { ...prefs.equipment, [gearPlace]: equipment } })}
          onMode={(mode) => update({ mode })}
          onFilters={setFilters}
          onReset={() => setFilters(NO_LIST_FILTERS)}
        />
        <section className="ready-results" aria-labelledby={titleId} aria-busy={list.isPlaceholderData || undefined}>
          <div className="ready-results-head">
            <h2 className="section-title" id={titleId}>
              {t('ready.results.title')}
            </h2>
            <p className="small muted ready-count" role="status" aria-live="polite">
              {first ? t('ready.results.count', { count: first.total }) : ''}
            </p>
          </div>
          {first && first.hiddenForSafety > 0 && (
            <Notice tone="info">
              <p>{t('ready.safety.hidden', { count: first.hiddenForSafety })}</p>
              <Link to="/profile#settings-training" className="link">
                {t('ready.safety.review')}
              </Link>
            </Notice>
          )}
          {/* A failed "Show more" (or background refresh) keeps the workouts on screen; only a failed first load is a full error. */}
          <QueryState
            query={{ data: list.data, isPending: list.isPending, isError: list.isError && !list.data, error: list.error, refetch: list.refetch }}
            loading={<LoadingState compact />}
          >
            {(data) => {
              const total = data.pages[0]?.total ?? 0;
              const workouts = data.pages.flatMap((p) => p.workouts);
              if (total === 0 || workouts.length === 0) {
                return <ReadyEmpty kind={emptyKind(ctx, filters)} onBodyweight={() => update({ mode: 'bodyweight' })} onReset={() => setFilters(NO_LIST_FILTERS)} />;
              }
              return (
                <div className={`ready-list${list.isPlaceholderData ? ' ready-list-busy' : ''}`} ref={gridRef}>
                  <ul className="ready-grid">
                    {workouts.map((w, i) => (
                      <li key={w.id}>
                        <ReadyCard workout={w} search={search} from={from} index={i} />
                      </li>
                    ))}
                  </ul>
                  {list.hasNextPage && (
                    <div className="ready-more-results">
                      <p className="small muted num">{t('ready.results.shown', { shown: workouts.length, total })}</p>
                      {list.isFetchNextPageError && (
                        <p className="small" role="alert">
                          {t('ready.results.moreFailed')}
                        </p>
                      )}
                      <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => void showMore()}>
                        {t('common.actions.showMore')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            }}
          </QueryState>
        </section>
      </div>
    </div>
  );
}

/** Says what to change: tick gear, loosen the filters, or try another combination. */
function ReadyEmpty({ kind, onBodyweight, onReset }: { kind: EmptyKind; onBodyweight(): void; onReset(): void }) {
  const { t } = useI18n();
  if (kind === 'weights_without_gear') {
    return (
      <EmptyState
        icon="dumbbell"
        title={t('ready.empty.weightsTitle')}
        body={t('ready.empty.weightsBody')}
        action={<Button onClick={onBodyweight}>{t('ready.empty.showBodyweight')}</Button>}
      />
    );
  }
  if (kind === 'filtered') {
    return (
      <EmptyState
        icon="search"
        title={t('ready.empty.filteredTitle')}
        body={t('ready.empty.filteredBody')}
        action={<Button onClick={onReset}>{t('ready.filters.reset')}</Button>}
      />
    );
  }
  return <EmptyState icon="dumbbell" title={t('ready.empty.title')} body={t('ready.empty.body')} />;
}
