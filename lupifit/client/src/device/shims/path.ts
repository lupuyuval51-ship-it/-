/**
 * `node:path` (POSIX) for device mode. The server only builds paths at startup (config.ts looks for a
 * `.env`, app.ts/migrate.ts look for files): they have to compute without throwing, and the `fs` shim
 * then reports that nothing exists. The working directory is `process.cwd()` or `/`.
 */
const cwd = () => {
  const p = (globalThis as { process?: { cwd?: () => string } }).process;
  try {
    return typeof p?.cwd === 'function' ? p.cwd() : '/';
  } catch {
    return '/';
  }
};

export const sep = '/';
export const delimiter = ':';

export function isAbsolute(p: string): boolean {
  return p.startsWith('/');
}

export function normalize(p: string): string {
  if (p === '') return '.';
  const absolute = isAbsolute(p);
  const trailing = p.endsWith('/');
  const parts: string[] = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      if (parts.length && parts[parts.length - 1] !== '..') parts.pop();
      else if (!absolute) parts.push('..');
    } else parts.push(seg);
  }
  let out = (absolute ? '/' : '') + parts.join('/');
  if (!out) out = absolute ? '/' : '.';
  if (trailing && out !== '/') out += '/';
  return out;
}

export function join(...segments: string[]): string {
  const joined = segments.filter((s) => s !== '').join('/');
  return joined ? normalize(joined) : '.';
}

export function resolve(...segments: string[]): string {
  let resolved = '';
  for (let i = segments.length - 1; i >= 0 && !isAbsolute(resolved); i--) {
    const seg = segments[i]!;
    if (seg) resolved = resolved ? `${seg}/${resolved}` : seg;
  }
  if (!isAbsolute(resolved)) resolved = `${cwd()}/${resolved}`;
  const out = normalize(resolved);
  return out.length > 1 && out.endsWith('/') ? out.slice(0, -1) : out;
}

export function dirname(p: string): string {
  if (!p) return '.';
  const trimmed = p.length > 1 ? p.replace(/\/+$/, '') : p;
  const idx = trimmed.lastIndexOf('/');
  if (idx < 0) return '.';
  if (idx === 0) return '/';
  return trimmed.slice(0, idx);
}

export function basename(p: string, ext?: string): string {
  const trimmed = p.length > 1 ? p.replace(/\/+$/, '') : p;
  let base = trimmed.slice(trimmed.lastIndexOf('/') + 1);
  if (ext && base.endsWith(ext) && base !== ext) base = base.slice(0, -ext.length);
  return base;
}

export function extname(p: string): string {
  const base = basename(p);
  const idx = base.lastIndexOf('.');
  return idx <= 0 ? '' : base.slice(idx);
}

export function relative(from: string, to: string): string {
  const a = resolve(from).split('/').filter(Boolean);
  const b = resolve(to).split('/').filter(Boolean);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return [...Array<string>(a.length - i).fill('..'), ...b.slice(i)].join('/');
}

const path = { sep, delimiter, isAbsolute, normalize, join, resolve, dirname, basename, extname, relative, posix: undefined as unknown };
path.posix = path;
export const posix = path;
export default path;
