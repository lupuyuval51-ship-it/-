import { useEffect, useId, useRef, useState } from 'react';
import { PALETTES } from '../../../shared/constants.ts';
import { getNode } from '../../../shared/graph.ts';
import { renderTemplate, typographic } from '../../../shared/template.ts';
import type { Adventure, StageNode } from '../../../shared/types.ts';
import { currentNode, elapsedMs, isFinished, isPaused } from '../../engine/run.ts';
import type { Run } from '../../engine/types.ts';
import { useStore } from '../../state/store.tsx';
import { ProgressRail } from '../components/Bits.tsx';
import { formatClock, pad2, useNow } from '../hooks.ts';
import { IconBolt, IconCheck, IconClose, IconGroup, IconPause, IconPlay, IconSwap } from '../icons.tsx';
import { navigate } from '../router.ts';
import { uiAccent } from '../color.ts';

/**
 * A freshly shown stage or choice ignores taps for a moment, so the second tap
 * of a double tap can never make a blind story choice or skip the next stage.
 */
function useArmed(key: string, ms = 450): boolean {
  const [armedKey, setArmedKey] = useState<string | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => setArmedKey(key), ms);
    return () => window.clearTimeout(id);
  }, [key, ms]);
  return armedKey === key;
}

function TimerButton({ run, onPause, onResume }: { run: Run; onPause: () => void; onResume: () => void }) {
  const now = useNow(1000);
  const paused = isPaused(run);
  const elapsed = elapsedMs(run, now);
  const plannedMs = run.adventure.minutes * 60_000;
  const over = elapsed > plannedMs;
  const minutes = Math.floor(elapsed / 60_000);
  const overMinutes = Math.max(1, Math.floor((elapsed - plannedMs) / 60_000));
  const descId = useId();
  // The name stays stable (screen readers re-read a focused control whenever its name changes);
  // the time lives in a description that changes at most once a minute.
  const description = `${minutes} minute${minutes === 1 ? '' : 's'} played of about ${run.adventure.minutes}${over ? `, ${overMinutes} over the plan` : ''}.`;
  return (
    <button
      type="button"
      onClick={paused ? onResume : onPause}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-3.5 transition-colors ${paused ? 'border-[color:var(--ep-accent)] bg-[color:var(--ep-accent)]/10' : 'border-ivory/15 bg-ivory/[0.04] hover:border-ivory/30'}`}
      aria-label={paused ? 'Resume timer' : 'Pause timer'}
      aria-describedby={descId}
    >
      {paused ? <IconPlay size={16} /> : <IconPause size={16} />}
      <span className={`t-num text-[0.9375rem] font-semibold ${over ? 'text-[color:var(--ep-accent)]' : paused ? 'text-ivory-dim' : 'text-ivory'}`} aria-hidden="true">
        {formatClock(elapsed)}
      </span>
      <span className="t-num text-[0.75rem] text-ivory-mute" aria-hidden="true">
        / {run.adventure.minutes}
        <span className="hidden min-[380px]:inline">:00</span>
        <span className="min-[380px]:hidden">m</span>
      </span>
      {over && (
        <span className="t-kicker rounded-full border border-[color:var(--ep-accent)] px-1.5 py-px text-[0.5938rem] text-[color:var(--ep-accent)]" aria-hidden="true">
          Over
        </span>
      )}
      <span id={descId} className="sr-only">
        {description}
      </span>
    </button>
  );
}

function History({ run, adventure }: { run: Run; adventure: Adventure }) {
  if (run.steps.length === 0) return null;
  return (
    <ol className="mt-6 space-y-2" aria-label="Completed stages">
      {run.steps.map((step) => {
        const node = getNode(adventure, step.nodeId);
        if (!node) return null;
        const option = step.optionId ? node.choice?.options.find((o) => o.id === step.optionId) : undefined;
        const note = node.capture ? run.notes[node.capture.key] : undefined;
        return (
          <li key={step.nodeId} className="flex gap-3 rounded-2xl border border-ivory/8 bg-ivory/[0.025] px-3.5 py-2.5 text-[0.8438rem]">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--ep-accent)] text-ink-950" aria-hidden="true">
              <IconCheck size={12} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ivory">
                {adventure.stageLabel ?? 'Stage'} {node.stage} · {node.title}
                {step.usedAlternative && <span className="ml-1.5 font-normal text-ivory-mute">(alternate route)</span>}
              </p>
              {option && <p className="text-ivory-dim">You chose: {option.label}</p>}
              {note && <p className="t-serif-italic truncate text-ivory-dim">“{note}”</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Amplify({ text, weirdness }: { text: string; weirdness: 1 | 2 | 3 }) {
  if (weirdness === 1) return null;
  if (weirdness === 3) {
    return (
      <div className="mt-4 rounded-2xl border-2 border-dashed border-[color:var(--accent)] p-4" style={{ transform: 'rotate(-0.6deg)' }}>
        <p className="t-kicker flex items-center gap-1.5 text-[color:var(--accent)]">
          <IconBolt size={14} /> Main character move
        </p>
        <p className="mt-1.5 text-[0.9688rem] text-ivory">{text}</p>
      </div>
    );
  }
  return (
    <details className="group mt-4 rounded-2xl border border-ivory/12">
      <summary className="t-kicker flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-2xl px-4 py-3 text-ivory-dim [&::-webkit-details-marker]:hidden">
        <IconBolt size={14} /> Feeling bold? <span className="ml-auto text-[0.625rem] group-open:hidden">Show</span>
      </summary>
      <p className="px-4 pb-3.5 text-[0.9375rem] text-ivory">{text}</p>
    </details>
  );
}

/** Document position from layout offsets — unaffected by the entry animation's transform. */
function documentTop(el: HTMLElement): number {
  let y = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) y += node.offsetTop;
  return y;
}

/**
 * Focuses a stage/choice heading. After the first one it also scrolls the new
 * stage (kicker included) to just below the sticky Save & exit / timer bar.
 */
function useArrival(ref: React.RefObject<HTMLElement | null>, key: string, scroll: boolean, focus: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (scroll) {
      const block = (el.closest('article, section') as HTMLElement | null) ?? el;
      const bar = document.querySelector<HTMLElement>('[data-sticky-bar]');
      window.scrollTo({ top: Math.max(0, documentTop(block) - (bar?.offsetHeight ?? 60) - 12) });
    }
    if (focus) el.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

function StageCard({ run, node, scrollOnArrive }: { run: Run; node: StageNode; scrollOnArrive: boolean }) {
  const { setNote, toggleAlternative, completeStage, registerDraft } = useStore();
  const adventure = run.adventure;
  const r = (t: string) => typographic(renderTemplate(t, run.notes));
  const alt = run.usingAlternative;
  const capture = node.capture;
  const [draft, setDraft] = useState(capture ? run.notes[capture.key] ?? '' : '');
  const finish = useFinish();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const armed = useArmed(node.id);
  const pausedAtArrival = useRef(isPaused(run));
  useArrival(headingRef, node.id, scrollOnArrive, !pausedAtArrival.current);

  // Notes are saved while typing (debounced), when the page hides, and when the card goes away,
  // so a refresh, Back or tab close never loses one. The input shows the local draft, so the
  // store trimming the saved value never eats the space being typed.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const committed = useRef(draft);
  const commitRef = useRef(() => {});
  commitRef.current = () => {
    if (!capture || draftRef.current === committed.current) return;
    committed.current = draftRef.current;
    setNote(capture.key, draftRef.current);
  };
  useEffect(() => {
    if (!capture) return;
    const id = window.setTimeout(() => commitRef.current(), 400);
    return () => window.clearTimeout(id);
  }, [draft, capture]);
  useEffect(() => {
    const unregister = registerDraft(() => commitRef.current());
    return () => {
      unregister();
      commitRef.current();
    };
  }, [registerDraft]);

  return (
    <article className="anim-rise mt-7" aria-labelledby={`stage-${node.id}`}>
      <p className="t-kicker">
        {adventure.stageLabel ?? 'Stage'} {node.stage} of 3 · ~{node.minutes} min
      </p>
      <h2 id={`stage-${node.id}`} ref={headingRef} tabIndex={-1} data-stage-heading className="t-display mt-2 text-[clamp(32px,9.5vw,40px)] outline-none">
        {typographic(node.title)}
      </h2>
      <p className="t-serif-italic mt-3 text-[1.125rem] text-ivory-dim">{r(node.narrative)}</p>

      <div className="mt-5 rounded-[20px] border border-ivory/10 bg-ivory/[0.045] p-4 pl-5" style={{ boxShadow: 'inset 4px 0 0 var(--ep-accent)' }}>
        <p className="t-kicker text-[color:var(--ep-accent)]">{alt ? 'Alternate route' : 'Your move'}</p>
        <p className="mt-1.5 text-[1.125rem] font-semibold leading-snug text-ivory" aria-live="polite">
          {r(alt ? node.alternative : node.action)}
        </p>
      </div>

      {node.amplify && !alt && <Amplify text={r(node.amplify)} weirdness={run.prefs.weirdness} />}

      {node.crewTip && run.prefs.company === 'group' && (
        <p className="mt-4 flex gap-2.5 text-[0.9062rem] text-ivory-dim">
          <IconGroup size={18} className="mt-0.5 shrink-0" /> <span>{r(node.crewTip)}</span>
        </p>
      )}

      {capture && (
        <div className="mt-5">
          <label htmlFor={`note-${node.id}`} className="t-kicker mb-2 block">
            Field note · {capture.label} <span className="normal-case tracking-normal text-ivory-mute">(optional)</span>
          </label>
          <input
            id={`note-${node.id}`}
            className="field"
            value={draft}
            maxLength={80}
            placeholder={capture.placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commitRef.current()}
            autoComplete="off"
            enterKeyHint="done"
          />
          <p className="mt-1.5 text-[0.7812rem] text-ivory-mute">It may show up later in the story — and on your poster.</p>
        </div>
      )}

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          className={`btn btn-primary btn-xl w-full ${armed ? '' : 'pointer-events-none'}`}
          style={{ background: 'var(--ep-accent)', color: 'var(--ep-ink)' }}
          data-armed={armed}
          onClick={() => {
            if (!armed) return;
            commitRef.current();
            const done = completeStage();
            if (done) finish(done.id);
          }}
        >
          <IconCheck size={20} /> Done — I did it
        </button>
        <button type="button" className="btn btn-ghost w-full" onClick={toggleAlternative}>
          <IconSwap size={18} /> {alt ? 'Back to the main challenge' : 'Swap for an alternative challenge'}
        </button>
      </div>
    </article>
  );
}

function useFinish() {
  return (episodeId: string) => navigate({ name: 'finale', episodeId }, { replace: true });
}

function ChoicePanel({ run, node, scrollOnArrive }: { run: Run; node: StageNode; scrollOnArrive: boolean }) {
  const { choose } = useStore();
  const finish = useFinish();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const armed = useArmed(`choice-${node.id}`);
  const pausedAtArrival = useRef(isPaused(run));
  useArrival(headingRef, node.id, scrollOnArrive, !pausedAtArrival.current);
  if (!node.choice) return null;
  const prompt = typographic(renderTemplate(node.choice.prompt, run.notes));
  return (
    <section className="anim-rise mt-8" aria-labelledby="choice-title">
      <p className="t-kicker">The fork in the road</p>
      <h2 id="choice-title" ref={headingRef} tabIndex={-1} data-stage-heading className="t-display mt-2 text-[clamp(30px,9vw,38px)] outline-none">
        {prompt}
      </h2>
      <p className="mt-2 text-[0.875rem] text-ivory-dim">Your choice changes what happens next — and how this episode ends.</p>
      <div className="mt-6 grid gap-3">
        {node.choice.options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            data-armed={armed}
            onClick={() => {
              if (!armed) return;
              const done = choose(opt.id);
              if (done) finish(done.id);
            }}
            className={`anim-fade-up group rounded-[22px] border border-ivory/14 bg-ivory/[0.04] p-5 text-left transition-[border-color,background-color,transform] duration-200 hover:border-[color:var(--ep-accent)] hover:bg-ivory/[0.07] active:scale-[0.985] ${armed ? '' : 'pointer-events-none'}`}
            style={{ animationDelay: `${120 + i * 90}ms` }}
          >
            <span className="t-kicker text-[color:var(--ep-accent)]">Option {String.fromCharCode(65 + i)}</span>
            <span className="t-display mt-1.5 block text-[1.5625rem]">{typographic(opt.label)}</span>
            <span className="mt-1 block text-[0.9375rem] text-ivory-dim">{typographic(opt.description)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PausedOverlay({ run, onResume, onExit }: { run: Run; onResume: () => void; onExit: () => void }) {
  const resumeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    resumeRef.current?.focus({ preventScroll: true });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onResume();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/85 px-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paused-title"
      aria-describedby="paused-desc"
    >
      <div className="anim-fade-up w-full max-w-[360px] text-center">
        <p className="t-kicker">
          Timer stopped · <span className="t-num">{formatClock(elapsedMs(run, Date.now()))}</span> of ~{run.adventure.minutes} min
        </p>
        <p id="paused-title" className="t-display mt-2 text-[2.75rem]">
          Paused.
        </p>
        <p id="paused-desc" className="t-serif-italic mt-1 text-ivory-dim">
          The plot can wait. Paused time never counts.
        </p>
        <button ref={resumeRef} type="button" className="btn btn-primary btn-xl mt-8 w-full" onClick={onResume}>
          <IconPlay size={18} /> Resume episode
        </button>
        <button type="button" className="btn btn-ghost mt-2 w-full" onClick={onExit}>
          <IconClose size={18} /> Save &amp; exit
        </button>
      </div>
    </div>
  );
}

export function Play() {
  const { state, pause, resume, saveAndExit } = useStore();
  const run = state.p.run;
  const lastRunId = useRef<string | null>(run?.id ?? null);
  if (run) lastRunId.current = run.id;
  const firstNodeKey = useRef<string | null>(run ? `${run.nodeId}:${run.phase}` : null);

  // No run: a deep link, or another tab finished or discarded it. (Finishing here
  // navigates to the finale itself, to the same place.)
  useEffect(() => {
    if (run) return;
    const id = lastRunId.current;
    const done = id ? state.p.completed.find((c) => c.id === id) : undefined;
    navigate(done ? { name: 'finale', episodeId: done.id } : { name: 'scene' }, { replace: true });
  }, [run, state.p.completed]);

  if (!run || isFinished(run)) return null;

  const adventure = run.adventure;
  const node = currentNode(run);
  if (!node) return null;
  const palette = PALETTES[adventure.palette];
  const paused = isPaused(run);
  // Each episode tints the play screen with its own palette, kept readable on ink.
  const tint = { '--ep-accent': uiAccent(palette.accent), '--ep-ink': '#0b0a09' } as React.CSSProperties;
  const nodeKey = `${node.id}:${run.phase}`;
  const scrollOnArrive = nodeKey !== firstNodeKey.current;

  const exit = () => {
    saveAndExit();
    navigate({ name: 'scene' });
  };
  const resumeAndFocus = () => {
    resume();
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-stage-heading]')?.focus({ preventScroll: true }));
  };

  return (
    <div style={tint}>
      <div className="px-5 pb-16" inert={paused}>
        <div data-sticky-bar className="sticky top-0 z-40 -mx-5 flex items-center justify-between gap-2 bg-ink-950/85 px-3 py-2 backdrop-blur-md">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[0.8438rem] font-semibold text-ivory-dim hover:bg-ivory/[0.06] hover:text-ivory"
            onClick={exit}
          >
            <IconClose size={18} /> Save &amp; exit
          </button>
          <TimerButton run={run} onPause={pause} onResume={resumeAndFocus} />
        </div>

        <div className="pt-4">
          <p className="t-kicker">
            Episode {pad2(run.episodeNumber)} · {adventure.source === 'ai' ? 'written for you' : adventure.narrator ?? 'from the archive'}
          </p>
          <h1 className="t-display mt-1 text-[1.375rem] text-ivory-dim">{typographic(adventure.title)}</h1>
          <div className="mt-4">
            <ProgressRail stage={node.stage} phase={run.phase} finished={false} label={adventure.stageLabel ?? 'Stage'} />
          </div>
        </div>

        <History run={run} adventure={adventure} />

        {run.phase === 'choice' ? (
          <ChoicePanel key={`choice-${node.id}`} run={run} node={node} scrollOnArrive={scrollOnArrive} />
        ) : (
          <StageCard key={node.id} run={run} node={node} scrollOnArrive={scrollOnArrive} />
        )}
      </div>

      {paused && <PausedOverlay run={run} onResume={resumeAndFocus} onExit={exit} />}
    </div>
  );
}
