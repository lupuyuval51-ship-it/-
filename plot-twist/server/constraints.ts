/**
 * Heuristic checks that an AI episode keeps the user's hard constraints in its
 * TEXT, not just in its metadata. `aiEpisodeToAdventure` copies setting and
 * company from the prefs and the model declares its own minutes and cost, so
 * `checkPrefsFit` alone cannot see "buy a ₪45 ticket" in a free episode, "take
 * the bus" at home, or "split your crew" for someone alone.
 *
 * A problem triggers the Director's repair round, so every message tells the
 * model exactly what to change. The cue lists are deliberately conservative
 * (instructions, not mentions) and are tested against every curated episode.
 */
import { KINDS } from '../shared/constants.ts';
import { enumeratePaths, pathMinutes } from '../shared/graph.ts';
import type { Adventure, Kind, Prefs, StageNode } from '../shared/types.ts';

export type ConstraintRule =
  | 'free-budget'
  | 'stay-home'
  | 'solo'
  | 'honest-time'
  | 'fills-time'
  | 'distinct-endings'
  | 'distinct-options'
  | 'distinct-alternative'
  | 'avoid-kind';

export interface ConstraintProblem {
  rule: ConstraintRule;
  /** Written for the model's repair round. */
  message: string;
}

export interface ConstraintInput {
  prefs: Prefs;
  avoidKinds?: readonly Kind[];
}

/** Every path must fill at least this share of the user's minutes (the brief asks for 70–95%). */
export const MIN_TIME_FILL = 0.6;
/** Alternatives at least this similar to their action (normalized edit similarity) are near-copies. */
export const MAX_ALTERNATIVE_SIMILARITY = 0.8;

// ── cue matching ─────────────────────────────────────────────────────

const NEGATIONS: ReadonlySet<string> = new Set(['no', 'not', 'never', 'nothing', 'without', 'nor', "don't", 'dont', "doesn't", "isn't", "won't", "can't", 'cannot', 'zero']);
/** "a free ticket", "free entry" are not purchases. */
const PURCHASE_NEGATIONS: ReadonlySet<string> = new Set([...NEGATIONS, 'free']);
const CLAUSE_BREAK = /[.!?;:()[\]{}"“”—–…]/;

/** True when one of the three words before `index` (same clause) negates the cue: "no need to buy anything". */
function negatedAt(text: string, index: number, negations: ReadonlySet<string>): boolean {
  const clause = text.slice(Math.max(0, index - 80), index).split(CLAUSE_BREAK).pop() ?? '';
  const words = clause.toLowerCase().replace(/’/g, "'").match(/[a-z']+/g) ?? [];
  return words.slice(-3).some((w) => negations.has(w));
}

/** The first un-negated cue in `text`, or null. Patterns must be non-global. */
function findCue(text: string, cues: readonly RegExp[], negations: ReadonlySet<string> = NEGATIONS): string | null {
  for (const cue of cues) {
    for (const m of text.matchAll(new RegExp(cue.source, `${cue.flags}g`))) {
      if (!negatedAt(text, m.index, negations)) return m[0];
    }
  }
  return null;
}

/** Purchases, prices and tickets. Not "a ticket stub" (a found object), "shuffle the order", "a cashier". */
export const PURCHASE_CUES: readonly RegExp[] = [
  /₪\s?\d|\d\s?₪/,
  /\b\d+(?:[.,]\d+)?\s?(?:nis|ils|shekels?|shekalim|agorot)\b/i,
  /\b(?:shekels?|shekalim|agorot)\b/i,
  /\bNIS\b/,
  /\b(?:buy|buys|buying|bought|purchase|purchases|purchasing|purchased)\b/i,
  /\b(?:pay|pays|paying|paid)\s+(?:(?:for|with|at|by)\b|the\s+(?:bill|fare|fee|entry|entrance|cashier|vendor|driver)\b|a\s+(?:fee|fare|deposit)\b|cash\b|money\b|₪|\d)/i,
  /\b(?:order|orders|ordering|ordered)\s+(?:a|an|one|two|some|something|anything|yourself|food|coffee|tea|drinks?|takeaway|take-?out|dessert|lunch|dinner|breakfast|the\s+(?:cheapest|special|soup|dish|coffee|tea|cake|pastry|meal|drink))\b/i,
  /\bplace\s+an?\s+order\b/i,
  /\btickets?\b(?!\s*stubs?\b)/i,
  /\b(?:entry|entrance|admission|cover)\s+(?:fees?|charges?)\b/i,
  /\b(?:spend|spending|spent)\s+(?:₪|\d|money|cash|a\s+few\s+(?:shekels|coins)|some\s+(?:money|cash|shekels|coins)|your\s+(?:money|cash|allowance))/i,
  /\b(?:rent|rents|renting|rented|hire|hiring|hired)\s+(?:a|an|the)\s+(?:bike|scooter|boat|kayak|pedal\s*boat|car|locker|board)\b/i,
  /\bfares?\b/i,
  /\b(?:costs?|priced?)\s+(?:about\s+|around\s+|only\s+|just\s+)?(?:₪|\d)/i,
  /\bat\s+the\s+(?:till|checkout|cash\s+register|register)\b/i,
];

/** `\b` treats "é" as a non-word character, so words that may end in one close with this instead. */
const END = '(?![a-z0-9])';
const OUTDOOR_PLACE = String.raw`(?:park|playground|caf[eé]s?|coffee\s+shop|shop|store|supermarket|grocery|mall|market|shuk|kiosk|bakery|bus\s+stop|bus\s+station|train\s+station|station|square|plaza|library|beach|promenade|boardwalk|cinema|museum|post\s+office|pharmacy|corner\s+shop|street\s+corner|bench|sidewalk|pavement|crosswalk|street|road|neighbou?rhood|block|town|city\s+cent(?:re|er)|downtown)`;

/** Leaving home. Not "the room or the street" (a home/outside episode), "walk it slowly", "a short walk". */
export const LEAVE_HOME_CUES: readonly RegExp[] = [
  /\b(?:leave|leaving|exit|exiting)\s+(?:the|your)\s+(?:house|flat|apartment|building)\b|\bleav(?:e|ing)\s+home\b/i,
  /\b(?:step|walk|head|go|get|run|pop|slip|nip)\s+out\s+(?:of\s+)?(?:the|your)\s+(?:front\s+door|house|flat|apartment|building)\b/i,
  /\b(?:go|going|head|heading|step|stepping|walk|walking|get|getting|pop|nip|wander|run|venture)\s+(?:back\s+)?(?:outside|outdoors|out\s+of\s+doors|out\s+into\s+the\s+(?:street|world|city|neighbou?rhood|sun|fresh\s+air))\b(?!\s+(?:on(?:to)?|to)\s+(?:the|your)\s+balcony)/i,
  /\bhead(?:ing)?\s+out\b(?!\s+(?:to|onto)\s+(?:the|your)\s+balcony)/i,
  new RegExp(
    String.raw`\b(?:walk|walking|go|going|head|heading|stroll|run|jog|wander|cycle|ride|pop|nip|get|travel|drive|hop)\s+(?:(?:down|over|out|back|across|up)\s+)?(?:to|into|towards?|around|along|down|through)\s+(?:the\s+|a\s+|an\s+|your\s+|any\s+)?(?:(?:nearest|closest|local|neighbou?rhood|corner|next|other|end\s+of\s+the|top\s+of\s+the)\s+)?${OUTDOOR_PLACE}${END}`,
    'i',
  ),
  /\b(?:take|taking|ride|riding|catch|catching|board|boarding|hop\s+on(?:to)?|get\s+on(?:to)?|jump\s+on(?:to)?)\s+(?:a|the|any|your|one)\s+(?:(?:next|first|local|night|city)\s+)?(?:bus|buses|train|tram|light[- ]rail|metro|subway|underground|taxi|cab|ferry|shuttle)\b/i,
  new RegExp(String.raw`\b(?:at|in|inside)\s+(?:the|a|your)\s+(?:nearest\s+|local\s+)?(?:park|playground|caf[eé]|coffee\s+shop|supermarket|mall|market|shuk|kiosk|bakery|bus\s+stop|library|beach|cinema|museum)${END}`, 'i'),
];

/** Other people. Not "a crew of one", "an invisible tour group", "split your view", "both of you" (you and your self-portrait). */
export const GROUP_CUES: readonly RegExp[] = [
  /\b(?:your|the\s+other|other|(?:the|your)\s+whole)\s+(?:friends|crew|crewmates?|group|team|teammates?|squad|gang|party|companions|players|fellow\s+players)\b/i,
  /\bteams\b|\bteam\s+(?:up|mates?|members?)\b|\bteammates?\b|\bcrewmates?\b/i,
  /\b(?:each|every|the\s+other|another)\s+players?\b/i,
  /\b(?:each|every|all)\s+of\s+you\b/i,
  /\b(?:split|splitting|divide|dividing|break|breaking)\s+(?:up\b|into\s+(?:two|three|pairs|teams|groups|halves)\b|your\s+(?:crew|group|team|friends|party)\b)/i,
  /\b(?:take|taking)\s+turns\b/i,
  /\bwhoever\s+(?:loses|wins|finishes|guesses|spots)\b/i,
  /\b(?:with|together\s+with)\s+your\s+(?:friends|crew|group|team|squad)\b/i,
  /\bin\s+(?:pairs|teams|groups)\b/i,
];

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, 'forty-five': 45, fifty: 50, sixty: 60, ninety: 90,
};
const DURATION = /\b(half\s+an|\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty-five|forty|fifty|sixty|ninety)[\s-]+(minutes?|mins?|hours?|hrs?)\b/gi;
/** Before a duration these make it a limit or an interval ("within ten minutes' walk", "every 10 minutes"), not how long something takes. */
const LIMIT_BEFORE = /\b(?:within|every|each|per|under|less\s+than|at\s+most|up\s+to|no\s+more\s+than|last|past)\s+$/i;
/** After a duration these make it a point in time ("an hour ago"). */
const POINT_AFTER = /^\s*(?:ago|earlier|later|before|after|from\s+now|old|away|of\s+(?:daylight|light|sun))\b/i;

/**
 * The longest activity duration an instruction mentions, in minutes ("ride to the
 * last stop and back (about an hour)" → 60), or 0. Ignores limits, intervals,
 * points in time and "24-hour" shops.
 */
export function longestMentionedMinutes(text: string): { minutes: number; phrase: string } {
  let best = { minutes: 0, phrase: '' };
  for (const m of text.matchAll(DURATION)) {
    const before = text.slice(0, m.index);
    const after = text.slice(m.index + m[0].length);
    if (LIMIT_BEFORE.test(before) || POINT_AFTER.test(after)) continue;
    if (/^24$/.test(m[1]) && /^hours?$/i.test(m[2])) continue;
    const raw = m[1].toLowerCase().replace(/\s+/g, ' ');
    const n = raw === 'half an' ? 0.5 : (NUMBER_WORDS[raw] ?? Number(raw));
    const minutes = /^h/i.test(m[2]) ? n * 60 : n;
    if (Number.isFinite(minutes) && minutes > best.minutes) best = { minutes, phrase: m[0] };
  }
  return best;
}

// ── helpers ──────────────────────────────────────────────────────────

/** Where a node or ending lives in the AI shape (what the model wrote), falling back to its id. */
const AI_PLACES: Record<string, string> = {
  s1: 'stage1',
  's2-a': 'pathA.stage2',
  's3-a': 'pathA.stage3',
  's2-b': 'pathB.stage2',
  's3-b': 'pathB.stage3',
  'end-a': 'pathA.ending',
  'end-b': 'pathB.ending',
};
const place = (id: string) => AI_PLACES[id] ?? id;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\{\{\s*[a-z0-9-]+\s*\|([^{}]*)\}\}/g, '$1')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

function levenshtein(x: string, y: string): number {
  let prev = new Uint16Array(y.length + 1).map((_, j) => j);
  let cur = new Uint16Array(y.length + 1);
  for (let i = 1; i <= x.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x.charCodeAt(i - 1) === y.charCodeAt(j - 1) ? 0 : 1));
    }
    [prev, cur] = [cur, prev];
  }
  return prev[y.length];
}

/** Levenshtein similarity in [0, 1] (1 = identical) of two normalized strings. */
export function similarity(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  if (x === y) return 1;
  if (!x.length || !y.length) return 0;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

/** similarity(a, b) >= threshold, without the edit-distance work when the lengths alone rule it out. */
function nearCopy(a: string, b: string, threshold: number): boolean {
  const x = normalize(a);
  const y = normalize(b);
  const longest = Math.max(x.length, y.length);
  if (longest === 0) return true;
  // The edit distance is at least the length difference.
  if (1 - Math.abs(x.length - y.length) / longest < threshold) return false;
  return 1 - levenshtein(x, y) / longest >= threshold;
}

const quote = (s: string) => `"${s.length > 60 ? `${s.slice(0, 59)}…` : s}"`;

/** Instruction texts of a node (what the user is asked to do). */
function instructions(n: StageNode): [string, string][] {
  const out: [string, string][] = [
    ['action', n.action],
    ['alternative', n.alternative],
  ];
  if (n.amplify) out.push(['amplify', n.amplify]);
  if (n.crewTip) out.push(['crewTip', n.crewTip]);
  return out;
}

/** Everything the user reads except crew tips (which only show for groups). */
function soloTexts(adv: Adventure): [string, string][] {
  const out: [string, string][] = [
    ['title', adv.title],
    ['tagline', adv.tagline],
    ['intro', adv.intro],
    ...adv.items.map((it, i): [string, string] => [`items[${i}]`, it]),
  ];
  for (const n of adv.nodes) {
    const at = place(n.id);
    out.push([`${at}.title`, n.title], [`${at}.narrative`, n.narrative], [`${at}.action`, n.action], [`${at}.alternative`, n.alternative]);
    if (n.amplify) out.push([`${at}.amplify`, n.amplify]);
    if (n.capture) out.push([`${at}.fieldNoteLabel`, n.capture.label], [`${at}.fieldNotePlaceholder`, n.capture.placeholder]);
    if (n.choice) {
      out.push(['choicePrompt', n.choice.prompt]);
      n.choice.options.forEach((o, i) => out.push([`option ${i + 1} label`, o.label], [`option ${i + 1} description`, o.description]));
    }
  }
  for (const e of adv.endings) {
    const at = place(e.id);
    out.push([`${at}.title`, e.title], [`${at}.twist`, e.twist], [`${at}.closingLine`, e.closingLine]);
  }
  return out;
}

// ── the check ────────────────────────────────────────────────────────

/** Returns hard-constraint problems in an episode's content, empty when it keeps them. */
export function checkHardConstraints(adv: Adventure, input: ConstraintInput): ConstraintProblem[] {
  const { prefs } = input;
  const problems: ConstraintProblem[] = [];

  if (prefs.budget === 0) {
    const hits: string[] = [];
    adv.items.forEach((item, i) => {
      if (findCue(item, PURCHASE_CUES, PURCHASE_NEGATIONS)) hits.push(`items[${i}] ${quote(item)}`);
    });
    for (const n of adv.nodes) {
      for (const [field, text] of instructions(n)) {
        const cue = findCue(text, PURCHASE_CUES, PURCHASE_NEGATIONS);
        if (cue) hits.push(`${place(n.id)}.${field} (“${cue}”)`);
      }
    }
    if (hits.length) {
      problems.push({
        rule: 'free-budget',
        message: `The budget is free, but ${hits.slice(0, 4).join(', ')} asks the user to buy, order or pay for something. Remove every purchase, price and ticket; use only free things.`,
      });
    }
  }

  if (prefs.setting === 'home') {
    const hits: string[] = [];
    for (const n of adv.nodes) {
      for (const [field, text] of instructions(n)) {
        const cue = findCue(text, LEAVE_HOME_CUES);
        if (cue) hits.push(`${place(n.id)}.${field} (“${cue}”)`);
      }
    }
    if (hits.length) {
      problems.push({
        rule: 'stay-home',
        message: `The user is at home, but ${hits.slice(0, 4).join(', ')} sends them out. Every action and alternative must happen at home (a window or balcony is fine).`,
      });
    }
  }

  if (prefs.company === 'solo') {
    const hits: string[] = [];
    for (const [where, text] of soloTexts(adv)) {
      const cue = findCue(text, GROUP_CUES);
      if (cue) hits.push(`${where} (“${cue}”)`);
    }
    if (hits.length) {
      problems.push({
        rule: 'solo',
        message: `The user is alone, but ${hits.slice(0, 4).join(', ')} needs other people. Write every stage for one person, and keep crewTip "".`,
      });
    }
  }

  {
    const hits: string[] = [];
    for (const n of adv.nodes) {
      for (const [field, text] of instructions(n)) {
        if (field === 'crewTip') continue;
        const longest = longestMentionedMinutes(text);
        if (longest.minutes > prefs.minutes) hits.push(`${place(n.id)}.${field} (“${longest.phrase}”)`);
      }
    }
    if (hits.length) {
      problems.push({
        rule: 'honest-time',
        message: `The user has ${prefs.minutes} minutes in total, but ${hits.slice(0, 4).join(', ')} takes longer than that. Every action must fit inside its stage's minutes.`,
      });
    }
  }

  const paths = enumeratePaths(adv);
  const minFill = Math.ceil(prefs.minutes * MIN_TIME_FILL);
  for (const path of paths) {
    const total = pathMinutes(path);
    if (total < minFill) {
      problems.push({
        rule: 'fills-time',
        message: `The path to ${place(path.ending.id)} takes only ${total} of the user's ${prefs.minutes} minutes. Each path's stage minutes must total at least ${minFill} (aim for ${Math.round(prefs.minutes * 0.7)}-${Math.round(prefs.minutes * 0.95)}); give the stages honest, fuller actions.`,
      });
    }
  }

  for (let i = 0; i < adv.endings.length; i++) {
    for (let j = i + 1; j < adv.endings.length; j++) {
      const a = adv.endings[i];
      const b = adv.endings[j];
      const same = [
        normalize(a.twist) === normalize(b.twist) ? 'twist' : '',
        normalize(a.closingLine) === normalize(b.closingLine) ? 'closingLine' : '',
      ].filter(Boolean);
      if (same.length) {
        problems.push({
          rule: 'distinct-endings',
          message: `${place(a.id)} and ${place(b.id)} have the same ${same.join(' and ')}. Each path needs its own ending that pays off what happened on that path.`,
        });
      }
    }
  }

  for (const n of adv.nodes) {
    if (!n.choice) continue;
    const labels = n.choice.options.map((o) => normalize(o.label));
    if (new Set(labels).size !== labels.length) {
      problems.push({
        rule: 'distinct-options',
        message: `The choice options have the same label (${n.choice.options.map((o) => quote(o.label)).join(' / ')}). Give each option a different label that says what kind of path it is.`,
      });
    }
  }

  for (const n of adv.nodes) {
    if (nearCopy(n.action, n.alternative, MAX_ALTERNATIVE_SIMILARITY)) {
      problems.push({
        rule: 'distinct-alternative',
        message: `${place(n.id)}.alternative is nearly the same as its action. Write a genuinely different way to reach the same story beat (seated, indoors, or with no interaction).`,
      });
    }
  }

  const avoid = new Set(input.avoidKinds ?? []);
  // When every kind is taken there is nothing to avoid.
  if (avoid.has(adv.kind) && avoid.size < KINDS.length) {
    problems.push({
      rule: 'avoid-kind',
      message: `kind "${adv.kind}" is already used by the user's other envelopes (${[...avoid].join(', ')}). Choose a different kind and write the episode to match it.`,
    });
  }

  return problems;
}
