import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { INPUT_LIMITS } from "@/config/limits";
import { parseMaterial } from "@/lib/game/material/parse";
import { DICTIONARIES } from "@/lib/i18n";
import {
  DRAFT_KEY, createReducer, decodeTextFile, emptyForm, loadDraft, materialFromFileText, parseDraft, saveDraft, startState, subjectFromFileName,
  type CreateFormValues, type CreateState, type DraftStorage,
} from "../../mobile/src/pages/createForm";
import { EXAMPLES, exampleById, findExample, isExampleText } from "../../mobile/src/pages/examples";
import { AboutPage } from "../../mobile/src/pages/About";

/** The New game screen's pure logic (mobile/src/pages/createForm.ts), the ready-made examples and the About page. */

const memory = (): DraftStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};
const water = exampleById("water")!;
const own: CreateFormValues = { ...emptyForm("en", "A"), subject: "My unit", goal: "", material: "Cell: the smallest unit of life." };
const fresh = (locale: "he" | "en" = "en", over: Partial<CreateState> = {}): CreateState => ({ ...startState(null, { locale, tier: "A", example: false }), ...over });
const onExample = (lang: "he" | "en" = "en"): CreateState => createReducer(fresh(lang), { type: "example", id: "water" });

describe("loading a file over an example", () => {
  it("names the game after the file, not after the example whose notes it replaced", () => {
    const s = createReducer(onExample("en"), { type: "file", text: "Cell: the smallest unit of life.", subject: "cell biology" });
    expect(s.form.material).toBe("Cell: the smallest unit of life.");
    expect(s.form.subject).toBe("cell biology");
    expect(s.undo).toBeNull(); // the example was not the learner's work
  });

  it("with a nameless file the example's subject is dropped, so the learner is asked for one", () => {
    expect(createReducer(onExample("he"), { type: "file", text: "מונח: הסבר", subject: "" }).form.subject).toBe("");
  });

  it("a subject the learner typed over example notes stays theirs", () => {
    const edited = createReducer(onExample("en"), { type: "change", key: "subject", value: "My water unit" });
    const s = createReducer(edited, { type: "file", text: "Notes", subject: "file name" });
    expect(s.form.subject).toBe("My water unit");
    expect(s.undo?.reason).toBe("file"); // the example notes under the learner's own subject can be brought back
  });
});

describe("changing the game language", () => {
  it("an untouched example follows it (both ways) and keeps the other choices", () => {
    const he = createReducer({ ...onExample("he"), form: { ...onExample("he").form, difficulty: "advanced" } }, { type: "change", key: "language", value: "en" });
    expect(he.form).toMatchObject({ language: "en", subject: water.en.subject, material: water.en.notes, difficulty: "advanced" });
    const back = createReducer(he, { type: "change", key: "language", value: "he" });
    expect(back.form).toMatchObject({ language: "he", subject: water.he.subject, material: water.he.notes });
    for (const ex of EXAMPLES) {
      const s = createReducer(createReducer(fresh("he"), { type: "example", id: ex.id }), { type: "change", key: "language", value: "en" });
      expect(s.form).toMatchObject({ subject: ex.en.subject, material: ex.en.notes });
    }
  });

  it("the learner's own text, or an example they edited, is never replaced", () => {
    expect(createReducer(fresh("en", { form: own }), { type: "change", key: "language", value: "he" }).form).toEqual({ ...own, language: "he" });
    const edited = createReducer(onExample("en"), { type: "change", key: "material", value: `${water.en.notes}\nRain: water drops.` });
    const s = createReducer(edited, { type: "change", key: "language", value: "he" });
    expect(s.form.subject).toBe(water.en.subject);
    expect(s.form.material).toContain("Rain: water drops.");
    // the same language again changes nothing
    expect(createReducer(onExample("en"), { type: "change", key: "language", value: "en" }).form.material).toBe(water.en.notes);
  });
});

describe("the stored draft and the examples", () => {
  it("an untouched example never overwrites the learner's own stored text (what #/create?example=1 did 400 ms after opening)", () => {
    const s = memory();
    saveDraft(s, own, 1);
    const opened = startState(loadDraft(s, "A", "en"), { locale: "en", tier: "A", example: true });
    expect(opened.undo?.form).toEqual(own);
    saveDraft(s, opened.form, 2); // the screen's debounced save
    expect(loadDraft(s, "A", "en")).toEqual(own); // still there for the next visit
    // tapping "Bring back my text" stores it again as usual
    saveDraft(s, createReducer(opened, { type: "undo" }).form, 3);
    expect(JSON.parse(s.data.get(DRAFT_KEY)!).savedAt).toBe(3);
  });

  it("an example is stored as before when nothing of the learner's is stored, or once the learner adds to it", () => {
    const s = memory();
    saveDraft(s, onExample().form);
    expect(loadDraft(s, "A", "en")?.subject).toBe(water.en.subject);
    const t = memory();
    saveDraft(t, own);
    saveDraft(t, { ...onExample().form, goal: "Know the four stages" });
    expect(loadDraft(t, "A", "en")?.goal).toBe("Know the four stages");
    // a blank form still forgets the draft
    saveDraft(t, emptyForm("en", "A"));
    expect(t.data.has(DRAFT_KEY)).toBe(false);
  });

  it("a damaged stored draft does not stop the example from being stored", () => {
    const s = memory();
    s.data.set(DRAFT_KEY, "not json");
    saveDraft(s, onExample().form);
    expect(loadDraft(s, "A", "en")?.subject).toBe(water.en.subject);
  });
});

describe("the first form", () => {
  it("a suggested Full Adventure is used only when the tier has it", () => {
    expect(startState(null, { locale: "en", tier: "C", example: false, mode: "FULL" }).form.mode).toBe("FAST");
    expect(startState(null, { locale: "en", tier: "C", example: true, mode: "FULL" }).form.mode).toBe("FAST");
    expect(startState(null, { locale: "en", tier: "A", example: false, mode: "FULL" }).form.mode).toBe("FULL");
  });
});

describe("cut text never ends on half an emoji", () => {
  const halfAtEnd = /[\uD800-\uDBFF]$/;
  it("a long file name becomes a whole subject without a trailing space", () => {
    const name = `${"a".repeat(INPUT_LIMITS.subjectMax - 1)}😀 more.txt`;
    const subject = subjectFromFileName(name);
    expect(halfAtEnd.test(subject)).toBe(false);
    expect(subject.length).toBeLessThanOrEqual(INPUT_LIMITS.subjectMax);
    expect(subjectFromFileName(`${"a".repeat(INPUT_LIMITS.subjectMax - 1)} b.txt`)).toBe("a".repeat(INPUT_LIMITS.subjectMax - 1));
  });

  it("a stored draft cut to the limits keeps whole characters", () => {
    const raw = JSON.stringify({ form: { subject: `${"s".repeat(INPUT_LIMITS.subjectMax - 1)}😀`, material: `${"m".repeat(INPUT_LIMITS.materialMax - 1)}😀` } });
    const f = parseDraft(raw, "A", "en")!;
    expect(halfAtEnd.test(f.subject)).toBe(false);
    expect(halfAtEnd.test(f.material)).toBe(false);
    expect(f.subject).toBe("s".repeat(INPUT_LIMITS.subjectMax - 1));
  });
});

describe("reading a picked file's bytes", () => {
  const notes = "מונה: המספר העליון בשבר.\nמכנה: המספר התחתון בשבר.";
  const cp1255 = (s: string): Uint8Array => Uint8Array.from([...s].map((c) => {
    const code = c.codePointAt(0)!;
    return code >= 0x05d0 && code <= 0x05ea ? code - 0x05d0 + 0xe0 : code;
  }));
  const utf16 = (s: string, le: boolean): Uint8Array => {
    const out = [le ? 0xff : 0xfe, le ? 0xfe : 0xff];
    for (let i = 0; i < s.length; i++) {
      const u = s.charCodeAt(i);
      out.push(...(le ? [u & 0xff, u >> 8] : [u >> 8, u & 0xff]));
    }
    return Uint8Array.from(out);
  };

  it("reads UTF-8 (with or without a byte-order mark)", () => {
    const bytes = new TextEncoder().encode(notes);
    expect(decodeTextFile(bytes)).toBe(notes);
    expect(materialFromFileText(decodeTextFile(Uint8Array.from([0xef, 0xbb, 0xbf, ...bytes])))).toEqual({ ok: true, text: notes, trimmed: false });
  });

  it("reads Notepad's 'Unicode' (UTF-16 with a byte-order mark) and Hebrew 'ANSI' (windows-1255)", () => {
    expect(decodeTextFile(utf16(notes, true))).toBe(notes);
    expect(decodeTextFile(utf16(notes, false))).toBe(notes);
    expect(decodeTextFile(cp1255(notes))).toBe(notes);
    expect(parseMaterial(decodeTextFile(cp1255(notes))).definitions.length).toBe(2);
    // before, the same bytes read as UTF-8 were refused as "not text"
    expect(materialFromFileText(new TextDecoder("utf-8").decode(cp1255(notes))).ok).toBe(false);
  });

  it("a binary file (a PDF or an image picked by mistake) is still refused", () => {
    const binary = new Uint8Array(400);
    for (let i = 0; i < binary.length; i++) binary[i] = (i * 73 + 41) % 256;
    expect(materialFromFileText(decodeTextFile(binary)).ok).toBe(false);
    const alternating = Uint8Array.from({ length: 80 }, (_, i) => (i % 2 === 0 ? 0x00 : 0xff));
    expect(materialFromFileText(decodeTextFile(alternating)).ok).toBe(false);
    expect(decodeTextFile(new Uint8Array(0))).toBe("");
  });
});

describe("the ready-made examples", () => {
  it("finds an example by its exact text, with its language", () => {
    expect(findExample(water.he.subject, water.he.notes)).toEqual({ example: water, lang: "he" });
    expect(findExample(water.en.subject, water.en.notes)?.lang).toBe("en");
    expect(findExample(water.en.subject, water.he.notes)).toBeUndefined();
    expect(isExampleText(water.en.subject, `${water.en.notes} `)).toBe(false);
  });

  it("use the right Hebrew terms: a proper fraction is 'שבר אמיתי' and a planet is 'כוכב לכת', never just 'כוכב'", () => {
    const fractions = exampleById("fractions")!.he.notes;
    expect(fractions).toContain("שבר אמיתי:");
    expect(fractions).not.toContain("שבר פשוט"); // in Hebrew that is any common fraction (as opposed to a decimal one)
    const planets = exampleById("planets")!.he.notes;
    expect(planets).not.toMatch(/הכוכב (?:השלישי|האדום)|סדר הכוכבים/);
    expect(planets).toContain("כדור הארץ הוא כוכב הלכת השלישי");
  });

  it("Hebrew notes have no '<' or '>' (a right-to-left line mirrors them) and every example has both languages", () => {
    for (const ex of EXAMPLES) {
      expect(ex.he.notes + ex.he.subject).not.toMatch(/[<>]/);
      expect(ex.he.subject.trim()).not.toBe("");
      expect(ex.en.subject.trim()).not.toBe("");
    }
  });
});

describe("the app's About page", () => {
  it("renders in Spanish too, with the back link to the settings", () => {
    const html = renderToStaticMarkup(h(I18nProvider, { locale: "es", dict: DICTIONARIES.es, children: h(AboutPage) }));
    expect(html).toContain('data-testid="mobile-about-page"');
    expect(html).toContain('href="#/settings"');
    expect(html).toContain(DICTIONARIES.es["mob.back"]);
    expect(html).toContain(DICTIONARIES.es["about.title"]);
    expect(html).toContain("LUPU");
  });
});
