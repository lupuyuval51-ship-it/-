import type { FeatureMessages } from "../index";
import type {
  AgeGroup, ChallengePeriod, Equipment, ExerciseCategory, FieldSize, Goal, Hand, Intensity, Level, MetricKey,
  OffenseDefense, Participants, PhaseType, PlannedSessionStatus, PlayContext, Role, RoleIntent, SessionTemplateType,
  Skill, Wind, WindSuitability, WorkoutSource, YearsPlaying,
} from "@/lib/types";

/**
 * Labels for every enum in src/lib/types.ts. Each entry is authored as [he, en] so both
 * languages always stay in sync; the pairs are flattened into the flat dictionaries below.
 * Key scheme: "domain.<kind>.<value>" – see src/i18n/domain.ts for typed helpers.
 */
type Pair = readonly [he: string, en: string];

const roles: Record<Role, Pair> = {
  wing: ["כנף", "Wing"],
  runner: ["רץ", "Runner"],
  defender: ["מגן", "Defender"],
  handler: ["Handler", "Handler"],
  cutter: ["Cutter", "Cutter"],
  hybrid: ["היברידי", "Hybrid"],
  allround: ["כללי", "All-Around"],
};

/** Short role descriptions shown in onboarding, profile and role badges. */
const roleDescriptions: Record<Role, Pair> = {
  wing: ["משחק בצידי המגרש, פותח רוחב ומקבל מסירות ארוכות", "Plays wide along the sideline, stretches the field and receives long throws"],
  runner: ["מהיר ונחוש – מייצר חיתוכים ונפתח לעומק", "Fast and relentless – cuts hard and gets open deep"],
  defender: ["שומר צמוד, חוסם מסירות ולוחץ על ההתקפה", "Marks tightly, blocks throws and pressures the offense"],
  handler: ["שולט בדיסק, מוביל את ההתקפה ומקבל את ההחלטות", "Controls the disc, runs the offense and makes the decisions"],
  cutter: ["מייצר הפרדה מהשומר ותופס תחת לחץ", "Creates separation from the defender and catches under pressure"],
  hybrid: ["משלב שליטה בדיסק עם חיתוכים – גמיש בכל מצב", "Blends disc control with cutting – flexible in any situation"],
  allround: ["מפתח את כל היסודות בצורה מאוזנת", "Builds every fundamental in a balanced way"],
};

const roleIntents: Record<RoleIntent, Pair> = {
  current: ["זה התפקיד שלי היום", "This is my role today"],
  learning: ["אני לומד/ת את התפקיד", "I'm learning this role"],
  future: ["תפקיד שאני שואף/ת אליו", "A role I'm aiming for"],
  temporary: ["זמני – בגלל צורך בקבוצה", "Temporary – the team needs it"],
  unsure: ["עדיין לא בטוח/ה", "Not sure yet"],
};

const levels: Record<Level, Pair> = {
  beginner: ["מתחיל", "Beginner"],
  intermediate: ["בינוני", "Intermediate"],
  advanced: ["מתקדם", "Advanced"],
};

const ageGroups: Record<AgeGroup, Pair> = {
  kid: ["ילד/ה (עד 13)", "Kid (under 13)"],
  teen: ["נוער (13–17)", "Teen (13–17)"],
  adult: ["בוגר/ת (18–49)", "Adult (18–49)"],
  senior: ["50 ומעלה", "50 and over"],
};

const hands: Record<Hand, Pair> = {
  right: ["ימין", "Right"],
  left: ["שמאל", "Left"],
  both: ["שתי הידיים", "Both hands"],
};

const yearsPlaying: Record<YearsPlaying, Pair> = {
  new: ["חדש/ה לגמרי", "Brand new"],
  under1: ["פחות משנה", "Under a year"],
  "1to3": ["1–3 שנים", "1–3 years"],
  over3: ["יותר מ-3 שנים", "More than 3 years"],
};

const playContexts: Record<PlayContext, Pair> = {
  fun: ["בכיף עם חברים", "For fun with friends"],
  training: ["אימונים קבועים", "Regular training"],
  team: ["קבוצה תחרותית", "Competitive team"],
};

const participants: Record<Participants, Pair> = {
  solo: ["לבד", "Solo"],
  pair: ["בזוג", "With a partner"],
  group: ["בקבוצה", "Group"],
};

const equipment: Record<Equipment, Pair> = {
  disc: ["דיסק", "Disc"],
  discs: ["כמה דיסקים", "Several discs"],
  cones: ["קונוסים", "Cones"],
  target: ["מטרה", "Target"],
  ladder: ["סולם זריזות", "Agility ladder"],
  stopwatch: ["סטופר", "Stopwatch"],
  wall: ["קיר", "Wall"],
  field_lines: ["קווי מגרש", "Field lines"],
};

const fieldSizes: Record<FieldSize, Pair> = {
  small: ["מגרש קטן", "Small field"],
  medium: ["מגרש בינוני", "Medium field"],
  large: ["מגרש גדול", "Large field"],
  indoor: ["אולם", "Indoor"],
  park: ["פארק", "Park"],
  beach: ["חוף", "Beach"],
  yard: ["חצר", "Yard"],
};

const winds: Record<Wind, Pair> = {
  none: ["ללא רוח", "No wind"],
  light: ["רוח קלה", "Light wind"],
  medium: ["רוח בינונית", "Moderate wind"],
  strong: ["רוח חזקה", "Strong wind"],
  unknown: ["לא ידוע", "Unknown"],
};

const intensities: Record<Intensity, Pair> = {
  low: ["עצימות נמוכה", "Low intensity"],
  medium: ["עצימות בינונית", "Medium intensity"],
  high: ["עצימות גבוהה", "High intensity"],
};

const intensitiesShort: Record<Intensity, Pair> = {
  low: ["נמוכה", "Low"],
  medium: ["בינונית", "Medium"],
  high: ["גבוהה", "High"],
};

const goals: Record<Goal, Pair> = {
  backhand: ["Backhand", "Backhand"],
  forehand: ["Forehand", "Forehand"],
  hammer: ["Hammer", "Hammer"],
  deep_throws: ["זריקות ארוכות", "Deep throws"],
  short_throws: ["זריקות קצרות", "Short throws"],
  accuracy: ["דיוק", "Accuracy"],
  distance: ["מרחק", "Distance"],
  release_speed: ["מהירות שחרור", "Release speed"],
  catching: ["תפיסות", "Catching"],
  one_hand_catch: ["תפיסה ביד אחת", "One-hand catching"],
  catch_running: ["תפיסה בריצה", "Catching on the run"],
  catch_pressure: ["תפיסה תחת לחץ", "Catching under pressure"],
  pivot_footwork: ["Pivot ועבודת רגליים", "Pivot & footwork"],
  change_of_direction: ["שינויי כיוון", "Change of direction"],
  speed: ["מהירות", "Speed"],
  acceleration: ["האצה", "Acceleration"],
  agility: ["זריזות", "Agility"],
  endurance: ["סיבולת", "Endurance"],
  defense: ["הגנה", "Defense"],
  marking: ["שמירה על הזורק (Mark)", "Marking"],
  field_vision: ["ראיית מגרש", "Field vision"],
  decision_making: ["קבלת החלטות", "Decision making"],
  game_prep: ["הכנה למשחק", "Game preparation"],
  general: ["שיפור כללי", "General improvement"],
};

const skills: Record<Skill, Pair> = {
  backhand: ["Backhand", "Backhand"],
  forehand: ["Forehand", "Forehand"],
  hammer: ["Hammer", "Hammer"],
  deep_throws: ["זריקות ארוכות", "Deep throws"],
  short_throws: ["זריקות קצרות", "Short throws"],
  accuracy: ["דיוק", "Accuracy"],
  distance: ["מרחק", "Distance"],
  release_speed: ["מהירות שחרור", "Release speed"],
  catching: ["תפיסות", "Catching"],
  catch_moving: ["תפיסה בתנועה", "Catching on the move"],
  catch_pressure: ["תפיסה תחת לחץ", "Catching under pressure"],
  one_hand_catch: ["תפיסה ביד אחת", "One-hand catch"],
  pivot: ["Pivot", "Pivot"],
  fakes: ["הטעיות", "Fakes"],
  break_throws: ["זריקות Break", "Break throws"],
  footwork: ["עבודת רגליים", "Footwork"],
  change_of_direction: ["שינויי כיוון", "Change of direction"],
  speed: ["מהירות", "Speed"],
  acceleration: ["האצה", "Acceleration"],
  agility: ["זריזות", "Agility"],
  endurance: ["סיבולת", "Endurance"],
  defense: ["הגנה", "Defense"],
  marking: ["שמירה על הזורק", "Marking"],
  mirror: ["שמירת מראה", "Mirroring"],
  reaction: ["זמן תגובה", "Reaction"],
  cutting: ["חיתוכים", "Cutting"],
  timing: ["תזמון", "Timing"],
  separation: ["יצירת הפרדה", "Separation"],
  field_vision: ["ראיית מגרש", "Field vision"],
  decision_making: ["קבלת החלטות", "Decision making"],
  give_and_go: ["מסור וזוז", "Give and go"],
  width: ["שימוש ברוחב", "Using the width"],
  deep_runs: ["ריצות לעומק", "Deep runs"],
  transition: ["מעבר הגנה–התקפה", "Transition"],
  communication: ["תקשורת", "Communication"],
  warmup: ["חימום", "Warm-up"],
  cooldown: ["שחרור", "Cool-down"],
  mobility: ["גמישות ותנועתיות", "Mobility"],
  strength: ["כוח", "Strength"],
  wind: ["משחק ברוח", "Playing in wind"],
};

const phases: Record<PhaseType, Pair> = {
  checkin: ["צ׳ק-אין", "Check-in"],
  warmup: ["חימום", "Warm-up"],
  throwing: ["זריקות", "Throwing"],
  movement: ["תנועה", "Movement"],
  role: ["אימון תפקיד", "Role work"],
  game: ["מצבי משחק", "Game situations"],
  challenge: ["אתגר", "Challenge"],
  cooldown: ["שחרור", "Cool-down"],
};

const categories: Record<ExerciseCategory, Pair> = {
  warmup: ["חימום", "Warm-up"],
  throwing: ["זריקות", "Throwing"],
  catching: ["תפיסות", "Catching"],
  movement: ["תנועה", "Movement"],
  defense: ["הגנה", "Defense"],
  position: ["תפקיד", "Position"],
  game: ["משחק", "Game"],
  challenge: ["אתגר", "Challenge"],
  cooldown: ["שחרור", "Cool-down"],
  fitness: ["כושר", "Fitness"],
};

const offenseDefense: Record<OffenseDefense, Pair> = {
  offense: ["התקפה", "Offense"],
  defense: ["הגנה", "Defense"],
  both: ["התקפה והגנה", "Offense & defense"],
};

const windSuitability: Record<WindSuitability, Pair> = {
  any: ["בכל מזג אוויר", "Any conditions"],
  calm_only: ["רק בלי רוח", "Calm only"],
  wind_ok: ["מתאים גם ברוח", "Fine in wind"],
  wind_focus: ["תרגול ברוח", "Wind focus"],
};

const templates: Record<SessionTemplateType, Pair> = {
  technique: ["טכניקה", "Technique"],
  movement_role: ["תנועה ותפקיד", "Movement & role"],
  game_challenge: ["משחק ואתגר", "Game & challenge"],
  recovery: ["התאוששות", "Recovery"],
  mixed: ["משולב", "Mixed"],
};

const sessionStatuses: Record<PlannedSessionStatus, Pair> = {
  planned: ["מתוכנן", "Planned"],
  started: ["בתהליך", "In progress"],
  completed: ["הושלם", "Completed"],
  postponed: ["נדחה", "Postponed"],
  cancelled: ["בוטל", "Cancelled"],
  replaced: ["הוחלף", "Replaced"],
};

const sources: Record<WorkoutSource, Pair> = {
  library: ["מהספרייה", "Library"],
  engine: ["נבנה עבורך", "Built for you"],
  claude: ["מהמאמן AI", "From the AI coach"],
  custom: ["מותאם אישית", "Custom"],
};

const periods: Record<ChallengePeriod, Pair> = {
  daily: ["יומי", "Daily"],
  weekly: ["שבועי", "Weekly"],
};

const metrics: Record<MetricKey, Pair> = {
  backhand_accuracy: ["דיוק Backhand", "Backhand accuracy"],
  forehand_accuracy: ["דיוק Forehand", "Forehand accuracy"],
  hammer_accuracy: ["דיוק Hammer", "Hammer accuracy"],
  throw_accuracy: ["דיוק זריקה", "Throw accuracy"],
  deep_throw_accuracy: ["דיוק זריקה ארוכה", "Deep-throw accuracy"],
  short_throw_accuracy: ["דיוק זריקה קצרה", "Short-throw accuracy"],
  break_throw_pct: ["הצלחה בזריקות Break", "Break-throw success"],
  swing_pass_pct: ["הצלחה במסירות Swing", "Swing-pass success"],
  quick_release_pct: ["הצלחה בשחרור מהיר", "Quick-release success"],
  catch_release_pct: ["הצלחה בתפיסה ושחרור", "Catch-and-release success"],
  longest_throw_m: ["הזריקה הארוכה ביותר", "Longest throw"],
  catch_streak: ["רצף תפיסות", "Catch streak"],
  catch_pct: ["אחוז תפיסות", "Catch rate"],
  catch_moving_pct: ["תפיסות בתנועה", "Catches on the move"],
  catch_pressure_pct: ["תפיסות תחת לחץ", "Catches under pressure"],
  one_hand_catch_pct: ["תפיסות ביד אחת", "One-hand catches"],
  sprint_time_s: ["זמן ספרינט", "Sprint time"],
  cod_time_s: ["זמן שינוי כיוון", "Change-of-direction time"],
  t_drill_time_s: ["זמן T-Drill", "T-drill time"],
  agility_time_s: ["זמן זריזות", "Agility time"],
  lateral_shuffle_time_s: ["זמן צעדי צד", "Lateral-shuffle time"],
  recovery_sprint_time_s: ["זמן ספרינט התאוששות", "Recovery-sprint time"],
  repeat_sprint_drop_pct: ["ירידה בספרינטים חוזרים", "Repeat-sprint drop-off"],
  course_time_s: ["זמן מסלול", "Course time"],
  endurance_score: ["ציון סיבולת", "Endurance score"],
  mirror_score: ["ציון שמירת מראה", "Mirroring score"],
  reaction_score: ["ציון תגובה", "Reaction score"],
  marking_score: ["ציון שמירה", "Marking score"],
  pivot_score: ["ציון Pivot", "Pivot score"],
  decision_score: ["ציון החלטות", "Decision score"],
  cut_timing_score: ["ציון תזמון חיתוך", "Cut-timing score"],
  separation_score: ["ציון הפרדה", "Separation score"],
  deep_run_success_pct: ["הצלחה בריצות לעומק", "Deep-run success"],
  fake_score: ["ציון הטעיות", "Fake score"],
  throw_count: ["מספר זריקות", "Throws"],
  catch_count: ["מספר תפיסות", "Catches"],
  error_free_streak: ["רצף ללא טעויות", "Error-free streak"],
  confidence_rating: ["דירוג ביטחון", "Confidence rating"],
  wing_challenge_score: ["ציון אתגר כנף", "Wing challenge score"],
  runner_challenge_score: ["ציון אתגר רץ", "Runner challenge score"],
  defender_challenge_score: ["ציון אתגר מגן", "Defender challenge score"],
  handler_challenge_score: ["ציון אתגר Handler", "Handler challenge score"],
  cutter_challenge_score: ["ציון אתגר Cutter", "Cutter challenge score"],
  hybrid_challenge_score: ["ציון אתגר היברידי", "Hybrid challenge score"],
};

/** Unit shown next to a metric value, derived from the key suffix. */
function metricUnit(key: MetricKey): Pair {
  if (key.endsWith("_pct") || key.endsWith("_accuracy")) return ["%", "%"];
  if (key.endsWith("_s")) return ["שנ׳", "s"];
  if (key.endsWith("_m")) return ["מ׳", "m"];
  if (key.endsWith("_score")) return ["נק׳", "pts"];
  if (key.endsWith("_rating")) return ["/5", "/5"];
  return ["", ""];
}

const days: Pair[] = [
  ["ראשון", "Sunday"], ["שני", "Monday"], ["שלישי", "Tuesday"], ["רביעי", "Wednesday"],
  ["חמישי", "Thursday"], ["שישי", "Friday"], ["שבת", "Saturday"],
];
const daysShort: Pair[] = [["א׳", "Sun"], ["ב׳", "Mon"], ["ג׳", "Tue"], ["ד׳", "Wed"], ["ה׳", "Thu"], ["ו׳", "Fri"], ["ש׳", "Sat"]];

const kinds: Record<string, Record<string, Pair>> = {
  role: roles,
  "role.desc": roleDescriptions,
  roleIntent: roleIntents,
  level: levels,
  ageGroup: ageGroups,
  hand: hands,
  years: yearsPlaying,
  playContext: playContexts,
  participants,
  equipment,
  fieldSize: fieldSizes,
  wind: winds,
  intensity: intensities,
  intensityShort: intensitiesShort,
  goal: goals,
  skill: skills,
  phase: phases,
  category: categories,
  offenseDefense,
  windSuitability,
  template: templates,
  sessionStatus: sessionStatuses,
  source: sources,
  period: periods,
  metric: metrics,
  metricUnit: Object.fromEntries((Object.keys(metrics) as MetricKey[]).map((k) => [k, metricUnit(k)])),
  day: Object.fromEntries(days.map((p, i) => [String(i), p])),
  dayShort: Object.fromEntries(daysShort.map((p, i) => [String(i), p])),
};

const he: Record<string, string> = {};
const en: Record<string, string> = {};
for (const [kind, map] of Object.entries(kinds)) {
  for (const [value, [h, e]] of Object.entries(map)) {
    he[`domain.${kind}.${value}`] = h;
    en[`domain.${kind}.${value}`] = e;
  }
}

/** Generic headings used by filters and forms. */
Object.assign(he, {
  "domain.kind.role": "תפקיד",
  "domain.kind.level": "רמה",
  "domain.kind.ageGroup": "קבוצת גיל",
  "domain.kind.hand": "יד דומיננטית",
  "domain.kind.years": "ותק",
  "domain.kind.playContext": "איפה משחקים",
  "domain.kind.participants": "עם מי מתאמנים",
  "domain.kind.equipment": "ציוד",
  "domain.kind.fieldSize": "גודל מגרש",
  "domain.kind.wind": "רוח",
  "domain.kind.intensity": "עצימות",
  "domain.kind.goal": "מטרה",
  "domain.kind.skill": "מיומנות",
  "domain.kind.phase": "שלב",
  "domain.kind.category": "קטגוריה",
  "domain.kind.metric": "מדד",
  "domain.kind.duration": "משך",
  "domain.kind.day": "יום",
  "domain.kind.period": "תקופה",
});
Object.assign(en, {
  "domain.kind.role": "Role",
  "domain.kind.level": "Level",
  "domain.kind.ageGroup": "Age group",
  "domain.kind.hand": "Dominant hand",
  "domain.kind.years": "Experience",
  "domain.kind.playContext": "Where you play",
  "domain.kind.participants": "Who you train with",
  "domain.kind.equipment": "Equipment",
  "domain.kind.fieldSize": "Field size",
  "domain.kind.wind": "Wind",
  "domain.kind.intensity": "Intensity",
  "domain.kind.goal": "Goal",
  "domain.kind.skill": "Skill",
  "domain.kind.phase": "Phase",
  "domain.kind.category": "Category",
  "domain.kind.metric": "Metric",
  "domain.kind.duration": "Duration",
  "domain.kind.day": "Day",
  "domain.kind.period": "Period",
});

export const domain: FeatureMessages = { he, en };
