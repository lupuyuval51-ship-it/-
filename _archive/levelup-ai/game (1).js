const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];

function createRenderer(canvas,lowQuality=false){
  const gl=canvas.getContext('webgl',{antialias:!lowQuality,alpha:false,powerPreference:lowQuality?'low-power':'high-performance'});
  if(!gl)return null;
  const vs=`attribute vec3 p;attribute vec3 c;varying vec3 v;void main(){v=c;gl_Position=vec4(p,1.0);}`;
  const fs=`precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,1.0);}`;
  const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const pos=gl.createBuffer(),col=gl.createBuffer(),pa=gl.getAttribLocation(program,'p'),ca=gl.getAttribLocation(program,'c');
  gl.enableVertexAttribArray(pa);gl.enableVertexAttribArray(ca);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  const cube=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const faces=[[0,1,2,0,2,3],[5,4,7,5,7,6],[4,0,3,4,3,7],[1,5,6,1,6,2],[3,2,6,3,6,7],[4,5,1,4,1,0]];
  const local=faces.flatMap(f=>f.map(i=>cube[i]));
  function render(camera,objects,bg=[.035,.045,.07]){
    const positions=[],colors=[],aspect=Math.max(.4,canvas.width/canvas.height),f=1/Math.tan(Math.PI/6),cy=Math.cos(-camera.yaw),sy=Math.sin(-camera.yaw);
    for(const o of objects){const [ox,oy,oz,sx,syScale,sz,color,ry=0]=o,cr=Math.cos(ry),sr=Math.sin(ry);for(const v of local){let lx=v[0]*sx,lz=v[2]*sz;const rx=lx*cr-lz*sr,rz=lx*sr+lz*cr;let dx=ox+rx-camera.x,dy=oy+v[1]*syScale-camera.y,dz=oz+rz-camera.z;const vx=dx*cy-dz*sy,vz=dx*sy+dz*cy;if(vz<.12){positions.push(9,9,1);colors.push(...color);continue}positions.push(clamp((vx/vz)*f/aspect,-4,4),clamp((dy/vz)*f,-4,4),clamp(vz/60*2-1,-.99,.99));colors.push(...color)}}
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(bg[0],bg[1],bg[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.DYNAMIC_DRAW);gl.vertexAttribPointer(pa,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,col);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.DYNAMIC_DRAW);gl.vertexAttribPointer(ca,3,gl.FLOAT,false,0,0);
    gl.drawArrays(gl.TRIANGLES,0,positions.length/3);
  }
  return {gl,render};
}

const palettes={
  'future-city':{bg:[.03,.045,.09],floor:[.07,.11,.18],main:[.20,.43,.96],accent:[.18,.72,.55],danger:[.82,.29,.32]},
  'sky-island':{bg:[.18,.35,.55],floor:[.25,.42,.34],main:[.86,.90,.96],accent:[.98,.72,.28],danger:[.72,.32,.34]},
  'ai-lab':{bg:[.035,.06,.07],floor:[.08,.14,.15],main:[.20,.72,.68],accent:[.35,.55,.95],danger:[.84,.34,.34]},
  'mystery-castle':{bg:[.055,.045,.065],floor:[.15,.14,.18],main:[.40,.36,.48],accent:[.78,.62,.28],danger:[.65,.24,.27]},
  'light-cubes':{bg:[.025,.025,.045],floor:[.07,.07,.12],main:[.38,.48,.95],accent:[.25,.82,.72],danger:[.9,.32,.45]}
};

function modeObjects(game,palette,player,qIndex,bossHp){
  const out=[],m=game.gameMode;
  if(m==='escape-room'){
    out.push([0,-.2,7,4,.12,6,palette.floor],[0,1.8,13,4,2,.12,palette.main],[-4,1.8,7,.12,2,6,palette.main],[4,1.8,7,.12,2,6,palette.main],[0,3.8,7,4,.12,6,palette.main]);
    for(let i=0;i<5;i++)out.push([-2.7+i*1.35,.45,5+(i%2)*3,.28,.28,.28,i<qIndex?palette.accent:palette.main]);
    out.push([0,1.3,12.75,1.2,1.5,.16,qIndex>=game.questions.length?palette.accent:palette.danger]);
  }else if(m==='collect-sort'){
    out.push([0,-.15,12,6,.12,18,palette.floor]);
    for(let i=0;i<18;i++){const z=2+i*1.7,x=((i*17)%5-2)*1.15;out.push([x,.45,z,.24,.24,.24,i%3===0?palette.accent:i%3===1?palette.main:palette.danger,i*.23])}
  }else if(m==='build-path'){
    for(let i=0;i<8;i++){const z=2+i*3.3,unlocked=i<=qIndex+1;out.push([0,-.12,z,unlocked?2.2:.65,.12,1.25,unlocked?palette.accent:palette.floor])}
    for(let i=0;i<9;i++)out.push([i%2?-3.1:3.1,.7,2+i*3,.22,.8,.22,palette.main]);
  }else if(m==='boss-quiz'){
    out.push([0,-.15,7,6,.12,10,palette.floor]);out.push([0,1.2,12,1.2+bossHp/100,1.4+bossHp/80,1.2+bossHp/100,palette.danger,performance.now()/2500]);
    for(let i=0;i<8;i++)out.push([Math.cos(i*Math.PI/4)*4,.35,7+Math.sin(i*Math.PI/4)*4,.18,.3,.18,palette.accent]);
  }else{
    out.push([0,-.15,12,6,.12,18,palette.floor]);
    for(let i=0;i<5;i++){const z=i*6+5;out.push([-1.6,1.1,z,.9,1.5,.18,palette.accent]);out.push([1.6,1.1,z,.9,1.5,.18,palette.danger])}
    for(let i=0;i<14;i++){const z=i*2.4+1;out.push([-3.2,.6,z,.12,.7,1,palette.main]);out.push([3.2,.6,z,.12,.7,1,palette.main])}
  }
  out.push([player.x,player.y,player.z,.28,.55,.28,[.32,.55,1]]);return out;
}

function questionOverlay(stage,game,q,qIndex,bossHp,onPick){
  const labels={'answer-gates':'בחר את השער הנכון','escape-room':'פתור את מנגנון החדר','collect-sort':'אסוף את הפריט המתאים','build-path':'בחר את השלב הבא','boss-quiz':'פגע ב־Boss עם תשובה נכונה'};
  const hp=game.gameMode==='boss-quiz'?`<div class="boss-health" aria-label="Boss health"><span style="width:${bossHp}%"></span></div>`:'';
  const o=document.createElement('div');o.className='question-overlay';o.innerHTML=`<div class="question-card"><span class="eyebrow">${esc(labels[game.gameMode]||'בחר תשובה')} · ${qIndex+1}/${game.questions.length}</span><h2>${esc(q.prompt)}</h2>${hp}<div class="answer-grid">${q.options.map((x,i)=>`<button class="answer" data-a="${i}">${esc(x)}</button>`).join('')}</div><button class="btn tertiary" id="game-hint" style="margin-top:10px">רמז</button><div id="hint-box" class="muted small"></div><div id="answer-feedback" class="small" role="status"></div></div>`;stage.append(o);let hint=false,busy=false;
  qs('#game-hint',o).onclick=()=>{hint=true;qs('#hint-box',o).textContent='פסול קודם תשובה אחת שאינה מתאימה למושג שלמדת במשימה.'};
  qsa('[data-a]',o).forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;qsa('button',o).forEach(x=>x.disabled=true);const feedback=qs('#answer-feedback',o);feedback.innerHTML='<span class="muted">בודק בשרת…</span>';try{const r=await onPick(Number(b.dataset.a),hint);feedback.innerHTML=`<p style="color:${r.correct?'var(--success)':'var(--error)'}"><strong>${r.correct?'נכון':'לא הפעם'}</strong> · ${esc(r.explanation)}</p>`;setTimeout(()=>{o.remove();r.done()},850)}catch(e){feedback.innerHTML=`<p class="error-text">${esc(e.message||'לא ניתן לבדוק את התשובה.')}</p>`;qsa('button',o).forEach(x=>x.disabled=false);busy=false}});
  return o;
}

export function mountGame(stage,game,{lowQuality=false,onAnswer=async()=>({correct:false,explanation:''}),onFinish=async()=>{}}={}){
  stage.innerHTML='';const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Daily 3D Quest WebGL scene');stage.append(canvas);
  const hud=document.createElement('div');hud.className='game-hud';hud.innerHTML='<div class="hud-box" id="g-score">Score 0</div><div class="hud-box" id="g-mode"></div><div class="hud-box" id="g-time">05:00</div>';stage.append(hud);
  const controls=document.createElement('div');controls.className='touch-controls';controls.innerHTML='<div class="touch-pad"><button class="up" data-key="up" aria-label="קדימה">↑</button><button data-key="left" aria-label="שמאלה">←</button><button data-key="down" aria-label="אחורה">↓</button><button data-key="right" aria-label="ימינה">→</button></div><div class="touch-actions"><button data-key="jump" aria-label="קפיצה">J</button><button data-key="interact" aria-label="אינטראקציה">E</button></div>';stage.append(controls);
  const renderer=createRenderer(canvas,lowQuality);if(!renderer){stage.innerHTML='<div class="webgl-fallback"><div><strong>WebGL אינו זמין</strong><p>המשחק עבר למצב דו־ממדי חלופי. השאלות והניקוד עדיין נבדקים בשרת.</p><button class="btn primary" id="fallback-start">התחלת מצב 2D</button></div></div>';qs('#fallback-start',stage).onclick=()=>runQuizOnly(stage,game,onAnswer,onFinish);return}
  const palette=palettes[game.worldTheme]||palettes['future-city'];let running=true,paused=false,last=performance.now(),time=game.timeLimit,score=0,qIndex=0,nextQuestion=3.2,bossHp=100,player={x:0,y:.65,z:game.gameMode==='escape-room'?3:-2,vy:0},keys={},raf=0,yaw=0,pointerDown=false,lastPointerX=0,questionOpen=false;
  qs('#g-mode',stage).textContent=game.gameMode;
  const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=lowQuality?1:Math.min(devicePixelRatio||1,1.6);canvas.width=Math.max(2,Math.floor(r.width*dpr));canvas.height=Math.max(2,Math.floor(r.height*dpr))};resize();addEventListener('resize',resize,{passive:true});
  const kd=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','W','A','S','D','Escape','e','E'].includes(e.key))e.preventDefault();if(e.key==='Escape'){paused=!paused;return}keys[e.key.toLowerCase()]=true};const ku=e=>keys[e.key.toLowerCase()]=false;addEventListener('keydown',kd);addEventListener('keyup',ku);
  canvas.addEventListener('pointerdown',e=>{pointerDown=true;lastPointerX=e.clientX;canvas.setPointerCapture?.(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!pointerDown)return;const dx=e.clientX-lastPointerX;lastPointerX=e.clientX;yaw=clamp(yaw-dx*.006,-1.1,1.1)});canvas.addEventListener('pointerup',()=>pointerDown=false);canvas.addEventListener('pointercancel',()=>pointerDown=false);
  qsa('[data-key]',controls).forEach(b=>{const k=b.dataset.key,set=v=>keys[k]=v;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);set(true)});b.addEventListener('pointerup',()=>set(false));b.addEventListener('pointercancel',()=>set(false))});
  const vis=()=>{if(document.hidden)paused=true};document.addEventListener('visibilitychange',vis);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;const o=document.createElement('div');o.className='question-overlay';o.innerHTML='<div class="question-card"><h2>הקשר הגרפי אבד</h2><p>המשחק הושהה. רענן את העמוד כדי להתחיל ניסיון חדש.</p></div>';stage.append(o)});
  function triggerQuestion(){if(questionOpen||qIndex>=game.questions.length)return;questionOpen=true;paused=true;const q=game.questions[qIndex];questionOverlay(stage,game,q,qIndex,bossHp,async(answerIndex,usedHint)=>{const r=await onAnswer({questionId:q.id,answerIndex,usedHint});return {...r,done:()=>{score=Math.max(0,score+(r.scoreDelta||0));if(!r.correct){time=Math.max(1,time-(r.penaltySeconds||5));stage.animate?.([{transform:'translateX(0)'},{transform:'translateX(5px)'},{transform:'translateX(-5px)'},{transform:'translateX(0)'}],{duration:220})}else if(game.gameMode==='boss-quiz')bossHp=Math.max(0,bossHp-20);qIndex++;questionOpen=false;paused=false;nextQuestion=game.gameMode==='escape-room'?1.4:3.0;player.z=Math.max(player.z,game.gameMode==='escape-room'?player.z:qIndex*4.8);qs('#g-score',stage).textContent=`Score ${score}`;if(qIndex>=game.questions.length){running=false;setTimeout(finish,500)}}}})}
  function update(dt){if(paused||!running)return;const speed=3.2;if(keys.w||keys.arrowup||keys.up)player.z+=speed*dt;if(keys.s||keys.arrowdown||keys.down)player.z-=speed*dt;if(keys.a||keys.arrowleft||keys.left)player.x-=speed*dt;if(keys.d||keys.arrowright||keys.right)player.x+=speed*dt;player.x=clamp(player.x,-3.2,3.2);if((keys[' ']||keys.jump)&&player.y<=.66)player.vy=4.4;player.vy-=9.8*dt;player.y+=player.vy*dt;if(player.y<.65){player.y=.65;player.vy=0}time-=dt;nextQuestion-=dt;
    if(game.gameMode==='escape-room'){if(nextQuestion<=0&&(keys.e||keys.interact)){keys.e=false;keys.interact=false;triggerQuestion()}}else if(nextQuestion<=0)triggerQuestion();if(time<=0&&qIndex<game.questions.length){time=1;triggerQuestion()}}
  async function finish(){cleanup();stage.querySelectorAll('.question-overlay').forEach(x=>x.remove());const o=document.createElement('div');o.className='question-overlay';o.innerHTML='<div class="question-card"><span class="eyebrow">הניסיון הסתיים</span><h2>בודק את התוצאה בשרת…</h2><div class="spinner"></div></div>';stage.append(o);try{await onFinish()}finally{setTimeout(()=>o.remove(),700)}}
  function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;update(dt);const camZ=game.gameMode==='escape-room'?player.z-4.8:player.z-6,cam={x:player.x*.15,y:2.8,z:camZ,yaw};renderer.render(cam,modeObjects(game,palette,player,qIndex,bossHp),palette.bg);const sec=Math.max(0,Math.floor(time));qs('#g-time',stage).textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}${paused?' · PAUSE':''}${game.gameMode==='escape-room'&&!questionOpen&&nextQuestion<=0?' · E':''}`;if(running)raf=requestAnimationFrame(loop)}raf=requestAnimationFrame(loop);
  function cleanup(){running=false;cancelAnimationFrame(raf);removeEventListener('resize',resize);removeEventListener('keydown',kd);removeEventListener('keyup',ku);document.removeEventListener('visibilitychange',vis)}
}

function runQuizOnly(stage,game,onAnswer,onFinish){let i=0,score=0;const next=()=>{if(i>=game.questions.length){stage.innerHTML='<div class="webgl-fallback"><div><div class="spinner"></div>בודק תוצאה בשרת…</div></div>';Promise.resolve(onFinish()).catch(()=>{});return}const q=game.questions[i];stage.innerHTML=`<div class="webgl-fallback"><div class="question-card"><span class="eyebrow">2D FALLBACK · ${i+1}/${game.questions.length}</span><h2>${esc(q.prompt)}</h2><div class="answer-grid">${q.options.map((x,j)=>`<button class="answer" data-a="${j}">${esc(x)}</button>`).join('')}</div><div id="f-feedback" class="small"></div></div></div>`;qsa('[data-a]',stage).forEach(b=>b.onclick=async()=>{qsa('button',stage).forEach(x=>x.disabled=true);try{const r=await onAnswer({questionId:q.id,answerIndex:Number(b.dataset.a),usedHint:false});score+=Math.max(0,r.scoreDelta||0);qs('#f-feedback',stage).innerHTML=`<p style="color:${r.correct?'var(--success)':'var(--error)'}">${r.correct?'נכון':'לא הפעם'} · ${esc(r.explanation)}</p>`;i++;setTimeout(next,700)}catch(e){qs('#f-feedback',stage).textContent=e.message;qsa('button',stage).forEach(x=>x.disabled=false)}})};next()}
