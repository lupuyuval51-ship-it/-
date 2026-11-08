import type { Adventure } from '../../../shared/types.ts';

/**
 * The Long-Lost Signal: a gentle 30-minute solo episode about reaching out, at home or outside.
 * Stage 1 finds a memory artifact (an old photo, a song, an object) and lets it pick the person:
 * someone you drifted from by accident, not on purpose.
 * Branch A sends a memory ("this reminded me of you"), then spends ten phone-down minutes doing one
 * small thing their way; branch B asks a real question (one you'd love to be asked yourself), then
 * answers it yourself. Every send has an unsent-letter alternative, and nothing in the episode
 * depends on a reply.
 * Running bit: the Long-Wave Operator signs off every transmission with "Over", never "Out".
 * A's twist is radio drift (pays off "by accident" and the tagline): a dial left alone slips off the
 * station a hair at a time, nobody's fault, and the fix is easing back onto their wavelength, which
 * the user just did twice. B's twist explains the sign-off: "over" means "your turn", a real question
 * is the purest "over", and it comes back as "What about you?", which the user has already answered.
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
        '“Long time no see” fills the line and says nothing. But {{artifact|that artifact}} is a memory only two people on Earth would recognize, which makes it the clearest signal there is. Over.',
      action:
        'Message them the artifact (a photo, a song link, a snap of the object, or just its name) with one line: “This reminded me of you,” plus one detail only they would get. Hit send before you can rewrite it.',
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
        'Replies keep their own schedule: some come back in a minute, some in a month, and none come back faster while you watch the screen. So for the next ten minutes, we tune to their wavelength instead. Over.',
      action:
        'Put your phone face down for ten minutes (if a reply comes in, it can wait) and do one small thing their way: tea how they make it, their kind of song start to finish, a short walk at their pace.',
      alternative:
        'Rather stay still? Close your eyes for a few minutes and replay one whole scene with them, start to finish: where you were, what was said, how it ended.',
      minutes: 12,
      capture: {
        key: 'their-way',
        label: 'Your ten minutes on their wavelength',
        placeholder: 'tea with two sugars, exactly how they make it',
      },
      amplify: 'Go all the way: their posture, their favorite mug, their famously bad humming. Nobody is watching except the Operator.',
      next: 'small-turn-of-the-dial',
    },
    {
      id: 'real-question',
      stage: 2,
      title: 'The Real Question',
      narrative:
        '“How are you?” is static: everyone answers “good” and the line goes quiet. A real question is a signal only one person can pick up. Over.',
      action:
        "Send them a hello and one real question, the kind you'd love to be asked yourself (“What was the best part of your year?” “Do you still miss the old place?”), by text or voice note, with {{artifact|the artifact}} if it fits.",
      alternative:
        "Not ready to send, or no way to reach them? Write the question at the top of a letter you won't send, and under it, why you've always wondered. The Operator logs unsent transmissions too.",
      minutes: 7,
      capture: {
        key: 'question',
        label: 'The real question you sent (or wrote)',
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
        'A good question deserves two answers, and only one of them depends on the other end of the line. The other one is yours, and it can start right now. Over.',
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
      id: 'small-turn-of-the-dial',
      title: 'A Small Turn of the Dial',
      twist:
        "Plot twist: radios drift. Leave any dial alone long enough and it slips off the station, a hair at a time. Nobody's fault, and the station never stopped broadcasting. You don't fix drift with a new radio; you ease back onto their wavelength. You just did, twice: first {{artifact|a memory}}, then {{their-way|ten minutes their way}}. Back on frequency. Over.",
      closingLine: 'Over to you: {{memory|this reminded me of you}}',
      traits: { connection: 1 },
    },
    {
      id: 'the-open-line',
      title: 'The Open Line',
      twist:
        "Plot twist: did you notice I never once signed off with “out”? On the radio, “out” ends a call. “Over” means your turn. A real question is the purest “over” there is, and sooner or later it comes back around as “What about you?” Whenever yours does, tonight, next month or the day you finally hit send, you won't have to say “good.” You already went first. Over.",
      closingLine: '{{question|What was the best part of your year?}} — I went first: {{answer|today, honestly}}',
      traits: { connection: 1, curiosity: 1 },
    },
  ],
};

export default longLostSignal;
