/**
 * Validates every curated adventure: `npm run validate:content`
 * Optional: pass file names to validate only those, e.g.
 *   node scripts/validate-content.ts sound-detective.ts
 */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateAdventure } from '../shared/validate.ts';
import { enumeratePaths, pathMinutes } from '../shared/graph.ts';
import type { Adventure } from '../shared/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'src', 'content', 'adventures');
const only = process.argv.slice(2).map((f) => f.replace(/^.*[\\/]/, ''));
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.ts'))
  .filter((f) => only.length === 0 || only.includes(f));

let failed = 0;
const seen = new Map<string, string>();
for (const file of files) {
  const mod = (await import(pathToFileURL(join(dir, file)).href)) as { default?: Adventure };
  const adv = mod.default;
  if (!adv) {
    console.log(`✗ ${file}: no default export`);
    failed++;
    continue;
  }
  const r = validateAdventure(adv);
  if (seen.has(adv.id)) r.errors.push(`duplicate id also used by ${seen.get(adv.id)}`);
  seen.set(adv.id, file);
  if (`${adv.id}.ts` !== file) r.warnings.push(`file name should be ${adv.id}.ts`);
  const paths = r.errors.length === 0 ? enumeratePaths(adv) : [];
  const summary = paths.map((p) => `${p.ending.id}:${pathMinutes(p)}m`).join(', ');
  if (r.errors.length) {
    failed++;
    console.log(`✗ ${file}`);
    for (const e of r.errors) console.log(`    error   ${e}`);
  } else {
    console.log(`✓ ${file}  [${adv.minutes} min · ₪${adv.cost.min}-${adv.cost.max} · ${adv.settings.join('/')} · ${adv.company.join('/')} · w${adv.weirdness}] paths: ${summary}`);
  }
  for (const w of r.warnings) console.log(`    warning ${w}`);
}
console.log(`\n${files.length - failed}/${files.length} adventures valid`);
process.exit(failed ? 1 : 0);
