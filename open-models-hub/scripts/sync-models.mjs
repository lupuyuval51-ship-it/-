// Regenerates data/models.snapshot.json from the live OpenRouter + Hugging Face catalogs.
// The server also refreshes at runtime; the snapshot is only the offline / first-paint fallback.
import fs from 'node:fs';
import path from 'node:path';
import { root } from '../src/config.js';
import { createRegistry } from '../src/registry.js';

const file = path.join(root, 'data', 'models.snapshot.json');
const registry = createRegistry({ snapshotPath: file, log: console.error });
await registry.refresh({ enrichAll: true });
const st = registry.status();
if (st.source !== 'live') { console.error(`sync failed: ${st.lastError}`); process.exit(1); }
const snap = registry.exportSnapshot();
fs.writeFileSync(file, JSON.stringify(snap) + '\n');
const fams = registry.families().slice(0, 12).map(f => `${f.label}:${f.count}`).join('  ');
console.log(`wrote ${snap.models.length} open models -> data/models.snapshot.json\n${fams}`);
