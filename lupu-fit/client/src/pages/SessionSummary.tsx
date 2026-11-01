import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api, ApiRequestError } from '../api/client.ts';
import { nameOfExercise } from '../data/content.ts';
import { fmt, useLang } from '../i18n/index.tsx';
import { Banner, Button, Card, ErrorState, Loading, Tag } from '../ui/kit.tsx';
import { IconCopy } from '../ui/icons.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/workouts.css';

interface SetRow { id: string; setNo: number; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null }
interface ExRow { id: string; position: number; exerciseId: string; isFinisher: boolean; sport: string | null; sets: SetRow[] }
export interface SessionDetail { id: string; name: string; source: string; sport: string | null; startedAt: string; finishedAt: string | null; durationSec: number | null; localDate: string; xpAwarded: number; exercises: ExRow[] }
export interface FinishResult {
  sessionId: string; durationSec: number; totalSets: number; volumeKg: number;
  prs: { exerciseId: string; kind: string; value: number; previous: number }[];
  xp: { type: string; amount: number }[]; xpTotal: number; achievements: string[]; levelBefore: number; levelAfter: number; sport: string | null; finisherCount: number;
}

const XP_TYPES = ['workout', 'sets', 'pr', 'weekly_goal', 'food_day', 'protein_day', 'weigh_in'];
const PR_KINDS = ['weight', 'est_1rm', 'reps', 'duration'];
const isFinish = (v: unknown): v is FinishResult => !!v && typeof v === 'object' && typeof (v as FinishResult).sessionId === 'string' && Array.isArray((v as FinishResult).prs);

const volumeOf = (s: SessionDetail): number => Math.round(s.exercises.reduce((a, e) => a + e.sets.reduce((b, x) => b + (x.weightKg ?? 0) * (x.reps ?? 0), 0), 0));

export default function SessionSummary(): ReactNode {
  const { t, lang } = useLang();
  const { id = '' } = useParams();
  const loc = useLocation();
  const toast = useToast();
  const q = useQuery({ queryKey: ['session', id], queryFn: () => api.get<SessionDetail>(`/api/sessions/${id}`), retry: false });
  const state = loc.state as { finish?: unknown } | null;
  const finish = isFinish(state?.finish) && state.finish.sessionId === id ? state.finish : null;

  if (q.isLoading) return <Loading />;
  if (q.isError) {
    const nf = q.error instanceof ApiRequestError && q.error.status === 404;
    return <div className="stack"><Link to="/workouts/history">{t('workouts.summary.back')}</Link><ErrorState error={nf ? { code: 'not_found' } : q.error} {...(nf ? {} : { onRetry: () => void q.refetch() })} /></div>;
  }
  const s = q.data!;
  const sportName = (code: string | null): string | null => (code ? t(`label.sport.${code}`) : null);
  const main = s.exercises.filter((e) => !e.isFinisher);
  const fin = s.exercises.filter((e) => e.isFinisher);
  const finSport = sportName(fin.find((e) => e.sport)?.sport ?? s.sport);
  const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0);
  const volume = volumeOf(s);
  const minutes = s.durationSec !== null ? Math.max(1, Math.round(s.durationSec / 60)) : null;
  const dateText = fmt.date(s.localDate, lang, { day: 'numeric', month: 'long', year: 'numeric' });

  const summaryText = (): string => {
    const lines = [t('workouts.summary.textHeader', { name: s.name, date: dateText })];
    lines.push(t('workouts.summary.textLine', { duration: minutes ?? 0, sets: totalSets, volume }));
    if (finish) {
      lines.push(t('workouts.summary.textXp', { n: finish.xpTotal }));
      for (const p of finish.prs) lines.push(t('workouts.summary.textPr', { name: nameOfExercise(p.exerciseId, lang), previous: p.previous, value: p.value, unit: PR_KINDS.includes(p.kind) ? t(`workouts.summary.prUnit.${p.kind}`) : '' }));
    }
    if (fin.length) lines.push(finSport ? t('workouts.summary.finisherRecorded', { sport: finSport }) : t('workouts.summary.finisherRecordedPlain'));
    return lines.join('\n');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(summaryText()); toast(t('workouts.summary.copied'), 'ok'); } catch { toast(t('workouts.summary.copyFailed'), 'error'); }
  };

  const exCard = (e: ExRow): ReactNode => (
    <Card key={e.id} as="article" className="stack-sm">
      <Link to={`/exercises/${e.exerciseId}`} className="wk-ex-name">{nameOfExercise(e.exerciseId, lang)}</Link>
      {e.sets.length === 0 ? <span className="small muted">{t('workouts.summary.noSets')}</span> : (
        <table className="wk-table">
          <thead><tr><th scope="col">{t('workouts.summary.colSet')}</th><th scope="col">{t('workouts.summary.colReps')}</th><th scope="col">{t('workouts.summary.colWeight')}</th><th scope="col">{t('workouts.summary.colTime')}</th><th scope="col">{t('workouts.summary.colRpe')}</th></tr></thead>
          <tbody>
            {e.sets.map((x) => (
              <tr key={x.id}>
                <td className="num">{x.setNo}</td>
                <td className="num">{x.reps ?? '–'}</td>
                <td>{x.weightKg !== null ? <><span className="num">{x.weightKg}</span> {t('unit.kg')}</> : '–'}</td>
                <td>{x.durationSec !== null ? <><span className="num">{x.durationSec}</span> {t('unit.sec')}</> : '–'}</td>
                <td className="num">{x.rpe ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );

  return (
    <div className="stack">
      <Link to="/workouts/history">{t('workouts.summary.back')}</Link>
      <div className="stack-sm">
        <h1>{s.name}</h1>
        <span className="muted">{dateText}</span>
      </div>
      {s.finishedAt === null ? <Banner tone="warn">{t('workouts.summary.unfinished')} <Link to="/workouts/session">{t('workouts.summary.resume')}</Link></Banner> : null}

      {finish ? (
        <Card className="stack wk-celebrate">
          <h2>{t('workouts.summary.celebration')}</h2>
          <div className="wk-stat">
            <div className="kpi"><span className="label">{t('workouts.summary.xp')}</span><span className="num-lg num">{finish.xpTotal}</span></div>
            <div className="kpi"><span className="label">{finish.levelAfter > finish.levelBefore ? t('workouts.summary.levelUp', { from: finish.levelBefore, to: finish.levelAfter }) : t('workouts.summary.levelSame', { level: finish.levelAfter })}</span></div>
          </div>
          {finish.xp.length ? (
            <div className="stack-sm">
              <strong>{t('workouts.summary.xpBreakdown')}</strong>
              <ul className="wk-note-list">
                {finish.xp.map((x, i) => <li key={i}>{XP_TYPES.includes(x.type) ? t(`workouts.summary.xpType.${x.type}`) : x.type}: <span className="num">{x.amount}</span></li>)}
              </ul>
            </div>
          ) : null}
          {finish.prs.length ? (
            <div className="stack-sm">
              <strong>{t('workouts.summary.prs')}</strong>
              {finish.prs.map((p, i) => (
                <div key={i} className="wk-pr">
                  <span>{nameOfExercise(p.exerciseId, lang)} · {PR_KINDS.includes(p.kind) ? t(`workouts.summary.prKind.${p.kind}`) : p.kind}</span>
                  <span><span className="num">{p.previous}</span> → <span className="num">{p.value}</span> {PR_KINDS.includes(p.kind) ? t(`workouts.summary.prUnit.${p.kind}`) : ''}</span>
                </div>
              ))}
            </div>
          ) : null}
          {finish.achievements.length ? (
            <div className="stack-sm">
              <strong>{t('workouts.summary.achievements')}</strong>
              <div className="row-wrap">{finish.achievements.map((a) => <Tag key={a} tone="success">{t(`label.achievement.${a}`)}</Tag>)}</div>
            </div>
          ) : null}
          {finish.finisherCount > 0 ? <Banner tone="ok">{finSport ? t('workouts.summary.finisherRecorded', { sport: finSport }) : t('workouts.summary.finisherRecordedPlain')}</Banner> : null}
        </Card>
      ) : null}

      <Card>
        <div className="wk-stat">
          <div className="kpi"><span className="label">{t('workouts.summary.duration')}</span>{minutes !== null ? <span className="num-lg"><span className="num">{minutes}</span> <span className="small">{t('unit.min')}</span></span> : <span className="muted">{t('state.noData')}</span>}</div>
          <div className="kpi"><span className="label">{t('workouts.summary.sets')}</span><span className="num-lg num">{totalSets}</span></div>
          <div className="kpi"><span className="label">{t('workouts.summary.volume')}</span><span className="num-lg"><span className="num">{volume}</span> <span className="small">{t('unit.kg')}</span></span></div>
          {s.finishedAt !== null ? <div className="kpi"><span className="label">{t('workouts.summary.xp')}</span><span className="num-lg num">{s.xpAwarded}</span></div> : null}
        </div>
      </Card>

      <h2>{t('workouts.summary.exercises')}</h2>
      {main.map(exCard)}
      {fin.length ? <><h2>{finSport ? t('workouts.summary.finisherSection', { sport: finSport }) : t('workouts.summary.finisherSectionNoSport')}</h2>{fin.map(exCard)}</> : null}

      <div><Button onClick={() => void copy()}><IconCopy aria-label={t('action.copy')} /> {t('workouts.summary.copy')}</Button></div>
    </div>
  );
}
