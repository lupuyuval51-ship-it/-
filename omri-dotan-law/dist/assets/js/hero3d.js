/* ============================================================
   סצנת Hero תלת־ממדית – מאזני צדק בפליז (Three.js r128, UMD)
   כניסה מתוזמרת, קישור לגלילה, אור עוקב־סמן, הילות, מצב מנוחה
   ============================================================ */
(function () {
  'use strict';
  var mount = document.getElementById('hero-3d');
  if (!mount || typeof THREE === 'undefined') return;

  var root = document.documentElement;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function isReduced() {
    return motionQuery.matches || root.getAttribute('data-motion') === 'off';
  }
  var reduced = isReduced();

  // ---------- קבועים ----------
  var ENTER = 1.8;                 // משך הכניסה (שניות)
  var REST_AT = 24;                // "זמן" אחרי סיום הכניסה – לפריים הסטטי
  var REST_IDLE = 0.35;            // פאזת תנודה שקטה לפריים הסטטי
  var CAM_Y = 1.35, CAM_Z = 10.5, CAM_Z_NARROW = 12.5;
  var CAM_START_Y = 2.2, CAM_START_Z = 14.5;
  var NARROW_W = 860;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeOutExpo(x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }

  // בדיקת WebGL
  var probe = document.createElement('canvas');
  var gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
  if (!gl) { mount.classList.add('is-unavailable'); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { mount.classList.add('is-unavailable'); return; }
  var initialW = mount.clientWidth || window.innerWidth || 1024;
  var narrow = initialW < NARROW_W;
  function pixelRatioFor(w) {
    // מובייל: DPR מוגבל ל־1.5 – חוסך fill-rate בלי פגיעה נראית
    return Math.min(window.devicePixelRatio || 1, w < NARROW_W ? 1.5 : 2);
  }
  renderer.setPixelRatio(pixelRatioFor(initialW));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);
  var fallback = document.getElementById('hero-3d-fallback');
  if (fallback) fallback.style.display = 'none';

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f2a25, 9, 18);

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, CAM_START_Y, CAM_START_Z);

  // ---------- סביבת השתקפות פרוצדורלית (בלי קבצים חיצוניים) ----------
  function buildEnvironment() {
    var envScene = new THREE.Scene();
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(30, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x1b2f2a, side: THREE.BackSide })
    );
    envScene.add(sky);
    function panel(w, h, color, intensity, x, y, z, ry, rx) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.rotation.set(rx || 0, ry || 0, 0);
      envScene.add(m);
    }
    panel(14, 6, 0xfff1d6, 3.2, -8, 6, 4, Math.PI / 3);     // מפתח חם
    panel(10, 10, 0xd8b978, 1.6, 9, 3, -2, -Math.PI / 2.5); // פליז
    panel(20, 4, 0xbfd7cf, 1.2, 0, 10, -6, 0, Math.PI / 2); // תקרה קרה
    panel(8, 8, 0xffffff, 0.9, 0, -8, 4, 0, -Math.PI / 2);  // רצפה
    panel(6, 12, 0xf6e6c8, 2.0, -4, 2, -10, Math.PI);       // רים
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return rt.texture;
  }
  var envMap = buildEnvironment();
  scene.environment = envMap;

  // ---------- חומרים ----------
  var brass = new THREE.MeshPhysicalMaterial({
    color: 0xc9a563, metalness: 1.0, roughness: 0.28, envMapIntensity: 1.3,
    clearcoat: 0.6, clearcoatRoughness: 0.3
  });
  var brassDark = new THREE.MeshPhysicalMaterial({
    color: 0x8a6d3b, metalness: 1.0, roughness: 0.42, envMapIntensity: 1.0
  });
  var stone = new THREE.MeshStandardMaterial({ color: 0x1a3a33, metalness: 0.15, roughness: 0.85 });
  var GLASS_OPACITY = 0.18;
  var glass = new THREE.MeshPhysicalMaterial({
    color: 0xd8b978, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0,
    envMapIntensity: 2.0, side: THREE.DoubleSide, depthWrite: false
  });

  // ---------- תאורה ----------
  scene.add(new THREE.HemisphereLight(0xcfe3da, 0x0b1f1b, 0.55));
  var key = new THREE.DirectionalLight(0xfff1d6, 1.6);
  key.position.set(-5, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(narrow ? 512 : 1024, narrow ? 512 : 1024);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.0005;
  scene.add(key);
  var rim = new THREE.PointLight(0xd8b978, 1.8, 30);
  var rimBase = new THREE.Vector3(6, 3, -4);
  rim.position.copy(rimBase);
  scene.add(rim);
  var fill = new THREE.PointLight(0x7fb3a5, 0.7, 30);
  fill.position.set(-6, -2, 4);
  scene.add(fill);

  // ---------- המאזניים ----------
  var group = new THREE.Group();
  scene.add(group);

  var pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.22, 64), stone);
  pedestal.position.y = -2.15; pedestal.receiveShadow = true; pedestal.castShadow = true;
  group.add(pedestal);
  var base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.16, 64), brass);
  base.position.y = -1.96; base.castShadow = true; base.receiveShadow = true;
  group.add(base);
  var baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 16, 96), brassDark);
  baseRing.rotation.x = Math.PI / 2; baseRing.position.y = -1.87;
  group.add(baseRing);

  var column = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 3.6, 32), brass);
  column.position.y = -0.1; column.castShadow = true;
  group.add(column);
  var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 32), brassDark);
  collar.position.y = 1.62;
  group.add(collar);
  var finial = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 32), brass);
  finial.position.y = 1.92; finial.castShadow = true;
  group.add(finial);

  // ציר הקורה
  var pivot = new THREE.Group();
  pivot.position.y = 1.7;
  group.add(pivot);
  var beam = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.075, 0.075), brass);
  beam.castShadow = true;
  pivot.add(beam);
  var beamCapL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), brassDark);
  beamCapL.position.x = -2.1; pivot.add(beamCapL);
  var beamCapR = beamCapL.clone(); beamCapR.position.x = 2.1; pivot.add(beamCapR);

  function makePan(side) {
    var hanger = new THREE.Group();
    hanger.position.x = side * 2.05;
    pivot.add(hanger);
    var chainMat = brassDark;
    var chainGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.9, 6);
    var dropY = -0.95;
    var offsets = [[0.42, 0], [-0.21, 0.36], [-0.21, -0.36]];
    offsets.forEach(function (o) {
      var c = new THREE.Mesh(chainGeo, chainMat);
      c.position.set(o[0] * 0.5, dropY, o[1] * 0.5);
      c.lookAt(new THREE.Vector3(o[0], -1.9, o[1]));
      c.rotateX(Math.PI / 2);
      hanger.add(c);
    });
    var pan = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.11, 64, 1, true), brass);
    pan.position.y = -1.9; pan.castShadow = true; pan.receiveShadow = true;
    hanger.add(pan);
    var panBottom = new THREE.Mesh(new THREE.CircleGeometry(0.5, 64), brass);
    panBottom.rotation.x = -Math.PI / 2; panBottom.position.y = -1.955;
    hanger.add(panBottom);
    var panRim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 12, 64), brassDark);
    panRim.rotation.x = Math.PI / 2; panRim.position.y = -1.845;
    hanger.add(panRim);
    return hanger;
  }
  var panL = makePan(-1);
  var panR = makePan(1);

  // טבעות זכוכית מרחפות
  var rings = [];
  [[3.2, 0.9, 0.6], [4.1, -0.7, 0.35], [2.6, 0.2, -0.2]].forEach(function (r, i) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(r[0], 0.012 + i * 0.004, 8, 160), glass);
    ring.rotation.set(Math.PI / 2 + r[1], r[2], 0);
    ring.position.y = -0.3;
    ring.userData.speed = 0.05 + i * 0.03;
    ring.userData.axis = i;
    scene.add(ring);
    rings.push(ring);
  });

  // ---------- טקסטורות רדיאליות (אבק והילות) ----------
  function radialTexture(size, stops) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  var dustTex = radialTexture(64, [
    [0, 'rgba(255,240,200,1)'], [0.35, 'rgba(216,185,120,0.7)'], [1, 'rgba(216,185,120,0)']
  ]);
  var glowTex = radialTexture(128, [
    [0, 'rgba(255,241,214,1)'], [0.22, 'rgba(216,185,120,0.55)'], [0.55, 'rgba(216,185,120,0.14)'], [1, 'rgba(216,185,120,0)']
  ]);

  // אבק זהב (פחות חלקיקים במובייל)
  var COUNT = narrow ? 300 : 520;
  var DUST_OPACITY = 0.85;
  var positions = new Float32Array(COUNT * 3);
  var speeds = new Float32Array(COUNT);
  for (var i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    speeds[i] = 0.08 + Math.random() * 0.25;
  }
  var dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var dustMat = new THREE.PointsMaterial({
    size: 0.09, map: dustTex, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true, color: 0xffffff
  });
  var dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // הילות אדיטיביות: קטנה מאחורי הכדור העליון, רחבה מאחורי המאזניים
  function makeGlow(scale, opacity, x, y, z) {
    var mat = new THREE.SpriteMaterial({
      map: glowTex, color: 0xffffff, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    var s = new THREE.Sprite(mat);
    s.scale.set(scale, scale, 1);
    s.position.set(x, y, z);
    s.userData.scale = scale;
    s.userData.opacity = opacity;
    return s;
  }
  var finialGlow = makeGlow(1.5, 0.34, 0, 1.92, -0.3);
  group.add(finialGlow);
  var wideGlow = makeGlow(6, 0.12, 0, -0.1, -1.4);
  group.add(wideGlow);

  // רצפת השתקפות עדינה
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x0f2a25, metalness: 0.3, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.27; floor.receiveShadow = true;
  scene.add(floor);

  // ---------- מיקום לפי כיוון הדף ----------
  var isRTL = document.documentElement.dir === 'rtl';
  var sideShift = isRTL ? -2.4 : 2.4; // הסצנה בצד הפנוי מהטקסט
  group.position.x = sideShift;
  rings.forEach(function (r) { r.position.x = sideShift; });
  dust.position.x = sideShift * 0.4;

  // ---------- אינטראקציה ----------
  var target = { x: 0, y: 0 };
  var current = { x: 0, y: 0 };
  var scrollY = 0;
  var scrollP = 0;          // התקדמות הגלילה לאורך ה-Hero (0..1)
  var heroEl = mount.parentNode || mount;
  var heroH = 1;
  var baseOpacity = 1;      // ה-opacity שה-CSS נותן למעטפת (למשל .9 במובייל)
  var lastOpacity = null;

  function onPointer(e) {
    if (reduced) return;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  function readScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    scrollP = clamp01(scrollY / heroH);
  }
  function applyMountOpacity() {
    // דהייה עדינה של הסצנה עד סוף ה-Hero (opacity בלבד – מותר גם במצב מנוחה)
    var o = scrollP > 0 ? String(Math.round(baseOpacity * (1 - scrollP) * 100) / 100) : '';
    if (o !== lastOpacity) { lastOpacity = o; mount.style.opacity = o; }
  }
  var scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      scrollTicking = false;
      readScroll();
      applyMountOpacity();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var baseZ = CAM_Z;
  function resize() {
    var w = mount.clientWidth || 1, h = mount.clientHeight || 1;
    narrow = w < NARROW_W;
    renderer.setPixelRatio(pixelRatioFor(w));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = narrow ? 44 : 32;
    group.position.x = narrow ? 0 : sideShift;
    rings.forEach(function (r) { r.position.x = narrow ? 0 : sideShift; });
    baseZ = narrow ? CAM_Z_NARROW : CAM_Z;
    camera.updateProjectionMatrix();
    // מדידה מחדש של גובה ה-Hero ושל ה-opacity הבסיסי מה-CSS
    var inline = mount.style.opacity;
    mount.style.opacity = '';
    var cssOpacity = parseFloat(window.getComputedStyle(mount).opacity);
    baseOpacity = isNaN(cssOpacity) ? 1 : cssOpacity;
    mount.style.opacity = inline;
    heroH = Math.max(1, heroEl.offsetHeight || h);
    readScroll();
    lastOpacity = null;
    applyMountOpacity();
  }
  resize();

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.02 }).observe(mount);
  }
  var hidden = !!document.hidden;
  document.addEventListener('visibilitychange', function () { hidden = document.hidden; });

  // הקורה מתחילה נטויה (0.18rad) ומתייצבת בתנודה דועכת – שיווי משקל
  function beamSettle(at) {
    return 0.18 * Math.exp(-1.6 * at) * Math.cos(at * 2.6);
  }

  /**
   * at     – זמן אנימציה מצטבר מתחילת הכניסה (שניות)
   * dt     – זמן שחלף מהפריים הקודם (0 לפריים סטטי)
   * idleT  – פאזת התנודה השקטה (ברירת מחדל: at)
   */
  function frame(at, dt, idleT) {
    var t = typeof idleT === 'number' ? idleT : at;
    var e = clamp01(at / ENTER);
    var eCam = easeOutExpo(e);
    var eGroup = easeOutCubic(e);
    var eRings = easeOutCubic(clamp01((at - 0.25) / (ENTER - 0.25)));
    var eDust = easeOutCubic(clamp01((at - 0.15) / 1.4));
    var p = scrollP;

    // תנודת הקורה + התייצבות הכניסה
    var sway = Math.sin(t * 0.6) * 0.055 + Math.sin(t * 1.7) * 0.012;
    var tilt = sway + beamSettle(at);
    pivot.rotation.z = tilt;
    panL.rotation.z = -tilt; panR.rotation.z = -tilt;

    // הקבוצה: עלייה וסיבוב בכניסה, נשימה אחר כך, ירידה בגלילה
    group.rotation.y = -0.6 * (1 - eGroup) + Math.sin(t * 0.25) * 0.25 + current.x * 0.35;
    group.rotation.x = current.y * 0.08;
    group.position.y = -1.2 * (1 - eGroup) + Math.sin(t * 0.8) * 0.05 - p * 1.0;

    // טבעות: התרחבות ודהייה פנימה, סיבוב איטי
    var ringScale = 0.6 + 0.4 * eRings;
    glass.opacity = GLASS_OPACITY * eRings;
    rings.forEach(function (r, i) {
      r.scale.set(ringScale, ringScale, ringScale);
      if (i === 0) r.rotation.z += 0.09 * dt; else if (i === 1) r.rotation.y += 0.072 * dt; else r.rotation.x += 0.06 * dt;
    });

    // אבק
    dustMat.opacity = DUST_OPACITY * eDust;
    if (dt > 0) {
      var arr = dustGeo.attributes.position.array;
      for (var i = 0; i < COUNT; i++) {
        arr[i * 3 + 1] += speeds[i] * 0.24 * dt;
        arr[i * 3] += Math.sin(t * 0.5 + i) * 0.036 * dt;
        if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = -5;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    // הילות נושמות – עדין
    var breath = Math.sin(t * 1.1);
    finialGlow.material.opacity = finialGlow.userData.opacity * (1 + 0.18 * breath) * eRings;
    var fs = finialGlow.userData.scale * (1 + 0.05 * breath);
    finialGlow.scale.set(fs, fs, 1);
    wideGlow.material.opacity = wideGlow.userData.opacity * (1 + 0.22 * Math.sin(t * 0.7 + 1.3)) * eRings;

    // אור הרים עוקב אחרי הסמן במישור x/y – ההשתקפויות "חיות"
    rim.position.x = rimBase.x + current.x * 4.0;
    rim.position.y = rimBase.y - current.y * 2.5;
    rim.intensity = 1.8 + Math.abs(current.x) * 0.5;

    // מצלמה: דולי בכניסה, פרלקסת סמן, התרוממות והבטה מטה בגלילה
    var camZ = baseZ + (CAM_START_Z - CAM_Z) * (1 - eCam);
    var camY = CAM_Y + (CAM_START_Y - CAM_Y) * (1 - eCam) - current.y * 0.3 + p * 1.2;
    camera.position.set(current.x * 0.5 + (isRTL ? 0.6 : -0.6), camY, camZ);
    camera.lookAt(group.position.x * 0.6, -0.2 - p * 0.8, 0);
  }

  var clock = new THREE.Clock();
  var at = 0;               // זמן אנימציה – מתקדם רק כשמרונדר בפועל
  var running = false;

  function renderStatic() {
    // פריים אחד במצב הסופי (אחרי הכניסה), בלי פרלקסת סמן
    current.x = 0; current.y = 0; target.x = 0; target.y = 0;
    rim.position.copy(rimBase);
    frame(REST_AT, 0, REST_IDLE);
    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || hidden || dt <= 0) return;
    at += dt;
    var k = 1 - Math.pow(0.96, dt * 60);
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    frame(at, dt);
    renderer.render(scene, camera);
  }

  function start() {
    if (reduced) { running = false; renderStatic(); return; }
    if (running) return;
    running = true;
    clock.getDelta();
    requestAnimationFrame(loop);
  }

  // מעבר חי בין מצב תנועה למצב מנוחה (כפתור הנגישות / העדפת מערכת)
  function onMotionChange() {
    var now = isReduced();
    if (now === reduced) return;
    reduced = now;
    if (reduced) { running = false; renderStatic(); }
    else { at = Math.max(at, ENTER); start(); }
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
  if ('MutationObserver' in window) {
    new MutationObserver(onMotionChange).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  window.addEventListener('resize', function () {
    resize();
    if (reduced) renderStatic();
  });

  // ---------- פריים ראשון ואות מוכנות ----------
  if (reduced) renderStatic();
  else { frame(0, 0); renderer.render(scene, camera); }

  var readySent = false;
  function announceReady() {
    if (readySent) return;
    readySent = true;
    window.__hero3dReady = true;
    mount.classList.add('is-ready');
    var ev;
    try { ev = new CustomEvent('hero3d:ready'); }
    catch (e) { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('hero3d:ready', false, false, null); }
    window.dispatchEvent(ev);
    start();
  }
  // האות נשלח אחרי שכל הסקריפטים הדחויים (main.js / motion.js) רשמו מאזינים
  if (document.readyState === 'complete') {
    setTimeout(announceReady, 0);
  } else {
    document.addEventListener('DOMContentLoaded', announceReady);
    window.addEventListener('load', announceReady);
  }
})();
