import type { GamificationDTO, NotificationListResponse, NotificationMutationResponse } from '@shared/types';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import { qk } from '../../api/queryClient';

export const gamificationApi = {
  overview: () => apiGet<GamificationDTO>('/gamification'),
  notifications: (limit: number) => apiGet<NotificationListResponse>('/notifications', { limit }),
  markRead: (id: string) => apiPost<NotificationMutationResponse>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => apiPost<NotificationMutationResponse>('/notifications/read-all'),
  remove: (id: string) => apiDelete<NotificationMutationResponse>(`/notifications/${encodeURIComponent(id)}`),
};

/** Module-local keys under the shared `qk.notifications` prefix (invalidating the prefix refreshes both). */
export const notificationKeys = {
  bell: [...qk.notifications, 'bell'] as const,
  list: [...qk.notifications, 'list'] as const,
};

export const BELL_LIMIT = 5;
export const LIST_LIMIT = 100;
