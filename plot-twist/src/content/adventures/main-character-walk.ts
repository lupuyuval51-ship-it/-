import type { Adventure } from '../../../shared/types.ts';

/**
 * The Main Character Walk: a 30-minute solo walk starring the user as the lead of their own trailer.
 * Branch A is film noir (slow, observational, an inner voiceover that notices everything);
 * branch B is a musical (rhythm, an "I want" song, a final pose). Nobody is filmed, ever.
 * Running bit: the Trailer Voice opens every scene with "In a world…", and the twists answer it.
 */
const mainCharacterWalk: Adventure = {
  id: 'main-character-walk',
  version: 1,
  source: 'curated',
  title: 'The Main Character Walk',
  tagline: 'A trailer is being cut today. The studio has already cast the lead.',
  intro:
    'Today you star in the trailer for your own film. Nobody films you, you film nobody, and there is no budget: just a deep voice in your head that keeps saying "In a world…" and a street that has no idea it is a set. Walk like the music has already started.',
  kind: 'wanderer',
  moods: ['change', 'creative'],
  weirdness: 3,
  minutes: 30,
  cost: { min: 0, max: 0 },
  settings: ['outside'],
  company: ['solo'],
  items: ['Headphones (optional)'],
  palette: 'rose',
  motif: 'rays',
  traits: { boldness: 2, creativity: 1 },
  stageLabel: 'Take',
  narrator: 'The Trailer Voice',
  start: 'establishing-shot',
  nodes: [
    {
      id: 'establishing-shot',
      stage: 1,
      title: 'The Establishing Shot',
      narrative:
        'In a world where everyone is staring at their phone… one person is about to look up. Every trailer opens wide. The camera is in your head, because strangers never signed the release.',
      action:
        'Walk to the nearest spot with a long view (the end of a street, the edge of a park) and stand still for 30 seconds while the imaginary camera pushes in. Choose your trailer song: headphones at low volume, or hummed in your head.',
      alternative:
        'From a window, doorway or bench, take one slow 30-second look from the farthest thing you can see down to your own feet. That is the camera pushing in. Then choose your song.',
      minutes: 7,
      capture: {
        key: 'opening',
        label: 'What your opening shot shows',
        placeholder: 'one red awning in the late sun',
      },
      amplify: 'Frame the shot with your fingers like a director. Squint. Whisper "and… action", then start walking as if it were your cue.',
      choice: {
        prompt: 'The studio needs a genre before the music drops. What kind of film is today?',
        options: [
          {
            id: 'noir',
            label: 'Film Noir',
            description: 'Shadows, hunches, a voiceover with gravel in it.',
            next: 'inciting-incident',
            traits: { curiosity: 1 },
          },
          {
            id: 'musical',
            label: 'The Musical',
            description: 'The city is the orchestra. You are the big number.',
            next: 'i-want-song',
            traits: { boldness: 1 },
          },
        ],
      },
    },
    {
      id: 'inciting-incident',
      stage: 2,
      title: 'The Inciting Incident',
      narrative:
        'In a city that never tells the truth… one detective has a hunch. Your opening shot, {{opening|that quiet street}}, looked innocent. Too innocent. Noir runs on voiceover, and yours notices everything.',
      action:
        'Walk a slow ten-minute loop while a hard-boiled voice in your head narrates the city, not its people: "The bakery sign flickered like it owed somebody money." The first small, strange thing that happens is your inciting incident.',
      alternative:
        'From a bench, a step or a bus stop, narrate what you see in the same gravelly voice until something small happens: a shutter, a gust, a bus that doesn\'t stop. That\'s your case.',
      minutes: 12,
      capture: {
        key: 'incident',
        label: 'The inciting incident',
        placeholder: 'a shutter slamming at 4:12 exactly',
      },
      amplify: 'Pause under the next awning as if it\'s raining (it isn\'t). Check an imaginary watch. Mutter, "Too quiet."',
      next: 'title-card-shadows',
    },
    {
      id: 'title-card-shadows',
      stage: 3,
      title: 'Title Card in the Shadows',
      narrative:
        'In a world of shadows… every case gets a title card. One incident changed everything: {{incident|that strange little moment}}. And noir always ends where the light cuts across the dark.',
      action:
        'Find a line where sun meets shadow (under a railing, a fence, the edge of an awning) and stand half in, half out. Drop the title in your head, then write the title card: the film\'s name and its tagline.',
      alternative:
        'No sharp shadows, or staying seated? Find any reflection (a shop window, a puddle, your dark phone screen) and hold its gaze for five seconds like it knows something. Then write the title card.',
      minutes: 9,
      capture: {
        key: 'noir-card',
        label: 'Your title card: name and tagline',
        placeholder: 'SIDEWALK. The city kept its secrets. Until today.',
      },
      amplify: 'Say the title out loud, low and slow, to no one in particular. Hold the pause after it as if pauses cost money.',
      next: 'the-usual-suspect',
    },
    {
      id: 'i-want-song',
      stage: 2,
      title: 'The "I Want" Song',
      narrative:
        'In a world without music… one pedestrian hears the beat. Every musical pauses early so its lead can sing what they want from life. Crossings beep in tempo. Bus doors sigh on the off-beat. That\'s your cue.',
      action:
        'Walk a ten-minute loop on the beat (your song, or the street\'s: footsteps, crossing beeps). Turn one small thing that happens into your "I want" line and hum it under your breath: "I want the confidence of that pigeon."',
      alternative:
        'From a bench or a step, tap the street\'s rhythm on your knee for five minutes, then write your "I want" line about the first small thing that happens in front of you.',
      minutes: 12,
      capture: {
        key: 'lyric',
        label: 'Your "I want" line',
        placeholder: 'I want a day as bright as that yellow door',
      },
      amplify: 'On an empty stretch of pavement, take a tiny dance break: one twirl, a step-ball-change or jazz hands. Then carry on as if nothing happened, as the law of musicals requires.',
      next: 'big-finish',
    },
    {
      id: 'big-finish',
      stage: 3,
      title: 'The Big Finish',
      narrative:
        'In a world that needs a finale… the orchestra swells. Musicals always come back to the "I want" song, so your last note is already written: {{lyric|the line you hummed on the way}}.',
      action:
        'Find your stage (a bench, a step, a patch of open pavement). Hum your line one last time, hit a final pose on the last beat as the title drops, then write the title card: name and tagline.',
      alternative:
        'Seated or short on space? Your finale is your hands: one big flourish on the last beat and a held smile. Then write the title card while the imaginary orchestra holds the note.',
      minutes: 9,
      capture: {
        key: 'musical-card',
        label: 'Your title card: name and tagline',
        placeholder: 'CROSSWALK! One street. One beat. One brave hum.',
      },
      amplify: 'Hold the final pose three seconds longer than is comfortable, then take a small bow to the street. The street doesn\'t clap. It doesn\'t need to.',
      next: 'audience-of-one',
    },
  ],
  endings: [
    {
      id: 'the-usual-suspect',
      title: 'The Usual Suspect',
      twist:
        'Plot twist: in a world where nobody was watching… the street was watching you. The inciting incident was never {{incident|that strange little moment}}. It was you: one person walking an ordinary street as if it held secrets. That is how every great case begins, and the good ones never close.',
      closingLine: '{{noir-card|SIDEWALK. The city kept its secrets. Until today.}}',
      traits: { curiosity: 1, boldness: 1 },
    },
    {
      id: 'audience-of-one',
      title: 'Audience of One',
      twist:
        'Plot twist: in a world where nobody was watching… you sang anyway. A trailer has one job: make someone want the whole film. This one was cut for an audience of one, and somewhere between {{opening|the opening shot}} and "{{lyric|I want more days like this}}", the audience bought a ticket.',
      closingLine: '{{musical-card|CROSSWALK! One street. One beat. One brave hum.}}',
      traits: { boldness: 1, creativity: 1 },
    },
  ],
};

export default mainCharacterWalk;
