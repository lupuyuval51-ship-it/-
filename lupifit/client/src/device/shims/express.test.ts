/**
 * The Express shim against real Express 5: the same app definition is mounted on both, the same
 * requests are sent (real Express over HTTP, the shim through `dispatch`), and status, headers that
 * matter and bodies must be equal. Plus the routing and body-parsing details the server relies on.
 */
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import type { Server } from 'node:http';
import querystring from 'node:querystring';
import realExpress from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express, { createDispatcher, dispatch, parseBytes, parseQueryString, Router, type Application, type DispatchRequest } from './express';

type AnyApp = { use: (...a: unknown[]) => unknown; get: (...a: unknown[]) => unknown; post: (...a: unknown[]) => unknown; delete: (...a: unknown[]) => unknown };
type Req = { [k: string]: unknown; params: Record<string, string>; query: Record<string, unknown>; body: unknown; get(h: string): string | undefined; is(t: string): unknown };
type Res = {
  status(c: number): Res;
  json(b: unknown): Res;
  send(b?: unknown): Res;
  end(): Res;
  type(t: string): Res;
  setHeader(n: string, v: string): Res;
  cookie(n: string, v: string, o: object): Res;
  clearCookie(n: string, o: object): Res;
  headersSent: boolean;
};
type Next = (e?: unknown) => void;

/** One app definition, built with either implementation. */
function define(lib: { (): unknown; json: (o: object) => unknown; Router: () => unknown }) {
  const app = lib() as AnyApp & { disable(n: string): void; set(n: string, v: unknown): void };
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  const api = lib.Router() as AnyApp;
  api.post('/big', lib.json({ limit: '1kb', strict: true }) as never, (_req: Req, _res: Res, next: Next) => next());
  api.use(lib.json({ limit: '100b', strict: true }));
  api.get('/items/:id/parts/:partId', (req: Req, res: Res) => res.json({ params: req.params }));
  api.get('/query', (req: Req, res: Res) => res.json({ query: { ...req.query } }));
  api.post('/echo', (req: Req, res: Res) => res.status(201).json({ body: req.body ?? null, isJson: req.is('application/json') }));
  api.post('/big', (req: Req, res: Res) => res.json({ size: JSON.stringify(req.body).length }));
  api.get('/text', (_req: Req, res: Res) => res.type('application/json').send(JSON.stringify({ pretty: true }, null, 2)));
  api.get('/html', (_req: Req, res: Res) => res.send('<p>hi</p>'));
  api.delete('/nothing', (_req: Req, res: Res) => res.status(204).end());
  api.get('/cookie', (_req: Req, res: Res) =>
    res.cookie('fitai_session', 'tok_en-123', { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 365 * 24 * 3600 * 1000 }).json({ ok: true }),
  );
  api.get('/clear', (_req: Req, res: Res) => res.clearCookie('fitai_session', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' }).json({ ok: true }));
  api.get('/throw', () => {
    throw Object.assign(new Error('sync boom'), { status: 418 });
  });
  api.get('/reject', async () => {
    throw new Error('async boom');
  });
  api.get(
    '/route-skip',
    (_req: Req, _res: Res, next: Next) => next('route'),
    (_req: Req, res: Res) => res.json({ handler: 'second' }),
  );
  api.get('/route-skip', (_req: Req, res: Res) => res.json({ handler: 'next route' }));
  api.use((req: Req, _res: Res, next: Next) => next(Object.assign(new Error('not found'), { status: 404, path: req.path })));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  api.use((err: { status?: number; type?: string; message: string }, _req: Req, res: Res, _next: Next) => {
    if (res.headersSent) return;
    res.status(err.status ?? 500).json({ error: err.type ?? err.message });
  });
  app.use('/api', api);
  return app;
}

let server: Server;
let baseUrl: string;
const shim = define(express as never) as unknown as Application;

beforeAll(async () => {
  server = (define(realExpress as never) as unknown as { listen(p: number, h: string): Server }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const KEPT_HEADERS = ['content-type', 'content-length', 'set-cookie', 'x-powered-by', 'content-disposition'];

async function viaExpress(r: DispatchRequest) {
  const res = await fetch(baseUrl + r.url, {
    method: r.method,
    headers: Object.fromEntries(Object.entries(r.headers ?? {}).map(([k, v]) => [k, String(v)])),
    body: r.body ?? undefined,
  });
  const headers: [string, string][] = [];
  res.headers.forEach((v, k) => {
    if (KEPT_HEADERS.includes(k) && k !== 'set-cookie') headers.push([k, v]);
  });
  for (const c of res.headers.getSetCookie()) headers.push(['set-cookie', c]);
  return { status: res.status, headers: normalize(headers), body: await res.text() };
}

async function viaShim(r: DispatchRequest) {
  const res = await dispatch(shim, r);
  const headers = res.headers.filter(([k]) => KEPT_HEADERS.includes(k.toLowerCase())).map(([k, v]) => [k.toLowerCase(), v] as [string, string]);
  return { status: res.status, headers: normalize(headers), body: typeof res.body === 'string' ? res.body : '' };
}

/** Expires depends on the clock: compare it to the second. */
const normalize = (headers: [string, string][]) =>
  headers
    .map(([k, v]) => [k, v.replace(/Expires=([^;]+)/, (_m, d: string) => `Expires=${Math.round(Date.parse(d) / 10_000)}`)] as const)
    .sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));

const json = (body: unknown, extra: Record<string, string> = {}): Pick<DispatchRequest, 'headers' | 'body'> => ({
  headers: { 'content-type': 'application/json', ...extra },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const CASES: [string, DispatchRequest][] = [
  ['params are decoded', { method: 'GET', url: '/api/items/a%20b/parts/%E2%9C%93' }],
  ['paths are case-insensitive with an optional trailing slash', { method: 'GET', url: '/API/Items/x/PARTS/y/' }],
  ['a bad param encoding is a 400', { method: 'GET', url: '/api/items/%E0%A4%A/parts/1' }],
  ['simple query parser', { method: 'GET', url: '/api/query?a=1&a=2&b=x+y&c=%E2%9C%93&d=&e&f=%zz' }],
  ['JSON body', { method: 'POST', url: '/api/echo', ...json({ a: 1, s: 'שלום' }) }],
  ['JSON with charset', { method: 'POST', url: '/api/echo', ...json({ a: 1 }, { 'content-type': 'application/json; charset=UTF-8' }) }],
  ['empty JSON body is {}', { method: 'POST', url: '/api/echo', ...json('') }],
  ['malformed JSON', { method: 'POST', url: '/api/echo', ...json('{"a":') }],
  ['strict mode refuses a primitive', { method: 'POST', url: '/api/echo', ...json('"text"') }],
  ['too large', { method: 'POST', url: '/api/echo', ...json({ s: 'x'.repeat(200) }) }],
  ['a larger limit on one route, then the general parser skips the parsed body', { method: 'POST', url: '/api/big', ...json({ s: 'x'.repeat(500) }) }],
  ['unsupported charset', { method: 'POST', url: '/api/echo', ...json('{}', { 'content-type': 'application/json; charset=latin1' }) }],
  ['non-JSON content type is not parsed', { method: 'POST', url: '/api/echo', headers: { 'content-type': 'text/plain' }, body: 'hello' }],
  ['no body', { method: 'POST', url: '/api/echo' }],
  ['type().send() keeps a pretty JSON string', { method: 'GET', url: '/api/text' }],
  ['a string body defaults to html', { method: 'GET', url: '/api/html' }],
  ['204 has no body', { method: 'DELETE', url: '/api/nothing' }],
  ['HEAD runs the GET route without a body', { method: 'HEAD', url: '/api/html' }],
  ['session cookie', { method: 'GET', url: '/api/cookie' }],
  ['cleared cookie', { method: 'GET', url: '/api/clear' }],
  ['sync throw goes to the error middleware', { method: 'GET', url: '/api/throw' }],
  ['async rejection goes to the error middleware', { method: 'GET', url: '/api/reject' }],
  ["next('route')", { method: 'GET', url: '/api/route-skip' }],
  ['unknown API path', { method: 'GET', url: '/api/nope' }],
  ['wrong method', { method: 'PUT', url: '/api/echo', ...json({}) }],
  ['outside the router: final handler 404', { method: 'GET', url: '/elsewhere' }],
];

describe('Express shim ↔ Express 5', () => {
  it.each(CASES)('%s', async (_name, request) => {
    const [mine, theirs] = await Promise.all([viaShim(request), viaExpress(request)]);
    expect(mine.status).toBe(theirs.status);
    if (theirs.status === 404 && request.url === '/elsewhere') {
      // Express's final handler answers with an HTML page; the shim with the same message as text.
      expect(mine.body).toContain('Cannot GET /elsewhere');
      expect(theirs.body).toContain('Cannot GET /elsewhere');
      return;
    }
    expect(mine.headers).toEqual(theirs.headers);
    expect(mine.body).toBe(theirs.body);
  });
});

describe('Express shim details', () => {
  it("emits 'finish' then 'close' after the response, and dispatch resolves on finish", async () => {
    const events: string[] = [];
    const app = express();
    app.get('/x', (_req, res) => {
      res.on('finish', () => events.push('finish'));
      res.on('close', () => events.push('close'));
      res.json({ ok: true });
      events.push('after json');
    });
    const res = await dispatch(app, { method: 'GET', url: '/x' });
    expect(res.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events).toEqual(['after json', 'finish', 'close']);
  });

  it('refuses headers after the response is sent, like Node', async () => {
    let error: unknown;
    const app = express();
    app.get('/x', (_req, res) => {
      res.json({ ok: true });
      try {
        res.setHeader('X-Late', '1');
      } catch (err) {
        error = err;
      }
    });
    await dispatch(app, { method: 'GET', url: '/x' });
    expect(error).toMatchObject({ code: 'ERR_HTTP_HEADERS_SENT' });
  });

  it('mounts routers: baseUrl, originalUrl and path like Express', async () => {
    const seen: Record<string, string>[] = [];
    const app = express();
    const outer = Router();
    const inner = Router();
    inner.get('/leaf/:id', (req, res) => {
      seen.push({ url: req.url, baseUrl: req.baseUrl, originalUrl: req.originalUrl, path: req.path, id: req.params.id! });
      res.json({});
    });
    outer.use('/inner', inner);
    app.use('/outer', outer);
    await dispatch(app, { method: 'GET', url: '/outer/inner/leaf/7?x=1' });
    expect(seen).toEqual([{ url: '/leaf/7?x=1', baseUrl: '/outer/inner', originalUrl: '/outer/inner/leaf/7?x=1', path: '/leaf/7', id: '7' }]);
  });

  it("supports next('router') and keeps request properties set by middleware", async () => {
    const app = express();
    const r = Router();
    r.use((_req, _res, next) => next('router'));
    r.get('/a', (_req, res) => res.json({ from: 'router' }));
    app.use((req, _res, next) => {
      req.requestId = 'rid-1';
      next();
    });
    app.use(r);
    app.get('/a', (req, res) => res.json({ from: 'app', rid: req.requestId }));
    const res = await dispatch(app, { method: 'GET', url: '/a' });
    expect(JSON.parse(res.body as string)).toEqual({ from: 'app', rid: 'rid-1' });
  });

  it('reports headers, ip and protocol the server reads', async () => {
    const app = express();
    app.get('/x', (req, res) =>
      res.json({ ua: req.get('User-Agent'), ref: req.get('referrer'), ip: req.ip, remote: req.socket.remoteAddress, protocol: req.protocol, is: req.is('json') }),
    );
    const res = await dispatch(app, { method: 'GET', url: 'https://localhost/x', headers: { 'User-Agent': 'LUPU-FIT device', Referer: 'r' } });
    expect(JSON.parse(res.body as string)).toEqual({ ua: 'LUPU-FIT device', ref: 'r', ip: '127.0.0.1', remote: '127.0.0.1', protocol: 'https', is: null });
    expect(res.headers).toContainEqual(['X-Powered-By', 'Express']);
  });

  it('runs dispatched requests strictly one at a time, in order', async () => {
    const app = express();
    const log: string[] = [];
    app.get('/slow/:n', async (req, res) => {
      log.push(`start ${req.params.n}`);
      await new Promise((resolve) => setTimeout(resolve, 20 - Number(req.params.n) * 5));
      log.push(`end ${req.params.n}`);
      res.json({ n: Number(req.params.n) });
    });
    const send = createDispatcher(app);
    const results = await Promise.all([1, 2, 3].map((n) => send({ method: 'GET', url: `/slow/${n}` })));
    expect(results.map((r) => JSON.parse(r.body as string).n)).toEqual([1, 2, 3]);
    expect(log).toEqual(['start 1', 'end 1', 'start 2', 'end 2', 'start 3', 'end 3']);
  });

  it('parses query strings like querystring.parse', () => {
    for (const qs of ['a=1&a=2&a=3', 'b=x+y%20z', 'c=%zz&d=%E2%9C%93', 'e&f=&=g', '__proto__=1&constructor=2', '']) {
      expect({ ...parseQueryString(qs) }).toEqual({ ...querystring.parse(qs) });
    }
  });

  it('parses body-parser limits', () => {
    expect([parseBytes('100kb'), parseBytes('8mb'), parseBytes('1.5kb'), parseBytes(42), parseBytes('10')]).toEqual([102_400, 8_388_608, 1536, 42, 10]);
    expect(() => parseBytes('lots')).toThrow(/invalid/);
  });

  it('refuses route syntax it does not implement and listen()', () => {
    expect(() => express().get('/files/*rest', () => undefined)).toThrow(/Unsupported route path/);
    expect(() => express().set('query parser', 'extended')).toThrow(/simple/);
    expect(() => express().listen(3000)).toThrow(/dispatch/);
  });
});
