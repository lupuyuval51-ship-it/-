/* EXIT 8 — moving things: the man (and his anomalies), the red wave, the shadow,
 * the clock hands and the poster's pupils. */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});
  const M4 = E.M4;

  const SKIN = [0.82, 0.6, 0.46], SHIRT = [0.88, 0.89, 0.9], PANTS = [0.2, 0.21, 0.24];
  const HAIR = [0.12, 0.11, 0.1], SHOE = [0.04, 0.04, 0.04], TIE = [0.09, 0.12, 0.26], CASE = [0.26, 0.15, 0.08];
  const WALK = 1.25;

  E.createActorMeshes = function (renderer) {
    const T = E.TEX;
    const m = (tint, extra) => Object.assign({ layer: T.white, tint }, extra || {});
    const build = fn => { const b = new E.Builder(); fn(b); return renderer.createMesh(b.pack()); };
    const head = smile => build(b => {
      b.box(0, 0.14, 0, 0.21, 0.25, 0.23, m(SKIN), { pz: { layer: smile ? T.faceSmile : T.face, tint: [1, 1, 1] } });
      b.box(0, 0.17, -0.105, 0.225, 0.17, 0.05, m(HAIR));
      b.box(0.11, 0.2, -0.02, 0.03, 0.1, 0.18, m(HAIR));
      b.box(-0.11, 0.2, -0.02, 0.03, 0.1, 0.18, m(HAIR));
      b.box(0, 0.272, -0.02, 0.2, 0.025, 0.19, m([0.3, 0.26, 0.23]));
      b.box(0.113, 0.13, 0, 0.03, 0.06, 0.045, m(SKIN));
      b.box(-0.113, 0.13, 0, 0.03, 0.06, 0.045, m(SKIN));
    });
    return {
      torso: build(b => {
        b.box(0, 1.2, 0, 0.44, 0.58, 0.24, m(SHIRT));
        b.box(0, 1.47, 0.02, 0.3, 0.05, 0.22, m(SHIRT));
        b.box(0, 1.24, 0.126, 0.07, 0.42, 0.012, m(TIE));
        b.box(0, 0.92, 0, 0.445, 0.05, 0.245, m([0.06, 0.05, 0.05]));
        b.box(0, 0.86, 0, 0.4, 0.1, 0.23, m(PANTS));
        b.box(0, 1.52, 0, 0.1, 0.1, 0.1, m(SKIN));
      }),
      head: head(false),
      headSmile: head(true),
      leg: build(b => {
        b.box(0, -0.42, 0, 0.15, 0.8, 0.17, m(PANTS));
        b.box(0, -0.83, 0.04, 0.12, 0.07, 0.27, m(SHOE, { spec: 0.4 }));
      }),
      arm: build(b => {
        b.box(0, -0.26, 0, 0.12, 0.56, 0.13, m(SHIRT));
        b.box(0, -0.6, 0, 0.08, 0.1, 0.09, m(SKIN));
      }),
      armCase: build(b => {
        b.box(0, -0.26, 0, 0.12, 0.56, 0.13, m(SHIRT));
        b.box(0, -0.6, 0, 0.08, 0.1, 0.09, m(SKIN));
        b.box(0, -0.68, 0, 0.02, 0.05, 0.1, m([0.05, 0.04, 0.03]));
        b.box(0, -0.85, 0, 0.08, 0.28, 0.4, m(CASE, { spec: 0.35 }));
      }),
      cube: build(b => b.box(0, 0, 0, 1, 1, 1, m([0.13, 0.0, 0.003], { spec: 1.6, emis: [0.012, 0, 0] }))),
      pupil: build(b => b.disc([0, 0, 0], [1, 0, 0], 0.036, 0.006, 14, m([0.05, 0.04, 0.04], { spec: 0.6 }))),
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
          const step = man.speed * dt;
          if (man.z > 13.7) { man.z = Math.max(13.7, man.z - step); if (!man.backward) man.heading = Math.PI; }
          else { man.x -= step; if (!man.backward) man.heading = -Math.PI / 2; else man.heading = Math.PI / 2; }
          moving = 1;
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
        if (Math.hypot(man.x - p.x, man.z - p.z) < 0.85) { this.caught = true; ev.push({ type: 'caught' }); }
      }
      if (man.stare && dist < 16) {
        const rel = wrapAngle(angleTo(man.x, man.z, p.x, p.z) - man.heading);
        man.headYaw = approach(man.headYaw, Math.max(-1.6, Math.min(1.6, rel)), dt * 5);
      }
      if (moving) {
        const stride = moving > 2 ? 0.55 : 0.36;
        man.phase += (moving > 2 ? 3.4 : man.speed) * dt / stride;
        man.stepAcc += (moving > 2 ? 3.4 : man.speed) * dt;
        if (man.stepAcc > (moving > 2 ? 1.0 : 0.72)) { man.stepAcc = 0; ev.push({ type: 'step', x: man.x, z: man.z, run: moving > 2, ceiling: man.ceiling }); }
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

    // Red wave.
    if (this.an === 'red_wave' && !this.wave && inHall && p.z > 21) {
      this.wave = { s: E.routeS(lay, 9, hl + 13), t: 0 };
      ev.push({ type: 'waveStart' });
    }
    if (this.wave) {
      this.wave.t += dt;
      this.wave.s -= Math.min(2.55, 0.8 + this.wave.t * 1.2) * dt;
      this.wave.gap = this.wave.s - sPlayer;
      if (this.wave.gap < 0.35 && !this.caught) { this.caught = true; ev.push({ type: 'caught' }); }
    }

    // Shadow at the end of the corridor vanishes when you get close.
    if (this.shadow && this.shadow.alive && Math.hypot(this.shadow.x - p.x, this.shadow.z - p.z) < 10) {
      this.shadow.alive = false;
      ev.push({ type: 'vanish' });
    }
    return ev;
  };

  function drawMan(r, M, man, world, dyn, tintOv) {
    const sc = man.scale;
    const bob = man.moving ? Math.abs(Math.sin(man.phase)) * 0.03 : 0;
    const base = man.ceiling
      ? M4.chain(M4.translate(man.x, E.CEIL, man.z), M4.rotY(man.heading), M4.scale(sc, -sc, sc))
      : M4.chain(M4.translate(man.x, 0, man.z), M4.rotY(man.heading), M4.scale(sc, sc, sc));
    const light = tintOv ? { col: [0, 0, 0], dir: [0, 1, 0] } : E.sampleLight(world, man.x, man.ceiling ? 2.0 : 1.3, man.z, dyn);
    const dirSign = man.backward ? -1 : 1;
    const swing = man.moving ? Math.sin(man.phase) * 0.5 * dirSign : 0;
    r.drawObj(M.torso, M4.mul(base, M4.translate(0, bob, 0)), light, tintOv);
    r.drawObj(man.smile ? M.headSmile : M.head, M4.chain(base, M4.translate(0, 1.53 + bob, 0), M4.rotY(man.headYaw)), light, tintOv);
    r.drawObj(M.leg, M4.chain(base, M4.translate(-0.1, 0.86 + bob, 0), M4.rotX(swing)), light, tintOv);
    r.drawObj(M.leg, M4.chain(base, M4.translate(0.1, 0.86 + bob, 0), M4.rotX(-swing)), light, tintOv);
    r.drawObj(M.arm, M4.chain(base, M4.translate(-0.285, 1.46 + bob, 0), M4.rotX(-swing * 0.7)), light, tintOv);
    r.drawObj(M.armCase, M4.chain(base, M4.translate(0.285, 1.46 + bob, 0), M4.rotX(swing * 0.25)), light, tintOv);
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
