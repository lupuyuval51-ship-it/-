import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Dumbbell upper-body ready workouts: chest 4, back 3, shoulders 4, biceps 3, triceps 2, arms 3, upper body 4.
 * Mode `weights`. The gear is dumbbells, optionally with a bench; a few sessions also use a pull-up bar. That gear is
 * found at the gym, at home and in a park, so every session lists all three places.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ Chest
  {
    id: 'chest_dumbbell_floor_starter',
    name: { en: 'Floor Press Chest Starter', he: 'התחלה בחזה מהרצפה' },
    description: {
      en: 'A bench-free first chest session: floor press, squeeze press and floor fly with dumbbells, then incline push-ups and a short halfway hold. Straight sets, moderate loads.',
      he: 'אימון חזה ראשון בלי ספסל: לחיצה מהרצפה, לחיצה בהצמדת משקולות ופרפר על הרצפה, ואחר כך שכיבות סמיכה בידיים מוגבהות והחזקה קצרה. סטים רגילים ומשקל בינוני.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_floor_press', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Elbows about 45 degrees from the body; pause lightly when the upper arms touch the floor.', he: 'מרפקים בזווית של כ-45 מעלות מהגוף; להשהות קלות כשהזרועות העליונות נוגעות ברצפה.' },
      },
      { exerciseId: 'dumbbell_squeeze_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_floor_fly', sets: 2, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Soft elbows; lower only until the upper arms touch the floor.', he: 'מרפקים כפופים מעט; להוריד רק עד שהזרועות העליונות נוגעות ברצפה.' },
      },
      {
        exerciseId: 'incline_push_up', sets: 3, reps: [8, 12], restSeconds: 45,
        cue: { en: 'Hands on a bench or sturdy table, body in one straight line.', he: 'ידיים על ספסל או שולחן יציב, הגוף בקו ישר.' },
      },
      { exerciseId: 'push_up_hold', sets: 2, seconds: 20, restSeconds: 45 },
    ],
  },
  {
    id: 'chest_dumbbell_bench_builder',
    name: { en: 'Dumbbell Chest Builder', he: 'בניית חזה במשקולות' },
    description: {
      en: 'Classic bench chest work: an incline press and a flat press, decline push-ups, then a fly and a pullover for the stretch. Straight sets, mostly 8-12 reps, with 60-75 s rest. Needs a bench.',
      he: 'עבודת חזה קלאסית על ספסל: לחיצה בשיפוע חיובי ולחיצה שטוחה, שכיבות סמיכה ברגליים מוגבהות, ואז פרפר ופולאובר למתיחת החזה. סטים רגילים, בעיקר של 8-12 חזרות, עם מנוחה של 60-75 שניות. דורש ספסל.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'incline_dumbbell_press', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Bench at a low incline (about 30 degrees); press up and slightly together.', he: 'ספסל בשיפוע קל (כ-30 מעלות); ללחוץ למעלה ומעט פנימה.' },
      },
      { exerciseId: 'dumbbell_bench_press', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'decline_push_up', sets: 3, reps: [10, 15], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_fly', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Wide arc with soft elbows; stop when you feel a stretch, not a strain.', he: 'קשת רחבה עם מרפקים כפופים מעט; לעצור כשיש מתיחה ולא כאב.' },
      },
      {
        exerciseId: 'dumbbell_pullover', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Arms nearly straight; lower only as far as the shoulders comfortably allow.', he: 'זרועות כמעט ישרות; להוריד רק עד הטווח שהכתפיים מאפשרות בנוחות.' },
      },
    ],
  },
  {
    id: 'chest_dumbbell_power_push',
    name: { en: 'Power Push and Floor Press', he: 'דחיפה מתפרצת ולחיצה מהרצפה' },
    description: {
      en: 'Starts fresh with explosive push-ups, then a heavier floor press, Hindu push-ups, a squeeze press and a floor fly. No bench needed. Longer rests on the big lifts, short rests at the end.',
      he: 'פותחים עם שכיבות סמיכה מתפרצות כשהגוף רענן, ואז לחיצה כבדה יותר מהרצפה, שכיבות סמיכה הינדיות, לחיצה בהצמדה ופרפר על הרצפה. בלי ספסל. מנוחה ארוכה בתרגילים הגדולים וקצרה בסוף.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'explosive_push_up', sets: 4, reps: [5, 8], restSeconds: 75,
        cue: { en: 'Push fast enough for the hands to leave the floor slightly; land with soft elbows.', he: 'לדחוף מהר מספיק כדי שהידיים יתרוממו מעט מהרצפה; לנחות עם מרפקים כפופים.' },
      },
      { exerciseId: 'dumbbell_floor_press', sets: 4, reps: [8, 10], restSeconds: 90 },
      { exerciseId: 'hindu_push_up', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_squeeze_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_floor_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'chest_dumbbell_heavy_archer',
    name: { en: 'Heavy Dumbbell Chest Day', he: 'יום חזה כבד במשקולות יד' },
    description: {
      en: 'Advanced strength work: a heavy bench press, archer push-ups, a squeeze press, then a pullover and a floor fly. Long rests; keep every rep controlled and stop a rep or two short of failure.',
      he: 'עבודת כוח למתקדמים: לחיצת חזה כבדה על ספסל, שכיבות סמיכה קשת (ארצ׳ר), לחיצה בהצמדה, ואז פולאובר ופרפר על הרצפה. מנוחות ארוכות; כל חזרה מבוקרת ולעצור חזרה או שתיים לפני כישלון.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_bench_press', sets: 5, reps: [6, 8], restSeconds: 105,
        cue: { en: 'Pick a load that leaves a rep or two in reserve on every set.', he: 'לבחור משקל שמשאיר חזרה או שתיים בעתודה בכל סט.' },
      },
      {
        exerciseId: 'archer_push_up', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Lower toward the working hand while the other arm stays straight; reps are per side.', he: 'לרדת לכיוון היד העובדת כשהיד השנייה נשארת ישרה; החזרות הן לכל צד.' },
      },
      { exerciseId: 'dumbbell_squeeze_press', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'dumbbell_pullover', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'dumbbell_floor_fly', sets: 3, reps: [10, 12], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Back
  {
    id: 'back_dumbbell_row_basics',
    name: { en: 'Dumbbell Row Basics', he: 'יסודות חתירה במשקולות' },
    description: {
      en: 'A first back session built on two rows, a rear-delt fly, shrugs and a floor superman. Straight sets with light-to-moderate dumbbells. A bench or sturdy chair supports the one-arm row.',
      he: 'אימון גב ראשון שמבוסס על שתי חתירות, פרפר הפוך, הרמות כתפיים וסופרמן על הרצפה. סטים רגילים עם משקולות קלות עד בינוניות. לחתירה החד-ידית אפשר להשתמש בספסל או בכיסא יציב.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'bent_over_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Hinge at the hips with a flat back and pull the elbows toward the hips.', he: 'להישען קדימה מהירכיים עם גב ישר ולמשוך את המרפקים לכיוון הירכיים.' },
      },
      {
        exerciseId: 'one_arm_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Hand and knee on the bench, back level; lift the dumbbell without twisting.', he: 'יד וברך על הספסל, גב ישר; להרים את המשקולת בלי לסובב את הגו.' },
      },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_shrug', sets: 2, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 30,
        cue: { en: 'Lift slowly, pause for a second at the top and keep the neck long.', he: 'להרים לאט, להשהות שנייה למעלה ולשמור על צוואר ארוך.' },
      },
    ],
  },
  {
    id: 'back_dumbbell_pullover_carry',
    name: { en: 'Back Builder with Pullover', he: 'בניית גב עם פולאובר' },
    description: {
      en: 'Heavier back volume: chest-supported rows, renegade rows, a lat-focused pullover, Y raises and a farmer carry. 3-4 sets, mostly 8-12 reps, with 45-75 s rests. Needs a bench.',
      he: 'נפח גב גבוה יותר: חתירה בתמיכת חזה, חתירת רנגייד, פולאובר לגב הרחב, הרמות Y והליכת חקלאי. 3-4 סטים, בעיקר של 8-12 חזרות, עם מנוחה של 45-75 שניות. דורש ספסל.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'chest_supported_dumbbell_row', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Chest on the bench; pull the elbows back and squeeze the shoulder blades together.', he: 'החזה על הספסל; למשוך את המרפקים לאחור ולהצמיד את השכמות.' },
      },
      {
        exerciseId: 'renegade_row', sets: 3, reps: [6, 10], restSeconds: 75,
        cue: { en: 'Feet wide, hips level; row without letting the body rotate.', he: 'רגליים בפיסוק רחב, אגן ישר; לחתור בלי לסובב את הגוף.' },
      },
      { exerciseId: 'dumbbell_pullover', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_y_raise', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Light dumbbells; hinge forward and lift the arms diagonally into a Y.', he: 'משקולות קלות; להישען קדימה ולהרים את הזרועות באלכסון לצורת Y.' },
      },
      { exerciseId: 'farmer_carry', sets: 3, seconds: 40, restSeconds: 45 },
    ],
  },
  {
    id: 'back_dumbbell_archer_pull_ups',
    name: { en: 'Archer Pull-Ups and Heavy Rows', he: 'מתח ארצ׳ר וחתירות כבדות' },
    description: {
      en: 'An advanced pulling session: archer and wide-grip pull-ups on a bar, heavy dumbbell rows, a rear-delt fly and a dead hang to finish. Needs a pull-up bar and a bench.',
      he: 'אימון משיכות למתקדמים: עליות מתח ארצ׳ר ובאחיזה רחבה על מוט, חתירות כבדות במשקולות, פרפר הפוך ותלייה לסיום. דורש מוט מתח וספסל.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'archer_pull_up', sets: 4, reps: [4, 6], restSeconds: 90,
        cue: { en: 'Pull toward one hand while the other arm stays straight; reps are per side.', he: 'למשוך לכיוון יד אחת כשהיד השנייה נשארת ישרה; החזרות הן לכל צד.' },
      },
      { exerciseId: 'wide_grip_pull_up', sets: 3, reps: [6, 10], restSeconds: 90 },
      {
        exerciseId: 'bent_over_dumbbell_row', sets: 4, reps: [6, 8], restSeconds: 90,
        cue: { en: 'Flat back and no swinging: use a weight you can pull to the ribs under control.', he: 'גב ישר ובלי נדנוד: משקל שאפשר למשוך לצלעות בשליטה.' },
      },
      { exerciseId: 'one_arm_dumbbell_row', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dead_hang', sets: 2, seconds: 30, restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Shoulders
  {
    id: 'shoulders_dumbbell_press_raise_basics',
    name: { en: 'Press and Raise Shoulder Basics', he: 'יסודות כתפיים: לחיצה והרמות' },
    description: {
      en: 'A beginner shoulder session covering the front, side and rear of the shoulder: a press, side and front raises, a rear-delt fly and scapular push-ups. Light dumbbells, 2-3 sets.',
      he: 'אימון כתפיים למתחילים שמכסה את החלק הקדמי, הצדדי והאחורי של הכתף: לחיצה, הרחקות והרמות קדמיות, פרפר הפוך ושכיבות סמיכה לשכמות. משקולות קלות, 2-3 סטים.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Ribs down and glutes tight; press straight up without leaning back.', he: 'צלעות למטה וישבן מכווץ; ללחוץ ישר למעלה בלי להישען אחורה.' },
      },
      {
        exerciseId: 'dumbbell_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Lift to shoulder height with a slight bend in the elbows; no swinging.', he: 'להרים עד גובה הכתפיים עם כפיפה קלה במרפקים, בלי נדנוד.' },
      },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_front_raise', sets: 2, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Arms stay straight; only the shoulder blades move apart and together.', he: 'הזרועות נשארות ישרות; רק השכמות נעות - מתרחקות ומתקרבות.' },
      },
    ],
  },
  {
    id: 'shoulders_dumbbell_arnold_day',
    name: { en: 'Arnold Press Shoulder Day', he: 'יום כתפיים עם לחיצת ארנולד' },
    description: {
      en: 'One rotating press followed by raises for the side, rear and upper-trap areas. Moderate loads, 3-4 sets of 8-15 reps, 45-75 s rests. Dumbbells only, no bench.',
      he: 'לחיצה מסתובבת אחת ואחריה הרמות לצד, לאחור ולטרפז העליון. משקל בינוני, 3-4 סטים של 8-15 חזרות עם מנוחה של 45-75 שניות. משקולות בלבד, בלי ספסל.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'arnold_press', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Rotate the palms smoothly as you press; lower under control.', he: 'לסובב את כפות הידיים בצורה חלקה תוך כדי הלחיצה; להוריד בשליטה.' },
      },
      { exerciseId: 'dumbbell_lateral_raise', sets: 4, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'dumbbell_y_raise', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Hinge forward and lift the arms diagonally into a Y; keep the neck relaxed.', he: 'להישען קדימה ולהרים את הזרועות באלכסון לצורת Y; הצוואר רפוי.' },
      },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_shrug', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'shoulders_dumbbell_push_press_pike',
    name: { en: 'Push Press and Pike Push-Ups', he: 'פוש פרס ושכיבות סמיכה פייק' },
    description: {
      en: 'Two compound presses first, while fresh: a leg-assisted dumbbell push press and pike push-ups. Then upright rows and short-rest front and side raises to finish. Dumbbells only.',
      he: 'שני תרגילי לחיצה מורכבים בהתחלה כשהגוף רענן: פוש פרס עם עזרה מהרגליים ושכיבות סמיכה פייק. אחר כך חתירה אנכית והרמות קדמיות וצדדיות עם מנוחה קצרה. משקולות בלבד.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_push_press', sets: 4, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Dip slightly through the knees, then drive with the legs and press; lower under control.', he: 'לרדת מעט בברכיים, ואז לדחוף עם הרגליים וללחוץ; להוריד בשליטה.' },
      },
      {
        exerciseId: 'pike_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Hips high in an inverted V; lower the top of the head toward the floor between the hands.', he: 'אגן גבוה בצורת V הפוכה; להוריד את קודקוד הראש אל הרצפה בין הידיים.' },
      },
      {
        exerciseId: 'dumbbell_upright_row', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Pull the elbows up only to shoulder height; stop if the shoulders pinch.', he: 'למשוך את המרפקים רק עד גובה הכתפיים; לעצור אם יש צביטה בכתף.' },
      },
      { exerciseId: 'dumbbell_front_raise', sets: 3, reps: [10, 12], restSeconds: 30 },
      { exerciseId: 'dumbbell_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'shoulders_dumbbell_handstand_strength',
    name: { en: 'Handstand Push-Up Shoulder Strength', he: 'כוח כתפיים עם שכיבות סמיכה בעמידת ידיים' },
    description: {
      en: 'Advanced shoulder strength: wall handstand push-ups while fresh, a heavy dumbbell press, upright rows, lateral raises and shrugs. Needs a free wall; keep a rep or two in reserve.',
      he: 'כוח כתפיים למתקדמים: שכיבות סמיכה בעמידת ידיים על הקיר כשהגוף רענן, לחיצה כבדה במשקולות, חתירה אנכית, הרחקות לצדדים והרמות כתפיים. דורש קיר פנוי; להשאיר חזרה או שתיים בעתודה.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'wall_handstand_push_up', sets: 4, reps: [4, 8], restSeconds: 105,
        cue: { en: 'Clear wall and a mat under the head; stop any rep that feels unstable.', he: 'קיר פנוי ומזרן מתחת לראש; לעצור כל חזרה שמרגישה לא יציבה.' },
      },
      {
        exerciseId: 'dumbbell_shoulder_press', sets: 4, reps: [6, 8], restSeconds: 90,
        cue: { en: 'Heavy but strict: no leg drive and no arching of the lower back.', he: 'כבד אבל מדויק: בלי עזרה מהרגליים ובלי קימור של הגב התחתון.' },
      },
      { exerciseId: 'dumbbell_upright_row', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'dumbbell_lateral_raise', sets: 4, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_shrug', sets: 3, reps: [10, 12], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Biceps
  {
    id: 'biceps_dumbbell_curl_basics',
    name: { en: 'Dumbbell Curl Basics', he: 'יסודות כפיפות מרפקים' },
    description: {
      en: 'A beginner biceps session: standard, hammer and concentration curls plus wrist curls for the forearms. Straight sets, light-to-moderate dumbbells, slow lowering.',
      he: 'אימון דו-ראשי למתחילים: כפיפות מרפקים רגילות, פטישים וכפיפות ריכוז, ובנוסף כפיפות שורשי כפות הידיים לאמות. סטים רגילים, משקולות קלות עד בינוניות והורדה איטית.',
    },
    focus: 'biceps',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_curl', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Elbows stay beside the ribs; lower for about three seconds.', he: 'המרפקים נשארים ליד הצלעות; להוריד במשך כשלוש שניות.' },
      },
      { exerciseId: 'hammer_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'concentration_curl', sets: 2, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Elbow braced on the inner thigh; no swinging of the torso.', he: 'המרפק נשען על הירך הפנימית; בלי נדנוד של הגו.' },
      },
      { exerciseId: 'wrist_curl', sets: 2, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'biceps_dumbbell_incline_zottman',
    name: { en: 'Incline and Zottman Curls', he: 'כפיפות על ספסל משופע וזוטמן' },
    description: {
      en: 'Longer-range biceps work: incline curls for the stretch, Zottman curls for biceps and forearms, cross-body hammer curls and a lighter finisher, then a farmer carry for grip. Needs a bench.',
      he: 'עבודה בטווח ארוך לדו-ראשי: כפיפות על ספסל משופע למתיחה, זוטמן לדו-ראשי ולאמות, פטיש חוצה גוף וגמר קל יותר, ובסוף הליכת חקלאי לאחיזה. דורש ספסל.',
    },
    focus: 'biceps',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'incline_dumbbell_curl', sets: 4, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Arms hang straight down from a bench at about 60 degrees; curl without moving the elbows forward.', he: 'הזרועות תלויות ישר למטה מספסל בשיפוע של כ-60 מעלות; לכופף בלי להזיז את המרפקים קדימה.' },
      },
      {
        exerciseId: 'zottman_curl', sets: 4, reps: [8, 10], restSeconds: 60,
        cue: { en: 'Curl with palms up, turn the palms down at the top and lower slowly.', he: 'לכופף עם כפות הידיים למעלה, להפוך אותן כלפי מטה בחלק העליון ולהוריד לאט.' },
      },
      { exerciseId: 'cross_body_hammer_curl', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dumbbell_curl', sets: 3, reps: [12, 15], restSeconds: 30 },
      { exerciseId: 'farmer_carry', sets: 3, seconds: 40, restSeconds: 45 },
    ],
  },
  {
    id: 'biceps_dumbbell_chin_up_strength',
    name: { en: 'Chin-Up and Hammer Strength', he: 'כוח: מתח באחיזה הפוכה ופטישים' },
    description: {
      en: 'Heavier biceps work: chin-ups first while fresh, then hammer, incline and concentration curls, finishing with a dead hang for grip. Needs a pull-up bar and a bench.',
      he: 'עבודה כבדה יותר לדו-ראשי: עליות מתח באחיזה הפוכה בהתחלה כשהגוף רענן, ואחר כך פטישים, כפיפות על ספסל משופע וכפיפות ריכוז, ובסוף תלייה לאחיזה. דורש מוט מתח וספסל.',
    },
    focus: 'biceps',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'chin_up', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Start from a full hang, pull the chest toward the bar and lower for three seconds.', he: 'להתחיל מתלייה מלאה, למשוך את החזה אל המוט ולהוריד בשלוש שניות.' },
      },
      { exerciseId: 'hammer_curl', sets: 4, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'incline_dumbbell_curl', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'concentration_curl', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dead_hang', sets: 2, seconds: 30, restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Triceps
  {
    id: 'triceps_dumbbell_basics',
    name: { en: 'Triceps Basics with Dumbbells', he: 'יסודות תלת-ראשי עם משקולות' },
    description: {
      en: 'A beginner triceps session: a tucked-elbow floor press and close-grip push-ups, then overhead extensions, bench dips and kickbacks. 2-3 sets, moderate loads. A bench or sturdy chair is used for the dips.',
      he: 'אימון תלת-ראשי למתחילים: לחיצה מהרצפה עם מרפקים צמודים ושכיבות סמיכה באחיזה צרה, ואחר כך פשיטות מעל הראש, מקבילים על ספסל וקיקבק. 2-3 סטים ומשקל בינוני. למקבילים אפשר להשתמש בספסל או בכיסא יציב.',
    },
    focus: 'triceps',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_floor_press', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Elbows tucked about 45 degrees from the body, so the triceps share the work.', he: 'מרפקים צמודים בזווית של כ-45 מעלות מהגוף, כך שהתלת-ראשי משתתף בעבודה.' },
      },
      { exerciseId: 'close_grip_push_up', sets: 3, reps: [8, 12], restSeconds: 45 },
      {
        exerciseId: 'overhead_dumbbell_triceps_extension', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Elbows point forward and stay close to the head; lower behind the head under control.', he: 'המרפקים מצביעים קדימה וקרובים לראש; להוריד מאחורי הראש בשליטה.' },
      },
      {
        exerciseId: 'bench_dip', sets: 2, reps: [8, 12], restSeconds: 45,
        cue: { en: 'Knees bent and hips close to the bench; stop at a depth that feels comfortable for the shoulders.', he: 'ברכיים כפופות והאגן קרוב לספסל; לעצור בעומק שנוח לכתפיים.' },
      },
      { exerciseId: 'dumbbell_kickback', sets: 2, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'triceps_dumbbell_skull_crusher_diamond',
    name: { en: 'Skull Crusher and Diamond Triceps', he: 'סקאל קראשר ויהלום לתלת-ראשי' },
    description: {
      en: 'Intermediate triceps volume: diamond push-ups, skull crushers, pike push-ups, overhead extensions and short-rest kickbacks. Needs a bench for the skull crushers.',
      he: 'נפח לתלת-ראשי ברמה בינונית: שכיבות סמיכה יהלום, סקאל קראשר, שכיבות סמיכה פייק, פשיטות מעל הראש וקיקבק עם מנוחה קצרה. הסקאל קראשר דורש ספסל.',
    },
    focus: 'triceps',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'diamond_push_up', sets: 4, reps: [10, 15], restSeconds: 60,
        cue: { en: 'Elbows brush the ribs; drop to the knees if the form breaks down.', he: 'המרפקים מתחככים בצלעות; לרדת לברכיים אם הטכניקה מתפרקת.' },
      },
      {
        exerciseId: 'dumbbell_skull_crusher', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Lower the dumbbells beside the head with the upper arms fixed; stop if the elbows feel strained.', he: 'להוריד את המשקולות לצדי הראש כשהזרועות העליונות קבועות; לעצור אם המרפקים מרגישים מתח כואב.' },
      },
      { exerciseId: 'pike_push_up', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'overhead_dumbbell_triceps_extension', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_kickback', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },

  // ------------------------------------------------------------------ Arms
  {
    id: 'arms_dumbbell_alternating_basics',
    name: { en: 'Alternating Arms Basics', he: 'יסודות ידיים לסירוגין' },
    description: {
      en: 'A beginner arm session that mixes biceps and triceps work: curls, overhead extensions, hammer curls, kickbacks and close-grip push-ups. 2-3 sets with light-to-moderate dumbbells.',
      he: 'אימון ידיים למתחילים שמשלב עבודה לדו-ראשי ולתלת-ראשי: כפיפות, פשיטות מעל הראש, פטישים, קיקבק ושכיבות סמיכה באחיזה צרה. 2-3 סטים עם משקולות קלות עד בינוניות.',
    },
    focus: 'arms',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_curl', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Elbows stay beside the ribs on every curl.', he: 'המרפקים נשארים ליד הצלעות בכל כפיפה.' },
      },
      { exerciseId: 'overhead_dumbbell_triceps_extension', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'hammer_curl', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dumbbell_kickback', sets: 2, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'close_grip_push_up', sets: 2, reps: [8, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'arms_dumbbell_incline_skull_crusher',
    name: { en: 'Incline Curl and Skull Crusher Arms', he: 'ידיים: כפיפה משופעת וסקאל קראשר' },
    description: {
      en: 'Alternates triceps and biceps work: diamond push-ups, incline curls, skull crushers and cross-body hammer curls, finished with wrist curls. 2-3 sets of 8-15 reps with 30-60 s rests. Needs a bench.',
      he: 'מתחלף בין עבודה לתלת-ראשי ולדו-ראשי: שכיבות סמיכה יהלום, כפיפות על ספסל משופע, סקאל קראשר ופטיש חוצה גוף, ובסוף כפיפות שורשי כפות הידיים. 2-3 סטים של 8-15 חזרות עם מנוחה של 30-60 שניות. דורש ספסל.',
    },
    focus: 'arms',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'diamond_push_up', sets: 3, reps: [10, 15], restSeconds: 60 },
      {
        exerciseId: 'incline_dumbbell_curl', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Let the arms hang fully at the bottom, then curl without swinging.', he: 'לתת לזרועות לתלות עד הסוף למטה, ואז לכופף בלי נדנוד.' },
      },
      {
        exerciseId: 'dumbbell_skull_crusher', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Upper arms stay still; only the elbows bend.', he: 'הזרועות העליונות נשארות במקום; רק המרפקים מתכופפים.' },
      },
      { exerciseId: 'cross_body_hammer_curl', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'wrist_curl', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'arms_dumbbell_chin_up_floor_press',
    name: { en: 'Chin-Up and Floor Press Arms', he: 'ידיים: מתח באחיזה הפוכה ולחיצה מהרצפה' },
    description: {
      en: 'Heavier arm work built on compound lifts: chin-ups and a tucked floor press first, then Zottman curls, bench dips, concentration curls and overhead extensions. Needs a pull-up bar and a bench.',
      he: 'עבודת ידיים כבדה יותר שמתחילה בתרגילים מורכבים: עליות מתח באחיזה הפוכה ולחיצה מהרצפה עם מרפקים צמודים, ואחר כך זוטמן, מקבילים על ספסל, כפיפות ריכוז ופשיטות מעל הראש. דורש מוט מתח וספסל.',
    },
    focus: 'arms',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'chin_up', sets: 3, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Start from a full hang and lower for three seconds on every rep.', he: 'להתחיל מתלייה מלאה ולהוריד בשלוש שניות בכל חזרה.' },
      },
      { exerciseId: 'dumbbell_floor_press', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'zottman_curl', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'bench_dip', sets: 3, reps: [10, 15], restSeconds: 60 },
      { exerciseId: 'concentration_curl', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'overhead_dumbbell_triceps_extension', sets: 3, reps: [8, 10], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Upper body
  {
    id: 'upper_body_dumbbell_push_pull_basics',
    name: { en: 'Dumbbell Push-Pull Basics', he: 'יסודות דחיפה ומשיכה במשקולות' },
    description: {
      en: 'A balanced beginner upper-body session: floor press and shoulder press for pushing, bent-over rows and a rear-delt fly for pulling, plus a prone Y raise for the upper back. No bench needed.',
      he: 'אימון פלג גוף עליון מאוזן למתחילים: לחיצה מהרצפה ולחיצת כתפיים לדחיפה, חתירה בהטיית גו ופרפר הפוך למשיכה, והרמת Y בשכיבה על הבטן לגב העליון. בלי ספסל.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_floor_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'bent_over_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Flat back; pull the elbows past the ribs and lower slowly.', he: 'גב ישר; למשוך את המרפקים אל מעבר לצלעות ולהוריד לאט.' },
      },
      { exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'rear_delt_fly', sets: 2, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'prone_y_raise', sets: 2, reps: [10, 12], restSeconds: 30,
        cue: { en: 'Lie face down on a mat or towel; lift the arms into a Y without shrugging.', he: 'לשכב על הבטן על מזרן או מגבת; להרים את הזרועות לצורת Y בלי להרים כתפיים.' },
      },
    ],
  },
  {
    id: 'upper_body_dumbbell_alternating_push_pull',
    name: { en: 'Alternating Push and Pull', he: 'דחיפה ומשיכה לסירוגין' },
    description: {
      en: 'Push and pull alternate through the session: incline press, chest-supported row, Arnold press and one-arm row, finished with skull crushers and hammer curls. 3-4 sets of 8-12 reps. Needs a bench.',
      he: 'דחיפה ומשיכה מתחלפות לאורך האימון: לחיצה בשיפוע חיובי, חתירה בתמיכת חזה, לחיצת ארנולד וחתירה חד-ידית, ובסיום סקאל קראשר ופטישים. 3-4 סטים של 8-12 חזרות. דורש ספסל.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'incline_dumbbell_press', sets: 4, reps: [8, 12], restSeconds: 75 },
      {
        exerciseId: 'chest_supported_dumbbell_row', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Chest stays on the bench; pause for a moment at the top with the shoulder blades squeezed.', he: 'החזה נשאר על הספסל; להשהות רגע למעלה עם השכמות מוצמדות.' },
      },
      { exerciseId: 'arnold_press', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'one_arm_dumbbell_row', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_skull_crusher', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'hammer_curl', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_dumbbell_push_press_renegade',
    name: { en: 'Standing Press and Renegade Row', he: 'לחיצה בעמידה וחתירת רנגייד' },
    description: {
      en: 'Compound upper-body strength: a standing push press, renegade rows, decline push-ups and chest-supported rows, then a pullover and a rear-delt fly. The core stays braced throughout. Needs a bench.',
      he: 'כוח מורכב לפלג גוף עליון: פוש פרס בעמידה, חתירת רנגייד, שכיבות סמיכה ברגליים מוגבהות וחתירה בתמיכת חזה, ואז פולאובר ופרפר הפוך. הליבה נשארת פעילה לאורך כל האימון. דורש ספסל.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_push_press', sets: 4, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Dip through the knees, drive up and finish with the arms locked overhead.', he: 'לרדת בברכיים, לדחוף למעלה ולסיים עם זרועות ישרות מעל הראש.' },
      },
      {
        exerciseId: 'renegade_row', sets: 3, reps: [6, 10], restSeconds: 75,
        cue: { en: 'Feet wide and hips level; row without rotating the torso.', he: 'רגליים בפיסוק רחב ואגן ישר; לחתור בלי לסובב את פלג הגוף העליון.' },
      },
      { exerciseId: 'decline_push_up', sets: 3, reps: [10, 15], restSeconds: 60 },
      { exerciseId: 'chest_supported_dumbbell_row', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'dumbbell_pullover', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_dumbbell_clap_heavy',
    name: { en: 'Power and Strength Upper Body', he: 'כוח והתפרצות לפלג גוף עליון' },
    description: {
      en: 'Advanced upper-body day: clap push-ups while fresh, then a heavy bench press, bent-over rows, shoulder press and one-arm rows, finished with skull crushers. Long rests on the heavy lifts. Needs a bench.',
      he: 'יום פלג גוף עליון למתקדמים: שכיבות סמיכה עם מחיאת כף כשהגוף רענן, ואחר כך לחיצת חזה כבדה, חתירה בהטיית גו, לחיצת כתפיים וחתירה חד-ידית, ובסיום סקאל קראשר. מנוחה ארוכה בתרגילים הכבדים. דורש ספסל.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'clap_push_up', sets: 3, reps: [4, 6], restSeconds: 90,
        cue: { en: 'Stop the set as soon as the clap or the landing gets sloppy.', he: 'לעצור את הסט ברגע שהמחיאה או הנחיתה נעשות לא נקיות.' },
      },
      {
        exerciseId: 'dumbbell_bench_press', sets: 4, reps: [6, 8], restSeconds: 105,
        cue: { en: 'Heavy but controlled; keep a rep or two in reserve.', he: 'כבד אבל מבוקר; להשאיר חזרה או שתיים בעתודה.' },
      },
      { exerciseId: 'bent_over_dumbbell_row', sets: 4, reps: [6, 8], restSeconds: 105 },
      { exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: [6, 8], restSeconds: 90 },
      { exerciseId: 'one_arm_dumbbell_row', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'dumbbell_skull_crusher', sets: 3, reps: [8, 10], restSeconds: 60 },
    ],
  },
];
