import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { config } from './config';
import { all, audit, id, now, one, run, transaction, type Row } from './db';
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
export function createSession(userId: string, remember = false) {
  const token = randomBytes(32).toString('hex'), seconds = remember ? 30 * 86400 : 86400;
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
const registration = z.object({ email: z.email().max(254), password: z.string().min(10).max(128), displayName: z.string().trim().min(2).max(60), birthYear: z.number().int().min(1900).max(new Date().getUTCFullYear() - 5), consent: z.literal(true), parentEmail: z.email().max(254).optional().or(z.literal('')) });
export async function register(data: unknown) {
  const value = registration.parse(data), email = value.email.toLowerCase();
  const parentalRequired = new Date().getUTCFullYear() - value.birthYear < 16;
  assert(!parentalRequired || (value.parentEmail && value.parentEmail.toLowerCase() !== email), 400, 'נדרש אימייל של הורה שונה מאימייל הילד. / A separate parent email is required.', 'PARENT_CONSENT_REQUIRED');
  assert(!one('SELECT id FROM users WHERE email=?', email), 409, 'כתובת האימייל כבר רשומה. / This email is already registered.', 'EMAIL_EXISTS');
  const userId = id(), time = now();
  transaction(() => {
    run('INSERT INTO users(id,email,password_hash,created_at,updated_at) VALUES(?,?,?,?,?)', userId, email, passwordHash(value.password), time, time);
    run('INSERT INTO profiles(user_id,display_name,birth_year,preferences,created_at,updated_at) VALUES(?,?,?,?,?,?)', userId, value.displayName, value.birthYear, JSON.stringify({ locale: 'he', timezone: 'Asia/Jerusalem', theme: 'dark', coachStyle: 'supportive', privacy: 'private', leaderboards: false, leagues: false, notifications: true, music: false, effects: true, streaks: true, reducedMotion: false, quality: 'auto', sensitivity: 1, controlsSide: 'right' }), time, time);
    if (parentalRequired) run('INSERT INTO parental_consents(id,user_id,parent_email,created_at,updated_at) VALUES(?,?,?,?,?)', id(), userId, value.parentEmail!.toLowerCase(), time, time);
    audit(userId, 'account.register', userId, { termsVersion: '2026-09-02', privacyVersion: '2026-09-02', parentalConsentRequired: parentalRequired });
  });
  const verification = await issueToken(userId, email, 'verify');
  const parental = parentalRequired ? await issueToken(userId, value.parentEmail!, 'parent') : undefined;
  return { userId, verification, parental, parentConsentRequired: parentalRequired };
}
export function login(data: unknown) {
  const value = z.object({ email: z.email(), password: z.string().max(128), remember: z.boolean().optional() }).parse(data);
  const user = one('SELECT * FROM users WHERE email=? AND deleted_at IS NULL', value.email.toLowerCase());
  // Perform a real hash for unknown accounts to avoid a fast account-enumeration path.
  const valid = passwordMatches(value.password, user?.password_hash || '9cd89e106823:'.concat('00'.repeat(64)));
  assert(user && valid && !user.blocked && (config.demo || !['demo-admin', 'demo-learner', 'demo-free'].includes(user.id)), 401, 'האימייל או הסיסמה אינם נכונים. / Incorrect email or password.', 'INVALID_CREDENTIALS');
  assert(user.email_verified, 403, 'יש לאמת את כתובת האימייל לפני הכניסה. / Please verify your email first.', 'EMAIL_NOT_VERIFIED');
  const consent = one('SELECT * FROM parental_consents WHERE user_id=?', user.id);
  assert(!consent || consent.status === 'approved', 403, 'ממתינים להסכמת ההורה. / Parent consent is still pending.', 'PARENT_CONSENT_PENDING');
  audit(user.id, 'account.login', user.id);
  return { user, cookie: createSession(user.id, value.remember) };
}
export async function issueToken(userId: string, email: string, kind: 'verify' | 'reset' | 'parent') {
  const token = randomBytes(32).toString('hex');
  run('UPDATE auth_tokens SET used_at=? WHERE user_id=? AND kind=? AND used_at IS NULL', now(), userId, kind);
  run('INSERT INTO auth_tokens(id,user_id,kind,expires_at,created_at) VALUES(?,?,?,?,?)', hashToken(token), userId, kind, new Date(Date.now() + (kind === 'reset' ? 3600000 : 86400000)).toISOString(), now());
  if (config.demo) {
    run('INSERT INTO demo_mail(id,email,kind,token,created_at) VALUES(?,?,?,?,?)', id(), email, kind, token, now());
    return { token, url: `${config.appUrl}/${kind}?token=${token}`, isDemo: true };
  }
  assert(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.MAIL_FROM, 503, 'שירות האימייל לא הוגדר. פנו למנהל. / Email delivery is not configured.', 'EMAIL_UNAVAILABLE');
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.default.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === '465', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  await transport.sendMail({ from: process.env.MAIL_FROM, to: email, subject: `LEVELUP AI — ${kind === 'reset' ? 'איפוס סיסמה' : kind === 'parent' ? 'בקשת הסכמת הורה' : 'אימות כתובת אימייל'}`, text: `להשלמת הפעולה פתחו את הקישור הבא. הקישור אישי וחד פעמי:\n${config.appUrl}/${kind}?token=${token}\nאם לא ביקשתם זאת, ניתן להתעלם מההודעה.` });
  return { isDemo: false };
}
export function consumeToken(token: string, kind: string, password?: string) {
  return transaction(() => {
    const row = one('SELECT * FROM auth_tokens WHERE id=? AND kind=? AND used_at IS NULL AND expires_at>?', hashToken(token), kind, now());
    assert(row, 400, 'הקישור אינו תקין או שפג תוקפו. / This link is invalid or expired.', 'TOKEN_INVALID');
    run('UPDATE auth_tokens SET used_at=? WHERE id=?', now(), row.id);
    if (kind === 'verify') run('UPDATE users SET email_verified=1,updated_at=? WHERE id=?', now(), row.user_id);
    if (kind === 'parent') run("UPDATE parental_consents SET status='approved',approved_at=?,updated_at=? WHERE user_id=?", now(), now(), row.user_id);
    if (kind === 'reset') { run('UPDATE users SET password_hash=?,updated_at=? WHERE id=?', passwordHash(z.string().min(10).max(128).parse(password)), now(), row.user_id); run('DELETE FROM sessions WHERE user_id=?', row.user_id); }
    audit(row.user_id, `account.${kind}`, row.user_id);
    return row.user_id as string;
  });
}
export function publicUser(user: Row) { const profile = one('SELECT display_name FROM profiles WHERE user_id=?', user.id)!; return { id: user.id, email: user.email, role: user.role, displayName: profile.display_name, emailVerified: !!user.email_verified }; }
export function userMail(userId: string) { const user = one('SELECT email FROM users WHERE id=?', userId); return config.demo && user ? all('SELECT id,kind,token,created_at FROM demo_mail WHERE email=? ORDER BY created_at DESC LIMIT 5', user.email) : []; }
