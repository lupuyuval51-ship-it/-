// Google Play listing assets -> docs/play-store/:
//   screenshots/*.png       phone screenshots, Hebrew, dark theme, 1080x1920 (24-bit PNG)
//   icon-512.png            512x512 store icon (full square; Play applies its own corner mask)
//   feature-graphic-*.png   1024x500 feature graphics (Hebrew and English, 24-bit PNG)
//
// Needs a production build served by its own server with a THROWAWAY database (the script creates a
// demo account and activity there), for example:
//   npm run build
//   createdb -h 127.0.0.1 -U fitai fitai_play
//   NODE_ENV=production PORT=4310 HOST=127.0.0.1 APP_URL=http://127.0.0.1:4310 COOKIE_SECURE=false \
//     DB_AUTO_MIGRATE=true SESSION_SECRET=<40+ random chars> AI_API_KEY= OPENFOODFACTS_ENABLED=false \
//     DATABASE_URL=postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai_play node dist/server/index.js
//   BASE_URL=http://127.0.0.1:4310 DATABASE_URL=postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai_play \
//     node scripts/play-store-assets.mjs
//
// Everything is created through the API like a real user. DATABASE_URL (same throwaway database) is only
// used for two things the API cannot do: spreading the demo workouts over the past three weeks (sessions
// always start "now") and giving the account the Sunday week start a Hebrew sign-up gets.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:4310').replace(/\/$/, '');
const root = path.resolve(import.meta.dirname, '..');
const OUT = path.join(root, 'docs', 'play-store');
const SHOTS = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const day = (offset) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(d); // YYYY-MM-DD
};

const browser = await chromium.launch();

// ------------------------------------------------------------------ demo account + activity
const ctx = await browser.newContext({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3, // 1080x1920
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
  locale: 'he-IL',
  timezoneId: 'Asia/Jerusalem',
  serviceWorkers: 'block',
});
const page = await ctx.newPage();

// Register through the UI in English (the e2e helpers' flow).
await page.goto(`${BASE}/register`);
await page.getByRole('button', { name: 'English' }).click();
const email = `play-${Date.now()}@example.invalid`;
await page.getByLabel('Name').fill('דניאל');
await page.getByLabel('Email').fill(email);
await page.locator('input[name="password"]').fill('Passw0rd!demo');
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL(/\/onboarding/);

let csrf = (await (await page.request.get(`${BASE}/api/auth/me`)).json()).csrfToken;
let keyN = 0;
async function api(method, url, data) {
  const res = await page.request.fetch(`${BASE}/api${url}`, {
    method,
    headers: { 'x-csrf-token': csrf, 'content-type': 'application/json', 'idempotency-key': `play-assets-${Date.now()}-${keyN++}` },
    data: data ?? (method === 'GET' ? undefined : {}),
  });
  if (!res.ok()) throw new Error(`${method} ${url}: ${res.status()} ${await res.text()}`);
  return res.json();
}

await api('PUT', '/profile/onboarding', {
  ageYears: 31,
  sex: 'male',
  heightCm: 178,
  weightKg: 77.8, // onboarding also logs this as today's weigh-in

  experienceLevel: 'intermediate',
  goal: 'muscle_gain',
  trainingLocation: 'gym',
  equipment: ['barbell', 'dumbbells', 'squat_rack', 'bench', 'cable_machine', 'lat_pulldown_machine', 'leg_press_machine', 'pull_up_bar', 'dip_bars'],
  daysPerWeek: 4,
  sessionMinutes: 60,
  preferredDays: [0, 1, 3, 4],
  dietType: 'omnivore',
  activityLevel: 'moderate',
  occupationActivity: 'desk',
  sleepHours: 7,
  stressLevel: 'moderate',
  mealsPerDay: 4,
  weeklyWorkoutGoal: 3,
});

// Switch the interface to Hebrew with the language toggle, then keep Hebrew as the account language
// (as a Hebrew sign-up has it) so plan and workout names are generated in Hebrew.
await page.goto(`${BASE}/`);
await page.locator('.lang-toggle').click();
await page.waitForFunction(() => document.documentElement.lang === 'he');
await api('PATCH', '/settings', { locale: 'he' });

const sql = process.env.DATABASE_URL ? new pg.Client({ connectionString: process.env.DATABASE_URL }) : null;
await sql?.connect();
const userId = (await (await page.request.get(`${BASE}/api/auth/me`)).json()).user.id;
await sql?.query('UPDATE users SET week_start = 0 WHERE id = $1', [userId]);

// Plan
const { plan: generated } = await api('POST', '/plans/generate', {});
const { plan } = await api('POST', `/plans/${generated.id}/activate`);

// Body weight: a slow gain over five weeks, up to today's 77.8 kg from onboarding.
for (let i = 35; i >= 2; i -= 3) {
  const kg = Math.round((76.7 + (35 - i) * 0.03 + (i % 2 ? 0.2 : -0.1)) * 10) / 10;
  await api('POST', '/progress/body-weight', { date: day(-i), weightKg: kg });
}

// Food log: the last six days complete, today up to the afternoon snack.
const foodIds = new Map();
async function food(slug, query) {
  if (!foodIds.has(slug)) {
    const { foods } = await api('GET', `/foods/search?q=${encodeURIComponent(query)}`);
    const hit = foods.find((f) => f.slug === slug) ?? foods[0];
    if (!hit) throw new Error(`food not found: ${query}`);
    foodIds.set(slug, hit.id);
  }
  return foodIds.get(slug);
}
// About 2,800 kcal a day, close to the computed muscle-gain target.
const MENU = {
  breakfast: [['oats_rolled_dry', 'rolled oats', 80], ['greek_yogurt_plain_nonfat', 'greek yogurt', 200], ['banana', 'banana', 120], ['peanut_butter_natural', 'peanut butter', 20]],
  lunch: [['chicken_breast_cooked', 'chicken breast cooked', 200], ['rice_white_cooked', 'white rice cooked', 300], ['israeli_salad_olive_oil', 'israeli salad', 200]],
  snack: [['almonds_raw', 'almonds', 40], ['apple', 'apple', 180]],
  dinner: [['salmon_cooked', 'salmon cooked', 180], ['sweet_potato_baked', 'sweet potato', 300], ['hummus', 'hummus', 80], ['pita_white', 'pita', 60]],
};
for (let i = 6; i >= 0; i--) {
  for (const [mealType, items] of Object.entries(MENU)) {
    if (i === 0 && mealType === 'dinner') continue;
    for (const [slug, query, grams] of items) {
      const vary = i === 0 ? 1 : 0.93 + ((i * 7 + grams) % 15) / 100;
      await api('POST', '/nutrition/logs', { date: day(-i), mealType, foodId: await food(slug, query), grams: Math.round(grams * vary) });
    }
  }
}

// Workouts: nine completed sessions through the plan with gradually heavier loads.
const START_KG = { barbell: 50, dumbbell: 16, dumbbells: 16, cable_machine: 30, lat_pulldown_machine: 45, leg_press_machine: 90, squat_rack: 55 };
const kgFor = (ex, step) => {
  const base = ex.equipment.map((e) => START_KG[e]).find(Boolean) ?? 20;
  return Math.round((base + step * (base >= 50 ? 2.5 : 1)) * 2) / 2;
};
async function logSets(session, upTo = Infinity) {
  let done = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (done >= upTo) return;
      const reps = set.targetReps ?? ex.repMax ?? 10;
      const body =
        ex.exercise.trackingType === 'time'
          ? { durationSeconds: set.targetSeconds ?? 45, completed: true }
          : ex.exercise.trackingType === 'reps'
            ? { reps, completed: true }
            : { reps, weightKg: set.targetWeightKg ?? kgFor(ex.exercise, session.step), completed: true };
      await api('PATCH', `/sessions/${session.id}/sets/${set.id}`, body);
      done++;
    }
  }
}
const OFFSETS = [-20, -18, -16, -13, -11, -9, -6, -4, -2];
const finished = [];
for (const [n, offset] of OFFSETS.entries()) {
  const workout = plan.workouts[n % plan.workouts.length];
  const { session } = await api('POST', '/sessions', { planWorkoutId: workout.id });
  await logSets({ ...session, step: Math.floor(n / plan.workouts.length) });
  await api('POST', `/sessions/${session.id}/finish`, { perceivedExertion: 7 + (n % 2) });
  finished.push({ id: session.id, offset });
}
for (const { id, offset } of finished) {
  const shift = `${-offset} days`;
  await sql?.query(
    `UPDATE workout_sessions SET started_at = now() - $2::interval - interval '62 minutes', ended_at = now() - $2::interval - interval '4 minutes',
            duration_seconds = 3480, created_at = now() - $2::interval WHERE id = $1`,
    [id, shift],
  );
  await sql?.query(`UPDATE session_sets SET completed_at = completed_at - $2::interval WHERE session_id = $1 AND completed`, [id, shift]);
  await sql?.query(`UPDATE personal_records SET achieved_at = achieved_at - $2::interval WHERE session_id = $1`, [id, shift]);
}
// The demo user has seen the achievement and record notifications the seeding produced.
await api('POST', '/notifications/read-all');

// ------------------------------------------------------------------ screenshots
/** `anchor`: scroll so this element sits just under the sticky top bar (default: top of the page). */
async function shot(name, url, anchor) {
  await page.goto(`${BASE}${url}`);
  await page.waitForLoadState('networkidle');
  await page.locator(anchor ?? 'h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.evaluate((sel) => {
    const el = sel ? document.querySelector(sel) : null;
    const bar = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;
    window.scrollTo(0, el ? el.getBoundingClientRect().top + window.scrollY - bar - 12 : 0);
  }, anchor ?? null);
  await page.waitForLoadState('networkidle'); // lazy images that scrolled into view
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  console.log(`screenshot ${name}.png`);
}
await shot('01-dashboard', '/');
await shot('03-workout-plan', `/workouts/plans/${plan.id}`);
await shot('04-nutrition-day', '/nutrition', '.nutri-overview-card');
await shot('05-daily-menu', '/nutrition/menu', '.menu-list');
await shot('06-progress', '/progress', '.progress-activity');

// Live workout last, so the other screens do not show a workout in progress.
const next = plan.workouts[OFFSETS.length % plan.workouts.length];
const { session: live } = await api('POST', '/sessions', { planWorkoutId: next.id, readiness: { energy: 'normal', soreness: 'some', sleep: 'good' } });
await logSets({ ...live, step: 3 }, 2);
await sql?.query(`UPDATE workout_sessions SET started_at = started_at - interval '18 minutes' WHERE id = $1`, [live.id]);
await shot('02-live-workout', '/workouts/session');
await sql?.end();
await ctx.close();

// ------------------------------------------------------------------ store icon + feature graphics
const MARK =
  '<g fill="#f5f5f5"><rect x="4" y="4" width="2.25" height="16"/><rect x="8.5" y="4" width="2.25" height="16"/><rect x="13" y="4" width="2.25" height="16"/><rect x="17.5" y="4" width="2.25" height="16"/></g><line x1="1.5" y1="17.5" x2="22.5" y2="6.5" stroke="#ff6a00" stroke-width="2.5"/>';
const art = await browser.newPage();

// Icon: same artwork as client/public/icon-512.png, but a full square (Play rounds the corners itself).
// Exported through a canvas because Play asks for a 32-bit PNG (with an alpha channel).
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512"><rect width="64" height="64" fill="#0b0b0d"/><g transform="translate(8 8) scale(2)">${MARK}</g></svg>`;
const iconPng = await art.evaluate(async (svg) => {
  const img = new Image();
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  canvas.getContext('2d').drawImage(img, 0, 0, 512, 512);
  return canvas.toDataURL('image/png');
}, iconSvg);
fs.writeFileSync(path.join(OUT, 'icon-512.png'), Buffer.from(iconPng.split(',')[1], 'base64'));

const font = (pkg, file) => fs.readFileSync(path.join(root, 'node_modules', pkg, 'files', file)).toString('base64');
const fontCss = `
@font-face { font-family: 'Barlow Condensed'; font-weight: 700; src: url(data:font/woff2;base64,${font('@fontsource/barlow-condensed', 'barlow-condensed-latin-700-normal.woff2')}) format('woff2'); }
@font-face { font-family: 'Heebo'; font-weight: 100 900; src: url(data:font/woff2;base64,${font('@fontsource-variable/heebo', 'heebo-hebrew-wght-normal.woff2')}) format('woff2'); unicode-range: U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F; }
@font-face { font-family: 'Heebo'; font-weight: 100 900; src: url(data:font/woff2;base64,${font('@fontsource-variable/heebo', 'heebo-latin-wght-normal.woff2')}) format('woff2'); }`;
const TAGLINE = {
  he: { dir: 'rtl', text: 'תוכנית אימונים, יומן תזונה והתקדמות במקום אחד' },
  en: { dir: 'ltr', text: 'Workout plans, nutrition log and progress in one place' },
};
await art.setViewportSize({ width: 1024, height: 500 });
for (const [lang, { dir, text }] of Object.entries(TAGLINE)) {
  await art.setContent(`<!doctype html><html lang="${lang}" dir="${dir}"><head><style>${fontCss}
    html, body { margin: 0; width: 1024px; height: 500px; background: #0b0b0d; color: #f5f5f5; overflow: hidden; }
    .wrap { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; }
    .brand { display: flex; align-items: center; gap: 28px; direction: ltr; }
    .brand svg { width: 132px; height: 132px; }
    .name { font-family: 'Barlow Condensed'; font-weight: 700; font-size: 132px; letter-spacing: 0.04em; line-height: 1; }
    .rule { width: 96px; height: 6px; background: #ff6a00; }
    .tag { font-family: 'Heebo'; font-weight: 500; font-size: 34px; color: #a3a3a8; }
  </style></head><body><div class="wrap">
    <div class="brand"><svg viewBox="0 0 24 24" aria-hidden="true">${MARK}</svg><span class="name">LUPU-FIT</span></div>
    <div class="rule"></div>
    <div class="tag">${text}</div>
  </div></body></html>`);
  await art.evaluate(() => document.fonts.ready);
  await art.screenshot({ path: path.join(OUT, `feature-graphic-${lang}.png`) });
}
await browser.close();
console.log(`demo account: ${email}`);
console.log(`assets written to ${path.relative(root, OUT)}`);
