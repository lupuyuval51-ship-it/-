import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePathDraft, privateGenerationInput, generatedPathSchema, type PathGenerationInput, type GeneratedPathDraft } from '../src/lib/server/path-generation';
import { DEFAULT_AI_MODEL, type StructuredAIProvider, type StructuredAIRequest } from '../src/lib/server/ai-provider';
import { claudeStream } from './helpers/claude-reply';
import { ApiError, guestSession } from '../src/lib/server/auth';
import { catalog, initialize, pathById, state } from '../src/lib/server/store';
import { enroll, submitTask } from '../src/lib/server/learning';
import { one, run } from '../src/lib/server/db';
import { getDaily } from '../src/lib/server/games';
import { handle } from '../src/lib/server/router';
import { learningPaths } from '../src/lib/content';

process.env.LEVELUP_DB_PATH = ':memory:';
const input: PathGenerationInput = { skill: 'Website design', goal: 'Build a small accessible personal website', level: 'beginner', dailyMinutes: 20, targetDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), styles: ['practice', 'games'] };
let ownerId = '', otherId = '', ownerCookie = '', otherCookie = '';
function fixture(): GeneratedPathDraft {
  const path = learningPaths[0];
  return generatedPathSchema.parse({ title: path.title, description: path.description, category: path.category, durationDays: path.durationDays, chapters: path.chapters.map(chapter => ({ title: chapter.title, tasks: chapter.tasks.map(task => ({ title: task.title, description: task.description, objective: task.objective, minutes: task.minutes, xp: Math.min(120, task.xp), instructions: task.instructions, example: task.example, hints: task.hints, question: task.question, type: task.type })) })) });
}
function account() {
  const created = guestSession({ displayName: 'PRIVATE_PROFILE_NAME' });
  return { id: created.userId, cookie: created.cookie.split(';')[0] };
}
before(async () => { initialize(); const owner = account(), other = account(); ownerId = owner.id; ownerCookie = owner.cookie; otherId = other.id; otherCookie = other.cookie; });
async function api(path: string, body: unknown, cookie: string) {
  const response = await handle(new Request(`http://localhost:3000/api/${path}`, { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json', cookie }, body: JSON.stringify(body) }), path.split('/'));
  return { status: response.status, data: await response.json() };
}
test('no-key generation distinguishes curated skills from honest general study templates', async () => {
  const known = await generatePathDraft(input); assert.equal(known.source, 'demo-curated'); assert.equal(known.path.id, 'website'); assert.equal(known.isNew, false); assert.ok(known.notice.en.includes('not a newly AI-generated'));
  const astronomy = await generatePathDraft({ ...input, skill: 'Astronomy', goal: 'Explain five constellations with a small illustrated guide' });
  assert.equal(astronomy.source, 'demo-study'); assert.equal(astronomy.isNew, true); assert.equal(astronomy.isDemo, true); assert.match(astronomy.path.title.en, /Astronomy/); assert.ok(!JSON.stringify(astronomy.path).includes('HTML')); assert.equal(astronomy.path.chapters.length, 3);
  const tasks = astronomy.path.chapters.flatMap(chapter => chapter.tasks); assert.equal(tasks.length, 6); assert.equal(tasks.at(-1)!.type, 'project'); assert.ok(tasks.every(task => task.question.options.en.length === 3 && task.instructions.en.length >= 2)); assert.ok(astronomy.notice.en.includes('not an expert course'));
});
test('structured provider retries schema failures once and enforces reward bounds', async () => {
  let calls = 0;
  const provider: StructuredAIProvider = { async generate() { calls++; const draft = fixture(); if (calls === 1) draft.chapters.splice(2); return draft; } };
  const result = await generatePathDraft(input, provider); assert.equal(calls, 2); assert.equal(result.source, 'ai'); assert.equal(result.isDemo, false); assert.ok(result.path.chapters.flatMap(chapter => chapter.tasks).every(task => task.xp <= (task.type === 'project' ? 120 : 80))); assert.ok(result.path.chapters.flatMap(chapter => chapter.tasks).every(task => task.resources.length === 0));
  let rejectedCalls = 0;
  await assert.rejects(() => generatePathDraft(input, { async generate() { rejectedCalls++; return { ...fixture(), role: 'admin', canPlayFull3DGames: true }; } }), error => error instanceof ApiError && error.code === 'AI_GENERATION_UNAVAILABLE');
  assert.equal(rejectedCalls, 2);
  let semanticCalls = 0;
  const semantic = await generatePathDraft(input, { async generate() { semanticCalls++; const draft = fixture(); if (semanticCalls === 1) draft.chapters.at(-1)!.tasks.at(-1)!.type = 'practice'; return draft; } });
  assert.equal(semanticCalls, 2); assert.equal(semantic.path.chapters.at(-1)!.tasks.at(-1)!.type, 'project');
});
test('generation input minimizes private data and redacts contact details and secrets', async () => {
  const sensitive = { ...input, goal: 'Build my website; contact private-person@example.test or 0526262828. password=topsecret sk-test_secret_abcdefgh' };
  const request = privateGenerationInput(sensitive), serialized = JSON.stringify(request);
  assert.ok(!serialized.includes('private-person')); assert.ok(!serialized.includes('0526262828')); assert.ok(!serialized.includes('topsecret')); assert.ok(!serialized.includes('sk-test')); assert.ok(!serialized.includes('PRIVATE_PROFILE_NAME')); assert.deepEqual(Object.keys(request).sort(), ['audience', 'dailyMinutes', 'goal', 'learningStyles', 'level', 'restrictedDomain', 'skill', 'targetDate'].sort());
  let captured: StructuredAIRequest | undefined;
  await generatePathDraft(sensitive, { async generate(value) { captured = value; return fixture(); } });
  assert.equal(captured!.name, 'learning_path'); assert.ok(!JSON.stringify(captured!.input).includes('topsecret')); assert.equal(captured!.schema.additionalProperties, false);
});
test('live adapter posts a structured Claude request that carries no account data', async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.ANTHROPIC_API_KEY, originalProvider = process.env.AI_PROVIDER;
  let sent: Record<string, any> | undefined, target = '';
  process.env.ANTHROPIC_API_KEY = 'test-only-not-a-real-secret'; process.env.AI_PROVIDER = 'anthropic';
  globalThis.fetch = async (url, options) => {
    target = String(url instanceof Request ? url.url : url);
    sent = JSON.parse(String(options?.body));
    return claudeStream(JSON.stringify(fixture()));
  };
  try {
    const result = await generatePathDraft(input);
    assert.equal(result.source, 'ai');
    assert.equal(target, 'https://api.anthropic.com/v1/messages');
    assert.equal(sent!.model, DEFAULT_AI_MODEL);
    assert.equal(sent!.output_config.format.type, 'json_schema');
    assert.equal(sent!.output_config.format.schema.additionalProperties, false);
    assert.equal(sent!.thinking.type, 'adaptive');
    assert.equal(sent!.stream, true, 'a reasoning-sized budget must stream rather than block a single request');
    assert.ok(sent!.max_tokens >= 12000, 'reasoning needs headroom above the requested content');
    assert.ok(sent!.max_tokens <= 32000, 'the budget stays bounded so worst-case latency is finite');
    const submitted = JSON.parse(sent!.messages[0].content);
    assert.ok(!Object.hasOwn(submitted, 'userId'));
    assert.ok(!JSON.stringify(sent).includes('test-only-not-a-real-secret'));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = originalKey;
    if (originalProvider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = originalProvider;
  }
});
test('a foreign AI_PROVIDER fails loudly instead of quietly serving Demo content', async () => {
  const originalKey = process.env.ANTHROPIC_API_KEY, originalProvider = process.env.AI_PROVIDER;
  process.env.ANTHROPIC_API_KEY = 'test-only-not-a-real-secret'; process.env.AI_PROVIDER = 'openai';
  try {
    await assert.rejects(() => generatePathDraft(input), error => error instanceof ApiError && error.code === 'AI_UNAVAILABLE');
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = originalKey;
    if (originalProvider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = originalProvider;
  }
});
test('unsafe goals are blocked and health/finance templates stay educational', async () => {
  let calls = 0;
  await assert.rejects(() => generatePathDraft({ ...input, skill: 'Build a bomb' }, { async generate() { calls++; return fixture(); } }), error => error instanceof ApiError && error.code === 'UNSAFE_LEARNING_GOAL'); assert.equal(calls, 0);
  const health = await generatePathDraft({ ...input, skill: 'Healthy fitness habits', goal: 'Understand information about healthy habits' }); assert.equal(health.source, 'demo-study'); assert.ok(JSON.stringify(health.path).includes('Do not perform treatment, physical training or real-money transactions'));
  const finance = await generatePathDraft({ ...input, skill: 'Investment concepts', goal: 'Understand risk and diversification using fictional examples' }); assert.equal(finance.source, 'demo-study'); assert.equal(privateGenerationInput({ ...input, skill: 'Investment concepts' }).restrictedDomain, 'finance');
  const unsafeProvider = { async generate() { const draft = fixture(); draft.chapters[0].tasks[0].instructions.en[0] = 'Perform 12 reps with 50 kg before every study session.'; return draft; } };
  await assert.rejects(() => generatePathDraft({ ...input, skill: 'Fitness knowledge' }, unsafeProvider), error => error instanceof ApiError && error.code === 'AI_GENERATION_UNAVAILABLE');
});
test('generated paths persist atomically, stay private, and integrate with tasks and games', async () => {
  let captured: StructuredAIRequest | undefined;
  const result = await enroll(ownerId, input, { async generate(request) { captured = request; return fixture(); } });
  assert.equal(result.source, 'ai'); const pathId = result.path.id, enrollmentId = result.enrollmentId;
  assert.equal(result.path.isPrivate, true); assert.equal(one('SELECT user_id FROM private_path_owners WHERE path_id=?', pathId)!.user_id, ownerId); assert.equal(one('SELECT id FROM marketplace_paths WHERE path_id=?', pathId), undefined); assert.equal(one('SELECT COUNT(*) AS n FROM chapters WHERE path_id=?', pathId)!.n, 3);
  assert.ok(!JSON.stringify(captured!.input).includes(ownerId)); assert.ok(!JSON.stringify(captured!.input).includes('PRIVATE_PROFILE_NAME'));
  assert.equal(catalog(ownerId).find(path => path.id === pathId)!.isPrivate, true); assert.ok(!catalog(otherId).some(path => path.id === pathId)); assert.ok(!catalog().some(path => path.id === pathId));
  assert.equal((await api('enrollments', { pathId }, otherCookie)).status, 404); assert.equal((await api('favorites', { pathId }, otherCookie)).status, 404); assert.equal((await api('reports', { pathId, reason: 'Attempted unauthorized access' }, otherCookie)).status, 404);
  const current = state(one('SELECT * FROM users WHERE id=?', ownerId)!); assert.equal(current.privatePaths.length, 1); assert.equal(current.privatePaths[0].chapters[0].tasks[0].question.answer, undefined);
  const full = pathById(pathId), first = full.chapters[0].tasks[0];
  const completed = submitTask(ownerId, { enrollmentId, taskId: first.id, text: 'I completed a small accessible-page planning exercise.', answer: first.question.answer, difficulty: 'right' }); assert.equal(completed.xp, first.xp);
  const daily = getDaily(ownerId, 'build-path', 'future-city'); assert.equal(daily.game.questions.length, 8); assert.equal(daily.game.questions[0].answer, undefined); assert.ok(daily.game.seed.includes(pathId));
  let unnecessaryCalls = 0; await assert.rejects(() => enroll(ownerId, { ...input, skill: 'Another subject' }, { async generate() { unnecessaryCalls++; return fixture(); } }), error => error instanceof ApiError && error.code === 'PATH_LIMIT'); assert.equal(unnecessaryCalls, 0);
  assert.equal((await api('enrollments', { pathId }, ownerCookie)).status, 200, 'owner may reopen their own generated enrollment');
});
test('invalid provider output saves nothing and concurrent generation cannot exceed the plan cap', async () => {
  const before = one('SELECT COUNT(*) AS n FROM learning_paths')!.n;
  let calls = 0;
  await assert.rejects(() => enroll(otherId, input, { async generate() { calls++; const draft = fixture(); draft.chapters[0].tasks[0].xp = 99999 as 80; return draft; } }), error => error instanceof ApiError && error.code === 'AI_GENERATION_UNAVAILABLE'); assert.equal(calls, 2); assert.equal(one('SELECT COUNT(*) AS n FROM learning_paths')!.n, before); assert.equal(one('SELECT COUNT(*) AS n FROM private_path_owners WHERE user_id=?', otherId)!.n, 0);
  const provider = { async generate() { return fixture(); } };
  const results = await Promise.allSettled([enroll(otherId, input, provider), enroll(otherId, input, provider)]); assert.equal(results.filter(result => result.status === 'fulfilled').length, 1); assert.equal(one('SELECT COUNT(*) AS n FROM private_path_owners WHERE user_id=?', otherId)!.n, 1); assert.equal(one("SELECT COUNT(*) AS n FROM path_enrollments WHERE user_id=? AND status='active'", otherId)!.n, 1);
  assert.equal(one('SELECT COUNT(*) AS n FROM learning_paths')!.n, before + 1);
});
test('custom skill HTTP enrollment works without a key and returns an explicit Demo source', async () => {
  const user = account();
  const result = await api('enrollments', { ...input, skill: 'Botanical illustration', goal: 'Create three annotated plant sketches' }, user.cookie);
  assert.equal(result.status, 200, JSON.stringify(result.data)); assert.equal(result.data.source, 'demo-study'); assert.equal(result.data.path.isPrivate, true); assert.ok(result.data.path.title.en.includes('Botanical illustration')); assert.equal(result.data.state.enrollments.length, 1); assert.equal(result.data.state.privatePaths.length, 1); assert.ok(result.data.sourceNotice.he.includes('תבנית'));
  run('DELETE FROM rate_limits WHERE key=?', `path-generation:${user.id}`);
});
