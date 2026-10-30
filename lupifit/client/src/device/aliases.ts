/**
 * Module aliases of device mode (used by Vite/Vitest configs, i.e. at build time in Node): the server
 * code imports these packages and Node built-ins, device mode replaces them with the shims and stubs
 * in this folder. Patterns are anchored, so `pg` never matches `pg-protocol` or `@electric-sql/pglite`.
 */
import { fileURLToPath } from 'node:url';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export interface Alias {
  find: RegExp;
  replacement: string;
}

/** `pg` → PGlite. The Node test harness that runs the server test suite on PGlite uses only this one. */
export const PG_ALIAS: Alias = { find: /^pg$/, replacement: here('./shims/pg.ts') };

/** npm packages of the server that need a server: replaced by a shim (express) or a stub. */
export const SERVER_PACKAGE_ALIASES: Alias[] = [
  PG_ALIAS,
  { find: /^express$/, replacement: here('./shims/express.ts') },
  { find: /^helmet$/, replacement: here('./stubs/helmet.ts') },
  { find: /^web-push$/, replacement: here('./stubs/web-push.ts') },
  { find: /^@anthropic-ai\/sdk$/, replacement: here('./stubs/anthropic.ts') },
];

/** Node built-ins imported by server/src. */
export const NODE_BUILTIN_ALIASES: Alias[] = [
  { find: /^(node:)?crypto$/, replacement: here('./shims/crypto.ts') },
  { find: /^(node:)?fs$/, replacement: here('./shims/fs.ts') },
  { find: /^(node:)?path$/, replacement: here('./shims/path.ts') },
  { find: /^(node:)?url$/, replacement: here('./shims/url.ts') },
  { find: /^(node:)?util$/, replacement: here('./shims/util.ts') },
  { find: /^(node:)?http$/, replacement: here('./shims/http.ts') },
];

export const DEVICE_ALIASES: Alias[] = [...SERVER_PACKAGE_ALIASES, ...NODE_BUILTIN_ALIASES];
