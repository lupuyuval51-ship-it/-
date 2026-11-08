import type { Adventure } from '../../../shared/types.ts';

/**
 * The Kindness Conspiracy: a 30-minute outdoor spy caper made of tiny anonymous kindnesses.
 * Branch A leaves evidence (a secret symbol, a tear-off notice, a first recruit);
 * branch B leaves no trace (a stealth round of invisible deeds, then a thank-you "drop").
 * Every interaction has a no-interaction alternative. Running bit: the Society's numbered rules,
 * starting with "Rule 1: we do not exist". A's twist takes it literally (there is no Society; you
 * founded it). B's twist turns it around (the Society is everywhere: its senior agents are the
 * invisible people who keep the city running, and you just blew one's cover).
 */
const kindnessConspiracy: Adventure = {
  id: 'kindness-conspiracy',
  version: 1,
  source: 'curated',
  title: 'The Kindness Conspiracy',
  tagline: 'You have been selected by an organization that officially does not exist.',
  intro:
    'Congratulations, agent. You have been recruited by a secret society that commits tiny anonymous kindnesses and never, ever gets caught. No capes. No credit. No speeches. You have thirty minutes to prove you have what it takes. Headquarters is watching. (Headquarters does not exist.)',
  kind: 'social',
  moods: ['social', 'change'],
  weirdness: 2,
  minutes: 30,
  cost: { min: 0, max: 0 },
  settings: ['outside'],
  company: ['solo', 'group'],
  items: ['Paper and a pen', 'Tape (optional)'],
  palette: 'rose',
  motif: 'arches',
  traits: { connection: 2, boldness: 1 },
  stageLabel: 'Mission',
  narrator: 'The Society That Does Not Exist',
  start: 'recruitment-test',
  nodes: [
    {
      id: 'recruitment-test',
      stage: 1,
      title: 'The Recruitment Test',
      narrative:
        'Rule 1: we do not exist. Rule 2: every deed must be small enough to deny. Your test begins the moment you step outside, and you will never know who is grading it.',
      action:
        'Walk for five minutes and spot three small things that need doing: a wrapper that missed the bin, a shopping cart adrift, a bike knocked over in a rack. Do the easiest one, then choose your codename.',
      alternative:
        'Staying put? From a bench, doorway or window, spot three small things that need doing and do whichever is within reach, even if it is just holding the door for the next person. Then choose a codename.',
      minutes: 8,
      capture: {
        key: 'codename',
        label: 'Your agent codename',
        placeholder: 'Agent Velvet Doorstop',
      },
      amplify: 'Do it like a spy: casual approach, quick hands, a nonchalant glance at the sky. Walk away. Never look back. (Fine, one look.)',
      crewTip: 'Spread out for the test, staying within sight of each other, and regroup in five minutes. Report in whispers, codenames only.',
      choice: {
        prompt: 'Headquarters has one question about your style, {{codename|Agent}}: do you sign your work?',
        options: [
          {
            id: 'sign',
            label: 'Leave a Calling Card',
            description: 'A secret symbol on every deed. Let the city wonder.',
            next: 'calling-card',
            traits: { creativity: 1 },
          },
          {
            id: 'ghost',
            label: 'Leave No Trace',
            description: 'Invisible deeds. No witnesses. No credit. Ever.',
            next: 'ghost-protocol',
            traits: { curiosity: 1 },
          },
        ],
      },
    },
    {
      id: 'calling-card',
      stage: 2,
      title: 'The Calling Card',
      narrative:
        'Rule 3: a calling card isn\'t bragging if nobody knows whose it is. Every great secret society has a symbol. Ours doesn\'t yet, which is frankly embarrassing for everyone.',
      action:
        'Design the Society\'s symbol (five seconds to draw, max). Put it on a "Take what you need" notice with six tear-off tabs ("courage", "a deep breath") and post it where notices are welcome: a library, café or supermarket board.',
      alternative:
        'No noticeboard nearby, or not walking far? Build the symbol from fallen leaves or pebbles beside a bench or under a tree, a small surprise for whoever passes next. The most deniable calling card there is: the wind does the cleanup.',
      minutes: 12,
      capture: {
        key: 'tab',
        label: 'What your calling card offers',
        placeholder: 'courage (in case of Mondays)',
      },
      amplify: 'Tear off the first tab yourself before you leave, so the next person knows it is allowed. Pocket it. That one is yours.',
      crewTip: 'Everyone sketches a symbol in ten seconds, then vote on the official one. Each agent writes one tab.',
      next: 'first-recruit',
    },
    {
      id: 'first-recruit',
      stage: 3,
      title: 'The First Recruit',
      narrative:
        'Rule 4: every secret society needs a second member. Headquarters has been strangely vague about who the first one is.',
      action:
        'Recruit an agent: text someone you trust a drawing of the symbol and a one-line first mission ("Hold one door today. Tell no one."). Sign it with the symbol and nothing else.',
      alternative:
        'No one to text, or rather not? Recruit a sleeper agent: your future self. Set a phone reminder for a week from today with the symbol and a one-line mission.',
      minutes: 6,
      capture: {
        key: 'mission',
        label: 'The first mission you issued',
        placeholder: 'Hold one door today. Tell no one.',
      },
      amplify: 'Send it with zero context. When they reply "???", answer only with the symbol. Explain tomorrow. Maybe.',
      crewTip: 'Each agent recruits one person. Compare missions; the most irresistible one becomes the Society\'s first official order.',
      next: 'membership-open',
    },
    {
      id: 'ghost-protocol',
      stage: 2,
      title: 'Ghost Protocol',
      narrative:
        'Rule 3: if anyone sees it, it doesn\'t count. The finest agents leave nothing behind but a slightly better street. You are now operating in total secrecy, which mostly means looking casual.',
      action:
        'Do three invisible deeds in ten minutes, each one while nobody\'s watching. Ideas: brush the leaves off a bench seat, hang a dropped glove at eye level on a railing, move a fallen branch off the path, stand a toppled café sign back up.',
      alternative:
        'Seated or staying put? Go invisible by phone: report a broken streetlight or pothole to your city\'s hotline or app, then add or fix one detail about a nearby place on your maps app (opening hours, a step-free entrance).',
      minutes: 12,
      capture: {
        key: 'deed',
        label: 'Your most invisible deed',
        placeholder: 'one lost glove, rescued and hung on a railing',
      },
      amplify: 'Between deeds, hum a spy theme very quietly. Stop abruptly whenever anyone passes. Resume when the coast is clear.',
      crewTip: 'Agents work separately but within sight of each other. Regroup in ten minutes and try to guess each other\'s deeds. No confirming, no denying.',
      next: 'thank-you-drop',
    },
    {
      id: 'thank-you-drop',
      stage: 3,
      title: 'The Thank-You Drop',
      narrative:
        'Rule 4: get in, say it, get out. The most invisible people in any city are the ones keeping it running, and almost nobody thanks them for anything specific.',
      action:
        'Thank one person working nearby (a cashier, a librarian, a street cleaner) for one specific thing: "The steps are spotless. Thank you." Then leave before they can thank you back.',
      alternative:
        'Prefer no interaction? Make the drop in writing: send a specific thank-you about a worker or service you appreciate through a shop\'s review page or your city\'s feedback form.',
      minutes: 8,
      capture: {
        key: 'report',
        label: 'Your one-line mission report',
        placeholder: 'Three deeds. One thank-you. Zero witnesses.',
      },
      amplify: 'Make your getaway at a perfectly normal walking speed. Turn one corner. Only then allow yourself the tiniest fist pump.',
      crewTip: 'One agent delivers the thank-you while the others browse nearby, pretending they have never met.',
      next: 'deep-cover',
    },
  ],
  endings: [
    {
      id: 'membership-open',
      title: 'Membership: Open',
      twist:
        'Plot twist: when we said we do not exist, we meant it. No headquarters, no handler, no file with your name on it. There was no Society until someone drew a symbol, offered strangers {{tab|courage}} and sent out a first order ("{{mission|Hold one door today}}") without asking permission. You weren\'t recruited. You founded it.',
      closingLine: 'The Kindness Conspiracy. Founded today by {{codename|an agent with no name}}. Membership: open.',
      traits: { boldness: 1, connection: 1 },
    },
    {
      id: 'deep-cover',
      title: 'Deep Cover',
      twist:
        'Plot twist: the person you thanked is one of ours. A senior agent, and you just blew their cover. The Society\'s best people are the ones nobody sees, keeping the city running without a word of credit. Your best work today ({{deed|one invisible deed}}) was a fine start. They have done ten thousand. We said we do not exist. We never said how many of us there aren\'t.',
      closingLine: '{{report|Three deeds. One thank-you. Zero witnesses.}} — {{codename|Agent Unknown}}',
      traits: { connection: 1, curiosity: 1 },
    },
  ],
};

export default kindnessConspiracy;
