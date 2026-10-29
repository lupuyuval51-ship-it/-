/* EXIT 8 — procedural sound with the Web Audio API (no audio files). */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});

  E.createAudio = function () {
    let ctx = null, master = null, outGain = null, noiseBuf = null, rumble = null, hum = null, drone = null, started = false;
    let volume = 0.8;

    function init() {
      if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      started = true;
      outGain = ctx.createGain();
      outGain.gain.value = volume;
      outGain.connect(ctx.destination);
      master = ctx.createGain(); // every sound goes in here: dry to the output, plus a send into the tunnel reverb
      master.connect(outGain);
      const irLen = Math.floor(ctx.sampleRate * 1.7), ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3.2);
      }
      const conv = ctx.createConvolver(); conv.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = 0.32;
      master.connect(conv); conv.connect(wet); wet.connect(outGain);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.6 + last * 3; }

      // Ambience: mains hum, fluorescent buzz and ventilation air.
      hum = ctx.createGain(); hum.gain.value = 1; hum.connect(master);
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 50;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
      const g1 = ctx.createGain(); g1.gain.value = 0.035;
      o1.connect(lp); lp.connect(g1); g1.connect(hum); o1.start();
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 100;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 6;
      const g2 = ctx.createGain(); g2.gain.value = 0.006;
      o2.connect(bp); bp.connect(g2); g2.connect(hum); o2.start();
      const air = ctx.createBufferSource(); air.buffer = noiseBuf; air.loop = true;
      const alp = ctx.createBiquadFilter(); alp.type = 'lowpass'; alp.frequency.value = 520;
      const ag = ctx.createGain(); ag.gain.value = 0.05;
      air.connect(alp); alp.connect(ag); ag.connect(hum); air.start();

      // Red-wave rumble, silent until needed.
      const rs = ctx.createBufferSource(); rs.buffer = noiseBuf; rs.loop = true;
      const rl = ctx.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 220;
      rumble = ctx.createGain(); rumble.gain.value = 0;
      rs.connect(rl); rl.connect(rumble); rumble.connect(master); rs.start();

      // Sub drone: two slightly detuned low tones whose slow beating is felt more than heard.
      drone = ctx.createGain(); drone.gain.value = 0; drone.connect(master);
      for (const [f, type, g] of [[41, 'sine', 0.9], [43.3, 'sine', 0.9], [87, 'triangle', 0.25]]) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
        const og = ctx.createGain(); og.gain.value = g;
        o.connect(og); og.connect(drone); o.start();
      }
    }

    function burst(opts) {
      if (!ctx) return;
      const t = ctx.currentTime + (opts.delay || 0);
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      src.playbackRate.value = opts.rate || 1;
      const f = ctx.createBiquadFilter(); f.type = opts.filter || 'bandpass'; f.frequency.value = opts.freq || 1200; f.Q.value = opts.q || 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.vol), t + (opts.attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
      src.connect(f); f.connect(g);
      if (opts.pan != null && ctx.createStereoPanner) {
        const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, opts.pan));
        g.connect(p); p.connect(master);
      } else g.connect(master);
      src.start(t, Math.random() * 1.5, opts.dur + 0.05);
    }

    /** Breathy, speech-like noise: formant filters opened and closed in short syllables. */
    function whisper(pan) {
      const t0 = ctx.currentTime;
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 7;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 9;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      src.connect(f1); src.connect(f2); f1.connect(g); f2.connect(g);
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master);
      let t = t0 + 0.05;
      const n = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const len = 0.12 + Math.random() * 0.22;
        f1.frequency.setValueAtTime(450 + Math.random() * 500, t);
        f2.frequency.setValueAtTime(1400 + Math.random() * 900, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(1.4, t + len * 0.4);
        g.gain.linearRampToValueAtTime(0.0001, t + len);
        t += len + 0.04 + Math.random() * 0.12;
      }
      src.start(t0); src.stop(t + 0.1);
    }

    function tone(freq, dur, vol, type, glide) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    }

    return {
      init,
      get ready() { return !!ctx; },
      setVolume(v) { volume = v; if (outGain) outGain.gain.value = v; },
      suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
      resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
      /** Player footstep on tile. */
      step(run) {
        burst({ vol: run ? 0.7 : 0.46, dur: 0.07, freq: 2400 + Math.random() * 700, q: 1.4 });
        burst({ vol: run ? 0.5 : 0.32, dur: 0.09, freq: 260 + Math.random() * 60, q: 0.9, filter: 'lowpass' });
      },
      /** Someone else's footstep at distance d, pan -1..1 (left..right). */
      otherStep(d, pan, run) {
        const v = Math.min(0.22, 0.9 / (1 + d * d * 0.12)) * (run ? 1.6 : 1);
        if (v < 0.004) return;
        burst({ vol: v * 3.5, dur: 0.08, freq: 1900 + Math.random() * 500, q: 1.6, pan });
        burst({ vol: v * 2.5, dur: 0.1, freq: 240, q: 0.9, filter: 'lowpass', pan });
      },
      crackle() { burst({ vol: 0.5, dur: 0.03, freq: 5200, q: 2 }); },
      setRumble(level) { if (rumble) rumble.gain.setTargetAtTime(level, ctx.currentTime, 0.1); },
      setHum(level) { if (hum) hum.gain.setTargetAtTime(level, ctx.currentTime, 0.2); },
      stinger() { tone(70, 1.4, 0.18, 'sawtooth', 45); burst({ vol: 0.15, dur: 0.6, freq: 300, q: 0.7, filter: 'lowpass' }); },
      setDread(level) { if (drone) drone.gain.setTargetAtTime(Math.pow(level, 1.3) * 0.06, ctx.currentTime, 0.6); },
      /** One heartbeat (lub-dub). v is 0..1. */
      heartbeat(v) {
        if (!ctx) return;
        const t = ctx.currentTime;
        const thump = (at, f, vol) => {
          const o = ctx.createOscillator(); o.type = 'sine';
          o.frequency.setValueAtTime(f * 1.7, at); o.frequency.exponentialRampToValueAtTime(f, at + 0.07);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, at);
          g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), at + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
          o.connect(g); g.connect(master); o.start(at); o.stop(at + 0.22);
        };
        thump(t, 56, 0.42 * v);
        thump(t + 0.2, 46, 0.3 * v);
        burst({ vol: 0.05 * v, dur: 0.07, freq: 180, q: 0.8, filter: 'lowpass' });
      },
      /** Background paranoia: never tied to an anomaly. */
      ambient(kind, pan) {
        if (!ctx) return;
        const p = pan == null ? 0 : pan;
        if (kind === 'thump') { // a door slamming somewhere far away
          burst({ vol: 0.9, dur: 0.35, freq: 110, q: 0.7, filter: 'lowpass', attack: 0.003, pan: p });
          burst({ vol: 0.35, dur: 0.12, freq: 900, q: 1, pan: p, delay: 0.01 });
          burst({ vol: 0.3, dur: 0.6, freq: 160, q: 0.7, filter: 'lowpass', pan: p * 0.8, delay: 0.18 });
        } else if (kind === 'steps') { // slow, distant footsteps that stop
          const n = 5 + Math.floor(Math.random() * 4);
          for (let i = 0; i < n; i++) {
            burst({ vol: 0.3 + i * 0.04, dur: 0.07, freq: 1500 + Math.random() * 500, q: 1.5, pan: p, delay: i * 0.62 });
            burst({ vol: 0.24 + i * 0.035, dur: 0.1, freq: 230, q: 0.9, filter: 'lowpass', pan: p, delay: i * 0.62 });
          }
        } else if (kind === 'scrape') { // something heavy dragged along metal
          burst({ vol: 1.2, dur: 1.6, freq: 800, q: 6, rate: 0.5, attack: 0.5, pan: p });
        } else if (kind === 'breath') {
          for (let i = 0; i < 2; i++) burst({ vol: 0.5, dur: 1.3, freq: 520, q: 0.8, rate: 0.7, attack: 0.55, pan: p, delay: i * 2.0 });
        } else if (kind === 'whisper') whisper(p);
      },
      /** The crawling man dragging himself along the tiles. */
      drag(d, pan) {
        const v = Math.min(0.16, 0.7 / (1 + d * d * 0.1));
        if (v < 0.004) return;
        burst({ vol: v * 3.5, dur: 0.28, freq: 700 + Math.random() * 300, q: 1.2, rate: 0.6, attack: 0.04, pan });
      },
      /** A fist on a door from the inside, d metres away. */
      knock(d, pan) {
        const v = Math.min(1, 1.6 / (1 + d * d * 0.05));
        if (v < 0.03) return;
        burst({ vol: 1.2 * v, dur: 0.16, freq: 140, q: 0.8, filter: 'lowpass', attack: 0.002, pan });
        burst({ vol: 0.5 * v, dur: 0.05, freq: 1200, q: 1, attack: 0.001, pan });
        tone(78, 0.14, 0.2 * v, 'sine', 55);
      },
      /** The stuttering man's jump: a short digital tear. */
      glitch(d, pan) {
        const v = Math.min(1, 1.4 / (1 + d * d * 0.06));
        if (v < 0.03) return;
        burst({ vol: 1.4 * v, dur: 0.07, freq: 3200 + Math.random() * 2000, q: 3, attack: 0.001, pan });
        burst({ vol: 0.5 * v, dur: 0.09, freq: 160, q: 0.8, filter: 'lowpass', attack: 0.001, pan });
      },
      /** A wrong decision: a low, dissonant hit. */
      wrong() {
        tone(92, 0.9, 0.22, 'sawtooth', 60);
        tone(97.5, 0.9, 0.18, 'sawtooth', 62);
        burst({ vol: 0.12, dur: 0.5, freq: 400, q: 0.6, filter: 'lowpass' });
      },
      /** The jump scare: a distorted shriek and a low impact. */
      jumpscare() {
        if (!ctx) return;
        const t = ctx.currentTime;
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 5);
        const shaper = ctx.createWaveShaper(); shaper.curve = curve;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
        g.gain.setValueAtTime(0.22, t + 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        shaper.connect(g); g.connect(master);
        for (const [f0, f1] of [[880, 1320], [1175, 1760], [1560, 2090]]) {
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(f0, t);
          o.frequency.exponentialRampToValueAtTime(f1, t + 0.25);
          o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 1.4);
          o.connect(shaper); o.start(t); o.stop(t + 1.55);
        }
        burst({ vol: 0.22, dur: 0.9, freq: 1600, q: 0.4, filter: 'highpass', attack: 0.004 });
        tone(48, 1.0, 0.4, 'sine', 24);
      },
      caught() {
        burst({ vol: 0.5, dur: 1.1, freq: 900, q: 0.4, filter: 'lowpass', attack: 0.01 });
        tone(140, 1.2, 0.3, 'sawtooth', 35);
        tone(97, 1.2, 0.22, 'square', 30);
      },
      vanish() { burst({ vol: 0.06, dur: 0.5, freq: 6000, q: 0.5, filter: 'highpass' }); },
      exitChord() {
        [261.6, 329.6, 392, 523.3].forEach((f, i) => setTimeout(() => tone(f, 3.5, 0.06, 'sine'), i * 140));
      },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
