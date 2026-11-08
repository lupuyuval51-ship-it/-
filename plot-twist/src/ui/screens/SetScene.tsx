import { useState } from 'react';
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
import { IconArrowRight, IconEnvelope, IconGroup, IconHome, IconOutside, IconSolo } from '../icons.tsx';
import { navigate } from '../router.ts';

/** A slow festival-style marquee of episode titles — a hint of what's in the envelopes. */
function NowShowing() {
  const titles = LIBRARY.map((a) => a.title);
  if (titles.length === 0) return null;
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {titles.map((t) => (
        <span key={t} className="flex items-center whitespace-nowrap">
          <span className="t-serif-italic px-3 text-[15px] text-ivory-dim">{t}</span>
          <span className="text-[11px] text-[color:var(--accent)]" aria-hidden="true">
            ✶
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee mt-6 -mx-5 overflow-hidden border-y border-ivory/10 py-2.5">
      <p className="sr-only">Now showing: {titles.join(', ')}</p>
      <div className="marquee-track" aria-hidden="true">
        <span className="t-kicker flex items-center whitespace-nowrap pl-5 pr-2 text-[10px] text-[color:var(--accent)]">Now showing</span>
        {row(true)}
        <span className="t-kicker flex items-center whitespace-nowrap pl-5 pr-2 text-[10px] text-[color:var(--accent)]">Now showing</span>
        {row(true)}
      </div>
    </div>
  );
}

function ResumeCard() {
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
        <p className="t-display mt-1.5 text-[24px]">{run.adventure.title}</p>
        {node && (
          <p className="mt-1 text-[14px] text-ivory-dim">
            {run.adventure.stageLabel ?? 'Stage'} {node.stage} of 3 — {node.title}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn btn-primary flex-1" onClick={() => navigate({ name: 'play' })}>
            Resume episode
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
            Discard
          </button>
        </div>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Discard this episode?">
        <p className="t-display mt-3 text-[26px]">Cut Episode {pad2(run.episodeNumber)} from the series?</p>
        <p className="mt-2 text-ivory-dim">Your progress in “{run.adventure.title}” will be lost. Completed episodes are not affected.</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              abandonRun();
              setConfirm(false);
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

export function SetScene() {
  const { state, setPrefs, setDetail, drawEnvelopes, abandonRun } = useStore();
  const prefs = state.p.prefs;
  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs({ ...prefs, [key]: value });
  const [confirmNew, setConfirmNew] = useState(false);
  const next = state.p.completed.length + 1;
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

  return (
    <div className="px-5 pb-36">
      <section className="anim-letterbox pt-6">
        <p className="t-kicker">
          {next === 1 ? 'Pilot episode' : `Episode ${pad2(next)}`}
          {state.p.series.name ? ` · ${state.p.series.name}` : ''}
        </p>
        <h1 className="t-display mt-3 text-[clamp(44px,13vw,60px)]">
          What’s your <span className="t-serif-italic font-normal text-[color:var(--accent)]">plot</span> today?
        </h1>
        <p className="t-serif mt-3 max-w-[30ch] text-[18px] text-ivory-dim">Give us some free time. We’ll give you a story.</p>
        <NowShowing />
      </section>

      <ResumeCard />

      <form
        className="mt-8 space-y-7"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        aria-label="Set the scene"
      >
        <ChipGroup
          legend="Time"
          name="minutes"
          value={prefs.minutes}
          onChange={(v) => set('minutes', v)}
          options={MINUTES_OPTIONS.map((m) => ({ value: m, label: MINUTES_LABEL[m] }))}
        />
        <ChipGroup legend="Budget" name="budget" value={prefs.budget} onChange={(v) => set('budget', v)} options={BUDGET_OPTIONS.map((b) => ({ value: b, label: BUDGET_LABEL[b] }))} />
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
        <WeirdnessDial value={prefs.weirdness} onChange={(w) => set('weirdness', w)} />

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
            <p className="mt-1.5 text-[12.5px] text-ivory-mute">Used only to personalize your written-for-you envelope.</p>
          </div>
        )}

        <div className="dock safe-bottom fixed inset-x-0 bottom-0 z-30 px-5 pt-10">
          <div className="mx-auto max-w-[480px]">
            <button type="submit" className="btn btn-primary btn-xl w-full">
              <IconEnvelope size={22} /> Give me a plot twist
            </button>
            <p className="mt-2 text-center text-[12.5px] text-ivory-mute" aria-live="polite">
              {aiOn ? 'Two archive envelopes + one written for you' : 'Three envelopes from the curated archive'}
            </p>
          </div>
        </div>
      </form>

      <Sheet open={confirmNew} onClose={() => setConfirmNew(false)} title="Episode in progress">
        <p className="t-display mt-3 text-[26px]">Episode {activeRun ? pad2(activeRun.episodeNumber) : ''} is still running.</p>
        <p className="mt-2 text-ivory-dim">Pick up where you left off, or start fresh with new envelopes (the current episode will be discarded).</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="btn btn-primary"
            data-autofocus
            onClick={() => {
              setConfirmNew(false);
              navigate({ name: 'play' });
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
