/**
 * Defense-in-depth screen for generated episodes. The system prompt is the main
 * safety mechanism; this catches clear violations so they are repaired or
 * replaced by curated content instead of shown to the user.
 *
 * The rules look for instructions, not mentions ("satellites photographed every
 * rooftop" is fine, "go up onto the roof" is not), and they do not depend on
 * word order: "photograph the person" and "snap a photo of the person … without
 * them noticing" are both caught. A match that is negated in its own clause
 * ("never photograph strangers", "no people in the frame") is ignored, because
 * that is the rule being respected.
 */
import type { Adventure } from '../shared/types.ts';

interface Rule {
  reason: string;
  /** Regex patterns (case-insensitive); any un-negated match flags the text. */
  patterns?: RegExp[];
  /** Extra logic for rules a regex cannot express cleanly. */
  test?: (text: string) => boolean;
}

// ── shared vocabulary ────────────────────────────────────────────────

/** People (not pronouns). Used after verbs like "photograph" or "follow". */
const PERSON = String.raw`(?:strangers?|persons?|people|someone|somebody|anyone|anybody|passersby|passers?-by|pedestrians?|m[ae]n|wom[ae]n|girls?|boys?|kids?|child(?:ren)?|couples?|guys?|lady|ladies|gentlem[ae]n|crowds?|customers?|shoppers?|commuters?|tourists?|neighbou?rs?|workers?|baristas?|cashiers?|vendors?|students?|teens?|teenagers?|famil(?:y|ies)|folks|passengers?|joggers?|walkers?|drivers?|cyclists?|buskers?|performers?|locals|residents?|visitors?|diners?|patrons?|onlookers?|bystanders?)`;
const PERSON_RE = new RegExp(String.raw`\b${PERSON}\b(?!-)`, 'i');
const PERSON_TOKEN = new RegExp(`^${PERSON}$`, 'i');

/** Words that, among the three words before a match (same clause), negate it. */
const NEGATIONS = new Set([
  'no', 'not', 'never', 'nobody', 'none', 'nothing', 'without', 'nor', 'neither', 'avoid', 'avoiding', 'zero',
  "don't", 'dont', "doesn't", "isn't", "aren't", "won't", "can't", 'cannot', "shouldn't", "mustn't", "mustnt",
]);
const CLAUSE_BREAK = /[.!?;:()[\]{}"“”—–…]/;

function wordsOf(text: string): string[] {
  return text.toLowerCase().replace(/’/g, "'").match(/[a-z']+/g) ?? [];
}

/** True when one of the three words before `index` (within its clause) is a negation. */
function negatedAt(text: string, index: number): boolean {
  const clause = text.slice(Math.max(0, index - 80), index).split(CLAUSE_BREAK).pop() ?? '';
  return wordsOf(clause).slice(-3).some((w) => NEGATIONS.has(w));
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+|\n+/).filter(Boolean);
}

// ── recording people (word-order independent, token based) ──────────

/** Photo words count as recording as nouns too ("a photo of the person"); film/video only as verbs or "a film of". */
const PHOTO_WORD = /^(?:photograph(?:s|ed|ing)?|photos?|pics?|snap(?:s|ped|ping)?|shoot(?:s|ing)?|shots?|selfies?|livestream(?:s|ed|ing)?)$/;
const PICTURE_WORD = /^pictures?$/;
const FILM_WORD = /^(?:film(?:s|ed|ing)?|videos?|video(?:ed|ing)|videotap\w*)$/;
const RECORD_WORD = /^record(?:s|ed|ing)?$/;
/** Words after which "film" / "record" read as instructions ("…and record them"), not nouns ("a great film"). */
const VERB_CONTEXT = new Set([
  'to', 'you', 'then', 'and', 'or', 'please', 'can', 'could', 'will', 'would', 'should', 'must', 'just', 'quickly', 'quietly',
  'secretly', 'now', 'also', "you'll", 'we', 'i', "let's", 'go', 'try', 'start', 'first', 'next', 'finally', 'simply', 'carefully',
]);
const PRONOUN = new Set(['them', 'him', 'her']);
/** After these, a person is the recipient or author ("send a photo to someone"), not the one recorded. */
const STOP_WORDS = new Set(['to', 'for', 'from', 'by', 'about', 'than']);
/** How far after a recording word a person may appear (in words) to count as its object. */
const RECORD_REACH = 4;

function isRecordingWord(words: string[], i: number): boolean {
  const t = words[i];
  const prev = words[i - 1] ?? '';
  const next = words[i + 1] ?? '';
  const verbPosition = i === 0 || VERB_CONTEXT.has(prev);
  if (PHOTO_WORD.test(t)) return true;
  // "a picture of the stranger" — not "picture (imagine) a person"
  if (PICTURE_WORD.test(t)) return next === 'of' || ['a', 'take', 'took', 'taking', 'snap', 'quick'].includes(prev);
  if (FILM_WORD.test(t)) {
    if (['call', 'calls', 'calling', 'chat', 'chats', 'game', 'games'].includes(next)) return false; // "video call someone"
    return /(?:ing|ed)$/.test(t) || verbPosition || next === 'of'; // "film the crowd", "a film of the crowd" — not "a film about people"
  }
  if (RECORD_WORD.test(t)) return /(?:ing|ed)$/.test(t) || verbPosition; // "record them" — not "on the record", "a record of"
  return false;
}

interface Token {
  word: string;
  /** Part of a hyphenated word: "five-photo" still records, but "man-made" is not a person. */
  part: boolean;
}

function tokenize(clause: string): Token[] {
  const out: Token[] = [];
  for (const raw of clause.toLowerCase().replace(/’/g, "'").match(/[a-z'-]+/g) ?? []) {
    const word = raw.replace(/'s$/, '');
    if (!word.includes('-')) out.push({ word, part: false });
    else for (const p of word.split('-').filter(Boolean)) out.push({ word: p, part: true });
  }
  return out;
}

function recordsPeople(text: string): boolean {
  for (const sentence of sentences(text.replace(/passers?-by/gi, 'passersby'))) {
    // A pronoun ("record them") only counts when the sentence names a person ("find a busker and record them").
    const pronounsArePeople = PERSON_RE.test(sentence);
    for (const clause of sentence.split(/[,;:()[\]{}"“”—–…]/)) {
      const tokens = tokenize(clause);
      const words = tokens.map((t) => t.word);
      for (let i = 0; i < words.length; i++) {
        if (!isRecordingWord(words, i)) continue;
        for (let j = i + 1; j <= Math.min(words.length - 1, i + RECORD_REACH); j++) {
          const t = tokens[j];
          if (STOP_WORDS.has(t.word)) break;
          const person = !t.part && (PERSON_TOKEN.test(t.word) || (pronounsArePeople && PRONOUN.has(t.word)));
          if (!person) continue;
          if (words.slice(Math.max(0, i - 3), j).some((w) => NEGATIONS.has(w))) break; // "never photograph strangers", "photos without people"
          return true;
        }
      }
    }
  }
  return false;
}

// ── following people ─────────────────────────────────────────────────

const FOLLOW_PATTERNS: RegExp[] = [
  // follow / tail / stalk / trail + (det) + up to two words + a person: "follow the woman in the red coat", "tail two kids"
  new RegExp(
    String.raw`\b(?:follow(?:s|ed|ing)?|tail(?:s|ed|ing)?|stalk(?:s|ed|ing)?|trail(?:s|ed|ing)?)\s+(?:(?:a|an|the|that|this|one|some|any|two|three|those|these|random|your|another)\s+)?(?:(?!of\b)[\w'-]+\s+){0,2}?${PERSON}\b(?!-)`,
    'i',
  ),
  // "shadow" is also a noun ("the shadow people cast"), so it needs a determiner: "shadow the man"
  new RegExp(String.raw`\bshadow(?:s|ed|ing)?\s+(?:a|an|the|that|this|one|some|any|those|these|random)\s+(?:(?!of\b)[\w'-]+\s+){0,2}?${PERSON}\b(?!-)`, 'i'),
  /\b(?:tail(?:s|ed|ing)?|shadow(?:s|ed|ing)?|stalk(?:s|ed|ing)?)\s+(?:them|him|her)\b/i,
  /\bfollow(?:s|ed|ing)?\s+(?:him|her)\b(?!\s+(?:advice|lead|directions?|tips?|instructions?|recipes?|example|gaze|eyes|finger|map|recommendations?|suggestions?|rules?|steps|story|account|blog))/i,
];

function followsThem(text: string): boolean {
  return sentences(text).some((s) => {
    if (!PERSON_RE.test(s)) return false;
    for (const m of s.matchAll(/\bfollow(?:s|ed|ing)?\s+them\b/gi)) if (!negatedAt(s, m.index)) return true;
    return false;
  });
}

// ── the rules ────────────────────────────────────────────────────────

const WATER = String.raw`(?:sea|ocean|water|waves|surf|river|lake|pond|stream|fountain|pool|canal|reservoir|shallows)`;
/** Imperative motion verbs only: "wade into the fountain" is an instruction, "kids splashing in the fountain" is a description. */
const INTO_WATER_VERBS = String.raw`(?:walk|wade|step|jump|dive|go|get|run|climb|wander|head|paddle|plunge|splash|hop|slip)`;

const RULES: Rule[] = [
  { reason: 'mentions trespassing', patterns: [/\btrespass/i] },
  {
    reason: 'involves rail tracks',
    patterns: [
      /\b(?:train|railway|rail|tram|light[- ]rail|metro|subway)\s+tracks?\b/i,
      /\b(?:walk|walking|stand|standing|step|stepping|cross|crossing|play|playing|sit|sitting)\s+(?:on|onto|along|across|over|between)\s+(?:the\s+)?tracks\b/i,
    ],
  },
  {
    // Instructions to get onto a roof — not mere mentions ("satellites photographed every rooftop").
    reason: 'involves going onto a roof',
    patterns: [
      /\b(?:on(?:to)?|up to|up on|go up|climb up|climb onto|out on(?:to)?|out to)\s+(?:a |the |your |any )?roof(?:top)?s?\b/i,
      /\broof(?:top)?(?:'s|’s)?\s+edges?\b|\bedges?\s+of\s+(?:a|the|your|any|that)\s+roof(?:top)?\b/i,
    ],
  },
  // A window ledge is fine; any other ledge or a parapet is a fall risk.
  { reason: 'involves ledges or parapets', patterns: [/(?<!window[- ]?)\b(?:ledges?|parapets?)\b/i] },
  {
    reason: 'involves climbing structures',
    patterns: [
      /\bclimb(?:s|ed|ing)?\s+(?:up\s+onto\s+|up\s+into\s+|up\s+|onto\s+|over\s+|into\s+|on\s+|to\s+the\s+top\s+of\s+)?(?:a\s+|an\s+|the\s+|that\s+|this\s+|your\s+|any\s+)?(?:[\w'-]+\s+)?(?:fences?|walls?|roofs?|buildings?|scaffold\w*|poles?|trees?|bridges?|railings?|gates?|statues?|monuments?|lamp\s?posts?|cranes?|towers?|ladders?|balcon(?:y|ies)|cliffs?)\b/i,
      /\b(?:hop|hops|hopped|hopping|jump|jumps|jumped|jumping|scale|scales|scaled|scaling|vault|vaults|vaulted|vaulting|leap|leaps|leapt|leaped|leaping|clamber\w*|straddl\w*)\s+(?:over\s+|across\s+|onto\s+|on\s+|up\s+|through\s+)?(?:a\s+|an\s+|the\s+|that\s+|this\s+|your\s+|any\s+|its\s+)?(?:[\w'-]+\s+)?(?:fences?|walls?|gates?|railings?|barriers?|barricades?|hedges?)\b/i,
    ],
  },
  { reason: 'involves traffic', patterns: [/\b(?:middle of|into|onto|stand in|lie (?:down )?(?:in|on)) the (?:road|street|traffic)\b/i] },
  {
    reason: 'involves covert surveillance of people',
    patterns: [
      /\bwithout\s+(?:them|him|her|anyone|anybody|people|the\s+(?:person|stranger|people|owner)|(?:the\s+)?(?:strangers?|passersby|passers?-by))\s+(?:noticing|knowing|seeing|realizing|realising|spotting|looking)\b/i,
      /\b(?:secretly|covertly|sneakily|stealthily)\s+(?:\w+\s+){0,3}?(?:photograph\w*|photos?|pics?|pictures?|snap\w*|film\w*|record\w*|videos?|follow(?:s|ed|ing)?|tail\w*|shadow\w*|stalk\w*)\b/i,
    ],
  },
  { reason: 'involves recording people', test: recordsPeople },
  { reason: 'involves following people', patterns: FOLLOW_PATTERNS, test: followsThem },
  {
    reason: 'involves alcohol',
    patterns: [
      /(?<!non-?|non\s)\balcohol(?:ic)?\b(?!-free)/i,
      /(?<!root\s|ginger\s)\bbeers?\b/i,
      /\b(?:vodka|whisk(?:e)?y|tequila|cocktails?|liquor|liqueurs?|champagne|prosecco|arak|ouzo|brandy|cognac)\b/i,
      // wine as a drink — not "wine experts weep" or "a wine label"
      /\b(?:glass|glasses|bottle|bottles|cup|sip|carafe|jug|splash)\s+of\s+(?:(?:red|white|rosé|rose|house|sparkling)\s+)?wine\b/i,
      /\b(?:drink|drinks|drinking|order|ordering|sip|sipping|taste|tasting|pour|pouring|buy|buying|share|sharing|enjoy|enjoying|open|opening)\s+(?:a\s+|some\s+|the\s+|your\s+|one\s+)?(?:(?:red|white|house|sparkling|cheap|local)\s+)?wines?\b/i,
      /\bwine\s*-?\s*(?:bars?|tasting|shops?|stores?|lists?|cellars?)\b/i,
      // shots of alcohol — not "three shots of the same doorway"
      /\bdo(?:ing)?\s+(?:a\s+|some\s+|two\s+|three\s+|more\s+)?shots\b/i,
      /\b(?:vodka|tequila|whisk(?:e)?y|j[äa]ger\w*|alcohol|liquor|arak)\s+shots?\b|\bshots?\s+of\s+(?:vodka|tequila|whisk(?:e)?y|alcohol|liquor|arak|spirits)\b/i,
      /\b(?:drink(?:s|ing)?|bottles?\s+of|glass(?:es)?\s+of|shots?\s+of)\s+spirits\b/i,
      // drinking venues — "the bar" as a place, not "a bar of soap" or "the progress bar"
      /\bpubs?\b|\bnightclubs?\b|\b(?:liquor|bottle)\s+(?:stores?|shops?)\b|\boff-licen[cs]es?\b/i,
      /\b(?:at|to|in|into|inside|visit|find|enter|from)\s+(?:a|the|your|any|one)\s+(?:(?:nearest|closest|local|corner|neighbou?rhood|hotel|cocktail|wine|beer|sports|rooftop|karaoke|piano|dive|whisk(?:e)?y)\s+)?bars?\b(?!\s+(?:of|code|codes|chart|charts|graph|graphs))/i,
    ],
  },
  {
    reason: 'involves smoking or vaping',
    patterns: [
      /\bvap(?:e|es|ed|ing)\b|\be-?cig(?:arette)?s?\b|\bcigar(?:ette)?s?\b|\bhookah\b|\bshisha\b|\bnargil(?:a|e|eh)\b/i,
      /\bsmok(?:e|es|ed|ing)\s+(?:a\s+|one\s+|some\s+)?(?:cigarettes?|cigars?|joints?|pipes?|hookah|shisha|weed|pot)\b/i,
    ],
  },
  {
    // "the weed pushing through the pavement crack" is a plant, not a drug
    reason: 'involves drugs',
    patterns: [
      /\bdrugs?\b(?!\s*stores?)/i,
      /\bcannabis\b|\bmarijuana\b/i,
      /\bweed\s+(?:gumm(?:y|ies)|brownies?|edibles?|vapes?|pens?|joints?)\b/i,
      /\b(?:smok(?:e|es|ed|ing)|roll(?:s|ed|ing)?|buy(?:s|ing)?|get(?:s|ting)?|scor(?:e|es|ed|ing))\s+(?:some\s+|a\s+)?(?:weed|joints?|pot|hash)\b/i,
    ],
  },
  {
    reason: 'involves fire or blades',
    patterns: [
      // knives — a butter or plastic knife is fine
      /(?<!(?:butter|plastic|palette|table|dinner)\s)\bkni(?:fe|ves)\b/i,
      /\b(?:pen-?knife|pocket-?knife|razors?|razor\s+blades?|box[- ]cutters?|scalpels?|machetes?)\b/i,
      // a lighter (the device) — not "a lighter shade of blue"
      /\b(?:cigarette|gas|pocket|plastic|kitchen|bic|zippo)\s+lighters?\b|\blighter\s+(?:fluid|flames?)\b/i,
      /\b(?:a|the|your|my|their|his|her|some)\s+lighters?\b(?=\s*(?:$|[.;:!?)"”…])|\s+(?:to|with|from|in|on|for|that|which|is|are|was|will|can|into|onto|under|near|beside|it|them)\b)/i,
      /\b(?:box|book|pack)\s+of\s+matches\b|\b(?:light|lights|lighting|strike|strikes|striking)\s+(?:a\s+)?match(?:es)?\b/i,
      /\bbonfires?\b|\bcampfires?\b|\bfireworks?\b|\bfirecrackers?\b|\bsparklers?\b/i,
      /\bset\s+(?:[\w'-]+\s+){0,2}?(?:on\s+fire|alight|ablaze)\b|\b(?:light|start|make|build)\s+(?:a\s+)?fire\b/i,
      /\bburn(?:s|ed|t|ing)?\s+(?:it|them|the|a|an|your|some|this|that|those|one)\s+(?:[\w'-]+\s+)?(?:paper|list|note|letter|page|card|photo|leaf|leaves|stick|wood|candle|incense)s?\b/i,
      // candles and incense when lit — not "a candlelit tent" or "half a birthday candle" in a drawer
      /\b(?:light|lights|lit|lighting|burn|burns|burned|burnt|burning|ignite\w*)\s+(?:(?:a|an|the|some|one|two|three|few|your|that|this|those|these)\s+)?(?:[\w'-]+\s+)?(?:candles?|incense|tea[- ]?lights?|tealights?|wicks?|joss\s+sticks?)\b/i,
      /\b(?:candles?|incense)\s+(?:lit|burning|alight|aflame)\b/i,
    ],
  },
  {
    // gambling for money — not "I am betting you never noticed" or a "lottery kiosk" on the street
    reason: 'involves gambling',
    patterns: [
      /\bgambling\b|\bcasinos?\b|\bslot\s+machines?\b|\bscratch[- ]?cards?\b/i,
      /\b(?:place|places|placing|make|making)\s+(?:a|your|some)\s+bets?\b/i,
      /\bbet(?:s|ting)?\s+(?:money|cash|₪|\d|real\s+money|your\s+(?:money|cash|savings|allowance|pocket\s+money)|(?:a\s+)?(?:few|some|ten|five|twenty)\s+(?:shekels?|coins|dollars|euros|bucks))/i,
      /\bgambl(?:e|es|ed)\s+(?:away\s+)?(?:money|cash|₪|\d|your\s+(?:money|cash|savings|allowance))/i,
      /\b(?:buy|buys|buying|bought|get|purchase|play|plays|playing|scratch)\s+(?:a\s+|the\s+|some\s+|your\s+)?lottery\b/i,
      /\bwager(?:s|ed|ing)?\b/i,
    ],
  },
  { reason: 'involves pranks', patterns: [/\b(?:prank|pranking|pranks)\b/i] },
  {
    // the user going into water — not "count the ducks swimming" or "toss a leaf into the water"
    reason: 'involves water hazards',
    patterns: [
      /(?:^|[.!?;:—–(]\s*|\b(?:you|then|and|or|go|going|went|let's|can|could|should|must|we)\s+)swim(?:s|ming)?\b/i,
      /\b(?:take|have|go\s+for|for|grab)\s+a\s+(?:quick\s+|short\s+|cold\s+|brief\s+)?(?:swim|dip|paddle)\b/i,
      new RegExp(String.raw`\b${INTO_WATER_VERBS}\s+(?:straight\s+|right\s+|all\s+the\s+way\s+|back\s+)?(?:in|into|in\s+to|through|across)\s+(?:the|a|that|this|any)\s+(?:[\w'-]+\s+)?${WATER}\b(?!\s+of\b)`, 'i'),
      /\b(?:go|goes|going|went|try|trying|start|starting|keep|keeping|you're|you\s+are|by)\s+(?:wading|paddling|diving|splashing|swimming|plunging)\b/i,
      /\b(?:dip|dipping|soak|soaking|dangle|dangling)\s+(?:your|both)\s+(?:feet|toes|legs)\b/i,
      new RegExp(String.raw`\b(?:dip|put|stick|soak|dangle|plunge)\s+(?:your|both)\s+(?:feet|toes|legs|hands?)\s+(?:in|into)\s+(?:the|a|that|this)\s+(?:[\w'-]+\s+)?${WATER}\b`, 'i'),
      /\bwade\b(?=\s*(?:$|[.,;:!?)]|\s+(?:in|into|out|across|around)\b))/i,
    ],
  },
];

const GLOBAL = new Map<RegExp, RegExp>();
function globalOf(p: RegExp): RegExp {
  let g = GLOBAL.get(p);
  if (!g) {
    g = new RegExp(p.source, p.flags.includes('g') ? p.flags : `${p.flags}g`);
    GLOBAL.set(p, g);
  }
  return g;
}

function violates(rule: Rule, text: string): boolean {
  for (const p of rule.patterns ?? []) {
    for (const m of text.matchAll(globalOf(p))) if (!negatedAt(text, m.index)) return true;
  }
  return rule.test ? rule.test(text) : false;
}

/** Every text an episode shows the user. */
function allText(adv: Adventure): string[] {
  const out = [adv.title, adv.tagline, adv.intro, ...adv.items];
  for (const n of adv.nodes) {
    out.push(n.title, n.narrative, n.action, n.alternative);
    if (n.amplify) out.push(n.amplify);
    if (n.crewTip) out.push(n.crewTip);
    if (n.capture) out.push(n.capture.label, n.capture.placeholder);
    if (n.choice) {
      out.push(n.choice.prompt);
      for (const o of n.choice.options) out.push(o.label, o.description);
    }
  }
  for (const e of adv.endings) out.push(e.title, e.twist, e.closingLine);
  return out;
}

/** Safety problems in one piece of text (the rule reasons), empty when clean. Exported for tests. */
export function screenText(text: string): string[] {
  return RULES.filter((rule) => violates(rule, text)).map((rule) => rule.reason);
}

/** Returns a list of safety problems ("the episode involves alcohol (…)"), empty when clean. */
export function screenAdventure(adv: Adventure): string[] {
  const problems = new Set<string>();
  for (const text of allText(adv)) {
    for (const reason of screenText(text)) problems.add(`Safety: the episode ${reason} ("${text.slice(0, 80)}")`);
  }
  return [...problems];
}
