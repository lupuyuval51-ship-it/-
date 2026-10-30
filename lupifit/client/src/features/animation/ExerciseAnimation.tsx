import { useEffect, useMemo, useRef, useState } from 'react';
import type { Muscle } from '@shared/constants';
import { getAnimation } from '@shared/animation/data/index';
import { getManifestEntry, phaseAt } from '@shared/animation/manifest';
import { CANVAS, computeFrame, floorDash, viewBoxFor, type Frame, type PropShape } from '@shared/animation/engine';
import { Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import './animation.css';

function Shape({ p }: { p: PropShape }) {
  const cls = `anim-tone-${p.tone}`;
  switch (p.type) {
    case 'line':
      return <line x1={p.a[0]} y1={p.a[1]} x2={p.b[0]} y2={p.b[1]} strokeWidth={p.w} strokeDasharray={p.dash} className={`${cls} anim-stroke`} strokeLinecap="round" />;
    case 'circle':
      return <circle cx={p.c[0]} cy={p.c[1]} r={p.r} className={`${cls} anim-fill`} />;
    case 'rect':
      return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx ?? 0} className={`${cls} anim-fill`} transform={p.rotate ? `rotate(${p.rotate.deg} ${p.rotate.cx} ${p.rotate.cy})` : undefined} />;
    case 'path':
      return <path d={p.d} className={`${cls} ${p.fill ? 'anim-fill' : 'anim-stroke'}`} strokeWidth={p.w ?? 2} fill={p.fill ? undefined : 'none'} />;
  }
}

type Anim = NonNullable<ReturnType<typeof getAnimation>>;

/** The articulated figure itself (shared by the full player and the small thumbnail). */
function FigureSvg({ anim, frame, label, decorative = false }: { anim: Anim; frame: Frame; label: string; decorative?: boolean }) {
  const vb = viewBoxFor(anim, frame);
  const dash = floorDash(anim);
  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className="anim-svg"
      direction="ltr"
    >
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} className="anim-bg" />
      <line x1={vb.x} y1={CANVAS.floor + 1} x2={vb.x + vb.w} y2={CANVAS.floor + 1} className="anim-floor" strokeWidth={2} strokeDasharray={dash?.dash} />
      <ellipse cx={frame.shadow.cx} cy={frame.shadow.cy} rx={frame.shadow.rx} ry={3} className="anim-shadow" opacity={frame.shadow.opacity} />
      {frame.props.filter((p) => p.layer === 'back').map((p, i) => <Shape key={`b${i}`} p={p} />)}
      {frame.segments.map((s, i) => (
        <line
          key={i}
          x1={s.a[0]}
          y1={s.a[1]}
          x2={s.b[0]}
          y2={s.b[1]}
          strokeWidth={s.w}
          strokeLinecap="round"
          className={`anim-seg anim-${s.side}${s.part === 'torso' || s.part === 'neck' ? ' anim-torso' : ''}${s.highlight && s.side !== 'far' ? ' anim-hl' : ''}`}
        />
      ))}
      {frame.overlays.map((o, i) => (
        <line key={`o${i}`} x1={o.a[0]} y1={o.a[1]} x2={o.b[0]} y2={o.b[1]} strokeWidth={o.w} strokeLinecap="round" className="anim-overlay" />
      ))}
      {frame.overlayDots.map((d, i) => (
        <circle key={`d${i}`} cx={d.c[0]} cy={d.c[1]} r={d.r} className="anim-overlay-dot" />
      ))}
      <circle cx={frame.head.c[0]} cy={frame.head.c[1]} r={frame.head.r} className="anim-head" />
      {frame.props.filter((p) => p.layer === 'front').map((p, i) => <Shape key={`f${i}`} p={p} />)}
    </svg>
  );
}

const SPEEDS = [0.25, 0.5, 1] as const;
const SPEED_LABEL: Record<(typeof SPEEDS)[number], string> = { 0.25: '¼×', 0.5: '½×', 1: '1×' };

/**
 * Animated demonstration of an exercise (articulated figure + equipment, primary muscles
 * highlighted). Renders nothing when the exercise has no animation, so the UI never
 * implies a demonstration exists when it does not — unless `showUnavailable` asks for an
 * explicit "demo unavailable" state.
 */
export function ExerciseAnimation({
  exerciseId,
  muscles = [],
  size = 'md',
  controls = true,
  autoPlay = true,
  label,
  showUnavailable = false,
}: {
  exerciseId: string;
  muscles?: Muscle[];
  size?: 'sm' | 'md' | 'lg' | 'hero';
  controls?: boolean;
  autoPlay?: boolean;
  label?: string;
  showUnavailable?: boolean;
}) {
  const { t } = useI18n();
  const anim = getAnimation(exerciseId);
  const manifest = anim ? getManifestEntry(exerciseId) : null;
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches), []);
  // With reduced motion the demo starts as two still poses; the person opts in to motion.
  const [motionRequested, setMotionRequested] = useState(false);
  const stillMode = reduceMotion && !motionRequested;
  const [playing, setPlaying] = useState(autoPlay && !reduceMotion);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [time, setTime] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Pause off-screen animations (lists with many thumbnails stay cheap).
  useEffect(() => {
    const el = holder.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { rootMargin: '50px' });
    io.observe(el);
    return () => io.disconnect();
  }, [anim]);

  useEffect(() => {
    if (!anim || !playing || !visible || stillMode) return;
    const step = (now: number) => {
      if (last.current != null) {
        const dt = (now - last.current) / 1000;
        setTime((tt) => (tt + (dt * speed) / anim.durationSec) % 1);
      }
      last.current = now;
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [anim, playing, speed, visible, stillMode]);

  if (!anim) {
    if (!showUnavailable) return null;
    return (
      <div className={`anim anim-stage anim-${size} anim-unavailable`} role="status">
        <p className="anim-note">
          <Icon name="info" size={18} />
          <span>
            <strong>{t('exercises.animation.unavailable')}</strong> {t('exercises.animation.unavailableNote')}
          </span>
        </p>
      </div>
    );
  }

  const figureLabel = label ?? t('exercises.animation.label');
  const phase = manifest ? phaseAt(manifest, time) : null;

  if (stillMode) {
    // Start pose and the end of the movement (the peak phase), side by side, plus an opt-in to motion.
    const peakT = manifest && manifest.phases.length > 2 ? manifest.phases[2]!.t + 0.01 : 0.5;
    const start = computeFrame(anim, 0, muscles);
    const end = computeFrame(anim, peakT, muscles);
    return (
      <div ref={holder} className={`anim anim-stage anim-${size} anim-still`}>
        <div className="anim-still-pair">
          <figure className="anim-still-pose">
            <FigureSvg anim={anim} frame={start} label={`${figureLabel} — ${t('exercises.animation.startPose')}`} />
            <figcaption>{t('exercises.animation.startPose')}</figcaption>
          </figure>
          <figure className="anim-still-pose">
            <FigureSvg anim={anim} frame={end} label={`${figureLabel} — ${t('exercises.animation.endPose')}`} />
            <figcaption>{t('exercises.animation.endPose')}</figcaption>
          </figure>
        </div>
        {controls && (
          <div className="anim-controls">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setMotionRequested(true);
                setPlaying(true);
              }}
            >
              <Icon name="play" size={16} />
              <span className="btn-label">{t('exercises.animation.showMotion')}</span>
            </button>
            <span className="anim-hint">{t('exercises.animation.reducedMotion')}</span>
          </div>
        )}
      </div>
    );
  }

  const frame = computeFrame(anim, time, muscles);

  return (
    <div ref={holder} className={`anim anim-stage anim-${size}`}>
      <FigureSvg anim={anim} frame={frame} label={figureLabel} />
      {controls && phase && (
        <p className="anim-phase" data-phase={phase.labelKey}>
          <span className="anim-phase-label">{t('exercises.animation.phase.title')}</span> <strong>{t(`exercises.animation.phase.${phase.labelKey}`)}</strong>
        </p>
      )}
      {controls && (
        <div className="anim-controls">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
            <Icon name={playing ? 'pause' : 'play'} size={16} />
            <span className="btn-label">{playing ? t('exercises.animation.pause') : t('exercises.animation.play')}</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setTime(0);
              setPlaying(true);
            }}
          >
            <Icon name="refresh" size={16} />
            <span className="btn-label">{t('exercises.animation.restart')}</span>
          </button>
          <div className="segmented segmented-sm" role="radiogroup" aria-label={t('exercises.animation.speed')}>
            {SPEEDS.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={speed === s} className={`segment${speed === s ? ' segment-active' : ''}`} onClick={() => setSpeed(s)}>
                {SPEED_LABEL[s]}
              </button>
            ))}
          </div>
          {muscles.length > 0 && (
            <span className="anim-legend">
              <span className="anim-legend-dot" aria-hidden="true" />
              {t('exercises.animation.targetMuscles')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Small decorative preview (a mid-movement pose, primary muscles highlighted) that plays
 * while hovered. Renders nothing without a built-in animation, so callers show their own
 * placeholder via `hasAnimation`.
 */
export function ExerciseThumb({ exerciseId, muscles = [], className = '' }: { exerciseId: string; muscles?: Muscle[]; className?: string }) {
  const anim = getAnimation(exerciseId);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0.5);
  useEffect(() => {
    if (!anim || !playing) return;
    let raf = 0;
    let prev: number | null = null;
    const step = (now: number) => {
      if (prev != null) {
        const dt = (now - prev) / 1000;
        setTime((tt) => (tt + dt / anim.durationSec) % 1);
      }
      prev = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [anim, playing]);
  if (!anim) return null;
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const frame = computeFrame(anim, time, muscles);
  return (
    <div
      className={`anim-thumb ${className}`.trim()}
      onPointerEnter={() => {
        if (!reduce) setPlaying(true);
      }}
      onPointerLeave={() => {
        setPlaying(false);
        setTime(0.5);
      }}
    >
      <FigureSvg anim={anim} frame={frame} label="" decorative />
    </div>
  );
}
