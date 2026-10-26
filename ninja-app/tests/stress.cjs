const P = require('./paths.cjs');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(P.FIT);await p.waitForTimeout(600);
const ev=(fn,a)=>p.evaluate(([s,a])=>window.__eval('('+s+')')(a),[fn.toString(),a]);
const res=await ev(()=>{
  const out={n:0,fail:[],ests:[],emptyBy:{}};
  const eqs={home:['towel'],db:['towel','weights','box'],gym:['bar','box','weights','towel','rope','barbell','machine','cardiom','band'],ninja:PLACE_EQ.ninja.concat(['weights'])};
  const lims=[[],[['knee',2]],[['shoulder',2],['wrist',2]],[['back',2],['hip',1]]];
  for (const track of ['general','muscle','lean','athlete','ninja']) for (const days of [2,3,4,5,6]) for (const minutes of [20,30,45,60]) for (const level of [0,3]) for (const eqk of Object.keys(eqs)) for (const lm of lims) for (const age of [0,2,4]) {
    const limits=lm.map(x=>x[0]), limLv=Object.fromEntries(lm);
    const P={name:'',age,exp:1,goal:0,track,ninja:track==='ninja',places:['home'],equip:eqs[eqk],pull:2,hang:1,push:1,strength:5,strengths:[],focus:track==='ninja'?['grip']:['abs','glutes'],days:[0,1,2,3,4,5].slice(0,days).map((x,i)=>i),minutes,limits,limLv,level:Math.min(level,age===0?1:3),startTs:weekStart(Date.now()),createdTs:1,adapt:{}};
    S.profile=P; const plan=planOf(P);
    for (const week of [1,2]) for (const ty of plan) {
      out.n++;
      let s; try { s=buildSession(P,ty,week);} catch(e){ out.fail.push(['throw',track,ty,e.message]); continue; }
      const main=s.blocks.filter(x=>x.k==='main'||x.k==='circuit'||x.k==='focus').flatMap(x=>x.items);
      const all=s.blocks.flatMap(x=>x.items);
      const key=track+'/'+ty+'/'+eqk;
      if (main.length<2 && ty!=='F') { out.emptyBy[key]=(out.emptyBy[key]||0)+1; }
      for (const it of all){ const ex=EX[it.ex]; if(!ex){out.fail.push(['noex',it.ex]);continue;} if(blocked(ex,P)) out.fail.push(['blocked',track,ty,it.ex,limits.join('+'),'age'+age]); if(!(it.amt>0&&it.sets>=1)) out.fail.push(['badDose',it.ex,it.sets,it.amt]); }
      out.ests.push(s.est);
    }
  }
  return out;
});
const e=res.ests.sort((a,b)=>a-b);
console.log('sessions built',res.n,'| est min/median/max',e[0],e[Math.floor(e.length/2)],e[e.length-1]);
console.log('hard failures',res.fail.length,JSON.stringify(res.fail.slice(0,8)));
const eb=Object.entries(res.emptyBy).sort((a,b)=>b[1]-a[1]);console.log('combos with <2 main items',eb.length);console.log(eb.slice(0,25).map(x=>x.join(':')).join('  '));
console.log('errs',errs);await b.close()})();
