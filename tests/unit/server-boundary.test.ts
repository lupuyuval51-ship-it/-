import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/** Static guards for "no secrets in the client" and the web security headers (the Android shell has its own CSP test). */
const ROOT = path.resolve(import.meta.dirname, "../..");

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "generated" || name === "node_modules") continue;
      sources(full, out);
    } else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

const files = sources(path.join(ROOT, "src")).map((f) => ({ rel: path.relative(ROOT, f).split(path.sep).join("/"), text: readFileSync(f, "utf8") }));

describe("secrets stay on the server", () => {
  const SECRET_NAMES = /OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|CRON_SECRET|DATABASE_URL/;

  it("only server modules and API routes mention a secret's name, and server modules are marked server-only", () => {
    const mentioning = files.filter((f) => SECRET_NAMES.test(f.text));
    expect(mentioning.length).toBeGreaterThan(0); // the scan really sees the source tree
    for (const f of mentioning) {
      const ok = f.rel.startsWith("src/server/") || f.rel.startsWith("src/app/api/");
      expect(ok, `${f.rel} mentions a server secret but is not server code`).toBe(true);
      if (f.rel.startsWith("src/server/")) expect(f.text, `${f.rel} must import "server-only"`).toMatch(/import "server-only";/);
    }
  });

  it("process.env is read in exactly one server-only module and there are no NEXT_PUBLIC_ variables", () => {
    expect(files.filter((f) => /process\.env/.test(f.text)).map((f) => f.rel)).toEqual(["src/server/env.ts"]);
    expect(files.filter((f) => /NEXT_PUBLIC_/.test(f.text)).map((f) => f.rel)).toEqual([]);
  });

  it("client components never import server code at runtime (type-only imports are erased)", () => {
    const offenders = files
      .filter((f) => /^["']use client["'];?/m.test(f.text))
      .filter((f) => /^import\s+(?!type\b)[^;]*from\s+["']@\/server\//m.test(f.text))
      .map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
});

describe("web security headers (next.config)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function headersFor(nodeEnv: string): Promise<Map<string, string>> {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.resetModules();
    const config = (await import("../../next.config")).default;
    const rules = await config.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe("/:path*"); // every page and every API route
    return new Map(rules[0]!.headers.map((h) => [h.key, h.value]));
  }

  it("production: locked-down CSP, no eval, no cross-origin connects, framing and MIME sniffing off, HSTS on", async () => {
    const h = await headersFor("production");
    const csp = h.get("Content-Security-Policy")!;
    const directive = (name: string) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `));
    expect(directive("default-src")).toBe("default-src 'self'");
    expect(directive("script-src")).not.toMatch(/unsafe-eval|https?:|\*/);
    expect(directive("connect-src")).toBe("connect-src 'self'"); // no wildcard, no ws:
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("form-action")).toBe("form-action 'self'");
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(csp).not.toMatch(/\*/);
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(h.get("Permissions-Policy")).toMatch(/geolocation=\(\)/);
    expect(h.get("Permissions-Policy")).toMatch(/camera=\(\)/);
    expect(h.get("Strict-Transport-Security")).toMatch(/max-age=\d{7,}/);
  });

  it("development may relax only what hot reloading needs (eval and websockets), never framing or object embedding", async () => {
    const h = await headersFor("development");
    const csp = h.get("Content-Security-Policy")!;
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(h.has("Strict-Transport-Security")).toBe(false);
  });
});
