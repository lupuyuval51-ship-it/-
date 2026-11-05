import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useT } from '../i18n/index.tsx';
import { autoplayAllowed, loadMediaManifest, videoStore } from '../lib/videoState.ts';
import { IconFlip, IconFullscreen, IconPause, IconPlay, IconSlow } from '../ui/icons.tsx';
import { cx } from '../ui/kit.tsx';

export type VideoSize = 'sm' | 'md' | 'lg' | 'hero';
const clipUrl = (id: string): string => `/media/exercises/${id}.mp4`;
export const posterUrl = (id: string): string => `/media/exercises/${id}.jpg`;

export function useMediaInfo(id: string) {
  return useQuery({ queryKey: ['media-manifest'], queryFn: loadMediaManifest, staleTime: Infinity }).data?.get(id) ?? null;
}

/** Poster-only thumbnail: never loads video, never shows a broken image. */
export function ExerciseVideoThumb({ exerciseId, alt, large }: { exerciseId: string; alt: string; large?: boolean }): ReactNode {
  const [bad, setBad] = useState(false);
  return (
    <span className={cx('xthumb', large && 'lg')}>
      {bad ? <span className="center small muted" style={{ display: 'grid', placeItems: 'center', blockSize: '100%' }} aria-hidden="true">{alt.slice(0, 1)}</span> : <img src={posterUrl(exerciseId)} alt={alt} loading="lazy" decoding="async" width={128} height={128} onError={() => setBad(true)} />}
    </span>
  );
}

/**
 * Silent technique loop. Fixed 1:1 box (no layout shift). Plays only while visible, only one at a time, never during
 * rest unless tapped, never when motion is reduced / data saver is on. Offline without a cached clip: poster + numbered steps.
 */
export function ExerciseVideo({ exerciseId, size = 'md', steps, alt, autoPlay = true }: { exerciseId: string; size?: VideoSize; steps?: readonly string[]; alt: string; autoPlay?: boolean }): ReactNode {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [userPlay, setUserPlay] = useState(false); // explicit tap overrides rest pause and reduced-motion autoplay block
  const rest = useSyncExternalStore(videoStore.subscribe, () => videoStore.restActive);
  const info = useMediaInfo(exerciseId);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(typeof document === 'undefined' ? true : !document.hidden);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current; if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver((es) => { for (const e of es) setVisible(e.isIntersecting && e.intersectionRatio >= 0.5); }, { threshold: [0, 0.5, 1] });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => { const f = () => setPageVisible(!document.hidden); document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f); }, []);

  const shouldPlay = visible && pageVisible && !failed && (userPlay || (autoPlay && autoplayAllowed() && !rest));
  useEffect(() => {
    const v = ref.current; if (!v) return;
    v.playbackRate = slow ? 0.5 : 1;
    if (shouldPlay) { videoStore.claim(v); v.play().then(() => setPlaying(true), () => setPlaying(false)); }
    else { v.pause(); videoStore.release(v); setPlaying(false); }
    return () => { videoStore.release(v); };
  }, [shouldPlay, slow]);

  const toggle = useCallback(() => { const v = ref.current; if (!v) return; if (v.paused) { setUserPlay(true); } else { setUserPlay(false); v.pause(); setPlaying(false); } }, []);
  const retry = () => { setFailed(false); ref.current?.load(); };
  const fullscreen = () => { const el = wrapRef.current; void (el?.requestFullscreen?.() ?? Promise.resolve()); };

  const hasClip = info !== null;
  const showFallback = failed || !hasClip;
  return (
    <div>
      <div ref={wrapRef} className={cx('xvid', size, mirror && 'mirrored')}>
        <div className="xvid-media">
          {hasClip && !failed ? (
            <video ref={ref} muted loop playsInline preload="metadata" poster={posterUrl(exerciseId)} aria-label={alt} onError={() => setFailed(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
              <source src={clipUrl(exerciseId)} type="video/mp4" />
            </video>
          ) : <img src={posterUrl(exerciseId)} alt={alt} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          {showFallback ? (
            <div className="xvid-fallback">
              <span>{t('video.needsNetwork')}</span>
              <button type="button" className="btn btn-sm" onClick={retry}>{t('app.retry')}</button>
            </div>
          ) : null}
        </div>
        {hasClip && !failed ? (
          <div className="xvid-controls">
            <button type="button" className="icon-btn" aria-label={playing ? t('video.pause') : t('video.play')} onClick={toggle}>{playing ? <IconPause /> : <IconPlay />}</button>
            <button type="button" className="icon-btn" aria-label={t('video.slow')} aria-pressed={slow} onClick={() => setSlow((s) => !s)}><IconSlow /></button>
            <button type="button" className="icon-btn" aria-label={t('video.mirror')} aria-pressed={mirror} onClick={() => setMirror((m) => !m)}><IconFlip /></button>
            <button type="button" className="icon-btn" aria-label={t('video.fullscreen')} onClick={fullscreen}><IconFullscreen /></button>
          </div>
        ) : null}
      </div>
      {/* One caption: approximate/general clips say so; otherwise the plain "schematic, not filmed" note. */}
      <p className="tiny muted">{info && info.fidelity !== 'specific' ? t(`label.fidelity.${info.fidelity}`) : t('video.illustration')}</p>
      {showFallback && steps?.length ? <ol className="small stack-sm" style={{ paddingInlineStart: '1.25rem' }}>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol> : null}
    </div>
  );
}
