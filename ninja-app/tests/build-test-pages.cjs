// Writes index.test.html (general edition) and index.ninja.html (ninja-only edition) with a window.__eval hook so tests can read app state.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
module.exports = function build() {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const [name, flag] of [['index.test.html', 'false'], ['index.ninja.html', 'true']]) {
    // The test hook uses eval, so the test copies alone allow it.
    const s = src.replace('/*@ninja-only*/false', '/*@ninja-only*/' + flag).replace("script-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    const second = s.indexOf('<script>', s.indexOf('<script>') + 5), k = s.lastIndexOf('})();', second);
    fs.writeFileSync(path.join(ROOT, name), s.slice(0, k) + 'window.__eval = c => eval(c);\n' + s.slice(k));
  }
};
if (require.main === module) module.exports();
