// Writes the legal pages (privacy policy, terms of use, data deletion) as static HTML, Hebrew and English,
// for a public URL without a server: Google Play needs a privacy-policy URL even for the device-mode app.
//
//   npm run legal:static                       # device-mode texts (the Android app) -> dist/legal/
//   npm run legal:static -- --mode server      # hosted-service texts (the website serves its own pages)
//   npm run legal:static -- --out /some/folder
//
// Upload the folder to any static host (GitHub Pages, Netlify Drop, Cloudflare Pages …) and use
// <address>/privacy.html (Hebrew) or <address>/en/privacy.html as the Play Console URLs. Texts and
// placeholders come from client/src/i18n/locales/*/legal.ts via client/src/features/legal/documents.ts:
// fill the [placeholders] and get the lawyer review first (docs/play-store/checklist.md). Run with tsx.
import fs from 'node:fs';
import path from 'node:path';
import { renderLegalSite } from '../client/src/features/legal/staticSite.ts';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const mode = option('--mode', 'device');
if (mode !== 'device' && mode !== 'server') {
  console.error(`legal-static: --mode must be device or server (got ${mode})`);
  process.exit(2);
}
const out = path.resolve(root, option('--out', 'dist/legal'));

// Only the site's own files are written (fixed names); nothing else in the folder is touched.
for (const file of renderLegalSite(mode)) {
  const target = path.join(out, file.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, file.html);
}
console.log(`legal-static: ${mode} texts written to ${out}`);
