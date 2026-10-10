/**
 * Sound effects and optional music, synthesised with WebAudio: no audio files are fetched or bundled.
 * Browsers only allow audio after a user gesture, so everything is lazy and `unlock()` is called from input.
 *
 * Music is a small generative loop per environment (tempo, key, chord progression, instrument and arpeggio pattern all
 * come from the environment's "mood"), scheduled a quarter of a second ahead so it never stutters.
 */
import type { Environment } from "@/lib/game/spec/constants";

export type Sfx = "collect" | "correct" | "wrong" | "jump" | "land" | "portal" | "mission" | "blip" | "checkpoint" | "fall" | "open" | "step" | "stepFast" | "gate";

const SCALE = [0, 2, 4, 7, 9]; // major pentatonic, used for the pickup combo
type Quality = "maj" | "min" | "sus";
const TRIAD: Record<Quality, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], sus: [0, 5, 7] };

interface Mood {
  bpm: number;
  /** MIDI note of the key's root (bass sits an octave below). */
  root: number;
  /** One bar per entry: semitone offset of the chord root and its quality. */
  chords: [number, Quality][];
  lead: OscillatorType;
  pad: OscillatorType;
  /** Per eighth note of a bar: index into the chord (0-2, +3 for the octave) or null for a rest. */
  arp: (number | null)[];
  /** Quiet noise tick on the off-beats (city, lab). */
  tick: boolean;
  /** Overall low-pass for the lead, in Hz (smaller = softer). */
  bright: number;
}

const MOODS: Record<Environment, Mood> = {
  "neon-city": { bpm: 108, root: 45, chords: [[0, "min"], [8, "maj"], [3, "maj"], [10, "maj"]], lead: "sawtooth", pad: "triangle", arp: [0, 2, 1, 2, 3, 2, 1, 2], tick: true, bright: 2400 },
  forest: { bpm: 84, root: 55, chords: [[0, "maj"], [5, "maj"], [9, "min"], [7, "maj"]], lead: "triangle", pad: "sine", arp: [0, null, 1, null, 2, null, 1, 3], tick: false, bright: 3200 },
  "space-station": { bpm: 72, root: 50, chords: [[0, "sus"], [3, "maj"], [5, "sus"], [10, "maj"]], lead: "sine", pad: "sawtooth", arp: [2, null, null, 1, null, null, 3, null], tick: false, bright: 1500 },
  "desert-ruins": { bpm: 92, root: 52, chords: [[0, "maj"], [1, "maj"], [0, "maj"], [10, "min"]], lead: "triangle", pad: "triangle", arp: [0, 1, 2, 1, 0, null, 2, null], tick: false, bright: 2600 },
  "ocean-floor": { bpm: 66, root: 48, chords: [[0, "sus"], [7, "sus"], [5, "maj"], [0, "sus"]], lead: "sine", pad: "sine", arp: [1, null, null, 2, null, null, 0, null], tick: false, bright: 1800 },
  laboratory: { bpm: 104, root: 53, chords: [[0, "maj"], [7, "maj"], [9, "min"], [5, "maj"]], lead: "square", pad: "triangle", arp: [0, 2, 1, 3, 0, 2, 1, 3], tick: true, bright: 2200 },
  castle: { bpm: 76, root: 50, chords: [[0, "min"], [10, "maj"], [8, "maj"], [7, "maj"]], lead: "triangle", pad: "sawtooth", arp: [0, null, 1, null, 2, 1, null, null], tick: false, bright: 1900 },
  "sky-islands": { bpm: 98, root: 57, chords: [[0, "maj"], [7, "maj"], [9, "min"], [5, "maj"]], lead: "sine", pad: "triangle", arp: [0, 1, 2, 3, 2, 1, 2, 1], tick: false, bright: 3600 },
};

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private beat = 0;
  private mood: Mood = MOODS["neon-city"];
  private combo = 0;
  private lastCollect = -10;
  sfxOn = true;
  musicOn = false;

  unlock(): void {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        comp.connect(this.ctx.destination);
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(comp);
        this.music = this.ctx.createGain();
        this.music.gain.value = 0.55;
        this.music.connect(comp);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      if (this.musicOn && !this.timer) this.startMusic();
    } catch {
      /* audio is optional */
    }
  }

  /** Picks the music mood for an environment (takes effect on the next bar). */
  setTheme(env: Environment): void {
    this.mood = MOODS[env] ?? MOODS["neon-city"];
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, opts: { slideTo?: number; attack?: number; dest?: AudioNode; lowpass?: number } = {}): void {
    const ctx = this.ctx;
    const dest = opts.dest ?? this.master;
    if (!ctx || !dest) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, start + dur);
    const attack = opts.attack ?? 0.012;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    let out: AudioNode = o;
    if (opts.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = opts.lowpass;
      o.connect(f);
      out = f;
    }
    out.connect(g).connect(dest);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  private noise(start: number, dur: number, gain: number, type: BiquadFilterType, from: number, to = from, dest?: AudioNode): void {
    const ctx = this.ctx;
    const out = dest ?? this.master;
    if (!ctx || !out) return;
    if (!this.noiseBuf) {
      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(from, start);
    if (to !== from) f.frequency.exponentialRampToValueAtTime(to, start + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.01, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(out);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur + 0.05);
  }

  play(name: Sfx): void {
    if (!this.sfxOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case "collect": {
        // quick successive pickups climb the pentatonic scale
        this.combo = t - this.lastCollect < 3 ? Math.min(this.combo + 1, 14) : 0;
        this.lastCollect = t;
        const f = 660 * Math.pow(2, SCALE[this.combo % 5]! / 12 + Math.floor(this.combo / 5));
        this.tone(f, t, 0.1, "triangle", 0.22);
        this.tone(f * 1.5, t + 0.06, 0.18, "triangle", 0.2);
        this.tone(f * 3, t + 0.06, 0.12, "sine", 0.05);
        this.noise(t, 0.08, 0.03, "highpass", 6000);
        break;
      }
      case "correct":
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.075, 0.24, "triangle", 0.23));
        this.tone(2093, t + 0.3, 0.4, "sine", 0.05);
        this.noise(t + 0.3, 0.35, 0.03, "highpass", 5000);
        break;
      case "wrong":
        this.tone(233, t, 0.26, "sawtooth", 0.1, { slideTo: 160, lowpass: 900 });
        this.tone(220, t + 0.12, 0.3, "sawtooth", 0.1, { slideTo: 130, lowpass: 800 });
        break;
      case "jump":
        this.tone(280, t, 0.17, "sine", 0.14, { slideTo: 640 });
        this.noise(t, 0.08, 0.025, "bandpass", 900, 2200);
        break;
      case "land":
        this.tone(130, t, 0.12, "sine", 0.2, { slideTo: 55 });
        this.noise(t, 0.09, 0.06, "lowpass", 700, 250);
        break;
      case "step":
        this.noise(t, 0.05, 0.035 + Math.random() * 0.01, "lowpass", 900 + Math.random() * 300, 350);
        break;
      case "stepFast":
        this.noise(t, 0.06, 0.05 + Math.random() * 0.012, "lowpass", 1100 + Math.random() * 300, 380);
        break;
      case "portal":
        this.noise(t, 0.9, 0.08, "bandpass", 300, 3600);
        this.tone(200, t, 0.8, "sine", 0.2, { slideTo: 900 });
        this.tone(300, t + 0.1, 0.7, "triangle", 0.12, { slideTo: 1400 });
        this.tone(1760, t + 0.5, 0.5, "sine", 0.05);
        break;
      case "mission":
        [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, t + i * 0.09, 0.34, "triangle", 0.21));
        [196, 247, 294].forEach((f, i) => this.tone(f, t + i * 0.09, 0.5, "sine", 0.1));
        this.noise(t + 0.4, 0.5, 0.025, "highpass", 5500);
        break;
      case "blip":
        this.tone(480 + Math.random() * 180, t, 0.05, "square", 0.045, { lowpass: 2600 });
        break;
      case "checkpoint":
        this.tone(740, t, 0.28, "sine", 0.19);
        this.tone(988, t + 0.1, 0.4, "sine", 0.19);
        this.tone(1480, t + 0.1, 0.25, "sine", 0.05);
        break;
      case "fall":
        this.tone(420, t, 0.55, "sawtooth", 0.1, { slideTo: 60, lowpass: 1400 });
        this.noise(t, 0.4, 0.04, "lowpass", 1200, 200);
        break;
      case "gate":
        this.tone(70, t, 0.7, "sawtooth", 0.1, { slideTo: 140, lowpass: 500 });
        this.noise(t, 0.7, 0.07, "lowpass", 400, 1400);
        [392, 523, 659].forEach((f, i) => this.tone(f, t + 0.35 + i * 0.1, 0.3, "triangle", 0.15));
        break;
      case "open":
        this.tone(440, t, 0.08, "triangle", 0.14);
        this.tone(660, t + 0.06, 0.12, "triangle", 0.14);
        break;
    }
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (this.ctx) this.startMusic();
  }

  private startMusic(): void {
    if (this.timer || !this.ctx) return;
    this.nextNote = this.ctx.currentTime + 0.12;
    this.beat = 0;
    this.timer = setInterval(() => this.pump(), 70);
  }

  private pump(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") {
      if (ctx && this.nextNote < ctx.currentTime) this.nextNote = ctx.currentTime + 0.1; // never replay a backlog after a suspend
      return;
    }
    while (this.nextNote < ctx.currentTime + 0.25) {
      this.scheduleStep(this.beat, this.nextNote);
      this.nextNote += 60 / this.mood.bpm / 2;
      this.beat++;
    }
  }

  private scheduleStep(beat: number, t: number): void {
    const m = this.mood;
    const bus = this.music;
    if (!bus) return;
    const eighth = 60 / m.bpm / 2;
    const pos = beat % 8;
    const [off, quality] = m.chords[Math.floor(beat / 8) % m.chords.length]!;
    const tones = TRIAD[quality];
    const rootNote = m.root + off;
    if (pos === 0) {
      // pad: the whole triad, slowly swelling over the bar
      tones.forEach((semi, i) => this.tone(midi(rootNote + 12 + semi) * (i === 1 ? 1.003 : 1), t, eighth * 8.2, m.pad, 0.018, { attack: eighth * 3, dest: bus, lowpass: m.bright * 0.6 }));
      this.tone(midi(rootNote - 12), t, eighth * 3.6, "sine", 0.1, { attack: 0.02, dest: bus });
    }
    if (pos === 4) this.tone(midi(rootNote - 12 + (quality === "sus" ? 5 : 7)), t, eighth * 2.5, "sine", 0.07, { attack: 0.02, dest: bus });
    const a = m.arp[pos];
    if (a != null) {
      const semi = tones[a % 3]! + (a >= 3 ? 12 : 0);
      this.tone(midi(rootNote + 24 + semi), t, eighth * 1.6, m.lead, 0.03, { attack: 0.01, dest: bus, lowpass: m.bright });
    }
    if (m.tick && pos % 2 === 1) this.noise(t, 0.03, 0.012, "highpass", 7000, 7000, bus);
  }

  private stopMusic(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  dispose(): void {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
  }
}
