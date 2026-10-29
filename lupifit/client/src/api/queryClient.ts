import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: true,
        // Retry transient failures only (network / 5xx), never 4xx.
        retry: (count, err) => {
          if (err instanceof ApiError && err.status >= 400 && err.status < 500) return false;
          return count < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: { retry: false },
    },
  });
}

/** Central query keys so features can invalidate each other's data consistently. */
export const qk = {
  me: ['me'] as const,
  profile: ['profile'] as const,
  targetSuggestion: ['profile', 'target-suggestion'] as const,
  dashboard: ['dashboard'] as const,
  exercises: (params?: unknown) => ['exercises', params ?? {}] as const,
  exercise: (id: string) => ['exercise', id] as const,
  plans: ['plans'] as const,
  plan: (id: string) => ['plan', id] as const,
  activeSession: ['session', 'active'] as const,
  session: (id: string) => ['session', id] as const,
  sessionHistory: (params?: unknown) => ['sessions', 'history', params ?? {}] as const,
  nutritionDay: (date: string) => ['nutrition', 'day', date] as const,
  nutritionSummary: (days: number, to?: string) => ['nutrition', 'summary', days, to ?? ''] as const,
  foods: (params?: unknown) => ['foods', params ?? {}] as const,
  savedMeals: ['nutrition', 'saved-meals'] as const,
  frequentFoods: ['nutrition', 'frequent'] as const,
  suggestions: (date: string, mealType: string) => ['nutrition', 'suggestions', date, mealType] as const,
  coachStatus: ['coach', 'status'] as const,
  coachThreads: ['coach', 'threads'] as const,
  coachMessages: (threadId: string) => ['coach', 'messages', threadId] as const,
  progress: (period: number) => ['progress', 'overview', period] as const,
  exerciseProgress: (id: string, period: number) => ['progress', 'exercise', id, period] as const,
  trainedExercises: ['progress', 'exercises'] as const,
  bodyWeight: (period: number) => ['progress', 'body-weight', period] as const,
  gamification: ['gamification'] as const,
  notifications: ['notifications'] as const,
  push: ['push'] as const,
};
