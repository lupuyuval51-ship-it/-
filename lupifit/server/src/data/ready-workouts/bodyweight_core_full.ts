import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Bodyweight abs, core and full-body ready workouts: abs 8 (6 with no equipment, 2 hanging from a bar),
 * core 5 and full body 8. Mode `bodyweight`; the no-equipment sessions can be done at home, in the park or at the gym.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ Abs, no equipment
  {
    id: 'abs_bodyweight_floor_foundations',
    name: { en: 'Floor Abs Foundations', he: 'יסודות הבטן על הרצפה' },
    description: {
      en: 'A first abs session on the floor: slow, controlled crunches, leg work and a short plank. Straight sets with generous rest, built for learning to brace the belly.',
      he: 'אימון בטן ראשון על הרצפה: כפיפות איטיות ומבוקרות, עבודת רגליים ופלאנק קצר. סטים רגילים עם מנוחה נוחה, כדי ללמוד לייצב את הבטן.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'dead_bug', sets: 3, reps: [6, 8], restSeconds: 60,
        cue: { en: 'Keep the lower back pressed into the floor the whole time.', he: 'לשמור על הגב התחתון צמוד לרצפה לאורך כל התנועה.' },
      },
      { exerciseId: 'crunch', sets: 3, reps: [10, 15], restSeconds: 45 },
      { exerciseId: 'reverse_crunch', sets: 3, reps: [8, 12], restSeconds: 45 },
      { exerciseId: 'heel_touch', sets: 2, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'plank', sets: 3, seconds: 20, restSeconds: 45,
        cue: { en: 'Straight line from head to heels; stop when the hips sag.', he: 'קו ישר מהראש ועד העקבים; להפסיק כשהאגן צונח.' },
      },
    ],
  },
  {
    id: 'abs_bodyweight_climber_leg_lowers',
    name: { en: 'Climbers and Leg Lowers', he: 'מטפסים והורדות רגליים' },
    description: {
      en: 'A beginner abs session that starts with a light mountain climber to wake up the belly, then moves to sit-ups, leg raises and a twist. Moderate rest, no holds beyond 30 seconds.',
      he: 'אימון בטן למתחילים שנפתח במטפס הרים קל להעיר את הבטן, ממשיך בסיט-אפ, הרמות רגליים וטוויסט. מנוחה בינונית וללא החזקות מעל 30 שניות.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'mountain_climber', sets: 3, seconds: 25, restSeconds: 45 },
      { exerciseId: 'sit_up', sets: 3, reps: [8, 12], restSeconds: 60 },
      {
        exerciseId: 'lying_leg_raise', sets: 3, reps: [8, 10], restSeconds: 60,
        cue: { en: 'Bend the knees slightly if the lower back lifts off the floor.', he: 'אם הגב התחתון מתרומם מהרצפה, לכופף מעט את הברכיים.' },
      },
      { exerciseId: 'russian_twist', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'streamline_hold', sets: 2, seconds: 20, restSeconds: 45 },
    ],
  },
  {
    id: 'abs_bodyweight_hollow_series',
    name: { en: 'Hollow Body Series', he: 'סדרת הולו בודי' },
    description: {
      en: 'A gymnastics-style abs session built around the hollow position: a held hollow, hollow rocks, V-ups, bicycle crunches and a side plank with hip dips. Straight sets, 45 seconds rest.',
      he: 'אימון בטן בסגנון התעמלות סביב עמדת הולו: החזקת הולו, הולו רוק, וי-אפ, כפיפות אופניים ופלאנק צידי עם הורדת אגן. סטים רגילים עם 45 שניות מנוחה.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'hollow_body_hold', sets: 4, seconds: 30, restSeconds: 45,
        cue: { en: 'Lower back stays flat; raise the legs only as high as you can keep it flat.', he: 'הגב התחתון נשאר שטוח; להרים את הרגליים רק לגובה שבו הגב נשאר שטוח.' },
      },
      { exerciseId: 'hollow_rock', sets: 3, reps: [10, 15], restSeconds: 45 },
      { exerciseId: 'v_up', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'bicycle_crunch', sets: 3, reps: [12, 16], restSeconds: 45 },
      { exerciseId: 'side_plank_hip_dip', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'abs_bodyweight_short_rest_burn',
    name: { en: 'Short-Rest Abs', he: 'בטן עם מנוחות קצרות' },
    description: {
      en: 'A dense abs session with only 20 to 30 seconds between sets: climbers, flutter kicks, reverse crunches, a high plank and bicycle crunches. Keep the pace steady and the form clean.',
      he: 'אימון בטן צפוף עם 20 עד 30 שניות בלבד בין הסטים: מטפס הרים, בעיטות רפרוף, כפיפות הפוכות, פלאנק גבוה וכפיפות אופניים. לשמור על קצב יציב וטכניקה נקייה.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'mountain_climber', sets: 3, seconds: 40, restSeconds: 20 },
      { exerciseId: 'reverse_crunch', sets: 3, reps: [15, 20], restSeconds: 25 },
      { exerciseId: 'flutter_kicks', sets: 3, seconds: 40, restSeconds: 20 },
      { exerciseId: 'bicycle_crunch', sets: 3, reps: [16, 20], restSeconds: 25 },
      { exerciseId: 'v_up', sets: 3, reps: [10, 15], restSeconds: 30 },
      {
        exerciseId: 'high_plank', sets: 3, seconds: 45, restSeconds: 30,
        cue: { en: 'Squeeze the glutes and push the floor away; do not let the belly drop.', he: 'לכווץ את הישבן ולדחוף את הרצפה; לא לתת לבטן לצנוח.' },
      },
    ],
  },
  {
    id: 'abs_bodyweight_leg_lever',
    name: { en: 'Leg Lever Abs', he: 'בטן עם מנופי רגליים' },
    description: {
      en: 'Abs work with long levers: lying leg raises, V-ups, a dead bug and a hollow hold, finished with a sit-up burn-out. Slow lowering on every rep, 45 to 60 seconds rest.',
      he: 'עבודת בטן עם מנופים ארוכים: הרמות רגליים בשכיבה, וי-אפ, דד באג והחזקת הולו, ובסוף סיט-אפ לסיום. הורדה איטית בכל חזרה, מנוחה של 45 עד 60 שניות.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'lying_leg_raise', sets: 4, reps: [10, 15], restSeconds: 60,
        cue: { en: 'Take three seconds to lower the legs; stop just above the floor.', he: 'שלוש שניות להורדת הרגליים; לעצור ממש מעל הרצפה.' },
      },
      { exerciseId: 'v_up', sets: 4, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'dead_bug', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 35, restSeconds: 45 },
      { exerciseId: 'sit_up', sets: 2, reps: [15, 20], restSeconds: 45 },
    ],
  },
  {
    id: 'abs_bodyweight_wiper_hollow_challenge',
    name: { en: 'Wiper and Hollow Challenge', he: 'אתגר מגבים והולו' },
    description: {
      en: 'An advanced abs session: floor windshield wipers, long hollow holds, V-ups, hollow rocks and side plank hip dips. Four sets with longer rest, for people who already control the hollow position.',
      he: 'אימון בטן מתקדם: מגבי שמשה בשכיבה, החזקות הולו ארוכות, וי-אפ, הולו רוק ופלאנק צידי עם הורדת אגן. ארבעה סטים עם מנוחה ארוכה יותר, למי ששולט כבר בעמדת הולו.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'windshield_wiper_floor', sets: 4, reps: [5, 8], restSeconds: 75,
        cue: { en: 'Shoulders stay on the floor; lower the legs only as far as the control lasts.', he: 'הכתפיים נשארות על הרצפה; להוריד את הרגליים רק עד הנקודה שבה יש שליטה.' },
      },
      { exerciseId: 'hollow_body_hold', sets: 4, seconds: 50, restSeconds: 60 },
      { exerciseId: 'v_up', sets: 4, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'hollow_rock', sets: 4, reps: [15, 20], restSeconds: 60 },
      { exerciseId: 'side_plank_hip_dip', sets: 3, reps: [12, 15], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Abs, hanging
  {
    id: 'abs_bar_hanging_knee_ladder',
    name: { en: 'Hanging Knee Raise Ladder', he: 'סולם הרמות ברכיים בתלייה' },
    description: {
      en: 'Abs from a pull-up bar: hanging knee raises and oblique knee raises, followed by floor work for the lower belly. A bar at home or in the park is all you need.',
      he: 'אימון בטן על מתח: הרמות ברכיים בתלייה והרמות ברכיים לצד, ואחריהן עבודה על הרצפה לבטן התחתונה. מספיק מתח בבית או בפארק.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'hanging_knee_raise', sets: 4, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Do not swing: tilt the pelvis up and bring the knees to the chest.', he: 'בלי להתנדנד: להטות את האגן למעלה ולהביא את הברכיים לחזה.' },
      },
      { exerciseId: 'hanging_oblique_knee_raise', sets: 3, reps: [6, 8], restSeconds: 60 },
      { exerciseId: 'reverse_crunch', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 30, restSeconds: 45 },
      { exerciseId: 'plank', sets: 2, seconds: 45, restSeconds: 45 },
    ],
  },
  {
    id: 'abs_bar_toes_to_bar_lsit',
    name: { en: 'Toes to Bar and L-Sit', he: 'רגליים למוט ואל-סיט' },
    description: {
      en: 'An advanced bar and dip-bar abs session: toes to bar, straight-leg hanging raises, L-sit holds and oblique raises. Longer rest between hard sets; stop a set when the swing takes over.',
      he: 'אימון בטן מתקדם על מתח ומקבילים: רגליים למוט, הרמות רגליים ישרות בתלייה, החזקות אל-סיט והרמות לצד. מנוחה ארוכה בין סטים קשים; להפסיק סט כשהנדנוד משתלט.',
    },
    focus: 'abs',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['outdoor', 'gym'],
    items: [
      { exerciseId: 'toes_to_bar', sets: 4, reps: [5, 8], restSeconds: 90 },
      {
        exerciseId: 'hanging_leg_raise', sets: 4, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Squeeze the bar, keep the legs straight and lower with control.', he: 'לחבק את המוט, לשמור על רגליים ישרות ולהוריד בשליטה.' },
      },
      { exerciseId: 'l_sit', sets: 4, seconds: 15, restSeconds: 75 },
      { exerciseId: 'hanging_oblique_knee_raise', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 45, restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Core
  {
    id: 'core_bodyweight_stability_basics',
    name: { en: 'Core Stability Basics', he: 'יסודות יציבות הליבה' },
    description: {
      en: 'A gentle core session for the front, sides and back: bird dog, dead bug, side plank, superman and a front plank. Slow reps and short holds, with a full minute of rest when needed.',
      he: 'אימון ליבה עדין לחזית, לצדדים ולגב: בירד דוג, דד באג, פלאנק צידי, סופרמן ופלאנק קדמי. חזרות איטיות והחזקות קצרות, ומנוחה של דקה לפי הצורך.',
    },
    focus: 'core',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'bird_dog', sets: 3, reps: [6, 8], restSeconds: 45,
        cue: { en: 'Move slowly and keep the hips level, as if balancing a cup on the lower back.', he: 'לנוע לאט ולשמור על אגן ישר, כאילו מאזנים כוס על הגב התחתון.' },
      },
      { exerciseId: 'dead_bug', sets: 3, reps: [6, 8], restSeconds: 45 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 45 },
      { exerciseId: 'superman', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'plank', sets: 3, seconds: 25, restSeconds: 45 },
    ],
  },
  {
    id: 'core_bodyweight_waist_and_back',
    name: { en: 'Waist and Lower Back Mix', he: 'מותניים וגב תחתון' },
    description: {
      en: 'A beginner core mix that trains the waist and the lower back as well as the belly: climbers, heel touches, a dolphin kick, a side plank and a hip-hinge good morning.',
      he: 'מיקס ליבה למתחילים שמחזק את המותניים ואת הגב התחתון לצד הבטן: מטפס הרים, נגיעות עקב, בעיטת דולפין, פלאנק צידי וגוד מורנינג בשיפוף האגן.',
    },
    focus: 'core',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'mountain_climber', sets: 3, seconds: 20, restSeconds: 45 },
      { exerciseId: 'heel_touch', sets: 3, reps: [8, 10], restSeconds: 45 },
      {
        exerciseId: 'bodyweight_good_morning', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Push the hips back with a long, neutral spine; stop when the back would round.', he: 'לדחוף את האגן אחורה עם גב ארוך וניטרלי; לעצור כשהגב עומד להתעגל.' },
      },
      { exerciseId: 'prone_dolphin_kick', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'side_plank', sets: 2, seconds: 25, restSeconds: 45 },
    ],
  },
  {
    id: 'core_bodyweight_plank_variations',
    name: { en: 'Plank Variations', he: 'וריאציות פלאנק' },
    description: {
      en: 'The plank in several forms: a held plank, a side plank with hip dips, shoulder taps, a bear crawl and a bird dog. Trains the whole trunk against gravity, with 45 seconds rest.',
      he: 'הפלאנק בכמה צורות: פלאנק סטטי, פלאנק צידי עם הורדת אגן, נגיעות כתף, זחילת דוב ובירד דוג. מאמן את כל הגו מול כוח הכבידה, עם 45 שניות מנוחה.',
    },
    focus: 'core',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'bear_crawl', sets: 3, seconds: 30, restSeconds: 45 },
      {
        exerciseId: 'push_up_shoulder_tap', sets: 3, reps: [10, 14], restSeconds: 45,
        cue: { en: 'Feet wide, hips still: do not let the body rock from side to side.', he: 'רגליים פסוקות ואגן יציב: לא לתת לגוף להתנדנד מצד לצד.' },
      },
      { exerciseId: 'plank', sets: 3, seconds: 50, restSeconds: 45 },
      { exerciseId: 'side_plank_hip_dip', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'bird_dog', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'core_bodyweight_rotation',
    name: { en: 'Rotational Core Work', he: 'ליבה בסיבובים' },
    description: {
      en: 'A core session built on twisting and anti-twisting: Russian twists, spider-man push-ups, heel touches, bicycle crunches and a hollow hold, with a good morning for the lower back.',
      he: 'אימון ליבה שמבוסס על סיבובים ועמידה בפני סיבוב: טוויסט רוסי, שכיבות סמיכה ספיידרמן, נגיעות עקב, כפיפות אופניים והחזקת הולו, עם גוד מורנינג לגב התחתון.',
    },
    focus: 'core',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'spiderman_push_up', sets: 3, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Bring the knee toward the elbow without twisting the hips open.', he: 'להביא את הברך לכיוון המרפק בלי לפתוח את האגן.' },
      },
      { exerciseId: 'russian_twist', sets: 3, reps: [12, 16], restSeconds: 45 },
      { exerciseId: 'heel_touch', sets: 3, reps: [14, 18], restSeconds: 30 },
      { exerciseId: 'bicycle_crunch', sets: 3, reps: [14, 18], restSeconds: 30 },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 30, restSeconds: 45 },
      { exerciseId: 'bodyweight_good_morning', sets: 2, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'core_bodyweight_front_to_back',
    name: { en: 'Front-to-Back Core', he: 'ליבה מלפנים ומאחור' },
    description: {
      en: 'Balances the belly with the back: a hollow hold and dead bug in front, supermans and a prone swimmer behind, plus a bear crawl and side plank. Even work, steady tempo.',
      he: 'מאזן בין הבטן לגב: החזקת הולו ודד באג מלפנים, סופרמן ושחיין בשכיבה על הבטן מאחור, וגם זחילת דוב ופלאנק צידי. עבודה מאוזנת בקצב יציב.',
    },
    focus: 'core',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'bear_crawl', sets: 3, seconds: 30, restSeconds: 45 },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 30, restSeconds: 45 },
      { exerciseId: 'dead_bug', sets: 3, reps: [8, 12], restSeconds: 30 },
      {
        exerciseId: 'superman', sets: 3, reps: [12, 15], restSeconds: 30,
        cue: { en: 'Lift arms and legs together and hold for a second at the top.', he: 'להרים ידיים ורגליים יחד ולהחזיק שנייה למעלה.' },
      },
      { exerciseId: 'prone_swimmer', sets: 3, reps: [12, 16], restSeconds: 30 },
      { exerciseId: 'side_plank', sets: 3, seconds: 35, restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Full body
  {
    id: 'full_body_bodyweight_starter',
    name: { en: 'Full Body Starter', he: 'התחלה לכל הגוף' },
    description: {
      en: 'A first full-body session: squat, incline push-up, glute bridge, a reverse snow angel and a dead bug. Easy exercises, three sets or fewer and a full minute of rest, to learn the basic patterns.',
      he: 'אימון ראשון לכל הגוף: סקוואט, שכיבות סמיכה בידיים מוגבהות, גשר ישבן, מלאך שלג הפוך ודד באג. תרגילים קלים, עד שלושה סטים ומנוחה של דקה, ללימוד דפוסי התנועה הבסיסיים.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'bodyweight_squat', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Sit back and down, knees follow the toes, chest tall.', he: 'לשבת אחורה ולמטה, הברכיים בכיוון האצבעות, החזה זקוף.' },
      },
      {
        exerciseId: 'incline_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Hands on a bench or a sturdy wall ledge; keep the body in one line.', he: 'ידיים על ספסל או מעקה יציב; הגוף נשאר בקו אחד.' },
      },
      { exerciseId: 'glute_bridge', sets: 3, reps: [10, 15], restSeconds: 45 },
      { exerciseId: 'reverse_snow_angel', sets: 3, reps: [8, 12], restSeconds: 45 },
      { exerciseId: 'dead_bug', sets: 2, reps: [6, 8], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_bodyweight_quiet_flow',
    name: { en: 'Quiet Full Body Flow', he: 'זרימה שקטה לכל הגוף' },
    description: {
      en: 'A low-impact full-body session with no jumping, suited to apartments: reverse lunges, knee push-ups, a prone Y raise, good mornings and a high plank. Slow tempo, easy on the joints.',
      he: 'אימון שקט ונטול קפיצות לכל הגוף, מתאים לדירה: מכרע לאחור, שכיבות סמיכה על הברכיים, הרמת Y בשכיבה, גוד מורנינג ופלאנק גבוה. קצב איטי ועדין למפרקים.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'reverse_lunge', sets: 3, reps: [6, 8], restSeconds: 60 },
      { exerciseId: 'knee_push_up', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'prone_y_raise', sets: 3, reps: [8, 12], restSeconds: 45 },
      {
        exerciseId: 'bodyweight_good_morning', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Hinge from the hips with a long back; feel the stretch behind the thighs.', he: 'להתכופף מהמותניים עם גב ארוך; להרגיש מתיחה בירכיים האחוריות.' },
      },
      { exerciseId: 'high_plank', sets: 3, seconds: 25, restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_bodyweight_squat_push_pull',
    name: { en: 'Squat, Push, Pull Basics', he: 'סקוואט, דחיפה ומשיכה' },
    description: {
      en: 'Simple building blocks for the whole body: sumo squats, push-ups, a prone swimmer, a single-leg balance reach and mountain climbers. Moderate pace with 45 to 60 seconds rest.',
      he: 'אבני בניין פשוטות לכל הגוף: סקוואט סומו, שכיבות סמיכה, שחיין בשכיבה, הושטת רגל על רגל אחת ומטפס הרים. קצב בינוני עם 45 עד 60 שניות מנוחה.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'sumo_squat', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'push_up', sets: 3, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Elbows about 45 degrees from the body; drop to the knees to finish a set.', he: 'מרפקים בזווית של כ-45 מעלות מהגוף; אפשר לרדת לברכיים כדי לסיים סט.' },
      },
      { exerciseId: 'prone_swimmer', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'single_leg_balance_reach', sets: 2, reps: [6, 8], restSeconds: 45 },
      { exerciseId: 'mountain_climber', sets: 3, seconds: 20, restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_bodyweight_straight_sets',
    name: { en: 'Straight-Set Bodyweight Strength', he: 'כוח במשקל גוף בסטים רגילים' },
    description: {
      en: 'Straight-set strength with harder single-leg and push variations: Bulgarian split squats, decline push-ups, single-leg Romanian deadlifts, a prone Y raise and a hollow hold.',
      he: 'אימון כוח בסטים רגילים עם וריאציות קשות יותר של רגל אחת ודחיפה: סקוואט בולגרי, שכיבות סמיכה ברגליים מוגבהות, דדליפט רומני על רגל אחת, הרמת Y והחזקת הולו.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'bulgarian_split_squat', sets: 3, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Rear foot on a bench or step; most of the weight on the front leg.', he: 'כף הרגל האחורית על ספסל או מדרגה; רוב המשקל על הרגל הקדמית.' },
      },
      { exerciseId: 'decline_push_up', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'prone_y_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'hollow_body_hold', sets: 3, seconds: 30, restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_bodyweight_dynamic_mix',
    name: { en: 'Dynamic Full Body Mix', he: 'מיקס דינמי לכל הגוף' },
    description: {
      en: 'A faster full-body mix with some jumping: burpees, split squat jumps, Hindu push-ups, a prone swimmer and mountain climbers. Rest is 45 to 60 seconds; swap jumps for steps if the joints complain.',
      he: 'מיקס מהיר יותר לכל הגוף עם קצת קפיצות: ברפי, קפיצות ספליט, שכיבות סמיכה הינדיות, שחיין בשכיבה ומטפס הרים. מנוחה של 45 עד 60 שניות; אם המפרקים מתלוננים, להחליף קפיצות בצעדים.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'burpee', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'split_squat_jump', sets: 3, reps: [6, 8], restSeconds: 60 },
      { exerciseId: 'hindu_push_up', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'prone_swimmer', sets: 3, reps: [12, 16], restSeconds: 45 },
      { exerciseId: 'mountain_climber', sets: 3, seconds: 40, restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_bodyweight_one_sided',
    name: { en: 'One-Sided Strength', he: 'כוח חד-צדדי' },
    description: {
      en: 'Single-leg and shoulder-focused full-body work: Cossack squats, pike push-ups, single-leg hip thrusts, a reverse snow angel and side plank hip dips. Shows and fixes left and right differences.',
      he: 'עבודה חד-צדדית ועבודת כתפיים לכל הגוף: סקוואט קוזאקי, שכיבות סמיכה פייק, היפ טראסט על רגל אחת, מלאך שלג הפוך ופלאנק צידי עם הורדת אגן. חושף ומאזן הבדלים בין ימין לשמאל.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'cossack_squat', sets: 3, reps: [6, 8], restSeconds: 60 },
      {
        exerciseId: 'pike_push_up', sets: 3, reps: [8, 12], restSeconds: 60,
        cue: { en: 'Hips high, head moves between the hands toward the floor.', he: 'אגן גבוה, הראש יורד בין הידיים לכיוון הרצפה.' },
      },
      { exerciseId: 'single_leg_hip_thrust', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'reverse_snow_angel', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'side_plank_hip_dip', sets: 3, reps: [8, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_bodyweight_advanced_strength',
    name: { en: 'Advanced Bodyweight Strength', he: 'כוח מתקדם במשקל גוף' },
    description: {
      en: 'Hard bodyweight skills in straight sets with long rest: pistol squats, archer push-ups, Nordic curls, a prone Y raise and a hollow hold. Use a wall or a pole for balance on pistols.',
      he: 'מיומנויות קשות במשקל גוף בסטים רגילים עם מנוחה ארוכה: פיסטול סקוואט, שכיבות סמיכה ארצ׳ר, נורדיק קרל, הרמת Y והחזקת הולו. בפיסטול אפשר להיעזר בקיר או בעמוד לשיווי משקל.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'pistol_squat', sets: 4, reps: [3, 5], restSeconds: 90 },
      { exerciseId: 'archer_push_up', sets: 4, reps: [4, 6], restSeconds: 90 },
      {
        exerciseId: 'nordic_hamstring_curl', sets: 3, reps: [4, 6], restSeconds: 90,
        cue: { en: 'Anchor the heels under a sofa or with a partner; lower as slowly as you can.', he: 'לעגן את העקבים מתחת לספה או עם בן זוג; להוריד לאט ככל האפשר.' },
      },
      { exerciseId: 'prone_y_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'hollow_body_hold', sets: 4, seconds: 45, restSeconds: 60 },
    ],
  },
  {
    id: 'full_body_bodyweight_explosive',
    name: { en: 'Explosive Full Body', he: 'פיצוץ לכל הגוף' },
    description: {
      en: 'Power work for trained people: clap push-ups, tuck jumps and shrimp squats with full rest, then a prone T raise and hollow rocks. Quality over quantity; stop a set when the height drops.',
      he: 'עבודת כוח מתפרץ למתאמנים: שכיבות סמיכה עם מחיאה, קפיצות טאק ושרימפ סקוואט עם מנוחה מלאה, ואז הרמת T בשכיבה והולו רוק. איכות לפני כמות; להפסיק סט כשהגובה יורד.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'clap_push_up', sets: 4, reps: [5, 8], restSeconds: 90 },
      {
        exerciseId: 'tuck_jump', sets: 4, reps: [6, 8], restSeconds: 75,
        cue: { en: 'Land softly on the whole foot and reset between jumps.', he: 'לנחות בעדינות על כל כף הרגל ולהתאפס בין הקפיצות.' },
      },
      { exerciseId: 'shrimp_squat', sets: 3, reps: [3, 5], restSeconds: 90 },
      { exerciseId: 'prone_t_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'hollow_rock', sets: 3, reps: [12, 18], restSeconds: 60 },
    ],
  },
];
