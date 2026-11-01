import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useLang } from '../i18n/index.tsx';
import { EXERCISES } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { Banner, Button, Chip, EmptyState, Select, Sheet } from '../ui/kit.tsx';
import { PageHeader } from '../ui/patterns.tsx';
import { IconSearch, IconX } from '../ui/icons.tsx';
import { ExerciseCard } from '../components/exercises/ExerciseCard.tsx';
import { CATEGORY_LIST, DIFFICULTY_LIST, EQUIPMENT_LIST, MUSCLE_LIST, filterExercises, hasActiveFilters, type ExerciseFilters } from '../components/exercises/search.ts';
import '../styles/exercises.css';

const PAGE = 60;

function readFilters(sp: URLSearchParams): ExerciseFilters {
  const pick = <T extends string>(k: string, list: readonly T[]): T | '' => { const v = sp.get(k); return v && (list as readonly string[]).includes(v) ? (v as T) : ''; };
  return { q: sp.get('q') ?? '', muscle: pick('muscle', MUSCLE_LIST), equipment: pick('equipment', EQUIPMENT_LIST), category: pick('category', CATEGORY_LIST), difficulty: pick('difficulty', DIFFICULTY_LIST), safe: sp.get('safe') === '1' };
}

export default function Exercises(): ReactNode {
  const { t } = useLang();
  const [sp, setSp] = useSearchParams();
  const profile = useProfile().data?.profile ?? null;
  const filters = useMemo(() => readFilters(sp), [sp]);
  const limit = Math.max(PAGE, Number(sp.get('n')) || PAGE);
  const [sheet, setSheet] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // On phones the keyboard opens straight away: searching is the main way in.
  useEffect(() => {
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (coarse && !sp.toString() && window.scrollY < 8) searchRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<ExerciseFilters>) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    if (next.q) p.set('q', next.q);
    if (next.muscle) p.set('muscle', next.muscle);
    if (next.equipment) p.set('equipment', next.equipment);
    if (next.category) p.set('category', next.category);
    if (next.difficulty) p.set('difficulty', next.difficulty);
    if (next.safe) p.set('safe', '1');
    setSp(p, { replace: true });
  };
  const clear = () => setSp(new URLSearchParams(), { replace: true });

  const results = useMemo(() => filterExercises(EXERCISES, filters, profile ? { age: profile.age, injuries: profile.injuries, equipment: profile.equipment } : null), [filters, profile]);
  const withoutSafety = useMemo(() => (filters.safe ? filterExercises(EXERCISES, { ...filters, safe: false }, null).length - results.length : 0), [filters, results]);
  const shown = results.slice(0, limit);
  const more = results.length - shown.length;
  const grow = () => setSp((prev) => { const p = new URLSearchParams(prev); p.set('n', String(limit + PAGE)); return p; }, { replace: true });

  // Infinite scroll: reveal the next page when the sentinel nears the viewport (the button stays as the no-observer fallback).
  useEffect(() => {
    const el = sentinel.current;
    if (!el || more <= 0 || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) grow(); }, { rootMargin: '400px' });
    io.observe(el); return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [more, limit]);

  const opt = (prefix: string, list: readonly string[]) => [{ value: '', label: t('exercises.all') }, ...list.map((v) => ({ value: v, label: t(`${prefix}.${v}`) }))];
  const sheetActive = [filters.muscle, filters.equipment, filters.category, filters.difficulty].filter(Boolean).length;
  const removable: { key: keyof ExerciseFilters; label: string }[] = [
    ...(filters.equipment ? [{ key: 'equipment' as const, label: t(`label.equipment.${filters.equipment}`) }] : []),
    ...(filters.category ? [{ key: 'category' as const, label: t(`label.category.${filters.category}`) }] : []),
    ...(filters.difficulty ? [{ key: 'difficulty' as const, label: t(`label.difficulty.${filters.difficulty}`) }] : []),
  ];

  return (
    <div className="stack">
      <PageHeader title={t('nav.exercises')} />
      <div className="ex-bar">
        <div className="ex-search-row">
          <label className="ex-search">
            <IconSearch aria-hidden="true" />
            <input ref={searchRef} className="input" type="search" inputMode="search" enterKeyHint="search" autoComplete="off" aria-label={t('exercises.search')} placeholder={t('exercises.searchPlaceholder')} value={filters.q} onChange={(e) => set({ q: e.target.value })} />
          </label>
          <Button onClick={() => setSheet(true)} aria-haspopup="dialog">{sheetActive > 0 ? t('exercises.filtersN', { n: sheetActive }) : t('exercises.filters')}</Button>
        </div>
        <div className="ex-chips" role="group" aria-label={t('exercises.muscle')}>
          {profile ? <Chip pressed={filters.safe} onClick={() => set({ safe: !filters.safe })}>{t('exercises.safeChip')}</Chip> : null}
          {MUSCLE_LIST.map((m) => <Chip key={m} pressed={filters.muscle === m} onClick={() => set({ muscle: filters.muscle === m ? '' : m })}>{t(`label.muscle.${m}`)}</Chip>)}
        </div>
      </div>

      <div className="row-between row-wrap">
        <p className="small muted" role="status" aria-live="polite">{t('exercises.count', { n: results.length })}</p>
        {removable.length > 0 || hasActiveFilters(filters) ? <Button size="sm" variant="ghost" onClick={clear}>{t('exercises.clear')}</Button> : null}
      </div>
      {removable.length > 0 ? (
        <div className="row-wrap">
          {removable.map((r) => <Chip key={r.key} pressed onClick={() => set({ [r.key]: '' } as Partial<ExerciseFilters>)}>{r.label}<IconX aria-label={t('exercises.removeFilter', { name: r.label })} /></Chip>)}
        </div>
      ) : null}
      {!profile ? <p className="small muted">{t('exercises.safeNeedsProfile')}</p> : null}
      {filters.safe && profile ? <Banner>{withoutSafety > 0 ? t('exercises.safeHidden', { n: withoutSafety }) : t('exercises.safeNone')}</Banner> : null}

      {results.length === 0 ? (
        <EmptyState icon={<IconSearch />} title={t('exercises.empty')} hint={t('exercises.emptyHint')} action={hasActiveFilters(filters) ? <Button onClick={clear}>{t('exercises.clear')}</Button> : undefined} />
      ) : (
        <>
          <ul className="list-reset ex-list">{shown.map((e) => <ExerciseCard key={e.id} ex={e} />)}</ul>
          {more > 0 ? <div ref={sentinel}><Button block onClick={grow}>{t('exercises.more', { n: more })}</Button></div> : null}
        </>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title={t('exercises.filtersTitle')}>
        <Select label={t('exercises.muscle')} value={filters.muscle} options={opt('label.muscle', MUSCLE_LIST)} onChange={(e) => set({ muscle: e.target.value as ExerciseFilters['muscle'] })} />
        <Select label={t('exercises.equipment')} value={filters.equipment} options={opt('label.equipment', EQUIPMENT_LIST)} onChange={(e) => set({ equipment: e.target.value as ExerciseFilters['equipment'] })} />
        <Select label={t('exercises.category')} value={filters.category} options={opt('label.category', CATEGORY_LIST)} onChange={(e) => set({ category: e.target.value as ExerciseFilters['category'] })} />
        <Select label={t('exercises.difficulty')} value={filters.difficulty} options={opt('label.difficulty', DIFFICULTY_LIST)} onChange={(e) => set({ difficulty: e.target.value as ExerciseFilters['difficulty'] })} />
        <div className="row-wrap">
          <Button onClick={() => setSheet(false)}>{t('exercises.apply', { n: results.length })}</Button>
          {hasActiveFilters(filters) ? <Button variant="ghost" onClick={clear}>{t('exercises.clear')}</Button> : null}
        </div>
      </Sheet>
    </div>
  );
}
