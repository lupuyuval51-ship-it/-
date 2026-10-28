import type { Macros } from '@shared/nutrition';
import { useI18n } from '../../i18n';

/** Formatting helpers: calories as whole numbers, grams with one decimal. */
export function useMacroFormat() {
  const { t, formatNumber } = useI18n();
  const kcal = (v: number) => formatNumber(Math.round(v), { maximumFractionDigits: 0 });
  const g = (v: number) => formatNumber(Math.round(v * 10) / 10, { maximumFractionDigits: 1 });
  return {
    kcal,
    g,
    kcalText: (v: number) => t('nutrition.units.kcal', { value: kcal(v) }),
    gramsText: (v: number) => t('nutrition.units.grams', { value: g(v) }),
    macroShort: (m: Pick<Macros, 'proteinG' | 'carbsG' | 'fatG'>) => t('nutrition.units.macroShort', { protein: g(m.proteinG), carbs: g(m.carbsG), fat: g(m.fatG) }),
  };
}

/** "226 kcal · P 45.8 · C 0 · F 4.8" */
export function MacroLine({ m, className }: { m: Macros; className?: string }) {
  const f = useMacroFormat();
  return (
    <span className={`macro-line${className ? ` ${className}` : ''}`}>
      <strong className="num">{f.kcalText(m.kcal)}</strong>
      <span className="muted num"> · {f.macroShort(m)}</span>
    </span>
  );
}

/** Five-cell nutrient grid used for live previews. */
export function MacroGrid({ m, live = false, label }: { m: Macros; live?: boolean; label?: string }) {
  const { t } = useI18n();
  const f = useMacroFormat();
  const cells: [string, string][] = [
    [t('common.macros.calories'), f.kcal(m.kcal)],
    [t('common.macros.protein'), f.gramsText(m.proteinG)],
    [t('common.macros.carbs'), f.gramsText(m.carbsG)],
    [t('common.macros.fat'), f.gramsText(m.fatG)],
    [t('common.macros.fiber'), f.gramsText(m.fiberG)],
  ];
  return (
    <dl className="macro-grid" aria-live={live ? 'polite' : undefined} aria-label={label}>
      {cells.map(([k, v]) => (
        <div key={k} className="macro-cell">
          <dt>{k}</dt>
          <dd className="num">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
