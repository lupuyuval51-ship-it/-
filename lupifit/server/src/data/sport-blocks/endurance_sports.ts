import type { SportBlockSeed } from '@shared/content';

export const blocks: SportBlockSeed[] = [
  // ------------------------------------------------------------ running
  {
    id: 'running_bodyweight',
    sport: 'running',
    variant: 'bodyweight',
    name: { en: 'Running: single-leg strength and calves', he: 'ריצה: כוח רגל אחת ושוקיים' },
    description: {
      en: 'Running-form skipping, single-leg hinge, calf strength, glute bridge and plank. Trains the legs and trunk with little heavy lower-body fatigue.',
      he: 'דילוגי A לטכניקת ריצה, כפיפת ירך על רגל אחת, חיזוק שוקיים, גשר ישבן ופלאנק. עבודה לרגליים ולטרנק בלי עייפות רגליים כבדה.',
    },
    items: [
      { exerciseId: 'a_skip', sets: 2, seconds: 40, restSeconds: 15 },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'standing_calf_raise', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'glute_bridge', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 15 },
    ],
  },
  {
    id: 'running_gear',
    sport: 'running',
    variant: 'gear',
    name: { en: 'Running: loaded hinge, calves and carry', he: 'ריצה: כפיפת ירך עם משקל, שוקיים ונשיאה' },
    description: {
      en: 'Running-form skipping, dumbbell single-leg hinge, calf raises, hip thrust and a farmer carry. Light loads for the posterior chain, calves and trunk.',
      he: 'דילוגי A, כפיפת ירך על רגל אחת עם משקולת, הרמות עקב, הרמת אגן ונשיאת משקולות. עומס קל לשרשרת האחורית, לשוקיים ולטרנק.',
    },
    items: [
      { exerciseId: 'a_skip', sets: 2, seconds: 40, restSeconds: 15 },
      { exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'dumbbell_calf_raise', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'dumbbell_hip_thrust', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'farmer_carry', sets: 2, seconds: 40, restSeconds: 15 },
    ],
  },
  {
    id: 'running_gentle',
    sport: 'running',
    variant: 'gentle',
    name: { en: 'Running: gentle low-impact legs and trunk', he: 'ריצה: רגליים וטרנק בעצימות נמוכה' },
    description: {
      en: 'Brisk walking rhythm, calf raises, wall sit, glute bridge marches and a side plank. Low impact work for the muscles that support running.',
      he: 'קצב הליכה מהירה, הרמות עקב, ישיבת קיר, צעדי גשר ישבן ופלאנק צד. עבודה בעצימות נמוכה לשרירים התומכים בריצה.',
    },
    items: [
      { exerciseId: 'brisk_walk_jog', sets: 2, seconds: 40, restSeconds: 15 },
      { exerciseId: 'standing_calf_raise', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'wall_sit', sets: 2, seconds: 40, restSeconds: 15 },
      { exerciseId: 'glute_bridge_march', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 15 },
    ],
  },

  // ------------------------------------------------------------ cycling
  {
    id: 'cycling_bodyweight',
    sport: 'cycling',
    variant: 'bodyweight',
    name: { en: 'Cycling: leg endurance, back and posture', he: 'רכיבה: סיבולת רגליים, גב ויציבה' },
    description: {
      en: 'Wall sit, single-leg bridge, superman, prone Y raise and plank. Trains quad and glute endurance, hip extension, lower back and upper-back posture.',
      he: 'ישיבת קיר, גשר ישבן על רגל אחת, סופרמן, הרמות Y בשכיבה ופלאנק. עבודה לסיבולת ארבע ראשי וישבן, פשיטת ירך, גב תחתון ויציבת גב עליון.',
    },
    items: [
      { exerciseId: 'wall_sit', sets: 2, seconds: 40, restSeconds: 15 },
      { exerciseId: 'single_leg_glute_bridge', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'prone_y_raise', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 15 },
    ],
  },
  {
    id: 'cycling_gear',
    sport: 'cycling',
    variant: 'gear',
    name: { en: 'Cycling: loaded legs, hinge and upper back', he: 'רכיבה: רגליים עם משקל, כפיפת ירך וגב עליון' },
    description: {
      en: 'Goblet squat, single-leg dumbbell hinge, hip thrust, band row and plank. Builds quad, glute and hamstring endurance plus upper-back posture and trunk.',
      he: 'סקוואט גביע, כפיפת ירך על רגל אחת עם משקולת, הרמת אגן, חתירה בגומייה ופלאנק. סיבולת לארבע ראשי, לישבן ולירכיים האחוריות, יציבת גב עליון וטרנק.',
    },
    items: [
      { exerciseId: 'goblet_squat', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'dumbbell_hip_thrust', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'band_row', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 15 },
    ],
  },
  {
    id: 'cycling_gentle',
    sport: 'cycling',
    variant: 'gentle',
    name: { en: 'Cycling: gentle legs, posture and trunk', he: 'רכיבה: רגליים, יציבה וטרנק בעצימות נמוכה' },
    description: {
      en: 'Box squat, glute bridge, scapular push-up, bird dog and plank. Low impact work for leg endurance, hip extension, upper-back posture and trunk control.',
      he: 'סקוואט לקופסה, גשר ישבן, שכיבת סמיכה לשכמות, ציפור-כלב ופלאנק. עבודה בעצימות נמוכה לסיבולת רגליים, פשיטת ירך, יציבת גב עליון ושליטה בטרנק.',
    },
    items: [
      { exerciseId: 'box_squat', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'glute_bridge', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'bird_dog', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 15 },
    ],
  },

  // ------------------------------------------------------------ swimming
  {
    id: 'swimming_bodyweight',
    sport: 'swimming',
    variant: 'bodyweight',
    name: { en: 'Swimming: dry-land shoulders and streamline', he: 'שחייה: כתפיים ויציבת זרימה על היבשה' },
    description: {
      en: 'Scapular push-up, prone swimmer, side plank, dolphin kick and streamline hold. Dry-land shoulder stability, upper-back endurance and trunk control.',
      he: 'שכיבת סמיכה לשכמות, שחיין בשכיבה, פלאנק צד, בעיטת דולפין וקו זרימה. יציבות כתפיים, סיבולת גב עליון ושליטה בטרנק על היבשה.',
    },
    items: [
      { exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'prone_swimmer', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'side_plank', sets: 2, seconds: 30, restSeconds: 20 },
      { exerciseId: 'prone_dolphin_kick', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'streamline_hold', sets: 2, seconds: 40, restSeconds: 15 },
    ],
  },
  {
    id: 'swimming_gear',
    sport: 'swimming',
    variant: 'gear',
    name: { en: 'Swimming: band lats and shoulder stability', he: 'שחייה: גב רחב בגומייה ויציבות כתפיים' },
    description: {
      en: 'Band row, dumbbell Y raise, band pull-apart, dolphin kick and streamline hold. Trains lats, scapular stabilisers, upper-back endurance and trunk line.',
      he: 'חתירה בגומייה, הרמות Y עם משקולות, פתיחת גומייה, בעיטת דולפין וקו זרימה. עבודה לגב רחב, למייצבי השכמות, לסיבולת גב עליון ולקו הטרנק.',
    },
    items: [
      { exerciseId: 'band_row', sets: 2, reps: [12, 15], restSeconds: 25 },
      { exerciseId: 'dumbbell_y_raise', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'band_pull_apart', sets: 2, reps: [12, 15], restSeconds: 20 },
      { exerciseId: 'prone_dolphin_kick', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'streamline_hold', sets: 2, seconds: 40, restSeconds: 20 },
    ],
  },
  {
    id: 'swimming_gentle',
    sport: 'swimming',
    variant: 'gentle',
    name: { en: 'Swimming: gentle shoulders, glutes and trunk', he: 'שחייה: כתפיים, ישבן וטרנק בעצימות נמוכה' },
    description: {
      en: 'Scapular push-up, wall push-up, donkey kick, glute bridge and plank. Low impact shoulder-blade control, kick-related glute work and a stable trunk.',
      he: 'שכיבת סמיכה לשכמות, שכיבת סמיכה על הקיר, בעיטת חמור, גשר ישבן ופלאנק. עבודה בעצימות נמוכה לשליטה בשכמות, לישבן הקשור לבעיטה ולטרנק יציב.',
    },
    items: [
      { exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'wall_push_up', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'donkey_kick', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'glute_bridge', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 15 },
    ],
  },
];
