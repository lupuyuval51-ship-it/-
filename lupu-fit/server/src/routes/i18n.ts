import { TranslateBodySchema, type TranslateBody } from '@lupu-fit/shared';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { translateBatch } from '../services/translate.ts';
import { assertQuota, recordUsage } from './coach.ts';

/** POST /api/i18n/translate: machine-translates <=150 UI strings. Authenticated, per-user rate limited (shares the coach_usage ledger, kind "translate"). */
export function i18nRoutes(r: Router, d: Deps): void {
  r.post('/api/i18n/translate', async (ctx) => {
    const b = ctx.body as TranslateBody;
    if (!d.ai) throw new ApiError(503, 'ai_unavailable');
    await assertQuota(ctx, 'translate');
    await recordUsage(ctx, 'translate');
    try {
      const res = await translateBatch(d.ai, b.target, b.keys);
      return { json: { ...res, provider: d.ai.name } };
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      if (/busy|_429|_503/.test(m)) throw new ApiError(429, 'ai_busy', { window: 'provider' }, { 'retry-after': '30' });
      throw new ApiError(502, 'ai_failed');
    }
  }, { body: TranslateBodySchema, maxBodyBytes: 64 * 1024 });
}
