/** Shared, deterministic game configuration. Answers and reward authority stay on the server. */
export const GAME_MODES = ["answer-gates", "escape-room", "collect-sort", "build-path", "boss-quiz", "knowledge-arena"] as const;
export const WORLD_THEMES = ["future-city", "sky-island", "ai-lab", "mystery-castle", "digital-world"] as const;
export type GameMode = (typeof GAME_MODES)[number];
export type WorldTheme = (typeof WORLD_THEMES)[number];
export type GameLocale = "he" | "en";
export type GameText = { he: string; en: string };
export type GameQuestion = { id: string; prompt: GameText; options: { he: string[]; en: string[] }; topic?: string; hint?: GameText };
export interface DailyGame {
  dailyGameId: string; date: string; seed: string | number; version?: number;
  gameMode: GameMode; worldTheme: WorldTheme; questions: GameQuestion[];
  timeLimit: number; difficulty?: string; lessonTopics?: string[];
  resumeState?: { index: number; score: number; correct?: number; startedAt?: string };
  isDemo?: boolean;
  arena?: { layout: "courtyard" | "crossroads" | "islands"; enemyCount: number; obstacleCount: number; ambience: "day" | "dusk"; waveCount: number };
}
export interface GameSettings {
  quality?: "low" | "medium" | "high" | "auto";
  graphics?: string; reducedMotion?: boolean; music?: boolean; effects?: boolean;
  sensitivity?: number; controlsSide?: "left" | "right"; force2D?: boolean;
}
export const GAME_MODE_LABELS: Record<GameMode, GameText> = {
  "answer-gates": { he: "שערי התשובות", en: "Answer Gates" },
  "escape-room": { he: "חדר בריחת הידע", en: "Knowledge Escape Room" },
  "collect-sort": { he: "אוספים וממיינים", en: "Collect and Sort" },
  "build-path": { he: "בונים את הדרך", en: "Build the Path" },
  "boss-quiz": { he: "אתגר הבוס", en: "Boss Quiz" },
  "knowledge-arena": { he: "זירת הידע", en: "Knowledge Arena" },
};
export const WORLD_LABELS: Record<WorldTheme, GameText> = {
  "future-city": { he: "העיר העתידנית", en: "Future City" },
  "sky-island": { he: "האיים שבשמיים", en: "Sky Islands" },
  "ai-lab": { he: "מעבדת AI", en: "AI Laboratory" },
  "mystery-castle": { he: "הטירה המסתורית", en: "Mystery Castle" },
  "digital-world": { he: "עולם הקוביות", en: "Digital World" },
};
export const WORLD_PALETTES: Record<WorldTheme, { sky: number; fog: number; ground: number; structure: number; trim: number; accent: number; light: number }> = {
  "future-city": { sky: 0x101b31, fog: 0x172640, ground: 0x344457, structure: 0x263950, trim: 0x7ca4c7, accent: 0x66d5e5, light: 0xb6d4ff },
  "sky-island": { sky: 0xbad1e4, fog: 0xc8dcea, ground: 0x789886, structure: 0xc6d0cb, trim: 0xd6c499, accent: 0x407c92, light: 0xffe4bc },
  "ai-lab": { sky: 0x10221f, fog: 0x182f2b, ground: 0x345048, structure: 0x516b61, trim: 0xb1c8c0, accent: 0x65d8ac, light: 0xd3ffeb },
  "mystery-castle": { sky: 0x1e202e, fog: 0x292a3d, ground: 0x56505e, structure: 0x6b6573, trim: 0xaf9f87, accent: 0xd4aa5d, light: 0xffd494 },
  "digital-world": { sky: 0x0b162d, fog: 0x12264a, ground: 0x223454, structure: 0x2e4976, trim: 0x7299d0, accent: 0x80bcff, light: 0xc1d9ff },
};
export function seededRandom(seed: string | number): () => number {
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => { value += 0x6d2b79f5; let n = value; n = Math.imul(n ^ (n >>> 15), n | 1); n ^= n + Math.imul(n ^ (n >>> 7), n | 61); return ((n ^ (n >>> 14)) >>> 0) / 4294967296; };
}
export function lanePosition(index: number, count: number): number { return (index - (count - 1) / 2) * 4; }
export function nearestLane(x: number, count: number): number { return Math.max(0, Math.min(count - 1, Math.round(x / 4 + (count - 1) / 2))); }
export function clampMovement(x: number, z: number): { x: number; z: number } { return { x: Math.max(-9, Math.min(9, x)), z: Math.max(-22, Math.min(10, z)) }; }
export function normalizeInput(x: number, z: number): { x: number; z: number } { const length = Math.max(1, Math.hypot(x, z)); return { x: x / length, z: z / length }; }
export function bossPhase(answered: number, total: number): number { return Math.min(3, 1 + Math.floor((answered / Math.max(total, 1)) * 3)); }
export function isQuestionComplete(index: number, total: number): boolean { return index >= total; }
export function gameStorageKey(attemptId: string): string { return `levelup-quest:${attemptId}`; }

export type ArenaPoint = { x: number; z: number };
export type ArenaCover = ArenaPoint & { width: number; depth: number; style: "hedge" | "stone" | "crate" };
export type ArenaTelemetry = { health: number; dashCooldown: number; enemies: number; collected: number; wave: number; aimBlocked?: boolean };
export function arenaLayout(seed: string | number, layout: string, count: number): ArenaCover[] {
  const random = seededRandom(`${seed}:arena:${layout}`);
  const positions = layout === "crossroads" ? [[-6.7,-4],[6.7,-4],[-5,3],[5,3],[-8,8],[8,8],[-8,-10],[8,-10],[0,10],[0,-1],[-3,-11],[3,-11]] : layout === "islands" ? [[-6.3,-3],[6.3,-3],[-6,5],[6,5],[0,0],[-8,-8],[8,-8],[0,10],[-3,8],[3,8],[-8,1],[8,1]] : [[-6,-2],[6,-2],[-4,5],[4,5],[0,-4],[-8,9],[8,9],[-8,-8],[8,-8],[-8,2],[8,2],[0,10]];
  return positions.slice(0, Math.max(4, Math.min(12, Math.floor(count)))).map(([x,z], index) => ({ x, z, width: index < 4 ? 2.7 : 1.8 + random() * .5, depth: index < 4 ? 1.7 : 1.5, style: index % 3 === 0 ? "hedge" : index % 3 === 1 ? "stone" : "crate" }));
}
export function circleTouchesCover(point: ArenaPoint, radius: number, cover: ArenaCover): boolean {
  const x = Math.max(cover.x - cover.width / 2, Math.min(cover.x + cover.width / 2, point.x));
  const z = Math.max(cover.z - cover.depth / 2, Math.min(cover.z + cover.depth / 2, point.z));
  return Math.hypot(point.x - x, point.z - z) < radius;
}
/** Axis sliding keeps a joystick pressed against cover responsive without tunnelling. */
export function slideArenaMovement(start: ArenaPoint, delta: ArenaPoint, covers: ArenaCover[], radius = .48): ArenaPoint {
  const position = { ...start }, steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / .2));
  for (let step = 0; step < steps; step++) {
    const x = { x: Math.max(-9.7 + radius, Math.min(9.7 - radius, position.x + delta.x / steps)), z: position.z };
    if (!covers.some(cover => circleTouchesCover(x, radius, cover))) position.x = x.x;
    const z = { x: position.x, z: Math.max(-12.8 + radius, Math.min(12.8 - radius, position.z + delta.z / steps)) };
    if (!covers.some(cover => circleTouchesCover(z, radius, cover))) position.z = z.z;
  }
  return position;
}
export function arenaLineBlocked(from: ArenaPoint, to: ArenaPoint, covers: ArenaCover[], radius = .12): boolean {
  const distance = Math.hypot(to.x - from.x, to.z - from.z), steps = Math.max(1, Math.ceil(distance / .18));
  for (let index = 0; index <= steps; index++) {
    const fraction = index / steps;
    if (covers.some(cover => circleTouchesCover({ x: from.x + (to.x - from.x) * fraction, z: from.z + (to.z - from.z) * fraction }, radius, cover))) return true;
  }
  return false;
}
export function arenaAim(from: ArenaPoint, to: ArenaPoint): ArenaPoint {
  const distance = Math.hypot(to.x - from.x, to.z - from.z);
  return distance < .001 ? { x: 0, z: -1 } : { x: (to.x - from.x) / distance, z: (to.z - from.z) / distance };
}

export type GameTextSegment = { text: string; ltr: boolean };
/** Preserve the source text exactly; only mark directional islands for React's <bdi>. */
export function segmentGameText(value: string): GameTextSegment[] {
  const ranges: Array<{ start: number; end: number }> = [];
  // ASCII code and English phrases may contain numeric expressions of their own.
  for (const match of value.matchAll(/[\x20-\x7e×÷−≤≥]+/g)) {
    if (!/[A-Za-z_$]/.test(match[0])) continue;
    const leading = match[0].length - match[0].trimStart().length;
    const text = match[0].trim();
    ranges.push({ start: match.index + leading, end: match.index + leading + text.length });
  }
  // At least one binary operator is required, so a Hebrew exercise number stays in context.
  const number = "\\(?[+\\-−]?\\d+(?:[.,]\\d+)?%?\\)?";
  const expression = new RegExp(`${number}(?:[ \\t]*(?:\\*\\*|[+\\-−×÷*/^=<>≤≥:])[ \\t]*${number})+`, "g");
  for (const match of value.matchAll(expression)) ranges.push({ start: match.index, end: match.index + match[0].length });
  ranges.sort((a,b) => a.start - b.start || b.end - a.end);
  const merged: typeof ranges = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start < previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  const segments: GameTextSegment[] = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) segments.push({ text: value.slice(cursor, range.start), ltr: false });
    segments.push({ text: value.slice(range.start, range.end), ltr: true });
    cursor = range.end;
  }
  if (cursor < value.length) segments.push({ text: value.slice(cursor), ltr: false });
  return segments;
}
