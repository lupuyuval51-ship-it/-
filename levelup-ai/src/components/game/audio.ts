import type { WorldTheme } from "../../lib/game";

type Voice = { oscillator: OscillatorNode; gain: GainNode };
const SCORES: Record<WorldTheme, { root: number; notes: number[]; beat: number }> = {
  "future-city": { root: 164.81, notes: [0, 7, 12, 4, 7, 16, 12, 7], beat: .38 },
  "sky-island": { root: 146.83, notes: [0, 12, 7, 16, 9, 7, 14, 12], beat: .48 },
  "ai-lab": { root: 130.81, notes: [0, 7, 14, 12, 3, 10, 7, 14], beat: .4 },
  "mystery-castle": { root: 123.47, notes: [0, 7, 12, 3, 10, 7, 15, 12], beat: .52 },
  "digital-world": { root: 174.61, notes: [0, 12, 7, 14, 12, 19, 7, 12], beat: .34 },
};

/** Original synthesized sound. Bounded voices, separate channels, no autoplay. */
export class QuestAudio {
  private context?: AudioContext;
  private musicChannel?: GainNode;
  private effectsChannel?: GainNode;
  private voices = new Set<Voice>();
  private effectsEnabled = true;
  private musicEnabled = false;
  private scheduler?: ReturnType<typeof setInterval>;
  private nextBeat = 0;
  private beat = 0;
  private disposed = false;
  private paused = true;

  constructor(private theme: WorldTheme = "future-city") {}

  configure(effects: boolean, music: boolean) {
    if (this.disposed) return;
    this.effectsEnabled = effects;
    this.musicEnabled = music;
    if (!effects && !music && !this.context) return;
    if (!this.context) {
      this.context = new AudioContext();
      this.musicChannel = this.context.createGain();
      this.effectsChannel = this.context.createGain();
      this.musicChannel.gain.value = music ? .045 : 0;
      this.effectsChannel.gain.value = effects ? .15 : 0;
      this.musicChannel.connect(this.context.destination);
      this.effectsChannel.connect(this.context.destination);
    }
    this.paused = false;
    const context = this.context;
    this.effectsChannel!.gain.setTargetAtTime(effects ? .15 : 0, context.currentTime, .04);
    this.musicChannel!.gain.setTargetAtTime(music ? .045 : 0, context.currentTime, .12);
    void context.resume().then(() => {
      if (this.disposed || this.paused || !this.musicEnabled || this.scheduler) return;
      this.nextBeat = context.currentTime + .05;
      this.scheduleMusic();
      this.scheduler = setInterval(() => this.scheduleMusic(), 160);
    }).catch(() => { /* Denied audio never blocks the game. */ });
    if (!music) this.stopScheduler();
  }

  private tone(frequency: number, to: number, start: number, duration: number, amplitude: number, type: OscillatorType, channel: GainNode) {
    const context = this.context;
    if (!context || this.disposed || this.voices.size >= 32) return;
    const oscillator = context.createOscillator(), gain = context.createGain();
    const voice = { oscillator, gain };
    this.voices.add(voice);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (frequency !== to) oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(amplitude, start + Math.min(.018, duration / 4));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(channel);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(voice); };
    oscillator.start(start); oscillator.stop(start + duration + .015);
  }

  private scheduleMusic() {
    const context = this.context;
    if (!context || context.state !== "running" || this.paused || !this.musicEnabled || !this.musicChannel) return;
    const score = SCORES[this.theme];
    if (this.nextBeat < context.currentTime) this.nextBeat = context.currentTime + .02;
    while (this.nextBeat < context.currentTime + .35) {
      const note = score.root * 2 ** (score.notes[this.beat % score.notes.length] / 12);
      this.tone(note * 2, note * 2, this.nextBeat, score.beat * 1.5, .2, "sine", this.musicChannel);
      if (this.beat % 4 === 0) this.tone(score.root / 2, score.root / 2, this.nextBeat, score.beat * 3.5, .16, "triangle", this.musicChannel);
      this.nextBeat += score.beat;
      this.beat++;
    }
  }

  effect(correct: boolean) {
    if (!this.effectsEnabled || !this.context || this.context.state !== "running" || this.paused || !this.effectsChannel) return;
    const start = this.context.currentTime;
    const notes = correct ? [523.25, 659.25, 783.99] : [293.66, 246.94];
    notes.forEach((note, index) => this.tone(note, note, start + index * .085, .32, .36, "sine", this.effectsChannel!));
  }

  pulse(kind: "shot" | "dash" | "hit" | "collect") {
    if (!this.effectsEnabled || !this.context || this.context.state !== "running" || this.paused || !this.effectsChannel) return;
    const start = this.context.currentTime, channel = this.effectsChannel;
    if (kind === "shot") {
      this.tone(850, 190, start, .085, .23, "triangle", channel);
      this.tone(110, 65, start, .06, .2, "sine", channel);
    } else if (kind === "dash") {
      this.tone(170, 790, start, .16, .28, "triangle", channel);
      this.tone(340, 1580, start + .015, .14, .07, "sine", channel);
    } else if (kind === "hit") {
      this.tone(170, 65, start, .13, .4, "triangle", channel);
    } else {
      this.tone(784, 784, start, .19, .3, "sine", channel);
      this.tone(1175, 1175, start + .075, .24, .24, "sine", channel);
    }
  }

  private stopScheduler() { if (this.scheduler) clearInterval(this.scheduler); this.scheduler = undefined; }
  pause() { this.paused = true; this.stopScheduler(); void this.context?.suspend().catch(() => {}); }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.stopScheduler();
    this.voices.forEach(({ oscillator, gain }) => { oscillator.onended = null; oscillator.stop(); oscillator.disconnect(); gain.disconnect(); });
    this.voices.clear(); this.musicChannel?.disconnect(); this.effectsChannel?.disconnect();
    void this.context?.close().catch(() => {}); this.context = undefined;
  }
}
