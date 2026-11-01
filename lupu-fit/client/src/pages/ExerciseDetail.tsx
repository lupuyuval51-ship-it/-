import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { isExerciseSafe } from '@lupu-fit/shared';
import { useLang } from '../i18n/index.tsx';
import { EXERCISE_BY_ID, exName, type ExerciseContent } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { Banner, Card, EmptyState, LinkButton, Tag } from '../ui/kit.tsx';
import { IconSearch } from '../ui/icons.tsx';
import { ExerciseVideo } from '../components/ExerciseVideo.tsx';
import { ExerciseHistory } from '../components/exercises/ExerciseHistory.tsx';
import { safetyContext } from '../components/exercises/search.ts';
import '../styles/exercises.css';

function Alternatives({ ids, unsafeIds }: { ids: readonly string[]; unsafeIds: ReadonlySet<string> }): ReactNode {
  const { t, lang } = useLang();
  const list = ids.map((id) => EXERCISE_BY_ID.get(id)).filter((e): e is ExerciseContent => !!e);
  if (list.length === 0) return <p className="small muted">{t('exercises.detail.noAlternatives')}</p>;
  return (
    <ul className="list">
      {list.map((e) => (
        <li key={e.id}>
          <Link to={`/exercises/${e.id}`} className="grow">{exName(e, lang)}</Link>
          {unsafeIds.has(e.id) ? <Tag tone="warning">{t('exercises.unsafeTag')}</Tag> : null}
        </li>
      ))}
    </ul>
  );
}

export default function ExerciseDetail(): ReactNode {
  const { t, lang } = useLang();
  const { id = '' } = useParams();
  const profile = useProfile().data?.profile ?? null;
  const ex = EXERCISE_BY_ID.get(id);
  if (!ex) {
    return <EmptyState icon={<IconSearch />} title={t('exercises.detail.notFound')} hint={t('exercises.detail.notFoundHint')} action={<LinkButton to="/exercises">{t('exercises.detail.backToList')}</LinkButton>} />;
  }
  const ctx = profile ? safetyContext(profile, false) : null;
  const unsafe = (e: ExerciseContent): boolean => !!ctx && !isExerciseSafe(e, ctx);
  const unsafeIds = new Set([...ex.easierAlternatives, ...ex.harderAlternatives].filter((x) => { const e = EXERCISE_BY_ID.get(x); return !!e && unsafe(e); }));
  const name = exName(ex, lang);
  const he = lang === 'he';
  const steps = he ? ex.stepsHe : ex.stepsEn;
  const cues = he ? ex.cuesHe : ex.cuesEn;
  const mistakes = he ? ex.mistakesHe : ex.mistakesEn;
  const safety = he ? ex.safetyHe : ex.safetyEn;
  const injuryHit = ex.contraindications.filter((c) => profile?.injuries.includes(c));

  return (
    <div className="stack">
      <LinkButton to="/exercises" variant="ghost" size="sm">{t('exercises.detail.backToList')}</LinkButton>
      <h1>{name}</h1>
      <div className="row-wrap">
        {ex.primary.map((m) => <Tag key={m}>{t(`label.muscle.${m}`)}</Tag>)}
        <Tag>{t(`label.category.${ex.category}`)}</Tag>
        <Tag>{t(`label.difficulty.${ex.difficulty}`)}</Tag>
      </div>
      {injuryHit.length > 0 ? <Banner tone="warn">{t('exercises.detail.injuryWarning', { areas: injuryHit.map((c) => t(`label.injury.${c}`)).join(', ') })}</Banner> : null}
      <div className="ex-detail-grid">
        <div className="stack-sm">
          <ExerciseVideo exerciseId={ex.id} size="lg" steps={steps} alt={name} />
          <p className="tiny muted">{t('video.illustration')}</p>
        </div>
        <div className="stack">
          <Card>
            <h2>{t('exercises.detail.steps')}</h2>
            <ol className="ex-ol">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </Card>
          <Card>
            <h2>{t('exercises.detail.cues')}</h2>
            <ul className="ex-ul">{cues.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </Card>
          <Card>
            <h2>{t('exercises.detail.mistakes')}</h2>
            <ul className="ex-ul">{mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </Card>
        </div>
      </div>
      <Banner tone="warn"><strong>{t('exercises.detail.safety')}</strong> {safety}</Banner>
      <Card>
        <dl className="ex-facts">
          <div><dt className="label">{t('exercises.detail.primary')}</dt><dd>{ex.primary.map((m) => t(`label.muscle.${m}`)).join(', ')}</dd></div>
          <div><dt className="label">{t('exercises.detail.secondary')}</dt><dd>{ex.secondary.length ? ex.secondary.map((m) => t(`label.muscle.${m}`)).join(', ') : '—'}</dd></div>
          <div><dt className="label">{t('exercises.detail.equipment')}</dt><dd>{ex.equipment.map((q) => t(`label.equipment.${q}`)).join(', ')}</dd></div>
          <div><dt className="label">{t('exercises.detail.contra')}</dt><dd>{ex.contraindications.length ? ex.contraindications.map((c) => t(`label.injury.${c}`)).join(', ') : t('exercises.detail.contraNone')}</dd></div>
        </dl>
      </Card>
      <div className="grid-2">
        <Card><h2>{t('exercises.detail.easier')}</h2><Alternatives ids={ex.easierAlternatives} unsafeIds={unsafeIds} /></Card>
        <Card><h2>{t('exercises.detail.harder')}</h2><Alternatives ids={ex.harderAlternatives} unsafeIds={unsafeIds} /></Card>
      </div>
      <ExerciseHistory exerciseId={ex.id} />
    </div>
  );
}
