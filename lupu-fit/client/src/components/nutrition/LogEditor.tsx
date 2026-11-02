import type { Allergen, MealSlot } from '@lupu-fit/shared';
import { DishPhoto } from './DishPhoto.tsx';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import { allergenHits, macrosFor, servingPresets, type Loggable } from '../../lib/foodSearch.ts';
import { Button, Chip, errorMessage, NumberStepper } from '../../ui/kit.tsx';
import { useToast } from '../../ui/toast.tsx';
import { AllergenGate } from './AllergenGate.tsx';
import { useLogFood } from './data.ts';

/** Amount editor shared by the inline result row and the barcode sheet: presets, grams stepper, live macros, allergen gate, one primary "Add". */
export function LogEditor({ item, date, slot, allergies, onDone }: { item: Loggable; date: string; slot: MealSlot; allergies: readonly Allergen[]; onDone: () => void }): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const log = useLogFood();
  const [grams, setGrams] = useState<number | null>(Math.round(item.servingG));
  const [ack, setAck] = useState(false);
  useEffect(() => { setGrams(Math.round(item.servingG)); setAck(false); }, [item]);
  const hits = useMemo(() => allergenHits(item, allergies), [item, allergies]);
  const name = lang === 'he' ? item.nameHe : item.nameEn;
  const g = grams ?? 0;
  const m = macrosFor(item.per100, g);
  const canAdd = g > 0 && (hits.length === 0 || ack) && !log.isPending;
  const servingName = lang === 'he' ? item.servingNameHe : item.servingNameEn;
  const add = async () => {
    try {
      const r = await log.mutateAsync({ loggedDate: date, slot, ...(item.foodId ? { foodId: item.foodId } : {}), ...(item.dishId ? { dishId: item.dishId } : {}), name, grams: g, kcal: m.kcal, proteinG: m.proteinG, carbsG: m.carbsG, fatG: m.fatG, estimated: false });
      toast(r.queued ? t('outbox.queued') : t('nutrition.log.added'), 'ok');
      onDone();
    } catch (e) { toast(errorMessage(e, t), 'error'); }
  };
  return (
    <div className="stack nu-editor">
      <DishPhoto dishId={item.dishId} alt={name} />
      <div className="row-wrap" role="group" aria-label={t('nutrition.log.presets')}>
        {servingPresets(item).map((p) => <Chip key={p} pressed={g === p} onClick={() => setGrams(p)}><span className="num">{fmt.num(p)}</span> {t('unit.g')}</Chip>)}
      </div>
      {servingName ? <span className="small muted">{t('nutrition.log.serving', { name: servingName, g: fmt.num(item.servingG) })}</span> : null}
      <NumberStepper label={t('nutrition.log.grams')} value={grams} onChange={setGrams} step={10} min={0} max={5000} decimals={0} suffix={t('unit.g')} />
      <div className="macro-grid" aria-live="polite" data-testid="macro-preview">
        <div className="kpi"><span className="label">{t('unit.kcal')}</span><span className="num-lg">{fmt.num(m.kcal)}</span></div>
        <div className="kpi"><span className="label">{t('nutrition.protein')}</span><span className="num-lg">{fmt.num(m.proteinG, 1)}</span></div>
        <div className="kpi"><span className="label">{t('nutrition.carbs')}</span><span className="num-lg">{fmt.num(m.carbsG, 1)}</span></div>
        <div className="kpi"><span className="label">{t('nutrition.fat')}</span><span className="num-lg">{fmt.num(m.fatG, 1)}</span></div>
      </div>
      <AllergenGate hits={hits} ack={ack} onAck={setAck} />
      <Button variant="primary" block disabled={!canAdd} onClick={() => void add()}>{t('nutrition.log.add')}</Button>
    </div>
  );
}
