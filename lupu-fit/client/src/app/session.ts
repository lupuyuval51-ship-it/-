import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Language, NutritionTargets, ProfileInput } from '@lupu-fit/shared';
import { api, ApiRequestError } from '../api/client.ts';

export interface Me { user: { id: string; username: string; role: 'user' | 'admin' }; csrfToken: string; onboarded: boolean; mode: 'hosted' | 'device' }
export interface ProfileResponse { profile: ProfileInput; targets: NutritionTargets }

export const qk = {
  me: ['me'] as const, profile: ['profile'] as const, activeSession: ['active-session'] as const, stats: ['stats'] as const,
};

/** `null` = signed out (401). Throws on real errors. */
export function useMe() {
  return useQuery({
    queryKey: qk.me, retry: false, staleTime: 30_000,
    queryFn: async (): Promise<Me | null> => { try { return await api.get<Me>('/api/auth/me'); } catch (e) { if (e instanceof ApiRequestError && e.status === 401) return null; throw e; } },
  });
}

/** `null` = onboarding not finished (404 profile_required). */
export function useProfile() {
  return useQuery({
    queryKey: qk.profile, retry: false, staleTime: 60_000,
    queryFn: async (): Promise<ProfileResponse | null> => { try { return await api.get<ProfileResponse>('/api/profile'); } catch (e) { if (e instanceof ApiRequestError && e.status === 404) return null; throw e; } },
  });
}

export function useRefreshSession() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: qk.me }), qc.invalidateQueries({ queryKey: qk.profile })]);
}

export const langOf = (p: ProfileResponse | null | undefined, fallback: Language): Language => p?.profile.language ?? fallback;
