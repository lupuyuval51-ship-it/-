import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Dumbbell lower-body and core ready workouts: glutes 5, quads 3, hamstrings 3, legs 5, abs 2, core 3.
 * Mode `weights` with dumbbells (some sessions also use a bench). Every session works with dumbbells and body weight
 * only, so it is offered at the gym, at home and in the park.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ Glutes
  {
    id: 'glutes_dumbbell_floor_starter',
    name: { en: 'Floor Glute Starter', he: 'התחלה לישבן על הרצפה' },
    description: {
      en: 'A glute session for newcomers that needs no bench: sumo squats and Romanian deadlifts with dumbbells, then a frog pump and donkey kicks on the floor. Straight sets with 45-60 s rest.',
      he: 'אימון ישבן למתחילים ללא ספסל: סקוואט סומו ודדליפט רומני עם משקולות יד, ואחריהם גשר צפרדע ובעיטות חמור על הרצפה. סטים רגילים עם מנוחות של 45-60 שניות.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_sumo_squat', sets: 3, reps: [12, 15], restSeconds: 60,
        cue: { en: 'Wide stance, toes turned out, knees track over the toes.', he: 'עמידה רחבה, אצבעות הרגליים החוצה, הברכיים בכיוון האצבעות.' },
      },
      {
        exerciseId: 'dumbbell_romanian_deadlift', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Push the hips back with soft knees until the hamstrings stretch.', he: 'לדחוף את האגן אחורה עם ברכיים רפויות עד מתיחה בירך האחורית.' },
      },
      { exerciseId: 'frog_pump', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'donkey_kick', sets: 2, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Keep the hips level and do not arch the lower back.', he: 'האגן נשאר ישר והגב התחתון לא מתקער.' },
      },
    ],
  },
  {
    id: 'glutes_dumbbell_bench_thrust_basics',
    name: { en: 'Bench Hip Thrust Basics', he: 'יסודות היפ טראסט עם ספסל' },
    description: {
      en: 'A beginner glute session built around the dumbbell hip thrust on a bench, with a goblet squat and a Romanian deadlift, then step-ups and bridge marches with body weight. Moderate rest.',
      he: 'אימון ישבן למתחילים סביב היפ טראסט עם משקולת יד על ספסל, יחד עם גובלט סקוואט ודדליפט רומני, ואחריהם עליות על מדרגה וצעידות בגשר ישבן במשקל גוף. מנוחות בינוניות.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_hip_thrust', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Upper back on the bench, drive through the heels and pause at the top.', he: 'הגב העליון על הספסל, לדחוף דרך העקבים ולעצור למעלה.' },
      },
      { exerciseId: 'goblet_squat', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 2, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'step_up', sets: 2, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Use a stair or a sturdy bench and push through the heel of the top foot.', he: 'מדרגה או ספסל יציב, ודחיפה דרך העקב של הרגל העליונה.' },
      },
      { exerciseId: 'glute_bridge_march', sets: 2, reps: [8, 10], restSeconds: 45 },
    ],
  },
  {
    id: 'glutes_dumbbell_lunge_hinge',
    name: { en: 'Weighted Lunge and Hinge Glutes', he: 'ישבן: מכרעים וציר ירך עם משקולות' },
    description: {
      en: 'A bench-free intermediate glute session: a heavier Romanian deadlift, walking lunges and high step-ups with dumbbells, then single-leg bridges and fire hydrants. Straight sets, 30-75 s rest.',
      he: 'אימון ישבן לרמה בינונית ללא ספסל: דדליפט רומני כבד יותר, מכרעים בהליכה ועליות על מדרגה גבוהה עם משקולות, ואחריהם גשר ישבן על רגל אחת ופייר הידרנט. סטים רגילים, מנוחות של 30-75 שניות.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 4, reps: [8, 10], restSeconds: 75 },
      {
        exerciseId: 'dumbbell_walking_lunge', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Long stride, slight forward lean, push through the front heel.', he: 'צעד ארוך, הטיה קלה קדימה, דחיפה דרך העקב הקדמי.' },
      },
      {
        exerciseId: 'dumbbell_step_up', sets: 3, reps: [8, 10], restSeconds: 60,
        cue: { en: 'Pick a high step and do not push off the lower foot.', he: 'לבחור מדרגה גבוהה ולא לדחוף עם הרגל התחתונה.' },
      },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'fire_hydrant', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'glutes_dumbbell_high_rep_endurance',
    name: { en: 'Light-Weight High-Rep Glutes', he: 'ישבן במשקולות קלות וחזרות רבות' },
    description: {
      en: 'Lighter dumbbells, more reps and short rests: reverse lunges, sumo squats and Romanian deadlifts, then curtsy lunges and a bodyweight hip thrust. Straight sets that train muscular endurance.',
      he: 'משקולות קלות יותר, יותר חזרות ומנוחות קצרות: מכרעים לאחור, סקוואט סומו ודדליפט רומני, ואחריהם מכרעים קורטסי והיפ טראסט במשקל גוף. סטים רגילים שמאמנים סיבולת שרירים.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_reverse_lunge', sets: 4, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Step back softly and keep the front shin close to vertical.', he: 'צעד רך אחורה, והשוק הקדמית נשארת כמעט אנכית.' },
      },
      { exerciseId: 'dumbbell_sumo_squat', sets: 3, reps: [15, 20], restSeconds: 45 },
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'curtsy_lunge', sets: 3, reps: [12, 15], restSeconds: 30,
        cue: { en: 'Cross behind the front leg and keep the hips facing forward.', he: 'חצייה מאחורי הרגל הקדמית, והאגן נשאר פונה קדימה.' },
      },
      { exerciseId: 'bodyweight_hip_thrust', sets: 3, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'glutes_dumbbell_heavy_single_leg',
    name: { en: 'Heavy Single-Leg Glutes', he: 'ישבן כבד על רגל אחת' },
    description: {
      en: 'An advanced glute session: a heavy dumbbell hip thrust, shrimp squats, Bulgarian split squats and single-leg Romanian deadlifts, with single-leg hip thrusts to finish. Long rests, strict form.',
      he: 'אימון ישבן למתקדמים: היפ טראסט כבד עם משקולת יד, שרימפ סקוואט, סקוואט בולגרי ודדליפט רומני על רגל אחת, ובסיום היפ טראסט על רגל אחת. מנוחות ארוכות וטכניקה קפדנית.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_hip_thrust', sets: 4, reps: [6, 8], restSeconds: 90,
        cue: { en: 'Chin tucked, ribs down, hold the top for a full second.', he: 'סנטר מוכנס, צלעות למטה, החזקה של שנייה מלאה למעלה.' },
      },
      {
        exerciseId: 'shrimp_squat', sets: 3, reps: [5, 6], restSeconds: 90,
        cue: { en: 'Hold a wall for balance if needed and lower with control.', he: 'להיעזר בקיר לשיווי משקל לפי הצורך ולרדת בשליטה.' },
      },
      { exerciseId: 'dumbbell_bulgarian_split_squat', sets: 4, reps: [6, 8], restSeconds: 90 },
      {
        exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 3, reps: [6, 8], restSeconds: 75,
        cue: { en: 'Hips square to the floor, reach long through the back heel.', he: 'האגן ישר מול הרצפה, העקב האחורי נמתח לאחור.' },
      },
      { exerciseId: 'single_leg_hip_thrust', sets: 3, reps: [8, 10], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ Quads
  {
    id: 'quads_dumbbell_squat_lunge_basics',
    name: { en: 'Squat and Lunge Quad Basics', he: 'יסודות ארבע-ראשי: סקוואט ומכרעים' },
    description: {
      en: 'A gentle quad session for beginners: a goblet squat, bodyweight walking lunges and a dumbbell sumo squat, then a wall sit and calf raises. Straight sets, moderate rest, no bench needed.',
      he: 'אימון עדין לארבע-ראשי למתחילים: גובלט סקוואט, מכרעים בהליכה במשקל גוף וסקוואט סומו עם משקולת, ובסיום כיסא על הקיר והרמות עקבים. סטים רגילים, מנוחות בינוניות וללא ספסל.',
    },
    focus: 'quads',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'goblet_squat', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Hold one dumbbell at the chest, sit between the heels, chest tall.', he: 'משקולת יד אחת צמודה לחזה, לשבת בין העקבים כשהחזה זקוף.' },
      },
      { exerciseId: 'walking_lunge', sets: 2, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'dumbbell_sumo_squat', sets: 2, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'wall_sit', sets: 2, seconds: 30, restSeconds: 45 },
      { exerciseId: 'dumbbell_calf_raise', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'quads_dumbbell_front_squat_lunge',
    name: { en: 'Front Squat and Lunge Quads', he: 'ארבע-ראשי: סקוואט קדמי ומכרעים' },
    description: {
      en: 'An intermediate quad session: dumbbell front squats first, then walking lunges and step-ups, a wall sit and calf raises. Straight sets with 30-75 s rest.',
      he: 'אימון ארבע-ראשי לרמה בינונית: קודם סקוואט קדמי עם משקולות, ואחריו מכרעים בהליכה ועליות על מדרגה, כיסא על הקיר והרמות עקבים. סטים רגילים עם מנוחות של 30-75 שניות.',
    },
    focus: 'quads',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_front_squat', sets: 4, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Dumbbells rest on the front of the shoulders, elbows up, torso upright.', he: 'המשקולות נחות על חזית הכתפיים, המרפקים למעלה, פלג הגוף זקוף.' },
      },
      { exerciseId: 'dumbbell_walking_lunge', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'dumbbell_step_up', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'wall_sit', sets: 3, seconds: 45, restSeconds: 45 },
      { exerciseId: 'dumbbell_calf_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'quads_dumbbell_thruster_pistol',
    name: { en: 'Thruster, Split Squat and Pistol', he: 'ת׳ראסטר, סקוואט בולגרי ופיסטול' },
    description: {
      en: 'An advanced quad session: dumbbell thrusters, Bulgarian split squats, assisted pistol squats and reverse lunges, with single-leg calf raises to finish. Long rests, demanding on the knees, so keep the form strict.',
      he: 'אימון ארבע-ראשי למתקדמים: ת׳ראסטר עם משקולות, סקוואט בולגרי, פיסטול סקוואט בעזרת משענת ומכרעים לאחור, ובסיום הרמות עקבים על רגל אחת. מנוחות ארוכות; תובעני לברכיים, לכן הטכניקה קפדנית.',
    },
    focus: 'quads',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_thruster', sets: 4, reps: [8, 10], restSeconds: 75,
        cue: { en: 'Drive out of the squat straight into the press with a braced core.', he: 'לצאת מהסקוואט ישר ללחיצה מעל הראש, עם ליבה מכווצת.' },
      },
      { exerciseId: 'dumbbell_bulgarian_split_squat', sets: 4, reps: [6, 8], restSeconds: 90 },
      {
        exerciseId: 'pistol_squat', sets: 3, reps: [5, 6], restSeconds: 90,
        cue: { en: 'Hold a rail or door frame if needed and lower to a depth you control.', he: 'להיעזר במעקה או במשקוף לפי הצורך ולרדת לעומק שנשלט.' },
      },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 3, reps: [6, 8], restSeconds: 75 },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Hamstrings
  {
    id: 'hamstrings_dumbbell_hinge_starter',
    name: { en: 'Dumbbell Hinge Starter', he: 'התחלה בציר ירך עם משקולות' },
    description: {
      en: 'A beginner hamstring session: a Romanian deadlift and a dumbbell hip thrust to learn the hinge, then a single-leg balance reach and a floor superman. Light loads, clean form.',
      he: 'אימון לירך האחורית למתחילים: דדליפט רומני והיפ טראסט עם משקולת יד ללימוד תנועת הציר, ואחריהם הושטת רגל בשיווי משקל וסופרמן על הרצפה. משקלים קלים וטכניקה נקייה.',
    },
    focus: 'hamstrings',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_romanian_deadlift', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Hips back, flat back, dumbbells close to the legs.', he: 'הירכיים לאחור, גב ישר, המשקולות קרובות לרגליים.' },
      },
      { exerciseId: 'dumbbell_hip_thrust', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'single_leg_balance_reach', sets: 2, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Reach long, keep the hips level and a soft bend in the standing knee.', he: 'מתיחה ארוכה, האגן ישר וברך התמיכה כפופה מעט.' },
      },
      { exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'hamstrings_dumbbell_hinge_slider',
    name: { en: 'Hinge and Slider Hamstrings', he: 'ירך אחורית: ציר ירך והחלקה' },
    description: {
      en: 'An intermediate hamstring session that needs no bench: Romanian deadlifts and single-leg hinges with dumbbells, towel slider curls for the knee-bending action, and single-leg bridges to finish.',
      he: 'אימון לירך האחורית לרמה בינונית ללא ספסל: דדליפט רומני ודדליפט רומני על רגל אחת עם משקולות, כפיפות ברכיים בהחלקה עם מגבת לפעולת הכפיפה, ובסיום גשר ישבן על רגל אחת.',
    },
    focus: 'hamstrings',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 4, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'slider_hamstring_curl', sets: 3, reps: [8, 10], restSeconds: 60,
        cue: { en: 'Lift the hips, slide the heels out slowly and curl them back in.', he: 'להרים את האגן, להחליק את העקבים החוצה לאט ולהחזיר פנימה.' },
      },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'hamstrings_dumbbell_posterior_chain',
    name: { en: 'Posterior Chain Strength', he: 'כוח לשרשרת האחורית' },
    description: {
      en: 'An advanced hamstring session: heavy Romanian deadlifts, Nordic curls for eccentric strength, single-leg hinges, hamstring walkouts and a dumbbell hip thrust. Long rests, strict form.',
      he: 'אימון לירך האחורית למתקדמים: דדליפט רומני כבד, נורדיק קרל לכוח בירידה, ציר ירך על רגל אחת, הליכת עקבים בגשר והיפ טראסט עם משקולת. מנוחות ארוכות וטכניקה קפדנית.',
    },
    focus: 'hamstrings',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 4, reps: [6, 8], restSeconds: 90 },
      {
        exerciseId: 'nordic_hamstring_curl', sets: 3, reps: [5, 6], restSeconds: 90,
        cue: { en: 'Anchor the heels well, lower as slowly as you can and catch with your hands.', he: 'לעגן את העקבים היטב, לרדת לאט ככל האפשר ולהיתפס בידיים.' },
      },
      { exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 3, reps: [6, 8], restSeconds: 75 },
      { exerciseId: 'hamstring_walkout', sets: 3, reps: [6, 8], restSeconds: 60 },
      { exerciseId: 'dumbbell_hip_thrust', sets: 3, reps: [8, 10], restSeconds: 75 },
    ],
  },

  // ------------------------------------------------------------------ Legs
  {
    id: 'legs_dumbbell_leg_basics',
    name: { en: 'Dumbbell Leg Basics', he: 'יסודות רגליים עם משקולות יד' },
    description: {
      en: 'A first full leg session: goblet squat, Romanian deadlift, reverse lunges, a glute bridge and calf raises. It covers squat, hinge and lunge patterns with light loads and no bench.',
      he: 'אימון רגליים מלא ראשון: גובלט סקוואט, דדליפט רומני, מכרעים לאחור, גשר ישבן והרמות עקבים. מכסה את תבניות הסקוואט, ציר הירך והמכרעים עם משקלים קלים וללא ספסל.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'goblet_squat', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Hold one dumbbell at the chest, sit between the heels, chest tall.', he: 'משקולת יד אחת צמודה לחזה, לשבת בין העקבים כשהחזה זקוף.' },
      },
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'reverse_lunge', sets: 2, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'glute_bridge', sets: 2, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_calf_raise', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_dumbbell_bench_side_lunge',
    name: { en: 'Bench Thrust and Side Lunge Legs', he: 'רגליים: היפ טראסט ומכרע צידי' },
    description: {
      en: 'A beginner leg session with a bench: sumo squats and hip thrusts with dumbbells, side lunges, a single-leg balance reach and calf raises. Works the legs from the front, the back and the inner thigh.',
      he: 'אימון רגליים למתחילים עם ספסל: סקוואט סומו והיפ טראסט עם משקולות, מכרעים לצדדים, הושטת רגל בשיווי משקל והרמות עקבים. עובד על הרגליים מקדימה, מאחור ומהירך הפנימית.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_sumo_squat', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_hip_thrust', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Upper back on the bench, drive through the heels and pause at the top.', he: 'הגב העליון על הספסל, לדחוף דרך העקבים ולעצור למעלה.' },
      },
      {
        exerciseId: 'lateral_lunge', sets: 2, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Sit back into one hip, keep the other leg straight and both feet flat.', he: 'לשבת לאחור אל צד אחד, הרגל השנייה ישרה ושתי כפות הרגליים שטוחות.' },
      },
      { exerciseId: 'single_leg_balance_reach', sets: 2, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'dumbbell_calf_raise', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_dumbbell_complete_day',
    name: { en: 'Complete Dumbbell Leg Day', he: 'יום רגליים מלא במשקולות יד' },
    description: {
      en: 'A full intermediate leg day with no bench: goblet squats and Romanian deadlifts first, then walking lunges, single-leg bridges and high-rep calf raises. Straight sets, 30-75 s rest.',
      he: 'יום רגליים מלא לרמה בינונית וללא ספסל: קודם גובלט סקוואט ודדליפט רומני, ואחריהם מכרעים בהליכה, גשר ישבן על רגל אחת והרמות עקבים בחזרות גבוהות. סטים רגילים, מנוחות של 30-75 שניות.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'goblet_squat', sets: 4, reps: [10, 12], restSeconds: 75,
        cue: { en: 'Lower for three seconds, pause briefly, then stand up fast.', he: 'לרדת במשך שלוש שניות, לעצור קצר ולעלות במהירות.' },
      },
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 4, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'dumbbell_walking_lunge', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dumbbell_calf_raise', sets: 3, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_dumbbell_multi_direction_lunges',
    name: { en: 'Lunges in Every Direction', he: 'מכרעים בכל הכיוונים' },
    description: {
      en: 'Intermediate legs built on lunges in different directions: reverse lunge with dumbbells, a single-leg hinge, then side and curtsy lunges with body weight, and calf raises to finish.',
      he: 'רגליים לרמה בינונית שבנויות על מכרעים בכיוונים שונים: מכרע לאחור עם משקולות, ציר ירך על רגל אחת, ואחריהם מכרעים לצדדים ומכרעי קורטסי במשקל גוף, ובסיום הרמות עקבים.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_reverse_lunge', sets: 4, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'dumbbell_single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'lateral_lunge', sets: 3, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Sit back into one hip, keep the other leg straight and both feet flat.', he: 'לשבת לאחור אל צד אחד, הרגל השנייה ישרה ושתי כפות הרגליים שטוחות.' },
      },
      { exerciseId: 'curtsy_lunge', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dumbbell_calf_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_dumbbell_heavy_front_squat',
    name: { en: 'Heavy Front Squat Legs', he: 'רגליים כבדות עם סקוואט קדמי' },
    description: {
      en: 'An advanced leg day: heavy dumbbell front squats and Romanian deadlifts, loaded step-ups, sissy squats for the quads and calf raises to finish. Long rests, strict form.',
      he: 'יום רגליים למתקדמים: סקוואט קדמי ודדליפט רומני כבדים עם משקולות, עליות על מדרגה עם עומס, סיסי סקוואט לארבע-ראשי ובסיום הרמות עקבים. מנוחות ארוכות וטכניקה קפדנית.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'advanced',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_front_squat', sets: 5, reps: [6, 8], restSeconds: 90,
        cue: { en: 'Brace the core, keep the elbows up and the torso upright.', he: 'ליבה מכווצת, המרפקים למעלה ופלג הגוף זקוף.' },
      },
      { exerciseId: 'dumbbell_romanian_deadlift', sets: 4, reps: [6, 8], restSeconds: 90 },
      { exerciseId: 'dumbbell_step_up', sets: 3, reps: [6, 8], restSeconds: 75 },
      {
        exerciseId: 'sissy_squat', sets: 3, reps: [6, 10], restSeconds: 60,
        cue: { en: 'Hold a support, knees travel forward; go only as deep as feels comfortable.', he: 'להחזיק משענת, הברכיים נעות קדימה, לרדת רק לעומק שנוח.' },
      },
      { exerciseId: 'dumbbell_calf_raise', sets: 4, reps: [10, 12], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ Abs
  {
    id: 'abs_dumbbell_one_dumbbell',
    name: { en: 'Abs with One Dumbbell', he: 'בטן עם משקולת יד אחת' },
    description: {
      en: 'A beginner abs session that uses a single dumbbell: weighted crunches and woodchops, then reverse crunches and a dead bug on the floor. Straight sets with short rests.',
      he: 'אימון בטן למתחילים עם משקולת יד אחת: כפיפות בטן עם משקולת ווודצ׳ופ, ואחריהם כפיפות בטן הפוכות ודד באג על הרצפה. סטים רגילים עם מנוחות קצרות.',
    },
    focus: 'abs',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_weighted_crunch', sets: 3, reps: [12, 15], restSeconds: 45,
        cue: { en: 'Hold the dumbbell on the chest and lift the shoulder blades, not the neck.', he: 'המשקולת על החזה; מרימים את השכמות מהרצפה ולא את הצוואר.' },
      },
      { exerciseId: 'dumbbell_woodchop', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'reverse_crunch', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'dead_bug', sets: 3, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Press the lower back gently into the floor and move slowly.', he: 'הגב התחתון נלחץ בעדינות לרצפה, ותנועה איטית.' },
      },
    ],
  },
  {
    id: 'abs_dumbbell_loaded_builder',
    name: { en: 'Loaded Abs Builder', he: 'בניית בטן עם משקולות' },
    description: {
      en: 'An intermediate abs session: renegade rows first while fresh, then weighted crunches and side bends, with V-ups and a hollow hold on the floor. Straight sets with 45-60 s rest.',
      he: 'אימון בטן לרמה בינונית: קודם חתירת רנגייד כשהגוף רענן, ואחריה כפיפות בטן עם משקולת וכפיפות צד, ובסיום וי-אפ והחזקת הולו בודי על הרצפה. סטים רגילים עם מנוחות של 45-60 שניות.',
    },
    focus: 'abs',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'renegade_row', sets: 3, reps: [6, 8], restSeconds: 60,
        cue: { en: 'Feet wide, hips level, row without twisting the trunk.', he: 'רגליים רחבות, האגן ישר, חתירה בלי לסובב את הגו.' },
      },
      { exerciseId: 'dumbbell_weighted_crunch', sets: 4, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dumbbell_side_bend', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'v_up', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'hollow_body_hold', sets: 3, seconds: 30, restSeconds: 45,
        cue: { en: 'Keep the lower back pressed down; bend the knees if it lifts.', he: 'הגב התחתון נשאר לחוץ לרצפה; אם הוא מתרומם, לכופף את הברכיים.' },
      },
    ],
  },

  // ------------------------------------------------------------------ Core
  {
    id: 'core_dumbbell_chop_brace',
    name: { en: 'Chop, Bend and Brace', he: 'וודצ׳ופ, כפיפת צד ויציבות' },
    description: {
      en: 'A beginner core session: woodchops and side bends with a dumbbell, then a bird dog and a side plank for stability. Straight sets with short rests, no bench needed.',
      he: 'אימון ליבה למתחילים: וודצ׳ופ וכפיפות צד עם משקולת יד, ואחריהם בירד דוג ופלאנק צידי ליציבות. סטים רגילים עם מנוחות קצרות וללא ספסל.',
    },
    focus: 'core',
    mode: 'weights',
    level: 'beginner',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'dumbbell_woodchop', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dumbbell_side_bend', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'bird_dog', sets: 3, reps: [8, 10], restSeconds: 45,
        cue: { en: 'Reach long, keep the hips level and do not rotate.', he: 'מתיחה ארוכה, האגן ישר, בלי סיבוב.' },
      },
      { exerciseId: 'side_plank', sets: 3, seconds: 25, restSeconds: 45 },
    ],
  },
  {
    id: 'core_dumbbell_loaded_stability',
    name: { en: 'Loaded Core Stability', he: 'יציבות ליבה עם עומס' },
    description: {
      en: 'An intermediate core session built on stability under load: renegade rows, good mornings, woodchops and suitcase carries, then a side plank hip dip and a plank. Straight sets, 45-60 s rest.',
      he: 'אימון ליבה לרמה בינונית שבנוי על יציבות תחת עומס: חתירת רנגייד, גוד מורנינג, וודצ׳ופ והליכת מזוודה, ואחריהם פלאנק צידי עם הורדת אגן ופלאנק. סטים רגילים, מנוחות של 45-60 שניות.',
    },
    focus: 'core',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      { exerciseId: 'renegade_row', sets: 3, reps: [6, 8], restSeconds: 60 },
      {
        exerciseId: 'dumbbell_good_morning', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Light weight, soft knees, hips back, neutral spine.', he: 'משקולת קלה, ברכיים רפויות, אגן לאחור, עמוד שדרה ניטרלי.' },
      },
      { exerciseId: 'dumbbell_woodchop', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'suitcase_carry', sets: 3, seconds: 30, restSeconds: 45,
        cue: { en: 'Walk tall and do not lean toward the weight.', he: 'ללכת זקוף ובלי להישען לכיוון המשקולת.' },
      },
      { exerciseId: 'side_plank_hip_dip', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'plank', sets: 3, seconds: 45, restSeconds: 45 },
    ],
  },
  {
    id: 'core_dumbbell_flex_extend',
    name: { en: 'Core Flex and Extend', he: 'ליבה: כפיפה ופשיטה' },
    description: {
      en: 'An intermediate core session that trains the trunk in three directions: good mornings for extension, weighted crunches and a hollow rock for flexion, side bends for the sides, and a bird dog for stability.',
      he: 'אימון ליבה לרמה בינונית שמאמן את פלג הגוף בשלושה כיוונים: גוד מורנינג לפשיטה, כפיפות בטן עם משקולת והולו רוק לכפיפה, כפיפות צד לצדדים ובירד דוג ליציבות.',
    },
    focus: 'core',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym', 'home', 'outdoor'],
    items: [
      {
        exerciseId: 'dumbbell_good_morning', sets: 3, reps: [10, 12], restSeconds: 60,
        cue: { en: 'Light weight, soft knees, hips back, neutral spine.', he: 'משקולת קלה, ברכיים רפויות, אגן לאחור, עמוד שדרה ניטרלי.' },
      },
      { exerciseId: 'dumbbell_weighted_crunch', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'dumbbell_side_bend', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'hollow_rock', sets: 3, reps: [10, 12], restSeconds: 45,
        cue: { en: 'Keep the lower back pressed down and rock as one piece.', he: 'הגב התחתון נשאר לחוץ לרצפה והגוף מתנדנד כיחידה אחת.' },
      },
      { exerciseId: 'bird_dog', sets: 3, reps: [8, 10], restSeconds: 45 },
    ],
  },
];
