import { COACH_MESSAGES_PAGE_DEFAULT } from '@shared/schemas/coach';
import type {
  CoachMessagesResponse,
  CoachStatusDTO,
  CoachThreadListResponse,
  CoachThreadResponse,
  OkResponse,
  SendCoachMessageResponse,
} from '@shared/types';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client';

/**
 * A coach reply can take a while (the model call runs on the server with its own
 * timeout and retries); if the browser gives up first, retrying with the same
 * idempotency key replays the stored answer instead of asking twice.
 */
const SEND_TIMEOUT_MS = 180_000;

export const coachApi = {
  status: () => apiGet<CoachStatusDTO>('/coach/status'),
  threads: () => apiGet<CoachThreadListResponse>('/coach/threads'),
  createThread: (title: string, idempotencyKey: string) => apiPost<CoachThreadResponse>('/coach/threads', { title }, idempotencyKey),
  renameThread: (id: string, title: string) => apiPatch<CoachThreadResponse>(`/coach/threads/${encodeURIComponent(id)}`, { title }),
  deleteThread: (id: string) => apiDelete<OkResponse>(`/coach/threads/${encodeURIComponent(id)}`),
  messages: (id: string, before?: string, signal?: AbortSignal) =>
    apiGet<CoachMessagesResponse>(`/coach/threads/${encodeURIComponent(id)}/messages`, { before, limit: COACH_MESSAGES_PAGE_DEFAULT }, signal),
  send: (id: string, content: string, idempotencyKey: string) =>
    apiPost<SendCoachMessageResponse>(`/coach/threads/${encodeURIComponent(id)}/messages`, { content }, idempotencyKey, SEND_TIMEOUT_MS),
};
