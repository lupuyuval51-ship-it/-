import type { Muscle } from '../enums.js';
import type { WorkoutFocus } from './types.js';

/** Muscles that count as "on focus" for each workout focus. full_body is validated by muscle-group spread instead. */
export const FOCUS_MUSCLES: Record<WorkoutFocus, readonly Muscle[]> = {
  chest: ['chest'],
  back: ['lats', 'upper_back', 'lower_back', 'traps'],
  shoulders: ['front_delts', 'side_delts', 'rear_delts'],
  arms: ['biceps', 'triceps', 'forearms'],
  biceps: ['biceps', 'forearms'],
  triceps: ['triceps'],
  core: ['abs', 'obliques', 'lower_back'],
  legs: ['quads', 'glutes', 'hamstrings', 'calves', 'adductors'],
  glutes: ['glutes'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  full_body: [],
  upper: ['chest', 'lats', 'upper_back', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'traps'],
  lower: ['quads', 'glutes', 'hamstrings', 'calves', 'adductors'],
  push: ['chest', 'front_delts', 'side_delts', 'triceps'],
  pull: ['lats', 'upper_back', 'rear_delts', 'biceps', 'traps'],
};

export const FOCUS_LABEL: Record<WorkoutFocus, { en: string; he: string }> = {
  chest: { en: 'Chest', he: 'חזה' },
  back: { en: 'Back', he: 'גב' },
  shoulders: { en: 'Shoulders', he: 'כתפיים' },
  arms: { en: 'Arms', he: 'זרועות' },
  biceps: { en: 'Biceps', he: 'יד קדמית' },
  triceps: { en: 'Triceps', he: 'יד אחורית' },
  core: { en: 'Core', he: 'בטן וליבה' },
  legs: { en: 'Legs', he: 'רגליים' },
  glutes: { en: 'Glutes', he: 'ישבן' },
  quads: { en: 'Quads', he: 'ארבע ראשי' },
  hamstrings: { en: 'Hamstrings', he: 'ירך אחורית' },
  full_body: { en: 'Full Body', he: 'כל הגוף' },
  upper: { en: 'Upper Body', he: 'פלג גוף עליון' },
  lower: { en: 'Lower Body', he: 'פלג גוף תחתון' },
  push: { en: 'Push', he: 'דחיפה' },
  pull: { en: 'Pull', he: 'משיכה' },
};
