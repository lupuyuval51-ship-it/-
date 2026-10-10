import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "node_modules/**", "legacy-demo/**", "src/generated/**", "next-env.d.ts", "playwright-report/**", "test-results/**", "android/**", "mobile/dist/**", "unity/**"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // The 3D runtime intentionally mutates three.js objects inside useFrame.
      "react-hooks/immutability": "off",
    },
  },
]);
