import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the bundle boundaries that keep the 3D runtime (three + react-three-fiber, about 750 kB minified) out of every
 * screen that opens before a game starts. The unit project has no bundler, so this walks the STATIC import graph
 * (dynamic `import()` is the boundary, type-only imports are erased) from the entry points and fails when it reaches
 * the renderer. Before the boundary was fixed the Android app's first chunk was 2.05 MB; it is now about 0.65 MB.
 */
const root = path.resolve(import.meta.dirname, "../..");

const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];
const IMPORT_RE = /\b(?:import|export)\s+(type\s+)?(?:[^;"'`]*?\s+from\s+)?["']([^"']+)["']/g;

function resolveLocal(spec: string, from: string): string | null {
  const base = spec.startsWith("@/") ? path.join(root, "src", spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(from), spec) : null;
  if (!base) return null;
  for (const ext of EXTENSIONS) {
    const file = base + ext;
    if (/\.(ts|tsx)$/.test(file) && existsSync(file)) return file;
  }
  return null;
}

/** Everything reachable from `entry` through static, value imports: local files (relative to the repo) and bare package names. */
function staticGraph(entry: string): { files: Set<string>; packages: Set<string> } {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [path.join(root, entry)];
  while (queue.length) {
    const file = queue.pop()!;
    const rel = path.relative(root, file);
    if (files.has(rel)) continue;
    files.add(rel);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(IMPORT_RE)) {
      if (m[1]) continue; // `import type` / `export type`: erased at build time
      const spec = m[2]!;
      const local = resolveLocal(spec, file);
      if (local) queue.push(local);
      else if (!spec.startsWith(".") && !spec.startsWith("@/")) packages.add(spec);
    }
  }
  return { files, packages };
}

const RENDERER_PACKAGES = (p: string) => p === "three" || p.startsWith("three/") || p.startsWith("@react-three/");

describe("bundle boundaries", () => {
  it("the particle emitter handle (used by the HUD code) does not import the renderer", () => {
    const { packages } = staticGraph("src/components/game/scene/emitter.ts");
    expect([...packages].filter(RENDERER_PACKAGES)).toEqual([]);
  });

  it("the play screen does not statically reach three, react-three-fiber or the scene", () => {
    const { files, packages } = staticGraph("src/components/game/PlayClient.tsx");
    expect([...packages].filter(RENDERER_PACKAGES)).toEqual([]);
    expect([...files].filter((f) => f.startsWith("src/components/game/scene/") && !/\/(guideBand|emitter)\.ts$/.test(f))).toEqual([]);
  });

  it("the offline app's first chunk is the library: no renderer, and every other screen is lazy", () => {
    const { files, packages } = staticGraph("mobile/src/App.tsx");
    expect([...packages].filter(RENDERER_PACKAGES)).toEqual([]);
    expect([...files].filter((f) => f.startsWith("src/components/game/scene/") && !/\/(guideBand|emitter)\.ts$/.test(f))).toEqual([]);
    const lazyScreens = ["Create", "Deck", "Play", "Results", "Settings"].map((n) => `mobile/src/pages/${n}.tsx`);
    expect(lazyScreens.filter((f) => files.has(f))).toEqual([]);
    expect(files.has("mobile/src/pages/Library.tsx")).toBe(true);
  });

  it("main.tsx keeps the shell small: it imports the app, not a screen", () => {
    const { files } = staticGraph("mobile/src/main.tsx");
    expect(files.has("src/components/game/PlayClient.tsx")).toBe(false);
  });

  it("topic-library content is never in a first chunk: each topic is reached only through its own literal dynamic import", () => {
    // The catalogue (titles and descriptions) may be static; the content of the topics may not, anywhere a user lands first.
    for (const entry of ["mobile/src/App.tsx", "mobile/src/main.tsx", "mobile/src/pages/Create.tsx", "src/components/create/CreateForm.tsx", "src/lib/offline/generate.ts", "src/lib/schemas/generation.ts"]) {
      const { files } = staticGraph(entry);
      expect([...files].filter((f) => f.startsWith("src/lib/game/topics/content/")), entry).toEqual([]);
    }
    // the Android app's first chunk does not even reach the topic builder (only the create screen, lazily, does)
    expect(staticGraph("mobile/src/App.tsx").files.has("src/lib/game/topics/build.ts")).toBe(false);
    const loaders = readFileSync(path.join(root, "src/lib/game/topics/loaders.ts"), "utf8");
    const imports = [...loaders.matchAll(/import\(([^)]*)\)/g)].map((m) => m[1]!);
    expect(imports.length).toBeGreaterThan(0);
    // bundlers can only split what they can see: every import is a plain string literal, one per topic
    for (const spec of imports) expect(spec).toMatch(/^"\.\/content\/[a-z0-9-]+"$/);
    expect(new Set(imports).size).toBe(imports.length);
  });

  it("the renderer itself is only reachable through the dynamic import in PlayClient", () => {
    const play = readFileSync(path.join(root, "src/components/game/PlayClient.tsx"), "utf8");
    expect(play).toMatch(/dynamic\(\(\) => import\("\.\/scene\/GameCanvas"\)/);
    expect(play).not.toMatch(/^import .* from "\.\/scene\/(GameCanvas|Particles|WorldView)"/m);
  });
});
