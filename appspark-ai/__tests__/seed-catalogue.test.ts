import { categories } from '@/data/categories';
import { allIdeas } from '@/data/ideas';

describe('seed catalogue', () => {
  it('has at least 60 ideas with unique ids and both languages', () => {
    expect(allIdeas.length).toBeGreaterThanOrEqual(60);
    const ids = new Set(allIdeas.map((i) => i.id));
    expect(ids.size).toBe(allIdeas.length);
    for (const idea of allIdeas) {
      expect(idea.name.he.trim()).not.toBe('');
      expect(idea.name.en.trim()).not.toBe('');
      expect(idea.spec.coreFeatures.he.length).toBe(idea.spec.coreFeatures.en.length);
      expect(categories.some((c) => c.slug === idea.category)).toBe(true);
    }
  });

  it('covers every category', () => {
    for (const category of categories) {
      expect(allIdeas.some((i) => i.category === category.slug)).toBe(true);
    }
  });
});
