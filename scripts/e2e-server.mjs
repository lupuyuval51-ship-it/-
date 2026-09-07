#!/usr/bin/env node
/**
 * E2E web server: builds when .next is missing (or E2E_FRESH_BUILD=1), wipes the PGlite directory so every run
 * starts from an empty database, then runs `next start -p $PORT` and forwards signals.
 * Used by playwright.config.ts: PORT=3100 PGLITE_DATA_DIR=./data/pglite-e2e node scripts/e2e-server.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || process.env.E2E_PORT || "3100";
const dataDir = path.resolve(root, process.env.PGLITE_DATA_DIR || "./data/pglite-e2e");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const env = {
  ...process.env,
  NODE_ENV: "production",
  PORT: String(port),
  PGLITE_DATA_DIR: dataDir,
  DATABASE_URL: "",
  SESSION_SECRET: process.env.SESSION_SECRET || "e2e-session-secret",
  NEXT_TELEMETRY_DISABLED: "1",
};

const needsBuild = process.env.E2E_FRESH_BUILD === "1" || !fs.existsSync(path.join(root, ".next", "BUILD_ID"));
if (needsBuild) {
  console.log(`[e2e-server] building (${process.env.E2E_FRESH_BUILD === "1" ? "E2E_FRESH_BUILD=1" : ".next missing"})…`);
  const build = spawnSync(process.execPath, [nextBin, "build"], { cwd: root, stdio: "inherit", env });
  if (build.status !== 0) {
    console.error(`[e2e-server] build failed with code ${build.status}`);
    process.exit(build.status ?? 1);
  }
}

fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });
console.log(`[e2e-server] fresh database at ${dataDir}; starting on port ${port}`);

const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], { cwd: root, stdio: "inherit", env });

const forward = (signal) => {
  if (!child.killed) child.kill(signal);
};
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => forward(signal));
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
