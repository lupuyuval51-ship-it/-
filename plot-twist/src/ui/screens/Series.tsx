import { useRef, useState } from 'react';
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
import { goBackTo, navigate } from '../router.ts';
import { typographic } from '../../../shared/template.ts';
import { uiAccent } from '../color.ts';
import { JournalField, Recap, twistBody, useEpisodeGone } from './Finale.tsx';
import { getCuratedAdventure } from '../../content/library.ts';

function SeriesTitle() {
  const { state, setSeriesName, toast } = useStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(state.p.series.name ?? '');
  const pencilRef = useRef<HTMLButtonElement>(null);
  const name = state.p.series.name;
  const close = () => {
    setEditing(false);
    window.requestAnimationFrame(() => pencilRef.current?.focus());
  };
  if (editing) {
    return (
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSeriesName(value);
          toast(value.trim() ? `Series renamed “${value.trim()}”.` : 'Series name cleared.', 'success');
          close();
        }}
      >
        <label htmlFor="rename-series" className="sr-only">
          Series name
        </label>
        <input
          id="rename-series"
          className="field flex-1"
          value={value}
          maxLength={48}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              close();
            }
          }}
          autoFocus
          placeholder="Name your series"
        />
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
        ref={pencilRef}
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
  const { state, setMotion, resetAll, toast } = useStore();
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
        <legend className="mb-2 text-[0.875rem] font-semibold">Motion</legend>
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
      <p className="mt-6 text-[0.7812rem] text-ivory-mute">Everything is stored only in this browser. No account, no tracking.</p>
      <button type="button" className="btn btn-ghost mt-8 -ml-3 text-err hover:text-err" onClick={() => setConfirm(true)}>
        Reset all episodes and progress
      </button>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Reset everything?" historyKey="plot-twist-reset">
        <p className="t-display mt-3 text-[1.625rem]">Cancel the whole series?</p>
        <p className="mt-2 text-ivory-dim">This deletes every episode, poster, journal entry and trait from this browser. It cannot be undone.</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="btn btn-secondary text-err"
            onClick={() => {
              resetAll();
              setConfirm(false);
              toast('Your series was reset.');
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

function PosterTile({ ep, seriesName, endingsFound, endingsTotal }: { ep: CompletedEpisode; seriesName: string | null; endingsFound: number; endingsTotal?: number }) {
  return (
    <li>
      <a href={`#/series/${encodeURIComponent(ep.id)}`} className="group block rounded-[8px]" aria-label={`Episode ${ep.episodeNumber}: ${ep.title} — ${ep.endingTitle}`}>
        <div className="transition-transform duration-300 group-hover:-translate-y-1">
          <PosterImage episode={ep} seriesName={seriesName} width={360} lazy />
        </div>
        <p className="t-kicker mt-2 text-[0.625rem]">
          Ep. {pad2(ep.episodeNumber)}
          {endingsTotal ? ` · ${endingsFound}/${endingsTotal} endings` : ''}
        </p>
        <p className="mt-0.5 text-[0.875rem] font-semibold leading-snug text-ivory">{ep.title}</p>
        <p className="t-serif-italic text-[0.8125rem] leading-snug text-ivory-dim">{ep.endingTitle}</p>
      </a>
    </li>
  );
}

function minutesText(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function Series() {
  const { state } = useStore();
  const completed = state.p.completed;
  const stats = seriesStats(completed);
  const totals = totalTraits(completed);
  const ordered = [...completed].sort((a, b) => b.episodeNumber - a.episodeNumber);
  const next = completed.reduce((max, c) => Math.max(max, c.episodeNumber), 0) + 1;
  const endingsFor = (adventureId: string) => new Set(completed.filter((c) => c.adventureId === adventureId).map((c) => c.endingId)).size;

  return (
    <div className="px-5 pb-20">
      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="icon-btn -ml-2" onClick={() => goBackTo({ name: 'scene' })} aria-label="Back home">
          <IconArrowLeft />
        </button>
        <p className="t-kicker">My Series</p>
      </div>
      <SeriesTitle />
      {completed.length > 0 && (
        <p className="mt-1 text-[0.875rem] text-ivory-dim">
          {stats.episodes} episode{stats.episodes === 1 ? '' : 's'} · {stats.endings} ending{stats.endings === 1 ? '' : 's'} found · {minutesText(stats.minutes)} of adventure
          {stats.alternates ? ` · ${stats.alternates} alternate route${stats.alternates === 1 ? '' : 's'}` : ''}
        </p>
      )}

      <section className="mt-6" aria-labelledby="gallery">
        <h2 id="gallery" className="sr-only">
          Episode posters
        </h2>
        {ordered.length === 0 ? (
          <div className="card mt-4 p-6 text-center">
            <p className="t-display text-[1.625rem]">No episodes yet.</p>
            <p className="t-serif-italic mt-2 text-ivory-dim">Your series starts with one plot twist.</p>
            <button type="button" className="btn btn-primary mt-5" onClick={() => navigate({ name: 'scene' })}>
              <IconEnvelope size={18} /> Start the pilot
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 min-[420px]:grid-cols-3">
            <li>
              {/* The next episode is always one tap away. */}
              <button
                type="button"
                onClick={() => navigate({ name: 'scene' })}
                className="grid aspect-[2/3] w-full place-items-center rounded-[6px] border-2 border-dashed border-ivory/20 p-3 text-center transition-colors hover:border-[color:var(--accent)]"
              >
                <span>
                  <IconEnvelope size={26} className="mx-auto text-[color:var(--accent)]" />
                  <span className="t-kicker mt-3 block text-[0.625rem]">Ep. {pad2(next)}</span>
                  <span className="t-display mt-1 block text-[1.25rem] leading-tight">Unwritten</span>
                  <span className="mt-1 block text-[0.7812rem] text-ivory-dim">Draw envelopes</span>
                </span>
              </button>
            </li>
            {ordered.map((ep) => (
              <PosterTile key={ep.id} ep={ep} seriesName={state.p.series.name} endingsFound={endingsFor(ep.adventureId)} endingsTotal={getCuratedAdventure(ep.adventureId)?.endings.length ?? (ep.source === 'ai' ? 2 : undefined)} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="traits">
        <h2 id="traits" className="t-kicker">
          Character sheet
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 min-[420px]:grid-cols-2">
          {TRAITS.map((t) => (
            <TraitMeter key={t} level={levelFor(t, totals[t])} />
          ))}
        </div>
      </section>

      <Settings />
    </div>
  );
}

export function EpisodeDetail({ episodeId }: { episodeId: string }) {
  const { state, toast } = useStore();
  const episode = state.p.completed.find((c) => c.id === episodeId);
  useEpisodeGone(Boolean(episode), toast);
  if (!episode) return null;
  const accent = uiAccent(PALETTES[episode.palette].accent);
  const date = new Date(episode.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="px-5 pb-20" style={{ '--ep-accent': accent } as React.CSSProperties}>
      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="icon-btn -ml-2" onClick={() => goBackTo({ name: 'series' })} aria-label="Back to My Series">
          <IconArrowLeft />
        </button>
        <p className="t-kicker">
          Episode {pad2(episode.episodeNumber)} · {date}
        </p>
      </div>
      <h1 className="t-display mt-3 text-[clamp(34px,10vw,44px)]">{typographic(episode.title)}</h1>
      <p className="mt-1 text-[0.875rem] text-ivory-dim">
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
        <h2 id="ending" className="t-display mt-2 text-[1.875rem]">
          {episode.endingTitle}
        </h2>
        <p className="t-serif mt-3 text-[1.0625rem] leading-relaxed">{typographic(twistBody(episode.twist))}</p>
        <blockquote className="t-serif-italic mt-4 border-l-2 border-[color:var(--ep-accent)] pl-4 text-[1.125rem] text-ivory-dim">“{typographic(episode.closingLine)}”</blockquote>
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
