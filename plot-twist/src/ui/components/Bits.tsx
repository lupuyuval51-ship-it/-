import type { ReactNode } from 'react';
import { TRAIT_BLURB, TRAIT_LABEL } from '../../../shared/constants.ts';
import type { Trait } from '../../../shared/types.ts';
import type { TraitLevel } from '../../engine/types.ts';
import { IconCheck } from '../icons.tsx';

export const TRAIT_COLOR: Record<Trait, string> = {
  curiosity: '#4fb3ff',
  creativity: '#ff4f9a',
  boldness: '#ff5b1f',
  connection: '#1fc7b0',
};

/** Three-segment stage indicator. */
export function ProgressRail({ stage, phase, finished, label }: { stage: 1 | 2 | 3; phase: 'action' | 'choice'; finished: boolean; label: string }) {
  const fill = (seg: number) => {
    if (finished || seg < stage) return 100;
    if (seg > stage) return 0;
    return phase === 'choice' ? 100 : 38;
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5" role="progressbar" aria-label="Episode progress" aria-valuemin={0} aria-valuemax={3} aria-valuenow={finished ? 3 : stage - (phase === 'choice' ? 0 : 1)} aria-valuetext={`${label} ${stage} of 3`}>
        {[1, 2, 3].map((seg) => (
          <div key={seg} className="rail-seg">
            <div className="rail-fill" style={{ width: `${fill(seg)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((seg) => {
          const current = seg === stage && !finished;
          return (
            <span key={seg} className={`t-kicker flex min-w-0 items-center gap-1 ${current ? 'text-ivory' : ''}`}>
              {(finished || seg < stage) && <IconCheck size={12} className="shrink-0" />}
              {/* Only the current segment spells out the label, so long labels never collide. */}
              <span className="truncate">{current ? `${label} ${seg}` : seg}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TraitMeter({ level, gained = 0, compact = false }: { level: TraitLevel; gained?: number; compact?: boolean }) {
  const color = TRAIT_COLOR[level.trait];
  const span = level.next === null ? 1 : level.next - level.floor;
  const into = level.points - level.floor;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-ivory">{TRAIT_LABEL[level.trait]}</span>
        <span className="t-kicker text-[0.625rem]">
          Lv {level.level} · {level.title}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ivory/10" role="meter" aria-label={`${TRAIT_LABEL[level.trait]} level ${level.level}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress * 100)} aria-valuetext={`${level.points} points, level ${level.level} ${level.title}${level.next !== null ? `, ${level.next - level.points} to next level` : ', max level'}`}>
        <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${Math.max(3, level.progress * 100)}%`, background: color }} />
      </div>
      {!compact && (
        <div className="mt-1 flex justify-between text-[0.75rem] text-ivory-mute">
          <span>{TRAIT_BLURB[level.trait]}</span>
          <span className="t-num shrink-0 pl-2">
            {gained > 0 && <span style={{ color }}>+{gained} </span>}
            {level.next === null ? 'max' : `${into}/${span}`}
          </span>
        </div>
      )}
    </div>
  );
}

export function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-paper-ink/60" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="t-kicker text-[0.625rem] text-paper-mute">{label}</div>
        <div className="font-semibold leading-snug text-paper-ink">{value}</div>
      </div>
    </div>
  );
}

export function SectionTitle({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <div>
      {kicker && <p className="t-kicker">{kicker}</p>}
      <h2 className="t-display mt-1.5 text-[1.875rem]">{title}</h2>
      {children && <div className="mt-2 text-ivory-dim">{children}</div>}
    </div>
  );
}
