#!/usr/bin/env node
/** Trusted operator command; never expose this script through an HTTP endpoint. */
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  console.error('Usage: node --env-file=.env.local scripts/promote-admin.mjs admin@example.com');
  process.exit(1);
}
const databasePath = resolve(process.env.LEVELUP_DB_PATH || 'data/levelup.sqlite');
if (!existsSync(databasePath)) {
  console.error('Database does not exist. Start the application and register the administrator account first.');
  process.exit(1);
}
const db = new DatabaseSync(databasePath);
try {
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE;');
  const user = db.prepare('SELECT u.id,u.email,u.role,u.email_verified,u.blocked,p.birth_year FROM users u JOIN profiles p ON p.user_id=u.id WHERE lower(u.email)=? AND u.deleted_at IS NULL').get(email);
  if (!user) throw new Error('No active account exists with that email. Register it first.');
  if (!user.email_verified) throw new Error('The account must verify its email before promotion.');
  if (user.blocked) throw new Error('A blocked account cannot become an administrator.');
  if (new Date().getUTCFullYear() - Number(user.birth_year) < 18) throw new Error('Administrator accounts must belong to an adult.');
  if (user.role === 'admin') {
    db.exec('COMMIT;');
    console.log('The account is already an administrator. No changes were made.');
  } else {
    const time = new Date().toISOString();
    db.prepare('UPDATE users SET role=?,updated_at=? WHERE id=?').run('admin', time, user.id);
    db.prepare('INSERT INTO admin_actions(id,actor_id,action,target_id,details,created_at) VALUES(?,?,?,?,?,?)').run(
      randomUUID(), null, 'account.promoted_by_operator', user.id,
      JSON.stringify({ mechanism: 'trusted-local-cli', previousRole: user.role, newRole: 'admin' }), time,
    );
    db.exec('COMMIT;');
    console.log('The verified adult account now has administrator access. Promotion was recorded in the activity log.');
  }
} catch (error) {
  try { db.exec('ROLLBACK;'); } catch { /* The transaction may already have been closed. */ }
  console.error(error instanceof Error ? error.message : 'Could not promote the account.');
  process.exitCode = 1;
} finally {
  db.close();
}
