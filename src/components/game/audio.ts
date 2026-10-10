/**
 * Sound effects and optional music, synthesised with WebAudio: no audio files are fetched or bundled.
 * Browsers only allow audio after a user gesture, so everything is lazy and `unlock()` is called from input.
 */
export type Sfx = "collect" | "correct" | "wrong" | "jump" | "land" | "portal" | "mission" | "blip" | "checkpoint" | "fall" | "open";

const SCALE = [0, 2, 4, 7, 9]; // major pentatonic

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  sfxOn = true;
  musicOn = false;

  unlock(): void {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      if (this.musicOn && !this.musicTimer) this.startMusic();
    } catch {
      /* audio is optional */
    }
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, slideTo?: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(this.master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  play(name: Sfx): void {
    if (!this.sfxOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case "collect": this.tone(660, t, 0.1, "triangle", 0.25); this.tone(990, t + 0.07, 0.16, "triangle", 0.22); break;
      case "correct": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.08, 0.2, "triangle", 0.25)); break;
      case "wrong": this.tone(220, t, 0.25, "sawtooth", 0.14, 140); break;
      case "jump": this.tone(300, t, 0.16, "square", 0.08, 640); break;
      case "land": this.tone(140, t, 0.08, "sine", 0.18, 80); break;
      case "portal": this.tone(200, t, 0.7, "sine", 0.22, 900); this.tone(300, t + 0.1, 0.6, "triangle", 0.12, 1200); break;
      case "mission": [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, t + i * 0.09, 0.32, "triangle", 0.22)); break;
      case "blip": this.tone(520 + Math.random() * 120, t, 0.05, "square", 0.05); break;
      case "checkpoint": this.tone(740, t, 0.12, "sine", 0.2); this.tone(988, t + 0.1, 0.2, "sine", 0.2); break;
      case "fall": this.tone(420, t, 0.5, "sawtooth", 0.12, 70); break;
      case "open": this.tone(440, t, 0.08, "triangle", 0.15); this.tone(660, t + 0.06, 0.1, "triangle", 0.15); break;
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
    if (this.musicTimer || !this.ctx) return;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== "running") return;
      const t = this.ctx.currentTime;
      const base = 196; // G3
      if (this.step % 8 === 0) this.tone(base / 2 * Math.pow(2, SCALE[(this.step / 8) % 5 | 0]! / 12), t, 1.8, "sine", 0.06);
      if (Math.random() < 0.7) {
        const deg = SCALE[Math.floor(Math.random() * SCALE.length)]! + (Math.random() < 0.3 ? 12 : 0);
        this.tone(base * 2 * Math.pow(2, deg / 12), t, 1.1, "triangle", 0.035);
      }
      this.step++;
    }, 520);
  }

  private stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  dispose(): void {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
  }
}
