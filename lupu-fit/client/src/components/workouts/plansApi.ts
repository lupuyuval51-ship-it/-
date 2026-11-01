import { useQuery } from '@tanstack/react-query';
import type { GeneratedPlan } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';

export interface PlanRow { id: string; name: string; active: boolean; archived: boolean; plan: GeneratedPlan; createdAt: string }
export const PLANS_KEY = ['plans'] as const;

export function usePlans() {
  return useQuery({ queryKey: PLANS_KEY, queryFn: async (): Promise<PlanRow[]> => (await api.get<{ plans: PlanRow[] }>('/api/plans')).plans });
}

export const splitDayKey = (d: string): string => `workouts.day.${d}`;

export interface WeekSession { id: string; name: string; localDate: string; finishedAt: string | null; source?: string; sourceId?: string | null }
/**
 * Was this plan day finished this week? Sessions started from a plan day carry `sourceId = "<planId>:<dayIndex>"`, which is
 * authoritative. Sessions saved before that (no sourceId) still match by their generated name.
 */
export function isPlanDayDone(sessions: readonly WeekSession[], weekStart: string, planId: string, dayIdx: number, legacyName: string): boolean {
  return sessions.some((s) => s.localDate >= weekStart && (s.sourceId ? s.sourceId === `${planId}:${dayIdx}` : s.name === legacyName));
}
/** Finished workouts of the recent past; the plans screens use it to show progress for this week. */
export function useRecentSessions() {
  return useQuery({
    queryKey: ['sessions', 'recent-plans'],
    queryFn: async (): Promise<WeekSession[]> => (await api.get<{ sessions: WeekSession[] }>('/api/sessions', { limit: 30 })).sessions.filter((s) => s.finishedAt !== null),
    retry: false,
  });
}
