import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/db/pool';
import { resetRateLimits } from '../src/middleware/rateLimit';
import { getAllExercises, isExerciseSuitable, type ExerciseRecord } from '../src/modules/exercises/repository';
import { compatibleTemplates, detectIntent, principleTopics, proteinFoods } from '../src/modules/coach/builtin';
import { ageGroup } from '../src/modules/coach/context';
import { findExercise, mentionedBodyAreas } from '../src/modules/coach/exerciseMatch';
import { buildTemplate, type FoodData } from '../src/modules/coach/foodData';
import { replyLanguage } from '../src/modules/coach/lang';
import { buildHistory } from '../src/modules/coach/prompt';
import { detectSafetyCategory } from '../src/modules/coach/safety';
import { disableLlm } from './helpers/fakeLlm';
import { onboardedUser, registerUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let exercises: ExerciseRecord[];

beforeAll(async () => {
  disableLlm();
  server = await startTestServer();
  exercises = await getAllExercises();
});
afterAll(async () => {
  await server.close();
  await db.close();
});
beforeEach(() => resetRateLimits());

async function ask(client: TestClient, content: string): Promise<string> {
  const thread = await client.post('/api/coach/threads', {});
  const res = await client.post(`/api/coach/threads/${thread.body.thread.id}/messages`, { content });
  expect(res.status).toBe(200);
  expect(res.body.reply.source).toBe('builtin');
  expect(res.body.reply.status).toBe('ok');
  return res.body.reply.content as string;
}

/** Library exercises whose (localized) name appears in bold in a reply. */
function boldExercises(text: string, lang: 'en' | 'he'): ExerciseRecord[] {
  const bold = [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]!.trim());
  return exercises.filter((e) => bold.includes(e.name[lang]));
}

describe('safety detection (unit)', () => {
  it.each([
    ['I am thinking about suicide', 'self_harm'],
    ['sometimes I want to die', 'self_harm'],
    ['אין לי בשביל מה לחיות', 'self_harm'],
    ['יש לי מחשבות לפגוע בעצמי', 'self_harm'],
    ['I felt dizzy and passed out after sprints', 'medical_red_flag'],
    ['sudden pain in my lower back during deadlift', 'medical_red_flag'],
    ['התעלפתי באימון', 'medical_red_flag'],
    ['יש לי קוצר נשימה וקשיי נשימה', 'medical_red_flag'],
    ['800 calorie diet for a month?', 'eating_disorder'],
    ['I only eat 700 kcal', 'eating_disorder'],
    ['I want to eat 900 calories per day', 'eating_disorder'],
    ['אני רוצה לאכול רק 600 קלוריות ביום', 'eating_disorder'],
    ['I want to kill myself after this workout', 'self_harm'],
    ['how much anavar should I take', 'ped_dosing'],
    ['should I take laxatives', 'eating_disorder'],
    ['I want to lose 20 pounds in 2 weeks', 'eating_disorder'],
    ['not eating for 3 days to drop weight', 'eating_disorder'],
    ['לצום שלושה ימים כדי לרדת במשקל', 'eating_disorder'],
    ['להוריד 5 ק"ג תוך שבוע', 'eating_disorder'],
    ['אני חושבת שיש לי בולימיה', 'eating_disorder'],
    ['best sarms stack for cutting', 'ped_dosing'],
    ['how to run tren safely', 'ped_dosing'],
    ['מינון טסטוסטרון לשבוע', 'ped_dosing'],
  ])('flags %s', (message, category) => {
    expect(detectSafetyCategory(message)).toBe(category);
  });

  it.each([
    'How do I avoid hurting myself when deadlifting?',
    'This workout is killing me haha',
    'How many calories are in 100 g of chicken?',
    'Is a 300 calorie breakfast ok?',
    'I burn 600 calories a day on the bike',
    'I want to lose 2 kg in a month',
    'lose 0.5 kg per week',
    'Should I try intermittent fasting 16:8?',
    'breakfast for 3 days in a row was oats',
    'How can I boost testosterone naturally?',
    'Are steroids dangerous?',
    'What is the trend of my weight?',
    'My knee hurts when I squat',
    'איך לא לפגוע בעצמי באימון?',
    'כמה חלבון יש בחזה עוף?',
    'אני רוצה לרדת 2 קילו בחודש',
    'צום יום כיפור – איך להתאמן אחריו?',
    'Should I eat 500 calories less per day to lose fat?',
    'Is eating 300 calories more a day enough for a bulk?',
    'I eat a 300 calorie snack every day, is that ok?',
    'A deficit of 400 kcal a day — is that sustainable?',
    'אני אוכל 500 קלוריות פחות ביום, זה בסדר?',
    'How do I do suicide sprints?',
    'How much protein should I take in the anabolic window?',
    'כמה זמן נמשך החלון האנבולי?',
  ])('does not flag %s', (message) => {
    expect(detectSafetyCategory(message)).toBeNull();
  });

  it('uses the user weight for the safe weekly loss rate', () => {
    // 1.5 kg/week: too fast at 70 kg (limit ~1 kg/week), within 1%/week at 160 kg.
    expect(detectSafetyCategory('lose 6 kg in 4 weeks', 70)).toBe('eating_disorder');
    expect(detectSafetyCategory('lose 6 kg in 4 weeks', 160)).toBeNull();
    expect(detectSafetyCategory('lose 3 kg in 4 weeks', 70)).toBeNull();
    expect(detectSafetyCategory('lose 6 kg in 3 weeks', 120)).toBe('eating_disorder');
  });
});

describe('language, matching and intents (unit)', () => {
  it('replies in the language of the message, falling back to the account language', () => {
    expect(replyLanguage('How do I squat?', 'he')).toBe('en');
    expect(replyLanguage('איך עושים סקוואט?', 'en')).toBe('he');
    expect(replyLanguage('איך עושים bench press נכון?', 'en')).toBe('he');
    expect(replyLanguage('3x8 ?', 'he')).toBe('he');
    expect(replyLanguage('👍', 'en')).toBe('en');
    expect(replyLanguage('ok', 'he')).toBe('he');
  });

  it('finds the exercise a message is about (EN + HE)', () => {
    const gym = { equipment: ['barbell', 'squat_rack', 'bench', 'dumbbells', 'pull_up_bar'] as ExerciseRecord['equipment'] };
    const id = (m: string, prefs = {}) => findExercise(m, exercises, prefs)?.id ?? null;
    expect(id('How do I squat with good form?', gym)).toBe('barbell_back_squat');
    expect(id('How do I squat with good form?', { equipment: [] })).toBe('bodyweight_squat');
    expect(id('squats', { userExerciseIds: new Set(['goblet_squat']) })).toBe('goblet_squat');
    expect(id('front squat cues')).toBe('front_squat');
    expect(id('bulgarian split squats hurt')).toBe('bulgarian_split_squat');
    expect(id('My shoulder hurts on bench press', { equipment: [] })).toBe('barbell_bench_press');
    expect(id('Romanian deadlift form')).toBe('romanian_deadlift');
    expect(id('deadlift form')).toBe('deadlift');
    expect(id('pull-ups are too hard')).toBe('pull_up');
    expect(id('leg curl alternative')).toBe('lying_leg_curl');
    expect(id('איך עושים סקוואט בולגרי?')).toBe('bulgarian_split_squat');
    expect(id('לחיצת חזה במשקולות יד')).toBe('dumbbell_bench_press');
    expect(id('הכתף כואבת לי בלחיצת חזה')).toBe('barbell_bench_press');
    expect(id('פרפר הפוך')).toBe('rear_delt_fly');
    expect(id('איך עושים עליות מתח?')).toBe('pull_up');
    expect(id('I trained 3 days in a row')).toBeNull();
    expect(id('What is progressive overload?')).toBeNull();
  });

  it('detects body areas mentioned in EN and HE', () => {
    expect(mentionedBodyAreas('My shoulder hurts on bench press')).toEqual(['shoulder']);
    expect(mentionedBodyAreas('הברך כואבת לי בסקוואט')).toEqual(['knee']);
    expect(mentionedBodyAreas('כאב בגב התחתון')).toEqual(['lower_back']);
    expect(mentionedBodyAreas('my wrists and elbows ache')).toEqual(['wrist', 'elbow']);
    expect(mentionedBodyAreas('back squat technique')).toEqual([]);
    expect(mentionedBodyAreas('אני גבוה ורוצה גבינה')).toEqual([]);
  });

  it.each([
    ['How do I squat with good form?', true, 'technique'],
    ['My shoulder hurts on bench press — what can I do instead?', true, 'alternatives'],
    ['Explain my progress this month', false, 'progress'],
    ['Am I eating enough protein?', false, 'nutrition'],
    ['Suggest a high-protein vegetarian dinner', false, 'meal_ideas'],
    ['What is progressive overload?', false, 'principles'],
    ['Should I change my plan?', false, 'plan'],
    ['איך עושים סקוואט נכון?', true, 'technique'],
    ['מה אפשר לעשות במקום דדליפט?', true, 'alternatives'],
    ['תסביר לי את ההתקדמות שלי', false, 'progress'],
    ['האם אני אוכל מספיק חלבון?', false, 'nutrition'],
    ['רעיון לארוחת ערב צמחונית', false, 'meal_ideas'],
    ['כמה זמן מנוחה בין סטים?', false, 'principles'],
    ['כדאי לי לשנות את התוכנית?', false, 'plan'],
    ['איך עושים סקוואט בטכניקה נכונה?', true, 'technique'],
    ['הכתף כואבת לי בלחיצת חזה – מה אפשר לעשות במקום?', true, 'alternatives'],
    ['האם צריכת החלבון שלי מספיקה?', false, 'nutrition'],
    ['תציע ארוחת ערב צמחונית עשירה בחלבון', false, 'meal_ideas'],
    ['hello there', false, 'fallback'],
    ['deadlift', true, 'technique'],
  ] as const)('%s → %s', (message, hasExercise, intent) => {
    expect(detectIntent(message, hasExercise)).toBe(intent);
  });

  it('detects principle topics', () => {
    expect(principleTopics('how long should I rest and how do I warm up?')).toEqual(['rest', 'warm_up']);
    expect(principleTopics('מתי לעשות שבוע הקלה?')).toEqual(['deload']);
  });

  it('builds age groups without exact ages', () => {
    expect(ageGroup(15)).toBe('teen (13–17)');
    expect(ageGroup(18)).toBe('adult 18–24');
    expect(ageGroup(30)).toBe('adult 25–34');
    expect(ageGroup(70)).toBe('adult 65+');
    expect(ageGroup(null)).toBeNull();
  });

  it('keeps the last 12 non-error history messages, trimmed', () => {
    const msgs = Array.from({ length: 15 }, (_, i) => ({ role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant', content: `m${i}`, status: 'ok' as const }));
    msgs[13] = { role: 'assistant', content: 'broken', status: 'error' as never };
    msgs[14] = { role: 'user', content: 'y'.repeat(3000), status: 'ok' };
    const out = buildHistory(msgs);
    expect(out).toHaveLength(12);
    expect(out.some((m) => m.content === 'broken')).toBe(false);
    expect(out.at(-1)!.content.length).toBeLessThanOrEqual(2000);
    expect(out.at(-1)!.content.endsWith('…')).toBe(true);
  });
});

describe('meal ideas filtering (unit)', () => {
  const food = (slug: string, extra: Partial<FoodData>): FoodData => ({
    slug,
    name: { en: slug, he: slug },
    category: 'prepared_dishes',
    per100g: { kcal: 150, protein: 15, carbs: 10, fat: 5, fiber: 1 },
    servingGrams: 100,
    servingLabel: { en: '100 g', he: '100 גר׳' },
    allergens: [],
    animalSource: 'none',
    contains: [],
    ...extra,
  });
  const foods = new Map(
    [
      food('tahini', { allergens: ['sesame'] }),
      food('chicken', { animalSource: 'meat', per100g: { kcal: 165, protein: 31, carbs: 0, fat: 4, fiber: 0 } }),
      food('lentils', { per100g: { kcal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 } }),
      food('yogurt', { animalSource: 'dairy_egg', allergens: ['dairy'], contains: ['lactose'] }),
      food('rice', { category: 'grains', per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 } }),
      food('mushroom_omelette', { animalSource: 'dairy_egg', allergens: ['egg'] }),
    ].map((f) => [f.slug, f]),
  );
  const tpl = (slug: string, items: string[]) =>
    buildTemplate({ slug, name: { en: slug, he: slug }, description: { en: '', he: '' }, mealTypes: ['dinner'], prepMinutes: 10, items: items.map((s) => ({ foodSlug: s, grams: 150 })) }, foods)!;
  const templates = [tpl('chicken_rice', ['chicken', 'rice']), tpl('lentil_tahini', ['lentils', 'tahini']), tpl('lentil_rice', ['lentils', 'rice']), tpl('yogurt_bowl', ['yogurt']), tpl('omelette', ['mushroom_omelette'])];

  it('computes template macros from the ingredients', () => {
    expect(templates[0]!.macros.proteinG).toBe(50.6);
    expect(buildTemplate({ slug: 'x', name: { en: 'x', he: 'x' }, description: { en: '', he: '' }, mealTypes: [], prepMinutes: 1, items: [{ foodSlug: 'missing', grams: 1 }] }, foods)).toBeNull();
  });

  it('respects allergies, diet type, restrictions and dislikes', () => {
    const slugs = (prefs: Parameters<typeof compatibleTemplates>[1], disliked: string[] = []) => compatibleTemplates(templates, prefs, disliked).map((t) => t.slug);
    expect(slugs([{ dietType: 'omnivore', allergies: [], restrictions: [] }])).toEqual(['chicken_rice', 'lentil_tahini', 'lentil_rice', 'yogurt_bowl', 'omelette']);
    expect(slugs([{ dietType: 'vegetarian', allergies: ['sesame'], restrictions: [] }])).toEqual(['lentil_rice', 'yogurt_bowl', 'omelette']);
    expect(slugs([{ dietType: 'omnivore', allergies: [], restrictions: ['lactose_free'] }, { dietType: 'vegan', allergies: [], restrictions: [] }])).toEqual(['lentil_tahini', 'lentil_rice']);
    expect(slugs([{ dietType: null, allergies: [], restrictions: [] }], ['mushroom'])).not.toContain('omelette');
    const picks = proteinFoods([...foods.values()], [{ dietType: 'vegan', allergies: ['sesame'], restrictions: [] }], []).map((f) => f.slug);
    expect(picks).toEqual(['lentils']);
  });
});

describe('built-in coach answers (API, no AI provider)', () => {
  it('explains technique from the library in English', async () => {
    const user = await onboardedUser(server.baseUrl);
    const text = await ask(user, 'How do I squat with good form?');
    const squat = exercises.find((e) => e.id === 'barbell_back_squat')!;
    expect(text).toContain('**Barbell Back Squat**');
    expect(text).toContain('**How to do it**');
    expect(text).toContain(`1. ${squat.instructions.en[0]}`);
    expect(text).toContain('**Common mistakes**');
    expect(text).toContain(`- ${squat.mistakes.en[0]}`);
    expect(text).toContain('**Safety**');
  });

  it('explains technique from the library in Hebrew', async () => {
    const user = await onboardedUser(server.baseUrl, {}, { locale: 'he' });
    const text = await ask(user, 'איך עושים סקוואט קדמי נכון?');
    const front = exercises.find((e) => e.id === 'front_squat')!;
    expect(text).toContain(`**${front.name.he}**`);
    expect(text).toContain('**איך מבצעים**');
    expect(text).toContain(`1. ${front.instructions.he[0]}`);
    expect(text).toContain('**טעויות נפוצות**');
    expect(text).toContain('**בטיחות**');
    // An English message from the same Hebrew-locale user is answered in English.
    const en = await ask(user, 'How do I do a front squat?');
    expect(en).toContain('**How to do it**');
  });

  it('warns when the exercise conflicts with a reported injury or missing equipment', async () => {
    const user = await onboardedUser(server.baseUrl, { training_location: 'home', equipment: ['dumbbells'], injuries: ['knee'] });
    const text = await ask(user, 'How do I do a barbell back squat?');
    expect(text).toContain('**For you**');
    expect(text).toContain('You reported a knee issue');
    expect(text).toMatch(/Your profile doesn't list barbell and squat rack/);
  });

  it('suggests alternatives that fit the equipment and avoid the painful area', async () => {
    const user = await onboardedUser(server.baseUrl);
    const text = await ask(user, 'My shoulder hurts on bench press — what can I do instead?');
    expect(text).toContain('If an exercise hurts, stop doing it for now');
    expect(text).toContain('**Alternatives to Barbell Bench Press**');
    const listed = boldExercises(text, 'en').filter((e) => e.id !== 'barbell_bench_press');
    expect(listed.length).toBeGreaterThanOrEqual(2);
    for (const e of listed) expect(e.contraindications, e.id).not.toContain('shoulder');
  });

  it('respects home equipment and profile injuries in alternatives (Hebrew)', async () => {
    const equipment = ['dumbbells'] as ExerciseRecord['equipment'];
    const user = await onboardedUser(server.baseUrl, { training_location: 'home', equipment, injuries: ['wrist'] }, { locale: 'he' });
    const text = await ask(user, 'מה אפשר לעשות במקום לחיצת חזה במוט?');
    expect(text).toContain('**חלופות ללחיצת חזה במוט**');
    const listed = boldExercises(text, 'he').filter((e) => e.id !== 'barbell_bench_press');
    expect(listed.length).toBeGreaterThanOrEqual(1);
    for (const e of listed) expect(isExerciseSuitable(e, equipment, ['wrist']), e.id).toBe(true);
  });

  it('asks which exercise to replace when none is named', async () => {
    const user = await onboardedUser(server.baseUrl);
    const text = await ask(user, 'My knee hurts, what can I do instead?');
    expect(text).toContain('Which exercise would you like to replace?');
  });

  it('says honestly that there is no progress data yet', async () => {
    const user = await onboardedUser(server.baseUrl);
    const text = await ask(user, 'Explain my progress this month');
    expect(text).toContain("I don't see any completed workouts yet");
    expect(text).not.toMatch(/\d+ in the last 7 days/);
    expect(text).not.toContain('personal records in the last');
    const he = await onboardedUser(server.baseUrl, {}, { locale: 'he' });
    expect(await ask(he, 'תסביר לי את ההתקדמות שלי החודש')).toContain('עדיין אין אימונים שהושלמו');
  });

  it('says honestly when no food was logged', async () => {
    const user = await onboardedUser(server.baseUrl);
    const text = await ask(user, 'Am I eating enough protein?');
    expect(text).toMatch(/\*\*Your daily targets:\*\* [\d,]+ kcal/);
    expect(text).toContain("You haven't logged food in the previous 7 days");
  });

  it('meal ideas respect allergies and the requested diet', async () => {
    const user = await onboardedUser(server.baseUrl, { diet_type: 'omnivore', allergies: ['peanut', 'sesame', 'dairy'] });
    const text = await ask(user, 'Suggest a high-protein vegetarian dinner');
    expect(text).toMatch(/vegetarian, without peanuts, sesame and dairy/);
    const forbidden = await db.many<{ name: { en: string } }>(
      `SELECT name FROM foods WHERE source = 'builtin' AND (allergens && ARRAY['peanut','sesame','dairy']::text[] OR animal_source IN ('meat','fish'))`,
    );
    for (const f of forbidden) expect(text).not.toContain(`**${f.name.en}**`);
    const templates = await db.many<{ name: { en: string }; items: { foodSlug: string }[] }>('SELECT name, items FROM meal_templates');
    const forbiddenSlugs = new Set(
      (await db.many<{ slug: string }>(`SELECT slug FROM foods WHERE allergens && ARRAY['peanut','sesame','dairy']::text[] OR animal_source IN ('meat','fish')`)).map((r) => r.slug),
    );
    for (const t of templates) if (t.items.some((i) => forbiddenSlugs.has(i.foodSlug))) expect(text).not.toContain(`**${t.name.en}**`);
    expect(text).toMatch(/- \*\*.+\*\* —/); // at least one suggestion
  });

  it('explains training principles in both languages', async () => {
    const user = await onboardedUser(server.baseUrl, { goal: 'strength' });
    const reps = await ask(user, 'How many reps should I do?');
    expect(reps).toContain('**Rep ranges**');
    expect(reps).toContain('For your goal (strength)');
    const he = await onboardedUser(server.baseUrl, {}, { locale: 'he' });
    expect(await ask(he, 'מה זה עומס הדרגתי?')).toContain('**עומס הדרגתי (Progressive overload)**');
  });

  it('handles plan questions without a plan, and unknown questions with examples', async () => {
    const user = await onboardedUser(server.baseUrl);
    expect(await ask(user, 'Should I change my plan?')).toContain("You don't have an active workout plan yet");
    const fallback = await ask(user, 'hello');
    expect(fallback).toContain("I'm LUPU-FIT's built-in coach");
    expect(fallback).toContain('- What is progressive overload?');
    const he = await registerUser(server.baseUrl, { locale: 'he' });
    expect(await ask(he, 'שלום')).toContain('אני המאמן המובנה של LUPU-FIT');
  });
});
