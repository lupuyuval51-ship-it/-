import type { Idea, OnboardingAnswers } from '@/data/types';

/** Deterministic hash so the "idea of the day" is stable for a given date. */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Picks the featured idea for a date, weighted by `featuredWeight`. */
export function featuredIdeaForDate(ideas: Idea[], date: Date = new Date()): Idea | undefined {
  if (!ideas.length) return undefined;
  const weighted: Idea[] = [];
  for (const idea of ideas) {
    for (let i = 0; i < Math.max(1, idea.flags.featuredWeight); i += 1) weighted.push(idea);
  }
  const index = hashString(dayKey(date)) % weighted.length;
  return weighted[index];
}

export function trendingIdeas(ideas: Idea[], limit = 8): Idea[] {
  return ideas.filter((i) => i.flags.trending).slice(0, limit);
}

export function beginnerIdeas(ideas: Idea[], limit = 8): Idea[] {
  return ideas
    .filter((i) => i.flags.beginnerFriendly)
    .sort((a, b) => a.effort.weeksMax - b.effort.weeksMax)
    .slice(0, limit);
}

export function profitableIdeas(ideas: Idea[], limit = 8): Idea[] {
  return ideas.filter((i) => i.flags.profitPotential === 'high').slice(0, limit);
}

export function experimentalIdeas(ideas: Idea[], limit = 8): Idea[] {
  return ideas.filter((i) => i.flags.experimental).slice(0, limit);
}

/**
 * Personalised picks. Interests are the strongest signal; experience nudges
 * the difficulty; the chosen platform adds a small bonus. Falls back to a
 * weighted mix when onboarding was skipped.
 */
export function curatedIdeas(ideas: Idea[], answers: OnboardingAnswers, limit = 8, seed = ''): Idea[] {
  const hasSignal = answers.interests.length > 0 || answers.experience || answers.platform;
  const scored = ideas.map((idea) => {
    let score = 0;
    if (answers.interests.includes(idea.category)) score += 4;
    if (idea.secondaryCategories.some((c) => answers.interests.includes(c))) score += 1.5;
    if (answers.experience === 'none' || answers.experience === 'beginner') {
      if (idea.difficulty === 'beginner') score += 3;
      else if (idea.difficulty === 'intermediate') score += 0.5;
      else score -= 2;
    } else if (answers.experience === 'intermediate') {
      if (idea.difficulty === 'intermediate') score += 2;
      else if (idea.difficulty === 'beginner') score += 0.5;
    } else if (answers.experience === 'advanced') {
      if (idea.difficulty === 'advanced') score += 2;
      else if (idea.difficulty === 'intermediate') score += 1;
    }
    if (answers.platform && idea.platforms.includes(answers.platform)) score += 1;
    if (answers.platform === 'cross-platform' && idea.platforms.length > 1) score += 0.5;
    if (!hasSignal) score += idea.flags.featuredWeight;
    // Tiny deterministic jitter so ties do not always resolve in catalogue order.
    score += (hashString(`${seed}${idea.id}`) % 100) / 1000;
    return { idea, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.idea);
}

export function similarIdeas(all: Idea[], idea: Idea, limit = 4): Idea[] {
  return all
    .filter((other) => other.id !== idea.id)
    .map((other) => {
      let score = 0;
      if (other.category === idea.category) score += 3;
      if (other.secondaryCategories.includes(idea.category) || idea.secondaryCategories.includes(other.category)) score += 1.5;
      score += other.tags.filter((t) => idea.tags.includes(t)).length;
      if (other.difficulty === idea.difficulty) score += 0.5;
      if (other.audience.some((a) => idea.audience.includes(a))) score += 0.5;
      return { other, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.other);
}

export function greetingKey(date: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
