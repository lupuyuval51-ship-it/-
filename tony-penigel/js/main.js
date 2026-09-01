/* ═══════════════════════════════════════════════════════════════
   טוני פניג'ל · תכנון ועיצוב פנים — main.js
   3D scene (Three.js) + scroll experience (GSAP)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var isMobile = window.matchMedia('(max-width: 860px)').matches;

  var preloader = document.getElementById('preloader');
  var nav = document.getElementById('nav');
  var burger = document.getElementById('navBurger');
  var mobileMenu = document.getElementById('mobileMenu');

  /* ── Failsafe: if libraries failed to load, keep the site usable ── */
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasThree = typeof window.THREE !== 'undefined';

  function killPreloader() {
    if (preloader) { preloader.style.display = 'none'; }
  }

  /* ═══════════════════════════════════════════════════════════
     3D scene
     ═══════════════════════════════════════════════════════════ */
  var three = { scrollProg: 0, mouseX: 0, mouseY: 0, running: false };

  function initThree() {
    if (!hasThree) { document.body.classList.add('no-webgl'); return; }
    var canvas = document.getElementById('scene');
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      document.body.classList.add('no-webgl');
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f0e0c, 0.038);

    var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);

    var GOLD = 0xc8a468;
    var lineMat = function (opacity) {
      return new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: opacity });
    };

    var room = new THREE.Group();
    scene.add(room);

    /* Room shell — golden wireframe box */
    var shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(9.4, 4.8, 9.4)),
      lineMat(0.3)
    );
    shell.position.y = 2.4;
    room.add(shell);

    /* Floor grid */
    var grid = new THREE.GridHelper(9.4, 10, 0x4a3f2e, 0x2a241c);
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    room.add(grid);

    /* Arch */
    var arch = new THREE.Group();
    var archMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.85, roughness: 0.3 });
    var torus = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.028, 14, 60, Math.PI), archMat);
    torus.position.y = 1.55;
    arch.add(torus);
    [-1.05, 1.05].forEach(function (x) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.55, 14), archMat);
      leg.position.set(x, 0.775, 0);
      arch.add(leg);
    });
    arch.position.set(-2.7, 0, -1.6);
    arch.rotation.y = 0.5;
    room.add(arch);

    /* Floating frames (gold rectangles) */
    var frames = [];
    var frameSpecs = [
      { w: 1.5, h: 1.9, x: 2.5, y: 2.3, z: -2.2, ry: -0.35 },
      { w: 1.0, h: 1.25, x: 3.3, y: 1.7, z: -0.6, ry: -0.55 },
      { w: 0.85, h: 0.85, x: 1.7, y: 2.9, z: -3.0, ry: -0.2 }
    ];
    frameSpecs.forEach(function (s, i) {
      var f = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(s.w, s.h)),
        lineMat(0.55)
      );
      f.position.set(s.x, s.y, s.z);
      f.rotation.y = s.ry;
      f.userData.phase = i * 2.1;
      f.userData.baseY = s.y;
      frames.push(f);
      room.add(f);
    });

    /* Sofa — abstract matte volumes */
    var sofaMat = new THREE.MeshStandardMaterial({ color: 0x27211a, roughness: 0.95 });
    var sofa = new THREE.Group();
    var base = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.52, 1.1), sofaMat);
    base.position.y = 0.46;
    sofa.add(base);
    var back = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.62, 0.24), sofaMat);
    back.position.set(0, 1.0, -0.43);
    sofa.add(back);
    [-0.68, 0.68].forEach(function (x) {
      var cushion = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.95), sofaMat);
      cushion.position.set(x, 0.8, 0.04);
      sofa.add(cushion);
    });
    sofa.position.set(0.7, 0, 0.5);
    sofa.rotation.y = -0.12;
    room.add(sofa);

    /* Coffee table with brass rim */
    var table = new THREE.Group();
    var top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.05, 44),
      new THREE.MeshStandardMaterial({ color: 0x1c1812, roughness: 0.5, metalness: 0.1 })
    );
    top.position.y = 0.42;
    table.add(top);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.012, 10, 60), archMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.445;
    table.add(rim);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12), archMat);
    stem.position.y = 0.21;
    table.add(stem);
    table.position.set(-1.15, 0, 1.6);
    room.add(table);

    /* Rug */
    var rug = new THREE.Mesh(
      new THREE.CircleGeometry(1.95, 48),
      new THREE.MeshStandardMaterial({ color: 0x1d1710, roughness: 1 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.2, 0.012, 0.9);
    room.add(rug);

    /* Pendant light */
    var cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 1.55, 6),
      new THREE.MeshBasicMaterial({ color: 0x3a3226 })
    );
    cord.position.set(0, 4.0, 0);
    room.add(cord);
    var bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0 })
    );
    bulb.position.set(0, 3.2, 0);
    room.add(bulb);

    /* Lights */
    scene.add(new THREE.AmbientLight(0x59483a, 2.0));
    var warm = new THREE.PointLight(0xffbe8a, 28, 15, 1.7);
    warm.position.set(0, 3.1, 0.4);
    scene.add(warm);
    var rim2 = new THREE.DirectionalLight(0x8fa3c8, 1.1);
    rim2.position.set(-6, 6, -5);
    scene.add(rim2);

    /* Gold dust particles */
    var COUNT = isMobile ? 280 : 550;
    var positions = new Float32Array(COUNT * 3);
    for (var i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var pMat = new THREE.PointsMaterial({
      color: GOLD, size: 0.035, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    var dust = new THREE.Points(pGeo, pMat);
    scene.add(dust);

    function layout() {
      var aspect = window.innerWidth / window.innerHeight;
      camera.aspect = aspect;
      camera.fov = aspect < 0.8 ? 52 : 40;
      three.baseZ = aspect < 0.8 ? 12.4 : (aspect < 1.2 ? 10.6 : 8.8);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    layout();
    window.addEventListener('resize', layout);

    var clock = new THREE.Clock();

    function render() {
      var t = clock.getElapsedTime();
      var p = three.scrollProg;

      room.rotation.y = -0.42 + t * 0.028 + three.mouseX * 0.1 + p * 0.55;
      camera.position.z = three.baseZ - p * 2.4;
      camera.position.y = 2.0 + p * 1.15 + three.mouseY * -0.25;
      camera.position.x = three.mouseX * 0.55;
      camera.lookAt(0, 1.55, 0);

      frames.forEach(function (f) {
        f.position.y = f.userData.baseY + Math.sin(t * 0.7 + f.userData.phase) * 0.09;
        f.rotation.z = Math.sin(t * 0.4 + f.userData.phase) * 0.03;
      });
      bulb.position.y = 3.2 + Math.sin(t * 1.1) * 0.03;
      warm.position.y = 3.1 + Math.sin(t * 1.1) * 0.03;
      warm.intensity = 28 + Math.sin(t * 2.3) * 2.2;

      dust.rotation.y = t * 0.016;
      var pos = pGeo.attributes.position.array;
      for (var j = 0; j < COUNT; j++) {
        pos[j * 3 + 1] += 0.0035;
        if (pos[j * 3 + 1] > 9) { pos[j * 3 + 1] = 0; }
      }
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    if (reduceMotion) {
      render();
      /* the 'layout' resize listener clears the buffer — repaint after it */
      window.addEventListener('resize', function () { render(); });
      return;
    }

    three.running = true;
    function loop() {
      if (three.running) { render(); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', function () {
      three.running = !document.hidden;
    });

    if (finePointer) {
      window.addEventListener('mousemove', function (e) {
        three.targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
        three.targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
      });
      /* smooth the parallax */
      setInterval(function () {
        three.mouseX += ((three.targetMX || 0) - three.mouseX) * 0.06;
        three.mouseY += ((three.targetMY || 0) - three.mouseY) * 0.06;
      }, 16);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     Navigation, menu, form — always active
     ═══════════════════════════════════════════════════════════ */
  var smoother = null;

  function scrollToTarget(hash) {
    var el = hash === '#top' ? document.body : document.querySelector(hash);
    if (!el) { return; }
    if (smoother) {
      smoother.scrollTo(hash === '#top' ? 0 : el, true, 'top 84px');
    } else {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function initNav() {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 60);
    }, { passive: true });

    document.querySelectorAll('[data-nav-link]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var hash = link.getAttribute('href');
        if (!hash || hash.charAt(0) !== '#') { return; }
        e.preventDefault();
        closeMenu();
        scrollToTarget(hash);
      });
    });

    function closeMenu() {
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    burger.addEventListener('click', function () {
      var open = !burger.classList.contains('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      mobileMenu.classList.toggle('is-open', open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) { closeMenu(); }
    });
  }

  /* Projects section: show only items whose image files actually exist.
     Drop the images into assets/img/projects/project-1.jpg … project-5.jpg
     and they appear automatically; until then the section stays hidden. */
  function renumberKickers() {
    var nums = document.querySelectorAll('main .kicker .kicker-num');
    for (var i = 0; i < nums.length; i++) {
      nums[i].textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
    }
  }

  function initProjects() {
    var section = document.getElementById('projects');
    if (!section) { return; }
    var items = Array.prototype.slice.call(section.querySelectorAll('.gallery-item'));
    var remaining = items.length;
    function drop(item) {
      if (!item.parentNode) { return; }
      item.remove();
      remaining--;
      if (remaining === 0) {
        section.remove();
        document.querySelectorAll('a[href="#projects"]').forEach(function (a) { a.remove(); });
      } else if (remaining < items.length) {
        /* partial set — drop the 3+2 span pattern for an even grid */
        var grid = section.querySelector('.projects-grid');
        if (grid) { grid.classList.add('projects-grid--simple'); }
      }
      renumberKickers();
      if (window.ScrollTrigger) {
        ScrollTrigger.getAll().forEach(function (st) {
          if (st.trigger && !document.body.contains(st.trigger)) { st.kill(); }
        });
        ScrollTrigger.refresh();
      }
    }
    items.forEach(function (item) {
      var img = item.querySelector('img');
      var probe = new Image();
      probe.onerror = function () { drop(item); };
      probe.src = img.getAttribute('src');
    });
  }

  function initForm() {
    var form = document.getElementById('contactForm');
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.name.value || '').trim();
      var phone = (form.phone.value || '').trim();
      var msg = (form.message.value || '').trim();
      var text = 'היי טוני, אני ' + (name || '') + '.';
      if (phone) { text += '\nהטלפון שלי: ' + phone; }
      if (msg) { text += '\n' + msg; }
      text += '\nאשמח לשמוע עוד על תכנון ועיצוב הבית.';
      window.open('https://wa.me/972527728175?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     Cursor + magnetic + tilt (fine pointers only)
     ═══════════════════════════════════════════════════════════ */
  function initCursor() {
    if (!finePointer || !hasGSAP || reduceMotion) { return; }
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    var dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' });
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    var shown = false;
    window.addEventListener('mousemove', function (e) {
      if (!shown) { gsap.to([dot, ring], { opacity: 1, duration: 0.4 }); shown = true; }
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll('a, button, .tilt, input, textarea').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
    });
  }

  function initMagnetic() {
    if (!finePointer || !hasGSAP || reduceMotion) { return; }
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.28,
          y: (e.clientY - r.top - r.height / 2) * 0.28,
          duration: 0.5, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  function initTilt() {
    if (!finePointer || !hasGSAP || reduceMotion) { return; }
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        gsap.to(card, {
          rotationY: (px - 0.5) * -7,
          rotationX: (py - 0.5) * 7,
          transformPerspective: 900,
          duration: 0.6, ease: 'power2.out'
        });
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.9, ease: 'power3.out' });
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     Scroll experience (GSAP)
     ═══════════════════════════════════════════════════════════ */
  function initScroll() {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);

    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.15,
      smoothTouch: false
    });

    /* Hero: canvas camera follows scroll, content drifts out */
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: function (self) { three.scrollProg = self.progress; }
    });
    gsap.to('.hero-content', {
      yPercent: -16, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: '28% top', end: 'bottom top', scrub: true }
    });
    gsap.to('#scene', {
      opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '#approach', start: 'top 95%', end: 'top 35%', scrub: true }
    });

    /* Marquee — endless drift (RTL: track moves right) */
    var track = document.getElementById('marqueeTrack');
    var span = track.children[0];
    for (var c = 0; c < 3; c++) { track.appendChild(span.cloneNode(true)); }
    var spanW = span.offsetWidth;
    if (spanW > 0) {
      /* xPercent:25 = exactly one of the 4 identical copies — stays a perfect
         loop through webfont swaps and resizes; only the speed is retuned */
      var marqueeTween = gsap.to(track, { xPercent: 25, duration: spanW / 52, ease: 'none', repeat: -1 });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          var w = span.offsetWidth;
          if (w > 0) { marqueeTween.duration(w / 52); }
        });
      }
    }

    /* Statement + quote lines: brighten as they scroll in */
    gsap.utils.toArray('.statement, .quote-text').forEach(function (block) {
      gsap.fromTo(block.querySelectorAll('.st-line'),
        { opacity: 0.1, y: 26 },
        {
          opacity: 1, y: 0, stagger: 0.3, ease: 'none',
          scrollTrigger: { trigger: block, start: 'top 80%', end: 'top 34%', scrub: 1 }
        });
    });

    /* Generic reveals */
    var revealSelectors = [
      '.kicker', '.section-title', '.section-sub',
      '.approach-text p', '.pillar',
      '.service-card', '.swatch', '.gallery-item', '.quote-arch',
      '.contact-lead', '.contact-list li', '.contact-form',
      '.footer-inner > *'
    ].join(', ');
    gsap.utils.toArray(revealSelectors).forEach(function (el) {
      gsap.fromTo(el, { y: 44, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.15, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* Process: horizontal scroll on desktop */
    var mm = gsap.matchMedia();
    /* exact logical complement of the CSS (max-width: 860px) fallback —
       no fractional viewport width can fall between the two */
    mm.add('not all and (max-width: 860px)', function () {
      var ptrack = document.getElementById('processTrack');
      var bar = document.getElementById('processBar');
      var getDist = function () {
        return Math.max(0, ptrack.scrollWidth - window.innerWidth);
      };
      gsap.to(ptrack, {
        x: function () { return getDist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '.process',
          start: 'top top',
          end: function () { return '+=' + (getDist() + window.innerHeight * 0.35); },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            bar.style.width = (self.progress * 100) + '%';
          }
        }
      });
      return function () {};
    });

    /* Hero intro (after preloader) */
    var intro = gsap.timeline({ paused: true });
    intro
      .fromTo('.hero-title .line',
        { y: 90, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.35, stagger: 0.14, ease: 'power4.out' })
      .fromTo('.reveal-item',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, stagger: 0.12, ease: 'power3.out' }, '-=0.9')
      .fromTo('.nav',
        { y: -24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, '-=1.0');
    gsap.set('.hero-title .line', { opacity: 0 });
    gsap.set('.reveal-item', { opacity: 0 });

    /* Preloader exit */
    var exitTl = gsap.timeline({ delay: 1.75 });
    exitTl
      .to('.preloader-inner', { opacity: 0, y: -20, duration: 0.55, ease: 'power2.in' })
      .to('.curtain-a', { scaleY: 0, duration: 0.85, ease: 'power4.inOut' }, '-=0.1')
      .to('.curtain-b', { scaleY: 0, duration: 0.85, ease: 'power4.inOut' }, '<')
      .to('.preloader', { opacity: 0, duration: 0.4 }, '-=0.35')
      .set('.preloader', { display: 'none' })
      .add(function () { intro.play(); }, '-=1.1');
  }

  /* ═══════════════════════════════════════════════════════════
     Boot
     ═══════════════════════════════════════════════════════════ */
  function boot() {
    /* absolute failsafe first — never trap the user behind the preloader,
       even if anything below throws */
    setTimeout(function () {
      if (preloader && window.getComputedStyle(preloader).display !== 'none') {
        killPreloader();
        if (window.gsap) {
          gsap.set(['.hero-title .line', '.reveal-item', '.nav'], { clearProps: 'all', opacity: 1 });
        }
      }
    }, 7000);

    initNav();
    initForm();
    initProjects();
    renumberKickers();
    initThree();

    var hasScrollStack = hasGSAP && window.ScrollTrigger && window.ScrollSmoother && window.ScrollToPlugin;
    if (!hasScrollStack || reduceMotion) {
      killPreloader();
      return;
    }
    initScroll();
    initCursor();
    initMagnetic();
    initTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
