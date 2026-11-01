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
import { Banner, Button, ChipGroup, EmptyState, ErrorState, Loading } from '../../ui/kit.tsx';
import { Disclosure, StepDots } from '../../ui/patterns.tsx';
import { IconX } from '../../ui/icons.tsx';
import { ChoiceCards } from './ChoiceCards.tsx';
import { IconBody, IconGym, IconHouse, IconKettle, IconNone, IconTree } from './wkIcons.tsx';
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
  const initial = (): ReadyFilterState => ({ ...EMPTY_FILTER, equipment: profile.equipment.filter((e): e is Equipment => (ALL_EQUIPMENT_FOR_PICKER as readonly string[]).includes(e)) });
  const [s, setS] = useState<ReadyFilterState>(() => loadStored() ?? initial());
  const [shown, setShown] = useState(PAGE);
  /** A finished step the person reopened from the summary bar. */
  const [editing, setEditing] = useState<1 | 2 | 3 | null>(null);
  useEffect(() => { try { localStorage.setItem(READY_FILTER_STORE, JSON.stringify(s)); } catch { /* preference only */ } }, [s]);
  useEffect(() => { setShown(PAGE); }, [s]);

  const sessions = useQuery({ queryKey: ['sessions', 'recent'], queryFn: async () => (await api.get<{ sessions: { name: string }[] }>('/api/sessions', { limit: 6 })).sessions, retry: false });
  const recent = useMemo(() => recentFocusFromSessions(sessions.data ?? [], READY_WORKOUTS), [sessions.data]);

  const step = filterStep(s);
  const update = (patch: Partial<ReadyFilterState>) => setS((x) => ({ ...x, ...patch }));
  const pickPlace = (place: Place) => {
    setEditing(null);
    if (place === s.place) return;
    update({ place, equipmentDone: place === 'gym', equipment: place === 'gym' ? [] : s.equipment, mode: null, focus: null });
  };
  const pickMode = (mode: WorkoutMode) => { setEditing(null); if (mode !== s.mode) update({ mode, focus: null }); };
  const toggleEquip = (e: Equipment) => update({ equipment: s.equipment.includes(e) ? s.equipment.filter((x) => x !== e) : [...s.equipment, e], ...(s.equipmentDone ? {} : { mode: null, focus: null }) });

  const baseFilter = useMemo(() => toReadyFilter(s, false), [s]);
  const counts = useMemo(() => (step >= 4 ? focusCounts(READY_WORKOUTS, baseFilter) : new Map<WorkoutFocus, number>()), [step, baseFilter]);
  const result = useMemo(() => {
    if (step < 4) return null;
    const list = filterReadyWorkouts(READY_WORKOUTS, toReadyFilter(s, true));
    const person = personProfile(profile, availableEquipment(s));
    return { matched: list.length, ...rankReadyWorkouts(list, CATALOG, person, { recentFocus: recent }) };
  }, [step, s, profile, recent]);

  const foci = (Object.keys(FOCUS_MUSCLES) as WorkoutFocus[]).filter((f) => (counts.get(f) ?? 0) > 0);
  const totalFoci = foci.reduce((a, f) => a + (counts.get(f) ?? 0), 0);
  const stepList: number[] = s.place && !needsEquipmentStep(s.place) ? [1, 3, 4] : [1, 2, 3, 4];
  const shownStep = editing ?? step;

  const equipLabel = s.equipment.length === 0 ? t('label.equipment.none') : s.equipment.length <= 2 ? s.equipment.map((e) => t(`label.equipment.${e}`)).join(' + ') : t('workouts.ready.equipCount', { n: s.equipment.length });
  const edit = (n: 1 | 2 | 3) => setEditing((cur) => (cur === n ? null : n));
  const chip = (n: 1 | 2 | 3, label: string): ReactNode => (
    <button key={n} type="button" className="wk-sumchip" aria-pressed={editing === n} aria-label={`${t('workouts.ready.change')}: ${label}`} onClick={() => edit(n)}>{label}</button>
  );
  const clearChip = (key: string, label: string, onClear: () => void): ReactNode => (
    <button key={key} type="button" className="wk-sumchip" aria-label={t('workouts.ready.clear', { name: label })} onClick={onClear}>{label}<IconX /></button>
  );
  const chips: ReactNode[] = [];
  if (s.place && step > 1) chips.push(chip(1, t(`label.place.${s.place}`)));
  if (s.place && needsEquipmentStep(s.place) && s.equipmentDone) chips.push(chip(2, equipLabel));
  if (s.mode && step >= 4) chips.push(chip(3, t(`label.mode.${s.mode}`)));
  if (step >= 4) {
    chips.push(s.focus ? clearChip('focus', t(`label.focus.${s.focus}`), () => update({ focus: null })) : <span key="all" className="wk-sumchip static">{t('workouts.ready.allMuscles')}</span>);
    if (s.level) chips.push(clearChip('level', t(`label.difficulty.${s.level}`), () => update({ level: null })));
    if (s.maxMinutes) chips.push(clearChip('mins', t('workouts.unit.minutes', { n: s.maxMinutes }), () => update({ maxMinutes: null })));
  }

  const placeOptions = PLACES.map((p) => ({ value: p, label: t(`label.place.${p}`), hint: t(`workouts.ready.placeHint.${p}`), icon: p === 'gym' ? <IconGym /> : p === 'home' ? <IconHouse /> : <IconTree /> }));
  const modeOptions = MODES.map((m) => ({ value: m, label: t(`label.mode.${m}`), hint: t(`workouts.ready.modeHint.${m}`), icon: m === 'bodyweight' ? <IconBody /> : <IconKettle /> }));

  const resetBtn = <Button size="sm" variant="ghost" className="wk-neutral" onClick={() => { setEditing(null); setS(initial()); }}>{t('workouts.ready.reset')}</Button>;
  const stepTitle = (n: number, key: string): ReactNode => <h2 className="wk-step-title"><span className="wk-step-no num">{n}</span>{t(key)}</h2>;

  return (
    <div className="stack">
      {step < 4 ? <div className="wk-progress"><StepDots current={Math.max(0, stepList.indexOf(step))} total={stepList.length} label={t('workouts.ready.stepOf', { n: Math.max(1, stepList.indexOf(step) + 1), total: stepList.length })} /><span className="small muted">{t('workouts.ready.stepOf', { n: Math.max(1, stepList.indexOf(step) + 1), total: stepList.length })}</span></div> : null}

      {chips.length > 0 || step >= 4 ? (
        <div className="wk-summary" role="region" aria-label={t('workouts.ready.summaryLabel')}>
          <div className="wk-sum-chips">{chips}{result ? null : resetBtn}</div>
          {result ? (
            <div className="wk-sum-foot">
              <strong className="wk-sum-count" aria-live="polite"><span className="num">{result.ranked.length}</span> {t('workouts.ready.workoutsWord')}</strong>
              {resetBtn}
            </div>
          ) : null}
        </div>
      ) : null}

      {shownStep === 1 ? (
        <section className="wk-step">
          {stepTitle(1, 'workouts.ready.step1')}
          <ChoiceCards cols={3} label={t('workouts.ready.step1')} value={s.place} onPick={pickPlace} options={placeOptions} />
        </section>
      ) : null}

      {shownStep === 2 && s.place && needsEquipmentStep(s.place) ? (
        <section className="wk-step">
          {stepTitle(2, 'workouts.ready.step2')}
          <span className="small muted">{t('workouts.ready.equipHint')}</span>
          <button type="button" className="wk-choice wk-choice-wide" aria-pressed={s.equipment.length === 0 && s.equipmentDone} aria-label={t('label.equipment.none')} onClick={() => { update({ equipment: [], equipmentDone: true }); setEditing(null); }}>
            <IconNone /><strong>{t('label.equipment.none')}</strong><span className="small muted">{t('workouts.ready.noneHint')}</span>
          </button>
          <div className="wk-eq" role="group" aria-label={t('workouts.ready.step2')}>
            {ALL_EQUIPMENT_FOR_PICKER.map((e) => <button type="button" key={e} className="chip" aria-pressed={s.equipment.includes(e)} onClick={() => toggleEquip(e)}>{t(`label.equipment.${e}`)}</button>)}
          </div>
          {s.equipment.length === 0 ? <span className="small muted">{t('workouts.ready.equipNone')}</span> : null}
          {!s.equipmentDone || editing === 2 ? <div><Button variant="primary" block onClick={() => { update({ equipmentDone: true }); setEditing(null); }}>{t('workouts.ready.equipNext')}</Button></div> : null}
        </section>
      ) : null}

      {shownStep === 3 ? (
        <section className="wk-step">
          {stepTitle(3, 'workouts.ready.step3')}
          <ChoiceCards cols={2} label={t('workouts.ready.step3')} value={s.mode} onPick={pickMode} options={modeOptions} />
        </section>
      ) : null}

      {step >= 4 ? (
        <section className="wk-step">
          {stepTitle(4, 'workouts.ready.step4')}
          <ChipGroup<WorkoutFocus | 'all'> label={t('workouts.ready.step4')} selected={[s.focus ?? 'all']} onToggle={(f) => update({ focus: f === 'all' || s.focus === f ? null : f })}
            options={[{ value: 'all', label: t('workouts.ready.allMuscles'), count: totalFoci }, ...foci.map((f) => ({ value: f as WorkoutFocus | 'all', label: t(`label.focus.${f}`), count: counts.get(f) ?? 0 }))]} />
          <Disclosure summary={t('workouts.ready.moreFilters')} open={s.level !== null || s.maxMinutes !== null}>
            <div className="stack-sm"><span className="field-label">{t('workouts.ready.level')}</span>
              <ChipGroup<string> label={t('workouts.ready.level')} selected={[s.level ?? '']} onToggle={(v) => update({ level: v ? (v as ReadyFilterState['level']) : null })}
                options={[{ value: '', label: t('workouts.ready.anyLevel') }, ...DIFFICULTIES.map((d) => ({ value: d as string, label: t(`label.difficulty.${d}`) }))]} /></div>
            <div className="stack-sm"><span className="field-label">{t('workouts.ready.maxMinutes')}</span>
              <ChipGroup<string> label={t('workouts.ready.maxMinutes')} selected={[s.maxMinutes === null ? '' : String(s.maxMinutes)]} onToggle={(v) => update({ maxMinutes: v ? Number(v) : null })}
                options={[{ value: '', label: t('workouts.ready.anyDuration') }, ...DURATIONS.map((m) => ({ value: String(m), label: t('workouts.unit.minutes', { n: m }) }))]} /></div>
          </Disclosure>
        </section>
      ) : null}

      {result === null ? null : (
        <section className="stack" aria-live="polite">
          {result.hiddenCount > 0 ? <Banner>{t('workouts.ready.hidden', { n: result.hiddenCount })}</Banner> : null}
          {result.ranked.length === 0 ? (
            <EmptyState title={t('workouts.ready.noMatchTitle')} hint={noMatchHint(s, result.matched, t)} action={<Button onClick={() => setS((x) => ({ ...x, focus: null, level: null, maxMinutes: null }))}>{t('workouts.ready.clearFilters')}</Button>} />
          ) : (
            <>
              <div className="wk-cards">
                {result.ranked.slice(0, shown).map(({ workout: w, personal }) => {
                  const name = lang === 'he' ? w.nameHe : w.nameEn;
                  const lvl = DIFFICULTIES.indexOf(w.level) + 1;
                  const thumbs = personal.items.slice(0, 4);
                  return (
                    <Link key={w.id} to={`/workouts/ready/${w.id}`} className="card card-link wk-card" aria-label={t('workouts.ready.openWorkout', { name })}>
                      <div className="wk-card-top">
                        <h3>{name}</h3>
                        <span className="wk-card-min"><span className="num">{personal.estimatedMinutes}</span><span className="small muted"> {t('unit.min')}</span></span>
                      </div>
                      <div className="wk-card-meta small">
                        <span>{t(`label.focus.${w.focus}`)}</span>
                        <span className="wk-level" role="img" aria-label={t(`label.difficulty.${w.level}`)}>{DIFFICULTIES.map((d, i) => <i key={d} className={i < lvl ? 'on' : ''} />)}<span className="muted">{t(`label.difficulty.${w.level}`)}</span></span>
                        <span className="muted">{t('workouts.ready.exerciseCount', { n: personal.items.length })}</span>
                      </div>
                      <div className="wk-thumbs">
                        {thumbs.map((it) => {
                          const e = EXERCISE_BY_ID.get(it.exerciseId);
                          return <ExerciseVideoThumb key={it.exerciseId} exerciseId={it.exerciseId} alt={e ? exName(e, lang) : it.exerciseId} />;
                        })}
                        {personal.items.length > thumbs.length ? <span className="wk-more num">+{personal.items.length - thumbs.length}</span> : null}
                      </div>
                      <div className="small muted">{w.equipment.length === 0 ? t('label.equipment.none') : w.equipment.map((q) => t(`label.equipment.${q}`)).join(' · ')}</div>
                    </Link>
                  );
                })}
              </div>
              {shown < result.ranked.length ? <div><Button block onClick={() => setShown((n) => n + PAGE)}>{t('action.more')}</Button></div> : null}
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
