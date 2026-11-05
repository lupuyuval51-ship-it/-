/**
 * Pure helpers for the business plan feature (no React, no I/O). Tested in __tests__/logic.test.ts.
 *
 * - provenance counts (how much of a section is the user's input, assumptions, AI estimates…)
 * - section ordering and prev/next navigation (display order = PLAN_SECTION_KEYS)
 * - content diff ("changed" indicators between versions, unsaved-changes detection)
 * - generation state (stale 'generating' rows are treated as failed)
 * - the editable draft model used by the section editor and its validation
 */
import { z } from 'zod';
import {
  BASIS_VALUES,
  BasisSchema,
  PLAN_SECTION_KEYS,
  PlanSectionContentSchema,
  type Basis,
  type PlanBlock,
  type PlanSectionContent,
  type PlanSectionKey,
  type PlanVersionStatus,
} from '@domain/plan';

/* ------------------------------------------------------------------ */
/* Section keys & navigation                                           */
/* ------------------------------------------------------------------ */

const SECTION_KEY_SET: ReadonlySet<string> = new Set(PLAN_SECTION_KEYS);

export function isPlanSectionKey(value: unknown): value is PlanSectionKey {
  return typeof value === 'string' && SECTION_KEY_SET.has(value);
}

/** Sections whose numbers live in the financial model (link to Finance from the reader). */
export const FINANCE_LINKED_SECTIONS: ReadonlySet<PlanSectionKey> = new Set<PlanSectionKey>([
  'startup_costs',
  'operating_expenses',
  'pricing_strategy',
  'revenue_model',
]);

/** Keys present in `sections`, in display order. */
export function orderedSectionKeys(sections: Partial<Record<PlanSectionKey, unknown>>): PlanSectionKey[] {
  return PLAN_SECTION_KEYS.filter((key) => sections[key] !== undefined && sections[key] !== null);
}

export interface SectionNeighbors {
  prev: PlanSectionKey | null;
  next: PlanSectionKey | null;
  /** 1-based position among `available`, 0 when the key is not in it. */
  position: number;
  total: number;
}

/**
 * Previous / next section among `available` (default: all 15 keys), in display order.
 * Keys in `available` that are not plan keys are ignored.
 */
export function sectionNeighbors(key: PlanSectionKey, available: readonly PlanSectionKey[] = PLAN_SECTION_KEYS): SectionNeighbors {
  const ordered = PLAN_SECTION_KEYS.filter((k) => available.includes(k));
  const index = ordered.indexOf(key);
  if (index < 0) return { prev: null, next: null, position: 0, total: ordered.length };
  return {
    prev: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
    position: index + 1,
    total: ordered.length,
  };
}

/* ------------------------------------------------------------------ */
/* Content parsing                                                     */
/* ------------------------------------------------------------------ */

/**
 * Reads `plan_sections.content` (jsonb). The database validates the shape, so this only guards
 * against drift: strict zod parse first, then a lenient structural read (e.g. a URL the DB accepts
 * but zod's URL parser does not). Returns null when the value is not section content at all.
 */
export function parseSectionContent(value: unknown): PlanSectionContent | null {
  const strict = PlanSectionContentSchema.safeParse(value);
  if (strict.success) return strict.data;
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as { summary?: unknown; blocks?: unknown };
  if (!Array.isArray(raw.blocks)) return null;
  const blocks: PlanBlock[] = [];
  raw.blocks.forEach((b: unknown, i) => {
    if (typeof b !== 'object' || b === null) return;
    const block = b as { id?: unknown; text?: unknown; basis?: unknown; source?: unknown };
    if (typeof block.text !== 'string' || block.text.trim() === '') return;
    const basis = BasisSchema.safeParse(block.basis);
    const source =
      typeof block.source === 'object' &&
      block.source !== null &&
      typeof (block.source as { title?: unknown }).title === 'string' &&
      typeof (block.source as { url?: unknown }).url === 'string'
        ? { title: (block.source as { title: string }).title, url: (block.source as { url: string }).url }
        : null;
    const resolvedBasis: Basis = basis.success ? basis.data : 'assumption';
    blocks.push({
      id: typeof block.id === 'string' && block.id !== '' ? block.id : `b${i + 1}`,
      text: block.text.trim(),
      basis: resolvedBasis === 'verified' && !source ? 'assumption' : resolvedBasis,
      source,
    });
  });
  if (blocks.length === 0) return null;
  return { summary: typeof raw.summary === 'string' ? raw.summary.trim() : '', blocks };
}

/* ------------------------------------------------------------------ */
/* Provenance                                                          */
/* ------------------------------------------------------------------ */

export type BasisCounts = Record<Basis, number>;

export function emptyBasisCounts(): BasisCounts {
  return { user_provided: 0, assumption: 0, ai_estimate: 0, verified: 0 };
}

export function countBasis(content: PlanSectionContent | null | undefined): BasisCounts {
  const counts = emptyBasisCounts();
  for (const block of content?.blocks ?? []) counts[block.basis] += 1;
  return counts;
}

/** Sums the provenance of several sections (e.g. the whole plan). */
export function sumBasisCounts(list: readonly BasisCounts[]): BasisCounts {
  const total = emptyBasisCounts();
  for (const counts of list) for (const basis of BASIS_VALUES) total[basis] += counts[basis];
  return total;
}

/**
 * Display order of the provenance mix: what needs the reader's attention first
 * (AI estimates and assumptions to validate), then the user's own input, then verified facts.
 */
export const PROVENANCE_DISPLAY_ORDER: readonly Basis[] = ['ai_estimate', 'assumption', 'user_provided', 'verified'];

/** Non-zero bases in display order, e.g. `[{ basis: 'ai_estimate', count: 3 }, { basis: 'assumption', count: 2 }]`. */
export function provenanceMix(counts: BasisCounts): { basis: Basis; count: number }[] {
  return PROVENANCE_DISPLAY_ORDER.filter((basis) => counts[basis] > 0).map((basis) => ({ basis, count: counts[basis] }));
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * First line / sentence of a text for list previews, cut on a word boundary with an ellipsis.
 */
export function firstLine(text: string, max = 120): string {
  const line = (text.split(/\r?\n/).find((l) => l.trim() !== '') ?? '').trim().replace(/\s+/g, ' ');
  if (line.length <= max) return line;
  const cut = line.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}

/** Preview line for a section row: its summary, or the first block when the summary is empty. */
export function sectionPreview(content: PlanSectionContent | null | undefined, max = 120): string {
  if (!content) return '';
  const source = content.summary.trim() !== '' ? content.summary : (content.blocks[0]?.text ?? '');
  return firstLine(source, max);
}

/* ------------------------------------------------------------------ */
/* Content diff                                                        */
/* ------------------------------------------------------------------ */

function normalizeBlock(block: PlanBlock): string {
  return JSON.stringify([
    block.text.trim(),
    block.basis,
    block.source ? [block.source.title.trim(), block.source.url.trim()] : null,
  ]);
}

export interface SectionDiff {
  changed: boolean;
  summaryChanged: boolean;
  /** Block ids only in `after`. */
  added: string[];
  /** Block ids only in `before`. */
  removed: string[];
  /** Block ids in both whose text, basis or source differ. */
  edited: string[];
  /** True when the shared blocks appear in a different order. */
  reordered: boolean;
}

/** Structural diff of two section contents (whitespace at the edges is ignored). */
export function diffSectionContent(
  before: PlanSectionContent | null | undefined,
  after: PlanSectionContent | null | undefined,
): SectionDiff {
  const beforeBlocks = before?.blocks ?? [];
  const afterBlocks = after?.blocks ?? [];
  const beforeById = new Map(beforeBlocks.map((b) => [b.id, b]));
  const afterById = new Map(afterBlocks.map((b) => [b.id, b]));
  const added = afterBlocks.filter((b) => !beforeById.has(b.id)).map((b) => b.id);
  const removed = beforeBlocks.filter((b) => !afterById.has(b.id)).map((b) => b.id);
  const edited = afterBlocks
    .filter((b) => {
      const prev = beforeById.get(b.id);
      return prev !== undefined && normalizeBlock(prev) !== normalizeBlock(b);
    })
    .map((b) => b.id);
  const sharedBefore = beforeBlocks.filter((b) => afterById.has(b.id)).map((b) => b.id);
  const sharedAfter = afterBlocks.filter((b) => beforeById.has(b.id)).map((b) => b.id);
  const reordered = sharedBefore.some((id, i) => sharedAfter[i] !== id);
  const summaryChanged = (before?.summary ?? '').trim() !== (after?.summary ?? '').trim();
  const presenceChanged = (before == null) !== (after == null);
  return {
    changed: presenceChanged || summaryChanged || added.length > 0 || removed.length > 0 || edited.length > 0 || reordered,
    summaryChanged,
    added,
    removed,
    edited,
    reordered,
  };
}

export function sectionContentEquals(a: PlanSectionContent | null | undefined, b: PlanSectionContent | null | undefined): boolean {
  return !diffSectionContent(a, b).changed;
}

/** Section keys whose content differs between two versions (display order). */
export function changedSectionKeys(
  before: Partial<Record<PlanSectionKey, PlanSectionContent | null>>,
  after: Partial<Record<PlanSectionKey, PlanSectionContent | null>>,
): PlanSectionKey[] {
  return PLAN_SECTION_KEYS.filter((key) => diffSectionContent(before[key], after[key]).changed);
}

/* ------------------------------------------------------------------ */
/* Generation state                                                    */
/* ------------------------------------------------------------------ */

/** A version still 'generating' after this long is considered dead (function crashed / timed out). */
export const STALE_GENERATION_MS = 10 * 60 * 1000;

/** Synthetic error code used in the UI for a stale generation. */
export const STALE_ERROR_CODE = 'stale_generation';

export interface VersionStatusInput {
  status: string;
  created_at: string;
  error_code?: string | null;
}

export function isStaleGeneration(version: VersionStatusInput | null | undefined, now: number = Date.now()): boolean {
  if (!version || version.status !== 'generating') return false;
  const created = Date.parse(version.created_at);
  if (Number.isNaN(created)) return false;
  return now - created > STALE_GENERATION_MS;
}

export interface EffectiveVersionStatus {
  status: PlanVersionStatus;
  /** Server error code, or STALE_ERROR_CODE for a stale generation. */
  errorCode: string | null;
}

/** Status as the UI should treat it: a stale 'generating' version is 'failed'. */
export function effectiveVersionStatus(version: VersionStatusInput, now: number = Date.now()): EffectiveVersionStatus {
  if (isStaleGeneration(version, now)) return { status: 'failed', errorCode: STALE_ERROR_CODE };
  const status: PlanVersionStatus = version.status === 'ready' || version.status === 'failed' ? version.status : 'generating';
  return { status, errorCode: status === 'failed' ? (version.error_code ?? 'internal') : null };
}

/** Milliseconds since the version was created (never negative). */
export function elapsedSince(createdAt: string, now: number = Date.now()): number {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return 0;
  return Math.max(0, now - created);
}

/** "m:ss" (or "h:mm:ss") for an elapsed duration. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export type RelativeTimeKey = 'justNow' | 'minutes' | 'hours' | 'days';

/**
 * Relative time for "updated …" labels. Returns null beyond 7 days (show a date instead).
 */
export function relativeTime(iso: string, now: number = Date.now()): { key: RelativeTimeKey; count: number } | null {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return { key: 'justNow', count: 0 };
  if (minutes < 60) return { key: 'minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: 'hours', count: hours };
  const days = Math.floor(hours / 24);
  if (days <= 7) return { key: 'days', count: days };
  return null;
}

/** Remaining monthly uses, never negative. `null` when the usage is unknown. */
export function remainingUses(limit: number, used: number | null | undefined): number | null {
  if (used === null || used === undefined || !Number.isFinite(used)) return null;
  return Math.max(0, limit - used);
}

/* ------------------------------------------------------------------ */
/* Editable draft                                                      */
/* ------------------------------------------------------------------ */

export interface DraftBlock {
  id: string;
  text: string;
  basis: Basis;
  sourceTitle: string;
  sourceUrl: string;
}

export interface SectionDraft {
  summary: string;
  blocks: DraftBlock[];
}

export const DRAFT_LIMITS = { summaryMax: 600, textMax: 2000, blocksMin: 1, blocksMax: 24, sourceTitleMax: 200, sourceUrlMax: 500 } as const;

export function toDraft(content: PlanSectionContent): SectionDraft {
  return {
    summary: content.summary,
    blocks: content.blocks.map((b) => ({
      id: b.id,
      text: b.text,
      basis: b.basis,
      sourceTitle: b.source?.title ?? '',
      sourceUrl: b.source?.url ?? '',
    })),
  };
}

/** Adds `https://` to a bare domain ("example.gov.il/page"); leaves anything with a scheme as-is. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/** Only absolute http(s) URLs are linked; anything else (javascript:, data:, relative) is not. */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) return null;
  return trimmed;
}

function isHttpUrl(value: string): boolean {
  if (!/^https?:\/\/[^\s/?#]+\.[^\s/?#]+/i.test(value)) return false;
  return z.url().safeParse(value).success;
}

/**
 * Error messages are i18n keys (`plan.edit.errors.*`) so the form can translate them.
 */
export const DraftBlockSchema = z
  .object({
    id: z.string().min(1).max(40),
    text: z.string().trim().min(1, 'plan.edit.errors.textRequired').max(DRAFT_LIMITS.textMax, 'plan.edit.errors.textTooLong'),
    basis: BasisSchema,
    sourceTitle: z.string().trim().max(DRAFT_LIMITS.sourceTitleMax, 'plan.edit.errors.sourceTitleTooLong'),
    sourceUrl: z.string().trim().max(DRAFT_LIMITS.sourceUrlMax, 'plan.edit.errors.sourceUrlTooLong'),
  })
  .superRefine((block, ctx) => {
    if (block.basis !== 'verified') return;
    if (block.sourceTitle.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['sourceTitle'], message: 'plan.edit.errors.sourceTitleRequired' });
    }
    if (!isHttpUrl(normalizeUrl(block.sourceUrl))) {
      ctx.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'plan.edit.errors.sourceUrlInvalid' });
    }
  });

export const SectionDraftSchema = z.object({
  summary: z.string().trim().max(DRAFT_LIMITS.summaryMax, 'plan.edit.errors.summaryTooLong'),
  blocks: z
    .array(DraftBlockSchema)
    .min(DRAFT_LIMITS.blocksMin, 'plan.edit.errors.minBlocks')
    .max(DRAFT_LIMITS.blocksMax, 'plan.edit.errors.maxBlocks'),
});

/**
 * Converts a draft into stored content. A source is kept only for verified blocks (the only
 * basis whose source the editor shows). Throws when the result does not satisfy
 * PlanSectionContentSchema — callers validate with SectionDraftSchema first.
 */
export function fromDraft(draft: SectionDraft): PlanSectionContent {
  const content = {
    summary: draft.summary.trim(),
    blocks: draft.blocks.map((b) => {
      const block: PlanBlock = { id: b.id, text: b.text.trim(), basis: b.basis };
      if (b.basis === 'verified') block.source = { title: b.sourceTitle.trim(), url: normalizeUrl(b.sourceUrl) };
      return block;
    }),
  };
  return PlanSectionContentSchema.parse(content);
}

export type DraftValidation =
  | { ok: true; content: PlanSectionContent }
  | { ok: false; issues: { path: (string | number)[]; message: string }[] };

/** Validates a draft against the editor rules and the stored-content schema. */
export function validateDraft(draft: SectionDraft): DraftValidation {
  const parsed = SectionDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({ path: i.path.filter((p): p is string | number => typeof p !== 'symbol'), message: i.message })),
    };
  }
  const content = PlanSectionContentSchema.safeParse(fromDraftUnchecked(draft));
  if (!content.success) {
    return {
      ok: false,
      issues: content.error.issues.map((i) => ({
        path: i.path.filter((p): p is string | number => typeof p !== 'symbol'),
        message: 'plan.edit.errors.invalid',
      })),
    };
  }
  return { ok: true, content: content.data };
}

function fromDraftUnchecked(draft: SectionDraft): unknown {
  return {
    summary: draft.summary.trim(),
    blocks: draft.blocks.map((b) =>
      b.basis === 'verified'
        ? { id: b.id, text: b.text.trim(), basis: b.basis, source: { title: b.sourceTitle.trim(), url: normalizeUrl(b.sourceUrl) } }
        : { id: b.id, text: b.text.trim(), basis: b.basis },
    ),
  };
}

/** A block id not in `existing` (≤ 40 chars, as the DB requires). */
export function newBlockId(existing: readonly string[], random: () => number = Math.random): string {
  const taken = new Set(existing);
  for (let attempt = 0; attempt < 50; attempt++) {
    const id = `u${Math.floor(random() * 36 ** 8)
      .toString(36)
      .padStart(8, '0')}`;
    if (!taken.has(id)) return id;
  }
  let n = existing.length + 1;
  while (taken.has(`u${n}`)) n += 1;
  return `u${n}`;
}

export function emptyDraftBlock(existingIds: readonly string[], basis: Basis = 'user_provided'): DraftBlock {
  return { id: newBlockId(existingIds), text: '', basis, sourceTitle: '', sourceUrl: '' };
}

/** Returns a copy of `items` with the item at `index` moved one step up (-1) or down (+1). */
export function moveItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return [...items];
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(target, 0, item as T);
  return copy;
}

/** True when the draft differs from the content it was created from. */
export function isDraftDirty(original: PlanSectionContent, draft: SectionDraft): boolean {
  return !sectionContentEquals(original, fromDraftLenient(draft));
}

/** Like fromDraft but never throws (for dirty checks on partially edited drafts). */
export function fromDraftLenient(draft: SectionDraft): PlanSectionContent {
  return {
    summary: draft.summary,
    blocks: draft.blocks.map((b) => ({
      id: b.id,
      text: b.text,
      basis: b.basis,
      source: b.basis === 'verified' || b.sourceTitle !== '' || b.sourceUrl !== '' ? { title: b.sourceTitle, url: b.sourceUrl } : null,
    })),
  };
}
