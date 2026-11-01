import type { MealSlot } from '@lupu-fit/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { api } from '../../api/client.ts';
import { useT } from '../../i18n/index.tsx';
import { Banner, Button, errorMessage, TextInput } from '../../ui/kit.tsx';
import { useToast } from '../../ui/toast.tsx';
import { nk, nutritionErrorKey, useLogFood } from './data.ts';

const num = (s: string): number => { const n = Number(s.replace(',', '.')); return s.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : NaN; };

/** Quick macro entry: logs one entry with the given totals (grams optional, defaults to 100). */
export function QuickAddPanel({ date, slot }: { date: string; slot: MealSlot }): ReactNode {
  const t = useT(); const toast = useToast(); const log = useLogFood();
  const [f, setF] = useState({ name: '', kcal: '', p: '', c: '', fat: '', g: '100' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const kcal = num(f.kcal); const p = f.p === '' ? 0 : num(f.p); const c = f.c === '' ? 0 : num(f.c); const fat = f.fat === '' ? 0 : num(f.fat); const g = f.g === '' ? 100 : num(f.g);
  const ok = f.name.trim() !== '' && [kcal, p, c, fat, g].every(Number.isFinite) && g >= 0.1 && kcal <= 5000;
  const submit = async () => {
    try {
      const r = await log.mutateAsync({ loggedDate: date, slot, name: f.name.trim(), grams: g, kcal, proteinG: p, carbsG: c, fatG: fat, estimated: false });
      toast(r.queued ? t('outbox.queued') : t('nutrition.log.added'), 'ok');
      setF({ name: '', kcal: '', p: '', c: '', fat: '', g: '100' });
    } catch (e) { toast(errorMessage(e, t), 'error'); }
  };
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (ok) void submit(); }}>
      <TextInput label={t('nutrition.quick.name')} value={f.name} maxLength={120} onChange={set('name')} />
      <div className="grid-2">
        <TextInput label={t('unit.kcal')} inputMode="decimal" value={f.kcal} onChange={set('kcal')} />
        <TextInput label={t('nutrition.log.grams')} inputMode="decimal" value={f.g} onChange={set('g')} />
        <TextInput label={t('nutrition.protein')} inputMode="decimal" value={f.p} onChange={set('p')} />
        <TextInput label={t('nutrition.carbs')} inputMode="decimal" value={f.c} onChange={set('c')} />
        <TextInput label={t('nutrition.fat')} inputMode="decimal" value={f.fat} onChange={set('fat')} />
      </div>
      <span className="small muted">{t('nutrition.quick.hint')}</span>
      <Button type="submit" disabled={!ok || log.isPending}>{t('nutrition.quick.add')}</Button>
    </form>
  );
}

/** Custom food creator: values per 100 g, saved to the user's own foods. */
export function CustomFoodPanel({ onCreated }: { onCreated: () => void }): ReactNode {
  const t = useT(); const toast = useToast(); const qc = useQueryClient();
  const [f, setF] = useState({ name: '', kcal: '', p: '', c: '', fat: '', serving: '100' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const kcal = num(f.kcal); const p = f.p === '' ? 0 : num(f.p); const c = f.c === '' ? 0 : num(f.c); const fat = f.fat === '' ? 0 : num(f.fat); const serving = f.serving === '' ? 100 : num(f.serving);
  const macroSum = (Number.isFinite(p) ? p : 0) + (Number.isFinite(c) ? c : 0) + (Number.isFinite(fat) ? fat : 0);
  const ok = f.name.trim() !== '' && [kcal, p, c, fat, serving].every(Number.isFinite) && kcal <= 900 && p <= 100 && c <= 100 && fat <= 100 && macroSum <= 100.5 && serving >= 1 && serving <= 1000;
  const create = useMutation({
    mutationFn: () => api.post<{ id: string }>('/api/foods/custom', { name: f.name.trim(), kcal, proteinG: p, carbsG: c, fatG: fat, servingG: serving }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: nk.custom }); toast(t('nutrition.custom.saved'), 'ok'); setF({ name: '', kcal: '', p: '', c: '', fat: '', serving: '100' }); onCreated(); },
  });
  const key = create.error ? nutritionErrorKey(create.error) : null;
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (ok) create.mutate(); }}>
      <p className="small muted">{t('nutrition.custom.hint')}</p>
      <TextInput label={t('nutrition.quick.name')} value={f.name} maxLength={120} onChange={set('name')} />
      <div className="grid-2">
        <TextInput label={t('nutrition.custom.kcal100')} inputMode="decimal" value={f.kcal} onChange={set('kcal')} />
        <TextInput label={t('nutrition.custom.serving')} inputMode="decimal" value={f.serving} onChange={set('serving')} />
        <TextInput label={t('nutrition.protein')} inputMode="decimal" value={f.p} onChange={set('p')} />
        <TextInput label={t('nutrition.carbs')} inputMode="decimal" value={f.c} onChange={set('c')} />
        <TextInput label={t('nutrition.fat')} inputMode="decimal" value={f.fat} onChange={set('fat')} />
      </div>
      {macroSum > 100.5 ? <Banner tone="warn">{t('nutrition.err.macros100')}</Banner> : null}
      {create.error ? <Banner tone="danger">{key ? t(key) : errorMessage(create.error, t)}</Banner> : null}
      <Button type="submit" disabled={!ok || create.isPending}>{t('nutrition.custom.save')}</Button>
    </form>
  );
}
