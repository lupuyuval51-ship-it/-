/**
 * `node:fs` for device mode: there is no file system. `existsSync` is always false, so config.ts finds
 * no `.env` and the client build is never served. Reading throws an ENOENT error like Node would.
 * Migrations are bundled into the app instead of read from disk (see ../migrations.ts).
 */
function enoent(syscall: string, path: unknown): Error {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${syscall} '${String(path)}' (device mode has no file system)`), {
    code: 'ENOENT',
    errno: -2,
    syscall,
    path: String(path),
  });
}

export function existsSync(_path: unknown): boolean {
  return false;
}

export function readFileSync(path: unknown): never {
  throw enoent('open', path);
}

export function readdirSync(path: unknown): never {
  throw enoent('scandir', path);
}

export function statSync(path: unknown): never {
  throw enoent('stat', path);
}

const fs = { existsSync, readFileSync, readdirSync, statSync };
export default fs;
