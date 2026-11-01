import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiRequestError } from '../../api/client.ts';
import { callOrQueue, type QueuedResult } from '../../lib/outbox.ts';
import type { CustomFoodRow } from '../../lib/foodSearch.ts';
import type { FoodEntry, RangeDay, Totals } from './logic.ts';

export interface FoodDay { date: string; entries: FoodEntry[]; totals: Totals }
export interface SavedMealItem { id: string; foodId: string | null; name: string; grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number }
export interface SavedMeal { id: string; name: string; slot: FoodEntry['slot']; items: SavedMealItem[] }
export interface FoodLogPayload { loggedDate: string; slot: FoodEntry['slot']; foodId?: string; dishId?: string; name: string; grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number; estimated: boolean }

export const nk = {
  day: (date: string) => ['food-log', 'day', date] as const,
  range: (from: string, to: string) => ['food-log', 'range', from, to] as const,
  saved: ['saved-meals'] as const,
  custom: ['custom-foods'] as const,
  coachStatus: ['coach', 'status'] as const,
};

export const useFoodDay = (date: string) => useQuery({ queryKey: nk.day(date), queryFn: () => api.get<FoodDay>('/api/food-log', { date }) });
export const useFoodRange = (from: string, to: string) => useQuery({ queryKey: nk.range(from, to), queryFn: async () => (await api.get<{ days: RangeDay[] }>('/api/food-log/range', { from, to })).days });
export const useSavedMeals = () => useQuery({ queryKey: nk.saved, queryFn: async () => (await api.get<{ meals: SavedMeal[] }>('/api/saved-meals')).meals });
export const useCustomFoods = () => useQuery({ queryKey: nk.custom, queryFn: async () => (await api.get<{ foods: CustomFoodRow[] }>('/api/foods/custom')).foods });

/** Offline-safe log: queues with the same Idempotency-Key when the network is down. */
export const postFoodLog = (p: FoodLogPayload): Promise<QueuedResult<{ entry: FoodEntry }>> => callOrQueue<{ entry: FoodEntry }>({ method: 'POST', path: '/api/food-log', body: p, label: p.name });

export function useLogFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postFoodLog,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['food-log'] }); },
  });
}

export const entryToPayload = (e: FoodEntry): FoodLogPayload => ({
  loggedDate: e.loggedDate, slot: e.slot, ...(e.foodId ? { foodId: e.foodId } : {}), ...(e.dishId ? { dishId: e.dishId } : {}),
  name: e.name, grams: e.grams, kcal: e.kcal, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG, estimated: e.estimated,
});

/** Maps API errors to feature copy keys when they have one, else the generic error copy. */
export function nutritionErrorKey(e: unknown): string | null {
  if (e instanceof ApiRequestError) {
    if (e.status === 429) return ((e.body as { window?: string } | null)?.window === 'day') ? 'nutrition.err.quotaDay' : 'nutrition.err.quotaMinute';
    const m: Record<string, string> = { ai_unavailable: 'nutrition.err.aiUnavailable', ai_failed: 'nutrition.err.aiFailed', bad_estimate: 'nutrition.err.aiFailed', product_not_found: 'nutrition.err.productNotFound', no_nutrition_data: 'nutrition.err.noNutrition', lookup_failed: 'nutrition.err.lookupFailed', invalid_barcode: 'nutrition.err.invalidBarcode', macros_exceed_100g: 'nutrition.err.macros100', payload_too_large: 'nutrition.err.tooLarge' };
    return m[e.code] ?? null;
  }
  return null;
}
