#!/usr/bin/env node
// Builds ONE self-contained HTML file (hogwarts-game.html) from:
//   index.html            (Night Courtyard survival mode)
//   story.html + story/*  (Eldermoor story mode)
//   tools/three.r128.min.js (inlined once, so the file works offline)
// Usage: node tools/build-single.cjs   (run from anywhere)
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const CDN_TAG = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';

function guardScript(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}

function inlineLocalScripts(html) {
  return html.replace(/<script src="(story\/[^"]+\.js)"><\/script>/g, (m, src) =>
    '<script>\n' + guardScript(read(src)) + '\n</script>');
}

// Capture-phase bridge: lets the embedded pages ask the launcher to switch mode.
const BRIDGE = `<script>(function(){
  function go(to){ try { window.parent.postMessage({ hpGo: to }, '*'); } catch (e) {} }
  if (window.parent === window) return;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#storyBtn')) { e.stopImmediatePropagation(); e.preventDefault(); go('story'); return; }
    if (t.closest('a[href="index.html"]')) { e.stopImmediatePropagation(); e.preventDefault(); go('courtyard'); return; }
  }, true);
})();</script>`;

function prepare(html) {
  if (!html.includes(CDN_TAG)) throw new Error('three CDN tag not found');
  html = inlineLocalScripts(html);
  // placeholder is replaced at runtime with the shared inlined three.js
  html = html.replace(CDN_TAG, '<!--THREE-->');
  return html.replace('</body>', BRIDGE + '\n</body>');
}

const courtyard = prepare(read('index.html'));
const story = prepare(read('story.html'));
const three = read('tools/three.r128.min.js');

// Safe embedding inside <script type="application/json">
const embed = (s) => JSON.stringify(s)
  .replace(/</g, '\\u003c')
  .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
  .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029');

const out = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>עולם הקוסמים 3D · Wizard World 3D</title>
<style>
  :root { --bg:#070a14; --gold:#e8c66a; --ink:#f3ead2; --card:#111830; --line:#3a4570; }
  * { box-sizing: border-box; }
  html, body { margin:0; height:100%; background:var(--bg); color:var(--ink); font-family: Georgia, 'Times New Roman', 'David', serif; }
  body { overflow:hidden; }
  #launcher { position:fixed; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:22px; padding:20px 16px; overflow:auto;
    background: radial-gradient(ellipse at 50% 20%, #1b2750 0%, #0a0f22 55%, #05070f 100%); }
  #launcher h1 { margin:0; font-size:clamp(26px,5vw,48px); color:var(--gold); text-shadow:0 0 24px rgba(232,198,106,.45); text-align:center; letter-spacing:.5px; }
  #launcher .sub { margin:0; opacity:.8; text-align:center; max-width:640px; line-height:1.5; }
  .cards { display:flex; flex-wrap:wrap; gap:18px; justify-content:center; width:100%; max-width:900px; }
  .card { flex:1 1 300px; max-width:420px; background:linear-gradient(180deg,#141d3d,#0d132b); border:1px solid var(--line); border-radius:16px; padding:22px 20px; cursor:pointer; text-align:center; color:inherit; font:inherit;
    transition: transform .15s, border-color .15s, box-shadow .15s; }
  .card:hover, .card:focus-visible { transform: translateY(-3px); border-color:var(--gold); box-shadow:0 8px 30px rgba(232,198,106,.18); outline:none; }
  .card .ico { font-size:42px; }
  .card h2 { margin:8px 0 6px; color:var(--gold); font-size:22px; }
  .card p { margin:0; opacity:.82; line-height:1.5; font-size:15px; }
  .card .tag { display:inline-block; margin-top:12px; padding:3px 10px; border:1px solid var(--line); border-radius:999px; font-size:12px; opacity:.85; }
  .note { opacity:.6; font-size:13px; text-align:center; max-width:640px; line-height:1.5; }
  #stage { position:fixed; inset:0; display:none; background:#000; }
  #stage iframe { position:absolute; inset:0; width:100%; height:100%; border:0; background:#000; }
  #home { position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:5; display:none; padding:6px 14px; border-radius:999px;
    background:rgba(10,14,32,.85); color:var(--gold); border:1px solid var(--line); cursor:pointer; font:inherit; font-size:14px; }
  #home:hover { border-color:var(--gold); }
</style>
</head>
<body>
<div id="launcher">
  <h1>🪄 עולם הקוסמים 3D<br><span style="font-size:.55em;opacity:.8">Wizard World 3D</span></h1>
  <p class="sub">שני משחקים בקובץ אחד · Two games in one file</p>
  <div class="cards">
    <button class="card" id="goStory" type="button">
      <div class="ico">🏰</div>
      <h2>אלדרמור: הפנס התשיעי<br><small style="font-size:.6em;opacity:.8">Eldermoor: The Ninth Lantern</small></h2>
      <p>מצב סיפור מלא: נכנסים לטירה, פוגשים דמויות, לומדים לחשים ומגיעים אל הסוף.<br>Full story mode: enter the castle, meet characters, learn spells, reach the end.</p>
      <span class="tag">7 פרקים · 7 chapters</span>
    </button>
    <button class="card" id="goCourtyard" type="button">
      <div class="ico">🌙</div>
      <h2>חצר הלילה<br><small style="font-size:.6em;opacity:.8">Night Courtyard</small></h2>
      <p>הישרדות בגוף ראשון: גלי דמנטורים, לחשים, פטרונוס וסניץ' זהב.<br>First-person survival: waves of Dementors, spells, Patronus and a Golden Snitch.</p>
      <span class="tag">ארקייד · Arcade</span>
    </button>
  </div>
  <p class="note">צריך דפדפן עם WebGL. עכבר + מקלדת מומלצים. · Needs a WebGL browser. Mouse + keyboard recommended.</p>
</div>
<div id="stage"></div>
<button id="home" type="button">⌂ תפריט ראשי · Main menu</button>

<script type="application/json" id="d-three">${embed(three)}</script>
<script type="application/json" id="d-courtyard">${embed(courtyard)}</script>
<script type="application/json" id="d-story">${embed(story)}</script>
<script>
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var DOCS = {};
  function load(id) { if (!DOCS[id]) DOCS[id] = JSON.parse($('d-' + id).textContent); return DOCS[id]; }
  var launcher = $('launcher'), stage = $('stage'), home = $('home');
  var frame = null, watch = 0;

  function launch(mode) {
    stop();
    var three = load('three');
    var html = load(mode === 'story' ? 'story' : 'courtyard').replace('<!--THREE-->', function () {
      return '<script>' + three.replace(/<\\/script/gi, '<\\\\/script') + '<\\/script>';
    });
    frame = document.createElement('iframe');
    frame.setAttribute('allow', 'autoplay; fullscreen; pointer-lock');
    frame.setAttribute('title', mode);
    frame.srcdoc = html;
    stage.appendChild(frame);
    launcher.style.display = 'none';
    stage.style.display = 'block';
    home.style.display = 'none';
    frame.addEventListener('load', function () { try { frame.contentWindow.focus(); } catch (e) {} });
    // show the "main menu" button only while the mouse is free (pointer not locked)
    watch = setInterval(function () {
      var locked = false;
      try { locked = !!(frame && frame.contentDocument && frame.contentDocument.pointerLockElement); } catch (e) {}
      home.style.display = locked ? 'none' : 'block';
    }, 400);
  }
  function stop() {
    if (watch) { clearInterval(watch); watch = 0; }
    if (frame) { try { frame.srcdoc = ''; } catch (e) {} frame.remove(); frame = null; }
  }
  function toMenu() {
    stop();
    stage.style.display = 'none';
    home.style.display = 'none';
    launcher.style.display = 'flex';
    try { if (document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
  }

  $('goStory').addEventListener('click', function () { launch('story'); });
  $('goCourtyard').addEventListener('click', function () { launch('courtyard'); });
  home.addEventListener('click', toMenu);
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!frame || e.source !== frame.contentWindow || !d || !d.hpGo) return;
    launch(d.hpGo === 'story' ? 'story' : 'courtyard');
  });
  // deep links: hogwarts-game.html#story / #courtyard
  var h = (location.hash || '').replace('#', '');
  if (h === 'story' || h === 'courtyard') launch(h);
})();
</script>
</body>
</html>
`;

const target = path.join(root, 'hogwarts-game.html');
fs.writeFileSync(target, out);
console.log('wrote', target, (out.length / 1024).toFixed(0) + ' KB');
