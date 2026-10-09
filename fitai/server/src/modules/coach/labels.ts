/**
 * Server-side bilingual labels for the enumerations the coach mentions in its
 * answers (the client has its own copies under `enums.*`; built-in coach replies are
 * generated on the server, so they need localized names here too).
 */
import type {
  Allergen,
  DietaryRestriction,
  DietType,
  Equipment,
  ExperienceLevel,
  Goal,
  InjuryArea,
  Locale,
  MealType,
  PrType,
  Sex,
  TrainingLocation,
} from '@shared/constants';

type Labels<K extends string> = Record<Locale, Record<K, string>>;

export const GOAL_LABELS: Labels<Goal> = {
  en: {
    muscle_gain: 'build muscle',
    strength: 'get stronger',
    general_fitness: 'general fitness',
    fat_loss: 'lose fat',
    athletic_performance: 'athletic performance',
  },
  he: {
    muscle_gain: 'בניית שריר',
    strength: 'חיזוק וכוח',
    general_fitness: 'כושר כללי',
    fat_loss: 'הורדת שומן',
    athletic_performance: 'ביצועים ספורטיביים',
  },
};

export const EXPERIENCE_LABELS: Labels<ExperienceLevel> = {
  en: { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' },
  he: { beginner: 'מתחילים', intermediate: 'בינוני', advanced: 'מתקדמים' },
};

export const SEX_LABELS: Labels<Sex> = {
  en: { male: 'male', female: 'female', unspecified: 'not specified' },
  he: { male: 'זכר', female: 'נקבה', unspecified: 'לא צוין' },
};

export const LOCATION_LABELS: Labels<TrainingLocation> = {
  en: { gym: 'gym', home: 'home', outdoor: 'outdoor / calisthenics park' },
  he: { gym: 'חדר כושר', home: 'בבית', outdoor: 'בחוץ / פארק כושר' },
};

export const EQUIPMENT_LABELS: Labels<Equipment> = {
  en: {
    barbell: 'barbell',
    dumbbells: 'dumbbells',
    kettlebell: 'kettlebell',
    ez_bar: 'EZ bar',
    squat_rack: 'squat rack',
    bench: 'bench',
    cable_machine: 'cable machine',
    lat_pulldown_machine: 'lat pulldown machine',
    leg_press_machine: 'leg press machine',
    leg_curl_machine: 'leg curl machine',
    leg_extension_machine: 'leg extension machine',
    chest_press_machine: 'chest press machine',
    smith_machine: 'Smith machine',
    pull_up_bar: 'pull-up bar',
    dip_bars: 'dip bars',
    resistance_bands: 'resistance bands',
    suspension_trainer: 'suspension trainer',
    gymnastic_rings: 'gymnastic rings',
    medicine_ball: 'medicine ball',
    plyo_box: 'plyo box',
    jump_rope: 'jump rope',
    cardio_machine: 'cardio machine',
    ab_wheel: 'ab wheel',
  },
  he: {
    barbell: 'מוט',
    dumbbells: 'משקולות יד',
    kettlebell: 'קטלבל',
    ez_bar: 'מוט EZ',
    squat_rack: 'מתקן סקוואט',
    bench: 'ספסל',
    cable_machine: 'מכונת כבלים',
    lat_pulldown_machine: 'מכונת פולי עליון',
    leg_press_machine: 'מכונת לחיצת רגליים',
    leg_curl_machine: 'מכונת כפיפת ברכיים',
    leg_extension_machine: 'מכונת פשיטת ברכיים',
    chest_press_machine: 'מכונת לחיצת חזה',
    smith_machine: 'מכונת סמית׳',
    pull_up_bar: 'מתח',
    dip_bars: 'מקבילים',
    resistance_bands: 'גומיות התנגדות',
    suspension_trainer: 'רצועות TRX',
    gymnastic_rings: 'טבעות התעמלות',
    medicine_ball: 'כדור כוח',
    plyo_box: 'קופסת קפיצה',
    jump_rope: 'חבל קפיצה',
    cardio_machine: 'מכשיר אירובי',
    ab_wheel: 'גלגל בטן',
  },
};

export const INJURY_LABELS: Labels<InjuryArea> = {
  en: {
    neck: 'neck',
    shoulder: 'shoulder',
    elbow: 'elbow',
    wrist: 'wrist',
    lower_back: 'lower back',
    hip: 'hip',
    knee: 'knee',
    ankle: 'ankle',
  },
  he: {
    neck: 'צוואר',
    shoulder: 'כתף',
    elbow: 'מרפק',
    wrist: 'שורש כף היד',
    lower_back: 'גב תחתון',
    hip: 'מפרק הירך',
    knee: 'ברך',
    ankle: 'קרסול',
  },
};

export const DIET_LABELS: Labels<DietType> = {
  en: { omnivore: 'no restrictions', vegetarian: 'vegetarian', vegan: 'vegan', pescatarian: 'pescatarian' },
  he: { omnivore: 'ללא הגבלות', vegetarian: 'צמחוני', vegan: 'טבעוני', pescatarian: 'פסקטריאני' },
};

export const ALLERGEN_LABELS: Labels<Allergen> = {
  en: {
    gluten: 'gluten',
    dairy: 'dairy',
    egg: 'eggs',
    peanut: 'peanuts',
    tree_nut: 'tree nuts',
    soy: 'soy',
    fish: 'fish',
    shellfish: 'shellfish',
    sesame: 'sesame',
  },
  he: {
    gluten: 'גלוטן',
    dairy: 'חלב',
    egg: 'ביצים',
    peanut: 'בוטנים',
    tree_nut: 'אגוזים',
    soy: 'סויה',
    fish: 'דגים',
    shellfish: 'פירות ים',
    sesame: 'שומשום',
  },
};

export const RESTRICTION_LABELS: Labels<DietaryRestriction> = {
  en: {
    no_pork: 'no pork',
    no_beef: 'no beef',
    no_shellfish: 'no shellfish',
    no_alcohol: 'no alcohol',
    lactose_free: 'lactose-free',
    gluten_free: 'gluten-free',
  },
  he: {
    no_pork: 'ללא חזיר',
    no_beef: 'ללא בקר',
    no_shellfish: 'ללא פירות ים',
    no_alcohol: 'ללא אלכוהול',
    lactose_free: 'ללא לקטוז',
    gluten_free: 'ללא גלוטן',
  },
};

export const MEAL_TYPE_LABELS: Labels<MealType> = {
  en: { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack' },
  he: { breakfast: 'ארוחת בוקר', lunch: 'ארוחת צהריים', dinner: 'ארוחת ערב', snack: 'נשנוש' },
};

export const PR_TYPE_LABELS: Labels<PrType> = {
  en: {
    max_weight: 'heaviest weight',
    est_1rm: 'estimated 1RM',
    max_reps: 'most reps',
    max_volume: 'best set volume',
    max_duration: 'longest hold',
  },
  he: {
    max_weight: 'המשקל הכבד ביותר',
    est_1rm: 'חזרה מקסימלית משוערת',
    max_reps: 'הכי הרבה חזרות',
    max_volume: 'נפח סט שיא',
    max_duration: 'ההחזקה הארוכה ביותר',
  },
};

/** "a, b and c" / "א, ב ו-ג" */
export function joinList(items: string[], locale: Locale): string {
  if (items.length <= 1) return items[0] ?? '';
  const head = items.slice(0, -1).join(', ');
  const last = items[items.length - 1]!;
  // Hebrew attaches "ו" to the next word (with a hyphen before digits or Latin text).
  const conjunction = locale === 'he' ? (/^[\u0590-\u05FF]/.test(last) ? ' ו' : ' ו-') : ' and ';
  return head + conjunction + last;
}
