/**
 * Database CLI: `tsx server/src/db/cli.ts <migrate|seed|setup|status>`
 * (also available as `npm run db:migrate|db:seed|db:setup|db:status`).
 */
import { migrate, migrationStatus } from './migrate';
import { db } from './pool';
import { seedContent } from './seed';

async function main() {
  const cmd = process.argv[2] ?? 'setup';
  const log = (m: string) => console.log(`[db] ${m}`);
  switch (cmd) {
    case 'migrate': {
      const r = await migrate(log);
      log(`migrations: ${r.applied.length} applied, ${r.alreadyApplied} already up to date`);
      break;
    }
    case 'seed': {
      const r = await seedContent({ force: process.argv.includes('--force') });
      log(r.skipped ? 'content unchanged — seed skipped' : `seeded ${r.exercises} exercises, ${r.foods} foods, ${r.mealTemplates} meal templates`);
      break;
    }
    case 'setup': {
      const m = await migrate(log);
      log(`migrations: ${m.applied.length} applied`);
      const s = await seedContent();
      log(s.skipped ? 'content unchanged' : `seeded ${s.exercises} exercises, ${s.foods} foods, ${s.mealTemplates} meal templates`);
      break;
    }
    case 'status': {
      for (const s of await migrationStatus()) log(`${s.applied ? '✔' : '✗'} ${s.name}${s.appliedAt ? ` (${s.appliedAt})` : ''}`);
      break;
    }
    default:
      console.error(`Unknown command "${cmd}". Use migrate | seed | setup | status.`);
      process.exitCode = 2;
  }
}

main()
  .catch((err) => {
    console.error(`[db] ${(err as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => db.close());
