import globals from 'globals';
// The app script is extracted from index.html by tools/lint.mjs into tools/lint-target.js before linting.
export default [{
  files: ['tools/lint-target.js'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, claude: 'readonly' } },
  rules: { 'no-undef': 'error', 'no-dupe-keys': 'error', 'no-redeclare': 'error', 'no-unreachable': 'error', 'no-self-assign': 'error', 'no-const-assign': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['warn', { allowEmptyCatch: true }] }
}];
