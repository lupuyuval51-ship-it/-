import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { ChallengePanel } from "@/components/game/hud/ChallengePanel";
import { withoutRightLead } from "@/components/game/hud/result-text";
import { MathText, keepWhole } from "@/components/ui/MathText";
import { interactablePrompt } from "@/lib/game/a11y/scene";
import { toPublicChallenge } from "@/lib/game/challenges/grade";
import type { Challenge } from "@/lib/game/spec/schema";
import { blockingStep, stationActive } from "@/lib/game/state/progress";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { DICTIONARIES, makeT } from "@/lib/i18n";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

/** What a learner hit on 2026-10-25 (daily user check), each pinned so it stays fixed. */
const he = makeT(DICTIONARIES.he);
const renderHe = (node: ReturnType<typeof h>) =>
  renderToStaticMarkup(h(I18nProvider, { locale: "he", dict: DICTIONARIES.he, children: node }));

describe("a locked question says the step that is still missing", () => {
  it("after reading every lesson board, chapter 1 says to talk to the guide (not just the mission's name)", async () => {
    const content = (await loadTopicContent("course-fractions-1"))!;
    const { spec } = generateOffline({ mode: "FAST", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "adventure", contentLanguage: "he", topicId: "course-fractions-1", device: "phone" }, new Date(0), "A", content);
    const lessonMission = spec.missions.find((m) => m.objectives.some((o) => o.type === "visit"))!;
    const visit = lessonMission.objectives.find((o) => o.type === "visit")!;
    const talk = lessonMission.objectives.find((o) => o.type === "talk")!;
    expect(talk).toBeTruthy();
    const read = { missionsDone: [] as string[], resolvedStations: {} as Record<string, "correct" | "revealed">, collected: [] as string[], talked: [] as string[], visited: visit.type === "visit" ? [...visit.stationIds] : [] };
    const question = spec.areas[0]!.stations.find((s) => s.kind === "challenge" && !stationActive(spec, read, s))!;
    expect(blockingStep(spec, read, question)).toBe(talk.text);
    // nothing read yet: the first unfinished step comes first
    expect(blockingStep(spec, { ...read, visited: [] }, question)).toBe(lessonMission.objectives[0]!.text);
  });
});

describe("a lesson board that was read can be read again", () => {
  it("its prompt offers reading, not just 'completed'", () => {
    const t = he;
    const done = { kind: "station" as const, id: "b1", label: "דוגמה פתורה", stationKind: "lore" as const, status: "done" as const, x: 0, z: 0 };
    expect(interactablePrompt(done, t)).toEqual({ text: "קריאת דוגמה פתורה", enabled: true });
    expect(interactablePrompt({ ...done, stationKind: "challenge" }, t).text).toBe("דוגמה פתורה — הושלם");
  });
});

describe("practice says hints are free, and its hint button agrees", () => {
  const ch = { id: "c1", type: "choice", title: "T", prompt: "p", concept: "c", level: 1, points: 100, hint: "רמז", explanation: "הסבר ארוך מספיק", options: [{ id: "a", text: "א", feedback: "f" }, { id: "b", text: "ב", feedback: "f" }, { id: "c", text: "ג", feedback: "f" }], correctOptionId: "a" } as unknown as Challenge;
  const props = { challenge: toPublicChallenge(ch, "seed"), stationLabel: "תרגול", result: null, hint: null, busy: false, onSubmit: () => {}, onHint: () => {}, onClose: () => {} };
  it("in practice the button does not say it costs points; in a game it does", () => {
    const practice = renderHe(h(ChallengePanel, { ...props, embedded: true, freeHints: true }));
    expect(practice).toContain(">הצגת רמז<");
    expect(practice).not.toContain("15%");
    expect(renderHe(h(ChallengePanel, props))).toContain("הצגת רמז (פחות 15% מהנקודות)");
  });
});

describe("a right answer's feedback does not stutter 'correct' under the 'Correct!' heading", () => {
  it("drops a leading 'נכון —' / 'Yes —' of a right answer only", () => {
    expect(withoutRightLead("נכון — כך החומר שלכם מתאר זאת.", true)).toBe("כך החומר שלכם מתאר זאת.");
    expect(withoutRightLead("Yes — that is the number in your material.", true)).toBe("That is the number in your material.");
    expect(withoutRightLead("נכון — המשפט שונה. החומר שלכם אומר: ״x״", true)).toBe("המשפט שונה. החומר שלכם אומר: ״x״");
    expect(withoutRightLead("לא נכון. המילה ״x״ מופיעה בפתקים שלכם", false)).toBe("לא נכון. המילה ״x״ מופיעה בפתקים שלכם");
    expect(withoutRightLead("נכון — ", true)).toBe("נכון — ");
    expect(withoutRightLead("נכונות התשובה תלויה בהקשר.", true)).toBe("נכונות התשובה תלויה בהקשר.");
    // a hyphenated first word, a negative number and a variable are never touched
    expect(withoutRightLead("Right-click opens the menu.", true)).toBe("Right-click opens the menu.");
    expect(withoutRightLead("Yes -5 is less than -3.", true)).toBe("Yes -5 is less than -3.");
    expect(withoutRightLead("Correct — x = 4 makes both sides equal.", true)).toBe("x = 4 makes both sides equal.");
    expect(withoutRightLead("Right — mRNA carries the code.", true)).toBe("mRNA carries the code.");
  });
});

describe("a short equation is never broken across two lines", () => {
  it("is one unbreakable run; a long line of code may still wrap", () => {
    const html = renderHe(h(MathText, { text: "שמונה חלקים: 2 × 8 = 16. וגם let nums = [5, 10, 15, 20, 25, 30]" }));
    expect(html).toContain('<bdi dir="ltr" class="whitespace-nowrap">2 × 8 = 16</bdi>');
    expect(html).toContain('<bdi dir="ltr">let nums = [5, 10, 15, 20, 25, 30]</bdi>');
    // URLs, code and English words fill whole cards in a narrow column: they still wrap
    expect(renderHe(h(MathText, { text: "כמו https://example.com/page" }))).not.toContain("whitespace-nowrap");
    expect(renderHe(h(MathText, { text: "ומתקיים log(xy) = log x + log y" }))).not.toContain("whitespace-nowrap");
  });

  it("an answer of several lines keeps its line breaks", () => {
    expect(keepWhole("1. 58\n2. 85")).toBe(false);
    expect(keepWhole("2 × 8 = 16")).toBe(true);
    expect(keepWhole("2(x + 1) = 2x + 2")).toBe(true);
  });
});

describe("a game from the learner's own Hebrew notes", () => {
  // notes like these made "אינו" an answer option (it was taken for a term)
  const NOTES = `הירח הוא גרם שמיים שמקיף את כדור הארץ.
הירח אינו כוכב, הוא לוויין.
כוכב חמה הוא הכוכב הקרוב ביותר לשמש.
האור של הירח אינו שלו, זה אור השמש.
על הירח יש מכתשים רבים.
הירח מקיף את כדור הארץ בערך פעם בחודש.
הצד הרחוק של הירח אינו נראה מכדור הארץ.
בשנת 1969 נחת האדם הראשון על הירח.`;
  const { spec } = generateOffline(request({ material: NOTES, subject: "הירח", learningGoal: "הירח", difficulty: "beginner", mode: "FULL", contentLanguage: "he" }));
  const choice = spec.challenges.filter((c) => c.type === "choice");

  it("never offers a function word such as 'אינו' as an answer", () => {
    for (const c of choice) for (const o of c.options) {
      expect(["אינו", "אינה", "ביותר", "כמה"], `${c.id}: ${o.text}`).not.toContain(o.text.trim());
      expect(o.text, `${c.id}: a word swapped for a function word`).not.toMatch(/ אינו\.$/u);
    }
  });

});
