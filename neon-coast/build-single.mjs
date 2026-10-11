// Bundles the whole game into one self-contained HTML file that runs from file://
// (no server, no modules, no network). Usage: node build-single.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// ---------- vendored Three.js: two ES modules, minified, with their own top-level names ----------
const parseExportEntries = list => list.split(',').map(e => e.trim()).filter(Boolean).map(e => {
  const m = e.match(/^(\S+)\s+as\s+(\S+)$/); return m ? [m[1], m[2]] : [e, e]; // [localName, exportedName]
});
const objectLiteral = pairs => '{' + pairs.map(([local, exp]) => `${JSON.stringify(exp)}:${local}`).join(',') + '}';

function wrapThreeCore() {
  const src = read('vendor/three.core.min.js');
  if (/export\s*\{[^}]*\}\s*from/.test(src)) throw new Error('three.core: unexpected re-export');
  const m = src.match(/export\{([^}]*)\};?\s*$/);
  if (!m) throw new Error('three.core: export list not found');
  const body = src.slice(0, m.index);
  return `const __threeCore = (function(){\n${body}\nreturn ${objectLiteral(parseExportEntries(m[1]))};\n})();`;
}
function wrapThreeModule() {
  const src = read('vendor/three.module.min.js');
  const imp = src.match(/import\{([^}]*)\}from"\.\/three\.core\.min\.js";?/);
  if (!imp) throw new Error('three.module: import of three.core not found');
  // import entries are written exported-name [as local-name]
  const bindings = imp[1].split(',').map(e => e.trim()).filter(Boolean).map(e => {
    const m = e.match(/^(\S+)\s+as\s+(\S+)$/); return m ? [m[1], m[2]] : [e, e]; // [exportedName, localName]
  });
  let body = src.slice(0, imp.index) + src.slice(imp.index + imp[0].length);
  // three re-exports part of core with `export{...}from"./three.core.min.js"`; that form has to
  // be stripped before the plain one, or the dangling `from` clause stays behind.
  const exported = [], reexported = [];
  body = body.replace(/export\{([^}]*)\}\s*from\s*"[^"]*";?/g, (_, list) => { reexported.push(...parseExportEntries(list)); return ''; });
  body = body.replace(/export\{([^}]*)\};?/g, (_, list) => { exported.push(...parseExportEntries(list)); return ''; });
  if (!exported.length) throw new Error('three.module: no export list found');
  if (/\bimport\s*[{*"']|\bexport\s*[{*]/.test(body)) throw new Error('three.module: module syntax left in body');
  const destructure = '{' + bindings.map(([exp, local]) => `${JSON.stringify(exp)}:${local}`).join(',') + '}';
  return `const __three = (function(){\nconst ${destructure} = __threeCore;\n${body}\nreturn Object.assign({}, __threeCore, ${objectLiteral(exported)});\n})();`;
}

// ---------- the game's own modules ----------
const IMPORT_RE = /^import\s+(?:\*\s+as\s+(\w+)|\{([^}]*)\})\s+from\s+'([^']+)';?$/;
const moduleVar = file => '__m_' + path.basename(file, '.js').replace(/\W/g, '_');

function readModule(file) {
  const src = read('src/' + file);
  const deps = [], lines = [], exports = [];
  for (const line of src.split('\n')) {
    const im = line.match(IMPORT_RE);
    if (im) {
      const [, star, named, spec] = im;
      if (spec.includes('three.module.min.js')) { lines.push(`const ${star} = __three;`); continue; }
      const dep = path.basename(spec);
      deps.push(dep);
      lines.push(`const {${named.split(',').map(n => n.trim()).filter(Boolean).join(', ')}} = ${moduleVar(dep)};`);
      continue;
    }
    const ex = line.match(/^export\s+(const|let|class|function)\s+([A-Za-z_$][\w$]*)/);
    if (ex) { exports.push(ex[2]); lines.push(line.replace(/^export\s+/, '')); continue; }
    if (/^export\s/.test(line)) throw new Error(`unsupported export form in ${file}: ${line}`);
    lines.push(line);
  }
  return { file, deps, exports, body: lines.join('\n') };
}

function order(entry) {
  const seen = new Map(), out = [], visiting = new Set();
  const visit = f => {
    if (seen.has(f)) return; if (visiting.has(f)) throw new Error('import cycle at ' + f);
    visiting.add(f);
    const m = readModule(f); seen.set(f, m);
    for (const d of m.deps) visit(d);
    visiting.delete(f); out.push(m);
  };
  visit(entry);
  return out;
}

const modules = order('main.js');
const entry = modules[modules.length - 1];
const js = [
  wrapThreeCore(), wrapThreeModule(),
  ...modules.slice(0, -1).map(m => `const ${moduleVar(m.file)} = (function(){\n${m.body}\nreturn {${m.exports.join(', ')}};\n})();`),
  `(function(){\n${entry.body}\n})();`,
].join('\n');

// ---------- page ----------
const html = read('index.html');
const css = read('styles.css');
const headExtra = (html.match(/<link rel="preconnect"[^>]*>/) || [''])[0] + '\n'
  + (html.match(/<link rel="stylesheet" href="https:[^>]*>/) || [''])[0];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
  .replace(/\s*<script type="module"[^>]*><\/script>/, '').trim();
const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'Neon Coast'])[1];

const head = `<title>${title}</title>\n${headExtra}\n<style>\n${css}\n</style>`;
const content = `${body}\n<script>\n${js}\n</script>`;
// the Artifact host supplies its own document shell, so that build is head-bits + content
const page = `${head}\n${content}\n`;
const standalone = [
  '<!doctype html>', '<html lang="he" dir="rtl">', '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">',
  '<meta name="theme-color" content="#0b0f1e">',
  head, '</head>', '<body>', content, '</body>', '</html>', '',
].join('\n');

fs.writeFileSync(path.join(root, 'neon-coast.html'), standalone);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/artifact.html'), page);
const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log(`modules: ${modules.length}  →  neon-coast.html ${kb(standalone.length)}  (js ${kb(js.length)}, css ${kb(css.length)})`);
console.log('order:', modules.map(m => m.file).join(' → '));
