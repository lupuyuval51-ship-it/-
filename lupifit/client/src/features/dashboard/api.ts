import { useQuery } from '@tanstack/react-query';
import type { ReadinessCheckin } from '@shared/readiness';
import type { DashboardDTO, SessionResponse } from '@shared/types';
import { apiGet, apiPost } from '../../api/client';
import { qk } from '../../api/queryClient';

export const fetchDashboard = () => apiGet<DashboardDTO>('/dashboard');

/** Starts the plan day as a live session (sessions module endpoint). */
export const startPlanWorkout = (planWorkoutId: string, idempotencyKey: string, readiness?: ReadinessCheckin) =>
  apiPost<SessionResponse>('/sessions', readiness ? { planWorkoutId, readiness } : { planWorkoutId }, idempotencyKey);

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard });
}
