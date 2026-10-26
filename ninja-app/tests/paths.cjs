// Shared locations for the test suites. The generated pages sit next to index.html so relative media (videos/, ex/, icons/) resolve.
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const url = f => 'file://' + path.join(ROOT, f);
module.exports = { ROOT, APP: url('index.html'), FIT: url('index.test.html'), NINJA: url('index.ninja.html'), dir: ROOT + '/' };
