import { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import {
  BUDGET_LABEL,
  COMPANY_LABEL,
  KIND_LABEL,
  MINUTES_LABEL,
  MOOD_LABEL,
  SETTING_LABEL,
  WEIRDNESS_LABEL,
} from '../../../shared/constants.ts';
import type { Adventure, Prefs } from '../../../shared/types.ts';
import { describeConflict, filterValid, suggestRelaxations } from '../../engine/matching.ts';
import type { Relaxation } from '../../engine/types.ts';
import { LIBRARY } from '../../content/library.ts';
import { envelopeAdventure, useStore } from '../../state/store.tsx';
import { Fact } from '../components/Bits.tsx';
import { Envelope, PHASE_COPY, WaxSeal } from '../components/Envelope.tsx';
import { Sheet } from '../components/Sheet.tsx';
import { dialogOpen, formatCost, pad2, pushSheetEntry, sheetOnTop, useCloseOnBack, useReducedMotion } from '../hooks.ts';
import { typographic } from '../../../shared/template.ts';
import { IconArrowLeft, IconClock, IconCoin, IconGroup, IconHome, IconNote, IconOutside, IconRefresh, IconSolo, IconSparkle } from '../icons.tsx';
import { entryState, goBackTo, leaveFor, navigate, useHistoryLanding } from '../router.ts';

const LETTERS = ['A', 'B', 'C', 'D'];
const COUNT_WORDS = ['No envelopes', 'One envelope', 'Two envelopes', 'Three envelopes'];
/** History-state marker for the open letter, so Back closes it instead of leaving the screen. */
const LETTER_STATE = 'plot-twist-letter';

function prefsSummary(p: Prefs): string {
  return [MINUTES_LABEL[p.minutes], BUDGET_LABEL[p.budget], SETTING_LABEL[p.setting], COMPANY_LABEL[p.company], MOOD_LABEL[p.mood], WEIRDNESS_LABEL[p.weirdness]].join(' · ');
}

function applyRelaxation(p: Prefs, r: Relaxation): Prefs {
  return { ...p, [r.constraint]: r.value } as Prefs;
}

function letterOnTop(): boolean {
  return sheetOnTop(LETTER_STATE);
}

/** Back to the scene: a step back when the scene is the entry below (no duplicate entry). */
function backToScene(): void {
  goBackTo({ name: 'scene' });
}

function Letter({ adventure, source, episodeNumber, onStart, onBack }: { adventure: Adventure; source: 'ai' | 'curated'; episodeNumber: number; onStart: () => void; onBack: () => void }) {
  const sealSeed = Array.from(adventure.id).reduce((a, c) => a + c.charCodeAt(0), 0);
  const where = adventure.settings.map((s) => SETTING_LABEL[s]).join(' or ');
  const who = adventure.company.length === 2 ? 'Solo or with others' : COMPANY_LABEL[adventure.company[0]];
  return (
    <div className="anim-rise">
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="stamp text-paper-ink/80">Episode {pad2(episodeNumber)}</span>
        <WaxSeal kind={adventure.kind} color={source === 'ai' ? '#c2410c' : '#8c1c30'} seed={sealSeed} broken size={44} />
      </div>
      <p className="t-kicker mt-4 text-paper-mute">
        {KIND_LABEL[adventure.kind]}
        {adventure.narrator ? ` · from ${adventure.narrator}` : ''}
      </p>
      {/* Focus starts here (top of the letter), so the intro is read before the commit button. */}
      <h3 className="t-display mt-2 text-[clamp(34px,10vw,44px)] text-paper-ink outline-none" tabIndex={-1} data-autofocus>
        {typographic(adventure.title)}
      </h3>
      {source === 'ai' && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#c2410c]/10 px-3 py-1 text-[0.7812rem] font-semibold text-[#9a3412]">
          <IconSparkle size={14} /> Written for you by the AI Director · checked against our rules
        </p>
      )}
      <p className="t-serif mt-4 text-[1.0938rem] leading-relaxed text-paper-ink">{typographic(adventure.intro)}</p>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-paper-ink/15 pt-5">
        <Fact icon={<IconClock size={18} />} label="Duration" value={`~${adventure.minutes} min`} />
        <Fact icon={<IconCoin size={18} />} label="Expected cost" value={formatCost(adventure.cost)} />
        <Fact icon={adventure.settings.includes('home') && adventure.settings.length === 1 ? <IconHome size={18} /> : <IconOutside size={18} />} label="Where" value={where} />
        <Fact icon={adventure.company.includes('group') ? <IconGroup size={18} /> : <IconSolo size={18} />} label="Who" value={who} />
      </div>
      <div className="mt-4 border-t border-paper-ink/15 pt-4">
        <Fact icon={<IconNote size={18} />} label="You’ll need" value={adventure.items.length ? adventure.items.join(' · ') : 'Nothing but you'} />
      </div>
      <p className="mt-4 text-[0.8125rem] text-paper-mute">Three stages · one choice that changes the story · {adventure.endings.length} possible endings</p>

      {/* The decision stays in the thumb zone, however long the letter is. In short viewports
          (landscape, 200–400% zoom) a sticky bar would cover half the letter, so there it ends it. */}
      <div className="letter-actions sticky -bottom-4 z-10 -mx-5 mt-6 grid gap-2 bg-gradient-to-t from-[color:var(--color-paper)] from-70% to-transparent px-5 pb-4 pt-6 short:static short:bg-none short:pt-0">
        <button type="button" className="btn btn-xl w-full bg-paper-ink text-paper shadow-[0_12px_30px_-12px_rgba(43,34,25,0.6)]" onClick={onStart}>
          Start episode
        </button>
        <button type="button" className="btn btn-ghost w-full text-paper-ink/75 hover:bg-paper-ink/[0.06] hover:text-paper-ink" onClick={onBack}>
          Look at another envelope
        </button>
      </div>
    </div>
  );
}

/** One polite live region for the AI envelope: what it is doing, and how it ended. */
function useAiAnnouncements(): string {
  const { state } = useStore();
  const draw = state.p.draw;
  const g = state.generation && draw && state.generation.drawId === draw.id ? state.generation : null;
  const [message, setMessage] = useState('');
  const lastPhase = useRef<string | null>(null);
  const lastStatus = useRef(new Map<string, string>());
  // The region starts empty for a moment: screen readers skip text written into a live
  // region in the instant it appears. Then it carries the latest message.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setLive(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const key = g ? `${g.slot}:${g.phase}` : null;
    if (!g || key === lastPhase.current) return;
    lastPhase.current = key;
    setMessage(`Envelope ${LETTERS[g.slot] ?? ''}: ${PHASE_COPY[g.phase]}`);
  }, [g]);

  useEffect(() => {
    if (!draw) return;
    for (const env of draw.envelopes) {
      const id = `${draw.id}:${env.slot}`;
      const before = lastStatus.current.get(id);
      lastStatus.current.set(id, env.status);
      if (before !== 'writing' || env.status === 'writing') continue;
      const letter = LETTERS[env.slot] ?? '';
      if (env.status === 'ready' && env.source === 'ai' && env.adventure) setMessage(`Envelope ${letter} is ready: ${env.adventure.title}, written for you.`);
      else if (env.status === 'ready' && env.adventure) setMessage(`Envelope ${letter}: ${env.note ?? 'an archive pick'} ${env.adventure.title}.`);
      else setMessage(`Envelope ${letter}: ${env.note ?? 'The AI Director could not finish this one.'}`);
    }
  }, [draw]);

  return live ? message : '';
}

export function Envelopes() {
  const { state, openEnvelope, startEpisode, reshuffle, retryAiEnvelope, drawEnvelopes, toast } = useStore();
  const draw = state.p.draw;
  const latestDraw = useRef(draw);
  latestDraw.current = draw;
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  // The episode that was tapped: the letter only ever shows that one.
  const openedId = useRef<string | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const announcement = useAiAnnouncements();
  const listRef = useRef<HTMLUListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const episodeNumber = state.p.completed.reduce((max, c) => Math.max(max, c.episodeNumber), 0) + 1;

  // Opened without a draw (deep link, reload, or Back / Forward over the episode these envelopes
  // started) → the scene, without leaving a dead entry: Back steps back once more onto the scene
  // below, Forward carries on to the episode beyond. Asked again each time history lands here (a
  // step that met a closed sheet's entry comes back to this one). Not once envelopes were shown:
  // then their going away shows "These envelopes are gone" (starting an episode clears the draw
  // and navigates to play itself).
  const shownDraw = useRef(Boolean(draw));
  if (draw) shownDraw.current = true;
  const landing = useHistoryLanding();
  useEffect(() => {
    if (!latestDraw.current && !shownDraw.current) leaveFor({ name: 'scene' }, { arrived: true });
  }, [landing]);

  // Any history move during the seal animation cancels the letter. (Back while the letter is
  // open closes it through its own entry: useCloseOnBack below.)
  const openTimer = useRef<number | null>(null);
  useEffect(() => {
    const onPop = () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      openTimer.current = null;
      setOpening(null);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    };
  }, []);

  // Another tab can re-deal or start these envelopes while a letter is open. The letter then
  // closes, and takes its history entry with it, so the next Back isn't swallowed.
  const openNow = openSlot === null ? null : draw?.envelopes.find((e) => e.slot === openSlot) ?? null;
  const letterGone = openSlot !== null && (!openNow || envelopeAdventure(openNow)?.id !== openedId.current);
  useEffect(() => {
    if (!letterGone) return;
    setOpenSlot(null);
    if (letterOnTop()) window.history.back();
  }, [letterGone]);
  // Back closes the letter: it registers the letter's entry and closes it once that entry is left
  // (not when a sheet stacked above it closes and history lands back on the letter's own entry).
  useCloseOnBack(openSlot !== null, LETTER_STATE, () => setOpenSlot(null));

  // Nothing to show while the redirect above happens (no flash of the "gone" notice).
  if (!draw && !shownDraw.current) return null;
  if (!draw) {
    return (
      <div className="px-5 pb-32 pt-8">
        <h1 className="t-display text-[clamp(34px,10vw,44px)]">These envelopes are gone.</h1>
        <p className="mt-2 text-ivory-dim">They were replaced or played in another tab.</p>
        <button type="button" className="btn btn-primary mt-6" onClick={backToScene}>
          Set the scene
        </button>
      </div>
    );
  }

  const ready = draw.envelopes.filter((e) => e.status === 'ready' && e.adventure);
  const curatedCount = draw.envelopes.filter((e) => e.source === 'curated' && e.adventure).length;
  const writing = draw.envelopes.some((e) => e.status === 'writing');
  const conflict = curatedCount === 0 && !writing && ready.length === 0 ? describeConflict(LIBRARY, draw.prefs) : null;
  const validCount = filterValid(LIBRARY, draw.prefs).length;
  const dealt = draw.envelopes.length;
  // An AI envelope that is being written (or came back) counts as dealt. Relaxations are only
  // offered when the archive really runs out: everything that fits is already on the table,
  // or fewer envelopes than usual could be dealt at all.
  const allShown = !conflict && validCount <= curatedCount;
  const short = !conflict && !writing && dealt < 3;
  const relaxations = conflict ? conflict.relaxations : allShown || short ? suggestRelaxations(LIBRARY, draw.prefs) : [];
  const openEnv = openSlot === null ? null : draw.envelopes.find((e) => e.slot === openSlot) ?? null;
  const openAdventure = openEnv ? envelopeAdventure(openEnv) : null;

  const relax = (r: Relaxation) => {
    drawEnvelopes(applyRelaxation(draw.prefs, r));
    toast(`${r.label}: new envelopes dealt.`);
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  const showLetter = (slot: number, id: string | null) => {
    setOpening(null);
    // The envelope changed underneath during the seal animation (another tab re-dealt): no letter.
    const env = latestDraw.current?.envelopes.find((e) => e.slot === slot);
    if (!env || (envelopeAdventure(env)?.id ?? null) !== id) return;
    // Another dialog opened during the seal animation (the AI status): the letter doesn't stack
    // on top of it. The envelope stays open; one more tap reads it.
    if (dialogOpen() || (entryState()?.sheet && !letterOnTop())) return;
    // One history entry per open letter, however many taps it took to open it.
    pushSheetEntry(LETTER_STATE);
    openedId.current = id;
    // Shown (and the page behind it made inert) right now, together with its entry: a tap on a
    // slow phone can't open another dialog in between and end up on top of the letter.
    flushSync(() => setOpenSlot(slot));
  };

  const open = (slot: number, alreadyOpened: boolean, id: string | null) => {
    openEnvelope(slot);
    if (alreadyOpened || reduced) {
      if (openTimer.current !== null) {
        window.clearTimeout(openTimer.current);
        openTimer.current = null;
      }
      showLetter(slot, id);
      return;
    }
    // The seal breaks and the flap swings open, then the letter rises.
    setOpening(slot);
    navigator.vibrate?.(12);
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      showLetter(slot, id);
    }, 420);
  };

  const closeLetter = () => {
    setOpenSlot(null);
    if (letterOnTop()) window.history.back();
  };

  return (
    <div className="px-5 pb-32">
      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="icon-btn -ml-2" onClick={backToScene} aria-label="Back to set the scene">
          <IconArrowLeft />
        </button>
        <p className="t-kicker">Episode {pad2(episodeNumber)} · choose your envelope</p>
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="t-display mt-3 text-[clamp(34px,10vw,44px)] outline-none">
        {conflict ? 'No envelope fits that plot.' : `${COUNT_WORDS[Math.min(dealt, 3)]}. One plot twist.`}
      </h1>
      <p className="mt-2 text-[0.875rem] text-ivory-dim">
        {prefsSummary(draw.prefs)}{' '}
        <button
          type="button"
          className="-my-3 inline-flex min-h-11 items-center px-1 font-semibold text-ivory underline decoration-[color:var(--accent)] decoration-2 underline-offset-4"
          onClick={backToScene}
          aria-label="Edit the scene"
        >
          Edit
        </button>
      </p>

      {conflict && (
        <div className="card anim-fade-up mt-6 p-5" role="alert">
          <p className="t-serif text-[1.0625rem]">{conflict.reason}</p>
          {relaxations.length > 0 ? (
            <p className="mt-2 text-[0.875rem] text-ivory-dim">Change one thing and we will find you a plot:</p>
          ) : (
            <>
              <p className="mt-2 text-[0.875rem] text-ivory-dim">No single change fixes this one — loosen a couple of things and try again.</p>
              <button type="button" className="btn btn-primary mt-4" onClick={backToScene}>
                Edit the scene
              </button>
            </>
          )}
        </div>
      )}

      {relaxations.length > 0 && (
        <div className="mt-4">
          {!conflict && (
            <p className="text-[0.8438rem] text-ivory-dim">
              {`${validCount === 1 ? 'This is the only archive episode' : `These are the only ${validCount} archive episodes`} that fit everything. Loosen one thing for more:`}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {relaxations.slice(0, 4).map((r) => (
              <button key={`${r.constraint}-${String(r.value)}`} type="button" className="chip" onClick={() => relax(r)}>
                {r.label}{' '}
                <span className="t-num text-[0.75rem] text-ivory-mute">
                  +{r.gain} <span className="sr-only">more episode{r.gain === 1 ? '' : 's'}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Portaled out of #root: it keeps talking while the letter (a modal) makes the screen inert. */}
      {createPortal(
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>,
        document.body,
      )}

      {draw.envelopes.length > 0 && (
        <ul ref={listRef} className="mt-7 space-y-5" aria-label="Envelopes">
          {draw.envelopes.map((env, i) => (
            <li key={`${draw.id}-${env.slot}`}>
              <Envelope
                envelope={env}
                adventure={envelopeAdventure(env)}
                episodeNumber={episodeNumber}
                generation={state.generation && state.generation.drawId === draw.id && state.generation.slot === env.slot ? state.generation : null}
                onOpen={() => open(env.slot, env.opened, envelopeAdventure(env)?.id ?? null)}
                onRetry={() => retryAiEnvelope(env.slot)}
                canRetry={state.director.canGenerate}
                index={i}
                opening={opening === env.slot}
              />
            </li>
          ))}
        </ul>
      )}

      {!conflict && (
        <div className="mt-8 flex flex-col items-center gap-1">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              reshuffle();
              toast('New envelopes dealt.');
              window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
            }}
          >
            <IconRefresh size={18} /> Draw again
          </button>
          <p className="text-center text-[0.7812rem] text-ivory-mute">Not feeling these? Open as many as you like before you commit.</p>
        </div>
      )}

      <Sheet open={Boolean(openAdventure)} onClose={closeLetter} title={openAdventure ? `Envelope: ${openAdventure.title}` : 'Envelope'} variant="paper" labelHidden closeLabel="Close envelope">
        {openAdventure && openEnv && (
          <Letter
            adventure={openAdventure}
            source={openEnv.source}
            episodeNumber={episodeNumber}
            onBack={closeLetter}
            onStart={() => {
              const run = startEpisode(openEnv.slot);
              setOpenSlot(null);
              // The episode takes the letter's history entry (navigate replaces a sheet's entry),
              // so Back from the episode skips the closed letter.
              if (run) navigate({ name: 'play' });
              else if (letterOnTop()) window.history.back();
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
