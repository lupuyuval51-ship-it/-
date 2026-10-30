import type { SportBlockSeed } from '@shared/content';

export const blocks: SportBlockSeed[] = [
  // ------------------------------------------------------------------ Soccer
  {
    id: 'soccer_bodyweight',
    sport: 'soccer',
    variant: 'bodyweight',
    name: { en: 'Soccer: change of direction and leg stability', he: 'כדורגל: שינויי כיוון ויציבות רגליים' },
    description: {
      en: 'Five stations for lateral footwork, single-leg landing control, hamstring resilience, balance on one leg and trunk stiffness.',
      he: 'חמש תחנות לתנועה צדית, שליטה בנחיתה על רגל אחת, חוסן של שרירי הירך האחורית, שיווי משקל על רגל אחת ויציבות הליבה.',
    },
    items: [
      { exerciseId: 'lateral_shuffle', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'single_leg_hop_and_stick', sets: 2, reps: [5, 6], restSeconds: 20 },
      { exerciseId: 'slider_hamstring_curl', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'single_leg_balance_reach', sets: 2, reps: [6, 8], restSeconds: 10 },
      { exerciseId: 'plank', sets: 2, seconds: 30, restSeconds: 15 },
    ],
  },
  {
    id: 'soccer_gear',
    sport: 'soccer',
    variant: 'gear',
    name: { en: 'Soccer: single-leg strength and hip stability', he: 'כדורגל: כוח ברגל אחת ויציבות אגן' },
    description: {
      en: 'Jump rope for ankle stiffness, loaded reverse lunges, hamstring sliders, banded side steps for the hip abductors and a plank to finish.',
      he: 'קפיצה בחבל לקשיחות הקרסול, מכרע לאחור עם משקולות יד, כפיפת ברכיים בהחלקה עם מגבת, הליכה צידית עם גומייה ופלאנק לסיום.',
    },
    items: [
      { exerciseId: 'jump_rope_skipping', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'slider_hamstring_curl', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'banded_lateral_walk', sets: 2, reps: [10, 12], restSeconds: 10 },
      { exerciseId: 'plank', sets: 2, seconds: 25, restSeconds: 15 },
    ],
  },
  {
    id: 'soccer_gentle',
    sport: 'soccer',
    variant: 'gentle',
    name: { en: 'Soccer: gentle legs and trunk', he: 'כדורגל: רגליים וליבה בעדינות' },
    description: {
      en: 'Low-impact version with side-to-side stepping, a wall sit, bridge marches, bird-dogs and a side plank, no jumping.',
      he: 'גרסה עדינה ללא קפיצות: פיסוק בצעידה, כיסא על הקיר, גשר ישבן עם צעידה, בירד דוג ופלאנק צידי.',
    },
    items: [
      { exerciseId: 'step_jack', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'wall_sit', sets: 2, seconds: 30, restSeconds: 20 },
      { exerciseId: 'glute_bridge_march', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'bird_dog', sets: 2, reps: [6, 8], restSeconds: 10 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 20 },
    ],
  },

  // -------------------------------------------------------------- Basketball
  {
    id: 'basketball_bodyweight',
    sport: 'basketball',
    variant: 'bodyweight',
    name: { en: 'Basketball: jumping, landing and defense', he: 'כדורסל: קפיצה, נחיתה והגנה' },
    description: {
      en: 'Defensive slides, jump squats, single-leg hinge, hop-and-stick landings and a hollow hold for jumping power and ankle and knee control.',
      he: 'החלקות הגנתיות, סקוואט קפיצה, ציר ירך על רגל אחת, נחיתה מבוקרת אחרי קפיצה והחזקת הולו בודי לכוח קפיצה ולשליטה בקרסול ובברך.',
    },
    items: [
      { exerciseId: 'defensive_slide', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'jump_squat', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 2, reps: [6, 8], restSeconds: 15 },
      { exerciseId: 'single_leg_hop_and_stick', sets: 2, reps: [5, 6], restSeconds: 15 },
      { exerciseId: 'hollow_body_hold', sets: 2, seconds: 25, restSeconds: 15 },
    ],
  },
  {
    id: 'basketball_gear',
    sport: 'basketball',
    variant: 'gear',
    name: { en: 'Basketball: hip power and ankle stiffness', he: 'כדורסל: כוח אגן וקשיחות קרסול' },
    description: {
      en: 'Jump rope, goblet squats, banded side walks, medicine-ball slams for full-body power and a plank for trunk control.',
      he: 'קפיצה בחבל, גובלט סקוואט, הליכה צדית עם גומייה, הטחות כדור כוח לרצפה לכוח כל הגוף ופלאנק לשליטה בליבה.',
    },
    items: [
      { exerciseId: 'jump_rope_skipping', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'goblet_squat', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'banded_lateral_walk', sets: 2, reps: [10, 12], restSeconds: 10 },
      { exerciseId: 'medicine_ball_slam', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 30, restSeconds: 20 },
    ],
  },
  {
    id: 'basketball_gentle',
    sport: 'basketball',
    variant: 'gentle',
    name: { en: 'Basketball: gentle legs, calves and core', he: 'כדורסל: רגליים, תאומים וליבה בעדינות' },
    description: {
      en: 'No jumping: step jacks, controlled box squats, calf raises, bird-dogs and a plank for leg strength and balance.',
      he: 'ללא קפיצות: פיסוק בצעידה, סקוואט לכיסא בשליטה, הרמות עקבים, בירד דוג ופלאנק לכוח רגליים ושיווי משקל.',
    },
    items: [
      { exerciseId: 'step_jack', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'box_squat', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'standing_calf_raise', sets: 2, reps: [12, 15], restSeconds: 20 },
      { exerciseId: 'bird_dog', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 30, restSeconds: 20 },
    ],
  },

  // -------------------------------------------------------------- Volleyball
  {
    id: 'volleyball_bodyweight',
    sport: 'volleyball',
    variant: 'bodyweight',
    name: { en: 'Volleyball: jump, shoulders and rotation', he: 'כדורעף: קפיצה, כתפיים וסיבוב' },
    description: {
      en: 'Lateral shuffles, jump squats, scapular push-ups, seated twists and swimmers for jump power, shoulder stability and trunk rotation.',
      he: 'צעדים צידיים מהירים, סקוואט קפיצה, שכיבות סמיכה לשכמות, טוויסט רוסי ושחיין בשכיבה לכוח קפיצה, יציבות כתפיים וסיבוב הגו.',
    },
    items: [
      { exerciseId: 'lateral_shuffle', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'jump_squat', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'russian_twist', sets: 2, reps: [10, 12], restSeconds: 10 },
      { exerciseId: 'prone_swimmer', sets: 2, reps: [10, 12], restSeconds: 20 },
    ],
  },
  {
    id: 'volleyball_gear',
    sport: 'volleyball',
    variant: 'gear',
    name: { en: 'Volleyball: shoulder health and rotational power', he: 'כדורעף: בריאות כתפיים וכוח סיבובי' },
    description: {
      en: 'Jump rope, band face pulls, medicine-ball rotational throws, goblet squats and band external rotations for shoulder and trunk strength.',
      he: 'קפיצה בחבל, פייס פול עם גומייה, זריקות סיבוביות עם כדור כוח, גובלט סקוואט וסיבוב חיצוני עם גומייה לכוח כתפיים וליבה.',
    },
    items: [
      { exerciseId: 'jump_rope_skipping', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'band_face_pull', sets: 2, reps: [12, 15], restSeconds: 10 },
      { exerciseId: 'medicine_ball_rotational_throw', sets: 2, reps: [6, 8], restSeconds: 15 },
      { exerciseId: 'goblet_squat', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'band_external_rotation', sets: 2, reps: [10, 12], restSeconds: 10 },
    ],
  },
  {
    id: 'volleyball_gentle',
    sport: 'volleyball',
    variant: 'gentle',
    name: { en: 'Volleyball: gentle shoulders and trunk', he: 'כדורעף: כתפיים וגו בעדינות' },
    description: {
      en: 'Low-impact shoulder and trunk work: shadow boxing, scapular push-ups, squats, heel touches and a side plank.',
      he: 'עבודת כתפיים וגו ללא זעזועים: אגרוף צללים, שכיבות סמיכה לשכמות, סקוואט במשקל גוף, נגיעות עקב לסירוגין ופלאנק צידי.',
    },
    items: [
      { exerciseId: 'shadow_boxing', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'bodyweight_squat', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'heel_touch', sets: 2, reps: [10, 12], restSeconds: 10 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 20 },
    ],
  },

  // ------------------------------------------------------------ Tennis / padel
  {
    id: 'tennis_padel_bodyweight',
    sport: 'tennis_padel',
    variant: 'bodyweight',
    name: { en: 'Tennis and padel: footwork, rotation and shoulders', he: 'טניס ופאדל: תנועת רגליים, סיבוב וכתפיים' },
    description: {
      en: 'Lateral shuffles, side lunges, scapular push-ups, seated twists and a one-leg balance reach for footwork, trunk rotation and shoulder control.',
      he: 'צעדים צידיים מהירים, מכרע צידי, שכיבות סמיכה לשכמות, טוויסט רוסי והושטה על רגל אחת לתנועת רגליים, סיבוב הגו ושליטה בכתף.',
    },
    items: [
      { exerciseId: 'lateral_shuffle', sets: 2, seconds: 40, restSeconds: 15 },
      { exerciseId: 'lateral_lunge', sets: 2, reps: [6, 8], restSeconds: 10 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 15 },
      { exerciseId: 'russian_twist', sets: 2, reps: [10, 12], restSeconds: 10 },
      { exerciseId: 'single_leg_balance_reach', sets: 2, reps: [6, 8], restSeconds: 10 },
    ],
  },
  {
    id: 'tennis_padel_gear',
    sport: 'tennis_padel',
    variant: 'gear',
    name: { en: 'Tennis and padel: rotator cuff, forearms and trunk', he: 'טניס ופאדל: סובבי כתף, אמות וליבה' },
    description: {
      en: 'Medicine-ball rotational throws, banded side walks, wrist curls, band external rotations and a plank for rotation, forearm and shoulder endurance.',
      he: 'זריקות סיבוביות עם כדור כוח, הליכה צדית עם גומייה, כפיפות שורש כף יד, סיבוב חיצוני עם גומייה ופלאנק לסיבולת סיבוב, אמות וכתפיים.',
    },
    items: [
      { exerciseId: 'medicine_ball_rotational_throw', sets: 2, reps: [6, 8], restSeconds: 15 },
      { exerciseId: 'banded_lateral_walk', sets: 2, reps: [10, 12], restSeconds: 10 },
      { exerciseId: 'wrist_curl', sets: 2, reps: [12, 15], restSeconds: 15 },
      { exerciseId: 'band_external_rotation', sets: 2, reps: [10, 12], restSeconds: 10 },
      { exerciseId: 'plank', sets: 2, seconds: 25, restSeconds: 15 },
    ],
  },
  {
    id: 'tennis_padel_gentle',
    sport: 'tennis_padel',
    variant: 'gentle',
    name: { en: 'Tennis and padel: gentle trunk and shoulders', he: 'טניס ופאדל: גו וכתפיים בעדינות' },
    description: {
      en: 'Marching, shadow boxing for arm and trunk rotation, heel touches, scapular push-ups and a push-up hold, all low impact.',
      he: 'צעידה במקום, אגרוף צללים לסיבוב הידיים והגו, נגיעות עקב לסירוגין, שכיבות סמיכה לשכמות והחזקת שכיבת סמיכה, הכול ללא זעזועים.',
    },
    items: [
      { exerciseId: 'march_in_place', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'shadow_boxing', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'heel_touch', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'push_up_hold', sets: 2, seconds: 20, restSeconds: 20 },
    ],
  },
];
