/**
 * Adds a final boss battle to a finished game (used by the rule-based builders, which have no model to design one).
 *
 * The battle is made of challenge stations the game already has: the hardest ones of the last area, fought in the
 * order the missions unlock them. Nothing new is graded; the result is re-validated with the real rules and the
 * original game is returned untouched if the battle could not be added safely.
 */
import { SPEC_LIMITS } from "./constants";
import type { Boss, GameSpec, Mission } from "./schema";
import { validateGameSpec } from "./validate";

const BOSS_TEXT = {
  en: {
    name: "The Final Guardian",
    title: "Keeper of everything you learned",
    intro: "You made it this far. Show me that you really understand it — every answer wounds me.",
    defeat: "Impressive. You have mastered it.",
    missionTitle: "Defeat the Final Guardian",
    story: "The Guardian blocks the last door. Win every round of its quiz battle to defeat it.",
    objective: "Defeat the Final Guardian",
  },
  he: {
    name: "השומר האחרון",
    title: "שומר כל מה שלמדתם",
    intro: "הגעתם עד כאן. הראו לי שאתם באמת מבינים — כל תשובה נכונה פוצעת אותי.",
    defeat: "מרשים. שלטתם בחומר.",
    missionTitle: "להביס את השומר האחרון",
    story: "השומר חוסם את הדלת האחרונה. נצחו בכל סיבוב של קרב החידון כדי להביס אותו.",
    objective: "הביסו את השומר האחרון",
  },
} as const;

const PHASES_MAX = 4;

export interface BossOutcome {
  spec: GameSpec;
  added: boolean;
  notes: string[];
}

function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${taken.size}`;
}

/** How far into the game a mission is: missions with no prerequisites are 0, a mission after those is 1, and so on. */
function missionDepths(missions: Mission[]): Map<string, number> {
  const byId = new Map(missions.map((m) => [m.id, m]));
  const depth = new Map<string, number>();
  const walk = (id: string, seen: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const d = Math.max(-1, ...(byId.get(id)?.requires ?? []).filter((r) => byId.has(r)).map((r) => walk(r, seen))) + 1;
    depth.set(id, d);
    return d;
  };
  for (const m of missions) walk(m.id, new Set());
  return depth;
}

export function addFinalBoss(base: GameSpec): BossOutcome {
  const none = (note: string): BossOutcome => ({ spec: base, added: false, notes: [note] });
  if ((base.bosses ?? []).length > 0) return none("the game already has a boss");
  if (base.missions.length >= SPEC_LIMITS.missions) return none("no room for a boss mission");

  // The battle happens in the last area of the portal chain (the one nobody leaves).
  const area = [...base.areas].reverse().find((a) => !a.portal) ?? base.areas[base.areas.length - 1]!;
  const challengeStations = area.stations.filter((s) => s.kind === "challenge" && s.challengeId);
  if (challengeStations.length < 3) return none(`area "${area.id}" has fewer than 3 challenge stations`);

  const depth = missionDepths(base.missions);
  const missionDepthOf = (challengeId: string): number => {
    const needing = base.missions.filter((m) => m.areaId === area.id && m.objectives.some((o) => o.type === "solve" && o.challengeIds.includes(challengeId)));
    return needing.length ? Math.min(...needing.map((m) => depth.get(m.id) ?? 0)) : 99;
  };
  const levelOf = (challengeId: string): number => base.challenges.find((c) => c.id === challengeId)?.level ?? 1;

  // A boss round should be a quick exchange: prefer questions over the long builders (program / simulation), unless
  // the area has too few of them to make a battle.
  const quick = challengeStations.filter((s) => {
    const type = base.challenges.find((c) => c.id === s.challengeId)?.type;
    return type !== "program" && type !== "simulation";
  });
  const pool = quick.length >= 3 ? quick : challengeStations;

  // Hardest challenges make the battle; they are fought in the order the missions unlock them, easier ones first.
  const chosen = [...pool]
    .sort((a, b) => levelOf(b.challengeId!) - levelOf(a.challengeId!) || missionDepthOf(b.challengeId!) - missionDepthOf(a.challengeId!))
    .slice(0, Math.min(PHASES_MAX, pool.length))
    .sort((a, b) => missionDepthOf(a.challengeId!) - missionDepthOf(b.challengeId!) || levelOf(a.challengeId!) - levelOf(b.challengeId!));

  const lang = base.meta.language === "he" ? "he" : "en";
  const text = BOSS_TEXT[lang];
  const takenBosses = new Set<string>();
  const takenMissions = new Set(base.missions.map((m) => m.id));
  const bossId = uniqueId("boss-final", takenBosses);
  const missionId = uniqueId("m-boss", takenMissions);

  const here = base.missions.filter((m) => m.areaId === area.id);
  // The battle waits for every required mission of the area; a side mission that builds on one does not hide it.
  const final = here.filter((m) => !m.optional && !here.some((o) => !o.optional && o.requires.includes(m.id)));
  const boss: Boss = {
    id: bossId, areaId: area.id, name: text.name, title: text.title, intro: text.intro, defeatLine: text.defeat,
    look: { color: "#ff4d6d", shape: "creature" }, phaseStationIds: chosen.map((s) => s.id),
  };
  const mission: Mission = {
    id: missionId, title: text.missionTitle, story: text.story, areaId: area.id, requires: final.map((m) => m.id).slice(0, 4),
    objectives: [{ type: "defeat", text: text.objective, bossId }], optional: false,
  };

  const candidate = structuredClone(base) as GameSpec;
  candidate.bosses = [boss];
  candidate.missions.push(mission);
  const checked = validateGameSpec(candidate, { alignGameType: base.meta.gameType });
  if (!checked.ok) return none(`a boss battle could not be added safely: ${checked.errors[0]}`);
  // The validator measures the length from the content; keep the generator's provenance.
  checked.spec.meta.generator = base.meta.generator;
  return { spec: checked.spec, added: true, notes: [`added the final boss "${boss.name}" with ${boss.phaseStationIds.length} phases`] };
}
