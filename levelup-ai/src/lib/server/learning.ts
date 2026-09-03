import { z } from 'zod';
import { all, audit, id, now, one, readJson, run, transaction, type Row } from './db';
import { assert, rateLimit } from './auth';
import { assertEnrollment, assertPathAccess, award, entitlementsFor, pathById, planFor, publicPath, updateStreak } from './store';
import { generatePathDraft, type PathGenerationResult } from './path-generation';
import type { StructuredAIProvider } from './ai-provider';

const enrollmentSchema = z.object({ pathId: z.string().max(100).optional(), skill: z.string().trim().min(2).max(160).optional(), level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'), dailyMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(60)]).default(20), goal: z.string().trim().max(500).default(''), targetDate: z.iso.date().optional(), styles: z.array(z.enum(['reading', 'watching', 'questions', 'practice', 'project', 'games', 'all', 'mixed', 'read', 'watch', 'quiz'])).max(7).default(['practice', 'games']) });
export async function enroll(userId: string, data: unknown, provider?: StructuredAIProvider) {
  const input = enrollmentSchema.parse(data);
  if (input.targetDate) assert(input.targetDate >= new Date().toISOString().slice(0, 10), 400, 'תאריך היעד צריך להיות היום או בעתיד. / Choose a current or future target date.');
  const cap = entitlementsFor(userId).maxActivePaths;
  if (input.pathId) {
    assertPathAccess(userId, input.pathId);
    const existing = one('SELECT id FROM path_enrollments WHERE user_id=? AND path_id=?', userId, input.pathId);
    if (existing) { const path = pathById(input.pathId); return { enrollmentId: existing.id, alreadyEnrolled: true, path: publicPath(path), source: path.source || 'catalog', sourceNotice: path.sourceNotice }; }
  }
  let generated: PathGenerationResult | undefined;
  if (!input.pathId) {
    assert(input.skill, 400, 'יש לבחור מיומנות. / Choose a skill.');
    assert(one("SELECT COUNT(*) AS count FROM path_enrollments WHERE user_id=? AND status='active'", userId)!.count < cap, 403, 'הגעת למספר המסלולים הפעילים בתוכנית שלך. / Active path limit reached.', 'PATH_LIMIT');
    const generationLimit = { FREE: 3, BASIC: 3, PLUS: 10, PRO: 20 }[planFor(userId)];
    rateLimit(`path-generation:${userId}`, generationLimit, 86400);
    generated = await generatePathDraft({ ...input, skill: input.skill }, provider);
  }
  return transaction(() => {
    const pathId = generated?.path.id || input.pathId!;
    const path = generated?.path || pathById(pathId);
    if (!generated?.isNew) {
      assertPathAccess(userId, pathId);
      const listing = one('SELECT * FROM marketplace_paths WHERE path_id=?', pathId);
      assert(!listing || listing.status === 'approved' || listing.creator_id === userId, 403, 'המסלול עדיין אינו זמין. / This path is not published.');
      if (listing && listing.price > 0 && listing.creator_id !== userId) assert(one("SELECT ms.id FROM marketplace_sales ms JOIN orders o ON o.id=ms.order_id WHERE ms.marketplace_path_id=? AND ms.buyer_id=? AND o.status='approved'", listing.id, userId), 403, 'נדרשת רכישת המסלול. / Purchase this path to enroll.', 'PURCHASE_REQUIRED');
    }
    const existing = one('SELECT id FROM path_enrollments WHERE user_id=? AND path_id=?', userId, pathId);
    if (existing) return { enrollmentId: existing.id, alreadyEnrolled: true, path: publicPath(path), source: generated?.source || 'catalog', sourceNotice: generated?.notice };
    assert(one("SELECT COUNT(*) AS count FROM path_enrollments WHERE user_id=? AND status='active'", userId)!.count < cap, 403, 'הגעת למספר המסלולים הפעילים בתוכנית שלך. / Active path limit reached.', 'PATH_LIMIT');
    const time = now(), target = input.targetDate || new Date(Date.now() + path.durationDays * 86400000).toISOString().slice(0, 10), enrollmentId = id();
    const source = generated?.source || 'catalog';
    const notice = generated?.notice || { he: 'המסלול מוכן. הקצב והמשימות יתעדכנו לפי ההתקדמות שלך.', en: 'Your path is ready. Pacing adapts to your progress.' };
    const storedPath = generated?.isNew ? { ...path, isPrivate: true, isMarketplace: false, source, sourceNotice: notice, generation: { source, isDemo: generated.isDemo, notice, reviewedByExpert: false }, isDemo: generated.isDemo } : path;
    if (generated?.isNew) {
      run('INSERT INTO learning_paths(id,title,category,data,created_at,updated_at) VALUES(?,?,?,?,?,?)', pathId, JSON.stringify(path.title), path.category, JSON.stringify(storedPath), time, time);
      run('INSERT INTO private_path_owners(path_id,user_id,created_at,updated_at) VALUES(?,?,?,?)', pathId, userId, time, time);
      for (const [chapterIndex, chapter] of path.chapters.entries()) {
        run('INSERT INTO chapters(id,path_id,position,title,created_at,updated_at) VALUES(?,?,?,?,?,?)', chapter.id, pathId, chapterIndex, JSON.stringify(chapter.title), time, time);
        for (const task of chapter.tasks) {
          run('INSERT INTO lessons(id,chapter_id,title,created_at,updated_at) VALUES(?,?,?,?,?)', task.id, chapter.id, JSON.stringify(task.title), time, time);
          run('INSERT INTO tasks(id,lesson_id,data,created_at,updated_at) VALUES(?,?,?,?,?)', task.id, task.id, JSON.stringify(task), time, time);
        }
      }
      audit(userId, 'ai.path-created', pathId, { provider: generated.isDemo ? 'demo' : 'claude', source, chapterCount: path.chapters.length, taskCount: path.chapters.reduce((count: number, chapter: Row) => count + chapter.tasks.length, 0), inputCharacters: (input.skill || '').length + input.goal.length });
    }
    run('INSERT INTO path_enrollments(id,user_id,path_id,skill,level,daily_minutes,goal,target_date,styles,adaptation,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', enrollmentId, userId, pathId, input.skill || path.title.he, input.level, input.dailyMinutes, input.goal || path.description.he, target, JSON.stringify(input.styles), JSON.stringify({ source, he: notice.he, en: notice.en, suggestedDifficulty: input.level, dailyMinutes: input.dailyMinutes }), time, time);
    audit(userId, 'path.enroll', enrollmentId, { pathId, source });
    return { enrollmentId, path: publicPath(storedPath), generation: ['goal', 'level', 'path', 'tasks', 'quest', 'ready'], source, sourceNotice: notice };
  });
}
const submissionSchema = z.object({ enrollmentId: z.string().max(100), taskId: z.string().max(100), text: z.string().trim().max(20000).default(''), link: z.url().refine(url => /^https?:\/\//.test(url), 'Only HTTP(S) links are allowed').optional().or(z.literal('')), fileId: z.string().max(100).optional(), answer: z.number().int().min(0).max(10).optional(), difficulty: z.enum(['easy', 'right', 'hard']).default('right') });
export function submitTask(userId: string, data: unknown) {
  const input = submissionSchema.parse(data);
  assert(input.text.length >= 10 || input.link || input.fileId || input.answer !== undefined, 400, 'צרפו לפחות 10 תווים, קישור או קובץ לתיעוד התרגול. / Add at least 10 characters, a link or a file.', 'PROOF_REQUIRED');
  return transaction(() => {
    const enrollment = assertEnrollment(userId, input.enrollmentId), path = pathById(enrollment.path_id);
    const tasks = path.chapters.flatMap((chapter: Row) => chapter.tasks), task = tasks.find((item: Row) => item.id === input.taskId);
    assert(task, 404, 'המשימה לא נמצאה. / Task not found.');
    const existing = one('SELECT id FROM task_submissions WHERE user_id=? AND enrollment_id=? AND task_id=?', userId, enrollment.id, task.id);
    assert(!existing, 409, 'המשימה כבר הושלמה והפרס נשמר. / Task already completed. Reward is saved.', 'ALREADY_COMPLETED');
    const done = all('SELECT task_id FROM task_submissions WHERE enrollment_id=? AND user_id=?', enrollment.id, userId).map(row => row.task_id);
    const firstIncomplete = tasks.find((item: Row) => !done.includes(item.id));
    assert(firstIncomplete?.id === task.id, 409, 'יש להשלים קודם את המשימה הקודמת. / Complete the preceding task first.', 'TASK_LOCKED');
    if (input.fileId) assert(one('SELECT id FROM payment_proofs WHERE id=? AND user_id=? AND purpose=? AND deleted_at IS NULL', input.fileId, userId, 'task'), 400, 'הקובץ לא נמצא או אינו שייך לך. / Invalid file.');
    if (task.type === 'quiz') assert(input.answer !== undefined, 400, 'יש לענות על השאלה לפני השלמת השאלון. / Answer the question before completing the quiz.', 'ANSWER_REQUIRED');
    if (input.answer !== undefined && task.question) assert(input.answer === task.question.answer, 422, task.question.explanation.he + ' / ' + task.question.explanation.en, 'ANSWER_INCORRECT');
    const feedback = { he: input.answer !== undefined ? 'התשובה נכונה. התרגול הושלם וההתקדמות נשמרה.' : 'התרגול תועד כהשלמה בדיווח עצמי. מומלץ לבדוק את התוצאה מול מטרת המשימה.', en: input.answer !== undefined ? 'Correct answer. Your practice and progress are saved.' : 'Practice saved as a self-reported completion. Review your result against the task objective.' };
    const xp = Math.max(0, Math.min(Number(task.xp), 250)), submissionId = id(), time = now();
    run('INSERT INTO task_submissions(id,user_id,enrollment_id,task_id,text,link,file_id,difficulty,feedback,xp,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', submissionId, userId, enrollment.id, task.id, input.text, input.link || null, input.fileId || null, input.difficulty, JSON.stringify(feedback), xp, time, time);
    run('INSERT INTO xp_events(id,user_id,source,source_id,xp,coins,created_at) VALUES(?,?,?,?,?,?,?)', id(), userId, 'task', submissionId, xp, Math.floor(xp / 10), time);
    const recent = all('SELECT difficulty FROM task_submissions WHERE user_id=? AND enrollment_id=? ORDER BY created_at DESC LIMIT 3', userId, enrollment.id);
    const hardCount = recent.filter(row => row.difficulty === 'hard').length;
    const adaptation = { suggestedDifficulty: input.difficulty === 'hard' ? 'beginner' : input.difficulty === 'easy' ? 'advanced' : enrollment.level, dailyMinutes: input.difficulty === 'hard' ? Math.min(20, enrollment.daily_minutes) : enrollment.daily_minutes, needsReinforcement: input.difficulty === 'hard', repeatedDifficulty: hardCount >= 2, topic: task.title, he: input.difficulty === 'hard' ? 'במשימה הבאה נתחיל ברמז ובחזרה קצרה. תוכן המסלול ותאריך היעד נשארים בשליטתך.' : input.difficulty === 'easy' ? 'אפשר להוסיף אתגר הרחבה למשימה הבאה. המסלול המקורי נשמר.' : 'הקצב מתאים. אפשר להמשיך למשימה הבאה.', en: input.difficulty === 'hard' ? 'The next task will start with a hint and a short review. You control the path and deadline.' : input.difficulty === 'easy' ? 'An extension challenge is suggested for the next task. The original path is kept.' : 'Your pace is a good fit. Continue to the next task.', proposedTargetDate: hardCount >= 2 ? new Date(new Date(enrollment.target_date).getTime() + 2 * 86400000).toISOString().slice(0, 10) : null, deadlineRequiresApproval: hardCount >= 2 };
    const previousAdaptation = readJson(enrollment.adaptation);
    const reinforcement = input.difficulty === 'hard' ? reinforcementProposal(task, submissionId) : previousAdaptation.reinforcement || null;
    // Pausing is how a learner stays under the active-path cap; finishing a task must not undo it.
    const nextStatus = done.length + 1 === tasks.length ? 'completed' : enrollment.status === 'paused' ? 'paused' : 'active';
    run('UPDATE path_enrollments SET adaptation=?,status=?,updated_at=? WHERE id=? AND user_id=?', JSON.stringify({ ...adaptation, reinforcement }), nextStatus, time, enrollment.id, userId);
    award(userId, 'first-task');
    if (done.length + 1 === tasks.length) award(userId, 'path-complete');
    updateStreak(userId);
    const mastery = Math.round((done.length + 1) / tasks.length * 100);
    run('INSERT OR IGNORE INTO skills(id,name,created_at,updated_at) VALUES(?,?,?,?)', path.category, JSON.stringify(path.title), time, time);
    run('INSERT INTO user_skills(id,user_id,skill_id,mastery,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,skill_id) DO UPDATE SET mastery=MAX(user_skills.mastery,excluded.mastery),updated_at=excluded.updated_at', id(), userId, path.category, mastery, time, time);
    audit(userId, 'task.complete', task.id, { enrollmentId: enrollment.id, xp, difficulty: input.difficulty });
    return { submissionId, feedback, xp, coins: Math.floor(xp / 10), adaptation: { ...adaptation, reinforcement } };
  });
}
export function reinforcementProposal(task: Row, sourceId: string) {
  return { id: `review-${sourceId}`, sourceTaskId: task.id, title: { he: `תרגול חיזוק: ${task.title.he}`, en: `Reinforcement: ${task.title.en}` }, description: task.objective, instructions: { he: [task.hints.he[0] || task.instructions.he[0], 'בצעו שוב את הצעד הראשון על דוגמה קטנה יותר.', 'ענו על השאלה וכתבו מה הבנתם אחרת הפעם.'], en: [task.hints.en[0] || task.instructions.en[0], 'Repeat the first step with a smaller example.', 'Answer the question and describe what became clearer this time.'] }, question: task.question ? { prompt: task.question.prompt, options: task.question.options } : null, minutes: 10, xp: 20, status: 'suggested' };
}
export function taskGuidance(userId: string, enrollmentId: string, taskId: string) {
  const enrollment = assertEnrollment(userId, enrollmentId), path = pathById(enrollment.path_id), task = path.chapters.flatMap((chapter: Row) => chapter.tasks).find((item: Row) => item.id === taskId);
  assert(task, 404, 'המשימה לא נמצאה. / Task not found.');
  const adaptation = readJson(enrollment.adaptation), pacing = Math.min(task.minutes, adaptation.dailyMinutes || enrollment.daily_minutes);
  return { estimatedMinutes: pacing, fullTaskMinutes: task.minutes, splitAcrossSessions: pacing < task.minutes, instructions: adaptation.needsReinforcement ? { he: [task.hints.he[0] || task.instructions.he[0], ...task.instructions.he], en: [task.hints.en[0] || task.instructions.en[0], ...task.instructions.en] } : task.instructions, reinforcement: adaptation.reinforcement || null, deadlineProposal: adaptation.proposedTargetDate ? { current: enrollment.target_date, proposed: adaptation.proposedTargetDate, requiresApproval: true } : null, extension: adaptation.suggestedDifficulty === 'advanced' ? { he: 'לאחר השלמת הדוגמה, צרו גרסה נוספת עם שינוי אחד והסבירו את ההבדל.', en: 'After completing the example, create one variation and explain the difference.' } : null };
}
export function completeReinforcement(userId: string, data: unknown) {
  const input = z.object({ enrollmentId: z.string().max(100), answer: z.number().int().min(0).max(10).optional(), text: z.string().trim().min(10).max(5000) }).parse(data);
  return transaction(() => {
    const enrollment = assertEnrollment(userId, input.enrollmentId), adaptation = readJson(enrollment.adaptation), review = adaptation.reinforcement;
    assert(review && review.status === 'suggested', 409, 'אין כרגע משימת חיזוק חדשה. / No new reinforcement is currently suggested.', 'NO_REINFORCEMENT');
    assert(!one('SELECT id FROM reinforcement_submissions WHERE user_id=? AND enrollment_id=? AND source_task_id=?', userId, enrollment.id, review.sourceTaskId), 409, 'משימת החיזוק כבר הושלמה. / Reinforcement already completed.', 'ALREADY_COMPLETED');
    const path = pathById(enrollment.path_id), source = path.chapters.flatMap((chapter: Row) => chapter.tasks).find((task: Row) => task.id === review.sourceTaskId);
    assert(source, 404, 'המשימה המקורית לא נמצאה. / Original task not found.');
    if (source.question) assert(input.answer === source.question.answer, 422, source.question.explanation.he + ' / ' + source.question.explanation.en, 'ANSWER_INCORRECT');
    const submissionId = id(), time = now(), xp = 20;
    run('INSERT INTO reinforcement_submissions(id,user_id,enrollment_id,source_task_id,text,xp,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)', submissionId, userId, enrollment.id, source.id, input.text, xp, time, time);
    run('INSERT INTO xp_events(id,user_id,source,source_id,xp,coins,created_at) VALUES(?,?,?,?,?,?,?)', id(), userId, 'reinforcement', `${enrollment.id}:${source.id}`, xp, 2, time);
    const updated = { ...adaptation, needsReinforcement: false, reinforcement: { ...review, status: 'completed', completedAt: time } };
    run('UPDATE path_enrollments SET adaptation=?,updated_at=? WHERE id=? AND user_id=?', JSON.stringify(updated), time, enrollment.id, userId);
    updateStreak(userId); audit(userId, 'task.reinforcement', source.id, { enrollmentId: enrollment.id, xp });
    return { xp, coins: 2, adaptation: updated };
  });
}
export function updateEnrollment(userId: string, enrollmentId: string, data: unknown) {
  const input = z.object({ targetDate: z.iso.date().optional(), dailyMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(60)]).optional(), status: z.enum(['active', 'paused']).optional() }).parse(data);
  const row = assertEnrollment(userId, enrollmentId);
  if (input.targetDate) { assert(input.targetDate >= new Date().toISOString().slice(0, 10), 400, 'בחרו תאריך עתידי. / Select a future date.'); run('UPDATE path_enrollments SET target_date=?,updated_at=? WHERE id=? AND user_id=?', input.targetDate, now(), enrollmentId, userId); }
  if (input.dailyMinutes) run('UPDATE path_enrollments SET daily_minutes=?,updated_at=? WHERE id=? AND user_id=?', input.dailyMinutes, now(), enrollmentId, userId);
  if (input.status) {
    if (input.status === 'active' && row.status !== 'active') assert(one("SELECT COUNT(*) AS count FROM path_enrollments WHERE user_id=? AND status='active'", userId)!.count < entitlementsFor(userId).maxActivePaths, 403, 'Active path limit reached.');
    run('UPDATE path_enrollments SET status=?,updated_at=? WHERE id=? AND user_id=?', input.status, now(), enrollmentId, userId);
  }
  audit(userId, 'path.update', enrollmentId, input);
  return { adaptation: readJson(row.adaptation) };
}
