import { MEAL_SLOTS, type Allergen, type MealSlot } from '@lupu-fit/shared';
import { useQueries } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api/client.ts';
import { BarcodePanel } from '../components/nutrition/BarcodePanel.tsx';
import { LogSheet } from '../components/nutrition/LogSheet.tsx';
import { PhotoPanel } from '../components/nutrition/PhotoPanel.tsx';
import { CustomFoodPanel, QuickAddPanel } from '../components/nutrition/QuickAddPanel.tsx';
import { nk, useCustomFoods, type FoodDay } from '../components/nutrition/data.ts';
import { addDaysIso, isIsoDate, SLOTS, todayIso } from '../components/nutrition/logic.ts';
import { DISHES, FOODS, FOOD_BY_ID, DISH_BY_ID, MEAL_TEMPLATES } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { allergenHits, deriveRecents, fromCustom, fromDish, fromFood, fromTemplate, searchLoggables, type Loggable } from '../lib/foodSearch.ts';
import { Banner, Card, EmptyState, Segmented, Tabs, TextInput, Tag } from '../ui/kit.tsx';
import { IconSearch } from '../ui/icons.tsx';
import '../styles/nutrition.css';

type Mode = 'search' | 'barcode' | 'photo' | 'quick' | 'custom';
const guessSlot = (): MealSlot => { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner'; };

const STATIC_CATALOG: Loggable[] = [
  ...FOODS.map(fromFood), ...DISHES.map(fromDish), ...MEAL_TEMPLATES.map((m) => fromTemplate(m, FOOD_BY_ID)),
];

export default function NutritionLog(): ReactNode {
  const t = useT(); const { lang } = useLang();
  const [sp] = useSearchParams();
  const qDate = sp.get('date'); const qSlot = sp.get('slot');
  const date = isIsoDate(qDate) ? qDate : todayIso();
  const [slot, setSlot] = useState<MealSlot>((MEAL_SLOTS as readonly string[]).includes(qSlot ?? '') ? (qSlot as MealSlot) : guessSlot());
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Loggable | null>(null);
  const profile = useProfile();
  const allergies: readonly Allergen[] = profile.data?.profile.allergies ?? [];

  const custom = useCustomFoods();
  const recentDates = useMemo(() => [0, 1, 2, 3, 4].map((i) => addDaysIso(date, -i)), [date]);
  const days = useQueries({ queries: recentDates.map((d) => ({ queryKey: nk.day(d), queryFn: () => api.get<FoodDay>('/api/food-log', { date: d }) })) });
  const rows = days.flatMap((q) => q.data?.entries ?? []);
  const recents = useMemo(() => deriveRecents(rows, FOOD_BY_ID, DISH_BY_ID), [rows.length, days.map((d) => d.dataUpdatedAt).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const catalog = useMemo(() => [...recents, ...(custom.data ?? []).map(fromCustom), ...STATIC_CATALOG], [recents, custom.data]);
  const results = useMemo(() => searchLoggables(catalog, query), [catalog, query]);
  const hasQuery = query.trim() !== '';
  const name = (i: Loggable) => (lang === 'he' ? i.nameHe : i.nameEn);

  const row = (i: Loggable): ReactNode => {
    const hits = allergenHits(i, allergies);
    const per = i.kind === 'dish' || i.kind === 'template' ? { kcal: Math.round((i.per100.kcal * i.servingG) / 100), label: t('nutrition.log.perServing') } : { kcal: Math.round(i.per100.kcal), label: t('nutrition.log.per100') };
    return (
      <li key={i.key}>
        <button type="button" className="result-row" onClick={() => setPicked(i)}>
          <span className="grow start"><strong>{name(i)}</strong><br /><span className="small muted"><span className="num">{fmt.num(per.kcal)}</span> {t('unit.kcal')} · {per.label}</span></span>
          <span className="row-wrap">
            {hits.length > 0 ? <Tag tone="danger">{t('nutrition.allergen.tag')}</Tag> : null}
            <Tag>{t(`nutrition.kind.${i.kind}`)}</Tag>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="stack nutrition-page">
      <div className="row-between">
        <h1>{t('nutrition.log.title')}</h1>
        <Link to={`/nutrition?date=${date}`} className="small">{t('nutrition.log.backToDay')}</Link>
      </div>
      <p className="small muted">{t('nutrition.log.target', { date: date === todayIso() ? t('date.today') : fmt.date(date, lang) })}</p>
      <Segmented label={t('nutrition.log.slot')} value={slot} onChange={setSlot} options={SLOTS.map((s) => ({ value: s, label: t(`label.slot.${s}`) }))} />
      <Tabs<Mode> label={t('nutrition.log.modes')} value={mode} onChange={setMode} tabs={[
        { value: 'search', label: t('nutrition.log.mode.search') }, { value: 'barcode', label: t('nutrition.log.mode.barcode') }, { value: 'photo', label: t('nutrition.log.mode.photo') },
        { value: 'quick', label: t('nutrition.log.mode.quick') }, { value: 'custom', label: t('nutrition.log.mode.custom') },
      ]} />

      {mode === 'search' ? (
        <Card className="stack">
          <TextInput label={t('nutrition.log.searchLabel')} type="search" placeholder={t('nutrition.log.searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          {hasQuery ? (
            results.length > 0
              ? <ul className="list" aria-label={t('nutrition.log.results')}>{results.map(row)}</ul>
              : <EmptyState icon={<IconSearch aria-label={t('action.search')} />} title={t('nutrition.log.noResults')} hint={t('nutrition.log.noResultsHint')} />
          ) : recents.length > 0 ? (
            <div className="stack-sm"><h2 className="section-title">{t('nutrition.log.recent')}</h2><ul className="list">{recents.map(row)}</ul></div>
          ) : <p className="small muted">{t('nutrition.log.startTyping')}</p>}
        </Card>
      ) : null}
      {mode === 'barcode' ? <Card><BarcodePanel onFound={setPicked} /></Card> : null}
      {mode === 'photo' ? <Card><PhotoPanel date={date} slot={slot} allergies={allergies} /></Card> : null}
      {mode === 'quick' ? <Card><QuickAddPanel date={date} slot={slot} /></Card> : null}
      {mode === 'custom' ? <Card><CustomFoodPanel onCreated={() => setMode('search')} /></Card> : null}

      {allergies.length > 0 ? <Banner tone="warn">{t('nutrition.allergen.profile', { list: allergies.map((a) => t(`label.allergen.${a}`)).join(', ') })}</Banner> : null}
      <p className="small muted" role="note">{t('disclaimer.allergen')}</p>
      <LogSheet item={picked} onClose={() => setPicked(null)} date={date} slot={slot} onSlot={setSlot} allergies={allergies} />
    </div>
  );
}
