import type { ReactNode } from 'react';
import { FINISHER_VARIANTS, SPORTS, type Equipment, type FinisherContent, type FinisherVariant, type InjuryArea, type Sport } from '@lupu-fit/shared';
import { EXERCISE_BY_ID } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';
import { hasLowerBodyInjury, missingFinisherGear, SPORT_STORE } from '../../lib/workoutCompose.ts';
import { Card, ChipGroup, Select } from '../../ui/kit.tsx';
import { ExerciseLine } from './ExerciseLine.tsx';

/** Remembered sport per user: `lf_sport` holds a { [userId]: sport } map (a plain legacy value is accepted too). */
export function readSport(userId: string): Sport | null {
  try {
    const raw = localStorage.getItem(SPORT_STORE);
    if (!raw) return null;
    if ((SPORTS as readonly string[]).includes(raw)) return raw as Sport;
    const map = JSON.parse(raw) as Record<string, unknown>;
    const v = map[userId];
    return typeof v === 'string' && (SPORTS as readonly string[]).includes(v) ? (v as Sport) : null;
  } catch { return null; }
}
export function writeSport(userId: string, sport: Sport | null): void {
  try {
    let map: Record<string, string> = {};
    const raw = localStorage.getItem(SPORT_STORE);
    if (raw && raw.startsWith('{')) map = JSON.parse(raw) as Record<string, string>;
    if (sport) map[userId] = sport; else delete map[userId];
    localStorage.setItem(SPORT_STORE, JSON.stringify(map));
  } catch { /* preference only */ }
}

export function FinisherPicker({ sport, onSport, variant, onVariant, finishers, owned, injuries }: {
  sport: Sport | null; onSport: (s: Sport | null) => void; variant: FinisherVariant; onVariant: (v: FinisherVariant) => void;
  finishers: readonly FinisherContent[]; owned: readonly Equipment[]; injuries: readonly InjuryArea[];
}): ReactNode {
  const { t, lang } = useLang();
  const recommendGentle = hasLowerBodyInjury(injuries);
  const forSport = (v: FinisherVariant) => (sport ? finishers.find((f) => f.sport === sport && f.variant === v) ?? null : null);
  const gearMissing = (v: FinisherVariant): Equipment[] => { const f = forSport(v); return f ? missingFinisherGear(f, EXERCISE_BY_ID, owned) : []; };
  const gearList = gearMissing('gear').map((e) => t(`label.equipment.${e}`)).join(', ');
  const chosen = sport ? forSport(variant) : null;

  return (
    <Card className="stack">
      <Select label={t('workouts.detail.sportLabel')} value={sport ?? ''} onChange={(e) => onSport(e.target.value ? (e.target.value as Sport) : null)}
        options={[{ value: '', label: t('label.sport.none') }, ...SPORTS.map((s) => ({ value: s, label: t(`label.sport.${s}`) }))]} />
      {sport ? (
        <>
          <div className="stack-sm">
            <span className="field-label">{t('workouts.detail.variantLabel')}</span>
            <ChipGroup label={t('workouts.detail.variantLabel')} selected={[variant]} onToggle={onVariant}
              options={FINISHER_VARIANTS.map((v) => ({ value: v, label: `${t(`label.variant.${v}`)}${v === 'gentle' && recommendGentle ? ` · ${t('workouts.detail.recommended')}` : ''}`, disabled: v === 'gear' && gearMissing('gear').length > 0 }))} />
            {gearMissing('gear').length > 0 ? <span className="small muted">{t('workouts.detail.needsGear', { gear: gearList })}</span> : null}
          </div>
          {chosen ? (
            <div className="stack-sm">
              <h3>{lang === 'he' ? chosen.nameHe : chosen.nameEn}</h3>
              <p className="small">{lang === 'he' ? chosen.descriptionHe : chosen.descriptionEn}</p>
              <span className="small muted">{t('workouts.detail.rounds', { n: chosen.rounds })} · {t('workouts.detail.finisherNote')}</span>
              <ul className="wk-ex-list">
                {chosen.items.map((it, i) => (
                  <li key={i}>
                    <ExerciseLine exerciseId={it.exerciseId}>
                      <span className="small muted">{t('workouts.detail.workRest', { work: it.workSec, rest: it.restSec })}</span>
                    </ExerciseLine>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
