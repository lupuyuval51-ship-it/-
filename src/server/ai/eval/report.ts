import type { CaseResult } from "./run";

export interface GroupStats {
  n: number;
  /** Share of cases that produced an accepted game (or edit) AND passed every post-check. */
  successRate: number;
  /** Of the successful ones, the share that needed no repair round. */
  zeroRepairRate: number;
  avgRepairs: number;
  avgCalls: number;
  p50Ms: number;
  p95Ms: number;
  inputTokens: number;
  outputTokens: number;
  /** Total cost in USD when prices were given, otherwise null. */
  costUsd: number | null;
  /** Cost per successful result, when prices were given. */
  costPerSuccessUsd: number | null;
  errors: Record<string, number>;
  failedChecks: Record<string, number>;
}

export interface Prices {
  /** USD per million tokens. */
  inputPerM: number;
  outputPerM: number;
}

export interface Report {
  label: string;
  model: string;
  createdAt: string;
  overall: GroupStats;
  groups: Record<string, GroupStats>;
  results: CaseResult[];
}

const percentile = (sorted: number[], p: number): number => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]! : 0);
const round = (n: number, d = 3): number => Math.round(n * 10 ** d) / 10 ** d;

export function statsOf(rs: CaseResult[], prices?: Prices): GroupStats {
  const ok = rs.filter((r) => r.ok);
  const ms = rs.map((r) => r.ms).sort((a, b) => a - b);
  const inputTokens = rs.reduce((n, r) => n + r.inputTokens, 0);
  const outputTokens = rs.reduce((n, r) => n + r.outputTokens, 0);
  const costUsd = prices ? (inputTokens * prices.inputPerM + outputTokens * prices.outputPerM) / 1_000_000 : null;
  const errors: Record<string, number> = {};
  const failedChecks: Record<string, number> = {};
  for (const r of rs) {
    if (!r.ok && r.errorCode) errors[r.errorCode] = (errors[r.errorCode] ?? 0) + 1;
    for (const f of r.failedChecks) failedChecks[f] = (failedChecks[f] ?? 0) + 1;
  }
  return {
    n: rs.length,
    successRate: rs.length ? round(ok.length / rs.length) : 0,
    zeroRepairRate: ok.length ? round(ok.filter((r) => r.repairs === 0).length / ok.length) : 0,
    avgRepairs: rs.length ? round(rs.reduce((n, r) => n + r.repairs, 0) / rs.length) : 0,
    avgCalls: rs.length ? round(rs.reduce((n, r) => n + r.calls, 0) / rs.length, 2) : 0,
    p50Ms: percentile(ms, 0.5),
    p95Ms: percentile(ms, 0.95),
    inputTokens, outputTokens,
    costUsd: costUsd === null ? null : round(costUsd, 4),
    costPerSuccessUsd: costUsd === null || !ok.length ? null : round(costUsd / ok.length, 4),
    errors, failedChecks,
  };
}

export function buildReport(label: string, results: CaseResult[], prices?: Prices): Report {
  const groups: Record<string, GroupStats> = {};
  const add = (key: string, pick: (r: CaseResult) => boolean) => { const rs = results.filter(pick); if (rs.length) groups[key] = statsOf(rs, prices); };
  for (const kind of ["generate", "edit"] as const) add(`kind:${kind}`, (r) => r.kind === kind);
  for (const tier of ["A", "B", "C"] as const) add(`tier:${tier}`, (r) => r.tier === tier);
  for (const lang of ["he", "en"]) add(`lang:${lang}`, (r) => r.language === lang);
  for (const mode of ["FAST", "FULL", "EDIT"]) add(`mode:${mode}`, (r) => r.mode === mode);
  return { label, model: results.find((r) => r.model)?.model ?? "n/a", createdAt: new Date().toISOString(), overall: statsOf(results, prices), groups, results };
}

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

export function formatReport(r: Report): string {
  const lines = [`${r.label}  (model: ${r.model})`, "group | n | success | no-repair | repairs/case | calls/case | p50 s | p95 s | tokens in/out | cost $ | $/success"];
  const row = (name: string, s: GroupStats) =>
    [name, s.n, pct(s.successRate), pct(s.zeroRepairRate), s.avgRepairs, s.avgCalls, (s.p50Ms / 1000).toFixed(1), (s.p95Ms / 1000).toFixed(1), `${s.inputTokens}/${s.outputTokens}`, s.costUsd ?? "-", s.costPerSuccessUsd ?? "-"].join(" | ");
  lines.push(row("overall", r.overall));
  for (const [k, s] of Object.entries(r.groups)) lines.push(row(k, s));
  const errs = Object.entries(r.overall.errors);
  if (errs.length) lines.push("", `errors: ${errs.map(([k, v]) => `${k}×${v}`).join(", ")}`);
  const checks = Object.entries(r.overall.failedChecks);
  if (checks.length) lines.push(`failed checks: ${checks.map(([k, v]) => `${k}×${v}`).join(", ")}`);
  return lines.join("\n");
}

/** Side-by-side deltas (b minus a) for the numbers that decide whether a model can replace another. */
export function compareReports(a: Report, b: Report): string {
  const d = (x: number, y: number, pctMode = false) => (pctMode ? `${pct(x)} → ${pct(y)}` : `${x} → ${y}`);
  const lines = [`${a.label} (${a.model})  vs  ${b.label} (${b.model})`, "group | success | no-repair | repairs/case | p95 s | $/success"];
  const keys = ["overall", ...Object.keys(a.groups).filter((k) => k in b.groups)];
  for (const k of keys) {
    const sa = k === "overall" ? a.overall : a.groups[k]!;
    const sb = k === "overall" ? b.overall : b.groups[k]!;
    lines.push([k, d(sa.successRate, sb.successRate, true), d(sa.zeroRepairRate, sb.zeroRepairRate, true), d(sa.avgRepairs, sb.avgRepairs), d(+(sa.p95Ms / 1000).toFixed(1), +(sb.p95Ms / 1000).toFixed(1)), d(sa.costPerSuccessUsd ?? 0, sb.costPerSuccessUsd ?? 0)].join(" | "));
  }
  return lines.join("\n");
}
