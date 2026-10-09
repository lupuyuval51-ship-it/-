// Release/security scan over source files (complements TypeScript strict mode).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dirs = ['server/src', 'client/src', 'shared'];
const problems = [];
const rules = [
  { re: /dangerouslySetInnerHTML/, msg: 'dangerouslySetInnerHTML is not allowed (XSS risk)' },
  { re: /\beval\s*\(|new Function\s*\(/, msg: 'eval/new Function is not allowed' },
  { re: /sk-ant-[A-Za-z0-9_-]{10,}/, msg: 'hard-coded Anthropic API key' },
  { re: /localStorage\.(setItem|getItem)\([^)]*(token|password|secret)/i, msg: 'secrets must not be stored in localStorage' },
  { re: /TODO.*(security|auth|csrf|sql|inject)/i, msg: 'unresolved security TODO' },
  { re: /Lorem ipsum/i, msg: 'placeholder text' },
  { re: /console\.\w+\(.*(config\.ai\.apiKey|password_hash|\.password\b|csrfToken|token_hash|req\.headers\.cookie)/, msg: 'logging of secrets' },
  { re: /\$\{[^}]*\}\s*(?:AND|OR|WHERE|VALUES)|(?:WHERE|AND|OR)\s+\w+\s*=\s*'\$\{/i, msg: 'possible SQL string interpolation (use parameters)' },
];
const clientOnly = [{ re: /process\.env\.(AI_API_KEY|ANTHROPIC_API_KEY|DATABASE_URL|SESSION_SECRET)/, msg: 'server secret referenced in client code' }];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs|css|html)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) check(p);
  }
}
function check(file) {
  const rel = path.relative(root, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const active = rel.startsWith('client/') ? [...rules, ...clientOnly] : rules;
  lines.forEach((line, i) => {
    for (const r of active) if (r.re.test(line) && !line.includes('lint-ignore')) problems.push(`${rel}:${i + 1}: ${r.msg}`);
  });
}
for (const d of dirs) walk(path.join(root, d));
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`lint: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log('lint: release/security scan OK');
