import { useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useLang } from '../i18n/index.tsx';
import { EXERCISES } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { Button, EmptyState, Select, TextInput, Toggle, Banner } from '../ui/kit.tsx';
import { IconSearch } from '../ui/icons.tsx';
import { ExerciseCard } from '../components/exercises/ExerciseCard.tsx';
import { CATEGORY_LIST, DIFFICULTY_LIST, EMPTY_FILTERS, EQUIPMENT_LIST, MUSCLE_LIST, filterExercises, hasActiveFilters, type ExerciseFilters } from '../components/exercises/search.ts';
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

  const results = useMemo(() => filterExercises(EXERCISES, filters, profile ? { age: profile.age, injuries: profile.injuries, equipment: profile.equipment } : null), [filters, profile]);
  const withoutSafety = useMemo(() => (filters.safe ? filterExercises(EXERCISES, { ...filters, safe: false }, null).length - results.length : 0), [filters, results]);
  const shown = results.slice(0, limit);
  const opt = (prefix: string, list: readonly string[]) => [{ value: '', label: t('exercises.all') }, ...list.map((v) => ({ value: v, label: t(`${prefix}.${v}`) }))];

  return (
    <div className="stack">
      <h1>{t('nav.exercises')}</h1>
      <TextInput label={t('exercises.search')} type="search" value={filters.q} placeholder={t('exercises.searchPlaceholder')} onChange={(e) => set({ q: e.target.value })} autoComplete="off" />
      <div className="ex-filters">
        <Select label={t('exercises.muscle')} value={filters.muscle} options={opt('label.muscle', MUSCLE_LIST)} onChange={(e) => set({ muscle: e.target.value as ExerciseFilters['muscle'] })} />
        <Select label={t('exercises.equipment')} value={filters.equipment} options={opt('label.equipment', EQUIPMENT_LIST)} onChange={(e) => set({ equipment: e.target.value as ExerciseFilters['equipment'] })} />
        <Select label={t('exercises.category')} value={filters.category} options={opt('label.category', CATEGORY_LIST)} onChange={(e) => set({ category: e.target.value as ExerciseFilters['category'] })} />
        <Select label={t('exercises.difficulty')} value={filters.difficulty} options={opt('label.difficulty', DIFFICULTY_LIST)} onChange={(e) => set({ difficulty: e.target.value as ExerciseFilters['difficulty'] })} />
      </div>
      <div className="row-between row-wrap">
        {profile ? <Toggle label={t('exercises.safeForMe')} checked={filters.safe} onChange={(v) => set({ safe: v })} /> : <span className="small muted">{t('exercises.safeNeedsProfile')}</span>}
        {hasActiveFilters(filters) ? <Button size="sm" variant="ghost" onClick={() => setSp(new URLSearchParams(), { replace: true })}>{t('exercises.clear')}</Button> : null}
      </div>
      {filters.safe && profile ? <Banner>{withoutSafety > 0 ? t('exercises.safeHidden', { n: withoutSafety }) : t('exercises.safeNone')}</Banner> : null}
      <p className="small muted" role="status" aria-live="polite">{t('exercises.count', { n: results.length })}</p>
      {results.length === 0 ? (
        <EmptyState icon={<IconSearch />} title={t('exercises.empty')} hint={t('exercises.emptyHint')} action={hasActiveFilters(filters) ? <Button onClick={() => setSp(new URLSearchParams(), { replace: true })}>{t('exercises.clear')}</Button> : undefined} />
      ) : (
        <>
          <ul className="list-reset ex-grid">{shown.map((e) => <ExerciseCard key={e.id} ex={e} />)}</ul>
          {results.length > shown.length ? <Button block onClick={() => setSp((prev) => { const p = new URLSearchParams(prev); p.set('n', String(limit + PAGE)); return p; }, { replace: true })}>{t('exercises.more', { n: results.length - shown.length })}</Button> : null}
        </>
      )}
    </div>
  );
}
