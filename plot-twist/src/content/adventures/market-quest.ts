import type { Adventure } from '../../../shared/types.ts';

/**
 * The Case of the First Bite: a one-hour taste investigation at a market, shuk or big supermarket.
 * Find one thing you have never tasted that you could eat on a bench (no cooking, no cutting,
 * allergies respected). Budget: about ₪10 worth of one find, plus an optional bus ride.
 * Branch A works an inside source: ask a vendor "What should I try?" (no-talking alternative: let
 * the labels and hand-lettered signs decide), eat it the way they eat it at home, then deliver a
 * one-word verdict. Its twist: to the vendor, you were the new flavor, and you are one visit away
 * from becoming a regular. Branch B follows your nose (color and smell only), then runs a blind
 * tasting with a pompous tasting note and one looked-up fact for the case file. Its twist: fruit
 * evolved that color and smell to get picked, so the find was the mastermind.
 * Running bit: the Market narrates in the first person and cannot stop shouting deals in
 * parentheses. Stage 1 asks for a real shout (or sign) the user heard; both twists quote it.
 */
const marketQuest: Adventure = {
  id: 'market-quest',
  version: 1,
  source: 'curated',
  title: 'The Case of the First Bite',
  tagline: 'The loudest place in town is hiding a flavor you have never tasted. Today, it talks.',
  intro:
    "I am the Market. I was trading figs before anyone invented coins, and I know every flavor in this city. (Three for ten! Three for ten!) Today you'll crack the case of one you have never tasted, with help from my vendors or your own nose. Bring an appetite, about twenty shekels and something to write the evidence on.",
  kind: 'detective',
  moods: ['curious', 'social'],
  weirdness: 2,
  minutes: 60,
  cost: { min: 10, max: 30 },
  settings: ['outside'],
  company: ['solo', 'group'],
  items: ['₪10–30, some of it in cash', 'Phone or notebook', 'Water bottle (for rinsing)'],
  palette: 'citrus',
  motif: 'grid',
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
        "Go to a market, shuk or big supermarket within ten minutes of you and walk one slow lap, buying nothing yet. List five things you've never tasted that you could eat on a bench (no cooking, no cutting, nothing on your allergy list), and catch the loudest shout or sign.",
      alternative:
        'Crowds or noise not on your side today? Take the calm route: a corner grocery or a quiet supermarket, one aisle at a time (produce, imported snacks, the deli). Same list of five, plus the boldest sign in the shop.',
      minutes: 25,
      capture: {
        key: 'shout',
        label: 'The loudest shout (or sign) you caught',
        placeholder: 'Three for ten! Three for ten!',
      },
      amplify: 'Walk the lap like a famous food critic in disguise: hands clasped behind your back, a slow nod at every stall, one quiet "interesting…" per aisle.',
      crewTip: 'Split up for the lap and meet at the entrance in ten minutes with five candidates each. Anything on two lists is officially a lead.',
      choice: {
        prompt: 'Every case needs a method. Do you question my people or trust your senses?',
        options: [
          {
            id: 'vendor',
            label: 'Ask a Vendor',
            description: 'One question for someone who knows: "What should I try?"',
            next: 'inside-source',
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
      id: 'inside-source',
      stage: 2,
      title: 'The Inside Source',
      narrative:
        'My vendors know everything: what came in this morning, what is perfect today and what is merely fine. Strangers rarely ask them. Be the one who does. (Sweet dates! Taste before you buy!)',
      action:
        'Pick a stall or counter selling something on your list and ask: "What should I try that I\'ve never had, something I can eat right now?" Mention any allergies. Buy about ten shekels\' worth of their pick, then ask one follow-up: how do they eat it at home?',
      alternative:
        "Rather not ask? Let the signs talk instead: read the labels and hand-lettered price tags, and buy about ten shekels' worth of the thing with the most mysterious name you can't quite pronounce.",
      minutes: 15,
      capture: {
        key: 'pick',
        label: 'The flavor you tracked down',
        placeholder: 'salted green almonds',
      },
      amplify: 'Ask like a detective working a hunch: lean in, lower your voice, "Off the record… what\'s really good today?"',
      crewTip: 'Each of you consults a different stall. Nobody reveals their pick until the tasting: fewer spoilers, more drama.',
      next: 'reconstruction',
    },
    {
      id: 'reconstruction',
      stage: 3,
      title: 'The Reconstruction',
      narrative:
        'Good detectives test a story by acting it out. You know how this is eaten at home (or can guess like a professional), so we rebuild the scene exactly. (Cold water! Ice cold!)',
      action:
        'Take {{pick|your pick}} to a bench or sunny step nearby, rinse if needed, and eat exactly as your source does at home (or your best guess). Then swing back by the stall or counter and give them a one-word verdict (kind words only; "interesting" counts).',
      alternative:
        'Rather not go back? Eat it their way all the same, then deliver your verdict without a word: a nod or a thumbs-up toward the stall from a friendly distance.',
      minutes: 15,
      capture: {
        key: 'verdict',
        label: 'Your one-word verdict',
        placeholder: 'Unforgettable',
      },
      amplify: 'Deliver the verdict like a judge on a cooking show: a long pause, one slow nod, then the word, as if a trophy depends on it.',
      crewTip: 'Trade bites, each eaten the way its source said. Then agree on one verdict per stall and deliver them together, like a very small tasting panel.',
      next: 'the-regular',
    },
    {
      id: 'follow-your-nose',
      stage: 2,
      title: 'Follow Your Nose',
      narrative:
        'No questions, no labels, no help. My fruit stalls have been talking in color and smell since long before anyone could read a price tag. Let them talk. (Ripe mangoes! Smell that!)',
      action:
        "Go to the fruit stalls (or the produce aisle) and choose by color and smell only. Sniff at least five fruits (lean in, no squeezing), then buy about ten shekels' worth of the best one you've never tasted (a new variety counts) that needs no cutting.",
      alternative:
        "No sense of smell today, or stalls too busy to linger? Choose by color and shape alone, from a step back: buy about ten shekels' worth of the never-tasted fruit whose color you'd happily paint a wall.",
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
        'Take it to a bench or sunny step nearby, rinse or peel it, and taste it eyes closed in three slow bites. Write a tasting note so pompous that wine experts weep, then look up one fact for the case file: where it grows, or what its name means.',
      alternative:
        'Rather not eat it here? Save the tasting for home, but open the case file now: describe it like a wine label using only color, smell and its weight in your hand, then look up one fact about it.',
      minutes: 15,
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
        "Plot twist: you weren't the only one trying something new today. The person behind that counter watches a thousand strangers hurry past {{pick|your pick}} every day, and today one of them stopped. To them, you were the new flavor. Stop by once more and you'll hold the oldest title I give: a regular. ({{shout|Three for ten}}! See you next week!)",
      closingLine: 'Verdict on {{pick|a new flavor}}: {{verdict|unforgettable}}. Recommended by the Market. Tasted by a future regular.',
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
