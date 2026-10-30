/**
 * `express` (v5) for device mode: the server's app.ts, routers and middleware run unchanged, but
 * requests come from the app itself (`dispatch`) instead of a socket. The bundler aliases `express`
 * to this module.
 *
 * Implemented, following Express 5 / router 2 / body-parser 2:
 * - `express()`, `Router()`, `app.use/get/post/put/patch/delete/all`, `app.set/get/enable/disable`.
 * - Paths: literal segments and `:param` segments (decoded, 400 on bad encoding), case-insensitive,
 *   optional trailing slash; `use(path, …)` mounts on a prefix and strips it from `req.url`
 *   (`req.baseUrl`, `req.originalUrl` as in Express); a RegExp matches the whole path. GET routes also
 *   answer HEAD. `next('route')` and `next('router')` work.
 * - Error middleware (four parameters), errors thrown by handlers and rejected promises go to `next(err)`.
 *   Unhandled errors and unmatched requests end in a final handler (status from `err.status`, else
 *   500; 404 "Cannot GET /x").
 * - `express.json({ limit, strict, type })`: body-parser's checks and error `type`s
 *   (entity.parse.failed 400, entity.too.large 413, charset.unsupported / encoding.unsupported 415); a
 *   body is parsed once, so a second parser skips it; an empty body is `{}`; no body leaves `req.body`
 *   undefined. `express.static` does nothing (device mode serves no files).
 * - Request: method, url, originalUrl, baseUrl, path, query ('simple' parser = querystring.parse),
 *   params, body, headers, get()/header(), is(), ip, ips, protocol, secure, hostname, socket.remoteAddress.
 * - Response: statusCode, status(), setHeader/getHeader/getHeaders/hasHeader/removeHeader, set/header/get,
 *   append, type(), json(), send(), end(), cookie(), clearCookie(), headersSent, locals, and the
 *   events 'finish' then 'close' after the response ends, like Node. Content-Type gets `charset=utf-8`
 *   like Express. Not implemented (unused by the server): ETag/304 freshness, sendFile, redirect,
 *   render, OPTIONS auto-responses, signed cookies.
 *
 * `dispatch(app, request)` runs one request and resolves with `{ status, headers, body }` once the response
 * has finished; `createDispatcher(app)` runs requests strictly one at a time (FIFO), which the single
 * PGlite connection needs (see ./pg.ts).
 */

type Next = (err?: unknown) => void;
export type Handler = (req: DeviceRequest, res: DeviceResponse, next: Next) => unknown;
export type ErrorHandler = (err: unknown, req: DeviceRequest, res: DeviceResponse, next: Next) => unknown;
type AnyHandler = Handler | ErrorHandler;
type PathSpec = string | RegExp;

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all'] as const;
type Method = (typeof METHODS)[number];

// ------------------------------------------------------------------ helpers

const encoder = new TextEncoder();
const byteLength = (s: string) => encoder.encode(s).length;

function httpError(status: number, message: string, props: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(message), { status, statusCode: status, expose: status < 500, ...props });
}

/** `bytes.parse`: 100kb, 8mb… (1024-based) or a number of bytes. */
export function parseBytes(value: string | number): number {
  if (typeof value === 'number') return value;
  const m = /^\s*(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb|pb)?\s*$/i.exec(value);
  if (!m) throw new TypeError(`option limit "${value}" is invalid`);
  const unit = (m[2] ?? 'b').toLowerCase();
  const factor = { b: 1, kb: 1 << 10, mb: 1 << 20, gb: 1 << 30, tb: 1024 ** 4, pb: 1024 ** 5 }[unit as 'b'];
  return Math.floor(Number(m[1]) * factor);
}

/** `querystring.unescape`: decodeURIComponent, or byte-wise decoding that keeps malformed escapes. */
function unescapeQuery(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    const bytes: number[] = [];
    for (let i = 0; i < s.length; i++) {
      const hex = s.slice(i + 1, i + 3);
      if (s[i] === '%' && /^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
      } else bytes.push(...encoder.encode(s[i]!));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

/** Express 5's 'simple' query parser is Node's `querystring.parse` (repeated keys become arrays). */
export function parseQueryString(qs: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = Object.create(null);
  if (!qs) return out;
  let keys = 0;
  for (const part of qs.split('&')) {
    if (!part) continue;
    if (++keys > 1000) break;
    const eq = part.indexOf('=');
    const key = unescapeQuery((eq >= 0 ? part.slice(0, eq) : part).replace(/\+/g, ' '));
    const value = eq >= 0 ? unescapeQuery(part.slice(eq + 1).replace(/\+/g, ' ')) : '';
    const current = out[key];
    if (current === undefined) out[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else out[key] = [current, value];
  }
  return out;
}

const splitUrl = (url: string): { pathname: string; search: string } => {
  const q = url.indexOf('?');
  return q < 0 ? { pathname: url, search: '' } : { pathname: url.slice(0, q), search: url.slice(q + 1) };
};

const MIME_SHORTHAND: Record<string, string> = {
  html: 'text/html',
  json: 'application/json',
  text: 'text/plain',
  txt: 'text/plain',
  bin: 'application/octet-stream',
  urlencoded: 'application/x-www-form-urlencoded',
  multipart: 'multipart/*',
};

/** `mime-types.contentType`: resolves shorthands and adds charset=utf-8 to text and JSON types. */
function contentType(type: string): string {
  const full = type.includes('/') ? type : (MIME_SHORTHAND[type.toLowerCase()] ?? 'application/octet-stream');
  if (/;\s*charset=/i.test(full)) return full;
  const mime = full.split(';')[0]!.trim().toLowerCase();
  const utf8 = mime.startsWith('text/') || mime === 'application/json' || mime.endsWith('+json') || mime === 'application/javascript';
  return utf8 ? `${full}; charset=utf-8` : full;
}

function setCharset(type: string, charset: string): string {
  const [mime, ...params] = type.split(';').map((p) => p.trim());
  const rest = params.filter((p) => !/^charset=/i.test(p));
  return [mime, ...rest, `charset=${charset}`].join('; ');
}

const hasBody = (headers: Record<string, string>) => headers['transfer-encoding'] !== undefined || !Number.isNaN(Number.parseFloat(headers['content-length'] ?? ''));

function normalizeType(type: string): string {
  if (type.startsWith('+')) return `*/*${type}`;
  return type.includes('/') ? type.toLowerCase() : (MIME_SHORTHAND[type.toLowerCase()] ?? type).toLowerCase();
}

function mimeMatches(expected: string, actual: string): boolean {
  const [et, es] = expected.split('/') as [string, string | undefined];
  const [at, as] = actual.split('/') as [string, string | undefined];
  if (!es || !as) return false;
  if (et !== '*' && et !== at) return false;
  if (es.startsWith('*+')) return as.endsWith(es.slice(1));
  return es === '*' || es === as;
}

/** `type-is` for a request: the matching type, false, or null when there is no body. */
function typeIs(headers: Record<string, string>, types: string[]): string | false | null {
  if (!hasBody(headers)) return null;
  const header = headers['content-type'];
  if (!header) return false;
  const actual = header.split(';')[0]!.trim().toLowerCase();
  if (!/^[!#$%&'*+.^_`|~0-9a-z-]+\/[!#$%&'*+.^_`|~0-9a-z-]+$/.test(actual)) return false;
  if (!types.length) return actual;
  for (const t of types) {
    if (mimeMatches(normalizeType(t), actual)) return t.startsWith('+') || t.includes('*') ? actual : t;
  }
  return false;
}

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  partitioned?: boolean;
  priority?: 'low' | 'medium' | 'high';
  sameSite?: boolean | 'lax' | 'strict' | 'none';
}

/** `cookie.serialize` (cookie 0.7, attribute order included). */
function serializeCookie(name: string, value: string, opt: CookieOptions): string {
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) throw new TypeError('argument name is invalid');
  let str = `${name}=${encodeURIComponent(value)}`;
  if (opt.maxAge != null) str += `; Max-Age=${Math.floor(opt.maxAge)}`;
  if (opt.domain) str += `; Domain=${opt.domain}`;
  if (opt.path) str += `; Path=${opt.path}`;
  if (opt.expires) str += `; Expires=${opt.expires.toUTCString()}`;
  if (opt.httpOnly) str += '; HttpOnly';
  if (opt.secure) str += '; Secure';
  if (opt.partitioned) str += '; Partitioned';
  if (opt.priority) str += `; Priority=${opt.priority[0]!.toUpperCase()}${opt.priority.slice(1)}`;
  if (opt.sameSite) {
    const s = opt.sameSite === true ? 'strict' : opt.sameSite;
    str += `; SameSite=${s[0]!.toUpperCase()}${s.slice(1)}`;
  }
  return str;
}

// ------------------------------------------------------------------ request / response

export interface DispatchRequest {
  method: string;
  /** Path and query (`/api/nutrition/day?date=…`) or an absolute URL. */
  url: string;
  headers?: Record<string, string | string[] | undefined>;
  /** Request body as text (JSON); a `content-length` header is derived from it. */
  body?: string | null;
}

export interface DispatchResponse {
  status: number;
  /** In order, one entry per value (several `Set-Cookie` entries are possible). */
  headers: [string, string][];
  body: string | Uint8Array | null;
}

export class DeviceRequest {
  method: string;
  url: string;
  originalUrl: string;
  baseUrl = '';
  params: Record<string, string> = {};
  headers: Record<string, string>;
  body: unknown = undefined;
  /** The raw body text (null: the request had none). */
  readonly rawBody: string | null;
  /** Set once a body parser has consumed the body (body-parser checks `onFinished.isFinished(req)`). */
  bodyConsumed = false;
  readonly protocol: 'http' | 'https';
  readonly secure: boolean;
  readonly ip = '127.0.0.1';
  readonly ips: string[] = [];
  readonly socket = { remoteAddress: '127.0.0.1' };
  app: Application | undefined;
  res: DeviceResponse | undefined;
  [extension: string]: unknown;

  constructor(init: DispatchRequest) {
    let url = init.url;
    let protocol: 'http' | 'https' = 'http';
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
      const u = new URL(url);
      protocol = u.protocol === 'https:' ? 'https' : 'http';
      url = `${u.pathname}${u.search}`;
    }
    if (!url.startsWith('/')) url = `/${url}`;
    this.method = init.method.toUpperCase();
    this.url = url;
    this.originalUrl = url;
    this.protocol = protocol;
    this.secure = protocol === 'https';
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(init.headers ?? {})) {
      if (v === undefined) continue;
      headers[k.toLowerCase()] = Array.isArray(v) ? v.join(k.toLowerCase() === 'cookie' ? '; ' : ', ') : String(v);
    }
    this.rawBody = init.body ?? null;
    if (headers['content-length'] === undefined && headers['transfer-encoding'] === undefined) {
      // What fetch() sends over HTTP: the body's length, and 0 for a POST/PUT without a body.
      if (this.rawBody !== null) headers['content-length'] = String(byteLength(this.rawBody));
      else if (this.method === 'POST' || this.method === 'PUT') headers['content-length'] = '0';
    }
    this.headers = headers;
  }

  get path(): string {
    return splitUrl(this.url).pathname || '/';
  }

  get query(): Record<string, string | string[]> {
    const setting = this.app?.get('query parser') ?? 'simple';
    return setting === false ? Object.create(null) : parseQueryString(splitUrl(this.url).search);
  }

  get hostname(): string | undefined {
    const host = this.headers.host;
    return host ? host.replace(/:\d+$/, '') : undefined;
  }

  get(name: string): string | undefined {
    const key = name.toLowerCase();
    if (key === 'referer' || key === 'referrer') return this.headers.referer ?? this.headers.referrer;
    return this.headers[key];
  }

  header(name: string): string | undefined {
    return this.get(name);
  }

  is(...types: (string | string[])[]): string | false | null {
    return typeIs(this.headers, types.flat());
  }
}

type Listener = (...args: unknown[]) => void;

export class DeviceResponse {
  statusCode = 200;
  statusMessage = '';
  headersSent = false;
  writableEnded = false;
  writableFinished = false;
  finished = false;
  locals: Record<string, unknown> = {};
  readonly req: DeviceRequest;
  app: Application | undefined;
  #headers = new Map<string, { name: string; value: string | string[] }>();
  #body: string | Uint8Array | null = null;
  #listeners = new Map<string, Listener[]>();
  [extension: string]: unknown;

  constructor(req: DeviceRequest) {
    this.req = req;
    req.res = this;
  }

  // -- events (subset of EventEmitter)
  on(event: string, listener: Listener): this {
    this.#listeners.set(event, [...(this.#listeners.get(event) ?? []), listener]);
    return this;
  }
  once(event: string, listener: Listener): this {
    const wrapped: Listener = (...args) => {
      this.off(event, wrapped);
      listener(...args);
    };
    return this.on(event, wrapped);
  }
  off(event: string, listener: Listener): this {
    this.#listeners.set(event, (this.#listeners.get(event) ?? []).filter((l) => l !== listener));
    return this;
  }
  removeListener(event: string, listener: Listener): this {
    return this.off(event, listener);
  }
  emit(event: string, ...args: unknown[]): boolean {
    const list = this.#listeners.get(event) ?? [];
    for (const l of [...list]) l(...args);
    return list.length > 0;
  }

  // -- headers
  status(code: number): this {
    if (!Number.isInteger(code)) throw new TypeError(`Invalid status code: ${JSON.stringify(code)}. Status code must be an integer.`);
    if (code < 100 || code > 999) throw new RangeError(`Invalid status code: ${code}. Status code must be greater than 99 and less than 1000.`);
    this.statusCode = code;
    return this;
  }
  setHeader(name: string, value: string | number | readonly string[]): this {
    if (this.headersSent) {
      throw Object.assign(new Error('Cannot set headers after they are sent to the client'), { code: 'ERR_HTTP_HEADERS_SENT' });
    }
    this.#headers.set(name.toLowerCase(), { name, value: Array.isArray(value) ? value.map(String) : String(value) });
    return this;
  }
  getHeader(name: string): string | string[] | undefined {
    return this.#headers.get(name.toLowerCase())?.value;
  }
  getHeaders(): Record<string, string | string[]> {
    return Object.fromEntries([...this.#headers].map(([k, v]) => [k, v.value]));
  }
  getHeaderNames(): string[] {
    return [...this.#headers.keys()];
  }
  hasHeader(name: string): boolean {
    return this.#headers.has(name.toLowerCase());
  }
  removeHeader(name: string): void {
    if (this.headersSent) {
      throw Object.assign(new Error('Cannot remove headers after they are sent to the client'), { code: 'ERR_HTTP_HEADERS_SENT' });
    }
    this.#headers.delete(name.toLowerCase());
  }
  set(field: string | Record<string, string | number | string[]>, value?: string | number | string[]): this {
    if (typeof field === 'object') {
      for (const [k, v] of Object.entries(field)) this.set(k, v);
      return this;
    }
    let v: string | string[] = Array.isArray(value) ? value.map(String) : String(value);
    if (field.toLowerCase() === 'content-type') {
      if (Array.isArray(v)) throw new TypeError('Content-Type cannot be set to an Array');
      v = contentType(v);
    }
    return this.setHeader(field, v);
  }
  header(field: string, value: string | number | string[]): this {
    return this.set(field, value);
  }
  get(field: string): string | string[] | undefined {
    return this.getHeader(field);
  }
  append(field: string, value: string | string[]): this {
    const prev = this.getHeader(field);
    const next = prev === undefined ? value : ([] as string[]).concat(prev, value);
    return this.set(field, next);
  }
  type(type: string): this {
    return this.set('Content-Type', type.includes('/') ? type : contentType(type));
  }

  // -- cookies
  cookie(name: string, value: unknown, options: CookieOptions = {}): this {
    const opts: CookieOptions = { ...options };
    const val = typeof value === 'object' ? `j:${JSON.stringify(value)}` : String(value);
    if (opts.maxAge != null && !Number.isNaN(Number(opts.maxAge))) {
      const maxAge = Number(opts.maxAge);
      opts.expires = new Date(Date.now() + maxAge);
      opts.maxAge = Math.floor(maxAge / 1000);
    }
    if (opts.path == null) opts.path = '/';
    return this.append('Set-Cookie', serializeCookie(name, val, opts));
  }
  clearCookie(name: string, options: CookieOptions = {}): this {
    const opts: CookieOptions = { path: '/', ...options, expires: new Date(1) };
    delete opts.maxAge;
    return this.cookie(name, '', opts);
  }

  // -- body
  json(obj: unknown): this {
    const body = JSON.stringify(obj);
    if (!this.get('Content-Type')) this.set('Content-Type', 'application/json');
    return this.send(body);
  }
  send(body?: unknown): this {
    let chunk: string | Uint8Array | undefined;
    switch (typeof body) {
      case 'string':
        if (!this.get('Content-Type')) this.type('html');
        chunk = body;
        break;
      case 'boolean':
      case 'number':
      case 'object':
        if (body === null) chunk = '';
        else if (ArrayBuffer.isView(body)) {
          if (!this.get('Content-Type')) this.type('bin');
          chunk = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
        } else return this.json(body);
        break;
      default:
        chunk = undefined;
    }
    if (typeof chunk === 'string') {
      const type = this.get('Content-Type');
      if (typeof type === 'string') this.set('Content-Type', setCharset(type, 'utf-8'));
    }
    if (chunk !== undefined) this.set('Content-Length', typeof chunk === 'string' ? byteLength(chunk) : chunk.byteLength);
    if (this.statusCode === 204 || this.statusCode === 304) {
      this.removeHeader('Content-Type');
      this.removeHeader('Content-Length');
      this.removeHeader('Transfer-Encoding');
      chunk = '';
    }
    if (this.req.method === 'HEAD') return this.end();
    return this.end(chunk);
  }
  end(chunk?: unknown, encodingOrCallback?: unknown, callback?: unknown): this {
    const cb = [chunk, encodingOrCallback, callback].find((a): a is () => void => typeof a === 'function');
    if (this.writableEnded) return this;
    if (typeof chunk === 'string' || chunk instanceof Uint8Array) this.#body = chunk;
    this.headersSent = true;
    this.writableEnded = true;
    this.finished = true;
    // Node emits 'finish' once the response is handed over, then 'close'.
    void Promise.resolve()
      .then(() => {
        this.writableFinished = true;
        this.emit('finish');
        cb?.();
      })
      .then(() => this.emit('close'));
    return this;
  }

  /** The finished response, as `dispatch` returns it. */
  toDispatchResponse(): DispatchResponse {
    const headers: [string, string][] = [];
    for (const { name, value } of this.#headers.values()) {
      for (const v of Array.isArray(value) ? value : [value]) headers.push([name, v]);
    }
    const noBody = this.req.method === 'HEAD' || this.statusCode === 204 || this.statusCode === 304;
    return { status: this.statusCode, headers, body: noBody ? null : this.#body };
  }
}

// ------------------------------------------------------------------ routing

interface Match {
  /** Part of the path consumed by a `use` layer ('' for the root). */
  consumed: string;
  params: Record<string, string>;
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw httpError(400, `Failed to decode param '${value}'`);
  }
}

function compile(spec: PathSpec, prefix: boolean): (path: string) => Match | null {
  if (spec instanceof RegExp) {
    return (path) => {
      spec.lastIndex = 0;
      const m = spec.exec(path);
      return m ? { consumed: prefix ? m[0] : '', params: {} } : null;
    };
  }
  if (/[*?(){}+\\]/.test(spec)) throw new Error(`Unsupported route path in device mode: ${spec}`);
  const keys: string[] = [];
  const body = spec
    .replace(/\/+$/, '')
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        keys.push(seg.slice(1));
        return '([^/]+?)';
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const re = new RegExp(prefix ? `^${body}(?=/|$)` : `^${body}/?$`, 'i');
  return (path) => {
    const m = re.exec(path);
    if (!m) return null;
    const params: Record<string, string> = {};
    keys.forEach((k, i) => {
      const v = m[i + 1];
      if (v !== undefined) params[k] = decodeParam(v);
    });
    return { consumed: prefix ? m[0].replace(/\/$/, '') : '', params };
  };
}

interface Layer {
  match: (path: string) => Match | null;
  /** Routes only: HTTP method in upper case, or null for `all`. */
  method: string | null | undefined;
  /** `use` layers: one handler or router. Routes: the route's handler stack. */
  handlers: AnyHandler[];
  route: boolean;
}

const isErrorHandler = (fn: AnyHandler) => fn.length === 4;
/** Like Express, any falsy value passed to `next` means "no error". */
const asError = (err: unknown): unknown => (err ? err : undefined);

function invoke(fn: AnyHandler, err: unknown, req: DeviceRequest, res: DeviceResponse, next: Next): void {
  try {
    const ret = err !== undefined ? (fn as ErrorHandler)(err, req, res, next) : (fn as Handler)(req, res, next);
    if (ret && typeof (ret as Promise<unknown>).then === 'function') {
      (ret as Promise<unknown>).then(undefined, (e: unknown) => next(e || new Error('Rejected promise')));
    }
  } catch (e) {
    next(e || new Error('Handler threw a falsy value'));
  }
}

/** Runs a route's handlers (`next('route')` leaves the route, `next('router')` the router). */
function runRoute(handlers: AnyHandler[], req: DeviceRequest, res: DeviceResponse, done: Next): void {
  let i = 0;
  const next: Next = (err) => {
    if (err === 'route') return done();
    if (err === 'router') return done(err);
    const e = asError(err);
    while (i < handlers.length) {
      const fn = handlers[i++]!;
      if ((e !== undefined) !== isErrorHandler(fn)) continue;
      return invoke(fn, e, req, res, next);
    }
    done(e);
  };
  next();
}

/** Routing methods shared by routers and the application (R: what they return, for chaining). */
interface Routing<R> {
  use(...handlers: Handler[]): R;
  use(path: PathSpec, ...handlers: Handler[]): R;
  use(...handlers: ErrorHandler[]): R;
  use(path: PathSpec, ...handlers: ErrorHandler[]): R;
  post(path: PathSpec, ...handlers: Handler[]): R;
  put(path: PathSpec, ...handlers: Handler[]): R;
  patch(path: PathSpec, ...handlers: Handler[]): R;
  delete(path: PathSpec, ...handlers: Handler[]): R;
  all(path: PathSpec, ...handlers: Handler[]): R;
  handle(req: DeviceRequest, res: DeviceResponse, out: Next): void;
  readonly stack: readonly Layer[];
}

export interface Router extends Handler, Routing<Router> {
  get(path: PathSpec, ...handlers: Handler[]): Router;
}

type LooseRouting = Record<Method | 'use', (...args: unknown[]) => unknown>;

function methodMatches(layer: string | null | undefined, method: string): boolean {
  if (layer === null) return true;
  return layer === method || (layer === 'GET' && method === 'HEAD');
}

function createRouter(): Router {
  const stack: Layer[] = [];

  function handle(req: DeviceRequest, res: DeviceResponse, out: Next): void {
    const parentUrl = req.url;
    const parentBaseUrl = req.baseUrl;
    const parentParams = req.params;
    let i = 0;
    let mounted = false;
    const restore = () => {
      req.url = parentUrl;
      req.baseUrl = parentBaseUrl;
      req.params = parentParams;
    };
    const next: Next = (err) => {
      if (mounted) {
        req.url = parentUrl;
        req.baseUrl = parentBaseUrl;
        mounted = false;
      }
      if (err === 'router') {
        restore();
        return out();
      }
      const e = err === 'route' ? undefined : asError(err);
      while (i < stack.length) {
        const layer = stack[i++]!;
        let m: Match | null;
        try {
          m = layer.match(splitUrl(req.url).pathname || '/');
        } catch (decodeErr) {
          // Express reports a bad param encoding as the error of this layer.
          return next(e ?? decodeErr);
        }
        if (!m) continue;
        if (layer.route) {
          // Routes never see a pending error (Express skips them), only error middleware does.
          if (e !== undefined || !methodMatches(layer.method, req.method)) continue;
          req.params = m.params;
          return runRoute(layer.handlers, req, res, next);
        }
        const fn = layer.handlers[0]!;
        if ((e !== undefined) !== isErrorHandler(fn)) continue;
        req.params = { ...m.params };
        if (m.consumed) {
          mounted = true;
          req.baseUrl = parentBaseUrl + m.consumed;
          const rest = req.url.slice(m.consumed.length);
          req.url = rest.startsWith('/') ? rest : `/${rest}`;
        }
        return invoke(fn, e, req, res, next);
      }
      restore();
      out(e);
    };
    next();
  }

  const router = ((req: DeviceRequest, res: DeviceResponse, next: Next) => handle(req, res, next)) as Router;
  const loose = router as unknown as LooseRouting;
  Object.defineProperty(router, 'stack', { get: () => stack });
  router.handle = handle;
  loose.use = (...args: unknown[]) => {
    const flat = args.flat();
    const path = typeof flat[0] === 'string' || flat[0] instanceof RegExp ? (flat.shift() as PathSpec) : '/';
    const fns = flat as AnyHandler[];
    if (!fns.length || fns.some((f) => typeof f !== 'function')) throw new TypeError('Router.use() requires a middleware function');
    const match = compile(path === '/' ? '' : path, true);
    for (const fn of fns) stack.push({ match, method: undefined, handlers: [fn], route: false });
    return router;
  };
  for (const method of METHODS) {
    loose[method] = (path: unknown, ...handlers: unknown[]) => {
      const fns = handlers.flat() as AnyHandler[];
      if (!fns.length || fns.some((f) => typeof f !== 'function')) throw new TypeError(`Route.${method}() requires a callback function`);
      stack.push({ match: compile(path as PathSpec, false), method: method === 'all' ? null : method.toUpperCase(), handlers: fns, route: true });
      return router;
    };
  }
  return router;
}

export function Router(): Router {
  return createRouter();
}

// ------------------------------------------------------------------ application

export interface Application extends Routing<Application> {
  (req: DeviceRequest, res: DeviceResponse, next?: Next): void;
  settings: Record<string, unknown>;
  set(name: string, value: unknown): Application;
  /** `get(name)` reads a setting; `get(path, ...handlers)` adds a GET route. */
  get(name: string): unknown;
  get(path: PathSpec, ...handlers: Handler[]): Application;
  enable(name: string): Application;
  disable(name: string): Application;
  enabled(name: string): boolean;
  disabled(name: string): boolean;
  listen(...args: unknown[]): never;
}

function finalHandler(req: DeviceRequest, res: DeviceResponse): Next {
  return (err) => {
    if (res.headersSent) {
      if (err !== undefined) console.error('[device] error after the response was sent', err);
      return;
    }
    if (err !== undefined) {
      const s = Number((err as { status?: unknown; statusCode?: unknown } | null)?.status ?? (err as { statusCode?: unknown } | null)?.statusCode);
      res.statusCode = Number.isInteger(s) && s >= 400 && s < 600 ? s : 500;
      if (res.statusCode >= 500) console.error('[device] unhandled error', err);
    } else res.statusCode = 404;
    const text = err !== undefined ? (res.statusCode >= 500 ? 'Internal Server Error' : String((err as Error).message ?? 'Error')) : `Cannot ${req.method} ${splitUrl(req.originalUrl).pathname}`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Length', String(byteLength(text)));
    res.end(text);
  };
}

function createApplication(): Application {
  const router = createRouter();
  const settings: Record<string, unknown> = { 'x-powered-by': true, 'query parser': 'simple', 'trust proxy': false, env: 'production' };
  const app = ((req: DeviceRequest, res: DeviceResponse, next?: Next) => app.handle(req, res, next ?? finalHandler(req, res))) as Application;
  app.settings = settings;
  app.handle = (req, res, out) => {
    req.app = app;
    res.app = app;
    if (settings['x-powered-by']) res.setHeader('X-Powered-By', 'Express');
    router.handle(req, res, out ?? finalHandler(req, res));
  };
  Object.defineProperty(app, 'stack', { get: () => router.stack });
  app.set = (name, value) => {
    if (name === 'query parser' && value !== 'simple' && value !== false) {
      throw new Error(`Device mode supports only the 'simple' query parser (got ${String(value)})`);
    }
    settings[name] = value;
    return app;
  };
  app.enable = (name) => app.set(name, true);
  app.disable = (name) => app.set(name, false);
  app.enabled = (name) => Boolean(settings[name]);
  app.disabled = (name) => !settings[name];
  const looseApp = app as unknown as LooseRouting;
  const looseRouter = router as unknown as LooseRouting;
  looseApp.use = (...args: unknown[]) => {
    looseRouter.use(...args);
    return app;
  };
  for (const method of METHODS) {
    if (method === 'get') continue;
    looseApp[method] = (...args: unknown[]) => {
      looseRouter[method](...args);
      return app;
    };
  }
  looseApp.get = (pathOrName: unknown, ...handlers: unknown[]) => {
    if (typeof pathOrName === 'string' && handlers.length === 0) return settings[pathOrName];
    looseRouter.get(pathOrName, ...handlers);
    return app;
  };
  app.listen = () => {
    throw new Error('There is no HTTP server in device mode: use dispatch()');
  };
  return app;
}

// ------------------------------------------------------------------ body parsing

export interface JsonOptions {
  limit?: string | number;
  strict?: boolean;
  type?: string | string[];
}

function parseJson(text: string, strict: boolean): unknown {
  if (text.length === 0) return {}; // body-parser: an empty JSON body is {}
  const first = /^[\x20\x09\x0a\x0d]*([^\x20\x09\x0a\x0d])/.exec(text)?.[1];
  if (strict && first !== '{' && first !== '[') {
    throw new SyntaxError(`Unexpected token '${first ?? ''}', "${text.slice(0, 32)}" is not valid JSON`);
  }
  return JSON.parse(text);
}

function json(options: JsonOptions = {}): Handler {
  const limit = parseBytes(options.limit ?? '100kb');
  const strict = options.strict !== false;
  const types = ([] as string[]).concat(options.type ?? 'application/json');
  return function jsonParser(req, _res, next) {
    if (req.bodyConsumed) return next();
    if (!hasBody(req.headers)) return next();
    if (!typeIs(req.headers, types)) return next();
    const charset = (/;\s*charset=("?)([^";]+)\1/i.exec(req.headers['content-type'] ?? '')?.[2] ?? 'utf-8').toLowerCase();
    if (!charset.startsWith('utf-')) {
      return next(httpError(415, `unsupported charset "${charset.toUpperCase()}"`, { charset, type: 'charset.unsupported' }));
    }
    const encoding = (req.headers['content-encoding'] ?? 'identity').toLowerCase();
    if (encoding !== 'identity') {
      return next(httpError(415, `unsupported content encoding "${encoding}"`, { encoding, type: 'encoding.unsupported' }));
    }
    const text = req.rawBody ?? '';
    req.bodyConsumed = true;
    const length = byteLength(text);
    if (length > limit) return next(httpError(413, 'request entity too large', { expected: length, length, limit, type: 'entity.too.large' }));
    try {
      req.body = parseJson(text, strict);
    } catch (err) {
      return next(Object.assign(err as Error, { status: 400, statusCode: 400, expose: true, body: text, type: 'entity.parse.failed' }));
    }
    next();
  };
}

/** Device mode serves no files: the app's own assets come from the WebView. */
function serveStatic(_root?: string, _options?: unknown): Handler {
  return (_req, _res, next) => next();
}

// ------------------------------------------------------------------ dispatch

/** Runs one request through the app and resolves when the response has finished. */
export function dispatch(app: Application, request: DispatchRequest): Promise<DispatchResponse> {
  return new Promise<DispatchResponse>((resolve, reject) => {
    const req = new DeviceRequest(request);
    const res = new DeviceResponse(req);
    res.once('finish', () => resolve(res.toDispatchResponse()));
    try {
      app.handle(req, res, finalHandler(req, res));
    } catch (err) {
      reject(err);
    }
  });
}

/** `dispatch`, one request at a time in arrival order (the device database has one connection). */
export function createDispatcher(app: Application): (request: DispatchRequest) => Promise<DispatchResponse> {
  let tail: Promise<unknown> = Promise.resolve();
  return (request) => {
    const run = tail.then(() => dispatch(app, request));
    tail = run.catch(() => undefined);
    return run;
  };
}

type Express = (() => Application) & { json: typeof json; static: typeof serveStatic; Router: typeof Router };
const express = Object.assign(createApplication, { json, static: serveStatic, Router }) as Express;

export { json, serveStatic as static };
export default express;
