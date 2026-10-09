import { useQuery } from '@tanstack/react-query';
import { useId, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import type { ExerciseDetailDTO, ExerciseListItemDTO, ExerciseMediaDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { Badge, Card, EmptyState, ErrorState, Icon, LinkButton, LoadingState, Notice } from '../../components/ui';
import { fetchExercise } from '../../features/exercises/api';
import { DIFFICULTY_TONE, ExerciseCard } from '../../features/exercises/ExerciseCard';
import { formatList, formatLoggedSet, localizedList, type SetFormatter } from '../../features/exercises/format';
import { deeperNav, readLibraryNav, type LibraryNavState } from '../../features/exercises/navigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import '../../styles/exercises.css';

export default function ExerciseDetailPage() {
  const { t, lt } = useI18n();
  const { exerciseId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const nav = readLibraryNav(location.state);
  const query = useQuery({ queryKey: qk.exercise(exerciseId), queryFn: ({ signal }) => fetchExercise(exerciseId, signal) });
  useDocumentTitle(query.data ? lt(query.data.name) : t('exercises.title'));

  // Straight from the library: go back in history (restores filters, loaded pages and
  // scroll position). Otherwise: open the library with the filters the user came from.
  const backTo = `/exercises${nav?.librarySearch ?? ''}`;
  const onBack = (e: MouseEvent<HTMLAnchorElement>) => {
    if (nav?.depth !== 1 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(-1);
  };
  const backLink = (
    <Link to={backTo} className="back-link" onClick={onBack}>
      <Icon name="chevronLeft" size={18} />
      <span>{t('exercises.detail.back')}</span>
    </Link>
  );

  if (query.isPending) {
    return (
      <>
        {backLink}
        <LoadingState />
      </>
    );
  }
  if (query.isError) {
    // 400 = malformed id: it cannot exist either.
    const missing = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return (
      <>
        {backLink}
        {missing ? (
          <EmptyState
            icon="search"
            title={t('exercises.detail.notFoundTitle')}
            body={t('exercises.detail.notFoundBody')}
            action={
              <LinkButton to={backTo} variant="primary">
                {t('exercises.detail.browseLibrary')}
              </LinkButton>
            }
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </>
    );
  }
  return <ExerciseDetailView exercise={query.data} nav={nav} backLink={backLink} />;
}

function ExerciseDetailView({ exercise: ex, nav, backLink }: { exercise: ExerciseDetailDTO; nav: LibraryNavState | null; backLink: ReactNode }) {
  const { t, lt, locale, intlLocale } = useI18n();
  const { formatWeight } = useUnits();
  const titleId = useId();
  const name = lt(ex.name);
  const list = (items: string[]) => formatList(items, intlLocale);
  const coachHref = `/coach?q=${encodeURIComponent(t('exercises.detail.coachQuestion', { name }))}`;
  const steps = localizedList(ex.instructions, locale);
  const mistakes = localizedList(ex.mistakes, locale);
  const safety = localizedList(ex.safety, locale);
  const altNav = deeperNav(nav);

  return (
    <article className="ex-detail" aria-labelledby={titleId}>
      <header className="page-header">
        {backLink}
        <div className="page-header-row">
          <div className="stack-sm">
            <h1 className="page-title" id={titleId}>
              {name}
            </h1>
            <div className="ex-badges">
              <Badge tone={DIFFICULTY_TONE[ex.difficulty]}>{t(`enums.difficulty.${ex.difficulty}`)}</Badge>
              <Badge>{t(`enums.category.${ex.category}`)}</Badge>
              <Badge>{t(`enums.movementPattern.${ex.movementPattern}`)}</Badge>
              <Badge>{t(`enums.trackingType.${ex.trackingType}`)}</Badge>
              {ex.unilateral && <Badge tone="info">{t('exercises.detail.unilateral')}</Badge>}
            </div>
          </div>
          <div className="page-actions">
            <LinkButton to={coachHref} variant="primary" icon="chat">
              {t('exercises.detail.askCoach')}
            </LinkButton>
          </div>
        </div>
      </header>

      {ex.userContext && <PersonalFit exercise={ex} list={list} />}

      <div className="ex-detail-grid">
        <div className="stack">
          <Card title={t('exercises.detail.overview')}>
            <div className="stack">
              <p>{lt(ex.description)}</p>
              {ex.unilateral && <p className="muted small">{t('exercises.detail.unilateralNote')}</p>}
              <div>
                <h3 className="ex-subheading">{t('exercises.detail.targetMuscles')}</h3>
                <dl className="ex-muscles">
                  <div className="ex-muscles-row">
                    <dt>{t('exercises.detail.primary')}</dt>
                    <dd>
                      <ul className="ex-tags" role="list">
                        {ex.primaryMuscles.map((m) => (
                          <li key={m}>
                            <Badge tone="primary">{t(`enums.muscle.${m}`)}</Badge>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  {ex.secondaryMuscles.length > 0 && (
                    <div className="ex-muscles-row">
                      <dt>{t('exercises.detail.secondary')}</dt>
                      <dd>
                        <ul className="ex-tags" role="list">
                          {ex.secondaryMuscles.map((m) => (
                            <li key={m}>
                              <Badge>{t(`enums.muscle.${m}`)}</Badge>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <h3 className="ex-subheading">{t('exercises.detail.equipment')}</h3>
                <p>{ex.equipment.length > 0 ? list(ex.equipment.map((q) => t(`enums.equipment.${q}`))) : t('exercises.detail.noEquipment')}</p>
              </div>
            </div>
          </Card>

          <Card title={t('exercises.detail.howTo')}>
            <div className="stack">
              {ex.media ? (
                <ExerciseMedia media={ex.media} name={name} />
              ) : (
                <p className="ex-media-note">
                  <Icon name="info" size={18} />
                  <span>{t('exercises.detail.noMedia')}</span>
                </p>
              )}
              <div>
                <h3 className="ex-subheading">{t('exercises.detail.steps')}</h3>
                <ol className="ex-steps" role="list">
                  {steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>

          <Card title={t('exercises.detail.mistakes')}>
            <ul className="ex-bullets ex-bullets-mistakes">
              {mistakes.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>

          <Card title={t('exercises.detail.safety')}>
            <div className="stack">
              <ul className="ex-bullets ex-bullets-safety">
                {safety.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              {ex.contraindications.length > 0 && (
                <p className="muted small">{t('exercises.detail.contraindications', { areas: list(ex.contraindications.map((a) => t(`enums.injury.${a}`))) })}</p>
              )}
            </div>
          </Card>

          {(ex.easierAlternatives.length > 0 || ex.harderAlternatives.length > 0) && (
            <Card title={t('exercises.detail.alternatives')}>
              <div className="stack">
                <AlternativeList title={t('exercises.detail.easier')} items={ex.easierAlternatives} navState={altNav} />
                <AlternativeList title={t('exercises.detail.harder')} items={ex.harderAlternatives} navState={altNav} />
              </div>
            </Card>
          )}
        </div>

        <aside className="stack" aria-label={t('exercises.detail.details')}>
          <ExerciseHistory exercise={ex} />
          <Card title={t('exercises.detail.details')}>
            <dl className="kv">
              <dt>{t('exercises.detail.movementPattern')}</dt>
              <dd>{t(`enums.movementPattern.${ex.movementPattern}`)}</dd>
              <dt>{t('exercises.detail.trackingType')}</dt>
              <dd>{t(`enums.trackingType.${ex.trackingType}`)}</dd>
              <dt>{t('exercises.detail.mechanics')}</dt>
              <dd>{ex.isCompound ? t('exercises.detail.compound') : t('exercises.detail.isolation')}</dd>
              <dt>{t('exercises.detail.sides')}</dt>
              <dd>{ex.unilateral ? t('exercises.detail.unilateral') : t('exercises.detail.bothSides')}</dd>
              {ex.loadIncrementKg != null && (
                <>
                  <dt>{t('exercises.detail.loadIncrement')}</dt>
                  <dd>{formatWeight(ex.loadIncrementKg)}</dd>
                </>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </article>
  );
}

/** Equipment and injury fit for the signed-in user. */
function PersonalFit({ exercise: ex, list }: { exercise: ExerciseDetailDTO; list(items: string[]): string }) {
  const { t } = useI18n();
  const ctx = ex.userContext!;
  const editEquipment = (
    <Link to="/profile" className="link">
      {t('exercises.detail.fit.editEquipment')}
    </Link>
  );
  return (
    <section className="ex-fit stack-sm" aria-label={t('exercises.detail.fit.title')}>
      {ctx.injuryConflicts.length > 0 && (
        <Notice tone="warning" icon="warning" title={t('exercises.detail.fit.injuryTitle', { areas: list(ctx.injuryConflicts.map((a) => t(`enums.injury.${a}`))) })}>
          {t('exercises.detail.fit.injuryBody')}
        </Notice>
      )}
      {ctx.hasRequiredEquipment ? (
        <Notice tone="success">{ex.equipment.length === 0 ? t('exercises.detail.fit.noEquipmentNeeded') : t('exercises.detail.fit.hasEquipment')}</Notice>
      ) : (
        <Notice tone="warning" icon="dumbbell" title={t('exercises.detail.fit.missingEquipment', { items: list(ctx.missingEquipment.map((q) => t(`enums.equipment.${q}`))) })}>
          {t('exercises.detail.fit.missingHint')} {editEquipment}
        </Notice>
      )}
    </section>
  );
}

function ExerciseMedia({ media, name }: { media: ExerciseMediaDTO; name: string }) {
  const { t } = useI18n();
  const label = t('exercises.detail.mediaAlt', { name });
  return (
    <figure className="ex-media">
      {media.type === 'video' ? (
        <video controls playsInline preload="metadata" src={media.url} aria-label={label} />
      ) : (
        <img src={media.url} alt={label} loading="lazy" />
      )}
      {media.credit && <figcaption className="muted small">{t('exercises.detail.mediaCredit', { credit: media.credit })}</figcaption>}
    </figure>
  );
}

function AlternativeList({ title, items, navState }: { title: string; items: ExerciseListItemDTO[]; navState: LibraryNavState | undefined }) {
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <h3 className="ex-subheading" id={headingId}>
        {title}
      </h3>
      <ul className="ex-alt-grid" role="list">
        {items.map((a) => (
          <li key={a.id}>
            <ExerciseCard exercise={a} navState={navState} headingLevel="h4" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExerciseHistory({ exercise: ex }: { exercise: ExerciseDetailDTO }) {
  const { t, formatDate } = useI18n();
  const { formatWeight } = useUnits();
  const formatter: SetFormatter = {
    formatWeight,
    reps: (count) => t('exercises.history.reps', { count }),
    repsTimesWeight: (reps, weight) => t('exercises.history.repsTimesWeight', { reps, weight }),
    seconds: (count) => t('exercises.history.seconds', { count }),
  };
  return (
    <Card title={t('exercises.history.title')}>
      {ex.recentHistory.length === 0 ? (
        <p className="empty-inline">{t('exercises.history.empty')}</p>
      ) : (
        <ol className="ex-history" role="list">
          {ex.recentHistory.map((h) => {
            const date = formatDate(h.date, { year: 'numeric' });
            return (
              <li key={h.sessionId} className="ex-history-item">
                <div className="row-between">
                  <Link to={`/workouts/sessions/${h.sessionId}`} className="link" aria-label={t('exercises.history.viewSession', { date })}>
                    {date}
                  </Link>
                  {h.bestEst1rmKg != null && <span className="small muted">{t('exercises.history.bestE1rm', { value: formatWeight(h.bestEst1rmKg) })}</span>}
                </div>
                <ul className="ex-sets" role="list" aria-label={t('exercises.history.sets')}>
                  {h.sets.map((s, i) => {
                    const label = formatLoggedSet(s, formatter);
                    return label ? (
                      <li key={i} className="ex-set">
                        {label}
                      </li>
                    ) : null;
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
