# PLOT TWIST — Architecture & Module Contracts

```
shared/            isomorphic content model (client + server, no DOM/Node APIs)
  types.ts           Adventure, StageNode, Ending, Prefs, Trait…
  constants.ts       options, labels, palettes, motifs, limits, level titles
  validate.ts        validateAdventure(), checkPrefsFit(), fitsPrefs()
  graph.ts           enumeratePaths(), pathMinutes(), successors()
  template.ts        {{key|fallback}} tokens: renderTemplate(), cleanNote()
  aiEpisode.ts       AI fixed-topology shape + JSON schema + aiEpisodeToAdventure()
server/            Node (type-stripped TS) — the only place provider credentials exist
  config.ts          env → ServerConfig (key sanity check, limits, proxy trust, allowed origins)
  api.ts             /api/health, /api/status, /api/episodes/generate (SSE); origin, rate and stream limits
  director.ts        Claude call → parse → convert → validate → constraints → safety → (repair) → episode
  prompt.ts          byte-stable system prompt + per-request brief (client strings as quoted data)
  constraints.ts     hard-constraint heuristics on AI text (free/home/solo cues, time fill, distinct branches)
  safety.ts          word-order-independent safety screen for AI episodes
  status.ts          verified connection status (TTLs, recent writing failures)
  static.ts          production static files: containment check, gzip, security headers/CSP
  index.ts           production entry (static + API), stale-build warning
src/
  content/           curated library (one file per adventure, auto-collected)
  engine/            pure logic: random, matching, progression, run   (types.ts = contract)
  state/             persistence (localStorage), tab sync, dealing + React store (types.ts = contract)
  poster/            canvas poster rendering + PNG export/share       (types.ts = contract)
  ai/                browser client for the AI Director API
  ui/                design system components + screens
tests/             vitest unit tests (node environment)
e2e/               Playwright scripts (pre-installed global playwright)
```

Imports use explicit `.ts` extensions everywhere (the server runs on Node's
built-in type stripping, so only erasable TypeScript: no enums, namespaces or
parameter properties). Engine, state and poster modules must not import React.

---

## Engine (`src/engine/`) — contract in `src/engine/types.ts`

### `random.ts`
```ts
export function hashSeed(...parts: Array<string | number>): number;      // 32-bit unsigned, deterministic
export function mulberry32(seed: number): () => number;                  // PRNG in [0, 1)
export function pick<T>(rng: () => number, items: readonly T[]): T;
export function shuffle<T>(rng: () => number, items: readonly T[]): T[]; // returns a new array
export function makeId(prefix: string, rng?: () => number): string;      // e.g. "run-k3x9…"
```

### `matching.ts`
```ts
export function filterValid(library: readonly Adventure[], prefs: Prefs): Adventure[];
export function scoreAdventure(adv: Adventure, prefs: Prefs, opts?: MatchOptions): ScoredAdventure;
export function matchAdventures(library: readonly Adventure[], prefs: Prefs, opts?: MatchOptions): MatchResult;
export function suggestRelaxations(library: readonly Adventure[], prefs: Prefs): Relaxation[];
export function describeConflict(library: readonly Adventure[], prefs: Prefs): { reason: string; relaxations: Relaxation[] };
```
- **Hard constraints** (via `fitsPrefs` from `shared/validate.ts`): minutes ≤
  chosen time, cost.max ≤ budget, setting included, company included.
- **Ranking**: mood (primary mood match strongest), weirdness proximity, time
  fit (prefer episodes that use more of the available time), small bonus when a
  paid budget is actually used, small bonus for episodes designed specifically
  for the chosen company, and a small seeded jitter so reshuffles vary.
- **Recency**: avoid immediately repeating recently completed episodes when
  alternatives exist — strong penalty for the last ~3 completions / last 7
  days, and never pick the single most recent completion if enough other valid
  episodes exist.
- **Diversity**: picks are greedy by score with penalties for repeating a
  `kind` (and, softer, the primary mood) already picked.
- `exclude` ids are never picked.
- **Conflicts**: when nothing fits, `conflict.reason` explains in plain words
  which constraints clash (e.g. "Nothing fits 15 minutes, outside, with others
  on a ₪0 budget."), and `relaxations` lists single-constraint changes that
  would produce matches — each with a button label and `gain`, sorted by gain.
  Minutes/budget relax to the next larger option(s) (`MINUTES_OPTIONS`,
  `BUDGET_OPTIONS`); setting/company flip. Only include relaxations with gain > 0.
  Labels: "Give it 30 min", "Make it 2 hours", "Allow up to ₪30", "Stay in",
  "Head outside", "Go solo", "Bring others".

### `progression.ts`
```ts
export function computeAward(adv: Adventure, choices: { nodeId: string; optionId: string }[], endingId: string): Award;
export function emptyTraits(): TraitPoints;
export function addTraits(a: TraitPoints, b: Partial<TraitPoints>): TraitPoints;
export function totalTraits(completed: readonly CompletedEpisode[]): TraitPoints;
export function levelFor(trait: Trait, points: number): TraitLevel;     // uses LEVEL_THRESHOLDS + TRAIT_TITLES
export function seriesStats(completed: readonly CompletedEpisode[]): SeriesStats;
```
Award = adventure base `traits` ("Completed the episode") + each chosen
option's `traits` ("Chose: <label>") + the ending's `traits` ("Ending: <title>").

### `run.ts` — an episode in progress (immutable updates: every function returns a new Run)
```ts
export function startRun(adv: Adventure, prefs: Prefs, episodeNumber: number, now: number, id?: string): Run;
export function elapsedMs(run: Run, now: number): number;   // elapsedMs + (runningSince ? now - runningSince : 0)
export function isPaused(run: Run): boolean;                // not finished and runningSince === null
export function isFinished(run: Run): boolean;
export function pauseRun(run: Run, now: number): Run;
export function resumeRun(run: Run, now: number): Run;
export function touchRun(run: Run, now: number): Run;       // updates lastSeenAt
export function currentNode(run: Run): StageNode | null;
export function toggleAlternative(run: Run): Run;
export function setNote(run: Run, key: string, value: string): Run;   // stores cleaned note (cleanNote)
export function completeStage(run: Run, now: number): Run;
export function chooseOption(run: Run, optionId: string, now: number): Run;
export function recoverRun(run: Run, now: number, maxAwayMs?: number): { run: Run; autoPaused: boolean };
export function progressFraction(run: Run): number;         // 0..1 for the progress indicator
export function pathSummary(run: Run): PathStepSummary[];
export function completeEpisode(run: Run, now: number, journal?: string): CompletedEpisode;
```
Rules:
- `startRun` begins running immediately (`runningSince = now`), phase `action`,
  at `adv.start`.
- `completeStage` records a StepRecord (with `usedAlternative`), then: if the
  node has a `choice` → phase `choice` (timer keeps running); else follow
  `next` → next node (phase `action`, `usingAlternative=false`) or, if `next`
  is an ending, finish: `endingId`, `finishedAt = now`, timer stopped (fold the
  running segment into `elapsedMs`, `runningSince = null`).
- `chooseOption` (phase `choice` only) stores `optionId` on the last StepRecord
  and moves to the option's `next` (node, or ending → finish as above).
- Pausing/resuming are idempotent; finished runs ignore them. Paused time is
  never counted.
- If the run is paused when `completeStage`/`chooseOption` is called, resume
  implicitly (doing the task means you're playing).
- `recoverRun` (called after a reload, when the tab becomes visible again, and
  on each visible heartbeat): if running and `now - lastSeenAt` exceeds
  `maxAwayMs` (default `max(45 min, 2 × adventure.minutes)`), credit at most
  `maxAwayMs` of away time, then pause, and return `autoPaused: true`.
  Otherwise just touch. Phones lock while people do the activity — normal
  hidden time **does** count. The store passes `lastSeenAt = max(run.lastSeenAt,
  seen key)` (see *Tabs and time away* below).
- `completeEpisode` requires a finished run; renders twist/closingLine with
  `renderTemplate(text, run.notes)`; builds `steps` via `pathSummary`; computes
  `award` with `computeAward`; `posterSeed = hashSeed(run.id, adventure.id, endingId)`.

## Persistence (`src/state/persistence.ts`) — contract in `src/state/types.ts`
```ts
export const STORAGE_KEY = 'plot-twist:v1';
export function defaultState(now?: number): PersistedState;
export function loadState(storage?: StorageLike | null, now?: number): LoadResult;
export function saveState(state: PersistedState, storage?: StorageLike | null, now?: number): SaveResult;
export function sanitizeState(raw: unknown, now?: number): { state: PersistedState; repaired: boolean };
export function clearState(storage?: StorageLike | null): void;
export function getBrowserStorage(): StorageLike | null;   // window.localStorage, or null if unavailable/throws
```
- Every storage access is wrapped in try/catch (private mode, quota, disabled).
- `sanitizeState` never throws: unknown/invalid fields fall back to defaults;
  any embedded `Adventure` (draw envelopes, run) must pass `validateAdventure`
  or be dropped (an invalid run is discarded; an invalid envelope becomes
  `status: 'failed'`, `adventure: null`); prefs must use valid option values;
  completed episodes missing required fields are dropped. `repaired` is true
  when anything was dropped/fixed.
- Corrupt JSON → back up the raw string under `plot-twist:corrupt` (best
  effort), return defaults with status `reset-corrupt` and a calm message.
- `saveState` sets `updatedAt` (optionally to a given `now`) and maps quota
  errors to `reason: 'quota'`.

### Tabs and time away (`src/state/sync.ts`, `src/state/store.tsx`)
- A tab writes only when it has its **own** unsaved changes (a dirty flag set
  by `update()`); hiding, closing or idling never writes a stale snapshot.
- Other tabs' writes are adopted immediately (`storage` event) and re-read when
  a tab becomes visible again or is restored from the back/forward cache.
- Before writing, the store compares the stored `updatedAt` with the one it last
  read or wrote. If someone else wrote in between, `mergeStates` combines both:
  completed episodes are a **union by id** (never lost); every other section
  comes from whichever side changed last; a run the other side finished is
  dropped.
- "Last seen" for the running episode is a separate key (`plot-twist:v1:seen`)
  that only moves while the page is visible (15 s heartbeat, on hide, and on
  unload only if visible). Absence is checked on load, when the tab becomes
  visible, and on every heartbeat (a frozen timer after sleep shows up as a gap).
- Unsaved input (field notes, journal) registers with `registerDraft` and is
  committed right before the page-hide save.

## Poster (`src/poster/`) — contract in `src/poster/types.ts`
```ts
// render.ts
export async function ensurePosterFonts(): Promise<void>;   // waits for the web fonts used on canvas (with timeout)
export function drawPoster(ctx: CanvasRenderingContext2D, input: PosterInput, width: number, height: number): void;
export async function renderPosterCanvas(input: PosterInput, opts?: { width?: number }): Promise<HTMLCanvasElement>;
export async function posterToBlob(input: PosterInput, opts?: { width?: number }): Promise<Blob>;     // image/png
export async function posterToDataURL(input: PosterInput, opts?: { width?: number }): Promise<string>; // thumbnails
// fromEpisode.ts
export function posterInputFromEpisode(ep: CompletedEpisode, seriesName: string | null): PosterInput;
// export.ts
export function posterFileName(input: PosterInput): string;   // "plot-twist-ep04-the-undercover-tourist.png"
export function downloadBlob(blob: Blob, fileName: string): void;
export async function sharePoster(blob: Blob, fileName: string, text: string): Promise<ShareOutcome>;
```
- Canvas 2D, 2:3 ratio (1080×1620 default; height = width × 1.5). Deterministic
  from `seed` (mulberry32 from `src/engine/random.ts`).
- Fonts (already loaded by the app via @fontsource): `"Fraunces Variable"`
  (display serif), `"Instrument Sans Variable"` (sans; supports
  `font-stretch` 75–100%), `"JetBrains Mono Variable"` (mono).
- `sharePoster`: `navigator.canShare({ files })` → share the PNG; else
  `navigator.share` with text; else clipboard copy of `text` → `'copied'`;
  AbortError → `'cancelled'`.
