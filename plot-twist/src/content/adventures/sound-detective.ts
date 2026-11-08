import type { Adventure } from '../../../shared/types.ts';

/**
 * A gentle listening case that works on a sofa, a balcony or a park bench.
 * Branch A chases the loudest sound (outward, active: test its alibi, then
 * catch what plays in the gap); branch B stakes out the quietest (inward,
 * still: hold it, touch its source, take its statement).
 * Running bit: Inspector Hush's whispered case-talk, alibis, "witnesses are shy".
 * Department policy keeps it respectful: people are never suspects, only things.
 * Twists reframe the detective: the steady sound was listening to you all
 * along (A); the shyest witness on the case was you, breathing (B).
 */
const soundDetective: Adventure = {
  id: 'sound-detective',
  version: 1,
  source: 'curated',
  title: 'The Sound Detective',
  tagline: "A witness has been talking right beside you this whole time. You haven't heard a word.",
  intro:
    'Inspector Hush here. Keep your voice down. Wherever you are, one sound has been there since before you arrived, so steady that your brain filed it under silence. Today you line up the suspects, clear the ones with alibis, and find the sound that heard everything.',
  kind: 'detective',
  moods: ['curious'],
  weirdness: 1,
  minutes: 15,
  cost: { min: 0, max: 0 },
  settings: ['home', 'outside'],
  company: ['solo', 'group'],
  items: [],
  palette: 'tide',
  motif: 'waves',
  traits: { curiosity: 2, connection: 1 },
  stageLabel: 'Tape',
  narrator: 'Inspector Hush',
  start: 'line-up',
  nodes: [
    {
      id: 'line-up',
      stage: 1,
      title: 'The Line-Up',
      narrative:
        'Every place is a crime scene: things happen and nobody notices. Witnesses are shy, so we start with the suspects. Department policy: people are never suspects. Only things.',
      action:
        'Sit or stand somewhere safe and still, close your eyes, and count every separate sound you hear for two full minutes, folding down a finger for each. Then open them and note the oddest suspect.',
      alternative:
        'Rather keep your eyes open? Rest them on one fixed spot instead. Or lay a palm flat on a table, wall, bench or window and count the hums and buzzes you can feel.',
      minutes: 5,
      capture: {
        key: 'oddest',
        label: 'The oddest suspect in your line-up',
        placeholder: 'a spoon tapping somewhere upstairs',
      },
      amplify: 'Present each suspect under your breath, line-up style: “Number four. The squeaky gate. Step forward. Turn to the left.”',
      crewTip: 'Count in silence, then compare lists. Any sound only one of you heard goes in the file marked “disputed.”',
      choice: {
        prompt: 'Your line-up is full (yes, even {{oddest|the odd one}}). Who do you question first?',
        options: [
          {
            id: 'loudest',
            label: 'Chase the loudest',
            description: 'Follow the noise to its source and test its alibi.',
            next: 'loudmouth',
            traits: { boldness: 1 },
          },
          {
            id: 'quietest',
            label: 'Stake out the quietest',
            description: 'Sit tight, lean in, and take its statement.',
            next: 'stakeout',
            traits: { curiosity: 1 },
          },
        ],
      },
    },
    {
      id: 'loudmouth',
      stage: 2,
      title: 'The Loudmouth',
      narrative:
        "The loudest suspect always talks first. It's confident, it's everywhere, and it swears it was only passing through. Let's check its story.",
      action:
        'Track the loudest sound back to the thing making it, no further than your window, your door or the end of the block, and name it. Then time it for two minutes: does it stop, loop or fade?',
      alternative:
        'Track it without moving: cup your hands behind your ears, turn your head slowly until the sound peaks, and point. Then time it for two minutes from right where you are.',
      minutes: 5,
      capture: {
        key: 'suspect',
        label: 'Your prime suspect',
        placeholder: 'a delivery scooter with opinions',
      },
      amplify: 'Narrate the pursuit in a hushed nature-documentary voice: “The suspect is heading east. The suspect is… a leaf blower.”',
      crewTip: 'On three, everyone points at the source with eyes closed. Open them and count how many fingers agree.',
      next: 'the-gap',
    },
    {
      id: 'the-gap',
      stage: 3,
      title: 'The Gap',
      narrative:
        "Even {{suspect|a loudmouth}} has to stop for breath. When it does, the scene doesn't go silent; something underneath keeps going. Shy witnesses only talk in the gaps.",
      action:
        "Wait for your prime suspect to pause or leave. The instant it does, close your eyes and catch the sound underneath: the one that didn't just start, because it never stopped.",
      alternative:
        'If it never lets up, make your own gap: cup your palms over your ears for ten seconds, then lift them. Do it three times, listening for the quiet sound that is there every single time.',
      minutes: 4,
      capture: {
        key: 'gap',
        label: 'The sound hiding underneath',
        placeholder: 'a low hum, like the building breathing',
      },
      amplify: "When you catch it, tap your temple twice: the universal sign of a detective who knew all along. (You didn't. Tap anyway.)",
      crewTip: 'Whoever hears the hidden sound first raises a hand without a word. Nobody speaks until every hand is up.',
      next: 'the-decoy',
    },
    {
      id: 'stakeout',
      stage: 2,
      title: 'The Stakeout',
      narrative:
        "Forget the loud ones, and forget {{oddest|the oddest suspect}}. Quiet suspects never run; they don't have to. We wait them out, like a detective in a parked car with a thermos and endless patience.",
      action:
        'Find the faintest sound you can still make out and hold onto it for one full minute while louder sounds pass over it. Lose it, and the minute starts again.',
      alternative:
        'Too noisy for anything faint? Gently plug one ear with a fingertip and turn the other toward the quietest direction. Stake out whatever hums there for one minute.',
      minutes: 4,
      capture: {
        key: 'quiet',
        label: 'The quietest sound you held onto',
        placeholder: 'a hum nobody ever switched off',
      },
      amplify: 'Give it a code name the moment you find it, something like “The Accountant,” and refer to it by code name only.',
      crewTip: "Each of you stakes out a different faint sound. After a minute, swap, and try to find each other's.",
      next: 'testimony',
    },
    {
      id: 'testimony',
      stage: 3,
      title: 'The Testimony',
      narrative:
        "Here's the thing about {{quiet|your quiet suspect}}: it has no alibi, because it never left. It was here before you arrived. It isn't a suspect; it's the witness.",
      action:
        "Face its source and, if it's safe to touch, rest a hand on it: a fridge door, a wall, a window, a tree. Then write its statement in one sentence: everything it has heard here.",
      alternative:
        "Can't reach the source, or don't feel like writing? Close your eyes, let it hum for thirty seconds, then give its statement under your breath in its voice: slow, low, unbothered.",
      minutes: 4,
      capture: {
        key: 'statement',
        label: "The witness's statement, in one line",
        placeholder: "I've heard every door slam since 2009. I forgive you.",
      },
      amplify: 'Swear the witness in first, right hand raised: “Do you swear to tell the truth, the whole truth and nothing but the hum?” Take the hum as a yes.',
      crewTip: 'Everyone writes a statement for the same witness. Read them aloud; the most suspiciously specific one goes in the file.',
      next: 'second-witness',
    },
  ],
  endings: [
    {
      id: 'the-decoy',
      title: 'The Decoy',
      twist:
        "Plot twist: the loudmouth was a decoy. Loud things make noise so you'll look their way, and for years it worked. All along, one sound was underneath, hearing everything: {{gap|the hum beneath it all}}. It heard a detective count on their fingers, chase {{suspect|the wrong suspect}} and then stand very, very still. Its statement is in. It's mostly about you.",
      closingLine: 'Star witness: {{gap|a low hum, like the building breathing}}. It never left the scene.',
      traits: { curiosity: 1 },
    },
    {
      id: 'second-witness',
      title: 'The Second Witness',
      twist:
        'Plot twist: there were two witnesses. You took a statement from {{quiet|the quiet one}}, but the other has been at every scene of your life without interrupting once. Listen under everything, one last time. That soft, steady breathing? Yours. The shyest witness on the case was the detective.',
      closingLine: "The witness, on the record: {{statement|I heard everything. I'm not one to gossip.}}",
      traits: { connection: 1 },
    },
  ],
};

export default soundDetective;
