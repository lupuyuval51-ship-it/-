'use strict';
/* BlockRealm — procedural WebAudio: material sounds, ambience (wind, birds, crickets), mobs. */

const MATERIAL_SOUND = {
  stone: { type: 'bandpass', f: 1700, q: 1.1, dur: 0.11, g: 0.5, thump: 110 },
  dirt: { type: 'bandpass', f: 620, q: 0.8, dur: 0.13, g: 0.55, thump: 80 },
  grass: { type: 'bandpass', f: 2300, q: 0.6, dur: 0.14, g: 0.4 },
  sand: { type: 'highpass', f: 2600, q: 0.5, dur: 0.17, g: 0.35 },
  snow: { type: 'lowpass', f: 2200, q: 0.4, dur: 0.18, g: 0.4, crunch: true },
  wood: { type: 'bandpass', f: 420, q: 3.2, dur: 0.1, g: 0.6, thump: 170 },
  glass: { type: 'highpass', f: 3500, q: 0.7, dur: 0.09, g: 0.3, ping: true },
  cloth: { type: 'lowpass', f: 1100, q: 0.5, dur: 0.12, g: 0.45 },
  water: { type: 'lowpass', f: 900, q: 0.7, dur: 0.3, g: 0.4 },
};

class Sound {
  constructor() { this.ctx = null; this.volume = 0.7; this.birdT = 3; this.cricketT = 2; this.amb = { day: 1, night: 0, outdoor: 1, underwater: false, alt: 64 }; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const ctx = this.ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.volume;
    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000;
    this.master.connect(this.lp); this.lp.connect(ctx.destination);
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    const wind = ctx.createBufferSource(); wind.buffer = buf; wind.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 380; wf.Q.value = 0.6;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
    wind.connect(wf); wf.connect(this.windGain); this.windGain.connect(this.master);
    wind.start();
    this.windFilter = wf;
    const rain = ctx.createBufferSource(); rain.buffer = buf; rain.loop = true; rain.playbackRate.value = 0.83;
    const rh = ctx.createBiquadFilter(); rh.type = 'highpass'; rh.frequency.value = 900;
    const rl = ctx.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 6500;
    this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0;
    rain.connect(rh); rh.connect(rl); rl.connect(this.rainGain); this.rainGain.connect(this.master);
    rain.start();
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  burst(m, gain = 1, rate = 1, pan = 0) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = rate;
    const f = ctx.createBiquadFilter(); f.type = m.type; f.frequency.value = m.f * rate; f.Q.value = m.q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(m.g * gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + m.dur);
    let out = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); out = p; }
    src.connect(f); f.connect(g); out.connect(this.master);
    src.start(t, Math.random() * 1.5, m.dur + 0.05);
    if (m.crunch) for (let i = 1; i < 3; i++) this.later(i * 0.04, () => this.burst({ ...m, crunch: false, dur: 0.05, g: m.g * 0.6 }, gain, rate * 1.1, pan));
    if (m.thump) this.tone(m.thump * rate, 0.07, 0.25 * gain, 'sine', 0.5);
    if (m.ping) for (let i = 0; i < 3; i++) this.later(i * 0.025, () => this.tone(2600 + Math.random() * 2400, 0.12, 0.06 * gain, 'sine', 1));
  }
  later(s, fn) { setTimeout(fn, s * 1000); }
  tone(freq, dur, gain, type = 'sine', slide = 1, pan = 0, when = 0) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    o.connect(g); out.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  material(id) { return MATERIAL_SOUND[(BLOCKS[id] && BLOCKS[id].sound) || 'stone'] || MATERIAL_SOUND.stone; }
  dig(id) { this.burst(this.material(id), 1, 0.9 + Math.random() * 0.2); }
  hitTick(id) { this.burst(this.material(id), 0.45, 1.1 + Math.random() * 0.2); }
  place(id) { this.burst(this.material(id), 0.8, 0.75 + Math.random() * 0.1); }
  step(id) { if (id) this.burst(this.material(id), 0.28, 0.9 + Math.random() * 0.3); }
  hurt() { this.tone(240, 0.16, 0.25, 'square', 0.45); this.burst(MATERIAL_SOUND.cloth, 0.6, 0.6); }
  splash() { this.burst({ type: 'lowpass', f: 1400, q: 0.6, dur: 0.5, g: 0.6 }, 1, 0.8); }
  pop() { this.tone(520, 0.08, 0.12, 'sine', 1.8); }
  click() { this.tone(900, 0.04, 0.06, 'triangle', 0.8); }
  eat() { for (let i = 0; i < 3; i++) this.later(i * 0.12, () => this.burst(MATERIAL_SOUND.dirt, 0.5, 1.3)); }
  mob(type, dist, hurt) {
    const g = 0.22 / (1 + dist * 0.18) * (hurt ? 1.3 : 1), up = hurt ? 1.35 : 1;
    if (type === 'pig') { this.tone(260 * up, 0.18, g, 'sawtooth', 0.7); this.tone(330 * up, 0.12, g * 0.6, 'square', 0.6, 0, 0.16); }
    else if (type === 'cow') this.tone(120 * up, 0.9, g * 1.1, 'sawtooth', 0.78);
    else if (type === 'sheep') { const o = this.tone(310 * up, 0.55, g, 'sawtooth', 0.9); this.vibrato(o, 16, 30); }
    else if (type === 'zombie') { const o = this.tone(90 * up, 1.0, g * 1.2, 'sawtooth', 0.75); this.vibrato(o, 5, 12); }
  }
  vibrato(o, rate, depth) {
    if (!o) return;
    const ctx = this.ctx, l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(o.frequency);
    l.start(); l.stop(ctx.currentTime + 1.2);
  }
  chirp() {
    const pan = Math.random() * 1.6 - 0.8, base = 2400 + Math.random() * 1600, n = 2 + ((Math.random() * 5) | 0);
    for (let i = 0; i < n; i++) this.tone(base * (0.9 + Math.random() * 0.25), 0.07 + Math.random() * 0.05, 0.035, 'sine', 1.35 + Math.random() * 0.3, pan, i * (0.09 + Math.random() * 0.05));
  }
  crickets() {
    const pan = Math.random() * 1.6 - 0.8;
    for (let i = 0; i < 6; i++) this.tone(4300 + Math.random() * 300, 0.025, 0.012, 'square', 1, pan, i * 0.045);
  }
  ambience(dt, a) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const windLvl = a.underwater ? 0 : (0.012 + clamp((a.alt - 60) / 60, 0, 1) * 0.05) * a.outdoor * (0.75 + 0.25 * Math.sin(t * 0.37) * Math.sin(t * 0.13));
    this.windGain.gain.setTargetAtTime(windLvl * (1 + (a.rain || 0)), t, 0.5);
    this.rainGain.gain.setTargetAtTime(a.underwater ? 0 : (a.rain || 0) * 0.14 * (0.3 + 0.7 * a.outdoor), t, 0.6);
    this.lp.frequency.setTargetAtTime(a.underwater ? 650 : 20000, t, 0.08);
    this.birdT -= dt; this.cricketT -= dt;
    if (this.birdT <= 0) { this.birdT = 2 + Math.random() * 6; if (a.day > 0.6 && a.outdoor > 0.6 && !a.underwater && !(a.rain > 0.2)) this.chirp(); }
    if (this.cricketT <= 0) { this.cricketT = 0.6 + Math.random() * 2.2; if (a.night > 0.5 && a.outdoor > 0.5 && !a.underwater) this.crickets(); }
  }
}
