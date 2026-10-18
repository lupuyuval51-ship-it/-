import { initLang } from './i18n.js';
import { Game } from './game.js';
// While the loading screen is still up, a startup error (no WebGL, a shader that does not compile, out of memory) is written onto it, so a phone shows what went wrong instead of a spinner or a blank page.
const showFail = msg => { const l = document.getElementById('loading'); if (!l || l.hidden) return; const p = l.querySelector('p'), s = l.querySelector('.spinner'); if (s) s.style.display = 'none'; if (p) { p.style.direction = 'ltr'; p.style.padding = '0 20px'; p.style.wordBreak = 'break-word'; p.textContent = 'Could not start: ' + msg; } };
window.addEventListener('error', e => showFail(e.message || 'script error'));
window.addEventListener('unhandledrejection', e => showFail(String((e.reason && e.reason.message) || e.reason)));
initLang();
const boot = () => { try { const game = new Game(document.getElementById('c')); window.__game = game; game.boot(); } catch (e) { console.error(e); showFail(e && e.message ? e.message : String(e)); } };
if (document.fonts?.ready) document.fonts.ready.then(boot, boot); else boot();
