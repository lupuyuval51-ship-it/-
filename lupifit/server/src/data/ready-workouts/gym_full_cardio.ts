import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Gym workouts for the whole body (8) and gym cardio (2).
 * Cardio is bodyweight mode on purpose: no exercise in the library is both externally loaded and conditioning,
 * so a cardio session cannot satisfy the "weights" rule (half the exercises loaded) and the 60% conditioning rule.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ full body, beginner
  {
    id: 'full_body_gym_machine_basics',
    name: { en: 'Machine Full Body', he: 'כל הגוף על מכונות' },
    description: {
      en: 'Fixed-path machines for legs, chest, back and hamstrings, then a plank for the core. Straight sets on stable equipment make it a calm, controlled way to start in the gym.',
      he: 'מכונות עם מסלול קבוע לרגליים, לחזה, לגב ולירך האחורית, ובסיום פלאנק לליבה. סטים רגילים על ציוד יציב הם דרך רגועה ומבוקרת להתחיל בחדר הכושר.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'leg_press',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Feet shoulder-width apart, knees in line with the toes, no locking out at the top.',
          he: 'כפות הרגליים ברוחב כתפיים, הברכיים בכיוון הבהונות, בלי לנעול ברכיים בחלק העליון.',
        },
      },
      { exerciseId: 'machine_chest_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'lat_pulldown',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Pull the bar to the upper chest and lead with the elbows.',
          he: 'למשוך את המוט לחזה העליון ולהוביל עם המרפקים.',
        },
      },
      { exerciseId: 'lying_leg_curl', sets: 2, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'plank',
        sets: 3,
        seconds: 30,
        restSeconds: 45,
        cue: {
          en: 'Straight line from head to heels, ribs pulled down, steady breathing.',
          he: 'קו ישר מהראש ועד העקבים, הצלעות נמשכות כלפי מטה, נשימה קבועה.',
        },
      },
    ],
  },
  {
    id: 'full_body_gym_dumbbell_cable_basics',
    name: { en: 'Dumbbell and Cable Basics', he: 'יסודות במשקולות יד ובכבלים' },
    description: {
      en: 'Dumbbells and a cable for the whole body: goblet squat, chest press, row, Romanian deadlift and an anti-rotation core move. Three sets at most with moderate reps to learn the patterns with free weights.',
      he: 'משקולות יד וכבל לכל הגוף: גובלט סקוואט, לחיצת חזה, חתירה, דדליפט רומני ותרגיל ליבה נגד סיבוב. עד שלושה סטים ומספר חזרות בינוני כדי ללמוד את תבניות התנועה עם משקולות חופשיות.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'goblet_squat',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Hold the dumbbell at the chest; at the bottom the elbows sit between the knees.',
          he: 'המשקולת צמודה לחזה; בתחתית המרפקים נמצאים בין הברכיים.',
        },
      },
      { exerciseId: 'dumbbell_bench_press', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'seated_cable_row',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Chest up, squeeze the shoulder blades together at the end of each pull.',
          he: 'החזה פתוח, בסוף כל משיכה לסחוט את השכמות זו לזו.',
        },
      },
      {
        exerciseId: 'dumbbell_romanian_deadlift',
        sets: 2,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Push the hips back with a flat back; the dumbbells slide along the thighs.',
          he: 'להסיט את האגן לאחור בגב ישר; המשקולות גולשות לאורך הירכיים.',
        },
      },
      { exerciseId: 'pallof_press', sets: 2, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_gym_smith_foundation',
    name: { en: 'Smith Machine Foundations', he: 'יסודות עם מכונת סמית׳' },
    description: {
      en: 'A fixed bar path on the Smith machine for squat and bench press, then a one-arm dumbbell row, a cable hip hinge and a dead bug. Easy to adjust and a controlled way to practise the basic patterns.',
      he: 'מסלול מוט קבוע במכונת סמית׳ לסקוואט וללחיצת חזה, ואחריהם חתירה חד-ידית, פול ת׳רו בכבל ודד באג. קל לכוונון ודרך מבוקרת לתרגל את תבניות התנועה הבסיסיות.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'smith_machine_squat',
        sets: 3,
        reps: [10, 12],
        restSeconds: 75,
        cue: {
          en: 'Feet slightly in front of the bar, whole foot flat on the floor.',
          he: 'כפות הרגליים מעט לפני המוט, כל כף הרגל נשארת על הרצפה.',
        },
      },
      { exerciseId: 'smith_machine_bench_press', sets: 3, reps: [10, 12], restSeconds: 75 },
      {
        exerciseId: 'one_arm_dumbbell_row',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Flat back, pull the elbow toward the hip, no twisting of the torso.',
          he: 'גב ישר, למשוך את המרפק לכיוון הירך, בלי לסובב את פלג הגוף העליון.',
        },
      },
      { exerciseId: 'cable_pull_through', sets: 2, reps: [12, 15], restSeconds: 60 },
      {
        exerciseId: 'dead_bug',
        sets: 2,
        reps: [8, 10],
        restSeconds: 45,
        cue: {
          en: 'Keep the lower back gently pressed into the floor and move slowly.',
          he: 'להצמיד את הגב התחתון בעדינות לרצפה ולנוע לאט.',
        },
      },
    ],
  },

  // ------------------------------------------------------------------ full body, intermediate
  {
    id: 'full_body_gym_barbell_essentials',
    name: { en: 'Barbell Essentials', he: 'יסודות המוט' },
    description: {
      en: 'A classic barbell session: squat, bench press, bent-over row and overhead press for the whole body, then hanging knee raises. Three to four sets of 8-10 reps with full rests; suits lifters who already know the lifts.',
      he: 'אימון קלאסי עם מוט: סקוואט, לחיצת חזה, חתירה בהטיה ולחיצת כתפיים לכל הגוף, ובסוף הרמות ברכיים בתלייה. שלושה עד ארבעה סטים של 8–10 חזרות ומנוחות מלאות. מתאים למי שכבר מכיר את התרגילים.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_back_squat',
        sets: 4,
        reps: [8, 10],
        restSeconds: 90,
        cue: {
          en: 'Brace the core before every rep and keep the knees in line with the toes.',
          he: 'לנעול את הבטן לפני כל חזרה ולשמור על הברכיים בכיוון הבהונות.',
        },
      },
      {
        exerciseId: 'barbell_bench_press',
        sets: 3,
        reps: [8, 10],
        restSeconds: 90,
        cue: {
          en: 'Shoulder blades pinched, feet planted, bar to mid-chest.',
          he: 'השכמות צמודות, כפות הרגליים יציבות, המוט יורד לאמצע החזה.',
        },
      },
      {
        exerciseId: 'barbell_bent_over_row',
        sets: 3,
        reps: [8, 10],
        restSeconds: 75,
        cue: {
          en: 'Hinge to about 45 degrees, flat back, pull the bar to the belly.',
          he: 'הטיה של כ־45 מעלות, גב ישר, למשוך את המוט אל הבטן.',
        },
      },
      { exerciseId: 'barbell_overhead_press', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'hanging_knee_raise', sets: 3, reps: [10, 15], restSeconds: 60 },
    ],
  },
  {
    id: 'full_body_gym_hinge_lunge',
    name: { en: 'Hinge and Lunge Day', he: 'יום ציר ירך ומכרעים' },
    description: {
      en: 'Built around the Romanian deadlift and reverse lunges for the legs and hips, with an incline press, a pulldown and two core moves. Straight sets of 8-12 reps with the heaviest work first.',
      he: 'בנוי סביב דדליפט רומני ומכרעים לאחור לרגליים ולאגן, עם לחיצה בשיפוע חיובי, משיכה עליונה ושני תרגילי ליבה. סטים של 8–12 חזרות, כשהעבודה הכבדה ביותר ראשונה.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'romanian_deadlift',
        sets: 4,
        reps: [8, 10],
        restSeconds: 90,
        cue: {
          en: 'Soft knees, hips back, the bar slides along the thighs; stop when the hamstrings tighten.',
          he: 'ברכיים מעט כפופות, האגן לאחור, המוט גולש על הירכיים; לעצור כשהירך האחורית נמתחת.',
        },
      },
      { exerciseId: 'incline_dumbbell_press', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'lat_pulldown', sets: 3, reps: [8, 12], restSeconds: 75 },
      {
        exerciseId: 'dumbbell_reverse_lunge',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Step back with an upright torso, front knee over the ankle.',
          he: 'צעד לאחור כשפלג הגוף העליון זקוף, הברך הקדמית מעל הקרסול.',
        },
      },
      { exerciseId: 'cable_woodchop', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'plank', sets: 3, seconds: 45, restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_gym_fast_pace',
    name: { en: 'Fast-Pace Full Body', he: 'כל הגוף בקצב מהיר' },
    description: {
      en: 'Seven exercises with 10-15 reps and only 45 seconds of rest keep the pace up: kettlebell swing and leg press for the legs, a chest press and an Arnold press, two pulls, and hanging knee raises for the core. Moderate weights.',
      he: 'שבעה תרגילים עם 10–15 חזרות ו־45 שניות מנוחה בלבד שומרים על קצב גבוה: קטלבל סווינג ולחיצת רגליים לרגליים, לחיצת חזה ולחיצת ארנולד, שתי משיכות והרמות ברכיים בתלייה לליבה. משקלים בינוניים.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'kettlebell_swing',
        sets: 4,
        reps: [12, 15],
        restSeconds: 45,
        cue: {
          en: 'The hips drive the swing and the arms only guide it; the bell floats to chest height.',
          he: 'הירכיים מניעות את התנועה והידיים רק מכוונות; הקטלבל מרחף עד גובה החזה.',
        },
      },
      { exerciseId: 'leg_press', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'machine_chest_press', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'lat_pulldown', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'arnold_press', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'seated_cable_row', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'hanging_knee_raise',
        sets: 3,
        reps: [12, 15],
        restSeconds: 45,
        cue: {
          en: 'Lift the knees with the abs and lower slowly, no swinging.',
          he: 'להרים את הברכיים בעזרת הבטן ולהוריד לאט, בלי נדנוד.',
        },
      },
    ],
  },

  // ------------------------------------------------------------------ full body, advanced
  {
    id: 'full_body_gym_front_squat_strength',
    name: { en: 'Front Squat Strength Day', he: 'יום כוח עם סקוואט קדמי' },
    description: {
      en: 'Heavy full-body strength for experienced lifters: front squat, incline barbell press, pull-ups, Romanian deadlift and hanging leg raises. Four sets of 6-8 reps on the big lifts with long rests; end every set short of failure.',
      he: 'אימון כוח כבד לכל הגוף למתאמנים מנוסים: סקוואט קדמי, לחיצת חזה בשיפוע חיובי במוט, עליות מתח, דדליפט רומני והרמות רגליים בתלייה. ארבעה סטים של 6–8 חזרות בתרגילים הגדולים ומנוחות ארוכות; לסיים כל סט לפני כישלון.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'front_squat',
        sets: 4,
        reps: [6, 8],
        restSeconds: 120,
        cue: {
          en: 'Elbows high and torso upright; lower the weight if the elbows start to drop.',
          he: 'מרפקים גבוהים ופלג גוף עליון זקוף; להקטין משקל אם המרפקים מתחילים לצנוח.',
        },
      },
      { exerciseId: 'incline_barbell_bench_press', sets: 4, reps: [6, 8], restSeconds: 105 },
      {
        exerciseId: 'pull_up',
        sets: 4,
        reps: [6, 10],
        restSeconds: 90,
        cue: {
          en: 'Full hang at the bottom, chin over the bar, no kipping.',
          he: 'תלייה מלאה בתחתית, סנטר מעל המוט, בלי נדנוד.',
        },
      },
      { exerciseId: 'romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 90 },
      {
        exerciseId: 'hanging_leg_raise',
        sets: 3,
        reps: [8, 12],
        restSeconds: 60,
        cue: {
          en: 'Lift with the abs and lower slowly without swinging.',
          he: 'להרים בעזרת הבטן ולהוריד לאט בלי להתנדנד.',
        },
      },
    ],
  },
  {
    id: 'full_body_gym_deadlift_dips_pulls',
    name: { en: 'Deadlift, Dips and Pull-Ups', he: 'דדליפט, מקבילים ועליות מתח' },
    description: {
      en: 'A strength session built on the deadlift, with parallel-bar dips, chin-ups, dumbbell reverse lunges, cable face pulls and an L-sit hold. Long rests on the heavy work; for lifters with a solid base in lifting and bar work.',
      he: 'אימון כוח סביב דדליפט, עם מקבילים, עליות מתח באחיזה הפוכה, מכרעים לאחור עם משקולות יד, פייס פול בכבל והחזקת אל-סיט. מנוחות ארוכות בעבודה הכבדה; למתאמנים עם בסיס מוצק בהרמות ובעבודה על מתח ומקבילים.',
    },
    focus: 'full_body',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'deadlift',
        sets: 4,
        reps: [5, 6],
        restSeconds: 120,
        cue: {
          en: 'Bar over mid-foot, lats tight, push the floor away; end the set if the back rounds.',
          he: 'המוט מעל אמצע כף הרגל, הלטים מתוחים, לדחוף את הרצפה; לסיים את הסט אם הגב מתעגל.',
        },
      },
      { exerciseId: 'parallel_bar_dip', sets: 4, reps: [8, 12], restSeconds: 90 },
      { exerciseId: 'chin_up', sets: 4, reps: [6, 10], restSeconds: 90 },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'face_pull', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'l_sit',
        sets: 4,
        seconds: 20,
        restSeconds: 60,
        cue: {
          en: 'Bend the knees if the legs sag; press the shoulders down, away from the ears.',
          he: 'לכופף ברכיים אם הרגליים צונחות; ללחוץ את הכתפיים מטה, הרחק מהאוזניים.',
        },
      },
    ],
  },

  // ------------------------------------------------------------------ cardio
  {
    id: 'cardio_gym_easy_machine_intervals',
    name: { en: 'Easy Machine Intervals', he: 'אינטרוולים קלים על מכשיר' },
    description: {
      en: 'Three one-minute efforts on a cardio machine of your choice with an easy minute between, then jumping jacks, squats, mountain climbers and a plank, finishing with a walk or easy jog. A pace where short sentences are still possible.',
      he: 'שלושה מאמצים של דקה על מכשיר אירובי לבחירה עם דקה קלה ביניהם, אחר כך קפיצות פיסוק, סקוואט, מטפס הרים ופלאנק, ובסיום הליכה או ריצה קלה. קצב שעדיין מאפשר לדבר במשפטים קצרים.',
    },
    focus: 'cardio',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'cardio_machine_intervals',
        sets: 3,
        seconds: 60,
        restSeconds: 60,
        cue: {
          en: 'Hard but controlled, on a treadmill, bike or rower. Slow to an easy pace in the rest.',
          he: 'מאמץ גבוה אך מבוקר, על הליכון, אופניים או מכשיר חתירה. במנוחה להאט לקצב קל.',
        },
      },
      { exerciseId: 'jumping_jack', sets: 3, seconds: 30, restSeconds: 45 },
      { exerciseId: 'bodyweight_squat', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'mountain_climber', sets: 3, seconds: 30, restSeconds: 45 },
      { exerciseId: 'plank', sets: 3, seconds: 30, restSeconds: 45 },
      {
        exerciseId: 'brisk_walk_jog',
        sets: 3,
        seconds: 60,
        restSeconds: 30,
        cue: {
          en: 'Slow the pace gradually so the heart rate comes down.',
          he: 'להאט בהדרגה כדי שהדופק ירד.',
        },
      },
    ],
  },
  {
    id: 'cardio_gym_machine_box_rope',
    name: { en: 'Machine, Box and Rope Intervals', he: 'אינטרוולים: מכשיר, ארגז וחבל' },
    description: {
      en: 'Four 90-second efforts on a cardio machine, then box jumps, burpees, rope skipping and mountain climbers in short work blocks, closed with hanging knee raises. High-impact: for people who are used to jumping.',
      he: 'ארבעה מאמצים של 90 שניות על מכשיר אירובי, ואחריהם קפיצות על ארגז, ברפי, קפיצה בחבל ומטפס הרים בבלוקי עבודה קצרים, ובסיום הרמות ברכיים בתלייה. עומס גבוה על המפרקים: מתאים למי שרגיל לקפוץ.',
    },
    focus: 'cardio',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'cardio_machine_intervals',
        sets: 4,
        seconds: 90,
        restSeconds: 60,
        cue: {
          en: 'Push hard but stay in control; in the rest slow to an easy pace.',
          he: 'מאמץ גבוה אך מבוקר; במנוחה להאט לקצב קל.',
        },
      },
      {
        exerciseId: 'box_jump',
        sets: 3,
        reps: [6, 8],
        restSeconds: 60,
        cue: {
          en: 'Land softly with bent knees and step down from the box instead of jumping down.',
          he: 'נחיתה רכה עם ברכיים כפופות, לרדת מהארגז בצעד ולא בקפיצה.',
        },
      },
      { exerciseId: 'burpee', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'jump_rope_skipping', sets: 4, seconds: 40, restSeconds: 30 },
      { exerciseId: 'mountain_climber', sets: 3, seconds: 40, restSeconds: 30 },
      { exerciseId: 'hanging_knee_raise', sets: 3, reps: [10, 15], restSeconds: 45 },
    ],
  },
];
