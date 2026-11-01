import { ReadinessBodySchema, readinessState } from '@lupu-fit/shared';
import { z } from 'zod';
import { randomId } from '../crypto/portableCrypto.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { uid } from './util.ts';

export function readinessRoutes(r: Router, _d: Deps): void {
  r.post('/api/readiness', async (ctx) => {
    const b = ctx.body as z.infer<typeof ReadinessBodySchema>;
    const state = readinessState({ sleep: b.sleep as 1, energy: b.energy as 1, soreness: b.soreness as 1, pain: b.pain });
    await ctx.db.query(`INSERT INTO readiness_checkins (id, user_id, local_date, sleep, energy, soreness, pain, state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (user_id, local_date) DO UPDATE SET sleep=EXCLUDED.sleep, energy=EXCLUDED.energy, soreness=EXCLUDED.soreness, pain=EXCLUDED.pain, state=EXCLUDED.state`, [randomId(), uid(ctx), b.localDate, b.sleep, b.energy, b.soreness, b.pain, state]);
    return { json: { state }, status: 201 };
  }, { body: ReadinessBodySchema });

  r.get('/api/readiness', async (ctx) => {
    const date = ctx.req.query['date'];
    const rows = await ctx.db.query<{ local_date: string; sleep: number; energy: number; soreness: number; pain: boolean; state: string }>(
      date ? 'SELECT local_date, sleep, energy, soreness, pain, state FROM readiness_checkins WHERE user_id = $1 AND local_date = $2' : 'SELECT local_date, sleep, energy, soreness, pain, state FROM readiness_checkins WHERE user_id = $1 ORDER BY local_date DESC LIMIT 1',
      date ? [uid(ctx), date] : [uid(ctx)]);
    const x = rows[0];
    return { json: { checkin: x ? { localDate: x.local_date, sleep: x.sleep, energy: x.energy, soreness: x.soreness, pain: x.pain, state: x.state } : null } };
  });
}
