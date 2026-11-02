/* Eldermoor: The Ninth Lantern — WORLD module (world.js)
 * Builds the 7 story areas: grounds, entrance, greathall, classroom, library, tower, crypt.
 * Everything is procedural: primitives + CanvasTextures. Three.js r128 only.
 * Shared (module-level) textures/materials/geometries are cached and marked userData.keep = true;
 * per-area geometries/materials are left unmarked so core disposes them on unload.
 */
(function () {
  'use strict';
  const ELD = window.ELD;
  if (!ELD || typeof ELD.registerArea !== 'function') return;

  let THREE = null, U = null;
  const PI = Math.PI, TAU = Math.PI * 2;

  // ===================================================================================
  // 0. small helpers
  // ===================================================================================
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function keep(o) { if (o) { if (!o.userData) o.userData = {}; o.userData.keep = true; } return o; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function yawTo(fx, fz, tx, tz) { return Math.atan2(-(tx - fx), -(tz - fz)); }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }

  let maxAniso = 4;
  function initCtx(ctx) {
    THREE = (ctx && ctx.THREE) || window.THREE;
    U = (ctx && ctx.util) || ELD.util;
    try {
      const r = ELD.three && ELD.three.renderer;
      if (r && r.capabilities) maxAniso = Math.min(8, r.capabilities.getMaxAnisotropy() || 4);
    } catch (e) { /* ignore */ }
  }

  // canvas texture; rep = metres covered by one tile (world-UV geometry) or null for 0..1 UVs
  function mkTex(w, h, draw, rep) {
    const t = U.canvasTexture(w, h, draw);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rep) t.repeat.set(1 / rep[0], 1 / rep[1]);
    t.anisotropy = maxAniso;
    return t;
  }
  function mkTexClamp(w, h, draw) {
    const t = U.canvasTexture(w, h, draw);
    t.anisotropy = maxAniso;
    return t;
  }

  // ===================================================================================
  // 1. texture painters
  // ===================================================================================
  function paintBlocks(g, S, o) {
    const R = mulberry32(o.seed || 7);
    g.fillStyle = o.grout; g.fillRect(0, 0, S, S);
    const rows = o.rows, rh = S / rows, gap = o.gap || 3;
    for (let r = 0; r < rows; r++) {
      const widths = []; let tot = 0;
      while (tot < S - o.maxW) { const w = o.minW + R() * (o.maxW - o.minW); widths.push(w); tot += w; }
      const rest = S - tot;
      if (rest < o.minW && widths.length) widths[widths.length - 1] += rest; else widths.push(rest);
      let x = R() * S;
      for (let i = 0; i < widths.length; i++) {
        const w = widths[i];
        const l = o.l0 + R() * (o.l1 - o.l0), hue = o.hue + (R() - 0.5) * (o.hueVar || 8), sat = o.sat + R() * 5;
        const seedA = R(), seedB = R();
        for (let k = 0; k < 2; k++) drawStone(g, x - k * S + gap, r * rh + gap, w - gap * 2, rh - gap * 2, hue, sat, l, seedA, seedB, o);
        x = (x + w) % S;
      }
    }
    for (let i = 0; i < S * S / 36; i++) {
      g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.11)';
      g.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2);
    }
  }
  function drawStone(g, x, y, w, h, hue, sat, l, sa, sb, o) {
    const R = mulberry32(Math.floor(sa * 1e6));
    g.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + l + '%)';
    roundRect(g, x, y, w, h, o.round || 3); g.fill();
    g.save(); roundRect(g, x, y, w, h, o.round || 3); g.clip();
    for (let k = 0; k < 7; k++) {
      const cx = x + R() * w, cy = y + R() * h, rr = 6 + R() * Math.max(w, h) * 0.45;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      const c = R() < 0.5 ? '255,245,230' : '0,0,0';
      gr.addColorStop(0, 'rgba(' + c + ',' + (0.05 + R() * 0.07) + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
    }
    if (o.moss && sb < o.moss) {
      const gr = g.createLinearGradient(0, y + h, 0, y + h * 0.4);
      gr.addColorStop(0, 'rgba(60,90,40,0.45)'); gr.addColorStop(1, 'rgba(60,90,40,0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
    }
    const bv = o.bevel || 2.5;
    g.fillStyle = 'rgba(255,250,235,' + (o.hi || 0.12) + ')';
    g.fillRect(x, y, w, bv); g.fillRect(x, y, bv, h);
    g.fillStyle = 'rgba(0,0,0,' + (o.lo || 0.28) + ')';
    g.fillRect(x, y + h - bv, w, bv); g.fillRect(x + w - bv, y, bv, h);
    if (sb > 0.82) { // hairline crack
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1;
      g.beginPath(); let px = x + R() * w, py = y; g.moveTo(px, py);
      for (let k = 0; k < 5; k++) { px += (R() - 0.5) * w * 0.3; py += h / 5; g.lineTo(px, py); }
      g.stroke();
    }
    g.restore();
  }
  function paintPlanks(g, S, o) {
    const R = mulberry32(o.seed || 3);
    const n = o.count || 6, pw = S / n;
    g.fillStyle = '#120a05'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      const x0 = i * pw;
      let y = -R() * S;
      while (y < S) {
        const len = S * (0.45 + R() * 0.6);
        const l = o.l0 + R() * (o.l1 - o.l0), hue = o.hue + (R() - 0.5) * 6;
        for (let k = -1; k <= 1; k++) {
          const yy = y + k * S;
          g.fillStyle = 'hsl(' + hue + ',' + o.sat + '%,' + l + '%)';
          g.fillRect(x0 + 1.5, yy + 1.5, pw - 3, len - 3);
          g.save(); g.beginPath(); g.rect(x0 + 1.5, yy + 1.5, pw - 3, len - 3); g.clip();
          for (let q = 0; q < 16; q++) {
            const gx = x0 + 3 + R() * (pw - 6);
            g.strokeStyle = 'rgba(' + (R() < 0.5 ? '0,0,0,0.16' : '255,220,170,0.06') + ')';
            g.lineWidth = 0.6 + R() * 1.4;
            g.beginPath(); g.moveTo(gx, yy);
            for (let s = 0; s <= 8; s++) g.lineTo(gx + Math.sin(s * 0.9 + q) * 1.6, yy + len * s / 8);
            g.stroke();
          }
          if (R() < 0.4) { // knot
            const kx = x0 + pw * (0.25 + R() * 0.5), ky = yy + len * R();
            g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.2;
            g.beginPath(); g.ellipse(kx, ky, 3 + R() * 3, 6 + R() * 6, 0, 0, TAU); g.stroke();
          }
          const gr = g.createLinearGradient(x0, 0, x0 + pw, 0);
          gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.18)');
          g.fillStyle = gr; g.fillRect(x0, yy, pw, len);
          g.restore();
          g.fillStyle = 'rgba(20,12,6,0.8)';
          g.fillRect(x0 + pw * 0.2, yy + 6, 2, 2); g.fillRect(x0 + pw * 0.8, yy + 6, 2, 2);
        }
        y += len;
      }
    }
  }
  function paintGrain(g, S, o) {
    const R = mulberry32(o.seed || 5);
    g.fillStyle = o.base; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 140; i++) {
      const x = R() * S;
      g.strokeStyle = R() < 0.6 ? 'rgba(0,0,0,' + (0.08 + R() * 0.14) + ')' : 'rgba(255,220,170,' + (0.03 + R() * 0.05) + ')';
      g.lineWidth = 0.5 + R() * 2;
      g.beginPath(); g.moveTo(x, 0);
      const ph = R() * 6, amp = 1 + R() * 4;
      for (let s = 0; s <= 16; s++) g.lineTo(x + Math.sin(s * 0.6 + ph) * amp, S * s / 16);
      g.stroke();
    }
  }
  function paintSpeckle(g, S, base, specks, n, R) {
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      g.fillStyle = specks[Math.floor(R() * specks.length)];
      g.globalAlpha = 0.2 + R() * 0.6;
      const s = 1 + R() * 2.5;
      g.fillRect(R() * S, R() * S, s, s * (1 + R()));
    }
    g.globalAlpha = 1;
  }

  // the academy lantern emblem (original): ring, cap, glass body with flame, base, nine stars
  function drawLantern(g, cx, cy, s, o) {
    o = o || {};
    const metal = o.metal || '#c9844a', glass = o.glass !== false;
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (glass) {
      const gr = g.createRadialGradient(cx, cy, 2 * s, cx, cy, 70 * s);
      gr.addColorStop(0, o.glowIn || 'rgba(255,236,170,0.95)'); gr.addColorStop(0.45, o.glowMid || 'rgba(255,180,80,0.55)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 70 * s, 0, TAU); g.fill();
    }
    g.strokeStyle = metal; g.lineWidth = 5 * s;
    g.beginPath(); g.arc(cx, cy - 76 * s, 9 * s, 0, TAU); g.stroke();
    g.fillStyle = metal;
    g.beginPath(); g.moveTo(cx - 14 * s, cy - 66 * s); g.lineTo(cx + 14 * s, cy - 66 * s); g.lineTo(cx + 36 * s, cy - 48 * s); g.lineTo(cx - 36 * s, cy - 48 * s); g.closePath(); g.fill();
    g.fillStyle = o.glassFill || 'rgba(255,200,110,0.9)';
    roundRect(g, cx - 27 * s, cy - 46 * s, 54 * s, 84 * s, 6 * s); g.fill();
    const fl = g.createRadialGradient(cx, cy + 4 * s, 1, cx, cy + 4 * s, 26 * s);
    fl.addColorStop(0, '#fffbe8'); fl.addColorStop(0.5, '#ffd36a'); fl.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = fl;
    g.beginPath(); g.moveTo(cx, cy - 24 * s); g.quadraticCurveTo(cx + 14 * s, cy + 2 * s, cx, cy + 20 * s); g.quadraticCurveTo(cx - 14 * s, cy + 2 * s, cx, cy - 24 * s); g.fill();
    g.strokeStyle = metal; g.lineWidth = 4.5 * s;
    roundRect(g, cx - 27 * s, cy - 46 * s, 54 * s, 84 * s, 6 * s); g.stroke();
    g.lineWidth = 2.5 * s;
    g.beginPath(); g.moveTo(cx - 13 * s, cy - 46 * s); g.lineTo(cx - 13 * s, cy + 38 * s); g.moveTo(cx + 13 * s, cy - 46 * s); g.lineTo(cx + 13 * s, cy + 38 * s); g.stroke();
    g.fillStyle = metal;
    g.beginPath(); g.moveTo(cx - 34 * s, cy + 40 * s); g.lineTo(cx + 34 * s, cy + 40 * s); g.lineTo(cx + 22 * s, cy + 56 * s); g.lineTo(cx - 22 * s, cy + 56 * s); g.closePath(); g.fill();
    g.fillRect(cx - 28 * s, cy + 56 * s, 56 * s, 5 * s);
    if (o.stars !== false) {
      g.fillStyle = o.starCol || '#f0c870';
      for (let i = 0; i < 9; i++) {
        const a = -PI / 2 + (i - 4) * 0.30;
        star(g, cx + Math.cos(a) * 104 * s, cy - 6 * s + Math.sin(a) * 104 * s, (i === 4 ? 9 : 6) * s, 5);
      }
    }
    g.restore();
  }
  function star(g, x, y, r, n) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = -PI / 2 + i * PI / n, rr = i % 2 ? r * 0.45 : r;
      if (i === 0) g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
  }
  function wovenLines(g, w, h, a) {
    g.fillStyle = 'rgba(0,0,0,' + a + ')';
    for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    g.fillStyle = 'rgba(255,255,255,' + a * 0.4 + ')';
    for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, h);
  }

  function paintBanner(g, w, h) {
    g.clearRect(0, 0, w, h);
    g.beginPath();
    g.moveTo(6, 0); g.lineTo(w - 6, 0); g.lineTo(w - 6, h - 6); g.lineTo(w / 2, h * 0.84); g.lineTo(6, h - 6); g.closePath();
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#13214a'); gr.addColorStop(0.5, '#22397a'); gr.addColorStop(1, '#13214a');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip(); wovenLines(g, w, h, 0.12);
    const sh = g.createLinearGradient(0, 0, 0, h); sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(0.15, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.restore();
    g.lineWidth = 10; g.strokeStyle = '#b8743e';
    g.beginPath(); g.moveTo(16, 6); g.lineTo(w - 16, 6); g.lineTo(w - 16, h - 22); g.lineTo(w / 2, h * 0.84 - 14); g.lineTo(16, h - 22); g.closePath(); g.stroke();
    g.lineWidth = 2.5; g.strokeStyle = '#f0c870';
    g.beginPath(); g.moveTo(26, 14); g.lineTo(w - 26, 14); g.lineTo(w - 26, h - 34); g.lineTo(w / 2, h * 0.84 - 26); g.lineTo(26, h - 34); g.closePath(); g.stroke();
    drawLantern(g, w / 2, h * 0.40, w / 270);
    g.strokeStyle = '#c9844a'; g.lineWidth = 3;
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      for (let x = 40; x <= w - 40; x += 4) { const y = h * 0.62 + k * 14 + Math.sin(x * 0.08) * 4; if (x === 40) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
  }

  function paintTapestry(g, w, h, kind) {
    const R = mulberry32(kind === 'tree' ? 11 : (kind === 'stars' ? 12 : 13));
    g.fillStyle = '#5a2a1c'; g.fillRect(0, 0, w, h - 18);
    const ix = 14, iy = 14, iw = w - 28, ih = h - 50;
    const bg = g.createLinearGradient(0, iy, 0, iy + ih);
    if (kind === 'stars') { bg.addColorStop(0, '#0c2a33'); bg.addColorStop(1, '#14414a'); }
    else if (kind === 'tree') { bg.addColorStop(0, '#2a3a24'); bg.addColorStop(1, '#4a5a2a'); }
    else { bg.addColorStop(0, '#0e1838'); bg.addColorStop(0.65, '#1f3466'); bg.addColorStop(1, '#0a1022'); }
    g.fillStyle = bg; g.fillRect(ix, iy, iw, ih);
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    if (kind === 'stars') {
      const pts = [];
      for (let i = 0; i < 26; i++) pts.push([ix + R() * iw, iy + R() * ih]);
      g.strokeStyle = 'rgba(240,200,120,0.55)'; g.lineWidth = 1.5;
      g.beginPath();
      for (let i = 0; i < 18; i++) { const a = pts[i], b = pts[(i * 7 + 3) % 26]; g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
      g.stroke();
      g.fillStyle = '#f6dc98';
      pts.forEach(function (p, i) { star(g, p[0], p[1], i % 5 === 0 ? 6 : 3, 5); });
      g.strokeStyle = 'rgba(200,140,80,0.8)'; g.lineWidth = 3;
      g.beginPath(); g.arc(w / 2, iy + ih * 0.5, iw * 0.38, 0, TAU); g.stroke();
      g.beginPath(); g.arc(w / 2, iy + ih * 0.5, iw * 0.26, 0, TAU); g.stroke();
      drawLantern(g, w / 2, iy + ih * 0.5, 0.42, { stars: false });
    } else if (kind === 'tree') {
      g.strokeStyle = '#3a2414'; g.lineCap = 'round';
      function branch(x, y, a, len, wdt, d) {
        const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        g.lineWidth = wdt; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
        if (d > 0) { branch(x2, y2, a - 0.45 - R() * 0.2, len * 0.72, wdt * 0.66, d - 1); branch(x2, y2, a + 0.45 + R() * 0.2, len * 0.72, wdt * 0.66, d - 1); }
        else { g.fillStyle = 'rgba(110,150,70,0.85)'; g.beginPath(); g.arc(x2, y2, 9, 0, TAU); g.fill(); }
      }
      branch(w / 2, iy + ih - 10, -PI / 2, ih * 0.26, 16, 5);
      for (let i = 0; i < 9; i++) {
        const lx = ix + 26 + (i % 3) * (iw - 52) / 2 + (R() - 0.5) * 14, ly = iy + 60 + Math.floor(i / 3) * 70 + R() * 10;
        g.strokeStyle = '#2a1a10'; g.lineWidth = 1; g.beginPath(); g.moveTo(lx, ly - 22); g.lineTo(lx, ly - 12); g.stroke();
        drawLantern(g, lx, ly, 0.16, { stars: false });
      }
    } else {
      g.fillStyle = '#f2ecd0'; g.beginPath(); g.arc(ix + iw * 0.78, iy + 40, 16, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 40; i++) g.fillRect(ix + R() * iw, iy + R() * ih * 0.5, 1.5, 1.5);
      g.fillStyle = '#0a0d18';
      g.beginPath(); g.moveTo(ix, iy + ih * 0.66); g.lineTo(ix + iw * 0.25, iy + ih * 0.5); g.lineTo(ix + iw * 0.9, iy + ih * 0.52); g.lineTo(ix + iw, iy + ih * 0.7); g.lineTo(ix + iw, iy + ih); g.lineTo(ix, iy + ih); g.fill();
      const tx = [0.2, 0.3, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88], th = [50, 64, 80, 70, 98, 70, 80, 64, 50];
      for (let i = 0; i < 9; i++) {
        const x = ix + iw * tx[i] - 7, top = iy + ih * 0.52 - th[i];
        g.fillStyle = '#0a0d18'; g.fillRect(x, top, 14, th[i] + 4);
        g.beginPath(); g.moveTo(x - 3, top); g.lineTo(x + 7, top - 18); g.lineTo(x + 17, top); g.fill();
        g.fillStyle = '#ffcf6a'; g.beginPath(); g.arc(x + 7, top + 8, 3.5, 0, TAU); g.fill();
      }
      g.fillStyle = '#071022'; g.fillRect(ix, iy + ih * 0.72, iw, ih * 0.28);
      g.strokeStyle = 'rgba(255,207,106,0.5)'; g.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const x = ix + iw * tx[i]; g.beginPath(); g.moveTo(x, iy + ih * 0.75); g.lineTo(x, iy + ih * 0.75 + 30 + R() * 30); g.stroke(); }
    }
    g.restore();
    g.strokeStyle = '#d8a050'; g.lineWidth = 4; g.strokeRect(ix - 4, iy - 4, iw + 8, ih + 8);
    g.fillStyle = '#e0b060';
    for (let x = ix + 6; x < ix + iw; x += 16) { g.beginPath(); g.moveTo(x, h - 32); g.lineTo(x + 6, h - 26); g.lineTo(x, h - 20); g.lineTo(x - 6, h - 26); g.fill(); }
    wovenLines(g, w, h - 18, 0.1);
    g.fillStyle = '#c99a50';
    for (let x = 4; x < w - 4; x += 5) g.fillRect(x, h - 18, 2, 12 + (x % 3) * 2);
  }

  function paintPainting(g, w, h, kind) {
    const R = mulberry32(kind === 'tower' ? 21 : (kind === 'still' ? 22 : 23));
    if (kind === 'still') {
      const bg = g.createRadialGradient(w * 0.5, h * 0.45, 4, w * 0.5, h * 0.5, w * 0.7);
      bg.addColorStop(0, '#5a3a1c'); bg.addColorStop(1, '#120a06'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3a2210'; g.fillRect(0, h * 0.72, w, h * 0.28);
      drawLantern(g, w * 0.42, h * 0.48, 0.55, { stars: false });
      g.fillStyle = '#7a2a2a'; g.beginPath(); g.arc(w * 0.72, h * 0.68, 14, 0, TAU); g.fill();
      g.fillStyle = '#9a7a2a'; g.beginPath(); g.arc(w * 0.8, h * 0.7, 10, 0, TAU); g.fill();
      g.fillStyle = '#d8d0b8'; g.fillRect(w * 0.15, h * 0.62, 30, 18);
    } else if (kind === 'tower') {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2b2a5a'); bg.addColorStop(0.6, '#a2607a'); bg.addColorStop(1, '#e8a868');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a1424';
      g.fillRect(w * 0.44, h * 0.25, w * 0.12, h * 0.75);
      g.beginPath(); g.moveTo(w * 0.42, h * 0.25); g.lineTo(w * 0.5, h * 0.06); g.lineTo(w * 0.58, h * 0.25); g.fill();
      g.fillStyle = '#ffd27a'; g.fillRect(w * 0.48, h * 0.32, w * 0.04, h * 0.06);
      g.fillStyle = '#241a2a'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.3, h * 0.72, w * 0.6, h * 0.86); g.quadraticCurveTo(w * 0.85, h * 0.8, w, h * 0.9); g.lineTo(w, h); g.fill();
    } else {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f0b070'); bg.addColorStop(0.5, '#e08a5a'); bg.addColorStop(0.56, '#4a5a7a'); bg.addColorStop(1, '#1a2238');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3a3a5a';
      g.beginPath(); g.moveTo(0, h * 0.55); g.lineTo(w * 0.2, h * 0.3); g.lineTo(w * 0.38, h * 0.48); g.lineTo(w * 0.6, h * 0.22); g.lineTo(w * 0.85, h * 0.46); g.lineTo(w, h * 0.38); g.lineTo(w, h * 0.56); g.lineTo(0, h * 0.56); g.fill();
      g.fillStyle = 'rgba(255,220,160,0.35)';
      for (let i = 0; i < 12; i++) g.fillRect(w * 0.3 + R() * w * 0.4, h * 0.6 + i * 5, 20 + R() * 30, 1.5);
    }
    // varnish + craquelure
    const v = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,0,0.55)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  }

  const JEWELS = ['#1d3a8a', '#2a5db0', '#4a2a8a', '#1f6f7a', '#b8862a', '#7a1f2e', '#2c4a9a', '#3a7fbf', '#5a3a9a', '#1a5a6a'];
  function paintStained(g, w, h, seed, palette) {
    const R = mulberry32(seed || 31);
    const pal = palette || JEWELS;
    g.fillStyle = '#16120e'; g.fillRect(0, 0, w, h);
    const cols = 4, rows = 9, cw = w / cols, rh = h / rows;
    const vx = [], vy = [];
    for (let r = 0; r <= rows; r++) {
      vx.push([]); vy.push([]);
      for (let c = 0; c <= cols; c++) {
        const edge = c === 0 || c === cols || r === 0 || r === rows;
        vx[r].push(c * cw + (edge ? 0 : (R() - 0.5) * cw * 0.5));
        vy[r].push(r * rh + (edge ? 0 : (R() - 0.5) * rh * 0.5));
      }
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const col = pal[Math.floor(R() * pal.length)];
      const cx = (vx[r][c] + vx[r][c + 1] + vx[r + 1][c] + vx[r + 1][c + 1]) / 4, cy = (vy[r][c] + vy[r][c + 1] + vy[r + 1][c] + vy[r + 1][c + 1]) / 4;
      const gr = g.createRadialGradient(cx, cy, 1, cx, cy, cw * 0.8);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.25, col); gr.addColorStop(1, col);
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(vx[r][c], vy[r][c]); g.lineTo(vx[r][c + 1], vy[r][c + 1]); g.lineTo(vx[r + 1][c + 1], vy[r + 1][c + 1]); g.lineTo(vx[r + 1][c], vy[r + 1][c]); g.closePath();
      g.fill(); g.strokeStyle = '#17110c'; g.lineWidth = 4; g.stroke();
    }
    // medallion with lantern emblem
    const mx = w / 2, my = h * 0.42, mr = w * 0.33;
    const mg = g.createRadialGradient(mx, my, 2, mx, my, mr);
    mg.addColorStop(0, '#fff2c0'); mg.addColorStop(0.5, '#e8a440'); mg.addColorStop(1, '#8a4a18');
    g.fillStyle = '#1a2a6a'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(mx, my, mr - 6, 0, TAU); g.clip();
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#2a4aa0' : '#3a62c0'; g.beginPath(); g.moveTo(mx, my); g.arc(mx, my, mr, i * TAU / 9, (i + 1) * TAU / 9); g.closePath(); g.fill(); }
    g.restore();
    drawLantern(g, mx, my + 4, mr / 120, { stars: false, metal: '#2a1a0c', glassFill: 'rgba(255,214,120,1)' });
    g.strokeStyle = '#17110c'; g.lineWidth = 7; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.stroke();
    g.strokeStyle = '#d89a48'; g.lineWidth = 2; g.beginPath(); g.arc(mx, my, mr - 6, 0, TAU); g.stroke();
    // small rosette near the top
    g.fillStyle = '#c03040';
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(mx + Math.cos(a) * 14, h * 0.1 + Math.sin(a) * 14, 9, 0, TAU); g.fill(); }
    g.fillStyle = '#f0c060'; g.beginPath(); g.arc(mx, h * 0.1, 8, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 400; i++) g.fillRect(R() * w, R() * h, 2, 2);
  }

  function paintRose(g, S) {
    g.fillStyle = '#16120e'; g.fillRect(0, 0, S, S);
    const c = S / 2;
    for (let ring = 0; ring < 3; ring++) {
      const r0 = [0.16, 0.34, 0.5][ring] * S, r1 = [0.34, 0.5, 0.49][ring] * S;
      const n = [9, 18, 36][ring];
      if (ring === 2) break;
      for (let i = 0; i < n; i++) {
        const a0 = i * TAU / n, a1 = (i + 1) * TAU / n;
        const col = ring === 0 ? (i % 2 ? '#2a4aa8' : '#7a2a8a') : JEWELS[(i * 3) % JEWELS.length];
        const gr = g.createRadialGradient(c, c, r0, c, c, r1);
        gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.3, col); gr.addColorStop(1, col);
        g.fillStyle = gr;
        g.beginPath(); g.arc(c, c, r1, a0, a1); g.arc(c, c, r0, a1, a0, true); g.closePath(); g.fill();
        g.strokeStyle = '#17110c'; g.lineWidth = 5; g.stroke();
      }
    }
    g.fillStyle = '#1a2a6a'; g.beginPath(); g.arc(c, c, S * 0.16, 0, TAU); g.fill();
    drawLantern(g, c, c + 4, S / 900, { stars: false, metal: '#2a1a0c', glassFill: 'rgba(255,214,120,1)' });
    g.strokeStyle = '#17110c'; g.lineWidth = 9; g.beginPath(); g.arc(c, c, S * 0.16, 0, TAU); g.stroke();
    g.strokeStyle = '#2b2622'; g.lineWidth = 16; g.beginPath(); g.arc(c, c, S * 0.49, 0, TAU); g.stroke();
  }

  function paintBooks(g, w, h, seed, shelves) {
    const R = mulberry32(seed);
    const PAL = [[0, 55, 26], [215, 45, 24], [140, 40, 20], [38, 60, 34], [280, 30, 24], [190, 45, 22], [25, 45, 22], [8, 40, 34], [45, 20, 46], [160, 30, 18]];
    g.fillStyle = '#1c120a'; g.fillRect(0, 0, w, h);
    const n = shelves || 5, sh = h / n, board = 16;
    for (let s = 0; s < n; s++) {
      const y0 = s * sh, base = y0 + sh - board;
      const bg = g.createLinearGradient(0, y0, 0, base);
      bg.addColorStop(0, '#0c0704'); bg.addColorStop(1, '#2a1a0e');
      g.fillStyle = bg; g.fillRect(0, y0, w, sh - board);
      let x = 6;
      while (x < w - 6) {
        if (R() < 0.05) { x += 12 + R() * 30; continue; }
        const bw = Math.min(w - 6 - x, 10 + R() * 20), bh = (sh - board - 14) * (0.6 + R() * 0.38);
        if (bw < 6) break;
        const p = PAL[Math.floor(R() * PAL.length)];
        const l = p[2] + (R() - 0.5) * 10;
        const lean = R() < 0.06 ? (R() < 0.5 ? -0.18 : 0.18) : 0;
        g.save(); g.translate(x + bw / 2, base); g.rotate(lean);
        g.fillStyle = 'hsl(' + p[0] + ',' + p[1] + '%,' + l + '%)';
        g.fillRect(-bw / 2 + 0.8, -bh, bw - 1.6, bh);
        const sg = g.createLinearGradient(-bw / 2, 0, bw / 2, 0);
        sg.addColorStop(0, 'rgba(0,0,0,0.45)'); sg.addColorStop(0.35, 'rgba(255,255,255,0.12)'); sg.addColorStop(1, 'rgba(0,0,0,0.5)');
        g.fillStyle = sg; g.fillRect(-bw / 2 + 0.8, -bh, bw - 1.6, bh);
        if (R() < 0.7) {
          g.fillStyle = 'rgba(232,190,100,0.85)';
          g.fillRect(-bw / 2 + 1.5, -bh + 6, bw - 3, 2); g.fillRect(-bw / 2 + 1.5, -10, bw - 3, 2);
          if (R() < 0.5) g.fillRect(-bw / 2 + 1.5, -bh + 11, bw - 3, 1.5);
        }
        if (R() < 0.4) { g.fillStyle = 'rgba(240,226,190,0.75)'; g.fillRect(-bw / 2 + 2.5, -bh * 0.62, bw - 5, bh * 0.16); }
        g.restore();
        x += bw;
      }
      const bd = g.createLinearGradient(0, base, 0, base + board);
      bd.addColorStop(0, '#7a5232'); bd.addColorStop(0.3, '#5a3a20'); bd.addColorStop(1, '#2a180c');
      g.fillStyle = bd; g.fillRect(0, base, w, board);
    }
  }

  function paintMosaic(g, S) {
    const R = mulberry32(41);
    const c = S / 2;
    g.clearRect(0, 0, S, S);
    g.fillStyle = '#2a241c'; g.beginPath(); g.arc(c, c, c - 1, 0, TAU); g.fill();
    const step = 9;
    for (let r = 4; r < c - 4; r += step) {
      const fr = r / c, n = Math.max(1, Math.floor(TAU * r / step));
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        let col;
        const ray = ((a / TAU * 9) % 1);
        if (fr > 0.93) col = R() < 0.5 ? '#b8743e' : '#a0602e';
        else if (fr > 0.85) col = (i % 8 < 2) ? '#1e3470' : '#e6d8b4';
        else if (fr > 0.80) col = '#b8743e';
        else if (fr > 0.40) col = (ray < 0.07 || ray > 0.93) ? '#e8b85a' : (fr > 0.62 && fr < 0.66 ? '#e6d8b4' : (R() < 0.5 ? '#1c2f68' : '#22397a'));
        else if (fr > 0.36) col = '#b8743e';
        else col = R() < 0.5 ? '#e9dcb8' : '#ddd0a8';
        g.save(); g.translate(c + Math.cos(a) * r, c + Math.sin(a) * r); g.rotate(a);
        g.fillStyle = col; g.fillRect(-step / 2 + 1, -step / 2 + 1, step - 2, step - 2);
        g.fillStyle = 'rgba(255,255,255,' + (R() * 0.08) + ')'; g.fillRect(-step / 2 + 1, -step / 2 + 1, step - 2, step - 2);
        g.restore();
      }
    }
    drawLantern(g, c, c + 10, S / 520, { stars: false });
    g.fillStyle = '#f0c870';
    for (let i = 0; i < 9; i++) { const a = -PI / 2 + i * TAU / 9; star(g, c + Math.cos(a) * S * 0.6 * 0.5 * 1.2, c + Math.sin(a) * S * 0.6 * 0.5 * 1.2, 14, 5); }
  }

  function paintRugRound(g, S, scheme) {
    const c = S / 2;
    const cols = scheme === 'blue' ? ['#1a2a5a', '#c27a45', '#22397a', '#e6d0a0', '#1a2a5a'] : ['#5a1a1a', '#d8a050', '#7a2424', '#e6d0a0', '#4a1414'];
    g.clearRect(0, 0, S, S);
    const rs = [1, 0.92, 0.86, 0.6, 0.54];
    for (let i = 0; i < rs.length; i++) { g.fillStyle = cols[i]; g.beginPath(); g.arc(c, c, c * rs[i] - 1, 0, TAU); g.fill(); }
    g.strokeStyle = cols[1]; g.lineWidth = 3;
    for (let i = 0; i < 24; i++) { const a = i * TAU / 24; g.beginPath(); g.moveTo(c + Math.cos(a) * c * 0.62, c + Math.sin(a) * c * 0.62); g.lineTo(c + Math.cos(a) * c * 0.84, c + Math.sin(a) * c * 0.84); g.stroke(); }
    g.fillStyle = cols[1];
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.ellipse(c + Math.cos(a) * c * 0.3, c + Math.sin(a) * c * 0.3, c * 0.1, c * 0.04, a, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(c, c, c * 0.1, 0, TAU); g.fill();
    wovenLines(g, S, S, 0.06);
  }
  function paintRugRect(g, w, h, scheme) {
    const a = scheme === 'blue' ? ['#1a2a5a', '#c27a45', '#22397a', '#e6d0a0'] : ['#5a1a1a', '#d8a050', '#7a2424', '#e6d0a0'];
    g.fillStyle = a[0]; g.fillRect(0, 0, w, h);
    g.strokeStyle = a[1]; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
    g.lineWidth = 3; g.strokeStyle = a[3]; g.strokeRect(28, 28, w - 56, h - 56);
    g.fillStyle = a[2]; g.fillRect(36, 36, w - 72, h - 72);
    g.fillStyle = a[1];
    for (let x = 60; x < w - 40; x += 70) { g.beginPath(); g.moveTo(x, h / 2 - 22); g.lineTo(x + 22, h / 2); g.lineTo(x, h / 2 + 22); g.lineTo(x - 22, h / 2); g.closePath(); g.fill(); }
    wovenLines(g, w, h, 0.06);
  }

  function paintBlackboard(g, w, h) {
    const R = mulberry32(51);
    g.fillStyle = '#1d2a24'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.02 + R() * 0.03) + ')'; g.beginPath(); g.ellipse(R() * w, R() * h, 30 + R() * 90, 8 + R() * 20, R() * 3, 0, TAU); g.fill(); }
    function chalk(fn, col, lw) {
      g.strokeStyle = col || 'rgba(240,240,230,0.85)'; g.fillStyle = g.strokeStyle; g.lineWidth = lw || 3; g.lineCap = 'round'; g.lineJoin = 'round';
      fn(0, 0); g.globalAlpha = 0.35; fn(1.5, 1); g.globalAlpha = 1;
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    chalk(function (ox, oy) { g.font = 'bold 50px "Frank Ruehl CLM", "David", "FreeSerif", serif'; g.direction = 'rtl'; g.fillText('לחשים · שיעור ראשון', w * 0.5 + ox, 46 + oy); g.direction = 'ltr'; });
    chalk(function (ox, oy) { g.font = 'italic 30px Georgia, "FreeSerif", serif'; g.fillText('Charms · Lesson One', w * 0.5 + ox, 92 + oy); });
    // clock with gears (Dov!)
    chalk(function (ox, oy) {
      const cx = 150 + ox, cy = 270 + oy;
      g.beginPath(); g.arc(cx, cy, 80, 0, TAU); g.stroke();
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(cx + Math.sin(a) * 66, cy - Math.cos(a) * 66); g.lineTo(cx + Math.sin(a) * 76, cy - Math.cos(a) * 76); g.stroke(); }
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 34, cy - 30); g.moveTo(cx, cy); g.lineTo(cx - 8, cy - 58); g.stroke();
      const gx = cx + 96, gy = cy + 62;
      g.beginPath();
      for (let i = 0; i <= 24; i++) { const a = i * TAU / 24, rr = i % 2 ? 26 : 34; if (i === 0) g.moveTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); else g.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); }
      g.stroke(); g.beginPath(); g.arc(gx, gy, 8, 0, TAU); g.stroke();
    });
    chalk(function (ox, oy) { g.font = 'italic 26px Georgia, "FreeSerif", serif'; g.fillText('tick · tock · ✶ boom!', 170 + ox, 400 + oy); });
    // wand motion diagram: Lumos
    chalk(function (ox, oy) {
      const x0 = 400 + ox, y0 = 330 + oy;
      g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x0 + 40, y0 - 120, x0 + 120, y0 - 120, x0 + 150, y0 - 40); g.stroke();
      g.beginPath(); g.moveTo(x0 + 150, y0 - 40); g.lineTo(x0 + 134, y0 - 52); g.moveTo(x0 + 150, y0 - 40); g.lineTo(x0 + 156, y0 - 58); g.stroke();
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(x0 + 170 + Math.cos(a) * 10, y0 - 70 + Math.sin(a) * 10); g.lineTo(x0 + 170 + Math.cos(a) * 22, y0 - 70 + Math.sin(a) * 22); g.stroke(); }
      g.font = 'italic 34px Georgia, "FreeSerif", serif'; g.fillText('Lumos', x0 + 70, y0 + 34);
    }, 'rgba(250,236,170,0.9)');
    chalk(function (ox, oy) {
      const x0 = 700 + ox, y0 = 300 + oy;
      g.beginPath(); g.moveTo(x0, y0 + 40); g.lineTo(x0 + 70, y0 - 50); g.lineTo(x0 + 140, y0 + 40); g.stroke();
      g.beginPath(); g.moveTo(x0 + 140, y0 + 40); g.lineTo(x0 + 122, y0 + 36); g.moveTo(x0 + 140, y0 + 40); g.lineTo(x0 + 138, y0 + 20); g.stroke();
      g.font = 'italic 30px Georgia, "FreeSerif", serif'; g.fillText('Stupefy', x0 + 70, y0 + 84);
    }, 'rgba(200,225,255,0.9)');
    chalk(function (ox, oy) {
      // simple lantern doodle
      const x0 = 900 + ox, y0 = 210 + oy;
      g.strokeRect(x0 - 26, y0 - 40, 52, 76); g.beginPath(); g.arc(x0, y0 - 54, 9, 0, TAU); g.moveTo(x0 - 32, y0 - 40); g.lineTo(x0, y0 - 60); g.lineTo(x0 + 32, y0 - 40); g.stroke();
      g.beginPath(); g.moveTo(x0, y0 - 18); g.quadraticCurveTo(x0 + 12, y0 + 4, x0, y0 + 16); g.quadraticCurveTo(x0 - 12, y0 + 4, x0, y0 - 18); g.stroke();
      g.font = 'bold 30px Georgia, "FreeSerif", serif'; g.fillText('× 9', x0, y0 + 70);
    }, 'rgba(255,210,150,0.9)');
    g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 800; i++) g.fillRect(R() * w, R() * h, 2, 1);
  }

  function paintClock(g, S, o) {
    o = o || {};
    const c = S / 2;
    const gr = g.createRadialGradient(c, c, 8, c, c, c);
    gr.addColorStop(0, o.face0 || '#fff7da'); gr.addColorStop(0.85, o.face1 || '#efd8a0'); gr.addColorStop(1, '#8a6a2a');
    g.fillStyle = gr; g.beginPath(); g.arc(c, c, c - 4, 0, TAU); g.fill();
    g.strokeStyle = '#3a2a14'; g.lineWidth = S / 40; g.stroke();
    g.fillStyle = '#3a2a14'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold ' + Math.floor(S / 9) + 'px Georgia, serif';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      g.lineWidth = i % 3 === 0 ? S / 34 : S / 70;
      g.beginPath(); g.moveTo(c + Math.sin(a) * c * 0.78, c - Math.cos(a) * c * 0.78); g.lineTo(c + Math.sin(a) * c * 0.88, c - Math.cos(a) * c * 0.88); g.stroke();
      if (o.numerals !== false && i % 3 === 0) g.fillText(String(i === 0 ? 12 : i), c + Math.sin(a) * c * 0.62, c - Math.cos(a) * c * 0.62);
    }
    g.fillStyle = '#3a2a14'; g.beginPath(); g.arc(c, c, S / 30, 0, TAU); g.fill();
  }

  function paintSymbol(g, S, kind) {
    // stone plaque with an engraved, gold-filled symbol
    const R = mulberry32(60 + kind);
    g.fillStyle = '#8c8578'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'; g.fillRect(R() * S, R() * S, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 8; g.strokeRect(14, 14, S - 28, S - 28);
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 3; g.strokeRect(20, 20, S - 40, S - 40);
    const c = S / 2;
    function path() {
      g.beginPath();
      if (kind === 1) { // wave
        for (let k = 0; k < 2; k++) {
          const y = c - 18 + k * 40;
          g.moveTo(c - 70, y);
          for (let x = -70; x <= 70; x += 4) g.lineTo(c + x, y + Math.sin(x * 0.075) * 14);
        }
      } else if (kind === 2) { // crescent moon
        g.arc(c, c, 62, PI * 0.25, PI * 1.75);
        g.arc(c + 30, c - 6, 50, PI * 1.62, PI * 0.38, true);
        g.closePath();
      } else if (kind === 3) { // flame
        g.moveTo(c, c - 72);
        g.bezierCurveTo(c + 30, c - 30, c + 56, c + 10, c + 34, c + 52);
        g.quadraticCurveTo(c, c + 76, c - 34, c + 52);
        g.bezierCurveTo(c - 56, c + 10, c - 14, c - 14, c, c - 72);
        g.moveTo(c, c - 8); g.quadraticCurveTo(c + 22, c + 26, c, c + 50); g.quadraticCurveTo(c - 22, c + 26, c, c - 8);
      } else if (kind === 4) { // star
        for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? 28 : 70; if (i === 0) g.moveTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); else g.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); }
        g.closePath();
      } else { // sun
        g.arc(c, c, 34, 0, TAU);
        for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.moveTo(c + Math.cos(a) * 46, c + Math.sin(a) * 46); g.lineTo(c + Math.cos(a) * 72, c + Math.sin(a) * 72); }
      }
    }
    const filled = kind === 2 || kind === 4;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.save(); g.translate(3, 3); path(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 12; g.stroke(); g.restore();
    path(); g.strokeStyle = 'rgba(30,20,10,0.9)'; g.lineWidth = 12; g.stroke();
    path(); g.strokeStyle = '#e6b552'; g.lineWidth = 6; g.stroke();
    if (filled) { path(); g.fillStyle = '#d9a446'; g.fill(); }
  }

  function signTexture(he, en) {
    return mkTexClamp(512, 168, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#5a3820'); gr.addColorStop(1, '#2e1a0c');
      roundRect(g, 4, 4, w - 8, h - 8, 22); g.fillStyle = gr; g.fill();
      g.lineWidth = 7; g.strokeStyle = '#c9964a'; g.stroke();
      roundRect(g, 16, 16, w - 32, h - 32, 14); g.lineWidth = 2; g.strokeStyle = 'rgba(240,200,120,0.6)'; g.stroke();
      g.fillStyle = '#c9964a';
      [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 5, 0, TAU); g.fill(); });
      g.textAlign = 'center'; g.textBaseline = 'middle';
      function fit(txt, font, size, max) { let s = size; g.font = font.replace('#', s); while (g.measureText(txt).width > max && s > 14) { s -= 2; g.font = font.replace('#', s); } }
      g.direction = 'rtl';
      fit(he, 'bold #px "Frank Ruehl CLM", "David", "FreeSerif", serif', 58, w - 80);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(he, w / 2 + 2, 64 + 2);
      g.fillStyle = '#f4d68e'; g.fillText(he, w / 2, 64);
      g.direction = 'ltr';
      fit(en, 'italic #px Georgia, "FreeSerif", serif', 36, w - 90);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(en, w / 2 + 2, 120 + 2);
      g.fillStyle = '#e8cfa0'; g.fillText(en, w / 2, 120);
    });
  }

  // glowing violet cracks (transparent background); radial = spreading from the centre, else rising from the bottom
  function paintCracks(g, S, seed, radial) {
    g.clearRect(0, 0, S, S);
    g.lineCap = 'round'; g.lineJoin = 'round';
    function draw(pass) {
      const rr = mulberry32(seed);
      function cr(x, y, a, len, wdt, d) {
        let px = x, py = y;
        g.lineWidth = pass === 0 ? wdt * 3 : wdt;
        g.beginPath(); g.moveTo(px, py);
        for (let k = 0; k < 6; k++) { a += (rr() - 0.5) * 0.9; px += Math.cos(a) * len / 6; py += Math.sin(a) * len / 6; g.lineTo(px, py); }
        g.stroke();
        if (d > 0) { cr(px, py, a - 0.5 - rr() * 0.3, len * 0.62, wdt * 0.62, d - 1); if (rr() < 0.8) cr(px, py, a + 0.45 + rr() * 0.3, len * 0.55, wdt * 0.6, d - 1); }
      }
      if (radial) {
        for (let i = 0; i < 7; i++) {
          const a = i * TAU / 7 + rr() * 0.5;
          cr(S / 2 + Math.cos(a) * S * 0.06, S / 2 + Math.sin(a) * S * 0.06, a, S * 0.22, S / 200, 3);
        }
      } else {
        cr(S * (0.4 + rr() * 0.2), S * 0.98, -PI / 2 + (rr() - 0.5) * 0.4, S * 0.34, S / 110, 3);
        cr(S * (0.3 + rr() * 0.4), S * 0.98, -PI / 2 + (rr() - 0.5) * 0.6, S * 0.2, S / 160, 2);
      }
    }
    g.strokeStyle = 'rgba(150,70,255,0.35)'; g.shadowColor = 'rgba(170,80,255,1)'; g.shadowBlur = 18; draw(0);
    g.strokeStyle = 'rgba(235,200,255,0.95)'; g.shadowBlur = 6; draw(1);
    g.shadowBlur = 0;
  }
  function paintWeb(g, S) {
    g.clearRect(0, 0, S, S);
    g.strokeStyle = 'rgba(220,220,230,0.55)'; g.lineWidth = 1.2;
    const n = 9;
    for (let i = 0; i < n; i++) { const a = i / (n - 1) * PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * S, Math.sin(a) * S); g.stroke(); }
    for (let r = 20; r < S; r += 22) {
      g.beginPath();
      for (let i = 0; i < n; i++) { const a = i / (n - 1) * PI / 2, rr = r * (0.92 + 0.08 * Math.sin(i * 2)); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
  }

  function paintFlame(g, w, h) {
    g.clearRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, h * 0.7, 1, w / 2, h * 0.62, h * 0.5);
    gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.25, 'rgba(255,220,120,0.95)'); gr.addColorStop(0.6, 'rgba(255,130,40,0.6)'); gr.addColorStop(1, 'rgba(200,60,10,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(w / 2, 2);
    g.bezierCurveTo(w * 0.62, h * 0.35, w * 0.98, h * 0.6, w * 0.82, h * 0.86);
    g.quadraticCurveTo(w / 2, h, w * 0.18, h * 0.86);
    g.bezierCurveTo(w * 0.02, h * 0.6, w * 0.38, h * 0.35, w / 2, 2);
    g.fill();
  }

  function paintNotice(g, S) {
    const R = mulberry32(81);
    g.fillStyle = '#8a6a44'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2500; i++) { g.fillStyle = R() < 0.5 ? 'rgba(60,40,20,0.3)' : 'rgba(200,160,110,0.25)'; g.fillRect(R() * S, R() * S, 2, 2); }
    g.strokeStyle = '#3a2410'; g.lineWidth = 14; g.strokeRect(0, 0, S, S);
    const papers = [[30, 30, 90, 110, -0.08], [140, 26, 86, 70, 0.06], [128, 110, 100, 116, -0.03], [34, 150, 80, 80, 0.1]];
    papers.forEach(function (p, i) {
      g.save(); g.translate(p[0] + p[2] / 2, p[1] + p[3] / 2); g.rotate(p[4]);
      g.fillStyle = i === 2 ? '#e8d2a0' : '#f2e6c8'; g.fillRect(-p[2] / 2, -p[3] / 2, p[2], p[3]);
      g.fillStyle = 'rgba(60,40,20,0.65)';
      for (let y = -p[3] / 2 + 14; y < p[3] / 2 - 8; y += 9) g.fillRect(-p[2] / 2 + 8, y, (p[2] - 16) * (0.5 + R() * 0.5), 2);
      if (i === 1) drawLantern(g, 0, 4, 0.18, { stars: false });
      g.fillStyle = ['#c03030', '#2a5ab0', '#d0a030', '#3a8a3a'][i]; g.beginPath(); g.arc(0, -p[3] / 2 + 6, 4, 0, TAU); g.fill();
      g.restore();
    });
  }

  function paintGlobe(g, w, h) {
    const R = mulberry32(91);
    g.fillStyle = '#2a5a7a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      g.fillStyle = R() < 0.5 ? '#c8a860' : '#a88a48';
      g.beginPath(); const x = R() * w, y = h * 0.2 + R() * h * 0.6;
      g.moveTo(x, y); for (let k = 0; k < 8; k++) g.lineTo(x + (R() - 0.3) * 40, y + (R() - 0.5) * 30); g.fill();
    }
    g.strokeStyle = 'rgba(255,240,200,0.4)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += w / 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += h / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }

  function paintLeaded(g, w, h) {
    // clear leaded diamond panes with a daylight sky (classroom)
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#9ec4ee'); sky.addColorStop(0.65, '#d8ecf8'); sky.addColorStop(1, '#f6e8c8');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.7)';
    [[0.25, 0.25, 40], [0.65, 0.18, 55], [0.5, 0.42, 30]].forEach(function (c) { g.beginPath(); g.ellipse(c[0] * w, c[1] * h, c[2] * 1.8, c[2] * 0.6, 0, 0, TAU); g.fill(); });
    g.fillStyle = '#5a7a5a'; g.beginPath(); g.moveTo(0, h * 0.8); g.quadraticCurveTo(w * 0.4, h * 0.66, w, h * 0.78); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.strokeStyle = 'rgba(40,36,32,0.9)'; g.lineWidth = 3;
    const d = w / 6;
    for (let k = -12; k < 24; k++) { g.beginPath(); g.moveTo(k * d, 0); g.lineTo(k * d + h, h); g.stroke(); g.beginPath(); g.moveTo(k * d, 0); g.lineTo(k * d - h, h); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, Math.random() * h, 12, 2);
  }

  // registry of lazily-built shared textures (all keep = true)
  const PAINT = {
    stone: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 8, minW: 70, maxW: 150, hue: 32, sat: 7, l0: 30, l1: 42, grout: '#221e1a', seed: 3 }); }, [3, 3]); },
    stoneWarm: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 6, minW: 100, maxW: 220, hue: 32, sat: 9, l0: 30, l1: 43, grout: '#221c16', seed: 4, hueVar: 10, moss: 0.06 }); }, [3.6, 3.6]); },
    stoneOut: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 8, minW: 70, maxW: 150, hue: 220, sat: 6, l0: 30, l1: 42, grout: '#1a1c22', seed: 5, moss: 0.25 }); }, [4, 4]); },
    stoneDark: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 8, minW: 70, maxW: 160, hue: 230, sat: 6, l0: 18, l1: 27, grout: '#08080a', seed: 6, moss: 0.2, hi: 0.08 }); }, [3, 3]); },
    trim: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 4, minW: 150, maxW: 260, hue: 36, sat: 12, l0: 50, l1: 60, grout: '#4a4034', seed: 8, gap: 2, hi: 0.18 }); }, [2, 2]); },
    trimDark: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 4, minW: 150, maxW: 260, hue: 230, sat: 5, l0: 24, l1: 32, grout: '#101014', seed: 9, gap: 2 }); }, [2, 2]); },
    flag: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 4, minW: 110, maxW: 220, hue: 34, sat: 8, l0: 30, l1: 42, grout: '#17130f', seed: 10, gap: 4, round: 8, hueVar: 14 }); }, [4, 4]); },
    flagOut: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 4, minW: 110, maxW: 220, hue: 215, sat: 6, l0: 32, l1: 44, grout: '#1a1d1a', seed: 11, gap: 5, round: 8, moss: 0.4 }); }, [4, 4]); },
    flagDark: function () { return mkTex(512, 512, function (g, S) { paintBlocks(g, S, { rows: 4, minW: 110, maxW: 220, hue: 230, sat: 6, l0: 16, l1: 25, grout: '#060607', seed: 12, gap: 4, round: 8 }); }, [4, 4]); },
    planks: function () { return mkTex(512, 512, function (g, S) { paintPlanks(g, S, { hue: 28, sat: 42, l0: 22, l1: 32, seed: 13 }); }, [2.4, 2.4]); },
    planksDark: function () { return mkTex(512, 512, function (g, S) { paintPlanks(g, S, { hue: 22, sat: 38, l0: 12, l1: 19, seed: 14, count: 8 }); }, [3, 3]); },
    wood: function () { return mkTex(256, 256, function (g, S) { paintGrain(g, S, { base: '#4a2c16', seed: 15 }); }, [1.2, 1.2]); },
    woodDark: function () { return mkTex(256, 256, function (g, S) { paintGrain(g, S, { base: '#2c190c', seed: 16 }); }, [1.2, 1.2]); },
    grass: function () { return mkTex(256, 256, function (g, S) { const R = mulberry32(17); g.fillStyle = '#16251a'; g.fillRect(0, 0, S, S); for (let i = 0; i < 6000; i++) { g.fillStyle = 'hsl(' + (95 + R() * 45) + ',' + (25 + R() * 25) + '%,' + (8 + R() * 20) + '%)'; g.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 3); } }, [5, 5]); },
    road: function () { return mkTex(256, 256, function (g, S) { const R = mulberry32(18); paintSpeckle(g, S, '#3a3024', ['#5a4a36', '#2a2018', '#6a5a46', '#4a3c2c'], 5000, R); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(120,110,100,0.5)'; g.beginPath(); g.ellipse(R() * S, R() * S, 2 + R() * 4, 2 + R() * 3, R() * 3, 0, TAU); g.fill(); } }, [5, 5]); },
    water: function () { return mkTex(512, 512, function (g, S) { const R = mulberry32(19); g.fillStyle = '#0a1830'; g.fillRect(0, 0, S, S); for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(120,160,220,' + (0.04 + R() * 0.12) + ')'; g.fillRect(R() * S, R() * S, 20 + R() * 60, 1.5); } }, [10, 10]); },
    banner: function () { return mkTexClamp(256, 512, paintBanner); },
    tapCastle: function () { return mkTexClamp(256, 512, function (g, w, h) { paintTapestry(g, w, h, 'castle'); }); },
    tapTree: function () { return mkTexClamp(256, 512, function (g, w, h) { paintTapestry(g, w, h, 'tree'); }); },
    tapStars: function () { return mkTexClamp(256, 512, function (g, w, h) { paintTapestry(g, w, h, 'stars'); }); },
    paintLake: function () { return mkTexClamp(256, 192, function (g, w, h) { paintPainting(g, w, h, 'lake'); }); },
    paintTower: function () { return mkTexClamp(192, 256, function (g, w, h) { paintPainting(g, w, h, 'tower'); }); },
    paintStill: function () { return mkTexClamp(256, 192, function (g, w, h) { paintPainting(g, w, h, 'still'); }); },
    glassA: function () { return mkTexClamp(256, 512, function (g, w, h) { paintStained(g, w, h, 31); }); },
    glassB: function () { return mkTexClamp(256, 512, function (g, w, h) { paintStained(g, w, h, 37, ['#1d3a8a', '#2a5db0', '#3a7fbf', '#1f6f7a', '#b8862a', '#2c4a9a']); }); },
    rose: function () { return mkTexClamp(512, 512, paintRose); },
    books1: function () { return mkTex(512, 1024, function (g, w, h) { paintBooks(g, w, h, 101, 5); }, null); },
    books2: function () { return mkTex(512, 1024, function (g, w, h) { paintBooks(g, w, h, 202, 5); }, null); },
    books3: function () { return mkTex(512, 512, function (g, w, h) { paintBooks(g, w, h, 303, 3); }, null); },
    mosaic: function () { return mkTexClamp(1024, 1024, paintMosaic); },
    rugBlue: function () { return mkTexClamp(512, 512, function (g, S) { paintRugRound(g, S, 'blue'); }); },
    rugRed: function () { return mkTexClamp(512, 512, function (g, S) { paintRugRound(g, S, 'red'); }); },
    runnerBlue: function () { return mkTex(1024, 256, function (g, w, h) { paintRugRect(g, w, h, 'blue'); }, null); },
    runnerRed: function () { return mkTex(1024, 256, function (g, w, h) { paintRugRect(g, w, h, 'red'); }, null); },
    blackboard: function () { return mkTexClamp(1024, 448, paintBlackboard); },
    clock: function () { return mkTexClamp(256, 256, function (g, S) { paintClock(g, S); }); },
    clock2: function () { return mkTexClamp(256, 256, function (g, S) { paintClock(g, S, { face0: '#f4f0e6', face1: '#c8d0d8', numerals: false }); }); },
    sym1: function () { return mkTexClamp(256, 256, function (g, S) { paintSymbol(g, S, 1); }); },
    sym2: function () { return mkTexClamp(256, 256, function (g, S) { paintSymbol(g, S, 2); }); },
    sym3: function () { return mkTexClamp(256, 256, function (g, S) { paintSymbol(g, S, 3); }); },
    sym4: function () { return mkTexClamp(256, 256, function (g, S) { paintSymbol(g, S, 4); }); },
    sym5: function () { return mkTexClamp(256, 256, function (g, S) { paintSymbol(g, S, 5); }); },
    cracks: function () { return mkTexClamp(1024, 1024, function (g, S) { paintCracks(g, S, 71, true); }); },
    cracks2: function () { return mkTexClamp(512, 512, function (g, S) { paintCracks(g, S, 72, true); }); },
    cracksWall: function () { return mkTexClamp(512, 512, function (g, S) { paintCracks(g, S, 73, false); }); },
    web: function () { return mkTexClamp(256, 256, paintWeb); },
    flame: function () { return mkTexClamp(64, 128, paintFlame); },
    notice: function () { return mkTexClamp(256, 256, paintNotice); },
    globe: function () { return mkTex(256, 128, paintGlobe, null); },
    leaded: function () { return mkTexClamp(512, 512, paintLeaded); }
  };
  const TEX = {};
  function T(name) { if (!TEX[name]) TEX[name] = keep(PAINT[name]()); return TEX[name]; }

  // shared materials (keep)
  const MAT = {};
  const MATDEF = {
    stone: function () { return new THREE.MeshStandardMaterial({ map: T('stone'), roughness: 0.92, metalness: 0 }); },
    stoneWarm: function () { return new THREE.MeshStandardMaterial({ map: T('stoneWarm'), roughness: 0.92 }); },
    stoneOut: function () { return new THREE.MeshStandardMaterial({ map: T('stoneOut'), roughness: 0.95 }); },
    stoneDark: function () { return new THREE.MeshStandardMaterial({ map: T('stoneDark'), roughness: 0.95 }); },
    trim: function () { return new THREE.MeshStandardMaterial({ map: T('trim'), roughness: 0.85 }); },
    trimDark: function () { return new THREE.MeshStandardMaterial({ map: T('trimDark'), roughness: 0.9 }); },
    flag: function () { return new THREE.MeshStandardMaterial({ map: T('flag'), roughness: 0.85 }); },
    flagOut: function () { return new THREE.MeshStandardMaterial({ map: T('flagOut'), roughness: 0.92 }); },
    flagDark: function () { return new THREE.MeshStandardMaterial({ map: T('flagDark'), roughness: 0.8 }); },
    planks: function () { return new THREE.MeshStandardMaterial({ map: T('planks'), roughness: 0.75 }); },
    planksDark: function () { return new THREE.MeshStandardMaterial({ map: T('planksDark'), roughness: 0.85 }); },
    wood: function () { return new THREE.MeshStandardMaterial({ map: T('wood'), roughness: 0.7 }); },
    woodDark: function () { return new THREE.MeshStandardMaterial({ map: T('woodDark'), roughness: 0.75 }); },
    grass: function () { return new THREE.MeshStandardMaterial({ map: T('grass'), roughness: 1 }); },
    road: function () { return new THREE.MeshStandardMaterial({ map: T('road'), roughness: 1 }); },
    iron: function () { return new THREE.MeshStandardMaterial({ color: 0x2a2b30, roughness: 0.5, metalness: 0.7 }); },
    ironLight: function () { return new THREE.MeshStandardMaterial({ color: 0x55565e, roughness: 0.45, metalness: 0.75 }); },
    steel: function () { return new THREE.MeshStandardMaterial({ color: 0xa8b0ba, roughness: 0.3, metalness: 0.85 }); },
    brass: function () { return new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: 0.35, metalness: 0.85 }); },
    copper: function () { return new THREE.MeshStandardMaterial({ color: 0xc27a45, roughness: 0.4, metalness: 0.8 }); },
    gold: function () { return new THREE.MeshStandardMaterial({ color: 0xe8c060, roughness: 0.3, metalness: 0.9, emissive: 0x3a2400, emissiveIntensity: 0.4 }); },
    blueCloth: function () { return new THREE.MeshStandardMaterial({ color: 0x1d2f6a, roughness: 0.95 }); },
    redCloth: function () { return new THREE.MeshStandardMaterial({ color: 0x6a1a1e, roughness: 0.95 }); },
    greenCloth: function () { return new THREE.MeshStandardMaterial({ color: 0x24442c, roughness: 0.95 }); },
    creamCloth: function () { return new THREE.MeshStandardMaterial({ color: 0xd8c8a0, roughness: 0.95 }); },
    copperCloth: function () { return new THREE.MeshStandardMaterial({ color: 0xa8643a, roughness: 0.9 }); },
    wax: function () { return new THREE.MeshStandardMaterial({ color: 0xf2e6c8, roughness: 0.6, emissive: 0x3a2a10, emissiveIntensity: 0.5 }); },
    black: function () { return new THREE.MeshBasicMaterial({ color: 0x000000 }); },
    voidDark: function () { return new THREE.MeshBasicMaterial({ color: 0x050403 }); },
    paper: function () { return new THREE.MeshStandardMaterial({ color: 0xeee2c4, roughness: 0.9 }); },
    banner: function () { return new THREE.MeshStandardMaterial({ map: T('banner'), transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 }); },
    tapCastle: function () { return new THREE.MeshStandardMaterial({ map: T('tapCastle'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }); },
    tapTree: function () { return new THREE.MeshStandardMaterial({ map: T('tapTree'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }); },
    tapStars: function () { return new THREE.MeshStandardMaterial({ map: T('tapStars'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }); },
    paintLake: function () { return new THREE.MeshStandardMaterial({ map: T('paintLake'), roughness: 0.6 }); },
    paintTower: function () { return new THREE.MeshStandardMaterial({ map: T('paintTower'), roughness: 0.6 }); },
    paintStill: function () { return new THREE.MeshStandardMaterial({ map: T('paintStill'), roughness: 0.6 }); },
    glassA: function () { return new THREE.MeshBasicMaterial({ map: T('glassA'), color: 0x8a94c4 }); },
    glassB: function () { return new THREE.MeshBasicMaterial({ map: T('glassB'), color: 0x8a94c4 }); },
    glassWarm: function () { return new THREE.MeshBasicMaterial({ map: T('glassA'), color: 0xffe0b0 }); },
    rose: function () { return new THREE.MeshBasicMaterial({ map: T('rose'), color: 0xa8b0e0 }); },
    books1: function () { return new THREE.MeshStandardMaterial({ map: T('books1'), roughness: 0.85 }); },
    books2: function () { return new THREE.MeshStandardMaterial({ map: T('books2'), roughness: 0.85 }); },
    books3: function () { return new THREE.MeshStandardMaterial({ map: T('books3'), roughness: 0.85 }); },
    mosaic: function () { return new THREE.MeshStandardMaterial({ map: T('mosaic'), roughness: 0.55, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); },
    rugBlue: function () { return new THREE.MeshStandardMaterial({ map: T('rugBlue'), roughness: 1, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }); },
    rugRed: function () { return new THREE.MeshStandardMaterial({ map: T('rugRed'), roughness: 1, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }); },
    runnerBlue: function () { return new THREE.MeshStandardMaterial({ map: T('runnerBlue'), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }); },
    runnerRed: function () { return new THREE.MeshStandardMaterial({ map: T('runnerRed'), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }); },
    blackboard: function () { return new THREE.MeshStandardMaterial({ map: T('blackboard'), roughness: 0.9, emissive: 0xffffff, emissiveMap: T('blackboard'), emissiveIntensity: 0.12 }); },
    clock: function () { return new THREE.MeshStandardMaterial({ map: T('clock'), roughness: 0.5, emissive: 0x2a2010, emissiveIntensity: 0.4 }); },
    clock2: function () { return new THREE.MeshStandardMaterial({ map: T('clock2'), roughness: 0.5 }); },
    web: function () { return new THREE.MeshBasicMaterial({ map: T('web'), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.5 }); },
    notice: function () { return new THREE.MeshStandardMaterial({ map: T('notice'), roughness: 0.9 }); },
    globe: function () { return new THREE.MeshStandardMaterial({ map: T('globe'), roughness: 0.5 }); },
    leaded: function () { return new THREE.MeshBasicMaterial({ map: T('leaded') }); },
    ember: function () { return new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xff5a10, emissiveIntensity: 0.8, roughness: 1 }); },
    log: function () { return new THREE.MeshStandardMaterial({ map: T('woodDark'), roughness: 1 }); },
    // sprite materials
    flameS: function () { return new THREE.SpriteMaterial({ map: T('flame'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); },
    glowWarm: function () { return new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,170,70,0.75)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }); },
    glowSoft: function () { return new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,180,90,0.5)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 }); },
    glowCool: function () { return new THREE.SpriteMaterial({ map: U.glowTexture('rgba(140,170,255,0.6)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 }); },
    glowWindow: function () { return new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,190,100,0.7)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7, fog: false }); }
  };
  function M(name) { if (!MAT[name]) MAT[name] = keep(MATDEF[name]()); return MAT[name]; }

  // shared unit geometries (keep)
  const GEO = {};
  const GEODEF = {
    box: function () { return new THREE.BoxGeometry(1, 1, 1); },
    cyl: function () { return new THREE.CylinderGeometry(1, 1, 1, 16); },
    cyl8: function () { return new THREE.CylinderGeometry(1, 1, 1, 8); },
    cyl6: function () { return new THREE.CylinderGeometry(1, 1, 1, 6); },
    cone: function () { return new THREE.ConeGeometry(1, 1, 16); },
    cone6: function () { return new THREE.ConeGeometry(1, 1, 6); },
    cone8: function () { return new THREE.ConeGeometry(1, 1, 8); },
    sphere: function () { return new THREE.SphereGeometry(1, 16, 12); },
    sphereLo: function () { return new THREE.SphereGeometry(1, 8, 6); },
    plane: function () { return new THREE.PlaneGeometry(1, 1); },
    torus: function () { return new THREE.TorusGeometry(1, 0.08, 6, 24); },
    ring: function () { return new THREE.TorusGeometry(1, 0.12, 8, 32); },
    candle: function () { return new THREE.CylinderGeometry(0.045, 0.05, 1, 8); }
  };
  function G(name) { if (!GEO[name]) GEO[name] = keep(GEODEF[name]()); return GEO[name]; }

  // ===================================================================================
  // 2. geometry helpers with world-space UVs (1 uv unit = 1 metre; textures repeat per tile)
  // ===================================================================================
  function boxGeo(w, h, d, ox, oy, oz) {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv, pos = g.attributes.position;
    ox = ox || 0; oy = oy || 0; oz = oz || 0;
    for (let i = 0; i < uv.count; i++) {
      const face = Math.floor(i / 4);
      const px = pos.getX(i) + ox, py = pos.getY(i) + oy, pz = pos.getZ(i) + oz;
      let u, v;
      if (face === 0) { u = -pz; v = py; } else if (face === 1) { u = pz; v = py; }
      else if (face === 2) { u = px; v = -pz; } else if (face === 3) { u = px; v = pz; }
      else if (face === 4) { u = px; v = py; } else { u = -px; v = py; }
      uv.setXY(i, u, v);
    }
    return g;
  }
  function planeGeo(w, h, ox, oy) {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) + (ox || 0), pos.getY(i) + (oy || 0));
    return g;
  }
  function circleGeo(r, seg, ox, oy) {
    const g = new THREE.CircleGeometry(r, seg || 48);
    const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) + (ox || 0), pos.getY(i) + (oy || 0));
    return g;
  }
  function wallCylGeo(r, h, seg, thetaStart, thetaLen) {
    const g = new THREE.CylinderGeometry(r, r, h, seg, 1, true, thetaStart || 0, thetaLen === undefined ? TAU : thetaLen);
    const uv = g.attributes.uv;
    const circ = r * (thetaLen === undefined ? TAU : thetaLen);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ, uv.getY(i) * h);
    return g;
  }
  function archPath(p, w, h, pointed) {
    const r = w / 2;
    const spring = pointed ? Math.max(0, h - r * 1.25) : Math.max(0, h - r);
    p.moveTo(-r, 0);
    p.lineTo(-r, spring);
    if (pointed) {
      const k = h - spring;
      p.bezierCurveTo(-r, spring + k * 0.55, -r * 0.42, h - k * 0.06, 0, h);
      p.bezierCurveTo(r * 0.42, h - k * 0.06, r, spring + k * 0.55, r, spring);
    } else {
      p.absarc(0, spring, r, PI, 0, true);
    }
    p.lineTo(r, 0);
    p.lineTo(-r, 0);
    return p;
  }
  function archGeo(w, h, pointed) {
    const g = new THREE.ShapeGeometry(archPath(new THREE.Shape(), w, h, pointed), 12);
    const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, pos.getY(i) / h);
    return g;
  }
  function archFrameGeo(w, h, t, depth, pointed, rect) {
    let outer;
    if (rect) {
      outer = new THREE.Shape();
      outer.moveTo(-w / 2 - t, 0); outer.lineTo(w / 2 + t, 0); outer.lineTo(w / 2 + t, h + t); outer.lineTo(-w / 2 - t, h + t); outer.lineTo(-w / 2 - t, 0);
    } else outer = archPath(new THREE.Shape(), w + t * 2, h + t, pointed);
    outer.holes.push(archPath(new THREE.Path(), w, h, pointed));
    return new THREE.ExtrudeGeometry(outer, { depth: depth, bevelEnabled: false, curveSegments: 12 });
  }
  function archSolidGeo(w, h, depth, pointed) {
    return new THREE.ExtrudeGeometry(archPath(new THREE.Shape(), w, h, pointed), { depth: depth, bevelEnabled: false, curveSegments: 12 });
  }

  // ===================================================================================
  // 3. per-area builder: meshes, colliders, lights, animated bits, decor kit
  // ===================================================================================
  const MAX_LIGHTS = 8;
  function Builder(id, seed) {
    const b = this;
    b.id = id;
    b.group = new THREE.Group();
    b.group.name = 'area:' + id;
    b.colliders = [];
    b.anims = [];
    b.flames = [];     // {s: sprite, base: scale vec, ph}
    b.flickers = [];   // {light, base, amt, ph}
    b.lightCount = 0;
    b.R = mulberry32(seed || 1);
    b.shadows = false;
  }
  const BP = Builder.prototype;
  BP.add = function (o, parent) { (parent || this.group).add(o); return o; };
  BP.mesh = function (geo, mat, x, y, z, parent) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (this.shadows) { m.castShadow = true; m.receiveShadow = true; }
    return this.add(m, parent);
  };
  // textured box with world UVs (x,y,z = centre)
  BP.box = function (w, h, d, x, y, z, mat, parent) {
    return this.mesh(boxGeo(w, h, d, x, y, z), mat, x, y, z, parent);
  };
  // box resting on the floor: y = bottom
  BP.block = function (w, h, d, x, y0, z, mat, parent) { return this.box(w, h, d, x, y0 + h / 2, z, mat, parent); };
  // shared unit-geometry primitive scaled (untextured small things)
  BP.prim = function (geoName, mat, x, y, z, sx, sy, sz, parent) {
    const m = new THREE.Mesh(G(geoName), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
    if (this.shadows) { m.castShadow = true; m.receiveShadow = true; }
    return this.add(m, parent);
  };
  BP.col = function (minX, maxX, minZ, maxZ, h) {
    const c = { minX: Math.min(minX, maxX), maxX: Math.max(minX, maxX), minZ: Math.min(minZ, maxZ), maxZ: Math.max(minZ, maxZ), h: h === undefined ? 99 : h };
    this.colliders.push(c);
    return c;
  };
  BP.colAt = function (x, z, hw, hd, h) { return this.col(x - hw, x + hw, z - hd, z + hd, h); };
  BP.light = function (color, intensity, distance, x, y, z, decay) {
    if (this.lightCount >= MAX_LIGHTS) { console.warn('[world] light budget exceeded in ' + this.id); return null; }
    this.lightCount++;
    const l = new THREE.PointLight(color, intensity, distance, decay === undefined ? 2 : decay);
    l.position.set(x, y, z);
    l.castShadow = false;
    this.add(l);
    return l;
  };
  BP.flicker = function (light, amt, speed) {
    if (!light) return;
    this.flickers.push({ light: light, base: light.intensity, amt: amt === undefined ? 0.18 : amt, sp: speed || 1, ph: this.R() * 100 });
  };
  BP.floor = function (minX, maxX, minZ, maxZ, mat, y) {
    const w = maxX - minX, d = maxZ - minZ, cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const m = this.mesh(planeGeo(w, d, cx, -cz), mat, cx, y || 0, cz);
    m.rotation.x = -PI / 2;
    m.receiveShadow = true;
    return m;
  };
  BP.ceiling = function (minX, maxX, minZ, maxZ, y, mat) {
    const w = maxX - minX, d = maxZ - minZ, cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const m = this.mesh(planeGeo(w, d, cx, cz), mat, cx, y, cz);
    m.rotation.x = PI / 2;
    return m;
  };
  BP.decal = function (geo, mat, x, y, z, rotZ) {
    const m = this.mesh(geo, mat, x, y, z);
    m.rotation.x = -PI / 2; m.rotation.z = rotZ || 0;
    m.receiveShadow = true; m.castShadow = false;
    return m;
  };
  // four walls just outside the bounds (inner faces on the bounds)
  BP.roomWalls = function (bd, h, mat, skip) {
    const t = 0.6;
    skip = skip || {};
    const w = bd.maxX - bd.minX, d = bd.maxZ - bd.minZ, cx = (bd.minX + bd.maxX) / 2, cz = (bd.minZ + bd.maxZ) / 2;
    if (!skip.n) this.box(w + t * 2, h, t, cx, h / 2, bd.minZ - t / 2, mat);
    if (!skip.s) this.box(w + t * 2, h, t, cx, h / 2, bd.maxZ + t / 2, mat);
    if (!skip.w) this.box(t, h, d, bd.minX - t / 2, h / 2, cz, mat);
    if (!skip.e) this.box(t, h, d, bd.maxX + t / 2, h / 2, cz, mat);
  };
  // place a group on a wall: face = wall the object is mounted on; local +Z points into the room
  function faceRot(face) { return face === 'n' ? 0 : face === 's' ? PI : face === 'e' ? -PI / 2 : PI / 2; }
  BP.onWall = function (obj, face, x, y, z) {
    obj.position.set(x, y, z);
    obj.rotation.y = typeof face === 'number' ? face : faceRot(face);
    return this.add(obj);
  };
  BP.sprite = function (mat, x, y, z, sx, sy, parent) {
    const s = new THREE.Sprite(mat);
    s.position.set(x, y, z);
    s.scale.set(sx, sy === undefined ? sx : sy, 1);
    return this.add(s, parent);
  };
  BP.flame = function (x, y, z, size, parent, glow) {
    const s = this.sprite(M('flameS'), x, y, z, size * 0.55, size, parent);
    this.flames.push({ s: s, w: size * 0.55, h: size, ph: this.R() * 100, y: y });
    if (glow !== false) this.sprite(M(glow || 'glowWarm'), x, y, z, size * 3.2, size * 3.2, parent);
    return s;
  };
  BP.candle = function (x, y, z, h, parent) {
    h = h || 0.24;
    const c = this.prim('candle', M('wax'), x, y + h / 2, z, 1, h, 1, parent);
    c.castShadow = false;
    this.flame(x, y + h + 0.06, z, 0.13, parent, 'glowSoft');
    return c;
  };
  BP.updateCommon = function (dt, t) {
    for (let i = 0; i < this.flames.length; i++) {
      const f = this.flames[i];
      if (!f.s.visible) continue;
      const k = 1 + Math.sin(t * 13 + f.ph) * 0.08 + Math.sin(t * 7.3 + f.ph * 2) * 0.06;
      f.s.scale.set(f.w * (2 - k), f.h * k, 1);
    }
    for (let i = 0; i < this.flickers.length; i++) {
      const f = this.flickers[i];
      const n = Math.sin(t * 9 * f.sp + f.ph) * 0.5 + Math.sin(t * 23 * f.sp + f.ph * 1.7) * 0.3 + Math.sin(t * 3.1 + f.ph) * 0.2;
      f.light.intensity = f.base * (1 + n * f.amt) * (f.scale === undefined ? 1 : f.scale);
    }
    for (let i = 0; i < this.anims.length; i++) this.anims[i](dt, t);
  };

  // ---------------- decor kit ----------------
  // doorway: o = {face, x, y?, z, w, h, kind:'double'|'single'|'grate'|'open', plaque:{he,en}, plaqueY?, frameMat?, pointed?}
  BP.doorway = function (o) {
    const g = new THREE.Group();
    const w = o.w, h = o.h, t = o.frame || 0.38, pointed = o.pointed !== false;
    const frame = new THREE.Mesh(archFrameGeo(w, h, t, 0.36, pointed, o.rect !== false), o.frameMat || M('trim'));
    frame.position.z = -0.16;
    g.add(frame);
    const kind = o.kind || 'single';
    if (kind === 'open' || kind === 'grate') {
      const back = new THREE.Mesh(archGeo(w, h, pointed), M('voidDark'));
      back.position.z = o.voidDepth === undefined ? -0.12 : -o.voidDepth;
      g.add(back);
    }
    if (kind === 'single' || kind === 'double') {
      const leaf = new THREE.Mesh(archSolidGeo(w - 0.02, h - 0.01, 0.12, pointed), o.leafMat || M('planksDark'));
      leaf.position.z = -0.08;
      g.add(leaf);
      const iron = M('iron');
      const spring = pointed ? h - w / 2 * 1.25 : h - w / 2;
      const bands = [0.5, Math.max(1.1, spring * 0.55), Math.max(1.5, spring - 0.2)];
      for (let i = 0; i < bands.length; i++) {
        const strap = new THREE.Mesh(G('box'), iron);
        strap.scale.set(w * 0.94, 0.09, 0.03); strap.position.set(0, bands[i], 0.055);
        g.add(strap);
      }
      if (kind === 'double') {
        const seam = new THREE.Mesh(G('box'), M('iron'));
        seam.scale.set(0.05, h * 0.98, 0.04); seam.position.set(0, h * 0.49, 0.055);
        g.add(seam);
        for (let s = -1; s <= 1; s += 2) {
          const ring = new THREE.Mesh(G('torus'), M('brass'));
          ring.scale.set(0.11, 0.11, 0.11); ring.position.set(s * 0.22, Math.min(1.25, h * 0.4), 0.09);
          g.add(ring);
        }
      } else {
        const ring = new THREE.Mesh(G('torus'), M('brass'));
        ring.scale.set(0.1, 0.1, 0.1); ring.position.set(w * 0.32, 1.1, 0.09);
        g.add(ring);
      }
    }
    if (kind === 'grate') {
      const bars = Math.max(3, Math.round(w / 0.22));
      for (let i = 1; i < bars; i++) {
        const bx = -w / 2 + i * w / bars;
        const bar = new THREE.Mesh(G('cyl8'), M('iron'));
        bar.scale.set(0.03, h, 0.03); bar.position.set(bx, h / 2 - 0.05, 0.02);
        g.add(bar);
      }
      for (let k = 1; k <= 3; k++) {
        const bar = new THREE.Mesh(G('box'), M('iron'));
        bar.scale.set(w, 0.06, 0.05); bar.position.set(0, k * h * 0.24, 0.02);
        g.add(bar);
      }
    }
    if (o.plaque) {
      const pl = this.plaque(o.plaque.he, o.plaque.en, o.plaqueW || 1.45);
      pl.position.set(0, o.plaqueY !== undefined ? o.plaqueY : h + t + 0.34, 0.22);
      g.add(pl);
    }
    g.position.set(o.x, o.y || 0, o.z);
    g.rotation.y = typeof o.face === 'number' ? o.face : faceRot(o.face);
    if (this.shadows) g.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return this.add(g);
  };
  BP.plaque = function (he, en, w) {
    w = w || 1.45;
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ map: signTexture(he, en), transparent: true, alphaTest: 0.3, roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.0 });
    mat.emissiveMap = mat.map; mat.emissiveIntensity = 0.32;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 168 / 512), mat);
    p.position.z = 0.03;
    g.add(p);
    const back = new THREE.Mesh(G('box'), M('woodDark'));
    back.scale.set(w * 0.96, w * 168 / 512 * 0.9, 0.04);
    g.add(back);
    return g;
  };
  // arched stained-glass window; y0 = bottom
  BP.window = function (face, x, y0, z, w, h, mat, o) {
    o = o || {};
    const g = new THREE.Group();
    const glass = new THREE.Mesh(archGeo(w, h, o.pointed !== false), mat || M('glassA'));
    glass.position.z = 0.02;
    g.add(glass);
    const fr = new THREE.Mesh(archFrameGeo(w, h, o.frame || 0.22, 0.24, o.pointed !== false), o.frameMat || M('trim'));
    fr.position.z = -0.1;
    g.add(fr);
    const sill = new THREE.Mesh(G('box'), o.frameMat || M('trim'));
    sill.scale.set(w + 0.6, 0.14, 0.34); sill.position.set(0, -0.06, 0.08);
    g.add(sill);
    if (o.mullion !== false) {
      const mu = new THREE.Mesh(G('box'), o.frameMat || M('trim'));
      mu.scale.set(0.07, h * 0.82, 0.08); mu.position.set(0, h * 0.41, 0.05);
      g.add(mu);
    }
    if (o.glow) {
      const s = new THREE.Sprite(o.glow);
      s.position.set(0, h * 0.5, 0.4); s.scale.set(w * 2.2, h * 1.3, 1);
      g.add(s);
    }
    g.position.set(x, y0, z);
    g.rotation.y = typeof face === 'number' ? face : faceRot(face);
    return this.add(g);
  };
  // hanging banner: top centre at (x, yTop, z)
  BP.banner = function (face, x, yTop, z, w, h, mat, sway) {
    const g = new THREE.Group();
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat || M('banner'));
    cloth.position.set(0, -h / 2, 0.06);
    g.add(cloth);
    const rod = new THREE.Mesh(G('cyl8'), M('brass'));
    rod.scale.set(0.035, w + 0.3, 0.035); rod.rotation.z = PI / 2; rod.position.set(0, 0.02, 0.08);
    g.add(rod);
    for (let s = -1; s <= 1; s += 2) {
      const fin = new THREE.Mesh(G('sphereLo'), M('brass'));
      fin.scale.setScalar(0.06); fin.position.set(s * (w / 2 + 0.17), 0.02, 0.08);
      g.add(fin);
    }
    g.position.set(x, yTop, z);
    g.rotation.y = typeof face === 'number' ? face : faceRot(face);
    this.add(g);
    if (sway) {
      const ph = this.R() * 10;
      this.anims.push(function (dt, t) { cloth.rotation.x = Math.sin(t * 0.8 + ph) * 0.03; });
    }
    return g;
  };
  BP.framedPicture = function (face, x, y, z, w, h, mat) {
    const g = new THREE.Group();
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    pic.position.z = 0.06; g.add(pic);
    const fm = M('gold');
    const parts = [[w + 0.24, 0.12, 0, h / 2 + 0.06], [w + 0.24, 0.12, 0, -h / 2 - 0.06], [0.12, h, -w / 2 - 0.06, 0], [0.12, h, w / 2 + 0.06, 0]];
    for (let i = 0; i < parts.length; i++) {
      const p = new THREE.Mesh(G('box'), fm);
      p.scale.set(parts[i][0], parts[i][1], 0.08); p.position.set(parts[i][2], parts[i][3], 0.05);
      g.add(p);
    }
    g.position.set(x, y, z);
    g.rotation.y = typeof face === 'number' ? face : faceRot(face);
    return this.add(g);
  };
  // wall torch sconce (flame + optional flickering light)
  BP.sconce = function (face, x, y, z, light) {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(G('box'), M('iron')); plate.scale.set(0.16, 0.34, 0.04); plate.position.set(0, 0, 0.02); g.add(plate);
    const arm = new THREE.Mesh(G('box'), M('iron')); arm.scale.set(0.05, 0.05, 0.32); arm.position.set(0, -0.06, 0.18); g.add(arm);
    const cup = new THREE.Mesh(G('cyl8'), M('iron')); cup.scale.set(0.1, 0.12, 0.1); cup.position.set(0, 0.0, 0.34); g.add(cup);
    const stick = new THREE.Mesh(G('cyl8'), M('woodDark')); stick.scale.set(0.045, 0.44, 0.045); stick.position.set(0, 0.16, 0.36); stick.rotation.x = 0.18; g.add(stick);
    g.position.set(x, y, z);
    g.rotation.y = typeof face === 'number' ? face : faceRot(face);
    this.add(g);
    g.updateMatrixWorld(true);
    const p = new THREE.Vector3(0, 0.5, 0.4).applyMatrix4(g.matrixWorld);
    this.group.updateMatrixWorld(true);
    // flame sits in group space; g is a direct child so matrixWorld == local here (group at origin)
    this.flame(p.x, p.y, p.z, 0.5);
    let l = null;
    if (light) {
      const q = new THREE.Vector3(0, 0.55, 0.75).applyMatrix4(g.matrixWorld);
      l = this.light(light.color || 0xff9a48, light.intensity || 1.3, light.distance || 12, q.x, q.y, q.z);
      this.flicker(l, 0.16);
    }
    return l;
  };
  // iron ring chandelier with candles; returns {group}
  BP.chandelier = function (x, y, z, r, n, ceilY) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(G('ring'), M('iron')); ring.scale.set(r, r, r); ring.rotation.x = PI / 2; g.add(ring);
    const ring2 = new THREE.Mesh(G('ring'), M('iron')); ring2.scale.set(r * 0.55, r * 0.55, r * 0.8); ring2.rotation.x = PI / 2; ring2.position.y = 0.45; g.add(ring2);
    const tilt = Math.atan2(r * 0.45, 0.45);
    const slen = Math.hypot(r * 0.45, 0.45);
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      // spoke from the inner (upper) ring down/out to the outer ring
      const sp = new THREE.Object3D();
      sp.position.set(Math.cos(a) * r * 0.55, 0.45, Math.sin(a) * r * 0.55);
      sp.rotation.y = -a;
      const bar = new THREE.Mesh(G('cyl6'), M('iron'));
      bar.scale.set(0.018, slen, 0.018);
      bar.rotation.z = tilt;
      bar.position.set(r * 0.225, -0.225, 0);
      sp.add(bar);
      g.add(sp);
    }
    const top = ceilY - y;
    if (top > 1.2) {
      const chain = new THREE.Mesh(G('cyl6'), M('iron')); chain.scale.set(0.02, top - 1.2, 0.02); chain.position.y = 1.2 + (top - 1.2) / 2; g.add(chain);
    }
    g.position.set(x, y, z);
    this.add(g);
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n;
      this.candle(x + Math.cos(a) * r, y + 0.06, z + Math.sin(a) * r, 0.22);
    }
    this.sprite(M('glowSoft'), x, y + 0.3, z, r * 3.4, r * 2.2);
    return g;
  };
  // bookcase: width w along local x, front faces local +Z (and back if double)
  BP.bookcase = function (x, z, w, h, d, rotY, double, booksMat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const face = Math.floor(i / 4);
      if (face >= 4) uv.setXY(i, uv.getX(i) * w / 2.0, uv.getY(i));
      else if (face < 2) uv.setXY(i, uv.getX(i) * d, uv.getY(i) * h);
      else uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
    }
    const bm = booksMat || M('books1');
    const wm = M('woodDark');
    const mats = [wm, wm, wm, wm, bm, double ? (bm === M('books1') ? M('books2') : M('books1')) : wm];
    const m = new THREE.Mesh(geo, mats);
    m.position.set(x, h / 2, z);
    m.rotation.y = rotY || 0;
    this.add(m);
    const cap = new THREE.Mesh(G('box'), M('wood'));
    cap.scale.set(w + 0.14, 0.14, d + 0.14); cap.position.set(x, h + 0.07, z); cap.rotation.y = rotY || 0; this.add(cap);
    const pl = new THREE.Mesh(G('box'), M('wood'));
    pl.scale.set(w + 0.08, 0.12, d + 0.08); pl.position.set(x, 0.06, z); pl.rotation.y = rotY || 0; this.add(pl);
    return m;
  };
  // suit of armour on a plinth; faces local +Z
  BP.armour = function (x, z, rotY) {
    const g = new THREE.Group();
    const st = M('steel'), dk = M('ironLight');
    const P = function (geo, mat, px, py, pz, sx, sy, sz, rx, rz) {
      const m = new THREE.Mesh(G(geo), mat); m.position.set(px, py, pz); m.scale.set(sx, sy, sz);
      if (rx) m.rotation.x = rx; if (rz) m.rotation.z = rz; g.add(m); return m;
    };
    P('box', M('trim'), 0, 0.15, 0, 0.8, 0.3, 0.8);
    P('cyl8', st, -0.13, 0.65, 0, 0.09, 0.7, 0.09); P('cyl8', st, 0.13, 0.65, 0, 0.09, 0.7, 0.09);
    P('box', st, -0.13, 0.33, 0.06, 0.13, 0.08, 0.26); P('box', st, 0.13, 0.33, 0.06, 0.13, 0.08, 0.26);
    P('cyl8', dk, 0, 1.08, 0, 0.21, 0.2, 0.16);
    P('cyl', st, 0, 1.42, 0, 0.25, 0.55, 0.18);
    P('sphere', st, -0.31, 1.62, 0, 0.13, 0.11, 0.13); P('sphere', st, 0.31, 1.62, 0, 0.13, 0.11, 0.13);
    P('cyl8', st, -0.34, 1.32, 0.02, 0.06, 0.5, 0.06, 0, 0.12); P('cyl8', st, 0.34, 1.32, 0.04, 0.06, 0.5, 0.06, -0.3, -0.12);
    P('sphere', st, 0, 1.92, 0, 0.14, 0.17, 0.15);
    P('box', M('iron'), 0, 1.93, 0.13, 0.16, 0.025, 0.03);
    P('cone8', st, 0, 2.12, 0, 0.05, 0.12, 0.05);
    P('cyl8', M('copperCloth'), 0, 2.19, -0.02, 0.02, 0.06, 0.02);
    P('cyl8', M('woodDark'), 0.42, 1.2, 0.18, 0.025, 2.3, 0.025);
    P('box', st, 0.42, 2.38, 0.18, 0.02, 0.28, 0.22);
    P('cone8', st, 0.42, 2.62, 0.18, 0.03, 0.2, 0.03);
    P('box', M('blueCloth'), 0, 1.1, 0.13, 0.3, 0.4, 0.02);
    g.position.set(x, 0, z);
    g.rotation.y = rotY || 0;
    this.add(g);
    this.colAt(x, z, 0.45, 0.45);
    return g;
  };
  BP.table = function (x, z, w, d, h, mat, legMat, rotY) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(boxGeo(w, 0.07, d), mat || M('wood')); top.position.y = h - 0.035; g.add(top);
    const lm = legMat || M('woodDark');
    for (let sx = -1; sx <= 1; sx += 2) for (let sz = -1; sz <= 1; sz += 2) {
      const l = new THREE.Mesh(G('box'), lm); l.scale.set(0.08, h - 0.07, 0.08); l.position.set(sx * (w / 2 - 0.1), (h - 0.07) / 2, sz * (d / 2 - 0.1)); g.add(l);
    }
    g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    return this.add(g);
  };
  BP.chair = function (x, z, rotY, mat, cushion) {
    const g = new THREE.Group();
    const m = mat || M('wood');
    const seat = new THREE.Mesh(G('box'), m); seat.scale.set(0.46, 0.06, 0.46); seat.position.y = 0.46; g.add(seat);
    const back = new THREE.Mesh(G('box'), m); back.scale.set(0.46, 0.6, 0.05); back.position.set(0, 0.78, -0.21); g.add(back);
    for (let sx = -1; sx <= 1; sx += 2) for (let sz = -1; sz <= 1; sz += 2) {
      const l = new THREE.Mesh(G('box'), M('woodDark')); l.scale.set(0.05, 0.46, 0.05); l.position.set(sx * 0.19, 0.23, sz * 0.19); g.add(l);
    }
    if (cushion) { const c = new THREE.Mesh(G('box'), cushion); c.scale.set(0.42, 0.05, 0.42); c.position.y = 0.51; g.add(c); }
    g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    return this.add(g);
  };
  BP.armchair = function (x, z, rotY, cloth) {
    const g = new THREE.Group();
    const c = cloth || M('redCloth');
    const P = function (mat, px, py, pz, sx, sy, sz) { const m = new THREE.Mesh(G('box'), mat); m.position.set(px, py, pz); m.scale.set(sx, sy, sz); g.add(m); return m; };
    P(c, 0, 0.3, 0, 0.9, 0.3, 0.85);
    P(M('creamCloth'), 0, 0.5, 0.05, 0.62, 0.1, 0.66);
    P(c, 0, 0.82, -0.36, 0.9, 0.95, 0.18);
    P(c, -0.4, 0.58, 0.02, 0.14, 0.34, 0.8); P(c, 0.4, 0.58, 0.02, 0.14, 0.34, 0.8);
    const tufts = new THREE.Mesh(G('sphereLo'), c); tufts.scale.set(0.45, 0.12, 0.1); tufts.position.set(0, 1.28, -0.36); g.add(tufts);
    for (let sx = -1; sx <= 1; sx += 2) for (let sz = -1; sz <= 1; sz += 2) P(M('woodDark'), sx * 0.38, 0.07, sz * 0.36, 0.08, 0.14, 0.08);
    g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    return this.add(g);
  };
  BP.rugRound = function (x, z, r, mat) { return this.decal(new THREE.CircleGeometry(r, 48), mat, x, 0.012, z); };
  // rectangular rug / runner; w = length along the texture's long axis (repeats instead of stretching)
  BP.rugRect = function (x, z, w, d, mat, rotZ) {
    const geo = new THREE.PlaneGeometry(w, d);
    const rep = Math.max(1, Math.round(w / (d * 4)));
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * rep);
    return this.decal(geo, mat, x, 0.012, z, rotZ);
  };
  BP.bookStack = function (x, y, z, n) {
    const cols = [0x6a1a1e, 0x1d2f6a, 0x24442c, 0x7a5a20, 0x4a2a5a];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(G('box'), this.bookMat(cols[(i + Math.floor(this.R() * 5)) % cols.length]));
      const w = 0.22 + this.R() * 0.08, d = 0.16 + this.R() * 0.05;
      m.scale.set(w, 0.05, d); m.position.set(x + (this.R() - 0.5) * 0.03, y + 0.025 + i * 0.05, z + (this.R() - 0.5) * 0.03);
      m.rotation.y = (this.R() - 0.5) * 0.5;
      this.add(m);
    }
  };
  const BOOKMATS = {};
  BP.bookMat = function (hex) {
    if (!BOOKMATS[hex]) BOOKMATS[hex] = keep(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8 }));
    return BOOKMATS[hex];
  };
  // hanging lantern lamp (small, for classrooms/rooms)
  BP.hangingLamp = function (x, y, z, ceilY) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(G('cyl6'), new THREE.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffa040, emissiveIntensity: 1.1, roughness: 0.4, transparent: true, opacity: 0.92 }));
    body.scale.set(0.16, 0.32, 0.16); g.add(body);
    const capT = new THREE.Mesh(G('cone6'), M('brass')); capT.scale.set(0.22, 0.16, 0.22); capT.position.y = 0.24; g.add(capT);
    const capB = new THREE.Mesh(G('cyl6'), M('brass')); capB.scale.set(0.2, 0.05, 0.2); capB.position.y = -0.18; g.add(capB);
    const ch = new THREE.Mesh(G('cyl6'), M('iron')); const len = Math.max(0.05, ceilY - y - 0.3); ch.scale.set(0.012, len, 0.012); ch.position.y = 0.3 + len / 2; g.add(ch);
    g.position.set(x, y, z);
    this.add(g);
    this.sprite(M('glowWarm'), x, y, z, 1.4, 1.4);
    return g;
  };
  // fill a circular room's square bounds corners with stepped colliders so it walks "round"
  BP.roundCorners = function (cx, cz, r, bd, step, skipTop) {
    step = step || 0.75;
    for (let x0 = 0; x0 < r; x0 += step) {
      const x1 = Math.min(r, x0 + step);
      const h = Math.sqrt(Math.max(0, r * r - x1 * x1));
      for (let sx = -1; sx <= 1; sx += 2) {
        const ax = cx + sx * x0, bx = cx + sx * x1;
        // north side (towards -Z)
        if (cz - h > bd.minZ) this.col(ax, bx, bd.minZ - 1, cz - h);
        // south side (+Z)
        if (cz + h < bd.maxZ && !(skipTop && x1 <= skipTop)) this.col(ax, bx, cz + h, bd.maxZ + 1);
      }
    }
  };

  // ===================================================================================
  // 4. AREA: grounds (exterior, night)
  // ===================================================================================
  function txt(he, en) { return { he: he, en: en }; }
  const L = {
    grounds: txt('השטח', 'Grounds'),
    greathall: txt('האולם הגדול', 'Great Hall'),
    classroom: txt('כיתת הלחשים', 'Charms Classroom'),
    library: txt('הספרייה', 'Library'),
    tower: txt('חדר המועדון', 'Common Room'),
    crypt: txt('המרתף', 'Crypt'),
    entrance: txt('אולם הכניסה', 'Entrance Hall'),
    academy: txt('אקדמיית אלדרמור', 'Eldermoor Academy')
  };

  function buildGrounds(ctx) {
    initCtx(ctx);
    const b = new Builder('grounds', 101);
    const bounds = { minX: -40, maxX: 40, minZ: -24, maxZ: 78 };
    const R = b.R;

    // --- moon + shadows (the only area with shadows) ---
    const moonDir = new THREE.Vector3(-0.32, 0.62, -0.72).normalize();
    const moonLight = new THREE.DirectionalLight(0xbcd0ff, 0.55);
    moonLight.position.copy(moonDir).multiplyScalar(130).add(new THREE.Vector3(0, 0, 25));
    moonLight.target.position.set(0, 0, 25);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    const sc = moonLight.shadow.camera;
    sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 10; sc.far = 300;
    moonLight.shadow.bias = -0.0006;
    moonLight.shadow.normalBias = 0.04;
    b.add(moonLight); b.add(moonLight.target);

    // sky: stars + moon (no fog)
    {
      const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const y = 0.05 + R() * 0.95, th = R() * TAU, r = Math.sqrt(1 - y * y);
        pos[i * 3] = Math.cos(th) * r * 420; pos[i * 3 + 1] = y * 420; pos[i * 3 + 2] = Math.sin(th) * r * 420 + 20;
        const w = 0.6 + R() * 0.4, tint = R();
        col[i * 3] = w * (tint > 0.8 ? 1 : 0.85); col[i * 3 + 1] = w * 0.9; col[i * 3 + 2] = w * (tint < 0.3 ? 0.8 : 1);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const pm = new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
      b.add(new THREE.Points(geo, pm));
      const mp = moonDir.clone().multiplyScalar(380).add(new THREE.Vector3(0, 0, 20));
      const moon = b.mesh(new THREE.SphereGeometry(11, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f0dc, fog: false }), mp.x, mp.y, mp.z);
      moon.castShadow = false;
      const mg = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(200,215,255,0.55)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      b.sprite(mg, mp.x * 0.99, mp.y * 0.99, mp.z * 0.99, 120, 120);
    }

    b.shadows = true;
    // --- ground, courtyard, paths ---
    // plateau (the academy stands on a cliff above the black lake to the west)
    const CLIFF_X = -44, LOW_Y = -4;
    const ground = b.mesh(planeGeo(344, 520, 128, -60), M('grass'), 128, 0, 60);
    ground.rotation.x = -PI / 2; ground.castShadow = false;
    const low = b.mesh(planeGeo(380, 520, -234, -60), M('grass'), -234, LOW_Y, 60);
    low.rotation.x = -PI / 2; low.castShadow = false; low.receiveShadow = false;
    const cliff = b.box(3, -LOW_Y + 0.4, 520, CLIFF_X - 1.5, LOW_Y / 2 - 0.2, 60, M('stoneOut'));
    cliff.castShadow = false;
    for (let i = 0; i < 26; i++) {
      const rz = -40 + i * 7 + R() * 4, rs = 1.5 + R() * 3;
      const rock = b.prim('sphereLo', M('stoneOut'), CLIFF_X - 3 - R() * 3, LOW_Y + rs * 0.3, rz, rs, rs * 0.7, rs);
      rock.rotation.set(R(), R() * 3, R()); rock.castShadow = false;
    }
    const yard = b.mesh(circleGeo(18, 72), M('flagOut'), 0, 0.02, 0);
    yard.rotation.x = -PI / 2; yard.castShadow = false;
    const kerb = b.mesh(new THREE.RingGeometry(18, 18.8, 72), M('trimDark'), 0, 0.035, 0);
    kerb.rotation.x = -PI / 2; kerb.castShadow = false;
    const road = b.floor(-6, 6, 40, 200, M('road'), 0.012); road.castShadow = false;
    const path1 = b.floor(-3, 3, 17.6, 40.5, M('flagOut'), 0.015); path1.castShadow = false;
    const path2 = b.floor(-4.5, 4.5, -24.6, -17.6, M('flagOut'), 0.015); path2.castShadow = false;
    // road verges (darker strips)
    for (let s = -1; s <= 1; s += 2) {
      const v = b.floor(s * 6 - 0.6, s * 6 + 0.6, 40.5, 200, M('road'), 0.008); v.castShadow = false;
      v.material = M('road');
    }

    // --- fountain at the centre (collider ±2.2) ---
    {
      const st = M('trim');
      b.mesh(new THREE.CylinderGeometry(2.05, 2.15, 0.62, 40), st, 0, 0.31, 0);
      const rim = b.mesh(new THREE.TorusGeometry(2.0, 0.12, 8, 48), st, 0, 0.62, 0); rim.rotation.x = PI / 2;
      const waterMat = new THREE.MeshStandardMaterial({ map: T('water'), color: 0x6f8fc8, roughness: 0.08, metalness: 0.4, emissive: 0x0a1836, emissiveIntensity: 0.6 });
      const water = b.mesh(new THREE.CircleGeometry(1.9, 40), waterMat, 0, 0.56, 0); water.rotation.x = -PI / 2; water.castShadow = false;
      b.mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.9, 16), st, 0, 1.5, 0);
      b.mesh(new THREE.CylinderGeometry(0.95, 0.3, 0.32, 24), st, 0, 2.5, 0);
      const w2 = b.mesh(new THREE.CircleGeometry(0.85, 24), waterMat, 0, 2.62, 0); w2.rotation.x = -PI / 2; w2.castShadow = false;
      // copper lantern sculpture on top
      b.prim('cyl6', M('copper'), 0, 2.78, 0, 0.16, 0.12, 0.16);
      const lglass = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffa040, emissiveIntensity: 1.2, roughness: 0.3 });
      b.prim('cyl6', lglass, 0, 3.02, 0, 0.13, 0.36, 0.13).castShadow = false;
      b.prim('cone6', M('copper'), 0, 3.3, 0, 0.2, 0.2, 0.2);
      b.prim('torus', M('copper'), 0, 3.46, 0, 0.07, 0.07, 0.07);
      b.sprite(M('glowWarm'), 0, 3.05, 0, 2.2, 2.2);
      b.col(-2.2, 2.2, -2.2, 2.2, 0.8);
      // falling droplets
      const nd = 48, dp = new Float32Array(nd * 3), seeds = [];
      for (let i = 0; i < nd; i++) seeds.push({ a: R() * TAU, t: R() });
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      const dm = new THREE.PointsMaterial({ color: 0xbcd4ff, size: 0.06, transparent: true, opacity: 0.8, depthWrite: false });
      const drops = new THREE.Points(dg, dm); drops.frustumCulled = false; b.add(drops);
      b.anims.push(function (dt, t) {
        for (let i = 0; i < nd; i++) {
          const s = seeds[i]; const k = (t * 0.7 + s.t) % 1;
          const r = 0.95 + k * 0.25;
          dp[i * 3] = Math.cos(s.a) * r; dp[i * 3 + 1] = 2.58 - k * k * 2.0; dp[i * 3 + 2] = Math.sin(s.a) * r;
        }
        dg.attributes.position.needsUpdate = true;
        water.rotation.z = t * 0.05;
      });
    }

    // courtyard benches (tangential, facing the fountain)
    [[90], [270]].forEach(function (a) {
      const ang = a[0] * PI / 180, x = Math.sin(ang) * 12.6, z = Math.cos(ang) * 12.6;
      const g = new THREE.Group();
      const seat = new THREE.Mesh(boxGeo(2.4, 0.1, 0.55), M('wood')); seat.position.y = 0.46; g.add(seat);
      const back = new THREE.Mesh(boxGeo(2.4, 0.5, 0.08), M('wood')); back.position.set(0, 0.8, 0.26); g.add(back);
      for (let s = -1; s <= 1; s += 2) { const l = new THREE.Mesh(boxGeo(0.12, 0.46, 0.5), M('trim')); l.position.set(s * 1.0, 0.23, 0); g.add(l); }
      g.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      g.position.set(x, 0, z); g.rotation.y = ang;
      b.add(g);
      b.colAt(x, z, 0.4, 1.3);
    });
    // planters with small trees around the courtyard edge
    [30, 150, 210, 330].forEach(function (deg) {
      const a = deg * PI / 180, x = Math.sin(a) * 20.5, z = Math.cos(a) * 20.5;
      b.mesh(new THREE.CylinderGeometry(1.0, 0.85, 0.7, 16), M('trimDark'), x, 0.35, z);
      b.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 1 }), x, 0.68, z);
      b.mesh(new THREE.ConeGeometry(0.9, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x16301e, roughness: 1 }), x, 2.0, z);
      b.colAt(x, z, 1.0, 1.0, 1.2);
    });

    // --- torches around the courtyard (4 lights) ---
    const torchPos = [45, 135, 225, 315].map(function (d) { const a = d * PI / 180; return [Math.sin(a) * 19.6, Math.cos(a) * 19.6]; });
    torchPos.forEach(function (p) {
      b.mesh(new THREE.CylinderGeometry(0.07, 0.11, 2.8, 8), M('iron'), p[0], 1.4, p[1]);
      b.mesh(new THREE.CylinderGeometry(0.34, 0.16, 0.34, 12), M('iron'), p[0], 2.9, p[1]);
      b.flame(p[0], 3.35, p[1], 0.9);
      const l = b.light(0xff9a48, 1.6, 22, p[0], 3.6, p[1]);
      b.flicker(l, 0.15);
      b.colAt(p[0], p[1], 0.3, 0.3, 3);
    });

    // --- gate: pillars at x=±4, z=40 (top y=4); walls |x| 5.5..40; iron leaves open outward ---
    {
      for (let s = -1; s <= 1; s += 2) {
        b.block(1.4, 3.7, 1.4, s * 4, 0, 40, M('stoneOut'));
        b.block(1.7, 0.3, 1.7, s * 4, 3.7, 40, M('trim'));
        b.block(1.6, 0.4, 1.6, s * 4, 0, 40, M('trim'));
        // short wall pieces between pillar and the long walls + long walls
        b.block(1.0, 3.0, 0.9, s * 5.1, 0, 40, M('stoneOut'));
        b.block(34.4, 3.0, 0.9, s * 22.8, 0, 40, M('stoneOut'));
        b.block(34.8, 0.25, 1.1, s * 22.8, 3.0, 40, M('trim'));
        // continue the wall out of bounds a little for the silhouette
        b.block(30, 3.0, 0.9, s * 55, 0, 40, M('stoneOut'));
        b.col(s > 0 ? 3.3 : -40.5, s > 0 ? 40.5 : -3.3, 39.5, 40.5);
        // open gate leaf (hinged at x=±3.3, swung outward along the road)
        const leaf = new THREE.Group();
        for (let i = 0; i < 12; i++) {
          const bar = new THREE.Mesh(G('cyl8'), M('iron'));
          const hgt = 2.9 + Math.sin(i / 11 * PI) * 0.5 * (s > 0 ? 1 : 1);
          bar.scale.set(0.035, hgt, 0.035); bar.position.set(-s * (0.15 + i * 0.27), hgt / 2 + 0.05, 0); leaf.add(bar);
          const tip = new THREE.Mesh(G('cone8'), M('iron')); tip.scale.set(0.06, 0.16, 0.06); tip.position.set(-s * (0.15 + i * 0.27), hgt + 0.12, 0); leaf.add(tip);
        }
        for (let k = 0; k < 3; k++) { const rail = new THREE.Mesh(G('box'), M('iron')); rail.scale.set(3.1, 0.07, 0.06); rail.position.set(-s * 1.6, 0.4 + k * 1.1, 0); leaf.add(rail); }
        const scroll = new THREE.Mesh(G('torus'), M('iron')); scroll.scale.set(0.35, 0.35, 0.35); scroll.position.set(-s * 1.6, 1.0, 0); leaf.add(scroll);
        leaf.traverse(function (m) { if (m.isMesh) m.castShadow = true; });
        leaf.position.set(s * 3.3, 0, 40.5);
        leaf.rotation.y = s * (-PI / 2 - 0.08);
        b.add(leaf);
        b.col(s * 3.2, s * 3.85, 40.5, 43.8, 4);
        // wall lanterns facing the road (2 lights)
        b.prim('box', M('iron'), s * 6.4, 2.6, 40.5, 0.12, 0.4, 0.12);
        const lg = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffa040, emissiveIntensity: 1.3 });
        b.prim('cyl6', lg, s * 6.4, 3.0, 40.75, 0.14, 0.34, 0.14).castShadow = false;
        b.prim('cone6', M('iron'), s * 6.4, 3.27, 40.75, 0.2, 0.2, 0.2);
        b.sprite(M('glowWarm'), s * 6.4, 3.0, 40.9, 2.0, 2.0);
        const l = b.light(0xffb060, 1.4, 16, s * 6.4, 3.1, 41.2);
        b.flicker(l, 0.08);
      }
      // a copper lantern on the right pillar (Pebble sits on the left one)
      b.prim('cyl6', M('copper'), 4, 4.08, 40, 0.2, 0.16, 0.2);
      const lg2 = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffa040, emissiveIntensity: 1.2 });
      b.prim('cyl6', lg2, 4, 4.42, 40, 0.16, 0.5, 0.16).castShadow = false;
      b.prim('cone6', M('copper'), 4, 4.8, 40, 0.26, 0.26, 0.26);
      b.sprite(M('glowWarm'), 4, 4.45, 40, 2.4, 2.4);
      // wrought-iron arch with the academy sign
      const rr = 4.2, half = Math.asin(3.3 / rr);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.06, 6, 32, 2 * half), M('iron'));
      arc.rotation.z = PI / 2 - half;
      arc.position.set(0, 4.0 - Math.sqrt(rr * rr - 3.3 * 3.3), 39.85);
      b.add(arc);
      for (let s = -1; s <= 1; s += 2) {
        b.prim('cyl6', M('iron'), s * 0.9, 5.37, 39.85, 0.015, 0.26, 0.015);
        b.prim('torus', M('iron'), s * 2.0, 5.0, 39.85, 0.22, 0.22, 0.22);
      }
      const signTex = signTexture(L.academy.he, L.academy.en);
      const signMat = new THREE.MeshStandardMaterial({ map: signTex, transparent: true, alphaTest: 0.3, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.35, roughness: 0.6 });
      for (let s = -1; s <= 1; s += 2) {
        const sp = b.mesh(new THREE.PlaneGeometry(2.4, 2.4 * 168 / 512), signMat, 0, 4.85, 39.85 + s * 0.03);
        sp.rotation.y = s > 0 ? 0 : PI; sp.castShadow = false;
      }
    }
    // low parapets along the east/west edges (bounds)
    for (let s = -1; s <= 1; s += 2) {
      b.block(0.8, 0.6, 64, s * 40.6, 0, 8, M('stoneOut'));
      b.block(1.0, 0.15, 64, s * 40.6, 0.6, 8, M('trim'));
      for (let z = -22; z <= 38; z += 6) { b.block(0.9, 1.1, 0.9, s * 40.6, 0, z, M('stoneOut')); b.block(1.0, 0.12, 1.0, s * 40.6, 1.1, z, M('trim')); }
    }
    // road edge colliders (block x<−7 and x>7 for z 41–78)
    b.col(-40.5, -7, 40.5, 79);
    b.col(7, 40.5, 40.5, 79);
    // a few road-side stones / milestones
    [[-6.8, 52], [6.9, 63], [-6.9, 70]].forEach(function (p) { b.prim('cyl8', M('trimDark'), p[0], 0.35, p[1], 0.26, 0.7, 0.26); b.prim('sphereLo', M('trimDark'), p[0], 0.7, p[1], 0.26, 0.16, 0.26); });

    // --- castle facade (z < −26) ---
    const sO = M('stoneOut');
    const winMat = new THREE.MeshBasicMaterial({ map: T('glassA'), color: 0xffc070, fog: false });
    const darkWin = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x10141e).convertSRGBToLinear() });
    function facadeWindow(x, y, z, w, h, rot, lit) {
      const m = b.mesh(archGeo(w, h, true), lit ? winMat : darkWin, x, y, z);
      m.rotation.y = rot || 0; m.castShadow = false; m.receiveShadow = false;
      if (lit && R() < 0.5) { const s = b.sprite(M('glowWindow'), x, y + h * 0.5, z + 0.3, w * 2.4, h * 1.4); s.material = M('glowWindow'); }
      return m;
    }
    const merlons = [];
    function crenels(x0, x1, z, y, step) {
      for (let x = x0; x <= x1 + 0.01; x += step) merlons.push([x, y + 0.45, z]);
    }
    // porch around the main doors
    b.block(11, 9, 3.0, 0, 0, -25.9, sO);
    b.block(11.6, 0.4, 3.4, 0, 9, -25.9, M('trim'));
    crenels(-5.2, 5.2, -24.6, 9.4, 1.3);
    // main front wall
    b.block(62, 15, 8, 0, 0, -31, sO);
    b.block(62.6, 0.5, 8.6, 0, 15, -31, M('trim'));
    crenels(-30.6, 30.6, -27.2, 15.5, 1.6);
    for (let x = -27; x <= 27; x += 4.5) {
      if (Math.abs(x) < 6) continue;
      facadeWindow(x, 3.2, -26.98, 1.4, 3.0, 0, R() < 0.7);
      facadeWindow(x, 9.0, -26.98, 1.2, 2.6, 0, R() < 0.55);
    }
    facadeWindow(0, 10.0, -24.38, 3.0, 4.2, 0, true);
    // buttresses
    for (let x = -24; x <= 24; x += 9) if (Math.abs(x) > 6) b.block(1.2, 12, 1.4, x + 2.25, 0, -26.6, sO);
    // corner towers
    function roundTower(x, z, r, h, roofH, roofCol) {
      b.mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 24), sO, x, h / 2, z);
      b.mesh(new THREE.CylinderGeometry(r * 1.16, r * 1.16, 0.8, 24), M('trim'), x, h + 0.4, z);
      b.mesh(new THREE.ConeGeometry(r * 1.3, roofH, 24), new THREE.MeshStandardMaterial({ color: roofCol || 0x26324a, roughness: 0.8 }), x, h + 0.8 + roofH / 2, z);
      for (let i = 0; i < 3; i++) {
        const a = (R() - 0.5) * 1.4, y = h * (0.3 + i * 0.2);
        facadeWindow(x + Math.sin(a) * (r + 0.05), y, z + Math.cos(a) * (r + 0.05), 0.8, 1.7, a, R() < 0.75);
      }
    }
    roundTower(-31, -30, 4.2, 26, 10);
    roundTower(31, -30, 4.2, 24, 9);
    roundTower(-38, -40, 3.2, 20, 7);
    roundTower(38, -40, 3.2, 18, 7);
    // great hall roof behind the front wall
    {
      const roofR = 6.5;
      const hall = b.mesh(new THREE.CylinderGeometry(roofR, roofR, 30, 3, 1, false, PI / 2), new THREE.MeshStandardMaterial({ color: 0x232c40, roughness: 0.8 }), 14, 15 + roofR * 0.5, -40);
      hall.rotation.z = PI / 2;
      b.block(30, 15, 12, 14, 0, -40, sO);
      for (let i = 0; i < 6; i++) facadeWindow(1 + i * 5, 6, -33.98, 1.8, 6.5, 0, true);
    }
    // keep
    b.block(20, 30, 14, -12, 0, -44, sO);
    crenels(-21.6, -2.4, -37.2, 30, 1.6);
    for (let i = 0; i < 5; i++) facadeWindow(-20 + i * 4, 22, -36.98, 1.1, 2.6, 0, R() < 0.8);
    // the nine lantern-towers (the ninth, tallest, in the middle)
    const towerDefs = [[-34, -48, 30], [-26, -56, 34], [-19, -50, 38], [-9, -58, 42], [0, -52, 50], [9, -58, 42], [19, -50, 38], [26, -56, 34], [34, -48, 30]];
    const towerLamps = [];
    towerDefs.forEach(function (d, i) {
      const x = d[0], z = d[1], h = d[2], r = i === 4 ? 2.2 : 1.7;
      b.mesh(new THREE.CylinderGeometry(r, r * 1.12, h, 16), sO, x, h / 2, z);
      b.mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.6, 16), M('trim'), x, h + 0.3, z);
      for (let k = 0; k < 4; k++) {
        const a = k * PI / 2 + PI / 4;
        b.mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), sO, x + Math.cos(a) * r * 0.85, h + 2.2, z + Math.sin(a) * r * 0.85);
      }
      b.mesh(new THREE.ConeGeometry(r * 1.45, r * 3.6, 16), new THREE.MeshStandardMaterial({ color: 0x1e2a44, roughness: 0.8 }), x, h + 3.8 + r * 1.8, z);
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xffc860, fog: false });
      const lamp = b.mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, 1.4, 6), lampMat, x, h + 2.0, z);
      lamp.castShadow = false;
      const gm = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,190,90,0.8)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.95 });
      const glow = b.sprite(gm, x, h + 2.0, z, r * 7, r * 7);
      towerLamps.push({ mat: lampMat, glow: glow, level: 1, target: 1, ph: R() * 10 });
      facadeWindow(x, h * 0.55, z + r + 0.02, 0.7, 1.6, 0, R() < 0.6);
    });

    {
      const im = new THREE.InstancedMesh(boxGeo(0.8, 0.9, 0.9), sO, merlons.length);
      const d = new THREE.Object3D();
      merlons.forEach(function (m, i) { d.position.set(m[0], m[1], m[2]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true;
      b.add(im);
    }
    // --- lake to the west + shore + moon reflection ---
    const lakeX = -112, lakeZ = 16, lakeR = 52;
    {
      const lakeMat = new THREE.MeshStandardMaterial({ map: T('water'), color: 0x3a5a8a, roughness: 0.12, metalness: 0.55, emissive: 0x04080f, emissiveIntensity: 1 });
      const lake = b.mesh(circleGeo(lakeR, 64, lakeX, -lakeZ), lakeMat, lakeX, LOW_Y + 0.08, lakeZ); lake.rotation.x = -PI / 2; lake.castShadow = false;
      const shore = b.mesh(new THREE.RingGeometry(lakeR - 0.3, lakeR + 2.5, 64), new THREE.MeshStandardMaterial({ color: 0x1e1a14, roughness: 1 }), lakeX, LOW_Y + 0.05, lakeZ);
      shore.rotation.x = -PI / 2; shore.castShadow = false;
      const refl = new THREE.MeshBasicMaterial({ map: U.glowTexture('rgba(200,215,255,0.6)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5, fog: false });
      const rm = b.mesh(new THREE.PlaneGeometry(12, 70), refl, lakeX + 8, LOW_Y + 0.1, lakeZ - 6); rm.rotation.x = -PI / 2; rm.rotation.z = 0.42; rm.castShadow = false;
      b.anims.push(function (dt, t) { refl.opacity = 0.42 + Math.sin(t * 0.9) * 0.08; });
    }
    // distant mountains (silhouettes)
    {
      // colours are given in display (sRGB) space so the silhouettes stay darker than the sky
      const mm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x060914).convertSRGBToLinear(), fog: false });
      const mm2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x090e1e).convertSRGBToLinear(), fog: false });
      for (let i = 0; i < 22; i++) {
        const a = -PI * 0.15 + i / 21 * PI * 1.3 + PI * 0.5;
        const d = 260 + R() * 40, h = 40 + R() * 70;
        const m = b.mesh(new THREE.ConeGeometry(40 + R() * 40, h, 6), i % 2 ? mm : mm2, Math.cos(a) * d, h / 2 - 4, -Math.sin(a) * d * 0.9 + 30);
        m.castShadow = false; m.receiveShadow = false;
      }
    }
    // --- forest (instanced conifers) ---
    {
      const pts = [];
      let guard = 0;
      while (pts.length < 340 && guard++ < 6000) {
        const x = -150 + R() * 300, z = -40 + R() * 220;
        const inYard = x > -41.5 && x < 41.5 && z > -27 && z < 40.8;
        const onRoad = Math.abs(x) < 8.5 && z > 39;
        const nearLake = Math.hypot(x - lakeX, z - lakeZ) < lakeR + 5;
        const castle = z < -24 && Math.abs(x) < 45;
        const lakeView = x < -41 && x > -66 && z > -30 && z < 60;
        const cliffEdge = x > CLIFF_X - 7 && x < CLIFF_X + 1;
        if (inYard || onRoad || nearLake || castle || lakeView || cliffEdge) continue;
        const nearRoad = Math.abs(x) < 16 && z > 39;
        pts.push([x, z, nearRoad ? 0.65 + R() * 0.45 : 0.8 + R() * 0.9, x < CLIFF_X ? LOW_Y : 0]);
      }
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 1 });
      const leafA = new THREE.MeshStandardMaterial({ color: 0x14301e, roughness: 1 });
      const leafB = new THREE.MeshStandardMaterial({ color: 0x1b3a24, roughness: 1 });
      const N = pts.length;
      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.5, 1, 6), trunkMat, N);
      const low = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), leafA, N);
      const high = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), leafB, N);
      const dmy = new THREE.Object3D();
      for (let i = 0; i < N; i++) {
        const p = pts[i], s = p[2];
        dmy.rotation.set(0, R() * PI, 0);
        const y0 = p[3];
        dmy.position.set(p[0], y0 + 1.5 * s, p[1]); dmy.scale.set(s, 3 * s, s); dmy.updateMatrix(); trunks.setMatrixAt(i, dmy.matrix);
        dmy.position.set(p[0], y0 + 6 * s, p[1]); dmy.scale.set(3.2 * s, 6.5 * s, 3.2 * s); dmy.updateMatrix(); low.setMatrixAt(i, dmy.matrix);
        dmy.position.set(p[0], y0 + 10 * s, p[1]); dmy.scale.set(2.2 * s, 5 * s, 2.2 * s); dmy.updateMatrix(); high.setMatrixAt(i, dmy.matrix);
      }
      [trunks, low, high].forEach(function (m) { m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; b.add(m); });
    }
    // fireflies along the road + courtyard edges
    {
      const n = 70, fp = new Float32Array(n * 3), base = [];
      for (let i = 0; i < n; i++) {
        const side = R() < 0.5 ? -1 : 1;
        const p = i < 40 ? [side * (7.5 + R() * 6), 0.6 + R() * 2, 44 + R() * 34] : [(R() - 0.5) * 76, 0.6 + R() * 2.2, -20 + R() * 58];
        base.push(p);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
      const fm = new THREE.PointsMaterial({ map: U.glowTexture('rgba(220,255,140,0.8)', 64), color: 0xe8ff9a, size: 0.35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const ff = new THREE.Points(fg, fm); ff.frustumCulled = false; b.add(ff);
      b.anims.push(function (dt, t) {
        for (let i = 0; i < n; i++) {
          const p = base[i];
          fp[i * 3] = p[0] + Math.sin(t * 0.4 + i) * 0.8; fp[i * 3 + 1] = p[1] + Math.sin(t * 0.9 + i * 1.7) * 0.3; fp[i * 3 + 2] = p[2] + Math.cos(t * 0.33 + i * 0.7) * 0.8;
        }
        fg.attributes.position.needsUpdate = true;
        fm.opacity = 0.6 + Math.sin(t * 2.0) * 0.25;
      });
    }

    // --- castle doors (grounds.castleDoor at (0,−23)) ---
    b.doorway({ face: 'n', x: 0, z: -24.4, w: 3.6, h: 5.6, kind: 'double', plaque: L.academy, plaqueW: 2.0, frameMat: M('trim') });
    // steps up to the doors
    b.block(6.4, 0.12, 0.9, 0, 0, -24.1, M('trim')).castShadow = false;
    for (let s = -1; s <= 1; s += 2) {
      b.prim('box', M('iron'), s * 2.9, 4.0, -24.3, 0.12, 0.4, 0.12);
      const lg = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffa040, emissiveIntensity: 1.3 });
      b.prim('cyl6', lg, s * 2.9, 4.4, -24.05, 0.15, 0.38, 0.15).castShadow = false;
      b.prim('cone6', M('iron'), s * 2.9, 4.7, -24.05, 0.22, 0.2, 0.22);
      b.sprite(M('glowWarm'), s * 2.9, 4.45, -23.9, 2.2, 2.2);
      const l = b.light(0xffb060, 1.5, 15, s * 2.9, 4.4, -23.4);
      b.flicker(l, 0.08);
      b.banner('n', s * 4.4, 8.4, -24.38, 1.1, 3.4, M('banner'));
    }
    // castle front collider (beyond bounds anyway; also stops bolts)
    b.col(-41, 41, -40, -24.35);

    // --- anchors ---
    const anchors = {
      pebble: { x: -4, y: 4, z: 40, yaw: PI },
      gate: { x: 0, y: 0, z: 42 },
      noa_court: { x: -6, y: 0, z: 6 },
      tal_court: { x: 5, y: 0, z: -6 },
      orla_court: { x: 0, y: 0, z: -16 },
      castleDoor: { x: 0, y: 0, z: -23 },
      fountain: { x: 0, y: 0, z: 0 }
    };
    for (let i = 1; i <= 8; i++) {
      const a = (i - 1) / 8 * TAU;
      anchors['shade' + i] = { x: Math.round(Math.sin(a) * 16 * 100) / 100, y: 1.5, z: Math.round(Math.cos(a) * 16 * 100) / 100 };
    }

    return {
      id: 'grounds',
      group: b.group,
      bounds: bounds,
      colliders: b.colliders,
      spawns: { start: { x: 0, z: 74, yaw: 0 }, fromCastle: { x: 0, z: -19, yaw: PI }, courtyard: { x: 0, z: 10, yaw: 0 } },
      doors: [{ id: 'grounds.castleDoor', x: 0, z: -23, radius: 2.6, to: 'entrance', toSpawn: 'fromGrounds', label: txt('כניסה לטירה', 'Enter the castle') }],
      anchors: anchors,
      ambient: { background: 0x0b1430, fogColor: 0x0b1430, fogDensity: 0.0075, hemiSky: 0x7a8ccc, hemiGround: 0x10141e, hemiIntensity: 0.5, music: 'night' },
      api: {
        // extra (not required): light/darken one of the nine lantern-towers on the skyline (i 1..9)
        // i 1..8 = outer towers west→east, 9 = the tall central tower of the Ninth Lantern
        setTowerLanternLit: function (i, lit) { const t = towerLamps[[0, 1, 2, 3, 5, 6, 7, 8, 4][i - 1]]; if (t) t.target = lit ? 1 : 0; }
      },
      update: function (dt, t) {
        b.updateCommon(dt, t);
        for (let i = 0; i < towerLamps.length; i++) {
          const tl = towerLamps[i];
          tl.level += (tl.target - tl.level) * Math.min(1, dt * 2);
          const k = tl.level * (0.9 + Math.sin(t * 1.3 + tl.ph) * 0.1);
          tl.glow.material.opacity = 0.95 * k;
          tl.mat.color.setRGB(0.1 + 0.9 * k, 0.08 + 0.7 * k, 0.06 + 0.32 * k);
        }
      }
    };
  }

  // ===================================================================================
  // 5. AREA: entrance (Entrance Hall)
  // ===================================================================================
  function buildEntrance(ctx) {
    initCtx(ctx);
    const b = new Builder('entrance', 202);
    const bounds = { minX: -14, maxX: 14, minZ: -12, maxZ: 12 };
    const H = 12;
    const wallM = M('stoneWarm');

    b.floor(-14, 14, -12, 12, M('flag'));
    b.ceiling(-14.6, 14.6, -12.6, 12.6, H, M('planksDark'));
    for (let z = -10; z <= 10; z += 4) b.box(28.4, 0.5, 0.45, 0, H - 0.25, z, M('woodDark'));
    for (let s = -1; s <= 1; s += 2) b.box(0.6, 0.7, 24.6, s * 5, H - 0.6, 0, M('woodDark'));
    // walls (north wall has two openings: stair arch and crypt stair)
    b.roomWalls(bounds, H, wallM, { n: true });
    const nz = -12.3;
    b.box(11.4, H, 0.6, -8.6, H / 2, nz, wallM);            // x[-14.3,-2.9]
    b.box(5.9, H, 0.6, 5.85, H / 2, nz, wallM);              // x[2.9,8.8]
    b.box(3.4, H, 0.6, 12.9, H / 2, nz, wallM);              // x[11.2,14.6]
    b.box(5.8, H - 8.4, 0.6, 0, 8.4 + (H - 8.4) / 2, nz, wallM); // lintel above the stair arch
    b.box(2.4, H - 3.6, 0.6, 10, 3.6 + (H - 3.6) / 2, nz, wallM); // lintel above the crypt arch
    // plinth + string course
    const trim = M('trim');
    b.box(28, 0.35, 0.16, 0, 0.175, 11.92, trim); b.box(28, 0.35, 0.16, 0, 0.175, -11.92, trim);
    b.box(0.16, 0.35, 24, 13.92, 0.175, 0, trim); b.box(0.16, 0.35, 24, -13.92, 0.175, 0, trim);
    b.box(28, 0.3, 0.26, 0, 8.7, 11.87, trim);
    b.box(0.26, 0.3, 24, 13.87, 8.7, 0, trim); b.box(0.26, 0.3, 24, -13.87, 8.7, 0, trim);
    b.box(10.6, 0.3, 0.26, -8.7, 8.7, -11.87, trim); b.box(10.6, 0.3, 0.26, 8.7, 8.7, -11.87, trim);

    // mosaic + carpet runner to the stairs
    b.decal(new THREE.CircleGeometry(4.6, 64), M('mosaic'), 0, 0.015, 0);
    b.rugRect(0, 8.6, 5.6, 2.2, M('runnerBlue'), PI / 2);

    // --- grand staircase (colliders x[-4,4] z[-12,-8]) rising into an arch ---
    {
      const steps = 8, rise = 0.375, run = 0.5;
      for (let i = 0; i < steps; i++) {
        const z0 = -8 - i * run, top = (i + 1) * rise;
        const d = 12 + z0; // depth to the wall (z0 .. -12)
        b.box(7.6, top, d + 0.3, 0, top / 2, z0 - (d + 0.3) / 2 + 0.0, M('trim'));
        b.box(2.6, 0.03, run, 0, top + 0.015, z0 - run / 2, M('blueCloth'));
        b.box(2.6, rise, 0.03, 0, top - rise / 2, z0 + 0.012, M('blueCloth'));
        b.box(0.08, 0.035, run, 1.34, top + 0.02, z0 - run / 2, M('brass'));
        b.box(0.08, 0.035, run, -1.34, top + 0.02, z0 - run / 2, M('brass'));
      }
      // continuing stairs beyond the arch into the tower stairwell
      for (let i = 0; i < 6; i++) {
        const z0 = -12.6 - i * 0.5, top = 3 + (i + 1) * 0.375;
        b.box(5.2, 0.375, 0.5, 0, top - 0.19, z0 - 0.25, M('trim'));
        b.box(2.4, 0.03, 0.5, 0, top + 0.015, z0 - 0.25, M('blueCloth'));
      }
      b.box(0.5, 8, 4, -2.85, 5, -14.6, M('stoneWarm'));
      b.box(0.5, 8, 4, 2.85, 5, -14.6, M('stoneWarm'));
      b.box(6, 0.5, 4, 0, 8.6, -14.6, M('stoneWarm'));
      b.box(6, 8, 0.5, 0, 5, -16.7, M('stoneWarm'));
      b.sconce('e', -2.58, 5.4, -14.4, null);
      b.sprite(M('glowSoft'), 0, 5.6, -15.5, 4, 4);
      b.doorway({ face: 'n', x: 0, y: 3.0, z: -11.98, w: 5.2, h: 5.2, kind: 'none', frameMat: trim, frame: 0.45 });
      const pl = b.plaque(L.tower.he, L.tower.en, 2.2);
      pl.position.set(0, 9.35, -11.85); b.add(pl);
      // balustrades
      const ang = Math.atan2(3, 4);
      for (let s = -1; s <= 1; s += 2) {
        const x = s * 3.75;
        const rail = b.box(0.22, 0.16, 5.0, x, 2.75, -10.0, M('woodDark'));
        rail.rotation.x = ang;
        const side = b.box(0.3, 0.5, 5.0, x, 1.75 - 0.05, -10.0, trim);
        side.rotation.x = ang;
        for (let k = 0; k < 8; k++) {
          const z = -8.25 - k * 0.5, top = (k + 1) * 0.375;
          b.prim('cyl8', trim, x, top + 0.48, z, 0.06, 0.95, 0.06);
        }
        b.block(0.55, 1.5, 0.55, x, 0, -8.2, trim);
        b.block(0.7, 0.12, 0.7, x, 1.5, -8.2, M('trimDark'));
        // newel lanterns
        b.prim('cyl6', M('brass'), x, 1.66, -8.2, 0.12, 0.08, 0.12);
        const lg = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffa040, emissiveIntensity: 1.2 });
        b.prim('cyl6', lg, x, 1.88, -8.2, 0.1, 0.34, 0.1);
        b.prim('cone6', M('brass'), x, 2.12, -8.2, 0.16, 0.16, 0.16);
        b.sprite(M('glowWarm'), x, 1.9, -8.2, 1.4, 1.4);
        // top newels at the landing
        b.block(0.5, 1.1, 0.5, x, 3, -11.7, trim);
      }
      b.col(-4.05, 4.05, -12.5, -7.92);
    }

    // --- crypt stair in the NE corner: barred arch with steps going down ---
    {
      b.doorway({ face: 'n', x: 10, z: -11.98, w: 2.2, h: 3.2, kind: 'grate', plaque: L.crypt, plaqueW: 1.4, voidDepth: 3.0 });
      for (let i = 0; i < 6; i++) b.box(2.2, 0.3, 0.5, 10, -0.15 - i * 0.32, -12.35 - i * 0.5, M('trimDark'));
      b.box(0.3, 4, 3.4, 8.75, 0.5, -13.8, M('stoneDark')); b.box(0.3, 4, 3.4, 11.25, 0.5, -13.8, M('stoneDark'));
      b.box(2.8, 0.3, 3.4, 10, 3.3, -13.8, M('stoneDark'));
      // lifted iron trapdoor leaning against the wall beside the arch
      const lid = b.box(1.6, 0.08, 1.8, 12.6, 0.95, -11.7, M('iron'));
      lid.rotation.x = -1.25;
      for (let k = -1; k <= 1; k += 2) { const strap = b.box(0.12, 0.1, 1.8, 12.6 + k * 0.5, 0.97, -11.66, M('ironLight')); strap.rotation.x = -1.25; }
      b.col(11.8, 13.4, -12.2, -11.3, 2);
    }

    // --- doors with plaques ---
    b.doorway({ face: 's', x: 0, z: 11.98, w: 4.2, h: 6.6, kind: 'double', plaque: L.grounds, plaqueW: 1.8 });
    b.doorway({ face: 'e', x: 13.98, z: 0, w: 3.4, h: 5.6, kind: 'double', plaque: L.greathall, plaqueW: 1.8 });
    b.doorway({ face: 'w', x: -13.98, z: -5, w: 2.0, h: 3.4, kind: 'single', plaque: L.classroom });
    b.doorway({ face: 'w', x: -13.98, z: 5, w: 2.0, h: 3.4, kind: 'single', plaque: L.library });

    // --- windows (stained glass) ---
    b.window('s', -7, 3.2, 11.98, 2.0, 5.2, M('glassA'));
    b.window('s', 7, 3.2, 11.98, 2.0, 5.2, M('glassB'));
    b.window('e', 13.98, 9.2, -7, 1.4, 2.4, M('glassB'), { mullion: false });
    b.window('e', 13.98, 9.2, 7, 1.4, 2.4, M('glassA'), { mullion: false });
    b.window('w', -13.98, 9.2, 0, 1.4, 2.4, M('glassA'), { mullion: false });
    b.window('w', -13.98, 9.2, -9, 1.4, 2.4, M('glassB'), { mullion: false });
    b.window('w', -13.98, 9.2, 9, 1.4, 2.4, M('glassB'), { mullion: false });

    // --- banners & tapestries ---
    b.banner('n', -9.5, 11.2, -11.92, 2.2, 5.4, M('banner'), true);
    b.banner('n', 9.0, 11.2, -11.92, 1.4, 3.6, M('banner'), true);
    b.banner('e', 13.92, 8.2, -9.2, 1.6, 4.0, M('banner'), true);
    b.banner('e', 13.92, 8.2, 9.2, 1.6, 4.0, M('banner'), true);
    b.banner('w', -13.92, 8.2, -9.6, 1.5, 3.8, M('tapCastle'), false);
    b.banner('w', -13.92, 8.2, 9.6, 1.5, 3.8, M('tapStars'), false);
    b.framedPicture('w', -13.9, 5.6, 0, 2.2, 1.65, M('paintLake'));

    // --- suits of armour ---
    b.armour(13.2, -5, -PI / 2);
    b.armour(13.2, 5, -PI / 2);
    b.armour(-13.2, 0, PI / 2);
    b.armour(-5.6, 11.2, PI);
    b.armour(5.6, 11.2, PI);

    // benches along the south wall
    for (let s = -1; s <= 1; s += 2) {
      b.block(3.0, 0.45, 0.6, s * 10.2, 0, 11.4, M('wood'));
      b.block(3.0, 0.7, 0.1, s * 10.2, 0.45, 11.7, M('wood'));
      b.col(s * 10.2 - 1.55, s * 10.2 + 1.55, 11.0, 12.5, 1);
    }
    // standing candelabra beside the classroom/library doors
    [[-12.6, -2.4], [-12.6, 2.4], [12.6, -2.4], [12.6, 2.4]].forEach(function (p) {
      b.prim('cyl8', M('iron'), p[0], 0.06, p[1], 0.28, 0.12, 0.28);
      b.prim('cyl8', M('iron'), p[0], 0.9, p[1], 0.035, 1.7, 0.035);
      b.prim('cyl8', M('iron'), p[0], 1.76, p[1], 0.16, 0.05, 0.16);
      b.candle(p[0], 1.78, p[1], 0.26);
      b.colAt(p[0], p[1], 0.3, 0.3, 2);
    });

    // --- torches (6 lights) + chandelier (1 light) ---
    b.sconce('s', -3.3, 3.4, 11.95, { intensity: 1.4, distance: 13 });
    b.sconce('s', 3.3, 3.4, 11.95, { intensity: 1.4, distance: 13 });
    b.sconce('n', -6.2, 3.6, -11.95, { intensity: 1.4, distance: 13 });
    b.sconce('n', 6.2, 3.6, -11.95, { intensity: 1.4, distance: 13 });
    b.sconce('e', 13.95, 3.4, -2.6, null); b.sconce('e', 13.95, 3.4, 2.6, null);
    b.sconce('e', 13.95, 3.6, 8.6, { intensity: 1.2, distance: 12 });
    b.sconce('w', -13.95, 3.6, -9.0, { intensity: 1.2, distance: 12 });
    b.sconce('w', -13.95, 3.6, 9.0, null);
    b.chandelier(0, 8.2, 1, 1.7, 12, H);
    const cl = b.light(0xffc878, 1.5, 30, 0, 7.6, 1);
    b.flicker(cl, 0.05);

    return {
      id: 'entrance',
      group: b.group,
      bounds: bounds,
      colliders: b.colliders,
      spawns: {
        fromGrounds: { x: 0, z: 8, yaw: 0 }, fromGreatHall: { x: 10.5, z: 0, yaw: PI / 2 }, fromClassroom: { x: -10.5, z: -5, yaw: -PI / 2 },
        fromLibrary: { x: -10.5, z: 5, yaw: -PI / 2 }, fromTower: { x: 0, z: -5.5, yaw: PI }, fromCrypt: { x: 8, z: -7.5, yaw: PI }
      },
      doors: [
        { id: 'entrance.toGrounds', x: 0, z: 11, radius: 2, to: 'grounds', toSpawn: 'fromCastle', label: L.grounds },
        { id: 'entrance.toGreatHall', x: 13, z: 0, radius: 2, to: 'greathall', toSpawn: 'fromEntrance', label: L.greathall },
        { id: 'entrance.toClassroom', x: -13, z: -5, radius: 2, to: 'classroom', toSpawn: 'fromEntrance', label: L.classroom },
        { id: 'entrance.toLibrary', x: -13, z: 5, radius: 2, to: 'library', toSpawn: 'fromEntrance', label: L.library },
        { id: 'entrance.toTower', x: 0, z: -7.5, radius: 2, to: 'tower', toSpawn: 'fromEntrance', label: L.tower },
        { id: 'entrance.toCrypt', x: 10, z: -10, radius: 2, to: 'crypt', toSpawn: 'fromEntrance', label: L.crypt }
      ],
      anchors: {
        noa_entrance: { x: -3, y: 0, z: 3 }, tal_entrance: { x: 4, y: 0, z: -4 },
        mosaic: { x: 0, y: 0, z: 0 }, stairs: { x: 0, y: 0, z: -7.5 }
      },
      ambient: { background: 0x140d08, fogColor: 0x140d08, fogDensity: 0.012, hemiSky: 0xffe0b8, hemiGround: 0x3a2818, hemiIntensity: 0.46, music: 'hall' },
      api: {},
      update: function (dt, t) { b.updateCommon(dt, t); }
    };
  }

  // ===================================================================================
  // 6. AREA: greathall (Great Hall)
  // ===================================================================================
  function buildGreatHall(ctx) {
    initCtx(ctx);
    const b = new Builder('greathall', 303);
    const bounds = { minX: -10, maxX: 10, minZ: -20, maxZ: 20 };
    const H = 14;
    const R = b.R;
    b.floor(-10, 10, -20, 20, M('flag'));
    b.roomWalls(bounds, H, M('stoneWarm'));
    b.ceiling(-10.6, 10.6, -20.6, 20.6, H, M('planksDark'));
    // hammer-beam trusses
    for (let z = -17.5; z <= 17.5; z += 5) {
      b.box(20.4, 0.55, 0.45, 0, 12.3, z, M('woodDark'));
      for (let s = -1; s <= 1; s += 2) {
        b.box(0.45, 3.2, 0.45, s * 9.7, 10.6, z, M('woodDark'));
        const br = b.box(0.35, 3.6, 0.35, s * 8.6, 11.0, z, M('woodDark')); br.rotation.z = s * 0.7;
        const up = b.box(0.35, 3.0, 0.35, s * 4.0, 13.2, z, M('woodDark')); up.rotation.z = s * 1.1;
      }
      b.box(0.4, 1.7, 0.4, 0, 13.1, z, M('woodDark'));
    }
    b.box(0.5, 0.5, 41, 0, 13.7, 0, M('woodDark'));
    // wainscot
    for (let s = -1; s <= 1; s += 2) {
      b.box(0.12, 2.2, 40, s * 9.94, 1.1, 0, M('wood'));
      b.box(0.2, 0.12, 40, s * 9.9, 2.24, 0, M('woodDark'));
    }
    b.box(20, 2.2, 0.12, 0, 1.1, 19.94, M('wood'));
    // --- dais (collider h 0.5) + staff table ---
    b.box(20, 0.5, 5, 0, 0.25, -17.5, M('trim'));
    b.box(20, 0.04, 5, 0, 0.52, -17.5, M('planks'));
    b.box(20, 0.08, 0.12, 0, 0.46, -14.99, M('brass'));
    b.col(-10, 10, -20, -15, 0.5);
    {
      const ty = 0.5;
      b.box(10, 0.08, 1.0, 0, ty + 0.85, -19.0, M('wood'));
      b.box(10.05, 0.7, 0.02, 0, ty + 0.5, -18.48, M('blueCloth'));
      b.box(10.05, 0.06, 0.03, 0, ty + 0.83, -18.47, M('copperCloth'));
      for (let x = -4.5; x <= 4.5; x += 3) b.box(0.12, 0.8, 0.8, x, ty + 0.4, -19.0, M('woodDark'));
      for (let i = 0; i < 7; i++) {
        const x = -4.2 + i * 1.4, big = i === 3;
        b.box(0.6, 0.08, 0.55, x, ty + 0.5, -19.65, M('wood'));
        b.box(0.6, big ? 2.2 : 1.4, 0.08, x, ty + (big ? 1.6 : 1.2), -19.9, M('woodDark'));
        if (big) b.prim('sphereLo', M('brass'), x, ty + 2.75, -19.9, 0.12);
      }
      [-3, 0, 3].forEach(function (x) {
        b.prim('cyl8', M('brass'), x, ty + 0.92, -19.0, 0.1, 0.06, 0.1);
        b.prim('cyl8', M('brass'), x, ty + 1.15, -19.0, 0.025, 0.42, 0.025);
        for (let k = -1; k <= 1; k++) b.candle(x + k * 0.16, ty + 1.32, -19.0, 0.2);
      });
    }
    // north wall: rose window + banners
    {
      const rose = b.mesh(new THREE.CircleGeometry(2.6, 48), M('rose'), 0, 9.6, -19.96);
      const rf = b.mesh(new THREE.TorusGeometry(2.7, 0.22, 8, 48), M('trim'), 0, 9.6, -19.9);
      void rose; void rf;
      b.banner('n', -6, 11.5, -19.92, 2.4, 6.4, M('banner'), true);
      b.banner('n', 6, 11.5, -19.92, 2.4, 6.4, M('banner'), true);
      b.banner('n', 0, 6.6, -19.92, 2.0, 3.6, M('tapTree'), false);
    }
    // tall windows along both long walls
    for (let i = 0; i < 5; i++) {
      const z = -12 + i * 6;
      b.window('w', -9.98, 3.4, z, 2.2, 7.8, i % 2 ? M('glassB') : M('glassA'));
      b.window('e', 9.98, 3.4, z, 2.2, 7.8, i % 2 ? M('glassA') : M('glassB'));
    }
    // banners hanging between the windows (high)
    for (let i = 0; i < 4; i++) {
      const z = -9 + i * 6;
      b.banner('w', -9.9, 12.0, z, 1.2, 3.0, M('banner'), true);
      b.banner('e', 9.9, 12.0, z, 1.2, 3.0, M('banner'), true);
      b.sconce('w', -9.95, 3.2, z, null);
      b.sconce('e', 9.95, 3.2, z, null);
    }
    // --- four long tables + benches (colliders width 2.2, h 1) ---
    const tableX = [-7, -2.5, 2.5, 7];
    const tz0 = -11, tz1 = 13, tlen = tz1 - tz0, tzc = (tz0 + tz1) / 2;
    const legs = [], benchLegs = [];
    tableX.forEach(function (tx) {
      b.box(1.05, 0.08, tlen, tx, 0.78, tzc, M('wood'));
      b.box(0.08, 0.06, tlen - 0.2, tx, 0.36, tzc, M('woodDark'));
      for (let z = tz0 + 0.6; z <= tz1 - 0.5; z += (tlen - 1.1) / 6) legs.push([tx, z]);
      for (let s = -1; s <= 1; s += 2) {
        b.box(0.36, 0.06, tlen - 0.1, tx + s * 0.78, 0.45, tzc, M('wood'));
        for (let z = tz0 + 0.5; z <= tz1 - 0.4; z += (tlen - 1) / 8) benchLegs.push([tx + s * 0.78, z]);
      }
      b.col(tx - 1.1, tx + 1.1, tz0 - 0.15, tz1 + 0.15, 1);
    });
    {
      const lg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.85, 0.74, 0.12), M('woodDark'), legs.length);
      const bl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.42, 0.08), M('woodDark'), benchLegs.length);
      const d = new THREE.Object3D();
      legs.forEach(function (p, i) { d.position.set(p[0], 0.37, p[1]); d.updateMatrix(); lg.setMatrixAt(i, d.matrix); });
      benchLegs.forEach(function (p, i) { d.position.set(p[0], 0.21, p[1]); d.updateMatrix(); bl.setMatrixAt(i, d.matrix); });
      [lg, bl].forEach(function (m) { m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; b.add(m); });
    }
    // runner carpet down the centre aisle
    b.rugRect(0, 1.5, 32, 2.4, M('runnerRed'), PI / 2);

    // --- feast group (hidden until setFeast(true)) ---
    const feast = new THREE.Group(); feast.visible = false; b.add(feast);
    const feastFlames = [];
    {
      const plates = [], cups = [], food = [], pies = [];
      tableX.forEach(function (tx) {
        for (let z = tz0 + 0.6; z <= tz1 - 0.5; z += 1.15) {
          for (let s = -1; s <= 1; s += 2) { plates.push([tx + s * 0.32, z]); cups.push([tx + s * 0.4, z + 0.36]); }
        }
        for (let z = tz0 + 1.2; z <= tz1 - 1; z += 1.9) {
          if (R() < 0.5) pies.push([tx, z]); else food.push([tx, z]);
        }
      });
      const d = new THREE.Object3D();
      const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.12, 0.025, 16), M('gold'), plates.length);
      plates.forEach(function (p, i) { d.position.set(p[0], 0.835, p[1]); d.updateMatrix(); pm.setMatrixAt(i, d.matrix); });
      const cm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.035, 0.16, 10), M('gold'), cups.length);
      cups.forEach(function (p, i) { d.position.set(p[0], 0.9, p[1]); d.updateMatrix(); cm.setMatrixAt(i, d.matrix); });
      const pie = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.26, 0.22, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xc8882e, roughness: 0.7 }), pies.length);
      pies.forEach(function (p, i) { d.position.set(p[0], 0.87, p[1]); d.updateMatrix(); pie.setMatrixAt(i, d.matrix); });
      const bowl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 16, 8, 0, TAU, PI / 2, PI / 2), M('gold'), food.length);
      food.forEach(function (p, i) { d.position.set(p[0], 1.02, p[1]); d.updateMatrix(); bowl.setMatrixAt(i, d.matrix); });
      const fruitN = food.length * 5;
      const fruit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), fruitN);
      const fc = [new THREE.Color(0xc0302a), new THREE.Color(0xe0a020), new THREE.Color(0x5aa030), new THREE.Color(0x8a3a9a), new THREE.Color(0xe06a20)];
      let k = 0;
      food.forEach(function (p) {
        for (let j = 0; j < 5; j++) {
          const a = j * TAU / 5 + R();
          d.position.set(p[0] + Math.cos(a) * 0.09, 0.97, p[1] + Math.sin(a) * 0.09);
          if (j === 4) d.position.set(p[0], 1.05, p[1]);
          d.updateMatrix(); fruit.setMatrixAt(k, d.matrix); fruit.setColorAt(k, fc[(k + j) % fc.length]); k++;
        }
      });
      if (fruit.instanceColor) fruit.instanceColor.needsUpdate = true;
      [pm, cm, pie, bowl, fruit].forEach(function (m) { m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; feast.add(m); });
      // candelabras on each table (flames)
      tableX.forEach(function (tx) {
        [-6, 1, 8].forEach(function (z) {
          const c = new THREE.Mesh(G('cyl8'), M('gold')); c.scale.set(0.03, 0.4, 0.03); c.position.set(tx, 1.02, z); feast.add(c);
          const bs = new THREE.Mesh(G('cyl8'), M('gold')); bs.scale.set(0.1, 0.04, 0.1); bs.position.set(tx, 0.84, z); feast.add(bs);
          for (let j = -1; j <= 1; j++) {
            const cd = new THREE.Mesh(G('candle'), M('wax')); cd.scale.set(1, 0.18, 1); cd.position.set(tx, 1.3, z + j * 0.14); feast.add(cd);
            feastFlames.push(b.flame(tx, 1.44, z + j * 0.14, 0.12, feast, 'glowSoft'));
          }
        });
      });
    }

    // --- floating candles (instanced bodies + points flames) ---
    {
      const n = 64, pos = [], ph = [];
      for (let i = 0; i < n; i++) { pos.push([-8.5 + R() * 17, 6.2 + R() * 2.6, -14 + R() * 31]); ph.push(R() * TAU); }
      const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 8), M('wax'), n);
      im.frustumCulled = false;
      b.add(im);
      const fp = new Float32Array(n * 3);
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
      const fm = new THREE.PointsMaterial({ map: T('flame'), size: 0.38, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd8a0 });
      const pts = new THREE.Points(fg, fm); pts.frustumCulled = false; b.add(pts);
      const gm = new THREE.PointsMaterial({ map: U.glowTexture('rgba(255,180,90,0.5)', 64), size: 1.3, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 });
      const glow = new THREE.Points(fg, gm); glow.frustumCulled = false; b.add(glow);
      const d = new THREE.Object3D();
      b.anims.push(function (dt, t) {
        for (let i = 0; i < n; i++) {
          const p = pos[i], y = p[1] + Math.sin(t * 0.7 + ph[i]) * 0.15;
          d.position.set(p[0], y, p[2]); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
          fp[i * 3] = p[0]; fp[i * 3 + 1] = y + 0.22; fp[i * 3 + 2] = p[2];
        }
        im.instanceMatrix.needsUpdate = true; fg.attributes.position.needsUpdate = true;
      });
    }

    // --- the nine great lanterns at y=10 ---
    const LP = [[-5, -8], [0, -8], [5, -8], [-5, 0], [5, 0], [-5, 8], [0, 8], [5, 8], [0, 0]];
    const lanterns = [];
    {
      const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 1.5, 0.09), M('iron'), 9 * 6);
      posts.frustumCulled = false;
      const d = new THREE.Object3D();
      LP.forEach(function (p, i) {
        const x = p[0], z = p[1], y = 10, big = i === 8 ? 1.25 : 1;
        const glassMat = new THREE.MeshStandardMaterial({ color: 0xffb860, emissive: 0xff8a20, emissiveIntensity: 1.0, roughness: 0.25, transparent: true, opacity: 0.88 });
        const glass = b.mesh(new THREE.CylinderGeometry(0.52 * big, 0.52 * big, 1.4 * big, 6), glassMat, x, y, z);
        b.mesh(new THREE.CylinderGeometry(0.66 * big, 0.62 * big, 0.14, 6), M('iron'), x, y - 0.75 * big, z);
        b.mesh(new THREE.ConeGeometry(0.42 * big, 0.3, 6), M('iron'), x, y - 0.95 * big, z).rotation.x = PI;
        b.mesh(new THREE.CylinderGeometry(0.3 * big, 0.66 * big, 0.36, 6), M('iron'), x, y + 0.86 * big, z);
        b.mesh(new THREE.TorusGeometry(0.16 * big, 0.04, 6, 16), M('iron'), x, y + 1.18 * big, z);
        b.mesh(new THREE.CylinderGeometry(0.02, 0.02, H - y - 1.25 * big, 6), M('iron'), x, (H + y + 1.25 * big) / 2, z);
        for (let k = 0; k < 6; k++) {
          const a = k * TAU / 6;
          d.position.set(x + Math.cos(a) * 0.54 * big, y, z + Math.sin(a) * 0.54 * big); d.scale.set(1, big, 1); d.rotation.set(0, -a, 0); d.updateMatrix();
          posts.setMatrixAt(i * 6 + k, d.matrix);
        }
        const flameMat = new THREE.SpriteMaterial({ map: T('flame'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const flame = b.sprite(flameMat, x, y - 0.1, z, 0.36 * big, 0.66 * big);
        const glowMat = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,180,80,0.8)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 });
        const glow = b.sprite(glowMat, x, y, z, 5.5 * big, 5.5 * big);
        lanterns.push({ glass: glassMat, flame: flame, flameMat: flameMat, glow: glow, glowMat: glowMat, level: 1, lit: true, flick: 0, ph: R() * 10, big: big });
      });
      posts.instanceMatrix.needsUpdate = true;
      b.add(posts);
    }
    // hall lights: three rows for the lanterns + dais + door
    const rowLights = [b.light(0xffc070, 1.5, 24, 0, 8.6, -8), b.light(0xffc070, 1.5, 24, 0, 8.6, 0), b.light(0xffc070, 1.5, 24, 0, 8.6, 8)];
    const rowOf = [0, 0, 0, 1, 1, 2, 2, 2, 1];
    const dais = b.light(0xffb868, 1.1, 14, 0, 3.2, -17);
    b.flicker(dais, 0.08);
    b.sconce('s', -2.8, 3.4, 19.95, { intensity: 1.2, distance: 12 });
    b.sconce('s', 2.8, 3.4, 19.95, { intensity: 1.2, distance: 12 });
    const sideL = b.light(0xff9a50, 0.9, 14, -9.2, 3.6, -3);
    const sideR = b.light(0xff9a50, 0.9, 14, 9.2, 3.6, 9);
    b.flicker(sideL, 0.15); b.flicker(sideR, 0.15);
    const warm = new THREE.Color(0xffc070), feastCol = new THREE.Color(0xffd890);
    let feastOn = false, feastK = 0;

    // door
    b.doorway({ face: 's', x: 0, z: 19.98, w: 3.6, h: 6.0, kind: 'double', plaque: L.entrance, plaqueW: 1.8 });

    // anchors (seats face their table)
    const anchors = {
      orla: { x: 0, y: 0.5, z: -17.5, yaw: PI }, dov: { x: -3.5, y: 0.5, z: -17.5, yaw: PI },
      noa: { x: -0.6, y: 0, z: 3 }, tal: { x: 0.7, y: 0, z: -5 }, pebble_feast: { x: -0.7, y: 0, z: -12 }
    };
    let si = 1;
    tableX.forEach(function (tx) {
      [-8, 1, 10].forEach(function (z) {
        anchors['seat' + (si++)] = { x: tx - 0.78, y: 0, z: z, yaw: -PI / 2 };
        anchors['seat' + (si++)] = { x: tx + 0.78, y: 0, z: z + 0.6, yaw: PI / 2 };
      });
    });
    LP.forEach(function (p, i) { anchors['lantern' + (i + 1)] = { x: p[0], y: 10, z: p[1] }; });

    function setLanternLit(i, lit) {
      const l = lanterns[i - 1];
      if (!l) return;
      lit = !!lit;
      if (l.lit === lit) return;
      l.lit = lit;
      l.flick = lit ? 0 : 1.8; // seconds of flicker before dying
    }

    return {
      id: 'greathall',
      group: b.group,
      bounds: bounds,
      colliders: b.colliders,
      spawns: { fromEntrance: { x: 0, z: 16, yaw: 0 } },
      doors: [{ id: 'greathall.toEntrance', x: 0, z: 19, radius: 2, to: 'entrance', toSpawn: 'fromGreatHall', label: L.entrance }],
      anchors: anchors,
      ambient: { background: 0x140d08, fogColor: 0x140d08, fogDensity: 0.009, hemiSky: 0xffe2bc, hemiGround: 0x3a2818, hemiIntensity: 0.55, music: 'hall' },
      api: {
        setLanternLit: setLanternLit,
        setFeast: function (on) { feastOn = !!on; feast.visible = feastOn; }
      },
      update: function (dt, t) {
        b.updateCommon(dt, t);
        feastK += ((feastOn ? 1 : 0) - feastK) * Math.min(1, dt * 1.5);
        const rows = [0, 0, 0], cnt = [0, 0, 0];
        for (let i = 0; i < lanterns.length; i++) {
          const l = lanterns[i];
          let target = l.lit ? 1 : 0;
          if (!l.lit && l.flick > 0) {
            l.flick -= dt;
            const n = Math.sin(t * 31 + l.ph) + Math.sin(t * 17.3 + l.ph * 3);
            target = l.flick > 0.5 ? (n > 0.3 ? 1 : 0.15) : 0.25 * (l.flick / 0.5);
            l.level = target;
          } else {
            l.level += (target - l.level) * Math.min(1, dt * (l.lit ? 1.6 : 3));
          }
          const k = clamp(l.level, 0, 1.2) * (0.94 + Math.sin(t * 5 + l.ph) * 0.04 + Math.sin(t * 11.7 + l.ph) * 0.02);
          l.glass.emissiveIntensity = 0.04 + 0.95 * k;
          l.glass.color.setRGB(0.25 + 0.75 * Math.min(1, k), 0.22 + 0.5 * Math.min(1, k), 0.2 + 0.18 * Math.min(1, k));
          l.glowMat.opacity = 0.9 * k;
          l.flame.visible = k > 0.03;
          l.flame.scale.set(0.36 * l.big * (0.9 + Math.sin(t * 13 + l.ph) * 0.1), 0.66 * l.big * k, 1);
          rows[rowOf[i]] += k; cnt[rowOf[i]]++;
        }
        for (let r = 0; r < 3; r++) {
          const L0 = rowLights[r];
          if (!L0) continue;
          L0.intensity = (1.6 * rows[r] / cnt[r]) * (1 + feastK * 0.35);
          L0.color.copy(warm).lerp(feastCol, feastK);
        }
      }
    };
  }

  // ===================================================================================
  // 7. AREA: classroom (Charms Classroom)
  // ===================================================================================
  function buildClassroom(ctx) {
    initCtx(ctx);
    const b = new Builder('classroom', 404);
    const bounds = { minX: -8, maxX: 8, minZ: -7, maxZ: 7 };
    const H = 6;
    b.floor(-8, 8, -7, 7, M('planks'));
    b.roomWalls(bounds, H, M('stoneWarm'));
    b.ceiling(-8.6, 8.6, -7.6, 7.6, H, M('planksDark'));
    for (let x = -6; x <= 6; x += 3) b.box(0.35, 0.4, 15.2, x, H - 0.2, 0, M('woodDark'));
    // wainscot
    b.box(16, 1.2, 0.1, 0, 0.6, 6.95, M('wood')); b.box(0.1, 1.2, 14, 7.95, 0.6, 0, M('wood')); b.box(0.1, 1.2, 14, -7.95, 0.6, 0, M('wood'));
    b.box(16, 1.2, 0.1, 0, 0.6, -6.95, M('wood'));
    b.box(16, 0.08, 0.16, 0, 1.22, 6.92, M('woodDark')); b.box(0.16, 0.08, 14, 7.92, 1.22, 0, M('woodDark')); b.box(0.16, 0.08, 14, -7.92, 1.22, 0, M('woodDark'));

    // --- blackboard on the north wall ---
    b.box(6.6, 2.7, 0.08, 0, 2.35, -6.9, M('woodDark'));
    const bb = b.mesh(new THREE.PlaneGeometry(6.3, 2.45), M('blackboard'), 0, 2.35, -6.85);
    void bb;
    b.box(6.4, 0.06, 0.18, 0, 1.06, -6.8, M('wood'));
    for (let i = 0; i < 5; i++) b.prim('cyl8', M('paper'), -2 + i * 0.35, 1.11, -6.78, 0.015, 0.09, 0.015).rotation.z = PI / 2;
    // clocks above the blackboard (hands animated)
    const clocks = [];
    function clock(face, x, y, z, r, mat, speed) {
      const g = new THREE.Group();
      const f = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat || M('clock')); f.position.z = 0.04; g.add(f);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.08, 6, 32), M('brass')); rim.position.z = 0.04; g.add(rim);
      const back = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.06, 24), M('woodDark')); back.rotation.x = PI / 2; g.add(back);
      const hh = new THREE.Group(); const hb = new THREE.Mesh(G('box'), M('iron')); hb.scale.set(r * 0.07, r * 0.5, 0.01); hb.position.y = r * 0.25; hh.add(hb); hh.position.z = 0.06; g.add(hh);
      const mh = new THREE.Group(); const mb = new THREE.Mesh(G('box'), M('iron')); mb.scale.set(r * 0.05, r * 0.78, 0.01); mb.position.y = r * 0.39; mh.add(mb); mh.position.z = 0.065; g.add(mh);
      b.onWall(g, face, x, y, z);
      clocks.push({ h: hh, m: mh, sp: speed || 1, ph: b.R() * 12 });
    }
    clock('n', 0, 4.65, -6.95, 0.55, M('clock'), 1);
    clock('n', -2.6, 4.5, -6.95, 0.34, M('clock2'), 3);
    clock('n', 2.6, 4.5, -6.95, 0.34, M('clock2'), -2);
    clock('n', -4.6, 3.6, -6.95, 0.26, M('clock'), 0.5);
    clock('n', 4.4, 3.8, -6.95, 0.22, M('clock2'), 6);
    b.anims.push(function (dt, t) {
      for (let i = 0; i < clocks.length; i++) {
        const c = clocks[i], tt = t * c.sp + c.ph;
        c.m.rotation.z = -tt * 0.5; c.h.rotation.z = -tt * 0.5 / 12;
      }
    });

    // --- teacher's desk (NE corner, against the east wall) ---
    {
      const g = new THREE.Group();
      const top = new THREE.Mesh(boxGeo(1.25, 0.08, 2.4), M('wood')); top.position.y = 0.92; g.add(top);
      const body = new THREE.Mesh(boxGeo(1.1, 0.86, 2.3), M('woodDark')); body.position.y = 0.45; g.add(body);
      const panel = new THREE.Mesh(boxGeo(0.02, 0.6, 1.9), M('wood')); panel.position.set(-0.56, 0.48, 0); g.add(panel);
      g.position.set(6.95, 0, -4.5); b.add(g);
      b.col(6.25, 8, -5.75, -3.25, 1);
      b.bookStack(6.9, 0.96, -5.3, 4);
      // brass orrery-clock on the desk
      b.prim('cyl', M('brass'), 6.95, 0.99, -4.2, 0.18, 0.06, 0.18);
      b.prim('cyl8', M('brass'), 6.95, 1.2, -4.2, 0.02, 0.4, 0.02);
      const orb = new THREE.Group(); orb.position.set(6.95, 1.38, -4.2); b.add(orb);
      const sun = new THREE.Mesh(G('sphere'), new THREE.MeshStandardMaterial({ color: 0xffc860, emissive: 0xff9a20, emissiveIntensity: 0.8 })); sun.scale.setScalar(0.06); orb.add(sun);
      for (let i = 0; i < 3; i++) {
        const arm = new THREE.Group(); orb.add(arm);
        const p = new THREE.Mesh(G('sphereLo'), b.bookMat([0x3a6ab0, 0xb04a3a, 0x6a9a4a][i])); p.scale.setScalar(0.025 + i * 0.008); p.position.x = 0.12 + i * 0.07; arm.add(p);
        const sp = 1.2 - i * 0.35;
        b.anims.push(function (dt, t) { arm.rotation.y = t * sp + i; });
      }
      const ring = new THREE.Mesh(G('torus'), M('brass')); ring.scale.setScalar(0.2); ring.rotation.x = PI / 2; orb.add(ring);
      b.candle(7.1, 0.96, -3.6, 0.2);
      b.prim('cyl8', M('iron'), 6.75, 1.0, -3.7, 0.05, 0.08, 0.05);
      const quill = b.prim('cone8', M('creamCloth'), 6.78, 1.12, -3.72, 0.02, 0.22, 0.02); quill.rotation.z = 0.4;
      const dl = b.light(0xffc070, 0.7, 6, 7.0, 1.4, -3.6); b.flicker(dl, 0.12);
    }

    // --- student desks: two rows in the south half, aisle x∈[−1,1] clear ---
    const rows = [1.0, 4.0];
    rows.forEach(function (rz) {
      [-1, 1].forEach(function (side) {
        const x0 = side < 0 ? -7 : 1.5, x1 = side < 0 ? -1.5 : 7;
        const n = 3, dw = (x1 - x0 - 0.2 * (n - 1)) / n;
        for (let i = 0; i < n; i++) {
          const cx = x0 + dw / 2 + i * (dw + 0.2);
          const top = b.box(dw, 0.06, 0.8, cx, 0.78, rz, M('wood'));
          top.rotation.x = -0.06;
          b.box(dw - 0.1, 0.5, 0.04, cx, 0.5, rz - 0.36, M('woodDark'));
          for (let s = -1; s <= 1; s += 2) b.box(0.06, 0.76, 0.7, cx + s * (dw / 2 - 0.06), 0.38, rz, M('woodDark'));
          b.bookStack(cx - dw * 0.25, 0.81, rz, 1 + Math.floor(b.R() * 2));
          b.prim('cyl8', M('iron'), cx + dw * 0.3, 0.84, rz - 0.2, 0.04, 0.06, 0.04);
          const sheet = b.box(0.3, 0.005, 0.22, cx + dw * 0.05, 0.815, rz + 0.08, M('paper')); sheet.rotation.y = b.R() - 0.5;
        }
        b.box(x1 - x0, 0.06, 0.38, (x0 + x1) / 2, 0.46, rz + 0.72, M('wood'));
        for (let x = x0 + 0.2; x <= x1 - 0.1; x += (x1 - x0 - 0.3) / 3) b.box(0.06, 0.44, 0.3, x, 0.22, rz + 0.72, M('woodDark'));
        b.col(x0 - 0.05, x1 + 0.05, rz - 0.45, rz + 0.95, 1);
      });
    });

    // --- shelves with clocks + jars on the west wall ---
    {
      const sx = -7.75;
      b.box(0.06, 3.0, 5.6, -7.97, 1.5, -3.8, M('woodDark'));
      for (let s = -1; s <= 1; s += 2) b.box(0.5, 3.0, 0.08, sx, 1.5, -3.8 + s * 2.78, M('woodDark'));
      b.box(0.56, 0.1, 5.7, sx + 0.02, 3.02, -3.8, M('wood'));
      for (let k = 0; k < 4; k++) b.box(0.5, 0.05, 5.5, sx, 0.35 + k * 0.78, -3.8, M('wood'));
      const jarCols = [0x7ab0a0, 0xc8a04a, 0x8a5ab0, 0x5a8ac8];
      for (let k = 0; k < 4; k++) {
        for (let i = 0; i < 6; i++) {
          const z = -6.2 + i * 0.85 + (b.R() - 0.5) * 0.2, y = 0.38 + k * 0.78;
          const r = b.R();
          if (r < 0.4) { // small clock
            const cr = 0.14 + b.R() * 0.08;
            const c = b.mesh(new THREE.CylinderGeometry(cr, cr, 0.08, 20), M('brass'), sx + 0.12, y + cr + 0.02, z); c.rotation.z = PI / 2;
            const f = b.mesh(new THREE.CircleGeometry(cr * 0.85, 20), M(b.R() < 0.5 ? 'clock' : 'clock2'), sx + 0.165, y + cr + 0.02, z); f.rotation.y = PI / 2;
          } else if (r < 0.75) {
            const jm = new THREE.MeshStandardMaterial({ color: jarCols[(i + k) % 4], roughness: 0.2, transparent: true, opacity: 0.75, emissive: jarCols[(i + k) % 4], emissiveIntensity: 0.12 });
            b.prim('cyl8', jm, sx + 0.08, y + 0.14, z, 0.09, 0.26, 0.09);
            b.prim('cyl8', M('woodDark'), sx + 0.08, y + 0.29, z, 0.06, 0.05, 0.06);
          } else b.bookStack(sx + 0.05, y + 0.01, z, 2 + Math.floor(b.R() * 3));
        }
      }
      b.col(-8, -7.45, -6.65, -0.95);
    }
    // grandfather clock with swinging pendulum (SW corner)
    {
      const x = -7.35, z = 6.35;
      b.box(0.9, 2.5, 0.6, x, 1.25, z, M('woodDark'));
      b.box(1.0, 0.25, 0.7, x, 2.6, z, M('wood'));
      const f = b.mesh(new THREE.CircleGeometry(0.3, 28), M('clock'), x + 0.46, 2.15, z); f.rotation.y = PI / 2;
      const win = b.mesh(new THREE.PlaneGeometry(0.42, 1.1), new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.3, metalness: 0.2 }), x + 0.455, 1.05, z); win.rotation.y = PI / 2;
      const pend = new THREE.Group(); pend.position.set(x + 0.44, 1.75, z); b.add(pend);
      const rod = new THREE.Mesh(G('box'), M('brass')); rod.scale.set(0.015, 0.85, 0.02); rod.position.y = -0.42; pend.add(rod);
      const bob = new THREE.Mesh(G('cyl'), M('brass')); bob.scale.set(0.1, 0.02, 0.1); bob.rotation.z = PI / 2; bob.position.y = -0.85; pend.add(bob);
      b.anims.push(function (dt, t) { pend.rotation.x = Math.sin(t * PI) * 0.22; });
      b.col(-8, -6.85, 5.95, 7);
    }
    // big window on the east wall (daylight)
    {
      const g = new THREE.Group();
      const gl = new THREE.Mesh(archGeo(4.4, 3.6, false), M('leaded')); gl.position.z = 0.02; g.add(gl);
      const fr = new THREE.Mesh(archFrameGeo(4.4, 3.6, 0.25, 0.3, false), M('trim')); fr.position.z = -0.12; g.add(fr);
      const sill = new THREE.Mesh(G('box'), M('trim')); sill.scale.set(5, 0.14, 0.4); sill.position.set(0, -0.06, 0.12); g.add(sill);
      for (let s = -1; s <= 1; s += 2) { const mu = new THREE.Mesh(G('box'), M('trim')); mu.scale.set(0.08, 2.4, 0.1); mu.position.set(s * 0.73, 1.2, 0.05); g.add(mu); }
      b.onWall(g, 'e', 7.98, 1.3, 3.0);
      const sun = new THREE.MeshBasicMaterial({ map: U.glowTexture('rgba(255,240,200,0.5)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.25, side: THREE.DoubleSide });
      const beam = b.mesh(new THREE.PlaneGeometry(4.2, 7), sun, 5.2, 1.8, 2.4); beam.rotation.set(-PI / 2 + 0.5, 0, 0.6);
      b.light(0xe8f0ff, 1.3, 14, 6.4, 3.0, 3.0);
      // potted plant on the sill corner
      b.prim('cyl8', M('copper'), 7.35, 1.42, 4.9, 0.18, 0.26, 0.18);
      b.prim('sphereLo', M('greenCloth'), 7.35, 1.75, 4.9, 0.3, 0.26, 0.3);
    }
    // charts on the south wall
    {
      const chart = new THREE.MeshStandardMaterial({ map: T('notice'), roughness: 0.9 });
      b.framedPicture('s', -4.5, 2.4, 6.92, 1.6, 1.6, chart);
      b.banner('s', 4.5, 3.6, 6.92, 1.3, 2.6, M('banner'), false);
      b.banner('w', -7.92, 5.2, 2.6, 1.0, 2.2, M('banner'), false);
    }
    // hanging lamps (2 lights)
    b.hangingLamp(-3, 4.5, -1.5, H); b.hangingLamp(3, 4.5, 2.5, H);
    const l1 = b.light(0xffc878, 1.2, 13, -3, 4.2, -1.5); b.flicker(l1, 0.05);
    const l2 = b.light(0xffc878, 1.2, 13, 3, 4.2, 2.5); b.flicker(l2, 0.05);
    // door
    b.doorway({ face: 's', x: 0, z: 6.98, w: 2.0, h: 3.2, kind: 'single', plaque: L.entrance });
    // floating chalk sparkles near the blackboard
    {
      const n = 24, pp = new Float32Array(n * 3);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      const pm = new THREE.PointsMaterial({ map: U.glowTexture('rgba(255,250,220,0.8)', 64), size: 0.12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 });
      const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; b.add(pts);
      b.anims.push(function (dt, t) {
        for (let i = 0; i < n; i++) { const k = (t * 0.08 + i / n) % 1; pp[i * 3] = -3 + (i / n) * 6 + Math.sin(t + i) * 0.2; pp[i * 3 + 1] = 1.2 + k * 2.6; pp[i * 3 + 2] = -6.6 + Math.sin(t * 0.7 + i) * 0.15; }
        pg.attributes.position.needsUpdate = true;
      });
    }

    return {
      id: 'classroom',
      group: b.group,
      bounds: bounds,
      colliders: b.colliders,
      spawns: { fromEntrance: { x: 0, z: 5, yaw: 0 } },
      doors: [{ id: 'classroom.toEntrance', x: 0, z: 6.5, radius: 2, to: 'entrance', toSpawn: 'fromClassroom', label: L.entrance }],
      anchors: {
        // CONTRACT-NOTE: dov yaw points from (5,−5.5) toward the room centre.
        dov: { x: 5, y: 0, z: -5.5, yaw: yawTo(5, -5.5, 0, 0) },
        dummy1: { x: -4, y: 0, z: -3 }, dummy2: { x: -1, y: 0, z: -4.5 }, dummy3: { x: 2.5, y: 0, z: -3 },
        noa: { x: -2.5, y: 0, z: 2.5 }, tal: { x: 2.5, y: 0, z: 2.5 },
        blackboard: { x: 0, y: 2.3, z: -6.8 }
      },
      ambient: { background: 0x1a130c, fogColor: 0x1a130c, fogDensity: 0.01, hemiSky: 0xfff0d8, hemiGround: 0x3a2a1a, hemiIntensity: 0.52, music: 'calm' },
      api: {},
      update: function (dt, t) { b.updateCommon(dt, t); }
    };
  }

  // ===================================================================================
  // 8. AREA: library
  // ===================================================================================
  function buildLibrary(ctx) {
    initCtx(ctx);
    const b = new Builder('library', 505);
    const bounds = { minX: -12, maxX: 12, minZ: -10, maxZ: 10 };
    const H = 9;
    const R = b.R;
    const wm = M('stoneWarm');
    b.floor(-12, 12, -10, 12, M('planks'));
    b.roomWalls(bounds, H, wm, { n: true });
    // north wall with the secret niche hole x[-0.9,0.9] y[0.15,2.45]
    b.box(11.7, H, 0.6, -6.75, H / 2, -10.3, wm);
    b.box(11.7, H, 0.6, 6.75, H / 2, -10.3, wm);
    b.box(1.8, H - 2.45, 0.6, 0, 2.45 + (H - 2.45) / 2, -10.3, wm);
    b.box(1.8, 0.15, 0.6, 0, 0.075, -10.3, wm);
    // niche interior
    b.box(1.8, 2.6, 0.2, 0, 1.3, -11.0, M('trim'));
    b.box(0.2, 2.6, 0.8, -0.95, 1.3, -10.6, M('trim')); b.box(0.2, 2.6, 0.8, 0.95, 1.3, -10.6, M('trim'));
    b.box(1.8, 0.2, 0.8, 0, 2.55, -10.6, M('trim'));
    b.box(1.8, 0.16, 0.8, 0, 0.08, -10.6, M('trim'));
    b.prim('cyl', M('trimDark'), 0, 0.5, -10.55, 0.28, 0.7, 0.28);
    b.prim('cyl', M('blueCloth'), 0, 0.9, -10.55, 0.32, 0.1, 0.32);
    const nicheGlowMat = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,200,100,0.85)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const nicheGlow = b.sprite(nicheGlowMat, 0, 1.3, -10.3, 2.4, 2.4);
    const nicheLight = b.light(0xffc060, 0, 7, 0, 1.4, -9.4);

    b.ceiling(-12.6, 12.6, -10.6, 10.6, H, M('planksDark'));
    for (let x = -10; x <= 10; x += 4) b.box(0.4, 0.5, 21.2, x, H - 0.25, 0, M('woodDark'));
    for (let z = -8; z <= 8; z += 4) b.box(25.2, 0.4, 0.3, 0, H - 0.2, z, M('woodDark'));

    // --- shelf rows z∈{−4,0,4}, x∈[−11,−3] and [3,11] (double-sided, colliders) ---
    [-4, 0, 4].forEach(function (z, i) {
      [-7, 7].forEach(function (x, j) {
        b.bookcase(x, z, 8, 3.4, 0.8, 0, true, (i + j) % 2 ? M('books1') : M('books2'));
        // end caps
        for (let s = -1; s <= 1; s += 2) b.box(0.12, 3.5, 0.9, x + s * 4.04, 1.75, z, M('wood'));
        b.col(x - 4.0, x + 4.0, z - 0.45, z + 0.45);
      });
    });
    // north wall cases and south wall cases
    [-7.1, 7.1].forEach(function (x) {
      b.bookcase(x, -9.72, 7.8, 3.4, 0.55, 0, false, M('books2'));
      b.col(x - 3.95, x + 3.95, -10, -9.42);
      b.bookcase(x, 9.72, 7.8, 3.4, 0.55, PI, false, M('books1'));
      b.col(x - 3.95, x + 3.95, 9.42, 10);
    });
    // the secret shelf (slides aside to x[1.05,3.05])
    const secret = new THREE.Group(); b.add(secret);
    {
      const geo = new THREE.BoxGeometry(2.0, 2.6, 0.5);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4); if (f === 4) uv.setXY(i, uv.getX(i), uv.getY(i)); else uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 2.6); }
      const sm = new THREE.Mesh(geo, [M('woodDark'), M('woodDark'), M('woodDark'), M('woodDark'), M('books3'), M('woodDark')]);
      sm.position.set(0, 1.3, 0); secret.add(sm);
      const cap = new THREE.Mesh(G('box'), M('wood')); cap.scale.set(2.1, 0.12, 0.58); cap.position.y = 2.66; secret.add(cap);
      // a single tell-tale book that sticks out a little
      const tell = new THREE.Mesh(G('box'), b.bookMat(0x8a1f2e)); tell.scale.set(0.07, 0.3, 0.26); tell.position.set(0.32, 1.95, 0.2); secret.add(tell);
      secret.position.set(0, 0, -9.75);
    }
    const secretCol = b.col(-1.0, 1.0, -10, -9.45);
    // stone frame around the niche (revealed when the shelf slides)
    {
      const fr = new THREE.Mesh(archFrameGeo(1.8, 2.3, 0.2, 0.06, false, true), M('trim'));
      fr.position.set(0, 0.15, -10.02); b.add(fr);
    }
    // rose window above
    b.mesh(new THREE.CircleGeometry(2.0, 40), M('rose'), 0, 5.9, -9.98);
    b.mesh(new THREE.TorusGeometry(2.1, 0.2, 8, 40), M('trim'), 0, 5.9, -9.92);
    b.banner('n', -2.2, 8.0, -9.95, 0.9, 2.6, M('banner'), true);
    b.banner('n', 2.2, 8.0, -9.95, 0.9, 2.6, M('banner'), true);

    // --- riddle candles: pedestals at z=−7, x = −8,−4,0,4,8 (flame y 1.1) ---
    const candles = [];
    const symName = ['sym1', 'sym2', 'sym3', 'sym4', 'sym5'];
    [-8, -4, 0, 4, 8].forEach(function (x, i) {
      const z = -7;
      b.prim('cyl8', M('trim'), x, 0.08, z, 0.38, 0.16, 0.38);
      b.prim('cyl8', M('trim'), x, 0.5, z, 0.24, 0.8, 0.24);
      b.prim('cyl8', M('trim'), x, 0.92, z, 0.32, 0.08, 0.32);
      b.prim('cyl8', M('brass'), x, 0.975, z, 0.12, 0.03, 0.12);
      b.prim('candle', M('wax'), x, 1.0, z, 1.1, 0.08, 1.1); // stub base
      b.prim('candle', M('wax'), x, 1.03, z, 0.9, 0.06, 0.9);
      const wick = b.prim('cyl6', M('iron'), x, 1.075, z, 0.006, 0.03, 0.006); void wick;
      // engraved symbol plaque facing +Z
      const pl = b.mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshStandardMaterial({ map: T(symName[i]), roughness: 0.8, emissive: 0xffffff, emissiveMap: T(symName[i]), emissiveIntensity: 0.18 }), x, 0.55, z + 0.245);
      void pl;
      const flameMat = new THREE.SpriteMaterial({ map: T('flame'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const flame = b.sprite(flameMat, x, 1.12, z, 0.1, 0.2);
      const glowMat = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,180,90,0.7)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
      const glow = b.sprite(glowMat, x, 1.12, z, 1.2, 1.2);
      const puffMat = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(200,200,210,0.55)', 64), transparent: true, depthWrite: false, opacity: 0 });
      const puff = b.sprite(puffMat, x, 1.2, z, 0.3, 0.3);
      flame.visible = false;
      candles.push({ x: x, z: z, lit: false, k: 0, flame: flame, glowMat: glowMat, puff: puff, puffMat: puffMat, puffT: 0, ph: R() * 10 });
      b.colAt(x, z, 0.4, 0.4, 1.0);
    });
    const candleLight = b.light(0xffb060, 0, 10, 0, 2.0, -6.6);

    // --- reading tables (south band) ---
    [-7.5, 7.5].forEach(function (x) {
      b.table(x, 7.2, 2.6, 1.2, 0.8, M('wood'));
      b.chair(x - 0.7, 8.25, PI, M('wood'), M('redCloth'));
      b.chair(x + 0.7, 8.25, PI, M('wood'), M('redCloth'));
      b.chair(x - 0.7, 6.15, 0, M('wood'), M('redCloth'));
      b.chair(x + 0.7, 6.15, 0, M('wood'), M('redCloth'));
      b.bookStack(x - 0.8, 0.8, 7.0, 3);
      const open = b.box(0.5, 0.03, 0.34, x + 0.2, 0.815, 7.3, M('paper')); open.rotation.y = 0.2;
      b.prim('cyl8', M('brass'), x + 0.9, 0.82, 7.0, 0.1, 0.03, 0.1);
      b.candle(x + 0.9, 0.83, 7.0, 0.26);
      const tl = b.light(0xffb868, 0.9, 8, x + 0.9, 1.5, 7.0); b.flicker(tl, 0.12);
      b.col(x - 1.4, x + 1.4, 5.75, 8.65, 1);
    });
    // globes on stands
    [[-10.8, -7.6], [10.8, -7.6]].forEach(function (p) {
      b.prim('cyl8', M('woodDark'), p[0], 0.05, p[1], 0.3, 0.1, 0.3);
      b.prim('cyl8', M('woodDark'), p[0], 0.5, p[1], 0.04, 0.9, 0.04);
      const ring = b.prim('ring', M('brass'), p[0], 1.25, p[1], 0.42, 0.42, 0.42); ring.rotation.y = PI / 2;
      const gl = b.prim('sphere', M('globe'), p[0], 1.25, p[1], 0.38);
      b.anims.push(function (dt, t) { gl.rotation.y = t * 0.15; });
      b.colAt(p[0], p[1], 0.45, 0.45, 1.6);
    });
    // ladders leaning on shelves
    [[-6, 0.45, 1], [6.5, 4.45, 1], [-8.5, -4.45, -1]].forEach(function (p) {
      const g = new THREE.Group();
      for (let s = -1; s <= 1; s += 2) { const r = new THREE.Mesh(G('box'), M('wood')); r.scale.set(0.06, 3.3, 0.06); r.position.set(s * 0.25, 1.65, 0); g.add(r); }
      for (let k = 0; k < 9; k++) { const r = new THREE.Mesh(G('cyl6'), M('wood')); r.scale.set(0.025, 0.5, 0.025); r.rotation.z = PI / 2; r.position.set(0, 0.3 + k * 0.36, 0); g.add(r); }
      g.position.set(p[0], 0, p[1] + p[2] * 0.6);
      g.rotation.x = -p[2] * 0.2;
      b.add(g);
      b.col(p[0] - 0.35, p[0] + 0.35, Math.min(p[1], p[1] + p[2] * 0.75), Math.max(p[1], p[1] + p[2] * 0.75), 1.5);
    });
    // floating books in the centre aisle
    {
      const books = [];
      const cols = [0x6a1a1e, 0x1d2f6a, 0x24442c, 0x7a5a20, 0x4a2a5a, 0x1f6f7a, 0x8a4a20, 0x3a2a6a];
      for (let i = 0; i < 8; i++) {
        const g = new THREE.Group();
        const cover = new THREE.Mesh(G('box'), b.bookMat(cols[i])); cover.scale.set(0.34, 0.06, 0.26); g.add(cover);
        const pages = new THREE.Mesh(G('box'), M('paper')); pages.scale.set(0.32, 0.045, 0.245); pages.position.x = 0.012; g.add(pages);
        b.add(g);
        books.push({ g: g, r: 1.2 + R() * 1.4, y: 3.6 + R() * 1.8, sp: 0.15 + R() * 0.15, ph: R() * TAU, cz: -2 + R() * 6 });
      }
      b.anims.push(function (dt, t) {
        for (let i = 0; i < books.length; i++) {
          const k = books[i], a = t * k.sp + k.ph;
          k.g.position.set(Math.cos(a) * k.r * 0.9, k.y + Math.sin(t * 0.8 + k.ph) * 0.25, k.cz + Math.sin(a) * k.r * 0.6);
          k.g.rotation.set(Math.sin(t * 0.6 + k.ph) * 0.3, -a, Math.sin(t * 0.9 + k.ph) * 0.2);
        }
      });
      const n = 40, dp = new Float32Array(n * 3);
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      const dm = new THREE.PointsMaterial({ map: U.glowTexture('rgba(255,230,170,0.7)', 64), size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 });
      const dust = new THREE.Points(dg, dm); dust.frustumCulled = false; b.add(dust);
      const seeds = []; for (let i = 0; i < n; i++) seeds.push([(R() - 0.5) * 6, R() * 6, (R() - 0.5) * 18]);
      b.anims.push(function (dt, t) {
        for (let i = 0; i < n; i++) { const s = seeds[i]; dp[i * 3] = s[0] + Math.sin(t * 0.2 + i) * 0.4; dp[i * 3 + 1] = 0.5 + ((s[1] + t * 0.05) % 6); dp[i * 3 + 2] = s[2] + Math.cos(t * 0.15 + i) * 0.4; }
        dg.attributes.position.needsUpdate = true;
      });
    }
    // long rugs
    b.rugRect(0, 1.5, 11, 2.6, M('runnerBlue'), PI / 2);
    b.rugRect(0, -7.3, 2.2, 18, M('runnerRed'), 0);
    // high windows on east/west walls above the shelves
    [-6.5, -2, 2, 6.5].forEach(function (z, i) {
      b.window('w', -11.98, 4.4, z, 1.4, 3.6, i % 2 ? M('glassA') : M('glassB'));
      b.window('e', 11.98, 4.4, z, 1.4, 3.6, i % 2 ? M('glassB') : M('glassA'));
    });
    // chandeliers (2 lights)
    b.chandelier(0, 6.6, -2, 1.3, 10, H);
    b.chandelier(0, 6.6, 6, 1.3, 10, H);
    const c1 = b.light(0xffc070, 1.25, 20, 0, 6.2, -2); b.flicker(c1, 0.05);
    const c2 = b.light(0xffc070, 1.25, 20, 0, 6.2, 6); b.flicker(c2, 0.05);
    // door
    b.doorway({ face: 's', x: 0, z: 9.98, w: 2.2, h: 3.4, kind: 'single', plaque: L.entrance });

    // --- api ---
    let shelfT = -1; // <0 closed, 0..1 animating, 1 open
    function setCandleLit(i, lit) {
      const c = candles[i - 1]; if (!c) return;
      lit = !!lit;
      if (c.lit && !lit) { c.puffT = 1; }
      c.lit = lit;
    }
    function resetCandles() { for (let i = 1; i <= 5; i++) setCandleLit(i, false); }
    function openSecretShelf() { if (shelfT < 0) shelfT = 0; }

    return {
      id: 'library',
      group: b.group,
      bounds: bounds,
      colliders: b.colliders,
      spawns: { fromEntrance: { x: 0, z: 7.5, yaw: 0 } },
      doors: [{ id: 'library.toEntrance', x: 0, z: 9.5, radius: 2, to: 'entrance', toSpawn: 'fromLibrary', label: L.entrance }],
      anchors: {
        elkan: { x: 0, y: 1.3, z: -3 },
        candle1: { x: -8, y: 1.1, z: -7 }, candle2: { x: -4, y: 1.1, z: -7 }, candle3: { x: 0, y: 1.1, z: -7 },
        candle4: { x: 4, y: 1.1, z: -7 }, candle5: { x: 8, y: 1.1, z: -7 },
        secretShelf: { x: 0, y: 1.2, z: -9.2 },
        noa: { x: -2, y: 0, z: 4 }
      },
      ambient: { background: 0x120c08, fogColor: 0x120c08, fogDensity: 0.012, hemiSky: 0xffe0b8, hemiGround: 0x2a1c10, hemiIntensity: 0.5, music: 'calm' },
      api: {
        setCandleLit: setCandleLit,
        openSecretShelf: openSecretShelf,
        resetCandles: resetCandles,
        // extra helpers (not required by the contract)
        isCandleLit: function (i) { const c = candles[i - 1]; return !!(c && c.lit); },
        isSecretShelfOpen: function () { return shelfT >= 0; }
      },
      update: function (dt, t) {
        b.updateCommon(dt, t);
        let litSum = 0;
        for (let i = 0; i < candles.length; i++) {
          const c = candles[i];
          c.k += ((c.lit ? 1 : 0) - c.k) * Math.min(1, dt * (c.lit ? 5 : 12));
          const f = c.k * (0.92 + Math.sin(t * 14 + c.ph) * 0.06 + Math.sin(t * 6.1 + c.ph) * 0.05);
          c.flame.visible = c.k > 0.02;
          c.flame.scale.set(0.1 * (0.6 + 0.4 * c.k), 0.22 * f, 1);
          c.glowMat.opacity = 0.75 * f;
          litSum += f;
          if (c.puffT > 0) {
            c.puffT = Math.max(0, c.puffT - dt * 0.9);
            const p = 1 - c.puffT;
            c.puffMat.opacity = 0.55 * c.puffT;
            c.puff.position.y = 1.2 + p * 0.7;
            c.puff.scale.setScalar(0.25 + p * 0.6);
          } else c.puffMat.opacity = 0;
        }
        if (candleLight) candleLight.intensity = 0.35 * litSum;
        if (shelfT >= 0 && shelfT < 1) {
          shelfT = Math.min(1, shelfT + dt / 2.2);
          // first ease back 0.06 then slide sideways
          const back = smooth(shelfT / 0.15) * 0.06, side = smooth((shelfT - 0.15) / 0.85) * 2.05;
          secret.position.set(side, 0, -9.75 - back);
          secret.position.y = Math.sin(shelfT * 60) * 0.004 * (1 - shelfT);
          secretCol.minX = -1.0 + side; secretCol.maxX = 1.0 + side;
        }
        const open = shelfT < 0 ? 0 : smooth((shelfT - 0.4) / 0.6);
        nicheGlowMat.opacity = open * (0.85 + Math.sin(t * 2.2) * 0.12);
        if (nicheLight) nicheLight.intensity = open * (1.6 + Math.sin(t * 2.2) * 0.2);
      }
    };
  }

  // ===================================================================================
  // 9. AREA: tower (Common Room) — round room r 8
  // ===================================================================================
  function buildTower(ctx) {
    initCtx(ctx);
    const b = new Builder('tower', 606);
    const bounds = { minX: -7, maxX: 7, minZ: -7, maxZ: 7 };
    const RW = 8, HW = 7;
    const R = b.R;
    // polar placement on the wall: phi measured from +Z toward +X; front faces the centre
    function wallPos(r, phi) { return { x: Math.sin(phi) * r, z: Math.cos(phi) * r, rot: phi + PI }; }

    const fl = b.mesh(circleGeo(RW, 64), M('planks'), 0, 0, 0); fl.rotation.x = -PI / 2;
    // the shared stone material is FrontSide; render the round wall's inside with a BackSide material
    const innerStone = new THREE.MeshStandardMaterial({ map: T('stoneWarm'), roughness: 0.92, side: THREE.BackSide });
    b.mesh(wallCylGeo(RW, HW, 64), innerStone, 0, HW / 2, 0);
    const roof = b.mesh(new THREE.ConeGeometry(RW, 5, 32, 1, true), new THREE.MeshStandardMaterial({ map: T('planksDark'), roughness: 0.9, side: THREE.BackSide }), 0, HW + 2.5, 0);
    void roof;
    b.mesh(new THREE.TorusGeometry(RW - 0.1, 0.18, 6, 64), M('woodDark'), 0, HW, 0).rotation.x = PI / 2;
    b.mesh(new THREE.TorusGeometry(RW - 0.08, 0.12, 6, 64), M('trim'), 0, 0.12, 0).rotation.x = PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      const raf = new THREE.Mesh(G('box'), M('woodDark'));
      const len = Math.hypot(RW, 5);
      raf.scale.set(0.25, 0.3, len);
      const pivot = new THREE.Object3D(); pivot.position.set(0, HW, 0); pivot.rotation.y = a; b.add(pivot);
      raf.position.set(0, 2.5, RW / 2 - 0.1); raf.rotation.x = Math.atan2(5, RW); pivot.add(raf);
    }
    b.roundCorners(0, 0, 7.45, bounds, 0.6);

    // --- fireplace on the north wall (0,−7.5) ---
    {
      const tm = M('trim');
      b.block(0.7, 2.5, 1.3, -1.7, 0, -7.4, tm); b.block(0.7, 2.5, 1.3, 1.7, 0, -7.4, tm);
      b.block(4.4, 0.4, 1.45, 0, 2.5, -7.35, M('trimDark'));
      b.block(3.4, 4.1, 1.0, 0, 2.9, -7.55, M('stoneWarm'));
      b.block(2.7, 2.5, 0.2, 0, 0, -7.95, M('black'));
      b.block(2.7, 0.06, 1.2, 0, 2.44, -7.5, M('black'));
      b.block(4.6, 0.12, 1.0, 0, 0, -6.6, M('trimDark'));
      // logs + embers
      for (let i = 0; i < 3; i++) { const lg = b.prim('cyl8', M('log'), -0.3 + i * 0.3, 0.2 + (i === 1 ? 0.14 : 0), -7.4, 0.1, 1.2, 0.1); lg.rotation.z = PI / 2; lg.rotation.y = (i - 1) * 0.4; }
      b.prim('sphereLo', M('ember'), 0, 0.12, -7.4, 0.6, 0.08, 0.3);
      b.prim('box', M('iron'), 0, 0.06, -7.0, 1.6, 0.04, 0.04);
      for (let s = -1; s <= 1; s += 2) b.prim('cyl8', M('iron'), s * 0.75, 0.28, -7.0, 0.03, 0.5, 0.03);
      const fires = [];
      for (let i = 0; i < 6; i++) {
        const fx = -0.6 + i * 0.24, sz = 0.8 + R() * 0.6;
        const fm = new THREE.SpriteMaterial({ map: T('flame'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: i % 2 ? 0xffc080 : 0xffe0a0 });
        const s = b.sprite(fm, fx, 0.45 + sz * 0.4, -7.35, sz * 0.5, sz);
        fires.push({ s: s, x: fx, sz: sz, ph: R() * 10 });
      }
      b.sprite(M('glowWarm'), 0, 0.8, -7.0, 4.2, 3.4);
      b.sprite(M('glowWarm'), 0, 0.25, -7.2, 2.4, 1.0);
      b.anims.push(function (dt, t) {
        for (let i = 0; i < fires.length; i++) {
          const f = fires[i];
          const k = 0.75 + 0.25 * Math.sin(t * (7 + i) + f.ph) + 0.12 * Math.sin(t * 19 + f.ph * 2);
          f.s.scale.set(f.sz * 0.5 * (1.1 - k * 0.2), f.sz * k, 1);
          f.s.position.set(f.x + Math.sin(t * 3 + f.ph) * 0.03, 0.45 + f.sz * k * 0.42, -7.35);
        }
      });
      const fireL = b.light(0xff8a3a, 2.0, 15, 0, 1.0, -6.4);
      b.flicker(fireL, 0.22, 1.3);
      // mantel decor
      b.candle(-1.8, 2.9, -7.0, 0.3); b.candle(1.8, 2.9, -7.0, 0.3);
      b.prim('box', M('woodDark'), 0, 3.08, -7.05, 0.4, 0.36, 0.2);
      const cf = b.mesh(new THREE.CircleGeometry(0.13, 20), M('clock'), 0, 3.12, -6.94); void cf;
      b.prim('cyl8', M('brass'), -1.1, 3.0, -7.0, 0.08, 0.2, 0.08); b.prim('cyl8', M('copper'), 1.1, 3.02, -7.0, 0.09, 0.24, 0.09);
      b.framedPicture('n', 0, 4.6, -7.05, 2.2, 1.6, M('paintLake'));
      b.col(-2.3, 2.3, -7.5, -6.45);
    }
    // --- rugs, armchairs, sofa, tea table ---
    b.rugRound(0, -3.6, 2.5, M('rugRed'));
    b.rugRound(0, 3.4, 1.7, M('rugBlue'));
    b.armchair(-2.5, -4.4, yawTo(-2.5, -4.4, 0, -7) + PI, M('redCloth'));
    b.armchair(2.5, -4.4, yawTo(2.5, -4.4, 0, -7) + PI, M('redCloth'));
    b.col(-3.05, -1.95, -4.95, -3.85, 1.3); b.col(1.95, 3.05, -4.95, -3.85, 1.3);
    {
      // sofa facing the fire (back towards south)
      const g = new THREE.Group();
      const P = function (mat, x, y, z, sx, sy, sz) { const m = new THREE.Mesh(G('box'), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); };
      P(M('blueCloth'), 0, 0.3, 0, 2.6, 0.3, 0.85); P(M('creamCloth'), -0.62, 0.5, -0.05, 1.15, 0.12, 0.7); P(M('creamCloth'), 0.62, 0.5, -0.05, 1.15, 0.12, 0.7);
      P(M('blueCloth'), 0, 0.66, 0.36, 2.6, 0.62, 0.18); P(M('blueCloth'), -1.25, 0.58, 0, 0.16, 0.36, 0.85); P(M('blueCloth'), 1.25, 0.58, 0, 0.16, 0.36, 0.85);
      P(M('copperCloth'), -0.7, 0.7, 0.2, 0.4, 0.3, 0.12); P(M('copperCloth'), 0.8, 0.68, 0.22, 0.38, 0.28, 0.12);
      g.position.set(0, 0, -1.9); b.add(g);
      b.col(-1.35, 1.35, -2.35, -1.45, 1.3);
      b.prim('cyl', M('wood'), 0, 0.5, -4.2, 0.45, 0.05, 0.45);
      b.prim('cyl8', M('woodDark'), 0, 0.25, -4.2, 0.07, 0.5, 0.07);
      b.prim('cyl8', M('copper'), 0.15, 0.58, -4.2, 0.07, 0.12, 0.07);
      b.bookStack(-0.15, 0.53, -4.25, 2);
      b.col(-0.5, 0.5, -4.7, -3.7, 0.6);
    }
    // --- four-poster bed alcove (bed anchor (4.5,0.6,−3.5)) ---
    {
      const x0 = 3.8, x1 = 6.6, z0 = -4.4, z1 = -2.6, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      b.block(x1 - x0, 0.45, z1 - z0, cx, 0, cz, M('woodDark'));
      b.block(x1 - x0 - 0.1, 0.2, z1 - z0 - 0.1, cx, 0.45, cz, M('creamCloth'));
      b.block(1.9, 0.08, z1 - z0 - 0.05, cx - 0.4, 0.62, cz, M('blueCloth'));
      b.block(0.08, 0.06, z1 - z0 - 0.05, cx - 1.35, 0.62, cz, M('copperCloth'));
      b.prim('box', M('creamCloth'), x1 - 0.45, 0.72, cz - 0.4, 0.5, 0.16, 0.6);
      b.prim('box', M('creamCloth'), x1 - 0.45, 0.72, cz + 0.4, 0.5, 0.16, 0.6);
      b.block(0.12, 1.4, z1 - z0 + 0.1, x1 + 0.02, 0, cz, M('wood'));
      [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].forEach(function (p) { b.block(0.12, 2.6, 0.12, p[0], 0, p[1], M('woodDark')); });
      b.block(x1 - x0 + 0.2, 0.14, z1 - z0 + 0.2, cx, 2.6, cz, M('woodDark'));
      b.block(x1 - x0 + 0.1, 0.06, z1 - z0 + 0.1, cx, 2.62, cz, M('blueCloth'));
      for (let s = -1; s <= 1; s += 2) {
        const zc = s < 0 ? z0 - 0.02 : z1 + 0.02;
        const cur = b.box(0.8, 2.2, 0.04, x0 + 0.42, 1.5, zc, M('blueCloth')); void cur;
        const cur2 = b.box(0.6, 2.2, 0.04, x1 - 0.3, 1.5, zc, M('blueCloth')); void cur2;
      }
      b.box(0.04, 0.45, z1 - z0, x0 - 0.06, 2.32, cz, M('copperCloth'));
      b.col(x0 - 0.08, 7.2, z0 - 0.08, z1 + 0.08);
      // nightstand + candle (light)
      b.block(0.5, 0.6, 0.5, 6.0, 0, -1.8, M('wood'));
      b.candle(6.0, 0.6, -1.8, 0.22);
      b.col(5.7, 6.3, -2.1, -1.5, 0.7);
      const nl = b.light(0xffb060, 0.6, 6, 6.0, 1.1, -1.8); b.flicker(nl, 0.15);
    }
    // --- window seat (west) + second window (south-east) ---
    const winMats = [], winGlows = [];
    const winGlowMat = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,215,140,0.7)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    winGlows.push(winGlowMat);
    function towerWindow(phi, y0, w, h) {
      const p = wallPos(RW - 0.06, phi);
      const mat = new THREE.MeshBasicMaterial({ map: T('glassB'), color: 0x5a68a8 });
      winMats.push(mat);
      b.window(p.rot, p.x, y0, p.z, w, h, mat);
      const q = wallPos(RW - 0.5, phi);
      b.sprite(winGlowMat, q.x, y0 + h * 0.5, q.z, w * 3, h * 1.6);
      return p;
    }
    towerWindow(-PI / 2 + 0.1, 1.3, 1.6, 3.2);
    towerWindow(PI * 0.22, 2.0, 1.0, 2.4);
    {
      const g = new THREE.Group();
      const base = new THREE.Mesh(boxGeo(0.9, 0.5, 2.2), M('wood')); base.position.y = 0.25; g.add(base);
      const cush = new THREE.Mesh(G('box'), M('blueCloth')); cush.scale.set(0.85, 0.12, 2.1); cush.position.y = 0.56; g.add(cush);
      for (let k = -1; k <= 1; k += 2) { const pil = new THREE.Mesh(G('box'), M('copperCloth')); pil.scale.set(0.16, 0.36, 0.4); pil.position.set(-0.3, 0.8, k * 0.75); pil.rotation.z = 0.25; g.add(pil); }
      g.position.set(-7.2, 0, 0.8); b.add(g);
      b.col(-7.5, -6.65, -0.35, 1.95, 0.9);
    }
    const winLight = b.light(0x6b88d8, 0.6, 12, -6.2, 2.8, 0.8);
    const beamMat = new THREE.MeshBasicMaterial({ map: U.glowTexture('rgba(255,225,160,0.55)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.DoubleSide });
    // morning sunbeam from the west window (two crossed planes) + a warm patch on the floor
    const beam = new THREE.Group(); beam.position.set(-5.15, 1.6, 0.8); beam.rotation.set(0, 0, -2.115); b.add(beam);
    for (let k = 0; k < 2; k++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6.6), beamMat); pl.rotation.y = k * PI / 2; beam.add(pl); }
    const patchMat = new THREE.MeshBasicMaterial({ map: U.glowTexture('rgba(255,220,150,0.6)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    b.decal(new THREE.PlaneGeometry(3.4, 2.2), patchMat, -3.2, 0.02, 0.8, 0);
    // --- study table, chairs, bookcase, notice board, banners ---
    b.table(4.3, 3.6, 1.6, 1.0, 0.8, M('wood'));
    b.chair(3.7, 4.45, PI, M('wood'), M('blueCloth'));
    b.chair(4.8, 2.75, 0.2, M('wood'), M('blueCloth'));
    b.bookStack(4.0, 0.8, 3.5, 3);
    {
      const sheet = b.box(0.36, 0.005, 0.26, 4.5, 0.805, 3.7, M('paper')); sheet.rotation.y = 0.3;
      // little clockwork parts (Noa tinkers here)
      b.prim('cyl', M('brass'), 4.75, 0.82, 3.35, 0.08, 0.02, 0.08);
      b.prim('cyl', M('copper'), 4.9, 0.82, 3.5, 0.05, 0.02, 0.05);
      b.prim('torus', M('brass'), 4.6, 0.81, 3.95, 0.06, 0.06, 0.06).rotation.x = PI / 2;
      b.prim('cyl6', M('brass'), 3.8, 0.82, 3.85, 0.1, 0.02, 0.1);
      b.hangingLamp(4.3, 2.6, 3.6, HW + 1.5);
      const tl = b.light(0xffc070, 1.0, 9, 4.3, 2.3, 3.6); b.flicker(tl, 0.06);
    }
    b.col(3.4, 5.2, 2.4, 4.8, 1);
    {
      const p = wallPos(RW - 0.3, -PI * 0.75);
      b.bookcase(p.x, p.z, 2.2, 3.0, 0.5, p.rot, false, M('books2'));
      b.col(p.x - 1.0, p.x + 1.0, p.z - 1.0, p.z + 1.0);
      const p2 = wallPos(RW - 0.25, -PI * 0.62);
      b.bookcase(p2.x, p2.z, 1.6, 2.4, 0.45, p2.rot, false, M('books1'));
      b.col(p2.x - 0.75, p2.x + 0.75, p2.z - 0.75, p2.z + 0.75);
      const n = wallPos(RW - 0.05, PI * 0.12);
      b.framedPicture(n.rot, n.x, 2.0, n.z, 1.0, 1.0, M('notice'));
      const bn1 = wallPos(RW - 0.05, PI - 0.62), bn2 = wallPos(RW - 0.05, PI + 0.62);
      b.banner(bn1.rot, bn1.x, 6.0, bn1.z, 1.3, 3.2, M('banner'), true);
      b.banner(bn2.rot, bn2.x, 6.0, bn2.z, 1.3, 3.2, M('banner'), true);
      const tp = wallPos(RW - 0.05, 1.05);
      b.banner(tp.rot, tp.x, 5.8, tp.z, 1.4, 3.4, M('tapStars'), false);
      const tp2 = wallPos(RW - 0.05, -PI * 0.5 - 0.55);
      b.banner(tp2.rot, tp2.x, 6.4, tp2.z, 1.1, 2.6, M('tapTree'), false);
    }
    // chandelier (light)
    b.chandelier(0, 5.4, 0, 1.1, 8, HW + 3);
    const cl = b.light(0xffc480, 1.0, 16, 0, 5.0, 0); b.flicker(cl, 0.05);
    // door
    {
      const p = wallPos(RW - 0.04, 0);
      b.doorway({ face: p.rot, x: p.x, z: p.z, w: 1.8, h: 3.2, kind: 'single', plaque: L.entrance });
    }

    let morning = false, mk = 0;
    const nightCol = new THREE.Color(0x5a68a8), dayCol = new THREE.Color(0xfff4d8);
    const nightL = new THREE.Color(0x6b88d8), dayL = new THREE.Color(0xffd27a);
    return {
      id: 'tower',
      group: b.group,
      bounds: bounds,
      colliders: b.colliders,
      spawns: { fromEntrance: { x: 0, z: 5, yaw: 0 } },
      doors: [{ id: 'tower.toEntrance', x: 0, z: 7, radius: 2, to: 'entrance', toSpawn: 'fromTower', label: L.entrance }],
      anchors: { noa: { x: -2.5, y: 0, z: -2 }, bed: { x: 4.5, y: 0.6, z: -3.5 }, tal: { x: 2.5, y: 0, z: 2 }, fireplace: { x: 0, y: 0, z: -6.2 } },
      ambient: { background: 0x120a06, fogColor: 0x120a06, fogDensity: 0.012, hemiSky: 0xffd8b0, hemiGround: 0x2a1a10, hemiIntensity: 0.5, music: 'calm' },
      api: {
        setMorning: function (on) { morning = !!on; },
        isMorning: function () { return morning; }
      },
      update: function (dt, t) {
        b.updateCommon(dt, t);
        mk += ((morning ? 1 : 0) - mk) * Math.min(1, dt * 1.2);
        for (let i = 0; i < winMats.length; i++) winMats[i].color.copy(nightCol).lerp(dayCol, mk);
        if (winLight) { winLight.color.copy(nightL).lerp(dayL, mk); winLight.intensity = 0.6 + mk * 1.6; }
        beamMat.opacity = mk * (0.3 + Math.sin(t * 0.6) * 0.03);
        patchMat.opacity = mk * 0.55;
        for (let i = 0; i < winGlows.length; i++) winGlows[i].opacity = 0.12 + mk * 0.6;
      }
    };
  }

  // ===================================================================================
  // 10. AREA: crypt (corridor + Lantern Chamber) — very dark, needs Lumos
  // ===================================================================================
  function buildCrypt(ctx) {
    initCtx(ctx);
    const b = new Builder('crypt', 707);
    const bounds = { minX: -12, maxX: 12, minZ: -30, maxZ: 34 };
    const R = b.R;
    const sd = M('stoneDark'), fd = M('flagDark'), td = M('trimDark');
    const CC = { x: 0, z: -18, r: 12 };

    // --- floors ---
    b.floor(-3, 3, -6.5, 34, fd);
    b.floor(-6, -3, 8, 12, fd);
    const cf = b.mesh(circleGeo(CC.r, 64, 0, 18), fd, 0, 0, CC.z); cf.rotation.x = -PI / 2;
    // --- corridor walls + vault ---
    const WH = 3.0;
    b.box(0.6, WH, 40.6, 3.3, WH / 2, 14, sd);
    b.box(0.6, WH, 14.6, -3.3, WH / 2, 0.7, sd);      // z[-6.6,8]
    b.box(0.6, WH, 22, -3.3, WH / 2, 23, sd);          // z[12,34]
    b.box(0.6, 3.2, 4.6, -6.3, 1.6, 10, sd);
    b.box(3.3, 3.2, 0.6, -4.65, 1.6, 7.7, sd); b.box(3.3, 3.2, 0.6, -4.65, 1.6, 12.3, sd);
    b.box(3.6, 0.3, 4.6, -4.5, 3.35, 10, sd);
    b.box(0.6, 3.0, 4.0, -3.3, 4.5, 10, sd); // wall above the alcove opening (under the vault)
    const vault = b.mesh(new THREE.CylinderGeometry(3, 3, 40.4, 20, 1, true, PI / 2, PI), new THREE.MeshStandardMaterial({ map: T('stoneDark'), roughness: 0.95, side: THREE.BackSide }), 0, WH, 13.8);
    vault.rotation.x = PI / 2;
    {
      const uv = vault.geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 9.4, uv.getY(i) * 40);
    }
    for (let z = 32; z >= -4; z -= 4) {
      const rib = b.mesh(new THREE.TorusGeometry(2.92, 0.16, 6, 20, PI), td, 0, WH, z);
      void rib;
      for (let s = -1; s <= 1; s += 2) b.box(0.24, WH, 0.36, s * 2.88, WH / 2, z, td);
    }
    // end wall at z=34 with the stair arch going up
    b.box(1.6, 6.2, 0.6, -2.2, 3.1, 34.3, sd); b.box(1.6, 6.2, 0.6, 2.2, 3.1, 34.3, sd);
    b.box(2.8, 2.6, 0.6, 0, 4.9, 34.3, sd);
    b.doorway({ face: 's', x: 0, z: 33.98, w: 2.4, h: 3.4, kind: 'none', plaque: L.entrance, frameMat: td, plaqueW: 1.3 });
    for (let i = 0; i < 9; i++) b.box(2.6, 0.35, 0.5, 0, 0.175 + i * 0.35, 34.4 + i * 0.5, td);
    b.box(0.3, 6, 5, -1.45, 3, 36.5, sd); b.box(0.3, 6, 5, 1.45, 3, 36.5, sd); b.box(3, 0.3, 5, 0, 3.6, 36.5, sd);
    b.box(3, 6, 0.3, 0, 3, 39, sd);
    b.sprite(M('glowSoft'), 0, 3.6, 37.5, 3.0, 3.0);

    // --- colliders filling everything outside corridor / alcove / chamber ---
    b.col(-12.5, -3, 12, 34.5);
    b.col(-12.5, -3, -6, 8);
    b.col(-12.5, -6, 8, 12);
    b.col(3, 12.5, -6, 34.5);
    b.roundCorners(CC.x, CC.z, 11.4, { minZ: -30, maxZ: -6 }, 0.75, 3.0);
    // walls flanking the gate arch (permanent) + the gate itself (removed by openGate)
    b.col(-3, -2.2, -6.5, -5.5); b.col(2.2, 3, -6.5, -5.5);
    const gateCol = b.col(-3, 3, -6.5, -5.5);

    // --- sarcophagi, urns, cobwebs ---
    [[2.45, 28], [2.45, 16], [2.45, -2], [-2.45, 26], [-2.45, 18]].forEach(function (p) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(boxGeo(1.0, 0.75, 2.2), td); body.position.y = 0.375; g.add(body);
      const lid = new THREE.Mesh(boxGeo(1.1, 0.16, 2.3), sd); lid.position.y = 0.83; g.add(lid);
      const ridge = new THREE.Mesh(G('box'), td); ridge.scale.set(0.3, 0.12, 2.0); ridge.position.y = 0.96; g.add(ridge);
      const emb = new THREE.Mesh(G('cyl6'), M('ironLight')); emb.scale.set(0.12, 0.04, 0.12); emb.position.set(0, 1.04, -0.5); g.add(emb);
      g.position.set(p[0], 0, p[1]); b.add(g);
      b.col(p[0] - 0.58, p[0] + 0.58, p[1] - 1.18, p[1] + 1.18, 1);
    });
    [[2.6, 22], [-2.6, 30], [-2.6, 6], [2.6, 9]].forEach(function (p) {
      b.prim('sphere', td, p[0], 0.32, p[1], 0.26, 0.32, 0.26);
      b.prim('cyl8', td, p[0], 0.68, p[1], 0.12, 0.12, 0.12);
      b.colAt(p[0], p[1], 0.3, 0.3, 0.8);
    });
    [[2.9, 2.9, 30, -PI / 2], [-2.9, 2.9, 20, PI / 2], [2.9, 2.9, 12, -PI / 2], [-2.9, 2.9, 2, PI / 2], [2.9, 2.9, -4, -PI / 2]].forEach(function (p) {
      const wm = b.mesh(new THREE.PlaneGeometry(1.2, 1.2), M('web'), p[0], p[1], p[2]); wm.rotation.y = p[3]; wm.rotation.z = PI;
    });
    // cold, unlit sconces + faint ghost-lights (2 dim lights)
    [[3, 1.9, 24, 'e'], [-3, 1.9, 14, 'w'], [3, 1.9, 4, 'e']].forEach(function (p) {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(G('box'), M('iron')); plate.scale.set(0.16, 0.34, 0.04); g.add(plate);
      const cup = new THREE.Mesh(G('cyl8'), M('iron')); cup.scale.set(0.1, 0.12, 0.1); cup.position.set(0, -0.02, 0.3); g.add(cup);
      const stick = new THREE.Mesh(G('cyl8'), M('log')); stick.scale.set(0.045, 0.3, 0.045); stick.position.set(0, 0.12, 0.32); g.add(stick);
      b.onWall(g, p[3], p[0] + (p[0] > 0 ? -0.02 : 0.02), p[1], p[2]);
    });
    const g1 = b.light(0x5a6aa8, 0.35, 9, 0, 2.6, 26);
    const g2 = b.light(0x5a6aa8, 0.3, 9, 0, 2.6, 12);
    b.flicker(g1, 0.25, 0.3); b.flicker(g2, 0.25, 0.3);
    [[0, 2.6, 26], [0, 2.6, 12]].forEach(function (p) { b.sprite(M('glowCool'), p[0], p[1], p[2], 1.2, 1.2); });

    // --- alcove shrine for the third shard (anchor (−5, 0.9, 10)) ---
    {
      b.block(1.0, 0.7, 1.0, -5, 0, 10, td);
      b.block(1.15, 0.08, 1.15, -5, 0.7, 10, sd);
      b.colAt(-5, 10, 0.55, 0.55, 0.9);
      const relief = b.mesh(new THREE.PlaneGeometry(1.2, 1.8), new THREE.MeshStandardMaterial({ map: T('banner'), color: 0x5a5a6a, roughness: 1, transparent: true, alphaTest: 0.5 }), -5.98, 1.9, 10);
      relief.rotation.y = PI / 2;
      b.candle(-5.6, 0.0, 9.0, 0.18); b.candle(-5.6, 0.0, 11.0, 0.14);
      const al = b.light(0xffa850, 0.55, 6, -4.6, 1.4, 10); b.flicker(al, 0.2);
    }

    // --- the iron gate at z=−6 + Lantern Chamber entrance ---
    const bars = new THREE.Group(); b.add(bars);
    const slots = [];
    {
      const gw = 4.4, gh = 4.2;
      // gate wall (chamber side and corridor side)
      const wallShape = new THREE.Shape();
      wallShape.moveTo(-4.6, 0); wallShape.lineTo(4.6, 0); wallShape.lineTo(4.6, 10); wallShape.lineTo(-4.6, 10); wallShape.lineTo(-4.6, 0);
      wallShape.holes.push(archPath(new THREE.Path(), gw, gh, true));
      const gwall = b.mesh(new THREE.ExtrudeGeometry(wallShape, { depth: 0.8, bevelEnabled: false, curveSegments: 12 }), sd, 0, 0, -6.4);
      void gwall;
      const fr = b.mesh(archFrameGeo(gw, gh, 0.35, 0.95, true, false), td, 0, 0, -6.47); void fr;
      for (let i = 0; i < 11; i++) {
        const x = -gw / 2 + 0.2 + i * (gw - 0.4) / 10;
        const bar = new THREE.Mesh(G('cyl8'), M('iron')); bar.scale.set(0.05, 4.6, 0.05); bar.position.set(x, 2.3, 0); bars.add(bar);
        const tip = new THREE.Mesh(G('cone8'), M('iron')); tip.scale.set(0.07, 0.18, 0.07); tip.position.set(x, -0.05, 0); tip.rotation.x = PI; bars.add(tip);
      }
      for (let k = 0; k < 4; k++) { const hb = new THREE.Mesh(G('box'), M('iron')); hb.scale.set(gw, 0.08, 0.08); hb.position.set(0, 0.7 + k * 1.0, 0); bars.add(hb); }
      // lock plate with three shard-shaped slots
      const lock = new THREE.Mesh(G('box'), M('iron')); lock.scale.set(0.9, 0.7, 0.06); lock.position.set(0, 1.4, 0.08); bars.add(lock);
      for (let i = 0; i < 3; i++) {
        const sm = new THREE.MeshBasicMaterial({ color: 0x2a1a08 });
        const s = new THREE.Mesh(G('cone6'), sm); s.scale.set(0.06, 0.24, 0.03); s.position.set(-0.25 + i * 0.25, 1.4, 0.12); bars.add(s);
        slots.push(sm);
      }
      bars.position.set(0, 0, -6.0);
      // violet light seeping from beyond the gate
      b.sprite(new THREE.SpriteMaterial({ map: U.glowTexture('rgba(150,70,255,0.5)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }), 0, 1.6, -7.5, 4, 3);
    }
    const gateGlow = b.light(0x8a4aff, 0.5, 9, 0, 1.8, -7.8);

    // --- Lantern Chamber: wall, dome, broken pillars, pedestal, cracks ---
    {
      const gap = Math.asin(4.3 / CC.r);
      const cw = b.mesh(wallCylGeo(CC.r, 9, 64, gap, TAU - gap * 2), new THREE.MeshStandardMaterial({ map: T('stoneDark'), roughness: 0.95, side: THREE.BackSide }), 0, 4.5, CC.z);
      void cw;
      const dome = b.mesh(new THREE.SphereGeometry(CC.r, 40, 14, 0, TAU, 0, PI / 2), new THREE.MeshStandardMaterial({ map: T('stoneDark'), roughness: 0.95, side: THREE.BackSide }), 0, 9, CC.z);
      dome.scale.y = 0.45;
      b.mesh(new THREE.TorusGeometry(CC.r - 0.1, 0.2, 6, 64), td, 0, 9, CC.z).rotation.x = PI / 2;
      b.mesh(new THREE.TorusGeometry(CC.r - 0.1, 0.16, 6, 64), td, 0, 0.12, CC.z).rotation.x = PI / 2;
      // ring of steps around the pedestal
      b.mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.12, 48), td, 0, 0.06, CC.z);
    }
    for (let i = 0; i < 8; i++) {
      const a = PI / 8 + i * TAU / 8;
      const x = Math.sin(a) * 10.2, z = CC.z + Math.cos(a) * 10.2;
      const h = 2 + ((i * 37) % 5) * 1.1 + R() * 0.6;
      b.block(1.4, 0.4, 1.4, x, 0, z, td);
      b.mesh(new THREE.CylinderGeometry(0.5, 0.55, h, 12), sd, x, 0.4 + h / 2, z);
      const top = b.mesh(new THREE.ConeGeometry(0.52, 0.5, 6), sd, x, 0.4 + h + 0.1, z);
      top.rotation.set(R() * 0.6, R() * 3, R() * 0.6);
      b.colAt(x, z, 0.75, 0.75);
      // rubble
      for (let k = 0; k < 3; k++) {
        const rx = x + (R() - 0.5) * 2.4, rz = z + (R() - 0.5) * 2.4;
        const rub = b.prim('box', sd, rx, 0.12, rz, 0.2 + R() * 0.4, 0.2 + R() * 0.2, 0.2 + R() * 0.3);
        rub.rotation.set(R(), R() * 3, R());
      }
    }
    // a fallen column segment
    {
      const fc = b.mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.2, 12), sd, -6.2, 0.5, -24.5);
      fc.rotation.set(0, 0.6, PI / 2);
      b.col(-7.6, -4.8, -25.6, -23.4, 1.0);
    }
    // pedestal with the empty Ninth Lantern frame (anchor y=1.2)
    let pedLit = false, pedK = 0, glowOn = false, glowK = 0;
    const lantern = {};
    {
      b.mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.25, 32), td, 0, 0.125, CC.z);
      b.mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.25, 32), td, 0, 0.375, CC.z);
      b.mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.6, 16), sd, 0, 0.8, CC.z);
      b.mesh(new THREE.CylinderGeometry(0.62, 0.48, 0.1, 16), td, 0, 1.15, CC.z);
      const g = new THREE.Group(); g.position.set(0, 1.2, CC.z); b.add(g);
      const P = function (geo, mat, x, y, z, sx, sy, sz) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
      P(new THREE.CylinderGeometry(0.42, 0.46, 0.1, 6), M('iron'), 0, 0.05, 0, 1, 1, 1);
      for (let k = 0; k < 6; k++) { const a = k * TAU / 6; P(G('box'), M('iron'), Math.cos(a) * 0.36, 0.52, Math.sin(a) * 0.36, 0.05, 0.86, 0.05); }
      P(new THREE.CylinderGeometry(0.2, 0.46, 0.26, 6), M('iron'), 0, 1.05, 0, 1, 1, 1);
      P(new THREE.TorusGeometry(0.14, 0.035, 6, 16), M('iron'), 0, 1.28, 0, 1, 1, 1);
      lantern.glassMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, emissive: 0xffb040, emissiveIntensity: 0, roughness: 0.3, transparent: true, opacity: 0.35 });
      P(new THREE.CylinderGeometry(0.34, 0.34, 0.84, 6), lantern.glassMat, 0, 0.52, 0, 1, 1, 1);
      lantern.flameMat = new THREE.SpriteMaterial({ map: T('flame'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
      lantern.flame = new THREE.Sprite(lantern.flameMat); lantern.flame.position.set(0, 0.5, 0); lantern.flame.scale.set(0.3, 0.55, 1); g.add(lantern.flame);
      lantern.glowMat = new THREE.SpriteMaterial({ map: U.glowTexture('rgba(255,200,90,0.85)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
      lantern.glow = new THREE.Sprite(lantern.glowMat); lantern.glow.position.set(0, 0.55, 0); lantern.glow.scale.set(7, 7, 1); g.add(lantern.glow);
      // light shafts (visible when lit)
      lantern.rays = new THREE.Group(); lantern.rays.position.set(0, 0.55, 0); g.add(lantern.rays);
      lantern.rayMat = new THREE.MeshBasicMaterial({ map: U.glowTexture('rgba(255,215,130,0.5)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.DoubleSide });
      for (let k = 0; k < 6; k++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 14), lantern.rayMat); r.rotation.set(0, k * PI / 6, 0.5 + (k % 2) * 0.4); lantern.rays.add(r); }
      b.col(-1.3, 1.3, CC.z - 1.3, CC.z + 1.3, 1.2);
    }
    const pedLight = b.light(0xffc060, 0, 36, 0, 2.6, CC.z);
    const violet = b.light(0x8a40ff, 0.5, 24, 0, 1.2, CC.z);
    // glowing violet cracks on the floor and the chamber wall
    const crackMat = new THREE.MeshBasicMaterial({ map: T('cracks'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5, color: 0xb080ff });
    const crackMat2 = new THREE.MeshBasicMaterial({ map: T('cracks2'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5, color: 0xb080ff, side: THREE.DoubleSide });
    const crackMat3 = new THREE.MeshBasicMaterial({ map: T('cracksWall'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5, color: 0xb080ff, side: THREE.DoubleSide });
    b.decal(new THREE.PlaneGeometry(20, 20), crackMat, 0, 0.03, CC.z, 0.3);
    b.decal(new THREE.PlaneGeometry(7, 7), crackMat2, 0.5, 0.025, -9.2, 1.2);
    b.decal(new THREE.PlaneGeometry(6, 6), crackMat2, -0.8, 0.025, -0.5, 2.4);
    for (let i = 0; i < 6; i++) {
      const a = PI / 3 + i * TAU / 6 + 0.2;
      const p = { x: Math.sin(a) * (CC.r - 0.15), z: CC.z + Math.cos(a) * (CC.r - 0.15) };
      const wc = b.mesh(new THREE.PlaneGeometry(4, 4), crackMat3, p.x, 2.0 + (i % 3) * 0.5, p.z);
      wc.rotation.y = a + PI;
    }
    // violet motes rising from the cracks
    const motes = { n: 60 };
    {
      const mp = new Float32Array(motes.n * 3), seeds = [];
      for (let i = 0; i < motes.n; i++) { const a = R() * TAU, r = 1.5 + R() * 9; seeds.push([Math.sin(a) * r, CC.z + Math.cos(a) * r, R()]); }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
      motes.mat = new THREE.PointsMaterial({ map: U.glowTexture('rgba(190,120,255,0.8)', 64), size: 0.16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4 });
      const pts = new THREE.Points(mg, motes.mat); pts.frustumCulled = false; b.add(pts);
      b.anims.push(function (dt, t) {
        const sp = 0.15 + glowK * 0.35;
        for (let i = 0; i < motes.n; i++) { const s = seeds[i]; const k = (t * sp * 0.3 + s[2]) % 1; mp[i * 3] = s[0] + Math.sin(t + i) * 0.2; mp[i * 3 + 1] = k * 5; mp[i * 3 + 2] = s[1] + Math.cos(t * 0.8 + i) * 0.2; }
        mg.attributes.position.needsUpdate = true;
      });
    }

    let gateT = -1; // <0 closed
    const baseFog = 0.065, litFog = 0.03, baseHemi = 0.06, litHemi = 0.3;
    return {
      id: 'crypt',
      group: b.group,
      bounds: bounds,
      colliders: b.colliders,
      spawns: { fromEntrance: { x: 0, z: 31, yaw: 0 }, chamber: { x: 0, z: -8, yaw: 0 } },
      doors: [{ id: 'crypt.toEntrance', x: 0, z: 33, radius: 2, to: 'entrance', toSpawn: 'fromCrypt', label: txt('עלייה לאולם הכניסה', 'Up to the Entrance Hall') }],
      anchors: {
        shard3: { x: -5, y: 0.9, z: 10 }, gate: { x: 0, y: 0, z: -4 }, pedestal: { x: 0, y: 1.2, z: -18 },
        morrow: { x: 0, y: 0, z: -26, yaw: PI }, orla_crypt: { x: 0, y: 0, z: -7 },
        cshade1: { x: 0, y: 1.5, z: 20 }, cshade2: { x: -1.5, y: 1.5, z: 14 }, cshade3: { x: 1.5, y: 1.5, z: 6 },
        cshade4: { x: 0, y: 1.5, z: 0 }, cshade5: { x: -1, y: 1.5, z: 24 },
        bshade1: { x: 5.66, y: 1.5, z: -12.34 }, bshade2: { x: -5.66, y: 1.5, z: -12.34 },
        bshade3: { x: -5.66, y: 1.5, z: -23.66 }, bshade4: { x: 5.66, y: 1.5, z: -23.66 },
        alcove: { x: -4.5, y: 0, z: 10 }, chamberCenter: { x: 0, y: 0, z: -18 }
      },
      ambient: { background: 0x000000, fogColor: 0x000000, fogDensity: baseFog, hemiSky: 0x404a66, hemiGround: 0x000000, hemiIntensity: 0.06, music: 'crypt' },
      api: {
        // animated (≈3 s); the gate collider is removed once the bars are half-way up
        openGate: function () { if (gateT < 0) gateT = 0; },
        setPedestalLit: function (on) { pedLit = !!on; },
        setChamberGlow: function (on) { glowOn = !!on; },
        isGateOpen: function () { return gateT >= 0; }
      },
      update: function (dt, t) {
        b.updateCommon(dt, t);
        if (gateT >= 0 && gateT < 1) {
          gateT = Math.min(1, gateT + dt / 3.0);
          if (gateT >= 0.45) { const gi = b.colliders.indexOf(gateCol); if (gi >= 0) b.colliders.splice(gi, 1); }
          const k = smooth(gateT);
          bars.position.y = k * 4.7 + Math.sin(gateT * 70) * 0.01 * (1 - gateT);
        }
        const slotK = gateT >= 0 ? 1 : 0.15 + Math.sin(t * 2) * 0.05;
        for (let i = 0; i < slots.length; i++) slots[i].color.setRGB(0.16 + 0.84 * slotK, 0.1 + 0.62 * slotK, 0.03 + 0.2 * slotK);
        pedK += ((pedLit ? 1 : 0) - pedK) * Math.min(1, dt * (pedLit ? 0.9 : 3));
        glowK += ((glowOn ? 1 : 0) - glowK) * Math.min(1, dt * 1.5);
        const flare = pedLit ? Math.max(0, 1 - pedK) * 0.8 : 0;
        lantern.glassMat.emissiveIntensity = pedK * 1.6 + flare;
        lantern.glassMat.opacity = 0.35 + pedK * 0.55;
        lantern.flameMat.opacity = pedK;
        lantern.flame.scale.set(0.3 * (0.9 + Math.sin(t * 12) * 0.08), 0.55 * pedK, 1);
        lantern.glowMat.opacity = pedK * (0.9 + Math.sin(t * 3) * 0.06) + flare * 0.5;
        lantern.glow.scale.setScalar(6 + pedK * 6 + flare * 10);
        lantern.rayMat.opacity = pedK * 0.22;
        lantern.rays.rotation.y = t * 0.15;
        if (pedLight) pedLight.intensity = pedK * 3.4 + flare * 2;
        // cracks: faint baseline, pulsing during the boss, healed by the relit lantern
        const pulse = 0.55 + 0.45 * Math.sin(t * 3.2);
        const ck = (0.32 + glowK * (0.35 + 0.5 * pulse)) * (1 - pedK);
        crackMat.opacity = ck; crackMat2.opacity = ck * 0.9; crackMat3.opacity = ck;
        motes.mat.opacity = (0.25 + glowK * 0.5) * (1 - pedK * 0.8);
        if (violet) violet.intensity = (0.45 + glowK * (0.6 + 0.9 * pulse)) * (1 - pedK);
        if (gateGlow) gateGlow.intensity = gateT >= 0 ? 0.25 : 0.5;
        // the relit lantern floods the chamber: thin the fog / lift the core hemisphere light
        try {
          const sc = ELD.three && ELD.three.scene;
          if (sc && sc.fog && ELD.area && ELD.area.id === 'crypt') sc.fog.density = baseFog + (litFog - baseFog) * pedK;
          const hm = ELD.three && ELD.three.hemi;
          if (hm && ELD.area && ELD.area.id === 'crypt') hm.intensity = baseHemi + (litHemi - baseHemi) * pedK;
        } catch (e) { /* ignore */ }
      }
    };
  }

  // ===================================================================================
  // 11. registration (no heavy work at load time)
  // ===================================================================================
  ELD.registerArea('grounds', buildGrounds);
  ELD.registerArea('entrance', buildEntrance);
  ELD.registerArea('greathall', buildGreatHall);
  ELD.registerArea('classroom', buildClassroom);
  ELD.registerArea('library', buildLibrary);
  ELD.registerArea('tower', buildTower);
  ELD.registerArea('crypt', buildCrypt);
})();
