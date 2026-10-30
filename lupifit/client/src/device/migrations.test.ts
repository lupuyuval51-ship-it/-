/** The bundled device migrations are exactly the files the server reads from disk (names, SQL, checksums). */
import { describe, expect, it } from 'vitest';
import { migrationFile, migrationsFromSources, readMigrations } from '../../../server/src/db/migrate';
import { DEVICE_MIGRATIONS } from './migrations';
import { createHash } from './shims/crypto';

describe('device migrations', () => {
  it('match readMigrations() of the server, with the same checksums', () => {
    const fromDisk = readMigrations();
    expect(DEVICE_MIGRATIONS.length).toBeGreaterThan(0);
    expect(DEVICE_MIGRATIONS.map((m) => [m.version, m.name, m.checksum])).toEqual(fromDisk.map((m) => [m.version, m.name, m.checksum]));
    expect(DEVICE_MIGRATIONS.map((m) => m.sql)).toEqual(fromDisk.map((m) => m.sql));
  });

  it('get the same checksum from the device crypto shim as from node:crypto', () => {
    for (const m of DEVICE_MIGRATIONS) expect(createHash('sha256').update(m.sql).digest('hex')).toBe(m.checksum);
  });

  it('keep only NNNN_name.sql files, by file name, sorted, and refuse a duplicate name', () => {
    const list = migrationsFromSources({
      '/x/0002_second.sql': 'SELECT 2;',
      '../y/0001_first.sql': 'SELECT 1;',
      '/x/README.md': 'not sql',
      '/x/0003_Bad-Name.sql': 'SELECT 3;',
    });
    expect(list.map((m) => m.name)).toEqual(['0001_first', '0002_second']);
    expect(list[0]).toEqual(migrationFile('0001_first.sql', 'SELECT 1;'));
    expect(() => migrationsFromSources({ '/a/0001_x.sql': 'a', '/b/0001_x.sql': 'b' })).toThrow(/listed twice/);
  });
});
