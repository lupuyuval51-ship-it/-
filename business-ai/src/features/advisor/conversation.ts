/**
 * Advisor conversation models and the pure merge of persisted messages with the in-flight
 * exchange (optimistic user message + streaming reply). No React, no network.
 */
import type { AdvisorAction } from '@domain/ai-api';
import type { AppError } from '@/lib/errors';
import { sanitizeActions, sanitizeFollowUps } from './events';

export const MESSAGE_MAX_LENGTH = 4000;
export const TITLE_MAX_LENGTH = 200;

export interface Conversation {
  id: string;
  businessId: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
  /** Content of the most recent message (raw Markdown for assistant replies), if any. */
  lastMessage: { role: 'user' | 'assistant'; content: string } | null;
}

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions: AdvisorAction[];
  followUps: string[];
  appliedActionIds: string[];
  status: 'complete' | 'error';
  createdAt: string;
}

export interface MessageRowLike {
  id: string;
  role: string;
  content: string;
  actions: unknown;
  follow_ups: unknown;
  applied_action_ids: string[] | null;
  status: string;
  created_at: string;
}

export function parseMessage(row: MessageRowLike): AdvisorMessage {
  return {
    id: row.id,
    role: row.role === 'user' ? 'user' : 'assistant',
    content: row.content ?? '',
    actions: row.role === 'user' ? [] : sanitizeActions(row.actions),
    followUps: row.role === 'user' ? [] : sanitizeFollowUps(row.follow_ups),
    appliedActionIds: Array.isArray(row.applied_action_ids) ? row.applied_action_ids.filter((x) => typeof x === 'string') : [],
    status: row.status === 'error' ? 'error' : 'complete',
    createdAt: row.created_at,
  };
}

export type PendingStatus = 'streaming' | 'done' | 'stopped' | 'error';

/** The exchange currently being sent/streamed in this screen (not yet, or not only, on the server). */
export interface PendingExchange {
  localId: string;
  text: string;
  conversationId: string | null;
  userMessageId: string | null;
  assistantMessageId: string | null;
  reply: string;
  actions: AdvisorAction[];
  followUps: string[];
  status: PendingStatus;
  error: AppError | null;
}

export type AssistantState = 'complete' | 'streaming' | 'stopped' | 'error' | 'incomplete';

export type DisplayItem =
  | { kind: 'user'; key: string; text: string; pending: boolean }
  | {
      kind: 'assistant';
      key: string;
      /** Null until the server confirmed the message (actions can be applied only then). */
      messageId: string | null;
      text: string;
      actions: AdvisorAction[];
      followUps: string[];
      appliedActionIds: string[];
      state: AssistantState;
      error: AppError | null;
      /** The user text to resend (error state). */
      retryText: string | null;
    };

function fromServer(message: AdvisorMessage): DisplayItem {
  if (message.role === 'user') return { kind: 'user', key: message.id, text: message.content, pending: false };
  return {
    kind: 'assistant',
    key: message.id,
    messageId: message.id,
    text: message.content,
    actions: message.actions,
    followUps: message.followUps,
    appliedActionIds: message.appliedActionIds,
    state: message.status === 'error' ? 'incomplete' : 'complete',
    error: null,
    retryText: null,
  };
}

/**
 * Persisted messages + the in-flight exchange, without duplicates:
 * - while streaming / after an error or stop, the server's copy of this exchange (the user
 *   message and anything after it) is replaced by the local one;
 * - once the server has the finished reply (done) or a stopped reply was persisted, the server
 *   copy wins and the local exchange is ignored.
 */
export function mergeMessages(server: readonly AdvisorMessage[], pending: PendingExchange | null): DisplayItem[] {
  if (!pending) return server.map(fromServer);

  const userIndex = pending.userMessageId ? server.findIndex((m) => m.id === pending.userMessageId) : -1;
  if (pending.status === 'done' && pending.assistantMessageId && server.some((m) => m.id === pending.assistantMessageId)) {
    return server.map(fromServer);
  }
  if (pending.status === 'stopped' && userIndex !== -1 && server.slice(userIndex + 1).some((m) => m.role === 'assistant')) {
    return server.map(fromServer);
  }

  const before = (userIndex === -1 ? server : server.slice(0, userIndex)).filter((m) => m.id !== pending.assistantMessageId);
  const items = before.map(fromServer);
  items.push({ kind: 'user', key: `${pending.localId}:user`, text: pending.text, pending: pending.status === 'streaming' && !pending.userMessageId });
  items.push({
    kind: 'assistant',
    key: `${pending.localId}:assistant`,
    messageId: pending.status === 'done' ? pending.assistantMessageId || null : null,
    text: pending.reply,
    actions: pending.actions,
    followUps: pending.followUps,
    appliedActionIds: [],
    state: pending.status === 'done' ? 'complete' : pending.status,
    error: pending.error,
    retryText: pending.status === 'error' ? pending.text : null,
  });
  return items;
}

/** Index of the last assistant item that may show follow-up suggestions (complete, last in list). */
export function followUpTargetIndex(items: readonly DisplayItem[]): number {
  const last = items.length - 1;
  const item = items[last];
  return item && item.kind === 'assistant' && item.state === 'complete' && item.followUps.length > 0 ? last : -1;
}
