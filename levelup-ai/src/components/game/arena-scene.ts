import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { arenaAim, arenaLayout, arenaLineBlocked, normalizeInput, seededRandom, slideArenaMovement, type ArenaCover, type ArenaPoint, type DailyGame, type GameLocale, type GameQuestion, type GameSettings } from "@/lib/game";
import type { GameScene, GameSceneHooks } from "./scene-types";
import { advanceAttackWindup, createAttackWindup, firstCoverImpact, turnToward, type AttackWindup } from "./arena-combat";

type Drone = { group: THREE.Group; body: THREE.Group; rotors: THREE.Object3D[]; pips: THREE.Mesh[]; warning: THREE.Group; warningLine: THREE.Mesh; warningRing: THREE.Mesh; windup: AttackWindup | null; position: ArenaPoint; health: number; cooldown: number; hurt: number; recoil: number; phase: number; kind: "runner" | "sentry" };
type Bolt = { mesh: THREE.Group; x: number; z: number; dx: number; dz: number; life: number; hostile: boolean; answer: number | null };
type Burst = { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; total: number };
type Pickup = { group: THREE.Group; x: number; z: number; phase: number };
type AnswerTarget = { group: THREE.Group; orb: THREE.Mesh; ring: THREE.Mesh; brackets: THREE.Group; cap: THREE.Mesh; x: number; z: number; index: number };
type Pulse = { mesh: THREE.Mesh; life: number; total: number; radius: number };

const ARENA_STYLE = {
  "future-city": { grass: 0x518873, paving: 0xd0c39d, stone: 0xabbdb0, roof: 0x527e79, water: 0x559795, sky: 0xb4d2d2 },
  "sky-island": { grass: 0x65a382, paving: 0xdcccaa, stone: 0xbbc9b8, roof: 0x597f9e, water: 0x74b8bd, sky: 0xc2d9e4 },
  "ai-lab": { grass: 0x537e7b, paving: 0xb7c7bd, stone: 0x819e9a, roof: 0x3f7284, water: 0x477f93, sky: 0xafc7d2 },
  "mystery-castle": { grass: 0x617b68, paving: 0xc4b08b, stone: 0xabaa95, roof: 0x576a79, water: 0x667e88, sky: 0xc1c8bb },
  "digital-world": { grass: 0x426e71, paving: 0x829d9d, stone: 0x6a868d, roof: 0x345668, water: 0x4d929f, sky: 0x9abcc5 },
};

/** Original, deterministic action arena. Combat is visual; only answer events earn server XP. */
export class ArenaScene implements GameScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-14,14,14,-14,.1,150);
  private environment = new THREE.Group();
  private actors = new THREE.Group();
  private hero = new THREE.Group();
  private heroBody = new THREE.Group();
  private heroFeet: THREE.Object3D[] = [];
  private heroArms: THREE.Group[] = [];
  private heroTool = new THREE.Group();
  private heroCore!: THREE.Mesh;
  private shieldBubble!: THREE.Mesh;
  private shieldRing!: THREE.Mesh;
  private dashPips: THREE.Mesh[] = [];
  private aimMarkers: THREE.Mesh[] = [];
  private aimReticle = new THREE.Group();
  private guardian = new THREE.Group();
  private guardianWarning = new THREE.Group();
  private guardianWindup: AttackWindup | null = null;
  private portalPieces: THREE.Mesh[] = [];
  private aimLine: THREE.Line;
  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private materials = new Map<string, THREE.Material>();
  private textures: THREE.Texture[] = [];
  private listeners: (() => void)[] = [];
  private observer: ResizeObserver;
  private covers: ArenaCover[];
  private targets: AnswerTarget[] = [];
  private drones: Drone[] = [];
  private bolts: Bolt[] = [];
  private bursts: Burst[] = [];
  private pulses: Pulse[] = [];
  private pickups: Pickup[] = [];
  private raycaster = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  private keys = new Set<string>();
  private stick = {x:0,z:0};
  private aim = {x:0,z:-1};
  private manualAim = false;
  private firing = false;
  private selected: number | null = null;
  private question?: GameQuestion;
  private questionIndex = 0;
  private correct = 0;
  private health = 5;
  private collected = 0;
  private dashTime = 0;
  private dashCooldown = 0;
  private dashDirection = {x:0,z:-1};
  private hurtTime = 0;
  private damageFlash = 0;
  private recoil = 0;
  private stride = 0;
  private footstepTime = 0;
  private dashTrailTime = 0;
  private regenTime = 0;
  private fireCooldown = 0;
  private waveCooldown = 0;
  private wrongAttack = 0;
  private guardianPulse = 0;
  private telemetryTime = 0;
  private lastTelemetry = "";
  private elapsed = 0;
  private previousFrame = performance.now();
  private frame = 0;
  private paused = true;
  private pausedRendered = false;
  private answerSent = false;
  private disposed = false;
  private loaded = false;
  private low: boolean;
  private reduced: boolean;
  private random: () => number;
  private daylight: boolean;
  private arenaConfig;
  private style;
  private portrait = false;
  private shortLandscape = false;
  private cameraFocus = new THREE.Vector3(0,0,-.8);

  constructor(private host: HTMLDivElement, private game: DailyGame, private locale: GameLocale, settings: GameSettings, private hooks: GameSceneHooks) {
    const device = navigator as Navigator & {deviceMemory?:number};
    this.low = settings.quality === "low" || settings.graphics === "low" || ((settings.quality === "auto" || !settings.quality) && ((device.deviceMemory ?? 8) <= 4 || navigator.hardwareConcurrency <= 4));
    this.reduced = !!settings.reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.arenaConfig = {layout:"courtyard",enemyCount:3,obstacleCount:6,ambience:"day",waveCount:8,...game.arena};
    this.arenaConfig.enemyCount = Math.max(2,Math.min(6,this.arenaConfig.enemyCount));
    this.daylight = this.arenaConfig.ambience !== "dusk";
    this.style = ARENA_STYLE[game.worldTheme] ?? ARENA_STYLE["future-city"];
    this.random = seededRandom(`${game.seed}:arena`);
    this.covers = arenaLayout(game.seed,this.arenaConfig.layout,this.arenaConfig.obstacleCount);
    this.renderer = new THREE.WebGLRenderer({antialias:!this.low,alpha:false,powerPreference:this.low?"low-power":"high-performance"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.low?1:1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.daylight ? .95 : 1.12;
    this.renderer.shadowMap.enabled = !this.low;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.style.touchAction = "none";
    this.host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(this.daylight?this.style.sky:0x253f56);
    this.scene.fog = new THREE.Fog(this.daylight?this.style.sky:0x253f56,52,92);
    this.scene.add(this.environment,this.actors,this.hero,this.guardian);
    this.scene.add(new THREE.HemisphereLight(this.daylight?0xe4f8ef:0xb1d3ff,0x455c56,this.daylight?1.7:1.5));
    const sun = new THREE.DirectionalLight(this.daylight?0xffe9b4:0xd5dbff,2.5);
    sun.position.set(-10,24,14); sun.castShadow=!this.low;
    sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-18; sun.shadow.camera.right=18; sun.shadow.camera.top=18; sun.shadow.camera.bottom=-18; sun.shadow.normalBias=.035;
    this.scene.add(sun);
    this.hooks.loading(8);
    this.buildArena(); this.buildLandmarks(); this.batchEnvironment(); this.buildHero(); this.buildGuardian();
    this.correct=game.resumeState?.correct??0;
    for(let i=0;i<Math.min(this.correct,this.portalPieces.length);i++)this.portalPieces[i].material=this.mat(0xf3df92,true);
    const aimGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
    this.geometryCache.set("aim-line",aimGeometry);
    this.aimLine = new THREE.Line(aimGeometry,new THREE.LineBasicMaterial({color:0xe9ffcf,transparent:true,opacity:.8,depthTest:false}));
    this.aimLine.frustumCulled=false;
    this.materials.set("aim-line",this.aimLine.material as THREE.Material); this.aimLine.renderOrder=3; this.scene.add(this.aimLine);
    this.buildAimGuide();
    this.hooks.loading(60); this.bindControls();
    this.observer = new ResizeObserver(()=>this.resize()); this.observer.observe(host); this.resize();
    this.loadExplorer();
    this.frame = requestAnimationFrame(this.animate);
  }

  private mat(color:number, glow=false):THREE.MeshStandardMaterial {
    const key=`${color}:${glow}`;
    if(!this.materials.has(key)) this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:glow?.15:0,emissive:glow?color:0,emissiveIntensity:glow?.35:0}));
    return this.materials.get(key) as THREE.MeshStandardMaterial;
  }
  private geo(key:string,make:()=>THREE.BufferGeometry) { if(!this.geometryCache.has(key))this.geometryCache.set(key,make());return this.geometryCache.get(key)!; }
  private mesh(geo:THREE.BufferGeometry,color:number,parent:THREE.Object3D,x=0,y=0,z=0,glow=false):THREE.Mesh {
    const object=new THREE.Mesh(geo,this.mat(color,glow)); object.position.set(x,y,z); object.castShadow=!this.low;object.receiveShadow=true;parent.add(object);return object;
  }
  private box(w:number,h:number,d:number,x:number,y:number,z:number,color:number,parent:THREE.Object3D=this.environment,r=.12) {
    return this.mesh(this.geo(`box:${w}:${h}:${d}:${r}`,()=>new RoundedBoxGeometry(w,h,d,this.low?1:2,r)),color,parent,x,y,z);
  }
  private sphere(r:number,x:number,y:number,z:number,color:number,parent:THREE.Object3D=this.environment,glow=false) {
    return this.mesh(this.geo(`sphere:${r}`,()=>new THREE.SphereGeometry(r,this.low?10:16,10)),color,parent,x,y,z,glow);
  }
  private cylinder(r:number,h:number,x:number,y:number,z:number,color:number,parent:THREE.Object3D=this.environment,top=r) {
    return this.mesh(this.geo(`cylinder:${r}:${top}:${h}`,()=>new THREE.CylinderGeometry(top,r,h,this.low?10:18)),color,parent,x,y,z);
  }
  private ring(radius:number,width:number,color:number,parent:THREE.Object3D,x=0,y=.035,z=0) {
    const ring=this.mesh(this.geo(`ring:${radius}:${width}`,()=>new THREE.RingGeometry(radius-width,radius,this.low?24:40)),color,parent,x,y,z,true);ring.rotation.x=-Math.PI/2;ring.castShadow=false;return ring;
  }
  private shadow(radius:number,parent:THREE.Object3D,x=0,z=0) {
    if(!this.materials.has("shadow"))this.materials.set("shadow",new THREE.MeshBasicMaterial({color:0x263e39,transparent:true,opacity:.2,depthWrite:false}));
    const mesh=new THREE.Mesh(this.geo(`shadow:${radius}`,()=>new THREE.CircleGeometry(radius,20)),this.materials.get("shadow"));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.015,z);parent.add(mesh);return mesh;
  }
  private translucent(key:string,color:number,opacity:number){
    if(!this.materials.has(key))this.materials.set(key,new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
    return this.materials.get(key)!;
  }
  private buildArena() {
    const islands=this.arenaConfig.layout==="islands", lawn=this.style.grass, sand=this.style.paving;
    this.box(23,1.5,30,0,-.95,0,0x6b7975,this.environment,.35);
    this.box(21,.4,28,0,-.15,0,lawn,this.environment,.24);
    this.box(8,.06,26,0,.065,0,sand,this.environment,.2);
    this.box(20,.065,5,0,.065,0,sand,this.environment,.2);
    if(islands){for(const x of[-6,6])for(const z of[-8,7]){this.cylinder(3.5,.18,x,.05,z,0x98bd93);this.ring(3.35,.14,0xe2d9b9,this.environment,x,.16,z);}}
    for(let z=-12;z<13;z+=2.5){this.box(2.9,.07,1.9,0,.11,z,0xede0bb,this.environment,.16);}
    for(const x of[-10.6,10.6]){this.box(.6,1.05,28,x,.25,0,0x8ca19b);this.box(.72,.18,28,x,.86,0,0xc5c5ac);}
    for(const z of[-13.8,13.8]){this.box(21.8,.8,.65,0,.15,z,0x8ca19b);this.box(22,.2,.8,0,.67,z,0xc5c5ac);}
    // Bevelled planters, pillars and foliage establish cover at exactly the collision bounds.
    for(const cover of this.covers){
      this.shadow(Math.max(cover.width,cover.depth)*.66,this.environment,cover.x,cover.z);
      if(cover.style==="hedge"){
        this.box(cover.width,1.1,cover.depth,cover.x,.57,cover.z,0x668c6c,this.environment,.2);
        this.box(cover.width+.1,.18,cover.depth+.1,cover.x,.12,cover.z,0xa8ab8d,this.environment,.1);
        for(let i=0;i<3;i++)this.sphere(.62,cover.x+(i-1)*cover.width/3,1.22,cover.z,0x538666);
      }else if(cover.style==="stone"){
        this.box(cover.width,1.05,cover.depth,cover.x,.54,cover.z,0xc8bd9e,this.environment,.18);
        this.box(cover.width+.1,.18,cover.depth+.1,cover.x,1.1,cover.z,0xe5d5b0,this.environment,.08);
        this.box(.14,.52,cover.depth+.04,cover.x, .55,cover.z,0xa49f89);
      }else{
        this.box(cover.width,1.2,cover.depth,cover.x,.62,cover.z,0xb98654,this.environment,.15);
        for(const dx of[-cover.width*.32,cover.width*.32])this.box(.13,1.28,cover.depth+.04,cover.x+dx,.65,cover.z,0xf0cf91,this.environment,.035);
        this.box(cover.width+.06,.14,cover.depth+.06,cover.x,1.17,cover.z,0xd5aa70,this.environment,.04);
      }
    }
    for(const x of[-12.1,12.1])for(const z of[-11,-5,2,9])this.tree(x,z,.8+this.random()*.35);
    for(let i=0;i<(this.low?30:55);i++){
      const side=i%2?1:-1,x=side*(10.9+this.random()*3),z=(this.random()-.5)*29;
      this.sphere(.16+this.random()*.16,x,.15,z,[0x668b7b,0x749884,0xd5cb9b][i%3]);
      if(i%5===0)this.flower(x,z);
    }
    // Floating greenhouse observatory and a bright exit arch frame the north edge.
    this.box(8,.5,3.4,0,.18,-14.8,0xd1c9b1,this.environment,.2);
    for(const x of[-3.3,3.3]){this.cylinder(.36,4.8,x,2.25,-14.6,0xdad8bb);this.cylinder(.53,.3,x,4.65,-14.6,0xe6d6a2);}
    this.box(7.2,.48,.65,0,4.6,-14.6,0xb5c6bc,this.environment,.18);
    for(let i=0;i<8;i++){const piece=this.box(.64,.22,.42,(i-3.5)*.78,4.95,-14.6,0x779188,this.environment,.07);this.portalPieces.push(piece);}
    for(const x of[-8.2,8.2])for(const z of[-11,10.8]){
      this.cylinder(.12,2.4,x,1.1,z,0x677b76);this.box(.55,.48,.55,x,2.45,z,0xf2dd9b,this.environment,.13);
      this.ring(.9,.05,0xcbd2a4,this.environment,x,.04,z);
    }
    // Distant architectural silhouettes are inexpensive, original mesh compositions.
    for(const x of[-18,18])for(const z of[-13,3,18]){
      this.box(4.5,3+this.random()*3,5,x,-.1,z,0x73958b,this.environment,.6);
      this.sphere(2.5,x,2.1,z,0x88ac9d);
    }
  }
  private buildLandmarks(){
    // Original terrace observatory: all architectural props remain outside the playable collision bounds.
    const stone=this.style.stone,roof=this.style.roof;
    const plinth=this.mesh(this.geo('island-foundation',()=>new THREE.CylinderGeometry(14,10.5,3.8,8)),0x607f79,this.environment,0,-3.5,0);
    plinth.scale.z=1.23;
    const water=this.cylinder(20,.1,0,-2.7,0,this.style.water);water.scale.z=1.17;
    this.ring(19,.1,0xaed2c1,this.environment,0,-2.63,0).scale.z=1.17;
    for(const x of[-12.2,12.2])for(const z of[-8,8]){
      this.box(1.7,2.3,2.1,x,-1.9,z,stone,this.environment,.22);
      this.box(1.9,.22,2.3,x,-.68,z,0xd8d2b5,this.environment,.08);
    }
    // Inlaid compass and corner paving make the space feel designed, without creating new obstacles.
    this.cylinder(2.4,.025,0,.112,0,stone);
    this.ring(2.25,.08,0xe7d9b2,this.environment,0,.134,0);
    this.ring(1.35,.045,roof,this.environment,0,.138,0);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,mark=this.box(.14,.025,i%2?.4:.65,Math.sin(a)*1.75,.148,Math.cos(a)*1.75,roof,this.environment,.025);mark.rotation.y=a;
    }
    for(const x of[-8.6,8.6])for(const z of[-8,0,8]){
      this.cylinder(1.35,.035,x,.035,z,this.style.paving);
      this.ring(1.14,.035,stone,this.environment,x,.058,z);
    }
    // A copper-ribbed glass dome, framed by terraces and open arched side windows.
    this.cylinder(3.65,.5,0,.24,-18.4,stone);
    this.cylinder(3.32,1.65,0,1.1,-18.4,roof);
    this.cylinder(3.6,.22,0,1.95,-18.4,0xd8cfac);
    const dome=this.mesh(this.geo('observatory-dome',()=>new THREE.SphereGeometry(3.26,this.low?16:28,12,0,Math.PI*2,0,Math.PI/2)),0x92b9ac,this.environment,0,2.06,-18.4);
    dome.material=this.translucent('dome-glass',0x91c5b9,.74);
    const ribGeometry=this.geo('observatory-rib',()=>new THREE.TorusGeometry(3.3,.055,5,this.low?16:32,Math.PI));
    for(let i=0;i<4;i++){
      const rib=this.mesh(ribGeometry,0xd9c38d,this.environment,0,2.06,-18.4);rib.rotation.y=i*Math.PI/4;
    }
    this.cylinder(.16,.7,0,5.61,-18.4,roof);this.sphere(.23,0,6.02,-18.4,0xf0d69a,this.environment,true);
    for(let i=0;i<5;i++){
      const angle=(i-2)*.45,x=Math.sin(angle)*3.34,z=-18.4+Math.cos(angle)*3.34;
      const window=this.box(.73,.76,.08,x,1.15,z,0xd1e2c5,this.environment,.16);window.rotation.y=angle;
    }
    for(const x of[-8,8]){
      this.box(3.2,.38,3.2,x,.3,-16.2,stone,this.environment,.22);
      for(const dx of[-1.1,1.1])this.cylinder(.2,3.2,x+dx,1.95,-16.2,stone);
      const arch=this.mesh(this.geo('terrace-arch',()=>new THREE.TorusGeometry(1.1,.22,6,20,Math.PI)),0xd6ccb1,this.environment,x,3.45,-16.2);
      arch.rotation.z=0;
      this.box(2.7,.25,1.6,x,4.7,-16.2,roof,this.environment,.12);
    }
    // Functional visual landmarks: the entrance is blue; progress lights lead to the gold exit.
    this.ring(1.55,.13,0xafd8d4,this.environment,0,.135,7.4);
    this.ring(1.75,.045,roof,this.environment,0,.14,7.4);
    for(const x of[-4.7,4.7]){
      this.cylinder(.12,2.7,x,1.25,12.9,roof);
      const banner=this.box(.75,1.1,.06,x+.37,2.3,12.9,this.game.worldTheme==='mystery-castle'?0xb79c75:0x6eaaa6,this.environment,.05);
      banner.rotation.z=-.04;
      this.box(.08,.65,.075,x+.32,2.3,12.94,0xece0b7,this.environment,.02);
    }
    if(this.game.worldTheme==='ai-lab'||this.game.worldTheme==='digital-world'){
      for(const x of[-12.5,12.5])for(const z of[-10,4]){
        const console=this.box(1.5,1.1,1.4,x,.1,z,roof,this.environment,.2);console.rotation.y=x<0?.25:-.25;
        this.box(1.12,.06,.85,x,.68,z,0x9ccfcb,this.environment,.06).rotation.x=-.12;
        this.ring(.52,.05,0xc7e3c8,this.environment,x,.73,z);
      }
    }
    if(this.game.worldTheme==='sky-island'){
      for(const x of[-7.2,7.2]){
        const fall=this.box(1.6,3.4,.12,x,-3.1,15,0x8fc9c6,this.environment,.05);
        fall.material=this.translucent('waterfall',0xabe1d9,.7);
        for(let i=0;i<3;i++)this.box(.08,2.6,.14,x+(i-1)*.43,-3,15.03,0xd5ece0,this.environment,.025);
      }
    }
  }
  private batchEnvironment(){
    // Repeated static pieces share one draw call, including their shadow pass.
    const batches=new Map<string,THREE.Mesh[]>();this.environment.updateMatrixWorld(true);
    this.environment.traverse(object=>{
      if(!(object instanceof THREE.Mesh)||Array.isArray(object.material)||this.portalPieces.includes(object))return;
      const key=`${object.geometry.uuid}:${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
      const batch=batches.get(key)??[];batch.push(object);batches.set(key,batch);
    });
    for(const meshes of batches.values()){
      if(meshes.length<3)continue;
      const source=meshes[0],instances=new THREE.InstancedMesh(source.geometry,source.material,meshes.length);
      instances.castShadow=source.castShadow;instances.receiveShadow=source.receiveShadow;
      meshes.forEach((mesh,index)=>{instances.setMatrixAt(index,mesh.matrixWorld);mesh.removeFromParent();});
      instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();this.environment.add(instances);
    }
  }
  private tree(x:number,z:number,scale:number){
    const tree=new THREE.Group();tree.position.set(x,0,z);tree.scale.setScalar(scale);this.environment.add(tree);
    this.cylinder(.25,2.1,0,.85,0,0x8c7858,tree,.15);
    for(const [dx,dy,dz,r]of[[0,2.9,0,1.2],[-.55,2.15,.15,.95],[.6,2.2,-.2,1]])this.sphere(r,dx,dy,dz,dy>2.5?0x6da582:0x55846b,tree);
    this.shadow(1.5,tree);
  }
  private flower(x:number,z:number){this.cylinder(.045,.4,x,.2,z,0x477b63);for(let p=0;p<4;p++)this.sphere(.1,x+Math.cos(p*Math.PI/2)*.1,.45,z+Math.sin(p*Math.PI/2)*.1,0xecc888);}
  private buildHero(){
    this.hero.position.set(0,0,7.4);this.hero.scale.setScalar(1.55);this.hero.add(this.heroBody);this.shadow(.78,this.hero);
    this.ring(.86,.07,0xdcfaff,this.hero);
    this.heroCore=this.cylinder(.53,.76,0,.94,0,0x548bc2,this.heroBody,.44);
    this.box(.96,.32,.69,0,1.36,0,0x91bad8,this.heroBody,.14);
    this.sphere(.51,0,1.65,0,0xe3ebd9,this.heroBody);
    this.box(.82,.3,.24,0,1.68,-.43,0x243c51,this.heroBody,.11);
    this.sphere(.067,-.19,1.69,-.566,0xb4f0eb,this.heroBody,true);this.sphere(.067,.19,1.69,-.566,0xb4f0eb,this.heroBody,true);
    for(const x of[-.66,.66]){
      const arm=new THREE.Group();arm.position.set(x,1.4,0);this.heroBody.add(arm);
      this.sphere(.19,0,-.08,0,0x91bad8,arm);
      this.box(.28,.55,.42,0,-.36,0,0xdee7d4,arm,.12);
      this.box(.3,.18,.43,0,-.65,-.02,0x52768d,arm,.07);
      this.heroArms.push(arm);
    }
    // A compact energy tool, distinct from firearms and recognizable at phone scale.
    this.heroTool.position.set(0,-.35,-.43);this.heroArms[1].add(this.heroTool);
    this.box(.38,.36,.73,0,0,0,0x334e66,this.heroTool,.12);
    this.box(.2,.16,.44,0,.21,-.05,0xa6c8c6,this.heroTool,.06);
    this.cylinder(.19,.3,0,0,-.4,0x87c7c5,this.heroTool).rotation.x=Math.PI/2;
    this.sphere(.11,0,0,-.58,0xe2ffee,this.heroTool,true);
    for(const x of[-.3,.3]){const foot=this.box(.36,.38,.57,x,.29,-.06,0x344e61,this.heroBody,.13);this.heroFeet.push(foot);}
    this.box(.54,.59,.24,0,1.06,.46,0xdabf76,this.heroBody,.08);
    for(const x of[-.18,.18])this.box(.08,.39,.03,x,1.08,.6,0x927653,this.heroBody,.02);
    this.cylinder(.05,.35,0,2.22,.05,0x5e8594,this.heroBody);this.sphere(.11,0,2.43,.05,0xf0cd82,this.heroBody,true);
    this.shieldBubble=new THREE.Mesh(this.geo('hero-shield',()=>new THREE.SphereGeometry(1.02,this.low?12:20,12)),this.translucent('shield-bubble',0xa8edeb,.16));
    this.shieldBubble.position.y=1.16;this.shieldBubble.scale.y=1.24;this.hero.add(this.shieldBubble);this.shieldBubble.visible=false;
    this.shieldRing=this.ring(1.03,.07,0xb7fff3,this.hero,0,.09);this.shieldRing.visible=false;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,pip=this.box(.11,.04,.22,Math.sin(a)*1.06,.09,Math.cos(a)*1.06,0xb7fff3,this.hero,.03);pip.rotation.y=a;pip.castShadow=false;this.dashPips.push(pip);
    }
  }
  private buildAimGuide(){
    for(let i=0;i<10;i++){
      const marker=this.box(.08,.025,.34,0,.15,0,0xe8f8d4,this.actors,.025);marker.castShadow=false;marker.visible=false;this.aimMarkers.push(marker);
    }
    const ring=this.ring(.34,.045,0xe8f8d4,this.aimReticle,0,.04);
    ring.material=this.mat(0xe8f8d4,true);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,piece=this.box(.12,.025,.24,Math.sin(a)*.46,.045,Math.cos(a)*.46,0xe8f8d4,this.aimReticle,.025);piece.rotation.y=a;piece.castShadow=false;
    }
    this.aimReticle.visible=false;this.actors.add(this.aimReticle);
  }
  private buildGuardian(){
    this.guardian.position.set(0,0,-13.7);
    this.cylinder(1.08,.35,0,.32,0,0xb7c7b1,this.guardian);
    this.sphere(1,0,1.66,0,0x83b6b3,this.guardian);
    this.box(1.48,.46,.35,0,1.7,.79,0x314e5b,this.guardian,.17);
    for(const x of[-.36,.36])this.sphere(.1,x,1.75,1.01,0xb7f3dc,this.guardian,true);
    const halo=this.mesh(this.geo("guardian-halo",()=>new THREE.TorusGeometry(1.3,.07,6,32)),0xf2d78a,this.guardian,0,1.52,0,true);halo.rotation.x=Math.PI/2;
    this.ring(1.35,.16,0xf8c37d,this.guardianWarning);this.guardianWarning.visible=false;this.actors.add(this.guardianWarning);
    for(let i=-2;i<=2;i++){
      const lane=this.box(.14,.025,10,0,.08,5,0xf8b076,this.guardianWarning,.02);lane.rotation.y=i*.17;lane.position.set(Math.sin(i*.17)*5,.08,Math.cos(i*.17)*5);lane.castShadow=false;
      lane.material=this.translucent('guardian-warning',0xffc68c,.5);
    }
  }
  private loadExplorer(){
    // The original licensed GLB appears as the explorer statue at the garden entrance.
    const loader=new GLTFLoader();loader.load('/models/explorer.glb',(gltf)=>{
      if(this.disposed){gltf.scene.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});return;}
      gltf.scene.scale.setScalar(.48);gltf.scene.position.set(-8.4,.35,11.4);this.environment.add(gltf.scene);
      this.completeLoad();
    },event=>{if(event.total)this.hooks.loading(60+Math.round(event.loaded/event.total*35));},()=>this.completeLoad());
  }
  private completeLoad(){if(this.disposed)return;this.loaded=true;this.hooks.loading(100);this.hooks.ready(this.low);}
  private label(value:string,color:number){
    const key=`answer-label:${value}`;
    let material=this.materials.get(key) as THREE.SpriteMaterial|undefined;
    if(!material){
      const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const context=canvas.getContext('2d')!;
      context.fillStyle='#f5f4dd';context.beginPath();context.roundRect(8,8,112,112,30);context.fill();context.fillStyle=`#${color.toString(16).padStart(6,'0')}`;context.font=`600 72px ${getComputedStyle(this.host).fontFamily}`;context.textAlign='center';context.textBaseline='middle';context.fillText(value,64,68);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;this.textures.push(texture);
      material=new THREE.SpriteMaterial({map:texture,depthTest:false});this.materials.set(key,material);
    }
    const sprite=new THREE.Sprite(material);sprite.scale.set(1.12,1.12,1);sprite.position.y=2.8;sprite.renderOrder=2;return sprite;
  }
  setQuestion(question:GameQuestion,index:number){
    this.question=question;this.questionIndex=index;this.answerSent=false;this.selected=null;this.hooks.selection(-1);
    for(const target of this.targets){this.actors.remove(target.group);}this.targets=[];
    const count=question.options[this.locale].length;
    question.options[this.locale].forEach((_,answer)=>{
      const x=(answer-(count-1)/2)*(count===4?4.3:6.1),z=-9;
      const group=new THREE.Group();group.position.set(x,0,z);this.actors.add(group);this.shadow(.95,group);
      this.cylinder(.92,.2,0,.16,0,0xe2d7b6,group);this.cylinder(.72,.34,0,.42,0,0x587d78,group);
      const cap=this.cylinder(.76,.09,0,.63,0,0xbad8c4,group);
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3;this.box(.09,.34,.13,Math.sin(a)*.59,.46,Math.cos(a)*.59,0xe4d6a7,group,.03);}
      const orb=this.mesh(this.geo('answer-gem',()=>new THREE.OctahedronGeometry(.58,0)),0x83d1d2,group,0,1.3,0,true);
      const ring=this.ring(1.05,.08,0xa6e1d0,group);group.add(this.label(String(answer+1),0x2c5964));
      const brackets=new THREE.Group();group.add(brackets);
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2,corner=this.box(.15,.035,.32,Math.sin(a)*1.1,.08,Math.cos(a)*1.1,0xffdf92,brackets,.04);corner.rotation.y=a;
      }
      brackets.visible=false;this.targets.push({group,orb,ring,brackets,cap,x,z,index:answer});
    });
    this.clearBolts();this.waveCooldown=.8;this.hooks.attack(false);this.wrongAttack=0;this.guardianWindup=null;this.guardianWarning.visible=false;
    for(const drone of this.drones){drone.windup=null;drone.warning.visible=false;drone.cooldown=Math.max(1.4,drone.cooldown);}
    const desired=Math.min(7,this.arenaConfig.enemyCount+Math.floor(index/3));
    while(this.drones.length<desired)this.spawnDrone(this.drones.length);
    this.publishTelemetry();
  }
  private spawnDrone(number:number){
    const candidates=[{x:-8,z:-5},{x:8,z:-5},{x:-8,z:6},{x:8,z:6},{x:-3,z:-11.5},{x:3,z:-11.5},{x:0,z:11.6}];
    const preferred=candidates[number%candidates.length];
    const start=this.distance(preferred)>=2.7?preferred:candidates.reduce((best,point)=>this.distance(point)>this.distance(best)?point:best);
    const group=new THREE.Group(),body=new THREE.Group();group.position.set(start.x,0,start.z);group.scale.setScalar(1.3);group.add(body);this.actors.add(group);this.shadow(.65,group);
    const sentry=number%3===1,color=sentry?0xd9ae66:0xd78868;
    this.cylinder(.52,.7,0,.95,0,color,body,.42);this.sphere(.46,0,1.25,0,color,body);
    this.box(.78,.23,.24,0,1.28,-.39,0x4c4543,body,.09);
    this.sphere(.064,-.17,1.29,-.54,0xfbe4b5,body,true);this.sphere(.064,.17,1.29,-.54,0xfbe4b5,body,true);
    for(const x of[-.6,.6]){this.box(.23,.35,.4,x,.87,0,0x795e50,body,.1);this.sphere(.17,x,.64,-.07,0xe3c79c,body);}
    const base=this.mesh(this.geo('drone-base',()=>new THREE.TorusGeometry(.34,.08,5,14)),0x745f55,body,0,.48,0);base.rotation.x=Math.PI/2;
    const rotors:THREE.Object3D[]=[];
    for(const x of[-.69,.69]){
      const rotor=new THREE.Group();rotor.position.set(x,1.15,.04);body.add(rotor);
      this.cylinder(.27,.07,0,0,0,0x695f52,rotor);this.box(.55,.035,.095,0,.06,0,0xe9d4a6,rotor,.025);rotors.push(rotor);
    }
    if(sentry){this.cylinder(.05,.35,0,1.78,.05,0x796f5b,body);this.sphere(.1,0,1.99,.05,0xfbe1a0,body,true);}
    const pips:THREE.Mesh[]=[];
    for(let i=0;i<(sentry?3:2);i++)pips.push(this.box(.14,.08,.14,(i-(sentry?1:.5))*.22,1.76,-.02,0xf8e3ad,body,.03));
    const warning=new THREE.Group();warning.position.set(start.x,0,start.z);this.actors.add(warning);warning.visible=false;
    const warningRing=this.ring(.94,.11,0xffbf83,warning,0,.09);
    const warningLine=this.box(.17,.025,1,0,.085,.5,0xf5b978,warning,.025);warningLine.castShadow=false;
    warningLine.material=this.translucent('enemy-warning-line',0xffc08a,.6);
    this.drones.push({group,body,rotors,pips,warning,warningLine,warningRing,windup:null,position:{...start},health:sentry?3:2,cooldown:1.8+this.random()*2,hurt:0,recoil:0,phase:this.random()*6,kind:sentry?'sentry':'runner'});
    this.pulse(start.x,start.z,0xf5d7a5,1.2,.5);this.burst(start.x,.5,start.z,0xf5d7a5,5);
  }
  setPaused(value:boolean){this.paused=value;this.pausedRendered=false;if(value){this.keys.clear();this.stick={x:0,z:0};this.firing=false;this.manualAim=false;}}
  setJoystick(x:number,z:number){this.stick=normalizeInput(x,z);}
  choose(answer:number){if(this.answerSent||!this.targets[answer])return;this.selected=answer;this.manualAim=false;this.hooks.selection(answer);}
  setFiring(active:boolean){if(this.paused)return;this.firing=active;if(active)this.fire();else this.manualAim=false;}
  setAim(x:number,z:number){if(Math.hypot(x,z)<.22){this.manualAim=false;return;}this.aim=arenaAim({x:0,z:0},{x,z});this.manualAim=true;}
  action(){this.fire();}
  jump(){this.dodge();}
  dodge(){
    if(this.paused||this.dashCooldown>0)return;
    const movement=this.input();this.dashDirection=Math.hypot(movement.x,movement.z)>.1?arenaAim({x:0,z:0},movement):{...this.aim};
    this.dashTime=.23;this.dashCooldown=3.2;this.hurtTime=Math.max(this.hurtTime,.38);this.dashTrailTime=0;this.burst(this.hero.position.x,.3,this.hero.position.z,0xbfeff1,7);this.pulse(this.hero.position.x,this.hero.position.z,0xb7fff3,1.8,.35);this.hooks.sound?.('dash');this.publishTelemetry();
  }
  resolve(correct:boolean){
    const selected=this.targets[this.selected??0];if(selected){selected.cap.material=this.mat(correct?0xb5ead5:0xf1c28d,true);this.pulse(selected.x,selected.z,correct?0xb5ead5:0xf1c28d,1.9,.65);}
    if(correct){this.correct++;this.guardianPulse=1;for(let i=0;i<Math.min(this.correct,this.portalPieces.length);i++)this.portalPieces[i].material=this.mat(0xf3df92,true);
      for(const drone of this.drones){drone.cooldown+=1.4;drone.windup=null;drone.warning.visible=false;}
      const target=this.targets[this.selected??0];if(target)this.burst(target.x,1.1,target.z,0xc8ffe4,20);
      this.health=Math.min(5,this.health+1);this.dropPickup(this.hero.position.x+.8,this.hero.position.z-.4);
    }else{
      this.wrongAttack=3.6;this.hooks.attack(true);this.guardianWindup=createAttackWindup({x:0,z:-12},this.hero.position,1.05);this.guardianWarning.position.set(0,0,-12);this.guardianWarning.rotation.y=Math.atan2(this.guardianWindup.direction.x,this.guardianWindup.direction.z);this.guardianWarning.visible=true;
      if(this.drones.length<7)this.spawnDrone(this.drones.length);
    }
    this.publishTelemetry();
  }
  private input(){return normalizeInput(this.stick.x+(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0),this.stick.z+(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0));}
  private aimDestination():ArenaPoint{
    if(!this.manualAim&&this.selected!==null&&!this.answerSent&&this.targets[this.selected])return this.targets[this.selected];
    if(!this.manualAim){const nearby=this.drones.filter(drone=>!arenaLineBlocked(this.hero.position,drone.position,this.covers)).sort((a,b)=>this.distance(a.position)-this.distance(b.position))[0];if(nearby)return nearby.position;}
    return{x:this.hero.position.x+this.aim.x*10,z:this.hero.position.z+this.aim.z*10};
  }
  private distance(point:ArenaPoint){return Math.hypot(point.x-this.hero.position.x,point.z-this.hero.position.z);}
  private fire(){
    if(this.paused||!this.loaded||this.fireCooldown>0)return;
    const target=this.aimDestination(),direction=arenaAim(this.hero.position,target);this.aim=direction;this.fireCooldown=.3;
    const answer=this.selected!==null&&!this.answerSent?this.selected:null;
    this.heroBody.rotation.y=Math.atan2(-direction.x,-direction.z);
    this.recoil=.18;this.heroTool.updateWorldMatrix(true,false);
    const muzzle=this.heroTool.localToWorld(new THREE.Vector3(0,0,-.62));
    const obstruction=firstCoverImpact(this.hero.position,muzzle,this.covers);
    if(obstruction){this.pulse(obstruction.x,obstruction.z,0xf2c68e,.75,.25);this.burst(obstruction.x,1.3,obstruction.z,0xf2c68e,4);}
    else{this.createBolt(muzzle.x,muzzle.z,arenaAim(muzzle,target),false,answer);this.burst(muzzle.x,1.55,muzzle.z,0xebffeb,2);}
    this.hooks.sound?.('shot');
  }
  private createBolt(x:number,z:number,direction:ArenaPoint,hostile:boolean,answer:number|null=null){
    const mesh=new THREE.Group();mesh.position.set(x,1.55,z);mesh.rotation.y=Math.atan2(direction.x,direction.z);this.actors.add(mesh);
    const color=hostile?0xf1a779:0xb8f1e6;
    const core=this.sphere(hostile?.2:.16,0,0,0,color,mesh,true);core.scale.z=hostile?1.2:2.1;core.castShadow=false;
    const tip=this.sphere(.095,0,0,.17,0xf8ffed,mesh,true);tip.castShadow=false;
    if(!this.low){
      const trail=this.box(hostile?.11:.09,.08,.62,0,0,-.42,color,mesh,.04);trail.material=this.translucent(hostile?'hostile-trail':'hero-trail',color,.5);trail.castShadow=false;
    }
    const speed=hostile?5.2:19;this.bolts.push({mesh,x,z,dx:direction.x*speed,dz:direction.z*speed,life:hostile?4:1.8,hostile,answer});
  }
  private fireGuardianFan(direction:ArenaPoint){
    const angle=Math.atan2(direction.x,direction.z);
    for(let i=-2;i<=2;i++){const spread=angle+i*.17;this.createBolt(0,-11.8,{x:Math.sin(spread),z:Math.cos(spread)},true);}
    this.pulse(0,-12,0xf6cb93,1.5,.45);
  }
  private pulse(x:number,z:number,color:number,radius=1,life=.4){
    if(this.pulses.length>(this.low?12:24))return;
    const mesh=this.ring(1,.08,color,this.actors,x,.15,z);mesh.scale.setScalar(.2);mesh.material=this.translucent(`pulse:${color}`,color,.68);
    this.pulses.push({mesh,life,total:life,radius});
  }
  private burst(x:number,y:number,z:number,color:number,count:number){
    if(this.reduced)count=Math.min(3,count);if(this.low)count=Math.ceil(count*.6);
    count=Math.min(count,Math.max(0,(this.low?70:140)-this.bursts.length));
    for(let i=0;i<count;i++){const mesh=this.mesh(this.geo('particle',()=>new THREE.OctahedronGeometry(.12,0)),color,this.actors,x,y,z,true),angle=this.random()*Math.PI*2,life=.35+this.random()*.4;this.bursts.push({mesh,velocity:new THREE.Vector3(Math.cos(angle)*2,this.random()*3+1,Math.sin(angle)*2),life,total:life});}
  }
  private dropPickup(x:number,z:number){
    if(this.pickups.length>=16)return;
    const group=new THREE.Group();group.position.set(x,.4,z);this.actors.add(group);
    const crystal=this.mesh(this.geo('pickup',()=>new THREE.OctahedronGeometry(.26,0)),0x97e8c5,group,0,0,0,true);crystal.rotation.z=.3;
    this.pickups.push({group,x,z,phase:this.random()*6});
  }
  private hitPlayer(){
    if(this.hurtTime>0){this.pulse(this.hero.position.x,this.hero.position.z,0xb7fff3,1.5,.28);return;}
    this.health--;this.hurtTime=1.3;this.damageFlash=.22;this.regenTime=0;this.burst(this.hero.position.x,1,this.hero.position.z,0xf2c591,6);this.pulse(this.hero.position.x,this.hero.position.z,0xf2c591,1.55,.35);this.hooks.sound?.('hit');
    if(this.health<=0){this.health=5;this.hero.position.set(0,0,7.4);this.hurtTime=3;this.clearBolts();this.pulse(0,7.4,0xb7fff3,2,.7);for(const drone of this.drones){drone.cooldown=Math.max(2,drone.cooldown);drone.windup=null;drone.warning.visible=false;}}
    this.publishTelemetry();
  }
  private clearBolts(){for(const bolt of this.bolts)this.actors.remove(bolt.mesh);this.bolts=[];}
  private updatePlayer(delta:number){
    this.fireCooldown=Math.max(0,this.fireCooldown-delta);this.dashCooldown=Math.max(0,this.dashCooldown-delta);this.hurtTime=Math.max(0,this.hurtTime-delta);this.dashTime=Math.max(0,this.dashTime-delta);this.regenTime+=delta;
    this.damageFlash=Math.max(0,this.damageFlash-delta);this.recoil=Math.max(0,this.recoil-delta);
    if(this.regenTime>7&&this.health<5){this.health++;this.regenTime=0;}
    const movement=this.input(),dash=this.dashTime>0,velocity=dash?this.dashDirection:movement,speed=dash?22:5.2;
    const next=slideArenaMovement(this.hero.position,{x:velocity.x*speed*delta,z:velocity.z*speed*delta},this.covers,.68);
    const distance=Math.hypot(next.x-this.hero.position.x,next.z-this.hero.position.z);
    this.hero.position.x=next.x;this.hero.position.z=next.z;
    const moving=distance>delta*.1;this.stride+=distance*2.9;
    if(moving&&!this.firing){this.aim=arenaAim({x:0,z:0},velocity);this.heroBody.rotation.y=turnToward(this.heroBody.rotation.y,Math.atan2(-velocity.x,-velocity.z),this.reduced?1:1-Math.exp(-delta*17));}
    this.heroBody.position.y=this.reduced?0:moving?Math.abs(Math.sin(this.stride))*.055:Math.sin(this.elapsed*2)*.014;
    this.heroBody.rotation.z=this.reduced?0:moving?Math.sin(this.stride)*.025:0;
    this.heroBody.rotation.x=this.reduced?0:dash?-.12:this.recoil*.13;
    this.heroTool.position.z=-.43+(this.reduced?0:this.recoil*.4);
    this.heroFeet.forEach((foot,index)=>{
      const phase=this.stride+index*Math.PI,swing=moving&&!this.reduced?Math.sin(phase):0;
      foot.position.z=-.06+swing*.16;foot.position.y=.29+Math.max(0,swing)*.12;foot.rotation.x=swing*.23;
    });
    this.heroArms.forEach((arm,index)=>{arm.rotation.x=this.reduced?0:index===1&&(this.firing||this.recoil>0)?-.12+this.recoil*.7:moving?Math.sin(this.stride+(index?0:Math.PI))*.19:0;});
    this.heroCore.material=this.mat(this.damageFlash>0?0xf2cf91:0x548bc2);
    this.shieldBubble.visible=this.hurtTime>0;this.shieldRing.visible=this.hurtTime>0;
    this.shieldRing.material=this.mat(this.damageFlash>0?0xf3c58e:0xb7fff3,true);
    this.dashPips.forEach((pip,index)=>{pip.material=this.mat(index<Math.ceil(8*(1-this.dashCooldown/3.2))?0xb7fff3:0x4c7478,this.dashCooldown===0);});
    if(dash){this.dashTrailTime-=delta;if(this.dashTrailTime<=0){this.dashTrailTime=.065;this.pulse(next.x,next.z,0xb7fff3,.95,.24);}}
    this.footstepTime-=delta;
    if(moving&&!dash&&!this.reduced&&this.footstepTime<=0){this.footstepTime=.22;this.burst(next.x,.1,next.z,0xd9d0b4,1);}
    // Damage feedback must never make the player lose sight of their character.
    this.heroBody.visible=true;
    if(this.firing||this.keys.has('e'))this.fire();
    const target=this.aimDestination(),impact=firstCoverImpact(this.hero.position,target,this.covers),end=impact??target,direction=arenaAim(this.hero.position,end),length=this.distance(end),line=this.aimLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    const visible=(this.selected!==null&&!this.answerSent)||this.firing,color=impact?0xf4c28c:0xe6f3c9;
    line.setXYZ(0,this.hero.position.x,.17,this.hero.position.z);line.setXYZ(1,end.x,.17,end.z);line.needsUpdate=true;this.aimLine.visible=visible;
    (this.aimLine.material as THREE.LineBasicMaterial).color.setHex(color);
    this.aimMarkers.forEach((marker,index)=>{
      const fraction=(index+.3)/this.aimMarkers.length;marker.visible=visible&&length>1.3;marker.material=this.mat(color,true);marker.position.set(this.hero.position.x+direction.x*length*fraction,.17,this.hero.position.z+direction.z*length*fraction);marker.rotation.y=Math.atan2(direction.x,direction.z);
    });
    this.aimReticle.visible=visible;this.aimReticle.position.set(end.x,.03,end.z);
    this.aimReticle.children.forEach(object=>{if(object instanceof THREE.Mesh)object.material=this.mat(color,true);});
  }
  private updateDrones(delta:number){
    this.waveCooldown=Math.max(0,this.waveCooldown-delta);
    for(const drone of this.drones){
      drone.cooldown-=delta;drone.hurt=Math.max(0,drone.hurt-delta);drone.recoil=Math.max(0,drone.recoil-delta);
      const direction=arenaAim(drone.position,this.hero.position),distance=this.distance(drone.position),speed=drone.kind==='runner'?1.35:1;
      if(!drone.windup&&distance>(drone.kind==='runner'?1.8:5.3)&&this.waveCooldown<=0){
        let next=slideArenaMovement(drone.position,{x:direction.x*speed*delta,z:direction.z*speed*delta},this.covers,.5);
        if(Math.hypot(next.x-drone.position.x,next.z-drone.position.z)<speed*delta*.4){const sign=Math.sin(drone.phase)>0?1:-1;next=slideArenaMovement(drone.position,{x:direction.z*speed*sign*delta,z:-direction.x*speed*sign*delta},this.covers,.5);}
        drone.position=next;
      }
      if(distance<1.15&&!drone.windup){drone.position=slideArenaMovement(drone.position,{x:-direction.x*delta*2,z:-direction.z*delta*2},this.covers,.5);}
      if(!drone.windup&&drone.cooldown<=0&&distance<13&&!arenaLineBlocked(drone.position,this.hero.position,this.covers)&&this.waveCooldown<=0){
        drone.windup=createAttackWindup(drone.position,this.hero.position,drone.kind==='sentry'?.9:.76);drone.warning.visible=true;
      }
      if(drone.windup){
        const step=advanceAttackWindup(drone.windup,delta);drone.windup=step.next;
        const aim=drone.windup.direction,desired={x:drone.position.x+aim.x*13,z:drone.position.z+aim.z*13},end=firstCoverImpact(drone.position,desired,this.covers)??desired,len=Math.hypot(end.x-drone.position.x,end.z-drone.position.z);
        drone.warning.position.set(drone.position.x,0,drone.position.z);drone.warning.rotation.y=Math.atan2(aim.x,aim.z);drone.warningLine.scale.z=len;drone.warningLine.position.z=len/2;
        drone.warningRing.scale.setScalar(.8+step.progress*.4);drone.warningLine.scale.x=.7+step.progress*.9;
        if(step.fire){this.createBolt(drone.position.x+aim.x*.65,drone.position.z+aim.z*.65,aim,true);this.pulse(drone.position.x,drone.position.z,0xf7c494,1,.25);drone.windup=null;drone.warning.visible=false;drone.cooldown=drone.kind==='sentry'?2.2:3.7;drone.recoil=.2;}
      }
      const facing=drone.windup?.direction??direction;
      drone.group.position.set(drone.position.x,0,drone.position.z);drone.body.rotation.y=turnToward(drone.body.rotation.y,Math.atan2(-facing.x,-facing.z),this.reduced?1:1-Math.exp(-delta*10));drone.body.position.y=this.reduced?0:Math.sin(this.elapsed*3+drone.phase)*.065-(drone.windup?.08:0);
      drone.body.rotation.x=this.reduced?0:drone.recoil*.5;drone.body.scale.setScalar(this.reduced?1:drone.hurt>0?1.09:1);
      drone.rotors.forEach((rotor,index)=>{if(!this.reduced)rotor.rotation.y+=(index?1:-1)*delta*(drone.windup?19:11);});
      drone.pips.forEach((pip,index)=>{pip.material=this.mat(index<drone.health?(drone.windup?0xffca88:0xf8e3ad):0x736353,!!drone.windup);});
    }
  }
  private updateBolts(delta:number){
    for(let i=this.bolts.length-1;i>=0;i--){
      const bolt=this.bolts[i];if(!bolt)continue;
      const from={x:bolt.x,z:bolt.z},to={x:bolt.x+bolt.dx*delta,z:bolt.z+bolt.dz*delta};bolt.life-=delta;
      const coverHit=firstCoverImpact(from,to,this.covers),end=coverHit??to;let impact=end;
      let remove=bolt.life<=0||Math.abs(to.x)>10.3||Math.abs(to.z)>13.2;
      const steps=Math.max(1,Math.ceil(Math.hypot(end.x-from.x,end.z-from.z)/.2));
      for(let step=1;step<=steps&&!remove;step++){
        const x=from.x+(end.x-from.x)*step/steps,z=from.z+(end.z-from.z)*step/steps;
        if(bolt.hostile){if(Math.hypot(x-this.hero.position.x,z-this.hero.position.z)<.72){this.hitPlayer();remove=true;}}
        else{
          if(!this.answerSent&&bolt.answer!==null){const target=this.targets[bolt.answer];if(target&&Math.hypot(x-target.x,z-target.z)<.85){this.answerSent=true;this.selected=target.index;this.firing=false;target.orb.visible=false;this.burst(target.x,1.3,target.z,0xe9efe0,10);this.pulse(target.x,target.z,0xe9efe0,1.4,.35);this.hooks.answer(target.index);remove=true;}}
          if(!remove){const drone=this.drones.find(item=>Math.hypot(x-item.position.x,z-item.position.z)<.76);if(drone){
            drone.health--;drone.hurt=.16;remove=true;this.burst(x,1.4,z,0xf9d5aa,5);this.pulse(drone.position.x,drone.position.z,0xf9d5aa,.9,.25);
            const push=arenaAim({x:0,z:0},{x:bolt.dx,z:bolt.dz});drone.position=slideArenaMovement(drone.position,{x:push.x*.3,z:push.z*.3},this.covers,.5);
            if(drone.health<=0){this.actors.remove(drone.group,drone.warning);this.drones.splice(this.drones.indexOf(drone),1);this.dropPickup(drone.position.x,drone.position.z);this.burst(drone.position.x,1,drone.position.z,0xf9d5aa,9);}
          }}
        }
        if(remove)impact={x,z};
      }
      if(coverHit&&!remove){remove=true;this.pulse(coverHit.x,coverHit.z,0xe9c99c,.65,.22);}
      if(remove){if(bolt.life>0)this.burst(impact.x,1.4,impact.z,coverHit?0xe9c99c:bolt.hostile?0xecc391:0xc4f4e8,2);this.actors.remove(bolt.mesh);const index=this.bolts.indexOf(bolt);if(index>=0)this.bolts.splice(index,1);}else{bolt.x=to.x;bolt.z=to.z;bolt.mesh.position.set(to.x,1.55,to.z);}
    }
  }
  private updateEffects(delta:number){
    for(let i=this.pulses.length-1;i>=0;i--){const pulse=this.pulses[i];pulse.life-=delta;if(pulse.life<=0){this.actors.remove(pulse.mesh);this.pulses.splice(i,1);continue;}const progress=1-pulse.life/pulse.total;pulse.mesh.scale.setScalar(pulse.radius*(this.reduced?.75:.2+progress*.8));}
    for(let i=this.bursts.length-1;i>=0;i--){const burst=this.bursts[i];burst.life-=delta;if(burst.life<=0){this.actors.remove(burst.mesh);this.bursts.splice(i,1);continue;}burst.velocity.y-=7*delta;burst.mesh.position.addScaledVector(burst.velocity,delta);burst.mesh.scale.setScalar(burst.life/burst.total);}
    for(let i=this.pickups.length-1;i>=0;i--){const pickup=this.pickups[i];pickup.group.position.y=.55+(this.reduced?0:Math.sin(this.elapsed*3+pickup.phase)*.12);if(!this.reduced)pickup.group.rotation.y+=delta;
      if(this.distance(pickup)<2.8&&!arenaLineBlocked(pickup,this.hero.position,this.covers,.15)){const direction=arenaAim(pickup,this.hero.position),distance=Math.min(this.distance(pickup),delta*5);pickup.x+=direction.x*distance;pickup.z+=direction.z*distance;pickup.group.position.x=pickup.x;pickup.group.position.z=pickup.z;}
      if(this.distance(pickup)<1.15){this.actors.remove(pickup.group);this.pickups.splice(i,1);this.collected++;this.health=Math.min(5,this.health+1);this.burst(pickup.x,.6,pickup.z,0xc3f5d5,5);this.hooks.sound?.('collect');}}
    for(const target of this.targets){
      if(!this.reduced){target.orb.rotation.y=this.elapsed*.6;target.orb.position.y=1.3+Math.sin(this.elapsed*2+target.index)*.08;}
      const selected=this.selected===target.index;target.ring.material=this.mat(selected?0xffe6a5:0x9bd7c5,true);target.ring.scale.setScalar(selected?1.13:1);target.brackets.visible=selected&&!this.answerSent;
      target.brackets.rotation.y=this.reduced?0:Math.sin(this.elapsed*2)*.04;
    }
    this.guardianPulse=Math.max(0,this.guardianPulse-delta);this.guardian.scale.setScalar(this.reduced?1:1+this.guardianPulse*.08);
    if(this.guardianWindup){const step=advanceAttackWindup(this.guardianWindup,delta);this.guardianWindup=step.next;if(step.fire){this.fireGuardianFan(step.next.direction);this.guardianWindup=null;this.guardianWarning.visible=false;}}
    if(this.wrongAttack>0){this.wrongAttack-=delta;if(this.wrongAttack<=0)this.hooks.attack(false);}
  }
  private publishTelemetry(){
    const selected=this.selected!==null&&!this.answerSent?this.targets[this.selected]:undefined;
    const data={health:this.health,dashCooldown:Math.ceil(this.dashCooldown*10)/10,enemies:this.drones.length,collected:this.collected,wave:this.questionIndex+1,aimBlocked:!!selected&&arenaLineBlocked(this.hero.position,selected,this.covers,.13)};
    const key=JSON.stringify(data);if(key!==this.lastTelemetry){this.lastTelemetry=key;this.hooks.telemetry?.(data);}
  }
  private animate=(time:number)=>{
    if(this.disposed)return;this.frame=requestAnimationFrame(this.animate);
    const delta=Math.min(.04,(time-this.previousFrame)/1000);this.previousFrame=time;
    if(this.paused||document.hidden||!this.loaded){if(!this.pausedRendered){this.renderer.render(this.scene,this.camera);this.pausedRendered=true;}return;}
    this.pausedRendered=false;this.elapsed+=delta;this.updatePlayer(delta);this.updateDrones(delta);this.updateBolts(delta);this.updateEffects(delta);
    this.telemetryTime+=delta;if(this.telemetryTime>.1){this.telemetryTime=0;this.publishTelemetry();}
    const targetFocus=this.focusForViewport();
    if(this.reduced)this.cameraFocus.copy(targetFocus);else this.cameraFocus.lerp(targetFocus,1-Math.exp(-delta*3));
    this.camera.position.set(this.cameraFocus.x,31,22+this.cameraFocus.z);this.camera.lookAt(this.cameraFocus);
    this.renderer.render(this.scene,this.camera);
  };
  private resize(){
    const width=Math.max(1,this.host.clientWidth),height=Math.max(1,this.host.clientHeight),aspect=width/height;
    this.portrait=aspect<.95;
    this.shortLandscape=aspect>1&&height<=500;
    this.cameraFocus.copy(this.focusForViewport());
    const visibleWidth=Math.max(this.portrait?22:23.5,aspect*24),visibleHeight=visibleWidth/aspect;
    this.camera.left=-visibleWidth/2;this.camera.right=visibleWidth/2;this.camera.top=visibleHeight/2;this.camera.bottom=-visibleHeight/2;this.camera.position.set(this.cameraFocus.x,31,22+this.cameraFocus.z);this.camera.lookAt(this.cameraFocus);this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);this.pausedRendered=false;
  }
  private focusForViewport(){
    // A short landscape viewport follows the explorer below the question panel.
    if(this.shortLandscape)return new THREE.Vector3(this.hero.position.x*.3,0,this.hero.position.z-4);
    return new THREE.Vector3(this.portrait?Math.max(-1.4,Math.min(1.4,this.hero.position.x*.2)):0,0,this.portrait?Math.max(-1.5,Math.min(.8,this.hero.position.z*.12)):-.8);
  }
  private bindControls(){
    const canvas=this.renderer.domElement;
    const on=<K extends keyof WindowEventMap>(type:K,handler:(event:WindowEventMap[K])=>void)=>{window.addEventListener(type,handler);this.listeners.push(()=>window.removeEventListener(type,handler));};
    on('keydown',event=>{if(this.paused)return;if(event.target instanceof HTMLElement&&(event.target.closest('input,textarea,select,[role=dialog]')||(event.target.closest('button')&&['Enter',' '].includes(event.key))))return;const key=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' '].includes(key))event.preventDefault();this.keys.add(key);if(key===' '||key==='shift')this.dodge();if(/^[1-4]$/.test(key))this.choose(Number(key)-1);});
    on('keyup',event=>this.keys.delete(event.key.toLowerCase()));
    on('blur',()=>{this.keys.clear();this.firing=false;this.stick={x:0,z:0};});
    const pointer=(event:PointerEvent)=>{const bounds=canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1),this.camera);const point=new THREE.Vector3();this.raycaster.ray.intersectPlane(this.ground,point);return point;};
    const down=(event:PointerEvent)=>{if(this.paused)return;canvas.setPointerCapture(event.pointerId);const point=pointer(event);const target=this.targets.find(item=>Math.hypot(item.x-point.x,item.z-point.z)<1.45);if(target)this.choose(target.index);else{this.aim=arenaAim(this.hero.position,point);this.manualAim=true;}this.firing=true;this.fire();};
    const move=(event:PointerEvent)=>{if(!canvas.hasPointerCapture(event.pointerId)||this.paused)return;const point=pointer(event);this.aim=arenaAim(this.hero.position,point);this.manualAim=true;};
    const up=()=>{this.firing=false;this.manualAim=false;};
    const lost=(event:Event)=>{event.preventDefault();this.hooks.contextLost();};
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('webglcontextlost',lost);
    this.listeners.push(()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('webglcontextlost',lost);});
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.listeners.forEach(remove=>remove());
    const geometries=new Set<THREE.BufferGeometry>(this.geometryCache.values()),materials=new Set<THREE.Material>(this.materials.values());
    this.scene.traverse(object=>{if(object instanceof THREE.Mesh){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));if(object instanceof THREE.InstancedMesh)object.dispose();}});
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());this.textures.forEach(texture=>texture.dispose());this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();this.scene.clear();
  }
}
