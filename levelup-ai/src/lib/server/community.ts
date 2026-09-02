import { z } from 'zod';
import { assert } from './auth';
import { entitlements } from './config';
import { all, audit, id, now, one, readJson, run, transaction } from './db';
import { assertPathAccess, pathById, planFor, preferences } from './store';

const settingsSchema = z.object({ displayName: z.string().trim().min(2).max(60).optional(), locale: z.enum(['he', 'en']).optional(), timezone: z.string().max(80).refine(zone => { try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return true; } catch { return false; } }, 'Unknown timezone').optional(), theme: z.enum(['dark', 'light', 'system']).optional(), coachStyle: z.enum(['supportive', 'direct', 'energetic', 'professional']).optional(), privacy: z.enum(['private', 'public']).optional(), notifications: z.boolean().optional(), leaderboards: z.boolean().optional(), leagues: z.boolean().optional(), music: z.boolean().optional(), effects: z.boolean().optional(), streaks: z.boolean().optional(), reducedMotion: z.boolean().optional(), quality: z.enum(['auto', 'low', 'medium', 'high']).optional(), sensitivity: z.number().min(0.2).max(3).optional(), controlsSide: z.enum(['left', 'right']).optional(), gameTutorial: z.boolean().optional(), showTutorial: z.boolean().optional(), avatarId: z.string().max(100).optional() });
export function saveSettings(userId: string, data: unknown) {
  // displayName and birthYear live in their own columns; copies inside the JSON only go stale.
  const input = settingsSchema.parse(data), { displayName, birthYear, ...storedPreferences } = preferences(userId);
  if (input.avatarId) assert(one('SELECT id FROM payment_proofs WHERE id=? AND user_id=? AND purpose=? AND deleted_at IS NULL', input.avatarId, userId, 'avatar'), 400, 'תמונת פרופיל אינה תקינה. / Invalid profile image.');
  const { displayName: requestedName, ...requested } = input;
  const persisted = { ...storedPreferences, ...requested };
  if (new Date().getUTCFullYear() - birthYear < 18) persisted.privacy = 'private';
  const next = { ...persisted, displayName: requestedName || displayName, birthYear };
  run('UPDATE profiles SET display_name=?,preferences=?,updated_at=? WHERE user_id=?', next.displayName, JSON.stringify(persisted), now(), userId);
  if (input.leaderboards === false) run('DELETE FROM leaderboards WHERE user_id=?', userId);
  audit(userId, 'profile.update', userId, { fields: Object.keys(input) });
  return next;
}
export function favorite(userId: string, pathId: string) {
  assertPathAccess(userId, pathId);
  pathById(pathId);
  const existing = one('SELECT id FROM favorites WHERE user_id=? AND path_id=?', userId, pathId);
  if (existing) run('DELETE FROM favorites WHERE id=? AND user_id=?', existing.id, userId);
  else run('INSERT INTO favorites(id,user_id,path_id,created_at,updated_at) VALUES(?,?,?,?,?)', id(), userId, pathId, now(), now());
  return { favorite: !existing };
}
export function report(userId: string, data: unknown) { const input = z.object({ pathId: z.string().max(100), reason: z.string().trim().min(5).max(1500) }).parse(data); assertPathAccess(userId, input.pathId); pathById(input.pathId); const reportId = id(); run('INSERT INTO reports(id,user_id,path_id,reason,created_at,updated_at) VALUES(?,?,?,?,?,?)', reportId, userId, input.pathId, input.reason, now(), now()); audit(userId, 'content.report', reportId); return { reportId }; }
export function review(userId: string, data: unknown) { const input = z.object({ pathId: z.string().max(100), rating: z.number().int().min(1).max(5), comment: z.string().trim().min(3).max(1000) }).parse(data); assert(one('SELECT id FROM path_enrollments WHERE user_id=? AND path_id=?', userId, input.pathId), 403, 'אפשר לדרג רק מסלול שהתחלת. / Start a path before reviewing it.'); run('INSERT INTO reviews(id,user_id,path_id,rating,comment,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,path_id) DO UPDATE SET rating=excluded.rating,comment=excluded.comment,updated_at=excluded.updated_at', id(), userId, input.pathId, input.rating, input.comment, now(), now()); return { saved: true }; }

const creatorTask = z.object({ title: z.string().min(3).max(150), instructions: z.string().min(15).max(3000), question: z.string().min(5).max(300).optional(), options: z.array(z.string().min(1).max(150)).min(2).max(4).optional(), answer: z.number().int().min(0).max(3).optional(), explanation: z.string().min(5).max(500).optional() });
export function createMarketplace(userId: string, data: unknown) {
  assert(entitlements(planFor(userId)).canPublishMarketplacePath, 403, 'פרסום מסלולים זמין ב־Pro. / Creator publishing requires Pro.', 'UPGRADE_REQUIRED');
  assert(new Date().getUTCFullYear() - preferences(userId).birthYear >= 18, 403, 'חשבון יוצר בתשלום דורש בעל חשבון בגיר. / Creator publishing requires an adult account owner.');
  const input = z.object({ title: z.string().trim().min(5).max(150), description: z.string().trim().min(20).max(3000), category: z.string().max(60), price: z.number().min(0).max(500), durationDays: z.number().int().min(3).max(365).default(7), tasks: z.array(creatorTask).min(3).max(60) }).parse(data);
  assert(new Set(input.tasks.map(task => task.title.trim().toLowerCase())).size === input.tasks.length, 400, 'יש לתת לכל משימה שם שונה וברור. / Give every task a distinct title.');
  for (const task of input.tasks) if (task.question) assert(task.options && task.answer !== undefined && task.answer < task.options.length && task.explanation, 400, 'לכל שאלה נדרשות תשובות, פתרון והסבר. / Every question needs options, an answer and an explanation.');
  const pathId = id(), localize = (text: string) => ({ he: text, en: text });
  const tasks = input.tasks.map((task, index) => ({ id: `${pathId}-task-${index + 1}`, title: localize(task.title), description: localize(task.instructions.slice(0, 200)), objective: localize(task.title), minutes: 20, xp: 60, instructions: { he: task.instructions.split('\n').filter(Boolean), en: task.instructions.split('\n').filter(Boolean) }, example: localize('תארו את תהליך העבודה והתוצאה במילים שלכם. / Describe your process and result.'), hints: { he: ['חזרו למטרת המשימה ובדקו כל שלב בנפרד.'], en: ['Review the objective and check each step separately.'] }, resources: [], type: index === input.tasks.length - 1 ? 'project' : 'practice', question: task.question ? { prompt: localize(task.question), options: { he: task.options, en: task.options }, answer: task.answer, explanation: localize(task.explanation!) } : undefined }));
  for (const [index, task] of tasks.entries()) {
    if (!task.question) {
      // Rotating the options keeps the generated sequence answer from always landing on the first choice.
      const candidates = [task, ...tasks.filter(other => other.id !== task.id).slice(0, 2)];
      const rotation = candidates.length ? index % candidates.length : 0;
      const ordered = [...candidates.slice(rotation), ...candidates.slice(0, rotation)];
      const he = ordered.map(item => item.title.he), en = ordered.map(item => item.title.en);
      task.question = { prompt: { he: index ? `מהו השלב הבא אחרי ״${tasks[index - 1].title.he}״?` : 'מהו הצעד הראשון במסלול הזה?', en: index ? `What comes after “${tasks[index - 1].title.en}”?` : 'What is the first step in this path?' }, options: { he, en }, answer: ordered.indexOf(task), explanation: { he: `לפי סדר המסלול של היוצר, השלב ${index + 1} הוא ״${task.title.he}״.`, en: `In the creator’s path sequence, step ${index + 1} is “${task.title.en}”.` } };
    }
  }
  const chapters = Array.from({ length: 3 }, (_, index) => ({ id: `${pathId}-chapter-${index + 1}`, title: localize(`${index + 1}. ${input.title}`), tasks: tasks.slice(Math.floor(index * tasks.length / 3), Math.floor((index + 1) * tasks.length / 3)) }));
  const path = { id: pathId, title: localize(input.title), description: localize(input.description), category: input.category, level: 'beginner', durationDays: input.durationDays, dailyMinutes: 20, price: input.price, creator: preferences(userId).displayName, cover: '/covers/content.svg', chapters };
  const flagged = /weapon|bomb|porn|self.harm|נשק|התאבד|פורנו|סמים/i.test(JSON.stringify(input));
  transaction(() => {
    run('INSERT INTO learning_paths(id,title,category,data,created_at,updated_at) VALUES(?,?,?,?,?,?)', pathId, JSON.stringify(path.title), path.category, JSON.stringify(path), now(), now());
    run('INSERT INTO marketplace_paths(id,path_id,creator_id,price,status,review_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)', pathId, pathId, userId, input.price, 'pending', flagged ? 'Automated safety review flagged this content. Manual review required.' : null, now(), now());
    audit(userId, 'marketplace.submitted', pathId, { flagged, questionCount: tasks.filter(task => task.question).length });
  });
  return { pathId, status: 'pending', flagged };
}
export function challenges(userId: string, data: unknown) {
  assert(['PLUS', 'PRO'].includes(planFor(userId)), 403, 'אתגרי חברים זמינים ב־Plus וב־Pro. / Challenges require Plus or Pro.', 'UPGRADE_REQUIRED');
  const input = z.object({ title: z.string().trim().min(3).max(100).optional(), pathId: z.string().max(100).optional(), code: z.string().max(30).optional(), action: z.enum(['create', 'join', 'leave']).default('create'), challengeId: z.string().max(100).optional() }).parse(data);
  if (input.action === 'leave') { assert(input.challengeId, 400, 'Challenge required.'); run('DELETE FROM challenge_participants WHERE user_id=? AND challenge_id=?', userId, input.challengeId); return { left: true }; }
  if (input.action === 'join') {
    const challenge = one("SELECT * FROM challenges WHERE invite_code=? AND status='active'", (input.code || '').toUpperCase());
    assert(challenge, 404, 'קוד האתגר לא נמצא. / Challenge code not found.');
    const owner = preferences(challenge.owner_id), participant = preferences(userId), year = new Date().getUTCFullYear();
    assert((year - owner.birthYear < 18) === (year - participant.birthYear < 18), 403, 'אפשר להצטרף לאתגרים באותה קבוצת גיל בלבד. / Challenges are limited to the same age group.');
    run('INSERT OR IGNORE INTO challenge_participants(id,challenge_id,user_id,created_at,updated_at) VALUES(?,?,?,?,?)', id(), challenge.id, userId, now(), now());
    return { challengeId: challenge.id };
  }
  input.pathId ||= one("SELECT path_id FROM path_enrollments WHERE user_id=? AND status='active' ORDER BY created_at DESC LIMIT 1", userId)?.path_id;
  assert(input.title && input.pathId, 400, 'יש להזין שם ומסלול. / Title and path are required.');
  pathById(input.pathId); const challengeId = id(), code = id().slice(0, 8).toUpperCase();
  transaction(() => { run('INSERT INTO challenges(id,owner_id,title,invite_code,path_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', challengeId, userId, input.title!, code, input.pathId!, now(), now()); run('INSERT INTO challenge_participants(id,challenge_id,user_id,created_at,updated_at) VALUES(?,?,?,?,?)', id(), challengeId, userId, now(), now()); });
  return { challengeId, code };
}
export function blockFriend(userId: string, friendId: string) { assert(userId !== friendId && one('SELECT id FROM users WHERE id=? AND deleted_at IS NULL', friendId), 400, 'Invalid user.'); run('INSERT INTO friendships(id,user_id,friend_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,friend_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at', id(), userId, friendId, 'blocked', now(), now()); return { blocked: true }; }
export function buyCosmetic(userId: string, itemId: string) {
  return transaction(() => { const item = one('SELECT * FROM cosmetic_items WHERE id=?', itemId); assert(item, 404, 'Item not found.'); assert(!one('SELECT id FROM user_inventory WHERE user_id=? AND item_id=?', userId, itemId), 409, 'הפריט כבר שלך. / Item already owned.'); const coins = one('SELECT COALESCE(SUM(coins),0) AS coins FROM xp_events WHERE user_id=?', userId)!.coins; assert(coins >= item.price, 409, 'אין מספיק מטבעות. / Not enough coins.'); run('INSERT INTO xp_events(id,user_id,source,source_id,xp,coins,created_at) VALUES(?,?,?,?,?,?,?)', id(), userId, 'cosmetic', itemId, 0, -item.price, now()); run('INSERT INTO user_inventory(id,user_id,item_id,created_at,updated_at) VALUES(?,?,?,?,?)', id(), userId, itemId, now(), now()); return { itemId }; });
}
export function adminData() {
  return { orders: all('SELECT o.*,p.display_name,u.email FROM orders o JOIN users u ON u.id=o.user_id JOIN profiles p ON p.user_id=o.user_id ORDER BY o.created_at DESC').map(row => ({ id: row.id, userId: row.user_id, displayName: row.display_name, email: row.email, plan: row.plan_id, marketplacePathId: row.marketplace_path_id, amount: row.amount, status: row.status, proofId: row.proof_id, internalNote: row.internal_note, reviewNote: row.review_note, createdAt: row.created_at })), users: all('SELECT u.id,u.email,u.role,u.email_verified,u.blocked,u.created_at,p.display_name FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.deleted_at IS NULL').map(row => ({ id: row.id, email: row.email, role: row.role, displayName: row.display_name, emailVerified: !!row.email_verified, blocked: !!row.blocked, plan: planFor(row.id), createdAt: row.created_at })), reports: all('SELECT * FROM reports ORDER BY created_at DESC'), logs: all('SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 200').map(row => ({ id: row.id, actorId: row.actor_id, action: row.action, targetId: row.target_id, details: readJson(row.details), createdAt: row.created_at })), marketplace: all('SELECT mp.*,lp.title,lp.data FROM marketplace_paths mp JOIN learning_paths lp ON lp.id=mp.path_id ORDER BY mp.created_at DESC').map(row => ({ id: row.id, title: readJson(row.title), price: row.price, status: row.status, creatorId: row.creator_id, reviewNote: row.review_note, data: readJson(row.data) })), games: all('SELECT id,date,game_mode,world_theme,is_active,data FROM daily_games g WHERE NOT EXISTS (SELECT 1 FROM generated_game_owners o WHERE o.game_id=g.id) ORDER BY created_at DESC LIMIT 50').map(row => ({ id: row.id, date: row.date, mode: row.game_mode, world: row.world_theme, active: !!row.is_active, questions: readJson(row.data).questions })), suspiciousAttempts: all('SELECT id,user_id,daily_game_id,score,event_count,created_at FROM daily_game_attempts WHERE suspicious=1 ORDER BY created_at DESC'), plans: all('SELECT * FROM plans'), stats: { users: one('SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL')!.n, completions: one('SELECT COUNT(*) AS n FROM task_submissions')!.n, games: one("SELECT COUNT(*) AS n FROM daily_game_attempts WHERE status='completed'")!.n, pendingPayments: one("SELECT COUNT(*) AS n FROM orders WHERE status='under_review'")!.n } };
}
export function adminAction(adminId: string, resource: string, targetId: string, data: unknown) {
  const input = z.object({ action: z.string().max(50), note: z.string().max(1500).optional(), price: z.number().min(0).max(9999).optional() }).parse(data);
  return transaction(() => {
    if (resource === 'users') {
      assert(targetId !== adminId, 403, 'לא ניתן לחסום את החשבון שלך. / You cannot block your own account.');
      assert(['block', 'unblock', 'cancel-subscription'].includes(input.action), 400, 'Invalid action.');
      if (input.action === 'cancel-subscription') run("UPDATE subscriptions SET status='cancelled',updated_at=? WHERE user_id=? AND status='active'", now(), targetId);
      else { run('UPDATE users SET blocked=?,updated_at=? WHERE id=?', input.action === 'block' ? 1 : 0, now(), targetId); if (input.action === 'block') run('DELETE FROM sessions WHERE user_id=?', targetId); }
    } else if (resource === 'marketplace') { assert(['approve', 'reject', 'request-changes'].includes(input.action), 400, 'Invalid action.'); run('UPDATE marketplace_paths SET status=?,review_note=?,updated_at=? WHERE id=?', input.action === 'approve' ? 'approved' : input.action === 'reject' ? 'rejected' : 'changes_requested', input.note || '', now(), targetId); }
    else if (resource === 'games') { assert(['enable', 'disable'].includes(input.action), 400, 'Invalid action.'); run('UPDATE daily_games SET is_active=?,updated_at=? WHERE id=?', input.action === 'enable' ? 1 : 0, now(), targetId); }
    else if (resource === 'reports') { assert(['resolve', 'dismiss'].includes(input.action), 400, 'Invalid action.'); run('UPDATE reports SET status=?,updated_at=? WHERE id=?', input.action === 'resolve' ? 'resolved' : 'dismissed', now(), targetId); }
    else if (resource === 'plans') { assert(input.action === 'set-price' && input.price !== undefined, 400, 'Invalid price action.'); run('UPDATE plans SET price=?,updated_at=? WHERE id=?', input.price, now(), targetId); }
    else if (resource === 'leaderboards') { assert(input.action === 'remove', 400, 'Invalid action.'); run('DELETE FROM leaderboards WHERE id=?', targetId); }
    else assert(false, 404, 'Resource not found.');
    audit(adminId, `admin.${resource}.${input.action}`, targetId, input);
    return { updated: true };
  });
}
