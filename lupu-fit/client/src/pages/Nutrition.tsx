import type { MealSlot } from '@lupu-fit/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api/client.ts';
import { entryToPayload, nk, postFoodLog, useFoodDay, useFoodRange, useSavedMeals, type SavedMeal } from '../components/nutrition/data.ts';
import { addDaysIso, adherenceOf, groupBySlot, isIsoDate, SLOTS, todayIso, type FoodEntry } from '../components/nutrition/logic.ts';
import { useProfile } from '../app/session.ts';
import { callOrQueue } from '../lib/outbox.ts';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { DayHero } from '../components/nutrition/DayHero.tsx';
import { SlotCard } from '../components/nutrition/SlotCard.tsx';
import { Banner, Button, Card, EmptyState, ErrorState, errorMessage, IconButton, LinkButton, Sheet, TextInput } from '../ui/kit.tsx';
import { Skeleton, StickyAction } from '../ui/patterns.tsx';
import { IconChevron, IconPlus, IconTrash, IconUndo } from '../ui/icons.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/nutrition.css';

export default function Nutrition(): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const qd = sp.get('date');
  const today = todayIso();
  const date = isIsoDate(qd) ? qd : today;
  const go = (d: string) => setSp(d === today ? {} : { date: d }, { replace: true });

  const profile = useProfile();
  const day = useFoodDay(date);
  const from = addDaysIso(date, -6);
  const range = useFoodRange(from, date);
  const saved = useSavedMeals();
  const targets = profile.data?.targets;

  const [undo, setUndo] = useState<FoodEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  const [saving, setSaving] = useState<{ slot: MealSlot; entries: FoodEntry[] } | null>(null);
  const [mealName, setMealName] = useState('');

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['food-log'] }); };

  const del = useMutation({
    mutationFn: (e: FoodEntry) => api.delete(`/api/food-log/${e.id}`),
    onSuccess: (_r, e) => {
      refresh(); setUndo(e); toast(t('nutrition.hub.deleted'), 'ok');
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 8000);
    },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const restore = useMutation({
    mutationFn: (e: FoodEntry) => postFoodLog(entryToPayload(e)),
    onSuccess: (r) => { setUndo(null); refresh(); toast(r.queued ? t('outbox.queued') : t('nutrition.hub.restored'), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const copy = useMutation({
    mutationFn: () => api.post<{ copied: number }>('/api/food-log/copy', { fromDate: addDaysIso(date, -1), toDate: date }),
    onSuccess: (r) => { refresh(); toast(t('nutrition.hub.copied', { n: r.copied }), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const logSaved = useMutation({
    mutationFn: (m: SavedMeal) => callOrQueue<{ logged: number }>({ method: 'POST', path: `/api/saved-meals/${m.id}/log`, body: { loggedDate: date }, label: m.name }),
    onSuccess: (r) => { refresh(); toast(r.queued ? t('outbox.queued') : t('nutrition.hub.mealLogged', { n: r.data.logged }), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const delSaved = useMutation({
    mutationFn: (m: SavedMeal) => api.delete(`/api/saved-meals/${m.id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: nk.saved }); toast(t('nutrition.hub.deleted'), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const saveMeal = useMutation({
    mutationFn: () => api.post('/api/saved-meals', {
      name: mealName.trim(), slot: saving!.slot,
      items: saving!.entries.map((e) => ({ ...(e.foodId ? { foodId: e.foodId } : {}), name: e.name, grams: e.grams, kcal: e.kcal, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG })),
    }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: nk.saved }); setSaving(null); setMealName(''); toast(t('nutrition.hub.mealSaved'), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });

  const entries = day.data?.entries ?? [];
  const totals = day.data?.totals ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const groups = groupBySlot(entries);
  const dayLabel = date === today ? t('date.today') : date === addDaysIso(today, -1) ? t('date.yesterday') : date === addDaysIso(today, 1) ? t('date.tomorrow') : fmt.date(date, lang, { weekday: 'short', day: 'numeric', month: 'short' });
  const yesterday = addDaysIso(date, -1);
  const yesterdayLogged = (range.data ?? []).some((d) => d.date === yesterday && d.kcal > 0);
  const adh = adherenceOf(range.data ?? []);

  return (
    <div className="stack nutrition-page nu-hub">
      <header className="page-head"><h1>{t('nutrition.hub.title')}</h1></header>

      <nav className="row-between date-nav" aria-label={t('nutrition.hub.dateNav')}>
        <IconButton label={t('nutrition.hub.prevDay')} onClick={() => go(addDaysIso(date, -1))}><IconChevron className="flip-180" /></IconButton>
        <strong aria-live="polite">{dayLabel}</strong>
        <IconButton label={t('nutrition.hub.nextDay')} onClick={() => go(addDaysIso(date, 1))}><IconChevron className="flip-rtl" /></IconButton>
      </nav>

      {profile.data === null ? <Banner tone="warn">{t('nutrition.hub.noProfile')} <Link to="/onboarding">{t('profile.redo')}</Link></Banner> : null}
      {undo ? (
        <div className="banner nu-undo" role="status" data-testid="undo-bar">
          <div className="grow">{t('nutrition.hub.deletedNamed', { name: undo.name })}</div>
          <Button size="sm" onClick={() => restore.mutate(undo)} disabled={restore.isPending}><IconUndo aria-hidden="true" /> {t('action.undo')}</Button>
        </div>
      ) : null}

      {day.isPending ? <div className="card" role="status" aria-busy="true"><Skeleton lines={3} height="1.5rem" /></div> : day.isError ? <ErrorState error={day.error} onRetry={() => void day.refetch()} /> : <DayHero totals={totals} targets={targets} />}

      {!day.isPending && !day.isError && entries.length === 0 ? (
        <EmptyState title={t('nutrition.hub.empty')} hint={t('nutrition.hub.emptyHint')} action={yesterdayLogged ? <Button size="sm" onClick={() => copy.mutate()} disabled={copy.isPending}>{t('nutrition.hub.copyYesterday')}</Button> : undefined} />
      ) : null}

      {!day.isPending && !day.isError ? SLOTS.map((slot) => (
        <SlotCard key={`${date}-${slot}`} slot={slot} entries={groups[slot]} date={date} busy={del.isPending}
          onDelete={(e) => del.mutate(e)} onSave={(s, es) => { setSaving({ slot: s, entries: es }); setMealName(''); }} />
      )) : null}

      <Card className="stack-sm nu-shortcuts">
        <h2 className="section-title">{t('nutrition.hub.shortcuts')}</h2>
        <div>
          <button type="button" className="list-link nu-linkbtn" onClick={() => copy.mutate()} disabled={!yesterdayLogged || copy.isPending}>
            <span className="grow start"><strong>{t('nutrition.hub.copyYesterday')}</strong>{!yesterdayLogged && !range.isPending ? <><br /><span className="small muted">{t('nutrition.hub.copyDisabled')}</span></> : null}</span>
          </button>
          <Link className="list-link" to={`/nutrition/menu?date=${date}`}><span className="grow"><strong>{t('nutrition.hub.menuLink')}</strong><br /><span className="small muted">{t('nutrition.nu.menuHint')}</span></span><IconChevron className="chev" /></Link>
        </div>
      </Card>

      <Card className="stack-sm">
        <h2 className="section-title">{t('nutrition.hub.savedMeals')}</h2>
        {saved.isPending ? <Skeleton lines={2} /> : saved.isError ? <ErrorState error={saved.error} onRetry={() => void saved.refetch()} /> : saved.data.length === 0 ? <span className="small muted">{t('nutrition.hub.savedEmpty')}</span> : (
          <ul className="list">
            {saved.data.map((m) => (
              <li key={m.id}>
                <div className="grow"><strong>{m.name}</strong><br /><span className="small muted">{t(`label.slot.${m.slot}`)} · <span className="num">{fmt.num(m.items.reduce((s, i) => s + i.kcal, 0))}</span> {t('unit.kcal')} · <span className="num">{m.items.length}</span> {t('nutrition.hub.items')}</span></div>
                <Button size="sm" onClick={() => logSaved.mutate(m)} disabled={logSaved.isPending}>{t('nutrition.hub.logAgain')}</Button>
                <IconButton label={t('nutrition.hub.deleteSaved', { name: m.name })} onClick={() => delSaved.mutate(m)}><IconTrash /></IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="stack-sm">
        <h2 className="section-title">{t('nutrition.hub.weekly')}</h2>
        {range.isPending ? <Skeleton lines={2} /> : range.isError ? <ErrorState error={range.error} onRetry={() => void range.refetch()} /> : adh.daysLogged === 0 ? <span className="small muted">{t('state.noData')}</span> : (
          <div className="grid-3">
            <div className="kpi"><span className="label">{t('nutrition.hub.daysLogged')}</span><span className="num-lg">{adh.daysLogged}<span className="muted">/7</span></span></div>
            <div className="kpi"><span className="label">{t('nutrition.hub.avgKcal')}</span><span className="num-lg">{fmt.num(adh.avgKcal ?? 0)}</span>{targets ? <span className="tiny muted">{t('nutrition.hub.ofTarget', { n: fmt.num(targets.kcal) })}</span> : null}</div>
            <div className="kpi"><span className="label">{t('nutrition.hub.avgProtein')}</span><span className="num-lg">{fmt.num(adh.avgProteinG ?? 0)}</span>{targets ? <span className="tiny muted">{t('nutrition.hub.ofTarget', { n: fmt.num(targets.proteinG) })}</span> : null}</div>
          </div>
        )}
        <span className="small muted">{t('nutrition.hub.weeklyNote')}</span>
      </Card>

      <p className="small muted" role="note">{t('disclaimer.allergen')}</p>
      <p className="small muted" role="note">{t('nutrition.menu.photoNote')}</p>

      <StickyAction><LinkButton variant="primary" block to={`/nutrition/log?date=${date}`}><IconPlus aria-hidden="true" /> {t('nutrition.hub.logFood')}</LinkButton></StickyAction>

      <Sheet open={!!saving} onClose={() => setSaving(null)} title={t('nutrition.hub.saveMealTitle')}>
        <TextInput label={t('nutrition.hub.mealName')} value={mealName} maxLength={120} onChange={(e) => setMealName(e.target.value)} />
        <span className="small muted">{saving ? t('nutrition.hub.saveMealInfo', { n: saving.entries.length, slot: t(`label.slot.${saving.slot}`) }) : ''}</span>
        <Button disabled={mealName.trim() === '' || saveMeal.isPending} onClick={() => saveMeal.mutate()}>{t('action.save')}</Button>
      </Sheet>
    </div>
  );
}
