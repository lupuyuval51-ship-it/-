/**
 * `node:url` for device mode. `fileURLToPath` behaves like Node: it converts `file:` URLs and throws
 * for any other scheme (in the browser `import.meta.url` is an http(s)/blob URL, and the code that
 * would call it, static-file and migration lookup, is not used in device mode).
 */
export function fileURLToPath(url: string | URL): string {
  const u = typeof url === 'string' ? new URL(url) : url;
  if (u.protocol !== 'file:') {
    throw Object.assign(new TypeError('The URL must be of scheme file'), { code: 'ERR_INVALID_URL_SCHEME' });
  }
  return decodeURIComponent(u.pathname);
}

export function pathToFileURL(path: string): URL {
  const absolute = path.startsWith('/') ? path : `/${path}`;
  return new URL(`file://${absolute.split('/').map(encodeURIComponent).join('/')}`);
}

const URLClass = globalThis.URL;
const URLSearchParamsClass = globalThis.URLSearchParams;
export { URLClass as URL, URLSearchParamsClass as URLSearchParams };

const url = { fileURLToPath, pathToFileURL, URL: URLClass, URLSearchParams: URLSearchParamsClass };
export default url;
