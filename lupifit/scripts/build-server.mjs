// Bundles the server (TypeScript + @shared alias) into dist/server/index.js and copies SQL migrations.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist', 'server');
fs.rmSync(out, { recursive: true, force: true });
await build({
  entryPoints: [path.join(root, 'server/src/index.ts')],
  outfile: path.join(out, 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  alias: { '@shared': path.join(root, 'shared') },
  tsconfig: path.join(root, 'server/tsconfig.json'),
  logLevel: 'warning',
});
fs.cpSync(path.join(root, 'server/src/db/migrations'), path.join(out, 'db', 'migrations'), { recursive: true });
// Standalone DB CLI for production (`node dist/server/db-cli.js setup`).
await build({
  entryPoints: [path.join(root, 'server/src/db/cli.ts')],
  outfile: path.join(out, 'db-cli.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  alias: { '@shared': path.join(root, 'shared') },
  logLevel: 'warning',
});
console.log('build: dist/server ready');
