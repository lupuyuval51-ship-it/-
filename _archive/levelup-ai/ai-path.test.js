import test from 'node:test';
import assert from 'node:assert/strict';

// The AI provider is configured from env at import time, so the key must be set
// before server.js (and through it src/config.js) is evaluated.
process.env.AI_API_KEY = 'test-key-not-a-real-credential';
process.env.AI_PROVIDER = 'anthropic';
const { server } = await import('../server.js');
const { reset } = await import('../src/store.js');

const realFetch = globalThis.fetch;
let modelResponse = null;
let lastRequest = null;
globalThis.fetch = async (url, init) => {
  if (!String(url).startsWith('https://api.anthropic.com/')) return realFetch(url, init);
  lastRequest = { url: String(url), headers: init.headers, body: JSON.parse(init.body) };
  return new Response(JSON.stringify({
    model: 'claude-opus-5',
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify(modelResponse) }]
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const task = n => ({
  title: `משימה ${n}`,
  goal: `מטרה מדידה ${n}`,
  minutes: 25,
  instructions: ['קרא את המטרה', 'בצע דוגמה אחת'],
  example: `דוגמה ${n}`,
  hints: ['התחל מהחלק הקטן', 'בדוק מול הקריטריון'],
  completion: `תוצר שמוכיח ${n}`,
  quiz: { prompt: `שאלה ${n}?`, options: ['נכון', 'לא', 'אולי', 'תמיד'], answerIndex: 0, explanation: 'הסבר' }
});
const validPath = {
  title: 'מסלול אישי לבדיקה',
  category: 'תכנות',
  description: 'תיאור המסלול',
  goal: 'להשלים פרויקט מדיד',
  achievement: 'הישג הבדיקה',
  finalProject: 'פרויקט מסכם',
  chapters: [
    { title: 'יסודות', tasks: [task(1), task(2)] },
    { title: 'תרגול', tasks: [task(3), task(4)] },
    { title: 'פרויקט', tasks: [task(5), task(6)] }
  ]
};

let base;
class Client {
  constructor() { this.cookie = ''; this.csrf = ''; }
  async request(path, { method = 'GET', body, headers = {} } = {}) {
    const h = { ...headers };
    if (body !== undefined) h['content-type'] = 'application/json';
    if (this.cookie) h.cookie = this.cookie;
    if (method !== 'GET' && this.csrf) h['x-csrf-token'] = this.csrf;
    const r = await realFetch(base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = r.headers.get('set-cookie');
    if (sc) this.cookie = sc.split(';')[0];
    let d; try { d = await r.json(); } catch { d = null; }
    return { status: r.status, data: d };
  }
  async registerAdult(tag) {
    const r = await this.request('/api/auth/register', { method: 'POST', body: { email: `${tag}${Date.now()}@example.com`, password: 'Adult1234', displayName: 'בוגר בדיקה', birthYear: 1998, acceptTerms: true } });
    assert.equal(r.status, 201);
    this.csrf = r.data.csrf;
    return r.data.user;
  }
}
const onboard = c => c.request('/api/onboarding', { method: 'POST', body: { skill: 'תכנות', goal: 'לבנות אתר אישי', level: 'beginner', dailyMinutes: 30, targetDate: '2026-12-01', styles: ['practice'] } });

test.before(async () => { reset(); await new Promise(r => server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(async () => { globalThis.fetch = realFetch; await new Promise(r => server.close(r)); });

test('onboarding builds a generated path from the model with server-assigned rewards', async () => {
  modelResponse = validPath;
  const c = new Client();
  await c.registerAdult('gen');
  const r = await onboard(c);
  assert.equal(r.status, 201);
  assert.equal(r.data.generated, true);
  const p = r.data.enrollment.path;
  assert.equal(p.title, 'מסלול אישי לבדיקה');
  assert.equal(p.generated, true);
  assert.equal(p.chapters.length, 3);
  assert.deepEqual(p.chapters.map(x => x.id), ['foundation', 'practice', 'project']);
  // Rewards and task ids come from the server, never from the model payload.
  assert.deepEqual(p.chapters.map(c => c.tasks.map(t => t.xp)), [[90, 90], [110, 110], [140, 140]]);
  assert.deepEqual(p.chapters.map(c => c.tasks.map(t => t.coins)), [[15, 15], [18, 18], [23, 23]]);
  assert(p.chapters.every(c => c.tasks.every(t => /^ai-(foundation|practice|project)-[12]$/.test(t.id))));
  assert(p.slug.startsWith('ai-'));
  // The request is a schema-constrained Messages API call carrying the key server-side only.
  assert.equal(lastRequest.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(lastRequest.body.model, 'claude-opus-5');
  assert.equal(lastRequest.body.output_config.format.type, 'json_schema');
  assert.equal(lastRequest.body.output_config.format.schema.properties.chapters.minItems, 3);
  assert.equal(lastRequest.headers['x-api-key'], 'test-key-not-a-real-credential');
  assert.equal(lastRequest.headers['anthropic-version'], '2023-06-01');
});

test('generated path is retrievable by its owner and rewards XP on completion', async () => {
  modelResponse = validPath;
  const c = new Client();
  await c.registerAdult('own');
  const on = await onboard(c);
  const slug = on.data.enrollment.pathSlug;
  const detail = await c.request(`/api/path/${encodeURIComponent(slug)}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.path.slug, slug);
  const before = (await c.request('/api/auth/me')).data.user.xp;
  const done = await c.request('/api/tasks/ai-foundation-1/complete', { method: 'POST', body: { text: 'סיימתי', difficulty: 'right' } });
  assert.equal(done.status, 200);
  assert.equal(done.data.user.xp, before + 90);
});

test('another user cannot open someone else\'s generated path', async () => {
  modelResponse = validPath;
  const owner = new Client();
  await owner.registerAdult('a');
  const slug = (await onboard(owner)).data.enrollment.pathSlug;
  const other = new Client();
  await other.registerAdult('b');
  const r = await other.request(`/api/path/${encodeURIComponent(slug)}`);
  assert.equal(r.status, 404);
});

test('malformed model output falls back to a built-in template', async () => {
  modelResponse = { title: 'חסר פרקים' };
  const c = new Client();
  await c.registerAdult('bad');
  const r = await onboard(c);
  assert.equal(r.status, 201);
  assert.equal(r.data.generated, false);
  assert.equal(r.data.enrollment.path.generated, undefined);
  assert(r.data.enrollment.path.chapters.length > 0);
});
