// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'web-build/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'coverage/**',
      'test-results/**',
      'e2e/artifacts/**',
      // Deno code (Edge Functions) is checked with `deno check` / `deno test`.
      'supabase/functions/**',
    ],
  },
  {
    // jest.mock() factories must use require() (they are hoisted above imports).
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
