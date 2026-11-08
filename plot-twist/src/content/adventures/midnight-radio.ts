import type { Adventure } from '../../../shared/types.ts';

/**
 * The Midnight Radio Show: a 30-minute home maker episode. Host a three-minute pirate radio show
 * as voice memos: station name and jingle, one segment, one dedication to a real person
 * (sending it is always optional). Every stage has a write-it or whisper-mode alternative.
 * Branch A is the late-night advice line (letters from the objects in your room, answered warmly,
 * then a quiet-storm dedication); branch B is breaking news from home (tiny events, huge coverage,
 * housemates off the record, then a Person of the Week).
 * Running bit: the Night Producer's "one loyal listener" and the "slight delay". A's twist finds the
 * listener through Solomon's paradox (we advise strangers more wisely than ourselves); B's twist
 * reveals the delay: the only listener is you, months from now.
 */
const midnightRadio: Adventure = {
  id: 'midnight-radio',
  version: 1,
  source: 'curated',
  title: 'The Midnight Radio Show',
  tagline: 'Between two stations, on a frequency nobody owns, someone is about to go on air.',
  intro:
    "Whatever the clock says, in here it is midnight. You are the host, the engineer and the entire jingle department of a pirate radio station broadcasting from your home, on a slight delay, to exactly one loyal listener. We don't know who they are. We love them anyway. The show runs three minutes. You're on in five.",
  kind: 'maker',
  moods: ['creative', 'social'],
  weirdness: 3,
  minutes: 30,
  cost: { min: 0, max: 0 },
  settings: ['home'],
  company: ['solo', 'group'],
  items: ['A phone that records voice memos', 'Paper and a pen'],
  palette: 'cobalt',
  motif: 'orbits',
  traits: { creativity: 2, boldness: 1, connection: 1 },
  stageLabel: 'Segment',
  narrator: 'The Night Producer',
  start: 'find-your-frequency',
  nodes: [
    {
      id: 'find-your-frequency',
      stage: 1,
      title: 'Find Your Frequency',
      narrative:
        'Every pirate station needs three things: a name, a frequency nobody owns and a jingle catchy enough to get stuck in the walls. Keep the volume friendly. The neighbors are not subscribers.',
      action:
        'Name your station and its frequency (your door number works: "Radio Hallway, 42.7 FM"). Then make a jingle from one household sound, like a spoon on a glass or a light switch, and record it as a 10-second voice memo with the station name.',
      alternative:
        'Too late for noise, or not a recording day? Whisper mode: record the jingle at a whisper, or write it as a script with the sound effects in capitals: [SPOON ON GLASS] "You\'re listening to Radio Hallway…"',
      minutes: 8,
      capture: {
        key: 'station',
        label: 'Your station and frequency',
        placeholder: 'Radio Hallway, 42.7 FM',
      },
      amplify: 'Say the station name in the deepest voice your throat owns, lips one finger from the phone, then add your own echo: "…FM… FM… fm."',
      crewTip: 'Split the jobs: one voice, one sound department, one studio audience that must not laugh on air. Swap after every take.',
      choice: {
        prompt: "The red light is on. What's on {{station|the station}} tonight?",
        options: [
          {
            id: 'advice',
            label: 'The Late-Night Advice Line',
            description: "Letters from listeners who can't sleep. Answers in your softest voice.",
            next: 'the-mailbag',
            traits: { connection: 1 },
          },
          {
            id: 'news',
            label: 'Breaking News From Home',
            description: 'Tiny events. Huge coverage. Live from the kitchen.',
            next: 'live-from-the-kitchen',
            traits: { boldness: 1 },
          },
        ],
      },
    },
    {
      id: 'the-mailbag',
      stage: 2,
      title: 'The Mailbag',
      narrative:
        "Every late-night advice show runs on letters from people who can't sleep. Ours come from an unusual address. Tonight, every single listener is writing in from inside your home.",
      action:
        'Write two short letters to the show from objects in this room, each with one small midnight problem ("Dear Midnight, the window and I have drifted apart. Signed, Wilting on the Sill"). Record yourself reading each one and answering it, warmly, in under a minute.',
      alternative:
        'Not recording? Write your answer under each letter instead, like a newspaper advice column. Or keep recording in whisper mode: the late-late edition, for listeners already in bed.',
      minutes: 12,
      capture: {
        key: 'advice',
        label: 'Your best advice on air',
        placeholder: "Lean toward the light. The window isn't going anywhere.",
      },
      amplify: 'Let the fridge hum be your background music (or hum something low yourself) and pause before each piece of advice like it cost you something.',
      crewTip: 'Everyone secretly writes one letter; the host answers them live, unseen. Authors may not reveal themselves until after the sign-off.',
      next: 'the-quiet-storm',
    },
    {
      id: 'the-quiet-storm',
      stage: 3,
      title: 'The Quiet Storm',
      narrative:
        'Late-night radio has a name for its softest format: the quiet storm. Lights low, voices lower, slow songs only. And the last song of the night always goes out to someone.',
      action:
        "Record your dedication: name a real person who'd smile at this, pass on one line of advice from tonight, name the song you'd play them, and sign off with your station ID. Sending it is entirely optional.",
      alternative:
        'Rather not record, or not name names? Write the dedication in your notes app instead, to someone real or simply "to whoever\'s still awake", with the best advice of the night and the song. Sign it with your station name.',
      minutes: 8,
      capture: {
        key: 'dedication',
        label: 'Who the last song went out to',
        placeholder: 'my sister, who is also awake right now',
      },
      amplify: 'Switch off one light before you press record. Drop your voice to two in the morning and let the pause before their name last a full second.',
      crewTip: 'Each person dedicates a song to someone different. Record them back to back as one long, warm sign-off; argue about the playlist later.',
      next: 'solomons-paradox',
    },
    {
      id: 'live-from-the-kitchen',
      stage: 2,
      title: 'Live From the Kitchen',
      narrative:
        'This just in: things are happening in your home, and nobody is covering them. The fridge has been humming for hours. A sock has been missing for weeks. The newsroom is awake.',
      action:
        'Go live from three spots in your home, twenty seconds each, covering one tiny event per spot with full breaking-news urgency ("Reports are coming in: the tap is dripping. Again."). Things only; housemates are off the record. Record it all as one voice memo.',
      alternative:
        'Anchoring from one seat? Report three tiny events you can see or hear from where you are in an urgent newsreader whisper, or write them as three front-page headlines in capitals.',
      minutes: 12,
      capture: {
        key: 'scoop',
        label: "Tonight's top story, as a headline",
        placeholder: 'KETTLE BOILS, NATION STUNNED',
      },
      amplify: 'Interview a witness: hold the phone out to the fridge for three seconds of silence, then report gravely, "The fridge declined to comment."',
      crewTip: 'One anchor stays in the studio (the sofa) while a field reporter roams. Every report ends with "Back to you in the studio," no matter what.',
      next: 'person-of-the-week',
    },
    {
      id: 'person-of-the-week',
      stage: 3,
      title: 'Person of the Week',
      narrative:
        "Every news hour ends on a human-interest story, the one that makes the anchor's voice go soft. After {{scoop|tonight's top story}}, the newsroom has one honor left to give, to a real person who has never made the news.",
      action:
        'Record the closing segment: "Our Person of the Week is…" Name someone real, report the small, great thing they did lately in twenty seconds, then sign off with your station ID. Send it to them only if you want to.',
      alternative:
        'Not recording, or not naming names? Write it as a front page instead: one headline and three lines about someone who deserves it ("LOCAL FRIEND REMEMBERS BIRTHDAY; CITY MOVED"), signed with your station name.',
      minutes: 8,
      capture: {
        key: 'hero',
        label: 'Your Person of the Week, and why',
        placeholder: 'Dana, for remembering my coffee order',
      },
      amplify: 'Give their name a drumroll on the nearest table, then a round of whispered applause from the newsroom. The newsroom is you, clapping very quietly.',
      crewTip: 'Every reporter nominates one Person of the Week. Announce them all; nobody loses. This is the news, not a game show.',
      next: 'slight-delay',
    },
  ],
  endings: [
    {
      id: 'solomons-paradox',
      title: "Solomon's Paradox",
      twist:
        "Plot twist: we found our listener. This station never gets letters; the host writes them all, and psychologists know why it works. They call it Solomon's paradox: we advise strangers more wisely than ourselves. So you invented some. Every answer was for the listener tuned in all along: you. Only one song was ever for anyone else: the one for {{dedication|someone real}}.",
      closingLine: "{{advice|Lean toward the light. The window isn't going anywhere.}} Good night from {{station|our little station}}.",
      traits: { connection: 1, creativity: 1 },
    },
    {
      id: 'slight-delay',
      title: 'On a Slight Delay',
      twist:
        "Plot twist: we found our listener. They're just tuning in on a slight delay. Months from now, you'll stumble on this show somewhere in your phone. To that listener, {{scoop|tonight's top story}} won't be small news at all. It will be the only live coverage of an ordinary night in this home, back when the newsroom was a kitchen and the anchor was you.",
      closingLine: 'BREAKING: {{scoop|KETTLE BOILS, NATION STUNNED}}. Person of the Week: {{hero|you know who you are}}.',
      traits: { curiosity: 1, connection: 1 },
    },
  ],
};

export default midnightRadio;
