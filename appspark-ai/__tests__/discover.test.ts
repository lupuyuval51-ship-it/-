import { ideas } from '@/data/seed/ai';
import type { Idea } from '@/data/types';
import { applyFilters, countActiveFilters, emptyFilters, scoreIdea, searchIdeas, sortIdeas } from '@/features/discover/search';
import { beginnerIdeas, curatedIdeas, dayKey, featuredIdeaForDate, greetingKey, similarIdeas } from '@/features/discover/sections';

const base = ideas[0];

function variant(overrides: Partial<Idea> & { id: string }): Idea {
  return { ...base, ...overrides, flags: { ...base.flags, ...(overrides.flags ?? {}) } };
}

const catalogue: Idea[] = [
  base,
  variant({ id: 'budget-buddy', name: { he: 'תקציב חכם', en: 'Budget Buddy' }, tagline: { he: 'תקציב לזוגות', en: 'Budgeting for couples' }, category: 'finance', secondaryCategories: [], difficulty: 'beginner', tags: ['budget', 'couples', 'money'], flags: { ...base.flags, beginnerFriendly: true, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 1 }, effort: { weeksMin: 1, weeksMax: 2 } }),
  variant({ id: 'pixel-garden', name: { he: 'גינת פיקסלים', en: 'Pixel Garden' }, tagline: { he: 'משחק גינון יומי', en: 'A daily gardening game' }, category: 'games', secondaryCategories: ['lifestyle'], difficulty: 'advanced', tags: ['game', 'daily', 'garden'], flags: { ...base.flags, beginnerFriendly: false, profitPotential: 'low', experimental: true, trending: true, featuredWeight: 2 }, effort: { weeksMin: 10, weeksMax: 16 } }),
];

describe('search', () => {
  it('finds ideas by English and Hebrew terms across fields', () => {
    expect(searchIdeas(catalogue, 'budget', 'he').map((i) => i.id)).toEqual(['budget-buddy']);
    expect(searchIdeas(catalogue, 'גינון', 'he').map((i) => i.id)).toEqual(['pixel-garden']);
    expect(searchIdeas(catalogue, 'negotiation', 'en')[0]?.id).toBe('rehearse');
  });

  it('requires every term to match and ranks name matches first', () => {
    expect(searchIdeas(catalogue, 'budget garden', 'en')).toHaveLength(0);
    expect(scoreIdea(base, 'rehearse', 'en')).toBeGreaterThan(scoreIdea(base, 'coaching', 'en'));
  });

  it('returns everything for an empty query', () => {
    expect(searchIdeas(catalogue, '  ', 'en')).toHaveLength(catalogue.length);
  });
});

describe('filters', () => {
  it('applies category, difficulty and flag filters', () => {
    expect(applyFilters(catalogue, { ...emptyFilters, categories: ['lifestyle'] }).map((i) => i.id)).toEqual(['pixel-garden']);
    expect(applyFilters(catalogue, { ...emptyFilters, difficulties: ['beginner'] }).map((i) => i.id)).toEqual(['budget-buddy']);
    expect(applyFilters(catalogue, { ...emptyFilters, experimental: true }).map((i) => i.id)).toEqual(['pixel-garden']);
    expect(applyFilters(catalogue, { ...emptyFilters, profitable: true }).map((i) => i.id)).toEqual(['rehearse']);
  });

  it('counts active filters', () => {
    expect(countActiveFilters(emptyFilters)).toBe(0);
    expect(countActiveFilters({ ...emptyFilters, categories: ['ai', 'games'], beginnerFriendly: true })).toBe(3);
  });

  it('sorts by effort', () => {
    expect(sortIdeas(catalogue, 'effort', 'en').map((i) => i.id)).toEqual(['budget-buddy', 'rehearse', 'pixel-garden']);
  });
});

describe('sections', () => {
  it('picks a stable featured idea per day', () => {
    const date = new Date(2026, 10, 6);
    expect(featuredIdeaForDate(catalogue, date)?.id).toBe(featuredIdeaForDate(catalogue, new Date(2026, 10, 6, 23))?.id);
    expect(dayKey(date)).toBe('2026-11-06');
  });

  it('curates by interests and experience', () => {
    const picks = curatedIdeas(catalogue, { interests: ['finance'], experience: 'none', platform: null, assistant: null }, 3);
    expect(picks[0]?.id).toBe('budget-buddy');
    const advanced = curatedIdeas(catalogue, { interests: ['games'], experience: 'advanced', platform: null, assistant: null }, 3);
    expect(advanced[0]?.id).toBe('pixel-garden');
  });

  it('lists beginner ideas sorted by effort and similar ideas by shared traits', () => {
    expect(beginnerIdeas(catalogue).map((i) => i.id)).toEqual(['budget-buddy']);
    expect(similarIdeas(catalogue, base).length).toBeGreaterThan(0);
  });

  it('greets by hour', () => {
    expect(greetingKey(new Date(2026, 0, 1, 8))).toBe('morning');
    expect(greetingKey(new Date(2026, 0, 1, 14))).toBe('afternoon');
    expect(greetingKey(new Date(2026, 0, 1, 20))).toBe('evening');
    expect(greetingKey(new Date(2026, 0, 1, 2))).toBe('night');
  });
});
