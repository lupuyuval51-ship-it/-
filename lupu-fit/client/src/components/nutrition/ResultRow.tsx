import type { Allergen, MealSlot } from '@lupu-fit/shared';
import { useState, type ReactNode } from 'react';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import { allergenHits, macrosFor, type Loggable } from '../../lib/foodSearch.ts';
import { errorMessage, IconButton, Tag } from '../../ui/kit.tsx';
import { IconCheck, IconPlus } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { useLogFood } from './data.ts';
import { LogEditor } from './LogEditor.tsx';

/** kcal + label for one default serving (dishes/meals) or per 100 g (foods). */
export function kcalLine(i: Loggable): { kcal: number; perServing: boolean } {
  return i.kind === 'dish' || i.kind === 'template' ? { kcal: Math.round((i.per100.kcal * i.servingG) / 100), perServing: true } : { kcal: Math.round(i.per100.kcal), perServing: false };
}

/** Result row: tap the name to open the amount editor in place; the "+" adds one default serving in a single tap (disabled when an allergen matches). */
export function ResultRow({ item, open, onToggle, date, slot, allergies }: { item: Loggable; open: boolean; onToggle: () => void; date: string; slot: MealSlot; allergies: readonly Allergen[] }): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const log = useLogFood();
  const [added, setAdded] = useState(false);
  const name = lang === 'he' ? item.nameHe : item.nameEn;
  const hits = allergenHits(item, allergies);
  const per = kcalLine(item);
  const quick = async () => {
    const m = macrosFor(item.per100, item.servingG);
    try {
      const r = await log.mutateAsync({ loggedDate: date, slot, ...(item.foodId ? { foodId: item.foodId } : {}), ...(item.dishId ? { dishId: item.dishId } : {}), name, grams: Math.round(item.servingG), kcal: m.kcal, proteinG: m.proteinG, carbsG: m.carbsG, fatG: m.fatG, estimated: false });
      setAdded(true); toast(r.queued ? t('outbox.queued') : t('nutrition.nu.addedOne', { name }), 'ok');
    } catch (e) { toast(errorMessage(e, t), 'error'); }
  };
  return (
    <li className={`nu-result${open ? ' open' : ''}`}>
      <div className="nu-result-head">
        <button type="button" className="result-row" aria-expanded={open} onClick={onToggle}>
          <span className="grow start">
            <strong>{name}</strong>
            <span className="small muted nu-result-sub"><span className="num">{fmt.num(per.kcal)}</span> {t('unit.kcal')} · {per.perServing ? t('nutrition.log.perServing') : t('nutrition.log.per100')}</span>
          </span>
          <span className="nu-tags">
            {hits.length > 0 ? <Tag tone="danger">{t('nutrition.nu.allergenShort', { list: hits.map((a) => t(`label.allergen.${a}`)).join(', ') })}</Tag> : null}
            <Tag>{t(`nutrition.kind.${item.kind}`)}</Tag>
          </span>
        </button>
        {hits.length === 0 ? (
          <IconButton label={t('nutrition.nu.addOne', { name })} className={`nu-quick${added ? ' done' : ''}`} onClick={() => void quick()} disabled={log.isPending}>{added ? <IconCheck /> : <IconPlus />}</IconButton>
        ) : null}
      </div>
      {open ? <LogEditor item={item} date={date} slot={slot} allergies={allergies} onDone={onToggle} /> : null}
    </li>
  );
}
