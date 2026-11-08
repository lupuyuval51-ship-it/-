import type { Adventure } from '../../../shared/types.ts';

/**
 * A two-hour transit gambit: ride ten stops past the edge of your known city,
 * find the neighborhood's legend, and get home. The narrator is the Coin itself
 * (two opinions, zero doubts), sulking whenever it is overruled.
 * Branch A follows the coin (pure chance, then an invented legend); branch B
 * follows a local tip, with a no-talking alternative (notice boards, maps,
 * shop windows), and finds a real legend. Safety is built in: the way home is
 * planned first, daylight or a busy line, re-flip anything empty or dark.
 * Cost is the round trip (two rides, about ₪12–24 depending on distance).
 */
const tenStopGambit: Adventure = {
  id: 'ten-stop-gambit',
  version: 1,
  source: 'curated',
  title: 'The Ten-Stop Gambit',
  tagline: 'Ten stops past the edge of your map, a neighborhood is keeping a legend to itself.',
  intro:
    "I'm the Coin. I have exactly two opinions, and I've never once doubted either. Today we ride ten stops past the last one you know, into a neighborhood you've never set foot in. Find its local legend, get home safely, and never ask me to explain myself.",
  kind: 'wanderer',
  moods: ['change', 'curious'],
  weirdness: 3,
  minutes: 120,
  cost: { min: 10, max: 30 },
  settings: ['outside'],
  company: ['solo', 'group'],
  items: ['A coin (or a coin-flip app)', 'A charged phone', 'Transit card or fare app', 'Water bottle'],
  palette: 'cobalt',
  motif: 'maze',
  traits: { boldness: 2, curiosity: 2 },
  stageLabel: 'Flip',
  narrator: 'The Coin',
  start: 'the-gambit',
  nodes: [
    {
      id: 'the-gambit',
      stage: 1,
      title: 'The Gambit',
      narrative:
        "Rule one of the Gambit: we go in daylight or on a busy line, and we plan the way home before we leave. Rule two: past the last stop you know, I'm in charge, and there are no appeals.",
      action:
        "Screenshot your route home and the time of the last ride back, then board a city bus or light rail line you've never taken. Ten stops past the last one you recognize (or 25 minutes in, whichever comes first), flip me: heads, get off; tails, two more stops, then off.",
      alternative:
        'No ride today? Run the Gambit on foot: walk to the edge of the streets you know, then let me pick your next ten turns, heads left, tails right, busy streets only. Screenshot the way back first.',
      minutes: 35,
      capture: {
        key: 'stop',
        label: 'The stop where I dropped you',
        placeholder: 'Pomegranate Square (zero pomegranates)',
      },
      amplify: 'Board like the opening scene of a film: window seat, deep breath, one long look back at the known world. Whisper “Ten stops. No regrets.”',
      crewTip: 'One of you carries the coin, one carries the screenshot home. Nobody is allowed to say “I think I know this area.”',
      choice: {
        prompt: "You're off the edge of your map at {{stop|a brand-new stop}}. Who's navigating now?",
        options: [
          {
            id: 'coin',
            label: 'Follow the coin',
            description: 'Pure chance. Heads left, tails right. No appeals.',
            next: 'coin-walk',
            traits: { boldness: 1 },
          },
          {
            id: 'local',
            label: 'Follow a local',
            description: 'A tip from someone who works here, or clues from the walls.',
            next: 'ask-a-local',
            traits: { connection: 1 },
          },
        ],
      },
    },
    {
      id: 'coin-walk',
      stage: 2,
      title: 'Heads Left, Tails Right',
      narrative:
        "Excellent choice: I've never been wrong. (Never been right either, but let's not dwell.) Every corner is a question, I'm the answer, and your only job is to stop for anything that makes you look twice.",
      action:
        'Walk for 25 minutes and flip me at every corner: heads left, tails right. If I ever point somewhere empty, dark or private, or across a road with no crossing, flip again.',
      alternative:
        'Rather not walk that far? Take a seat with a view, like a bench or a bus shelter, and let me steer your eyes instead: ten flips, heads look left, tails look right, one detail per flip.',
      minutes: 30,
      capture: {
        key: 'find',
        label: 'The best thing I led you to',
        placeholder: 'a shop that only sells buttons',
      },
      amplify: 'Call every flip like a referee, under your breath: “Heads. Left. No appeals.” Then point the way with total authority.',
      crewTip: "Pass the coin at every corner. Whoever flips decides what's worth stopping for; everyone else must act impressed.",
      next: 'myth-maker',
    },
    {
      id: 'myth-maker',
      stage: 3,
      title: 'The Myth-Maker',
      narrative:
        "Every neighborhood has a legend. This one hasn't written its own yet, which is frankly careless of a place with {{find|so much going on}}. I've nominated you.",
      action:
        'Flip me one last time: heads, the oldest-looking thing in sight; tails, the strangest. Then head for the nearest stop home and, on the ride, write its legend in three sentences: who, what happened here, and why locals still talk about it.',
      alternative:
        'Not a writing day? Tell yourself the legend silently on the ride home, like a bedtime story, then type just its first line: the one that would go on the plaque.',
      minutes: 45,
      capture: {
        key: 'myth',
        label: "Your legend's first line",
        placeholder: 'No one knows why the bench faces the wall.',
      },
      amplify: 'Before you leave, give the legendary object a small, respectful nod. One legend to another.',
      crewTip: 'Each person writes one sentence of the legend without peeking at the others. Read the whole thing aloud on the ride home.',
      next: 'coins-confession',
    },
    {
      id: 'ask-a-local',
      stage: 2,
      title: 'Ask the Neighborhood',
      narrative:
        "You've replaced me with a human. Fine, I'm not hurt; I'm a coin. I'll be in your pocket if you need someone decisive.",
      action:
        "Ask someone who works around here, like a kiosk owner, a market vendor or a librarian: “What's your favorite spot within ten minutes' walk?” Thank them and go; if you get two answers, I break the tie.",
      alternative:
        'Rather not talk to anyone? Read the neighborhood instead: a notice board, the map at the bus stop, posters in shop windows. Go wherever is mentioned, posted or pointed to most.',
      minutes: 30,
      capture: {
        key: 'spot',
        label: 'Where the neighborhood sent you',
        placeholder: 'a tiny park behind the post office',
      },
      amplify: 'Ask the follow-up every local secretly loves: “And what should I absolutely not miss on the way?”',
      crewTip: 'One person asks; everyone else listens and remembers one detail. Compare on the way. The details never quite match.',
      next: 'local-legend',
    },
    {
      id: 'local-legend',
      stage: 3,
      title: 'The Local Legend',
      narrative:
        "Every neighborhood hides its legend in plain sight: a plaque, a street sign, the oldest shop window. Start at {{spot|the spot you were sent to}}. (I'd have found it faster, just saying.)",
      action:
        'Find one real story here: read a plaque, a dedication or a cornerstone, or look up who the street is named after. Then head for the nearest stop home and reread it on the ride.',
      alternative:
        'No plaque, no signal, no story? Invent the legend of the oldest thing in sight, mark it “unconfirmed,” and fact-check it on the ride home.',
      minutes: 45,
      capture: {
        key: 'legend',
        label: 'The local legend, in one line',
        placeholder: 'the street is named after a poet who planted trees',
      },
      amplify: "Read the legend aloud, quietly, at the exact spot it happened. Then glance around like you're the only one who knows. You might be.",
      crewTip: 'Split up within sight of each other and hunt for two minutes. Whoever finds the best story picks the seats on the ride home.',
      next: 'edge-of-the-map',
    },
  ],
  endings: [
    {
      id: 'coins-confession',
      title: "The Coin's Confession",
      twist:
        "Plot twist: I never chose anything. I said left or right, that's all. You were the one who stopped for {{find|that one thing}}, looked twice, and wrote a legend for a street you'd never seen. Somewhere past {{stop|that stop}}, a neighborhood has new folklore, and its author is riding home.",
      closingLine: '“{{myth|No one knows why the bench faces the wall.}}” A local legend, est. today.',
      traits: { creativity: 2 },
    },
    {
      id: 'edge-of-the-map',
      title: 'The Edge of the Map',
      twist:
        "Plot twist: the Gambit only works once. When you set out, {{stop|that stop}} was past the edge of your map. Now it's somewhere you've been, with a favorite spot and a legend of its own, so next time you'll have to ride ten stops further. Your city just got bigger. (For the record, I'd have picked the same spot.)",
      closingLine: 'Heard ten stops from home: {{legend|the street is named after a poet who planted trees}}',
      traits: { curiosity: 1, connection: 1 },
    },
  ],
};

export default tenStopGambit;
