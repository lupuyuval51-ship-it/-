import type { Adventure } from '../../../shared/types.ts';

/**
 * A tiny expedition: chart the hundred steps around you as the first
 * cartographer ever to bother. Branch A surveys what is there (census,
 * official names: precise and observational); branch B maps what is missing
 * (proposals in dotted lines, a trap street: imaginative). Running bit: the
 * Royal Society of Small Maps treats a hundred steps like an epic voyage.
 * Both twists pay off the territory the user named in stage 1.
 */
const cornerCartographer: Adventure = {
  id: 'corner-cartographer',
  version: 1,
  source: 'curated',
  title: 'The Corner Cartographer',
  tagline: 'A hundred steps from you lies a place no map has ever bothered to name.',
  intro:
    "The Royal Society of Small Maps regrets to inform you that the hundred steps around you have never been properly charted: not by satellites, not by explorers, not by anyone with a pencil and an opinion. Today you're the first. One corner, one map, and the right to name everything on it.",
  kind: 'wanderer',
  moods: ['curious'],
  weirdness: 1,
  minutes: 15,
  cost: { min: 0, max: 0 },
  settings: ['outside'],
  company: ['solo', 'group'],
  items: ['Paper and a pen (or a notes app)'],
  palette: 'moss',
  motif: 'maze',
  traits: { curiosity: 2, creativity: 1 },
  stageLabel: 'Sheet',
  narrator: 'The Royal Society of Small Maps',
  start: 'point-zero',
  nodes: [
    {
      id: 'point-zero',
      stage: 1,
      title: 'Point Zero',
      narrative:
        "Every great expedition starts somewhere. Yours starts exactly where you're standing, which the Society will hereafter call Point Zero. Ahead lie a hundred uncharted steps and, quite possibly, a recycling bin.",
      action:
        'Walk 50 steps out from Point Zero and 50 back, on your side of the street, counting as you go. Back at the start, sketch the route with its three most obvious landmarks, then name the whole territory.',
      alternative:
        'Chart it from one spot instead: a bench, a doorstep or a window. Everything you can see is your territory. Sketch it from left to right, mark three landmarks and give it a name.',
      minutes: 5,
      capture: {
        key: 'territory',
        label: 'The name of your territory',
        placeholder: 'the Lower Kiosk Lands',
      },
      amplify: 'Before you set off, plant an imaginary flag at Point Zero and claim the territory, under your breath, in the name of the Society.',
      crewTip: 'Split the jobs: one counts steps, one navigates, one draws. Name the territory by vote; the losing names become street names.',
      choice: {
        prompt: 'The outline of {{territory|your territory}} is drawn. What goes on the first edition?',
        options: [
          {
            id: 'survey',
            label: "Survey what's there",
            description: 'Precise and measured. Every bench accounted for.',
            next: 'the-census',
            traits: { curiosity: 1 },
          },
          {
            id: 'missing',
            label: "Map what's missing",
            description: 'What should be here? Draw it in anyway.',
            next: 'blank-spaces',
            traits: { creativity: 1 },
          },
        ],
      },
    },
    {
      id: 'the-census',
      stage: 2,
      title: 'The Census',
      narrative:
        'A serious map needs serious numbers, so the Society requires a census of {{territory|your territory}}. It is not interested in people. It is extremely interested in plant pots.',
      action:
        'Pick one thing your territory has plenty of (plant pots, bikes, drainpipes, cats) and count every single one within your hundred steps. Mark each on the map with a dot.',
      alternative:
        'From a bench or a window, count every one of a single thing you can see, like windows with plants, parked bikes or birds on a wire, and dot each onto your map.',
      minutes: 5,
      capture: {
        key: 'census',
        label: 'Your official census results',
        placeholder: '23 plant pots, 2 cats, 1 suspicious chair',
      },
      amplify: 'Add one bonus category of no practical use whatsoever: suspicious chairs, very confident pigeons, doors painted the wrong color.',
      crewTip: 'Each person counts a different thing. Combine the totals into one official census and read it aloud in a tone of great importance.',
      next: 'official-names',
    },
    {
      id: 'official-names',
      stage: 3,
      title: 'Official Names',
      narrative:
        'The open secret of cartography: someone, somewhere, simply decided what everything is called. Today that someone is you, and most corners of {{territory|your territory}} still have no name at all.',
      action:
        "Find three spots on your map with no name (a step, a gap between buildings, a patch of shade) and give each a name fit for a real street sign. Add a north arrow; your phone's compass knows the way.",
      alternative:
        'Rather not draw? Photograph each nameless spot, with no people in the frame, and caption it with its new official name, like a proper field survey.',
      minutes: 4,
      capture: {
        key: 'named',
        label: 'The best name you gave',
        placeholder: 'Pigeon Ledge Passage',
      },
      amplify: 'Unveil your best name out loud beside the spot itself, quietly, like a mayor cutting a very small ribbon.',
      crewTip: 'Each person names one spot. For the rest of the day, everyone must use the official names with a straight face.',
      next: 'last-unmapped-place',
    },
    {
      id: 'blank-spaces',
      stage: 2,
      title: 'The Blank Spaces',
      narrative:
        "Good cartographers draw what's there. Great ones notice what isn't. The Society has reviewed {{territory|your territory}} and regrets to report that it is missing several things.",
      action:
        'Walk your territory again and find three spots begging for something: a corner that wants a bench, a wall that wants a mural, a gap that wants a tree. Draw each in dotted lines, labeled “Proposed.”',
      alternative:
        'Stay put and pick three spots in view that are missing something. Draw them in dotted lines, or pitch each one under your breath like a slightly overexcited city planner.',
      minutes: 5,
      capture: {
        key: 'missing',
        label: 'What your territory needs most',
        placeholder: 'a tiny fountain beside the bus stop',
      },
      amplify: 'Add one proposal clearly beyond the city budget: a lighthouse, a staircase to nowhere, a very small volcano.',
      crewTip: 'Everyone proposes something for the same empty spot. Vote. The losing ideas go on the map anyway, in smaller letters.',
      next: 'trap-street',
    },
    {
      id: 'trap-street',
      stage: 3,
      title: 'The Trap Street',
      narrative:
        "Real mapmakers used to hide fake streets in their maps to catch copycats. They're called trap streets. Now that your map proposes {{missing|several improvements}}, it's valuable enough to need one.",
      action:
        "Draw one place that doesn't exist exactly where it would fit (a lane, a tiny square, a museum of one thing) and give it a name and opening hours.",
      alternative:
        'Done with drawing? Face the spot where your trap street would begin and describe it in a 20-second voice note to yourself: its name, its hours, what visitors will find there.',
      minutes: 4,
      capture: {
        key: 'trap',
        label: "Your trap street's name (and hours)",
        placeholder: 'Little Spoon Lane (open Tuesdays)',
      },
      amplify: "From the pavement, gaze down your trap street from the exact spot it begins, with a satisfied nod, as if it's always been there.",
      crewTip: 'Each person secretly adds one trap street to the shared map. Then swap maps and try to spot the fakes.',
      next: 'paper-town',
    },
  ],
  endings: [
    {
      id: 'last-unmapped-place',
      title: 'The Last Unmapped Place',
      twist:
        "Plot twist: satellites have photographed every rooftop on Earth, and not one of them knows about {{census|your census}}. On official maps, this corner is a gray block with no name. On yours it's {{territory|a whole territory}}, home of {{named|three brand-new names}}. The last unmapped place on Earth was a hundred steps from where you started.",
      closingLine: 'Now entering {{territory|the Lower Kiosk Lands}}. Population: {{census|23 plant pots, 2 cats, 1 suspicious chair}}',
      traits: { connection: 1 },
    },
    {
      id: 'paper-town',
      title: 'The Paper Town',
      twist:
        "Plot twist: in the 1930s, two mapmakers invented a town called Agloe to catch copycats. Years later, someone opened a store on that empty spot and named it Agloe, because the map said so. Today {{trap|a street that doesn't exist}} appeared on the only map of {{territory|your territory}}. That's exactly how Agloe started.",
      closingLine: 'Coming soon to {{territory|the Lower Kiosk Lands}}: {{trap|Little Spoon Lane (open Tuesdays)}}',
      traits: { creativity: 1 },
    },
  ],
};

export default cornerCartographer;
