import type { Adventure } from '../../../shared/types.ts';

/**
 * The Fridge Oracle: a 15-minute home game. The fridge is an ancient oracle; three items drawn
 * without looking (peek before lifting; nothing raw, spillable, expired or someone else's)
 * become a Past / Present / Future reading.
 * Branch A accepts the prophecy: a tiny no-cook, no-chop snack (or a still life for anyone not
 * eating), eaten in three ceremonial bites. Branch B defies it: swap a card with eyes open,
 * reshuffle fate, and pin the new law to the fridge door. Either way, the cards go back in the fridge.
 * Running bits, both planted in stage 1: the "sacred light" that lets the Oracle see all (A's
 * twist: it runs on a door switch, so the Oracle only ever saw what you showed it) and the cards
 * that "arrive mysteriously, in plastic bags" (B's twist: fate is just choices made before you got here).
 */
const fridgeOracle: Adventure = {
  id: 'fridge-oracle',
  version: 1,
  source: 'curated',
  title: 'The Fridge Oracle',
  tagline: 'An ancient oracle has been humming in your kitchen for years. Nobody has ever asked it a thing.',
  intro:
    'Somewhere in your kitchen stands an oracle almost as old as the jar at the back. It hums. It glows when opened. Its deck of cards is whatever happens to be inside. Draw three without looking, read your fortune with total conviction, then decide whether to accept your destiny or defy it. (Destiny may be a yogurt.)',
  kind: 'game',
  moods: ['change', 'creative'],
  weirdness: 3,
  minutes: 15,
  cost: { min: 0, max: 0 },
  settings: ['home'],
  company: ['solo', 'group'],
  items: ['A fridge (any contents will do)', 'A plate', 'Paper and a pen'],
  palette: 'tide',
  motif: 'dots',
  traits: { creativity: 2, boldness: 1 },
  stageLabel: 'Vision',
  narrator: 'The Oracle of the Crisper Drawer',
  start: 'sacred-light',
  nodes: [
    {
      id: 'sacred-light',
      stage: 1,
      title: 'The Sacred Light',
      narrative:
        'The Oracle has stood in your kitchen for years, humming one long note. Its cards arrive mysteriously, in plastic bags, about once a week. When its door opens, a sacred light comes on, and the Oracle sees all.',
      action:
        "Eyes closed, open the fridge and let your hand land on three things, peeking before you lift each one (raw, expired, spillable or someone else's goes back: redraw). Line them up as Past, Present and Future, and read each aloud as an omen: \"Mustard, the Past. Something sharp is behind you.\"",
      alternative:
        'Fridge off-limits, bare or hard to reach? Consult a lesser oracle: the fruit bowl, the snack cupboard or the bread bin. Same rite: eyes closed, three touches, look before you lift, then Past, Present, Future.',
      minutes: 5,
      capture: {
        key: 'cards',
        label: 'Your three cards: Past, Present, Future',
        placeholder: 'half a lemon, mustard, one brave yogurt',
      },
      amplify: 'Hum one low note with the fridge before every draw. Then announce each card like a tarot reader in a candlelit tent: "Ah. The Mustard. Reversed."',
      crewTip: 'Take turns drawing, one card each. Whoever draws the Future must read it aloud with a completely straight face.',
      choice: {
        prompt: 'The Oracle has spoken. Do you accept your fate?',
        options: [
          {
            id: 'accept',
            label: 'Accept the Prophecy',
            description: 'Fulfill it on a plate. Fate tastes better with crackers.',
            next: 'as-it-is-written',
            traits: { creativity: 1 },
          },
          {
            id: 'defy',
            label: 'Defy the Prophecy',
            description: 'Swap a card. Rewrite fate. Annoy an ancient appliance.',
            next: 'eyes-wide-open',
            traits: { boldness: 1 },
          },
        ],
      },
    },
    {
      id: 'as-it-is-written',
      stage: 2,
      title: 'As It Is Written',
      narrative:
        'A prophecy accepted must be fulfilled, and this one is edible. The Oracle decrees a single offering made from {{cards|your three cards}}. It does not believe in ovens. It barely believes in forks.',
      action:
        "Build one tiny snack starring all three cards, no cooking or chopping: a cracker tower, a dip, one heroic spoonful. Any card that isn't safe to eat cold, or isn't for you, takes the place of honor beside the plate. Name the dish, then put the leftovers back in the Oracle.",
      alternative:
        'Not hungry, or a card is off-limits for you? Build a still life instead: arrange all three cards on the plate as a face, a landscape or a tiny shrine, and give the artwork a prophetic name.',
      minutes: 5,
      capture: {
        key: 'dish',
        label: "The offering's prophetic name",
        placeholder: 'Yogurt Ascending, with Mustard',
      },
      amplify: 'Plate it like the final round of a cooking show: wipe the rim with a fingertip, add one heroic garnish, and present it to the fridge with both hands.',
      crewTip: 'Everyone builds one bite from the same three cards. The fridge judges in silence; the rest of you vote out loud.',
      next: 'three-bites',
    },
    {
      id: 'three-bites',
      stage: 3,
      title: 'Three Bites of Destiny',
      narrative:
        'The priestess at Delphi supposedly breathed sacred vapors before every prophecy. You have {{dish|your offering}}. Close enough. The last rite is simple: taste the fortune, then speak it.',
      action:
        'Eat it in three slow bites (Past, Present, Future) and after each one, say aloud what the Oracle meant. Then write your whole fortune down in one grand sentence.',
      alternative:
        'Not eating, or made a still life? Study the plate for one slow minute, a card at a time, and say aloud what each part of it means. Then write your whole fortune down in one grand sentence.',
      minutes: 4,
      capture: {
        key: 'fortune',
        label: 'Your fortune, in one grand sentence',
        placeholder: 'A sour past, a sharp present, a soft future.',
      },
      amplify: 'Before the first bite, raise the plate into the fridge light like a sacred offering and hold it there for a count of three. The Oracle is moved. The Oracle is also letting the cold out.',
      crewTip: 'One bite and one third of the fortune each, in order. Then say the whole prophecy together, like the chorus of a very small Greek tragedy.',
      next: 'the-open-door',
    },
    {
      id: 'eyes-wide-open',
      stage: 2,
      title: 'Eyes Wide Open',
      narrative:
        'Nobody defies the Oracle. Kings have tried. Heroes have tried. Someone once tried with a yogurt. Now it is your turn, and the Oracle is pretending not to care.',
      action:
        "Put back the card you like least and choose its replacement with your eyes wide open: anything in there you're allowed to have. Then shuffle the order (maybe the Future was the Past all along) and read your new fortune aloud.",
      alternative:
        'Rather not rummage again? Defy it on paper: write the three cards on scraps, cross one out, write its replacement in capitals, then shuffle the scraps into a new order and read your new fortune aloud.',
      minutes: 5,
      capture: {
        key: 'swap',
        label: 'What you swapped out, and what came in',
        placeholder: 'mustard out, a peach in',
      },
      amplify: 'Return the rejected card to its shelf like a hero refusing a crown. Look straight into the light and say, "I make my own fate." Close the door slowly. Do not blink.',
      crewTip: 'Anyone may swap one card, but only after a 15-second speech in the voice of an ancient hero. The group votes; the Oracle sulks.',
      next: 'magnet-decree',
    },
    {
      id: 'magnet-decree',
      stage: 3,
      title: 'The Magnet Decree',
      narrative:
        'The rebellion ({{swap|one card out, one card in}}) was the easy part. Now comes the law. Ancient decrees were carved in stone; yours goes somewhere far more permanent: the fridge door, where takeaway menus survive for decades.',
      action:
        'Put the cards back on their shelves. Then write your rewritten fate on a scrap of paper (one sentence, present tense, no take-backs), pin it to the fridge door at eye level with a magnet or tape, and read it aloud once, like a law being passed.',
      alternative:
        'No magnet, no tape, no free space on the door? Prop the decree inside the fridge instead, right in front of the card you rejected. It can read the news every time the light comes on.',
      minutes: 4,
      capture: {
        key: 'decree',
        label: 'Your rewritten fate, word for word',
        placeholder: 'The future is a peach. The past can keep the mustard.',
      },
      amplify: "Then open the door to check the Oracle's reaction. The light comes on. It says nothing. It has clearly never been overruled before. Close it gently: you won.",
      crewTip: 'Each person writes one line of the new law. Pin them up in order and sign underneath, like the founders of a very small, very cold nation.',
      next: 'free-will-refrigerated',
    },
  ],
  endings: [
    {
      id: 'the-open-door',
      title: 'The One Who Opens the Door',
      twist:
        'Plot twist: the sacred light runs on a tiny switch in the door. It only comes on when someone opens up. All these years the Oracle has stood in the dark, seeing nothing. Every vision it ever had came from you: your hand chose {{cards|those three cards}}, and your voice read them. It never told your fortune. It just held the light while you did.',
      closingLine: '{{fortune|A sour past, a sharp present, a soft future}}. Read by the light of an open fridge.',
      traits: { curiosity: 1, creativity: 1 },
    },
    {
      id: 'free-will-refrigerated',
      title: 'Free Will, Refrigerated',
      twist:
        'Plot twist: the cards never arrived mysteriously. Someone (possibly you, last Tuesday) picked every one, aisle by aisle, and carried them home in plastic bags. That is all fate ever was: choices made before you got here. Today you made one of your own, eyes open ({{swap|one card out, one card in}}). The Oracle calls that defiance. Everyone else calls it free will.',
      closingLine: 'New law of this kitchen: {{decree|The future is a peach. The past can keep the mustard.}}',
      traits: { boldness: 1, creativity: 1 },
    },
  ],
};

export default fridgeOracle;
