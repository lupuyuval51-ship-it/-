/**
 * Checks topic-library content files before they are added to the catalogue (the same rules as tests/unit/topics.test.ts,
 * plus the stricter quality bar new topics are written to). For a topic factory: writers run it on their own topics.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/check-topics.ts [--plan plan.json] <topic-id> [...]
 *   npx tsx --tsconfig tsconfig.json scripts/check-topics.ts --plan plan.json --all
 *
 * A topic is read from src/lib/game/topics/content/<id>.ts; its catalogue row comes from the catalogue or, for a topic not
 * listed yet, from the plan (a JSON array of catalogue rows). Every level × language is built FAST and FULL at tier A,
 * then at tiers B and C on a phone, validated and played through. Exit code 1 when anything fails.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { DIFFICULTIES, SPEC_LIMITS, type Difficulty } from "@/lib/game/spec/constants";
import { fitForDevice } from "@/lib/game/spec/device";
import type { GameSpec } from "@/lib/game/spec/schema";
import { clampToFeatureTier } from "@/lib/game/spec/tier";
import { normalizeRawSpec, validateGameSpec } from "@/lib/game/spec/validate";
import { playThrough } from "@/lib/game/world/flow";
import { findTopic, TOPICS } from "@/lib/game/topics/catalog";
import { buildTopicSpec, topicRequest } from "@/lib/game/topics/build";
import { TOPIC_CATEGORIES, type LevelContent, type TopicContent, type TopicEntry } from "@/lib/game/topics/types";
import type { FeatureTier } from "@/config/plans";
import type { GenerationRequest } from "@/lib/schemas/generation";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const planAt = args.indexOf("--plan");
const plan: TopicEntry[] = planAt >= 0 ? JSON.parse(readFileSync(args[planAt + 1]!, "utf8")) : [];
const ids = args.includes("--all") ? plan.map((t) => t.id) : args.filter((a, i) => !a.startsWith("--") && (planAt < 0 || i !== planAt + 1));

const HEBREW = /\p{Script=Hebrew}/u;
const LETTER = /\p{L}/u;
const CONTROL = /[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/;
const LEVELS = ["b", "i", "a"] as const;
const sameKey = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, " ").trim();
const namesTerm = (text: string, term: string) => {
  const esc = sameKey(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}])(?:[והבלמשכ]{0,2})${esc}(?![\\p{L}])`, "u").test(sameKey(text));
};

function textsOf(level: LevelContent): { en: string[]; he: string[] } {
  const en: string[] = [], he: string[] = [];
  for (const [a, b, , d] of level.t ?? []) { en.push(a, b); he.push(d); }
  for (const [e, h] of level.q ?? []) { en.push(e[0], e[1], ...e[2], e[3], ...(e[4] ? [e[4]] : [])); he.push(h[0], h[3], ...(h[4] ? [h[4]] : [])); }
  for (const [, e, h] of level.n ?? []) { en.push(e[0], e[2], ...(e[3] ? [e[3]] : []), ...(e[1] ? [e[1]] : [])); he.push(h[0], h[2], ...(h[3] ? [h[3]] : []), ...(h[1] ? [h[1]] : [])); }
  for (const [e, h] of level.s ?? []) { en.push(...e); he.push(...h); }
  return { en, he };
}

function checkEntry(t: TopicEntry, errs: string[]) {
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(t.id)) errs.push(`id "${t.id}" is not a safe id`);
  if (!(TOPIC_CATEGORIES as readonly string[]).includes(t.cat)) errs.push(`unknown category ${t.cat}`);
  for (const [title, desc] of [t.en, t.he]) {
    if (title.trim().length <= 2 || title.length > 60) errs.push(`title length: "${title}"`);
    if (desc.trim().length <= 15 || desc.length > 200) errs.push(`description length: "${desc}"`);
  }
  if (!HEBREW.test(t.he[0]) || !HEBREW.test(t.he[1])) errs.push("Hebrew title/description must be Hebrew");
  if (HEBREW.test(t.en[0]) || HEBREW.test(t.en[1])) errs.push("English title/description has Hebrew");
  if (!(t.ages[0] >= 6 && t.ages[1] <= 18 && t.ages[0] < t.ages[1])) errs.push(`ages ${t.ages}`);
}

function checkContent(t: TopicEntry, c: TopicContent, errs: string[]) {
  for (const l of LEVELS) {
    const lv = c[l];
    if (!lv) { errs.push(`level ${l} missing`); continue; }
    const terms = lv.t?.length ?? 0;
    const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
    if (terms + items < 8) errs.push(`${l}: only ${terms + items} items (need 8+)`);
    if (items < 4) errs.push(`${l}: only ${items} questions/numbers/orderings (need 4+)`);
    const { en, he } = textsOf(lv);
    for (const s of [...en, ...he]) {
      if (!s.trim()) errs.push(`${l}: empty string`);
      if (CONTROL.test(s)) errs.push(`${l}: control or bidi character in "${s}"`);
    }
    if (!t.id.startsWith("lang-he-")) for (const s of en) if (HEBREW.test(s)) errs.push(`${l} en has Hebrew: "${s}"`);
    for (const s of he) if (LETTER.test(s.replace(/[A-Za-z]+/g, (w) => (w.length <= 6 ? "" : w))) && !HEBREW.test(s)) errs.push(`${l} he is not Hebrew: "${s}"`);
    for (const s of he) if (/[<>]/.test(s)) errs.push(`${l} he uses < or > (mirrored in RTL): "${s}"`);
    for (const pair of lv.q ?? []) {
      for (const [q, answer, wrong, explanation] of pair) {
        const keys = [answer, ...wrong].map((o) => o.trim().toLowerCase().replace(/\s+/g, " "));
        if (new Set(keys).size !== keys.length) errs.push(`${l}: options repeat or the answer is a wrong option: ${q}`);
        if (wrong.length < 1 || wrong.length > 4) errs.push(`${l}: 1–4 wrong options: ${q}`);
        if (q.length > 600 || explanation.length > 600) errs.push(`${l}: question/explanation too long: ${q}`);
        if (explanation.length < 40) errs.push(`${l}: explanation shorter than 40 characters: ${q}`);
        for (const o of [answer, ...wrong]) if (o.length > 220) errs.push(`${l}: option longer than 220: ${o}`);
      }
      if (pair[0][2].length !== pair[1][2].length) errs.push(`${l}: en/he wrong-option counts differ: ${pair[0][0]}`);
    }
    for (const [answer, en, he, tol] of lv.n ?? []) {
      if (!Number.isFinite(answer)) errs.push(`${l}: numeric answer not finite`);
      if ((tol ?? 0) < 0) errs.push(`${l}: negative tolerance`);
      if (Boolean(en[1]) !== Boolean(he[1])) errs.push(`${l}: unit in one language only: ${en[0]}`);
      if (en[1].length > 12 || he[1].length > 12) errs.push(`${l}: unit longer than 12: ${en[0]}`);
      const written = [String(answer), answer.toLocaleString("en-US")];
      for (const [lang, text] of [["en", en[2]], ["he", he[2]]] as const) if (!written.some((w) => text.includes(w))) errs.push(`${l} ${lang}: the answer ${answer} is not in its explanation: ${en[0]}`);
      for (const text of [en[2], he[2]]) if (text.length < 40) errs.push(`${l}: numeric explanation shorter than 40: ${en[0]}`);
    }
    for (const [en, he] of lv.s ?? []) {
      if (en.length !== he.length) errs.push(`${l}: ordering step counts differ: ${en[0]}`);
      if (en.length - 1 < 3 || en.length - 1 > 6) errs.push(`${l}: ordering needs 3–6 steps: ${en[0]}`);
      for (const steps of [en.slice(1), he.slice(1)]) {
        if (new Set(steps.map(sameKey)).size !== steps.length) errs.push(`${l}: repeated ordering step: ${en[0]}`);
        for (const s of steps) if (s.length > 180) errs.push(`${l}: ordering step longer than 180: ${s}`);
      }
    }
  }
  const allTerms = LEVELS.flatMap((l) => c[l]?.t ?? []);
  for (const [en, enM, he, heM] of allTerms) {
    if (namesTerm(enM, en)) errs.push(`term meaning names its term: ${en}`);
    if (namesTerm(heM, he)) errs.push(`term meaning names its term: ${he}`);
    if (en.length > 60 || he.length > 60 || enM.length > 140 || heM.length > 140) errs.push(`term or meaning too long: ${en}`);
  }
  for (const i of [0, 1, 2, 3]) {
    const keys = allTerms.map((x) => sameKey(x[i]!));
    if (new Set(keys).size !== keys.length) errs.push("duplicate term or meaning in the topic");
  }
  for (const lang of [0, 1] as const) {
    const prompts = LEVELS.flatMap((l) => [...(c[l]?.q ?? []).map((p) => p[lang][0]), ...(c[l]?.n ?? []).map((n) => n[lang + 1 as 1 | 2][0])]).map((s) => s.toLowerCase().replace(/\s+/g, " ").replace(/[.?!:,;״"“”]+/g, "").trim());
    if (new Set(prompts).size !== prompts.length) errs.push(`duplicate question (${lang ? "he" : "en"})`);
    let all = 0, longest = 0;
    for (const l of LEVELS) for (const pair of c[l]?.q ?? []) { const [, a, w] = pair[lang]; all++; if (a.length > Math.max(...w.map((x) => x.length))) longest++; }
    if (all && longest / all > 0.4) errs.push(`the right answer is the longest option in ${Math.round((100 * longest) / all)} % of the ${lang ? "Hebrew" : "English"} questions (at most 40 %): lengthen some wrong options`);
  }
}

const applyRequest = (raw: unknown, req: GenerationRequest, language: string) => {
  const { value } = normalizeRawSpec(raw);
  if (value && typeof value === "object") {
    const v = value as { meta?: Record<string, unknown> };
    v.meta = { ...(v.meta ?? {}), subject: req.subject, difficulty: req.difficulty, gameType: req.gameType, language };
  }
  return value;
};

/** The offline generator's path for a topic (generateOffline needs the topic in the catalogue; a planned one is not yet). */
function build(entry: TopicEntry, c: TopicContent, difficulty: Difficulty, lang: "he" | "en", mode: "FAST" | "FULL", tier: FeatureTier, gameType: GenerationRequest["gameType"], phone: boolean): GameSpec {
  const req = topicRequest({ mode, subject: "x", learningGoal: "x", difficulty, gameType, contentLanguage: lang, topicId: undefined, device: phone ? "phone" : undefined } as GenerationRequest, entry);
  const built = buildTopicSpec(req, entry, c);
  const res = validateGameSpec(applyRequest(built.raw, req, (built.raw.meta as { language: string }).language), { alignGameType: req.gameType });
  if (!res.ok) throw new Error(`invalid: ${res.errors.slice(0, 3).join("; ")}`);
  const boss = mode === "FULL" ? addFinalBoss(res.spec) : { spec: res.spec };
  const tiered = clampToFeatureTier(boss.spec, tier);
  if (!tiered.ok) throw new Error(`tier ${tier}: ${tiered.errors.slice(0, 3).join("; ")}`);
  return phone ? fitForDevice(tiered.spec, "phone").spec : tiered.spec;
}

function checkGame(spec: GameSpec, label: string, errs: string[]) {
  const ids = spec.challenges.map((ch) => ch.id);
  if (new Set(ids).size !== ids.length) errs.push(`${label}: duplicate challenge ids`);
  if (spec.challenges.length > SPEC_LIMITS.challenges) errs.push(`${label}: too many challenges`);
  if (!playThrough(spec).finished) errs.push(`${label}: cannot be finished`);
}

async function main(): Promise<number> {
let failed = 0;
for (const id of ids) {
  const errs: string[] = [];
  const entry = findTopic(id) ?? plan.find((t) => t.id === id);
  const file = path.join(root, "src/lib/game/topics/content", `${id}.ts`);
  if (!entry) errs.push("not in the catalogue or the plan");
  if (!existsSync(file)) errs.push(`missing file ${path.relative(root, file)}`);
  if (entry && existsSync(file)) {
    checkEntry(entry, errs);
    if (!findTopic(id) && TOPICS.some((t) => sameKey(t.en[0]) === sameKey(entry.en[0]) || sameKey(t.he[0]) === sameKey(entry.he[0]))) errs.push("a catalogue topic already has this title");
    try {
      const c = ((await import(pathToFileURL(file).href)) as { default: TopicContent }).default;
      checkContent(entry, c, errs);
      for (const d of DIFFICULTIES) {
        for (const lang of ["en", "he"] as const) {
          try {
            checkGame(build(entry, c, d, lang, "FAST", "A", "adventure", false), `${d}/${lang}/FAST`, errs);
            const full = build(entry, c, d, lang, "FULL", "A", "adventure", false);
            checkGame(full, `${d}/${lang}/FULL`, errs);
            if (full.areas.length !== 2) errs.push(`${d}/${lang}/FULL: needs enough content for two areas (6+ challenges)`);
            checkGame(build(entry, c, d, lang, "FULL", "B", "platformer", true), `${d}/${lang}/B`, errs);
            const cc = build(entry, c, d, lang, "FAST", "C", "exploration", true);
            checkGame(cc, `${d}/${lang}/C`, errs);
            if (cc.challenges.length < 3) errs.push(`${d}/${lang}/C: fewer than 3 challenges`);
          } catch (e) {
            errs.push(`${d}/${lang}: ${(e as Error).message}`);
          }
        }
      }
    } catch (e) {
      errs.push(`cannot load: ${(e as Error).message}`);
    }
  }
  if (errs.length) { failed++; console.log(`✗ ${id}\n  - ${[...new Set(errs)].slice(0, 25).join("\n  - ")}`); }
  else console.log(`✓ ${id}`);
}
console.log(`\n${ids.length - failed}/${ids.length} topics pass`);
return failed;
}

void main().then((failed) => process.exit(failed ? 1 : 0));
