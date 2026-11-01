import type { ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import { ProgressBar } from '../../ui/kit.tsx';
import { barTone, type Totals } from './logic.ts';

interface Targets { kcal: number; proteinG: number; carbsG: number; fatG: number }

/** One macro as a compact column: label, "value / target" and a thin bar. Never flags "over" for macros. */
function MiniMacro({ label, value, target }: { label: string; value: number; target: number | undefined }): ReactNode {
  const t = useT();
  const tone = target ? barTone(value, target, false) : undefined;
  return (
    <div className="nu-mini">
      <span className="tiny muted">{label}</span>
      <span className="nu-mini-val"><span className="num">{fmt.num(value)}</span>{target ? <span className="muted"> / <span className="num">{fmt.num(target)}</span></span> : null} <span className="tiny muted">{t('unit.g')}</span></span>
      {target ? <ProgressBar value={value} max={target} label={label} {...(tone ? { tone } : {})} /> : null}
    </div>
  );
}

/** Daily budget header: remaining kcal is the hero number, macros sit underneath as three mini bars. */
export function DayHero({ totals, targets, plan }: { totals: Totals; targets: Targets | undefined; plan?: boolean }): ReactNode {
  const t = useT();
  const rem = targets ? Math.round(targets.kcal - totals.kcal) : null;
  const over = rem !== null && rem < 0;
  const tone = targets ? barTone(totals.kcal, targets.kcal, true) : undefined;
  return (
    <section className="card hero-card nu-hero stack" aria-label={plan ? t('nutrition.menu.dayTotals') : t('nutrition.hub.todayVs')}>
      <div className="nu-hero-top">
        <div className="stack-sm">
          <span className="small muted">{plan ? t('nutrition.menu.dayTotals') : rem === null ? t('nutrition.nu.eaten') : over ? t('nutrition.nu.over') : t('nutrition.nu.remaining')}</span>
          <span className="nu-hero-num">
            <span className={`num-hero${over && !plan ? ' warning' : ''}`} data-testid="remaining-kcal">{plan || rem === null ? fmt.num(totals.kcal) : fmt.num(Math.abs(rem))}</span>
            <span className="muted small"> {t('unit.kcal')}</span>
          </span>
        </div>
        {targets ? <span className="small muted nu-hero-side">{plan ? t('nutrition.nu.planOf', { b: fmt.num(targets.kcal) }) : t('nutrition.nu.eatenOf', { a: fmt.num(totals.kcal), b: fmt.num(targets.kcal) })}</span> : null}
      </div>
      {targets ? <ProgressBar value={totals.kcal} max={targets.kcal} label={t('unit.kcal')} {...(tone ? { tone } : {})} /> : <span className="small muted">{t('nutrition.noTarget')}</span>}
      <div className="nu-minis">
        <MiniMacro label={t('nutrition.nu.protein')} value={totals.proteinG} target={targets?.proteinG} />
        <MiniMacro label={t('nutrition.nu.carbs')} value={totals.carbsG} target={targets?.carbsG} />
        <MiniMacro label={t('nutrition.nu.fat')} value={totals.fatG} target={targets?.fatG} />
      </div>
    </section>
  );
}
