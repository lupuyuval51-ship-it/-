import type { Equipment, SportId, TrainingLocation } from '@shared/constants';
import type { ReadyDetailResponse, ReadyListResponse, ReadyWorkoutDetailDTO, SessionResponse } from '@shared/types';
import { apiGet, apiPost } from '../../api/client';
import { detailSearch, sortGear, type DetailContext } from './filters';

const enc = encodeURIComponent;

/** Query keys of this module (everything starts with `ready`, so one call can drop them all). */
export const readyKeys = {
  all: ['ready'] as const,
  list: (key: Record<string, unknown>) => ['ready', 'list', key] as const,
  detail: (id: string, ctx: DetailContext) => ['ready', 'detail', id, ctx.location, ctx.equipment ? sortGear(ctx.equipment).join(',') : null, ctx.sport] as const,
};

/**
 * `search` is a ready-made query string (see `listSearch`): the shared fetch helper drops empty values, but
 * `equipment=` (nothing ticked) has to reach the server.
 */
export const fetchReadyList = (search: string, signal?: AbortSignal) => apiGet<ReadyListResponse>(`/ready-workouts?${search}`, undefined, signal);

export const fetchReadyDetail = (id: string, ctx: DetailContext, signal?: AbortSignal) =>
  apiGet<ReadyDetailResponse>(`/ready-workouts/${enc(id)}${detailSearch(ctx)}`, undefined, signal).then((r): ReadyWorkoutDetailDTO => r.workout);

/** Body of `POST /api/sessions` for a ready workout. */
export interface StartReadyBody {
  readyWorkoutId: string;
  sport?: SportId;
  location?: TrainingLocation;
  equipment?: Equipment[];
}

/**
 * The start request for what the page shows: the sport is only sent when the page shows its finisher, and the
 * gym sends no equipment (nothing was asked).
 */
export function startBody(id: string, ctx: DetailContext, shownSport: SportId | null): StartReadyBody {
  return {
    readyWorkoutId: id,
    ...(shownSport ? { sport: shownSport } : {}),
    location: ctx.location,
    ...(ctx.location !== 'gym' && ctx.equipment ? { equipment: sortGear(ctx.equipment) } : {}),
  };
}

export const startReadyWorkout = (body: StartReadyBody, key: string) => apiPost<SessionResponse>('/sessions', body, key);
