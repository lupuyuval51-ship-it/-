import type { Server } from 'node:http';
import { createApp } from './app';
import { isLlmConfigured } from './ai/llm';
import { assertProductionConfig, config } from './config';
import { migrate } from './db/migrate';
import { db, isTransactionPoolerUrl } from './db/pool';
import { seedContent } from './db/seed';
import { startReminderScheduler } from './modules/push/scheduler';
import { loadVapidKeys } from './modules/push/vapid';

async function maintenance() {
  try {
    await db.exec('DELETE FROM auth_sessions WHERE expires_at < now()');
    await db.exec("DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours'");
    await db.exec("DELETE FROM password_reset_tokens WHERE expires_at < now() - interval '1 day'");
    await db.exec("DELETE FROM push_deliveries WHERE created_at < now() - interval '30 days'");
  } catch (err) {
    console.error('[maintenance] failed', (err as Error).message);
  }
}

async function main() {
  assertProductionConfig();
  if (config.appUrlSource === 'RENDER_EXTERNAL_URL') console.log(`[config] app URL ${config.appUrl} (from RENDER_EXTERNAL_URL)`);
  else if (config.appUrlSource === 'default' && config.isProduction) {
    console.warn(`[config] APP_URL is not set: reset links and the push contact use ${config.appUrl}; set APP_URL to the public https address`);
  }
  if (isTransactionPoolerUrl(config.databaseUrl)) {
    console.warn('[db] DATABASE_URL is a pooled (-pooler) address: use the direct connection string (Neon: Connect > Connection pooling off). Migrations need a session lock that the pooler does not keep.');
  }
  if (config.autoMigrate) {
    const m = await migrate((msg) => console.log(`[db] ${msg}`));
    if (m.applied.length) console.log(`[db] applied ${m.applied.length} migration(s)`);
    const s = await seedContent();
    if (!s.skipped) console.log(`[db] seeded ${s.exercises} exercises, ${s.foods} foods, ${s.mealTemplates} meal templates`);
  }
  // Phone notifications: VAPID keys from the environment, else the pair kept in the database.
  const vapid = await loadVapidKeys(db);
  if (vapid.error) console.error(`[push] could not load the stored VAPID key pair: ${vapid.error}`);
  else if (vapid.created) console.log('[push] created a VAPID key pair and stored it in the database (set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY to use your own)');
  else if (vapid.source === 'database') console.log('[push] using the VAPID key pair stored in the database');
  const app = createApp();
  const server: Server = app.listen(config.port, config.host, () => {
    console.log(`LUPU-FIT listening on http://${config.host}:${config.port} (${config.env})`);
    if (!isLlmConfigured()) console.log('[ai] AI_API_KEY not set — coach runs in built-in mode, photo analysis disabled');
  });
  server.keepAliveTimeout = 65_000;
  const timer = setInterval(maintenance, 60 * 60 * 1000);
  timer.unref();
  void maintenance();
  // Phone-notification reminders (in-process; tests drive runReminderTick directly instead).
  const stopReminders = config.env === 'test' ? () => undefined : startReminderScheduler();

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    clearInterval(timer);
    stopReminders();
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
