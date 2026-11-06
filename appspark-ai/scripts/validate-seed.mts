/**
 * Validates every seed file in src/data/seed.
 *
 * Usage: node --experimental-strip-types --no-warnings scripts/validate-seed.mts
 *
 * Checks: unique ids, slug format, category membership, both locales present
 * and non-empty for every localized field, list lengths, effort ranges, glyph
 * length, and total count >= 60.
 */
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  AUDIENCES,
  BUDGET_TIERS,
  BUSINESS_MODELS,
  CATEGORY_SLUGS,
  DIFFICULTIES,
  IDENTITY_PATTERNS,
  PLATFORMS,
  PROFIT_POTENTIALS,
  type Idea,
  type Localized,
  type LocalizedList,
} from '../src/data/types.ts';

const seedDir = resolve(process.cwd(), 'src/data/seed');
const onlyFiles = process.argv.slice(2).map((f) => f.split('/').pop() as string);
const files = readdirSync(seedDir)
  .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))
  .filter((f) => (onlyFiles.length ? onlyFiles.includes(f) : true));
if (onlyFiles.length && files.length !== onlyFiles.length) {
  console.error('Unknown seed file(s):', onlyFiles.filter((f) => !files.includes(f)).join(', '));
  process.exit(1);
}
const errors: string[] = [];
const ids = new Set<string>();
let total = 0;
const perCategory: Record<string, number> = {};

function isLocalized(value: unknown): value is Localized {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Localized).he === 'string' &&
    typeof (value as Localized).en === 'string'
  );
}

function checkLocalized(path: string, value: unknown, min = 1, max = 2000) {
  if (!isLocalized(value)) {
    errors.push(`${path}: missing he/en`);
    return;
  }
  for (const loc of ['he', 'en'] as const) {
    const text = value[loc].trim();
    if (text.length < min) errors.push(`${path}.${loc}: too short (${text.length})`);
    if (text.length > max) errors.push(`${path}.${loc}: too long (${text.length})`);
  }
  if (!/[֐-׿]/.test(value.he)) errors.push(`${path}.he: contains no Hebrew letters`);
}

function checkList(path: string, value: unknown, minItems: number, maxItems = 12) {
  const list = value as LocalizedList;
  if (!list || !Array.isArray(list.he) || !Array.isArray(list.en)) {
    errors.push(`${path}: missing he/en arrays`);
    return;
  }
  if (list.he.length !== list.en.length) errors.push(`${path}: he/en length mismatch (${list.he.length}/${list.en.length})`);
  if (list.he.length < minItems) errors.push(`${path}: fewer than ${minItems} items`);
  if (list.he.length > maxItems) errors.push(`${path}: more than ${maxItems} items`);
  list.he.forEach((item, i) => {
    if (typeof item !== 'string' || item.trim().length < 2) errors.push(`${path}.he[${i}]: empty`);
    else if (!/[֐-׿]/.test(item)) errors.push(`${path}.he[${i}]: contains no Hebrew letters`);
  });
  list.en.forEach((item, i) => {
    if (typeof item !== 'string' || item.trim().length < 2) errors.push(`${path}.en[${i}]: empty`);
  });
}

for (const file of files) {
  const mod = await import(pathToFileURL(join(seedDir, file)).href);
  const ideas: Idea[] = mod.ideas ?? mod.default;
  if (!Array.isArray(ideas)) {
    errors.push(`${file}: does not export an "ideas" array`);
    continue;
  }
  for (const idea of ideas) {
    total += 1;
    const p = `${file}:${idea.id ?? '?'}`;
    if (!idea.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(idea.id)) errors.push(`${p}: invalid id`);
    if (ids.has(idea.id)) errors.push(`${p}: duplicate id`);
    ids.add(idea.id);
    if (!CATEGORY_SLUGS.includes(idea.category)) errors.push(`${p}: bad category ${idea.category}`);
    perCategory[idea.category] = (perCategory[idea.category] ?? 0) + 1;
    for (const c of idea.secondaryCategories ?? []) if (!CATEGORY_SLUGS.includes(c)) errors.push(`${p}: bad secondary category ${c}`);
    if (!DIFFICULTIES.includes(idea.difficulty)) errors.push(`${p}: bad difficulty`);
    if (!BUDGET_TIERS.includes(idea.budget)) errors.push(`${p}: bad budget`);
    if (!BUSINESS_MODELS.includes(idea.businessModel)) errors.push(`${p}: bad businessModel`);
    if (!idea.platforms?.length || idea.platforms.some((x) => !PLATFORMS.includes(x))) errors.push(`${p}: bad platforms`);
    if (!idea.audience?.length || idea.audience.some((x) => !AUDIENCES.includes(x))) errors.push(`${p}: bad audience`);
    if (!Array.isArray(idea.tags) || idea.tags.length < 3) errors.push(`${p}: need >= 3 tags`);
    if (idea.tags?.some((t) => t !== t.toLowerCase())) errors.push(`${p}: tags must be lowercase`);
    const e = idea.effort;
    if (!e || e.weeksMin < 1 || e.weeksMax < e.weeksMin || e.weeksMax > 52) errors.push(`${p}: bad effort`);
    const idn = idea.identity;
    if (!idn || idn.hue < 0 || idn.hue > 360 || !idn.glyph || idn.glyph.length > 2 || !IDENTITY_PATTERNS.includes(idn.pattern))
      errors.push(`${p}: bad identity`);
    const f = idea.flags;
    if (!f || typeof f.beginnerFriendly !== 'boolean' || !PROFIT_POTENTIALS.includes(f.profitPotential) || typeof f.experimental !== 'boolean' || typeof f.trending !== 'boolean' || !(f.featuredWeight >= 1 && f.featuredWeight <= 5))
      errors.push(`${p}: bad flags`);
    if (f?.beginnerFriendly && idea.difficulty === 'advanced') errors.push(`${p}: beginnerFriendly but advanced`);
    checkLocalized(`${p}.name`, idea.name, 2, 40);
    checkLocalized(`${p}.tagline`, idea.tagline, 20, 160);
    const s = idea.spec;
    if (!s) {
      errors.push(`${p}: missing spec`);
      continue;
    }
    checkLocalized(`${p}.spec.overview`, s.overview, 120, 1200);
    checkLocalized(`${p}.spec.problem`, s.problem, 60, 900);
    checkLocalized(`${p}.spec.solution`, s.solution, 60, 900);
    checkLocalized(`${p}.spec.usp`, s.usp, 40, 600);
    checkLocalized(`${p}.spec.uxDirection`, s.uxDirection, 60, 900);
    checkLocalized(`${p}.spec.architecture`, s.architecture, 60, 1200);
    checkLocalized(`${p}.spec.auth`, s.auth, 20, 600);
    checkList(`${p}.spec.targetUsers`, s.targetUsers, 2, 6);
    checkList(`${p}.spec.coreFeatures`, s.coreFeatures, 4, 10);
    checkList(`${p}.spec.userJourney`, s.userJourney, 4, 10);
    checkList(`${p}.spec.database`, s.database, 3, 12);
    checkList(`${p}.spec.monetization`, s.monetization, 1, 6);
    checkList(`${p}.spec.mvpMilestones`, s.mvpMilestones, 3, 8);
    checkList(`${p}.spec.risks`, s.risks, 2, 6);
    checkList(`${p}.spec.expansion`, s.expansion, 2, 6);
    if (!Array.isArray(s.stack) || s.stack.length < 3) errors.push(`${p}: stack needs >= 3 entries`);
    if (!Array.isArray(s.screens) || s.screens.length < 4 || s.screens.length > 9) errors.push(`${p}: need 4–9 screens`);
    (s.screens ?? []).forEach((scr, i) => {
      checkLocalized(`${p}.spec.screens[${i}].name`, scr.name, 2, 60);
      checkLocalized(`${p}.spec.screens[${i}].description`, scr.description, 20, 400);
    });
  }
}

console.log(`Seed files: ${files.length}, ideas: ${total}`);
console.log('Per category:', JSON.stringify(perCategory));
if (!onlyFiles.length && total < 60) errors.push(`Need at least 60 ideas, found ${total}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const err of errors) console.error(' -', err);
  process.exit(1);
}
console.log('Seed OK');
