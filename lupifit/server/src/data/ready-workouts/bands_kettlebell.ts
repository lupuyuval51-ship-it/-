import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Resistance-band and kettlebell ready workouts (mode `weights`). Everything here needs only light, portable gear
 * (bands, one kettlebell, sometimes a pull-up bar), so every session is offered at home, in the park and in the gym.
 *
 * Bands: chest, back, shoulders, arms, glutes, legs, full body, upper body.
 * Kettlebell: legs, glutes, hamstrings, full body x2, shoulders, upper body, cardio.
 *
 * Gaps against the original quota, caused by the exercise library (not by the writing): there is no band or kettlebell
 * exercise whose primary muscle is abs / obliques / lower back, so a `core` workout cannot pass the focus rule; and the
 * only exercise that is both externally loaded and conditioning is the dumbbell man maker, so the kettlebell cardio
 * session also needs a pair of light dumbbells.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ Bands
  {
    id: 'chest_bands_push_up_and_press',
    name: { en: 'Band and Push-up Chest Builder', he: 'בניית חזה עם גומייה ושכיבות סמיכה' },
    description: {
      en: 'Decline and Hindu push-ups paired with band presses and flies. Straight sets with moderate rest, finished by a triceps extension and a halfway push-up hold. Suits people who already do full push-ups.',
      he: 'שכיבות סמיכה ברגליים מוגבהות והינדיות לצד לחיצות ופרפר עם גומייה. סטים רגילים עם מנוחה בינונית, ובסיום פשיטת מרפקים והחזקה בחצי ירידה. מתאים כשיש כבר שליטה בשכיבות סמיכה מלאות.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'decline_push_up', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Body in one straight line, elbows about 45 degrees from the torso.', he: 'הגוף בקו ישר אחד, המרפקים בזווית של כ-45 מעלות מהגוף.' },
      },
      {
        exerciseId: 'band_chest_press', sets: 4, reps: [12, 15], restSeconds: 60,
        cue: { en: 'Anchor the band behind you at chest height and press forward without shrugging.', he: 'לעגן את הגומייה מאחור בגובה החזה ולדחוף קדימה בלי להרים כתפיים.' },
      },
      { exerciseId: 'hindu_push_up', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'band_chest_fly', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Soft elbows; bring the hands together in front of the chest.', he: 'מרפקים כפופים מעט; לקרב את הידיים זו לזו מול החזה.' },
      },
      { exerciseId: 'band_triceps_extension', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'push_up_hold', sets: 2, seconds: 30, restSeconds: 45 },
    ],
  },
  {
    id: 'back_bands_row_and_pulldown_basics',
    name: { en: 'Band Row and Pulldown Basics', he: 'יסודות חתירה ומשיכה עם גומייה' },
    description: {
      en: 'A beginner back session with only a resistance band: vertical and horizontal pulls, a face pull for the upper back and two light floor exercises. Two to three easy sets of each.',
      he: 'אימון גב למתחילים עם גומיית התנגדות בלבד: משיכות אנכיות ואופקיות, פייס פול לגב העליון ושני תרגילי רצפה קלים. שניים עד שלושה סטים קלים בכל תרגיל.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'band_lat_pulldown', sets: 3, reps: [10, 15], restSeconds: 60,
        cue: { en: 'Anchor the band high; pull the elbows down toward the ribs with the chest tall.', he: 'לעגן את הגומייה גבוה; למשוך את המרפקים כלפי מטה אל הצלעות כשהחזה זקוף.' },
      },
      {
        exerciseId: 'single_arm_band_row', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Pull the elbow back past the ribs and keep the trunk still.', he: 'למשוך את המרפק אחורה עד לצד הצלעות; הגו נשאר יציב.' },
      },
      { exerciseId: 'band_face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_straight_arm_pulldown', sets: 2, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'prone_y_raise', sets: 2, reps: [8, 12], restSeconds: 30,
        cue: { en: 'On a mat or towel; lift the arms just off the floor, thumbs up.', he: 'על מזרן או מגבת; להרים את הזרועות מעט מהרצפה, אגודלים כלפי מעלה.' },
      },
      { exerciseId: 'superman', sets: 2, reps: [8, 12], restSeconds: 30 },
    ],
  },
  {
    id: 'shoulders_bands_pike_and_raises',
    name: { en: 'Pike Press and Band Raises', he: 'שכיבות פייק והרמות כתפיים עם גומייה' },
    description: {
      en: 'Pike push-ups and a band overhead press for the main work, then lateral raises, pull-aparts and an external rotation for the side and rear shoulder. Straight sets with moderate rest.',
      he: 'שכיבות סמיכה פייק ולחיצת כתפיים עם גומייה לעבודה העיקרית, ואחריהן הרחקות לצדדים, פתיחות גומייה וסיבוב חיצוני לכתף הצדדית והאחורית. סטים רגילים עם מנוחה בינונית.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'pike_push_up', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Hips high; the head travels toward the floor between the hands.', he: 'האגן גבוה, הראש יורד אל הרצפה בין הידיים.' },
      },
      {
        exerciseId: 'band_overhead_press', sets: 4, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Ribs down, press in a straight line above the shoulders.', he: 'הצלעות למטה, לדחוף בקו ישר מעל הכתפיים.' },
      },
      { exerciseId: 'band_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_pull_apart', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'band_external_rotation', sets: 2, reps: [12, 15], restSeconds: 30,
        cue: { en: 'Elbow pinned to the side; rotate only the forearm.', he: 'המרפק צמוד לצלעות; לסובב רק את האמה.' },
      },
    ],
  },
  {
    id: 'arms_bands_curl_extension_pairs',
    name: { en: 'Band Curl and Extension Pairs', he: 'זוגות כפיפה ופשיטה עם גומייה' },
    description: {
      en: 'Biceps and triceps trained in alternating order with one resistance band, finished with close-grip push-ups. Light, steady volume that suits a first arm session.',
      he: 'דו-ראשי ותלת-ראשי לסירוגין עם גומייה אחת, ובסיום שכיבות סמיכה באחיזה צרה. נפח קל ויציב שמתאים לאימון ידיים ראשון.',
    },
    focus: 'arms',
    mode: 'weights',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'band_biceps_curl', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Elbows stay at your sides; lower slowly for two to three seconds.', he: 'המרפקים נשארים צמודים לגוף; להוריד לאט במשך שתיים עד שלוש שניות.' },
      },
      { exerciseId: 'band_triceps_extension', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_hammer_curl', sets: 3, reps: [10, 15], restSeconds: 45 },
      {
        exerciseId: 'band_overhead_triceps_extension', sets: 3, reps: [10, 15], restSeconds: 45,
        cue: { en: 'Keep the elbows pointing forward and close to the head.', he: 'המרפקים פונים קדימה וקרובים לראש.' },
      },
      { exerciseId: 'close_grip_push_up', sets: 2, reps: [8, 12], restSeconds: 60 },
    ],
  },
  {
    id: 'glutes_bands_strength_basics',
    name: { en: 'Banded Glute Strength Basics', he: 'יסודות כוח לישבן עם גומייה' },
    description: {
      en: 'A beginner glute session: a band squat and band bridge for strength, then lateral walks, clamshells, a frog pump and donkey kicks for the sides and back of the hips. Easy sets, short rests.',
      he: 'אימון ישבן למתחילים: סקוואט וגשר ישבן עם גומייה לכוח, ואחריהם הליכות צידיות, צדפות, גשר צפרדע ובעיטות חמור לצדדי האגן ולישבן. סטים קלים ומנוחות קצרות.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'band_squat', sets: 3, reps: [12, 15], restSeconds: 60 },
      {
        exerciseId: 'band_glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Press through the heels and pause for a second at the top.', he: 'לדחוף דרך העקבים ולעצור לשנייה בשיא.' },
      },
      {
        exerciseId: 'banded_lateral_walk', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Slightly bent knees, small steps, constant tension on the band.', he: 'ברכיים כפופות מעט, צעדים קטנים ומתיחות קבועה בגומייה.' },
      },
      { exerciseId: 'banded_clamshell', sets: 2, reps: [12, 15], restSeconds: 30 },
      { exerciseId: 'frog_pump', sets: 2, reps: [15, 20], restSeconds: 30 },
      { exerciseId: 'donkey_kick', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_bands_single_leg_strength',
    name: { en: 'Single-Leg Strength with Bands', he: 'כוח ברגל אחת עם גומייה' },
    description: {
      en: 'Shrimp squats and Nordic curls for heavy single-leg work, backed by band squats, single-leg Romanian deadlifts, band bridges and lateral walks. Suits people with a solid squat and hinge.',
      he: 'שרימפ סקוואט ונורדיק קרל לעבודה כבדה על רגל אחת, ולצדם סקוואט עם גומייה, דדליפט רומני על רגל אחת, גשר ישבן והליכות צידיות. מתאים כשיש בסיס כוח טוב בסקוואט ובציר ירך.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'shrimp_squat', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Lower slowly and touch the rear knee lightly to the floor; hold a support if needed.', he: 'לרדת לאט ולגעת בעדינות ברצפה עם הברך האחורית; אפשר להיעזר בנקודת אחיזה.' },
      },
      { exerciseId: 'band_squat', sets: 4, reps: [12, 20], restSeconds: 60 },
      {
        exerciseId: 'nordic_hamstring_curl', sets: 3, reps: [4, 6], restSeconds: 90,
        cue: { en: 'Anchor the heels; lower as slowly as you can and catch yourself with the hands.', he: 'לעגן את העקבים; לרדת לאט ככל האפשר ולהיעזר בידיים בתחתית.' },
      },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'band_glute_bridge', sets: 4, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'banded_lateral_walk', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_bands_circuit',
    name: { en: 'Full-Body Band Circuit', he: 'מעגל גוף מלא עם גומייה' },
    description: {
      en: 'A simple full-body session with one resistance band: squat, press, row, bridge, face pull and dead bug. Short rests keep it moving, and no other gear is needed.',
      he: 'אימון גוף מלא פשוט עם גומייה אחת: סקוואט, לחיצה, חתירה, גשר ישבן, פייס פול ודד באג. מנוחות קצרות שומרות על קצב, ואין צורך בציוד נוסף.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'band_squat', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Stand on the band, hold it at the shoulders and squat with the chest tall.', he: 'לעמוד על הגומייה, להחזיק אותה בגובה הכתפיים ולבצע סקוואט כשהחזה זקוף.' },
      },
      { exerciseId: 'band_chest_press', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_row', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'dead_bug', sets: 2, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Press the lower back gently into the floor and move slowly.', he: 'ללחוץ את הגב התחתון קלות לרצפה ולנוע לאט.' },
      },
    ],
  },
  {
    id: 'upper_body_bands_pull_up_and_press',
    name: { en: 'Pull-up and Band Press Combo', he: 'שילוב מתח ולחיצות עם גומייה' },
    description: {
      en: 'Pull-ups and push-ups first, then band rows, an overhead press, a fly and pull-aparts. Pushing and pulling stay balanced. Needs a pull-up bar and a resistance band.',
      he: 'מתח ושכיבות סמיכה בהתחלה, ואחריהם חתירה, לחיצת כתפיים, פרפר ופתיחות עם גומייה. דחיפה ומשיכה נשארות מאוזנות. נדרשים מוט מתח וגומייה.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'pull_up', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Start from a full hang and pull the chest toward the bar.', he: 'להתחיל מתלייה מלאה ולמשוך את החזה אל המוט.' },
      },
      { exerciseId: 'push_up', sets: 3, reps: [12, 20], restSeconds: 60 },
      {
        exerciseId: 'band_row', sets: 3, reps: [12, 15], restSeconds: 60,
        cue: { en: 'Squeeze the shoulder blades together at the end of each pull.', he: 'לצמצם את השכמות זו לזו בסוף כל משיכה.' },
      },
      { exerciseId: 'band_overhead_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'band_chest_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_pull_apart', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },

  // ------------------------------------------------------------------ Kettlebell
  {
    id: 'legs_kettlebell_squat_deadlift_lunge',
    name: { en: 'Kettlebell Squat, Deadlift and Lunge', he: 'סקוואט, דדליפט ומכרעים עם קטלבל' },
    description: {
      en: 'A lower-body session built on one kettlebell: goblet squat, deadlift and swings, with split squats, lateral lunges and calf raises so each leg works on its own. Straight sets, moderate rest.',
      he: 'אימון רגליים סביב קטלבל אחד: גובלט סקוואט, דדליפט וסווינג, יחד עם סקוואט בולגרי, מכרע צידי והרמות עקבים שעובדים על כל רגל בנפרד. סטים רגילים עם מנוחה בינונית.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'kettlebell_goblet_squat', sets: 4, reps: [10, 12], restSeconds: 75,
        cue: { en: 'Hold the bell at the chest; elbows inside the knees at the bottom.', he: 'הקטלבל צמוד לחזה, המרפקים בין הברכיים בתחתית.' },
      },
      {
        exerciseId: 'bulgarian_split_squat', sets: 3, reps: [8, 10], restSeconds: 60,
        cue: { en: 'Rear foot on a chair, bench or sofa; the front heel stays on the floor.', he: 'כף הרגל האחורית על כיסא, ספסל או ספה; העקב הקדמי נשאר על הרצפה.' },
      },
      { exerciseId: 'kettlebell_deadlift', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'kettlebell_swing', sets: 3, reps: [12, 15], restSeconds: 60,
        cue: { en: 'The hips snap forward; the arms only guide the bell.', he: 'הדחף מגיע מתנועת האגן קדימה; הידיים רק מכוונות את הקטלבל.' },
      },
      { exerciseId: 'lateral_lunge', sets: 2, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'glutes_kettlebell_squat_and_bridge_basics',
    name: { en: 'Kettlebell Squat and Bridge Basics', he: 'יסודות סקוואט וגשר ישבן עם קטלבל' },
    description: {
      en: 'A beginner glute session: goblet squats and kettlebell deadlifts to learn the squat and the hinge, then glute bridges and frog pumps on the floor. Four exercises, three easy sets of each.',
      he: 'אימון ישבן למתחילים: גובלט סקוואט ודדליפט עם קטלבל ללימוד הסקוואט וציר הירך, ואחריהם גשר ישבן וגשר צפרדע על הרצפה. ארבעה תרגילים, שלושה סטים קלים בכל אחד.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'kettlebell_goblet_squat', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'kettlebell_deadlift', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Push the hips back with a flat back, then stand by driving the hips forward.', he: 'לדחוף את האגן אחורה עם גב ישר, ולעמוד בדחיפת האגן קדימה.' },
      },
      {
        exerciseId: 'glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Ribs down; squeeze the glutes and pause for a second at the top.', he: 'צלעות למטה; לכווץ את הישבן ולעצור לשנייה בשיא.' },
      },
      { exerciseId: 'frog_pump', sets: 3, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'hamstrings_kettlebell_hinge_and_walkout',
    name: { en: 'Kettlebell Hinge and Heel Walkout', he: 'ציר ירך עם קטלבל והליכת עקבים בגשר' },
    description: {
      en: 'Swings, deadlifts and cleans train the hips and hamstrings with the kettlebell; single-leg Romanian deadlifts and bridge walkouts add bodyweight hamstring work. Straight sets, moderate rest.',
      he: 'סווינג, דדליפט וקלין עם קטלבל לעבודה על הירכיים והירך האחורית, ואחריהם דדליפט רומני על רגל אחת והליכת עקבים החוצה בגשר. סטים רגילים עם מנוחה בינונית.',
    },
    focus: 'hamstrings',
    mode: 'weights',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'kettlebell_swing', sets: 4, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'kettlebell_deadlift', sets: 4, reps: [8, 10], restSeconds: 75 },
      {
        exerciseId: 'kettlebell_clean', sets: 3, reps: [5, 6], restSeconds: 60,
        cue: { en: 'Keep the bell close to the body; the hips do the work, not the arm.', he: 'הקטלבל קרוב לגוף; האגן מבצע את העבודה ולא היד.' },
      },
      {
        exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60,
        cue: { en: 'Soft knee, hips square to the floor, reach the back heel long behind you.', he: 'ברך כפופה מעט, האגן ישר מול הרצפה, העקב האחורי נמתח לאחור.' },
      },
      {
        exerciseId: 'hamstring_walkout', sets: 3, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Keep the hips high and walk the heels out in small steps.', he: 'להרחיק את העקבים בצעדים קטנים תוך שמירה על אגן גבוה.' },
      },
    ],
  },
  {
    id: 'full_body_kettlebell_foundations',
    name: { en: 'Kettlebell Full-Body Foundations', he: 'יסודות קטלבל לכל הגוף' },
    description: {
      en: 'A first full-body kettlebell session: goblet squat and deadlift, incline push-ups, band rows and a short plank. Needs one kettlebell and one resistance band.',
      he: 'אימון כל הגוף ראשון עם קטלבל: גובלט סקוואט ודדליפט, שכיבות סמיכה בידיים מוגבהות, חתירה עם גומייה ופלאנק קצר. נדרשים קטלבל אחד וגומייה אחת.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'kettlebell_goblet_squat', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Hold the bell at the chest and sit down between the knees.', he: 'הקטלבל צמוד לחזה, לשבת למטה בין הברכיים.' },
      },
      { exerciseId: 'incline_push_up', sets: 3, reps: [8, 12], restSeconds: 45 },
      { exerciseId: 'kettlebell_deadlift', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'band_row', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Anchor the band at chest height and pull the elbows straight back.', he: 'לעגן את הגומייה בגובה החזה ולמשוך את המרפקים ישר אחורה.' },
      },
      {
        exerciseId: 'plank', sets: 2, seconds: 30, restSeconds: 30,
        cue: { en: 'A straight line from head to heels; squeeze the glutes.', he: 'קו ישר מהראש ועד העקבים; לכווץ את הישבן.' },
      },
    ],
  },
  {
    id: 'full_body_kettlebell_clean_press_pull',
    name: { en: 'Kettlebell Clean, Press and Pull-up', he: 'קלין, לחיצה ומתח עם קטלבל' },
    description: {
      en: 'A strength-focused full-body session: kettlebell clean and press, pistol squats, pull-ups and swings, finished with hanging leg raises. Suits people confident with the clean and press who can do pull-ups.',
      he: 'אימון כל הגוף ממוקד כוח: קלין ולחיצה עם קטלבל, פיסטול סקוואט, מתח וסווינג, ובסיום הרמות רגליים בתלייה. מתאים כשיש ביטחון בקלין ובלחיצה ויכולת לבצע מתח.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'kettlebell_clean', sets: 4, reps: [5, 6], restSeconds: 75,
        cue: { en: 'Keep the bell close to the body; the hips do the work, not the arm.', he: 'הקטלבל קרוב לגוף; האגן מבצע את העבודה ולא היד.' },
      },
      {
        exerciseId: 'kettlebell_overhead_press', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Brace the abs and glutes; the forearm stays vertical.', he: 'לכווץ בטן וישבן; האמה נשארת אנכית.' },
      },
      {
        exerciseId: 'pistol_squat', sets: 3, reps: [4, 6], restSeconds: 75,
        cue: { en: 'Hold a support at first and lower only as far as you can control.', he: 'בהתחלה להיאחז בנקודת תמיכה ולרדת רק עד הגובה שאפשר לשלוט בו.' },
      },
      { exerciseId: 'pull_up', sets: 4, reps: [5, 8], restSeconds: 90 },
      { exerciseId: 'kettlebell_swing', sets: 3, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'hanging_leg_raise', sets: 3, reps: [8, 12], restSeconds: 60 },
    ],
  },
  {
    id: 'shoulders_kettlebell_press_and_band_delts',
    name: { en: 'Kettlebell Press and Band Delts', he: 'לחיצת קטלבל וכתפיים עם גומייה' },
    description: {
      en: 'One-arm kettlebell presses and pike push-ups lead, then band lateral raises and face pulls for the side and rear shoulder, with scapular push-ups to finish. Needs a kettlebell and a resistance band.',
      he: 'לחיצות כתפיים ביד אחת עם קטלבל ושכיבות פייק פותחות, ואחריהן הרחקות לצדדים ופייס פול עם גומייה לכתף הצדדית והאחורית, ובסיום שכיבות סמיכה לשכמות. נדרשים קטלבל וגומייה.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'kettlebell_overhead_press', sets: 4, reps: [6, 10], restSeconds: 75,
        cue: { en: 'Brace the abs and glutes; press the bell straight up with the forearm vertical.', he: 'לכווץ בטן וישבן; לדחוף את הקטלבל ישר למעלה כשהאמה אנכית.' },
      },
      { exerciseId: 'pike_push_up', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'band_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'band_face_pull', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Pull toward the face with the elbows high, then pause for a second.', he: 'למשוך אל הפנים כשהמרפקים גבוהים, ולעצור לשנייה.' },
      },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 30 },
    ],
  },
  {
    id: 'upper_body_kettlebell_press_chin_up_row',
    name: { en: 'Kettlebell Press, Chin-up and Row', he: 'לחיצת קטלבל, מתח וחתירה' },
    description: {
      en: 'Chin-ups and a kettlebell press lead, followed by decline push-ups, a one-arm band row, a band fly and a triceps extension. Pushing and pulling stay balanced. Needs a kettlebell, a band and a pull-up bar.',
      he: 'מתח באחיזה הפוכה ולחיצת קטלבל פותחים, ואחריהם שכיבות סמיכה ברגליים מוגבהות, חתירה ביד אחת, פרפר ופשיטת מרפקים עם גומייה. דחיפה ומשיכה נשארות מאוזנות. נדרשים קטלבל, גומייה ומוט מתח.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'chin_up', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Underhand grip; start from a full hang and bring the chin over the bar.', he: 'אחיזה הפוכה; להתחיל מתלייה מלאה ולהעלות את הסנטר מעל המוט.' },
      },
      { exerciseId: 'kettlebell_overhead_press', sets: 3, reps: [6, 8], restSeconds: 75 },
      { exerciseId: 'decline_push_up', sets: 3, reps: [10, 15], restSeconds: 60 },
      {
        exerciseId: 'single_arm_band_row', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Pull the elbow back past the ribs and keep the trunk still.', he: 'למשוך את המרפק אחורה עד לצד הצלעות; הגו נשאר יציב.' },
      },
      { exerciseId: 'band_chest_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_triceps_extension', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'cardio_kettlebell_dumbbell_power_circuit',
    name: { en: 'Kettlebell and Dumbbell Power Circuit', he: 'מעגל כוח וסווינג עם קטלבל ומשקולות' },
    description: {
      en: 'A hard conditioning session with short rests: dumbbell man makers, kettlebell cleans and swings, burpees, jump squats and mountain climbers. Needs good fitness and kettlebell technique, one kettlebell and light dumbbells.',
      he: 'אימון קרדיו קשה עם מנוחות קצרות: מן מייקר עם משקולות יד, קלין וסווינג עם קטלבל, ברפי, סקוואט קפיצה ומטפס הרים. מתאים כשיש כושר טוב וטכניקה בקטלבל. נדרשים קטלבל ומשקולות יד קלות.',
    },
    focus: 'cardio',
    mode: 'weights',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'dumbbell_man_maker', sets: 4, reps: [5, 8], restSeconds: 60,
        cue: { en: 'Use light dumbbells and keep the trunk tight through every part of the move.', he: 'להשתמש במשקולות קלות ולשמור על גו יציב בכל חלקי התנועה.' },
      },
      { exerciseId: 'kettlebell_clean', sets: 3, reps: [5, 6], restSeconds: 30 },
      {
        exerciseId: 'kettlebell_swing', sets: 4, reps: [15, 20], restSeconds: 30,
        cue: { en: 'Flat back; snap the hips and let the bell float to chest height.', he: 'גב ישר; לדחוף את האגן קדימה ולתת לקטלבל לצוף עד גובה החזה.' },
      },
      { exerciseId: 'burpee', sets: 4, reps: [8, 12], restSeconds: 30 },
      { exerciseId: 'jump_squat', sets: 3, reps: [10, 12], restSeconds: 30 },
      { exerciseId: 'mountain_climber', sets: 4, seconds: 40, restSeconds: 20 },
    ],
  },
];
