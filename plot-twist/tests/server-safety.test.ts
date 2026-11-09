/**
 * The safety screen for AI episodes: catches paraphrases of the non-negotiable
 * rules regardless of word order, and does not flag ordinary harmless wording
 * (each false positive costs a repair round). The curated library must stay
 * clean (also checked in content.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { evaluateDraft } from '../server/director.ts';
import { screenAdventure, screenText } from '../server/safety.ts';
import { LIBRARY } from '../src/content/library.ts';
import type { Prefs } from '../shared/types.ts';
import { mockAiEpisode } from './fixtures/aiEpisode.ts';

const prefs: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };

/** QA: these paraphrases were accepted by evaluateDraft before (verbatim from the report). [text, expected reason] */
const QA_MISSED: [string, RegExp][] = [
  ['Snap a photo of the person reading on the bench next to you without them noticing.', /covert surveillance|recording people/],
  ['Follow the woman in the red coat for two blocks', /following people/],
  ['Pick a suspect walking ahead of you… and tail them for one block', /following people/],
  ['step out to the roof edge', /roof/],
  ['Hop the fence into the empty construction site', /climbing structures/],
  ['Order a glass of wine at the bar', /alcohol/],
  ['Light a candle', /fire or blades/],
  ['wade into the fountain', /water hazards/],
];

/** QA: these harmless phrasings were flagged before (verbatim from the report). */
const QA_FALSE_POSITIVES = [
  'Take three shots of the same doorway',
  'a lighter shade of blue',
  'butter knife',
  'the weed pushing through the pavement crack',
  'Count the ducks swimming',
  'Toss a fallen leaf into the water',
  'I am betting you never noticed',
  'lottery kiosk',
];

/** The same, as full sentences an episode would contain. */
const QA_MISSED_IN_CONTEXT: [string, RegExp][] = [
  ['Follow the woman in the red coat for two blocks, keeping a careful distance.', /following people/],
  ['Pick a suspect walking ahead of you on the street and tail them for one block.', /following people/],
  ['Take the stairs up and step out to the roof edge for the view.', /roof/],
  ['Hop the fence into the empty construction site and look for clues.', /climbing structures/],
  ['Order a glass of wine at the bar and toast the case.', /alcohol/],
  ['Light a candle and say the name of your case out loud.', /fire or blades/],
  ['Kick off your shoes and wade into the fountain.', /water hazards/],
];
const QA_FALSE_POSITIVES_IN_CONTEXT = [
  'Take three shots of the same doorway from different heights.',
  'Find something a lighter shade of blue than the sky.',
  'Spread it with a butter knife, slowly, like evidence.',
  'Look for the weed pushing through the pavement crack.',
  'Count the ducks swimming past the bridge.',
  'Toss a fallen leaf into the water and watch where it goes.',
  'I am betting you never noticed that sign before.',
  'Find the lottery kiosk and read the slogan on its awning.',
];

const MORE_VIOLATIONS: [string, RegExp][] = [
  ...QA_MISSED_IN_CONTEXT,
  ['Photograph strangers at the bus stop.', /recording people/],
  ['Secretly photograph the café regulars.', /covert surveillance/],
  ['Take pictures of random people on the train.', /recording people/],
  ['Film the couple arguing on the bench.', /recording people/],
  ['Find a busker and record them for your soundtrack.', /recording people/],
  ['Follow someone home.', /following people/],
  ['Choose a stranger and follow them for a block.', /following people/],
  ['Shadow the man with the umbrella.', /following people/],
  ['Climb onto the roof of the nearest building and wave.', /roof/],
  ['Walk along the ledge of the old wall.', /ledges/],
  ['Scale the garden wall and look over.', /climbing structures/],
  ['Climb up into the old tree.', /climbing structures/],
  ['Meet your informant at the bar on the corner.', /alcohol/],
  ['Visit the nearest pub.', /alcohol/],
  ['Do shots with the bartender.', /alcohol/],
  ['Smoke a cigarette like a noir detective.', /smoking/],
  ['Light some incense and breathe.', /fire or blades/],
  ['Use a lighter to light the wick.', /fire or blades/],
  ['Grab a knife from the kitchen.', /fire or blades/],
  ['Burn the list of worries in a bowl.', /fire or blades/],
  ['Smoke weed in the park.', /drugs/],
  ['Place a bet with yourself and ₪10 on the next car color.', /gambling/],
  ['Buy a lottery ticket and scratch it.', /gambling/],
  ['Go swimming in the sea.', /water hazards/],
  ['Take a quick dip in the fountain.', /water hazards/],
  ['Dip your toes in the fountain.', /water hazards/],
  ['Walk into the sea up to your knees.', /water hazards/],
  ['Prank the barista.', /pranks/],
  ['Walk along the train tracks.', /rail tracks/],
];

const MORE_HARMLESS = [
  ...QA_FALSE_POSITIVES_IN_CONTEXT,
  'Never photograph strangers; photograph objects instead.',
  'Photograph each nameless spot, with no people in the frame.',
  'Take a photo of an object (not a person).',
  'No crew, no budget, nobody filming anybody.',
  'Record them back to back as one long, warm sign-off.',
  'Record your dedication: name a real person who would smile at this.',
  'Keep a record of the people you thanked.',
  'Picture a person who lived here a hundred years ago.',
  'Every great film opens on someone walking in alone.',
  'Video call someone you miss.',
  'Send a photo to someone you miss.',
  'Follow the noise to its source.',
  'Follow a local tip.',
  'Ask the follow-up every local secretly loves.',
  'Find the shadow people cast on the wall.',
  'Put it on the window ledge.',
  'Satellites have photographed every rooftop on Earth.',
  'Unwrap a chocolate bar and watch the progress bar fill.',
  'Write a tasting note so pompous that wine experts weep.',
  'Order a ginger beer.',
  'Announce it like a tarot reader in a candlelit tent.',
  'half a birthday candle',
  'Light it with your phone flashlight.',
  'Kids splashing in the fountain make the best soundtrack.',
  'Toss a coin into the fountain and make a wish.',
  'Do not climb the fence.',
  'It is not gambling, it is fate.',
  'Buy a non-alcoholic drink.',
  'The Fence here. I move hot colors, no questions asked.',
  'Make a man-made waterfall from a cup.',
];

describe('safety screen: QA regressions', () => {
  it.each(QA_MISSED)('flags %j', (text, reason) => {
    expect(screenText(text).join(' | ')).toMatch(reason);
  });

  it.each(QA_FALSE_POSITIVES)('does not flag %j', (text) => {
    expect(screenText(text)).toEqual([]);
  });

  it('rejects the paraphrases inside a real draft too (and accepts the harmless wording there)', () => {
    for (const [text] of QA_MISSED_IN_CONTEXT) {
      const ep = mockAiEpisode(30);
      ep.pathA.stage2.action = text;
      const r = evaluateDraft(JSON.stringify(ep), { prefs });
      expect(r.ok, text).toBe(false);
      expect(!r.ok && r.problems.join()).toMatch(/Safety/);
    }
    for (const text of QA_FALSE_POSITIVES_IN_CONTEXT) {
      const ep = mockAiEpisode(30);
      ep.pathA.stage2.narrative = text;
      const r = evaluateDraft(JSON.stringify(ep), { prefs });
      expect(r.ok ? [] : r.problems, text).toEqual([]);
    }
  });
});

describe('safety screen: word order and precision', () => {
  it.each(MORE_VIOLATIONS)('flags %j', (text, reason) => {
    expect(screenText(text).join(' | ')).toMatch(reason);
  });

  it.each(MORE_HARMLESS)('does not flag %j', (text) => {
    expect(screenText(text)).toEqual([]);
  });

  it('passes every curated episode', () => {
    for (const adv of LIBRARY) expect(screenAdventure(adv), adv.id).toEqual([]);
  });
});
