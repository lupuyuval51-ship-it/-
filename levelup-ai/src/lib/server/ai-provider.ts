import { z } from 'zod';
import { ApiError } from './auth';

export type StructuredAIRequest = { name: string; instructions: string; input: unknown; schema: Record<string, unknown>; maxOutputTokens: number; timeoutMs?: number };
export interface StructuredAIProvider { generate(request: StructuredAIRequest): Promise<unknown>; }

export function redactAIText(value: string) {
  return value.replace(/\bsk-[a-zA-Z0-9_-]{8,}\b/g, '[secret]').replace(/\bBearer\s+[a-zA-Z0-9._-]+/gi, '[secret]').replace(/(?:password|סיסמה)\s*[:=]\s*\S+/gi, '[secret]').replace(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '[email]').replace(/(?<!\d)(?:\+?\d[\s().-]*){8,}(?!\d)/g, '[phone]');
}

/** The only external AI transport. It cannot execute code or perform application actions. */
export class OpenAIJsonProvider implements StructuredAIProvider {
  async generate(request: StructuredAIRequest): Promise<unknown> {
    if (!process.env.AI_API_KEY || !process.env.AI_MODEL) throw new ApiError(503, 'יש להגדיר מודל ומפתח AI. / Configure an AI model and API key.', 'AI_UNAVAILABLE');
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: AbortSignal.timeout(request.timeoutMs || 25000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ model: process.env.AI_MODEL, store: false, instructions: request.instructions, input: JSON.stringify(request.input), max_output_tokens: request.maxOutputTokens, text: { format: { type: 'json_schema', name: request.name, strict: true, schema: request.schema } } }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const payload = await response.json();
    const output = payload.output?.flatMap((item: { content?: { type: string; text?: string }[] }) => item.content || []).filter((item: { type: string }) => item.type === 'output_text').map((item: { text?: string }) => item.text || '').join('');
    if (!output) throw new Error('AI returned no structured content');
    return JSON.parse(output);
  }
}

/** Retry both transport failures and invalid JSON once; never persist unvalidated output. */
export async function validatedAI<T>(provider: StructuredAIProvider, schema: z.ZodType<T>, request: Omit<StructuredAIRequest, 'schema'>, validate?: (output: T) => void): Promise<T> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const output = await provider.generate({ ...request, schema: jsonSchema, instructions: request.instructions + (attempt ? '\nThe preceding response could not be validated. Generate a fresh complete response that strictly follows the schema.' : '') });
      const parsed = schema.parse(output);
      validate?.(parsed);
      return parsed;
    } catch { /* No request content, secrets, or model output is logged. */ }
  }
  throw new ApiError(503, 'לא התקבלה תשובת AI תקינה. לא נשמר שינוי; אפשר לנסות שוב. / AI did not return a valid response. No change was saved; please retry.', 'AI_GENERATION_UNAVAILABLE');
}
