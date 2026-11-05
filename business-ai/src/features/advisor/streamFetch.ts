/**
 * Web (and default) streaming fetch: the browser's fetch exposes `response.body` as a
 * ReadableStream. Native resolves ./streamFetch.native.ts instead (expo/fetch).
 */
import type { StreamingFetch } from './streamFetch.types';

export const streamingFetch: StreamingFetch = (url, init) => globalThis.fetch(url, init);
