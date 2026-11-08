import type { Adventure, Kind } from '../../../shared/types.ts';
import { PALETTES } from '../../../shared/constants.ts';
import type { Generation } from '../../state/store.tsx';
import type { DrawEnvelope } from '../../state/types.ts';
import { formatCost } from '../hooks.ts';
import { typographic } from '../../../shared/template.ts';
import { IconSparkle, KindGlyph } from '../icons.tsx';

const LETTERS = ['A', 'B', 'C', 'D'];

function wobblePath(seed: number, r = 21, points = 14): string {
  // Deterministic blobby wax outline around (24, 24).
  let s = seed || 1;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rr = r + (rnd() - 0.5) * 3.2;
    pts.push([24 + Math.cos(a) * rr, 24 + Math.sin(a) * rr]);
  }
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[(i + 1) % pts.length];
    const mx = (x + nx) / 2;
    const my = (y + ny) / 2;
    d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)}` : '';
    d += ` Q${nx.toFixed(1)} ${ny.toFixed(1)} ${((nx + pts[(i + 2) % pts.length][0]) / 2).toFixed(1)} ${((ny + pts[(i + 2) % pts.length][1]) / 2).toFixed(1)}`;
  }
  return d + 'Z';
}

export function WaxSeal({ kind, color, seed, broken = false, size = 52 }: { kind: Kind; color: string; seed: number; broken?: boolean; size?: number }) {
  const path = wobblePath(seed);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="seal" aria-hidden="true">
      <defs>
        <radialGradient id={`wax-${seed}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      <g style={{ transform: broken ? 'translate(-2px, 1px) rotate(-6deg)' : undefined, transformOrigin: '24px 24px', transition: 'transform 500ms ease' }}>
        <path d={path} fill={color} />
        <path d={path} fill={`url(#wax-${seed})`} />
        <circle cx="24" cy="24" r="13.5" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.4" />
        <g transform="translate(13 13) scale(0.92)" color="rgba(20,10,5,0.62)">
          <KindGlyph kind={kind} size={24} strokeWidth={2.1} />
        </g>
      </g>
      {broken && <path d="M24 4 L21 17 L27 24 L22 33 L25 44" stroke="var(--color-paper)" strokeWidth="2.4" fill="none" strokeLinejoin="round" />}
    </svg>
  );
}

function PostageStamp({ adventure }: { adventure: Adventure }) {
  const palette = PALETTES[adventure.palette];
  return (
    <div
      className="relative shrink-0 rotate-[3deg] p-[3px]"
      style={{ background: 'repeating-linear-gradient(90deg, transparent 0 3px, rgba(43,34,25,0.18) 3px 4px)', borderRadius: 3 }}
      aria-hidden="true"
    >
      <div className="flex h-[62px] w-[52px] flex-col items-center justify-center gap-1 rounded-[2px] border-2 border-[color:var(--color-paper)] text-center" style={{ background: palette.bg, color: palette.accent }}>
        <KindGlyph kind={adventure.kind} size={20} />
        <span className="t-num text-[10px] font-bold leading-none" style={{ color: palette.ink }}>
          {adventure.minutes}′
        </span>
      </div>
      <div className="postmark absolute -bottom-4 -left-7 z-10 grid h-12 w-12 place-items-center rotate-[-14deg] bg-[color:var(--color-paper)]/40">
        <span className="t-num text-center text-[8.5px] font-bold uppercase leading-[1.05] tracking-wider text-paper-ink/80">{formatCost(adventure.cost)}</span>
      </div>
    </div>
  );
}

const PHASE_COPY: Record<Generation['phase'], string> = {
  plotting: 'Plotting your twist…',
  writing: 'Writing your episode…',
  checking: 'Checking it against the rules…',
  repairing: 'Fixing a plot hole…',
};

export function Envelope({
  envelope,
  adventure,
  episodeNumber,
  generation,
  onOpen,
  onRetry,
  canRetry,
  index,
}: {
  envelope: DrawEnvelope;
  adventure: Adventure | null;
  episodeNumber: number;
  generation: Generation | null;
  onOpen: () => void;
  onRetry: () => void;
  canRetry: boolean;
  index: number;
}) {
  const letter = LETTERS[envelope.slot] ?? '?';
  const tilt = [-1.1, 0.9, -0.5][index % 3];
  const style = { '--env-tilt': `calc(${tilt}deg * (var(--motion-scale) * 1.4))`, animationDelay: `${index * 110}ms` } as React.CSSProperties;
  const code = `EP. ${String(episodeNumber).padStart(2, '0')} · ENVELOPE ${letter}`;

  if (envelope.status === 'writing' || !adventure) {
    const writing = envelope.status === 'writing';
    const progress = writing && generation ? generation.progress : 0;
    return (
      <div className="envelope paper anim-deal" style={style} aria-busy={writing} aria-live="polite">
        <div className="relative flex min-h-[188px] flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="t-kicker text-paper-mute">{code}</span>
            <span className="stamp text-[color:#b4380c]">
              <IconSparkle size={13} /> Written for you
            </span>
          </div>
          {writing ? (
            <>
              <div className="mt-5 flex items-end gap-3">
                <h3 className="t-display min-h-[32px] flex-1 text-[27px] text-paper-ink">
                  {generation?.title ?? <span className="block h-7 w-3/4 rounded bg-paper-ink/10 shimmer" aria-hidden="true" />}
                </h3>
                <span className="anim-quill pb-1 text-[22px]" aria-hidden="true">
                  ✒︎
                </span>
              </div>
              <p className="t-serif-italic mt-2 text-[15px] text-paper-mute">{generation ? PHASE_COPY[generation.phase] : 'Waiting for the AI Director…'}</p>
              <div className="mt-auto pt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-paper-ink/12" role="progressbar" aria-label="Writing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                  <div className="h-full rounded-full bg-paper-ink/70 transition-[width] duration-700" style={{ width: `${Math.max(4, progress * 100)}%` }} />
                </div>
                <p className="t-kicker mt-2 text-paper-mute">Personalized by the AI Director · usually under a minute</p>
              </div>
            </>
          ) : (
            <>
              <h3 className="t-display mt-5 text-[25px] text-paper-ink">This envelope came back empty.</h3>
              <p className="mt-2 text-[14.5px] text-paper-mute">{envelope.note ?? 'The AI Director could not finish this one.'}</p>
              {canRetry && (
                <button type="button" onClick={onRetry} className="btn btn-paper mt-4 self-start">
                  Ask the AI Director again
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const palette = PALETTES[adventure.palette];
  const isAi = envelope.source === 'ai';
  const sealSeed = Array.from(adventure.id).reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="envelope paper anim-deal group"
      style={style}
      data-opened={envelope.opened}
      aria-label={`Envelope ${letter}: ${adventure.title}. ${adventure.tagline} ${envelope.opened ? 'Opened — tap to read again.' : 'Tap to open.'}`}
    >
      {/* faint V of the flap */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M0 0 L50 46 L100 0" fill="none" stroke="rgba(43,34,25,0.13)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {envelope.opened && <div aria-hidden="true" className="absolute inset-x-6 -top-1 h-3 rounded-b-sm bg-[#fbf6ea] shadow-[0_2px_4px_rgba(0,0,0,0.12)]" />}
      <div className="relative flex min-h-[188px] flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="t-kicker block text-paper-mute">{code}</span>
            {isAi ? (
              <span className="stamp mt-3 text-[color:#b4380c]">
                <IconSparkle size={13} /> Written for you
              </span>
            ) : envelope.note ? (
              <span className="mt-3 block max-w-[30ch] text-[12.5px] leading-snug text-paper-mute">{envelope.note}</span>
            ) : null}
          </div>
          <PostageStamp adventure={adventure} />
        </div>
        <h3 className="t-display mt-auto pt-4 text-[clamp(25px,7.4vw,30px)] text-paper-ink">{typographic(adventure.title)}</h3>
        <p className="t-serif-italic mt-1.5 max-w-[34ch] text-[15.5px] text-paper-mute">{typographic(adventure.tagline)}</p>
        <div className="mt-4 flex items-end justify-between">
          <span className="t-kicker text-paper-ink/80">{envelope.opened ? 'Opened · tap to reread' : 'Tap to break the seal'}</span>
          <WaxSeal kind={adventure.kind} color={isAi ? '#c2410c' : palette.accent === '#E8E2D0' ? '#8c1c30' : palette.accent} seed={sealSeed} broken={envelope.opened} />
        </div>
      </div>
    </button>
  );
}
