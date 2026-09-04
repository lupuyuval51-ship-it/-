import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handle } from '../src/lib/server/router';
import { all, one, pruneExpired, readJson, run } from '../src/lib/server/db';
import { dayIn } from '../src/lib/server/store';
import { learningPaths } from '../src/lib/content';
import { generateGameDraft } from '../src/lib/server/game-generation';
import { ApiError } from '../src/lib/server/auth';
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
/** There is no sign-up form any more: an account opens on demand and the cookie is the credential. */
const adminCookie = () => admin;
async function registered(label: string, birthYear?: number) {
  const created = await request('auth/guest', { displayName: `Test ${label}`.slice(0, 60) });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  if (birthYear) assert.equal((await request('settings', { birthYear }, created.cookie)).status, 200);
  return { cookie: created.cookie, id: created.data.user.id };
}
before(async () => {
  const user = await registered('learner', 2000); learner = user.cookie; userId = user.id;
  other = (await registered('other', 2000)).cookie;
  admin = (await request('auth/demo', { role: 'admin' })).cookie;
});
// Each suite models a separate visit. Keep the per-minute protection live within a suite.
beforeEach(() => { run("DELETE FROM rate_limits WHERE key LIKE 'api:%'"); });
test('an account opens with no form, resumes on repeat, and staff sign-in stays password-only', async () => {
  const opened = await request('auth/guest', {});
  assert.equal(opened.status, 201, JSON.stringify(opened.data));
  assert.ok(opened.cookie, 'the session cookie is the only credential');
  assert.equal(opened.data.user.role, 'learner');
  assert.match(opened.data.user.email, /@guest\.invalid$/);
  assert.equal(opened.data.profile.birthYear, 0, 'no stated age until settings says otherwise');
  assert.equal(opened.data.profile.privacy, 'private', 'an unstated age stays minor-safe');
  const resumed = await request('auth/guest', {}, opened.cookie);
  assert.equal(resumed.status, 200, 'a repeat click resumes rather than stranding the account');
  assert.equal(resumed.data.user.id, opened.data.user.id);
  assert.equal(one('SELECT COUNT(*) AS n FROM users WHERE email=?', opened.data.user.email)!.n, 1);
  const stored = one('SELECT password_hash FROM users WHERE id=?', opened.data.user.id)!.password_hash;
  assert.match(stored, /^[0-9a-f]{32}:[0-9a-f]{128}$/, 'a guest carries an unusable random hash, not a chosen password');
  assert.equal((await request('auth/login', { email: opened.data.user.email, password: stored.slice(0, 64) })).status, 401, 'a guest can never be signed into by password');
  for (const gone of ['auth/register', 'auth/verify', 'auth/forgot', 'auth/reset', 'auth/parent', 'auth/resend']) {
    assert.equal((await request(gone, { email: 'someone@example.test', token: 'x'.repeat(40), password: 'StrongPassword123!' })).status, 404, `${gone} must no longer exist`);
  }
  await request('auth/logout', {}, opened.cookie);
  assert.equal((await request('state', undefined, opened.cookie)).status, 401);
});
test('a guest deletes the account by confirmation, since it never had a password', async () => {
  const doomed = await registered('deletes');
  assert.equal((await request('account/delete', {}, doomed.cookie)).status, 403, 'deletion needs an explicit confirmation');
  assert.equal((await request('account/delete', { confirm: true }, doomed.cookie)).status, 200);
  assert.equal((await request('state', undefined, doomed.cookie)).status, 401);
  assert.ok(all('SELECT * FROM admin_actions WHERE action=? AND target_id=?', 'account.delete', doomed.id).length);
});
test('an unstated age stays minor-safe until settings names an adult year', async () => {
  const unknown = await registered('unstated');
  const settings = await request('settings', { privacy: 'public', role: 'admin', plan: 'PRO' }, unknown.cookie);
  assert.equal(settings.data.state.profile.privacy, 'private', 'privacy cannot be opened without a stated adult age');
  assert.equal(settings.data.state.user.role, 'learner'); assert.equal(settings.data.state.plan, 'FREE');
  assert.equal((await request('orders', { plan: 'BASIC' }, unknown.cookie)).data.code, 'PAYER_AUTHORIZATION_REQUIRED');
  const minor = await registered('minor', new Date().getUTCFullYear() - 11);
  assert.equal((await request('orders', { plan: 'BASIC' }, minor.cookie)).data.code, 'PAYER_AUTHORIZATION_REQUIRED');
  assert.equal((await request('settings', { privacy: 'public' }, minor.cookie)).data.state.profile.privacy, 'private');
  const adult = await registered('adult', 1990);
  assert.equal((await request('settings', { privacy: 'public' }, adult.cookie)).data.state.profile.privacy, 'public', 'a stated adult year unlocks a public profile');
  assert.equal((await request('orders', { plan: 'BASIC' }, adult.cookie)).status, 200);
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
  assert.equal((await request('account/delete', { password: 'wrong' }, other)).status, 403); assert.equal((await request('account/delete', { confirm: true }, other)).status, 200); assert.equal((await request('state', undefined, other)).status, 401);
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
  const retired = await registered('retired path');
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
  const payer = await registered('reupload', 1990);
  const order = await request('orders', { plan: 'BASIC' }, payer.cookie);
  assert.equal(order.status, 200, JSON.stringify(order.data));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64');
  const proof = (name: string) => { const form = new FormData(); form.set('purpose', 'payment'); form.set('orderId', order.data.order.id); form.set('file', new File([png], name, { type: 'image/png' })); return handle(new Request(`${origin}/api/uploads`, { method: 'POST', headers: { origin, cookie: payer.cookie }, body: form }), ['uploads']); };
  assert.equal((await proof('first.png')).status, 200);
  assert.equal((await request(`admin/orders/${order.data.order.id}`, { action: 'reject', note: 'Reference did not match.' }, admin)).status, 200);
  assert.equal((await proof('second.png')).status, 200, 'a rejected order still accepts a corrected proof');
  assert.equal(one('SELECT status FROM orders WHERE id=?', order.data.order.id)!.status, 'under_review');

  const creator = await registered('creator answers', 1995);
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
test('a learner cannot re-collect the daily reward by editing their own timezone', async () => {
  const zone = await registered('zone hopper', 1990);
  run("INSERT INTO subscriptions(id,user_id,plan_id,starts_at,expires_at,created_at,updated_at) VALUES(?,?,'BASIC',?,?,?,?)", 'sub-zone-hopper', zone.id, new Date().toISOString(), new Date(Date.now() + 86400000).toISOString(), new Date().toISOString(), new Date().toISOString());
  const daily = await request('games/daily', undefined, zone.cookie);
  assert.equal(daily.status, 200, JSON.stringify(daily.data));
  const gameId = daily.data.game.dailyGameId, questions = daily.data.game.questions.length;
  // Drive finishGame directly: the exploit is in how the reward day is derived, not in play.
  const finishOnce = async (attemptId: string) => {
    const time = new Date().toISOString();
    run("INSERT INTO daily_game_attempts(id,user_id,daily_game_id,status,started_at,score,correct,event_count,created_at,updated_at) VALUES(?,?,?,'playing',?,?,?,?,?,?)", attemptId, zone.id, gameId, time, questions * 100, questions, questions, time, time);
    return request('games/finish', { attemptId }, zone.cookie);
  };
  const first = await finishOnce('attempt-zone-1');
  assert.equal(first.status, 200, JSON.stringify(first.data));
  assert.ok(first.data.result.xp > 0, 'the first finish of the day is rewarded');
  const rewards = () => one('SELECT COUNT(*) AS n FROM xp_events WHERE user_id=? AND source=?', zone.id, 'daily-game')!.n;
  assert.equal(rewards(), 1);
  for (const [index, timezone] of ['Pacific/Kiritimati', 'Pacific/Midway', 'Asia/Tokyo'].entries()) {
    assert.equal((await request('settings', { timezone }, zone.cookie)).status, 200);
    const replay = await finishOnce(`attempt-zone-hop-${index}`);
    assert.equal(replay.status, 200, JSON.stringify(replay.data));
    assert.equal(replay.data.result.xp, 0, `switching to ${timezone} must not mint a second daily reward`);
  }
  assert.equal(rewards(), 1, 'the reward day is server-authoritative UTC, not the editable profile zone');
});
test('a creator is never sold their own marketplace path', async () => {
  const creator = await registered('self buyer', 1990);
  run("INSERT INTO subscriptions(id,user_id,plan_id,starts_at,expires_at,created_at,updated_at) VALUES(?,?,'PRO',?,?,?,?)", 'sub-self-buyer', creator.id, new Date().toISOString(), new Date(Date.now() + 86400000).toISOString(), new Date().toISOString(), new Date().toISOString());
  const tasks = Array.from({ length: 3 }, (_, index) => ({ title: `Self owned step ${index + 1}`, instructions: 'Work through one small example and record the result.' }));
  const published = await request('marketplace', { title: 'A path I created myself', description: 'Used to verify a creator is never charged for their own listing.', category: 'content', price: 40, durationDays: 14, tasks }, creator.cookie);
  assert.equal(published.status, 200, JSON.stringify(published.data));
  run("UPDATE marketplace_paths SET status='approved' WHERE id=?", published.data.pathId);
  const order = await request('orders', { marketplacePathId: published.data.pathId, payerAuthorized: true }, creator.cookie);
  assert.equal(order.data.code, 'ALREADY_OWNED', JSON.stringify(order.data));
  assert.equal(one('SELECT COUNT(*) AS n FROM orders WHERE user_id=? AND marketplace_path_id=?', creator.id, published.data.pathId)!.n, 0, 'no order row is created for a path the buyer already owns');
});
test('completing a task leaves a paused enrollment paused', async () => {
  const paused = await registered('pauser', 1990);
  const enrolled = await request('enrollments', { pathId: 'website', skill: 'Site building', level: 'beginner', dailyMinutes: 20, goal: 'Ship a first page', styles: ['practice'] }, paused.cookie);
  assert.equal(enrolled.status, 200, JSON.stringify(enrolled.data));
  const enrollmentId = enrolled.data.enrollmentId;
  assert.equal((await request(`enrollments/${enrollmentId}`, { status: 'paused' }, paused.cookie)).status, 200);
  const path = learningPaths.find(item => item.id === 'website')!;
  const first = path.chapters[0].tasks[0];
  const submitted = await request('tasks/submit', { enrollmentId, taskId: first.id, text: 'Documented the audience, the goal and three original examples for the page.', answer: first.question.answer, difficulty: 'right' }, paused.cookie);
  assert.equal(submitted.status, 200, JSON.stringify(submitted.data));
  assert.equal(one('SELECT status FROM path_enrollments WHERE id=?', enrollmentId)!.status, 'paused', 'finishing a task must not silently re-activate a paused path');
});
test('the auth routes carry a ceiling no attacker-chosen identifier can sidestep', async () => {
  run("DELETE FROM rate_limits WHERE key LIKE 'auth%'");
  let limited = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    // A fresh address every request would mint a fresh per-identifier bucket forever.
    const response = await request('auth/login', { email: `attacker-${attempt}@example.test`, password: 'NotTheRealPassword1!' });
    if (response.data.code === 'RATE_LIMITED') limited++;
  }
  assert.ok(limited > 0, 'a route-wide ceiling must stop unbounded blocking password hashing');
  const key = one("SELECT key FROM rate_limits WHERE key LIKE 'auth:auth/login:%' ORDER BY length(key) DESC LIMIT 1");
  if (key) assert.ok(key.key.length <= 280, 'the identifier is bounded before it becomes a primary key');
  run("DELETE FROM rate_limits WHERE key LIKE 'auth%'");
});
test('the demo game coach withholds answers until the quest has been finished', async () => {
  const miner = await registered('answer miner', 1990);
  run("INSERT INTO subscriptions(id,user_id,plan_id,starts_at,expires_at,created_at,updated_at) VALUES(?,?,'BASIC',?,?,?,?)", 'sub-answer-miner', miner.id, new Date().toISOString(), new Date(Date.now() + 86400000).toISOString(), new Date().toISOString(), new Date().toISOString());
  const daily = await request('games/daily', undefined, miner.cookie);
  const gameId = daily.data.game.dailyGameId;
  const explanations = readJson(one('SELECT data FROM daily_games WHERE id=?', gameId)!.data).questions.map((question: any) => question.explanation.he);
  const before = await request('games/ask', { gameId, message: 'הסבר לי את השאלה' }, miner.cookie);
  assert.equal(before.status, 200, JSON.stringify(before.data));
  assert.ok(!explanations.some((text: string) => before.data.message.content.includes(text)), 'no explanation may reach a learner who has not finished the quest');
  run("INSERT INTO daily_game_attempts(id,user_id,daily_game_id,status,started_at,finished_at,created_at,updated_at) VALUES(?,?,?,'completed',?,?,?,?)", 'attempt-answer-miner', miner.id, gameId, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), new Date().toISOString());
  const after = await request('games/ask', { gameId, message: 'הסבר לי את השאלה' }, miner.cookie);
  assert.equal(after.status, 200, JSON.stringify(after.data));
  assert.ok(explanations.some((text: string) => after.data.message.content.includes(text)), 'reviewing explanations after finishing stays available');
});
test('deleting an account removes its uploaded proofs from disk, not just from the API', async () => {
  const leaver = await registered('file leaver', 1990);
  const order = await request('orders', { plan: 'BASIC', payerAuthorized: true }, leaver.cookie);
  assert.equal(order.status, 200, JSON.stringify(order.data));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64');
  const form = new FormData(); form.set('purpose', 'payment'); form.set('orderId', order.data.order.id); form.set('file', new File([png], 'proof.png', { type: 'image/png' }));
  const uploaded = await (await handle(new Request(`${origin}/api/uploads`, { method: 'POST', headers: { origin, cookie: leaver.cookie }, body: form }), ['uploads'])).json();
  const stored = one('SELECT storage_name FROM payment_proofs WHERE id=?', uploaded.fileId)!.storage_name;
  const onDisk = join(process.env.LEVELUP_UPLOAD_DIR!, stored);
  assert.equal(existsSync(onDisk), true, 'the proof is written to private storage');
  assert.equal((await request('account/delete', { confirm: true }, leaver.cookie)).status, 200);
  assert.equal(existsSync(onDisk), false, 'a payment screenshot must not outlive the account that uploaded it');
});
test('a learner with no stated adult age never reaches the public leaderboard', async () => {
  const minor = await registered('board minor');
  const opted = await request('settings', { leaderboards: true }, minor.cookie);
  assert.equal(opted.status, 200, JSON.stringify(opted.data));
  assert.equal(opted.data.state.profile.leaderboards, false, 'the opt-in is refused without a stated adult year');
  const adult = await registered('board adult', 1990);
  assert.equal((await request('settings', { leaderboards: true }, adult.cookie)).data.state.profile.leaderboards, true);
});
test('an explicit dosage or securities instruction is refused whatever the topic was classified as', async () => {
  const fixture = () => ({ title: { he: 'זירת ידע', en: 'Knowledge arena' }, description: { he: 'תיאור', en: 'Description' }, arena: { layout: 'courtyard' as const, enemyCount: 2, obstacleCount: 6, ambience: 'day' as const, waveCount: 8 as const }, questions: Array.from({ length: 8 }, (_, index) => ({ prompt: { he: `שאלה ${index}`, en: `Question ${index}` }, options: { he: ['אחת', 'שתיים', 'שלוש'], en: ['One', 'Two', 'Three'] }, answer: 0, explanation: { he: 'הסבר', en: 'Explanation' }, hint: { he: 'רמז', en: 'Hint' }, topic: { he: 'נושא', en: 'Topic' } })) });
  const unsafe = fixture();
  unsafe.questions[0].explanation = { he: 'מינון מומלץ הוא שתי כפיות ביום.', en: 'The recommended dosage is two spoons a day.' };
  // "Baking bread" classifies as general, so the domain-gated half of the filter never runs.
  await assert.rejects(
    generateGameDraft({ topic: 'Baking bread', level: 'beginner', worldTheme: 'future-city', durationMinutes: 5 }, { async generate() { return unsafe; } }),
    (error: unknown) => error instanceof ApiError && error.code === 'AI_GENERATION_UNAVAILABLE',
  );
  const safe = await generateGameDraft({ topic: 'Baking bread', level: 'beginner', worldTheme: 'future-city', durationMinutes: 5 }, { async generate() { return fixture(); } });
  assert.equal(safe.source, 'ai', 'ordinary general content still passes');
});
test('a daily quest that outruns its question pool marks the extra slots as review', async () => {
  const player = await registered('repeat reader', 1990);
  const daily = await request('games/daily', undefined, player.cookie);
  assert.equal(daily.status, 200, JSON.stringify(daily.data));
  const prompts = daily.data.game.questions.map((q: any) => q.prompt.he);
  assert.equal(prompts.length, 8, 'the arena is built around eight waves');
  const reviews = prompts.filter((text: string) => text.startsWith('תרגול חוזר:'));
  assert.equal(reviews.length, 2, 'a six-question pool leaves exactly two repeats, and both say so');
  const bodies = prompts.map((text: string) => text.replace('תרגול חוזר: ', ''));
  assert.equal(new Set(bodies).size, 6, 'the repeats reuse the pool rather than inventing questions');
});
test('the admin reports tab receives the reported path rather than a raw row', async () => {
  const reporter = await registered('reporter', 1990);
  assert.equal((await request('reports', { pathId: 'website', reason: 'Please review a confusing instruction.' }, reporter.cookie)).status, 200);
  const admin = (await request('admin', undefined, adminCookie())).data;
  const report = admin.reports.find((row: any) => row.reason.startsWith('Please review'));
  assert.ok(report, 'the report reaches the console');
  assert.equal(report.pathId, 'website', 'the console reads pathId, so the payload must carry it');
  assert.ok(report.createdAt && report.status, 'the row is mapped, not passed through raw');
});
