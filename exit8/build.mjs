// Bundles EXIT 8 into one self-contained HTML file: every <script src="js/…"> is inlined.
// Usage: node exit8/build.mjs   →   exit8/exit8.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export function bundle() {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  return html.replace(/<script src="(js\/[\w-]+\.js)"><\/script>/g, (tag, src) => {
    const code = fs.readFileSync(path.join(dir, src), 'utf8');
    if (/<\/script/i.test(code)) throw new Error(`${src} contains "</script" and cannot be inlined`);
    return `<script>/* ${src} */\n${code.trimEnd()}\n</script>`;
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(dir, 'exit8.html');
  const html = bundle();
  fs.writeFileSync(out, html);
  console.log(`build: ${path.relative(process.cwd(), out)} (${(html.length / 1024).toFixed(0)} KB)`);
}
