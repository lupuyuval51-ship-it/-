import type { Server } from 'node:http';
import { createApp } from './app';
import { isLlmConfigured } from './ai/llm';
import { assertProductionConfig, config } from './config';
import { migrate } from './db/migrate';
import { db } from './db/pool';
import { seedContent } from './db/seed';

async function maintenance() {
  try {
    await db.exec('DELETE FROM auth_sessions WHERE expires_at < now()');
    await db.exec("DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours'");
    await db.exec("DELETE FROM password_reset_tokens WHERE expires_at < now() - interval '1 day'");
  } catch (err) {
    console.error('[maintenance] failed', (err as Error).message);
  }
}

async function main() {
  assertProductionConfig();
  if (config.autoMigrate) {
    const m = await migrate((msg) => console.log(`[db] ${msg}`));
    if (m.applied.length) console.log(`[db] applied ${m.applied.length} migration(s)`);
    const s = await seedContent();
    if (!s.skipped) console.log(`[db] seeded ${s.exercises} exercises, ${s.foods} foods, ${s.mealTemplates} meal templates`);
  }
  const app = createApp();
  const server: Server = app.listen(config.port, config.host, () => {
    console.log(`LUPU-FIT listening on http://${config.host}:${config.port} (${config.env})`);
    if (!isLlmConfigured()) console.log('[ai] AI_API_KEY not set — coach runs in built-in mode, photo analysis disabled');
  });
  server.keepAliveTimeout = 65_000;
  const timer = setInterval(maintenance, 60 * 60 * 1000);
  timer.unref();
  void maintenance();

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    clearInterval(timer);
    server.close(() => {
      db.close().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start LUPU-FIT:', err);
  process.exit(1);
});
