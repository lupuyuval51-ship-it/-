/**
 * Launch Center data layer (docs/FEATURE_CONTRACTS.md → launch).
 *
 * One query per business holds the whole checklist: ['b', businessId, 'launch', 'items'].
 * Item reads derive from it with `select`, so a status toggle (optimistic) shows everywhere.
 * Seeding from templates is idempotent: upsert on (business_id, template_key) ignoring duplicates.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/i18n/I18nProvider';
import { AppErrorException, makeAppError, toAppError } from '@/lib/errors';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseResult';
import { buildSeedRows, compareLaunchItems, nextCustomSortOrder, parseLaunchItem, type LaunchItem } from './logic';
import type { LaunchItemPatch } from './schemas';
import type { LaunchStatus } from './templates';

export type { LaunchItem } from './logic';

type BusinessId = string | null | undefined;

export const launchKeys = {
  all: (businessId: string) => qk.b(businessId, 'launch'),
  items: (businessId: string) => qk.b(businessId, 'launch', 'items'),
};

function requireBusiness(businessId: BusinessId): string {
  if (!businessId) throw new AppErrorException(makeAppError('precondition_failed', 'No active business'));
  return businessId;
}

async function fetchItems(businessId: string): Promise<LaunchItem[]> {
  const rows = unwrap(await supabase.from('launch_checklist_items').select('*').eq('business_id', businessId));
  return rows.map(parseLaunchItem).sort(compareLaunchItems);
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/** The whole checklist, sorted by category then sort order. */
export function useLaunchItems(businessId: BusinessId) {
  return useQuery({
    queryKey: launchKeys.items(businessId ?? ''),
    enabled: !!businessId,
    queryFn: () => fetchItems(requireBusiness(businessId)),
  });
}

/** One item, derived from the checklist query (`data` is null when it does not exist). */
export function useLaunchItem(businessId: BusinessId, itemId: string | null | undefined) {
  return useQuery({
    queryKey: launchKeys.items(businessId ?? ''),
    enabled: !!businessId,
    queryFn: () => fetchItems(requireBusiness(businessId)),
    select: (items: LaunchItem[]) => items.find((i) => i.id === itemId) ?? null,
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export interface SeedResult {
  /** Rows actually inserted (existing template keys are skipped). */
  added: number;
}

/** Adds the recommended items for `countryCode` that are not in the checklist yet. */
export function useSeedLaunchTemplates(businessId: BusinessId) {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  return useMutation({
    mutationFn: async (countryCode: string): Promise<SeedResult> => {
      const rows = buildSeedRows(requireBusiness(businessId), countryCode, locale);
      if (rows.length === 0) return { added: 0 };
      const inserted = unwrap(
        await supabase
          .from('launch_checklist_items')
          .upsert(rows, { onConflict: 'business_id,template_key', ignoreDuplicates: true })
          .select('id'),
      );
      return { added: inserted.length };
    },
    onSettled: () => {
      if (businessId) void queryClient.invalidateQueries({ queryKey: launchKeys.items(businessId) });
    },
  });
}

export interface CreateLaunchItemInput extends LaunchItemPatch {}

/** Creates a custom item (template_key null), placed after the existing items of its category. */
export function useCreateLaunchItem(businessId: BusinessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLaunchItemInput): Promise<LaunchItem> => {
      const id = requireBusiness(businessId);
      const existing = queryClient.getQueryData<LaunchItem[]>(launchKeys.items(id)) ?? [];
      const row = unwrap(
        await supabase
          .from('launch_checklist_items')
          .insert({ ...input, business_id: id, template_key: null, sort_order: nextCustomSortOrder(existing, input.category) })
          .select('*')
          .single(),
      );
      return parseLaunchItem(row);
    },
    onSuccess: (item) => {
      queryClient.setQueryData<LaunchItem[]>(launchKeys.items(item.business_id), (list) => (list ? [...list, item].sort(compareLaunchItems) : list));
      void queryClient.invalidateQueries({ queryKey: launchKeys.items(item.business_id) });
    },
  });
}

export interface UpdateLaunchItemInput {
  id: string;
  patch: Partial<LaunchItemPatch>;
}

interface UpdateContext {
  previous: LaunchItem[] | undefined;
}

/**
 * Updates an item. Optimistic (status toggles must feel instant); rolls back on error.
 */
export function useUpdateLaunchItem(businessId: BusinessId) {
  const queryClient = useQueryClient();
  return useMutation<LaunchItem, Error, UpdateLaunchItemInput, UpdateContext>({
    mutationFn: async ({ id, patch }) => {
      const row = unwrap(
        await supabase
          .from('launch_checklist_items')
          .update(patch)
          .eq('business_id', requireBusiness(businessId))
          .eq('id', id)
          .select('*')
          .single(),
      );
      return parseLaunchItem(row);
    },
    onMutate: async ({ id, patch }) => {
      if (!businessId) return { previous: undefined };
      const key = launchKeys.items(businessId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<LaunchItem[]>(key);
      queryClient.setQueryData<LaunchItem[]>(key, (list) =>
        list?.map((item) => (item.id === id ? { ...item, ...patch } : item)).sort(compareLaunchItems),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (businessId && context?.previous) queryClient.setQueryData(launchKeys.items(businessId), context.previous);
    },
    onSettled: () => {
      if (businessId) void queryClient.invalidateQueries({ queryKey: launchKeys.items(businessId) });
    },
  });
}

/** Convenience for the list: sets only the status. */
export function useSetLaunchStatus(businessId: BusinessId) {
  const update = useUpdateLaunchItem(businessId);
  return {
    ...update,
    setStatus: (id: string, status: LaunchStatus) => update.mutateAsync({ id, patch: { status } }),
  };
}

export function useDeleteLaunchItem(businessId: BusinessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const { error } = await supabase.from('launch_checklist_items').delete().eq('business_id', requireBusiness(businessId)).eq('id', id);
      if (error) throw new AppErrorException(toAppError(error));
      return id;
    },
    onSuccess: (id) => {
      if (!businessId) return;
      queryClient.setQueryData<LaunchItem[]>(launchKeys.items(businessId), (list) => list?.filter((i) => i.id !== id));
      void queryClient.invalidateQueries({ queryKey: launchKeys.items(businessId) });
    },
  });
}
