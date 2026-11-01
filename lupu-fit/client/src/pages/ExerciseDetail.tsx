import type { ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { isExerciseSafe } from '@lupu-fit/shared';
import { useLang } from '../i18n/index.tsx';
import { EXERCISE_BY_ID, exName, type ExerciseContent } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { Banner, EmptyState, LinkButton, Tabs, Tag } from '../ui/kit.tsx';
import { Disclosure, PageHeader } from '../ui/patterns.tsx';
import { IconSearch } from '../ui/icons.tsx';
import { ExerciseVideo, ExerciseVideoThumb } from '../components/ExerciseVideo.tsx';
import { ExerciseHistory } from '../components/exercises/ExerciseHistory.tsx';
import { safetyContext } from '../components/exercises/search.ts';
import '../styles/exercises.css';

const TABS = ['steps', 'cues', 'mistakes', 'history'] as const;
type Tab = (typeof TABS)[number];

function AltRow({ title, ids, unsafeIds }: { title: string; ids: readonly string[]; unsafeIds: ReadonlySet<string> }): ReactNode {
  const { t, lang } = useLang();
  const list = ids.map((id) => EXERCISE_BY_ID.get(id)).filter((e): e is ExerciseContent => !!e);
  return (
    <div className="stack-sm">
      <h3>{title}</h3>
      {list.length === 0 ? <p className="small muted">{t('exercises.detail.noAlternatives')}</p> : (
        <ul className="exd-alts">
          {list.map((e) => (
            <li key={e.id}>
              <Link to={`/exercises/${e.id}`} className="exd-alt">
                <ExerciseVideoThumb exerciseId={e.id} alt="" />
                <span className="stack-sm"><span className="small strong">{exName(e, lang)}</span>{unsafeIds.has(e.id) ? <Tag tone="warning">{t('exercises.unsafeTag')}</Tag> : null}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ExerciseDetail(): ReactNode {
  const { t, lang } = useLang();
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const profile = useProfile().data?.profile ?? null;
  const ex = EXERCISE_BY_ID.get(id);
  if (!ex) {
    return <EmptyState icon={<IconSearch />} title={t('exercises.detail.notFound')} hint={t('exercises.detail.notFoundHint')} action={<LinkButton to="/exercises">{t('exercises.detail.backToList')}</LinkButton>} />;
  }
  const raw = sp.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(raw ?? '') ? (raw as Tab) : 'steps';
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
  const gear = ex.equipment.map((q) => t(`label.equipment.${q}`)).join(', ');

  return (
    <div className="stack">
      <div className="exd-bar"><PageHeader title={name} back="/exercises" /></div>
      <div className="row-wrap">
        {ex.primary.map((m) => <Tag key={m}>{t(`label.muscle.${m}`)}</Tag>)}
        <Tag>{t(`label.category.${ex.category}`)}</Tag>
        <Tag>{t(`label.difficulty.${ex.difficulty}`)}</Tag>
        <Tag>{gear}</Tag>
      </div>
      {injuryHit.length > 0 ? <Banner tone="warn">{t('exercises.detail.injuryWarning', { areas: injuryHit.map((c) => t(`label.injury.${c}`)).join(', ') })}</Banner> : null}
      <div className="exd-grid">
        <div className="stack-sm exd-media">
          <ExerciseVideo exerciseId={ex.id} size="hero" steps={steps} alt={name} />
          <p className="tiny muted">{t('video.illustration')}</p>
        </div>
        <div className="stack">
          <Tabs label={t('exercises.detail.tabsLabel')} value={tab} onChange={(v) => setSp(v === 'steps' ? {} : { tab: v }, { replace: true })} tabs={TABS.map((x) => ({ value: x, label: t(`exercises.detail.tab${x[0]!.toUpperCase()}${x.slice(1)}`) }))} />
          <div role="tabpanel" className="exd-panel">
            {tab === 'steps' ? <><h2 className="sr-only">{t('exercises.detail.steps')}</h2><ol className="ex-ol">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol></> : null}
            {tab === 'cues' ? <><h2 className="sr-only">{t('exercises.detail.cues')}</h2><ul className="ex-ul">{cues.map((s, i) => <li key={i}>{s}</li>)}</ul></> : null}
            {tab === 'mistakes' ? <><h2 className="sr-only">{t('exercises.detail.mistakes')}</h2><ul className="ex-ul">{mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></> : null}
            {tab === 'history' ? <ExerciseHistory exerciseId={ex.id} /> : null}
          </div>
          <Banner tone="warn"><strong>{t('exercises.detail.safety')}</strong> {safety}</Banner>
        </div>
      </div>
      <section className="stack" aria-label={t('exercises.detail.alternatives')}>
        <AltRow title={t('exercises.detail.easier')} ids={ex.easierAlternatives} unsafeIds={unsafeIds} />
        <AltRow title={t('exercises.detail.harder')} ids={ex.harderAlternatives} unsafeIds={unsafeIds} />
      </section>
      <Disclosure summary={t('exercises.detail.moreDetails')}>
        <dl className="exd-facts">
          <div><dt className="label">{t('exercises.detail.primary')}</dt><dd>{ex.primary.map((m) => t(`label.muscle.${m}`)).join(', ')}</dd></div>
          <div><dt className="label">{t('exercises.detail.secondary')}</dt><dd>{ex.secondary.length ? ex.secondary.map((m) => t(`label.muscle.${m}`)).join(', ') : '—'}</dd></div>
          <div><dt className="label">{t('exercises.detail.equipment')}</dt><dd>{gear}</dd></div>
          <div><dt className="label">{t('exercises.detail.contra')}</dt><dd>{ex.contraindications.length ? ex.contraindications.map((c) => t(`label.injury.${c}`)).join(', ') : t('exercises.detail.contraNone')}</dd></div>
        </dl>
      </Disclosure>
    </div>
  );
}
