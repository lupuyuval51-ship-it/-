import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.ts';
import { fmt, useLang } from '../../i18n/index.tsx';
import { Button, Card, EmptyState, ErrorState, Loading, Sheet, Tag, errorMessage } from '../../ui/kit.tsx';
import { IconDumbbell } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { PLANS_KEY, usePlans, type PlanRow } from './plansApi.ts';

export function PlansTab(): ReactNode {
  const { t, lang } = useLang();
  const q = usePlans();
  const qc = useQueryClient();
  const toast = useToast();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState<PlanRow | null>(null);

  const act = useMutation({
    mutationFn: async (a: { kind: 'activate' | 'archive' | 'restore' | 'duplicate' | 'delete'; plan: PlanRow }) => {
      const id = a.plan.id;
      if (a.kind === 'activate') await api.post(`/api/plans/${id}/activate`);
      else if (a.kind === 'archive') await api.patch(`/api/plans/${id}`, { archived: true });
      else if (a.kind === 'restore') await api.patch(`/api/plans/${id}`, { archived: false });
      else if (a.kind === 'duplicate') await api.post(`/api/plans/${id}/duplicate`);
      else await api.delete(`/api/plans/${id}`);
      return a.kind;
    },
    onSuccess: (kind) => {
      void qc.invalidateQueries({ queryKey: PLANS_KEY });
      const msg = { activate: 'workouts.plans.activated', archive: 'workouts.plans.archivedToast', restore: 'workouts.plans.restored', duplicate: 'workouts.plans.duplicated', delete: 'workouts.plans.deleted' }[kind];
      toast(t(msg), 'ok');
      setConfirm(null);
    },
    onError: (e) => { toast(errorMessage(e, t), 'error'); setConfirm(null); },
  });

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const plans = q.data ?? [];
  if (plans.length === 0) {
    return <EmptyState icon={<IconDumbbell />} title={t('workouts.plans.emptyTitle')} hint={t('workouts.plans.emptyHint')} action={<Button onClick={() => nav('/workouts?tab=generator')}>{t('workouts.plans.toGenerator')}</Button>} />;
  }
  const live = plans.filter((p) => !p.archived);
  const archived = plans.filter((p) => p.archived);

  const row = (p: PlanRow): ReactNode => (
    <Card key={p.id} as="article" className="wk-plan">
      <div className="wk-plan-top">
        <Link to={`/workouts/plans/${p.id}`} className="wk-plan-name" aria-label={`${t('workouts.plans.open')}: ${p.name}`}>{p.name}</Link>
        {p.active ? <Tag tone="success">{t('workouts.plans.active')}</Tag> : null}
      </div>
      <div className="wk-meta">
        <span>{t('workouts.unit.days', { n: p.plan.days.length })}</span>
        <span>{t('workouts.plans.created', { date: fmt.date(p.createdAt, lang, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span>
      </div>
      <div className="wk-actions" role="group" aria-label={t('workouts.plans.actionsFor', { name: p.name })}>
        {p.archived ? <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ kind: 'restore', plan: p })}>{t('workouts.plans.restore')}</Button> : (
          <>
            {p.active ? null : <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ kind: 'activate', plan: p })}>{t('workouts.plans.activate')}</Button>}
            <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ kind: 'archive', plan: p })}>{t('workouts.plans.archive')}</Button>
          </>
        )}
        <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ kind: 'duplicate', plan: p })}>{t('workouts.plans.duplicate')}</Button>
        <Button size="sm" variant="danger" disabled={act.isPending} onClick={() => setConfirm(p)}>{t('workouts.plans.delete')}</Button>
      </div>
    </Card>
  );

  return (
    <div className="stack">
      {live.map(row)}
      {archived.length ? <><h2>{t('workouts.plans.archivedHeading')}</h2>{archived.map(row)}</> : null}
      <Sheet open={confirm !== null} onClose={() => setConfirm(null)} title={t('workouts.plans.delete')}>
        <p>{confirm ? t('workouts.plans.confirmDelete', { name: confirm.name }) : null}</p>
        <div className="wk-actions">
          <Button variant="danger" disabled={act.isPending} onClick={() => confirm && act.mutate({ kind: 'delete', plan: confirm })}>{t('workouts.plans.delete')}</Button>
          <Button onClick={() => setConfirm(null)}>{t('action.cancel')}</Button>
        </div>
      </Sheet>
    </div>
  );
}

