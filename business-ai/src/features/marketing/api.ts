/**
 * Marketing Studio data layer (docs/FEATURE_CONTRACTS.md → marketing).
 *
 * Query keys (all under ['b', businessId, 'marketing']):
 *   ['b', id, 'marketing', 'assets']           every asset of the business (list screen)
 *   ['b', id, 'marketing', 'asset', assetId]   one asset (seeded from the list cache)
 *
 * AI generation (`marketing.generate`) saves a NEW asset server-side and returns it; nothing the
 * user already has is modified. Regenerating therefore always creates another asset.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { MarketingContentSchema, type MarketingContent, type MarketingKind } from '@domain/marketing';
import { useLocale } from '@/i18n/I18nProvider';
import type { Json } from '@/lib/database';
import { AppErrorException, makeAppError, toAppError } from '@/lib/errors';
import { invokeAi } from '@/lib/functions';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseResult';
import { useAiUsage, useEntitlement } from '@/features/settings/api';
import { EMPTY_MARKETING_CONTENT, normalizeMarketingContent, parseMarketingAsset, remainingMarketingGenerations, type MarketingAsset } from './logic';

export type { MarketingAsset, MarketingContent, MarketingItem, MarketingKind } from './logic';

type BusinessId = string | null | undefined;

export const marketingKeys = {
  all: (businessId: string) => qk.b(businessId, 'marketing'),
  assets: (businessId: string) => qk.b(businessId, 'marketing', 'assets'),
  asset: (businessId: string, assetId: string) => qk.b(businessId, 'marketing', 'asset', assetId),
};

function requireBusiness(businessId: BusinessId): string {
  if (!businessId) throw new AppErrorException(makeAppError('precondition_failed', 'No active business'));
  return businessId;
}

function parseOrThrow(row: Parameters<typeof parseMarketingAsset>[0]): MarketingAsset {
  const asset = parseMarketingAsset(row);
  if (!asset) throw new AppErrorException(makeAppError('invalid_request', `Unknown marketing kind ${row.kind}`));
  return asset;
}

/** Writes one asset into both caches (list + detail). */
function putAsset(queryClient: QueryClient, asset: MarketingAsset): void {
  queryClient.setQueryData(marketingKeys.asset(asset.business_id, asset.id), asset);
  queryClient.setQueryData<MarketingAsset[]>(marketingKeys.assets(asset.business_id), (list) =>
    list ? [asset, ...list.filter((a) => a.id !== asset.id)] : list,
  );
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/** Every marketing asset of the business, most recently updated first. */
export function useMarketingAssets(businessId: BusinessId) {
  return useQuery({
    queryKey: marketingKeys.assets(businessId ?? ''),
    enabled: !!businessId,
    queryFn: async (): Promise<MarketingAsset[]> => {
      const rows = unwrap(
        await supabase
          .from('marketing_assets')
          .select('*')
          .eq('business_id', requireBusiness(businessId))
          .order('updated_at', { ascending: false }),
      );
      return rows.flatMap((row) => {
        const asset = parseMarketingAsset(row);
        return asset ? [asset] : [];
      });
    },
  });
}

/** One asset; renders instantly from the list cache when it is there. */
export function useMarketingAsset(businessId: BusinessId, assetId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: marketingKeys.asset(businessId ?? '', assetId ?? ''),
    enabled: !!businessId && !!assetId,
    initialData: () =>
      businessId && assetId ? queryClient.getQueryData<MarketingAsset[]>(marketingKeys.assets(businessId))?.find((a) => a.id === assetId) : undefined,
    initialDataUpdatedAt: () => (businessId ? queryClient.getQueryState(marketingKeys.assets(businessId))?.dataUpdatedAt : undefined),
    queryFn: async (): Promise<MarketingAsset> => {
      const row = unwrap(
        await supabase
          .from('marketing_assets')
          .select('*')
          .eq('business_id', requireBusiness(businessId))
          .eq('id', assetId ?? '')
          .single(),
      );
      return parseOrThrow(row);
    },
  });
}

export interface MarketingQuota {
  /** Remaining AI generations this month; null while unknown (loading / offline without cache). */
  remaining: number | null;
  limit: number;
}

/** Display-only quota (the server enforces it): tier limit minus this month's usage. */
export function useMarketingQuota(): MarketingQuota {
  const entitlement = useEntitlement();
  const usage = useAiUsage();
  const limit = entitlement.limits.monthlyAiCalls.marketing_generation;
  const remaining = entitlement.isLoading ? null : remainingMarketingGenerations(entitlement.tier, usage.data);
  return { remaining, limit };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export interface GenerateAssetInput {
  kind: MarketingKind;
  instruction?: string;
}

/**
 * Asks the AI for a new asset of `kind`. The Edge Function saves it (origin 'ai') and returns it.
 * Errors: `quota_exceeded`, `cost_cap_reached`, `not_configured`, `ai_refused`, … (AppErrorException).
 */
export function useGenerateAsset(businessId: BusinessId) {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  return useMutation({
    mutationFn: async ({ kind, instruction }: GenerateAssetInput): Promise<MarketingAsset> => {
      const trimmed = instruction?.trim();
      const { asset } = await invokeAi({
        action: 'marketing.generate',
        businessId: requireBusiness(businessId),
        kind,
        instruction: trimmed ? trimmed.slice(0, 1000) : undefined,
        locale,
      });
      // Re-validate the server payload with the shared contract before caching it.
      return { ...asset, content: MarketingContentSchema.catch(EMPTY_MARKETING_CONTENT).parse(asset.content) };
    },
    onSuccess: (asset) => {
      putAsset(queryClient, asset);
    },
    onSettled: () => {
      // Usage is recorded for success and failure alike.
      void queryClient.invalidateQueries({ queryKey: qk.me.aiUsage() });
      if (businessId) void queryClient.invalidateQueries({ queryKey: marketingKeys.assets(businessId) });
    },
  });
}

export interface CreateAssetInput {
  kind: MarketingKind;
  title: string;
}

/** Creates a blank, user-authored asset. */
export function useCreateAsset(businessId: BusinessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, title }: CreateAssetInput): Promise<MarketingAsset> => {
      const row = unwrap(
        await supabase
          .from('marketing_assets')
          .insert({
            business_id: requireBusiness(businessId),
            kind,
            title: title.trim().slice(0, 200),
            content: EMPTY_MARKETING_CONTENT as unknown as NonNullable<Json>,
            origin: 'user',
          })
          .select('*')
          .single(),
      );
      return parseOrThrow(row);
    },
    onSuccess: (asset) => {
      putAsset(queryClient, asset);
      void queryClient.invalidateQueries({ queryKey: marketingKeys.assets(asset.business_id) });
    },
  });
}

export interface UpdateAssetInput {
  id: string;
  title: string;
  content: MarketingContent;
}

/**
 * Saves the user's edits. Content is normalized and validated with MarketingContentSchema first;
 * an edited asset becomes the user's own (origin 'user').
 */
export function useUpdateAsset(businessId: BusinessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, content }: UpdateAssetInput): Promise<MarketingAsset> => {
      const parsed = MarketingContentSchema.safeParse(normalizeMarketingContent(content));
      if (!parsed.success) throw new AppErrorException(makeAppError('validation', parsed.error.message));
      const row = unwrap(
        await supabase
          .from('marketing_assets')
          .update({ title: title.trim(), content: parsed.data as unknown as NonNullable<Json>, origin: 'user' })
          .eq('business_id', requireBusiness(businessId))
          .eq('id', id)
          .select('*')
          .single(),
      );
      return parseOrThrow(row);
    },
    onSuccess: (asset) => {
      putAsset(queryClient, asset);
      void queryClient.invalidateQueries({ queryKey: marketingKeys.assets(asset.business_id) });
    },
  });
}

export function useDeleteAsset(businessId: BusinessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const { error } = await supabase.from('marketing_assets').delete().eq('business_id', requireBusiness(businessId)).eq('id', id);
      if (error) throw new AppErrorException(toAppError(error));
      return id;
    },
    onSuccess: (id) => {
      if (!businessId) return;
      queryClient.setQueryData<MarketingAsset[]>(marketingKeys.assets(businessId), (list) => list?.filter((a) => a.id !== id));
      queryClient.removeQueries({ queryKey: marketingKeys.asset(businessId, id) });
      void queryClient.invalidateQueries({ queryKey: marketingKeys.assets(businessId) });
    },
  });
}
