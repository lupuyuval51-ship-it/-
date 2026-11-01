import type { Difficulty, Equipment, InjuryArea, Muscle, MovementPattern, ExerciseCategory } from '../src/enums.js';
import { INJURY_AREAS } from '../src/enums.js';
import type { ExerciseDef } from '../src/training.js';

interface Spec {
  id: string; pattern: MovementPattern; primary: Muscle[]; equipment?: Equipment[]; difficulty?: Difficulty;
  category?: ExerciseCategory; contra?: InjuryArea[]; easier?: string[]; loaded?: boolean;
}
const mk = (s: Spec): ExerciseDef => ({
  id: s.id, nameHe: s.id, nameEn: s.id, category: s.category ?? (s.loaded ? 'weight_reps' : 'bodyweight_reps'),
  difficulty: s.difficulty ?? 'beginner', pattern: s.pattern, primary: s.primary, secondary: [],
  equipment: s.equipment ?? ['none'], contraindications: s.contra ?? [], easierAlternatives: s.easier ?? [], harderAlternatives: [],
  externallyLoaded: s.loaded ?? false,
});

export const FIXTURE_CATALOG: ExerciseDef[] = [
  mk({ id: 'back_squat', pattern: 'squat', primary: ['quads', 'glutes'], equipment: ['barbell', 'squat_rack'], difficulty: 'intermediate', contra: ['knee', 'lower_back'], easier: ['goblet_squat'], loaded: true }),
  mk({ id: 'goblet_squat', pattern: 'squat', primary: ['quads', 'glutes'], equipment: ['dumbbell'], contra: ['knee'], easier: ['box_squat'], loaded: true }),
  mk({ id: 'box_squat', pattern: 'squat', primary: ['quads', 'glutes'], equipment: ['box'], easier: ['wall_sit'], contra: [] }),
  mk({ id: 'wall_sit', pattern: 'squat', primary: ['quads'], category: 'isometric' }),
  mk({ id: 'air_squat', pattern: 'squat', primary: ['quads', 'glutes'], contra: ['knee'], easier: ['wall_sit'] }),
  mk({ id: 'bench_press', pattern: 'horizontal_push', primary: ['chest', 'triceps'], equipment: ['barbell', 'bench'], difficulty: 'intermediate', contra: ['shoulder', 'wrist'], easier: ['pushup', 'incline_pushup'], loaded: true }),
  mk({ id: 'pushup', pattern: 'horizontal_push', primary: ['chest', 'triceps'], contra: ['wrist', 'shoulder'], easier: ['incline_pushup'] }),
  mk({ id: 'incline_pushup', pattern: 'horizontal_push', primary: ['chest'], contra: [] }),
  mk({ id: 'ohp', pattern: 'vertical_push', primary: ['front_delts', 'triceps'], equipment: ['barbell'], difficulty: 'intermediate', contra: ['shoulder', 'neck', 'lower_back'], easier: ['pike_pushup'], loaded: true }),
  mk({ id: 'pike_pushup', pattern: 'vertical_push', primary: ['front_delts'], contra: ['shoulder', 'wrist'], easier: ['wall_slide_press'] }),
  mk({ id: 'wall_slide_press', pattern: 'vertical_push', primary: ['front_delts'], contra: [] }),
  mk({ id: 'barbell_row', pattern: 'horizontal_pull', primary: ['lats', 'upper_back'], equipment: ['barbell'], difficulty: 'intermediate', contra: ['lower_back'], easier: ['band_row'], loaded: true }),
  mk({ id: 'band_row', pattern: 'horizontal_pull', primary: ['lats', 'upper_back'], equipment: ['resistance_band'], contra: [], easier: ['towel_row'] }),
  mk({ id: 'towel_row', pattern: 'horizontal_pull', primary: ['upper_back'], contra: [] }),
  mk({ id: 'pullup', pattern: 'vertical_pull', primary: ['lats'], equipment: ['pullup_bar'], difficulty: 'advanced', contra: ['shoulder', 'elbow'], easier: ['band_pulldown'] }),
  mk({ id: 'band_pulldown', pattern: 'vertical_pull', primary: ['lats'], equipment: ['resistance_band'], contra: [] }),
  mk({ id: 'deadlift', pattern: 'hinge', primary: ['hamstrings', 'glutes', 'lower_back'], equipment: ['barbell'], difficulty: 'advanced', contra: ['lower_back', 'hip'], easier: ['glute_bridge'], loaded: true }),
  mk({ id: 'glute_bridge', pattern: 'hinge', primary: ['glutes', 'hamstrings'], contra: [] }),
  mk({ id: 'lunge', pattern: 'lunge', primary: ['quads', 'glutes'], contra: ['knee', 'hip'], easier: ['split_squat_assisted'] }),
  mk({ id: 'split_squat_assisted', pattern: 'lunge', primary: ['quads', 'glutes'], contra: ['ankle'], easier: ['wall_sit'] }),
  mk({ id: 'calf_raise', pattern: 'calf_raise', primary: ['calves'], contra: ['ankle'], easier: ['seated_calf'] }),
  mk({ id: 'seated_calf', pattern: 'calf_raise', primary: ['calves'], contra: [] }),
  mk({ id: 'plank', pattern: 'core_stability', primary: ['abs'], category: 'isometric', contra: ['wrist', 'shoulder'], easier: ['dead_bug'] }),
  mk({ id: 'dead_bug', pattern: 'core_stability', primary: ['abs'], contra: [] }),
  mk({ id: 'crunch', pattern: 'core_flexion', primary: ['abs'], contra: ['neck'], easier: ['dead_bug'] }),
  mk({ id: 'curl', pattern: 'elbow_flexion', primary: ['biceps'], equipment: ['dumbbell'], contra: ['elbow'], easier: ['band_curl'], loaded: true }),
  mk({ id: 'band_curl', pattern: 'elbow_flexion', primary: ['biceps'], equipment: ['resistance_band'], contra: [] }),
  mk({ id: 'pushdown', pattern: 'elbow_extension', primary: ['triceps'], equipment: ['cable'], contra: ['elbow'], easier: ['band_pushdown'], loaded: true }),
  mk({ id: 'band_pushdown', pattern: 'elbow_extension', primary: ['triceps'], equipment: ['resistance_band'], contra: [] }),
  mk({ id: 'lateral_raise', pattern: 'shoulder_raise', primary: ['side_delts'], equipment: ['dumbbell'], contra: ['shoulder'], easier: ['band_lateral'], loaded: true }),
  mk({ id: 'band_lateral', pattern: 'shoulder_raise', primary: ['side_delts'], equipment: ['resistance_band'], contra: [] }),
  mk({ id: 'box_jump', pattern: 'jump', primary: ['quads', 'glutes'], equipment: ['box'], category: 'plyometric', difficulty: 'intermediate', contra: ['knee', 'ankle'], easier: ['air_squat'] }),
  mk({ id: 'russian_twist', pattern: 'core_rotation', primary: ['obliques'], contra: ['lower_back'], easier: ['dead_bug'] }),
];

export const ALL_INJURY_SETS: InjuryArea[][] = [[], ...INJURY_AREAS.map((i) => [i]), ['knee', 'lower_back'], [...INJURY_AREAS]];
