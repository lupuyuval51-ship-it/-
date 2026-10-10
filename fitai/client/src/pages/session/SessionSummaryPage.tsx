import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import type { SessionSummaryDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LinkButton,
  LoadingState,
  Notice,
  PageHeader,
  Stat,
  useConfirm,
  useToast,
} from '../../components/ui';
import { deleteSession, fetchSessionSummary, sessionKeys } from '../../features/sessions/api';
import { NextSteps } from '../../features/sessions/NextSteps';
import { formatDuration, formatRecordValue, formatSetValues } from '../../features/sessions/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import '../../styles/session.css';
import '../../styles/ux-session.css';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SessionSummaryPage() {
  const { t } = useI18n();
  const { sessionId = '' } = useParams();
  const valid = UUID_RE.test(sessionId);
  useDocumentTitle(t('session.summary.pageTitle'));
  const query = useQuery({
    queryKey: sessionKeys.summary(sessionId),
    queryFn: () => fetchSessionSummary(sessionId),
    enabled: valid,
    staleTime: 5 * 60_000,
  });

  const notFound = (
    <>
      <PageHeader title={t('session.summary.pageTitle')} backTo="/workouts/history" backLabel={t('session.history.title')} />
      <EmptyState
        icon="search"
        title={t('session.summary.notFound')}
        action={
          <LinkButton to="/workouts/history" variant="primary">
            {t('session.summary.toHistory')}
          </LinkButton>
        }
      />
    </>
  );
  if (!valid) return notFound;
  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const err = query.error;
    if (err instanceof ApiError && err.status === 404) return notFound;
    if (err instanceof ApiError && err.code === 'session_not_completed') {
      return (
        <>
          <PageHeader title={t('session.summary.pageTitle')} />
          <Notice tone="info" title={t('session.summary.notCompleted')}>
            <LinkButton to="/workouts/session" variant="primary" size="sm">
              {t('session.summary.backToWorkout')}
            </LinkButton>
          </Notice>
        </>
      );
    }
    return (
      <>
        <PageHeader title={t('session.summary.pageTitle')} />
        <ErrorState error={err} onRetry={() => void query.refetch()} />
      </>
    );
  }
  return <SummaryView summary={query.data} />;
}

function Delta({ value, format }: { value: number; format(v: number): string }) {
  const { t } = useI18n();
  if (Math.abs(value) < 0.5) return <span className="muted">{t('session.summary.same')}</span>;
  return value > 0 ? (
    <span className="delta delta-up">
      <Icon name="arrowUp" size={14} />
      {t('session.summary.more', { value: format(value) })}
    </span>
  ) : (
    <span className="delta delta-down">
      <Icon name="arrowDown" size={14} />
      {t('session.summary.less', { value: format(-value) })}
    </span>
  );
}

function SummaryView({ summary }: { summary: SessionSummaryDTO }) {
  const i18n = useI18n();
  const { t, tx, lt, formatDate, formatTime, formatNumber } = i18n;
  const { formatWeight } = useUnits();
  const qc = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { session, totals, rewards, previous } = summary;

  const del = useMutation({
    mutationFn: () => deleteSession(session.id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: sessionKeys.summary(session.id) });
      for (const key of [['sessions'], qk.dashboard, ['progress'], qk.gamification, ['exercise']]) void qc.invalidateQueries({ queryKey: key });
      toast.success(t('session.summary.deleted'));
      navigate('/workouts/history', { replace: true });
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'session')),
  });

  return (
    <div className="stack-lg session-summary">
      <PageHeader
        title={t('session.summary.title')}
        subtitle={`${session.name} · ${t('session.summary.when', { date: formatDate(session.endedAt, { weekday: 'long', day: 'numeric', month: 'long' }), time: formatTime(session.endedAt) })}`}
        backTo="/workouts/history"
        backLabel={t('session.history.title')}
      />

      <section className="summary-stats grid-4" aria-label={t('session.summary.pageTitle')}>
        <Stat icon="clock" label={t('session.summary.duration')} value={formatDuration(session.durationSeconds, i18n)} />
        <Stat icon="dumbbell" label={t('session.summary.exercises')} value={formatNumber(totals.exercises)} />
        <Stat icon="check" label={t('session.summary.sets')} value={formatNumber(totals.sets)} hint={t('session.format.repsOnly', { count: totals.reps })} tone="info" />
        <Stat icon="chart" label={t('session.summary.volume')} value={formatWeight(totals.volumeKg)} tone="primary" />
      </section>

      <div className="grid-2">
        <Card title={t('session.summary.records')}>
          {summary.personalRecords.length === 0 ? (
            <p className="empty-inline">{t('session.summary.noRecords')}</p>
          ) : (
            <ul className="list">
              {summary.personalRecords.map((r) => (
                <li key={r.id} className="list-item summary-record">
                  <span className="record-icon" aria-hidden="true">
                    <Icon name="trophy" size={18} />
                  </span>
                  <div className="grow">
                    <strong>{lt(r.exerciseName)}</strong>
                    <div className="small muted">{t(`enums.prType.${r.recordType}`)}</div>
                  </div>
                  <span className="num record-change">
                    <span className="muted">{formatRecordValue(r.recordType, r.previousValue, i18n, formatWeight)}</span>
                    <Icon name="chevronRight" size={14} />
                    <strong>{formatRecordValue(r.recordType, r.value, i18n, formatWeight)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('session.summary.rewards')}>
          <div className="stack-sm">
            <p className="summary-xp">
              {rewards.xpAwarded > 0 ? <Badge tone="success" icon="sparkles">{t('session.summary.xp', { xp: rewards.xpAwarded })}</Badge> : <span className="muted">{t('session.summary.noXp')}</span>}
            </p>
            {rewards.levelUp && <Notice tone="success">{t('session.summary.levelUp', { level: rewards.levelUp.to })}</Notice>}
            {rewards.newAchievements.length > 0 && (
              <div>
                <h3 className="section-title">{t('session.summary.achievements')}</h3>
                <ul className="list">
                  {rewards.newAchievements.map((id) => (
                    <li key={id} className="list-item">
                      <Icon name="trophy" size={18} />
                      <span>{tx(`achievements.${id}.title`, undefined, id)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rewards.notes.map((code) => (
              <p key={code} className="small muted">
                {tx(`session.rewardNotes.${code}`, undefined, t('session.summary.rewardNoteFallback'))}
              </p>
            ))}
          </div>
        </Card>
      </div>

      {previous && (
        <Card title={t('session.summary.comparison')} subtitle={t('session.summary.comparisonDate', { date: formatDate(previous.date) })}>
          <dl className="kv summary-compare">
            <dt>{t('session.summary.volume')}</dt>
            <dd>
              {formatWeight(totals.volumeKg)} <Delta value={totals.volumeKg - previous.volumeKg} format={(v) => formatWeight(v)} />
            </dd>
            <dt>{t('session.summary.duration')}</dt>
            <dd>
              {formatDuration(session.durationSeconds, i18n)}{' '}
              <Delta value={(session.durationSeconds - previous.durationSeconds) / 60} format={(v) => t('session.format.minutes', { minutes: Math.round(v) })} />
            </dd>
          </dl>
        </Card>
      )}

      <Card title={t('session.summary.perExercise')}>
        <ul className="list">
          {summary.exercises.map((e, i) => (
            <li key={`${e.exerciseId}-${i}`} className="list-item">
              <div className="grow">
                <strong>{lt(e.name)}</strong>
                <div className="small muted">{e.completedSets > 0 ? t('session.summary.completedSets', { count: e.completedSets }) : t('session.summary.skipped')}</div>
              </div>
              {e.bestSet && (
                <span className="small summary-best">
                  <span className="muted">{t('session.summary.bestSet')}: </span>
                  <strong className="num">
                    {formatSetValues(e.bestSet, e.trackingType, i18n, formatWeight)}
                  </strong>
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <NextSteps />

      <div className="row summary-actions">
        <LinkButton to="/" variant="primary" icon="home">
          {t('session.summary.toDashboard')}
        </LinkButton>
        <LinkButton to="/progress" icon="chart">
          {t('session.summary.toProgress')}
        </LinkButton>
        <LinkButton to="/workouts" icon="dumbbell">
          {t('session.summary.toWorkouts')}
        </LinkButton>
        <LinkButton to="/workouts/history" variant="ghost" icon="clock">
          {t('session.summary.toHistory')}
        </LinkButton>
        <Button
          variant="danger"
          icon="trash"
          loading={del.isPending}
          onClick={async () => {
            const ok = await confirm({ title: t('session.summary.deleteConfirm'), body: t('session.summary.deleteBody'), confirmLabel: t('common.actions.delete'), danger: true });
            if (ok) del.mutate();
          }}
        >
          {t('session.summary.delete')}
        </Button>
      </div>
    </div>
  );
}
