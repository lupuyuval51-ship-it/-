/* EXIT 8 — game loop, input, UI and persistence. */
(function () {
  'use strict';
  const E = window.EXIT8;
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('exit8.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('exit8.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable: keep in memory */ } },
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const RADIUS = 0.28, EYE = 1.62, FOV = 68 * Math.PI / 180;

  const S = {
    mode: 'loading',
    lang: store.get('lang', 'he') === 'en' ? 'en' : 'he',
    settings: Object.assign({ sens: 1, vol: 0.8, reduceFlash: reducedMotion, quality: coarse ? 'low' : 'high', jumpscares: true }, store.get('settings', {})),
    found: new Set((store.get('found', []) || []).filter(id => E.ANOMALY_IDS.includes(id))),
    best: store.get('best', null),
    run: null, loop: null, pre: { normal: null, exit: null }, recent: [],
    player: { x: E.SPAWN.x, z: E.SPAWN.z, yaw: 0, pitch: 0, vx: 0, vz: 0, step: 0, bob: 0, moving: 0 },
    keys: {}, touch: { move: null, look: null }, touchMode: false, locked: false, dragLook: false, drag: null,
    flash: [0, 0, 0, 0], flick: { next: 0, until: 0, hold: 0, val: 1 }, time: 0, lastT: 0, cam: null, crackleT: 0,
    modeT: 0, returnTo: 'menu', newlyFound: new Set(),
    // Horror state: dreadSm eases towards how deep the run is; danger/shake/pulse react to what is near.
    dreadSm: 0, danger: 0, shake: 0, pulse: 0, hbT: 1, ambT: 9, zoom: 0, scare: null, caughtBy: null,
  };
  const t = (k, v) => E.t(S.lang, k, v);

  // ------------------------------------------------------------------ renderer
  const canvas = $('#view');
  let R = null;
  try { R = E.createRenderer(canvas); } catch (err) { console.error(err); R = null; }
  const audio = E.createAudio();
  let meshes = null, texSize = 512, preTimer = 0;

  function fatal(msg) {
    show('fatal');
    $('#fatalText').textContent = msg;
  }

  // ------------------------------------------------------------------ screens & i18n
  const SCREENS = ['loading', 'menu', 'pause', 'codex', 'settings', 'end', 'fatal'];
  function show(id) {
    for (const s of SCREENS) $('#' + s).classList.toggle('show', s === id);
    document.body.classList.toggle('playing', id == null && S.mode === 'playing');
    const first = id && $('#' + id + ' .btn.primary, #' + id + ' .btn');
    if (first && !S.touchMode) setTimeout(() => first.focus({ preventScroll: true }), 30);
  }

  function applyLang() {
    const L = E.STRINGS[S.lang];
    document.documentElement.lang = S.lang;
    document.documentElement.dir = L.dir;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $('#rulesList').innerHTML = '';
    for (const r of L.rules) { const li = document.createElement('li'); li.textContent = r; $('#rulesList').appendChild(li); }
    $('#controlsText').textContent = (coarse ? t('controlsTouch') + ' · ' : '') + t('controlsDesktop');
    $('#touchHint').textContent = t('controlsTouch');
    $('#btnLang').textContent = L.otherLang;
    $('#btnLang').lang = S.lang === 'he' ? 'en' : 'he';
    $('#btnPauseTouch').setAttribute('aria-label', t('pauseBtn'));
    $('#foundText').textContent = t('foundCount', { n: S.found.size, total: E.ANOMALIES.length });
    if (R && meshes) R.updateLayer(E.TEX.rules, E.drawTexture('rules', texSize, { lang: S.lang }));
  }

  let toastTimer = 0;
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2200);
  }

  // ------------------------------------------------------------------ fonts & textures
  function loadFonts() {
    const done = new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700;900&display=block&text=' + encodeURIComponent(E.JP_GLYPHS);
      link.onload = link.onerror = resolve;
      document.head.appendChild(link);
    }).then(() => Promise.all([
      document.fonts.load('900 40px "Noto Sans JP"', '出口'),
      document.fonts.load('700 40px "Noto Sans JP"', '出口'),
      document.fonts.load('600 30px Rubik', 'אבג Exit'),
      document.fonts.load('800 40px Rubik', 'אבג Exit'),
      document.fonts.load('900 40px Rubik', '0123456789'),
      document.fonts.load('700 30px Rubik', 'Exit'),
    ])).catch(() => {});
    return Promise.race([done, new Promise(r => setTimeout(r, 3000))]);
  }

  function uploadTextures() {
    texSize = S.settings.quality === 'low' ? 256 : 512;
    R.uploadTextures(E.drawAllTextures(texSize, { count: S.run ? S.run.count : 0, lang: S.lang }), texSize);
  }

  function updateSign() {
    R.updateLayer(E.TEX.sign, E.drawTexture('sign', texSize, { count: S.run ? S.run.count : 0 }));
  }

  // ------------------------------------------------------------------ loops
  function makeWorld(anomaly, exit) {
    const world = E.buildWorld({ anomaly, exit, seed: (Math.random() * 1e9) | 0 });
    return { world, mesh: R.createMesh(world.packed) };
  }

  function setLoop(pk) {
    if (S.loop && S.loop.mesh !== pk.mesh) R.deleteMesh(S.loop.mesh);
    S.loop = { world: pk.world, mesh: pk.mesh, actors: new E.Actors(pk.world), armed: false, anomaly: pk.world.anomaly };
    S.flick = { next: S.time + 1.5, until: 0, hold: 0, val: 1 };
    audio.setRumble(0);
    audio.setHum(pk.world.anomaly === 'lights_off' ? 0.45 : 1);
  }

  function pickNext() {
    const depth = S.run ? S.run.count / E.MAX_COUNT : 0;
    return E.pickAnomaly(Math.random, { chance: 0.55 + 0.25 * depth, intensity: depth, recent: S.recent, found: S.found });
  }

  function schedulePrebuild() {
    clearTimeout(preTimer);
    preTimer = setTimeout(prebuild, 150);
  }

  function prebuild() {
    if (!S.pre.normal) {
      S.pre.normal = makeWorld(pickNext(), false);
      if (S.run && S.run.count === E.MAX_COUNT - 1 && !S.pre.exit) { preTimer = setTimeout(prebuild, 80); }
      return;
    }
    if (S.run && S.run.count === E.MAX_COUNT - 1 && !S.pre.exit) S.pre.exit = makeWorld(null, true);
  }

  function takeNext(exit) {
    let pk;
    if (exit) { pk = S.pre.exit || makeWorld(null, true); S.pre.exit = null; }
    else { pk = S.pre.normal || makeWorld(pickNext(), false); S.pre.normal = null; }
    return pk;
  }

  /** The player left the loop by going forward or turning back. */
  function advance(type) {
    const L = S.loop, run = S.run;
    const res = E.resolve(run.count, L.anomaly, type);
    run.loops++;
    if (res.correct && L.anomaly) {
      if (!S.found.has(L.anomaly)) S.newlyFound.add(L.anomaly);
      S.found.add(L.anomaly);
      run.spotted.push(L.anomaly);
      store.set('found', [...S.found]);
    }
    if (!res.correct) run.mistakes++;
    if (L.anomaly) { S.recent.push(L.anomaly); if (S.recent.length > 8) S.recent.shift(); }
    run.count = res.count;
    setLoop(takeNext(run.count === E.MAX_COUNT));
    updateSign();
    schedulePrebuild();
    if (!res.correct) { audio.wrong(); S.fadeIn = 0.6; }
  }

  function respawn() {
    const P = S.player;
    Object.assign(P, { x: E.SPAWN.x, z: E.SPAWN.z, yaw: E.SPAWN.yaw, pitch: 0, vx: 0, vz: 0, step: 0, bob: 0 });
  }

  function startGame() {
    audio.init();
    audio.setVolume(S.settings.vol);
    S.run = { count: 0, loops: 0, mistakes: 0, timeMs: 0, spotted: [] };
    S.recent = [];
    Object.assign(S, { dreadSm: 0, danger: 0, shake: 0, pulse: 0, hbT: 1, ambT: 9, zoom: 0, scare: null, caughtBy: null });
    if (S.pre.normal) { R.deleteMesh(S.pre.normal.mesh); S.pre.normal = null; }
    setLoop(makeWorld(null, false));
    updateSign();
    respawn();
    S.mode = 'playing';
    show(null);
    requestLock();
    schedulePrebuild();
    document.body.classList.remove('hint-done');
    clearTimeout(S.hintTimer);
    S.hintTimer = setTimeout(() => document.body.classList.add('hint-done'), 9000);
  }

  // ------------------------------------------------------------------ pause / resume
  function pause() {
    if (S.mode !== 'playing') return;
    S.mode = 'paused';
    S.keys = {};
    S.touch.move = S.touch.look = null;
    updateJoy();
    audio.suspend();
    if (document.pointerLockElement) document.exitPointerLock();
    show('pause');
  }
  function resume() {
    if (S.mode !== 'paused') return;
    S.mode = 'playing';
    audio.resume();
    show(null);
    requestLock();
  }
  function toMenu() {
    S.mode = 'menu';
    if (document.pointerLockElement) document.exitPointerLock();
    audio.suspend();
    audio.setDread(0);
    Object.assign(S, { dreadSm: 0, danger: 0, shake: 0, pulse: 0, zoom: 0, scare: null });
    S.run = null;
    setLoop(makeWorld(null, false));
    updateSign();
    respawn();
    applyLang();
    show('menu');
  }

  function requestLock() {
    if (S.touchMode || S.dragLook) return;
    if (!canvas.requestPointerLock) { lockFailed(); return; }
    try {
      const p = canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => lockFailed());
    } catch (e) { lockFailed(); }
    // Some embedded frames ignore the request without any event; fall back to drag-to-look.
    setTimeout(() => { if (!S.locked && S.mode === 'playing' && !S.touchMode) lockFailed(); }, 900);
  }
  function lockFailed() {
    if (S.locked || S.mode !== 'playing') return;
    // Pointer lock works here but was refused for now (e.g. re-locking right after Esc): a click retries.
    if (S.lockWorked) { toast(t('clickToResume'), 2500); return; }
    if (S.dragLook) return;
    S.dragLook = true;
    toast(S.lang === 'he' ? 'גרור עם העכבר כדי להסתכל מסביב' : 'Drag with the mouse to look around', 3500);
  }
  document.addEventListener('pointerlockchange', () => {
    S.locked = document.pointerLockElement === canvas;
    if (S.locked) { S.dragLook = false; S.lockWorked = true; }
    if (!S.locked && S.mode === 'playing' && !S.touchMode && !S.dragLook) pause();
  });
  document.addEventListener('pointerlockerror', lockFailed);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', () => { S.keys = {}; });

  // ------------------------------------------------------------------ input: mouse & keyboard
  function look(dx, dy, k) {
    const P = S.player, s = S.settings.sens * k;
    P.yaw += dx * s;
    P.pitch = Math.max(-1.35, Math.min(1.35, P.pitch - dy * s));
  }
  document.addEventListener('mousemove', e => {
    if (S.mode !== 'playing') return;
    // Some browsers report a huge jump on the first event after locking; ignore those spikes.
    if (S.locked) { if (Math.abs(e.movementX) < 400 && Math.abs(e.movementY) < 400) look(e.movementX, e.movementY, 0.0022); }
    else if (S.drag) { look(e.clientX - S.drag.x, e.clientY - S.drag.y, 0.005); S.drag = { x: e.clientX, y: e.clientY }; }
  });
  canvas.addEventListener('mousedown', e => {
    if (S.mode !== 'playing' || S.touchMode) return;
    canvas.focus();
    if (!S.locked && !S.dragLook) requestLock();
    if (S.dragLook) S.drag = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', () => { S.drag = null; });

  const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'];
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (S.mode === 'playing') { pause(); e.preventDefault(); return; }
      if (S.mode === 'paused' && e.code === 'KeyP') { resume(); return; }
      if (e.code === 'Escape' && ['codex', 'settings'].includes(currentOverlay)) { closeOverlay(); return; }
    }
    if (S.mode !== 'playing') return;
    S.keys[e.code] = true;
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { S.keys[e.code] = false; });

  // ------------------------------------------------------------------ input: touch
  const joy = $('#joy');
  function updateJoy() {
    const m = S.touch.move;
    if (!m) { joy.style.display = 'none'; return; }
    joy.style.display = 'block';
    joy.style.left = m.x0 + 'px';
    joy.style.top = m.y0 + 'px';
    const dx = m.x - m.x0, dy = m.y - m.y0, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1;
    joy.firstElementChild.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    joy.classList.toggle('run', d > 47);
  }
  function enterTouchMode() {
    if (S.touchMode) return;
    S.touchMode = true;
    document.body.classList.add('touchmode');
  }
  canvas.addEventListener('touchstart', e => {
    enterTouchMode();
    if (S.mode !== 'playing') return;
    e.preventDefault();
    for (const tc of e.changedTouches) {
      if (tc.clientX < innerWidth * 0.45 && !S.touch.move) S.touch.move = { id: tc.identifier, x0: tc.clientX, y0: tc.clientY, x: tc.clientX, y: tc.clientY };
      else if (!S.touch.look) S.touch.look = { id: tc.identifier, x: tc.clientX, y: tc.clientY };
    }
    updateJoy();
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    if (S.mode !== 'playing') return;
    e.preventDefault();
    for (const tc of e.changedTouches) {
      const m = S.touch.move, l = S.touch.look;
      if (m && tc.identifier === m.id) { m.x = tc.clientX; m.y = tc.clientY; }
      if (l && tc.identifier === l.id) { look(tc.clientX - l.x, tc.clientY - l.y, 0.0055); l.x = tc.clientX; l.y = tc.clientY; }
    }
    updateJoy();
  }, { passive: false });
  const endTouch = e => {
    for (const tc of e.changedTouches) {
      if (S.touch.move && tc.identifier === S.touch.move.id) S.touch.move = null;
      if (S.touch.look && tc.identifier === S.touch.look.id) S.touch.look = null;
    }
    updateJoy();
  };
  canvas.addEventListener('touchend', endTouch);
  canvas.addEventListener('touchcancel', endTouch);
  window.addEventListener('touchstart', enterTouchMode, { passive: true });
  $('#btnPauseTouch').addEventListener('click', pause);

  // ------------------------------------------------------------------ simulation
  function inView(x, y, z) {
    const c = S.cam;
    if (!c) return false;
    const dx = x - c.x, dy = y - c.y, dz = z - c.z, d = Math.hypot(dx, dy, dz);
    if (d < 0.05) return true;
    const fx = Math.sin(c.yaw) * Math.cos(c.pitch), fy = Math.sin(c.pitch), fz = Math.cos(c.yaw) * Math.cos(c.pitch);
    const [w, h] = R.size();
    const half = Math.min(1.45, Math.atan(Math.tan(c.fov / 2) * w / h) + 0.22);
    if ((dx * fx + dy * fy + dz * fz) / d < Math.cos(half)) return false;
    return E.lightVisible(S.loop.world.lay, c.x, c.z, x, z);
  }

  function updatePlay(dt) {
    const P = S.player, L = S.loop, lay = L.world.lay, K = S.keys;
    S.run.timeMs += dt * 1000;
    let f = 0, s = 0, turn = 0;
    if (K.KeyW || K.ArrowUp) f += 1;
    if (K.KeyS || K.ArrowDown) f -= 1;
    if (K.KeyD) s += 1;
    if (K.KeyA) s -= 1;
    if (K.ArrowLeft) turn -= 1;
    if (K.ArrowRight) turn += 1;
    let running = !!(K.ShiftLeft || K.ShiftRight);
    const m = S.touch.move;
    if (m) {
      const dx = (m.x - m.x0) / 50, dy = (m.y - m.y0) / 50, d = Math.hypot(dx, dy), k = d > 1 ? 1 / d : 1;
      f -= dy * k; s += dx * k;
      if (d > 0.94) running = true;
    }
    P.yaw += turn * 2.1 * dt * S.settings.sens;
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    let wx = fx * f + rx * s, wz = fz * f + rz * s;
    const wl = Math.hypot(wx, wz);
    if (wl > 1) { wx /= wl; wz /= wl; }
    const speed = running ? 3.6 : 1.85, k = Math.min(1, dt * 9);
    P.vx += (wx * speed - P.vx) * k;
    P.vz += (wz * speed - P.vz) * k;
    const prev = { x: P.x, z: P.z };
    const nx = P.x + P.vx * dt + (P.pushX || 0), nz = P.z + P.vz * dt + (P.pushZ || 0);
    P.pushX = P.pushZ = 0;
    if (E.canStand(lay, nx, P.z, RADIUS)) P.x = nx; else P.vx = 0;
    if (E.canStand(lay, P.x, nz, RADIUS)) P.z = nz; else P.vz = 0;
    const moved = Math.hypot(P.x - prev.x, P.z - prev.z);
    P.moving = moved / Math.max(dt, 1e-4);
    P.step += moved;
    if (P.step > (running ? 0.95 : 0.72)) { P.step = 0; audio.step(running); }
    P.bob += moved / 0.72 * Math.PI;

    if (P.x > E.ARM_X) L.armed = true;
    const tr = E.transition(lay, prev, P, L.armed);
    if (tr) {
      P.x = tr.x; P.z = tr.z;
      if (tr.turn) { P.yaw += tr.turn; P.vx = -P.vx; P.vz = -P.vz; }
      advance(tr.type);
      return;
    }
    if (E.reachedExit(lay, P.x, P.z)) { startEnding(); return; }

    const events = L.actors.update(dt, P, { armed: L.armed, inView });
    for (const ev of events) {
      if (ev.type === 'step') {
        const c = S.cam || { x: P.x, z: P.z, yaw: P.yaw };
        const dx = ev.x - c.x, dz = ev.z - c.z, d = Math.hypot(dx, dz) || 1;
        const pan = (dx * Math.cos(c.yaw) - dz * Math.sin(c.yaw)) / d;
        if (ev.crawl) audio.drag(d, pan); else audio.otherStep(d, pan, ev.run);
      } else if (ev.type === 'knock' || ev.type === 'glitch') {
        const c = S.cam || { x: P.x, z: P.z, yaw: P.yaw }, dx = ev.x - c.x, dz = ev.z - c.z, d = Math.hypot(dx, dz) || 1;
        audio[ev.type](d, (dx * Math.cos(c.yaw) - dz * Math.sin(c.yaw)) / d);
      } else if (ev.type === 'caught') caught(ev);
      else if (ev.type === 'stinger' || ev.type === 'waveStart') audio.stinger();
      else if (ev.type === 'vanish') audio.vanish();
    }
    const wave = L.actors.wave;
    audio.setRumble(wave ? Math.max(0, Math.min(1, 1 - wave.gap / 26)) * 0.55 : 0);
  }

  function caught(ev) {
    if (S.mode !== 'playing') return;
    S.mode = 'caught';
    S.modeT = 0;
    S.caughtBy = ev && ev.by;
    S.scare = ev && ev.by === 'man' && S.settings.jumpscares !== false ? { x: ev.x, z: ev.z } : null;
    if (S.scare) audio.jumpscare(); else audio.caught();
    audio.setRumble(0);
    audio.setDread(0);
  }

  const wrapAngle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

  function updateCaught(dt) {
    S.modeT += dt;
    const a = S.modeT;
    S.danger = 0;
    if (S.scare) {
      // Whip round to face him, zoom into his face and shake. One flash (none in calm mode), then darkness.
      const P = S.player;
      P.yaw += wrapAngle(Math.atan2(S.scare.x - P.x, S.scare.z - P.z) - P.yaw) * Math.min(1, dt * 22);
      const hd = Math.max(0.3, Math.hypot(S.scare.x - P.x, S.scare.z - P.z));
      P.pitch += (Math.atan2(1.98 - EYE, hd) - P.pitch) * Math.min(1, dt * 22); // look up into his face
      S.zoom = Math.min(1, a / 0.2);
      S.shake = 1;
      for (const m of S.loop.actors.men) if (m.killer) m.headYaw = Math.sin(a * 70) * 0.2; // twitching head
      if (S.settings.reduceFlash) S.flash = [0.3, 0, 0, Math.min(1, a / 1.2)];
      else if (a < 0.1) S.flash = [1, 0.96, 0.92, a / 0.1 * 0.9];
      else if (a < 0.4) S.flash = [0.4, 0.02, 0.02, 0.9 - (a - 0.1) / 0.3 * 0.55];
      else S.flash = [0, 0, 0, Math.min(1, 0.35 + (a - 0.4) * 0.45)];
    } else {
      S.shake = 0.9;
      S.flash = a < 0.25 ? [0.55, 0.02, 0.02, a / 0.25 * 0.85] : [0, 0, 0, Math.min(1, 0.85 + (a - 0.25) * 0.4)];
    }
    if (a > (S.scare ? 2.3 : 1.9)) {
      const run = S.run;
      run.loops++; run.mistakes++;
      run.count = S.loop.world.exit ? E.MAX_COUNT - 1 : 0; // caught on the last stretch: only that stretch is lost
      if (S.loop.anomaly) { S.recent.push(S.loop.anomaly); if (S.recent.length > 8) S.recent.shift(); }
      setLoop(takeNext(false));
      updateSign();
      respawn();
      Object.assign(S, { mode: 'playing', zoom: 0, shake: 0, scare: null, caughtBy: null, hbT: 1, ambT: 10 });
      S.flash = [0, 0, 0, 1];
      S.fadeIn = 1;
      toast(t('caught'), 1800);
      schedulePrebuild();
    }
  }

  function startEnding() {
    S.mode = 'ending';
    S.modeT = 0;
    audio.exitChord();
    audio.setHum(0.2);
    audio.setDread(0);
  }
  function updateEnding(dt) {
    S.modeT += dt;
    const P = S.player;
    P.z = Math.min(P.z + 0.9 * dt, 13 + S.loop.world.hl + E.STAIRS - 0.5);
    S.flash = [1, 0.98, 0.94, Math.min(1, S.modeT / 2.2)];
    if (S.modeT > 2.6) showEnd();
  }

  function showEnd() {
    S.mode = 'end';
    if (document.pointerLockElement) document.exitPointerLock();
    const run = S.run;
    let isBest = false;
    if (S.best == null || run.timeMs < S.best) { S.best = run.timeMs; store.set('best', run.timeMs); isBest = true; }
    $('#stTime').textContent = E.formatTime(run.timeMs);
    $('#stLoops').textContent = String(run.loops);
    $('#stMistakes').textContent = String(run.mistakes);
    const best = $('#stBest');
    best.textContent = isBest ? t('newBest') : t('bestTime') + ': ' + E.formatTime(S.best);
    best.classList.toggle('newbest', isBest);
    const names = [...new Set(run.spotted)].map(id => (E.ANOMALIES.find(a => a.id === id) || {})[S.lang]).filter(Boolean);
    $('#stSpotted').textContent = names.length ? t('statFound') + ': ' + names.join(' · ') : '';
    show('end');
  }

  // ------------------------------------------------------------------ flicker
  function dynLevel() {
    const an = S.loop.anomaly, F = S.flick, now = S.time;
    if (an !== 'lights_off' && an !== 'light_flicker') return 1;
    const off = an === 'lights_off';
    if (S.settings.reduceFlash) return off ? 0.07 + 0.05 * Math.sin(now * 0.8) : 0.55 + 0.3 * Math.sin(now * 1.1);
    if (now > F.next) {
      F.until = now + (off ? 0.25 + Math.random() * 0.5 : 0.3 + Math.random() * 0.9);
      F.next = F.until + (off ? 2.5 + Math.random() * 4 : 0.8 + Math.random() * 2.2);
    }
    if (now < F.until) {
      if (now > F.hold) {
        F.hold = now + 0.04 + Math.random() * 0.1;
        const v = Math.random() < 0.5 ? (off ? 0.9 : 0.04) : (off ? 0.03 : 1);
        if (v !== F.val && now - S.crackleT > 0.05 && S.mode === 'playing') { audio.crackle(); S.crackleT = now; }
        F.val = v;
      }
      return F.val;
    }
    F.val = off ? 0.03 : 1;
    return F.val;
  }

  // ------------------------------------------------------------------ dread
  /** Heartbeat: always faint deep into a run, racing when something dangerous is near. */
  function tickHeart(dt) {
    const level = Math.max(S.danger, S.dreadSm * 0.45);
    S.pulse = Math.max(0, S.pulse - dt * 5);
    if (level < 0.12) return;
    S.hbT -= dt;
    if (S.hbT <= 0) {
      S.hbT = 60 / (52 + level * 95);
      audio.heartbeat(Math.min(1, 0.25 + level));
      S.pulse = 1;
    }
  }

  /** Paranoia: distant sounds that never mean anything. They happen in normal loops too. */
  function tickAmbient(dt) {
    S.ambT -= dt;
    if (S.ambT > 0) return;
    S.ambT = (16 - 9 * S.dreadSm) * (0.6 + Math.random() * 0.8);
    const kinds = ['thump', 'whisper', 'steps', 'scrape'];
    if (S.dreadSm > 0.35) kinds.push('breath', 'whisper');
    audio.ambient(kinds[Math.floor(Math.random() * kinds.length)], (Math.random() * 2 - 1) * 0.9);
  }

  // ------------------------------------------------------------------ render
  function dpr() {
    const d = window.devicePixelRatio || 1;
    return S.settings.quality === 'low' ? Math.min(d, 1) * 0.85 : Math.min(d, 2);
  }

  function render() {
    const P = S.player, L = S.loop;
    let cam;
    if (S.mode === 'menu' || S.mode === 'loading') {
      cam = { x: 0, y: EYE, z: 1.2, yaw: Math.sin(S.time * 0.13) * 0.22, pitch: 0.1 + Math.sin(S.time * 0.21) * 0.03, fov: FOV };
    } else {
      const bobAmt = reducedMotion ? 0 : Math.min(1, P.moving / 2);
      const bob = (Math.abs(Math.sin(P.bob)) - 0.5) * 0.05 * bobAmt;
      cam = { x: P.x, y: E.floorY(L.world.lay, P.x, P.z) + EYE + bob, z: P.z, yaw: P.yaw, pitch: P.pitch, fov: FOV * (1 - 0.42 * S.zoom) };
      if (!(reducedMotion || S.settings.reduceFlash)) {
        // Unsteady hands: a slow sway that grows with the dread.
        const sw = 0.0015 + 0.004 * S.dreadSm, tt = S.time;
        cam.yaw += Math.sin(tt * 1.3) * sw + Math.sin(tt * 2.9 + 1) * sw * 0.5;
        cam.pitch += Math.sin(tt * 1.7 + 2) * sw + Math.sin(tt * 3.4) * sw * 0.4;
      }
      const sh = S.shake * (reducedMotion || S.settings.reduceFlash ? 0.3 : 1);
      if (sh > 0.01) {
        const tt = S.time;
        cam.yaw += (Math.sin(tt * 47) + Math.sin(tt * 29 + 1)) * 0.012 * sh;
        cam.pitch += (Math.sin(tt * 53 + 2) + Math.sin(tt * 31)) * 0.01 * sh;
      }
    }
    S.cam = cam;
    const dyn = dynLevel();
    const spec = L.world.lights
      .map(l => ({ l, d: (l.x - cam.x) ** 2 + (l.z - cam.z) ** 2 }))
      .sort((a, b) => a.d - b.d).slice(0, 6)
      .map(({ l }) => ({ x: l.x, y: l.y, z: l.z, w: l.I * (l.group ? dyn : 1), col: l.col }));
    if (S.fadeIn && S.mode === 'playing') {
      S.fadeIn = Math.max(0, S.fadeIn - 1 / 60 * 1.4);
      S.flash = [0, 0, 0, S.fadeIn];
    } else if (S.mode === 'playing' || S.mode === 'menu' || S.mode === 'paused') S.flash = [0, 0, 0, 0];
    const dr = S.dreadSm, dg = S.danger, pulse = S.pulse * Math.max(dg, dr * 0.45);
    R.begin(cam, {
      time: S.time, dyn, spec, flash: S.flash,
      exposure: 1.32 - 0.36 * dr,
      fog: [0.010, 0.013 + 0.003 * dr, 0.012], fogD: 0.009 + 0.008 * dr,
      grain: 0.032 + 0.05 * dr + 0.03 * dg,
      vig: 0.85 + 0.8 * dr + 0.9 * dg + 0.5 * pulse,
      desat: 0.05 + 0.42 * dr + 0.25 * dg, grade: [0.86, 1, 0.9],
    });
    R.drawStatic(L.mesh);
    L.actors.draw(R, meshes, cam, dyn, new Date());
  }

  function frame(ms) {
    requestAnimationFrame(frame);
    const now = ms / 1000;
    const dt = S.freeze ? 0 : Math.min(0.05, Math.max(0, now - (S.lastT || now)));
    S.lastT = now;
    S.time += dt;
    R.resize(dpr());
    if (S.mode === 'playing') updatePlay(dt);
    else if (S.mode === 'caught') updateCaught(dt);
    else if (S.mode === 'ending') updateEnding(dt);
    const depth = S.run && (S.mode === 'playing' || S.mode === 'caught') ? S.run.count / E.MAX_COUNT : 0;
    S.dreadSm += (depth - S.dreadSm) * Math.min(1, dt * 0.6);
    if (S.mode === 'playing') {
      S.danger = S.loop.actors.danger(S.player);
      S.shake = S.danger * S.danger * 0.9;
      tickHeart(dt);
      tickAmbient(dt);
      audio.setDread(S.dreadSm);
    } else if (S.mode !== 'caught') {
      S.danger = 0; S.shake = 0; S.pulse = Math.max(0, S.pulse - dt * 4);
    }
    render();
  }

  // ------------------------------------------------------------------ overlays
  let currentOverlay = null;
  function openOverlay(id) {
    S.returnTo = S.mode === 'paused' ? 'pause' : S.mode === 'end' ? 'end' : 'menu';
    currentOverlay = id;
    if (id === 'codex') renderCodex();
    if (id === 'settings') syncSettings();
    show(id);
  }
  function closeOverlay() {
    currentOverlay = null;
    if (S.returnTo === 'menu') applyLang();
    show(S.returnTo);
  }

  function renderCodex() {
    const list = $('#codexList');
    list.innerHTML = '';
    E.ANOMALIES.forEach((a, i) => {
      const li = document.createElement('li');
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = String(i + 1).padStart(2, '0');
      const name = document.createElement('span');
      const known = S.found.has(a.id);
      name.textContent = known ? a[S.lang] : t('unknown');
      li.className = known ? (S.newlyFound.has(a.id) ? 'new' : '') : 'locked';
      li.append(n, name);
      list.appendChild(li);
    });
    $('#codexCount').textContent = t('foundCount', { n: S.found.size, total: E.ANOMALIES.length });
    $('#codexBar').style.width = (S.found.size / E.ANOMALIES.length * 100) + '%';
    $('#codexEmpty').style.display = S.found.size ? 'none' : 'block';
  }

  function syncSettings() {
    const st = S.settings;
    $('#optSens').value = st.sens; $('#outSens').textContent = st.sens.toFixed(1);
    $('#optVol').value = st.vol; $('#outVol').textContent = Math.round(st.vol * 100) + '%';
    $('#optQuality').value = st.quality;
    $('#optFlash').checked = !!st.reduceFlash;
    $('#optScare').checked = st.jumpscares !== false;
  }
  $('#optSens').addEventListener('input', e => { S.settings.sens = +e.target.value; syncSettings(); store.set('settings', S.settings); });
  $('#optVol').addEventListener('input', e => { S.settings.vol = +e.target.value; audio.setVolume(S.settings.vol); syncSettings(); store.set('settings', S.settings); });
  $('#optFlash').addEventListener('change', e => { S.settings.reduceFlash = e.target.checked; store.set('settings', S.settings); });
  $('#optScare').addEventListener('change', e => { S.settings.jumpscares = e.target.checked; store.set('settings', S.settings); });
  $('#optQuality').addEventListener('change', e => { S.settings.quality = e.target.value; store.set('settings', S.settings); uploadTextures(); });

  $('#btnStart').addEventListener('click', startGame);
  $('#btnAgain').addEventListener('click', startGame);
  $('#btnRestart').addEventListener('click', startGame);
  $('#btnResume').addEventListener('click', resume);
  $('#btnMenu').addEventListener('click', toMenu);
  $('#btnMenu2').addEventListener('click', toMenu);
  ['#btnCodex', '#btnCodex2', '#btnCodex3'].forEach(id => $(id).addEventListener('click', () => openOverlay('codex')));
  ['#btnSettings', '#btnSettings2'].forEach(id => $(id).addEventListener('click', () => openOverlay('settings')));
  $('#btnCodexBack').addEventListener('click', closeOverlay);
  $('#btnSettingsBack').addEventListener('click', closeOverlay);
  let resetArmedAt = 0;
  $('#btnCodexReset').addEventListener('click', () => {
    const btn = $('#btnCodexReset');
    if (Date.now() - resetArmedAt > 4000) {
      resetArmedAt = Date.now();
      btn.textContent = t('resetConfirm');
      setTimeout(() => { if (resetArmedAt && Date.now() - resetArmedAt >= 4000) btn.textContent = t('resetCodex'); }, 4100);
      return;
    }
    resetArmedAt = 0;
    btn.textContent = t('resetCodex');
    S.found.clear(); S.newlyFound.clear(); store.set('found', []); renderCodex();
  });
  $('#btnLang').addEventListener('click', () => {
    S.lang = S.lang === 'he' ? 'en' : 'he';
    store.set('lang', S.lang);
    applyLang();
  });

  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fatal(S.lang === 'he' ? 'הגרפיקה נעצרה. רענן את הדף כדי להמשיך.' : 'Graphics stopped. Reload the page to continue.'); });

  // ------------------------------------------------------------------ boot
  async function boot() {
    applyLang();
    if (!R) { fatal(t('noWebgl')); return; }
    await loadFonts();
    uploadTextures();
    meshes = E.createActorMeshes(R);
    setLoop(makeWorld(null, false));
    S.mode = 'menu';
    applyLang();
    show('menu');
    requestAnimationFrame(frame);
  }

  if (/[?&]debug\b/.test(location.search)) {
    window.EXIT8_DEBUG = {
      state: S,
      load(anomaly, exit) {
        if (!S.run) startGame();
        setLoop(makeWorld(anomaly || null, !!exit));
        return S.loop.world;
      },
      place(x, z, yaw, pitch) { Object.assign(S.player, { x, z, yaw: yaw || 0, pitch: pitch || 0, vx: 0, vz: 0 }); },
      step(seconds, keys) {
        const dt = 1 / 60;
        S.keys = Object.assign({}, keys || {});
        for (let i = 0; i < seconds * 60; i++) { S.time += dt; if (S.mode === 'playing') updatePlay(dt); else if (S.mode === 'caught') updateCaught(dt); }
        S.keys = {};
      },
      setCount(n) { S.run.count = n; updateSign(); },
      freeze(v) { S.freeze = !!v; },
      dread(v) { S.dreadSm = v; },
    };
  }

  boot();
})();
