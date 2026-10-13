import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Repository-wide rules from AGENTS.md that no behavioural test would notice breaking:
 *  - RTL safety: components use logical Tailwind utilities (ms-/me-/ps-/pe-/start-/end-/text-start/text-end), never ml-/mr-/left-/right-.
 *  - No secrets in the client: no NEXT_PUBLIC_* variables, no secret-shaped literals, no server code pulled into client bundles.
 *  - Nothing in a game spec is executable: no eval / new Function / dangerouslySetInnerHTML anywhere.
 * They read source text only (no build), so they are fast and run in the unit project.
 */
const root = path.resolve(import.meta.dirname, "../..");
const SKIP_DIRS = new Set(["node_modules", ".next", "generated", "dist", "build", ".git", "coverage", "test-results", "playwright-report"]);

function walk(dir: string, exts: readonly string[], out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}
const rel = (f: string) => path.relative(root, f).split(path.sep).join("/");
const read = (f: string) => readFileSync(f, "utf8");
const sourceFiles = (dirs: readonly string[], exts = [".ts", ".tsx", ".css", ".mts"]) => dirs.flatMap((d) => walk(path.join(root, d), exts));

describe("RTL safety: logical Tailwind utilities only", () => {
  // Physical utilities (and the logical ones that replace them) are matched as whole class tokens, after stripping variants (md:, rtl:, hover:...).
  const SIZE = String.raw`(?:\d[\d./]*|px|auto|full|\[[^\s]*\])`;
  const PHYSICAL_TOKEN = new RegExp(
    `^(?:-?(?:ml|mr|pl|pr|left|right|scroll-ml|scroll-mr)-${SIZE}|border-[lr](?:-${SIZE})?|rounded-(?:l|r|tl|tr|bl|br)(?:-[a-z0-9]+)?|(?:text|float|clear)-(?:left|right))$`,
  );
  const physicalTokens = (text: string): string[] =>
    (text.match(/[A-Za-z0-9_:/[\].%()+,\-]+/g) ?? []).map((t) => t.replace(/^(?:[A-Za-z0-9_\-[\]&>*=]+:)+/, "")).filter((t) => PHYSICAL_TOKEN.test(t));

  // Deliberate physical anchors. Each one is a screen-coordinate position that must NOT flip in Hebrew; the reason is in the source.
  //  - Overlays.tsx GuideMarker: placed every frame with a pixel translate from the top-left corner (a logical start-0 would anchor it to the right in RTL).
  //  - Overlays.tsx joystick knob: `left-1/2` plus a -50% translate centres it, the same in both directions.
  const ALLOWED: Record<string, readonly string[]> = {
    "src/components/game/hud/Overlays.tsx": ["left-0", "left-1/2"],
  };

  it("no component or page uses ml-/mr-/pl-/pr-/left-/right-/border-l/border-r/rounded-l/rounded-r/text-left/text-right outside the documented allow-list", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(["src/components", "src/app", "mobile/src"], [".tsx", ".css"])) {
      const allowed = ALLOWED[rel(file)] ?? [];
      const lines = read(file).split("\n");
      lines.forEach((line, i) => {
        // ignore whole-line comments: they talk about the rule
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const token of physicalTokens(line)) {
          if (allowed.includes(token)) continue;
          offenders.push(`${rel(file)}:${i + 1}  ${token}`);
        }
      });
    }
    expect(offenders, "use ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e/rounded-s/rounded-e instead").toEqual([]);
  });

  it("the matcher itself catches what it should and leaves logical utilities alone", () => {
    const hits = physicalTokens;
    expect(hits('className="ml-2 mr-4 pl-3 pr-px -ml-1 left-0 right-2 text-left text-right border-l border-r-2 rounded-l-lg rounded-tr float-left"')).toEqual([
      "ml-2", "mr-4", "pl-3", "pr-px", "-ml-1", "left-0", "right-2", "text-left", "text-right", "border-l", "border-r-2", "rounded-l-lg", "rounded-tr", "float-left",
    ]);
    expect(hits('className="ms-2 me-4 ps-3 pe-3 start-0 end-2 text-start text-end border-s border-e-2 rounded-s-lg rounded-ee flex-row-reverse"')).toEqual([]);
    expect(hits('className="md:ml-2 rtl:-mr-1 hover:left-[calc(50%+2px)]"')).toEqual(["ml-2", "-mr-1", "left-[calc(50%+2px)]"]);
    expect(hits('className="left-to-right text-left-aligned border-light"')).toEqual([]); // words, not utilities
  });
});

describe("RTL and bidi: directional glyphs and text fields", () => {
  // Arrows are direction-dependent: they must come from the Arrow component (rtl:-scale-x-100), never typed into a string or JSX.
  const ARROW_HOME = new Set(["src/components/ui/index.tsx"]);
  const UI_FILES = () => sourceFiles(["src/components", "src/app", "mobile/src"], [".ts", ".tsx"]);

  it("no arrow glyph (→ ← ↔ ⇒ …) in UI code outside the Arrow component (comments excepted)", () => {
    const offenders: string[] = [];
    for (const f of UI_FILES()) {
      if (ARROW_HOME.has(rel(f))) continue;
      read(f).split("\n").forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // doc comments talk about the glyphs
        const code = line.replace(/\/\/.*$/, "");
        if (/[←-⇿⟵-⟷]/.test(code)) offenders.push(`${rel(f)}:${i + 1}`);
      });
    }
    expect(offenders, "use <Arrow /> or <Arrow back />").toEqual([]);
  });

  it("every text field states its direction: dir=\"auto\" (the Input/Textarea wrappers default to it) or dir=\"ltr\" for codes and e-mail", () => {
    // Checkboxes, radios, sliders and file pickers hold no text, so they are exempt.
    const NON_TEXT = /type="(?:checkbox|radio|range|file)"/;
    const offenders: string[] = [];
    for (const f of UI_FILES()) {
      const text = read(f);
      for (const m of text.matchAll(/<(input|textarea)\b/g)) {
        const window = text.slice(m.index!, m.index! + 600);
        const tagEnd = window.search(/\/>|<\/textarea>/);
        const tag = tagEnd === -1 ? window : window.slice(0, tagEnd);
        if (!/\bdir=/.test(tag) && !NON_TEXT.test(tag)) offenders.push(`${rel(f)}: ${tag.split("\n")[0]!.trim().slice(0, 80)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the Arrow component mirrors in RTL and points back in the back direction", () => {
    const ui = read(path.join(root, "src/components/ui/index.tsx"));
    expect(ui).toMatch(/back \? "←" : "→"\}<\/span>|back \? "←" : "→"/);
    expect(ui).toMatch(/rtl:-scale-x-100/);
  });
});

describe("no secrets and no server code in the client", () => {
  it("there are no NEXT_PUBLIC_ variables in code, config or .env.example (nothing secret can reach the browser)", () => {
    const files = [
      ...sourceFiles(["src", "mobile/src", "scripts"], [".ts", ".tsx", ".mts", ".sh"]),
      ...["next.config.ts", "capacitor.config.ts", "prisma.config.ts", "playwright.config.ts", "mobile/vite.config.mts", "mobile/playwright.config.ts"].map((f) => path.join(root, f)),
    ];
    const offenders = files.filter((f) => /NEXT_PUBLIC_/.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
    const envLines = read(path.join(root, ".env.example")).split("\n").filter((l) => !l.trim().startsWith("#"));
    expect(envLines.filter((l) => /NEXT_PUBLIC_/.test(l))).toEqual([]);
  });

  it(".env.example holds no real-looking secret: every secret-bearing variable is empty", () => {
    const vars = Object.fromEntries(
      read(path.join(root, ".env.example")).split("\n").filter((l) => /^[A-Z][A-Z0-9_]*=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
    );
    for (const name of ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "CRON_SECRET"]) expect(vars[name], name).toBe("");
    // the safe defaults an operator gets if they change nothing
    expect(vars.PAYMENTS_MODE).toBe("disabled");
    expect(vars.ENABLE_TEST_HOOKS).toBe("false");
    expect(vars.APP_ENV).toBe("local");
  });

  it("no source file contains a secret-shaped literal (live Stripe key, Anthropic key, webhook secret, private key, service-role JWT)", () => {
    const SECRET_SHAPES: [string, RegExp][] = [
      ["Stripe live key", /\b[sr]k_live_[A-Za-z0-9]{10,}/],
      ["Stripe test key with real entropy", /\b[sr]k_test_[A-Za-z0-9]{20,}/],
      ["Stripe webhook secret", /\bwhsec_[A-Za-z0-9]{24,}/],
      ["Anthropic key", /\bsk-ant-[A-Za-z0-9_-]{20,}/],
      ["OpenAI-style key", /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/],
      ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
      ["AWS access key id", /\bAKIA[0-9A-Z]{16}\b/],
      ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{10,}/],
      ["JWT (a Supabase service-role key is one)", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
    ];
    const files = sourceFiles(["src", "mobile", "scripts", "supabase", "android/app/src", "tests"], [".ts", ".tsx", ".mts", ".js", ".mjs", ".java", ".xml", ".gradle", ".sql", ".json", ".html", ".sh", ".md"]);
    files.push(...["capacitor.config.ts", ".env.example", "docker-compose.yml"].map((f) => path.join(root, f)));
    const offenders: string[] = [];
    for (const f of files) {
      const text = read(f);
      for (const [label, re] of SECRET_SHAPES) if (re.test(text)) offenders.push(`${rel(f)}: ${label}`);
    }
    expect(offenders).toEqual([]);
  });

  it("the only key shipped in the Android app is Supabase's *publishable* key", () => {
    const cfg = read(path.join(root, "mobile/src/cloud/config.ts"));
    expect(cfg).toMatch(/SUPABASE_PUBLISHABLE_KEY = "sb_publishable_[A-Za-z0-9_-]+"/);
    expect(cfg).not.toMatch(/service_role|sb_secret_|eyJ/);
    // and nothing else in the app reads a key from the environment
    for (const f of sourceFiles(["mobile/src"], [".ts", ".tsx"])) {
      const text = read(f);
      expect(text, rel(f)).not.toMatch(/process\.env|STRIPE_|ANTHROPIC_|OPENAI_/);
    }
  });

  it("shared code (src/lib, the offline app) never imports server code; client components only import its types", () => {
    const serverImport = /(?:from\s+|import\s*\(\s*|require\(\s*)["'](?:@\/server\/|server-only|\.\.?\/(?:\.\.\/)*server\/)/;
    const offenders: string[] = [];
    for (const f of sourceFiles(["src/lib", "mobile/src", "src/config"], [".ts", ".tsx"])) if (serverImport.test(read(f))) offenders.push(rel(f));
    for (const f of sourceFiles(["src/components", "src/app"], [".ts", ".tsx"])) {
      const text = read(f);
      if (!/^\s*["']use client["']/m.test(text)) continue; // server components may import server code
      for (const line of text.split("\n")) {
        if (!/from\s+["']@\/server\//.test(line) && !/from\s+["']server-only["']/.test(line)) continue;
        if (!/^\s*import\s+type\b/.test(line)) offenders.push(`${rel(f)}: ${line.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("client components never read process.env (only the server's env module and routes may)", () => {
    const offenders: string[] = [];
    for (const f of sourceFiles(["src/components", "src/lib", "src/config"], [".ts", ".tsx"])) {
      const text = read(f);
      const isClient = /^\s*["']use client["']/m.test(text) || f.includes(`${path.sep}src${path.sep}lib${path.sep}`) || f.includes(`${path.sep}src${path.sep}config${path.sep}`);
      if (isClient && /process\.env\.(?!NODE_ENV\b)/.test(text)) offenders.push(rel(f));
    }
    expect(offenders).toEqual([]);
  });

  it("every file that reads server secrets is server-only", () => {
    const files = sourceFiles(["src/server"], [".ts"]).filter((f) => /process\.env/.test(read(f)));
    // db.ts and env.ts are the only places that may touch process.env directly; both import server-only.
    for (const f of files) expect(read(f), rel(f)).toMatch(/import\s+["']server-only["']/);
  });

  it(".env files are never tracked by git (only .env.example)", () => {
    let tracked: string[];
    try {
      tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n");
    } catch {
      return; // not a git checkout (e.g. a source tarball): nothing to check
    }
    expect(tracked.filter((f) => /(^|\/)\.env(\..+)?$/.test(f) && !f.endsWith(".env.example"))).toEqual([]);
    expect(tracked.filter((f) => /keystore\.properties$|\.jks$|\.keystore$/.test(f))).toEqual([]);
  });
});

describe("nothing executable in the code base", () => {
  it("no eval, new Function, dangerouslySetInnerHTML or string timers in app code", () => {
    const BAD = /\beval\s*\(|new\s+Function\s*\(|dangerouslySetInnerHTML|\bset(?:Timeout|Interval)\s*\(\s*["'`]/;
    const offenders = sourceFiles(["src", "mobile/src"], [".ts", ".tsx"]).filter((f) => BAD.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });
});
