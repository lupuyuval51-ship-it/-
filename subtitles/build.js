/**
 * Assemble the whole application into one self-contained `index.html`.
 *
 *   node build.js [--check]
 *
 * The output has no external files: styles, the page script, and the engine
 * source all live inside it. Two source blocks are emitted as inert
 * `text/plain` scripts and turned into modules at runtime through blob URLs —
 * that is what lets the same engine code run either as a Web Worker or, when a
 * browser refuses to start one (a page opened straight from disk), inside the
 * page itself.
 *
 * `--check` verifies the committed index.html matches the sources instead of
 * writing it, so the two cannot drift apart unnoticed.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, 'src');
const output = path.join(root, 'index.html');

/** Imported by both the page and the engine, so it is embedded exactly once. */
const SHARED = ['config.js', 'languages.js', 'subtitles.js'];
/** Page-side modules, concatenated in dependency order. */
const PAGE = ['i18n.js', 'detect.js', 'translate.js', 'audio.js', 'app.js'];

const read = (file) => fs.readFile(path.join(src, file), 'utf8');

/** Drop the relative imports a file no longer needs once it is concatenated. */
function stripImports(code) {
  return code.replace(/^import[\s\S]*?from\s+'[^']*';\n/gm, '');
}

/** Turn a module into plain top-level code that can be concatenated. */
function stripModuleSyntax(code) {
  return stripImports(code).replace(/^export\s+/gm, '');
}

function exportedNames(code) {
  return [...code.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map(
    (match) => match[1],
  );
}

/** A script element ends at the first `</script`, wherever it appears. */
function assertEmbeddable(code, label) {
  if (/<\/script/i.test(code)) throw new Error(`${label} contains "</script" and cannot be inlined`);
}

export async function buildPage() {
  const styles = await read('styles.css');
  const template = await read('template.html');

  const sharedParts = await Promise.all(SHARED.map(read));
  const sharedSource = sharedParts.join('\n');
  const names = sharedParts.flatMap(exportedNames);

  // The engine keeps its exports: the in-page fallback imports createEngine from it.
  const engineSource = stripImports(await read('engine.js'));
  const pageParts = await Promise.all(PAGE.map(read));

  const prelude = `/* The shared module, imported from the single copy embedded below. */
const SHARED_SOURCE = document.getElementById('shared-source').textContent;
const { ${names.join(', ')} } =
  await import(URL.createObjectURL(new Blob([SHARED_SOURCE], { type: 'text/javascript' })));
`;
  const pageSource = [prelude, ...pageParts.map(stripModuleSyntax)].join('\n');

  assertEmbeddable(sharedSource, 'shared module');
  assertEmbeddable(engineSource, 'engine');
  assertEmbeddable(pageSource, 'page script');

  const scripts = [
    '  <script id="shared-source" type="text/plain">',
    sharedSource,
    '  </script>',
    '',
    '  <script id="engine-source" type="text/plain">',
    engineSource,
    '  </script>',
    '',
    '  <script type="module">',
    pageSource,
    '  </script>',
  ].join('\n');

  return template.replace('<!--STYLES-->', styles.trimEnd()).replace('<!--SCRIPTS-->', scripts);
}

export const OUTPUT_PATH = output;

// Only build when run as a command; the tests import buildPage directly.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const page = await buildPage();
  if (process.argv.includes('--check')) {
    const current = await fs.readFile(output, 'utf8').catch(() => '');
    if (current !== page) {
      console.error('index.html is out of date — run: node build.js');
      process.exit(1);
    }
    console.log('index.html is up to date');
  } else {
    await fs.writeFile(output, page);
    console.log(`index.html written (${(Buffer.byteLength(page) / 1024).toFixed(0)} KB)`);
  }
}
