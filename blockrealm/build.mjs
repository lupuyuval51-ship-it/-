// Inlines src/*.js into single-file builds: dist/blockrealm.html (standalone) and dist/artifact.html (body fragment).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inlined = html.replace(/<script src="(src\/[\w.-]+\.js)"><\/script>\n?/g, (_, src) => {
  const code = fs.readFileSync(path.join(root, src), 'utf8');
  if (code.includes('</script')) throw new Error(`${src} contains a closing script tag`);
  return `<script>\n/* ${src} */\n${code}</script>\n`;
});
const head = inlined.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\n?/, '')
  .replace(/<meta name="viewport"[^>]*>\n?/, '');
const body = inlined.match(/<body>([\s\S]*?)<\/body>/)[1];

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'blockrealm.html'), inlined);
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), head.trim() + '\n' + body.trim() + '\n');
console.log(`build: dist/blockrealm.html ${(inlined.length / 1024).toFixed(0)} KB`);
