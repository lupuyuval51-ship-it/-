import { classifySafety, TranslateBodySchema, type TranslateBody } from '@lupu-fit/shared';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { promptLanguage } from '../services/langLabel.ts';
import { translateBatch } from '../services/translate.ts';
import { reserveQuota } from './coach.ts';

/** POST /api/i18n/translate: machine-translates <=150 UI strings. Authenticated, per-user rate limited (shares the coach_usage ledger, kind "translate"). */
export function i18nRoutes(r: Router, d: Deps): void {
  r.post('/api/i18n/translate', async (ctx) => {
    const b = ctx.body as TranslateBody;
    if (!d.ai) throw new ApiError(503, 'ai_unavailable');
    if (!promptLanguage(b.target)) throw new ApiError(400, 'invalid_language');
    // Only UI copy goes to the model. Legal text is never machine translated (D16), and a value the coach safety shield would catch
    // (no app string does) is not app copy: neither is sent, both come back unchanged in `fallback`.
    const isHeld = ([k, v]: [string, string]) => k.startsWith('legal.') || !!classifySafety(v);
    const held = Object.entries(b.keys).filter(isHeld).map(([k]) => k);
    const send = Object.fromEntries(Object.entries(b.keys).filter((e) => !isHeld(e))); // fromEntries: a "__proto__" key stays a plain key
    if (Object.keys(send).length === 0) return { json: { translations: { ...b.keys }, fallback: held, provider: d.ai.name } };
    await reserveQuota(ctx, 'translate');
    try {
      const res = await translateBatch(d.ai, b.target, send);
      return { json: { translations: { ...b.keys, ...res.translations }, fallback: [...res.fallback, ...held], provider: d.ai.name } };
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      if (/busy|_429|_503/.test(m)) throw new ApiError(429, 'ai_busy', { window: 'provider' }, { 'retry-after': '30' });
      throw new ApiError(502, 'ai_failed');
    }
  }, { body: TranslateBodySchema, maxBodyBytes: 64 * 1024, replayBody: false });
}
