import type { Adventure } from '../../../shared/types.ts';

/**
 * The Long-Lost Signal: a gentle 30-minute solo episode about reaching out, at home or outside.
 * Stage 1 finds a memory artifact (an old photo, a song, an object) and lets it pick the person:
 * someone you drifted from by accident, not on purpose.
 * Branch A sends a memory ("this reminded me of you"), then spends ten phone-down minutes doing one
 * small thing their way; branch B asks a real question (one you'd love to be asked yourself), then
 * answers it yourself while it travels. Every send has an unsent-letter alternative, and nothing in
 * the episode depends on a reply. Running bit: the Long-Wave Operator signs off every transmission
 * with "Over", never "Out"; both twists explain why ("over" means "your turn"), so the line stays
 * open whether or not anyone has answered yet. A reframes the artifact as their signal, which the
 * user just answered; B reframes the self-answer as preparation: good questions come back as
 * "What about you?", and the user's answer is already written.
 */
const longLostSignal: Adventure = {
  id: 'long-lost-signal',
  version: 1,
  source: 'curated',
  title: 'The Long-Lost Signal',
  tagline: 'Somebody drifted out of range years ago. Their signal never quite stopped.',
  intro:
    "This is the Long-Wave Operator, keeping watch on the channel for people who drifted out of range. Somewhere out there is someone you haven't talked to in a while, for no good reason at all. Today we find their signal, tune in and send one back. No perfect words required. Over.",
  kind: 'social',
  moods: ['social'],
  weirdness: 1,
  minutes: 30,
  cost: { min: 0, max: 0 },
  settings: ['home', 'outside'],
  company: ['solo'],
  items: ['Your phone', 'Paper and a pen (optional)'],
  palette: 'noir',
  motif: 'waves',
  traits: { connection: 2, boldness: 1 },
  stageLabel: 'Transmission',
  narrator: 'The Long-Wave Operator',
  start: 'search-the-static',
  nodes: [
    {
      id: 'search-the-static',
      stage: 1,
      title: 'Search the Static',
      narrative:
        "Lost signals always leave something behind: a photo, a song, an object nobody quite threw away. We don't pick the person; the artifact does. Over.",
      action:
        'Scroll your photos back at least two years, or open an old box, drawer or playlist, until something stops you: a trace of someone you drifted from by accident, not on purpose. Stay with it for one full minute.',
      alternative:
        "No old photos or boxes to hand? Tune in from memory: close your eyes and wait for a song, a place or a joke that only makes sense with one person. That's your artifact.",
      minutes: 9,
      capture: {
        key: 'artifact',
        label: 'The artifact that stopped you',
        placeholder: 'a blurry photo from that road trip',
      },
      amplify: 'Once you know who it is, say their name out loud, softly, like testing a microphone. Check, one, two.',
      choice: {
        prompt: 'Signal located. What do you send down the line?',
        options: [
          {
            id: 'memory',
            label: 'Send a memory',
            description: '“This reminded me of you.” Warm, light, nothing to answer.',
            next: 'reminded-me-of-you',
            traits: { connection: 1 },
          },
          {
            id: 'question',
            label: 'Ask a real question',
            description: "Not “how are you?” One they'll actually want to answer.",
            next: 'real-question',
            traits: { curiosity: 1 },
          },
        ],
      },
    },
    {
      id: 'reminded-me-of-you',
      stage: 2,
      title: 'This Reminded Me of You',
      narrative:
        '“Long time no see” is static: it fills the line and says nothing. But {{artifact|that artifact}} is a memory only the two of you would recognize, and memories cut through anything, even years. Over.',
      action:
        'Send them the artifact (a photo, a song link, a snap of the object, or just its name) with one line: “This reminded me of you,” plus one detail only they would get. Then send it before you can rewrite it.',
      alternative:
        "Not ready to send, or no way to reach them? Write it as a letter you won't send: the artifact, “this reminded me of you” and the detail. Unsent letters are still transmissions.",
      minutes: 7,
      capture: {
        key: 'memory',
        label: 'The line you sent (or wrote)',
        placeholder: 'This reminded me of you. Remember the sandals?',
      },
      amplify: 'Send it as a voice note instead: ten seconds, unrehearsed, and if you laugh halfway through, leave it in.',
      next: 'their-wavelength',
    },
    {
      id: 'their-wavelength',
      stage: 3,
      title: 'On Their Wavelength',
      narrative:
        'Replies keep their own schedule: some come back in a minute, some in a month, and none come back faster while you watch the screen. While yours travels, we get on their wavelength. Over.',
      action:
        'Put your phone face down for ten minutes (if a reply comes in, it can wait) and do one small thing their way: tea how they make it, their kind of song start to finish, a short walk at their pace.',
      alternative:
        'Rather stay still? Close your eyes for a few minutes and replay one whole scene with them, start to finish: where you were, what was said, how it ended.',
      minutes: 12,
      capture: {
        key: 'their-way',
        label: 'The thing you did their way',
        placeholder: 'tea with two sugars, exactly how they make it',
      },
      amplify: 'Go all the way: their posture, their favorite mug, their famously bad humming. Nobody is watching except the Operator.',
      next: 'signal-received',
    },
    {
      id: 'real-question',
      stage: 2,
      title: 'The Real Question',
      narrative:
        '“How are you?” is static: everyone answers “good” and the line goes quiet. A real question is a signal only one person can pick up. Over.',
      action:
        "Write them one real question, the kind you'd love to be asked yourself (“What was the best part of your year?” “Do you still miss the old place?”), and send it by text or voice note, with {{artifact|the artifact}} if it fits.",
      alternative:
        "Not ready to send, or no way to reach them? Write the question at the top of a letter you won't send, and under it, why you've been wondering. Unsent letters are still transmissions.",
      minutes: 7,
      capture: {
        key: 'question',
        label: 'The real question you asked',
        placeholder: 'Do you still miss the old neighborhood?',
      },
      amplify: "Skip the safe question and ask the one you've actually wondered about for years, as long as it's a kind one.",
      next: 'other-end-of-the-line',
    },
    {
      id: 'other-end-of-the-line',
      stage: 3,
      title: 'The Other End of the Line',
      narrative:
        'A good question deserves two answers, and only one of them depends on the other side. While yours travels, the line is all yours. Over.',
      action:
        'Silence notifications for ten minutes and answer your own question as honestly as you hope they will: five sentences, on paper or in a note, no editing.',
      alternative: 'Not a writing moment? Answer it out loud instead: a two-minute voice memo to yourself, as if they had asked you first.',
      minutes: 12,
      capture: {
        key: 'answer',
        label: 'Your own answer, in one line',
        placeholder: 'Some days. Mostly the bakery on Fridays.',
      },
      amplify: 'When the ten minutes are up, send them your answer too, if it feels right. Questions are easier to answer when someone goes first.',
      next: 'the-open-line',
    },
  ],
  endings: [
    {
      id: 'signal-received',
      title: 'Signal Received',
      twist:
        "Plot twist: you didn't start this conversation. Years ago they sent you {{artifact|that artifact}} without knowing it, and today it finally came in range. You answered, then spent ten minutes on their wavelength ({{their-way|doing one thing their way}}). Notice I never signed off with “out”? “Out” ends a call. “Over” means your turn. Whenever their turn comes, the line is open.",
      closingLine: 'Over to you: {{memory|this reminded me of you}}',
      traits: { connection: 1 },
    },
    {
      id: 'the-open-line',
      title: 'The Open Line',
      twist:
        "Plot twist: good questions boomerang. Ask one, and sooner or later it comes back as “What about you?” Yours ({{question|a real one}}) already has an answer waiting, so whenever the line crackles, you won't have to say “good.” Notice I never signed off with “out”? “Out” ends a call. “Over” means your turn. Tonight or next month, the line is open.",
      closingLine: '{{question|What was the best part of your year?}} — I went first: {{answer|today, honestly}}',
      traits: { connection: 1, curiosity: 1 },
    },
  ],
};

export default longLostSignal;
