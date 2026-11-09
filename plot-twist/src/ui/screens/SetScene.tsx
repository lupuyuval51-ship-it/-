import { useRef, useState } from 'react';
import {
  BUDGET_LABEL,
  BUDGET_OPTIONS,
  COMPANY_LABEL,
  COMPANY_OPTIONS,
  MINUTES_LABEL,
  MINUTES_OPTIONS,
  MOOD_LABEL,
  MOOD_OPTIONS,
  SETTING_LABEL,
  SETTING_OPTIONS,
} from '../../../shared/constants.ts';
import type { Prefs } from '../../../shared/types.ts';
import { currentNode, elapsedMs, isPaused } from '../../engine/run.ts';
import { LIBRARY } from '../../content/library.ts';
import { useStore } from '../../state/store.tsx';
import { ChipGroup, WeirdnessDial } from '../components/Controls.tsx';
import { Sheet } from '../components/Sheet.tsx';
import { formatClock, pad2, useNow } from '../hooks.ts';
import { IconArrowRight, IconEnvelope, IconGroup, IconHome, IconOutside, IconPause, IconPlay, IconSolo } from '../icons.tsx';
import { navigate } from '../router.ts';

/** A slow festival-style marquee of episode titles — a hint of what's in the envelopes. */
function NowShowing() {
  const titles = LIBRARY.map((a) => a.title);
  const [paused, setPaused] = useState(false);
  if (titles.length === 0) return null;
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {titles.map((t) => (
        <span key={t} className="flex items-center whitespace-nowrap">
          <span className="t-serif-italic px-3 text-[0.9375rem] text-ivory-dim">{t}</span>
          <span className="text-[0.6875rem] text-[color:var(--accent)]" aria-hidden="true">
            ✶
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee relative mt-6 -mx-5 border-y border-ivory/10 py-2.5" data-paused={paused}>
      <p className="sr-only">Now showing: {titles.join(', ')}</p>
      {/* Hidden by CSS whenever the marquee is still anyway (Keep it chill, reduced motion). */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="marquee-toggle absolute inset-y-0 right-0 z-10 grid w-11 place-items-center text-ivory-dim hover:text-ivory"
        aria-label={paused ? 'Play the title marquee' : 'Pause the title marquee'}
      >
        {paused ? <IconPlay size={14} /> : <IconPause size={14} />}
      </button>
      <div className="marquee-track" aria-hidden="true">
        <span className="t-kicker flex items-center whitespace-nowrap pl-5 pr-2 text-[0.625rem] text-[color:var(--accent)]">Now showing</span>
        {row(true)}
        <span className="t-kicker flex items-center whitespace-nowrap pl-5 pr-2 text-[0.625rem] text-[color:var(--accent)]">Now showing</span>
        {row(true)}
      </div>
    </div>
  );
}

function ResumeCard({ onResume, onDiscarded }: { onResume: () => void; onDiscarded: () => void }) {
  const { state, abandonRun } = useStore();
  const run = state.p.run;
  const now = useNow(1000, Boolean(run));
  const [confirm, setConfirm] = useState(false);
  if (!run) return null;
  const node = currentNode(run);
  const paused = isPaused(run);
  return (
    <section className="card anim-fade-up mt-6 overflow-hidden p-0" aria-label="Episode in progress">
      <div className="h-1" style={{ background: 'var(--accent)' }} aria-hidden="true" />
      <div className="p-4">
        <p className="t-kicker">
          Episode {pad2(run.episodeNumber)} · {paused ? 'paused' : 'in progress'} · {formatClock(elapsedMs(run, now))}
        </p>
        <p className="t-display mt-1.5 text-[1.5rem]">{run.adventure.title}</p>
        {node && (
          <p className="mt-1 text-[0.875rem] text-ivory-dim">
            {run.adventure.stageLabel ?? 'Stage'} {node.stage} of 3 — {node.title}
          </p>
        )}
        {/* The primary "Resume" lives in the bottom dock. In short viewports the dock ends the form
            instead, screens below, so there the card offers it (only one of the two is ever shown). */}
        <button type="button" className="btn btn-primary mt-4 hidden w-full short:inline-flex" onClick={onResume}>
          <IconPlay size={18} /> Resume Episode {pad2(run.episodeNumber)}
        </button>
        <div className="mt-3 flex">
          <button type="button" className="btn btn-ghost -ml-3 text-[0.875rem]" onClick={() => setConfirm(true)}>
            Discard this episode
          </button>
        </div>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Discard this episode?">
        <p className="t-display mt-3 text-[1.625rem]">Cut Episode {pad2(run.episodeNumber)} from the series?</p>
        <p className="mt-2 text-ivory-dim">Your progress in “{run.adventure.title}” will be lost. Completed episodes are not affected.</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              abandonRun();
              setConfirm(false);
              onDiscarded();
            }}
          >
            Yes, discard it
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)} data-autofocus>
            Keep it
          </button>
        </div>
      </Sheet>
    </section>
  );
}

/** Compact labels so Time fits one segmented row even at 320px. */
const MINUTES_SHORT: Record<(typeof MINUTES_OPTIONS)[number], string> = { 15: '15 min', 30: '30 min', 60: '1 hr', 120: '2 hrs' };

export function SetScene() {
  const { state, setPrefs, setDetail, drawEnvelopes, abandonRun, resume, toast } = useStore();
  const ctaRef = useRef<HTMLButtonElement>(null);
  const prefs = state.p.prefs;
  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs({ ...prefs, [key]: value });
  const [confirmNew, setConfirmNew] = useState(false);
  const next = state.p.completed.reduce((max, c) => Math.max(max, c.episodeNumber), 0) + 1;
  const aiOn = state.director.canGenerate;
  const activeRun = state.p.run;

  const go = () => {
    if (activeRun) {
      setConfirmNew(true);
      return;
    }
    drawEnvelopes();
    navigate({ name: 'envelopes' });
  };
  const resumeRun = () => {
    if (activeRun && activeRun.runningSince === null) resume();
    navigate({ name: 'play' });
  };

  return (
    // The bottom padding keeps the end of the form clear of the fixed dock (which flows in short viewports).
    <div className="px-5 pb-36 short:pb-8">
      <section className="anim-letterbox pt-6">
        <p className="t-kicker">
          {next === 1 ? 'Pilot episode' : `Episode ${pad2(next)}`}
          {state.p.series.name ? ` · ${state.p.series.name}` : ''}
        </p>
        <h1 className="t-display mt-3 text-[clamp(44px,13vw,60px)]">
          What’s your <span className="t-serif-italic font-normal text-[color:var(--accent)]">plot</span> today?
        </h1>
        <p className="t-serif mt-3 max-w-[30ch] text-[1.125rem] text-ivory-dim">Give us some free time. We’ll give you a story.</p>
        <NowShowing />
      </section>

      <ResumeCard
        onResume={resumeRun}
        onDiscarded={() => {
          toast('Episode discarded.');
          window.requestAnimationFrame(() => ctaRef.current?.focus());
        }}
      />

      <form
        className="mt-8 space-y-7"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        aria-label="Set the scene"
      >
        {/* The dial sets the whole look (chill / cinematic / playful), so it comes first. */}
        <WeirdnessDial value={prefs.weirdness} onChange={(w) => set('weirdness', w)} />
        <ChipGroup
          legend="Time"
          name="minutes"
          columns={4}
          value={prefs.minutes}
          onChange={(v) => set('minutes', v)}
          options={MINUTES_OPTIONS.map((m) => ({ value: m, label: MINUTES_SHORT[m] ?? MINUTES_LABEL[m] }))}
        />
        <ChipGroup legend="Budget" name="budget" columns={3} value={prefs.budget} onChange={(v) => set('budget', v)} options={BUDGET_OPTIONS.map((b) => ({ value: b, label: BUDGET_LABEL[b] }))} />
        <div className="grid grid-cols-1 gap-7 min-[400px]:grid-cols-2 min-[400px]:gap-4">
          <ChipGroup
            legend="Setting"
            name="setting"
            value={prefs.setting}
            onChange={(v) => set('setting', v)}
            options={SETTING_OPTIONS.map((s) => ({ value: s, label: SETTING_LABEL[s], icon: s === 'home' ? <IconHome size={17} /> : <IconOutside size={17} /> }))}
          />
          <ChipGroup
            legend="Company"
            name="company"
            value={prefs.company}
            onChange={(v) => set('company', v)}
            options={COMPANY_OPTIONS.map((c) => ({ value: c, label: COMPANY_LABEL[c], icon: c === 'solo' ? <IconSolo size={17} /> : <IconGroup size={17} /> }))}
          />
        </div>
        <ChipGroup legend="Mood" name="mood" grid value={prefs.mood} onChange={(v) => set('mood', v)} options={MOOD_OPTIONS.map((m) => ({ value: m, label: MOOD_LABEL[m] }))} />

        {aiOn && (
          <div className="anim-fade-up">
            <label htmlFor="ai-detail" className="t-kicker mb-2 block">
              One detail for the AI Director <span className="normal-case tracking-normal text-ivory-mute">(optional)</span>
            </label>
            <input
              id="ai-detail"
              className="field"
              type="text"
              maxLength={140}
              value={state.detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g. it’s raining · near a big park · I have chalk"
              autoComplete="off"
              enterKeyHint="go"
            />
            <p className="mt-1.5 text-[0.7812rem] text-ivory-mute">Used only to personalize your written-for-you envelope.</p>
          </div>
        )}

        <div className="dock">
          <div className="mx-auto max-w-[480px]">
            {activeRun ? (
              <>
                {/* One clear primary action while an episode is in progress (on the card in short viewports). */}
                <button ref={ctaRef} type="button" className="btn btn-primary btn-xl w-full short:hidden" onClick={resumeRun}>
                  <IconPlay size={20} /> Resume Episode {pad2(activeRun.episodeNumber)}
                </button>
                <button type="submit" className="btn btn-ghost mt-1 w-full text-[0.875rem]">
                  New envelopes instead
                </button>
              </>
            ) : (
              <>
                <button ref={ctaRef} type="submit" className="btn btn-primary btn-xl w-full">
                  <IconEnvelope size={22} /> Give me a plot twist
                </button>
                <p className="mt-2 text-center text-[0.7812rem] text-ivory-mute" aria-live="polite">
                  {aiOn ? 'Two archive envelopes + one written for you' : 'Three envelopes from the curated archive'}
                </p>
              </>
            )}
          </div>
        </div>
      </form>

      <Sheet open={confirmNew} onClose={() => setConfirmNew(false)} title="Episode in progress">
        <p className="t-display mt-3 text-[1.625rem]">Episode {activeRun ? pad2(activeRun.episodeNumber) : ''} is still running.</p>
        <p className="mt-2 text-ivory-dim">Pick up where you left off, or start fresh with new envelopes (the current episode will be discarded).</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="btn btn-primary"
            data-autofocus
            onClick={() => {
              setConfirmNew(false);
              resumeRun();
            }}
          >
            Resume “{activeRun?.adventure.title}” <IconArrowRight size={18} />
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setConfirmNew(false);
              abandonRun();
              drawEnvelopes();
              navigate({ name: 'envelopes' });
            }}
          >
            Discard it and draw new envelopes
          </button>
        </div>
      </Sheet>
    </div>
  );
}
