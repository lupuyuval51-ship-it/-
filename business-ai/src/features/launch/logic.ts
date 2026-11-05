/**
 * Launch Center pure logic: row parsing, template seeding, localized display, grouping and
 * progress. No React, no Supabase.
 */
import type { Locale } from '@/i18n/types';
import type { InsertRow, Row } from '@/lib/database';
import {
  LAUNCH_CATEGORIES,
  LAUNCH_STATUSES,
  LAUNCH_TEMPLATE_BY_KEY,
  isLaunchCategory,
  isLaunchStatus,
  templatesForCountry,
  type LaunchCategory,
  type LaunchStatus,
  type LaunchTemplateItem,
  type Localized,
} from './templates';

export interface LaunchItem {
  id: string;
  business_id: string;
  template_key: string | null;
  category: LaunchCategory;
  title: string;
  description: string;
  source_name: string | null;
  source_url: string | null;
  status: LaunchStatus;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Narrows a DB row (CHECK-constrained text columns arrive as `string`). */
export function parseLaunchItem(row: Row<'launch_checklist_items'>): LaunchItem {
  return {
    ...row,
    category: isLaunchCategory(row.category) ? row.category : 'other',
    status: isLaunchStatus(row.status) ? row.status : 'todo',
  };
}

const CATEGORY_RANK: ReadonlyMap<LaunchCategory, number> = new Map(LAUNCH_CATEGORIES.map((c, i) => [c, i]));

export function compareLaunchItems(a: LaunchItem, b: LaunchItem): number {
  const byCategory = (CATEGORY_RANK.get(a.category) ?? 99) - (CATEGORY_RANK.get(b.category) ?? 99);
  if (byCategory !== 0) return byCategory;
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.created_at.localeCompare(b.created_at);
}

/* ------------------------------------------------------------------ */
/* Seeding                                                             */
/* ------------------------------------------------------------------ */

/** Sort order of template items: their position in the country's list (custom items go after). */
export const CUSTOM_SORT_BASE = 1000;

/**
 * Rows to upsert for a country's templates (stored in the current language; `displayLaunchItem`
 * re-localizes unedited template text when the language changes). Idempotent together with
 * `upsert(..., { onConflict: 'business_id,template_key', ignoreDuplicates: true })`.
 */
export function buildSeedRows(businessId: string, countryCode: string, locale: Locale): InsertRow<'launch_checklist_items'>[] {
  return templatesForCountry(countryCode).map((t, index) => ({
    business_id: businessId,
    template_key: t.key,
    category: t.category,
    title: t.title[locale],
    description: t.description[locale],
    source_name: t.sourceName[locale],
    source_url: t.sourceUrl,
    status: 'todo',
    sort_order: index,
  }));
}

/** Templates of the country that are not in the checklist yet. */
export function missingTemplates(items: readonly LaunchItem[], countryCode: string | null | undefined): LaunchTemplateItem[] {
  const present = new Set(items.map((i) => i.template_key).filter((k): k is string => k !== null));
  return templatesForCountry(countryCode).filter((t) => !present.has(t.key));
}

/* ------------------------------------------------------------------ */
/* Display                                                             */
/* ------------------------------------------------------------------ */

function relocalize(stored: string, text: Localized, locale: Locale): string {
  return stored === text.he || stored === text.en ? text[locale] : stored;
}

export interface LaunchItemDisplay {
  title: string;
  description: string;
  sourceName: string | null;
  sourceUrl: string | null;
  /** The template the item came from (for its review date), when it still exists. */
  template: LaunchTemplateItem | null;
}

/**
 * Text to show for an item. Template items whose text the user has not changed are shown in the
 * current language; anything the user edited is shown exactly as written.
 */
export function displayLaunchItem(item: LaunchItem, locale: Locale): LaunchItemDisplay {
  const template = item.template_key ? (LAUNCH_TEMPLATE_BY_KEY.get(item.template_key) ?? null) : null;
  if (!template) {
    return { title: item.title, description: item.description, sourceName: item.source_name, sourceUrl: item.source_url, template: null };
  }
  return {
    title: relocalize(item.title, template.title, locale),
    description: relocalize(item.description, template.description, locale),
    sourceName: item.source_name === null ? null : relocalize(item.source_name, template.sourceName, locale),
    sourceUrl: item.source_url,
    template,
  };
}

/* ------------------------------------------------------------------ */
/* Grouping & progress                                                 */
/* ------------------------------------------------------------------ */

export interface LaunchGroup {
  category: LaunchCategory;
  items: LaunchItem[];
}

/** Non-empty categories in canonical order, items sorted within each. */
export function groupLaunchItems(items: readonly LaunchItem[]): LaunchGroup[] {
  const sorted = [...items].sort(compareLaunchItems);
  const groups: LaunchGroup[] = [];
  for (const category of LAUNCH_CATEGORIES) {
    const inCategory = sorted.filter((i) => i.category === category);
    if (inCategory.length > 0) groups.push({ category, items: inCategory });
  }
  return groups;
}

export interface LaunchProgress {
  /** Items marked done. */
  done: number;
  /** Items that count toward progress (everything except "not applicable"). */
  applicable: number;
  notApplicable: number;
  total: number;
  /** done / applicable, 0 when nothing applies. */
  ratio: number;
}

export function computeLaunchProgress(items: readonly LaunchItem[]): LaunchProgress {
  const total = items.length;
  const done = items.filter((i) => i.status === 'done').length;
  const notApplicable = items.filter((i) => i.status === 'not_applicable').length;
  const applicable = total - notApplicable;
  return { done, applicable, notApplicable, total, ratio: applicable > 0 ? done / applicable : 0 };
}

/** Next status when the row's status control is tapped: todo → done → not applicable → todo. */
export function nextLaunchStatus(status: LaunchStatus): LaunchStatus {
  const index = LAUNCH_STATUSES.indexOf(status);
  return LAUNCH_STATUSES[(index + 1) % LAUNCH_STATUSES.length] ?? 'todo';
}

/** Sort order for a new custom item: after everything else in its category. */
export function nextCustomSortOrder(items: readonly LaunchItem[], category: LaunchCategory): number {
  const orders = items.filter((i) => i.category === category).map((i) => i.sort_order);
  return Math.max(CUSTOM_SORT_BASE - 1, ...orders) + 1;
}
