import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ExerciseVideo, ExerciseVideoThumb } from '../ExerciseVideo.tsx';
import { exById, exName } from '../../data/content.ts';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import type { Badge, Defaults, LastPerformance, LiveExercise } from '../../lib/liveSession.ts';
import { IconPlay, IconX } from '../../ui/icons.tsx';
import { Tag } from '../../ui/kit.tsx';
import { LastBadge, ProgressionBadge } from './Badges.tsx';
import { SetLogger, SetRows, type LoggedValues, type RowData } from './SetLogger.tsx';

export function PrescriptionChips({ ex, timed }: { ex: LiveExercise; timed: boolean }): ReactNode {
  const t = useT(); const p = ex.planned;
  const reps = p.repsMin === p.repsMax ? `${p.repsMax}` : `${p.repsMin}–${p.repsMax}`;
  return (
    <div className="row-wrap live-chips lv-chips">
      <Tag>{timed ? t('live.chip.setsSec', { sets: p.sets, sec: p.durationSec ?? 0 }) : t('live.chip.setsReps', { sets: p.sets, reps })}</Tag>
      {p.loadKg ? <Tag><span className="num">{fmt.num(p.loadKg, 2)}</span> {t('unit.kg')}</Tag> : null}
      {p.restSec > 0 ? <Tag>{t('live.chip.rest', { sec: p.restSec })}</Tag> : null}
      <Tag>{t('live.chip.rpe', { rpe: fmt.num(p.rpe, 1) })}</Tag>
    </div>
  );
}

const VIDEO_KEY = 'lf_live_video_open';
function initialVideoOpen(): boolean {
  try { const v = localStorage.getItem(VIDEO_KEY); if (v === '1' || v === '0') return v === '1'; } catch { /* storage blocked */ }
  try { return typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 40rem)').matches; } catch { return false; }
}

/** The exercise being worked on: compact identity row (thumb, name, prescription), collapsible technique video, history, set strip, logger. */
export function ExercisePanel({ ex, rows, timed, showWeight, last, badge, defaults, maxRpe, primary, busy, canUndo, dock, platesSignal, onLog, onUndo }: {
  ex: LiveExercise; rows: RowData[]; timed: boolean; showWeight: boolean; last: LastPerformance | null; badge: Badge; defaults: Defaults; maxRpe: number;
  primary: boolean; busy: boolean; canUndo: boolean; dock: HTMLElement | null; platesSignal: number; onLog: (v: LoggedValues) => void; onUndo: () => void;
}): ReactNode {
  const t = useT(); const { lang } = useLang();
  const [videoOpen, setVideoOpen] = useState(initialVideoOpen);
  const def = exById(ex.exerciseId);
  const name = def ? exName(def, lang) : ex.exerciseId;
  const extra = rows.length >= ex.planned.sets;
  const setNo = rows.length + 1;
  const target = timed
    ? t('live.set.plannedSec', { sec: ex.planned.durationSec ?? 0 })
    : t('live.set.plannedReps', { reps: ex.planned.repsMin === ex.planned.repsMax ? ex.planned.repsMax : `${ex.planned.repsMin}–${ex.planned.repsMax}` });
  const toggleVideo = (): void => { const n = !videoOpen; setVideoOpen(n); try { localStorage.setItem(VIDEO_KEY, n ? '1' : '0'); } catch { /* ignore */ } };
  return (
    <article className="lv-panel" data-testid="exercise-panel">
      <div className="lv-ident">
        <button type="button" className="lv-thumb-btn" aria-expanded={videoOpen} aria-label={videoOpen ? t('live.technique.hide') : t('live.technique.show')} onClick={toggleVideo}>
          <ExerciseVideoThumb exerciseId={ex.exerciseId} alt="" />
          <span className="lv-thumb-badge" aria-hidden="true">{videoOpen ? <IconX /> : <IconPlay />}</span>
        </button>
        <div className="lv-ident-text">
          <h2 className="live-name lv-name"><Link to={`/exercises/${ex.exerciseId}`}>{name}</Link></h2>
          <span className="small muted">{t('live.technique.hint')}</span>
        </div>
      </div>
      <PrescriptionChips ex={ex} timed={timed} />
      {videoOpen ? <div className="lv-video"><ExerciseVideo exerciseId={ex.exerciseId} size="md" alt={name} {...(def ? { steps: lang === 'he' ? def.stepsHe : def.stepsEn } : {})} /></div> : null}
      <div className="lv-lines">
        <LastBadge last={last} timed={timed} />
        <ProgressionBadge badge={badge} />
      </div>
      <SetRows rows={rows} plannedSets={ex.planned.sets} />
      <div className="lv-now">
        <h3 className="lv-setno">{extra ? t('live.set.extra', { n: setNo }) : t('live.set.of', { n: setNo, total: ex.planned.sets })}</h3>
        <span className="lv-target small muted">{t('live.set.target', { target })}</span>
      </div>
      <SetLogger key={ex.id} timed={timed} showWeight={showWeight} defaults={defaults} maxRpe={maxRpe} primary={primary} busy={busy} canUndo={canUndo} dock={dock} platesSignal={platesSignal} onLog={onLog} onUndo={onUndo} />
    </article>
  );
}
