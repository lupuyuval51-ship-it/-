import {
  COMPANY_OPTIONS,
  KINDS,
  MAX_ITEMS,
  MOOD_OPTIONS,
  MOTIFS,
  PALETTE_NAMES,
  SETTING_OPTIONS,
  TEXT_LIMITS,
  TRAITS,
  WEIRDNESS_OPTIONS,
} from './constants.ts';
import { captureKeys, enumeratePaths, indexAdventure, pathMinutes, successors } from './graph.ts';
import { malformedTokens, parseTokens } from './template.ts';
import type { Adventure, Prefs, StageNode } from './types.ts';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

type Limit = { soft: number; hard: number };
type Obj = Record<string, unknown>;

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const CAPTURE_KEY = /^[a-z0-9][a-z0-9-]{0,31}$/;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

class Checker {
  errors: string[] = [];
  warnings: string[] = [];

  err(path: string, msg: string) {
    this.errors.push(`${path}: ${msg}`);
  }
  warn(path: string, msg: string) {
    this.warnings.push(`${path}: ${msg}`);
  }

  text(o: Obj, key: string, path: string, limit: Limit, opts: { optional?: boolean; tokens?: boolean } = {}): string | undefined {
    const v = o[key];
    const p = `${path}.${key}`;
    if (v === undefined || v === null || v === '') {
      if (!opts.optional) this.err(p, 'is required');
      return undefined;
    }
    if (typeof v !== 'string') {
      this.err(p, 'must be a string');
      return undefined;
    }
    const trimmed = v.trim();
    if (trimmed.length === 0) {
      if (!opts.optional) this.err(p, 'must not be blank');
      return undefined;
    }
    if (trimmed !== v) this.warn(p, 'has leading/trailing whitespace');
    if (trimmed.length > limit.hard) this.err(p, `is ${trimmed.length} chars (max ${limit.hard})`);
    else if (trimmed.length > limit.soft) this.warn(p, `is ${trimmed.length} chars (aim for ≤ ${limit.soft})`);
    if (opts.tokens) {
      for (const bad of malformedTokens(trimmed)) this.err(p, `malformed template token ${JSON.stringify(bad)}`);
    } else if (trimmed.includes('{{') || trimmed.includes('}}')) {
      this.err(p, 'template tokens are not allowed here');
    }
    return trimmed;
  }

  int(o: Obj, key: string, path: string, min: number, max: number): number | undefined {
    const v = o[key];
    const p = `${path}.${key}`;
    if (typeof v !== 'number' || !Number.isInteger(v)) {
      this.err(p, 'must be an integer');
      return undefined;
    }
    if (v < min || v > max) this.err(p, `must be between ${min} and ${max} (got ${v})`);
    return v;
  }

  oneOf<T>(o: Obj, key: string, path: string, allowed: readonly T[]): T | undefined {
    const v = o[key] as T;
    if (!allowed.includes(v)) {
      this.err(`${path}.${key}`, `must be one of ${allowed.join(', ')} (got ${JSON.stringify(o[key])})`);
      return undefined;
    }
    return v;
  }

  setOf<T>(o: Obj, key: string, path: string, allowed: readonly T[], min: number, max: number): T[] {
    const v = o[key];
    const p = `${path}.${key}`;
    if (!Array.isArray(v)) {
      this.err(p, 'must be an array');
      return [];
    }
    if (v.length < min || v.length > max) this.err(p, `must have ${min}–${max} entries (got ${v.length})`);
    const out: T[] = [];
    for (const item of v) {
      if (!allowed.includes(item as T)) this.err(p, `unknown value ${JSON.stringify(item)}`);
      else if (out.includes(item as T)) this.err(p, `duplicate value ${JSON.stringify(item)}`);
      else out.push(item as T);
    }
    return out;
  }

  traits(o: Obj, key: string, path: string, required: boolean) {
    const v = o[key];
    const p = `${path}.${key}`;
    if (v === undefined) {
      if (required) this.err(p, 'is required');
      return;
    }
    if (!isObj(v)) {
      this.err(p, 'must be an object');
      return;
    }
    let total = 0;
    for (const [k, val] of Object.entries(v)) {
      if (!(TRAITS as readonly string[]).includes(k)) this.err(p, `unknown trait ${JSON.stringify(k)}`);
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 5) this.err(`${p}.${k}`, 'must be an integer 0–5');
      else total += val;
    }
    if (required && total === 0) this.err(p, 'must award at least one trait point');
  }
}

/**
 * Validates an adventure against the content model: shape, enums, text limits,
 * three-stage branching structure, endings, alternatives, timing and template tokens.
 * Accepts `unknown` so it can guard AI output and persisted data as well as curated content.
 */
export function validateAdventure(input: unknown): ValidationResult {
  const c = new Checker();
  if (!isObj(input)) {
    c.err('adventure', 'must be an object');
    return { ok: false, errors: c.errors, warnings: c.warnings };
  }
  const a = input;
  const P = 'adventure';

  // ── identity & metadata ─────────────────────────────────────────────
  const id = a.id;
  if (typeof id !== 'string' || !ID.test(id)) c.err(`${P}.id`, 'must be a lowercase slug (a-z, 0-9, -)');
  c.int(a, 'version', P, 1, 999);
  c.oneOf(a, 'source', P, ['curated', 'ai'] as const);
  c.text(a, 'title', P, TEXT_LIMITS.title);
  c.text(a, 'tagline', P, TEXT_LIMITS.tagline);
  const intro = c.text(a, 'intro', P, TEXT_LIMITS.intro);
  if (intro && intro.length < 80) c.warn(`${P}.intro`, 'is very short — set the scene a little more');
  c.oneOf(a, 'kind', P, KINDS);
  c.setOf(a, 'moods', P, MOOD_OPTIONS, 1, 3);
  c.oneOf(a, 'weirdness', P, WEIRDNESS_OPTIONS);
  const minutes = c.int(a, 'minutes', P, 5, 120);
  c.setOf(a, 'settings', P, SETTING_OPTIONS, 1, 2);
  c.setOf(a, 'company', P, COMPANY_OPTIONS, 1, 2);
  c.oneOf(a, 'palette', P, PALETTE_NAMES);
  c.oneOf(a, 'motif', P, MOTIFS);
  c.traits(a, 'traits', P, true);
  c.text(a, 'stageLabel', P, TEXT_LIMITS.stageLabel, { optional: true });
  c.text(a, 'narrator', P, TEXT_LIMITS.narrator, { optional: true });

  // cost
  if (!isObj(a.cost)) c.err(`${P}.cost`, 'must be an object {min, max}');
  else {
    const min = c.int(a.cost, 'min', `${P}.cost`, 0, 100);
    const max = c.int(a.cost, 'max', `${P}.cost`, 0, 100);
    if (min !== undefined && max !== undefined && min > max) c.err(`${P}.cost`, 'min must be ≤ max');
  }

  // items
  if (!Array.isArray(a.items)) c.err(`${P}.items`, 'must be an array (use [] for none)');
  else {
    if (a.items.length > MAX_ITEMS) c.err(`${P}.items`, `has ${a.items.length} items (max ${MAX_ITEMS})`);
    a.items.forEach((item, i) => {
      if (typeof item !== 'string' || item.trim().length === 0) c.err(`${P}.items[${i}]`, 'must be a non-empty string');
      else if (item.trim().length > TEXT_LIMITS.item.hard) c.err(`${P}.items[${i}]`, `is too long (max ${TEXT_LIMITS.item.hard})`);
    });
  }

  // ── nodes & endings: shape ──────────────────────────────────────────
  if (!Array.isArray(a.nodes) || a.nodes.length === 0) c.err(`${P}.nodes`, 'must be a non-empty array');
  if (!Array.isArray(a.endings) || a.endings.length === 0) c.err(`${P}.endings`, 'must be a non-empty array');
  if (c.errors.length > 0 && (!Array.isArray(a.nodes) || !Array.isArray(a.endings))) {
    return { ok: false, errors: c.errors, warnings: c.warnings };
  }

  const ids = new Set<string>();
  const claimId = (value: unknown, path: string) => {
    if (typeof value !== 'string' || !ID.test(value)) {
      c.err(path, 'must be a lowercase slug (a-z, 0-9, -)');
      return;
    }
    if (ids.has(value)) c.err(path, `duplicate id ${JSON.stringify(value)}`);
    ids.add(value);
  };

  (a.nodes as unknown[]).forEach((raw, i) => {
    const p = `${P}.nodes[${i}]`;
    if (!isObj(raw)) {
      c.err(p, 'must be an object');
      return;
    }
    claimId(raw.id, `${p}.id`);
    const label = typeof raw.id === 'string' ? `${P}.node(${raw.id})` : p;
    c.oneOf(raw, 'stage', label, [1, 2, 3] as const);
    c.text(raw, 'title', label, TEXT_LIMITS.stageTitle);
    c.text(raw, 'narrative', label, TEXT_LIMITS.narrative, { tokens: true });
    const action = c.text(raw, 'action', label, TEXT_LIMITS.action, { tokens: true });
    const alternative = c.text(raw, 'alternative', label, TEXT_LIMITS.alternative, { tokens: true });
    if (action && alternative && action.toLowerCase() === alternative.toLowerCase()) {
      c.err(`${label}.alternative`, 'must differ from the action');
    }
    c.int(raw, 'minutes', label, 1, 90);
    c.text(raw, 'crewTip', label, TEXT_LIMITS.crewTip, { optional: true, tokens: true });
    c.text(raw, 'amplify', label, TEXT_LIMITS.amplify, { optional: true, tokens: true });

    if (raw.capture !== undefined) {
      if (!isObj(raw.capture)) c.err(`${label}.capture`, 'must be an object');
      else {
        const key = raw.capture.key;
        if (typeof key !== 'string' || !CAPTURE_KEY.test(key)) c.err(`${label}.capture.key`, 'must be a lowercase slug');
        c.text(raw.capture, 'label', `${label}.capture`, TEXT_LIMITS.captureLabel);
        c.text(raw.capture, 'placeholder', `${label}.capture`, TEXT_LIMITS.capturePlaceholder);
      }
    }

    const hasChoice = raw.choice !== undefined;
    const hasNext = raw.next !== undefined;
    if (hasChoice === hasNext) c.err(label, 'needs exactly one of `choice` or `next`');
    if (hasNext && (typeof raw.next !== 'string' || raw.next.length === 0)) c.err(`${label}.next`, 'must be an id');
    if (hasChoice) {
      if (!isObj(raw.choice)) c.err(`${label}.choice`, 'must be an object');
      else {
        c.text(raw.choice, 'prompt', `${label}.choice`, TEXT_LIMITS.choicePrompt, { tokens: true });
        const options = raw.choice.options;
        if (!Array.isArray(options) || options.length < 2 || options.length > 3) {
          c.err(`${label}.choice.options`, 'must have 2 or 3 options');
        } else {
          const optIds = new Set<string>();
          const targets = new Set<string>();
          options.forEach((opt, j) => {
            const op = `${label}.choice.options[${j}]`;
            if (!isObj(opt)) {
              c.err(op, 'must be an object');
              return;
            }
            if (typeof opt.id !== 'string' || !ID.test(opt.id)) c.err(`${op}.id`, 'must be a slug');
            else if (optIds.has(opt.id)) c.err(`${op}.id`, 'duplicate option id');
            else optIds.add(opt.id);
            c.text(opt, 'label', op, TEXT_LIMITS.optionLabel);
            c.text(opt, 'description', op, TEXT_LIMITS.optionDescription);
            if (typeof opt.next !== 'string') c.err(`${op}.next`, 'must be an id');
            else if (targets.has(opt.next)) c.err(`${op}.next`, 'two options lead to the same place — the choice must matter');
            else targets.add(opt.next);
            c.traits(opt, 'traits', op, false);
          });
        }
      }
    }
  });

  (a.endings as unknown[]).forEach((raw, i) => {
    const p = `${P}.endings[${i}]`;
    if (!isObj(raw)) {
      c.err(p, 'must be an object');
      return;
    }
    claimId(raw.id, `${p}.id`);
    const label = typeof raw.id === 'string' ? `${P}.ending(${raw.id})` : p;
    c.text(raw, 'title', label, TEXT_LIMITS.endingTitle);
    c.text(raw, 'twist', label, TEXT_LIMITS.twist, { tokens: true });
    c.text(raw, 'closingLine', label, TEXT_LIMITS.closingLine, { tokens: true });
    c.traits(raw, 'traits', label, false);
  });

  if (c.errors.length > 0) return { ok: false, errors: c.errors, warnings: c.warnings };

  // ── structure ───────────────────────────────────────────────────────
  const adv = input as unknown as Adventure;
  const idx = indexAdventure(adv);
  const start = idx.nodes.get(adv.start);
  if (!start) c.err(`${P}.start`, `unknown node ${JSON.stringify(adv.start)}`);
  else if (start.stage !== 1) c.err(`${P}.start`, 'must point at a stage-1 node');

  for (const node of adv.nodes) {
    for (const target of successors(node)) {
      const child = idx.nodes.get(target);
      const ending = idx.endings.get(target);
      if (!child && !ending) {
        c.err(`${P}.node(${node.id})`, `leads to unknown id ${JSON.stringify(target)}`);
        continue;
      }
      if (child && child.stage !== node.stage + 1) {
        c.err(`${P}.node(${node.id})`, `stage ${node.stage} must lead to a stage ${node.stage + 1} node (got stage ${child.stage})`);
      }
      if (ending && node.stage !== 3) {
        c.err(`${P}.node(${node.id})`, 'only stage-3 nodes may lead to an ending');
      }
    }
  }
  if (c.errors.length > 0) return { ok: false, errors: c.errors, warnings: c.warnings };

  const paths = enumeratePaths(adv);
  const reachedNodes = new Set<string>();
  const reachedEndings = new Set<string>();
  for (const path of paths) {
    path.nodes.forEach((n) => reachedNodes.add(n.id));
    reachedEndings.add(path.ending.id);
  }
  for (const n of adv.nodes) if (!reachedNodes.has(n.id)) c.err(`${P}.node(${n.id})`, 'is unreachable from start');
  for (const e of adv.endings) if (!reachedEndings.has(e.id)) c.err(`${P}.ending(${e.id})`, 'is unreachable');
  if (reachedEndings.size < 2) c.err(`${P}.endings`, 'needs at least two reachable endings');
  if (!adv.nodes.some((n) => n.choice)) c.err(`${P}.nodes`, 'needs at least one branching choice');

  // Every path must be exactly three stages long, and its capture keys must not collide.
  for (const path of paths) {
    const stages = path.nodes.map((n) => n.stage).join('→');
    if (stages !== '1→2→3') c.err(`${P}.paths`, `path to ${path.ending.id} visits stages ${stages} (must be 1→2→3)`);
    const keys = path.nodes.flatMap((n) => (n.capture ? [n.capture.key] : []));
    if (new Set(keys).size !== keys.length) c.err(`${P}.paths`, `path to ${path.ending.id} reuses a capture key (${keys.join(', ')})`);
  }

  // A choice must change later content: its branches may not reconverge immediately.
  for (const node of adv.nodes) {
    if (!node.choice) continue;
    const branchContent = node.choice.options.map((o) => {
      const child = idx.nodes.get(o.next);
      return child ? `${child.narrative}|${child.action}` : o.next;
    });
    if (new Set(branchContent).size !== branchContent.length) {
      c.err(`${P}.node(${node.id}).choice`, 'branches lead to identical content');
    }
  }

  // Timing: every path must fit the stated duration.
  if (minutes !== undefined) {
    for (const path of paths) {
      const total = pathMinutes(path);
      if (total > minutes) c.err(`${P}.minutes`, `path to ${path.ending.id} needs ${total} min but the episode says ${minutes}`);
      else if (total < minutes * 0.6) c.warn(`${P}.minutes`, `path to ${path.ending.id} only fills ${total} of ${minutes} min`);
    }
  }

  // Template tokens must reference capture keys that exist on the path that reaches them.
  const allKeys = captureKeys(adv);
  const keysOnPathTo = (path: { nodes: StageNode[] }, upTo: number) =>
    new Set(path.nodes.slice(0, upTo).flatMap((n) => (n.capture ? [n.capture.key] : [])));
  const checkTokens = (text: string | undefined, where: string, available: Set<string>) => {
    if (!text) return;
    for (const t of parseTokens(text)) {
      if (!allKeys.has(t.key)) c.err(where, `token {{${t.key}|…}} references an unknown capture key`);
      else if (!available.has(t.key)) c.warn(where, `token {{${t.key}|…}} may be shown before that note exists (fallback will be used)`);
    }
  };
  for (const path of paths) {
    path.nodes.forEach((n, i) => {
      // Within a stage, only notes captured in *earlier* stages can be quoted.
      const available = keysOnPathTo(path, i);
      const where = `${P}.node(${n.id})`;
      checkTokens(n.narrative, where, available);
      checkTokens(n.action, where, available);
      checkTokens(n.alternative, where, available);
      checkTokens(n.amplify, where, available);
      checkTokens(n.crewTip, where, available);
      if (n.choice) checkTokens(n.choice.prompt, where, keysOnPathTo(path, i + 1));
    });
    const all = keysOnPathTo(path, path.nodes.length);
    checkTokens(path.ending.twist, `${P}.ending(${path.ending.id})`, all);
    checkTokens(path.ending.closingLine, `${P}.ending(${path.ending.id})`, all);
  }

  if (!adv.nodes.some((n) => n.capture)) c.warn(`${P}.nodes`, 'no field notes — the finale and poster cannot quote the user');
  for (const e of adv.endings) {
    if (!/plot twist|twist/i.test(e.twist) && e.twist.length < 60) c.warn(`${P}.ending(${e.id}).twist`, 'feels thin — the twist should land');
  }

  return { ok: c.errors.length === 0, errors: c.errors, warnings: c.warnings };
}

/** Returns human-readable violations of the user's hard constraints (time, budget, setting, company). */
export function checkPrefsFit(adv: Adventure, prefs: Prefs): string[] {
  const issues: string[] = [];
  if (adv.minutes > prefs.minutes) issues.push(`needs ${adv.minutes} min but only ${prefs.minutes} are available`);
  if (adv.cost.max > prefs.budget) issues.push(`may cost up to ₪${adv.cost.max} but the budget is ₪${prefs.budget}`);
  if (!adv.settings.includes(prefs.setting)) issues.push(`is not designed for ${prefs.setting === 'home' ? 'home' : 'outside'}`);
  if (!adv.company.includes(prefs.company)) issues.push(`is not designed for ${prefs.company === 'solo' ? 'solo play' : 'groups'}`);
  return issues;
}

export function fitsPrefs(adv: Adventure, prefs: Prefs): boolean {
  return checkPrefsFit(adv, prefs).length === 0;
}

/** Throws with a readable report when invalid. Handy for curated content and tests. */
export function assertValidAdventure(input: unknown): asserts input is Adventure {
  const r = validateAdventure(input);
  if (!r.ok) {
    const id = isObj(input) && typeof input.id === 'string' ? input.id : '(unknown)';
    throw new Error(`Invalid adventure ${id}:\n  - ${r.errors.join('\n  - ')}`);
  }
}
