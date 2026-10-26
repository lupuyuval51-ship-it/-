// Runs every suite against fresh test pages and prints one line per suite. Usage: node tests/run.cjs [name ...]
const { spawnSync } = require('child_process'), path = require('path'), fs = require('fs');
const build = require('./build-test-pages.cjs');
const ALL = ['ready-workouts', 'weights-and-search', 'injuries-readiness', 'language', 'strength', 'resume-workout', 'food', 'teen-safety', 'injury-personalization', 'week-flow', 'nutrition-targets', 'course-language', 'paged-lists', 'ninja-edition', 'ninja-migration', 'crawl', 'stress'];
const want = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
let bad = 0;
for (const name of want) {
  build();
  const r = spawnSync('node', [path.join(__dirname, name + '.cjs')], { encoding: 'utf8', timeout: 600000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const failed = r.status !== 0 || /^FAIL\b|\bFAILED\b|Unhandled|TypeError|ReferenceError|PROBLEMS:|hard failures [1-9]/m.test(out);
  const passes = (out.match(/^PASS/gm) || []).length;
  console.log((failed ? 'FAIL ' : 'ok   ') + name.padEnd(9) + (passes ? passes + ' checks' : ''));
  if (failed) { bad++; console.log(out.split('\n').filter(l => /FAIL|Error|PROBLEMS|failures/.test(l)).slice(0, 6).join('\n')); }
}
for (const f of ['index.test.html', 'index.ninja.html']) fs.rmSync(path.join(__dirname, '..', f), { force: true });
console.log(bad ? bad + ' suite(s) failed' : 'all ' + want.length + ' suites passed');
process.exit(bad ? 1 : 0);
