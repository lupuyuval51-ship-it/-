#!/usr/bin/env node
/**
 * Trusted operator command; never expose this script through an HTTP endpoint.
 * Learners open accounts without a sign-up form, so staff accounts have no self-service
 * route at all: this is the only way one is created, and the only way one gets a password.
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';

const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  console.error('Usage: node --env-file=.env.local scripts/promote-admin.mjs admin@example.com');
  process.exit(1);
}
if (email.endsWith('@guest.invalid')) {
  console.error('That domain is reserved for passwordless learner accounts.');
  process.exit(1);
}
const databasePath = resolve(process.env.LEVELUP_DB_PATH || 'data/levelup.sqlite');
if (!existsSync(databasePath)) {
  console.error('Database does not exist. Start the application once so the schema is created.');
  process.exit(1);
}
const passwordHash = password => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const db = new DatabaseSync(databasePath);
try {
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE;');
  const user = db.prepare('SELECT u.id,u.email,u.role,u.blocked FROM users u WHERE lower(u.email)=? AND u.deleted_at IS NULL').get(email);
  const time = new Date().toISOString();
  let password = '';
  let userId = user?.id;
  if (user?.blocked) throw new Error('A blocked account cannot become an administrator.');
  if (!user) {
    // Password is shown once here and never recoverable; rerun the script to issue a new one.
    password = randomBytes(18).toString('base64url');
    userId = randomUUID();
    db.prepare('INSERT INTO users(id,email,password_hash,role,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(userId, email, passwordHash(password), 'admin', 1, time, time);
    db.prepare('INSERT INTO profiles(user_id,display_name,birth_year,preferences,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(userId, email.split('@')[0].slice(0, 60) || 'Administrator', 1990, JSON.stringify({ locale: 'he', timezone: 'Asia/Jerusalem', theme: 'dark', coachStyle: 'professional', privacy: 'private', leaderboards: false, leagues: false, notifications: true, music: false, effects: true, streaks: true, reducedMotion: false, quality: 'auto', sensitivity: 1, controlsSide: 'right' }), time, time);
  } else if (user.role !== 'admin') {
    db.prepare('UPDATE users SET role=?,updated_at=? WHERE id=?').run('admin', time, user.id);
  } else if (process.argv.includes('--reset-password')) {
    password = randomBytes(18).toString('base64url');
    db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=?').run(passwordHash(password), time, user.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
  } else {
    db.exec('COMMIT;');
    console.log('The account is already an administrator. Pass --reset-password to issue a new one.');
    process.exit(0);
  }
  db.prepare('INSERT INTO admin_actions(id,actor_id,action,target_id,details,created_at) VALUES(?,?,?,?,?,?)').run(
    randomUUID(), null, user ? 'account.promoted_by_operator' : 'account.staff_created_by_operator', userId,
    JSON.stringify({ mechanism: 'trusted-local-cli', previousRole: user?.role || null, newRole: 'admin', passwordIssued: !!password }), time,
  );
  db.exec('COMMIT;');
  console.log('Administrator access is ready. The change was recorded in the activity log.');
  if (password) console.log(`Sign in at /login with ${email} and this one-time password (it is not stored anywhere else):\n\n  ${password}\n`);
} catch (error) {
  try { db.exec('ROLLBACK;'); } catch { /* The transaction may already have been closed. */ }
  console.error(error instanceof Error ? error.message : 'Could not prepare the administrator account.');
  process.exitCode = 1;
} finally {
  db.close();
}
