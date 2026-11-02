/* Eldermoor: The Ninth Lantern — CHARACTERS module (characters.js)
 * Original stylised low-poly NPCs, enemies, props and painted portraits.
 * Contract: story/ARCHITECTURE.md §4.  Three.js r128, classic script, one IIFE.
 */
(function () {
  'use strict';
  const ELD = window.ELD || (window.ELD = {});

  // ---------------------------------------------------------------------------------------------
  // 0. Shared state, caches and tiny helpers (nothing heavy runs at load time)
  // ---------------------------------------------------------------------------------------------
  let T = null;                      // THREE, resolved lazily on first create()
  const GEO = Object.create(null);   // cached geometries (keep)
  const MAT = Object.create(null);   // cached materials  (keep)
  const TEX = Object.create(null);   // cached textures   (keep)
  const PORTRAITS = Object.create(null);
  let V1 = null, V2 = null;

  function keep(o) {
    if (o) { if (!o.userData) o.userData = {}; o.userData.keep = true; }
    return o;
  }
  function ensure() {
    if (T) return true;
    T = window.THREE || null;
    if (!T) return false;
    V1 = new T.Vector3(); V2 = new T.Vector3();
    return true;
  }
  function css(hex) { return '#' + ('000000' + (hex >>> 0).toString(16)).slice(-6); }
  function mix(hexA, hexB, k) {
    const ar = (hexA >> 16) & 255, ag = (hexA >> 8) & 255, ab = hexA & 255;
    const br = (hexB >> 16) & 255, bg = (hexB >> 8) & 255, bb = hexB & 255;
    const r = Math.round(ar + (br - ar) * k), g = Math.round(ag + (bg - ag) * k), b = Math.round(ab + (bb - ab) * k);
    return (r << 16) | (g << 8) | b;
  }
  function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function kd(lambda, dt) { return 1 - Math.exp(-lambda * dt); }
  // Palette hexes are DISPLAY colours. Core renders with outputEncoding = sRGBEncoding, so material
  // colours are converted to linear and canvas textures are tagged sRGB — what you paint is what you see.
  function lin(hex) { return new T.Color(hex).convertSRGBToLinear(); }

  // ---- geometry cache ----
  function geo(key, make) {
    let g = GEO[key];
    if (!g) { g = keep(make()); GEO[key] = g; }
    return g;
  }
  const G = {
    sph: () => geo('sph', () => new T.SphereGeometry(1, 18, 14)),
    sphLo: () => geo('sphLo', () => new T.SphereGeometry(1, 10, 8)),
    box: () => geo('box', () => new T.BoxGeometry(1, 1, 1)),
    cyl: () => geo('cyl', () => new T.CylinderGeometry(1, 1, 1, 12)),
    cylOpen: () => geo('cylOpen', () => new T.CylinderGeometry(1, 1, 1, 16, 1, true)),
    cone: () => geo('cone', () => new T.ConeGeometry(1, 1, 12)),
    cone5: () => geo('cone5', () => new T.ConeGeometry(1, 1, 5)),
    cone6: () => geo('cone6', () => new T.ConeGeometry(1, 1, 6)),
    circle: () => geo('circle', () => new T.CircleGeometry(1, 24)),
    torus: (r, tube, arc) => geo('tor|' + r + '|' + tube + '|' + (arc || 0), () =>
      new T.TorusGeometry(r, tube, 6, 24, arc || Math.PI * 2))
  };

  // LatheGeometry from [[r,y],...] (bottom → top). Optional jagged hem (odd segments dropped).
  function lathe(key, pts, segs, jag) {
    return geo('lathe|' + key, () => {
      const v = pts.map(p => new T.Vector2(p[0], p[1]));
      const g = new T.LatheGeometry(v, segs || 20);
      if (jag) {
        const pos = g.attributes.position, n = pts.length, s = segs || 20;
        for (let i = 0; i <= s; i++) {
          if (i % 2 === 1) {
            const idx = i * n;
            pos.setY(idx, pos.getY(idx) - jag);
            pos.setX(idx, pos.getX(idx) * 1.08);
            pos.setZ(idx, pos.getZ(idx) * 1.08);
          }
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
      }
      return g;
    });
  }

  // ---- materials ----
  function std(hex, o) {
    o = o || {};
    const key = ['std', hex, o.r, o.m, o.e, o.ei, o.flat ? 1 : 0, o.side || 0, o.tex || '', o.op || ''].join('|');
    let m = MAT[key];
    if (!m) {
      m = new T.MeshStandardMaterial({
        color: lin(hex),
        roughness: o.r != null ? o.r : 0.78,
        metalness: o.m != null ? o.m : 0,
        emissive: lin(o.e != null ? o.e : hex),
        emissiveIntensity: o.ei != null ? o.ei : 0.07,
        flatShading: !!o.flat,
        side: o.side || T.FrontSide
      });
      if (o.map) m.map = o.map;
      if (o.op != null) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
      MAT[key] = keep(m);
    }
    return m;
  }
  function basic(hex, o) {
    o = o || {};
    const key = ['bas', hex, o.op != null ? o.op : '', o.add ? 1 : 0, o.side || 0, o.tex || ''].join('|');
    let m = MAT[key];
    if (!m) {
      m = new T.MeshBasicMaterial({ color: lin(hex), side: o.side || T.FrontSide });
      if (o.map) m.map = o.map;
      if (o.op != null || o.add || o.map) { m.transparent = true; m.opacity = o.op != null ? o.op : 1; m.depthWrite = false; }
      if (o.add) m.blending = T.AdditiveBlending;
      MAT[key] = keep(m);
    }
    return m;
  }
  function lambert(hex, o) {
    o = o || {};
    const key = ['lam', hex, o.op != null ? o.op : '', o.e || 0, o.side || 0, o.tex || ''].join('|');
    let m = MAT[key];
    if (!m) {
      m = new T.MeshLambertMaterial({ color: lin(hex), emissive: lin(o.e || 0), side: o.side || T.FrontSide });
      if (o.map) m.map = o.map;
      if (o.op != null || o.map) { m.transparent = true; m.opacity = o.op != null ? o.op : 1; m.depthWrite = false; }
      MAT[key] = keep(m);
    }
    return m;
  }

  // ---- textures ----
  function canvasTex(key, w, h, draw) {
    let t = TEX[key];
    if (!t) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      t = new T.CanvasTexture(c);
      if (!/^(glow|soft)/.test(key)) t.encoding = T.sRGBEncoding;
      TEX[key] = keep(t);
    }
    return t;
  }
  function glowTex(cssColor) {
    const u = ELD.util;
    if (u && typeof u.glowTexture === 'function') {
      try { const t = u.glowTexture(cssColor, 128); if (t) return keep(t); } catch (e) { /* fall back */ }
    }
    return canvasTex('glow|' + cssColor, 128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, cssColor); gr.addColorStop(0.25, cssColor);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      // soften: second pass with lower alpha core so the falloff reads round
    });
  }
  function softTex() { // white radial, fades to transparent (multiplied by sprite colour)
    return canvasTex('soft', 128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    });
  }
  function glowMat(cssColor, opacity) {
    const key = 'glowS|' + cssColor + '|' + opacity;
    let m = MAT[key];
    if (!m) {
      m = new T.SpriteMaterial({ map: softTex(), color: new T.Color(cssColor).convertSRGBToLinear(), transparent: true, opacity: opacity,
        blending: T.AdditiveBlending, depthWrite: false });
      MAT[key] = keep(m);
    }
    return m;
  }
  function smokeMat(opacity) {
    const key = 'smoke|' + opacity;
    let m = MAT[key];
    if (!m) {
      m = new T.SpriteMaterial({ map: softTex(), color: 0x050208, transparent: true, opacity: opacity, depthWrite: false });
      MAT[key] = keep(m);
    }
    return m;
  }
  function sprite(material, scale, x, y, z, parent) {
    const s = new T.Sprite(material);
    if (s.geometry) keep(s.geometry); // three's shared sprite quad — never dispose
    s.scale.set(scale, scale, scale);
    s.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(s);
    return s;
  }

  // Robe texture: base colour + vertical folds + front seam + hem trim (lathe UV: u=0.5 front, v=0 hem)
  function robeTex(key, o) {
    return canvasTex('robe|' + key, 256, 128, (g, w, h) => {
      g.fillStyle = css(o.base); g.fillRect(0, 0, w, h);
      // gentle top-to-bottom light
      let gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(255,255,255,0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0.18)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // folds
      const folds = o.folds || 14;
      for (let i = 0; i < folds; i++) {
        const x0 = (i / folds) * w, fw = w / folds;
        gr = g.createLinearGradient(x0, 0, x0 + fw, 0);
        gr.addColorStop(0, 'rgba(0,0,0,0.20)');
        gr.addColorStop(0.45, 'rgba(255,255,255,0.07)');
        gr.addColorStop(1, 'rgba(0,0,0,0.20)');
        g.fillStyle = gr; g.fillRect(x0, 0, fw, h);
      }
      // front opening
      if (o.seam != null) {
        g.fillStyle = css(o.seam);
        g.fillRect(w / 2 - (o.seamW || 7), 0, (o.seamW || 7) * 2, h);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(w / 2 - (o.seamW || 7) - 2, 0, 2, h); g.fillRect(w / 2 + (o.seamW || 7), 0, 2, h);
      }
      // hem band
      if (o.trim != null) {
        const bh = o.bandH || 12;
        g.fillStyle = css(o.trim);
        g.fillRect(0, h - bh - 2, w, bh);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, h - bh - 3, w, 1);
        if (o.stars) { // copper constellation trim
          g.strokeStyle = css(o.trim); g.lineWidth = 1;
          g.fillStyle = css(o.trim);
          let px = 0, py = h - bh - 10;
          for (let i = 0; i < 26; i++) {
            const x = i * (w / 25), y = h - bh - 8 - ((i * 37) % 23);
            g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1;
            g.beginPath(); g.arc(x, y, (i % 3 === 0) ? 2.2 : 1.3, 0, Math.PI * 2); g.fill();
            px = x; py = y;
          }
        }
      }
      if (o.collarTrim != null) { g.fillStyle = css(o.collarTrim); g.fillRect(0, 0, w, 5); }
    });
  }

  // ---------------------------------------------------------------------------------------------
  // 1. Mesh helpers
  // ---------------------------------------------------------------------------------------------
  function mesh(g, m, parent, x, y, z, sx, sy, sz) {
    const o = new T.Mesh(g, m);
    o.position.set(x || 0, y || 0, z || 0);
    if (sx != null) o.scale.set(sx, sy != null ? sy : sx, sz != null ? sz : sx);
    if (parent) parent.add(o);
    return o;
  }
  function group(parent, x, y, z) {
    const g = new T.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(g);
    return g;
  }

  // ---------------------------------------------------------------------------------------------
  // 2. Poses & the generic NPC wrapper
  // ---------------------------------------------------------------------------------------------
  // Arm angles [rx, rz]: rx>0 raises the arm forward (−Z); rz>0 swings toward +X (character's right).
  const POSES = {
    idle:  { R: [0.08, 0.12], L: [0.08, -0.12], drop: 0, lean: 0, head: 0 },
    cast:  { R: [1.55, -0.05], L: [0.35, -0.32], drop: 0, lean: -0.04, head: 0.02 },
    point: { R: [1.62, -0.18], L: [0.12, -0.14], drop: 0, lean: -0.03, head: -0.02 },
    wave:  { R: [0.15, 2.65], L: [0.1, -0.14], drop: 0, lean: 0.02, head: -0.08, wave: true },
    kneel: { R: [0.75, 0.2], L: [0.55, -0.25], drop: 0.42, lean: 0.26, head: 0.32 },
    sit:   { R: [0.7, 0.1], L: [0.7, -0.1], drop: 0.4, lean: 0.05, head: 0.05 }
  };

  function makeNpc(id, root, impl, opts) {
    const st = {
      yawTarget: null, talking: false, pose: 'idle', clock: 0,
      blinkT: 1 + Math.random() * 3, blinking: 0, drop: 0, lean: 0,
      phase: Math.random() * 6.28, flash: 0
    };
    const listeners = [];
    root.name = 'npc:' + id;
    if (opts && typeof opts.yaw === 'number') root.rotation.y = opts.yaw;
    if (opts && typeof opts.scale === 'number') root.scale.setScalar(opts.scale);
    const npc = {
      id: id,
      object3D: root,
      height: impl.height,
      update(dt, t) {
        dt = Math.min(Math.max(dt || 0, 0), 0.05);
        st.clock += dt;
        const tt = (typeof t === 'number') ? t : st.clock;
        if (st.yawTarget != null) {
          const d = wrapAngle(st.yawTarget - root.rotation.y);
          root.rotation.y = wrapAngle(root.rotation.y + d * kd(impl.turnRate || 5, dt));
        }
        if (impl.update) impl.update(dt, tt, st);
      },
      lookAt(x, z) {
        if (typeof x !== 'number' || typeof z !== 'number') { st.yawTarget = null; return; }
        root.getWorldPosition(V1);
        const dx = x - V1.x, dz = z - V1.z;
        if (dx * dx + dz * dz < 1e-4) return;
        st.yawTarget = Math.atan2(-dx, -dz);
      },
      faceYaw(yaw) { st.yawTarget = yaw; },
      setYaw(yaw) { st.yawTarget = null; root.rotation.y = yaw; },
      setTalking(b) { st.talking = !!b; },
      setPose(p) { st.pose = (POSES[p] || (impl.poses && impl.poses[p])) ? p : 'idle'; },
      getPose() { return st.pose; },
      setVisible(b) { root.visible = !!b; },
      getHandPos(out) { // world position of the casting hand (wand tip) — for cosmetic sparks
        out = out || new T.Vector3();
        if (impl.hand) return impl.hand.getWorldPosition(out);
        root.getWorldPosition(out); out.y += (npc.height || 1) * 0.6; return out;
      },
      flash() { st.flash = 1; },
      dispose() {
        listeners.forEach(l => { try { if (ELD.off) ELD.off(l[0], l[1]); } catch (e) { /* ignore */ } });
        listeners.length = 0;
        if (root.parent) root.parent.remove(root);
        root.traverse(o => {
          if (o.geometry && !(o.geometry.userData && o.geometry.userData.keep) && !o.isSprite) o.geometry.dispose();
          const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
          ms.forEach(m => {
            if (!m || (m.userData && m.userData.keep)) return;
            if (m.map && !(m.map.userData && m.map.userData.keep)) m.map.dispose();
            m.dispose();
          });
        });
      }
    };
    npc._st = st;
    npc._listen = function (evt, fn) {
      if (ELD.on) { try { ELD.on(evt, fn); listeners.push([evt, fn]); } catch (e) { /* ignore */ } }
    };
    if (opts && opts.pose) npc.setPose(opts.pose);
    root.userData.npc = npc;
    return npc;
  }

  // ---------------------------------------------------------------------------------------------
  // 3. Generic humanoid (robe lathe + head + two arms)
  // ---------------------------------------------------------------------------------------------
  // cfg: key, profile, robeMat, sleeveMat, skinMat, handMat, shoulderY, shoulderX, neckH, headR,
  //      armLen, sleeve:[rTop,rBot], eyeMat, browMat, browTilt, headScale:[x,y,z], ears(bool)
  function humanoid(cfg) {
    const root = new T.Group();
    const body = group(root);
    const R = cfg.headR;
    mesh(lathe(cfg.key, cfg.profile, 20, cfg.jag), cfg.robeMat, body);
    // neck
    mesh(G.cyl(), cfg.skinMat, body, 0, cfg.shoulderY + cfg.neckH * 0.45, 0, R * 0.34, cfg.neckH + 0.06, R * 0.34);
    const headPivot = group(body, 0, cfg.shoulderY + cfg.neckH, 0);
    const head = group(headPivot, 0, R * 0.92, 0);
    const hs = cfg.headScale || [1, 1.04, 0.98];
    mesh(G.sph(), cfg.skinMat, head, 0, 0, 0, R * hs[0], R * hs[1], R * hs[2]);
    // ears
    if (cfg.ears !== false && !cfg.lite) {
      mesh(G.sphLo(), cfg.skinMat, head, R * 0.95, -0.02 * R, 0.02, R * 0.16, R * 0.24, R * 0.12);
      mesh(G.sphLo(), cfg.skinMat, head, -R * 0.95, -0.02 * R, 0.02, R * 0.16, R * 0.24, R * 0.12);
    }
    // eyes (dark, glossy) + brows + nose + mouth
    const eyeMat = cfg.eyeMat || std(0x14100e, { r: 0.2, ei: 0 });
    const ex = R * (cfg.eyeX || 0.34), ey = R * (cfg.eyeY || 0.06);
    const eyeS = R * (cfg.eyeS || 0.13);
    const eL = mesh(G.sphLo(), eyeMat, head, -ex, ey, -R * 0.86, eyeS, eyeS * 1.25, eyeS * 0.6);
    const eR = mesh(G.sphLo(), eyeMat, head, ex, ey, -R * 0.86, eyeS, eyeS * 1.25, eyeS * 0.6);
    eL.userData.sy = eL.scale.y; eR.userData.sy = eR.scale.y;
    // eye shine
    if (!cfg.lite) {
      const shine = basic(0xffffff);
      mesh(G.sphLo(), shine, head, -ex + eyeS * 0.35, ey + eyeS * 0.45, -R * 0.93, eyeS * 0.28);
      mesh(G.sphLo(), shine, head, ex + eyeS * 0.35, ey + eyeS * 0.45, -R * 0.93, eyeS * 0.28);
    }
    const browMat = cfg.browMat || std(0x2a1d14);
    const bt = cfg.browTilt || 0;
    const bL = mesh(G.box(), browMat, head, -ex, ey + R * 0.3, -R * 0.84, R * 0.3, R * 0.07, R * 0.07);
    const bR = mesh(G.box(), browMat, head, ex, ey + R * 0.3, -R * 0.84, R * 0.3, R * 0.07, R * 0.07);
    bL.rotation.z = -bt; bR.rotation.z = bt;
    if (!cfg.lite) mesh(G.sphLo(), cfg.skinMat, head, 0, -R * 0.1, -R * 0.97, R * 0.11, R * 0.13, R * 0.12);
    const mouth = mesh(G.box(), std(0x5a2020, { ei: 0 }), head, 0, -R * 0.42, -R * 0.86, R * 0.26, R * 0.05, R * 0.06);
    mouth.userData.sy = mouth.scale.y;
    // arms
    function arm(side) {
      const piv = group(body, side * cfg.shoulderX, cfg.shoulderY - 0.06, 0);
      const s = cfg.sleeve, L = cfg.armLen;
      const sg = geo('sleeve|' + s[0] + '|' + s[1] + '|' + L, () => {
        const g = new T.CylinderGeometry(s[0], s[1], L, 10, 1);
        g.translate(0, -L / 2, 0);
        return g;
      });
      mesh(sg, cfg.sleeveMat, piv);
      const hand = group(piv, 0, -L - 0.035, 0);
      mesh(G.sph(), cfg.handMat || cfg.skinMat, hand, 0, 0, 0, 0.048, 0.058, 0.048);
      return { piv, hand };
    }
    const aR = arm(1), aL = arm(-1);
    return {
      root, body, head, headPivot, R, handMesh: aR.hand,
      armR: aR.piv, armL: aL.piv, handR: aR.hand, handL: aL.hand,
      eyes: [eL, eR], brows: [bL, bR], mouth
    };
  }

  function animHumanoid(P, st, dt, t, poses) {
    const pose = (poses && poses[st.pose]) || POSES[st.pose] || (poses && poses.idle) || POSES.idle;
    const k = kd(8, dt);
    let rx = pose.R[0], rz = pose.R[1];
    const lx = pose.L[0], lz = pose.L[1];
    if (st.talking && (st.pose === 'idle') && !P.noTalkArm) {
      rx += 0.38 + Math.sin(t * 3.1 + st.phase) * 0.22;
      rz += -0.15 + Math.sin(t * 2.3) * 0.08;
    }
    if (pose.wave) rz += Math.sin(t * 9) * 0.28;
    P.armR.rotation.x += (rx - P.armR.rotation.x) * k;
    P.armR.rotation.z += (rz - P.armR.rotation.z) * k;
    P.armL.rotation.x += (lx - P.armL.rotation.x) * k;
    P.armL.rotation.z += (lz - P.armL.rotation.z) * k;
    st.drop += ((pose.drop || 0) - st.drop) * k;
    st.lean += ((pose.lean || 0) - st.lean) * k;
    const br = Math.sin(t * 1.7 + st.phase);
    P.body.position.y = (P.baseY || 0) - st.drop;
    P.body.rotation.x = -st.lean;
    P.body.rotation.z = Math.sin(t * 0.7 + st.phase) * 0.014;
    P.body.scale.set(1 + br * 0.008, 1 + br * 0.012, 1 + br * 0.008);
    const hx = -(pose.head || 0) + (st.talking ? Math.sin(t * 7.5) * 0.06 : Math.sin(t * 0.5 + st.phase) * 0.03);
    P.headPivot.rotation.x += (hx - P.headPivot.rotation.x) * k;
    P.headPivot.rotation.y = Math.sin(t * 0.33 + st.phase * 2) * (st.talking ? 0.05 : 0.14);
    P.headPivot.rotation.z = st.talking ? Math.sin(t * 2.1) * 0.05 : 0;
    // blink
    st.blinkT -= dt;
    if (st.blinkT < 0) { st.blinkT = 2.2 + Math.random() * 3.2; st.blinking = 0.13; }
    if (st.blinking > 0) st.blinking -= dt;
    const e = st.blinking > 0 ? 0.12 : 1;
    for (let i = 0; i < P.eyes.length; i++) P.eyes[i].scale.y = P.eyes[i].userData.sy * e;
    if (P.mouth) {
      const m = st.talking ? 0.8 + Math.abs(Math.sin(t * 11.3)) * 2.6 : 1;
      P.mouth.scale.y = P.mouth.userData.sy * m;
    }
  }

  function addWand(hand, hex) {
    mesh(G.cyl(), std(hex, { r: 0.6 }), hand, 0, -0.12, -0.01, 0.009, 0.24, 0.009);
    mesh(G.sphLo(), std(0xf0e6d0, { e: 0xfff4d0, ei: 0.5 }), hand, 0, -0.245, -0.01, 0.012);
  }

  // keeps a hand-held object upright: child of hand, inverse of the arm rotation (+ optional swing)
  function uprightInHand(obj, armPiv, swingX, swingZ) {
    obj.rotation.order = 'ZYX';
    obj.rotation.set(-armPiv.rotation.x + (swingX || 0), 0, -armPiv.rotation.z + (swingZ || 0));
  }

  // ---------------------------------------------------------------------------------------------
  // 4. Characters
  // ---------------------------------------------------------------------------------------------
  function adultProfile(sy, hem, waist, chest, shoulder) {
    return [[hem, 0], [hem * 0.96, sy * 0.07], [(hem + waist) * 0.5, sy * 0.32], [waist, sy * 0.56],
      [chest, sy * 0.78], [shoulder, sy * 0.92], [shoulder * 0.72, sy * 0.985], [0.075, sy + 0.01], [0, sy + 0.02]];
  }

  // ---- Orla Tamsin: tall astronomer headmistress ----
  function buildOrla(opts) {
    const skin = std(0x7a4a2c, { r: 0.6 });
    const robeMap = robeTex('orla', { base: 0x0b3a42, trim: 0xc8763a, stars: true, seam: 0x07262c, seamW: 5, bandH: 10 });
    const robe = std(0xffffff, { map: robeMap, tex: 'orla', r: 0.7, e: 0x0b3a42, ei: 0.12 });
    const sleeve = std(0x0d434c, { r: 0.7, ei: 0.1 });
    const copper = std(0xc8763a, { r: 0.35, m: 0.7, ei: 0.15 });
    const brass = std(0xd6a640, { r: 0.3, m: 0.85, ei: 0.18 });
    const hair = std(0xd4d8de, { r: 0.55, ei: 0.12 });
    const P = humanoid({
      key: 'orla', profile: adultProfile(1.5, 0.44, 0.24, 0.27, 0.25), robeMat: robe, sleeveMat: sleeve, skinMat: skin,
      shoulderY: 1.5, shoulderX: 0.25, neckH: 0.15, headR: 0.135, armLen: 0.62, sleeve: [0.06, 0.12],
      browMat: std(0xb8bcc4), browTilt: 0.08
    });
    const R = P.R, h = P.head;
    // short silver hair: cap + side swoop + nape
    mesh(G.sph(), hair, h, 0, R * 0.22, R * 0.1, R * 1.06, R * 0.86, R * 1.06);
    mesh(G.sph(), hair, h, -R * 0.35, R * 0.55, -R * 0.55, R * 0.62, R * 0.3, R * 0.42);
    mesh(G.sph(), hair, h, R * 0.55, R * 0.25, -R * 0.2, R * 0.48, R * 0.55, R * 0.7);
    // high collar (open flared cylinder) with copper rim
    const colG = geo('orlaCollar', () => new T.CylinderGeometry(1.25, 0.8, 1, 16, 1, true, Math.PI * 0.18, Math.PI * 1.64));
    mesh(colG, std(0x0a323a, { side: T.DoubleSide, ei: 0.1 }), P.body, 0, 1.57, 0.02, 0.12, 0.13, 0.11);
    const rimG = geo('orlaCollarRim', () => new T.TorusGeometry(1, 0.05, 6, 24, Math.PI * 1.64));
    const rim = mesh(rimG, copper, P.body, 0, 1.635, 0.02, 0.15, 0.137, 0.15);
    rim.rotation.set(Math.PI / 2, 0, Math.PI / 2 + Math.PI * 0.18);
    // copper clasp + belt
    mesh(G.sph(), copper, P.body, 0, 1.38, -0.21, 0.035);
    mesh(G.torus(1, 0.04), copper, P.body, 0, 0.86, 0, 0.245, 0.245, 0.245).rotation.x = Math.PI / 2;
    // brass ring-staff (in left hand, kept upright)
    const staff = group(P.handL);
    mesh(G.cyl(), std(0x5a3a22, { r: 0.6 }), staff, 0, -0.05, 0, 0.022, 1.95, 0.022);
    mesh(G.cyl(), brass, staff, 0, -0.95, 0, 0.03, 0.08, 0.03);
    mesh(G.cyl(), brass, staff, 0, 0.9, 0, 0.03, 0.1, 0.03);
    const ring = group(staff, 0, 1.1, 0);
    mesh(G.torus(1, 0.05), brass, ring, 0, 0, 0, 0.16);
    const ring2 = mesh(G.torus(1, 0.05), brass, ring, 0, 0, 0, 0.12);
    ring2.rotation.y = Math.PI / 2;
    mesh(G.sph(), std(0xffe9a8, { e: 0xffd27a, ei: 0.9 }), ring, 0, 0, 0, 0.04);
    sprite(glowMat('#ffd98a', 0.55), 0.35, 0, 0, 0, ring);
    const orbit = group(ring);
    const orbMats = [std(0x9fd8ff, { e: 0x6fb8ff, ei: 0.8 }), std(0xffb070, { e: 0xff8a3a, ei: 0.8 }), std(0xe8e8ff, { e: 0xc8c8ff, ei: 0.8 })];
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3;
      mesh(G.sphLo(), orbMats[i], orbit, Math.cos(a) * 0.24, Math.sin(a * 2) * 0.05, Math.sin(a) * 0.24, 0.025);
    }
    const poses = {
      idle: { R: [0.1, 0.1], L: [0.32, -0.22], drop: 0, lean: 0, head: 0 },
      wave: { R: [0.15, 2.65], L: [0.32, -0.22], wave: true, head: -0.06 },
      point: { R: [1.62, -0.18], L: [0.32, -0.22], head: -0.02 }
    };
    return { root: P.root, hand: P.handR, height: 1.92, poses, update(dt, t, st) {
      animHumanoid(P, st, dt, t, poses);
      uprightInHand(staff, P.armL);
      orbit.rotation.y = t * 0.9;
      ring.rotation.y = t * 0.25;
    } };
  }

  // ---- Dov Arkin: short round charms professor ----
  function buildDov(opts) {
    const skin = std(0xeab896, { r: 0.6 });
    const robeMap = robeTex('dov', { base: 0xb8620e, trim: 0x6a3a08, seam: 0xe9d9b0, seamW: 9, bandH: 8 });
    const robe = std(0xffffff, { map: robeMap, tex: 'dov', r: 0.75, e: 0xb8620e, ei: 0.08 });
    const sleeve = std(0xb05c0c, { r: 0.75 });
    const hair = std(0x7a3414, { r: 0.85 });
    const gold = std(0xe0b040, { r: 0.25, m: 0.9, ei: 0.2 });
    const green = std(0x17733a, { r: 0.5, ei: 0.12 });
    const P = humanoid({
      key: 'dov',
      profile: [[0.4, 0], [0.42, 0.08], [0.47, 0.3], [0.48, 0.55], [0.42, 0.8], [0.3, 0.98], [0.2, 1.06], [0.07, 1.1], [0, 1.11]],
      robeMat: robe, sleeveMat: sleeve, skinMat: skin, shoulderY: 1.09, shoulderX: 0.3, neckH: 0.04, headR: 0.17,
      armLen: 0.5, sleeve: [0.075, 0.11], browMat: hair, browTilt: -0.15, headScale: [1.02, 1.0, 1.0], eyeS: 0.12
    });
    const R = P.R, h = P.head;
    // big curly hair: ring of curls
    const curls = [[0, 0.72, 0.2, 0.62], [-0.62, 0.5, 0.15, 0.5], [0.62, 0.5, 0.15, 0.5], [-0.82, 0.0, 0.35, 0.42],
      [0.82, 0.0, 0.35, 0.42], [-0.32, 0.8, -0.32, 0.42], [0.32, 0.8, -0.32, 0.42]];
    curls.forEach(c => mesh(G.sphLo(), hair, h, c[0] * R, c[1] * R, c[2] * R, c[3] * R));
    // bushy moustache + rosy cheeks
    mesh(G.sph(), hair, h, -R * 0.2, -R * 0.3, -R * 0.9, R * 0.22, R * 0.1, R * 0.12);
    mesh(G.sph(), hair, h, R * 0.2, -R * 0.3, -R * 0.9, R * 0.22, R * 0.1, R * 0.12);
    const cheek = std(0xe8807a, { ei: 0.1 });
    mesh(G.sphLo(), cheek, h, -R * 0.56, -R * 0.15, -R * 0.75, R * 0.16, R * 0.12, R * 0.08);
    mesh(G.sphLo(), cheek, h, R * 0.56, -R * 0.15, -R * 0.75, R * 0.16, R * 0.12, R * 0.08);
    // round spectacles
    const glassMat = std(0x3a2a18, { r: 0.4, m: 0.5 });
    mesh(G.torus(1, 0.12), glassMat, h, -R * 0.34, R * 0.07, -R * 0.95, R * 0.2);
    mesh(G.torus(1, 0.12), glassMat, h, R * 0.34, R * 0.07, -R * 0.95, R * 0.2);
    // green round bow tie
    const bow = group(P.body, 0, 1.06, -0.18);
    mesh(G.sph(), green, bow, -0.065, 0, 0, 0.065, 0.05, 0.03);
    mesh(G.sph(), green, bow, 0.065, 0, 0, 0.065, 0.05, 0.03);
    mesh(G.sph(), std(0x0f5a2a), bow, 0, 0, -0.012, 0.028);
    // buttons
    mesh(G.sphLo(), gold, P.body, 0, 0.88, -0.44, 0.022);
    mesh(G.sphLo(), gold, P.body, 0, 0.72, -0.475, 0.022);
    // pocket watch + chain across the belly
    const chain = mesh(G.torus(0.2, 0.008, Math.PI), gold, P.body, 0.12, 0.62, -0.47);
    chain.rotation.z = Math.PI; chain.scale.set(1, 0.45, 1);
    const watch = mesh(G.cyl(), gold, P.body, 0.31, 0.6, -0.44, 0.06, 0.018, 0.06);
    watch.rotation.x = Math.PI / 2; watch.rotation.y = 0.5;
    mesh(G.circle(), std(0xfaf3dc, { ei: 0.3 }), P.body, 0.313, 0.6, -0.462, 0.045).rotation.y = Math.PI + 0.5;
    // wand in right hand
    addWand(P.handR, 0x4a2c16);
    const poses = { idle: { R: [0.12, 0.22], L: [0.12, -0.22], drop: 0, lean: 0, head: 0 } };
    return { root: P.root, hand: P.handR, height: 1.48, poses, update(dt, t, st) {
      animHumanoid(P, st, dt, t, poses);
      if (st.talking) P.body.position.y += Math.abs(Math.sin(t * 6)) * 0.02; // enthusiastic bounce
    } };
  }

  // ---- Noa Levin + Tik the clockwork owl ----
  function buildTik(parent) {
    const brass = std(0xc4923a, { r: 0.35, m: 0.85, ei: 0.15 });
    const dark = std(0x6a4a1e, { r: 0.4, m: 0.7 });
    const owl = group(parent);
    mesh(G.sph(), brass, owl, 0, 0.06, 0, 0.065, 0.075, 0.06);
    const head = group(owl, 0, 0.15, 0);
    mesh(G.sph(), brass, head, 0, 0, 0, 0.06, 0.055, 0.055);
    const eyeM = basic(0x6ff2e0);
    mesh(G.torus(1, 0.25), dark, head, -0.025, 0.005, -0.048, 0.022);
    mesh(G.torus(1, 0.25), dark, head, 0.025, 0.005, -0.048, 0.022);
    mesh(G.sphLo(), eyeM, head, -0.025, 0.005, -0.05, 0.016);
    mesh(G.sphLo(), eyeM, head, 0.025, 0.005, -0.05, 0.016);
    const beak = mesh(G.cone(), dark, head, 0, -0.022, -0.055, 0.012, 0.03, 0.012);
    beak.rotation.x = Math.PI;
    mesh(G.cone(), brass, head, -0.04, 0.05, 0, 0.014, 0.04, 0.014).rotation.z = 0.4;
    mesh(G.cone(), brass, head, 0.04, 0.05, 0, 0.014, 0.04, 0.014).rotation.z = -0.4;
    const gear = mesh(G.torus(1, 0.35), dark, owl, 0, 0.05, -0.058, 0.025);
    const wL = group(owl, -0.06, 0.09, 0.005), wR = group(owl, 0.06, 0.09, 0.005);
    mesh(G.sph(), dark, wL, -0.012, -0.04, 0, 0.018, 0.055, 0.04);
    mesh(G.sph(), dark, wR, 0.012, -0.04, 0, 0.018, 0.055, 0.04);
    let flapT = 0;
    return {
      owl,
      update(dt, t, excited) {
        flapT -= dt;
        if (flapT < -2.5 - Math.random() * 3) flapT = 0.7;
        const flapping = flapT > 0 || excited;
        const f = flapping ? Math.sin(t * 28) * 0.9 + 0.9 : 0.05;
        wL.rotation.z = -f; wR.rotation.z = f;
        head.rotation.y = Math.sin(t * 0.8) * 0.6 + (Math.sin(t * 0.23) > 0.85 ? 1.2 : 0);
        head.rotation.z = Math.sin(t * 1.7) * 0.1;
        owl.position.y = flapping ? Math.abs(Math.sin(t * 14)) * 0.02 : 0;
        gear.rotation.z = t * 2;
      }
    };
  }
  function buildNoa(opts) {
    const skin = std(0xc98d64, { r: 0.6 });
    const robeMap = robeTex('noa', { base: 0x17401f, trim: 0x2c6a36, seam: 0xd8cfb6, seamW: 8, bandH: 7 });
    const robe = std(0xffffff, { map: robeMap, tex: 'noa', r: 0.8, e: 0x17401f, ei: 0.12 });
    const sleeve = std(0x1a4722, { r: 0.8, ei: 0.1 });
    const hair = std(0x1e1410, { r: 0.9, ei: 0.04 });
    const brass = std(0xc4923a, { r: 0.35, m: 0.85, ei: 0.15 });
    const leather = std(0x6b3a1c, { r: 0.7 });
    const P = humanoid({
      key: 'noa', profile: adultProfile(1.16, 0.33, 0.19, 0.2, 0.2), robeMat: robe, sleeveMat: sleeve, skinMat: skin,
      shoulderY: 1.16, shoulderX: 0.2, neckH: 0.06, headR: 0.15, armLen: 0.48, sleeve: [0.05, 0.08],
      browMat: hair, eyeS: 0.15
    });
    const R = P.R, h = P.head;
    // curly hair base + two puffs + curls framing the face
    mesh(G.sph(), hair, h, 0, R * 0.25, R * 0.12, R * 1.1, R * 0.92, R * 1.08);
    mesh(G.sphLo(), hair, h, -R * 0.95, R * 0.85, R * 0.05, R * 0.55);
    mesh(G.sphLo(), hair, h, R * 0.95, R * 0.85, R * 0.05, R * 0.55);
    mesh(G.sph(), hair, h, 0, -R * 0.05, R * 0.35, R * 1.05, R * 0.8, R * 0.8);
    // brass goggles on the forehead
    const gog = group(h, 0, R * 0.55, -R * 0.8);
    gog.rotation.x = -0.35;
    mesh(G.torus(1, 0.28), brass, gog, -R * 0.3, 0, 0, R * 0.24);
    mesh(G.torus(1, 0.28), brass, gog, R * 0.3, 0, 0, R * 0.24);
    const lens = std(0x8fd6ea, { r: 0.1, m: 0.2, e: 0x3a9ab8, ei: 0.5 });
    mesh(G.circle(), lens, gog, -R * 0.3, 0, -0.004, R * 0.2).rotation.y = Math.PI;
    mesh(G.circle(), lens, gog, R * 0.3, 0, -0.004, R * 0.2).rotation.y = Math.PI;
    mesh(G.torus(1, 0.03), leather, h, 0, R * 0.52, 0, R * 1.08, R * 1.08, R * 1.02).rotation.x = Math.PI / 2 - 0.3;
    // freckles-ish cheeks
    const cheek = std(0xd8786a, { ei: 0.1 });
    mesh(G.sphLo(), cheek, h, -R * 0.55, -R * 0.2, -R * 0.78, R * 0.13, R * 0.09, R * 0.06);
    mesh(G.sphLo(), cheek, h, R * 0.55, -R * 0.2, -R * 0.78, R * 0.13, R * 0.09, R * 0.06);
    // satchel on the right hip + diagonal strap
    const bag = mesh(G.box(), leather, P.body, 0.27, 0.6, -0.02, 0.1, 0.2, 0.24);
    bag.rotation.y = 0.15;
    mesh(G.box(), std(0x8a5028), P.body, 0.325, 0.66, -0.02, 0.012, 0.1, 0.25);
    const strapG = group(P.body, 0.0, 0.84, 0);
    strapG.rotation.z = -0.72;
    mesh(G.torus(1, 0.06), leather, strapG, 0, 0, 0, 0.27, 0.205, 0.2).rotation.x = Math.PI / 2;
    // Tik on the left shoulder
    addWand(P.handR, 0x6b4426);
    const tikSeat = group(P.body, -0.17, 1.15, 0.02);
    tikSeat.scale.setScalar(1.35);
    const tik = buildTik(tikSeat);
    const poses = { idle: { R: [0.1, 0.14], L: [0.06, -0.1], drop: 0, lean: 0, head: 0 } };
    return { root: P.root, hand: P.handR, height: 1.52, poses, update(dt, t, st) {
      animHumanoid(P, st, dt, t, poses);
      tik.update(dt, t, st.talking && Math.sin(t * 0.9) > 0.6);
      if (st.talking) P.headPivot.rotation.x += Math.sin(t * 13) * 0.02; // talks fast
    } };
  }

  // ---- Tal Shaked: tall lanky rival ----
  function buildTal(opts) {
    const skin = std(0xe2bc9c, { r: 0.6 });
    const robeMap = robeTex('tal', { base: 0x353d47, trim: 0x232a32, seam: 0x1c2026, seamW: 6, bandH: 6 });
    const robe = std(0xffffff, { map: robeMap, tex: 'tal', r: 0.8, e: 0x353d47, ei: 0.1 });
    const sleeve = std(0x39424d, { r: 0.8 });
    const hair = std(0x111116, { r: 0.6, ei: 0.03 });
    const blue = std(0x2a5ef0, { r: 0.45, e: 0x2a5ef0, ei: 0.45 });
    const glove = std(0x1e1b19, { r: 0.7 });
    const P = humanoid({
      key: 'tal', profile: adultProfile(1.38, 0.3, 0.17, 0.2, 0.21), robeMat: robe, sleeveMat: sleeve, skinMat: skin,
      shoulderY: 1.38, shoulderX: 0.2, neckH: 0.09, headR: 0.135, armLen: 0.3, sleeve: [0.05, 0.065],
      browMat: hair, browTilt: 0.22, headScale: [0.95, 1.1, 0.98], eyeS: 0.12, handMat: glove
    });
    const R = P.R, h = P.head;
    // swept black hair with a cobalt streak
    mesh(G.sph(), hair, h, 0, R * 0.3, R * 0.12, R * 1.06, R * 0.85, R * 1.06);
    const fr = mesh(G.sph(), hair, h, R * 0.25, R * 0.72, -R * 0.55, R * 0.85, R * 0.32, R * 0.5);
    fr.rotation.z = -0.35;
    const st1 = mesh(G.sph(), blue, h, -R * 0.32, R * 0.86, -R * 0.28, R * 0.2, R * 0.2, R * 0.92);
    st1.rotation.set(-0.45, 0, 0.3);
    const st2 = mesh(G.sph(), blue, h, -R * 0.52, R * 0.45, -R * 0.82, R * 0.12, R * 0.32, R * 0.12);
    st2.rotation.z = -0.5;
    mesh(G.sph(), hair, h, -R * 0.82, R * 0.1, R * 0.15, R * 0.3, R * 0.55, R * 0.6);
    mesh(G.sph(), hair, h, R * 0.82, R * 0.1, R * 0.15, R * 0.3, R * 0.55, R * 0.6);
    // smirk: tilt the mouth
    P.mouth.rotation.z = 0.18; P.mouth.position.x = R * 0.05;
    // rolled sleeves: forearms in skin + cuff roll, fingerless gloves
    const elbows = [[P.armR, P.handR], [P.armL, P.handL]].map(a => {
      const el = group(a[0], 0, -0.3, 0);
      mesh(G.torus(1, 0.45), sleeve, el, 0, 0, 0, 0.062, 0.062, 0.062).rotation.x = Math.PI / 2;
      mesh(G.cyl(), skin, el, 0, -0.13, 0, 0.04, 0.26, 0.038);
      el.add(a[1]);
      a[1].position.set(0, -0.29, 0);
      mesh(G.box(), skin, a[1], 0, -0.055, -0.005, 0.055, 0.035, 0.03);
      return el;
    });
    addWand(P.handR, 0x1e1a18);
    const ELB = {
      idle: [[1.5, 0, -1.3], [1.42, 0, 1.3]],
      cast: [[0.15, 0, 0], [0.5, 0, 0]],
      point: [[0.05, 0, 0], [0.3, 0, 0]],
      wave: [[0, 0, 0.9], [0.3, 0, 0]],
      kneel: [[0.6, 0, 0], [0.6, 0, 0]],
      sit: [[0.8, 0, 0], [0.8, 0, 0]]
    };
    // collar points (no scarf)
    const cl = mesh(G.cone(), std(0xd8d8d0), P.body, -0.06, 1.39, -0.12, 0.05, 0.09, 0.02);
    cl.rotation.z = 2.6; cl.rotation.x = 0.4;
    const cr = mesh(G.cone(), std(0xd8d8d0), P.body, 0.06, 1.39, -0.12, 0.05, 0.09, 0.02);
    cr.rotation.z = -2.6; cr.rotation.x = 0.4;
    // arms crossed by default — proud & defensive
    const poses = {
      idle: { R: [0.22, 0.16], L: [0.3, -0.16], drop: 0, lean: -0.03, head: -0.07 },
      cast: { R: [1.5, -0.05], L: [0.3, -0.25], drop: 0, lean: -0.04, head: 0.02 }
    };
    P.noTalkArm = true;
    return { root: P.root, hand: P.handR, height: 1.75, poses, update(dt, t, st) {
      animHumanoid(P, st, dt, t, poses);
      const e = ELB[st.pose] || ELB.idle, k = kd(8, dt);
      for (let i = 0; i < 2; i++) {
        let tx = e[i][0], tz = e[i][2];
        if (i === 0 && st.talking && st.pose === 'idle') { // one hand gestures, the other stays folded
          tx = 1.3 + Math.sin(t * 2.6) * 0.3; tz = -0.35 + Math.sin(t * 1.7) * 0.15;
        }
        elbows[i].rotation.x += (tx - elbows[i].rotation.x) * k;
        elbows[i].rotation.z += (tz - elbows[i].rotation.z) * k;
      }
    } };
  }

  // ---- Elkan the Scribe: translucent ghost ----
  function buildElkan(opts) {
    const fade = canvasTex('elkanFade', 16, 128, (g, w, hh) => {
      const gr = g.createLinearGradient(0, 0, 0, hh);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)');
      gr.addColorStop(0.45, 'rgba(255,255,255,0.75)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, hh);
      g.fillStyle = 'rgba(0,40,60,0.25)';
      for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, hh);
    });
    const coat = lambert(0x7fcfdc, { e: 0x1c5e6c, op: 0.5, map: fade, tex: 'elkanFade', side: T.DoubleSide });
    const ghost = lambert(0xb0eef6, { e: 0x2e7684, op: 0.58 });
    const ghostDim = lambert(0x5fb4c4, { e: 0x1a5664, op: 0.66 });
    const rim = basic(0x7fe8ff, { op: 0.16, add: true, side: T.BackSide });
    const root = new T.Group();
    const lift = group(root);       // auto-lift when placed on the floor (see update)
    const body = group(lift);
    // coat: hips at y=0, top at 0.62; mist below
    const prof = [[0.05, -1.05], [0.2, -0.85], [0.3, -0.5], [0.33, -0.15], [0.3, 0.1], [0.27, 0.32], [0.3, 0.52], [0.22, 0.6], [0.07, 0.64], [0, 0.65]];
    const coatGeo = lathe('elkan', prof, 20);
    mesh(coatGeo, coat, body);
    const shellCoat = mesh(coatGeo, rim, body, 0, 0, 0, 1.08, 1.0, 1.08);
    shellCoat.renderOrder = 2;
    // lapels / scholar collar
    const lap = mesh(G.cone(), ghostDim, body, 0, 0.5, -0.18, 0.18, 0.28, 0.06);
    lap.rotation.x = Math.PI;
    const headPivot = group(body, 0, 0.68, 0);
    const head = group(headPivot, 0, 0.14, 0);
    const R = 0.14;
    mesh(G.sph(), ghost, head, 0, 0, 0, R, R * 1.08, R);
    const shellHead = mesh(G.sph(), rim, head, 0, 0, 0, R * 1.18, R * 1.25, R * 1.18);
    shellHead.renderOrder = 2;
    // scraggly hair tufts & long pointed beard
    const tuftL = mesh(G.cone(), ghostDim, head, -R * 0.82, R * 0.35, R * 0.3, R * 0.22, R * 0.6, R * 0.22);
    tuftL.rotation.z = 0.9;
    const tuftR = mesh(G.cone(), ghostDim, head, R * 0.82, R * 0.35, R * 0.3, R * 0.22, R * 0.6, R * 0.22);
    tuftR.rotation.z = -0.9;
    mesh(G.cylOpen(), ghostDim, head, 0, R * 0.95, R * 0.05, R * 0.75, R * 0.25, R * 0.75); // scholar's cap band
    mesh(G.cyl(), ghostDim, head, 0, R * 1.12, R * 0.05, R * 0.72, R * 0.12, R * 0.72);
    const beard = mesh(G.cone(), ghostDim, head, 0, -R * 1.25, -R * 0.45, R * 0.5, R * 1.3, R * 0.35);
    beard.rotation.x = Math.PI + 0.25;
    // eyes, brows (grumpy), nose
    const eyeM = basic(0x1d5a68, { op: 0.9 });
    const eL = mesh(G.sphLo(), eyeM, head, -R * 0.33, R * 0.08, -R * 0.88, R * 0.1, R * 0.12, R * 0.06);
    const eR = mesh(G.sphLo(), eyeM, head, R * 0.33, R * 0.08, -R * 0.88, R * 0.1, R * 0.12, R * 0.06);
    eL.userData.sy = eL.scale.y; eR.userData.sy = eR.scale.y;
    const bL = mesh(G.box(), ghostDim, head, -R * 0.33, R * 0.34, -R * 0.88, R * 0.34, R * 0.08, R * 0.08);
    const bR = mesh(G.box(), ghostDim, head, R * 0.33, R * 0.34, -R * 0.88, R * 0.34, R * 0.08, R * 0.08);
    bL.rotation.z = -0.3; bR.rotation.z = 0.3;
    mesh(G.cone(), ghost, head, 0, -R * 0.1, -R * 1.02, R * 0.12, R * 0.35, R * 0.12).rotation.x = -Math.PI / 2 + 0.3;
    const mouth = mesh(G.box(), eyeM, head, 0, -R * 0.45, -R * 0.88, R * 0.28, R * 0.05, R * 0.05);
    mouth.userData.sy = mouth.scale.y;
    // spectacles on a chain
    const metal = basic(0xd8fbff, { op: 0.85 });
    mesh(G.torus(1, 0.12), metal, head, -R * 0.33, R * 0.06, -R * 0.97, R * 0.2);
    mesh(G.torus(1, 0.12), metal, head, R * 0.33, R * 0.06, -R * 0.97, R * 0.2);
    const chainG = mesh(G.cyl(), metal, head, R * 0.62, -R * 0.75, -R * 0.72, R * 0.025, R * 1.6, R * 0.025);
    chainG.rotation.z = 0.18;
    // arms (sleeves) + quill
    function arm(side) {
      const piv = group(body, side * 0.27, 0.54, 0);
      const sg = geo('elkanSleeve', () => { const g = new T.CylinderGeometry(0.05, 0.1, 0.48, 10, 1, true); g.translate(0, -0.24, 0); return g; });
      mesh(sg, ghost, piv);
      const hand = group(piv, 0, -0.5, 0);
      mesh(G.sph(), ghost, hand, 0, 0, 0, 0.045, 0.055, 0.045);
      return { piv, hand };
    }
    const aR = arm(1), aL = arm(-1);
    const quill = group(aR.hand, 0, 0, -0.02);
    quill.rotation.x = -0.9;
    const feather = mesh(G.sph(), lambert(0xffffff, { e: 0x9fe8f0, op: 0.8 }), quill, 0, 0.14, 0, 0.025, 0.14, 0.008);
    feather.rotation.z = 0.15;
    mesh(G.cyl(), metal, quill, 0, -0.02, 0, 0.004, 0.08, 0.004);
    // book under the left arm
    mesh(G.box(), ghostDim, aL.hand, 0.05, 0.05, 0, 0.05, 0.22, 0.16);
    // mist wisps
    const mist = [];
    const mm = glowMat('#7fe0f0', 0.28);
    for (let i = 0; i < 4; i++) mist.push(sprite(mm, 0.6 - i * 0.08, 0, -0.55 - i * 0.18, 0, body));
    sprite(glowMat('#7fe8ff', 0.18), 1.6, 0, 0.25, 0, body);
    const P = { root, body, headPivot, head, armR: aR.piv, armL: aL.piv, eyes: [eL, eR], mouth };
    const poses = {
      idle: { R: [0.55, -0.25], L: [0.65, 0.35], drop: 0, lean: 0, head: 0 },
      cast: { R: [1.4, -0.05], L: [0.65, 0.35], drop: 0, lean: 0, head: 0 },
      point: { R: [1.62, -0.15], L: [0.65, 0.35], drop: 0, lean: 0, head: 0 },
      wave: { R: [0.15, 2.6], L: [0.65, 0.35], wave: true, drop: 0, lean: 0, head: 0 },
      kneel: { R: [0.75, 0.2], L: [0.65, 0.35], drop: 0.3, lean: 0.3, head: 0.3 }
    };
    let liftY = 1.25;
    const impl = { root, hand: aR.hand, height: 0.98, poses, update(dt, t, st) {
      // CONTRACT-NOTE: the ghost's origin is the hip/mist line. Placed at the 'elkan' anchor (y 1.3) he
      // floats correctly; if placed on the floor (y < 0.6) he lifts himself by 1.25 m.
      const want = root.position.y < 0.6 ? 1.25 : 0;
      liftY = want;
      lift.position.y = liftY + Math.sin(t * 1.3 + st.phase) * 0.06;
      P.baseY = 0;
      animHumanoid(P, st, dt, t, poses);
      body.rotation.z = Math.sin(t * 0.8 + st.phase) * 0.04;
      for (let i = 0; i < mist.length; i++) {
        const s = mist[i], a = t * (0.7 + i * 0.2) + i * 1.7;
        s.position.x = Math.sin(a) * 0.08;
        s.position.z = Math.cos(a * 0.8) * 0.06;
        const sc = (0.62 - i * 0.08) * (1 + Math.sin(a * 1.3) * 0.12);
        s.scale.set(sc, sc * 1.25, sc);
      }
    } };
    Object.defineProperty(impl, 'heightNow', { get: () => 0.98 + lift.position.y });
    return impl;
  }

  // ---- Sela Morrow: the villain ----
  function buildMorrow(opts) {
    const skin = std(0xe6d8de, { r: 0.55, ei: 0.12 });
    const coatMap = robeTex('morrow', { base: 0x261037, trim: 0x4a1f6e, seam: 0x12081c, seamW: 6, bandH: 5, folds: 18 });
    const coat = std(0xffffff, { map: coatMap, tex: 'morrow', r: 0.85, e: 0x2a0f45, ei: 0.25 });
    const coatSolid = std(0x2a1240, { r: 0.85, e: 0x2a0f45, ei: 0.2, side: T.DoubleSide });
    const hair = std(0x15101a, { r: 0.6, ei: 0.03 });
    const white = std(0xf2eef6, { r: 0.5, ei: 0.25 });
    const iron = std(0x24202c, { r: 0.45, m: 0.75 });
    const P = humanoid({
      key: 'morrow', profile: adultProfile(1.5, 0.46, 0.21, 0.24, 0.24), jag: 0.16, robeMat: coat, sleeveMat: coatSolid,
      skinMat: skin, shoulderY: 1.5, shoulderX: 0.24, neckH: 0.09, headR: 0.13, armLen: 0.64, sleeve: [0.06, 0.12],
      browMat: hair, browTilt: 0.25, eyeMat: std(0x2a0a3a, { r: 0.2, e: 0x7a2ac8, ei: 0.6 }), headScale: [0.92, 1.1, 0.98], ears: false
    });
    const R = P.R, h = P.head;
    // dark hair framing the face, with a white streak
    mesh(G.sph(), hair, h, 0, R * 0.32, R * 0.12, R * 1.04, R * 0.82, R * 1.04);
    mesh(G.sph(), hair, h, -R * 0.78, -R * 0.4, -R * 0.2, R * 0.28, R * 0.85, R * 0.4);
    mesh(G.sph(), hair, h, R * 0.78, -R * 0.4, -R * 0.2, R * 0.28, R * 0.85, R * 0.4);
    const streak = mesh(G.sph(), white, h, -R * 0.42, R * 0.6, -R * 0.62, R * 0.3, R * 0.26, R * 0.32);
    streak.rotation.z = 0.5;
    mesh(G.sph(), white, h, -R * 0.82, -R * 0.2, -R * 0.36, R * 0.12, R * 0.6, R * 0.12);
    // dark lips
    P.mouth.material = std(0x4a1a3a, { ei: 0.05 });
    // hood (sphere cap tilted back so the opening faces forward) + point + cape
    const hood = mesh(geo('hoodCap', () => new T.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.7)), coatSolid, h,
      0, R * 0.05, R * 0.25, R * 1.45, R * 1.55, R * 1.45);
    hood.rotation.x = 0.78;
    const tip = mesh(G.cone(), coatSolid, h, 0, R * 0.9, R * 1.45, R * 0.5, R * 1.2, R * 0.5);
    tip.rotation.x = 2.2;
    mesh(lathe('morrowCape', [[0.34, 1.12], [0.32, 1.3], [0.27, 1.48], [0.18, 1.58], [0.1, 1.62], [0.0, 1.63]], 16), coatSolid, P.body);
    // violet clasp
    mesh(G.sph(), basic(0xc58bff), P.body, 0, 1.5, -0.2, 0.03);
    // cracked lantern on a chain in the left hand
    const crack = canvasTex('crackGlass', 64, 64, (g, w, hh) => {
      g.fillStyle = '#b06cff'; g.fillRect(0, 0, w, hh);
      const gr = g.createRadialGradient(32, 34, 2, 32, 34, 36);
      gr.addColorStop(0, 'rgba(255,240,255,0.95)'); gr.addColorStop(1, 'rgba(80,20,140,0.6)');
      g.fillStyle = gr; g.fillRect(0, 0, w, hh);
      g.strokeStyle = '#1a0628'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(20, 0); g.lineTo(28, 18); g.lineTo(22, 30); g.lineTo(34, 46); g.lineTo(30, 64);
      g.moveTo(28, 18); g.lineTo(44, 24); g.lineTo(52, 12); g.moveTo(34, 46); g.lineTo(48, 52); g.stroke();
    });
    const lantern = group(P.handL);
    const lan = group(lantern, 0, -0.02, 0);
    mesh(G.cyl(), iron, lan, 0, -0.12, 0, 0.006, 0.24, 0.006);
    const body2 = group(lan, 0, -0.36, 0);
    mesh(G.cylOpen(), basic(0xffffff, { map: crack, tex: 'crackGlass', side: T.DoubleSide }), body2, 0, 0, 0, 0.075, 0.18, 0.075);
    mesh(G.sph(), basic(0xf0d8ff), body2, 0, 0, 0, 0.035);
    mesh(G.cone6(), iron, body2, 0, 0.14, 0, 0.1, 0.1, 0.1);
    mesh(G.torus(1, 0.25), iron, body2, 0, 0.21, 0, 0.03).rotation.x = Math.PI / 2;
    mesh(G.cyl(), iron, body2, 0, -0.105, 0, 0.09, 0.03, 0.09);
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3 + 0.4;
      mesh(G.box(), iron, body2, Math.sin(a) * 0.078, 0, Math.cos(a) * 0.078, 0.014, 0.19, 0.014);
    }
    const lglow = sprite(glowMat('#b06cff', 0.85), 0.75, 0, 0, 0, body2);
    // motes being drawn into the lantern
    const motes = [];
    const moteM = glowMat('#d9b4ff', 0.9);
    for (let i = 0; i < 4; i++) motes.push(sprite(moteM, 0.07, 0, 0, 0, body2));
    // aura behind her
    const aura = sprite(glowMat('#7a3ac8', 0.32), 2.8, 0, 1.15, 0.15, P.body);
    const poses = {
      idle: { R: [0.1, 0.1], L: [0.35, -0.3], drop: 0, lean: 0, head: 0.05 },
      cast: { R: [1.5, -0.05], L: [0.5, -0.4], drop: 0, lean: -0.08, head: 0 },
      point: { R: [1.62, -0.18], L: [0.35, -0.3], drop: 0, lean: -0.03, head: 0 },
      kneel: { R: [0.85, 0.25], L: [0.55, -0.35], drop: 0.45, lean: 0.3, head: 0.4 }
    };
    return { root: P.root, hand: P.handR, height: 1.9, poses, update(dt, t, st) {
      animHumanoid(P, st, dt, t, poses);
      uprightInHand(lantern, P.armL, Math.sin(t * 1.4) * 0.12, Math.sin(t * 1.1 + 1) * 0.08);
      const pulse = 1 + Math.sin(t * 3.3) * 0.12 + Math.sin(t * 7.1) * 0.05;
      lglow.scale.setScalar(0.75 * pulse * (1 + st.flash * 0.6));
      aura.scale.setScalar(2.8 + Math.sin(t * 0.9) * 0.2 + st.flash * 0.8);
      for (let i = 0; i < motes.length; i++) {
        const k = ((t * 0.45 + i / motes.length) % 1);
        const a = i * 1.9 + t * 0.6, r = 0.55 * (1 - k);
        motes[i].position.set(Math.cos(a) * r, (1 - k) * 0.25, Math.sin(a) * r);
        motes[i].scale.setScalar(0.03 + 0.06 * k);
      }
      if (st.flash > 0) st.flash = Math.max(0, st.flash - dt * 3);
    } };
  }

  // ---- generic students (12 variants) ----
  const SKINS = [0xf1cba8, 0xd9a47c, 0xb57a52, 0x8a5634, 0x5e3a22, 0xe8b894];
  const HAIRS = [0x1a120e, 0x5a3418, 0xc8962e, 0x8a2e12, 0x2a2420, 0xd0a040, 0x3a2414];
  const ROBES = [0x16264a, 0x7a3a16, 0x1e4a2a, 0x3c4450, 0x4a1e3e, 0x5a1a1a];
  const TRIMS = [0xc8763a, 0xe0c070, 0xc8763a, 0x8aa0c0, 0xd0a060, 0xd8b050];
  function buildStudent(opts) {
    const v = ((opts && opts.variant) | 0) % 12;
    const vv = v < 0 ? v + 12 : v;
    const skinHex = SKINS[(vv * 5) % SKINS.length];
    const hairHex = HAIRS[(vv * 3 + 1) % HAIRS.length];
    const robeHex = ROBES[vv % ROBES.length];
    const trimHex = TRIMS[vv % TRIMS.length];
    const style = (vv * 7) % 5;                // hair style
    const tall = 1 + ((vv * 13) % 5 - 2) * 0.025;
    const skin = std(skinHex, { r: 0.6 });
    const map = robeTex('stu' + robeHex, { base: robeHex, trim: trimHex, seam: 0xe8e2d0, seamW: 6, bandH: 7 });
    const robe = std(0xffffff, { map, tex: 'stu' + robeHex, r: 0.8, e: robeHex, ei: 0.1 });
    const sleeve = std(robeHex, { r: 0.8 });
    const hair = std(hairHex, { r: 0.8, ei: 0.04 });
    const P = humanoid({
      key: 'student', profile: adultProfile(1.12, 0.31, 0.18, 0.19, 0.19), robeMat: robe, sleeveMat: sleeve, skinMat: skin,
      shoulderY: 1.12, shoulderX: 0.19, neckH: 0.06, headR: 0.14, armLen: 0.46, sleeve: [0.05, 0.075],
      browMat: hair, eyeS: 0.14, browTilt: (vv % 3 - 1) * 0.1, lite: true
    });
    const R = P.R, h = P.head;
    mesh(G.sph(), hair, h, 0, R * 0.25, R * 0.12, R * 1.07, R * 0.86, R * 1.07);
    if (style === 1) { // long hair
      mesh(G.sph(), hair, h, 0, -R * 0.35, R * 0.45, R * 0.95, R * 1.2, R * 0.6);
    } else if (style === 2) { // ponytail
      const pt = mesh(G.sph(), hair, h, 0, R * 0.2, R * 1.15, R * 0.3, R * 0.75, R * 0.3);
      pt.rotation.x = 0.5;
    } else if (style === 3) { // bun
      mesh(G.sph(), hair, h, 0, R * 1.0, R * 0.3, R * 0.42);
    } else if (style === 4) { // spiky fringe
      for (let i = -1; i <= 1; i++) {
        const c = mesh(G.cone(), hair, h, i * R * 0.4, R * 0.95, -R * 0.2, R * 0.2, R * 0.45, R * 0.2);
        c.rotation.x = -0.5; c.rotation.z = -i * 0.4;
      }
    } else { // short side fringe
      mesh(G.sph(), hair, h, R * 0.3, R * 0.6, -R * 0.6, R * 0.6, R * 0.25, R * 0.4);
    }
    // scarf/tie in trim colour
    mesh(G.torus(1, 0.35), std(trimHex, { r: 0.7 }), P.body, 0, 1.13, 0, 0.1, 0.1, 0.1).rotation.x = Math.PI / 2;
    mesh(G.box(), std(trimHex, { r: 0.7 }), P.body, 0, 0.98, -0.155, 0.04, 0.2, 0.015).rotation.x = -0.15;
    P.root.scale.setScalar(tall);
    const poses = {};
    return { root: P.root, hand: P.handR, height: 1.45 * tall, poses, update(dt, t, st) { animHumanoid(P, st, dt, t, poses); } };
  }

  // ---- Pebble the gargoyle ----
  function stoneTex() {
    return canvasTex('stone', 128, 128, (g, w, hh) => {
      g.fillStyle = '#8b8f96'; g.fillRect(0, 0, w, hh);
      for (let i = 0; i < 900; i++) {
        const x = (i * 73) % w, y = (i * 151 + (i >> 3) * 17) % hh, l = 100 + ((i * 37) % 70);
        g.fillStyle = 'rgba(' + l + ',' + l + ',' + (l + 6) + ',0.5)';
        g.fillRect(x, y, 2, 2);
      }
      g.strokeStyle = 'rgba(40,42,48,0.55)'; g.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        let x = (i * 41) % w, y = (i * 29) % hh;
        g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += ((i + k) % 3 - 1) * 9 + 4; y += 8; g.lineTo(x, y); }
        g.stroke();
      }
    });
  }
  function buildPebble(opts) {
    const stone = std(0xffffff, { map: stoneTex(), tex: 'stone', r: 0.95, e: 0x5a5e66, ei: 0.12 });
    const stoneD = std(0x6c7078, { r: 0.95, ei: 0.1, flat: true });
    const moss = std(0x4c7a2e, { r: 1, ei: 0.08 });
    const eyeM = basic(0xffc040);
    const root = new T.Group();
    const body = group(root);
    // haunches + hind feet
    mesh(G.sph(), stone, body, -0.2, 0.26, 0.1, 0.22, 0.26, 0.3);
    mesh(G.sph(), stone, body, 0.2, 0.26, 0.1, 0.22, 0.26, 0.3);
    mesh(G.sph(), stoneD, body, -0.24, 0.05, -0.08, 0.1, 0.06, 0.16);
    mesh(G.sph(), stoneD, body, 0.24, 0.05, -0.08, 0.1, 0.06, 0.16);
    // torso leaning forward (chest puffed — he's vain)
    const torso = group(body, 0, 0.58, -0.04);
    torso.rotation.x = -0.22;
    mesh(G.sph(), stone, torso, 0, 0, 0, 0.28, 0.36, 0.25);
    const chest = mesh(G.sph(), stone, torso, 0, 0.04, -0.12, 0.22, 0.26, 0.16);
    // moss patches
    mesh(G.sphLo(), moss, torso, 0.18, 0.18, 0.08, 0.1, 0.05, 0.1);
    mesh(G.sphLo(), moss, body, -0.3, 0.38, 0.18, 0.09, 0.05, 0.1);
    // front legs (arms) — planted
    function leg(side) {
      const piv = group(body, side * 0.19, 0.74, -0.14);
      const lg = geo('pebLeg', () => { const g = new T.CylinderGeometry(0.075, 0.06, 0.62, 8); g.translate(0, -0.31, 0); return g; });
      mesh(lg, stone, piv);
      const paw = group(piv, 0, -0.64, 0);
      mesh(G.sph(), stoneD, paw, 0, 0, -0.02, 0.085, 0.06, 0.1);
      for (let i = -1; i <= 1; i++) {
        const c = mesh(G.cone(), std(0x4a4d54, { r: 0.6 }), paw, i * 0.04, -0.01, -0.11, 0.018, 0.06, 0.018);
        c.rotation.x = -Math.PI / 2;
      }
      return piv;
    }
    const armR = leg(1), armL = leg(-1);
    // head
    const headPivot = group(body, 0, 0.92, -0.18);
    const head = group(headPivot, 0, 0.1, 0);
    mesh(G.sph(), stone, head, 0, 0, 0, 0.2, 0.18, 0.19);
    const snout = mesh(G.sph(), stone, head, 0, -0.03, -0.16, 0.12, 0.08, 0.1);
    mesh(G.sphLo(), std(0x3a3c42), head, -0.04, -0.01, -0.255, 0.018);
    mesh(G.sphLo(), std(0x3a3c42), head, 0.04, -0.01, -0.255, 0.018);
    const jawPiv = group(head, 0, -0.07, -0.02);
    mesh(G.sph(), stoneD, jawPiv, 0, -0.02, -0.11, 0.11, 0.045, 0.1);
    const fangG = G.cone();
    const fM = std(0xe8e2d0, { r: 0.5 });
    const f1 = mesh(fangG, fM, jawPiv, -0.06, 0.02, -0.17, 0.012, 0.04, 0.012);
    const f2 = mesh(fangG, fM, jawPiv, 0.06, 0.02, -0.17, 0.012, 0.04, 0.012);
    // brow ridge + glowing amber eyes
    const brL = mesh(G.sph(), stoneD, head, -0.075, 0.07, -0.15, 0.075, 0.03, 0.05);
    brL.rotation.z = -0.35;
    const brR = mesh(G.sph(), stoneD, head, 0.075, 0.075, -0.15, 0.075, 0.03, 0.05);
    brR.rotation.z = 0.5; // one brow raised: dramatic
    const eL = mesh(G.sphLo(), eyeM, head, -0.075, 0.025, -0.165, 0.035, 0.028, 0.02);
    const eR = mesh(G.sphLo(), eyeM, head, 0.075, 0.025, -0.165, 0.035, 0.028, 0.02);
    eL.userData.sy = eL.scale.y; eR.userData.sy = eR.scale.y;
    sprite(glowMat('#ffb22e', 0.7), 0.13, -0.075, 0.025, -0.18, head);
    sprite(glowMat('#ffb22e', 0.7), 0.13, 0.075, 0.025, -0.18, head);
    // horn nubs + pointed ears
    const hornM = std(0x5e6168, { r: 0.8, flat: true });
    const h1 = mesh(G.cone5(), hornM, head, -0.09, 0.17, 0.02, 0.035, 0.1, 0.035); h1.rotation.z = 0.3;
    const h2 = mesh(G.cone5(), hornM, head, 0.09, 0.17, 0.02, 0.035, 0.1, 0.035); h2.rotation.z = -0.3;
    const ear1 = mesh(G.cone(), stone, head, -0.19, 0.06, 0.04, 0.05, 0.14, 0.03); ear1.rotation.z = 1.0;
    const ear2 = mesh(G.cone(), stone, head, 0.19, 0.06, 0.04, 0.05, 0.14, 0.03); ear2.rotation.z = -1.0;
    mesh(G.sphLo(), moss, head, -0.06, 0.16, 0.08, 0.07, 0.03, 0.06);
    // bat-like stone wings
    const wingGeo = geo('pebWing', () => {
      const s = new T.Shape();
      s.moveTo(0, 0); s.lineTo(0.18, 0.28); s.lineTo(0.42, 0.42); s.lineTo(0.5, 0.18);
      s.quadraticCurveTo(0.4, 0.14, 0.36, 0.02); s.quadraticCurveTo(0.26, 0.0, 0.22, -0.1);
      s.quadraticCurveTo(0.12, -0.06, 0.06, -0.14); s.lineTo(0, 0);
      const g = new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
      g.translate(0, 0, -0.015);
      return g;
    });
    const wingM = std(0x5c6068, { r: 0.95, ei: 0.08, side: T.DoubleSide });
    const wR = group(torso, 0.1, 0.16, 0.14), wL = group(torso, -0.1, 0.16, 0.14);
    mesh(wingGeo, wingM, wR);
    const wlm = mesh(wingGeo, wingM, wL); wlm.scale.x = -1;
    wR.rotation.set(0.2, -0.7, 0.15); wL.rotation.set(0.2, 0.7, -0.15);
    // curled tail
    const tail = mesh(G.torus(0.16, 0.035, Math.PI * 1.5), stone, body, 0.08, 0.06, 0.42);
    tail.rotation.x = Math.PI / 2;
    const tipM = mesh(G.cone5(), hornM, body, 0.24, 0.06, 0.3, 0.05, 0.1, 0.03);
    tipM.rotation.z = -Math.PI / 2;
    const poses = {
      idle: { R: [0.42, 0.04], L: [0.42, -0.04] },
      cast: { R: [1.3, 0.1], L: [0.42, -0.04] },
      point: { R: [1.4, -0.1], L: [0.42, -0.04] },
      wave: { R: [0.4, 2.3], L: [0.42, -0.04], wave: true },
      kneel: { R: [0.9, 0.1], L: [0.9, -0.1], drop: 0.12 }
    };
    let pomp = 0;
    return { root, hand: armR.children[1], height: 1.2, poses, turnRate: 3, update(dt, t, st) {
      const pose = poses[st.pose] || poses.idle;
      const k = kd(7, dt);
      let rx = pose.R[0], rz = pose.R[1];
      if (pose.wave) rz += Math.sin(t * 8) * 0.3;
      armR.rotation.x += (rx - armR.rotation.x) * k; armR.rotation.z += (rz - armR.rotation.z) * k;
      armL.rotation.x += (pose.L[0] - armL.rotation.x) * k; armL.rotation.z += (pose.L[1] - armL.rotation.z) * k;
      st.drop += ((pose.drop || 0) - st.drop) * k;
      body.position.y = -st.drop;
      // breathing (stone creaks slowly) + vain chest puff when talking
      pomp += ((st.talking ? 1 : 0) - pomp) * kd(3, dt);
      const br = Math.sin(t * 1.2 + st.phase);
      torso.scale.set(1 + br * 0.012 + pomp * 0.05, 1 + br * 0.015 + pomp * 0.04, 1 + pomp * 0.05);
      torso.rotation.x = -0.22 - pomp * 0.12;
      headPivot.rotation.x = st.talking ? 0.15 + Math.sin(t * 5) * 0.08 : Math.sin(t * 0.4) * 0.05;
      headPivot.rotation.y = st.talking ? Math.sin(t * 1.6) * 0.3 : Math.sin(t * 0.3 + st.phase) * 0.2;
      headPivot.rotation.z = st.talking ? Math.sin(t * 2.2) * 0.08 : 0;
      jawPiv.rotation.x = st.talking ? 0.05 + Math.abs(Math.sin(t * 10.5)) * 0.45 : 0.02;
      const flap = st.talking ? Math.sin(t * 4) * 0.25 : Math.sin(t * 0.6) * 0.05;
      wR.rotation.y = -0.7 + flap; wL.rotation.y = 0.7 - flap;
      tail.rotation.z = Math.sin(t * 0.9) * 0.15;
      st.blinkT -= dt;
      if (st.blinkT < 0) { st.blinkT = 3 + Math.random() * 3; st.blinking = 0.15; }
      if (st.blinking > 0) st.blinking -= dt;
      const e = st.blinking > 0 ? 0.15 : 1;
      eL.scale.y = eL.userData.sy * e; eR.scale.y = eR.userData.sy * e;
    } };
  }

  // ---- Shade (enemy) — smoky creature of the Gloom, deliberately NOT hooded/robed ----
  function buildShade(opts) {
    // per-instance materials so core may fade/flash one shade without touching the others
    const core = new T.MeshLambertMaterial({ color: lin(0x0a0712), emissive: lin(0x0c0614), transparent: true, opacity: 0.92 });
    const puff = new T.MeshLambertMaterial({ color: lin(0x100a18), emissive: lin(0x0e0818), transparent: true, opacity: 0.66, depthWrite: false });
    const wispM = new T.MeshBasicMaterial({ color: lin(0x120a1c), transparent: true, opacity: 0.6, depthWrite: false });
    const eyeM = basic(0xd9a8ff);
    const root = new T.Group();
    const lift = group(root);
    const body = group(lift);
    mesh(G.sph(), core, body, 0, 0, 0, 0.42, 0.38, 0.36);
    const puffs = [];
    const pp = [[-0.32, 0.12, 0.05, 0.24], [0.32, 0.12, 0.05, 0.24], [0, 0.3, 0.08, 0.26], [-0.18, -0.22, 0.05, 0.22],
      [0.18, -0.22, 0.05, 0.22], [0, 0.05, 0.3, 0.27]];
    pp.forEach((p, i) => { const m = mesh(G.sphLo(), puff, body, p[0], p[1], p[2], p[3]); m.userData.base = p; m.userData.i = i; puffs.push(m); });
    // smoky crown tufts (flame-like, not a hood)
    const tufts = [];
    [[-0.2, 0.42, 0.1, 0.4], [0.02, 0.5, 0.05, 0], [0.22, 0.42, 0.1, -0.4]].forEach(p => {
      const c = mesh(G.cone5(), wispM, body, p[0], p[1], p[2], 0.09, 0.3, 0.09);
      c.rotation.z = p[3]; tufts.push(c);
    });
    // tendril arms
    const arms = [];
    [-1, 1].forEach(s => {
      const piv = group(body, s * 0.36, 0.0, -0.05);
      const c = mesh(G.cone5(), wispM, piv, s * 0.22, -0.05, 0, 0.08, 0.5, 0.08);
      c.rotation.z = s * 1.9;
      arms.push(piv);
    });
    // trailing ragged wisps
    const wisps = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const w = mesh(G.cone5(), wispM, body, Math.sin(a) * 0.22, -0.5, Math.cos(a) * 0.18, 0.09, 0.6 + (i % 3) * 0.15, 0.09);
      w.rotation.x = Math.PI; w.userData.a = a; wisps.push(w);
    }
    // eyes
    const eL = mesh(G.sphLo(), eyeM, body, -0.13, 0.08, -0.33, 0.055, 0.035, 0.03);
    const eR = mesh(G.sphLo(), eyeM, body, 0.13, 0.08, -0.33, 0.055, 0.035, 0.03);
    eL.rotation.z = -0.35; eR.rotation.z = 0.35;
    const g1 = sprite(glowMat('#b06cff', 0.9), 0.22, -0.13, 0.08, -0.36, body);
    const g2 = sprite(glowMat('#b06cff', 0.9), 0.22, 0.13, 0.08, -0.36, body);
    // smoke sprites (normal blending) + faint violet heart glow
    const smoke = [];
    const sm = smokeMat(0.55);
    for (let i = 0; i < 3; i++) smoke.push(sprite(sm, 0.9, 0, 0, 0, body));
    sprite(glowMat('#5a1aa0', 0.35), 0.9, 0, 0, 0.1, body);
    let lifted = 1.4;
    const flashCol = lin(0x9a6cff), baseEm = lin(0x0c0614);
    return { root, height: 0.65, turnRate: 8, update(dt, t, st) {
      // CONTRACT-NOTE: shade origin = body centre (core places it at hover height ~1.4–1.5).
      // If placed on the floor (y < 0.6) it lifts itself by 1.4 m.
      const want = root.position.y < 0.6 ? 1.4 : 0;
      lifted = want;
      lift.position.y = lifted + Math.sin(t * 2.1 + st.phase) * 0.08;
      body.rotation.z = Math.sin(t * 1.3 + st.phase) * 0.08;
      const br = 1 + Math.sin(t * 3 + st.phase) * 0.05;
      body.scale.set(br, 2 - br, br);
      for (let i = 0; i < puffs.length; i++) {
        const m = puffs[i], b = m.userData.base, a = t * 2.4 + i * 1.3 + st.phase;
        m.position.set(b[0] + Math.sin(a) * 0.04, b[1] + Math.cos(a * 1.2) * 0.04, b[2] + Math.sin(a * 0.7) * 0.03);
        m.scale.setScalar(b[3] * (1 + Math.sin(a * 1.6) * 0.15));
      }
      for (let i = 0; i < wisps.length; i++) {
        const w = wisps[i];
        w.rotation.x = Math.PI + Math.sin(t * 3 + i) * 0.35;
        w.rotation.z = Math.cos(t * 2.4 + i * 1.7) * 0.3;
      }
      for (let i = 0; i < tufts.length; i++) tufts[i].scale.y = 0.3 * (1 + Math.sin(t * 6 + i * 2) * 0.25);
      arms[0].rotation.z = Math.sin(t * 2.6 + st.phase) * 0.4;
      arms[1].rotation.z = -Math.sin(t * 2.6 + st.phase + 1) * 0.4;
      arms[0].rotation.y = arms[1].rotation.y = st.pose === 'cast' ? 0.8 : 0;
      for (let i = 0; i < smoke.length; i++) {
        const a = t * 0.8 + i * 2.1;
        smoke[i].position.set(Math.sin(a) * 0.18, Math.cos(a * 1.3) * 0.12, Math.cos(a) * 0.12 + 0.05);
        smoke[i].scale.setScalar(0.85 + Math.sin(a * 1.7) * 0.15);
      }
      const ep = 0.22 * (1 + Math.sin(t * 5) * 0.12 + st.flash);
      g1.scale.setScalar(ep); g2.scale.setScalar(ep);
      if (st.flash > 0) {
        st.flash = Math.max(0, st.flash - dt * 4);
        core.emissive.copy(baseEm).lerp(flashCol, st.flash);
      }
    } };
  }

  // ---- Training dummy ----
  function buildDummy(opts) {
    const wood = std(0x6e4526, { r: 0.85 });
    const straw = canvasTex('straw', 64, 128, (g, w, hh) => {
      g.fillStyle = '#c9a85a'; g.fillRect(0, 0, w, hh);
      for (let i = 0; i < 160; i++) {
        const x = (i * 37) % w, y = (i * 53) % hh, l = 150 + (i * 31) % 80;
        g.strokeStyle = 'rgba(' + (l + 40) + ',' + (l + 10) + ',' + (l - 60) + ',0.7)';
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + ((i % 5) - 2), y + 10); g.stroke();
      }
      g.fillStyle = 'rgba(90,60,30,0.35)';
      for (let y = 0; y < hh; y += 16) g.fillRect(0, y, w, 2);
    });
    const sack = std(0xffffff, { map: straw, tex: 'straw', r: 0.95, e: 0x6a5020, ei: 0.12 });
    const rope = std(0x8a6a3a, { r: 0.9 });
    const face = canvasTex('dummyFace', 128, 128, (g) => {
      g.fillStyle = '#d8c08a'; g.fillRect(0, 0, 128, 128);
      const rings = ['#b8322a', '#f2e6c8', '#b8322a', '#f2e6c8', '#b8322a'];
      rings.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(64, 64, 60 - i * 12, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#2a1a10';
      g.fillRect(34, 40, 14, 5); g.fillRect(80, 40, 14, 5); // painted cross-stitch eyes
      g.fillRect(38, 36, 5, 14); g.fillRect(85, 36, 5, 14);
      g.lineWidth = 4; g.strokeStyle = '#2a1a10';
      g.beginPath(); g.arc(64, 80, 18, 0.2, Math.PI - 0.2); g.stroke();
    });
    const root = new T.Group();
    const wob = group(root);
    // base: crossed feet
    mesh(G.box(), wood, root, 0, 0.05, 0, 0.7, 0.1, 0.12);
    mesh(G.box(), wood, root, 0, 0.05, 0, 0.12, 0.1, 0.7);
    mesh(G.cyl(), wood, wob, 0, 0.85, 0, 0.06, 1.7, 0.06);
    // straw sack body
    mesh(lathe('dummySack', [[0.05, 0.55], [0.22, 0.62], [0.27, 0.8], [0.27, 1.05], [0.24, 1.25], [0.12, 1.35], [0.04, 1.37]], 14), sack, wob);
    mesh(G.torus(1, 0.05), rope, wob, 0, 0.68, 0, 0.245, 0.245, 0.245).rotation.x = Math.PI / 2;
    mesh(G.torus(1, 0.05), rope, wob, 0, 1.22, 0, 0.245, 0.245, 0.245).rotation.x = Math.PI / 2;
    // crossbar arms with straw tufts
    mesh(G.box(), wood, wob, 0, 1.18, 0, 0.95, 0.07, 0.07);
    const tuftM = std(0xd8b862, { r: 1 });
    const t1 = mesh(G.cone(), tuftM, wob, 0.52, 1.18, 0, 0.07, 0.14, 0.07); t1.rotation.z = -Math.PI / 2;
    const t2 = mesh(G.cone(), tuftM, wob, -0.52, 1.18, 0, 0.07, 0.14, 0.07); t2.rotation.z = Math.PI / 2;
    // head sack with painted target face
    const head = group(wob, 0, 1.55, 0);
    mesh(G.sph(), sack, head, 0, 0, 0, 0.2, 0.21, 0.19);
    mesh(G.circle(), std(0xffffff, { map: face, tex: 'dummyFace', r: 0.9, e: 0x402010, ei: 0.1 }), head, 0, 0, -0.192, 0.15)
      .rotation.y = Math.PI;
    mesh(G.cone(), tuftM, head, 0, 0.24, 0, 0.06, 0.1, 0.06);
    let wobble = 0, wobDir = 1;
    const impl = { root, height: 1.78, update(dt, t, st) {
      if (st.flash > 0) { wobble = Math.min(1.2, wobble + st.flash); st.flash = 0; wobDir = Math.random() < 0.5 ? -1 : 1; }
      wobble *= Math.exp(-2.5 * dt);
      wob.rotation.x = Math.sin(t * 14) * 0.25 * wobble;
      wob.rotation.z = Math.cos(t * 11) * 0.18 * wobble * wobDir;
      head.rotation.z = Math.sin(t * 18) * 0.2 * wobble;
    } };
    return impl;
  }

  // ---- Lantern shard prop ----
  function buildShard(opts) {
    const crystal = std(0xffc24a, { r: 0.18, m: 0.3, e: 0xff9a1e, ei: 0.85, flat: true });
    const crystal2 = std(0xffe08a, { r: 0.18, m: 0.2, e: 0xffb84a, ei: 0.9, flat: true });
    const root = new T.Group();
    const lift = group(root);
    const spin = group(lift);
    mesh(G.cone5(), crystal, spin, 0, 0.11, 0, 0.09, 0.26, 0.09);
    const bot = mesh(G.cone5(), crystal, spin, 0, -0.06, 0, 0.09, 0.1, 0.09);
    bot.rotation.x = Math.PI;
    const s1 = mesh(G.cone5(), crystal2, spin, 0.07, 0.0, 0.02, 0.04, 0.16, 0.04); s1.rotation.z = -0.7;
    const s2 = mesh(G.cone5(), crystal2, spin, -0.06, -0.02, -0.03, 0.035, 0.12, 0.035); s2.rotation.z = 0.8;
    const glow = sprite(glowMat('#ffbe4a', 0.85), 0.75, 0, 0.02, 0, lift);
    sprite(glowMat('#fff2c0', 0.9), 0.22, 0, 0.04, 0, lift);
    const sparks = [];
    const spm = glowMat('#ffe6a0', 1);
    for (let i = 0; i < 3; i++) sparks.push(sprite(spm, 0.06, 0, 0, 0, lift));
    let lifted = 0.9;
    return { root, height: 0.3, update(dt, t, st) {
      // CONTRACT-NOTE: shard origin = crystal centre (anchors give y≈0.9–1.2). On the floor it lifts 0.9 m.
      const want = root.position.y < 0.3 ? 0.9 : 0;
      lifted = want;
      lift.position.y = lifted + Math.sin(t * 2) * 0.05;
      spin.rotation.y = t * 1.2;
      spin.rotation.z = Math.sin(t * 0.9) * 0.15;
      glow.scale.setScalar(0.75 * (1 + Math.sin(t * 3.1) * 0.1 + st.flash * 0.8));
      if (st.flash > 0) st.flash = Math.max(0, st.flash - dt * 2);
      for (let i = 0; i < sparks.length; i++) {
        const a = t * (1.4 + i * 0.3) + i * 2.1;
        sparks[i].position.set(Math.cos(a) * 0.22, Math.sin(a * 1.7) * 0.12, Math.sin(a) * 0.22);
      }
    } };
  }

  // ---- player (no 3D needed) ----
  function buildPlayer() {
    return { root: new T.Group(), height: 1.7, update() { /* nothing */ } };
  }

  const BUILDERS = {
    pebble: buildPebble, orla: buildOrla, dov: buildDov, noa: buildNoa, tal: buildTal, elkan: buildElkan,
    morrow: buildMorrow, student: buildStudent, shade: buildShade, dummy: buildDummy, shard: buildShard,
    player: buildPlayer
  };

  // ---------------------------------------------------------------------------------------------
  // 5. Info
  // ---------------------------------------------------------------------------------------------
  const INFO = {
    pebble: { name: { he: 'פבל', en: 'Pebble' }, title: { he: 'גרגויל השער', en: 'Gargoyle of the Gate' }, color: '#a7b0ba' },
    orla: { name: { he: 'המנהלת אורלה טמסין', en: 'Headmistress Orla Tamsin' }, title: { he: 'מנהלת אקדמיית אלדרמור', en: 'Head of Eldermoor Academy' }, color: '#2f9aa6' },
    dov: { name: { he: 'פרופסור דב ארקין', en: 'Professor Dov Arkin' }, title: { he: 'מורה ללחשים', en: 'Charms Master' }, color: '#e0962a' },
    noa: { name: { he: 'נועה לוין', en: 'Noa Levin' }, title: { he: 'שנה ראשונה · ממציאה', en: 'First-year · Tinkerer' }, color: '#4fae62' },
    tik: { name: { he: 'טיק', en: 'Tik' }, title: { he: 'ינשוף מכני', en: 'Clockwork Owl' }, color: '#d4a84a' },
    tal: { name: { he: 'טל שקד', en: 'Tal Shaked' }, title: { he: 'שנה ראשונה', en: 'First-year' }, color: '#4f7fe0' },
    elkan: { name: { he: 'אלקן הסופר', en: 'Elkan the Scribe' }, title: { he: 'רוח הספרייה', en: 'Ghost of the Library' }, color: '#8fe3ee' },
    morrow: { name: { he: 'סֵלָה מורו', en: 'Sela Morrow' }, title: { he: 'שומרת הפנסים שגורשה', en: 'The Exiled Lantern Keeper' }, color: '#a46cff' },
    student: { name: { he: 'תלמיד', en: 'Student' }, title: { he: 'אקדמיית אלדרמור', en: 'Eldermoor Academy' }, color: '#c9a24a' },
    shade: { name: { he: 'צל', en: 'Shade' }, title: { he: 'יציר האופל', en: 'Creature of the Gloom' }, color: '#8a5ad0' },
    dummy: { name: { he: 'בובת אימון', en: 'Training Dummy' }, title: { he: 'כיתת הלחשים', en: 'Charms Classroom' }, color: '#c8a060' },
    shard: { name: { he: 'רסיס הפנס', en: 'Lantern Shard' }, title: { he: 'שבר מהפנס התשיעי', en: 'A piece of the Ninth Lantern' }, color: '#ffc24a' },
    narrator: { name: { he: '', en: '' }, title: { he: '', en: '' }, color: '#c9a24a' }
  };
  function info(id) {
    if (id === 'player') {
      const p = ELD.profile || {};
      const nm = p.name || ((ELD.lang === 'en') ? 'Ariel' : 'אריאל');
      return { name: { he: nm, en: nm }, title: { he: { m: 'תלמיד שנה ראשונה', f: 'תלמידת שנה ראשונה' }, en: 'First-year' }, color: '#e5b84a' };
    }
    if (id == null) return INFO.narrator;
    const i = INFO[id];
    if (i) return i;
    return { name: { he: String(id), en: String(id) }, title: { he: '', en: '' }, color: '#c9a24a' };
  }

  // ---------------------------------------------------------------------------------------------
  // 6. Portraits — 128×128 painted busts, cached dataURLs
  // ---------------------------------------------------------------------------------------------
  function rgba(hex, a) { return 'rgba(' + ((hex >> 16) & 255) + ',' + ((hex >> 8) & 255) + ',' + (hex & 255) + ',' + a + ')'; }
  function ell(g, x, y, rx, ry, fill, rot) {
    g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  }
  function bg(g, inner, outer) {
    const gr = g.createRadialGradient(64, 50, 6, 64, 64, 92);
    gr.addColorStop(0, css(inner)); gr.addColorStop(1, css(outer));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    // faint stars / dust
    g.fillStyle = 'rgba(255,240,200,0.18)';
    for (let i = 0; i < 18; i++) g.fillRect((i * 47) % 128, (i * 29 + 7) % 70, 1, 1);
  }
  function frame(g) {
    const vg = g.createRadialGradient(64, 64, 48, 64, 64, 92);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = vg; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 125, 125);
    g.strokeStyle = 'rgba(255,230,160,0.45)'; g.lineWidth = 1; g.strokeRect(5.5, 5.5, 117, 117);
  }
  function shoulders(g, base, o) {
    o = o || {};
    const w = o.w || 50, top = o.top || 92;
    const gr = g.createLinearGradient(0, top, 0, 128);
    gr.addColorStop(0, css(mix(base, 0xffffff, 0.12))); gr.addColorStop(1, css(mix(base, 0x000000, 0.35)));
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(64 - w - 14, 128);
    g.bezierCurveTo(64 - w - 10, top + 6, 64 - w + 10, top, 64, top - 2);
    g.bezierCurveTo(64 + w - 10, top, 64 + w + 10, top + 6, 64 + w + 14, 128);
    g.closePath(); g.fill();
    // folds
    g.strokeStyle = rgba(0x000000, 0.25); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(64 - w * 0.55, 108); g.quadraticCurveTo(64 - w * 0.5, 118, 64 - w * 0.6, 128);
    g.moveTo(64 + w * 0.55, 108); g.quadraticCurveTo(64 + w * 0.5, 118, 64 + w * 0.6, 128); g.stroke();
    if (o.seam != null) {
      g.fillStyle = css(o.seam);
      g.beginPath(); g.moveTo(56, top + 1); g.lineTo(72, top + 1); g.lineTo(68, 128); g.lineTo(60, 128); g.closePath(); g.fill();
    }
  }
  function neck(g, skin, w) {
    g.fillStyle = css(mix(skin, 0x000000, 0.18));
    g.fillRect(64 - (w || 9), 74, (w || 9) * 2, 22);
  }
  function face(g, o) {
    // o: skin, x=64, y=56, rx=24, ry=27, eye, iris, brow, browTilt, mouth, cheeks, nose
    const x = o.x || 64, y = o.y || 56, rx = o.rx || 23, ry = o.ry || 27;
    if (o.ears !== false) { ell(g, x - rx + 1, y + 3, 4.5, 7, css(mix(o.skin, 0x000000, 0.1))); ell(g, x + rx - 1, y + 3, 4.5, 7, css(mix(o.skin, 0x000000, 0.1))); }
    const gr = g.createRadialGradient(x - 7, y - 9, 3, x, y, rx * 1.25);
    gr.addColorStop(0, css(mix(o.skin, 0xffffff, 0.2))); gr.addColorStop(0.7, css(o.skin)); gr.addColorStop(1, css(mix(o.skin, 0x000000, 0.25)));
    ell(g, x, y, rx, ry, gr);
    const ey = y + (o.eyeDy || 1), ex = o.eyeX || 9;
    // eyes
    [-1, 1].forEach(s => {
      if (o.glowEye) {
        ell(g, x + s * ex, ey, 4.2, 3, o.glowEye);
        ell(g, x + s * ex, ey, 7, 5.5, rgba(0xffffff, 0.12));
      } else {
        ell(g, x + s * ex, ey, 4.6, 3.4, o.sclera || '#f6efe6');
        ell(g, x + s * ex, ey + 0.3, 2.9, 3.0, css(o.iris || 0x4a2e1a));
        ell(g, x + s * ex, ey + 0.3, 1.4, 1.5, '#120c08');
        ell(g, x + s * ex + 1, ey - 1, 0.9, 0.9, '#ffffff');
        g.strokeStyle = rgba(0x1a0e08, 0.8); g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(x + s * ex, ey, 4.8, 3.6, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      }
      // brow
      const bt = (o.browTilt || 0) * s;
      g.strokeStyle = css(o.brow || 0x2a1a10); g.lineWidth = o.browW || 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + s * (ex - 4.5), ey - 6 + bt * 3); g.lineTo(x + s * (ex + 4.5), ey - 7 - bt * 3); g.stroke();
    });
    // nose
    g.strokeStyle = rgba(mix(o.skin, 0x000000, 0.45), 0.7); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x + 1, ey + 3); g.quadraticCurveTo(x + 3, ey + 9, x - 1, ey + 10); g.stroke();
    // cheeks
    if (o.cheeks) { ell(g, x - 13, ey + 9, 4.5, 2.8, o.cheeks); ell(g, x + 13, ey + 9, 4.5, 2.8, o.cheeks); }
    // mouth
    g.strokeStyle = o.mouth || '#7a3030'; g.lineWidth = 1.8;
    g.beginPath();
    if (o.smirk) { g.moveTo(x - 5, ey + 16); g.quadraticCurveTo(x + 2, ey + 17, x + 7, ey + 13); }
    else if (o.frown) { g.moveTo(x - 6, ey + 17); g.quadraticCurveTo(x, ey + 14, x + 6, ey + 17); }
    else if (o.flat) { g.moveTo(x - 5, ey + 16); g.lineTo(x + 5, ey + 16); }
    else { g.moveTo(x - 6, ey + 14); g.quadraticCurveTo(x, ey + 19, x + 6, ey + 14); }
    g.stroke();
  }
  function hairBlob(g, hex, pts, dark) {
    g.fillStyle = css(hex);
    pts.forEach(p => ell(g, p[0], p[1], p[2], p[3] || p[2], css(hex), p[4] || 0));
    if (dark !== false) {
      g.fillStyle = rgba(0xffffff, 0.12);
      pts.slice(0, 2).forEach(p => ell(g, p[0] - p[2] * 0.25, p[1] - (p[3] || p[2]) * 0.35, p[2] * 0.4, (p[3] || p[2]) * 0.25, rgba(0xffffff, 0.12)));
    }
  }

  const PAINT = {
    orla(g) {
      bg(g, 0x1f5a62, 0x061a1e);
      shoulders(g, 0x0f4a54, { seam: 0x07262c });
      // copper constellation trim on the collar edges
      g.strokeStyle = '#d8884a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(30, 128); g.lineTo(46, 96); g.moveTo(98, 128); g.lineTo(82, 96); g.stroke();
      g.fillStyle = '#ffc48a'; [[36, 116], [42, 104], [92, 116], [86, 104]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 1.8, 0, 7); g.fill(); });
      // high collar
      g.fillStyle = '#0c3a42';
      g.beginPath(); g.moveTo(42, 98); g.lineTo(46, 74); g.lineTo(54, 84); g.lineTo(64, 90); g.lineTo(74, 84); g.lineTo(82, 74); g.lineTo(86, 98); g.closePath(); g.fill();
      g.strokeStyle = '#c8763a'; g.lineWidth = 2; g.beginPath(); g.moveTo(46, 74); g.lineTo(54, 84); g.lineTo(64, 90); g.lineTo(74, 84); g.lineTo(82, 74); g.stroke();
      neck(g, 0x7a4a2c, 8);
      face(g, { skin: 0x8a5634, iris: 0x2a1a10, brow: 0xc8ccd4, browTilt: 0.3, mouth: '#5a2a22' });
      // short silver hair
      hairBlob(g, 0xd8dce2, [[64, 34, 25, 13], [44, 42, 8, 12], [84, 42, 8, 12], [52, 33, 14, 8, -0.4]]);
      g.strokeStyle = 'rgba(150,156,168,0.6)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(48, 36); g.quadraticCurveTo(62, 26, 80, 34); g.stroke();
      // astrolabe ring glint
      g.strokeStyle = '#e6b84a'; g.lineWidth = 2.5; g.beginPath(); g.arc(108, 30, 11, 0, 7); g.stroke();
      g.beginPath(); g.ellipse(108, 30, 4, 11, 0, 0, 7); g.stroke();
      ell(g, 108, 30, 3, 3, '#fff0b0');
    },
    dov(g) {
      bg(g, 0x6a4a18, 0x1e1206);
      shoulders(g, 0xc8701a, { w: 56, seam: 0xe9d9b0 });
      // bow tie
      ell(g, 56, 98, 8, 5.5, '#1f8a44'); ell(g, 72, 98, 8, 5.5, '#1f8a44'); ell(g, 64, 98, 3.5, 3.5, '#156a32');
      neck(g, 0xeab896, 9);
      // curly hair behind
      hairBlob(g, 0x8a3e18, [[38, 48, 11], [90, 48, 11], [36, 62, 9], [92, 62, 9], [44, 34, 12], [84, 34, 12], [64, 28, 16, 12]]);
      face(g, { skin: 0xf0c4a0, rx: 25, ry: 26, y: 58, iris: 0x3a6a2a, brow: 0x7a3414, browTilt: -0.4, cheeks: 'rgba(232,110,100,0.55)', mouth: '#7a3020' });
      // moustache
      ell(g, 58, 73, 7, 3, '#8a3e18', 0.2); ell(g, 70, 73, 7, 3, '#8a3e18', -0.2);
      // round spectacles
      g.strokeStyle = '#3a2a18'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(55, 59, 6, 0, 7); g.stroke(); g.beginPath(); g.arc(73, 59, 6, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(61, 59); g.lineTo(67, 59); g.stroke();
      // front curls
      hairBlob(g, 0x9a4a1e, [[50, 32, 8], [64, 30, 9], [78, 32, 8]], false);
      // pocket-watch glint
      g.strokeStyle = '#e0b040'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(70, 118); g.quadraticCurveTo(84, 124, 96, 116); g.stroke();
      ell(g, 98, 115, 5, 5, '#e8c050'); ell(g, 98, 115, 3.5, 3.5, '#fbf3dc');
    },
    noa(g) {
      bg(g, 0x2a5a32, 0x081a0c);
      // hair puffs (behind)
      hairBlob(g, 0x24170f, [[38, 30, 13], [90, 30, 13]]);
      shoulders(g, 0x1e5a2c, { w: 46, seam: 0xd8cfb6 });
      // satchel strap
      g.strokeStyle = '#6b3a1c'; g.lineWidth = 5; g.beginPath(); g.moveTo(36, 100); g.lineTo(80, 128); g.stroke();
      neck(g, 0xc98d64, 7);
      hairBlob(g, 0x24170f, [[64, 40, 26, 18], [43, 56, 7, 12], [85, 56, 7, 12]]);
      face(g, { skin: 0xd09468, y: 58, rx: 22, ry: 25, iris: 0x3a2412, brow: 0x24170f, cheeks: 'rgba(220,110,90,0.45)', mouth: '#7a3020' });
      // freckles
      g.fillStyle = 'rgba(110,60,30,0.55)';
      [[51, 66], [54, 68], [48, 68], [77, 66], [74, 68], [80, 68]].forEach(p => g.fillRect(p[0], p[1], 1.4, 1.4));
      // goggles on the forehead
      g.fillStyle = '#5a3a1a'; g.fillRect(40, 36, 48, 5);
      [[54, 38], [74, 38]].forEach(p => { ell(g, p[0], p[1], 8.5, 7, '#c4923a'); ell(g, p[0], p[1], 6, 5, '#8fd6ea'); ell(g, p[0] - 2, p[1] - 2, 2, 1.5, '#ffffff'); });
      // Tik on her shoulder
      ell(g, 100, 96, 11, 13, '#c4923a'); ell(g, 100, 82, 9, 8, '#d4a24a');
      ell(g, 96, 82, 3.5, 3.5, '#5a3a14'); ell(g, 104, 82, 3.5, 3.5, '#5a3a14');
      ell(g, 96, 82, 2.2, 2.2, '#6ff2e0'); ell(g, 104, 82, 2.2, 2.2, '#6ff2e0');
      g.fillStyle = '#5a3a14'; g.beginPath(); g.moveTo(98, 86); g.lineTo(102, 86); g.lineTo(100, 90); g.fill();
      g.strokeStyle = '#6a4a1e'; g.lineWidth = 1.5; g.beginPath(); g.arc(100, 98, 4, 0, 7); g.stroke();
    },
    tal(g) {
      bg(g, 0x2a3446, 0x0a0e16);
      shoulders(g, 0x3e4752, { w: 44, seam: 0x1c2026 });
      // white collar points
      g.fillStyle = '#e8e8e0'; g.beginPath(); g.moveTo(54, 92); g.lineTo(64, 98); g.lineTo(58, 104); g.fill();
      g.beginPath(); g.moveTo(74, 92); g.lineTo(64, 98); g.lineTo(70, 104); g.fill();
      neck(g, 0xe2bc9c, 7);
      face(g, { skin: 0xe8c4a8, rx: 21, ry: 27, iris: 0x3a4a5a, brow: 0x111116, browTilt: 0.6, smirk: true, mouth: '#7a3a3a' });
      // swept black hair + cobalt streak
      hairBlob(g, 0x121218, [[64, 34, 25, 13], [46, 40, 9, 14], [82, 40, 9, 14], [74, 30, 18, 9, -0.35]]);
      g.lineCap = 'round';
      g.strokeStyle = '#2a5ae8'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(80, 24); g.quadraticCurveTo(58, 24, 49, 46); g.stroke();
      g.strokeStyle = 'rgba(170,200,255,0.7)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(76, 23); g.quadraticCurveTo(60, 24, 52, 40); g.stroke();
    },
    elkan(g) {
      bg(g, 0x1a4a58, 0x04121a);
      g.globalAlpha = 0.85;
      // coat fading into mist
      const gr = g.createLinearGradient(0, 88, 0, 128);
      gr.addColorStop(0, 'rgba(150,226,236,0.85)'); gr.addColorStop(1, 'rgba(150,226,236,0.05)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(14, 128); g.bezierCurveTo(18, 96, 40, 92, 64, 90); g.bezierCurveTo(88, 92, 110, 96, 114, 128); g.fill();
      g.fillStyle = 'rgba(90,170,190,0.7)'; g.beginPath(); g.moveTo(52, 92); g.lineTo(64, 116); g.lineTo(76, 92); g.fill();
      face(g, { skin: 0xb8eef4, iris: 0x2a7a8a, brow: 0x6fb0bc, browTilt: -0.7, frown: true, mouth: '#3a8a9a', sclera: '#e8ffff' });
      // wispy hair tufts + pointed beard
      hairBlob(g, 0x8fd0dc, [[42, 46, 7, 10], [86, 46, 7, 10], [64, 32, 14, 5]], false);
      g.fillStyle = 'rgba(140,210,222,0.9)';
      g.beginPath(); g.moveTo(50, 74); g.quadraticCurveTo(64, 82, 78, 74); g.lineTo(64, 104); g.closePath(); g.fill();
      // spectacles on a chain
      g.strokeStyle = '#e8ffff'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(55, 57, 6, 0, 7); g.stroke(); g.beginPath(); g.arc(73, 57, 6, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(61, 57); g.lineTo(67, 57); g.stroke();
      g.beginPath(); g.moveTo(49, 58); g.quadraticCurveTo(40, 90, 56, 100); g.stroke();
      g.globalAlpha = 1;
      // edge glow
      const eg = g.createRadialGradient(64, 60, 20, 64, 60, 50);
      eg.addColorStop(0, 'rgba(127,232,255,0)'); eg.addColorStop(0.8, 'rgba(127,232,255,0.12)'); eg.addColorStop(1, 'rgba(127,232,255,0)');
      g.fillStyle = eg; g.fillRect(0, 0, 128, 128);
      // quill
      g.fillStyle = '#f0ffff'; g.beginPath(); g.ellipse(106, 90, 4, 18, 0.5, 0, 7); g.fill();
    },
    morrow(g) {
      bg(g, 0x3a1a5a, 0x08020e);
      // aura
      const ag = g.createRadialGradient(64, 60, 10, 64, 60, 64);
      ag.addColorStop(0, 'rgba(176,108,255,0.0)'); ag.addColorStop(0.7, 'rgba(176,108,255,0.28)'); ag.addColorStop(1, 'rgba(176,108,255,0)');
      g.fillStyle = ag; g.fillRect(0, 0, 128, 128);
      // hood back
      ell(g, 64, 52, 38, 42, '#2a1240');
      shoulders(g, 0x2a1240, { w: 52, top: 90 });
      neck(g, 0xd8c8d0, 7);
      // dark hair framing face
      hairBlob(g, 0x16101c, [[64, 42, 27, 22], [44, 66, 8, 18], [84, 66, 8, 18]], false);
      face(g, { skin: 0xe6d8de, rx: 20, ry: 26, y: 58, glowEye: '#c58bff', brow: 0x16101c, browTilt: 0.7, flat: true, mouth: '#5a1a4a', ears: false });
      // white streak
      g.fillStyle = '#f2eef6';
      g.beginPath(); g.moveTo(50, 32); g.quadraticCurveTo(46, 50, 44, 82); g.lineTo(48, 82); g.quadraticCurveTo(50, 50, 56, 33); g.closePath(); g.fill();
      // hood rim
      g.strokeStyle = '#4a2270'; g.lineWidth = 4;
      g.beginPath(); g.ellipse(64, 54, 31, 36, 0, Math.PI * 0.92, Math.PI * 2.08); g.stroke();
      // cracked violet lantern
      const lg = g.createRadialGradient(104, 104, 2, 104, 104, 22);
      lg.addColorStop(0, 'rgba(240,210,255,1)'); lg.addColorStop(0.4, 'rgba(176,108,255,0.9)'); lg.addColorStop(1, 'rgba(176,108,255,0)');
      g.fillStyle = lg; g.fillRect(80, 80, 48, 48);
      g.strokeStyle = '#1a0628'; g.lineWidth = 2; g.strokeRect(97, 96, 14, 18);
      g.beginPath(); g.moveTo(101, 96); g.lineTo(105, 104); g.lineTo(102, 110); g.stroke();
      g.beginPath(); g.moveTo(104, 96); g.lineTo(104, 84); g.stroke();
    },
    pebble(g) {
      bg(g, 0x4a5262, 0x10141c);
      // wings
      g.fillStyle = '#5c6068';
      g.beginPath(); g.moveTo(40, 80); g.lineTo(8, 40); g.lineTo(14, 66); g.lineTo(4, 70); g.lineTo(18, 86); g.lineTo(10, 96); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(88, 80); g.lineTo(120, 40); g.lineTo(114, 66); g.lineTo(124, 70); g.lineTo(110, 86); g.lineTo(118, 96); g.closePath(); g.fill();
      shoulders(g, 0x7c8088, { w: 46, top: 96 });
      // ears + horns
      g.fillStyle = '#80848c';
      g.beginPath(); g.moveTo(34, 56); g.lineTo(18, 38); g.lineTo(40, 46); g.fill();
      g.beginPath(); g.moveTo(94, 56); g.lineTo(110, 38); g.lineTo(88, 46); g.fill();
      g.fillStyle = '#5e6168';
      g.beginPath(); g.moveTo(48, 34); g.lineTo(44, 18); g.lineTo(56, 30); g.fill();
      g.beginPath(); g.moveTo(80, 34); g.lineTo(84, 18); g.lineTo(72, 30); g.fill();
      // head
      const hg = g.createRadialGradient(56, 44, 4, 64, 56, 34);
      hg.addColorStop(0, '#b4b8c0'); hg.addColorStop(1, '#6c7078');
      ell(g, 64, 56, 30, 26, hg);
      // speckles
      g.fillStyle = 'rgba(60,62,70,0.45)';
      for (let i = 0; i < 40; i++) g.fillRect(40 + (i * 37) % 48, 34 + (i * 23) % 44, 1.5, 1.5);
      // moss
      ell(g, 50, 34, 9, 4, '#4c7a2e'); ell(g, 46, 36, 4, 3, '#5e9038');
      // snout + jaw
      ell(g, 64, 72, 17, 11, '#8c9098');
      g.fillStyle = '#2a2c32'; g.beginPath(); g.ellipse(64, 78, 11, 3.5, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#eee6d0';
      g.beginPath(); g.moveTo(56, 78); g.lineTo(58, 84); g.lineTo(60, 78); g.fill();
      g.beginPath(); g.moveTo(68, 78); g.lineTo(70, 84); g.lineTo(72, 78); g.fill();
      ell(g, 59, 69, 2, 1.5, '#3a3c42'); ell(g, 69, 69, 2, 1.5, '#3a3c42');
      // brow ridge + glowing amber eyes (one raised — dramatic)
      g.fillStyle = '#5c6068';
      g.beginPath(); g.moveTo(40, 52); g.quadraticCurveTo(52, 40, 62, 50); g.lineTo(62, 53); g.quadraticCurveTo(52, 46, 40, 55); g.fill();
      g.beginPath(); g.moveTo(88, 49); g.quadraticCurveTo(76, 42, 66, 50); g.lineTo(66, 53); g.quadraticCurveTo(76, 47, 88, 52); g.fill();
      [[52, 57], [76, 57]].forEach(p => {
        const eg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], 9);
        eg.addColorStop(0, 'rgba(255,230,140,1)'); eg.addColorStop(0.4, 'rgba(255,170,40,0.9)'); eg.addColorStop(1, 'rgba(255,140,20,0)');
        g.fillStyle = eg; g.fillRect(p[0] - 10, p[1] - 10, 20, 20);
        ell(g, p[0], p[1], 4.5, 3, '#ffc040');
      });
    },
    student(g) {
      bg(g, 0x2a3a5a, 0x0a1020);
      shoulders(g, 0x16264a, { w: 44, seam: 0xe8e2d0 });
      g.fillStyle = '#c8763a'; g.fillRect(61, 92, 6, 22);
      neck(g, 0xd9a47c, 7);
      face(g, { skin: 0xe0ac84, rx: 21, ry: 25, y: 58, iris: 0x4a3018, brow: 0x5a3418 });
      hairBlob(g, 0x5a3418, [[64, 38, 24, 14], [45, 46, 7, 11], [83, 46, 7, 11]]);
    },
    player(g) {
      bg(g, 0x5a4618, 0x140e04);
      const female = ELD.profile && ELD.profile.gender === 'f';
      // silhouette with soft gold rim
      const sil = '#1c1610';
      if (female) hairBlob(g, 0x1c1610, [[64, 60, 28, 34]], false);
      shoulders(g, 0xc8962e, { w: 48, seam: 0x3a2a10 });
      g.fillStyle = sil; g.fillRect(57, 72, 14, 24);
      ell(g, 64, 54, 23, 27, sil);
      g.strokeStyle = 'rgba(255,214,120,0.75)'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(64, 54, 23, 27, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
      // question-mark spark: an unknown, about-to-be-written hero
      ell(g, 64, 54, 10, 10, 'rgba(255,214,120,0.12)');
      g.fillStyle = 'rgba(255,224,150,0.9)';
      g.font = 'bold 22px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('✦', 64, 54);
    },
    shade(g) {
      bg(g, 0x2a1440, 0x050208);
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2;
        ell(g, 64 + Math.cos(a) * 22, 64 + Math.sin(a) * 18, 20, 18, 'rgba(10,6,16,0.75)');
      }
      ell(g, 64, 64, 30, 26, '#0a0612');
      g.fillStyle = 'rgba(10,6,16,0.85)';
      [[44, 40], [64, 32], [84, 40]].forEach(p => { g.beginPath(); g.moveTo(p[0] - 7, p[1] + 12); g.lineTo(p[0], p[1] - 10); g.lineTo(p[0] + 7, p[1] + 12); g.fill(); });
      [[50, 62, -0.35], [78, 62, 0.35]].forEach(p => {
        const eg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], 12);
        eg.addColorStop(0, 'rgba(240,210,255,1)'); eg.addColorStop(0.35, 'rgba(176,108,255,0.85)'); eg.addColorStop(1, 'rgba(176,108,255,0)');
        g.fillStyle = eg; g.fillRect(p[0] - 12, p[1] - 12, 24, 24);
        ell(g, p[0], p[1], 6, 3, '#e8d0ff', p[2]);
      });
    },
    dummy(g) {
      bg(g, 0x5a3e1e, 0x140c04);
      g.fillStyle = '#6e4526'; g.fillRect(8, 98, 112, 10); g.fillRect(58, 90, 12, 38);
      ell(g, 64, 118, 36, 18, '#c9a85a');
      ell(g, 64, 56, 34, 36, '#c8ad7a');
      const rings = ['#b8322a', '#f2e6c8', '#b8322a', '#f2e6c8', '#b8322a'];
      rings.forEach((c, i) => ell(g, 64, 58, 28 - i * 5.6, 28 - i * 5.6, c));
      g.fillStyle = '#2a1a10';
      g.fillRect(46, 46, 8, 3); g.fillRect(48.5, 43.5, 3, 8); g.fillRect(74, 46, 8, 3); g.fillRect(76.5, 43.5, 3, 8);
      g.strokeStyle = '#2a1a10'; g.lineWidth = 2.5; g.beginPath(); g.arc(64, 64, 10, 0.2, Math.PI - 0.2); g.stroke();
      g.fillStyle = '#d8b862'; g.beginPath(); g.moveTo(56, 22); g.lineTo(64, 10); g.lineTo(72, 22); g.fill();
    },
    shard(g) {
      bg(g, 0x5a3a10, 0x120a02);
      const gg = g.createRadialGradient(64, 64, 4, 64, 64, 56);
      gg.addColorStop(0, 'rgba(255,240,190,0.9)'); gg.addColorStop(0.35, 'rgba(255,180,60,0.45)'); gg.addColorStop(1, 'rgba(255,150,30,0)');
      g.fillStyle = gg; g.fillRect(0, 0, 128, 128);
      const facets = [['#ffd36a', [[64, 18], [80, 58], [64, 100], [50, 60]]], ['#ffb43a', [[64, 18], [50, 60], [64, 100], [44, 70]]],
        ['#ffe7a0', [[80, 58], [94, 44], [88, 78]]], ['#f2a030', [[48, 70], [34, 62], [40, 88]]]];
      facets.forEach(f => { g.fillStyle = f[0]; g.beginPath(); f[1].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); });
      g.strokeStyle = 'rgba(255,255,230,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(64, 18); g.lineTo(64, 100); g.stroke();
      ell(g, 58, 40, 3, 6, 'rgba(255,255,255,0.8)', -0.3);
    },
    tik(g) {
      bg(g, 0x5a4618, 0x140e04);
      ell(g, 64, 100, 34, 36, '#c4923a');
      ell(g, 64, 56, 32, 28, '#d4a24a');
      g.fillStyle = '#c4923a';
      g.beginPath(); g.moveTo(36, 40); g.lineTo(40, 18); g.lineTo(52, 34); g.fill();
      g.beginPath(); g.moveTo(92, 40); g.lineTo(88, 18); g.lineTo(76, 34); g.fill();
      [[50, 56], [78, 56]].forEach(p => { ell(g, p[0], p[1], 12, 12, '#5a3a14'); ell(g, p[0], p[1], 8, 8, '#6ff2e0'); ell(g, p[0], p[1], 3, 3, '#0a3a38'); ell(g, p[0] - 2, p[1] - 3, 2, 2, '#ffffff'); });
      g.fillStyle = '#5a3a14'; g.beginPath(); g.moveTo(59, 66); g.lineTo(69, 66); g.lineTo(64, 76); g.fill();
      g.strokeStyle = '#6a4a1e'; g.lineWidth = 3; g.beginPath(); g.arc(64, 104, 10, 0, 7); g.stroke();
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.fillStyle = '#6a4a1e'; g.fillRect(64 + Math.cos(a) * 13 - 2, 104 + Math.sin(a) * 13 - 2, 4, 4); }
    },
    narrator(g) {
      bg(g, 0x3a2e14, 0x0c0904);
      const gg = g.createRadialGradient(64, 62, 2, 64, 62, 44);
      gg.addColorStop(0, 'rgba(255,230,160,0.9)'); gg.addColorStop(0.3, 'rgba(255,190,80,0.4)'); gg.addColorStop(1, 'rgba(255,170,60,0)');
      g.fillStyle = gg; g.fillRect(0, 0, 128, 128);
      // lantern emblem
      g.strokeStyle = '#c9a24a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(50, 44); g.lineTo(78, 44); g.lineTo(82, 86); g.lineTo(46, 86); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(54, 44); g.lineTo(64, 30); g.lineTo(74, 44); g.stroke();
      g.beginPath(); g.arc(64, 26, 4, 0, 7); g.stroke();
      g.fillStyle = '#c9a24a'; g.fillRect(44, 86, 40, 5);
      ell(g, 64, 66, 7, 11, '#fff0c0');
    }
  };

  function portrait(id) {
    const key0 = id == null ? 'narrator' : String(id);
    const key = PAINT[key0] ? key0 : (key0.indexOf('student') === 0 ? 'student' : 'narrator');
    const cacheKey = key === 'player' ? 'player|' + ((ELD.profile && ELD.profile.gender) || 'm') : key;
    if (PORTRAITS[cacheKey]) return PORTRAITS[cacheKey];
    let url = '';
    try {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const g = c.getContext('2d');
      PAINT[key](g);
      frame(g);
      url = c.toDataURL('image/png');
    } catch (e) { url = ''; }
    PORTRAITS[cacheKey] = url;
    return url;
  }

  // ---------------------------------------------------------------------------------------------
  // 7. Public API
  // ---------------------------------------------------------------------------------------------
  function create(id, opts) {
    opts = opts || {};
    if (!ensure()) throw new Error('ELD.chars.create: THREE is not loaded');
    const b = BUILDERS[id] || buildStudent;
    const impl = b(opts);
    const npc = makeNpc(BUILDERS[id] ? id : 'student', impl.root, impl, opts);
    if (impl.heightNow) Object.defineProperty(npc, 'height', { get: () => impl.heightNow, enumerable: true });
    if (id === 'dummy') {
      // wobble whenever core reports a hit on the enemy that uses this model
      npc._listen('dummyHit', (d) => { if (d && d.enemy && d.enemy.model === npc) npc.flash(); });
    }
    if (id === 'shade' || id === 'morrow') {
      npc._listen('enemyKilled', (d) => { if (d && d.enemy && d.enemy.model === npc) npc.flash(); });
    }
    // run one frame so poses/lifts are applied before the first render
    npc.update(0.05, 0);
    return npc;
  }

  ELD.chars = {
    create: create,
    info: info,
    portrait: portrait,
    ids: Object.keys(BUILDERS),
    POSES: Object.keys(POSES)
  };
})();
