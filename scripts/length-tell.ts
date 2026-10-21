/**
 * How often the right answer of a topic's choice questions is strictly the longest option (a giveaway a test-wise player
 * learns to use), per topic and per language. The bar is 40 % per topic (tests/unit/topics.test.ts holds the collection to it).
 *
 *   npx tsx --tsconfig tsconfig.json scripts/length-tell.ts [<topic-id> ...]     (no ids: every topic, worst first)
 *   npx tsx --tsconfig tsconfig.json scripts/length-tell.ts --over 0.4           (only the topics above a share)
 *
 * Exit code 1 when a listed topic is above 40 %.
 */
import { TOPICS } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";

type Question = [string, string, string[]];
const args = process.argv.slice(2);
const overAt = args.indexOf("--over");
const over = overAt >= 0 ? Number(args[overAt + 1]) : -1;
const ids = args.filter((a, i) => !a.startsWith("--") && (overAt < 0 || i !== overAt + 1));
const BAR = 0.4;

async function main(): Promise<void> {
  const rows: { id: string; en: number; he: number; n: number }[] = [];
  for (const t of TOPICS.filter((x) => ids.length === 0 || ids.includes(x.id))) {
    const c = (await loadTopicContent(t.id)) as unknown as Record<string, { q?: [Question, Question][] }> | null;
    if (!c) continue;
    const count = [0, 0], all = [0, 0];
    for (const lv of ["b", "i", "a"]) for (const pair of c[lv]?.q ?? []) pair.forEach(([, answer, wrong], lang) => {
      all[lang]!++;
      if (answer.length > Math.max(...wrong.map((w) => w.length))) count[lang]!++;
    });
    rows.push({ id: t.id, en: count[0]! / Math.max(1, all[0]!), he: count[1]! / Math.max(1, all[1]!), n: all[0]! });
  }
  rows.sort((a, b) => Math.max(b.en, b.he) - Math.max(a.en, a.he));
  const shown = rows.filter((r) => Math.max(r.en, r.he) > over);
  for (const r of shown) console.log(`${r.id.padEnd(36)} en ${(r.en * 100).toFixed(0).padStart(3)} %  he ${(r.he * 100).toFixed(0).padStart(3)} %  (${r.n} questions)${Math.max(r.en, r.he) > BAR ? "  ABOVE 40 %" : ""}`);
  console.log(`${shown.length} of ${rows.length} topics shown`);
  if (ids.length && rows.some((r) => Math.max(r.en, r.he) > BAR)) process.exit(1);
}

void main();
