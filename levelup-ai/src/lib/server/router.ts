import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { all, audit, id, now, one, readJson, run, transaction, type Row } from './db';
import { ApiError, assert, assertOrigin, clearSession, clientNetworkAddress, createSession, guestSession, isGuestAccount, login, passwordMatches, rateLimit, requireAdmin, sessionUser } from './auth';
import { config, plans } from './config';
import { approveOrder, catalog, initialize, state } from './store';
import { completeReinforcement, enroll, submitTask, taskGuidance, updateEnrollment } from './learning';
import { coach } from './coach';
import { finishGame, gameEvent, getDaily, leaderboard, startGame } from './games';
import { customGame, customGames, deleteCustomGame, generateGame } from './game-generation';
import { askGame, gameMessages } from './game-coach';
import { fileResponse, paymentAdapter, upload } from './payments';
import { adminAction, adminData, blockFriend, buyCosmetic, challenges, createMarketplace, favorite, report, review, saveSettings } from './community';
import { readLimitedBody } from './transport';
import { categories } from '../content';

function json(data: unknown, status = 200, cookie?: string) { return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...(cookie ? { 'Set-Cookie': cookie } : {}) } }); }
function localizedError(request: Request, message: string) {
  let locale = request.headers.get('x-levelup-locale') === 'en' ? 'en' : 'he';
  try { const user = sessionUser(request, false); if (user) locale = readJson(one('SELECT preferences FROM profiles WHERE user_id=?', user.id)?.preferences).locale || locale; } catch { /* A database outage still needs a readable error. */ }
  const separator = message.indexOf(' / ');
  return separator < 0 ? message : locale === 'en' ? message.slice(separator + 3) : message.slice(0, separator);
}
async function body(request: Request) {
  assert(request.headers.get('content-type')?.includes('application/json'), 415, 'נדרש תוכן JSON. / JSON content required.');
  const text = (await readLimitedBody(request, 1_000_000)).toString('utf8');
  try { return JSON.parse(text); } catch { throw new ApiError(400, 'הבקשה אינה תקינה. / Invalid JSON.'); }
}
export async function handle(request: Request, path: string[]) {
  try {
    initialize(); assertOrigin(request);
    const route = path.join('/'), method = request.method, url = new URL(request.url);
    if (route === 'health' && method === 'GET') return json({ ok: true, database: !!one('SELECT 1 AS ok'), mode: config.demo ? 'demo' : 'production' });
    if (route === 'catalog' && method === 'GET') {
      const user = sessionUser(request, false);
      return json({ paths: catalog(user?.id), plans: plans.map(plan => ({ ...plan, price: one('SELECT price FROM plans WHERE id=?', plan.id)?.price ?? plan.price })), bit: config.bit, categories, isDemo: config.demo });
    }
    if (route.startsWith('auth/')) return await authRoute(request, route, method);
    const user = sessionUser(request)!;
    if (method !== 'GET') rateLimit(`api:${user.id}`, 180, 60);
    if (route === 'state' && method === 'GET') return json(state(user));
    if (route === 'enrollments' && method === 'POST') return json({ ok: true, ...await enroll(user.id, await body(request)), state: state(user) });
    if (path[0] === 'enrollments' && path[1] && method === 'POST') return json({ ok: true, ...updateEnrollment(user.id, path[1], await body(request)), state: state(user) });
    if (route === 'tasks/submit' && method === 'POST') return json({ ok: true, ...submitTask(user.id, await body(request)), state: state(user) });
    if (route === 'tasks/reinforcement' && method === 'POST') return json({ ok: true, ...completeReinforcement(user.id, await body(request)), state: state(user) });
    if (route === 'tasks/guidance' && method === 'GET') { const input = z.object({ enrollmentId: z.string().min(1).max(100), taskId: z.string().min(1).max(100) }).parse({ enrollmentId: url.searchParams.get('enrollmentId'), taskId: url.searchParams.get('taskId') }); return json(taskGuidance(user.id, input.enrollmentId, input.taskId)); }
    if (route === 'coach' && method === 'POST') return json({ ok: true, ...await coach(user.id, await body(request)), state: state(user) });
    if (route === 'games/generate' && method === 'POST') return json({ ok: true, ...await generateGame(user.id, await body(request)) }, 201);
    if (route === 'games/custom' && method === 'GET') return json(customGames(user.id));
    if (path[0] === 'games' && path[1] === 'custom' && path.length === 3 && method === 'GET') return json(customGame(user.id, z.string().min(1).max(100).parse(path[2])));
    if (path[0] === 'games' && path[1] === 'custom' && path.length === 4 && path[3] === 'delete' && method === 'POST') return json({ ok: true, ...deleteCustomGame(user.id, z.string().min(1).max(100).parse(path[2])) });
    if (route === 'games/ask' && method === 'POST') return json({ ok: true, ...await askGame(user.id, await body(request)), state: state(user) });
    if (route === 'games/messages' && method === 'GET') return json(gameMessages(user.id, z.string().min(1).max(100).optional().parse(url.searchParams.get('gameId') || undefined)));
    if (route === 'games/daily' && method === 'GET') return json(getDaily(user.id, url.searchParams.get('mode'), url.searchParams.get('world')));
    if (route === 'games/start' && method === 'POST') { const input = z.object({ dailyGameId: z.string().max(100) }).parse(await body(request)); return json({ ok: true, ...startGame(user.id, input.dailyGameId) }); }
    if (route === 'games/event' && method === 'POST') return json({ ok: true, ...gameEvent(user.id, await body(request)) });
    if (route === 'games/finish' && method === 'POST') { const input = z.object({ attemptId: z.string().max(100) }).parse(await body(request)); return json({ ok: true, result: finishGame(user.id, input.attemptId), state: state(user) }); }
    if (route === 'leaderboard' && method === 'GET') return json({ leaderboard: leaderboard(user.id, url.searchParams.get('dailyGameId')), isDemo: config.demo });
    if (route === 'orders' && method === 'POST') return json({ ok: true, ...paymentAdapter.create(user.id, await body(request)), state: state(user) });
    if (route === 'orders' && method === 'GET') return json({ orders: state(user).orders, bit: config.bit });
    if (path[0] === 'orders' && path[1] && method === 'POST') { const input = z.object({ action: z.literal('cancel') }).parse(await body(request)); const order = one('SELECT * FROM orders WHERE id=? AND user_id=?', path[1], user.id); assert(order && ['awaiting_payment', 'created', 'rejected'].includes(order.status), 409, 'לא ניתן לבטל את ההזמנה במצב זה. / Order cannot be cancelled.'); run("UPDATE orders SET status='cancelled',updated_at=? WHERE id=? AND user_id=?", now(), path[1], user.id); audit(user.id, `payment.${input.action}`, path[1]); return json({ ok: true, state: state(user) }); }
    if (route === 'uploads' && method === 'POST') { rateLimit(`uploads:${user.id}`, 20, 3600); return json({ ok: true, ...await upload(user.id, request), state: state(user) }); }
    if (path[0] === 'files' && path[1] && method === 'GET') return await fileResponse(user, z.uuid().parse(path[1]));
    if (route === 'settings' && method === 'POST') {
      const input = await body(request);
      if (typeof input.privateProfile === 'boolean') input.privacy = input.privateProfile ? 'private' : 'public';
      if (typeof input.leaderboard === 'boolean') input.leaderboards = input.leaderboard;
      if (typeof input.graphics === 'string') input.quality = input.graphics;
      saveSettings(user.id, input); return json({ ok: true, state: state(user) });
    }
    if (route === 'favorites' && method === 'POST') { const input = z.object({ pathId: z.string().max(100) }).parse(await body(request)); return json({ ok: true, ...favorite(user.id, input.pathId), state: state(user) }); }
    if (route === 'reports' && method === 'POST') return json({ ok: true, ...report(user.id, await body(request)) });
    if (route === 'reviews' && method === 'POST') return json({ ok: true, ...review(user.id, await body(request)) });
    if (route === 'marketplace' && method === 'POST') return json({ ok: true, ...createMarketplace(user.id, await body(request)), state: state(user) });
    if (route === 'marketplace/mine' && method === 'GET') return json({ paths: all('SELECT mp.*,lp.data FROM marketplace_paths mp JOIN learning_paths lp ON lp.id=mp.path_id WHERE mp.creator_id=?', user.id) });
    if (route === 'challenges' && method === 'GET') return json({ challenges: state(user).challenges });
    if (route === 'challenges' && method === 'POST') return json({ ok: true, ...challenges(user.id, await body(request)), state: state(user) });
    if (path[0] === 'challenges' && path[2] === 'join' && method === 'POST') { const challenge = one("SELECT invite_code FROM challenges WHERE (id=? OR invite_code=?) AND status='active'", path[1], path[1].toUpperCase()); assert(challenge, 404, 'האתגר לא נמצא. / Challenge not found.'); return json({ ok: true, ...challenges(user.id, { action: 'join', code: challenge.invite_code }), state: state(user) }); }
    if (route === 'friends/block' && method === 'POST') { const input = z.object({ userId: z.string().max(100) }).parse(await body(request)); return json({ ok: true, ...blockFriend(user.id, input.userId) }); }
    if (route === 'cosmetics/buy' && method === 'POST') { const input = z.object({ itemId: z.string().max(100) }).parse(await body(request)); return json({ ok: true, ...buyCosmetic(user.id, input.itemId), state: state(user) }); }
    if (route === 'notifications/read' && method === 'POST') { run('UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL', now(), user.id); return json({ ok: true, state: state(user) }); }
    if (route === 'export' && method === 'GET') return new Response(JSON.stringify({ exportedAt: now(), ...state(user), generatedGames: customGames(user.id).games, gameMessages: all('SELECT m.id,m.role,m.content,m.created_at,c.game_id FROM ai_coach_messages m JOIN game_coach_contexts c ON c.message_id=m.id WHERE m.user_id=? ORDER BY m.created_at', user.id), reinforcements: all('SELECT enrollment_id,source_task_id,text,xp,created_at FROM reinforcement_submissions WHERE user_id=?', user.id), skills: all('SELECT skill_id,mastery,created_at FROM user_skills WHERE user_id=?', user.id), files: all('SELECT id,file_name,mime,bytes,purpose,created_at FROM payment_proofs WHERE user_id=? AND deleted_at IS NULL', user.id) }, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="levelup-data.json"', 'Cache-Control': 'no-store' } });
    // A guest holds no password, so the session plus an explicit confirmation is the proof of intent.
    if (route === 'account/delete' && method === 'POST') { const input = z.object({ password: z.string().max(128).optional(), confirm: z.boolean().optional() }).parse(await body(request)); assert(isGuestAccount(user) ? input.confirm === true : passwordMatches(input.password || '', user.password_hash), 403, isGuestAccount(user) ? 'יש לאשר את המחיקה. / Confirm the deletion.' : 'הסיסמה אינה נכונה. / Incorrect password.'); await deleteAccount(user); return json({ ok: true }, 200, clearSession(request)); }
    if (route === 'subscription/cancel' && method === 'POST') { run("UPDATE subscriptions SET status='cancelled',updated_at=? WHERE user_id=? AND status='active'", now(), user.id); audit(user.id, 'subscription.cancel', user.id); return json({ ok: true, state: state(user) }); }
    if (path[0] === 'admin') {
      const admin = requireAdmin(request);
      if (route === 'admin' && method === 'GET') return json({ ...adminData(), isDemo: config.demo });
      if (path[1] === 'orders' && path[2] && method === 'POST') { const input = z.object({ action: z.enum(['approve', 'reject']), note: z.string().max(1500).default('') }).parse(await body(request)); return json({ ok: true, order: approveOrder(admin.id, path[2], input.action, input.note), state: state(admin), admin: adminData() }); }
      if (path.length === 3 && method === 'POST') return json({ ok: true, ...adminAction(admin.id, path[1], path[2], await body(request)), admin: adminData() });
    }
    throw new ApiError(404, 'העמוד לא נמצא. / Endpoint not found.', 'NOT_FOUND');
  } catch (error) {
    if (error instanceof z.ZodError) return json({ error: localizedError(request, 'הנתונים אינם תקינים. בדקו את השדות המסומנים. / Please check the input fields.'), code: 'VALIDATION_ERROR', fields: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) }, 400);
    if (error instanceof ApiError) return json({ error: localizedError(request, error.message), code: error.code }, error.status);
    if (error instanceof Error && error.message === 'AI_UNAVAILABLE') return json({ error: localizedError(request, 'המאמן אינו זמין כרגע. ההודעה נשמרה, אפשר לנסות שוב בהמשך. / Coach unavailable. Your message is saved; please retry later.'), code: 'AI_UNAVAILABLE' }, 503);
    console.error('[LEVELUP API]', error instanceof Error ? error.message : 'Unknown server error');
    return json({ error: localizedError(request, 'אירעה שגיאת שרת. ההתקדמות שכבר נשמרה בטוחה. נסו שוב. / Server error. Previously saved progress is safe. Please retry.'), code: 'SERVER_ERROR' }, 500);
  }
}
async function authRoute(request: Request, route: string, method: string) {
  if (route === 'auth/me' && method === 'GET') return json(state(sessionUser(request)!));
  assert(method === 'POST', 405, 'Method not allowed.');
  if (route === 'auth/logout') return json({ ok: true }, 200, clearSession(request));
  const input = await body(request);
  const ip = clientNetworkAddress(request);
  if (ip) rateLimit(`auth-network:${ip}`, Number(process.env.AUTH_NETWORK_LIMIT || 300), 900);
  // The email is attacker-chosen, so a per-identifier bucket alone is no limit at all: a fresh
  // address mints a fresh bucket every request. Bound the key, then apply a route-wide ceiling
  // that no client can sidestep — auth/login burns ~54ms of blocking scrypt per attempt even for
  // unknown accounts, so an unbounded route is a single-threaded CPU exhaustion vector.
  const identifier = typeof input.email === 'string' ? input.email.trim().toLowerCase().slice(0, 254) : ip;
  if (identifier) rateLimit(`auth:${route}:${identifier}`, 15, 900);
  // auth/login is staff-only and burns blocking scrypt per attempt, so its ceiling is sized to
  // real staff traffic rather than to a crowd; the cheaper routes keep a looser bound.
  const routeCeiling = route === 'auth/login' ? Number(process.env.AUTH_LOGIN_LIMIT) || 30 : Number(process.env.AUTH_ROUTE_LIMIT) || 600;
  if (route !== 'auth/guest') rateLimit(`auth-route:${route}`, routeCeiling, 900);
  if (route === 'auth/guest') {
    // A repeat click must resume the existing account rather than stranding the previous one.
    const existing = sessionUser(request, false);
    if (existing) return json({ ...state(existing), state: state(existing) });
    // Accounts open without a form, so bulk creation is braked here. The global bucket is a short
    // burst window on purpose: an hour-long absolute cap would let any anonymous client spend it
    // and lock every real visitor out of opening an account for the rest of the hour.
    if (ip) rateLimit(`guest-network:${ip}`, Number(process.env.GUEST_NETWORK_LIMIT) || 20, 3600);
    rateLimit('guest-burst', Number(process.env.GUEST_BURST_LIMIT) || 60, 60);
    const guest = guestSession(input);
    const user = one('SELECT * FROM users WHERE id=?', guest.userId)!;
    return json({ ...state(user), state: state(user), isNewAccount: true }, 201, guest.cookie);
  }
  if (route === 'auth/demo') {
    assert(config.demo, 404, 'Demo mode is disabled.');
    const value = z.object({ role: z.enum(['learner', 'admin']).default('learner'), plan: z.enum(['FREE', 'BASIC']).optional() }).parse(input);
    const user = one('SELECT * FROM users WHERE id=? AND deleted_at IS NULL', value.role === 'admin' ? 'demo-admin' : value.plan === 'FREE' ? 'demo-free' : 'demo-learner');
    assert(user && !user.blocked, 403, 'חשבון Demo אינו זמין. / Demo account unavailable.');
    if (value.role === 'learner' && value.plan) transaction(() => {
      const time = now();
      run("UPDATE subscriptions SET status='cancelled',updated_at=? WHERE user_id=? AND status='active'", time, user.id);
      if (value.plan === 'BASIC') run('INSERT INTO subscriptions(id,user_id,plan_id,starts_at,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', id(), user.id, 'BASIC', time, new Date(Date.now() + 30 * 86400000).toISOString(), time, time);
      audit(user.id, 'demo.reset-plan', user.id, { plan: value.plan });
    });
    return json({ ...state(user), state: state(user) }, 200, createSession(user.id));
  }
  if (route === 'auth/login') { const result = login(input); return json({ ...state(result.user), state: state(result.user) }, 200, result.cookie); }
  throw new ApiError(404, 'Auth endpoint not found.');
}
async function deleteAccount(user: Row) {
  // Soft-deleting the row hid the proof from the API but left the file on disk forever, and a
  // payment screenshot carries a bank reference and a name. Collect the names inside the
  // transaction, then unlink outside it.
  const stored: string[] = [];
  transaction(() => {
    for (const row of all('SELECT storage_name FROM payment_proofs WHERE user_id=?', user.id)) {
      if (typeof row.storage_name === 'string' && /^[a-f0-9-]+\.bin$/.test(row.storage_name)) stored.push(row.storage_name);
    }
    const time = now();
    run('UPDATE users SET email=?,password_hash=?,deleted_at=?,updated_at=? WHERE id=?', `${id()}@deleted.invalid`, 'deleted', time, time, user.id);
    run('UPDATE profiles SET display_name=?,preferences=?,updated_at=? WHERE user_id=?', 'Deleted account', '{}', time, user.id);
    run('DELETE FROM sessions WHERE user_id=?', user.id); run('DELETE FROM auth_tokens WHERE user_id=?', user.id);
    run('DELETE FROM ai_coach_messages WHERE user_id=?', user.id); run('DELETE FROM notifications WHERE user_id=?', user.id); run('DELETE FROM leaderboards WHERE user_id=?', user.id);
    run('UPDATE payment_proofs SET deleted_at=?,updated_at=? WHERE user_id=?', time, time, user.id);
    run('UPDATE task_submissions SET text=?,link=NULL,file_id=NULL,updated_at=? WHERE user_id=?', '', time, user.id);
    run('UPDATE reinforcement_submissions SET text=?,updated_at=? WHERE user_id=?', '', time, user.id);
    run("UPDATE subscriptions SET status='cancelled',updated_at=? WHERE user_id=?", time, user.id);
    run('DELETE FROM reviews WHERE user_id=?', user.id); run('DELETE FROM favorites WHERE user_id=?', user.id);
    run('UPDATE marketplace_paths SET status=?,updated_at=? WHERE creator_id=?', 'withdrawn', time, user.id); run('UPDATE learning_paths SET deleted_at=?,updated_at=? WHERE id IN (SELECT path_id FROM private_path_owners WHERE user_id=?)', time, time, user.id);
    run('UPDATE daily_games SET is_active=0,updated_at=? WHERE id IN (SELECT game_id FROM generated_game_owners WHERE user_id=?)', time, user.id);
    run('UPDATE generated_game_owners SET topic=?,deleted_at=?,updated_at=? WHERE user_id=?', '', time, time, user.id);
    audit(user.id, 'account.delete', user.id, { method: 'soft-delete-and-personal-data-redaction', filesRemoved: stored.length });
  });
  const storage = resolve(process.env.LEVELUP_UPLOAD_DIR || resolve(process.cwd(), 'data', 'uploads'));
  for (const name of stored) await rm(resolve(storage, name), { force: true }).catch(() => {});
}
