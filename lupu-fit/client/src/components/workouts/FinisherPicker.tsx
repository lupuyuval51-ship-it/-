import type { ReactNode } from 'react';
import { FINISHER_VARIANTS, SPORTS, type Equipment, type FinisherContent, type FinisherVariant, type InjuryArea, type Sport } from '@lupu-fit/shared';
import { EXERCISE_BY_ID } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';
import { hasLowerBodyInjury, missingFinisherGear, SPORT_STORE } from '../../lib/workoutCompose.ts';
import { Card, Tag } from '../../ui/kit.tsx';
import { Disclosure } from '../../ui/patterns.tsx';
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
      <div className="row-between"><h2>{t('workouts.detail.finisherTitle')}</h2><Tag>{t('workouts.detail.optional')}</Tag></div>
      <p className="small muted">{t('workouts.detail.sportLabel')}</p>
      <div className="wk-sports" role="group" aria-label={t('workouts.detail.sportLabel')}>
        <button type="button" className="chip" aria-pressed={sport === null} onClick={() => onSport(null)}>{t('label.sport.none')}</button>
        {SPORTS.map((x) => <button type="button" key={x} className="chip" aria-pressed={sport === x} onClick={() => onSport(sport === x ? null : x)}>{t(`label.sport.${x}`)}</button>)}
      </div>
      {sport ? (
        <>
          <div className="stack-sm">
            <span className="field-label">{t('workouts.detail.variantLabel')}</span>
            <div className="wk-seg" role="group" aria-label={t('workouts.detail.variantLabel')}>
              {FINISHER_VARIANTS.map((v) => (
                <button type="button" key={v} aria-pressed={variant === v} disabled={v === 'gear' && gearMissing('gear').length > 0} onClick={() => onVariant(v)}>
                  {t(`label.variant.${v}`)}{v === 'gentle' && recommendGentle ? <span className="tiny"> · {t('workouts.detail.recommended')}</span> : null}
                </button>
              ))}
            </div>
            {gearMissing('gear').length > 0 ? <span className="small muted">{t('workouts.detail.needsGear', { gear: gearList })}</span> : null}
          </div>
          {chosen ? (
            <Disclosure summary={t('workouts.detail.previewFinisher', { name: lang === 'he' ? chosen.nameHe : chosen.nameEn })}>
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
            </Disclosure>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
