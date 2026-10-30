/**
 * The server's SQL migrations, bundled into the device build as text (Vite `?raw` glob), with the same
 * names and SHA-256 checksums as when the server reads them from disk. Pass them to `migrate()`.
 */
import { migrationsFromSources, type MigrationFile } from '../../../server/src/db/migrate';

const sources = import.meta.glob<string>('../../../server/src/db/migrations/*.sql', { query: '?raw', import: 'default', eager: true });

export const DEVICE_MIGRATIONS: readonly MigrationFile[] = migrationsFromSources(sources);
