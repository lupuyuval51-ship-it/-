import type { Handler, Method, Route, RouteOpts } from './types.ts';

export class Router {
  readonly routes: Route[] = [];
  add(method: Method, pattern: string, handler: Handler, opts: RouteOpts = {}): this {
    this.routes.push({ method, pattern, segs: pattern.split('/').filter(Boolean), handler, opts });
    return this;
  }
  get = (p: string, h: Handler, o?: RouteOpts): this => this.add('GET', p, h, o);
  post = (p: string, h: Handler, o?: RouteOpts): this => this.add('POST', p, h, o);
  put = (p: string, h: Handler, o?: RouteOpts): this => this.add('PUT', p, h, o);
  patch = (p: string, h: Handler, o?: RouteOpts): this => this.add('PATCH', p, h, o);
  delete = (p: string, h: Handler, o?: RouteOpts): this => this.add('DELETE', p, h, o);

  match(method: string, path: string): { route: Route; params: Record<string, string> } | { pathExists: boolean } {
    const parts = path.split('/').filter(Boolean);
    let pathExists = false;
    for (const r of this.routes) {
      if (r.segs.length !== parts.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < r.segs.length; i++) {
        const s = r.segs[i] as string; const p = parts[i] as string;
        if (s.startsWith(':')) { try { params[s.slice(1)] = decodeURIComponent(p); } catch { ok = false; break; } }
        else if (s !== p) { ok = false; break; }
      }
      if (!ok) continue;
      pathExists = true;
      if (r.method === method) return { route: r, params };
    }
    return { pathExists };
  }
}
