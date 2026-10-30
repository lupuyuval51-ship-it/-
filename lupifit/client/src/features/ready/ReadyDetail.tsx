import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { SportId } from '@shared/constants';
import type { ReadyWorkoutDetailDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { Badge, Button, Card, EmptyState, ErrorState, Icon, LinkButton, LoadingState, Notice, PageHeader, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { formatList } from '../exercises/format';
import { fetchReadyDetail, readyKeys, startBody, startReadyWorkout, type StartReadyBody } from './api';
import { readDetailContext, type DetailContext } from './filters';
import { readyNoteText, splitNotes } from './format';
import type { ReadyNavState } from './ReadyCard';
import { ReadyItemList } from './ReadyItems';
import { SportPicker } from './SportPicker';
import { useReadyPrefs } from './useReadyPrefs';
import '../../styles/workouts.css';
import '../../styles/ready.css';

const LIST_PATH = '/workouts';

function backTarget(state: unknown): string {
  const from = (state as ReadyNavState | null)?.readyFrom;
  return `${LIST_PATH}${typeof from === 'string' && from.startsWith('?tab=ready') ? from : '?tab=ready'}`;
}

/** /workouts/ready/:readyId - one ready workout for the place, gear and sport it was opened with. */
export function ReadyDetail({ readyId }: { readyId: string }) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { prefs, update } = useReadyPrefs();
  const [params, setParams] = useSearchParams();

  const base = readDetailContext(params, prefs);
  // The sport is picked on this page: it starts from the address or the saved choice and then lives here.
  const [sport, setSport] = useState<SportId | null>(base.sport);
  const ctx: DetailContext = { ...base, sport };
  const backTo = backTarget(location.state);

  const query = useQuery({
    queryKey: readyKeys.detail(readyId, ctx),
    queryFn: ({ signal }) => fetchReadyDetail(readyId, ctx, signal),
    enabled: readyId !== '',
    // Changing the sport keeps the page on screen while the new finisher loads.
    placeholderData: keepPreviousData,
  });
  const workout = query.data;
  useDocumentTitle(workout ? lt(workout.name) : t('ready.tab'));

  const start = useIdempotentMutation((body: StartReadyBody, key: string) => startReadyWorkout(body, key), {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.activeSession });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      navigate('/workouts/session');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'session_already_active') {
        // Same as starting a plan day: the workout in progress opens instead, with a line that says why.
        toast.info(errorMessage(err, i18n, 'ready'));
        void queryClient.invalidateQueries({ queryKey: qk.activeSession });
        navigate('/workouts/session');
        return;
      }
      toast.error(errorMessage(err, i18n, 'ready'));
    },
  });

  const chooseSport = (next: SportId | null) => {
    setSport(next);
    update({ sport: next });
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev);
        if (next) copy.set('sport', next);
        else copy.delete('sport');
        return copy;
      },
      { replace: true, state: location.state },
    );
  };

  const header = <PageHeader title={workout ? lt(workout.name) : t('ready.tab')} subtitle={workout ? lt(workout.description) : undefined} backTo={backTo} backLabel={t('ready.detail.back')} />;

  if (!workout) {
    if (query.isPending) return <div className="ready-detail stack-lg">{header}<LoadingState /></div>;
    return <div className="ready-detail stack-lg">{header}<DetailError error={query.error} backTo={backTo} onRetry={() => void query.refetch()} /></div>;
  }

  // While the answer for a newly picked sport is on its way, what is shown is the previous one: do not start it.
  const stale = query.isPlaceholderData;
  const onStart = () => {
    if (start.isPending || stale) return;
    start.mutate(startBody(readyId, ctx, workout.sport ? workout.sport.sport : null));
  };

  return (
    <div className="ready-detail stack-lg">
      {header}
      <WorkoutFacts workout={workout} />
      <SportPicker value={sport} onChange={chooseSport} busy={stale} />
      <SportNotes workout={workout} sport={sport} />
      <WarmupTip minutes={workout.warmupMinutes} />
      <AdjustedNotes workout={workout} />
      <Card as="section" title={t('ready.detail.exercisesTitle')}>
        <ReadyItemList items={workout.items} label={t('ready.detail.exercisesTitle')} />
      </Card>
      {workout.sport && (
        <Card as="section" title={t('ready.sport.sectionTitle', { sport: t(`enums.sport.${workout.sport.sport}`) })} subtitle={t('ready.sport.sectionMinutes', { minutes: i18n.formatNumber(workout.sport.estimatedMinutes) })} className="ready-block">
          <div className="stack">
            <div>
              <strong className="ready-block-name">{lt(workout.sport.name)}</strong>
              <p className="muted">{lt(workout.sport.description)}</p>
            </div>
            <ReadyItemList items={workout.sport.items} label={t('ready.sport.sectionTitle', { sport: t(`enums.sport.${workout.sport.sport}`) })} />
            <p className="small muted">{t('ready.sport.disclaimer')}</p>
          </div>
        </Card>
      )}
      <div className="sticky-actions ready-start">
        <p className="ready-start-summary">
          <span className="small muted">{t('ready.detail.totalTime')}</span>
          <strong className="num">{t('ready.minutes', { minutes: i18n.formatNumber(workout.totalMinutes) })}</strong>
        </p>
        <Button variant="primary" size="lg" icon="play" loading={start.isPending} disabled={stale} onClick={onStart}>
          {t('ready.detail.start')}
        </Button>
      </div>
    </div>
  );
}

/** Tags, the equipment the workout needs and the time, with the sport finisher counted in. */
function WorkoutFacts({ workout }: { workout: ReadyWorkoutDetailDTO }) {
  const { t, formatNumber, intlLocale } = useI18n();
  const equipment = workout.equipment.length > 0 ? formatList(workout.equipment.map((q) => t(`enums.equipment.${q}`)), intlLocale) : t('ready.card.noEquipment');
  return (
    <div className="ready-facts-block stack-sm">
      <ul className="ready-card-tags" aria-label={t('ready.card.details')}>
        <li>
          <Badge tone="primary">{t(`enums.readyFocus.${workout.focus}`)}</Badge>
        </li>
        <li>
          <Badge>{t(`enums.difficulty.${workout.level}`)}</Badge>
        </li>
        <li>
          <Badge>{t(`enums.trainingMode.${workout.mode}`)}</Badge>
        </li>
      </ul>
      <p className="ready-card-gear small muted">
        <Icon name="dumbbell" size={14} />
        <span>
          <span className="visually-hidden">{t('ready.card.equipment')}: </span>
          {equipment}
        </span>
      </p>
      <dl className="ready-facts">
        <div>
          <dt>{t('ready.detail.totalTime')}</dt>
          <dd>
            <span className="num-display">{formatNumber(workout.totalMinutes)}</span> <span className="small muted">{t('common.units.min')}</span>
          </dd>
        </div>
        <div>
          <dt>{t('ready.detail.exercisesLabel')}</dt>
          <dd className="num-display">{formatNumber(workout.exerciseCount)}</dd>
        </div>
        <div>
          <dt>{t('ready.detail.setsLabel')}</dt>
          <dd className="num-display">{formatNumber(workout.totalSets)}</dd>
        </div>
      </dl>
      {workout.sport && (
        <p className="small muted num">
          {t('ready.detail.breakdown', { workout: formatNumber(workout.estimatedMinutes), sport: formatNumber(workout.sport.estimatedMinutes) })}
        </p>
      )}
    </div>
  );
}

function WarmupTip({ minutes }: { minutes: number }) {
  const { t, formatNumber } = useI18n();
  return (
    <Notice tone="info" icon="flame" title={t('ready.detail.warmupTitle')}>
      <p>{t('ready.detail.warmup')}</p>
      {minutes > 0 && <p className="small muted">{t('ready.detail.includesWarmup', { minutes: formatNumber(minutes) })}</p>}
    </Notice>
  );
}

/** What the sport choice led to: the server's own notes, or one plain line when there is no finisher. */
function SportNotes({ workout, sport }: { workout: ReadyWorkoutDetailDTO; sport: SportId | null }) {
  const i18n = useI18n();
  const texts = splitNotes(workout.notes)
    .sport.map((n) => readyNoteText(n, i18n))
    .filter((x): x is string => x != null);
  if (texts.length === 0 && sport && !workout.sport) texts.push(i18n.t('ready.sport.noBlock'));
  if (texts.length === 0) return null;
  return (
    <Notice tone="info">
      {texts.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </Notice>
  );
}

/** Calm explanation of what was changed for this user (age, injuries, equipment). */
function AdjustedNotes({ workout }: { workout: ReadyWorkoutDetailDTO }) {
  const i18n = useI18n();
  const texts = splitNotes(workout.notes)
    .adjusted.map((n) => readyNoteText(n, i18n))
    .filter((x): x is string => x != null);
  if (texts.length === 0) return null;
  return (
    <Notice tone="info" title={i18n.t('ready.notes.title')}>
      <ul className="ready-notes">
        {texts.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </Notice>
  );
}

function DetailError({ error, backTo, onRetry }: { error: unknown; backTo: string; onRetry(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const back = (
    <LinkButton to={backTo} variant="primary">
      {t('ready.detail.back')}
    </LinkButton>
  );
  if (error instanceof ApiError && (error.status === 404 || error.code === 'ready_workout_not_found')) {
    return <EmptyState icon="search" title={t('ready.detail.notFoundTitle')} body={t('ready.detail.notFoundBody')} action={back} />;
  }
  if (error instanceof ApiError && error.code === 'ready_workout_unavailable') {
    return <EmptyState icon="info" title={t('ready.detail.unavailableTitle')} body={errorMessage(error, i18n, 'ready')} action={back} />;
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}
