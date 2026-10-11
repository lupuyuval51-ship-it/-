import crypto from 'node:crypto';

export const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};

export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function createLimiter({ windowMs = 60000, max = 30, now = Date.now } = {}) {
  const hits = new Map();
  if (!(max > 0)) return () => true; // 0 = unlimited
  return key => {
    const t = now();
    const recent = (hits.get(key) || []).filter(x => t - x < windowMs);
    if (recent.length >= max) { hits.set(key, recent); return false; }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(x => t - x < windowMs)) hits.delete(k);
    return true;
  };
}

const ROLES = new Set(['system', 'user', 'assistant']);

export function validateChat(body) {
  const bad = code => ({ error: code });
  if (!body || typeof body !== 'object' || Array.isArray(body)) return bad('invalid_body');
  if (typeof body.model !== 'string' || !body.model || body.model.length > 200) return bad('invalid_model');
  if (body.provider !== undefined && (typeof body.provider !== 'string' || body.provider.length > 40)) return bad('invalid_provider');
  if (!Array.isArray(body.messages) || body.messages.length < 1) return bad('invalid_messages');
  const messages = [];
  for (const m of body.messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== 'string' || !m.content.trim()) return bad('invalid_messages');
    messages.push({ role: m.role, content: m.content });
  }
  if (messages.at(-1).role !== 'user') return bad('last_message_must_be_user');
  const p = body.params && typeof body.params === 'object' ? body.params : {};
  const params = {};
  const inRange = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  if (p.temperature !== undefined) { if (!inRange(p.temperature, 0, 2)) return bad('invalid_temperature'); params.temperature = p.temperature; }
  if (p.top_p !== undefined) { if (!inRange(p.top_p, 0, 1)) return bad('invalid_top_p'); params.top_p = p.top_p; }
  // No cap and no default: when omitted, the model/provider decides how long the reply can be.
  if (p.max_tokens !== undefined) { if (!Number.isInteger(p.max_tokens) || p.max_tokens < 1) return bad('invalid_max_tokens'); params.max_tokens = p.max_tokens; }
  return { value: { model: body.model, provider: body.provider, messages, params } };
}
