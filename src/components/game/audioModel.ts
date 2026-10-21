/**
 * Pure parts of the game audio: which sound a game event gets, and the volume / envelope maths behind it.
 * Nothing here touches WebAudio, so it is unit-tested directly.
 */

export type Sfx =
  | "collect" | "correct" | "wrong" | "jump" | "land" | "portal" | "mission" | "blip" | "checkpoint" | "fall" | "open" | "step" | "stepFast" | "gate"
  | "streak" | "areaEnter" | "victory";

/** What happens in the game, as far as sound is concerned. */
export type GameSoundEvent =
  | { type: "collect" }
  | { type: "answer"; correct: boolean; streak: number }
  | { type: "mission" }
  | { type: "complete" }
  | { type: "area" }
  | { type: "checkpoint" }
  | { type: "gate" }
  | { type: "respawn" };

export interface SoundCue {
  sfx: Sfx;
  /** 0-3: how big the cue is (streak size); other sounds ignore it. */
  level: number;
  /** Seconds after the event, so layered cues do not smear into one chord. */
  delay: number;
}

/** Streak size to intensity: nothing for a single right answer, then three steps up. */
export function streakLevel(streak: number): number {
  if (!Number.isFinite(streak) || streak < 2) return 0;
  if (streak < 4) return 1;
  if (streak < 6) return 2;
  return 3;
}

/**
 * The cues for one event, in play order. A right answer on a streak adds the streak flourish after the normal
 * "correct" chime; a wrong answer is only ever the gentle sound; finishing the game is the victory jingle alone.
 */
export function cuesForEvent(e: GameSoundEvent): SoundCue[] {
  const one = (sfx: Sfx): SoundCue[] => [{ sfx, level: 0, delay: 0 }];
  switch (e.type) {
    case "collect": return one("collect");
    case "answer": {
      if (!e.correct) return one("wrong");
      const level = streakLevel(e.streak);
      return level > 0 ? [...one("correct"), { sfx: "streak", level, delay: 0.28 }] : one("correct");
    }
    case "mission": return one("mission");
    case "complete": return one("victory");
    case "area": return one("areaEnter");
    case "checkpoint": return one("checkpoint");
    case "gate": return one("gate");
    case "respawn": return one("fall");
  }
}

/** The running count of right answers in a row; a wrong answer resets it. */
export function nextStreak(streak: number, correct: boolean): number {
  return correct ? Math.min(streak + 1, 99) : 0;
}

export const clamp = (v: number, lo: number, hi: number): number => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

/** Slider value 0-1 to linear gain. A squared curve matches how loudness is heard, and 0 is true silence. */
export function volumeToGain(volume: number, ceiling = 1): number {
  const v = clamp(volume, 0, 1);
  return v * v * ceiling;
}

/** Floor of every exponential ramp (exponential ramps cannot reach 0). */
export const SILENT = 0.0001;

/** A voice never starts at or below the floor, and never above a safe peak (the compressor is a net, not a plan). */
export function safeGain(g: number, peak = 0.5): number {
  return clamp(g, SILENT, peak);
}

/**
 * Gain of the attack/decay envelope used by every voice, `t` seconds after it starts. It mirrors the two
 * exponentialRamp calls in the synth: rise from the floor to `peak` over `attack`, then fall back to the floor at `dur`.
 */
export function envelopeAt(t: number, peak: number, attack: number, dur: number): number {
  if (t <= 0 || t >= dur) return SILENT;
  const a = Math.min(Math.max(attack, 1e-3), dur * 0.9);
  const p = safeGain(peak, 10);
  if (t <= a) return SILENT * Math.pow(p / SILENT, t / a);
  return p * Math.pow(SILENT / p, (t - a) / (dur - a));
}

/** Semitones of the streak flourish: a rising major arpeggio that gets longer and a little higher with the streak. */
export function streakNotes(level: number): number[] {
  const l = clamp(Math.round(level), 1, 3);
  return [0, 4, 7, 12].slice(0, 2 + l).map((s) => s + (l === 3 ? 2 : 0));
}

/** Minimum gap (seconds) between two plays of the same sound; fast loops must not stack voices. */
export const MIN_GAP: Partial<Record<Sfx, number>> = {
  step: 0.1, stepFast: 0.08, blip: 0.04, collect: 0.035, land: 0.12, jump: 0.1, fall: 0.4, streak: 0.5, areaEnter: 1, victory: 3, mission: 0.3,
};

export function gapAllows(name: Sfx, lastPlayed: number | undefined, now: number): boolean {
  const gap = MIN_GAP[name] ?? 0;
  return lastPlayed === undefined || now < lastPlayed || now - lastPlayed >= gap; // a rewound clock never blocks
}

/** Sounds that may be dropped when too many voices are already sounding. */
export const DROPPABLE: ReadonlySet<Sfx> = new Set<Sfx>(["step", "stepFast", "blip", "land", "jump"]);
export const VOICE_CAP = 28;

export function voiceAllowed(name: Sfx, active: number): boolean {
  return active < VOICE_CAP || !DROPPABLE.has(name);
}

/**
 * Where the music scheduler continues. After the page was in the background the next-note time is in the past;
 * jump to just ahead of "now" instead of replaying a backlog of notes.
 */
export function resyncNextNote(nextNote: number, now: number): number {
  return nextNote < now ? now + 0.1 : nextNote;
}

/** Length of the shared white-noise buffer, in seconds. */
export const NOISE_SECONDS = 1;

/**
 * Where in the noise buffer a burst of `dur` seconds starts (`random` in 0-1). A random place keeps repeated bursts from
 * sounding identical, but the burst plus its 50 ms release must still fit in the buffer, or a long one (the portal
 * swoosh, the victory shimmer) runs out of noise and stops with an audible cut.
 */
export function noiseOffset(dur: number, random: number, bufferSeconds = NOISE_SECONDS, maxOffset = 0.5): number {
  const room = Math.max(0, bufferSeconds - Math.max(0, dur) - 0.05);
  return clamp(random, 0, 1) * Math.min(maxOffset, room);
}
