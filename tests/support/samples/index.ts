/**
 * DEMO provider content. These are predefined, hand-written game specifications — NOT AI output.
 * The platform labels every game made from them as a "Demo template" so it can never be mistaken for a
 * generated game. The same schema/validation/runtime path is used as for real AI output.
 */
import type { GameType } from "@/lib/game/spec/constants";
import type { GameExtension, GameSpec } from "@/lib/game/spec/schema";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { easierChoice, easierMatch, spreadAnswers, translator, type Lang } from "@/lib/game/builders";
import { historyPack } from "./packs/history";
import { languagePack } from "./packs/language";
import { mathPack } from "./packs/math";
import { programmingPack } from "./packs/programming";
import { sciencePack } from "./packs/science";
import type { DemoPack } from "./types";

/** Order matters: the first pack whose keywords match the subject wins. */
type Challenges = Record<string, unknown>[];

/**
 * Easier warm-ups derived from the written questions (served after two misses in a row): a choice question keeps the right
 * option and the one wrong option (its index, as written) that is easiest to rule out; a match question keeps three pairs.
 */
const WARMUPS: Record<string, { base: string; wrong?: number }[]> = {
  programming: [{ base: "c-var1", wrong: 3 }, { base: "c-cond1", wrong: 2 }, { base: "c-func1", wrong: 3 }],
  science: [{ base: "c-states", wrong: 3 }, { base: "c-force", wrong: 1 }],
  language: [{ base: "c-hello", wrong: 2 }, { base: "c-food", wrong: 1 }, { base: "c-polite" }],
};

function withWarmups(packId: string, lang: Lang, challenges: Challenges): Challenges {
  const plan = WARMUPS[packId] ?? [];
  const warm = lang === "he" ? "(חימום)" : "(warm-up)";
  const variants: Challenges = [];
  const out = challenges.map((c) => {
    const w = plan.find((p) => p.base === c.id);
    if (!w || c.easierId) return c;
    const over = { id: `${c.id}-easy`, title: `${String(c.title)} ${warm}`.slice(0, 80) };
    variants.push(c.type === "match" ? easierMatch(c, over) : easierChoice(c, { ...over, wrong: w.wrong ?? 0 }));
    return { ...c, easierId: over.id };
  });
  return [...out, ...variants];
}

/** Where each pack starts in the cycle of answer slots (chosen so the packs together use every slot about equally). */
const SLOT_OFFSETS = [0, 1, 2, 3, 0];

/** The packs as they are played: warm-ups added, and the right answer of a choice question not always in the same place. */
const spread = (pack: DemoPack, at: number): DemoPack => ({
  ...pack,
  build: (lang) => {
    const content = pack.build(lang);
    return { ...content, challenges: spreadAnswers(withWarmups(pack.id, lang, content.challenges as Challenges), at) };
  },
  extensions: (lang) => pack.extensions(lang).map((e) => ({ ...e, challenges: spreadAnswers(e.challenges as Challenges, at + 1) })),
});

export const DEMO_PACKS: readonly DemoPack[] = [programmingPack, mathPack, sciencePack, historyPack, languagePack].map((pack, i) => spread(pack, SLOT_OFFSETS[i]!));

const DEFAULT_PACK_FOR_TYPE: Record<GameType, string> = {
  adventure: "programming", exploration: "history", puzzle: "math", platformer: "language", simulation: "science",
};

export function pickPack(subject: string, gameType: GameType): DemoPack {
  return matchPack(subject) ?? DEMO_PACKS.find((p) => p.id === DEFAULT_PACK_FOR_TYPE[gameType]) ?? DEMO_PACKS[0]!;
}

/** The template whose keywords match the subject, or null when none does (the caller must then say so). */
export function matchPack(subject: string): DemoPack | null {
  return DEMO_PACKS.find((p) => p.keywords.test(subject)) ?? null;
}

export function demoLang(contentLanguage: string): { lang: Lang; note?: string } {
  if (contentLanguage === "he") return { lang: "he" };
  if (contentLanguage === "en") return { lang: "en" };
  return { lang: "en", note: `Demo templates are only available in English and Hebrew, so English was used instead of "${contentLanguage}".` };
}

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Shorten a full template to a focused "Fast Game": one area, ≤4 stations, 1–2 missions. */
export function trimToFast(raw: Raw): string[] {
  const notes: string[] = [];
  const area: Raw = raw.areas[0];
  raw.areas = [area];
  delete area.portal;
  const challengeStations: Raw[] = area.stations.filter((s: Raw) => s.kind === "challenge").slice(0, 4);
  area.stations = challengeStations;
  const keptStationIds = new Set<string>(challengeStations.map((s) => s.id));
  const keptChallengeIds = new Set<string>(challengeStations.map((s) => s.challengeId));
  area.collectibles = { ...area.collectibles, count: Math.min(area.collectibles?.count ?? 0, 3) };

  const missions: Raw[] = [];
  for (const m of raw.missions as Raw[]) {
    if (m.areaId !== area.id) continue;
    const objectives = (m.objectives as Raw[]).flatMap((o): Raw[] => {
      if (o.type === "solve") {
        const ids = (o.challengeIds as string[]).filter((id) => keptChallengeIds.has(id));
        return ids.length ? [{ ...o, challengeIds: ids }] : [];
      }
      if (o.type === "visit") {
        const ids = (o.stationIds as string[]).filter((id) => keptStationIds.has(id));
        return ids.length ? [{ ...o, stationIds: ids }] : [];
      }
      if (o.type === "collect") return area.collectibles.count > 0 ? [{ ...o, count: Math.min(o.count, area.collectibles.count) }] : [];
      if (o.type === "talk") return area.npcs.some((n: Raw) => n.id === o.npcId) ? [o] : [];
      return [o];
    });
    if (objectives.length) missions.push({ ...m, objectives });
  }
  const ids = new Set(missions.map((m) => m.id));
  for (const m of missions) m.requires = (m.requires as string[]).filter((r) => ids.has(r));
  raw.missions = missions.slice(0, 3);
  const keptMissionIds = new Set(raw.missions.map((m: Raw) => m.id));
  for (const m of raw.missions) m.requires = (m.requires as string[]).filter((r) => keptMissionIds.has(r));

  const variants = new Set<string>();
  for (const c of raw.challenges as Raw[]) if (keptChallengeIds.has(c.id)) [c.easierId, c.harderId].filter(Boolean).forEach((v: string) => variants.add(v));
  raw.challenges = (raw.challenges as Raw[]).filter((c) => keptChallengeIds.has(c.id) || variants.has(c.id));
  const usedObjectives = new Set((raw.challenges as Raw[]).map((c) => c.objectiveId).filter(Boolean));
  raw.learning.objectives = (raw.learning.objectives as Raw[]).filter((o) => usedObjectives.has(o.id)).slice(0, 3);
  raw.meta.estimatedMinutes = 6;
  notes.push("Fast Game: trimmed the template to one area with up to four challenges.");
  return notes;
}

export interface DemoBuild {
  raw: Raw;
  templateId: string;
  notes: string[];
}

export function buildDemoSpec(req: GenerationRequest): DemoBuild {
  const matched = matchPack(req.subject);
  const pack = matched ?? pickPack(req.subject, req.gameType);
  const { lang, note } = demoLang(req.contentLanguage);
  const t = translator(lang);
  const content = pack.build(lang);
  const topic = pack.topic(lang);
  // When no template matches, never present the fixed content as if it were about the user's subject.
  const subject = matched ? req.subject : topic;
  const raw: Raw = {
    schemaVersion: 1,
    meta: {
      title: (matched ? `${pack.title(lang)}: ${req.subject}` : `${pack.title(lang)} (${t("demo", "הדגמה")})`).slice(0, 80),
      tagline: pack.tagline(lang),
      subject: subject.slice(0, 120),
      subjectCategory: pack.category,
      gameType: req.gameType,
      difficulty: req.difficulty,
      language: lang,
      estimatedMinutes: 18,
    },
    learning: { goal: matched ? req.learningGoal : `${t("Practise:", "תרגול:")} ${topic}`.slice(0, 320), objectives: content.objectives, conclusion: content.conclusion },
    theme: { environment: pack.environment, timeOfDay: pack.timeOfDay },
    mechanics: content.mechanics,
    areas: content.areas,
    missions: content.missions,
    challenges: content.challenges,
  };
  const notes: string[] = [t("Demo template — not generated by AI. Difficulty and subject wording do not change the content.", "תבנית הדגמה — לא נוצרה בבינה מלאכותית. רמת הקושי וניסוח הנושא אינם משנים את התוכן.")];
  notes.push(
    matched
      ? t(`Template used: “${topic}”. Its questions are fixed and may cover only part of “${req.subject}”.`, `התבנית שנבחרה: ״${topic}״. השאלות בה קבועות ועשויות לכסות רק חלק מ״${req.subject}״.`)
      : t(`No demo template matches “${req.subject}”, so the “${topic}” template was used instead. Configure an AI provider to generate a game about any subject.`, `אין תבנית הדגמה שמתאימה ל״${req.subject}״, ולכן נעשה שימוש בתבנית ״${topic}״. הגדירו ספק בינה מלאכותית כדי ליצור משחק על כל נושא.`),
  );
  if (note) notes.push(note);
  if (req.mode === "FAST") notes.push(...trimToFast(raw));
  return { raw, templateId: pack.id, notes };
}

/** Pick the next unused pre-written extension for the game's template. */
export function buildDemoExtension(spec: GameSpec, req: GenerationRequest): { ext: GameExtension; templateId: string } | null {
  const templateId = spec.meta.generator?.templateId;
  const pack = (templateId ? DEMO_PACKS.find((p) => p.id === templateId) : undefined) ?? pickPack(spec.meta.subject, spec.meta.gameType);
  const lang = demoLang(spec.meta.language).lang;
  const existingAreas = new Set(spec.areas.map((a) => a.id));
  const next = pack.extensions(lang).find((e) => (e.areas as { id: string }[]).every((a) => !existingAreas.has(a.id)));
  void req;
  if (!next) return null;
  return { ext: next as unknown as GameExtension, templateId: pack.id };
}
