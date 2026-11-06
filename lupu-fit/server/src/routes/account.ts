import { AccountDeleteBodySchema, BackupPayloadSchema, type BackupPayload } from '@lupu-fit/shared';
import { clearedCookie } from '../core/app.ts';
import { ApiError } from '../core/errors.ts';
import { BoundedRateLimiter, ident } from '../core/rateLimit.ts';
import type { Router } from '../core/router.ts';
import type { Ctx, Deps } from '../core/types.ts';
import { buildBackup, restoreBackup } from '../services/backup.ts';
import { uid } from './util.ts';

export { groupBy, RESTORED_NAME } from '../services/backup.ts';
export const RESTORE_LIMIT = { hosted: 8 * 1024 * 1024, device: 200 * 1024 * 1024 } as const;
/** Restores running at once in this process; each one also holds a per-user advisory lock, so one person cannot run two in parallel. */
export const MAX_PARALLEL_RESTORES = 2;
/** Exports per account per minute: a full export reads every row the account has. */
export const EXPORT_PER_MIN = 3;
/** Restores per account per minute: a restore replaces and rewrites the whole history. */
export const RESTORE_PER_MIN = 6;

export function accountRoutes(r: Router, d: Deps): void {
  const exportLimiter = new BoundedRateLimiter(EXPORT_PER_MIN);
  r.get('/api/export', async (ctx) => {
    const u = uid(ctx);
    if (!exportLimiter.hit(u, ctx.now.getTime())) throw new ApiError(429, 'rate_limited', undefined, { 'retry-after': '60' });
    // JSON round trip first: the file must be exactly what the person gets back from disk (dates as text), and what restore will read.
    const backup = JSON.parse(JSON.stringify(await buildBackup(ctx.db, u, { now: ctx.now, mode: d.mode, appVersion: d.appVersion ?? 'unknown' }))) as BackupPayload;
    // The file must restore: a backup that the restore schema refuses is useless exactly when it is needed. If stored data ever drifts
    // from the write limits again, fail loudly here (and name where) instead of handing over a file that cannot be restored.
    const check = BackupPayloadSchema.safeParse(backup);
    if (!check.success) {
      console.error('[export] backup would not restore', check.error.issues.slice(0, 5).map((i) => i.path.join('.')));
      throw new ApiError(500, 'internal_error', { reason: 'export_unrestorable', issues: check.error.issues.slice(0, 20).map((i) => ({ path: i.path.join('.'), message: i.message })) });
    }
    // Only the account note stays outside the backup: it says whose file this is, and is never restored (Device Mode has no account).
    const account = (await ctx.db.query<{ username: string; created_at: string }>('SELECT username, created_at FROM users WHERE id = $1', [u]))[0];
    const extra = { account: account && d.mode !== 'device' ? { username: account.username, createdAt: account.created_at } : null };
    return { json: { backup, extra }, headers: { 'content-disposition': 'attachment; filename="lupu-fit-export.json"' } };
  });

  // Mode-dependent payload cap: 200 MB only inside the user's own device worker, 8 MB when hosted.
  const restoreLimiter = new BoundedRateLimiter(RESTORE_PER_MIN);
  let restoresRunning = 0;
  r.post('/api/device/restore', async (ctx: Ctx) => {
    const u = uid(ctx);
    if (!restoreLimiter.hit(u, ctx.now.getTime())) throw new ApiError(429, 'rate_limited', undefined, { 'retry-after': '60' });
    if (restoresRunning >= MAX_PARALLEL_RESTORES) throw new ApiError(503, 'rate_limited', { reason: 'busy' }, { 'retry-after': '5' });
    restoresRunning++;
    try {
      const summary = await restoreBackup(ctx.db, u, ctx.body as BackupPayload, ctx.now);
      await ctx.db.flush?.(); // the file is the only copy the person has: the answer means the restored data is on disk
      return { json: summary };
    } finally { restoresRunning--; }
  }, { body: BackupPayloadSchema, maxBodyBytes: d.mode === 'device' ? RESTORE_LIMIT.device : RESTORE_LIMIT.hosted, idempotent: false });

  r.delete('/api/account', async (ctx) => {
    void (ctx.body as { confirm: 'DELETE' });
    const username = (ctx.user as NonNullable<Ctx['user']>).username;
    const del = await ctx.db.query('DELETE FROM users WHERE id = $1 RETURNING id', [uid(ctx)]); // everything else cascades
    if (del.length === 0) throw new ApiError(404, 'not_found');
    // The only table keyed by the person rather than by user_id: login / registration counters hold a hash of the username.
    await ctx.db.query('DELETE FROM auth_attempts WHERE identifier = $1', [(await ident('username', username)).id]);
    return { json: { ok: true }, setCookies: [clearedCookie(d)] };
  }, { body: AccountDeleteBodySchema });

  r.get('/api/notifications', async (ctx) => {
    const rows = await ctx.db.query<{ id: string; kind: string; payload: unknown; read_at: string | null; created_at: string }>('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [uid(ctx)]);
    return { json: { notifications: rows.map((n) => ({ id: n.id, kind: n.kind, payload: n.payload, read: !!n.read_at, createdAt: n.created_at })) } };
  });
  r.post('/api/notifications/read', async (ctx) => {
    await ctx.db.query('UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL', [ctx.now.toISOString(), uid(ctx)]);
    return { json: { ok: true } };
  });
}
