import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MealType } from '@shared/constants';
import type { DayNutritionDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n';
import { today as todayIn } from '../../lib/dates';
import { nk } from './api';

/** Today's date in the signed-in user's time zone (falls back to the browser's). */
export function useUserToday(): string {
  const { user } = useAuth();
  return todayIn(user?.timezone);
}

/**
 * Refreshes everything that depends on the food log after a mutation: the day view
 * (seeded immediately from the response when available), summaries, suggestions,
 * recent/frequent foods, saved meals and the dashboard.
 */
export function useNutritionInvalidation() {
  const queryClient = useQueryClient();
  return useCallback(
    (day?: DayNutritionDTO) => {
      if (day) queryClient.setQueryData(nk.day(day.date), day);
      void queryClient.invalidateQueries({ queryKey: ['nutrition'] });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      void queryClient.invalidateQueries({ queryKey: qk.gamification });
    },
    [queryClient],
  );
}

/** Localized "<meal> on <date>" phrase used in toasts and headings. */
export function useMealLabel() {
  const { t, formatDate } = useI18n();
  const today = useUserToday();
  return useMemo(
    () => ({
      meal: (m: MealType) => t(`enums.mealType.${m}`),
      date: (d: string) => (d === today ? t('common.time.today') : formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' })),
    }),
    [t, formatDate, today],
  );
}

/** `value`, updated only after it stopped changing for `ms` milliseconds. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/** Most likely meal for "now" (used when the log page is opened without a meal). */
export function mealForHour(hour: number): MealType {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}
