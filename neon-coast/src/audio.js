// All sound is synthesised with WebAudio: engine, siren, guns, explosions and three procedural radio stations.
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
export class AudioSys {
  constructor() { this.ctx = null; this.volume = 0.8; this.station = 'off'; this.enabled = false; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = C.createGain(); this.master.gain.value = this.volume; this.master.connect(C.destination);
    this.sfx = C.createGain(); this.sfx.connect(this.master); this.music = C.createGain(); this.music.gain.value = 0; this.music.connect(this.master);
    const nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    // engine
    this.engGain = C.createGain(); this.engGain.gain.value = 0; this.engFilter = C.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 600; this.engFilter.connect(this.engGain); this.engGain.connect(this.sfx);
    this.eng1 = C.createOscillator(); this.eng1.type = 'sawtooth'; this.eng1.frequency.value = 80; this.eng1.connect(this.engFilter); this.eng1.start();
    this.eng2 = C.createOscillator(); this.eng2.type = 'square'; this.eng2.frequency.value = 40; const g2 = C.createGain(); g2.gain.value = 0.5; this.eng2.connect(g2); g2.connect(this.engFilter); this.eng2.start();
    // siren
    this.sirGain = C.createGain(); this.sirGain.gain.value = 0; this.sirGain.connect(this.sfx); const sir = C.createOscillator(); sir.type = 'sawtooth'; sir.frequency.value = 800; const lfo = C.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 0.75; const lg = C.createGain(); lg.gain.value = 320; lfo.connect(lg); lg.connect(sir.frequency); const sf = C.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 2200; sir.connect(sf); sf.connect(this.sirGain); sir.start(); lfo.start();
    // tyre screech
    this.scrGain = C.createGain(); this.scrGain.gain.value = 0; const src = C.createBufferSource(); src.buffer = nb; src.loop = true; const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 4; src.connect(bp); bp.connect(this.scrGain); this.scrGain.connect(this.sfx); src.start();
    // helicopter rotor
    this.heliGain = C.createGain(); this.heliGain.gain.value = 0; const hs = C.createBufferSource(); hs.buffer = nb; hs.loop = true; const hl = C.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 220; const hlfo = C.createOscillator(); hlfo.type = 'square'; hlfo.frequency.value = 14; const hg = C.createGain(); hg.gain.value = 0.5; const hgg = C.createGain(); hgg.gain.value = 0.5; hlfo.connect(hg); hg.connect(hgg.gain); hs.connect(hl); hl.connect(hgg); hgg.connect(this.heliGain); this.heliGain.connect(this.sfx); hs.start(); hlfo.start();
    // rain
    this.rainGain = C.createGain(); this.rainGain.gain.value = 0; const rs = C.createBufferSource(); rs.buffer = nb; rs.loop = true; const rf = C.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 3000; rs.connect(rf); rf.connect(this.rainGain); this.rainGain.connect(this.sfx); rs.start();
    this.enabled = true; this.startSequencer();
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }
  osc(type, f0, t0, dur, gain, o = {}) {
    const C = this.ctx; const os = C.createOscillator(); os.type = type; os.frequency.setValueAtTime(f0, t0); if (o.f1) os.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t0 + (o.fT || dur));
    const g = C.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + (o.a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = os; if (o.lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t0); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t0 + dur); f.Q.value = o.q || 1; os.connect(f); node = f; }
    node.connect(g); g.connect(o.dest || this.sfx); os.start(t0); os.stop(t0 + dur + 0.05);
  }
  noise(t0, dur, gain, o = {}) {
    const C = this.ctx; const s = C.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = o.rate || 1; let node = s;
    if (o.lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t0); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t0 + dur); node.connect(f); node = f; }
    if (o.hp) { const f = C.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; node.connect(f); node = f; }
    if (o.bp) { const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.q || 1; node.connect(f); node = f; }
    const g = C.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + (o.a || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); node.connect(g); g.connect(o.dest || this.sfx); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  // ---- one shots ----
  shot(type, dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = Math.max(0.05, 1 - dist / 90);
    if (type === 'pistol') { this.noise(t, 0.16, 0.7 * g, { lp: 3800, lp1: 400 }); this.osc('sine', 160, t, 0.12, 0.5 * g, { f1: 40 }); }
    else if (type === 'smg') { this.noise(t, 0.1, 0.5 * g, { lp: 3200, lp1: 500 }); this.osc('sine', 200, t, 0.08, 0.35 * g, { f1: 50 }); }
    else if (type === 'shotgun') { this.noise(t, 0.35, 1.0 * g, { lp: 2400, lp1: 200 }); this.osc('sine', 110, t, 0.25, 0.8 * g, { f1: 30 }); }
    else if (type === 'rifle') { this.noise(t, 0.14, 0.75 * g, { lp: 4500, lp1: 600 }); this.osc('sine', 180, t, 0.1, 0.5 * g, { f1: 45 }); }
    else if (type === 'punch') { this.noise(t, 0.08, 0.4, { lp: 900 }); this.osc('sine', 120, t, 0.09, 0.4, { f1: 60 }); } }
  explosion(dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = Math.max(0.1, 1 - dist / 160); this.noise(t, 1.6, 1.4 * g, { lp: 1400, lp1: 60, a: 0.01 }); this.osc('sine', 70, t, 1.2, 1.0 * g, { f1: 18 }); this.osc('triangle', 220, t, 0.4, 0.4 * g, { f1: 40 }); }
  impact(strength, dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = Math.min(1, strength / 14) * Math.max(0.1, 1 - dist / 80); this.noise(t, 0.2, 0.7 * g, { lp: 1200, lp1: 150 }); this.osc('sine', 90, t, 0.18, 0.6 * g, { f1: 35 }); if (strength > 9) this.noise(t + 0.02, 0.4, 0.3 * g, { hp: 2500 }); }
  horn(dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = Math.max(0.05, 1 - dist / 70); this.osc('square', 392, t, 0.45, 0.16 * g, { lp: 1800, a: 0.02 }); this.osc('square', 494, t, 0.45, 0.12 * g, { lp: 1800, a: 0.02 }); }
  pickup() { if (!this.enabled) return; const t = this.ctx.currentTime; this.osc('sine', NOTE(84), t, 0.18, 0.25); this.osc('sine', NOTE(91), t + 0.09, 0.3, 0.25); }
  cash() { if (!this.enabled) return; const t = this.ctx.currentTime; for (let i = 0; i < 3; i++) this.osc('triangle', NOTE(88 + i * 4), t + i * 0.06, 0.2, 0.2); }
  passed() { if (!this.enabled) return; const t = this.ctx.currentTime; [60, 64, 67, 72, 76].forEach((n, i) => { this.osc('sawtooth', NOTE(n), t + i * 0.12, 1.2, 0.12, { lp: 2400, a: 0.02 }); this.osc('triangle', NOTE(n + 12), t + i * 0.12, 0.9, 0.08); }); }
  failed() { if (!this.enabled) return; const t = this.ctx.currentTime; [67, 63, 60, 55].forEach((n, i) => this.osc('sawtooth', NOTE(n), t + i * 0.22, 0.9, 0.14, { lp: 1200, a: 0.03 })); }
  wanted() { if (!this.enabled) return; const t = this.ctx.currentTime; this.osc('square', 880, t, 0.12, 0.12, { lp: 3000 }); this.osc('square', 660, t + 0.14, 0.16, 0.12, { lp: 3000 }); }
  hurt() { if (!this.enabled) return; const t = this.ctx.currentTime; this.noise(t, 0.12, 0.4, { lp: 700 }); this.osc('sine', 200, t, 0.15, 0.3, { f1: 90 }); }
  click() { if (!this.enabled) return; const t = this.ctx.currentTime; this.noise(t, 0.04, 0.15, { hp: 2000 }); }
  // ---- continuous ----
  engine(on, speedNorm, throttle, maxSpeed) {
    if (!this.enabled) return; const t = this.ctx.currentTime;
    if (!on) { this.engGain.gain.setTargetAtTime(0, t, 0.1); return; }
    const gearSpan = 1 / 4.6; const inGear = speedNorm > 0.02 ? (speedNorm % gearSpan) / gearSpan : 0; const rpm = speedNorm > 0.02 ? 0.25 + inGear * 0.75 : 0.12 + Math.abs(throttle) * 0.35;
    const f = 52 + rpm * 240; this.eng1.frequency.setTargetAtTime(f, t, 0.05); this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    this.engFilter.frequency.setTargetAtTime(300 + rpm * 1400 + Math.abs(throttle) * 600, t, 0.08); this.engGain.gain.setTargetAtTime(0.10 + rpm * 0.12 + Math.abs(throttle) * 0.08, t, 0.08);
  }
  siren(level) { if (this.enabled) this.sirGain.gain.setTargetAtTime(Math.min(0.25, level * 0.25), this.ctx.currentTime, 0.15); }
  screech(level) { if (this.enabled) this.scrGain.gain.setTargetAtTime(Math.min(0.35, level * 0.35), this.ctx.currentTime, 0.05); }
  heli(level) { if (this.enabled) this.heliGain.gain.setTargetAtTime(Math.min(0.6, level * 0.6), this.ctx.currentTime, 0.2); }
  rain(level) { if (this.enabled) this.rainGain.gain.setTargetAtTime(level * 0.08, this.ctx.currentTime, 0.5); }

  // ---- radio ----
  setStation(id) { this.station = id; if (!this.enabled) return; this.music.gain.setTargetAtTime(id === 'off' ? 0 : 0.5, this.ctx.currentTime, 0.2); this.step = 0; this.nextT = this.ctx.currentTime + 0.05; }
  duck(v) { if (this.enabled && this.station !== 'off') this.music.gain.setTargetAtTime(0.5 * v, this.ctx.currentTime, 0.3); }
  startSequencer() { this.step = 0; this.nextT = this.ctx.currentTime; setInterval(() => this.tick(), 25); }
  tick() {
    if (this.station === 'off' || !this.ctx) return; const C = this.ctx; const bpm = { neon: 104, bass: 88, club: 126 }[this.station] || 100; const sd = 60 / bpm / 4;
    while (this.nextT < C.currentTime + 0.14) { this.playStep(this.station, this.step, this.nextT, sd); this.step++; this.nextT += sd; }
  }
  playStep(st, step, t, sd) {
    const s16 = step % 16, bar = Math.floor(step / 16), M = this.music;
    if (st === 'neon') {
      const chords = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]; const ch = chords[bar % 4];
      if (s16 % 4 === 0) { this.osc('sine', 150, t, 0.25, 0.9, { f1: 40, dest: M }); this.noise(t, 0.05, 0.2, { lp: 900, dest: M }); }
      if (s16 === 4 || s16 === 12) this.noise(t, 0.18, 0.5, { bp: 1800, q: 0.8, dest: M });
      if (s16 % 2 === 0) this.noise(t, 0.04, 0.16, { hp: 7000, dest: M });
      if (s16 % 2 === 0) this.osc('sawtooth', NOTE(ch[0] - 24), t, sd * 1.8, 0.28, { lp: 500, dest: M });
      const arp = ch[s16 % 3] + (s16 % 6 > 2 ? 12 : 0); this.osc('square', NOTE(arp), t, sd * 1.2, 0.07, { lp: 2600, lp1: 700, dest: M });
      if (s16 === 0) for (const n of ch) this.osc('triangle', NOTE(n), t, sd * 16, 0.05, { a: 0.4, dest: M });
      if (bar % 2 === 1 && s16 === 14) this.osc('sawtooth', NOTE(ch[2] + 12), t, sd * 4, 0.08, { lp: 1800, f1: NOTE(ch[1] + 12), fT: sd * 4, dest: M });
    } else if (st === 'bass') {
      const kick = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]; const scale = [45, 48, 50, 52, 55, 57, 60, 62];
      if (kick[s16]) { this.osc('sine', 120, t, 0.5, 1.0, { f1: 38, fT: 0.25, dest: M }); }
      if (snare[s16]) { this.noise(t, 0.22, 0.6, { bp: 2400, q: 0.7, dest: M }); this.osc('triangle', 220, t, 0.08, 0.3, { f1: 120, dest: M }); }
      if (s16 % 2 === 0 || (s16 % 4 === 3 && bar % 2)) this.noise(t, 0.03, 0.14, { hp: 8000, dest: M });
      if (s16 === 0 || s16 === 6 || s16 === 10) this.osc('sine', NOTE(scale[bar % 4 === 3 ? 2 : 0] - 12), t, sd * 5, 0.5, { lp: 300, dest: M });
      const r = Math.sin((bar * 16 + s16) * 12.9898) * 43758.5453; const rr = r - Math.floor(r);
      if (s16 % 2 === 1 && rr < 0.45) this.osc('triangle', NOTE(scale[Math.floor(rr * 8 * 2.2) % 8] + 12), t, sd * 2.5, 0.16, { lp: 2000, dest: M });
      if (s16 === 8 && bar % 4 === 2) this.osc('sawtooth', NOTE(scale[4] + 12), t, sd * 6, 0.08, { lp: 1400, dest: M });
    } else if (st === 'club') {
      const chords = [[53, 56, 60], [49, 53, 56], [56, 60, 63], [51, 55, 58]]; const ch = chords[bar % 4];
      if (s16 % 4 === 0) { this.osc('sine', 140, t, 0.32, 1.0, { f1: 42, fT: 0.12, dest: M }); this.noise(t, 0.03, 0.25, { lp: 1200, dest: M }); }
      if (s16 % 4 === 2) this.noise(t, 0.16, 0.22, { hp: 6000, dest: M }); else if (s16 % 2 === 1) this.noise(t, 0.03, 0.1, { hp: 9000, dest: M });
      if (s16 === 4 || s16 === 12) { this.noise(t, 0.12, 0.45, { bp: 1500, q: 1.2, dest: M }); this.noise(t + 0.02, 0.1, 0.3, { bp: 1800, q: 1.2, dest: M }); }
      if (s16 % 4 === 2) this.osc('sawtooth', NOTE(ch[0] - 24), t, sd * 1.7, 0.3, { lp: 380, dest: M });
      if ([0, 3, 6, 10, 13].includes(s16)) for (const n of ch) this.osc('sawtooth', NOTE(n + 12), t, sd * 1.4, 0.05, { lp: 2400, lp1: 500, dest: M });
      if (bar % 4 >= 2 && s16 % 2 === 0) this.osc('square', NOTE(ch[(s16 / 2) % 3] + 24), t, sd * 1.5, 0.045, { lp: 3000, dest: M });
    }
  }
}
