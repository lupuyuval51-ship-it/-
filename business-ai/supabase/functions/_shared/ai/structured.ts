/**
 * Structured-output helper, generic over a zod schema: derives the strict JSON Schema, calls the
 * provider, parses the JSON and re-validates it with the domain zod schema. Any mismatch is
 * `ai_invalid_output` (with the consumed usage attached so it is still billed to the reservation).
 */
import type { z } from 'zod';
import { AiCallError } from './errors.ts';
import { toStrictJsonSchema } from './json-schema.ts';
import type { UsageTotals } from './pricing.ts';
import type { AiProvider, ChatMessage, Effort, SystemPrompt } from './provider.ts';

export interface StructuredRequest<S extends z.ZodType> {
  system: SystemPrompt;
  /** Single user turn (business data + task), or a full message list. */
  user: string | ChatMessage[];
  schema: S;
  effort: Effort;
  maxTokens: number;
  signal?: AbortSignal;
}

export interface StructuredResult<T> {
  data: T;
  usage: UsageTotals;
  model: string;
}

/** Parses model text as JSON, tolerating a ```json fence (the model should not add one). */
export function parseJsonText(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return JSON.parse(fenced?.[1] ?? trimmed) as unknown;
}

export function validateStructured<S extends z.ZodType>(
  schema: S,
  text: string,
  usage: UsageTotals | null,
): z.infer<S> {
  let raw: unknown;
  try {
    raw = parseJsonText(text);
  } catch (err) {
    throw new AiCallError('ai_invalid_output', undefined, { usage, cause: err, details: { op: 'structured:json' } });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new AiCallError('ai_invalid_output', undefined, {
      usage,
      cause: new Error(`schema validation failed: ${issues}`),
      details: { op: 'structured:schema' },
    });
  }
  return parsed.data as z.infer<S>;
}

export async function generateStructured<S extends z.ZodType>(
  provider: AiProvider,
  req: StructuredRequest<S>,
): Promise<StructuredResult<z.infer<S>>> {
  const messages: ChatMessage[] = typeof req.user === 'string' ? [{ role: 'user', content: req.user }] : req.user;
  const result = await provider.complete({
    system: req.system,
    messages,
    jsonSchema: toStrictJsonSchema(req.schema),
    effort: req.effort,
    maxTokens: req.maxTokens,
    signal: req.signal,
  });
  const data = validateStructured(req.schema, result.text, result.usage);
  return { data, usage: result.usage, model: result.model };
}
