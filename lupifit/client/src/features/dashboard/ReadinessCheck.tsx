import type { ReadinessCheckin } from '@shared/readiness';
import { READINESS_ENERGY, READINESS_SLEEP, READINESS_SORENESS } from '@shared/readiness';
import { Segmented } from '../../components/ui';
import { useI18n } from '../../i18n';

/** What the user has tapped so far; unanswered questions count as neutral when the workout starts. */
export type ReadinessDraft = Partial<ReadinessCheckin>;

/** Neutral answers used for questions the user skipped (they never make a session easier). */
const NEUTRAL: ReadinessCheckin = { energy: 'normal', soreness: 'none', sleep: 'ok' };

export const completeReadiness = (d: ReadinessDraft): ReadinessCheckin | undefined =>
  d.energy || d.soreness || d.sleep ? { ...NEUTRAL, ...d } : undefined;

/**
 * Optional "how do you feel today?" taps next to the start button. Collapsed by default and sent only
 * if the user touches it, so the normal start flow is unchanged. Two negative answers make the
 * session easier (one set fewer, lower effort, no load increases); nothing here can make it harder.
 */
export function ReadinessCheck({ value, onChange, suggestEasier }: { value: ReadinessDraft; onChange(v: ReadinessDraft): void; suggestEasier: boolean }) {
  const { t, tx } = useI18n();
  const opts = <T extends string>(group: 'energy' | 'soreness' | 'sleep', values: readonly T[]) =>
    values.map((v) => ({ value: v, label: tx(`dashboard.readiness.${group}.${v}`) }));
  return (
    <details className="readiness" open={suggestEasier || undefined}>
      <summary>{t('dashboard.readiness.title')}</summary>
      <div className="stack-sm readiness-body">
        {suggestEasier && <p className="small muted">{t('dashboard.readiness.suggestEasier')}</p>}
        <Segmented
          size="sm"
          label={t('dashboard.readiness.energy.label')}
          options={opts('energy', READINESS_ENERGY)}
          value={value.energy ?? null}
          onChange={(energy) => onChange({ ...value, energy })}
        />
        <Segmented
          size="sm"
          label={t('dashboard.readiness.soreness.label')}
          options={opts('soreness', READINESS_SORENESS)}
          value={value.soreness ?? null}
          onChange={(soreness) => onChange({ ...value, soreness })}
        />
        <Segmented
          size="sm"
          label={t('dashboard.readiness.sleep.label')}
          options={opts('sleep', READINESS_SLEEP)}
          value={value.sleep ?? null}
          onChange={(sleep) => onChange({ ...value, sleep })}
        />
        <p className="small faint">{t('dashboard.readiness.hint')}</p>
      </div>
    </details>
  );
}
