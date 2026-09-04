import { createHash } from 'node:crypto';
import { z } from 'zod';
import { all, audit, id, now, one, readJson, run, transaction, type Row } from './db';
import { assert, isAdult } from './auth';
import { config, gameModes, worlds } from './config';
import { attemptDto, award, dayIn, entitlementsFor, findPath, nextQuotaReset, pathById, preferences, quotaDay, timezoneFor, updateStreak } from './store';
import { reinforcementProposal } from './learning';

function random(seed: string) { let state = parseInt(createHash('sha256').update(seed).digest('hex').slice(0, 8), 16); return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; }
export function getDaily(userId: string, mode?: string | null, world?: string | null) {
  const zone = timezoneFor(userId), date = dayIn(zone), dateNumber = Math.floor(new Date(date).getTime() / 86400000);
  const modeValue = z.enum(gameModes).parse(mode || gameModes[dateNumber % gameModes.length]);
  const worldValue = z.enum(worlds).parse(world || worlds[dateNumber % worlds.length]);
  const enrollment = one("SELECT * FROM path_enrollments WHERE user_id=? AND status='active' ORDER BY created_at DESC LIMIT 1", userId);
  // A retired enrollment path still leaves a playable daily quest on the starter catalogue.
  const enrolledPath = enrollment ? findPath(enrollment.path_id) : undefined;
  const path = enrolledPath || pathById('website'), difficulty = (enrolledPath && enrollment?.level) || 'beginner';
  const dailyGameId = createHash('sha256').update(`${date}:${path.id}:${difficulty}:${modeValue}:${worldValue}:v2`).digest('hex').slice(0, 28);
  const seed = `${date}:${path.id}:${difficulty}:${modeValue}:v2`;
  let stored = one('SELECT * FROM daily_games WHERE id=?', dailyGameId);
  if (!stored) {
    const rng = random(seed), tasks = path.chapters.flatMap((chapter: Row) => chapter.tasks).filter((task: Row) => task.question);
    assert(tasks.length > 0, 503, 'עדיין אין שאלות מאושרות לאתגר הזה. / No verified questions are available.');
    const ordered = tasks.map((task: Row) => ({ task, rank: rng() })).sort((a: Row, b: Row) => a.rank - b.rank).map((value: Row) => value.task);
    const questions = Array.from({ length: 8 }, (_, index) => {
      const task = modeValue === 'build-path' ? tasks[index % tasks.length] : ordered[index % ordered.length];
      const taskPosition = tasks.findIndex((item: Row) => item.id === task.id);
      const previous = tasks[taskPosition - 1];
      // Distractors are the neighbouring steps — the one after the answer, the one before the
      // prompt — so ordering knowledge is what decides, not "which two titles keep showing up".
      const neighbours = [1, -2, 2, -3, 3, -4, 4, -5, 5].map(offset => tasks[taskPosition + offset]).filter((item: Row | undefined) => item && item.id !== task.id && item.id !== previous?.id);
      const distractors = [...neighbours, ...tasks.filter((item: Row) => item.id !== task.id && !neighbours.includes(item))].slice(0, 2);
      const sequenceTitles = [task, ...distractors];
      const question = modeValue === 'build-path' ? {
        prompt: { he: previous ? `מהו השלב הבא אחרי ״${previous.title.he}״ במסלול?` : 'מהו הצעד הראשון במסלול הלמידה?', en: previous ? `What comes after “${previous.title.en}” in this learning path?` : 'What is the first step in this learning path?' },
        options: { he: sequenceTitles.map((item: Row) => item.title.he), en: sequenceTitles.map((item: Row) => item.title.en) }, answer: 0,
        explanation: { he: `בסדר המסלול המאומת, הצעד ${taskPosition + 1} הוא ״${task.title.he}״.`, en: `In the verified path sequence, step ${taskPosition + 1} is “${task.title.en}”.` },
        hint: { he: previous ? `חשבו מה חייב להיות מוכן מיד אחרי ״${previous.title.he}״, ומה מגיע רק מאוחר יותר.` : 'המסלול מתחיל בהגדרה ותכנון, לפני כל בנייה.', en: previous ? `Think about what must be ready right after “${previous.title.en}”, and what only comes later.` : 'A path starts with defining and planning, before any building.' },
      } : { ...task.question, hint: task.hints?.he?.[0] && task.hints?.en?.[0] ? { he: task.hints.he[0], en: task.hints.en[0] } : undefined };
      const options = question.options.he.map((_: string, original: number) => ({ original, rank: rng() })).sort((a: Row, b: Row) => a.rank - b.rank);
      // Every starter path holds six question-bearing tasks, so slots seven and eight reuse one.
      // The arena is built around eight waves, so rather than shorten the quest, say plainly that
      // the question is a repeat instead of showing an explanation the learner already read.
      const repeat = index >= tasks.length;
      const prompt = repeat ? { he: `תרגול חוזר: ${question.prompt.he}`, en: `Review: ${question.prompt.en}` } : question.prompt;
      return { id: `${dailyGameId}:${index}`, prompt, options: { he: options.map((option: Row) => question.options.he[option.original]), en: options.map((option: Row) => question.options.en[option.original]) }, answer: options.findIndex((option: Row) => option.original === question.answer), explanation: question.explanation, topic: task.title, ...(question.hint ? { hint: question.hint } : {}) };
    });
    const data = { dailyGameId, date, seed, version: 2, gameMode: modeValue, worldTheme: worldValue, difficulty, skillCategory: path.category, lessonTopics: path.chapters.map((chapter: Row) => chapter.title), questions, ...(modeValue === 'knowledge-arena' ? { arena: { layout: 'courtyard', enemyCount: difficulty === 'advanced' ? 6 : difficulty === 'intermediate' ? 4 : 2, obstacleCount: 8, ambience: 'day', waveCount: 8 } } : {}), obstacles: [{ type: 'barrier', count: 8, speed: difficulty === 'advanced' ? 1.4 : 1 }], rewards: { xp: 80, coins: 12, perfectBonus: 20 }, timeLimit: 300, scoreRules: { correct: 100, maxMultiplier: 3, wrong: 0, firstAttemptLeaderboard: true }, leaderboardGroup: `${date}:${path.id}:${difficulty}:${modeValue}:v2`, minimumPlan: 'BASIC', isActive: true };
    transaction(() => {
      run('INSERT OR IGNORE INTO daily_games(id,date,seed,path_id,game_mode,world_theme,data,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)', dailyGameId, date, seed, path.id, modeValue, worldValue, JSON.stringify(data), now(), now());
      for (const [index, question] of questions.entries()) run('INSERT OR IGNORE INTO daily_game_questions(id,daily_game_id,position,data,created_at,updated_at) VALUES(?,?,?,?,?,?)', question.id, dailyGameId, index, JSON.stringify(question), now(), now());
      run('INSERT OR IGNORE INTO daily_game_templates(id,mode,version,data,created_at,updated_at) VALUES(?,?,?,?,?,?)', modeValue, modeValue, 1, JSON.stringify({ mode: modeValue, timeLimit: 300, questions: 8 }), now(), now());
    });
    stored = one('SELECT * FROM daily_games WHERE id=?', dailyGameId)!;
  }
  return { game: publicGame(stored), ...gameAvailability(userId, stored), isDemo: config.demo };
}
/** A hint is shown before the answer is scored, so one that quotes the correct option is withheld. */
export function safeHint(question: Row) {
  const hint = question.hint, correct = question.options?.he?.[question.answer], correctEn = question.options?.en?.[question.answer];
  if (!hint?.he || !hint?.en) return undefined;
  const quotes = (text: string, option?: string) => !!option && text.toLowerCase().includes(String(option).toLowerCase());
  return quotes(hint.he, correct) || quotes(hint.en, correctEn) || quotes(hint.he, correctEn) || quotes(hint.en, correct) ? undefined : { he: hint.he, en: hint.en };
}
export function publicGame(row: Row) {
  const data = readJson(row.data);
  return { ...data, isActive: !!row.is_active, isDemo: data.isDemo ?? config.demo, questions: data.questions.map((question: Row) => { const hint = safeHint(question); return { id: question.id, prompt: question.prompt, options: question.options, topic: question.topic, ...(hint ? { hint } : {}) }; }) };
}
/** Private arena ownership is checked for every read and mutation, including replayed events. */
export function assertGameAccess(userId: string, gameId: string) {
  const game = one('SELECT * FROM daily_games WHERE id=?', gameId), owner = one('SELECT user_id,deleted_at FROM generated_game_owners WHERE game_id=?', gameId);
  assert(game && (!owner || owner.user_id === userId && !owner.deleted_at), 404, 'המשחק לא נמצא. / Game not found.', 'GAME_NOT_FOUND');
  assert(!readJson(game.data).isCustom || owner, 404, 'המשחק לא נמצא. / Game not found.', 'GAME_NOT_FOUND');
  const privatePath = one('SELECT p.user_id,l.deleted_at FROM private_path_owners p JOIN learning_paths l ON l.id=p.path_id WHERE p.path_id=?', game.path_id);
  assert(!privatePath || privatePath.user_id === userId && !privatePath.deleted_at, 404, 'המשחק לא נמצא. / Game not found.', 'GAME_NOT_FOUND');
  return game;
}
function cohortAttempts(userId: string, game: Row) {
  const data = readJson(game.data);
  return all("SELECT a.*,g.data,g.game_mode,g.world_theme FROM daily_game_attempts a JOIN daily_games g ON g.id=a.daily_game_id WHERE a.user_id=? AND json_extract(g.data,'$.leaderboardGroup')=?", userId, data.leaderboardGroup);
}
export function gameAvailability(userId: string, game: Row) {
  const features = entitlementsFor(userId), data = readJson(game.data), attempts = cohortAttempts(userId, game);
  const current = data.isCustom ? attempts.filter(attempt => quotaDay(new Date(attempt.started_at)) === quotaDay()) : attempts;
  const resumable = current.some(attempt => attempt.daily_game_id === game.id && attempt.status === 'playing' && Date.now() - new Date(attempt.started_at).getTime() <= data.timeLimit * 1000 + 30000);
  const attemptsRemaining = Math.max(0, features.gameAttempts - current.length), canPlay = features.canPlayFull3DGames && !!game.is_active;
  return { canPlay, canStart: canPlay && (attemptsRemaining > 0 || resumable), attemptsRemaining, currentRemaining: attemptsRemaining, personalBest: Math.max(0, ...attempts.filter(attempt => attempt.status === 'completed' && !attempt.suspicious).map(attempt => attempt.score)), previousAttempts: current.map(attemptDto), nextResetAt: nextQuotaReset() };
}
export function startGame(userId: string, gameId: string) {
  return transaction(() => {
    const game = assertGameAccess(userId, gameId), data = readJson(game.data), features = entitlementsFor(userId), zone = timezoneFor(userId);
    assert(features.canPlayFull3DGames, 403, 'Basic פותח את משחקי ה־3D. / Basic unlocks full 3D games.', 'UPGRADE_REQUIRED');
    assert(game.is_active, 404, 'האתגר אינו זמין. / Quest is unavailable.', 'GAME_UNAVAILABLE');
    assert(data.isCustom || game.date === dayIn(zone), 409, 'האתגר היומי התחלף. יש לטעון את האתגר החדש. / The daily quest has changed.', 'GAME_EXPIRED');
    const active = one("SELECT * FROM daily_game_attempts WHERE user_id=? AND daily_game_id=? AND status='playing' ORDER BY started_at DESC LIMIT 1", userId, gameId);
    if (active && Date.now() - new Date(active.started_at).getTime() <= readJson(game.data).timeLimit * 1000 + 30000) return { attemptId: active.id, game: { ...publicGame(game), resumeState: { index: active.event_count, score: active.score, correct: active.correct, multiplier: active.multiplier, startedAt: active.started_at } }, resumed: true, nextIndex: active.event_count, score: active.score, correct: active.correct, startedAt: active.started_at };
    if (active) run("UPDATE daily_game_attempts SET status='expired',finished_at=?,updated_at=? WHERE id=?", now(), now(), active.id);
    const activePath = one("SELECT path_id,level FROM path_enrollments WHERE user_id=? AND status='active' ORDER BY created_at DESC LIMIT 1", userId);
    // The cohort must resolve exactly as getDaily does, including its fallback for a retired path.
    const cohortPath = (activePath && findPath(activePath.path_id)) ? activePath.path_id : 'website';
    const cohortLevel = activePath && cohortPath === activePath.path_id ? activePath.level : 'beginner';
    assert(data.isCustom || game.path_id === cohortPath && data.difficulty === cohortLevel, 403, 'האתגר אינו תואם למסלול הפעיל שלך. / This quest does not match your active path.', 'GAME_COHORT_MISMATCH');
    const count = cohortAttempts(userId, game).filter(attempt => !data.isCustom || quotaDay(new Date(attempt.started_at)) === quotaDay()).length;
    assert(count < features.gameAttempts, 403, 'ניצלת את ניסיונות האתגר להיום. / Today’s attempts are used.', 'ATTEMPTS_EXHAUSTED');
    const attemptId = id(), time = now();
    run('INSERT INTO daily_game_attempts(id,user_id,daily_game_id,started_at,first_attempt,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', attemptId, userId, gameId, time, count === 0 ? 1 : 0, time, time);
    return { attemptId, game: { ...publicGame(game), resumeState: { index: 0, score: 0, correct: 0, multiplier: 1, startedAt: time } }, nextIndex: 0, score: 0, correct: 0, startedAt: time };
  });
}
const eventSchema = z.object({ attemptId: z.string().max(100), index: z.number().int().min(0).max(99), answer: z.number().int().min(0).max(10), elapsedMs: z.number().int().min(0).max(7200000) });
export function gameEvent(userId: string, body: unknown) {
  const input = eventSchema.parse(body), attempt = one('SELECT a.*,g.data,g.is_active FROM daily_game_attempts a JOIN daily_games g ON g.id=a.daily_game_id WHERE a.id=? AND a.user_id=?', input.attemptId, userId);
  assert(attempt, 404, 'הניסיון לא נמצא. / Attempt not found.');
  assertGameAccess(userId, attempt.daily_game_id);
  const game = readJson(attempt.data), question = game.questions[input.index];
  const previousEvent = one('SELECT * FROM game_events WHERE attempt_id=? AND position=?', attempt.id, input.index);
  if (previousEvent) {
    assert(previousEvent.answer === input.answer, 409, 'התשובה כבר נשלחה. / Answer already submitted.', 'EVENT_CONFLICT');
    return { correct: !!previousEvent.correct, explanation: question.explanation, score: attempt.score, multiplier: attempt.multiplier, index: input.index, complete: attempt.event_count === game.questions.length, replayed: true };
  }
  assert(entitlementsFor(userId).canPlayFull3DGames, 403, 'המנוי אינו פעיל. / Subscription is no longer active.', 'UPGRADE_REQUIRED');
  assert(attempt.status === 'playing' && attempt.is_active, 409, 'הניסיון הסתיים או הושבת. / Attempt finished or disabled.', 'ATTEMPT_CLOSED');
  assert(question && input.index === attempt.event_count, 409, 'סדר האירועים אינו תקין. / Invalid event sequence.', 'INVALID_SEQUENCE');
  assert(input.answer < question.options.he.length, 400, 'בחירה לא תקינה. / Invalid option.');
  const actualElapsed = Date.now() - new Date(attempt.started_at).getTime();
  const impossible = input.elapsedMs < attempt.elapsed_ms || input.elapsedMs - attempt.elapsed_ms < 350 || actualElapsed < (input.index + 1) * 350 || input.elapsedMs > actualElapsed + 5000;
  if (impossible) { run('UPDATE daily_game_attempts SET suspicious=1,updated_at=? WHERE id=?', now(), attempt.id); audit(userId, 'game.suspicious', attempt.id, { reason: 'timing', index: input.index, elapsedMs: input.elapsedMs, actualElapsed }); }
  assert(!impossible, 422, 'לא ניתן לאמת את זמני המשחק. נסו שוב. / Game timing could not be verified.', 'SUSPICIOUS_ATTEMPT');
  assert(actualElapsed <= game.timeLimit * 1000 + 30000 && input.elapsedMs <= game.timeLimit * 1000, 409, 'הזמן נגמר. אפשר לשמור את התוצאה. / Time is up. Save your result.', 'TIME_EXPIRED');
  return transaction(() => {
    const previous = one('SELECT correct FROM game_events WHERE attempt_id=? AND position=?', attempt.id, input.index - 1);
    const correct = input.answer === question.answer, multiplier = correct && previous?.correct ? Math.min(3, attempt.multiplier + 1) : 1;
    const score = attempt.score + (correct ? 100 * multiplier : 0);
    run('INSERT INTO game_events(id,attempt_id,position,answer,correct,elapsed_ms,created_at) VALUES(?,?,?,?,?,?,?)', id(), attempt.id, input.index, input.answer, correct ? 1 : 0, input.elapsedMs, now());
    run('UPDATE daily_game_attempts SET score=?,correct=correct+?,elapsed_ms=?,event_count=event_count+1,multiplier=?,updated_at=? WHERE id=?', score, correct ? 1 : 0, input.elapsedMs, multiplier, now(), attempt.id);
    return { correct, explanation: question.explanation, score, multiplier, index: input.index, complete: input.index + 1 === game.questions.length };
  });
}
export function finishGame(userId: string, attemptId: string) {
  return transaction(() => {
    const row = one('SELECT a.*,g.data,g.date,g.game_mode,g.world_theme,g.path_id FROM daily_game_attempts a JOIN daily_games g ON g.id=a.daily_game_id WHERE a.id=? AND a.user_id=?', attemptId, userId);
    assert(row, 404, 'הניסיון לא נמצא. / Attempt not found.');
    assertGameAccess(userId, row.daily_game_id);
    if (row.status === 'completed') return gameResult(row);
    assert(row.status === 'playing', 409, 'הניסיון אינו פעיל. / Attempt is not active.');
    const game = readJson(row.data), actualElapsed = Date.now() - new Date(row.started_at).getTime();
    assert(row.event_count === game.questions.length || actualElapsed >= game.timeLimit * 1000, 409, 'יש לסיים את השאלות לפני שמירת התוצאה. / Finish the questions before saving.', 'INCOMPLETE_GAME');
    assert(row.score <= game.questions.length * 300, 422, 'לא ניתן לאמת את הניקוד. / Score validation failed.');
    // profiles.timezone is learner-editable, so keying the once-a-day reward on it lets a learner
    // re-collect by switching zones. The quota boundary is server-authoritative UTC; the learner's
    // zone still drives which quest they see, which is content freshness rather than a reward.
    const rewardDay = quotaDay(new Date(row.started_at));
    const rewarded = one('SELECT id FROM xp_events WHERE user_id=? AND source=? AND source_id=?', userId, 'daily-game', rewardDay);
    const participated = row.event_count > 0 && !row.suspicious;
    const xp = rewarded || !participated ? 0 : 40 + row.correct * 5 + (row.correct === game.questions.length ? 20 : 0), coins = xp ? 4 + row.correct : 0;
    run("UPDATE daily_game_attempts SET status='completed',finished_at=?,elapsed_ms=?,xp=?,coins=?,updated_at=? WHERE id=?", now(), Math.max(row.elapsed_ms, Math.min(actualElapsed, game.timeLimit * 1000)), xp, coins, now(), row.id);
    if (!rewarded && participated) run('INSERT INTO xp_events(id,user_id,source,source_id,xp,coins,created_at) VALUES(?,?,?,?,?,?,?)', id(), userId, 'daily-game', rewardDay, xp, coins, now());
    if (!game.isCustom && row.first_attempt && participated && preferences(userId).leaderboards && isAdult(preferences(userId).birthYear)) run('INSERT OR IGNORE INTO leaderboards(id,user_id,daily_game_id,score,created_at,updated_at) VALUES(?,?,?,?,?,?)', id(), userId, row.daily_game_id, row.score, now(), now());
    if (participated) award(userId, 'first-game');
    if (participated && row.correct === game.questions.length) award(userId, 'perfect-game');
    if (row.correct < row.event_count && !row.suspicious) {
      const enrollment = one('SELECT * FROM path_enrollments WHERE user_id=? AND path_id=?', userId, row.path_id);
      if (enrollment) {
        const current = readJson(enrollment.adaptation), tasks = (findPath(row.path_id)?.chapters || []).flatMap((chapter: Row) => chapter.tasks);
        const weak = all('SELECT position FROM game_events WHERE attempt_id=? AND correct=0', row.id).map(event => game.questions[event.position].topic);
        const source = tasks.find((task: Row) => weak.some((topic: Row) => topic.he === task.title.he) && !one('SELECT id FROM reinforcement_submissions WHERE user_id=? AND enrollment_id=? AND source_task_id=?', userId, enrollment.id, task.id));
        const next = { ...current, gameReview: { attemptId: row.id, weakTopics: weak, correct: row.correct, total: row.event_count }, ...(source && current.reinforcement?.status !== 'suggested' ? { needsReinforcement: true, reinforcement: reinforcementProposal(source, row.id) } : {}) };
        run('UPDATE path_enrollments SET adaptation=?,updated_at=? WHERE id=? AND user_id=?', JSON.stringify(next), now(), enrollment.id, userId);
      }
    }
    if (participated) {
      updateStreak(userId);
      run('UPDATE challenge_participants SET score=MAX(score,?),updated_at=? WHERE user_id=? AND challenge_id IN (SELECT id FROM challenges WHERE path_id=(SELECT path_id FROM daily_games WHERE id=?) AND status=?)', row.score, now(), userId, row.daily_game_id, 'active');
    }
    audit(userId, 'game.finish', row.id, { xp, coins, score: row.score, suspicious: !!row.suspicious });
    return gameResult({ ...row, status: 'completed', finished_at: now(), elapsed_ms: Math.max(row.elapsed_ms, Math.min(actualElapsed, game.timeLimit * 1000)), xp, coins });
  });
}
function gameResult(row: Row) {
  const game = readJson(row.data), events = all('SELECT * FROM game_events WHERE attempt_id=? ORDER BY position', row.id);
  const strongTopics = events.filter(event => event.correct).map(event => game.questions[event.position].topic), weakTopics = events.filter(event => !event.correct).map(event => game.questions[event.position].topic);
  const best = one("SELECT MAX(a.score) AS best FROM daily_game_attempts a JOIN daily_games g ON g.id=a.daily_game_id WHERE a.user_id=? AND json_extract(g.data,'$.leaderboardGroup')=? AND a.status='completed' AND a.suspicious=0", row.user_id, game.leaderboardGroup)!.best || 0;
  const official = one("SELECT l.score FROM leaderboards l JOIN daily_games g ON g.id=l.daily_game_id WHERE l.user_id=? AND json_extract(g.data,'$.leaderboardGroup')=?", row.user_id, game.leaderboardGroup);
  const rank = official ? one("SELECT COUNT(*)+1 AS rank FROM leaderboards l JOIN daily_games g ON g.id=l.daily_game_id JOIN users u ON u.id=l.user_id WHERE json_extract(g.data,'$.leaderboardGroup')=? AND l.score>? AND u.blocked=0 AND u.deleted_at IS NULL", game.leaderboardGroup, official.score)!.rank : null;
  const recommendation = !events.length ? { he: 'לא נשלחו תשובות בניסיון הזה, ולכן אין עדיין נתוני דיוק. אפשר לחזור להוראות ולנסות לענות על השאלה הראשונה בניסיון הבא.', en: 'No answers were submitted in this attempt, so there is no accuracy data yet. Review the controls and try the first question in your next attempt.' } : events.length < game.questions.length ? { he: `נענו ${events.length} מתוך ${game.questions.length} שאלות; ${row.correct} תשובות היו נכונות. האתגר הושלם חלקית. כדאי לחזור להסברים ולהמשיך לתרגל את השאלות שנותרו.`, en: `You answered ${events.length} of ${game.questions.length} questions; ${row.correct} were correct. This was a partial attempt. Review the explanations and practice the remaining questions.` } : weakTopics.length ? { he: 'מומלץ לחזור עם המאמן על הנושאים שבהם טעית לפני המשימה הבאה.', en: 'Review the missed topics with your coach before the next task.' } : { he: 'דיוק יפה. אפשר להמשיך למשימה הבאה במסלול.', en: 'Good accuracy. Continue to the next task in your path.' };
  // The attempt is over, so every question the learner actually answered is reviewed with its
  // key: the same explanation the event response already showed, kept together for study.
  // Unanswered questions stay sealed — a second attempt is still ahead.
  const review = events.map(event => { const question = game.questions[event.position]; return { index: event.position, prompt: question.prompt, options: question.options, chosen: event.answer, answer: question.answer, correct: !!event.correct, explanation: question.explanation, topic: question.topic }; });
  return { ...attemptDto(row), mistakes: events.filter(event => !event.correct).length, personalBest: best, dailyRank: preferences(row.user_id).leaderboards ? rank : null, leaderboardScore: official?.score ?? null, strongTopics, weakTopics, review, achievements: !row.suspicious && row.correct === game.questions.length ? ['perfect-game'] : [], recommendation, isDemo: config.demo };
}
export function leaderboard(userId: string, gameId?: string | null) {
  const target = gameId || getDaily(userId).game.dailyGameId;
  const game = assertGameAccess(userId, target);
  if (readJson(game.data).isCustom) return [];
  return all("SELECT l.user_id,l.score,p.display_name,p.preferences,g.date,g.game_mode FROM leaderboards l JOIN profiles p ON p.user_id=l.user_id JOIN users u ON u.id=l.user_id JOIN daily_games g ON g.id=l.daily_game_id WHERE json_extract(g.data,'$.leaderboardGroup')=? AND u.deleted_at IS NULL AND u.blocked=0 ORDER BY l.score DESC,l.created_at ASC LIMIT 100", readJson(game.data).leaderboardGroup).filter(row => readJson(row.preferences).leaderboards).map((row, index) => ({ rank: index + 1, displayName: row.display_name, score: row.score, isYou: row.user_id === userId, isDemo: config.demo }));
}
