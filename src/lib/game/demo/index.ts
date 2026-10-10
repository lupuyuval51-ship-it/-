/**
 * DEMO provider content. These are predefined, hand-written game specifications — NOT AI output.
 * The platform labels every game made from them as a "Demo template" so it can never be mistaken for a
 * generated game. The same schema/validation/runtime path is used as for real AI output.
 */
import type { GameType } from "../spec/constants";
import type { GameExtension, GameSpec } from "../spec/schema";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { translator, type Lang } from "./builders";
import { mathPack } from "./packs/math";
import { programmingPack } from "./packs/programming";
import type { DemoPack } from "./types";

export const DEMO_PACKS: readonly DemoPack[] = [programmingPack, mathPack];

const DEFAULT_PACK_FOR_TYPE: Record<GameType, string> = {
  adventure: "programming", exploration: "programming", puzzle: "math", platformer: "programming", simulation: "programming",
};

export function pickPack(subject: string, gameType: GameType): DemoPack {
  const byKeyword = DEMO_PACKS.find((p) => p.keywords.test(subject));
  if (byKeyword) return byKeyword;
  const fallback = DEMO_PACKS.find((p) => p.id === DEFAULT_PACK_FOR_TYPE[gameType]);
  return fallback ?? DEMO_PACKS[0]!;
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
  const pack = pickPack(req.subject, req.gameType);
  const { lang, note } = demoLang(req.contentLanguage);
  const t = translator(lang);
  const content = pack.build(lang);
  const raw: Raw = {
    schemaVersion: 1,
    meta: {
      title: `${pack.title(lang)}: ${req.subject}`.slice(0, 80),
      tagline: pack.tagline(lang),
      subject: req.subject,
      subjectCategory: pack.category,
      gameType: req.gameType,
      difficulty: req.difficulty,
      language: lang,
      estimatedMinutes: 18,
    },
    learning: { goal: req.learningGoal, objectives: content.objectives, conclusion: content.conclusion },
    theme: { environment: pack.environment, timeOfDay: pack.timeOfDay },
    mechanics: content.mechanics,
    areas: content.areas,
    missions: content.missions,
    challenges: content.challenges,
  };
  const notes: string[] = [t("Demo template — not generated by AI. Difficulty and subject wording do not change the content.", "תבנית הדגמה — לא נוצרה בבינה מלאכותית. רמת הקושי וניסוח הנושא אינם משנים את התוכן.")];
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
