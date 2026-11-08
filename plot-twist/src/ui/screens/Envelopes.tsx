import { useEffect, useState } from 'react';
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
import { describeConflict, suggestRelaxations } from '../../engine/matching.ts';
import type { Relaxation } from '../../engine/types.ts';
import { LIBRARY } from '../../content/library.ts';
import { envelopeAdventure, useStore } from '../../state/store.tsx';
import { Fact } from '../components/Bits.tsx';
import { Envelope, WaxSeal } from '../components/Envelope.tsx';
import { Sheet } from '../components/Sheet.tsx';
import { formatCost, pad2 } from '../hooks.ts';
import { IconArrowLeft, IconClock, IconCoin, IconGroup, IconHome, IconNote, IconOutside, IconRefresh, IconSolo, IconSparkle } from '../icons.tsx';
import { navigate } from '../router.ts';

function prefsSummary(p: Prefs): string {
  return [MINUTES_LABEL[p.minutes], BUDGET_LABEL[p.budget], SETTING_LABEL[p.setting], COMPANY_LABEL[p.company], MOOD_LABEL[p.mood], WEIRDNESS_LABEL[p.weirdness]].join(' · ');
}

function applyRelaxation(p: Prefs, r: Relaxation): Prefs {
  return { ...p, [r.constraint]: r.value } as Prefs;
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
      <h3 className="t-display mt-2 text-[clamp(34px,10vw,44px)] text-paper-ink">{adventure.title}</h3>
      {source === 'ai' && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#c2410c]/10 px-3 py-1 text-[12.5px] font-semibold text-[#9a3412]">
          <IconSparkle size={14} /> Written for you by the AI Director · checked against our rules
        </p>
      )}
      <p className="t-serif mt-4 text-[17.5px] leading-relaxed text-paper-ink">{adventure.intro}</p>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-paper-ink/15 pt-5">
        <Fact icon={<IconClock size={18} />} label="Duration" value={`~${adventure.minutes} min`} />
        <Fact icon={<IconCoin size={18} />} label="Expected cost" value={formatCost(adventure.cost)} />
        <Fact icon={adventure.settings.includes('home') && adventure.settings.length === 1 ? <IconHome size={18} /> : <IconOutside size={18} />} label="Where" value={where} />
        <Fact icon={adventure.company.includes('group') ? <IconGroup size={18} /> : <IconSolo size={18} />} label="Who" value={who} />
      </div>
      <div className="mt-4 border-t border-paper-ink/15 pt-4">
        <Fact icon={<IconNote size={18} />} label="You’ll need" value={adventure.items.length ? adventure.items.join(' · ') : 'Nothing but you'} />
      </div>
      <p className="mt-4 text-[13px] text-paper-mute">Three stages · one choice that changes the story · {adventure.endings.length} possible endings</p>

      <div className="mt-6 grid gap-2">
        <button type="button" className="btn btn-xl w-full bg-paper-ink text-paper shadow-[0_12px_30px_-12px_rgba(43,34,25,0.6)]" onClick={onStart} data-autofocus>
          Start episode
        </button>
        <button type="button" className="btn btn-ghost w-full text-paper-ink/75 hover:bg-paper-ink/[0.06] hover:text-paper-ink" onClick={onBack}>
          Back to envelopes
        </button>
      </div>
    </div>
  );
}

export function Envelopes() {
  const { state, openEnvelope, startEpisode, reshuffle, retryAiEnvelope, drawEnvelopes } = useStore();
  const draw = state.p.draw;
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const episodeNumber = state.p.completed.length + 1;

  // Opened without a draw (deep link / stale tab) → back to the scene. Mount-only on purpose:
  // starting an episode clears the draw and navigates to play itself.
  useEffect(() => {
    if (!draw) navigate({ name: 'scene' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!draw) return null;

  const ready = draw.envelopes.filter((e) => e.status === 'ready' && e.adventure);
  const curatedCount = draw.envelopes.filter((e) => e.source === 'curated' && e.adventure).length;
  const writing = draw.envelopes.some((e) => e.status === 'writing');
  const conflict = curatedCount === 0 && !writing && ready.length === 0 ? describeConflict(LIBRARY, draw.prefs) : null;
  const relaxations = conflict ? conflict.relaxations : ready.length < 3 ? suggestRelaxations(LIBRARY, draw.prefs) : [];
  const openEnv = openSlot === null ? null : draw.envelopes.find((e) => e.slot === openSlot) ?? null;
  const openAdventure = openEnv ? envelopeAdventure(openEnv) : null;

  const relax = (r: Relaxation) => drawEnvelopes(applyRelaxation(draw.prefs, r));

  return (
    <div className="px-5 pb-32">
      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="icon-btn -ml-2" onClick={() => navigate({ name: 'scene' })} aria-label="Back to set the scene">
          <IconArrowLeft />
        </button>
        <p className="t-kicker">Episode {pad2(episodeNumber)} · choose your envelope</p>
      </div>
      <h1 className="t-display mt-3 text-[clamp(34px,10vw,44px)]">{conflict ? 'No envelope fits that plot.' : 'Three envelopes. One plot twist.'}</h1>
      <p className="mt-2 text-[14px] text-ivory-dim">
        {prefsSummary(draw.prefs)}{' '}
        <button type="button" className="font-semibold text-ivory underline decoration-[color:var(--accent)] decoration-2 underline-offset-4" onClick={() => navigate({ name: 'scene' })}>
          Edit
        </button>
      </p>

      {conflict && (
        <div className="card anim-fade-up mt-6 p-5" role="alert">
          <p className="t-serif text-[17px]">{conflict.reason}</p>
          <p className="mt-2 text-[14px] text-ivory-dim">Change one thing and we will find you a plot:</p>
        </div>
      )}

      {relaxations.length > 0 && (
        <div className="mt-4">
          {!conflict && <p className="text-[13.5px] text-ivory-dim">Only {ready.length} episode{ready.length === 1 ? '' : 's'} fit everything. Loosen one thing for more:</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {relaxations.slice(0, 4).map((r) => (
              <button key={`${r.constraint}-${String(r.value)}`} type="button" className="chip" onClick={() => relax(r)}>
                {r.label} <span className="t-num text-[12px] text-ivory-mute">+{r.gain}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-7 space-y-5" aria-label="Envelopes">
        {draw.envelopes.map((env, i) => (
          <li key={`${draw.id}-${env.slot}`}>
            <Envelope
              envelope={env}
              adventure={envelopeAdventure(env)}
              episodeNumber={episodeNumber}
              generation={state.generation && state.generation.drawId === draw.id && state.generation.slot === env.slot ? state.generation : null}
              onOpen={() => {
                openEnvelope(env.slot);
                setOpenSlot(env.slot);
              }}
              onRetry={() => retryAiEnvelope(env.slot)}
              canRetry={state.director.canGenerate}
              index={i}
            />
          </li>
        ))}
      </ul>

      {!conflict && (
        <div className="mt-8 flex flex-col items-center gap-1">
          <button type="button" className="btn btn-ghost" onClick={reshuffle}>
            <IconRefresh size={18} /> Not feeling these? Draw again
          </button>
          <p className="text-[12.5px] text-ivory-mute">Open as many as you like before you commit.</p>
        </div>
      )}

      <Sheet open={Boolean(openAdventure)} onClose={() => setOpenSlot(null)} title={openAdventure ? `Envelope: ${openAdventure.title}` : 'Envelope'} variant="paper" labelHidden closeLabel="Back to envelopes">
        {openAdventure && openEnv && (
          <Letter
            adventure={openAdventure}
            source={openEnv.source}
            episodeNumber={episodeNumber}
            onBack={() => setOpenSlot(null)}
            onStart={() => {
              const run = startEpisode(openEnv.slot);
              setOpenSlot(null);
              if (run) navigate({ name: 'play' });
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
