/**
 * Writes docs/ready-workouts.md: every ready workout and sport finisher, grouped by muscle focus, with the facts
 * the app derives from the exercises (equipment, minutes, muscles). Run with `npm run docs:workouts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOCATIONS, READY_FOCUSES, SPORTS, SPORT_BLOCK_VARIANTS, TRAINING_MODES } from '../shared/constants';
import { EXERCISE_LIBRARY } from '../server/src/data/exercises/index';
import { READY_WORKOUTS } from '../server/src/data/ready-workouts/index';
import { SPORT_BLOCKS } from '../server/src/data/sport-blocks/index';
import { blockSeconds, deriveEquipment, deriveMuscles, lookupOf, totalSets, validateReadyCatalog, workoutMinutes } from '../server/src/modules/ready/rules';

const lookup = lookupOf(EXERCISE_LIBRARY);
const r = validateReadyCatalog(READY_WORKOUTS, SPORT_BLOCKS, lookup);
const FOCUS_NAME: Record<string, string> = {
  chest: 'Chest (חזה)',
  back: 'Back (גב)',
  shoulders: 'Shoulders (כתפיים)',
  biceps: 'Biceps (דו-ראשי)',
  triceps: 'Triceps (תלת-ראשי)',
  arms: 'Arms (ידיים)',
  abs: 'Abs (בטן)',
  core: 'Core (ליבה)',
  glutes: 'Glutes (ישבן)',
  quads: 'Quads (ארבע-ראשי)',
  hamstrings: 'Hamstrings (ירך אחורי)',
  legs: 'Legs (רגליים)',
  upper_body: 'Upper body (פלג גוף עליון)',
  full_body: 'Full body (כל הגוף)',
  cardio: 'Cardio (קרדיו)',
};
const SPORT_NAME: Record<string, string> = {
  soccer: 'Soccer (כדורגל)',
  basketball: 'Basketball (כדורסל)',
  volleyball: 'Volleyball (כדורעף)',
  tennis_padel: 'Tennis / padel (טניס / פאדל)',
  running: 'Running (ריצה)',
  cycling: 'Cycling (רכיבה על אופניים)',
  swimming: 'Swimming (שחייה)',
  striking: 'Boxing / kickboxing / krav maga (אגרוף / קיקבוקס / קרב מגע)',
  grappling: 'Judo / BJJ / wrestling (ג׳ודו / BJJ / היאבקות)',
  climbing: 'Climbing (טיפוס)',
  surfing: 'Surfing (גלישה)',
  calisthenics: 'Calisthenics / street workout (קליסטניקס)',
  general: 'Other sport / general fitness (ספורט אחר)',
};
const PLACE = { gym: 'gym', home: 'home', outdoor: 'park' } as const;
const exName = (id: string) => lookup.get(id)?.name.en ?? id;

const md: string[] = [
  '# Ready workouts',
  '',
  `${READY_WORKOUTS.length} ready-made workouts and ${SPORT_BLOCKS.length} sport finisher blocks, generated from the data (\`npm run docs:workouts\`). Equipment, muscles and length are derived from the exercises, never typed in.`,
  '',
  '## How the app uses them',
  '',
  '1. The user picks **where** they train: gym, home or park.',
  '2. At home or in the park they tick **which equipment** they have (at the gym everything is assumed).',
  '3. They pick **bodyweight** or **weights**.',
  '4. They pick a muscle focus (chest, back, shoulders, biceps, triceps, arms, abs, core, glutes, quads, hamstrings, legs, upper body, full body, cardio), optionally a level and a time limit.',
  '5. On the workout page the app asks whether they **train a specific sport**. If they do, the **last 10 minutes** are a finisher for that sport (physical preparation, not coaching in the sport).',
  '6. Age, reported injuries and the under-18 rules adapt or hide workouts: exercises are swapped for easier alternatives or removed, older adults get a low-impact finisher.',
  '',
  '## Numbers',
  '',
  '| | |',
  '|---|---|',
  `| Workouts | ${r.stats.workouts} |`,
  `| Sport finisher blocks | ${r.stats.blocks} (${SPORTS.length} sports x ${SPORT_BLOCK_VARIANTS.length} variants) |`,
  `| Workouts that need no equipment | ${r.stats.noEquipment} |`,
  `| Library exercises used | ${r.stats.exercisesUsed} of ${EXERCISE_LIBRARY.length} |`,
  `| By mode | ${TRAINING_MODES.map((m) => `${m} ${r.stats.byMode[m]}`).join(', ')} |`,
  `| By place | ${LOCATIONS.map((p) => `${PLACE[p]} ${r.stats.byPlace[p]}`).join(', ')} |`,
  `| By level | ${Object.entries(r.stats.byLevel).map(([k, v]) => `${k} ${v}`).join(', ')} |`,
  '',
  '| Focus | Workouts |',
  '|---|---|',
  ...READY_FOCUSES.map((f) => `| ${FOCUS_NAME[f]} | ${r.stats.byFocus[f]} |`),
  '',
];

for (const f of READY_FOCUSES) {
  const list = READY_WORKOUTS.filter((w) => w.focus === f);
  md.push(`## ${FOCUS_NAME[f]} - ${list.length} workouts`, '');
  for (const w of list) {
    const gearList = deriveEquipment(w.items, lookup);
    md.push(
      `### ${w.name.en} / ${w.name.he}`,
      '',
      `\`${w.id}\` · ${w.level} · ${w.mode} · ${w.places.map((p) => PLACE[p]).join(' / ')} · ${workoutMinutes(w.items, lookup)} min · ${w.items.length} exercises, ${totalSets(w.items)} sets · gear: ${gearList.join(', ') || 'none'} · muscles: ${deriveMuscles(w.items, lookup).join(', ')}`,
      '',
      w.description.en,
      '',
      w.description.he,
      '',
      ...w.items.map((it) => `- ${exName(it.exerciseId)}: ${it.sets} x ${it.reps ? `${it.reps[0]}-${it.reps[1]}` : `${it.seconds} s`}, rest ${it.restSeconds} s`),
      '',
    );
  }
}

md.push('## Sport finishers (10 minutes at the end of a workout)', '');
for (const s of SPORTS) {
  md.push(`### ${SPORT_NAME[s]}`, '');
  for (const v of SPORT_BLOCK_VARIANTS) {
    const b = SPORT_BLOCKS.find((x) => x.sport === s && x.variant === v);
    if (!b) {
      md.push(`- **${v}**: missing`);
      continue;
    }
    const gearList = deriveEquipment(b.items, lookup);
    md.push(`- **${v}** - ${b.name.en} / ${b.name.he} (${(blockSeconds(b.items, lookup) / 60).toFixed(1)} min, gear: ${gearList.join(', ') || 'none'}): ${b.items.map((it) => `${exName(it.exerciseId)} ${it.sets}x${it.seconds ? `${it.seconds}s` : `${it.reps![0]}-${it.reps![1]}`}`).join('; ')}`);
  }
  md.push('');
}

fs.writeFileSync(path.resolve(import.meta.dirname, '..', 'docs', 'ready-workouts.md'), md.join('\n'));
console.log(`docs/ready-workouts.md: ${READY_WORKOUTS.length} workouts, ${SPORT_BLOCKS.length} blocks`);
