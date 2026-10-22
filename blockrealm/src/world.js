'use strict';
/* BlockRealm — chunked voxel world: terrain generation, skylight flood fill, edits, simple fluids/gravity. */

const CS = 16, CH = 128, SEA = 52, CS2 = CS * CS;
const bidx = (x, y, z) => (y * CS + z) * CS + x;
const ckey = (cx, cz) => cx + ',' + cz;

const BIOME = { OCEAN: 0, FROZEN_OCEAN: 1, BEACH: 2, PLAINS: 3, FOREST: 4, DESERT: 5, TAIGA: 6, SNOWY: 7, MOUNTAINS: 8 };
const BIOME_NAMES = {
  he: ['אוקיינוס', 'אוקיינוס קפוא', 'חוף', 'מישורים', 'יער', 'מדבר', 'טייגה', 'טונדרה מושלגת', 'הרים'],
  en: ['Ocean', 'Frozen Ocean', 'Beach', 'Plains', 'Forest', 'Desert', 'Taiga', 'Snowy Tundra', 'Mountains'],
};

class Chunk {
  constructor(cx, cz) {
    this.cx = cx; this.cz = cz; this.key = ckey(cx, cz);
    this.blocks = new Uint8Array(CS2 * CH);
    this.light = new Uint8Array(CS2 * CH);
    this.skyBottom = new Int16Array(CS2);
    this.tint = new Uint8Array(CS2 * 3);
    this.biome = new Uint8Array(CS2);
    this.maxY = 0;
    this.lit = false; this.meshed = false;
    this.needLight = false; this.needMesh = false;
    this.mesh = null;
    this.emitters = [];
  }
}

class TerrainGen {
  constructor(seed) {
    this.seed = seed | 0;
    const n = (k) => new Simplex((seed | 0) * 31 + k * 7919);
    this.nCont = n(1); this.nEro = n(2); this.nHill = n(3); this.nRidge = n(4);
    this.nTemp = n(5); this.nMoist = n(6); this.nCave1 = n(7); this.nCave2 = n(8); this.nCave3 = n(9); this.nDetail = n(10);
  }
  /* Smooth large-scale height; sampled on a coarse grid during generation and interpolated. */
  baseHeight(wx, wz) {
    const cont = fbm2(this.nCont, wx / 720, wz / 720, 5);
    const ero = fbm2(this.nEro, wx / 380, wz / 380, 3);
    const hills = fbm2(this.nHill, wx / 96, wz / 96, 4);
    const ridge = 1 - Math.abs(fbm2(this.nRidge, wx / 250, wz / 250, 4));
    let h = SEA + 6 + cont * 36;
    h += hills * (4 + 8 * smoothstep(-0.4, 0.6, ero));
    h += smoothstep(0.12, 0.5, cont + ero * 0.35) * ridge * ridge * 58;
    return h;
  }
  detail(wx, wz) { return this.nDetail.noise2(wx / 13, wz / 13) * 1.4; }
  height(wx, wz) { return clamp(this.baseHeight(wx, wz) + this.detail(wx, wz), 6, CH - 12); }
  climate(wx, wz) {
    return [fbm2(this.nTemp, wx / 900, wz / 900, 3) * 1.6, fbm2(this.nMoist, wx / 700, wz / 700, 3) * 1.6];
  }
  biomeOf(h, temp, moist, slope) {
    const t = temp - Math.max(0, h - 82) / 50;
    if (h < SEA) return t < -0.45 ? BIOME.FROZEN_OCEAN : BIOME.OCEAN;
    if (h <= SEA + 2 && t > -0.35 && slope < 3) return BIOME.BEACH;
    if (h > 90) return BIOME.MOUNTAINS;
    if (t > 0.32 && moist < 0.05) return BIOME.DESERT;
    if (t < -0.42) return BIOME.SNOWY;
    if (t < -0.16) return BIOME.TAIGA;
    if (moist > 0.1) return BIOME.FOREST;
    return BIOME.PLAINS;
  }
  /* Quick spawn search without generating chunks. */
  findSpawn() {
    for (let r = 0; r < 4000; r += 8) {
      for (let a = 0; a < 16; a++) {
        const x = Math.round(Math.cos(a / 16 * Math.PI * 2) * r), z = Math.round(Math.sin(a / 16 * Math.PI * 2) * r);
        const h = Math.floor(this.height(x, z));
        if (h > SEA + 2 && h < 86) return [x + 0.5, h + 1, z + 0.5];
        if (r === 0) break;
      }
    }
    return [0.5, CH - 20, 0.5];
  }
}

const TREE_CHANCE = [0, 0, 0, 0.0045, 0.05, 0.006, 0.03, 0.018, 0.01];
const BEDROCK_ID = B.bedrock, STONE_ID = B.stone, SANDSTONE_ID = B.sandstone, WATER_ID = B.water, ICE_ID = B.ice;

class World {
  constructor(seed, edits) {
    this.seed = seed | 0;
    this.gen = new TerrainGen(seed);
    this.chunks = new Map();
    this.edits = edits || new Map();
    this.renderDist = 6;
    this.scanList = [];
    this.lastCx = 1e9; this.lastCz = 1e9;
    this.flowQueue = [];
    this.flowTimer = 0;
    this.onUnload = null;
    this.q = new Int32Array(1 << 19);
  }

  getChunk(cx, cz) { return this.chunks.get(ckey(cx, cz)); }
  getBlock(x, y, z) {
    if (y < 0) return B.bedrock;
    if (y >= CH) return 0;
    const c = this.chunks.get(ckey(x >> 4, z >> 4));
    if (!c) return 0;
    return c.blocks[bidx(x & 15, y, z & 15)];
  }
  getLight(x, y, z) {
    if (y >= CH) return 15;
    if (y < 0) return 0;
    const c = this.chunks.get(ckey(x >> 4, z >> 4));
    if (!c || !c.lit) return 15;
    return c.light[bidx(x & 15, y, z & 15)];
  }
  isLoadedAt(x, z) { const c = this.chunks.get(ckey(x >> 4, z >> 4)); return !!(c && c.meshed); }
  biomeAt(x, z) { const c = this.chunks.get(ckey(x >> 4, z >> 4)); return c ? c.biome[(z & 15) * CS + (x & 15)] : BIOME.PLAINS; }
  surfaceY(x, z) {
    for (let y = CH - 1; y > 0; y--) if (SOLID[this.getBlock(x, y, z)] || LIQUID[this.getBlock(x, y, z)]) return y;
    return 0;
  }

  /* ---------- generation ---------- */
  generate(c) {
    const g = this.gen, ox = c.cx * CS, oz = c.cz * CS, M = 4, W = CS + 2 * M;
    const H = new Float32Array(W * W), TP = new Float32Array(W * W), MO = new Float32Array(W * W);
    // Coarse samples every S blocks on a world-aligned grid (so neighbouring chunks agree), then bilinear.
    const S = 4, GW = W / S + 1, GH = new Float32Array(GW * GW), GT = new Float32Array(GW * GW), GM = new Float32Array(GW * GW);
    for (let gz = 0; gz < GW; gz++) for (let gx = 0; gx < GW; gx++) {
      const wx = ox - M + gx * S, wz = oz - M + gz * S, k = gz * GW + gx;
      GH[k] = g.baseHeight(wx, wz);
      const cl = g.climate(wx, wz); GT[k] = cl[0]; GM[k] = cl[1];
    }
    const bl = (A, k, fx, fz) => lerp(lerp(A[k], A[k + 1], fx), lerp(A[k + GW], A[k + GW + 1], fx), fz);
    for (let z = 0; z < W; z++) for (let x = 0; x < W; x++) {
      const gx = Math.min(GW - 2, (x / S) | 0), gz = Math.min(GW - 2, (z / S) | 0), fx = (x - gx * S) / S, fz = (z - gz * S) / S;
      const k = gz * GW + gx, i = z * W + x;
      H[i] = clamp(bl(GH, k, fx, fz) + g.detail(ox + x - M, oz + z - M), 6, CH - 12);
      TP[i] = bl(GT, k, fx, fz); MO[i] = bl(GM, k, fx, fz);
    }
    const BIO = new Uint8Array(W * W), HI = new Int16Array(W * W);
    for (let z = 1; z < W - 1; z++) for (let x = 1; x < W - 1; x++) {
      const i = z * W + x;
      HI[i] = Math.floor(H[i]);
      const slope = Math.abs(H[i + 1] - H[i - 1]) + Math.abs(H[i + W] - H[i - W]);
      BIO[i] = g.biomeOf(H[i], TP[i], MO[i], slope);
    }
    const blocks = c.blocks;
    for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      const i = (z + M) * W + x + M, h = HI[i], bio = BIO[i], wx = ox + x, wz = oz + z;
      const slope = Math.abs(H[i + 1] - H[i - 1]) + Math.abs(H[i + W] - H[i - W]);
      const col = z * CS + x;
      c.biome[col] = bio;
      const t = TP[i], m = MO[i];
      c.tint[col * 3] = clamp((1.02 + 0.2 * t - 0.12 * m) * 127.5, 0, 255);
      c.tint[col * 3 + 1] = clamp((1.0 + 0.04 * m - 0.03 * Math.abs(t)) * 127.5, 0, 255);
      c.tint[col * 3 + 2] = clamp((0.86 - 0.22 * t + 0.08 * m) * 127.5, 0, 255);
      let top = B.grass, fill = B.dirt, deep = B.stone;
      const r = hash2(wx, wz, this.seed + 3);
      switch (bio) {
        case BIOME.OCEAN: case BIOME.FROZEN_OCEAN:
          top = h > SEA - 7 ? B.sand : r < 0.5 ? B.gravel : B.sand; fill = h > SEA - 7 ? B.sand : B.dirt; break;
        case BIOME.BEACH: top = B.sand; fill = B.sand; deep = B.sandstone; break;
        case BIOME.DESERT: top = B.sand; fill = B.sand; deep = B.sandstone; break;
        case BIOME.SNOWY: top = B.snow_grass; break;
        case BIOME.MOUNTAINS:
          top = h > 104 - t * 8 ? B.snow : slope > 4 ? (r < 0.15 ? B.gravel : B.stone) : (t < -0.3 ? B.snow_grass : B.grass);
          fill = top === B.snow || top === B.stone || top === B.gravel ? B.stone : B.dirt; break;
        default:
          if (slope > 6) { top = B.stone; fill = B.stone; }
      }
      const fillDepth = 3 + ((r * 3) | 0), fillStart = h - fillDepth, deepSplit = fillStart - 3, yTop = Math.max(h, SEA);
      const frozen = bio === BIOME.FROZEN_OCEAN, sandDeep = deep === SANDSTONE_ID, seed = this.seed;
      for (let y = 0, bi = z * CS + x; y <= yTop; y++, bi += CS2) {
        let id;
        if (y < fillStart) {
          if (y === 0 || (y < 4 && hash3(wx, y, wz, seed) < 0.55 - y * 0.15)) id = BEDROCK_ID;
          else id = sandDeep && y < deepSplit ? STONE_ID : deep;
        } else if (y < h) id = fill;
        else if (y === h) id = top;
        else id = frozen && y === SEA ? ICE_ID : WATER_ID;
        blocks[bi] = id;
      }
    }
    this.carveCaves(c, HI, W, M);
    this.placeOres(c);
    this.placeFlora(c, HI, BIO, W, M);
    const e = this.edits.get(c.key);
    if (e) for (const [idx, id] of e) blocks[idx] = id;
    this.finishColumns(c);
  }

  carveCaves(c, HI, W, M) {
    const g = this.gen, ox = c.cx * CS, oz = c.cz * CS, GX = 5, GY = CH / 4 + 1;
    const n1 = new Float32Array(GX * GX * GY), n2 = new Float32Array(GX * GX * GY), n3 = new Float32Array(GX * GX * GY);
    for (let gy = 0; gy < GY; gy++) for (let gz = 0; gz < GX; gz++) for (let gx = 0; gx < GX; gx++) {
      const wx = ox + gx * 4, wy = gy * 4, wz = oz + gz * 4, i = (gy * GX + gz) * GX + gx;
      n1[i] = g.nCave1.noise3(wx / 44, wy / 26, wz / 44);
      n2[i] = g.nCave2.noise3(wx / 44, wy / 26, wz / 44);
      n3[i] = wy < 48 ? g.nCave3.noise3(wx / 70, wy / 34, wz / 70) : -1;
    }
    const tri = (arr, x, y, z) => {
      const gx = x >> 2, gy = y >> 2, gz = z >> 2, fx = (x & 3) / 4, fy = (y & 3) / 4, fz = (z & 3) / 4;
      const i000 = (gy * GX + gz) * GX + gx, dz = GX, dy = GX * GX;
      const c00 = lerp(arr[i000], arr[i000 + 1], fx), c10 = lerp(arr[i000 + dz], arr[i000 + dz + 1], fx);
      const c01 = lerp(arr[i000 + dy], arr[i000 + dy + 1], fx), c11 = lerp(arr[i000 + dy + dz], arr[i000 + dy + dz + 1], fx);
      return lerp(lerp(c00, c10, fz), lerp(c01, c11, fz), fy);
    };
    const blocks = c.blocks;
    for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      const h = HI[(z + M) * W + x + M];
      const topLimit = h < SEA + 3 ? h - 6 : h;
      for (let y = 5; y <= topLimit; y++) {
        const a = tri(n1, x, y, z), b = tri(n2, x, y, z);
        const spaghetti = a * a + b * b < 0.0105;
        const cheese = y < 46 && tri(n3, x, y, z) > 0.52;
        if (!spaghetti && !cheese) continue;
        const i = bidx(x, y, z), id = blocks[i];
        if (id === B.bedrock || id === B.water) continue;
        blocks[i] = y <= 10 ? B.lava : 0;
      }
    }
  }

  placeOres(c) {
    const rnd = mulberry32(hash2(c.cx, c.cz, this.seed + 11) * 4294967296);
    const veins = [[B.coal_ore, 16, 5, 110, 9], [B.iron_ore, 10, 5, 62, 7], [B.gold_ore, 3, 5, 32, 6], [B.diamond_ore, 1.5, 3, 16, 5]];
    for (const [ore, count, y0, y1, size] of veins) {
      const n = Math.floor(count + rnd());
      for (let v = 0; v < n; v++) {
        let x = rnd() * 16, y = y0 + rnd() * (y1 - y0), z = rnd() * 16;
        for (let s = 0; s < size; s++) {
          const xi = x | 0, yi = y | 0, zi = z | 0;
          if (xi >= 0 && xi < 16 && zi >= 0 && zi < 16 && yi > 0 && yi < CH) {
            const i = bidx(xi, yi, zi);
            if (c.blocks[i] === B.stone) c.blocks[i] = ore;
          }
          x += rnd() * 2 - 1; y += rnd() * 2 - 1; z += rnd() * 2 - 1;
        }
      }
    }
  }

  placeFlora(c, HI, BIO, W, M) {
    const ox = c.cx * CS, oz = c.cz * CS, s = this.seed;
    const set = (wx, wy, wz, id, force) => {
      const x = wx - ox, z = wz - oz;
      if (x < 0 || x >= CS || z < 0 || z >= CS || wy < 1 || wy >= CH) return;
      const i = bidx(x, wy, z), cur = c.blocks[i];
      if (force ? cur === B.bedrock : (cur !== 0 && RENDERT[cur] !== RENDER.CROSS)) return;
      c.blocks[i] = id;
      if (wy > c.maxY) c.maxY = wy;
    };
    for (let z = 1; z < W - 1; z++) for (let x = 1; x < W - 1; x++) {
      const i = z * W + x, bio = BIO[i], chance = TREE_CHANCE[bio];
      if (!chance) continue;
      const wx = ox + x - M, wz = oz + z - M, r = hash2(wx, wz, s + 77);
      if (r >= chance) continue;
      let local = true;
      for (let dz = -2; dz <= 2 && local; dz++) for (let dx = -2; dx <= 2; dx++) {
        if ((dx || dz) && hash2(wx + dx, wz + dz, s + 77) < r) { local = false; break; }
      }
      if (!local) continue;
      const h = HI[i];
      if (h <= SEA) continue;
      const slope = Math.abs(HI[i + 1] - HI[i - 1]) + Math.abs(HI[i + W] - HI[i - W]);
      if (slope > 5) continue;
      const r2 = hash2(wx, wz, s + 78), r3 = hash2(wx, wz, s + 79);
      if (bio === BIOME.DESERT) {
        const ht = 1 + Math.floor(r2 * 3);
        for (let k = 1; k <= ht; k++) set(wx, h + k, wz, B.cactus, false);
        continue;
      }
      if (bio === BIOME.MOUNTAINS && h > 96) continue;
      const lx = wx - ox, lz = wz - oz;
      if (lx >= 0 && lx < CS && lz >= 0 && lz < CS) {
        const gi = bidx(lx, h, lz);
        if (c.blocks[gi] === B.grass || c.blocks[gi] === B.snow_grass) c.blocks[gi] = B.dirt;
      }
      if (bio === BIOME.TAIGA || bio === BIOME.SNOWY || bio === BIOME.MOUNTAINS) this.spruce(set, wx, h + 1, wz, r2, r3);
      else if (bio === BIOME.FOREST && r2 < 0.32) this.oak(set, wx, h + 1, wz, r3, B.birch_log, B.birch_leaves, 5);
      else this.oak(set, wx, h + 1, wz, r3, B.oak_log, B.oak_leaves, 4);
    }
    for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      const i = (z + M) * W + x + M, h = HI[i], bio = BIO[i];
      if (h + 1 >= CH) continue;
      const below = c.blocks[bidx(x, h, z)], above = bidx(x, h + 1, z);
      if (c.blocks[above] !== 0) continue;
      const r = hash2(ox + x, oz + z, s + 99);
      if (below === B.grass) {
        const grassP = bio === BIOME.PLAINS ? 0.2 : bio === BIOME.FOREST ? 0.1 : bio === BIOME.TAIGA ? 0.07 : 0.05;
        if (r < grassP) c.blocks[above] = B.tall_grass;
        else if (r < grassP + 0.012) c.blocks[above] = B.poppy;
        else if (r < grassP + 0.024) c.blocks[above] = B.dandelion;
      } else if (below === B.sand && bio === BIOME.DESERT && r < 0.012) c.blocks[above] = B.dead_bush;
    }
  }
  oak(set, x, y, z, r, log, leaves, base) {
    const h = base + Math.floor(r * 3);
    for (let k = 0; k < h; k++) set(x, y + k, z, log, true);
    for (let dy = h - 3; dy <= h; dy++) {
      const rad = dy >= h - 1 ? 1 : 2;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        const corner = Math.abs(dx) === rad && Math.abs(dz) === rad;
        if (corner && (rad === 1 ? dy === h : hash3(x + dx, y + dy, z + dz, this.seed) < 0.5)) continue;
        if (!dx && !dz && dy < h) continue;
        set(x + dx, y + dy, z + dz, leaves, false);
      }
    }
  }
  spruce(set, x, y, z, r, r2) {
    const h = 6 + Math.floor(r * 4), start = 2 + Math.floor(r2 * 2);
    for (let k = 0; k < h; k++) set(x, y + k, z, B.spruce_log, true);
    set(x, y + h, z, B.spruce_leaves, false);
    set(x, y + h + 1, z, B.spruce_leaves, false);
    let rad = 0;
    for (let dy = h; dy >= start; dy--) {
      rad = dy === h ? 1 : rad >= 2 || (dy & 1) ? 1 : 2;
      if (dy < h - 4 && (dy & 1) === 0) rad = 3;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (dx * dx + dz * dz > rad * rad + 0.5 || (!dx && !dz)) continue;
        set(x + dx, y + dy, z + dz, B.spruce_leaves, false);
      }
    }
  }

  finishColumns(c) {
    const blocks = c.blocks;
    c.emitters = [];
    let maxY = 0;
    for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      let bottom = 0;
      for (let y = CH - 1; y >= 0; y--) {
        const id = blocks[bidx(x, y, z)];
        if (id && y > maxY) maxY = y;
        if (OPAQUE[id]) { bottom = y + 1; break; }
      }
      c.skyBottom[z * CS + x] = bottom;
    }
    for (let y = 0; y <= maxY; y++) for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      const id = blocks[bidx(x, y, z)];
      if (id === B.torch || id === B.glowstone) c.emitters.push([c.cx * CS + x + 0.5, y + 0.5, c.cz * CS + z + 0.5, id]);
    }
    c.maxY = Math.min(CH - 1, maxY + 1);
  }

  /* ---------- skylight ---------- */
  computeLight(c) {
    const L = c.light, blocks = c.blocks, q = this.q, MASK = q.length - 1;
    L.fill(0);
    let head = 0, tail = 0;
    for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      let lvl = 15;
      for (let y = CH - 1; y >= 0; y--) {
        const i = bidx(x, y, z), id = blocks[i];
        if (OPAQUE[id]) break;
        lvl -= ATTEN[id];
        if (lvl <= 0) break;
        L[i] = lvl;
        if (y <= c.maxY + 1) { q[tail] = i; tail = (tail + 1) & MASK; }
      }
    }
    const seed = (nb, getCol, x0, z0, dx, dz) => {
      if (!nb) return;
      for (let k = 0; k < CS; k++) {
        const x = x0 + dx * k, z = z0 + dz * k, nbBottom = nb.skyBottom[getCol(k)];
        for (let y = nbBottom; y < CH; y++) {
          const i = bidx(x, y, z);
          if (L[i] >= 14) continue;
          if (OPAQUE[blocks[i]]) continue;
          L[i] = 14; q[tail] = i; tail = (tail + 1) & MASK;
        }
      }
    };
    seed(this.getChunk(c.cx - 1, c.cz), (k) => k * CS + 15, 0, 0, 0, 1);
    seed(this.getChunk(c.cx + 1, c.cz), (k) => k * CS, 15, 0, 0, 1);
    seed(this.getChunk(c.cx, c.cz - 1), (k) => 15 * CS + k, 0, 0, 1, 0);
    seed(this.getChunk(c.cx, c.cz + 1), (k) => k, 0, 15, 1, 0);
    // Light that already spread inside lit neighbours flows across the border too (caves, overhangs).
    const sides = [
      [this.getChunk(c.cx - 1, c.cz), 0, 15, true], [this.getChunk(c.cx + 1, c.cz), 15, 0, true],
      [this.getChunk(c.cx, c.cz - 1), 0, 15, false], [this.getChunk(c.cx, c.cz + 1), 15, 0, false],
    ];
    for (const [nb, a, bb, alongZ] of sides) {
      if (!nb || !nb.lit) continue;
      const yMax = Math.min(CH - 1, Math.max(c.maxY, nb.maxY) + 1);
      for (let k = 0; k < CS; k++) for (let y = 0; y <= yMax; y++) {
        const i = alongZ ? bidx(a, y, k) : bidx(k, y, a), id = blocks[i];
        if (OPAQUE[id]) continue;
        const v = nb.light[alongZ ? bidx(bb, y, k) : bidx(k, y, bb)] - 1 - ATTEN[id];
        if (v > L[i]) { L[i] = v; q[tail] = i; tail = (tail + 1) & MASK; }
      }
    }
    while (head !== tail) {
      const i = q[head]; head = (head + 1) & MASK;
      const l = L[i];
      if (l <= 1) continue;
      const x = i & 15, z = (i >> 4) & 15, y = i >> 8;
      for (let n = 0; n < 6; n++) {
        let j;
        if (n === 0) { if (x === 15) continue; j = i + 1; }
        else if (n === 1) { if (x === 0) continue; j = i - 1; }
        else if (n === 2) { if (z === 15) continue; j = i + CS; }
        else if (n === 3) { if (z === 0) continue; j = i - CS; }
        else if (n === 4) { if (y === CH - 1) continue; j = i + CS2; }
        else { if (y === 0) continue; j = i - CS2; }
        const id = blocks[j];
        if (OPAQUE[id]) continue;
        const nl = l - 1 - ATTEN[id];
        if (nl > L[j]) { L[j] = nl; q[tail] = j; tail = (tail + 1) & MASK; }
      }
    }
    c.lit = true;
    c.needLight = false;
    // If our border is now brighter than what a lit neighbour holds there, it needs relighting.
    for (const [nb, a, bb, alongZ] of sides) {
      if (!nb || !nb.lit || nb.needLight) continue;
      const yMax = Math.min(CH - 1, Math.max(c.maxY, nb.maxY) + 1);
      let brighter = false;
      for (let k = 0; k < CS && !brighter; k++) for (let y = 0; y <= yMax; y++) {
        const j = alongZ ? bidx(bb, y, k) : bidx(k, y, bb), nid = nb.blocks[j];
        if (OPAQUE[nid]) continue;
        if (L[alongZ ? bidx(a, y, k) : bidx(k, y, a)] - 1 - ATTEN[nid] > nb.light[j]) { brighter = true; break; }
      }
      if (brighter) { nb.needLight = true; if (nb.meshed) nb.needMesh = true; }
    }
  }

  neighborsReady(c, stage) {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const n = this.chunks.get(ckey(c.cx + dx, c.cz + dz));
      if (!n || (stage === 'lit' && !n.lit)) return false;
    }
    return true;
  }

  /* ---------- streaming ---------- */
  scan(pcx, pcz) {
    const R = this.renderDist, list = [];
    for (let dz = -R - 2; dz <= R + 2; dz++) for (let dx = -R - 2; dx <= R + 2; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dz));
      list.push([pcx + dx, pcz + dz, d, dx * dx + dz * dz]);
    }
    list.sort((a, b) => a[3] - b[3]);
    this.scanList = list;
    for (const [k, c] of this.chunks) {
      if (Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) > R + 3) {
        if (this.onUnload) this.onUnload(c);
        this.chunks.delete(k);
      }
    }
  }

  /* Returns true when every chunk inside the render distance is meshed. */
  tick(px, pz, budgetMs, mesher) {
    const pcx = Math.floor(px / CS), pcz = Math.floor(pz / CS);
    if (pcx !== this.lastCx || pcz !== this.lastCz || this.needScan) {
      this.lastCx = pcx; this.lastCz = pcz; this.needScan = false;
      this.scan(pcx, pcz);
    }
    for (const c of this.chunks.values()) {
      if (c.needLight && this.neighborsReady(c, 'gen')) this.computeLight(c);
    }
    for (const c of this.chunks.values()) {
      if (c.needMesh && c.lit && !c.needLight && this.neighborsReady(c, 'lit')) { mesher.build(this, c); c.needMesh = false; }
    }
    const t0 = performance.now();
    const R = this.renderDist;
    let done = true, ops = 0;
    for (const [cx, cz, d] of this.scanList) {
      if (ops > 0 && performance.now() - t0 > budgetMs) { done = false; break; }
      let c = this.chunks.get(ckey(cx, cz));
      if (!c) {
        c = new Chunk(cx, cz);
        this.generate(c);
        this.chunks.set(c.key, c);
        ops++;
        if (d <= R) done = false;
        continue;
      }
      if (d > R + 1) continue;
      if (!c.lit) {
        if (this.neighborsReady(c, 'gen')) { this.computeLight(c); ops++; }
        if (d <= R) done = false;
        continue;
      }
      if (d > R) continue;
      if (!c.meshed) {
        if (this.neighborsReady(c, 'lit')) { mesher.build(this, c); ops++; } else done = false;
        if (!c.meshed) done = false;
      }
    }
    return done;
  }

  /* ---------- edits ---------- */
  setBlock(x, y, z, id, opts) {
    if (y < 0 || y >= CH) return false;
    const c = this.chunks.get(ckey(x >> 4, z >> 4));
    if (!c) return false;
    const lx = x & 15, lz = z & 15, i = bidx(lx, y, lz);
    const prev = c.blocks[i];
    if (prev === id) return false;
    c.blocks[i] = id;
    let e = this.edits.get(c.key);
    if (!e) { e = new Map(); this.edits.set(c.key, e); }
    e.set(i, id);
    if (y >= c.maxY) c.maxY = Math.min(CH - 1, y + 1);
    let bottom = 0;
    for (let yy = CH - 1; yy >= 0; yy--) if (OPAQUE[c.blocks[bidx(lx, yy, lz)]]) { bottom = yy + 1; break; }
    c.skyBottom[lz * CS + lx] = bottom;
    if (BLOCKS[prev].light || BLOCKS[id].light) {
      c.emitters = c.emitters.filter((m) => !(m[0] === x + 0.5 && m[1] === y + 0.5 && m[2] === z + 0.5));
      if (id === B.torch || id === B.glowstone) c.emitters.push([x + 0.5, y + 0.5, z + 0.5, id]);
    }
    c.needLight = true; c.needMesh = true;
    const edgeX = lx === 0 ? -1 : lx === 15 ? 1 : 0, edgeZ = lz === 0 ? -1 : lz === 15 ? 1 : 0;
    const touch = (dx, dz) => { const n = this.getChunk(c.cx + dx, c.cz + dz); if (n) { n.needLight = true; n.needMesh = true; } };
    if (edgeX) touch(edgeX, 0);
    if (edgeZ) touch(0, edgeZ);
    if (edgeX && edgeZ) touch(edgeX, edgeZ);
    if (!opts || !opts.noPhysics) this.afterChange(x, y, z, prev, id);
    return true;
  }

  afterChange(x, y, z, prev, id) {
    const above = this.getBlock(x, y + 1, z);
    if (id === 0 || LIQUID[id]) {
      if (BLOCKS[above].support) this.setBlock(x, y + 1, z, 0);
      else if (BLOCKS[above].gravity) this.dropColumn(x, y + 1, z);
    }
    if (BLOCKS[id].gravity) this.dropColumn(x, y, z);
    if (id === 0) {
      const nb = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
      for (const [dx, dy, dz] of nb) if (this.getBlock(x + dx, y + dy, z + dz) === B.water) { this.flowQueue.push([x, y, z, 0]); break; }
    } else if (id === B.water) {
      this.flowQueue.push([x, y - 1, z, 0]);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) this.flowQueue.push([x + dx, y, z + dz, 1]);
    }
  }

  dropColumn(x, y, z) {
    for (let guard = 0; guard < 64; guard++) {
      const id = this.getBlock(x, y, z);
      if (!BLOCKS[id].gravity) return;
      let ty = y;
      while (ty > 0) {
        const b = this.getBlock(x, ty - 1, z);
        if (b === 0 || LIQUID[b] || RENDERT[b] === RENDER.CROSS) ty--; else break;
      }
      if (ty === y) return;
      this.setBlock(x, y, z, 0, { noPhysics: true });
      this.setBlock(x, ty, z, id, { noPhysics: true });
      y++;
    }
  }

  tickFluids(dt) {
    this.flowTimer += dt;
    if (this.flowTimer < 0.25 || !this.flowQueue.length) return;
    this.flowTimer = 0;
    const batch = this.flowQueue.splice(0, 48);
    for (const [x, y, z, d] of batch) {
      if (y < 1) continue;
      const cur = this.getBlock(x, y, z);
      if (cur !== 0 && RENDERT[cur] !== RENDER.CROSS) continue;
      const below = this.getBlock(x, y - 1, z);
      this.setBlock(x, y, z, B.water, { noPhysics: true });
      if (below === 0 || RENDERT[below] === RENDER.CROSS) this.flowQueue.push([x, y - 1, z, d]);
      else if (d < 4) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = this.getBlock(x + dx, y, z + dz);
        if (n === 0 || RENDERT[n] === RENDER.CROSS) this.flowQueue.push([x + dx, y, z + dz, d + 1]);
      }
    }
    if (this.flowQueue.length > 4000) this.flowQueue.length = 4000;
  }

  /* ---------- raycast (Amanatides & Woo DDA) ---------- */
  raycast(ox, oy, oz, dx, dy, dz, maxDist, pred) {
    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
    const tdx = Math.abs(1 / dx), tdy = Math.abs(1 / dy), tdz = Math.abs(1 / dz);
    let tmx = dx > 0 ? (x + 1 - ox) * tdx : (ox - x) * tdx;
    let tmy = dy > 0 ? (y + 1 - oy) * tdy : (oy - y) * tdy;
    let tmz = dz > 0 ? (z + 1 - oz) * tdz : (oz - z) * tdz;
    let nx = 0, ny = 0, nz = 0, t = 0;
    for (let step = 0; step < 256 && t <= maxDist; step++) {
      const id = this.getBlock(x, y, z);
      if (pred(id)) return { x, y, z, nx, ny, nz, id, dist: t };
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }

  /* ---------- persistence ---------- */
  serializeEdits() {
    const out = [];
    for (const [k, m] of this.edits) {
      if (!m.size) continue;
      const arr = [];
      for (const [i, id] of m) arr.push(i, id);
      out.push([k, arr]);
    }
    return out;
  }
  static parseEdits(list) {
    const m = new Map();
    if (Array.isArray(list)) for (const [k, arr] of list) {
      const e = new Map();
      for (let i = 0; i + 1 < arr.length; i += 2) if (arr[i + 1] < NB) e.set(arr[i], arr[i + 1]);
      m.set(k, e);
    }
    return m;
  }
}
