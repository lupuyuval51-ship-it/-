import type { Adventure } from '../../../shared/types.ts';

/**
 * The Museum of One Drawer: a 15-minute home episode for one curator (or a small crew).
 * Branch A is earnest and archival (labels, dates, provenance, a retrospective that saves the
 * mystery for last); branch B is gossip and melodrama (scandals, an inquiry, a masterpiece nobody valued).
 * Running bit: the Board's obsession with the Unidentified Object every drawer contains.
 * A's twist: real museums hold famous objects nobody can explain (Roman dodecahedra), and those get
 * glass cases, not the bin. B's twist answers the inquiry: useless things are kept for love.
 */
const museumOfOneDrawer: Adventure = {
  id: 'museum-of-one-drawer',
  version: 1,
  source: 'curated',
  title: 'The Museum of One Drawer',
  tagline: 'The smallest museum in the world is somewhere in your home. It has never had a curator.',
  intro:
    'The Board of Trustees has made its decision: you are the new Chief Curator. The museum is one drawer. The collection has never been catalogued, the press arrives in fifteen minutes, and nobody (nobody!) can explain one of the objects.',
  kind: 'maker',
  moods: ['creative', 'curious'],
  weirdness: 2,
  minutes: 15,
  cost: { min: 0, max: 0 },
  settings: ['home'],
  company: ['solo', 'group'],
  items: ['A drawer you may empty', 'Paper scraps and a pen'],
  palette: 'paper',
  motif: 'stairs',
  traits: { creativity: 2, curiosity: 1 },
  stageLabel: 'Gallery',
  narrator: 'The Board of Trustees',
  start: 'empty-the-vault',
  nodes: [
    {
      id: 'empty-the-vault',
      stage: 1,
      title: 'Empty the Vault',
      narrative:
        'Every great museum starts with a collection. Yours has spent years in the dark between a dead battery and a takeaway menu, waiting for someone to take it seriously.',
      action:
        'Empty a drawer you\'re allowed to raid onto a table (junk drawers are the national collection; sharp things stay in storage). Spread the collection out so nothing touches, then find the Unidentified Object: the one nobody can explain.',
      alternative:
        'No drawer to spare? Tip out a bag, a pencil case or a coat pocket onto a table or your lap instead. Smaller wing, same prestige, and it still holds one object nobody can explain.',
      minutes: 4,
      capture: {
        key: 'mystery',
        label: 'The object nobody can explain',
        placeholder: 'a tiny key that opens nothing we own',
      },
      amplify: 'Put on any gloves you own (oven mitts count) and handle every object as if it might crumble into dust.',
      crewTip: 'Empty one drawer together. On three, everyone points at the object they think is the Unidentified one.',
      choice: {
        prompt: 'The press arrives in ten minutes. What kind of museum is this?',
        options: [
          {
            id: 'retrospective',
            label: 'The Grand Retrospective',
            description: 'Dates. Provenance. Gravitas. Every object, a legacy.',
            next: 'provenance',
            traits: { curiosity: 1 },
          },
          {
            id: 'scandal',
            label: 'The Scandal Wing',
            description: 'Rivalries, cover-ups, leaked files. The objects talk.',
            next: 'scandal-wing',
            traits: { creativity: 1 },
          },
        ],
      },
    },
    {
      id: 'provenance',
      stage: 2,
      title: 'Provenance, Please',
      narrative:
        'A serious museum knows where every piece came from, and when. The Board would like this done properly. The Board also insists that {{mystery|the Unidentified Object}} be dated, which experts call impossible.',
      action:
        'Write museum labels for three objects, the mystery piece included: a name, a date ("c. 2019" is very museum) and where it came from ("Gift of the sofa cushions"). Prop each label against its object.',
      alternative:
        'Writing fiddly today? Record a one-minute audio guide instead: "Stop one. Bread clip, circa 2021, gift of a loaf." Cover three objects, the mystery piece included.',
      minutes: 5,
      capture: {
        key: 'label',
        label: 'Your finest museum label',
        placeholder: 'Rubber band, c. 2017. Gift of some broccoli.',
      },
      amplify: 'Read each label aloud in a reverent gallery whisper, then shush yourself for being too loud.',
      crewTip: 'Split the labels, then read someone else\'s aloud like a docent. Anyone who smiles is escorted from the building.',
      next: 'opening-night',
    },
    {
      id: 'opening-night',
      stage: 3,
      title: 'Opening Night',
      narrative:
        'The press preview went well: one reporter wept at a single label ({{label|your finest one}}). A retrospective runs oldest to newest, and the great ones save the mystery for last.',
      action:
        'Line up the labeled objects by date, oldest first, with {{mystery|the Unidentified Object}} last (date: unknown). Stroll past the whole show once, slowly, then give the exhibition a title with years in it.',
      alternative:
        'Short on space? Write the dates as a timeline down one page instead, oldest at the top and the mystery piece at the very bottom. Then give the exhibition its title.',
      minutes: 5,
      capture: {
        key: 'show-title',
        label: 'The exhibition\'s title',
        placeholder: 'Just in Case: Works from 2016 to Today',
      },
      amplify: 'Stand guard beside the show for ten seconds, hands clasped behind your back. Then tell the nearest houseplant: "No flash photography, please."',
      crewTip: 'Tour the show in a slow single-file line, hands behind your backs. The word "junk" is banned from the building.',
      next: 'purpose-unknown',
    },
    {
      id: 'scandal-wing',
      stage: 2,
      title: 'The Scandal Wing',
      narrative:
        'Every great museum has a wing the tour guides hurry past. Yours just opened. The objects have been feuding in the dark for years, and sources say {{mystery|the Unidentified Object}} is mixed up in most of it.',
      action:
        'Pair objects into three scandals: a bitter rivalry, a secret alliance and a cover-up. Set each pair facing each other (or pointedly not), then write the juiciest one as a tabloid headline.',
      alternative:
        'Leave everything where it lies: point at each pair and narrate its scandal in a gossip-show whisper. Then write the juiciest one as a headline.',
      minutes: 5,
      capture: {
        key: 'headline',
        label: 'The juiciest headline',
        placeholder: 'BATTERY INSISTS IT STILL HAS SOMETHING LEFT',
      },
      amplify: 'Read the headline out loud in your best breaking-news voice. Gasp at your own reporting.',
      crewTip: 'Everyone invents one scandal in secret. Reveal them together and vote on which one makes the front page.',
      next: 'the-inquiry',
    },
    {
      id: 'the-inquiry',
      stage: 3,
      title: 'The Inquiry',
      narrative:
        'After {{headline|the scandal}} hit the front page, the Board opened an inquiry. Every scandal leads to the one question no curator dares ask out loud: why is some of this stuff even here?',
      action:
        'Find the least valuable object in the collection: the one that would lose a vote to the bin. Put it on a pedestal (an upturned mug), light it with your phone flashlight and ask it: why are you still here?',
      alternative:
        'No mug or flashlight? Hold the least valuable object up to a window or lamp and study it for a slow count of ten, like a baffled appraiser. Then ask it, quietly: why are you still here?',
      minutes: 5,
      capture: {
        key: 'humble',
        label: 'The least valuable object',
        placeholder: 'half a birthday candle',
      },
      amplify: 'Give a 15-second press conference as its lawyer: "My client did nothing. My client cannot do anything. My client is an object."',
      crewTip: 'Put it on trial: one prosecutor, one defense lawyer, everyone else the jury. Verdict in 60 seconds.',
      next: 'the-priceless-nothing',
    },
  ],
  endings: [
    {
      id: 'purpose-unknown',
      title: 'Purpose Unknown',
      twist:
        'Plot twist: real museums have your problem. Across Europe, they hold more than a hundred Roman dodecahedra: hollow bronze objects, about 1,700 years old, purpose completely unknown. Experts are still arguing. In a museum, a thing nobody can explain never goes in the bin. It gets a glass case. As of today, so does {{mystery|the Unidentified Object}}.',
      closingLine: '{{show-title|Just in Case: Works from 2016 to Today}}. Star exhibit: one object, purpose unknown.',
      traits: { curiosity: 1, creativity: 1 },
    },
    {
      id: 'the-priceless-nothing',
      title: 'The Priceless Nothing',
      twist:
        'Plot twist: the inquiry has its answer, and it is the biggest scandal of all. Nobody has ever thrown out {{humble|the least valuable object in the house}}. Useful things are kept for a reason. Useless things are kept for love. That makes it the one true masterpiece in the collection. (The Unidentified Object is furious.)',
      closingLine: 'Now on view: {{humble|the least valuable object in the house}}. Priceless. Please do not touch.',
      traits: { connection: 1, creativity: 1 },
    },
  ],
};

export default museumOfOneDrawer;
