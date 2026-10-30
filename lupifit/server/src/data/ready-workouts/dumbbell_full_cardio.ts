import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Dumbbell full-body and cardio ready workouts: full_body 6, cardio 2.
 * Mode `weights`. Cardio sessions are advanced because the only dumbbell conditioning move is the man maker.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ Full body
  {
    id: 'full_body_dumbbell_starter_no_bench',
    name: { en: 'Dumbbell Starter, No Bench', he: 'התחלה עם משקולות יד, בלי ספסל' },
    description: {
      en: 'A first full-body session with one pair of dumbbells and a floor. A squat, a floor press, a row, a hinge, an overhead press and a dead bug, all in straight sets with easy rest.',
      he: 'אימון גוף מלא ראשון עם זוג משקולות יד ורצפה בלבד: סקוואט, לחיצת רצפה, חתירה, כפיפת ירך, לחיצה מעל הראש ודד באג. סטים רגילים עם מנוחה נוחה.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'goblet_squat', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Hold the dumbbell at the chest, knees follow the toes.', he: 'המשקולת צמודה לחזה, הברכיים בכיוון האצבעות.' },
      },
      { exerciseId: 'dumbbell_floor_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'bent_over_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Flat back, pull the elbows toward the hips.', he: 'גב ישר, למשוך את המרפקים לכיוון הירכיים.' },
      },
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 2, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_shoulder_press', sets: 2, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dead_bug', sets: 2, reps: [8, 10], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_dumbbell_bench_basics',
    name: { en: 'Bench and Dumbbell Basics', he: 'יסודות עם ספסל ומשקולות' },
    description: {
      en: 'A beginner full-body session that uses a bench: a wide-stance squat, a bench press, a chest-supported row, a hip thrust and a short plank. Three sets or fewer, steady pace.',
      he: 'אימון גוף מלא למתחילים עם ספסל: סקוואט רחב, לחיצת חזה על ספסל, חתירה עם תמיכה בחזה, דחיפת ירכיים ופלאנק קצר. עד שלושה סטים, בקצב יציב.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_sumo_squat', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_bench_press', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Lower slowly to the chest line, press without locking hard.', he: 'להוריד לאט עד קו החזה, ללחוץ בלי נעילה חזקה.' },
      },
      { exerciseId: 'chest_supported_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_hip_thrust', sets: 3, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'plank', sets: 2, seconds: 30, restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_dumbbell_push_pull_squat',
    name: { en: 'Front Squat and Renegade Row', he: 'סקוואט קדמי וחתירת רנגייד' },
    description: {
      en: 'An intermediate full-body session built on a front squat, a push press and a renegade row, with a single-leg hinge and a side plank dip to finish. Straight sets with moderate rest.',
      he: 'אימון גוף מלא בינוני סביב סקוואט קדמי, לחיצת דחיפה וחתירת רנגייד, עם כפיפת ירך על רגל אחת ופלאנק צידי עם הורדת אגן לסיום. סטים רגילים עם מנוחה בינונית.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_front_squat', sets: 4, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Elbows high, dumbbells on the shoulders, chest tall.', he: 'מרפקים גבוהים, המשקולות על הכתפיים, חזה זקוף.' },
      },
      { exerciseId: 'dumbbell_push_press', sets: 3, reps: [8, 10], restSeconds: 75 },
      {
        exerciseId: 'renegade_row', sets: 3, reps: [6, 8], restSeconds: 75,
        cue: { en: 'Feet wide, hips level, do not rotate.', he: 'רגליים רחבות, אגן ישר, בלי להסתובב.' },
      },
      { exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'side_plank_hip_dip', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_dumbbell_lunge_arnold_row',
    name: { en: 'Lunge, Arnold and Row Mix', he: 'שילוב לאנג׳, ארנולד וחתירה' },
    description: {
      en: 'An intermediate full-body mix: walking lunges, an Arnold press, a one-arm row on a bench, good mornings, shoulder-tap push-ups and hollow rocks. Three sets each, brisk rest.',
      he: 'שילוב גוף מלא בינוני: לאנג׳ הליכה, לחיצת ארנולד, חתירה ביד אחת על ספסל, גוד מורנינג, שכיבות סמיכה עם נגיעת כתף והולו רוק. שלושה סטים לכל תרגיל, מנוחה קצרה.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_walking_lunge', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'arnold_press', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'one_arm_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_good_morning', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Push the hips back, soft knees, back stays long.', he: 'לדחוף את האגן אחורה, ברכיים רכות, הגב נשאר ארוך.' },
      },
      { exerciseId: 'push_up_shoulder_tap', sets: 3, reps: [10, 14], restSeconds: 45 },
      { exerciseId: 'hollow_rock', sets: 3, reps: [10, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_dumbbell_clean_split_squat_carry',
    name: { en: 'Clean, Split Squat and Suitcase Carry', he: 'קלין, סקוואט בולגרי והליכת מזוודה' },
    description: {
      en: 'An intermediate full-body session that starts with dumbbell cleans, then Bulgarian split squats, rows and incline presses, and ends with a one-sided suitcase carry. Needs a bench and floor space.',
      he: 'אימון גוף מלא בינוני שפותח בקלין ולחיצה עם משקולות, ממשיך בסקוואט בולגרי מפוצל, חתירה ולחיצה בשיפוע חיובי, ומסתיים בהליכת מזוודה על צד אחד. דורש ספסל ומקום פנוי.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_clean_and_press', sets: 4, reps: [6, 8], restSeconds: 90,
        cue: { en: 'Drive with the legs, keep the dumbbells close to the body.', he: 'להניע מהרגליים, המשקולות קרובות לגוף.' },
      },
      { exerciseId: 'dumbbell_bulgarian_split_squat', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'bent_over_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'incline_dumbbell_press', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'suitcase_carry', sets: 3, seconds: 40, restSeconds: 60 },
    ],
  },
  {
    id: 'full_body_dumbbell_man_maker_strength',
    name: { en: 'Man Maker Strength Day', he: 'יום כוח עם מן מייקר' },
    description: {
      en: 'An advanced full-body session: man makers while fresh, heavy front squats, renegade rows, archer push-ups, single-leg hinges and floor wipers. Longer rest between demanding sets.',
      he: 'אימון גוף מלא מתקדם: מן מייקר בתחילת האימון, סקוואט קדמי כבד, חתירת רנגייד, שכיבות סמיכה קשת, כפיפת ירך על רגל אחת ומגבי שמשה בשכיבה. מנוחה ארוכה בין סטים תובעניים.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_man_maker', sets: 4, reps: [5, 6], restSeconds: 105,
        cue: { en: 'Use a light pair and keep every rep clean.', he: 'לבחור משקולות קלות ולשמור על כל חזרה נקייה.' },
      },
      { exerciseId: 'dumbbell_front_squat', sets: 4, reps: [6, 8], restSeconds: 90 },
      { exerciseId: 'renegade_row', sets: 4, reps: [6, 8], restSeconds: 90 },
      { exerciseId: 'archer_push_up', sets: 3, reps: [5, 8], restSeconds: 75 },
      { exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 3, reps: [6, 8], restSeconds: 75 },
      { exerciseId: 'windshield_wiper_floor', sets: 3, reps: [6, 10], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Cardio
  {
    id: 'cardio_dumbbell_man_maker_rounds',
    name: { en: 'Man Maker Power Rounds', he: 'סבבי כוח עם מן מייקר' },
    description: {
      en: 'An advanced conditioning session that mixes loaded full-body lifts with burpees, mountain climbers and tuck jumps. Each exercise is done as straight sets with short rest. Keep the dumbbells light.',
      he: 'אימון כושר מתקדם שמשלב הרמות גוף מלא עם משקולות, ברפי, מטפס הרים וקפיצות ברכיים לחזה. כל תרגיל בסטים רגילים עם מנוחה קצרה. לבחור משקולות קלות.',
    },
    focus: 'cardio',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_man_maker', sets: 4, reps: [5, 6], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_thruster', sets: 4, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Squat deep and press in one flowing movement.', he: 'לרדת עמוק וללחוץ בתנועה אחת רציפה.' },
      },
      { exerciseId: 'burpee', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dumbbell_snatch', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'mountain_climber', sets: 3, seconds: 40, restSeconds: 30 },
      { exerciseId: 'tuck_jump', sets: 3, reps: [8, 10], restSeconds: 45 },
    ],
  },
  {
    id: 'cardio_dumbbell_sprint_and_clean_intervals',
    name: { en: 'Sprint and Clean Intervals', he: 'אינטרוולים של ספרינט וקלין' },
    description: {
      en: 'An advanced interval session that mixes heavy-breathing work with loaded lifts: man makers, clean and presses, front squats, sprints, split squat jumps and bear crawls. Needs open space to run.',
      he: 'אימון אינטרוולים מתקדם שמשלב עבודה נשימתית עם הרמות במשקולות: מן מייקר, קלין ולחיצה, סקוואט קדמי, ספרינטים, קפיצות ספליט סקוואט וזחילת דוב. דורש מקום פנוי לריצה.',
    },
    focus: 'cardio',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_man_maker', sets: 3, reps: [5, 6], restSeconds: 75 },
      { exerciseId: 'dumbbell_clean_and_press', sets: 4, reps: [6, 8], restSeconds: 60 },
      { exerciseId: 'dumbbell_front_squat', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'sprint_intervals', sets: 5, seconds: 20, restSeconds: 40,
        cue: { en: 'Run at a hard but controlled effort, walk to recover.', he: 'לרוץ במאמץ גבוה אך מבוקר, ללכת להתאוששות.' },
      },
      { exerciseId: 'split_squat_jump', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'bear_crawl', sets: 3, seconds: 30, restSeconds: 45 },
    ],
  },
];
