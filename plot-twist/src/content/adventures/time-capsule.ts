import type { Adventure } from '../../../shared/types.ts';

/**
 * A small reset ritual at home: pack a tiny time capsule (three small things
 * and a short letter) for future you. Branch A (one month) is a near check-in:
 * playful predictions, a dare, the capsule left in plain sight. Branch B (one
 * year) is a long shot: a reflective letter that starts from the oldest thing
 * found while digging, hidden back in that same forgotten spot behind a riddle.
 * Running bit: the Bureau of Delayed Mail, punctual about being late. Both
 * twists pay off the "relic" found in stage 1; B lands the seed twist (past-you
 * already sent a capsule, and today's letter is the reply). Every stage has a
 * fully digital route (phone album, typed note or voice memo); no special
 * container is needed.
 */
const timeCapsule: Adventure = {
  id: 'time-capsule',
  version: 1,
  source: 'curated',
  title: 'The Time Capsule Protocol',
  tagline: 'The only post office where every letter arrives exactly as late as you asked.',
  intro:
    "Welcome to the Bureau of Delayed Mail. We serve exactly one customer, and in all our years we have never once delivered early. Today you'll pack a tiny time capsule, three small things and a short letter, for the only person guaranteed to receive it.",
  kind: 'ritual',
  moods: ['change'],
  weirdness: 1,
  minutes: 30,
  cost: { min: 0, max: 0 },
  settings: ['home'],
  company: ['solo'],
  items: ['Paper and a pen', 'An envelope or jar, if you have one'],
  palette: 'dusk',
  motif: 'arches',
  traits: { connection: 2, creativity: 1 },
  stageLabel: 'Article',
  narrator: 'The Bureau of Delayed Mail',
  start: 'excavation',
  nodes: [
    {
      id: 'excavation',
      stage: 1,
      title: 'The Excavation',
      narrative:
        'Bureau protocol: before anything is sent forward, someone has to look back. Every home has a few places where small things go to be forgotten. Start with one.',
      action:
        'Gather three small things that only make sense this week: a receipt, a ticket stub, a sticky note, a shopping list. Then dig through one forgotten spot (a drawer, an old bag, a coat pocket) for the oldest thing hiding there.',
      alternative:
        'Go fully digital: choose three photos or screenshots from this week and drop them into a new phone album. Then scroll back as far as your camera roll goes and find the oldest photo there.',
      minutes: 10,
      capture: {
        key: 'relic',
        label: 'The oldest thing you stumbled across',
        placeholder: 'a cinema ticket from 2019, still folded',
      },
      amplify: 'Weigh each find in your palm like a postal clerk and announce its postage: “One receipt. Very light. First class, no rush.”',
      choice: {
        prompt: 'Protocol requires a delivery date. When should this capsule reach you?',
        options: [
          {
            id: 'month',
            label: 'One month from now',
            description: 'A near check-in. Send a dare, then find out if you took it.',
            next: 'thirty-day-bet',
            traits: { boldness: 1 },
          },
          {
            id: 'year',
            label: 'One year from now',
            description: "A long shot. Write to someone you haven't met yet.",
            next: 'long-shot-letter',
            traits: { connection: 1 },
          },
        ],
      },
    },
    {
      id: 'thirty-day-bet',
      stage: 2,
      title: 'The Thirty-Day Bet',
      narrative:
        "Short-haul mail has one Bureau rule: be specific. In a month you'll still remember today. What you'll want to know is whether you followed through.",
      action:
        'Write a short letter to yourself, one month from now: three predictions for the next thirty days (one tiny, one likely, one bold) and one small dare. Draw a box beside each, to tick when you open it.',
      alternative:
        'Not in a writing mood? Type it into a note titled with the delivery date, or record a 60-second voice memo. Same contents: three predictions and one dare.',
      minutes: 10,
      capture: {
        key: 'dare',
        label: 'The dare you sent forward',
        placeholder: 'cook one new thing every week',
      },
      amplify: 'Make the dare one notch braver than feels comfortable. Future-you will either thank you or argue back, and both make excellent mail.',
      next: 'seal-and-set',
    },
    {
      id: 'seal-and-set',
      stage: 3,
      title: 'Seal and Set',
      narrative:
        "The Bureau doesn't do overnight. It does exactly thirty days: long enough for the dare ({{dare|yes, that one}}), short enough that you can't pretend you forgot.",
      action:
        "Seal the letter and your three things in an envelope or jar (or fold the letter around them), write “Do not open until” and the date, and put it where you'll see it every day. Then set a 30-day calendar reminder with a mysterious title.",
      alternative:
        'Kept it digital? Add a photo or screenshot of your letter to the album, rename the album “Do not open until” plus the date, and set the same 30-day reminder with a mysterious title.',
      minutes: 7,
      capture: {
        key: 'reminder',
        label: "Your reminder's mysterious title",
        placeholder: "A delivery from the Bureau. Don't panic.",
      },
      amplify: "Sign across the seal like a spy, so you'll know if anyone opens it early. Especially you.",
      next: 'dare-with-a-postmark',
    },
    {
      id: 'long-shot-letter',
      stage: 2,
      title: 'The Long-Shot Letter',
      narrative:
        "A year is far enough that whoever opens this will be a slight stranger. They'll remember the big things. What they'll have lost are the small ones: today's prices, today's worries, today's song.",
      action:
        'Write half a page to yourself a year from now. Open with your oldest find ({{relic|whatever it was}}) and what has changed since, add one ordinary detail of today, and end with one question for next-year you.',
      alternative:
        'Rather talk than write? Record a two-minute voice memo to next-year you: the old find, one ordinary detail of today, one question. Name the file with the delivery date.',
      minutes: 10,
      capture: {
        key: 'question',
        label: 'Your question for next-year you',
        placeholder: 'Did we ever fix the squeaky door?',
      },
      amplify: "Add a P.S. with today's price of something boring, like bread or a bus ride. Next year it will read like ancient history.",
      next: 'hiding-place',
    },
    {
      id: 'hiding-place',
      stage: 3,
      title: 'The Hiding Place',
      narrative:
        'Long-haul mail needs a hiding place good enough to forget and bad enough to find. You already know one: wherever you found {{relic|that oldest thing}}.',
      action:
        'Seal the letter and your three things in an envelope or jar (or fold the letter around them) and hide it in that same forgotten spot, or anywhere you only visit once a season. Then set a reminder for one year from today, titled with a riddle about where it is.',
      alternative:
        'Kept it digital? Give the album a name too dull to open, like “Receipts 3,” hide it if your phone allows, and set the one-year reminder with a riddle about that name.',
      minutes: 7,
      capture: {
        key: 'riddle',
        label: 'The riddle in your reminder',
        placeholder: 'Look where winter keeps its hands',
      },
      amplify: 'Make the riddle hard enough that next-year you has to think for a full minute. Wink while you write it. Nobody will see.',
      next: 'the-reply',
    },
  ],
  endings: [
    {
      id: 'dare-with-a-postmark',
      title: 'A Dare With a Postmark',
      twist:
        "Plot twist: this was never a time capsule. It's a dare with a postmark. Old things survive in pockets and drawers by accident, with no date and no letter (just ask {{relic|the oldest thing you dug up}}). Yours has a deadline: in thirty days, “{{reminder|A delivery for you}}” lights up your phone, and someone finds out whether you meant it.",
      closingLine: 'Sealed today. Opens in thirty days. Inside: {{dare|one small dare}}',
      traits: { boldness: 1 },
    },
    {
      id: 'the-reply',
      title: 'The Reply',
      twist:
        "Plot twist: you weren't the Bureau's first customer. Long before today, past-you sent a capsule without knowing it: {{relic|the oldest thing you dug up}}. No letter, no date, and it still got through. Today you wrote back. In a year, your riddle ({{riddle|the one in your calendar}}) will lead the only person who knows how it all turned out straight to your reply.",
      closingLine: 'Dear next-year me: {{question|did we ever fix the squeaky door?}}',
      traits: { connection: 1 },
    },
  ],
};

export default timeCapsule;
