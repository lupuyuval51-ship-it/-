import type { BodyWeightInput, TrendPeriod } from '@shared/schemas/progress';
import type { ProgressPeriod } from '@shared/constants';
import type {
  BodyWeightListResponse,
  BodyWeightLogResponse,
  ExerciseProgressDTO,
  OkResponse,
  PersonalRecordsResponse,
  ProgressOverviewDTO,
  TrainedExercisesResponse,
} from '@shared/types';
import type { QueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import { qk } from '../../api/queryClient';

export const progressApi = {
  overview: (period: ProgressPeriod) => apiGet<ProgressOverviewDTO>('/progress/overview', { period }),
  trainedExercises: () => apiGet<TrainedExercisesResponse>('/progress/exercises'),
  exercise: (exerciseId: string, period: TrendPeriod) =>
    apiGet<ExerciseProgressDTO>(`/progress/exercises/${encodeURIComponent(exerciseId)}`, { period }),
  records: (limit = 20) => apiGet<PersonalRecordsResponse>('/progress/records', { limit }),
  bodyWeight: (period: TrendPeriod) => apiGet<BodyWeightListResponse>('/progress/body-weight', { period }),
  logBodyWeight: (input: BodyWeightInput, idempotencyKey: string) =>
    apiPost<BodyWeightLogResponse>('/progress/body-weight', input, idempotencyKey),
  deleteBodyWeight: (id: string) => apiDelete<OkResponse>(`/progress/body-weight/${encodeURIComponent(id)}`),
};

/** Everything that depends on body weight: progress data, dashboard, profile (weight/targets), XP & notifications. */
export function invalidateAfterBodyWeight(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['progress'] }),
    queryClient.invalidateQueries({ queryKey: qk.dashboard }),
    queryClient.invalidateQueries({ queryKey: qk.profile }),
    queryClient.invalidateQueries({ queryKey: qk.gamification }),
    queryClient.invalidateQueries({ queryKey: qk.notifications }),
  ]);
}
