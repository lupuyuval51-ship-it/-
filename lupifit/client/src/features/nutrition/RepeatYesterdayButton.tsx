import { addDays } from '@shared/dates';
import type { MealType } from '@shared/constants';
import { ApiError } from '../../api/client';
import { Button, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { copyLogs } from './api';
import { useNutritionInvalidation } from './hooks';

/** "Same as yesterday": copies the previous day's entries for one meal (with corrections) to `date`. */
export function RepeatYesterdayButton({ date, mealType, variant = 'ghost' }: { date: string; mealType: MealType; variant?: 'ghost' | 'secondary' }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
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
  return (
    <Button size="sm" variant={variant} icon="copy" loading={copy.isPending} onClick={() => copy.mutate()} aria-label={t('nutrition.meals.copyYesterdayLabel', { meal: mealName })}>
      {t('nutrition.meals.copyYesterday')}
    </Button>
  );
}
