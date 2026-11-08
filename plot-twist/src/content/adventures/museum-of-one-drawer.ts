import type { Adventure } from '../../../shared/types.ts';

/**
 * The Museum of One Drawer: a 15-minute home episode for one curator (or a small crew).
 * Branch A is earnest and archival (labels, dates, a retrospective that turns into a life story);
 * branch B is gossip and melodrama (scandals, an inquiry, a masterpiece nobody valued).
 * Running bit: the Board's obsession with the Unidentified Object every drawer contains.
 */
const museumOfOneDrawer: Adventure = {
  id: 'museum-of-one-drawer',
  version: 1,
  source: 'curated',
  title: 'The Museum of One Drawer',
  tagline: 'The smallest museum in the world is somewhere in your home. It has never had a curator.',
  intro:
    'Congratulations: the Board of Trustees has appointed you Chief Curator. The museum is one drawer. The collection has never been catalogued, the press arrives in fifteen minutes, and nobody (nobody!) can explain one of the objects.',
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
        'Pick a drawer you\'re allowed to empty (junk drawers are the national collection; sharp things stay in storage) and lay every object out in one neat row. Then find the Unidentified Object: the one nobody can explain.',
      alternative:
        'No drawer to spare? Tip out a bag, a coat pocket or your wallet onto a table or your lap instead. Smaller wing, same prestige, and it still holds one object nobody can explain.',
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
        'Writing fiddly today? Record a one-minute audio guide instead: "Stop one. Rubber band, circa 2017, gift of some broccoli." Cover three objects, the mystery piece included.',
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
        'Critics who have read "{{label|c. 2019}}" are already calling the show devastating. A retrospective runs oldest to newest, and the best ones end on a mystery.',
      action:
        'Line up the labeled objects by date, oldest first, with {{mystery|the Unidentified Object}} last. Stroll past the whole show once, slowly, then give the exhibition a title with years in it.',
      alternative:
        'Short on space? Line up just the labels in date order, or write the dates as a timeline down one page. Then give the exhibition its title.',
      minutes: 5,
      capture: {
        key: 'show-title',
        label: 'The exhibition\'s title',
        placeholder: 'Just in Case: Works from 2016 to Today',
      },
      amplify: 'Open the show by snapping a ribbon (a rubber band will do) and thank the donors in a 20-second speech. They are mostly the sofa.',
      crewTip: 'Everyone adds one sentence to the opening speech. The word "junk" is banned from the building.',
      next: 'the-artist-is-present',
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
        'After {{headline|the battery scandal}} hit the front page, the Board opened an inquiry. Every scandal leads to the one question no curator dares ask out loud: why is some of this stuff even here?',
      action:
        'Find the least valuable object in the collection: the one that would lose a vote to the bin. Put it on a pedestal (an upturned mug), light it with your phone flashlight and ask it: why are you still here?',
      alternative:
        'No mug or flashlight to hand? Hold the object up to a window or lamp and study it for a slow count of ten, like an appraiser who can\'t believe their eyes.',
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
      id: 'the-artist-is-present',
      title: 'The Artist Is Present',
      twist:
        'Plot twist: read the dates in order and they stop being dates. That move. That trip. The long "just in case" era. A retrospective is never really about the objects; it is about the artist who kept them. Even {{mystery|the Unidentified Object}} turns out to be a self-portrait.',
      closingLine: '{{show-title|Just in Case: Works from 2016 to Today}}. The artist is present.',
      traits: { connection: 2 },
    },
    {
      id: 'the-priceless-nothing',
      title: 'The Priceless Nothing',
      twist:
        'Plot twist: the real scandal was in plain sight all along. Nobody, in all these years, has thrown out {{humble|the least valuable object in the house}}. Useful things get kept for a reason. Useless things get kept for love. That makes it the one true masterpiece in the building. (The Unidentified Object is furious.)',
      closingLine: 'Now on view: {{humble|the least valuable object in the house}}. Priceless. Please do not touch.',
      traits: { connection: 1, creativity: 1 },
    },
  ],
};

export default museumOfOneDrawer;
