import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client.ts';
import { fmt, useLang } from '../../i18n/index.tsx';
import { Button, Card, EmptyState, ErrorState, LinkButton, ProgressBar, Sheet, Tag, errorMessage } from '../../ui/kit.tsx';
import { SkeletonList } from '../../ui/patterns.tsx';
import { IconDumbbell } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { PLANS_KEY, usePlans, useRecentSessions, type PlanRow } from './plansApi.ts';
import { localDateStr } from '../../lib/workoutCompose.ts';
import { weekStartOf } from './weekUtil.ts';

export function PlansTab(): ReactNode {
  const { t, lang } = useLang();
  const q = usePlans();
  const recent = useRecentSessions();
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

  if (q.isLoading) return <SkeletonList rows={3} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const plans = q.data ?? [];
  if (plans.length === 0) {
    return <EmptyState icon={<IconDumbbell />} title={t('workouts.plans.emptyTitle')} hint={t('workouts.plans.emptyHint')} action={<Button onClick={() => nav('/workouts?tab=generator')}>{t('workouts.plans.toGenerator')}</Button>} />;
  }
  const live = plans.filter((p) => !p.archived).sort((a, b) => Number(b.active) - Number(a.active));
  const archived = plans.filter((p) => p.archived);
  const weekStart = weekStartOf(localDateStr(), lang);
  const doneThisWeek = (recent.data ?? []).filter((x) => x.localDate >= weekStart).length;

  const row = (p: PlanRow): ReactNode => {
    const days = p.plan.days;
    const next = days.length > 0 ? doneThisWeek % days.length : 0;
    return (
      <Card key={p.id} as="article" className={`wk-plan${p.active ? ' hero-card' : ''}`}>
        <div className="wk-plan-top">
          <div className="stack-sm">
            {p.active ? <Tag tone="success">{t('workouts.plans.active')}</Tag> : null}
            <Link to={`/workouts/plans/${p.id}`} className="wk-plan-name" aria-label={`${t('workouts.plans.open')}: ${p.name}`}>{p.name}</Link>
          </div>
          {days.length > 0 ? <div className="wk-card-min" title={t('workouts.plans.avgMinutes')}><span className="num">{Math.round(days.reduce((a, d) => a + d.estimatedMinutes, 0) / days.length)}</span><span className="small muted"> {t('unit.min')}</span></div> : null}
        </div>
        <div className="wk-tags" aria-hidden="true">{days.map((d, i) => <span key={i} className="wk-daychip">{t(`workouts.day.${d.day}`)}</span>)}</div>
        <div className="wk-meta">
          <span>{t('workouts.unit.days', { n: days.length })}</span>
          <span>{t('workouts.plans.created', { date: fmt.date(p.createdAt, lang, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span>
        </div>
        {p.active && days.length > 0 && recent.data ? (
          <div className="stack-sm">
            <ProgressBar value={Math.min(doneThisWeek, days.length)} max={days.length} label={t('workouts.plans.weekProgress', { done: doneThisWeek, total: days.length })} />
            <span className="small muted">{t('workouts.plans.weekProgress', { done: doneThisWeek, total: days.length })}</span>
          </div>
        ) : null}
        {p.active && !p.archived && days.length > 0 ? <LinkButton variant="primary" block to={`/workouts/plans/${p.id}?day=${next + 1}`}>{t('workouts.plans.continue', { day: next + 1 })}</LinkButton> : null}
        <div className="wk-actions wk-actions-quiet" role="group" aria-label={t('workouts.plans.actionsFor', { name: p.name })}>
          {p.archived ? <Button size="sm" variant="ghost" className="wk-neutral" disabled={act.isPending} onClick={() => act.mutate({ kind: 'restore', plan: p })}>{t('workouts.plans.restore')}</Button> : (
            <>
              {p.active ? null : <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ kind: 'activate', plan: p })}>{t('workouts.plans.activate')}</Button>}
              <Button size="sm" variant="ghost" className="wk-neutral" disabled={act.isPending} onClick={() => act.mutate({ kind: 'archive', plan: p })}>{t('workouts.plans.archive')}</Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="wk-neutral" disabled={act.isPending} onClick={() => act.mutate({ kind: 'duplicate', plan: p })}>{t('workouts.plans.duplicate')}</Button>
          <Button size="sm" variant="ghost" className="wk-danger" disabled={act.isPending} onClick={() => setConfirm(p)}>{t('workouts.plans.delete')}</Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="stack">
      {live.map(row)}
      <div><LinkButton to="/workouts?tab=generator" block>{t('workouts.plans.toGenerator')}</LinkButton></div>
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

