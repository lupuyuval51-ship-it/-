import type { Dish, MenuItem } from '@lupu-fit/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useProfile } from '../app/session.ts';
import { postFoodLog } from '../components/nutrition/data.ts';
import { addDaysIso, dishLogPayload, isIsoDate, menuFor, roundGrams, shoppingFor, shoppingText, spanDates, todayIso, type MenuChoice } from '../components/nutrition/logic.ts';
import { loadChecked, loadChoice, saveChecked, saveChoice } from '../components/nutrition/menuStore.ts';
import { DISHES, DISH_BY_ID } from '../data/content.ts';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { Banner, Button, Card, EmptyState, errorMessage, Loading, ProgressBar, Segmented } from '../ui/kit.tsx';
import { IconCopy } from '../ui/icons.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/nutrition.css';

type Span = '1' | '3' | '7';

export default function NutritionMenu(): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const qd = sp.get('date');
  const date = isIsoDate(qd) ? qd : todayIso();
  const profile = useProfile();
  const [choice, setChoice] = useState<MenuChoice>(() => loadChoice(date));
  const [loggedIdx, setLoggedIdx] = useState<ReadonlySet<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [span, setSpan] = useState<Span>('3');
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => loadChecked());

  useEffect(() => { setChoice(loadChoice(date)); setLoggedIdx(new Set()); }, [date]);
  const update = (c: MenuChoice) => { setChoice(c); saveChoice(date, c); setLoggedIdx(new Set()); };

  const p = profile.data?.profile; const targets = profile.data?.targets;
  const base = useMemo(() => (p ? { diet: p.diet, restrictions: p.restrictions, allergies: p.allergies } : null), [p]);
  const menu = useMemo(() => (base && targets ? menuFor(DISHES, targets.kcal, date, choice, base) : null), [base, targets, date, choice]);

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
    return (
      <Card key={`${item.dishId}-${i}`} className="stack-sm" as="article">
        <div className="row-between">
          <span className="tag">{t(`label.slot.${item.slot}`)}</span>
          <span className="small muted">{t('nutrition.menu.portion')} <span className="num">{fmt.num(item.portion, 2)}×</span></span>
        </div>
        <h3>{dishName(dish)}</h3>
        <div className="row-wrap small">
          <span><span className="num">{fmt.num(item.kcal)}</span> {t('unit.kcal')}</span>
          <span>{t('nutrition.proteinShort')} <span className="num">{fmt.num(item.proteinG)}</span></span>
          <span>{t('nutrition.carbsShort')} <span className="num">{fmt.num(item.carbsG)}</span></span>
          <span>{t('nutrition.fatShort')} <span className="num">{fmt.num(item.fatG)}</span></span>
        </div>
        <details>
          <summary>{t('nutrition.menu.ingredients')}</summary>
          <ul className="list small">
            {dish.ingredients.map((ing, k) => <li key={k}><span className="grow">{lang === 'he' ? ing.nameHe : ing.nameEn}</span><span className="num">{fmt.num(Math.round(ing.grams * item.portion))}</span> {t('unit.g')}</li>)}
          </ul>
        </details>
        <div className="row-wrap">
          <Button size="sm" onClick={() => update({ ...choice, swaps: [...choice.swaps, i] })} disabled={busy}>{t('nutrition.menu.swap')}</Button>
          <Button size="sm" onClick={() => void logItems([i])} disabled={busy || loggedIdx.has(i)}>{loggedIdx.has(i) ? t('nutrition.menu.loggedOne') : t('nutrition.menu.logDish')}</Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="stack nutrition-page">
      <div className="row-between">
        <h1>{t('nutrition.menu.title')}</h1>
        <Link to={`/nutrition?date=${date}`} className="small">{t('nutrition.log.backToDay')}</Link>
      </div>
      <nav className="row-between date-nav" aria-label={t('nutrition.hub.dateNav')}>
        <Button size="sm" onClick={() => go(addDaysIso(date, -1))}>{t('nutrition.hub.prevDay')}</Button>
        <strong>{date === todayIso() ? t('date.today') : fmt.date(date, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
        <Button size="sm" onClick={() => go(addDaysIso(date, 1))}>{t('nutrition.hub.nextDay')}</Button>
      </nav>

      <p className="small muted" role="note" data-testid="allergen-disclaimer">{t('disclaimer.allergen')}</p>

      {profile.isPending ? <Loading /> : !p || !targets ? (
        <EmptyState title={t('nutrition.menu.needProfile')} action={<Link className="btn" to="/onboarding">{t('profile.redo')}</Link>} />
      ) : (
        <>
          <Card className="stack">
            <Segmented label={t('nutrition.menu.mealCount')} value={String(choice.mealCount) as '3' | '4' | '5'} onChange={(v) => update({ mealCount: Number(v) as 3 | 4 | 5, shuffle: choice.shuffle, swaps: [] })} options={[{ value: '3', label: t('nutrition.menu.meals', { n: 3 }) }, { value: '4', label: t('nutrition.menu.meals', { n: 4 }) }, { value: '5', label: t('nutrition.menu.meals', { n: 5 }) }]} />
            <div className="row-wrap">
              <Button onClick={() => update({ mealCount: choice.mealCount, shuffle: choice.shuffle + 1, swaps: [] })} disabled={busy}>{t('nutrition.menu.regenerate')}</Button>
              <span className="small muted">{t('nutrition.menu.basis', { kcal: fmt.num(targets.kcal) })}</span>
            </div>
          </Card>

          {menu && menu.missingSlots.length > 0 ? (
            <Banner tone="warn">{t('nutrition.menu.missing', { slots: [...new Set(menu.missingSlots)].map((s) => t(`label.slot.${s}`)).join(', ') })}</Banner>
          ) : null}

          {menu && menu.items.length === 0 ? <EmptyState title={t('nutrition.menu.none')} hint={t('nutrition.menu.noneHint')} /> : null}
          {menu ? menu.items.map(itemRow) : null}

          {menu && menu.items.length > 0 ? (
            <Card className="stack" >
              <h2 className="section-title">{t('nutrition.menu.dayTotals')}</h2>
              {([['kcal', t('unit.kcal'), menu.totals.kcal, targets.kcal], ['p', t('nutrition.protein'), menu.totals.proteinG, targets.proteinG], ['c', t('nutrition.carbs'), menu.totals.carbsG, targets.carbsG], ['f', t('nutrition.fat'), menu.totals.fatG, targets.fatG]] as const).map(([k, label, v, target]) => (
                <div key={k} className="stack-sm"><div className="row-between"><span>{label}</span><span><span className="num">{fmt.num(v)}</span><span className="muted"> / <span className="num">{fmt.num(target)}</span></span></span></div><ProgressBar value={v} max={target} label={label} /></div>
              ))}
              <span className="small muted">{t('nutrition.menu.engineNote')}</span>
              <Button variant="primary" block disabled={busy || loggedIdx.size === menu.items.length} onClick={() => void logItems(menu.items.map((_, i) => i).filter((i) => !loggedIdx.has(i)))}>{t('nutrition.menu.logAll')}</Button>
            </Card>
          ) : null}

          <Card className="stack" >
            <h2 className="section-title">{t('nutrition.menu.shopping')}</h2>
            <Segmented label={t('nutrition.menu.span')} value={span} onChange={setSpan} options={[{ value: '1', label: t('nutrition.menu.span1') }, { value: '3', label: t('nutrition.menu.span3') }, { value: '7', label: t('nutrition.menu.span7') }]} />
            {shopping.length === 0 ? <span className="small muted">{t('nutrition.menu.shoppingEmpty')}</span> : (
              <ul className="list" aria-label={t('nutrition.menu.shopping')}>
                {shopping.map((l) => (
                  <li key={l.key}>
                    <label className="check-row grow">
                      <input type="checkbox" checked={checked.has(l.key)} onChange={() => toggleCheck(l.key)} />
                      <span className={checked.has(l.key) ? 'done' : undefined}>{lang === 'he' ? l.nameHe : l.nameEn}</span>
                    </label>
                    <span><span className="num">{fmt.num(roundGrams(l.grams))}</span> {t('unit.g')}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="row-wrap">
              <Button onClick={() => void copyList()} disabled={shopping.length === 0}><IconCopy aria-label={t('action.copy')} /> {t('nutrition.menu.copyList')}</Button>
              <Button variant="ghost" onClick={() => { const n = new Set<string>(); setChecked(n); saveChecked(n); }} disabled={checked.size === 0}>{t('nutrition.menu.clearChecks')}</Button>
            </div>
            <span className="small muted">{t('nutrition.menu.shoppingNote')}</span>
          </Card>
        </>
      )}
    </div>
  );
}
