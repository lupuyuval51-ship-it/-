import type { Adventure } from '../../../shared/types.ts';

/**
 * The Color Heist: a 15-minute game for home or outside, solo or with a crew.
 * Steal five colors (a close-up photo or a note, never touching anything, never people) and name
 * each like a paint chip. Stage 1 is the warm-up: the most boring color in sight, made to sound expensive.
 * Branch A hunts one-of-a-kind colors (the Twin Test, then a coin-sized crown jewel);
 * branch B steals a mood (three shades of how you feel, then a getaway color for how you want to feel).
 * Running bit: the Fence's rule one, "no fingerprints". Both twists reveal the user broke it at every
 * scene, because the haul is a self-portrait: A through a final twin test on the whole haul,
 * B because every color was wearing the user's mood ("caught red-handed").
 */
const colorHeist: Adventure = {
  id: 'color-heist',
  version: 1,
  source: 'curated',
  title: 'The Color Heist',
  tagline: 'Five colors are about to go missing. Nobody will ever report them stolen.',
  intro:
    "The Fence here. I move hot colors, no questions asked, and I've got orders for five. The job: touch nothing, lift each color with a close-up photo or a quick note, and give it a paint-chip name worth paying for. Nobody buys “beige.” They buy “Oat Milk Ambition.”",
  kind: 'game',
  moods: ['creative', 'curious'],
  weirdness: 2,
  minutes: 15,
  cost: { min: 0, max: 0 },
  settings: ['home', 'outside'],
  company: ['solo', 'group'],
  items: ['Phone camera, or pen and paper'],
  palette: 'citrus',
  motif: 'stripes',
  traits: { creativity: 2, curiosity: 1 },
  stageLabel: 'Job',
  narrator: 'The Fence (colors only)',
  start: 'casing-the-joint',
  nodes: [
    {
      id: 'casing-the-joint',
      stage: 1,
      title: 'Casing the Joint',
      narrative:
        "Rule one: no fingerprints. We touch nothing and take only color (objects and places, never people or what they're wearing), and nobody ever knows they were robbed. First, a warm-up so easy it's insulting.",
      action:
        "Find the most boring color in sight (a wall, a lid, a paving stone) and steal it: a close-up photo so tight it's only color, or a note of where it lives. Then give it a paint-chip name fancy enough to sell.",
      alternative:
        'Rather not look around? Steal from memory: picture the dullest color you saw today (a bus seat, a waiting-room wall, a dish sponge), note where it lives, and give it a paint-chip name all the same.',
      minutes: 4,
      capture: {
        key: 'first',
        label: 'Your first paint-chip name',
        placeholder: 'Bus Stop Melancholy',
      },
      amplify: 'Unveil the name out loud in a luxury-ad whisper (“New this season: Landlord Beige”), then nod slowly, as if it has already sold out.',
      crewTip: 'Everyone steals the same boring color and names it in secret. Reveal on three; the fanciest name wins. The Fence pays in bragging rights.',
      choice: {
        prompt: "One down: {{first|your first color}}. Four to go. What's the real score?",
        options: [
          {
            id: 'rare',
            label: 'Steal the rarest',
            description: 'One-of-a-kind colors only. Anything with a twin is worthless.',
            next: 'twin-test',
            traits: { curiosity: 1 },
          },
          {
            id: 'mood',
            label: 'Steal a mood',
            description: 'Pick a feeling and lift its colors, one shade at a time.',
            next: 'the-insider',
            traits: { creativity: 1 },
          },
        ],
      },
    },
    {
      id: 'twin-test',
      stage: 2,
      title: 'The Twin Test',
      narrative:
        "Rare colors fetch rare prices, and the Fence has a test for them: if a color has a twin anywhere in sight, it's common stock. Common stock fetches nothing. Sad, but that's the trade.",
      action:
        'Hunt for colors that appear exactly once in sight (one red lid, one sticker, one wildflower in a pavement crack) and give each a ten-second twin check. Steal and name the first three survivors.',
      alternative:
        'Staying in one spot? Split your view into three slices (left, middle, right) and find the rarest color in each, twin check included. Steal and name all three without getting up.',
      minutes: 6,
      capture: {
        key: 'rare',
        label: "Your rarest color's paint-chip name",
        placeholder: 'Runaway Balloon Red',
      },
      amplify: 'Appraise each survivor under your breath, like a jeweler squinting through a loupe: “Flawless. Possibly cursed.”',
      crewTip: 'Each of you brings back one rare color and points it out. The rest of the crew gets ten seconds to find its twin. Twin found? Common stock.',
      next: 'crown-jewel',
    },
    {
      id: 'crown-jewel',
      stage: 3,
      title: 'The Crown Jewel',
      narrative:
        'Every heist ends with the one piece too small to see from the door. Four colors down, including {{rare|one with no twin}}, and the last one is hiding somewhere tiny.',
      action:
        'Steal your fifth color from the smallest patch you can find, no bigger than a coin: a bead, a stamp, one petal, a fleck of old paint. Then look at all five side by side and name the collection like a limited edition.',
      alternative:
        "Not hunting today? Find the tiniest color within arm's reach (a thread, a crumb, a dot on a label) and steal it. Then write all five names in a column and name the collection.",
      minutes: 4,
      capture: {
        key: 'collection',
        label: "Your collection's name",
        placeholder: 'The Overlooked Collection',
      },
      amplify: 'Swipe through the five swatches slowly, like a jewel thief opening a velvet case for a buyer. Say nothing. Raise one eyebrow.',
      crewTip: "Put everyone's crown jewels side by side and vote for the smallest. Its thief names the collection; everyone else must call it a masterpiece.",
      next: 'no-twin-found',
    },
    {
      id: 'the-insider',
      stage: 2,
      title: 'The Insider',
      narrative:
        "Every great heist has someone on the inside. Yours is a feeling, and it's been casing this place since before you arrived. It knows exactly which colors match it.",
      action:
        'Name the feeling you walked in with, in a word or two. Then steal three colors that look exactly like it and name each like a paint chip (“Unread Messages Blue” is a real seller).',
      alternative:
        "Rather not hunt? Steal all three from memory: places you've been this week that felt exactly like this mood. Note where each color lives, then give it a paint-chip name.",
      minutes: 6,
      capture: {
        key: 'mood',
        label: "The feeling you're stealing, in a word or two",
        placeholder: 'Sunday-evening restless',
      },
      amplify: 'Before each steal, act out the feeling for three seconds like a silent-film star. Method thieves get the best colors.',
      crewTip: 'Everyone picks a feeling in secret and steals three colors for it. Show your swatches; the crew gets one guess per feeling.',
      next: 'getaway-color',
    },
    {
      id: 'getaway-color',
      stage: 3,
      title: 'The Getaway Color',
      narrative:
        "A getaway doesn't need a car. Yours needs one color: the shade of how you'd like to feel when this is over. Let {{mood|that feeling}} ride in the back.",
      action:
        'Steal your fifth color: one that looks like how you want to feel next, named like a paint chip. Then line up all five, from your boring first steal to the getaway, and name the palette.',
      alternative:
        "Can't spot it from here? Steal it from memory: a color from a place that always puts you in that mood. Then write all five names in order, first steal to getaway, and name the palette.",
      minutes: 4,
      capture: {
        key: 'palette',
        label: "Your palette's name",
        placeholder: 'From Snooze to Sunlight',
      },
      amplify: 'Make the getaway in slow motion: three steps toward the getaway color while an imaginary saxophone plays. Swagger mandatory.',
      crewTip: "Pool everyone's swatches into one crew palette: each person's “now” on the left, their “next” on the right. Name it together, dramatically.",
      next: 'caught-red-handed',
    },
  ],
  endings: [
    {
      id: 'no-twin-found',
      title: 'No Twin Found',
      twist:
        'Plot twist: you broke rule one at every scene. The Fence ran one last twin test, on the whole haul: anyone could lift {{rare|one rare color}}, but nobody else alive would steal these five, starting with {{first|that boring one}}. No twin found. Detectives call that a fingerprint. Painters call it a self-portrait.',
      closingLine: '{{collection|The Overlooked Collection}}: a self-portrait in five stolen colors. No twin found.',
      traits: { curiosity: 1, creativity: 1 },
    },
    {
      id: 'caught-red-handed',
      title: 'Caught Red-Handed',
      twist:
        "Plot twist: those colors were never the world's. A wall only looks like {{mood|that feeling}} when someone feeling it walks past. Five swatches, from {{first|the boring one}} to the getaway, all wearing your mood: that's not a palette, it's a self-portrait. So much for rule one. Caught red-handed (or whatever color {{mood|that feeling}} turned out to be).",
      closingLine: '{{palette|From Snooze to Sunlight}}: a self-portrait in five stolen colors. Caught red-handed.',
      traits: { creativity: 1, connection: 1 },
    },
  ],
};

export default colorHeist;
