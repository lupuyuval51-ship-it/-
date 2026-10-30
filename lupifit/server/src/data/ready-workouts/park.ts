import type { ReadyWorkoutSeed } from '@shared/content';

/**
 * Park / street-workout sessions (18): ground, a fixed pull-up bar, dip bars, a bench or low wall, stairs and open space.
 * Everything is bodyweight mode. Places are listed from the gear: a workout that needs only a pull-up bar, a bench or no
 * equipment is also offered at home and in the gym; dip bars add the gym but not home.
 * The three cardio sessions and the sprint legs session are outdoor only on purpose: the jogging, stair intervals and
 * sprints are the session and need open space or a flight of stairs, so the "could also be offered in" notes for those
 * four are expected.
 * Counts: full_body 6, cardio 3, legs 3, core 2, upper_body 4.
 */
export const workouts: ReadyWorkoutSeed[] = [
  // ------------------------------------------------------------------ full body
  {
    id: 'full_body_park_bench_bar_basics',
    name: { en: 'Bench and Row Starter', he: 'התחלה עם ספסל ומתח אוסטרלי' },
    description: {
      en: 'A first park session for the whole body: step-ups and a hip hinge for the legs, incline push-ups, bar rows and a plank. Straight sets, three at most, with about a minute of rest.',
      he: 'אימון ראשון בפארק לכל הגוף: עליות לספסל וגוד מורנינג לרגליים, שכיבות סמיכה בידיים מוגבהות, מתח אוסטרלי ופלאנק. סטים רגילים, עד שלושה, עם כדקה של מנוחה.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['outdoor', 'gym'],
    items: [
      {
        exerciseId: 'step_up',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Use a bench or low wall. Whole foot on the surface, rise without pushing off the back foot.',
          he: 'להשתמש בספסל או בקיר נמוך. כל כף הרגל על המשטח, לעלות בלי לדחוף מהרגל האחורית.',
        },
      },
      {
        exerciseId: 'incline_push_up',
        sets: 3,
        reps: [8, 12],
        restSeconds: 60,
        cue: { en: 'Hands on the bench edge, body in one straight line.', he: 'הידיים על קצה הספסל, הגוף בקו ישר אחד.' },
      },
      {
        exerciseId: 'inverted_row',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Under a low bar or between the dip bars. Pull the chest to the bar, shoulder blades together.',
          he: 'מתחת למוט נמוך או בין המקבילים. למשוך את החזה למוט, השכמות מתקרבות.',
        },
      },
      { exerciseId: 'bodyweight_good_morning', sets: 2, reps: [10, 15], restSeconds: 45 },
      {
        exerciseId: 'plank',
        sets: 3,
        seconds: 25,
        restSeconds: 45,
        cue: {
          en: 'Forearms on the bench for an easier angle, or on a mat on the ground. Ribs pulled down.',
          he: 'האמות על הספסל לזווית קלה יותר, או על מחצלת על הקרקע. הצלעות כלפי מטה.',
        },
      },
    ],
  },
  {
    id: 'full_body_park_first_pull_up_path',
    name: { en: 'Road to the First Pull-Up', he: 'הדרך למתח הראשון' },
    description: {
      en: 'Lunges, bench dips and mountain climbers around slow negative pull-ups, a steady way to build towards a first full pull-up. Three sets at most, calm tempo and generous rest.',
      he: 'מכרעים, מקבילים על ספסל ומטפס הרים לצד עליות מתח שליליות איטיות, דרך יציבה לבנות כוח לקראת מתח מלא ראשון. עד שלושה סטים, קצב רגוע ומנוחה נדיבה.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['outdoor', 'home', 'gym'],
    items: [
      { exerciseId: 'walking_lunge', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'negative_pull_up',
        sets: 3,
        reps: [3, 5],
        restSeconds: 75,
        cue: {
          en: 'Step up to the top position, then lower for three to five seconds.',
          he: 'לעלות בצעד למצב העליון ולרדת לאט במשך שלוש עד חמש שניות.',
        },
      },
      {
        exerciseId: 'bench_dip',
        sets: 3,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Elbows back, hips close to the bench, shoulders away from the ears.',
          he: 'מרפקים לאחור, האגן קרוב לספסל, הכתפיים רחוקות מהאוזניים.',
        },
      },
      {
        exerciseId: 'mountain_climber',
        sets: 3,
        seconds: 20,
        restSeconds: 30,
        cue: { en: 'Hands on the bench for an easier angle, hips low.', he: 'הידיים על הספסל לזווית קלה יותר, האגן נמוך.' },
      },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 30 },
    ],
  },
  {
    id: 'full_body_park_pull_dip_single_leg',
    name: { en: 'Pull, Dip and Single-Leg Strength', he: 'כוח: מתח, מקבילים ורגל אחת' },
    description: {
      en: 'Straight sets built on pull-ups and dips, with Bulgarian split squats and single-leg deadlifts for the legs and hanging knee raises for the core. The heaviest bodyweight work comes first.',
      he: 'סטים רגילים סביב עליות מתח ומקבילים, עם סקוואט בולגרי ודדליפט רומני על רגל אחת לרגליים והרמות ברכיים בתלייה לליבה. העבודה הקשה ביותר במשקל הגוף באה ראשונה.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor', 'gym'],
    items: [
      {
        exerciseId: 'pull_up',
        sets: 4,
        reps: [5, 8],
        restSeconds: 90,
        cue: { en: 'Start from a full hang, chin over the bar, no kicking.', he: 'להתחיל מתלייה מלאה, סנטר מעל המוט, בלי תנופה.' },
      },
      {
        exerciseId: 'parallel_bar_dip',
        sets: 4,
        reps: [6, 10],
        restSeconds: 90,
        cue: {
          en: 'Lower until the upper arm is parallel to the ground; stop if the shoulders pinch.',
          he: 'לרדת עד שהזרוע העליונה מקבילה לקרקע; להפסיק אם הכתף נצבטת.',
        },
      },
      {
        exerciseId: 'bulgarian_split_squat',
        sets: 3,
        reps: [8, 10],
        restSeconds: 75,
        cue: {
          en: 'Rear foot on the bench, front knee in line with the toes, torso upright.',
          he: 'כף הרגל האחורית על הספסל, הברך הקדמית בכיוון האצבעות, הגו זקוף.',
        },
      },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'hanging_knee_raise', sets: 3, reps: [10, 15], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_park_chin_up_burpee_mix',
    name: { en: 'Chin-Ups and Burpees Mix', he: 'שילוב מתח באחיזה הפוכה וברפי' },
    description: {
      en: 'Chin-ups and decline push-ups for strength, then jump squats and burpees to raise the pace, and bear crawls and V-ups to finish. Short rests keep the session moving.',
      he: 'מתח באחיזה הפוכה ושכיבות סמיכה ברגליים מוגבהות לכוח, אחר כך סקוואט קפיצה וברפי להעלאת הקצב, ובסיום זחילת דוב והרמות V. מנוחות קצרות שומרות על קצב רציף.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor', 'home', 'gym'],
    items: [
      {
        exerciseId: 'chin_up',
        sets: 4,
        reps: [5, 8],
        restSeconds: 75,
        cue: { en: 'Palms facing you, full hang at the bottom, chest to the bar.', he: 'כפות הידיים פונות לגוף, תלייה מלאה בתחתית, החזה למוט.' },
      },
      {
        exerciseId: 'decline_push_up',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Feet on the bench, body in one line, elbows about 45 degrees from the body.',
          he: 'הרגליים על הספסל, הגוף בקו ישר, המרפקים בזווית של כ-45 מעלות מהגוף.',
        },
      },
      { exerciseId: 'jump_squat', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'burpee', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'bear_crawl', sets: 3, seconds: 30, restSeconds: 30 },
      {
        exerciseId: 'v_up',
        sets: 3,
        reps: [10, 12],
        restSeconds: 40,
        cue: { en: 'On a mat or grass. Reach for the toes without swinging.', he: 'על מחצלת או דשא. להושיט יד לבהונות בלי תנופה.' },
      },
    ],
  },
  {
    id: 'full_body_park_stairs_and_bars',
    name: { en: 'Stairs and Bars Mix', he: 'שילוב מדרגות ומתח' },
    description: {
      en: 'Pull-ups and push-ups for the upper body, Cossack squats and stair runs for the legs, and hanging oblique knee raises for the core. A varied mix at a steady pace with moderate rests.',
      he: 'עליות מתח ושכיבות סמיכה לפלג הגוף העליון, סקוואט קוזאקי וריצה במדרגות לרגליים, והרמות ברכיים לצד בתלייה לליבה. שילוב מגוון בקצב יציב ועם מנוחות בינוניות.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor', 'home', 'gym'],
    items: [
      { exerciseId: 'pull_up', sets: 3, reps: [5, 8], restSeconds: 75 },
      { exerciseId: 'push_up', sets: 3, reps: [12, 18], restSeconds: 60 },
      {
        exerciseId: 'cossack_squat',
        sets: 3,
        reps: [6, 8],
        restSeconds: 45,
        cue: { en: 'Keep the heel of the bent leg down and the chest up.', he: 'העקב של הרגל הכפופה נשאר על הקרקע והחזה זקוף.' },
      },
      {
        exerciseId: 'stair_run',
        sets: 4,
        seconds: 30,
        restSeconds: 60,
        cue: {
          en: 'Dry, even steps with a handrail within reach. Walk down to recover.',
          he: 'מדרגות יבשות ואחידות עם מעקה בהישג יד. לרדת בהליכה כדי להתאושש.',
        },
      },
      { exerciseId: 'hanging_oblique_knee_raise', sets: 3, reps: [6, 10], restSeconds: 45 },
    ],
  },
  {
    id: 'full_body_park_explosive_calisthenics',
    name: { en: 'Explosive Calisthenics', he: 'קליסטניקס מתפרץ' },
    description: {
      en: 'Broad jumps and clap push-ups while fresh, then wide-grip pull-ups, shrimp squats and toes to bar. Suits an advanced level with a solid base in pull-ups, push-ups and single-leg strength.',
      he: 'קפיצות לרוחק ושכיבות סמיכה עם מחיאת כף כשהגוף רענן, ואחר כך עליות מתח באחיזה רחבה, שרימפ סקוואט ורגליים למוט. מתאים לרמה מתקדמת עם בסיס טוב בכוח משיכה, דחיפה ורגל אחת.',
    },
    focus: 'full_body',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['outdoor', 'home', 'gym'],
    items: [
      {
        exerciseId: 'broad_jump',
        sets: 4,
        reps: [4, 6],
        restSeconds: 75,
        cue: {
          en: 'Land softly with bent knees, reset between jumps and stop when the landings get heavy.',
          he: 'לנחות רך עם ברכיים כפופות, להתייצב בין הקפיצות ולעצור כשהנחיתות כבדות.',
        },
      },
      {
        exerciseId: 'clap_push_up',
        sets: 4,
        reps: [5, 6],
        restSeconds: 75,
        cue: {
          en: 'Push the ground away fast and land with soft elbows. End the set when the speed drops.',
          he: 'לדחוף את הקרקע במהירות ולנחות עם מרפקים רכים. לסיים את הסט כשהמהירות יורדת.',
        },
      },
      { exerciseId: 'wide_grip_pull_up', sets: 4, reps: [5, 8], restSeconds: 90 },
      {
        exerciseId: 'shrimp_squat',
        sets: 3,
        reps: [5, 6],
        restSeconds: 90,
        cue: {
          en: 'Hold a post or the bar for balance at first. Lower slowly, back knee touches softly.',
          he: 'בהתחלה אפשר להיאחז בעמוד או במוט לשיווי משקל. לרדת לאט, הברך האחורית נוגעת בעדינות.',
        },
      },
      { exerciseId: 'toes_to_bar', sets: 3, reps: [5, 8], restSeconds: 75 },
    ],
  },

  // ------------------------------------------------------------------ cardio
  {
    id: 'cardio_park_jog_rope_bench_intervals',
    name: { en: 'Easy Jog, Rope and Bench Intervals', he: 'אינטרוולים קלים: ריצה, חבל וספסל' },
    description: {
      en: 'Three jog-and-walk intervals, a jump-rope round, bench step-ups and light footwork drills. Work and rest are even and nothing is all-out, so it suits a first cardio session outdoors.',
      he: 'שלושה אינטרוולים של ריצה קלה והליכה, סבב קפיצות בחבל, עליות לספסל ותרגילי רגליים קלים. העבודה והמנוחה שווים ושום דבר לא במאמץ מרבי, כך שזה מתאים לאימון קרדיו ראשון בחוץ.',
    },
    focus: 'cardio',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['outdoor'],
    items: [
      {
        exerciseId: 'brisk_walk_jog',
        sets: 3,
        seconds: 60,
        restSeconds: 60,
        cue: {
          en: 'Jog at a pace that still allows short sentences, and walk during the rest.',
          he: 'לרוץ בקצב שעדיין מאפשר לדבר במשפטים קצרים, וללכת בזמן המנוחה.',
        },
      },
      {
        exerciseId: 'step_up',
        sets: 3,
        reps: [8, 10],
        restSeconds: 45,
        cue: { en: 'Bench or low wall, whole foot on top. Same number of reps on each leg.', he: 'ספסל או קיר נמוך, כל כף הרגל למעלה. אותה כמות חזרות בכל רגל.' },
      },
      { exerciseId: 'jump_rope_skipping', sets: 3, seconds: 45, restSeconds: 45 },
      { exerciseId: 'lateral_shuffle', sets: 3, seconds: 30, restSeconds: 30 },
      { exerciseId: 'a_skip', sets: 3, seconds: 30, restSeconds: 30 },
      {
        exerciseId: 'mountain_climber',
        sets: 3,
        seconds: 20,
        restSeconds: 30,
        cue: { en: 'Hands on the bench to keep it easy on the wrists.', he: 'הידיים על הספסל כדי להקל על פרקי הידיים.' },
      },
    ],
  },
  {
    id: 'cardio_park_stair_intervals_burpees',
    name: { en: 'Stair Intervals and Burpees', he: 'אינטרוולים במדרגות וברפי' },
    description: {
      en: 'Five stair-run intervals, then broad jumps, lateral shuffles, burpees, bear crawls and high knees. Walk down between efforts, warm up well and choose dry, even stairs.',
      he: 'חמישה אינטרוולים של ריצה במדרגות, ואחריהם קפיצות לרוחק, צעדים צידיים מהירים, ברפי, זחילת דוב והרמות ברכיים. ללכת למטה בין המאמצים, להתחמם היטב ולבחור מדרגות יבשות ואחידות.',
    },
    focus: 'cardio',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor'],
    items: [
      {
        exerciseId: 'stair_run',
        sets: 5,
        seconds: 45,
        restSeconds: 60,
        cue: {
          en: 'Whole foot on every step, handrail within reach. Walk down to recover.',
          he: 'כל כף הרגל על כל מדרגה, מעקה בהישג יד. לרדת בהליכה כדי להתאושש.',
        },
      },
      { exerciseId: 'broad_jump', sets: 3, reps: [6, 8], restSeconds: 45 },
      { exerciseId: 'lateral_shuffle', sets: 3, seconds: 30, restSeconds: 30 },
      { exerciseId: 'burpee', sets: 3, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'bear_crawl', sets: 3, seconds: 30, restSeconds: 30 },
      { exerciseId: 'high_knees', sets: 3, seconds: 30, restSeconds: 30 },
    ],
  },
  {
    id: 'cardio_park_sprint_shuttles_pull_ups',
    name: { en: 'Sprint Shuttles and Pull-Ups', he: 'ספרינטים הלוך וחזור ועליות מתח' },
    description: {
      en: 'Short shuttle sprints at a fast but controlled pace, then tuck jumps, pull-ups, burpees and bear crawls to keep the heart rate high. For an advanced level that already runs and jumps regularly.',
      he: 'ספרינטים קצרים הלוך וחזור בקצב מהיר אך מבוקר, ואחריהם קפיצות ברכיים לחזה, עליות מתח, ברפי וזחילת דוב כדי לשמור על דופק גבוה. מתאים לרמה מתקדמת עם רקע קבוע בריצה ובקפיצות.',
    },
    focus: 'cardio',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['outdoor'],
    items: [
      {
        exerciseId: 'sprint_intervals',
        sets: 5,
        seconds: 15,
        restSeconds: 90,
        cue: {
          en: 'Mark 15 to 20 metres and run out and back at a fast but controlled pace, never all-out.',
          he: 'לסמן 15 עד 20 מטרים ולרוץ הלוך וחזור בקצב מהיר אך מבוקר, לא במאמץ מרבי.',
        },
      },
      {
        exerciseId: 'tuck_jump',
        sets: 3,
        reps: [5, 6],
        restSeconds: 60,
        cue: { en: 'Land softly on the whole foot and reset between jumps.', he: 'לנחות רך על כל כף הרגל ולהתייצב בין הקפיצות.' },
      },
      { exerciseId: 'pull_up', sets: 4, reps: [5, 8], restSeconds: 60 },
      { exerciseId: 'burpee', sets: 4, reps: [8, 10], restSeconds: 45 },
      { exerciseId: 'bear_crawl', sets: 3, seconds: 30, restSeconds: 30 },
      { exerciseId: 'mountain_climber', sets: 3, seconds: 30, restSeconds: 30 },
    ],
  },

  // ------------------------------------------------------------------ legs
  {
    id: 'legs_park_bench_leg_basics',
    name: { en: 'Bench Leg Basics', he: 'יסודות רגליים עם ספסל' },
    description: {
      en: 'Sit-to-stand squats, step-ups, a hip hinge, hip thrusts from the bench and calf raises. Controlled bodyweight work for quads, glutes and hamstrings, three sets at most.',
      he: 'סקוואט לספסל, עליות לספסל, גוד מורנינג, היפ טראסט מהספסל והרמות עקבים. עבודה מבוקרת במשקל הגוף לארבע ראשי, לישבן ולירך האחורית, עד שלושה סטים.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['outdoor', 'home', 'gym'],
    items: [
      {
        exerciseId: 'box_squat',
        sets: 3,
        reps: [10, 12],
        restSeconds: 60,
        cue: {
          en: 'Sit on the bench edge and stand up without rocking. Knees follow the toes.',
          he: 'לשבת על קצה הספסל ולקום בלי להתנדנד. הברכיים בכיוון הבהונות.',
        },
      },
      { exerciseId: 'step_up', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'bodyweight_good_morning', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'bodyweight_hip_thrust',
        sets: 3,
        reps: [10, 15],
        restSeconds: 45,
        cue: {
          en: 'Upper back on the bench, drive through the heels and squeeze the glutes at the top.',
          he: 'הגב העליון על הספסל, לדחוף דרך העקבים ולכווץ את הישבן למעלה.',
        },
      },
      {
        exerciseId: 'standing_calf_raise',
        sets: 2,
        reps: [12, 15],
        restSeconds: 30,
        cue: { en: 'On the edge of a step for a full range.', he: 'על קצה מדרגה לטווח תנועה מלא.' },
      },
    ],
  },
  {
    id: 'legs_park_single_leg_bench_stairs',
    name: { en: 'Single-Leg Bench and Stairs', he: 'רגליים על רגל אחת: ספסל ומדרגות' },
    description: {
      en: 'Bulgarian split squats, single-leg hip thrusts from the bench and stair runs for the legs, finished with hamstring walkouts and single-leg calf raises. Mostly one leg at a time.',
      he: 'סקוואט בולגרי, היפ טראסט על רגל אחת מהספסל וריצה במדרגות לרגליים, ובסיום הליכת עקבים בגשר והרמות עקבים על רגל אחת. רוב העבודה על רגל אחת בכל פעם.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor', 'home', 'gym'],
    items: [
      {
        exerciseId: 'bulgarian_split_squat',
        sets: 4,
        reps: [8, 10],
        restSeconds: 60,
        cue: {
          en: 'Rear foot on the bench, short stride, front heel stays down.',
          he: 'כף הרגל האחורית על הספסל, צעד קצר, העקב הקדמי נשאר על הקרקע.',
        },
      },
      {
        exerciseId: 'stair_run',
        sets: 4,
        seconds: 30,
        restSeconds: 60,
        cue: {
          en: 'Dry, even steps with a handrail within reach. Walk down to recover.',
          he: 'מדרגות יבשות ואחידות עם מעקה בהישג יד. לרדת בהליכה כדי להתאושש.',
        },
      },
      {
        exerciseId: 'single_leg_hip_thrust',
        sets: 3,
        reps: [8, 12],
        restSeconds: 45,
        cue: { en: 'Upper back on the bench, hips level, lock out at the top.', he: 'הגב העליון על הספסל, האגן ישר, לנעול את התנועה למעלה.' },
      },
      {
        exerciseId: 'hamstring_walkout',
        sets: 3,
        reps: [8, 12],
        restSeconds: 45,
        cue: {
          en: 'On a mat or towel on the grass. Hips stay up as the heels walk out.',
          he: 'על מחצלת או מגבת על הדשא. האגן נשאר למעלה בזמן שהעקבים צועדים החוצה.',
        },
      },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [10, 15], restSeconds: 30 },
    ],
  },
  {
    id: 'legs_park_sprints_pistol_strength',
    name: { en: 'Sprints and Pistol Squats', he: 'ספרינטים ופיסטול סקוואט' },
    description: {
      en: 'Short sprints while fresh, then pistol squats, single-leg deadlifts, Cossack squats and calf raises. Heavy on one-leg strength and balance; end a set when form breaks.',
      he: 'ספרינטים קצרים כשהגוף רענן, ואחריהם פיסטול סקוואט, דדליפט רומני על רגל אחת, סקוואט קוזאקי והרמות עקבים. דגש על כוח ושיווי משקל ברגל אחת; לסיים סט כשהטכניקה נשברת.',
    },
    focus: 'legs',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['outdoor'],
    items: [
      {
        exerciseId: 'sprint_intervals',
        sets: 5,
        seconds: 15,
        restSeconds: 90,
        cue: {
          en: 'About 20 metres at a fast but controlled pace, never all-out. Walk back to recover.',
          he: 'כ-20 מטרים בקצב מהיר אך מבוקר, לא במאמץ מרבי. לחזור בהליכה כדי להתאושש.',
        },
      },
      {
        exerciseId: 'pistol_squat',
        sets: 4,
        reps: [5, 6],
        restSeconds: 90,
        cue: {
          en: 'Hold a bar or post at first if needed. Lower slowly and keep the heel down.',
          he: 'בהתחלה אפשר להיאחז במוט או בעמוד. לרדת לאט ולשמור על העקב על הקרקע.',
        },
      },
      { exerciseId: 'single_leg_romanian_deadlift', sets: 3, reps: [8, 10], restSeconds: 60 },
      { exerciseId: 'cossack_squat', sets: 3, reps: [6, 8], restSeconds: 60 },
      { exerciseId: 'single_leg_calf_raise', sets: 3, reps: [10, 15], restSeconds: 30 },
    ],
  },

  // ------------------------------------------------------------------ core
  {
    id: 'core_park_ground_and_bench_core',
    name: { en: 'Ground and Bench Core', he: 'ליבה על הקרקע ועל הספסל' },
    description: {
      en: 'Five simple core moves for the front, sides and lower back: plank, side plank, bird dog, mountain climbers and reverse crunches. Short holds, three sets at most.',
      he: 'חמישה תרגילי ליבה פשוטים לבטן, לצדדים ולגב התחתון: פלאנק, פלאנק צידי, בירד דוג, מטפס הרים וכפיפות בטן הפוכות. החזקות קצרות ולא יותר משלושה סטים.',
    },
    focus: 'core',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['outdoor', 'home', 'gym'],
    items: [
      {
        exerciseId: 'plank',
        sets: 3,
        seconds: 25,
        restSeconds: 45,
        cue: {
          en: 'Forearms on the bench for an easier angle, or on a mat on the ground. Straight line, ribs down.',
          he: 'האמות על הספסל לזווית קלה יותר, או על מחצלת על הקרקע. קו ישר, הצלעות כלפי מטה.',
        },
      },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 30 },
      {
        exerciseId: 'bird_dog',
        sets: 3,
        reps: [8, 10],
        restSeconds: 30,
        cue: { en: 'On a mat or grass. Keep the hips level and move slowly.', he: 'על מחצלת או דשא. האגן ישר ותנועה איטית.' },
      },
      {
        exerciseId: 'mountain_climber',
        sets: 3,
        seconds: 20,
        restSeconds: 30,
        cue: { en: 'Hands on the bench to make it easier.', he: 'הידיים על הספסל כדי להקל.' },
      },
      {
        exerciseId: 'reverse_crunch',
        sets: 3,
        reps: [10, 12],
        restSeconds: 30,
        cue: {
          en: 'On a mat. Curl the hips up with the abs rather than swinging the legs.',
          he: 'על מחצלת. לגלגל את האגן למעלה בעזרת הבטן ולא בתנופת רגליים.',
        },
      },
    ],
  },
  {
    id: 'core_park_hang_and_hold_core',
    name: { en: 'Hang and Hold Core', he: 'ליבה: תלייה והחזקות' },
    description: {
      en: 'Hanging knee raises and oblique raises on the bar, then hollow holds, side plank hip dips and supermans on the ground for the whole trunk. Controlled reps, no swinging.',
      he: 'הרמות ברכיים והרמות ברכיים לצד בתלייה על המוט, ואחר כך החזקות הולו בודי, פלאנק צידי עם הורדת אגן וסופרמן על הקרקע לכל הגו. חזרות מבוקרות, בלי נדנוד.',
    },
    focus: 'core',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor', 'home', 'gym'],
    items: [
      {
        exerciseId: 'hanging_knee_raise',
        sets: 4,
        reps: [8, 12],
        restSeconds: 60,
        cue: {
          en: 'Shoulders active, lift the knees by curling the pelvis, no swinging.',
          he: 'כתפיים פעילות, להרים את הברכיים בעזרת גלגול האגן, בלי נדנוד.',
        },
      },
      { exerciseId: 'hanging_oblique_knee_raise', sets: 3, reps: [6, 10], restSeconds: 45 },
      {
        exerciseId: 'hollow_body_hold',
        sets: 3,
        seconds: 40,
        restSeconds: 45,
        cue: { en: 'On a mat or grass. The lower back stays pressed down.', he: 'על מחצלת או דשא. הגב התחתון נשאר צמוד לקרקע.' },
      },
      { exerciseId: 'side_plank_hip_dip', sets: 3, reps: [8, 12], restSeconds: 30 },
      { exerciseId: 'superman', sets: 3, reps: [10, 12], restSeconds: 30 },
    ],
  },

  // ------------------------------------------------------------------ upper body
  {
    id: 'upper_body_park_hang_row_push_basics',
    name: { en: 'Hang, Row and Push Basics', he: 'יסודות תלייה, מתח אוסטרלי ושכיבות סמיכה' },
    description: {
      en: 'Push-ups, bar rows and scapular pull-ups, a scapular push-up for shoulder control and a dead hang to finish. A gentle way to learn the basic pushing and pulling patterns.',
      he: 'שכיבות סמיכה, מתח אוסטרלי ומשיכות שכמות בתלייה, שכיבת סמיכה לשכמות לשליטה בכתף ותלייה על המוט לסיום. דרך עדינה ללמוד את דפוסי הדחיפה והמשיכה הבסיסיים.',
    },
    focus: 'upper_body',
    mode: 'bodyweight',
    level: 'beginner',
    places: ['outdoor', 'gym'],
    items: [
      {
        exerciseId: 'push_up',
        sets: 3,
        reps: [6, 10],
        restSeconds: 60,
        cue: { en: 'Body in one line, elbows about 45 degrees from the body.', he: 'הגוף בקו ישר, המרפקים בזווית של כ-45 מעלות מהגוף.' },
      },
      { exerciseId: 'inverted_row', sets: 3, reps: [8, 10], restSeconds: 60 },
      {
        exerciseId: 'scapular_pull_up',
        sets: 3,
        reps: [6, 8],
        restSeconds: 60,
        cue: { en: 'Straight arms. Only the shoulder blades move, down and back.', he: 'זרועות ישרות. רק השכמות זזות, למטה ואחורה.' },
      },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'dead_hang',
        sets: 3,
        seconds: 20,
        restSeconds: 45,
        cue: {
          en: 'Firm grip, shoulders down away from the ears. Step down if the grip fails.',
          he: 'אחיזה יציבה, הכתפיים למטה הרחק מהאוזניים. לרדת אם האחיזה נחלשת.',
        },
      },
    ],
  },
  {
    id: 'upper_body_park_chin_decline_pike',
    name: { en: 'Chin-Ups with Decline and Pike Push-Ups', he: 'מתח באחיזה הפוכה עם שכיבות בשיפוע ופייק' },
    description: {
      en: 'Chin-ups and bar rows for the back and biceps, with decline and pike push-ups that change the angle for chest and shoulders, and a prone T raise for the rear shoulders. Straight sets, moderate rest.',
      he: 'מתח באחיזה הפוכה ומתח אוסטרלי לגב ולדו ראשי, עם שכיבות סמיכה בשיפוע ושכיבות פייק שמשנות את זווית העבודה לחזה ולכתפיים, והרמת T על הבטן לכתפיים האחוריות. סטים רגילים, מנוחה בינונית.',
    },
    focus: 'upper_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor', 'gym'],
    items: [
      { exerciseId: 'chin_up', sets: 4, reps: [5, 8], restSeconds: 75 },
      {
        exerciseId: 'decline_push_up',
        sets: 4,
        reps: [8, 12],
        restSeconds: 60,
        cue: { en: 'Feet on the bench, ribs tucked, chest toward the ground.', he: 'הרגליים על הספסל, הצלעות מכווצות, החזה לכיוון הקרקע.' },
      },
      { exerciseId: 'inverted_row', sets: 3, reps: [10, 12], restSeconds: 45 },
      {
        exerciseId: 'pike_push_up',
        sets: 3,
        reps: [6, 10],
        restSeconds: 60,
        cue: { en: 'Hips high, head moves between the hands, elbows slightly forward.', he: 'האגן גבוה, הראש נע בין הידיים, המרפקים מעט קדימה.' },
      },
      {
        exerciseId: 'prone_t_raise',
        sets: 3,
        reps: [10, 12],
        restSeconds: 30,
        cue: { en: 'On a mat. Light and slow, squeeze the shoulder blades.', he: 'על מחצלת. קל ואיטי, לכווץ את השכמות.' },
      },
    ],
  },
  {
    id: 'upper_body_park_dips_wide_pull_ups',
    name: { en: 'Dips and Wide Pull-Ups', he: 'מקבילים ומתח באחיזה רחבה' },
    description: {
      en: 'Wide-grip pull-ups and chest dips as the main work, with Hindu push-ups for shoulder mobility and strength and bar rows. Finishes with a dead hang for grip and a relaxed stretch of the shoulders.',
      he: 'עליות מתח באחיזה רחבה ומקבילים לחזה כעבודה מרכזית, עם שכיבות סמיכה הינדיות לניידות וכוח בכתפיים ומתח אוסטרלי. מסתיים בתלייה על המוט לאחיזה ולמתיחה רגועה של הכתפיים.',
    },
    focus: 'upper_body',
    mode: 'bodyweight',
    level: 'intermediate',
    places: ['outdoor', 'gym'],
    items: [
      {
        exerciseId: 'wide_grip_pull_up',
        sets: 4,
        reps: [5, 8],
        restSeconds: 90,
        cue: { en: 'Start from a full hang and pull the elbows down toward the ribs.', he: 'להתחיל מתלייה מלאה ולמשוך את המרפקים למטה לכיוון הצלעות.' },
      },
      {
        exerciseId: 'chest_dip',
        sets: 4,
        reps: [6, 10],
        restSeconds: 90,
        cue: { en: 'Lean forward slightly and lower only as far as the shoulders feel comfortable.', he: 'להישען מעט קדימה ולרדת רק עד הנקודה שבה הכתפיים נוחות.' },
      },
      { exerciseId: 'hindu_push_up', sets: 3, reps: [8, 12], restSeconds: 45 },
      { exerciseId: 'inverted_row', sets: 3, reps: [10, 12], restSeconds: 45 },
      { exerciseId: 'dead_hang', sets: 2, seconds: 30, restSeconds: 45 },
    ],
  },
  {
    id: 'upper_body_park_archer_strength',
    name: { en: 'Archer Pull-Ups and Push-Ups', he: 'עליות מתח ושכיבות סמיכה קשת (ארצ׳ר)' },
    description: {
      en: 'Archer pull-ups and archer push-ups shift most of the load onto one arm at a time, backed by dips, chin-ups and a prone Y raise for the shoulder blades. For an advanced level; end each set before form breaks.',
      he: 'עליות מתח ושכיבות סמיכה קשת (ארצ׳ר) מעבירות את רוב העומס לזרוע אחת בכל פעם, בתוספת מקבילים, מתח באחיזה הפוכה והרמת Y על הבטן לשכמות. מתאים לרמה מתקדמת; לסיים כל סט לפני שהטכניקה נשברת.',
    },
    focus: 'upper_body',
    mode: 'bodyweight',
    level: 'advanced',
    places: ['outdoor', 'gym'],
    items: [
      {
        exerciseId: 'archer_pull_up',
        sets: 4,
        reps: [4, 6],
        restSeconds: 90,
        cue: {
          en: 'Pull toward one hand while the other arm stays long. Keep the shoulders down.',
          he: 'למשוך לכיוון יד אחת בזמן שהיד השנייה נשארת ארוכה. הכתפיים למטה.',
        },
      },
      {
        exerciseId: 'archer_push_up',
        sets: 4,
        reps: [5, 8],
        restSeconds: 90,
        cue: {
          en: 'Wide hands. Lower toward one hand while the other arm stays straight.',
          he: 'ידיים רחבות. לרדת לכיוון יד אחת בזמן שהיד השנייה נשארת ישרה.',
        },
      },
      { exerciseId: 'parallel_bar_dip', sets: 3, reps: [8, 12], restSeconds: 75 },
      { exerciseId: 'chin_up', sets: 3, reps: [5, 8], restSeconds: 75 },
      {
        exerciseId: 'prone_y_raise',
        sets: 3,
        reps: [10, 12],
        restSeconds: 30,
        cue: {
          en: 'On a mat. Thumbs up, lift with the upper back rather than the lower back.',
          he: 'על מחצלת. אגודלים למעלה, להרים בעזרת הגב העליון ולא התחתון.',
        },
      },
    ],
  },
];
