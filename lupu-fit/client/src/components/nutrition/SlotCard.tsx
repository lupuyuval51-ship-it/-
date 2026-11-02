import type { MealSlot } from '@lupu-fit/shared';
import { DishPhoto } from './DishPhoto.tsx';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { fmt, useT } from '../../i18n/index.tsx';
import { Button, IconButton } from '../../ui/kit.tsx';
import { IconChevron, IconPlus, IconTrash } from '../../ui/icons.tsx';
import type { FoodEntry } from './logic.ts';

/** Collapsible meal slot: header shows name + kcal + a "+" link; body lists entries. Empty slots stay as one compact row. */
export function SlotCard({ slot, entries, date, onDelete, onSave, busy }: { slot: MealSlot; entries: FoodEntry[]; date: string; onDelete: (e: FoodEntry) => void; onSave: (slot: MealSlot, entries: FoodEntry[]) => void; busy: boolean }): ReactNode {
  const t = useT();
  const [open, setOpen] = useState(true);
  const kcal = entries.reduce((s, e) => s + e.kcal, 0);
  const name = t(`label.slot.${slot}`);
  const expanded = open && entries.length > 0;
  return (
    <section className="card nu-slot" aria-label={name}>
      <div className="nu-slot-head">
        <button type="button" className="nu-slot-toggle" aria-expanded={expanded} disabled={entries.length === 0} onClick={() => setOpen((o) => !o)}>
          <IconChevron className={`nu-chev${expanded ? ' open' : ''}`} aria-hidden="true" />
          <span className="grow start"><strong>{name}</strong>{entries.length === 0 ? <span className="small muted"> · {t('nutrition.hub.slotEmpty')}</span> : null}</span>
          {entries.length > 0 ? <span className="small muted"><span className="num">{fmt.num(kcal)}</span> {t('unit.kcal')}</span> : null}
        </button>
        <Link className="icon-btn nu-slot-add" to={`/nutrition/log?slot=${slot}&date=${date}`} aria-label={t('nutrition.hub.quickAddSlot', { slot: name })} title={t('nutrition.hub.quickAddSlot', { slot: name })}><IconPlus aria-hidden="true" /></Link>
      </div>
      {expanded ? (
        <>
          <ul className="list nu-entries">
            {entries.map((e) => (
              <li key={e.id}>
                <DishPhoto dishId={e.dishId} size="thumb" />
                <div className="grow">
                  <div className="nu-entry-name"><strong>{e.name}</strong>{e.estimated ? <span className="tag warning">{t('nutrition.estimated')}</span> : null}</div>
                  <span className="small muted"><span className="num">{fmt.num(e.grams, 1)}</span> {t('unit.g')} · <span className="num">{fmt.num(e.kcal)}</span> {t('unit.kcal')} · {t('nutrition.proteinShort')} <span className="num">{fmt.num(e.proteinG, 1)}</span></span>
                </div>
                <IconButton label={t('nutrition.hub.deleteEntry', { name: e.name })} onClick={() => onDelete(e)} disabled={busy}><IconTrash /></IconButton>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="nu-slot-save" onClick={() => onSave(slot, entries)}>{t('nutrition.hub.saveMeal')}</Button>
        </>
      ) : null}
    </section>
  );
}
