import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig, root } from './src/config.js';
import { providerDefs, openChat, ProviderError } from './src/providers.js';
import { createRegistry } from './src/registry.js';
import { SECURITY_HEADERS, createLimiter, safeEqual, validateChat } from './src/security.js';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
const BODY_LIMIT = 256 * 1024;
const MAX_STREAMS_PER_IP = 6;

export function createApp({ config = loadConfig(), providers = providerDefs(config.env), registry, fetchImpl = fetch, publicDir = path.join(root, 'public') } = {}) {
  registry ||= createRegistry({ providers, fetchImpl, snapshotPath: path.join(root, 'data', 'models.snapshot.json'), log: m => console.warn(m) });
  const chatLimiter = createLimiter({ max: 40 });
  const streams = new Map();
  let lastManualRefresh = 0;

  const json = (res, status, body) => {
    res.writeHead(status, { 'content-type': MIME['.json'], 'cache-control': 'no-store', ...SECURITY_HEADERS });
    res.end(JSON.stringify(body));
  };
  const fail = (res, status, code, message) => json(res, status, { error: { code, message: message || code } });
  const clientIp = req => (config.trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';

  const providerStatus = p => {
    const cat = registry.providerCatalog(p.id);
    if (p.kind === 'local') return cat?.ok ? 'ready' : 'unreachable';
    return p.hasKey ? 'ready' : 'needs_key';
  };

  async function readJson(req) {
    let size = 0;
    const chunks = [];
    for await (const c of req) {
      size += c.length;
      if (size > BODY_LIMIT) throw Object.assign(new Error('too_large'), { status: 413 });
      chunks.push(c);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('invalid_json'), { status: 400 }); }
  }

  // Access control exists to protect the host's provider keys. A caller who brings their own key is
  // spending their own money, so it does not need the access code.
  const authorized = (req, usesOwnKey) =>
    !config.accessCode || usesOwnKey || safeEqual(req.headers['x-access-code'] || '', config.accessCode);

  async function chat(req, res) {
    const ip = clientIp(req);
    if (!chatLimiter(ip)) return fail(res, 429, 'rate_limited', 'Too many requests, slow down');
    let body;
    try { body = await readJson(req); } catch (e) { return fail(res, e.status || 400, e.message); }
    const v = validateChat(body);
    if (v.error) return fail(res, 400, v.error);
    const { model: modelId, provider: wanted, messages, params } = v.value;

    const model = registry.get(modelId);
    if (!model) return fail(res, 404, 'unknown_model', 'Model is not in the catalog');
    const ownKey = String(req.headers['x-provider-key'] || '').slice(0, 500);
    const usable = r => {
      const p = providers.find(x => x.id === r.provider);
      return p && (p.kind === 'local' ? providerStatus(p) === 'ready' : p.hasKey || ownKey);
    };
    const route = wanted ? model.routes.find(r => r.provider === wanted) : model.routes.find(usable);
    if (!route) return fail(res, 400, 'no_route', wanted ? 'This model is not offered by that provider' : 'No provider available for this model');
    const provider = providers.find(p => p.id === route.provider);
    if (!usable(route)) return fail(res, 400, 'no_provider_key', `Add an API key for ${provider.name} (Settings), or configure it on the server`);
    if (!authorized(req, Boolean(ownKey))) return fail(res, 401, 'access_code', 'Access code required');
    if ((streams.get(ip) || 0) >= MAX_STREAMS_PER_IP) return fail(res, 429, 'too_many_streams', 'Too many parallel streams');

    const ctl = new AbortController();
    res.on('close', () => { if (!res.writableEnded) ctl.abort(); });
    const signal = AbortSignal.any([ctl.signal, AbortSignal.timeout(5 * 60 * 1000)]);
    streams.set(ip, (streams.get(ip) || 0) + 1);
    try {
      const events = await openChat({ provider, apiKey: ownKey || provider.key, modelId: route.modelId, messages, params, signal, fetchImpl });
      res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no', ...SECURITY_HEADERS });
      const send = o => res.write(`data: ${JSON.stringify(o)}\n\n`);
      send({ type: 'start', provider: provider.id, providerName: provider.name, model: model.id });
      try {
        for await (const ev of events) send(ev);
        send({ type: 'done' });
      } catch (e) {
        if (!ctl.signal.aborted) send({ type: 'error', message: e instanceof ProviderError ? e.message : 'Stream interrupted' });
      }
      res.end();
    } catch (e) {
      if (ctl.signal.aborted) return res.end();
      if (e instanceof ProviderError) return fail(res, e.status, e.code, e.message);
      console.error('chat_failed', e?.message);
      fail(res, 502, 'provider_error', 'Provider request failed');
    } finally {
      const n = (streams.get(ip) || 1) - 1;
      if (n <= 0) streams.delete(ip); else streams.set(ip, n);
    }
  }

  function serveStatic(req, res, pathname) {
    const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.resolve(publicDir, rel);
    if (!file.startsWith(publicDir + path.sep)) return fail(res, 404, 'not_found');
    fs.readFile(file, (err, data) => {
      if (err) return fail(res, 404, 'not_found');
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache', ...SECURITY_HEADERS });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://x');
      if (pathname === '/api/health') return json(res, 200, { ok: true, models: registry.list().length, source: registry.status().source });
      if (pathname === '/api/config') return json(res, 200, { accessRequired: Boolean(config.accessCode) });
      if (pathname === '/api/providers') {
        return json(res, 200, providers.map(p => ({ id: p.id, name: p.name, kind: p.kind, status: providerStatus(p), keyUrl: p.keyUrl || null, models: registry.providerCatalog(p.id)?.models.length ?? (p.id === 'openrouter' ? registry.list().filter(m => !m.providerOnly).length : 0) })));
      }
      if (pathname === '/api/models' && req.method === 'GET') {
        return json(res, 200, { ...registry.status(), families: registry.families(), models: registry.list() });
      }
      if (pathname === '/api/refresh' && req.method === 'POST') {
        if (!authorized(req, false)) return fail(res, 401, 'access_code', 'Access code required');
        if (Date.now() - lastManualRefresh < 60000) return fail(res, 429, 'cooldown', 'Catalog was refreshed less than a minute ago');
        lastManualRefresh = Date.now();
        return json(res, 200, await registry.refresh());
      }
      if (pathname === '/api/chat' && req.method === 'POST') return await chat(req, res);
      if (pathname.startsWith('/api/')) return fail(res, 404, 'not_found');
      if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'method_not_allowed');
      return serveStatic(req, res, pathname);
    } catch (e) {
      console.error('request_failed', e?.message);
      if (!res.headersSent) fail(res, 500, 'internal_error');
      else res.end();
    }
  });
  return { server, registry, providers };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const config = loadConfig();
  const { server, registry, providers } = createApp({ config });
  const refresh = () => registry.refresh().then(s => console.log(`catalog: ${s.count} models (${s.source})`));
  server.listen(config.port, () => {
    console.log(`OpenModels Hub on http://localhost:${config.port}`);
    const keyed = providers.filter(p => p.hasKey).map(p => p.name);
    console.log(`providers with server keys: ${keyed.join(', ') || 'none (users bring their own key, or use local Ollama)'}`);
    if (keyed.length && !config.accessCode && config.production) console.warn('WARNING: server provider keys are set but HUB_ACCESS_CODE is empty – anyone who can reach this server can spend them.');
    refresh();
    setInterval(refresh, config.refreshMinutes * 60000).unref();
  });
}
