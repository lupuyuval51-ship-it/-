import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const files=['server.js','public/app.js','public/game.js',...fs.readdirSync('src').filter(x=>x.endsWith('.js')).map(x=>'src/'+x)];
for(const f of files){const r=spawnSync(process.execPath,['--check',f],{stdio:'inherit'});if(r.status)process.exit(r.status)}
console.log(`typecheck/syntax: ${files.length} modules OK`);
