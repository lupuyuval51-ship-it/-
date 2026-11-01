import { ageBucket, classifySafety, CoachMessageBodySchema, CoachThreadBodySchema, rulesCoachReply, safetyResponse, smoothWeights, type CoachSnapshot, type Language } from '@lupu-fit/shared';
import { EXERCISES } from '@lupu-fit/shared/content';
import { z } from 'zod';
import { randomId } from '../crypto/portableCrypto.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Ctx, Deps } from '../core/types.ts';
import { unlockAchievements } from '../services/gamification.ts';
import { targetsFor } from './profile.ts';
import { addDays, isoDate, loadProfile, uid } from './util.ts';

const EX = new Map(EXERCISES.map((e) => [e.id, e]));
export const COACH_LIMITS = { perMinute: 6, perDay: 50 } as const;

/** Structured, anonymised snapshot: age BRACKET (never exact age), no name/e-mail, only numbers that exist in the DB. */
export async function buildSnapshot(ctx: Ctx, lang: Language): Promise<CoachSnapshot | null> {
  const p = await loadProfile(ctx.db, uid(ctx));
  if (!p) return null;
  const today = isoDate(ctx.now); const from7 = addDays(today, -6);
  const recent = await ctx.db.query<{ local_date: string; sets: number }>('SELECT s.local_date, (SELECT COUNT(*)::int FROM session_sets t JOIN session_exercises e ON e.id = t.session_exercise_id WHERE e.session_id = s.id) AS sets FROM workout_sessions s WHERE s.user_id = $1 AND s.finished_at IS NOT NULL ORDER BY s.started_at DESC LIMIT 5', [uid(ctx)]);
  const prs = await ctx.db.query<{ exercise_id: string; est_1rm: number | null }>('SELECT exercise_id, est_1rm FROM personal_records WHERE user_id = $1 AND est_1rm IS NOT NULL ORDER BY updated_at DESC LIMIT 3', [uid(ctx)]);
  const food = await ctx.db.query<{ kcal: number; p: number }>('SELECT SUM(kcal) AS kcal, SUM(protein_g) AS p FROM food_log_entries WHERE user_id = $1 AND logged_date BETWEEN $2 AND $3 GROUP BY logged_date', [uid(ctx), from7, today]);
  const w = await ctx.db.query<{ logged_date: string; weight_kg: number }>('SELECT logged_date, weight_kg FROM body_weight_entries WHERE user_id = $1 AND logged_date >= $2 ORDER BY logged_date', [uid(ctx), addDays(today, -28)]);
  const rd = (await ctx.db.query<{ state: 'normal' | 'easier' | 'rest' }>('SELECT state FROM readiness_checkins WHERE user_id = $1 ORDER BY local_date DESC LIMIT 1', [uid(ctx)]))[0];
  const sm = smoothWeights(w.map((x) => ({ date: x.logged_date, weightKg: x.weight_kg })));
  const days = w.length >= 2 ? Math.round((Date.parse(`${w[w.length - 1]!.logged_date}T00:00:00Z`) - Date.parse(`${w[0]!.logged_date}T00:00:00Z`)) / 86400_000) : 0;
  const t = targetsFor(p);
  return {
    ageBucket: ageBucket(p.age), goal: p.goal, todayWorkout: null,
    recentWorkouts: recent.map((x) => ({ date: x.local_date, sets: x.sets })),
    prs: prs.map((x) => ({ exerciseName: lang === 'he' ? (EX.get(x.exercise_id)?.nameHe ?? x.exercise_id) : (EX.get(x.exercise_id)?.nameEn ?? x.exercise_id), est1rmKg: x.est_1rm as number })),
    nutrition7d: { loggedDays: food.length, avgKcal: food.length ? food.reduce((a, x) => a + Number(x.kcal), 0) / food.length : null, avgProteinG: food.length ? food.reduce((a, x) => a + Number(x.p), 0) / food.length : null },
    targets: { kcal: t.kcal, proteinG: t.proteinG },
    weightTrendKg: sm.length >= 2 ? { deltaKg: Math.round((sm[sm.length - 1]!.weightKg - sm[0]!.weightKg) * 10) / 10, days } : null,
    readiness: rd?.state ?? null,
  };
}

const SYSTEM = (lang: Language) => `You are the LUPU-FIT coach: a concise, evidence-based strength and nutrition coach. Reply in ${lang === 'he' ? 'Hebrew (gender-neutral phrasing: infinitives and noun phrases)' : 'English'}. Use ONLY numbers present in the provided snapshot; if data is missing say there is not enough data. Never diagnose, never give medical advice, never advise calorie intake below safe limits, never discuss steroid/PED dosing. Keep answers under 150 words. For any pain, injury or health concern recommend stopping and seeing a professional.`;

async function usage(ctx: Ctx, kind: string): Promise<{ minute: number; day: number }> {
  const since = (ms: number) => new Date(ctx.now.getTime() - ms).toISOString();
  const q = async (ms: number) => Number((await ctx.db.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM coach_usage WHERE user_id = $1 AND kind = $2 AND used_at > $3', [uid(ctx), kind, since(ms)]))[0]?.c ?? 0);
  return { minute: await q(60_000), day: await q(86_400_000) };
}
export const assertQuota = async (ctx: Ctx, kind: 'message' | 'photo'): Promise<void> => {
  const u = await usage(ctx, kind);
  const lim = kind === 'message' ? COACH_LIMITS : { perMinute: 6, perDay: 20 };
  if (u.minute >= lim.perMinute) throw new ApiError(429, 'quota_exceeded', { window: 'minute' }, { 'retry-after': '30' });
  if (u.day >= lim.perDay) throw new ApiError(429, 'quota_exceeded', { window: 'day' }, { 'retry-after': '3600' });
};
export const recordUsage = (ctx: Ctx, kind: string): Promise<unknown> => ctx.db.query('INSERT INTO coach_usage (user_id, kind, used_at) VALUES ($1,$2,$3)', [uid(ctx), kind, ctx.now.toISOString()]);

async function ownThread(ctx: Ctx, id: string) {
  const t = (await ctx.db.query<{ id: string; title: string }>('SELECT id, title FROM coach_threads WHERE id = $1 AND user_id = $2', [id, uid(ctx)]))[0];
  if (!t) throw new ApiError(404, 'not_found');
  return t;
}

export function coachRoutes(r: Router, d: Deps): void {
  r.get('/api/coach/status', async () => ({ json: { provider: d.ai?.name ?? 'rules', freeTierNotice: d.ai?.name === 'gemini', limits: COACH_LIMITS } }));

  r.get('/api/coach/threads', async (ctx) => {
    const rows = await ctx.db.query<{ id: string; title: string; updated_at: string }>('SELECT id, title, updated_at FROM coach_threads WHERE user_id = $1 ORDER BY updated_at DESC', [uid(ctx)]);
    return { json: { threads: rows.map((t) => ({ id: t.id, title: t.title, updatedAt: t.updated_at })) } };
  });
  r.post('/api/coach/threads', async (ctx) => {
    const b = ctx.body as z.infer<typeof CoachThreadBodySchema>;
    const id = randomId();
    await ctx.db.query('INSERT INTO coach_threads (id, user_id, title, created_at, updated_at) VALUES ($1,$2,$3,$4,$4)', [id, uid(ctx), b.title ?? 'New chat', ctx.now.toISOString()]);
    await unlockAchievements(ctx.db, uid(ctx), isoDate(ctx.now));
    return { json: { id }, status: 201 };
  }, { body: CoachThreadBodySchema });
  r.patch('/api/coach/threads/:id', async (ctx) => {
    const b = ctx.body as z.infer<typeof CoachThreadBodySchema>;
    await ownThread(ctx, ctx.params['id'] as string);
    await ctx.db.query('UPDATE coach_threads SET title = COALESCE($1, title) WHERE id = $2', [b.title ?? null, ctx.params['id']]);
    return { json: { ok: true } };
  }, { body: CoachThreadBodySchema });
  r.delete('/api/coach/threads/:id', async (ctx) => {
    const del = await ctx.db.query('DELETE FROM coach_threads WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });
  r.get('/api/coach/threads/:id', async (ctx) => {
    const t = await ownThread(ctx, ctx.params['id'] as string);
    const msgs = await ctx.db.query<{ id: string; role: string; content: string; provider: string | null; safety_category: string | null; created_at: string }>('SELECT * FROM coach_messages WHERE thread_id = $1 ORDER BY created_at, id', [t.id]);
    return { json: { thread: t, messages: msgs.map((m) => ({ id: m.id, role: m.role, content: m.content, provider: m.provider, safetyCategory: m.safety_category, createdAt: m.created_at })) } };
  });

  r.post('/api/coach/threads/:id/messages', async (ctx) => {
    const b = ctx.body as z.infer<typeof CoachMessageBodySchema>;
    const t = await ownThread(ctx, ctx.params['id'] as string);
    const save = async (role: 'user' | 'assistant', content: string, provider: string | null, cat: string | null) => {
      const id = randomId();
      await ctx.db.query('INSERT INTO coach_messages (id, thread_id, role, content, provider, safety_category, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, t.id, role, content, provider, cat, new Date(ctx.now.getTime() + (role === 'assistant' ? 1 : 0)).toISOString()]);
      await ctx.db.query('UPDATE coach_threads SET updated_at = $1 WHERE id = $2', [ctx.now.toISOString(), t.id]);
      return { id, role, content, provider, safetyCategory: cat };
    };

    // 1) deterministic safety shield BEFORE any quota check or external call; crisis responses are never rate-limited
    const hit = classifySafety(b.text);
    if (hit) {
      const user = await save('user', b.text, null, hit.category);
      const bot = await save('assistant', safetyResponse(hit.category, b.lang), 'safety', hit.category);
      return { json: { user, assistant: bot }, status: 201 };
    }
    await assertQuota(ctx, 'message');
    const snap = await buildSnapshot(ctx, b.lang);
    const user = await save('user', b.text, null, null);
    await recordUsage(ctx, 'message');
    let text: string | null = null; let provider = 'rules';
    if (d.ai && snap) {
      try {
        const history = (await ctx.db.query<{ role: 'user' | 'assistant'; content: string }>('SELECT role, content FROM coach_messages WHERE thread_id = $1 ORDER BY created_at DESC, id DESC LIMIT 12', [t.id])).reverse();
        text = await d.ai.complete({ system: `${SYSTEM(b.lang)}\n\nSnapshot (JSON): ${JSON.stringify(snap)}`, messages: history });
        provider = d.ai.name;
      } catch { text = null; } // provider down / rate limited: fall back to the deterministic coach
    }
    if (!text?.trim()) { text = snap ? rulesCoachReply(b.text, snap, b.lang) : (b.lang === 'he' ? 'אפשר להשלים את השאלון כדי שאוכל לענות לפי הנתונים שלך.' : 'Complete onboarding so I can answer from your data.'); provider = 'rules'; }
    const bot = await save('assistant', text, provider, null);
    return { json: { user, assistant: bot }, status: 201 };
  }, { body: CoachMessageBodySchema });
}
