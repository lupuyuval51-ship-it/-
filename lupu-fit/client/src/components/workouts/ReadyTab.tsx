import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { DIFFICULTIES, focusCounts, FOCUS_MUSCLES, filterReadyWorkouts, rankReadyWorkouts, type Equipment, type ExerciseDef, type Place, type WorkoutFocus, type WorkoutMode } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';
import { useProfile } from '../../app/session.ts';
import { ALL_EQUIPMENT_FOR_PICKER, EXERCISE_BY_ID, READY_WORKOUTS, exName } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';
import {
  availableEquipment, EMPTY_FILTER, filterStep, needsEquipmentStep, personProfile, READY_FILTER_STORE, recentFocusFromSessions, sanitizeFilter, toReadyFilter,
  type ReadyFilterState,
} from '../../lib/workoutCompose.ts';
import { Banner, Button, Card, ChipGroup, EmptyState, ErrorState, Loading, Select, Tag } from '../../ui/kit.tsx';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';

const PAGE = 12;
const DURATIONS = [20, 30, 45, 60, 90];
const PLACES: Place[] = ['gym', 'home', 'park'];
const MODES: WorkoutMode[] = ['bodyweight', 'weights'];
const CATALOG = EXERCISE_BY_ID as ReadonlyMap<string, ExerciseDef>;

function loadStored(): ReadyFilterState | null {
  try { const raw = localStorage.getItem(READY_FILTER_STORE); return raw ? sanitizeFilter(JSON.parse(raw), ALL_EQUIPMENT_FOR_PICKER) : null; } catch { return null; }
}

export function ReadyTab(): ReactNode {
  const { t } = useLang();
  const prof = useProfile();
  if (prof.isLoading) return <Loading />;
  if (prof.isError) return <ErrorState error={prof.error} onRetry={() => void prof.refetch()} />;
  if (!prof.data) return <Banner tone="warn">{t('workouts.ready.profileMissing')}</Banner>;
  return <ReadyFlow profile={prof.data.profile} />;
}

function ReadyFlow({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>['data']>['profile'] }): ReactNode {
  const { t, lang } = useLang();
  const [s, setS] = useState<ReadyFilterState>(() => loadStored() ?? { ...EMPTY_FILTER, equipment: profile.equipment.filter((e): e is Equipment => (ALL_EQUIPMENT_FOR_PICKER as readonly string[]).includes(e)) });
  const [shown, setShown] = useState(PAGE);
  useEffect(() => { try { localStorage.setItem(READY_FILTER_STORE, JSON.stringify(s)); } catch { /* preference only */ } }, [s]);
  useEffect(() => { setShown(PAGE); }, [s]);

  const sessions = useQuery({ queryKey: ['sessions', 'recent'], queryFn: async () => (await api.get<{ sessions: { name: string }[] }>('/api/sessions', { limit: 6 })).sessions, retry: false });
  const recent = useMemo(() => recentFocusFromSessions(sessions.data ?? [], READY_WORKOUTS), [sessions.data]);

  const step = filterStep(s);
  const update = (patch: Partial<ReadyFilterState>) => setS((x) => ({ ...x, ...patch }));
  const pickPlace = (place: Place) => update({ place, equipmentDone: place === 'gym', equipment: place === 'gym' ? [] : s.equipment, mode: null, focus: null });

  const baseFilter = useMemo(() => toReadyFilter(s, false), [s]);
  const counts = useMemo(() => (step >= 4 ? focusCounts(READY_WORKOUTS, baseFilter) : new Map<WorkoutFocus, number>()), [step, baseFilter]);
  const result = useMemo(() => {
    if (step < 4) return null;
    const list = filterReadyWorkouts(READY_WORKOUTS, toReadyFilter(s, true));
    const person = personProfile(profile, availableEquipment(s));
    return { matched: list.length, ...rankReadyWorkouts(list, CATALOG, person, { recentFocus: recent }) };
  }, [step, s, profile, recent]);

  const foci = (Object.keys(FOCUS_MUSCLES) as WorkoutFocus[]).filter((f) => (counts.get(f) ?? 0) > 0);

  return (
    <div className="stack">
      <section className={`wk-step${step > 1 ? ' done' : ''}`}>
        <h2 className="wk-step-title"><span className="wk-step-no num">1</span>{t('workouts.ready.step1')}</h2>
        <ChipGroup label={t('workouts.ready.step1')} selected={s.place ? [s.place] : []} onToggle={pickPlace} options={PLACES.map((p) => ({ value: p, label: t(`label.place.${p}`) }))} />
      </section>

      {s.place && needsEquipmentStep(s.place) ? (
        <section className={`wk-step${step > 2 ? ' done' : ''}`}>
          <h2 className="wk-step-title"><span className="wk-step-no num">2</span>{t('workouts.ready.step2')}</h2>
          <span className="small muted">{t('workouts.ready.equipHint')}</span>
          <ChipGroup label={t('workouts.ready.step2')} selected={s.equipment} onToggle={(e) => update({ equipment: s.equipment.includes(e) ? s.equipment.filter((x) => x !== e) : [...s.equipment, e], equipmentDone: false, mode: null, focus: null })}
            options={ALL_EQUIPMENT_FOR_PICKER.map((e) => ({ value: e, label: t(`label.equipment.${e}`) }))} />
          {s.equipment.length === 0 ? <span className="small muted">{t('workouts.ready.equipNone')}</span> : null}
          {!s.equipmentDone ? <div><Button onClick={() => update({ equipmentDone: true })}>{t('workouts.ready.equipNext')}</Button></div> : null}
        </section>
      ) : null}

      {step >= 3 ? (
        <section className={`wk-step${step > 3 ? ' done' : ''}`}>
          <h2 className="wk-step-title"><span className="wk-step-no num">3</span>{t('workouts.ready.step3')}</h2>
          <ChipGroup label={t('workouts.ready.step3')} selected={s.mode ? [s.mode] : []} onToggle={(mode) => update({ mode, focus: null })} options={MODES.map((m) => ({ value: m, label: t(`label.mode.${m}`) }))} />
        </section>
      ) : null}

      {step >= 4 ? (
        <section className="wk-step">
          <h2 className="wk-step-title"><span className="wk-step-no num">4</span>{t('workouts.ready.step4')}</h2>
          <ChipGroup label={t('workouts.ready.step4')} selected={s.focus ? [s.focus] : []} onToggle={(f) => update({ focus: s.focus === f ? null : f })}
            options={foci.map((f) => ({ value: f, label: t(`label.focus.${f}`), count: counts.get(f) ?? 0 }))} />
          <div className="grid-2">
            <Select label={t('workouts.ready.level')} value={s.level ?? ''} onChange={(e) => update({ level: e.target.value ? (e.target.value as ReadyFilterState['level']) : null })}
              options={[{ value: '', label: t('workouts.ready.anyLevel') }, ...DIFFICULTIES.map((d) => ({ value: d, label: t(`label.difficulty.${d}`) }))]} />
            <Select label={t('workouts.ready.maxMinutes')} value={s.maxMinutes === null ? '' : String(s.maxMinutes)} onChange={(e) => update({ maxMinutes: e.target.value ? Number(e.target.value) : null })}
              options={[{ value: '', label: t('workouts.ready.anyDuration') }, ...DURATIONS.map((m) => ({ value: String(m), label: t('workouts.unit.minutes', { n: m }) }))]} />
          </div>
        </section>
      ) : null}

      <div><Button size="sm" variant="ghost" onClick={() => setS({ ...EMPTY_FILTER, equipment: profile.equipment.filter((e): e is Equipment => (ALL_EQUIPMENT_FOR_PICKER as readonly string[]).includes(e)) })}>{t('workouts.ready.reset')}</Button></div>

      {result === null ? <p className="muted">{t('workouts.ready.pickStep')}</p> : (
        <section className="stack" aria-live="polite">
          {result.hiddenCount > 0 ? <Banner>{t('workouts.ready.hidden', { n: result.hiddenCount })}</Banner> : null}
          {result.ranked.length === 0 ? (
            <EmptyState title={t('workouts.ready.noMatchTitle')} hint={noMatchHint(s, result.matched, t)} />
          ) : (
            <>
              <strong>{t('workouts.ready.results', { n: result.ranked.length })}</strong>
              <div className="wk-cards">
                {result.ranked.slice(0, shown).map(({ workout: w, personal }) => {
                  const name = lang === 'he' ? w.nameHe : w.nameEn;
                  return (
                    <Link key={w.id} to={`/workouts/ready/${w.id}`} className="card card-link wk-card" aria-label={t('workouts.ready.openWorkout', { name })}>
                      <h3>{name}</h3>
                      <div className="wk-tags">
                        <Tag>{t(`label.focus.${w.focus}`)}</Tag><Tag>{t(`label.difficulty.${w.level}`)}</Tag><Tag>{t(`label.style.${w.style}`)}</Tag>
                        {w.equipment.length === 0 ? <Tag>{t('label.equipment.none')}</Tag> : w.equipment.map((q) => <Tag key={q}>{t(`label.equipment.${q}`)}</Tag>)}
                      </div>
                      <span className="small muted"><span className="num">{personal.estimatedMinutes}</span> {t('unit.min')} · {t('workouts.ready.exerciseCount', { n: personal.items.length })}</span>
                      <div className="wk-thumbs">
                        {personal.items.slice(0, 3).map((it) => {
                          const e = EXERCISE_BY_ID.get(it.exerciseId);
                          return <ExerciseVideoThumb key={it.exerciseId} exerciseId={it.exerciseId} alt={e ? exName(e, lang) : it.exerciseId} />;
                        })}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {shown < result.ranked.length ? <div><Button onClick={() => setShown((n) => n + PAGE)}>{t('action.more')}</Button></div> : null}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function noMatchHint(s: ReadyFilterState, matched: number, t: (k: string) => string): string {
  if (matched > 0) return t('workouts.ready.noMatchAllHidden');
  if (s.mode === 'weights' && s.place !== 'gym' && s.equipment.length === 0) return `${t('workouts.ready.noMatchWeightsNoGear')} ${t('workouts.ready.noMatchHint')}`;
  return t('workouts.ready.noMatchHint');
}
