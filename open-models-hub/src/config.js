import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}

const int = (v, d) => Number.isFinite(Number(v)) && v !== '' && v !== undefined ? Number(v) : d;

export function loadConfig(env = process.env) {
  return {
    port: int(env.PORT, 3100),
    production: env.NODE_ENV === 'production',
    accessCode: env.HUB_ACCESS_CODE || '',
    trustProxy: env.TRUST_PROXY === 'true',
    refreshMinutes: Math.max(5, int(env.CATALOG_REFRESH_MINUTES, 360)),
    appUrl: env.APP_URL || `http://localhost:${int(env.PORT, 3100)}`,
    env
  };
}
