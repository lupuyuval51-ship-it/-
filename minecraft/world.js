// Pure voxel logic: block table, procedural terrain, chunk storage,
// ray casting and player collision. No DOM or three.js here, so it can be
// unit-tested with `node --test`.

export const CHUNK_W = 16;
export const CHUNK_H = 64;
export const CHUNK_D = 16;
export const SAND_LEVEL = 19;

const EPS = 1e-4;

export const BLOCKS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLE: 4,
  WOOD: 5,
  LEAVES: 6,
  PLANKS: 7,
  SAND: 8,
  BRICK: 9,
};

// Colors are linear RGB in 0..1. `top`, `side` and `bottom` tint the faces.
export const BLOCK_INFO = {
  [BLOCKS.GRASS]: { name: 'עשב', top: [0.36, 0.70, 0.26], side: [0.42, 0.30, 0.18], bottom: [0.45, 0.31, 0.18] },
  [BLOCKS.DIRT]: { name: 'עפר', top: [0.45, 0.31, 0.18], side: [0.45, 0.31, 0.18], bottom: [0.45, 0.31, 0.18] },
  [BLOCKS.STONE]: { name: 'אבן', top: [0.50, 0.50, 0.52], side: [0.50, 0.50, 0.52], bottom: [0.50, 0.50, 0.52] },
  [BLOCKS.COBBLE]: { name: 'אבן מסותתת', top: [0.40, 0.40, 0.42], side: [0.40, 0.40, 0.42], bottom: [0.40, 0.40, 0.42] },
  [BLOCKS.WOOD]: { name: 'עץ', top: [0.62, 0.48, 0.28], side: [0.40, 0.28, 0.14], bottom: [0.62, 0.48, 0.28] },
  [BLOCKS.LEAVES]: { name: 'עלים', top: [0.20, 0.52, 0.18], side: [0.20, 0.52, 0.18], bottom: [0.20, 0.52, 0.18] },
  [BLOCKS.PLANKS]: { name: 'קרשים', top: [0.76, 0.60, 0.36], side: [0.72, 0.55, 0.32], bottom: [0.76, 0.60, 0.36] },
  [BLOCKS.SAND]: { name: 'חול', top: [0.88, 0.82, 0.55], side: [0.88, 0.82, 0.55], bottom: [0.88, 0.82, 0.55] },
  [BLOCKS.BRICK]: { name: 'לבנים', top: [0.62, 0.22, 0.18], side: [0.62, 0.22, 0.18], bottom: [0.62, 0.22, 0.18] },
};

// Blocks available in the hotbar, in key order 1..9.
export const HOTBAR = [
  BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.COBBLE, BLOCKS.WOOD,
  BLOCKS.PLANKS, BLOCKS.LEAVES, BLOCKS.SAND, BLOCKS.BRICK,
];

export function localIndex(x, y, z) {
  return x + z * CHUNK_W + y * CHUNK_W * CHUNK_D;
}

// Deterministic hash of an integer lattice point, returns a value in [0, 1).
function hash2(x, z, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

// Smooth 2D value noise, returns a value in [0, 1).
export function valueNoise(x, z, seed) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = smooth(x - x0);
  const tz = smooth(z - z0);
  const a = hash2(x0, z0, seed);
  const b = hash2(x0 + 1, z0, seed);
  const c = hash2(x0, z0 + 1, seed);
  const d = hash2(x0 + 1, z0 + 1, seed);
  const top = a + (b - a) * tx;
  const bottom = c + (d - c) * tx;
  return top + (bottom - top) * tz;
}

// Surface height (top solid block y) for a world column. Range 18..41.
export function terrainHeight(x, z, seed) {
  const n =
    0.55 * valueNoise(x / 48, z / 48, seed) +
    0.30 * valueNoise(x / 20, z / 20, seed + 1) +
    0.15 * valueNoise(x / 8, z / 8, seed + 2);
  return 18 + Math.min(23, Math.floor(n * 24));
}

function placeTree(data, x, y, z) {
  const trunk = 4;
  for (let i = 0; i < trunk; i++) data[localIndex(x, y + i, z)] = BLOCKS.WOOD;
  const top = y + trunk;
  for (let ly = top - 2; ly <= top + 1; ly++) {
    const r = ly <= top ? 2 : 1;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        const p = localIndex(x + dx, ly, z + dz);
        if (data[p] === BLOCKS.AIR) data[p] = BLOCKS.LEAVES;
      }
    }
  }
}

function generateChunk(cx, cz, seed) {
  const data = new Uint8Array(CHUNK_W * CHUNK_H * CHUNK_D);
  const heights = new Int32Array(CHUNK_W * CHUNK_D);

  for (let lz = 0; lz < CHUNK_D; lz++) {
    for (let lx = 0; lx < CHUNK_W; lx++) {
      const h = terrainHeight(cx * CHUNK_W + lx, cz * CHUNK_D + lz, seed);
      const beach = h <= SAND_LEVEL;
      heights[lx + lz * CHUNK_W] = h;
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === h) id = beach ? BLOCKS.SAND : BLOCKS.GRASS;
        else if (y >= h - 3) id = beach ? BLOCKS.SAND : BLOCKS.DIRT;
        else id = BLOCKS.STONE;
        data[localIndex(lx, y, lz)] = id;
      }
    }
  }

  // Trees only in columns whose whole canopy fits inside this chunk, so
  // generation never depends on neighbouring chunks.
  for (let lz = 3; lz <= CHUNK_D - 4; lz++) {
    for (let lx = 3; lx <= CHUNK_W - 4; lx++) {
      const wx = cx * CHUNK_W + lx;
      const wz = cz * CHUNK_D + lz;
      if (hash2(wx, wz, seed + 99) < 0.985) continue;
      const h = heights[lx + lz * CHUNK_W];
      if (h <= SAND_LEVEL || h + 8 >= CHUNK_H) continue;
      if (data[localIndex(lx, h, lz)] !== BLOCKS.GRASS) continue;
      placeTree(data, lx, h + 1, lz);
    }
  }

  return { cx, cz, data };
}

export class World {
  constructor(seed = 1337) {
    this.seed = seed;
    this.chunks = new Map();
  }

  static key(cx, cz) {
    return `${cx},${cz}`;
  }

  // Returns the chunk, generating it on first access.
  chunk(cx, cz) {
    const k = World.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) {
      c = generateChunk(cx, cz, this.seed);
      this.chunks.set(k, c);
    }
    return c;
  }

  get(x, y, z) {
    if (y < 0 || y >= CHUNK_H) return BLOCKS.AIR;
    const cx = Math.floor(x / CHUNK_W);
    const cz = Math.floor(z / CHUNK_D);
    const lx = x - cx * CHUNK_W;
    const lz = z - cz * CHUNK_D;
    return this.chunk(cx, cz).data[localIndex(lx, y, lz)];
  }

  // Sets a block and returns the chunk coordinates whose mesh must be rebuilt
  // (the own chunk plus any neighbour whose face it borders).
  set(x, y, z, id) {
    if (y < 0 || y >= CHUNK_H) return [];
    const cx = Math.floor(x / CHUNK_W);
    const cz = Math.floor(z / CHUNK_D);
    const lx = x - cx * CHUNK_W;
    const lz = z - cz * CHUNK_D;
    this.chunk(cx, cz).data[localIndex(lx, y, lz)] = id;

    const dirty = [[cx, cz]];
    if (lx === 0) dirty.push([cx - 1, cz]);
    if (lx === CHUNK_W - 1) dirty.push([cx + 1, cz]);
    if (lz === 0) dirty.push([cx, cz - 1]);
    if (lz === CHUNK_D - 1) dirty.push([cx, cz + 1]);
    return dirty;
  }

  // Highest non-air block in a column, or -1.
  surfaceY(x, z) {
    for (let y = CHUNK_H - 1; y >= 0; y--) {
      if (this.get(x, y, z) !== BLOCKS.AIR) return y;
    }
    return -1;
  }
}

// Amanatides & Woo voxel traversal. `dir` must be normalised.
// Returns the first solid block within `maxDist`, the face normal it was hit
// through, and the empty cell in front of that face (where a new block goes).
export function raycast(world, ox, oy, oz, dx, dy, dz, maxDist) {
  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);
  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;
  const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
  const toEdge = (o, d, i) => (d > 0 ? i + 1 - o : o - i);
  let tMaxX = dx !== 0 ? toEdge(ox, dx, x) * tDeltaX : Infinity;
  let tMaxY = dy !== 0 ? toEdge(oy, dy, y) * tDeltaY : Infinity;
  let tMaxZ = dz !== 0 ? toEdge(oz, dz, z) * tDeltaZ : Infinity;
  let nx = 0;
  let ny = 0;
  let nz = 0;
  let t = 0;

  while (t <= maxDist) {
    const id = world.get(x, y, z);
    if (id !== BLOCKS.AIR) {
      return {
        block: { x, y, z },
        id,
        normal: { x: nx, y: ny, z: nz },
        place: { x: x + nx, y: y + ny, z: z + nz },
        distance: t,
      };
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      t = tMaxX;
      tMaxX += tDeltaX;
      x += stepX;
      nx = -stepX; ny = 0; nz = 0;
    } else if (tMaxY < tMaxZ) {
      t = tMaxY;
      tMaxY += tDeltaY;
      y += stepY;
      nx = 0; ny = -stepY; nz = 0;
    } else {
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      z += stepZ;
      nx = 0; ny = 0; nz = -stepZ;
    }
  }
  return null;
}

// Player body: `x,y,z` is the centre of the feet. Box is w*2 wide and h tall.
export function createBody(x, y, z) {
  return { x, y, z, w: 0.3, h: 1.7, vy: 0, onGround: false };
}

function solidCells(world, b) {
  const x0 = Math.floor(b.x - b.w + EPS);
  const x1 = Math.floor(b.x + b.w - EPS);
  const y0 = Math.floor(b.y + EPS);
  const y1 = Math.floor(b.y + b.h - EPS);
  const z0 = Math.floor(b.z - b.w + EPS);
  const z1 = Math.floor(b.z + b.w - EPS);
  const cells = [];
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (world.get(x, y, z) !== BLOCKS.AIR) cells.push({ x, y, z });
      }
    }
  }
  return cells;
}

// Pushes the body out of solid cells along one axis. Returns true if it hit.
function resolveAxis(world, b, axis, d) {
  if (d === 0) return false;
  let hit = false;
  for (const c of solidCells(world, b)) {
    hit = true;
    if (axis === 'x') {
      b.x = d > 0 ? Math.min(b.x, c.x - b.w - EPS) : Math.max(b.x, c.x + 1 + b.w + EPS);
    } else if (axis === 'z') {
      b.z = d > 0 ? Math.min(b.z, c.z - b.w - EPS) : Math.max(b.z, c.z + 1 + b.w + EPS);
    } else {
      b.y = d > 0 ? Math.min(b.y, c.y - b.h - EPS) : Math.max(b.y, c.y + 1 + EPS);
    }
  }
  return hit;
}

// Moves the body by (dx,dy,dz) with per-axis collision. Long moves are split
// into small substeps so the body cannot tunnel through thin geometry.
export function moveBody(world, b, dx, dy, dz) {
  const hit = { x: false, y: false, z: false };
  const longest = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
  const steps = Math.max(1, Math.ceil(longest / 0.25));
  const sx = dx / steps;
  const sy = dy / steps;
  const sz = dz / steps;
  for (let i = 0; i < steps; i++) {
    b.x += sx;
    if (resolveAxis(world, b, 'x', sx)) hit.x = true;
    b.z += sz;
    if (resolveAxis(world, b, 'z', sz)) hit.z = true;
    b.y += sy;
    if (resolveAxis(world, b, 'y', sy)) hit.y = true;
  }
  return hit;
}

// True when a solid block lies directly beneath the feet.
export function isGrounded(world, b) {
  const y = Math.floor(b.y - 0.02);
  if (b.y - (y + 1) > 0.05) return false;
  const x0 = Math.floor(b.x - b.w + EPS);
  const x1 = Math.floor(b.x + b.w - EPS);
  const z0 = Math.floor(b.z - b.w + EPS);
  const z1 = Math.floor(b.z + b.w - EPS);
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      if (world.get(x, y, z) !== BLOCKS.AIR) return true;
    }
  }
  return false;
}

// True when the body's box overlaps the unit cell at (cell.x, cell.y, cell.z).
export function overlapsBlock(b, cell) {
  return (
    b.x - b.w < cell.x + 1 && b.x + b.w > cell.x &&
    b.y < cell.y + 1 && b.y + b.h > cell.y &&
    b.z - b.w < cell.z + 1 && b.z + b.w > cell.z
  );
}
