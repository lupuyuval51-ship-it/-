import { useQuery, type QueryClient } from '@tanstack/react-query';
import type { CustomTargetsInput, DeleteAccountInput, OnboardingInput, ProfileUpdateInput, SettingsUpdateInput } from '@shared/schemas/profile';
import type {
  AccountExportDTO,
  OkResponse,
  OnboardingResponse,
  ProfileDTO,
  ProfileResponse,
  ProfileUpdateResponse,
  SettingsUpdateResponse,
} from '@shared/types';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../api/client';
import { platform, type SaveFileResult } from '../../platform';
import { qk } from '../../api/queryClient';

export const fetchProfile = (signal?: AbortSignal) => apiGet<ProfileResponse>('/profile', undefined, signal).then((r) => r.profile);

/** The signed-in user's profile (cached under `qk.profile`). */
export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: ({ signal }) => fetchProfile(signal) });
}

export const saveOnboarding = (input: OnboardingInput, idempotencyKey: string) =>
  apiPut<OnboardingResponse>('/profile/onboarding', input, idempotencyKey);

export const updateProfile = (input: ProfileUpdateInput) => apiPatch<ProfileUpdateResponse>('/profile', input);

export const updateSettings = (input: SettingsUpdateInput) => apiPatch<SettingsUpdateResponse>('/settings', input);

export const updateTargets = (input: CustomTargetsInput | { reset: true }) => apiPut<ProfileResponse>('/profile/targets', input).then((r) => r.profile);

export const changePassword = (input: { currentPassword: string; newPassword: string }) => apiPost<OkResponse>('/auth/password', input);

export const logoutAllDevices = () => apiPost<OkResponse>('/auth/logout-all');

export const deleteAccount = (input: DeleteAccountInput) => apiDelete<OkResponse>('/account', input);

export const fetchAccountExport = () => apiGet<AccountExportDTO>('/account/export');

/**
 * Saves data as a JSON file (export, backup): a download in a browser, Android's share sheet in the app
 * (`platform.saveFile`). 'cancelled' when the share sheet was closed without saving.
 */
export function downloadJson(data: unknown, fileName: string): Promise<SaveFileResult> {
  return platform.saveFile(fileName, 'application/json', JSON.stringify(data, null, 2));
}

/**
 * Stores a fresh profile and refreshes everything derived from it (targets on the dashboard
 * and nutrition pages, equipment-based exercise availability, body-weight progress, XP).
 */
export async function applyProfileChange(queryClient: QueryClient, profile?: ProfileDTO) {
  if (profile) queryClient.setQueryData(qk.profile, profile);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: qk.profile, refetchType: profile ? 'none' : 'active' }),
    queryClient.invalidateQueries({ queryKey: qk.me }),
    queryClient.invalidateQueries({ queryKey: qk.dashboard }),
    queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
    queryClient.invalidateQueries({ queryKey: ['exercises'] }),
    queryClient.invalidateQueries({ queryKey: ['exercise'] }),
    queryClient.invalidateQueries({ queryKey: ['progress'] }),
    queryClient.invalidateQueries({ queryKey: qk.gamification }),
    queryClient.invalidateQueries({ queryKey: qk.notifications }),
  ]);
}
