import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Bodyweight lower-body workouts with no equipment at all (a chair, sofa, step or wall is enough): glutes, quads,
 * hamstrings and legs. They work at home, in the park and in the gym, except the ones that need a smooth floor.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ glutes
  {
    id: 'glutes_bw_floor_activation',
    name: { en: 'Floor Glute Activation', he: 'הפעלת ישבן על הרצפה' },
    description: {
      en: 'A gentle floor session for the glutes: bridge, frog pump, donkey kicks, fire hydrants and a superman, in straight sets with short rests. No equipment and easy on the joints; suits newcomers.',
      he: 'אימון ישבן עדין על הרצפה: גשר ישבן, גשר צפרדע, בעיטות חמור, פייר הידרנט וסופרמן, בסטים רגילים עם מנוחות קצרות. בלי ציוד ועדין למפרקים; מתאים למתחילים.',
    },
    focus: 'glutes',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'glute_bridge',
        sets: 3,
        reps: [12, 15],
        restSeconds: 45,
        cue: {
          en: 'Pause one second at the top, ribs down, no arching of the lower back.',
          he: 'עצירה של שנייה למעלה, צלעות למטה, בלי קימור של הגב התחתון.',
        },
      },
      { exerciseId: 'frog_pump', sets: 3, reps: [15, 20], restSeconds: 45 },
      {
        exerciseId: 'donkey_kick',
        sets: 2,
        reps: [10, 12],
        restSeconds: 30,
        cue: {
          en: 'Keep the hips level and lift the leg with the glute, not the lower back. Use a mat or towel in the park.',
          he: 'האגן ישר, והרגל עולה מהישבן ולא מהגב התחתון. בפארק כדאי מזרן או מגבת.',
        },
      },
      { exerciseId: 'fire_hydrant', sets: 2, reps: [10, 12], restSeconds: 30 },
      { exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 30 },
    ],
  },
  {
    id: 'glutes_bw_squat_lunge_thrust',
    name: { en: 'Squat, Lunge and Hip Thrust Glutes', he: 'ישבן: סקוואט, מכרע והיפ טראסט' },
    description: {
      en: 'A standing and lying mix for newcomers: sumo squat, reverse lunge, step-up, hip thrust off a sofa or bench and a bridge march. Straight sets that teach the main glute patterns.',
      he: 'שילוב של עבודה בעמידה ובשכיבה למתחילים: סקוואט סומו, מכרע לאחור, עליות על מדרגה, היפ טראסט עם הגב על ספה או ספסל וגשר עם צעידה. סטים רגילים שמלמדים את תבניות התנועה העיקריות לישבן.',
    },
    focus: 'glutes',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'sumo_squat', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'reverse_lunge', sets: 2, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'step_up',
        sets: 2,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'A stair or step no higher than the knee; push through the heel of the top foot.',
          he: 'מדרגה שלא גבוהה מהברך; לדחוף דרך העקב של הרגל העליונה.',
        },
      },
      {
        exerciseId: 'bodyweight_hip_thrust',
        sets: 3,
        reps: [12, 15],
        restSeconds: 45,
        cue: {
          en: 'Upper back on the edge of a stable sofa or bench, chin tucked, squeeze the glutes at the top.',
          he: 'הגב העליון על קצה ספה או ספסל יציבים, סנטר צמוד, וכיווץ הישבן למעלה.',
        },
      },
      { exerciseId: 'glute_bridge_march', sets: 2, reps: [8, 10], restSeconds: 45 },
    ],
  },
  {
    id: 'glutes_bw_lunge_and_hinge',
    name: { en: 'Lunge and Hinge Glutes', he: 'ישבן: מכרעים וציר ירך' },
    description: {
      en: 'Single-leg glute strength: Bulgarian split squat, single-leg hinge, curtsy lunge and single-leg hip thrust, with fire hydrants to finish. Straight sets, reps counted per side; for people with some leg-training experience.',
      he: 'כוח לישבן בעבודה על רגל אחת: סקוואט בולגרי, ציר ירך על רגל אחת, מכרע קורטסי והיפ טראסט על רגל אחת, ופייר הידרנט לסיום. סטים רגילים, החזרות לכל צד; מתאים לבעלי ניסיון באימוני רגליים.',
    },
    focus: 'glutes',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'bulgarian_split_squat',
        sets: 3,
        reps: [8, 12],
        restSeconds: 75,
        cue: {
          en: 'Rear foot on a chair, sofa or bench; a slight forward lean brings in more glute.',
          he: 'כף הרגל האחורית על כיסא, ספה או ספסל; הטיית גו קלה קדימה מגבירה את עבודת הישבן.',
        },
      },
      {
        exerciseId: 'single_leg_romanian_deadlift',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Hips square to the floor, back flat; the free leg and torso move as one line.',
          he: 'האגן מקביל לרצפה והגב שטוח; הרגל החופשית והגו נעים כקו אחד.',
        },
      },
      { exerciseId: 'curtsy_lunge', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'single_leg_hip_thrust',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Keep the pelvis level; do not let it rotate toward the lifted leg.',
          he: 'האגן נשאר ישר ואינו מסתובב לכיוון הרגל המורמת.',
        },
      },
      { exerciseId: 'fire_hydrant', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'glutes_bw_endurance_burn',
    name: { en: 'High-Rep Glute Endurance', he: 'סיבולת ישבן בחזרות גבוהות' },
    description: {
      en: 'High-rep glute work with short rests: Cossack squats, step-ups, single-leg bridges, frog pumps and donkey kicks. It relies on controlled reps and muscular fatigue rather than heavy loading.',
      he: 'עבודה לישבן בחזרות גבוהות ובמנוחות קצרות: סקוואט קוזאקי, עליות על מדרגה, גשר על רגל אחת, גשר צפרדע ובעיטות חמור. מתבססת על חזרות מבוקרות ועל עייפות השריר ולא על עומס כבד.',
    },
    focus: 'glutes',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'cossack_squat',
        sets: 3,
        reps: [10, 12],
        restSeconds: 30,
        cue: {
          en: 'Heel of the bent leg stays down; the toes of the straight leg point up.',
          he: 'העקב של הרגל הכפופה נשאר על הרצפה, ואצבעות הרגל הישרה מצביעות למעלה.',
        },
      },
      { exerciseId: 'step_up', sets: 4, reps: [12, 15], restSeconds: 30 },
      { exerciseId: 'single_leg_glute_bridge', sets: 4, reps: [12, 15], restSeconds: 30 },
      {
        exerciseId: 'frog_pump',
        sets: 3,
        reps: [20, 25],
        restSeconds: 20,
        cue: {
          en: 'Short, quick pulses at the top with a firm squeeze; stop the set when form slips.',
          he: 'תנועות קצרות ומהירות למעלה עם כיווץ חזק; לסיים את הסט כשהטכניקה נחלשת.',
        },
      },
      { exerciseId: 'donkey_kick', sets: 3, reps: [15, 20], restSeconds: 20 },
    ],
  },
  {
    id: 'glutes_bw_shrimp_bound_power',
    name: { en: 'Shrimp Squat and Bound Glute Power', he: 'כוח ישבן: שרימפ סקוואט וניתורים' },
    description: {
      en: 'An advanced glute session: lateral bounds and broad jumps for power first, then shrimp squats, single-leg hip thrusts and single-leg hinges for strength. Land softly; needs solid single-leg control.',
      he: 'אימון ישבן מתקדם: ניתורים לצדדים וקפיצות לרוחק לכוח בתחילת האימון, ואחר כך שרימפ סקוואט, היפ טראסט וציר ירך על רגל אחת לכוח שריר. נחיתה רכה; דורש שליטה טובה על רגל אחת.',
    },
    focus: 'glutes',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'lateral_bound',
        sets: 3,
        reps: [6, 8],
        restSeconds: 60,
        cue: {
          en: 'Stick each landing for a second before the next bound; stop when landings get loud.',
          he: 'לעצור שנייה בכל נחיתה לפני הניתור הבא; להפסיק כשהנחיתות נעשות רועשות.',
        },
      },
      { exerciseId: 'broad_jump', sets: 3, reps: [5, 6], restSeconds: 75 },
      {
        exerciseId: 'shrimp_squat',
        sets: 4,
        reps: [5, 8],
        restSeconds: 90,
        cue: {
          en: 'Hold a wall or pole lightly at first; lower slowly and keep the front heel down.',
          he: 'בהתחלה אפשר להיעזר קלות בקיר או בעמוד; לרדת לאט ולשמור על העקב הקדמי על הרצפה.',
        },
      },
      { exerciseId: 'single_leg_hip_thrust', sets: 4, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ quads
  {
    id: 'quads_bw_chair_squat_wall_sit',
    name: { en: 'Chair Squat and Wall Sit Quads', he: 'ארבע-ראשי: סקוואט לכיסא וכיסא על הקיר' },
    description: {
      en: 'A beginner quad session: chair squat, walking lunge, step-up and a wall sit, finishing with calf raises. Straight sets with moderate rest to build clean squat and lunge form.',
      he: 'אימון ארבע-ראשי למתחילים: סקוואט לכיסא, מכרעים בהליכה, עליות על מדרגה וכיסא על הקיר, ובסיום הרמות עקבים. סטים רגילים עם מנוחה בינונית כדי לבנות טכניקה נקייה של סקוואט ומכרע.',
    },
    focus: 'quads',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'box_squat',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Sit back to touch the seat lightly, then stand up without swinging the arms.',
          he: 'לשבת לאחור עד נגיעה קלה במושב, ואז לקום בלי תנופת ידיים.',
        },
      },
      { exerciseId: 'walking_lunge', sets: 2, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'step_up', sets: 2, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'wall_sit',
        sets: 3,
        seconds: 30,
        restSeconds: 45,
        cue: {
          en: 'Knees above the ankles, back flat on the wall; keep breathing steadily.',
          he: 'הברכיים מעל הקרסוליים, הגב צמוד לקיר; נשימה קבועה לאורך ההחזקה.',
        },
      },
      { exerciseId: 'standing_calf_raise', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'quads_bw_pause_squat_split_jump',
    name: { en: 'Pause Squats and Split Jumps', he: 'סקוואט עם עצירה וקפיצות ספליט' },
    description: {
      en: 'Intermediate quad work: split squat jumps first while fresh, then pause squats, Bulgarian split squats, lateral lunges, a wall sit and single-leg calf raises. The jumps are noisy, so land softly.',
      he: 'עבודת ארבע-ראשי ברמה בינונית: קפיצות ספליט בתחילת האימון כשהגוף רענן, ואחריהן סקוואט עם עצירה, סקוואט בולגרי, מכרע צידי, כיסא על הקיר והרמות עקבים על רגל אחת. הקפיצות רועשות, לכן לנחות בעדינות.',
    },
    focus: 'quads',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'split_squat_jump',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Soft landing with the front knee over the toes; end the set when jump height drops.',
          he: 'נחיתה רכה כשהברך הקדמית מעל האצבעות; לסיים את הסט כשגובה הקפיצה יורד.',
        },
      },
      {
        exerciseId: 'pause_squat',
        sets: 4,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Hold the bottom for 3 seconds with the heels down, then drive up.',
          he: 'עצירה של 3 שניות למטה כשהעקבים על הרצפה, ואז דחיפה למעלה.',
        },
      },
      { exerciseId: 'bulgarian_split_squat', sets: 3, reps: [8, 12], restSeconds: 60 },
      { exerciseId: 'lateral_lunge', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'wall_sit', sets: 3, seconds: 45, restSeconds: 45 },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'quads_bw_pistol_sissy_strength',
    name: { en: 'Pistol and Sissy Squat Quad Strength', he: 'כוח ארבע-ראשי: פיסטול וסיסי סקוואט' },
    description: {
      en: 'Advanced quad strength: jump squats, pistol squats, Bulgarian split squats, sissy squats and a long wall sit. Demanding for the knees, so it needs a solid squat base and a thorough warm-up.',
      he: 'כוח ארבע-ראשי ברמה מתקדמת: סקוואט קפיצה, פיסטול סקוואט, סקוואט בולגרי, סיסי סקוואט וכיסא ארוך על הקיר. תובעני לברכיים, ולכן דורש בסיס סקוואט יציב וחימום יסודי.',
    },
    focus: 'quads',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'jump_squat', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'pistol_squat',
        sets: 4,
        reps: [5, 8],
        restSeconds: 90,
        cue: {
          en: 'Reach forward for balance; hold a door frame or wall for help if needed.',
          he: 'הושטת הידיים קדימה לשיווי משקל; אפשר להיעזר במשקוף או בקיר בעת הצורך.',
        },
      },
      { exerciseId: 'bulgarian_split_squat', sets: 3, reps: [8, 10], restSeconds: 75 },
      {
        exerciseId: 'sissy_squat',
        sets: 3,
        reps: [8, 10],
        restSeconds: 75,
        cue: {
          en: 'One hand lightly on a wall; go only as deep as the knees feel comfortable.',
          he: 'יד אחת נשענת קלות על קיר; לרדת רק עד עומק נוח לברכיים.',
        },
      },
      { exerciseId: 'wall_sit', sets: 3, seconds: 60, restSeconds: 60 },
    ],
  },

  // ------------------------------------------------------------------ hamstrings
  {
    id: 'hamstrings_bw_hinge_bridge_basics',
    name: { en: 'Hinge and Bridge Basics', he: 'יסודות: ציר ירך וגשר' },
    description: {
      en: 'Learn the hip hinge and the bridge: good morning, balance reach, glute bridge, bridge march and superman. Gentle work for the back of the legs and the glutes in straight sets, no equipment.',
      he: 'לימוד ציר הירך והגשר: גוד מורנינג, הושטת רגל בשיווי משקל, גשר ישבן, גשר עם צעידה וסופרמן. עבודה עדינה לירך האחורית ולישבן בסטים רגילים, בלי ציוד.',
    },
    focus: 'hamstrings',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'bodyweight_good_morning',
        sets: 3,
        reps: [10, 12],
        restSeconds: 45,
        cue: {
          en: 'Push the hips back with a flat back and soft knees until you feel the back of the thighs stretch.',
          he: 'ירכיים לאחור עם גב שטוח וברכיים רפויות, עד תחושת מתיחה בחלק האחורי של הירך.',
        },
      },
      {
        exerciseId: 'single_leg_balance_reach',
        sets: 2,
        reps: [6, 8],
        restSeconds: 45,
        cue: {
          en: 'Touch down lightly with the free foot; the standing hip stays level.',
          he: 'נגיעה קלה של הרגל החופשית ברצפה; האגן נשאר ישר מעל רגל התמיכה.',
        },
      },
      { exerciseId: 'glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'glute_bridge_march', sets: 2, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 30 },
    ],
  },
  {
    id: 'hamstrings_bw_slider_single_leg',
    name: { en: 'Slider Curls and Single-Leg Hinge', he: 'כפיפות החלקה וציר ירך על רגל אחת' },
    description: {
      en: 'Hamstrings with a single-leg hinge and towel slider curls, plus single-leg bridges, a good morning and butt kicks to finish. The slider curls need a smooth floor and a towel.',
      he: 'עבודה לירך האחורית עם ציר ירך על רגל אחת וכפיפות החלקה עם מגבת, וגם גשר על רגל אחת, גוד מורנינג ועקבים לישבן לסיום. לכפיפות ההחלקה צריך רצפה חלקה ומגבת.',
    },
    focus: 'hamstrings',
    mode: 'bodyweight',
    level: 'intermediate',
    // The slider curls need a smooth floor, which a park does not offer.
    places: ['home', 'gym'],
    items: [
      {
        exerciseId: 'single_leg_romanian_deadlift',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Slow 3-second lowering, back flat, the standing knee slightly bent.',
          he: 'ירידה איטית של 3 שניות, גב שטוח, והברך של רגל התמיכה כפופה מעט.',
        },
      },
      {
        exerciseId: 'slider_hamstring_curl',
        sets: 3,
        reps: [8, 12],
        restSeconds: 60,
        cue: {
          en: 'Hips stay high; take 3 seconds sliding out and pull back with the heels.',
          he: 'האגן נשאר גבוה; 3 שניות בהחלקה החוצה ומשיכה חזרה בעזרת העקבים.',
        },
      },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'bodyweight_good_morning', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'butt_kicks', sets: 3, seconds: 30, restSeconds: 30 },
    ],
  },
  {
    id: 'hamstrings_bw_nordic_single_leg',
    name: { en: 'Nordic and Single-Leg Hamstring Strength', he: 'כוח לירך האחורית: נורדיק ורגל אחת' },
    description: {
      en: 'Advanced hamstring strength: single-leg hinge, Nordic curls, single-leg hip thrusts and heel walkouts, finished with a slow good morning. Nordic curls need the ankles anchored under a sofa or held by another person.',
      he: 'כוח לירך האחורית ברמה מתקדמת: ציר ירך על רגל אחת, נורדיק קרל, היפ טראסט על רגל אחת והליכת עקבים בגשר, ובסיום גוד מורנינג איטי. בנורדיק קרל צריך לעגן את הקרסוליים מתחת לספה או שאדם נוסף יחזיק אותם.',
    },
    focus: 'hamstrings',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'single_leg_romanian_deadlift', sets: 4, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'nordic_hamstring_curl',
        sets: 4,
        reps: [5, 8],
        restSeconds: 90,
        cue: {
          en: 'Lower as slowly as you can on a soft mat, then catch yourself with the hands and push back up.',
          he: 'לרדת לאט ככל האפשר על מזרן רך, לתפוס את הרצפה בידיים ולהיעזר בהן לחזרה למעלה.',
        },
      },
      { exerciseId: 'single_leg_hip_thrust', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'hamstring_walkout',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Hips stay high; small steps out and back. Use a mat or towel in the park.',
          he: 'האגן נשאר גבוה; צעדים קטנים החוצה וחזרה. בפארק כדאי מזרן או מגבת.',
        },
      },
      { exerciseId: 'bodyweight_good_morning', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ legs
  {
    id: 'legs_bw_squat_hinge_bridge',
    name: { en: 'Squat, Hinge and Bridge Legs', he: 'רגליים: סקוואט, ציר ירך וגשר' },
    description: {
      en: 'A first full leg session built on squat, lunge, hinge and bridge patterns, with calf raises to finish. Straight sets, no equipment, easy to scale.',
      he: 'אימון רגליים ראשון המבוסס על תבניות של סקוואט, מכרע, ציר ירך וגשר, עם הרמות עקבים לסיום. סטים רגילים בלי ציוד, קל להתאים לרמה.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'bodyweight_squat',
        sets: 3,
        reps: [12, 15],
        restSeconds: 45,
        cue: {
          en: 'Heels down, knees follow the toes, chest up.',
          he: 'העקבים על הרצפה, הברכיים בכיוון האצבעות, החזה מורם.',
        },
      },
      { exerciseId: 'reverse_lunge', sets: 2, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'bodyweight_good_morning', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'standing_calf_raise', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_bw_slow_tempo',
    name: { en: 'Slow-Tempo Legs', he: 'רגליים בקצב איטי ומבוקר' },
    description: {
      en: 'A controlled-tempo leg session: pause squats, lateral lunges, balance reaches, frog pumps and slow calf raises. Slow reps and short pauses teach control; suits newcomers and a gradual return to training.',
      he: 'אימון רגליים בקצב מבוקר: סקוואט עם עצירה, מכרע צידי, הושטת רגל בשיווי משקל, גשר צפרדע והרמות עקבים איטיות. חזרות איטיות ועצירות קצרות מלמדות שליטה; מתאים למתחילים ולחזרה הדרגתית לאימונים.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'pause_squat',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Count 3 down, pause 1 second at the bottom, then stand up smoothly.',
          he: '3 שניות בירידה, עצירה של שנייה למטה, ואז קימה חלקה.',
        },
      },
      {
        exerciseId: 'lateral_lunge',
        sets: 2,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Sit back into the bent leg; the other leg stays straight with the foot flat.',
          he: 'ישיבה לאחור אל הרגל הכפופה; הרגל השנייה ישרה וכף הרגל שטוחה.',
        },
      },
      { exerciseId: 'single_leg_balance_reach', sets: 2, reps: [6, 8], restSeconds: 45 },
      { exerciseId: 'frog_pump', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'standing_calf_raise', sets: 2, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_bw_lunge_cossack_hinge',
    name: { en: 'Lunge, Cossack and Hinge Legs', he: 'רגליים: מכרעים, קוזאקי וציר ירך' },
    description: {
      en: 'Intermediate legs from several directions: walking lunges, Cossack squats, a single-leg hinge, single-leg bridges and single-leg calf raises. Straight sets with a single-leg emphasis; reps are per side.',
      he: 'רגליים ברמה בינונית מכמה כיוונים: מכרעים בהליכה, סקוואט קוזאקי, ציר ירך על רגל אחת, גשר על רגל אחת והרמות עקבים על רגל אחת. סטים רגילים עם דגש על רגל אחת; החזרות לכל צד.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'walking_lunge',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Long steps, upright torso, the back knee hovers just above the floor.',
          he: 'צעדים ארוכים, גו זקוף, והברך האחורית מרחפת מעל הרצפה.',
        },
      },
      { exerciseId: 'cossack_squat', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_bw_jumps_bridge_finish',
    name: { en: 'Jumps and Bridge Finish Legs', he: 'רגליים: קפיצות וסיום בגשרים' },
    description: {
      en: 'Leg power first, then the posterior chain: jump squats and split squat jumps while fresh, followed by heel walkouts, single-leg hip thrusts and a wall sit. The jumps are noisy, so land softly.',
      he: 'קודם כוח ומהירות ברגליים ואחר כך השרשרת האחורית: סקוואט קפיצה וקפיצות ספליט כשהגוף רענן, ואחריהן הליכת עקבים בגשר, היפ טראסט על רגל אחת וכיסא על הקיר. הקפיצות רועשות, לכן לנחות בעדינות.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['home', 'outdoor', 'gym'],
    items: [
      {
        exerciseId: 'jump_squat',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Soft landing: hips back, knees over the toes, reset before each jump.',
          he: 'נחיתה רכה: אגן לאחור, ברכיים מעל האצבעות, ואיפוס לפני כל קפיצה.',
        },
      },
      { exerciseId: 'split_squat_jump', sets: 3, reps: [6, 8], restSeconds: 60 },
      {
        exerciseId: 'hamstring_walkout',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Hips stay high; small steps out and back. Use a mat or towel in the park.',
          he: 'האגן נשאר גבוה; צעדים קטנים החוצה וחזרה. בפארק כדאי מזרן או מגבת.',
        },
      },
      { exerciseId: 'single_leg_hip_thrust', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'wall_sit', sets: 3, seconds: 45, restSeconds: 45 },
    ],
  },
  {
    id: 'legs_bw_pistol_nordic_tuck',
    name: { en: 'Pistol, Nordic and Tuck-Jump Legs', he: 'רגליים: פיסטול, נורדיק וקפיצות ברכיים' },
    description: {
      en: 'Advanced legs: tuck jumps, pistol squats, Cossack squats, single-leg hip thrusts, Nordic curls and single-leg calf raises. Demanding for the knees and ankles; only with a strong single-leg base and a full warm-up.',
      he: 'רגליים ברמה מתקדמת: קפיצות ברכיים לחזה, פיסטול סקוואט, סקוואט קוזאקי, היפ טראסט על רגל אחת, נורדיק קרל והרמות עקבים על רגל אחת. תובעני לברכיים ולקרסוליים; רק עם בסיס חזק על רגל אחת וחימום מלא.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['home', 'outdoor', 'gym'],
    items: [
      { exerciseId: 'tuck_jump', sets: 3, reps: [5, 6], restSeconds: 75 },
      {
        exerciseId: 'pistol_squat',
        sets: 4,
        reps: [5, 8],
        restSeconds: 90,
        cue: {
          en: 'Lower under control, heel down; hold a wall or pole for help if needed.',
          he: 'ירידה מבוקרת, העקב על הרצפה; אפשר להיעזר בקיר או בעמוד בעת הצורך.',
        },
      },
      { exerciseId: 'cossack_squat', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'single_leg_hip_thrust', sets: 3, reps: [10, 12], restSeconds: 60 },
      {
        exerciseId: 'nordic_hamstring_curl',
        sets: 3,
        reps: [5, 8],
        restSeconds: 90,
        cue: {
          en: 'Ankles anchored under a sofa or held by another person; lower slowly onto a soft mat.',
          he: 'הקרסוליים מעוגנים מתחת לספה או מוחזקים על ידי אדם נוסף; לרדת לאט על מזרן רך.',
        },
      },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
];
