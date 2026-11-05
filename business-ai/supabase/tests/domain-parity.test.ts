/// <reference types="node" />
/**
 * Asserts that every value list hard-coded in the SQL migrations (CHECK constraints,
 * RPC validation, ai_usage_summary) matches the TypeScript domain constants, and that
 * public.tier_limits() mirrors TIER_LIMITS. Runs under jest (`npm test`); the SQL side
 * is exercised by the pgTAP suite in this directory (`npm run test:db`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LocaleSchema } from '@domain/ai-api';
import { AI_FEATURES, TIER_LIMITS, TIERS } from '@domain/entitlements';
import { MARKETING_KINDS } from '@domain/marketing';
import { ONBOARDING_KEYS } from '@domain/onboarding';
import {
  BASIS_VALUES,
  PLAN_SECTION_KEYS,
  PLAN_VERSION_ORIGINS,
  PLAN_VERSION_STATUSES,
  ROADMAP_PHASES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@domain/plan';

const migrationsDir = join(__dirname, '..', 'migrations');

/** All migrations concatenated in apply order, with `--` comments removed. */
const sql = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(migrationsDir, f), 'utf8'))
  .join('\n')
  .split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n');

function parseQuotedList(body: string): string[] {
  return [...body.matchAll(/'([^']*)'/g)].map((m) => m[1] ?? '');
}

/** Every `( 'a', 'b', ... )` or `array[ 'a', 'b', ... ]` list of string literals. */
const stringLists: string[][] = [
  ...sql.matchAll(/\(\s*('[^']*'(?:\s*,\s*'[^']*')*)\s*\)/g),
  ...sql.matchAll(/array\[\s*('[^']*'(?:\s*,\s*'[^']*')*)\s*\]/gi),
].map((m) => parseQuotedList(m[1] ?? ''));

/** CHECK constraints of the form `constraint <name> check (<col> in (...))`. */
const checkConstraints = new Map<string, string[]>(
  [...sql.matchAll(/constraint\s+(\w+)\s+check\s*\(\s*\w+\s+in\s*\(([^)]*)\)\s*\)/gi)].map((m) => [
    m[1] ?? '',
    parseQuotedList(m[2] ?? ''),
  ]),
);

function checkValues(name: string): string[] {
  const values = checkConstraints.get(name);
  if (!values) throw new Error(`CHECK constraint ${name} not found in migrations`);
  return values;
}

describe('SQL CHECK constraints mirror the domain constants', () => {
  const cases: [constraint: string, expected: readonly string[]][] = [
    ['plan_sections_section_key_check', PLAN_SECTION_KEYS],
    ['onboarding_responses_question_key_check', ONBOARDING_KEYS],
    ['startup_costs_basis_check', BASIS_VALUES],
    ['recurring_expenses_basis_check', BASIS_VALUES],
    ['revenue_streams_basis_check', BASIS_VALUES],
    ['marketing_assets_kind_check', MARKETING_KINDS],
    ['ai_usage_records_feature_check', AI_FEATURES],
    ['roadmap_phases_phase_check', ROADMAP_PHASES],
    ['milestones_phase_check', ROADMAP_PHASES],
    ['tasks_phase_check', ROADMAP_PHASES],
    ['tasks_priority_check', TASK_PRIORITIES],
    ['tasks_status_check', TASK_STATUSES],
    ['plan_versions_origin_check', PLAN_VERSION_ORIGINS],
    ['plan_versions_status_check', PLAN_VERSION_STATUSES],
    ['subscription_entitlements_tier_check', TIERS],
    ['profiles_locale_check', LocaleSchema.options],
  ];

  it.each(cases)('%s', (constraint, expected) => {
    expect(checkValues(constraint)).toEqual([...expected]);
  });
});

describe('every SQL value list that names a domain value lists the whole domain', () => {
  // A distinctive member identifies lists that must equal the constant exactly
  // (catches RPC validation lists and arrays inside function bodies too).
  const cases: [name: string, marker: string, expected: readonly string[]][] = [
    ['PLAN_SECTION_KEYS', 'executive_summary', PLAN_SECTION_KEYS],
    ['ONBOARDING_KEYS', 'business_idea', ONBOARDING_KEYS],
    ['BASIS_VALUES', 'user_provided', BASIS_VALUES],
    ['MARKETING_KINDS', 'positioning', MARKETING_KINDS],
    ['AI_FEATURES', 'plan_generation', AI_FEATURES],
    ['ROADMAP_PHASES', 'days_30', ROADMAP_PHASES],
    ['TASK_PRIORITIES', 'medium', TASK_PRIORITIES],
    ['TASK_STATUSES', 'in_progress', TASK_STATUSES],
    ['PLAN_VERSION_ORIGINS', 'ai_generated', PLAN_VERSION_ORIGINS],
    ['PLAN_VERSION_STATUSES', 'generating', PLAN_VERSION_STATUSES],
  ];

  it.each(cases)('%s', (_name, marker, expected) => {
    const lists = stringLists.filter((list) => list.includes(marker));
    expect(lists.length).toBeGreaterThan(0);
    for (const list of lists) {
      expect(list).toEqual([...expected]);
    }
  });
});

describe('public.tier_limits mirrors TIER_LIMITS', () => {
  const fn = /function public\.tier_limits\([\s\S]*?\$\$([\s\S]*?)\$\$/.exec(sql)?.[1] ?? '';
  const rows = new Map(
    [...fn.matchAll(/\(\s*'(\w+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)].map((m) => [
      m[1] ?? '',
      { maxBusinesses: Number(m[2]), maxForecastMonths: Number(m[3]) },
    ]),
  );

  it('defines a row for every tier', () => {
    expect([...rows.keys()].sort()).toEqual([...TIERS].sort());
  });

  it.each(TIERS.map((tier) => [tier] as const))('%s limits match', (tier) => {
    expect(rows.get(tier)).toEqual({
      maxBusinesses: TIER_LIMITS[tier].maxBusinesses,
      maxForecastMonths: TIER_LIMITS[tier].maxForecastMonths,
    });
  });

  it('caps forecast_months at the largest tier horizon', () => {
    const maxHorizon = Math.max(...TIERS.map((t) => TIER_LIMITS[t].maxForecastMonths));
    expect(sql).toMatch(new RegExp(`check \\(forecast_months between 1 and ${maxHorizon}\\)`));
  });
});
