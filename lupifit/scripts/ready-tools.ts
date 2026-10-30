/**
 * Tooling for authoring the ready workouts and sport blocks. Run from lupifit/:
 *
 *   npx tsx scripts/ready-tools.ts ex [--original] [--muscle=chest] [--equipment=none|dumbbells,bench] [--max-difficulty=beginner]
 *                                     [--category=bodyweight] [--pattern=core] [--track=time] [--q=push]
 *       Lists library exercises (id | primary muscles | equipment | difficulty | tracking | flags).
 *       --original keeps only the first 119 exercises (the library before the *_extra files were added).
 *       --equipment=none means exercises with no equipment; a list means exercises doable with ONLY that gear.
 *   npx tsx scripts/ready-tools.ts check [--bucket=chest] [--blocks=team_sports]
 *       Validates ready workouts (one authoring file, or all) and sport blocks; prints errors, warnings and the
 *       derived equipment / muscles / minutes of every workout. Exit code 1 on errors.
 *   npx tsx scripts/ready-tools.ts coverage
 *       Catalog-level coverage report with the gaps against the targets.
 *   npx tsx scripts/ready-tools.ts show <workoutId|blockId>
 *       Prints one workout or sport block with every derived fact.
 */
import {
  DIFFICULTIES,
  EQUIPMENT,
  LOCATIONS,
  READY_FOCUSES,
  SPORTS,
  SPORT_BLOCK_VARIANTS,
  TRAINING_MODES,
  type Equipment,
} from '../shared/constants';
import { isExternallyLoaded, isHighImpact } from '../shared/age';
import { EXERCISE_LIBRARY } from '../server/src/data/exercises/index';
import { READY_BUCKETS, READY_WORKOUTS } from '../server/src/data/ready-workouts/index';
import { SPORT_BLOCKS, SPORT_BUCKETS } from '../server/src/data/sport-blocks/index';
import {
  READY_WARMUP_MINUTES,
  blockSeconds,
  deriveEquipment,
  deriveMuscles,
  lookupOf,
  missingSportBlocks,
  totalSets,
  validateReadyCatalog,
  validateReadyWorkout,
  validateSportBlock,
  workoutMinutes,
} from '../server/src/modules/ready/rules';

const [command = 'help', ...rest] = process.argv.slice(2);
const flags = new Map<string, string>();
const positional: string[] = [];
for (const a of rest) {
  if (a.startsWith('--')) {
    const [k, v] = a.slice(2).split('=');
    flags.set(k ?? '', v ?? 'true');
  } else positional.push(a);
}
const lookup = lookupOf(EXERCISE_LIBRARY);
/** The library had this many exercises before the *_extra files were appended to it. */
const ORIGINAL_EXERCISES = 119;
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));

function exerciseList() {
  const muscle = flags.get('muscle');
  const equipment = flags.get('equipment');
  const maxDifficulty = flags.get('max-difficulty');
  const category = flags.get('category');
  const pattern = flags.get('pattern');
  const track = flags.get('track');
  const q = flags.get('q')?.toLowerCase();
  const allowed = equipment && equipment !== 'none' ? (equipment.split(',') as Equipment[]) : [];
  const pool = flags.has('original') ? EXERCISE_LIBRARY.slice(0, ORIGINAL_EXERCISES) : EXERCISE_LIBRARY;
  const rows = pool.filter((e) => {
    if (muscle && !e.primaryMuscles.includes(muscle as never) && !e.secondaryMuscles.includes(muscle as never)) return false;
    if (equipment === 'none' && e.equipment.length) return false;
    if (equipment && equipment !== 'none' && !e.equipment.every((x) => allowed.includes(x))) return false;
    if (maxDifficulty && DIFFICULTIES.indexOf(e.difficulty) > DIFFICULTIES.indexOf(maxDifficulty as never)) return false;
    if (category && e.category !== category) return false;
    if (pattern && e.movementPattern !== pattern) return false;
    if (track && e.trackingType !== track) return false;
    if (q && !`${e.id} ${e.name.en}`.toLowerCase().includes(q)) return false;
    return true;
  });
  for (const e of rows) {
    const f = [e.unilateral ? 'one-sided' : '', e.isCompound ? 'compound' : '', isExternallyLoaded(e) ? 'loaded' : '', isHighImpact(e) ? 'high-impact' : ''].filter(Boolean).join(',');
    console.log(`${pad(e.id, 34)} | ${pad(e.primaryMuscles.join('+'), 28)} | ${pad(e.equipment.join('+') || '-', 22)} | ${pad(e.difficulty, 12)} | ${pad(e.trackingType, 11)} | ${pad(e.category, 12)} | ${f}`);
  }
  console.log(`\n${rows.length} of ${pool.length} exercises`);
}

function describeWorkout(w: (typeof READY_WORKOUTS)[number]) {
  const equipment = deriveEquipment(w.items, lookup);
  return `${pad(w.id, 46)} ${pad(w.focus, 10)} ${pad(w.mode, 10)} ${pad(w.level, 12)} ${pad(w.places.join('/'), 18)} ${String(workoutMinutes(w.items, lookup)).padStart(3)} min  ${totalSets(w.items)} sets  gear: ${equipment.join('+') || '-'}  muscles: ${deriveMuscles(w.items, lookup).join('+')}`;
}

function check() {
  const bucket = flags.get('bucket');
  const blocksFile = flags.get('blocks');
  let errors = 0;
  let warnings = 0;
  const workouts = bucket ? (READY_BUCKETS[bucket] ?? (console.error(`unknown bucket "${bucket}" (${Object.keys(READY_BUCKETS).join(', ')})`), process.exit(2))) : READY_WORKOUTS;
  const blocks = blocksFile ? (SPORT_BUCKETS[blocksFile] ?? (console.error(`unknown blocks file "${blocksFile}" (${Object.keys(SPORT_BUCKETS).join(', ')})`), process.exit(2))) : SPORT_BLOCKS;
  // When only one file is checked, skip the cross-file checks (the other files may still be empty).
  if (bucket || blocksFile) {
    for (const w of bucket ? workouts : []) {
      const f = validateReadyWorkout(w, lookup);
      f.errors.forEach((e) => console.error(`error: ${e}`));
      f.warnings.forEach((e) => console.warn(`warn: ${e}`));
      errors += f.errors.length;
      warnings += f.warnings.length;
      console.log(describeWorkout(w));
    }
    for (const b of blocksFile ? blocks : []) {
      const f = validateSportBlock(b, lookup);
      f.errors.forEach((e) => console.error(`error: ${e}`));
      f.warnings.forEach((e) => console.warn(`warn: ${e}`));
      errors += f.errors.length;
      warnings += f.warnings.length;
      console.log(`${pad(b.id, 28)} ${(blockSeconds(b.items, lookup) / 60).toFixed(1)} min  gear: ${deriveEquipment(b.items, lookup).join('+') || '-'}  ${b.items.map((i) => i.exerciseId).join(', ')}`);
    }
    // Near-duplicates inside the checked file only.
    const full = validateReadyCatalog(workouts, [], lookup);
    for (const e of full.errors.filter((x) => x.includes('share') || x.includes('same exercises') || x.includes('duplicate'))) {
      if (!errors || !e.startsWith('ready workout ')) console.error(`error: ${e}`);
      errors++;
    }
    console.log(`\n${workouts.length} workout(s), ${blocks.length} block(s): ${errors} error(s), ${warnings} warning(s)`);
    process.exit(errors ? 1 : 0);
  }
  const r = validateReadyCatalog(READY_WORKOUTS, SPORT_BLOCKS, lookup);
  r.errors.forEach((e) => console.error(`error: ${e}`));
  r.warnings.forEach((e) => console.warn(`warn: ${e}`));
  console.log(`${r.stats.workouts} workouts, ${r.stats.blocks} sport blocks: ${r.errors.length} error(s), ${r.warnings.length} warning(s)`);
  process.exit(r.errors.length ? 1 : 0);
}

const TARGETS = {
  total: 200,
  perFocus: 6,
  perPlace: 60,
  perMode: 80,
  perLevel: 25,
  noEquipment: 40,
};

function coverage() {
  const r = validateReadyCatalog(READY_WORKOUTS, SPORT_BLOCKS, lookup);
  const s = r.stats;
  const gaps: string[] = [];
  const show = (title: string, rec: Record<string, number>, min: number) => {
    console.log(`\n${title}`);
    for (const [k, v] of Object.entries(rec)) {
      console.log(`  ${pad(k, 14)} ${String(v).padStart(4)} ${v < min ? `  < ${min}` : ''}`);
      if (v < min) gaps.push(`${title} ${k}: ${v} < ${min}`);
    }
  };
  console.log(`workouts: ${s.workouts} (target ${TARGETS.total}), sport blocks: ${s.blocks} (target ${SPORTS.length * SPORT_BLOCK_VARIANTS.length}), exercises used: ${s.exercisesUsed} of ${EXERCISE_LIBRARY.length}`);
  if (s.workouts < TARGETS.total) gaps.push(`workouts ${s.workouts} < ${TARGETS.total}`);
  show('by focus', s.byFocus, TARGETS.perFocus);
  show('by mode', s.byMode, TARGETS.perMode);
  show('by level', s.byLevel, TARGETS.perLevel);
  show('by place', s.byPlace, TARGETS.perPlace);
  console.log(`\nno-equipment workouts: ${s.noEquipment} (target ${TARGETS.noEquipment})`);
  if (s.noEquipment < TARGETS.noEquipment) gaps.push(`no-equipment workouts ${s.noEquipment} < ${TARGETS.noEquipment}`);
  // place x mode x focus matrix: how many workouts a person gets for each choice
  console.log('\nworkouts per place / mode / focus (a person choosing the place and mode, then a muscle)');
  console.log(`  ${pad('', 8)} ${READY_FOCUSES.map((f) => pad(f.slice(0, 5), 6)).join('')}`);
  for (const place of LOCATIONS) {
    for (const mode of TRAINING_MODES) {
      const row = READY_FOCUSES.map((f) => READY_WORKOUTS.filter((w) => w.places.includes(place) && w.mode === mode && w.focus === f).length);
      console.log(`  ${pad(`${place.slice(0, 3)}/${mode.slice(0, 4)}`, 8)} ${row.map((n) => pad(String(n), 6)).join('')}`);
    }
  }
  const missing = missingSportBlocks(SPORT_BLOCKS);
  if (missing.length) gaps.push(`missing sport blocks: ${missing.join(', ')}`);
  console.log(`\nequipment variety: ${EQUIPMENT.filter((q) => READY_WORKOUTS.some((w) => deriveEquipment(w.items, lookup).includes(q))).length} of ${EQUIPMENT.length} kinds used`);
  console.log(gaps.length ? `\nGAPS:\n  ${gaps.join('\n  ')}` : '\nno gaps');
  console.log(`(warm-up counted in every length: ${READY_WARMUP_MINUTES} min)`);
}

function show() {
  const id = positional[0];
  const w = READY_WORKOUTS.find((x) => x.id === id);
  const b = SPORT_BLOCKS.find((x) => x.id === id);
  if (!w && !b) {
    console.error(`no workout or block "${id}"`);
    process.exit(2);
  }
  const target = w ?? b!;
  console.log(`${target.id}: ${target.name.en} / ${target.name.he}\n${target.description.en}\n${target.description.he}`);
  if (w) console.log(describeWorkout(w));
  if (b) console.log(`${(blockSeconds(b.items, lookup) / 60).toFixed(1)} min, gear: ${deriveEquipment(b.items, lookup).join('+') || '-'}`);
  for (const it of target.items) {
    const e = lookup.get(it.exerciseId);
    console.log(`  ${it.sets} x ${it.reps ? it.reps.join('-') : `${it.seconds}s`} rest ${it.restSeconds}s  ${it.exerciseId} (${e?.name.en ?? '??'})${it.cue ? `  cue: ${it.cue.en}` : ''}`);
  }
}

switch (command) {
  case 'ex':
    exerciseList();
    break;
  case 'check':
    check();
    break;
  case 'coverage':
    coverage();
    break;
  case 'show':
    show();
    break;
  default:
    console.log(`commands: ex | check | coverage | show <id>   (see the header of scripts/ready-tools.ts)`);
}
