/**
 * Procedural poster artwork — one generator per motif.
 *
 * Every generator draws into a clipped "plate" rectangle using a small,
 * curated colour set and a seeded rng, so the same input always produces the
 * same composition. Inputs shape the art the same way for every motif:
 *
 *   weirdness 1 → calm: one accent, few elements, straight, lots of air
 *   weirdness 2 → a second accent, a little tilt / overlap
 *   weirdness 3 → three accents, rotation, density, frame-filling energy
 *   dir (first choice) → where the visual weight sits (-1 left, 1 right, 0 centred / symmetric)
 *   texture (alternates used) → engraving hatch + worn specks (see drawTexture)
 *   kind → a small narrative overlay (reticle, construction lines, trail…)
 *   variant (hash of the choice labels) → proportions and placement
 */
import type { Kind, Motif, Weirdness } from '../../shared/types.ts';
import { mix, rgba, warmest } from './color.ts';
import { chance, int, pick, range, shuffle, signedTri, type Rng } from './prng.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Pt {
  x: number;
  y: number;
}

export interface ArtColors {
  /** Field colour of the plate. */
  plate: string;
  /** A deeper plate tone for grounds and shadows. */
  shade: string;
  primary: string;
  secondary: string;
  tertiary: string;
  /** Hairlines and outlines — the colour with the most contrast against the plate. */
  line: string;
  /** True when the plate is light (dark marks on light paper). */
  light: boolean;
}

export interface MotifContext {
  rng: Rng;
  colors: ArtColors;
  weirdness: Weirdness;
  /** Composition direction from the first choice: -1 weighted left, 1 weighted right, 0 centred. */
  dir: -1 | 0 | 1;
  /** 0 … 1 surface wear, from the number of alternative challenges taken. */
  texture: number;
  kind: Kind;
  /** 0 … 1 stable variation derived from the choice labels. */
  variant: number;
  /** Pixel scale: poster width / 1080. */
  s: number;
}

/** Where the composition's attention sits — used by the kind overlay. */
export interface Focus {
  x: number;
  y: number;
  r: number;
}

export type MotifDrawer = (ctx: CanvasRenderingContext2D, r: Rect, m: MotifContext) => Focus;

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

// ── shared helpers ─────────────────────────────────────────────────────

function palette(m: MotifContext): string[] {
  const c = m.colors;
  if (m.weirdness === 1) return [c.primary];
  if (m.weirdness === 2) return [c.primary, c.secondary];
  return [c.primary, c.secondary, c.tertiary];
}

function disk(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  if (!(r > 0)) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

function ring(ctx: Ctx, x: number, y: number, r: number, color: string, width: number, dash: number[] = []): void {
  if (!(r > 0)) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
}

function polyPath(ctx: Ctx, pts: readonly Pt[]): void {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function rotateAbout(ctx: Ctx, cx: number, cy: number, angle: number): void {
  if (!angle) return;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-cx, -cy);
}

function centroid(pts: readonly Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

function clipRect(ctx: Ctx, r: Rect): void {
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
}

/** Tiny star dust, kept clear of a protected circle. */
function starDust(ctx: Ctx, r: Rect, m: MotifContext, count: number, avoid: Focus | null, maxY = r.y + r.h): void {
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const x = r.x + m.rng() * r.w;
    const y = r.y + m.rng() * (maxY - r.y);
    const sr = m.s * range(m.rng, 0.9, m.weirdness === 3 ? 2.5 : 1.9);
    if (avoid && Math.hypot(x - avoid.x, y - avoid.y) < avoid.r) continue;
    ctx.moveTo(x + sr, y);
    ctx.arc(x, y, sr, 0, TAU);
  }
  ctx.fillStyle = rgba(m.colors.line, m.weirdness === 1 ? 0.38 : 0.52);
  ctx.fill();
}

// ── orbits: a sun, its orbits and a few planets ─────────────────────────

function orbits(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  const minDim = Math.min(r.w, r.h);
  const cx = r.x + r.w * (0.5 + m.dir * 0.19);
  const cy = r.y + r.h * (0.5 + (m.variant - 0.5) * 0.12);
  const sunR = minDim * (W === 1 ? 0.15 : W === 2 ? 0.17 : 0.19);
  const lean = m.dir === 0 ? (m.variant < 0.5 ? -1 : 1) : -m.dir;
  const tilt = W === 1 ? 0 : lean * (W === 2 ? range(rng, 0.14, 0.24) : range(rng, 0.3, 0.44));
  const squash = W === 1 ? 1 : W === 2 ? range(rng, 0.5, 0.6) : range(rng, 0.3, 0.4);
  const ringCount = W === 1 ? 4 : W === 2 ? 6 : 8;
  const growth = W === 1 ? 1.42 : W === 2 ? 1.3 : 1.24;
  const radii: number[] = [];
  let rr = sunR * (W === 1 ? 1.8 : 1.6);
  for (let i = 0; i < ringCount; i++) {
    radii.push(rr);
    rr *= growth * range(rng, 0.97, 1.03);
  }

  starDust(ctx, r, m, W === 1 ? 12 : W === 2 ? 28 : 46, { x: cx, y: cy, r: sunR * 1.5 });

  const hero = W === 1 ? -1 : int(rng, 0, 1);
  const strokeRing = (i: number, a0: number, a1: number) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, radii[i], radii[i] * squash, tilt, a0, a1);
    ctx.strokeStyle = i === hero ? c.primary : rgba(c.line, Math.max(0.22, 0.62 - i * 0.045));
    ctx.lineWidth = (i === hero ? 3.2 : 1.6) * s;
    ctx.setLineDash(W === 3 && i % 3 === 2 ? [1.5 * s, 7 * s] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  interface Planet {
    x: number;
    y: number;
    r: number;
    color: string;
    front: boolean;
    ringed: boolean;
  }
  const planetCount = W === 1 ? 1 : W === 2 ? 3 : 5;
  const ringPool = shuffle(
    rng,
    radii.map((_, i) => i).filter((i) => i < ringCount - 1),
  ).slice(0, planetCount);
  const towardCentre = m.dir > 0 ? Math.PI : m.dir < 0 ? 0 : -Math.PI / 2;
  const planetColors = W === 1 ? [c.line] : W === 2 ? [c.secondary, c.line] : [c.secondary, c.tertiary, c.line];
  const planets: Planet[] = [];
  ringPool.forEach((i, k) => {
    const pr = s * range(rng, 9, 16) * (1 + i * 0.1);
    const pad = pr * (W === 3 && k === 0 ? 2.3 : 1) + 12 * s;
    // Planets live fully inside the frame — try a few positions along the orbit.
    for (let attempt = 0; attempt < 12; attempt++) {
      const theta = towardCentre + signedTri(rng) * (1.1 + attempt * 0.3) + (k % 2 === 1 ? Math.PI * 0.6 : 0);
      const ex = radii[i] * Math.cos(theta);
      const ey = radii[i] * squash * Math.sin(theta);
      const x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
      const y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
      if (x < r.x + pad || x > r.x + r.w - pad || y < r.y + pad || y > r.y + r.h - pad) continue;
      planets.push({ x, y, r: pr, color: planetColors[k % planetColors.length], front: squash === 1 || Math.sin(theta) > 0, ringed: W === 3 && k === 0 });
      break;
    }
  });
  const drawPlanet = (p: Planet) => {
    disk(ctx, p.x, p.y, p.r + 5 * s, c.plate);
    disk(ctx, p.x, p.y, p.r, p.color);
    if (p.ringed) {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r * 2.1, p.r * 0.5, tilt - 0.35, 0, TAU);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.2 * s;
      ctx.stroke();
    }
  };
  const drawSun = () => {
    disk(ctx, cx, cy, sunR, c.primary);
    if (W === 1) {
      ring(ctx, cx, cy, sunR * 1.17, rgba(c.primary, 0.5), 1.5 * s);
    } else if (W === 2) {
      // Partial eclipse: a plate-coloured moon leaves a crescent, rimmed in the second accent.
      const ox = lean * sunR * 0.42;
      const oy = -sunR * 0.2;
      disk(ctx, cx + ox, cy + oy, sunR * 0.9, c.plate);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, TAU);
      ctx.clip();
      ring(ctx, cx + ox, cy + oy, sunR * 0.9, c.secondary, 2.4 * s);
      ctx.restore();
    } else {
      // Retro sunset sun: bands cut out of its lower half.
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, TAU);
      ctx.clip();
      ctx.fillStyle = c.plate;
      for (let k = 0; k < 5; k++) {
        const y = cy + sunR * (0.08 + k * 0.19);
        ctx.fillRect(cx - sunR, y, sunR * 2, sunR * (0.035 + k * 0.032));
      }
      ctx.restore();
    }
  };

  if (squash < 1) {
    for (let i = 0; i < ringCount; i++) strokeRing(i, Math.PI, TAU);
    for (const p of planets) if (!p.front) drawPlanet(p);
    drawSun();
    for (let i = 0; i < ringCount; i++) strokeRing(i, 0, Math.PI);
    for (const p of planets) if (p.front) drawPlanet(p);
  } else {
    for (let i = 0; i < ringCount; i++) strokeRing(i, 0, TAU);
    drawSun();
    for (const p of planets) drawPlanet(p);
  }
  return { x: cx, y: cy, r: sunR };
}

// ── grid: a Swiss/Bauhaus tile system ──────────────────────────────────

type TileKind = 'quarter' | 'half' | 'circle' | 'square' | 'tri' | 'ring' | 'bars' | 'dot';

function drawTile(ctx: Ctx, x: number, y: number, size: number, kind: TileKind, rot: number, color: string, mirror: boolean): void {
  const h = size / 2;
  ctx.save();
  ctx.translate(x + h, y + h);
  if (mirror) ctx.scale(-1, 1);
  ctx.rotate((rot % 4) * (Math.PI / 2));
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  switch (kind) {
    case 'quarter':
      ctx.moveTo(-h, -h);
      ctx.arc(-h, -h, size, 0, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'half':
      ctx.moveTo(-h, h);
      ctx.arc(0, h, h, Math.PI, TAU);
      ctx.closePath();
      ctx.fill();
      break;
    case 'circle':
      ctx.arc(0, 0, h * 0.84, 0, TAU);
      ctx.fill();
      break;
    case 'square':
      ctx.rect(-h, -h, size, size);
      ctx.fill();
      break;
    case 'tri':
      ctx.moveTo(-h, -h);
      ctx.lineTo(h, -h);
      ctx.lineTo(-h, h);
      ctx.closePath();
      ctx.fill();
      break;
    case 'ring':
      ctx.arc(0, 0, h * 0.58, 0, TAU);
      ctx.lineWidth = size * 0.17;
      ctx.stroke();
      break;
    case 'bars':
      for (let k = 0; k < 3; k++) ctx.rect(-h, -h + size * (0.08 + k * 0.32), size, size * 0.18);
      ctx.fill();
      break;
    case 'dot':
      ctx.arc(0, 0, h * 0.26, 0, TAU);
      ctx.fill();
      break;
  }
  ctx.restore();
}

function grid(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  let cols = W === 1 ? 4 : W === 2 ? 5 : 6;
  if (m.dir === 0 && cols % 2 === 1) cols += 1;
  const cell = r.w / cols;
  const rows = Math.max(3, Math.floor(r.h / cell));
  // The grid hangs from the top edge; a partial last row is cropped by the frame (tiles use full rows only).
  const gy = r.y;
  const angle = W === 3 ? (m.dir === 0 ? 1 : m.dir) * range(rng, 0.045, 0.075) : 0;

  ctx.save();
  if (angle) {
    rotateAbout(ctx, r.x + r.w / 2, r.y + r.h / 2, angle);
  }
  const ext = angle ? 2 : 1;

  // Background rhythm (deeper cells) for the louder versions.
  if (W >= 2) {
    const n = W === 2 ? 3 : 6;
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = c.shade;
      ctx.fillRect(r.x + int(rng, 0, cols - 1) * cell, gy + int(rng, 0, rows - 1) * cell, cell, cell);
    }
  }

  // Hairline grid, extended past the plate so a rotated grid still covers it.
  ctx.beginPath();
  for (let i = -ext; i <= cols + ext; i++) {
    const x = r.x + i * cell;
    ctx.moveTo(x, gy - (ext + 1) * cell);
    ctx.lineTo(x, gy + (rows + ext + 1) * cell);
  }
  for (let j = -ext; j <= rows + ext; j++) {
    const y = gy + j * cell;
    ctx.moveTo(r.x - (ext + 1) * cell, y);
    ctx.lineTo(r.x + (cols + ext + 1) * cell, y);
  }
  ctx.strokeStyle = rgba(c.line, W === 1 ? 0.13 : 0.17);
  ctx.lineWidth = Math.max(1, s);
  ctx.stroke();

  // Registration crosses on the intersections.
  if (W >= 2) {
    const arm = 5 * s;
    ctx.beginPath();
    for (let i = 1; i < cols; i++) {
      for (let j = 1; j < rows; j++) {
        const x = r.x + i * cell;
        const y = gy + j * cell;
        ctx.moveTo(x - arm, y);
        ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm);
        ctx.lineTo(x, y + arm);
      }
    }
    ctx.strokeStyle = rgba(c.line, 0.45);
    ctx.lineWidth = Math.max(1, 1.2 * s);
    ctx.stroke();
  }

  const occupied = new Set<string>();
  const key = (col: number, row: number) => `${col},${row}`;
  const heroCol = m.dir < 0 ? 0 : m.dir > 0 ? cols - 2 : cols / 2 - 1;
  const heroRow = Math.min(rows - 2, Math.max(0, Math.round((rows - 2) * (0.18 + 0.4 * m.variant))));
  for (let dc = 0; dc < 2; dc++) for (let dr = 0; dr < 2; dr++) occupied.add(key(heroCol + dc, heroRow + dr));

  interface Tile {
    col: number;
    row: number;
    kind: TileKind;
    rot: number;
    color: string;
  }
  const kinds: TileKind[] =
    W === 1
      ? ['circle', 'quarter', 'dot', 'half']
      : W === 2
        ? ['circle', 'quarter', 'half', 'tri', 'bars', 'dot', 'ring']
        : ['circle', 'quarter', 'half', 'tri', 'bars', 'dot', 'ring', 'square'];
  const colors = W === 1 ? [c.primary, c.line] : W === 2 ? [c.primary, c.secondary, c.line] : [c.primary, c.secondary, c.tertiary, c.line];
  const count = W === 1 ? 3 : W === 2 ? 7 : 12;
  const half = m.dir === 0;
  const maxCol = half ? cols / 2 - 1 : cols - 1;
  const flow = m.dir > 0 ? -1 : 1;
  let col = half ? heroCol - 1 : m.dir > 0 ? heroCol - 1 : heroCol + 2;
  let row = heroRow + int(rng, 0, 1);
  const tiles: Tile[] = [];
  for (let guard = 0; tiles.length < count && guard < 400; guard++) {
    if (col >= 0 && col <= maxCol && row >= 0 && row < rows && !occupied.has(key(col, row))) {
      occupied.add(key(col, row));
      const kind = pick(rng, kinds);
      const lineOnly = kind === 'dot' || kind === 'bars' || kind === 'ring';
      tiles.push({ col, row, kind, rot: int(rng, 0, 3), color: lineOnly && chance(rng, 0.6) ? c.line : pick(rng, colors) });
    }
    const roll = rng();
    if (roll < 0.42) col += half ? -1 : flow;
    else if (roll < 0.76) row += 1;
    else if (roll < 0.88) row -= 1;
    else col -= half ? -1 : flow;
    col = Math.max(0, Math.min(maxCol, col));
    row = Math.max(0, Math.min(rows - 1, row));
  }

  for (const t of tiles) {
    drawTile(ctx, r.x + t.col * cell, gy + t.row * cell, cell, t.kind, t.rot, t.color, false);
    if (half) drawTile(ctx, r.x + (cols - 1 - t.col) * cell, gy + t.row * cell, cell, t.kind, t.rot, t.color, true);
  }

  // Hero: a big quarter circle (or a full circle when centred), layered at higher weirdness.
  const hx = r.x + heroCol * cell;
  const hy = gy + heroRow * cell;
  const hs = cell * 2;
  if (half) {
    disk(ctx, hx + hs / 2, hy + hs / 2, hs * 0.48, c.primary);
    if (W >= 2) disk(ctx, hx + hs / 2, hy + hs / 2, hs * 0.2, c.secondary);
    if (W === 3) ring(ctx, hx + hs / 2, hy + hs / 2, hs * 0.34, c.tertiary, cell * 0.08);
  } else {
    drawTile(ctx, hx, hy, hs, 'quarter', 0, c.primary, m.dir > 0);
    const ax = m.dir > 0 ? hx + hs : hx;
    if (W >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, hy, hs * 0.5, 0, TAU);
      ctx.clip();
      ctx.fillStyle = c.secondary;
      ctx.fillRect(hx, hy, hs, hs);
      ctx.restore();
    }
    if (W === 3) ring(ctx, ax, hy, hs * 0.74, c.tertiary, cell * 0.07);
  }
  ctx.restore();
  return { x: hx + hs / 2, y: hy + hs / 2, r: cell };
}

// ── rays: a rising sun over water ──────────────────────────────────────

function rays(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  const minDim = Math.min(r.w, r.h);
  const horizon = r.y + r.h * (W === 1 ? 0.7 : W === 2 ? 0.68 : 0.64);
  const ox = r.x + r.w * (0.5 + m.dir * 0.27);
  const sunR = minDim * (W === 1 ? 0.13 : W === 2 ? 0.15 : 0.17);
  const oy = horizon + sunR * 0.22;
  const n = W === 1 ? 18 : W === 2 ? 26 : 38;
  const reach = Math.hypot(r.w, r.h) * 1.3;
  const cols = palette(m);
  const weights = Array.from({ length: n }, () => (W === 1 ? 1 : range(rng, 0.55, 1.45)));
  const total = weights.reduce((a, b) => a + b, 0);
  const fill = W === 1 ? 0.4 : W === 2 ? 0.48 : 0.56;
  const sunColor = warmest(W === 1 ? [c.primary, c.secondary] : [c.primary, c.secondary, c.tertiary]);

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, horizon - r.y);
  ctx.clip();
  const glow = ctx.createRadialGradient(ox, oy, sunR, ox, oy, reach * 0.6);
  glow.addColorStop(0, rgba(c.primary, 0.95));
  glow.addColorStop(1, rgba(c.primary, W === 1 ? 0.06 : 0.2));
  const span = Math.PI + 0.3;
  let a = Math.PI - 0.15 + (W === 1 ? 0 : signedTri(rng) * 0.05);
  for (let i = 0; i < n; i++) {
    const wa = (weights[i] / total) * span;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, reach, a, a + wa * fill);
    ctx.closePath();
    ctx.fillStyle = W === 3 ? cols[i % cols.length] : W === 2 && i % 4 === 3 ? c.secondary : glow;
    ctx.fill();
    a += wa;
  }
  for (const k of W === 1 ? [1.4] : [1.32, 1.68]) ring(ctx, ox, oy, sunR * k, c.plate, 7 * s);
  disk(ctx, ox, oy, sunR, sunColor);
  if (W === 3) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, sunR, 0, TAU);
    ctx.clip();
    ctx.fillStyle = c.plate;
    for (let k = 0; k < 4; k++) ctx.fillRect(ox - sunR, oy - sunR * (0.55 - k * 0.15), sunR * 2, sunR * (0.03 + k * 0.025));
    ctx.restore();
  }
  ctx.restore();

  // The water.
  const depth = r.y + r.h - horizon;
  ctx.fillStyle = c.shade;
  ctx.fillRect(r.x, horizon, r.w, depth);
  const K = W === 1 ? 7 : W === 2 ? 10 : 13;
  for (let k = 1; k <= K; k++) {
    const t = k / K;
    const y = horizon + depth * t ** 1.8;
    ctx.fillStyle = rgba(c.primary, 0.12 + 0.2 * t);
    ctx.fillRect(r.x, y - (0.4 + 1.5 * t) * s, r.w, (0.8 + 3 * t) * s);
  }
  for (let k = 0; k < 9; k++) {
    const t = (k + 0.5) / 9;
    const y = horizon + depth * 0.9 * t ** 1.35 + 4 * s;
    const half = sunR * (1.05 - t * 0.68) * range(rng, 0.72, 1.05);
    ctx.fillStyle = rgba(sunColor, 0.78 - t * 0.45);
    ctx.fillRect(ox - half, y, half * 2, s * (2 + 4.5 * t));
  }
  ctx.fillStyle = rgba(c.line, 0.6);
  ctx.fillRect(r.x, horizon - 0.75 * s, r.w, 1.5 * s);
  return { x: ox, y: horizon - sunR * 0.55, r: sunR };
}

// ── waves: a ridgeline (stacked, occluding lines) under a low sun ───────

function waves(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  const lines = W === 1 ? 13 : W === 2 ? 19 : 26;
  const top = r.y + r.h * 0.38;
  const bottom = r.y + r.h * 1.0;
  const gap = (bottom - top) / (lines - 1);
  const fx = r.x + r.w * (0.5 + m.dir * 0.2);
  const sigma = r.w * (W === 1 ? 0.15 : W === 2 ? 0.19 : 0.24);
  const amp = gap * (W === 1 ? 2.8 : W === 2 ? 4 : 5.4);
  const minDim = Math.min(r.w, r.h);
  const sunR = minDim * (W === 1 ? 0.13 : 0.16);
  const sunX = r.x + r.w * (0.5 - m.dir * 0.21);
  const sunY = top - sunR * 0.1;

  starDust(ctx, r, m, W === 1 ? 10 : W === 2 ? 22 : 36, { x: sunX, y: sunY, r: sunR * 1.4 }, top);
  const sun = warmest([...palette(m), c.secondary]);
  if (W === 1) {
    disk(ctx, sunX, sunY, sunR, rgba(sun, 0.16));
    ring(ctx, sunX, sunY, sunR, sun, 3.4 * s);
  } else disk(ctx, sunX, sunY, sunR, sun);

  // Atmospheric depth: far ridges sit close to the sky, near ridges sink into shade.
  const far = mix(c.plate, c.line, c.light ? 0.03 : 0.07);
  const near = c.light ? mix(c.plate, c.line, 0.16) : c.shade;
  const bands =
    W === 3 ? [mix(c.plate, c.primary, 0.92), mix(c.plate, c.secondary, 0.86), mix(c.plate, c.tertiary, 0.7), c.plate] : null;
  const glowFrom = Math.floor(lines * 0.32);
  const glowTo = Math.floor(lines * 0.52);
  const step = 4 * s;
  const pts: number[] = [];
  for (let i = 0; i < lines; i++) {
    const baseY = top + i * gap;
    const f1 = (range(rng, 2, 4.5) * TAU) / r.w;
    const f2 = (range(rng, 5, 9) * TAU) / r.w;
    const f3 = (range(rng, 11, 17) * TAU) / r.w;
    const p1 = rng() * TAU;
    const p2 = rng() * TAU;
    const p3 = rng() * TAU;
    const lineAmp = amp * range(rng, 0.75, 1.15) * (0.75 + 0.5 * Math.sin((i / lines) * Math.PI));
    const shift = signedTri(rng) * sigma * 0.35;
    pts.length = 0;
    for (let x = r.x - step; x <= r.x + r.w + step; x += step) {
      const d = (x - fx - shift) / sigma;
      const env = Math.exp(-d * d * 0.5);
      const noise = 0.5 + 0.5 * (0.55 * Math.sin(f1 * x + p1) + 0.3 * Math.sin(f2 * x + p2) + 0.15 * Math.sin(f3 * x + p3));
      pts.push(x, baseY - lineAmp * (0.035 + env * noise ** 1.8));
    }
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
    ctx.lineTo(r.x + r.w + step, r.y + r.h + 10 * s);
    ctx.lineTo(r.x - step, r.y + r.h + 10 * s);
    ctx.closePath();
    ctx.fillStyle = bands ? bands[i % bands.length] : mix(far, near, (i / (lines - 1)) ** 0.9);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
    ctx.strokeStyle = W === 2 && i >= glowFrom && i <= glowTo ? c.primary : rgba(c.line, 0.9);
    ctx.lineWidth = s * (W === 1 ? 3 : W === 2 ? 2.4 : 2);
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  return { x: fx, y: top + (bottom - top) * 0.25, r: sigma * 0.8 };
}

// ── shards: a disc, shattered from an impact point ─────────────────────

function shards(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  const minDim = Math.min(r.w, r.h);
  const cx = r.x + r.w * (0.5 + m.dir * 0.15);
  const cy = r.y + r.h * 0.5;
  const R = minDim * 0.35;
  const px = cx - m.dir * R * 0.22 + signedTri(rng) * R * 0.12;
  const py = cy - R * 0.12 + signedTri(rng) * R * 0.12;
  const k = W === 1 ? 7 : W === 2 ? 10 : 13;
  const base = rng() * TAU;
  const angles = Array.from({ length: k }, (_, i) => base + (i + signedTri(rng) * 0.3) * (TAU / k));
  const far = Math.hypot(r.w, r.h);
  const radii =
    W === 1 ? [R * 0.5, R * 1.08, far] : W === 2 ? [R * 0.34, R * 0.74, R * 1.14, far] : [R * 0.24, R * 0.52, R * 0.84, R * 1.2, far];
  const verts: Pt[][] = radii.map((rad, j) =>
    angles.map((a) => {
      const jit = j === radii.length - 1 ? 1 : 1 + signedTri(rng) * 0.14;
      return { x: px + Math.cos(a) * rad * jit, y: py + Math.sin(a) * rad * jit };
    }),
  );
  const cells: { pts: Pt[]; ring: number }[] = [];
  for (let i = 0; i < k; i++) {
    const i2 = (i + 1) % k;
    cells.push({ pts: [{ x: px, y: py }, verts[0][i], verts[0][i2]], ring: 0 });
    for (let j = 0; j < radii.length - 1; j++) {
      cells.push({ pts: [verts[j][i], verts[j][i2], verts[j + 1][i2], verts[j + 1][i]], ring: j + 1 });
    }
  }
  const pushBase = s * (W === 1 ? 2.6 : W === 2 ? 7 : 13);
  const third = { x: cx + R * 0.28 * (m.dir === 0 ? 1 : -m.dir), y: cy - R * 0.22 };
  for (const cell of cells) {
    const cen = centroid(cell.pts);
    let dx = cen.x - px;
    let dy = cen.y - py;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    const push = pushBase * (0.55 + 0.45 * cell.ring) * range(rng, 0.6, 1.3);
    const rot = W === 3 ? signedTri(rng) * 0.05 : W === 2 ? signedTri(rng) * 0.012 : 0;
    const tint = rng();
    const outer = cell.ring === radii.length - 1;
    ctx.save();
    ctx.translate(dx * push, dy * push);
    rotateAbout(ctx, cen.x, cen.y, rot);
    ctx.beginPath();
    polyPath(ctx, cell.pts);
    ctx.clip();
    ctx.fillStyle = c.plate;
    ctx.fill();
    if (!outer && tint < 0.32) {
      ctx.fillStyle = rgba(c.shade, 0.45);
      ctx.fill();
    } else if (!outer && tint > 0.86) {
      ctx.fillStyle = rgba(c.line, 0.05);
      ctx.fill();
    }
    disk(ctx, cx, cy, R, c.primary);
    if (W >= 2) ring(ctx, cx, cy, R * 0.64, c.secondary, R * 0.07);
    if (W === 3) disk(ctx, third.x, third.y, R * 0.2, c.tertiary);
    if (!outer && tint < 0.2) {
      // a darker facet across the disc reads as broken glass
      ctx.beginPath();
      polyPath(ctx, cell.pts);
      ctx.fillStyle = rgba(c.shade, 0.32);
      ctx.fill();
    }
    ctx.beginPath();
    polyPath(ctx, cell.pts);
    ctx.strokeStyle = rgba(c.line, outer ? 0.14 : W === 1 ? 0.22 : 0.28);
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.restore();
  }
  ring(ctx, px, py, 6 * s, rgba(c.line, 0.85), 1.4 * s);
  disk(ctx, px, py, 2 * s, c.line);
  return { x: cx, y: cy, r: R };
}

// ── stairs: an extruded staircase with a lit door at the top ────────────

/** Draws an oblique extrusion of `poly` along `d`: visible side faces first, then the front face. */
function extrude(ctx: Ctx, poly: readonly Pt[], d: Pt, front: string, top: string, side: string): void {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    area += p.x * q.y - q.x * p.y;
  }
  const clockwise = area > 0; // y-down screen space
  const faces: { pts: Pt[]; color: string }[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const ex = q.x - p.x;
    const ey = q.y - p.y;
    const nx = clockwise ? ey : -ey;
    const ny = clockwise ? -ex : ex;
    if (nx * d.x + ny * d.y <= 0) continue;
    const horizontal = Math.abs(ey) < Math.abs(ex);
    faces.push({
      pts: [p, q, { x: q.x + d.x, y: q.y + d.y }, { x: p.x + d.x, y: p.y + d.y }],
      color: horizontal ? top : side,
    });
  }
  ctx.lineJoin = 'round';
  for (const f of faces) {
    ctx.beginPath();
    polyPath(ctx, f.pts);
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.strokeStyle = f.color; // hides hairline seams between faces
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.beginPath();
  polyPath(ctx, poly);
  ctx.fillStyle = front;
  ctx.fill();
  ctx.strokeStyle = front;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function stairProfile(x0: number, floorY: number, n: number, tw: number, rh: number, topW: number, both: boolean): Pt[] {
  const pts: Pt[] = [{ x: x0, y: floorY }];
  let x = x0;
  for (let i = 0; i < n; i++) {
    const y = floorY - (i + 1) * rh;
    pts.push({ x, y });
    x += i === n - 1 ? topW : tw;
    pts.push({ x, y });
  }
  if (both) {
    for (let i = n - 1; i > 0; i--) {
      const y = floorY - i * rh;
      pts.push({ x, y });
      x += tw;
      pts.push({ x, y });
    }
  }
  pts.push({ x, y: floorY });
  return pts;
}

function archPath(ctx: Ctx, x: number, baseY: number, w: number, h: number): void {
  const rad = w / 2;
  const straight = Math.max(0, h - rad);
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - straight);
  ctx.arc(x + rad, baseY - straight, rad, Math.PI, TAU);
  ctx.lineTo(x + w, baseY);
  ctx.closePath();
}

function stairs(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { colors: c, s } = m;
  const W = m.weirdness;
  const asc = m.dir;
  const n = W === 1 ? 5 : W === 2 ? 7 : 9;
  const minDim = Math.min(r.w, r.h);
  const floorY = r.y + r.h * 0.875;
  const rh = (r.h * 0.54) / n;
  const tilt = W === 3 ? (asc === 0 ? 1 : asc) * -0.045 : 0;
  const midX = r.x + r.w / 2;
  const mirrorX = (pts: Pt[]) => pts.map((p) => ({ x: 2 * midX - p.x, y: p.y }));
  const topTone = (col: string) => mix(col, '#ffffff', c.light ? 0.3 : 0.26);
  const sideTone = (col: string) => mix(col, '#000000', 0.32);

  ctx.save();
  rotateAbout(ctx, midX, r.y + r.h / 2, tilt);
  ctx.fillStyle = c.shade;
  ctx.fillRect(r.x - r.w * 0.2, floorY, r.w * 1.4, r.h);

  // The open side of the sky (opposite the climb) holds the moon — or, at full weirdness, the twist.
  const openLeft = asc === 0 ? m.variant < 0.5 : asc > 0;
  const moonX = openLeft ? r.x + r.w * 0.22 : r.x + r.w * 0.78;
  const moonY = r.y + r.h * 0.2;
  const moonR = minDim * 0.075;
  starDust(ctx, r, m, W === 1 ? 8 : W === 2 ? 18 : 30, { x: moonX, y: moonY, r: moonR * 2 }, floorY - r.h * 0.5);
  if (W === 1) ring(ctx, moonX, moonY, moonR, c.line, 2.2 * s);
  else if (W === 2) disk(ctx, moonX, moonY, moonR, c.line);
  else {
    // An upside-down flight hanging from the top edge: the plot twist, literally.
    const n2 = 4;
    const tw2 = (r.w * 0.3) / (n2 + 0.6);
    const rh2 = rh * 0.9;
    const yF = r.y - 4 * s;
    const left2 = r.x + r.w * 0.07;
    let hanging = stairProfile(left2, yF, n2, tw2, rh2, tw2 * 1.6, false).map((p) => ({ x: p.x, y: 2 * yF - p.y }));
    if (!openLeft) hanging = mirrorX(hanging);
    const tone = mix(c.tertiary, c.plate, 0.42);
    extrude(ctx, hanging, { x: (openLeft ? 1 : -1) * rh2 * 0.62, y: -rh2 * 0.5 }, tone, topTone(tone), sideTone(tone));
  }

  const width = r.w * (asc === 0 ? 0.72 : 0.6);
  const tw = asc === 0 ? width / (2 * n) : width / (n + 0.6);
  const topW = asc === 0 ? tw * 2 : tw * 1.6;
  const x0 = asc === 0 ? midX - width / 2 : r.x + r.w * 0.12;
  let profile = stairProfile(x0, floorY, n, tw, rh, topW, asc === 0);
  if (asc < 0) profile = mirrorX(profile);
  const depth = rh * 1.5;
  const d = { x: (asc < 0 ? -1 : 1) * depth * 0.62, y: -depth * 0.52 };
  extrude(ctx, profile, d, c.primary, topTone(c.primary), sideTone(c.primary));

  // The door on the top platform, lit from inside.
  const topY = floorY - n * rh;
  const platL = asc === 0 ? x0 + (n - 1) * tw : asc > 0 ? x0 + (n - 1) * tw : 2 * midX - (x0 + (n - 1) * tw + topW);
  const doorW = Math.min(topW * 0.5, rh * 1.25);
  const doorH = rh * 2.3;
  const doorX = platL + topW / 2 - doorW / 2 + d.x * 0.55;
  const doorBase = topY + d.y * 0.55;
  ctx.beginPath();
  ctx.moveTo(doorX, doorBase);
  ctx.lineTo(doorX + doorW, doorBase);
  ctx.lineTo(doorX + doorW + doorW * 0.5 - d.x * 0.3, topY - 1 * s);
  ctx.lineTo(doorX - doorW * 0.5 - d.x * 0.3, topY - 1 * s);
  ctx.closePath();
  ctx.fillStyle = rgba(c.secondary, 0.45);
  ctx.fill();
  ctx.beginPath();
  archPath(ctx, doorX, doorBase, doorW, doorH);
  ctx.fillStyle = c.secondary;
  ctx.fill();
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 2 * s;
  ctx.stroke();
  ctx.beginPath();
  archPath(ctx, doorX + doorW * 0.24, doorBase, doorW * 0.52, doorH * 0.8);
  ctx.fillStyle = mix(c.secondary, '#ffffff', 0.45);
  ctx.fill();

  ctx.fillStyle = rgba(c.line, 0.45);
  ctx.fillRect(r.x - r.w * 0.2, floorY - 0.75 * s, r.w * 1.4, 1.5 * s);
  ctx.restore();
  return { x: doorX + doorW / 2, y: doorBase - doorH / 2, r: Math.max(doorH, minDim * 0.12) };
}

// ── dots: a halftone sphere ────────────────────────────────────────────

function halftone(
  ctx: Ctx,
  r: Rect,
  sp: number,
  angle: number,
  ox: number,
  oy: number,
  value: (x: number, y: number) => number,
  color: string,
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx0 = r.x + r.w / 2 + ox;
  const cy0 = r.y + r.h / 2 + oy;
  const n = Math.ceil(Math.hypot(r.w, r.h) / 2 / sp) + 1;
  ctx.beginPath();
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = cx0 + i * sp * cos - j * sp * sin;
      const y = cy0 + i * sp * sin + j * sp * cos;
      if (x < r.x - sp || x > r.x + r.w + sp || y < r.y - sp || y > r.y + r.h + sp) continue;
      const v = value(x, y);
      if (v <= 0.02) continue;
      const rad = sp * 0.5 * Math.sqrt(Math.min(1, v)) * 1.06;
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, TAU);
    }
  }
  ctx.fillStyle = color;
  ctx.fill();
}

function dots(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { colors: c, s } = m;
  const W = m.weirdness;
  const minDim = Math.min(r.w, r.h);
  const cx = r.x + r.w * (0.5 + m.dir * 0.16);
  const cy = r.y + r.h * 0.46;
  const R = minDim * (W === 1 ? 0.35 : 0.33);
  const sp = s * (W === 1 ? 24 : W === 2 ? 21 : 18);
  const lightSide = m.dir === 0 ? -1 : -m.dir;
  const groundY = cy + R * 1.05;
  const shadowShift = -lightSide * R * 0.35;

  /** Ink coverage of a lit sphere. Dark plates print light (big dots = bright); light plates print shadow. */
  const sphere = (hx: number, hy: number, ccx: number, ccy: number, rad: number, ground: boolean) => (x: number, y: number) => {
    const d = Math.hypot(x - ccx, y - ccy);
    if (d <= rad) {
      const bright = 1 - Math.min(1, Math.hypot(x - hx, y - hy) / (rad * 1.85));
      const lit = 0.03 + 0.97 * bright ** 1.7;
      return c.light ? 1.02 - lit : lit;
    }
    if (!ground) return 0;
    const ex = (x - ccx - shadowShift) / (rad * 1.3);
    const ey = (y - groundY) / (rad * 0.2);
    const e = ex * ex + ey * ey;
    if (c.light) return e < 1 ? (1 - e) * 0.62 : 0;
    // dark plates: a faint lit floor with the shadow carved out of it (calm versions only)
    if (W === 3 || y < groundY - rad * 0.12) return 0;
    const floor = Math.min(0.22, ((y - (groundY - rad * 0.12)) / (rad * 0.9)) * 0.22);
    return e < 1 ? floor * e : floor;
  };
  const main = sphere(cx + lightSide * R * 0.38, cy - R * 0.4, cx, cy, R, true);

  if (W === 1) {
    halftone(ctx, r, sp, Math.PI / 4, 0, 0, main, c.line);
  } else if (W === 2) {
    halftone(ctx, r, sp, Math.PI / 4, 0, 0, main, c.primary);
    const mr = R * 0.28;
    const mx = Math.max(r.x + mr * 1.6, Math.min(r.x + r.w - mr * 1.6, cx + lightSide * R * 1.42));
    const my = cy - R * 0.92;
    halftone(ctx, r, sp * 0.8, Math.PI / 12, 0, 0, sphere(mx + lightSide * mr * 0.38, my - mr * 0.4, mx, my, mr, false), c.secondary);
  } else {
    // Two-colour riso eclipse: two halftone worlds overlap and the overlap mixes like ink,
    // over an orderly halftone glow rising from the bottom edge.
    const glowTop = r.y + r.h * 0.66;
    halftone(ctx, r, sp * 0.9, 0, 0, 0, (_x, y) => (y < glowTop ? 0 : ((y - glowTop) / (r.y + r.h - glowTop)) ** 1.4 * 0.9), c.tertiary);
    const ra = R * 0.92;
    const rb = R * 0.74;
    const ccx = r.x + r.w * (0.5 + m.dir * 0.08);
    const ax = ccx + lightSide * R * 0.34;
    const ay = cy + R * 0.12;
    const bx = ccx - lightSide * R * 0.42;
    const by = cy - R * 0.16;
    ctx.save();
    ctx.globalCompositeOperation = c.light ? 'multiply' : 'screen';
    halftone(ctx, r, sp, 0.26, 0, 0, sphere(ax + lightSide * ra * 0.38, ay - ra * 0.4, ax, ay, ra, true), c.primary);
    halftone(ctx, r, sp, 1.31, 0, 0, sphere(bx + lightSide * rb * 0.38, by - rb * 0.4, bx, by, rb, false), c.secondary);
    ctx.restore();
    const pr = R * 0.1;
    const px = Math.max(r.x + pr * 2, Math.min(r.x + r.w - pr * 2, bx - lightSide * rb * 1.05));
    disk(ctx, px, Math.max(r.y + pr * 2, by - rb * 0.95), pr, c.tertiary);
  }
  return { x: cx, y: cy, r: R };
}

// ── arches: three doors, the chosen one open and glowing ───────────────

function arches(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  const n = 3;
  const chosen = m.dir < 0 ? 0 : m.dir > 0 ? 2 : 1;
  const baseY = r.y + r.h * 0.86;
  const usable = r.w * 0.8;
  const gap = r.w * 0.055;
  const aw = (usable - gap * (n - 1)) / n;
  const x0 = r.x + (r.w - usable) / 2;
  const baseH = r.h * (0.5 + 0.06 * m.variant);

  ctx.fillStyle = c.shade;
  ctx.fillRect(r.x, baseY, r.w, r.y + r.h - baseY);
  if (W >= 2) starDust(ctx, r, m, W === 2 ? 18 : 32, null, baseY - baseH * 1.15);

  const chX = x0 + chosen * (aw + gap);
  ctx.beginPath();
  ctx.moveTo(chX, baseY);
  ctx.lineTo(chX + aw, baseY);
  ctx.lineTo(chX + aw * 1.6, r.y + r.h);
  ctx.lineTo(chX - aw * 0.6, r.y + r.h);
  ctx.closePath();
  const spill = ctx.createLinearGradient(0, baseY, 0, r.y + r.h);
  spill.addColorStop(0, rgba(c.line, c.light ? 0.2 : 0.3));
  spill.addColorStop(1, rgba(c.line, 0.02));
  ctx.fillStyle = spill;
  ctx.fill();

  let focus: Focus = { x: chX + aw / 2, y: baseY - baseH / 2, r: aw / 2 };
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (aw + gap);
    if (i === chosen) {
      const h = baseH * 1.14;
      const k = W === 1 ? 4 : W === 2 ? 6 : 8;
      const band = aw / 2 / (k + 0.8);
      const seq = W === 1 ? [c.primary, mix(c.primary, c.plate, 0.5)] : W === 2 ? [c.primary, c.secondary] : [c.primary, c.secondary, c.tertiary];
      for (let j = 0; j < k; j++) {
        ctx.beginPath();
        archPath(ctx, x + j * band, baseY, aw - 2 * j * band, h - j * band);
        ctx.fillStyle = seq[j % seq.length];
        ctx.fill();
      }
      ctx.beginPath();
      archPath(ctx, x + k * band, baseY, aw - 2 * k * band, h - k * band);
      ctx.fillStyle = c.line;
      ctx.fill();
      focus = { x: x + aw / 2, y: baseY - h * 0.55, r: aw / 2 };
    } else {
      const h = baseH * (W === 3 ? range(rng, 0.8, 0.98) : 0.94);
      ctx.beginPath();
      archPath(ctx, x, baseY, aw, h);
      ctx.fillStyle = mix(c.shade, c.plate, 0.25);
      ctx.fill();
      if (W === 3) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = rgba(c.tertiary, 0.45);
        for (let y = baseY - h; y < baseY; y += 14 * s) ctx.fillRect(x, y, aw, 5 * s);
        ctx.restore();
      }
      ctx.beginPath();
      archPath(ctx, x, baseY, aw, h);
      ctx.strokeStyle = rgba(c.line, 0.6);
      ctx.lineWidth = 2 * s;
      ctx.stroke();
      ctx.beginPath();
      archPath(ctx, x + 12 * s, baseY, aw - 24 * s, h - 12 * s);
      ctx.strokeStyle = rgba(c.line, 0.22);
      ctx.lineWidth = 1.2 * s;
      ctx.stroke();
    }
  }
  ctx.fillStyle = rgba(c.line, 0.55);
  ctx.fillRect(r.x, baseY - 0.75 * s, r.w, 1.5 * s);
  return focus;
}

// ── stripes: an op-art field with a lens that turns the world 90° ──────

function stripeField(ctx: Ctx, cx: number, cy: number, extent: number, angle: number, period: number, ratio: number, colors: readonly string[], offset: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const n = Math.ceil(extent / period) + 1;
  for (let i = -n; i <= n; i++) {
    ctx.fillStyle = colors[((i % colors.length) + colors.length) % colors.length];
    ctx.fillRect(i * period + offset, -extent, period * ratio, extent * 2);
  }
  ctx.restore();
}

function stripes(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  const lean = m.dir === 0 ? (m.variant < 0.5 ? -1 : 1) : m.dir;
  const angle = W === 1 ? 0 : W === 2 ? lean * 0.42 : lean * 0.78;
  const period = r.w / (W === 1 ? 11 : W === 2 ? 10 : 15);
  const ratio = W === 1 ? 0.24 : 0.5;
  const colors = W === 1 ? [c.primary] : W === 2 ? [c.primary, c.secondary] : [c.primary, c.secondary, c.tertiary, c.line];
  const extent = Math.hypot(r.w, r.h);
  stripeField(ctx, r.x + r.w / 2, r.y + r.h / 2, extent, angle, period, ratio, colors, 0);

  const minDim = Math.min(r.w, r.h);
  const lenses: Focus[] = [{ x: r.x + r.w * (0.5 + m.dir * 0.18), y: r.y + r.h * (0.46 + (m.variant - 0.5) * 0.1), r: minDim * (W === 1 ? 0.3 : 0.32) }];
  if (W === 3) {
    const big = lenses[0];
    lenses.push({ x: big.x - lean * big.r * 1.45, y: big.y + big.r * range(rng, 0.7, 1.0), r: big.r * 0.42 });
  }
  lenses.forEach((L, idx) => {
    if (W > 1) disk(ctx, L.x + 10 * s * lean, L.y + 12 * s, L.r, rgba(c.shade, 0.6));
    ctx.save();
    ctx.beginPath();
    ctx.arc(L.x, L.y, L.r, 0, TAU);
    ctx.clip();
    ctx.fillStyle = c.plate;
    ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    if (W === 1) stripeField(ctx, L.x, L.y, L.r * 2, angle, period, ratio, colors, period / 2);
    else stripeField(ctx, L.x, L.y, L.r * 2, angle + Math.PI / 2 + idx * 0.4, period * 0.7, ratio, colors.slice().reverse(), 0);
    ctx.restore();
    ring(ctx, L.x, L.y, L.r, c.line, 2 * s);
  });
  return lenses[0];
}

// ── maze: a perfect maze, with your path through it ────────────────────

function maze(ctx: Ctx, r: Rect, m: MotifContext): Focus {
  const { rng, colors: c, s } = m;
  const W = m.weirdness;
  const cols = W === 1 ? 9 : W === 2 ? 13 : 17;
  const pad = s * 40;
  let cell = (r.w - 2 * pad) / cols;
  const rows = Math.max(4, Math.floor((r.h - 2 * pad) / cell));
  const tilt = W === 3 ? (m.dir === 0 ? 1 : m.dir) * 0.045 : 0;
  if (tilt) {
    const cos = Math.cos(tilt);
    const sin = Math.abs(Math.sin(tilt));
    const bw = (cols + 1.8) * cell * cos + rows * cell * sin;
    const bh = (cols + 1.8) * cell * sin + (rows + 0.6) * cell * cos;
    cell *= Math.min(1, (r.w - pad) / bw, (r.h - pad) / bh);
  }
  const mx = r.x + (r.w - cols * cell) / 2;
  const my = r.y + (r.h - rows * cell) / 2;
  const total = cols * rows;
  const TOP = 1;
  const RIGHT = 2;
  const BOTTOM = 4;
  const LEFT = 8;
  const walls = new Uint8Array(total).fill(15);
  const seen = new Uint8Array(total);
  const start = int(rng, 0, total - 1);
  const stack: number[] = [start];
  seen[start] = 1;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const x = cur % cols;
    const y = (cur / cols) | 0;
    const options: [number, number, number][] = [];
    if (y > 0 && !seen[cur - cols]) options.push([cur - cols, TOP, BOTTOM]);
    if (x < cols - 1 && !seen[cur + 1]) options.push([cur + 1, RIGHT, LEFT]);
    if (y < rows - 1 && !seen[cur + cols]) options.push([cur + cols, BOTTOM, TOP]);
    if (x > 0 && !seen[cur - 1]) options.push([cur - 1, LEFT, RIGHT]);
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [next, wc, wn] = pick(rng, options);
    walls[cur] &= ~wc;
    walls[next] &= ~wn;
    seen[next] = 1;
    stack.push(next);
  }

  // Openings: left→right, right→left, or top→bottom (centred).
  let entry: number;
  let exit: number;
  let entryOut: Pt;
  let exitOut: Pt;
  const centre = (i: number): Pt => ({ x: mx + ((i % cols) + 0.5) * cell, y: my + (((i / cols) | 0) + 0.5) * cell });
  if (m.dir === 0) {
    const ec = (cols / 2) | 0;
    entry = ec;
    exit = (rows - 1) * cols + ec;
    walls[entry] &= ~TOP;
    walls[exit] &= ~BOTTOM;
    entryOut = { x: centre(entry).x, y: my - cell * 0.75 };
    exitOut = { x: centre(exit).x, y: my + rows * cell + cell * 0.75 };
  } else {
    const leftCell = int(rng, 0, rows - 1) * cols;
    const rightCell = int(rng, 0, rows - 1) * cols + cols - 1;
    walls[leftCell] &= ~LEFT;
    walls[rightCell] &= ~RIGHT;
    const leftOut = { x: mx - cell * 0.75, y: centre(leftCell).y };
    const rightOut = { x: mx + cols * cell + cell * 0.75, y: centre(rightCell).y };
    if (m.dir < 0) {
      entry = leftCell;
      exit = rightCell;
      entryOut = leftOut;
      exitOut = rightOut;
    } else {
      entry = rightCell;
      exit = leftCell;
      entryOut = rightOut;
      exitOut = leftOut;
    }
  }

  // Solve (BFS).
  const prev = new Int32Array(total).fill(-1);
  prev[entry] = entry;
  const queue: number[] = [entry];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi];
    if (cur === exit) break;
    const x = cur % cols;
    const y = (cur / cols) | 0;
    const go = (next: number) => {
      if (prev[next] === -1) {
        prev[next] = cur;
        queue.push(next);
      }
    };
    if (y > 0 && !(walls[cur] & TOP)) go(cur - cols);
    if (x < cols - 1 && !(walls[cur] & RIGHT)) go(cur + 1);
    if (y < rows - 1 && !(walls[cur] & BOTTOM)) go(cur + cols);
    if (x > 0 && !(walls[cur] & LEFT)) go(cur - 1);
  }
  const path: number[] = [];
  for (let cur = exit; prev[cur] !== -1; cur = prev[cur]) {
    path.push(cur);
    if (cur === entry) break;
  }
  path.reverse();
  const onPath = new Set(path);

  ctx.save();
  rotateAbout(ctx, r.x + r.w / 2, r.y + r.h / 2, tilt);

  // Dead ends become little rooms at the loud setting.
  if (W === 3) {
    const rooms: number[] = [];
    for (let i = 0; i < total; i++) {
      const w = walls[i];
      const closed = (w & 1) + ((w >> 1) & 1) + ((w >> 2) & 1) + ((w >> 3) & 1);
      if (closed === 3 && !onPath.has(i)) rooms.push(i);
    }
    for (const i of shuffle(rng, rooms).slice(0, 10)) {
      const p = centre(i);
      ctx.fillStyle = chance(rng, 0.5) ? c.secondary : c.tertiary;
      ctx.fillRect(p.x - cell * 0.22, p.y - cell * 0.22, cell * 0.44, cell * 0.44);
    }
  }

  const route = [entryOut, ...path.map(centre), exitOut];
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (W >= 2) {
    ctx.beginPath();
    polyline(ctx, route);
    ctx.strokeStyle = rgba(c.primary, 0.25);
    ctx.lineWidth = cell * 0.62;
    ctx.stroke();
  }
  ctx.beginPath();
  polyline(ctx, route);
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = cell * 0.3;
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < total; i++) {
    const x = mx + (i % cols) * cell;
    const y = my + ((i / cols) | 0) * cell;
    const w = walls[i];
    if (w & TOP) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + cell, y);
    }
    if (w & LEFT) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + cell);
    }
    if (i % cols === cols - 1 && w & RIGHT) {
      ctx.moveTo(x + cell, y);
      ctx.lineTo(x + cell, y + cell);
    }
    if (((i / cols) | 0) === rows - 1 && w & BOTTOM) {
      ctx.moveTo(x, y + cell);
      ctx.lineTo(x + cell, y + cell);
    }
  }
  ctx.strokeStyle = c.line;
  ctx.lineWidth = cell * (W === 1 ? 0.12 : 0.1);
  ctx.lineCap = 'square';
  ctx.stroke();

  ring(ctx, entryOut.x, entryOut.y, cell * 0.22, c.line, 2 * s);
  disk(ctx, exitOut.x, exitOut.y, cell * 0.26, W === 1 ? c.primary : c.secondary);
  ctx.restore();
  const mid = route[Math.floor(route.length / 2)];
  return { x: mid.x, y: mid.y, r: cell * 2.2 };
}

function polyline(ctx: Ctx, pts: readonly Pt[]): void {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
}

// ── registry ───────────────────────────────────────────────────────────

export const MOTIF_DRAWERS: Readonly<Record<Motif, MotifDrawer>> = {
  orbits,
  grid,
  rays,
  waves,
  shards,
  stairs,
  dots,
  arches,
  stripes,
  maze,
};

export interface MotifResult {
  focus: Focus;
  /** Set when the generator failed and a fallback was drawn (never thrown to the caller). */
  error: string | null;
}

/** Fills the plate and draws the motif, clipped to `r`. Never throws: a failing generator falls back to orbits. */
export function drawMotif(ctx: Ctx, motif: Motif, r: Rect, m: MotifContext): MotifResult {
  const draw = MOTIF_DRAWERS[motif] ?? orbits;
  const paint = (fn: MotifDrawer): Focus => {
    ctx.save();
    try {
      clipRect(ctx, r);
      ctx.fillStyle = m.colors.plate;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      return fn(ctx, r, m);
    } finally {
      ctx.restore();
    }
  };
  try {
    return { focus: paint(draw), error: null };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { focus: paint(orbits), error };
  }
}

// ── kind overlays ─────────────────────────────────────────────────────

/** Top corner away from the focus (where the art is quiet). */
function quietCorner(r: Rect, f: Focus, size: number, s: number): Pt {
  const inset = 24 * s;
  return { x: f.x > r.x + r.w / 2 ? r.x + inset : r.x + r.w - inset - size, y: r.y + inset };
}

/** A solid plate-coloured badge, so a small emblem reads on top of busy art. */
function badge(ctx: Ctx, x: number, y: number, size: number, m: MotifContext, round: boolean): void {
  const c = m.colors;
  ctx.beginPath();
  if (round) ctx.arc(x + size / 2, y + size / 2, size / 2, 0, TAU);
  else if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, size, size, size * 0.2);
  else ctx.rect(x, y, size, size);
  ctx.fillStyle = c.plate;
  ctx.fill();
  ctx.strokeStyle = rgba(c.line, 0.8);
  ctx.lineWidth = 2 * m.s;
  ctx.stroke();
}

/** A small narrative mark tied to the kind of episode, drawn over the art. */
export function drawKindAccent(ctx: Ctx, r: Rect, f: Focus, m: MotifContext): void {
  const { colors: c, s } = m;
  const minDim = Math.min(r.w, r.h);
  ctx.save();
  clipRect(ctx, r);
  ctx.lineCap = 'butt';
  ctx.setLineDash([]);
  switch (m.kind) {
    case 'detective': {
      // A magnifier's reticle on the point of interest.
      const rr = Math.max(30 * s, Math.min(f.r * 1.3, minDim * 0.42));
      ring(ctx, f.x, f.y, rr, rgba(c.line, 0.7), 1.4 * s);
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        ctx.moveTo(f.x + Math.cos(a) * rr * 0.86, f.y + Math.sin(a) * rr * 0.86);
        ctx.lineTo(f.x + Math.cos(a) * rr * 1.16, f.y + Math.sin(a) * rr * 1.16);
      }
      ctx.moveTo(f.x - 7 * s, f.y);
      ctx.lineTo(f.x + 7 * s, f.y);
      ctx.moveTo(f.x, f.y - 7 * s);
      ctx.lineTo(f.x, f.y + 7 * s);
      ctx.strokeStyle = rgba(c.line, 0.75);
      ctx.lineWidth = 1.4 * s;
      ctx.stroke();
      break;
    }
    case 'maker': {
      // Construction lines, like a draughtsman's layout.
      ctx.beginPath();
      ctx.moveTo(r.x, f.y);
      ctx.lineTo(r.x + r.w, f.y);
      ctx.moveTo(f.x, r.y);
      ctx.lineTo(f.x, r.y + r.h);
      ctx.strokeStyle = rgba(c.line, 0.28);
      ctx.lineWidth = Math.max(1, s);
      ctx.stroke();
      ring(ctx, f.x, f.y, Math.min(f.r * 1.55, minDim * 0.45), rgba(c.line, 0.4), Math.max(1, s), [6 * s, 6 * s]);
      ctx.fillStyle = rgba(c.line, 0.7);
      const t = 5 * s;
      for (const [x, y] of [
        [r.x + t, f.y],
        [r.x + r.w - t, f.y],
        [f.x, r.y + t],
        [f.x, r.y + r.h - t],
      ]) {
        ctx.fillRect(x - t / 2, y - t / 2, t, t);
      }
      break;
    }
    case 'wanderer': {
      // A dotted trail walking in from a corner.
      const sx = m.dir > 0 ? r.x + r.w * 0.06 : r.x + r.w * 0.94;
      const sy = r.y + r.h * 0.94;
      const ang = Math.atan2(sy - f.y, sx - f.x);
      const ex = f.x + Math.cos(ang) * f.r * 1.15;
      const ey = f.y + Math.sin(ang) * f.r * 1.15;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx, sy - r.h * 0.3, ex + (sx - ex) * 0.6, ey + r.h * 0.05, ex, ey);
      ctx.setLineDash([0.1, 11 * s]);
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(c.line, 0.8);
      ctx.lineWidth = 3.4 * s;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      const k = 7 * s;
      ctx.moveTo(sx - k, sy - k);
      ctx.lineTo(sx + k, sy + k);
      ctx.moveTo(sx + k, sy - k);
      ctx.lineTo(sx - k, sy + k);
      ctx.lineWidth = 2.4 * s;
      ctx.stroke();
      break;
    }
    case 'social': {
      // Two linked rings, as a small badge in the quiet corner.
      const size = 54 * s;
      const at = quietCorner(r, f, size, s);
      badge(ctx, at.x, at.y, size, m, true);
      const rr = size * 0.22;
      ring(ctx, at.x + size / 2 - rr * 0.58, at.y + size / 2, rr, rgba(c.line, 0.9), 2.2 * s);
      ring(ctx, at.x + size / 2 + rr * 0.58, at.y + size / 2, rr, c.secondary === c.plate ? c.line : c.secondary, 2.2 * s);
      break;
    }
    case 'ritual': {
      // Calm concentric halo.
      const base = Math.max(30 * s, Math.min(f.r, minDim * 0.3));
      [1.28, 1.52, 1.8].forEach((k, i) => ring(ctx, f.x, f.y, base * k, rgba(c.line, 0.42 - i * 0.12), 1.2 * s));
      break;
    }
    case 'game': {
      // A die, as a small badge in the quiet corner.
      const size = 50 * s;
      const at = quietCorner(r, f, size, s);
      badge(ctx, at.x, at.y, size, m, false);
      const x = at.x;
      const y = at.y;
      const pip = size * 0.085;
      for (const [u, v] of [
        [0.27, 0.27],
        [0.73, 0.27],
        [0.5, 0.5],
        [0.27, 0.73],
        [0.73, 0.73],
      ]) {
        disk(ctx, x + size * u, y + size * v, pip, rgba(c.line, 0.85));
      }
      break;
    }
  }
  ctx.restore();
}

// ── wear ─────────────────────────────────────────────────────────────

/** Engraving hatch + worn specks, scaled by `m.texture` (alternative challenges taken). */
export function drawTexture(ctx: Ctx, r: Rect, m: MotifContext): void {
  const t = Math.max(0, Math.min(1, m.texture));
  if (t <= 0) return;
  const s = m.s;
  ctx.save();
  clipRect(ctx, r);
  const gap = s * (10 - 4 * t);
  ctx.beginPath();
  for (let d = -r.h; d < r.w; d += gap) {
    ctx.moveTo(r.x + d, r.y + r.h);
    ctx.lineTo(r.x + d + r.h, r.y);
  }
  ctx.strokeStyle = rgba('#000000', m.colors.light ? 0.03 + 0.04 * t : 0.08 + 0.09 * t);
  ctx.lineWidth = Math.max(1, s * 1.1);
  ctx.stroke();
  if (t >= 0.5) {
    const n = Math.round(160 * t);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = r.x + m.rng() * r.w;
      const y = r.y + m.rng() * r.h;
      const rad = s * range(m.rng, 0.6, 1.8);
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, TAU);
    }
    ctx.fillStyle = rgba(m.colors.light ? '#000000' : '#ffffff', 0.18);
    ctx.fill();
  }
  ctx.restore();
}
