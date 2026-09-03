import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { config } from './config';
import { audit, id, now, one, run, transaction, type Row } from './db';
import { z } from 'zod';

export class ApiError extends Error { constructor(public status: number, message: string, public code = 'REQUEST_FAILED') { super(message); } }
export function assert(condition: unknown, status: number, message: string, code = 'REQUEST_FAILED'): asserts condition { if (!condition) throw new ApiError(status, message, code); }
export function hashToken(value: string) { return createHash('sha256').update(value).digest('hex'); }
export function passwordHash(password: string) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; }
export function passwordMatches(password: string, stored: string) { try { const [salt, hash] = stored.split(':'); const actual = scryptSync(password, salt, 64); const expected = Buffer.from(hash, 'hex'); return actual.length === expected.length && timingSafeEqual(actual, expected); } catch { return false; } }
export function sessionUser(request: Request, required = true) {
  const raw = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('levelup_session='))?.slice('levelup_session='.length);
  let user = raw ? one('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND u.deleted_at IS NULL AND u.blocked=0', hashToken(raw), now()) : undefined;
  if (user && !config.demo && ['demo-admin', 'demo-learner', 'demo-free'].includes(user.id)) user = undefined;
  if (required) assert(user, 401, 'יש להתחבר כדי להמשיך. / Please sign in.', 'UNAUTHENTICATED');
  return user;
}
export function requireAdmin(request: Request) { const user = sessionUser(request)!; assert(user.role === 'admin', 403, 'הפעולה זמינה למנהלים בלבד. / Administrator access required.', 'FORBIDDEN'); return user; }
export function createSession(userId: string, remember = false, days?: number) {
  const token = randomBytes(32).toString('hex'), seconds = (days ?? (remember ? 30 : 1)) * 86400;
  run('INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,?)', hashToken(token), userId, new Date(Date.now() + seconds * 1000).toISOString(), now());
  return `levelup_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${config.secureCookies ? '; Secure' : ''}`;
}
export function clearSession(request: Request) { const token = request.headers.get('cookie')?.match(/(?:^|;\s*)levelup_session=([^;]+)/)?.[1]; if (token) run('DELETE FROM sessions WHERE id=?', hashToken(token)); return 'levelup_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'; }
export function assertOrigin(request: Request) {
  // Validate deployment configuration for reads too, including the health check.
  const configuredOrigin = new URL(config.appUrl).origin;
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  const allowed = new Set([new URL(request.url).origin, configuredOrigin]);
  assert(origin && allowed.has(origin), 403, 'הבקשה נחסמה. יש לרענן את העמוד. / Request origin rejected.', 'CSRF_REJECTED');
  assert(!request.headers.get('sec-fetch-site') || request.headers.get('sec-fetch-site') !== 'cross-site', 403, 'Request origin rejected.', 'CSRF_REJECTED');
}
/** Only a reverse proxy that overwrites X-Forwarded-For may enable this setting. */
export function clientNetworkAddress(request: Request, trustProxy = process.env.TRUST_PROXY === 'true') {
  if (!trustProxy) return null;
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return address && isIP(address) ? address : null;
}
export function rateLimit(key: string, limit: number, windowSeconds = 60) {
  const time = Date.now();
  const row = one('SELECT * FROM rate_limits WHERE key=?', key);
  if (!row || row.expires_at < time) { run('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=1,expires_at=excluded.expires_at', key, 1, time + windowSeconds * 1000); return; }
  assert(row.count < limit, 429, 'נשלחו יותר מדי בקשות. נסו שוב בעוד דקה. / Too many requests. Please try again shortly.', 'RATE_LIMITED');
  run('UPDATE rate_limits SET count=count+1 WHERE key=?', key);
}
/** No registration means no stated age, so an unknown year must fail closed as a minor. */
export const UNKNOWN_BIRTH_YEAR = 0;
export function isAdult(birthYear: unknown) { const year = Number(birthYear); return Number.isInteger(year) && year >= 1900 && new Date().getUTCFullYear() - year >= 18; }
export const GUEST_SESSION_DAYS = 365;
/** Only guests and operator-created staff exist, so the reserved domain identifies a passwordless account. */
export const GUEST_EMAIL_DOMAIN = '@guest.invalid';
export const isGuestAccount = (user: Row) => typeof user.email === 'string' && user.email.endsWith(GUEST_EMAIL_DOMAIN);
const guestDefaults = { timezone: 'Asia/Jerusalem', theme: 'dark', coachStyle: 'supportive', privacy: 'private', leaderboards: false, leagues: false, notifications: true, music: false, effects: true, streaks: true, reducedMotion: false, quality: 'auto', sensitivity: 1, controlsSide: 'right' };
const guestInput = z.object({ displayName: z.string().trim().min(2).max(60).optional(), locale: z.enum(['he', 'en']).optional() });
/**
 * Opens an account with no sign-up form. The session cookie is the only credential, so the
 * password is a random value nothing can ever present, and the profile stays minor-safe
 * until the learner states an adult year of birth in settings.
 */
export function guestSession(data: unknown = {}) {
  const value = guestInput.parse(data ?? {}), locale = value.locale || 'he';
  const userId = id(), time = now();
  transaction(() => {
    run('INSERT INTO users(id,email,password_hash,role,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', userId, `guest-${userId}${GUEST_EMAIL_DOMAIN}`, `${randomBytes(16).toString('hex')}:${randomBytes(64).toString('hex')}`, 'learner', 1, time, time);
    run('INSERT INTO profiles(user_id,display_name,birth_year,preferences,created_at,updated_at) VALUES(?,?,?,?,?,?)', userId, value.displayName || (locale === 'en' ? 'Learner' : 'לומד/ת'), UNKNOWN_BIRTH_YEAR, JSON.stringify({ ...guestDefaults, locale }), time, time);
    audit(userId, 'account.guest-opened', userId, { termsVersion: '2026-09-02', privacyVersion: '2026-09-02', ageStated: false });
  });
  return { userId, cookie: createSession(userId, false, GUEST_SESSION_DAYS) };
}
export function login(data: unknown) {
  const value = z.object({ email: z.email(), password: z.string().max(128), remember: z.boolean().optional() }).parse(data);
  const user = one('SELECT * FROM users WHERE email=? AND deleted_at IS NULL', value.email.toLowerCase());
  // Perform a real hash for unknown accounts to avoid a fast account-enumeration path.
  const valid = passwordMatches(value.password, user?.password_hash || '9cd89e106823:'.concat('00'.repeat(64)));
  assert(user && valid && !user.blocked && (config.demo || !['demo-admin', 'demo-learner', 'demo-free'].includes(user.id)), 401, 'האימייל או הסיסמה אינם נכונים. / Incorrect email or password.', 'INVALID_CREDENTIALS');
  assert(user.email_verified, 403, 'החשבון אינו מאושר לכניסה. / This account is not enabled for sign-in.', 'ACCOUNT_NOT_ENABLED');
  audit(user.id, 'account.login', user.id);
  return { user, cookie: createSession(user.id, value.remember) };
}
export function publicUser(user: Row) { const profile = one('SELECT display_name FROM profiles WHERE user_id=?', user.id)!; return { id: user.id, email: user.email, role: user.role, displayName: profile.display_name, emailVerified: !!user.email_verified }; }
