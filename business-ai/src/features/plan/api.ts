/**
 * Business plan data layer (docs/FEATURE_CONTRACTS.md → plan).
 *
 * Query keys (all under ['b', businessId, 'plan'] so one invalidation refreshes everything):
 *   ['b', id, 'plan']                       plan row + current version (with sections) + latest version
 *   ['b', id, 'plan', 'versions']           version history (metadata only)
 *   ['b', id, 'plan', 'version', versionId] one version with its sections (immutable once ready)
 *
 * Generation is async: `plan.generate` returns 202 with a 'generating' version; usePlanState polls
 * every 2.5 s while the latest version is generating (a 'generating' row older than 10 minutes is
 * treated as failed — see logic.isStaleGeneration).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { AiResponse } from '@domain/ai-api';
import type { AiFeature } from '@domain/entitlements';
import {
  PLAN_VERSION_ORIGINS,
  type PlanSectionContent,
  type PlanSectionKey,
  type PlanVersionOrigin,
  type PlanVersionStatus,
} from '@domain/plan';
import { useAiUsage, useEntitlement } from '@/features/settings/api';
import { useLocale } from '@/i18n/I18nProvider';
import type { Json, Row } from '@/lib/database';
import { AppErrorException, makeAppError, toAppError, type AppError } from '@/lib/errors';
import { invokeAi } from '@/lib/functions';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import {
  effectiveVersionStatus,
  isPlanSectionKey,
  isStaleGeneration,
  parseSectionContent,
  remainingUses,
  type EffectiveVersionStatus,
} from './logic';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PlanRow = Row<'business_plans'>;

export interface PlanVersionMeta {
  id: string;
  plan_id: string;
  version_number: number;
  origin: PlanVersionOrigin;
  status: PlanVersionStatus;
  error_code: string | null;
  model: string | null;
  change_note: string | null;
  based_on_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SectionRow {
  id: string;
  plan_version_id: string;
  section_key: PlanSectionKey;
  content: PlanSectionContent;
  origin: 'ai' | 'user';
  created_at: string;
  updated_at: string;
}

export type SectionMap = Partial<Record<PlanSectionKey, SectionRow>>;

export interface PlanVersionDetail extends PlanVersionMeta {
  sections: SectionMap;
}

interface PlanStateData {
  plan: PlanRow | null;
  current: PlanVersionDetail | null;
  latest: PlanVersionMeta | null;
  /** Sections already written into the latest version (progress while generating). */
  latestWrittenKeys: PlanSectionKey[];
}

export interface PlanState {
  plan: PlanRow | null;
  /** The version shown to the user (business_plans.current_version_id; always 'ready'). */
  currentVersion: PlanVersionMeta | null;
  /** The newest version by number (may be 'generating' or 'failed'). */
  latestVersion: PlanVersionMeta | null;
  /** Sections of the current version, keyed by section key. */
  sections: SectionMap;
  /** True while the latest version is generating and not stale. */
  isGenerating: boolean;
  /**
   * State of the newest generation attempt when it is newer than the current version
   * (generating / failed — stale generations are reported as failed). Null otherwise.
   */
  pendingGeneration: (EffectiveVersionStatus & { version: PlanVersionMeta; writtenKeys: PlanSectionKey[] }) | null;
  /** True once the plan has been fetched at least once (also from the offline cache). */
  isReady: boolean;
  isLoading: boolean;
  /** True while a background refetch runs (pull to refresh). */
  isRefetching: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
}

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

const VERSION_COLUMNS = 'id, plan_id, version_number, origin, status, error_code, model, change_note, based_on_version_id, created_at, updated_at';
const SECTION_COLUMNS = 'id, plan_version_id, section_key, content, origin, created_at, updated_at';

const ORIGINS: ReadonlySet<string> = new Set(PLAN_VERSION_ORIGINS);

interface RawVersion {
  id: string;
  plan_id: string;
  version_number: number;
  origin: string;
  status: string;
  error_code: string | null;
  model: string | null;
  change_note: string | null;
  based_on_version_id: string | null;
  created_at: string;
  updated_at: string;
}

interface RawSection {
  id: string;
  plan_version_id: string;
  section_key: string;
  content: Json;
  origin: string;
  created_at: string;
  updated_at: string;
}

function toVersionMeta(raw: RawVersion): PlanVersionMeta {
  return {
    id: raw.id,
    plan_id: raw.plan_id,
    version_number: raw.version_number,
    origin: (ORIGINS.has(raw.origin) ? raw.origin : 'ai_generated') as PlanVersionOrigin,
    status: raw.status === 'ready' || raw.status === 'failed' ? raw.status : 'generating',
    error_code: raw.error_code,
    model: raw.model,
    change_note: raw.change_note,
    based_on_version_id: raw.based_on_version_id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function toSectionMap(rows: readonly RawSection[] | null | undefined): SectionMap {
  const map: SectionMap = {};
  for (const row of rows ?? []) {
    if (!isPlanSectionKey(row.section_key)) continue;
    const content = parseSectionContent(row.content);
    if (!content) continue;
    map[row.section_key] = {
      id: row.id,
      plan_version_id: row.plan_version_id,
      section_key: row.section_key,
      content,
      origin: row.origin === 'user' ? 'user' : 'ai',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  return map;
}

function toVersionDetail(raw: RawVersion & { plan_sections?: RawSection[] | null }): PlanVersionDetail {
  return { ...toVersionMeta(raw), sections: toSectionMap(raw.plan_sections) };
}

/** PostgREST returns a to-one embed as an object, but older/hinted embeds can come back as arrays. */
function single<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function requireBusinessId(businessId: string | null | undefined): string {
  if (!businessId) throw new AppErrorException(makeAppError('precondition_failed', 'No active business'));
  return businessId;
}

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

export const planKeys = {
  state: (businessId: string) => qk.b(businessId, 'plan'),
  versions: (businessId: string) => qk.b(businessId, 'plan', 'versions'),
  version: (businessId: string, versionId: string) => qk.b(businessId, 'plan', 'version', versionId),
};

async function fetchPlanState(businessId: string): Promise<PlanStateData> {
  const { data, error } = await supabase
    .from('business_plans')
    .select(
      `id, business_id, current_version_id, created_at, updated_at,
       current:plan_versions!business_plans_current_version_id_fkey(${VERSION_COLUMNS}, plan_sections(${SECTION_COLUMNS})),
       latest:plan_versions!plan_versions_plan_id_fkey(${VERSION_COLUMNS}, plan_sections(section_key))`,
    )
    .eq('business_id', businessId)
    .order('version_number', { referencedTable: 'latest', ascending: false })
    .limit(1, { referencedTable: 'latest' })
    .maybeSingle();
  if (error) throw error;
  if (!data) return { plan: null, current: null, latest: null, latestWrittenKeys: [] };
  type LatestRaw = RawVersion & { plan_sections: { section_key: string }[] | null };
  const raw = data as unknown as PlanRow & {
    current: (RawVersion & { plan_sections: RawSection[] | null }) | (RawVersion & { plan_sections: RawSection[] | null })[] | null;
    latest: LatestRaw[] | LatestRaw | null;
  };
  const current = single(raw.current);
  const latest = single(raw.latest);
  return {
    plan: {
      id: raw.id,
      business_id: raw.business_id,
      current_version_id: raw.current_version_id,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    },
    current: current ? toVersionDetail(current) : null,
    latest: latest ? toVersionMeta(latest) : null,
    latestWrittenKeys: (latest?.plan_sections ?? []).map((s) => s.section_key).filter(isPlanSectionKey),
  };
}

export interface PlanHistory {
  currentVersionId: string | null;
  /** Newest first. */
  versions: PlanVersionMeta[];
}

async function fetchVersions(businessId: string): Promise<PlanHistory> {
  const { data, error } = await supabase
    .from('business_plans')
    .select(`current_version_id, versions:plan_versions!plan_versions_plan_id_fkey(${VERSION_COLUMNS})`)
    .eq('business_id', businessId)
    .order('version_number', { referencedTable: 'versions', ascending: false })
    .maybeSingle();
  if (error) throw error;
  if (!data) return { currentVersionId: null, versions: [] };
  const raw = data as unknown as { current_version_id: string | null; versions: RawVersion[] | null };
  return { currentVersionId: raw.current_version_id, versions: (raw.versions ?? []).map(toVersionMeta) };
}

async function fetchVersion(businessId: string, versionId: string): Promise<PlanVersionDetail | null> {
  const { data, error } = await supabase
    .from('plan_versions')
    .select(`${VERSION_COLUMNS}, plan_sections(${SECTION_COLUMNS}), plan:business_plans!plan_versions_plan_id_fkey!inner(business_id)`)
    .eq('id', versionId)
    .eq('plan.business_id', businessId)
    .maybeSingle();
  if (error) {
    // A malformed id in the URL is "not found", not a crash.
    if ((error as { code?: string }).code === '22P02') return null;
    throw error;
  }
  if (!data) return null;
  return toVersionDetail(data as unknown as RawVersion & { plan_sections: RawSection[] | null });
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export const PLAN_POLL_INTERVAL_MS = 2500;

function generatingLatest(data: PlanStateData | undefined, now: number = Date.now()): boolean {
  const latest = data?.latest;
  return !!latest && latest.status === 'generating' && !isStaleGeneration(latest, now);
}

/**
 * The business plan of `businessId`: current version with sections, newest version and
 * generation state. Polls while a generation is running.
 */
export function usePlanState(businessId: string | null | undefined): PlanState {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: planKeys.state(businessId ?? ''),
    queryFn: () => fetchPlanState(requireBusinessId(businessId)),
    enabled: !!businessId,
    refetchInterval: (q) => (generatingLatest(q.state.data) ? PLAN_POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: false,
  });

  const data = query.data;
  // Reference time for stale detection: the last successful fetch (refreshed by every poll),
  // which keeps render pure and is never later than "now".
  const now = query.dataUpdatedAt;
  const latest = data?.latest ?? null;
  const current = data?.current ?? null;
  const isGenerating = generatingLatest(data, now);

  // When a generation finishes, the Edge Function may also have created the roadmap and a
  // finance proposal, and usage was finalized: refresh those caches once.
  const wasGenerating = useRef(false);
  useEffect(() => {
    if (!businessId) return;
    if (wasGenerating.current && !isGenerating) {
      void queryClient.invalidateQueries({ queryKey: qk.b(businessId, 'roadmap') });
      void queryClient.invalidateQueries({ queryKey: qk.b(businessId, 'finance') });
      void queryClient.invalidateQueries({ queryKey: planKeys.versions(businessId) });
      void queryClient.invalidateQueries({ queryKey: qk.me.aiUsage() });
    }
    wasGenerating.current = isGenerating;
  }, [businessId, isGenerating, queryClient]);

  const pending =
    latest && latest.status !== 'ready' && (!current || latest.version_number > current.version_number)
      ? { ...effectiveVersionStatus(latest, now), version: latest, writtenKeys: data?.latestWrittenKeys ?? [] }
      : null;

  return {
    plan: data?.plan ?? null,
    currentVersion: current ? stripSections(current) : null,
    latestVersion: latest,
    sections: current?.sections ?? {},
    isGenerating,
    pendingGeneration: pending,
    isReady: query.data !== undefined,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error ? toAppError(query.error) : null,
    refetch: query.refetch,
  };
}

function stripSections(detail: PlanVersionDetail): PlanVersionMeta {
  const { sections: _sections, ...meta } = detail;
  return meta;
}

/** Version history of the plan (newest first) and which one is current. */
export function usePlanVersions(businessId: string | null | undefined) {
  return useQuery({
    queryKey: planKeys.versions(businessId ?? ''),
    queryFn: () => fetchVersions(requireBusinessId(businessId)),
    enabled: !!businessId,
  });
}

/** One version with its sections. Ready versions are immutable, so they never go stale. */
export function usePlanVersion(businessId: string | null | undefined, versionId: string | null | undefined) {
  return useQuery({
    queryKey: planKeys.version(businessId ?? '', versionId ?? ''),
    queryFn: () => fetchVersion(requireBusinessId(businessId), versionId as string),
    enabled: !!businessId && !!versionId,
    staleTime: (q) => (q.state.data?.status === 'ready' ? Infinity : 0),
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/**
 * Starts AI generation of a new plan version (async on the server; returns once the
 * 'generating' version exists and the plan cache has picked it up, so polling starts).
 */
export function useStartPlanGeneration(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  return useMutation<AiResponse<'plan.generate'>, AppError, void>({
    mutationFn: async () => {
      try {
        return await invokeAi({ action: 'plan.generate', businessId: requireBusinessId(businessId), locale });
      } catch (e) {
        throw toAppError(e);
      }
    },
    onSettled: async () => {
      if (!businessId) return;
      void queryClient.invalidateQueries({ queryKey: qk.me.aiUsage() });
      await queryClient.invalidateQueries({ queryKey: planKeys.state(businessId) });
    },
  });
}

export interface SaveSectionInput {
  sectionKey: PlanSectionKey;
  content: PlanSectionContent;
  /** 'user' for manual edits (default), 'ai' when accepting a regenerated proposal. */
  origin?: 'user' | 'ai';
  note?: string;
}

/** Copy-on-write save of one section → new current version. Resolves with the new version id. */
export function useSaveSection(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<string, AppError, SaveSectionInput>({
    mutationFn: async ({ sectionKey, content, origin = 'user', note }) => {
      const { data, error } = await supabase.rpc('save_plan_section', {
        p_business_id: requireBusinessId(businessId),
        p_section_key: sectionKey,
        p_content: content as unknown as Json,
        p_origin: origin,
        ...(note ? { p_note: note } : {}),
      });
      if (error) throw toAppError(error);
      return data;
    },
    onSuccess: async () => {
      if (!businessId) return;
      await queryClient.invalidateQueries({ queryKey: planKeys.state(businessId) });
      void queryClient.invalidateQueries({ queryKey: planKeys.versions(businessId) });
    },
  });
}

export interface RegenerateSectionInput {
  sectionKey: PlanSectionKey;
  instruction?: string;
}

/** Asks the AI for a replacement of one section. Returns a proposal; nothing is saved. */
export function useRegenerateSection(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  return useMutation<{ sectionKey: PlanSectionKey; content: PlanSectionContent }, AppError, RegenerateSectionInput>({
    mutationFn: async ({ sectionKey, instruction }) => {
      let response: AiResponse<'plan.regenerateSection'>;
      try {
        const trimmed = instruction?.trim();
        response = await invokeAi({
          action: 'plan.regenerateSection',
          businessId: requireBusinessId(businessId),
          sectionKey,
          locale,
          ...(trimmed ? { instruction: trimmed } : {}),
        });
      } catch (e) {
        throw toAppError(e);
      }
      const content = parseSectionContent(response.content);
      if (!content) throw makeAppError('ai_invalid_output', 'Section proposal failed validation');
      return { sectionKey, content };
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.me.aiUsage() });
    },
  });
}

/** Restores a ready version as a new current version ('restored'). Resolves with the new id. */
export function useRestoreVersion(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<string, AppError, string>({
    mutationFn: async (versionId) => {
      requireBusinessId(businessId);
      const { data, error } = await supabase.rpc('restore_plan_version', { p_version_id: versionId });
      if (error) throw toAppError(error);
      return data;
    },
    onSuccess: async () => {
      if (!businessId) return;
      await queryClient.invalidateQueries({ queryKey: planKeys.state(businessId) });
      void queryClient.invalidateQueries({ queryKey: planKeys.versions(businessId) });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Monthly AI usage (display only — the server enforces quotas)        */
/* ------------------------------------------------------------------ */

export interface UsageInfo {
  limit: number;
  used: number;
  left: number;
}

export interface PlanUsage {
  planGeneration: UsageInfo | null;
  sectionRegeneration: UsageInfo | null;
}

function usageInfo(limit: number, used: number | undefined): UsageInfo | null {
  const left = remainingUses(limit, used);
  return left === null || used === undefined ? null : { limit, used, left };
}

/**
 * Remaining plan generations / section rewrites this month for the signed-in user. Null while
 * unknown (loading, offline without cache) — then show nothing rather than a guess.
 */
export function usePlanUsage(): PlanUsage {
  const entitlement = useEntitlement();
  const usage = useAiUsage();
  if (entitlement.isLoading || !usage.data) return { planGeneration: null, sectionRegeneration: null };
  const pick = (feature: AiFeature) => usageInfo(entitlement.limits.monthlyAiCalls[feature], usage.data?.[feature]);
  return { planGeneration: pick('plan_generation'), sectionRegeneration: pick('section_regeneration') };
}
