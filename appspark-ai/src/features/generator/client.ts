import { CATEGORY_SLUGS, type Idea, type Locale, type PromptOptions } from '@/data/types';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

import type { GeneratorInput } from './types';

export type AiMode = 'live' | 'demo';

export interface AiHealth {
  enabled: boolean;
  provider?: string;
  model?: string;
}

export class AiError extends Error {
  constructor(
    message: string,
    public readonly code: 'unauthenticated' | 'quota' | 'network' | 'invalid' | 'disabled' | 'unknown',
  ) {
    super(message);
    this.name = 'AiError';
  }
}

let healthCache: { value: AiHealth; at: number } | null = null;

/** Asks the Edge Function whether an AI provider is configured. Cached for five minutes. */
export async function checkAiHealth(force = false): Promise<AiHealth> {
  if (!supabase) return { enabled: false };
  if (!force && healthCache && Date.now() - healthCache.at < 5 * 60_000) return healthCache.value;
  try {
    const { data, error } = await supabase.functions.invoke<AiHealth>(env.aiFunctionName, { body: { kind: 'health' } });
    if (error || !data) {
      healthCache = { value: { enabled: false }, at: Date.now() };
      return healthCache.value;
    }
    healthCache = { value: { enabled: Boolean(data.enabled), provider: data.provider, model: data.model }, at: Date.now() };
    return healthCache.value;
  } catch {
    return { enabled: false };
  }
}

function mapError(error: unknown): AiError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('jwt')) return new AiError(message, 'unauthenticated');
  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate')) return new AiError(message, 'quota');
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to send')) return new AiError(message, 'network');
  if (lower.includes('disabled') || lower.includes('not configured')) return new AiError(message, 'disabled');
  return new AiError(message, 'unknown');
}

function isLocalized(value: unknown): value is { he: string; en: string } {
  return !!value && typeof value === 'object' && typeof (value as { he?: unknown }).he === 'string' && typeof (value as { en?: unknown }).en === 'string';
}

function isLocalizedList(value: unknown): boolean {
  return !!value && typeof value === 'object' && Array.isArray((value as { he?: unknown }).he) && Array.isArray((value as { en?: unknown }).en);
}

/** Defensive shape check for ideas returned by the model. */
export function isIdeaShape(value: unknown): value is Idea {
  if (!value || typeof value !== 'object') return false;
  const idea = value as Partial<Idea>;
  if (typeof idea.id !== 'string' || !isLocalized(idea.name) || !isLocalized(idea.tagline)) return false;
  if (!idea.category || !(CATEGORY_SLUGS as readonly string[]).includes(idea.category)) return false;
  if (!idea.spec || typeof idea.spec !== 'object') return false;
  const spec = idea.spec;
  return (
    isLocalized(spec.overview) &&
    isLocalized(spec.problem) &&
    isLocalized(spec.solution) &&
    isLocalized(spec.usp) &&
    isLocalizedList(spec.targetUsers) &&
    isLocalizedList(spec.coreFeatures) &&
    Array.isArray(spec.screens) &&
    isLocalizedList(spec.userJourney) &&
    isLocalized(spec.uxDirection) &&
    isLocalized(spec.architecture) &&
    Array.isArray(spec.stack) &&
    isLocalizedList(spec.database) &&
    isLocalized(spec.auth) &&
    isLocalizedList(spec.monetization) &&
    isLocalizedList(spec.mvpMilestones) &&
    isLocalizedList(spec.risks) &&
    isLocalizedList(spec.expansion)
  );
}

export interface LiveGenerationResult {
  ideas: Idea[];
  provider: string;
  model: string;
}

/** Calls the server-side Edge Function. Never talks to an AI provider directly. */
export async function generateIdeasLive(input: GeneratorInput, locale: Locale): Promise<LiveGenerationResult> {
  if (!supabase) throw new AiError('Supabase not configured', 'disabled');
  try {
    const { data, error } = await supabase.functions.invoke<{ ideas: unknown[]; provider: string; model: string; error?: string }>(env.aiFunctionName, {
      body: { kind: 'ideas', locale, input },
    });
    if (error) throw error;
    if (!data || data.error) throw new AiError(data?.error ?? 'empty response', 'unknown');
    const ideas = (data.ideas ?? []).filter(isIdeaShape);
    if (!ideas.length) throw new AiError('The model returned no valid ideas', 'invalid');
    return { ideas, provider: data.provider, model: data.model };
  } catch (error) {
    throw error instanceof AiError ? error : mapError(error);
  }
}

export async function enhancePromptLive(content: string, ideaName: string, options: PromptOptions): Promise<string> {
  if (!supabase) throw new AiError('Supabase not configured', 'disabled');
  try {
    const { data, error } = await supabase.functions.invoke<{ content: string; error?: string }>(env.aiFunctionName, {
      body: { kind: 'enhance-prompt', content, ideaName, options, locale: options.language },
    });
    if (error) throw error;
    if (!data?.content) throw new AiError(data?.error ?? 'empty response', 'unknown');
    return data.content;
  } catch (error) {
    throw error instanceof AiError ? error : mapError(error);
  }
}
