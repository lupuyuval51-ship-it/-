import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Bodyweight upper-body ready workouts (21).
 * No equipment at all (places home + outdoor + gym): chest 4, back 2 (floor based, no bar), shoulders 3, triceps 2, upper body 2.
 * With bars (pull-up bar, dip bars, bench, rings, suspension trainer): chest 2, back 4, biceps 1, arms 1.
 * Mode `bodyweight`: nothing here is externally loaded.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ Chest (no equipment)
  {
    id: 'chest_bw_push_up_foundations',
    name: { en: 'Push-Up Foundations', he: 'יסודות שכיבות סמיכה' },
    description: {
      en: 'A first push-up session: an incline push-up, a knee push-up, shoulder-blade control and a halfway hold, finished with a back raise. Straight sets of three or fewer, built to learn good form.',
      he: 'אימון ראשון בשכיבות סמיכה: שכיבות בידיים מוגבהות ועל הברכיים, שליטה בשכמות והחזקה בחצי ירידה, ובסיום הרמת ידיים בשכיבה על הבטן. סטים רגילים, עד שלושה סטים, כדי ללמוד טכניקה נכונה.',
    },
    focus: 'chest',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'incline_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Hands on a sturdy bench, table or step; body in one straight line.', he: 'ידיים על ספסל, שולחן או מדרגה יציבים; הגוף בקו ישר אחד.' },
      },
      { exerciseId: 'knee_push_up', sets: 3, reps: [6, 10], restSeconds: 60 },
      {
        exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 45,
        cue: { en: 'Arms stay straight; only the shoulder blades move.', he: 'הידיים נשארות ישרות; רק השכמות זזות.' },
      },
      {
        exerciseId: 'push_up_hold', sets: 3, seconds: 20, restSeconds: 45,
        cue: { en: 'Pause halfway down, elbows about 45 degrees from the body.', he: 'לעצור באמצע הירידה, המרפקים בזווית של כ-45 מעלות מהגוף.' },
      },
      {
        exerciseId: 'prone_t_raise', sets: 2, reps: [8, 12], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; lift the arms to the sides and squeeze the shoulder blades.', he: 'לשכב על מזרן או מגבת; להרים את הידיים לצדדים ולכווץ את השכמות.' },
      },
    ],
  },
  {
    id: 'chest_bw_width_mix',
    name: { en: 'Push-Up Width Mix', he: 'שכיבות סמיכה ברוחבים שונים' },
    description: {
      en: 'Standard, wide and close-grip push-ups change how the chest, shoulders and triceps share the work. A back raise and a plank balance the session. Straight sets, with room to progress.',
      he: 'שכיבות סמיכה רגילות, רחבות וצרות משנות את חלוקת העבודה בין החזה, הכתפיים והתלת-ראשי. הרמת ידיים בשכיבה על הבטן ופלאנק מאזנים את האימון. סטים רגילים, עם מקום להתקדם.',
    },
    focus: 'chest',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'push_up', sets: 3, reps: [5, 8], restSeconds: 75,
        cue: { en: 'Body in one line. If five clean reps are not possible, switch to knee push-ups.', he: 'הגוף בקו ישר. אם אי אפשר להגיע לחמש חזרות נקיות, לעבור לשכיבות סמיכה על הברכיים.' },
      },
      {
        exerciseId: 'prone_y_raise', sets: 2, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; thumbs up, arms in a Y, lift without arching the lower back.', he: 'לשכב על מזרן או מגבת; אגודלים למעלה, ידיים בצורת Y, להרים בלי לקער את הגב התחתון.' },
      },
      {
        exerciseId: 'wide_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Hands slightly wider than the shoulders, elbows about 45 degrees from the body.', he: 'ידיים מעט רחבות מהכתפיים, המרפקים בזווית של כ-45 מעלות מהגוף.' },
      },
      {
        exerciseId: 'close_grip_push_up', sets: 2, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Hands under the shoulders, elbows brushing the ribs.', he: 'הידיים מתחת לכתפיים, המרפקים קרובים לצלעות.' },
      },
      { exerciseId: 'plank', sets: 2, seconds: 30, restSeconds: 45 },
    ],
  },
  {
    id: 'chest_bw_moving_push_ups',
    name: { en: 'Moving Push-Up Mix', he: 'שכיבות סמיכה בתנועה' },
    description: {
      en: 'Push-up variations that add a sweeping hip-to-chest motion, a knee drive and a shoulder tap, so the chest works through more angles. A snow-angel raise and a side plank balance the session. Straight sets.',
      he: 'וריאציות של שכיבות סמיכה עם תנועה סוחפת מהאגן אל החזה, הבאת ברך לכיוון המרפק ונגיעה בכתף, כך שהחזה עובד בזוויות רבות. מלאך שלג הפוך ופלאנק צידי מאזנים את האימון. סטים רגילים.',
    },
    focus: 'chest',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'hindu_push_up', sets: 3, reps: [8, 10], restSeconds: 60,
        cue: { en: 'Hips high, then sweep the chest low and forward between the hands in one smooth motion.', he: 'אגן גבוה, ואז להעביר את החזה נמוך וקדימה בין הידיים בתנועה אחת רציפה.' },
      },
      {
        exerciseId: 'spiderman_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Bring the knee toward the elbow as you lower; alternate sides.', he: 'להביא את הברך לכיוון המרפק בירידה; להחליף צד בכל חזרה.' },
      },
      {
        exerciseId: 'push_up_shoulder_tap', sets: 3, reps: [10, 16], restSeconds: 60,
        cue: { en: 'Feet wide, hips still while the hand taps the opposite shoulder.', he: 'רגליים פסוקות, האגן יציב בזמן שהיד נוגעת בכתף הנגדית.' },
      },
      { exerciseId: 'wide_push_up', sets: 3, reps: [12, 18], restSeconds: 45 },
      {
        exerciseId: 'reverse_snow_angel', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; sweep the arms from the hips to overhead, thumbs up.', he: 'לשכב על מזרן או מגבת; להעביר את הידיים מהירכיים עד מעל הראש, אגודלים למעלה.' },
      },
      { exerciseId: 'side_plank', sets: 2, seconds: 30, restSeconds: 30 },
    ],
  },
  {
    id: 'chest_bw_explosive_decline',
    name: { en: 'Explosive Push-Up Power', he: 'כוח מתפרץ בשכיבות סמיכה' },
    description: {
      en: 'Starts fresh with a few fast, explosive push-ups, then builds volume with decline and slow-tempo push-ups. A swimmer and a hollow hold balance the session. For people who already do clean push-ups.',
      he: 'פותחים כשהגוף רענן עם מעט שכיבות סמיכה מהירות ומתפרצות, ואז מוסיפים נפח בשכיבות סמיכה ברגליים מוגבהות ובקצב איטי. שחיין בשכיבה והחזקת הולו מאזנים. למי שכבר מצליחים לבצע שכיבות סמיכה נקיות.',
    },
    focus: 'chest',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'explosive_push_up', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Push fast enough for the hands to leave the floor and land with soft elbows. Stop when speed drops.', he: 'לדחוף מהר מספיק כדי שהידיים יתנתקו מהרצפה, ולנחות עם מרפקים רכים. להפסיק כשהמהירות יורדת.' },
      },
      {
        exerciseId: 'decline_push_up', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Feet on a bench, step or sturdy chair; keep the body in one line.', he: 'כפות הרגליים על ספסל, מדרגה או כיסא יציב; הגוף בקו ישר.' },
      },
      {
        exerciseId: 'push_up', sets: 3, reps: [12, 20], restSeconds: 60,
        cue: { en: 'Slow tempo: about 3 seconds down, no rest at the bottom.', he: 'קצב איטי: כ-3 שניות בירידה, בלי מנוחה בתחתית.' },
      },
      {
        exerciseId: 'prone_swimmer', sets: 3, reps: [12, 20], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; flutter arms and legs in small, controlled motions.', he: 'לשכב על מזרן או מגבת; לנופף בידיים וברגליים בתנועות קטנות ומבוקרות.' },
      },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 30, restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Chest (bars, rings)
  {
    id: 'chest_bars_dip_and_decline',
    name: { en: 'Dip and Decline Chest', he: 'מקבילים ושכיבות סמיכה ברגליים מוגבהות' },
    description: {
      en: 'A bar-based chest session: forward-leaning chest dips, decline and wide push-ups, an inverted row for balance and a hanging knee raise. Straight sets with moderate rest, for people with a solid push-up base.',
      he: 'אימון חזה על מוטות ומקבילים: מקבילים בהטיה קדימה, שכיבות סמיכה ברגליים מוגבהות וברוחב רחב, מתח אוסטרלי לאיזון והרמת ברכיים בתלייה. סטים רגילים עם מנוחה בינונית, למי שכבר יש בסיס טוב בשכיבות סמיכה.',
    },
    focus: 'chest',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['gym', 'outdoor'],
    items: [
      {
        exerciseId: 'chest_dip', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Lean forward, elbows slightly out; lower only as far as the shoulders feel comfortable.', he: 'להישען קדימה, מרפקים מעט החוצה; לרדת רק עד עומק שנוח לכתפיים.' },
      },
      {
        exerciseId: 'decline_push_up', sets: 3, reps: [10, 15], restSeconds: 75,
        cue: { en: 'Feet on a bench or low bar; keep the body in one line.', he: 'כפות הרגליים על ספסל או מוט נמוך; הגוף בקו ישר.' },
      },
      { exerciseId: 'wide_push_up', sets: 3, reps: [12, 15], restSeconds: 60 },
      {
        exerciseId: 'inverted_row', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Body straight; pull the chest to the bar and squeeze the shoulder blades.', he: 'הגוף ישר; למשוך את החזה אל המוט ולכווץ את השכמות.' },
      },
      { exerciseId: 'hanging_knee_raise', sets: 3, reps: [8, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'chest_rings_archer_clap',
    name: { en: 'Rings and Archer Push-Ups', he: 'שכיבות סמיכה על טבעות וארצ׳ר' },
    description: {
      en: 'An advanced push-up session: clap push-ups while fresh, ring push-ups for stability, archer push-ups for one-sided strength, then a ring row and a V-up to balance. Needs a pair of gymnastic rings.',
      he: 'אימון שכיבות סמיכה מתקדם: מחיאות כף כשהגוף רענן, שכיבות סמיכה על טבעות ליציבות, שכיבות ארצ׳ר לכוח חד-צדדי, ולסיום חתירה בטבעות וי-אפ לאיזון. דורש זוג טבעות התעמלות.',
    },
    focus: 'chest',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor'],
    items: [
      {
        exerciseId: 'clap_push_up', sets: 3, reps: [4, 6], restSeconds: 90,
        cue: { en: 'Explode up, clap, land with soft elbows. End the set when height drops.', he: 'להתפרץ למעלה, למחוא כף ולנחות עם מרפקים רכים. לסיים את הסט כשהגובה יורד.' },
      },
      {
        exerciseId: 'ring_push_up', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Keep the rings close to the body and steady; lower slowly.', he: 'להצמיד את הטבעות לגוף ולשמור עליהן יציבות; לרדת לאט.' },
      },
      {
        exerciseId: 'archer_push_up', sets: 3, reps: [4, 8], restSeconds: 90,
        cue: { en: 'Lower toward one hand while the other arm stays long; alternate sides.', he: 'לרדת לכיוון יד אחת בזמן שהיד השנייה נשארת ישרה; להחליף צדדים.' },
      },
      { exerciseId: 'ring_row', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'v_up', sets: 3, reps: [10, 15], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Back (floor based, no bar)
  {
    id: 'back_bw_floor_posture',
    name: { en: 'Floor Posture Builder', he: 'בניית יציבה על הרצפה' },
    description: {
      en: 'No equipment and no bar: back-extension and shoulder-blade exercises done on a mat. It trains the upper back, rear shoulders and lower back with gentle straight sets, to learn control of the shoulder blades.',
      he: 'בלי ציוד ובלי מוט: תרגילי הרמה ושליטה בשכמות על מזרן. מחזקים את הגב העליון, הכתפיים האחוריות והגב התחתון בסטים רגילים ועדינים, כדי ללמוד לשלוט בשכמות.',
    },
    focus: 'back',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'superman', sets: 3, reps: [8, 12], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; lift arms and legs only a few centimetres and keep the neck long.', he: 'לשכב על מזרן או מגבת; להרים ידיים ורגליים רק כמה סנטימטרים ולשמור על צוואר ארוך.' },
      },
      {
        exerciseId: 'prone_t_raise', sets: 3, reps: [8, 12], restSeconds: 45,
        cue: { en: 'Thumbs up; squeeze the shoulder blades together and pause for a second.', he: 'אגודלים למעלה; לכווץ את השכמות זו לכיוון זו ולעצור לשנייה.' },
      },
      { exerciseId: 'prone_y_raise', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 45 },
      {
        exerciseId: 'bird_dog', sets: 2, reps: [6, 8], restSeconds: 45,
        cue: { en: 'Reach long, keep the hips level and move slowly.', he: 'למתוח ארוך, לשמור על האגן ישר ולנוע לאט.' },
      },
    ],
  },
  {
    id: 'back_bw_prone_flow',
    name: { en: 'Prone Pull Flow', he: 'זרימת משיכות בשכיבה על הבטן' },
    description: {
      en: 'Higher-volume floor work for the back: a bear crawl to wake up the shoulders, then snow angels, swimmers and dolphin kicks with short rests. No equipment and no bar.',
      he: 'עבודת רצפה בנפח גבוה יותר לגב: זחילת דוב שמעירה את הכתפיים, ואחריה מלאכי שלג הפוכים, שחיין ובעיטות דולפין עם מנוחות קצרות. בלי ציוד ובלי מוט.',
    },
    focus: 'back',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'bear_crawl', sets: 3, seconds: 40, restSeconds: 60,
        cue: { en: 'Knees just above the floor; move slowly forward and back over a few metres, or stay in place.', he: 'הברכיים קרובות לרצפה; להתקדם לאט קדימה ואחורה לאורך כמה מטרים, או להישאר במקום.' },
      },
      {
        exerciseId: 'reverse_snow_angel', sets: 4, reps: [10, 15], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; move slowly with thumbs up and do not arch the lower back.', he: 'לשכב על מזרן או מגבת; לנוע לאט עם אגודלים למעלה ובלי לקער את הגב התחתון.' },
      },
      { exerciseId: 'prone_swimmer', sets: 4, reps: [16, 24], restSeconds: 45 },
      { exerciseId: 'prone_dolphin_kick', sets: 3, reps: [12, 16], restSeconds: 45 },
      {
        exerciseId: 'prone_t_raise', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Hold the top of each rep for 2 seconds.', he: 'להחזיק את הנקודה העליונה של כל חזרה למשך 2 שניות.' },
      },
    ],
  },

  // ------------------------------------------------------------------ Back (pull-up bar, rows)
  {
    id: 'back_bar_hang_row_basics',
    name: { en: 'Hang and Row Basics', he: 'יסודות תלייה וחתירה' },
    description: {
      en: 'A bar-based session that builds toward the first pull-up: slow negatives, inverted rows, scapular pull-ups and a hang, finished with a superman. Three sets or fewer. Needs a pull-up bar and a low bar.',
      he: 'אימון על מוטות שבונה את הבסיס למתח הראשון: מתח שלילי איטי, מתח אוסטרלי, משיכות שכמות בתלייה ותלייה על המוט, ובסיום סופרמן. עד שלושה סטים. דורש מוט מתח ומוט נמוך.',
    },
    focus: 'back',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['gym', 'outdoor'],
    items: [
      {
        exerciseId: 'negative_pull_up', sets: 3, reps: [3, 5], restSeconds: 75,
        cue: { en: 'Step or jump to the top, then lower in about 4 seconds.', he: 'לעלות בקפיצה או במדרגה לנקודה העליונה, ואז לרדת בכ-4 שניות.' },
      },
      {
        exerciseId: 'inverted_row', sets: 3, reps: [6, 10], restSeconds: 75,
        cue: { en: 'A higher bar makes it easier; bending the knees makes it easier still.', he: 'מוט גבוה יותר מקל על התרגיל; כיפוף הברכיים מקל עוד.' },
      },
      {
        exerciseId: 'scapular_pull_up', sets: 3, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Arms stay straight; only the shoulder blades move down and up.', he: 'הידיים נשארות ישרות; רק השכמות זזות למטה ולמעלה.' },
      },
      { exerciseId: 'dead_hang', sets: 2, seconds: 20, restSeconds: 45 },
      { exerciseId: 'superman', sets: 2, reps: [8, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'back_bar_pull_up_rings',
    name: { en: 'Pull-Ups and Ring Rows', he: 'מתח וחתירה בטבעות' },
    description: {
      en: 'A pull-up led back session: pull-ups for the lats, ring rows for the upper back, a Y raise, a hang for grip and a hanging knee raise. Straight sets with moderate rest. Needs a pull-up bar and gymnastic rings.',
      he: 'אימון גב שנפתח במתח: מתח לרחב הגבי, חתירה בטבעות לגב העליון, הרמת Y, תלייה לחיזוק האחיזה והרמת ברכיים בתלייה. סטים רגילים עם מנוחה בינונית. דורש מוט מתח וטבעות התעמלות.',
    },
    focus: 'back',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor'],
    items: [
      {
        exerciseId: 'pull_up', sets: 4, reps: [4, 8], restSeconds: 90,
        cue: { en: 'Start from a full hang, pull the chest toward the bar and lower under control.', he: 'להתחיל מתלייה מלאה, למשוך את החזה אל המוט ולרדת בשליטה.' },
      },
      {
        exerciseId: 'ring_row', sets: 4, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Rings at waist height; the more horizontal the body, the harder it is.', he: 'הטבעות בגובה המותניים; ככל שהגוף אופקי יותר, התרגיל קשה יותר.' },
      },
      {
        exerciseId: 'prone_y_raise', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; lift the arms in a Y without arching the lower back.', he: 'לשכב על מזרן או מגבת; להרים את הידיים בצורת Y בלי לקער את הגב התחתון.' },
      },
      { exerciseId: 'dead_hang', sets: 3, seconds: 35, restSeconds: 45 },
      { exerciseId: 'hanging_knee_raise', sets: 3, reps: [8, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'back_bar_chin_wide_grip',
    name: { en: 'Chin-Up and Wide-Grip Pull', he: 'מתח באחיזה הפוכה ורחבה' },
    description: {
      en: 'Two pull-up grips that stress different parts of the back, then a suspension-trainer row, a T raise and a hanging oblique knee raise. Straight sets. Needs a pull-up bar and a suspension trainer.',
      he: 'שתי אחיזות במתח שמדגישות חלקים שונים בגב, ואחריהן חתירה ברצועות TRX, הרמת T והרמת ברכיים לצד בתלייה. סטים רגילים. דורש מוט מתח ורצועות השעיה.',
    },
    focus: 'back',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor'],
    items: [
      {
        exerciseId: 'chin_up', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Underhand grip at shoulder width; chin over the bar without kicking.', he: 'אחיזה הפוכה ברוחב כתפיים; הסנטר מעל המוט בלי נדנוד.' },
      },
      {
        exerciseId: 'wide_grip_pull_up', sets: 3, reps: [4, 8], restSeconds: 90,
        cue: { en: 'Hands wider than the shoulders; pull the elbows down toward the ribs.', he: 'ידיים רחבות מהכתפיים; למשוך את המרפקים למטה לכיוון הצלעות.' },
      },
      {
        exerciseId: 'suspension_trainer_row', sets: 4, reps: [10, 14], restSeconds: 60,
        cue: { en: 'Step the feet forward to make it harder; keep the body straight.', he: 'להתקדם עם הרגליים כדי להקשות; לשמור על גוף ישר.' },
      },
      { exerciseId: 'prone_t_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'hanging_oblique_knee_raise', sets: 3, reps: [8, 10], restSeconds: 45 },
    ],
  },
  {
    id: 'back_bar_archer_muscle_up',
    name: { en: 'Archer and Muscle-Up Skills', he: 'ארצ׳ר ומאסל-אפ' },
    description: {
      en: 'An advanced pulling session: muscle-ups while fresh, archer pull-ups for one-sided strength, slow pull-ups, inverted rows and a hanging leg raise. Low reps and long rests, for people with strong, pain-free pull-ups.',
      he: 'אימון משיכה מתקדם: מאסל-אפ כשהגוף רענן, מתח ארצ׳ר לכוח חד-צדדי, מתח איטי, מתח אוסטרלי והרמת רגליים בתלייה. חזרות מעטות ומנוחות ארוכות, למי שמבצעים מתח חזק וללא כאבים.',
    },
    focus: 'back',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['gym', 'outdoor'],
    items: [
      {
        exerciseId: 'muscle_up', sets: 3, reps: [2, 4], restSeconds: 120,
        cue: { en: 'Pull explosively to the chest, then press over the bar. End the set when form breaks.', he: 'למשוך בפיצוץ אל החזה ואז לדחוף מעל המוט. לסיים את הסט כשהטכניקה נשברת.' },
      },
      {
        exerciseId: 'archer_pull_up', sets: 4, reps: [3, 5], restSeconds: 90,
        cue: { en: 'Pull toward one hand while the other arm stays straight; alternate sides.', he: 'למשוך לכיוון יד אחת בזמן שהיד השנייה נשארת ישרה; להחליף צדדים.' },
      },
      {
        exerciseId: 'pull_up', sets: 3, reps: [8, 12], restSeconds: 90,
        cue: { en: 'Slow tempo: one second up, three seconds down.', he: 'קצב איטי: שנייה אחת למעלה, שלוש שניות למטה.' },
      },
      {
        exerciseId: 'inverted_row', sets: 3, reps: [10, 15], restSeconds: 60,
        cue: { en: 'Raise the feet onto a bench or box to make it harder.', he: 'להעלות את הרגליים על ספסל או קופסה כדי להקשות.' },
      },
      { exerciseId: 'hanging_leg_raise', sets: 3, reps: [8, 12], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Shoulders (no equipment)
  {
    id: 'shoulders_bw_stability_starter',
    name: { en: 'Shoulder Stability Starter', he: 'יסודות יציבות הכתף' },
    description: {
      en: 'A gentle shoulder session that builds control rather than load: an inchworm, scapular push-ups, Y and T raises and light shadow boxing. No equipment, three sets or fewer.',
      he: 'אימון כתפיים עדין שבונה שליטה ולא עומס: אינצ׳וורם, שכיבות סמיכה לשכמות, הרמות Y ו-T ואגרוף צללים קל. בלי ציוד, עד שלושה סטים.',
    },
    focus: 'shoulders',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'inchworm', sets: 3, reps: [5, 8], restSeconds: 60,
        cue: { en: 'Walk the hands out slowly, keep the legs as straight as is comfortable and brace the core.', he: 'ללכת עם הידיים החוצה לאט, לשמור על רגליים ישרות ככל שנוח, ולהדק את הליבה.' },
      },
      { exerciseId: 'scapular_push_up', sets: 3, reps: [8, 12], restSeconds: 45 },
      {
        exerciseId: 'prone_y_raise', sets: 3, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; lift the arms in a Y without arching the lower back.', he: 'לשכב על מזרן או מגבת; להרים את הידיים בצורת Y בלי לקער את הגב התחתון.' },
      },
      { exerciseId: 'prone_t_raise', sets: 3, reps: [8, 12], restSeconds: 45 },
      {
        exerciseId: 'shadow_boxing', sets: 2, seconds: 40, restSeconds: 45,
        cue: { en: 'Light punches with soft elbows; keep the shoulders relaxed.', he: 'אגרופים קלים עם מרפקים רכים; הכתפיים רפויות.' },
      },
    ],
  },
  {
    id: 'shoulders_bw_pike_builder',
    name: { en: 'Pike Press Builder', he: 'בניית כתפיים בשכיבות פייק' },
    description: {
      en: 'Overhead-style pressing with the body only: pike and Hindu push-ups lead, a bear crawl keeps the shoulders loaded, and a snow-angel raise and plank jumping jacks finish. No equipment.',
      he: 'דחיפה בסגנון מעל הראש בעזרת משקל הגוף: שכיבות סמיכה פייק והינדיות פותחות, זחילת דוב ממשיכה לעמוס על הכתפיים, ומלאך שלג הפוך וקפיצות פיסוק בפלאנק סוגרים. בלי ציוד.',
    },
    focus: 'shoulders',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'pike_push_up', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Hips high in an inverted V; lower the top of the head toward the floor between the hands.', he: 'אגן גבוה בצורת V הפוכה; להוריד את קודקוד הראש לכיוון הרצפה בין הידיים.' },
      },
      { exerciseId: 'hindu_push_up', sets: 4, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'bear_crawl', sets: 3, seconds: 40, restSeconds: 60,
        cue: { en: 'Knees just above the floor; crawl slowly forward and back, or stay in place.', he: 'הברכיים קרובות לרצפה; לזחול לאט קדימה ואחורה, או להישאר במקום.' },
      },
      {
        exerciseId: 'reverse_snow_angel', sets: 4, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; sweep the arms from the hips to overhead, thumbs up.', he: 'לשכב על מזרן או מגבת; להעביר את הידיים מהירכיים עד מעל הראש, אגודלים למעלה.' },
      },
      { exerciseId: 'plank_jack', sets: 3, seconds: 30, restSeconds: 45 },
    ],
  },
  {
    id: 'shoulders_bw_handstand_progression',
    name: { en: 'Handstand Push-Up Progression', he: 'התקדמות לשכיבות סמיכה בעמידת ידיים' },
    description: {
      en: 'An advanced shoulder session built around wall handstand push-ups, supported by pike and typewriter push-ups, scapular work and a hollow hold. For people who already control pike push-ups well. Needs a free wall.',
      he: 'אימון כתפיים מתקדם סביב שכיבות סמיכה בעמידת ידיים על הקיר, בתמיכת שכיבות פייק וטייפרייטר, עבודת שכמות והחזקת הולו. למי שכבר שולטים היטב בשכיבות פייק. נדרש קיר פנוי.',
    },
    focus: 'shoulders',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'wall_handstand_push_up', sets: 4, reps: [3, 6], restSeconds: 120,
        cue: { en: 'Kick up with clear space around you, lower slowly and stop at the first neck or shoulder discomfort.', he: 'לעלות עם מרחב פנוי סביב, לרדת לאט ולהפסיק ברגע שמרגישים אי נוחות בצוואר או בכתפיים.' },
      },
      {
        exerciseId: 'pike_push_up', sets: 3, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Feet on a bench or step to shift more load onto the shoulders.', he: 'כפות הרגליים על ספסל או מדרגה כדי להעביר יותר עומס לכתפיים.' },
      },
      { exerciseId: 'typewriter_push_up', sets: 3, reps: [4, 6], restSeconds: 90 },
      { exerciseId: 'scapular_push_up', sets: 3, reps: [10, 15], restSeconds: 45 },
      { exerciseId: 'prone_y_raise', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 40, restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Triceps (no equipment)
  {
    id: 'triceps_bw_close_grip_basics',
    name: { en: 'Close-Grip Triceps Basics', he: 'יסודות תלת-ראשי באחיזה צרה' },
    description: {
      en: 'A short triceps session for people learning push-ups: close-grip push-ups and a halfway hold carry the work, with scapular push-ups and a high plank. No equipment, three sets or fewer.',
      he: 'אימון תלת-ראשי קצר למי שלומדים שכיבות סמיכה: שכיבות באחיזה צרה והחזקה בחצי ירידה נושאות את העבודה, עם שכיבות סמיכה לשכמות ופלאנק גבוה. בלי ציוד, עד שלושה סטים.',
    },
    focus: 'triceps',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 45 },
      {
        exerciseId: 'close_grip_push_up', sets: 3, reps: [6, 10], restSeconds: 75,
        cue: { en: 'Hands under the shoulders, elbows brushing the ribs; use the knees if needed.', he: 'הידיים מתחת לכתפיים, המרפקים קרובים לצלעות; אפשר לרדת על הברכיים אם צריך.' },
      },
      { exerciseId: 'push_up_hold', sets: 3, seconds: 25, restSeconds: 45 },
      {
        exerciseId: 'high_plank', sets: 2, seconds: 30, restSeconds: 45,
        cue: { en: 'Push the floor away; keep the ribs and hips in line.', he: 'לדחוף את הרצפה; הצלעות והאגן בקו אחד.' },
      },
    ],
  },
  {
    id: 'triceps_bw_diamond_pike',
    name: { en: 'Diamond and Pike Triceps', he: 'תלת-ראשי ביהלום ובפייק' },
    description: {
      en: 'Triceps-led pressing with the body only: diamond and pike push-ups, then slow close-grip push-ups, a bear crawl and a high plank to finish. Straight sets, no equipment.',
      he: 'דחיפות שמעמיסות על התלת-ראשי בעזרת משקל הגוף: שכיבות יהלום ופייק, אחריהן שכיבות באחיזה צרה בקצב איטי, זחילת דוב ופלאנק גבוה לסיום. סטים רגילים, בלי ציוד.',
    },
    focus: 'triceps',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'diamond_push_up', sets: 4, reps: [6, 12], restSeconds: 75,
        cue: { en: 'Thumbs and index fingers form a diamond under the chest; elbows stay close to the body.', he: 'האגודלים ואצבעות ההצבעה יוצרים יהלום מתחת לחזה; המרפקים נשארים קרובים לגוף.' },
      },
      { exerciseId: 'pike_push_up', sets: 3, reps: [6, 10], restSeconds: 75 },
      {
        exerciseId: 'close_grip_push_up', sets: 3, reps: [10, 15], restSeconds: 60,
        cue: { en: 'Slow tempo: about 3 seconds down.', he: 'קצב איטי: כ-3 שניות בירידה.' },
      },
      { exerciseId: 'bear_crawl', sets: 3, seconds: 30, restSeconds: 60 },
      { exerciseId: 'high_plank', sets: 2, seconds: 45, restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Upper body (no equipment)
  {
    id: 'upper_body_bw_floor_push_pull',
    name: { en: 'Floor Push and Pull', he: 'דחיפה ומשיכה על הרצפה' },
    description: {
      en: 'A balanced no-equipment upper-body session that alternates pushing and pulling: incline and close-grip push-ups with back raises and a scapular push-up, ending with a bird dog. Three sets or fewer.',
      he: 'אימון פלג גוף עליון מאוזן בלי ציוד, בסירוגין בין דחיפה למשיכה: שכיבות סמיכה בידיים מוגבהות ובאחיזה צרה עם הרמות לגב ושכיבת סמיכה לשכמות, ובסיום בירד דוג. עד שלושה סטים.',
    },
    focus: 'upper_body',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'incline_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Hands on a sturdy bench, table or step; body in one straight line.', he: 'ידיים על ספסל, שולחן או מדרגה יציבים; הגוף בקו ישר אחד.' },
      },
      {
        exerciseId: 'reverse_snow_angel', sets: 3, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; sweep the arms from the hips to overhead, thumbs up.', he: 'לשכב על מזרן או מגבת; להעביר את הידיים מהירכיים עד מעל הראש, אגודלים למעלה.' },
      },
      { exerciseId: 'close_grip_push_up', sets: 2, reps: [6, 10], restSeconds: 60 },
      { exerciseId: 'prone_t_raise', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 45 },
      { exerciseId: 'bird_dog', sets: 2, reps: [6, 8], restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_bw_balanced_push_pull',
    name: { en: 'Balanced Push-Pull Builder', he: 'בניית דחיפה ומשיכה מאוזנת' },
    description: {
      en: 'Equal volume for pushing and pulling, so the chest and shoulders get as much attention as the upper back: decline and pike push-ups, a shoulder-tap push-up and three prone raises. Straight sets, no equipment.',
      he: 'נפח זהה לדחיפה ולמשיכה, כך שהחזה והכתפיים מקבלים אותו יחס כמו הגב העליון: שכיבות סמיכה ברגליים מוגבהות ופייק, שכיבת סמיכה עם נגיעה בכתף ושלוש הרמות בשכיבה על הבטן. סטים רגילים, בלי ציוד.',
    },
    focus: 'upper_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'decline_push_up', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Feet on a bench, step or sturdy chair; keep the body in one line.', he: 'כפות הרגליים על ספסל, מדרגה או כיסא יציב; הגוף בקו ישר.' },
      },
      { exerciseId: 'pike_push_up', sets: 3, reps: [6, 10], restSeconds: 75 },
      {
        exerciseId: 'reverse_snow_angel', sets: 4, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Lie on a mat or towel; move slowly and keep the thumbs up.', he: 'לשכב על מזרן או מגבת; לנוע לאט ולשמור על אגודלים למעלה.' },
      },
      { exerciseId: 'push_up_shoulder_tap', sets: 3, reps: [10, 16], restSeconds: 60 },
      { exerciseId: 'prone_y_raise', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'prone_swimmer', sets: 3, reps: [12, 16], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Biceps and arms (bars)
  {
    id: 'biceps_bar_chin_up_focus',
    name: { en: 'Chin-Up Biceps Focus', he: 'דו-ראשי במתח באחיזה הפוכה' },
    description: {
      en: 'A biceps session built on the chin-up with only a pull-up bar: a scapular activation set, five sets of chin-ups, one slow negative and hangs for grip. Needs some chin-up strength.',
      he: 'אימון דו-ראשי שנבנה על מתח באחיזה הפוכה עם מוט מתח בלבד: סט הפעלת שכמות, חמישה סטים של מתח, סט שלילי איטי ותלייה לחיזוק האחיזה. דורש מעט כוח במתח באחיזה הפוכה.',
    },
    focus: 'biceps',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'scapular_pull_up', sets: 1, reps: [6, 8], restSeconds: 45,
        cue: { en: 'Activation set: arms straight, only the shoulder blades move.', he: 'סט הפעלה: הידיים ישרות, רק השכמות זזות.' },
      },
      {
        exerciseId: 'chin_up', sets: 5, reps: [4, 8], restSeconds: 120,
        cue: { en: 'Underhand grip at shoulder width; start from a full hang and lower in 2-3 seconds.', he: 'אחיזה הפוכה ברוחב כתפיים; להתחיל מתלייה מלאה ולרדת ב-2-3 שניות.' },
      },
      {
        exerciseId: 'negative_pull_up', sets: 1, reps: [3, 5], restSeconds: 90,
        cue: { en: 'One last slow set: underhand grip, lower in about 4 seconds.', he: 'סט איטי אחרון: אחיזה הפוכה, לרדת בכ-4 שניות.' },
      },
      { exerciseId: 'dead_hang', sets: 3, seconds: 40, restSeconds: 60 },
    ],
  },
  {
    id: 'arms_bar_chin_up_dip',
    name: { en: 'Chin-Up and Dip Arms', he: 'ידיים במתח באחיזה הפוכה ובמקבילים' },
    description: {
      en: 'Arm training on the bars: dips and chin-ups lead, followed by diamond push-ups, bench dips and a hang for grip. Straight sets alternating pushing and pulling. Needs a pull-up bar, dip bars and a bench.',
      he: 'אימון ידיים על המתקנים: מקבילים ומתח באחיזה הפוכה פותחים, ואחריהם שכיבות יהלום, מקבילים על ספסל ותלייה לחיזוק האחיזה. סטים רגילים, בסירוגין בין דחיפה למשיכה. דורש מוט מתח, מקבילים וספסל.',
    },
    focus: 'arms',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['gym', 'outdoor'],
    items: [
      {
        exerciseId: 'parallel_bar_dip', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Shoulders down, elbows tracking back; lower only as far as the shoulders feel comfortable.', he: 'כתפיים למטה, המרפקים נעים אחורה; לרדת רק עד עומק שנוח לכתפיים.' },
      },
      { exerciseId: 'chin_up', sets: 4, reps: [5, 8], restSeconds: 90 },
      { exerciseId: 'diamond_push_up', sets: 3, reps: [8, 12], restSeconds: 60 },
      {
        exerciseId: 'bench_dip', sets: 3, reps: [10, 15], restSeconds: 60,
        cue: { en: 'Hips close to the bench; stop if the front of the shoulder hurts.', he: 'האגן קרוב לספסל; להפסיק אם יש כאב בחזית הכתף.' },
      },
      { exerciseId: 'dead_hang', sets: 2, seconds: 30, restSeconds: 45 },
    ],
  },
];
