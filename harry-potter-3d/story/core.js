/* Eldermoor: The Ninth Lantern — CORE engine (story mode).
 * Owner: CORE. Contract: story/ARCHITECTURE.md §3.
 * Classic script, one IIFE, Three.js r128 API only. */
(function () {
  'use strict';
  const ELD = window.ELD = window.ELD || {};
  ELD.version = '1.0';

  // =====================================================================
  // 0. CONSTANTS
  // =====================================================================
  const CFG = Object.freeze({
    DT_MAX: 0.05,
    EYE: 1.65,
    RADIUS: 0.4,
    WALK: 4.5,
    SPRINT: 7.5,
    JUMP: 5.6,
    GRAVITY: 17,
    SENS: 0.0022,
    PITCH_LIMIT: 1.35,
    BOLT_SPEED: 40,
    BOLT_LIFE: 1.4,
    CD_STUPEFY: 0.35,
    CD_EXPELL: 0.8,
    CD_PATRONUM: 12,
    PATRONUM_RADIUS: 22,
    STUN_STUPEFY: 1.2,
    STUN_EXPELL: 2.5,
    KNOCKBACK: 6,
    LUMOS_INTENSITY: 1.6,
    LUMOS_DISTANCE: 14,
    MASTER: 0.25,
    KEY_LANG: 'eld_lang',
    KEY_MUTE: 'eld_mute',
    KEY_SAVE: 'eld_story_v1',
    TYPE_CPS: 75
  });
  const DEFAULT_NAMES = { he: 'אריאל', en: 'Ariel' };
  const SPELL_NAMES = { lumos: 'Lumos', stupefy: 'Stupefy', expelliarmus: 'Expelliarmus', patronum: 'Expecto Patronum' };

  // =====================================================================
  // 1. SAFE STORAGE
  // =====================================================================
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  // =====================================================================
  // 2. EVENTS
  // =====================================================================
  const handlers = {};
  ELD.on = function (evt, fn) {
    if (typeof fn !== 'function') return fn;
    (handlers[evt] || (handlers[evt] = [])).push(fn);
    return fn;
  };
  ELD.off = function (evt, fn) {
    const l = handlers[evt];
    if (!l) return;
    const i = l.indexOf(fn);
    if (i >= 0) l.splice(i, 1);
  };
  ELD.emit = function (evt, a, b) {
    const l = handlers[evt];
    if (!l || !l.length) return;
    const copy = l.slice();
    for (let i = 0; i < copy.length; i++) {
      try { copy[i](a, b); } catch (e) { console.error('[ELD] "' + evt + '" handler failed:', e); }
    }
  };

  // =====================================================================
  // 3. UTILITIES
  // =====================================================================
  const glowCache = {};
  const U = ELD.util = {
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    damp: function (a, b, lambda, dt) { return a + (b - a) * (1 - Math.exp(-lambda * dt)); },
    keep: function (obj) {
      if (obj) { if (!obj.userData) obj.userData = {}; obj.userData.keep = true; }
      return obj;
    },
    canvasTexture: function (w, h, draw) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      if (draw) draw(g, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.encoding = THREE.sRGBEncoding;
      return tex;
    },
    glowTexture: function (css, size) {
      size = size || 128;
      const key = css + '|' + size;
      if (glowCache[key]) return glowCache[key];
      const tex = U.canvasTexture(size, size, function (g, w) {
        const r = w / 2;
        const gr = g.createRadialGradient(r, r, 0, r, r, r);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.12, css);
        gr.addColorStop(0.45, css);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.globalAlpha = 1;
        g.fillRect(0, 0, w, w);
        // soften the mid band so the colour fades out smoothly
        const g2 = g.createRadialGradient(r, r, r * 0.25, r, r, r);
        g2.addColorStop(0, 'rgba(0,0,0,0)');
        g2.addColorStop(1, 'rgba(0,0,0,1)');
        g.globalCompositeOperation = 'destination-out';
        g.fillStyle = g2;
        g.fillRect(0, 0, w, w);
        g.globalCompositeOperation = 'source-over';
      });
      U.keep(tex);
      glowCache[key] = tex;
      return tex;
    },
    glowSprite: function (css, scale, opacity) {
      const mat = new THREE.SpriteMaterial({
        map: U.glowTexture(css), transparent: true, opacity: opacity === undefined ? 1 : opacity,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const s = new THREE.Sprite(mat);
      const sc = scale === undefined ? 1 : scale;
      s.scale.set(sc, sc, 1);
      return s;
    },
    noiseTexture: function (baseCss, speckCss, size, repeat) {
      size = size || 256;
      const tex = U.canvasTexture(size, size, function (g, w, h) {
        g.fillStyle = baseCss; g.fillRect(0, 0, w, h);
        const n = Math.floor(w * h / 60);
        g.fillStyle = speckCss;
        for (let i = 0; i < n; i++) {
          g.globalAlpha = 0.15 + Math.random() * 0.5;
          const s = Math.random() < 0.85 ? 1 : 2;
          g.fillRect(Math.random() * w, Math.random() * h, s, s);
        }
        g.globalAlpha = 1;
      });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      if (repeat !== undefined && repeat !== null) {
        if (typeof repeat === 'number') tex.repeat.set(repeat, repeat);
        else if (Array.isArray(repeat)) tex.repeat.set(repeat[0], repeat[1]);
        else if (typeof repeat === 'object') tex.repeat.set(repeat.x || 1, repeat.y || 1);
      }
      return tex;
    }
  };

  // =====================================================================
  // 4. I18N
  // =====================================================================
  ELD.STRINGS = {
    he: {
      pageTitle: 'אלדרמור: הפנס התשיעי',
      title: 'אלדרמור: הפנס התשיעי',
      titleAlt: 'Eldermoor: The Ninth Lantern',
      tagline: 'תשעה פנסים שומרים על האקדמיה מפני האופל. בלילה הראשון שלך בטירה הפנס התשיעי כבה — ועכשיו גורלו בידיים שלך.',
      newGame: 'משחק חדש',
      'continue': 'המשך מסע',
      langBtn: 'English',
      courtyard: 'למצב הישרדות בחצר ←',
      desktopNote: 'המשחק מיועד למחשב שולחני עם מקלדת ועכבר.',
      controlsTitle: 'שליטה',
      controls: [
        ['W A S D', 'תנועה (Shift ריצה, רווח קפיצה)'],
        ['עכבר', 'הסתכלות וכיוון'],
        ['E', 'דיבור / שימוש / המשך שיחה'],
        ['1–4', 'בחירת תשובה בשיחה'],
        ['קליק שמאלי', 'Stupefy'],
        ['קליק ימני', 'Expelliarmus'],
        ['Q', 'Expecto Patronum'],
        ['L', 'Lumos'],
        ['P / Esc', 'השהיה'],
        ['M / H', 'השתקה / החלפת שפה']
      ],
      ngTitle: 'איך לקרוא לך?',
      ngName: 'השם שלך',
      ngAddress: 'איך לפנות אליך?',
      ngMale: 'בלשון זכר',
      ngFemale: 'בלשון נקבה',
      ngHint: 'הדמויות יפנו אליך בהתאם בעברית.',
      ngWarn: 'משחק חדש יחליף את ההתקדמות השמורה.',
      ngStart: 'יוצאים לדרך',
      back: 'חזרה',
      objective: 'משימה',
      shards: 'רסיסים',
      health: 'חיים',
      sound: 'צליל',
      soundOn: 'פעיל',
      soundOff: 'מושתק',
      on: 'דולק',
      off: 'כבוי',
      ready: 'מוכן',
      seconds: '{n} ש׳',
      locked: 'הדלת נעולה.',
      newSpell: 'לחש חדש: {s}',
      patronusWait: 'הפטרונוס עדיין נטען…',
      lockFail: 'נעילת העכבר אינה זמינה — אפשר להמשיך לשחק. לחצו על המסך כדי לנסות שוב.',
      paused: 'המשחק מושהה',
      pausedHint: 'הפנסים ממתינים. אפשר להמשיך בכל רגע.',
      resume: 'המשך',
      restartChapter: 'התחלת השלב מחדש',
      mute: 'השתקה',
      unmute: 'הפעלת צליל',
      quit: 'יציאה למסך הפתיחה',
      dlgNext: 'E ◂',
      creditsSkip: 'E / Esc — דילוג',
      storyMissing: 'מודול הסיפור לא נטען.',
      hMove: 'תנועה',
      hInteract: 'שימוש',
      hLmb: 'שמאלי',
      hRmb: 'ימני',
      hPause: 'השהיה',
      thanks: 'תודה ששיחקת!'
    },
    en: {
      pageTitle: 'Eldermoor: The Ninth Lantern',
      title: 'Eldermoor: The Ninth Lantern',
      titleAlt: 'אלדרמור: הפנס התשיעי',
      tagline: 'Nine lanterns guard the academy against the Gloom. On your very first night in the castle the Ninth Lantern goes out — and only you can light it again.',
      newGame: 'New Game',
      'continue': 'Continue',
      langBtn: 'עברית',
      courtyard: 'Courtyard Survival mode →',
      desktopNote: 'Designed for desktop keyboard & mouse.',
      controlsTitle: 'Controls',
      controls: [
        ['W A S D', 'Move (Shift sprint, Space jump)'],
        ['Mouse', 'Look and aim'],
        ['E', 'Talk / use / continue dialogue'],
        ['1–4', 'Pick a dialogue answer'],
        ['Left click', 'Stupefy'],
        ['Right click', 'Expelliarmus'],
        ['Q', 'Expecto Patronum'],
        ['L', 'Lumos'],
        ['P / Esc', 'Pause'],
        ['M / H', 'Mute / switch language']
      ],
      ngTitle: 'What should we call you?',
      ngName: 'Your name',
      ngAddress: 'Address me as',
      ngMale: 'Male',
      ngFemale: 'Female',
      ngHint: 'Used for gendered Hebrew dialogue.',
      ngWarn: 'A new game will replace your saved progress.',
      ngStart: 'Begin the journey',
      back: 'Back',
      objective: 'Objective',
      shards: 'Shards',
      health: 'Health',
      sound: 'Sound',
      soundOn: 'on',
      soundOff: 'muted',
      on: 'on',
      off: 'off',
      ready: 'ready',
      seconds: '{n}s',
      locked: 'The door is locked.',
      newSpell: 'New spell: {s}',
      patronusWait: 'Your Patronus is still recharging…',
      lockFail: 'Mouse lock is unavailable — you can keep playing. Click the game to try again.',
      paused: 'Paused',
      pausedHint: 'The lanterns will wait. Resume whenever you are ready.',
      resume: 'Resume',
      restartChapter: 'Restart chapter',
      mute: 'Mute',
      unmute: 'Unmute',
      quit: 'Quit to title',
      dlgNext: 'E ▸',
      creditsSkip: 'E / Esc — skip',
      storyMissing: 'The story module failed to load.',
      hMove: 'move',
      hInteract: 'use',
      hLmb: 'LMB',
      hRmb: 'RMB',
      hPause: 'pause',
      thanks: 'Thanks for playing!'
    }
  };

  const storedLang = lsGet(CFG.KEY_LANG);
  ELD.lang = storedLang === 'en' ? 'en' : 'he';
  ELD.profile = { name: DEFAULT_NAMES[ELD.lang], gender: 'm' };

  function gender() { return (ELD.profile && ELD.profile.gender === 'f') ? 'f' : 'm'; }
  function pname() { return (ELD.profile && ELD.profile.name) || DEFAULT_NAMES[ELD.lang]; }
  function resolveGendered(v) {
    if (v && typeof v === 'object' && (v.m !== undefined || v.f !== undefined)) {
      const g = gender();
      return v[g] !== undefined ? v[g] : (v.m !== undefined ? v.m : v.f);
    }
    return v;
  }

  ELD.t = function (key) {
    const L = ELD.STRINGS[ELD.lang] || ELD.STRINGS.he;
    let v = L[key];
    if (v === undefined) v = ELD.STRINGS.en[key];
    if (v === undefined) return String(key);
    return resolveGendered(v);
  };

  ELD.tx = function (obj) {
    if (obj === null || obj === undefined) return '';
    let v = obj;
    if (typeof v === 'object' && !Array.isArray(v)) {
      if (v.he !== undefined || v.en !== undefined) {
        v = v[ELD.lang] !== undefined ? v[ELD.lang] : (v.en !== undefined ? v.en : v.he);
      }
      v = resolveGendered(v);
    }
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return '';
    return String(v).replace(/\{name\}/g, pname());
  };

  function fmt(s, map) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return map[k] !== undefined ? String(map[k]) : m; });
  }

  // =====================================================================
  // 5. STATE / REFS
  // =====================================================================
  ELD.state = 'title';
  ELD.area = null;
  ELD.doorLocks = {};
  ELD.three = { renderer: null, scene: null, camera: null };

  let el = {};            // DOM refs (filled in boot)
  let booted = false;
  let renderer = null, scene = null, camera = null, hemi = null, fog = null, bgColor = null;
  let gameTime = 0, realTime = 0;
  const tmpV1 = (window.THREE ? new THREE.Vector3() : null);
  let tmpV2 = null, tmpV3 = null, tmpV4 = null;

  function makeVec() { return window.THREE ? new THREE.Vector3() : { x: 0, y: 0, z: 0, set: function (x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }; }

  // =====================================================================
  // 6. PLAYER
  // =====================================================================
  const P = ELD.player = {
    pos: makeVec(), yaw: 0, pitch: 0, vel: makeVec(), onGround: true,
    health: 100, maxHealth: 100,
    teleport: function (x, z, yaw) {
      P.pos.set(+x || 0, 0, +z || 0);
      if (typeof yaw === 'number' && isFinite(yaw)) P.yaw = yaw;
      P.pitch = 0;
      P.vel.set(0, 0, 0);
      P.onGround = true;
      faceTween = null;
      syncCamera();
    },
    // CONTRACT-NOTE: optional 4th arg `lookY` (world height to look at, e.g. an NPC's head on a pillar);
    // without it pitch eases to 0 as the contract says.
    faceTowards: function (x, z, ms, lookY) {
      if (ms === undefined) ms = 400;
      const dx = x - P.pos.x, dz = z - P.pos.z;
      if (Math.abs(dx) < 1e-5 && Math.abs(dz) < 1e-5) return Promise.resolve();
      let target = Math.atan2(-dx, -dz);
      let diff = target - P.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      let p1 = 0;
      if (typeof lookY === 'number' && isFinite(lookY)) {
        p1 = Math.atan2(lookY - (P.pos.y + CFG.EYE), Math.max(0.5, Math.sqrt(dx * dx + dz * dz)));
        p1 = Math.max(-0.6, Math.min(0.6, p1));
      }
      if (faceTween && faceTween.resolve) faceTween.resolve();
      if (!(ms > 0)) {
        P.yaw += diff; P.pitch = p1; syncCamera();
        return Promise.resolve();
      }
      return new Promise(function (resolve) {
        faceTween = { y0: P.yaw, dy: diff, p0: P.pitch, p1: p1, t: 0, dur: ms / 1000, resolve: resolve };
      });
    },
    heal: function (n) {
      const amt = (n === undefined || n === null) ? P.maxHealth : +n || 0;
      P.health = Math.max(0, Math.min(P.maxHealth, P.health + amt));
      if (P.health > 0) downFired = false;
    },
    damage: function (n, source) {
      const amt = +n || 0;
      if (amt <= 0 || P.health <= 0) return;
      P.health = Math.max(0, P.health - amt);
      hurtLevel = Math.min(1, hurtLevel + Math.min(0.6, amt / 25) + 0.02);
      if (realTime - lastHurtSfx > 0.55) { lastHurtSfx = realTime; ELD.audio.play('playerHurt'); }
      ELD.emit('playerHit', { amount: amt, source: source });
      if (P.health <= 0 && !downFired) {
        downFired = true;
        ELD.emit('playerDown');
      }
    }
  };
  let faceTween = null, downFired = false, hurtLevel = 0, lastHurtSfx = -10;
  // CONTRACT-NOTE: player.frozen is an accessor. Reading it returns true while the story froze the player OR a
  // dialogue / chapter card is showing; writing it only sets the story's own flag (dialogue/card never clobber it).
  let userFrozen = false, cardActive = 0;
  Object.defineProperty(P, 'frozen', {
    enumerable: true, configurable: true,
    get: function () { return userFrozen || cardActive > 0 || dlg.open; },
    set: function (v) { userFrozen = !!v; }
  });

  function syncCamera() {
    if (!camera) return;
    camera.position.set(P.pos.x, P.pos.y + CFG.EYE, P.pos.z);
    camera.rotation.set(P.pitch, P.yaw, 0);
  }

  // =====================================================================
  // 7. AUDIO (WebAudio, synthesized, lazy)
  // =====================================================================
  const AU = {
    ctx: null, master: null, sfx: null, mus: null, noise: null,
    muted: lsGet(CFG.KEY_MUTE) === '1',
    want: null, cur: null, curName: null
  };

  function initAudio() {
    if (AU.ctx) {
      try { if (AU.ctx.state === 'suspended') { const p = AU.ctx.resume(); if (p && p.catch) p.catch(function () {}); } } catch (e) { /* ignore */ }
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      AU.ctx = ctx;
      AU.master = ctx.createGain();
      AU.master.gain.value = AU.muted ? 0 : CFG.MASTER;
      AU.master.connect(ctx.destination);
      AU.sfx = ctx.createGain(); AU.sfx.gain.value = 1; AU.sfx.connect(AU.master);
      AU.mus = ctx.createGain(); AU.mus.gain.value = 0.42; AU.mus.connect(AU.master);
      const len = Math.floor(ctx.sampleRate * 1.0);
      AU.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = AU.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (AU.want) startMusic(AU.want);
    } catch (e) { AU.ctx = null; AU.master = null; }
  }

  function tone(o) {
    const ctx = AU.ctx;
    if (!ctx || AU.muted) return;
    try {
      const t0 = ctx.currentTime + (o.delay || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.f0, t0);
      if (o.f1 && o.f1 !== o.f0) osc.frequency.exponentialRampToValueAtTime(o.f1, t0 + (o.sweep || o.dur));
      if (o.detune) osc.detune.value = o.detune;
      const att = Math.min(o.attack || 0.01, o.dur * 0.8);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol), t0 + att);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
      let node = osc, filter = null;
      if (o.lowpass) {
        filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = o.lowpass;
        osc.connect(filter);
        node = filter;
      }
      node.connect(g);
      g.connect(o.bus || AU.sfx);
      osc.start(t0);
      osc.stop(t0 + o.dur + 0.05);
      osc.onended = function () {
        try { osc.disconnect(); g.disconnect(); if (filter) filter.disconnect(); } catch (e) { /* ignore */ }
      };
    } catch (e) { /* ignore */ }
  }

  function noiseBurst(dur, freq, vol, type, delay, bus, sweepTo) {
    const ctx = AU.ctx;
    if (!ctx || AU.muted || !AU.noise) return;
    try {
      const t0 = ctx.currentTime + (delay || 0);
      const src = ctx.createBufferSource();
      src.buffer = AU.noise;
      const f = ctx.createBiquadFilter();
      f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = 1.1;
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.min(0.05, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(bus || AU.sfx);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
      src.onended = function () { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (e) { /* ignore */ } };
    } catch (e) { /* ignore */ }
  }

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  const SFX = {
    stupefy: function () { tone({ type: 'sine', f0: 900, f1: 180, dur: 0.25, vol: 0.5 }); noiseBurst(0.08, 3000, 0.12); },
    expelliarmus: function () { tone({ type: 'triangle', f0: 1400, f1: 300, dur: 0.3, vol: 0.45 }); noiseBurst(0.14, 2600, 0.32); },
    patronum: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone({ type: 'sine', f0: f * 0.75, f1: f, sweep: 0.6, dur: 1.6, vol: 0.22, attack: 0.45, delay: i * 0.08 });
      });
      noiseBurst(1.2, 6000, 0.08, 'highpass');
    },
    lumos: function () { tone({ type: 'sine', f0: 1100, f1: 1650, dur: 0.2, vol: 0.18 }); },
    nox: function () { tone({ type: 'sine', f0: 1500, f1: 800, dur: 0.18, vol: 0.14 }); },
    hit: function () { tone({ type: 'sine', f0: 140, f1: 60, dur: 0.2, vol: 0.6 }); noiseBurst(0.1, 900, 0.25); },
    shadeDeath: function () {
      tone({ type: 'sawtooth', f0: 420, f1: 60, dur: 0.9, vol: 0.28, lowpass: 900, attack: 0.03 });
      noiseBurst(0.7, 1200, 0.22, 'bandpass', 0, null, 200);
    },
    shadeSpawn: function () { noiseBurst(0.6, 300, 0.18, 'bandpass', 0, null, 900); tone({ type: 'sine', f0: 180, f1: 110, dur: 0.6, vol: 0.18, attack: 0.2 }); },
    door: function () {
      tone({ type: 'sawtooth', f0: 95, f1: 70, dur: 0.55, vol: 0.12, lowpass: 420, attack: 0.08 });
      noiseBurst(0.35, 260, 0.35, 'lowpass', 0.25);
    },
    thud: function () { tone({ type: 'sine', f0: 90, f1: 45, dur: 0.25, vol: 0.55 }); noiseBurst(0.12, 220, 0.3, 'lowpass'); },
    pickup: function () {
      [1318.5, 1760, 2093, 2637].forEach(function (f, i) { tone({ type: 'sine', f0: f, dur: 0.9 - i * 0.1, vol: 0.22, delay: i * 0.09 }); });
    },
    blip: function () { tone({ type: 'square', f0: 620 + Math.random() * 120, dur: 0.05, vol: 0.05, lowpass: 1800 }); },
    choice: function () { tone({ type: 'triangle', f0: 880, f1: 1320, dur: 0.12, vol: 0.12 }); },
    relight: function () {
      [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach(function (f, i) {
        tone({ type: i % 2 ? 'triangle' : 'sine', f0: f, dur: 3.2, vol: 0.2, attack: 0.25 + i * 0.05, delay: i * 0.06 });
      });
      [1046.5, 1318.5, 1568, 2093].forEach(function (f, i) { tone({ type: 'sine', f0: f, dur: 1.4, vol: 0.08, delay: 0.5 + i * 0.12 }); });
      noiseBurst(1.8, 5000, 0.07, 'highpass');
      if (ELD.ui && ELD.ui.flash) ELD.ui.flash();
    },
    bossHit: function () { tone({ type: 'sawtooth', f0: 180, f1: 70, dur: 0.35, vol: 0.32, lowpass: 1200 }); noiseBurst(0.2, 700, 0.3); },
    playerHurt: function () { tone({ type: 'sawtooth', f0: 230, f1: 110, dur: 0.25, vol: 0.22, lowpass: 700 }); },
    chapter: function () {
      [392, 587.33, 783.99].forEach(function (f, i) { tone({ type: 'sine', f0: f, dur: 2.6, vol: 0.14, attack: 0.08, delay: i * 0.18 }); });
    },
    unlock: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone({ type: 'triangle', f0: f, dur: 0.5, vol: 0.16, delay: i * 0.07 }); });
    },
    enemyCast: function () { tone({ type: 'triangle', f0: 280, f1: 720, dur: 0.3, vol: 0.18 }); noiseBurst(0.25, 1400, 0.1); },
    shield: function () { tone({ type: 'sine', f0: 300, f1: 900, dur: 0.4, vol: 0.14 }); }
  };

  // Ambient music: soft procedural pads (3 detuned oscillators -> lowpass with slow LFO), chord cycle + sparse bells.
  const MUSIC = {
    night: { wave: 'triangle', cutoff: 760, lfo: 0.07, dur: 8, vol: 0.55,
      chords: [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]], bells: [69, 72, 74, 76, 79], bellEvery: [3.5, 7], bellVol: 0.05 },
    hall: { wave: 'sawtooth', cutoff: 820, lfo: 0.09, dur: 6, vol: 0.32,
      chords: [[48, 55, 64], [45, 57, 64], [41, 53, 60], [43, 55, 62]], bells: [72, 74, 76, 79, 81], bellEvery: [2.5, 5], bellVol: 0.045 },
    calm: { wave: 'sine', cutoff: 1300, lfo: 0.05, dur: 9, vol: 0.6,
      chords: [[50, 57, 66], [55, 59, 66], [52, 59, 67], [45, 57, 64]], bells: [74, 76, 78, 81, 83], bellEvery: [4, 8], bellVol: 0.04 },
    crypt: { wave: 'sawtooth', cutoff: 360, lfo: 0.04, dur: 10, vol: 0.42,
      chords: [[38, 39, 45], [36, 37, 43], [38, 44, 45], [35, 36, 42]], bells: [50, 51, 57, 58], bellEvery: [5, 10], bellVol: 0.05, wind: true },
    feast: { wave: 'triangle', cutoff: 1700, lfo: 0.12, dur: 4, vol: 0.45,
      chords: [[60, 64, 67], [53, 60, 65], [55, 62, 67], [57, 60, 64]], bells: [72, 74, 76, 79, 81, 84], bellEvery: [0.8, 2.2], bellVol: 0.05 }
  };

  function startMusic(name) {
    const ctx = AU.ctx;
    if (!ctx) return;
    if (AU.curName === name && AU.cur) return;
    stopMusicVoice(AU.cur);
    AU.cur = null; AU.curName = null;
    const def = MUSIC[name];
    if (!def) return;
    try {
      const t0 = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(def.vol, t0 + 2.5);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = def.cutoff; f.Q.value = 0.7;
      const lfo = ctx.createOscillator(); lfo.frequency.value = def.lfo;
      const lfoG = ctx.createGain(); lfoG.gain.value = def.cutoff * 0.45;
      lfo.connect(lfoG); lfoG.connect(f.frequency);
      const oscs = [];
      const ch = def.chords[0];
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        o.type = def.wave;
        o.frequency.value = midi(ch[i]);
        o.detune.value = (i - 1) * 7 + (i === 1 ? 3 : 0);
        const og = ctx.createGain(); og.gain.value = i === 0 ? 0.42 : 0.3;
        o.connect(og); og.connect(f);
        o.start(t0);
        oscs.push(o, og);
      }
      // a sub an octave below the root, very soft
      const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = midi(ch[0] - 12);
      const subG = ctx.createGain(); subG.gain.value = 0.25;
      sub.connect(subG); subG.connect(f); sub.start(t0);
      f.connect(g); g.connect(AU.mus);
      lfo.start(t0);
      AU.cur = { name: name, def: def, gain: g, filter: f, lfo: lfo, lfoG: lfoG, oscs: oscs, sub: sub, subG: subG,
        chord: 0, nextChord: t0 + def.dur, nextBell: t0 + 1.5 + Math.random() * 2, nextWind: t0 + 3 };
      AU.curName = name;
    } catch (e) { AU.cur = null; AU.curName = null; }
  }

  function stopMusicVoice(v) {
    if (!v || !AU.ctx) return;
    try {
      const t0 = AU.ctx.currentTime;
      v.gain.gain.cancelScheduledValues(t0);
      v.gain.gain.setValueAtTime(Math.max(0.0001, v.gain.gain.value), t0);
      v.gain.gain.linearRampToValueAtTime(0.0001, t0 + 2.2);
      const stopAt = t0 + 2.3;
      for (let i = 0; i < v.oscs.length; i += 2) v.oscs[i].stop(stopAt);
      v.sub.stop(stopAt); v.lfo.stop(stopAt);
      v.lfo.onended = function () {
        try {
          for (let i = 0; i < v.oscs.length; i++) v.oscs[i].disconnect();
          v.sub.disconnect(); v.subG.disconnect(); v.lfo.disconnect(); v.lfoG.disconnect(); v.filter.disconnect(); v.gain.disconnect();
        } catch (e) { /* ignore */ }
      };
    } catch (e) { /* ignore */ }
  }

  function musicTick() {
    const v = AU.cur, ctx = AU.ctx;
    if (!v || !ctx) return;
    const now = ctx.currentTime, def = v.def;
    try {
      if (now >= v.nextChord) {
        v.chord = (v.chord + 1) % def.chords.length;
        const ch = def.chords[v.chord];
        for (let i = 0; i < 3; i++) v.oscs[i * 2].frequency.setTargetAtTime(midi(ch[i]), now, 0.9);
        v.sub.frequency.setTargetAtTime(midi(ch[0] - 12), now, 0.9);
        v.nextChord = now + def.dur;
      }
      if (now >= v.nextBell) {
        if (!AU.muted) {
          const n = def.bells[Math.floor(Math.random() * def.bells.length)];
          tone({ type: 'sine', f0: midi(n), dur: 2.2, vol: def.bellVol, attack: 0.01, bus: AU.mus });
          tone({ type: 'sine', f0: midi(n + 12), dur: 1.2, vol: def.bellVol * 0.25, attack: 0.01, bus: AU.mus });
        }
        v.nextBell = now + def.bellEvery[0] + Math.random() * (def.bellEvery[1] - def.bellEvery[0]);
      }
      if (def.wind && now >= v.nextWind) {
        noiseBurst(4.5, 240 + Math.random() * 200, 0.07, 'bandpass', 0, AU.mus, 520);
        v.nextWind = now + 6 + Math.random() * 6;
      }
    } catch (e) { /* ignore */ }
  }

  ELD.audio = {
    play: function (name) {
      const f = SFX[name];
      if (!f) return;
      if (!AU.ctx) {
        // still trigger the visual side effect of 'relight'
        if (name === 'relight' && ELD.ui && ELD.ui.flash) ELD.ui.flash();
        return;
      }
      try { f(); } catch (e) { /* ignore */ }
    },
    music: function (name) {
      AU.want = name || null;
      if (!AU.ctx) return;
      if (!name || !MUSIC[name]) { stopMusicVoice(AU.cur); AU.cur = null; AU.curName = null; return; }
      startMusic(name);
    },
    setMuted: function (m) {
      AU.muted = !!m;
      lsSet(CFG.KEY_MUTE, AU.muted ? '1' : '0');
      if (AU.ctx && AU.master) {
        try { AU.master.gain.setTargetAtTime(AU.muted ? 0 : CFG.MASTER, AU.ctx.currentTime, 0.03); } catch (e) { /* ignore */ }
      }
      refreshMuteUI();
    },
    toggleMute: function () { ELD.audio.setMuted(!AU.muted); },
    isMuted: function () { return AU.muted; },
    init: initAudio
  };

  // =====================================================================
  // 8. SAVE
  // =====================================================================
  ELD.save = {
    load: function () {
      try {
        const raw = window.localStorage.getItem(CFG.KEY_SAVE);
        if (!raw) return null;
        const o = JSON.parse(raw);
        return (o && typeof o === 'object') ? o : null;
      } catch (e) { return null; }
    },
    store: function (obj) {
      try { window.localStorage.setItem(CFG.KEY_SAVE, JSON.stringify(obj)); } catch (e) { /* ignore */ }
    },
    clear: function () { lsDel(CFG.KEY_SAVE); }
  };

  // =====================================================================
  // 9. AREAS, DOORS, INTERACTABLES
  // =====================================================================
  const areaBuilders = {};
  let loadChain = Promise.resolve();
  let loading = false;

  ELD.registerArea = function (id, buildFn) { areaBuilders[id] = buildFn; };
  ELD.hasArea = function (id) { return !!areaBuilders[id]; };

  ELD.getAnchor = function (name) {
    const a = ELD.area;
    if (!a) return null;
    if (a.anchors && a.anchors[name]) return a.anchors[name];
    if (a.spawns && a.spawns[name]) { const s = a.spawns[name]; return { x: s.x, y: 0, z: s.z, yaw: s.yaw }; }
    return null;
  };
  ELD.getDoor = function (id) {
    const a = ELD.area;
    if (!a || !a.doors) return null;
    for (let i = 0; i < a.doors.length; i++) if (a.doors[i].id === id) return a.doors[i];
    return null;
  };
  ELD.setDoor = function (id, locked, msg) {
    ELD.doorLocks[id] = { locked: !!locked, msg: msg || null };
  };

  function isKeep(o) { return !!(o && o.userData && o.userData.keep); }
  const TEX_KEYS = ['map', 'emissiveMap', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap',
    'lightMap', 'aoMap', 'displacementMap', 'specularMap', 'envMap', 'gradientMap'];
  function disposeMaterial(m, seen) {
    if (!m || seen.has(m) || isKeep(m)) return;
    seen.add(m);
    for (let i = 0; i < TEX_KEYS.length; i++) {
      const t = m[TEX_KEYS[i]];
      if (t && t.isTexture && !isKeep(t) && !seen.has(t)) { seen.add(t); t.dispose(); }
    }
    m.dispose();
  }
  function disposeTree(root) {
    if (!root) return;
    const seen = new Set();
    root.traverse(function (o) {
      if (isKeep(o)) return;
      if (o.geometry && !o.isSprite && !isKeep(o.geometry) && !seen.has(o.geometry)) {
        seen.add(o.geometry); o.geometry.dispose();
      }
      if (o.material) {
        if (Array.isArray(o.material)) for (let i = 0; i < o.material.length; i++) disposeMaterial(o.material[i], seen);
        else disposeMaterial(o.material, seen);
      }
    });
  }
  ELD.disposeObject = disposeTree;

  function unloadCurrent() {
    const old = ELD.area;
    if (!old) return;
    try { ELD.combat.clear(); } catch (e) { console.error('[ELD] combat.clear failed', e); }
    interactables.length = 0;
    curPrompt = null;
    try { if (typeof old.dispose === 'function') old.dispose(); } catch (e) { console.error('[ELD] area dispose failed', e); }
    if (old.group) {
      if (old.group.parent) old.group.parent.remove(old.group);
      disposeTree(old.group);
    }
    ELD.area = null;
  }

  function applyAmbient(a) {
    a = a || {};
    bgColor.setHex(a.background !== undefined ? a.background : 0x05070f);
    scene.background = bgColor;
    fog.color.setHex(a.fogColor !== undefined ? a.fogColor : (a.background !== undefined ? a.background : 0x05070f));
    fog.density = a.fogDensity !== undefined ? a.fogDensity : 0.02;
    hemi.color.setHex(a.hemiSky !== undefined ? a.hemiSky : 0x8090b0);
    hemi.groundColor.setHex(a.hemiGround !== undefined ? a.hemiGround : 0x201810);
    hemi.intensity = a.hemiIntensity !== undefined ? a.hemiIntensity : 0.5;
    ELD.audio.music(a.music || null);
  }

  function normaliseArea(def, id) {
    def.id = def.id || id;
    if (!def.group) def.group = new THREE.Group();
    def.bounds = def.bounds || { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
    def.colliders = def.colliders || [];
    def.spawns = def.spawns || {};
    def.doors = def.doors || [];
    def.anchors = def.anchors || {};
    def.ambient = def.ambient || {};
    def.api = def.api || {};
    return def;
  }

  async function doLoadArea(id, spawnName) {
    const build = areaBuilders[id];
    if (!build) { console.warn('[ELD] unknown area "' + id + '"'); return null; }
    loading = true;
    try {
      await ELD.ui.fade(true, 350);
      unloadCurrent();
      let def = build({ THREE: THREE, util: U, ELD: ELD });
      if (def && typeof def.then === 'function') def = await def;
      if (!def) throw new Error('area builder "' + id + '" returned nothing');
      def = normaliseArea(def, id);
      ELD.area = def;
      scene.add(def.group);
      titleGroup.visible = false;
      applyAmbient(def.ambient);
      let sp = def.spawns[spawnName];
      if (!sp) { const k = Object.keys(def.spawns)[0]; sp = k ? def.spawns[k] : { x: 0, z: 0, yaw: 0 }; }
      P.teleport(sp.x, sp.z, sp.yaw || 0);
      markerPos = null; refreshMarker();
      try { renderer.compile(scene, camera); } catch (e) { /* ignore */ }
      ELD.emit('areaLoaded', { id: id, spawn: spawnName });
    } catch (e) {
      console.error('[ELD] failed to load area "' + id + '":', e);
    } finally {
      loading = false;
    }
    await ELD.ui.fade(false, 350);
    return ELD.area;
  }

  ELD.loadArea = function (id, spawnName) {
    const p = loadChain.then(function () { return doLoadArea(id, spawnName); });
    loadChain = p.catch(function () {});
    return p;
  };

  // CONTRACT-NOTE: extra helper — unloads the current area (used by showTitle). Queued like loadArea.
  ELD.unloadArea = function () {
    const p = loadChain.then(function () { unloadCurrent(); titleGroup.visible = true; applyTitleAmbient(); });
    loadChain = p.catch(function () {});
    return p;
  };
  ELD.isLoading = function () { return loading; };

  // Interactables -----------------------------------------------------
  const interactables = [];
  let iaSeq = 0;
  let curPrompt = null, promptKey = '';

  ELD.addInteractable = function (o) {
    if (!o) return null;
    const id = o.id || ('ia' + (++iaSeq));
    ELD.removeInteractable(id);
    interactables.push({ id: id, pos: o.pos, radius: o.radius || 2.2, label: o.label, onInteract: o.onInteract, enabled: o.enabled });
    return id;
  };
  ELD.removeInteractable = function (id) {
    for (let i = interactables.length - 1; i >= 0; i--) if (interactables[i].id === id) interactables.splice(i, 1);
    if (curPrompt && curPrompt.ref && curPrompt.ref.id === id) curPrompt = null;
  };

  function canInteract() {
    return ELD.state === 'playing' && !dlg.open && !P.frozen && !loading && !creditsState;
  }

  function resolvePos(p) {
    if (typeof p === 'function') { try { return p(); } catch (e) { return null; } }
    return p;
  }

  const promptCand = { kind: null, ref: null, score: 0 };
  function updatePrompt() {
    let best = null, bestScore = Infinity, bestKind = null;
    if (canInteract()) {
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      const px = P.pos.x, pz = P.pos.z;
      for (let i = 0; i < interactables.length; i++) {
        const it = interactables[i];
        if (it.enabled) { let ok = false; try { ok = it.enabled(); } catch (e) { ok = false; } if (!ok) continue; }
        const p = resolvePos(it.pos);
        if (!p) continue;
        const dx = p.x - px, dz = p.z - pz;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d > it.radius) continue;
        const dot = d > 0.001 ? (dx * fx + dz * fz) / d : 1;
        const s = d - dot * 1.6;
        if (s < bestScore) { bestScore = s; best = it; bestKind = 'ia'; }
      }
      const doors = ELD.area ? ELD.area.doors : null;
      if (doors) {
        for (let i = 0; i < doors.length; i++) {
          const dr = doors[i];
          const dx = dr.x - px, dz = dr.z - pz;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d > (dr.radius || 2)) continue;
          const dot = d > 0.001 ? (dx * fx + dz * fz) / d : 1;
          const s = d - dot * 1.6;
          if (s < bestScore) { bestScore = s; best = dr; bestKind = 'door'; }
        }
      }
    }
    if (best) {
      promptCand.kind = bestKind; promptCand.ref = best;
      curPrompt = promptCand;
      const text = ELD.tx(best.label);
      const key = bestKind + ':' + (best.id || '') + ':' + text;
      if (key !== promptKey) {
        promptKey = key;
        el.promptText.textContent = text;
        el.prompt.classList.add('on');
      }
    } else {
      curPrompt = null;
      if (promptKey !== '') { promptKey = ''; el.prompt.classList.remove('on'); }
    }
  }

  function useDoor(dr) {
    const lock = ELD.doorLocks[dr.id];
    if (lock && lock.locked) {
      ELD.ui.toast(lock.msg ? lock.msg : ELD.t('locked'), 2400);
      ELD.audio.play('thud');
      return;
    }
    ELD.audio.play('door');
    ELD.emit('doorUsed', { id: dr.id });
    if (dr.to) ELD.loadArea(dr.to, dr.toSpawn);
  }

  function tryInteract() {
    if (!canInteract()) return false;
    updatePrompt();
    const c = curPrompt;
    if (!c || !c.ref) return false;
    const ref = c.ref;
    if (c.kind === 'door') { useDoor(ref); return true; }
    try { if (typeof ref.onInteract === 'function') ref.onInteract(); } catch (e) { console.error('[ELD] interactable failed', e); }
    return true;
  }

  // =====================================================================
  // 10. UI
  // =====================================================================
  const dlg = {
    open: false, lines: null, idx: 0, chars: null, shown: 0, acc: 0, typing: false,
    choicesShown: false, last: undefined, resolve: null, openedAt: 0, lineText: ''
  };
  let dlgChain = Promise.resolve();
  let objCur = null, objStr = '';
  let shardsCur = null;
  let bossCur = null, bossFrac = 1;
  let healthShown = false;
  let markerPos = null;
  let chapterCur = null;
  let creditsState = null;
  const gameTimers = [];
  let lockFailShown = false;
  let fadeTarget = 0, fadeEndAt = 0;

  function waitGame(ms) {
    return new Promise(function (resolve) { gameTimers.push({ left: ms / 1000, resolve: resolve }); });
  }
  function tickTimers(dt) {
    for (let i = gameTimers.length - 1; i >= 0; i--) {
      const tm = gameTimers[i];
      tm.left -= dt;
      if (tm.left <= 0) { gameTimers.splice(i, 1); tm.resolve(); }
    }
  }
  function flushTimers() {
    const l = gameTimers.splice(0, gameTimers.length);
    for (let i = 0; i < l.length; i++) l[i].resolve();
  }

  function charInfo(who) {
    if (!who || !ELD.chars || typeof ELD.chars.info !== 'function') return null;
    try { return ELD.chars.info(who) || null; } catch (e) { return null; }
  }
  function charPortrait(who) {
    if (!who || !ELD.chars || typeof ELD.chars.portrait !== 'function') return '';
    try { return ELD.chars.portrait(who) || ''; } catch (e) { return ''; }
  }

  function renderDlgLine(keepProgress) {
    const line = dlg.lines[dlg.idx];
    const who = line.who === undefined ? null : line.who;
    const narrator = !who;
    el.dialogue.classList.toggle('narrator', narrator);
    if (!narrator) {
      const info = charInfo(who);
      let name = info ? ELD.tx(info.name) : '';
      if (who === 'player' && !name) name = pname();
      el.dlgName.textContent = name;
      el.dlgTitle.textContent = info && info.title ? ELD.tx(info.title) : '';
      const col = (info && info.color) || '#a97a26';
      el.dialogue.style.setProperty('--dlg-color', col);
      const src = charPortrait(who);
      if (src) { if (el.dlgPortrait.getAttribute('src') !== src) el.dlgPortrait.src = src; el.dlgPortraitWrap.style.display = ''; }
      else { el.dlgPortrait.removeAttribute('src'); el.dlgPortraitWrap.style.display = 'none'; }
    }
    const text = ELD.tx(line.text);
    dlg.lineText = text;
    dlg.chars = Array.from(text);
    if (!keepProgress) { dlg.shown = 0; dlg.acc = 0; dlg.typing = dlg.chars.length > 0; }
    else if (!dlg.typing) dlg.shown = dlg.chars.length;
    else dlg.shown = Math.min(dlg.shown, dlg.chars.length);
    el.dlgText.textContent = dlg.chars.slice(0, dlg.shown).join('');
    if (!dlg.typing) finishTyping();
    else { hideChoices(); el.dlgNext.classList.remove('on'); }
  }

  function finishTyping() {
    dlg.typing = false;
    dlg.shown = dlg.chars.length;
    el.dlgText.textContent = dlg.lineText;
    const line = dlg.lines[dlg.idx];
    if (line.choices && line.choices.length) { showChoices(line.choices); el.dlgNext.classList.remove('on'); }
    else { hideChoices(); el.dlgNext.classList.add('on'); }
  }

  function showChoices(choices) {
    el.dlgChoices.textContent = '';
    for (let i = 0; i < choices.length && i < 4; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      const k = document.createElement('kbd'); k.textContent = String(i + 1);
      const s = document.createElement('span'); s.textContent = ELD.tx(choices[i].text);
      b.appendChild(k); b.appendChild(s);
      b.addEventListener('click', (function (idx) {
        return function (e) { e.stopPropagation(); chooseDlg(idx, true); };
      })(i));
      el.dlgChoices.appendChild(b);
    }
    el.dlgChoices.classList.add('on');
    if (!dlg.choicesShown) {
      dlg.choicesShown = true;
      releaseLock();
    }
  }
  function hideChoices() {
    if (dlg.choicesShown || el.dlgChoices.classList.contains('on')) {
      el.dlgChoices.classList.remove('on');
      el.dlgChoices.textContent = '';
    }
    dlg.choicesShown = false;
  }

  function showDlgLine(i) {
    dlg.idx = i;
    renderDlgLine(false);
    ELD.audio.play('blip');
    // CONTRACT-NOTE: extra event so story can turn the camera toward whoever speaks this line
    ELD.emit('dialogueLine', { who: dlg.lines[i].who || null, index: i });
  }

  function nextDlg() {
    if (dlg.idx + 1 >= dlg.lines.length) closeDlg();
    else showDlgLine(dlg.idx + 1);
  }

  function advanceDlg(fromUser) {
    if (!dlg.open) return;
    if (fromUser && realTime - dlg.openedAt < 0.15) return;
    const line = dlg.lines[dlg.idx];
    if (dlg.typing) { finishTyping(); return; }
    if (line.choices && line.choices.length) return;
    nextDlg();
  }

  function chooseDlg(i, fromUser) {
    if (!dlg.open) return false;
    const line = dlg.lines[dlg.idx];
    if (!line.choices || !line.choices.length) return false;
    if (fromUser && dlg.typing) return false;
    const c = line.choices[i];
    if (!c) return false;
    dlg.last = c.value;
    ELD.audio.play('choice');
    hideChoices();
    blurActive();
    if (fromUser && ELD.state === 'playing') requestLock(true);
    nextDlg();
    return true;
  }

  function closeDlg() {
    const res = dlg.resolve;
    const val = dlg.last;
    dlg.open = false; dlg.lines = null; dlg.resolve = null;
    hideChoices();
    el.dialogue.classList.remove('on');
    el.dlgNext.classList.remove('on');
    document.body.classList.remove('dlg');
    if (res) res(val);
  }

  function runDialogue(lines) {
    return new Promise(function (resolve) {
      if (!Array.isArray(lines) || !lines.length) { resolve(undefined); return; }
      dlg.open = true; dlg.lines = lines; dlg.last = undefined; dlg.resolve = resolve;
      dlg.openedAt = realTime;
      mouse.left = mouse.right = false;
      document.body.classList.add('dlg');
      el.dialogue.classList.add('on');
      showDlgLine(0);
    });
  }

  function updateTypewriter(dt) {
    if (!dlg.open || !dlg.typing) return;
    dlg.acc += dt * CFG.TYPE_CPS;
    const n = Math.min(dlg.chars.length, Math.floor(dlg.acc));
    if (n !== dlg.shown) {
      dlg.shown = n;
      el.dlgText.textContent = dlg.chars.slice(0, n).join('');
    }
    if (n >= dlg.chars.length) finishTyping();
  }

  function toast(text, ms, cls) {
    if (!el.toasts) return;
    const d = document.createElement('div');
    d.className = 'toast' + (cls ? ' ' + cls : '');
    d.textContent = ELD.tx(text);
    const dur = ms || 2600;
    d.style.animationDuration = dur + 'ms';
    el.toasts.appendChild(d);
    while (el.toasts.children.length > 3) el.toasts.removeChild(el.toasts.firstChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, dur + 60);
  }

  function renderObjective(pulse) {
    if (!el.objPanel) return;
    if (!objCur) { el.objPanel.classList.remove('on'); objStr = ''; return; }
    const s = ELD.tx(objCur);
    el.objText.textContent = s;
    el.objPanel.classList.add('on');
    if (pulse && s !== objStr) {
      el.objPanel.classList.remove('pulse'); void el.objPanel.offsetWidth; el.objPanel.classList.add('pulse');
    }
    objStr = s;
  }

  function renderShards(pulse) {
    if (shardsCur === null || shardsCur === undefined) { el.shardBox.hidden = true; return; }
    el.shardBox.hidden = false;
    el.shardText.textContent = shardsCur + '/3';
    el.shardText.setAttribute('dir', 'ltr');
    let gems = '';
    for (let i = 0; i < 3; i++) gems += '<i class="gem' + (i < shardsCur ? ' on' : '') + '"></i>';
    el.shardGems.innerHTML = gems;
    if (pulse) { el.shardBox.classList.remove('pulse'); void el.shardBox.offsetWidth; el.shardBox.classList.add('pulse'); }
  }

  function renderBoss() {
    if (!bossCur) { el.bossWrap.classList.remove('on'); return; }
    el.bossWrap.classList.add('on');
    el.bossName.textContent = ELD.tx(bossCur);
    el.bossFill.style.width = (U.clamp(bossFrac, 0, 1) * 100).toFixed(1) + '%';
  }

  function renderHints() {
    if (!el.hintRow) return;
    const S = ELD.spells.unlocked;
    const items = [['WASD', ELD.t('hMove')], ['E', ELD.t('hInteract')]];
    if (S.stupefy) items.push([ELD.t('hLmb'), 'Stupefy', 'stupefy']);
    if (S.expelliarmus) items.push([ELD.t('hRmb'), 'Expelliarmus', 'expelliarmus']);
    if (S.patronum) items.push(['Q', 'Patronum', 'patronum']);
    if (S.lumos) items.push(['L', 'Lumos', 'lumos']);
    items.push(['P', ELD.t('hPause')]);
    el.hintRow.textContent = '';
    for (let i = 0; i < items.length; i++) {
      const sp = document.createElement('span');
      sp.className = 'hk' + (items[i][2] && items[i][2] === newHint ? ' new' : '');
      const k = document.createElement('kbd'); k.textContent = items[i][0];
      const tx = document.createElement('span'); tx.textContent = ' ' + items[i][1];
      if (items[i][2]) tx.className = 'latin';
      sp.appendChild(k); sp.appendChild(tx);
      el.hintRow.appendChild(sp);
    }
  }
  let newHint = null;

  function refreshMuteUI() {
    if (!el.muteText) return;
    el.muteText.textContent = AU.muted ? ELD.t('soundOff') : ELD.t('soundOn');
    el.btnMute.textContent = AU.muted ? ELD.t('unmute') : ELD.t('mute');
  }

  function flashScreen(css) {
    if (!el.flash) return;
    el.flash.style.background = css ? 'radial-gradient(circle at center, ' + css + ', rgba(0,0,0,0))' : '';
    el.flash.classList.remove('go'); void el.flash.offsetWidth; el.flash.classList.add('go');
  }

  ELD.ui = {
    dialogue: function (lines) {
      const p = dlgChain.then(function () { return runDialogue(lines); });
      dlgChain = p.catch(function () {});
      return p;
    },
    isDialogueOpen: function () { return dlg.open; },
    toast: function (text, ms) { toast(text, ms); },
    setObjective: function (obj) { objCur = obj || null; renderObjective(true); },
    setMarker: function (p) {
      markerPos = (p && typeof p.x === 'number') ? { x: p.x, y: typeof p.y === 'number' ? p.y : 0, z: p.z } : null;
      refreshMarker();
    },
    chapterCard: function (title, subtitle) {
      return new Promise(function (resolve) {
        chapterCur = { title: title, subtitle: subtitle };
        el.ccTitle.textContent = ELD.tx(title);
        el.ccSub.textContent = ELD.tx(subtitle);
        el.chapterCard.classList.remove('on'); void el.chapterCard.offsetWidth;
        el.chapterCard.classList.add('on');
        cardActive++;
        ELD.audio.play('chapter');
        waitGame(3200).then(function () {
          cardActive = Math.max(0, cardActive - 1);
          if (!cardActive) { el.chapterCard.classList.remove('on'); chapterCur = null; }
          resolve();
        });
      });
    },
    fade: function (toBlack, ms) {
      if (ms === undefined) ms = 600;
      return new Promise(function (resolve) {
        if (!el.fade) { resolve(); return; }
        const tgt = toBlack ? 1 : 0;
        const now = performance.now();
        if (tgt === fadeTarget) {
          const rem = fadeEndAt - now;
          if (rem > 0) setTimeout(resolve, rem + 10); else resolve();
          return;
        }
        fadeTarget = tgt; fadeEndAt = now + ms;
        el.fade.style.transitionDuration = ms + 'ms';
        el.fade.style.opacity = String(tgt);
        setTimeout(resolve, ms + 20);
      });
    },
    bossBar: function (name, frac) {
      bossCur = name || null;
      bossFrac = typeof frac === 'number' ? frac : 1;
      renderBoss();
    },
    showHealth: function (b) { healthShown = !!b; el.hpWrap.hidden = !healthShown; },
    setShards: function (n) {
      const prev = shardsCur;
      shardsCur = (n === null || n === undefined) ? null : Math.max(0, n | 0);
      renderShards(shardsCur !== null && prev !== null && shardsCur > prev);
    },
    credits: function (sections) { return runCredits(sections || []); },
    showTitle: function () { showTitle(); },
    // CONTRACT-NOTE: extra — screen flash (default warm gold). Also fired automatically by audio.play('relight').
    flash: function (css) { flashScreen(css); }
  };

  // =====================================================================
  // 11. CREDITS
  // =====================================================================
  function runCredits(sections) {
    return new Promise(function (resolve) {
      if (creditsState) { creditsState.finish(); }
      closeDlgHard();
      setState('ended');
      exitLock();
      const roll = el.creditsRoll;
      roll.textContent = '';
      const h = document.createElement('h1'); h.textContent = ELD.t('title'); roll.appendChild(h);
      const sub = document.createElement('p'); sub.textContent = ELD.t('titleAlt'); sub.style.opacity = '0.7'; roll.appendChild(sub);
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i] || {};
        if (s.title) { const h2 = document.createElement('h2'); h2.textContent = ELD.tx(s.title); roll.appendChild(h2); }
        const lines = s.lines || [];
        for (let j = 0; j < lines.length; j++) { const p = document.createElement('p'); p.textContent = ELD.tx(lines[j]); roll.appendChild(p); }
      }
      const end = document.createElement('div'); end.className = 'end'; roll.appendChild(end);
      el.credits.classList.add('on');
      const H = window.innerHeight || 700;
      const rollH = roll.offsetHeight;
      const speed = Math.max(40, H / 14);  // px per second
      const st = {
        y: H, endY: 0.7 * H - rollH, speed: speed, done: false,
        finish: function () {
          if (st.done) return;
          st.done = true;
          creditsState = null;
          el.credits.classList.remove('on');
          resolve();
        }
      };
      roll.style.transform = 'translateY(' + H + 'px)';
      creditsState = st;
    });
  }
  function updateCredits(dt) {
    const st = creditsState;
    if (!st) return;
    st.y -= st.speed * dt;
    el.creditsRoll.style.transform = 'translateY(' + st.y.toFixed(1) + 'px)';
    if (st.y <= st.endY) st.finish();
  }

  // =====================================================================
  // 12. SPELLS, COMBAT, EFFECTS
  // =====================================================================
  ELD.spells = {
    unlocked: { lumos: false, stupefy: false, expelliarmus: false, patronum: false },
    lumosOn: false,
    // CONTRACT-NOTE: unlock(id, silent) — pass silent=true (e.g. when restoring a save) to skip toast/sfx.
    unlock: function (id, silent) {
      if (!(id in ELD.spells.unlocked)) return;
      const was = ELD.spells.unlocked[id];
      ELD.spells.unlocked[id] = true;
      if (!silent && !was) {
        newHint = id;
        toast(fmt(ELD.t('newSpell'), { s: SPELL_NAMES[id] }), 3000);
        ELD.audio.play('unlock');
      }
      renderHints();
    },
    // CONTRACT-NOTE: extra — programmatic cast (same rules as the player's input). Returns true if cast.
    cast: function (id) { return castSpell(id); },
    cooldowns: function () { return { stupefy: cd.stupefy, expelliarmus: cd.expelliarmus, patronum: cd.patronum }; }
  };
  const cd = { stupefy: 0, expelliarmus: 0, patronum: 0 };
  const castBuf = { stupefy: 0, expelliarmus: 0 };   // a click during cooldown fires as soon as it ends
  let lastPatWaitToast = -10;

  // wand / lights / shared resources (created in boot)
  const wandAnim = { bob: 0, amp: 0, recoil: 0 };
  const WAND_BASE = { x: 0.24, y: -0.23, z: -0.42, rx: 0.12, ry: 0.2 };
  let wand = null, wandTip = null, wandTipMat = null, lumosLight = null, lumosGlow = null, patronusLight = null;
  const wandParts = [];
  let RES = null;       // shared materials/geometries/textures (all keep)
  let titleGroup = null, markerGroup = null, markerParts = null;

  function setWandVisible(v) { for (let i = 0; i < wandParts.length; i++) wandParts[i].visible = v; }

  function setLumos(on) {
    ELD.spells.lumosOn = !!on;
    if (lumosLight) lumosLight.intensity = on ? CFG.LUMOS_INTENSITY : 0;
    if (lumosGlow) lumosGlow.visible = !!on;
    if (wandTipMat) wandTipMat.emissiveIntensity = on ? 1.6 : 0.25;
  }
  // CONTRACT-NOTE: extra — story may force the wand light (e.g. off at a chapter start).
  ELD.spells.setLumos = setLumos;

  function canCast() { return ELD.state === 'playing' && !dlg.open && !P.frozen && !creditsState; }

  function showSpellName(name) {
    el.spellName.textContent = name;
    el.spellName.classList.remove('show'); void el.spellName.offsetWidth; el.spellName.classList.add('show');
  }

  function castSpell(id) {
    if (!canCast() || !ELD.spells.unlocked[id]) return false;
    if (id === 'lumos') {
      setLumos(!ELD.spells.lumosOn);
      showSpellName(ELD.spells.lumosOn ? 'Lumos!' : 'Nox');
      ELD.audio.play(ELD.spells.lumosOn ? 'lumos' : 'nox');
      // CONTRACT-NOTE: turning the light ON emits spellCast {id:'lumos', on:true}; OFF emits {id:'nox', on:false}.
      ELD.emit('spellCast', ELD.spells.lumosOn ? { id: 'lumos', on: true } : { id: 'nox', on: false });
      return true;
    }
    if (id === 'stupefy' || id === 'expelliarmus') {
      if (cd[id] > 0) return false;
      cd[id] = id === 'stupefy' ? CFG.CD_STUPEFY : CFG.CD_EXPELL;
      fireBolt(id);
      ELD.emit('spellCast', { id: id });
      return true;
    }
    if (id === 'patronum') {
      if (cd.patronum > 0) {
        if (realTime - lastPatWaitToast > 1.5) { lastPatWaitToast = realTime; toast(ELD.t('patronusWait'), 1500, 'small'); }
        return false;
      }
      cd.patronum = CFG.CD_PATRONUM;
      castPatronum();
      ELD.emit('spellCast', { id: 'patronum' });
      return true;
    }
    return false;
  }

  // --- effects ---------------------------------------------------------
  const effects = [];
  function addEffect(obj, mats, dur, update, data) {
    scene.add(obj);
    effects.push({ obj: obj, mats: mats, t: 0, dur: dur, update: update, data: data || null });
  }
  function endEffect(e) {
    if (e.obj.parent) e.obj.parent.remove(e.obj);
    for (let i = 0; i < e.mats.length; i++) e.mats[i].dispose();
    if (e.data && e.data.release) e.data.release();
  }
  function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      e.t += dt;
      const k = Math.min(1, e.t / e.dur);
      e.update(e, k, dt);
      if (k >= 1) { endEffect(e); effects.splice(i, 1); }
    }
  }
  function clearEffects() {
    for (let i = 0; i < effects.length; i++) endEffect(effects[i]);
    effects.length = 0;
  }

  // pooled sparks (each sprite keeps its own material, reused forever)
  const sparkPool = [];
  function sparkUpdate(e, k) {
    const s = e.data.size * (0.6 + k * 2.4);
    e.obj.scale.set(s, s, 1);
    e.obj.material.opacity = 1 - k;
  }
  function spawnSpark(pos, colorHex, size) {
    let s = sparkPool.pop();
    if (!s) {
      const m = new THREE.SpriteMaterial({ map: RES.glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      U.keep(m);
      s = new THREE.Sprite(m);
      U.keep(s);
    }
    s.material.color.setHex(colorHex);
    s.material.opacity = 1;
    s.position.copy(pos);
    const data = { size: size || 0.9, release: function () { sparkPool.push(s); } };
    addEffect(s, [], 0.32, sparkUpdate, data);
  }

  function ringUpdate(e, k) {
    const s = 1 + (CFG.PATRONUM_RADIUS - 1) * (1 - Math.pow(1 - k, 2));
    e.obj.scale.set(s, s, s);
    e.obj.material.opacity = 0.85 * (1 - k);
  }
  function guardianUpdate(e, k) {
    const d = e.data;
    const fadeIn = Math.min(1, k / 0.15);
    const fadeOut = 1 - Math.max(0, (k - 0.45) / 0.55);
    e.obj.material.opacity = fadeIn * fadeOut;
    e.obj.position.set(d.x + d.dx * k * 7, 1.3 + k * 2.6, d.z + d.dz * k * 7);
    const s = 3.2 + k * 1.6;
    e.obj.scale.set(s, s, 1);
  }
  function castPatronum() {
    for (let i = 0; i < 2; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: i ? 0xa9d4ff : 0xe4f2ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
      const ring = new THREE.Mesh(RES.ringGeo, mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(P.pos.x, 0.12 + i * 0.6, P.pos.z);
      addEffect(ring, [mat], 1.0 + i * 0.4, ringUpdate);
    }
    const gmat = new THREE.SpriteMaterial({ map: RES.stagTex, color: 0xdff0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const guardian = new THREE.Sprite(gmat);
    const dx = -Math.sin(P.yaw), dz = -Math.cos(P.yaw);
    const data = { x: P.pos.x + dx * 3.2, z: P.pos.z + dz * 3.2, dx: dx, dz: dz };
    guardian.position.set(data.x, 1.3, data.z);
    addEffect(guardian, [gmat], 2.0, guardianUpdate, data);
    patronusLight.position.set(P.pos.x, 3, P.pos.z);
    patronusLight.intensity = 4;
    wandAnim.recoil = 1;
    showSpellName('Expecto Patronum!');
    ELD.audio.play('patronum');
    flashScreen('rgba(225,240,255,0.85)');
    const list = combat.enemies.slice();
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e.alive) continue;
      const dxe = e.pos.x - P.pos.x, dze = e.pos.z - P.pos.z;
      if (dxe * dxe + dze * dze > CFG.PATRONUM_RADIUS * CFG.PATRONUM_RADIUS) continue;
      applyHit(e, 'patronum', null);
    }
  }

  // --- player bolts ------------------------------------------------------
  const BOLT_DEF = {
    stupefy: { name: 'Stupefy', core: 0xffb4a4, glow: 0xff2a1a, size: 0.95 },
    expelliarmus: { name: 'Expelliarmus', core: 0xffffff, glow: 0xffd66e, size: 1.15 }
  };
  const boltPool = { stupefy: [], expelliarmus: [] };
  const bolts = [];

  function makeBolt(type) {
    const g = new THREE.Group();
    U.keep(g);
    g.add(U.keep(new THREE.Mesh(RES.boltGeo, RES.boltMats[type].core)));
    const size = BOLT_DEF[type].size;
    const glow = U.keep(new THREE.Sprite(RES.boltMats[type].glow));
    glow.scale.set(size, size, 1);
    g.add(glow);
    const trails = [];
    for (let i = 1; i <= 3; i++) {
      const s = U.keep(new THREE.Sprite(RES.boltMats[type].glow));
      const sc = size * (1 - i * 0.22);
      s.scale.set(sc, sc, 1);
      g.add(s);
      trails.push(s);
    }
    return { obj: g, type: type, vel: new THREE.Vector3(), life: 0, trails: trails };
  }
  function getBolt(type) { const b = boltPool[type].pop() || makeBolt(type); scene.add(b.obj); return b; }
  function releaseBolt(b) { scene.remove(b.obj); boltPool[b.type].push(b); }

  function fireBolt(type) {
    camera.updateMatrixWorld(true);
    wandTip.getWorldPosition(tmpV2);
    camera.getWorldDirection(tmpV3);
    tmpV4.copy(camera.position).addScaledVector(tmpV3, 35);
    const b = getBolt(type);
    b.obj.position.copy(tmpV2);
    b.vel.copy(tmpV4).sub(tmpV2).normalize();
    for (let i = 0; i < b.trails.length; i++) b.trails[i].position.copy(b.vel).multiplyScalar(-0.32 * (i + 1));
    b.vel.multiplyScalar(CFG.BOLT_SPEED);
    b.life = CFG.BOLT_LIFE;
    bolts.push(b);
    wandAnim.recoil = 1;
    showSpellName(BOLT_DEF[type].name + '!');
    ELD.audio.play(type);
  }

  function segDistSq(p0x, p0y, p0z, p1x, p1y, p1z, cx, cy, cz) {
    const vx = p1x - p0x, vy = p1y - p0y, vz = p1z - p0z;
    const wx = cx - p0x, wy = cy - p0y, wz = cz - p0z;
    const vv = vx * vx + vy * vy + vz * vz;
    let k = vv > 0 ? (wx * vx + wy * vy + wz * vz) / vv : 0;
    k = k < 0 ? 0 : (k > 1 ? 1 : k);
    const dx = p0x + vx * k - cx, dy = p0y + vy * k - cy, dz = p0z + vz * k - cz;
    return dx * dx + dy * dy + dz * dz;
  }

  function solidAt(x, y, z) {
    if (y < 0.03) return true;
    const a = ELD.area;
    if (!a) return false;
    const b = a.bounds;
    if (b && (x < b.minX - 0.5 || x > b.maxX + 0.5 || z < b.minZ - 0.5 || z > b.maxZ + 0.5)) return true;
    const cs = a.colliders;
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i];
      const h = c.h === undefined ? 99 : c.h;
      if (y < h && x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
    }
    return false;
  }

  function updateBolts(dt) {
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      const p = b.obj.position;
      const p0x = p.x, p0y = p.y, p0z = p.z;
      p.addScaledVector(b.vel, dt);
      b.life -= dt;
      let hit = null;
      for (let j = 0; j < combat.enemies.length; j++) {
        const e = combat.enemies[j];
        if (!e.alive) continue;
        const r = e.def.radius || 1.1;
        if (segDistSq(p0x, p0y, p0z, p.x, p.y, p.z, e.pos.x, e.pos.y, e.pos.z) < r * r) { hit = e; break; }
      }
      if (hit) {
        spawnSpark(p, BOLT_DEF[b.type].glow, 1);
        applyHit(hit, b.type, b.vel);
        releaseBolt(b); bolts.splice(i, 1);
        continue;
      }
      const solid = solidAt(p.x, p.y, p.z);
      if (solid || b.life <= 0) {
        if (solid) spawnSpark(p, BOLT_DEF[b.type].glow, 0.7);
        releaseBolt(b); bolts.splice(i, 1);
      }
    }
  }
  function clearBolts() {
    for (let i = 0; i < bolts.length; i++) releaseBolt(bolts[i]);
    bolts.length = 0;
  }

  // --- enemy bolts --------------------------------------------------------
  const eBoltMats = {};
  const eBoltPool = [];
  const eBolts = [];
  function eBoltMat(color) {
    if (eBoltMats[color]) return eBoltMats[color];
    const m = new THREE.SpriteMaterial({ map: RES.glowTex, color: new THREE.Color(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    U.keep(m);
    eBoltMats[color] = m;
    return m;
  }
  function makeEBolt() {
    const g = U.keep(new THREE.Group());
    const core = U.keep(new THREE.Mesh(RES.boltGeo, RES.eBoltCore));
    core.scale.setScalar(1.3);
    g.add(core);
    const glow = U.keep(new THREE.Sprite(eBoltMat('#b06cff')));
    glow.scale.set(1.3, 1.3, 1);
    g.add(glow);
    const trail = U.keep(new THREE.Sprite(eBoltMat('#b06cff')));
    trail.scale.set(0.8, 0.8, 1);
    g.add(trail);
    return { obj: g, glow: glow, trail: trail, vel: new THREE.Vector3(), life: 0, damage: 12, color: 0xb06cff };
  }
  function enemyBolt(o) {
    if (!scene || !o || !o.from || !o.to) return null;
    const b = eBoltPool.pop() || makeEBolt();
    const color = o.color || '#b06cff';
    const m = eBoltMat(color);
    b.glow.material = m; b.trail.material = m;
    b.color = new THREE.Color(color).getHex();
    b.obj.position.set(o.from.x, o.from.y, o.from.z);
    b.vel.set(o.to.x - o.from.x, o.to.y - o.from.y, o.to.z - o.from.z);
    if (b.vel.lengthSq() < 1e-6) b.vel.set(0, 0, -1);
    b.vel.normalize();
    b.trail.position.copy(b.vel).multiplyScalar(-0.45);
    b.vel.multiplyScalar(o.speed || 14);
    b.life = 5;
    b.damage = o.damage === undefined ? 12 : o.damage;
    scene.add(b.obj);
    eBolts.push(b);
    ELD.audio.play('enemyCast');
    return b;
  }
  function releaseEBolt(b) { scene.remove(b.obj); eBoltPool.push(b); }
  function updateEBolts(dt) {
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    for (let i = eBolts.length - 1; i >= 0; i--) {
      const b = eBolts[i];
      const p = b.obj.position;
      const p0x = p.x, p0y = p.y, p0z = p.z;
      p.addScaledVector(b.vel, dt);
      b.life -= dt;
      if (segDistSq(p0x, p0y, p0z, p.x, p.y, p.z, cx, cy, cz) < 0.64) {
        spawnSpark(p, b.color, 1.2);
        P.damage(b.damage, 'bolt');
        releaseEBolt(b); eBolts.splice(i, 1);
        continue;
      }
      const solid = solidAt(p.x, p.y, p.z);
      if (solid || b.life <= 0) {
        if (solid) spawnSpark(p, b.color, 0.8);
        releaseEBolt(b); eBolts.splice(i, 1);
      }
    }
  }
  function clearEBolts() {
    for (let i = 0; i < eBolts.length; i++) releaseEBolt(eBolts[i]);
    eBolts.length = 0;
  }

  // --- enemies -------------------------------------------------------------
  const dying = [];
  const combat = ELD.combat = {
    enemies: [],
    spawnEnemy: function (def) { return spawnEnemy(def || {}); },
    spawnShade: function (x, y, z, opts) {
      opts = opts || {};
      const def = { kind: 'shade', model: makeModel('shade'), x: x, y: (y === undefined || y === null) ? 1.5 : y, z: z, hp: 2, tag: opts.tag };
      for (const k in opts) if (k !== 'tag' && Object.prototype.hasOwnProperty.call(opts, k)) def[k] = opts[k];
      const e = spawnEnemy(def);
      if (e) {
        ELD.audio.play('shadeSpawn');
        tmpV1.set(e.pos.x, e.pos.y, e.pos.z);
        spawnSpark(tmpV1, 0x7a3cff, 2.2);
      }
      return e;
    },
    spawnDummy: function (x, z, opts) {
      opts = opts || {};
      const e = spawnEnemy({ kind: 'dummy', model: makeModel('dummy'), x: x, y: 0, z: z, hp: 999, invulnerable: true, tag: opts.tag, radius: opts.radius || 0.9 });
      if (e) { e.data.moving = !!opts.moving; e.data.baseX = x; e.data.baseZ = z; e.data.phase = Math.random() * 6; }
      return e;
    },
    enemyBolt: function (o) { return enemyBolt(o); },
    kill: function (e) { killEnemy(e); },
    clear: function () { clearCombat(); },
    count: function (tag) {
      let n = 0;
      for (let i = 0; i < combat.enemies.length; i++) {
        const e = combat.enemies[i];
        if (e.alive && (tag === undefined || tag === null || e.tag === tag)) n++;
      }
      return n;
    },
    // CONTRACT-NOTE: extra — apply a spell hit programmatically (runs onHit + default behaviour).
    hit: function (e, spellId) { if (e && e.alive) applyHit(e, spellId || 'stupefy', null); }
  };

  function makeModel(id) {
    if (ELD.chars && typeof ELD.chars.create === 'function') {
      try { const m = ELD.chars.create(id); if (m && m.object3D) return m; } catch (e) { console.error('[ELD] chars.create("' + id + '") failed', e); }
    }
    return fallbackModel(id);
  }

  function fallbackModel(id) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(RES.fbBody, id === 'dummy' ? RES.fbDummy : RES.fbShade);
    body.position.y = 0.8;
    g.add(body);
    return { id: id, object3D: g, height: 1.6, update: function () {}, lookAt: null, setTalking: function () {}, setPose: function () {}, setVisible: function (v) { g.visible = v; }, dispose: function () {} };
  }

  function spawnEnemy(def) {
    if (!scene) return null;
    const model = def.model || makeModel(def.kind === 'dummy' ? 'dummy' : (def.kind === 'boss' ? 'morrow' : 'shade'));
    def.model = model;
    const kind = def.kind || 'shade';
    def.kind = kind;
    const height = (model && model.height) || 1.6;
    const centerH = height * 0.5;
    if (def.speed === undefined) def.speed = 2.4;
    if (def.hover === undefined) def.hover = kind === 'shade' ? 1.4 : centerH;
    if (def.drainRange === undefined) def.drainRange = 1.9;
    if (def.drainDps === undefined) def.drainDps = 10;
    if (def.radius === undefined) def.radius = 1.1;
    const hp = def.hp === undefined ? 2 : def.hp;
    const e = {
      def: def, model: model, pos: new THREE.Vector3(def.x || 0, kind === 'shade' ? (def.y === undefined ? def.hover : def.y) : def.hover, def.z || 0),
      hp: hp, maxHp: hp, stunned: 0, shielded: false, alive: true, tag: def.tag, data: {},
      _centerH: centerH, _kbx: 0, _kbz: 0, _wob: 0, _phase: Math.random() * 10, _shieldMesh: null, _deathT: 0
    };
    const parent = (ELD.area && ELD.area.group) ? ELD.area.group : scene;
    if (model && model.object3D) {
      model.object3D.position.set(e.pos.x, e.pos.y - centerH, e.pos.z);
      parent.add(model.object3D);
    }
    combat.enemies.push(e);
    return e;
  }

  function removeEnemyModel(e) {
    if (e._shieldMesh && e._shieldMesh.parent) e._shieldMesh.parent.remove(e._shieldMesh);
    e._shieldMesh = null;
    const m = e.model;
    if (!m) return;
    if (m.object3D && m.object3D.parent) m.object3D.parent.remove(m.object3D);
    try { if (typeof m.dispose === 'function') m.dispose(); } catch (err) { /* ignore */ }
  }

  function killEnemy(e) {
    if (!e || !e.alive) return;
    e.alive = false;
    const i = combat.enemies.indexOf(e);
    if (i >= 0) combat.enemies.splice(i, 1);
    if (e._shieldMesh) e._shieldMesh.visible = false;
    e._deathT = 0;
    dying.push(e);
    tmpV1.copy(e.pos);
    spawnSpark(tmpV1, e.def.kind === 'boss' ? 0xffd27a : 0x9a5cff, 2.6);
    ELD.audio.play(e.def.kind === 'boss' ? 'bossHit' : 'shadeDeath');
    ELD.emit('enemyKilled', { enemy: e });
  }

  function clearCombat() {
    const all = combat.enemies.concat(dying);
    for (let i = 0; i < all.length; i++) { all[i].alive = false; removeEnemyModel(all[i]); }
    combat.enemies.length = 0;
    dying.length = 0;
    clearBolts();
    clearEBolts();
    clearEffects();
  }

  function applyHit(e, spellId, vel) {
    if (!e.alive) return;
    if (typeof e.def.onHit === 'function') {
      let r = false;
      try { r = e.def.onHit(e, spellId); } catch (err) { console.error('[ELD] onHit failed', err); r = false; }
      if (!r || !e.alive) return;
    }
    defaultHit(e, spellId, vel);
  }

  function defaultHit(e, spellId, vel) {
    if (e.def.kind === 'dummy') {
      e._wob = 1;
      ELD.audio.play('hit');
      ELD.emit('dummyHit', { enemy: e, spellId: spellId });
      return;
    }
    if (spellId === 'patronum') { killEnemy(e); return; }
    if (e.shielded) {
      ELD.audio.play('shield');
      return;
    }
    const boss = e.def.kind === 'boss';
    ELD.audio.play(boss ? 'bossHit' : 'hit');
    if (spellId === 'stupefy') {
      e.stunned = Math.max(e.stunned, CFG.STUN_STUPEFY);
    } else if (spellId === 'expelliarmus') {
      e.stunned = Math.max(e.stunned, CFG.STUN_EXPELL);
      let dx = 0, dz = 0;
      if (vel) { dx = vel.x; dz = vel.z; } else { dx = e.pos.x - P.pos.x; dz = e.pos.z - P.pos.z; }
      const l = Math.sqrt(dx * dx + dz * dz) || 1;
      // v0/k = distance with exponential decay k = 8
      e._kbx = dx / l * CFG.KNOCKBACK * 8;
      e._kbz = dz / l * CFG.KNOCKBACK * 8;
    }
    if (!e.def.invulnerable) {
      e.hp -= 1;
      if (e.hp <= 0) killEnemy(e);
    }
  }

  function pushOutBox(p, c, pad) {
    const minX = c.minX - pad, maxX = c.maxX + pad, minZ = c.minZ - pad, maxZ = c.maxZ + pad;
    if (p.x <= minX || p.x >= maxX || p.z <= minZ || p.z >= maxZ) return false;
    const dl = p.x - minX, dr = maxX - p.x, dn = p.z - minZ, ds = maxZ - p.z;
    const m = Math.min(dl, dr, dn, ds);
    if (m === dl) p.x = minX;
    else if (m === dr) p.x = maxX;
    else if (m === dn) p.z = minZ;
    else p.z = maxZ;
    return true;
  }

  function collideXZ(p, pad, minH) {
    const a = ELD.area;
    if (!a) return;
    const cs = a.colliders;
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < cs.length; i++) {
        const c = cs[i];
        if (minH !== undefined && (c.h === undefined ? 99 : c.h) < minH) continue;
        pushOutBox(p, c, pad);
      }
    }
    const b = a.bounds;
    if (b) {
      p.x = Math.max(b.minX + pad, Math.min(b.maxX - pad, p.x));
      p.z = Math.max(b.minZ + pad, Math.min(b.maxZ - pad, p.z));
    }
  }

  function faceModel(m, x, z, dt) {
    if (!m || !m.object3D) return;
    if (typeof m.lookAt === 'function') { try { m.lookAt(x, z); } catch (err) { /* ignore */ } return; }
    const o = m.object3D;
    const target = Math.atan2(-(x - o.position.x), -(z - o.position.z));
    let d = target - o.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    o.rotation.y += d * Math.min(1, dt * 6);
  }

  const iterBuf = [];
  function updateEnemies(dt, t, paused) {
    let drain = 0;
    iterBuf.length = 0;
    for (let i = 0; i < combat.enemies.length; i++) iterBuf.push(combat.enemies[i]);
    const list = iterBuf;
    const px = P.pos.x, pz = P.pos.z;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      const def = e.def;
      if (!e.alive) continue;
      if (!paused) {
        e.stunned = Math.max(0, e.stunned - dt);
        // knockback
        if (e._kbx !== 0 || e._kbz !== 0) {
          e.pos.x += e._kbx * dt; e.pos.z += e._kbz * dt;
          const f = Math.exp(-8 * dt);
          e._kbx *= f; e._kbz *= f;
          if (Math.abs(e._kbx) + Math.abs(e._kbz) < 0.05) { e._kbx = 0; e._kbz = 0; }
        }
        if (def.kind === 'shade') {
          const dx = px - e.pos.x, dz = pz - e.pos.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (e.stunned <= 0 && d > 0.95) {
            const step = Math.min(d - 0.95, (def.speed || 2.4) * dt);
            e.pos.x += dx / d * step; e.pos.z += dz / d * step;
          }
          const targetY = def.hover + Math.sin(t * 2.1 + e._phase) * 0.15 + (e.stunned > 0 ? -0.15 : 0);
          e.pos.y = U.damp(e.pos.y, targetY, 3, dt);
          if (e.stunned <= 0 && d < def.drainRange && P.health > 0) drain += (def.drainDps || 0) * dt;
        } else if (def.kind === 'dummy') {
          if (e.data.moving) {
            e.data.phase += dt * 1.3;
            e.pos.x = (e.data.baseX || 0) + Math.sin(e.data.phase) * 2.2;
          }
        }
        if (typeof def.update === 'function') {
          try { def.update(e, dt, t); } catch (err) { console.error('[ELD] enemy update failed', err); }
          if (!e.alive) continue;
        }
        if (def.kind !== 'dummy') collideXZ(e.pos, 0.35, 1.2);
      }
      // visuals
      const m = e.model;
      if (m && m.object3D) {
        const o = m.object3D;
        let jx = 0, jz = 0;
        if (e.stunned > 0 && def.kind !== 'dummy') { jx = Math.sin(t * 40 + e._phase) * 0.03; jz = Math.cos(t * 37 + e._phase) * 0.03; }
        o.position.set(e.pos.x + jx, e.pos.y - e._centerH, e.pos.z + jz);
        if (def.kind === 'dummy') {
          e._wob = Math.max(0, e._wob - dt * 1.8);
          o.rotation.z = Math.sin(t * 26) * 0.16 * e._wob;
          faceModel(m, px, pz, dt);
        } else if (!paused && e.stunned <= 0) {
          faceModel(m, px, pz, dt);
        }
        if (typeof m.update === 'function') { try { m.update(dt, t); } catch (err) { /* ignore */ } }
      }
      // shield bubble
      if (e.shielded) {
        if (!e._shieldMesh) {
          e._shieldMesh = new THREE.Mesh(RES.shieldGeo, RES.shieldMat);
          U.keep(e._shieldMesh);
          scene.add(e._shieldMesh);
        }
        const s = e._centerH * 1.45 + Math.sin(t * 3) * 0.04;
        e._shieldMesh.visible = true;
        e._shieldMesh.position.copy(e.pos);
        e._shieldMesh.scale.set(s * 0.85, s, s * 0.85);
        e._shieldMesh.rotation.y = t * 0.6;
      } else if (e._shieldMesh) {
        e._shieldMesh.visible = false;
      }
    }
    // separation between non-dummy enemies
    if (!paused) {
      const live = combat.enemies;
      for (let i = 0; i < live.length; i++) {
        const a = live[i];
        if (a.def.kind === 'dummy') continue;
        for (let j = i + 1; j < live.length; j++) {
          const b = live[j];
          if (b.def.kind === 'dummy') continue;
          const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
          const d2 = dx * dx + dz * dz;
          const min = 1.1;
          if (d2 < min * min && d2 > 1e-6) {
            const d = Math.sqrt(d2), push = (min - d) * 0.5;
            a.pos.x -= dx / d * push; a.pos.z -= dz / d * push;
            b.pos.x += dx / d * push; b.pos.z += dz / d * push;
          }
        }
      }
    }
    // dying animation
    for (let i = dying.length - 1; i >= 0; i--) {
      const e = dying[i];
      e._deathT += dt;
      const k = Math.min(1, e._deathT / 0.55);
      const m = e.model;
      if (m && m.object3D) {
        const s = Math.max(0.01, 1 - k);
        m.object3D.scale.set(s, s * (1 + k * 0.6), s);
        m.object3D.position.y = e.pos.y - e._centerH + k * 0.8;
        m.object3D.rotation.y += dt * 8;
      }
      if (k >= 1) { removeEnemyModel(e); dying.splice(i, 1); }
    }
    return drain;
  }

  // =====================================================================
  // 13. INPUT & POINTER LOCK
  // =====================================================================
  const keys = {};
  const mouse = { left: false, right: false };
  let pointerLocked = false;
  let expectUnlock = false;

  function clearInput() {
    for (const k in keys) keys[k] = false;
    mouse.left = mouse.right = false;
    castBuf.stupefy = castBuf.expelliarmus = 0;
  }
  function noteLockFail() {
    if (lockFailShown || ELD.state !== 'playing') return;
    lockFailShown = true;
    toast(ELD.t('lockFail'), 3600, 'small');
  }
  function requestLock(quiet) {
    if (!renderer) return;
    const c = renderer.domElement;
    if (document.pointerLockElement === c) return;
    if (typeof c.requestPointerLock !== 'function') { if (!quiet) noteLockFail(); return; }
    try {
      const r = c.requestPointerLock();
      if (r && typeof r.catch === 'function') r.catch(function () { if (!quiet) noteLockFail(); });
    } catch (e) { if (!quiet) noteLockFail(); }
  }
  function exitLock() {
    try {
      if (document.pointerLockElement && typeof document.exitPointerLock === 'function') document.exitPointerLock();
    } catch (e) { /* ignore */ }
  }
  function releaseLock() {
    if (document.pointerLockElement) { expectUnlock = true; exitLock(); }
  }
  function blurActive() {
    try { const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); } catch (e) { /* ignore */ }
  }
  function isTyping() {
    const a = document.activeElement;
    if (!a) return false;
    const tag = a.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || a.isContentEditable;
  }

  function pause() {
    if (ELD.state !== 'playing') return;
    setState('paused');
    exitLock();
  }
  function resume() {
    if (ELD.state !== 'paused') return;
    initAudio();
    blurActive();
    setState('playing');
    if (!dlg.choicesShown) requestLock();
  }

  const BLOCK_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  function onKeyDown(e) {
    if (isTyping()) return;
    initAudio();
    const code = e.code;
    if (creditsState) {
      if (!e.repeat && (code === 'KeyE' || code === 'Escape' || code === 'Enter' || code === 'Space')) { e.preventDefault(); creditsState.finish(); }
      return;
    }
    if (code === 'KeyH' && !e.repeat) { ELD.setLang(ELD.lang === 'he' ? 'en' : 'he'); return; }
    if (code === 'KeyM' && !e.repeat) { ELD.audio.toggleMute(); return; }
    if (ELD.state === 'paused') {
      if (!e.repeat && (code === 'KeyP' || code === 'Escape')) resume();
      return;
    }
    if (ELD.state !== 'playing') return;
    if (BLOCK_KEYS.indexOf(code) >= 0) e.preventDefault();
    keys[code] = true;
    if (e.repeat) return;
    if (code === 'KeyP' || code === 'Escape') { pause(); return; }
    if (dlg.open) {
      if (code === 'KeyE' || code === 'Space' || code === 'Enter' || code === 'NumpadEnter') { e.preventDefault(); advanceDlg(true); return; }
      const m = /^(?:Digit|Numpad)([1-4])$/.exec(code);
      if (m) chooseDlg(parseInt(m[1], 10) - 1, true);
      return;
    }
    if (code === 'KeyE') { tryInteract(); return; }
    if (code === 'KeyQ') castSpell('patronum');
    else if (code === 'KeyL') castSpell('lumos');
  }
  function onKeyUp(e) { keys[e.code] = false; }

  function onMouseMove(e) {
    if (ELD.state !== 'playing' || P.frozen || dlg.open) return;
    if (!pointerLocked && e.target !== renderer.domElement) return;
    const rx = e.movementX || 0, ry = e.movementY || 0;
    // Discard implausible spikes (browsers emit bogus deltas around pointer-lock transitions).
    if (Math.abs(rx) > 350 || Math.abs(ry) > 350) return;
    const mx = Math.max(-250, Math.min(250, rx));
    const my = Math.max(-250, Math.min(250, ry));
    P.yaw -= mx * CFG.SENS;
    P.pitch = Math.max(-CFG.PITCH_LIMIT, Math.min(CFG.PITCH_LIMIT, P.pitch - my * CFG.SENS));
  }
  function onCanvasDown(e) {
    initAudio();
    if (creditsState) { creditsState.finish(); return; }
    if (ELD.state !== 'playing') return;
    if (dlg.open) {
      if (e.button === 0) advanceDlg(true);
      return;
    }
    if (e.button === 0) { mouse.left = true; if (!castSpell('stupefy')) castBuf.stupefy = 0.3; }
    else if (e.button === 2) { mouse.right = true; if (!castSpell('expelliarmus')) castBuf.expelliarmus = 0.3; }
    if (!pointerLocked) requestLock();
  }
  function onMouseUp(e) {
    if (e.button === 0) mouse.left = false;
    else if (e.button === 2) mouse.right = false;
  }
  function onLockChange() {
    pointerLocked = !!renderer && document.pointerLockElement === renderer.domElement;
    if (pointerLocked) {
      if (ELD.state !== 'playing' || dlg.choicesShown) { exitLock(); }
      return;
    }
    if (expectUnlock) { expectUnlock = false; return; }
    if (ELD.state === 'playing' && !dlg.choicesShown) pause();
  }

  // =====================================================================
  // 14. STATE, TITLE FLOW
  // =====================================================================
  function setState(s) {
    ELD.state = s;
    const b = document.body;
    b.classList.toggle('st-title', s === 'title');
    b.classList.toggle('st-playing', s === 'playing');
    b.classList.toggle('st-paused', s === 'paused');
    b.classList.toggle('st-ended', s === 'ended');
    if (el.hud) el.hud.classList.toggle('on', s === 'playing' || s === 'paused');
    if (el.pause) el.pause.classList.toggle('on', s === 'paused');
    if (el.title) el.title.classList.toggle('on', s === 'title');
    setWandVisible(s === 'playing' || s === 'paused');
    if (s !== 'playing') clearInput();
  }

  function closeDlgHard() {
    if (dlg.open) {
      dlg.last = undefined;
      closeDlg();
    }
  }

  function resetSession() {
    closeDlgHard();
    flushTimers();
    if (creditsState) creditsState.finish();
    el.chapterCard.classList.remove('on');
    chapterCur = null;
    objCur = null; renderObjective(false);
    markerPos = null; refreshMarker();
    bossCur = null; renderBoss();
    shardsCur = null; renderShards(false);
    ELD.ui.showHealth(false);
    el.toasts.textContent = '';
    userFrozen = false; cardActive = 0;
    P.health = P.maxHealth; downFired = false; hurtLevel = 0;
    cd.stupefy = cd.expelliarmus = cd.patronum = 0;
    ELD.spells.unlocked.lumos = ELD.spells.unlocked.stupefy = ELD.spells.unlocked.expelliarmus = ELD.spells.unlocked.patronum = false;
    newHint = null;
    setLumos(false);
    renderHints();
  }

  function applyTitleAmbient() {
    bgColor.setHex(0x060914);
    scene.background = bgColor;
    fog.color.setHex(0x060914);
    fog.density = 0.004;
    hemi.color.setHex(0x8090c0); hemi.groundColor.setHex(0x101018); hemi.intensity = 0.4;
    ELD.audio.music('night');
  }

  function showTitle() {
    resetSession();
    setState('title');
    exitLock();
    el.fade.style.transitionDuration = '0ms';
    el.fade.style.opacity = '0';
    fadeTarget = 0; fadeEndAt = 0;
    ELD.unloadArea();
    showTitleCard();
    ELD.emit('title');
  }

  function showTitleCard() {
    el.titleCard.hidden = false;
    el.newGameCard.hidden = true;
    const s = ELD.save.load();
    el.btnContinue.hidden = !(s && !s.completed);
  }

  function openNewGame() {
    el.titleCard.hidden = true;
    el.newGameCard.hidden = false;
    const s = ELD.save.load();
    el.ngWarn.hidden = !(s && !s.completed);
    const cur = ELD.profile && ELD.profile.name;
    el.ngName.value = (cur && cur !== DEFAULT_NAMES.he && cur !== DEFAULT_NAMES.en) ? cur : DEFAULT_NAMES[ELD.lang];
    const g = gender();
    const radios = document.querySelectorAll('input[name="ngGender"]');
    for (let i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === g;
    try { el.ngName.focus(); el.ngName.select(); } catch (e) { /* ignore */ }
  }

  function enterPlay() {
    initAudio();
    blurActive();
    resetSession();
    titleGroup.visible = !ELD.area;
    setState('playing');
    requestLock(true);
  }

  function startStory(save) {
    enterPlay();
    if (!ELD.story || typeof ELD.story.start !== 'function') { toast(ELD.t('storyMissing'), 4000); return; }
    try {
      const r = ELD.story.start(save || null);
      if (r && typeof r.catch === 'function') r.catch(function (e) { console.error('[ELD] story.start failed', e); });
    } catch (e) { console.error('[ELD] story.start failed', e); }
  }

  function submitNewGame(ev) {
    if (ev) ev.preventDefault();
    let name = String(el.ngName.value || '').replace(/\s+/g, ' ').trim().slice(0, 14);
    if (!name) name = DEFAULT_NAMES[ELD.lang];
    const gEl = document.querySelector('input[name="ngGender"]:checked');
    ELD.profile = { name: name, gender: gEl && gEl.value === 'f' ? 'f' : 'm' };
    startStory(null);
  }

  // =====================================================================
  // 15. LANGUAGE
  // =====================================================================
  ELD.setLang = function (l) {
    const old = ELD.lang;
    l = l === 'en' ? 'en' : 'he';
    ELD.lang = l;
    lsSet(CFG.KEY_LANG, l);
    if (ELD.profile && old !== l && ELD.profile.name === DEFAULT_NAMES[old]) ELD.profile.name = DEFAULT_NAMES[l];
    const root = document.documentElement;
    root.setAttribute('lang', l);
    root.setAttribute('dir', l === 'he' ? 'rtl' : 'ltr');
    document.title = ELD.t('pageTitle');
    const nodes = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < nodes.length; i++) nodes[i].textContent = ELD.t(nodes[i].getAttribute('data-i18n'));
    if (booted) {
      renderControls();
      renderObjective(false);
      renderShards(false);
      renderBoss();
      renderHints();
      refreshMuteUI();
      promptKey = '__';  // force prompt refresh
      if (dlg.open) renderDlgLine(true);
      if (chapterCur) { el.ccTitle.textContent = ELD.tx(chapterCur.title); el.ccSub.textContent = ELD.tx(chapterCur.subtitle); }
      if (el.newGameCard && !el.newGameCard.hidden && (el.ngName.value === DEFAULT_NAMES[old])) el.ngName.value = DEFAULT_NAMES[l];
    }
    ELD.emit('lang', l);
  };

  function renderControls() {
    if (!el.ctlList) return;
    el.ctlList.textContent = '';
    const list = ELD.t('controls');
    if (!Array.isArray(list)) return;
    for (let i = 0; i < list.length; i++) {
      const k = document.createElement('kbd'); k.textContent = list[i][0];
      const d = document.createElement('span'); d.textContent = list[i][1];
      el.ctlList.appendChild(k); el.ctlList.appendChild(d);
    }
  }

  // =====================================================================
  // 16. MARKER
  // =====================================================================
  function refreshMarker() {
    if (!markerGroup) return;
    markerGroup.visible = !!markerPos;
    if (markerPos) markerGroup.position.set(markerPos.x, markerPos.y, markerPos.z);
    if (!markerPos && el.arrow) el.arrow.classList.remove('on');
  }

  let arrowShown = false;
  function updateMarker(t) {
    if (!markerPos || !markerGroup) { if (arrowShown) { arrowShown = false; el.arrow.classList.remove('on'); } return; }
    const mp = markerParts;
    const dx = markerPos.x - camera.position.x, dy = markerPos.y - camera.position.y, dz = markerPos.z - camera.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const sc = 0.55 + Math.min(2.2, dist * 0.03);
    const bob = Math.sin(t * 2.4) * 0.12;
    mp.core.position.y = 0.35 + bob;
    mp.core.scale.set(sc, sc, 1);
    mp.halo.position.y = 0.35 + bob;
    const hs = sc * (1.9 + Math.sin(t * 3.1) * 0.25);
    mp.halo.scale.set(hs, hs, 1);
    mp.beam.scale.set(0.35 + dist * 0.004, 7, 1);
    mp.beam.position.y = 3.6;
    for (let i = 0; i < mp.sparks.length; i++) {
      const a = t * 1.6 + i * (Math.PI * 2 / mp.sparks.length);
      const r = 0.45 + Math.min(0.6, dist * 0.01);
      mp.sparks[i].position.set(Math.cos(a) * r, 0.35 + bob + Math.sin(t * 2.2 + i * 1.7) * 0.25 + 0.2, Math.sin(a) * r);
      const ss = 0.14 + 0.06 * Math.sin(t * 5 + i);
      mp.sparks[i].scale.set(ss * (1 + dist * 0.02), ss * (1 + dist * 0.02), 1);
    }
    // off-screen arrow
    if (ELD.state !== 'playing' || dlg.open) { if (arrowShown) { arrowShown = false; el.arrow.classList.remove('on'); } return; }
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    tmpV1.set(markerPos.x, markerPos.y + 0.4, markerPos.z).applyMatrix4(camera.matrixWorldInverse);
    const tanV = Math.tan(camera.fov * Math.PI / 360), tanH = tanV * camera.aspect;
    let nx, ny, onScreen = false;
    if (tmpV1.z < -0.1) {
      nx = (tmpV1.x / -tmpV1.z) / tanH; ny = (tmpV1.y / -tmpV1.z) / tanV;
      onScreen = nx > -0.92 && nx < 0.92 && ny > -0.88 && ny < 0.88;
    } else {
      // beside / behind the camera: use the camera-space direction
      nx = tmpV1.x / tanH; ny = tmpV1.y / tanV;
      if (Math.abs(nx) + Math.abs(ny) < 1e-3) ny = -1;
    }
    if (onScreen) { if (arrowShown) { arrowShown = false; el.arrow.classList.remove('on'); } return; }
    const ang = Math.atan2(ny, nx);
    const W = window.innerWidth, H = window.innerHeight;
    const cx = W / 2 + Math.cos(ang) * (W / 2 - 34);
    const cy = H / 2 - Math.sin(ang) * (H / 2 - 44);
    el.arrow.style.transform = 'translate(' + cx.toFixed(0) + 'px,' + cy.toFixed(0) + 'px)';
    el.arrowSvg.style.transform = 'rotate(' + (-ang).toFixed(3) + 'rad)';
    const dm = Math.round(Math.sqrt(dx * dx + dz * dz));
    if (el.arrowDist._v !== dm) { el.arrowDist._v = dm; el.arrowDist.textContent = dm + ' m'; }
    if (!arrowShown) { arrowShown = true; el.arrow.classList.add('on'); }
  }

  // =====================================================================
  // 17. BUILD THREE RESOURCES
  // =====================================================================
  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function stagTexture() {
    return U.canvasTexture(256, 256, function (g) {
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, 'rgba(220,240,255,0.55)');
      gr.addColorStop(0.5, 'rgba(160,200,255,0.18)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.save();
      g.shadowColor = 'rgba(200,230,255,1)'; g.shadowBlur = 16;
      g.fillStyle = 'rgba(240,250,255,0.95)'; g.strokeStyle = 'rgba(240,250,255,0.95)';
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.ellipse(118, 150, 52, 23, -0.05, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(146, 140); g.lineTo(172, 94); g.lineTo(190, 100); g.lineTo(170, 152); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(190, 94, 17, 10, 0.45, 0, Math.PI * 2); g.fill();
      g.lineWidth = 7; g.beginPath();
      [[82, 160, 74, 214], [98, 166, 96, 216], [144, 162, 152, 214], [158, 158, 170, 208]].forEach(function (l) { g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); });
      g.stroke();
      g.lineWidth = 5; g.beginPath(); g.moveTo(68, 142); g.lineTo(56, 132); g.stroke();
      g.lineWidth = 4; g.beginPath();
      g.moveTo(184, 86); g.lineTo(174, 54); g.lineTo(160, 30);
      g.moveTo(174, 54); g.lineTo(190, 40);
      g.moveTo(168, 42); g.lineTo(152, 46);
      g.moveTo(192, 86); g.lineTo(206, 58); g.lineTo(222, 36);
      g.moveTo(206, 58); g.lineTo(226, 60);
      g.moveTo(214, 46); g.lineTo(208, 26);
      g.stroke();
      g.restore();
    });
  }

  function beamTexture() {
    return U.canvasTexture(32, 256, function (g, w, h) {
      const gx = g.createLinearGradient(0, 0, w, 0);
      gx.addColorStop(0, 'rgba(255,210,110,0)');
      gx.addColorStop(0.5, 'rgba(255,230,160,1)');
      gx.addColorStop(1, 'rgba(255,210,110,0)');
      g.fillStyle = gx; g.fillRect(0, 0, w, h);
      const gy = g.createLinearGradient(0, 0, 0, h);
      gy.addColorStop(0, 'rgba(0,0,0,1)');
      gy.addColorStop(0.6, 'rgba(0,0,0,0.55)');
      gy.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = gy; g.fillRect(0, 0, w, h);
    });
  }

  function buildResources() {
    const glowTex = U.glowTexture('rgba(255,255,255,0.75)', 128);
    const res = {
      glowTex: glowTex,
      stagTex: U.keep(stagTexture()),
      beamTex: U.keep(beamTexture()),
      ringGeo: U.keep(new THREE.RingGeometry(0.86, 1, 72)),
      boltGeo: U.keep(new THREE.SphereGeometry(0.08, 10, 8)),
      boltMats: {},
      eBoltCore: U.keep(new THREE.MeshBasicMaterial({ color: 0xf0dcff })),
      shieldGeo: U.keep(new THREE.SphereGeometry(1, 24, 16)),
      shieldMat: U.keep(new THREE.MeshBasicMaterial({ color: 0x9a4cff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })),
      fbBody: U.keep(new THREE.CylinderGeometry(0.35, 0.45, 1.6, 10)),
      fbShade: U.keep(new THREE.MeshBasicMaterial({ color: 0x150a22 })),
      fbDummy: U.keep(new THREE.MeshLambertMaterial({ color: 0xb08a4a }))
    };
    Object.keys(BOLT_DEF).forEach(function (k) {
      res.boltMats[k] = {
        core: U.keep(new THREE.MeshBasicMaterial({ color: BOLT_DEF[k].core })),
        glow: U.keep(new THREE.SpriteMaterial({ map: glowTex, color: BOLT_DEF[k].glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
      };
    });
    return res;
  }

  function buildWand() {
    wand = U.keep(new THREE.Group());
    wandTip = U.keep(new THREE.Object3D());
    wandTipMat = U.keep(new THREE.MeshStandardMaterial({ color: 0xf0e6d0, emissive: 0xffffff, emissiveIntensity: 0.25 }));
    const wood = U.keep(new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: 0.65 }));
    const handleMat = U.keep(new THREE.MeshStandardMaterial({ color: 0x2c1a0e, roughness: 0.55 }));
    const copper = U.keep(new THREE.MeshStandardMaterial({ color: 0xc27a45, roughness: 0.4, metalness: 0.7 }));
    const shaft = new THREE.Mesh(U.keep(new THREE.CylinderGeometry(0.0055, 0.011, 0.34, 8)), wood);
    shaft.rotation.x = -Math.PI / 2; shaft.position.z = -0.17;
    const handle = new THREE.Mesh(U.keep(new THREE.CylinderGeometry(0.013, 0.016, 0.12, 10)), handleMat);
    handle.rotation.x = -Math.PI / 2; handle.position.z = 0.03;
    const band = new THREE.Mesh(U.keep(new THREE.CylinderGeometry(0.0145, 0.0145, 0.012, 10)), copper);
    band.rotation.x = -Math.PI / 2; band.position.z = -0.032;
    const pommel = new THREE.Mesh(U.keep(new THREE.SphereGeometry(0.017, 10, 8)), handleMat);
    pommel.position.z = 0.095;
    const tip = new THREE.Mesh(U.keep(new THREE.SphereGeometry(0.008, 8, 6)), wandTipMat);
    tip.position.z = -0.343;
    wandTip.position.z = -0.35;
    [shaft, handle, band, pommel, tip].forEach(function (m) { U.keep(m); wand.add(m); wandParts.push(m); });
    wand.add(wandTip);
    // Lumos light ALWAYS exists (intensity 0 when off) so no shader recompiles happen.
    lumosLight = U.keep(new THREE.PointLight(0xe8f0ff, 0, CFG.LUMOS_DISTANCE, 2));
    wandTip.add(lumosLight);
    lumosGlow = U.keep(new THREE.Sprite(U.keep(new THREE.SpriteMaterial({ map: RES.glowTex, color: 0xeaf4ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }))));
    lumosGlow.scale.set(0.16, 0.16, 1);
    lumosGlow.visible = false;
    wandTip.add(lumosGlow);
    wand.position.set(WAND_BASE.x, WAND_BASE.y, WAND_BASE.z);
    wand.rotation.set(WAND_BASE.rx, WAND_BASE.ry, 0);
    setWandVisible(false);
    camera.add(wand);
  }

  function animateWand(dt, walking, sprint, t) {
    if (walking) wandAnim.bob += dt * (sprint ? 13 : 8.5);
    wandAnim.amp += ((walking ? 1 : 0) - wandAnim.amp) * Math.min(1, dt * 8);
    wandAnim.recoil = Math.max(0, wandAnim.recoil - dt * 5);
    const b = wandAnim.bob, a = wandAnim.amp, r = wandAnim.recoil * wandAnim.recoil;
    const idle = Math.sin(t * 1.3) * 0.003;
    wand.position.set(WAND_BASE.x + Math.cos(b * 0.5) * 0.008 * a, WAND_BASE.y + Math.sin(b) * 0.012 * a + idle, WAND_BASE.z + r * 0.06);
    wand.rotation.x = WAND_BASE.rx + r * 0.4;
    if (ELD.spells.lumosOn) { const s = 0.15 + 0.02 * Math.sin(t * 6); lumosGlow.scale.set(s, s, 1); }
  }

  function buildMarker() {
    markerGroup = U.keep(new THREE.Group());
    function mk(map, color, opacity) {
      const m = U.keep(new THREE.SpriteMaterial({ map: map, color: color, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
      const s = U.keep(new THREE.Sprite(m));
      s.renderOrder = 999;
      markerGroup.add(s);
      return s;
    }
    const core = mk(RES.glowTex, 0xffe6a0, 1);
    const halo = mk(U.glowTexture('rgba(255,190,80,0.6)', 128), 0xffffff, 0.55);
    const beam = mk(RES.beamTex, 0xffd98a, 0.5);
    beam.center.set(0.5, 0.5);
    const sparks = [];
    for (let i = 0; i < 4; i++) sparks.push(mk(RES.glowTex, 0xfff2c4, 0.9));
    markerParts = { core: core, halo: halo, beam: beam, sparks: sparks };
    markerGroup.visible = false;
    scene.add(markerGroup);
  }

  function buildTitleBackdrop() {
    titleGroup = U.keep(new THREE.Group());
    // stars
    const N = 900, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.45;
      const R = 300;
      pos[i * 3] = Math.cos(th) * Math.cos(ph) * R;
      pos[i * 3 + 1] = Math.sin(ph) * R + 10;
      pos[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * R;
    }
    const sg = U.keep(new THREE.BufferGeometry());
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sm = U.keep(new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false }));
    titleGroup.add(U.keep(new THREE.Points(sg, sm)));
    // moon
    const moon = U.keep(new THREE.Sprite(U.keep(new THREE.SpriteMaterial({ map: U.glowTexture('rgba(220,230,255,0.8)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))));
    moon.position.set(-70, 70, -160); moon.scale.set(40, 40, 1);
    titleGroup.add(moon);
    // lake
    const lake = U.keep(new THREE.Mesh(U.keep(new THREE.PlaneGeometry(600, 400)), U.keep(new THREE.MeshBasicMaterial({ color: 0x010309, fog: false }))));
    lake.rotation.x = -Math.PI / 2; lake.position.set(0, 0, -80);
    titleGroup.add(lake);
    const refl = U.keep(new THREE.Sprite(U.keep(new THREE.SpriteMaterial({ map: U.glowTexture('rgba(150,170,230,0.5)', 128), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))));
    refl.position.set(-60, 0.5, -120); refl.scale.set(18, 4, 1);
    titleGroup.add(refl);
    // castle silhouette on a cliff with nine lantern towers
    const dark = U.keep(new THREE.MeshBasicMaterial({ color: 0x03040a, fog: false }));
    const roofMat = U.keep(new THREE.MeshBasicMaterial({ color: 0x050812, fog: false }));
    const winMat = U.keep(new THREE.MeshBasicMaterial({ color: 0xd9953a, fog: false }));
    const box = U.keep(new THREE.BoxGeometry(1, 1, 1));
    const cyl = U.keep(new THREE.CylinderGeometry(1, 1.08, 1, 10));
    const cone = U.keep(new THREE.ConeGeometry(1, 1, 10));
    const cliff = new THREE.Mesh(box, dark); cliff.scale.set(140, 16, 40); cliff.position.set(0, 8, -110); titleGroup.add(U.keep(cliff));
    const keepM = new THREE.Mesh(box, dark); keepM.scale.set(46, 26, 16); keepM.position.set(0, 29, -112); titleGroup.add(U.keep(keepM));
    const lanternTex = U.glowTexture('rgba(255,190,90,0.9)', 128);
    const towers = [];
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 12;
      const h = 30 + (4 - Math.abs(i - 4)) * 7 + (i % 2) * 4;
      const t = new THREE.Mesh(cyl, dark); t.scale.set(3, h, 3); t.position.set(x, 16 + h / 2, -104 - Math.abs(i - 4) * 1.5); titleGroup.add(U.keep(t));
      const r = new THREE.Mesh(cone, roofMat); r.scale.set(3.8, 9, 3.8); r.position.set(x, 16 + h + 4.5, t.position.z); titleGroup.add(U.keep(r));
      const lmat = U.keep(new THREE.SpriteMaterial({ map: lanternTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.95 }));
      const l = U.keep(new THREE.Sprite(lmat));
      l.position.set(x, 16 + h - 3, t.position.z + 3.2); l.scale.set(9, 9, 1);
      titleGroup.add(l);
      towers.push(l);
      for (let w = 0; w < 3; w++) {
        const win = new THREE.Mesh(box, winMat);
        win.scale.set(0.9, 1.6, 0.2);
        win.position.set(x + (w - 1) * 0.0, 20 + w * (h / 4), t.position.z + 3.05);
        if (Math.random() < 0.7) titleGroup.add(U.keep(win));
      }
    }
    for (let i = 0; i < 26; i++) {
      const win = new THREE.Mesh(box, winMat);
      win.scale.set(1.1, 2, 0.2);
      win.position.set(-20 + (i % 13) * 3.3, 22 + Math.floor(i / 13) * 8, -103.8);
      if (Math.random() < 0.65) titleGroup.add(U.keep(win));
    }
    titleGroup.userData.lanterns = towers;
    scene.add(titleGroup);
  }

  function updateTitle(t) {
    const L = titleGroup.userData.lanterns;
    for (let i = 0; i < L.length; i++) {
      const f = 0.85 + 0.1 * Math.sin(t * 3 + i * 1.7) + 0.05 * Math.sin(t * 11 + i);
      // the ninth (centre) lantern sputters
      L[i].material.opacity = i === 4 ? Math.max(0.05, 0.45 + 0.45 * Math.sin(t * 0.9) * Math.sin(t * 7.3)) : f;
    }
    const a = Math.sin(t * 0.05) * 0.25;
    camera.position.set(Math.sin(a) * 40, 9 + Math.sin(t * 0.11) * 1.2, 30 + Math.cos(a) * 6);
    camera.lookAt(0, -6, -110);
  }

  // =====================================================================
  // 18. PLAYER UPDATE
  // =====================================================================
  function updatePlayer(dt, t) {
    let moving = false, sprint = false;
    const canMove = !P.frozen && !dlg.open;
    if (canMove) {
      const fwd = ((keys.KeyW || keys.ArrowUp) ? 1 : 0) - ((keys.KeyS || keys.ArrowDown) ? 1 : 0);
      const str = ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);
      const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      const mx = -sy * fwd + cy * str, mz = -cy * fwd - sy * str;
      const len = Math.hypot(mx, mz);
      moving = len > 0.001;
      sprint = !!(keys.ShiftLeft || keys.ShiftRight);
      const sp = moving ? (sprint ? CFG.SPRINT : CFG.WALK) / len : 0;
      P.vel.x = mx * sp; P.vel.z = mz * sp;
      if (keys.Space && P.onGround) { P.vel.y = CFG.JUMP; P.onGround = false; }
    } else {
      P.vel.x = 0; P.vel.z = 0;
    }
    P.pos.x += P.vel.x * dt;
    P.pos.z += P.vel.z * dt;
    P.vel.y -= CFG.GRAVITY * dt;
    P.pos.y += P.vel.y * dt;
    if (P.pos.y <= 0) { P.pos.y = 0; P.vel.y = 0; P.onGround = true; }
    collideXZ(P.pos, CFG.RADIUS);
    if (faceTween) {
      const ft = faceTween;
      ft.t += dt;
      const k = Math.min(1, ft.t / ft.dur);
      const e = k * k * (3 - 2 * k);
      P.yaw = ft.y0 + ft.dy * e;
      P.pitch = ft.p0 + ((ft.p1 || 0) - ft.p0) * e;
      if (k >= 1) { faceTween = null; if (ft.resolve) ft.resolve(); }
    }
    syncCamera();
    animateWand(dt, moving && P.onGround, sprint, t);
  }

  // =====================================================================
  // 19. HUD
  // =====================================================================
  const hudCache = {};
  function setTxt(node, key, val) {
    const s = String(val);
    if (hudCache[key] !== s) { hudCache[key] = s; node.textContent = s; }
  }
  function updateHUD(dt) {
    if (ELD.state !== 'playing' && ELD.state !== 'paused') return;
    if (healthShown) {
      const hp = Math.ceil(P.health);
      setTxt(el.hpText, 'hp', hp);
      if (hudCache.hpBar !== hp) { hudCache.hpBar = hp; el.hpBar.style.width = (hp / P.maxHealth * 100) + '%'; }
    }
    const S = ELD.spells.unlocked;
    if (hudCache.patShown !== S.patronum) { hudCache.patShown = S.patronum; el.patWrap.hidden = !S.patronum; }
    if (S.patronum) {
      const ready = cd.patronum <= 0;
      setTxt(el.patText, 'pat', ready ? ELD.t('ready') : fmt(ELD.t('seconds'), { n: Math.ceil(cd.patronum) }));
      const p = (1 - cd.patronum / CFG.CD_PATRONUM).toFixed(2);
      if (hudCache.patP !== p) { hudCache.patP = p; el.patCd.style.setProperty('--p', p); }
      if (hudCache.patReady !== ready) { hudCache.patReady = ready; el.patCd.classList.toggle('ready', ready); }
    }
    if (hudCache.lumosShown !== S.lumos) { hudCache.lumosShown = S.lumos; el.lumosRow.hidden = !S.lumos; }
    if (S.lumos) setTxt(el.lumosText, 'lumos', ELD.spells.lumosOn ? ELD.t('on') : ELD.t('off'));
    hurtLevel = Math.max(0, hurtLevel - dt * 0.9);
    const v = Math.round(Math.min(1, hurtLevel) * 100) / 100;
    if (hudCache.vig !== v) { hudCache.vig = v; el.vignette.style.opacity = String(v); }
  }
  ELD.on('lang', function () { for (const k in hudCache) delete hudCache[k]; });

  // =====================================================================
  // 20. MAIN LOOP
  // =====================================================================
  let lastNow = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = lastNow ? (now - lastNow) / 1000 : 0;
    lastNow = now;
    if (!(dt > 0)) dt = 0;
    if (dt > CFG.DT_MAX) dt = CFG.DT_MAX;
    realTime += dt;
    try {
      musicTick();
      const st = ELD.state;
      if (st === 'playing') {
        gameTime += dt;
        tickTimers(dt);
        cd.stupefy = Math.max(0, cd.stupefy - dt);
        cd.expelliarmus = Math.max(0, cd.expelliarmus - dt);
        cd.patronum = Math.max(0, cd.patronum - dt);
        patronusLight.intensity = Math.max(0, patronusLight.intensity - dt * 2.5);
        updatePlayer(dt, gameTime);
        if (canCast()) {
          if (mouse.left || castBuf.stupefy > 0) { if (castSpell('stupefy')) castBuf.stupefy = 0; }
          if (mouse.right || castBuf.expelliarmus > 0) { if (castSpell('expelliarmus')) castBuf.expelliarmus = 0; }
        }
        castBuf.stupefy = Math.max(0, castBuf.stupefy - dt);
        castBuf.expelliarmus = Math.max(0, castBuf.expelliarmus - dt);
        updateTypewriter(dt);
        const combatPaused = P.frozen || dlg.open;
        updateBolts(dt);
        if (!combatPaused) updateEBolts(dt);
        const drain = updateEnemies(dt, gameTime, combatPaused);
        if (drain > 0) { P.damage(drain, 'drain'); }
        updateEffects(dt);
        if (ELD.area && typeof ELD.area.update === 'function') {
          try { ELD.area.update(dt, gameTime); } catch (e) { console.error('[ELD] area.update failed', e); }
        }
        ELD.emit('tick', dt, gameTime);
        updatePrompt();
        updateMarker(gameTime);
        updateHUD(dt);
      } else if (st === 'title') {
        updateTitle(realTime);
        if (promptKey !== '') { promptKey = ''; el.prompt.classList.remove('on'); }
      } else if (st === 'ended') {
        updateCredits(dt);
        updateEffects(dt);
        if (ELD.area && typeof ELD.area.update === 'function') {
          try { ELD.area.update(dt, gameTime); } catch (e) { /* ignore */ }
        }
      } else if (st === 'paused') {
        updateHUD(0);
      }
      if (creditsState && st !== 'ended') updateCredits(dt);
    } catch (e) {
      console.error('[ELD] frame error', e);
    }
    renderer.render(scene, camera);
  }

  // =====================================================================
  // 21. DEBUG HOOK
  // =====================================================================
  function storyInfo() {
    if (ELD.story && typeof ELD.story.info === 'function') {
      try { return ELD.story.info() || {}; } catch (e) { return {}; }
    }
    return {};
  }
  const debug = {
    info: function () {
      const si = storyInfo();
      return {
        state: ELD.state,
        area: ELD.area ? ELD.area.id : null,
        chapter: si.chapter === undefined ? null : si.chapter,
        step: si.step === undefined ? null : si.step,
        stepId: si.stepId === undefined ? null : si.stepId,
        objective: objCur ? ELD.tx(objCur) : null,
        health: Math.round(P.health * 100) / 100,
        enemies: combat.count(),
        dialogueOpen: dlg.open,
        shards: shardsCur !== null ? shardsCur : (si.shards === undefined ? null : si.shards),
        spells: Object.assign({}, ELD.spells.unlocked),
        lang: ELD.lang,
        pos: { x: Math.round(P.pos.x * 100) / 100, z: Math.round(P.pos.z * 100) / 100 },
        // extras
        time: Math.round(gameTime * 1000) / 1000,
        prompt: curPrompt && curPrompt.ref ? ELD.tx(curPrompt.ref.label) : null,
        lumos: ELD.spells.lumosOn,
        loading: loading,
        dialogueText: dlg.open ? dlg.lineText : null,
        choices: dlg.open && dlg.lines[dlg.idx].choices ? dlg.lines[dlg.idx].choices.map(function (c) { return ELD.tx(c.text); }) : null,
        frozen: P.frozen,
        marker: markerPos ? { x: markerPos.x, y: markerPos.y, z: markerPos.z } : null
      };
    },
    skip: function () { if (ELD.story && ELD.story.skip) return ELD.story.skip(); },
    goto: function (ch) {
      if (ELD.state === 'title') enterPlay();
      if (ELD.state === 'paused') resume();
      if (ELD.story && ELD.story.goto) return ELD.story.goto(ch);
    },
    teleport: function (xOrAnchor, z) {
      if (typeof xOrAnchor === 'string') {
        const a = ELD.getAnchor(xOrAnchor);
        if (!a) return false;
        P.teleport(a.x, a.z, typeof a.yaw === 'number' ? a.yaw : P.yaw);
        return true;
      }
      P.teleport(+xOrAnchor || 0, +z || 0, P.yaw);
      return true;
    },
    advance: function () {
      if (!dlg.open) return false;
      const line = dlg.lines[dlg.idx];
      if (line.choices && line.choices.length) return chooseDlg(0, false);
      if (dlg.typing) finishTyping();
      nextDlg();
      return true;
    },
    choose: function (i) {
      if (!dlg.open) return false;
      if (dlg.typing) finishTyping();
      return chooseDlg(i | 0, false);
    },
    killAll: function () {
      const l = combat.enemies.slice();
      for (let i = 0; i < l.length; i++) if (l[i].def.kind !== 'dummy') killEnemy(l[i]);
      return l.length;
    },
    heal: function () { P.heal(P.maxHealth); },
    interact: function () {
      if (dlg.open || loading || ELD.state !== 'playing') return false;
      const pf = P.frozen;
      // run the selection even if the player is momentarily frozen? No — keep contract semantics.
      if (pf) return false;
      return tryInteract();
    },
    setLang: function (l) { ELD.setLang(l); }
  };
  ELD.debug = debug;
  window.__eldDebug = debug;

  // =====================================================================
  // 22. BOOT
  // =====================================================================
  function $(id) { return document.getElementById(id); }

  function showFallback() {
    setState('title');
    if (el.title) el.title.classList.remove('on');
    if (el.fallback) el.fallback.classList.add('on');
    ELD.state = 'title';
  }

  ELD.boot = function () {
    if (booted) return;
    el = {
      game: $('game'), hud: $('hud'), vignette: $('vignette'), flash: $('flash'),
      objPanel: $('objPanel'), objText: $('objText'),
      hpWrap: $('hpWrap'), hpText: $('hpText'), hpBar: $('hpBar'),
      patWrap: $('patWrap'), patCd: $('patCd'), patText: $('patText'),
      lumosRow: $('lumosRow'), lumosText: $('lumosText'), muteText: $('muteText'),
      shardBox: $('shardBox'), shardGems: $('shardGems'), shardText: $('shardText'),
      bossWrap: $('bossWrap'), bossName: $('bossName'), bossFill: $('bossFill'),
      prompt: $('prompt'), promptText: $('promptText'), spellName: $('spellName'), hintRow: $('hintRow'),
      arrow: $('arrow'), arrowDist: $('arrowDist'),
      toasts: $('toasts'),
      dialogue: $('dialogue'), dlgPortrait: $('dlgPortrait'), dlgPortraitWrap: $('dlgPortraitWrap'),
      dlgName: $('dlgName'), dlgTitle: $('dlgTitle'), dlgText: $('dlgText'), dlgChoices: $('dlgChoices'), dlgNext: $('dlgNext'),
      fade: $('fade'), chapterCard: $('chapterCard'), ccTitle: $('ccTitle'), ccSub: $('ccSub'),
      credits: $('credits'), creditsRoll: $('creditsRoll'),
      title: $('title'), titleCard: $('titleCard'), newGameCard: $('newGameCard'),
      btnNew: $('btnNew'), btnContinue: $('btnContinue'), ngForm: $('ngForm'), ngName: $('ngName'), ngWarn: $('ngWarn'),
      btnBack: $('btnBack'), pause: $('pause'), btnResume: $('btnResume'), btnRestart: $('btnRestart'),
      btnMute: $('btnMute'), btnQuit: $('btnQuit'), ctlList: $('ctlList'), fallback: $('fallback')
    };
    el.arrowSvg = el.arrow ? el.arrow.querySelector('svg') : null;
    booted = true;
    ELD.setLang(ELD.lang);

    if (!window.THREE || !hasWebGL()) { showFallback(); return; }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      el.game.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      bgColor = new THREE.Color(0x05070f);
      scene.background = bgColor;
      fog = new THREE.FogExp2(0x05070f, 0.004);
      scene.fog = fog;
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 600);
      camera.rotation.order = 'YXZ';
      scene.add(camera);
      hemi = U.keep(new THREE.HemisphereLight(0x8090b0, 0x201810, 0.5));
      scene.add(hemi);
      patronusLight = U.keep(new THREE.PointLight(0xcfe6ff, 0, 30, 2));
      scene.add(patronusLight);
      tmpV2 = new THREE.Vector3(); tmpV3 = new THREE.Vector3(); tmpV4 = new THREE.Vector3();
      if (!(P.pos instanceof THREE.Vector3)) { P.pos = new THREE.Vector3(); P.vel = new THREE.Vector3(); }
      ELD.three.renderer = renderer; ELD.three.scene = scene; ELD.three.camera = camera;
      // CONTRACT-NOTE: extra — the core-owned hemisphere light (ambient is applied from area.ambient).
      ELD.three.hemi = hemi;
      RES = buildResources();
      buildWand();
      buildMarker();
      buildTitleBackdrop();
    } catch (e) {
      console.error('[ELD] renderer init failed', e);
      showFallback();
      return;
    }

    // listeners
    const canvas = renderer.domElement;
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onCanvasDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.dialogue.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.dialogue.addEventListener('mousedown', function (e) {
      if (e.target && e.target.closest && e.target.closest('.choice')) return;
      e.preventDefault();
      if (ELD.state === 'playing' && e.button === 0) advanceDlg(true);
    });
    el.credits.addEventListener('mousedown', function () { if (creditsState) creditsState.finish(); });
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', function () { noteLockFail(); });
    document.addEventListener('pointerdown', function () { initAudio(); }, true);
    window.addEventListener('blur', clearInput);
    document.addEventListener('visibilitychange', function () { if (document.hidden && ELD.state === 'playing') pause(); });
    window.addEventListener('resize', function () {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
    });

    el.btnNew.addEventListener('click', function () { initAudio(); openNewGame(); });
    el.btnContinue.addEventListener('click', function () {
      const s = ELD.save.load();
      if (!s) { showTitleCard(); return; }
      if (s.profile && s.profile.name) ELD.profile = { name: String(s.profile.name).slice(0, 14), gender: s.profile.gender === 'f' ? 'f' : 'm' };
      startStory(s);
    });
    el.btnBack.addEventListener('click', function () { showTitleCard(); });
    el.ngForm.addEventListener('submit', submitNewGame);
    Array.prototype.forEach.call(document.querySelectorAll('.langToggle'), function (b) {
      b.addEventListener('click', function () { ELD.setLang(ELD.lang === 'he' ? 'en' : 'he'); });
    });
    el.btnResume.addEventListener('click', resume);
    el.btnRestart.addEventListener('click', function () {
      resume();
      if (ELD.story && typeof ELD.story.restartStep === 'function') {
        try { ELD.story.restartStep(); } catch (e) { console.error('[ELD] restartStep failed', e); }
      }
    });
    el.btnMute.addEventListener('click', function () { ELD.audio.toggleMute(); });
    el.btnQuit.addEventListener('click', function () { showTitle(); });

    renderControls();
    renderHints();
    refreshMuteUI();
    applyTitleAmbient();
    showTitle();
    requestAnimationFrame(frame);
  };
})();
