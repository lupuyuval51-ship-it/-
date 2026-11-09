/**
 * Heuristic checks that an AI episode keeps the user's hard constraints in its
 * TEXT, not just in its metadata. `aiEpisodeToAdventure` copies setting and
 * company from the prefs and the model declares its own minutes and cost, so
 * `checkPrefsFit` alone cannot see "buy a ₪45 ticket" in a free episode, "take
 * the bus" at home, or "split your crew" for someone alone.
 *
 * A problem triggers the Director's repair round, so every message tells the
 * model exactly what to change. The cue lists are deliberately conservative
 * (instructions, not mentions): a cue is ignored when it is negated ("no need to
 * buy anything"), imagined ("imagine you could order anything"), quoted from a
 * sign ('Buy one, get one free'), or about objects rather than people ("sort them
 * in groups"). Every curated episode is tested against them.
 */
import { KINDS } from '../shared/constants.ts';
import { enumeratePaths, pathMinutes } from '../shared/graph.ts';
import type { Adventure, Kind, Prefs, StageNode } from '../shared/types.ts';
import { clauseBefore, hypotheticalAt, imperativeBefore, insideQuotes, negatedAt, quoteModelText, wordsOf } from './text.ts';

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
  /** Written for the model's repair round. Model text in it is JSON-quoted (see quoteModelText). */
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

/** A pattern (non-global) that flags an instruction, and the matches of it that are not one. */
export interface Cue {
  re: RegExp;
  /** True when this match is not an instruction (imagined, quoted, about objects…). */
  skip?: (text: string, index: number, match: string) => boolean;
}

const NEGATIONS: ReadonlySet<string> = new Set(['no', 'not', 'never', 'nothing', 'without', 'nor', "don't", 'dont', "doesn't", "isn't", "won't", "can't", 'cannot', 'zero']);
/** Words that make a negated segment a list the next comma continues: "no buying, ordering or paying". */
const LIST_WORDS: ReadonlySet<string> = new Set([
  'buy', 'buying', 'buys', 'purchase', 'purchases', 'purchasing', 'order', 'ordering', 'orders', 'pay', 'paying', 'payment',
  'spend', 'spending', 'ticket', 'tickets', 'price', 'prices', 'fee', 'fees', 'fare', 'fares', 'cost', 'costs', 'money', 'cash',
  'shopping', 'entry', 'admission', 'rent', 'renting', 'rental', 'hire', 'hiring', 'coins', 'shekels',
  'leave', 'leaving', 'go', 'going', 'walk', 'walking', 'travel', 'travelling', 'traveling', 'bus', 'buses', 'train', 'trains',
  'taxi', 'taxis', 'car', 'cars', 'driving', 'ride', 'rides', 'riding', 'outside', 'outdoors', 'trip', 'trips',
  'crew', 'friends', 'friend', 'team', 'teams', 'group', 'groups', 'partner', 'partners', 'players', 'others',
]);

const GLOBAL = new Map<RegExp, RegExp>();
function globalOf(re: RegExp): RegExp {
  let g = GLOBAL.get(re);
  if (!g) {
    g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    GLOBAL.set(re, g);
  }
  return g;
}

/** The first cue in `text` that is an instruction (not negated, not skipped), or null. */
function findCue(text: string, cues: readonly Cue[], negations: ReadonlySet<string> = NEGATIONS): string | null {
  for (const cue of cues) {
    for (const m of text.matchAll(globalOf(cue.re))) {
      if (negatedAt(text, m.index, negations, LIST_WORDS)) continue;
      if (cue.skip?.(text, m.index, m[0])) continue;
      return m[0];
    }
  }
  return null;
}

/**
 * Where a base-form verb is an instruction to the user ("Grab a coffee", "…, then hop on the bus",
 * "feel free to visit the museum"), not what others do ("commuters grabbing a coffee").
 */
const INSTRUCTION = imperativeBefore(['to']);

/** The rest of the clause after a match (up to the next clause break). */
const clauseAfter = (text: string, index: number, match: string) => /^[^.!?;:()[\]{}"“”—–…]*/.exec(text.slice(index + match.length))?.[0] ?? '';

// ── free budget ──────────────────────────────────────────────────────

/** A purchase word that is imagined ("you'd buy", "imagine you could order") or quoted from a sign. */
const notAPurchase = (text: string, index: number) => hypotheticalAt(text, index) || insideQuotes(text, index);

/**
 * Tickets that cost nothing ("a free ticket", "free bus tickets") or are found objects ("an old
 * ticket", "a crumpled bus ticket", "the ticket in your bag"). "Free" only counts right before the
 * ticket: "feel free to buy a ticket" is still a purchase.
 */
const OLD_THINGS: ReadonlySet<string> = new Set([
  'old', 'used', 'expired', 'torn', 'crumpled', 'creased', 'forgotten', 'faded', 'lost', 'discarded', 'found', 'stray',
  'abandoned', 'yellowed', 'folded', "yesterday's", "someone's", 'souvenir', 'vintage', 'ancient',
]);
function freeOrFoundTicket(text: string, index: number, match: string): boolean {
  const before = wordsOf(clauseBefore(text, index).split(',').pop() ?? '').slice(-3);
  if (before.slice(-2).includes('free')) return true;
  if (before.some((w) => OLD_THINGS.has(w))) return true;
  return /^\s+(?:[\w'-]+\s+){0,4}?(?:from|in|out\s+of)\s+(?:your|a|an|the)\s+(?:old\s+)?(?:bag|pocket|wallet|drawer|coat|jacket|purse|notebook|book|box|album)\b/i.test(
    clauseAfter(text, index, match),
  );
}

/** Purchases, prices and tickets. Not "a ticket stub" (a found object), "shuffle the order", "a cashier". */
export const PURCHASE_CUES: readonly Cue[] = [
  { re: /₪\s?\d|\d\s?₪/ },
  { re: /\b\d+(?:[.,]\d+)?\s?(?:nis|ils|shekels?|shekalim|agorot)\b/i },
  { re: /\b(?:shekels?|shekalim|agorot)\b/i, skip: notAPurchase },
  { re: /\bNIS\b/ },
  { re: /\b(?:buy|buys|buying|bought|purchase|purchases|purchasing|purchased)\b/i, skip: notAPurchase },
  {
    re: /\b(?:pay|pays|paying|paid)\s+(?:(?:for|with|at|by)\b|the\s+(?:bill|fare|fee|entry|entrance|cashier|vendor|driver)\b|a\s+(?:fee|fare|deposit)\b|cash\b|money\b|₪|\d)/i,
    skip: notAPurchase,
  },
  {
    re: /\b(?:order|orders|ordering|ordered)\s+(?:a|an|one|two|some|something|anything|yourself|food|coffee|tea|drinks?|takeaway|take-?out|dessert|lunch|dinner|breakfast|the\s+(?:cheapest|special|soup|dish|coffee|tea|cake|pastry|meal|drink))\b/i,
    skip: notAPurchase,
  },
  { re: /\bplace\s+an?\s+order\b/i, skip: notAPurchase },
  {
    re: /\btickets?\b(?!\s*(?:stubs?|machines?|booths?|offices?|barriers?|gates?|inspectors?|validators?)\b)/i,
    skip: (text, index, match) => notAPurchase(text, index) || freeOrFoundTicket(text, index, match),
  },
  { re: /\b(?:entry|entrance|admission|cover)\s+(?:fees?|charges?)\b/i },
  // "spend" is money only with money words: "spend some cash", never "spend 3 minutes" or "spend 30 seconds"
  // (amounts in ₪ or shekels are caught above).
  {
    re: /\b(?:spend|spends|spending|spent)\s+(?:(?:a\s+(?:little|bit\s+of|few|couple\s+of)|some|any|your|real|the|all\s+your|no\s+more\s+than|less\s+than|at\s+most|up\s+to)\s+)?(?:money|cash|coins|shekels?|shekalim|nis|ils|allowance|pocket\s+money|savings)\b/i,
    skip: notAPurchase,
  },
  { re: /\b(?:rent|rents|renting|rented|hire|hiring|hired)\s+(?:a|an|the)\s+(?:bike|scooter|boat|kayak|pedal\s*boat|car|locker|board)\b/i, skip: notAPurchase },
  { re: /\b(?:costs?|priced?)\s+(?:about\s+|around\s+|only\s+|just\s+)?(?:₪|\d)/i, skip: notAPurchase },
  { re: /\bat\s+the\s+(?:till|checkout|cash\s+register|register)\b/i },
];

const FOOD = String.raw`(?:coffees?|espressos?|lattes?|cappuccinos?|teas?|hot\s+chocolates?|pastry|pastries|croissants?|burekas?|rugelach|ice[\s-]?creams?|gelatos?|popsicles?|falafels?|shawarmas?|sabich|hummus|pitas?|bagels?|sandwich(?:es)?|drinks?|sodas?|juices?|smoothies?|lemonades?|snacks?|cookies?|cakes?|muffins?|donuts?|doughnuts?|sufganiyah|pizzas?|fries|sweets|desserts?)`;
/** Food and drink from home, a bag or a water fountain is free. */
const FREE_SOURCE =
  /^\s+(?:[\w'-]+\s+){0,4}?(?:(?:from|in|out\s+of)\s+(?:the|your|a)\s+(?:fridge|freezer|kitchen|cupboard|pantry|bag|backpack|pocket|drawer|lunchbox|home|house|flask|thermos|bottle|water\s+fountain|tap)\b|(?:you|that\s+you)\s+(?:brought|packed|made)\b|from\s+home\b)|^\s+of\s+water\b/i;
const PAID_PLACE = String.raw`(?:museums?|cinemas?|movie\s+theat(?:er|re)s?|caf[eé]s?|coffee\s+shops?|bakery|bakeries|restaurants?|ice[\s-]?cream\s+(?:shops?|parlou?rs?)|patisseries?|zoo|aquarium|escape\s+room|arcade)`;

/**
 * Spending that never names a price, for someone outside on a free budget: treats
 * ("grab a coffee from the kiosk"), public transport ("hop on the light rail"), and
 * places with a ticket or a till ("go into the museum", "sit in a café").
 */
export const OUTSIDE_SPENDING_CUES: readonly Cue[] = [
  {
    re: new RegExp(
      String.raw`${INSTRUCTION}(?:grab|get|pick\s+up|treat\s+yourself\s+to|reward\s+yourself\s+with)\s+(?:yourself\s+)?(?:(?:a|an|one|two|some|the|your|a\s+(?:cup|glass|scoop|slice|bag|piece|bottle|can)\s+of)\s+)?(?:(?:small|smallest|cheapest|quick|cold|hot|fresh|warm|little|iced|takeaway|local|street|single|tiny)\s+)?${FOOD}(?![\w-])`,
      'i',
    ),
    skip: (text, index, match) => notAPurchase(text, index) || FREE_SOURCE.test(clauseAfter(text, index, match)),
  },
  {
    re: new RegExp(
      String.raw`${INSTRUCTION}(?:take|ride|catch|board|hop\s+on(?:to)?|get\s+on(?:to)?|jump\s+on(?:to)?)\s+(?:(?:a|the|any|your|one|two|three)\s+)?(?:(?:next|first|local|night|city|number\s+\d+|\d+)\s+)?(?:bus|buses|train|trains|tram|trams|light[- ]rail|metro|subway|underground|taxi|taxis|cab|cabs|ferry|ferries|shuttle)\b(?!\s+(?:stops?|shelters?|stations?|maps?|timetables?|schedules?|numbers?|tickets?)\b)`,
      'i',
    ),
    skip: notAPurchase,
  },
  {
    re: new RegExp(
      String.raw`${INSTRUCTION}(?:go|head|walk|step|pop|nip|slip|wander|duck)\s+(?:in(?:to)?|inside)\s+(?:a|an|the|your|any|one|that|this)\s+(?:(?:nearest|closest|local|small|big|little|neighbou?rhood|corner|busiest|quietest)\s+)?${PAID_PLACE}(?![a-z])`,
      'i',
    ),
    skip: notAPurchase,
  },
  {
    re: new RegExp(
      String.raw`${INSTRUCTION}(?:enter|visit|tour)\s+(?:a|an|the|your|any|one|that|this)\s+(?:(?:nearest|closest|local|small|big|little|neighbou?rhood)\s+)?(?:museums?|cinemas?|movie\s+theat(?:er|re)s?|zoo|aquarium|escape\s+room)(?![a-z])`,
      'i',
    ),
    skip: notAPurchase,
  },
  {
    re: new RegExp(
      String.raw`${INSTRUCTION}(?:sit|take\s+a\s+seat|grab\s+a\s+(?:seat|table))\s+(?:down\s+)?(?:in|inside|at)\s+(?:a|an|the|your|any|one|that|this)\s+(?:(?:nearest|closest|local|small|quiet|busy|corner|neighbou?rhood)\s+)?(?:caf[eé]|coffee\s+shop|restaurant|bakery)(?![a-z])`,
      'i',
    ),
    skip: notAPurchase,
  },
];

// ── at home ──────────────────────────────────────────────────────────

/** `\b` treats "é" as a non-word character, so words that may end in one close with this instead. */
const END = '(?![a-z0-9])';
/** Places that are outside whatever comes before them. */
const OUTDOOR_PLACE = String.raw`(?:park|playground|caf[eé]s?|coffee\s+shop|shop|store|supermarket|grocery|mall|market|shuk|kiosk|bakery|bus\s+stop|bus\s+station|train\s+station|square|plaza|beach|promenade|boardwalk|cinema|post\s+office|pharmacy|corner\s+shop|street\s+corner|bench|sidewalk|pavement|crosswalk|street|road|neighbou?rhood|block|town|city\s+cent(?:re|er)|downtown)`;
/** Places that a game at home borrows as names ("the next station: the bathroom mirror", "the museum of your bookshelves") unless they are the nearest or local one. */
const PUBLIC_PLACE = String.raw`(?:station|library|museum|gallery)`;
const LOCAL = String.raw`(?:nearest|closest|local|public|neighbou?rhood|city)`;
/** Imagined trips ("imagine you are at the beach") never leave the house. */
const imagined = (text: string, index: number) => hypotheticalAt(text, index);

/** Leaving home. Not "the room or the street" (a home/outside episode), "walk it slowly", "a short walk". */
export const LEAVE_HOME_CUES: readonly Cue[] = [
  { re: /\b(?:leave|leaving|exit|exiting)\s+(?:the|your)\s+(?:house|flat|apartment|building)\b|\bleav(?:e|ing)\s+home\b/i, skip: imagined },
  { re: /\b(?:step|walk|head|go|get|run|pop|slip|nip)\s+out\s+(?:of\s+)?(?:the|your)\s+(?:front\s+door|house|flat|apartment|building)\b/i, skip: imagined },
  {
    re: /\b(?:go|going|head|heading|step|stepping|walk|walking|get|getting|pop|nip|wander|run|venture)\s+(?:back\s+)?(?:outside|outdoors|out\s+of\s+doors|out\s+into\s+the\s+(?:street|world|city|neighbou?rhood|sun|fresh\s+air))\b(?!\s+(?:on(?:to)?|to)\s+(?:the|your)\s+balcony)/i,
    skip: imagined,
  },
  { re: /\bhead(?:ing)?\s+out\b(?!\s+(?:to|onto)\s+(?:the|your)\s+balcony)/i, skip: imagined },
  // "nip out for a breath of fresh air", "go out for a walk" — not "pop out of the box", "out onto the balcony"
  {
    re: new RegExp(String.raw`${INSTRUCTION}(?:nip|pop|slip|duck|dash)\s+out\b(?!\s+(?:of\s+(?:bed|(?:the|your|this|that|a)\s+(?:room|bedroom|kitchen|bathroom|lounge|study|hall(?:way)?|cupboard|box|drawer|book|frame|page|photo|picture|chair|seat))\b|(?:on(?:to)?|to|into|onto)\s+(?:the|your|a)\s+(?:balcony|garden|yard|terrace|porch|patio|kitchen|hall(?:way)?|corridor|landing|stairwell)\b))`, 'i'),
    skip: imagined,
  },
  {
    re: new RegExp(
      String.raw`${INSTRUCTION}go\s+out\b(?=\s+(?:for|to|and|into|tonight|now|again|alone|together|with|in\s+search)\b)(?!\s+(?:to|onto|on)\s+(?:the|your)\s+(?:balcony|garden|yard|terrace|porch|patio)\b)`,
      'i',
    ),
    skip: imagined,
  },
  // "a bench outside your building" — not when it is watched from a window or the balcony
  {
    re: /\b(?:outside|in\s+front\s+of|across\s+from|opposite|around\s+the\s+corner\s+from|down\s+the\s+(?:street|road)\s+from)\s+(?:your|the)\s+(?:building|house|flat|apartment|front\s+door|block|home|entrance|gate)\b/i,
    skip: (text, index) => imagined(text, index) || /\b(?:window|balcony|windowsill|sill)\b/i.test(text),
  },
  {
    re: new RegExp(
      String.raw`\b(?:walk|walking|go|going|head|heading|stroll|run|jog|wander|cycle|ride|pop|nip|get|travel|drive|hop)\s+(?:(?:down|over|out|back|across|up)\s+)?(?:to|into|towards?|around|along|down|through)\s+(?:the\s+|a\s+|an\s+|your\s+|any\s+)?(?:(?:${LOCAL}\s+${PUBLIC_PLACE})|(?:(?:${LOCAL}|corner|next|other|end\s+of\s+the|top\s+of\s+the)\s+)?${OUTDOOR_PLACE})${END}`,
      'i',
    ),
    skip: imagined,
  },
  {
    re: /\b(?:take|taking|ride|riding|catch|catching|board|boarding|hop\s+on(?:to)?|get\s+on(?:to)?|jump\s+on(?:to)?)\s+(?:a|the|any|your|one)\s+(?:(?:next|first|local|night|city)\s+)?(?:bus|buses|train|tram|light[- ]rail|metro|subway|underground|taxi|cab|ferry|shuttle)\b/i,
    skip: imagined,
  },
  {
    re: new RegExp(
      String.raw`\b(?:at|in|inside)\s+(?:(?:the|a|an)\s+(?:(?:${LOCAL})\s+)?(?:park|playground|caf[eé]|coffee\s+shop|supermarket|mall|market|shuk|kiosk|bakery|bus\s+stop|beach|cinema)|(?:the|a|your)\s+${LOCAL}\s+${PUBLIC_PLACE})${END}`,
      'i',
    ),
    skip: imagined,
  },
];

// ── solo ─────────────────────────────────────────────────────────────

/** Words for people a group is made of, as opposed to objects sorted "into two teams". */
const PEOPLE_WORDS: ReadonlySet<string> = new Set([
  'crew', 'crews', 'friends', 'group', 'groups', 'party', 'players', 'team', 'teams', 'people', 'family', 'kids', 'children',
  'cousins', 'class', 'squad', 'gang', 'guests', 'everyone', 'everybody', 'others', 'siblings', 'roommates', 'flatmates', 'housemates',
]);
/** "Divide the pigeons into two teams" sorts things, not people. */
const OBJECT_DIVISION = /\b(?:divide|divides|dividing|split|splitting|sort|sorting|group|grouping|organi[sz]e|organi[sz]ing|arrange|arranging|separate|separating|line\s+up)\s+(?:the|your|these|those|all\s+(?:the|your)|some|every)\s+(?:[\w'-]+\s+){0,2}?([\w'-]+)\s+into\s+(?:[\w'-]+\s+)?$/i;
/** "Lay the objects out in pairs", "sort everything in groups by colour". */
const ARRANGING = /\b(?:sort|sorting|lay|laying|arrange|arranging|group|grouping|line|lining|organi[sz]e|organi[sz]ing|stack|stacking|put|putting|place|placing|set|setting|pile|piling|match|matching|pair|pairing|file|bundle|cluster|display|order|ordering)\b/i;
/** "Let your left and right hand take turns": the turns are not taken by people. */
const BODY_OR_OBJECT = /\b(?:hands?|eyes|feet|fingers|thumbs|ears|legs|arms|sides|pens?|pencils?|colou?rs|dice|coins?|cards)\b/i;
const FRIEND = String.raw`(?:friend|partner|buddy|pal|sibling|brother|sister|roommate|flatmate|housemate|mate|teammate|companion|cousin)s?`;

/** Other people. Not "a crew of one", "an invisible tour group", "split your view", "both of you" (you and your self-portrait). */
export const GROUP_CUES: readonly Cue[] = [
  {
    re: /\b(?:your|the\s+other|other|(?:the|your)\s+whole)\s+(?:friends|crew|crewmates?|group|team|teammates?|squad|gang|party|companions|players|fellow\s+players)\b/i,
    // "your group chat" is a phone thread; "the other players are everyone else on this street" casts strangers.
    skip: (text, index, match) =>
      /^\s+(?:chats?|texts?|threads?|messages?|channels?|calls?)\b|^\s+(?:are|is)\s+(?:everyone|everybody|all\s+the|strangers|passersby|the\s+(?:city|street|strangers|people|crowd|passersby|world))\b/i.test(
        text.slice(index + match.length),
      ),
  },
  {
    re: /\bteams\b|\bteam\s+(?:up|mates?|members?)\b|\bteammates?\b|\bcrewmates?\b/i,
    skip: (text, index) => {
      const object = OBJECT_DIVISION.exec(clauseBefore(text, index))?.[1]?.toLowerCase();
      return object !== undefined && !PEOPLE_WORDS.has(object);
    },
  },
  {
    re: /\b(?:each|every|the\s+other|another)\s+players?\b/i,
    skip: (text, index, match) => /^\s+(?:are|is)\s+(?:everyone|everybody|all\s+the|strangers|passersby|the\s+(?:city|street|strangers|people|crowd|passersby|world))\b/i.test(text.slice(index + match.length)),
  },
  { re: /\b(?:each|every|all)\s+of\s+you\b/i },
  // "split up", "break into teams", "split your crew" — not "break up the walk into three legs"
  {
    re: /\b(?:split|splitting|divide|dividing|break|breaking)\s+(?:up\b(?!\s+(?:the|your|this|that|a|an|each|every)\s+(?!(?:crew|group|team|friends|party|players|squad|gang)\b))|into\s+(?:two|three|four|pairs|teams|groups|halves)\b|your\s+(?:crew|group|team|friends|party)\b)/i,
  },
  { re: /\b(?:take|taking)\s+turns\b/i, skip: (text, index) => BODY_OR_OBJECT.test(clauseBefore(text, index)) },
  { re: /\bwhoever\s+(?:loses|wins|finishes|guesses|spots)\b/i },
  { re: /\b(?:with|together\s+with)\s+your\s+(?:friends|crew|group|team|squad)\b/i },
  { re: /\bin\s+(?:pairs|teams|groups)\b/i, skip: (text, index) => ARRANGING.test(clauseBefore(text, index)) },
  // A friend, partner or buddy who has to be there: "ask a friend to hide…", "race your friend", "you and your buddy".
  {
    re: new RegExp(
      String.raw`\b(?:ask|get|have|let|make|challenge|dare|invite|bring|recruit|enlist)\s+(?:a|your|one|the|an?\s+other)\s+(?:friend|partner|buddy|pal|sibling|brother|sister|roommate|flatmate|housemate|mate|teammate|companion|cousin|parent|neighbou?r)s?\b`,
      'i',
    ),
  },
  {
    re: new RegExp(
      String.raw`\b(?:race|beat|chase|tag|join|meet|hug|high-five|team\s+up\s+with|play\s+(?:against|with)|walk\s+with|compete\s+(?:against|with)|swap\s+with|trade\s+with|sit\s+with)\s+(?:a|your|one|the\s+other)\s+${FRIEND}\b`,
      'i',
    ),
  },
  { re: new RegExp(String.raw`\byou\s+and\s+(?:a|your|one)\s+${FRIEND}\b`, 'i') },
  {
    re: new RegExp(
      String.raw`\b(?:a|your)\s+(?:friend|partner|buddy|pal|teammate|companion)s?\s+(?:picks?|chooses?|hides?|holds?|reads?|guesses?|writes?|draws?|names?|takes?|waits?|stands?|counts?|times?|watches?|leads?|says?|whispers?|votes?|plays?|goes|must|should|can|will|gets?|keeps?|each|both)\b`,
      'i',
    ),
  },
  // "ask someone to hide it" — not the small favors a solo episode may ask of a stranger
  { re: /\bask\s+(?:someone|somebody|anyone)\s+(?:else\s+)?to\s+(?!(?:take\s+(?:your|a)\s+(?:photo|picture|snap)|recommend|suggest|point|tell|show)\b)[a-z]+/i },
];

// ── durations ────────────────────────────────────────────────────────

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
    const cues = prefs.setting === 'outside' ? [...PURCHASE_CUES, ...OUTSIDE_SPENDING_CUES] : PURCHASE_CUES;
    const hits: string[] = [];
    adv.items.forEach((item, i) => {
      if (findCue(item, PURCHASE_CUES)) hits.push(`items[${i}] ${quoteModelText(item)}`);
    });
    for (const n of adv.nodes) {
      for (const [field, text] of instructions(n)) {
        const cue = findCue(text, cues);
        if (cue) hits.push(`${place(n.id)}.${field} (${quoteModelText(cue)})`);
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
        if (cue) hits.push(`${place(n.id)}.${field} (${quoteModelText(cue)})`);
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
      if (cue) hits.push(`${where} (${quoteModelText(cue)})`);
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
        if (longest.minutes > prefs.minutes) hits.push(`${place(n.id)}.${field} (${quoteModelText(longest.phrase)})`);
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
        message: `The choice options have the same label (${n.choice.options.map((o) => quoteModelText(o.label)).join(' / ')}). Give each option a different label that says what kind of path it is.`,
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
