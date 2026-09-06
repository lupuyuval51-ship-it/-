/**
 * Phase templates, role focus and the training split from the product spec.
 * Pure constants + tiny helpers shared by the workout engine, the plan generator, the Claude prompts and the UI.
 */
import type { Duration, Goal, Localized, PhaseType, Role, Skill } from "@/lib/types";

export interface PhaseTemplate {
  type: PhaseType;
  minutes: number;
  name: Localized;
  goal: Localized;
}

export const PHASE_NAMES: Record<PhaseType, Localized> = {
  checkin: { he: "בדיקת מצב", en: "Check-in" },
  warmup: { he: "חימום", en: "Warm-up" },
  throwing: { he: "זריקות ותפיסות", en: "Throwing & catching" },
  movement: { he: "תנועה ומהירות", en: "Movement & speed" },
  role: { he: "אימון תפקיד", en: "Role training" },
  game: { he: "מצבי משחק", en: "Game situations" },
  challenge: { he: "אתגר", en: "Challenge" },
  cooldown: { he: "שחרור וסיכום", en: "Cool-down & reflection" },
};

export const PHASE_GOALS: Record<PhaseType, Localized> = {
  checkin: { he: "לוודא שהגוף, השטח והציוד מוכנים לאימון.", en: "Make sure body, field and gear are ready for the session." },
  warmup: { he: "להעלות דופק, לפתוח מפרקים ולהכין את היד לזריקה.", en: "Raise the heart rate, open the joints and prepare the throwing arm." },
  throwing: { he: "עבודה טכנית על זריקה ותפיסה עם ספירת הצלחות.", en: "Technical throwing and catching work with success counts." },
  movement: { he: "מהירות, זריזות ושינויי כיוון בקצב משחק.", en: "Speed, agility and change of direction at game tempo." },
  role: { he: "תרגילים ייעודיים לתפקיד שלכם במגרש.", en: "Drills built for your role on the field." },
  game: { he: "לחבר טכניקה ותנועה במצבי משחק ותחת לחץ.", en: "Connect technique and movement in game situations and under pressure." },
  challenge: { he: "מבחן קצר עם תוצאה מדידה – מנסים לשבור שיא.", en: "A short measurable test – try to beat your best." },
  cooldown: { he: "להוריד דופק, למתוח ולסכם את האימון.", en: "Lower the heart rate, stretch and reflect on the session." },
};

function tpl(type: PhaseType, minutes: number): PhaseTemplate {
  return { type, minutes, name: PHASE_NAMES[type], goal: PHASE_GOALS[type] };
}

/** Minute splits per duration: checkin / warmup / throwing / movement / role / game / challenge / cooldown. */
export const PHASE_SPLITS: Record<Duration, Record<PhaseType, number>> = {
  90: { checkin: 3, warmup: 12, throwing: 20, movement: 15, role: 20, game: 10, challenge: 5, cooldown: 5 },
  105: { checkin: 3, warmup: 12, throwing: 25, movement: 15, role: 25, game: 15, challenge: 5, cooldown: 5 },
  120: { checkin: 5, warmup: 15, throwing: 30, movement: 15, role: 30, game: 15, challenge: 5, cooldown: 5 },
};

export const PHASE_ORDER: PhaseType[] = ["checkin", "warmup", "throwing", "movement", "role", "game", "challenge", "cooldown"];

function buildTemplates(duration: Duration): PhaseTemplate[] {
  return PHASE_ORDER.map((type) => tpl(type, PHASE_SPLITS[duration][type]));
}

export const PHASE_TEMPLATES: Record<90 | 105 | 120, PhaseTemplate[]> = {
  90: buildTemplates(90),
  105: buildTemplates(105),
  120: buildTemplates(120),
};

/** When the challenge is skipped its 5 minutes go to the game (3) and the cool-down (2) so the total stays exact. */
export const CHALLENGE_REDISTRIBUTION: { game: number; cooldown: number } = { game: 3, cooldown: 2 };

/** Templates for a duration, optionally without the challenge phase (minutes redistributed). */
export function phaseTemplatesFor(duration: Duration, includeChallenge = true): PhaseTemplate[] {
  const base = PHASE_TEMPLATES[duration];
  if (includeChallenge) return base.map((p) => ({ ...p }));
  const challengeMinutes = base.find((p) => p.type === "challenge")?.minutes ?? 0;
  const extraGame = Math.min(CHALLENGE_REDISTRIBUTION.game, challengeMinutes);
  const extraCooldown = challengeMinutes - extraGame;
  return base
    .filter((p) => p.type !== "challenge")
    .map((p) => {
      if (p.type === "game") return { ...p, minutes: p.minutes + extraGame };
      if (p.type === "cooldown") return { ...p, minutes: p.minutes + extraCooldown };
      return { ...p };
    });
}

/* ------------------------------------------------------------------ */
/* Training split                                                       */
/* ------------------------------------------------------------------ */

/** Share of training time: general fundamentals / primary role / secondary role / fitness + game. */
export const TRAINING_SPLIT = {
  fundamentals: 0.3,
  primaryRole: 0.4,
  secondaryRole: 0.15,
  fitnessAndGame: 0.15,
} as const;

/** Share of the role phase that goes to the secondary role when one is set. */
export const SECONDARY_ROLE_SHARE = 0.15;

/* ------------------------------------------------------------------ */
/* Role focus                                                           */
/* ------------------------------------------------------------------ */

export interface RoleFocus {
  skills: Skill[];
  description: Localized;
}

export const ROLE_FOCUS: Record<Role, RoleFocus> = {
  wing: {
    skills: ["width", "deep_runs", "timing", "catch_moving", "change_of_direction", "transition", "endurance", "accuracy"],
    description: {
      he: "כנף: ריצות רוחב ועומק לאורך קו הצד, תזמון, תפיסות בריצה ומעבר מהיר מהגנה להתקפה – עם סיבולת לאורך כל המשחק.",
      en: "Wing: width and deep runs along the sideline, timing, catching on the move and fast transitions – with the endurance to last the whole game.",
    },
  },
  runner: {
    skills: ["acceleration", "speed", "cutting", "reaction", "catch_moving", "change_of_direction", "deep_runs", "endurance"],
    description: {
      he: "רץ: האצה, מהירות, Cuts חדים ותגובה מהירה – ולתפוס בריצה מלאה בלי להאט.",
      en: "Runner: acceleration, top speed, sharp cuts and quick reactions – and catching at full speed without slowing down.",
    },
  },
  defender: {
    skills: ["defense", "footwork", "mirror", "marking", "reaction", "transition", "agility", "change_of_direction"],
    description: {
      he: "מגן: עבודת רגליים, Mirror, Mark על הזורק, תגובה לתנועה ומעבר מהיר להתקפה אחרי חילוף.",
      en: "Defender: footwork, mirroring, marking the thrower, reacting to movement and a fast transition to offense after a turnover.",
    },
  },
  handler: {
    skills: ["backhand", "forehand", "pivot", "fakes", "break_throws", "decision_making", "give_and_go", "release_speed", "short_throws", "field_vision"],
    description: {
      he: "Handler: Backhand ו-Forehand מדויקים, Pivot ו-Fakes, Break Throws, קבלת החלטות מהירה ו-Give and Go.",
      en: "Handler: accurate backhand and forehand, pivots and fakes, break throws, fast decisions and give-and-go.",
    },
  },
  cutter: {
    skills: ["cutting", "separation", "timing", "catch_moving", "change_of_direction", "communication", "acceleration", "one_hand_catch"],
    description: {
      he: "Cutter: Cuts חדים, יצירת הפרדה מהמגן, תזמון מול ה-Handler, תפיסות בריצה ותקשורת.",
      en: "Cutter: sharp cuts, separation from the defender, timing with the handler, catching on the move and communication.",
    },
  },
  hybrid: {
    skills: ["backhand", "forehand", "cutting", "defense", "catch_moving", "decision_making", "change_of_direction", "transition"],
    description: {
      he: "היברידי: שילוב מאוזן של זריקה, Cuts והגנה – מסוגלים לשחק בכל מקום במגרש.",
      en: "Hybrid: a balanced mix of throwing, cutting and defense – able to play anywhere on the field.",
    },
  },
  allround: {
    skills: ["backhand", "forehand", "catching", "catch_moving", "cutting", "defense", "agility", "decision_making"],
    description: {
      he: "כללי: בסיס רחב בכל היסודות, ובהמשך דגש על המיומנויות שהסטטיסטיקה מסמנת כחלשות יותר.",
      en: "All-around: a broad base in every fundamental, later weighted towards the skills your stats flag as weaker.",
    },
  },
};

/** For hybrid / all-round players the role phase mixes drills from these role families. */
export const MIXED_ROLE_FAMILIES: Role[] = ["handler", "cutter", "defender"];

/* ------------------------------------------------------------------ */
/* Labels                                                               */
/* ------------------------------------------------------------------ */

export const SKILL_LABELS: Record<Skill, Localized> = {
  backhand: { he: "Backhand", en: "Backhand" },
  forehand: { he: "Forehand", en: "Forehand" },
  hammer: { he: "Hammer", en: "Hammer" },
  deep_throws: { he: "זריקות עומק", en: "Deep throws" },
  short_throws: { he: "זריקות קצרות", en: "Short throws" },
  accuracy: { he: "דיוק", en: "Accuracy" },
  distance: { he: "מרחק", en: "Distance" },
  release_speed: { he: "שחרור מהיר", en: "Quick release" },
  catching: { he: "תפיסות", en: "Catching" },
  catch_moving: { he: "תפיסות בריצה", en: "Catching on the move" },
  catch_pressure: { he: "תפיסות תחת לחץ", en: "Catching under pressure" },
  one_hand_catch: { he: "תפיסה ביד אחת", en: "One-hand catches" },
  pivot: { he: "Pivot", en: "Pivot" },
  fakes: { he: "Fakes", en: "Fakes" },
  break_throws: { he: "Break Throws", en: "Break throws" },
  footwork: { he: "עבודת רגליים", en: "Footwork" },
  change_of_direction: { he: "שינויי כיוון", en: "Change of direction" },
  speed: { he: "מהירות", en: "Speed" },
  acceleration: { he: "האצה", en: "Acceleration" },
  agility: { he: "זריזות", en: "Agility" },
  endurance: { he: "סיבולת", en: "Endurance" },
  defense: { he: "הגנה", en: "Defense" },
  marking: { he: "Mark", en: "Marking" },
  mirror: { he: "Mirror", en: "Mirroring" },
  reaction: { he: "תגובה", en: "Reaction" },
  cutting: { he: "Cuts", en: "Cutting" },
  timing: { he: "תזמון", en: "Timing" },
  separation: { he: "יצירת הפרדה", en: "Separation" },
  field_vision: { he: "ראיית מגרש", en: "Field vision" },
  decision_making: { he: "קבלת החלטות", en: "Decision making" },
  give_and_go: { he: "Give and Go", en: "Give and go" },
  width: { he: "משחק רוחב", en: "Width" },
  deep_runs: { he: "ריצות עומק", en: "Deep runs" },
  transition: { he: "מעברים", en: "Transitions" },
  communication: { he: "תקשורת", en: "Communication" },
  warmup: { he: "חימום", en: "Warm-up" },
  cooldown: { he: "שחרור", en: "Cool-down" },
  mobility: { he: "מוביליטי", en: "Mobility" },
  strength: { he: "כוח", en: "Strength" },
  wind: { he: "זריקה ברוח", en: "Throwing in wind" },
};

export const GOAL_LABELS: Record<Goal, Localized> = {
  backhand: { he: "Backhand", en: "Backhand" },
  forehand: { he: "Forehand", en: "Forehand" },
  hammer: { he: "Hammer", en: "Hammer" },
  deep_throws: { he: "זריקות עומק", en: "Deep throws" },
  short_throws: { he: "זריקות קצרות", en: "Short throws" },
  accuracy: { he: "דיוק", en: "Accuracy" },
  distance: { he: "מרחק זריקה", en: "Throwing distance" },
  release_speed: { he: "שחרור מהיר", en: "Quick release" },
  catching: { he: "תפיסות", en: "Catching" },
  one_hand_catch: { he: "תפיסה ביד אחת", en: "One-hand catches" },
  catch_running: { he: "תפיסות בריצה", en: "Catching on the run" },
  catch_pressure: { he: "תפיסות תחת לחץ", en: "Catching under pressure" },
  pivot_footwork: { he: "Pivot ועבודת רגליים", en: "Pivot & footwork" },
  change_of_direction: { he: "שינויי כיוון", en: "Change of direction" },
  speed: { he: "מהירות", en: "Speed" },
  acceleration: { he: "האצה", en: "Acceleration" },
  agility: { he: "זריזות", en: "Agility" },
  endurance: { he: "סיבולת", en: "Endurance" },
  defense: { he: "הגנה", en: "Defense" },
  marking: { he: "Mark", en: "Marking" },
  field_vision: { he: "ראיית מגרש", en: "Field vision" },
  decision_making: { he: "קבלת החלטות", en: "Decision making" },
  game_prep: { he: "הכנה למשחק", en: "Game preparation" },
  general: { he: "אימון כללי", en: "General training" },
};

/** Which exercise skills serve each goal (first entry is the closest match). */
export const GOAL_SKILLS: Record<Goal, Skill[]> = {
  backhand: ["backhand"],
  forehand: ["forehand"],
  hammer: ["hammer"],
  deep_throws: ["deep_throws", "distance"],
  short_throws: ["short_throws", "accuracy"],
  accuracy: ["accuracy", "short_throws"],
  distance: ["distance", "deep_throws"],
  release_speed: ["release_speed", "give_and_go"],
  catching: ["catching", "catch_moving"],
  one_hand_catch: ["one_hand_catch", "catching"],
  catch_running: ["catch_moving", "catching"],
  catch_pressure: ["catch_pressure", "catching"],
  pivot_footwork: ["pivot", "footwork", "fakes"],
  change_of_direction: ["change_of_direction", "agility", "cutting"],
  speed: ["speed", "acceleration"],
  acceleration: ["acceleration", "speed"],
  agility: ["agility", "footwork", "change_of_direction"],
  endurance: ["endurance"],
  defense: ["defense", "mirror", "footwork"],
  marking: ["marking", "defense"],
  field_vision: ["field_vision", "decision_making"],
  decision_making: ["decision_making", "field_vision"],
  game_prep: ["decision_making", "transition", "catch_pressure", "communication"],
  general: [],
};

/** Reverse of GOAL_SKILLS for the plan engine: the goal that best trains a (weak) skill. */
export const SKILL_TO_GOAL: Partial<Record<Skill, Goal>> = {
  backhand: "backhand",
  forehand: "forehand",
  hammer: "hammer",
  deep_throws: "deep_throws",
  short_throws: "short_throws",
  accuracy: "accuracy",
  distance: "distance",
  release_speed: "release_speed",
  catching: "catching",
  catch_moving: "catch_running",
  catch_pressure: "catch_pressure",
  one_hand_catch: "one_hand_catch",
  pivot: "pivot_footwork",
  fakes: "pivot_footwork",
  break_throws: "accuracy",
  footwork: "pivot_footwork",
  change_of_direction: "change_of_direction",
  speed: "speed",
  acceleration: "acceleration",
  agility: "agility",
  endurance: "endurance",
  defense: "defense",
  marking: "marking",
  mirror: "defense",
  reaction: "agility",
  cutting: "change_of_direction",
  timing: "catch_running",
  separation: "acceleration",
  field_vision: "field_vision",
  decision_making: "decision_making",
  give_and_go: "release_speed",
  width: "field_vision",
  deep_runs: "speed",
  transition: "game_prep",
  communication: "game_prep",
};
