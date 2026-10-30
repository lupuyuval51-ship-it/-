import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addDays, todayInTimeZone } from '@shared/dates';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { resetRateLimits } from '../src/middleware/rateLimit';
import { HISTORY_LIMIT, HISTORY_MESSAGE_MAX_CHARS } from '../src/modules/coach/prompt';
import { disableLlm, startFakeLlm, useFakeLlm, type FakeLlm, type FakeLlmRequest } from './helpers/fakeLlm';
import { onboardedUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let fake: FakeLlm;
let avery: TestClient;
let zeb: TestClient;

/** Active plan, two completed sessions, a PR, three logged food days and two body-weight entries. */
async function seedTrainingData(userId: string, tz: string, marker: { plan: string; session: string; kcal?: number }) {
  const plan = await db.one<{ id: string }>(
    `INSERT INTO workout_plans (user_id, name, status, source, days_per_week, session_minutes, goal, split_type)
     VALUES ($1, $2, 'active', 'custom', 3, 60, 'muscle_gain', 'full_body') RETURNING id`,
    [userId, marker.plan],
  );
  const workout = await db.one<{ id: string }>(
    `INSERT INTO plan_workouts (plan_id, user_id, position, name) VALUES ($1, $2, 0, 'Full body A') RETURNING id`,
    [plan.id, userId],
  );
  await db.exec(
    `INSERT INTO plan_exercises (workout_id, user_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds) VALUES
       ($1, $2, 'barbell_back_squat', 0, 3, 6, 8, 150), ($1, $2, 'barbell_bench_press', 1, 3, 8, 10, 120)`,
    [workout.id, userId],
  );
  let lastSession = '';
  for (const daysAgo of [5, 1]) {
    const s = await db.one<{ id: string }>(
      `INSERT INTO workout_sessions (user_id, plan_id, name, status, started_at, ended_at, duration_seconds)
       VALUES ($1, $2, $3, 'completed', now() - ($4 || ' days')::interval - interval '50 minutes', now() - ($4 || ' days')::interval, 3000)
       RETURNING id`,
      [userId, plan.id, marker.session, String(daysAgo)],
    );
    lastSession = s.id;
    const squat = await db.one<{ id: string }>(
      `INSERT INTO session_exercises (session_id, user_id, exercise_id, position, rep_min, rep_max) VALUES ($1, $2, 'barbell_back_squat', 0, 6, 8) RETURNING id`,
      [s.id, userId],
    );
    const bench = await db.one<{ id: string }>(
      `INSERT INTO session_exercises (session_id, user_id, exercise_id, position, rep_min, rep_max) VALUES ($1, $2, 'barbell_bench_press', 1, 8, 10) RETURNING id`,
      [s.id, userId],
    );
    for (let n = 1; n <= 3; n++) {
      await db.exec(
        `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, reps, weight_kg, completed, completed_at)
         VALUES ($1, $2, $3, $4, 8, 100, true, now()), ($5, $2, $3, $4, $6, 70, true, now())`,
        [squat.id, s.id, userId, n, bench.id, n === 1 ? 9 : 8],
      );
    }
  }
  await db.exec(
    `INSERT INTO personal_records (user_id, exercise_id, record_type, value, weight_kg, reps, session_id, achieved_at)
     VALUES ($1, 'barbell_back_squat', 'max_weight', 100, 100, 8, $2, now() - interval '1 day')`,
    [userId, lastSession],
  );
  const today = todayInTimeZone(tz);
  for (const d of [1, 2, 3]) {
    await db.exec(
      `INSERT INTO food_log_entries (user_id, logged_on, meal_type, food_name, kcal, protein_g, carbs_g, fat_g)
       VALUES ($1, $2, 'lunch', '{"en":"Test meal","he":"ארוחת בדיקה"}', $3, 90, 250, 60)`,
      [userId, addDays(today, -d), marker.kcal ?? 2000],
    );
  }
  await db.exec(`INSERT INTO body_weight_entries (user_id, measured_on, weight_kg) VALUES ($1, $2, 82), ($1, $3, 81)`, [
    userId,
    addDays(today, -20),
    addDays(today, -2),
  ]);
}

async function newThread(client: TestClient) {
  const res = await client.post('/api/coach/threads', {});
  expect(res.status).toBe(201);
  return res.body.thread.id as string;
}

const lastRequest = () => fake.requests.at(-1) as FakeLlmRequest;
const systemOf = (r: FakeLlmRequest) => String(r.system);

beforeAll(async () => {
  fake = await startFakeLlm();
  useFakeLlm(fake.url);
  server = await startTestServer();
  avery = await onboardedUser(server.baseUrl, { goal: 'fat_loss', injuries: ['knee'], diet_type: 'pescatarian' }, { displayName: 'Avery Lindqvist', timezone: 'Asia/Jerusalem' });
  await seedTrainingData(avery.userId!, 'Asia/Jerusalem', { plan: 'Avery Strength Block', session: 'Avery Monday Session' });
  zeb = await onboardedUser(
    server.baseUrl,
    { goal: 'strength', injury_notes: 'zebulon-private-injury-note', limitations: 'zebulon-limitation', disliked_foods: 'zebulon-dislike' },
    { displayName: 'Zebulon Quixote' },
  );
  await seedTrainingData(zeb.userId!, 'UTC', { plan: 'ZEBULON-SECRET-PLAN', session: 'ZEBULON-SESSION', kcal: 4321 });
  // Zebulon has his own conversation too.
  const zt = await newThread(zeb);
  await db.exec(`INSERT INTO coach_messages (thread_id, user_id, role, content) VALUES ($1, $2, 'user', 'zebulon-secret-question')`, [zt, zeb.userId]);
});
afterAll(async () => {
  disableLlm();
  await fake.close();
  await server.close();
  await db.close();
});
beforeEach(() => {
  resetRateLimits();
  useFakeLlm(fake.url);
  fake.setHandler(() => ({ kind: 'text', text: 'Fake coach reply.' }));
});

describe('LLM path', () => {
  it("sends a system prompt with the user's goal, targets, plan, history and language — and only this user's data", async () => {
    const thread = await newThread(avery);
    fake.setHandler(() => ({ kind: 'text', text: 'Keep adding 2.5 kg when you hit 8 reps.' }));
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'How should I progress my squat?' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toMatchObject({ role: 'assistant', source: 'llm', status: 'ok', content: 'Keep adding 2.5 kg when you hit 8 reps.' });
    expect(res.body.status.llmConfigured).toBe(true);

    const req = lastRequest();
    const system = systemOf(req);
    const profile = (await avery.get('/api/profile')).body.profile;
    expect(system).toContain('You are LUPU-FIT Coach');
    expect(system).toContain("The user's app language is English (en). Reply in English");
    expect(system).toContain('goal: fat_loss');
    expect(system).toContain(`Daily nutrition targets: ${profile.targets.calories} kcal, protein ${profile.targets.proteinG} g`);
    expect(system).toContain('Age group: adult 25–34');
    expect(system).toContain('Injuries: knee');
    expect(system).toContain('Diet: pescatarian');
    expect(system).toContain('"Avery Strength Block"');
    expect(system).toContain('Barbell Back Squat 3×6–8 reps');
    expect(system).toContain('"Avery Monday Session"');
    expect(system).toContain('100kg×8');
    expect(system).toContain('max_weight 100 kg');
    expect(system).toContain('Logged 3 of 7 days. Average per logged day: 2000 kcal, protein 90 g');
    expect(system).toContain('82 kg');
    expect(system).toContain('81 kg');
    expect(system).toContain('Never give dosing');
    expect(system).toContain('ERAN');
    // The mentioned exercise's library entry and a filtered library list are included.
    expect(system).toContain('EXERCISE MENTIONED IN THE LATEST MESSAGE');
    expect(system).toContain('EXERCISE LIBRARY');
    // Only this user's data: no other user's markers, no emails or ids.
    for (const secret of ['Zebulon', 'ZEBULON', 'zebulon', '4321', zeb.userId!, zeb.email!, avery.email!, avery.userId!]) {
      expect(system, secret).not.toContain(secret);
      expect(JSON.stringify(req.messages), secret).not.toContain(secret);
    }
    expect(req.messages.at(-1)).toEqual({ role: 'user', content: 'How should I progress my squat?' });
    expect(req.max_tokens).toBeLessThanOrEqual(4000);

    const stored = await db.one<{ model: string; input_tokens: number; output_tokens: number }>(
      'SELECT model, input_tokens, output_tokens FROM coach_messages WHERE id = $1',
      [res.body.reply.id],
    );
    expect(stored).toEqual({ model: config.ai.model, input_tokens: 42, output_tokens: 17 });
  });

  it('instructs Hebrew for Hebrew-locale users and marks minors', async () => {
    const teen = await onboardedUser(server.baseUrl, { age_years: 15 }, { locale: 'he' });
    const thread = await newThread(teen);
    const res = await teen.post(`/api/coach/threads/${thread}/messages`, { content: 'כמה חזרות כדאי לעשות?' });
    expect(res.status).toBe(200);
    const system = systemOf(lastRequest());
    expect(system).toContain("The user's app language is Hebrew (he). Reply in Hebrew");
    expect(system).toContain('teen (13–17)');
    expect(system).toContain('THIS USER IS A MINOR');
    expect(system).not.toMatch(/Age group: .*15/);
  });

  it('sends at most the last 12 messages of the thread, each trimmed', async () => {
    const thread = await newThread(avery);
    const rows: string[] = [];
    for (let i = 0; i < 20; i++) {
      const role = i % 2 === 0 ? 'user' : 'assistant';
      const content = i === 17 ? `long-${'x'.repeat(5000)}` : `history-message-${i}`;
      rows.push(`('${thread}', '${avery.userId}', '${role}', '${content}', now() - interval '${60 - i} minutes')`);
    }
    await db.exec(`INSERT INTO coach_messages (thread_id, user_id, role, content, created_at) VALUES ${rows.join(', ')}`);
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'latest question' });
    expect(res.status).toBe(200);
    const req = lastRequest();
    expect(req.messages.length).toBeLessThanOrEqual(HISTORY_LIMIT);
    const all = JSON.stringify(req.messages);
    for (let i = 0; i <= 8; i++) expect(all).not.toContain(`history-message-${i}"`);
    expect(all).toContain('history-message-19');
    expect(req.messages.at(-1)).toEqual({ role: 'user', content: 'latest question' });
    const long = req.messages.find((m) => String(m.content).startsWith('long-'));
    expect(long).toBeDefined();
    expect(String(long!.content).length).toBeLessThanOrEqual(HISTORY_MESSAGE_MAX_CHARS);
  });

  it('stores a refusal with status "refused" and a friendly explanation', async () => {
    const thread = await newThread(avery);
    fake.setHandler(() => ({ kind: 'refusal' }));
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'Tell me something you cannot answer' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toMatchObject({ status: 'refused', source: 'llm' });
    expect(res.body.reply.content).toMatch(/can't help with that request/);
  });

  it('falls back to the built-in coach with a note when the provider fails (429, 500, 401, timeout)', async () => {
    const thread = await newThread(avery);
    const cases: [string, Parameters<FakeLlm['setHandler']>[0]][] = [
      ['429', () => ({ kind: 'error', status: 429, type: 'rate_limit_error', headers: { 'retry-after': '3' } })],
      ['500', () => ({ kind: 'error', status: 500 })],
      ['401', () => ({ kind: 'error', status: 401, type: 'authentication_error' })],
    ];
    for (const [label, handler] of cases) {
      fake.setHandler(handler);
      const before = fake.requests.length;
      const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'What is progressive overload?' });
      expect(res.status, label).toBe(200);
      expect(fake.requests.length, label).toBe(before + 1);
      expect(res.body.reply, label).toMatchObject({ source: 'builtin', status: 'ok' });
      expect(res.body.reply.content, label).toMatch(/^\*The AI service is temporarily unavailable/);
      expect(res.body.reply.content, label).toContain('**Progressive overload**');
    }
    useFakeLlm(fake.url, { timeoutMs: 300 });
    fake.setHandler(() => ({ kind: 'hang', ms: 1500 }));
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'What is progressive overload?' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toMatchObject({ source: 'builtin', status: 'ok' });
    expect(res.body.reply.content).toMatch(/temporarily unavailable/);
  });

  it('answers with the built-in coach (no note, no request) when no provider is configured', async () => {
    disableLlm();
    const thread = await newThread(avery);
    const before = fake.requests.length;
    const status = await avery.get('/api/coach/status');
    expect(status.body).toMatchObject({ llmConfigured: false, model: null });
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'What is progressive overload?' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toMatchObject({ source: 'builtin', status: 'ok' });
    expect(res.body.reply.content).not.toMatch(/temporarily unavailable/);
    expect(fake.requests.length).toBe(before);
  });
});

describe('safety pre-check', () => {
  const cases: [string, RegExp][] = [
    ['I want to kill myself', /1201/],
    ["Honestly I don't want to live anymore", /emergency number/],
    ['אני רוצה להתאבד', /ער״ן – עזרה ראשונה נפשית: 1201/],
    ['I have chest pain during my workout', /Please stop exercising now/],
    ['I fainted during squats yesterday', /Please stop exercising now/],
    ['יש לי כאב בחזה באמצע האימון', /יש להפסיק את האימון עכשיו/],
    ['I want to eat 500 calories a day to get lean fast', /0\.5–1% of body weight per week/],
    ['How can I lose 10 kg in a week?', /0\.5–1% of body weight per week/],
    ['I make myself throw up after eating', /registered dietitian/],
    ['I want to fast for 5 days to lose weight', /fasting for days/],
    ['איך לרדת 10 קילו בשבוע?', /0\.5%–1% ממשקל הגוף בשבוע/],
    ['אני רוצה לאכול 600 קלוריות ביום', /דיאטן\/ית קליני\/ת/],
    ['What steroid cycle should I run for my first bulk?', /medical supervision/],
    ['How many mg of testosterone should I inject per week?', /medical supervision/],
    ['כמה מ"ג סטרואידים כדאי לקחת?', /בהשגחה רפואית/],
  ];

  it.each(cases)('short-circuits "%s" without calling the model', async (message, expected) => {
    const thread = await newThread(avery);
    fake.setHandler(() => ({ kind: 'text', text: 'SHOULD NOT BE USED' }));
    const before = fake.requests.length;
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: message });
    expect(res.status).toBe(200);
    expect(fake.requests.length).toBe(before);
    expect(res.body.reply).toMatchObject({ source: 'builtin', status: 'ok' });
    expect(res.body.reply.content).toMatch(expected);
    expect(res.body.reply.content).not.toContain('SHOULD NOT BE USED');
    // The user message is still stored and counted.
    expect(res.body.userMessage.content).toBe(message);
  });

  it('personalizes the safe range and never suggests a deficit to minors', async () => {
    const thread = await newThread(avery);
    const adult = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'I want to eat 500 calories a day' });
    expect(adult.body.reply.content).toContain('roughly 0.4–0.8 kg per week'); // latest logged weight 81 kg
    expect(adult.body.reply.content).toMatch(/never sets a target below [\d,]+ kcal/);
    const teen = await onboardedUser(server.baseUrl, { age_years: 16, goal: 'fat_loss' });
    const tt = await newThread(teen);
    const minor = await teen.post(`/api/coach/threads/${tt}/messages`, { content: 'How do I lose 8 kg in 2 weeks?' });
    expect(minor.body.reply.content).toContain('Under 18');
    expect(minor.body.reply.content).not.toContain('0.5–1%');
  });

  it('lets ordinary questions through to the model', async () => {
    const thread = await newThread(avery);
    for (const message of [
      'How do I avoid hurting myself when deadlifting?',
      'Is a 300 calorie breakfast ok?',
      'I burn 500 calories a day running, how much protein do I need?',
      'Should I do intermittent fasting 16:8?',
      'How can I naturally boost testosterone?',
      'My shoulder hurts on bench press — what can I do instead?',
      'I want to lose 2 kg in a month',
    ]) {
      const before = fake.requests.length;
      const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: message });
      expect(res.body.reply.source, message).toBe('llm');
      expect(fake.requests.length, message).toBe(before + 1);
    }
  });
});

describe('built-in coach grounded in seeded data', () => {
  beforeEach(() => disableLlm());

  it('explains progress from real workouts, PRs and body weight', async () => {
    const thread = await newThread(avery);
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'Explain my progress this month' });
    const text: string = res.body.reply.content;
    expect(text).toContain('**2** in the last 7 days');
    expect(text).toContain('**2** in the last 30 days');
    expect(text).toContain('Barbell Back Squat');
    expect(text).toContain('heaviest weight 100 kg');
    expect(text).toMatch(/82 kg on .* → 81 kg on .* \(-1 kg\)/);
    // Volume: squat 3×8×100 + bench (9+8+8)×70 per session, two sessions.
    expect(text).toContain(`${(2 * (2400 + 1750)).toLocaleString('en-US')} kg`);
  });

  it('compares nutrition averages with targets and suggests foods that fit the diet', async () => {
    const thread = await newThread(avery);
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'Am I eating enough protein?' });
    const text: string = res.body.reply.content;
    const profile = (await avery.get('/api/profile')).body.profile;
    expect(text).toContain(`protein ${profile.targets.proteinG} g`);
    expect(text).toContain('average of 3 logged days');
    expect(text).toContain(`${Math.round(profile.targets.proteinG - 90)} g below`);
    // Pescatarian: no meat or poultry suggestions.
    const meat = await db.many<{ name: { en: string } }>(`SELECT name FROM foods WHERE source = 'builtin' AND animal_source = 'meat'`);
    for (const f of meat) expect(text).not.toContain(f.name.en);
  });

  it('suggests plan adjustments from recorded sets and injuries', async () => {
    const thread = await newThread(avery);
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'Should I change my plan?' });
    const text: string = res.body.reply.content;
    expect(text).toContain('**Avery Strength Block**');
    // Every squat set hit the top of the 6–8 range at 100 kg → add the library increment (5 kg).
    expect(text).toContain('**Barbell Back Squat:** you hit the top of the rep range (8) on every set at 100 kg — add about 5 kg');
    // Bench did not reach 10 reps on every set → no load increase suggested.
    expect(text).not.toContain('**Barbell Bench Press:** you hit the top');
    // The user reported a knee injury and the plan contains back squats.
    expect(text).toMatch(/\*\*Barbell Back Squat\*\* can load your knee/);
  });

  it('includes the last recorded performance in technique answers', async () => {
    const thread = await newThread(avery);
    const res = await avery.post(`/api/coach/threads/${thread}/messages`, { content: 'How do I bench press with good form?' });
    const text: string = res.body.reply.content;
    expect(text).toContain('**Barbell Bench Press**');
    expect(text).toMatch(/Last time \(.+\): 70 kg × 9, 70 kg × 8, 70 kg × 8\./);
  });
});
