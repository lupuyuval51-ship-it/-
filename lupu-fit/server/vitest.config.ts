import { defineConfig } from 'vitest/config';
// PGlite + PBKDF2 integration tests are CPU heavy; give them room instead of flaking under parallel load.
export default defineConfig({ test: { testTimeout: 60_000, hookTimeout: 60_000 } });
