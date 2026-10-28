/** Notification inbox queries. Every statement is scoped by user_id. */
import type { NotificationDTO, NotificationListResponse } from '@shared/types';
import type { Sql } from '../../db/pool';
import { notFound } from '../../lib/errors';

interface NotificationRow {
  id: string;
  kind: NotificationDTO['kind'];
  data: Record<string, unknown> | null;
  read_at: Date | null;
  created_at: Date;
}

function toDTO(r: NotificationRow): NotificationDTO {
  return {
    id: r.id,
    kind: r.kind,
    data: r.data ?? {},
    readAt: r.read_at ? new Date(r.read_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function unreadCount(sql: Sql, userId: string): Promise<number> {
  const row = await sql.one<{ n: number }>('SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL', [userId]);
  return Number(row.n);
}

export async function listNotifications(sql: Sql, userId: string, limit: number): Promise<NotificationListResponse> {
  const rows = await sql.many<NotificationRow>(
    `SELECT id, kind, data, read_at, created_at FROM notifications
      WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
    [userId, limit],
  );
  return { notifications: rows.map(toDTO), unreadCount: await unreadCount(sql, userId) };
}

export async function markRead(sql: Sql, userId: string, id: string): Promise<void> {
  const row = await sql.maybeOne(
    `UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId],
  );
  if (!row) throw notFound('notification_not_found');
}

export async function markAllRead(sql: Sql, userId: string): Promise<void> {
  await sql.exec('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [userId]);
}

export async function deleteNotification(sql: Sql, userId: string, id: string): Promise<void> {
  const n = await sql.exec('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
  if (n === 0) throw notFound('notification_not_found');
}
