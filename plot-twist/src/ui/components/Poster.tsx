import { useEffect, useRef, useState } from 'react';
import type { CompletedEpisode } from '../../engine/types.ts';
import { useStore } from '../../state/store.tsx';
import { IconDownload, IconShare } from '../icons.tsx';

const importPoster = () =>
  Promise.all([import('../../poster/render.ts'), import('../../poster/fromEpisode.ts'), import('../../poster/export.ts')]).then(([render, from, exp]) => ({
    ...render,
    ...from,
    ...exp,
  }));
type PosterKit = Awaited<ReturnType<typeof importPoster>>;

/** The poster code could not be downloaded (no connection) — not the browser failing to draw. */
class PosterLoadError extends Error {
  readonly reason: unknown;
  constructor(reason: unknown) {
    super('The poster code could not be loaded.');
    this.name = 'PosterLoadError';
    this.reason = reason;
  }
}

const OFFLINE_POSTER = 'Couldn’t load the poster. Check your connection, then reload the page.';
const OFFLINE_TOAST = 'Couldn’t load the poster — check your connection, then reload the page.';

let kit: Promise<PosterKit> | null = null;
/**
 * The poster pipeline is its own chunk, shared by every poster on the page. A failed load is
 * forgotten, so the next attempt fetches again.
 */
function loadPoster(): Promise<PosterKit> {
  if (!kit) {
    const attempt: Promise<PosterKit> = importPoster().catch((err: unknown) => {
      if (kit === attempt) kit = null;
      throw new PosterLoadError(err);
    });
    kit = attempt;
  }
  return kit;
}

/**
 * Fetches the poster code once the app is idle after starting — while it is surely online — so
 * the finale's poster, Download and Share still work when the connection drops mid-episode.
 */
export function prefetchPoster(): void {
  const start = () => void loadPoster().catch(() => undefined);
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(start, { timeout: 4000 });
  else window.setTimeout(start, 1500);
}

const cache = new Map<string, string>();
const keyFor = (ep: CompletedEpisode, series: string | null, width: number) => `${ep.id}:${ep.posterSeed}:${series ?? ''}:${width}`;

/** Lets the browser breathe between two poster renders. */
const idle = () =>
  new Promise<void>((resolve) => {
    // Safari has no requestIdleCallback.
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 250 });
    else window.setTimeout(resolve, 16);
  });

let queue: Promise<unknown> = Promise.resolve();
/** Posters render one at a time, yielding in between, so a big gallery never freezes the page. */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(idle).then(job);
  queue = run.catch(() => undefined);
  return run;
}

/** True once the element has been at least `threshold` visible (with an optional early margin). */
function useSeen(ref: React.RefObject<Element | null>, enabled: boolean, threshold: number, rootMargin = '0px'): boolean {
  const [seen, setSeen] = useState(!enabled);
  useEffect(() => {
    if (!enabled || seen) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= threshold)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled, seen, threshold, rootMargin]);
  return seen;
}

export function PosterImage({
  episode,
  seriesName,
  width = 720,
  className = '',
  develop = false,
  lazy = false,
}: {
  episode: CompletedEpisode;
  seriesName: string | null;
  width?: number;
  className?: string;
  /** Play the "photo developing" reveal (once the poster is actually on screen). */
  develop?: boolean;
  /** Only render once the tile comes near the viewport (galleries). */
  lazy?: boolean;
}) {
  const key = keyFor(episode, seriesName, width);
  const [url, setUrl] = useState<string | null>(() => cache.get(key) ?? null);
  const [failed, setFailed] = useState<null | 'offline' | 'draw'>(null);
  // Bumped when the connection comes back after the poster code could not be loaded.
  const [attempt, setAttempt] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const near = useSeen(boxRef, lazy, 0, '400px');
  const visible = useSeen(boxRef, develop, 0.4);

  useEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }
    if (!near) return;
    let cancelled = false;
    setUrl(null);
    setFailed(null);
    enqueue(() => (cancelled ? Promise.resolve(null) : loadPoster().then((m) => m.posterToDataURL(m.posterInputFromEpisode(episode, seriesName), { width }))))
      .then((u: string | null) => {
        if (u === null) return;
        cache.set(key, u);
        if (!cancelled) setUrl(u);
      })
      .catch((err: unknown) => {
        console.error('poster render failed', err);
        if (!cancelled) setFailed(err instanceof PosterLoadError ? 'offline' : 'draw');
      });
    return () => {
      cancelled = true;
    };
  }, [key, episode, seriesName, width, near, attempt]);

  useEffect(() => {
    if (failed !== 'offline') return;
    const retry = () => setAttempt((n) => n + 1);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [failed]);

  const alt = `Poster for Episode ${episode.episodeNumber}: ${episode.title}. ${episode.closingLine}`;
  return (
    <div ref={boxRef} className={`relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-ink-850 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] ${className}`}>
      {url ? (
        <img src={url} alt={alt} className={`h-full w-full object-cover ${develop ? (visible ? 'anim-develop' : 'opacity-0') : 'anim-fade-up'}`} draggable={false} />
      ) : failed ? (
        <div className="grid h-full place-items-center p-6 text-center text-[0.875rem] text-ivory-dim">
          {failed === 'offline' ? OFFLINE_POSTER : 'The poster could not be drawn in this browser.'}
        </div>
      ) : (
        <div className="h-full w-full shimmer opacity-30" role="img" aria-label="Developing poster…" />
      )}
    </div>
  );
}

export function PosterActions({ episode, seriesName }: { episode: CompletedEpisode; seriesName: string | null }) {
  const { toast } = useStore();
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  // A ref, not the state: a quick second tap can land before React re-renders, and must not start a second export.
  const running = useRef(false);

  const download = async () => {
    if (running.current) return;
    running.current = true;
    setBusy('download');
    try {
      const m = await loadPoster();
      const data = m.posterInputFromEpisode(episode, seriesName);
      const blob = await m.posterToBlob(data);
      m.downloadBlob(blob, m.posterFileName(data));
      toast('Poster saved as PNG.', 'success');
    } catch (err) {
      console.error(err);
      toast(err instanceof PosterLoadError ? OFFLINE_TOAST : 'Could not create the PNG in this browser.', 'warn');
    } finally {
      running.current = false;
      setBusy(null);
    }
  };

  const share = async () => {
    if (running.current) return;
    running.current = true;
    setBusy('share');
    try {
      const m = await loadPoster();
      const data = m.posterInputFromEpisode(episode, seriesName);
      const blob = await m.posterToBlob(data);
      const text = `I just finished Episode ${String(episode.episodeNumber).padStart(2, '0')} of my PLOT TWIST series${seriesName ? ` “${seriesName}”` : ''}: ${episode.title} — “${episode.closingLine}”`;
      const outcome = await m.sharePoster(blob, m.posterFileName(data), text);
      if (outcome === 'copied') toast('Copied the episode summary to your clipboard.', 'success');
      else if (outcome === 'shared') toast('Shared. Main character behavior.', 'success');
      else if (outcome === 'unsupported' || outcome === 'failed') toast('Sharing is not available here — use Download instead.', 'warn');
    } catch (err) {
      console.error(err);
      toast(err instanceof PosterLoadError ? OFFLINE_TOAST : 'Could not prepare the poster for sharing.', 'warn');
    } finally {
      running.current = false;
      setBusy(null);
    }
  };

  // aria-disabled, not disabled, while busy: a disabled button would drop keyboard focus to <body>.
  return (
    <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-[1.35fr_1fr]">
      <button type="button" className="btn btn-primary whitespace-nowrap px-4" onClick={download} aria-disabled={busy !== null || undefined}>
        <IconDownload size={19} /> {busy === 'download' ? 'Saving…' : 'Download PNG'}
      </button>
      <button type="button" className="btn btn-secondary whitespace-nowrap px-4" onClick={share} aria-disabled={busy !== null || undefined}>
        <IconShare size={19} /> {busy === 'share' ? 'Sharing…' : 'Share'}
      </button>
    </div>
  );
}
