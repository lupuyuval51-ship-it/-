/* EXIT 8 — moving things: the man (and his anomalies), the red wave, the shadow,
 * the clock hands and the poster's pupils. */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});
  const M4 = E.M4;

  // Linear-space tints: a dark suit, white shirt, blue tie.
  const SKIN = [0.62, 0.36, 0.22], SKIN_BACK = [0.59, 0.33, 0.19], SHIRT = [0.78, 0.8, 0.82], JACKET = [0.07, 0.075, 0.095];
  const TROUSER = [0.045, 0.048, 0.06], HAIR = [0.035, 0.03, 0.028], SHOE = [0.02, 0.02, 0.02], TIE = [0.035, 0.05, 0.16], CASE = [0.2, 0.1, 0.05];
  const WALK = 1.25;

  E.createActorMeshes = function (renderer) {
    const T = E.TEX;
    const m = (tint, extra) => Object.assign({ layer: T.white, tint }, extra || {});
    const build = fn => { const b = new E.Builder(); fn(b); return renderer.createMesh(b.pack()); };
    const suit = m(JACKET, { spec: 0.12 });
    const head = kind => build(b => {
      const face = { layer: kind === 'killer' ? T.faceKiller : kind === 'smile' ? T.faceSmile : T.face, tint: [1, 1, 1] };
      // Face on the front (planar-mapped), plain skin round the back, hair like a cap with a hairline.
      b.ellipsoid(0, 0.14, 0, 0.097, 0.125, 0.108, 14, 18, face, { part: 'front', faceUV: true });
      b.ellipsoid(0, 0.14, 0, 0.097, 0.125, 0.108, 14, 18, m(SKIN_BACK), { part: 'back' });
      b.ellipsoid(0, 0.152, -0.008, 0.104, 0.129, 0.115, 12, 18, m(HAIR, { spec: 0.15 }), { part: 'all', keep: (nx, ny, nz) => ny > 0.42 || nz < -0.3 });
      for (const sx of [-1, 1]) b.ellipsoid(sx * 0.099, 0.13, 0.004, 0.014, 0.034, 0.024, 6, 8, m(SKIN), { part: 'all' });
    });
    const armGeometry = b => {
      b.ellipsoid(0, -0.01, 0, 0.062, 0.066, 0.062, 8, 12, suit, { part: 'all' }); // rounded shoulder
      b.lathe([{ y: 0, rx: 0.062, rz: 0.062 }, { y: -0.27, rx: 0.053, rz: 0.053, oz: 0.01 }, { y: -0.5, rx: 0.045, rz: 0.045, oz: 0.03 }], 10, suit);
      b.lathe([{ y: -0.5, rx: 0.037, rz: 0.037, oz: 0.03 }, { y: -0.535, rx: 0.037, rz: 0.037, oz: 0.034 }], 8, m(SHIRT)); // cuff
      b.ellipsoid(0, -0.605, 0.042, 0.036, 0.07, 0.03, 8, 10, m(SKIN), { part: 'all' }); // hand
    };
    return {
      torso: build(b => {
        b.lathe([
          { y: 0.84, rx: 0.185, rz: 0.115 }, { y: 0.98, rx: 0.19, rz: 0.115 }, { y: 1.12, rx: 0.2, rz: 0.12 }, { y: 1.28, rx: 0.225, rz: 0.13 },
          { y: 1.4, rx: 0.245, rz: 0.12 }, { y: 1.47, rx: 0.2, rz: 0.1 }, { y: 1.5, rx: 0.075, rz: 0.07 },
        ], 16, suit);
        b.box(0, 1.33, 0.127, 0.1, 0.3, 0.012, m(SHIRT));      // shirt front
        b.box(0, 1.3, 0.134, 0.034, 0.3, 0.01, m(TIE));         // tie
        b.box(0, 1.485, 0.075, 0.13, 0.04, 0.1, m(SHIRT));      // collar
        b.lathe([{ y: 1.46, rx: 0.052, rz: 0.052 }, { y: 1.58, rx: 0.048, rz: 0.048 }], 10, m(SKIN)); // neck
        // two jacket buttons
        for (const [y, z] of [[1.16, 0.12], [1.0, 0.116]]) b.ellipsoid(0, y, z, 0.013, 0.013, 0.007, 6, 8, m([0.01, 0.01, 0.012], { spec: 0.6 }), { part: 'all' });
        // the name tag, pinned to his right breast and angled to follow the curve of the jacket
        b.box(0.12, 1.3, 0.106, 0.11, 0.062, 0.006, m([0.85, 0.85, 0.83], { spec: 0.3 }), { pz: { layer: T.nametag, tint: [1, 1, 1], spec: 0.3 } }, 0.36);
      }),
      head: head('plain'),
      headSmile: head('smile'),
      headKiller: head('killer'),
      leg: build(b => {
        b.lathe([{ y: 0, rx: 0.088, rz: 0.092 }, { y: -0.2, rx: 0.084, rz: 0.088 }, { y: -0.44, rx: 0.068, rz: 0.072 }, { y: -0.7, rx: 0.052, rz: 0.056 }, { y: -0.79, rx: 0.05, rz: 0.054 }], 12, m(TROUSER, { spec: 0.05 }));
        b.ellipsoid(0, -0.815, 0.045, 0.055, 0.04, 0.13, 8, 12, m(SHOE, { spec: 0.5 }), { part: 'all' });
      }),
      thigh: build(b => {
        b.lathe([{ y: 0, rx: 0.088, rz: 0.092 }, { y: -0.2, rx: 0.084, rz: 0.088 }, { y: -0.44, rx: 0.068, rz: 0.072 }], 12, m(TROUSER, { spec: 0.05 }));
        b.ellipsoid(0, -0.44, 0.004, 0.07, 0.058, 0.074, 8, 12, m(TROUSER, { spec: 0.05 }), { part: 'all' }); // knee
      }),
      shin: build(b => { // origin at the knee
        b.lathe([{ y: 0, rx: 0.068, rz: 0.072 }, { y: -0.26, rx: 0.052, rz: 0.056 }, { y: -0.35, rx: 0.05, rz: 0.054 }], 12, m(TROUSER, { spec: 0.05 }));
        b.ellipsoid(0, -0.375, 0.045, 0.055, 0.04, 0.13, 8, 12, m(SHOE, { spec: 0.5 }), { part: 'all' });
      }),
      upperArm: build(b => {
        b.ellipsoid(0, -0.01, 0, 0.062, 0.066, 0.062, 8, 12, suit, { part: 'all' });
        b.lathe([{ y: 0, rx: 0.062, rz: 0.062 }, { y: -0.27, rx: 0.053, rz: 0.053, oz: 0.01 }], 10, suit);
        b.ellipsoid(0, -0.27, 0.01, 0.054, 0.05, 0.054, 8, 10, suit, { part: 'all' }); // elbow
      }),
      foreArm: build(b => { // origin at the elbow
        b.lathe([{ y: 0, rx: 0.053, rz: 0.053 }, { y: -0.23, rx: 0.045, rz: 0.045, oz: 0.02 }], 10, suit);
        b.lathe([{ y: -0.23, rx: 0.037, rz: 0.037, oz: 0.02 }, { y: -0.265, rx: 0.037, rz: 0.037, oz: 0.024 }], 8, m(SHIRT));
        b.ellipsoid(0, -0.335, 0.032, 0.036, 0.07, 0.03, 8, 10, m(SKIN), { part: 'all' });
      }),
      foreArmCase: build(b => {
        b.lathe([{ y: 0, rx: 0.053, rz: 0.053 }, { y: -0.23, rx: 0.045, rz: 0.045, oz: 0.02 }], 10, suit);
        b.lathe([{ y: -0.23, rx: 0.037, rz: 0.037, oz: 0.02 }, { y: -0.265, rx: 0.037, rz: 0.037, oz: 0.024 }], 8, m(SHIRT));
        b.ellipsoid(0, -0.335, 0.032, 0.036, 0.07, 0.03, 8, 10, m(SKIN), { part: 'all' });
        b.box(0, -0.41, 0.035, 0.02, 0.05, 0.1, m([0.02, 0.02, 0.02]));
        b.box(0, -0.57, 0.035, 0.075, 0.28, 0.4, m(CASE, { spec: 0.35 }));
      }),
      arm: build(armGeometry),
      armCase: build(b => {
        armGeometry(b);
        b.box(0, -0.68, 0.045, 0.02, 0.05, 0.1, m([0.02, 0.02, 0.02]));
        b.box(0, -0.84, 0.045, 0.075, 0.28, 0.4, m(CASE, { spec: 0.35 }));
      }),
      door: build(b => {
        // A door leaf of its own, so it can be pounded from the inside. The hinge is at local z = +0.5.
        b.box(0, 1.05, 0, 0.05, 2.1, 1.0, m([0.5, 0.52, 0.55], { spec: 0.3 }), { nx: { layer: T.door, tint: [1, 1, 1], spec: 0.18 } });
        b.box(-0.04, 1.0, -0.36, 0.06, 0.04, 0.14, m([0.8, 0.82, 0.84], { spec: 0.6 }));
      }),
      cube: build(b => b.box(0, 0, 0, 1, 1, 1, m([0.13, 0.0, 0.003], { spec: 1.6, emis: [0.012, 0, 0] }))),
      pupil: build(b => b.disc([0, 0, 0], [1, 0, 0], 0.036, 0.006, 14, m([0.004, 0.003, 0.003], { spec: 0.6 }))),
      hourHand: build(b => b.box(0, 0.045, 0, 0.022, 0.13, 0.006, m([0.06, 0.06, 0.06]))),
      minuteHand: build(b => b.box(0, 0.075, 0, 0.015, 0.2, 0.006, m([0.06, 0.06, 0.06]))),
      secondHand: build(b => {
        b.box(0, 0.07, 0, 0.006, 0.22, 0.004, m([0.75, 0.08, 0.06]));
        b.disc([0, 0, 0], [0, 0, 1], 0.014, 0.01, 10, m([0.75, 0.08, 0.06]));
      }),
    };
  };

  const angleTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz); // heading that faces (tx,tz)
  const wrapAngle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const approach = (a, b, k) => a + wrapAngle(b - a) * Math.min(1, k);

  /** Per-loop actor state. Returns events from update(): steps, caught, vanish, wave. */
  function Actors(world) {
    this.world = world;
    this.an = world.anomaly;
    this.men = [];
    this.spawned = false;
    this.wave = null;
    this.follower = null;
    this.shadow = world.decor.shadow ? Object.assign({ alive: true }, world.decor.shadow) : null;
    this.time = 0;
    this.caught = false;
    this.knockState = world.decor.knock ? { t: 1.2, left: 0, shake: 0 } : null;
  }

  function newMan(x, z, heading) {
    return { x, z, y: 0, heading, headYaw: 0, phase: Math.random() * 6, speed: WALK, mode: 'walk', scale: 1, ceiling: false, smile: false, backward: false, stare: false, alive: true, stepAcc: 0, timer: 0 };
  }

  Actors.prototype.spawn = function () {
    if (this.spawned || this.world.exit) return;
    this.spawned = true;
    const an = this.an, hl = this.world.hl;
    if (an === 'man_follow') return;
    const count = an === 'man_many' ? 4 : 1;
    for (let i = 0; i < count; i++) {
      const man = newMan(9.8, hl + 11 - i * 2.1, Math.PI);
      if (an === 'man_many') man.phase = 0;
      if (an === 'man_giant') man.scale = 1.45;
      if (an === 'man_ceiling') man.ceiling = true;
      if (an === 'man_smile') man.smile = true;
      if (an === 'man_backward') { man.backward = true; man.heading = 0; }
      if (an === 'man_stare') man.stare = true;
      if (an === 'man_stop') man.stopper = true;
      if (an === 'man_chase') man.chaser = true;
      if (an === 'man_crawl') { man.crawl = true; man.stare = true; man.speed = 2.1; }
      if (an === 'man_glitch') { man.glitch = true; man.gT = 0; }
      this.men.push(man);
    }
  };

  /** p: player {x,z,y}; cam: {x,y,z,yaw,pitch}; ctx: { inView(x,y,z), armed } */
  Actors.prototype.update = function (dt, p, ctx) {
    const ev = [];
    this.time += dt;
    const lay = this.world.lay, hl = this.world.hl;
    if (ctx.armed) this.spawn();
    const inHall = p.x > 7.5 && p.z > 13;
    const sPlayer = E.routeS(lay, p.x, p.z);

    for (const man of this.men) {
      if (!man.alive) continue;
      const dist = Math.hypot(man.x - p.x, man.z - p.z);
      let moving = 0;
      if (man.mode === 'walk') {
        if (man.stopper && inHall && dist < 7 && man.z > p.z) { man.mode = 'stop'; }
        else if (man.chaser && inHall && dist < 8.5 && man.z > p.z) { man.mode = 'pause'; man.timer = 0.8; ev.push({ type: 'stinger' }); }
        else {
          let step = man.speed * dt;
          if (man.glitch) {
            // Stop-motion: he freezes mid-stride, then jumps ahead, his head snapping towards you.
            man.gT += dt;
            if (man.gT < 0.42) step = 0;
            else {
              step = man.speed * man.gT; man.gT = 0;
              man.phase += 1 + Math.random() * 2;
              const rel = wrapAngle(angleTo(man.x, man.z, p.x, p.z) - man.heading);
              man.headYaw = Math.max(-1.6, Math.min(1.6, rel + (Math.random() - 0.5) * 0.5));
              ev.push({ type: 'glitch', x: man.x, z: man.z });
            }
          }
          if (man.z > 13.7) { man.z = Math.max(13.7, man.z - step); if (!man.backward) man.heading = Math.PI; }
          else { man.x -= step; if (!man.backward) man.heading = -Math.PI / 2; else man.heading = Math.PI / 2; }
          moving = man.glitch ? (step > 0 ? 1 : 0) : 1;
          const passed = man.z < p.z - 2.5 || man.x < 7.5;
          if ((passed && !ctx.inView(man.x, 1.2, man.z)) || man.x < 4.8) { man.alive = false; continue; }
        }
      } else if (man.mode === 'stop') {
        man.heading = approach(man.heading, angleTo(man.x, man.z, p.x, p.z), dt * 3);
      } else if (man.mode === 'pause') {
        man.heading = approach(man.heading, angleTo(man.x, man.z, p.x, p.z), dt * 6);
        man.timer -= dt;
        if (man.timer <= 0) { man.mode = 'chase'; man.s = E.routeS(lay, man.x, man.z); }
      } else if (man.mode === 'chase') {
        const dir = Math.sign(sPlayer - man.s) || -1;
        man.s += dir * 3.4 * dt;
        const pt = E.routePoint(lay, man.s);
        man.x = pt.x; man.z = pt.z;
        man.heading = Math.atan2(pt.dx * dir, pt.dz * dir);
        moving = 2.7;
        if (Math.hypot(man.x - p.x, man.z - p.z) < 0.85) {
          this.caught = true;
          man.smile = true; man.scale = 1.22; man.killer = true; // the grin, and a lunge
          ev.push({ type: 'caught', by: 'man', x: man.x, z: man.z });
        }
      }
      if (man.stare && dist < 16) {
        const rel = wrapAngle(angleTo(man.x, man.z, p.x, p.z) - man.heading);
        man.headYaw = approach(man.headYaw, Math.max(-1.6, Math.min(1.6, rel)), dt * 5);
      }
      if (moving) {
        const stride = moving > 2 ? 0.55 : 0.36;
        man.phase += (moving > 2 ? 3.4 : man.speed) * dt / stride;
        man.stepAcc += (moving > 2 ? 3.4 : man.speed) * dt;
        if (man.stepAcc > (moving > 2 ? 1.0 : man.crawl ? 0.5 : 0.72)) { man.stepAcc = 0; ev.push({ type: 'step', x: man.x, z: man.z, run: moving > 2, ceiling: man.ceiling, crawl: !!man.crawl }); }
        man.moving = true;
      } else man.moving = false;
      // Never let the player walk through him.
      const d2 = Math.hypot(man.x - p.x, man.z - p.z);
      if (d2 < 0.5 && d2 > 1e-4 && !man.ceiling) {
        const k = (0.5 - d2) / d2;
        p.pushX = (p.pushX || 0) + (p.x - man.x) * k;
        p.pushZ = (p.pushZ || 0) + (p.z - man.z) * k;
      }
    }

    // Someone behind you.
    if (this.an === 'man_follow' && inHall && !this.follower && p.z > 21) {
      const s = sPlayer - 5;
      const pt = E.routePoint(lay, s);
      if (!ctx.inView(pt.x, 1.2, pt.z)) { const f = newMan(pt.x, pt.z, 0); f.s = s; f.mode = 'follow'; this.follower = f; this.men.push(f); }
    }
    const f = this.follower;
    if (f && f.alive) {
      const dist = Math.hypot(f.x - p.x, f.z - p.z);
      const seen = ctx.inView(f.x, 1.3, f.z) && dist < 18;
      if (seen && dist < 1.4) { f.alive = false; ev.push({ type: 'vanish' }); }
      else if (seen) {
        f.moving = false;
        f.heading = approach(f.heading, angleTo(f.x, f.z, p.x, p.z), dt * 4);
      } else {
        const target = sPlayer - 2.4;
        const ds = target - f.s;
        const v = Math.max(-4.5, Math.min(4.5, ds * 2.5));
        f.s += v * dt;
        const pt = E.routePoint(lay, f.s);
        f.x = pt.x; f.z = pt.z;
        f.heading = Math.atan2(pt.dx * Math.sign(v || 1), pt.dz * Math.sign(v || 1));
        f.moving = Math.abs(v) > 0.2;
        if (f.moving) {
          f.phase += Math.abs(v) * dt / 0.4;
          f.stepAcc += Math.abs(v) * dt;
          if (f.stepAcc > 0.72) { f.stepAcc = 0; ev.push({ type: 'step', x: f.x, z: f.z }); }
        }
      }
    }

    // A door being pounded from inside: bursts of knocks, then a long, held silence.
    const kd = this.world.decor.knock, K = this.knockState;
    if (kd && K && ctx.armed) {
      K.shake = Math.max(0, K.shake - dt * 5);
      K.t -= dt;
      if (K.t <= 0) {
        if (K.left <= 0) K.left = 2 + Math.floor(Math.random() * 4);
        K.left--;
        K.shake = 1;
        ev.push({ type: 'knock', x: kd.x - 0.3, z: kd.z });
        K.t = K.left > 0 ? 0.2 + Math.random() * 0.25 : 2.2 + Math.random() * 2.6;
      }
    }

    // Red wave. In the exit corridor it comes from behind instead, and only stops when you reach the stairs.
    if (this.an === 'red_wave' && !this.wave && inHall && p.z > 21) {
      this.wave = { s: E.routeS(lay, 9, hl + 13), t: 0, dir: -1 };
      ev.push({ type: 'waveStart' });
    } else if (this.world.exit && !this.wave && !this.finaleDone && inHall && p.z > 22 && p.z < 44) {
      this.wave = { s: E.routeS(lay, 9, 14.5), t: 0, dir: 1 };
      ev.push({ type: 'waveStart' });
    }
    if (this.wave) {
      const W = this.wave;
      W.t += dt;
      if (W.dir === 1) {
        if (!W.done) W.s = Math.min(W.s + Math.min(3.5, 2.4 + W.t * 0.35) * dt, E.routeS(lay, 9, hl + 13) - 0.2);
        W.gap = sPlayer - W.s;
        if (!W.done && p.z > 46) { W.done = true; W.doneT = 0; this.finaleDone = true; ev.push({ type: 'vanish' }); }
        if (W.done) { W.doneT += dt; if (W.doneT > 2.5) this.wave = null; }
      } else {
        W.s -= Math.min(2.55, 0.8 + W.t * 1.2) * dt;
        W.gap = W.s - sPlayer;
      }
      if (this.wave && !W.done && W.gap < 0.35 && !this.caught) { this.caught = true; ev.push({ type: 'caught', by: 'wave' }); }
    }

    // Shadow at the end of the corridor vanishes when you get close.
    if (this.shadow && this.shadow.alive && Math.hypot(this.shadow.x - p.x, this.shadow.z - p.z) < 10) {
      this.shadow.alive = false;
      ev.push({ type: 'vanish' });
    }
    return ev;
  };

  /**
   * How threatening the loop is right now (0..1): drives the heartbeat, vignette and camera shake.
   * Only things the player can already see or hear count, so it never gives an anomaly away.
   */
  Actors.prototype.danger = function (p) {
    let d = 0;
    for (const man of this.men) {
      if (!man.alive) continue;
      const dist = Math.hypot(man.x - p.x, man.z - p.z);
      if (man.mode === 'chase' || man.mode === 'pause') d = Math.max(d, 1 - dist / 14);
      else if (man.mode === 'stop') d = Math.max(d, 0.5 * (1 - dist / 8));
      else if (man.stare || man.crawl || man.smile || man.ceiling || man.glitch) d = Math.max(d, 0.55 * (1 - dist / 9));
    }
    if (this.wave && !this.wave.done) d = Math.max(d, 1 - this.wave.gap / 22);
    return Math.max(0, Math.min(1, d));
  };

  /** The man on all fours, head twisted up towards the player. */
  function drawCrawler(r, M, man, world, dyn) {
    const sw = Math.sin(man.phase), lift = man.moving ? Math.abs(sw) * 0.03 : 0;
    const base = M4.chain(M4.translate(man.x, 0.52 + lift, man.z), M4.rotY(man.heading), M4.rotZ(man.moving ? sw * 0.07 : 0), M4.rotX(Math.PI / 2));
    const light = E.sampleLight(world, man.x, 0.6, man.z, dyn);
    r.drawObj(M.torso, base, light);
    r.drawObj(M.head, M4.chain(base, M4.translate(0, 1.53, 0), M4.rotZ(-man.headYaw), M4.rotX(-Math.PI / 2 - 0.55)), light);
    r.drawObj(M.arm, M4.chain(base, M4.translate(-0.262, 1.46, 0), M4.rotX(Math.PI + 0.8 + sw * 0.5)), light);
    r.drawObj(M.arm, M4.chain(base, M4.translate(0.262, 1.46, 0), M4.rotX(Math.PI + 0.8 - sw * 0.5)), light);
    r.drawObj(M.leg, M4.chain(base, M4.translate(-0.1, 0.86, 0), M4.rotX(-0.7 + sw * 0.35)), light);
    r.drawObj(M.leg, M4.chain(base, M4.translate(0.1, 0.86, 0), M4.rotX(-0.7 - sw * 0.35)), light);
  }

  function drawMan(r, M, man, world, dyn, tintOv) {
    if (man.crawl) { drawCrawler(r, M, man, world, dyn); return; }
    const sc = man.scale;
    const walking = !!(man.moving || man.glitch); // the stuttering man holds his pose between jumps
    const ph = walking ? man.phase || 0 : 0, sg = man.backward ? -1 : 1;
    const s = Math.sin(ph) * sg, c = Math.cos(ph) * sg;
    const bob = walking ? Math.abs(Math.sin(ph)) * 0.03 : 0;
    const origin = man.ceiling
      ? M4.chain(M4.translate(man.x, E.CEIL, man.z), M4.rotY(man.heading), M4.scale(sc, -sc, sc))
      : M4.chain(M4.translate(man.x, 0, man.z), M4.rotY(man.heading), M4.scale(sc, sc, sc));
    const base = M4.mul(origin, M4.translate(0, bob, 0));
    const light = tintOv ? { col: [0, 0, 0], dir: [0, 1, 0] } : E.sampleLight(world, man.x, man.ceiling ? 2.0 : 1.3, man.z, dyn);

    // Hips and shoulders counter-twist, with a slight forward lean and sway.
    const twist = -s * 0.07, roll = Math.sin(ph) * sg * 0.02, lean = walking ? 0.05 : 0;
    const upper = M4.chain(base, M4.translate(0, 0.9, 0), M4.rotX(lean), M4.rotY(twist), M4.rotZ(roll), M4.translate(0, -0.9, 0));
    r.drawObj(M.torso, upper, light, tintOv);
    r.drawObj(man.killer ? M.headKiller : man.smile ? M.headSmile : M.head, M4.chain(upper, M4.translate(0, 1.53, 0), M4.rotY(man.headYaw - twist * 0.8), M4.rotZ(-roll * 0.6)), light, tintOv);

    // Legs: the knee bends while the leg swings forward.
    const legA = s * 0.55, legB = -legA, kneeA = 0.85 * Math.max(0, -c), kneeB = 0.85 * Math.max(0, c);
    for (const [x, hip, knee] of [[-0.1, legA, kneeA], [0.1, legB, kneeB]]) {
      const h = M4.chain(base, M4.translate(x, 0.86, 0), M4.rotX(hip));
      r.drawObj(M.thigh, h, light, tintOv);
      r.drawObj(M.shin, M4.chain(h, M4.translate(0, -0.44, 0), M4.rotX(knee)), light, tintOv);
    }

    // Arms: the free arm swings against its leg and bends at the elbow on the forward swing; the other holds the case.
    const armA = -s * 0.42, elbowA = 0.2 + 0.9 * Math.max(0, -armA), armB = s * 0.1;
    const sa = M4.chain(upper, M4.translate(-0.262, 1.46, 0), M4.rotX(armA));
    r.drawObj(M.upperArm, sa, light, tintOv);
    r.drawObj(M.foreArm, M4.chain(sa, M4.translate(0, -0.27, 0.01), M4.rotX(-elbowA)), light, tintOv);
    const sb = M4.chain(upper, M4.translate(0.262, 1.46, 0), M4.rotX(armB));
    r.drawObj(M.upperArm, sb, light, tintOv);
    r.drawObj(M.foreArmCase, M4.chain(sb, M4.translate(0, -0.27, 0.01), M4.rotX(-(0.1 + armB * 0.4))), light, tintOv);
  }

  /** cam: camera position for the poster eyes; dyn: flicker level; now: Date for the clock. */
  Actors.prototype.draw = function (r, M, cam, dyn, now) {
    const world = this.world;
    for (const man of this.men) if (man.alive) drawMan(r, M, man, world, dyn);
    if (this.shadow && this.shadow.alive) drawMan(r, M, { x: this.shadow.x, z: this.shadow.z, heading: Math.PI, headYaw: 0, scale: 1.05, moving: false }, world, dyn, [0, 0, 0]);

    const clock = world.decor.clock;
    if (clock) {
      const light = E.sampleLight(world, clock.x - 0.3, clock.y, clock.z, dyn);
      let h, mi, se;
      if (this.an === 'clock_spin') {
        const t = this.time;
        se = -t * 9; mi = -t * 2.6; h = -t * 0.35;
      } else {
        const s = now.getSeconds() + now.getMilliseconds() / 1000;
        se = (Math.floor(s) / 60) * Math.PI * 2;
        mi = ((now.getMinutes() + s / 60) / 60) * Math.PI * 2;
        h = (((now.getHours() % 12) + now.getMinutes() / 60) / 12) * Math.PI * 2;
      }
      const B = M4.chain(M4.translate(clock.x, clock.y, clock.z), M4.basis([0, 0, -1], [0, 1, 0], [-1, 0, 0]));
      r.drawObj(M.hourHand, M4.chain(B, M4.translate(0, 0, 0.004), M4.rotZ(-h)), light);
      r.drawObj(M.minuteHand, M4.chain(B, M4.translate(0, 0, 0.011), M4.rotZ(-mi)), light);
      r.drawObj(M.secondHand, M4.chain(B, M4.translate(0, 0, 0.018), M4.rotZ(-se)), light);
    }

    for (const eye of world.decor.eyes) {
      const dx = cam.x - eye.x, dy = cam.y - eye.y, dz = cam.z - eye.z, d = Math.hypot(dx, dy, dz) || 1;
      const oz = Math.max(-0.075, Math.min(0.075, dz / d * 0.11));
      const oy = Math.max(-0.03, Math.min(0.03, dy / d * 0.06));
      const light = E.sampleLight(world, eye.x + 0.4, eye.y, eye.z, dyn);
      r.drawObj(M.pupil, M4.translate(eye.x + 0.004, eye.y + oy, eye.z + oz), light);
    }

    const kd = world.decor.knock;
    if (kd && this.knockState) {
      const sh = this.knockState.shake;
      const light = E.sampleLight(world, kd.x - 0.5, 1.2, kd.z, dyn);
      r.drawObj(M.door, M4.chain(M4.translate(kd.x - 0.012 - 0.04 * sh, 0, kd.z + 0.5), M4.rotY(Math.sin(this.time * 70) * 0.09 * sh), M4.translate(0, 0, -0.5)), light);
    }

    const we = world.decor.wallEyes;
    if (we.length) {
      const light = E.sampleLight(world, we[0].x - 0.6, we[0].y, we[0].z, dyn);
      for (const e of we) {
        const dx = cam.x - e.x, dy = cam.y - e.y, dz = cam.z - e.z, d = Math.hypot(dx, dy, dz) || 1;
        const oy = Math.max(-e.maxY, Math.min(e.maxY, dy / d * e.maxY * 1.6));
        const oz = Math.max(-e.maxZ, Math.min(e.maxZ, dz / d * e.maxZ * 1.6));
        r.drawObj(M.pupil, M4.chain(M4.translate(e.x - 0.004, e.y + oy, e.z + oz), M4.scale(1, e.ky, e.kz)), light);
      }
    }

    if (this.wave) this.drawWave(r, M, dyn);
  };

  Actors.prototype.drawWave = function (r, M, dyn) {
    const lay = this.world.lay, hl = this.world.hl;
    const sH0 = E.routeS(lay, 9, 14.5);
    const t = this.time;
    const H = 2.3 + Math.sin(t * 3) * 0.08;
    const s = this.wave.s;
    const front = E.routePoint(lay, s);
    const sample = E.sampleLight(this.world, front.x, 1.6, front.z, dyn);
    const light = { col: sample.col, dir: sample.dir };
    const draw = (x0, x1, z0, z1, h) => {
      r.drawObj(M.cube, M4.chain(M4.translate((x0 + x1) / 2, h / 2, (z0 + z1) / 2), M4.scale(x1 - x0, h, z1 - z0)), light);
    };
    if (this.wave.dir === 1) {
      // Coming from behind: the body trails back along the hall, the ragged crest leans forward.
      const zf = 14.5 + (s - sH0);
      draw(7.5, 10.5, 13, zf, H);
      for (let i = 0; i < 10; i++) {
        const w = 0.3, x = 7.5 + i * w, wob = Math.sin(t * 7 + i * 1.7) * 0.3 + Math.sin(t * 11 + i * 0.6) * 0.12 + 0.35;
        draw(x, x + w, zf - 0.15, zf + 0.15 + wob, H * (0.8 + 0.2 * Math.sin(t * 5 + i * 1.3)));
      }
      return;
    }
    if (s >= sH0) {
      const zf = 14.5 + (s - sH0);
      draw(7.5, 10.5, zf, hl + 13, H);
      for (let i = 0; i < 10; i++) {
        const w = 0.3, x = 7.5 + i * w, wob = Math.sin(t * 7 + i * 1.7) * 0.3 + Math.sin(t * 11 + i * 0.6) * 0.12 - 0.25;
        draw(x, x + w, zf + wob - 0.6, zf + 0.15, H * (0.8 + 0.2 * Math.sin(t * 5 + i * 1.3)));
      }
    } else {
      draw(7.5, 10.5, 13, hl + 13, H);
      const xf = 9 - (sH0 - s);
      if (xf < 7.5) draw(xf, 7.5, 13, 16, H);
    }
  };

  E.Actors = Actors;
})(typeof window !== 'undefined' ? window : globalThis);
