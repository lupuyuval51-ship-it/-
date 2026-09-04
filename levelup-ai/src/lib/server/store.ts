import { learningPaths } from '../content';
import { config, entitlements, plans, type Plan } from './config';
import { all, audit, id, now, one, pruneExpired, readJson, run, transaction, type Row } from './db';
import { assert, passwordHash, publicUser } from './auth';

let seeded = false;
export function initialize() {
  pruneExpired();
  if (seeded) return;
  transaction(() => {
    for (const plan of plans) {
      run('INSERT OR IGNORE INTO plans(id,price,created_at,updated_at) VALUES(?,?,?,?)', plan.id, plan.price, now(), now());
      for (const [feature, value] of Object.entries(plan.features)) run('INSERT OR IGNORE INTO plan_features(id,plan_id,feature,value,created_at,updated_at) VALUES(?,?,?,?,?,?)', `${plan.id}:${feature}`, plan.id, feature, JSON.stringify(value), now(), now());
    }
    for (const path of learningPaths) {
      run('INSERT OR IGNORE INTO learning_paths(id,title,category,data,created_at,updated_at) VALUES(?,?,?,?,?,?)', path.id, JSON.stringify(path.title), path.category, JSON.stringify(path), now(), now());
      run('INSERT OR IGNORE INTO marketplace_paths(id,path_id,price,status,created_at,updated_at) VALUES(?,?,?,?,?,?)', path.id, path.id, path.price, 'approved', now(), now());
      run('INSERT OR IGNORE INTO skills(id,name,created_at,updated_at) VALUES(?,?,?,?)', path.category, JSON.stringify(path.title), now(), now());
      for (const chapter of path.chapters) {
        const chapterId = `${path.id}:${chapter.id}`;
        run('INSERT OR IGNORE INTO chapters(id,path_id,position,title,created_at,updated_at) VALUES(?,?,?,?,?,?)', chapterId, path.id, path.chapters.indexOf(chapter), JSON.stringify(chapter.title), now(), now());
        for (const task of chapter.tasks) {
          const taskId = `${path.id}:${task.id}`;
          run('INSERT OR IGNORE INTO lessons(id,chapter_id,title,created_at,updated_at) VALUES(?,?,?,?,?)', taskId, chapterId, JSON.stringify(task.title), now(), now());
          run('INSERT OR IGNORE INTO tasks(id,lesson_id,data,created_at,updated_at) VALUES(?,?,?,?,?)', taskId, taskId, JSON.stringify(task), now(), now());
        }
      }
    }
    const achievements = [
      ['first-task', 'הצעד הראשון', 'First step', 'השלמת את המשימה הראשונה שלך', 'Complete your first task'],
      ['first-game', 'נכנסת למשחק', 'In the game', 'סיום האתגר היומי הראשון', 'Finish your first daily quest'],
      ['path-complete', 'מהרעיון לתוצאה', 'Idea to reality', 'סיום מסלול למידה מלא', 'Complete a learning path'],
      ['three-day', 'בונים הרגל', 'Building a habit', 'שלושה ימי למידה רצופים', 'Learn for three consecutive days'],
      ['perfect-game', 'דיוק מלא', 'Perfect focus', 'כל התשובות באתגר נכונות', 'Answer every quest question correctly'],
    ];
    for (const [key, he, en, dhe, den] of achievements) run('INSERT OR IGNORE INTO achievements(id,title,description,created_at,updated_at) VALUES(?,?,?,?,?)', key, JSON.stringify({ he, en }), JSON.stringify({ he: dhe, en: den }), now(), now());
    for (const [key, title, price] of [['blue-orbit', 'Blue Orbit', 30], ['silver-builder', 'Silver Builder', 60], ['season-explorer', 'Season Explorer', 100]] as const) run('INSERT OR IGNORE INTO cosmetic_items(id,title,price,data,created_at,updated_at) VALUES(?,?,?,?,?,?)', key, title, price, JSON.stringify({ color: key === 'blue-orbit' ? '#4F7CFF' : '#A7AFBC' }), now(), now());
  });
  if (config.demo) seedDemo();
  seeded = true;
}
function seedDemo() {
  const time = now();
  for (const [userId, email, displayName, role, plan] of [
    ['demo-learner', 'learner@levelup.demo', 'יובל', 'learner', 'BASIC'],
    ['demo-free', 'free@levelup.demo', 'דניאל', 'learner', 'FREE'],
    ['demo-admin', 'admin@levelup.demo', 'מנהל Demo', 'admin', 'PRO'],
  ]) {
    if (one('SELECT id FROM users WHERE id=?', userId)) continue;
    transaction(() => {
      run('INSERT INTO users(id,email,password_hash,role,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', userId, email, passwordHash('LevelupDemo2026!'), role, 1, time, time);
      run('INSERT INTO profiles(user_id,display_name,birth_year,preferences,created_at,updated_at) VALUES(?,?,?,?,?,?)', userId, displayName, role === 'admin' ? 1990 : 2006, JSON.stringify({ locale: 'he', timezone: 'Asia/Jerusalem', coachStyle: 'supportive', theme: 'dark', privacy: 'private', leaderboards: true, notifications: true, leagues: true, music: false, effects: true, streaks: true, reducedMotion: false, quality: 'auto', sensitivity: 1, controlsSide: 'right' }), time, time);
      if (plan !== 'FREE') run('INSERT INTO subscriptions(id,user_id,plan_id,starts_at,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', id(), userId, plan, time, new Date(Date.now() + 30 * 86400000).toISOString(), time, time);
      const path = learningPaths[0], enrollmentId = `demo-enrollment-${userId}`;
      run('INSERT INTO path_enrollments(id,user_id,path_id,skill,level,daily_minutes,goal,target_date,styles,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', enrollmentId, userId, path.id, path.title.he, 'beginner', 20, path.description.he, new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), '["practice","games"]', time, time);
      if (role === 'learner' && plan !== 'FREE') {
        const task = path.chapters[0].tasks[0];
        run('INSERT INTO task_submissions(id,user_id,enrollment_id,task_id,text,difficulty,feedback,xp,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id(), userId, enrollmentId, task.id, 'נתון Demo: השלמתי את התרגול והכנתי מבנה ראשוני לפרויקט.', 'right', JSON.stringify({ he: 'השלמה לדוגמה לצורך התנסות במוצר.', en: 'Demo completion for exploring the product.' }), task.xp, time, time);
        run('INSERT INTO xp_events(id,user_id,source,source_id,xp,coins,created_at) VALUES(?,?,?,?,?,?,?)', id(), userId, 'demo', 'initial', task.xp, 12, time);
        run('INSERT INTO streaks(user_id,count,longest,last_day,created_at,updated_at) VALUES(?,?,?,?,?,?)', userId, 1, 1, dayFor(userId), time, time);
        award(userId, 'first-task');
      }
    });
  }
  if (!one("SELECT id FROM orders WHERE id='DEMO-BIT-001'")) run('INSERT INTO orders(id,user_id,plan_id,amount,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', 'DEMO-BIT-001', 'demo-free', 'BASIC', config.prices.BASIC, 'awaiting_payment', time, time);
}
/** The captured order amount is the truth about what a learner paid; the list price only fills gaps. */
export function subscriptionFor(userId: string): { plan: Plan; paidAmount: number } {
  const subscriptions = all("SELECT s.plan_id,o.amount FROM subscriptions s LEFT JOIN orders o ON o.id=s.order_id AND o.status='approved' WHERE s.user_id=? AND s.status='active' AND s.starts_at<=? AND s.expires_at>?", userId, now(), now());
  const plan = (['PRO', 'PLUS', 'BASIC'] as Plan[]).find(candidate => subscriptions.some(row => row.plan_id === candidate)) || 'FREE';
  if (plan === 'FREE') return { plan, paidAmount: 0 };
  // A NULL amount means no approved order is joined, not a free month, so it must not read as 0.
  const paid = subscriptions.filter(row => row.plan_id === plan && row.amount !== null && row.amount !== undefined).map(row => Number(row.amount)).filter(amount => Number.isFinite(amount) && amount >= 0);
  return { plan, paidAmount: paid.length ? Math.max(...paid) : config.prices[plan] };
}
export function planFor(userId: string): Plan { return subscriptionFor(userId).plan; }
export function entitlementsFor(userId: string) { const { plan, paidAmount } = subscriptionFor(userId); return entitlements(plan, paidAmount); }
export function preferences(userId: string) { const profile = one('SELECT * FROM profiles WHERE user_id=?', userId)!; return { ...readJson(profile.preferences), displayName: profile.display_name, birthYear: profile.birth_year }; }
export const DEFAULT_TIMEZONE = 'Asia/Jerusalem';
/** Formatters are expensive to build and day maths runs in hot loops, so resolve each zone once. */
const dayFormatters = new Map<string, Intl.DateTimeFormat>();
export function dayIn(zone: string, timestamp: Date = new Date()): string {
  let formatter = dayFormatters.get(zone);
  if (!formatter) {
    // A profile written before a zone was retired must not break every read for that account.
    try { formatter = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }); }
    catch { return zone === DEFAULT_TIMEZONE ? new Date(timestamp).toISOString().slice(0, 10) : dayIn(DEFAULT_TIMEZONE, timestamp); }
    dayFormatters.set(zone, formatter);
  }
  return formatter.format(timestamp);
}
/** Quota boundaries must be server-authoritative: a learner can edit their timezone, not UTC. */
export const quotaDay = (timestamp: Date = new Date()) => timestamp.toISOString().slice(0, 10);
export const nextQuotaReset = () => new Date(Math.floor(Date.now() / 86400000) * 86400000 + 86400000).toISOString();
export function timezoneFor(userId: string): string { const zone = preferences(userId).timezone; return typeof zone === 'string' && zone ? zone : DEFAULT_TIMEZONE; }
export function dayFor(userId: string, timestamp = new Date()) { return dayIn(timezoneFor(userId), timestamp); }
export function findPath(pathId: string): Row | undefined { const row = one('SELECT * FROM learning_paths WHERE id=? AND deleted_at IS NULL', pathId); return row ? readJson(row.data) : undefined; }
export function pathById(pathId: string): Row { const path = findPath(pathId); assert(path, 404, 'המסלול לא נמצא. / Path not found.', 'PATH_NOT_FOUND'); return path; }
export const taskCount = (path?: Row) => path?.chapters?.reduce((sum: number, chapter: Row) => sum + (chapter.tasks?.length || 0), 0) || 0;
/** Percentages reach the UI as bar widths, so an empty path must read 0 rather than NaN. */
export const percentage = (done: number, total: number) => (total > 0 ? Math.round(Math.min(done, total) / total * 100) : 0);
export function assertPathAccess(userId: string, pathId: string) { const owner = one('SELECT user_id FROM private_path_owners WHERE path_id=?', pathId); assert(!owner || owner.user_id === userId, 404, 'המסלול לא נמצא. / Path not found.', 'PATH_NOT_FOUND'); }
export function publicPath(path: Row, hasContent = true): Row {
  return { ...path, locked: !hasContent, previewOnly: !hasContent, chapters: path.chapters.map((chapter: Row) => ({ ...chapter, tasks: chapter.tasks.map((task: Row) => hasContent ? ({ ...task, question: task.question ? { prompt: task.question.prompt, options: task.question.options } : undefined }) : ({ id: task.id, title: task.title, description: { he: '', en: '' }, objective: { he: '', en: '' }, minutes: task.minutes, xp: task.xp, type: task.type, instructions: { he: [], en: [] }, example: { he: '', en: '' }, hints: { he: [], en: [] }, resources: [], locked: true })) })) };
}
export function catalog(userId?: string): Row[] {
  const favorites = userId ? all('SELECT path_id FROM favorites WHERE user_id=?', userId).map(row => row.path_id) : [];
  const published = all("SELECT lp.*,mp.id AS marketplace_id,mp.price AS marketplace_price,mp.status AS marketplace_status,mp.creator_id FROM learning_paths lp JOIN marketplace_paths mp ON mp.path_id=lp.id WHERE lp.deleted_at IS NULL AND mp.deleted_at IS NULL AND mp.status='approved'").map(row => {
    const stats = one('SELECT AVG(rating) AS rating,COUNT(*) AS reviews FROM reviews WHERE path_id=?', row.id)!;
    const enrolled = one('SELECT COUNT(*) AS count FROM path_enrollments WHERE path_id=?', row.id)!.count;
    const purchased = !!userId && !!one("SELECT ms.id FROM marketplace_sales ms JOIN orders o ON o.id=ms.order_id WHERE ms.marketplace_path_id=? AND ms.buyer_id=? AND o.status='approved'", row.marketplace_id, userId);
    const hasContent = row.marketplace_price === 0 || row.creator_id === userId || purchased;
    return { ...publicPath(readJson(row.data), hasContent), purchased, price: row.marketplace_price, marketplaceId: row.marketplace_id, status: row.marketplace_status, rating: stats.rating || 0, reviewCount: stats.reviews, studentCount: enrolled, favorite: favorites.includes(row.id), isDemo: config.demo, updatedAt: row.updated_at, reviews: all('SELECT r.rating,r.comment,r.created_at,p.display_name FROM reviews r JOIN profiles p ON p.user_id=r.user_id WHERE r.path_id=? ORDER BY r.created_at DESC LIMIT 10', row.id).map(review => ({ rating: review.rating, comment: review.comment, createdAt: review.created_at, displayName: review.display_name })) };
  });
  return userId ? [...published, ...privatePathsFor(userId)] : published;
}
export function privatePathsFor(userId: string): Row[] { return all('SELECT lp.* FROM learning_paths lp JOIN private_path_owners p ON p.path_id=lp.id WHERE p.user_id=? AND lp.deleted_at IS NULL ORDER BY lp.created_at DESC', userId).map(row => ({ ...publicPath(readJson(row.data)), isPrivate: true, isMarketplace: false, updatedAt: row.updated_at, studentCount: 1, rating: 0, reviewCount: 0, reviews: [] })); }
export function state(user: Row) {
  const userId = user.id, { plan, paidAmount } = subscriptionFor(userId), features = entitlements(plan, paidAmount);
  const submissions = all('SELECT * FROM task_submissions WHERE user_id=? ORDER BY created_at DESC', userId).map(row => ({ id: row.id, enrollmentId: row.enrollment_id, taskId: row.task_id, text: row.text, link: row.link, fileId: row.file_id, difficulty: row.difficulty, feedback: readJson(row.feedback), xp: row.xp, createdAt: row.created_at }));
  const enrollments = all('SELECT * FROM path_enrollments WHERE user_id=? ORDER BY created_at DESC', userId).map(row => {
    // A retired or removed path must not take the whole account state down with it.
    const path = findPath(row.path_id), completedTasks = submissions.filter(submission => submission.enrollmentId === row.id).map(submission => submission.taskId);
    const adaptation = readJson(row.adaptation);
    return { id: row.id, pathId: row.path_id, title: path?.title ?? { he: row.skill, en: row.skill }, unavailable: !path, skill: row.skill, level: row.level, dailyMinutes: row.daily_minutes, goal: row.goal, targetDate: row.target_date, styles: readJson(row.styles, []), progress: percentage(completedTasks.length, taskCount(path)), completedTasks, adaptation: { ...adaptation, message: { he: adaptation.he, en: adaptation.en } }, status: row.status, createdAt: row.created_at };
  });
  const totals = one('SELECT COALESCE(SUM(xp),0) AS xp,COALESCE(SUM(coins),0) AS coins FROM xp_events WHERE user_id=?', userId)!;
  const streak = one('SELECT * FROM streaks WHERE user_id=?', userId);
  const zone = timezoneFor(userId), today = dayIn(zone), yesterday = dayIn(zone, new Date(Date.now() - 86400000));
  const attempts = all('SELECT a.*,g.game_mode,g.world_theme,g.data FROM daily_game_attempts a JOIN daily_games g ON g.id=a.daily_game_id WHERE a.user_id=? AND a.created_at>? ORDER BY a.created_at DESC LIMIT 200', userId, new Date(Date.now() - features.historyDays * 86400000).toISOString()).map(attemptDto);
  return { user: publicUser(user), profile: preferences(userId), plan, features, enrollments, privatePaths: privatePathsFor(userId), submissions, xp: totals.xp, coins: totals.coins, level: Math.floor(totals.xp / 500) + 1, streak: streak && [today, yesterday].includes(streak.last_day) ? streak.count : 0, achievements: all('SELECT a.*,ua.created_at AS unlocked_at FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=?', userId).map(row => ({ id: row.id, title: readJson(row.title), description: readJson(row.description), unlockedAt: row.unlocked_at })), notifications: all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30', userId).map(row => ({ id: row.id, message: readJson(row.message), read: !!row.read_at, createdAt: row.created_at })), orders: all('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', userId).map(orderDto), attempts, coachMessages: all('SELECT * FROM ai_coach_messages m WHERE user_id=? AND NOT EXISTS (SELECT 1 FROM game_coach_contexts c WHERE c.message_id=m.id) ORDER BY created_at DESC LIMIT 60', userId).reverse().map(row => ({ id: row.id, role: row.role, content: row.content, enrollmentId: row.enrollment_id, isDemo: !!row.is_demo, createdAt: row.created_at })), favorites: all('SELECT path_id FROM favorites WHERE user_id=?', userId).map(row => row.path_id), inventory: all('SELECT i.*,c.title,c.data FROM user_inventory i JOIN cosmetic_items c ON c.id=i.item_id WHERE i.user_id=?', userId), cosmetics: all('SELECT * FROM cosmetic_items').map(row => ({ ...row, data: readJson(row.data) })), challenges: all('SELECT c.*,cp.score FROM challenges c JOIN challenge_participants cp ON cp.challenge_id=c.id WHERE cp.user_id=? AND c.status=?', userId, 'active').map(row => ({ id: row.id, title: row.title, code: row.invite_code, pathId: row.path_id, score: row.score, ownerId: row.owner_id })), subscription: all("SELECT id,plan_id,starts_at,expires_at,status FROM subscriptions WHERE user_id=? AND status='active' ORDER BY expires_at DESC", userId)[0] || null, weekly: weekly(userId, zone), isDemo: config.demo };
}
export function orderDto(row: Row) { return { id: row.id, plan: row.plan_id, marketplacePathId: row.marketplace_path_id, amount: row.amount, status: row.status, proofId: row.proof_id, reviewNote: row.review_note, reviewedAt: row.reviewed_at, createdAt: row.created_at, updatedAt: row.updated_at, userId: row.user_id }; }
export function attemptDto(row: Row) { const game = readJson(row.data); return { id: row.id, dailyGameId: row.daily_game_id, mode: row.game_mode, world: row.world_theme, score: row.score, correct: row.correct, total: game.questions?.length || 0, totalQuestions: game.questions?.length || 0, answered: row.event_count || 0, elapsedMs: row.elapsed_ms, status: row.status, firstAttempt: !!row.first_attempt, suspicious: !!row.suspicious, xp: row.xp, coins: row.coins, startedAt: row.started_at, finishedAt: row.finished_at }; }
export function award(userId: string, achievement: string) { run('INSERT OR IGNORE INTO user_achievements(id,user_id,achievement_id,created_at,updated_at) VALUES(?,?,?,?,?)', id(), userId, achievement, now(), now()); }
export function updateStreak(userId: string) {
  const zone = timezoneFor(userId), day = dayIn(zone), previous = one('SELECT * FROM streaks WHERE user_id=?', userId);
  if (previous?.last_day === day) return;
  const yesterday = dayIn(zone, new Date(Date.now() - 86400000)), count = previous && previous.last_day === yesterday ? previous.count + 1 : 1;
  run('INSERT INTO streaks(user_id,count,longest,last_day,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET count=excluded.count,longest=MAX(streaks.longest,excluded.longest),last_day=excluded.last_day,updated_at=excluded.updated_at', userId, count, count, day, now(), now());
  if (count >= 3) award(userId, 'three-day');
}
export function weekly(userId: string, zone = timezoneFor(userId)) {
  const days = Array.from({ length: 7 }, (_, index) => dayIn(zone, new Date(Date.now() - (6 - index) * 86400000)));
  const totals = new Map(days.map(day => [day, 0]));
  for (const event of all('SELECT xp,created_at FROM xp_events WHERE user_id=? AND created_at>?', userId, new Date(Date.now() - 8 * 86400000).toISOString())) {
    const day = dayIn(zone, new Date(event.created_at));
    if (totals.has(day)) totals.set(day, totals.get(day)! + event.xp);
  }
  return days.map(day => ({ day, xp: totals.get(day)! }));
}
export function assertEnrollment(userId: string, enrollmentId: string) { const row = one('SELECT * FROM path_enrollments WHERE id=? AND user_id=?', enrollmentId, userId); assert(row, 404, 'המסלול האישי לא נמצא. / Enrollment not found.', 'ENROLLMENT_NOT_FOUND'); return row; }
export function approveOrder(adminId: string, orderId: string, action: 'approve' | 'reject', note = '') {
  return transaction(() => {
    const order = one('SELECT * FROM orders WHERE id=?', orderId);
    assert(order, 404, 'ההזמנה לא נמצאה. / Order not found.');
    assert(['proof_uploaded', 'under_review'].includes(order.status), 409, 'יש לבדוק אישור תשלום. ההזמנה כבר טופלה או שאישור טרם הועלה. / Order already processed or missing payment proof.', 'ORDER_STATE_INVALID');
    assert(order.user_id !== adminId, 403, 'לא ניתן לאשר תשלום של החשבון שלך. / An administrator cannot approve their own payment.');
    assert(order.proof_id, 409, 'חסר אישור תשלום. / Missing payment proof.');
    const time = now(), status = action === 'approve' ? 'approved' : 'rejected';
    run('UPDATE orders SET status=?,review_note=?,internal_note=?,reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=?', status, action === 'reject' ? note || 'לא ניתן לאמת את ההעברה. / Transfer could not be verified.' : '', note, adminId, time, time, orderId);
    if (action === 'approve') {
      if (order.plan_id) {
        const previous = one("SELECT expires_at FROM subscriptions WHERE user_id=? AND plan_id=? AND status='active' AND expires_at>? ORDER BY expires_at DESC LIMIT 1", order.user_id, order.plan_id, time);
        const start = previous ? new Date(previous.expires_at) : new Date();
        const expires = new Date(start.getTime() + 30 * 86400000).toISOString();
        run('INSERT INTO subscriptions(id,user_id,plan_id,status,starts_at,expires_at,order_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)', id(), order.user_id, order.plan_id, 'active', time, expires, orderId, time, time);
      } else {
        const listing = one('SELECT * FROM marketplace_paths WHERE id=?', order.marketplace_path_id)!;
        assert(!one('SELECT id FROM marketplace_sales WHERE marketplace_path_id=? AND buyer_id=?', listing.id, order.user_id), 409, 'המסלול כבר נרכש בהזמנה אחרת. יש לבדוק החזר ידני. / This path was already purchased in another order. Review for a manual refund.', 'ALREADY_PURCHASED');
        run('INSERT INTO marketplace_sales(id,marketplace_path_id,buyer_id,order_id,amount,commission,creator_amount,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)', id(), listing.id, order.user_id, order.id, order.amount, Math.round(order.amount * 20) / 100, Math.round(order.amount * 80) / 100, time, time);
      }
    }
    audit(adminId, `payment.${status}`, orderId, { previous: order.status, amount: order.amount, note });
    run('INSERT INTO notifications(id,user_id,message,created_at) VALUES(?,?,?,?)', id(), order.user_id, JSON.stringify(action === 'approve' ? { he: 'התשלום אושר. הגישה שלך עודכנה.', en: 'Payment approved. Your access has been updated.' } : { he: 'אישור התשלום נדחה. פרטים מופיעים בהזמנה.', en: 'Payment proof rejected. See your order for details.' }), time);
    return orderDto(one('SELECT * FROM orders WHERE id=?', orderId)!);
  });
}
