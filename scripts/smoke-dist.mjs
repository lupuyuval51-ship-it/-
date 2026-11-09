import { spawn } from 'node:child_process';import fs from 'node:fs';
for(const f of ['dist/server.js','dist/public/index.html','dist/public/app.js','dist/public/game.js','dist/src/config.js'])if(!fs.existsSync(f))throw new Error(`missing ${f}`);
const port=34000+Math.floor(Math.random()*1000),child=spawn(process.execPath,['server.js'],{cwd:'dist',env:{...process.env,PORT:String(port)},stdio:'ignore'});let ok=false;
for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,100));try{const x=await fetch(`http://127.0.0.1:${port}/api/health`);if(x.ok){ok=true;break}}catch{}}
child.kill('SIGTERM');if(!ok)throw new Error('dist server did not become healthy');console.log('dist smoke: healthy');
