import { z } from 'zod';
import { validateMp4 } from '../media/mp4Validator.ts';
import { sha256Hex } from '../crypto/portableCrypto.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { EXERCISES } from '@lupu-fit/shared/content';

const IDS = new Set(EXERCISES.map((e) => e.id));
const b64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const AttachBody = z.object({ mp4Base64: z.string().min(100).max(6_000_000), posterUrl: z.string().max(300).optional(), url: z.string().max(300), credit: z.string().max(200).optional(), priority: z.enum(['A', 'B', 'C', 'D']).optional() });

export function mediaRoutes(r: Router, _d: Deps): void {
  /** Only exercises with a VALIDATED and REVIEWED media record report hasMedia = true. */
  r.get('/api/exercises/media', async (ctx) => {
    const rows = await ctx.db.query<{ exercise_id: string; url: string; poster_url: string | null; reviewed_at: string | null }>('SELECT exercise_id, url, poster_url, reviewed_at FROM exercise_media WHERE reviewed_at IS NOT NULL');
    return { json: { media: rows.map((m) => ({ exerciseId: m.exercise_id, url: m.url, posterUrl: m.poster_url })) } };
  });

  r.post('/api/admin/exercises/:id/media', async (ctx) => {
    if (ctx.user?.role !== 'admin') throw new ApiError(404, 'not_found');
    const id = ctx.params['id'] as string;
    if (!IDS.has(id)) throw new ApiError(404, 'not_found');
    const b = ctx.body as z.infer<typeof AttachBody>;
    const bytes = b64(b.mp4Base64);
    const rep = validateMp4(bytes);
    if (!rep.ok) throw new ApiError(422, 'invalid_media', { errors: rep.errors });
    await ctx.db.query(`INSERT INTO exercise_media (exercise_id, url, poster_url, duration_sec, width, height, size_bytes, sha256, credit, priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (exercise_id) DO UPDATE SET url=$2, poster_url=$3, duration_sec=$4, width=$5, height=$6, size_bytes=$7, sha256=$8, credit=$9, priority=$10, reviewed_at=NULL, reviewed_by=NULL`,
      [id, b.url, b.posterUrl ?? null, rep.durationSec, rep.width, rep.height, rep.sizeBytes, await sha256Hex(b.mp4Base64), b.credit ?? null, b.priority ?? null]);
    return { json: { ok: true, report: { durationSec: rep.durationSec, width: rep.width, height: rep.height, sizeBytes: rep.sizeBytes } }, status: 201 };
  }, { body: AttachBody, maxBodyBytes: 7 * 1024 * 1024 });

  r.post('/api/admin/exercises/:id/media/review', async (ctx) => {
    if (ctx.user?.role !== 'admin') throw new ApiError(404, 'not_found');
    const up = await ctx.db.query('UPDATE exercise_media SET reviewed_at = $1, reviewed_by = $2 WHERE exercise_id = $3 RETURNING exercise_id', [ctx.now.toISOString(), ctx.user.username, ctx.params['id']]);
    if (up.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });
}
