/**
 * Defense-in-depth screen for generated episodes. The system prompt is the main
 * safety mechanism; this catches clear violations so they are repaired or
 * replaced by curated content instead of shown to the user.
 *
 * The rules look for instructions, not mentions ("satellites photographed every
 * rooftop" and "count the solar heaters on the rooftops" are fine, "go up onto the
 * roof" is not), and they do not depend on word order: "photograph the person" and
 * "snap a photo of the person … without them noticing" are both caught. A match
 * that is negated in its own clause ("never photograph strangers", "no people in
 * the frame") is ignored, because that is the rule being respected; a negated
 * lead-in before a comma ("Without a sound, follow the man") is not.
 */
import type { Adventure } from '../shared/types.ts';
import { negatedAt as negatedInClause, quoteModelText } from './text.ts';

interface Rule {
  reason: string;
  /** Regex patterns (case-insensitive); any un-negated match flags the text. */
  patterns?: RegExp[];
  /** Extra logic for rules a regex cannot express cleanly. */
  test?: (text: string) => boolean;
}

// ── shared vocabulary ────────────────────────────────────────────────

/** People (not pronouns): used after verbs like "photograph" or "follow". "guard rail" and "guard dog" are not people. */
const PERSON = String.raw`(?:strangers?|persons?|people|someone|somebody|anyone|anybody|everyone|everybody|passersby|passers?-by|pedestrians?|m[ae]n|wom[ae]n|girls?|boys?|kids?|child(?:ren)?|bab(?:y|ies)|toddlers?|couples?|guys?|lady|ladies|gentlem[ae]n|crowds?|audiences?|customers?|shoppers?|commuters?|tourists?|travell?ers?|guests?|neighbou?rs?|workers?|employees?|baristas?|bartenders?|barm[ae]n|waiters?|waitress(?:es)?|chefs?|cashiers?|clerks?|shopkeepers?|owners?|vendors?|sellers?|students?|teachers?|teens?|teenagers?|famil(?:y|ies)|parents?|mums?|moms?|dads?|grandparents?|grandmas?|grandpas?|folks|passengers?|joggers?|walkers?|hikers?|skaters?|cyclists?|riders?|drivers?|couriers?|postm[ae]n|postwom[ae]n|officers?|police(?:m[ae]n|wom[ae]n)?|cops?|soldiers?|guards?(?!\s+(?:rails?|dogs?|houses?|towers?))|librarians?|doctors?|nurses?|janitors?|gardeners?|mechanics?|florists?|bakers?|musicians?|buskers?|performers?|singers?|dancers?|artists?|painters?|photographers?|locals|residents?|visitors?|diners?|patrons?|regulars|onlookers?|bystanders?)`;
const PERSON_RE = new RegExp(String.raw`\b${PERSON}\b(?!-)`, 'i');
const PERSON_TOKEN = new RegExp(`^${PERSON}$`, 'i');
/** Nouns that turn a person word into a modifier: "the guard rail", "the police tape", "the tourist trail", "the family photo". */
const COMPOUND_NOUNS = String.raw`(?:rails?|dogs?|houses?|towers?|cars?|stations?|tape|trails?|routes?|paths?|maps?|signs?|guides?|books?|cards?|menus?|tickets?|photos?|pictures?|portraits?|albums?|statues?|murals?|zones?|areas?|sections?|entrances?|exits?|doors?|gates?|booths?|desks?|counters?|stalls?|trucks?|vans?|bikes?|lanes?|seats?|uniforms?|magazines?)`;
const COMPOUND_NOUN = new RegExp(`^${COMPOUND_NOUNS}$`);
/**
 * A person as the object of a verb, but not a possessive naming whose thing it is
 * ("follow the busker's melody") unless that thing is how you follow them ("the
 * stranger's footsteps"), and not a modifier ("follow the tourist trail").
 */
const PERSON_OBJECT = String.raw`${PERSON}\b(?!-)(?!['’]s?\s+(?!(?:footsteps|steps|trail|path|route|tracks?|shadow|scent|lead|way|every)\b)[a-z])(?!\s+${COMPOUND_NOUNS}\b)`;

/** Words that, among the three words before a match (same clause), negate it. */
const NEGATIONS: ReadonlySet<string> = new Set([
  'no', 'not', 'never', 'nobody', 'none', 'nothing', 'without', 'nor', 'neither', 'avoid', 'avoiding', 'zero',
  "don't", 'dont', "doesn't", "isn't", "aren't", "won't", "can't", 'cannot', "shouldn't", "mustn't", "mustnt",
]);
/** Words that make a negated segment a list the next comma continues: "never photograph, film or record anyone". */
const LIST_WORDS: ReadonlySet<string> = new Set([
  'photograph', 'photographing', 'photo', 'photos', 'film', 'filming', 'record', 'recording', 'follow', 'following', 'tail',
  'tailing', 'stalk', 'stalking', 'shadow', 'shadowing', 'climb', 'climbing', 'hop', 'hopping', 'jump', 'jumping', 'trespass',
  'trespassing', 'swim', 'swimming', 'wade', 'wading', 'drink', 'drinking', 'alcohol', 'smoke', 'smoking', 'vape', 'vaping',
  'drugs', 'gamble', 'gambling', 'bets', 'betting', 'pranks', 'fire', 'fires', 'candles', 'matches', 'lighters', 'knives',
  'blades', 'roofs', 'rooftops', 'ledges', 'fences', 'walls', 'railings', 'traffic', 'tracks', 'touch', 'touching', 'lean',
  'leaning', 'balance', 'balancing',
]);
const negatedAt = (text: string, index: number) => negatedInClause(text, index, NEGATIONS, LIST_WORDS);

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+|\n+/).filter(Boolean);
}

/** Splits on clause punctuation (commas included), keeping each part's offset in `text`. */
function clauses(text: string): { clause: string; offset: number }[] {
  const out: { clause: string; offset: number }[] = [];
  let offset = 0;
  for (const clause of text.split(/[,;:()[\]{}"“”—–…]/)) {
    out.push({ clause, offset });
    offset += clause.length + 1; // every separator is one character
  }
  return out;
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
/** After these, a person is the recipient or author ("send a photo to someone"), or a new clause starts ("the bench where couples sit"). */
const STOP_WORDS = new Set(['to', 'for', 'from', 'by', 'about', 'than', 'where', 'when', 'whenever', 'while', 'which', 'whose', 'until']);
/** How far after a recording word a person may appear (in words) to count as its object. */
const RECORD_REACH = 4;
/** After a possessive person these are still the person: "the stranger's face". */
const BODY_WORDS = new Set([
  'face', 'faces', 'hand', 'hands', 'eye', 'eyes', 'smile', 'smiles', 'profile', 'portrait', 'portraits', 'silhouette', 'reflection',
  'back', 'head', 'hair', 'outfit', 'outfits', 'clothes', 'clothing', 'tattoo', 'tattoos', 'expression', 'expressions', 'feet', 'legs',
  'body', 'figure', 'likeness', 'phone', 'screen', 'laptop', 'bag', 'wallet', 'conversation', 'conversations', 'voice', 'kids',
  'children', 'baby', 'reaction', 'reactions',
]);
/** Words that begin a noun phrase rather than end one. */
const DETERMINERS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'some', 'any', 'every', 'each', 'both', 'all', 'one', 'two', 'three', 'four',
  'five', 'six', 'seven', 'eight', 'nine', 'ten', 'few', 'several', 'many', 'your', 'my', 'our', 'their', 'his', 'her', 'its',
  'random', 'other', 'another', 'more', 'most',
]);
/** After a person, these start a relative clause: "three things people left behind", "spots couples usually pick". */
const CLAUSE_VERBS = new Set([
  'left', 'leave', 'leaves', 'sat', 'sit', 'sits', 'use', 'used', 'uses', 'usually', 'often', 'always', 'sometimes', 'never', 'once',
  'drop', 'dropped', 'drops', 'lost', 'lose', 'forgot', 'forget', 'wear', 'wore', 'carry', 'carried', 'made', 'make', 'pass', 'passed',
  'park', 'parked', 'put', 'keep', 'kept', 'threw', 'throw', 'tossed', 'toss', 'wrote', 'write', 'bought', 'buy', 'ate', 'eat', 'drank',
  'read', 'see', 'saw', 'took', 'take', 'got', 'get', 'gave', 'give', 'brought', 'bring', 'have', 'had', 'would', 'will', 'can', 'could',
  'might', 'may', 'should', 'do', 'did', "don't", 'tend', 'hang', 'hung', 'gather', 'gathered', 'meet', 'met', 'rest', 'rested', 'stop',
  'stopped', 'chose', 'choose', 'pick', 'picked', 'ignore', 'ignored', 'miss', 'missed', 'walk', 'walked', 'wait', 'waited', 'tie',
  'tied', 'lock', 'locked', 'stick', 'stuck', 'paint', 'painted', 'scratch', 'scratched', 'carve', 'carved', 'need', 'needed', 'want', 'wanted',
]);
/** After "her", these show it is the object ("film her as she walks"), not a possessive ("photograph her dog"). */
const AFTER_OBJECT = new Set([
  'as', 'while', 'when', 'at', 'in', 'on', 'from', 'for', 'with', 'without', 'and', 'or', 'then', 'now', 'again', 'before', 'after',
  'until', 'so', 'because', 'if', 'to', 'secretly', 'quietly', 'quickly', 'up', 'out', 'here', 'there',
]);

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
  /** "barista's", "buskers'" */
  possessive: boolean;
  /** Offset of the word in the text that was tokenized (plus `base`). */
  index: number;
}

function tokenize(clause: string, base = 0): Token[] {
  const out: Token[] = [];
  for (const m of clause.toLowerCase().replace(/[’‘]/g, "'").matchAll(/[a-z'-]+/g)) {
    const quoted = m[0].startsWith("'");
    let word = m[0].replace(/^['-]+/, '');
    let possessive = false;
    if (/'s$/.test(word)) {
      word = word.slice(0, -2);
      possessive = true;
    } else if (/s'$/.test(word) && !quoted) {
      word = word.slice(0, -1);
      possessive = true;
    }
    word = word.replace(/['-]+$/, '');
    if (!word) continue;
    const index = base + m.index;
    if (!word.includes('-')) out.push({ word, part: false, possessive, index });
    else {
      const parts = word.split('-').filter(Boolean);
      parts.forEach((p, k) => out.push({ word: p, part: true, possessive: possessive && k === parts.length - 1, index }));
    }
  }
  return out;
}

/** Whether the recording word at `i` has a person as its object within reach. */
function recordedPerson(tokens: Token[], i: number, pronounsArePeople: boolean): boolean {
  for (let j = i + 1; j <= Math.min(tokens.length - 1, i + RECORD_REACH); j++) {
    const t = tokens[j];
    if (STOP_WORDS.has(t.word)) return false;
    if (NEGATIONS.has(t.word)) return false; // "photos without people", "no people in the frame"
    const pronoun = pronounsArePeople && PRONOUN.has(t.word);
    if (t.part || !(PERSON_TOKEN.test(t.word) || pronoun)) continue;
    const next = tokens[j + 1];
    // "the barista's latte art", "the neighbour's cat", "her dog": whose thing it is, not who is recorded.
    if (next && (t.possessive || (t.word === 'her' && !AFTER_OBJECT.has(next.word))) && !BODY_WORDS.has(next.word)) continue;
    // "the guard rail", "the family photo": the person word only describes a thing.
    if (!pronoun && next && !next.part && COMPOUND_NOUN.test(next.word)) continue;
    // "three things people left behind": a person who starts a relative clause after a noun.
    if (!pronoun && next && CLAUSE_VERBS.has(next.word) && j - 1 > i && !DETERMINERS.has(tokens[j - 1].word)) continue;
    return true;
  }
  return false;
}

function recordsPeople(text: string): boolean {
  for (const sentence of sentences(text.replace(/passers?-by/gi, 'passersby'))) {
    // A pronoun ("record them") only counts when the sentence names a person ("find a busker and record them").
    const pronounsArePeople = PERSON_RE.test(sentence);
    for (const { clause, offset } of clauses(sentence)) {
      const tokens = tokenize(clause, offset);
      const words = tokens.map((t) => t.word);
      for (let i = 0; i < tokens.length; i++) {
        if (!isRecordingWord(words, i)) continue;
        if (negatedAt(sentence, tokens[i].index)) continue; // "never photograph strangers", "never photograph, film or record anyone"
        if (recordedPerson(tokens, i, pronounsArePeople)) return true;
      }
    }
  }
  return false;
}

/** Recording a conversation: "record the conversation at the next table" — not a conversation with yourself. */
const CONVERSATION_PATTERNS: RegExp[] = [
  /\b(?:record|records|recording|recorded|tape|taping|film|filming|livestream|livestreaming)\s+(?:the|a|an|their|other\s+people's|people's|strangers'?|someone's|somebody's|everyone's|any)\s+(?:[\w'-]+\s+){0,2}?(?:conversations?|chats?|discussions?|arguments?|phone\s+calls?|calls?|gossip)\b(?!\s+with\s+yourself)/i,
];

// ── covert surveillance ──────────────────────────────────────────────

const COVERT_ACT = /\b(?:secretly|covertly|sneakily|stealthily)\s+(?:[\w'-]+\s+){0,3}?(?:photograph\w*|photos?|pics?|pictures?|snap\w*|film\w*|record\w*|videos?|follow(?:s|ed|ing)?|tail\w*|shadow\w*|stalk\w*|watch\w*|observ\w*|track\w*)\b/gi;

/** "Secretly photograph the café regulars" — a covert act needs a person within reach: "secretly photograph three red objects" is a game. */
function covertlyWatchesPeople(text: string): boolean {
  for (const sentence of sentences(text.replace(/passers?-by/gi, 'passersby'))) {
    const pronounsArePeople = PERSON_RE.test(sentence);
    for (const m of sentence.matchAll(COVERT_ACT)) {
      if (negatedAt(sentence, m.index)) continue;
      const rest = sentence.slice(m.index + m[0].length).split(/[,;:()[\]{}"“”—–…]/)[0];
      const tokens = tokenize(rest).slice(0, 5);
      if (tokens.some((t) => !t.part && (PERSON_TOKEN.test(t.word) || (pronounsArePeople && PRONOUN.has(t.word))))) return true;
    }
  }
  return false;
}

// ── following people ─────────────────────────────────────────────────

const FOLLOW_PATTERNS: RegExp[] = [
  // follow / tail / stalk / trail + (det) + up to two words + a person: "follow the woman in the red coat", "tail two kids"
  new RegExp(
    String.raw`\b(?:follow(?:s|ed|ing)?|tail(?:s|ed|ing)?|stalk(?:s|ed|ing)?|trail(?:s|ed|ing)?)\s+(?:(?:a|an|the|that|this|one|some|any|two|three|those|these|random|your|another)\s+)?(?:(?!of\b)[\w'-]+\s+){0,2}?${PERSON_OBJECT}`,
    'i',
  ),
  // "shadow" is also a noun ("the shadow people cast"), so it needs a determiner: "shadow the man"
  new RegExp(String.raw`\bshadow(?:s|ed|ing)?\s+(?:a|an|the|that|this|one|some|any|those|these|random)\s+(?:(?!of\b)[\w'-]+\s+){0,2}?${PERSON_OBJECT}`, 'i'),
  /\b(?:tail(?:s|ed|ing)?|shadow(?:s|ed|ing)?|stalk(?:s|ed|ing)?)\s+(?:them|him|her)\b/i,
  /\bfollow(?:s|ed|ing)?\s+(?:him|her)\b(?!\s+(?:advice|lead|directions?|tips?|instructions?|recipes?|example|gaze|eyes|finger|map|recommendations?|suggestions?|rules?|steps|story|account|blog))/i,
  // "stay ten steps behind them", "keep a few paces behind the man"
  new RegExp(
    String.raw`\b(?:stay|stays|staying|keep|keeps|keeping|walk|walks|walking|remain|remaining|trail|trailing|lurk|lurking|hang\s+back)\s+(?:about\s+|exactly\s+|roughly\s+|around\s+|at\s+least\s+|just\s+|only\s+)?(?:\d+|a\s+few|a\s+couple\s+of|several|some|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|fifty)\s+(?:steps|paces|metres|meters|feet|yards|strides|m)\s+behind\s+(?:them|him|her|(?:(?:a|an|the|that|this|one|some|any|those|these|your)\s+)?(?:(?!of\b)[\w'-]+\s+){0,2}?${PERSON_OBJECT})`,
    'i',
  ),
  // "walk behind the woman with the red umbrella"
  new RegExp(
    String.raw`\b(?:walk|walks|walking|stay|staying|keep|keeping|stroll|strolling|trail|trailing|creep|creeping|tiptoe|tiptoeing|sneak|sneaking|lurk|lurking)\s+(?:right\s+|closely\s+|just\s+|quietly\s+|close\s+|directly\s+|silently\s+)?behind\s+(?:(?:a|an|the|that|this|one|some|any|those|these|random|your)\s+)?(?:(?!of\b)[\w'-]+\s+){0,2}?${PERSON_OBJECT}`,
    'i',
  ),
  // "copy her pace", "match his stride"
  /\b(?:copy|copying|match|matching|mirror|mirroring|mimic|mimicking|imitate|imitating)\s+(?:her|his)\s+(?:pace|steps|stride|walk|gait|moves|route|speed)\b/i,
];

/** "Pick someone … and follow them" / "… walk behind them": a pronoun counts when the sentence names a person. */
function followsThem(text: string): boolean {
  return sentences(text).some((s) => {
    if (!PERSON_RE.test(s)) return false;
    for (const m of s.matchAll(/\b(?:follow(?:s|ed|ing)?|(?:walk|stay|keep|stroll|trail|creep|tiptoe|sneak|lurk)\w*\s+(?:right\s+|closely\s+|just\s+|quietly\s+|close\s+|directly\s+)?behind)\s+them\b/gi)) {
      if (!negatedAt(s, m.index)) return true;
    }
    return false;
  });
}

// ── drinking venues ──────────────────────────────────────────────────

/** "the bar" as a place — not "a bar of soap" or "the progress bar". */
const BAR_VENUE =
  /\b(?:at|to|in|into|inside|visit|find|enter|from)\s+(?:a|the|your|any|one)\s+(?:(?:nearest|closest|local|corner|neighbou?rhood|hotel|cocktail|wine|beer|sports|rooftop|karaoke|piano|dive|whisk(?:e)?y)\s+)?bars?\b(?!\s+(?:of|code|codes|chart|charts|graph|graphs))/gi;
/** In a café, "the bar" is the counter: "sit at the bar in the café and watch the barista". */
const CAFE_CONTEXT = /\b(?:caf[eé]s?|coffee|espresso|baristas?|lattes?|cappuccinos?|tea|juice|smoothies?|milkshakes?|ice[\s-]?cream|bakery|breakfast|salad|sushi|snacks?)(?![a-z])/i;
const DRINKS_BAR = /\b(?:cocktail|wine|beer|sports|karaoke|dive|whisk(?:e)?y|hotel)\s+bars?\b/i;

function drinkingVenue(text: string): boolean {
  for (const sentence of sentences(text)) {
    if (CAFE_CONTEXT.test(sentence) && !DRINKS_BAR.test(sentence)) continue;
    for (const m of sentence.matchAll(BAR_VENUE)) if (!negatedAt(sentence, m.index)) return true;
  }
  return false;
}

// ── the rules ────────────────────────────────────────────────────────

const WATER = String.raw`(?:sea|ocean|water|waves|surf|river|lake|pond|stream|fountain|pool|canal|reservoir|shallows)`;
/** A water word used as a modifier names a place beside the water: "the river bridge", "the sea wall", "the lake path". */
const NOT_IN_WATER = String.raw`(?!['’]s\b|\s+(?:bridges?|banks?|sides?|walks?|paths?|promenades?|front|views?|edges?|walls?|crossings?|beds?|cruises?|ferry|ferries|taxis?|bus|boats?|tours?|trips?|parks?|gardens?|caf[eé]s?|restaurants?|stalls?|signs?|of)\b)`;
/** Imperative motion verbs only: "wade into the fountain" is an instruction, "kids splashing in the fountain" is a description. */
const INTO_WATER_VERBS = String.raw`(?:walk|wade|step|jump|dive|go|get|run|climb|wander|head|paddle|plunge|splash|hop|slip)`;
/**
 * Where an imperative verb can stand: the start of a sentence or clause, or after "and", "then", "you"…
 * A lookbehind, so a match starts at the verb and its negation is judged there.
 */
const IMPERATIVE = String.raw`(?<=^|[.!?;:,—–(]\s*|\b(?:and|then|or|you|now|first|next|finally|just|quickly|carefully|slowly|please|simply|go|try\s+to)\s+)`;
/** "climbing" or "jumping" only counts after these: "try climbing the fence", not "ivy climbing the wall". */
const ING_AFTER = String.raw`(?:go|goes|try|tries|trying|start|starting|keep|keeping|you're|you\s+are|by|enjoy|love)\s+`;
const BARRIER = String.raw`(?:fences?|walls?|gates?|railings?|barriers?|barricades?|hedges?)`;

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
    // The user going onto a roof — not a mention ("satellites photographed every rooftop") or objects on one
    // ("count the solar heaters on the rooftops"). Rooftop gardens, terraces and cafés are public places.
    reason: 'involves going onto a roof',
    patterns: [
      new RegExp(
        String.raw`${IMPERATIVE}(?:go|get|climb|step|walk|head|run|hop|jump|sneak|wander|venture|clamber|crawl|stand|sit|lie|perch|dance|stroll|make\s+your\s+way)\s+(?:back\s+)?(?:up\s+)?(?:on(?:to)?|up\s+to|up\s+on|out\s+on(?:to)?|out\s+to|onto)\s+(?:(?:a|the|your|any|that|this)\s+)?(?:[\w'-]+\s+)?roof(?:top)?s?\b(?!\s+(?:gardens?|terraces?|caf[eé]s?|restaurants?|pools?|cinemas?|decks?|lounges?|views?))`,
        'i',
      ),
      /\b(?:stairs|steps|ladder|lift|elevator)\s+(?:all\s+the\s+way\s+)?up\s+(?:to|onto)\s+(?:the|a|your)\s+roof(?:top)?\b(?!\s+(?:gardens?|terraces?|caf[eé]s?|restaurants?|pools?|decks?|lounges?))/i,
      /\b(?:step|walk|go|get|stand|sit|lean|peer|run|climb|head|move|edge|inch|perch|dangle)\w*\s+(?:out\s+)?(?:to|onto|on|at|along|over|near|up\s+to|right\s+up\s+to)\s+(?:the\s+)?(?:very\s+)?(?:roof(?:top)?(?:['’]s)?\s+edges?|edges?\s+of\s+(?:a|the|your|any|that)\s+(?:[\w'-]+\s+)?roof(?:top)?)\b/i,
    ],
  },
  {
    // The user on a ledge or a parapet (a window ledge is fine) — not "pigeons sitting on the ledges".
    reason: 'involves ledges or parapets',
    patterns: [
      new RegExp(
        String.raw`${IMPERATIVE}(?:walk|step|stand|sit|climb|perch|balance|lie|crawl|edge|inch|hop|jump|get|go|wander|stroll|creep|tiptoe)\s+(?:(?:out|up|back|down|carefully|slowly)\s+)?(?:on(?:to)?|along|across|over|out\s+on(?:to)?)\s+(?:a|an|the|that|this|its|any|your)\s+(?:[\w'-]+\s+){0,2}?(?<!window[- ]?)(?:ledges?|parapets?)\b`,
        'i',
      ),
    ],
  },
  {
    // Instructions only: "climb the fence", "try climbing the tree" — not "ivy climbs the old wall".
    reason: 'involves climbing structures',
    patterns: [
      new RegExp(
        String.raw`\b(?:climb|${ING_AFTER}climbing)\s+(?:up\s+onto\s+|up\s+into\s+|up\s+|onto\s+|over\s+|into\s+|on\s+|to\s+the\s+top\s+of\s+)?(?:a\s+|an\s+|the\s+|that\s+|this\s+|your\s+|any\s+)?(?:[\w'-]+\s+)?(?:fences?|walls?|roofs?|buildings?|scaffold\w*|poles?|trees?|bridges?|railings?|gates?|statues?|monuments?|lamp\s?posts?|cranes?|towers?|ladders?|balcon(?:y|ies)|cliffs?)\b`,
        'i',
      ),
      new RegExp(
        String.raw`\b(?:hop|jump|scale|vault|leap|clamber|straddle|${ING_AFTER}(?:hopping|jumping|scaling|vaulting|leaping|clambering))\s+(?:over\s+|across\s+|onto\s+|on\s+|up\s+|through\s+)?(?:a\s+|an\s+|the\s+|that\s+|this\s+|your\s+|any\s+|its\s+)?(?:[\w'-]+\s+)?${BARRIER}\b`,
        'i',
      ),
    ],
  },
  {
    reason: 'involves balancing on walls, railings or edges',
    patterns: [
      // walking along the top of a wall or railing
      /\b(?:walk|walking|balance|balancing|stand|standing|tiptoe|tiptoeing|step|stepping|run|running|hop|hopping|teeter|teetering|sit|sitting)\s+(?:along|across|on|onto|over|up\s+on)\s+(?:the\s+)?top\s+of\s+(?:a|an|the|that|this|your|any)\s+(?:[\w'-]+\s+){0,2}?(?:walls?|railings?|rails?|fences?|parapets?|bridges?|barriers?|balustrades?|gates?)\b/i,
      // balancing on a wall, a railing or an edge (not a curb)
      /\b(?:balance|balancing|tightrope|tiptoe|tiptoeing)\s+(?:along|on|across|over)\s+(?:a|an|the|that|this|your|any)\s+(?:[\w'-]+\s+){0,2}?(?:walls?|railings?|rails?|fences?|parapets?|edges?|ledges?|barriers?|balustrades?)\b/i,
      /\b(?:walls?|railings?|rails?|fences?)\s+like\s+a\s+tightrope\b/i,
      // leaning over a railing, a parapet or an edge; leaning out of a window
      /\blean(?:s|ed|ing)?\s+(?:out\s+|far\s+|way\s+)?over\s+(?:a|an|the|that|this|your|any)\s+(?:[\w'-]+\s+){0,2}?(?:railings?|rails?|balustrades?|barriers?|parapets?|edges?|walls?|balcon(?:y|ies)|bridges?|ledges?)\b/i,
      /\blean(?:s|ed|ing)?\s+(?:far\s+|way\s+)?out\s+(?:of|over|from)\s+(?:a|an|the|that|this|your)\s+(?:[\w'-]+\s+)?(?:windows?|balcon(?:y|ies))\b/i,
      // sitting or standing on the edge of a drop
      /\b(?:sit|sitting|stand|standing|perch|perching|balance|balancing|dangle|dangling)\s+(?:right\s+)?(?:on|at|over)\s+(?:the\s+)?(?:very\s+)?edge\s+of\s+(?:a|the|that|this|your)\s+(?:[\w'-]+\s+)?(?:roofs?|rooftops?|cliffs?|bridges?|balcon(?:y|ies)|platforms?|drops?|walls?|stairwells?)\b/i,
    ],
  },
  {
    // Standing in the road or stepping into traffic — not "turn into the street that smells of bread".
    reason: 'involves traffic',
    patterns: [
      /\b(?:stand|standing|lie|lying|sit|sitting|wait|waiting|dance|dancing|pose|posing|play|playing|stop|stopping|kneel|kneeling)\s+(?:down\s+)?(?:in\s+the\s+(?:middle\s+of\s+(?:the|a)\s+)?(?:road|street|highway|motorway|carriageway|intersection|junction|crossroads|bike\s+lane|bus\s+lane|tram\s+lane)|on\s+the\s+(?:road|highway|motorway|carriageway))\b(?!\s+(?:corners?|benches?|signs?|lamps?|lights?|art|food|markets?|musicians?|performers?|names?|level|views?|stalls?|vendors?|caf[eé]s?|side|parties|party|festival|fair))/i,
      /\b(?:lie|lying)\s+down\s+on\s+the\s+(?:street|pavement|sidewalk|crossing)\b/i,
      /\b(?:step|stepping|run|running|dash|dashing|dart|darting|jump|jumping|leap|leaping|rush|rushing|sprint|sprinting|walk|walking|wander|wandering|dance|dancing|weave|weaving|cycle|cycling)\s+(?:out\s+)?(?:into|in|through|between|onto)\s+(?:the\s+)?(?:oncoming\s+|moving\s+|busy\s+|heavy\s+|rush-hour\s+)?(?:traffic|cars)\b/i,
      /\b(?:step|stepping|run|running|dash|dashing|dart|darting|jump|jumping|leap|leaping|rush|rushing|sprint|sprinting)\s+(?:out\s+)?(?:into|onto)\s+(?:the|a)\s+(?:busy\s+)?(?:road|street|highway|motorway|intersection|junction)\b/i,
    ],
  },
  {
    reason: 'involves covert surveillance of people',
    patterns: [
      /\bwithout\s+(?:them|him|her|anyone|anybody|people|the\s+(?:person|stranger|people|owner)|(?:the\s+)?(?:strangers?|passersby|passers?-by))\s+(?:noticing|knowing|seeing|realizing|realising|spotting|looking)\b/i,
      /\beavesdrop(?:s|ped|ping)?\b|\blisten(?:s|ing)?\s+in\s+on\b/i,
    ],
    test: covertlyWatchesPeople,
  },
  { reason: 'involves recording people', patterns: CONVERSATION_PATTERNS, test: recordsPeople },
  { reason: 'involves following people', patterns: FOLLOW_PATTERNS, test: followsThem },
  {
    reason: 'involves alcohol',
    patterns: [
      /(?<!non-?|non\s)\balcohol(?:ic)?\b(?!-free)/i,
      // beer as a drink — not root or ginger beer, or a bottle cap "(beer, soda, anything)"
      /\b(?:a|another|one|two|some|cold|draft|draught|craft|local|bottled|canned|your|the|first)\s+(?:(?:cold|ice-cold|draft|draught|craft|local|small|big|first)\s+)?(?<!root\s|ginger\s)beers?\b(?!\s+(?:labels?|caps?|bottle\s+caps?|coasters?|ads?|adverts?|posters?|signs?))/i,
      /(?<!root\s|ginger\s)\bbeers?\s+(?:gardens?|halls?|tents?|festivals?|pong|taps?)\b/i,
      /\b(?:drink|drinks|drinking|order|ordering|buy|buying|have|having|grab|grabbing|sip|sipping|share|sharing|pour|pouring|open|opening|crack|cracking|chug|chugging|enjoy|enjoying)\s+(?:a\s+|some\s+|the\s+|your\s+|one\s+|another\s+)?(?:[\w'-]+\s+)?(?<!root\s|ginger\s)beers?\b/i,
      /\b(?:pints?|glass(?:es)?|bottles?|cans?|jugs?|pitchers?|mugs?)\s+of\s+(?:[\w'-]+\s+)?(?<!root\s|ginger\s)beer\b/i,
      /\b(?:vodka|whisk(?:e)?y|tequila|cocktails?|liquor|liqueurs?|champagne|prosecco|arak|ouzo|brandy|cognac)\b/i,
      // wine as a drink — not "wine experts weep" or "a wine label"
      /\b(?:glass|glasses|bottle|bottles|cup|sip|carafe|jug|splash)\s+of\s+(?:(?:red|white|rosé|rose|house|sparkling)\s+)?wine\b/i,
      /\b(?:drink|drinks|drinking|order|ordering|sip|sipping|taste|tasting|pour|pouring|buy|buying|share|sharing|enjoy|enjoying|open|opening)\s+(?:a\s+|some\s+|the\s+|your\s+|one\s+)?(?:(?:red|white|house|sparkling|cheap|local)\s+)?wines?\b/i,
      /\bwine\s*-?\s*(?:bars?|tasting|shops?|stores?|lists?|cellars?)\b/i,
      // shots of alcohol — not "three shots of the same doorway"
      /\bdo(?:ing)?\s+(?:a\s+|some\s+|two\s+|three\s+|more\s+)?shots\b/i,
      /\b(?:vodka|tequila|whisk(?:e)?y|j[äa]ger\w*|alcohol|liquor|arak)\s+shots?\b|\bshots?\s+of\s+(?:vodka|tequila|whisk(?:e)?y|alcohol|liquor|arak|spirits)\b/i,
      /\b(?:drink(?:s|ing)?|bottles?\s+of|glass(?:es)?\s+of|shots?\s+of)\s+spirits\b/i,
      /\bpubs?\b|\bnightclubs?\b|\b(?:liquor|bottle)\s+(?:stores?|shops?)\b|\boff-licen[cs]es?\b/i,
    ],
    test: drinkingVenue,
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
      // a lighter (the device) — not "a lighter shade of blue", "which is the lighter?" or "the lighter it feels"
      /\b(?:cigarette|gas|pocket|plastic|kitchen|bic|zippo|disposable|butane)\s+lighters?\b|\blighter\s+(?:fluid|flames?)\b/i,
      /\b(?:a|your|my|their|his|her|some)\s+lighters?\b(?=\s*(?:$|[.,;:!?)"”…])|\s+(?:to|with|from|in|on|for|that|which|into|onto|under|near|beside|and|or)\b)/i,
      /\b(?:use|using|grab|grabbing|take|taking|hold|holding|flick|flicking|click|clicking|strike|striking|borrow|borrowing|find|bring|get|spark|sparking|need|pass|buy|with)\s+(?:a|the|your|my|their|his|her|some|an\s+old|a\s+cheap)\s+(?:[\w'-]+\s+)?lighters?\b(?!\s+(?:shade|colou?r|tone|touch|load|weight|version|side|note|mood|step|hue|grey|gray|blue|green|pink|yellow|brown|red))/i,
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
    // gambling for money — not "I am betting you never noticed", a "lottery kiosk", "a bet with yourself" or "place your bets: which pigeon…"
    reason: 'involves gambling',
    patterns: [
      /\bgambling\b|\bcasinos?\b|\bslot\s+machines?\b|\bscratch[- ]?cards?\b/i,
      /\b(?:place|places|placing|make|making)\s+(?:a|your|some)\s+(?:bets?|wagers?)\b(?=[^.!?;]*?(?:₪|\d|\b(?:money|cash|coins?|shekels?|dollars|euros|bucks|bookies?|bookmakers?|odds)\b))/i,
      /\bbet(?:s|ting)?\s+(?:money|cash|₪|\d|real\s+money|your\s+(?:money|cash|savings|allowance|pocket\s+money)|(?:a\s+)?(?:few|some|ten|five|twenty)\s+(?:shekels?|coins|dollars|euros|bucks))/i,
      /\bgambl(?:e|es|ed)\s+(?:away\s+)?(?:money|cash|₪|\d|your\s+(?:money|cash|savings|allowance))/i,
      /\b(?:buy|buys|buying|bought|get|purchase|play|plays|playing|scratch)\s+(?:a\s+|the\s+|some\s+|your\s+)?lottery\b/i,
      /\bwager(?:s|ed|ing)?\s+(?:money|cash|₪|\d|real\s+money|your\s+(?:money|cash|savings|allowance))/i,
    ],
  },
  { reason: 'involves pranks', patterns: [/\b(?:prank|pranking|pranks)\b/i] },
  {
    // the user going into water — not "count the ducks swimming", "toss a leaf into the water", "you swim upstream through the crowd"
    reason: 'involves water hazards',
    patterns: [
      /(?<=^|[.!?;:—–(]\s*|\b(?:then|and|or|go|going|went|let's|can|could|should|must|we)\s+)swim(?:s|ming)?\b(?!\s+(?:upstream|against\s+the\s+(?:tide|current|crowd|stream|flow)|through\s+(?:the\s+)?(?:crowd|people|traffic|rush)))/i,
      /\b(?:take|have|go\s+for|for|grab)\s+a\s+(?:quick\s+|short\s+|cold\s+|brief\s+)?(?:swim|dip|paddle)\b/i,
      new RegExp(String.raw`\b${INTO_WATER_VERBS}\s+(?:straight\s+|right\s+|all\s+the\s+way\s+|back\s+)?(?:in|into|in\s+to|through|across)\s+(?:the|a|that|this|any)\s+(?:[\w'-]+\s+)?${WATER}\b${NOT_IN_WATER}`, 'i'),
      /\b(?:go|goes|going|went|try|trying|start|starting|keep|keeping|you're|you\s+are|by)\s+(?:wading|paddling|diving|splashing|swimming|plunging)\b/i,
      /\b(?:dip|dipping|soak|soaking|dangle|dangling)\s+(?:your|both)\s+(?:feet|toes|legs)\b/i,
      new RegExp(String.raw`\b(?:dip|put|stick|soak|dangle|plunge)\s+(?:your|both)\s+(?:feet|toes|legs|hands?)\s+(?:in|into)\s+(?:the|a|that|this)\s+(?:[\w'-]+\s+)?${WATER}\b`, 'i'),
      // "with your feet dangling over the water"
      new RegExp(String.raw`\b(?:feet|legs|toes)\s+(?:dangling|hanging|swinging|dangle|hang|dipped|dipping|trailing)\s+(?:over|off|above|into|in)\s+(?:the|a|that|this)\s+(?:[\w'-]+\s+)?(?:${WATER}|edge|side)\b`, 'i'),
      // "sit on the edge of the pier" (deep water; the rim of a fountain is fine)
      /\b(?:sit|sitting|stand|standing|perch|perching|lie|lying|balance|balancing|crouch|crouching|kneel|kneeling)\s+(?:right\s+)?(?:on|at)\s+(?:the\s+)?(?:very\s+)?edge\s+of\s+(?:the|a|that|this)\s+(?:[\w'-]+\s+)?(?:piers?|docks?|jett(?:y|ies)|quays?|wharf|harbou?r\s+walls?|breakwaters?|sea\s*walls?|river|canal|lake|reservoir|sea|ocean)\b/i,
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

/** Returns a list of safety problems ("the episode involves alcohol (…)"), empty when clean. Model text is JSON-quoted. */
export function screenAdventure(adv: Adventure): string[] {
  const problems = new Set<string>();
  for (const text of allText(adv)) {
    for (const reason of screenText(text)) problems.add(`Safety: the episode ${reason} (${quoteModelText(text, 80)})`);
  }
  return [...problems];
}
