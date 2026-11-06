import { IS_DEVICE } from '../env.ts';

/** Tiny cross-component store: which video is playing (only ONE at a time) and whether a rest timer is running. */
type Listener = () => void;
const listeners = new Set<Listener>();
let playing: HTMLVideoElement | null = null;
let rest = false;

export const videoStore = {
  subscribe(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Claims the single playing slot; any other playing video is paused. */
  claim(v: HTMLVideoElement): void { if (playing && playing !== v) playing.pause(); playing = v; listeners.forEach((l) => l()); },
  release(v: HTMLVideoElement): void { if (playing === v) playing = null; },
  get restActive(): boolean { return rest; },
  setRestActive(on: boolean): void { rest = on; if (on && playing) playing.pause(); listeners.forEach((l) => l()); },
};

const WIFI_KEY = 'lf_video_wifi_only';
export const videoPrefs = {
  get wifiOnly(): boolean { try { return localStorage.getItem(WIFI_KEY) === '1'; } catch { return false; } },
  set wifiOnly(v: boolean) { try { localStorage.setItem(WIFI_KEY, v ? '1' : '0'); } catch { /* ignore */ } },
};

/** Autoplay is allowed only when: motion not reduced, data saver off, and (if "Wi-Fi only") not on a cellular connection. */
export function autoplayAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  const c = (navigator as unknown as { connection?: { saveData?: boolean; type?: string; effectiveType?: string } }).connection;
  if (c?.saveData) return false;
  if (!IS_DEVICE && videoPrefs.wifiOnly && c && (c.type === 'cellular' || c.effectiveType === '2g' || c.effectiveType === 'slow-2g')) return false;
  return true;
}

interface Manifest { items: { id: string; fidelity: 'specific' | 'approximate' | 'generic'; reviewed: boolean }[] }
let manifestP: Promise<Map<string, Manifest['items'][number]>> | null = null;
/** Which exercises have a generated clip (and its honesty metadata). */
export function loadMediaManifest(): Promise<Map<string, Manifest['items'][number]>> {
  manifestP ??= fetch('/media/exercises/media-manifest.json').then((r) => (r.ok ? (r.json() as Promise<Manifest>) : { items: [] })).catch(() => ({ items: [] as Manifest['items'] })).then((m) => new Map(m.items.map((i) => [i.id, i])));
  return manifestP;
}
