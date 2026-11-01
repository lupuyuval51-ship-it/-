import * as M from './motions.ts';
import { sheet } from './sheet.ts';
const out = process.argv[2] ?? 'sheet.png';
const which = process.argv[3] ?? 'a';
const A = [
  { name: 'air squat', motion: M.squat({ load: 'none' }), primary: ['quads' as const] },
  { name: 'goblet', motion: M.squat({ load: 'goblet', imp: 'dumbbell' }), primary: ['glutes' as const] },
  { name: 'back squat', motion: M.squat({ load: 'back' }), primary: ['quads' as const] },
  { name: 'rdl', motion: M.hinge({ imp: 'barbell' }), primary: ['hamstrings' as const] },
  { name: 'deadlift', motion: M.hinge({ imp: 'barbell', fromFloor: true }), primary: ['hamstrings' as const] },
  { name: 'lunge', motion: M.lunge({ kind: 'forward', imp: 'none' }), primary: ['quads' as const] },
  { name: 'ohp', motion: M.press({ imp: 'barbell' }), primary: ['front_delts' as const] },
  { name: 'db curl', motion: M.curl({ imp: 'dumbbell' }), primary: ['biceps' as const] },
];
const B = [
  { name: 'push-up', motion: M.pushUp({}), primary: ['chest' as const] },
  { name: 'knee pu', motion: M.pushUp({ kneel: true }), primary: ['chest' as const] },
  { name: 'incline pu', motion: M.pushUp({ handH: 0.45 }), primary: ['chest' as const] },
  { name: 'decline pu', motion: M.pushUp({ footH: 0.4 }), primary: ['chest' as const] },
  { name: 'wall pu', motion: M.pushUp({ wall: true }), primary: ['chest' as const] },
  { name: 'bench press', motion: M.benchPress({ imp: 'barbell' }), primary: ['chest' as const] },
  { name: 'db fly', motion: M.benchPress({ imp: 'dumbbell', fly: true }), primary: ['chest' as const] },
  { name: 'dip', motion: M.dip(true), primary: ['triceps' as const] },
];
const C = [
  { name: 'pull-up', motion: M.pullUp({}), primary: ['lats' as const] },
  { name: 'pulldown', motion: M.pulldown({ imp: 'cable' }), primary: ['lats' as const] },
  { name: 'bent row', motion: M.rowBent({ imp: 'barbell' }), primary: ['lats' as const] },
  { name: 'cable row', motion: M.rowBent({ imp: 'cable', seated: true }), primary: ['lats' as const] },
  { name: 'inverted row', motion: M.invertedRow(), primary: ['lats' as const] },
  { name: 'lat raise', motion: M.lateralRaise('dumbbell'), primary: ['side_delts' as const] },
  { name: 'crunch', motion: M.crunch('crunch'), primary: ['abs' as const] },
  { name: 'bridge', motion: M.bridge(false, 'none'), primary: ['glutes' as const] },
];
const D = [
  { name: 'situp', motion: M.crunch('situp'), primary: ['abs' as const] },
  { name: 'leg raise', motion: M.crunch('legraise'), primary: ['abs' as const] },
  { name: 'v-up', motion: M.crunch('vup'), primary: ['abs' as const] },
  { name: 'dead bug', motion: M.crunch('deadbug'), primary: ['abs' as const] },
  { name: 'bridge', motion: M.bridge(false, 'none'), primary: ['glutes' as const] },
  { name: 'hip thrust', motion: M.bridge(true, 'barbell'), primary: ['glutes' as const] },
  { name: 'forearm plank', motion: M.plank('forearm'), primary: ['abs' as const] },
  { name: 'side plank', motion: M.plank('side'), primary: ['obliques' as const] },
  { name: 'bird dog', motion: M.birdDog(), primary: ['abs' as const] },
  { name: 'russian twist', motion: M.russianTwist(), primary: ['obliques' as const] },
  { name: 'wood chop', motion: M.woodChop('cable'), primary: ['obliques' as const] },
  { name: 'calf raise', motion: M.calfRaise('none'), primary: ['calves' as const] },
];
const E = [
  { name: 'skull crusher', motion: M.skullCrusher(), primary: ['triceps' as const] },
  { name: 'oh tri ext', motion: M.tricepsOverhead('dumbbell'), primary: ['triceps' as const] },
  { name: 'pushdown', motion: M.pushdown('cable'), primary: ['triceps' as const] },
  { name: 'kickback', motion: M.kickback('dumbbell'), primary: ['triceps' as const] },
  { name: 'face pull', motion: M.rowBent({ imp: 'cable', face: true }), primary: ['rear_delts' as const] },
  { name: 'upright row', motion: M.upright('barbell'), primary: ['side_delts' as const] },
  { name: 'rear fly', motion: M.rearFly('dumbbell'), primary: ['rear_delts' as const] },
  { name: 'bench dip', motion: M.benchDip(), primary: ['triceps' as const] },
  { name: 'pull-up', motion: M.pullUp({}), primary: ['lats' as const] },
  { name: 'bench press', motion: M.benchPress({ imp: 'barbell' }), primary: ['chest' as const] },
  { name: 'dip', motion: M.dip(true), primary: ['triceps' as const] },
  { name: 'jumping jack', motion: M.jumpingJack(), primary: ['quads' as const] },
];
sheet({ a: A, b: B, c: C, d: D, e: E }[which as 'a'] ?? A, out, 6);
