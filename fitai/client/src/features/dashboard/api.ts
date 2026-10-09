import { useQuery } from '@tanstack/react-query';
import type { DashboardDTO, SessionResponse } from '@shared/types';
import { apiGet, apiPost } from '../../api/client';
import { qk } from '../../api/queryClient';

export const fetchDashboard = () => apiGet<DashboardDTO>('/dashboard');

/** Starts the plan day as a live session (sessions module endpoint). */
export const startPlanWorkout = (planWorkoutId: string, idempotencyKey: string) =>
  apiPost<SessionResponse>('/sessions', { planWorkoutId }, idempotencyKey);

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard });
}
