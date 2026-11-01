import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO = resolve(__dirname, '..');
let root = '';

function put(rel: string, body: string) {
  const p = join(root, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, body);
}
function run(script: string) {
  const cmd = script.endsWith('.ts') ? ['npx', 'tsx', join(REPO, 'scripts', script)] : ['node', join(REPO, 'scripts', script)];
  const r = spawnSync(cmd[0] as string, cmd.slice(1), { env: { ...process.env, LINT_ROOT: root }, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeAll(() => { root = mkdtempSync(join(tmpdir(), 'lupu-lint-')); });
afterAll(() => { rmSync(root, { recursive: true, force: true }); });

describe('design-lint detects every prohibited pattern', () => {
  const bad: Record<string, string> = {
    gradient: '.a{background:linear-gradient(red,blue)}',
    'glass/blur': '.a{backdrop-filter:blur(4px)}',
    'decorative shadow': '.a{box-shadow:0 0 8px red}',
    'pill radius': '.a{border-radius:9999px}',
    'radius 12px': '.a{border-radius:12px}',
    'radius 0.75rem': '.a{border-radius:0.75rem}',
    'physical margin': '.a{margin-left:4px}',
    'physical padding': '.a{padding-right:4px}',
    'physical inset': '.a{position:absolute;left:0}',
    'text-align': '.a{text-align:left}',
    'px font': '.a{font-size:16px}',
    'negative tracking': '.a{letter-spacing:-0.02em}',
    'raw hex': '.a{color:#ff0000}',
    'raw rgb': '.a{color:rgb(1 2 3)}',
    'hsl': '.a{color:hsl(10 10% 10%)}',
  };
  for (const [name, css] of Object.entries(bad)) {
    it(`flags ${name}`, () => {
      const d = mkdtempSync(join(tmpdir(), 'lupu-dl-'));
      const prev = root; root = d;
      put('client/src/x.css', css);
      const r = run('design-lint.mjs');
      root = prev; rmSync(d, { recursive: true, force: true });
      expect(r.code).toBe(1);
    });
  }
  it('flags tailwind physical classes and pills in tsx', () => {
    const d = mkdtempSync(join(tmpdir(), 'lupu-dl-')); const prev = root; root = d;
    put('client/src/x.tsx', 'export const A = () => <div className="ml-2 rounded-full tracking-tight" />;');
    const r = run('design-lint.mjs'); root = prev; rmSync(d, { recursive: true, force: true });
    expect(r.code).toBe(1);
    expect((r.out.match(/design-lint:/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
  it('passes clean logical-property CSS with tokens and allows var(--overlay-shadow)', () => {
    const d = mkdtempSync(join(tmpdir(), 'lupu-dl-')); const prev = root; root = d;
    put('client/src/ok.css', '.a{margin-inline-start:1rem;padding-inline-end:1rem;text-align:start;font-size:1rem;border-radius:0.5rem;color:var(--text);box-shadow:var(--overlay-shadow);border-radius:50%}');
    put('client/src/styles/tokens.css', ':root{--bg:#0B0B0D}');
    const r = run('design-lint.mjs'); root = prev; rmSync(d, { recursive: true, force: true });
    expect(r.code).toBe(0);
  });
});

describe('security-scan', () => {
  const bad: Record<string, string> = {
    innerHTML: 'const a = { dangerouslySetInnerHTML: { __html: x } };',
    eval: 'eval("1+1");',
    sqlTemplate: 'db.query(`SELECT * FROM users WHERE id = ${id}`);',
    sqlConcat: 'db.query("SELECT * FROM users WHERE id = " + id);',
    storage: 'localStorage.setItem("authToken", t);',
    google: `const k = "AIza${'a'.repeat(35)}";`,
    anthropic: `const k = "sk-ant-${'a'.repeat(30)}";`,
  };
  for (const [name, code] of Object.entries(bad)) {
    it(`flags ${name}`, () => {
      const d = mkdtempSync(join(tmpdir(), 'lupu-ss-')); const prev = root; root = d;
      put('server/src/x.ts', code);
      const r = run('security-scan.mjs'); root = prev; rmSync(d, { recursive: true, force: true });
      expect(r.code).toBe(1);
    });
  }
  it('flags AI env keys referenced from client code only', () => {
    const d = mkdtempSync(join(tmpdir(), 'lupu-ss-')); const prev = root; root = d;
    put('server/src/ok.ts', 'const k = process.env.GEMINI_API_KEY;');
    expect(run('security-scan.mjs').code).toBe(0);
    put('client/src/bad.ts', 'const k = import.meta.env.GEMINI_API_KEY;');
    expect(run('security-scan.mjs').code).toBe(1);
    root = prev; rmSync(d, { recursive: true, force: true });
  });
  it('passes parameterised SQL', () => {
    const d = mkdtempSync(join(tmpdir(), 'lupu-ss-')); const prev = root; root = d;
    put('server/src/ok.ts', "db.query('SELECT * FROM users WHERE id = $1', [id]);");
    const r = run('security-scan.mjs'); root = prev; rmSync(d, { recursive: true, force: true });
    expect(r.code).toBe(0);
  });
});

describe('copy-lock', () => {
  it('flags hard-coded JSX text and attributes, passes translated code', () => {
    const d = mkdtempSync(join(tmpdir(), 'lupu-cl-')); const prev = root; root = d;
    put('client/src/ok.tsx', 'export const A = () => <button aria-label={t("x")}>{t("y")}</button>;');
    expect(run('copy-lock.ts').code).toBe(0);
    put('client/src/bad.tsx', 'export const B = () => <button>Start workout</button>;');
    expect(run('copy-lock.ts').code).toBe(1);
    put('client/src/bad.tsx', 'export const B = () => <button>להתחיל אימון</button>;');
    expect(run('copy-lock.ts').code).toBe(1);
    put('client/src/bad.tsx', 'export const B = () => <input placeholder="Search" />;');
    expect(run('copy-lock.ts').code).toBe(1);
    root = prev; rmSync(d, { recursive: true, force: true });
  });
});

describe('contrast-check on the real tokens', () => {
  it('passes for the repo tokens.css', () => {
    const r = spawnSync('node', [join(REPO, 'scripts', 'contrast-check.mjs')], { encoding: 'utf8' });
    expect(r.status).toBe(0);
  });
});
