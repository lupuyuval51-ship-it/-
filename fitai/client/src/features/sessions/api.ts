import type { AddSessionExerciseInput, FinishSessionInput } from '@shared/schemas/sessions';
import type {
  ActiveSessionResponse,
  OkResponse,
  SessionHistoryResponse,
  SessionResponse,
  SessionSummaryResponse,
  WorkoutSessionDTO,
} from '@shared/types';
import { api, apiDelete, apiGet, apiPatch, apiPost } from '../../api/client';
import { noteServerTime } from './clock';

/** Module-local query keys (in addition to the shared `qk.activeSession` / `qk.sessionHistory`). */
export const sessionKeys = {
  summary: (id: string) => ['session', id, 'summary'] as const,
};

async function timed<T extends { session: WorkoutSessionDTO | null }>(fn: () => Promise<T>): Promise<T> {
  const sentAt = Date.now();
  const res = await fn();
  if (res.session) noteServerTime(res.session.serverTime, sentAt, Date.now());
  return res;
}

export const fetchActiveSession = () => timed(() => apiGet<ActiveSessionResponse>('/sessions/active')).then((r) => r.session);

export const startEmptySession = (name: string, key: string) =>
  timed(() => apiPost<SessionResponse>('/sessions', { empty: true, name }, key)).then((r) => r.session);

export const startPlanSession = (planWorkoutId: string, key: string) =>
  timed(() => apiPost<SessionResponse>('/sessions', { planWorkoutId }, key)).then((r) => r.session);

export const pauseSession = (id: string, body: Record<string, unknown>) =>
  timed(() => apiPatch<SessionResponse>(`/sessions/${id}/state`, { action: 'pause', ...body })).then((r) => r.session);

export const resumeSession = (id: string, body: Record<string, unknown>) =>
  timed(() => apiPatch<SessionResponse>(`/sessions/${id}/state`, { action: 'resume', ...body })).then((r) => r.session);

/** Used by the sync queue for set / exercise / state patches. */
export const sendPatch = <T>(path: string, body: Record<string, unknown>, key: string) =>
  api<T>(path, { method: 'PATCH', body, idempotencyKey: key, timeoutMs: 12_000 });

export const addSet = (sessionId: string, sessionExerciseId: string, key: string) =>
  timed(() => apiPost<SessionResponse>(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`, {}, key)).then((r) => r.session);

export const deleteSet = (sessionId: string, setId: string) =>
  timed(() => apiDelete<SessionResponse>(`/sessions/${sessionId}/sets/${setId}`)).then((r) => r.session);

export const addExercise = (sessionId: string, input: AddSessionExerciseInput, key: string) =>
  timed(() => apiPost<SessionResponse>(`/sessions/${sessionId}/exercises`, input, key)).then((r) => r.session);

export const removeExercise = (sessionId: string, sessionExerciseId: string) =>
  timed(() => apiDelete<SessionResponse>(`/sessions/${sessionId}/exercises/${sessionExerciseId}`)).then((r) => r.session);

export const finishSession = (sessionId: string, input: FinishSessionInput, key: string) =>
  apiPost<SessionSummaryResponse>(`/sessions/${sessionId}/finish`, input, key).then((r) => r.summary);

export const abandonSession = (sessionId: string) => apiPost<OkResponse>(`/sessions/${sessionId}/abandon`, {});

export const fetchSessionSummary = (sessionId: string) => apiGet<SessionSummaryResponse>(`/sessions/${sessionId}/summary`).then((r) => r.summary);

export const fetchSessionHistory = (params: { limit: number; before?: string }, signal?: AbortSignal) =>
  apiGet<SessionHistoryResponse>('/sessions', { limit: params.limit, before: params.before }, signal);

export const deleteSession = (sessionId: string) => apiDelete<OkResponse>(`/sessions/${sessionId}`);
