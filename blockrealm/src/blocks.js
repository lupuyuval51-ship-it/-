'use strict';
/* BlockRealm — procedural 32px textures (albedo + height/specular → normal maps), block and item catalogue. */

const TS = 32;
const TILES = [];
const TILE = {};

function tile(name, strength, fn) {
  const t = { name, rgba: new Uint8ClampedArray(TS * TS * 4), h: new Float32Array(TS * TS).fill(0.5), spec: new Float32Array(TS * TS), strength };
  fn(t, mulberry32(hashString(name) ^ 0x5eed));
  TILE[name] = TILES.length;
  TILES.push(t);
}
function px(t, x, y, r, g, b, a = 255, h, sp) {
  x &= 31; y &= 31;
  const i = y * TS + x, o = i * 4;
  t.rgba[o] = r; t.rgba[o + 1] = g; t.rgba[o + 2] = b; t.rgba[o + 3] = a;
  if (h !== undefined) t.h[i] = h;
  if (sp !== undefined) t.spec[i] = sp;
}
function getPx(t, x, y) { const o = ((y & 31) * TS + (x & 31)) * 4; return [t.rgba[o], t.rgba[o + 1], t.rgba[o + 2], t.rgba[o + 3]]; }
function copyTile(dst, src) { dst.rgba.set(src.rgba); dst.h.set(src.h); dst.spec.set(src.spec); }

function tnoise(rnd, cells) {
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const s = cells / TS;
  return (x, y) => {
    const fx = x * s, fy = y * s, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const xa = ((x0 % cells) + cells) % cells, xb = (xa + 1) % cells, ya = ((y0 % cells) + cells) % cells, yb = (ya + 1) % cells;
    return lerp(lerp(g[ya * cells + xa], g[ya * cells + xb], sx), lerp(g[yb * cells + xa], g[yb * cells + xb], sx), sy);
  };
}
function voronoi(rnd, n) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([rnd() * TS, rnd() * TS, rnd()]);
  return (x, y) => {
    let d1 = 1e9, d2 = 1e9, id = 0;
    for (const p of pts) {
      let dx = Math.abs(x + 0.5 - p[0]); dx = Math.min(dx, TS - dx);
      let dy = Math.abs(y + 0.5 - p[1]); dy = Math.min(dy, TS - dy);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < d1) { d2 = d1; d1 = d; id = p[2]; } else if (d < d2) d2 = d;
    }
    return { d1, d2, id };
  };
}
const each = (fn) => { for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) fn(x, y); };

/* ---------- texture painters ---------- */
function paintDirt(t, rnd) {
  const n1 = tnoise(rnd, 4), n2 = tnoise(rnd, 8), n3 = tnoise(rnd, 16);
  each((x, y) => {
    const v = n1(x, y) * 0.5 + n2(x, y) * 0.3 + n3(x, y) * 0.2, r = rnd();
    let c = [118, 84, 58], h = v;
    if (r > 0.93) { c = [148, 112, 82]; h = v + 0.35; } else if (r < 0.07) { c = [78, 54, 38]; h = v - 0.25; }
    const f = 0.74 + v * 0.46 + (r - 0.5) * 0.1;
    px(t, x, y, c[0] * f, c[1] * f, c[2] * f, 255, h);
  });
}
function paintStone(t, rnd) {
  const n1 = tnoise(rnd, 4), n2 = tnoise(rnd, 8), n3 = tnoise(rnd, 16);
  each((x, y) => {
    const v = n1(x, y) * 0.45 + n2(x, y) * 0.35 + n3(x, y) * 0.2, r = rnd();
    let g = 104 + v * 52 + (r - 0.5) * 12, h = v;
    if (Math.abs(n2(x, y) - 0.5) < 0.022) { g *= 0.72; h -= 0.35; }
    px(t, x, y, g, g, g * 1.03, 255, h);
  });
}
function paintCobble(t, rnd, moss) {
  const vo = voronoi(rnd, 11), n = tnoise(rnd, 8), mn = tnoise(rnd, 4);
  each((x, y) => {
    const { d1, d2, id } = vo(x, y), edge = d2 - d1, r = rnd();
    if (edge < 1.5) { const g = 58 + r * 18; px(t, x, y, g, g, g, 255, 0); return; }
    const g = 92 + id * 58 + n(x, y) * 26 + (r - 0.5) * 14;
    let c = [g, g, g * 1.02];
    if (moss && mn(x, y) + n(x, y) * 0.3 > 0.78) c = [62 + r * 30, 96 + r * 34, 44 + r * 16];
    px(t, x, y, c[0], c[1], c[2], 255, Math.min(1, edge / 5) * 0.8 + n(x, y) * 0.2);
  });
}
function paintSand(t, rnd, base) {
  const n1 = tnoise(rnd, 8), n2 = tnoise(rnd, 16);
  each((x, y) => {
    const v = n1(x, y) * 0.5 + n2(x, y) * 0.5, r = rnd();
    let f = 0.9 + v * 0.14 + (r - 0.5) * 0.08;
    if (r > 0.96) f *= 0.82; else if (r < 0.03) f *= 1.08;
    px(t, x, y, base[0] * f, base[1] * f, base[2] * f, 255, v * 0.6 + r * 0.4);
  });
}
function paintLogSide(t, rnd, base, groove) {
  const col = new Float32Array(TS), n = tnoise(rnd, 16), n2 = tnoise(rnd, 4);
  for (let x = 0; x < TS; x++) col[x] = rnd();
  each((x, y) => {
    const c = (col[x] * 2 + col[(x + 1) & 31] + col[(x + 31) & 31]) / 4 + (n(x, y * 0.25) - 0.5) * 0.25;
    let f = 0.72 + c * 0.42 + (n2(x, y) - 0.5) * 0.1, h = c;
    let cc = base;
    if (c < 0.3) { cc = groove; f = 0.85 + c; h = 0; }
    px(t, x, y, cc[0] * f, cc[1] * f, cc[2] * f, 255, h);
  });
}
function paintLogTop(t, rnd, inner, bark) {
  const n = tnoise(rnd, 8);
  each((x, y) => {
    const dx = x - 15.5, dy = y - 15.5, d = Math.sqrt(dx * dx + dy * dy), m = Math.max(Math.abs(dx), Math.abs(dy));
    if (m > 13.5) { const f = 0.75 + rnd() * 0.3; px(t, x, y, bark[0] * f, bark[1] * f, bark[2] * f, 255, 0.8); return; }
    const ring = 0.5 + 0.5 * Math.sin(d * 1.7 + n(x, y) * 2.5), f = 0.8 + ring * 0.2 + (rnd() - 0.5) * 0.05;
    px(t, x, y, inner[0] * f, inner[1] * f, inner[2] * f, 255, 0.4 + ring * 0.3);
  });
}
function paintPlanks(t, rnd, base) {
  const n = tnoise(rnd, 8), tints = [0, 1, 2, 3].map(() => 0.92 + rnd() * 0.16);
  each((x, y) => {
    const board = y >> 3, yy = y & 7, seam = (board * 13 + 5) & 31;
    const grain = n(x + board * 7, y * 4 + board * 9);
    let f = (0.82 + grain * 0.3) * tints[board], h = 0.6 + grain * 0.3;
    if (yy === 7) { f *= 0.55; h = 0; } else if (x === seam) { f *= 0.62; h = 0.1; } else if (yy === 0) f *= 1.06;
    px(t, x, y, base[0] * f, base[1] * f, base[2] * f, 255, h);
  });
}
function paintLeaves(t, rnd, base, density) {
  const n = tnoise(rnd, 8), n2 = tnoise(rnd, 16);
  each((x, y) => {
    const r = rnd(), v = n(x, y);
    const solid = r * 0.55 + v * 0.3 + n2(x, y) * 0.15 > 0.78 - density * 0.45;
    const f = 0.55 + r * 0.5 + v * 0.15;
    px(t, x, y, base[0] * f, base[1] * f, base[2] * f, solid ? 255 : 0, r * 0.7 + v * 0.3, r > 0.85 ? 0.25 : 0.05);
  });
}
function paintOre(t, rnd, spot, spec) {
  copyTile(t, TILES[TILE.stone]);
  const blobs = 5 + ((rnd() * 3) | 0);
  for (let b = 0; b < blobs; b++) {
    const cx = rnd() * 32, cy = rnd() * 32, size = 3 + ((rnd() * 4) | 0);
    let x = cx, y = cy;
    for (let s = 0; s < size; s++) {
      const r = rnd(), f = 0.75 + r * 0.45;
      px(t, x | 0, y | 0, spot[0] * f, spot[1] * f, spot[2] * f, 255, 0.95, spec * (0.6 + r * 0.4));
      px(t, (x | 0) + 1, y | 0, spot[0] * f * 0.8, spot[1] * f * 0.8, spot[2] * f * 0.8, 255, 0.85, spec * 0.5);
      x += (rnd() - 0.5) * 3; y += (rnd() - 0.5) * 3;
    }
  }
}
function paintMetal(t, rnd, base) {
  const n = tnoise(rnd, 16);
  each((x, y) => {
    const v = n(x, y), edge = x === 0 || y === 0 ? 1.18 : x === 31 || y === 31 ? 0.7 : x === 1 || y === 1 ? 1.08 : x === 30 || y === 30 ? 0.82 : 1;
    const f = (0.9 + v * 0.12) * edge;
    px(t, x, y, base[0] * f, base[1] * f, base[2] * f, 255, edge === 1 ? 0.6 + v * 0.1 : edge > 1 ? 0.9 : 0.2, 0.75);
  });
}
function paintWool(t, rnd, base) {
  const n = tnoise(rnd, 16), n2 = tnoise(rnd, 8);
  each((x, y) => {
    const v = n(x, y) * 0.6 + n2(x, y) * 0.4, r = rnd(), f = 0.84 + v * 0.2 + (r - 0.5) * 0.06;
    px(t, x, y, base[0] * f, base[1] * f, base[2] * f, 255, v);
  });
}
function paintFringe(t, rnd, color, minLen, maxLen) {
  const n = tnoise(rnd, 8);
  for (let x = 0; x < TS; x++) {
    const len = minLen + Math.floor(rnd() * (maxLen - minLen + 1));
    for (let y = 0; y < len; y++) {
      const f = 0.78 + rnd() * 0.3 + n(x, y) * 0.1;
      px(t, x, y, color[0] * f, color[1] * f, color[2] * f, 255, 0.75);
    }
    const f = 0.62;
    px(t, x, len, color[0] * f, color[1] * f, color[2] * f, 255, 0.55);
  }
}
function clearTile(t) { t.rgba.fill(0); t.h.fill(0.5); t.spec.fill(0); }
function plantBlades(t, rnd, base, count, minH, maxH) {
  clearTile(t);
  for (let b = 0; b < count; b++) {
    const x0 = 2 + rnd() * 28, h = minH + rnd() * (maxH - minH), lean = (rnd() - 0.5) * 6, f0 = 0.65 + rnd() * 0.5;
    for (let i = 0; i < h; i++) {
      const p = i / h, x = Math.round(x0 + lean * p * p), y = 31 - i, f = f0 * (0.75 + p * 0.45);
      px(t, x, y, base[0] * f, base[1] * f, base[2] * f, 255, 0.5 + p * 0.5);
    }
  }
}
function line(t, x0, y0, x1, y1, c, w = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  for (let i = 0; i <= n; i++) {
    const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n));
    for (let k = 0; k < w; k++) px(t, x + k, y, c[0], c[1], c[2], 255, 0.8);
  }
}
function disc(t, cx, cy, r, c, rnd) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= r) { const f = 0.8 + rnd() * 0.3 - d / r * 0.15; px(t, x, y, c[0] * f, c[1] * f, c[2] * f, 255, 1 - d / r * 0.5); }
  }
}

/* ---------- tiles ---------- */
tile('dirt', 1.2, paintDirt);
tile('grass_top', 1.0, (t, rnd) => {
  const n1 = tnoise(rnd, 4), n2 = tnoise(rnd, 16);
  each((x, y) => {
    const v = n1(x, y) * 0.6 + n2(x, y) * 0.4, r = rnd();
    let c = [90, 116, 56], h = r * 0.6 + v * 0.4;
    if (r > 0.88) { c = [108, 134, 64]; h += 0.3; } else if (r < 0.08) { c = [64, 86, 42]; h -= 0.2; }
    const f = 0.76 + v * 0.36 + (r - 0.5) * 0.12;
    px(t, x, y, c[0] * f, c[1] * f, c[2] * f, 255, h);
  });
});
tile('grass_side', 1.2, (t, rnd) => { paintDirt(t, rnd); paintFringe(t, rnd, [86, 114, 54], 3, 7); });
tile('stone', 1.4, paintStone);
tile('cobblestone', 3.0, (t, rnd) => paintCobble(t, rnd, false));
tile('mossy_cobble', 3.0, (t, rnd) => paintCobble(t, rnd, true));
tile('sand', 0.7, (t, rnd) => paintSand(t, rnd, [222, 206, 160]));
tile('sandstone_top', 0.8, (t, rnd) => paintSand(t, rnd, [214, 197, 150]));
tile('sandstone_side', 1.4, (t, rnd) => {
  paintSand(t, rnd, [208, 190, 142]);
  each((x, y) => {
    if (y < 3) { const c = getPx(t, x, y); px(t, x, y, c[0] * 1.06, c[1] * 1.06, c[2] * 1.06, 255, 0.8); }
    if (y === 3 || y === 12 || y === 22) { const c = getPx(t, x, y); px(t, x, y, c[0] * 0.82, c[1] * 0.82, c[2] * 0.82, 255, 0.1); }
  });
});
tile('gravel', 2.2, (t, rnd) => {
  const vo = voronoi(rnd, 26);
  each((x, y) => {
    const { d1, d2, id } = vo(x, y), edge = d2 - d1, r = rnd();
    const base = id < 0.33 ? [128, 122, 118] : id < 0.66 ? [104, 98, 96] : [146, 132, 120];
    const f = edge < 0.9 ? 0.55 : 0.82 + id * 0.3 + (r - 0.5) * 0.1;
    px(t, x, y, base[0] * f, base[1] * f, base[2] * f, 255, Math.min(1, edge / 3));
  });
});
tile('bedrock', 2.5, (t, rnd) => {
  const n1 = tnoise(rnd, 8), n2 = tnoise(rnd, 16);
  each((x, y) => { const v = n1(x, y) * 0.6 + n2(x, y) * 0.4, g = 34 + Math.round(v * 5) / 5 * 110 + rnd() * 10; px(t, x, y, g, g, g, 255, v); });
});
tile('oak_log', 1.6, (t, rnd) => paintLogSide(t, rnd, [104, 82, 50], [62, 48, 30]));
tile('oak_log_top', 1.0, (t, rnd) => paintLogTop(t, rnd, [176, 142, 88], [92, 72, 44]));
tile('birch_log', 1.0, (t, rnd) => {
  const n = tnoise(rnd, 8);
  each((x, y) => { const f = 0.88 + n(x, y) * 0.14 + (rnd() - 0.5) * 0.04; px(t, x, y, 222 * f, 220 * f, 212 * f, 255, 0.7); });
  for (let k = 0; k < 11; k++) {
    const y0 = (rnd() * 32) | 0, x0 = (rnd() * 32) | 0, len = 2 + ((rnd() * 7) | 0);
    for (let i = 0; i < len; i++) px(t, x0 + i, y0, 44, 42, 38, 255, 0.1);
    if (rnd() > 0.5) for (let i = 0; i < len - 1; i++) px(t, x0 + i, y0 + 1, 70, 66, 60, 255, 0.2);
  }
});
tile('birch_log_top', 1.0, (t, rnd) => paintLogTop(t, rnd, [200, 182, 132], [212, 210, 200]));
tile('spruce_log', 1.6, (t, rnd) => paintLogSide(t, rnd, [74, 52, 30], [42, 28, 16]));
tile('spruce_log_top', 1.0, (t, rnd) => paintLogTop(t, rnd, [128, 96, 58], [60, 42, 24]));
tile('oak_planks', 1.0, (t, rnd) => paintPlanks(t, rnd, [168, 134, 84]));
tile('spruce_planks', 1.0, (t, rnd) => paintPlanks(t, rnd, [112, 82, 50]));
tile('oak_leaves', 1.4, (t, rnd) => paintLeaves(t, rnd, [62, 96, 40], 0.78));
tile('birch_leaves', 1.4, (t, rnd) => paintLeaves(t, rnd, [104, 142, 64], 0.74));
tile('spruce_leaves', 1.4, (t, rnd) => paintLeaves(t, rnd, [46, 84, 52], 0.82));
tile('glass', 0.3, (t) => {
  clearTile(t);
  each((x, y) => {
    if (x === 0 || y === 0 || x === 31 || y === 31) px(t, x, y, 214, 234, 238, 255, 0.8, 0.9);
    else if ((x === 1 || y === 1) && x < 31 && y < 31) px(t, x, y, 170, 200, 210, 255, 0.6, 0.9);
    else if ((x - y > 8 && x - y < 11 && y < 14) || (x - y > 14 && x - y < 16 && y < 8)) px(t, x, y, 236, 248, 252, 255, 0.7, 1);
  });
});
tile('water', 0.6, (t, rnd) => {
  const n1 = tnoise(rnd, 4), n2 = tnoise(rnd, 8);
  each((x, y) => { const v = n1(x, y) * 0.6 + n2(x, y) * 0.4, f = 0.85 + v * 0.3; px(t, x, y, 42 * f, 96 * f, 186 * f, 200, v, 1); });
});
tile('lava', 1.0, (t, rnd) => {
  const n1 = tnoise(rnd, 4), n2 = tnoise(rnd, 8), n3 = tnoise(rnd, 16);
  each((x, y) => {
    const v = n1(x, y) * 0.5 + n2(x, y) * 0.3 + n3(x, y) * 0.2;
    let c = [lerp(150, 255, v), lerp(28, 120, v), lerp(4, 20, v)];
    if (v > 0.68) c = [255, 210 + v * 40, 90];
    px(t, x, y, c[0], c[1], c[2], 255, v);
  });
});
tile('snow', 0.5, (t, rnd) => {
  const n = tnoise(rnd, 8);
  each((x, y) => { const v = n(x, y), f = 0.93 + v * 0.07 + (rnd() - 0.5) * 0.02; px(t, x, y, 238 * f, 244 * f, 252 * f, 255, v, 0.2); });
});
tile('grass_snow_side', 1.2, (t, rnd) => { paintDirt(t, rnd); paintFringe(t, rnd, [236, 242, 250], 3, 6); });
tile('ice', 0.6, (t, rnd) => {
  const n = tnoise(rnd, 4);
  each((x, y) => {
    const v = n(x, y); let c = [150 + v * 30, 188 + v * 24, 240];
    if (Math.abs(x - y * 0.6 - 9) < 0.6 || Math.abs(x + y * 0.4 - 26) < 0.5) c = [220, 236, 252];
    px(t, x, y, c[0], c[1], c[2], 255, v * 0.3, 0.85);
  });
});
tile('coal_ore', 1.6, (t, rnd) => paintOre(t, rnd, [34, 34, 36], 0.25));
tile('iron_ore', 1.6, (t, rnd) => paintOre(t, rnd, [214, 172, 142], 0.6));
tile('gold_ore', 1.6, (t, rnd) => paintOre(t, rnd, [250, 214, 70], 0.85));
tile('diamond_ore', 1.6, (t, rnd) => paintOre(t, rnd, [96, 228, 222], 0.95));
tile('bricks', 2.2, (t, rnd) => {
  const n = tnoise(rnd, 16), tint = new Float32Array(16).map(() => 0.85 + rnd() * 0.25);
  each((x, y) => {
    const row = y >> 3, off = (row & 1) * 8, bx = ((x + off) & 31) >> 4;
    if ((y & 7) === 0 || ((x + off) & 15) === 0) { const g = 150 + rnd() * 20; px(t, x, y, g, g * 0.97, g * 0.92, 255, 0.05); return; }
    const f = tint[row * 2 + bx] * (0.88 + n(x, y) * 0.2);
    px(t, x, y, 152 * f, 72 * f, 56 * f, 255, 0.75 + n(x, y) * 0.2);
  });
});
tile('stone_bricks', 2.2, (t, rnd) => {
  paintStone(t, rnd);
  each((x, y) => {
    const row = y >> 4, off = (row & 1) * 16;
    if ((y & 15) === 0 || ((x + off) & 31) === 0) { px(t, x, y, 62, 62, 64, 255, 0); return; }
    if ((y & 15) === 15 || ((x + off) & 31) === 31) { const c = getPx(t, x, y); px(t, x, y, c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, 255, 0.3); }
  });
});
tile('cactus_side', 1.6, (t, rnd) => {
  const n = tnoise(rnd, 8);
  each((x, y) => {
    const ridge = (x % 8) < 2, f = (ridge ? 0.72 : 0.92) + n(x, y) * 0.14;
    px(t, x, y, 58 * f, 122 * f, 44 * f, 255, ridge ? 0.2 : 0.7);
    if (ridge && rnd() < 0.08) px(t, x, y, 214, 214, 176, 255, 1);
  });
});
tile('cactus_top', 1.0, (t, rnd) => {
  each((x, y) => {
    const m = Math.max(Math.abs(x - 15.5), Math.abs(y - 15.5)), f = m > 13 ? 0.7 : 0.9 + rnd() * 0.1 - (m < 3 ? 0.1 : 0);
    px(t, x, y, 76 * f, 138 * f, 54 * f, 255, m > 13 ? 0.3 : 0.6);
  });
});
tile('tall_grass', 0.4, (t, rnd) => plantBlades(t, rnd, [86, 112, 52], 16, 10, 28));
tile('dead_bush', 0.4, (t, rnd) => {
  clearTile(t);
  const c = [118, 84, 44];
  const branch = (x, y, a, len, d) => {
    if (d > 4 || len < 2) return;
    const x2 = x + Math.cos(a) * len, y2 = y - Math.sin(a) * len;
    line(t, x, y, x2, y2, c);
    branch(x2, y2, a + 0.5 + rnd() * 0.3, len * 0.7, d + 1);
    branch(x2, y2, a - 0.5 - rnd() * 0.3, len * 0.7, d + 1);
  };
  branch(16, 31, Math.PI / 2, 8, 0);
});
tile('poppy', 0.4, (t, rnd) => {
  clearTile(t);
  line(t, 16, 31, 16, 15, [52, 104, 36]);
  line(t, 16, 25, 12, 22, [60, 120, 40]); line(t, 16, 23, 20, 20, [60, 120, 40]);
  disc(t, 16, 11, 4.6, [204, 30, 32], rnd);
  disc(t, 16, 11, 1.4, [40, 22, 12], rnd);
});
tile('dandelion', 0.4, (t, rnd) => {
  clearTile(t);
  line(t, 16, 31, 16, 17, [58, 112, 38]);
  line(t, 16, 27, 12, 25, [64, 124, 42]);
  disc(t, 16, 13, 3.8, [244, 204, 44], rnd);
  disc(t, 16, 13, 1.2, [216, 150, 20], rnd);
});
tile('torch', 0.4, (t, rnd) => {
  clearTile(t);
  for (let y = 16; y < 32; y++) for (let x = 14; x < 18; x++) {
    const f = (x === 14 ? 1.15 : x === 17 ? 0.75 : 0.95) * (0.92 + rnd() * 0.12);
    px(t, x, y, 112 * f, 80 * f, 46 * f, 255, 0.6);
  }
  for (let y = 10; y < 17; y++) for (let x = 14; x < 18; x++) {
    const core = (x === 15 || x === 16) && y > 11;
    px(t, x, y, 255, core ? 240 : y < 12 ? 150 : 196, core ? 176 : 64, 255, 0.9);
  }
});
tile('glowstone', 1.6, (t, rnd) => {
  const vo = voronoi(rnd, 14);
  each((x, y) => {
    const { d1, d2, id } = vo(x, y), edge = d2 - d1, r = rnd();
    if (edge < 1.2) { px(t, x, y, 132, 94, 42, 255, 0.1); return; }
    const f = 0.8 + id * 0.25 + r * 0.1;
    px(t, x, y, 255 * Math.min(1, f), 206 * f, 118 * f, 255, 0.6 + id * 0.3);
  });
});
tile('wool_white', 0.9, (t, rnd) => paintWool(t, rnd, [232, 232, 228]));
tile('wool_red', 0.9, (t, rnd) => paintWool(t, rnd, [172, 44, 40]));
tile('wool_blue', 0.9, (t, rnd) => paintWool(t, rnd, [52, 72, 168]));
tile('bookshelf', 1.4, (t, rnd) => {
  paintPlanks(t, rnd, [168, 134, 84]);
  const colors = [[134, 38, 34], [46, 92, 52], [44, 60, 128], [120, 86, 40], [150, 128, 70], [90, 40, 90]];
  for (const [y0, y1] of [[3, 14], [18, 29]]) {
    let x = 2;
    while (x < 29) {
      const w = 2 + ((rnd() * 2) | 0), c = colors[(rnd() * colors.length) | 0], top = y0 + ((rnd() * 3) | 0);
      for (let xx = x; xx < Math.min(30, x + w); xx++) for (let y = y0; y <= y1; y++) {
        if (y < top) { px(t, xx, y, 46, 32, 20, 255, 0); continue; }
        const f = (xx === x ? 1.15 : 0.92) * (0.9 + rnd() * 0.1);
        px(t, xx, y, c[0] * f, c[1] * f, c[2] * f, 255, 0.7);
      }
      x += w;
    }
  }
});
tile('crafting_top', 1.2, (t, rnd) => {
  paintPlanks(t, rnd, [160, 120, 72]);
  each((x, y) => {
    if (x < 2 || y < 2 || x > 29 || y > 29) px(t, x, y, 96, 66, 38, 255, 0.9);
    else if (x === 11 || x === 20 || y === 11 || y === 20) px(t, x, y, 110, 78, 44, 255, 0.2);
  });
});
tile('crafting_side', 1.2, (t, rnd) => {
  paintPlanks(t, rnd, [150, 114, 70]);
  each((x, y) => { if (y < 3) px(t, x, y, 96, 66, 38, 255, 0.9); });
  line(t, 7, 24, 14, 10, [70, 70, 74], 2); line(t, 10, 9, 17, 12, [120, 120, 126], 2);
  line(t, 20, 26, 25, 9, [92, 62, 34], 2); line(t, 22, 9, 27, 9, [140, 140, 148], 2);
});
tile('iron_block', 0.8, (t, rnd) => paintMetal(t, rnd, [214, 214, 218]));
tile('gold_block', 0.8, (t, rnd) => paintMetal(t, rnd, [246, 206, 64]));
tile('diamond_block', 0.8, (t, rnd) => paintMetal(t, rnd, [104, 222, 214]));
tile('item_stick', 0.4, (t) => { clearTile(t); line(t, 8, 25, 24, 7, [120, 86, 48], 2); line(t, 9, 25, 25, 7, [84, 58, 30]); });
tile('item_coal', 0.4, (t, rnd) => {
  clearTile(t);
  disc(t, 15, 17, 8, [40, 40, 44], rnd); disc(t, 19, 13, 5, [52, 52, 56], rnd);
  px(t, 12, 13, 120, 120, 128); px(t, 18, 10, 110, 110, 118); px(t, 20, 19, 90, 90, 98);
});
tile('item_diamond', 0.4, (t) => {
  clearTile(t);
  each((x, y) => {
    const dx = Math.abs(x - 15.5), dy = y - 6;
    if (dy < 0 || dy > 20) return;
    const w = dy < 6 ? 6 + dy * 1.3 : 14 - (dy - 6);
    if (dx > w) return;
    const glint = (dy < 6 && dx < 2) || (x === 11 && dy < 9);
    const f = 0.8 + (1 - dx / 16) * 0.3;
    px(t, x, y, glint ? 236 : 90 * f, glint ? 255 : 226 * f, glint ? 255 : 220 * f, 255, 0.9);
  });
});
tile('item_meat', 0.4, (t, rnd) => {
  clearTile(t);
  disc(t, 14, 17, 9, [210, 92, 96], rnd);
  for (let i = -6; i < 7; i++) px(t, 14 + i, 17 + Math.round(i * 0.5), 240, 220, 210);
  disc(t, 25, 8, 3, [236, 232, 220], rnd);
  line(t, 22, 11, 19, 14, [236, 232, 220], 2);
});

/* ---------- blocks ---------- */
const BLOCKS = [];
const B = {};
const RENDER = { NONE: 0, CUBE: 1, CROSS: 2, TORCH: 3, LIQUID: 4 };

function defBlock(name, he, en, o) {
  const d = Object.assign({
    id: BLOCKS.length, name, he, en, solid: true, opaque: true, render: RENDER.CUBE, pass: 0,
    tex: null, hardness: 1, drop: undefined, light: 0, tintTop: false, tintAll: false, sway: 0,
    emissive: false, atten: 0, gravity: false, support: false, cullSelf: false, sound: 'stone', creative: true,
  }, o);
  if (d.tex && typeof d.tex === 'string') d.tex = [d.tex, d.tex, d.tex];
  if (d.tex) d.tex = d.tex.map((n) => { if (TILE[n] === undefined) throw new Error('missing tile ' + n); return TILE[n]; });
  if (d.drop === undefined) d.drop = d.id;
  B[name] = d.id;
  BLOCKS.push(d);
  return d;
}
const plant = (tex, extra) => Object.assign({ tex, solid: false, opaque: false, render: RENDER.CROSS, pass: 0, hardness: 0, support: true, sound: 'grass', drop: null }, extra);

defBlock('air', 'אוויר', 'Air', { solid: false, opaque: false, render: RENDER.NONE, hardness: 0, creative: false, drop: null });
defBlock('grass', 'עשב', 'Grass Block', { tex: ['grass_top', 'dirt', 'grass_side'], tintTop: true, hardness: 0.6, sound: 'grass', drop: 'dirt' });
defBlock('dirt', 'אדמה', 'Dirt', { tex: 'dirt', hardness: 0.5, sound: 'dirt' });
defBlock('stone', 'אבן', 'Stone', { tex: 'stone', hardness: 1.5 });
defBlock('cobblestone', 'אבן שבורה', 'Cobblestone', { tex: 'cobblestone', hardness: 2 });
defBlock('mossy_cobble', 'אבן מכוסה טחב', 'Mossy Cobblestone', { tex: 'mossy_cobble', hardness: 2 });
defBlock('sand', 'חול', 'Sand', { tex: 'sand', hardness: 0.5, gravity: true, sound: 'sand' });
defBlock('sandstone', 'אבן חול', 'Sandstone', { tex: ['sandstone_top', 'sandstone_top', 'sandstone_side'], hardness: 0.8 });
defBlock('gravel', 'חצץ', 'Gravel', { tex: 'gravel', hardness: 0.6, gravity: true, sound: 'sand' });
defBlock('bedrock', 'סלע יסוד', 'Bedrock', { tex: 'bedrock', hardness: Infinity, drop: null });
defBlock('oak_log', 'גזע אלון', 'Oak Log', { tex: ['oak_log_top', 'oak_log_top', 'oak_log'], hardness: 1.2, sound: 'wood' });
defBlock('oak_leaves', 'עלי אלון', 'Oak Leaves', { tex: 'oak_leaves', opaque: false, tintAll: true, sway: 1, atten: 1, hardness: 0.2, sound: 'grass', drop: null });
defBlock('birch_log', 'גזע ליבנה', 'Birch Log', { tex: ['birch_log_top', 'birch_log_top', 'birch_log'], hardness: 1.2, sound: 'wood' });
defBlock('birch_leaves', 'עלי ליבנה', 'Birch Leaves', { tex: 'birch_leaves', opaque: false, tintAll: true, sway: 1, atten: 1, hardness: 0.2, sound: 'grass', drop: null });
defBlock('spruce_log', 'גזע אשוח', 'Spruce Log', { tex: ['spruce_log_top', 'spruce_log_top', 'spruce_log'], hardness: 1.2, sound: 'wood' });
defBlock('spruce_leaves', 'עלי אשוח', 'Spruce Leaves', { tex: 'spruce_leaves', opaque: false, sway: 1, atten: 1, hardness: 0.2, sound: 'grass', drop: null });
defBlock('oak_planks', 'קרשי אלון', 'Oak Planks', { tex: 'oak_planks', hardness: 1, sound: 'wood' });
defBlock('spruce_planks', 'קרשי אשוח', 'Spruce Planks', { tex: 'spruce_planks', hardness: 1, sound: 'wood' });
defBlock('glass', 'זכוכית', 'Glass', { tex: 'glass', opaque: false, cullSelf: true, hardness: 0.3, sound: 'glass' });
defBlock('water', 'מים', 'Water', { tex: 'water', solid: false, opaque: false, render: RENDER.LIQUID, pass: 1, atten: 1, hardness: Infinity, drop: null, sound: 'water' });
defBlock('lava', 'לבה', 'Lava', { tex: 'lava', solid: false, opaque: false, render: RENDER.LIQUID, pass: 0, atten: 15, emissive: true, hardness: Infinity, drop: null, light: 12, sound: 'water' });
defBlock('snow_grass', 'עשב מושלג', 'Snowy Grass', { tex: ['snow', 'dirt', 'grass_snow_side'], hardness: 0.6, sound: 'snow', drop: 'dirt' });
defBlock('snow', 'שלג', 'Snow', { tex: 'snow', hardness: 0.3, sound: 'snow' });
defBlock('ice', 'קרח', 'Ice', { tex: 'ice', hardness: 0.5, sound: 'glass' });
defBlock('coal_ore', 'עפרת פחם', 'Coal Ore', { tex: 'coal_ore', hardness: 2, drop: 'coal' });
defBlock('iron_ore', 'עפרת ברזל', 'Iron Ore', { tex: 'iron_ore', hardness: 2.4 });
defBlock('gold_ore', 'עפרת זהב', 'Gold Ore', { tex: 'gold_ore', hardness: 2.4 });
defBlock('diamond_ore', 'עפרת יהלום', 'Diamond Ore', { tex: 'diamond_ore', hardness: 3, drop: 'diamond' });
defBlock('bricks', 'לבנים', 'Bricks', { tex: 'bricks', hardness: 2 });
defBlock('stone_bricks', 'לבני אבן', 'Stone Bricks', { tex: 'stone_bricks', hardness: 1.5 });
defBlock('cactus', 'קקטוס', 'Cactus', { tex: ['cactus_top', 'cactus_top', 'cactus_side'], hardness: 0.4, sound: 'wood', support: true });
defBlock('tall_grass', 'עשב גבוה', 'Tall Grass', plant('tall_grass', { tintAll: true, sway: 2 }));
defBlock('poppy', 'פרג', 'Poppy', plant('poppy', { sway: 2, drop: undefined }));
defBlock('dandelion', 'שן הארי', 'Dandelion', plant('dandelion', { sway: 2, drop: undefined }));
defBlock('dead_bush', 'שיח יבש', 'Dead Bush', plant('dead_bush', { sway: 2 }));
defBlock('torch', 'לפיד', 'Torch', { tex: 'torch', solid: false, opaque: false, render: RENDER.TORCH, hardness: 0, light: 14, emissive: true, support: true, sound: 'wood' });
defBlock('glowstone', 'אבן זוהרת', 'Glowstone', { tex: 'glowstone', hardness: 0.4, light: 15, emissive: true, sound: 'glass' });
defBlock('wool_white', 'צמר לבן', 'White Wool', { tex: 'wool_white', hardness: 0.6, sound: 'cloth' });
defBlock('wool_red', 'צמר אדום', 'Red Wool', { tex: 'wool_red', hardness: 0.6, sound: 'cloth' });
defBlock('wool_blue', 'צמר כחול', 'Blue Wool', { tex: 'wool_blue', hardness: 0.6, sound: 'cloth' });
defBlock('bookshelf', 'כוננית ספרים', 'Bookshelf', { tex: ['oak_planks', 'oak_planks', 'bookshelf'], hardness: 1.2, sound: 'wood' });
defBlock('crafting_table', 'שולחן מלאכה', 'Crafting Table', { tex: ['crafting_top', 'oak_planks', 'crafting_side'], hardness: 1.2, sound: 'wood' });
defBlock('iron_block', 'גוש ברזל', 'Block of Iron', { tex: 'iron_block', hardness: 3 });
defBlock('gold_block', 'גוש זהב', 'Block of Gold', { tex: 'gold_block', hardness: 3 });
defBlock('diamond_block', 'גוש יהלום', 'Block of Diamond', { tex: 'diamond_block', hardness: 3 });

/* Items (non-placeable) live at id >= 200. */
const ITEM_BASE = 200;
const ITEMS = {};
const I = {};
function defItem(name, he, en, tileName, extra) { const id = ITEM_BASE + Object.keys(ITEMS).length; ITEMS[id] = Object.assign({ id, name, he, en, tile: TILE[tileName] }, extra); I[name] = id; }
defItem('stick', 'מקל', 'Stick', 'item_stick');
defItem('coal', 'פחם', 'Coal', 'item_coal');
defItem('diamond', 'יהלום', 'Diamond', 'item_diamond');
defItem('raw_meat', 'בשר', 'Raw Meat', 'item_meat', { food: 4 });

for (const d of BLOCKS) if (typeof d.drop === 'string') d.drop = B[d.drop] !== undefined ? B[d.drop] : I[d.drop];

/* Fast lookup tables for hot loops. */
const NB = BLOCKS.length;
const OPAQUE = new Uint8Array(256), SOLID = new Uint8Array(256), ATTEN = new Uint8Array(256), RENDERT = new Uint8Array(256), LIQUID = new Uint8Array(256);
for (const d of BLOCKS) { OPAQUE[d.id] = d.opaque ? 1 : 0; SOLID[d.id] = d.solid ? 1 : 0; ATTEN[d.id] = d.atten; RENDERT[d.id] = d.render; LIQUID[d.id] = d.render === RENDER.LIQUID ? 1 : 0; }

const isBlock = (id) => id > 0 && id < NB;
const itemName = (id, lang) => { const d = isBlock(id) ? BLOCKS[id] : ITEMS[id]; return d ? (lang === 'en' ? d.en : d.he) : ''; };
const itemTile = (id) => (isBlock(id) ? BLOCKS[id].tex[2] : ITEMS[id] ? ITEMS[id].tile : 0);

const CREATIVE_LIST = BLOCKS.filter((d) => d.creative && d.id !== B.bedrock).map((d) => d.id).concat([B.bedrock]);

/* Survival recipes: ingredient alternatives are listed as arrays of ids. */
const RECIPES = [
  { out: [B.oak_planks, 4], need: [[[B.oak_log, B.birch_log], 1]] },
  { out: [B.spruce_planks, 4], need: [[[B.spruce_log], 1]] },
  { out: [I.stick, 4], need: [[[B.oak_planks, B.spruce_planks], 2]] },
  { out: [B.torch, 4], need: [[[I.coal], 1], [[I.stick], 1]] },
  { out: [B.crafting_table, 1], need: [[[B.oak_planks, B.spruce_planks], 4]] },
  { out: [B.glass, 2], need: [[[B.sand], 2], [[I.coal], 1]] },
  { out: [B.stone, 2], need: [[[B.cobblestone], 2], [[I.coal], 1]] },
  { out: [B.stone_bricks, 4], need: [[[B.stone], 4]] },
  { out: [B.sandstone, 1], need: [[[B.sand], 4]] },
  { out: [B.bricks, 2], need: [[[B.dirt], 2], [[B.sand], 1], [[I.coal], 1]] },
  { out: [B.bookshelf, 1], need: [[[B.oak_planks], 6], [[I.stick], 2]] },
  { out: [B.glowstone, 1], need: [[[B.torch], 4], [[B.glass], 1]] },
  { out: [B.wool_red, 1], need: [[[B.wool_white], 1], [[B.poppy], 1]] },
  { out: [B.wool_blue, 1], need: [[[B.wool_white], 1], [[I.diamond], 1]] },
  { out: [B.iron_block, 1], need: [[[B.iron_ore], 4], [[I.coal], 2]] },
  { out: [B.gold_block, 1], need: [[[B.gold_ore], 4], [[I.coal], 2]] },
  { out: [B.diamond_block, 1], need: [[[I.diamond], 9]] },
];

/* ---------- isometric icons for the HUD ---------- */
const tileCanvasCache = new Map();
function tileCanvas(layer, mul) {
  const key = layer + ':' + (mul || '');
  if (tileCanvasCache.has(key)) return tileCanvasCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = TS;
  const ctx = c.getContext('2d'), img = ctx.createImageData(TS, TS);
  img.data.set(TILES[layer].rgba);
  if (mul) for (let i = 0; i < img.data.length; i += 4) { img.data[i] *= mul[0]; img.data[i + 1] *= mul[1]; img.data[i + 2] *= mul[2]; }
  ctx.putImageData(img, 0, 0);
  tileCanvasCache.set(key, c);
  return c;
}
const ICON_TINT = [0.95, 1.08, 0.82];
const iconCache = new Map();
function itemIcon(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const d = isBlock(id) ? BLOCKS[id] : null;
  if (!d || d.render !== RENDER.CUBE && d.render !== RENDER.LIQUID) {
    const layer = d ? d.tex[2] : ITEMS[id].tile;
    ctx.drawImage(tileCanvas(layer, d && d.tintAll ? ICON_TINT : null), 4, 4, 56, 56);
  } else {
    const faces = [
      { layer: d.tex[0], m: [30 / 32, 15 / 32, -30 / 32, 15 / 32, 32, 2], dark: 0, tint: d.tintTop || d.tintAll },
      { layer: d.tex[2], m: [30 / 32, 15 / 32, 0, 30 / 32, 2, 17], dark: 0.28, tint: d.tintAll },
      { layer: d.tex[2], m: [30 / 32, -15 / 32, 0, 30 / 32, 32, 32], dark: 0.45, tint: d.tintAll },
    ];
    for (const f of faces) {
      ctx.setTransform(...f.m);
      ctx.drawImage(tileCanvas(f.layer, f.tint ? ICON_TINT : null), 0, 0);
      if (f.dark) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(0,0,0,${f.dark})`;
        ctx.fillRect(0, 0, TS, TS);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const url = c.toDataURL();
  iconCache.set(id, url);
  return url;
}
