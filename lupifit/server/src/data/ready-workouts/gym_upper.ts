import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Gym upper-body ready workouts: chest 5, back 6, shoulders 6, biceps 2, triceps 2, arms 2, upper body 5.
 * Mode `weights`, place `gym` only (every session uses at least one machine, cable or barbell).
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ Chest
  {
    id: 'chest_gym_machine_basics',
    name: { en: 'Machine Chest Basics', he: 'יסודות חזה במכונות' },
    description: {
      en: 'A gentle first chest session: a machine press, an incline dumbbell press, a cable fly and incline push-ups. Straight sets with moderate rest, built for learning the movements.',
      he: 'אימון חזה עדין למתחילים: לחיצה במכונה, לחיצה בשיפוע חיובי במשקולות יד, פרפר בכבלים ושכיבות סמיכה בידיים מוגבהות. סטים רגילים עם מנוחה בינונית, כדי ללמוד את התנועות.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'machine_chest_press', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Set the seat so the handles are at mid-chest; shoulders down and back.', he: 'לכוון את המושב כך שהידיות באמצע החזה; כתפיים למטה ואחורה.' },
      },
      { exerciseId: 'incline_dumbbell_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'cable_chest_fly', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Soft elbows, as if hugging a large tree.', he: 'מרפקים כפופים מעט, כמו חיבוק של עץ גדול.' },
      },
      { exerciseId: 'incline_push_up', sets: 2, reps: [8, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'chest_gym_smith_press_and_fly',
    name: { en: 'Smith Press and Fly', he: 'לחיצת סמית׳ ופרפר' },
    description: {
      en: 'A beginner chest session that moves from a fixed-path bar press to push-ups, assisted dips and a dumbbell fly. Straight sets, three sets or fewer per exercise.',
      he: 'אימון חזה למתחילים שעובר מלחיצה במסלול קבוע במכונת סמית׳ לשכיבות סמיכה, מקבילים בעזרת גומייה ופרפר במשקולות יד. סטים רגילים, עד שלושה סטים לתרגיל.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'smith_machine_bench_press', sets: 3, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Set the safety stops before the first set and lower to mid-chest.', he: 'לקבוע את הבלמים לפני הסט הראשון ולהוריד עד אמצע החזה.' },
      },
      { exerciseId: 'push_up', sets: 3, reps: [6, 12], restSeconds: 60 },
      {
        exerciseId: 'band_assisted_dip', sets: 2, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Lean slightly forward and stop at a depth that feels comfortable for the shoulders.', he: 'להישען מעט קדימה ולעצור בעומק שנוח לכתפיים.' },
      },
      {
        exerciseId: 'dumbbell_fly', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Keep a slight bend in the elbows and stretch only as far as is comfortable.', he: 'לשמור על כפיפה קלה במרפקים ולהימתח רק עד גבול נוח.' },
      },
    ],
  },
  {
    id: 'chest_gym_barbell_incline_builder',
    name: { en: 'Barbell and Incline Builder', he: 'לחיצת מוט ושיפוע חיובי' },
    description: {
      en: 'Intermediate chest day led by a barbell bench press, followed by an incline dumbbell press, a dumbbell fly and a push-up burnout. Straight sets with moderate to heavy loads.',
      he: 'יום חזה בינוני שנפתח בלחיצת חזה במוט, ממשיך בלחיצה בשיפוע חיובי במשקולות יד ופרפר, ונסגר בשכיבות סמיכה עד קושי. סטים רגילים עם משקלים בינוניים עד כבדים.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_bench_press', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Shoulder blades pinched, feet planted; use the safeties or a spotter.', he: 'השכמות צמודות, כפות הרגליים יציבות; להשתמש בבלמים או במאבטח.' },
      },
      { exerciseId: 'incline_dumbbell_press', sets: 4, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'dumbbell_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'push_up', sets: 3, reps: [10, 20], restSeconds: 45,
        cue: { en: 'Stop two reps before your form breaks down.', he: 'לעצור שתי חזרות לפני שהטכניקה נשברת.' },
      },
    ],
  },
  {
    id: 'chest_gym_upper_chest_focus',
    name: { en: 'Upper Chest Focus', he: 'דגש על החזה העליון' },
    description: {
      en: 'Intermediate session that leads with an incline barbell press, then a flat dumbbell press, decline push-ups, a cable fly and a machine press to finish. Straight sets, moderate rest.',
      he: 'אימון בינוני שפותח בלחיצה בשיפוע חיובי במוט, ממשיך בלחיצת חזה במשקולות יד, שכיבות סמיכה ברגליים מוגבהות ופרפר בכבלים, ונסגר בלחיצה במכונה. סטים רגילים ומנוחה בינונית.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'incline_barbell_bench_press', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Lower the bar to the upper chest with control; no bouncing.', he: 'להוריד את המוט לחזה העליון בשליטה, בלי לקפוץ.' },
      },
      { exerciseId: 'dumbbell_bench_press', sets: 3, reps: [8, 12], restSeconds: 75 },
      {
        exerciseId: 'decline_push_up', sets: 3, reps: [10, 15], restSeconds: 60,
        cue: { en: 'Feet on a bench, body in one straight line.', he: 'הרגליים על ספסל, הגוף בקו ישר אחד.' },
      },
      { exerciseId: 'cable_chest_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'machine_chest_press', sets: 2, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'chest_gym_heavy_bench_archer',
    name: { en: 'Heavy Bench and Archer Push-ups', he: 'לחיצה כבדה ושכיבות סמיכה קשת' },
    description: {
      en: 'Advanced chest session: heavy barbell bench sets, an incline press, dips and archer push-ups for one-sided strength, closing with a cable fly. Longer rests, quality reps only.',
      he: 'אימון חזה למתקדמים: סטים כבדים של לחיצת חזה במוט, לחיצה בשיפוע חיובי, מקבילים ושכיבות סמיכה קשת לכוח חד-צדדי, ופרפר בכבלים לסיום. מנוחות ארוכות, חזרות איכותיות בלבד.',
    },
    focus: 'chest',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_bench_press', sets: 5, reps: [5, 8], restSeconds: 120,
        cue: { en: 'Use the safeties or a spotter and stop one rep before your form changes.', he: 'להשתמש בבלמים או במאבטח ולעצור חזרה אחת לפני שהטכניקה משתנה.' },
      },
      { exerciseId: 'incline_dumbbell_press', sets: 4, reps: [6, 10], restSeconds: 90 },
      { exerciseId: 'parallel_bar_dip', sets: 4, reps: [8, 12], restSeconds: 90 },
      {
        exerciseId: 'archer_push_up', sets: 3, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Keep the straight arm long and lower toward the working hand only as far as you can control.', he: 'להשאיר את היד הישרה ארוכה ולרדת לכיוון היד העובדת רק עד גבול השליטה.' },
      },
      { exerciseId: 'cable_chest_fly', sets: 3, reps: [10, 12], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Back
  {
    id: 'back_gym_cable_basics',
    name: { en: 'Cable Back Basics', he: 'יסודות גב בכבלים' },
    description: {
      en: 'A beginner back session on the lat pulldown and cable row, with a one-arm dumbbell row, face pulls and a light lower-back finisher. Moderate rest and controlled pulling.',
      he: 'אימון גב למתחילים: פולי עליון וחתירה בפולי תחתון, חתירה חד-ידית במשקולת יד, פייס פול וסיום קל לגב התחתון. מנוחה בינונית ומשיכות מבוקרות.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'lat_pulldown', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Pull the bar to the upper chest and lead with the elbows.', he: 'למשוך את המוט אל החזה העליון ולהוביל עם המרפקים.' },
      },
      {
        exerciseId: 'seated_cable_row', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Sit tall and squeeze the shoulder blades together at the end.', he: 'לשבת זקוף ולסחוט את השכמות זו לזו בסוף התנועה.' },
      },
      { exerciseId: 'one_arm_dumbbell_row', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'face_pull', sets: 2, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'superman', sets: 2, reps: [8, 12], restSeconds: 45,
        cue: { en: 'Lift slowly, pause for a second and use a mat.', he: 'להרים לאט, לעצור לשנייה ולהשתמש בשטיח.' },
      },
    ],
  },
  {
    id: 'back_gym_assisted_pull_up_intro',
    name: { en: 'Assisted Pull-up Introduction', he: 'היכרות עם מתח בעזרת גומייה' },
    description: {
      en: 'A beginner session that builds toward the first pull-up: band-assisted pull-ups and inverted rows, with face pulls, rear delt flys and shrugs for shoulder-blade control.',
      he: 'אימון למתחילים שבונה את הדרך למתח הראשון: עליות מתח בעזרת גומייה ומתח אוסטרלי, עם פייס פול, פרפר הפוך והרמת כתפיים לשליטה בשכמות.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'band_assisted_pull_up', sets: 3, reps: [5, 8], restSeconds: 75,
        cue: { en: 'Pick the band that lets you finish every rep with control, with no swinging.', he: 'לבחור גומייה שמאפשרת לסיים כל חזרה בשליטה, בלי נדנוד.' },
      },
      {
        exerciseId: 'inverted_row', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Body in a straight line; pull the chest to the bar.', he: 'הגוף בקו ישר; למשוך את החזה אל המוט.' },
      },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'rear_delt_fly', sets: 2, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_shrug', sets: 2, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'back_gym_pull_up_and_rows',
    name: { en: 'Pull-ups and Rows', he: 'מתח וחתירות' },
    description: {
      en: 'Intermediate back day built around pull-ups, a one-arm dumbbell row and a seated cable row, finished with face pulls and shrugs for the upper back. Straight sets.',
      he: 'יום גב בינוני סביב עליות מתח, חתירה חד-ידית במשקולת יד וחתירה בפולי תחתון, עם פייס פול והרמת כתפיים לגב העליון בסיום. סטים רגילים.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'pull_up', sets: 4, reps: [5, 8], restSeconds: 90,
        cue: { en: 'Start each rep from a full hang and get the chin over the bar without kipping.', he: 'להתחיל כל חזרה מתלייה מלאה ולהעלות את הסנטר מעל המוט בלי נדנוד.' },
      },
      { exerciseId: 'one_arm_dumbbell_row', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'seated_cable_row', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_shrug', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'back_gym_barbell_row_lat_volume',
    name: { en: 'Barbell Row and Lat Volume', he: 'חתירה במוט וגב רחב' },
    description: {
      en: 'A higher-volume back session: barbell rows, lat pulldowns and inverted rows for width and thickness, then rear delt flys and supermans for the rear shoulders and lower back.',
      he: 'אימון גב עם נפח גבוה יותר: חתירה במוט, פולי עליון ומתח אוסטרלי לרוחב ולעובי הגב, ואז פרפר הפוך וסופרמן לכתף האחורית ולגב התחתון.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_bent_over_row', sets: 4, reps: [8, 10], restSeconds: 90,
        cue: { en: 'Hinge at the hips with a flat back and pull the bar to the lower ribs.', he: 'ציר בירכיים וגב ישר, למשוך את המוט לצלעות התחתונות.' },
      },
      { exerciseId: 'lat_pulldown', sets: 4, reps: [10, 12], restSeconds: 75 },
      { exerciseId: 'inverted_row', sets: 3, reps: [10, 15], restSeconds: 60 },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'back_gym_deadlift_chin_up',
    name: { en: 'Deadlift and Chin-up Day', he: 'יום דדליפט ועליות מתח באחיזה הפוכה' },
    description: {
      en: 'Intermediate back session that opens with deadlifts for the whole back chain, adds chin-ups and a seated cable row, and closes with face pulls and band pull-aparts.',
      he: 'אימון גב בינוני שנפתח בדדליפט לשרשרת הגב כולה, ממשיך בעליות מתח באחיזה הפוכה ובחתירה בפולי תחתון, ונסגר בפייס פול ובפתיחת גומייה.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'deadlift', sets: 3, reps: [6, 8], restSeconds: 90,
        cue: { en: 'Bar over mid-foot and a flat back; end the set if your back starts to round.', he: 'המוט מעל אמצע כף הרגל וגב ישר; לסיים את הסט אם הגב מתחיל להתעגל.' },
      },
      { exerciseId: 'chin_up', sets: 3, reps: [6, 10], restSeconds: 90 },
      { exerciseId: 'seated_cable_row', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_pull_apart', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'back_gym_muscle_up_heavy_pulls',
    name: { en: 'Heavy Pulls and Muscle-up Practice', he: 'משיכות כבדות ותרגול מאסל-אפ' },
    description: {
      en: 'Advanced pulling session: muscle-up practice while fresh, then heavy barbell rows, chin-ups and a cable row, finished with face pulls. Long rests and strict form.',
      he: 'אימון משיכה למתקדמים: תרגול מאסל-אפ בתחילת האימון כשהגוף רענן, ואז חתירה כבדה במוט, עליות מתח באחיזה הפוכה וחתירה בכבל, ופייס פול לסיום. מנוחות ארוכות וטכניקה קפדנית.',
    },
    focus: 'back',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'muscle_up', sets: 5, reps: [2, 4], restSeconds: 120,
        cue: { en: 'Only with strong strict pull-ups and dips; stop the set when the kip gets sloppy.', he: 'רק עם מתח ומקבילים קפדניים וחזקים; לעצור את הסט כשהנדנוד נהיה לא מבוקר.' },
      },
      {
        exerciseId: 'barbell_bent_over_row', sets: 5, reps: [5, 8], restSeconds: 120,
        cue: { en: 'Flat back and a still torso; pull to the lower ribs.', he: 'גב ישר וגו יציב; למשוך לצלעות התחתונות.' },
      },
      { exerciseId: 'chin_up', sets: 4, reps: [6, 10], restSeconds: 90 },
      { exerciseId: 'seated_cable_row', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Shoulders
  {
    id: 'shoulders_gym_press_basics',
    name: { en: 'Shoulder Press Basics', he: 'יסודות לחיצת כתפיים' },
    description: {
      en: 'A beginner shoulder session: a dumbbell press, cable lateral raises, rear delt flys and shrugs. Light to moderate loads, three sets or fewer and moderate rest.',
      he: 'אימון כתפיים למתחילים: לחיצת כתפיים במשקולות יד, הרחקה לצד בכבל, פרפר הפוך והרמת כתפיים. משקלים קלים עד בינוניים, עד שלושה סטים לתרגיל ומנוחה בינונית.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: [10, 12], restSeconds: 75,
        cue: { en: 'Ribs down; press straight up without arching the lower back.', he: 'הצלעות למטה; ללחוץ ישר למעלה בלי לקמר את הגב התחתון.' },
      },
      { exerciseId: 'cable_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_shrug', sets: 2, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'shoulders_gym_side_raise_face_pull',
    name: { en: 'Side Raise and Face Pull', he: 'הרחקה לצד ופייס פול' },
    description: {
      en: 'A beginner session for the side and rear shoulders: a light dumbbell press, lateral raises, face pulls and band pull-aparts. Higher reps and a controlled tempo.',
      he: 'אימון למתחילים לכתף הצדדית והאחורית: לחיצת כתפיים קלה במשקולות יד, הרחקות לצדדים, פייס פול ופתיחת גומייה. חזרות גבוהות יחסית וקצב מבוקר.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      { exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: [12, 15], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Lead with the elbows and raise only to shoulder height.', he: 'להוביל עם המרפקים ולהרים רק עד גובה הכתפיים.' },
      },
      {
        exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Pull toward the face with the elbows high and pause for a second.', he: 'למשוך לכיוון הפנים עם מרפקים גבוהים ולעצור לשנייה.' },
      },
      { exerciseId: 'band_pull_apart', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'shoulders_gym_barbell_overhead_day',
    name: { en: 'Barbell Overhead Press Day', he: 'יום לחיצת כתפיים עם מוט' },
    description: {
      en: 'Intermediate shoulder session led by the standing barbell overhead press, followed by lateral raises, rear delt flys, face pulls and shrugs for the side and rear shoulders and the traps.',
      he: 'אימון כתפיים בינוני שנפתח בלחיצת כתפיים עם מוט בעמידה, וממשיך בהרחקות לצדדים, פרפר הפוך, פייס פול והרמת כתפיים לכתף הצדדית והאחורית ולטרפז.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_overhead_press', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Glutes and abs tight; press the bar straight up past the face.', he: 'ישבן ובטן מכווצים; ללחוץ את המוט ישר למעלה לצד הפנים.' },
      },
      { exerciseId: 'dumbbell_lateral_raise', sets: 4, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_shrug', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'shoulders_gym_arnold_cable_raises',
    name: { en: 'Arnold Press and Cable Raises', he: 'לחיצת ארנולד והרחקות בכבל' },
    description: {
      en: 'Intermediate shoulder session with the Arnold press and pike push-ups for pressing volume, then cable lateral raises, face pulls and rear delt flys. Moderate rest and a controlled tempo.',
      he: 'אימון כתפיים בינוני עם לחיצת ארנולד ושכיבות סמיכה פייק לנפח לחיצות, ואחריהן הרחקות לצד בכבל, פייס פול ופרפר הפוך. מנוחה בינונית וקצב מבוקר.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'arnold_press', sets: 4, reps: [8, 12], restSeconds: 75,
        cue: { en: 'Rotate smoothly as you press and keep the shoulders away from the ears.', he: 'לסובב בהדרגה תוך כדי הלחיצה ולהרחיק את הכתפיים מהאוזניים.' },
      },
      {
        exerciseId: 'pike_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Hips high, head moves between the hands; keep the neck relaxed.', he: 'אגן גבוה, הראש יורד בין הידיים; הצוואר רפוי.' },
      },
      { exerciseId: 'cable_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'shoulders_gym_kettlebell_band_endurance',
    name: { en: 'Kettlebell and Band Shoulders', he: 'כתפיים עם קטלבל וגומיות' },
    description: {
      en: 'A one-sided kettlebell overhead press, pike push-ups, band lateral raises and pull-aparts, finished with face pulls. Shorter rests and higher reps for shoulder endurance and stability.',
      he: 'לחיצת קטלבל חד-צדדית מעל הראש, שכיבות סמיכה פייק, הרחקות ופתיחות עם גומייה ופייס פול לסיום. מנוחות קצרות וחזרות גבוהות לסיבולת וליציבות הכתף.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'kettlebell_overhead_press', sets: 4, reps: [6, 10], restSeconds: 75,
        cue: { en: 'Press straight up with a straight wrist, a tight core and no leaning back.', he: 'ללחוץ ישר למעלה עם שורש כף יד ישר, בטן מכווצת ובלי להישען אחורה.' },
      },
      { exerciseId: 'pike_push_up', sets: 3, reps: [8, 12], restSeconds: 45 },
      { exerciseId: 'band_lateral_raise', sets: 3, reps: [15, 20], restSeconds: 30 },
      { exerciseId: 'band_pull_apart', sets: 3, reps: [15, 20], restSeconds: 30 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'shoulders_gym_heavy_press_handstand',
    name: { en: 'Heavy Press and Handstand Push-ups', he: 'לחיצה כבדה ושכיבות סמיכה בעמידת ידיים' },
    description: {
      en: 'Advanced shoulder session: wall handstand push-ups while fresh, then a heavy barbell overhead press, Arnold presses, cable lateral raises, face pulls and shrugs. Long rests on the main lifts.',
      he: 'אימון כתפיים למתקדמים: שכיבות סמיכה בעמידת ידיים על הקיר כשהגוף רענן, ואז לחיצת כתפיים כבדה עם מוט, לחיצת ארנולד, הרחקות בכבל, פייס פול והרמת כתפיים. מנוחות ארוכות בתרגילים המרכזיים.',
    },
    focus: 'shoulders',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'wall_handstand_push_up', sets: 4, reps: [4, 8], restSeconds: 120,
        cue: { en: 'Put a mat under the head or use a partial range; keep the lower back neutral.', he: 'להניח מזרן מתחת לראש או לעבוד בטווח חלקי; הגב התחתון נשאר ניטרלי.' },
      },
      {
        exerciseId: 'barbell_overhead_press', sets: 5, reps: [5, 8], restSeconds: 120,
        cue: { en: 'Brace hard, press straight up and stop one rep before your form changes.', he: 'לנעול בטן וישבן, ללחוץ ישר למעלה ולעצור חזרה אחת לפני שהטכניקה משתנה.' },
      },
      { exerciseId: 'arnold_press', sets: 3, reps: [8, 10], restSeconds: 90 },
      { exerciseId: 'cable_lateral_raise', sets: 4, reps: [10, 15], restSeconds: 45 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_shrug', sets: 3, reps: [8, 12], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Biceps
  {
    id: 'biceps_gym_curl_basics',
    name: { en: 'Biceps Curl Basics', he: 'יסודות לשריר הדו-ראשי' },
    description: {
      en: 'A beginner biceps session: dumbbell, hammer and cable curls, plus a farmer carry for grip. Controlled reps with no swinging and moderate rest.',
      he: 'אימון דו-ראשי למתחילים: כפיפות במשקולות יד, פטישים וכפיפות בכבל, וסיום בהליכת חקלאי לחיזוק האחיזה. חזרות מבוקרות בלי נדנוד ומנוחה בינונית.',
    },
    focus: 'biceps',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'dumbbell_curl', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Elbows stay at your sides; lower for a slow count of three.', he: 'המרפקים צמודים לגוף; להוריד לאט, בספירה של שלוש.' },
      },
      { exerciseId: 'hammer_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'cable_biceps_curl', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'farmer_carry', sets: 2, seconds: 30, restSeconds: 60 },
    ],
  },
  {
    id: 'biceps_gym_chin_up_barbell_curl',
    name: { en: 'Chin-ups and Barbell Curls', he: 'עליות מתח באחיזה הפוכה וכפיפות במוט' },
    description: {
      en: 'Intermediate biceps session: chin-ups first while fresh, then barbell, hammer and cable curls with a band finisher. Straight sets with moderate rest.',
      he: 'אימון דו-ראשי בינוני: עליות מתח באחיזה הפוכה בתחילת האימון, אחריהן כפיפות במוט, פטישים וכפיפות בכבל, וסיום עם גומייה. סטים רגילים ומנוחה בינונית.',
    },
    focus: 'biceps',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      { exerciseId: 'chin_up', sets: 4, reps: [5, 8], restSeconds: 90 },
      {
        exerciseId: 'barbell_curl', sets: 4, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Keep the elbows pinned and do not swing from the hips.', he: 'המרפקים צמודים לגוף, בלי נדנוד מהירכיים.' },
      },
      { exerciseId: 'hammer_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'cable_biceps_curl', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'band_biceps_curl', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },

  // ------------------------------------------------------------------ Triceps
  {
    id: 'triceps_gym_pushdown_basics',
    name: { en: 'Triceps Pushdown Basics', he: 'יסודות לשריר התלת-ראשי' },
    description: {
      en: 'A beginner triceps session: assisted dips and a dumbbell floor press for the heavier work, then overhead dumbbell extensions and cable pushdowns. Controlled elbows throughout.',
      he: 'אימון תלת-ראשי למתחילים: מקבילים בעזרת גומייה ולחיצה מהרצפה במשקולות יד לעבודה הכבדה יותר, ואז פשיטת מרפקים מעל הראש ופשיטה בפולי עליון. שליטה במרפקים לאורך כל האימון.',
    },
    focus: 'triceps',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'band_assisted_dip', sets: 3, reps: [6, 10], restSeconds: 75,
        cue: { en: 'Lean slightly forward with the elbows pointing back; go only as deep as feels comfortable.', he: 'להישען מעט קדימה כשהמרפקים מצביעים אחורה; לרדת רק עד עומק נוח.' },
      },
      {
        exerciseId: 'dumbbell_floor_press', sets: 3, reps: [10, 12], restSeconds: 75,
        cue: { en: 'Elbows about 45 degrees from the body; let the upper arms touch the floor lightly.', he: 'מרפקים בזווית של כ-45 מעלות מהגוף; לתת לזרועות העליונות לגעת ברצפה בקלילות.' },
      },
      { exerciseId: 'overhead_dumbbell_triceps_extension', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'triceps_pushdown', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'triceps_gym_close_grip_skull_crusher',
    name: { en: 'Close-Grip Press and Skull Crushers', he: 'לחיצה באחיזה צרה וסקאל קראשר' },
    description: {
      en: 'Intermediate triceps session: close-grip bench press and parallel bar dips for the heavy pressing, then EZ-bar skull crushers, overhead extensions and cable pushdowns. Straight sets.',
      he: 'אימון תלת-ראשי בינוני: לחיצת חזה באחיזה צרה ומקבילים ללחיצות הכבדות, ואחריהם סקאל קראשר עם מוט EZ, פשיטה מעל הראש ופשיטה בפולי עליון. סטים רגילים.',
    },
    focus: 'triceps',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'close_grip_bench_press', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Hands about shoulder-width, elbows tucked; lower to the lower chest.', he: 'הידיים ברוחב כתפיים בערך, מרפקים צמודים; להוריד לחלק התחתון של החזה.' },
      },
      { exerciseId: 'parallel_bar_dip', sets: 3, reps: [8, 12], restSeconds: 75 },
      {
        exerciseId: 'ez_bar_skull_crusher', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Upper arms stay still; only the elbows move.', he: 'הזרועות העליונות נשארות במקום; רק המרפקים נעים.' },
      },
      { exerciseId: 'overhead_dumbbell_triceps_extension', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'triceps_pushdown', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Arms
  {
    id: 'arms_gym_alternating_basics',
    name: { en: 'Arm Day Basics', he: 'יסודות לאימון ידיים' },
    description: {
      en: 'A beginner arm session that alternates biceps and triceps: dumbbell curls, cable pushdowns, hammer curls and overhead extensions. Straight sets with moderate rest.',
      he: 'אימון ידיים למתחילים שמחליף בין דו-ראשי לתלת-ראשי: כפיפות במשקולות יד, פשיטה בפולי עליון, פטישים ופשיטה מעל הראש. סטים רגילים ומנוחה בינונית.',
    },
    focus: 'arms',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'dumbbell_curl', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Keep the elbows at your sides and lower slowly.', he: 'המרפקים צמודים לגוף, להוריד לאט.' },
      },
      { exerciseId: 'triceps_pushdown', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'hammer_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'overhead_dumbbell_triceps_extension', sets: 3, reps: [10, 12], restSeconds: 60 },
    ],
  },
  {
    id: 'arms_gym_chin_dip_strength',
    name: { en: 'Arm Strength with Chins and Dips', he: 'כוח ידיים עם מתח ומקבילים' },
    description: {
      en: 'Intermediate arm session: chin-ups and dips as the main lifts, then barbell curls, skull crushers, cable curls and pushdowns. Biceps and triceps alternate throughout.',
      he: 'אימון ידיים בינוני: עליות מתח באחיזה הפוכה ומקבילים כתרגילים המרכזיים, ואז כפיפות במוט, סקאל קראשר, כפיפות בכבל ופשיטה בפולי עליון. מתחלפים בין דו-ראשי לתלת-ראשי.',
    },
    focus: 'arms',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      { exerciseId: 'chin_up', sets: 3, reps: [6, 10], restSeconds: 90 },
      { exerciseId: 'parallel_bar_dip', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'barbell_curl', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'ez_bar_skull_crusher', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Upper arms stay still; lower the bar under control.', he: 'הזרועות העליונות נשארות במקום; להוריד את המוט בשליטה.' },
      },
      { exerciseId: 'cable_biceps_curl', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'triceps_pushdown', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Upper body
  {
    id: 'upper_body_gym_push_pull_basics',
    name: { en: 'Upper Body Push-Pull Basics', he: 'יסודות לפלג גוף עליון' },
    description: {
      en: 'A beginner upper-body session that alternates pushing and pulling: machine chest press, lat pulldown, dumbbell shoulder press and cable row, with a triceps and biceps finisher.',
      he: 'אימון פלג גוף עליון למתחילים שמחליף בין דחיפה למשיכה: לחיצת חזה במכונה, פולי עליון, לחיצת כתפיים וחתירה בכבל, עם סיום לתלת-ראשי ולדו-ראשי.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'machine_chest_press', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Shoulders down and back; press without locking the elbows hard.', he: 'כתפיים למטה ואחורה; ללחוץ בלי לנעול את המרפקים בכוח.' },
      },
      { exerciseId: 'lat_pulldown', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: [10, 12], restSeconds: 75 },
      {
        exerciseId: 'seated_cable_row', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Sit tall and pull the elbows back; do not rock the torso.', he: 'לשבת זקוף ולמשוך את המרפקים אחורה; בלי לנדנד את הגו.' },
      },
      { exerciseId: 'triceps_pushdown', sets: 2, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_curl', sets: 2, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_gym_barbell_push_pull',
    name: { en: 'Barbell Push-Pull Strength', he: 'כוח דחיפה ומשיכה במוט' },
    description: {
      en: 'Intermediate upper-body session built on a barbell bench press and a barbell row, backed by a dumbbell shoulder press, a lat pulldown and triceps and biceps work. Straight sets.',
      he: 'אימון פלג גוף עליון בינוני שנשען על לחיצת חזה וחתירה במוט, עם לחיצת כתפיים, פולי עליון ועבודה לתלת-ראשי ולדו-ראשי. סטים רגילים.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_bench_press', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Feet planted and shoulder blades pinched; use the safeties or a spotter.', he: 'כפות הרגליים יציבות והשכמות צמודות; להשתמש בבלמים או במאבטח.' },
      },
      {
        exerciseId: 'barbell_bent_over_row', sets: 4, reps: [6, 10], restSeconds: 90,
        cue: { en: 'Flat back; pull the bar to the lower ribs.', he: 'גב ישר; למשוך את המוט לצלעות התחתונות.' },
      },
      { exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'lat_pulldown', sets: 3, reps: [10, 12], restSeconds: 75 },
      { exerciseId: 'triceps_pushdown', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'cable_biceps_curl', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_gym_dips_chins_cables',
    name: { en: 'Dips, Chins and Cables', he: 'מקבילים, מתח וכבלים' },
    description: {
      en: 'Intermediate upper-body session with shorter rests: dips and chin-ups first, then an incline dumbbell press, cable row, cable lateral raises and face pulls. Pushing and pulling stay balanced.',
      he: 'אימון פלג גוף עליון בינוני עם מנוחות קצרות יותר: מקבילים ועליות מתח בהתחלה, ואחריהם לחיצה בשיפוע חיובי, חתירה בכבל, הרחקות בכבל ופייס פול. איזון בין דחיפה למשיכה.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      { exerciseId: 'parallel_bar_dip', sets: 3, reps: [8, 12], restSeconds: 60 },
      {
        exerciseId: 'chin_up', sets: 3, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Full hang at the bottom and chin over the bar at the top.', he: 'תלייה מלאה בתחתית וסנטר מעל המוט בשיא.' },
      },
      { exerciseId: 'incline_dumbbell_press', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'seated_cable_row', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'cable_lateral_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_gym_heavy_barbell_archer',
    name: { en: 'Heavy Barbell Upper Body', he: 'פלג גוף עליון כבד עם מוט' },
    description: {
      en: 'Advanced upper-body session: heavy barbell bench press and rows, chin-ups, archer push-ups for one-sided pressing strength and face pulls to balance the shoulders. Long rests on the main lifts.',
      he: 'אימון פלג גוף עליון למתקדמים: לחיצת חזה וחתירה כבדות במוט, עליות מתח באחיזה הפוכה, שכיבות סמיכה קשת לכוח לחיצה חד-צדדי ופייס פול לאיזון הכתפיים. מנוחות ארוכות בתרגילים המרכזיים.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_bench_press', sets: 5, reps: [5, 8], restSeconds: 120,
        cue: { en: 'Use the safeties or a spotter and stop one rep before your form changes.', he: 'להשתמש בבלמים או במאבטח ולעצור חזרה אחת לפני שהטכניקה משתנה.' },
      },
      {
        exerciseId: 'barbell_bent_over_row', sets: 5, reps: [5, 8], restSeconds: 120,
        cue: { en: 'Flat back and a still torso; pull to the lower ribs.', he: 'גב ישר וגו יציב; למשוך לצלעות התחתונות.' },
      },
      { exerciseId: 'chin_up', sets: 4, reps: [6, 10], restSeconds: 90 },
      { exerciseId: 'archer_push_up', sets: 3, reps: [5, 8], restSeconds: 90 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_gym_muscle_up_strength',
    name: { en: 'Muscle-up Skill and Strength', he: 'מאסל-אפ וכוח לפלג גוף עליון' },
    description: {
      en: 'Advanced upper-body session that starts with muscle-up practice while fresh, then an incline barbell press, cable row, Arnold press, lat pulldown and cable pushdowns. Pushing and pulling stay balanced.',
      he: 'אימון פלג גוף עליון למתקדמים שפותח בתרגול מאסל-אפ כשהגוף רענן, וממשיך בלחיצה בשיפוע חיובי במוט, חתירה בכבל, לחיצת ארנולד, פולי עליון ופשיטה בפולי עליון. איזון בין דחיפה למשיכה.',
    },
    focus: 'upper_body',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'muscle_up', sets: 4, reps: [2, 4], restSeconds: 120,
        cue: { en: 'Only with strong strict pull-ups and dips; stop the set when the kip gets sloppy.', he: 'רק עם מתח ומקבילים קפדניים וחזקים; לעצור את הסט כשהנדנוד נהיה לא מבוקר.' },
      },
      { exerciseId: 'incline_barbell_bench_press', sets: 4, reps: [6, 8], restSeconds: 90 },
      { exerciseId: 'seated_cable_row', sets: 4, reps: [8, 10], restSeconds: 90 },
      { exerciseId: 'arnold_press', sets: 3, reps: [8, 10], restSeconds: 90 },
      { exerciseId: 'lat_pulldown', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'triceps_pushdown', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
];
