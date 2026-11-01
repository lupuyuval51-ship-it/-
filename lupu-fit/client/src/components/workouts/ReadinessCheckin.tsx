import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReadinessState } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';
import { useLang } from '../../i18n/index.tsx';
import { Button, Card, Segmented, Toggle, errorMessage } from '../../ui/kit.tsx';
import { useToast } from '../../ui/toast.tsx';

export interface Checkin { localDate: string; sleep: number; energy: number; soreness: number; pain: boolean; state: ReadinessState }
export const readinessKey = (date: string) => ['readiness', date] as const;

type Level = '1' | '2' | '3' | '4' | '5';
const LEVELS: Level[] = ['1', '2', '3', '4', '5'];

/** Compact sleep / energy / soreness (1-5) + pain check-in. Saving posts to the server and reports the resulting state. */
export function ReadinessCheckin({ date, current }: { date: string; current: Checkin | null }): ReactNode {
  const { t } = useLang();
  const qc = useQueryClient();
  const toast = useToast();
  const [sleep, setSleep] = useState<Level>(String(current?.sleep ?? 3) as Level);
  const [energy, setEnergy] = useState<Level>(String(current?.energy ?? 3) as Level);
  const [soreness, setSoreness] = useState<Level>(String(current?.soreness ?? 3) as Level);
  const [pain, setPain] = useState(current?.pain ?? false);
  const save = useMutation({
    mutationFn: async () => (await api.post<{ state: ReadinessState }>('/api/readiness', { localDate: date, sleep: Number(sleep), energy: Number(energy), soreness: Number(soreness), pain })).state,
    onSuccess: (state) => {
      qc.setQueryData(readinessKey(date), { checkin: { localDate: date, sleep: Number(sleep), energy: Number(energy), soreness: Number(soreness), pain, state } });
      void qc.invalidateQueries({ queryKey: ['readiness'] });
      toast(t('workouts.detail.checkinSaved'), 'ok');
    },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const [open, setOpen] = useState(false);
  const opts = LEVELS.map((l) => ({ value: l, label: l }));
  return (
    <Card className="wk-readiness">
      <div className="row-between">
        <div className="stack-sm">
          <h2>{t('workouts.detail.readinessTitle')}</h2>
          {current ? <span className="small">{t('workouts.detail.state', { state: t(`label.readiness.${current.state}`) })}</span> : <span className="small muted">{t('workouts.detail.checkinPrompt')}</span>}
        </div>
        <Button size="sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? t('action.close') : current ? t('workouts.detail.checkinEdit') : t('workouts.detail.checkinOpen')}</Button>
      </div>
      {open ? (
        <div className="stack">
          <span className="small muted">{t('workouts.detail.scale')}</span>
          <div className="wk-readiness-grid">
            <div className="stack-sm"><span className="field-label">{t('workouts.detail.sleep')}</span><Segmented<Level> label={t('workouts.detail.sleep')} value={sleep} options={opts} onChange={setSleep} /></div>
            <div className="stack-sm"><span className="field-label">{t('workouts.detail.energy')}</span><Segmented<Level> label={t('workouts.detail.energy')} value={energy} options={opts} onChange={setEnergy} /></div>
            <div className="stack-sm"><span className="field-label">{t('workouts.detail.soreness')}</span><Segmented<Level> label={t('workouts.detail.soreness')} value={soreness} options={opts} onChange={setSoreness} /></div>
          </div>
          <Toggle label={t('workouts.detail.pain')} checked={pain} onChange={setPain} />
          <div><Button disabled={save.isPending} onClick={() => save.mutate()}>{t('workouts.detail.saveCheckin')}</Button></div>
        </div>
      ) : null}
    </Card>
  );
}
