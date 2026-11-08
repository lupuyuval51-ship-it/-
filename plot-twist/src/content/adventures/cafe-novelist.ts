import type { Adventure } from '../../../shared/types.ts';

/**
 * The Café Novelist: a one-hour solo writing date. Buy one drink, write a 100-word story set in
 * the café using only objects (never people), and take the title from whatever the café printed.
 * Branch A is a mystery (find an absence, end on the evidence); branch B is a romance (find a pair,
 * write it on a napkin). Running bit: the Editor's word-count tyranny and war on adverbs.
 */
const cafeNovelist: Adventure = {
  id: 'cafe-novelist',
  version: 1,
  source: 'curated',
  title: 'The Café Novelist',
  tagline: 'Somewhere nearby, a café is hiding a story exactly one hundred words long.',
  intro:
    'Your Editor has a deadline and a red pen. You have one hour, one drink and a café full of objects nobody has ever written about. The brief: a story set right here, in exactly 100 words, starring no people at all. The Editor has already banned adverbs. Completely.',
  kind: 'maker',
  moods: ['creative', 'curious'],
  weirdness: 2,
  minutes: 60,
  cost: { min: 12, max: 30 },
  settings: ['outside'],
  company: ['solo'],
  items: ['Pen and paper, or a notes app'],
  palette: 'noir',
  motif: 'stripes',
  traits: { creativity: 2, curiosity: 1 },
  stageLabel: 'Draft',
  narrator: 'The Editor (red pen in hand)',
  start: 'writers-table',
  nodes: [
    {
      id: 'writers-table',
      stage: 1,
      title: 'The Writer\'s Table',
      narrative:
        'Every great novelist has a café table. Yours is somewhere within walking distance, probably with one wobbly leg. The Editor wants your first notes before the drink arrives.',
      action:
        'Walk to a café, buy a drink and take a seat facing the room. Before writing a word of story, list ten details you can see, objects only, never people: a chipped saucer, a sign missing a letter.',
      alternative:
        'Rather not sit in? Take your drink to go, find a bench or a ledge with a view into the café, and list ten object details from there. The story can still be set inside.',
      minutes: 15,
      capture: {
        key: 'detail',
        label: 'The best detail on your list',
        placeholder: 'a sugar jar with one dented corner',
      },
      amplify: 'Order like a novelist on deadline: ask the barista what they would recommend for someone with a hundred words due within the hour.',
      choice: {
        prompt: 'The Editor needs a genre before your drink cools. What happens in this café?',
        options: [
          {
            id: 'mystery',
            label: 'Something Is Missing',
            description: 'A mystery. Find the gap in the room and follow it.',
            next: 'the-missing-thing',
            traits: { curiosity: 1 },
          },
          {
            id: 'romance',
            label: 'Two Objects in Love',
            description: 'A romance. Find the pair that belongs together.',
            next: 'star-crossed',
            traits: { connection: 1 },
          },
        ],
      },
    },
    {
      id: 'the-missing-thing',
      stage: 2,
      title: 'The Missing Thing',
      narrative:
        'Every mystery starts with an absence: a hook with no coat, a gap on the pastry shelf, a sign that lost a letter years ago. Something in this café is missing. The Editor suspects foul play.',
      action:
        'Find one thing that should be here but isn\'t, then draft a mystery about it with three details from your list as clues, starting with {{detail|your best detail}}. Don\'t count words yet. That\'s the Editor\'s job.',
      alternative:
        'Writing by hand isn\'t working? Dictate the draft as a quiet voice memo, like a detective\'s case notes: the same missing thing, the same three clues.',
      minutes: 25,
      capture: {
        key: 'missing',
        label: 'What is missing',
        placeholder: 'the spoon that belongs in the sugar jar',
      },
      amplify: 'Line up your suspects in your head (the radiator, the sugar jar, the suspiciously calm plant) and give each one a single-sentence alibi.',
      next: 'the-evidence',
    },
    {
      id: 'the-evidence',
      stage: 3,
      title: 'The Evidence',
      narrative:
        'Every mystery ends with a reveal, and the Editor wants yours in exactly 100 words. Not 99. Not 101. Luckily, the café has been quietly printing evidence since the moment you walked in.',
      action:
        'Cut your draft to exactly 100 words, ending on the line that reveals what became of {{missing|the missing thing}}. Then title it using only words printed on your receipt: "CHANGE DUE", "TABLE 4", "THANK YOU".',
      alternative:
        'No receipt? Take the title from any print in sight instead (your cup, a sugar packet, the menu board), then make the same cut to exactly 100 words.',
      minutes: 15,
      capture: {
        key: 'mystery-title',
        label: 'Your title, straight off the receipt',
        placeholder: 'Change Due',
      },
      amplify: 'Read the finished story under your breath like an audiobook narrator who has been paid entirely in coffee.',
      next: 'the-prime-suspect',
    },
    {
      id: 'star-crossed',
      stage: 2,
      title: 'Star-Crossed Tableware',
      narrative:
        'Every café is secretly a romance. The salt has been eyeing the pepper for years. Somewhere in this room, two objects belong together and haven\'t admitted it. The Editor claims to hate love stories. The Editor is lying.',
      action:
        'Choose two objects that belong together, or should. Draft their love story (how they met, what keeps them apart, the moment it changes) with three details from your list as scenery, {{detail|your best detail}} included.',
      alternative:
        'Dictate it instead: a whispered voice memo, like an old radio drama, starring your two objects, with three details from your list as the set.',
      minutes: 25,
      capture: {
        key: 'pair',
        label: 'Your star-crossed pair',
        placeholder: 'the sugar jar and the bent teaspoon',
      },
      amplify: 'If both objects are on your own table, nudge them one centimeter closer together, then look away to give them some privacy.',
      next: 'napkin-manuscript',
    },
    {
      id: 'napkin-manuscript',
      stage: 3,
      title: 'The Napkin Manuscript',
      narrative:
        'The great love letters were all written on things never meant for them. The Editor allows exactly 100 words, one sigh and no adverbs. Your cup, meanwhile, has been flirting with a title all along.',
      action:
        'Copy your story onto a paper napkin, cutting as you go until it is exactly 100 words. Then title it with words printed on your cup, sleeve or receipt ("CAREFUL, HOT" is a perfectly good romance).',
      alternative:
        'No napkin, or no room on it? Type the final 100 words into your phone instead, and borrow the title from any print in sight: a sugar packet, the menu board.',
      minutes: 15,
      capture: {
        key: 'romance-title',
        label: 'Your title, borrowed from the cup',
        placeholder: 'Careful, Hot',
      },
      amplify: 'Sign the napkin with a dramatic pen name and fold it like a letter you may never send. (You keep it. That is the tragedy.)',
      next: 'table-for-one',
    },
  ],
  endings: [
    {
      id: 'the-prime-suspect',
      title: 'The Prime Suspect',
      twist:
        'Plot twist: the Editor has one note, and it isn\'t about word count. This café had a real mystery today. It began the minute a stranger bought one drink, sat down and started writing down every object in the room, right down to {{detail|the last sugar packet}}. In any café mystery, that\'s the prime suspect. The mystery was you.',
      closingLine: '{{mystery-title|Change Due}}: a mystery in exactly 100 words, starring {{missing|something that wasn\'t there}}.',
      traits: { curiosity: 1, creativity: 1 },
    },
    {
      id: 'table-for-one',
      title: 'Table for One',
      twist:
        'Plot twist: you went looking for two things that belong together and missed the most obvious pair in the room: you and this table. One drink, one chair, a whole hour, {{detail|a nosy sugar packet}} as chaperone. That wasn\'t a café visit. It was a first date, and judging by the title, "{{romance-title|Careful, Hot}}", it went well.',
      closingLine: '{{romance-title|Careful, Hot}}: a love story in exactly 100 words, starring {{pair|two objects who should know better}}.',
      traits: { connection: 1, creativity: 1 },
    },
  ],
};

export default cafeNovelist;
