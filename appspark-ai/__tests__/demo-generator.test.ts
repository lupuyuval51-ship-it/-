import { generateDemoIdeas } from '@/features/generator/demo';
import { defaultGeneratorInput } from '@/features/generator/types';

describe('demo generator', () => {
  const input = { ...defaultGeneratorInput, brief: 'אני רוצה רעיון למשחק שאפשר לבנות לבד ושיש לו פוטנציאל להפוך לוויראלי.', category: null };

  it('returns 3–5 clearly marked demo ideas, deterministically', () => {
    const first = generateDemoIdeas(input, 'he');
    const second = generateDemoIdeas(input, 'he');
    expect(first.length).toBeGreaterThanOrEqual(3);
    expect(first.length).toBeLessThanOrEqual(5);
    expect(first.map((i) => i.id)).toEqual(second.map((i) => i.id));
    for (const idea of first) {
      expect(idea.id.startsWith('demo-')).toBe(true);
      expect(idea.tags).toContain('demo');
      expect(idea.name.he.length).toBeGreaterThan(0);
      expect(idea.name.en.length).toBeGreaterThan(0);
    }
  });

  it('honours complexity, platform and monetization choices', () => {
    const ideas = generateDemoIdeas({ ...input, complexity: 'simple', platform: 'web', monetization: 'ads' }, 'en');
    for (const idea of ideas) {
      expect(idea.difficulty).toBe('beginner');
      expect(idea.platforms).toEqual(['web']);
      expect(idea.businessModel).toBe('ads');
    }
  });

  it('changes output when the brief changes', () => {
    const a = generateDemoIdeas(input, 'en').map((i) => i.id);
    const b = generateDemoIdeas({ ...input, brief: 'A tool for dog walkers in Tel Aviv' }, 'en').map((i) => i.id);
    expect(a).not.toEqual(b);
  });
});
