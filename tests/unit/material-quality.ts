/**
 * Measurable question-quality checks for study-engine games. The "test-wise" guessers answer without knowing the
 * subject (longest option, odd-one-in, prompt overlap): a well-built question gives them no more than chance.
 */
import { NOTE_SETS } from "@/lib/game/sim-balance/corpus";
import { buildMaterialSpec, MaterialError } from "@/lib/game/material/build";
import { generationRequestSchema } from "@/lib/schemas/generation";
import { MESSY, type Fixture } from "./material-fixtures";

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Built {
  id: string;
  lang: "he" | "en";
  mode: "FAST" | "FULL";
  raw: Raw;
}

export function allFixtures(): Fixture[] {
  const clean = (["en", "he"] as const).flatMap((lang) => NOTE_SETS[lang].map((n) => ({ id: n.id, lang, subject: n.subject, text: n.text })));
  return [...clean, ...MESSY];
}

/** Every fixture in both modes; thin material is refused honestly and skipped. */
export function buildAll(fixtures: Fixture[] = allFixtures()): Built[] {
  const out: Built[] = [];
  for (const f of fixtures) {
    for (const mode of ["FULL", "FAST"] as const) {
      try {
        const req = generationRequestSchema.parse({ mode, subject: f.subject, learningGoal: f.subject, difficulty: "beginner", gameType: "adventure", contentLanguage: f.lang, material: f.text });
        out.push({ id: `${f.id}/${mode}`, lang: f.lang, mode, raw: buildMaterialSpec(req).raw });
      } catch (e) {
        if (!(e instanceof MaterialError)) throw e;
      }
    }
  }
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => norm(s).split(" ").filter((w) => w.length >= 3);

export interface Report {
  games: number;
  challenges: number;
  choices: number;
  /** The correct answer is written in the question itself. */
  leaks: string[];
  duplicateOptions: string[];
  /** Two questions of a game that quote the same source twice. */
  repeatedSources: string[];
  /** A question or option that is a list lead-in or heading ("How to find the largest number:"). */
  junk: string[];
  /** Doubled Hebrew prefixes ("ההנילוס"). */
  hebrewGlitches: string[];
  /** Fraction of choice questions a guesser gets right, versus the chance level. */
  longestOption: number;
  oddOneIn: number;
  promptOverlap: number;
  chance: number;
  /** Average number of different challenge types (choice, numeric, sequence, match) per game. */
  typesPerGame: number;
  /** Correct answer positions: share of the most common slot (chance = 1 / options). */
  maxPositionShare: number;
}

/** What a challenge asks, in one string. */
const promptOf = (c: Raw) => `${c.title} ${c.prompt}`;

export function measure(games: Built[]): Report {
  const r: Report = {
    games: games.length, challenges: 0, choices: 0, leaks: [], duplicateOptions: [], repeatedSources: [], junk: [], hebrewGlitches: [],
    longestOption: 0, oddOneIn: 0, promptOverlap: 0, chance: 0, typesPerGame: 0, maxPositionShare: 0,
  };
  let longest = 0, odd = 0, overlap = 0, chance = 0;
  const positions = new Map<number, number>();
  for (const g of games) {
    const cs = (g.raw.challenges as Raw[]).filter((c) => !String(c.id).endsWith("-easy"));
    const sources = new Map<string, number>();
    const kinds = new Set<string>();
    for (const c of cs) {
      r.challenges++;
      kinds.add(String(c.type));
      const src = norm(String(c.explanation));
      sources.set(src, (sources.get(src) ?? 0) + 1);
      const texts = [c.prompt, c.title, ...(c.options ?? []).map((o: Raw) => o.text), ...(c.items ?? []).map((i: Raw) => i.text), ...(c.pairs ?? []).flatMap((p: Raw) => [p.left, p.right])].map(String);
      for (const t of texts) {
        if (/:\s*$/.test(t.replace(/[”"״]+$/u, ""))) r.junk.push(`${g.id} ${c.id}: ${t.slice(0, 80)}`);
        if (/(?<![\p{L}])(ה{2,}|וו)(?=\p{L})/u.test(t.replace(/[^\p{L}\s]/gu, ""))) r.hebrewGlitches.push(`${g.id} ${c.id}: ${t.slice(0, 80)}`);
      }
      if (c.type === "numeric") {
        const ans = String(c.answer);
        if (new RegExp(`(^|[^\\d.])${ans.replace(".", "\\.")}([^\\d]|$)`).test(String(c.prompt).replace(/(\d),(\d{3})/g, "$1$2"))) r.leaks.push(`${g.id} ${c.id}: numeric answer ${ans} in "${String(c.prompt).slice(0, 80)}"`);
      }
      if (c.type !== "choice") continue;
      const options = c.options as { id: string; text: string }[];
      const right = options.find((o) => o.id === c.correctOptionId)!;
      const lower = options.map((o) => norm(o.text));
      if (new Set(lower).size < lower.length) r.duplicateOptions.push(`${g.id} ${c.id}`);
      if (options.length < 3) continue;
      // true/false and "which statement" questions quote the answer by design: the leak check is for gap / term / answer questions
      const quotes = /true or false|נכון או לא נכון|statement|משפט/i.test(`${c.title} ${c.prompt}`);
      const rightNorm = norm(right.text);
      if (!quotes && rightNorm.length >= 4 && ` ${norm(String(c.prompt))} `.includes(` ${rightNorm} `)) r.leaks.push(`${g.id} ${c.id}: "${right.text}" in "${String(c.prompt).slice(0, 80)}"`);
      r.choices++;
      chance += 1 / options.length;
      positions.set(options.indexOf(right), (positions.get(options.indexOf(right)) ?? 0) + 1);
      // guesser 1: the longest option (ties are split)
      const len = options.map((o) => o.text.length);
      const top = Math.max(...len);
      if (len[options.indexOf(right)] === top) longest += 1 / len.filter((x) => x === top).length;
      // guesser 2: the option that shares most words with the other options (the "odd one in")
      const ws = options.map((o) => new Set(words(o.text)));
      const score = ws.map((w, i) => ws.reduce((n, o, j) => n + (i === j ? 0 : [...w].filter((x) => o.has(x)).length), 0));
      const best = Math.max(...score);
      if (best > 0 && score[options.indexOf(right)] === best) odd += 1 / score.filter((x) => x === best).length;
      else if (best === 0) odd += 1 / options.length;
      // guesser 3: the option sharing most words with the question
      const pw = new Set(words(promptOf(c)));
      const ov = ws.map((w) => [...w].filter((x) => pw.has(x)).length);
      const bestOv = Math.max(...ov);
      if (bestOv > 0 && ov[options.indexOf(right)] === bestOv) overlap += 1 / ov.filter((x) => x === bestOv).length;
      else if (bestOv === 0) overlap += 1 / options.length;
    }
    for (const [src, n] of sources) if (n > 1 && src) r.repeatedSources.push(`${g.id}: ${n}x ${src.slice(0, 60)}`);
    r.typesPerGame += kinds.size;
  }
  r.longestOption = r.choices ? longest / r.choices : 0;
  r.oddOneIn = r.choices ? odd / r.choices : 0;
  r.promptOverlap = r.choices ? overlap / r.choices : 0;
  r.chance = r.choices ? chance / r.choices : 0;
  r.typesPerGame = games.length ? r.typesPerGame / games.length : 0;
  r.maxPositionShare = r.choices ? Math.max(...positions.values()) / r.choices : 0;
  return r;
}

export function printReport(rep: Report): string {
  const f = (n: number) => n.toFixed(3);
  return [
    `games ${rep.games}, challenges ${rep.challenges}, choice questions ${rep.choices}`,
    `leaks ${rep.leaks.length} | duplicate options ${rep.duplicateOptions.length} | repeated sources ${rep.repeatedSources.length} | junk ${rep.junk.length} | hebrew glitches ${rep.hebrewGlitches.length}`,
    `guessers (chance ${f(rep.chance)}): longest ${f(rep.longestOption)} | odd-one-in ${f(rep.oddOneIn)} | prompt-overlap ${f(rep.promptOverlap)} | max slot share ${f(rep.maxPositionShare)}`,
    `challenge types per game ${rep.typesPerGame.toFixed(2)}`,
  ].join("\n");
}
