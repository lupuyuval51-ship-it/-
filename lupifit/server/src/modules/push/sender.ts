/**
 * Delivers a notification to a user's devices through their browsers' push services
 * (`web-push`, VAPID, aes128gcm). Subscriptions the push service reports as gone (404/410)
 * are removed; other failures are counted, and a device that has kept failing for a week
 * is dropped. Logs show the push-service host and row id only, never the endpoint or keys.
 */
import webpush from 'web-push';
import type { PushPayload, PushTestResponse } from '@shared/types';
import type { Sql } from '../../db/pool';
import type { PushSubscriptionRow } from './repository';
import { endpointHost, vapidDetails } from './vapid';

const SEND_TIMEOUT_MS = 10_000;
/** Consecutive failures after which a device that has not worked for a week is dropped. */
const MAX_FAILURES = 20;

export interface SendOptions {
  /** How long the push service keeps the message for an offline device (seconds). */
  ttlSeconds: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  /** Replaces an undelivered message with the same topic at the push service. */
  topic?: string;
}

function statusOf(err: unknown): number | null {
  const status = typeof err === 'object' && err !== null && 'statusCode' in err ? (err as { statusCode: unknown }).statusCode : null;
  return typeof status === 'number' ? status : null;
}

export async function sendToSubscriptions(sql: Sql, subscriptions: PushSubscriptionRow[], payload: PushPayload, opts: SendOptions): Promise<PushTestResponse> {
  const summary: PushTestResponse = { sent: 0, failed: 0, removed: 0 };
  const vapid = vapidDetails();
  if (!vapid) {
    summary.failed = subscriptions.length;
    return summary;
  }
  const body = JSON.stringify(payload);
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body, {
        vapidDetails: vapid,
        TTL: opts.ttlSeconds,
        urgency: opts.urgency ?? 'normal',
        ...(opts.topic ? { topic: opts.topic } : {}),
        contentEncoding: 'aes128gcm',
        timeout: SEND_TIMEOUT_MS,
      });
      summary.sent += 1;
      await sql.exec('UPDATE push_subscriptions SET last_success_at = now(), failure_count = 0 WHERE id = $1', [sub.id]);
    } catch (err) {
      const status = statusOf(err);
      if (status === 404 || status === 410) {
        summary.removed += 1;
        await sql.exec('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        continue;
      }
      summary.failed += 1;
      console.warn(`[push] delivery failed (${status ?? 'no response'}) via ${endpointHost(sub.endpoint)}, subscription ${sub.id}`);
      const row = await sql.maybeOne<{ stale: boolean }>(
        `UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE id = $1
         RETURNING (failure_count >= $2 AND COALESCE(last_success_at, created_at) < now() - interval '7 days') AS stale`,
        [sub.id, MAX_FAILURES],
      );
      if (row?.stale) await sql.exec('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
    }
  }
  return summary;
}
