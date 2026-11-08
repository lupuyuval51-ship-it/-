import type { Adventure } from '../../../shared/types.ts';

/**
 * The Market Oracle: a one-hour taste investigation at a market, shuk or big supermarket.
 * Find one thing you have never tasted (no cooking needed, allergies respected), then taste it
 * somewhere nice and write it a pompous sommelier-style note. Budget: one item (₪5–20).
 * Branch A consults a vendor ("What should I try?"), with a no-talking alternative that reads the
 * labels and hand-lettered signs instead; its twist: the real oracle is the person behind the
 * counter, and you just became a regular. Branch B follows your nose (color and smell only, fruit
 * stalls) and ends in a blind tasting; its twist: fruit evolved that color and smell to get picked,
 * so the find was the mastermind.
 * Running bit: the Market narrates in the first person and cannot stop shouting deals in
 * parentheses. Stage 1 asks for a real shout (or sign) the user heard; both twists quote it.
 */
const marketQuest: Adventure = {
  id: 'market-quest',
  version: 1,
  source: 'curated',
  title: 'The Market Oracle',
  tagline: 'Somewhere nearby, an ancient oracle is shouting prices. It has a prophecy about your next bite.',
  intro:
    "I am the Market. I was trading figs before anyone invented coins, and I know every flavor in this city. (Three for ten! Three for ten!) Today you'll find one you have never tasted, consult me the old way, and write it a tasting note so pompous that wine experts weep. Bring an appetite and about twenty shekels.",
  kind: 'detective',
  moods: ['curious', 'social'],
  weirdness: 2,
  minutes: 60,
  cost: { min: 10, max: 30 },
  settings: ['outside'],
  company: ['solo', 'group'],
  items: ['₪10–30, some of it in cash', 'Phone or notebook', 'Water bottle (for rinsing)'],
  palette: 'citrus',
  motif: 'dots',
  traits: { curiosity: 2, connection: 1 },
  stageLabel: 'Course',
  narrator: 'The Market (open since forever)',
  start: 'scouting-lap',
  nodes: [
    {
      id: 'scouting-lap',
      stage: 1,
      title: 'The Scouting Lap',
      narrative:
        'Every detective starts by walking the scene. Mine is loud, sticky and older than writing, and somewhere in it hides a flavor you have never met. (Fresh mint! Five a bunch!)',
      action:
        "Go to the nearest market, shuk or big supermarket within 15 minutes of you. Walk one slow lap without buying anything: list five never-tasted things that need no cooking (and aren't on your allergy list), and catch the loudest shout or sign on the way.",
      alternative:
        "Crowds, noise or distance not on your side today? Take the calm route: a big supermarket or corner grocery, one aisle at a time (produce, imported snacks, the deli counter). Same mission: five things you've never tasted.",
      minutes: 20,
      capture: {
        key: 'shout',
        label: 'The loudest shout (or sign) you caught',
        placeholder: 'Three for ten! Three for ten!',
      },
      amplify: 'Walk the lap like a famous food critic in disguise: hands clasped behind your back, a slow nod at every stall, one quiet "interesting…" per aisle.',
      crewTip: 'Split up for the lap and meet at the entrance in ten minutes with five candidates each. Anything on two lists is clearly fate.',
      choice: {
        prompt: 'I have two oracles: my vendors and my smells. Which one do you consult?',
        options: [
          {
            id: 'vendor',
            label: 'Ask a Vendor',
            description: 'One question for someone who knows: "What should I try?"',
            next: 'ask-the-oracle',
            traits: { connection: 1 },
          },
          {
            id: 'nose',
            label: 'Follow Your Nose',
            description: 'No questions. Color and smell decide for you.',
            next: 'follow-your-nose',
            traits: { curiosity: 1 },
          },
        ],
      },
    },
    {
      id: 'ask-the-oracle',
      stage: 2,
      title: 'Ask the Oracle',
      narrative:
        'My vendors are my oracles. They know what came in this morning, what is perfect today and what is merely fine. Strangers rarely ask. Be the one who does. (Sweet dates! Taste before you buy!)',
      action:
        'Choose a stall or counter selling something on your list and ask the person behind it: "What should I try that I have never had?" (Mention any allergies.) Buy their pick (₪5–20), then ask one follow-up: how do they eat it at home?',
      alternative:
        "Rather not ask? Let the signs be your oracle: read the labels and the hand-lettered price tags, and buy the thing with the most mysterious name you can't quite pronounce (₪5–20).",
      minutes: 15,
      capture: {
        key: 'pick',
        label: 'What the Oracle picked for you',
        placeholder: 'salted green almonds',
      },
      amplify: 'Ask like a pilgrim at a temple: lean in a little, lower your voice, mean it. Then thank them as if they just told your future.',
      crewTip: 'Each of you consults a different stall. Nobody reveals their pick until the tasting: fewer spoilers, more drama.',
      next: 'tasting-room',
    },
    {
      id: 'tasting-room',
      stage: 3,
      title: 'The Tasting Room',
      narrative:
        'A pick this good deserves a proper tasting room: daylight, a seat, no hurry. Wine experts spit. You may swallow. (Cold water! Ice cold!)',
      action:
        'Take your pick ({{pick|the Oracle\'s choice}}) somewhere nice nearby, like a bench or a sunny step. Rinse it if needed, taste it the way you were told (or your best guess) and write a pompous sommelier-style tasting note. On your way out, give the Oracle a one-word verdict.',
      alternative:
        'Rather skip the return visit? Taste it the same way and write the note, then deliver your verdict without a word: a nod or a thumbs-up toward the stall from a friendly distance.',
      minutes: 20,
      capture: {
        key: 'verdict',
        label: 'Your tasting note, sommelier-style',
        placeholder: 'Notes of rain and lemon peel. A cheeky finish.',
      },
      amplify: 'Taste it like a rare vintage: hold it up to the light, sniff twice, pause for one dramatic second, then bite. Nod slowly, as if it has confirmed a theory.',
      crewTip: "Swap bites and write each other's tasting notes. The most pretentious note wins and must be read aloud in full.",
      next: 'the-regular',
    },
    {
      id: 'follow-your-nose',
      stage: 2,
      title: 'Follow Your Nose',
      narrative:
        'No questions, no labels, no help. My fruit stalls have been talking in color and smell since long before anyone could read a price tag. Let them talk. (Ripe mangoes! Smell that!)',
      action:
        "Go to the fruit stalls (or the produce aisle) and choose by color and smell only: sniff at least five fruits you've never tasted (lean in, no squeezing) and buy the one that wins (₪5–15).",
      alternative:
        "No sense of smell today, or stalls too busy to linger? Choose by color and shape alone, from a step back: buy the never-tasted fruit whose color you'd happily paint a wall (₪5–15).",
      minutes: 15,
      capture: {
        key: 'nose-pick',
        label: 'What your nose chose',
        placeholder: 'a pale guava that smelled like perfume',
      },
      amplify: 'Sniff like a perfumer: eyes closed, one short sniff, one long one. Then name its notes under your breath: "Honey. Pencil shavings. Hope."',
      crewTip: 'Each of you sniffs out a different fruit. The word "fruity" is banned; whoever says it carries the bag.',
      next: 'blind-tasting',
    },
    {
      id: 'blind-tasting',
      stage: 3,
      title: 'The Blind Tasting',
      narrative:
        'Detectives call it evidence. Sommeliers call it a vintage. Either way, {{nose-pick|your find}} is about to be examined with your eyes closed, the way only professionals and very serious eaters do. (Shh! Tasting in progress!)',
      action:
        'Take it somewhere nice nearby (a bench, a park, a sunny step), rinse or peel it, and taste it eyes closed in three slow bites. Write a pompous tasting note, then look up one fact about it for the case file: where it grows, or what its name means.',
      alternative:
        'Rather not eat it here? Save the tasting for home, but open the case file now: describe it like a wine label using only color, smell and its weight in your hand, then look up one fact about it.',
      minutes: 20,
      capture: {
        key: 'case-note',
        label: 'Your tasting note for the case file',
        placeholder: 'Honeyed, floral, faintly suspicious. A long finish.',
      },
      amplify: 'Announce the vintage before the first bite, sommelier-style: "This morning\'s harvest. A very good year." Then taste it in total silence.',
      crewTip: 'Taste blind together: one person hands out the bites while everyone else keeps their eyes shut and guesses the color.',
      next: 'the-mastermind',
    },
  ],
  endings: [
    {
      id: 'the-regular',
      title: 'The Regular',
      twist:
        "Plot twist: you weren't the only one trying something new today. The person behind that counter watches a thousand strangers hurry past {{pick|your pick}} every day, and today one of them stopped. To them, you were the new flavor. Come back next week and you'll be something rarer: a regular, the oldest title I give. ({{shout|Three for ten!}} Welcome back!)",
      closingLine: '{{verdict|Notes of rain and lemon peel. A cheeky finish.}} Recommended by an oracle. Tasted by a regular.',
      traits: { connection: 1, boldness: 1 },
    },
    {
      id: 'the-mastermind',
      title: 'The Mastermind',
      twist:
        'Plot twist: you didn\'t follow your nose. You answered a shout. Long before anyone yelled "{{shout|three for ten!}}", fruit was shouting in color and smell: a sales pitch millions of years old, built to get picked by someone hungry. Today it worked on a detective with a notebook, and {{nose-pick|your find}} was never the evidence. It was the mastermind.',
      closingLine: 'Case closed: {{case-note|Honeyed, floral, faintly suspicious. A long finish.}}',
      traits: { curiosity: 1, creativity: 1 },
    },
  ],
};

export default marketQuest;
