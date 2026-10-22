// All sound is synthesised with WebAudio: engine, siren, guns, explosions and three procedural radio stations.
//
// Mix graph
//   veh  (engine, siren, tyres, rotor, horns, crashes) -----------+
//   wpn  (guns, blasts, melee, grenades; `sfx` is its alias, the default destination of osc() / noise()) --+--> world --> muffle (lowpass) --> compressor --> master --> speakers
//   amb  (rain, ambience) --> ambLP --> ambDuck -------------------+                                             ^
//   music --> musicDuck ------------------------------------------+                                             |
//   ui   (clicks, stingers, hit cues, tinnitus) -----------------------------------------------------------------+   (never muffled, never ducked)
//
// Ambience (amb bus): city hum, wind, surf and fountain are continuous layers built once in init() and steered by ambience(s) every frame;
// birds, gulls, crickets and the distant events are scheduled from tick(). Footsteps (step, land) go through one panner into the wpn bus.
// People (release 3): the crowd murmur is a sixth continuous layer on the amb bus (murmur(level), steered by the crowd director in peds.js, with sparse distant voices scheduled from tick());
// voices (shout, laugh), phones (phoneRing), shops (chime, register), cameras (shutter) and the footsteps of other people (pedStep) are one-shots made from the same formant voice.
import { CITY } from './config.js';

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const OPEN = 20000; // muffle cutoff while nothing muffles the world
// Every level of the mix lives here.
const MIX = {
  music: 0.5, foot: 0.12,                                   // radio gain with a station on, and the share left while the player is on foot
  hear: 90,                                                 // metres over which a gunshot fades to its floor (0.05)
  trim: 0.6,                                                // master trim: the browser's compressor adds ~5 dB of automatic make-up gain, this keeps the overall level where it was
  comp: { threshold: -14, knee: 10, ratio: 6, attack: 0.003, release: 0.25 },
  menu: { cutoff: 550, world: 0.4, rain: 0.3, tau: 0.08 },  // pause / map / shop / title: dull, quiet world, rain at 0.3x
  fast: 0.025,                                              // time constant used to cut the looping sounds when a menu opens
  pump: { range: 15, music: 0.398, amb: 0.631, attack: 0.02, hold: 0.25, release: 0.08, gap: 0.12 }, // a blast or shot within 15 m dips music by 8 dB and ambience by 4 dB for ~0.5 s
  shock: { range: 12, cutoff: 300, delay: 0.08, hold: 0.3, recover: 2.5, ring: 3900, ringGain: 0.04, ringTime: 2.2 }, // an explosion within 12 m: muffled hearing that recovers over 2.5 s, and a ring
};
// Gun recipes. n = noise layers [duration, gain, options], o = tone layers [wave, Hz, duration, gain, options], tail = mechanical sound after the shot.
const GUNS = {
  pistol:   { n: [[0.16, 0.7, { lp: 3800, lp1: 400 }]], o: [['sine', 160, 0.12, 0.5, { f1: 40 }]], tail: 'click' },
  revolver: { n: [[0.28, 0.9, { lp: 3000, lp1: 280 }], [0.015, 0.4, { hp: 2200 }]], o: [['sine', 120, 0.2, 0.7, { f1: 32 }]], tail: 'click' },
  smg:      { n: [[0.1, 0.5, { lp: 3200, lp1: 500 }]], o: [['sine', 200, 0.08, 0.35, { f1: 50 }]] },
  shotgun:  { n: [[0.35, 1.0, { lp: 2400, lp1: 200 }]], o: [['sine', 110, 0.25, 0.8, { f1: 30 }]], tail: 'pump' },
  rifle:    { n: [[0.14, 0.75, { lp: 4500, lp1: 600 }]], o: [['sine', 180, 0.1, 0.5, { f1: 45 }]], tail: 'click' },
  sniper:   { n: [[0.01, 1.0, { hp: 1600 }], [0.55, 1.0, { lp: 2000, lp1: 120 }]], o: [['sine', 75, 0.4, 0.9, { f1: 25 }]] },
  punch:    { n: [[0.08, 0.4, { lp: 900 }]], o: [['sine', 120, 0.09, 0.4, { f1: 60 }]] },
};
const RELOAD_K = { revolver: 0.9, smg: 1.08, rifle: 0.86, sniper: 0.78 }; // pitch of the reload mechanics per weapon (default 1)
const gunGain = d => Math.max(0.05, 1 - (d || 0) / MIX.hear);
// Cancels what is scheduled on a param and pins it to its current value, so a new ramp starts from where the sound is now.
function hold(p, t) { p.cancelScheduledValues?.(t); p.setValueAtTime(p.value, t); }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const unit = v => v > 0 ? (v < 1 ? v : 1) : 0; // clamp to 0..1, and NaN to 0
// StereoPannerNode, or a plain gain with an inert pan on a browser that has none.
const NOPAN = { value: 0, setValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {} };
function mkPan(C) { if (C.createStereoPanner) return C.createStereoPanner(); const g = C.createGain(); g.pan = NOPAN; return g; }

// ---- ambience: every level of the soundscape ----
// The numbers from the design sit on the level nodes (humGain, windGain, surfGain, fountGain, crickGain). `trim` is a fixed make-up gain in front of a level node: a lowpassed or bandpassed
// noise source is far quieter than its nominal level, and these factors were measured with a small biquad simulation of the real filter chains so the layers sit near -33 dBFS.
const AMB = {
  eps: 2e-4, panEps: 0.01,        // a level is only rewritten when it moved by more than this
  stale: 1.5,                     // seconds without an ambience() call after which no new event is scheduled (title screen, pause)
  beachRamp: 40,                  // the beach mix starts this many metres inside the city and is complete at CITY.beachX
  hum:  { base: 0.04, car: 0.0025, maxCars: 40, beach: 0.7, night: 0.35, lp: 170, bp: 420, bpQ: 0.6, bpMix: 0.3, trim: 2 },
  wind: { base: 0.015, beach: 0.05, rain: 0.04, freq: 520, q: 0.8, gust: 0.75, lfo: [[0.07, 180, 0.18], [0.13, 90, 0.1]], trim: 3 }, // lfo: [rate Hz, sweep Hz, gust depth]
  surf: { range: 120, gain: 0.22, lp: 650, wave: 0.09, waveDepth: 0.85, swell: 0.037, swellDepth: 0.3, foamHp: 2500, foam: 0.3, trim: 1.1, panZone: 12 },
  fountain: { range: 22, gain: 0.06, bp: 1300, q: 0.5, hp: 4000, sparkle: 0.5, flutter: 6.3, trim: 1.5 },
  car: { cutoff: 650, gain: 0.35, tau: 0.15 },     // in a car the amb bus is a 650 Hz lowpass at 0.35
  bird: { rate: 0.4, parkRate: 1.5, near: 36, far: 70, maxNight: 0.35, maxRain: 0.3, syl: [2, 6], f: [2600, 5400], sweep: 0.35, dur: [0.035, 0.09], gain: 0.025, pan: 0.8 },
  gull: { rate: 0.2, gain: 0.03, pan: 0.8, vib: 7, vibDepth: 45 },
  cricket: { gain: 0.008, boost: 2, from: 0.55, ramp: 0.2, rain: 0.3, near: 45, f: [4200, 4450, 4700, 4900], am: [30, 31.5], gate: [2.7, 3.0, 3.2, 3.4], pan: 0.6 },
  far: { min: 18, max: 45, first: [8, 22], pan: 0.7, siren: 0.035, sirenLp: 900, dog: { osc: 0.06, noise: 0.15 }, horn: 0.03, plane: { rumble: 0.12, whine: 0.006 } },
};
// ---- footsteps: one recipe per surface ----
// Layers are [offset s, duration s, gain, options] (noise) and [offset s, wave, Hz, duration s, gain, options] (tone), relative to the step level. The gains are normalised (measured) so that every layer peaks
// near the step level. n2 / o2 are the finer details, skipped on the low tier. `grains` = tiny dry ticks of sand, full tiers only.
const FOOT = {
  walk: 0.06, sprint: 0.16, iWalk: 0.31,   // step level at walking pace (speedNorm 0.31) and at a full sprint
  pan: 0.12, pitch: 0.07,                  // alternating left / right, random pitch spread
  land: 0.16, landV: 8, landMin: 0.12, landMax: 1.6, wet: 0.6,
  rec: {
    concrete: { n: [[0, 0.022, 3.0, { bp: 1600, q: 1.3 }]], n2: [[0.028, 0.014, 1.4, { bp: 3400, q: 1.3 }]], o: [[0, 'sine', 85, 0.03, 0.9, {}]] },
    sand:     { n: [[0, 0.085, 3.0, { lp: 800, a: 0.012 }]], grains: 3 },
    grass:    { n: [[0, 0.07, 0.55, { hp: 2200, a: 0.014 }]], n2: [[0, 0.04, 5.0, { lp: 300 }]] },
    wood:     { n: [[0, 0.05, 2.7, { bp: 600, q: 1.5 }]], o: [[0, 'sine', 165, 0.08, 0.75, {}]], o2: [[0, 'sine', 330, 0.08, 0.4, {}]] },
  },
};

// ---- people: voices, crowd and shop sounds ----
// A voice is a sawtooth glottal source (pitch contour, vibrato) through three parallel formant bandpasses whose centres glide between two vowels, plus a breath of noise for consonants.
// Vowels are [F1, F2, F3] in Hz for an adult male; women and children scale them by `fem`. Levels are peak gains before the 0.6 master trim and sit well under a gunshot.
const VOW = { a: [800, 1150, 2900], e: [550, 1800, 2550], i: [300, 2250, 3000], o: [480, 850, 2700], u: [330, 780, 2500], ae: [690, 1680, 2600] };
const PEOPLE = {
  hear: 44, voice: 0.5,                                       // metres over which a voice fades to nothing (gain (1 - d / hear)^1.6); voice = overall level of the formant voice
  male: 118, fem: 214, femF: 1.13,                           // fundamental in Hz and the formant stretch of a shorter vocal tract
  formQ: [5, 7, 9], formG: [3.2, 2.4, 1.6],                  // bandpass Q and weight of the three formants (bandpass peak gain is 1, a sawtooth harmonic at a formant is only ~0.1)
  gap: 0.09,                                                 // seconds between two voices (a shout that comes too soon after another is dropped)
  murmur: { gain: 0.055, trim: 55, tau: 0.7, stale: 1.4, bands: [[380, 1.2, 0.55, 0.9], [760, 1.5, 0.5, 1.3], [1500, 1.8, 0.32, 1.9], [2900, 2.0, 0.12, 2.6]], voices: 0.4, voiceGain: 0.03, eps: 0.004 }, // bands: [centre Hz, Q, weight, babble LFO Hz]; voices: syllable phrases per second at level 1
  step: { range: 18, gain: 0.7, gap: 0.035 },                // other people's footsteps: audible within 16 m, at half the player's level, at most one voice per 35 ms
  phone: { gain: 0.07, f: [1318.5, 1568], beep: 0.055 },
  shop: { chime: 0.045, register: 0.04 },
};

export class AudioSys {
  constructor() {
    this.ctx = null; this.volume = 0.8; this.station = 'off'; this.enabled = false; this.quality = 'high';
    this.menu = false;        // a menu screen is up (set by setMenu)
    this.shouldRun = true;    // the page wants sound: a hidden tab that becomes visible only resumes the context when this is true
    this.missionDuck = 1;     // radio multiplier, 0.4 during a mission title card (set by Missions)
    this.musicBase = 1; this.musicLast = -1; this.rainLvl = 0; this.rainLast = -1; this.pumpT = -1e9;
    // ambience: ambS = the latest inputs of ambience(), ambLv = the levels computed from them, ambW = the value last written to each param (-1 = never)
    this.ambS = { on: false, t: 0, x: 0, night: 0, rain: 0, inCar: false, park: 1e9, beach: 0 };
    this.ambLv = { hum: 0, wind: 0, surf: 0, fountain: 0, cricket: 0 };
    this.ambW = { hum: -1, wind: -1, surf: -1, fountain: -1, cricket: -1, pan: 9 };
    this.ambCar = null; this.ambTickT = 0; this.farT = 0; this.footSide = 1;
    this.crickGain = null; this.footPan = null;
    this.murGain = null; this.murLv = 0; this.murT = -1e9; this.murW = -1; this.murVoiceT = 0; this.crowdPan = null; this.pedStepT = -1e9; this.voiceT = -1e9; this.shutterT = -1e9; this.ringT = -1e9;
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && this.shouldRun && !(typeof document !== 'undefined' && document.hidden)) this.ctx.resume(); return; }
    const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)(), cp = MIX.comp;
    // buses: master <- compressor <- muffle <- world <- veh / wpn / amb / music, with ui entering at the compressor
    this.master = C.createGain(); this.master.gain.value = this.volume * MIX.trim; this.master.connect(C.destination);
    const comp = this.comp = C.createDynamicsCompressor(); comp.threshold.value = cp.threshold; comp.knee.value = cp.knee; comp.ratio.value = cp.ratio; comp.attack.value = cp.attack; comp.release.value = cp.release; comp.connect(this.master);
    const muffle = this.muffle = C.createBiquadFilter(); muffle.type = 'lowpass'; muffle.Q.value = 0.5; muffle.frequency.value = this.menu ? MIX.menu.cutoff : OPEN; muffle.connect(comp);
    const world = this.world = C.createGain(); world.gain.value = this.menu ? MIX.menu.world : 1; world.connect(muffle);
    this.veh = C.createGain(); this.veh.connect(world);
    this.wpn = this.sfx = C.createGain(); this.wpn.connect(world);
    this.ambDuck = C.createGain(); this.ambDuck.connect(world); this.ambLP = C.createBiquadFilter(); this.ambLP.type = 'lowpass'; this.ambLP.frequency.value = OPEN; this.ambLP.connect(this.ambDuck); this.amb = C.createGain(); this.amb.connect(this.ambLP);
    this.musicDuck = C.createGain(); this.musicDuck.connect(world); this.music = C.createGain(); this.music.gain.value = 0; this.music.connect(this.musicDuck);
    this.ui = C.createGain(); this.ui.connect(comp);
    const nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    // engine
    this.engGain = C.createGain(); this.engGain.gain.value = 0; this.engFilter = C.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 600; this.engFilter.connect(this.engGain); this.engGain.connect(this.veh);
    this.eng1 = C.createOscillator(); this.eng1.type = 'sawtooth'; this.eng1.frequency.value = 80; this.eng1.connect(this.engFilter); this.eng1.start();
    this.eng2 = C.createOscillator(); this.eng2.type = 'square'; this.eng2.frequency.value = 40; const g2 = C.createGain(); g2.gain.value = 0.5; this.eng2.connect(g2); g2.connect(this.engFilter); this.eng2.start();
    // siren
    this.sirGain = C.createGain(); this.sirGain.gain.value = 0; this.sirGain.connect(this.veh); const sir = C.createOscillator(); sir.type = 'sawtooth'; sir.frequency.value = 800; const lfo = C.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 0.75; const lg = C.createGain(); lg.gain.value = 320; lfo.connect(lg); lg.connect(sir.frequency); const sf = C.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 2200; sir.connect(sf); sf.connect(this.sirGain); sir.start(); lfo.start();
    // tyre screech
    this.scrGain = C.createGain(); this.scrGain.gain.value = 0; const src = C.createBufferSource(); src.buffer = nb; src.loop = true; const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 4; src.connect(bp); bp.connect(this.scrGain); this.scrGain.connect(this.veh); src.start();
    // helicopter rotor
    this.heliGain = C.createGain(); this.heliGain.gain.value = 0; const hs = C.createBufferSource(); hs.buffer = nb; hs.loop = true; const hl = C.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 220; const hlfo = C.createOscillator(); hlfo.type = 'square'; hlfo.frequency.value = 14; const hg = C.createGain(); hg.gain.value = 0.5; const hgg = C.createGain(); hgg.gain.value = 0.5; hlfo.connect(hg); hg.connect(hgg.gain); hs.connect(hl); hl.connect(hgg); hgg.connect(this.heliGain); this.heliGain.connect(this.veh); hs.start(); hlfo.start();
    // rain
    this.rainGain = C.createGain(); this.rainGain.gain.value = 0; const rs = C.createBufferSource(); rs.buffer = nb; rs.loop = true; const rf = C.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 3000; rs.connect(rf); rf.connect(this.rainGain); this.rainGain.connect(this.amb); rs.start();
    // footsteps: one panner, flipped left / right by step()
    this.footPan = mkPan(C); this.footPan.connect(this.wpn);
    this.buildAmbience(C);
    // a hidden tab stops the whole context and a visible one restarts it
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => this.onVisibility());
    this.enabled = true; this.startSequencer();
  }
  // ---- ambience ----
  // A looping source of `buf` starting `offset` s into it, optionally wired to `to`. Used for the continuous layers and for the long distant events.
  loopSrc(buf, offset, rate, to, when = 0) {
    const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; if (to) s.connect(to); s.start(when, offset); return s;
  }
  // The continuous layers. Everything is created here, once; ambience() only moves gains, so the node count never grows with play time.
  buildAmbience(C) {
    const A = AMB, amb = this.amb, rate = C.sampleRate;
    const gain = (v, to) => { const g = C.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
    const filt = (type, f, q, to) => { const n = C.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; if (to) n.connect(to); return n; };
    const osc = f => { const o = C.createOscillator(); o.frequency.value = f; o.start(); return o; };
    const mod = (src, depth, param) => { const g = gain(depth, param); src.connect(g); return g; }; // src * depth is added to param
    // brown noise b = (b + 0.02 w) / 1.02, x3.5: 4 s long, and the tail is cross-faded into the head (equal power) so that the loop point is continuous
    const len = Math.round(rate * 4), fade = Math.round(rate * 0.25), raw = new Float32Array(len + fade); let b = 0;
    for (let i = 0; i < raw.length; i++) { b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02; raw[i] = b * 3.5; }
    const brown = this.brownBuf = C.createBuffer(1, len, rate), bd = brown.getChannelData(0); bd.set(raw.subarray(0, len));
    for (let i = 0; i < fade; i++) { const a = i / fade * Math.PI / 2; bd[i] = raw[i] * Math.sin(a) + raw[len + i] * Math.cos(a); }
    const white = this.ambWhite = this.loopSrc(this.noiseBuf, 0.37, 1); // shared by the wind, the fountain and the surf foam: their bands do not overlap
    // 1) city hum: brown -> lowpass 170, plus 30% of the same through a bandpass at 420
    const H = A.hum, hs = this.loopSrc(brown, 0.3, 1);
    this.humGain = gain(0, amb); const humTrim = gain(H.trim, this.humGain);
    hs.connect(filt('lowpass', H.lp, 0.7, humTrim)); hs.connect(filt('bandpass', H.bp, H.bpQ, gain(H.bpMix, humTrim)));
    // 2) wind: white -> bandpass (Q 0.8, 520 Hz) swept by two slow LFOs, whose gusts also move its level
    const W = A.wind; this.windGain = gain(0, amb);
    const gust = gain(W.gust, gain(W.trim, this.windGain)), wbp = filt('bandpass', W.freq, W.q, gust); white.connect(wbp);
    for (const [f, sweep, depth] of W.lfo) { const o = osc(f); mod(o, sweep, wbp.frequency); mod(o, depth, gust.gain); }
    // 3) surf: two brown sources -> lowpass 650 -> a gain that follows a slow LFO through y = max(0, x)^3 (a swell and a long lull), plus white foam (highpass 2.5 kHz) on the same envelope
    const S = A.surf; this.surfGain = gain(0, null); this.surfPan = mkPan(C); this.surfGain.connect(this.surfPan); this.surfPan.connect(amb);
    const env = gain(0, this.surfGain), foam = gain(0, gain(S.foam, this.surfGain)), slp = filt('lowpass', S.lp, 0.7, gain(S.trim, env));
    this.loopSrc(brown, 1.3, 0.94, slp); this.loopSrc(brown, 2.6, 1.07, slp);
    white.connect(filt('highpass', S.foamHp, 0.7, foam));
    const shaper = C.createWaveShaper(), curve = new Float32Array(257); for (let i = 0; i < curve.length; i++) { const x = i / (curve.length - 1) * 2 - 1; curve[i] = x > 0 ? x * x * x : 0; }
    shaper.curve = curve; shaper.connect(env.gain); shaper.connect(foam.gain);
    const wave = osc(S.wave), swell = osc(S.swell); wave.connect(gain(S.waveDepth, shaper)); swell.connect(gain(S.swellDepth, shaper)); // the second, slower LFO makes the sets of waves uneven
    // 4) fountain: bandpass 1.3 kHz Q 0.5 plus a fluttering highpass sparkle
    const F = A.fountain; this.fountGain = gain(0, amb);
    white.connect(filt('bandpass', F.bp, F.q, gain(F.trim, this.fountGain)));
    const sparkle = gain(0.65, gain(F.sparkle, this.fountGain)); white.connect(filt('highpass', F.hp, 0.7, sparkle)); mod(osc(F.flutter), 0.3, sparkle.gain);
    this.ambTickT = C.currentTime; this.farT = A.far.first[0] + Math.random() * (A.far.first[1] - A.far.first[0]);
  }
  // Crickets are built on the first night that needs them (never on the low tier): 4 sine voices x 30 Hz AM x a 2.7-3.4 Hz chirp gate.
  buildCrickets() {
    const C = this.ctx, K = AMB.cricket, level = this.crickGain = C.createGain(); level.gain.value = 0; level.connect(this.amb);
    const panL = mkPan(C), panR = mkPan(C); panL.pan.value = -K.pan; panR.pan.value = K.pan; panL.connect(level); panR.connect(level);
    const curve = new Float32Array(65); for (let i = 0; i < curve.length; i++) { const x = i / (curve.length - 1) * 2 - 1; curve[i] = clamp((x - 0.1) * 4, 0, 1); } // the chirp is on while the gate LFO is above 0.1
    const ams = K.am.map(f => { const o = C.createOscillator(); o.frequency.value = f; o.start(); const d = C.createGain(); d.gain.value = 0.5; o.connect(d); return d; }); // two AM LFOs, each shared by two voices
    for (let i = 0; i < K.f.length; i++) {
      const car = C.createOscillator(); car.type = 'sine'; car.frequency.value = K.f[i];
      const am = C.createGain(); am.gain.value = 0.5; ams[i >> 1].connect(am.gain);                     // 0.5 + 0.5 sin(2 pi 30 t)
      const g = C.createGain(); g.gain.value = 0; const sh = C.createWaveShaper(); sh.curve = curve; sh.connect(g.gain);
      const lfo = C.createOscillator(); lfo.frequency.value = K.gate[i]; lfo.connect(sh);
      car.connect(am); am.connect(g); g.connect(i < 2 ? panL : panR); car.start(); lfo.start();
    }
  }
  // Timers in a hidden tab are throttled to 1 Hz, so the radio would stutter; suspending also stops the loops that keep running for nobody.
  onVisibility() {
    const C = this.ctx; if (!C) return; const settle = p => { if (p && p.catch) p.catch(() => {}); };
    try { if (document.hidden) settle(C.suspend()); else if (this.shouldRun) settle(C.resume()); } catch { /* an offline context cannot be suspended without a time */ }
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v * MIX.trim, this.ctx.currentTime, 0.05); }
  // ---- mix control ----
  ramp(p, v, t, tau) { hold(p, t); p.setTargetAtTime(v, t, tau); }
  // Pause / map / shop / title: the world goes dull and quiet, nothing that loops in it keeps running, and the rain thins out. ui sounds are untouched.
  setMenu(on) {
    this.menu = !!on; if (!this.enabled) return; const t = this.ctx.currentTime, m = MIX.menu;
    this.ramp(this.muffle.frequency, this.menu ? m.cutoff : OPEN, t, m.tau); this.ramp(this.world.gain, this.menu ? m.world : 1, t, m.tau);
    if (this.menu) { this.engine(false); this.screech(0); this.heli(0); this.siren(0); }
    this.applyRain(true);
  }
  // Radio level: station on x (in a car 1, on foot 0.12) x missionDuck. The pump (musicDuck) multiplies it on top.
  musicFor(inCar) { this.musicBase = inCar ? 1 : MIX.foot; this.applyMusic(0.3); }
  duck(v) { this.musicBase = v; this.applyMusic(0.3); } // legacy entry point: v is the in-car / on-foot factor directly
  applyMusic(tau) {
    if (!this.enabled) return; const target = this.station === 'off' ? 0 : MIX.music * this.musicBase * this.missionDuck;
    if (Math.abs(target - this.musicLast) < 0.002) return; this.musicLast = target; this.music.gain.setTargetAtTime(target, this.ctx.currentTime, tau);
  }
  applyRain(force) {
    if (!this.enabled) return; const target = this.rainLvl * 0.08 * (this.menu ? MIX.menu.rain : 1);
    if (!force && Math.abs(target - this.rainLast) < 5e-5) return; this.rainLast = target; this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, this.menu ? MIX.menu.tau : 0.5);
  }
  // Sidechain-style dip of the radio (-8 dB) and ambience (-4 dB) around a nearby shot or blast. Re-arming is rate limited, so a burst of fire holds one dip.
  pump(t) { const P = MIX.pump; if (t - this.pumpT < P.gap) return; this.pumpT = t; this.dip(this.musicDuck.gain, P.music, t); this.dip(this.ambDuck.gain, P.amb, t); }
  dip(p, depth, t) { const P = MIX.pump, h = t + P.hold; hold(p, t); p.linearRampToValueAtTime(depth, t + P.attack); p.setValueAtTime(depth, h); p.setTargetAtTime(1, h, P.release); }
  // Explosion within 12 m: hearing drops to 300 Hz and recovers exponentially over 2.5 s while a 3.9 kHz ring fades on the ui bus.
  shellShock(t) {
    const S = MIX.shock; if (this.menu) return; const f = this.muffle.frequency, a = t + S.hold;
    hold(f, t); f.setTargetAtTime(S.cutoff, t + S.delay, 0.03); f.setValueAtTime(S.cutoff, a); f.exponentialRampToValueAtTime(OPEN, a + S.recover);
    if (this.quality !== 'low') this.osc('sine', S.ring, t, S.ringTime, S.ringGain, { dest: this.ui, a: 0.05 });
  }
  osc(type, f0, t0, dur, gain, o = {}) {
    const C = this.ctx, k = o.k || 1; const os = C.createOscillator(); os.type = type; os.frequency.setValueAtTime(f0 * k, t0); if (o.f1) os.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1 * k), t0 + (o.fT || dur));
    const g = C.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + (o.a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = os; if (o.lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp * k, t0); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1 * k, t0 + dur); f.Q.value = o.q || 1; os.connect(f); node = f; }
    node.connect(g); g.connect(o.dest || this.sfx); os.start(t0); os.stop(t0 + dur + 0.05);
  }
  // options: lp / lp1 (lowpass, optionally swept), hp, bp / bp1 / q (bandpass, optionally swept), k (pitch multiplier of every filter), dest, a (attack)
  noise(t0, dur, gain, o = {}) {
    const C = this.ctx, k = o.k || 1, rate = o.rate || 1; const s = C.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = rate; let node = s;
    if (o.lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp * k, t0); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1 * k, t0 + dur); node.connect(f); node = f; }
    if (o.hp) { const f = C.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp * k; node.connect(f); node = f; }
    if (o.bp) { const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp * k; if (o.bp1) { f.frequency.setValueAtTime(o.bp * k, t0); f.frequency.exponentialRampToValueAtTime(o.bp1 * k, t0 + dur); } f.Q.value = o.q || 1; node.connect(f); node = f; }
    const g = C.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + (o.a || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); node.connect(g); g.connect(o.dest || this.sfx);
    s.start(t0, Math.random() * Math.max(0, 1.95 - (dur + 0.05) * rate)); s.stop(t0 + dur + 0.05); // a random start inside the 2 s buffer, so repeated hits never sound identical
  }
  // ---- one shots ----
  // Unknown ids sound like the pistol. Every shot is humanised: pitch x0.94-1.06 and gain x0.85-1.0.
  shot(type, dist = 0) {
    if (!this.enabled) return; const t = this.ctx.currentTime, g = gunGain(dist) * (0.85 + Math.random() * 0.15), k = 0.94 + Math.random() * 0.12, gun = GUNS[type] || GUNS.pistol, full = this.quality !== 'low';
    for (const [dur, a, o] of gun.n) this.noise(t, dur, a * g, { ...o, k });
    for (const [wave, f, dur, a, o] of gun.o) this.osc(wave, f, t, dur, a * g, { ...o, k });
    if (full && gun.tail === 'click') this.noise(t + 0.06, 0.012, 0.1 * g, { hp: 4000, k });                  // the action cycling
    else if (full && gun.tail === 'pump') { this.noise(t + 0.32, 0.05, 1.0 * g, { bp: 2200, q: 2, k }); this.noise(t + 0.42, 0.05, 1.2 * g, { bp: 2200, q: 2, k }); } // shotgun pump
    if (dist < MIX.pump.range) this.pump(t);
  }
  explosion(dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = Math.max(0.1, 1 - dist / 160); this.noise(t, 1.6, 1.4 * g, { lp: 1400, lp1: 60, a: 0.01 }); this.osc('sine', 70, t, 1.2, 1.0 * g, { f1: 18 }); this.osc('triangle', 220, t, 0.4, 0.4 * g, { f1: 40 });
    if (dist < MIX.pump.range) this.pump(t); if (dist < MIX.shock.range) this.shellShock(t); }
  impact(strength, dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = Math.min(1, strength / 14) * Math.max(0.1, 1 - dist / 80), V = this.veh; this.noise(t, 0.2, 0.7 * g, { lp: 1200, lp1: 150, dest: V }); this.osc('sine', 90, t, 0.18, 0.6 * g, { f1: 35, dest: V }); if (strength > 9) this.noise(t + 0.02, 0.4, 0.3 * g, { hp: 2500, dest: V }); }
  horn(dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = Math.max(0.05, 1 - dist / 70), V = this.veh; this.osc('square', 392, t, 0.45, 0.16 * g, { lp: 1800, a: 0.02, dest: V }); this.osc('square', 494, t, 0.45, 0.12 * g, { lp: 1800, a: 0.02, dest: V }); }
  pickup() { if (!this.enabled) return; const t = this.ctx.currentTime, U = this.ui; this.osc('sine', NOTE(84), t, 0.18, 0.25, { dest: U }); this.osc('sine', NOTE(91), t + 0.09, 0.3, 0.25, { dest: U }); }
  cash() { if (!this.enabled) return; const t = this.ctx.currentTime, U = this.ui; for (let i = 0; i < 3; i++) this.osc('triangle', NOTE(88 + i * 4), t + i * 0.06, 0.2, 0.2, { dest: U }); }
  passed() { if (!this.enabled) return; const t = this.ctx.currentTime, U = this.ui; [60, 64, 67, 72, 76].forEach((n, i) => { this.osc('sawtooth', NOTE(n), t + i * 0.12, 1.2, 0.12, { lp: 2400, a: 0.02, dest: U }); this.osc('triangle', NOTE(n + 12), t + i * 0.12, 0.9, 0.08, { dest: U }); }); }
  failed() { if (!this.enabled) return; const t = this.ctx.currentTime, U = this.ui; [67, 63, 60, 55].forEach((n, i) => this.osc('sawtooth', NOTE(n), t + i * 0.22, 0.9, 0.14, { lp: 1200, a: 0.03, dest: U })); }
  wanted() { if (!this.enabled) return; const t = this.ctx.currentTime, U = this.ui; this.osc('square', 880, t, 0.12, 0.12, { lp: 3000, dest: U }); this.osc('square', 660, t + 0.14, 0.16, 0.12, { lp: 3000, dest: U }); }
  hurt() { if (!this.enabled) return; const t = this.ctx.currentTime; this.noise(t, 0.12, 0.4, { lp: 700 }); this.osc('sine', 200, t, 0.15, 0.3, { f1: 90 }); }
  click() { if (!this.enabled) return; const t = this.ctx.currentTime; this.noise(t, 0.04, 0.15, { hp: 2000, dest: this.ui }); }
  // ---- weapons, melee, hit feedback (every method takes an optional distance that scales its gain like shot()) ----
  // Whoosh of a swing: a bandpass sweep, lower and louder for the bat. kind: 'fist' | 'bat'.
  swing(kind = 'fist', dist = 0) {
    if (!this.enabled) return; const t = this.ctx.currentTime, g = gunGain(dist);
    if (kind === 'bat') this.noise(t, 0.2, 0.85 * g, { bp: 380, bp1: 1300, q: 0.9, a: 0.06 }); else this.noise(t, 0.16, 0.5 * g, { bp: 500, bp1: 1800, q: 0.9, a: 0.05 });
  }
  // A melee blow that landed: fist = dull body thump, bat = wooden thock.
  meleeHit(kind = 'fist', dist = 0) {
    if (!this.enabled) return; const t = this.ctx.currentTime, g = gunGain(dist);
    if (kind === 'bat') { this.osc('sine', 240, t, 0.14, 0.7 * g, { f1: 140, a: 0.002 }); this.noise(t, 0.07, 2.6 * g, { bp: 900, q: 4 }); }
    else { this.noise(t, 0.08, 1.3 * g, { lp: 600 }); this.osc('sine', 110, t, 0.1, 0.6 * g, { f1: 60 }); }
  }
  // Magazine out, magazine in, slide; the shotgun takes shells one by one (0.2 s apart) and pumps. Fits the 1.2 s reload.
  reload(id, dist = 0) {
    if (!this.enabled) return; const t = this.ctx.currentTime, g = gunGain(dist) * 0.45;
    if (id === 'shotgun') {
      for (let i = 0; i < 4; i++) { const ti = t + 0.12 + i * 0.2; this.noise(ti, 0.03, 2.0 * g, { bp: 2600, q: 3 }); this.osc('triangle', 900, ti, 0.05, 0.25 * g, { f1: 500 }); }
      this.noise(t + 0.92, 0.05, 1.8 * g, { bp: 2200, q: 2 }); this.noise(t + 1.02, 0.05, 2.1 * g, { bp: 2200, q: 2 }); return;
    }
    const k = RELOAD_K[id] || 1;
    this.noise(t + 0.12, 0.02, 0.4 * g, { hp: 3000, k });                                                        // magazine out
    this.noise(t + 0.7, 0.06, 2.2 * g, { bp: 1600, q: 1.5, k }); this.osc('sine', 210, t + 0.7, 0.07, 0.4 * g, { f1: 110, k }); // magazine in
    this.noise(t + 1.0, 0.09, 1.8 * g, { bp: 900, bp1: 2400, q: 1.2, k }); this.noise(t + 1.07, 0.015, 0.5 * g, { hp: 3500, k }); // slide
  }
  // Trigger pulled on an empty weapon.
  dry(dist = 0) { if (!this.enabled) return; const t = this.ctx.currentTime, g = gunGain(dist); this.noise(t, 0.01, 0.25 * g, { hp: 3000 }); this.noise(t + 0.004, 0.04, 1.8 * g, { bp: 5000, q: 20 }); }
  // Where a bullet landed: type 'world' (chip, sometimes a ricochet), 'vehicle' (metal tink) or 'ped' (thud). d = distance from the listener.
  bulletImpact(type, d = 0) {
    if (!this.enabled) return; const t = this.ctx.currentTime, g = gunGain(d), k = 0.95 + Math.random() * 0.1;
    if (type === 'vehicle') { this.osc('sine', 1100, t, 0.18, 0.2 * g, { k, a: 0.001 }); this.osc('sine', 2700, t, 0.18, 0.12 * g, { k, a: 0.001 }); this.osc('sine', 4300, t, 0.18, 0.07 * g, { k, a: 0.001 }); this.noise(t, 0.015, 0.4 * g, { hp: 3000 }); }
    else if (type === 'ped') { this.noise(t, 0.05, 2.0 * g, { lp: 450 }); this.osc('sine', 95, t, 0.09, 0.5 * g, { f1: 55 }); }
    else { this.noise(t, 0.025, 1.2 * g, { bp: 2800, q: 3, k }); if (this.quality !== 'low' && Math.random() < 0.2) this.osc('sine', 3400, t + 0.01, 0.28, 0.06 * g, { f1: 1200 }); }
  }
  // Hit confirmation for the player's own shots (ui bus: always clear). kind: 'hit' | 'head' | 'kill'.
  hit(kind = 'hit', dist = 0) {
    if (!this.enabled) return; const t = this.ctx.currentTime, g = gunGain(dist), U = this.ui;
    this.osc('square', 2600, t, 0.035, 0.05 * g, { dest: U, a: 0.002 });
    if (kind === 'head') this.osc('sine', 3800, t, 0.06, 0.05 * g, { dest: U, a: 0.002 });
    else if (kind === 'kill') { this.noise(t, 0.08, 0.9 * g, { lp: 400, dest: U }); this.osc('sine', 180, t, 0.12, 0.25 * g, { f1: 70, dest: U }); }
  }
  // A grenade bouncing off something; speed = impact speed in m/s.
  clank(speed = 4, dist = 0) {
    if (!this.enabled) return; const t = this.ctx.currentTime, s = Math.min(1, Math.max(0.15, speed / 10)), g = gunGain(dist);
    this.noise(t, 0.12, 2.6 * s * g, { bp: 1900, q: 6 }); this.osc('sine', 1900, t, 0.1, 0.1 * s * g, { f1: 1700 });
  }
  // ---- continuous ----
  engine(on, speedNorm, throttle, maxSpeed) {
    if (!this.enabled) return; const t = this.ctx.currentTime;
    if (!on || this.menu) { this.engGain.gain.setTargetAtTime(0, t, this.menu ? MIX.fast : 0.1); return; }
    const gearSpan = 1 / 4.6; const inGear = speedNorm > 0.02 ? (speedNorm % gearSpan) / gearSpan : 0; const rpm = speedNorm > 0.02 ? 0.25 + inGear * 0.75 : 0.12 + Math.abs(throttle) * 0.35;
    const f = 52 + rpm * 240; this.eng1.frequency.setTargetAtTime(f, t, 0.05); this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    this.engFilter.frequency.setTargetAtTime(300 + rpm * 1400 + Math.abs(throttle) * 600, t, 0.08); this.engGain.gain.setTargetAtTime(0.10 + rpm * 0.12 + Math.abs(throttle) * 0.08, t, 0.08);
  }
  // In a menu every looping world sound is held at 0 (and cut with a short time constant when the menu opens).
  siren(level) { if (this.enabled) this.sirGain.gain.setTargetAtTime(this.menu ? 0 : Math.min(0.25, level * 0.25), this.ctx.currentTime, this.menu ? MIX.fast : 0.15); }
  screech(level) { if (this.enabled) this.scrGain.gain.setTargetAtTime(this.menu ? 0 : Math.min(0.35, level * 0.35), this.ctx.currentTime, this.menu ? MIX.fast : 0.05); }
  heli(level) { if (this.enabled) this.heliGain.gain.setTargetAtTime(this.menu ? 0 : Math.min(0.6, level * 0.6), this.ctx.currentTime, this.menu ? MIX.fast : 0.2); }
  rain(level) { this.rainLvl = level; this.applyRain(false); }

  // ---- ambience ----
  // Called every frame with s = { x, z, night, rain, inCar, cars, park (metres to the nearest park centre), rightX (x of the camera's right vector), quality }.
  // It only moves levels of nodes that already exist (a level is written when it moved by more than AMB.eps) and records the inputs the event scheduler in tick() reads.
  // The computed levels stay readable in ambLv: { hum, wind, surf, fountain, cricket }.
  ambience(s) {
    if (!this.enabled || !s) return;
    const C = this.ctx, A = AMB, S = this.ambS, L = this.ambLv;
    if (s.quality) this.quality = s.quality;
    const x = +s.x || 0, night = unit(+s.night), rain = unit(+s.rain), cars = clamp(+s.cars || 0, 0, A.hum.maxCars), park = s.park >= 0 ? +s.park : 1e9, inCar = !!s.inCar, rightX = clamp(+s.rightX || 0, -1, 1);
    const beach = clamp((x - (CITY.beachX - A.beachRamp)) / A.beachRamp, 0, 1);
    S.on = true; S.t = C.currentTime; S.x = x; S.night = night; S.rain = rain; S.inCar = inCar; S.park = park; S.beach = beach;
    L.hum = (A.hum.base + A.hum.car * cars) * (1 - A.hum.beach * beach) * (1 - A.hum.night * night);
    L.wind = A.wind.base + A.wind.beach * beach + A.wind.rain * rain;
    L.surf = clamp(1 - Math.abs(x - CITY.oceanX) / A.surf.range, 0, 1) * A.surf.gain;
    L.fountain = clamp(1 - park / A.fountain.range, 0, 1) * A.fountain.gain;
    const K = A.cricket; L.cricket = this.quality === 'low' || inCar ? 0 : K.gain * (park < K.near || beach > 0.5 ? K.boost : 1) * unit((night - K.from) / K.ramp) * unit(1 - rain / K.rain);
    if (L.cricket > 0 && !this.crickGain) this.buildCrickets();
    this.put('hum', this.humGain.gain, L.hum, A.eps); this.put('wind', this.windGain.gain, L.wind, A.eps);
    this.put('surf', this.surfGain.gain, L.surf, A.eps); this.put('fountain', this.fountGain.gain, L.fountain, A.eps);
    if (this.crickGain) this.put('cricket', this.crickGain.gain, L.cricket, A.eps / 10);
    // The sea is on the +x side of the beach, so it sits on the camera's right when rightX > 0. Beyond the shore (the pier) it flips, and on the shoreline it is all around.
    this.put('pan', this.surfPan.pan, rightX * clamp((CITY.oceanX - x) / A.surf.panZone, -1, 1), A.panEps);
    if (inCar !== this.ambCar) { // in a car the whole ambience bus is a 650 Hz lowpass at 0.35
      const first = this.ambCar === null, t = C.currentTime, f = inCar ? A.car.cutoff : OPEN, g = inCar ? A.car.gain : 1; this.ambCar = inCar;
      if (first) { this.ambLP.frequency.value = f; this.amb.gain.value = g; } else { this.ambLP.frequency.setTargetAtTime(f, t, A.car.tau); this.amb.gain.setTargetAtTime(g, t, A.car.tau); }
    }
  }
  // Writes a level to its param unless it is within eps of what is already there (and always writes an exact 0, so a layer can be silent).
  put(key, p, v, eps) { const W = this.ambW; if (Math.abs(v - W[key]) <= eps && !(v === 0 && W[key] !== 0)) return; W[key] = v; p.value = v; }
  // Event layers, called from tick() every 25 ms: Poisson birds (gulls on the beach) by day and the one distant event every 18-45 s. Crickets are a continuous layer and live in ambience().
  ambTick() {
    const C = this.ctx, S = this.ambS, A = AMB; if (this.murGain && this.murLv > 0 && C.currentTime - this.murT > PEOPLE.murmur.stale) { this.murLv = 0; this.applyMurmur(true); } // nobody feeds murmur() any more: the crowd fades away
    if (!S.on || this.menu) return;
    const t = C.currentTime, dt = Math.min(0.1, t - this.ambTickT); this.ambTickT = t;
    if (!(dt > 0) || t - S.t > A.stale) return; // a suspended context does not advance, a stale state means nobody is feeding ambience()
    const half = this.quality === 'low' ? 0.5 : 1;
    if (!S.inCar && S.night < A.bird.maxNight && S.rain < A.bird.maxRain) {
      if (S.beach > 0.5) { if (Math.random() < A.gull.rate * half * dt) this.gull(t + 0.02); }
      else { const near = unit((A.bird.far - S.park) / (A.bird.far - A.bird.near)); if (Math.random() < (A.bird.rate + (A.bird.parkRate - A.bird.rate) * near) * half * dt) this.bird(t + 0.02); }
    }
    if (this.murLv > 0.25 && !S.inCar && Math.random() < PEOPLE.murmur.voices * this.murLv * half * dt) this.farVoice(t + 0.03); // a snatch of conversation somewhere in the crowd
    this.farT -= dt; if (this.farT <= 0) { this.farT = A.far.min + Math.random() * (A.far.max - A.far.min); this.distant(t + 0.05); }
  }
  // One bird call: 2-6 syllables of a sine at 2.6-5.4 kHz, each a 35-90 ms chirp that sweeps up or down by up to 35%. A single oscillator and gain carry the whole call.
  bird(t) {
    const C = this.ctx, B = AMB.bird, os = C.createOscillator(), g = C.createGain(), p = mkPan(C), n = B.syl[0] + Math.floor(Math.random() * (B.syl[1] - B.syl[0] + 1)), vol = B.gain * (0.6 + Math.random() * 0.4);
    let f = B.f[0] + Math.random() * (B.f[1] - B.f[0]), ti = t; p.pan.value = (Math.random() * 2 - 1) * B.pan;
    for (let i = 0; i < n; i++) {
      const d = B.dur[0] + Math.random() * (B.dur[1] - B.dur[0]);
      os.frequency.setValueAtTime(f, ti); os.frequency.exponentialRampToValueAtTime(f * (1 + (Math.random() * 2 - 1) * B.sweep), ti + d);
      g.gain.setValueAtTime(0.0001, ti); g.gain.linearRampToValueAtTime(vol, ti + d * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, ti + d);
      ti += d + 0.025 + Math.random() * 0.055; f = clamp(f * (0.85 + Math.random() * 0.3), B.f[0], B.f[1]);
    }
    os.connect(g); g.connect(p); p.connect(this.amb); os.start(t); os.stop(ti + 0.05);
  }
  // One to three gull cries: a triangle gliding 1.1 -> 1.5 -> 0.8 kHz over 0.35 s with a 7 Hz vibrato.
  gull(t) {
    const C = this.ctx, G = AMB.gull, os = C.createOscillator(), lfo = C.createOscillator(), vd = C.createGain(), g = C.createGain(), p = mkPan(C), n = 1 + Math.floor(Math.random() * 3), vol = G.gain * (0.6 + Math.random() * 0.4);
    let k = 0.9 + Math.random() * 0.2, ti = t; os.type = 'triangle'; lfo.frequency.value = G.vib; vd.gain.value = G.vibDepth; lfo.connect(vd); vd.connect(os.frequency); p.pan.value = (Math.random() * 2 - 1) * G.pan;
    for (let i = 0; i < n; i++) {
      os.frequency.setValueAtTime(1100 * k, ti); os.frequency.linearRampToValueAtTime(1500 * k, ti + 0.1); os.frequency.linearRampToValueAtTime(800 * k, ti + 0.35);
      g.gain.setValueAtTime(0.0001, ti); g.gain.linearRampToValueAtTime(vol, ti + 0.04); g.gain.linearRampToValueAtTime(vol * 0.6, ti + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.35);
      ti += 0.5 + Math.random() * 0.25; k *= 0.96;
    }
    os.connect(g); g.connect(p); p.connect(this.amb); os.start(t); lfo.start(t); os.stop(ti); lfo.stop(ti);
  }
  // A faint event far away: a lowpassed siren wail, a dog, a car horn or (by day) a plane. In a car only the low ones are worth making.
  distant(t) {
    const C = this.ctx, S = this.ambS, F = AMB.far, p = mkPan(C), r = Math.random(); p.pan.value = (Math.random() * 2 - 1) * F.pan; p.connect(this.amb);
    let kind = r < 0.3 ? 'siren' : r < 0.55 ? 'dog' : r < 0.8 ? 'horn' : 'plane';
    if (S.inCar && (kind === 'dog' || kind === 'horn')) kind = 'plane';
    if (kind === 'plane' && (S.night > 0.5 || S.rain > 0.4)) kind = 'siren'; // planes are a daytime thing
    if (kind === 'siren') this.farSiren(t, p); else if (kind === 'dog') this.farDog(t, p); else if (kind === 'horn') this.farHorn(t, p); else this.farPlane(t, p);
  }
  farSiren(t, p) {
    const C = this.ctx, F = AMB.far, dur = 5 + Math.random() * 3, os = C.createOscillator(), lp = C.createBiquadFilter(), g = C.createGain(), k = 0.9 + Math.random() * 0.2, half = 1.1 + Math.random() * 0.4, a = p.pan.value;
    os.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = F.sirenLp; lp.Q.value = 0.7; os.frequency.setValueAtTime(650 * k, t);
    for (let ti = t + half, hi = true; ti < t + dur + half; ti += half, hi = !hi) os.frequency.linearRampToValueAtTime((hi ? 1000 : 650) * k, ti); // the wail goes up and down
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(F.siren, t + 1.6); g.gain.setValueAtTime(F.siren, t + dur - 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    p.pan.setValueAtTime(a, t); p.pan.linearRampToValueAtTime(-a * 0.8, t + dur); // it drives past
    os.connect(lp); lp.connect(g); g.connect(p); os.start(t); os.stop(t + dur + 0.1);
  }
  farDog(t, p) {
    const D = AMB.far.dog, n = 2 + Math.floor(Math.random() * 3), k = 0.75 + Math.random() * 0.6; let ti = t;
    for (let i = 0; i < n; i++) { const v = 0.8 + Math.random() * 0.2; this.osc('sawtooth', 380 * k, ti, 0.14, D.osc * v, { f1: 240 * k, lp: 1500, lp1: 600, a: 0.01, dest: p }); this.noise(ti, 0.1, D.noise * v, { bp: 900, bp1: 500, q: 1.5, k, dest: p }); ti += 0.26 + Math.random() * 0.16; }
  }
  farHorn(t, p) {
    const F = AMB.far, n = 1 + Math.floor(Math.random() * 2), k = 0.85 + Math.random() * 0.3;
    for (let i = 0; i < n; i++) { const ti = t + i * 0.5; this.osc('square', 392 * k, ti, 0.34, F.horn, { lp: 900, a: 0.03, dest: p }); this.osc('square', 494 * k, ti, 0.34, F.horn * 0.8, { lp: 900, a: 0.03, dest: p }); }
  }
  // A plane crossing: lowpassed brown noise whose cutoff falls as it passes, a thin turbine whine on top, panning across the sky over 11-16 s.
  farPlane(t, p) {
    const C = this.ctx, P = AMB.far.plane, dur = 11 + Math.random() * 5, mid = t + dur * (0.4 + Math.random() * 0.2), a = p.pan.value;
    const lp = C.createBiquadFilter(), g = C.createGain(), src = this.loopSrc(this.brownBuf, Math.random() * 3, 0.85 + Math.random() * 0.3, lp, t);
    lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.setValueAtTime(420, t); lp.frequency.linearRampToValueAtTime(260, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(P.rumble, mid); g.gain.linearRampToValueAtTime(0.0001, t + dur); lp.connect(g); g.connect(p);
    const w = C.createOscillator(), wg = C.createGain(); w.type = 'triangle'; w.frequency.setValueAtTime(640, t); w.frequency.linearRampToValueAtTime(520, t + dur);
    wg.gain.setValueAtTime(0.0001, t); wg.gain.linearRampToValueAtTime(P.whine, mid); wg.gain.linearRampToValueAtTime(0.0001, t + dur); w.connect(wg); wg.connect(p);
    p.pan.setValueAtTime(a, t); p.pan.linearRampToValueAtTime(-a, t + dur);
    w.start(t); w.stop(t + dur + 0.1); src.stop(t + dur + 0.1);
  }

  // ---- footsteps ----
  // One foot contact. surf: 'concrete' | 'sand' | 'grass' | 'wood' (anything else sounds like concrete). intensity: Player.speedNorm, 0.31 walking to 1 sprinting, which sets the level from 0.06 to 0.16.
  // wet: rain on the ground adds a splash. Pitch varies by 7% and the pan alternates between the feet (+-0.12).
  step(surf, intensity = 0.4, wet = false) {
    if (!this.enabled || this.menu) return; const F = FOOT, t = this.ctx.currentTime, i = unit(+intensity);
    let g = F.walk + (F.sprint - F.walk) * unit((i - F.iWalk) / (1 - F.iWalk)); if (i < F.iWalk) g *= 0.6 + 0.4 * i / F.iWalk;
    this.footSide = -this.footSide; this.footPan.pan.setValueAtTime(this.footSide * F.pan, t);
    this.footVoice(surf, g, wet, t, 1 + (Math.random() * 2 - 1) * F.pitch);
  }
  // Landing from a jump or a fall: a lowpassed thud, then both feet (the second 35 ms later and softer). v = impact speed in m/s, the level is proportional to v / 8.
  land(surf, v = 6, wet = false) {
    if (!this.enabled || this.menu) return; const F = FOOT, t = this.ctx.currentTime, s = clamp((+v || 0) / F.landV, F.landMin, F.landMax), g = F.land * s, k = 1 + (Math.random() * 2 - 1) * F.pitch;
    this.footPan.pan.setValueAtTime(0, t);
    this.noise(t, 0.12, 7.0 * g, { lp: 400, k, dest: this.footPan }); this.osc('sine', 70, t, 0.15, 0.8 * g, { f1: 40, k, dest: this.footPan });
    this.footVoice(surf, g, wet, t, k); this.footVoice(surf, g * 0.8, false, t + 0.035, k * 1.03);
  }
  // Plays the layers of one surface recipe at level g, pitch k and time t.
  footVoice(surf, g, wet, t, k, dest) {
    const R = FOOT.rec[surf] || FOOT.rec.concrete, d = dest || this.footPan, full = this.quality !== 'low';
    for (const [off, dur, a, o] of R.n) this.noise(t + off, dur, a * g, { ...o, k, dest: d });
    if (R.o) for (const [off, wave, f, dur, a, o] of R.o) this.osc(wave, f, t + off, dur, a * g, { ...o, k, dest: d });
    if (full) {
      if (R.n2) for (const [off, dur, a, o] of R.n2) this.noise(t + off, dur, a * g, { ...o, k, dest: d });
      if (R.o2) for (const [off, wave, f, dur, a, o] of R.o2) this.osc(wave, f, t + off, dur, a * g, { ...o, k, dest: d });
      if (R.grains) for (let i = 0; i < R.grains; i++) this.noise(t + 0.012 + Math.random() * 0.06, 0.006, 0.3 * g, { hp: 4000, k, dest: d });
    }
    if (wet) this.noise(t + 0.004, 0.045, FOOT.wet * g, { hp: 3000, k, dest: d });
  }

  // ---- people: voices, phones, shops, cameras, the crowd ----
  // Level of a voice at distance d: (1 - d / hear)^1.6, 0 beyond the range.
  vox(d) { const x = 1 - (+d || 0) / PEOPLE.hear; return x > 0 ? Math.pow(x, 1.6) : 0; }
  // One voiced syllable at time t. o: dur, f = pitch contour [start, peak at 40%, end] in Hz, v = [vowel, vowel at the end], gain (peak), fem (1 = shorter vocal tract), vib (depth as a fraction of the pitch) at vibHz,
  // rough (Hz of an amplitude flutter: growl, scream), breath (noise gain, aspirated sound), att, pan, lp (cutoff of the distance filter), dest (default: the sfx bus).
  syl(t, o) {
    const C = this.ctx, P = PEOPLE, k = o.fem ? P.femF : 1, dur = o.dur, f = o.f, full = this.quality !== 'low', v0 = VOW[o.v[0]], v1 = VOW[o.v[1] || o.v[0]], att = o.att || 0.022, vg = o.gain * P.voice;
    const src = C.createOscillator(), mix = C.createGain(), env = C.createGain(), pan = mkPan(C); src.type = 'sawtooth'; pan.pan.value = o.pan || 0;
    src.frequency.setValueAtTime(f[0], t); src.frequency.linearRampToValueAtTime(f[1], t + dur * 0.4); src.frequency.linearRampToValueAtTime(f[2], t + dur);
    if (o.vib && full) { const l = C.createOscillator(), d = C.createGain(); l.frequency.value = o.vibHz || 5.8; d.gain.value = f[1] * o.vib; l.connect(d); d.connect(src.frequency); l.start(t); l.stop(t + dur + 0.05); }
    for (let i = 0; i < (full ? 3 : 2); i++) { const bp = C.createBiquadFilter(), g = C.createGain(); bp.type = 'bandpass'; bp.Q.value = P.formQ[i]; bp.frequency.setValueAtTime(v0[i] * k, t); bp.frequency.linearRampToValueAtTime(v1[i] * k, t + dur * 0.9); g.gain.value = P.formG[i]; src.connect(bp); bp.connect(g); g.connect(mix); }
    let head = mix; if (o.rough && full) { const am = C.createGain(), l = C.createOscillator(), d = C.createGain(); am.gain.value = 0.62; l.frequency.value = o.rough; d.gain.value = 0.38; l.connect(d); d.connect(am.gain); l.start(t); l.stop(t + dur + 0.05); mix.connect(am); head = am; }
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(vg, t + att); env.gain.linearRampToValueAtTime(vg * 0.8, t + dur * 0.65); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    head.connect(env); let tail = env; if (o.lp) { const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; lp.Q.value = 0.5; env.connect(lp); tail = lp; }
    tail.connect(pan); pan.connect(o.dest || this.sfx); if (o.breath) this.noise(t, dur, o.breath * P.voice, { bp: 2300 * k, q: 0.7, dest: pan });
    src.start(t); src.stop(t + dur + 0.05);
  }
  // A person's voice. kind: 'hey' | 'whoa' | 'oh' | 'ugh' | 'scream' | 'angry' | 'help' | 'yell'; dist = metres from the listener; pan -1..1; fem = true / false (random when omitted).
  // Quiet by design (peak 0.15-0.2 before the master trim, a pistol is 0.7) and gone beyond 44 m.
  shout(kind = 'hey', dist = 0, pan = 0, fem) {
    if (!this.enabled || this.menu) return; const P = PEOPLE, t = this.ctx.currentTime + 0.01, g = this.vox(dist); if (g < 0.02 || t - this.voiceT < P.gap) return; this.voiceT = t;
    if (fem === undefined) fem = Math.random() < 0.45; const f0 = (fem ? P.fem : P.male) * (0.9 + Math.random() * 0.22), o = { fem: fem ? 1 : 0, pan: clamp(+pan || 0, -1, 1), lp: Math.max(1500, 7500 - dist * 150) };
    switch (kind) {
      case 'whoa': this.syl(t, { ...o, dur: 0.5, f: [f0 * 0.95, f0 * 1.3, f0 * 0.88], v: ['o', 'a'], gain: 0.15 * g, vib: 0.012, breath: 0.03 * g }); break;
      case 'oh': this.syl(t, { ...o, dur: 0.22, f: [f0 * 1.2, f0 * 1.25, f0 * 0.95], v: ['o', 'o'], gain: 0.14 * g }); break;
      case 'ugh': this.syl(t, { ...o, dur: 0.22, f: [f0 * 1.1, f0 * 0.85, f0 * 0.62], v: ['a', 'u'], gain: 0.16 * g, rough: 55, breath: 0.05 * g }); break;
      case 'scream': { const s = (fem ? 520 : 330) * (0.9 + Math.random() * 0.25), d = 0.8 + Math.random() * 0.35; this.syl(t, { ...o, dur: d, f: [s * 0.9, s * 1.32, s * 1.1], v: ['a', 'ae'], gain: 0.13 * g, vib: 0.035, vibHz: 6.5, rough: 38, breath: 0.1 * g, att: 0.03 }); break; }
      case 'angry': this.syl(t, { ...o, dur: 0.38, f: [f0 * 0.95, f0 * 1.12, f0 * 0.82], v: ['a', 'o'], gain: 0.17 * g, rough: 68, breath: 0.04 * g }); break;
      case 'help': this.syl(t, { ...o, dur: 0.2, f: [f0 * 1.25, f0 * 1.4, f0 * 1.3], v: ['e', 'e'], gain: 0.15 * g }); this.syl(t + 0.24, { ...o, dur: 0.34, f: [f0 * 1.45, f0 * 1.4, f0 * 1.05], v: ['e', 'u'], gain: 0.16 * g, vib: 0.02, breath: 0.03 * g }); break;
      case 'yell': this.syl(t, { ...o, dur: 0.5, f: [f0 * 1.05, f0 * 1.4, f0 * 1.2], v: ['a', 'e'], gain: 0.16 * g, vib: 0.015, rough: 50 }); break;
      default: this.syl(t, { ...o, dur: 0.3, f: [f0 * 0.95, f0 * 1.28, f0 * 1.05], v: ['e', 'i'], gain: 0.15 * g, breath: 0.05 * g }); // 'hey'
    }
  }
  // Laughter: four to six "ha"s that fall in pitch and fade, each preceded by a puff of breath.
  laugh(dist = 0, pan = 0, fem, dest) {
    if (!this.enabled || this.menu) return; const P = PEOPLE, g = this.vox(dist); if (g < 0.02) return; if (fem === undefined) fem = Math.random() < 0.5;
    const t0 = this.ctx.currentTime + 0.02, n = 4 + Math.floor(Math.random() * 3), f0 = (fem ? P.fem : P.male) * (1.15 + Math.random() * 0.2), o = { fem: fem ? 1 : 0, pan: clamp(+pan || 0, -1, 1), lp: Math.max(1500, 7500 - dist * 150), dest };
    for (let i = 0; i < n; i++) { const t = t0 + i * (0.165 + Math.random() * 0.03), a = 1 - i / (n + 1), last = i === n - 1; this.syl(t, { ...o, dur: last ? 0.2 : 0.1, f: [f0 * (1.1 - 0.06 * i), f0 * (1.15 - 0.06 * i), f0 * (0.95 - 0.06 * i)], v: ['a', last ? 'e' : 'a'], gain: 0.13 * g * a, breath: 0.07 * g * a, att: 0.012 }); }
  }
  // A ringtone heard from dist metres: two bursts of four triangle beeps alternating between E6 and G6.
  phoneRing(dist = 0, pan = 0) {
    if (!this.enabled || this.menu) return; const P = PEOPLE.phone, g = this.vox((+dist || 0) * 0.8); if (g < 0.02) return; const t = this.ctx.currentTime + 0.02; if (t - this.ringT < 0.5) return; this.ringT = t;
    const pn = mkPan(this.ctx); pn.pan.value = clamp(+pan || 0, -1, 1); pn.connect(this.sfx);
    for (let r = 0; r < 2; r++) for (let b = 0; b < 4; b++) { const ti = t + r * 0.85 + b * 0.115; this.osc('triangle', P.f[b % 2], ti, P.beep, P.gain * g, { a: 0.004, lp: 4200, dest: pn }); this.osc('sine', P.f[b % 2] * 2, ti, P.beep, P.gain * g * 0.25, { a: 0.004, dest: pn }); }
  }
  // A bell: inharmonic partials with their own decays. Used by the shop door chime and the till.
  bell(t, f, gain, dur, dest) { for (const [m, a, d] of [[1, 1, 1], [2.76, 0.38, 0.55], [5.4, 0.16, 0.3], [8.9, 0.06, 0.18]]) this.osc('sine', f * m, t, dur * d, gain * a, { a: 0.002, dest }); }
  // The chime over a shop door (two notes, E5 then C5). dist: metres from the door (omit for the player's own door: it then plays on the ui bus).
  chime(dist) {
    if (!this.enabled) return; const near = !(dist > 0.5), g = near ? 1 : this.vox(dist * 0.9); if (g < 0.02) return; const t = this.ctx.currentTime + 0.01, D = near ? this.ui : this.sfx, A = PEOPLE.shop.chime * g;
    this.bell(t, NOTE(88), A, 1.1, D); this.bell(t + 0.3, NOTE(84), A * 0.9, 1.5, D);
  }
  // The till: a drawer thunk, a bright bell and the drawer sliding shut. dist omitted: the player's own transaction (ui bus).
  register(dist) {
    if (!this.enabled) return; const near = !(dist > 0.5), g = near ? 1 : this.vox(dist * 0.9); if (g < 0.02) return; const t = this.ctx.currentTime + 0.01, D = near ? this.ui : this.sfx, A = PEOPLE.shop.register * g;
    this.noise(t, 0.03, A * 3, { bp: 2200, q: 3, dest: D }); this.osc('triangle', 190, t, 0.07, A * 2, { f1: 80, dest: D });
    this.bell(t + 0.09, 2093, A * 0.55, 0.75, D); this.bell(t + 0.12, 3136, A * 0.35, 0.6, D);
    this.noise(t + 0.62, 0.11, A * 2.2, { hp: 1600, lp: 5000, a: 0.03, dest: D }); this.noise(t + 0.74, 0.02, A * 2.4, { bp: 1400, q: 2, dest: D });
  }
  // A camera shutter heard from dist metres: the mirror slap and the curtain, 70 ms apart.
  shutter(dist = 0, pan = 0) {
    if (!this.enabled || this.menu) return; const g = this.vox((+dist || 0) * 0.7), t = this.ctx.currentTime + 0.01; if (g < 0.03 || t - this.shutterT < 0.3) return; this.shutterT = t;
    const pn = mkPan(this.ctx); pn.pan.value = clamp(+pan || 0, -1, 1); pn.connect(this.sfx);
    this.noise(t, 0.014, 0.22 * g, { hp: 2500, dest: pn }); this.osc('square', 1700, t, 0.02, 0.012 * g, { f1: 700, dest: pn }); this.noise(t + 0.07, 0.025, 0.14 * g, { bp: 1300, q: 1.5, dest: pn });
  }
  // The footstep of somebody else: surf as in step(), dist in metres, pan -1..1, intensity 0.3 (strolling) .. 1 (sprinting). At most one voice per 35 ms, audible within 16 m.
  pedStep(surf, dist = 0, pan = 0, intensity = 0.4, wet = false) {
    if (!this.enabled || this.menu) return; const P = PEOPLE.step, t = this.ctx.currentTime; if (!(dist < P.range) || t - this.pedStepT < P.gap) return; this.pedStepT = t;
    const F = FOOT, i = unit(+intensity), x = 1 - dist / P.range, g = (F.walk + (F.sprint - F.walk) * unit((i - F.iWalk) / (1 - F.iWalk))) * P.gain * x * x; if (g < 0.0015) return;
    const pn = mkPan(this.ctx); pn.pan.value = clamp(+pan || 0, -1, 1); pn.connect(this.wpn); this.footVoice(surf, g, wet, t, 1 + (Math.random() * 2 - 1) * FOOT.pitch, pn);
  }
  // ---- the crowd ----
  // murmur(level): level 0..1 is how crowded the player's surroundings are (peds.js computes it ten times a second). Call it again within 1.4 s or it fades out.
  murmur(level) {
    if (!this.enabled) return; this.murLv = unit(+level); this.murT = this.ctx.currentTime; if (this.murLv > 0 && !this.murGain) this.buildMurmur(); this.applyMurmur(false);
  }
  // A bed of babble: white noise through four formant-ish bands whose levels each wander on two incommensurate slow LFOs, on the amb bus (so a car lowpasses it and a menu ducks it).
  buildMurmur() {
    const C = this.ctx, M = PEOPLE.murmur, out = this.murGain = C.createGain(); out.gain.value = 0; out.connect(this.amb); const src = this.loopSrc(this.noiseBuf, 0.71, 1);
    for (const [fc, q, w, hz] of M.bands) {
      const bp = C.createBiquadFilter(), g = C.createGain(); bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = q; g.gain.value = w * 0.5 * M.trim; src.connect(bp); bp.connect(g); g.connect(out);
      for (const [r, dep] of [[hz, 0.4], [hz * 0.37 + 0.11, 0.25]]) { const l = C.createOscillator(), d = C.createGain(); l.frequency.value = r; d.gain.value = w * dep * M.trim; l.connect(d); d.connect(g.gain); l.start(); }
    }
  }
  applyMurmur(force) {
    if (!this.murGain) return; const M = PEOPLE.murmur, tgt = M.gain * this.murLv * (this.quality === 'low' ? 0.8 : 1); if (!force && Math.abs(tgt - this.murW) < M.gain * M.eps && !(tgt === 0 && this.murW !== 0)) return;
    this.murW = tgt; this.murGain.gain.setTargetAtTime(tgt, this.ctx.currentTime, M.tau);
  }
  // A phrase of distant, indistinct talk (two to five syllables, lowpassed, panned anywhere) scheduled from ambTick() while the murmur is up.
  farVoice(t) {
    const P = PEOPLE, M = P.murmur, fem = Math.random() < 0.5, f0 = (fem ? P.fem : P.male) * (0.9 + Math.random() * 0.25), n = 2 + Math.floor(Math.random() * 4), pan = (Math.random() * 2 - 1) * 0.8, vs = ['a', 'e', 'o', 'i', 'u', 'ae'], vol = M.voiceGain * (0.6 + Math.random() * 0.4);
    let ti = t; for (let i = 0; i < n; i++) { const d = 0.09 + Math.random() * 0.12, a = vs[Math.floor(Math.random() * vs.length)], b = vs[Math.floor(Math.random() * vs.length)], p = f0 * (0.9 + Math.random() * 0.3);
      this.syl(ti, { dur: d, f: [p, p * (1 + Math.random() * 0.15), p * (0.85 + Math.random() * 0.2)], v: [a, b], gain: vol, fem: fem ? 1 : 0, pan, lp: 1500, dest: this.amb, att: 0.015 }); ti += d + 0.03 + Math.random() * 0.09; }
    if (Math.random() < 0.12) this.laugh(32 + Math.random() * 12, pan, fem, this.amb);
  }

  // ---- radio ----
  setStation(id) { this.station = id; if (!this.enabled) return; this.musicLast = -1; this.applyMusic(0.2); this.seq = 0; this.nextT = this.ctx.currentTime + 0.05; }
  startSequencer() { this.seq = 0; this.nextT = this.ctx.currentTime; setInterval(() => this.tick(), 25); }
  tick() {
    if (!this.ctx) return; this.ambTick(); // the ambient events run with the radio off too
    if (this.station === 'off') return; const C = this.ctx; const bpm = { neon: 104, bass: 88, club: 126 }[this.station] || 100; const sd = 60 / bpm / 4;
    if (this.nextT < C.currentTime - 0.05) this.nextT = C.currentTime + 0.02; // the timer fell behind (hidden tab, long frame): drop the backlog instead of playing it all at once
    while (this.nextT < C.currentTime + 0.14) { this.playStep(this.station, this.seq, this.nextT, sd); this.seq++; this.nextT += sd; }
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
