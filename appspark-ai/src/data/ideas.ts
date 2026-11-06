import { seedIdeas } from './seed';
import type { CategorySlug, Idea } from './types';

/** All curated ideas, in catalogue order. */
export const allIdeas: Idea[] = seedIdeas;

const byId = new Map<string, Idea>(allIdeas.map((idea) => [idea.id, idea]));

export function getIdeaById(id: string): Idea | undefined {
  return byId.get(id);
}

export function getIdeasByCategory(slug: CategorySlug): Idea[] {
  return allIdeas.filter((idea) => idea.category === slug || idea.secondaryCategories.includes(slug));
}

export function countByCategory(): Record<CategorySlug, number> {
  const counts = {} as Record<CategorySlug, number>;
  for (const idea of allIdeas) {
    counts[idea.category] = (counts[idea.category] ?? 0) + 1;
  }
  return counts;
}
