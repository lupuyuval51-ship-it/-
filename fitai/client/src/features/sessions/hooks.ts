import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import type { WorkoutSessionDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import { fetchActiveSession } from './api';
import { restoreSkew } from './clock';
import { reconcile } from './queue';
import { clearWorkoutStorage, readCachedSession, readQueue } from './storage';
import { sessionSync, type SyncSnapshot } from './sync';

/**
 * Fetches the active session and re-applies unsynced local edits. If an edit was
 * acknowledged while the request was in flight, the response may predate it, so the
 * session is fetched once more.
 */
export async function loadActiveSession(): Promise<WorkoutSessionDTO | null> {
  let version = sessionSync.version;
  let session = await fetchActiveSession();
  if (sessionSync.version !== version) {
    version = sessionSync.version;
    session = await fetchActiveSession();
  }
  return session ? sessionSync.reconcile(session) : null;
}

/** Last cached session (with pending edits) so the workout renders instantly and offline. */
function cachedInitial(userId: string | undefined): WorkoutSessionDTO | undefined {
  if (!userId) return undefined;
  const cached = readCachedSession(userId);
  if (!cached) return undefined;
  restoreSkew(cached.skewMs);
  return reconcile(cached.session, readQueue(userId).filter((e) => e.op.sessionId === cached.session.id));
}

/** The user's in-progress workout (shared by the header pill and the workout page). */
export function useActiveSession(options: { refetchInterval?: number } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.activeSession,
    queryFn: loadActiveSession,
    enabled: !!user,
    initialData: () => cachedInitial(user?.id),
    initialDataUpdatedAt: 0,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: options.refetchInterval,
  });
}

/** Binds the background sync engine while the component is mounted. */
export function useSessionSync(): void {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    return sessionSync.retain(qc, userId);
  }, [qc, userId]);
}

export function useSyncStatus(): SyncSnapshot {
  return useSyncExternalStore(sessionSync.subscribe, sessionSync.getSnapshot, sessionSync.getSnapshot);
}

/** Writes a fresh server session into the cache, keeping pending local edits on top. */
export function setActiveSession(qc: QueryClient, session: WorkoutSessionDTO | null): void {
  qc.setQueryData<WorkoutSessionDTO | null>(qk.activeSession, session ? sessionSync.reconcile(session) : null);
}

/** After finish / discard: forget the workout locally and refresh everything that depends on it. */
export function closeActiveSession(qc: QueryClient, sessionId: string): void {
  sessionSync.discard((op) => op.sessionId === sessionId);
  qc.setQueryData<WorkoutSessionDTO | null>(qk.activeSession, null);
  clearWorkoutStorage();
  for (const key of [qk.dashboard, ['sessions'], ['progress'], qk.gamification, qk.notifications, qk.plans, ['plan'], ['exercise']]) {
    void qc.invalidateQueries({ queryKey: key });
  }
}
