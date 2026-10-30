import type { SportBlockSeed } from '@shared/content';

export const blocks: SportBlockSeed[] = [
  // ------------------------------------------------------------------ Striking
  {
    id: 'striking_bodyweight',
    sport: 'striking',
    variant: 'bodyweight',
    name: { en: 'Striking: rounds, legs and rotation', he: 'אומנויות לחימה: סבבים, רגליים וסיבוב' },
    description: {
      en: 'Five stations for shadow-boxing rounds, leg power, shoulder endurance under load, knee-strike hip drive and rotational trunk control.',
      he: 'חמש תחנות לסבבי איגרוף בצל, כוח רגליים, סיבולת כתפיים תחת עומס, הנעת אגן במכת ברך ושליטה בסיבוב הליבה.',
    },
    items: [
      { exerciseId: 'shadow_boxing', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'jump_squat', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'push_up_shoulder_tap', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'standing_knee_strike', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'russian_twist', sets: 1, reps: [10, 14], restSeconds: 20 },
    ],
  },
  {
    id: 'striking_gear',
    sport: 'striking',
    variant: 'gear',
    name: { en: 'Striking: rope, rotation and shoulders', he: 'אומנויות לחימה: חבל, סיבוב וכתפיים' },
    description: {
      en: 'Jump rope for footwork rhythm, band rotator-cuff work, medicine-ball rotational throws, kettlebell swings for hip power and band pull-aparts for the upper back.',
      he: 'קפיצה בחבל לקצב עבודת רגליים, חיזוק השרוול המסובב בגומייה, זריקות סיבוב עם כדור כוח, נדנודי קטלבל לכוח אגן ופתיחת גומייה לגב העליון.',
    },
    items: [
      { exerciseId: 'jump_rope_skipping', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'band_external_rotation', sets: 2, reps: [12, 15], restSeconds: 10 },
      { exerciseId: 'medicine_ball_rotational_throw', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'kettlebell_swing', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'band_pull_apart', sets: 1, reps: [12, 15], restSeconds: 20 },
    ],
  },
  {
    id: 'striking_gentle',
    sport: 'striking',
    variant: 'gentle',
    name: { en: 'Striking: gentle rounds and trunk', he: 'אומנויות לחימה: סבבים עדינים וליבה' },
    description: {
      en: 'Low-impact version: easy shadow-boxing, close-grip push-ups for pushing endurance, step jacks, heel touches for trunk rotation and scapular control.',
      he: 'גרסה בעומס נמוך: איגרוף בצל קל, שכיבות סמיכה בפיסוק צר לסיבולת דחיפה, סטפ ג\'ק, נגיעות עקב לסיבוב הליבה ושליטה בשכמות.',
    },
    items: [
      { exerciseId: 'shadow_boxing', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'close_grip_push_up', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'step_jack', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'heel_touch', sets: 2, reps: [10, 14], restSeconds: 20 },
      { exerciseId: 'scapular_push_up', sets: 1, reps: [8, 12], restSeconds: 40 },
    ],
  },

  // ------------------------------------------------------------------ Grappling
  {
    id: 'grappling_bodyweight',
    sport: 'grappling',
    variant: 'bodyweight',
    name: { en: 'Grappling: hips, sprawls and trunk', he: 'היאבקות וגריפה: אגן, ספרול וליבה' },
    description: {
      en: 'Five stations for hip escapes, sprawl speed, bear-crawl locomotion, bridging hip drive and a hollow hold for trunk tension.',
      he: 'חמש תחנות לבריחות אגן, מהירות ספרול, תנועת זחילת דוב, דחיפת אגן בגשר וקשיחות הליבה בהחזקת הולו בודי.',
    },
    items: [
      { exerciseId: 'hip_escape', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'sprawl', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'bear_crawl', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'glute_bridge', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'hollow_body_hold', sets: 1, seconds: 40, restSeconds: 40 },
    ],
  },
  {
    id: 'grappling_gear',
    sport: 'grappling',
    variant: 'gear',
    name: { en: 'Grappling: grip, pull and hip drive', he: 'היאבקות וגריפה: אחיזה, משיכה והנעת אגן' },
    description: {
      en: 'Kettlebell swings for hip drive, sprawls, one-arm band rows, dead hangs for grip endurance and a hollow hold to finish.',
      he: 'נדנודי קטלבל להנעת אגן, ספרול, חתירה ביד אחת עם גומייה, תלייה במתח לסיבולת אחיזה והחזקת הולו בודי לסיום.',
    },
    items: [
      { exerciseId: 'kettlebell_swing', sets: 2, reps: [12, 15], restSeconds: 20 },
      { exerciseId: 'sprawl', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'single_arm_band_row', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'dead_hang', sets: 2, seconds: 30, restSeconds: 30 },
      { exerciseId: 'hollow_body_hold', sets: 1, seconds: 40, restSeconds: 40 },
    ],
  },
  {
    id: 'grappling_gentle',
    sport: 'grappling',
    variant: 'gentle',
    name: { en: 'Grappling: gentle crawling and bridging', he: 'היאבקות וגריפה: זחילה וגשר עדינים' },
    description: {
      en: 'Low-impact version: slow mountain climbers, bird-dog crawl pattern, glute bridges for hip extension, a push-up hold and side planks for trunk tension.',
      he: 'גרסה בעומס נמוך: מטפס הרים איטי, דפוס זחילה בציפור-כלב, גשר ישבן להרחבת האגן, החזקת שכיבת סמיכה ופלאנק צידי ליציבות הליבה.',
    },
    items: [
      { exerciseId: 'mountain_climber', sets: 2, seconds: 40, restSeconds: 20 },
      { exerciseId: 'bird_dog', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'glute_bridge', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'push_up_hold', sets: 2, seconds: 30, restSeconds: 10 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 20 },
    ],
  },

  // ------------------------------------------------------------------ Climbing
  {
    id: 'climbing_bodyweight',
    sport: 'climbing',
    variant: 'bodyweight',
    name: { en: 'Climbing: shoulders, pushing and trunk', he: 'טיפוס: כתפיים, דחיפה וליבה' },
    description: {
      en: 'No bar needed: scapular control, pike push-ups as antagonist work, upper-back raises, a hollow hold and side planks for climbing-style body tension.',
      he: 'בלי מתקן: שליטה בשכמות, שכיבות סמיכה בפייק כעבודת נגד, הרמות לגב העליון, החזקת הולו בודי ופלאנק צידי למתח גוף כמו בטיפוס.',
    },
    items: [
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'pike_push_up', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'prone_y_raise', sets: 2, reps: [10, 12], restSeconds: 20 },
      { exerciseId: 'hollow_body_hold', sets: 2, seconds: 30, restSeconds: 30 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 20 },
    ],
  },
  {
    id: 'climbing_gear',
    sport: 'climbing',
    variant: 'gear',
    name: { en: 'Climbing: hangs, pulls and antagonists', he: 'טיפוס: תלייה, משיכה ושרירי נגד' },
    description: {
      en: 'Dead hangs and scapular pull-ups for pulling endurance, push-ups and hanging knee raises for balance and trunk, band face pulls for the rear shoulder.',
      he: 'תלייה במתח ומשיכות שכמות לסיבולת משיכה, שכיבות סמיכה והרמות ברך בתלייה לאיזון ולליבה, ומשיכת גומייה לפנים לכתף האחורית.',
    },
    items: [
      { exerciseId: 'dead_hang', sets: 2, seconds: 30, restSeconds: 30 },
      { exerciseId: 'scapular_pull_up', sets: 2, reps: [6, 8], restSeconds: 20 },
      { exerciseId: 'push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'hanging_knee_raise', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'band_face_pull', sets: 2, reps: [12, 15], restSeconds: 20 },
    ],
  },
  {
    id: 'climbing_gentle',
    sport: 'climbing',
    variant: 'gentle',
    name: { en: 'Climbing: gentle shoulders and trunk', he: 'טיפוס: כתפיים וליבה בעדינות' },
    description: {
      en: 'Low-impact version: dead bugs for trunk tension, scapular push-ups, wide push-ups for antagonist work, side planks and a plank for body tension.',
      he: 'גרסה בעומס נמוך: דד באג למתח בליבה, שכיבות סמיכה לשכמות, שכיבות סמיכה רחבות כעבודת נגד, פלאנק צידי ופלאנק למתח גוף.',
    },
    items: [
      { exerciseId: 'dead_bug', sets: 2, reps: [8, 10], restSeconds: 20 },
      { exerciseId: 'scapular_push_up', sets: 2, reps: [8, 12], restSeconds: 20 },
      { exerciseId: 'wide_push_up', sets: 2, reps: [6, 10], restSeconds: 20 },
      { exerciseId: 'side_plank', sets: 2, seconds: 20, restSeconds: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 30, restSeconds: 10 },
    ],
  },
];
