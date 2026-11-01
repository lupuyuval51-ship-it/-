import type { Allergen, MealSlot } from '@lupu-fit/shared';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { allergenHits, macrosFor, servingPresets, type Loggable } from '../../lib/foodSearch.ts';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import { Button, Chip, errorMessage, NumberStepper, Segmented, Sheet } from '../../ui/kit.tsx';
import { useToast } from '../../ui/toast.tsx';
import { AllergenGate } from './AllergenGate.tsx';
import { useLogFood } from './data.ts';
import { SLOTS } from './logic.ts';

/** Confirm grams + slot for one item, live macro preview, allergen gate, then POST /api/food-log (offline-safe). */
export function LogSheet({ item, onClose, date, slot, onSlot, allergies }: { item: Loggable | null; onClose: () => void; date: string; slot: MealSlot; onSlot: (s: MealSlot) => void; allergies: readonly Allergen[] }): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const log = useLogFood();
  const [grams, setGrams] = useState<number | null>(100);
  const [ack, setAck] = useState(false);
  useEffect(() => { if (item) { setGrams(Math.round(item.servingG)); setAck(false); } }, [item]);
  const hits = useMemo(() => (item ? allergenHits(item, allergies) : []), [item, allergies]);
  if (!item) return null;
  const name = lang === 'he' ? item.nameHe : item.nameEn;
  const g = grams ?? 0;
  const m = macrosFor(item.per100, g);
  const canAdd = g > 0 && (hits.length === 0 || ack) && !log.isPending;
  const servingName = lang === 'he' ? item.servingNameHe : item.servingNameEn;
  const add = async () => {
    try {
      const r = await log.mutateAsync({ loggedDate: date, slot, ...(item.foodId ? { foodId: item.foodId } : {}), ...(item.dishId ? { dishId: item.dishId } : {}), name, grams: g, kcal: m.kcal, proteinG: m.proteinG, carbsG: m.carbsG, fatG: m.fatG, estimated: false });
      toast(r.queued ? t('outbox.queued') : t('nutrition.log.added'), 'ok');
      onClose();
    } catch (e) { toast(errorMessage(e, t), 'error'); }
  };
  return (
    <Sheet open onClose={onClose} title={name}>
      <div className="row-wrap" role="group" aria-label={t('nutrition.log.presets')}>
        {servingPresets(item).map((p) => <Chip key={p} pressed={g === p} onClick={() => setGrams(p)}><span className="num">{fmt.num(p)}</span> {t('unit.g')}</Chip>)}
      </div>
      {servingName ? <span className="small muted">{t('nutrition.log.serving', { name: servingName, g: fmt.num(item.servingG) })}</span> : null}
      <NumberStepper label={t('nutrition.log.grams')} value={grams} onChange={setGrams} step={10} min={0} max={5000} decimals={0} suffix={t('unit.g')} />
      <Segmented label={t('nutrition.log.slot')} value={slot} onChange={onSlot} options={SLOTS.map((s) => ({ value: s, label: t(`label.slot.${s}`) }))} />
      <div className="macro-grid" aria-live="polite" data-testid="macro-preview">
        <div className="kpi"><span className="label">{t('unit.kcal')}</span><span className="num-lg">{fmt.num(m.kcal)}</span></div>
        <div className="kpi"><span className="label">{t('nutrition.protein')}</span><span className="num-lg">{fmt.num(m.proteinG, 1)}</span></div>
        <div className="kpi"><span className="label">{t('nutrition.carbs')}</span><span className="num-lg">{fmt.num(m.carbsG, 1)}</span></div>
        <div className="kpi"><span className="label">{t('nutrition.fat')}</span><span className="num-lg">{fmt.num(m.fatG, 1)}</span></div>
      </div>
      <AllergenGate hits={hits} ack={ack} onAck={setAck} />
      <p className="small muted">{t('disclaimer.allergen')}</p>
      <Button variant="primary" block disabled={!canAdd} onClick={() => void add()}>{t('nutrition.log.add')}</Button>
    </Sheet>
  );
}
