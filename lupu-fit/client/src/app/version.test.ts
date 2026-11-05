import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../env.ts';

describe('APP_VERSION', () => {
  it('is the release version from the root package.json, not the client workspace stub', () => {
    const root = JSON.parse(readFileSync(resolve(__dirname, '../../../package.json'), 'utf8')) as { version: string };
    expect(APP_VERSION).toBe(root.version);
  });
});
