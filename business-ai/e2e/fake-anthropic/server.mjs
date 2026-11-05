#!/usr/bin/env node
/**
 * Fake Anthropic Messages API for tests — dependency-free (node:http only).
 *
 * NEVER used by production code paths: the Edge Functions only reach it when a test points
 * AI_API_BASE_URL at it (e.g. AI_API_BASE_URL=http://127.0.0.1:8787).
 *
 * Emulates POST /v1/messages (also `?beta=true`):
 *   - non-streaming JSON and SSE streaming (message_start, content_block_start/delta/stop for
 *     thinking, text and tool_use with input_json_delta, message_delta with stop_reason + usage,
 *     message_stop);
 *   - output_config.format json_schema → a deterministic, schema-valid JSON document (a small JSON
 *     Schema sample generator: objects, arrays with minItems/maxItems, strings with enum/const/
 *     maxLength, numbers with minimum/maximum, booleans, null, anyOf, $ref). Constraints moved into
 *     a description as `Constraints: {...}` (structured-outputs style) are honoured too;
 *   - a `propose_actions` tool_use for advisor requests when tools are present;
 *   - readable text in Hebrew when the system/user content contains Hebrew letters (or a 'he'
 *     locale marker), else English;
 *   - rejects what the real API rejects for current models (sampling params, disabled thinking /
 *     budget_tokens, forced tool_choice, assistant prefill, fallbacks without the beta header,
 *     unsupported JSON Schema keywords) with a 400 invalid_request_error.
 *
 * Test scenarios:
 *   API key `fake-key-invalid` → 401, `fake-key-rate-limit` → 429, `fake-key-overloaded` → 529,
 *   `fake-key-bad-request` → 400. Request text containing `[[fake:refusal]]` → stop_reason refusal,
 *   `[[fake:max_tokens]]` → stop_reason max_tokens, `[[fake:invalid_json]]` → non-JSON structured text,
 *   `[[fake:fallback]]` → served by a fallback model with usage.iterations.
 *
 * Usage: PORT=8787 node e2e/fake-anthropic/server.mjs   (env FAKE_ANTHROPIC_QUIET=1 disables logs)
 */
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
const HEBREW = /[֐-׿]/;
const UNSUPPORTED_SCHEMA_KEYWORDS = [
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'maxItems',
  'uniqueItems',
  'oneOf',
  'not',
  'if',
  'patternProperties',
];

/* ------------------------------------------------------------------------------------------ */
/* Text helpers                                                                               */
/* ------------------------------------------------------------------------------------------ */

const TEXT = {
  en: {
    short: [
      'Interview five potential customers',
      'Prepare a one-page offer',
      'Run a small paid pilot',
      'Compare three supplier quotes',
      'Publish a simple landing page',
      'Set a launch price to test',
      'Track weekly sales and costs',
      'Confirm registration steps',
    ],
    sentence: [
      'Test answer from the fake Anthropic server: talk to five potential customers this week and note what they use today and what they would pay.',
      'Treat this as an assumption to validate: run a small pilot with three customers before spending on marketing.',
      'Rough estimate for planning only: keep fixed costs low in the first three months and review them monthly.',
      'Next step: write down the result of each conversation and decide on the price after ten conversations.',
    ],
    reply:
      'Here is a practical next step (test reply from the fake server). First, talk to five potential customers this week and ask how they solve the problem today. Then compare their answers with your plan and adjust the price if needed.',
    followUp: ['How do I find my first customers?', 'What should I ask in an interview?', 'How do I set my first price?'],
  },
  he: {
    short: [
      'לראיין חמישה לקוחות פוטנציאליים',
      'להכין הצעה בעמוד אחד',
      'להריץ פיילוט קטן בתשלום',
      'להשוות הצעות מחיר משלושה ספקים',
      'לפרסם דף נחיתה פשוט',
      'לקבוע מחיר השקה לבדיקה',
      'לעקוב אחרי מכירות והוצאות שבועיות',
      'לבדוק את שלבי הרישום',
    ],
    sentence: [
      'תשובת בדיקה משרת הדמה: לדבר השבוע עם חמישה לקוחות פוטנציאליים ולרשום במה הם משתמשים היום וכמה היו משלמים.',
      'זו הנחה שצריך לבדוק: להריץ פיילוט קטן עם שלושה לקוחות לפני הוצאה על שיווק.',
      'הערכה גסה לתכנון בלבד: לשמור על הוצאות קבועות נמוכות בשלושת החודשים הראשונים ולבדוק אותן כל חודש.',
      'הצעד הבא: לתעד את התוצאה של כל שיחה ולהחליט על המחיר אחרי עשר שיחות.',
    ],
    reply:
      'הנה צעד מעשי להמשך (תשובת בדיקה משרת הדמה). קודם כל, לדבר השבוע עם חמישה לקוחות פוטנציאליים ולשאול איך הם פותרים את הבעיה היום. אחר כך להשוות את התשובות לתוכנית ולעדכן את המחיר אם צריך.',
    followUp: ['איך מוצאים את הלקוחות הראשונים?', 'מה כדאי לשאול בראיון לקוח?', 'איך קובעים מחיר ראשון?'],
  },
};

const SHORT_KEYS = new Set(['title', 'heading', 'label', 'name', 'expenseLabel', 'costLabel', 'category', 'objective']);

function clip(text, max) {
  if (typeof max !== 'number' || text.length <= max) return text;
  return text.slice(0, Math.max(1, max)).trim() || text.slice(0, max);
}

/** Collects every string in a value (system blocks, message content, tool results). */
function collectText(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectText(v, out);
  else if (value && typeof value === 'object') {
    if (typeof value.text === 'string') out.push(value.text);
    if (value.content !== undefined) collectText(value.content, out);
  }
  return out;
}

export function detectLanguage(body) {
  const text = [...collectText(body.system ?? []), ...collectText(body.messages ?? [])].join('\n');
  if (HEBREW.test(text) || /locale\W{0,3}he\b/i.test(text)) return 'he';
  return 'en';
}

/* ------------------------------------------------------------------------------------------ */
/* JSON Schema sample generator                                                               */
/* ------------------------------------------------------------------------------------------ */

/** Reads the `Constraints: {...}` suffix that structured-output helpers put into descriptions. */
export function readConstraints(description) {
  if (typeof description !== 'string') return {};
  const idx = description.lastIndexOf('Constraints: ');
  if (idx < 0) return {};
  try {
    const parsed = JSON.parse(description.slice(idx + 'Constraints: '.length));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function constraintOf(schema, key) {
  if (schema[key] !== undefined) return schema[key];
  return readConstraints(schema.description)[key];
}

function nextCount(ctx, key) {
  const n = ctx.counters.get(key) ?? 0;
  ctx.counters.set(key, n + 1);
  return n;
}

function resolveRef(schema, ctx) {
  const ref = schema.$ref;
  const match = /^#\/(\$defs|definitions)\/(.+)$/.exec(ref);
  const target = match ? ctx.root?.[match[1]]?.[match[2]] : undefined;
  if (!target) throw new Error(`unresolvable $ref ${ref}`);
  return target;
}

const NUMBER_HINTS = {
  offset_days: (n) => 3 + ((n * 9) % 85),
  milestone_index: () => 0,
  due_in_days: (n) => 7 + n * 7,
  dueInDays: (n) => 7 + n * 7,
  monthly_growth_pct: () => 5,
  monthlyGrowthPct: () => 5,
  unit_price: (n) => 120 + n * 30,
  unit_variable_cost: (n) => 35 + n * 5,
  monthly_units: (n) => 20 + n * 10,
  amount: (n) => 1500 + n * 500,
  monthly_amount: (n) => 250 + n * 100,
  starting_capital: () => 20000,
  amountMinor: (n) => 150000 + n * 10000,
  monthlyAmountMinor: (n) => 25000 + n * 5000,
};

function sampleNumber(schema, ctx, key, integer) {
  const n = nextCount(ctx, `num:${key}`);
  const min = constraintOf(schema, 'minimum');
  const max = constraintOf(schema, 'maximum');
  let value = NUMBER_HINTS[key] ? NUMBER_HINTS[key](n) : 1 + n;
  if (typeof min === 'number' && value < min) value = min;
  if (typeof max === 'number' && value > max) value = max;
  return integer ? Math.round(value) : value;
}

function sampleString(schema, ctx, key) {
  const maxLength = constraintOf(schema, 'maxLength');
  if (key === 'ref') {
    const ref = `t${ctx.refs.length + 1}`;
    ctx.refs.push(ref);
    return ref;
  }
  if (schema.format === 'date') return '2026-01-15';
  if (schema.format === 'date-time') return '2026-01-15T09:00:00Z';
  if (schema.format === 'uri') return 'https://example.com/';
  const t = TEXT[ctx.lang];
  const n = nextCount(ctx, `str:${key}`);
  if (key === 'follow_ups' || key === 'followUps') return clip(t.followUp[n % t.followUp.length], maxLength);
  const pool = SHORT_KEYS.has(key) ? t.short : t.sentence;
  return clip(pool[n % pool.length], maxLength);
}

function sampleArray(schema, ctx, key) {
  if (key === 'depends_on') {
    // Depend on the task generated just before this one (exercises dependency wiring).
    const prev = ctx.refs.length >= 2 ? ctx.refs[ctx.refs.length - 2] : null;
    return prev ? [prev] : [];
  }
  const min = Math.max(Number(schema.minItems ?? 0), Number(readConstraints(schema.description).minItems ?? 0));
  const max = constraintOf(schema, 'maxItems');
  const preferred = key === 'milestones' || key === 'follow_ups' || key === 'actions' ? 2 : 3;
  let count = Math.max(min, preferred);
  if (typeof max === 'number') count = Math.min(count, max);
  const items = schema.items ?? { type: 'string' };
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(sampleValue(items, ctx, key, i));
  return out;
}

export function sampleValue(schema, ctx, key = '', index = 0) {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.$ref) return sampleValue(resolveRef(schema, ctx), ctx, key, index);
  if (schema.const !== undefined) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[nextCount(ctx, `enum:${key}`) % schema.enum.length];
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    const nonNull = schema.anyOf.filter((v) => v && v.type !== 'null');
    if (nonNull.length === 0) return null;
    const choice = nonNull.length === 1 ? nonNull[0] : nonNull[nextCount(ctx, `anyOf:${key}`) % nonNull.length];
    return sampleValue(choice, ctx, key, index);
  }
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') ?? 'null' : schema.type;
  switch (type) {
    case 'object': {
      const out = {};
      for (const [prop, propSchema] of Object.entries(schema.properties ?? {})) out[prop] = sampleValue(propSchema, ctx, prop, index);
      return out;
    }
    case 'array':
      return sampleArray(schema, ctx, key);
    case 'string':
      return sampleString(schema, ctx, key);
    case 'integer':
      return sampleNumber(schema, ctx, key, true);
    case 'number':
      return sampleNumber(schema, ctx, key, false);
    case 'boolean':
      return nextCount(ctx, `bool:${key}`) % 2 === 0;
    case 'null':
      return null;
    default:
      return null;
  }
}

/** Deterministic schema-valid sample for a JSON Schema. */
export function generateSample(schema, { lang = 'en' } = {}) {
  const ctx = { lang, root: schema, counters: new Map(), refs: [] };
  return sampleValue(schema, ctx, '', 0);
}

/** Returns an error message when a schema uses features structured outputs reject, else null. */
export function validateStrictSchema(schema, path = '$') {
  if (!schema || typeof schema !== 'object') return `${path}: schema must be an object`;
  for (const kw of UNSUPPORTED_SCHEMA_KEYWORDS) {
    if (schema[kw] !== undefined) return `${path}: unsupported keyword '${kw}'`;
  }
  if (schema.minItems !== undefined && schema.minItems !== 0 && schema.minItems !== 1) {
    return `${path}: minItems must be 0 or 1`;
  }
  if (schema.type === 'object') {
    if (schema.additionalProperties !== false) return `${path}: objects must set additionalProperties: false`;
    for (const [k, v] of Object.entries(schema.properties ?? {})) {
      const err = validateStrictSchema(v, `${path}.${k}`);
      if (err) return err;
    }
  }
  if (schema.items) {
    const err = validateStrictSchema(schema.items, `${path}[]`);
    if (err) return err;
  }
  for (const [i, v] of (schema.anyOf ?? []).entries()) {
    const err = validateStrictSchema(v, `${path}.anyOf[${i}]`);
    if (err) return err;
  }
  for (const [name, v] of Object.entries(schema.$defs ?? {})) {
    const err = validateStrictSchema(v, `${path}.$defs.${name}`);
    if (err) return err;
  }
  return null;
}

/* ------------------------------------------------------------------------------------------ */
/* Request validation                                                                         */
/* ------------------------------------------------------------------------------------------ */

function validateRequest(body, headers) {
  if (!body || typeof body !== 'object') return 'body must be a JSON object';
  if (typeof body.model !== 'string' || body.model === '') return 'model: Field required';
  if (!Number.isInteger(body.max_tokens) || body.max_tokens < 1) return 'max_tokens: Field required';
  if (!Array.isArray(body.messages) || body.messages.length === 0) return 'messages: at least one message is required';
  for (const p of ['temperature', 'top_p', 'top_k']) {
    if (body[p] !== undefined) return `${p}: sampling parameters are not supported for this model`;
  }
  if (body.thinking !== undefined) {
    if (!body.thinking || body.thinking.type !== 'adaptive' || body.thinking.budget_tokens !== undefined) {
      return 'thinking: only {"type": "adaptive"} is supported for this model';
    }
  }
  if (body.tool_choice && (body.tool_choice.type === 'any' || body.tool_choice.type === 'tool')) {
    return 'tool_choice: type "tool" and "any" are not supported for this model.';
  }
  const last = body.messages[body.messages.length - 1];
  if (!last || last.role !== 'user') return 'messages: the final message must be a user message (assistant prefill is not supported)';
  if (body.messages[0]?.role !== 'user') return 'messages: the first message must use the user role';
  const betas = String(headers['anthropic-beta'] ?? '').split(',').map((s) => s.trim());
  if (body.fallbacks !== undefined) {
    if (body.fallbacks === 'default' && !betas.includes(FALLBACK_BETA)) {
      return `fallbacks: "default" requires the ${FALLBACK_BETA} beta header`;
    }
    if (body.fallbacks !== 'default' && !Array.isArray(body.fallbacks)) return 'fallbacks: must be "default" or an array';
  }
  const effort = body.output_config?.effort;
  if (effort !== undefined && !['low', 'medium', 'high', 'xhigh', 'max'].includes(effort)) return 'output_config.effort: invalid value';
  const format = body.output_config?.format;
  if (format !== undefined && format !== null) {
    if (format.type !== 'json_schema' || typeof format.schema !== 'object') return 'output_config.format: expected json_schema';
    const err = validateStrictSchema(format.schema);
    if (err) return `output_config.format.schema ${err}`;
  }
  for (const tool of body.tools ?? []) {
    if (typeof tool.name !== 'string' || !tool.input_schema) return 'tools: name and input_schema are required';
    if (tool.strict) {
      const err = validateStrictSchema(tool.input_schema);
      if (err) return `tools.${tool.name}.input_schema ${err}`;
    }
  }
  return null;
}

/* ------------------------------------------------------------------------------------------ */
/* Response building                                                                          */
/* ------------------------------------------------------------------------------------------ */

let messageSeq = 0;
const cacheKeys = new Set();

function approxTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function usageFor(body, outputText) {
  const cached = [];
  for (const block of Array.isArray(body.system) ? body.system : []) {
    cached.push(block?.text ?? '');
    if (block?.cache_control) break;
  }
  const hasCacheBreakpoint = Array.isArray(body.system) && body.system.some((b) => b?.cache_control);
  const cachedText = hasCacheBreakpoint ? cached.join('') : '';
  const totalIn = approxTokens(JSON.stringify({ system: body.system, messages: body.messages, tools: body.tools, f: body.output_config }));
  const cachedTokens = cachedText ? approxTokens(cachedText) : 0;
  let cacheRead = 0;
  let cacheWrite = 0;
  if (cachedTokens > 0) {
    const key = `${body.model}:${cachedText}`;
    if (cacheKeys.has(key)) cacheRead = cachedTokens;
    else {
      cacheKeys.add(key);
      cacheWrite = cachedTokens;
    }
  }
  return {
    input_tokens: Math.max(1, totalIn - cachedTokens),
    output_tokens: approxTokens(outputText),
    cache_creation_input_tokens: cacheWrite,
    cache_read_input_tokens: cacheRead,
  };
}

function scenarioOf(body) {
  const text = collectText(body.messages ?? []).join('\n');
  for (const s of ['refusal', 'max_tokens', 'invalid_json', 'fallback']) {
    if (text.includes(`[[fake:${s}]]`)) return s;
  }
  return null;
}

/** Builds the full message (content blocks, stop reason, usage) for a valid request. */
export function buildMessage(body) {
  const lang = detectLanguage(body);
  const scenario = scenarioOf(body);
  const format = body.output_config?.format;
  const tools = Array.isArray(body.tools) ? body.tools : [];
  const proposeTool = tools.find((t) => t.name === 'propose_actions');
  messageSeq += 1;
  const id = `msg_fake_${String(messageSeq).padStart(6, '0')}`;
  let model = body.model;

  const content = [{ type: 'thinking', thinking: '', signature: `fake-signature-${messageSeq}` }];
  let stopReason = 'end_turn';
  let stopDetails = null;
  let outputText = '';

  if (scenario === 'refusal') {
    stopReason = 'refusal';
    stopDetails = { type: 'refusal', category: 'cyber', explanation: 'Declined by the fake server for testing.' };
    content.length = 0;
  } else if (format?.type === 'json_schema') {
    outputText = scenario === 'invalid_json' ? 'this is not JSON' : JSON.stringify(generateSample(format.schema, { lang }));
    if (scenario === 'max_tokens') {
      outputText = outputText.slice(0, Math.max(1, Math.floor(outputText.length / 2)));
      stopReason = 'max_tokens';
    }
    content.push({ type: 'text', text: outputText });
  } else {
    outputText = TEXT[lang].reply;
    if (scenario === 'max_tokens') {
      outputText = outputText.slice(0, Math.floor(outputText.length / 2));
      stopReason = 'max_tokens';
    }
    content.push({ type: 'text', text: outputText });
    if (proposeTool && stopReason === 'end_turn') {
      const input = generateSample(proposeTool.input_schema, { lang });
      content.push({ type: 'tool_use', id: `toolu_fake_${String(messageSeq).padStart(6, '0')}`, name: proposeTool.name, input });
      outputText += JSON.stringify(input);
      stopReason = 'tool_use';
    }
  }

  const usage = usageFor(body, outputText);
  if (scenario === 'fallback') {
    const fallbackModel = 'claude-opus-5';
    content.unshift({ type: 'fallback', from: { model }, to: { model: fallbackModel } });
    usage.iterations = [
      { type: 'message', model, input_tokens: usage.input_tokens, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      {
        type: 'fallback_message',
        model: fallbackModel,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    ];
    model = fallbackModel;
  }
  return {
    id,
    type: 'message',
    role: 'assistant',
    model,
    content,
    stop_reason: stopReason,
    stop_sequence: null,
    stop_details: stopDetails,
    usage,
  };
}

function chunks(text, size) {
  const out = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out.length > 0 ? out : [''];
}

/** SSE events for a message, in the order the real API emits them. */
export function streamEvents(message) {
  const events = [];
  const startUsage = { ...message.usage, output_tokens: 1 };
  delete startUsage.iterations;
  events.push(['message_start', { type: 'message_start', message: { ...message, content: [], stop_reason: null, stop_details: null, usage: startUsage } }]);
  message.content.forEach((block, index) => {
    if (block.type === 'text') {
      events.push(['content_block_start', { type: 'content_block_start', index, content_block: { type: 'text', text: '' } }]);
      for (const part of chunks(block.text, 24)) {
        events.push(['content_block_delta', { type: 'content_block_delta', index, delta: { type: 'text_delta', text: part } }]);
      }
    } else if (block.type === 'tool_use') {
      events.push(['content_block_start', { type: 'content_block_start', index, content_block: { type: 'tool_use', id: block.id, name: block.name, input: {} } }]);
      for (const part of chunks(JSON.stringify(block.input), 32)) {
        events.push(['content_block_delta', { type: 'content_block_delta', index, delta: { type: 'input_json_delta', partial_json: part } }]);
      }
    } else if (block.type === 'thinking') {
      events.push(['content_block_start', { type: 'content_block_start', index, content_block: { type: 'thinking', thinking: '', signature: '' } }]);
      events.push(['content_block_delta', { type: 'content_block_delta', index, delta: { type: 'signature_delta', signature: block.signature } }]);
    } else {
      events.push(['content_block_start', { type: 'content_block_start', index, content_block: block }]);
    }
    events.push(['content_block_stop', { type: 'content_block_stop', index }]);
  });
  const deltaUsage = { output_tokens: message.usage.output_tokens };
  if (message.usage.iterations) deltaUsage.iterations = message.usage.iterations;
  events.push([
    'message_delta',
    {
      type: 'message_delta',
      delta: { stop_reason: message.stop_reason, stop_sequence: null, stop_details: message.stop_details },
      usage: deltaUsage,
    },
  ]);
  events.push(['message_stop', { type: 'message_stop' }]);
  return events;
}

/* ------------------------------------------------------------------------------------------ */
/* HTTP server                                                                                */
/* ------------------------------------------------------------------------------------------ */

function apiError(res, status, type, message, extraHeaders = {}) {
  const body = JSON.stringify({ type: 'error', error: { type, message }, request_id: `req_fake_${Date.now()}` });
  res.writeHead(status, { 'content-type': 'application/json', 'request-id': `req_fake_${Date.now()}`, ...extraHeaders });
  res.end(body);
}

function apiKeyOf(headers) {
  const direct = headers['x-api-key'];
  if (typeof direct === 'string' && direct) return direct;
  const auth = headers.authorization;
  const m = typeof auth === 'string' ? /^Bearer\s+(.+)$/i.exec(auth) : null;
  return m ? m[1].trim() : '';
}

const KEY_SCENARIOS = {
  'fake-key-invalid': [401, 'authentication_error', 'invalid x-api-key'],
  'fake-key-rate-limit': [429, 'rate_limit_error', 'Number of request tokens has exceeded your rate limit (fake).'],
  'fake-key-overloaded': [529, 'overloaded_error', 'Overloaded (fake).'],
  'fake-key-bad-request': [400, 'invalid_request_error', 'Bad request (fake).'],
};

export function createFakeAnthropicServer({ log = process.env.FAKE_ANTHROPIC_QUIET !== '1', delayMs = Number(process.env.FAKE_ANTHROPIC_DELAY_MS ?? 0) } = {}) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const started = Date.now();
    const done = (status, extra = {}) => {
      if (log) {
        console.log(JSON.stringify({ fake: 'anthropic', ts: new Date().toISOString(), method: req.method, path: url.pathname, status, ms: Date.now() - started, ...extra }));
      }
    };
    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
      return done(200);
    }
    if (req.method !== 'POST' || url.pathname !== '/v1/messages') {
      apiError(res, 404, 'not_found_error', `Not found: ${req.method} ${url.pathname}`);
      return done(404);
    }
    const parts = [];
    req.on('data', (c) => parts.push(c));
    req.on('end', () => {
      const key = apiKeyOf(req.headers);
      if (!key) {
        apiError(res, 401, 'authentication_error', 'x-api-key header is required');
        return done(401);
      }
      const keyScenario = KEY_SCENARIOS[key];
      if (keyScenario) {
        apiError(res, keyScenario[0], keyScenario[1], keyScenario[2], keyScenario[0] === 429 ? { 'retry-after': '0' } : {});
        return done(keyScenario[0], { scenario: key });
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(parts).toString('utf8'));
      } catch {
        apiError(res, 400, 'invalid_request_error', 'Request body is not valid JSON');
        return done(400);
      }
      const invalid = validateRequest(body, req.headers);
      if (invalid) {
        apiError(res, 400, 'invalid_request_error', invalid);
        return done(400, { error: invalid, model: body?.model });
      }
      const message = buildMessage(body);
      const meta = {
        model: body.model,
        stream: body.stream === true,
        structured: body.output_config?.format?.type === 'json_schema',
        tools: (body.tools ?? []).map((t) => t.name),
        effort: body.output_config?.effort ?? null,
        lang: detectLanguage(body),
        stop_reason: message.stop_reason,
      };
      const send = () => {
        if (body.stream === true) {
          res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', 'request-id': `req_${message.id}` });
          for (const [event, data] of streamEvents(message)) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          res.end();
        } else {
          res.writeHead(200, { 'content-type': 'application/json', 'request-id': `req_${message.id}` });
          res.end(JSON.stringify(message));
        }
        done(200, meta);
      };
      if (delayMs > 0) setTimeout(send, delayMs);
      else send();
    });
  });
  return server;
}

const isMain = typeof process !== 'undefined' && process.argv?.[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.env.PORT ?? 8787);
  const host = process.env.HOST ?? '0.0.0.0';
  const server = createFakeAnthropicServer();
  server.listen(port, host, () => {
    console.log(`fake-anthropic listening on http://${host}:${port}`);
  });
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
