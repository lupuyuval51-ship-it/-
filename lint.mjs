import fs from 'node:fs';
import path from 'node:path';
const roots=['server.js','public','src'];let bad=[];
function walk(p){const st=fs.statSync(p);if(st.isDirectory())for(const x of fs.readdirSync(p))walk(path.join(p,x));else if(/\.(js|css|html)$/.test(p)){const s=fs.readFileSync(p,'utf8');if(/Lorem ipsum/i.test(s))bad.push(`${p}: lorem ipsum`);if(/javascript:/i.test(s))bad.push(`${p}: javascript URL`);if(/TODO.*(security|auth|payment)/i.test(s))bad.push(`${p}: critical TODO`);if(s.includes('0526262828')&&p!=='src/config.js')bad.push(`${p}: bit phone must be centralized`)}}
for(const r of roots)walk(r);if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('lint: release scan OK');
