import { describe, expect, it } from "vitest";
import { GAME_TYPES } from "@/lib/game/spec/constants";
import { gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { OfflineGenerationError, generateOffline } from "@/lib/offline/generate";
import { INPUT_LIMITS } from "@/config/limits";
import { generationRequestSchema } from "@/lib/schemas/generation";
import {
  DRAFT_KEY, anyLocked, classifyGenerationError, classifySaveError, cleanPastedText, clearDraft, detectScript, emptyForm, fitToTier, isBlankForm, isStorageFull,
  createReducer, hasOwnText, loadDraft, lockedChoices, parseDraft, pickGameType, pickMode, saveDraft, startState, type CreateFormValues, type CreateState, type DraftStorage,
} from "../../mobile/src/pages/createForm";
import { EXAMPLES } from "../../mobile/src/pages/examples";

const memory = (): DraftStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};
const filled = (over: Partial<CreateFormValues> = {}): CreateFormValues => ({ ...emptyForm("en", "A"), subject: "Fractions", material: "Numerator: the top number.", ...over });

describe("choices the feature tier allows", () => {
  it("tier A has everything, so nothing is locked and the form starts as an adventure", () => {
    expect(anyLocked("A")).toBe(false);
    expect(emptyForm("he", "A")).toMatchObject({ mode: "FAST", gameType: "adventure", language: "he", difficulty: "beginner" });
    for (const g of GAME_TYPES) expect(gameTypeAllowed("A", g)).toBe(true);
  });

  it("tier C starts on a game type it has, and a Full Adventure is locked", () => {
    expect(anyLocked("C")).toBe(true);
    const form = emptyForm("en", "C");
    expect(gameTypeAllowed("C", form.gameType)).toBe(true);
    expect(modeAllowed("C", form.mode)).toBe(true);
    expect(pickMode("C", "FULL")).toBe("FAST");
    expect(pickMode("A", "FULL")).toBe("FULL");
  });

  it("falls back to the first game type the tier has, for every tier", () => {
    for (const tier of ["A", "B", "C"] as const) {
      for (const wanted of GAME_TYPES) expect(gameTypeAllowed(tier, pickGameType(tier, wanted))).toBe(true);
    }
    expect(pickGameType("C", "simulation")).toBe("exploration");
    expect(pickGameType("B", "platformer")).toBe("platformer");
  });

  it("names which choices are locked, and agrees with the generator", () => {
    expect(lockedChoices("A", { mode: "FULL", gameType: "simulation" })).toEqual({ mode: false, gameType: false });
    expect(lockedChoices("C", { mode: "FULL", gameType: "puzzle" })).toEqual({ mode: true, gameType: false });
    expect(lockedChoices("C", { mode: "FAST", gameType: "platformer" })).toEqual({ mode: false, gameType: true });
    for (const tier of ["A", "B", "C"] as const) {
      for (const mode of ["FAST", "FULL"] as const) {
        for (const gameType of GAME_TYPES) {
          const locked = lockedChoices(tier, { mode, gameType });
          const input = { mode, subject: "Fractions", learningGoal: "Fractions", difficulty: "beginner", gameType, contentLanguage: "en" };
          if (locked.mode || locked.gameType) {
            expect(() => generateOffline(input, new Date(), tier)).toThrow(OfflineGenerationError);
          } else {
            expect(() => generateOffline(input, new Date(), tier)).not.toThrow();
          }
        }
      }
    }
  });

  it("fits a form to a tier without touching the text", () => {
    const f = fitToTier(filled({ mode: "FULL", gameType: "simulation" }), "C");
    expect(f).toMatchObject({ mode: "FAST", subject: "Fractions", material: "Numerator: the top number." });
    expect(gameTypeAllowed("C", f.gameType)).toBe(true);
  });
});

describe("explaining a failure", () => {
  it("a tier refusal says which choice is not in the plan", () => {
    const err = new OfflineGenerationError("TIER_LOCKED", "x");
    expect(classifyGenerationError(err, "C", { mode: "FULL", gameType: "puzzle" })).toEqual({ kind: "tier", mode: true, gameType: false });
    expect(classifyGenerationError(err, "C", { mode: "FAST", gameType: "simulation" })).toEqual({ kind: "tier", mode: false, gameType: true });
    expect(classifyGenerationError(err, "C", { mode: "FULL", gameType: "simulation" })).toEqual({ kind: "tier", mode: true, gameType: true });
  });

  it("a real refusal from the generator is classified the same way", () => {
    let caught: unknown;
    try { generateOffline({ mode: "FULL", subject: "Fractions", learningGoal: "Fractions", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" }, new Date(), "C"); } catch (e) { caught = e; }
    expect(classifyGenerationError(caught, "C", { mode: "FULL", gameType: "adventure" })).toMatchObject({ kind: "tier", mode: true, gameType: true });
  });

  it("unusable notes keep the engine's own message", () => {
    let caught: unknown;
    try { generateOffline({ mode: "FAST", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "exploration", contentLanguage: "en", material: "hello there, this is not really a lesson at all ok" }); } catch (e) { caught = e; }
    const p = classifyGenerationError(caught, "A", { mode: "FAST", gameType: "exploration" });
    expect(p.kind).toBe("material");
    if (p.kind === "material") expect(p.detail).toMatch(/material/i);
  });

  it("anything else is generic, and a full phone is told apart", () => {
    expect(classifyGenerationError(new Error("boom"), "A", { mode: "FAST", gameType: "puzzle" })).toEqual({ kind: "generic" });
    expect(classifyGenerationError(new OfflineGenerationError("INVALID_OUTPUT", "x"), "A", { mode: "FAST", gameType: "puzzle" })).toEqual({ kind: "generic" });
    const quota = Object.assign(new Error("full"), { name: "QuotaExceededError" });
    expect(isStorageFull(quota)).toBe(true);
    expect(isStorageFull({ code: 22 })).toBe(true);
    expect(isStorageFull({ name: "NS_ERROR_DOM_QUOTA_REACHED" })).toBe(true);
    expect(isStorageFull(new Error("nope"))).toBe(false);
    expect(isStorageFull(null)).toBe(false);
    expect(classifySaveError(quota)).toEqual({ kind: "storage" });
    expect(classifySaveError(new Error("x"))).toEqual({ kind: "generic" });
  });
});

describe("pasted text", () => {
  it("removes control characters the request schema rejects and keeps real line breaks", () => {
    const dirty = "Term: meaning\u000BSecond line\u000C\u0000third\r\nfourth\rfifth\u0007\tx";
    const clean = cleanPastedText(dirty);
    expect(clean).toBe("Term: meaning\nSecond line\nthird\nfourth\nfifth\tx");
    const ok = generationRequestSchema.safeParse({ mode: "FAST", subject: "s", learningGoal: "s", difficulty: "beginner", gameType: "puzzle", contentLanguage: "en", material: clean });
    expect(ok.success).toBe(true);
    const bad = generationRequestSchema.safeParse({ mode: "FAST", subject: "s", learningGoal: "s", difficulty: "beginner", gameType: "puzzle", contentLanguage: "en", material: dirty });
    expect(bad.success).toBe(false);
  });

  it("recognises the language of the notes, tolerating a few foreign terms", () => {
    expect(detectScript("אידוי: מים הופכים לאדים בגלל חום השמש. עיבוי: אדי מים מתקררים והופכים לטיפות.")).toBe("he");
    expect(detectScript("Evaporation: water turns into vapour because of the sun's heat. Condensation: vapour cools.")).toBe("en");
    expect(detectScript("אידוי: מים הופכים לאדים בגלל חום השמש. עיבוי: אדי מים מתקררים והופכים לטיפות. (DNA, pH)")).toBe("he");
    expect(detectScript("short")).toBeNull();
    expect(detectScript("")).toBeNull();
    expect(detectScript("אידוי מים הופכים לאדים בגלל חום השמש and Evaporation water turns into vapour because of the heat")).toBeNull();
    expect(detectScript("1234567890 1234567890 1234567890 1234567890 1234567890")).toBeNull();
  });
});

describe("the local draft", () => {
  it("round-trips a filled form and forgets a blank one", () => {
    const s = memory();
    const f = filled({ goal: "Add fractions", difficulty: "advanced", language: "he", gameType: "puzzle" });
    saveDraft(s, f, 123);
    expect(JSON.parse(s.data.get(DRAFT_KEY)!)).toMatchObject({ v: 1, savedAt: 123 });
    expect(loadDraft(s, "A", "en")).toEqual(f);
    saveDraft(s, filled({ subject: "", material: "", goal: "" }));
    expect(s.data.has(DRAFT_KEY)).toBe(false);
    expect(loadDraft(s, "A", "en")).toBeNull();
  });

  it("clearing removes it", () => {
    const s = memory();
    saveDraft(s, filled());
    clearDraft(s);
    expect(loadDraft(s, "A", "en")).toBeNull();
  });

  it("works without storage and never throws when storage fails", () => {
    expect(loadDraft(null, "A", "en")).toBeNull();
    expect(() => saveDraft(null, filled())).not.toThrow();
    expect(() => clearDraft(null)).not.toThrow();
    const broken: DraftStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw Object.assign(new Error("full"), { name: "QuotaExceededError" }); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(loadDraft(broken, "A", "en")).toBeNull();
    expect(() => saveDraft(broken, filled())).not.toThrow();
    expect(() => saveDraft(broken, filled({ subject: "", material: "" }))).not.toThrow();
    expect(() => clearDraft(broken)).not.toThrow();
  });

  it("ignores damaged or foreign data", () => {
    for (const raw of [null, "", "not json", "null", "42", "[]", "{}", '{"form":null}', '{"form":"x"}', '{"form":{}}', '{"form":{"subject":"   "}}']) {
      expect(parseDraft(raw, "A", "en")).toBeNull();
    }
  });

  it("checks every field: unknown choices fall back, text is cut to the limits and cleaned", () => {
    const raw = JSON.stringify({ v: 1, form: { subject: "S".repeat(500), goal: 5, material: "a\u0000b" + "x".repeat(INPUT_LIMITS.materialMax * 2), mode: "HUGE", difficulty: "godlike", gameType: "racing", language: "fr" } });
    const f = parseDraft(raw, "A", "he")!;
    expect(f.subject.length).toBe(INPUT_LIMITS.subjectMax);
    expect(f.goal).toBe("");
    expect(f.material.length).toBe(INPUT_LIMITS.materialMax);
    expect(f.material.startsWith("ab")).toBe(true);
    expect(f).toMatchObject({ mode: "FAST", difficulty: "beginner", gameType: "adventure", language: "he" });
  });

  it("a draft saved on a fuller tier is cut down to what the current tier has", () => {
    const s = memory();
    saveDraft(s, filled({ mode: "FULL", gameType: "simulation" }));
    const f = loadDraft(s, "C", "en")!;
    expect(f.mode).toBe("FAST");
    expect(gameTypeAllowed("C", f.gameType)).toBe(true);
    expect(f.subject).toBe("Fractions");
  });

  it("the choices alone are not a draft", () => {
    expect(isBlankForm(emptyForm("he", "A"))).toBe(true);
    expect(isBlankForm({ subject: " ", goal: "\n", material: "" })).toBe(true);
    expect(isBlankForm({ subject: "a", goal: "", material: "" })).toBe(false);
  });
});

describe("the screen's state", () => {
  const fresh = (over: Partial<CreateState> = {}): CreateState => ({ ...startState(null, { locale: "en", tier: "A", example: false }), ...over });
  const own = filled({ subject: "My unit", goal: "Pass the test", material: "Cell: the smallest unit of life." });

  it("opens empty, or with the saved draft marked as restored", () => {
    expect(startState(null, { locale: "he", tier: "A", example: false })).toMatchObject({ restored: false, undo: null, problem: null, form: emptyForm("he", "A") });
    expect(startState(own, { locale: "en", tier: "A", example: false })).toMatchObject({ restored: true, form: own });
  });

  it("#/create?example=1 fills the default example in the app language and keeps the learner's own draft behind undo", () => {
    const he = startState(null, { locale: "he", tier: "A", example: true });
    expect(he.form).toMatchObject({ subject: "מחזור המים", language: "he" });
    expect(he.undo).toBeNull();
    const withDraft = startState(own, { locale: "en", tier: "A", example: true });
    expect(withDraft.form.subject).toBe("The water cycle");
    expect(withDraft.form.goal).toBe("");
    expect(withDraft.undo).toEqual({ form: own, reason: "example" });
    expect(withDraft.restored).toBe(false);
    const exDraft = filled({ subject: EXAMPLES[1]!.en.subject, material: EXAMPLES[1]!.en.notes });
    expect(startState(exDraft, { locale: "en", tier: "A", example: true }).undo).toBeNull();
  });

  it("typing clears the message about that field only", () => {
    const base = fresh({ problem: { kind: "required" } });
    expect(createReducer(base, { type: "change", key: "goal", value: "g" }).problem).toEqual({ kind: "required" });
    expect(createReducer(base, { type: "change", key: "subject", value: "s" }).problem).toBeNull();
    const material = fresh({ problem: { kind: "material", detail: "x" } });
    expect(createReducer(material, { type: "change", key: "material", value: "m" }).problem).toBeNull();
    expect(createReducer(material, { type: "change", key: "subject", value: "s" }).problem).not.toBeNull();
    const tier = fresh({ problem: { kind: "tier", mode: true, gameType: false } });
    expect(createReducer(tier, { type: "change", key: "mode", value: "FAST" }).problem).toBeNull();
    expect(createReducer(tier, { type: "change", key: "gameType", value: "puzzle" }).problem).toBeNull();
    expect(createReducer(tier, { type: "change", key: "difficulty", value: "advanced" }).problem).not.toBeNull();
    expect(createReducer(fresh({ problem: { kind: "storage" } }), { type: "change", key: "subject", value: "s" }).problem).toEqual({ kind: "storage" });
  });

  it("an edit ends the 'restored' notice and changes only that field", () => {
    const s = createReducer(startState(own, { locale: "en", tier: "A", example: false }), { type: "change", key: "difficulty", value: "advanced" });
    expect(s.restored).toBe(false);
    expect(s.form).toEqual({ ...own, difficulty: "advanced" });
  });

  it("an example fills subject and notes in the game language, resets the goal, and keeps the options", () => {
    const s = createReducer(fresh({ form: filled({ language: "he", difficulty: "advanced", mode: "FULL", goal: "" }) }), { type: "example", id: "planets" });
    expect(s.form).toMatchObject({ subject: "מערכת השמש", language: "he", difficulty: "advanced", mode: "FULL", goal: "" });
    expect(s.form.material).toBe(EXAMPLES[2]!.he.notes);
    expect(createReducer(fresh(), { type: "example", id: "nope" })).toEqual(fresh());
  });

  it("an example never silently destroys the learner's text: it can be brought back", () => {
    const afterExample = createReducer(fresh({ form: own }), { type: "example", id: "water" });
    expect(afterExample.undo).toEqual({ form: own, reason: "example" });
    expect(afterExample.form.subject).toBe("The water cycle");
    // another example on top of an example keeps the original text behind undo
    const second = createReducer(afterExample, { type: "example", id: "fractions" });
    expect(second.undo).toEqual({ form: own, reason: "example" });
    expect(second.form.subject).toBe("Fractions");
    const back = createReducer(second, { type: "undo" });
    expect(back.form).toEqual(own);
    expect(back.undo).toBeNull();
    // an example over an empty form needs no undo
    expect(createReducer(fresh(), { type: "example", id: "water" }).undo).toBeNull();
  });

  it("clearing the form keeps the options, offers undo for the learner's text only", () => {
    const cleared = createReducer(fresh({ form: { ...own, difficulty: "advanced", gameType: "puzzle" } }), { type: "clear" });
    expect(cleared.form).toMatchObject({ subject: "", goal: "", material: "", difficulty: "advanced", gameType: "puzzle" });
    expect(cleared.undo?.reason).toBe("cleared");
    expect(createReducer(cleared, { type: "undo" }).form.subject).toBe("My unit");
    const onExample = createReducer(fresh(), { type: "example", id: "water" });
    expect(createReducer(onExample, { type: "clear" }).undo).toBeNull();
  });

  it("undo with nothing to bring back changes nothing, and a problem can be set and cleared", () => {
    const s = fresh();
    expect(createReducer(s, { type: "undo" })).toBe(s);
    const p = createReducer(s, { type: "problem", problem: { kind: "generic" } });
    expect(p.problem).toEqual({ kind: "generic" });
    expect(createReducer(p, { type: "problem", problem: null }).problem).toBeNull();
  });

  it("tells the learner's own text from an example", () => {
    expect(hasOwnText(own)).toBe(true);
    expect(hasOwnText(emptyForm("en", "A"))).toBe(false);
    expect(hasOwnText(filled({ subject: EXAMPLES[0]!.en.subject, material: EXAMPLES[0]!.en.notes }))).toBe(false);
  });
});
