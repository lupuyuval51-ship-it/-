import { categoryBySlug } from '@/data/categories';
import type { AppPlatform, BudgetTier, BusinessModel, CategorySlug, Difficulty, Idea, Locale } from '@/data/types';

export interface IdeaFilters {
  categories: CategorySlug[];
  difficulties: Difficulty[];
  budgets: BudgetTier[];
  businessModels: BusinessModel[];
  platforms: AppPlatform[];
  beginnerFriendly: boolean;
  profitable: boolean;
  experimental: boolean;
}

export type SortMode = 'relevance' | 'effort' | 'name';

export const emptyFilters: IdeaFilters = {
  categories: [],
  difficulties: [],
  budgets: [],
  businessModels: [],
  platforms: [],
  beginnerFriendly: false,
  profitable: false,
  experimental: false,
};

export function countActiveFilters(filters: IdeaFilters): number {
  return (
    filters.categories.length +
    filters.difficulties.length +
    filters.budgets.length +
    filters.businessModels.length +
    filters.platforms.length +
    (filters.beginnerFriendly ? 1 : 0) +
    (filters.profitable ? 1 : 0) +
    (filters.experimental ? 1 : 0)
  );
}

export function applyFilters(ideas: Idea[], filters: IdeaFilters): Idea[] {
  return ideas.filter((idea) => {
    if (filters.categories.length && !filters.categories.some((c) => idea.category === c || idea.secondaryCategories.includes(c))) return false;
    if (filters.difficulties.length && !filters.difficulties.includes(idea.difficulty)) return false;
    if (filters.budgets.length && !filters.budgets.includes(idea.budget)) return false;
    if (filters.businessModels.length && !filters.businessModels.includes(idea.businessModel)) return false;
    if (filters.platforms.length && !filters.platforms.some((p) => idea.platforms.includes(p))) return false;
    if (filters.beginnerFriendly && !idea.flags.beginnerFriendly) return false;
    if (filters.profitable && idea.flags.profitPotential !== 'high') return false;
    if (filters.experimental && !idea.flags.experimental) return false;
    return true;
  });
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '') // Hebrew niqqud
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(query: string): string[] {
  return normalize(query)
    .split(' ')
    .filter((t) => t.length >= 2);
}

/**
 * Scores an idea against a free-text query. Name and tagline matter most,
 * tags and category next, long-form overview least. Both locales are searched
 * so an English query finds Hebrew ideas and vice versa.
 */
export function scoreIdea(idea: Idea, query: string, locale: Locale): number {
  const terms = tokens(query);
  if (!terms.length) return 0;
  const category = categoryBySlug[idea.category];
  const fields: { text: string; weight: number }[] = [
    { text: normalize(`${idea.name.he} ${idea.name.en}`), weight: 10 },
    { text: normalize(`${idea.tagline.he} ${idea.tagline.en}`), weight: 5 },
    { text: normalize(idea.tags.join(' ')), weight: 4 },
    { text: normalize(`${category.label.he} ${category.label.en}`), weight: 3 },
    { text: normalize(`${idea.spec.usp[locale]} ${idea.spec.overview[locale]}`), weight: 1 },
  ];
  let score = 0;
  for (const term of terms) {
    let matched = false;
    for (const field of fields) {
      if (field.text.includes(term)) {
        score += field.weight;
        matched = true;
      }
    }
    if (!matched) return 0; // every term must match somewhere
  }
  return score;
}

export function searchIdeas(ideas: Idea[], query: string, locale: Locale): Idea[] {
  if (!tokens(query).length) return ideas;
  return ideas
    .map((idea) => ({ idea, score: scoreIdea(idea, query, locale) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.idea);
}

export function sortIdeas(ideas: Idea[], mode: SortMode, locale: Locale): Idea[] {
  if (mode === 'effort') return [...ideas].sort((a, b) => a.effort.weeksMin - b.effort.weeksMin || a.effort.weeksMax - b.effort.weeksMax);
  if (mode === 'name') return [...ideas].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale));
  return ideas;
}
