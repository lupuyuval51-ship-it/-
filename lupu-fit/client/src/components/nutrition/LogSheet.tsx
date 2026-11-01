import type { Allergen, MealSlot } from '@lupu-fit/shared';
import type { ReactNode } from 'react';
import { useLang, useT } from '../../i18n/index.tsx';
import type { Loggable } from '../../lib/foodSearch.ts';
import { Segmented, Sheet } from '../../ui/kit.tsx';
import { LogEditor } from './LogEditor.tsx';
import { SLOTS } from './logic.ts';

/** Sheet variant of the amount editor (used for barcode hits, which have no row to expand). */
export function LogSheet({ item, onClose, date, slot, onSlot, allergies }: { item: Loggable | null; onClose: () => void; date: string; slot: MealSlot; onSlot: (s: MealSlot) => void; allergies: readonly Allergen[] }): ReactNode {
  const t = useT(); const { lang } = useLang();
  if (!item) return null;
  return (
    <Sheet open onClose={onClose} title={lang === 'he' ? item.nameHe : item.nameEn}>
      <Segmented label={t('nutrition.log.slot')} value={slot} onChange={onSlot} options={SLOTS.map((s) => ({ value: s, label: t(`label.slot.${s}`) }))} />
      <LogEditor item={item} date={date} slot={slot} allergies={allergies} onDone={onClose} />
    </Sheet>
  );
}
