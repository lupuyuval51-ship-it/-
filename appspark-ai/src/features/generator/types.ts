import type { AppPlatform, Audience, BusinessModel, CategorySlug } from '@/data/types';

export const GENERATOR_COMPLEXITIES = ['simple', 'medium', 'ambitious'] as const;
export type GeneratorComplexity = (typeof GENERATOR_COMPLEXITIES)[number];

export const GENERATOR_BUDGETS = ['none', 'small', 'medium', 'large'] as const;
export type GeneratorBudget = (typeof GENERATOR_BUDGETS)[number];

export const ORIGINALITY_LEVELS = ['safe', 'fresh', 'wild'] as const;
export type Originality = (typeof ORIGINALITY_LEVELS)[number];

export interface GeneratorInput {
  brief: string;
  category: CategorySlug | null;
  audience: Audience | null;
  complexity: GeneratorComplexity;
  platform: AppPlatform;
  monetization: BusinessModel | null;
  budget: GeneratorBudget;
  interests: string;
  originality: Originality;
}

export const defaultGeneratorInput: GeneratorInput = {
  brief: '',
  category: null,
  audience: null,
  complexity: 'medium',
  platform: 'cross-platform',
  monetization: null,
  budget: 'small',
  interests: '',
  originality: 'fresh',
};
