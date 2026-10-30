/**
 * Start-up of the device database, in the order the hosted server uses (server/src/index.ts):
 * forward-only migrations (bundled into the app, same checksums as on disk), then the idempotent content
 * seed (skipped when the content hash is unchanged). Finally the exercise catalog cache is loaded: the
 * server fills it lazily through the pool, which would otherwise happen inside the first transaction
 * that needs it (harmless on the device's single connection, but outside a transaction is cleaner).
 */
import { migrate, type MigrationResult } from '../../../server/src/db/migrate';
import { seedContent, type SeedResult } from '../../../server/src/db/seed';
import { getAllExercises } from '../../../server/src/modules/exercises/repository';
import { DEVICE_MIGRATIONS } from './migrations';

export interface DeviceDatabaseReady {
  migrations: MigrationResult;
  seed: SeedResult;
}

export async function prepareDeviceDatabase(log: (msg: string) => void = () => undefined): Promise<DeviceDatabaseReady> {
  const migrations = await migrate(log, DEVICE_MIGRATIONS);
  const seed = await seedContent();
  await getAllExercises();
  return { migrations, seed };
}
