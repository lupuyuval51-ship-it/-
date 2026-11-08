import { useEffect, useState } from 'react';
import type { CompletedEpisode } from '../../engine/types.ts';
import { useStore } from '../../state/store.tsx';
import { IconDownload, IconShare } from '../icons.tsx';

/** The poster pipeline is loaded on demand — it is only needed once an episode is complete. */
const loadPoster = () =>
  Promise.all([import('../../poster/render.ts'), import('../../poster/fromEpisode.ts'), import('../../poster/export.ts')]).then(([render, from, exp]) => ({
    ...render,
    ...from,
    ...exp,
  }));

const cache = new Map<string, string>();
const keyFor = (ep: CompletedEpisode, series: string | null, width: number) => `${ep.id}:${ep.posterSeed}:${series ?? ''}:${width}`;

export function PosterImage({
  episode,
  seriesName,
  width = 720,
  className = '',
  develop = false,
}: {
  episode: CompletedEpisode;
  seriesName: string | null;
  width?: number;
  className?: string;
  /** Play the "photo developing" reveal. */
  develop?: boolean;
}) {
  const key = keyFor(episode, seriesName, width);
  const [url, setUrl] = useState<string | null>(() => cache.get(key) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    loadPoster()
      .then((m) => m.posterToDataURL(m.posterInputFromEpisode(episode, seriesName), { width }))
      .then((u: string) => {
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
  }, [key, episode, seriesName, width]);

  const alt = `Poster for Episode ${episode.episodeNumber}: ${episode.title}. ${episode.closingLine}`;
  return (
    <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-ink-850 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] ${className}`}>
      {url ? (
        <img src={url} alt={alt} className={`h-full w-full object-cover ${develop ? 'anim-develop' : 'anim-fade-up'}`} draggable={false} />
      ) : failed ? (
        <div className="grid h-full place-items-center p-6 text-center text-[14px] text-ivory-dim">The poster could not be drawn in this browser.</div>
      ) : (
        <div className="h-full w-full shimmer opacity-30" role="img" aria-label="Developing poster…" />
      )}
    </div>
  );
}

export function PosterActions({ episode, seriesName }: { episode: CompletedEpisode; seriesName: string | null }) {
  const { toast } = useStore();
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);

  const download = async () => {
    setBusy('download');
    try {
      const m = await loadPoster();
      const data = m.posterInputFromEpisode(episode, seriesName);
      const blob = await m.posterToBlob(data);
      m.downloadBlob(blob, m.posterFileName(data));
      toast('Poster saved as PNG.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not create the PNG in this browser.', 'warn');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
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
      toast('Could not prepare the poster for sharing.', 'warn');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid grid-cols-[1.35fr_1fr] gap-2.5">
      <button type="button" className="btn btn-primary whitespace-nowrap px-4" onClick={download} disabled={busy !== null}>
        <IconDownload size={19} /> {busy === 'download' ? 'Saving…' : 'Download PNG'}
      </button>
      <button type="button" className="btn btn-secondary whitespace-nowrap px-4" onClick={share} disabled={busy !== null}>
        <IconShare size={19} /> {busy === 'share' ? 'Sharing…' : 'Share'}
      </button>
    </div>
  );
}
