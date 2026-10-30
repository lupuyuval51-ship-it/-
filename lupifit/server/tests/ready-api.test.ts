/**
 * Ready workouts over HTTP: list, preview and starting a session, against the real Express app and PostgreSQL.
 *
 * The shipped workout data is being written by other people, so nothing here depends on it: the service is pointed at
 * a small fixture catalog (`useReadyDataForTests`) built only from exercises of the original library, which the test
 * database has (it is seeded from the same library).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ageRules, isExternallyLoaded, isHighImpact } from '@shared/age';
import { SPORTS, type Equipment, type InjuryArea, type TrainingLocation } from '@shared/constants';
import type { ReadyItemSeed, ReadyWorkoutSeed, SportBlockSeed } from '@shared/content';
import type { ReadyDetailResponse, ReadyListResponse, ReadyWorkoutSummaryDTO, WorkoutSessionDTO } from '@shared/types';
import { EXERCISE_LIBRARY } from '../src/data/exercises/index';
import { READY_WORKOUTS } from '../src/data/ready-workouts/index';
import { SPORT_BLOCKS } from '../src/data/sport-blocks/index';
import { db } from '../src/db/pool';
import { READY_NOTE_CODES } from '../src/modules/ready/adapt';
import { READY_WARMUP_MINUTES, RESISTANCE_GEAR, blockSeconds, deriveEquipment, deriveMuscles, effectiveEquipment, lookupOf, workoutMinutes } from '../src/modules/ready/rules';
import { getReady, listReady, useReadyDataForTests } from '../src/modules/ready/service';
import { getExerciseMap } from '../src/modules/exercises/repository';
import { TestClient, onboardedUser, registerUser, startTestServer, type TestServer } from './helpers/server';

// ---------------------------------------------------------------- Fixtures

/** The library before the *_extra files were appended. */
const ORIGINAL = EXERCISE_LIBRARY.slice(0, 119);
const lookup = lookupOf(ORIGINAL);
const nameOf = (id: string, lang: 'en' | 'he' = 'en') => lookup.get(id)!.name[lang];

const reps = (exerciseId: string, sets = 3, r: [number, number] = [8, 12], restSeconds = 60, cue?: ReadyItemSeed['cue']): ReadyItemSeed =>
  cue ? { exerciseId, sets, reps: r, restSeconds, cue } : { exerciseId, sets, reps: r, restSeconds };
const hold = (exerciseId: string, seconds = 30, sets = 3, restSeconds = 45): ReadyItemSeed => ({ exerciseId, sets, seconds, restSeconds });

const PUSH: ReadyWorkoutSeed = {
  id: 'api_push_bodyweight',
  name: { en: 'Bodyweight push basics', he: 'יסודות דחיפה במשקל גוף' },
  description: { en: 'A fixture chest workout without any equipment.', he: 'אימון חזה לדוגמה בלי ציוד.' },
  focus: 'chest',
  mode: 'bodyweight',
  level: 'beginner',
  places: ['home', 'outdoor', 'gym'],
  items: [reps('incline_push_up'), reps('knee_push_up'), reps('push_up', 3, [6, 10]), hold('plank')],
};
const LEGS_GYM: ReadyWorkoutSeed = {
  id: 'api_legs_gym',
  name: { en: 'Gym leg day', he: 'יום רגליים בחדר כושר' },
  description: { en: 'A fixture leg workout that needs a gym.', he: 'אימון רגליים לדוגמה שדורש חדר כושר.' },
  focus: 'legs',
  mode: 'weights',
  level: 'intermediate',
  places: ['gym'],
  items: [
    reps('barbell_back_squat', 4, [6, 10], 120, { en: 'Brace the core', he: 'לשמור על בטן מכווצת' }),
    reps('leg_press', 3, [8, 12], 90),
    reps('dumbbell_romanian_deadlift', 3, [8, 12], 90),
    reps('lying_leg_curl', 3, [10, 12], 60),
    reps('standing_calf_raise', 3, [12, 15], 45),
    hold('plank', 40, 3, 45),
  ],
};
const DB_HOME: ReadyWorkoutSeed = {
  id: 'api_db_home',
  name: { en: 'Dumbbell home legs', he: 'רגליים בבית עם משקולות' },
  description: { en: 'A fixture leg workout with one pair of dumbbells.', he: 'אימון רגליים לדוגמה עם זוג משקולות.' },
  focus: 'legs',
  mode: 'weights',
  level: 'intermediate',
  places: ['home', 'outdoor', 'gym'],
  items: [
    reps('goblet_squat', 3, [8, 12], 90, { en: 'Chest up', he: 'חזה פתוח' }),
    reps('dumbbell_romanian_deadlift', 3, [8, 12], 90),
    reps('dumbbell_reverse_lunge', 3, [8, 12], 75),
    reps('glute_bridge', 3, [10, 15], 45),
    reps('standing_calf_raise', 2, [12, 15], 45),
  ],
};
const PULL_BAR: ReadyWorkoutSeed = {
  id: 'api_pull_bar',
  name: { en: 'Pull-up bar back', he: 'גב עם מתח' },
  description: { en: 'A fixture back workout that needs a pull-up bar.', he: 'אימון גב לדוגמה שדורש מתח.' },
  focus: 'back',
  mode: 'bodyweight',
  level: 'intermediate',
  places: ['outdoor', 'home', 'gym'],
  items: [reps('pull_up', 3, [4, 8], 90), reps('negative_pull_up', 3, [3, 5], 90), reps('chin_up', 3, [3, 6], 90), reps('hanging_knee_raise', 3, [6, 10], 60)],
};
const ADVANCED: ReadyWorkoutSeed = {
  id: 'api_advanced_bodyweight',
  name: { en: 'Advanced bodyweight mix', he: 'שילוב מתקדם במשקל גוף' },
  description: { en: 'A fixture full-body workout with advanced and jumping moves.', he: 'אימון גוף מלא לדוגמה עם תרגילים מתקדמים וקפיצות.' },
  focus: 'full_body',
  mode: 'bodyweight',
  level: 'advanced',
  places: ['home', 'outdoor', 'gym'],
  items: [
    reps('archer_push_up', 3, [4, 6], 90),
    reps('jump_squat', 3, [8, 10], 60),
    reps('burpee', 3, [6, 8], 60),
    reps('push_up', 3, [8, 10], 60),
    reps('glute_bridge', 3, [10, 15], 45),
    hold('plank', 40, 3, 45),
  ],
};
/** Four jumping exercises: nobody over 65 or with a knee complaint can do enough of it, so it is hidden for them. */
const JUMPY: ReadyWorkoutSeed = {
  id: 'api_jumpy_cardio',
  name: { en: 'Jumping cardio', he: 'קרדיו קפיצות' },
  description: { en: 'A fixture cardio workout made of jumping moves.', he: 'אימון קרדיו לדוגמה שמורכב מתרגילי קפיצה.' },
  focus: 'cardio',
  mode: 'bodyweight',
  level: 'intermediate',
  places: ['home', 'outdoor', 'gym'],
  items: [reps('jump_squat', 3, [8, 10]), reps('burpee', 3, [6, 8]), hold('jumping_jack', 40), hold('high_knees', 30), hold('brisk_walk_jog', 60), hold('plank')],
};
const WORKOUTS: ReadyWorkoutSeed[] = [PUSH, LEGS_GYM, DB_HOME, PULL_BAR, ADVANCED, JUMPY];

const block = (sport: SportBlockSeed['sport'], variant: SportBlockSeed['variant'], items: ReadyItemSeed[]): SportBlockSeed => ({
  id: `${sport}_${variant}`,
  sport,
  variant,
  name: { en: `${sport} ${variant}`, he: `ספורט ${variant}` },
  description: { en: `A fixture ${variant} finisher.`, he: 'סיום לדוגמה של עשר דקות.' },
  items,
});
const SOCCER_BODYWEIGHT = block('soccer', 'bodyweight', [
  reps('reverse_lunge', 3, [10, 12], 30),
  reps('jump_squat', 3, [8, 10], 30),
  hold('mountain_climber', 30, 3, 30),
  reps('glute_bridge', 3, [12, 15], 30),
]);
const SOCCER_GEAR = block('soccer', 'gear', [
  reps('dumbbell_reverse_lunge', 3, [8, 10], 30),
  reps('goblet_squat', 3, [10, 12], 30),
  reps('dumbbell_romanian_deadlift', 3, [8, 10], 30),
  reps('glute_bridge', 3, [12, 15], 30),
]);
const SOCCER_GENTLE = block('soccer', 'gentle', [
  reps('box_squat', 3, [10, 12], 30),
  reps('glute_bridge', 3, [12, 15], 30),
  reps('dead_bug', 3, [8, 10], 30),
  reps('bird_dog', 3, [8, 10], 30),
  hold('wall_sit', 30, 2, 30),
]);
/** Swimming has only a jumping block: no one who cannot jump gets a swimming finisher. */
const SWIMMING_BODYWEIGHT = block('swimming', 'bodyweight', [
  reps('jump_squat', 3, [8, 10], 30),
  reps('burpee', 3, [6, 8], 30),
  reps('glute_bridge', 3, [12, 15], 30),
  hold('plank', 30, 3, 30),
]);
const BLOCKS: SportBlockSeed[] = [SOCCER_BODYWEIGHT, SOCCER_GEAR, SOCCER_GENTLE, SWIMMING_BODYWEIGHT];
// No block exists for running at all.

const ids = (list: { id: string }[]) => list.map((x) => x.id);
const exerciseIds = (items: { exerciseId: string }[]) => items.map((x) => x.exerciseId);

// ---------------------------------------------------------------- Setup

let server: TestServer;
let restoreData: () => void;

beforeAll(async () => {
  restoreData = useReadyDataForTests(WORKOUTS, BLOCKS);
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  restoreData();
  await db.close();
});

const adult = (over: Record<string, unknown> = {}, account: Parameters<typeof registerUser>[1] = {}) => onboardedUser(server.baseUrl, over, account);
const senior = () => adult({ age_years: 70 });
const kneeUser = () => adult({ injuries: ['knee'] });

/** A success body, or the error body every failed request has. */
type Reply<T> = T & { error: { code: string; details?: unknown } };

const list = (c: TestClient, query = '') => c.get<Reply<ReadyListResponse>>(`/api/ready-workouts${query}`);
const detail = (c: TestClient, id: string, query = '') => c.get<Reply<ReadyDetailResponse>>(`/api/ready-workouts/${id}${query}`);
const start = (c: TestClient, body: Record<string, unknown>) => c.post<Reply<{ session: WorkoutSessionDTO }>>('/api/sessions', body);

// ---------------------------------------------------------------- Access and validation

describe('ready workouts API: access and validation', () => {
  it('needs a signed-in user for the list, the preview and the start', async () => {
    const anon = new TestClient(server.baseUrl);
    expect((await list(anon)).status).toBe(401);
    expect((await detail(anon, PUSH.id)).status).toBe(401);
    const post = await anon.post('/api/sessions', { readyWorkoutId: PUSH.id }, { csrf: false });
    expect([401, 403]).toContain(post.status);
  });

  it('rejects bad list filters with a 400 validation_error', async () => {
    const c = await adult();
    for (const query of [
      '?focus=neck',
      '?location=moon',
      '?mode=cardio',
      '?level=expert',
      '?equipment=laser',
      '?equipment=dumbbells,laser',
      '?equipment=dumbbells&equipment=bench',
      '?maxMinutes=5',
      '?maxMinutes=181',
      '?maxMinutes=abc',
      '?page=0',
      '?pageSize=0',
      '?pageSize=61',
    ]) {
      const res = await list(c, query);
      expect(res.status, query).toBe(400);
      expect(res.body.error.code, query).toBe('validation_error');
    }
    expect((await list(c, '?focus=legs&mode=weights&level=advanced&maxMinutes=60&page=1&pageSize=60&equipment=')).status).toBe(200);
  });

  it('rejects bad preview input with a 400', async () => {
    const c = await adult();
    for (const [id, query] of [
      [PUSH.id, '?sport=curling'],
      [PUSH.id, '?location=pool'],
      [PUSH.id, '?equipment=laser'],
      ['Not-A-Slug', ''],
      ['has space', ''],
    ] as const) {
      const res = await detail(c, id, query);
      expect(res.status, `${id}${query}`).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
  });

  it('rejects a bad start body with a 400 and starts nothing', async () => {
    const c = await adult();
    for (const body of [
      { readyWorkoutId: PUSH.id, sport: 'curling' },
      { readyWorkoutId: PUSH.id, location: 'pool' },
      { readyWorkoutId: PUSH.id, equipment: ['laser'] },
      { readyWorkoutId: 'Not A Slug' },
    ]) {
      const res = await start(c, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    expect((await c.get('/api/sessions/active')).body.session).toBeNull();
  });

  it('answers 404 ready_workout_not_found for an unknown id, on the preview and on the start', async () => {
    const c = await adult();
    const preview = await detail(c, 'no_such_workout');
    expect(preview.status).toBe(404);
    expect(preview.body.error.code).toBe('ready_workout_not_found');
    const started = await start(c, { readyWorkoutId: 'no_such_workout' });
    expect(started.status).toBe(404);
    expect(started.body.error.code).toBe('ready_workout_not_found');
    expect((await c.get('/api/sessions/active')).body.session).toBeNull();
  });
});

// ---------------------------------------------------------------- List

describe('ready workouts API: list', () => {
  it('lists what fits the place and gear, nearest level first, with one card per workout', async () => {
    const c = await adult();
    const res = await list(c, '?location=gym');
    expect(res.status).toBe(200);
    // intermediate user: own level first (fewest gear, then id), then the neighbouring levels
    expect(ids(res.body.workouts)).toEqual([JUMPY.id, DB_HOME.id, PULL_BAR.id, LEGS_GYM.id, ADVANCED.id, PUSH.id]);
    expect(res.body.total).toBe(6);
    expect(res.body.hiddenForSafety).toBe(0);
    expect(res.body.facets).toEqual({ chest: 1, legs: 2, back: 1, full_body: 1, cardio: 1 });

    const card = res.body.workouts.find((w) => w.id === LEGS_GYM.id)!;
    expect(card).toMatchObject({
      id: LEGS_GYM.id,
      name: LEGS_GYM.name,
      description: LEGS_GYM.description,
      focus: 'legs',
      mode: 'weights',
      level: 'intermediate',
      places: ['gym'],
      exerciseCount: 6,
      totalSets: 19,
      estimatedMinutes: workoutMinutes(LEGS_GYM.items, lookup),
    });
    expect(card.equipment).toEqual(deriveEquipment(LEGS_GYM.items, lookup));
    expect([...card.equipment].sort()).toEqual(['barbell', 'dumbbells', 'leg_curl_machine', 'leg_press_machine', 'squat_rack']);
    expect(card.muscles).toEqual(deriveMuscles(LEGS_GYM.items, lookup));
    expect(card.muscles.length).toBeGreaterThan(0);
    expect(card.muscles.length).toBeLessThanOrEqual(4);
  });

  it('is the same on every call', async () => {
    const c = await adult();
    const a = await list(c, '?location=gym&pageSize=4');
    const b = await list(c, '?location=gym&pageSize=4');
    expect(b.body).toEqual(a.body);
  });

  it('defaults to home with no equipment, and follows the gear that was ticked', async () => {
    const c = await adult();
    expect(ids((await list(c)).body.workouts)).toEqual([JUMPY.id, ADVANCED.id, PUSH.id]);
    expect(ids((await list(c, '?location=home&equipment=')).body.workouts)).toEqual([JUMPY.id, ADVANCED.id, PUSH.id]);
    expect(ids((await list(c, '?location=home&equipment=dumbbells')).body.workouts)).toEqual([JUMPY.id, DB_HOME.id, ADVANCED.id, PUSH.id]);
    expect(ids((await list(c, '?location=home&equipment=pull_up_bar')).body.workouts)).toEqual([JUMPY.id, PULL_BAR.id, ADVANCED.id, PUSH.id]);
    // a duplicated tick changes nothing; gear that nothing needs changes nothing
    expect(ids((await list(c, '?location=home&equipment=dumbbells,dumbbells,kettlebell')).body.workouts)).toEqual([JUMPY.id, DB_HOME.id, ADVANCED.id, PUSH.id]);
    // the gym workout never shows up at home, whatever is ticked
    expect(ids((await list(c, '?location=home&equipment=barbell,squat_rack,leg_press_machine,leg_curl_machine,dumbbells')).body.workouts)).not.toContain(LEGS_GYM.id);
  });

  it('uses the pull-up bar and dip bars of the park unless the person says they have none', async () => {
    const c = await adult();
    expect(ids((await list(c, '?location=outdoor')).body.workouts)).toEqual([JUMPY.id, PULL_BAR.id, ADVANCED.id, PUSH.id]);
    expect(ids((await list(c, '?location=outdoor&equipment=')).body.workouts)).toEqual([JUMPY.id, ADVANCED.id, PUSH.id]);
    expect(ids((await list(c, '?location=outdoor&equipment=dumbbells')).body.workouts)).toEqual([JUMPY.id, DB_HOME.id, ADVANCED.id, PUSH.id]);
  });

  it('assumes the whole gym at the gym, whatever was ticked', async () => {
    const c = await adult();
    const all = ids((await list(c, '?location=gym')).body.workouts);
    expect(ids((await list(c, '?location=gym&equipment=')).body.workouts)).toEqual(all);
    expect(ids((await list(c, '?location=gym&equipment=kettlebell')).body.workouts)).toEqual(all);
  });

  it('filters by mode, focus and level, and keeps the focus counts of the other filters', async () => {
    const c = await adult();
    const weights = await list(c, '?location=gym&mode=weights');
    expect(ids(weights.body.workouts)).toEqual([DB_HOME.id, LEGS_GYM.id]);
    expect(weights.body.facets).toEqual({ legs: 2 });
    const bodyweight = await list(c, '?location=gym&mode=bodyweight');
    expect(ids(bodyweight.body.workouts)).toEqual([JUMPY.id, PULL_BAR.id, ADVANCED.id, PUSH.id]);

    // the focus chips count under every other filter but the focus itself
    const legs = await list(c, '?location=gym&focus=legs');
    expect(ids(legs.body.workouts)).toEqual([DB_HOME.id, LEGS_GYM.id]);
    expect(legs.body.total).toBe(2);
    expect(legs.body.facets).toEqual({ chest: 1, legs: 2, back: 1, full_body: 1, cardio: 1 });
    const legsWeights = await list(c, '?location=gym&focus=chest&mode=weights');
    expect(legsWeights.body.workouts).toEqual([]);
    expect(legsWeights.body.total).toBe(0);
    expect(legsWeights.body.facets).toEqual({ legs: 2 });

    expect(ids((await list(c, '?location=gym&level=advanced')).body.workouts)).toEqual([ADVANCED.id]);
    expect(ids((await list(c, '?location=gym&level=beginner')).body.workouts)).toEqual([PUSH.id]);
    expect(ids((await list(c, '?location=gym&focus=legs&mode=weights&level=intermediate')).body.workouts)).toEqual([DB_HOME.id, LEGS_GYM.id]);
    expect((await list(c, '?location=gym&focus=biceps')).body).toEqual({ workouts: [], total: 0, facets: { chest: 1, legs: 2, back: 1, full_body: 1, cardio: 1 }, hiddenForSafety: 0 });
  });

  it('limits the length inclusively', async () => {
    const c = await adult();
    const minutes = workoutMinutes(DB_HOME.items, lookup);
    expect(minutes).toBeGreaterThan(10);
    const at = await list(c, `?location=gym&maxMinutes=${minutes}`);
    expect(ids(at.body.workouts)).toContain(DB_HOME.id);
    const below = await list(c, `?location=gym&maxMinutes=${minutes - 1}`);
    expect(ids(below.body.workouts)).not.toContain(DB_HOME.id);
    expect(below.body.total).toBe(below.body.workouts.length);
    // the facets follow the length limit too
    expect(below.body.facets.legs ?? 0).toBeLessThan(2);
  });

  it('pages the result and reports the total before paging', async () => {
    const c = await adult();
    const all = ids((await list(c, '?location=gym')).body.workouts);
    const pages = await Promise.all([1, 2, 3, 4].map((p) => list(c, `?location=gym&pageSize=2&page=${p}`)));
    expect(pages.map((p) => p.body.workouts.length)).toEqual([2, 2, 2, 0]);
    expect(pages.map((p) => p.body.total)).toEqual([6, 6, 6, 6]);
    expect(pages.flatMap((p) => ids(p.body.workouts))).toEqual(all);
    for (const p of pages) expect(p.body.facets).toEqual({ chest: 1, legs: 2, back: 1, full_body: 1, cardio: 1 });
    const uneven = await Promise.all([1, 2].map((p) => list(c, `?location=gym&pageSize=4&page=${p}`)));
    expect(uneven.map((p) => p.body.workouts.length)).toEqual([4, 2]);
    // the default page size shows everything here
    expect((await list(c, '?location=gym')).body.workouts).toHaveLength(6);
  });

  it('orders by the experience on record: the own level first, then the closest', async () => {
    const beginner = await adult({ experience_level: 'beginner' });
    expect(ids((await list(beginner, '?location=gym')).body.workouts)).toEqual([PUSH.id, JUMPY.id, DB_HOME.id, PULL_BAR.id, LEGS_GYM.id, ADVANCED.id]);
    const advanced = await adult({ experience_level: 'advanced' });
    expect(ids((await list(advanced, '?location=gym')).body.workouts)).toEqual([ADVANCED.id, JUMPY.id, DB_HOME.id, PULL_BAR.id, LEGS_GYM.id, PUSH.id]);
  });

  it('works for a user with no profile yet (an adult with no limits, no level order)', async () => {
    const fresh = await registerUser(server.baseUrl);
    const res = await list(fresh, '?location=gym');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(6);
    expect(res.body.hiddenForSafety).toBe(0);
    // no experience: fewest gear first, then id
    expect(ids(res.body.workouts)).toEqual([ADVANCED.id, JUMPY.id, PUSH.id, DB_HOME.id, PULL_BAR.id, LEGS_GYM.id]);
  });
});

describe('ready workouts API: list for a person who needs a safer workout', () => {
  it('leaves out and counts the workouts a person over 65 cannot do safely', async () => {
    const c = await senior();
    const res = await list(c, '?location=gym');
    expect(ids(res.body.workouts)).not.toContain(JUMPY.id);
    expect(ids(res.body.workouts)).toContain(ADVANCED.id);
    expect(res.body.total).toBe(5);
    expect(res.body.hiddenForSafety).toBe(1);
    expect(res.body.facets.cardio).toBeUndefined();
    // the hidden ones are counted under the focus filter too
    expect((await list(c, '?location=gym&focus=cardio')).body).toMatchObject({ workouts: [], total: 0, hiddenForSafety: 1 });
    expect((await list(c, '?location=gym&focus=legs')).body.hiddenForSafety).toBe(0);
  });

  it('leaves out and counts the workouts a knee complaint rules out', async () => {
    const c = await kneeUser();
    const res = await list(c, '?location=gym');
    // jumping cardio loses all four jumps; the push workout loses its only knee-friendly progression and drops below four
    expect(ids(res.body.workouts)).not.toContain(JUMPY.id);
    expect(ids(res.body.workouts)).not.toContain(PUSH.id);
    expect(ids(res.body.workouts)).toEqual(expect.arrayContaining([LEGS_GYM.id, DB_HOME.id, PULL_BAR.id, ADVANCED.id]));
    expect(res.body.hiddenForSafety).toBe(2);
    expect(res.body.total + res.body.hiddenForSafety).toBe(6);
    // none of the listed workouts is shown with an exercise that is bad for the knee
    for (const w of res.body.workouts) {
      const d = await detail(c, w.id, '?location=gym');
      for (const it of d.body.workout.items) expect(lookup.get(it.exercise.id)!.contraindications, `${w.id}: ${it.exercise.id}`).not.toContain('knee');
    }
  });

  it('shows the length and gear of the workout as it will be done, and applies the length limit to that', async () => {
    const adultUser = await adult();
    const old = await senior();
    const designed = workoutMinutes(PUSH.items, lookup);
    const forAdult = (await list(adultUser, '?location=gym')).body.workouts.find((w) => w.id === PUSH.id)!;
    const forSenior = (await list(old, '?location=gym')).body.workouts.find((w) => w.id === PUSH.id)!;
    expect(forAdult.estimatedMinutes).toBe(designed);
    // 30 s more rest after every set
    expect(forSenior.estimatedMinutes).toBeGreaterThan(designed);
    const limit = (u: TestClient) => list(u, `?location=gym&maxMinutes=${designed}&focus=chest`);
    expect(ids((await limit(adultUser)).body.workouts)).toEqual([PUSH.id]);
    expect(ids((await limit(old)).body.workouts)).toEqual([]);
    // a limit it fits again
    expect(ids((await list(old, `?location=gym&maxMinutes=${forSenior.estimatedMinutes}&focus=chest`)).body.workouts)).toEqual([PUSH.id]);
  });

  it('does not let a person be hidden by something they did not report: anyone else still sees everything', async () => {
    const c = await adult({ injuries: ['neck'] });
    const res = await list(c, '?location=gym');
    expect(res.body.total).toBe(6);
    expect(res.body.hiddenForSafety).toBe(0);
  });

  it('counts a hidden workout only when it would have fitted the length limit', async () => {
    const c = await senior();
    const designed = workoutMinutes(JUMPY.items, lookup);
    expect(designed).toBeGreaterThan(10);
    expect((await list(c, `?location=gym&maxMinutes=${designed}`)).body.hiddenForSafety).toBe(1);
    expect((await list(c, `?location=gym&maxMinutes=${designed - 1}`)).body.hiddenForSafety).toBe(0);
  });
});

// ---------------------------------------------------------------- The avoid list of the profile

describe('ready workouts API: exercises the person asked never to get', () => {
  it('swaps an avoided exercise in the preview and in the started session, with a note', async () => {
    const c = await adult({ avoid_exercise_ids: ['barbell_back_squat'] });
    const w = (await detail(c, LEGS_GYM.id, '?location=gym')).body.workout;
    expect(w.items[0]).toMatchObject({ exercise: { id: 'goblet_squat' }, substitutedFrom: 'barbell_back_squat', sets: 4, repMin: 6, repMax: 10, restSeconds: 120, cue: null });
    expect(w.notes).toEqual([{ code: 'substituted', params: { from: nameOf('barbell_back_squat'), to: nameOf('goblet_squat') } }]);
    expect(w.items.map((i) => i.exercise.id)).not.toContain('barbell_back_squat');
    const s = (await start(c, { readyWorkoutId: LEGS_GYM.id, location: 'gym' })).body.session;
    expect(s.exercises.map((e) => e.exerciseId)).toEqual(['goblet_squat', 'leg_press', 'dumbbell_romanian_deadlift', 'lying_leg_curl', 'standing_calf_raise', 'plank']);
    // somebody who did not ask for that gets the barbell squat
    expect((await detail(await adult(), LEGS_GYM.id, '?location=gym')).body.workout.items[0]!.exercise.id).toBe('barbell_back_squat');
  });

  it('hides, counts and refuses a workout in which more than three exercises are on the list', async () => {
    const c = await adult({ avoid_exercise_ids: ['barbell_back_squat', 'leg_press', 'dumbbell_romanian_deadlift', 'lying_leg_curl'] });
    const res = await list(c, '?location=gym');
    expect(ids(res.body.workouts)).not.toContain(LEGS_GYM.id);
    expect(res.body.hiddenForSafety).toBe(1);
    const preview = await detail(c, LEGS_GYM.id, '?location=gym');
    expect(preview.status).toBe(409);
    expect(preview.body.error.details).toEqual({ reason: 'safety' });
    expect((await start(c, { readyWorkoutId: LEGS_GYM.id, location: 'gym' })).status).toBe(409);
  });

  it('keeps an avoided exercise out of the sport finisher', async () => {
    // the bodyweight soccer block has reverse lunges; the gentle block is the next choice, and the note says so
    const c = await adult({ avoid_exercise_ids: ['reverse_lunge'] });
    const w = (await detail(c, PUSH.id, '?location=home&sport=soccer')).body.workout;
    expect(w.sport).toMatchObject({ id: 'soccer_gentle' });
    expect(w.notes).toEqual([{ code: 'sport_gentle' }]);
    const s = (await start(c, { readyWorkoutId: PUSH.id, location: 'home', sport: 'soccer' })).body.session;
    expect(s.exercises.filter((e) => e.sport === 'soccer').map((e) => e.exerciseId)).toEqual(exerciseIds(SOCCER_GENTLE.items));
  });
});

// ---------------------------------------------------------------- Preview

describe('ready workouts API: preview', () => {
  it('shows the workout as designed for an adult, without a sport', async () => {
    const c = await adult();
    const res = await detail(c, DB_HOME.id, '?location=home&equipment=dumbbells');
    expect(res.status).toBe(200);
    const w = res.body.workout;
    expect(w).toMatchObject({
      id: DB_HOME.id,
      name: DB_HOME.name,
      description: DB_HOME.description,
      focus: 'legs',
      mode: 'weights',
      level: 'intermediate',
      places: ['home', 'outdoor', 'gym'],
      equipment: ['dumbbells'],
      exerciseCount: 5,
      totalSets: 14,
      warmupMinutes: READY_WARMUP_MINUTES,
      estimatedMinutes: workoutMinutes(DB_HOME.items, lookup),
      sport: null,
      notes: [],
    });
    expect(w.totalMinutes).toBe(w.estimatedMinutes);
    expect(w.items.map((i) => i.exercise.id)).toEqual(exerciseIds(DB_HOME.items));
    const first = w.items[0]!;
    expect(first).toMatchObject({
      sets: 3,
      repMin: 8,
      repMax: 12,
      targetSeconds: null,
      restSeconds: 90,
      targetRpe: 7,
      cue: { en: 'Chest up', he: 'חזה פתוח' },
      substitutedFrom: null,
    });
    expect(first.exercise).toMatchObject({ id: 'goblet_squat', name: lookup.get('goblet_squat')!.name, equipment: ['dumbbells'], trackingType: 'weight_reps' });
    expect(typeof first.exercise.hasMedia).toBe('boolean');
    expect(w.items[3]!.cue).toBeNull();
    expect(w.items.every((i) => i.substitutedFrom === null)).toBe(true);
  });

  it('prescribes a timed item by seconds and no effort target', async () => {
    const c = await adult();
    const w = (await detail(c, LEGS_GYM.id, '?location=gym')).body.workout;
    const plank = w.items.at(-1)!;
    expect(plank).toMatchObject({ repMin: null, repMax: null, targetSeconds: 40, targetRpe: null, sets: 3, restSeconds: 45 });
    expect(w.items[0]).toMatchObject({ sets: 4, repMin: 6, repMax: 10, restSeconds: 120, targetRpe: 7 });
  });

  it('answers 409 ready_workout_unavailable when the workout does not fit the place or the gear', async () => {
    const c = await adult();
    for (const [id, query] of [
      [LEGS_GYM.id, '?location=home'],
      [LEGS_GYM.id, '?location=outdoor&equipment=dumbbells'],
      [DB_HOME.id, '?location=home'],
      [DB_HOME.id, '?location=home&equipment=kettlebell'],
      [PULL_BAR.id, '?location=home&equipment='],
    ] as const) {
      const res = await detail(c, id, query);
      expect(res.status, `${id}${query}`).toBe(409);
      expect(res.body.error.code).toBe('ready_workout_unavailable');
      expect(res.body.error.details).toEqual({ reason: 'place_or_equipment' });
    }
    expect((await detail(c, LEGS_GYM.id, '?location=gym')).status).toBe(200);
    expect((await detail(c, PULL_BAR.id, '?location=outdoor')).status).toBe(200);
  });

  it('answers 409 with the reason "safety" when the workout cannot be made safe for the person', async () => {
    const old = await senior();
    const res = await detail(old, JUMPY.id, '?location=gym');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ready_workout_unavailable');
    expect(res.body.error.details).toEqual({ reason: 'safety' });
    // the same workout is fine for an adult
    expect((await detail(await adult(), JUMPY.id, '?location=gym')).status).toBe(200);
  });

  describe('with a sport', () => {
    it('adds the gear block to a weights workout when the gear is there', async () => {
      const c = await adult();
      const w = (await detail(c, DB_HOME.id, '?location=home&equipment=dumbbells&sport=soccer')).body.workout;
      const sport = w.sport!;
      expect(sport).toMatchObject({ id: 'soccer_gear', sport: 'soccer', variant: 'gear', name: SOCCER_GEAR.name, description: SOCCER_GEAR.description });
      expect(sport.items.map((i) => i.exercise.id)).toEqual(exerciseIds(SOCCER_GEAR.items));
      expect(sport.estimatedMinutes).toBe(Math.round(blockSeconds(SOCCER_GEAR.items, lookup) / 60));
      expect(sport.items[0]).toMatchObject({ sets: 3, repMin: 8, repMax: 10, restSeconds: 30, targetRpe: 7, substitutedFrom: null });
      expect(w.totalMinutes).toBe(w.estimatedMinutes + sport.estimatedMinutes);
      expect(w.notes).toEqual([]);
      // the main workout is untouched by the sport
      expect(w.items.map((i) => i.exercise.id)).toEqual(exerciseIds(DB_HOME.items));
    });

    it('never uses a gear block in a bodyweight workout, even when the person has gear', async () => {
      const c = await adult();
      const w = (await detail(c, PUSH.id, '?location=home&equipment=dumbbells,kettlebell&sport=soccer')).body.workout;
      expect(w.sport).toMatchObject({ id: 'soccer_bodyweight', variant: 'bodyweight' });
      expect(w.notes).toEqual([]);
    });

    it('falls back to the bodyweight block when a weights workout has no gear block that fits', async () => {
      const c = await adult();
      // the gym workout is weights mode, but the swimming finisher only exists as a bodyweight block
      const w = (await detail(c, LEGS_GYM.id, '?location=gym&sport=swimming')).body.workout;
      expect(w.sport).toMatchObject({ id: 'swimming_bodyweight', variant: 'bodyweight' });
      expect(w.notes).toEqual([]);
    });

    it('takes the gentle block first for a person over 65, with no note about it', async () => {
      const c = await senior();
      const w = (await detail(c, PUSH.id, '?location=home&sport=soccer')).body.workout;
      expect(w.sport).toMatchObject({ id: 'soccer_gentle', variant: 'gentle' });
      expect(w.notes.map((n) => n.code)).toEqual(['age_senior']);
    });

    it('takes the gentle block first for a joint complaint (knee), also in weights mode', async () => {
      const c = await kneeUser();
      const w = (await detail(c, PULL_BAR.id, '?location=outdoor&sport=soccer')).body.workout;
      expect(w.sport).toMatchObject({ id: 'soccer_gentle' });
      expect(w.notes.map((n) => n.code)).toEqual([]);
      const weights = (await detail(c, LEGS_GYM.id, '?location=gym&sport=soccer')).body.workout;
      expect(weights.sport).toMatchObject({ id: 'soccer_gentle' });
    });

    it('says so when the gentle block was used only because nothing else suited the person', async () => {
      // a wrist complaint rules out the mountain climbers of the bodyweight block; the pull-up workout is fine for the wrist
      const c = await adult({ injuries: ['wrist'] });
      const w = (await detail(c, PULL_BAR.id, '?location=outdoor&sport=soccer')).body.workout;
      expect(w.sport).toMatchObject({ id: 'soccer_gentle' });
      expect(w.notes).toEqual([{ code: 'sport_gentle' }]);
    });

    it('gives no block and says so when none is safe or none exists', async () => {
      const old = await senior();
      const none = (await detail(old, PUSH.id, '?location=home&sport=swimming')).body.workout;
      expect(none.sport).toBeNull();
      expect(none.notes).toEqual([{ code: 'age_senior' }, { code: 'sport_none_fit', params: { sport: 'swimming' } }]);
      expect(none.totalMinutes).toBe(none.estimatedMinutes);
      const missing = (await detail(await adult(), PUSH.id, '?location=home&sport=running')).body.workout;
      expect(missing.sport).toBeNull();
      expect(missing.notes).toEqual([{ code: 'sport_none_fit', params: { sport: 'running' } }]);
    });
  });

  describe('adapted to the person', () => {
    it('replaces what a knee complaint rules out with easier work for the same muscles, and says so', async () => {
      const c = await kneeUser();
      const w = (await detail(c, LEGS_GYM.id, '?location=gym')).body.workout;
      expect(w.items.map((i) => i.exercise.id)).toEqual(['bodyweight_squat', 'box_squat', 'dumbbell_romanian_deadlift', 'lying_leg_curl', 'standing_calf_raise', 'plank']);
      expect(w.items.map((i) => i.substitutedFrom)).toEqual(['barbell_back_squat', 'leg_press', null, null, null, null]);
      // sets and rest stay as designed, the cue of the replaced exercise goes, the reps are the default for a changed tracking type
      expect(w.items[0]).toMatchObject({ sets: 4, repMin: 8, repMax: 12, restSeconds: 120, cue: null });
      expect(w.notes).toEqual([
        { code: 'substituted', params: { from: nameOf('barbell_back_squat'), to: nameOf('bodyweight_squat') } },
        { code: 'substituted', params: { from: nameOf('leg_press'), to: nameOf('box_squat') } },
      ]);
      // the card shows what is really needed now: no barbell, no rack, no leg press
      expect(w.equipment).toEqual(['dumbbells', 'leg_curl_machine']);
    });

    it('writes the names in the notes in the language of the user', async () => {
      const c = await adult({ injuries: ['knee'] }, { locale: 'he' });
      const w = (await detail(c, LEGS_GYM.id, '?location=gym')).body.workout;
      expect(w.notes[0]).toEqual({ code: 'substituted', params: { from: nameOf('barbell_back_squat', 'he'), to: nameOf('bodyweight_squat', 'he') } });
      // both languages stay on the cards, the client picks
      expect(w.name).toEqual(LEGS_GYM.name);
    });

    it('applies the age rules to a person over 65: effort cap, more rest, fewer sets, no advanced and no jumping', async () => {
      const c = await senior();
      const w = (await detail(c, ADVANCED.id, '?location=home')).body.workout;
      expect(w.notes.map((n) => n.code)).toEqual(['age_senior', 'substituted', 'substituted', 'substituted']);
      const ex = w.items.map((i) => lookup.get(i.exercise.id)!);
      for (const e of ex) {
        expect(e.difficulty, e.id).not.toBe('advanced');
        expect(['archer_push_up', 'jump_squat', 'burpee'], e.id).not.toContain(e.id);
      }
      expect(w.items[0]).toMatchObject({ exercise: { id: 'decline_push_up' }, substitutedFrom: 'archer_push_up' });
      expect(w.items[1]).toMatchObject({ exercise: { id: 'bodyweight_squat' }, substitutedFrom: 'jump_squat' });
      // 7.5 is the cap for 65+, the plank is timed and has no target effort; 30 s more rest on every exercise
      for (const it of w.items) {
        if (it.targetSeconds == null) expect(it.targetRpe).toBe(7.5);
        else expect(it.targetRpe).toBeNull();
      }
      expect(w.items.map((i) => i.restSeconds)).toEqual(
        w.items.map((i) => {
          const designed = ADVANCED.items.find((d) => d.exerciseId === i.exercise.id || d.exerciseId === i.substitutedFrom)!;
          return designed.restSeconds + 30;
        }),
      );
      expect(Math.max(...w.items.map((i) => i.sets))).toBeLessThanOrEqual(4);
    });

    it('caps a minor at effort 7, removes advanced exercises and says so', async () => {
      const c = await adult({ age_years: 15 });
      const w = (await detail(c, ADVANCED.id, '?location=home')).body.workout;
      expect(w.notes[0]).toEqual({ code: 'minor' });
      expect(w.notes.map((n) => n.code)).not.toContain('age_senior');
      expect(w.items[0]).toMatchObject({ exercise: { id: 'decline_push_up' }, substitutedFrom: 'archer_push_up' });
      for (const it of w.items) {
        if (it.targetSeconds == null) expect(it.targetRpe).toBe(7);
        expect(lookup.get(it.exercise.id)!.difficulty).not.toBe('advanced');
      }
      // a beginner workout is not made harder by the cap
      const easy = (await detail(c, PUSH.id, '?location=home')).body.workout;
      expect(easy.items.filter((i) => i.targetSeconds == null).every((i) => i.targetRpe === 6)).toBe(true);
    });

    it('raises the rep minimum of loaded sets for a minor but not the reps of bodyweight sets', async () => {
      const c = await adult({ age_years: 16 });
      const w = (await detail(c, DB_HOME.id, '?location=gym')).body.workout;
      // dumbbell work already starts at 8 reps: nothing to raise; the effort is capped
      expect(w.items[0]).toMatchObject({ repMin: 8, repMax: 12, targetRpe: 7 });
      expect(w.items[3]).toMatchObject({ exercise: { id: 'glute_bridge' }, repMin: 10, repMax: 15 });
    });

    it('is the same workout for the preview and the list card', async () => {
      const c = await senior();
      const card = (await list(c, '?location=home')).body.workouts.find((x: ReadyWorkoutSummaryDTO) => x.id === ADVANCED.id)!;
      const { items, sport, totalMinutes, warmupMinutes, notes, ...summary } = (await detail(c, ADVANCED.id, '?location=home')).body.workout;
      expect(summary).toEqual(card);
      expect(sport).toBeNull();
      expect(totalMinutes).toBe(card.estimatedMinutes);
      expect(warmupMinutes).toBe(READY_WARMUP_MINUTES);
      expect(items.length).toBe(card.exerciseCount);
      expect(notes.length).toBeGreaterThan(0);
    });
  });

  it('is private to the account that asks: another person gets their own adaptation', async () => {
    const [a, b] = [await kneeUser(), await adult()];
    const forA = (await detail(a, LEGS_GYM.id, '?location=gym')).body.workout;
    const forB = (await detail(b, LEGS_GYM.id, '?location=gym')).body.workout;
    expect(forA.items[0]!.exercise.id).toBe('bodyweight_squat');
    expect(forB.items[0]!.exercise.id).toBe('barbell_back_squat');
    expect(forB.notes).toEqual([]);
  });
});

// ---------------------------------------------------------------- Starting a session

describe('ready workouts API: starting a session', () => {
  it('creates a session with the main exercises first and the sport block after them, tagged with the sport', async () => {
    const c = await adult();
    const res = await start(c, { readyWorkoutId: DB_HOME.id, location: 'home', equipment: ['dumbbells'], sport: 'soccer' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const s = res.body.session;
    expect(s).toMatchObject({ name: 'Dumbbell home legs', status: 'in_progress', planId: null, planWorkoutId: null, readiness: null });
    expect(s.exercises.map((e) => e.exerciseId)).toEqual([...exerciseIds(DB_HOME.items), ...exerciseIds(SOCCER_GEAR.items)]);
    expect(s.exercises.map((e) => e.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(s.exercises.map((e) => e.sport)).toEqual([null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer']);

    // the same rows in the database, in the same order, with the sport column set only on the block
    const rows = await db.many<{ position: number; exercise_id: string; sport: string | null }>(
      'SELECT position, exercise_id, sport FROM session_exercises WHERE session_id = $1 AND user_id = $2 ORDER BY position',
      [s.id, c.userId],
    );
    expect(rows.map((r) => r.sport)).toEqual([null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer']);
    expect(rows.map((r) => r.exercise_id)).toEqual(s.exercises.map((e) => e.exerciseId));

    // prescription, notes and pre-created sets
    const goblet = s.exercises[0]!;
    expect(goblet).toMatchObject({ repMin: 8, repMax: 12, targetSeconds: null, restSeconds: 90, targetRpe: 7, notes: 'Chest up', targetWeightKg: null });
    expect(goblet.sets).toHaveLength(3);
    expect(goblet.sets.every((x) => x.targetReps === 12 && !x.completed)).toBe(true);
    expect(goblet.suggestion).toMatchObject({ action: 'first_time', reasonCode: 'no_history' });
    expect(s.exercises[2]!.notes).toBe('');
    expect(s.exercises[4]!.sets).toHaveLength(2);
    const lunge = s.exercises[5]!;
    expect(lunge).toMatchObject({ sport: 'soccer', repMin: 8, repMax: 10, restSeconds: 30, targetRpe: 7 });
    expect(lunge.sets).toHaveLength(3);

    // it is the user's active session and nothing about it needs a readiness answer
    const active = await c.get('/api/sessions/active');
    expect(active.body.session.id).toBe(s.id);
  });

  it('starts a timed exercise with seconds as its target', async () => {
    const c = await adult();
    const s = (await start(c, { readyWorkoutId: LEGS_GYM.id, location: 'gym' })).body.session;
    const plank = s.exercises.at(-1)!;
    expect(plank).toMatchObject({ exerciseId: 'plank', repMin: null, repMax: null, targetSeconds: 40, restSeconds: 45, targetRpe: null });
    expect(plank.sets).toHaveLength(3);
    expect(plank.sets.every((x) => x.targetSeconds === 40 && x.targetReps === null)).toBe(true);
    expect(s.exercises[0]).toMatchObject({ exerciseId: 'barbell_back_squat', sets: expect.anything() });
  });

  it('starts only the main workout without a sport, and tags nothing', async () => {
    const c = await adult();
    const s = (await start(c, { readyWorkoutId: PULL_BAR.id, location: 'outdoor' })).body.session;
    expect(s.exercises.map((e) => e.exerciseId)).toEqual(exerciseIds(PULL_BAR.items));
    expect(s.exercises.every((e) => e.sport === null)).toBe(true);
  });

  it('names the session in the language of the user and writes the cues in it', async () => {
    const c = await adult({}, { locale: 'he' });
    const s = (await start(c, { readyWorkoutId: DB_HOME.id, location: 'home', equipment: ['dumbbells'] })).body.session;
    expect(s.name).toBe(DB_HOME.name.he);
    expect(s.exercises[0]!.notes).toBe('חזה פתוח');
  });

  it('uses the same defaults as the preview: home with no equipment', async () => {
    const c = await adult();
    const ok = await start(c, { readyWorkoutId: PUSH.id });
    expect(ok.status).toBe(201);
    const c2 = await adult();
    const res = await start(c2, { readyWorkoutId: DB_HOME.id });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ready_workout_unavailable');
  });

  it('starts the workout without a finisher when no block is safe for the person, as the preview showed', async () => {
    const c = await adult();
    const s = (await start(c, { readyWorkoutId: PUSH.id, location: 'home', sport: 'running' })).body.session;
    expect(s.exercises.map((e) => e.exerciseId)).toEqual(exerciseIds(PUSH.items));
    expect(s.exercises.every((e) => e.sport === null)).toBe(true);
  });

  it('answers 409 session_already_active when a workout is already open, and leaves it alone', async () => {
    const c = await adult();
    const first = await start(c, { readyWorkoutId: PUSH.id, location: 'home' });
    expect(first.status).toBe(201);
    const second = await start(c, { readyWorkoutId: PULL_BAR.id, location: 'outdoor' });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('session_already_active');
    expect(second.body.error.details).toEqual({ sessionId: first.body.session.id });
    const count = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM workout_sessions WHERE user_id = $1', [c.userId]);
    expect(count.n).toBe(1);
    // the open session still has exactly the first workout
    const active = (await c.get('/api/sessions/active')).body.session as WorkoutSessionDTO;
    expect(active.exercises.map((e) => e.exerciseId)).toEqual(exerciseIds(PUSH.items));
    // an open session blocks a conflicting start before the workout is even looked at
    expect((await start(c, { readyWorkoutId: 'no_such_workout' })).status).toBe(409);
  });

  it('replays a retry with the same Idempotency-Key instead of starting twice', async () => {
    const c = await adult();
    const key = `ready-${Math.random().toString(36).slice(2, 12)}`;
    const a = await c.post('/api/sessions', { readyWorkoutId: PUSH.id, location: 'home' }, { headers: { 'idempotency-key': key } });
    const b = await c.post('/api/sessions', { readyWorkoutId: PUSH.id, location: 'home' }, { headers: { 'idempotency-key': key } });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(b.headers.get('idempotent-replayed')).toBe('true');
    expect(b.body.session.id).toBe(a.body.session.id);
    const count = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM workout_sessions WHERE user_id = $1', [c.userId]);
    expect(count.n).toBe(1);
  });

  it('answers 409 ready_workout_unavailable and starts nothing when the workout does not fit the place or the gear', async () => {
    const c = await adult();
    for (const body of [
      { readyWorkoutId: LEGS_GYM.id, location: 'home' },
      { readyWorkoutId: LEGS_GYM.id },
      { readyWorkoutId: DB_HOME.id, location: 'home', equipment: [] },
      { readyWorkoutId: PULL_BAR.id, location: 'home', equipment: ['dumbbells'] },
    ]) {
      const res = await start(c, body);
      expect(res.status, JSON.stringify(body)).toBe(409);
      expect(res.body.error.code).toBe('ready_workout_unavailable');
    }
    const count = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM workout_sessions WHERE user_id = $1', [c.userId]);
    expect(count.n).toBe(0);
  });

  it('answers 409 and starts nothing when the workout cannot be made safe for the person', async () => {
    const old = await senior();
    const res = await start(old, { readyWorkoutId: JUMPY.id, location: 'gym' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ready_workout_unavailable');
    expect(res.body.error.details).toEqual({ reason: 'safety' });
    expect((await old.get('/api/sessions/active')).body.session).toBeNull();
  });

  describe('adapted to the person', () => {
    it('starts the knee-friendly exercises and the gentle block for a knee complaint', async () => {
      const c = await kneeUser();
      const s = (await start(c, { readyWorkoutId: LEGS_GYM.id, location: 'gym', sport: 'soccer' })).body.session;
      expect(s.exercises.map((e) => e.exerciseId)).toEqual([
        'bodyweight_squat', 'box_squat', 'dumbbell_romanian_deadlift', 'lying_leg_curl', 'standing_calf_raise', 'plank',
        ...exerciseIds(SOCCER_GENTLE.items),
      ]);
      expect(s.exercises.map((e) => e.sport)).toEqual([null, null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer', 'soccer']);
      // the replaced squat keeps its sets and rest and has no cue of the barbell squat
      expect(s.exercises[0]).toMatchObject({ repMin: 8, repMax: 12, restSeconds: 120, notes: '' });
      expect(s.exercises[0]!.sets).toHaveLength(4);
      for (const e of s.exercises) expect(lookup.get(e.exerciseId)!.contraindications, e.exerciseId).not.toContain('knee');
    });

    it('starts an easier session for a person over 65', async () => {
      const c = await senior();
      const s = (await start(c, { readyWorkoutId: ADVANCED.id, location: 'home', sport: 'soccer' })).body.session;
      const main = s.exercises.filter((e) => e.sport === null);
      const block = s.exercises.filter((e) => e.sport === 'soccer');
      expect(block.map((e) => e.exerciseId)).toEqual(exerciseIds(SOCCER_GENTLE.items));
      expect(main).toHaveLength(6);
      for (const e of main) {
        const facts = lookup.get(e.exerciseId)!;
        expect(['archer_push_up', 'jump_squat', 'burpee']).not.toContain(e.exerciseId);
        expect(facts.difficulty).not.toBe('advanced');
        expect(e.sets.length).toBeLessThanOrEqual(4);
        if (e.targetSeconds == null) expect(e.targetRpe).toBe(7.5);
      }
      expect(main.map((e) => e.exerciseId).slice(0, 2)).toEqual(['decline_push_up', 'bodyweight_squat']);
      // 30 s more rest than designed
      expect(main[0]!.restSeconds).toBe(90 + 30);
      expect(main[1]!.restSeconds).toBe(60 + 30);
    });

    it('starts a minor on effort 7 at most', async () => {
      const c = await adult({ age_years: 14 });
      const s = (await start(c, { readyWorkoutId: ADVANCED.id, location: 'home' })).body.session;
      expect(s.exercises[0]!.exerciseId).toBe('decline_push_up');
      for (const e of s.exercises) if (e.targetSeconds == null) expect(e.targetRpe).toBe(7);
    });

    it('gives the gentle block with the sport_gentle reason for a wrist complaint', async () => {
      const c = await adult({ injuries: ['wrist'] });
      const s = (await start(c, { readyWorkoutId: PULL_BAR.id, location: 'outdoor', sport: 'soccer' })).body.session;
      expect(s.exercises.filter((e) => e.sport === 'soccer').map((e) => e.exerciseId)).toEqual(exerciseIds(SOCCER_GENTLE.items));
    });
  });

  describe('for a returning user', () => {
    it('suggests the next weight and keeps the prescription for exercises without history', async () => {
      const c = await adult();
      const first = (await start(c, { readyWorkoutId: DB_HOME.id, location: 'home', equipment: ['dumbbells'] })).body.session;
      const goblet = first.exercises[0]!;
      for (const set of goblet.sets) {
        const r = await c.patch(`/api/sessions/${first.id}/sets/${set.id}`, { reps: 12, weightKg: 20, completed: true });
        expect(r.status, JSON.stringify(r.body)).toBe(200);
      }
      const done = await c.post(`/api/sessions/${first.id}/finish`, {});
      expect(done.status, JSON.stringify(done.body)).toBe(200);

      const second = (await start(c, { readyWorkoutId: DB_HOME.id, location: 'home', equipment: ['dumbbells'], sport: 'soccer' })).body.session;
      expect(second.id).not.toBe(first.id);
      const g = second.exercises[0]!;
      expect(g.exerciseId).toBe('goblet_squat');
      expect(g.suggestion).toMatchObject({ action: 'increase_weight', reasonCode: 'hit_top_of_range' });
      expect(g.targetWeightKg).toBeGreaterThan(20);
      expect(g.sets.every((x) => x.targetWeightKg === g.targetWeightKg)).toBe(true);
      expect(g.previous?.sets).toHaveLength(3);
      // untouched exercises have no history: the workout's own prescription
      expect(second.exercises[1]!.suggestion).toMatchObject({ action: 'first_time' });
      expect(second.exercises[1]!.targetWeightKg).toBeNull();
      // the sport block is still there, after the main workout; goblet squat is in it too and gets the same suggestion
      expect(second.exercises.map((e) => e.sport)).toEqual([null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer']);
      const blockGoblet = second.exercises[6]!;
      expect(blockGoblet.exerciseId).toBe('goblet_squat');
      expect(blockGoblet.suggestion).toMatchObject({ action: 'increase_weight' });
    });
  });

  describe('while it is running', () => {
    it('keeps an exercise that is swapped inside the sport finisher in the finisher, and one in the main workout out of it', async () => {
      const c = await adult();
      const s = (await start(c, { readyWorkoutId: DB_HOME.id, location: 'home', equipment: ['dumbbells'], sport: 'soccer' })).body.session;
      const finisher = s.exercises[6]!;
      expect(finisher).toMatchObject({ exerciseId: 'goblet_squat', sport: 'soccer' });
      const swapped = await c.post(`/api/sessions/${s.id}/exercises/${finisher.id}/replace`, { exerciseId: 'bird_dog' });
      expect(swapped.status, JSON.stringify(swapped.body)).toBe(200);
      const inFinisher = swapped.body.session.exercises as WorkoutSessionDTO['exercises'];
      expect(inFinisher.map((e) => e.exerciseId)).toEqual([...exerciseIds(DB_HOME.items), 'dumbbell_reverse_lunge', 'bird_dog', 'dumbbell_romanian_deadlift', 'glute_bridge']);
      expect(inFinisher.map((e) => e.sport)).toEqual([null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer']);
      expect(inFinisher.map((e) => e.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      // the same in the database
      const rows = await db.many<{ sport: string | null }>('SELECT sport FROM session_exercises WHERE session_id = $1 AND user_id = $2 ORDER BY position', [s.id, c.userId]);
      expect(rows.map((r) => r.sport)).toEqual([null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer']);

      const inMain = await c.post(`/api/sessions/${s.id}/exercises/${inFinisher[1]!.id}/replace`, { exerciseId: 'plank' });
      expect(inMain.status, JSON.stringify(inMain.body)).toBe(200);
      expect((inMain.body.session.exercises as WorkoutSessionDTO['exercises']).map((e) => e.sport)).toEqual([null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer']);
    });
  });

  describe('between users', () => {
    it('keeps sessions private: another person cannot see, change or finish them, and can start their own', async () => {
      const [a, b] = [await adult(), await adult()];
      const started = (await start(a, { readyWorkoutId: PUSH.id, location: 'home' })).body.session;
      expect((await b.get(`/api/sessions/${started.id}`)).status).toBe(404);
      expect((await b.get('/api/sessions/active')).body.session).toBeNull();
      const set = started.exercises[0]!.sets[0]!;
      expect((await b.patch(`/api/sessions/${started.id}/sets/${set.id}`, { reps: 5, completed: true })).status).toBe(404);
      expect((await b.post(`/api/sessions/${started.id}/finish`, {})).status).toBe(404);
      const own = await start(b, { readyWorkoutId: PUSH.id, location: 'home' });
      expect(own.status).toBe(201);
      expect(own.body.session.id).not.toBe(started.id);
      // each one sees only their own open session
      expect((await a.get('/api/sessions/active')).body.session.id).toBe(started.id);
      expect((await b.get('/api/sessions/active')).body.session.id).toBe(own.body.session.id);
    });

    it('adapts to the person who starts it, not to who started a workout before', async () => {
      const [healthy, hurt] = [await adult(), await kneeUser()];
      const a = (await start(healthy, { readyWorkoutId: LEGS_GYM.id, location: 'gym' })).body.session;
      const b = (await start(hurt, { readyWorkoutId: LEGS_GYM.id, location: 'gym' })).body.session;
      expect(a.exercises[0]!.exerciseId).toBe('barbell_back_squat');
      expect(b.exercises[0]!.exerciseId).toBe('bodyweight_squat');
    });
  });

  it('keeps the workout in the history of a finished ready session without a plan', async () => {
    const c = await adult();
    const s = (await start(c, { readyWorkoutId: PUSH.id, location: 'home' })).body.session;
    const set = s.exercises[0]!.sets[0]!;
    expect((await c.patch(`/api/sessions/${s.id}/sets/${set.id}`, { reps: 10, completed: true })).status).toBe(200);
    const done = await c.post(`/api/sessions/${s.id}/finish`, {});
    expect(done.status).toBe(200);
    expect(done.body.summary.session.name).toBe('Bodyweight push basics');
    expect(done.body.summary.totals.sets).toBe(1);
    expect(done.body.summary.previous).toBeNull();
    const history = await c.get('/api/sessions');
    expect(history.body.sessions.map((x: { id: string }) => x.id)).toContain(s.id);
    // No finisher was chosen: the summary and the history row say so.
    expect(done.body.summary.sport).toBeNull();
    expect(history.body.sessions.find((x: { id: string }) => x.id === s.id).sport).toBeNull();
  });

  it('keeps the sport of the finisher in the summary and the history after the workout is finished and reopened', async () => {
    const c = await adult();
    const s = (await start(c, { readyWorkoutId: DB_HOME.id, location: 'home', equipment: ['dumbbells'], sport: 'soccer' })).body.session;
    const set = s.exercises[0]!.sets[0]!;
    expect((await c.patch(`/api/sessions/${s.id}/sets/${set.id}`, { reps: 10, weightKg: 8, completed: true })).status).toBe(200);
    const done = await c.post(`/api/sessions/${s.id}/finish`, {});
    expect(done.status).toBe(200);
    expect(done.body.summary.sport).toBe('soccer');
    // Reopening the summary later (a fresh request, no client memory) still knows the sport.
    const again = await c.get(`/api/sessions/${s.id}/summary`);
    expect(again.body.summary.sport).toBe('soccer');
    const history = await c.get('/api/sessions');
    expect(history.body.sessions.find((x: { id: string }) => x.id === s.id).sport).toBe('soccer');
  });

  it('exports the sport of the finisher rows with the rest of the account data, and only the account owner\'s', async () => {
    const [owner, other] = [await adult(), await adult()];
    const s = (await start(owner, { readyWorkoutId: DB_HOME.id, location: 'home', equipment: ['dumbbells'], sport: 'soccer' })).body.session;
    await start(other, { readyWorkoutId: PUSH.id, location: 'home' });
    const res = await owner.get('/api/account/export');
    expect(res.status).toBe(200);
    expect(res.body.workoutSessions.map((x: { id: string }) => x.id)).toEqual([s.id]);
    expect(res.body.workoutSessions[0].exercises.map((e: { sport: string | null }) => e.sport)).toEqual([null, null, null, null, null, 'soccer', 'soccer', 'soccer', 'soccer']);
  });
});

// ---------------------------------------------------------------- Fixture sanity

describe('fixtures', () => {
  it('only use exercises the database has, so the tests above do not depend on shipped data', async () => {
    const wanted = new Set([...WORKOUTS, ...BLOCKS].flatMap((w) => w.items.map((i) => i.exerciseId)));
    const have = await db.many<{ id: string }>('SELECT id FROM exercises WHERE id = ANY($1::text[])', [[...wanted]]);
    expect(have.map((r) => r.id).sort()).toEqual([...wanted].sort());
    for (const id of wanted) expect(lookup.has(id), id).toBe(true);
  });
});

// ---------------------------------------------------------------- Rules that hold for any catalog

interface Person {
  name: string;
  profile: Record<string, unknown>;
  injuries: InjuryArea[];
  band: 'minor' | 'adult' | 'mature' | 'senior';
}
const PEOPLE: Person[] = [
  { name: 'adult', profile: {}, injuries: [], band: 'adult' },
  { name: 'senior', profile: { age_years: 70 }, injuries: [], band: 'senior' },
  { name: 'mature', profile: { age_years: 55 }, injuries: [], band: 'mature' },
  { name: 'minor', profile: { age_years: 15 }, injuries: [], band: 'minor' },
  { name: 'knee and ankle', profile: { injuries: ['knee', 'ankle'] }, injuries: ['knee', 'ankle'], band: 'adult' },
  { name: 'shoulder and wrist', profile: { injuries: ['shoulder', 'wrist'] }, injuries: ['shoulder', 'wrist'], band: 'adult' },
  { name: 'lower back and hip, 66', profile: { age_years: 66, injuries: ['lower_back', 'hip'] }, injuries: ['lower_back', 'hip'], band: 'senior' },
];
const PLACES: { location: TrainingLocation; equipment?: Equipment[] }[] = [
  { location: 'gym' },
  { location: 'home', equipment: [] },
  { location: 'home', equipment: ['dumbbells', 'bench', 'pull_up_bar', 'resistance_bands', 'kettlebell'] },
  { location: 'outdoor' },
];
const JOINT_AREAS: InjuryArea[] = ['knee', 'ankle', 'hip', 'lower_back'];

/**
 * Invariants that hold for ANY valid catalog, run over the workouts and sport blocks that are actually shipped (they
 * are being written while this test exists, so it asserts rules, never contents) and over the fixtures above, which
 * always have sport blocks: the list and the preview agree, and no exercise that a person should not do ever reaches
 * them, in the main workout or in the sport block.
 */
describe.each([
  ['the shipped catalog, whatever it contains', READY_WORKOUTS, SPORT_BLOCKS],
  ['the fixture catalog', WORKOUTS, BLOCKS],
] as const)('%s', (_name, workouts, blocks) => {
  let restore: () => void;
  beforeAll(() => {
    restore = useReadyDataForTests(workouts, blocks);
  });
  afterAll(() => restore());

  const sportsWithBlocks = [...new Set(blocks.map((b) => b.sport))];

  async function listAll(user: { id: string; locale: 'en' }, location: TrainingLocation, equipment: Equipment[] | undefined) {
    const out: ReadyWorkoutSummaryDTO[] = [];
    let total = 0;
    let hidden = 0;
    for (let page = 1; page < 50; page++) {
      const res = await listReady(db, user, { location, equipment, page, pageSize: 60 });
      total = res.total;
      hidden = res.hiddenForSafety;
      out.push(...res.workouts);
      if (out.length >= res.total || res.workouts.length === 0) break;
    }
    return { workouts: out, total, hidden };
  }

  it('lists only workouts that can be previewed, and every preview is safe for the person who asked', async () => {
    const exercises = await getExerciseMap();
    let previews = 0;
    let blocksChecked = 0;
    for (const person of PEOPLE) {
      const client = await adult(person.profile);
      const user = { id: client.userId!, locale: 'en' as const };
      const rules = ageRules(person.band);
      const jointFirst = person.band === 'senior' || person.injuries.some((x) => JOINT_AREAS.includes(x));
      for (const place of PLACES) {
        const label = `${person.name} @ ${place.location}${place.equipment ? `[${place.equipment.join(',')}]` : ''}`;
        const have = new Set(effectiveEquipment(place.location, place.equipment));
        const all = await listAll(user, place.location, place.equipment);
        expect(all.workouts.length, label).toBe(all.total);
        expect(new Set(ids(all.workouts)).size, `${label}: no duplicates`).toBe(all.workouts.length);
        if (person.name === 'adult') expect(all.hidden, label).toBe(0);

        /** Fails with a readable message when this exercise is one the person should not do here. */
        const assertSafe = (exerciseId: string, where: string) => {
          const e = exercises.get(exerciseId);
          expect(e, `${label} ${where}: ${exerciseId} exists`).toBeDefined();
          expect(e!.equipment.every((q) => have.has(q)), `${label} ${where}: ${exerciseId} gear`).toBe(true);
          expect(e!.contraindications.filter((c) => person.injuries.includes(c)), `${label} ${where}: ${exerciseId} injury`).toEqual([]);
          if (person.band === 'minor' || rules.excludeAdvanced) expect(e!.difficulty, `${label} ${where}: ${exerciseId} advanced`).not.toBe('advanced');
          if (rules.excludeHighImpact) expect(isHighImpact(e!), `${label} ${where}: ${exerciseId} high impact`).toBe(false);
        };
        const gentleFits = (sport: (typeof SPORTS)[number]) => {
          const gentle = blocks.find((b) => b.sport === sport && b.variant === 'gentle');
          return !!gentle && gentle.items.every((it) => {
            const e = exercises.get(it.exerciseId);
            return !!e && e.equipment.every((q) => have.has(q)) && !e.contraindications.some((c) => person.injuries.includes(c))
              && !(rules.excludeHighImpact && isHighImpact(e)) && !((person.band === 'minor' || rules.excludeAdvanced) && e.difficulty === 'advanced');
          });
        };

        for (const [i, card] of all.workouts.entries()) {
          expect(card.places, `${label} ${card.id}`).toContain(place.location);
          expect(card.equipment.every((q) => have.has(q)), `${label} ${card.id} card gear`).toBe(true);
          // two sports per workout, rotating (any sport, and one that has blocks), so every sport is exercised across the catalog
          const rotating = SPORTS[i % SPORTS.length]!;
          const withBlocks = sportsWithBlocks.length ? sportsWithBlocks[i % sportsWithBlocks.length]! : rotating;
          for (const sport of new Set([rotating, withBlocks])) {
            const { workout } = await getReady(db, user, card.id, { location: place.location, equipment: place.equipment, sport });
            previews++;
            const { items, sport: block, totalMinutes, warmupMinutes, notes, ...summary } = workout;
            expect(summary, `${label} ${card.id}: card and preview agree`).toEqual(card);
            expect(items.length, `${label} ${card.id}`).toBe(card.exerciseCount);
            expect(items.length, `${label} ${card.id}`).toBeGreaterThanOrEqual(4);
            expect(warmupMinutes).toBe(READY_WARMUP_MINUTES);
            for (const it of items) {
              assertSafe(it.exercise.id, card.id);
              if (card.mode === 'bodyweight' && it.substitutedFrom != null) {
                const swapped = exercises.get(it.exercise.id)!;
                expect(isExternallyLoaded(swapped), `${label} ${card.id}: ${swapped.id} is a loaded swap in a bodyweight workout`).toBe(false);
                expect(swapped.equipment.filter((q) => RESISTANCE_GEAR.includes(q)), `${label} ${card.id}: ${swapped.id} needs resistance gear`).toEqual([]);
              }
              if (it.targetRpe != null) expect(it.targetRpe, `${label} ${card.id} effort`).toBeLessThanOrEqual(Math.min(person.band === 'minor' ? 7 : 10, rules.rpeCap ?? 10));
              if (rules.setsCap != null) expect(it.sets, `${label} ${card.id} sets`).toBeLessThanOrEqual(rules.setsCap);
              expect(it.sets).toBeGreaterThanOrEqual(1);
            }
            for (const n of notes) expect(READY_NOTE_CODES as readonly string[], `${label} ${card.id}`).toContain(n.code);

            if (block) {
              blocksChecked++;
              expect(block.sport).toBe(sport);
              expect(block.items.length, `${label} ${card.id} block`).toBeGreaterThanOrEqual(4);
              for (const it of block.items) {
                assertSafe(it.exercise.id, `${card.id}/${block.id}`);
                if (it.targetRpe != null) expect(it.targetRpe).toBeLessThanOrEqual(7);
              }
              // gear blocks only go with weights workouts; the gentle block is the first choice for 65+ and joint complaints
              if (card.mode === 'bodyweight') expect(block.variant, `${label} ${card.id}`).not.toBe('gear');
              if (jointFirst && gentleFits(sport)) expect(block.variant, `${label} ${card.id}`).toBe('gentle');
              expect(totalMinutes).toBe(card.estimatedMinutes + block.estimatedMinutes);
              expect(notes.some((n) => n.code === 'sport_none_fit')).toBe(false);
            } else {
              expect(totalMinutes).toBe(card.estimatedMinutes);
              expect(notes.filter((n) => n.code === 'sport_none_fit')).toEqual([{ code: 'sport_none_fit', params: { sport } }]);
            }
          }
        }
      }
    }
    // the fixtures always have workouts and blocks, so this cannot pass by checking nothing
    if (workouts === WORKOUTS) {
      expect(previews).toBeGreaterThan(50);
      expect(blocksChecked).toBeGreaterThan(10);
    }
  }, 120_000);
});
