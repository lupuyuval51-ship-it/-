/** Coach threads & messages persistence. Every query is scoped by user_id. */
import type { CoachSource } from '@shared/constants';
import { addDays, todayInTimeZone } from '@shared/dates';
import type { CoachMessageDTO, CoachMessagesResponse, CoachStatusDTO, CoachThreadDTO } from '@shared/types';
import { isLlmConfigured, llmModel } from '../../ai/llm';
import { config } from '../../config';
import type { Sql } from '../../db/pool';
import { notFound } from '../../lib/errors';
import type { HistoryMessage } from './prompt';

/** Longest auto-title derived from the first message of a conversation. */
export const AUTO_TITLE_MAX = 60;
/** DB limit for a stored message. */
const MESSAGE_MAX_CHARS = 20_000;

interface ThreadRow {
  id: string;
  title: string;
  created_at: Date;
  /** Time of the last message (renaming a thread does not change it). */
  last_activity_at: Date;
  message_count: number;
}

interface MessageRow {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  source: CoachSource | null;
  status: CoachMessageDTO['status'];
  safety_category: CoachMessageDTO['safety'];
  created_at: Date;
}

const iso = (d: Date) => new Date(d).toISOString();

function toThreadDTO(r: ThreadRow): CoachThreadDTO {
  return { id: r.id, title: r.title, createdAt: iso(r.created_at), updatedAt: iso(r.last_activity_at), messageCount: r.message_count };
}

function toMessageDTO(r: MessageRow): CoachMessageDTO {
  return {
    id: r.id,
    threadId: r.thread_id,
    role: r.role,
    content: r.content,
    source: r.source,
    status: r.status,
    safety: r.safety_category,
    createdAt: iso(r.created_at),
  };
}

/** Thread columns + message count; callers append the (parameterized) condition. */
const THREAD_SELECT_WHERE = `SELECT t.id, t.title, t.created_at, t.last_activity_at,
         (SELECT count(*) FROM coach_messages m WHERE m.thread_id = t.id AND m.user_id = t.user_id)::int AS message_count
    FROM coach_threads t
   WHERE `;
const MESSAGE_COLUMNS = 'id, thread_id, role, content, source, status, safety_category, created_at';

export async function listThreads(sql: Sql, userId: string): Promise<CoachThreadDTO[]> {
  const rows = await sql.many<ThreadRow>(`${THREAD_SELECT_WHERE}t.user_id = $1 ORDER BY t.last_activity_at DESC, t.created_at DESC LIMIT 200`, [userId]);
  return rows.map(toThreadDTO);
}

export async function getThread(sql: Sql, userId: string, threadId: string): Promise<CoachThreadDTO | null> {
  const row = await sql.maybeOne<ThreadRow>(`${THREAD_SELECT_WHERE}t.id = $1 AND t.user_id = $2`, [threadId, userId]);
  return row ? toThreadDTO(row) : null;
}

export async function requireThread(sql: Sql, userId: string, threadId: string): Promise<CoachThreadDTO> {
  const thread = await getThread(sql, userId, threadId);
  if (!thread) throw notFound('thread_not_found', 'Conversation not found');
  return thread;
}

export async function createThread(sql: Sql, userId: string, title: string): Promise<CoachThreadDTO> {
  const row = await sql.one<ThreadRow>(
    `INSERT INTO coach_threads (user_id, title) VALUES ($1, $2)
     RETURNING id, title, created_at, last_activity_at, 0 AS message_count`,
    [userId, title],
  );
  return toThreadDTO(row);
}

export async function renameThread(sql: Sql, userId: string, threadId: string, title: string): Promise<CoachThreadDTO> {
  const updated = await sql.exec('UPDATE coach_threads SET title = $3 WHERE id = $1 AND user_id = $2', [threadId, userId, title]);
  if (!updated) throw notFound('thread_not_found', 'Conversation not found');
  return requireThread(sql, userId, threadId);
}

export async function deleteThread(sql: Sql, userId: string, threadId: string): Promise<void> {
  const deleted = await sql.exec('DELETE FROM coach_threads WHERE id = $1 AND user_id = $2', [threadId, userId]);
  if (!deleted) throw notFound('thread_not_found', 'Conversation not found');
}

/** A page of messages (chronological), newest page first; `before` pages backwards. */
export async function listMessages(sql: Sql, userId: string, threadId: string, opts: { before?: string; limit: number }): Promise<CoachMessagesResponse> {
  await requireThread(sql, userId, threadId);
  if (opts.before) {
    const cursor = await sql.maybeOne('SELECT 1 FROM coach_messages WHERE id = $1 AND thread_id = $2 AND user_id = $3', [opts.before, threadId, userId]);
    if (!cursor) throw notFound('message_not_found', 'Message not found');
  }
  // The cursor comparison stays in SQL so timestamps keep their full (microsecond) precision.
  const rows = await sql.many<MessageRow>(
    `SELECT ${MESSAGE_COLUMNS} FROM coach_messages m
      WHERE m.thread_id = $1 AND m.user_id = $2
        AND ($3::uuid IS NULL OR (m.created_at, m.id) < (SELECT c.created_at, c.id FROM coach_messages c WHERE c.id = $3 AND c.user_id = $2))
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT $4`,
    [threadId, userId, opts.before ?? null, opts.limit + 1],
  );
  const hasMore = rows.length > opts.limit;
  return { messages: rows.slice(0, opts.limit).reverse().map(toMessageDTO), hasMore };
}

/** The last `limit` messages of a thread for the model (chronological). */
export async function recentHistory(sql: Sql, userId: string, threadId: string, limit: number): Promise<HistoryMessage[]> {
  const rows = await sql.many<{ role: 'user' | 'assistant'; content: string; status: CoachMessageDTO['status'] }>(
    `SELECT role, content, status FROM (
        SELECT role, content, status, created_at, id FROM coach_messages
         WHERE thread_id = $1 AND user_id = $2
         ORDER BY created_at DESC, id DESC LIMIT $3
      ) recent ORDER BY created_at, id`,
    [threadId, userId, limit],
  );
  return rows;
}

export interface NewMessage {
  userId: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  source: CoachSource | null;
  status: CoachMessageDTO['status'];
  safety?: CoachMessageDTO['safety'];
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
}

export async function insertMessage(sql: Sql, m: NewMessage): Promise<CoachMessageDTO> {
  // clock_timestamp(): distinct, ordered timestamps even for several inserts in one transaction.
  const row = await sql.one<MessageRow>(
    `INSERT INTO coach_messages (thread_id, user_id, role, content, source, status, model, input_tokens, output_tokens, safety_category, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, clock_timestamp())
     RETURNING ${MESSAGE_COLUMNS}`,
    [m.threadId, m.userId, m.role, m.content.slice(0, MESSAGE_MAX_CHARS), m.source, m.status, m.model ?? null, m.inputTokens ?? null, m.outputTokens ?? null, m.safety ?? null],
  );
  return toMessageDTO(row);
}

/** Conversation title from its first message: one line, at most AUTO_TITLE_MAX characters. */
export function titleFromMessage(content: string): string {
  const oneLine = content.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= AUTO_TITLE_MAX) return oneLine;
  const cut = oneLine.slice(0, AUTO_TITLE_MAX - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace >= AUTO_TITLE_MAX / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function tzOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant a calendar day starts (00:00 local time) in an IANA time zone. */
export function startOfDayInTimeZone(date: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d);
  let tz = timeZone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    tz = 'UTC';
  }
  const first = guess - tzOffsetMs(guess, tz);
  return new Date(guess - tzOffsetMs(first, tz));
}

/** Records one coach message against the user's daily quota (and prunes old ledger rows). */
export async function recordUsage(sql: Sql, userId: string): Promise<void> {
  await sql.exec(`DELETE FROM coach_usage WHERE user_id = $1 AND created_at < now() - interval '3 days'`, [userId]);
  await sql.exec('INSERT INTO coach_usage (user_id) VALUES ($1)', [userId]);
}

/** Messages the user sent since the start of today in their time zone, and when that resets. */
export async function usageToday(sql: Sql, userId: string, now = new Date()): Promise<{ used: number; resetsAt: Date }> {
  const user = await sql.one<{ timezone: string }>('SELECT timezone FROM users WHERE id = $1', [userId]);
  const today = todayInTimeZone(user.timezone, now);
  const dayStart = startOfDayInTimeZone(today, user.timezone);
  // The usage ledger (not coach_messages) so deleting a conversation does not reset the quota.
  const row = await sql.one<{ used: number }>('SELECT count(*)::int AS used FROM coach_usage WHERE user_id = $1 AND created_at >= $2', [userId, dayStart]);
  return { used: row.used, resetsAt: startOfDayInTimeZone(addDays(today, 1), user.timezone) };
}

export async function coachStatus(sql: Sql, userId: string): Promise<CoachStatusDTO> {
  const { used, resetsAt } = await usageToday(sql, userId);
  const dailyLimit = config.ai.coachDailyLimit;
  return {
    llmConfigured: isLlmConfigured(),
    provider: isLlmConfigured() ? (config.ai.provider === 'gemini' ? 'gemini' : 'anthropic') : null,
    model: llmModel(),
    dailyLimit,
    usedToday: used,
    remainingToday: Math.max(0, dailyLimit - used),
    resetsAt: resetsAt.toISOString(),
  };
}
