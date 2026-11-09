import fs from 'node:fs';import path from 'node:path';
const dist='dist';fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const f of ['server.js','package.json','.env.example','README.md','AGENTS.md'])if(fs.existsSync(f))fs.copyFileSync(f,path.join(dist,f));
for(const d of ['public','src','docs'])fs.cpSync(d,path.join(dist,d),{recursive:true});fs.mkdirSync(path.join(dist,'data','uploads'),{recursive:true});
fs.writeFileSync(path.join(dist,'data','db.json'),JSON.stringify({users:[]},null,2));
console.log('build: dist created');
