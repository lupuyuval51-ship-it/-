import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * "Signed out, the app makes no network request" and "only the account project and LEVEL UP AI are ever contacted" are rules of the
 * Android app (AGENTS.md). They hold because only a few files can make a request at all. This reads the sources and fails when a new
 * file starts to, so the change is looked at on purpose (the CSP, the privacy policy and the Data safety answers follow from it).
 */
const root = path.resolve(import.meta.dirname, "../..");

function sources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sources(rel));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel);
  }
  return out.sort();
}
/** The code of a file, without comments (a comment may talk about `fetch` all it likes). */
const code = (rel: string): string => fs.readFileSync(path.join(root, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");

const APP_FILES = [...sources("mobile/src"), ...sources("src/lib/offline")];

describe("what can reach the network in the offline app", () => {
  const PRIMITIVES = /\bfetch\b|\bXMLHttpRequest\b|\bsendBeacon\b|\bnew\s+WebSocket\b|\bEventSource\b|\bimportScripts\b/;
  // the delete-account call, LEVEL UP AI, and the check of Supabase's public settings: each only after a tap or a required sign-in
  const ALLOWED = ["mobile/src/cloud/account.ts", "mobile/src/cloud/ai.ts", "mobile/src/cloud/google.ts"];

  it("only the three cloud files use a network primitive; everything else in the app and the offline library cannot", () => {
    const using = APP_FILES.filter((f) => PRIMITIVES.test(code(f)));
    expect(using).toEqual(ALLOWED);
  });

  it("each of them takes its address from the configuration (or the caller), never from a literal of its own", () => {
    for (const f of ALLOWED) {
      const text = code(f);
      expect(text, f).not.toMatch(/["'`]https?:\/\//);
    }
    expect(code("mobile/src/cloud/ai.ts")).toContain("${AI_URL}/functions/v1/generate-game");
    expect(code("mobile/src/cloud/account.ts")).toContain("${SUPABASE_URL}/functions/v1/delete-account");
  });

  it("the cloud library (about 200 kB) is only ever imported lazily, so a phone without an account never loads it", () => {
    const eager = /^\s*import\s+(?!type\b)[^;]*?from\s+["']@supabase\/supabase-js["']|require\(\s*["']@supabase\/supabase-js["']\s*\)/m;
    const everywhere = [...APP_FILES, ...sources("src")];
    for (const f of everywhere) expect(fs.readFileSync(path.join(root, f), "utf8"), f).not.toMatch(eager);
    const lazy = everywhere.filter((f) => /import\(\s*["']@supabase\/supabase-js["']\s*\)/.test(code(f)));
    expect(lazy).toEqual(["mobile/src/cloud/client.ts"]);
  });
});
