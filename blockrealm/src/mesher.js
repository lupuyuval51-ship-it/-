'use strict';
/* BlockRealm — chunk mesher. Vertex = 16 bytes:
   int16 x,y,z (1/16 block) | u8 normal, layer | u8 u,v (1/16), sky, ao | u8 r,g,b tint, flags */

const PX = CS + 2, PZ = CS + 2, PY = CH + 2, PXZ = PX * PZ;
const pidx = (x, y, z) => ((y + 1) * PZ + (z + 1)) * PX + (x + 1);
const FLAG = { LEAF: 1, PLANT: 2, EMIT: 4, WAVE: 8, LAVA: 16 };

const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], uv: [[1, 1], [1, 0], [0, 0], [0, 1]] },
  { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], uv: [[1, 1], [1, 0], [0, 0], [0, 1]] },
  { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], uv: [[0, 0], [0, 1], [1, 1], [1, 0]] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] },
  { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], uv: [[1, 1], [1, 0], [0, 0], [0, 1]] },
  { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], uv: [[1, 1], [1, 0], [0, 0], [0, 1]] },
];
const AXIS_DELTA = [1, PXZ, PX];
const DF = FACES.map((f) => f.n[0] * 1 + f.n[1] * PXZ + f.n[2] * PX);
const AOT = FACES.map((f, fi) => {
  const a = f.n[0] ? 0 : f.n[1] ? 1 : 2, t = [0, 1, 2].filter((k) => k !== a);
  return f.c.map((cp) => {
    const d1 = (cp[t[0]] ? 1 : -1) * AXIS_DELTA[t[0]], d2 = (cp[t[1]] ? 1 : -1) * AXIS_DELTA[t[1]];
    return [DF[fi] + d1, DF[fi] + d2, DF[fi] + d1 + d2];
  });
});

class QuadBuf {
  constructor(bytes) { this.alloc(bytes); this.n = 0; }
  alloc(bytes) {
    const old = this.u8;
    this.ab = new ArrayBuffer(bytes);
    this.u8 = new Uint8Array(this.ab);
    this.i16 = new Int16Array(this.ab);
    if (old) this.u8.set(old.subarray(0, this.n * 16));
  }
  reserve(verts) { if ((this.n + verts) * 16 > this.ab.byteLength) this.alloc(Math.max(this.ab.byteLength * 2, (this.n + verts) * 16)); }
  v(x, y, z, n, layer, u, v, sky, ao, r, g, b, flags) {
    const o = this.n * 16, h = o >> 1, u8 = this.u8, i16 = this.i16;
    i16[h] = x; i16[h + 1] = y; i16[h + 2] = z;
    u8[o + 6] = n; u8[o + 7] = layer; u8[o + 8] = u; u8[o + 9] = v;
    u8[o + 10] = sky; u8[o + 11] = ao; u8[o + 12] = r; u8[o + 13] = g; u8[o + 14] = b; u8[o + 15] = flags;
    this.n++;
  }
  view() { return this.u8.subarray(0, this.n * 16); }
}

class Mesher {
  constructor() {
    this.pb = new Uint8Array(PXZ * PY);
    this.pl = new Uint8Array(PXZ * PY);
    this.main = new QuadBuf(1 << 21);
    this.water = new QuadBuf(1 << 18);
    this.onMesh = null;
    this.sky = new Float32Array(4);
    this.ao = new Uint8Array(4);
  }

  fill(world, c) {
    const PB = this.pb, PL = this.pl, ymax = Math.min(CH - 1, c.maxY + 1);
    for (let z = 0; z < PZ; z++) for (let x = 0; x < PX; x++) {
      const lo = z * PX + x, hi = (CH + 1) * PXZ + z * PX + x;
      PB[lo] = B.bedrock; PL[lo] = 0; PB[hi] = 0; PL[hi] = 15;
      if (ymax < CH - 1) { const a = (ymax + 2) * PXZ + z * PX + x; PB[a] = 0; PL[a] = 15; }
    }
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = world.getChunk(c.cx + dx, c.cz + dz);
      const x0 = dx < 0 ? 15 : 0, x1 = dx > 0 ? 0 : 15, z0 = dz < 0 ? 15 : 0, z1 = dz > 0 ? 0 : 15;
      for (let sz = z0; sz <= z1; sz++) for (let sx = x0; sx <= x1; sx++) {
        let d = (PZ + sz + 1 + dz * CS) * PX + sx + 1 + dx * CS, s = sz * CS + sx;
        if (!n) { for (let y = 0; y <= ymax; y++, d += PXZ) { PB[d] = 0; PL[d] = 15; } continue; }
        const nb = n.blocks, nl = n.light;
        for (let y = 0; y <= ymax; y++, d += PXZ, s += CS2) { PB[d] = nb[s]; PL[d] = nl[s]; }
      }
    }
  }

  build(world, c) {
    this.fill(world, c);
    const PB = this.pb, PL = this.pl, M = this.main, W = this.water, blocks = c.blocks;
    M.n = 0; W.n = 0;
    const sky = this.sky, ao = this.ao;
    let minY = CH, maxY = 0;
    for (let y = 0; y <= c.maxY && y < CH; y++) for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      const id = blocks[bidx(x, y, z)];
      if (!id) continue;
      const d = BLOCKS[id], rt = d.render;
      const pi = pidx(x, y, z), col = z * CS + x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const tr = c.tint[col * 3], tg = c.tint[col * 3 + 1], tb = c.tint[col * 3 + 2];
      if (rt === RENDER.CROSS) { this.cross(M, x, y, z, d, PL[pi], d.tintAll ? [tr, tg, tb] : null); continue; }
      if (rt === RENDER.TORCH) { this.torch(M, x, y, z, d, PL[pi]); continue; }
      const liquid = rt === RENDER.LIQUID;
      const buf = d.pass === 1 ? W : M;
      const top = liquid && PB[pi + PXZ] !== id ? 14 : 16;
      let depth = 0;
      if (liquid) { depth = 1; while (depth < 15 && PB[pi - depth * PXZ] === id) depth++; }
      for (let f = 0; f < 6; f++) {
        const fi = pi + DF[f], nid = PB[fi];
        if (OPAQUE[nid]) continue;
        if (nid === id && (liquid || d.cullSelf)) continue;
        if (liquid && LIQUID[nid]) continue;
        const layer = d.tex[f === 2 ? 0 : f === 3 ? 1 : 2];
        let r = 128, g = 128, b = 128;
        if (d.tintAll || (d.tintTop && f === 2)) { r = tr; g = tg; b = tb; }
        let flags = d.sway ? FLAG.LEAF : 0;
        if (d.emissive) flags |= FLAG.EMIT;
        if (id === B.lava) flags |= FLAG.LAVA;
        if (liquid && f === 2 && id === B.water) flags |= FLAG.WAVE;
        const lF = PL[fi], T = AOT[f];
        for (let k = 0; k < 4; k++) {
          const t = T[k], a0 = PB[pi + t[0]], a1 = PB[pi + t[1]], a2 = PB[pi + t[2]];
          const o0 = OPAQUE[a0], o1 = OPAQUE[a1], o2 = OPAQUE[a2];
          ao[k] = liquid || d.emissive ? 3 : (o0 && o1) ? 0 : 3 - (o0 + o1 + o2);
          let s = lF, n = 1;
          if (!o0) { s += PL[pi + t[0]]; n++; }
          if (!o1) { s += PL[pi + t[1]]; n++; }
          if (!o2 && !(o0 && o1)) { s += PL[pi + t[2]]; n++; }
          sky[k] = s / n;
        }
        const face = FACES[f], start = ao[0] + ao[2] < ao[1] + ao[3] ? 1 : 0;
        buf.reserve(4);
        for (let kk = 0; kk < 4; kk++) {
          const k = (kk + start) & 3, cp = face.c[k];
          const vy = cp[1] ? (liquid ? top : 16) : 0;
          buf.v(x * 16 + cp[0] * 16, y * 16 + vy, z * 16 + cp[2] * 16, f, layer, face.uv[k][0] * 16, face.uv[k][1] * 16,
            Math.round(sky[k] * 17), liquid ? depth * 17 : ao[k] * 85, r, g, b, flags);
        }
      }
    }
    c.meshed = true;
    c.meshMinY = minY; c.meshMaxY = maxY + 1;
    if (this.onMesh) this.onMesh(c, M.view(), M.n >> 2, W.view(), W.n >> 2);
  }

  cross(buf, x, y, z, d, light, tint) {
    const s = Math.round(light * 17), layer = d.tex[2], fl = d.sway ? FLAG.PLANT : 0;
    const r = tint ? tint[0] : 128, g = tint ? tint[1] : 128, b = tint ? tint[2] : 128;
    const X = x * 16, Y = y * 16, Z = z * 16;
    buf.reserve(16);
    const planes = [[2, 2, 14, 14], [2, 14, 14, 2]];
    for (const [ax, az, bx, bz] of planes) {
      buf.v(X + ax, Y, Z + az, 6, layer, 0, 16, s, 255, r, g, b, 0);
      buf.v(X + ax, Y + 16, Z + az, 6, layer, 0, 0, s, 255, r, g, b, fl);
      buf.v(X + bx, Y + 16, Z + bz, 6, layer, 16, 0, s, 255, r, g, b, fl);
      buf.v(X + bx, Y, Z + bz, 6, layer, 16, 16, s, 255, r, g, b, 0);
      buf.v(X + bx, Y, Z + bz, 6, layer, 16, 16, s, 255, r, g, b, 0);
      buf.v(X + bx, Y + 16, Z + bz, 6, layer, 16, 0, s, 255, r, g, b, fl);
      buf.v(X + ax, Y + 16, Z + az, 6, layer, 0, 0, s, 255, r, g, b, fl);
      buf.v(X + ax, Y, Z + az, 6, layer, 0, 16, s, 255, r, g, b, 0);
    }
  }

  torch(buf, x, y, z, d, light) {
    const s = Math.round(light * 17), layer = d.tex[2];
    const lo = [7, 0, 7], hi = [9, 11, 9];
    buf.reserve(20);
    for (let f = 0; f < 6; f++) {
      if (f === 3) continue;
      const face = FACES[f];
      for (let k = 0; k < 4; k++) {
        const cp = face.c[k], uv = face.uv[k];
        const vx = lo[0] + cp[0] * (hi[0] - lo[0]), vy = lo[1] + cp[1] * (hi[1] - lo[1]), vz = lo[2] + cp[2] * (hi[2] - lo[2]);
        const u = 7 + uv[0] * 2, v = f === 2 ? 5 + uv[1] * 2 : 5 + uv[1] * 11;
        buf.v(x * 16 + vx, y * 16 + vy, z * 16 + vz, f, layer, u, v, s, 255, 128, 128, 128, FLAG.EMIT);
      }
    }
  }

  /* Stand-alone mesh for the item held in first person (unit cube 0..16, full light). */
  buildItem(id) {
    const buf = new QuadBuf(4096);
    const d = isBlock(id) ? BLOCKS[id] : null;
    const tint = [122, 140, 104];
    if (d && (d.render === RENDER.CUBE || d.render === RENDER.LIQUID)) {
      for (let f = 0; f < 6; f++) {
        const face = FACES[f], layer = d.tex[f === 2 ? 0 : f === 3 ? 1 : 2];
        const tinted = d.tintAll || (d.tintTop && f === 2);
        for (let k = 0; k < 4; k++) {
          const cp = face.c[k];
          buf.v(cp[0] * 16, cp[1] * 16, cp[2] * 16, f, layer, face.uv[k][0] * 16, face.uv[k][1] * 16, 255, 255,
            tinted ? tint[0] : 128, tinted ? tint[1] : 128, tinted ? tint[2] : 128, d.emissive ? FLAG.EMIT : 0);
        }
      }
    } else {
      const layer = d ? d.tex[2] : ITEMS[id] ? ITEMS[id].tile : 0;
      const tinted = d && d.tintAll, r = tinted ? tint[0] : 128, g = tinted ? tint[1] : 128, b = tinted ? tint[2] : 128;
      const fl = d && d.emissive ? FLAG.EMIT : 0;
      buf.v(0, 0, 8, 4, layer, 0, 16, 255, 255, r, g, b, fl);
      buf.v(16, 0, 8, 4, layer, 16, 16, 255, 255, r, g, b, fl);
      buf.v(16, 16, 8, 4, layer, 16, 0, 255, 255, r, g, b, fl);
      buf.v(0, 16, 8, 4, layer, 0, 0, 255, 255, r, g, b, fl);
      buf.v(0, 16, 8, 5, layer, 0, 0, 255, 255, r, g, b, fl);
      buf.v(16, 16, 8, 5, layer, 16, 0, 255, 255, r, g, b, fl);
      buf.v(16, 0, 8, 5, layer, 16, 16, 255, 255, r, g, b, fl);
      buf.v(0, 0, 8, 5, layer, 0, 16, 255, 255, r, g, b, fl);
    }
    return { data: buf.view().slice(), quads: buf.n >> 2 };
  }
}
