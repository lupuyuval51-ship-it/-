/**
 * Measures an AI model on the fixed evaluation set, through the real generation pipeline and edit engine.
 *
 *   npm run eval:ai -- --dry                       list the cases, no model calls, no cost
 *   npm run eval:ai -- --yes --label deepseek      run against the backend configured by the AI_* / OPENAI_* / ANTHROPIC_* env vars
 *   npm run eval:ai -- --compare a.json b.json     compare two saved reports
 *
 * A real run SPENDS MONEY at the provider, so it needs --yes. Options: --generate N (default 70) --edit N (default 30)
 * --concurrency N (default 2) --deadline-ms N (per case, default 600000) --call-timeout-ms N (per model call, default 240000) --out file.json --price-in USD --price-out USD (per million tokens, for the cost columns).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildCases } from "../src/server/ai/eval/cases";
import { buildReport, compareReports, formatReport, type Prices, type Report } from "../src/server/ai/eval/report";
import { runEval } from "../src/server/ai/eval/run";

// The evaluation never touches the database, but the shared env loader insists on a URL: give it an unused one.
process.env.DATABASE_URL ??= "postgresql://eval:eval@127.0.0.1:1/eval";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const num = (name: string, fallback: number): number => {
  const v = value(name);
  const n = v === undefined ? fallback : Number(v);
  if (!Number.isFinite(n) || n < 0) { console.error(`--${name} must be a non-negative number`); process.exit(2); }
  return n;
};

async function main(): Promise<void> {
  if (flag("compare")) {
    const i = args.indexOf("--compare");
    const [fa, fb] = [args[i + 1], args[i + 2]];
    if (!fa || !fb) { console.error("usage: --compare a.json b.json"); process.exit(2); }
    console.log(compareReports(JSON.parse(readFileSync(fa, "utf8")) as Report, JSON.parse(readFileSync(fb, "utf8")) as Report));
    return;
  }

  const cases = buildCases({ generate: num("generate", 70), edit: num("edit", 30) });
  if (flag("dry")) {
    for (const c of cases) console.log(c.kind === "generate" ? `${c.id} tier ${c.tier} ${c.request.mode} ${c.request.gameType} ${c.request.contentLanguage} "${c.request.subject}"` : `${c.id} tier ${c.tier} EDIT(${c.level}) ${c.base.gameType} ${c.base.contentLanguage} "${c.instruction}"`);
    console.log(`\n${cases.length} cases (dry run: no model was called)`);
    return;
  }

  const { getBackend } = await import("../src/server/ai/registry");
  const backend = getBackend();
  if (backend.type !== "llm") { console.error(`The configured backend is "${backend.info.id}" (${backend.type}), not a language model. Set AI_PROVIDER and the provider's key/model first.`); process.exit(2); }
  if (!flag("yes")) { console.error(`This runs ${cases.length} cases against ${backend.info.id} / ${backend.info.model} and spends real money. Add --yes to continue (or --dry to only list the cases).`); process.exit(2); }

  const priceIn = value("price-in");
  const priceOut = value("price-out");
  const prices: Prices | undefined = priceIn && priceOut ? { inputPerM: Number(priceIn), outputPerM: Number(priceOut) } : undefined;
  const label = value("label") ?? backend.info.model;
  console.log(`Running ${cases.length} cases on ${backend.info.id} / ${backend.info.model} ...`);
  const results = await runEval(cases, {
    backend, concurrency: num("concurrency", 2), deadlineMs: num("deadline-ms", 600_000), callTimeoutMs: num("call-timeout-ms", 240_000),
    onResult: (r, done, total) => console.log(`[${done}/${total}] ${r.id} ${r.ok ? "ok" : `FAIL ${r.errorCode}${r.failedChecks.length ? ` (${r.failedChecks.join(",")})` : ""}`} repairs=${r.repairs} ${(r.ms / 1000).toFixed(1)}s`),
  });
  const report = buildReport(label, results, prices);
  const out = value("out") ?? `eval-${label.replace(/[^a-z0-9._-]+/gi, "_")}.json`;
  writeFileSync(out, JSON.stringify(report, null, 1));
  console.log(`\n${formatReport(report)}\n\nSaved ${out}`);
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
