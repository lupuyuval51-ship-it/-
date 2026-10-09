import { useEffect, useMemo, useRef, useState } from 'react';
import type { Muscle } from '@shared/constants';
import { getAnimation } from '@shared/animation/data/index';
import { CANVAS, computeFrame, type PropShape } from '@shared/animation/engine';
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

/**
 * Animated demonstration of an exercise (articulated figure + equipment, primary muscles
 * highlighted). Renders nothing when the exercise has no animation, so the UI never
 * implies a demonstration exists when it does not.
 */
export function ExerciseAnimation({
  exerciseId,
  muscles = [],
  size = 'md',
  controls = true,
  autoPlay = true,
  label,
}: {
  exerciseId: string;
  muscles?: Muscle[];
  size?: 'sm' | 'md' | 'lg';
  controls?: boolean;
  autoPlay?: boolean;
  label?: string;
}) {
  const { t } = useI18n();
  const anim = getAnimation(exerciseId);
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const [playing, setPlaying] = useState(autoPlay && !reduceMotion);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(reduceMotion ? 0.5 : 0);
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
  }, []);

  useEffect(() => {
    if (!anim || !playing || !visible) return;
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
  }, [anim, playing, speed, visible]);

  if (!anim) return null;
  const frame = computeFrame(anim, time, muscles);

  return (
    <div ref={holder} className={`anim anim-${size}`}>
      <svg viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`} role="img" aria-label={label ?? t('exercises.animation.label')} className="anim-svg" direction="ltr">
        <defs>
          <linearGradient id="anim-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="anim-bg-top" />
            <stop offset="100%" className="anim-bg-bottom" />
          </linearGradient>
          <filter id="anim-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={CANVAS.w} height={CANVAS.h} fill="url(#anim-bg)" />
        <line x1={0} y1={CANVAS.floor + 1} x2={CANVAS.w} y2={CANVAS.floor + 1} className="anim-floor" strokeWidth={2} />
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
            filter={s.highlight && s.side !== 'far' ? 'url(#anim-glow)' : undefined}
          />
        ))}
        {frame.overlays.map((o, i) => (
          <line key={`o${i}`} x1={o.a[0]} y1={o.a[1]} x2={o.b[0]} y2={o.b[1]} strokeWidth={o.w} strokeLinecap="round" className="anim-overlay" filter="url(#anim-glow)" />
        ))}
        {frame.overlayDots.map((d, i) => (
          <circle key={`d${i}`} cx={d.c[0]} cy={d.c[1]} r={d.r} className="anim-overlay-dot" filter="url(#anim-glow)" />
        ))}
        <circle cx={frame.head.c[0]} cy={frame.head.c[1]} r={frame.head.r} className="anim-head" />
        {frame.props.filter((p) => p.layer === 'front').map((p, i) => <Shape key={`f${i}`} p={p} />)}
      </svg>
      {controls && (
        <div className="anim-controls">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
            <Icon name={playing ? 'pause' : 'play'} size={16} />
            <span className="btn-label">{playing ? t('exercises.animation.pause') : t('exercises.animation.play')}</span>
          </button>
          <div className="segmented segmented-sm" role="radiogroup" aria-label={t('exercises.animation.speed')}>
            {[0.5, 1].map((s) => (
              <button key={s} type="button" role="radio" aria-checked={speed === s} className={`segment${speed === s ? ' segment-active' : ''}`} onClick={() => setSpeed(s)}>
                {s === 1 ? '1×' : '½×'}
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
