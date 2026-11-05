/**
 * Onboarding data layer: `onboarding_responses` (one row per question, upserted on
 * `business_id,question_key`) and onboarding completion on `businesses`.
 * Query key: ['b', businessId, 'onboarding']. Business create / update / switch come from
 * '@/features/business/api'.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnboardingKey, OnboardingValue } from '@domain/onboarding';
import { useUpdateBusiness } from '@/features/business/api';
import type { Json } from '@/lib/database';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseResult';
import type { OnboardingResponseRow } from './logic';

export const onboardingQueryKey = (businessId: string) => qk.b(businessId, 'onboarding');

export async function fetchOnboardingResponses(businessId: string): Promise<OnboardingResponseRow[]> {
  const result = await supabase.from('onboarding_responses').select('question_key, value, skipped').eq('business_id', businessId);
  return unwrap(result);
}

/** Saved answers of one business (rows as stored; parse with `responsesToAnswers`). */
export function useOnboardingResponses(businessId: string | null | undefined) {
  return useQuery({
    queryKey: onboardingQueryKey(businessId ?? 'none'),
    queryFn: () => fetchOnboardingResponses(businessId as string),
    enabled: !!businessId,
  });
}

export interface SaveAnswerInput<K extends OnboardingKey = OnboardingKey> {
  businessId: string;
  key: K;
  /** `null` = skipped. */
  value: OnboardingValue<K> | null;
}

export async function saveOnboardingAnswer({ businessId, key, value }: SaveAnswerInput): Promise<OnboardingResponseRow> {
  const skipped = value === null;
  const result = await supabase
    .from('onboarding_responses')
    .upsert(
      { business_id: businessId, question_key: key, value: skipped ? null : (value as unknown as Json), skipped },
      { onConflict: 'business_id,question_key' },
    )
    .select('question_key, value, skipped')
    .single();
  return unwrap(result);
}

/** Upserts one answer (or a skip) and updates the cached list in place. */
export function useSaveOnboardingAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveOnboardingAnswer,
    onSuccess: (row, { businessId }) => {
      queryClient.setQueryData<OnboardingResponseRow[]>(onboardingQueryKey(businessId), (prev) => [
        ...(prev ?? []).filter((r) => r.question_key !== row.question_key),
        row,
      ]);
    },
  });
}

/**
 * Marks onboarding complete (`onboarding_completed_at = now()`, stage untouched — it stays 'idea')
 * and refreshes everything that depends on it (business list → route guards, business data).
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const update = useUpdateBusiness();
  return useMutation({
    mutationFn: ({ businessId }: { businessId: string }) =>
      update.mutateAsync({ id: businessId, patch: { onboarding_completed_at: new Date().toISOString() } }),
    onSuccess: async (_business, { businessId }) => {
      await queryClient.invalidateQueries({ queryKey: qk.b(businessId) });
    },
  });
}
