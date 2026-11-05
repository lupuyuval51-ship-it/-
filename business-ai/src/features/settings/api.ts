/**
 * User-scoped data: profile, subscription entitlement, monthly AI usage.
 * Query keys: qk.me.profile() · qk.me.entitlement() · qk.me.aiUsage().
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AI_FEATURES, limitsFor, type AiFeature, type Tier, type TierLimits } from '@domain/entitlements';
import { useAuth } from '@/features/auth/AuthProvider';
import { isLocale, type Locale } from '@/i18n/types';
import type { Row } from '@/lib/database';
import { AppErrorException, makeAppError } from '@/lib/errors';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap, unwrapMaybe } from '@/lib/supabaseResult';
import { isThemePreference, type ThemePreference } from '@/theme/ThemeProvider';

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export interface Profile {
  id: string;
  display_name: string | null;
  locale: Locale;
  theme: ThemePreference;
  active_business_id: string | null;
  created_at: string;
  updated_at: string;
}

const PROFILE_COLUMNS = 'id, display_name, locale, theme, active_business_id, created_at, updated_at';

type ProfileRow = Pick<Row<'profiles'>, 'id' | 'display_name' | 'locale' | 'theme' | 'active_business_id' | 'created_at' | 'updated_at'>;

export function parseProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    display_name: row.display_name,
    locale: isLocale(row.locale) ? row.locale : 'he',
    theme: isThemePreference(row.theme) ? row.theme : 'system',
    active_business_id: row.active_business_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new AppErrorException(makeAppError('session_expired', 'Not signed in'));
  return userId;
}

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: qk.me.profile(),
    enabled: !!userId,
    queryFn: async () => {
      const row = unwrap(await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', requireUserId(userId)).single());
      return parseProfile(row);
    },
  });
}

export type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'locale' | 'theme' | 'active_business_id'>>;

/** Updates own profile columns (display_name, locale, theme, active_business_id). */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  return useMutation({
    mutationFn: async (patch: ProfilePatch) => {
      const row = unwrap(await supabase.from('profiles').update(patch).eq('id', requireUserId(userId)).select(PROFILE_COLUMNS).single());
      return parseProfile(row);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(qk.me.profile(), profile);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Entitlement                                                         */
/* ------------------------------------------------------------------ */

export interface Entitlement {
  tier: string;
  status: string;
  current_period_end: string | null;
}

/** Mirrors SQL `current_tier()`: 'pro' only when active and not past current_period_end. */
export function effectiveTier(entitlement: Entitlement | null, now: Date = new Date()): Tier {
  if (!entitlement) return 'free';
  if (entitlement.tier !== 'pro' || entitlement.status !== 'active') return 'free';
  if (entitlement.current_period_end && new Date(entitlement.current_period_end).getTime() <= now.getTime()) return 'free';
  return 'pro';
}

export interface EntitlementState {
  tier: Tier;
  limits: TierLimits;
  entitlement: Entitlement | null;
  /** First load in progress (tier shows 'free' meanwhile — don't render it as fact yet). */
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEntitlement(): EntitlementState {
  const { user } = useAuth();
  const userId = user?.id;
  const query = useQuery({
    queryKey: qk.me.entitlement(),
    enabled: !!userId,
    queryFn: async () =>
      unwrapMaybe(
        await supabase.from('subscription_entitlements').select('tier, status, current_period_end').eq('user_id', requireUserId(userId)).maybeSingle(),
      ),
  });
  const tier = effectiveTier(query.data ?? null);
  return {
    tier,
    limits: limitsFor(tier),
    entitlement: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/* ------------------------------------------------------------------ */
/* AI usage (this calendar month, UTC)                                 */
/* ------------------------------------------------------------------ */

export type AiUsage = Record<AiFeature, number>;

export function toAiUsage(rows: readonly { feature: string; used: number }[]): AiUsage {
  const usage = Object.fromEntries(AI_FEATURES.map((f) => [f, 0])) as AiUsage;
  for (const row of rows) {
    if ((AI_FEATURES as readonly string[]).includes(row.feature)) usage[row.feature as AiFeature] = Number(row.used) || 0;
  }
  return usage;
}

/** `rpc('ai_usage_summary')` → used calls per feature. Invalidate after AI actions. */
export function useAiUsage() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.me.aiUsage(),
    enabled: !!user,
    staleTime: 10_000,
    queryFn: async () => toAiUsage(unwrap(await supabase.rpc('ai_usage_summary'))),
  });
}
