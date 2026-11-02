import type { AiMode } from './types.ts';

/** User settings for the AI source. Plain localStorage (per device); never synced. Every access is guarded: storage can be unavailable. */
const K = { mode: 'ai.mode', enabled: 'ai.localEnabled', wifi: 'ai.wifiOnly', translate: 'ai.localTranslate' } as const;
const get = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const subs = new Set<() => void>();
const emit = () => { for (const f of subs) f(); };
export const subscribeSettings = (f: () => void): (() => void) => { subs.add(f); return () => { subs.delete(f); }; };

export function getMode(): AiMode { const v = get(K.mode); return v === 'cloud' || v === 'local' ? v : 'auto'; }
export function setMode(m: AiMode): void { set(K.mode, m); emit(); }
/** True once the user downloaded the model on purpose (set after a verified install; cleared on delete). 'auto' uses local only then. */
export function getLocalEnabled(): boolean { return get(K.enabled) === '1'; }
export function setLocalEnabled(on: boolean): void { set(K.enabled, on ? '1' : '0'); emit(); }
export function getWifiOnly(): boolean { return get(K.wifi) !== '0'; }
export function setWifiOnly(on: boolean): void { set(K.wifi, on ? '1' : '0'); emit(); }
/** Translation on-device is slower and lower quality: default OFF. */
export function getLocalTranslate(): boolean { return get(K.translate) === '1'; }
export function setLocalTranslate(on: boolean): void { set(K.translate, on ? '1' : '0'); emit(); }
