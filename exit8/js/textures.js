/* EXIT 8 — procedural textures. Every surface, poster and sign is drawn on a 2D canvas
 * at start-up and uploaded as one layer of a WebGL2 texture array. Nothing is downloaded. */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});

  const JP = '"Noto Sans JP","Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","YuGothic","Meiryo","Noto Sans CJK JP","Source Han Sans JP",sans-serif';
  const UI = '"Rubik","Segoe UI","Helvetica Neue","Arial Hebrew",Arial,sans-serif';
  E.FONT_JP = JP;
  E.FONT_UI = UI;
  // Every Japanese glyph drawn below; used to request a tiny web-font subset.
  E.JP_GLYPHS = '出口関係者以外立入禁止消火器非常夏の旅へ行センターらーめん一杯円横丁目健康眼科クリニックまばたきを忘れずに受付夜ラシ市民ホールマナー守ろう車内で通話はご遠慮くださ駅係員より現代美術展笑顔毎日構図在地案';

  const DEFS = [];
  function def(name, w, h, draw) { DEFS.push({ name, w, h, draw }); }

  function rng(seed) { return E.mulberry32 ? E.mulberry32(seed) : Math.random; }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function font(ctx, weight, size, family) { ctx.font = `${weight} ${size}px ${family}`; }
  function text(ctx, s, x, y, opts) {
    const o = opts || {};
    ctx.save();
    ctx.direction = o.dir || 'ltr';
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 8; ctx.shadowOffsetY = o.offY || 2; }
    ctx.fillStyle = o.color || '#000';
    if (o.maxW) ctx.fillText(s, x, y, o.maxW); else ctx.fillText(s, x, y);
    ctx.restore();
  }
  function wrap(ctx, s, maxW) {
    const words = s.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function noise(ctx, w, h, count, alpha, seed, light) {
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      const v = light ? 255 : 0;
      ctx.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  }

  // ---------------------------------------------------------------- surfaces
  def('white', 64, 64, (ctx, w, h) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); });

  def('wall', 512, 512, (ctx, w, h) => {
    const r = rng(11);
    ctx.fillStyle = '#b4b8b2';
    ctx.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * s, y = j * s, b = 226 + Math.floor(r() * 10 - 5);
      const g = ctx.createLinearGradient(x, y, x + s, y + s);
      g.addColorStop(0, `rgb(${b + 9},${b + 10},${b + 8})`);
      g.addColorStop(0.55, `rgb(${b},${b + 1},${b - 1})`);
      g.addColorStop(1, `rgb(${b - 9},${b - 8},${b - 10})`);
      ctx.fillStyle = g;
      rrect(ctx, x + 3, y + 3, s - 6, s - 6, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 8, y + s - 10); ctx.lineTo(x + 8, y + 8); ctx.lineTo(x + s - 10, y + 8); ctx.stroke();
    }
    noise(ctx, w, h, 900, 0.06, 12);
  });

  def('floor', 512, 512, (ctx, w, h) => {
    const r = rng(21);
    ctx.fillStyle = '#5e605c';
    ctx.fillRect(0, 0, w, h);
    const s = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const b = 158 + Math.floor(r() * 8 - 4);
      ctx.fillStyle = `rgb(${b},${b + 1},${b - 3})`;
      ctx.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
    }
    for (let k = 0; k < 2600; k++) {
      const v = 90 + Math.floor(r() * 120);
      ctx.fillStyle = `rgba(${v},${v},${v - 4},${0.25 + r() * 0.45})`;
      ctx.beginPath(); ctx.arc(r() * w, r() * h, 0.6 + r() * 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#5e605c';
    ctx.fillRect(0, 0, w, 3); ctx.fillRect(0, s - 3, w, 6); ctx.fillRect(0, h - 3, w, 3);
    ctx.fillRect(0, 0, 3, h); ctx.fillRect(s - 3, 0, 6, h); ctx.fillRect(w - 3, 0, 3, h);
  });

  def('ceiling', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#d5d6d1';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c0c1bc';
    for (let x = 8; x < w; x += 14) for (let y = 8; y < h; y += 14) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#a3a49f';
    ctx.fillRect(0, 0, w, 3); ctx.fillRect(0, h / 2 - 2, w, 4); ctx.fillRect(0, h - 3, w, 3);
    ctx.fillRect(0, 0, 3, h); ctx.fillRect(w / 2 - 2, 0, 4, h); ctx.fillRect(w - 3, 0, 3, h);
  });

  function tactileBase(ctx, w, h) {
    ctx.fillStyle = '#e7b100';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 600, 0.08, 31);
    ctx.fillStyle = '#a77d00';
    ctx.fillRect(0, 0, w, 4); ctx.fillRect(0, h - 4, w, 4); ctx.fillRect(0, 0, 4, h); ctx.fillRect(w - 4, 0, 4, h);
  }
  def('tactileLine', 512, 512, (ctx, w, h) => {
    tactileBase(ctx, w, h);
    for (let i = 0; i < 4; i++) {
      const cx = 64 + i * 128;
      const g = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0);
      g.addColorStop(0, '#ffd84a'); g.addColorStop(0.5, '#f2c000'); g.addColorStop(1, '#a87f00');
      ctx.fillStyle = g;
      rrect(ctx, cx - 24, 28, 48, h - 56, 22);
      ctx.fill();
    }
  });
  def('tactileDot', 512, 512, (ctx, w, h) => {
    tactileBase(ctx, w, h);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const cx = 51 + i * 102, cy = 51 + j * 102;
      const g = ctx.createRadialGradient(cx - 9, cy - 9, 3, cx, cy, 30);
      g.addColorStop(0, '#ffe680'); g.addColorStop(0.6, '#f0be00'); g.addColorStop(1, '#a37a00');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 29, 0, Math.PI * 2); ctx.fill();
    }
  });

  def('door', 300, 630, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#8d969c'); g.addColorStop(0.5, '#9ea7ad'); g.addColorStop(1, '#88919a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rng(41);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`;
      ctx.fillRect(r() * w, 0, 1, h);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = '#fbfbf8';
    rrect(ctx, 46, 200, w - 92, 108, 8); ctx.fill();
    ctx.strokeStyle = '#c62828'; ctx.lineWidth = 3; rrect(ctx, 52, 206, w - 104, 96, 6); ctx.stroke();
    font(ctx, 900, 30, JP);
    text(ctx, '関係者以外', w / 2, 244, { align: 'center', color: '#c62828', maxW: w - 120 });
    text(ctx, '立入禁止', w / 2, 278, { align: 'center', color: '#c62828', maxW: w - 120 });
    font(ctx, 700, 15, UI);
    text(ctx, 'STAFF ONLY', w / 2, 298, { align: 'center', color: '#333' });
    ctx.fillStyle = 'rgba(30,34,38,0.55)';
    for (let i = 0; i < 8; i++) ctx.fillRect(60, 470 + i * 12, w - 120, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, h - 40, w, 40);
  });

  // ---------------------------------------------------------------- posters
  function posterFrameBg(ctx, w, h, color) { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); }

  def('poster0', 400, 550, (ctx, w, h) => { // travel
    const g = ctx.createLinearGradient(0, 0, 0, 340);
    g.addColorStop(0, '#3f2a73'); g.addColorStop(0.55, '#e0567a'); g.addColorStop(1, '#ffb15c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, 340);
    ctx.fillStyle = '#ffd770'; ctx.beginPath(); ctx.arc(200, 300, 66, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b2457';
    ctx.beginPath(); ctx.moveTo(0, 340); ctx.lineTo(0, 250); ctx.lineTo(90, 190); ctx.lineTo(170, 270); ctx.lineTo(230, 230); ctx.lineTo(330, 300); ctx.lineTo(400, 240); ctx.lineTo(400, 340); ctx.fill();
    const s = ctx.createLinearGradient(0, 340, 0, 470);
    s.addColorStop(0, '#2c3f7a'); s.addColorStop(1, '#14204a');
    ctx.fillStyle = s; ctx.fillRect(0, 340, w, 130);
    ctx.fillStyle = 'rgba(255,215,112,0.7)';
    for (let i = 0; i < 9; i++) ctx.fillRect(200 - 70 + i * 6 + (i % 2) * 10, 350 + i * 12, 120 - i * 12, 3);
    font(ctx, 900, 62, JP);
    text(ctx, '夏の旅へ', w / 2, 96, { align: 'center', color: '#fff', shadow: 'rgba(0,0,0,0.4)' });
    font(ctx, 600, 20, UI);
    text(ctx, 'S U M M E R   G E T A W A Y', w / 2, 134, { align: 'center', color: '#ffe9c4' });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 470, w, 80);
    font(ctx, 700, 24, JP);
    text(ctx, '旅行センター', 28, 518, { color: '#2c2c54' });
    font(ctx, 500, 16, UI);
    text(ctx, 'Travel Center · B1', w - 28, 516, { align: 'right', color: '#555' });
  });

  def('poster1', 400, 550, (ctx, w, h) => { // ramen
    posterFrameBg(ctx, w, h, '#c4231d');
    ctx.fillStyle = '#a51a16'; for (let i = 0; i < 12; i++) ctx.fillRect(0, i * 48, w, 20);
    font(ctx, 900, 76, JP);
    text(ctx, 'らーめん', w / 2, 112, { align: 'center', color: '#ffd23a', shadow: 'rgba(0,0,0,0.35)' });
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const x = 150 + i * 50;
      ctx.moveTo(x, 260); ctx.bezierCurveTo(x - 20, 230, x + 20, 210, x, 175); ctx.stroke();
    }
    ctx.fillStyle = '#2a1712';
    ctx.beginPath(); ctx.ellipse(200, 290, 150, 36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(50, 290); ctx.bezierCurveTo(60, 400, 340, 400, 350, 290); ctx.fill();
    ctx.fillStyle = '#e9b04a';
    ctx.beginPath(); ctx.ellipse(200, 290, 132, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f7d27a'; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(90 + i * 30, 280); ctx.quadraticCurveTo(105 + i * 30, 300, 120 + i * 30, 282); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(265, 284, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a516'; ctx.beginPath(); ctx.arc(265, 284, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d2a1a'; ctx.fillRect(120, 262, 40, 30);
    ctx.fillStyle = '#ffd6e0'; ctx.beginPath(); ctx.arc(205, 296, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e4507a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(205, 296, 7, 0, Math.PI * 1.6); ctx.stroke();
    font(ctx, 900, 44, JP);
    text(ctx, '一杯 780円', w / 2, 455, { align: 'center', color: '#fff' });
    font(ctx, 600, 20, JP);
    text(ctx, 'らーめん横丁 B1', w / 2, 505, { align: 'center', color: '#ffd23a' });
  });

  // Eye centres are mirrored in world.js (EYE_U / EYE_V) so 3D pupils sit on them.
  E.POSTER_EYES = { u: [0.3, 0.7], v: 0.42, rw: 0.15, rh: 0.065 };
  def('poster2', 400, 550, (ctx, w, h) => { // eye clinic
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#e6f4fc'); g.addColorStop(1, '#a6d4ef');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    font(ctx, 900, 60, JP);
    text(ctx, '目の健康', w / 2, 92, { align: 'center', color: '#134a74' });
    font(ctx, 700, 24, UI);
    text(ctx, 'E Y E   C L I N I C', w / 2, 130, { align: 'center', color: '#2b6c9c' });
    const P = E.POSTER_EYES;
    for (const u of P.u) {
      const cx = u * w, cy = P.v * h, rx = P.rw * w, ry = P.rh * h * 1.1;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.quadraticCurveTo(cx, cy - ry * 2, cx + rx, cy); ctx.quadraticCurveTo(cx, cy + ry * 2, cx - rx, cy); ctx.fill();
      ctx.strokeStyle = '#1f3a52'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.quadraticCurveTo(cx, cy - ry * 2, cx + rx, cy); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.quadraticCurveTo(cx, cy + ry * 2, cx + rx, cy); ctx.stroke();
      ctx.lineWidth = 3;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(cx + k * rx * 0.35, cy - ry * 0.98); ctx.lineTo(cx + k * rx * 0.45, cy - ry * 1.45); ctx.stroke(); }
    }
    font(ctx, 700, 30, JP);
    text(ctx, '眼科クリニック 2F', w / 2, 352, { align: 'center', color: '#134a74' });
    font(ctx, 700, 26, JP);
    text(ctx, 'まばたきを忘れずに', w / 2, 410, { align: 'center', color: '#1f3a52' });
    font(ctx, 500, 18, UI);
    text(ctx, "Don't forget to blink.", w / 2, 440, { align: 'center', color: '#2b6c9c' });
    ctx.fillStyle = '#134a74'; ctx.fillRect(0, 480, w, 70);
    font(ctx, 600, 22, JP);
    text(ctx, '受付 9:00 – 18:00', w / 2, 524, { align: 'center', color: '#fff' });
  });

  def('poster3', 400, 550, (ctx, w, h) => { // concert
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0f1736'); g.addColorStop(1, '#2d1c4f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const r = rng(53);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`; ctx.fillRect(r() * w, r() * 330, 1.5, 1.5); }
    ctx.strokeStyle = 'rgba(232,195,114,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(200, 270, 110, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e8c372'; ctx.strokeStyle = '#e8c372'; ctx.lineWidth = 6;
    const notes = [[150, 300], [215, 270], [260, 315]];
    for (const [x, y] of notes) {
      ctx.beginPath(); ctx.ellipse(x, y, 20, 14, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 17, y - 4); ctx.lineTo(x + 17, y - 90); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(232, 180); ctx.lineTo(277, 225); ctx.stroke();
    font(ctx, 900, 46, JP);
    text(ctx, '夜のクラシック', w / 2, 96, { align: 'center', color: '#e8c372' });
    font(ctx, 600, 22, UI);
    text(ctx, 'C L A S S I C   N I G H T', w / 2, 132, { align: 'center', color: '#f3e3bd' });
    font(ctx, 700, 30, UI);
    text(ctx, '12.24 SAT  19:00', w / 2, 460, { align: 'center', color: '#fff' });
    font(ctx, 600, 20, JP);
    text(ctx, '市民ホール', w / 2, 500, { align: 'center', color: '#e8c372' });
  });

  def('poster4', 400, 550, (ctx, w, h) => { // manners
    posterFrameBg(ctx, w, h, '#f6f3ea');
    ctx.fillStyle = '#2e8b57'; ctx.fillRect(0, 0, w, 112);
    font(ctx, 900, 44, JP);
    text(ctx, 'マナーを守ろう', w / 2, 72, { align: 'center', color: '#fff', maxW: w - 30 });
    ctx.fillStyle = '#3b3b3b';
    ctx.beginPath(); ctx.arc(170, 175, 30, 0, Math.PI * 2); ctx.fill();
    rrect(ctx, 125, 212, 90, 140, 30); ctx.fill();
    ctx.fillRect(140, 340, 24, 70); ctx.fillRect(176, 340, 24, 70);
    ctx.fillStyle = '#3b3b3b'; rrect(ctx, 198, 160, 22, 40, 4); ctx.fill();
    ctx.strokeStyle = '#3b3b3b'; ctx.lineWidth = 4;
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(222, 172, 12 * i, -0.7, 0.7); ctx.stroke(); }
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(200, 255, 115, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(119, 174); ctx.lineTo(281, 336); ctx.stroke();
    font(ctx, 700, 22, JP);
    text(ctx, '車内での通話は', w / 2, 425, { align: 'center', color: '#222' });
    text(ctx, 'ご遠慮ください', w / 2, 455, { align: 'center', color: '#222' });
    font(ctx, 500, 15, UI);
    text(ctx, 'Please refrain from talking on the phone.', w / 2, 488, { align: 'center', color: '#444', maxW: w - 30 });
    font(ctx, 500, 15, JP);
    text(ctx, '駅係員より', w / 2, 525, { align: 'center', color: '#2e8b57' });
  });

  def('poster5', 400, 550, (ctx, w, h) => { // museum
    posterFrameBg(ctx, w, h, '#efe6d2');
    ctx.fillStyle = '#d1462f'; ctx.beginPath(); ctx.arc(150, 200, 105, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(268, 290); ctx.rotate(0.3); ctx.fillStyle = '#2d5aa6'; ctx.fillRect(-70, -70, 140, 140); ctx.restore();
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(60, 380); ctx.lineTo(160, 250); ctx.lineTo(220, 380); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(30, 60); ctx.lineTo(370, 360); ctx.stroke();
    font(ctx, 900, 52, JP);
    text(ctx, '現代美術展', w / 2, 448, { align: 'center', color: '#111' });
    font(ctx, 600, 17, UI);
    text(ctx, 'MODERN ART EXHIBITION', w / 2, 480, { align: 'center', color: '#333' });
    font(ctx, 700, 24, UI);
    text(ctx, '10.1 — 12.25', w / 2, 516, { align: 'center', color: '#d1462f' });
  });

  function drawFace(ctx, x0, y0, w, h, smile) {
    ctx.save();
    ctx.translate(x0, y0);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.48, w * 0.1, w * 0.5, h * 0.5, w * 0.75);
    g.addColorStop(0, '#e0b08a'); g.addColorStop(1, '#b98663');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120,70,45,0.25)';
    ctx.fillRect(0, 0, w, h * 0.06);
    ctx.strokeStyle = 'rgba(120,75,50,0.35)'; ctx.lineWidth = w * 0.012;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(w * 0.32, h * (0.17 + i * 0.05)); ctx.quadraticCurveTo(w * 0.5, h * (0.15 + i * 0.05), w * 0.68, h * (0.17 + i * 0.05)); ctx.stroke(); }
    const browY = smile ? 0.26 : 0.33;
    ctx.strokeStyle = '#3a2c25'; ctx.lineCap = 'round'; ctx.lineWidth = w * 0.045;
    ctx.beginPath(); ctx.moveTo(w * 0.22, h * (browY + 0.02)); ctx.lineTo(w * 0.42, h * browY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.58, h * browY); ctx.lineTo(w * 0.78, h * (browY + 0.02)); ctx.stroke();
    const eyeW = smile ? 0.19 : 0.15, eyeH = smile ? 0.075 : 0.045;
    for (const cx of [0.32, 0.68]) {
      ctx.fillStyle = '#f4f1ea';
      ctx.beginPath(); ctx.ellipse(w * cx, h * 0.43, w * eyeW / 2, h * eyeH, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#20150f';
      ctx.beginPath(); ctx.arc(w * cx, h * 0.43, w * (smile ? 0.022 : 0.04), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5a3d2e'; ctx.lineWidth = w * 0.015;
      ctx.beginPath(); ctx.ellipse(w * cx, h * 0.43, w * eyeW / 2, h * eyeH, 0, Math.PI, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(110,65,40,0.55)'; ctx.lineWidth = w * 0.02;
    ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.47); ctx.lineTo(w * 0.47, h * 0.6); ctx.lineTo(w * 0.53, h * 0.62); ctx.stroke();
    if (smile) {
      ctx.fillStyle = '#2a0808';
      ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.66); ctx.quadraticCurveTo(w * 0.5, h * 1.02, w * 0.92, h * 0.66); ctx.quadraticCurveTo(w * 0.5, h * 0.8, w * 0.08, h * 0.66); ctx.fill();
      ctx.fillStyle = '#f2efe4';
      for (let i = 0; i < 12; i++) {
        const t = (i + 0.5) / 12, x = w * (0.12 + t * 0.76);
        const yTop = h * (0.665 + 0.07 * Math.sin(t * Math.PI));
        ctx.fillRect(x - w * 0.026, yTop, w * 0.05, h * 0.06);
      }
      ctx.strokeStyle = '#7a2a22'; ctx.lineWidth = w * 0.02;
      ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.66); ctx.quadraticCurveTo(w * 0.5, h * 1.02, w * 0.92, h * 0.66); ctx.stroke();
    } else {
      ctx.strokeStyle = '#7b4a3a'; ctx.lineWidth = w * 0.03;
      ctx.beginPath(); ctx.moveTo(w * 0.37, h * 0.76); ctx.quadraticCurveTo(w * 0.5, h * 0.74, w * 0.63, h * 0.77); ctx.stroke();
      ctx.strokeStyle = 'rgba(110,65,40,0.35)'; ctx.lineWidth = w * 0.015;
      ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.62); ctx.quadraticCurveTo(w * 0.33, h * 0.72, w * 0.34, h * 0.78); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.7, h * 0.62); ctx.quadraticCurveTo(w * 0.67, h * 0.72, w * 0.66, h * 0.78); ctx.stroke();
    }
    ctx.restore();
  }

  def('posterFace', 400, 550, (ctx, w, h) => {
    posterFrameBg(ctx, w, h, '#f1eee8');
    drawFace(ctx, 40, 40, 320, 360, true);
    font(ctx, 900, 54, JP);
    text(ctx, '笑顔の毎日', w / 2, 470, { align: 'center', color: '#b82a2a' });
    font(ctx, 600, 18, UI);
    text(ctx, 'S M I L E   E V E R Y   D A Y', w / 2, 505, { align: 'center', color: '#555' });
  });

  def('posterBlank', 400, 550, (ctx, w, h) => {
    posterFrameBg(ctx, w, h, '#e3e1da');
    noise(ctx, w, h, 1400, 0.08, 61);
    ctx.fillStyle = 'rgba(214,200,160,0.85)';
    const tape = (x, y, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-34, -11, 68, 22); ctx.restore(); };
    tape(26, 22, -0.7); tape(w - 26, 22, 0.7); tape(26, h - 22, 0.7); tape(w - 26, h - 22, -0.7);
    ctx.fillStyle = '#f7f6f1';
    ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(70, 8); ctx.lineTo(52, 30); ctx.lineTo(60, 46); ctx.lineTo(8, 64); ctx.fill();
  });

  // ---------------------------------------------------------------- signs
  def('sign', 880, 180, (ctx, w, h, st) => {
    const count = st && st.count != null ? st.count : 0;
    ctx.fillStyle = '#f4c20d'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#151515'; rrect(ctx, 16, 16, h - 32, h - 32, 10); ctx.fill();
    font(ctx, 900, 128, UI);
    text(ctx, String(count), 16 + (h - 32) / 2, h / 2 + 4, { align: 'center', base: 'middle', color: '#fff' });
    font(ctx, 900, 100, JP);
    text(ctx, '出口', 196, 128, { color: '#151515' });
    font(ctx, 800, 76, UI);
    text(ctx, 'Exit', 420, 124, { color: '#151515' });
    ctx.fillStyle = '#151515';
    ctx.fillRect(772, 72, 34, 92);
    ctx.beginPath(); ctx.moveTo(730, 84); ctx.lineTo(848, 84); ctx.lineTo(789, 18); ctx.closePath(); ctx.fill();
  });

  def('rules', 650, 475, (ctx, w, h, st) => {
    const lang = (st && st.lang) || 'he';
    const S = E.STRINGS[lang] || E.STRINGS.he;
    const rtl = S.dir === 'rtl';
    ctx.fillStyle = '#f8f6ef'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b3b6f'; ctx.fillRect(0, 0, w, 92);
    ctx.strokeStyle = '#1b3b6f'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
    font(ctx, 800, 46, UI);
    text(ctx, S.posterTitle, rtl ? w - 34 : 34, 63, { align: rtl ? 'right' : 'left', dir: S.dir, color: '#fff' });
    font(ctx, 700, 26, JP);
    text(ctx, 'ご案内', rtl ? 34 : w - 34, 60, { align: rtl ? 'left' : 'right', color: '#ffd84a' });
    let y = 150;
    font(ctx, 600, 29, UI);
    S.posterRules.forEach((rule, i) => {
      const bx = rtl ? w - 54 : 54;
      ctx.fillStyle = '#f4c20d'; ctx.beginPath(); ctx.arc(bx, y - 10, 21, 0, Math.PI * 2); ctx.fill();
      ctx.save(); font(ctx, 800, 24, UI);
      text(ctx, String(i + 1), bx, y - 9, { align: 'center', base: 'middle', color: '#151515' });
      ctx.restore();
      font(ctx, 600, 29, UI);
      const lines = wrap(ctx, rule, w - 140);
      for (const line of lines) {
        text(ctx, line, rtl ? w - 92 : 92, y, { align: rtl ? 'right' : 'left', dir: S.dir, color: '#1c1c1c' });
        y += 38;
      }
      y += 26;
    });
  });

  def('map', 600, 400, (ctx, w, h) => {
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
    font(ctx, 800, 30, JP);
    text(ctx, '構内図', 24, 46, { color: '#222' });
    font(ctx, 600, 20, UI);
    text(ctx, 'Station Map', 124, 44, { color: '#555' });
    ctx.strokeStyle = '#c9ccd1'; ctx.lineWidth = 28; ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
    ctx.beginPath(); ctx.moveTo(80, 330); ctx.lineTo(80, 120); ctx.lineTo(300, 120); ctx.lineTo(300, 330); ctx.lineTo(520, 330); ctx.lineTo(520, 120); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(300, 225); ctx.lineTo(520, 225); ctx.stroke();
    const exits = [[80, 340], [180, 120], [300, 340], [410, 340], [410, 225], [520, 340], [400, 120], [520, 100]];
    font(ctx, 800, 20, UI);
    exits.forEach(([x, y], i) => {
      ctx.fillStyle = '#f4c20d'; ctx.fillRect(x - 15, y - 15, 30, 30);
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 2; ctx.strokeRect(x - 15, y - 15, 30, 30);
      text(ctx, String(i + 1), x, y + 1, { align: 'center', base: 'middle', color: '#151515' });
    });
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(190, 330, 11, 0, Math.PI * 2); ctx.fill();
    font(ctx, 700, 17, JP);
    text(ctx, '現在地', 210, 322, { color: '#d32f2f' });
    font(ctx, 500, 13, UI);
    text(ctx, 'You are here', 210, 342, { color: '#d32f2f' });
  });

  def('exitGreen', 480, 200, (ctx, w, h) => {
    ctx.fillStyle = '#12a04a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(26, 26, 92, 148);
    ctx.fillStyle = '#12a04a'; ctx.fillRect(40, 40, 64, 134);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(196, 52, 17, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(204, 80); ctx.lineTo(232, 128); ctx.stroke();
    ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(206, 88); ctx.lineTo(170, 102); ctx.lineTo(150, 88); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(208, 90); ctx.lineTo(244, 104); ctx.lineTo(262, 92); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(232, 128); ctx.lineTo(196, 150); ctx.lineTo(180, 178); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(232, 128); ctx.lineTo(268, 152); ctx.lineTo(292, 146); ctx.stroke();
    font(ctx, 900, 50, JP);
    text(ctx, '非常口', 386, 98, { align: 'center', color: '#fff', maxW: 170 });
    font(ctx, 800, 40, UI);
    text(ctx, 'EXIT', 386, 156, { align: 'center', color: '#fff' });
  });

  def('extinguisher', 270, 420, (ctx, w, h) => {
    ctx.fillStyle = '#c62828'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.strokeRect(16, 16, w - 32, h - 32);
    font(ctx, 900, 74, JP);
    ['消', '火', '器'].forEach((c, i) => text(ctx, c, w / 2, 112 + i * 86, { align: 'center', color: '#fff' }));
    font(ctx, 800, 26, UI);
    text(ctx, 'FIRE', w / 2, 362, { align: 'center', color: '#fff' });
    font(ctx, 700, 15, UI);
    text(ctx, 'EXTINGUISHER', w / 2, 386, { align: 'center', color: '#fff' });
  });

  def('clock', 512, 512, (ctx, w, h) => {
    const c = w / 2;
    const g = ctx.createRadialGradient(c, c, 220, c, c, 254);
    g.addColorStop(0, '#2c2c2c'); g.addColorStop(1, '#0d0d0d');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, 254, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6f5ef'; ctx.beginPath(); ctx.arc(c, c, 228, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
      ctx.lineWidth = big ? 9 : 3;
      const r0 = big ? 186 : 206;
      ctx.beginPath(); ctx.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); ctx.lineTo(c + Math.sin(a) * 220, c - Math.cos(a) * 220); ctx.stroke();
    }
    font(ctx, 700, 50, UI);
    [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([s, q]) => {
      const a = q * Math.PI / 2;
      text(ctx, s, c + Math.sin(a) * 148, c - Math.cos(a) * 148 + 2, { align: 'center', base: 'middle', color: '#1a1a1a' });
    });
  });

  def('vent', 480, 240, (ctx, w, h) => {
    ctx.fillStyle = '#c8cac6'; ctx.fillRect(0, 0, w, h);
    ctx.clearRect(22, 22, w - 44, h - 44);
    for (let i = 0; i < 7; i++) {
      const y = 30 + i * 28;
      const g = ctx.createLinearGradient(0, y, 0, y + 16);
      g.addColorStop(0, '#e2e4e0'); g.addColorStop(1, '#9a9c98');
      ctx.fillStyle = g; ctx.fillRect(22, y, w - 44, 15);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.strokeRect(20, 20, w - 40, h - 40);
  });

  def('ventEyes', 480, 240, (ctx, w, h) => {
    ctx.fillStyle = '#040404'; ctx.fillRect(0, 0, w, h);
    for (const cx of [186, 294]) {
      const g = ctx.createRadialGradient(cx, 122, 3, cx, 122, 62);
      g.addColorStop(0, '#fff6e8'); g.addColorStop(0.3, '#ff5a30'); g.addColorStop(0.75, 'rgba(170,14,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, 122, 62, 0, Math.PI * 2); ctx.fill();
    }
  });

  def('face', 256, 300, (ctx, w, h) => drawFace(ctx, 0, 0, w, h, false));
  def('faceSmile', 256, 300, (ctx, w, h) => drawFace(ctx, 0, 0, w, h, true));

  // ---------------------------------------------------------------- decals (alpha tested)
  def('handprint', 512, 512, (ctx, w, h) => {
    const r = rng(71);
    ctx.fillStyle = 'rgba(122,6,6,0.95)';
    ctx.beginPath(); ctx.ellipse(256, 320, 92, 104, 0, 0, Math.PI * 2); ctx.fill();
    const fingers = [[-0.42, 150], [-0.14, 172], [0.14, 166], [0.42, 136]];
    ctx.lineCap = 'round'; ctx.strokeStyle = ctx.fillStyle;
    for (const [a, len] of fingers) {
      ctx.lineWidth = 40;
      const bx = 256 + Math.sin(a) * 70, by = 250 - Math.cos(a) * 40;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.sin(a) * len, by - Math.cos(a) * len); ctx.stroke();
    }
    ctx.lineWidth = 44;
    ctx.beginPath(); ctx.moveTo(180, 330); ctx.lineTo(96, 248); ctx.stroke();
    ctx.lineWidth = 9;
    for (let i = 0; i < 6; i++) {
      const x = 190 + r() * 130, len = 60 + r() * 120;
      ctx.beginPath(); ctx.moveTo(x, 390); ctx.lineTo(x, 390 + len); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, 390 + len, 8, 0, Math.PI * 2); ctx.fill();
    }
  });

  def('footprint', 256, 512, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(18,20,22,0.85)';
    ctx.beginPath(); ctx.ellipse(128, 168, 74, 132, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(128, 410, 62, 74, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    for (let y = 70; y < 290; y += 26) ctx.fillRect(70, y, 116, 9);
    for (let y = 360; y < 470; y += 26) ctx.fillRect(80, y, 96, 9);
    ctx.globalCompositeOperation = 'source-over';
  });

  def('stain', 512, 512, (ctx, w, h) => {
    const r = rng(81);
    ctx.fillStyle = 'rgba(16,10,8,0.96)';
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2, d = r() * 130;
      ctx.beginPath(); ctx.arc(256 + Math.cos(a) * d, 220 + Math.sin(a) * d * 0.8, 30 + r() * 70, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = 140 + r() * 230, len = 110 + r() * 170;
      ctx.lineWidth = 8 + r() * 12;
      ctx.beginPath(); ctx.moveTo(x, 280); ctx.lineTo(x + (r() - 0.5) * 8, 280 + len); ctx.stroke();
    }
  });

  def('daylight', 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.75);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#fff6e2'); g.addColorStop(1, '#ffe0aa');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });

  // ---------------------------------------------------------------- registry
  E.TEX = {};
  DEFS.forEach((d, i) => { E.TEX[d.name] = i; });
  E.TEXTURE_COUNT = DEFS.length;

  /** Draws one texture layer into a size×size canvas. state: { count, lang } */
  E.drawTexture = function (name, size, state) {
    const d = DEFS[E.TEX[name]];
    const c = document.createElement('canvas');
    c.width = d.w; c.height = d.h;
    const ctx = c.getContext('2d');
    d.draw(ctx, d.w, d.h, state || {});
    const out = document.createElement('canvas');
    out.width = out.height = size;
    const o = out.getContext('2d');
    o.imageSmoothingEnabled = true;
    o.imageSmoothingQuality = 'high';
    o.drawImage(c, 0, 0, size, size);
    return out;
  };

  E.drawAllTextures = function (size, state) {
    return DEFS.map(d => E.drawTexture(d.name, size, state));
  };
})(typeof window !== 'undefined' ? window : globalThis);
