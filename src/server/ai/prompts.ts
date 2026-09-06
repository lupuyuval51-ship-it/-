/**
 * Renders request data into compact text blocks for the user turn of each coach call.
 * Nothing here is cached by the model (it changes per request); the frozen system prompt is in systemPrompt.ts.
 */
import type { CompletedSession, Exercise, ExerciseResult, Locale, Skill, WorkoutRequest } from "@/lib/types";
import { EXERCISE_MANIFEST, type ManifestEntry } from "@/content/manifest";
import { GOAL_SKILLS, ROLE_FOCUS, phaseTemplatesFor } from "@/engine/phaseTemplates";
import type { ReplaceExerciseCandidate } from "@/lib/serverTypes";

export const CATALOG_PROMPT_MAX_LINES = 60;

export function languageLine(locale: Locale): string {
  return locale === "he" ? "כתוב את כל הטקסטים בעברית טבעית של מאמן ספורט ישראלי." : "Write every text in clear, idiomatic English.";
}

export function renderWorkoutRequest(req: WorkoutRequest): string {
  const lines = [
    `duration_minutes: ${req.durationMinutes}`,
    `role: ${req.role}${req.secondaryRole ? ` (secondary: ${req.secondaryRole})` : ""}`,
    `primary_goal: ${req.primaryGoal}${req.secondaryGoal ? ` | secondary_goal: ${req.secondaryGoal}` : ""}`,
    `intensity: ${req.intensity} | energy_today: ${req.energy}/5`,
    `participants: ${req.participants} | field: ${req.fieldSize} | wind: ${req.wind}`,
    `equipment: ${req.equipment.length ? req.equipment.join(", ") : "disc only"}`,
    `level: ${req.level} | age_group: ${req.ageGroup} | hand: ${req.hand}`,
    `include_fitness: ${req.includeFitness} | include_challenge: ${req.includeChallenge}`,
  ];
  if (req.excludedSkills.length) lines.push(`excluded_skills: ${req.excludedSkills.join(", ")}`);
  if (req.weakSkills?.length) lines.push(`weak_skills (extra weight): ${req.weakSkills.join(", ")}`);
  if (req.recentExerciseIds?.length) lines.push(`recently_used_ids (avoid when possible): ${req.recentExerciseIds.slice(0, 20).join(", ")}`);
  if (req.templateType) lines.push(`session_template: ${req.templateType}`);
  return lines.join("\n");
}

/** Exact phase minute template – the model must copy these numbers. */
export function renderPhaseTemplate(req: WorkoutRequest): string {
  const templates = phaseTemplatesFor(req.durationMinutes, req.includeChallenge);
  const parts = templates.map((t) => `${t.type}=${t.minutes}`);
  return `phases (exact minutes, in this order): ${parts.join(", ")} | total=${req.durationMinutes}`;
}

interface CatalogLine {
  id: string;
  name: string;
  phases: string[];
  skills: Skill[];
  roles: string[];
  participants: string[];
  equipment: string[];
  levels: string[];
}

function fromManifest(e: ManifestEntry, locale: Locale): CatalogLine {
  return { id: e.id, name: locale === "he" ? e.he : e.en, phases: e.phases, skills: e.skills, roles: e.roles, participants: e.participants, equipment: e.equipment, levels: e.levels };
}

function fromExercise(e: Exercise, locale: Locale): CatalogLine {
  return { id: e.id, name: e.name[locale] || e.name.he, phases: e.phases, skills: e.skills, roles: e.roles, participants: e.participants, equipment: e.equipment, levels: e.levels };
}

function eligible(line: CatalogLine, req: WorkoutRequest): boolean {
  if (!line.participants.includes(req.participants)) return false;
  if (!line.levels.includes(req.level)) return false;
  const available = new Set<string>(["disc", ...req.equipment]);
  if (line.equipment.some((eq) => !available.has(eq))) return false;
  if (req.excludedSkills.length && line.skills.length && req.excludedSkills.includes(line.skills[0])) return false;
  return true;
}

function relevance(line: CatalogLine, req: WorkoutRequest): number {
  let s = 0;
  if (line.roles.length === 0 || line.roles.includes(req.role)) s += 2;
  if (req.secondaryRole && line.roles.includes(req.secondaryRole)) s += 1;
  const goalSkills = [...GOAL_SKILLS[req.primaryGoal], ...(req.secondaryGoal ? GOAL_SKILLS[req.secondaryGoal] : [])];
  for (const sk of line.skills) {
    if (goalSkills.includes(sk)) s += 3;
    if (req.weakSkills?.includes(sk)) s += 1;
    if (ROLE_FOCUS[req.role].skills.includes(sk)) s += 1;
  }
  if (req.recentExerciseIds?.includes(line.id)) s -= 2;
  return s;
}

const PHASE_QUOTA: [string, number][] = [["warmup", 6], ["throwing", 12], ["movement", 10], ["role", 12], ["game", 8], ["challenge", 6], ["cooldown", 4]];

/**
 * Compact list (≤ 60 lines) of drills the athlete can actually run, spread across phases and sorted by relevance.
 * Admin-added drills (`extra`) are merged; manifest entries whose ids the admin disabled are removed.
 */
export function renderCatalogForPrompt(req: WorkoutRequest, locale: Locale, extra: Exercise[] = [], disabledIds: string[] = []): string {
  const disabled = new Set(disabledIds);
  const lines: CatalogLine[] = [
    ...EXERCISE_MANIFEST.filter((e) => !disabled.has(e.id)).map((e) => fromManifest(e, locale)),
    ...extra.filter((e) => !EXERCISE_MANIFEST.some((m) => m.id === e.id)).map((e) => fromExercise(e, locale)),
  ].filter((l) => eligible(l, req));
  const chosen: CatalogLine[] = [];
  const seen = new Set<string>();
  for (const [phase, quota] of PHASE_QUOTA) {
    if (phase === "challenge" && !req.includeChallenge) continue;
    const pool = lines.filter((l) => l.phases.includes(phase) && !seen.has(l.id)).sort((a, b) => relevance(b, req) - relevance(a, req));
    for (const l of pool.slice(0, quota)) {
      chosen.push(l);
      seen.add(l.id);
    }
  }
  return chosen
    .slice(0, CATALOG_PROMPT_MAX_LINES)
    .map((l) => `${l.id} | ${l.name} | ${l.phases.join("/")} | ${l.skills.slice(0, 4).join(",")}${l.equipment.length ? ` | needs: ${l.equipment.join(",")}` : ""}`)
    .join("\n");
}

function num(v: number | undefined, suffix = ""): string | null {
  return typeof v === "number" && Number.isFinite(v) ? `${Math.round(v * 10) / 10}${suffix}` : null;
}

export function renderCompletedSession(s: CompletedSession, label: string): string {
  const bits = [
    `${label}: "${s.workoutTitle.he || s.workoutTitle.en}" ${s.completedAt.slice(0, 10)} role=${s.role} source=${s.source}`,
    `minutes=${Math.round(s.actualMinutes)}/${s.plannedMinutes} exercises=${s.exercisesCompleted}/${s.exercisesCount} throws=${s.throws} catches=${s.catches}`,
  ];
  const acc = [num(s.accuracyPct, "%") && `accuracy=${num(s.accuracyPct, "%")}`, num(s.backhandAccuracy, "%") && `backhand=${num(s.backhandAccuracy, "%")}`, num(s.forehandAccuracy, "%") && `forehand=${num(s.forehandAccuracy, "%")}`, num(s.hammerAccuracy, "%") && `hammer=${num(s.hammerAccuracy, "%")}`].filter(Boolean);
  if (acc.length) bits.push(acc.join(" "));
  const metrics = Object.entries(s.roleMetrics ?? {}).filter(([, v]) => typeof v === "number").slice(0, 12).map(([k, v]) => `${k}=${Math.round((v as number) * 10) / 10}`);
  if (metrics.length) bits.push(`role_metrics: ${metrics.join(", ")}`);
  const feel = [s.difficulty !== undefined && `difficulty=${s.difficulty}/5`, s.feeling !== undefined && `feeling=${s.feeling}/5`].filter(Boolean);
  if (feel.length) bits.push(feel.join(" "));
  if (s.checkin) bits.push(`checkin: energy=${s.checkin.energy} pain=${s.checkin.pain} wind=${s.checkin.wind} surface=${s.checkin.surface}`);
  if (s.replacements?.length) bits.push(`replacements: ${s.replacements.slice(0, 5).map((r) => `${r.fromName.he || r.fromName.en}→${r.toName.he || r.toName.en} (${r.reason})`).join("; ")}`);
  if (s.skillsTrained?.length) bits.push(`skills: ${s.skillsTrained.slice(0, 10).join(", ")}`);
  if (s.note) bits.push(`note: ${s.note.slice(0, 160)}`);
  return bits.join("\n");
}

export function renderResults(results: ExerciseResult[]): string {
  if (results.length === 0) return "results: none recorded";
  const lines = results.slice(0, 60).map((r) => {
    const v = [
      r.attempts !== undefined ? `${r.successes ?? 0}/${r.attempts}${num(r.accuracyPct, "%") ? ` (${num(r.accuracyPct, "%")})` : ""}` : null,
      num(r.timeSeconds, "s"),
      num(r.distanceMeters, "m"),
      r.count !== undefined ? `count=${r.count}` : null,
      r.streak !== undefined ? `streak=${r.streak}` : null,
      r.rating !== undefined ? `rating=${r.rating}/5` : null,
      r.score !== undefined ? `score=${r.score}` : null,
    ].filter(Boolean);
    const flags = [r.windy && "windy", r.tired && "tired", r.difficulty !== undefined && `difficulty=${r.difficulty}`].filter(Boolean);
    return `- ${r.exerciseName.he || r.exerciseName.en} [${r.phaseType}] ${r.metricKey}: ${v.join(" ") || "n/a"}${flags.length ? ` (${flags.join(", ")})` : ""}${r.note ? ` note: ${r.note.slice(0, 120)}` : ""}`;
  });
  return `results:\n${lines.join("\n")}`;
}

export function renderCandidates(candidates: ReplaceExerciseCandidate[]): string {
  if (candidates.length === 0) return "candidates: none";
  return `candidates:\n${candidates.map((c) => `- ${c.id} | ${c.name} | ${c.skills.join(",")}`).join("\n")}`;
}
