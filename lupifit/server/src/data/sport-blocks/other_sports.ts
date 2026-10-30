import type { SportBlockSeed } from '@shared/content';

export const blocks: SportBlockSeed[] = [
  // ------------------------------------------------------------ surfing
  {
    id: 'surfing_bodyweight',
    sport: 'surfing',
    variant: 'bodyweight',
    name: { en: 'Surfing: paddle endurance and pop-up', he: 'גלישה: סיבולת חתירה וקימה על הלוח' },
    description: {
      en: 'Five stations for the surfer: prone paddle endurance, the pop-up pattern, leg endurance, single-leg balance and a streamline trunk hold.',
      he: 'חמש תחנות לגולש: סיבולת חתירה בשכיבה, תבנית הקימה על הלוח, סיבולת רגליים, שיווי משקל על רגל אחת והחזקת גוף ישר.',
    },
    items: [
      { exerciseId: 'prone_swimmer', sets: 2, reps: [12, 16], restSeconds: 20 },
      { exerciseId: 'pop_up', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'wall_sit', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'single_leg_balance_reach', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'streamline_hold', sets: 2, seconds: 40, restSeconds: 20 },
    ],
  },
  {
    id: 'surfing_gear',
    sport: 'surfing',
    variant: 'gear',
    name: { en: 'Surfing: band paddle and rotation', he: 'גלישה: חתירה עם גומייה וסיבוב גו' },
    description: {
      en: 'Band pulling for paddle strength, rotator cuff endurance, the pop-up pattern, a loaded trunk rotation and a controlled side plank.',
      he: 'משיכות בגומייה לכוח חתירה, סיבולת של השרוול המסובב, תבנית הקימה על הלוח, סיבוב גו עם משקולת ופלאנק צד מבוקר.',
    },
    items: [
      { exerciseId: 'band_straight_arm_pulldown', sets: 2, reps: [12, 15], restSeconds: 20 },
      { exerciseId: 'pop_up', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'band_external_rotation', sets: 2, reps: [12, 15], restSeconds: 20 },
      { exerciseId: 'dumbbell_woodchop', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 20 },
    ],
  },
  {
    id: 'surfing_gentle',
    sport: 'surfing',
    variant: 'gentle',
    name: { en: 'Surfing: gentle paddle and balance', he: 'גלישה: חתירה ושיווי משקל בעדינות' },
    description: {
      en: 'Low impact work for the surfer: scapular control for paddling, a box squat for the stand-up pattern, trunk control and slow marching for balance.',
      he: 'עבודה עדינה לגולש: שליטה בשכמות לחתירה, סקוואט לכיסא לתבנית הקימה, שליטה בגו והליכה במקום איטית לשיווי משקל.',
    },
    items: [
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'box_squat', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'bird_dog', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'march_in_place', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'dead_bug', sets: 2, reps: [8, 10], restSeconds: 20 },
    ],
  },

  // ------------------------------------------------------------ calisthenics
  {
    id: 'calisthenics_bodyweight',
    sport: 'calisthenics',
    variant: 'bodyweight',
    name: { en: 'Calisthenics: skill foundations', he: 'קליסתניקס: בסיס לשליטה בגוף' },
    description: {
      en: 'Floor-based foundations for street workout skills: scapular strength, handstand-lean pushing, crawling, arch and hollow body control.',
      he: 'בסיס על הרצפה לתרגילי סטריט וורקאאוט: כוח שכמות, דחיפה לקראת עמידת ידיים, זחילה ושליטה בקשת ובגוף חלול.',
    },
    items: [
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'pike_push_up', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'bear_crawl', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'hollow_body_hold', sets: 2, seconds: 30, restSeconds: 30 },
    ],
  },
  {
    id: 'calisthenics_gear',
    sport: 'calisthenics',
    variant: 'gear',
    name: { en: 'Calisthenics: pull-up bar basics', he: 'קליסתניקס: יסודות על מתח' },
    description: {
      en: 'Pull-up bar work for street workout: scapular pulls, negatives, hanging knee raises as an L-sit base, balanced by pike pushing, ending in a dead hang.',
      he: 'עבודה על מתח לסטריט וורקאאוט: משיכות שכמות, שליליות, הרמות ברכיים בתלייה כבסיס ל-L-sit, מאוזנות בדחיפת פייק, ובסיום תלייה.',
    },
    items: [
      { exerciseId: 'scapular_pull_up', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'pike_push_up', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'negative_pull_up', sets: 2, reps: [3, 5], restSeconds: 30 },
      { exerciseId: 'hanging_knee_raise', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'dead_hang', sets: 2, seconds: 30, restSeconds: 30 },
    ],
  },
  {
    id: 'calisthenics_gentle',
    sport: 'calisthenics',
    variant: 'gentle',
    name: { en: 'Calisthenics: gentle body control', he: 'קליסתניקס: שליטה בגוף בעדינות' },
    description: {
      en: 'Beginner pushing and trunk control without impact: scapular push-ups, incline push-ups, hollow-style dead bugs, bird dogs and a plank.',
      he: 'דחיפה ושליטה בגו ברמת מתחילים ללא קפיצות: שכיבות סמיכה לשכמות, שכיבות סמיכה בשיפוע, דד באג בסגנון גוף חלול, ציפור-כלב ופלאנק.',
    },
    items: [
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'incline_push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'dead_bug', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'bird_dog', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 20 },
    ],
  },

  // ------------------------------------------------------------ general
  {
    id: 'general_bodyweight',
    sport: 'general',
    variant: 'bodyweight',
    name: { en: 'All-round athlete: agility and power', he: 'ספורטאי רב-תחומי: זריזות וכוח' },
    description: {
      en: 'An all-rounder finisher: lateral footwork, pushing, split-stance power, a pulling-side back exercise and a plank for trunk control.',
      he: 'סיום לספורטאי רב-תחומי: תנועה צדדית, דחיפה, כוח בעמידת פיצול, תרגיל גב מאזן לדחיפה ופלאנק לשליטה בגו.',
    },
    items: [
      { exerciseId: 'lateral_shuffle', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'split_squat_jump', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'prone_t_raise', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 20 },
    ],
  },
  {
    id: 'general_gear',
    sport: 'general',
    variant: 'gear',
    name: { en: 'All-round athlete: strength and push-pull', he: 'ספורטאי רב-תחומי: כוח ודחיפה-משיכה' },
    description: {
      en: 'Kettlebell hip power, band rowing, single-leg strength with dumbbells, push-ups for balance and a plank to finish.',
      he: 'כוח ירכיים עם קטלבל, חתירה בגומייה, כוח רגל אחת עם משקולות, שכיבות סמיכה לאיזון ופלאנק לסיום.',
    },
    items: [
      { exerciseId: 'kettlebell_swing', sets: 2, reps: [10, 15], restSeconds: 20 },
      { exerciseId: 'band_row', sets: 2, reps: [12, 15], restSeconds: 20 },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 40, restSeconds: 20 },
    ],
  },
  {
    id: 'general_gentle',
    sport: 'general',
    variant: 'gentle',
    name: { en: 'All-round athlete: gentle conditioning', he: 'ספורטאי רב-תחומי: כושר בעדינות' },
    description: {
      en: 'Low impact all-round work: step jacks for conditioning, squats, incline push-ups, glute bridge marches and a side plank.',
      he: 'עבודה עדינה לכל הגוף: ג׳ק בצעדים לכושר, סקוואט, שכיבות סמיכה בשיפוע, צעידות בגשר ישבן ופלאנק צד.',
    },
    items: [
      { exerciseId: 'step_jack', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'bodyweight_squat', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'incline_push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'glute_bridge_march', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 20 },
    ],
  },
];
