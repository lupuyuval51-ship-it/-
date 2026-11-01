import { useQuery } from '@tanstack/react-query';
import type { GeneratedPlan } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';

export interface PlanRow { id: string; name: string; active: boolean; archived: boolean; plan: GeneratedPlan; createdAt: string }
export const PLANS_KEY = ['plans'] as const;

export function usePlans() {
  return useQuery({ queryKey: PLANS_KEY, queryFn: async (): Promise<PlanRow[]> => (await api.get<{ plans: PlanRow[] }>('/api/plans')).plans });
}

export const splitDayKey = (d: string): string => `workouts.day.${d}`;

export interface WeekSession { id: string; name: string; localDate: string; finishedAt: string | null }
/** Finished workouts of the recent past; the plans screens use it to show progress for this week. */
export function useRecentSessions() {
  return useQuery({
    queryKey: ['sessions', 'recent-plans'],
    queryFn: async (): Promise<WeekSession[]> => (await api.get<{ sessions: WeekSession[] }>('/api/sessions', { limit: 30 })).sessions.filter((s) => s.finishedAt !== null),
    retry: false,
  });
}
