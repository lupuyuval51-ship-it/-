// Release scan: cheap, deterministic checks that must never regress.
import fs from 'node:fs';
import path from 'node:path';

const roots = ['server.js', 'public', 'src', 'tools', 'content'];
const skip = new Set([path.join('public', 'vendor')]);
const bad = [];
function walk(p) {
  if (!fs.existsSync(p) || skip.has(p)) return;
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const x of fs.readdirSync(p)) walk(path.join(p, x));
    return;
  }
  if (!/\.(js|mjs|css|html|json)$/.test(p)) return;
  const s = fs.readFileSync(p, 'utf8');
  if (/Lorem ipsum/i.test(s)) bad.push(`${p}: lorem ipsum`);
  if (/javascript:/i.test(s)) bad.push(`${p}: javascript URL`);
  if (/TODO.*(security|auth|payment)/i.test(s)) bad.push(`${p}: critical TODO`);
  if (s.includes('0526262828') && p !== path.join('src', 'config.js')) bad.push(`${p}: bit phone must be centralized`);
  if (/\.(js|mjs)$/.test(p)) {
    // The CSP is script-src 'self'; dynamic code execution is also banned for generated content.
    if (/\beval\s*\(/.test(s) || /\bnew\s+Function\s*\(/.test(s)) bad.push(`${p}: dynamic code execution`);
  }
  if (/\.html$/.test(p)) {
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(s)) bad.push(`${p}: inline script blocked by CSP`);
    if (/\son[a-z]+\s*=\s*["']/i.test(s)) bad.push(`${p}: inline event handler blocked by CSP`);
  }
}
for (const r of roots) walk(r);
if (bad.length) {
  console.error(bad.join('\n'));
  process.exit(1);
}
console.log('lint: release scan OK');
