/**
 * Decodes SSE frames from the advisor function into typed `AdvisorEvent`s. Pure.
 * Anything malformed or unknown (heartbeat events, future event types) is dropped rather than
 * breaking the stream; invalid actions are dropped individually so one bad proposal never hides
 * the others.
 */
import { AI_ERROR_CODES, AdvisorActionSchema, type AdvisorAction, type AdvisorEvent, type AiErrorCode } from '@domain/ai-api';
import type { SseFrame } from './sseParser';

const AI_CODES: ReadonlySet<string> = new Set(AI_ERROR_CODES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates an `actions` array from the server or the database, dropping invalid items. */
export function sanitizeActions(value: unknown): AdvisorAction[] {
  if (!Array.isArray(value)) return [];
  const out: AdvisorAction[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const parsed = AdvisorActionSchema.safeParse(item);
    if (parsed.success && !seen.has(parsed.data.id)) {
      seen.add(parsed.data.id);
      out.push(parsed.data);
    }
  }
  return out;
}

/** Validates follow-up suggestions: non-empty trimmed strings, deduplicated, at most 6. */
export function sanitizeFollowUps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const text = item.trim().slice(0, 4000);
    if (text && !out.includes(text)) out.push(text);
    if (out.length >= 6) break;
  }
  return out;
}

export function parseAdvisorFrame(frame: SseFrame): AdvisorEvent | null {
  let payload: unknown;
  try {
    payload = JSON.parse(frame.data);
  } catch {
    return null;
  }
  if (!isRecord(payload)) return null;

  switch (frame.event) {
    case 'meta': {
      const { conversationId, userMessageId } = payload;
      if (typeof conversationId !== 'string' || conversationId === '') return null;
      return {
        event: 'meta',
        data: { conversationId, userMessageId: typeof userMessageId === 'string' ? userMessageId : '' },
      };
    }
    case 'delta': {
      const { text } = payload;
      if (typeof text !== 'string') return null;
      return { event: 'delta', data: { text } };
    }
    case 'actions':
      return {
        event: 'actions',
        data: { actions: sanitizeActions(payload.actions), followUps: sanitizeFollowUps(payload.followUps) },
      };
    case 'done': {
      const { assistantMessageId } = payload;
      return { event: 'done', data: { assistantMessageId: typeof assistantMessageId === 'string' ? assistantMessageId : '' } };
    }
    case 'error': {
      const code = typeof payload.code === 'string' && AI_CODES.has(payload.code) ? (payload.code as AiErrorCode) : 'internal';
      const message = typeof payload.message === 'string' ? payload.message : code;
      return { event: 'error', data: { code, message } };
    }
    default:
      return null;
  }
}
