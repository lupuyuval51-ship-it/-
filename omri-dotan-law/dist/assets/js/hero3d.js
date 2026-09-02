/* ============================================================
   סצנת Hero תלת־ממדית – מאזני צדק בפליז (Three.js r128, UMD)
   ============================================================ */
(function () {
  'use strict';
  var mount = document.getElementById('hero-3d');
  if (!mount || typeof THREE === 'undefined') return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.getAttribute('data-motion') === 'off';

  // בדיקת WebGL
  var probe = document.createElement('canvas');
  var gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
  if (!gl) { mount.classList.add('is-unavailable'); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { mount.classList.add('is-unavailable'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
  camera.position.set(0, 1.35, 10.5);

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
  var glass = new THREE.MeshPhysicalMaterial({
    color: 0xd8b978, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.18,
    envMapIntensity: 2.0, side: THREE.DoubleSide, depthWrite: false
  });

  // ---------- תאורה ----------
  scene.add(new THREE.HemisphereLight(0xcfe3da, 0x0b1f1b, 0.55));
  var key = new THREE.DirectionalLight(0xfff1d6, 1.6);
  key.position.set(-5, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.0005;
  scene.add(key);
  var rim = new THREE.PointLight(0xd8b978, 1.8, 30);
  rim.position.set(6, 3, -4);
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

  // אבק זהב
  var COUNT = 520;
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
  var dustTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(0.35, 'rgba(216,185,120,0.7)');
    g.addColorStop(1, 'rgba(216,185,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  })();
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.09, map: dustTex, transparent: true, opacity: 0.85, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true, color: 0xffffff
  }));
  scene.add(dust);

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
  function onPointer(e) {
    var x = (e.clientX / window.innerWidth) * 2 - 1;
    var y = (e.clientY / window.innerHeight) * 2 - 1;
    target.x = x; target.y = y;
  }
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', onPointer, { passive: true });
  }
  window.addEventListener('scroll', function () { scrollY = window.scrollY || 0; }, { passive: true });

  function resize() {
    var w = mount.clientWidth || 1, h = mount.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var narrow = w < 860;
    camera.fov = narrow ? 44 : 32;
    group.position.x = narrow ? 0 : sideShift;
    rings.forEach(function (r) { r.position.x = narrow ? 0 : sideShift; });
    camera.position.z = narrow ? 12.5 : 10.5;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  var clock = new THREE.Clock();
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.02 }).observe(mount);
  }
  var hidden = false;
  document.addEventListener('visibilitychange', function () { hidden = document.hidden; });

  function frame(t) {
    // תנודת הקורה, כאילו המאזניים מתייצבים
    var sway = Math.sin(t * 0.6) * 0.055 + Math.sin(t * 1.7) * 0.012;
    pivot.rotation.z = sway;
    panL.rotation.z = -sway; panR.rotation.z = -sway;
    group.rotation.y = Math.sin(t * 0.25) * 0.25 + current.x * 0.35;
    group.rotation.x = current.y * 0.08;
    group.position.y = Math.sin(t * 0.8) * 0.05 - scrollY * 0.0012;
    rings.forEach(function (r, i) {
      if (i === 0) r.rotation.z += 0.0015; else if (i === 1) r.rotation.y += 0.0012; else r.rotation.x += 0.001;
    });
    var arr = dustGeo.attributes.position.array;
    for (var i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * 0.004;
      arr[i * 3] += Math.sin(t * 0.5 + i) * 0.0006;
      if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = -5;
    }
    dustGeo.attributes.position.needsUpdate = true;
    camera.position.x = current.x * 0.5 + (isRTL ? 0.6 : -0.6);
    camera.position.y = 1.35 - current.y * 0.3;
    camera.lookAt(group.position.x * 0.6, -0.2, 0);
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!visible || hidden) return;
    var t = clock.getElapsedTime();
    current.x += (target.x - current.x) * 0.04;
    current.y += (target.y - current.y) * 0.04;
    frame(t);
    renderer.render(scene, camera);
  }

  if (reduced) {
    frame(1.2);
    renderer.render(scene, camera);
    window.addEventListener('resize', function () { renderer.render(scene, camera); });
  } else {
    loop();
  }
})();
