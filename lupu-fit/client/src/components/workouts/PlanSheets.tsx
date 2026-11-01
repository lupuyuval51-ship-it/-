import { useMemo, useState, type ReactNode } from 'react';
import { applyAllSafety, basePrescription, isExerciseSafe, type ExerciseDef, type Prescription, type SwapContext } from '@lupu-fit/shared';
import { EXERCISES, EXERCISE_BY_ID, exName } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';
import { alternativesFor, unsafeReason, type AltReason } from '../../lib/workoutCompose.ts';
import { Button, NumberStepper, Sheet, TextInput } from '../../ui/kit.tsx';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';
import type { PersonProfile } from '@lupu-fit/shared';

const CATALOG = EXERCISE_BY_ID as ReadonlyMap<string, ExerciseDef>;

function AltRow({ id, safe, reason, onPick }: { id: string; safe: boolean; reason: AltReason | null; onPick: () => void }): ReactNode {
  const { t, lang } = useLang();
  const e = EXERCISE_BY_ID.get(id);
  const name = e ? exName(e, lang) : id;
  return (
    <div className="wk-alt" data-unsafe={!safe}>
      <ExerciseVideoThumb exerciseId={id} alt={name} />
      <div className="wk-ex-body"><span className="wk-ex-name">{name}</span>{reason ? <span className="small muted">{t(`workouts.plan.reason.${reason}`)}</span> : null}</div>
      <Button size="sm" disabled={!safe} aria-label={t('workouts.plan.swapTo', { name })} onClick={onPick}>{t('action.apply')}</Button>
    </div>
  );
}

export function SwapSheet({ open, onClose, exerciseId, ctx, onSwap }: { open: boolean; onClose: () => void; exerciseId: string | null; ctx: SwapContext; onSwap: (id: string) => void }): ReactNode {
  const { t, lang } = useLang();
  const ex = exerciseId ? CATALOG.get(exerciseId) : undefined;
  const easier = ex ? alternativesFor(ex, 'easier', CATALOG, ctx) : [];
  const harder = ex ? alternativesFor(ex, 'harder', CATALOG, ctx) : [];
  return (
    <Sheet open={open && !!ex} onClose={onClose} title={t('workouts.plan.swapTitle', { name: ex ? exName(ex, lang) : '' })}>
      {easier.length === 0 && harder.length === 0 ? <p className="muted">{t('workouts.plan.noAlternative')}</p> : null}
      {easier.length ? <div className="stack-sm"><strong>{t('workouts.plan.easier')}</strong>{easier.map((a) => <AltRow key={a.id} id={a.id} safe={a.safe} reason={a.reason} onPick={() => onSwap(a.id)} />)}</div> : null}
      {harder.length ? <div className="stack-sm"><strong>{t('workouts.plan.harder')}</strong>{harder.map((a) => <AltRow key={a.id} id={a.id} safe={a.safe} reason={a.reason} onPick={() => onSwap(a.id)} />)}</div> : null}
    </Sheet>
  );
}

export function EditSheet({ open, onClose, exerciseId, value, onChange }: { open: boolean; onClose: () => void; exerciseId: string | null; value: Prescription | null; onChange: (patch: Partial<Prescription>) => void }): ReactNode {
  const { t, lang } = useLang();
  const ex = exerciseId ? CATALOG.get(exerciseId) : undefined;
  if (!ex || !value) return null;
  return (
    <Sheet open={open} onClose={onClose} title={`${t('workouts.plan.edit')}: ${exName(ex, lang)}`}>
      <NumberStepper label={t('workouts.plan.sets')} value={value.sets} min={1} max={10} onChange={(v) => onChange({ sets: v ?? 1 })} />
      {value.durationSec ? (
        <NumberStepper label={t('workouts.plan.seconds')} value={value.durationSec} min={5} max={600} step={5} onChange={(v) => onChange({ durationSec: v ?? 30 })} />
      ) : (
        <div className="grid-2">
          <NumberStepper label={t('workouts.plan.repsMin')} value={value.repsMin} min={1} max={100} onChange={(v) => onChange({ repsMin: v ?? 1, repsMax: Math.max(value.repsMax, v ?? 1) })} />
          <NumberStepper label={t('workouts.plan.repsMax')} value={value.repsMax} min={1} max={100} onChange={(v) => onChange({ repsMax: v ?? 1, repsMin: Math.min(value.repsMin, v ?? 1) })} />
        </div>
      )}
      {ex.externallyLoaded ? <NumberStepper label={t('workouts.plan.load')} value={value.loadKg} min={0} max={1000} step={2.5} decimals={1} onChange={(v) => onChange({ loadKg: v && v > 0 ? v : null })} /> : null}
      <Button onClick={onClose}>{t('action.done')}</Button>
    </Sheet>
  );
}

export function AddSheet({ open, onClose, ctx, person, onAdd }: { open: boolean; onClose: () => void; ctx: SwapContext; person: Pick<PersonProfile, 'age' | 'goal' | 'experience'>; onAdd: (id: string, p: Prescription) => void }): ReactNode {
  const { t, lang } = useLang();
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return EXERCISES.filter((e) => e.nameHe.toLowerCase().includes(s) || e.nameEn.toLowerCase().includes(s)).slice(0, 10);
  }, [q]);
  return (
    <Sheet open={open} onClose={onClose} title={t('workouts.plan.addExercise')}>
      <TextInput label={t('workouts.plan.addSearch')} type="search" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim() && results.length === 0 ? <p className="muted small">{t('workouts.gen.noResults')}</p> : null}
      {results.map((e) => {
        const reason = unsafeReason(e, ctx);
        const safe = isExerciseSafe(e, ctx);
        return (
          <div key={e.id} className="wk-alt" data-unsafe={!safe}>
            <ExerciseVideoThumb exerciseId={e.id} alt={exName(e, lang)} />
            <div className="wk-ex-body"><span className="wk-ex-name">{exName(e, lang)}</span>{reason ? <span className="small muted">{t(`workouts.plan.reason.${reason}`)}</span> : null}</div>
            <Button size="sm" disabled={!safe} aria-label={t('workouts.plan.addTo', { name: exName(e, lang) })} onClick={() => {
              const base = basePrescription(person.goal, person.experience, e);
              onAdd(e.id, applyAllSafety(base, { age: person.age, readiness: 'normal', externallyLoaded: e.externallyLoaded }));
              setQ('');
            }}>{t('action.add')}</Button>
          </div>
        );
      })}
    </Sheet>
  );
}
