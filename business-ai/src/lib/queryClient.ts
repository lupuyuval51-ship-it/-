/**
 * TanStack Query v5 setup: one QueryClient, AsyncStorage persistence (offline reads),
 * onlineManager ← NetInfo, focusManager ← AppState.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { toAppError } from './errors';
import { wireOnlineManager } from './net';
import { STORAGE_KEYS } from './storage';

const DAY = 24 * 60 * 60 * 1000;

/** Persisted cache lifetime. Queries stay in memory at least as long so they can be persisted. */
export const PERSIST_MAX_AGE = 7 * DAY;

/** Bumping the app version (or this schema tag) discards persisted caches with old shapes. */
const CACHE_SCHEMA = 'v1';
export const PERSIST_BUSTER = `${Constants.expoConfig?.version ?? '0'}-${CACHE_SCHEMA}`;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  return toAppError(error).retryable;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: PERSIST_MAX_AGE,
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: STORAGE_KEYS.queryCache,
  throttleTime: 1000,
});

let focusWired = false;

/** Call once at startup (root layout). Idempotent. */
export function wireQueryManagers(): void {
  wireOnlineManager();
  if (focusWired || Platform.OS === 'web') return; // web: focusManager uses visibilitychange by default
  focusWired = true;
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (status: AppStateStatus) => setFocused(status === 'active'));
    return () => sub.remove();
  });
}

/** Removes all cached server state from memory and disk (sign-out, account switch). */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  try {
    await queryPersister.removeClient();
  } catch {
    // ignore storage failures
  }
}
