import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { ApiError } from './auth';

export type StructuredAIRequest = {
  name: string;
  instructions: string;
  input: unknown;
  /** JSON Schema form, kept so a test double can inspect the contract without Zod. */
  schema: Record<string, unknown>;
  /** The same contract as Zod, which is what the Claude structured-output helper takes. */
  outputSchema?: z.ZodType;
  maxOutputTokens: number;
  timeoutMs?: number;
};
export interface StructuredAIProvider { generate(request: StructuredAIRequest): Promise<unknown>; }

export function redactAIText(value: string) {
  return value.replace(/\bsk-[a-zA-Z0-9_-]{8,}\b/g, '[secret]').replace(/\bBearer\s+[a-zA-Z0-9._-]+/gi, '[secret]').replace(/(?:password|סיסמה)\s*[:=]\s*\S+/gi, '[secret]').replace(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '[email]').replace(/(?<!\d)(?:\+?\d[\s().-]*){8,}(?!\d)/g, '[phone]');
}

export const DEFAULT_AI_MODEL = 'claude-opus-5';
const efforts = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export function aiKey(environment: NodeJS.ProcessEnv = process.env) { return environment.ANTHROPIC_API_KEY?.trim() || environment.AI_API_KEY?.trim() || ''; }
/** A key alone is not enough: a foreign AI_PROVIDER must fail loudly, never silently fall back to Demo. */
export function aiEnabled(environment: NodeJS.ProcessEnv = process.env) { return !!aiKey(environment) && ['', 'anthropic', 'claude'].includes((environment.AI_PROVIDER || '').trim().toLowerCase()); }
export function aiEffort(environment: NodeJS.ProcessEnv = process.env) { const value = environment.AI_EFFORT?.trim(); return (efforts as readonly string[]).includes(value || '') ? (value as (typeof efforts)[number]) : undefined; }
/**
 * Reasoning shares the response budget, so every call needs headroom above the content it asks for.
 * The ceiling is deliberate: the SDK sizes a non-streaming request's timeout as
 * 60min x max_tokens / 128000, so a large budget outruns any sane request timeout. We stream
 * instead of guessing, and still keep the budget bounded so worst-case latency stays finite.
 */
export const responseBudget = (contentTokens: number) => Math.min(32000, Math.max(8000, Math.round(contentTokens * 2.5)));

/** The only external AI transport. It cannot execute code or perform application actions. */
export class ClaudeJsonProvider implements StructuredAIProvider {
  async generate(request: StructuredAIRequest): Promise<unknown> {
    const apiKey = aiKey();
    if (!apiKey || !request.outputSchema) throw new ApiError(503, 'יש להגדיר מפתח Claude API. / Configure a Claude API key.', 'AI_UNAVAILABLE');
    const effort = aiEffort();
    // maxRetries 0: validatedAI owns the retry policy so a single request can never be billed twice.
    const client = new Anthropic({ apiKey, timeout: request.timeoutMs || 60000, maxRetries: 0 });
    // Streamed: a reasoning model answering at this budget can outlast a non-streaming request,
    // and the stream keeps the connection alive. finalMessage() carries the same parsed_output
    // contract as messages.parse(), so the structured-output guarantee is unchanged.
    const message = await client.messages.stream({
      model: process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL,
      max_tokens: responseBudget(request.maxOutputTokens),
      system: request.instructions,
      messages: [{ role: 'user', content: JSON.stringify(request.input) }],
      thinking: { type: 'adaptive' },
      output_config: { format: zodOutputFormat(request.outputSchema), ...(effort ? { effort } : {}) },
    }).finalMessage();
    if (message.stop_reason === 'refusal') throw new Error('AI declined to answer this request');
    if (!message.parsed_output) throw new Error('AI returned no structured content');
    return message.parsed_output;
  }
}

/** Retry both transport failures and invalid JSON once; never persist unvalidated output. */
export async function validatedAI<T>(provider: StructuredAIProvider, schema: z.ZodType<T>, request: Omit<StructuredAIRequest, 'schema' | 'outputSchema'>, validate?: (output: T) => void): Promise<T> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const output = await provider.generate({ ...request, schema: jsonSchema, outputSchema: schema, instructions: request.instructions + (attempt ? '\nThe preceding response could not be validated. Generate a fresh complete response that strictly follows the schema.' : '') });
      const parsed = schema.parse(output);
      validate?.(parsed);
      return parsed;
    } catch { /* No request content, secrets, or model output is logged. */ }
  }
  throw new ApiError(503, 'לא התקבלה תשובת AI תקינה. לא נשמר שינוי; אפשר לנסות שוב. / AI did not return a valid response. No change was saved; please retry.', 'AI_GENERATION_UNAVAILABLE');
}
