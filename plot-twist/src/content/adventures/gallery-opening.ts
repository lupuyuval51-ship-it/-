import type { Adventure } from '../../../shared/types.ts';

/**
 * The Last-Minute Gallery Opening: a one-hour maker episode at home, solo or with a crew
 * (one wall per artist). Stage 1 raids the house for supplies and makes an "early work" in ten minutes.
 * Branch A is the Abstract Period (a tape-and-packaging piece plus a shadow piece; the opening is a
 * dimmed, lamp-lit walk-through with art-speak wall text). Branch B is the Portrait Period (faces built
 * from objects: one of someone or something you live with, one of yourself; the opening is an
 * unveiling for the sitters: a plant, a pet, a housemate or a mirror). Running bit: the Gallerist's
 * dread of the Critic, who hates everything, RSVP'd, and was never seen arriving. Both twists reveal
 * the Critic is the user's own inner critic, so the review they wrote is the real one (and the closing line).
 */
const galleryOpening: Adventure = {
  id: 'gallery-opening',
  version: 1,
  source: 'curated',
  title: 'The Last-Minute Gallery Opening',
  tagline: 'The invitations went out this morning. The art does not exist yet.',
  intro:
    "Darling, it's your Gallerist. Your first solo show opens in one hour, the invitations are out, the Critic has RSVP'd, and the walls are completely bare. Don't panic. (I'm panicking.) As of this second, everything in your home is an art supply, and you are an artist on a deadline.",
  kind: 'maker',
  moods: ['creative'],
  weirdness: 2,
  minutes: 60,
  cost: { min: 0, max: 0 },
  settings: ['home'],
  company: ['solo', 'group'],
  items: ['Paper and tape (or string)', 'Packaging from the recycling', 'A lamp or phone flashlight'],
  palette: 'neon',
  motif: 'shards',
  traits: { creativity: 2, boldness: 1 },
  stageLabel: 'Room',
  narrator: 'The Gallerist (panicking)',
  start: 'early-work',
  nodes: [
    {
      id: 'early-work',
      stage: 1,
      title: 'Early Work',
      narrative:
        'Every great artist has an early period: rushed, raw, made from whatever was lying around. Yours starts now and lasts fifteen minutes. The Critic hates early work (the Critic hates everything).',
      action:
        'Raid your home for supplies (paper, tape, boxes, foil, string, bottle caps) and pile them on one table. Then make your first work in ten minutes flat, using only the pile: tear, fold, stack, tape.',
      alternative:
        "Staying put, or short on supplies? Use only what's within arm's reach (a receipt, a sticky note, a phone case, a cushion) and make the first work right where you're sitting.",
      minutes: 15,
      capture: {
        key: 'early',
        label: "Your early work's title",
        placeholder: 'Study for a Larger Panic',
      },
      amplify: 'Sign it in the corner with a one-word artist name, large and slightly illegible, like every great signature.',
      crewTip: 'Each artist raids a different room, then dumps the loot into one shared pile. Claim your walls now: one per artist, no swapping once doors open.',
      choice: {
        prompt: 'The Gallerist needs the press release. Which period are you in?',
        options: [
          {
            id: 'abstract',
            label: 'The Abstract Period',
            description: 'Shapes, shadows, tape. Nothing is anything. Everything is profound.',
            next: 'abstract-period',
            traits: { creativity: 1 },
          },
          {
            id: 'portrait',
            label: 'The Portrait Period',
            description: 'Faces made from household objects. Sitters: anyone who holds still.',
            next: 'portrait-period',
            traits: { connection: 1 },
          },
        ],
      },
    },
    {
      id: 'abstract-period',
      stage: 2,
      title: 'The Abstract Period',
      narrative:
        "In the Abstract Period, nothing is anything, and that's the point: a strip of tape can be grief, or Tuesday, or both. Word is the Critic once called a sunset “derivative.”",
      action:
        'Make two abstract works, nothing recognizable allowed: one from tape, paper or packaging, and one made of shadow (a lamp or phone flashlight, three objects, and the shape they throw on a wall). Leave the shadow piece set up.',
      alternative:
        'Low on materials or energy? Make both works from one sheet of paper: tear it into shapes, arrange them on a dark surface and photograph the result, then rearrange the pieces for the second.',
      minutes: 24,
      capture: {
        key: 'abstract',
        label: 'The title of your boldest abstract',
        placeholder: 'Untitled No. 4 (Lamp, Despairing)',
      },
      amplify: "Hang one work upside down on purpose. If anyone asks, that's the point. If nobody asks, that's also the point.",
      crewTip: "Each artist makes one tape work and one shadow work for their own wall. Then title one of a crewmate's works without asking what it is.",
      next: 'lights-down',
    },
    {
      id: 'lights-down',
      stage: 3,
      title: 'Lights Down',
      narrative:
        'Doors in fifteen minutes, and the Gallerist just texted: the Critic is in the building. Nobody saw them come in, but someone is standing suspiciously close to {{early|your early work}}.',
      action:
        "Hang or prop the three works in a row, each with a card that explains what nothing means: title, materials, one line of art-speak (“interrogates tape and its absence”). Then dim the room, spotlight the show with a lamp, walk it once slowly, and write the review you'd love to read.",
      alternative:
        "Short on wall space or energy? Lay the show out on a table or the floor, write the cards on scraps, and open it from your chair: lights low, one slow look at each work, then the review you'd love to read.",
      minutes: 15,
      capture: {
        key: 'rave',
        label: "The one-line review you'd love to read",
        placeholder: 'A fearless new voice in tape.',
      },
      amplify: 'Open the show with a 20-second speech to the empty room, glass of water raised. Thank the tape. None of this was possible without the tape.',
      crewTip: 'Each artist gives a 30-second tour of their wall in full art-speak. Everyone else writes it a one-line review on a scrap of paper. Raves only.',
      next: 'untitled-the-critic',
    },
    {
      id: 'portrait-period',
      stage: 2,
      title: 'The Portrait Period',
      narrative:
        "In the Portrait Period, everything has a face if you stare long enough: two buttons and a spoon, and suddenly it's your uncle. Word is the Critic once called the Mona Lisa “smug.”",
      action:
        'Build two portraits from household objects, no drawing allowed: one of someone or something you live with (a person, a pet, a plant, the fridge) and one of yourself. Lay each face out on a table, the floor or a wall.',
      alternative:
        'Staying put? Build both faces on the table or your lap from whatever is in one bag or drawer, photographing the first before you take it apart for the second.',
      minutes: 24,
      capture: {
        key: 'self-portrait',
        label: "Your self-portrait's title",
        placeholder: 'Portrait of the Artist as a Colander',
      },
      amplify: 'Frame one portrait with anything rectangular (a cereal box, a picture frame, a window) and label it “On loan from a private collection.”',
      crewTip: 'Make your first portrait of a crewmate, from objects only, then one of yourself. Unveil the crewmate portraits all at once. No apologies allowed.',
      next: 'the-unveiling',
    },
    {
      id: 'the-unveiling',
      stage: 3,
      title: 'The Unveiling',
      narrative:
        'Doors in fifteen minutes. At portrait shows, the sitters always come to the opening and pretend not to look at themselves, and the Gallerist just texted that the Critic is in the building. Nobody saw them come in.',
      action:
        'Prop the three works at eye level, each labeled (title, sitter, materials) and draped with a towel. Gather your guests (a plant, a pet, a housemate, a mirror) and unveil one at a time, from {{early|your early work}} to the self-portrait, then write the line you hope the Critic writes.',
      alternative:
        "Rather keep it small? Line the works up on a table, unveil them to a single guest (a plant, a mug, your phone's selfie camera), and say one sentence about each sitter. Then write the line you hope the Critic writes.",
      minutes: 15,
      capture: {
        key: 'review',
        label: 'The line you hope the Critic writes',
        placeholder: 'The colander has never looked so vulnerable.',
      },
      amplify: 'Take the press photo: a selfie beside your self-portrait, both of you wearing the exact same expression. Hold it until it gets awkward.',
      crewTip: 'Unveil one wall at a time while everyone else plays the crowd: one gasp per work, minimum. Then each artist writes the line they hope the Critic writes.',
      next: 'portrait-of-the-critic',
    },
  ],
  endings: [
    {
      id: 'untitled-the-critic',
      title: 'Untitled (The Critic)',
      twist:
        'Plot twist: nobody saw the Critic come in because the Critic never left. You and the Critic go way back: it\'s the voice that mutters “a child could do that” whenever you make anything. Just now, in the dimmed room, it stood before {{abstract|your boldest abstract}}, made an hour ago from tape and nerve, and filed its first rave ever. You know the one. You wrote it.',
      closingLine: '{{rave|A fearless new voice in tape.}} (The Critic, who hates everything)',
      traits: { boldness: 1, creativity: 1 },
    },
    {
      id: 'portrait-of-the-critic',
      title: 'Portrait of the Critic',
      twist:
        'Plot twist: nobody saw the Critic come in because the Critic was already on the wall: {{self-portrait|your self-portrait}}. That voice muttering “not good enough” has always been yours, and at your own opening, it finally had to look itself in the eye. Then it wrote the line you hoped for. Portrait shows always end this way: the sitter recognizes themselves.',
      closingLine: '{{review|Tender, fearless, held together with tape.}} (The Critic, also on the wall)',
      traits: { connection: 1, boldness: 1 },
    },
  ],
};

export default galleryOpening;
