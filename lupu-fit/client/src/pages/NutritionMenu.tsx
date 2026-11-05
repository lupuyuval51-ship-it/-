import type { Dish, MenuItem } from '@lupu-fit/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useProfile } from '../app/session.ts';
import { postFoodLog, useFoodDay } from '../components/nutrition/data.ts';
import { addDaysIso, dishLogPayload, groupShopping, isIsoDate, loggedFromDay, menuFor, roundGrams, shoppingFor, shoppingText, spanDates, todayIso, type MenuChoice } from '../components/nutrition/logic.ts';
import { loadChecked, loadChoice, saveChecked, saveChoice } from '../components/nutrition/menuStore.ts';
import { DISHES, DISH_BY_ID, FOOD_BY_ID } from '../data/content.ts';
import { DishPhoto } from '../components/nutrition/DishPhoto.tsx';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { DayHero } from '../components/nutrition/DayHero.tsx';
import { Banner, Button, Card, EmptyState, errorMessage, IconButton, ProgressBar, Segmented } from '../ui/kit.tsx';
import { IconCheck, IconChevron, IconCopy, IconFlip, IconShield } from '../ui/icons.tsx';
import { PageHeader, SkeletonList, StickyAction } from '../ui/patterns.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/nutrition.css';

type Span = '1' | '3' | '7';

export default function NutritionMenu(): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const qd = sp.get('date');
  const date = isIsoDate(qd) ? qd : todayIso();
  const profile = useProfile();
  const day = useFoodDay(date);
  const [choice, setChoice] = useState<MenuChoice>(() => loadChoice(date));
  // Logged in this visit (also covers entries queued offline, which the day log does not show yet).
  const [sessionLogged, setLoggedIdx] = useState<ReadonlySet<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [span, setSpan] = useState<Span>('3');
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => loadChecked());

  useEffect(() => { setChoice(loadChoice(date)); setLoggedIdx(new Set()); }, [date]);
  const update = (c: MenuChoice) => { setChoice(c); saveChoice(date, c); setLoggedIdx(new Set()); };

  const p = profile.data?.profile; const targets = profile.data?.targets;
  const base = useMemo(() => (p ? { diet: p.diet, restrictions: p.restrictions, allergies: p.allergies } : null), [p]);
  const menu = useMemo(() => (base && targets ? menuFor(DISHES, targets.kcal, date, choice, base) : null), [base, targets, date, choice]);

  const fromLog = useMemo(() => (menu ? loggedFromDay(menu.items, day.data?.entries ?? []) : new Set<number>()), [menu, day.data]);
  const loggedIdx: ReadonlySet<number> = useMemo(() => new Set([...sessionLogged, ...fromLog]), [sessionLogged, fromLog]);

  const dishName = (d: Dish) => (lang === 'he' ? d.nameHe : d.nameEn);
  const go = (d: string) => setSp({ date: d }, { replace: true });

  const logItems = async (idx: number[]) => {
    if (!menu) return;
    setBusy(true);
    let queued = 0; let done = 0;
    try {
      for (const i of idx) {
        const item = menu.items[i]; const dish = item ? DISH_BY_ID.get(item.dishId) : undefined;
        if (!item || !dish) continue;
        const r = await postFoodLog(dishLogPayload(item, dish, date, dishName(dish)));
        done += 1; if (r.queued) queued += 1;
        setLoggedIdx((s) => new Set([...s, i]));
      }
      void qc.invalidateQueries({ queryKey: ['food-log'] });
      toast(queued > 0 ? t('outbox.queued') : t('nutrition.menu.logged', { n: done }), 'ok');
    } catch (e) { toast(errorMessage(e, t), 'error'); } finally { setBusy(false); }
  };

  const shopDates = useMemo(() => spanDates(date, Number(span)), [date, span]);
  const shopping = useMemo(
    () => (base && targets ? shoppingFor(shopDates, DISHES, DISH_BY_ID, targets.kcal, (d) => (d === date ? choice : loadChoice(d)), base) : []),
    [base, targets, shopDates, date, choice],
  );
  const toggleCheck = (key: string) => setChecked((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); saveChecked(n); return n; });
  const copyList = async () => {
    try { await navigator.clipboard.writeText(shoppingText(shopping, lang, t('unit.g'))); toast(t('nutrition.menu.copied'), 'ok'); } catch { toast(t('nutrition.menu.copyFailed'), 'error'); }
  };

  const itemRow = (item: MenuItem, i: number): ReactNode => {
    const dish = DISH_BY_ID.get(item.dishId);
    if (!dish) return null;
    const done = loggedIdx.has(i);
    return (
      <Card key={`${item.dishId}-${i}`} className="stack-sm nu-dish" as="article">
        <div className="row-between">
          <span className="tag">{t(`label.slot.${item.slot}`)}</span>
          <span className="small muted">{t('nutrition.menu.portion')} <span className="num">{fmt.num(item.portion, 2)}×</span></span>
        </div>
        <DishPhoto dishId={dish.id} alt={dishName(dish)} />
        <h3>{dishName(dish)}</h3>
        <div className="nu-macros small">
          <span><span className="num strong">{fmt.num(item.kcal)}</span> <span className="muted">{t('unit.kcal')}</span></span>
          <span><span className="muted">{t('nutrition.proteinShort')}</span> <span className="num strong">{fmt.num(item.proteinG)}</span></span>
          <span><span className="muted">{t('nutrition.carbsShort')}</span> <span className="num strong">{fmt.num(item.carbsG)}</span></span>
          <span><span className="muted">{t('nutrition.fatShort')}</span> <span className="num strong">{fmt.num(item.fatG)}</span></span>
        </div>
        <details className="nu-details">
          <summary>{t('nutrition.menu.ingredients')}</summary>
          <ul className="list small">
            {dish.ingredients.map((ing, k) => <li key={k}><span className="grow">{lang === 'he' ? ing.nameHe : ing.nameEn}</span><span className="num">{fmt.num(Math.round(ing.grams * item.portion))}</span> {t('unit.g')}</li>)}
          </ul>
        </details>
        <div className="row-wrap nu-dish-actions">
          <Button size="sm" onClick={() => update({ ...choice, swaps: [...choice.swaps, i] })} disabled={busy}>{t('nutrition.menu.swap')}</Button>
          <Button size="sm" variant="ghost" className="nu-muted-btn" onClick={() => void logItems([i])} disabled={busy || done}>{done ? <><IconCheck aria-hidden="true" /> {t('nutrition.menu.loggedOne')}</> : t('nutrition.menu.logDish')}</Button>
        </div>
      </Card>
    );
  };

  const groups = groupShopping(shopping, (k) => FOOD_BY_ID.get(k)?.category);
  const doneCount = shopping.filter((l) => checked.has(l.key)).length;
  const allLogged = !!menu && menu.items.length > 0 && menu.items.every((_, i) => loggedIdx.has(i));

  return (
    <div className="stack nutrition-page nu-menu">
      <PageHeader back={`/nutrition?date=${date}`} title={t('nutrition.menu.title')} subtitle={t('nutrition.menu.basis', { kcal: targets ? fmt.num(targets.kcal) : '—' })} />
      <nav className="row-between date-nav" aria-label={t('nutrition.hub.dateNav')}>
        <IconButton label={t('nutrition.hub.prevDay')} onClick={() => go(addDaysIso(date, -1))}><IconChevron className="flip-180" /></IconButton>
        <strong>{date === todayIso() ? t('date.today') : fmt.date(date, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
        <IconButton label={t('nutrition.hub.nextDay')} onClick={() => go(addDaysIso(date, 1))}><IconChevron className="flip-rtl" /></IconButton>
      </nav>

      <p className="small muted" role="note">{t('nutrition.menu.photoNote')}</p>
      <p className="small muted nu-disclaimer" role="note" data-testid="allergen-disclaimer"><IconShield aria-hidden="true" /><span>{t('disclaimer.allergen')}</span></p>

      {profile.isPending ? <SkeletonList rows={3} /> : !p || !targets ? (
        <EmptyState title={t('nutrition.menu.needProfile')} action={<Link className="btn" to="/onboarding">{t('profile.redo')}</Link>} />
      ) : (
        <>
          {menu && menu.items.length > 0 ? <DayHero totals={menu.totals} targets={targets} plan /> : null}

          <div className="nu-menu-controls">
            <Segmented label={t('nutrition.menu.mealCount')} value={String(choice.mealCount) as '3' | '4' | '5'} onChange={(v) => update({ mealCount: Number(v) as 3 | 4 | 5, shuffle: choice.shuffle, swaps: [] })} options={[{ value: '3', label: t('nutrition.menu.meals', { n: 3 }) }, { value: '4', label: t('nutrition.menu.meals', { n: 4 }) }, { value: '5', label: t('nutrition.menu.meals', { n: 5 }) }]} />
            <Button variant="ghost" className="nu-muted-btn" onClick={() => update({ mealCount: choice.mealCount, shuffle: choice.shuffle + 1, swaps: [] })} disabled={busy}><IconFlip aria-hidden="true" /> {t('nutrition.menu.regenerate')}</Button>
          </div>

          {menu && menu.missingSlots.length > 0 ? (
            <Banner tone="warn">{t('nutrition.menu.missing', { slots: [...new Set(menu.missingSlots)].map((s) => t(`label.slot.${s}`)).join(', ') })}</Banner>
          ) : null}

          {menu && menu.items.length === 0 ? <EmptyState title={t('nutrition.menu.none')} hint={t('nutrition.menu.noneHint')} /> : null}
          {menu ? menu.items.map(itemRow) : null}

          {menu && menu.items.length > 0 ? (
            <>
              <p className="small muted">{t('nutrition.menu.engineNote')}</p>
              <StickyAction>
                <Button variant="primary" block disabled={busy || allLogged || day.isPending} onClick={() => void logItems(menu.items.map((_, i) => i).filter((i) => !loggedIdx.has(i)))}>{allLogged ? <><IconCheck aria-hidden="true" /> {t('nutrition.menu.loggedOne')}</> : t('nutrition.menu.logAll')}</Button>
              </StickyAction>
            </>
          ) : null}

          <Card className="stack nu-shop">
            <div className="row-between">
              <h2 className="section-title">{t('nutrition.menu.shopping')}</h2>
              {shopping.length > 0 ? <span className="small muted" aria-live="polite" data-testid="shop-progress">{t('nutrition.nu.shopProgress', { done: doneCount, n: shopping.length })}</span> : null}
            </div>
            {shopping.length > 0 ? <ProgressBar value={doneCount} max={shopping.length} label={t('nutrition.menu.shopping')} {...(doneCount === shopping.length ? { tone: 'ok' as const } : {})} /> : null}
            <Segmented label={t('nutrition.menu.span')} value={span} onChange={setSpan} options={[{ value: '1', label: t('nutrition.menu.span1') }, { value: '3', label: t('nutrition.menu.span3') }, { value: '7', label: t('nutrition.menu.span7') }]} />
            {shopping.length === 0 ? <span className="small muted">{t('nutrition.menu.shoppingEmpty')}</span> : (
              <ul className="list nu-checklist" aria-label={t('nutrition.menu.shopping')}>
                {groups.flatMap((g) => [
                  <li key={`h-${g.group}`} className="nu-group-head" role="presentation"><span className="tiny muted strong">{t(`nutrition.nu.group.${g.group}`)}</span><span className="tiny muted num">{g.lines.length}</span></li>,
                  ...g.lines.map((l) => (
                    <li key={l.key}>
                      <label className="check-row grow">
                        <input type="checkbox" checked={checked.has(l.key)} onChange={() => toggleCheck(l.key)} />
                        <span className={checked.has(l.key) ? 'done' : undefined}>{lang === 'he' ? l.nameHe : l.nameEn}</span>
                      </label>
                      <span className="small muted"><span className="num">{fmt.num(roundGrams(l.grams))}</span> {t('unit.g')}</span>
                    </li>
                  )),
                ])}
              </ul>
            )}
            <div className="row-wrap">
              <Button onClick={() => void copyList()} disabled={shopping.length === 0}><IconCopy aria-hidden="true" /> {t('nutrition.menu.copyList')}</Button>
              <Button variant="ghost" className="nu-muted-btn" onClick={() => { const n = new Set<string>(); setChecked(n); saveChecked(n); }} disabled={checked.size === 0}>{t('nutrition.menu.clearChecks')}</Button>
            </div>
            <span className="small muted">{t('nutrition.menu.shoppingNote')}</span>
          </Card>
        </>
      )}
    </div>
  );
}
