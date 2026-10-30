// Runs the API server (tsx watch) and the Vite dev server together.
import { spawn } from 'node:child_process';

const procs = [
  spawn('npm', ['run', 'dev:server'], { stdio: 'inherit', env: { ...process.env, PORT: process.env.PORT ?? '3000' } }),
  spawn('npm', ['run', 'dev:client'], { stdio: 'inherit', env: process.env }),
];
const stop = () => procs.forEach((p) => p.kill('SIGTERM'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const p of procs) p.on('exit', (code) => { if (code) { stop(); process.exit(code); } });
