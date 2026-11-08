import { describe, expect, it } from 'vitest';
import { validateAdventure, checkPrefsFit } from '../shared/validate.ts';
import exemplar from '../src/content/adventures/undercover-tourist.ts';
import type { Adventure } from '../shared/types.ts';

const clone = (): Adventure => structuredClone(exemplar);

describe('validateAdventure', () => {
  it('accepts the exemplar', () => {
    const r = validateAdventure(exemplar);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateAdventure(null).ok).toBe(false);
    expect(validateAdventure('nope').ok).toBe(false);
  });

  it('requires an alternative for every stage', () => {
    const a = clone();
    a.nodes[1].alternative = '';
    expect(validateAdventure(a).errors.join()).toMatch(/alternative: is required/);
  });

  it('requires every path to be exactly three stages', () => {
    const a = clone();
    // stage 2 jumps straight to an ending
    a.nodes[1].next = 'quiet-detective';
    expect(validateAdventure(a).ok).toBe(false);
  });

  it('requires at least two reachable endings', () => {
    const a = clone();
    a.nodes[4].next = 'quiet-detective';
    const r = validateAdventure(a);
    expect(r.errors.join()).toMatch(/unreachable|two reachable endings/);
  });

  it('rejects choices whose options lead to the same place', () => {
    const a = clone();
    a.nodes[0].choice!.options[1].next = 'slow-tour';
    expect(validateAdventure(a).errors.join()).toMatch(/same place/);
  });

  it('rejects paths longer than the stated duration', () => {
    const a = clone();
    a.nodes[1].minutes = 40;
    expect(validateAdventure(a).errors.join()).toMatch(/needs \d+ min/);
  });

  it('rejects tokens that reference unknown capture keys and malformed tokens', () => {
    const a = clone();
    a.endings[0].twist = 'Remember {{nope|x}}?';
    expect(validateAdventure(a).errors.join()).toMatch(/unknown capture key/);
    const b = clone();
    b.endings[0].twist = 'Remember {{detail}}?';
    expect(validateAdventure(b).errors.join()).toMatch(/malformed/);
  });

  it('rejects bad enums and cost ranges', () => {
    const a = clone() as unknown as Record<string, unknown>;
    a.palette = 'hotdog';
    a.cost = { min: 20, max: 10 };
    const r = validateAdventure(a);
    expect(r.errors.join()).toMatch(/palette/);
    expect(r.errors.join()).toMatch(/min must be ≤ max/);
  });
});

describe('checkPrefsFit', () => {
  it('reports each violated hard constraint', () => {
    const issues = checkPrefsFit(exemplar, { minutes: 15, budget: 0, setting: 'home', company: 'solo', mood: 'curious', weirdness: 2 });
    expect(issues).toHaveLength(2);
    expect(checkPrefsFit(exemplar, { minutes: 30, budget: 0, setting: 'outside', company: 'group', mood: 'social', weirdness: 1 })).toEqual([]);
  });
});

describe('template rendering', () => {
  it('joins notes into sentences cleanly and renders typographic quotes', async () => {
    const { renderTemplate, typographic } = await import('../shared/template.ts');
    expect(renderTemplate('Title: {{t|Untitled}}: a story', { t: 'Untitled, but loudly.' })).toBe('Title: Untitled, but loudly: a story');
    expect(renderTemplate('"{{t|x}}", it went well.', { t: 'Loud.' })).toBe('"Loud", it went well.');
    expect(renderTemplate('It was {{t|x}} today', { t: 'Loud.' })).toBe('It was Loud. today');
    expect(renderTemplate('It was {{t|a quiet day}}.', {})).toBe('It was a quiet day.');
    expect(typographic(`It isn't "done" yet ('really')`)).toBe('It isn’t “done” yet (‘really’)');
  });
});
