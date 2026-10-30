/**
 * Writes docs/exercise-video-prompts.md and docs/exercise-video-prompts.csv: one text-to-video prompt per
 * exercise (for Gemini / Veo), built from the exercise library so the form shown matches the app's own
 * instructions. Each exercise also gets a priority from how many ready workouts and sport blocks use it, so
 * the videos that matter most can be made first. Run with `npm run docs:video-prompts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { EXERCISE_LIBRARY } from '../server/src/data/exercises/index';
import { READY_WORKOUTS } from '../server/src/data/ready-workouts/index';
import { SPORT_BLOCKS } from '../server/src/data/sport-blocks/index';
import { isHighImpact } from '../shared/age';

const STYLE =
  'Photorealistic fitness instruction video, one athletic adult demonstrator with a neutral build in plain black fitted sportswear and clean training shoes, ' +
  'filmed in a bright minimal studio with a light grey floor and wall, soft even lighting, camera locked on a tripod at a steady 3/4 side angle at hip height, ' +
  'full body always in frame, smooth natural speed, calm controlled tempo, three clean repetitions with perfect technique. ' +
  'No text, no captions, no logos, no watermark, no music, no other people, no cuts, no camera movement.';

const AVOID_BASE = 'Do not show any dangerous or sloppy form: no rounded lower back, no knees caving in, no jerking, no bouncing.';

const EQUIPMENT: Record<string, string> = {
  barbell: 'an Olympic barbell with plates',
  dumbbells: 'a pair of dumbbells',
  kettlebell: 'a kettlebell',
  ez_bar: 'an EZ curl bar',
  squat_rack: 'a squat rack',
  bench: 'a flat training bench',
  cable_machine: 'a cable machine',
  lat_pulldown_machine: 'a lat pulldown machine',
  leg_press_machine: 'a leg press machine',
  leg_curl_machine: 'a lying leg curl machine',
  leg_extension_machine: 'a leg extension machine',
  chest_press_machine: 'a seated chest press machine',
  smith_machine: 'a Smith machine',
  pull_up_bar: 'a pull-up bar',
  dip_bars: 'parallel dip bars',
  resistance_bands: 'a resistance band',
  suspension_trainer: 'a suspension trainer (straps hanging from an anchor)',
  gymnastic_rings: 'gymnastic rings hanging from a bar',
  medicine_ball: 'a medicine ball',
  plyo_box: 'a plyo box',
  jump_rope: 'a jump rope',
  cardio_machine: 'a cardio machine',
  ab_wheel: 'an ab wheel',
};

const list = (xs: string[]) => xs.map((x) => x.replace(/_/g, ' ')).join(', ');
const gear = (eq: string[], name: string) =>
  eq.length
    ? eq
        .map((e) =>
          e === 'bench' && /incline/i.test(name)
            ? 'an adjustable bench set to a 30-45 degree incline'
            : e === 'bench' && /decline/i.test(name)
              ? 'a decline bench'
              : (EQUIPMENT[e] ?? e.replace(/_/g, ' ')),
        )
        .join(' and ')
    : 'no equipment (bodyweight only)';

// How many ready workouts / sport blocks use each exercise: the more, the more valuable its video.
const uses = new Map<string, { workouts: number; blocks: number }>();
const bump = (id: string, key: 'workouts' | 'blocks') => {
  const u = uses.get(id) ?? { workouts: 0, blocks: 0 };
  u[key]++;
  uses.set(id, u);
};
for (const w of READY_WORKOUTS) for (const it of w.items) bump(it.exerciseId, 'workouts');
for (const b of SPORT_BLOCKS) for (const it of b.items) bump(it.exerciseId, 'blocks');
const priorityOf = (n: number) => (n >= 8 ? 'A' : n >= 3 ? 'B' : n >= 1 ? 'C' : 'D');

const rows = EXERCISE_LIBRARY.map((e) => {
  const steps = e.instructions.en.map((s, i) => `${i + 1}) ${s.replace(/\s+/g, ' ').trim()}`).join(' ');
  const side = e.unilateral ? ' Show the repetitions on one side, then briefly the other side.' : '';
  const hold = e.trackingType === 'time' ? ' This is a timed drill or hold: perform it steadily for the whole clip with calm breathing.' : '';
  const impact = isHighImpact(e) ? ' Land softly and quietly, knees tracking over the toes, no stiff-legged landings.' : '';
  const avoid = `${AVOID_BASE}${impact}`;
  const prompt =
    `${STYLE} The demonstrator performs the exercise "${e.name.en}" using ${gear(e.equipment, e.name.en)}. ` +
    `Target muscles: ${list(e.primaryMuscles)}. Technique to show, in order: ${steps}${side}${hold} ${avoid} Duration 8 seconds.`;
  // Shorter variant for when the full one is too long for a single 8-second clip: the first three steps only.
  const brief = e.instructions.en.slice(0, 3).map((x, i) => `${i + 1}) ${x.replace(/\s+/g, ' ').trim()}`).join(' ');
  const short = `${STYLE} The demonstrator performs "${e.name.en}" using ${gear(e.equipment, e.name.en)}. Show: ${brief}${side}${hold} Correct, safe form only. Duration 8 seconds.`;
  const u = uses.get(e.id) ?? { workouts: 0, blocks: 0 };
  const used = u.workouts + u.blocks;
  return {
    id: e.id,
    name: e.name.en,
    nameHe: e.name.he,
    category: e.category,
    difficulty: e.difficulty,
    equipment: e.equipment.join('+') || 'none',
    used,
    usedInWorkouts: u.workouts,
    usedInBlocks: u.blocks,
    priority: priorityOf(used),
    risky: e.difficulty === 'advanced' || e.category === 'plyometric' || isHighImpact(e),
    prompt,
    short,
  };
}).sort((a, b) => a.priority.localeCompare(b.priority) || b.used - a.used || a.id.localeCompare(b.id));

const count = (p: string) => rows.filter((r) => r.priority === p).length;
const docs = path.resolve(import.meta.dirname, '..', 'docs');
const md: string[] = [
  '# Exercise technique video prompts (Gemini / Veo)',
  '',
  `${rows.length} prompts, one per exercise, generated from the exercise library (\`npm run docs:video-prompts\`). File names to use: \`<id>.mp4\`.`,
  '',
  '## Where to start (priority)',
  '',
  'Every exercise has a priority from how many ready workouts and sport finishers use it:',
  '',
  `- **A** (${count('A')} videos): used 8 or more times. Make these first: they cover most of the app.`,
  `- **B** (${count('B')} videos): used 3 to 7 times.`,
  `- **C** (${count('C')} videos): used 1 or 2 times.`,
  `- **D** (${count('D')} videos): not used by a ready workout yet (they appear in plans, swaps and the library).`,
  '',
  'The prompts below are sorted A, B, C, D (and by use inside each group). The CSV has the same order and the columns `priority`, `used_in_workouts`, `used_in_sport_blocks`.',
  '',
  '## How to use',
  '',
  '1. Open Gemini (Veo video generation). Paste ONE prompt per video. Generate several takes and pick the best.',
  '2. For one consistent look across all videos, use the same first-frame image of the demonstrator (generate one still of the character in the studio and attach it as the reference/start image for every prompt, if your Gemini plan allows it).',
  '3. Watch every video before using it. AI video often gets exercise form wrong (joints bending the wrong way, wrong grip, extra limbs, reps that do not match). Reject anything that shows incorrect or unsafe technique. The prompts ask for correct form, but they do not guarantee it. Exercises marked RISKY below (advanced, jumping, impact) are the ones most likely to come out wrong or unsafe: check them twice.',
  '4. Videos are short (the prompts ask for 8 seconds). Save as `<id>.mp4`, ideally 720p portrait or square, under about 3 MB each.',
  '',
  '## Shared style (already included at the start of every prompt)',
  '',
  STYLE,
  '',
  '## Prompts',
  '',
];
for (const r of rows) {
  md.push(
    `### ${r.name} (${r.nameHe})`,
    '',
    `File: \`${r.id}.mp4\` · priority ${r.priority} (used ${r.usedInWorkouts}x in workouts, ${r.usedInBlocks}x in sport finishers) · ${r.difficulty} · category: ${r.category} · equipment: ${r.equipment}${r.risky ? ' · RISKY: check the form twice' : ''}`,
    '',
    'Full prompt:',
    '',
    '```',
    r.prompt,
    '```',
    '',
    'Short prompt (if the full one is too long or the clip rushes):',
    '',
    '```',
    r.short,
    '```',
    '',
  );
}
fs.writeFileSync(path.join(docs, 'exercise-video-prompts.md'), md.join('\n'));

const cell = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`;
const csv = [['file', 'id', 'priority', 'used_in_workouts', 'used_in_sport_blocks', 'name_en', 'name_he', 'difficulty', 'category', 'equipment', 'risky', 'prompt', 'prompt_short']].concat(
  rows.map((r) => [`${r.id}.mp4`, r.id, r.priority, String(r.usedInWorkouts), String(r.usedInBlocks), r.name, r.nameHe, r.difficulty, r.category, r.equipment, r.risky ? 'yes' : 'no', r.prompt, r.short]),
);
fs.writeFileSync(path.join(docs, 'exercise-video-prompts.csv'), '﻿' + csv.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n');
console.log(`docs/exercise-video-prompts.{md,csv}: ${rows.length} prompts (A ${count('A')}, B ${count('B')}, C ${count('C')}, D ${count('D')})`);
