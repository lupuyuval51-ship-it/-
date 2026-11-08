import type { Adventure } from '../../../shared/types.ts';

/**
 * The Color Heist: a 15-minute game for home or outside, solo or with a crew.
 * Steal five colors (a close-up photo or a note; touch nothing; objects and places only, never
 * people) and name each like a paint chip. Stage 1 is the warm-up: the most boring color in sight,
 * made to sound expensive.
 * Branch A hunts one-of-a-kind colors (the Twin Test, then a coin-sized crown jewel, then a name for
 * the collection); branch B is an inside job (three colors of the feeling you walked in with, then
 * one getaway color for the feeling you want to leave with).
 * Running bit: the trade's one rule, "no fingerprints". A's twist runs a twin test on the whole haul:
 * no other thief would pick these five, and a pattern with no twin is a fingerprint. B's twist: a
 * color only looks like a mood to someone feeling it, so spotting the getaway color means the user
 * is already halfway there ("caught red-handed").
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
        "The trade has one rule: no fingerprints. We touch nothing and take only color (from objects and places, never people or what they're wearing), so nobody ever knows they were robbed. First, a warm-up so easy it's insulting.",
      action:
        "Find the most boring color in sight (a wall, a lid, a paving stone) and steal it: a close-up photo so tight it's only color, or a note of where it lives. Then give it a paint-chip name fancy enough to sell.",
      alternative:
        "Eyes need a rest, or the light's too low? Steal from memory: the dullest color you saw today (a bus seat, a waiting-room wall, a dish sponge). Note where it lives, then give it a paint-chip name all the same.",
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
            description: 'An inside job: the colors of how you feel, then a getaway.',
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
        'Prowl the room or the street for colors that appear exactly once (one red lid, one sticker, one wildflower in a pavement crack). Give each a ten-second twin check, then steal and name the first three survivors.',
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
        'Rather not hunt? Name the feeling you walked in with, then steal its three colors from memory: places from this week that felt exactly like it. Note where each color lives and give it a paint-chip name.',
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
        'Pick the feeling you want to leave with, then steal one color that looks exactly like it: your fifth and final job. Name it like the priciest paint chip in the shop.',
      alternative:
        "Can't spot it from here? Steal it from memory: the color of a place that always puts you in the mood you're after (a sunny kitchen, a beach towel, a library lamp). Name it like the priciest paint chip in the shop.",
      minutes: 4,
      capture: {
        key: 'getaway',
        label: "Your getaway color's paint-chip name",
        placeholder: 'First Warm Day Yellow',
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
        'Plot twist: the Fence ran one last twin test, on the whole haul. Plenty of thieves could lift {{rare|one rare color}}, but nobody else alive would pick these five, from {{first|that boring one}} to the crown jewel. No twin found. Detectives have a name for a pattern with no twin: a fingerprint. Yours is on every scene. So much for the one rule.',
      closingLine: '{{collection|The Overlooked Collection}}: five stolen colors, one set of fingerprints.',
      traits: { curiosity: 1, creativity: 1 },
    },
    {
      id: 'caught-red-handed',
      title: 'Caught Red-Handed',
      twist:
        "Plot twist: those colors were never the world's. A wall only looks like {{mood|that feeling}} when someone feeling it walks past, so every swatch you lifted was wearing you. That includes the getaway: you could only spot {{getaway|that last color}} because part of you already feels that way. So much for no fingerprints. Caught red-handed, and halfway out the door.",
      closingLine: 'In: {{mood|one mood}}. Out: {{getaway|one getaway color}}. Caught red-handed.',
      traits: { creativity: 1, connection: 1 },
    },
  ],
};

export default colorHeist;
