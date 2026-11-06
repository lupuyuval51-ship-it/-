import { MEAL_SLOTS, type Allergen, type MealSlot } from '@lupu-fit/shared';
import { useQueries } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../api/client.ts';
import { BarcodePanel } from '../components/nutrition/BarcodePanel.tsx';
import { LogSheet } from '../components/nutrition/LogSheet.tsx';
import { PhotoPanel } from '../components/nutrition/PhotoPanel.tsx';
import { CustomFoodPanel, QuickAddPanel } from '../components/nutrition/QuickAddPanel.tsx';
import { nk, useCustomFoods, type FoodDay } from '../components/nutrition/data.ts';
import { addDaysIso, isIsoDate, SLOTS, todayIso } from '../components/nutrition/logic.ts';
import { DISHES, FOODS, FOOD_BY_ID, DISH_BY_ID, MEAL_TEMPLATES } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { AI_AVAILABLE } from '../env.ts';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { allergenHits, deriveRecents, fromCustom, fromDish, fromFood, fromTemplate, searchLoggables, type Loggable } from '../lib/foodSearch.ts';
import { Button, Chip, EmptyState, Segmented, TextInput } from '../ui/kit.tsx';
import { IconBarcode, IconCamera, IconFork, IconPlus, IconSearch, IconWarn } from '../ui/icons.tsx';
import { PageHeader } from '../ui/patterns.tsx';
import { kcalLine, ResultRow } from '../components/nutrition/ResultRow.tsx';
import { LogEditor } from '../components/nutrition/LogEditor.tsx';
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
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
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

  const dayLabel = date === todayIso() ? t('date.today') : fmt.date(date, lang, { weekday: 'short', day: 'numeric', month: 'short' });
  const toggleOpen = (k: string) => setOpen((cur) => (cur === k ? null : k));
  const chips = recents.slice(0, 8);
  const openRecent = chips.find((r) => r.key === open) ?? null;
  // The photo estimate is an AI feature: without an AI service (Device Mode without a proxy) the tile is not offered at all.
  const TILES: { mode: Exclude<Mode, 'search'>; icon: ReactNode; label: string; hint: string }[] = [
    { mode: 'barcode', icon: <IconBarcode />, label: t('nutrition.log.mode.barcode'), hint: t('nutrition.nu.tile.barcode') },
    ...(AI_AVAILABLE ? [{ mode: 'photo' as const, icon: <IconCamera />, label: t('nutrition.log.mode.photo'), hint: t('nutrition.nu.tile.photo') }] : []),
    { mode: 'quick', icon: <IconPlus />, label: t('nutrition.log.mode.quick'), hint: t('nutrition.nu.tile.quick') },
    { mode: 'custom', icon: <IconFork />, label: t('nutrition.log.mode.custom'), hint: t('nutrition.nu.tile.custom') },
  ];

  return (
    <div className="stack nutrition-page nu-log">
      <PageHeader back={`/nutrition?date=${date}`} title={t('nutrition.log.title')} subtitle={t('nutrition.log.target', { date: dayLabel })} />
      <Segmented label={t('nutrition.log.slot')} value={slot} onChange={setSlot} options={SLOTS.map((s) => ({ value: s, label: t(`label.slot.${s}`) }))} />
      {allergies.length > 0 ? <div className="banner warn nu-compact" role="note"><IconWarn /><div className="grow">{t('nutrition.allergen.profile', { list: allergies.map((a) => t(`label.allergen.${a}`)).join(', ') })}</div></div> : null}

      <div className="nu-search">
        <TextInput label={t('nutrition.log.searchLabel')} type="search" placeholder={t('nutrition.log.searchPlaceholder')} value={query} autoFocus
          onChange={(e) => { setQuery(e.target.value); setShowAll(false); if (mode !== 'search') setMode('search'); }} autoComplete="off" />
      </div>

      {!hasQuery || mode !== 'search' ? (
      <section className="stack-sm nu-ways" aria-label={t('nutrition.log.modes')}>
        <div className="nu-tiles" data-count={TILES.length}>
          {TILES.map((x) => (
            <button key={x.mode} type="button" className="nu-tile" aria-pressed={mode === x.mode} onClick={() => setMode(mode === x.mode ? 'search' : x.mode)}>
              {x.icon}<strong>{x.label}</strong><span className="tiny muted">{x.hint}</span>
            </button>
          ))}
        </div>
      </section>
      ) : null}

      {mode === 'search' ? (
        hasQuery ? (
          results.length > 0
            ? <><ul className="list nu-results" aria-label={t('nutrition.log.results')}>{(showAll ? results : results.slice(0, 12)).map((i) => <ResultRow key={i.key} item={i} open={open === i.key} onToggle={() => toggleOpen(i.key)} date={date} slot={slot} allergies={allergies} />)}</ul>{!showAll && results.length > 12 ? <Button variant="ghost" onClick={() => setShowAll(true)}>{t('nutrition.nu.showAll', { n: results.length })}</Button> : null}</>
            : <EmptyState icon={<IconSearch aria-label={t('action.search')} />} title={t('nutrition.log.noResults')} hint={t('nutrition.log.noResultsHint')} />
        ) : chips.length > 0 ? (
          <section className="stack-sm" aria-label={t('nutrition.log.recent')}>
            <h2 className="section-title">{t('nutrition.log.recent')}</h2>
            <div className="row-wrap nu-chips">
              {chips.map((r) => { const k = kcalLine(r); const hit = allergenHits(r, allergies).length > 0; return (
                <Chip key={r.key} pressed={open === r.key} onClick={() => toggleOpen(r.key)}>{name(r)} <span className="muted tiny"><span className="num">{fmt.num(k.kcal)}</span></span>{hit ? <span className="danger tiny"> !</span> : null}</Chip>
              ); })}
            </div>
            {openRecent ? <div className="card nu-inline"><strong>{name(openRecent)}</strong><LogEditor item={openRecent} date={date} slot={slot} allergies={allergies} onDone={() => setOpen(null)} /></div> : <span className="small muted">{t('nutrition.nu.recentHint')}</span>}
          </section>
        ) : <p className="small muted">{t('nutrition.log.startTyping')}</p>
      ) : null}

      {mode === 'barcode' ? <div className="card"><BarcodePanel onFound={setPicked} /></div> : null}
      {mode === 'photo' && AI_AVAILABLE ? <div className="card"><PhotoPanel date={date} slot={slot} allergies={allergies} /></div> : null}
      {mode === 'quick' ? <div className="card"><QuickAddPanel date={date} slot={slot} /></div> : null}
      {mode === 'custom' ? <div className="card"><CustomFoodPanel onCreated={() => setMode('search')} /></div> : null}

      <p className="small muted" role="note">{t('disclaimer.allergen')}</p>
      <p className="small muted" role="note">{t('nutrition.menu.photoNote')}</p>
      <LogSheet item={picked} onClose={() => setPicked(null)} date={date} slot={slot} onSlot={setSlot} allergies={allergies} />
    </div>
  );
}
