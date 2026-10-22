'use strict';
/* BlockRealm — AABB physics, the player, mobs and particles. */

const GRAVITY = 30, JUMP_V = 8.7, TERMINAL = 60;

function boxCollides(world, x, y, z, hw, h) {
  const x0 = Math.floor(x - hw), x1 = Math.floor(x + hw), y0 = Math.floor(y), y1 = Math.floor(y + h - 1e-6), z0 = Math.floor(z - hw), z1 = Math.floor(z + hw);
  for (let by = y0; by <= y1; by++) for (let bz = z0; bz <= z1; bz++) for (let bx = x0; bx <= x1; bx++) {
    if (SOLID[world.getBlock(bx, by, bz)]) return true;
  }
  return false;
}
function boxTouches(world, e, id, grow = 0.05) {
  const x0 = Math.floor(e.x - e.hw - grow), x1 = Math.floor(e.x + e.hw + grow), y0 = Math.floor(e.y - grow), y1 = Math.floor(e.y + e.h), z0 = Math.floor(e.z - e.hw - grow), z1 = Math.floor(e.z + e.hw + grow);
  for (let by = y0; by <= y1; by++) for (let bz = z0; bz <= z1; bz++) for (let bx = x0; bx <= x1; bx++) if (world.getBlock(bx, by, bz) === id) return true;
  return false;
}

function moveEntity(world, e, dt) {
  for (let k = 0; k < 4 && boxCollides(world, e.x, e.y, e.z, e.hw, e.h); k++) e.y = Math.floor(e.y) + 1;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(e.vx), Math.abs(e.vy), Math.abs(e.vz)) * dt / 0.3));
  const sdt = dt / steps;
  e.onGround = false; e.hitX = false; e.hitZ = false;
  for (let s = 0; s < steps; s++) {
    let ny = e.y + e.vy * sdt;
    if (boxCollides(world, e.x, ny, e.z, e.hw, e.h)) {
      if (e.vy < 0) { ny = Math.floor(ny) + 1; e.onGround = true; } else ny = Math.floor(ny + e.h) - e.h - 0.001;
      e.vy = 0;
    }
    e.y = ny;
    let nx = e.x + e.vx * sdt;
    if (boxCollides(world, nx, e.y, e.z, e.hw, e.h)) {
      nx = e.vx > 0 ? Math.floor(nx + e.hw) - e.hw - 0.001 : Math.floor(nx - e.hw) + 1 + e.hw + 0.001;
      e.vx = 0; e.hitX = true;
    }
    e.x = nx;
    let nz = e.z + e.vz * sdt;
    if (boxCollides(world, e.x, e.y, nz, e.hw, e.h)) {
      nz = e.vz > 0 ? Math.floor(nz + e.hw) - e.hw - 0.001 : Math.floor(nz - e.hw) + 1 + e.hw + 0.001;
      e.vz = 0; e.hitZ = true;
    }
    e.z = nz;
  }
  if (!e.onGround && e.vy <= 0 && boxCollides(world, e.x, e.y - 0.02, e.z, e.hw, e.h)) e.onGround = true;
}

function rayAABB(ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1) {
  let tmin = 0, tmax = Infinity;
  const o = [ox, oy, oz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let a = 0; a < 3; a++) {
    if (Math.abs(d[a]) < 1e-9) { if (o[a] < lo[a] || o[a] > hi[a]) return Infinity; continue; }
    let t1 = (lo[a] - o[a]) / d[a], t2 = (hi[a] - o[a]) / d[a];
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}

class Player {
  constructor() {
    this.x = 0; this.y = 80; this.z = 0; this.vx = 0; this.vy = 0; this.vz = 0;
    this.yaw = 0; this.pitch = 0; this.hw = 0.3; this.h = 1.8; this.eye = 1.62;
    this.onGround = false; this.flying = false; this.inWater = false; this.headInWater = false; this.inLava = false;
    this.health = 20; this.air = 10; this.fallStart = null; this.hurtCd = 0; this.sinceHurt = 99; this.regen = 0;
    this.sprinting = false; this.sneaking = false; this.stepDist = 0; this.bobPhase = 0; this.bobAmt = 0; this.dmgTick = 0;
    this.dead = false;
  }
  eyeY() { return this.y + (this.sneaking && !this.flying ? this.eye - 0.12 : this.eye); }
  look() { const c = Math.cos(this.pitch); return [-Math.sin(this.yaw) * c, Math.sin(this.pitch), -Math.cos(this.yaw) * c]; }

  damage(n, ev, kx = 0, kz = 0) {
    if (this.dead || this.hurtCd > 0 || n <= 0) return;
    this.health = Math.max(0, this.health - n);
    this.hurtCd = 0.5; this.sinceHurt = 0;
    this.vx += kx * 6; this.vz += kz * 6; if (kx || kz) this.vy = Math.max(this.vy, 4.5);
    ev.push({ type: 'hurt' });
    if (this.health <= 0) { this.dead = true; ev.push({ type: 'death' }); }
  }

  update(dt, inp, world, survival, ev) {
    if (this.dead) return;
    this.hurtCd = Math.max(0, this.hurtCd - dt);
    this.sinceHurt += dt;
    let mx = inp.moveX, mz = inp.moveZ;
    const ml = Math.hypot(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    this.sneaking = inp.sneak && !this.flying;
    if (inp.sprint && mz > 0.4 && !this.sneaking) this.sprinting = true;
    if (mz <= 0.1 || this.sneaking || (this.hitX && this.hitZ)) this.sprinting = false;
    const liquid = (this.inWater || this.inLava) && !this.flying;
    let speed = this.flying ? (this.sprinting ? 21 : 10.9) : this.sneaking ? 1.31 : this.sprinting ? 5.6 : 4.32;
    if (liquid) speed *= this.inLava ? 0.35 : 0.55;
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    const wx = (-sy * mz + cy * mx) * speed, wz = (-cy * mz - sy * mx) * speed;
    const k = this.flying ? 9 : this.onGround ? 16 : liquid ? 6 : 2.6;
    this.vx += (wx - this.vx) * Math.min(1, k * dt);
    this.vz += (wz - this.vz) * Math.min(1, k * dt);
    if (this.flying) {
      const target = ((inp.jump ? 1 : 0) - (inp.sneak ? 1 : 0)) * 9;
      this.vy += (target - this.vy) * Math.min(1, 10 * dt);
    } else if (liquid) {
      this.vy -= GRAVITY * 0.2 * dt;
      this.vy *= Math.max(0, 1 - 2.4 * dt);
      if (inp.jump) this.vy = Math.min(this.vy + 24 * dt, (this.hitX || this.hitZ) ? 5 : 3.4);
    } else {
      this.vy = Math.max(this.vy - GRAVITY * dt, -TERMINAL);
      if (inp.jump && this.onGround) { this.vy = JUMP_V; if (this.sprinting) { this.vx += -sy * 1.5; this.vz += -cy * 1.5; } }
    }
    if (inp.autoJump && this.onGround && !this.flying && ml > 0.3) {
      const ax = Math.floor(this.x + (wx / (speed || 1)) * 0.7), az = Math.floor(this.z + (wz / (speed || 1)) * 0.7), fy = Math.floor(this.y + 0.01);
      if (SOLID[world.getBlock(ax, fy, az)] && !SOLID[world.getBlock(ax, fy + 1, az)] && !SOLID[world.getBlock(ax, fy + 2, az)] && !SOLID[world.getBlock(Math.floor(this.x), fy + 2, Math.floor(this.z))]) this.vy = JUMP_V;
    }
    const prevGround = this.onGround;
    moveEntity(world, this, dt);
    if (this.flying && this.onGround) this.flying = false;

    const fx = Math.floor(this.x), fz = Math.floor(this.z);
    const feet = world.getBlock(fx, Math.floor(this.y + 0.1), fz), mid = world.getBlock(fx, Math.floor(this.y + 0.9), fz);
    const head = world.getBlock(fx, Math.floor(this.eyeY()), fz);
    const wasInWater = this.inWater;
    this.inWater = feet === B.water || mid === B.water;
    this.inLava = feet === B.lava || mid === B.lava;
    this.headInWater = head === B.water;
    if (this.inWater && !wasInWater && this.vy < -4) ev.push({ type: 'splash' });

    if (this.flying || liquid || this.vy > 0) this.fallStart = null;
    if (!this.onGround && !this.flying && !liquid) this.fallStart = Math.max(this.fallStart ?? this.y, this.y);
    if (this.onGround && !prevGround) {
      if (this.fallStart !== null && survival) {
        const d = this.fallStart - this.y;
        if (d > 3.5) this.damage(Math.floor(d - 3), ev);
      }
      if (this.fallStart !== null && this.fallStart - this.y > 1.2) ev.push({ type: 'land', block: world.getBlock(fx, Math.floor(this.y - 0.5), fz) });
      this.fallStart = null;
    }

    if (survival) {
      if (this.headInWater) {
        this.air -= dt;
        if (this.air < 0) { this.dmgTick += dt; if (this.dmgTick > 1) { this.dmgTick = 0; this.hurtCd = 0; this.damage(2, ev); } }
      } else this.air = Math.min(10, this.air + dt * 5);
      if (this.inLava) { this.hurtCd = Math.min(this.hurtCd, 0.5); this.damage(4, ev); }
      if (boxTouches(world, this, B.cactus)) this.damage(1, ev);
      if (this.health < 20 && this.sinceHurt > 5) { this.regen += dt; if (this.regen > 2.5) { this.regen = 0; this.health += 1; } }
    } else { this.air = 10; this.health = 20; }

    const hs = Math.hypot(this.vx, this.vz);
    if (this.onGround && hs > 0.5) {
      this.stepDist += hs * dt;
      this.bobPhase += hs * dt * 2.1;
      if (this.stepDist > (this.sprinting ? 2.4 : 1.9)) { this.stepDist = 0; ev.push({ type: 'step', block: world.getBlock(fx, Math.floor(this.y - 0.2), fz) }); }
    }
    this.bobAmt += ((this.onGround && hs > 0.5 ? Math.min(1, hs / 4.3) : 0) - this.bobAmt) * Math.min(1, dt * 8);
  }
}

/* ---------- mobs ---------- */
const P = 1 / 16;
const MOB_DEFS = {
  pig: {
    hw: 0.45, h: 0.9, hp: 10, speed: 1.3, sound: 'pig', drop: [I.raw_meat, 1, 2],
    parts: [
      { s: [10, 8, 16], p: [-5, 6, -8], c: [0.92, 0.6, 0.58] },
      { s: [8, 8, 8], p: [-4, 8, -14], c: [0.94, 0.63, 0.6], pv: [0, 12, -6], head: 1 },
      { s: [4, 3, 1], p: [-2, 9, -15], c: [0.96, 0.52, 0.52], pv: [0, 12, -6], head: 1 },
      { s: [1.2, 1.2, 0.3], p: [-3.6, 13, -14.2], c: [0.06, 0.05, 0.05], pv: [0, 12, -6], head: 1 },
      { s: [1.2, 1.2, 0.3], p: [2.4, 13, -14.2], c: [0.06, 0.05, 0.05], pv: [0, 12, -6], head: 1 },
      { s: [4, 6, 4], p: [-5, 0, -7], c: [0.88, 0.57, 0.55], pv: [-3, 6, -5], leg: 1 },
      { s: [4, 6, 4], p: [1, 0, -7], c: [0.88, 0.57, 0.55], pv: [3, 6, -5], leg: -1 },
      { s: [4, 6, 4], p: [-5, 0, 3], c: [0.88, 0.57, 0.55], pv: [-3, 6, 5], leg: -1 },
      { s: [4, 6, 4], p: [1, 0, 3], c: [0.88, 0.57, 0.55], pv: [3, 6, 5], leg: 1 },
    ],
  },
  cow: {
    hw: 0.45, h: 1.4, hp: 10, speed: 1.1, sound: 'cow', drop: [I.raw_meat, 1, 3],
    parts: [
      { s: [12, 10, 18], p: [-6, 12, -9], c: [0.3, 0.2, 0.13], c2: [0.92, 0.9, 0.86, 0.55] },
      { s: [8, 8, 6], p: [-4, 16, -15], c: [0.3, 0.2, 0.13], c2: [0.92, 0.9, 0.86, 0.6], pv: [0, 20, -9], head: 1 },
      { s: [4, 3, 1], p: [-2, 16, -16], c: [0.78, 0.6, 0.55], pv: [0, 20, -9], head: 1 },
      { s: [1, 3, 1], p: [-5, 23, -13], c: [0.85, 0.82, 0.74], pv: [0, 20, -9], head: 1 },
      { s: [1, 3, 1], p: [4, 23, -13], c: [0.85, 0.82, 0.74], pv: [0, 20, -9], head: 1 },
      { s: [1.2, 1.2, 0.3], p: [-3.4, 20, -15.2], c: [0.05, 0.05, 0.05], pv: [0, 20, -9], head: 1 },
      { s: [1.2, 1.2, 0.3], p: [2.2, 20, -15.2], c: [0.05, 0.05, 0.05], pv: [0, 20, -9], head: 1 },
      { s: [4, 12, 4], p: [-6, 0, -8], c: [0.3, 0.2, 0.13], c2: [0.92, 0.9, 0.86, 0.6], pv: [-4, 12, -6], leg: 1 },
      { s: [4, 12, 4], p: [2, 0, -8], c: [0.3, 0.2, 0.13], c2: [0.92, 0.9, 0.86, 0.6], pv: [4, 12, -6], leg: -1 },
      { s: [4, 12, 4], p: [-6, 0, 4], c: [0.3, 0.2, 0.13], c2: [0.92, 0.9, 0.86, 0.6], pv: [-4, 12, 6], leg: -1 },
      { s: [4, 12, 4], p: [2, 0, 4], c: [0.3, 0.2, 0.13], c2: [0.92, 0.9, 0.86, 0.6], pv: [4, 12, 6], leg: 1 },
    ],
  },
  sheep: {
    hw: 0.45, h: 1.3, hp: 8, speed: 1.2, sound: 'sheep', drop: [B.wool_white, 1, 2],
    parts: [
      { s: [12, 10, 16], p: [-6, 12, -8], c: [0.9, 0.9, 0.88] },
      { s: [6, 6, 8], p: [-3, 16, -14], c: [0.62, 0.55, 0.48], pv: [0, 19, -7], head: 1 },
      { s: [7, 3, 6], p: [-3.5, 21, -13], c: [0.9, 0.9, 0.88], pv: [0, 19, -7], head: 1 },
      { s: [1.2, 1.2, 0.3], p: [-2.6, 19, -14.2], c: [0.05, 0.05, 0.05], pv: [0, 19, -7], head: 1 },
      { s: [1.2, 1.2, 0.3], p: [1.4, 19, -14.2], c: [0.05, 0.05, 0.05], pv: [0, 19, -7], head: 1 },
      { s: [4, 12, 4], p: [-5, 0, -7], c: [0.62, 0.55, 0.48], pv: [-3, 12, -5], leg: 1 },
      { s: [4, 12, 4], p: [1, 0, -7], c: [0.62, 0.55, 0.48], pv: [3, 12, -5], leg: -1 },
      { s: [4, 12, 4], p: [-5, 0, 3], c: [0.62, 0.55, 0.48], pv: [-3, 12, 5], leg: -1 },
      { s: [4, 12, 4], p: [1, 0, 3], c: [0.62, 0.55, 0.48], pv: [3, 12, 5], leg: 1 },
    ],
  },
  zombie: {
    hw: 0.3, h: 1.95, hp: 20, speed: 2.4, sound: 'zombie', hostile: true, drop: null,
    parts: [
      { s: [8, 12, 4], p: [-4, 12, -2], c: [0.12, 0.5, 0.55] },
      { s: [8, 8, 8], p: [-4, 24, -4], c: [0.33, 0.55, 0.3], pv: [0, 24, 0], head: 1 },
      { s: [1.6, 1.2, 0.3], p: [-3, 28, -4.2], c: [0.04, 0.06, 0.04], pv: [0, 24, 0], head: 1 },
      { s: [1.6, 1.2, 0.3], p: [1.4, 28, -4.2], c: [0.04, 0.06, 0.04], pv: [0, 24, 0], head: 1 },
      { s: [4, 12, 4], p: [-8, 12, -2], c: [0.33, 0.55, 0.3], pv: [-6, 22, 0], arm: 1 },
      { s: [4, 12, 4], p: [4, 12, -2], c: [0.33, 0.55, 0.3], pv: [6, 22, 0], arm: -1 },
      { s: [4, 12, 4], p: [-4, 0, -2], c: [0.2, 0.22, 0.52], pv: [-2, 12, 0], leg: 1 },
      { s: [4, 12, 4], p: [0, 0, -2], c: [0.2, 0.22, 0.52], pv: [2, 12, 0], leg: -1 },
    ],
  },
};

const angleDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

class Mob {
  constructor(type, x, y, z, rnd) {
    const d = MOB_DEFS[type];
    this.type = type; this.def = d;
    this.x = x; this.y = y; this.z = z; this.vx = 0; this.vy = 0; this.vz = 0;
    this.hw = d.hw; this.h = d.h; this.hp = d.hp;
    this.yaw = rnd() * Math.PI * 2; this.headYaw = 0; this.headPitch = 0;
    this.dir = this.yaw; this.moving = false; this.timer = rnd() * 3;
    this.walk = 0; this.walkAmt = 0; this.hurt = 0; this.flee = 0; this.attackCd = 0; this.burn = 0;
    this.dead = false; this.soundTimer = 4 + rnd() * 10; this.rnd = rnd;
  }
  update(dt, world, player, survival, night, ev) {
    const d = this.def, rnd = this.rnd;
    this.hurt = Math.max(0, this.hurt - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.timer -= dt;
    let speed = d.speed, wantX = 0, wantZ = 0;
    const pdx = player.x - this.x, pdz = player.z - this.z, pdist = Math.hypot(pdx, pdz);
    if (d.hostile && survival && !player.dead && pdist < 26 && Math.abs(player.y - this.y) < 12) {
      wantX = pdx / (pdist || 1); wantZ = pdz / (pdist || 1);
      if (pdist < 1.3) { wantX *= 0.2; wantZ *= 0.2; }
      if (pdist < 1.5 && Math.abs(player.y - this.y) < 1.6 && this.attackCd <= 0) {
        player.damage(3, ev, wantX, wantZ);
        this.attackCd = 1.1;
      }
    } else if (this.flee > 0) {
      this.flee -= dt;
      wantX = -pdx / (pdist || 1); wantZ = -pdz / (pdist || 1);
      speed *= 2.1;
    } else {
      if (this.timer <= 0) {
        this.moving = rnd() > 0.45;
        this.dir = rnd() * Math.PI * 2;
        this.timer = 2 + rnd() * 5;
      }
      if (this.moving) { wantX = -Math.sin(this.dir); wantZ = -Math.cos(this.dir); }
    }
    const moving = Math.abs(wantX) + Math.abs(wantZ) > 0.01;
    if (moving && this.onGround) {
      const ax = Math.floor(this.x + wantX * (this.hw + 0.4)), az = Math.floor(this.z + wantZ * (this.hw + 0.4)), fy = Math.floor(this.y + 0.01);
      const front = world.getBlock(ax, fy, az);
      if (!d.hostile && (front === B.water || front === B.lava || (!SOLID[world.getBlock(ax, fy - 1, az)] && !SOLID[world.getBlock(ax, fy - 2, az)] && !SOLID[world.getBlock(ax, fy - 3, az)]))) {
        wantX = 0; wantZ = 0; this.timer = 0; this.flee = 0;
      } else if (SOLID[front] && !SOLID[world.getBlock(ax, fy + 1, az)] && !SOLID[world.getBlock(ax, fy + 2, az)]) this.vy = JUMP_V * 0.95;
    }
    const inWater = world.getBlock(Math.floor(this.x), Math.floor(this.y + 0.4), Math.floor(this.z)) === B.water;
    const k = this.onGround ? 10 : 2.5;
    this.vx += (wantX * speed - this.vx) * Math.min(1, k * dt);
    this.vz += (wantZ * speed - this.vz) * Math.min(1, k * dt);
    if (inWater) this.vy = Math.min(this.vy + 30 * dt, 2.2); else this.vy = Math.max(this.vy - GRAVITY * dt, -TERMINAL);
    moveEntity(world, this, dt);
    if ((this.hitX || this.hitZ) && this.onGround && moving) this.vy = JUMP_V * 0.95;
    const hs = Math.hypot(this.vx, this.vz);
    if (hs > 0.15) this.yaw += angleDiff(this.yaw, Math.atan2(-this.vx, -this.vz)) * Math.min(1, dt * 7);
    if (d.hostile && pdist < 10) this.headYaw = clamp(angleDiff(this.yaw, Math.atan2(-pdx, -pdz)), -0.8, 0.8);
    else this.headYaw *= Math.max(0, 1 - dt * 3);
    this.walk += hs * dt * 5.5;
    this.walkAmt += (Math.min(1, hs / 1.5) - this.walkAmt) * Math.min(1, dt * 8);
    if (d.hostile && !night && world.getLight(Math.floor(this.x), Math.floor(this.y + 1.6), Math.floor(this.z)) >= 14) {
      this.burn += dt;
      if (this.burn > 0.5) { this.burn = 0; this.hp -= 2; this.hurt = 0.2; ev.push({ type: 'smoke', x: this.x, y: this.y + 1.2, z: this.z }); }
      if (this.hp <= 0) this.dead = true;
    }
    if (this.y < -10) this.dead = true;
    this.soundTimer -= dt;
    if (this.soundTimer <= 0) { this.soundTimer = 6 + rnd() * 14; if (pdist < 16) ev.push({ type: 'mob', mob: this.type, dist: pdist }); }
  }
  hit(dmg, fromX, fromZ, ev) {
    this.hp -= dmg; this.hurt = 0.35;
    const dx = this.x - fromX, dz = this.z - fromZ, l = Math.hypot(dx, dz) || 1;
    this.vx = dx / l * 7; this.vz = dz / l * 7; this.vy = 5.5;
    if (!this.def.hostile) this.flee = 4;
    ev.push({ type: 'mob', mob: this.type, dist: 2, hurt: true });
    if (this.hp <= 0) this.dead = true;
  }
  boxes(world, out) {
    const d = this.def, sky = world.getLight(Math.floor(this.x), Math.floor(this.y + this.h * 0.7), Math.floor(this.z)) / 15;
    const swing = Math.sin(this.walk) * 0.7 * this.walkAmt;
    for (const part of d.parts) {
      const m = M4.create();
      M4.translate(m, m, this.x, this.y, this.z);
      M4.rotateY(m, m, this.yaw);
      if (part.pv) {
        const [px, py, pz] = part.pv;
        M4.translate(m, m, px * P, py * P, pz * P);
        if (part.leg) M4.rotateX(m, m, swing * part.leg);
        if (part.head) { M4.rotateY(m, m, this.headYaw); M4.rotateX(m, m, this.headPitch); }
        if (part.arm) M4.rotateX(m, m, -Math.PI / 2 + Math.sin(this.walk * 0.5) * 0.08 * part.arm);
        M4.translate(m, m, -px * P, -py * P, -pz * P);
      }
      M4.translate(m, m, part.p[0] * P, part.p[1] * P, part.p[2] * P);
      M4.scale(m, m, part.s[0] * P, part.s[1] * P, part.s[2] * P);
      out.push({ m, color: [...part.c, 1], color2: part.c2, size: [part.s[0] * P, part.s[1] * P, part.s[2] * P], sky, hurt: this.hurt > 0 ? 1 : 0 });
    }
  }
}

class MobManager {
  constructor(seed) { this.list = []; this.timer = 0; this.rnd = mulberry32(seed ^ 0x51ab); }
  update(dt, world, player, survival, night, ev, enabled) {
    for (const m of this.list) m.update(dt, world, player, survival, night, ev);
    for (const m of this.list) {
      if (m.dead) {
        ev.push({ type: 'mobdeath', mob: m });
      }
    }
    this.list = this.list.filter((m) => !m.dead && Math.hypot(m.x - player.x, m.z - player.z) < 80 && world.isLoadedAt(Math.floor(m.x), Math.floor(m.z)));
    if (!enabled) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 1.2;
    const rnd = this.rnd;
    const animals = this.list.filter((m) => !m.def.hostile).length, zombies = this.list.length - animals;
    const tryZombie = survival && night && zombies < 6;
    if (animals >= 10 && !tryZombie) return;
    const a = rnd() * Math.PI * 2, dist = 22 + rnd() * 24;
    const x = Math.floor(player.x + Math.cos(a) * dist), z = Math.floor(player.z + Math.sin(a) * dist);
    if (!world.isLoadedAt(x, z)) return;
    const y = world.surfaceY(x, z), ground = world.getBlock(x, y, z);
    if (y < SEA || world.getBlock(x, y + 1, z) !== 0 && RENDERT[world.getBlock(x, y + 1, z)] !== RENDER.CROSS || world.getBlock(x, y + 2, z) !== 0) return;
    if (tryZombie && rnd() < 0.6) {
      if (!SOLID[ground]) return;
      this.list.push(new Mob('zombie', x + 0.5, y + 1, z + 0.5, rnd));
    } else if (animals < 10 && (ground === B.grass || ground === B.snow_grass)) {
      const types = ['pig', 'cow', 'sheep'], t = types[(rnd() * 3) | 0], n = 1 + ((rnd() * 3) | 0);
      for (let i = 0; i < n; i++) this.list.push(new Mob(t, x + 0.5 + rnd() * 0.6 - 0.3, y + 1, z + 0.5 + rnd() * 0.6 - 0.3, rnd));
    }
  }
  raycast(ox, oy, oz, dx, dy, dz, maxD) {
    let best = null, bt = maxD;
    for (const m of this.list) {
      const t = rayAABB(ox, oy, oz, dx, dy, dz, m.x - m.hw - 0.1, m.y, m.z - m.hw - 0.1, m.x + m.hw + 0.1, m.y + m.h + 0.1, m.z + m.hw + 0.1);
      if (t < bt) { bt = t; best = m; }
    }
    return best ? { mob: best, dist: bt } : null;
  }
  blocks(x, y, z) {
    for (const m of this.list) {
      if (x + 1 > m.x - m.hw && x < m.x + m.hw && y + 1 > m.y && y < m.y + m.h && z + 1 > m.z - m.hw && z < m.z + m.hw) return true;
    }
    return false;
  }
}

/* ---------- particles ---------- */
class Particles {
  constructor() { this.list = []; this.rnd = mulberry32(1234); }
  blockBurst(x, y, z, id, light, n = 22) {
    const d = BLOCKS[id];
    if (!d || !d.tex) return;
    const r = this.rnd, layer = d.tex[2];
    const tint = d.tintAll || d.tintTop ? [0.75, 1.0, 0.6] : [1, 1, 1];
    const b = 0.15 + light * 0.85;
    for (let i = 0; i < n; i++) {
      this.list.push({
        x: x + 0.15 + r() * 0.7, y: y + 0.15 + r() * 0.7, z: z + 0.15 + r() * 0.7,
        vx: (r() - 0.5) * 4, vy: r() * 4 + 1, vz: (r() - 0.5) * 4, life: 0.5 + r() * 0.6,
        layer, u: r() * 0.75, v: r() * 0.75, size: 0.07 + r() * 0.07, r: tint[0] * b, g: tint[1] * b, b: tint[2] * b,
      });
    }
  }
  puff(x, y, z, n, gray, light) {
    const r = this.rnd, layer = TILE.wool_white, b = (0.2 + light * 0.8) * gray;
    for (let i = 0; i < n; i++) {
      this.list.push({ x: x + (r() - 0.5) * 0.8, y: y + r() * 0.8, z: z + (r() - 0.5) * 0.8, vx: (r() - 0.5) * 1.5, vy: 0.6 + r() * 1.4, vz: (r() - 0.5) * 1.5,
        life: 0.6 + r() * 0.6, layer, u: r() * 0.75, v: r() * 0.75, size: 0.14 + r() * 0.12, r: b, g: b, b: b, float: true });
    }
  }
  update(dt, world) {
    for (const p of this.list) {
      p.life -= dt;
      if (p.float) { p.vy += 1.5 * dt; p.size *= 1 + dt * 0.6; }
      else p.vy -= 18 * dt;
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt, nz = p.z + p.vz * dt;
      if (!p.float && SOLID[world.getBlock(Math.floor(nx), Math.floor(ny), Math.floor(nz))]) {
        p.vx *= 0.4; p.vz *= 0.4; p.vy = 0;
      } else { p.x = nx; p.y = ny; p.z = nz; }
    }
    this.list = this.list.filter((p) => p.life > 0);
    if (this.list.length > 1500) this.list.splice(0, this.list.length - 1500);
  }
}

/* ---------- rain / snow around the camera, stopped by roofs ---------- */
class Precip {
  constructor(n = 1000) { this.n = n; this.d = new Float32Array(n * 4).fill(-1e4); this.verts = new Float32Array(n * 24); this.count = 0; this.snow = false; this.rnd = mulberry32(99); }
  update(dt, cam, world, intensity, snow) {
    this.snow = snow;
    const R = 12, n = Math.floor(this.n * clamp(intensity, 0, 1)), d = this.d, v = this.verts, r = this.rnd;
    const speed = snow ? 2.4 : 18, wind = snow ? 0.6 : 1.6, len = 1.05;
    const rx = Math.cos(cam.yaw) * 0.016, rz = -Math.sin(cam.yaw) * 0.016, sl = -wind * 0.045;
    let k = 0, w = 0;
    const put = (x, y, z, a) => { v[w++] = x; v[w++] = y; v[w++] = z; v[w++] = a; };
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      if (d[o + 1] < -1e3 || Math.abs(d[o] - cam.x) > R || Math.abs(d[o + 2] - cam.z) > R || d[o + 1] > cam.y + 22) {
        d[o] = cam.x + (r() * 2 - 1) * R; d[o + 2] = cam.z + (r() * 2 - 1) * R;
        d[o + 1] = d[o + 1] < -1e3 ? cam.y - 8 + r() * 26 : cam.y + 10 + r() * 10;
        d[o + 3] = 0.8 + r() * 0.4;
      }
      d[o + 1] -= speed * d[o + 3] * dt;
      d[o] += wind * dt * (snow ? Math.sin(d[o + 1] * 0.7 + i) : 1);
      const x = Math.floor(d[o]), z = Math.floor(d[o + 2]);
      const c = world.getChunk(x >> 4, z >> 4);
      const ground = c ? c.skyBottom[(z & 15) * CS + (x & 15)] : 0;
      if (d[o + 1] < ground || d[o + 1] < cam.y - 14) { d[o + 1] = cam.y + 10 + r() * 10; d[o] = cam.x + (r() * 2 - 1) * R; d[o + 2] = cam.z + (r() * 2 - 1) * R; continue; }
      if (snow) { const q = k * 4; v[q] = d[o]; v[q + 1] = d[o + 1]; v[q + 2] = d[o + 2]; v[q + 3] = 1; }
      else {
        const x0 = d[o], y0 = d[o + 1], z0 = d[o + 2], y1 = y0 + len;
        w = k * 24;
        put(x0 - rx + sl, y1, z0 - rz, 0.3); put(x0 + rx + sl, y1, z0 + rz, 0.3); put(x0 + rx, y0, z0 + rz, 1);
        put(x0 - rx + sl, y1, z0 - rz, 0.3); put(x0 + rx, y0, z0 + rz, 1); put(x0 - rx, y0, z0 - rz, 1);
      }
      k++;
    }
    this.count = k;
  }
}
