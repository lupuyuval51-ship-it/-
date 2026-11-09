import { useEffect, useRef, useState } from 'react';
import type { CompletedEpisode } from '../../engine/types.ts';
import { downloadBlob, posterFileName, sharePoster } from '../../poster/export.ts';
import { posterInputFromEpisode } from '../../poster/fromEpisode.ts';
import { posterToBlob, posterToDataURL } from '../../poster/render.ts';
import { useStore } from '../../state/store.tsx';
import { IconDownload, IconShare } from '../icons.tsx';

// The poster code ships with the app (about 17 KB compressed) rather than as a chunk fetched
// later: an episode is often played away from a good connection, and a chunk that failed to
// load once stays failed for the whole page in Chromium, so the finale's poster, Download and
// Share would need a reload. Bundled, they work offline from the first screen on.

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
  const [failed, setFailed] = useState(false);
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
    setFailed(false);
    enqueue(() => (cancelled ? Promise.resolve(null) : posterToDataURL(posterInputFromEpisode(episode, seriesName), { width })))
      .then((u: string | null) => {
        if (u === null) return;
        cache.set(key, u);
        if (!cancelled) setUrl(u);
      })
      .catch((err: unknown) => {
        console.error('poster render failed', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key, episode, seriesName, width, near]);

  const alt = `Poster for Episode ${episode.episodeNumber}: ${episode.title}. ${episode.closingLine}`;
  return (
    <div ref={boxRef} className={`relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-ink-850 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] ${className}`}>
      {url ? (
        <img src={url} alt={alt} className={`h-full w-full object-cover ${develop ? (visible ? 'anim-develop' : 'opacity-0') : 'anim-fade-up'}`} draggable={false} />
      ) : failed ? (
        <div className="grid h-full place-items-center p-6 text-center text-[0.875rem] text-ivory-dim">The poster could not be drawn in this browser.</div>
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
      const data = posterInputFromEpisode(episode, seriesName);
      const blob = await posterToBlob(data);
      downloadBlob(blob, posterFileName(data));
      toast('Poster saved as PNG.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not create the PNG in this browser.', 'warn');
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
      const data = posterInputFromEpisode(episode, seriesName);
      const blob = await posterToBlob(data);
      const text = `I just finished Episode ${String(episode.episodeNumber).padStart(2, '0')} of my PLOT TWIST series${seriesName ? ` “${seriesName}”` : ''}: ${episode.title} — “${episode.closingLine}”`;
      const outcome = await sharePoster(blob, posterFileName(data), text);
      if (outcome === 'copied') toast('Copied the episode summary to your clipboard.', 'success');
      else if (outcome === 'shared') toast('Shared. Main character behavior.', 'success');
      else if (outcome === 'unsupported' || outcome === 'failed') toast('Sharing is not available here — use Download instead.', 'warn');
    } catch (err) {
      console.error(err);
      toast('Could not prepare the poster for sharing.', 'warn');
    } finally {
      running.current = false;
      setBusy(null);
    }
  };

  // aria-disabled, not disabled, while busy: a disabled button would drop keyboard focus to <body>.
  return (
    // Positioned like the poster above it, so the poster's shadow never paints over these rings.
    <div className="relative grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-[1.35fr_1fr]">
      <button type="button" className="btn btn-primary whitespace-nowrap px-4" onClick={download} aria-disabled={busy !== null || undefined}>
        <IconDownload size={19} /> {busy === 'download' ? 'Saving…' : 'Download PNG'}
      </button>
      <button type="button" className="btn btn-secondary whitespace-nowrap px-4" onClick={share} aria-disabled={busy !== null || undefined}>
        <IconShare size={19} /> {busy === 'share' ? 'Sharing…' : 'Share'}
      </button>
    </div>
  );
}
