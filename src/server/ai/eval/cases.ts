/**
 * The fixed evaluation set: the same requests every time, so any model can be compared with any other.
 * Deterministic (no randomness); covers languages, tiers, modes, game types, difficulties, and edit instructions.
 */
import type { FeatureTier } from "@/config/plans";
import { DIFFICULTIES, type GameType } from "@/lib/game/spec/constants";
import { gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { generationRequestSchema, type GenerationRequest } from "@/lib/schemas/generation";

export interface GenerateCase {
  kind: "generate";
  id: string;
  tier: FeatureTier;
  request: GenerationRequest;
}

export interface EditCase {
  kind: "edit";
  id: string;
  tier: FeatureTier;
  /** How the game being edited is produced (offline generator, so the base is identical for every model). */
  base: GenerationRequest;
  instruction: string;
  level: "A" | "B";
}

export type EvalCase = GenerateCase | EditCase;

type EvalLang = "he" | "en";

const SUBJECTS: Record<EvalLang, string[]> = {
  en: ["Fractions", "How a for loop works", "The water cycle", "Ancient Rome", "Photosynthesis", "Basic English grammar", "The solar system", "Percentages", "How vaccines work", "World War I", "Python lists", "Ratios and proportions"],
  he: ["שברים", "איך עובדת לולאת for", "מחזור המים", "האימפריה הרומית", "פוטוסינתזה", "דקדוק בסיסי באנגלית", "מערכת השמש", "אחוזים", "איך עובדים חיסונים", "מלחמת העולם הראשונה", "רשימות בפייתון", "יחס ופרופורציה"],
};

const EDITS: Record<EvalLang, string[]> = {
  en: [
    "Give the game a funnier title and a new tagline.",
    "Make the character dialogues friendlier and shorter.",
    "Add one easier question before the hardest one.",
    "Make the hints more helpful without giving the answer away.",
    "Change the story so it takes place in space.",
    "Add a short side mission that rewards careful reading.",
    "Make the explanations simpler for a younger student.",
    "Add a new character who gives a useful tip.",
  ],
  he: [
    "תן למשחק שם מצחיק יותר ושורת תיאור חדשה.",
    "הפוך את הדיאלוגים של הדמויות לידידותיים וקצרים יותר.",
    "הוסף שאלה קלה יותר לפני השאלה הקשה ביותר.",
    "שפר את הרמזים כך שיעזרו בלי לחשוף את התשובה.",
    "שנה את הסיפור כך שיתרחש בחלל.",
    "הוסף משימת צד קצרה שמתגמלת קריאה קפדנית.",
    "פשט את ההסברים לתלמיד צעיר יותר.",
    "הוסף דמות חדשה שנותנת טיפ שימושי.",
  ],
};

const GAME_TYPE_ORDER: GameType[] = ["exploration", "puzzle", "platformer", "simulation", "adventure"];
const TIERS: FeatureTier[] = ["A", "B", "C"];
const LANGS: EvalLang[] = ["he", "en"];

/** Every (mode, gameType) pair the tier lets a player ask for. */
function allowedRequests(tier: FeatureTier): { mode: "FAST" | "FULL"; gameType: GameType }[] {
  const out: { mode: "FAST" | "FULL"; gameType: GameType }[] = [];
  for (const mode of ["FAST", "FULL"] as const) {
    if (!modeAllowed(tier, mode)) continue;
    for (const gameType of GAME_TYPE_ORDER) if (gameTypeAllowed(tier, gameType)) out.push({ mode, gameType });
  }
  return out;
}

function request(subject: string, language: EvalLang, difficulty: (typeof DIFFICULTIES)[number], mode: "FAST" | "FULL", gameType: GameType): GenerationRequest {
  return generationRequestSchema.parse({ mode, subject, learningGoal: subject, difficulty, gameType, contentLanguage: language }) as GenerationRequest;
}

/** Cycles through tiers, languages, subjects, difficulties and the allowed (mode, type) pairs so a small set still covers all of them. */
export function buildGenerateCases(n: number): GenerateCase[] {
  const cases: GenerateCase[] = [];
  for (let i = 0; i < n; i++) {
    const tier = TIERS[i % TIERS.length]!;
    const language = LANGS[Math.floor(i / TIERS.length) % LANGS.length]!;
    const pairs = allowedRequests(tier);
    const pair = pairs[Math.floor(i / (TIERS.length * LANGS.length)) % pairs.length]!;
    const subject = SUBJECTS[language][i % SUBJECTS[language].length]!;
    const difficulty = DIFFICULTIES[i % DIFFICULTIES.length]!;
    cases.push({ kind: "generate", id: `gen-${String(i + 1).padStart(3, "0")}`, tier, request: request(subject, language, difficulty, pair.mode, pair.gameType) });
  }
  return cases;
}

export function buildEditCases(n: number): EditCase[] {
  const cases: EditCase[] = [];
  for (let i = 0; i < n; i++) {
    const tier = TIERS[i % TIERS.length]!;
    const language = LANGS[Math.floor(i / TIERS.length) % LANGS.length]!;
    const pairs = allowedRequests(tier).filter((p) => p.mode === "FAST");
    const pair = pairs[i % pairs.length]!;
    const subject = SUBJECTS[language][(i * 5) % SUBJECTS[language].length]!;
    const instructions = EDITS[language];
    cases.push({
      kind: "edit", id: `edit-${String(i + 1).padStart(3, "0")}`, tier,
      base: request(subject, language, DIFFICULTIES[i % DIFFICULTIES.length]!, "FAST", pair.gameType),
      instruction: instructions[Math.floor(i / (TIERS.length * LANGS.length)) % instructions.length]!,
      level: tier === "A" ? "A" : "B",
    });
  }
  return cases;
}

export function buildCases(opts: { generate?: number; edit?: number } = {}): EvalCase[] {
  return [...buildGenerateCases(opts.generate ?? 70), ...buildEditCases(opts.edit ?? 30)];
}
