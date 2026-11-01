import { useQuery } from '@tanstack/react-query';
import type { GeneratedPlan } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';

export interface PlanRow { id: string; name: string; active: boolean; archived: boolean; plan: GeneratedPlan; createdAt: string }
export const PLANS_KEY = ['plans'] as const;

export function usePlans() {
  return useQuery({ queryKey: PLANS_KEY, queryFn: async (): Promise<PlanRow[]> => (await api.get<{ plans: PlanRow[] }>('/api/plans')).plans });
}

export const splitDayKey = (d: string): string => `workouts.day.${d}`;
