/**
 * Setup of the PGlite harness that runs the existing server test suite (server/tests) against the
 * device database stack: `pg` is aliased to the PGlite shim (in-memory database per test process),
 * everything else (Express, HTTP, Node crypto) stays real. Replaces the Postgres globalSetup: the
 * device start-up (bundled migrations, content seed) runs once per process before the test file.
 */
import path from 'node:path';
import { beforeEach } from 'vitest';
import { prepareDeviceDatabase } from '../database';
import { configureDeviceDatabase } from '../shims/pg';
import { PGLITE_SKIPS } from './pglite-skips';

// Test files start requests and transactions concurrently: the single PGlite connection is handed out
// one caller at a time, like a pool with one connection. A query made inside a transaction by the same
// code would wait forever (and log a warning), so a green run also proves the server never does that.
configureDeviceDatabase({ leaseMode: 'exclusive' });

await prepareDeviceDatabase();

const root = path.resolve(import.meta.dirname, '../../../..');

interface Named {
  name: string;
  suite?: Named;
  file?: { filepath: string };
}

/** `server/tests/x.test.ts > describe > … > test`, as listed in pglite-skips.ts. */
function fullName(task: Named & { file: { filepath: string } }): string {
  const names: string[] = [];
  for (let t: Named | undefined = task; t && t !== (task.file as unknown); t = t.suite) names.unshift(t.name);
  return [path.relative(root, task.file.filepath), ...names].join(' > ');
}

beforeEach((ctx) => {
  const reason = PGLITE_SKIPS[fullName(ctx.task)];
  if (reason) ctx.skip(`PGlite: ${reason}`);
});
