import type { Adventure } from '../../../shared/types.ts';

/**
 * Exemplar episode — the quality bar for every curated adventure.
 * Branch A is observational and reflective; branch B is creative and playful.
 * Both endings turn the user's own field notes into the poster's closing line.
 */
const undercoverTourist: Adventure = {
  id: 'undercover-tourist',
  version: 1,
  source: 'curated',
  title: 'The Undercover Tourist',
  tagline: 'Your street has been keeping a guidebook. Nobody has read it. Yet.',
  intro:
    'Today you are a visitor from very far away: imaginary accent, fake itinerary, very real notebook. Your mission is to find what the locals stopped seeing — and then decide what kind of travel writer you are.',
  kind: 'detective',
  moods: ['curious', 'change'],
  weirdness: 2,
  minutes: 30,
  cost: { min: 0, max: 0 },
  settings: ['outside'],
  company: ['solo', 'group'],
  items: ['Phone or notebook', 'Something to write with'],
  palette: 'ember',
  motif: 'grid',
  traits: { curiosity: 2, boldness: 1 },
  stageLabel: 'Postcard',
  narrator: 'The Tourist Board (unofficial)',
  start: 'arrive',
  nodes: [
    {
      id: 'arrive',
      stage: 1,
      title: 'Arrive Like a Stranger',
      narrative:
        'Every great trip starts with the walk out of the hotel. Your hotel is your front door. You have never been here before. Act accordingly.',
      action:
        'Walk to the nearest corner and stand there for two full minutes like you just landed. Find three details a local would never photograph: a sign, a texture, a sound.',
      alternative:
        'Do it from a window, balcony or doorway: spend two minutes finding three overlooked details you can see or hear from where you are.',
      minutes: 8,
      capture: {
        key: 'detail',
        label: 'The strangest detail you found',
        placeholder: 'a door painted the wrong blue',
      },
      amplify: 'Consult an imaginary map. Squint at the street signs. Nod like it all makes sense now.',
      crewTip: 'Each of you hunts separately. No sharing until everyone has three details.',
      choice: {
        prompt: 'Your guidebook is blank. How do you fill it?',
        options: [
          {
            id: 'observe',
            label: 'Follow the details',
            description: 'Observe. Slow down. Connect the dots.',
            next: 'slow-tour',
            traits: { curiosity: 1 },
          },
          {
            id: 'legend',
            label: 'Invent the legend',
            description: 'Make up the history. Make it ridiculous.',
            next: 'legend-maker',
            traits: { creativity: 1 },
          },
        ],
      },
    },
    {
      id: 'slow-tour',
      stage: 2,
      title: 'The Slow Tour',
      narrative:
        'Tourists move at half the speed of locals. That is not a flaw. That is the whole trick. The city hides its history one floor above the shop signs.',
      action:
        'Walk one block at half your normal speed, looking only above eye level. Find the oldest-looking thing on the street and guess its age out loud (quietly counts).',
      alternative:
        'Sit on a bench or step for five minutes and watch one spot. Note everything that changes, then pick the thing that has clearly been there the longest.',
      minutes: 12,
      capture: {
        key: 'oldest',
        label: 'The oldest thing you found',
        placeholder: 'a mailbox from another century',
      },
      amplify: 'Take one "postcard" photo of it — a building, a doorway or a sign (no people) — framed like it is world-famous.',
      crewTip: 'Everyone guesses the age before anyone looks for clues. Closest guess picks the next street.',
      next: 'field-report',
    },
    {
      id: 'field-report',
      stage: 3,
      title: 'The Field Report',
      narrative:
        'Every travel writer eventually sits down and realizes what the trip was actually about. You found {{detail|a strange detail}}. You found {{oldest|something old}}. They are connected. Find out how.',
      action:
        'Find somewhere to sit. Write the one sentence a guidebook would never print — what this street is really about, using both of your finds.',
      alternative: 'Record it as a 20-second voice memo instead of writing, as if you are narrating the last scene of a travel show.',
      minutes: 8,
      capture: {
        key: 'report',
        label: 'Your one-sentence field report',
        placeholder: 'This street keeps its secrets above eye level.',
      },
      crewTip: 'Each person writes a sentence. Read them out together, then merge them into one.',
      next: 'quiet-detective',
    },
    {
      id: 'legend-maker',
      stage: 2,
      title: 'The Legend Maker',
      narrative:
        'Every city has legends. Yours just has not been told them yet. Starting with {{detail|that strange detail}}, you are now its official historian.',
      action:
        'Pick three spots in sight. Give each a dramatic historical name and a one-line legend, delivered with total confidence. ("The Bench of Seven Pigeons. Treaties were signed here.")',
      alternative: 'Stay where you are and name three objects instead — a lamp, a step, a plant — each with a secret, glorious past.',
      minutes: 12,
      capture: {
        key: 'legend',
        label: 'Your best legend',
        placeholder: 'The Lamp Post That Saw Too Much',
      },
      amplify: 'Give a 30-second guided tour of one landmark to an invisible tour group. Point dramatically. Take no questions.',
      crewTip: 'Everyone invents a legend for the same spot. Vote on the official history.',
      next: 'gift-shop',
    },
    {
      id: 'gift-shop',
      stage: 3,
      title: 'The Gift Shop',
      narrative:
        'Every attraction ends at the gift shop. This one stocks exactly one souvenir, and it is free, and it is somewhere within twenty steps of you.',
      action:
        'Find a free souvenir that fits your legends — a fallen leaf, a smooth pebble, a free flyer, or a photo of an object (not a person). Write its museum label: name, date, significance.',
      alternative: 'Sketch the souvenir in your notebook instead of taking anything, and write the museum label beneath it.',
      minutes: 8,
      capture: {
        key: 'souvenir',
        label: "Your souvenir's museum label",
        placeholder: 'Leaf, c. this morning. Witness to the Pigeon Treaty.',
      },
      next: 'unofficial-historian',
    },
  ],
  endings: [
    {
      id: 'quiet-detective',
      title: 'The Quiet Detective',
      twist:
        'Plot twist: you were never the tourist. The street was — it has been passing through your life for years, and today you finally said hello. Your field report just became the official tagline of this episode. Check your poster.',
      closingLine: '{{report|Some places only reveal themselves to people who slow down.}}',
      traits: { curiosity: 1 },
    },
    {
      id: 'unofficial-historian',
      title: 'The Unofficial Historian',
      twist:
        'Plot twist: the best stories are not found, they are founded. As of today, {{legend|your legend}} is part of this street\'s history — because someone finally wrote it down. Your souvenir is now the closing line of the episode.',
      closingLine: 'Official souvenir: {{souvenir|one leaf, priceless}}.',
      traits: { creativity: 1, boldness: 1 },
    },
  ],
};

export default undercoverTourist;
