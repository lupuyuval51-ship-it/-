/** Push subscription storage. Every statement is scoped by user_id (or by a row id read that way). */
import type { PushSubscribeInput } from '@shared/schemas/push';
import type { Sql } from '../../db/pool';

/** Oldest devices beyond this are dropped, which bounds the fan-out per reminder. */
export const MAX_DEVICES_PER_USER = 10;

export interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function countSubscriptions(sql: Sql, userId: string): Promise<number> {
  const row = await sql.one<{ n: number }>('SELECT COUNT(*)::int AS n FROM push_subscriptions WHERE user_id = $1', [userId]);
  return Number(row.n);
}

/**
 * Stores (or refreshes) this browser's subscription for the user. Subscribing again is a no-op
 * apart from refreshed keys. An endpoint belongs to one browser, so when another account signs
 * in there and turns notifications on, the device moves to that account.
 * Returns the number of devices the user now has.
 */
export async function upsertSubscription(sql: Sql, userId: string, input: PushSubscribeInput, userAgent: string): Promise<number> {
  await sql.exec(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE
        SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
            user_agent = EXCLUDED.user_agent, failure_count = 0,
            last_success_at = CASE WHEN push_subscriptions.user_id = EXCLUDED.user_id THEN push_subscriptions.last_success_at END`,
    [userId, input.endpoint, input.keys.p256dh, input.keys.auth, userAgent.slice(0, 300)],
  );
  await sql.exec(
    `DELETE FROM push_subscriptions
      WHERE user_id = $1
        AND id NOT IN (SELECT id FROM push_subscriptions WHERE user_id = $1 ORDER BY updated_at DESC, created_at DESC LIMIT $2)`,
    [userId, MAX_DEVICES_PER_USER],
  );
  return countSubscriptions(sql, userId);
}

/** Removes the user's subscription for this endpoint. False when the user has none for it. */
export async function deleteSubscription(sql: Sql, userId: string, endpoint: string): Promise<boolean> {
  return (await sql.exec('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint])) > 0;
}

export async function deleteAllSubscriptions(sql: Sql, userId: string): Promise<void> {
  await sql.exec('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
}

/** The user's devices (optionally only the one with `endpoint`). */
export async function listSubscriptions(sql: Sql, userId: string, endpoint?: string): Promise<PushSubscriptionRow[]> {
  return sql.many<PushSubscriptionRow>(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions
      WHERE user_id = $1 AND ($2::text IS NULL OR endpoint = $2)
      ORDER BY created_at`,
    [userId, endpoint ?? null],
  );
}
