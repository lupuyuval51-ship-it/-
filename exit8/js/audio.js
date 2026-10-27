/* EXIT 8 — procedural sound with the Web Audio API (no audio files). */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});

  E.createAudio = function () {
    let ctx = null, master = null, noiseBuf = null, rumble = null, hum = null, started = false;
    let volume = 0.8;

    function init() {
      if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      started = true;
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
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
      setVolume(v) { volume = v; if (master) master.gain.value = v; },
      suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
      resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
      /** Player footstep on tile. */
      step(run) {
        burst({ vol: run ? 0.2 : 0.13, dur: 0.07, freq: 2400 + Math.random() * 700, q: 1.4 });
        burst({ vol: run ? 0.16 : 0.1, dur: 0.09, freq: 260 + Math.random() * 60, q: 0.9, filter: 'lowpass' });
      },
      /** Someone else's footstep at distance d, pan -1..1 (left..right). */
      otherStep(d, pan, run) {
        const v = Math.min(0.22, 0.9 / (1 + d * d * 0.12)) * (run ? 1.6 : 1);
        if (v < 0.004) return;
        burst({ vol: v, dur: 0.08, freq: 1900 + Math.random() * 500, q: 1.6, pan });
        burst({ vol: v * 0.7, dur: 0.1, freq: 240, q: 0.9, filter: 'lowpass', pan });
      },
      crackle() { burst({ vol: 0.05, dur: 0.03, freq: 5200, q: 2 }); },
      setRumble(level) { if (rumble) rumble.gain.setTargetAtTime(level, ctx.currentTime, 0.1); },
      setHum(level) { if (hum) hum.gain.setTargetAtTime(level, ctx.currentTime, 0.2); },
      stinger() { tone(70, 1.4, 0.18, 'sawtooth', 45); burst({ vol: 0.15, dur: 0.6, freq: 300, q: 0.7, filter: 'lowpass' }); },
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
