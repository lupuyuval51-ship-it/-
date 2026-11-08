import { useEffect, useState } from 'react';
import { PALETTES, TRAITS } from '../../../shared/constants.ts';
import { levelFor, seriesStats, totalTraits } from '../../engine/progression.ts';
import type { CompletedEpisode } from '../../engine/types.ts';
import type { MotionPreference } from '../../state/types.ts';
import { useStore } from '../../state/store.tsx';
import { TraitMeter } from '../components/Bits.tsx';
import { PosterActions, PosterImage } from '../components/Poster.tsx';
import { Sheet } from '../components/Sheet.tsx';
import { formatClock, pad2 } from '../hooks.ts';
import { IconArrowLeft, IconEnvelope, IconPencil } from '../icons.tsx';
import { navigate } from '../router.ts';
import { uiAccent } from '../color.ts';
import { JournalField, Recap } from './Finale.tsx';

function SeriesTitle() {
  const { state, setSeriesName } = useStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(state.p.series.name ?? '');
  const name = state.p.series.name;
  if (editing) {
    return (
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSeriesName(value);
          setEditing(false);
        }}
      >
        <label htmlFor="rename-series" className="sr-only">
          Series name
        </label>
        <input id="rename-series" className="field flex-1" value={value} maxLength={48} onChange={(e) => setValue(e.target.value)} autoFocus placeholder="Name your series" />
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </form>
    );
  }
  return (
    <div className="mt-2 flex items-start gap-2">
      <h1 className="t-display text-[clamp(36px,11vw,48px)]">{name ?? 'My Series'}</h1>
      <button
        type="button"
        className="icon-btn mt-1 shrink-0"
        onClick={() => {
          setValue(name ?? '');
          setEditing(true);
        }}
        aria-label={name ? 'Rename series' : 'Name your series'}
      >
        <IconPencil size={18} />
      </button>
    </div>
  );
}

function Settings() {
  const { state, setMotion, resetAll } = useStore();
  const [confirm, setConfirm] = useState(false);
  const options: { value: MotionPreference; label: string }[] = [
    { value: 'system', label: 'Match system' },
    { value: 'reduce', label: 'Reduced' },
    { value: 'full', label: 'Full' },
  ];
  return (
    <section className="mt-12 border-t border-ivory/10 pt-6" aria-labelledby="settings">
      <h2 id="settings" className="t-kicker">
        Settings
      </h2>
      <fieldset className="mt-4">
        <legend className="mb-2 text-[14px] font-semibold">Motion</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <span key={o.value} className="relative">
              <input id={`motion-${o.value}`} className="chip-input" type="radio" name="motion" checked={state.p.settings.motion === o.value} onChange={() => setMotion(o.value)} />
              <label htmlFor={`motion-${o.value}`} className="chip">
                {o.label}
              </label>
            </span>
          ))}
        </div>
      </fieldset>
      <button type="button" className="btn btn-ghost mt-6 -ml-3 text-err hover:text-err" onClick={() => setConfirm(true)}>
        Reset all episodes and progress
      </button>
      <p className="text-[12.5px] text-ivory-mute">Everything is stored only in this browser. No account, no tracking.</p>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Reset everything?">
        <p className="t-display mt-3 text-[26px]">Cancel the whole series?</p>
        <p className="mt-2 text-ivory-dim">This deletes every episode, poster, journal entry and trait from this browser. It cannot be undone.</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="btn btn-secondary text-err"
            onClick={() => {
              resetAll();
              setConfirm(false);
            }}
          >
            Yes, reset everything
          </button>
          <button type="button" className="btn btn-ghost" data-autofocus onClick={() => setConfirm(false)}>
            Keep my series
          </button>
        </div>
      </Sheet>
    </section>
  );
}

function PosterTile({ ep, seriesName }: { ep: CompletedEpisode; seriesName: string | null }) {
  return (
    <li>
      <a href={`#/series/${encodeURIComponent(ep.id)}`} className="group block rounded-[8px]" aria-label={`Episode ${ep.episodeNumber}: ${ep.title} — ${ep.endingTitle}`}>
        <div className="transition-transform duration-300 group-hover:-translate-y-1">
          <PosterImage episode={ep} seriesName={seriesName} width={360} />
        </div>
        <p className="t-kicker mt-2 text-[10px]">Ep. {pad2(ep.episodeNumber)}</p>
        <p className="mt-0.5 text-[14px] font-semibold leading-snug text-ivory">{ep.title}</p>
      </a>
    </li>
  );
}

export function Series() {
  const { state } = useStore();
  const completed = state.p.completed;
  const stats = seriesStats(completed);
  const totals = totalTraits(completed);
  const ordered = [...completed].sort((a, b) => b.episodeNumber - a.episodeNumber);

  return (
    <div className="px-5 pb-20">
      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="icon-btn -ml-2" onClick={() => navigate({ name: 'scene' })} aria-label="Back home">
          <IconArrowLeft />
        </button>
        <p className="t-kicker">My Series · Season 1</p>
      </div>
      <SeriesTitle />

      <dl className="mt-5 grid grid-cols-4 gap-2 text-center">
        {[
          ['Episodes', stats.episodes],
          ['Minutes', stats.minutes],
          ['Endings', stats.endings],
          ['Alt routes', stats.alternates],
        ].map(([label, value]) => (
          <div key={label} className="card px-1 py-3">
            <dd className="t-display text-[26px]">{value}</dd>
            <dt className="t-kicker mt-1 text-[9.5px]">{label}</dt>
          </div>
        ))}
      </dl>

      <section className="mt-8" aria-labelledby="traits">
        <h2 id="traits" className="t-kicker">
          Character traits
        </h2>
        <div className="mt-4 grid gap-5">
          {TRAITS.map((t) => (
            <TraitMeter key={t} level={levelFor(t, totals[t])} />
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="gallery">
        <h2 id="gallery" className="t-kicker">
          Episode posters
        </h2>
        {ordered.length === 0 ? (
          <div className="card mt-4 p-6 text-center">
            <p className="t-display text-[26px]">No episodes yet.</p>
            <p className="t-serif-italic mt-2 text-ivory-dim">Your series starts with one plot twist.</p>
            <button type="button" className="btn btn-primary mt-5" onClick={() => navigate({ name: 'scene' })}>
              <IconEnvelope size={18} /> Start the pilot
            </button>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
            {ordered.map((ep) => (
              <PosterTile key={ep.id} ep={ep} seriesName={state.p.series.name} />
            ))}
          </ul>
        )}
      </section>

      <Settings />
    </div>
  );
}

export function EpisodeDetail({ episodeId }: { episodeId: string }) {
  const { state } = useStore();
  const episode = state.p.completed.find((c) => c.id === episodeId);
  useEffect(() => {
    if (!episode) navigate({ name: 'series' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!episode) return null;
  const accent = uiAccent(PALETTES[episode.palette].accent);
  const date = new Date(episode.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="px-5 pb-20" style={{ '--ep-accent': accent } as React.CSSProperties}>
      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="icon-btn -ml-2" onClick={() => navigate({ name: 'series' })} aria-label="Back to My Series">
          <IconArrowLeft />
        </button>
        <p className="t-kicker">
          Episode {pad2(episode.episodeNumber)} · {date}
        </p>
      </div>
      <h1 className="t-display mt-3 text-[clamp(34px,10vw,44px)]">{episode.title}</h1>
      <p className="mt-1 text-[14px] text-ivory-dim">
        {episode.source === 'ai' ? 'Written for you by the AI Director' : episode.narrator ? `From ${episode.narrator}` : 'From the archive'} · {formatClock(episode.elapsedMs)} played
      </p>

      <div className="mx-auto mt-6 max-w-[400px]">
        <PosterImage episode={episode} seriesName={state.p.series.name} width={720} />
        <div className="mt-4">
          <PosterActions episode={episode} seriesName={state.p.series.name} />
        </div>
      </div>

      <section className="mt-10" aria-labelledby="ending">
        <p className="t-kicker text-[color:var(--ep-accent)]">Ending</p>
        <h2 id="ending" className="t-display mt-2 text-[30px]">
          {episode.endingTitle}
        </h2>
        <p className="t-serif mt-3 text-[17px] leading-relaxed">{episode.twist}</p>
        <blockquote className="t-serif-italic mt-4 border-l-2 border-[color:var(--ep-accent)] pl-4 text-[18px] text-ivory-dim">“{episode.closingLine}”</blockquote>
      </section>

      <section className="mt-10" aria-labelledby="choices">
        <h2 id="choices" className="t-kicker">
          Your choices
        </h2>
        <div className="mt-3">
          <Recap episode={episode} />
        </div>
      </section>

      <section className="mt-8">
        <JournalField episode={episode} />
      </section>
    </div>
  );
}
