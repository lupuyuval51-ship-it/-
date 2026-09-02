import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handle } from '../src/lib/server/router';
import { all, one, pruneExpired, readJson, run } from '../src/lib/server/db';
import { dayIn } from '../src/lib/server/store';
import { learningPaths } from '../src/lib/content';
import { config, gameModes, worlds } from '../src/lib/server/config';

process.env.LEVELUP_DB_PATH = ':memory:';
process.env.LEVELUP_UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'levelup-tests-'));
const origin = 'http://localhost:3000';
let learner = '', admin = '', other = '', userId = '', enrollmentId = '';
async function request(path: string, data?: unknown, cookie = '', customOrigin = origin) {
  const headers: Record<string, string> = { origin: customOrigin };
  if (cookie) headers.cookie = cookie;
  if (data !== undefined) headers['content-type'] = 'application/json';
  const response = await handle(new Request(`${origin}/api/${path}`, { method: data === undefined ? 'GET' : 'POST', headers, body: data === undefined ? undefined : JSON.stringify(data) }), path.split('?')[0].split('/'));
  const result = await response.json();
  return { status: response.status, data: result, cookie: response.headers.get('set-cookie')?.split(';')[0] || '' };
}
async function registered(email: string, birthYear = 2000, parentEmail?: string) {
  const created = await request('auth/register', { email, password: 'CorrectPassword123!', displayName: 'Test learner', birthYear, consent: true, parentEmail });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  await request('auth/verify', { token: created.data.verification.token });
  if (created.data.parental) await request('auth/parent', { token: created.data.parental.token });
  const signedIn = await request('auth/login', { email, password: 'CorrectPassword123!', remember: true });
  assert.equal(signedIn.status, 200, JSON.stringify(signedIn.data));
  return { cookie: signedIn.cookie, id: signedIn.data.user.id };
}
before(async () => {
  const user = await registered('test@example.test'); learner = user.cookie; userId = user.id;
  other = (await registered('other@example.test')).cookie;
  admin = (await request('auth/demo', { role: 'admin' })).cookie;
});
// Each suite models a separate visit. Keep the per-minute protection live within a suite.
beforeEach(() => { run("DELETE FROM rate_limits WHERE key LIKE 'api:%'"); });
test('email registration, verification, reset and secure sessions', async () => {
  const malformed = await request('auth/register', { email: 'bad', password: 'a', consent: false }); assert.equal(malformed.status, 400);
  const created = await request('auth/register', { email: 'verify@example.test', password: 'StrongPassword123!', displayName: 'Verify account', birthYear: 2000, consent: true });
  assert.equal(created.status, 201);
  assert.equal((await request('auth/login', { email: 'verify@example.test', password: 'StrongPassword123!' })).data.code, 'EMAIL_NOT_VERIFIED');
  assert.equal((await request('auth/verify', { token: created.data.verification.token })).status, 200);
  assert.equal((await request('auth/verify', { token: created.data.verification.token })).status, 400);
  const login = await request('auth/login', { email: 'verify@example.test', password: 'StrongPassword123!' }); assert.ok(login.cookie);
  const reset = await request('auth/forgot', { email: 'verify@example.test' }); assert.ok(reset.data.reset.token);
  assert.equal((await request('auth/reset', { token: reset.data.reset.token, password: 'NewPassword456!' })).status, 200);
  assert.equal((await request('state', undefined, login.cookie)).status, 401, 'reset revokes old sessions');
  const newLogin = await request('auth/login', { email: 'verify@example.test', password: 'NewPassword456!' }); assert.equal(newLogin.status, 200);
  await request('auth/logout', {}, newLogin.cookie); assert.equal((await request('state', undefined, newLogin.cookie)).status, 401);
  assert.ok(!one('SELECT password_hash FROM users WHERE email=?', 'verify@example.test')!.password_hash.includes('NewPassword456'));
});
test('parent approval, server ownership, CSRF and safe settings', async () => {
  const year = new Date().getUTCFullYear() - 11;
  assert.equal((await request('auth/register', { email: 'child1@example.test', password: 'StrongPassword123!', displayName: 'Child account', birthYear: year, consent: true })).data.code, 'PARENT_CONSENT_REQUIRED');
  assert.equal((await request('auth/register', { email: 'child14@example.test', password: 'StrongPassword123!', displayName: 'Teen account', birthYear: new Date().getUTCFullYear() - 14, consent: true })).data.code, 'PARENT_CONSENT_REQUIRED');
  const child = await request('auth/register', { email: 'child2@example.test', password: 'StrongPassword123!', displayName: 'Child account', birthYear: year, parentEmail: 'parent@example.test', consent: true });
  await request('auth/verify', { token: child.data.verification.token });
  assert.equal((await request('auth/login', { email: 'child2@example.test', password: 'StrongPassword123!' })).data.code, 'PARENT_CONSENT_PENDING');
  await request('auth/parent', { token: child.data.parental.token });
  const childSession = (await request('auth/login', { email: 'child2@example.test', password: 'StrongPassword123!' })).cookie;
  const settings = await request('settings', { privacy: 'public', role: 'admin', plan: 'PRO' }, childSession);
  assert.equal(settings.data.state.profile.privacy, 'private'); assert.equal(settings.data.state.user.role, 'learner'); assert.equal(settings.data.state.plan, 'FREE');
  assert.equal((await request('orders', { plan: 'BASIC' }, childSession)).data.code, 'PAYER_AUTHORIZATION_REQUIRED');
  assert.equal((await request('settings', { displayName: 'Hacked' }, learner, 'https://evil.example')).data.code, 'CSRF_REJECTED');
  assert.equal((await request('admin', undefined, learner)).status, 403);
  assert.equal((await request('settings', { timezone: 'Not/AZone' }, learner)).status, 400);
});
test('all profile and game preferences persist and errors use the chosen language', async () => {
  const preferences = { displayName: 'Verified learner', locale: 'en', timezone: 'Europe/London', theme: 'light', coachStyle: 'professional', privacy: 'private', leaderboards: false, leagues: true, notifications: false, music: true, effects: false, streaks: false, reducedMotion: true, quality: 'low', sensitivity: 0.6, controlsSide: 'left', gameTutorial: true };
  const saved = await request('settings', preferences, learner); assert.equal(saved.status, 200);
  const reloaded = (await request('state', undefined, learner)).data;
  for (const [key, value] of Object.entries(preferences)) assert.equal(reloaded.profile[key], value, key);
  const englishError = await request('settings', { timezone: 'Fake/Zone' }, learner); assert.equal(englishError.data.error, 'Please check the input fields.');
  await request('settings', { locale: 'he', theme: 'dark', timezone: 'Asia/Jerusalem', coachStyle: 'supportive' }, learner);
  const hebrewError = await request('settings', { timezone: 'Fake/Zone' }, learner); assert.match(hebrewError.data.error, /הנתונים/); assert.ok(!hebrewError.data.error.includes('Please'));
});
test('catalog has eight complete paths and never exposes quiz answers', async () => {
  const result = await request('catalog'); assert.equal(result.status, 200); assert.equal(result.data.paths.length, 8);
  for (const path of result.data.paths) { assert.ok(path.chapters.length >= 3); for (const chapter of path.chapters) for (const task of chapter.tasks) { assert.ok(task.instructions.he.length); assert.equal(task.question.answer, undefined); } }
  assert.deepEqual(result.data.plans.map((plan: any) => plan.price), [0, 9, 19, 39]); assert.equal(result.data.bit.phone, '0526262828'); assert.equal(result.data.bit.url, null);
});
test('enrollment, ordered tasks, durable XP, streak and adaptation are idempotent', async () => {
  const enrolled = await request('enrollments', { pathId: 'website', dailyMinutes: 20, goal: 'Build a personal site', styles: ['practice'], level: 'beginner' }, learner); assert.equal(enrolled.status, 200, JSON.stringify(enrolled.data)); enrollmentId = enrolled.data.enrollmentId;
  const before = await request('state', undefined, learner), path = learningPaths[0], first = path.chapters[0].tasks[0], second = path.chapters[0].tasks[1];
  assert.equal((await request('enrollments', { pathId: 'app' }, learner)).data.code, 'PATH_LIMIT');
  assert.equal((await request('tasks/submit', { enrollmentId, taskId: second.id, text: 'Completed an actual exercise', difficulty: 'right' }, learner)).data.code, 'TASK_LOCKED');
  assert.equal((await request('tasks/submit', { enrollmentId, taskId: first.id, answer: (first.question.answer + 1) % 3 }, learner)).data.code, 'ANSWER_INCORRECT');
  assert.equal((await request('tasks/submit', { enrollmentId, taskId: first.id, text: 'An attempted cross-account submission' }, other)).status, 404);
  const completed = await request('tasks/submit', { enrollmentId, taskId: first.id, text: 'I created and checked the exercise.', answer: first.question.answer, difficulty: 'hard' }, learner);
  assert.equal(completed.status, 200, JSON.stringify(completed.data)); assert.equal(completed.data.state.xp, before.data.xp + first.xp); assert.equal(completed.data.state.streak, 1); assert.equal(completed.data.adaptation.needsReinforcement, true);
  assert.equal(completed.data.state.enrollments[0].targetDate, before.data.enrollments[0].targetDate); assert.ok(completed.data.state.achievements.length);
  assert.equal((await request('tasks/submit', { enrollmentId, taskId: first.id, text: 'I created and checked the exercise.' }, learner)).data.code, 'ALREADY_COMPLETED');
  assert.equal((await request('state', undefined, learner)).data.xp, completed.data.state.xp);
});
test('coach persists context and uses an explicitly labeled offline provider', async () => {
  const reply = await request('coach', { enrollmentId, message: 'אני צריך עזרה במשימה', style: 'supportive' }, learner); assert.equal(reply.status, 200, JSON.stringify(reply.data)); assert.equal(reply.data.message.isDemo, true); assert.ok(reply.data.message.content.includes('Demo')); assert.equal(reply.data.state.coachMessages.length, 2);
  const unsafe = await request('coach', { message: 'איזה מינון תרופה לקחת?' }, learner); assert.equal(unsafe.data.suggestion, 'ask-adult');
});
test('reinforcement changes the next practice, validates answers and grants XP once', async () => {
  const path = learningPaths[0], first = path.chapters[0].tasks[0], second = path.chapters[0].tasks[1];
  const guidance = await request(`tasks/guidance?enrollmentId=${enrollmentId}&taskId=${second.id}`, undefined, learner);
  assert.equal(guidance.status, 200); assert.equal(guidance.data.reinforcement.status, 'suggested'); assert.equal(guidance.data.reinforcement.question.answer, undefined); assert.ok(guidance.data.instructions.he.length > second.instructions.he.length);
  assert.equal((await request('tasks/reinforcement', { enrollmentId, answer: (first.question.answer + 1) % 3, text: 'I reviewed the source objective again.' }, learner)).data.code, 'ANSWER_INCORRECT');
  const before = (await request('state', undefined, learner)).data;
  const completed = await request('tasks/reinforcement', { enrollmentId, answer: first.question.answer, text: 'I reviewed the source objective and checked a smaller example.' }, learner);
  assert.equal(completed.status, 200, JSON.stringify(completed.data)); assert.equal(completed.data.state.xp, before.xp + 20); assert.equal(completed.data.state.enrollments[0].progress, before.enrollments[0].progress, 'optional practice does not inflate main path completion');
  assert.equal(completed.data.adaptation.reinforcement.status, 'completed');
  assert.equal((await request('tasks/reinforcement', { enrollmentId, answer: first.question.answer, text: 'I reviewed the source objective again.' }, learner)).status, 409);
});
test('manual bit order, private proof, approval, duplicate protection and dynamic expiry', async () => {
  for (const [plan, price] of [['BASIC', 9], ['PLUS', 19], ['PRO', 39]]) { const created = await request('orders', { plan }, learner); assert.equal(created.status, 200); assert.equal(created.data.order.amount, price); assert.equal(created.data.state.plan, 'FREE'); }
  const orders = (await request('state', undefined, learner)).data.orders, order = orders.find((item: any) => item.plan === 'BASIC');
  assert.equal((await request(`admin/orders/${order.id}`, { action: 'approve' }, learner)).status, 403);
  assert.equal((await request(`admin/orders/${order.id}`, { action: 'approve' }, admin)).status, 409, 'no approval without proof');
  const bad = new FormData(); bad.set('purpose', 'payment'); bad.set('orderId', order.id); bad.set('file', new File(['<svg onload="alert(1)"></svg>'], 'evil.svg', { type: 'image/svg+xml' }));
  let response = await handle(new Request(`${origin}/api/uploads`, { method: 'POST', headers: { origin, cookie: learner }, body: bad }), ['uploads']); assert.equal(response.status, 400);
  const form = new FormData(); form.set('purpose', 'payment'); form.set('orderId', order.id); form.set('file', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64')], 'proof.png', { type: 'image/png' }));
  response = await handle(new Request(`${origin}/api/uploads`, { method: 'POST', headers: { origin, cookie: learner }, body: form }), ['uploads']); const uploaded = await response.json(); assert.equal(response.status, 200, JSON.stringify(uploaded)); assert.equal(uploaded.state.plan, 'FREE'); assert.equal(uploaded.status, 'under_review');
  const hidden = await handle(new Request(`${origin}/api/files/${uploaded.fileId}`, { headers: { cookie: other } }), ['files', uploaded.fileId]); assert.equal(hidden.status, 404);
  const visible = await handle(new Request(`${origin}/api/files/${uploaded.fileId}`, { headers: { cookie: admin } }), ['files', uploaded.fileId]); assert.equal(visible.status, 200); assert.match(visible.headers.get('cache-control')!, /no-store/);
  const approved = await request(`admin/orders/${order.id}`, { action: 'approve', note: 'Matched bank transfer manually in test.' }, admin); assert.equal(approved.status, 200, JSON.stringify(approved.data));
  assert.equal((await request('state', undefined, learner)).data.plan, 'BASIC'); assert.equal((await request(`admin/orders/${order.id}`, { action: 'approve' }, admin)).status, 409);
  assert.equal(one('SELECT COUNT(*) AS count FROM subscriptions WHERE order_id=?', order.id)!.count, 1);
  run('UPDATE subscriptions SET expires_at=? WHERE user_id=?', new Date(Date.now() - 1000).toISOString(), userId); assert.equal((await request('state', undefined, learner)).data.plan, 'FREE');
  run('UPDATE subscriptions SET expires_at=? WHERE user_id=?', new Date(Date.now() + 86400000).toISOString(), userId); assert.equal((await request('state', undefined, learner)).data.plan, 'BASIC');
});
test('Free preview is playable-data only and cannot start a full game', async () => {
  const daily = await request('games/daily?mode=answer-gates&world=future-city', undefined, other); assert.equal(daily.status, 200); assert.equal(daily.data.canPlay, false); assert.equal(daily.data.game.questions[0].answer, undefined);
  assert.equal((await request('games/start', { dailyGameId: daily.data.game.dailyGameId }, other)).data.code, 'UPGRADE_REQUIRED');
});
test('all six game definitions, trusted scoring, event replay and daily reward cap', async () => {
  let firstReward = 0;
  for (let modeIndex = 0; modeIndex < gameModes.length; modeIndex++) {
    const daily = await request(`games/daily?mode=${gameModes[modeIndex]}&world=${worlds[modeIndex % worlds.length]}`, undefined, learner); assert.equal(daily.status, 200); assert.equal(daily.data.game.questions.length, 8);
    const start = await request('games/start', { dailyGameId: daily.data.game.dailyGameId }, learner); assert.equal(start.status, 200, JSON.stringify(start.data));
    const attemptId = start.data.attemptId; assert.ok(start.data.startedAt);
    const unauthorized = await request('games/event', { attemptId, index: 0, answer: 0, elapsedMs: 1000 }, other); assert.equal(unauthorized.status, 404);
    assert.equal((await request('games/finish', { attemptId }, learner)).data.code, 'INCOMPLETE_GAME');
    const game = readJson(one('SELECT data FROM daily_games WHERE id=?', daily.data.game.dailyGameId)!.data);
    run('UPDATE daily_game_attempts SET started_at=? WHERE id=?', new Date(Date.now() - 10000).toISOString(), attemptId);
    assert.equal((await request('games/event', { attemptId, index: 1, answer: 0, elapsedMs: 1000 }, learner)).data.code, 'INVALID_SEQUENCE');
    for (let index = 0; index < game.questions.length; index++) {
      const correct = !(modeIndex === 1 && index === 0);
      const event = { attemptId, index, answer: correct ? game.questions[index].answer : (game.questions[index].answer + 1) % 3, elapsedMs: (index + 1) * 1000, score: 9999999 };
      const accepted = await request('games/event', event, learner); assert.equal(accepted.status, 200, JSON.stringify(accepted.data)); assert.equal(accepted.data.correct, correct); assert.ok(accepted.data.score <= (index + 1) * 300);
      const replay = await request('games/event', event, learner); assert.equal(replay.status, 200); assert.equal(replay.data.replayed, true); assert.equal(replay.data.score, accepted.data.score);
      assert.equal((await request('games/event', { ...event, answer: (event.answer + 1) % 3 }, learner)).status, 409);
    }
    const finish = await request('games/finish', { attemptId }, learner); assert.equal(finish.status, 200, JSON.stringify(finish.data)); assert.equal(finish.data.result.correct, modeIndex === 1 ? 7 : 8); assert.equal(finish.data.result.status, 'completed');
    if (modeIndex === 1) { assert.equal(finish.data.result.weakTopics.length, 1); assert.equal(finish.data.state.enrollments[0].adaptation.gameReview.weakTopics.length, 1); }
    if (modeIndex === 0) { assert.ok(finish.data.result.xp > 0); firstReward = finish.data.result.xp; } else assert.equal(finish.data.result.xp, 0, 'practice modes cannot farm daily rewards');
    const repeatedFinish = await request('games/finish', { attemptId }, learner); assert.equal(repeatedFinish.status, 200); assert.equal(repeatedFinish.data.state.xp, finish.data.state.xp);
  }
  assert.equal(one("SELECT SUM(xp) AS xp FROM xp_events WHERE user_id=? AND source='daily-game'", userId)!.xp, firstReward);
});
test('suspicious timing flagged and never rewards, admin moderation and ownership', async () => {
  const daily = await request('games/daily?mode=answer-gates&world=future-city', undefined, learner), started = await request('games/start', { dailyGameId: daily.data.game.dailyGameId }, learner);
  const suspect = await request('games/event', { attemptId: started.data.attemptId, index: 0, answer: 0, elapsedMs: 1 }, learner); assert.equal(suspect.data.code, 'SUSPICIOUS_ATTEMPT'); assert.equal(one('SELECT suspicious FROM daily_game_attempts WHERE id=?', started.data.attemptId)!.suspicious, 1);
  const otherWorld = await request('games/daily?mode=answer-gates&world=sky-island', undefined, learner); assert.equal(otherWorld.data.attemptsRemaining, 0); assert.equal((await request('games/start', { dailyGameId: otherWorld.data.game.dailyGameId }, learner)).data.code, 'ATTEMPTS_EXHAUSTED', 'world switching cannot reset attempt limits');
  const adminView = await request('admin', undefined, admin); assert.ok(adminView.data.suspiciousAttempts.length); assert.ok(adminView.data.logs.some((event: any) => event.action === 'payment.approved'));
  assert.equal((await request(`admin/games/${daily.data.game.dailyGameId}`, { action: 'disable' }, admin)).status, 200); assert.equal((await request('games/start', { dailyGameId: daily.data.game.dailyGameId }, learner)).data.code, 'GAME_UNAVAILABLE');
});
test('creator moderation and paid content stay private until an approved purchase', async () => {
  const created = await request('marketplace', { title: 'Private paid curriculum', description: 'A public summary of a genuinely paid practice sequence.', category: 'design', price: 45.5, tasks: [{ title: 'Gather references', instructions: 'PRIVATE_LESSON_ALPHA: collect three licensed visual references.' }, { title: 'Design a draft', instructions: 'PRIVATE_LESSON_BETA: build a simple hierarchy from the references.' }, { title: 'Review and improve', instructions: 'PRIVATE_LESSON_GAMMA: compare your draft with the three design goals.' }] }, admin);
  assert.equal(created.status, 200, JSON.stringify(created.data)); const pathId = created.data.pathId;
  assert.ok(!(await request('catalog')).data.paths.some((path: any) => path.id === pathId));
  assert.equal((await request(`admin/marketplace/${pathId}`, { action: 'approve', note: 'Verified content and sequence questions.' }, admin)).status, 200);
  const preview = (await request('catalog')).data.paths.find((path: any) => path.id === pathId); assert.ok(preview.previewOnly); assert.ok(!JSON.stringify(preview).includes('PRIVATE_LESSON_')); assert.equal(preview.chapters[0].tasks[0].question, undefined);
  assert.equal((await request('enrollments', { pathId }, learner)).data.code, 'PURCHASE_REQUIRED');
  const order = (await request('orders', { marketplacePathId: pathId }, learner)).data.order; assert.equal(order.amount, 45.5);
  const form = new FormData(); form.set('purpose', 'payment'); form.set('orderId', order.id); form.set('file', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64')], 'marketplace-proof.png', { type: 'image/png' }));
  const upload = await handle(new Request(`${origin}/api/uploads`, { method: 'POST', headers: { origin, cookie: learner }, body: form }), ['uploads']); assert.equal(upload.status, 200);
  assert.ok((await request('catalog', undefined, learner)).data.paths.find((path: any) => path.id === pathId).previewOnly);
  assert.equal((await request(`admin/orders/${order.id}`, { action: 'approve' }, admin)).status, 200);
  const owned = (await request('catalog', undefined, learner)).data.paths.find((path: any) => path.id === pathId); assert.equal(owned.previewOnly, false); assert.ok(JSON.stringify(owned).includes('PRIVATE_LESSON_ALPHA')); assert.equal(owned.chapters[0].tasks[0].question.answer, undefined);
  assert.ok((await request('catalog', undefined, other)).data.paths.find((path: any) => path.id === pathId).previewOnly);
  const sale = one('SELECT * FROM marketplace_sales WHERE order_id=?', order.id)!; assert.equal(sale.amount, 45.5); assert.equal(sale.commission, 9.1); assert.equal(sale.creator_amount, 36.4);
  assert.equal((await request(`enrollments/${enrollmentId}`, { status: 'paused' }, learner)).status, 200);
  assert.equal((await request('enrollments', { pathId }, learner)).status, 200);
});
test('admin price changes affect new snapshots, preserving existing order amounts', async () => {
  const old = (await request('state', undefined, learner)).data.orders.find((order: any) => order.plan === 'BASIC'); assert.equal(old.amount, 9);
  assert.equal((await request('admin/plans/BASIC', { action: 'set-price', price: 11 }, admin)).status, 200);
  const catalog = (await request('catalog')).data; assert.equal(catalog.plans.find((plan: any) => plan.id === 'BASIC').price, 11); assert.ok(catalog.categories.find((category: any) => category.id === 'math').title.he);
  const newer = await request('orders', { plan: 'BASIC' }, learner); assert.equal(newer.data.order.amount, 11); assert.equal(one('SELECT amount FROM orders WHERE id=?', old.id)!.amount, 9);
  await request('admin/plans/BASIC', { action: 'set-price', price: 9 }, admin);
});
test('favorites, enrollment-gated reviews, reporting, privacy export and deletion', async () => {
  assert.equal((await request('favorites', { pathId: 'website' }, learner)).data.favorite, true); assert.equal((await request('favorites', { pathId: 'website' }, learner)).data.favorite, false);
  assert.equal((await request('reviews', { pathId: 'app', rating: 5, comment: 'This is a real review' }, learner)).status, 403);
  assert.equal((await request('reviews', { pathId: 'website', rating: 4, comment: 'The tasks were useful.' }, learner)).status, 200);
  assert.equal((await request('reports', { pathId: 'website', reason: 'Please review a confusing instruction.' }, learner)).status, 200);
  const exportResponse = await handle(new Request(`${origin}/api/export`, { headers: { cookie: learner } }), ['export']); assert.equal(exportResponse.status, 200); const text = await exportResponse.text(); assert.ok(!text.includes('password_hash')); assert.ok(!text.includes('storage_name'));
  assert.equal((await request('account/delete', { password: 'wrong' }, other)).status, 403); assert.equal((await request('account/delete', { password: 'CorrectPassword123!' }, other)).status, 200); assert.equal((await request('state', undefined, other)).status, 401);
  assert.ok(all('SELECT * FROM admin_actions WHERE action=?', 'account.delete').length);
});
test('production mode rejects demo login and existing demo sessions', async () => {
  config.demo = false;
  try {
    assert.equal((await request('auth/demo', { role: 'admin' })).status, 404);
    assert.equal((await request('auth/login', { email: 'admin@levelup.demo', password: 'LevelupDemo2026!' })).status, 401);
    assert.equal((await request('admin', undefined, admin)).status, 401);
    assert.equal((await request('state', undefined, learner)).status, 200, 'real users continue to work');
  } finally { config.demo = true; }
});
test('rate limits reject excessive writes while saved data remains readable', async () => {
  run('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,expires_at=excluded.expires_at', `api:${userId}`, 180, Date.now() + 60000);
  assert.equal((await request('settings', { displayName: 'Too many changes' }, learner)).data.code, 'RATE_LIMITED');
  assert.equal((await request('state', undefined, learner)).status, 200);
});
test('a retired learning path degrades gracefully instead of breaking the account', async () => {
  const retired = await registered('retired-path@example.test');
  const created = await request('enrollments', { pathId: 'app', skill: 'App building', level: 'beginner', dailyMinutes: 20, goal: 'Ship a first screen', styles: ['practice'] }, retired.cookie);
  assert.equal(created.status, 200, JSON.stringify(created.data));
  run('UPDATE learning_paths SET deleted_at=? WHERE id=?', new Date().toISOString(), 'app');
  try {
    const state = await request('state', undefined, retired.cookie);
    assert.equal(state.status, 200, 'the whole account state must survive a removed path');
    const enrollment = state.data.enrollments.find((row: any) => row.pathId === 'app');
    assert.equal(enrollment.unavailable, true);
    assert.equal(enrollment.progress, 0, 'an unreadable path reports 0% rather than NaN');
    assert.equal((await request('games/daily', undefined, retired.cookie)).status, 200, 'the daily quest falls back to the starter path');
    assert.equal((await request('coach', { message: 'What should I practise next?' }, retired.cookie)).status, 200);
  } finally {
    run('UPDATE learning_paths SET deleted_at=NULL WHERE id=?', 'app');
  }
});
test('a rejected payment can be re-proved and generated creator answers are not always first', async () => {
  const payer = await registered('reupload@example.test');
  const order = await request('orders', { plan: 'BASIC' }, payer.cookie);
  assert.equal(order.status, 200, JSON.stringify(order.data));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64');
  const proof = (name: string) => { const form = new FormData(); form.set('purpose', 'payment'); form.set('orderId', order.data.order.id); form.set('file', new File([png], name, { type: 'image/png' })); return handle(new Request(`${origin}/api/uploads`, { method: 'POST', headers: { origin, cookie: payer.cookie }, body: form }), ['uploads']); };
  assert.equal((await proof('first.png')).status, 200);
  assert.equal((await request(`admin/orders/${order.data.order.id}`, { action: 'reject', note: 'Reference did not match.' }, admin)).status, 200);
  assert.equal((await proof('second.png')).status, 200, 'a rejected order still accepts a corrected proof');
  assert.equal(one('SELECT status FROM orders WHERE id=?', order.data.order.id)!.status, 'under_review');

  const creator = await registered('creator-answers@example.test', 1995);
  run("INSERT INTO subscriptions(id,user_id,plan_id,starts_at,expires_at,created_at,updated_at) VALUES(?,?,'PRO',?,?,?,?)", 'sub-creator-answers', creator.id, new Date().toISOString(), new Date(Date.now() + 86400000).toISOString(), new Date().toISOString(), new Date().toISOString());
  const tasks = Array.from({ length: 6 }, (_, index) => ({ title: `Creator step number ${index + 1}`, instructions: 'Work through one small example and record the result.' }));
  const published = await request('marketplace', { title: 'Creator sequence path', description: 'A path used to verify generated sequence questions stay answerable.', category: 'content', price: 0, durationDays: 14, tasks }, creator.cookie);
  assert.equal(published.status, 200, JSON.stringify(published.data));
  const generated = readJson(one('SELECT data FROM learning_paths WHERE id=?', published.data.pathId)!.data).chapters.flatMap((chapter: any) => chapter.tasks);
  assert.equal(generated.length, 6);
  for (const task of generated) assert.equal(task.question.options.he[task.question.answer], task.title.he, 'the marked answer must be the task itself');
  assert.ok(generated.some((task: any) => task.question.answer !== 0), 'answers must not always sit in the first slot');
});
test('expired sessions, tokens and rate-limit counters are swept away', async () => {
  const stale = new Date(Date.now() - 86400000).toISOString();
  run('INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,?)', 'expired-session-row', userId, stale, stale);
  run('INSERT INTO auth_tokens(id,user_id,kind,expires_at,created_at) VALUES(?,?,?,?,?)', 'expired-token-row', userId, 'verify', stale, stale);
  run('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,expires_at=excluded.expires_at', 'expired-limit-row', 5, Date.now() - 1000);
  pruneExpired(true);
  assert.equal(one('SELECT id FROM sessions WHERE id=?', 'expired-session-row'), undefined);
  assert.equal(one('SELECT id FROM auth_tokens WHERE id=?', 'expired-token-row'), undefined);
  assert.equal(one('SELECT key FROM rate_limits WHERE key=?', 'expired-limit-row'), undefined);
  assert.equal((await request('state', undefined, learner)).status, 200, 'live sessions are untouched');
});
test('day maths survives an unusable stored timezone and stays consistent', async () => {
  assert.equal(dayIn('Asia/Jerusalem'), dayIn('Asia/Jerusalem'), 'the cached formatter returns a stable day');
  assert.match(dayIn('Not/AZone'), /^\d{4}-\d{2}-\d{2}$/, 'an unknown zone falls back instead of throwing');
  const previous = one('SELECT preferences FROM profiles WHERE user_id=?', userId)!.preferences;
  run('UPDATE profiles SET preferences=? WHERE user_id=?', JSON.stringify({ ...readJson(previous), timezone: 'Not/AZone' }), userId);
  try {
    assert.equal((await request('state', undefined, learner)).status, 200, 'a broken zone must not take the account down');
    assert.equal((await request('games/daily', undefined, learner)).status, 200);
  } finally { run('UPDATE profiles SET preferences=? WHERE user_id=?', previous, userId); }
});
