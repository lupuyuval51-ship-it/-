/* EXIT 8 — builds the corridor loop: geometry, decor, anomalies and baked lighting.
 * Pure data (no DOM / WebGL) so it can be unit-tested in node. */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});
  const STRIDE = 20;
  const LAMP = [0.97, 1.0, 1.0];
  const RED = [1.0, 0.12, 0.08];
  const LIGHT_RANGE = 11;

  // ------------------------------------------------------------------ mesh builder
  function Builder() {
    this.p = []; this.n = []; this.uv = []; this.layer = []; this.tint = []; this.emis = [];
    this.mat = []; this.ao = []; this.idx = []; this.count = 0;
  }
  Builder.prototype.vertex = function (x, y, z, nx, ny, nz, u, v, m) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v);
    this.layer.push(m.layer);
    const t = m.tint || [1, 1, 1], e = m.emis || [0, 0, 0];
    this.tint.push(t[0], t[1], t[2]); this.emis.push(e[0], e[1], e[2]);
    this.mat.push(m.dynEmis ? 1 : 0, m.spec || 0);
    this.ao.push(m.ao || 0);
    return this.count++;
  };
  /** Quad o + s*ax + t*ay (s,t ∈ [0,1]), normal n, uv = uv0 + s*du + t*dv, subdivided nu×nv. */
  Builder.prototype.quad = function (o, ax, ay, n, uv0, du, dv, m, nu, nv) {
    nu = nu || 1; nv = nv || 1;
    const base = this.count;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const s = i / nu, t = j / nv;
      this.vertex(o[0] + ax[0] * s + ay[0] * t, o[1] + ax[1] * s + ay[1] * t, o[2] + ax[2] * s + ay[2] * t,
        n[0], n[1], n[2], uv0[0] + du[0] * s + dv[0] * t, uv0[1] + du[1] * s + dv[1] * t, m);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      this.idx.push(a, b, d, a, d, c);
    }
  };
  /**
   * Upright rectangle facing direction n (horizontal unit vector), centred at c.
   * The texture reads correctly for a viewer looking at it. opts: {flipU, flipV, rot}
   */
  Builder.prototype.panel = function (c, n, w, h, m, opts) {
    const o = opts || {};
    let r = [-n[2], 0, n[0]], up = [0, 1, 0];
    if (o.rot) {
      const cs = Math.cos(o.rot), sn = Math.sin(o.rot);
      const r2 = [r[0] * cs + up[0] * sn, r[1] * cs + up[1] * sn, r[2] * cs + up[2] * sn];
      up = [up[0] * cs - r[0] * sn, up[1] * cs - r[1] * sn, up[2] * cs - r[2] * sn];
      r = r2;
    }
    const org = [c[0] - r[0] * w / 2 + up[0] * h / 2, c[1] - r[1] * w / 2 + up[1] * h / 2, c[2] - r[2] * w / 2 + up[2] * h / 2];
    const u0 = o.flipU ? 1 : 0, v0 = o.flipV ? 1 : 0;
    this.quad(org, [r[0] * w, r[1] * w, r[2] * w], [-up[0] * h, -up[1] * h, -up[2] * h], n,
      [u0, v0], [o.flipU ? -1 : 1, 0], [0, o.flipV ? -1 : 1], m, o.nu || 1, o.nv || 1);
  };
  /** Flat decal on the floor centred at (x, z), long axis along heading (dx, dz). */
  Builder.prototype.floorDecal = function (x, z, w, len, dx, dz, m, y) {
    const fx = dx, fz = dz, rx = dz, rz = -dx; // right of the heading
    const yy = y || 0.006;
    const org = [x - rx * w / 2 + fx * len / 2, yy, z - rz * w / 2 + fz * len / 2];
    this.quad(org, [rx * w, 0, rz * w], [-fx * len, 0, -fz * len], [0, 1, 0], [0, 0], [1, 0], [0, 1], m);
  };
  /** Box centred at (cx,cy,cz) with size (sx,sy,sz), rotated by rotY. faces: {px,nx,py,ny,pz,nz} materials. */
  Builder.prototype.box = function (cx, cy, cz, sx, sy, sz, m, faces, rotY, opts) {
    const f = faces || {};
    const a = rotY || 0, cs = Math.cos(a), sn = Math.sin(a);
    const R = v => [v[0] * cs + v[2] * sn, v[1], -v[0] * sn + v[2] * cs];
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const defs = [
      ['px', [1, 0, 0], hx, [0, 0, 1], sz, sy],
      ['nx', [-1, 0, 0], hx, [0, 0, -1], sz, sy],
      ['pz', [0, 0, 1], hz, [-1, 0, 0], sx, sy],
      ['nz', [0, 0, -1], hz, [1, 0, 0], sx, sy],
    ];
    for (const [key, nl, dist, rl, w, h] of defs) {
      const n = R(nl), r = R(rl);
      const c = [cx + n[0] * dist, cy + n[1] * dist, cz + n[2] * dist];
      const org = [c[0] - r[0] * w / 2, c[1] + h / 2, c[2] - r[2] * w / 2];
      const mm = f[key] || m;
      const fu = opts && opts.flipU && f[key];
      this.quad(org, [r[0] * w, 0, r[2] * w], [0, -h, 0], n, [fu ? 1 : 0, 0], [fu ? -1 : 1, 0], [0, 1], mm);
    }
    for (const [key, sy2] of [['py', 1], ['ny', -1]]) {
      const n = [0, sy2, 0], mm = f[key] || m;
      const ax = R([sx, 0, 0]), az = R([0, 0, sz]);
      const org = [cx - ax[0] / 2 - az[0] / 2, cy + sy2 * hy, cz - ax[2] / 2 - az[2] / 2];
      this.quad(org, ax, az, n, [0, 0], [1, 0], [0, 1], mm);
    }
  };
  /** Prism (n-gon cylinder) whose axis is the horizontal direction ax, centred at c. */
  Builder.prototype.disc = function (c, ax, radius, depth, sides, m) {
    const up = [0, 1, 0], r = [-ax[2], 0, ax[0]];
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2;
      const p = a => [c[0] + (r[0] * Math.cos(a)) * radius, c[1] + Math.sin(a) * radius, c[2] + (r[2] * Math.cos(a)) * radius];
      const p0 = p(a0), p1 = p(a1);
      const am = (a0 + a1) / 2;
      const n = [r[0] * Math.cos(am), Math.sin(am), r[2] * Math.cos(am)];
      const o = [p0[0] - ax[0] * depth / 2, p0[1], p0[2] - ax[2] * depth / 2];
      this.quad(o, [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], [ax[0] * depth, 0, ax[2] * depth], n, [0, 0], [1, 0], [0, 1], m);
      // caps as fans (front & back)
      for (const side of [1, -1]) {
        const cc = [c[0] + ax[0] * depth / 2 * side, c[1], c[2] + ax[2] * depth / 2 * side];
        const base = this.count;
        this.vertex(cc[0], cc[1], cc[2], ax[0] * side, 0, ax[2] * side, 0.5, 0.5, m);
        this.vertex(p0[0] + ax[0] * depth / 2 * side, p0[1], p0[2] + ax[2] * depth / 2 * side, ax[0] * side, 0, ax[2] * side, 0, 0, m);
        this.vertex(p1[0] + ax[0] * depth / 2 * side, p1[1], p1[2] + ax[2] * depth / 2 * side, ax[0] * side, 0, ax[2] * side, 1, 0, m);
        this.idx.push(base, base + 1, base + 2);
      }
    }
  };
  /** Packs into the interleaved vertex format. lit/dyn default to tint / 0 (for lit-at-runtime objects). */
  Builder.prototype.pack = function (lit, dyn) {
    const N = this.count, d = new Float32Array(N * STRIDE);
    for (let i = 0; i < N; i++) {
      const o = i * STRIDE, i3 = i * 3, i2 = i * 2;
      d[o] = this.p[i3]; d[o + 1] = this.p[i3 + 1]; d[o + 2] = this.p[i3 + 2];
      d[o + 3] = this.n[i3]; d[o + 4] = this.n[i3 + 1]; d[o + 5] = this.n[i3 + 2];
      d[o + 6] = this.uv[i2]; d[o + 7] = this.uv[i2 + 1];
      d[o + 8] = this.layer[i];
      const L = lit || this.tint;
      d[o + 9] = L[i3]; d[o + 10] = L[i3 + 1]; d[o + 11] = L[i3 + 2];
      if (dyn) { d[o + 12] = dyn[i3]; d[o + 13] = dyn[i3 + 1]; d[o + 14] = dyn[i3 + 2]; }
      d[o + 15] = this.emis[i3]; d[o + 16] = this.emis[i3 + 1]; d[o + 17] = this.emis[i3 + 2];
      d[o + 18] = this.mat[i2]; d[o + 19] = this.mat[i2 + 1];
    }
    return { data: d, index: new Uint32Array(this.idx), vertices: N };
  };
  E.Builder = Builder;

  // ------------------------------------------------------------------ lighting
  function visible(lay, ax, az, bx, bz) {
    for (const r of lay.rects) if (E.inRect(r, ax, az, 0.08) && E.inRect(r, bx, bz, 0.08)) return true;
    const d = Math.hypot(bx - ax, bz - az), steps = Math.ceil(d / 0.12);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!E.walkable(lay, ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  }
  E.lightVisible = visible;

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  function wallDistance(lay, x, z, max) {
    for (let d = 0.05; d <= max; d += 0.1) {
      if (!E.walkable(lay, x + d, z) || !E.walkable(lay, x - d, z) || !E.walkable(lay, x, z + d) || !E.walkable(lay, x, z - d)) return d;
    }
    return max;
  }

  function bake(b, lights, lay) {
    const N = b.count, lit = new Float32Array(N * 3), dyn = new Float32Array(N * 3);
    const AMB = 0.045;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const px = b.p[i3], py = b.p[i3 + 1], pz = b.p[i3 + 2];
      const nx = b.n[i3], ny = b.n[i3 + 1], nz = b.n[i3 + 2];
      const ox = px + nx * 0.04, oz = pz + nz * 0.04;
      let sr = AMB, sg = AMB, sb = AMB, dr = 0, dg = 0, db = 0;
      for (const L of lights) {
        const dx0 = L.x - px, dz0 = L.z - pz;
        if (dx0 > LIGHT_RANGE || dx0 < -LIGHT_RANGE || dz0 > LIGHT_RANGE || dz0 < -LIGHT_RANGE) continue;
        if (dx0 * dx0 + dz0 * dz0 > LIGHT_RANGE * LIGHT_RANGE) continue;
        if (!visible(lay, ox, oz, L.x, L.z)) continue;
        let acc = 0;
        for (let k = -1; k <= 1; k++) {
          const sx = L.x + (L.axis === 'x' ? k * 0.5 : 0), sz = L.z + (L.axis === 'z' ? k * 0.5 : 0);
          const vx = sx - px, vy = L.y - py, vz = sz - pz;
          const d = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1e-3;
          const ndl = Math.max(0, (nx * vx + ny * vy + nz * vz) / d);
          const em = 0.3 + 0.7 * Math.max(0, vy / d);
          const q = d / (L.range || LIGHT_RANGE);
          const win = q >= 1 ? 0 : (1 - q * q) * (1 - q * q);
          const att = win / (1 + (d / 2.3) * (d / 2.3));
          const bounce = ny < -0.5 ? 0.42 : 0.16;
          acc += (ndl * em + bounce * (0.4 + 0.6 * em)) * att / 3;
        }
        const c = L.col, I = L.I * acc;
        if (L.group) { dr += c[0] * I; dg += c[1] * I; db += c[2] * I; } else { sr += c[0] * I; sg += c[1] * I; sb += c[2] * I; }
      }
      let ao = 1;
      const mode = b.ao[i];
      if (mode === 'floor') ao = 0.6 + 0.4 * smooth(wallDistance(lay, px, pz, 0.7) / 0.7);
      else if (mode === 'ceil') ao = 0.68 + 0.32 * smooth(wallDistance(lay, px, pz, 0.6) / 0.6);
      else if (mode === 'wall') ao = (0.62 + 0.38 * smooth(py / 0.55)) * (0.74 + 0.26 * smooth((E.CEIL - py) / 0.45));
      const tr = b.tint[i3] * ao, tg = b.tint[i3 + 1] * ao, tb = b.tint[i3 + 2] * ao;
      lit[i3] = sr * tr; lit[i3 + 1] = sg * tg; lit[i3 + 2] = sb * tb;
      dyn[i3] = dr * tr; dyn[i3 + 1] = dg * tg; dyn[i3 + 2] = db * tb;
    }
    return { lit, dyn };
  }

  /** Light arriving at a point, for moving objects. dynScale is the current flicker level. */
  E.sampleLight = function (world, x, y, z, dynScale) {
    let r = 0.05, g = 0.05, bl = 0.05, dx = 0, dy = 0, dz = 0;
    for (const L of world.lights) {
      const vx = L.x - x, vy = L.y - y, vz = L.z - z;
      const d = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (d > LIGHT_RANGE) continue;
      if (!visible(world.lay, x, z, L.x, L.z)) continue;
      const q = d / LIGHT_RANGE, win = (1 - q * q) * (1 - q * q);
      const a = L.I * win / (1 + (d / 2.3) * (d / 2.3)) * (L.group ? dynScale : 1) * 1.35;
      r += L.col[0] * a; g += L.col[1] * a; bl += L.col[2] * a;
      dx += vx / d * a; dy += vy / d * a; dz += vz / d * a;
    }
    const len = Math.hypot(dx, dy, dz) || 1;
    return { col: [r, g, bl], dir: [dx / len, dy / len, dz / len] };
  };

  // ------------------------------------------------------------------ walls from the walkable union
  function buildWalls(b, lay, mat, baseMat) {
    const C = 0.5;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const r of lay.rects) { minX = Math.min(minX, r.x0); maxX = Math.max(maxX, r.x1); minZ = Math.min(minZ, r.z0); maxZ = Math.max(maxZ, r.z1); }
    minX -= 1; minZ -= 1; maxX += 1; maxZ += 1;
    const nx = Math.round((maxX - minX) / C), nz = Math.round((maxZ - minZ) / C);
    const grid = new Uint8Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = minX + (i + 0.5) * C, z = minZ + (j + 0.5) * C;
      let v = 0;
      for (const r of lay.rects) if (E.inRect(r, x, z)) { v = r.stairs ? 2 : 1; break; }
      grid[i + j * nx] = v;
    }
    const A = (i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? 0 : grid[i + j * nx];
    const H = E.CEIL;
    const emit = (x0, z0, x1, z1, n) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const along = x1 !== x0 ? 'x' : 'z';
      const u0 = along === 'x' ? x0 : z0, u1 = along === 'x' ? x1 : z1;
      b.quad([x0, H, z0], [x1 - x0, 0, z1 - z0], [0, -H, 0], n, [u0, 0], [u1 - u0, 0], [0, H], mat, Math.max(1, Math.ceil(len / 0.5)), 6);
      const o = 0.012;
      b.quad([x0 + n[0] * o, 0.12, z0 + n[2] * o], [x1 - x0, 0, z1 - z0], [0, -0.12, 0], n, [0, 0], [1, 0], [0, 1], baseMat, Math.max(1, Math.ceil(len / 1)), 1);
      b.quad([x0 + n[0] * o, 0.12, z0 + n[2] * o], [x1 - x0, 0, z1 - z0], [-n[0] * o, 0, -n[2] * o], [0, 1, 0], [0, 0], [1, 0], [0, 1], baseMat, 1, 1);
    };
    // Walls along X (between rows j-1 and j).
    for (let j = 0; j <= nz; j++) {
      const z = minZ + j * C;
      for (const dir of [1, -1]) {
        let start = -1;
        for (let i = 0; i <= nx; i++) {
          const a = A(i, j - 1), c = A(i, j);
          const isWall = i < nx && (dir === 1 ? (a === 1 && c === 0) : (a === 0 && c === 1));
          if (isWall && start < 0) start = i;
          if (!isWall && start >= 0) {
            emit(minX + start * C, z, minX + i * C, z, [0, 0, dir === 1 ? -1 : 1]);
            start = -1;
          }
        }
      }
    }
    // Walls along Z (between columns i-1 and i).
    for (let i = 0; i <= nx; i++) {
      const x = minX + i * C;
      for (const dir of [1, -1]) {
        let start = -1;
        for (let j = 0; j <= nz; j++) {
          const a = A(i - 1, j), c = A(i, j);
          const isWall = j < nz && (dir === 1 ? (a === 1 && c === 0) : (a === 0 && c === 1));
          if (isWall && start < 0) start = j;
          if (!isWall && start >= 0) {
            emit(x, minZ + start * C, x, minZ + j * C, [dir === 1 ? -1 : 1, 0, 0]);
            start = -1;
          }
        }
      }
    }
  }

  // ------------------------------------------------------------------ the world
  /**
   * spec: { anomaly, exit, seed }
   * returns { lay, packed, lights, decor, anomaly, exit }
   */
  E.buildWorld = function (spec) {
    const anomaly = spec.anomaly || null;
    const exit = !!spec.exit;
    const hl = anomaly === 'corridor_long' ? E.HALL_LONG : E.HALL;
    const lay = E.layout({ hl, exit });
    const rnd = E.mulberry32((spec.seed || 1) >>> 0);
    const T = E.TEX;
    const b = new Builder();
    const lights = [];
    const decor = { hl, eyes: [], clock: null, doors: [], men: {}, shadow: null };

    const mat = (layer, tint, extra) => Object.assign({ layer, tint: tint || [1, 1, 1] }, extra || {});
    const MAT = {
      floor: mat(T.floor, null, { spec: 0.5, ao: 'floor' }),
      ceil: mat(T.ceiling, null, { ao: 'ceil' }),
      wall: mat(T.wall, null, { spec: 0.32, ao: 'wall' }),
      base: mat(T.white, [0.2, 0.21, 0.22], { spec: 0.2 }),
      metal: mat(T.white, [0.74, 0.76, 0.77], { spec: 0.4 }),
      housing: mat(T.white, [0.86, 0.87, 0.86]),
      dark: mat(T.white, [0.012, 0.012, 0.014]),
      black: mat(T.white, [0.03, 0.03, 0.03]),
      frame: mat(T.white, [0.55, 0.57, 0.6], { spec: 0.3 }),
      red: mat(T.white, [0.62, 0.08, 0.07], { spec: 0.3 }),
      yellow: mat(T.white, [0.93, 0.74, 0.04]),
    };

    // Floors and ceilings.
    const ceilLow = anomaly === 'ceiling_low';
    for (const r of lay.rects) {
      if (r.stairs) continue;
      const w = r.x1 - r.x0, d = r.z1 - r.z0;
      b.quad([r.x0, 0, r.z0], [w, 0, 0], [0, 0, d], [0, 1, 0], [r.x0, r.z0], [w, 0], [0, d], MAT.floor, Math.ceil(w / 0.5), Math.ceil(d / 0.5));
      const ceil = (z0, z1, y) => b.quad([r.x0, y, z0], [w, 0, 0], [0, 0, z1 - z0], [0, -1, 0], [r.x0, z0], [w, 0], [0, z1 - z0], MAT.ceil, Math.ceil(w / 0.5), Math.ceil((z1 - z0) / 0.5));
      if (ceilLow && r.id === 'H') {
        ceil(r.z0, 23, E.CEIL); ceil(23, 35, 2.25); ceil(35, r.z1, E.CEIL);
        b.quad([r.x0, E.CEIL, 23], [w, 0, 0], [0, 2.25 - E.CEIL, 0], [0, 0, -1], [0, 0], [w, 0], [0, 0.75], MAT.wall, 6, 2);
        b.quad([r.x0, E.CEIL, 35], [w, 0, 0], [0, 2.25 - E.CEIL, 0], [0, 0, 1], [0, 0], [w, 0], [0, 0.75], MAT.wall, 6, 2);
      } else ceil(r.z0, r.z1, E.CEIL);
    }
    buildWalls(b, lay, MAT.wall, MAT.base);

    // ---------------------------------------------------------------- lamps
    function lamp(x, z, axis, o) {
      const opt = o || {};
      const y = opt.y || 2.94;
      const col = opt.col || LAMP;
      lights.push({ x, y: y - 0.06, z, axis, col, I: opt.I || 1, group: opt.group || 0 });
      const along = axis === 'z';
      b.box(x, y + 0.02, z, along ? 0.24 : 1.32, 0.06, along ? 1.32 : 0.24, MAT.housing);
      b.box(x, y - 0.03, z, along ? 0.09 : 1.22, 0.045, along ? 1.22 : 0.09,
        mat(T.white, col, { emis: [col[0] * 2.4, col[1] * 2.4, col[2] * 2.4], dynEmis: !!opt.group }));
    }
    lamp(-18, -28, 'z');
    lamp(-15, -27.5, 'x'); lamp(-12, -27.5, 'x');
    for (let z = -27; z <= 1; z += 4) lamp(-9, z, 'z');
    lamp(-6, 1.5, 'x'); lamp(-3, 1.5, 'x');
    for (const z of [2, 6, 10, 14]) lamp(0, z, 'z');
    lamp(3, 14.5, 'x'); lamp(6, 14.5, 'x');
    const hallLamps = [];
    for (let z = 15; z <= hl + 11; z += 4) hallLamps.push(z);
    const midLamps = hallLamps.slice(1, -1);
    const pickLamp = () => midLamps[1 + Math.floor(rnd() * (midLamps.length - 2))];
    const redLamp = anomaly === 'light_red' ? pickLamp() : null;
    const flickLamp = anomaly === 'light_flicker' ? pickLamp() : null;
    for (const z of hallLamps) {
      const mid = z !== hallLamps[0] && z !== hallLamps[hallLamps.length - 1];
      const o = {};
      if (anomaly === 'lights_off' && mid) o.group = 1;
      if (z === flickLamp) o.group = 1;
      if (z === redLamp) { o.col = RED; o.I = 1.15; }
      if (ceilLow && z > 23 && z < 35) o.y = 2.19;
      lamp(9, z, 'z', o);
    }
    if (!exit) {
      lamp(12, hl + 11.5, 'x'); lamp(15, hl + 11.5, 'x');
      for (const z of [2, 6, 10, 14]) lamp(18, hl + 10 + z, 'z');
    }

    // ---------------------------------------------------------------- tactile paving
    function tactilePath(pts, gaps) {
      const L = mat(T.tactileLine, null, { spec: 0.25 }), Dm = mat(T.tactileDot, null, { spec: 0.25 });
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / len, dz = (bz - az) / len;
        const s0 = i === 0 ? 0 : 0.3, s1 = len - (i === pts.length - 2 ? 0 : 0.3);
        const segs = [[s0, s1]];
        for (const g of (gaps || [])) if (g.seg === i) { segs.length = 0; segs.push([s0, g.from], [g.to, s1]); }
        for (const [a, c] of segs) {
          if (c - a < 0.05) continue;
          const cx = ax + dx * (a + c) / 2, cz = az + dz * (a + c) / 2, l = c - a;
          const rx = dz, rz = -dx;
          const org = [cx - rx * 0.15 + dx * l / 2, 0.005, cz - rz * 0.15 + dz * l / 2];
          b.quad(org, [rx * 0.3, 0, rz * 0.3], [-dx * l, 0, -dz * l], [0, 1, 0], [0, 0], [1, 0], [0, l / 0.3], L, 1, Math.max(1, Math.ceil(l / 1.5)));
        }
        if (i > 0) b.quad([ax - 0.3, 0.005, az - 0.3], [0.6, 0, 0], [0, 0, 0.6], [0, 1, 0], [0, 0], [2, 0], [0, 2], Dm);
      }
      for (const g of (gaps || [])) if (g.dots) for (const [x, z] of g.dots) b.quad([x - 0.3, 0.005, z - 0.3], [0.6, 0, 0], [0, 0, 0.6], [0, 1, 0], [0, 0], [2, 0], [0, 2], Dm);
    }
    const path = [[-18, -32], [-18, -27.5], [-9, -27.5], [-9, 1.5], [0, 1.5], [0, 14.5], [9, 14.5]];
    if (exit) path.push([9, hl + 13]); else path.push([9, hl + 11.5], [18, hl + 11.5], [18, hl + 26]);
    const gaps = [];
    if (anomaly === 'tactile_veer') {
      // Hallway segment index 6 runs from (9,14.5): gap between 24.8 and 31, a branch into the left wall.
      gaps.push({ seg: 6, from: 24.8 - 14.5 - 0.3, to: 31 - 14.5 + 0.3, dots: [[9, 24.8], [9, 31]] });
      const l = 9 - 0.3 - 7.5;
      b.quad([7.5, 0.005, 24.8 - 0.15], [l, 0, 0], [0, 0, 0.3], [0, 1, 0], [0, 0], [0, l / 0.3], [1, 0], mat(T.tactileLine, null, { spec: 0.25 }));
    }
    tactilePath(path, gaps);

    // ---------------------------------------------------------------- lobby decor
    function lobbyDecor(ox, oz) {
      const signMat = mat(T.sign, null, { emis: [0.42, 0.42, 0.42] });
      b.box(ox, 2.47, oz + 8, 2.2, 0.45, 0.07, mat(T.white, [0.35, 0.35, 0.36]), { nz: signMat });
      b.box(ox - 0.8, 2.85, oz + 8, 0.03, 0.31, 0.03, MAT.metal);
      b.box(ox + 0.8, 2.85, oz + 8, 0.03, 0.31, 0.03, MAT.metal);
      // Rules poster on the right wall, station map on the left wall.
      const rx = ox + 1.5;
      b.box(rx - 0.02, 1.55, oz + 9.5, 0.03, 1.05, 1.4, MAT.frame);
      b.panel([rx - 0.037, 1.55, oz + 9.5], [-1, 0, 0], 1.3, 0.95, mat(T.rules, null, { spec: 0.35 }));
      const lx = ox - 1.5;
      b.box(lx + 0.02, 1.6, oz + 6.5, 0.03, 0.9, 1.3, MAT.frame);
      b.panel([lx + 0.037, 1.6, oz + 6.5], [1, 0, 0], 1.2, 0.8, mat(T.map, null, { spec: 0.35 }));
    }
    lobbyDecor(0, 0);
    if (!exit) lobbyDecor(18, hl + 10);

    // ---------------------------------------------------------------- hallway decor
    const POSTER_Z = [20, 23.2, 26.4, 29.6, 32.8, 36];
    const others = [0, 1, 3, 4, 5];
    const special = others[Math.floor(rnd() * others.length)];
    const doorPick = Math.floor(rnd() * 3);

    function door(x, z, n, o) {
      const opt = o || {};
      const doorMat = mat(T.door, null, { spec: 0.18 });
      const r = [-n[2], 0, n[0]];
      // Frame
      b.box(x + n[0] * 0.03 + r[0] * 0.56, 1.1, z + n[2] * 0.03 + r[2] * 0.56, n[0] ? 0.06 : 0.08, 2.2, n[0] ? 0.08 : 0.06, MAT.frame);
      b.box(x + n[0] * 0.03 - r[0] * 0.56, 1.1, z + n[2] * 0.03 - r[2] * 0.56, n[0] ? 0.06 : 0.08, 2.2, n[0] ? 0.08 : 0.06, MAT.frame);
      b.box(x + n[0] * 0.03, 2.16, z + n[2] * 0.03, n[0] ? 0.06 : 1.2, 0.08, n[0] ? 1.2 : 0.06, MAT.frame);
      if (opt.ajar) {
        b.panel([x + n[0] * 0.012, 1.06, z + n[2] * 0.012], n, 1.04, 2.12, MAT.dark);
        // Hinged on the far side and swung past 90°, so the dark doorway faces the approaching player.
        const a = 1.75;
        const hx = x + n[0] * 0.02 - r[0] * 0.5, hz = z + n[2] * 0.02 - r[2] * 0.5;
        const fx = r[0] * Math.cos(a) + n[0] * Math.sin(a), fz = r[2] * Math.cos(a) + n[2] * Math.sin(a);
        const cx = hx + fx * 0.5, cz = hz + fz * 0.5;
        const nn = [fz, 0, -fx]; // panel normal (90° from its width)
        const face = nn[0] * n[0] + nn[2] * n[2] > 0 ? nn : [-nn[0], 0, -nn[2]];
        b.panel([cx + face[0] * 0.021, 1.05, cz + face[2] * 0.021], face, 1.0, 2.1, doorMat);
        b.panel([cx - face[0] * 0.021, 1.05, cz - face[2] * 0.021], [-face[0], 0, -face[2]], 1.0, 2.1, MAT.metal);
        return;
      }
      b.panel([x + n[0] * 0.02, 1.05, z + n[2] * 0.02], n, 1.0, 2.1, doorMat);
      const hx = x + n[0] * 0.06 + r[0] * 0.36, hz = z + n[2] * 0.06 + r[2] * 0.36;
      b.box(x + n[0] * 0.03 + r[0] * 0.36, 1.0, z + n[2] * 0.03 + r[2] * 0.36, n[0] ? 0.02 : 0.06, 0.18, n[0] ? 0.06 : 0.02, MAT.metal);
      b.box(hx - r[0] * 0.06, 1.04, hz - r[2] * 0.06, n[0] ? 0.04 : 0.14, 0.035, n[0] ? 0.14 : 0.04, MAT.metal);
    }

    function poster(x, z, n, layer, o) {
      const opt = o || {};
      b.box(x + n[0] * 0.012, 1.6, z + n[2] * 0.012, n[0] ? 0.024 : 0.9, 1.2, n[0] ? 0.9 : 0.024, MAT.frame);
      if (layer == null) return;
      b.panel([x + n[0] * 0.026, 1.6, z + n[2] * 0.026], n, 0.8, 1.1, mat(layer, null, { spec: 0.45 }), opt);
    }

    function hallDecor(ox, oz, an, main) {
      const LX = 7.5 + ox, RX = 10.5 + ox, Z = z => oz + z;
      // Left wall: six posters.
      POSTER_Z.forEach((pz, i) => {
        let layer = T['poster' + i], opt = {};
        if (an === 'poster_face' && i === special) layer = T.posterFace;
        if (an === 'poster_blank' && i === special) layer = T.posterBlank;
        if (an === 'poster_upside' && i === special) opt = { flipU: true, flipV: true };
        poster(LX, Z(pz), [1, 0, 0], layer, opt);
        if (i === 2) {
          const P = E.POSTER_EYES;
          for (const u of P.u) {
            const eye = { x: LX + 0.028, y: 1.6 + 0.55 - P.v * 1.1, z: Z(pz) - 0.4 + u * 0.8 };
            if (main && an === 'poster_eyes') decor.eyes.push(eye);
            else b.disc([eye.x + 0.004, eye.y, eye.z], [1, 0, 0], 0.036, 0.006, 14, mat(T.white, [0.06, 0.05, 0.05], { spec: 0.6 }));
          }
        }
      });
      if (an === 'door_extra') door(LX, Z(34.4), [1, 0, 0]);
      // Right wall: doors, extinguisher, emergency sign, clock, vent.
      [21, 27, 34].forEach((dz, i) => {
        door(RX, Z(dz), [-1, 0, 0], { ajar: an === 'door_ajar' && i === doorPick });
        if (main) decor.doors.push({ x: RX, z: Z(dz) });
      });
      if (an !== 'extinguisher_missing') {
        b.box(RX - 0.07, 0.78, Z(24), 0.14, 0.66, 0.42, MAT.red, { nx: mat(T.extinguisher, null, { spec: 0.3 }) });
      }
      b.box(RX - 0.03, 2.43, Z(27), 0.06, 0.26, 0.6, mat(T.white, [0.9, 0.9, 0.9]),
        { nx: mat(T.exitGreen, null, { emis: [0.75, 0.75, 0.75] }) }, 0, { flipU: an === 'exit_sign_flip' });
      // Clock (hands are drawn as moving objects).
      const clock = { x: RX - 0.075, y: 2.2, z: Z(30.6) };
      b.disc([RX - 0.035, clock.y, clock.z], [-1, 0, 0], 0.25, 0.07, 24, mat(T.white, [0.08, 0.08, 0.08], { spec: 0.4 }));
      b.panel([RX - 0.072, clock.y, clock.z], [-1, 0, 0], 0.5, 0.5, mat(T.clock, null, { spec: 0.5 }));
      if (main) decor.clock = clock;
      // Vent
      const vz = Z(37.6);
      if (an === 'vent_eyes') b.panel([RX - 0.008, 2.5, vz], [-1, 0, 0], 0.56, 0.28, mat(T.ventEyes, null, { emis: [2.6, 2.6, 2.6] }));
      else b.panel([RX - 0.008, 2.5, vz], [-1, 0, 0], 0.56, 0.28, MAT.dark);
      b.panel([RX - 0.03, 2.5, vz], [-1, 0, 0], 0.62, 0.31, mat(T.vent, null, { spec: 0.2 }));
      if (!main) return;
      // Static anomalies on surfaces.
      if (an === 'handprints') {
        const hm = mat(T.handprint, null, { spec: 0.6 });
        [[29.0, 1.2, 0.2], [29.5, 1.65, -0.3], [30.0, 0.95, 0.1], [31.7, 1.45, 0.35], [32.2, 1.0, -0.15], [32.7, 1.7, 0.25]]
          .forEach(([z, y, rot]) => b.panel([RX - 0.006, y, Z(z)], [-1, 0, 0], 0.32, 0.32, hm, { rot }));
      }
      if (an === 'wall_stain') b.panel([LX + 0.006, 1.45, Z(28)], [1, 0, 0], 1.5, 1.5, mat(T.stain, null, { spec: 0.5 }));
      if (an === 'wall_face') b.panel([LX + 0.012, 1.55, Z(28)], [1, 0, 0], 1.3, 1.62, mat(T.wallFace, null, { spec: 0.2 }));
      if (an === 'wall_eyes') b.panel([RX - 0.006, 1.3, Z(32.2)], [-1, 0, 0], 2.8, 2.3, mat(T.wallEyes, null, { spec: 0.55 }));
      if (an === 'scrawl') b.panel([RX - 0.006, 1.55, Z(32.2)], [-1, 0, 0], 2.4, 1.2, mat(T.scrawl, null, { spec: 0.6 }));
      if (an === 'blood_pool') b.floorDecal(10.1, Z(27), 2.2, 2.8, 0, 1, mat(T.bloodPool, null, { spec: 1.1 }), 0.008);
      if (an === 'footprints') {
        const fm = mat(T.footprint, null, { spec: 0.7 });
        const ax = 9.7 + ox, az = Z(19.5), bx = LX + 0.25, bz = Z(24.8);
        const len = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / len, dz = (bz - az) / len;
        for (let s = 0, k = 0; s < len; s += 0.55, k++) {
          const side = k % 2 ? 0.1 : -0.1;
          b.floorDecal(ax + dx * s + dz * side, az + dz * s - dx * side, 0.13, 0.27, dx, dz, fm, 0.007 + k * 0.0001);
        }
      }
    }
    hallDecor(0, 0, anomaly, true);
    hallDecor(-18, -42, null, false);

    // ---------------------------------------------------------------- dynamic anomaly anchors
    if (anomaly === 'shadow_figure') decor.shadow = { x: 8.3, z: hl + 9 };

    // ---------------------------------------------------------------- exit staircase
    if (exit) {
      const s = E.rectById(lay, 'S');
      const z0 = s.z0, run = (E.STAIRS - 3) / 30, rise = E.STAIR_RISE / 30;
      b.quad([7.5, 0, z0], [3, 0, 0], [0, 0, 1], [0, 1, 0], [7.5, z0], [3, 0], [0, 1], MAT.floor, 6, 2);
      const stepMat = mat(T.floor, [0.95, 0.95, 0.93], { spec: 0.3 });
      for (let k = 0; k < 30; k++) {
        const za = z0 + 1 + k * run, y = (k + 1) * rise;
        b.quad([7.5, y, za], [3, 0, 0], [0, 0, run], [0, 1, 0], [7.5, za], [3, 0], [0, run], stepMat, 3, 1);
        b.quad([7.5, y, za], [3, 0, 0], [0, -rise, 0], [0, 0, -1], [0, 0], [3, 0], [0, rise], stepMat, 3, 1);
        b.quad([7.5, y + 0.002, za], [3, 0, 0], [0, 0, 0.05], [0, 1, 0], [0, 0], [1, 0], [0, 1], MAT.yellow, 3, 1);
      }
      const top = z0 + E.STAIRS - 2;
      b.quad([7.5, E.STAIR_RISE, top], [3, 0, 0], [0, 0, 2], [0, 1, 0], [7.5, top], [3, 0], [0, 2], MAT.floor, 6, 4);
      const wallH = E.STAIR_RISE + E.CEIL + 0.6;
      const sideWall = (x, n) => b.quad([x, wallH, z0], [0, 0, E.STAIRS], [0, -wallH, 0], n, [z0, 0], [E.STAIRS, 0], [0, wallH], mat(T.wall, null, { spec: 0.3 }), 26, 15);
      sideWall(7.5, [1, 0, 0]); sideWall(10.5, [-1, 0, 0]);
      const cz = z0 + E.STAIRS - 2, nl = Math.hypot(E.STAIR_RISE, cz - z0);
      b.quad([7.5, E.CEIL, z0], [3, 0, 0], [0, E.STAIR_RISE, cz - z0], [0, -(cz - z0) / nl, E.STAIR_RISE / nl], [7.5, z0], [3, 0], [0, nl], MAT.ceil, 6, 22);
      b.quad([7.5, E.CEIL + E.STAIR_RISE, cz], [3, 0, 0], [0, 0, 2], [0, -1, 0], [7.5, cz], [3, 0], [0, 2], MAT.ceil, 6, 4);
      b.quad([7.5, wallH, s.z1], [3, 0, 0], [0, -(wallH - E.STAIR_RISE), 0], [0, 0, -1], [0, 0], [1, 0], [0, 1], mat(T.daylight, [1, 1, 1], { emis: [3, 3, 3] }));
      for (const k of [3, 11, 19, 27]) {
        const z = z0 + 1 + k * run;
        lamp(9, z, 'z', { y: E.CEIL + (z - z0) / (cz - z0) * E.STAIR_RISE - 0.04 });
      }
      lights.push({ x: 9, y: E.STAIR_RISE + 2.4, z: s.z1 - 0.8, axis: 'x', col: [1, 0.95, 0.85], I: 3.2, group: 0 });
    }

    const baked = bake(b, lights, lay);
    return { lay, packed: b.pack(baked.lit, baked.dyn), lights, decor, anomaly, exit, hl };
  };
})(typeof window !== 'undefined' ? window : globalThis);
