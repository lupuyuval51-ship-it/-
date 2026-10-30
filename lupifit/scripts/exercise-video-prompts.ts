/**
 * Writes docs/exercise-video-prompts.md and docs/exercise-video-prompts.csv: one text-to-video prompt per
 * exercise (for Gemini / Veo), built from the exercise library so the form shown matches the app's own
 * instructions. Run with `npm run docs:video-prompts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { EXERCISE_LIBRARY } from '../server/src/data/exercises/index';

const STYLE =
  'Photorealistic fitness instruction video, one athletic adult demonstrator with a neutral build in plain black fitted sportswear and clean training shoes, ' +
  'filmed in a bright minimal studio with a light grey floor and wall, soft even lighting, camera locked on a tripod at a steady 3/4 side angle at hip height, ' +
  'full body always in frame, smooth natural speed, calm controlled tempo, three clean repetitions with perfect technique. ' +
  'No text, no captions, no logos, no watermark, no music, no other people, no cuts, no camera movement.';

const AVOID = 'Do not show any dangerous or sloppy form: no rounded lower back, no knees caving in, no jerking, no bouncing.';

const EQUIPMENT: Record<string, string> = {
  barbell: 'an Olympic barbell with plates',
  dumbbells: 'a pair of dumbbells',
  kettlebell: 'a kettlebell',
  squat_rack: 'a squat rack',
  bench: 'a flat training bench',
  cable_machine: 'a cable machine',
  lat_pulldown_machine: 'a lat pulldown machine',
  leg_press_machine: 'a leg press machine',
  pull_up_bar: 'a pull-up bar',
  dip_bars: 'parallel dip bars',
  resistance_bands: 'a resistance band',
  band: 'a resistance band',
};

const list = (xs: string[]) => xs.map((x) => x.replace(/_/g, ' ')).join(', ');
const gear = (eq: string[], name: string) =>
  eq.length ? eq.map((e) => (e === 'bench' && /incline/i.test(name) ? 'an adjustable bench set to a 30-45 degree incline' : e === 'bench' && /decline/i.test(name) ? 'a decline bench' : (EQUIPMENT[e] ?? e.replace(/_/g, ' ')))).join(' and ') : 'no equipment (bodyweight only)';

const rows = EXERCISE_LIBRARY.map((e) => {
  const steps = e.instructions.en.map((s, i) => `${i + 1}) ${s.replace(/\s+/g, ' ').trim()}`).join(' ');
  const side = e.unilateral ? ' Show the repetitions on one side, then briefly the other side.' : '';
  const hold = e.trackingType === 'time' ? ' This is a timed hold: get into position, hold it steady for the whole clip with calm breathing.' : '';
  const prompt =
    `${STYLE} The demonstrator performs the exercise "${e.name.en}" using ${gear(e.equipment, e.name.en)}. ` +
    `Target muscles: ${list(e.primaryMuscles)}. Technique to show, in order: ${steps}${side}${hold} ${AVOID} Duration 8 seconds.`;
  // Shorter variant for when the full one is too long for a single 8-second clip: the first three steps only.
  const brief = e.instructions.en.slice(0, 3).map((x, i) => `${i + 1}) ${x.replace(/\s+/g, ' ').trim()}`).join(' ');
  const short = `${STYLE} The demonstrator performs "${e.name.en}" using ${gear(e.equipment, e.name.en)}. Show: ${brief}${side}${hold} Correct, safe form only. Duration 8 seconds.`;
  return { id: e.id, name: e.name.en, nameHe: e.name.he, category: e.category, equipment: e.equipment.join('+') || 'none', prompt, short };
});

const docs = path.resolve(import.meta.dirname, '..', 'docs');
const md: string[] = [
  '# Exercise technique video prompts (Gemini / Veo)',
  '',
  `${rows.length} prompts, one per exercise, generated from the exercise library (\`npm run docs:video-prompts\`). File names to use: \`<id>.mp4\`.`,
  '',
  '## How to use',
  '',
  '1. Open Gemini (Veo video generation). Paste ONE prompt per video. Generate several takes and pick the best.',
  '2. For one consistent look across all videos, use the same first-frame image of the demonstrator (generate one still of the character in the studio and attach it as the reference/start image for every prompt, if your Gemini plan allows it).',
  '3. Watch every video before using it. AI video often gets exercise form wrong (joints bending the wrong way, wrong grip, extra limbs, reps that do not match). Reject anything that shows incorrect or unsafe technique. The prompts ask for correct form, but they do not guarantee it.',
  '4. Videos are short (the prompts ask for 8 seconds). Save as `<id>.mp4`, ideally 720p portrait or square, under about 3 MB each.',
  '',
  '## Shared style (already included at the start of every prompt)',
  '',
  STYLE,
  '',
  '## Prompts',
  '',
];
for (const r of rows) md.push(`### ${r.name} (${r.nameHe})`, '', `File: \`${r.id}.mp4\` · category: ${r.category} · equipment: ${r.equipment}`, '', 'Full prompt:', '', '```', r.prompt, '```', '', 'Short prompt (if the full one is too long or the clip rushes):', '', '```', r.short, '```', '');
fs.writeFileSync(path.join(docs, 'exercise-video-prompts.md'), md.join('\n'));

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
const csv = [['file', 'id', 'name_en', 'name_he', 'category', 'equipment', 'prompt', 'prompt_short']].concat(rows.map((r) => [`${r.id}.mp4`, r.id, r.name, r.nameHe, r.category, r.equipment, r.prompt, r.short]));
fs.writeFileSync(path.join(docs, 'exercise-video-prompts.csv'), '﻿' + csv.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n');
console.log(`docs/exercise-video-prompts.{md,csv}: ${rows.length} prompts`);
