/**
 * Duplicate-submission protection. When an authenticated mutating request carries an
 * `Idempotency-Key` header, the first response (status < 500) is stored and replayed
 * for any retry with the same key; concurrent duplicates get 409 `request_in_progress`.
 * Server errors release the key so the client can safely retry. The response is recorded
 * when the handler sends it, even if the client already disconnected, so an aborted request
 * that still commits is replayed rather than run twice.
 */
import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/pool';
import { HttpError, badRequest, conflict } from '../lib/errors';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const KEY_RE = /^[A-Za-z0-9_-]{8,100}$/;

export async function idempotency(req: Request, res: Response, next: NextFunction) {
  const key = req.get('idempotency-key');
  if (!key || !req.auth || !MUTATING.has(req.method)) return next();
  if (!KEY_RE.test(key)) return next(badRequest('invalid_idempotency_key'));
  const userId = req.auth.user.id;
  const path = req.originalUrl.split('?')[0] ?? req.path;

  const inserted = await db.maybeOne(
    `INSERT INTO idempotency_keys (user_id, key, method, path) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, key) DO NOTHING RETURNING key`,
    [userId, key, req.method, path],
  );
  if (!inserted) {
    const existing = await db.maybeOne<{ method: string; path: string; status_code: number | null; response: unknown }>(
      'SELECT method, path, status_code, response FROM idempotency_keys WHERE user_id = $1 AND key = $2',
      [userId, key],
    );
    if (!existing) return next(conflict('request_in_progress'));
    if (existing.method !== req.method || existing.path !== path) {
      return next(new HttpError(422, 'idempotency_key_reused', 'Idempotency key was used for a different request'));
    }
    if (existing.status_code == null) return next(conflict('request_in_progress', 'An identical request is still being processed'));
    res.setHeader('Idempotent-Replayed', 'true');
    if (existing.response == null) return res.status(existing.status_code).end();
    return res.status(existing.status_code).json(existing.response);
  }

  let settled = false;
  const store = (status: number, body: unknown) => {
    if (settled) return;
    settled = true;
    const op =
      status >= 500 || status === 401 || status === 403 || status === 429
        ? db.exec('DELETE FROM idempotency_keys WHERE user_id = $1 AND key = $2', [userId, key])
        : db.exec('UPDATE idempotency_keys SET status_code = $3, response = $4 WHERE user_id = $1 AND key = $2', [
            userId,
            key,
            status,
            body === undefined ? null : JSON.stringify(body),
          ]);
    op.catch((err) => console.error('[idempotency] store failed', (err as Error).message));
  };
  // Record the response when the handler produces it (res.json / res.end), not when the socket
  // finishes. A client that gives up mid-request (timeout, network switch) does not stop the
  // handler, which may still commit; the key therefore stays "in progress" (retries get 409)
  // until the handler's real response is stored. A dropped connection never releases the key.
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    store(res.statusCode, body);
    return originalJson(body);
  };
  const originalEnd = res.end as (this: Response, ...args: unknown[]) => Response;
  res.end = function (this: Response, ...args: unknown[]) {
    store(res.statusCode, undefined);
    return originalEnd.apply(this, args);
  } as Response['end'];
  next();
}
