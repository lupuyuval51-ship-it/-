import { addDays } from '@shared/dates';
import type { MealType } from '@shared/constants';
import type { FoodLogEntryDTO, MealGroupDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { Badge, Button, Card, IconButton, LinkButton, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { copyLogs } from './api';
import { useNutritionInvalidation } from './hooks';
import { MacroLine, useMacroFormat } from './Macros';

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
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
  const f = useMacroFormat();
  const amountLabel = useEntryAmountLabel();
  const mealName = t(`enums.mealType.${mealType}`);

  const copy = useIdempotentMutation((_: void, key: string) => copyLogs({ fromDate: addDays(date, -1), toDate: date, mealType }, key), {
    onSuccess: (res) => {
      invalidate(res.day);
      toast.success(t('nutrition.meals.copied', { count: res.copied }));
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'nothing_to_copy') toast.info(errorMessage(err, i18n, 'nutrition'));
      else toast.error(errorMessage(err, i18n, 'nutrition'));
    },
  });

  const empty = group.entries.length === 0;
  return (
    <Card
      className="meal-card"
      title={mealName}
      subtitle={empty ? undefined : <MacroLine m={group.totals} />}
      actions={
        <LinkButton
          size="sm"
          variant="secondary"
          icon="plus"
          to={`/nutrition/log?date=${date}&meal=${mealType}`}
          aria-label={t('nutrition.meals.addTo', { meal: mealName })}
        >
          {t('nutrition.meals.add')}
        </LinkButton>
      }
    >
      {empty ? (
        <div className="row-between meal-empty">
          <span className="empty-inline">{t('nutrition.meals.empty')}</span>
          <Button size="sm" variant="ghost" icon="copy" loading={copy.isPending} onClick={() => copy.mutate()} aria-label={t('nutrition.meals.copyYesterdayLabel', { meal: mealName })}>
            {t('nutrition.meals.copyYesterday')}
          </Button>
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
    </Card>
  );
}
