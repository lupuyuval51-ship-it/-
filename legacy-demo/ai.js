import { plans, config } from './config.js';
import { categories } from './catalog.js';
import { safeText } from './security.js';

const liveEnabled = () => Boolean(config.aiApiKey) && ['anthropic', 'claude'].includes(config.aiProvider);

export async function coachReply({ message, enrollment, path, planId, history = [], coachStyle = 'supportive' }) {
  if (liveEnabled()) {
    try {
      return await claudeReply({ message, enrollment, path, planId, history, coachStyle });
    } catch (e) {
      console.error('ai_provider_failed, falling back to demo coach:', e?.message || e);
    }
  }
  return demoReply({ message, enrollment, path, planId });
}

async function claudeReply({ message, enrollment, path, planId, history, coachStyle }) {
  const goal = enrollment?.customGoal || path?.goal || 'להתקדם באופן מדיד';
  const styleMap = { supportive: 'תומך ומעודד', direct: 'ישיר וענייני', playful: 'קליל ומשחקי' };
  const system = [
    'אתה "המאמן" של LEVELUP AI – פלטפורמת למידה מבוססת-משחק לצעירים.',
    `מטרת הלומד: ${goal}.`,
    path?.title ? `המסלול הפעיל: ${path.title}.` : '',
    enrollment?.level ? `רמת הלומד: ${enrollment.level}.` : '',
    `סגנון האימון המבוקש: ${styleMap[coachStyle] || styleMap.supportive}.`,
    'כללי עבודה מחייבים:',
    '- רמז לפני פתרון: לעולם אל תמסור תשובה מלאה לשאלת משימה או חידון. תן רמז מדורג, שאל מה כבר נוסה, וכוון לצעד הקטן הבא.',
    '- ענה בשפת ההודעה של הלומד (ברירת מחדל: עברית).',
    '- תשובות קצרות: עד כ-120 מילים, בלי כותרות.',
    '- שמור על תוכן בטוח ומתאים לגיל, בלי בקשת פרטים אישיים.',
    '- אם השאלה אינה קשורה ללמידה או למסלול, הפנה בעדינות חזרה למשימה הנוכחית.'
  ].filter(Boolean).join('\n');

  const messages = [];
  for (const m of [...history.slice(-10), { role: 'user', content: message }]) {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const content = String(m.content || '').slice(0, 2000);
    if (!content) continue;
    const last = messages.at(-1);
    if (last && last.role === role) last.content += `\n${content}`;
    else messages.push({ role, content });
  }
  if (messages[0]?.role !== 'user') messages.shift();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.aiApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01'
    },
    body: JSON.stringify({ model: config.aiModel, max_tokens: 1024, fallbacks: 'default', system, messages }),
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) throw new Error(`ai_http_${res.status}`);
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('ai_refusal');
  const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
  if (!text) throw new Error('ai_empty_reply');
  return { reply: text.slice(0, 4000), demo: false, model: data.model, planLimit: plans[planId]?.coachDailyLimit || 5 };
}

const taskSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    goal: { type: 'string' },
    minutes: { type: 'integer', minimum: 5, maximum: 120 },
    instructions: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
    example: { type: 'string' },
    hints: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'string' } },
    completion: { type: 'string' },
    quiz: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        options: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
        answerIndex: { type: 'integer', minimum: 0, maximum: 3 },
        explanation: { type: 'string' }
      },
      required: ['prompt', 'options', 'answerIndex', 'explanation'],
      additionalProperties: false
    }
  },
  required: ['title', 'goal', 'minutes', 'instructions', 'example', 'hints', 'completion', 'quiz'],
  additionalProperties: false
};

const pathSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    category: { type: 'string', enum: categories },
    description: { type: 'string' },
    goal: { type: 'string' },
    achievement: { type: 'string' },
    finalProject: { type: 'string' },
    chapters: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          tasks: { type: 'array', minItems: 2, maxItems: 2, items: taskSchema }
        },
        required: ['title', 'tasks'],
        additionalProperties: false
      }
    }
  },
  required: ['title', 'category', 'description', 'goal', 'achievement', 'finalProject', 'chapters'],
  additionalProperties: false
};

// Rewards, ids and plan-visible fields are assigned by the server, never by the model.
const chapterXp = [90, 110, 140];
const chapterIds = ['foundation', 'practice', 'project'];

function normalizePath(raw, { slug, level, durationDays, dailyMinutes }) {
  const chapters = raw.chapters.map((c, ci) => ({
    id: chapterIds[ci],
    title: safeText(c.title, 80),
    tasks: c.tasks.map((t, ti) => {
      const xp = chapterXp[ci];
      const options = t.quiz.options.map(o => safeText(o, 160));
      const answerIndex = Number.isInteger(t.quiz.answerIndex) && t.quiz.answerIndex >= 0 && t.quiz.answerIndex < options.length ? t.quiz.answerIndex : 0;
      return {
        id: `ai-${chapterIds[ci]}-${ti + 1}`,
        title: safeText(t.title, 90),
        summary: safeText(t.goal, 180),
        goal: safeText(t.goal, 180),
        minutes: Math.max(5, Math.min(120, Number(t.minutes) || dailyMinutes)),
        instructions: t.instructions.map(x => safeText(x, 300)).filter(Boolean),
        example: safeText(t.example, 500),
        hints: t.hints.map(x => safeText(x, 300)).filter(Boolean),
        resources: [],
        completion: safeText(t.completion, 300),
        quiz: { prompt: safeText(t.quiz.prompt, 300), options, answerIndex, explanation: safeText(t.quiz.explanation, 400) },
        xp,
        coins: Math.round(xp / 6)
      };
    })
  }));
  if (chapters.some(c => c.tasks.some(t => !t.title || !t.goal || t.instructions.length < 2 || t.hints.length < 2 || t.quiz.options.some(o => !o)))) return null;
  return {
    slug,
    generated: true,
    title: safeText(raw.title, 90),
    category: categories.includes(raw.category) ? raw.category : categories[0],
    difficulty: level,
    durationDays,
    dailyMinutes,
    goal: safeText(raw.goal, 180),
    description: safeText(raw.description, 500),
    achievement: safeText(raw.achievement, 90),
    chapters,
    finalProject: safeText(raw.finalProject, 300)
  };
}

export async function generatePath({ skill, goal, level, dailyMinutes, targetDate, styles = [], slug }) {
  if (!liveEnabled()) return null;
  const days = Math.max(3, Math.min(120, Math.ceil((new Date(targetDate) - Date.now()) / 86400000) || 14));
  const levelNames = { beginner: 'מתחיל', intermediate: 'בינוני', advanced: 'מתקדם' };
  const system = [
    'אתה מתכנן מסלולי למידה עבור LEVELUP AI, פלטפורמת למידה מבוססת-משחק לצעירים.',
    'בנה מסלול מעשי ומדורג בעברית, המורכב משלושה פרקים ובכל פרק שתי משימות.',
    'הפרקים בסדר: יסודות, תרגול, פרויקט. כל משימה חייבת להסתיים בתוצר שאפשר לבדוק.',
    'כל משימה כוללת שאלת בחינה אחת עם ארבע אפשרויות ותשובה נכונה אחת בלבד.',
    'כתוב הוראות קונקרטיות וברות-ביצוע, לא כותרות כלליות. התאם את היקף המשימה לזמן היומי שהוקצה.',
    'שמור על תוכן בטוח ומתאים לגיל, בלי בקשת פרטים אישיים ובלי הפניה לשירותים חיצוניים בתשלום.'
  ].join('\n');
  const user = [
    `מיומנות מבוקשת: ${skill}`,
    `מטרה אישית: ${goal}`,
    `רמה: ${levelNames[level] || level}`,
    `זמן פנוי ליום: ${dailyMinutes} דקות`,
    `מספר ימים עד תאריך היעד: ${days}`,
    styles.length ? `סגנונות למידה מועדפים: ${styles.map(s => safeText(s, 40)).join(', ')}` : '',
    `בחר קטגוריה אחת מתוך הרשימה המותרת שמתאימה ביותר למיומנות.`
  ].filter(Boolean).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.aiApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 16000,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { format: { type: 'json_schema', schema: pathSchema } }
    }),
    signal: AbortSignal.timeout(120000)
  });
  if (!res.ok) throw new Error(`ai_http_${res.status}`);
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('ai_refusal');
  const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
  if (!text) throw new Error('ai_empty_path');
  return normalizePath(JSON.parse(text), { slug, level, durationDays: days, dailyMinutes });
}

function demoReply({ message, enrollment, path, planId }) {
  const m = String(message || '').toLowerCase();
  const goal = enrollment?.customGoal || path?.goal || 'להתקדם באופן מדיד';
  let reply;
  if (/תשובה|answer|פתרון|solution/.test(m)) reply = 'אתן קודם רמז: פרק את המשימה לשלב הקטן ביותר שאפשר לבדוק. כתוב מה כבר ניסית, ואכוון אותך בלי לקפוץ ישר לפתרון.';
  else if (/קשה|תקוע|לא מצליח|stuck|hard/.test(m)) reply = `נקטין את הצעד. המטרה שלך היא ${goal}. בחר פעולה אחת של 10 דקות, בדוק מה השתנה, ורק אז המשך לשלב הבא.`;
  else reply = `המטרה שלך היא ${goal}. התמקד עכשיו במשימה אחת, בדוק אותה מול קריטריון ההשלמה, ורק אחר כך הוסף קושי. כתוב מה ניסית ומה קרה כדי לקבל כיוון מדויק יותר.`;
  return { reply, demo: true, planLimit: plans[planId]?.coachDailyLimit || 5 };
}
