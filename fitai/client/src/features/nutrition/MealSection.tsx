import { useState } from 'react';
import type { MealType } from '@shared/constants';
import type { FoodLogEntryDTO, MealGroupDTO } from '@shared/types';
import { Badge, Card, IconButton, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';
import { CopyMealModal } from './CopyMealModal';
import { MacroLine, useMacroFormat } from './Macros';
import { RepeatYesterdayButton } from './RepeatYesterdayButton';

export function useEntryAmountLabel() {
  const { t, formatNumber } = useI18n();
  return (e: FoodLogEntryDTO) => {
    if (e.grams == null) return e.source === 'quick_add' ? t('nutrition.meals.quickAdd') : '';
    const grams = t('nutrition.units.grams', { value: formatNumber(e.grams) });
    return e.servings != null ? `${t('nutrition.units.servings', { count: e.servings })} (${grams})` : grams;
  };
}

/** One meal of the day: entries with amounts and macros, per-meal totals, add / edit / delete / copy-from-yesterday. */
export function MealSection({
  mealType,
  group,
  date,
  onEdit,
  onDelete,
}: {
  mealType: MealType;
  group: MealGroupDTO;
  date: string;
  onEdit(entry: FoodLogEntryDTO): void;
  onDelete(entry: FoodLogEntryDTO): void;
}) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const f = useMacroFormat();
  const amountLabel = useEntryAmountLabel();
  const mealName = t(`enums.mealType.${mealType}`);
  const [copyOpen, setCopyOpen] = useState(false);

  const empty = group.entries.length === 0;
  return (
    <Card
      className="meal-card"
      title={mealName}
      subtitle={empty ? undefined : <MacroLine m={group.totals} />}
      actions={
        <div className="row">
          {!empty && <IconButton icon="copy" size="sm" label={t('nutrition.meals.copyToLabel', { meal: mealName })} onClick={() => setCopyOpen(true)} />}
          <LinkButton
            size="sm"
            variant="secondary"
            icon="plus"
            to={`/nutrition/log?date=${date}&meal=${mealType}`}
            aria-label={t('nutrition.meals.addTo', { meal: mealName })}
          >
            {t('nutrition.meals.add')}
          </LinkButton>
        </div>
      }
    >
      {empty ? (
        <div className="row-between meal-empty">
          <span className="empty-inline">{t('nutrition.meals.empty')}</span>
          <RepeatYesterdayButton date={date} mealType={mealType} />
        </div>
      ) : (
        <ul className="list" aria-label={mealName}>
          {group.entries.map((e) => {
            const name = lt(e.foodName);
            return (
              <li key={e.id} className="list-item meal-entry">
                <div className="meal-entry-body">
                  <div className="row meal-entry-title">
                    <span className="meal-entry-name">{name}</span>
                    {e.isCorrected && <Badge tone="info">{t('nutrition.meals.corrected')}</Badge>}
                    {e.foodId == null && e.grams != null && <Badge>{t('nutrition.meals.estimate')}</Badge>}
                  </div>
                  <span className="small muted num">
                    {[amountLabel(e), f.macroShort(e)].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <span className="meal-entry-kcal num">{f.kcalText(e.kcal)}</span>
                <div className="meal-entry-actions">
                  <IconButton icon="edit" size="sm" label={t('nutrition.meals.edit', { name })} onClick={() => onEdit(e)} />
                  <IconButton icon="trash" size="sm" label={t('nutrition.meals.delete', { name })} onClick={() => onDelete(e)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {copyOpen && <CopyMealModal date={date} mealType={mealType} onClose={() => setCopyOpen(false)} />}
    </Card>
  );
}
