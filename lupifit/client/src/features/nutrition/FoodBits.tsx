import type { ReactNode } from 'react';
import type { FoodConflict } from '@shared/nutrition';
import type { FoodDTO } from '@shared/types';
import { Badge, Button } from '../../components/ui';
import { useI18n, type I18nValue } from '../../i18n';
import { useMacroFormat } from './Macros';

export function conflictLabel(c: FoodConflict, i18n: Pick<I18nValue, 't' | 'intlLocale'>): string {
  const { t } = i18n;
  switch (c.type) {
    case 'allergen':
      return t('nutrition.conflicts.allergen', { allergen: t(`enums.allergen.${c.value}`).toLocaleLowerCase(i18n.intlLocale) });
    case 'diet':
      return t(`nutrition.conflicts.diet.${c.value}`);
    case 'restriction':
      return t(`nutrition.conflicts.restriction.${c.value}`);
  }
}

export function ConflictBadges({ conflicts }: { conflicts: FoodConflict[] }) {
  const i18n = useI18n();
  if (!conflicts.length) return null;
  return (
    <>
      {conflicts.map((c) => (
        <Badge key={`${c.type}:${c.value}`} tone={c.type === 'allergen' ? 'danger' : 'warning'} icon="warning">
          {conflictLabel(c, i18n)}
        </Badge>
      ))}
    </>
  );
}

/** The food's serving label, or "1 serving (120 g)" when the food has none. */
export function useServingLabel() {
  const { t, lt, formatNumber } = useI18n();
  return (serving: FoodDTO['serving']) => lt(serving.label) || t('nutrition.units.servingDefault', { grams: formatNumber(serving.grams) });
}

/** One food in a result list: name, brand, energy density, serving and conflict badges. */
export function FoodListItem({ food, onSelect, extra, actions }: { food: FoodDTO; onSelect(food: FoodDTO): void; extra?: ReactNode; actions?: ReactNode }) {
  const { t, lt } = useI18n();
  const f = useMacroFormat();
  const servingLabel = useServingLabel();
  const name = lt(food.name);
  return (
    <li className="list-item food-item">
      <div className="food-item-body" onClick={() => onSelect(food)}>
        <strong className="food-item-name">{name}</strong>
        <div className="food-item-meta small muted">
          {food.brand && <span>{food.brand}</span>}
          <span className="num">{t('nutrition.units.perHundred', { kcal: f.kcal(food.per100g.kcal) })}</span>
          <span>{servingLabel(food.serving)}</span>
        </div>
        {extra && <div className="small muted">{extra}</div>}
        {(food.conflicts.length > 0 || food.isOwn || food.source === 'openfoodfacts') && (
          <div className="food-badges">
            {food.isOwn && <Badge tone="info">{t('nutrition.portion.myFood')}</Badge>}
            {food.source === 'openfoodfacts' && <Badge>{t('nutrition.portion.fromOff')}</Badge>}
            <ConflictBadges conflicts={food.conflicts} />
          </div>
        )}
      </div>
      <div className="food-item-actions">
        {actions}
        <Button size="sm" variant="secondary" icon="plus" onClick={() => onSelect(food)} aria-label={t('nutrition.search.addFood', { name })}>
          {t('nutrition.search.add')}
        </Button>
      </div>
    </li>
  );
}
