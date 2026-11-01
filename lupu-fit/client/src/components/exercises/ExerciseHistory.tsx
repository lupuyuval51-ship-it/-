import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ageBucket } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';
import { fmt, useLang } from '../../i18n/index.tsx';
import { useProfile } from '../../app/session.ts';
import { Card, ErrorState, Loading } from '../../ui/kit.tsx';

interface HistorySet { setNo: number; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null }
export interface ExerciseHistoryResponse {
  exerciseId: string;
  history: { sessionId: string; date: string; sets: HistorySet[] }[];
  record: { maxWeight: number | null; est1rm: number | null; maxReps: number | null; maxVolume: number | null; maxDuration: number | null; updatedAt: string } | null;
}

/** Personal history and PRs for one movement. 1RM estimates are never shown to minors (or while age is unknown). */
export function ExerciseHistory({ exerciseId }: { exerciseId: string }): ReactNode {
  const { t, lang } = useLang();
  const profile = useProfile();
  const q = useQuery({ queryKey: ['exercise-history', exerciseId], queryFn: () => api.get<ExerciseHistoryResponse>(`/api/exercises/${exerciseId}/history`) });
  const age = profile.data?.profile.age;
  const allow1rm = age !== undefined && ageBucket(age) !== 'minor';

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const data = q.data;
  const rec = data?.record ?? null;
  const hasAny = !!data && (data.history.length > 0 || rec !== null);
  const setText = (s: HistorySet): string => {
    if (s.durationSec !== null && s.reps === null) return `${s.durationSec} ${t('unit.sec')}`;
    if (s.weightKg !== null && s.reps !== null) return `${fmt.num(s.weightKg, 2)} ${t('unit.kg')} × ${s.reps}`;
    if (s.reps !== null) return `${s.reps} ${t('unit.reps')}`;
    return '—';
  };
  return (
    <Card>
      <h2>{t('exercises.history.title')}</h2>
      {!hasAny ? <p className="muted">{t('exercises.history.empty')}</p> : (
        <div className="stack">
          {rec ? (
            <dl className="ex-kpis">
              {rec.maxWeight !== null ? <div className="kpi"><dt className="label">{t('exercises.history.maxWeight')}</dt><dd><span className="num">{fmt.num(rec.maxWeight, 2)}</span> {t('unit.kg')}</dd></div> : null}
              {rec.maxReps !== null ? <div className="kpi"><dt className="label">{t('exercises.history.maxReps')}</dt><dd><span className="num">{rec.maxReps}</span></dd></div> : null}
              {rec.maxVolume !== null ? <div className="kpi"><dt className="label">{t('exercises.history.maxVolume')}</dt><dd><span className="num">{fmt.num(rec.maxVolume)}</span> {t('unit.kg')}</dd></div> : null}
              {rec.maxDuration !== null ? <div className="kpi"><dt className="label">{t('exercises.history.maxDuration')}</dt><dd><span className="num">{rec.maxDuration}</span> {t('unit.sec')}</dd></div> : null}
              {allow1rm && rec.est1rm !== null ? <div className="kpi"><dt className="label">{t('exercises.history.est1rm')}</dt><dd><span className="num">{fmt.num(rec.est1rm, 1)}</span> {t('unit.kg')}</dd></div> : null}
            </dl>
          ) : null}
          {!allow1rm && age !== undefined ? <p className="small muted">{t('exercises.history.noOneRmMinor')}</p> : null}
          {data && data.history.length > 0 ? (
            <ul className="list">
              {data.history.map((h) => (
                <li key={h.sessionId} className="ex-hist-row">
                  <span className="strong num">{fmt.date(h.date, lang)}</span>
                  <span className="grow small">{h.sets.map((s) => <span key={s.setNo} className="ex-set num">{setText(s)}</span>)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Card>
  );
}
