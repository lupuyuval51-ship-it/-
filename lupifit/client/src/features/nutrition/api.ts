import type { FoodCategory, MealType } from '@shared/constants';
import type {
  BatchLogInput,
  CopyLogsInput,
  CreateLogEntryInput,
  CustomFoodInput,
  LogTemplateInput,
  PhotoAnalysisInput,
  QuickAddInput,
  RestoreLogEntryInput,
  SaveMealFromDayInput,
  UpdateCustomFoodInput,
  UpdateLogEntryInput,
} from '@shared/schemas/nutrition';
import type {
  CopyLogsResponse,
  DayNutritionDTO,
  DeleteLogEntryResponse,
  FoodAlternativesResponse,
  FoodResponse,
  FoodsResponse,
  FrequentFoodsResponse,
  HealthResponse,
  LogEntriesResponse,
  LogEntryResponse,
  NutritionSuggestionsDTO,
  NutritionSummaryDTO,
  OkResponse,
  PhotoAnalysisDTO,
  ProfileResponse,
  SavedMealResponse,
  SavedMealsResponse,
} from '@shared/types';
import { api, apiDelete, apiGet, apiPatch, apiPost } from '../../api/client';
import { qk } from '../../api/queryClient';

/** Module-local query keys (everything under ['nutrition'] is invalidated after logging). */
export const nk = {
  day: qk.nutritionDay,
  summary: qk.nutritionSummary,
  savedMeals: qk.savedMeals,
  frequent: qk.frequentFoods,
  recent: ['nutrition', 'recent'] as const,
  suggestions: qk.suggestions,
  foods: qk.foods,
  myFoods: ['foods', 'mine'] as const,
  alternatives: (foodId: string) => ['foods', 'alternatives', foodId] as const,
  health: ['health'] as const,
};

export interface FoodSearchParams {
  q: string;
  category?: FoodCategory;
  compatibleOnly?: boolean;
  limit?: number;
}

// ---------------------------------------------------------------- Foods
export const searchFoods = (p: FoodSearchParams, signal?: AbortSignal) =>
  apiGet<FoodsResponse>('/foods/search', { q: p.q, category: p.category, compatibleOnly: p.compatibleOnly, limit: p.limit ?? 25 }, signal).then((r) => r.foods);
export const fetchFood = (id: string) => apiGet<FoodResponse>(`/foods/${encodeURIComponent(id)}`).then((r) => r.food);
export const fetchAlternatives = (id: string) => apiGet<FoodAlternativesResponse>(`/foods/${encodeURIComponent(id)}/alternatives`).then((r) => r.alternatives);
export const fetchMyFoods = () => apiGet<FoodsResponse>('/foods/mine').then((r) => r.foods);
export const lookupBarcode = (code: string) => apiGet<FoodResponse>(`/foods/barcode/${encodeURIComponent(code)}`).then((r) => r.food);
export const createFood = (input: CustomFoodInput, key: string) => apiPost<FoodResponse>('/foods', input, key).then((r) => r.food);
export const updateFood = (id: string, patch: UpdateCustomFoodInput) => apiPatch<FoodResponse>(`/foods/${encodeURIComponent(id)}`, patch).then((r) => r.food);
export const deleteFood = (id: string) => apiDelete<OkResponse>(`/foods/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------- Day & logging
export const fetchDay = (date: string, signal?: AbortSignal) => apiGet<DayNutritionDTO>('/nutrition/day', { date }, signal);
export const fetchSummary = (days: number, to: string, signal?: AbortSignal) => apiGet<NutritionSummaryDTO>('/nutrition/summary', { days, to }, signal);
export const fetchRecent = () => apiGet<FrequentFoodsResponse>('/nutrition/recent').then((r) => r.foods);
export const fetchFrequent = () => apiGet<FrequentFoodsResponse>('/nutrition/frequent').then((r) => r.foods);
export const logFood = (input: CreateLogEntryInput, key: string) => apiPost<LogEntryResponse>('/nutrition/logs', input, key);
export const quickAdd = (input: QuickAddInput, key: string) => apiPost<LogEntryResponse>('/nutrition/logs/quick', input, key);
export const batchLog = (input: BatchLogInput, key: string) => apiPost<LogEntriesResponse>('/nutrition/logs/batch', input, key);
export const copyLogs = (input: CopyLogsInput, key: string) => apiPost<CopyLogsResponse>('/nutrition/logs/copy', input, key);
export const updateEntry = (id: string, patch: UpdateLogEntryInput) => apiPatch<LogEntryResponse>(`/nutrition/logs/${encodeURIComponent(id)}`, patch);
export const restoreEntry = (input: RestoreLogEntryInput, key: string) => apiPost<LogEntryResponse>('/nutrition/logs/restore', input, key);
export const deleteEntry =(id: string) => apiDelete<DeleteLogEntryResponse>(`/nutrition/logs/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------- Saved meals
export const fetchSavedMeals = () => apiGet<SavedMealsResponse>('/nutrition/saved-meals').then((r) => r.meals);
export const saveMealFromDay = (input: SaveMealFromDayInput, key: string) => apiPost<SavedMealResponse>('/nutrition/saved-meals/from-day', input, key).then((r) => r.meal);
export const deleteSavedMeal = (id: string) => apiDelete<OkResponse>(`/nutrition/saved-meals/${encodeURIComponent(id)}`);
export const logSavedMeal = (id: string, input: { date: string; mealType: MealType }, key: string) =>
  apiPost<LogEntriesResponse>(`/nutrition/saved-meals/${encodeURIComponent(id)}/log`, input, key);

// ---------------------------------------------------------------- Suggestions
export const fetchSuggestions = (date: string, mealType?: MealType, signal?: AbortSignal) =>
  apiGet<NutritionSuggestionsDTO>('/nutrition/suggestions', { date, mealType }, signal);
export const logSuggestion = (slug: string, input: LogTemplateInput, key: string) =>
  apiPost<LogEntriesResponse>(`/nutrition/suggestions/${encodeURIComponent(slug)}/log`, input, key);

// ---------------------------------------------------------------- Photo analysis
/** Model calls can take a while; allow up to two minutes. */
export const analyzePhoto = (input: PhotoAnalysisInput, key: string) => apiPost<PhotoAnalysisDTO>('/nutrition/photo-analysis', input, key, 120_000);

// ---------------------------------------------------------------- Other modules' read endpoints
export const fetchHealth = () => api<HealthResponse>('/health');
export const fetchProfile = () => apiGet<ProfileResponse>('/profile').then((r) => r.profile);

