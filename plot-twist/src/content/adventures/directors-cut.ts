import type { Adventure } from '../../../shared/types.ts';

/**
 * The Director's Cut: a two-hour solo afternoon directed in three acts. Act I is one ticket to
 * something never done alone (a museum, a botanical garden, a planetarium show, a boat or cable car
 * ride; a free alternative exists). Acts II and III depend on the cut. A cinema matinee and a
 * scenic train were left out on purpose: neither fits honestly inside two hours with three acts.
 * Branch A, the Art House Cut: a ten-minute long take in a café, then a three-minute final shot.
 * Branch B, the Blockbuster Cut: a three-mission dessert heist, then a race to a view before the
 * light goes (photo montage of places and objects only, freeze-frame, title).
 * Narrator and running bit: the Script Supervisor, who logs continuity notes in every act. A's twist
 * flags a "continuity error" (the lead who walks out is not the one who walked in: an arc);
 * B's twist finds every name in the credits is the same.
 * Budget: ticket ₪30–55, coffee or dessert ₪15–30, an optional bus ride.
 */
const directorsCut: Adventure = {
  id: 'directors-cut',
  version: 1,
  source: 'curated',
  title: "The Director's Cut",
  tagline: "This afternoon is shooting in three acts. The director's chair has your name on it.",
  intro:
    "Today you direct a feature film in three acts: one ticket to somewhere new, one scene with something sweet, one final shot in the best light of the day. I'm your Script Supervisor, and I log every detail, because continuity matters. Best started about two hours before sunset. Budget: ₪40–100, mostly the ticket.",
  kind: 'wanderer',
  moods: ['change', 'creative'],
  weirdness: 3,
  minutes: 120,
  cost: { min: 40, max: 100 },
  settings: ['outside'],
  company: ['solo'],
  items: ['₪40–100 (ticket, coffee, a bus)', 'A charged phone', 'Notebook or a notes app', 'Water bottle'],
  palette: 'dusk',
  motif: 'rays',
  traits: { boldness: 2, creativity: 2 },
  stageLabel: 'Act',
  narrator: 'The Script Supervisor',
  start: 'one-ticket',
  nodes: [
    {
      id: 'one-ticket',
      stage: 1,
      title: 'One Ticket, Please',
      narrative:
        'Every great film opens on someone walking in alone. Continuity note: it is the afternoon, you are alone, and you are about to do something for the first time. I have written all of that down.',
      action:
        "Pick something you've never done solo, within 15 minutes of you: a museum, a botanical garden, a planetarium show, a boat or cable car ride. Buy one ticket (₪30–55), spend about 40 minutes inside like a director scouting locations, and choose the frame your film opens on.",
      alternative:
        'Ticket out of reach today? Pick something free you have never done alone (a free gallery, a public garden, a lookout, the top floor of a big library) and scout it the same way. The savings go to dessert.',
      minutes: 55,
      capture: {
        key: 'opening',
        label: 'Your opening frame',
        placeholder: 'a staircase of ferns under a glass roof',
      },
      amplify: 'At the entrance, pause for one beat, as if the camera just cut to your face. Then walk in at exactly the speed of the soundtrack in your head.',
      choice: {
        prompt: 'Act I is in the can. How do you cut the rest of this film?',
        options: [
          {
            id: 'art-house',
            label: 'The Art House Cut',
            description: 'Long takes, real time, beauty you have to sit still for.',
            next: 'long-take',
            traits: { curiosity: 1 },
          },
          {
            id: 'blockbuster',
            label: 'The Blockbuster Cut',
            description: 'Fast cuts, tiny missions, a race against the sun.',
            next: 'dessert-heist',
            traits: { boldness: 1 },
          },
        ],
      },
    },
    {
      id: 'long-take',
      stage: 2,
      title: 'The Long Take',
      narrative:
        'Art house directors love a scene where nothing happens for a very long time, and everything changes. INT. CAFÉ. DAY. One table, one cup. Continuity note: keep the cup in the same hand.',
      action:
        'Find a café near the venue, order a coffee or a dessert (₪15–30) and take a seat with a view. Set a timer for ten minutes, turn your phone face down, and watch one frame as if the camera cannot cut: a window, the street, the steam.',
      alternative:
        'Rather not sit in? Take it to go and hold your long take from a bench with a view instead: the same ten minutes, phone face down, one frame.',
      minutes: 30,
      capture: {
        key: 'long-take',
        label: 'What happened in your long take',
        placeholder: 'the light crossed the table and nobody noticed',
      },
      amplify: 'Order in a film-festival whisper, as if the café is premiering your work. Stir exactly three times, then hold the spoon one beat too long. Very Cannes.',
      next: 'final-shot',
    },
    {
      id: 'final-shot',
      stage: 3,
      title: 'The Final Shot',
      narrative:
        'Art house films end on a shot that lasts too long, which is the point. Continuity note: you opened on {{opening|your opening frame}}. Now you need the frame you close on, in whatever light the day has left.',
      action:
        "Walk to the best view within fifteen minutes (a lookout, a promenade, a park with a horizon) and hold your final shot for three silent minutes. Then write your film's last line. Check your way home before the light goes.",
      alternative:
        "Done walking, or no view nearby? Choose a window, a long street or a patch of sky from where you are and hold it for three silent minutes. Then write your film's last line.",
      minutes: 30,
      capture: {
        key: 'last-line',
        label: 'The last line of your film',
        placeholder: 'The light went gold, and for once, nobody hurried.',
      },
      amplify: "When the three minutes are up, don't move. Hold it ten seconds more, the way only art house directors dare, then give the horizon one slow nod. That's a wrap.",
      next: 'continuity-error',
    },
    {
      id: 'dessert-heist',
      stage: 2,
      title: 'The Dessert Heist',
      narrative:
        "Blockbusters don't sit still. They have missions. INT. CAFÉ. DAY. Our hero has twenty minutes, one target and no backup. Continuity note: the target is on the dessert menu.",
      action:
        'Pull off the heist in three tiny missions: order the most dramatic-sounding dessert or drink on the menu (₪15–30), secure the best seat in the house, and extract one secret about the place (when it opened, what regulars order) from a sign, the menu or the barista.',
      alternative:
        'Rather not go in? Run the heist from the street: buy something sweet to go from a bakery or kiosk, claim the best bench on the block, and extract the secret from the street itself: a date above a door, a name on a sign.',
      minutes: 30,
      capture: {
        key: 'loot',
        label: 'The loot you acquired',
        placeholder: "a pistachio thing called 'The Volcano'",
      },
      amplify: 'Count down each mission on your fingers like a heist crew: three, two, one. After the last one, sit down slowly, as if a vault just closed behind you.',
      next: 'race-the-sun',
    },
    {
      id: 'race-the-sun',
      stage: 3,
      title: 'Race the Sun',
      narrative:
        'Every blockbuster ends in a race against the clock. Yours is the sun, and it is not slowing down for anyone. Stunt rule one: know your way home before the light goes. I am holding a stopwatch, and I am sweating.',
      action:
        'You have 15 minutes to reach the best view in walking distance: busy streets, brisk steps, no running across anything. On arrival, shoot a five-photo montage (the view and its details, no people), end on a five-second freeze-frame pose and title your film.',
      alternative:
        'Short on time or legs? Stage the climax right where you are: a five-photo montage of everything in view (no people), then a freeze-frame from your seat, chin up, while the credits roll in your head. Title the film.',
      minutes: 30,
      capture: {
        key: 'title',
        label: "Your blockbuster's title",
        placeholder: 'DESSERT HEIST II: THE LAST CRUMB',
      },
      amplify: 'Freeze mid-step for the final frame, like every eighties movie ever. Hold it for a count of five, or until it gets slightly embarrassing, whichever comes later.',
      next: 'crew-of-one',
    },
  ],
  endings: [
    {
      id: 'continuity-error',
      title: 'Continuity Error',
      twist:
        "Plot twist: I've flagged a continuity error. In Act I, someone walked in alone and found {{opening|their opening frame}}. In the final shot, someone else is in their place: same face, same clothes, but this one isn't in a hurry. The footage shows the switch during the long take ({{long-take|ten quiet minutes}}). In art house cinema that isn't an error. It's an arc.",
      closingLine: '{{last-line|The light went gold, and for once, nobody hurried.}} FADE OUT.',
      traits: { curiosity: 1, connection: 1 },
    },
    {
      id: 'crew-of-one',
      title: 'A Crew of One',
      twist:
        "Plot twist: the credits are rolling, and I've found a problem. Every name is the same. Director. Location scout ({{opening|that opening frame}}: what a find). Catering ({{loot|the loot}}: a triumph). Stunt double. And the audience: one, best seat in the house. Blockbusters need five hundred people to make one person feel something. You skipped the middlemen.",
      closingLine: '{{title|DESSERT HEIST II: THE LAST CRUMB}}. Written, directed and watched by one person.',
      traits: { boldness: 1, creativity: 1 },
    },
  ],
};

export default directorsCut;
