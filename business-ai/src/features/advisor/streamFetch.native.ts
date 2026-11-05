/**
 * Native streaming fetch. React Native's legacy XHR-based fetch buffers the whole body; Expo's
 * WinterCG `fetch` from 'expo/fetch' streams it (`response.body.getReader()`) and supports
 * AbortSignal.
 */
import { fetch } from 'expo/fetch';
import type { StreamingFetch } from './streamFetch.types';

export const streamingFetch: StreamingFetch = (url, init) => fetch(url, init);
