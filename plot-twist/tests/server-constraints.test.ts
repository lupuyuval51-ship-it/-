/**
 * Hard constraints checked in an AI episode's text (server/constraints.ts).
 * Every rule is tested with text it must flag and text it must leave alone, and
 * the whole curated library must pass for every combination of circumstances
 * each episode fits — a false positive costs a repair round.
 */
import { describe, expect, it } from 'vitest';
import { checkHardConstraints, longestMentionedMinutes, similarity, type ConstraintRule } from '../server/constraints.ts';
import { aiEpisodeToAdventure } from '../shared/aiEpisode.ts';
import { BUDGET_OPTIONS, COMPANY_OPTIONS, KINDS, MINUTES_OPTIONS, SETTING_OPTIONS } from '../shared/constants.ts';
import type { Adventure, Kind, Prefs } from '../shared/types.ts';
import { fitsPrefs } from '../shared/validate.ts';
import { LIBRARY } from '../src/content/library.ts';
import { mockAiEpisode } from './fixtures/aiEpisode.ts';

const base: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };

function episode(prefs: Prefs = base): Adventure {
  return aiEpisodeToAdventure(mockAiEpisode(prefs.minutes), prefs).adventure;
}

function rulesFor(adv: Adventure, prefs: Prefs = base, avoidKinds: Kind[] = []): ConstraintRule[] {
  return checkHardConstraints(adv, { prefs, avoidKinds }).map((p) => p.rule);
}

/** Puts `text` into stage 2 of path A as the action (or another field) and returns the rules it breaks. */
function withText(text: string, prefs: Prefs, field: 'action' | 'alternative' | 'amplify' | 'narrative' | 'crewTip' = 'action'): ConstraintRule[] {
  const adv = episode(prefs);
  adv.nodes[1][field] = text;
  return rulesFor(adv, prefs);
}

describe('free budget', () => {
  const free = base;
  it.each([
    'Walk to the nearest cinema and buy a ₪45 ticket.',
    'Order a coffee at the counter and sit by the window.',
    'Pay for one bus ride and get off at the fifth stop.',
    'Get a ticket for the museum and find the oldest object.',
    'Spend ₪10 on the smallest pastry in the bakery.',
    'Pick the fruit that costs 5 shekels and taste it.',
    'Rent a bike for twenty minutes.',
  ])('flags %j', (text) => {
    expect(withText(text, free)).toContain('free-budget');
  });

  it('flags purchases in the items list', () => {
    const adv = episode(free);
    adv.items = ['₪45 for a cinema ticket'];
    expect(rulesFor(adv, free)).toContain('free-budget');
  });

  it.each([
    'Find a free flyer and write its museum label.',
    'Gather a receipt, a ticket stub and a sticky note.',
    'Shuffle the order and read your new fortune aloud.',
    'Thank a cashier for one specific thing.',
    'No need to buy anything: the street is the museum.',
    'Name it like the priciest paint chip in the shop.',
    'Pay attention to the sounds for two minutes.',
    'Spend two minutes listening with your eyes closed.',
    'No bigger than a coin: find the smallest color.',
    'Find a bench with a free view and write one line.',
  ])('does not flag %j', (text) => {
    expect(withText(text, free)).not.toContain('free-budget');
  });

  it('does not apply to a paid budget', () => {
    expect(withText('Order a coffee at the counter.', { ...base, budget: 30 })).not.toContain('free-budget');
  });
});

describe('at home', () => {
  const home: Prefs = { ...base, setting: 'home' };
  /** A home-friendly version of the fixture: every action that would leave the house is replaced. */
  function homeEpisode(): Adventure {
    const adv = episode(home);
    for (const n of adv.nodes) {
      n.action = 'Choose one object in this room and describe it like a museum piece.';
      n.alternative = 'Sit by a window and list three things you can hear from inside.';
      delete n.amplify;
    }
    return adv;
  }
  const atHome = (text: string, field: 'action' | 'alternative' | 'amplify' = 'action') => {
    const adv = homeEpisode();
    adv.nodes[1][field] = text;
    return rulesFor(adv, home);
  };

  it('accepts an episode that stays in', () => {
    expect(rulesFor(homeEpisode(), home)).toEqual([]);
  });

  it.each([
    'Leave the house and walk to the nearest park.',
    'Take the bus two stops and get off.',
    'Head outside and find a bench.',
    'Walk around the block once, slowly.',
    'Sit in the park for five minutes and listen.',
    'Step out of the front door and count the windows across the street.',
    'Go down to the street and find the oldest door.',
  ])('flags %j', (text) => {
    expect(atHome(text)).toContain('stay-home');
  });

  it('flags leave-home cues in the alternative and the main character move too', () => {
    expect(atHome('Or walk to the nearest café instead.', 'alternative')).toContain('stay-home');
    expect(atHome('Head out for a lap around the block.', 'amplify')).toContain('stay-home');
  });

  it.each([
    'Prowl the room or the street outside your window for colors.',
    'Walk it slowly, like a gallery opening.',
    'Step out onto the balcony and name three sounds.',
    'Walk to the window and pick the strangest roof you can see.',
    'Watch the street corner from your window for two minutes.',
    'Leave the door open and listen to the hallway.',
    'Take a short walk around the flat at their pace.',
    'Track the sound no further than your window, your door or the end of the block.',
  ])('does not flag %j', (text) => {
    expect(atHome(text)).not.toContain('stay-home');
  });

  it('does not apply outside', () => {
    expect(withText('Take the bus two stops and get off.', base)).not.toContain('stay-home');
  });
});

describe('solo', () => {
  it.each([
    'Split your crew into two teams.',
    'Each of you picks a color and keeps it secret.',
    'Take turns reading the legends aloud.',
    'Whoever loses carries the bag.',
    'Ask your friends to vote on the best name.',
    'Work in pairs: one names, one writes.',
    'Each player hides one clue.',
  ])('flags %j', (text) => {
    expect(withText(text, base)).toContain('solo');
  });

  it('looks beyond the action: the narrative and the endings count too', () => {
    expect(withText('Your crew is waiting at the corner.', base, 'narrative')).toContain('solo');
    const adv = episode();
    adv.endings[0].closingLine = 'The whole team agreed: {{note3|nobody saw it coming}}.';
    expect(rulesFor(adv)).toContain('solo');
  });

  it.each([
    'A crew of one: director, writer and audience.',
    'Give a 30-second tour to an invisible tour group.',
    'Split your view into three slices and find the rarest color in each.',
    'Take a selfie beside your self-portrait, both of you wearing the same expression.',
    'Everyone on that street was narrating a film of their own.',
    'No crew, no budget, just you.',
  ])('does not flag %j', (text) => {
    expect(withText(text, base)).not.toContain('solo');
  });

  it('ignores crew tips (they only show for groups) and does not apply to groups', () => {
    expect(withText('Each of you hunts separately.', base, 'crewTip')).not.toContain('solo');
    expect(withText('Split your crew into two teams.', { ...base, company: 'group' })).not.toContain('solo');
  });
});

describe('honest time', () => {
  it('flags an action that takes longer than all the time there is', () => {
    expect(withText('Ride the bus to the very last stop and back (about an hour).', { ...base, minutes: 15 })).toContain('honest-time');
    expect(withText('Sketch the square for half an hour.', { ...base, minutes: 15 })).toContain('honest-time');
  });

  it('allows durations that fit, limits, intervals and points in time', () => {
    const fifteen = { ...base, minutes: 15 as const };
    expect(withText('Stand still for two full minutes like you just landed.', fifteen)).not.toContain('honest-time');
    expect(withText('Find a spot within ten minutes of here.', fifteen)).not.toContain('honest-time');
    expect(withText('Look at the photo you took an hour ago.', fifteen)).not.toContain('honest-time');
    expect(withText('Find the 24-hour kiosk and read its sign.', fifteen)).not.toContain('honest-time');
    expect(withText('Ride the bus to the very last stop and back (about an hour).', { ...base, minutes: 60 })).not.toContain('honest-time');
  });

  it('parses durations', () => {
    expect(longestMentionedMinutes('Take a 20-minute walk, then rest for five minutes.')).toEqual({ minutes: 20, phrase: '20-minute' });
    expect(longestMentionedMinutes('for two hours').minutes).toBe(120);
    expect(longestMentionedMinutes('every 10 minutes').minutes).toBe(0);
  });
});

describe('fills the time', () => {
  it('flags a path that uses less than 60% of the minutes', () => {
    const prefs: Prefs = { ...base, minutes: 120 };
    const adv = aiEpisodeToAdventure(mockAiEpisode(30), prefs).adventure; // a ~25-minute plan for 2 hours
    const problems = checkHardConstraints(adv, { prefs });
    expect(problems.map((p) => p.rule)).toContain('fills-time');
    expect(problems.find((p) => p.rule === 'fills-time')?.message).toMatch(/at least 72/);
  });

  it('accepts a plan that fills the time', () => {
    for (const minutes of MINUTES_OPTIONS) expect(rulesFor(episode({ ...base, minutes }), { ...base, minutes }), `${minutes}`).toEqual([]);
  });
});

describe('distinct paths', () => {
  it('flags identical endings (twist or closing line)', () => {
    const adv = episode();
    adv.endings[1] = { ...structuredClone(adv.endings[0]), id: adv.endings[1].id };
    expect(rulesFor(adv)).toContain('distinct-endings');
    const lines = episode();
    lines.endings[1].closingLine = lines.endings[0].closingLine.toUpperCase();
    expect(rulesFor(lines)).toContain('distinct-endings');
  });

  it('flags option labels that are the same', () => {
    const adv = episode();
    const options = adv.nodes[0].choice!.options;
    options[0].label = 'Go';
    options[1].label = 'go!';
    expect(rulesFor(adv)).toContain('distinct-options');
  });

  it('accepts different endings and labels', () => {
    const rules = rulesFor(episode());
    expect(rules).not.toContain('distinct-endings');
    expect(rules).not.toContain('distinct-options');
  });
});

describe('alternatives', () => {
  it('flags an alternative that is a near-copy of its action', () => {
    const adv = episode();
    adv.nodes[0].alternative = `${adv.nodes[0].action}.`;
    expect(rulesFor(adv)).toContain('distinct-alternative');
    const reworded = episode();
    reworded.nodes[2].alternative = reworded.nodes[2].action.replace(/\bsit\b/i, 'Sit down');
    expect(rulesFor(reworded)).toContain('distinct-alternative');
  });

  it('accepts genuinely different alternatives (every curated pair is far below the threshold)', () => {
    expect(rulesFor(episode())).not.toContain('distinct-alternative');
    const highest = Math.max(...LIBRARY.flatMap((a) => a.nodes.map((n) => similarity(n.action, n.alternative))));
    expect(highest).toBeLessThan(0.7);
  });
});

describe('kind', () => {
  it('flags a kind the other envelopes already use', () => {
    const adv = episode();
    adv.kind = 'detective';
    expect(rulesFor(adv, base, ['detective', 'social'])).toContain('avoid-kind');
    expect(rulesFor(adv, base, ['social'])).not.toContain('avoid-kind');
  });

  it('does not ask for the impossible when every kind is taken', () => {
    const adv = episode();
    expect(rulesFor(adv, base, [...KINDS])).not.toContain('avoid-kind');
  });
});

describe('the curated library', () => {
  it('passes every check for every combination of circumstances each episode fits', () => {
    let checked = 0;
    for (const adv of LIBRARY) {
      // An episode is written for its own duration; a longer free window may get a shorter curated
      // episode, so the fill rule (an AI-only expectation) is judged at that duration.
      const written = MINUTES_OPTIONS.find((m) => m >= adv.minutes)!;
      for (const minutes of MINUTES_OPTIONS)
        for (const budget of BUDGET_OPTIONS)
          for (const setting of SETTING_OPTIONS)
            for (const company of COMPANY_OPTIONS) {
              // Mood and weirdness only rank episodes: neither fitsPrefs nor these checks read them.
              const prefs: Prefs = { minutes, budget, setting, company, mood: adv.moods[0], weirdness: adv.weirdness };
              if (!fitsPrefs(adv, prefs)) continue;
              const problems = checkHardConstraints(adv, { prefs }).filter((p) => p.rule !== 'fills-time' || minutes === written);
              expect(problems, `${adv.id} ${JSON.stringify(prefs)}`).toEqual([]);
              checked++;
            }
    }
    expect(LIBRARY.length).toBe(16);
    expect(checked).toBeGreaterThan(200);
  });
});
