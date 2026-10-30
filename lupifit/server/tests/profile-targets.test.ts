import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { computeNutritionTargets } from '@shared/nutrition';
import { customTargetsIssues, macroCalories, minimumProteinG } from '@shared/schemas/profile';
import { db } from '../src/db/pool';
import { TestClient, onboardedUser, registerUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

// Default test profile: 30 y male, 180 cm, 80 kg, moderate activity, muscle gain.
const ADULT = computeNutritionTargets({ ageYears: 30, sex: 'male', heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'muscle_gain' });
const VALID_CUSTOM = { calories: 2500, proteinG: 150, carbsG: 300, fatG: 76 }; // 600 + 1200 + 684 = 2484 kcal

describe('customTargetsIssues (shared safety rules)', () => {
  it('flags each rule with the numbers the UI needs', () => {
    const ctx = { minimumCalories: 1780, weightKg: 80 };
    expect(customTargetsIssues(VALID_CUSTOM, ctx)).toEqual([]);
    expect(customTargetsIssues({ ...VALID_CUSTOM, calories: 1700 }, ctx)[0]).toEqual({ code: 'calories_below_safe_minimum', details: { minimum: 1780 } });
    expect(customTargetsIssues({ ...VALID_CUSTOM, proteinG: 63 }, ctx).map((i) => i.code)).toContain('protein_too_low');
    expect(minimumProteinG(80)).toBe(64);
    expect(minimumProteinG(80.5)).toBe(65);
    const inconsistent = customTargetsIssues({ calories: 2500, proteinG: 150, carbsG: 150, fatG: 60 }, ctx);
    expect(inconsistent).toEqual([{ code: 'macros_inconsistent', details: { macroCalories: 1740 } }]);
    // Exactly 10% off is still accepted.
    expect(macroCalories({ proteinG: 100, carbsG: 350, fatG: 100 })).toBe(2700);
    expect(customTargetsIssues({ calories: 3000, proteinG: 100, carbsG: 350, fatG: 100 }, ctx)).toEqual([]);
  });
});

describe('PUT /api/profile/targets', () => {
  it('requires a complete profile', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.put('/api/profile/targets', VALID_CUSTOM);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('onboarding_required');
    expect((await c.put('/api/profile/targets', { reset: true })).status).toBe(409);
  });

  it('saves safe custom targets and keeps the computed reference', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.put('/api/profile/targets', VALID_CUSTOM);
    expect(res.status).toBe(200);
    const t = res.body.profile.targets;
    expect(t).toMatchObject({ calories: 2500, proteinG: 150, carbsG: 300, fatG: 76, fiberG: 35, custom: true });
    expect(t.computed).toMatchObject({ calories: ADULT.calories, minimumCalories: ADULT.minimumCalories, bmr: ADULT.bmr, tdee: ADULT.tdee });
    const stored = await db.one('SELECT calorie_target, protein_target_g, carbs_target_g, fat_target_g, targets_custom FROM profiles WHERE user_id = $1', [c.userId]);
    expect(stored).toEqual({ calorie_target: 2500, protein_target_g: 150, carbs_target_g: 300, fat_target_g: 76, targets_custom: true });
    expect((await c.get('/api/profile')).body.profile.targets).toEqual(t);
  });

  it('rejects calories below the safe minimum', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.put('/api/profile/targets', { calories: 1500, proteinG: 120, carbsG: 150, fatG: 50 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('calories_below_safe_minimum');
    expect(res.body.error.details).toEqual({ minimum: ADULT.minimumCalories });
    expect((await c.get('/api/profile')).body.profile.targets.custom).toBe(false);
  });

  it('rejects protein below 0.8 g per kg of body weight', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.put('/api/profile/targets', { calories: 2500, proteinG: 60, carbsG: 390, fatG: 80 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('protein_too_low');
    expect(res.body.error.details).toEqual({ minimum: 64 });
  });

  it('rejects macros whose energy does not match the calories', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.put('/api/profile/targets', { calories: 3000, proteinG: 150, carbsG: 200, fatG: 60 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('macros_inconsistent');
    expect(res.body.error.details).toEqual({ macroCalories: 1940 });
  });

  it('never allows a calorie deficit for minors', async () => {
    const c = await onboardedUser(server.baseUrl, { age_years: 15, goal: 'fat_loss', weight_kg: 60, height_cm: 168 });
    const profile = (await c.get('/api/profile')).body.profile;
    expect(profile.isMinor).toBe(true);
    const computed = profile.targets.computed;
    expect(computed.notes).toContain('minor_no_deficit');
    expect(computed.minimumCalories).toBe(Math.round(computed.tdee * 0.95));

    const deficit = Math.round((computed.tdee * 0.85) / 10) * 10;
    const fat = Math.round((deficit * 0.3) / 9);
    const carbs = Math.round((deficit - 100 * 4 - fat * 9) / 4);
    const res = await c.put('/api/profile/targets', { calories: deficit, proteinG: 100, carbsG: carbs, fatG: fat });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('calories_below_safe_minimum');
    expect(res.body.error.details.minimum).toBe(computed.minimumCalories);

    const maintenance = Math.round(computed.tdee / 10) * 10;
    const fat2 = Math.round((maintenance * 0.3) / 9);
    const carbs2 = Math.round((maintenance - 90 * 4 - fat2 * 9) / 4);
    const ok = await c.put('/api/profile/targets', { calories: maintenance, proteinG: 90, carbsG: carbs2, fatG: fat2 });
    expect(ok.status).toBe(200);
    expect(ok.body.profile.targets.custom).toBe(true);
  });

  it('validates the payload shape', async () => {
    const c = await onboardedUser(server.baseUrl);
    for (const bad of [
      { ...VALID_CUSTOM, calories: 900 },
      { ...VALID_CUSTOM, calories: 2500.5 },
      { ...VALID_CUSTOM, fatG: 5 },
      { calories: 2500 },
      { reset: false },
      { reset: 'yes' },
      {},
    ]) {
      const res = await c.put('/api/profile/targets', bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
  });

  it('resets to the recommended targets', async () => {
    const c = await onboardedUser(server.baseUrl);
    await c.put('/api/profile/targets', VALID_CUSTOM);
    const res = await c.put('/api/profile/targets', { reset: true });
    expect(res.status).toBe(200);
    expect(res.body.profile.targets).toMatchObject({ custom: false, calories: ADULT.calories, proteinG: ADULT.proteinG, carbsG: ADULT.carbsG, fatG: ADULT.fatG });
    const stored = await db.one('SELECT calorie_target, targets_custom FROM profiles WHERE user_id = $1', [c.userId]);
    expect(stored).toEqual({ calorie_target: ADULT.calories, targets_custom: false });
  });

  it('keeps safe custom targets when the weight changes', async () => {
    const c = await onboardedUser(server.baseUrl);
    await c.put('/api/profile/targets', VALID_CUSTOM);
    const res = await c.patch('/api/profile', { weightKg: 82 });
    expect(res.body.customTargetsReset).toBe(false);
    expect(res.body.profile.targets).toMatchObject({ custom: true, calories: 2500 });
    expect(res.body.profile.targets.computed.calories).toBeGreaterThan(ADULT.calories);
  });

  it('isolates users and requires authentication', async () => {
    const a = await onboardedUser(server.baseUrl);
    const b = await onboardedUser(server.baseUrl);
    await b.put('/api/profile/targets', VALID_CUSTOM);
    expect((await a.get('/api/profile')).body.profile.targets.custom).toBe(false);
    expect((await new TestClient(server.baseUrl).put('/api/profile/targets', VALID_CUSTOM)).status).toBe(401);
  });
});
