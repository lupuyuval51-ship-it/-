#!/usr/bin/env node
/** Compile only service/unit test dependencies, then use Node's native test runner. */
import { mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { dirname, delimiter, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testRoot = join(projectRoot, 'tests');
const testFiles = readdirSync(testRoot, { withFileTypes: true })
  .filter(file => file.isFile() && file.name.endsWith('.test.ts'))
  .map(file => join(testRoot, file.name)).sort();
if (!testFiles.length) throw new Error('No tests/*.test.ts files found.');
const workRoot = resolve(process.env.LEVELUP_TEST_WORK_DIR || join(projectRoot, 'work', 'test-runs'));
mkdirSync(workRoot, { recursive: true });
const outputDirectory = mkdtempSync(join(workRoot, 'run-'));
const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  rootDir: projectRoot,
  outDir: outputDirectory,
  strict: true,
  skipLibCheck: true,
  esModuleInterop: true,
  resolveJsonModule: true,
  noEmitOnError: true,
  types: ['node'],
  typeRoots: [join(projectRoot, 'node_modules', '@types')],
};
const program = ts.createProgram(testFiles, compilerOptions);
const emit = program.emit();
const diagnostics = ts.getPreEmitDiagnostics(program).concat(emit.diagnostics);
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => projectRoot,
    getNewLine: () => '\n',
  }));
}
if (emit.emitSkipped || diagnostics.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) {
  process.exitCode = 1;
} else {
  const emittedTests = testFiles.map(file => join(outputDirectory, relative(projectRoot, file)).replace(/\.ts$/, '.js'));
  const environment = { ...process.env };
  // Tests must never send real mail, spend AI credits, or use deployment prices/credentials.
  for (const key of Object.keys(environment)) {
    if (/^(AI_|SMTP_|MAIL_FROM$|BIT_PAYMENT_|BASIC_MONTHLY_PRICE_NIS$|PLUS_MONTHLY_PRICE_NIS$|PRO_MONTHLY_PRICE_NIS$)/.test(key)) delete environment[key];
  }
  Object.assign(environment, {
    NODE_ENV: 'test', DEMO_MODE: 'true', APP_URL: 'http://localhost:3000',
    NODE_PATH: [join(projectRoot, 'node_modules'), environment.NODE_PATH].filter(Boolean).join(delimiter),
    LEVELUP_DB_PATH: ':memory:',
  });
  console.log(`Compiled ${emittedTests.length} test files. Running isolated service and content checks.`);
  const child = spawnSync(process.execPath, ['--test', ...emittedTests], {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
  });
  if (child.error) console.error(child.error.message);
  process.exitCode = child.status ?? 1;
}
