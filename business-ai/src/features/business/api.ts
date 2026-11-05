/**
 * Businesses (user-scoped list) and the active business.
 * Query keys: qk.me.businesses(); everything belonging to one business lives under qk.b(id).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile, type Profile } from '@/features/settings/api';
import type { Row } from '@/lib/database';
import { AppErrorException, makeAppError } from '@/lib/errors';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseResult';
import { useActiveBusinessStore } from '@/stores/activeBusiness';

export const BUSINESS_STAGES = ['idea', 'planning', 'launching', 'operating', 'growing'] as const;
export type BusinessStage = (typeof BUSINESS_STAGES)[number];

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  idea: string;
  stage: BusinessStage;
  country_code: string | null;
  /** ISO-4217; every *_minor amount of this business is in this currency. */
  currency: string;
  onboarding_completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isBusinessStage(value: unknown): value is BusinessStage {
  return typeof value === 'string' && (BUSINESS_STAGES as readonly string[]).includes(value);
}

export function parseBusiness(row: Row<'businesses'>): Business {
  return { ...row, stage: isBusinessStage(row.stage) ? row.stage : 'idea' };
}

/** Onboarding is complete when at least one (non-archived) business finished it. */
export function hasCompletedOnboarding(businesses: readonly Business[]): boolean {
  return businesses.some((b) => b.onboarding_completed_at !== null);
}

/**
 * Active business resolution: the profile's choice, else this device's cached choice, else the
 * first business that finished onboarding, else the first business. Ids that are not in the
 * (non-archived) list are ignored. Before the list loads, the best known id is returned so
 * business-scoped queries can start immediately.
 */
export function resolveActiveBusinessId(input: {
  businesses: readonly Business[] | undefined;
  profileActiveId: string | null | undefined;
  cachedId: string | null;
}): string | null {
  const { businesses, profileActiveId, cachedId } = input;
  if (!businesses) return profileActiveId ?? cachedId ?? null;
  const ids = new Set(businesses.map((b) => b.id));
  if (profileActiveId && ids.has(profileActiveId)) return profileActiveId;
  if (cachedId && ids.has(cachedId)) return cachedId;
  return (businesses.find((b) => b.onboarding_completed_at !== null) ?? businesses[0])?.id ?? null;
}

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new AppErrorException(makeAppError('session_expired', 'Not signed in'));
  return userId;
}

/** Non-archived businesses of the signed-in user, oldest first. */
export function useBusinesses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.me.businesses(),
    enabled: !!user,
    queryFn: async () => {
      const rows = unwrap(await supabase.from('businesses').select('*').is('archived_at', null).order('created_at', { ascending: true }));
      return rows.map(parseBusiness);
    },
  });
}

export interface ActiveBusinessState {
  /** The active business, once the list is loaded (null when the user has none). */
  business: Business | null;
  /** Available immediately on startup (cached), even before `business` resolves. */
  businessId: string | null;
  businesses: Business[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useActiveBusiness(): ActiveBusinessState {
  const businessesQuery = useBusinesses();
  const profileQuery = useProfile();
  const cachedId = useActiveBusinessStore((s) => s.businessId);
  const setCachedId = useActiveBusinessStore((s) => s.setBusinessId);
  const businesses = businessesQuery.data;

  const businessId = resolveActiveBusinessId({
    businesses,
    profileActiveId: profileQuery.data?.active_business_id,
    cachedId,
  });

  useEffect(() => {
    if (businesses && businessId !== cachedId) setCachedId(businessId);
  }, [businesses, businessId, cachedId, setCachedId]);

  return {
    business: businesses?.find((b) => b.id === businessId) ?? null,
    businessId,
    businesses: businesses ?? [],
    isLoading: businessesQuery.isLoading,
    error: businessesQuery.error,
    refetch: () => void businessesQuery.refetch(),
  };
}

export interface CreateBusinessInput {
  name: string;
  idea?: string;
  stage?: BusinessStage;
  country_code?: string | null;
  currency?: string;
}

/**
 * Creates a business (owner = current user) and makes it active.
 * Fails with `business_limit_reached` when the tier limit is hit (DB trigger).
 */
export function useCreateBusiness() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const setCachedId = useActiveBusinessStore((s) => s.setBusinessId);
  return useMutation({
    mutationFn: async (input: CreateBusinessInput) => {
      requireUserId(user?.id);
      const row = unwrap(await supabase.from('businesses').insert(input).select('*').single());
      return parseBusiness(row);
    },
    onSuccess: async (business) => {
      queryClient.setQueryData<Business[]>(qk.me.businesses(), (list) => [...(list ?? []).filter((b) => b.id !== business.id), business]);
      setCachedId(business.id);
      // Account-level active business (best effort; the device cache already points at it).
      const { data } = await supabase.from('profiles').update({ active_business_id: business.id }).eq('id', business.owner_id).select('active_business_id');
      if (data) queryClient.setQueryData<Profile>(qk.me.profile(), (p) => (p ? { ...p, active_business_id: business.id } : p));
      await queryClient.invalidateQueries({ queryKey: qk.me.businesses() });
    },
  });
}

export type BusinessPatch = Partial<Pick<Business, 'name' | 'idea' | 'stage' | 'country_code' | 'currency' | 'onboarding_completed_at'>>;

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: BusinessPatch }) => {
      const row = unwrap(await supabase.from('businesses').update(patch).eq('id', id).select('*').single());
      return parseBusiness(row);
    },
    onSuccess: async (business) => {
      queryClient.setQueryData<Business[]>(qk.me.businesses(), (list) => list?.map((b) => (b.id === business.id ? business : b)));
      await queryClient.invalidateQueries({ queryKey: qk.me.businesses() });
    },
  });
}

/** Archives (hides) a business. Its cached data is dropped; the active business moves on. */
export function useArchiveBusiness() {
  const queryClient = useQueryClient();
  const clearCached = useActiveBusinessStore((s) => s.clear);
  return useMutation({
    mutationFn: async (id: string) => {
      const row = unwrap(await supabase.from('businesses').update({ archived_at: new Date().toISOString() }).eq('id', id).select('*').single());
      return parseBusiness(row);
    },
    onSuccess: async (business) => {
      queryClient.setQueryData<Business[]>(qk.me.businesses(), (list) => list?.filter((b) => b.id !== business.id));
      queryClient.removeQueries({ queryKey: qk.b(business.id) });
      if (useActiveBusinessStore.getState().businessId === business.id) clearCached();
      const profile = queryClient.getQueryData<Profile>(qk.me.profile());
      if (profile?.active_business_id === business.id) {
        await supabase.from('profiles').update({ active_business_id: null }).eq('id', profile.id);
        queryClient.setQueryData<Profile>(qk.me.profile(), { ...profile, active_business_id: null });
      }
      await queryClient.invalidateQueries({ queryKey: qk.me.businesses() });
    },
  });
}

/** Switches the active business: instant on this device, then saved to the profile. */
export function useSetActiveBusiness() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const setCachedId = useActiveBusinessStore((s) => s.setBusinessId);
  return useMutation({
    mutationFn: async (businessId: string) => {
      const uid = requireUserId(user?.id);
      unwrap(await supabase.from('profiles').update({ active_business_id: businessId }).eq('id', uid).select('id').single());
      return businessId;
    },
    onMutate: (businessId) => {
      const previous = queryClient.getQueryData<Profile>(qk.me.profile());
      setCachedId(businessId);
      if (previous) queryClient.setQueryData<Profile>(qk.me.profile(), { ...previous, active_business_id: businessId });
      return { previous };
    },
    onError: (_error, _businessId, context) => {
      if (context?.previous) queryClient.setQueryData(qk.me.profile(), context.previous);
    },
  });
}
