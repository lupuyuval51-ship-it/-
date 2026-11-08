import { useEffect, useMemo, useRef, useState } from 'react';
import { PALETTES, TRAITS, TRAIT_LABEL } from '../../../shared/constants.ts';
import type { Trait } from '../../../shared/types.ts';
import { levelFor, totalTraits } from '../../engine/progression.ts';
import type { CompletedEpisode } from '../../engine/types.ts';
import { getCuratedAdventure } from '../../content/library.ts';
import { useStore } from '../../state/store.tsx';
import { TRAIT_COLOR, TraitMeter } from '../components/Bits.tsx';
import { PosterActions, PosterImage } from '../components/Poster.tsx';
import { formatClock, pad2 } from '../hooks.ts';
import { IconArrowRight, IconFilm, IconSparkle } from '../icons.tsx';
import { navigate } from '../router.ts';
import { typographic } from '../../../shared/template.ts';
import { uiAccent } from '../color.ts';

export function Recap({ episode }: { episode: CompletedEpisode }) {
  return (
    <ol className="space-y-3">
      {episode.steps.map((s) => (
        <li key={s.nodeId} className="rounded-2xl border border-ivory/8 bg-ivory/[0.025] p-3.5">
          <p className="t-kicker">
            Stage {s.stage} · {s.title}
            {s.usedAlternative ? ' · alternate route' : ''}
          </p>
          <p className="mt-1 text-[14.5px] text-ivory-dim">{typographic(s.action)}</p>
          {s.choiceLabel && (
            <p className="mt-2 text-[14px]">
              <span className="text-ivory-mute">{s.choicePrompt ? `${s.choicePrompt} → ` : 'You chose: '}</span>
              <strong className="text-ivory">{s.choiceLabel}</strong>
            </p>
          )}
          {s.note && (
            <p className="t-serif-italic mt-2 text-[14.5px] text-ivory">
              <span className="t-kicker mr-1.5 not-italic">{s.noteLabel ?? 'Note'}</span>“{s.note}”
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function JournalField({ episode }: { episode: CompletedEpisode }) {
  const { setJournal } = useStore();
  const [value, setValue] = useState(episode.journal);
  const [saved, setSaved] = useState(false);
  const commit = () => {
    if (value.trim() !== episode.journal) {
      setJournal(episode.id, value.trim());
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    }
  };
  return (
    <div>
      <label htmlFor={`journal-${episode.id}`} className="t-kicker mb-2 block">
        One sentence for your journal <span className="normal-case tracking-normal text-ivory-mute">(optional)</span>
      </label>
      <textarea
        id={`journal-${episode.id}`}
        className="field min-h-[76px] resize-none"
        rows={2}
        maxLength={200}
        value={value}
        placeholder="Today I learned my street has a second floor."
        onChange={(e) => setValue(e.target.value.replace(/\n/g, ' '))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
      />
      <p className="mt-1.5 h-4 text-[12.5px] text-ok" aria-live="polite">
        {saved ? 'Saved to your series.' : ''}
      </p>
    </div>
  );
}

function suggestNames(ep: CompletedEpisode): string[] {
  const day = new Date(ep.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
  const words = ep.title.replace(/^the\s+/i, '').split(/\s+/);
  return [`The ${day} Files`, 'Small Plots, Big Twists', `The ${words[words.length - 1]} Years`, 'Main Character Energy'];
}

function SeriesNamer({ episode }: { episode: CompletedEpisode }) {
  const { setSeriesName, dismissNamePrompt } = useStore();
  const [name, setName] = useState('');
  const suggestions = useMemo(() => suggestNames(episode), [episode]);
  return (
    <section className="paper anim-fade-up rounded-[22px] p-5" aria-labelledby="name-series">
      <p className="t-kicker text-paper-mute">A new series premieres</p>
      <h2 id="name-series" className="t-display mt-2 text-[28px] text-paper-ink">
        Every main character needs a series. Name yours.
      </h2>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) setSeriesName(name);
        }}
      >
        <label htmlFor="series-name" className="sr-only">
          Series name
        </label>
        <input id="series-name" className="field field-paper" maxLength={48} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Saturday Files" autoComplete="off" />
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggestions">
          {suggestions.map((s) => (
            <button key={s} type="button" className="rounded-full border border-paper-ink/25 px-3 py-1.5 text-[13px] font-semibold text-paper-ink hover:bg-paper-ink/[0.06]" onClick={() => setName(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="btn btn-paper flex-1" disabled={!name.trim()}>
            Name my series
          </button>
          <button type="button" className="btn btn-ghost text-paper-ink/75 hover:bg-paper-ink/[0.06] hover:text-paper-ink" onClick={dismissNamePrompt}>
            Later
          </button>
        </div>
      </form>
    </section>
  );
}

export function Finale({ episodeId }: { episodeId: string }) {
  const { state } = useStore();
  const episode = state.p.completed.find((c) => c.id === episodeId);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!episode) navigate({ name: 'series' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  if (!episode) return null;

  const accent = uiAccent(PALETTES[episode.palette].accent);
  const totals = totalTraits(state.p.completed);
  const before = totalTraits(state.p.completed.filter((c) => c.id !== episode.id));
  const gained = episode.award.points;
  const levelUps = TRAITS.filter((t) => levelFor(t, totals[t]).level > levelFor(t, before[t]).level);
  const totalEndings = getCuratedAdventure(episode.adventureId)?.endings.length ?? (episode.source === 'ai' ? 2 : undefined);
  const foundEndings = new Set(state.p.completed.filter((c) => c.adventureId === episode.adventureId).map((c) => c.endingId)).size;
  const seriesName = state.p.series.name;

  return (
    <div className="px-5 pb-20" style={{ '--ep-accent': accent } as React.CSSProperties}>
      <section className="pt-6" aria-labelledby="finale-title">
        <p className="t-kicker">
          Episode {pad2(episode.episodeNumber)} · complete · {formatClock(episode.elapsedMs)} played
        </p>
        <h1 id="finale-title" ref={titleRef} tabIndex={-1} className="t-display anim-letterbox mt-2 text-[clamp(36px,11vw,48px)] outline-none">
          {typographic(episode.title)}
        </h1>
        <div className="mt-7 flex justify-center">
          <span className="anim-stamp stamp px-5 py-2.5 text-[26px] tracking-[0.2em]" style={{ color: accent, borderWidth: 3, animationDelay: '250ms' }}>
            Plot twist
          </span>
        </div>
        <p className="t-serif anim-rise mt-7 text-[20px] leading-relaxed text-ivory" style={{ animationDelay: '700ms' }}>
          {typographic(episode.twist)}
        </p>
      </section>

      <section className="anim-rise mt-8 border-t border-ivory/10 pt-6" style={{ animationDelay: '1000ms' }} aria-label="Ending">
        <p className="t-kicker text-[color:var(--ep-accent)]">
          Ending unlocked{totalEndings ? ` · ${foundEndings} of ${totalEndings} found` : ''}
        </p>
        <h2 className="t-display mt-2 text-[34px]">{typographic(episode.endingTitle)}</h2>
        <blockquote className="t-serif-italic mt-3 border-l-2 border-[color:var(--ep-accent)] pl-4 text-[19px] text-ivory-dim">“{typographic(episode.closingLine)}”</blockquote>
      </section>

      <section className="anim-rise mt-10" style={{ animationDelay: '1250ms' }} aria-label="Your poster">
        <div className="mx-auto max-w-[400px]">
          <PosterImage episode={episode} seriesName={seriesName} width={720} develop />
          <div className="mt-4">
            <PosterActions episode={episode} seriesName={seriesName} />
          </div>
        </div>
      </section>

      {!state.p.series.namePromptDone && (
        <div className="mt-10">
          <SeriesNamer episode={episode} />
        </div>
      )}

      <section className="mt-10" aria-labelledby="gained">
        <h2 id="gained" className="t-kicker">
          What you earned
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.entries(gained) as [Trait, number][])
            .filter(([, v]) => v > 0)
            .map(([t, v]) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] font-semibold" style={{ borderColor: TRAIT_COLOR[t], color: TRAIT_COLOR[t] }}>
                +{v} {TRAIT_LABEL[t]}
              </span>
            ))}
        </div>
        {levelUps.length > 0 && (
          <p className="anim-fade-up mt-3 flex items-center gap-2 text-[15px] font-semibold text-ivory">
            <IconSparkle size={18} /> Level up: {levelUps.map((t) => `${TRAIT_LABEL[t]} → ${levelFor(t, totals[t]).title}`).join(', ')}
          </p>
        )}
        <div className="mt-5 grid gap-4">
          {TRAITS.map((t) => (
            <TraitMeter key={t} level={levelFor(t, totals[t])} gained={gained[t] ?? 0} />
          ))}
        </div>
        <ul className="mt-4 space-y-1 text-[13px] text-ivory-mute">
          {episode.award.lines.map((l, i) => (
            <li key={i}>
              +{l.points} {TRAIT_LABEL[l.trait]} — {l.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="recap">
        <h2 id="recap" className="t-kicker">
          Your episode, recapped
        </h2>
        <div className="mt-3">
          <Recap episode={episode} />
        </div>
      </section>

      <section className="mt-8">
        <JournalField episode={episode} />
      </section>

      <div className="mt-8 grid gap-2">
        <button type="button" className="btn btn-primary btn-xl w-full" onClick={() => navigate({ name: 'scene' })}>
          Another plot twist <IconArrowRight size={18} />
        </button>
        <button type="button" className="btn btn-secondary w-full" onClick={() => navigate({ name: 'series' })}>
          <IconFilm size={18} /> See My Series
        </button>
      </div>
    </div>
  );
}
