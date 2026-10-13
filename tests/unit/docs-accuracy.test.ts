import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GAME_FEATURES, PLANS, featureShare } from "@/config/plans";

/**
 * Documentation that names a command, a variable, a file or a number must keep naming real ones. These checks read the docs the
 * maintainers are told to trust (AGENTS.md, README.md, docs/*.md, mobile/README.md, supabase/README.md) and compare them with the
 * code, so a renamed script, a moved file or a changed plan limit fails a test instead of silently misleading the next person.
 */
const root = path.resolve(import.meta.dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const DOCS = ["AGENTS.md", "README.md", "docs/handover.md", "docs/play-release.md", "docs/balance.md", "mobile/README.md", "supabase/README.md"] as const;
const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

describe("documented commands exist", () => {
  it("every `npm run <script>` in the docs is a script in package.json", () => {
    const missing: string[] = [];
    for (const doc of DOCS) {
      for (const m of read(doc).matchAll(/npm run ([a-z0-9:_-]+)/g)) {
        if (!(m[1]! in pkg.scripts)) missing.push(`${doc}: npm run ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("the README's command table lists every script that a developer is expected to run", () => {
    const readme = read("README.md");
    const internal = new Set(["postinstall", "start", "test", "lint", "typecheck", "dev", "build"]); // covered by the grouped rows
    const undocumented = Object.keys(pkg.scripts).filter((s) => !internal.has(s) && !readme.includes(`npm run ${s}`));
    expect(undocumented).toEqual([]);
    for (const s of [...internal].filter((x) => x !== "postinstall")) expect(new RegExp(`npm (run )?${s}\\b`).test(readme), `README mentions npm ${s}`).toBe(true);
  });

  it("the scripts the docs name as shell helpers exist", () => {
    for (const f of ["scripts/pg-local.sh", "scripts/eval-ai.ts", "scripts/balance-report.ts", "scripts/build-unity.sh"]) expect(existsSync(path.join(root, f)), f).toBe(true);
  });
});

describe("documented configuration matches the code", () => {
  const schemaKeys = [...read("src/server/env.ts").matchAll(/^\s{2}([A-Z][A-Z0-9_]+):/gm)].map((m) => m[1]!);
  const exampleKeys = [...read(".env.example").matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]!);

  it("the environment schema was found (so the next checks are not vacuous)", () => {
    expect(schemaKeys).toEqual(expect.arrayContaining(["APP_ENV", "DATABASE_URL", "PAYMENTS_MODE", "STRIPE_WEBHOOK_SECRET", "CRON_SECRET"]));
  });

  it(".env.example sets exactly the variables the server reads", () => {
    expect([...new Set(exampleKeys)].sort()).toEqual([...schemaKeys].sort());
  });

  it("the README documents every server variable (and TEST_DATABASE_URL for the tests)", () => {
    const readme = read("README.md");
    const undocumented = [...schemaKeys, "TEST_DATABASE_URL"].filter((k) => !readme.includes(`\`${k}\``));
    expect(undocumented).toEqual([]);
  });
});

describe("documented product numbers match src/config/plans.ts", () => {
  const readme = read("README.md");
  const row = (plan: string) => readme.split("\n").find((l) => l.startsWith(`| **${plan}**`)) ?? "";

  it("the plans table shows the configured prices and game allowances", () => {
    expect(row("Free")).toContain(`**${PLANS.FREE.gamesPerPeriod}**`);
    expect(row("Plus")).toContain(`**$${PLANS.PLUS.monthlyPrices.USD! / 100} / month**`);
    expect(row("Plus")).toContain(`₪${PLANS.PLUS.monthlyPrices.ILS! / 100} / month`);
    expect(row("Plus")).toContain(`**${PLANS.PLUS.gamesPerPeriod}**`);
    expect(row("Pro")).toContain(`**$${PLANS.PRO.monthlyPrices.USD! / 100} / month**`);
    expect(row("Pro")).toContain(`**${PLANS.PRO.gamesPerPeriod}**`);
    expect(PLANS.PRO.monthlyPrices.ILS).toBeUndefined(); // the README says no shekel price is invented for Pro
  });

  it("the plan-features table shows the configured AI edit quotas and versions kept", () => {
    const features = readme.split("\n").filter((l) => /^\| \*\*(Free|Plus|Pro)\*\* \| /.test(l) && /(AI robot|level|manual edits only)/.test(l));
    expect(features).toHaveLength(3);
    for (const [plan, line] of [["FREE", features[0]!], ["PLUS", features[1]!], ["PRO", features[2]!]] as const) {
      const f = PLANS[plan].features;
      expect(line, plan).toContain(`| ${f.aiEditsPerPeriod} |`);
      expect(line, plan).toContain(`${f.versionsKept}`);
    }
    expect(readme.includes(`≤ ${15} operations per request`), "README states the level-B edit size").toBe(true);
    expect(readme.includes(`≤ ${40} operations per request`), "README states the level-A edit size").toBe(true);
  });

  it("the documented feature shares (40 / 70 / 100 %) and feature count are the computed ones", () => {
    expect([featureShare("C"), featureShare("B"), featureShare("A")]).toEqual([40, 70, 100]);
    expect(GAME_FEATURES).toHaveLength(20);
    expect(readme.includes("**Free = C (40 % of the game features), Plus = B (70 %), Pro = A (100 %)**"), "README feature shares").toBe(true);
    expect(readme.includes("The 20 features"), "README feature count").toBe(true);
  });
});

describe("documented file paths exist", () => {
  // Paths the docs mention that are produced by a build or live outside the repository on purpose.
  const GENERATED = [/^public\/unity\//, /^mobile\/dist/, /^android\/keystore\.properties$/, /^android\/app\/build\//, /^unity\/LevelUpClient\/Builds/, /^src\/generated/, /^test-results/, /^\.next/];
  const PATH = /^(?:src|tests|docs|scripts|mobile|android|supabase|prisma|unity|\.github)\/[A-Za-z0-9_.\-/\[\]()@]+$/;

  it("every repository path written in backticks in the docs points at a file or folder that exists", () => {
    const missing: string[] = [];
    let checked = 0;
    for (const doc of DOCS) {
      for (const m of read(doc).matchAll(/`([^`\n]+)`/g)) {
        const token = m[1]!.trim().replace(/:\d+(-\d+)?$/, "");
        if (!PATH.test(token) || GENERATED.some((g) => g.test(token))) continue;
        checked++;
        // a doc may name a path from the repository root or relative to its own folder (supabase/README.md says `tests/rls_checks.sql`)
        const found = existsSync(path.join(root, token)) || existsSync(path.join(root, path.dirname(doc), token));
        if (!found) missing.push(`${doc}: ${token}`);
      }
    }
    expect(checked, "the check really looked at the docs' paths").toBeGreaterThan(60);
    expect(missing).toEqual([]);
  });
});
