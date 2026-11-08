/**
 * The AI Director writes episodes in a fixed-topology JSON shape (below), which
 * is converted into the general content model (`Adventure`) and then validated
 * by exactly the same validator as curated content.
 *
 * Fixed topology: stage 1 → choice (A | B) → stage 2 → stage 3 → ending, per path.
 * This makes dangling references impossible and guarantees three stages, a
 * meaningful branch and two endings — the model only has to write well.
 */
import { KINDS, MOOD_OPTIONS, MOTIFS, PALETTE_NAMES, TRAITS } from './constants.ts';
import { stripUnknownTokens } from './template.ts';
import type {
  Adventure,
  Ending,
  Kind,
  Mood,
  Motif,
  PaletteName,
  Prefs,
  StageNode,
  Trait,
  TraitBoost,
} from './types.ts';

export interface AiStage {
  title: string;
  narrative: string;
  action: string;
  alternative: string;
  minutes: number;
  /** "" when the stage has no field note */
  fieldNoteLabel: string;
  fieldNotePlaceholder: string;
  /** "" when not needed */
  crewTip: string;
  /** "" when not needed */
  amplify: string;
}

export interface AiOption {
  label: string;
  description: string;
  trait: Trait;
}

export interface AiEnding {
  title: string;
  twist: string;
  closingLine: string;
  trait: Trait;
}

export interface AiPath {
  option: AiOption;
  stage2: AiStage;
  stage3: AiStage;
  ending: AiEnding;
}

export interface AiEpisode {
  title: string;
  tagline: string;
  intro: string;
  kind: Kind;
  moods: Mood[];
  costMin: number;
  costMax: number;
  items: string[];
  palette: PaletteName;
  motif: Motif;
  stageLabel: string;
  narrator: string;
  primaryTrait: Trait;
  stage1: AiStage;
  choicePrompt: string;
  pathA: AiPath;
  pathB: AiPath;
}

const str = (description: string) => ({ type: 'string', description });
const int = (description: string) => ({ type: 'integer', description });
const traitEnum = (description: string) => ({ type: 'string', enum: [...TRAITS], description });

const STAGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: str('2–5 word stage title'),
    narrative: str('1–3 vivid sentences in the episode voice, ≤ 300 characters'),
    action: str('The specific real-world action, concrete and doable, ≤ 300 characters'),
    alternative: str('A different action achieving the same story beat (e.g. seated, indoors, or no talking to anyone), ≤ 240 characters'),
    minutes: int('Suggested minutes for this stage'),
    fieldNoteLabel: str('Label for an optional one-line field note the user may write, or "" for none'),
    fieldNotePlaceholder: str('Example answer for the field note, or ""'),
    crewTip: str('How to adapt this stage for a group, or "" if solo'),
    amplify: str('An optional bolder flourish for "Main character energy", or ""'),
  },
  required: [
    'title',
    'narrative',
    'action',
    'alternative',
    'minutes',
    'fieldNoteLabel',
    'fieldNotePlaceholder',
    'crewTip',
    'amplify',
  ],
} as const;

const OPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    label: str('2–4 word choice label'),
    description: str('What this path feels like, ≤ 80 characters'),
    trait: traitEnum('The trait this choice exercises'),
  },
  required: ['label', 'description', 'trait'],
} as const;

const ENDING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: str('Ending title, 2–5 words'),
    twist: str('The final twist, connected to a specific earlier detail, ≤ 380 characters'),
    closingLine: str('One memorable closing line for the poster, ≤ 120 characters'),
    trait: traitEnum('The trait this ending rewards'),
  },
  required: ['title', 'twist', 'closingLine', 'trait'],
} as const;

const PATH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    option: OPTION_SCHEMA,
    stage2: STAGE_SCHEMA,
    stage3: STAGE_SCHEMA,
    ending: ENDING_SCHEMA,
  },
  required: ['option', 'stage2', 'stage3', 'ending'],
} as const;

/** JSON schema for structured outputs (no unsupported keywords: no min/max/minLength). */
export const AI_EPISODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: str('Episode title, 2–5 words, often "The …"'),
    tagline: str('Mysterious envelope hint, one sentence, ≤ 110 characters, no spoilers'),
    intro: str('Story introduction, 2–4 sentences, ≤ 420 characters'),
    kind: { type: 'string', enum: [...KINDS], description: 'The kind of experience' },
    moods: { type: 'array', items: { type: 'string', enum: [...MOOD_OPTIONS] }, description: '1–3 moods, strongest first' },
    costMin: int('Minimum expected spend in ILS (0 if free)'),
    costMax: int('Maximum expected spend in ILS (0 if free)'),
    items: { type: 'array', items: { type: 'string' }, description: '0–5 ordinary items needed' },
    palette: { type: 'string', enum: [...PALETTE_NAMES], description: 'Poster color palette' },
    motif: { type: 'string', enum: [...MOTIFS], description: 'Poster geometric motif' },
    stageLabel: str('One-word flavor label for stages, e.g. "Clue", "Scene", "Exhibit"'),
    narrator: str('Who narrates, e.g. "The Archivist"'),
    primaryTrait: traitEnum('The trait this episode mainly builds'),
    stage1: STAGE_SCHEMA,
    choicePrompt: str('The question that frames the fork after stage 1, ≤ 110 characters'),
    pathA: PATH_SCHEMA,
    pathB: PATH_SCHEMA,
  },
  required: [
    'title',
    'tagline',
    'intro',
    'kind',
    'moods',
    'costMin',
    'costMax',
    'items',
    'palette',
    'motif',
    'stageLabel',
    'narrator',
    'primaryTrait',
    'stage1',
    'choicePrompt',
    'pathA',
    'pathB',
  ],
} as const;

// ── runtime shape guard (defense in depth: never trust parsed JSON blindly) ──

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkStage(v: unknown, path: string, errors: string[]) {
  if (!isObj(v)) return void errors.push(`${path} must be an object`);
  for (const k of ['title', 'narrative', 'action', 'alternative', 'fieldNoteLabel', 'fieldNotePlaceholder', 'crewTip', 'amplify']) {
    if (typeof v[k] !== 'string') errors.push(`${path}.${k} must be a string`);
  }
  if (typeof v.minutes !== 'number' || !Number.isFinite(v.minutes)) errors.push(`${path}.minutes must be a number`);
}

export function checkAiEpisodeShape(v: unknown): string[] {
  const errors: string[] = [];
  if (!isObj(v)) return ['episode must be an object'];
  for (const k of ['title', 'tagline', 'intro', 'stageLabel', 'narrator', 'choicePrompt']) {
    if (typeof v[k] !== 'string') errors.push(`${k} must be a string`);
  }
  if (!KINDS.includes(v.kind as Kind)) errors.push('kind is invalid');
  if (!Array.isArray(v.moods) || !v.moods.every((m) => MOOD_OPTIONS.includes(m as Mood))) errors.push('moods are invalid');
  if (typeof v.costMin !== 'number' || typeof v.costMax !== 'number') errors.push('cost must be numbers');
  if (!Array.isArray(v.items) || !v.items.every((i) => typeof i === 'string')) errors.push('items must be strings');
  if (!PALETTE_NAMES.includes(v.palette as PaletteName)) errors.push('palette is invalid');
  if (!MOTIFS.includes(v.motif as Motif)) errors.push('motif is invalid');
  if (!TRAITS.includes(v.primaryTrait as Trait)) errors.push('primaryTrait is invalid');
  checkStage(v.stage1, 'stage1', errors);
  for (const p of ['pathA', 'pathB'] as const) {
    const path = v[p];
    if (!isObj(path)) {
      errors.push(`${p} must be an object`);
      continue;
    }
    const opt = path.option;
    if (!isObj(opt) || typeof opt.label !== 'string' || typeof opt.description !== 'string' || !TRAITS.includes(opt.trait as Trait)) {
      errors.push(`${p}.option is invalid`);
    }
    checkStage(path.stage2, `${p}.stage2`, errors);
    checkStage(path.stage3, `${p}.stage3`, errors);
    const end = path.ending;
    if (!isObj(end) || typeof end.title !== 'string' || typeof end.twist !== 'string' || typeof end.closingLine !== 'string' || !TRAITS.includes(end.trait as Trait)) {
      errors.push(`${p}.ending is invalid`);
    }
  }
  return errors;
}

// ── conversion ───────────────────────────────────────────────────────

const KIND_TRAIT: Record<Kind, Trait> = {
  detective: 'curiosity',
  maker: 'creativity',
  wanderer: 'boldness',
  social: 'connection',
  ritual: 'connection',
  game: 'boldness',
};

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();

function boost(trait: Trait, points: number): TraitBoost {
  const b: TraitBoost = {};
  b[trait] = points;
  return b;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32)
      .replace(/-+$/g, '') || 'episode'
  );
}

/** Small deterministic string hash (FNV-1a, 32-bit) → base36. */
export function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export interface ConvertResult {
  adventure: Adventure;
  /** Deterministic normalizations applied (for logging / transparency). */
  fixes: string[];
}

export interface ConvertOptions {
  /** Allow proportional down-scaling of stage minutes when the plan overshoots by ≤ this factor. Default 0.25 */
  maxMinuteOvershoot?: number;
}

/**
 * Converts the AI shape to the general model and applies safe, deterministic
 * normalizations. The result must still pass `validateAdventure` + `checkPrefsFit`.
 */
export function aiEpisodeToAdventure(ai: AiEpisode, prefs: Prefs, opts: ConvertOptions = {}): ConvertResult {
  const fixes: string[] = [];
  const overshoot = opts.maxMinuteOvershoot ?? 0.25;

  const stageNode = (s: AiStage, id: string, stage: 1 | 2 | 3): StageNode => {
    const node: StageNode = {
      id,
      stage,
      title: tidy(s.title),
      narrative: tidy(s.narrative),
      action: tidy(s.action),
      alternative: tidy(s.alternative),
      minutes: Math.max(1, Math.round(s.minutes)),
    };
    if (tidy(s.fieldNoteLabel)) {
      node.capture = {
        key: `note${stage}`,
        label: tidy(s.fieldNoteLabel),
        placeholder: tidy(s.fieldNotePlaceholder) || 'a few words',
      };
    }
    if (tidy(s.crewTip) && prefs.company === 'group') node.crewTip = tidy(s.crewTip);
    if (tidy(s.amplify)) node.amplify = tidy(s.amplify);
    return node;
  };

  const s1 = stageNode(ai.stage1, 's1', 1);
  const s2a = stageNode(ai.pathA.stage2, 's2-a', 2);
  const s3a = stageNode(ai.pathA.stage3, 's3-a', 3);
  const s2b = stageNode(ai.pathB.stage2, 's2-b', 2);
  const s3b = stageNode(ai.pathB.stage3, 's3-b', 3);
  s1.choice = {
    prompt: tidy(ai.choicePrompt),
    options: [
      { id: 'a', label: tidy(ai.pathA.option.label), description: tidy(ai.pathA.option.description), next: 's2-a', traits: boost(ai.pathA.option.trait, 1) },
      { id: 'b', label: tidy(ai.pathB.option.label), description: tidy(ai.pathB.option.description), next: 's2-b', traits: boost(ai.pathB.option.trait, 1) },
    ],
  };
  s2a.next = 's3-a';
  s3a.next = 'end-a';
  s2b.next = 's3-b';
  s3b.next = 'end-b';

  const ending = (e: AiEnding, id: string): Ending => ({
    id,
    title: tidy(e.title),
    twist: tidy(e.twist),
    closingLine: tidy(e.closingLine),
    traits: boost(e.trait, 1),
  });
  const endA = ending(ai.pathA.ending, 'end-a');
  const endB = ending(ai.pathB.ending, 'end-b');

  // Template tokens may only quote notes captured earlier on the same path.
  const keysBefore = (nodes: StageNode[]) => new Set(nodes.flatMap((n) => (n.capture ? [n.capture.key] : [])));
  const sanitize = (text: string, allowed: Set<string>, where: string) => {
    const out = stripUnknownTokens(text, allowed);
    if (out !== text) fixes.push(`${where}: replaced unavailable note tokens with fallbacks`);
    return out;
  };
  const sanitizeNode = (n: StageNode, allowed: Set<string>) => {
    n.narrative = sanitize(n.narrative, allowed, n.id);
    n.action = sanitize(n.action, allowed, n.id);
    n.alternative = sanitize(n.alternative, allowed, n.id);
    if (n.amplify) n.amplify = sanitize(n.amplify, allowed, n.id);
    if (n.crewTip) n.crewTip = sanitize(n.crewTip, allowed, n.id);
  };
  sanitizeNode(s1, new Set());
  s1.choice.prompt = sanitize(s1.choice.prompt, keysBefore([s1]), 's1.choice');
  sanitizeNode(s2a, keysBefore([s1]));
  sanitizeNode(s3a, keysBefore([s1, s2a]));
  sanitizeNode(s2b, keysBefore([s1]));
  sanitizeNode(s3b, keysBefore([s1, s2b]));
  for (const [end, nodes] of [
    [endA, [s1, s2a, s3a]],
    [endB, [s1, s2b, s3b]],
  ] as const) {
    const allowed = keysBefore([...nodes]);
    end.twist = sanitize(end.twist, allowed, end.id);
    end.closingLine = sanitize(end.closingLine, allowed, end.id);
  }

  // Timing: fit the user's time. Small overshoots are rescaled; large ones fail validation.
  const pathSum = (nodes: StageNode[]) => nodes.reduce((t, n) => t + n.minutes, 0);
  let longest = Math.max(pathSum([s1, s2a, s3a]), pathSum([s1, s2b, s3b]));
  if (longest > prefs.minutes && longest <= prefs.minutes * (1 + overshoot)) {
    const factor = prefs.minutes / longest;
    for (const n of [s1, s2a, s3a, s2b, s3b]) n.minutes = Math.max(1, Math.floor(n.minutes * factor));
    fixes.push(`scaled stage minutes by ${factor.toFixed(2)} to fit ${prefs.minutes} min`);
    longest = Math.max(pathSum([s1, s2a, s3a]), pathSum([s1, s2b, s3b]));
  }
  // Round up to the next 5 minutes, but never past the user's limit when the plan fits it.
  const rounded = Math.max(5, Math.ceil(longest / 5) * 5);
  const minutes = longest <= prefs.minutes ? Math.min(rounded, prefs.minutes) : rounded;

  const costMin = Math.max(0, Math.round(ai.costMin));
  const costMax = Math.max(costMin, Math.round(ai.costMax));
  if (costMax !== Math.round(ai.costMax)) fixes.push('raised costMax to costMin');

  const primary = ai.primaryTrait;
  const secondary = KIND_TRAIT[ai.kind];
  const traits: TraitBoost = boost(primary, 2);
  traits[secondary] = (traits[secondary] ?? 0) + 1;

  const moods = Array.from(new Set(ai.moods)).slice(0, 3);
  if (moods.length === 0) moods.push(prefs.mood);

  const items = ai.items.map(tidy).filter(Boolean).slice(0, 5);

  const title = tidy(ai.title);
  const fingerprint = hashString(JSON.stringify(ai));
  const adventure: Adventure = {
    id: `ai-${slugify(title)}-${fingerprint}`,
    version: 1,
    source: 'ai',
    title,
    tagline: tidy(ai.tagline),
    intro: tidy(ai.intro),
    kind: ai.kind,
    moods,
    weirdness: prefs.weirdness,
    minutes,
    cost: { min: costMin, max: costMax },
    settings: [prefs.setting],
    company: [prefs.company],
    items,
    palette: ai.palette,
    motif: ai.motif,
    traits,
    stageLabel: tidy(ai.stageLabel) || undefined,
    narrator: tidy(ai.narrator) || undefined,
    start: 's1',
    nodes: [s1, s2a, s3a, s2b, s3b],
    endings: [endA, endB],
  };
  if (!adventure.stageLabel) delete adventure.stageLabel;
  if (!adventure.narrator) delete adventure.narrator;
  return { adventure, fixes };
}

// ── inverse conversion (curated → AI shape), used for the few-shot example and tests ──

function topTrait(t: TraitBoost | undefined, fallback: Trait): Trait {
  let best: Trait = fallback;
  let bestPoints = -1;
  for (const trait of TRAITS) {
    const p = t?.[trait] ?? 0;
    if (p > bestPoints) {
      best = trait;
      bestPoints = p;
    }
  }
  return bestPoints > 0 ? best : fallback;
}

/**
 * Converts a canonical-topology adventure (stage 1 choice with two options, each
 * a straight 2 → 3 → ending path) into the AI shape. Returns null otherwise.
 */
export function adventureToAiEpisode(adv: Adventure): AiEpisode | null {
  const byId = new Map(adv.nodes.map((n) => [n.id, n]));
  const endings = new Map(adv.endings.map((e) => [e.id, e]));
  const s1 = byId.get(adv.start);
  if (!s1 || s1.stage !== 1 || !s1.choice || s1.choice.options.length !== 2) return null;

  // Capture keys become note1/note2/note3 by stage.
  const keyMap = new Map<string, string>();
  for (const n of adv.nodes) if (n.capture) keyMap.set(n.capture.key, `note${n.stage}`);
  const rekey = (text: string) =>
    text.replace(/\{\{\s*([a-z0-9][a-z0-9-]*)\s*\|([^{}]*)\}\}/g, (raw, key: string, fallback: string) => {
      const mapped = keyMap.get(key);
      return mapped ? `{{${mapped}|${fallback.trim()}}}` : raw;
    });

  const primary = topTrait(adv.traits, 'curiosity');
  const stage = (n: StageNode): AiStage => ({
    title: n.title,
    narrative: rekey(n.narrative),
    action: rekey(n.action),
    alternative: rekey(n.alternative),
    minutes: n.minutes,
    fieldNoteLabel: n.capture?.label ?? '',
    fieldNotePlaceholder: n.capture?.placeholder ?? '',
    crewTip: n.crewTip ? rekey(n.crewTip) : '',
    amplify: n.amplify ? rekey(n.amplify) : '',
  });

  const paths: AiPath[] = [];
  for (const opt of s1.choice.options) {
    const s2 = byId.get(opt.next);
    const s3 = s2?.next ? byId.get(s2.next) : undefined;
    const end = s3?.next ? endings.get(s3.next) : undefined;
    if (!s2 || !s3 || !end || s2.choice || s3.choice) return null;
    paths.push({
      option: { label: opt.label, description: opt.description, trait: topTrait(opt.traits, primary) },
      stage2: stage(s2),
      stage3: stage(s3),
      ending: { title: end.title, twist: rekey(end.twist), closingLine: rekey(end.closingLine), trait: topTrait(end.traits, primary) },
    });
  }

  return {
    title: adv.title,
    tagline: adv.tagline,
    intro: adv.intro,
    kind: adv.kind,
    moods: [...adv.moods],
    costMin: adv.cost.min,
    costMax: adv.cost.max,
    items: [...adv.items],
    palette: adv.palette,
    motif: adv.motif,
    stageLabel: adv.stageLabel ?? '',
    narrator: adv.narrator ?? '',
    primaryTrait: primary,
    stage1: stage(s1),
    choicePrompt: rekey(s1.choice.prompt),
    pathA: paths[0],
    pathB: paths[1],
  };
}
