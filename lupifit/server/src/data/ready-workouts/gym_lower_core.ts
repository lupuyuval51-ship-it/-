import type { ReadyWorkoutSeed } from '@shared/content';

/** Gym workouts for the lower body (glutes, quads, hamstrings, legs) and the core. All use gym-only gear. */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ glutes
  {
    id: 'glutes_gym_machine_starter',
    name: { en: 'Glute Starter on Machines', he: 'צעדים ראשונים לישבן עם מכונות' },
    description: {
      en: 'A gentle glute session for newcomers: leg press, cable pull-through, step-ups and a bridge. Straight sets with moderate rest so the form stays clean.',
      he: 'אימון ישבן עדין למתחילים: לחיצת רגליים, פול ת׳רו בכבל, עליות על מדרגה וגשר ישבן. סטים רגילים עם מנוחות בינוניות כדי לשמור על טכניקה נקייה.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'leg_press',
        sets: 3,
        reps: [10, 15],
        restSeconds: 75,
        cue: {
          en: 'Feet high and wide on the platform, knees follow the toes.',
          he: 'כפות הרגליים גבוה ורחב על הפלטפורמה, הברכיים בכיוון האצבעות.',
        },
      },
      {
        exerciseId: 'cable_pull_through',
        sets: 3,
        reps: [12, 15],
        restSeconds: 60,
        cue: {
          en: 'Push the hips back, then squeeze the glutes to stand tall.',
          he: 'הירכיים לאחור, ואז כיווץ הישבן כדי להתיישר.',
        },
      },
      { exerciseId: 'step_up', sets: 3, reps: [8, 10], restSeconds: 45 },
      {
        exerciseId: 'glute_bridge',
        sets: 3,
        reps: [12, 15],
        restSeconds: 45,
        cue: {
          en: 'Pause one second at the top and squeeze the glutes.',
          he: 'עצירה של שנייה למעלה וכיווץ הישבן.',
        },
      },
    ],
  },
  {
    id: 'glutes_gym_smith_hinge_lunge',
    name: { en: 'Smith Squat and Hinge Basics', he: 'יסודות סקוואט סמית׳ וציר ירך' },
    description: {
      en: 'A beginner glute and leg session built on a guided squat, a dumbbell hinge and long-stride lunges, with a floor extension to finish. Good for learning the patterns.',
      he: 'אימון בסיס לישבן ולרגליים: סקוואט מונחה במכונת סמית׳, דדליפט רומני עם משקולות, מכרעים בהליכה וסופרמן לסיום. מתאים ללימוד תבניות התנועה.',
    },
    focus: 'glutes',
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
          en: 'Feet slightly forward of the bar, sit back and down.',
          he: 'כפות הרגליים מעט לפני המוט, לשבת אחורה ולמטה.',
        },
      },
      {
        exerciseId: 'dumbbell_romanian_deadlift',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Hips back, flat back, dumbbells close to the legs.',
          he: 'הירכיים לאחור, גב ישר, המשקולות קרובות לרגליים.',
        },
      },
      {
        exerciseId: 'walking_lunge',
        sets: 3,
        reps: [8, 10],
        restSeconds: 45,
        cue: {
          en: 'Take a long step and push through the front heel.',
          he: 'צעד ארוך ודחיפה דרך העקב של הרגל הקדמית.',
        },
      },
      { exerciseId: 'superman', sets: 3, reps: [10, 12], restSeconds: 30 },
    ],
  },
  {
    id: 'glutes_gym_hip_thrust_builder',
    name: { en: 'Hip Thrust Builder', he: 'בניית ישבן עם היפ טראסט' },
    description: {
      en: 'A glute session led by the barbell hip thrust, followed by a Romanian deadlift, Bulgarian split squats, a cable pull-through and single-leg bridges. Straight sets, 45-90 s rest.',
      he: 'אימון ישבן שמתחיל בהיפ טראסט עם מוט, ממשיך בדדליפט רומני, סקוואט בולגרי ופול ת׳רו בכבל ונגמר בגשר ישבן על רגל אחת. סטים רגילים עם מנוחות של 45-90 שניות.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'barbell_hip_thrust',
        sets: 4,
        reps: [8, 12],
        restSeconds: 90,
        cue: {
          en: 'Chin tucked, ribs down, pause one second at the top.',
          he: 'הסנטר מוכנס מעט, הצלעות למטה, עצירה של שנייה למעלה.',
        },
      },
      {
        exerciseId: 'romanian_deadlift',
        sets: 3,
        reps: [8, 10],
        restSeconds: 90,
        cue: {
          en: 'Hips back, the bar glides along the thighs.',
          he: 'הירכיים לאחור, המוט גולש לאורך הירכיים.',
        },
      },
      {
        exerciseId: 'bulgarian_split_squat',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Lean the torso slightly forward to load the glute of the front leg.',
          he: 'להטות מעט את פלג הגוף קדימה כדי להעמיס על הישבן של הרגל הקדמית.',
        },
      },
      { exerciseId: 'cable_pull_through', sets: 3, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [10, 12], restSeconds: 45 },
    ],
  },
  {
    id: 'glutes_gym_press_and_swing',
    name: { en: 'Leg Press and Swing Glutes', he: 'ישבן עם לחיצת רגליים וסווינג' },
    description: {
      en: 'Glute work from several angles: leg press with high feet, kettlebell swings for hip power, loaded reverse lunges and single-leg hinges, with a bridge to finish. Moderate rest, steady pace.',
      he: 'עבודה לישבן מכמה זוויות: לחיצת רגליים עם רגליים גבוהות, קטלבל סווינג לכוח ירכיים, מכרעים לאחור עם משקולות ודדליפט רומני על רגל אחת, ובסוף גשר ישבן. מנוחות בינוניות וקצב יציב.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'leg_press',
        sets: 4,
        reps: [10, 12],
        restSeconds: 75,
        cue: {
          en: 'Feet high on the platform, press through the heels, do not lock the knees.',
          he: 'כפות הרגליים גבוה על הפלטפורמה, דחיפה דרך העקבים, בלי לנעול את הברכיים.',
        },
      },
      {
        exerciseId: 'kettlebell_swing',
        sets: 4,
        reps: [12, 15],
        restSeconds: 60,
        cue: {
          en: 'Hinge, do not squat: the hips snap forward and the arms just hang on.',
          he: 'תנועת ציר ירך ולא סקוואט: הירכיים נדחפות קדימה והזרועות רק מחזיקות.',
        },
      },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 3, reps: [8, 10], restSeconds: 75 },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'glute_bridge', sets: 3, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'glutes_gym_heavy_extension',
    name: { en: 'Heavy Hip Extension Day', he: 'יום כבד לפשיטת ירכיים' },
    description: {
      en: 'An advanced glute session: deadlift and hip thrust as the heavy lifts, then loaded lunges, pistol squats and single-leg bridges. Long rests and controlled reps, no sets to failure.',
      he: 'אימון ישבן למתקדמים: דדליפט והיפ טראסט כתרגילים הכבדים, ואחריהם מכרעים עם משקולות, פיסטול סקוואט וגשר ישבן על רגל אחת. מנוחות ארוכות וחזרות בשליטה, בלי סטים עד כשל.',
    },
    focus: 'glutes',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'deadlift',
        sets: 4,
        reps: [5, 6],
        restSeconds: 150,
        cue: {
          en: 'Brace first, keep the bar against the legs, push the floor away.',
          he: 'קודם לנעול את הבטן, המוט צמוד לרגליים, לדחוף את הרצפה.',
        },
      },
      {
        exerciseId: 'barbell_hip_thrust',
        sets: 4,
        reps: [6, 8],
        restSeconds: 120,
        cue: {
          en: 'Pause one second at the top, ribs down, shins vertical.',
          he: 'עצירה של שנייה למעלה, הצלעות למטה, השוקיים אנכיות.',
        },
      },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 3, reps: [8, 10], restSeconds: 90 },
      {
        exerciseId: 'pistol_squat',
        sets: 3,
        reps: [4, 6],
        restSeconds: 90,
        cue: {
          en: 'Hold a rack upright for balance, or sit down to a bench if needed.',
          he: 'להחזיק עמוד של מתקן לשיווי משקל, או לשבת על ספסל אם צריך.',
        },
      },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ quads
  {
    id: 'quads_gym_press_goblet_basics',
    name: { en: 'Leg Press and Goblet Quads', he: 'ארבע-ראשי עם לחיצת רגליים וגובלט' },
    description: {
      en: 'A beginner quad session: goblet squat and leg press for the main work, then lunges, leg extensions and a wall sit to finish. Light loads, 2-3 sets, easy pace.',
      he: 'אימון ארבע-ראשי למתחילים: גובלט סקוואט ולחיצת רגליים כעבודה עיקרית, ואחריהם מכרעים, פשיטת ברכיים וכיסא על הקיר לסיום. משקלים קלים, 2-3 סטים וקצב רגוע.',
    },
    focus: 'quads',
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
          en: 'Elbows inside the knees, chest tall.',
          he: 'המרפקים בין הברכיים, החזה זקוף.',
        },
      },
      { exerciseId: 'leg_press', sets: 3, reps: [12, 15], restSeconds: 75 },
      { exerciseId: 'reverse_lunge', sets: 2, reps: [8, 10], restSeconds: 45 },
      {
        exerciseId: 'leg_extension',
        sets: 3,
        reps: [12, 15],
        restSeconds: 45,
        cue: {
          en: 'Squeeze the thigh at the top and lower slowly.',
          he: 'לכווץ את הירך למעלה ולרדת לאט.',
        },
      },
      {
        exerciseId: 'wall_sit',
        sets: 2,
        seconds: 30,
        restSeconds: 45,
        cue: {
          en: 'Back flat on the wall, thighs parallel to the floor.',
          he: 'הגב צמוד לקיר, הירכיים מקבילות לרצפה.',
        },
      },
    ],
  },
  {
    id: 'quads_gym_barbell_squat_day',
    name: { en: 'Barbell Squat Quad Day', he: 'יום ארבע-ראשי עם סקוואט מוט' },
    description: {
      en: 'A classic quad day: barbell back squat first, then leg press, Bulgarian split squats, leg extensions and a wall sit. Straight sets with moderate rest.',
      he: 'יום ארבע-ראשי קלאסי: סקוואט עם מוט בהתחלה, ואחריו לחיצת רגליים, סקוואט בולגרי, פשיטת ברכיים וכיסא על הקיר. סטים רגילים עם מנוחות בינוניות.',
    },
    focus: 'quads',
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
          en: 'Brace the core, knees track over the toes, go as deep as you can control.',
          he: 'בטן נעולה, הברכיים בכיוון האצבעות, לרדת לעומק שנשלט.',
        },
      },
      { exerciseId: 'leg_press', sets: 3, reps: [10, 12], restSeconds: 75 },
      {
        exerciseId: 'bulgarian_split_squat',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Front foot far enough forward that the heel stays down.',
          he: 'כף הרגל הקדמית רחוקה מספיק כדי שהעקב יישאר על הרצפה.',
        },
      },
      { exerciseId: 'leg_extension', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'wall_sit', sets: 3, seconds: 45, restSeconds: 45 },
    ],
  },
  {
    id: 'quads_gym_tempo_single_leg',
    name: { en: 'Tempo Squat and Single-Leg Quads', he: 'ארבע-ראשי: סקוואט בקצב מבוקר ועבודה על רגל אחת' },
    description: {
      en: 'Quad work built on a slow-lowering Smith squat, then dumbbell reverse lunges, step-ups and Cossack squats, with leg extensions to finish. Moderate loads and a controlled tempo.',
      he: 'עבודה לארבע-ראשי שמתחילה בסקוואט סמית׳ עם ירידה איטית, ממשיכה במכרע לאחור עם משקולות, עליות על מדרגה וסקוואט קוזאקי, ונגמרת בפשיטת ברכיים. משקלים בינוניים וקצב מבוקר.',
    },
    focus: 'quads',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'smith_machine_squat',
        sets: 4,
        reps: [8, 10],
        restSeconds: 75,
        cue: {
          en: 'Lower for three seconds, then press up strongly.',
          he: 'ירידה של שלוש שניות ואז דחיפה חזקה למעלה.',
        },
      },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'step_up',
        sets: 3,
        reps: [10, 12],
        restSeconds: 45,
        cue: {
          en: 'Use a box at knee height and lower under control.',
          he: 'קופסה בגובה הברך, וירידה בשליטה.',
        },
      },
      { exerciseId: 'cossack_squat', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'leg_extension', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'quads_gym_front_squat_power',
    name: { en: 'Front Squat and Jump Power', he: 'סקוואט קדמי וכוח קפיצה' },
    description: {
      en: 'An advanced quad session: a few box jumps while fresh, heavy front squats, pistol squats, leg press and leg extensions. Long rests, and every set stops short of failure.',
      he: 'אימון ארבע-ראשי למתקדמים: כמה קפיצות ארגז כשהגוף רענן, סקוואט קדמי כבד, פיסטול סקוואט, לחיצת רגליים ופשיטת ברכיים. מנוחות ארוכות, וכל סט נעצר לפני כשל.',
    },
    focus: 'quads',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'box_jump',
        sets: 3,
        reps: [4, 6],
        restSeconds: 90,
        cue: {
          en: 'Land softly and step down instead of jumping down.',
          he: 'נחיתה רכה, ולרדת בצעד ולא בקפיצה.',
        },
      },
      {
        exerciseId: 'front_squat',
        sets: 5,
        reps: [5, 6],
        restSeconds: 120,
        cue: {
          en: 'Elbows high, torso upright, knees out.',
          he: 'מרפקים גבוהים, פלג גוף זקוף, ברכיים החוצה.',
        },
      },
      {
        exerciseId: 'pistol_squat',
        sets: 3,
        reps: [4, 6],
        restSeconds: 90,
        cue: {
          en: 'Hold a rack upright for balance, or sit down to a bench if needed.',
          he: 'להחזיק עמוד של מתקן לשיווי משקל, או לשבת על ספסל אם צריך.',
        },
      },
      { exerciseId: 'leg_press', sets: 4, reps: [10, 12], restSeconds: 90 },
      { exerciseId: 'leg_extension', sets: 3, reps: [15, 20], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ hamstrings
  {
    id: 'hamstrings_gym_hinge_curl_basics',
    name: { en: 'Hinge and Curl Basics', he: 'יסודות ציר ירך וכפיפת ברכיים' },
    description: {
      en: 'A beginner hamstring session: dumbbell Romanian deadlift, cable pull-through and machine leg curls, with a bridge and a floor extension to finish. Light loads, clean form.',
      he: 'אימון לירך האחורית למתחילים: דדליפט רומני עם משקולות, פול ת׳רו בכבל וכפיפת ברכיים במכונה, ובסיום גשר ישבן וסופרמן. משקלים קלים וטכניקה נקייה.',
    },
    focus: 'hamstrings',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'dumbbell_romanian_deadlift',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Soft knees, hips back, stop when you feel the stretch behind the thighs.',
          he: 'ברכיים רכות, הירכיים לאחור, לעצור כשמרגישים מתיחה בירכיים מאחור.',
        },
      },
      { exerciseId: 'cable_pull_through', sets: 3, reps: [12, 15], restSeconds: 60 },
      {
        exerciseId: 'lying_leg_curl',
        sets: 3,
        reps: [10, 15],
        restSeconds: 60,
        cue: {
          en: 'Hips stay on the pad, lower the weight slowly.',
          he: 'האגן נשאר על המשטח, להוריד את המשקל לאט.',
        },
      },
      { exerciseId: 'glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'superman', sets: 2, reps: [10, 12], restSeconds: 30 },
    ],
  },
  {
    id: 'hamstrings_gym_rdl_single_leg',
    name: { en: 'Romanian Deadlift and Single-Leg Hinge', he: 'דדליפט רומני וציר ירך על רגל אחת' },
    description: {
      en: 'A hamstring session built on the barbell Romanian deadlift, a single-leg hinge for balance, a cable pull-through and single-leg bridges, with machine leg curls to finish.',
      he: 'אימון לירך האחורית שבנוי על דדליפט רומני עם מוט, דדליפט רומני על רגל אחת לשיווי משקל, פול ת׳רו בכבל וגשר ישבן על רגל אחת, ובסיום כפיפת ברכיים במכונה.',
    },
    focus: 'hamstrings',
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
          en: 'Soft knees, hips back, feel the stretch behind the thighs.',
          he: 'ברכיים רכות, הירכיים לאחור, להרגיש מתיחה בירכיים מאחור.',
        },
      },
      {
        exerciseId: 'single_leg_romanian_deadlift',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Hips stay level as the back leg reaches behind you.',
          he: 'האגן נשאר ישר בזמן שהרגל האחורית נמתחת לאחור.',
        },
      },
      { exerciseId: 'cable_pull_through', sets: 3, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'lying_leg_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
    ],
  },
  {
    id: 'hamstrings_gym_deadlift_swing_curl',
    name: { en: 'Deadlift, Swing and Curl', he: 'דדליפט, סווינג וכפיפות ברכיים' },
    description: {
      en: 'A posterior-chain day: deadlift for strength, then leg curls, kettlebell swings for hip speed and long-stride lunges, with a floor extension to finish. Moderate to long rests.',
      he: 'יום לשרשרת האחורית: דדליפט לכוח, ואחריו כפיפת ברכיים, קטלבל סווינג למהירות ירכיים ומכרעים בצעד ארוך, ובסיום סופרמן. מנוחות בינוניות עד ארוכות.',
    },
    focus: 'hamstrings',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'deadlift',
        sets: 4,
        reps: [6, 8],
        restSeconds: 120,
        cue: {
          en: 'Brace first, keep the bar against the legs, push the floor away.',
          he: 'קודם לנעול את הבטן, המוט צמוד לרגליים, לדחוף את הרצפה.',
        },
      },
      { exerciseId: 'lying_leg_curl', sets: 4, reps: [8, 12], restSeconds: 60 },
      {
        exerciseId: 'kettlebell_swing',
        sets: 4,
        reps: [12, 15],
        restSeconds: 60,
        cue: {
          en: 'Hinge, do not squat: the hips snap forward and the arms just hang on.',
          he: 'תנועת ציר ירך ולא סקוואט: הירכיים נדחפות קדימה והזרועות רק מחזיקות.',
        },
      },
      {
        exerciseId: 'walking_lunge',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Take a long stride so the hips stay back and the glute works.',
          he: 'צעד ארוך כדי שהירכיים יישארו אחורה והישבן יעבוד.',
        },
      },
      { exerciseId: 'superman', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'hamstrings_gym_nordic_heavy_hinge',
    name: { en: 'Nordic and Heavy Hinge', he: 'נורדיק וציר ירך כבד' },
    description: {
      en: 'An advanced hamstring session: heavy Romanian deadlifts, Nordic curls for eccentric strength, leg curls, kettlebell swings and single-leg bridges. Long rests, strict form.',
      he: 'אימון לירך האחורית למתקדמים: דדליפט רומני כבד, נורדיק קרל לכוח בירידה, כפיפת ברכיים, קטלבל סווינג וגשר ישבן על רגל אחת. מנוחות ארוכות וטכניקה קפדנית.',
    },
    focus: 'hamstrings',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'romanian_deadlift',
        sets: 4,
        reps: [6, 8],
        restSeconds: 120,
        cue: {
          en: 'Slow lowering, shoulder blades pulled back, bar close to the legs.',
          he: 'ירידה איטית, השכמות מכווצות לאחור, המוט קרוב לרגליים.',
        },
      },
      { exerciseId: 'kettlebell_swing', sets: 4, reps: [10, 12], restSeconds: 75 },
      { exerciseId: 'single_leg_glute_bridge', sets: 3, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'nordic_hamstring_curl',
        sets: 3,
        reps: [4, 6],
        restSeconds: 120,
        cue: {
          en: 'Anchor the heels firmly, lower as slowly as you can and catch yourself with the hands.',
          he: 'לעגן את העקבים היטב, לרדת לאט ככל האפשר ולבלום את הנפילה עם הידיים.',
        },
      },
      { exerciseId: 'lying_leg_curl', sets: 4, reps: [8, 10], restSeconds: 75 },
    ],
  },

  // ------------------------------------------------------------------ legs
  {
    id: 'legs_gym_machine_legs_starter',
    name: { en: 'Machine Leg Day', he: 'יום רגליים במכונות' },
    description: {
      en: 'A beginner leg day on machines: leg press, leg curl and leg extension for quads and hamstrings, then a bridge and calf raises. Guided movements that are easy to learn.',
      he: 'יום רגליים למתחילים במכונות: לחיצת רגליים, כפיפת ברכיים ופשיטת ברכיים לארבע-ראשי ולירך האחורית, ואחריהן גשר ישבן והרמות עקבים. תנועות מונחות שקל ללמוד.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'leg_press',
        sets: 3,
        reps: [12, 15],
        restSeconds: 75,
        cue: {
          en: 'Feet shoulder-width, lower until the knees are about 90 degrees.',
          he: 'כפות הרגליים ברוחב כתפיים, לרדת עד ברכיים בזווית של כ-90 מעלות.',
        },
      },
      { exerciseId: 'lying_leg_curl', sets: 3, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'leg_extension', sets: 2, reps: [12, 15], restSeconds: 45 },
      { exerciseId: 'glute_bridge', sets: 2, reps: [12, 15], restSeconds: 45 },
      {
        exerciseId: 'standing_calf_raise',
        sets: 2,
        reps: [15, 20],
        restSeconds: 30,
        cue: {
          en: 'Rise onto the toes, pause for a second, lower slowly.',
          he: 'לעלות על האצבעות, לעצור לשנייה ולרדת לאט.',
        },
      },
    ],
  },
  {
    id: 'legs_gym_goblet_hinge_legs',
    name: { en: 'Goblet, Hinge and Lunge Legs', he: 'רגליים: גובלט, ציר ירך ומכרעים' },
    description: {
      en: 'A beginner leg session with free weights and a cable: goblet squat, dumbbell Romanian deadlift, cable pull-through, reverse lunges and calf raises. Two to three sets each.',
      he: 'אימון רגליים למתחילים עם משקולות וכבל: גובלט סקוואט, דדליפט רומני עם משקולות, פול ת׳רו בכבל, מכרע לאחור והרמות עקבים. שניים עד שלושה סטים לכל תרגיל.',
    },
    focus: 'legs',
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
          en: 'Elbows inside the knees, chest tall.',
          he: 'המרפקים בין הברכיים, החזה זקוף.',
        },
      },
      {
        exerciseId: 'dumbbell_romanian_deadlift',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Hips back, flat back, dumbbells close to the legs.',
          he: 'הירכיים לאחור, גב ישר, המשקולות קרובות לרגליים.',
        },
      },
      { exerciseId: 'cable_pull_through', sets: 2, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'reverse_lunge', sets: 2, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'standing_calf_raise', sets: 2, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_gym_squat_rdl_day',
    name: { en: 'Squat and Romanian Deadlift Legs', he: 'רגליים: סקוואט ודדליפט רומני' },
    description: {
      en: 'A balanced leg day: barbell squat for the quads, Romanian deadlift for the hamstrings and glutes, then leg press, leg curls and calf raises. Straight sets, moderate rest.',
      he: 'יום רגליים מאוזן: סקוואט עם מוט לארבע-ראשי, דדליפט רומני לירך האחורית ולישבן, ואחריהם לחיצת רגליים, כפיפת ברכיים והרמות עקבים. סטים רגילים ומנוחות בינוניות.',
    },
    focus: 'legs',
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
          en: 'Brace the core, knees track over the toes, go as deep as you can control.',
          he: 'בטן נעולה, הברכיים בכיוון האצבעות, לרדת לעומק שנשלט.',
        },
      },
      {
        exerciseId: 'romanian_deadlift',
        sets: 3,
        reps: [8, 10],
        restSeconds: 90,
        cue: {
          en: 'Hips back, the bar glides along the thighs.',
          he: 'הירכיים לאחור, המוט גולש לאורך הירכיים.',
        },
      },
      { exerciseId: 'leg_press', sets: 3, reps: [10, 12], restSeconds: 75 },
      { exerciseId: 'lying_leg_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'standing_calf_raise', sets: 4, reps: [15, 20], restSeconds: 45 },
    ],
  },
  {
    id: 'legs_gym_single_leg_strength',
    name: { en: 'Single-Leg Strength Legs', he: 'רגליים: כוח על רגל אחת' },
    description: {
      en: 'A leg session that leans on one-leg work: reverse lunges, Bulgarian split squats and single-leg hinges, plus a cable pull-through, leg curls and single-leg calf raises. Each leg works on its own.',
      he: 'אימון רגליים שנשען על עבודה ברגל אחת: מכרע לאחור עם משקולות, סקוואט בולגרי ודדליפט רומני על רגל אחת, לצד פול ת׳רו בכבל, כפיפת ברכיים והרמות עקבים על רגל אחת. כל רגל עובדת בנפרד.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      { exerciseId: 'dumbbell_reverse_lunge', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'bulgarian_split_squat',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Front heel stays down. Hold a dumbbell in each hand once bodyweight feels easy.',
          he: 'העקב הקדמי נשאר על הרצפה. אפשר להוסיף משקולת בכל יד כשמשקל הגוף קל.',
        },
      },
      {
        exerciseId: 'single_leg_romanian_deadlift',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Hips stay level as the back leg reaches behind you. Hold a dumbbell once bodyweight feels easy.',
          he: 'האגן נשאר ישר בזמן שהרגל האחורית נמתחת לאחור. אפשר להוסיף משקולת כשמשקל הגוף קל.',
        },
      },
      { exerciseId: 'cable_pull_through', sets: 3, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'lying_leg_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [12, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_gym_jump_and_lift',
    name: { en: 'Box Jump and Smith Squat Legs', he: 'רגליים: קפיצות ארגז וסקוואט סמית׳' },
    description: {
      en: 'A leg day that starts with a few box jumps while fresh, then a Smith squat, kettlebell swings, leg curls, lunges and calf raises. Quick, athletic pace with moderate rest.',
      he: 'יום רגליים שמתחיל בכמה קפיצות ארגז כשהגוף רענן, ממשיך בסקוואט סמית׳, קטלבל סווינג, כפיפת ברכיים ומכרעים, ונגמר בהרמות עקבים. קצב אתלטי עם מנוחות בינוניות.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'box_jump',
        sets: 3,
        reps: [5, 6],
        restSeconds: 60,
        cue: {
          en: 'Land softly and step down instead of jumping down.',
          he: 'נחיתה רכה, ולרדת בצעד ולא בקפיצה.',
        },
      },
      { exerciseId: 'smith_machine_squat', sets: 4, reps: [8, 10], restSeconds: 90 },
      { exerciseId: 'kettlebell_swing', sets: 3, reps: [12, 15], restSeconds: 60 },
      { exerciseId: 'lying_leg_curl', sets: 3, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'walking_lunge', sets: 2, reps: [10, 12], restSeconds: 60 },
      { exerciseId: 'standing_calf_raise', sets: 3, reps: [15, 20], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_gym_heavy_legs',
    name: { en: 'Heavy Legs: Front Squat and Nordic', he: 'רגליים כבדות: סקוואט קדמי ונורדיק' },
    description: {
      en: 'An advanced leg session: front squat and Romanian deadlift as the heavy lifts, then loaded lunges, Nordic curls and single-leg calf raises. Long rests, controlled reps.',
      he: 'אימון רגליים למתקדמים: סקוואט קדמי ודדליפט רומני כתרגילים הכבדים, ואחריהם מכרעים עם משקולות, נורדיק קרל והרמות עקבים על רגל אחת. מנוחות ארוכות וחזרות בשליטה.',
    },
    focus: 'legs',
    mode: 'weights',
    level: 'advanced',
    places: ['gym'],
    items: [
      {
        exerciseId: 'front_squat',
        sets: 4,
        reps: [5, 6],
        restSeconds: 120,
        cue: {
          en: 'Elbows high, torso upright, knees out.',
          he: 'מרפקים גבוהים, פלג גוף זקוף, ברכיים החוצה.',
        },
      },
      { exerciseId: 'romanian_deadlift', sets: 4, reps: [6, 8], restSeconds: 120 },
      { exerciseId: 'dumbbell_reverse_lunge', sets: 3, reps: [8, 10], restSeconds: 75 },
      {
        exerciseId: 'nordic_hamstring_curl',
        sets: 3,
        reps: [4, 6],
        restSeconds: 120,
        cue: {
          en: 'Anchor the heels firmly, lower as slowly as you can and catch yourself with the hands.',
          he: 'לעגן את העקבים היטב, לרדת לאט ככל האפשר ולבלום את הנפילה עם הידיים.',
        },
      },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [12, 15], restSeconds: 45 },
    ],
  },

  // ------------------------------------------------------------------ core
  {
    id: 'core_gym_cable_floor_basics',
    name: { en: 'Cable and Floor Core Basics', he: 'יסודות ליבה: כבל ורצפה' },
    description: {
      en: 'A beginner core session: two cable exercises that teach the trunk to resist twisting and to rotate under control, then a dead bug and a plank on the floor.',
      he: 'אימון ליבה למתחילים: שני תרגילי כבל שמלמדים את הגו לעמוד בפני סיבוב ולהסתובב בשליטה, ואחריהם דד באג ופלאנק על הרצפה.',
    },
    focus: 'core',
    mode: 'weights',
    level: 'beginner',
    places: ['gym'],
    items: [
      {
        exerciseId: 'pallof_press',
        sets: 3,
        reps: [10, 12],
        restSeconds: 45,
        cue: {
          en: 'Resist the pull: hips and shoulders stay square to the front.',
          he: 'להתנגד למשיכה: האגן והכתפיים נשארים ישרים קדימה.',
        },
      },
      { exerciseId: 'cable_woodchop', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'dead_bug',
        sets: 3,
        reps: [8, 10],
        restSeconds: 30,
        cue: {
          en: 'The lower back stays flat on the floor.',
          he: 'הגב התחתון נשאר צמוד לרצפה.',
        },
      },
      { exerciseId: 'plank', sets: 3, seconds: 30, restSeconds: 30 },
    ],
  },
  {
    id: 'core_gym_anti_rotation_wheel',
    name: { en: 'Anti-Rotation and Wheel Core', he: 'ליבה: נגד סיבוב וגלגלת בטן' },
    description: {
      en: 'An intermediate core session: ab wheel rollouts first while fresh, then Pallof presses and woodchops for the obliques, and hanging knee raises for the abs to finish. Four sets each, short rests.',
      he: 'אימון ליבה לרמה בינונית: קודם גלגלת בטן כשהגוף רענן, ואחריה פאלוף פרס ווודצ׳ופ לשרירים האלכסוניים, ובסיום הרמות ברכיים בתלייה לשרירי הבטן. ארבעה סטים לכל תרגיל ומנוחות קצרות.',
    },
    focus: 'core',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      {
        exerciseId: 'ab_wheel_rollout',
        sets: 4,
        reps: [8, 12],
        restSeconds: 60,
        cue: {
          en: 'Ribs down, hips tucked, roll only as far as the lower back stays neutral.',
          he: 'הצלעות למטה, האגן מוטה פנימה, לגלגל רק עד כמה שהגב התחתון נשאר ניטרלי.',
        },
      },
      { exerciseId: 'pallof_press', sets: 4, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'cable_woodchop', sets: 4, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'hanging_knee_raise',
        sets: 4,
        reps: [10, 15],
        restSeconds: 45,
        cue: {
          en: 'Lift the pelvis toward the ribs and avoid swinging.',
          he: 'להרים את האגן לכיוון הצלעות ובלי להתנדנד.',
        },
      },
    ],
  },
];
