import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { todayInTimeZone } from '@shared/dates';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { resetRateLimits } from '../src/middleware/rateLimit';
import { startOfDayInTimeZone, titleFromMessage } from '../src/modules/coach/repository';
import { disableLlm } from './helpers/fakeLlm';
import { onboardedUser, registerUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let alice: TestClient;
let bob: TestClient;

beforeAll(async () => {
  disableLlm();
  server = await startTestServer();
  alice = await onboardedUser(server.baseUrl, {}, { displayName: 'Alice' });
  bob = await onboardedUser(server.baseUrl, {}, { displayName: 'Bob' });
});
afterAll(async () => {
  await server.close();
  await db.close();
});
beforeEach(() => resetRateLimits());

async function newThread(client: TestClient, title = '') {
  const res = await client.post('/api/coach/threads', { title });
  expect(res.status).toBe(201);
  return res.body.thread as { id: string; title: string; messageCount: number; createdAt: string; updatedAt: string };
}

describe('coach threads', () => {
  it('creates, lists (newest activity first), renames and deletes threads', async () => {
    const user = await onboardedUser(server.baseUrl);
    const empty = await user.get('/api/coach/threads');
    expect(empty.status).toBe(200);
    expect(empty.body.threads).toEqual([]);

    const first = await newThread(user, 'Leg day questions');
    expect(first).toMatchObject({ title: 'Leg day questions', messageCount: 0 });
    const second = await newThread(user);
    expect(second.title).toBe('');

    // Posting into the first thread moves it to the top.
    const sent = await user.post(`/api/coach/threads/${first.id}/messages`, { content: 'What is progressive overload?' });
    expect(sent.status).toBe(200);
    const list = await user.get('/api/coach/threads');
    expect(list.body.threads.map((t: { id: string }) => t.id)).toEqual([first.id, second.id]);
    expect(list.body.threads[0].messageCount).toBe(2);
    expect(list.body.threads[0].title).toBe('Leg day questions'); // explicit titles are kept

    const renamed = await user.patch(`/api/coach/threads/${second.id}`, { title: '  Nutrition  ' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.thread.title).toBe('Nutrition');

    const del = await user.delete(`/api/coach/threads/${first.id}`);
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ ok: true });
    const after = await user.get('/api/coach/threads');
    expect(after.body.threads.map((t: { id: string }) => t.id)).toEqual([second.id]);
    const gone = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM coach_messages WHERE thread_id = $1', [first.id]);
    expect(gone.n).toBe(0);
    expect((await user.delete(`/api/coach/threads/${first.id}`)).status).toBe(404);
  });

  it('auto-titles an untitled thread from its first message (≤ 60 chars)', async () => {
    const t = await newThread(alice);
    const long = 'Can you explain how I should structure my warm-up before heavy squats and deadlifts on leg day?';
    await alice.post(`/api/coach/threads/${t.id}/messages`, { content: long });
    const res = await alice.get('/api/coach/threads');
    const thread = res.body.threads.find((x: { id: string }) => x.id === t.id);
    expect(thread.title.length).toBeLessThanOrEqual(60);
    expect(thread.title.endsWith('…')).toBe(true);
    expect(long.startsWith(thread.title.slice(0, -1))).toBe(true);
    // A second message does not change the title.
    await alice.post(`/api/coach/threads/${t.id}/messages`, { content: 'And what about rest periods?' });
    const again = await alice.get('/api/coach/threads');
    expect(again.body.threads.find((x: { id: string }) => x.id === t.id).title).toBe(thread.title);
  });

  it('titleFromMessage keeps short messages and cuts long ones on a word boundary', () => {
    expect(titleFromMessage('  Short\n question ')).toBe('Short question');
    const t = titleFromMessage('word '.repeat(30));
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith('word…')).toBe(true);
    expect(titleFromMessage('x'.repeat(100))).toHaveLength(60);
  });

  it('validates input', async () => {
    const t = await newThread(alice);
    const cases: [string, string, unknown][] = [
      ['POST', `/api/coach/threads/${t.id}/messages`, { content: '' }],
      ['POST', `/api/coach/threads/${t.id}/messages`, { content: '   ' }],
      ['POST', `/api/coach/threads/${t.id}/messages`, { content: 'a'.repeat(2001) }],
      ['POST', `/api/coach/threads/${t.id}/messages`, {}],
      ['POST', `/api/coach/threads/${t.id}/messages`, { content: 42 }],
      ['PATCH', `/api/coach/threads/${t.id}`, { title: '' }],
      ['PATCH', `/api/coach/threads/${t.id}`, { title: 'x'.repeat(121) }],
      ['POST', '/api/coach/threads', { title: 'x'.repeat(121) }],
    ];
    for (const [method, path, body] of cases) {
      const res = await alice.request(method, path, body);
      expect(res.status, `${method} ${path} ${JSON.stringify(body).slice(0, 40)}`).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    expect((await alice.post('/api/coach/threads/not-a-uuid/messages', { content: 'hi' })).status).toBe(400);
    expect((await alice.get(`/api/coach/threads/${t.id}/messages?limit=0`)).status).toBe(400);
    expect((await alice.get(`/api/coach/threads/${t.id}/messages?limit=101`)).status).toBe(400);
    expect((await alice.get(`/api/coach/threads/${t.id}/messages?before=abc`)).status).toBe(400);
    // Exactly 2000 characters is allowed.
    const max = await alice.post(`/api/coach/threads/${t.id}/messages`, { content: 'a'.repeat(2000) });
    expect(max.status).toBe(200);
    // Nothing was stored for the rejected requests.
    const msgs = await alice.get(`/api/coach/threads/${t.id}/messages`);
    expect(msgs.body.messages).toHaveLength(2);
  });

  it('strips markup characters from stored user messages', async () => {
    const t = await newThread(alice);
    const res = await alice.post(`/api/coach/threads/${t.id}/messages`, { content: 'hello <script>alert(1)</script>' });
    expect(res.status).toBe(200);
    expect(res.body.userMessage.content).toBe('hello scriptalert(1)/script');
  });

  it('requires authentication and CSRF', async () => {
    const anon = await fetch(`${server.baseUrl}/api/coach/threads`);
    expect(anon.status).toBe(401);
    const noCsrf = await alice.post('/api/coach/threads', {}, { csrf: false });
    expect(noCsrf.status).toBe(403);
  });
});

describe('authorization isolation', () => {
  it("user B gets 404 for user A's thread and cannot read, post, rename or delete it", async () => {
    const t = await newThread(alice, 'Private');
    const sent = await alice.post(`/api/coach/threads/${t.id}/messages`, { content: 'How do I squat with good form?' });
    expect(sent.status).toBe(200);

    const read = await bob.get(`/api/coach/threads/${t.id}/messages`);
    expect(read.status).toBe(404);
    expect(read.body.error.code).toBe('thread_not_found');
    const post = await bob.post(`/api/coach/threads/${t.id}/messages`, { content: 'let me in' });
    expect(post.status).toBe(404);
    expect(post.body.error.code).toBe('thread_not_found');
    expect((await bob.patch(`/api/coach/threads/${t.id}`, { title: 'Hacked' })).status).toBe(404);
    expect((await bob.delete(`/api/coach/threads/${t.id}`)).status).toBe(404);
    const bobList = await bob.get('/api/coach/threads');
    expect(bobList.body.threads.some((x: { id: string }) => x.id === t.id)).toBe(false);
    // Paging with A's message id as a cursor in B's own thread does not leak anything.
    const own = await newThread(bob);
    const cursor = await bob.get(`/api/coach/threads/${own.id}/messages?before=${sent.body.reply.id}`);
    expect(cursor.status).toBe(404);

    const still = await alice.get(`/api/coach/threads/${t.id}/messages`);
    expect(still.body.messages).toHaveLength(2);
    const thread = (await alice.get('/api/coach/threads')).body.threads.find((x: { id: string }) => x.id === t.id);
    expect(thread.title).toBe('Private');
    const count = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM coach_messages WHERE thread_id = $1', [t.id]);
    expect(count.n).toBe(2);
  });

  it('returns 404 for a thread that does not exist', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    expect((await alice.get(`/api/coach/threads/${id}/messages`)).status).toBe(404);
    expect((await alice.post(`/api/coach/threads/${id}/messages`, { content: 'hi' })).status).toBe(404);
  });
});

describe('messages', () => {
  it('returns messages chronologically with source/status and pages backwards', async () => {
    const user = await onboardedUser(server.baseUrl);
    const t = await newThread(user);
    for (const q of ['What is a deload?', 'How long should I rest between sets?', 'What is progressive overload?']) {
      const res = await user.post(`/api/coach/threads/${t.id}/messages`, { content: q });
      expect(res.status).toBe(200);
      expect(res.body.userMessage).toMatchObject({ role: 'user', content: q, source: null, status: 'ok', threadId: t.id });
      expect(res.body.reply).toMatchObject({ role: 'assistant', source: 'builtin', status: 'ok', threadId: t.id });
      expect(Date.parse(res.body.reply.createdAt)).toBeGreaterThanOrEqual(Date.parse(res.body.userMessage.createdAt));
    }
    const all = await user.get(`/api/coach/threads/${t.id}/messages`);
    expect(all.body.hasMore).toBe(false);
    expect(all.body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user', 'assistant']);
    expect(all.body.messages[0].content).toBe('What is a deload?');

    const page1 = await user.get(`/api/coach/threads/${t.id}/messages?limit=4`);
    expect(page1.body.hasMore).toBe(true);
    expect(page1.body.messages).toHaveLength(4);
    expect(page1.body.messages[0].content).toBe('How long should I rest between sets?');
    const page2 = await user.get(`/api/coach/threads/${t.id}/messages?limit=4&before=${page1.body.messages[0].id}`);
    expect(page2.body.hasMore).toBe(false);
    expect(page2.body.messages.map((m: { id: string }) => m.id)).toEqual(all.body.messages.slice(0, 2).map((m: { id: string }) => m.id));
  });
});

describe('status, rate limit and daily quota', () => {
  it('reports configuration and counts usage since midnight in the user time zone', async () => {
    const tz = 'Asia/Jerusalem';
    const user = await onboardedUser(server.baseUrl, {}, { timezone: tz });
    const t = await newThread(user);
    const dayStart = startOfDayInTimeZone(todayInTimeZone(tz), tz);
    // One message just before local midnight (yesterday), one just after (today), one assistant message (not counted).
    await db.exec(
      `INSERT INTO coach_messages (thread_id, user_id, role, content, created_at) VALUES
         ($1, $2, 'user', 'late last night', $3), ($1, $2, 'user', 'early today', $4), ($1, $2, 'assistant', 'reply', $4)`,
      [t.id, user.userId, new Date(dayStart.getTime() - 30 * 60_000), new Date(dayStart.getTime() + 1000)],
    );
    const res = await user.get('/api/coach/status');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      llmConfigured: false,
      model: null,
      dailyLimit: config.ai.coachDailyLimit,
      usedToday: 1,
      remainingToday: config.ai.coachDailyLimit - 1,
    });
    const tomorrow = startOfDayInTimeZone(todayInTimeZone(tz, new Date(dayStart.getTime() + 36 * 3_600_000)), tz);
    expect(res.body.resetsAt).toBe(tomorrow.toISOString());
  });

  it('computes local midnight across time zones and DST', () => {
    expect(startOfDayInTimeZone('2026-10-09', 'Asia/Jerusalem').toISOString()).toBe('2026-10-08T21:00:00.000Z');
    expect(startOfDayInTimeZone('2026-12-01', 'Asia/Jerusalem').toISOString()).toBe('2026-11-30T22:00:00.000Z');
    expect(startOfDayInTimeZone('2026-03-08', 'America/New_York').toISOString()).toBe('2026-03-08T05:00:00.000Z');
    expect(startOfDayInTimeZone('2026-03-09', 'America/New_York').toISOString()).toBe('2026-03-09T04:00:00.000Z');
    expect(startOfDayInTimeZone('2026-06-01', 'UTC').toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(startOfDayInTimeZone('2026-06-01', 'Not/AZone').toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('enforces the per-user burst rate limit (6 per minute)', async () => {
    const multiplier = config.rateLimit.multiplier;
    config.rateLimit.multiplier = 1;
    try {
      const user = await onboardedUser(server.baseUrl);
      const t = await newThread(user);
      for (let i = 0; i < 6; i++) {
        const ok = await user.post(`/api/coach/threads/${t.id}/messages`, { content: `What is a deload? ${i}` });
        expect(ok.status).toBe(200);
      }
      const limited = await user.post(`/api/coach/threads/${t.id}/messages`, { content: 'one more' });
      expect(limited.status).toBe(429);
      expect(limited.body.error.code).toBe('rate_limited');
      expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
      // Other users are not affected.
      const other = await onboardedUser(server.baseUrl);
      const ot = await newThread(other);
      expect((await other.post(`/api/coach/threads/${ot.id}/messages`, { content: 'What is a deload?' })).status).toBe(200);
      const stored = await db.one<{ n: number }>("SELECT count(*)::int AS n FROM coach_messages WHERE thread_id = $1 AND role = 'user'", [t.id]);
      expect(stored.n).toBe(6);
    } finally {
      config.rateLimit.multiplier = multiplier;
    }
  });

  it('enforces the daily quota with limit and reset time', async () => {
    const limit = config.ai.coachDailyLimit;
    config.ai.coachDailyLimit = 2;
    try {
      const user = await onboardedUser(server.baseUrl);
      const t = await newThread(user);
      const first = await user.post(`/api/coach/threads/${t.id}/messages`, { content: 'What is a deload?' });
      expect(first.body.status).toMatchObject({ dailyLimit: 2, usedToday: 1, remainingToday: 1 });
      const second = await user.post(`/api/coach/threads/${t.id}/messages`, { content: 'What is progressive overload?' });
      expect(second.body.status).toMatchObject({ usedToday: 2, remainingToday: 0 });
      const blocked = await user.post(`/api/coach/threads/${t.id}/messages`, { content: 'One more?' }, { headers: { 'idempotency-key': 'quota-test-key-1' } });
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('quota_exceeded');
      expect(blocked.body.error.details.limit).toBe(2);
      expect(Date.parse(blocked.body.error.details.resetsAt)).toBeGreaterThan(Date.now());
      const status = await user.get('/api/coach/status');
      expect(status.body).toMatchObject({ usedToday: 2, remainingToday: 0 });
      const stored = await db.one<{ n: number }>("SELECT count(*)::int AS n FROM coach_messages WHERE thread_id = $1 AND role = 'user'", [t.id]);
      expect(stored.n).toBe(2);
      // The quota is per user.
      const other = await onboardedUser(server.baseUrl);
      const ot = await newThread(other);
      expect((await other.post(`/api/coach/threads/${ot.id}/messages`, { content: 'What is a deload?' })).status).toBe(200);
    } finally {
      config.ai.coachDailyLimit = limit;
    }
  });

  it('cannot exceed the quota with concurrent requests', async () => {
    const limit = config.ai.coachDailyLimit;
    config.ai.coachDailyLimit = 3;
    try {
      const user = await onboardedUser(server.baseUrl);
      const t = await newThread(user);
      const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) => user.post(`/api/coach/threads/${t.id}/messages`, { content: `What is a deload? #${i}` })),
      );
      expect(results.filter((r) => r.status === 200)).toHaveLength(3);
      expect(results.filter((r) => r.status === 429)).toHaveLength(3);
      const stored = await db.one<{ n: number }>("SELECT count(*)::int AS n FROM coach_messages WHERE thread_id = $1 AND role = 'user'", [t.id]);
      expect(stored.n).toBe(3);
    } finally {
      config.ai.coachDailyLimit = limit;
    }
  });

  it('replays a duplicate submission with the same idempotency key', async () => {
    const t = await newThread(alice);
    const headers = { 'idempotency-key': `coach-idem-${Date.now()}` };
    const a = await alice.post(`/api/coach/threads/${t.id}/messages`, { content: 'What is a deload?' }, { headers });
    const b = await alice.post(`/api/coach/threads/${t.id}/messages`, { content: 'What is a deload?' }, { headers });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(b.headers.get('idempotent-replayed')).toBe('true');
    expect(b.body.reply.id).toBe(a.body.reply.id);
    const stored = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM coach_messages WHERE thread_id = $1', [t.id]);
    expect(stored.n).toBe(2);
  });

  it('works for a user who has not completed onboarding', async () => {
    const fresh = await registerUser(server.baseUrl);
    const t = await newThread(fresh);
    const res = await fresh.post(`/api/coach/threads/${t.id}/messages`, { content: 'Am I eating enough protein?' });
    expect(res.status).toBe(200);
    expect(res.body.reply.content).toMatch(/targets aren't available yet/);
  });
});
