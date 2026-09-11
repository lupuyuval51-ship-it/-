import { initLang } from './i18n.js';
import { Game } from './game.js';
initLang();
const boot = () => { const game = new Game(document.getElementById('c')); window.__game = game; game.boot(); };
if (document.fonts?.ready) document.fonts.ready.then(boot, boot); else boot();
