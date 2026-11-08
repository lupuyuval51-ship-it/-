import { useEffect, useRef, useState } from 'react';
import { PALETTES } from '../../../shared/constants.ts';
import { getNode } from '../../../shared/graph.ts';
import { renderTemplate } from '../../../shared/template.ts';
import type { Adventure, StageNode } from '../../../shared/types.ts';
import { currentNode, elapsedMs, isFinished, isPaused } from '../../engine/run.ts';
import type { Run } from '../../engine/types.ts';
import { useStore } from '../../state/store.tsx';
import { ProgressRail } from '../components/Bits.tsx';
import { formatClock, pad2, useNow } from '../hooks.ts';
import { IconBolt, IconCheck, IconClose, IconGroup, IconPause, IconPlay, IconSwap } from '../icons.tsx';
import { navigate } from '../router.ts';
import { uiAccent } from '../color.ts';

function TimerButton({ run, onPause, onResume }: { run: Run; onPause: () => void; onResume: () => void }) {
  const now = useNow(1000);
  const paused = isPaused(run);
  const elapsed = elapsedMs(run, now);
  const over = elapsed > run.adventure.minutes * 60_000;
  return (
    <button
      type="button"
      onClick={paused ? onResume : onPause}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-3.5 transition-colors ${paused ? 'border-[color:var(--ep-accent)] bg-[color:var(--ep-accent)]/10' : 'border-ivory/15 bg-ivory/[0.04] hover:border-ivory/30'}`}
      aria-label={`${paused ? 'Resume' : 'Pause'} timer. ${formatClock(elapsed)} elapsed of about ${run.adventure.minutes} minutes`}
    >
      {paused ? <IconPlay size={16} /> : <IconPause size={16} />}
      <span className={`t-num text-[15px] font-semibold ${paused ? 'anim-pulse' : ''} ${over ? 'text-[color:var(--ep-accent)]' : 'text-ivory'}`} aria-hidden="true">
        {formatClock(elapsed)}
      </span>
      <span className="t-num hidden text-[12px] text-ivory-mute min-[380px]:inline" aria-hidden="true">
        / {run.adventure.minutes}:00
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
          <li key={step.nodeId} className="flex gap-3 rounded-2xl border border-ivory/8 bg-ivory/[0.025] px-3.5 py-2.5 text-[13.5px]">
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
        <p className="mt-1.5 text-[15.5px] text-ivory">{text}</p>
      </div>
    );
  }
  return (
    <details className="group mt-4 rounded-2xl border border-ivory/12 px-4 py-3">
      <summary className="t-kicker flex cursor-pointer list-none items-center gap-1.5 text-ivory-dim [&::-webkit-details-marker]:hidden">
        <IconBolt size={14} /> Feeling bold? <span className="ml-auto text-[10px] group-open:hidden">Show</span>
      </summary>
      <p className="mt-2 text-[15px] text-ivory">{text}</p>
    </details>
  );
}

function StageCard({ run, node }: { run: Run; node: StageNode }) {
  const { setNote, toggleAlternative, completeStage } = useStore();
  const adventure = run.adventure;
  const r = (t: string) => renderTemplate(t, run.notes);
  const alt = run.usingAlternative;
  const capture = node.capture;
  const [draft, setDraft] = useState(capture ? run.notes[capture.key] ?? '' : '');
  const finish = useFinish();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, [node.id]);

  const commitNote = () => {
    if (capture && draft.trim() !== (run.notes[capture.key] ?? '')) setNote(capture.key, draft);
  };
  // Save while typing (debounced) so a refresh never loses a note. The input shows the local
  // draft, so the store trimming the saved value never eats the space being typed.
  useEffect(() => {
    if (!capture) return;
    const id = window.setTimeout(commitNote, 400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <article className="anim-rise mt-7" aria-labelledby={`stage-${node.id}`}>
      <p className="t-kicker">
        {adventure.stageLabel ?? 'Stage'} {node.stage} of 3 · ~{node.minutes} min
      </p>
      <h2 id={`stage-${node.id}`} ref={headingRef} tabIndex={-1} className="t-display mt-2 text-[clamp(32px,9.5vw,40px)] outline-none">
        {node.title}
      </h2>
      <p className="t-serif-italic mt-3 text-[18px] text-ivory-dim">{r(node.narrative)}</p>

      <div className="mt-5 rounded-[20px] border border-ivory/10 bg-ivory/[0.045] p-4 pl-5" style={{ boxShadow: 'inset 4px 0 0 var(--ep-accent)' }}>
        <p className="t-kicker text-[color:var(--ep-accent)]">{alt ? 'Alternate route' : 'Your move'}</p>
        <p className="mt-1.5 text-[18px] font-semibold leading-snug text-ivory" aria-live="polite">
          {r(alt ? node.alternative : node.action)}
        </p>
      </div>

      {node.amplify && !alt && <Amplify text={r(node.amplify)} weirdness={run.prefs.weirdness} />}

      {node.crewTip && run.prefs.company === 'group' && (
        <p className="mt-4 flex gap-2.5 text-[14.5px] text-ivory-dim">
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
            onBlur={commitNote}
            autoComplete="off"
            enterKeyHint="done"
          />
          <p className="mt-1.5 text-[12.5px] text-ivory-mute">It may show up later in the story — and on your poster.</p>
        </div>
      )}

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          className="btn btn-primary btn-xl w-full"
          style={{ background: 'var(--ep-accent)', color: 'var(--ep-ink)' }}
          onClick={() => {
            commitNote();
            const done = completeStage();
            if (done) finish(done.id);
          }}
        >
          <IconCheck size={20} /> Done — I did it
        </button>
        <button type="button" className="btn btn-ghost w-full" onClick={toggleAlternative} aria-pressed={alt}>
          <IconSwap size={18} /> {alt ? 'Back to the main challenge' : 'Swap for an alternative challenge'}
        </button>
      </div>
    </article>
  );
}

function useFinish() {
  return (episodeId: string) => navigate({ name: 'finale', episodeId }, { replace: true });
}

function ChoicePanel({ run, node }: { run: Run; node: StageNode }) {
  const { choose } = useStore();
  const finish = useFinish();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  if (!node.choice) return null;
  const prompt = renderTemplate(node.choice.prompt, run.notes);
  return (
    <section className="anim-rise mt-8" aria-labelledby="choice-title">
      <p className="t-kicker">The fork in the road</p>
      <h2 id="choice-title" ref={headingRef} tabIndex={-1} className="t-display mt-2 text-[clamp(30px,9vw,38px)] outline-none">
        {prompt}
      </h2>
      <p className="mt-2 text-[14px] text-ivory-dim">Your choice changes what happens next — and how this episode ends.</p>
      <div className="mt-6 grid gap-3">
        {node.choice.options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              const done = choose(opt.id);
              if (done) finish(done.id);
            }}
            className="anim-fade-up group rounded-[22px] border border-ivory/14 bg-ivory/[0.04] p-5 text-left transition-[border-color,background-color,transform] duration-200 hover:border-[color:var(--ep-accent)] hover:bg-ivory/[0.07] active:scale-[0.985]"
            style={{ animationDelay: `${120 + i * 90}ms` }}
          >
            <span className="t-kicker text-[color:var(--ep-accent)]">Option {String.fromCharCode(65 + i)}</span>
            <span className="t-display mt-1.5 block text-[25px]">{opt.label}</span>
            <span className="mt-1 block text-[15px] text-ivory-dim">{opt.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Play() {
  const { state, pause, resume, saveAndExit } = useStore();
  const run = state.p.run;

  // Mount-only: finishing the episode clears the run and navigates to the finale itself.
  useEffect(() => {
    if (!run) navigate({ name: 'scene' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!run || isFinished(run)) return null;

  const adventure = run.adventure;
  const node = currentNode(run);
  if (!node) return null;
  const palette = PALETTES[adventure.palette];
  const paused = isPaused(run);
  // Each episode tints the play screen with its own palette, kept readable on ink.
  const tint = { '--ep-accent': uiAccent(palette.accent), '--ep-ink': '#0b0a09' } as React.CSSProperties;

  return (
    <div className="px-5 pb-16" style={tint}>
      <div className="sticky top-0 z-20 -mx-5 flex items-center justify-between gap-2 bg-ink-950/85 px-3 py-2 backdrop-blur-md">
        <button
          type="button"
          className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-ivory-dim hover:bg-ivory/[0.06] hover:text-ivory"
          onClick={() => {
            saveAndExit();
            navigate({ name: 'scene' });
          }}
        >
          <IconClose size={18} /> Save &amp; exit
        </button>
        <TimerButton run={run} onPause={pause} onResume={resume} />
      </div>

      <div className="pt-4">
        <p className="t-kicker">
          Episode {pad2(run.episodeNumber)} · {adventure.source === 'ai' ? 'written for you' : adventure.narrator ?? 'from the archive'}
        </p>
        <p className="t-display mt-1 text-[22px] text-ivory-dim">{adventure.title}</p>
        <div className="mt-4">
          <ProgressRail stage={node.stage} phase={run.phase} finished={false} label={adventure.stageLabel ?? 'Stage'} />
        </div>
      </div>

      <History run={run} adventure={adventure} />

      <div className="relative">
        {run.phase === 'choice' ? <ChoicePanel key={`choice-${node.id}`} run={run} node={node} /> : <StageCard key={node.id} run={run} node={node} />}

        {paused && (
          <div className="absolute inset-0 -mx-2 grid place-items-start rounded-3xl bg-ink-950/80 px-2 pt-10 backdrop-blur-[3px]" role="dialog" aria-modal="false" aria-labelledby="paused-title">
            <div className="anim-fade-up w-full text-center">
              <p className="t-kicker">Timer stopped</p>
              <p id="paused-title" className="t-display mt-2 text-[40px]">
                Paused.
              </p>
              <p className="t-serif-italic mt-1 text-ivory-dim">The plot can wait. Paused time never counts.</p>
              <button type="button" className="btn btn-primary btn-xl mx-auto mt-6 w-full max-w-[320px]" onClick={resume} autoFocus>
                <IconPlay size={18} /> Resume episode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
