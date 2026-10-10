/**
 * Prints the balance simulation as a table: `npx tsx scripts/balance-report.ts` (add `--json` for raw rows).
 * Deterministic: the same code and corpus always print the same numbers.
 */
import { SKILLS } from "../src/lib/game/sim-balance/bot";
import { allRows, findOutliers, median } from "../src/lib/game/sim-balance/run";

const rows = allRows();
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows.map((r) => ({ id: r.item.id, runs: r.runs })), null, 1));
  process.exit(0);
}

const groups: [string, (id: string) => boolean][] = [
  ["engine FULL", (id) => !id.startsWith("demo:") && id.includes("/FULL/")],
  ["engine FAST", (id) => !id.startsWith("demo:") && id.includes("/FAST/")],
  ["demo FULL", (id) => id.startsWith("demo:") && id.includes("/FULL/")],
  ["demo FAST", (id) => id.startsWith("demo:") && id.includes("/FAST/")],
  ["extended", (id) => id.startsWith("ext-")],
  ["fuzz", (id) => id.startsWith("fuzz-")],
];
console.log("group | skill | games | events(med) | minutes(med/max) | percent(med) | stars 0/1/2/3 | stuck | revealed(avg)");
for (const [name, test] of groups) {
  for (const s of SKILLS) {
    const runs = rows.filter((r) => test(r.item.id)).flatMap((r) => r.runs.filter((x) => x.skill === s.id));
    const stars = [0, 1, 2, 3].map((n) => runs.filter((x) => x.stars === n).length);
    console.log(
      [name, s.id, runs.length, median(runs.map((x) => x.events)), `${median(runs.map((x) => x.minutes))}/${Math.max(...runs.map((x) => x.minutes))}`,
        median(runs.map((x) => x.percent)), stars.join("/"), runs.filter((x) => x.stuck).length, (runs.reduce((n, x) => n + x.revealed, 0) / runs.length).toFixed(2)].join(" | "),
    );
  }
}
const outliers = findOutliers(rows);
console.log(`\n${rows.length} games, ${outliers.length} outlier(s)`);
for (const o of outliers) console.log(`- ${o.id}: ${o.problem}`);
