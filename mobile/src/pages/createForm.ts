/**
 * Pure logic behind the "New game" screen of the offline app: what the form holds, which choices the device's feature
 * tier allows, the local draft, cleaning of pasted text and how a failure is explained. No React and no DOM here (the
 * storage is passed in), so all of it is unit-tested. The screen itself is `Create.tsx`.
 */
import { INPUT_LIMITS } from "@/config/limits";
import type { FeatureTier } from "@/config/plans";
import { DIFFICULTIES, GAME_TYPES, type Difficulty, type GameType } from "@/lib/game/spec/constants";
import { gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { OfflineGenerationError } from "@/lib/offline/generate";
import { storageErrorCode } from "@/lib/offline/store";
import { EXAMPLE_NOTES, exampleById, findExample, isExampleText } from "./examples";

export type CreateMode = "FAST" | "FULL";
export type ContentLang = "he" | "en";

export interface CreateFormValues {
  subject: string;
  goal: string;
  material: string;
  mode: CreateMode;
  difficulty: Difficulty;
  gameType: GameType;
  language: ContentLang;
}

// ───────────────────────────── feature tier ─────────────────────────────

/** The game type a new form starts with: the adventure, or the first one the tier has. */
const GAME_TYPE_PREFERENCE: readonly GameType[] = ["adventure", "exploration", "puzzle", "platformer", "simulation"];

export function pickGameType(tier: FeatureTier, wanted: GameType): GameType {
  if (gameTypeAllowed(tier, wanted)) return wanted;
  return GAME_TYPE_PREFERENCE.find((g) => gameTypeAllowed(tier, g)) ?? "exploration";
}

export const pickMode = (tier: FeatureTier, wanted: CreateMode): CreateMode => (modeAllowed(tier, wanted) ? wanted : "FAST");

export function emptyForm(language: ContentLang, tier: FeatureTier): CreateFormValues {
  return { subject: "", goal: "", material: "", mode: "FAST", difficulty: "beginner", gameType: pickGameType(tier, "adventure"), language };
}

/** The same form with any choice the tier lacks replaced by one it has (used for restored drafts). */
export function fitToTier(form: CreateFormValues, tier: FeatureTier): CreateFormValues {
  return { ...form, mode: pickMode(tier, form.mode), gameType: pickGameType(tier, form.gameType) };
}

/** Which of the two tier-limited choices are not part of the plan. */
export function lockedChoices(tier: FeatureTier, form: Pick<CreateFormValues, "mode" | "gameType">): { mode: boolean; gameType: boolean } {
  return { mode: !modeAllowed(tier, form.mode), gameType: !gameTypeAllowed(tier, form.gameType) };
}

export const anyLocked = (tier: FeatureTier): boolean =>
  !modeAllowed(tier, "FULL") || GAME_TYPES.some((g) => !gameTypeAllowed(tier, g));

// ───────────────────────────── text ─────────────────────────────

/**
 * Pasted text from PDFs and word processors carries control characters (vertical tab, form feed, NUL …) that the
 * request schema rejects. Line-break-like ones become a newline, the others are dropped, line endings are unified.
 */
export function cleanPastedText(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u000B\u000C\u0085\u2028\u2029]/g, "\n")
    .replace(/[\u0000-\u0008\u000E-\u001F\u007F]/g, "");
}

/**
 * The first `max` characters, never ending on the first half of a two-unit character (an emoji): a lone half is not
 * text, shows as a broken box and is refused by the cloud backup's database.
 */
function cutAt(s: string, max: number): string {
  const kept = s.slice(0, max);
  return /[\uD800-\uDBFF]$/.test(kept) ? kept.slice(0, -1) : kept;
}

/**
 * The language a text is written in, or null when it is too short or mixed to tell (Hebrew notes with a few Latin
 * terms still count as Hebrew).
 */
export function detectScript(text: string): ContentLang | null {
  let he = 0;
  let en = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x0590 && c <= 0x05ff) he++;
    else if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) en++;
  }
  const total = he + en;
  if (total < 40) return null;
  if (he / total >= 0.8) return "he";
  if (en / total >= 0.8) return "en";
  return null;
}

// ───────────────────────────── a text file as the study material ─────────────────────────────

/** Bigger than this is not a set of notes. */
export const MAX_FILE_BYTES = 2_000_000;

export type MaterialFile = { ok: true; text: string; trimmed: boolean } | { ok: false };

/**
 * The material out of a file the learner picked. Anything that does not read as text (a PDF or a Word file picked by
 * mistake decodes to NULs and replacement characters), or is empty, is refused; a long file keeps its beginning.
 */
export function materialFromFileText(raw: string): MaterialFile {
  const broken = (raw.match(/[\u0000\uFFFD]/g) ?? []).length;
  if (broken > Math.max(2, raw.length * 0.01)) return { ok: false };
  const text = cleanPastedText(raw).trim();
  if (!text) return { ok: false };
  return { ok: true, text: cutAt(text, INPUT_LIMITS.materialMax), trimmed: text.length > INPUT_LIMITS.materialMax };
}

/**
 * The text of a picked file's bytes. `File.text()` always reads UTF-8, so notes that Windows Notepad saved as "Unicode"
 * (UTF-16 with a byte-order mark) or as Hebrew "ANSI" (windows-1255, the old Israeli default) came out as garbage and
 * were refused. UTF-8 is tried first; a legacy Hebrew file is recognised by its letters (bytes 0xE0–0xFA hold א–ת);
 * anything else is read as UTF-8 with replacement characters, which `materialFromFileText` then refuses as not text.
 */
export function decodeTextFile(bytes: Uint8Array): string {
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) {
    return new TextDecoder(bytes[0] === 0xff ? "utf-16le" : "utf-16be").decode(bytes);
  }
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { /* not UTF-8 */ }
  let high = 0;
  let hebrew = 0;
  for (const b of bytes) {
    if (b < 0x80) continue;
    high++;
    if (b >= 0xe0 && b <= 0xfa) hebrew++;
  }
  if (hebrew / Math.max(1, high) >= 0.6) {
    try { return new TextDecoder("windows-1255").decode(bytes); } catch { /* a WebView without the legacy encodings */ }
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/** A subject suggested by the file name ("cell-biology_ch3.md" becomes "cell biology ch3"). */
export function subjectFromFileName(name: string): string {
  return cutAt(cleanPastedText(name).replace(/\.[A-Za-z0-9]{1,8}$/, "").replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim(), INPUT_LIMITS.subjectMax).trimEnd();
}

/** Nothing typed yet (the choices alone do not make a draft). */
export const isBlankForm = (f: Pick<CreateFormValues, "subject" | "goal" | "material">): boolean => !f.subject.trim() && !f.goal.trim() && !f.material.trim();

// ───────────────────────────── the local draft ─────────────────────────────

export const DRAFT_KEY = "levelup.mobile.createDraft";

/** The part of `Storage` the draft needs, so tests can pass a plain object. */
export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** `localStorage` if the WebView lets us touch it, otherwise null (private mode, blocked site data …). */
export function draftStorage(): DraftStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, max: number): string => (typeof v === "string" ? cutAt(cleanPastedText(v), max) : "");
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : fallback);

/** A stored draft, checked field by field: anything unexpected falls back to a default rather than breaking the screen. */
export function parseDraft(raw: string | null, tier: FeatureTier, fallbackLanguage: ContentLang): CreateFormValues | null {
  if (!raw) return null;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!data || typeof data !== "object") return null;
  const f = (data as { form?: unknown }).form;
  if (!f || typeof f !== "object") return null;
  const o = f as Record<string, unknown>;
  const form: CreateFormValues = {
    subject: str(o.subject, INPUT_LIMITS.subjectMax),
    goal: str(o.goal, INPUT_LIMITS.goalMax),
    material: str(o.material, INPUT_LIMITS.materialMax),
    mode: oneOf(["FAST", "FULL"] as const, o.mode, "FAST"),
    difficulty: oneOf(DIFFICULTIES, o.difficulty, "beginner"),
    gameType: oneOf(GAME_TYPES, o.gameType, "adventure"),
    language: oneOf(["he", "en"] as const, o.language, fallbackLanguage),
  };
  return isBlankForm(form) ? null : fitToTier(form, tier);
}

export function loadDraft(storage: DraftStorage | null, tier: FeatureTier, fallbackLanguage: ContentLang): CreateFormValues | null {
  if (!storage) return null;
  try { return parseDraft(storage.getItem(DRAFT_KEY), tier, fallbackLanguage); } catch { return null; }
}

/** An example exactly as its button filled it in (no goal typed either): nothing of the learner's own is in the form. */
const isUntouchedExample = (f: CreateFormValues): boolean => !f.goal.trim() && isExampleText(f.subject, f.material);

/**
 * Stores the form, or forgets the draft when nothing was typed. An untouched example never takes the place of the
 * learner's own unfinished text (`#/create?example=1` opens on the example while the draft waits behind "Bring back
 * my text", which lives only as long as the screen): that text stays stored for the next visit, and the example is one
 * tap away. Never throws: a draft is a convenience.
 */
export function saveDraft(storage: DraftStorage | null, form: CreateFormValues, now = Date.now()): void {
  if (!storage) return;
  try {
    if (isBlankForm(form)) storage.removeItem(DRAFT_KEY);
    else if (!(isUntouchedExample(form) && storedOwnText(storage))) storage.setItem(DRAFT_KEY, JSON.stringify({ v: 1, savedAt: now, form }));
  } catch { /* storage full or blocked: the draft is simply not kept */ }
}

/** The stored draft holds text the learner wrote (not blank, not an example). */
function storedOwnText(storage: DraftStorage): boolean {
  const stored = parseDraft(storage.getItem(DRAFT_KEY), "A", "he");
  return stored !== null && hasOwnText(stored);
}

export function clearDraft(storage: DraftStorage | null): void {
  try { storage?.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

// ───────────────────────────── explaining a failure ─────────────────────────────

export type CreateProblem =
  | { kind: "required" }
  | { kind: "tier"; mode: boolean; gameType: boolean }
  | { kind: "material"; /** Specific message from the study engine, in the game's language. */ detail: string | null }
  /** "My own notes" with no notes, a subject alone builds nothing. */
  | { kind: "notes" }
  /** a new library topic, but this half-year's topics are used up (`tracks.ts`) */
  | { kind: "limit" }
  | { kind: "storage" }
  | { kind: "generic" };

/** The browser's "no room left" errors differ between engines (name, legacy code or Firefox's NS_ error). */
export function isStorageFull(err: unknown): boolean {
  const e = err as { name?: unknown; code?: unknown } | null;
  if (!e || typeof e !== "object") return false;
  return e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014;
}

/** What went wrong while building a game, in terms the screen can show next to the right field. */
export function classifyGenerationError(err: unknown, tier: FeatureTier, form: Pick<CreateFormValues, "mode" | "gameType">): CreateProblem {
  if (err instanceof OfflineGenerationError) {
    if (err.code === "TIER_LOCKED") {
      const locked = lockedChoices(tier, form);
      // the generator refused, so at least one is locked; if our own check disagrees, blame the game type
      return { kind: "tier", mode: locked.mode, gameType: locked.gameType || !locked.mode };
    }
    if (err.code === "MATERIAL_UNUSABLE") return { kind: "material", detail: err.message || null };
  }
  return { kind: "generic" };
}

/**
 * Failure while writing the finished game to the phone. The store reports a full phone as its own typed error (`STORAGE_FULL`), not as
 * the browser's quota error, so both count: otherwise a full phone was told "the game could not be built, change the details".
 */
export const classifySaveError = (err: unknown): CreateProblem => (isStorageFull(err) || storageErrorCode(err) === "STORAGE_FULL" ? { kind: "storage" } : { kind: "generic" });

// ───────────────────────────── the screen's state ─────────────────────────────

/** What the learner had before a button replaced it, so one tap brings it back. */
export interface Undo { form: CreateFormValues; reason: "example" | "cleared" | "file" }

export interface CreateState {
  form: CreateFormValues;
  /** The form came from an earlier, unfinished visit. */
  restored: boolean;
  undo: Undo | null;
  problem: CreateProblem | null;
}

export type CreateAction =
  | { [K in keyof CreateFormValues]: { type: "change"; key: K; value: CreateFormValues[K] } }[keyof CreateFormValues]
  | { type: "example"; id: string }
  | { type: "file"; text: string; subject: string }
  | { type: "clear" }
  | { type: "undo" }
  | { type: "problem"; problem: CreateProblem | null };

/** Text the learner wrote themselves: not blank and not one of the ready-made examples. */
export const hasOwnText = (f: CreateFormValues): boolean => !isBlankForm(f) && !isExampleText(f.subject, f.material);

/**
 * The form when the screen opens: the saved draft if there is one, or the default example for `#/create?example=1`
 * (a draft the learner wrote themselves is then kept behind "Bring back my text").
 */
export function startState(saved: CreateFormValues | null, opts: { locale: ContentLang; tier: FeatureTier; example: boolean; mode?: "FAST" | "FULL" }): CreateState {
  // a fresh form starts in the mode suggested by the first-run answers (how much time a day); a saved draft keeps its own
  // (only when the tier has it: a suggestion never opens the form on a locked choice)
  const fresh = (): CreateFormValues => ({ ...emptyForm(opts.locale, opts.tier), ...(opts.mode ? { mode: pickMode(opts.tier, opts.mode) } : {}) });
  if (opts.example) {
    const ex = EXAMPLE_NOTES[opts.locale];
    return {
      form: { ...fresh(), subject: ex.subject, material: ex.notes },
      restored: false,
      undo: saved && hasOwnText(saved) ? { form: saved, reason: "example" } : null,
      problem: null,
    };
  }
  return { form: saved ?? fresh(), restored: Boolean(saved), undo: null, problem: null };
}

export function createReducer(state: CreateState, action: CreateAction): CreateState {
  switch (action.type) {
    case "change": {
      const { problem } = state;
      const solved = problem !== null
        && ((problem.kind === "required" && action.key === "subject")
          || ((problem.kind === "material" || problem.kind === "notes") && action.key === "material")
          || (problem.kind === "tier" && (action.key === "mode" || action.key === "gameType")));
      let form: CreateFormValues = { ...state.form, [action.key]: action.value };
      // An example nobody has edited follows the game language (its button is named in that language too): otherwise
      // switching the language left Hebrew notes in an English game, or the other way round.
      if (action.key === "language") {
        const shown = findExample(state.form.subject, state.form.material);
        if (shown && shown.lang !== action.value) form = { ...form, subject: shown.example[action.value].subject, material: shown.example[action.value].notes };
      }
      return { ...state, form, restored: false, problem: solved ? null : problem };
    }
    case "example": {
      const ex = exampleById(action.id)?.[state.form.language];
      if (!ex) return state;
      return {
        form: { ...state.form, subject: ex.subject, material: ex.notes, goal: "" },
        restored: false,
        undo: hasOwnText(state.form) ? { form: state.form, reason: "example" } : state.undo,
        problem: null,
      };
    }
    case "file": {
      const f = state.form;
      const onExample = isExampleText(f.subject, f.material);
      const replaces = f.material.trim() !== "" && !onExample;
      // An example's subject names the example's notes, which the file replaces: the file's name takes its place too
      // (otherwise notes about cells became a game called "The water cycle").
      const subjectless = f.subject.trim() === "" || onExample;
      const solved = state.problem !== null && (state.problem.kind === "material" || state.problem.kind === "notes" || (state.problem.kind === "required" && subjectless && action.subject !== ""));
      return {
        form: { ...f, material: action.text, subject: subjectless ? action.subject : f.subject },
        restored: false,
        undo: replaces ? { form: f, reason: "file" } : state.undo,
        problem: solved ? null : state.problem,
      };
    }
    case "clear":
      return {
        form: { ...state.form, subject: "", goal: "", material: "" },
        restored: false,
        undo: hasOwnText(state.form) ? { form: state.form, reason: "cleared" } : state.undo,
        problem: null,
      };
    case "undo":
      return state.undo ? { form: state.undo.form, restored: false, undo: null, problem: null } : state;
    case "problem":
      return { ...state, problem: action.problem };
  }
}
