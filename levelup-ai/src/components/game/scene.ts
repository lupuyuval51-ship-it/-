import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clampMovement, lanePosition, nearestLane, normalizeInput, seededRandom, segmentGameText, WORLD_PALETTES, type DailyGame, type GameLocale, type GameQuestion, type GameSettings } from "@/lib/game";
import { gameMessages } from "./messages";
import type { GameSceneHooks } from "./scene-types";

type Target = { mesh: THREE.Object3D; index: number; position: THREE.Vector3; kind: "answer" | "terminal" | "delivery" | "shield"; ring?: THREE.Mesh };

/** One renderer, shared low-poly materials, deterministic worlds, no generated code. */
export class QuestScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(52, 1, 0.1, 160);
  private lastFrame = performance.now();
  private player = new THREE.Group();
  private dynamic = new THREE.Group();
  private environment = new THREE.Group();
  private feedback = new THREE.Group();
  private route = new THREE.Group();
  private avatar?: THREE.Object3D;
  private boss?: THREE.Group;
  private door?: THREE.Mesh;
  private drawer?: THREE.Mesh;
  private wave?: THREE.Mesh;
  private attackLane?: THREE.Mesh;
  private selectedLane?: THREE.Mesh;
  private bossSegments: THREE.Mesh[] = [];
  private doorLocks: THREE.Mesh[] = [];
  private doorTarget = 2.5;
  private drawerTarget = 0;
  private answerResults = new Map<number, boolean>();
  private correctAnswers = 0;
  private feedbackLife = 0;
  private feedbackDuration = 0.65;
  private targets: Target[] = [];
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private textures = new Set<THREE.Texture>();
  private geometries = new Set<THREE.BufferGeometry>();
  private privateMaterials = new Set<THREE.Material>();
  private listeners: (() => void)[] = [];
  private resize: ResizeObserver;
  private raycaster = new THREE.Raycaster();
  private keys = new Set<string>();
  private joystick = { x: 0, z: 0 };
  private pointerStart?: { x: number; y: number };
  private pointerLast?: { x: number; y: number };
  private frame = 0;
  private disposed = false;
  private loaded = false;
  private paused = true;
  private pausedRendered = false;
  private busy = false;
  private low: boolean;
  private reduced: boolean;
  private question?: GameQuestion;
  private questionIndex = 0;
  private selected = 0;
  private lane = 0;
  private jumpVelocity = 0;
  private playerHeight = 0;
  private yaw = 0;
  private pitch = 0;
  private destination?: THREE.Vector3;
  private carryIndex: number | null = null;
  private carryMesh?: THREE.Mesh;
  private opened = false;
  private combo = 0;
  private attackTime = 0;
  private shieldCount = 0;
  private obstacleCooldown = 0;
  private laneSwitchCooldown = 0;
  private autoAction = false;
  private ambientTime = 0;
  private readonly palette;

  constructor(private host: HTMLDivElement, private game: DailyGame, private locale: GameLocale, private settings: GameSettings, private hooks: GameSceneHooks) {
    const device = navigator as Navigator & { deviceMemory?: number };
    this.low = settings.quality === "low" || settings.graphics === "low" || ((settings.quality === "auto" || !settings.quality) && ((device.deviceMemory ?? 8) <= 4 || navigator.hardwareConcurrency <= 4 || window.innerWidth < 600));
    this.reduced = Boolean(settings.reducedMotion) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.correctAnswers = game.resumeState?.correct ?? 0;
    this.palette = WORLD_PALETTES[game.worldTheme] || WORLD_PALETTES["future-city"];
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.low, alpha: false, powerPreference: this.low ? "low-power" : "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.low ? 1 : 1.7));
    this.renderer.shadowMap.enabled = !this.low;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "none";
    this.scene.background = new THREE.Color(this.palette.sky);
    this.scene.fog = new THREE.FogExp2(this.palette.fog, this.low ? 0.017 : 0.011);
    this.scene.add(this.environment, this.dynamic, this.player, this.feedback, this.route);
    this.addLight();
    this.buildWorld();
    this.buildMode();
    this.bindControls();
    this.resize = new ResizeObserver(() => this.onResize());
    this.resize.observe(host);
    this.onResize();
    this.hooks.loading(12);
    this.loadAvatar();
    this.frame = requestAnimationFrame(this.animate);
  }

  private material(color: number, metalness = 0, emissive = false): THREE.MeshStandardMaterial {
    const key = `${color}-${metalness}-${emissive}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: metalness ? 0.45 : 0.82, metalness, emissive: emissive ? color : 0x000000, emissiveIntensity: emissive ? 0.35 : 0 });
      this.materials.set(key, material);
    }
    return material;
  }

  private geometry<T extends THREE.BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry; }
  private box(width: number, height: number, depth: number, x: number, y: number, z: number, color: number, parent: THREE.Object3D = this.environment, emissive = false): THREE.Mesh {
    const mesh = new THREE.Mesh(this.geometry(new THREE.BoxGeometry(width, height, depth)), this.material(color, 0.12, emissive));
    mesh.position.set(x, y, z); mesh.castShadow = !this.low && !emissive; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private cylinder(radius: number, height: number, x: number, y: number, z: number, color: number, parent: THREE.Object3D = this.environment): THREE.Mesh {
    const mesh = new THREE.Mesh(this.geometry(new THREE.CylinderGeometry(radius, radius, height, this.low ? 8 : 16)), this.material(color, 0.15));
    mesh.position.set(x, y, z); mesh.receiveShadow = true; mesh.castShadow = !this.low; parent.add(mesh); return mesh;
  }
  private ring(radius: number, x: number, y: number, z: number, parent: THREE.Object3D = this.dynamic, color = this.palette.accent): THREE.Mesh {
    const ring = new THREE.Mesh(this.geometry(new THREE.TorusGeometry(radius, 0.045, 4, this.low ? 16 : 32)), this.material(color, 0.1, true));
    ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z); parent.add(ring); return ring;
  }
  private basicMaterial(parameters: THREE.MeshBasicMaterialParameters) {
    const material = new THREE.MeshBasicMaterial(parameters); this.privateMaterials.add(material); return material;
  }
  private addLight() {
    this.scene.add(new THREE.HemisphereLight(this.palette.light, this.palette.ground, 2.3));
    const sun = new THREE.DirectionalLight(this.palette.light, 3);
    sun.position.set(8, 20, 6); sun.castShadow = !this.low;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -22; sun.shadow.camera.right = 22; sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -28; sun.shadow.normalBias = 0.03;
    this.scene.add(sun);
  }

  private buildWorld() {
    const random = seededRandom(`${this.game.seed}:${this.game.worldTheme}`);
    const p = this.palette;
    if (this.game.gameMode === "build-path") {
      this.box(22, 1.2, 23, 0, -0.6, 3.5, p.ground);
      this.box(8, 1.2, 7, 0, -0.6, -35, p.ground);
      this.box(22, 0.14, 0.18, 0, 0.04, -7.8, p.trim);
    } else this.box(22, 1, 44, 0, -0.5, -8, p.ground);
    this.box(0.16, 0.18, 44, -10.7, 0.1, -8, p.trim);
    this.box(0.16, 0.18, 44, 10.7, 0.1, -8, p.trim);
    for (let i = 0; i < 11; i++) {
      if (this.game.gameMode !== "build-path" || i < 6) this.box(21, 0.035, 0.06, 0, 0.03, 12 - i * 4, p.trim);
      this.box(0.04, 0.035, this.game.gameMode === "build-path" ? 22 : 42, -8 + i * 1.6, 0.035, this.game.gameMode === "build-path" ? 3 : -8, p.structure);
    }
    if (this.game.worldTheme === "future-city") {
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < (this.low ? 8 : 12); i++) {
          const height = 6 + random() * 25;
          const x = side * (15 + random() * 13), z = 16 - i * 6;
          this.box(3 + random() * 3, height, 3, x, height / 2 - 3, z, p.structure);
          this.box(0.14, height * 0.7, 3.1, x, height / 2 - 2, z, p.trim);
          if (!this.low || i % 2 === 0) for (let floor = 0; floor < Math.min(this.low ? 3 : 6, height / 2); floor++) this.box(2.4, 0.12, 3.04, x, floor * 2, z, p.accent, this.environment, true);
        }
      }
      this.box(33, 0.5, 2, 0, 8, -32, p.structure);
      this.box(35, 0.15, 0.2, 0, 8.5, -32, p.accent, this.environment, true);
      for (const x of [-11, 11]) for (const z of [6, -6, -18]) {
        this.box(0.2, 4.2, 0.2, x, 2.1, z, p.trim);
        this.box(1.8, 0.1, 0.25, x - Math.sign(x) * 0.7, 4.2, z, p.accent, this.environment, true);
      }
    } else if (this.game.worldTheme === "sky-island") {
      for (let i = 0; i < (this.low ? 9 : 18); i++) {
        const x = (random() - 0.5) * 90, z = -random() * 70, y = -3 - random() * 12;
        const island = new THREE.Mesh(this.geometry(new THREE.ConeGeometry(3 + random() * 5, 9, 6)), this.material(p.structure));
        island.rotation.z = Math.PI; island.position.set(x, y, z); this.environment.add(island);
        this.cylinder(3.8, 0.6, x, y + 4, z, p.ground);
        this.box(0.4, 4, 0.4, x, y + 6, z, p.trim);
        const leaves = new THREE.Mesh(this.geometry(new THREE.IcosahedronGeometry(2, 0)), this.material(0x6e947e)); leaves.position.set(x, y + 8, z); this.environment.add(leaves);
      }
      if (this.game.gameMode !== "build-path") this.cylinder(12, 2, 0, -1.5, -6, p.structure);
      for (const x of [-9, 9]) {
        this.cylinder(0.35, 4, x, 2, 3, p.trim);
        this.box(2.2, 1, 0.08, x - Math.sign(x) * 0.9, 3.3, 3, p.accent);
      }
    } else if (this.game.worldTheme === "ai-lab") {
      this.box(24, 1, 46, 0, 10, -8, p.structure);
      for (const x of [-11.5, 11.5]) {
        this.box(0.8, 11, 44, x, 4.5, -8, p.structure);
        for (let z = 8; z >= -24; z -= 8) {
          this.cylinder(1.8, 5.6, x * 0.8, 2.8, z, p.trim);
          this.box(0.2, 4.6, 1.5, x * 0.8 - Math.sign(x) * 1.81, 3, z, p.accent, this.environment, true);
          this.box(8, 0.12, 0.3, 0, 9.3, z, p.accent, this.environment, true);
          this.ring(1.9, x * 0.8, 0.07, z, this.environment);
        }
      }
    } else if (this.game.worldTheme === "mystery-castle") {
      for (const x of [-12, 12]) {
        this.box(1.8, 9, 46, x, 4, -8, p.structure);
        for (let z = 12; z >= -30; z -= 7) {
          this.cylinder(1.8, 14, x, 6, z, p.structure);
          for (let crown = 0; crown < 5; crown++) this.box(0.7, 1.2, 0.7, x + Math.cos(crown * 1.26) * 1.5, 13.2, z + Math.sin(crown * 1.26) * 1.5, p.trim);
          this.box(0.25, 1.2, 0.35, x - Math.sign(x) * 1.1, 3, z, p.accent, this.environment, true);
          if (!this.low) { const banner = this.box(1.4, 2.7, 0.08, x - Math.sign(x) * 1.05, 7, z + 1.7, p.accent); banner.rotation.y = Math.PI / 2; }
        }
      }
      this.box(25, 8, 1.5, 0, 3.5, -30, p.structure);
    } else {
      const count = this.low ? 28 : 64;
      for (let i = 0; i < count; i++) {
        const cube = this.box(1.2, 1.2, 1.2, (random() < 0.5 ? -1 : 1) * (13 + random() * 25), random() * 18 - 2, 10 - random() * 65, i % 4 === 0 ? p.accent : p.structure, this.environment, i % 4 === 0);
        cube.rotation.set(random() * 0.6, random() * 0.6, 0);
      }
      for (let z = -4; z > -40; z -= 9) {
        this.box(20, 0.12, 0.12, 0, 9, z, p.accent, this.environment, true);
        this.box(0.12, 9, 0.12, -10, 4.5, z, p.accent, this.environment, true);
        this.box(0.12, 9, 0.12, 10, 4.5, z, p.accent, this.environment, true);
      }
    }
  }

  private buildMode() {
    const p = this.palette;
    if (this.game.gameMode === "answer-gates") {
      for (let lane = 0; lane < (this.game.questions[0]?.options[this.locale].length ?? 3); lane++) {
        const x = lanePosition(lane, this.game.questions[0].options[this.locale].length);
        for (let z = 9; z >= -19; z -= 3) this.box(0.07, 0.04, 1.3, x - 1.8, 0.045, z, p.trim);
      }
    }
    if (this.game.gameMode === "escape-room") {
      this.box(8.3, 7, 1, -6.2, 3.5, -15, p.structure);
      this.box(8.3, 7, 1, 6.2, 3.5, -15, p.structure);
      this.box(4.2, 1.6, 1, 0, 6.2, -15, p.structure);
      this.box(1, 7, 25, -10, 3.5, -3, p.structure);
      this.box(1, 7, 25, 10, 3.5, -3, p.structure);
      this.door = this.box(3.4, 5, 0.3, 0, 2.5, -14.4, p.trim);
      this.box(0.15, 4.4, 0.2, -1.9, 2.2, -14, p.accent, this.environment, true);
      this.box(0.15, 4.4, 0.2, 1.9, 2.2, -14, p.accent, this.environment, true);
      const exit = this.label(gameMessages[this.locale].door); exit.position.set(0, 6.4, -14.1); exit.scale.multiplyScalar(0.9); this.environment.add(exit);
      for (let i = 0; i < 4; i++) this.doorLocks.push(this.box(0.55, 0.32, 0.16, (i - 1.5) * 0.8, 5.3, -14.2, p.trim));
      for (const x of [-7, 7]) for (const z of [-10, -3, 5]) {
        this.box(2.2, 1.8, 1.6, x, 0.9, z, p.trim);
        this.box(2, 0.08, 1.8, x, 1.85, z, p.accent);
        for (let drawer = 0; drawer < 3; drawer++) this.box(1.8, 0.06, 0.07, x, 0.4 + drawer * 0.5, z + 0.85, p.structure);
      }
    }
    if (this.game.gameMode === "collect-sort") {
      this.cylinder(2.2, 0.15, 0, 0.09, 6, p.accent);
      this.cylinder(1.85, 0.17, 0, 0.13, 6, p.structure);
      this.ring(2.35, 0, 0.13, 6, this.environment);
      for (const x of [-2.3, 2.3]) {
        this.box(0.35, 1.4, 0.35, x, 0.7, 6, p.trim);
        this.box(0.42, 0.18, 0.42, x, 1.45, 6, p.accent, this.environment, true);
      }
      const sign = this.label(gameMessages[this.locale].deliverAction); sign.position.set(0, 1.8, 7.1); sign.scale.multiplyScalar(0.8); this.environment.add(sign);
    }
    if (this.game.gameMode === "build-path") {
      this.box(0.4, 5, 0.5, -2.4, 2.5, -35, p.trim); this.box(0.4, 5, 0.5, 2.4, 2.5, -35, p.trim);
      this.box(5.2, 0.4, 0.5, 0, 5, -35, p.accent, this.environment, true);
      const finish = this.label(gameMessages[this.locale].bridge); finish.position.set(0, 6.2, -35); this.environment.add(finish);
    }
    if (this.game.gameMode === "boss-quiz") {
      this.boss = new THREE.Group(); this.boss.position.set(0, 3.8, -16); this.environment.add(this.boss);
      const core = new THREE.Mesh(this.geometry(new THREE.IcosahedronGeometry(2.7, 1)), this.material(p.accent, 0.35)); this.boss.add(core);
      for (const x of [-0.9, 0.9]) this.box(0.48, 0.35, 0.12, x, 0.4, 2.54, 0x102037, this.boss);
      this.box(0.9, 0.14, 0.12, 0, -0.5, 2.63, 0x102037, this.boss);
      const ring = new THREE.Mesh(this.geometry(new THREE.TorusGeometry(3.6, 0.14, 6, 36)), this.material(p.trim, 0.5)); ring.rotation.x = Math.PI / 2; this.boss.add(ring);
      for (let i = 0; i < this.game.questions.length; i++) {
        const angle = i / this.game.questions.length * Math.PI * 2;
        const segment = this.box(0.6, 0.65, 0.42, Math.sin(angle) * 3.25, Math.cos(angle) * 2.85, 1.4, p.accent, this.boss, true);
        segment.rotation.z = -angle; this.bossSegments.push(segment);
      }
      this.ring(4.2, 0, 0.08, -16, this.environment);
      const waveMaterial = this.basicMaterial({ color: 0xe4b65a, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      this.wave = new THREE.Mesh(this.geometry(new THREE.BoxGeometry(3, 1.2, 0.4)), waveMaterial);
      this.wave.visible = false; this.scene.add(this.wave);
      this.attackLane = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(3.6, 27)), this.basicMaterial({ color: 0xe4b65a, transparent: true, opacity: 0.25, depthWrite: false }));
      this.attackLane.rotation.x = -Math.PI / 2; this.attackLane.position.set(0, 0.06, -1); this.attackLane.visible = false; this.scene.add(this.attackLane);
    }
  }

  private loadAvatar() {
    new GLTFLoader().load("/models/explorer.glb", (gltf) => {
      if (this.disposed) { this.disposeTree(gltf.scene); return; }
      this.avatar = gltf.scene;
      this.avatar.scale.setScalar(0.95);
      this.avatar.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = !this.low; object.receiveShadow = true; } });
      this.player.add(this.avatar); this.finishLoading();
    }, (progress) => { if (!this.disposed && progress.total) this.hooks.loading(Math.min(95, 12 + Math.round(progress.loaded / progress.total * 82))); }, () => {
      if (this.disposed) return;
      // Original primitive avatar is a usable fallback when the small GLB asset cannot load.
      this.avatar = new THREE.Group();
      this.box(0.75, 0.9, 0.5, 0, 1.1, 0, 0xe2e7ed, this.avatar);
      this.box(0.85, 0.65, 0.65, 0, 1.9, 0, 0xe2e7ed, this.avatar);
      this.box(0.58, 0.22, 0.05, 0, 1.92, -0.34, this.palette.accent, this.avatar, true);
      for (const x of [-0.22, 0.22]) this.box(0.27, 0.55, 0.3, x, 0.32, 0, this.palette.trim, this.avatar);
      this.player.add(this.avatar); this.finishLoading();
    });
  }
  private finishLoading() { this.loaded = true; this.hooks.loading(100); this.hooks.ready(this.low); }

  private label(text: string, index?: number): THREE.Sprite {
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 224;
    const ctx = canvas.getContext("2d")!;
    const fontFamily = getComputedStyle(this.host).fontFamily || "Arial, sans-serif";
    ctx.fillStyle = "#121b2a"; ctx.beginPath(); ctx.roundRect(3, 3, 634, 218, 14); ctx.fill();
    ctx.strokeStyle = `#${this.palette.trim.toString(16).padStart(6, "0")}`; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "#f3f5f7"; ctx.font = `500 33px ${fontFamily}`; ctx.textAlign = "center"; ctx.direction = this.locale === "he" ? "rtl" : "ltr";
    const words = text.split(" "); const lines: string[] = []; let line = "";
    for (const word of words) { if (ctx.measureText(`${line} ${word}`).width > 560 && line) { lines.push(line); line = word; } else line += `${line ? " " : ""}${word}`; }
    if (line) lines.push(line);
    if (lines.length > 3) lines[2] = `${lines[2].slice(0, 38)}…`;
    const isolated = (value: string) => segmentGameText(value).map(segment => segment.ltr ? `\u2066${segment.text}\u2069` : segment.text).join("");
    const start = lines.length === 1 ? 136 : lines.length === 2 ? 110 : 89;
    lines.slice(0, 3).forEach((value, row) => ctx.fillText(isolated(value), 320, start + row * 41, 575));
    if (index !== undefined) { ctx.fillStyle = "#9ebef4"; ctx.font = `600 28px ${fontFamily}`; ctx.fillText(String(index + 1), 320, 41); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; this.textures.add(texture);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false })); sprite.scale.set(3.8, 1.33, 1); return sprite;
  }

  setQuestion(question: GameQuestion, index: number) {
    this.clearDynamic(); this.question = question; this.questionIndex = index; this.busy = false; this.opened = false; this.carryIndex = null; this.carryMesh = undefined; this.destination = undefined; this.autoAction = false; this.drawer = undefined; this.selectedLane = undefined;
    this.hooks.opened(false); this.hooks.carrying(false);
    const count = question.options[this.locale].length;
    this.selected = Math.floor((count - 1) / 2); this.lane = this.selected; this.hooks.selection(this.selected);
    this.player.position.set(lanePosition(this.selected, count), 0, 8); this.yaw = 0;
    const p = this.palette;
    if (this.game.gameMode === "answer-gates") {
      this.selectedLane = this.box(3.1, 0.04, 27, lanePosition(this.selected, count), 0.065, -4.5, p.structure, this.dynamic);
      this.box(0.1, 0.045, 27, -1.25, 0.05, 0, p.accent, this.selectedLane, true);
      this.box(0.1, 0.045, 27, 1.25, 0.05, 0, p.accent, this.selectedLane, true);
      question.options[this.locale].forEach((option, i) => {
        const group = new THREE.Group(), x = lanePosition(i, count); group.position.set(x, 0, -18); this.dynamic.add(group);
        this.box(0.22, 4, 0.35, -1.6, 2, 0, p.accent, group, true); this.box(0.22, 4, 0.35, 1.6, 2, 0, p.accent, group, true); this.box(3.4, 0.25, 0.35, 0, 4, 0, p.accent, group, true);
        const sign = this.label(option, i); sign.position.set(0, 4.95, 0); group.add(sign);
        const ring = this.ring(1.35, 0, 0.1, 0, group);
        this.targets.push({ mesh: group, index: i, position: new THREE.Vector3(x, 0, -18), kind: "answer", ring });
        if (i % 2 === index % 2) {
          this.box(2.8, 0.48, 0.65, x, 0.24, -7, p.trim, this.dynamic);
          for (const offset of [-0.8, 0, 0.8]) { const stripe = this.box(0.45, 0.03, 0.9, x + offset, 0.5, -7, 0xe4b65a, this.dynamic); stripe.rotation.y = 0.45; }
        }
      });
    } else if (this.game.gameMode === "escape-room") {
      const station = Math.floor(index / 2) % 4, x = station % 2 ? 7 : -7, z = -10 + Math.floor(station / 2) * 7;
      const terminal = this.box(1.6, 1.1, 0.18, x, 2.4, z, p.accent, this.dynamic, true);
      this.drawer = this.box(1.8, 0.4, 0.9, x, 1.2, z + 0.7, p.trim, this.dynamic);
      this.drawerTarget = this.drawer.position.z;
      const sign = this.label(`${gameMessages[this.locale].drawer} · ${station + 1} / 4`); sign.position.set(x, 3.8, z); this.dynamic.add(sign);
      const ring = this.ring(1.15, x, 0.1, z + 1.3);
      this.targets.push({ mesh: terminal, index: 0, position: new THREE.Vector3(x, 0, z + 1.3), kind: "terminal", ring });
      for (let indicator = 0; indicator < 2; indicator++) this.box(0.3, 0.1, 0.1, x - 0.25 + indicator * 0.5, 2.7, z + 0.13, indicator < index % 2 ? 0x65d39e : p.trim, this.dynamic, true);
      this.drawRoute(new THREE.Vector3(0, 0, 7), new THREE.Vector3(x, 0, z + 1.3));
      this.player.position.set(0, 0, 7);
    } else {
      question.options[this.locale].forEach((option, i) => {
        const x = lanePosition(i, count), z = this.game.gameMode === "collect-sort" ? -4 - (i % 2) * 3 : -6;
        const group = new THREE.Group(); group.position.set(x, 0, z); this.dynamic.add(group);
        if (this.game.gameMode === "collect-sort") {
          if (i % 3 === 0) { const crate = this.box(1.2, 1.2, 1.2, 0, 0.9, 0, p.trim, group); crate.rotation.y = Math.PI / 4; }
          else if (i % 3 === 1) { const crystal = new THREE.Mesh(this.geometry(new THREE.OctahedronGeometry(0.85)), this.material(p.trim, 0.3)); crystal.position.y = 1; group.add(crystal); }
          else this.cylinder(0.65, 1.25, 0, 0.9, 0, p.trim, group);
          this.ring(0.75, 0, 0.9, 0, group);
          this.cylinder(1, 0.12, 0, 0.09, 0, p.structure, group);
        } else if (this.game.gameMode === "build-path") {
          this.box(3.2, 0.5, 3, 0, 0.1, 0, p.structure, group);
          this.box(3.1, 0.04, 2.9, 0, 0.39, 0, p.accent, group);
          for (const side of [-1, 1]) this.box(0.12, 0.45, 2.6, side * 1.4, 0.6, 0, p.trim, group);
        } else {
          this.cylinder(0.9, 1.8, 0, 0.9, 0, p.structure, group);
          this.cylinder(0.95, 0.15, 0, 1.9, 0, p.accent, group);
          const core = new THREE.Mesh(this.geometry(new THREE.OctahedronGeometry(0.42)), this.material(p.accent, 0.15, true)); core.position.y = 2.35; group.add(core);
        }
        const sign = this.label(option, i); sign.position.set(0, this.game.gameMode === "boss-quiz" ? 3.5 : 2.8, 0); group.add(sign);
        const ring = this.ring(this.game.gameMode === "build-path" ? 1.5 : 1.1, 0, 0.09, 0, group);
        this.targets.push({ mesh: group, index: i, position: new THREE.Vector3(x, 0, z + 1.2), kind: "answer", ring });
      });
      if (this.game.gameMode === "collect-sort") {
        const pad = this.cylinder(2.1, 0.05, 0, 0.23, 6, p.accent, this.dynamic);
        const ring = this.ring(1.5, 0, 0.31, 6);
        this.targets.push({ mesh: pad, index: -1, position: new THREE.Vector3(0, 0, 6), kind: "delivery", ring });
      }
      if (this.game.gameMode === "boss-quiz") {
        const shield = new THREE.Mesh(this.geometry(new THREE.OctahedronGeometry(0.65)), this.material(0x84c9bd, 0.35, true)); shield.position.set(index % 2 ? -8 : 8, 1, 3); this.dynamic.add(shield);
        this.targets.push({ mesh: shield, index: -1, position: shield.position.clone().setY(0), kind: "shield" });
      }
      if (this.game.gameMode === "build-path") {
        for (let step = 0; step < index; step++) this.bridgeSection(step, this.answerResults.get(step));
        const next = this.ring(1.3, 0, 0.06, -9.4 - index * 2.8); next.material = this.material(p.trim, 0.1, true);
      }
    }
    this.refreshProgress(index);
    this.updateSelection();
    this.pausedRendered = false;
  }

  private clearGroup(group: THREE.Group) {
    while (group.children.length) { const child = group.children[0]; group.remove(child); this.disposeTree(child, false); }
  }
  private drawRoute(from: THREE.Vector3, to: THREE.Vector3) {
    this.clearGroup(this.route);
    const distance = from.distanceTo(to), count = Math.min(this.low ? 5 : 9, Math.floor(distance / 1.4));
    const angle = Math.atan2(to.x - from.x, to.z - from.z);
    for (let i = 1; i <= count; i++) {
      const point = from.clone().lerp(to, i / (count + 1)), arrow = new THREE.Group();
      arrow.position.set(point.x, 0.08, point.z); arrow.rotation.y = angle; this.route.add(arrow);
      for (const side of [-1, 1]) { const arm = this.box(0.08, 0.025, 0.4, side * 0.12, 0, 0, this.palette.accent, arrow, true); arm.rotation.y = -side * 0.7; }
    }
  }
  private bridgeSection(step: number, correct?: boolean, settle = false) {
    const group = new THREE.Group(); group.position.set(0, settle && !this.reduced ? 1.1 : 0, -9.4 - step * 2.8); this.dynamic.add(group);
    if (settle) group.userData.settle = true;
    const color = correct === false ? 0xc49964 : correct === true ? this.palette.accent : this.palette.trim;
    this.box(3.4, 0.4, 2.65, 0, -0.2, 0, this.palette.structure, group);
    for (const side of [-1, 1]) {
      this.box(0.14, 0.5, 2.65, side * 1.5, 0.22, 0, color, group, correct === true);
      this.box(3, 0.04, 0.12, 0, 0.035, side * 1.12, color, group, correct === true);
    }
    if (correct === false) for (const side of [-1, 1]) { const caution = this.box(0.1, 0.04, 1.2, side * 0.3, 0.05, 0, color, group); caution.rotation.y = side * 0.6; }
    return group;
  }
  private refreshProgress(answered: number) {
    const ratio = answered / Math.max(1, this.game.questions.length);
    this.doorTarget = 2.5 + ratio * 4.4;
    if (this.door && this.reduced) this.door.position.y = this.doorTarget;
    this.doorLocks.forEach((lock, index) => { lock.material = this.material(answered >= (index + 1) * 2 ? 0x65d39e : index === Math.floor(answered / 2) ? this.palette.accent : this.palette.trim, 0.1, answered >= index * 2); });
    this.bossSegments.forEach((segment, index) => { segment.material = this.material(index < this.correctAnswers ? this.palette.structure : this.palette.accent, 0.2, index >= this.correctAnswers); segment.scale.setScalar(index < this.correctAnswers ? 0.6 : 1); });
    if (this.boss) this.boss.scale.setScalar(1 - this.correctAnswers / Math.max(1, this.game.questions.length) * 0.32);
  }
  private updateSelection() {
    for (const target of this.targets) {
      const chosen = target.kind === "answer" ? target.index === this.selected && this.carryIndex === null : target.kind === "terminal" ? !this.opened : target.kind === "delivery" && this.carryIndex !== null;
      if (target.ring) { target.ring.material = this.material(chosen ? this.palette.accent : this.palette.trim, 0.1, chosen); target.ring.scale.setScalar(chosen ? 1.08 : 0.86); }
    }
    if (this.selectedLane) this.selectedLane.position.x = lanePosition(this.selected, this.question?.options[this.locale].length ?? 3);
  }
  private showFeedback(correct: boolean, position: THREE.Vector3, gradedAnswer = true) {
    this.clearGroup(this.feedback); this.feedback.position.copy(position).setY(0); this.feedbackDuration = this.reduced ? 0.4 : 0.7; this.feedbackLife = this.feedbackDuration;
    const color = correct ? 0x65d39e : 0xe4b65a;
    this.ring(1.5, 0, 0.12, 0, this.feedback, color);
    if (gradedAnswer) {
      const symbol = new THREE.Group(); symbol.position.y = 2.5; symbol.userData.billboard = true; this.feedback.add(symbol);
      if (correct) {
        const a = this.box(0.18, 0.6, 0.12, -0.2, -0.1, 0, color, symbol, true); a.rotation.z = Math.PI / 4;
        const b = this.box(0.18, 1.05, 0.12, 0.22, 0.09, 0, color, symbol, true); b.rotation.z = -Math.PI / 4;
      } else for (const side of [-1, 1]) { const cross = this.box(0.16, 1.08, 0.12, 0, 0, 0, color, symbol, true); cross.rotation.z = side * Math.PI / 4; }
    }
    if (!this.low && !this.reduced) for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2, fragment = this.box(0.11, 0.11, 0.11, 0, 1.2, 0, color, this.feedback, true);
      fragment.userData.velocity = new THREE.Vector3(Math.sin(angle) * 2.1, 1.5 + i % 3 * 0.4, Math.cos(angle) * 2.1);
    }
    this.pausedRendered = false;
  }

  choose(index: number) {
    if (this.busy || this.paused || !this.question || index < 0 || index >= this.question.options[this.locale].length) return;
    this.selected = index; this.lane = index; this.hooks.selection(index); this.updateSelection();
    if (this.game.gameMode === "answer-gates") return;
    if (this.game.gameMode === "escape-room") { if (this.opened) this.submit(index); return; }
    if (this.game.gameMode === "collect-sort" && this.carryIndex !== null) {
      const previous = this.targets.find((item) => item.kind === "answer" && item.index === this.carryIndex);
      if (previous) previous.mesh.visible = true;
      if (this.carryMesh) { this.player.remove(this.carryMesh); this.disposeTree(this.carryMesh, false); this.carryMesh = undefined; }
      this.carryIndex = null; this.hooks.carrying(false);
    }
    const target = this.targets.find((item) => item.kind === "answer" && item.index === index);
    if (target) { this.destination = target.position.clone(); this.autoAction = true; this.drawRoute(this.player.position, target.position); this.updateSelection(); }
  }
  action() {
    if (this.paused || this.busy || !this.loaded) return;
    if (this.game.gameMode === "escape-room" && this.opened) { this.submit(this.selected); return; }
    if (this.game.gameMode === "answer-gates") { this.destination = new THREE.Vector3(lanePosition(this.lane, this.question?.options[this.locale].length ?? 3), 0, -18); return; }
    if (this.game.gameMode === "escape-room" && !this.opened) {
      const terminal = this.targets.find((target) => target.kind === "terminal");
      if (terminal && this.player.position.distanceTo(terminal.position) > 2.3) { this.destination = terminal.position.clone(); this.autoAction = true; return; }
    }
    if (this.game.gameMode === "collect-sort" && this.carryIndex !== null) {
      const distance = this.player.position.distanceTo(new THREE.Vector3(0, 0, 6));
      if (distance < 2.5) this.submit(this.carryIndex);
      else { this.destination = new THREE.Vector3(0, 0, 6); this.autoAction = true; }
      return;
    }
    const target = this.targets.find((item) => item.kind !== "delivery" && item.kind !== "shield" && this.player.position.distanceTo(item.position) < 2.5);
    if (target) this.activate(target);
    else if (this.game.gameMode !== "escape-room") this.choose(this.selected);
  }
  jump() { if (!this.paused && this.playerHeight < 0.05) { this.jumpVelocity = 6.7; this.hooks.sound?.("dash"); } }
  dodge() { if (this.game.gameMode === "boss-quiz" && !this.paused) { this.player.position.x = this.player.position.x >= 0 ? -5 : 5; this.destination = undefined; this.hooks.sound?.("dash"); } }
  setJoystick(x: number, z: number) { this.joystick = normalizeInput(x, z); if (Math.abs(x) + Math.abs(z) > 0.1) this.destination = undefined; }
  setPaused(value: boolean) { this.paused = value; this.pausedRendered = false; this.keys.clear(); this.joystick = { x: 0, z: 0 }; }

  private activate(target: Target) {
    if (this.busy) return;
    if (target.kind === "terminal") { this.opened = true; if (this.drawer) { this.drawerTarget = this.drawer.position.z + 0.6; if (this.reduced) this.drawer.position.z = this.drawerTarget; } this.clearGroup(this.route); this.hooks.opened(true); this.hooks.sound?.("collect"); this.updateSelection(); return; }
    if (target.kind === "answer" && this.game.gameMode === "collect-sort") {
      if (this.carryIndex !== null) return;
      this.carryIndex = target.index; target.mesh.visible = false;
      this.carryMesh = this.box(0.65, 0.65, 0.65, 0, 2.7, 0, this.palette.accent, this.player, true);
      this.hooks.carrying(true); this.hooks.sound?.("collect"); this.drawRoute(this.player.position, new THREE.Vector3(0, 0, 6)); this.updateSelection(); return;
    }
    if (target.kind === "answer") this.submit(target.index);
  }
  private submit(index: number) { if (this.busy) return; this.busy = true; this.destination = undefined; this.hooks.answer(index); }
  resolve(correct: boolean) {
    this.combo = correct ? this.combo + 1 : 0;
    if (!this.answerResults.has(this.questionIndex) && correct) this.correctAnswers++;
    this.answerResults.set(this.questionIndex, correct);
    this.showFeedback(correct, this.player.position); this.clearGroup(this.route);
    if (this.game.gameMode === "build-path") this.bridgeSection(this.questionIndex, correct, true);
    this.refreshProgress(this.questionIndex + 1);
    if (this.game.gameMode === "boss-quiz") {
      if (!correct) { this.attackTime = 4.6; if (this.wave) { this.wave.visible = true; this.wave.position.set(this.player.position.x, 0.6, -14); } if (this.attackLane) { this.attackLane.position.x = this.player.position.x; this.attackLane.visible = true; } this.hooks.attack(true); }
    }
  }
  private bindControls() {
    const listen = (target: EventTarget, event: string, callback: EventListener, options?: AddEventListenerOptions) => { target.addEventListener(event, callback, options); this.listeners.push(() => target.removeEventListener(event, callback, options)); };
    listen(window, "keydown", ((event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || (event.target instanceof HTMLButtonElement && [" ", "Enter"].includes(event.key))) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) event.preventDefault();
      this.keys.add(event.key.toLowerCase());
      if (event.repeat || this.paused) return;
      if (event.key === " ") this.jump();
      if (event.key.toLowerCase() === "e") this.action();
      if (/^[1-4]$/.test(event.key)) this.choose(Number(event.key) - 1);
      if (this.game.gameMode === "answer-gates") {
        if (["a", "arrowleft"].includes(event.key.toLowerCase())) this.choose(Math.max(0, this.lane - 1));
        if (["d", "arrowright"].includes(event.key.toLowerCase())) this.choose(Math.min((this.question?.options[this.locale].length ?? 3) - 1, this.lane + 1));
      }
    }) as EventListener);
    listen(window, "keyup", ((event: KeyboardEvent) => { this.keys.delete(event.key.toLowerCase()); }) as EventListener);
    listen(window, "blur", () => { this.keys.clear(); this.joystick = { x: 0, z: 0 }; });
    const canvas = this.renderer.domElement;
    listen(canvas, "pointerdown", ((event: PointerEvent) => { this.pointerStart = { x: event.clientX, y: event.clientY }; this.pointerLast = { ...this.pointerStart }; canvas.setPointerCapture(event.pointerId); }) as EventListener);
    listen(canvas, "pointermove", ((event: PointerEvent) => {
      if (!this.pointerLast || this.paused) return;
      const sensitivity = Math.max(0.3, Math.min(2.5, this.settings.sensitivity ?? 1));
      this.yaw -= (event.clientX - this.pointerLast.x) * 0.004 * sensitivity;
      this.yaw = Math.max(-0.85, Math.min(0.85, this.yaw));
      this.pitch = Math.max(-0.2, Math.min(0.4, this.pitch + (event.clientY - this.pointerLast.y) * 0.003));
      this.pointerLast = { x: event.clientX, y: event.clientY };
    }) as EventListener);
    listen(canvas, "pointerup", ((event: PointerEvent) => {
      if (this.pointerStart && Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) < 10 && !this.paused && !this.busy) {
        const rect = canvas.getBoundingClientRect(); const point = new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        this.raycaster.setFromCamera(point, this.camera);
        const intersections = this.raycaster.intersectObjects(this.targets.map((target) => target.mesh), true);
        if (intersections[0]) {
          const hit = intersections[0].object;
          const target = this.targets.find((item) => item.mesh === hit || item.mesh.getObjectById(hit.id));
          if (target) { if (target.kind === "answer") this.choose(target.index); else { this.destination = target.position.clone(); this.autoAction = true; } }
        }
      }
      this.pointerStart = undefined; this.pointerLast = undefined;
    }) as EventListener);
    listen(canvas, "pointercancel", () => { this.pointerStart = undefined; this.pointerLast = undefined; });
    listen(canvas, "webglcontextlost", ((event: Event) => { event.preventDefault(); this.setPaused(true); this.hooks.contextLost(); }) as EventListener);
  }

  private animate = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = Math.min((now - this.lastFrame) / 1000, 0.04); this.lastFrame = now;
    if (document.hidden || (this.paused && this.pausedRendered && this.loaded)) return;
    if (!this.paused && this.loaded) this.update(delta);
    const playerZ = this.player.position.z;
    const mode = this.game.gameMode;
    const cameraZ = mode === "answer-gates" ? playerZ + 12 : 17;
    const cameraY = mode === "escape-room" ? 11 : mode === "collect-sort" ? 13 : 9.5;
    const target = new THREE.Vector3(Math.sin(this.yaw) * 16, cameraY + this.pitch * 10, cameraZ + Math.cos(this.yaw) * 3);
    this.camera.position.lerp(target, this.reduced || !this.loaded || this.paused ? 1 : Math.min(1, delta * 7));
    this.camera.lookAt(mode === "answer-gates" ? this.player.position.x * 0.22 : 0, 1.1, mode === "answer-gates" ? playerZ - 10 : -6);
    for (const child of this.feedback.children) if (child.userData.billboard) child.quaternion.copy(this.camera.quaternion);
    this.renderer.render(this.scene, this.camera);
    this.pausedRendered = this.paused;
  };
  private update(delta: number) {
    this.ambientTime += delta;
    if (this.door) this.door.position.y = THREE.MathUtils.damp(this.door.position.y, this.doorTarget, this.reduced ? 100 : 5, delta);
    if (this.drawer) this.drawer.position.z = THREE.MathUtils.damp(this.drawer.position.z, this.drawerTarget, this.reduced ? 100 : 9, delta);
    for (const child of this.dynamic.children) if (child.userData.settle) { child.position.y = THREE.MathUtils.damp(child.position.y, 0, 8, delta); if (child.position.y < 0.01) { child.position.y = 0; child.userData.settle = false; } }
    if (this.feedbackLife > 0) {
      this.feedbackLife = Math.max(0, this.feedbackLife - delta);
      if (!this.reduced) for (const child of this.feedback.children) {
        const velocity = child.userData.velocity as THREE.Vector3 | undefined;
        if (velocity) { child.position.addScaledVector(velocity, delta); velocity.y -= delta * 5; child.scale.setScalar(Math.max(0.1, this.feedbackLife / this.feedbackDuration)); }
      }
      if (!this.feedbackLife) this.clearGroup(this.feedback);
    }
    if (this.boss && !this.reduced) { this.boss.rotation.y = Math.sin(this.ambientTime * 0.6) * 0.16; this.boss.position.y = 3.8 + Math.sin(this.ambientTime) * 0.15; }
    if (this.attackTime > 0 && this.wave) {
      this.attackTime -= delta;
      if (this.attackTime < 3.8) this.wave.position.z += delta * 8.5;
      if (this.attackLane) this.attackLane.visible = this.attackTime > 3.8;
      if (Math.abs(this.wave.position.z - this.player.position.z) < 0.8 && Math.abs(this.wave.position.x - this.player.position.x) < 1.8 && this.playerHeight < 0.8) {
        this.player.position.z = Math.min(10, this.player.position.z + (this.shieldCount ? 0 : 2));
        if (this.shieldCount) { this.shieldCount--; this.hooks.shield(-1); }
        this.showFeedback(false, this.player.position, false); this.hooks.sound?.("hit");
        this.attackTime = 0;
      }
      if (this.attackTime <= 0) { this.wave.visible = false; if (this.attackLane) this.attackLane.visible = false; this.hooks.attack(false); }
    }
    this.jumpVelocity -= delta * 18; this.playerHeight = Math.max(0, this.playerHeight + this.jumpVelocity * delta);
    if (this.playerHeight <= 0) this.jumpVelocity = 0;
    this.player.position.y = this.playerHeight;
    if ((this.busy && !(this.game.gameMode === "boss-quiz" && this.attackTime > 0)) || !this.question) return;
    let moving = false;
    if (this.game.gameMode === "answer-gates") {
      const targetX = lanePosition(this.lane, this.question.options[this.locale].length);
      this.player.position.x = THREE.MathUtils.damp(this.player.position.x, targetX, 8, delta);
      const forward = this.keys.has("w") || this.keys.has("arrowup") || this.joystick.z < -0.35 || Boolean(this.destination);
      const slow = this.keys.has("s") || this.keys.has("arrowdown") || this.joystick.z > 0.35;
      this.obstacleCooldown = Math.max(0, this.obstacleCooldown - delta);
      this.player.position.z -= delta * (this.obstacleCooldown > 0 ? 0.7 : slow ? 0.8 : forward ? 4.8 : 1.4 + Math.min(this.combo, 4) * 0.15);
      if (Math.abs(this.player.position.z + 7) < 0.3 && this.playerHeight < 0.35 && this.lane % 2 === this.questionIndex % 2 && !this.obstacleCooldown) { this.obstacleCooldown = 1.5; this.showFeedback(false, this.player.position, false); this.hooks.sound?.("hit"); }
      this.laneSwitchCooldown = Math.max(0, this.laneSwitchCooldown - delta);
      if (Math.abs(this.joystick.x) > 0.5 && !this.laneSwitchCooldown) {
        this.choose(Math.max(0, Math.min(this.question.options[this.locale].length - 1, this.lane + Math.sign(this.joystick.x))));
        this.laneSwitchCooldown = 0.3;
      }
      if (this.player.position.z <= -17.4) this.submit(nearestLane(this.player.position.x, this.question.options[this.locale].length));
      moving = true;
    } else {
      const input = normalizeInput((this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) - (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0) + this.joystick.x, (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) - (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0) + this.joystick.z);
      if (Math.abs(input.x) + Math.abs(input.z) > 0.05) {
        this.destination = undefined; this.player.position.x += input.x * delta * 6; this.player.position.z += input.z * delta * 6; moving = true;
        if (this.avatar) this.avatar.rotation.y = Math.atan2(-input.x, -input.z);
      } else if (this.destination) {
        const dx = this.destination.x - this.player.position.x, dz = this.destination.z - this.player.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance > 0.18) { this.player.position.x += dx / distance * Math.min(distance, delta * 7); this.player.position.z += dz / distance * Math.min(distance, delta * 7); moving = true; if (this.avatar) this.avatar.rotation.y = Math.atan2(-dx, -dz); }
        else { this.destination = undefined; if (this.autoAction) { this.autoAction = false; this.action(); } }
      }
      const bounded = clampMovement(this.player.position.x, this.player.position.z); this.player.position.x = bounded.x; this.player.position.z = bounded.z;
      if (this.game.gameMode === "build-path" && this.player.position.z < -7.5) {
        const committed = this.questionIndex + (this.answerResults.has(this.questionIndex) ? 1 : 0);
        this.player.position.z = Math.max(-7.5 - committed * 2.8, this.player.position.z);
        if (Math.abs(this.player.position.x) > 1.3) this.player.position.z = Math.max(-7.5, this.player.position.z);
      }
      for (const target of this.targets) {
        if (target.kind === "shield" && target.mesh.visible && this.player.position.clone().setY(0).distanceTo(target.position) < 1.3) { target.mesh.visible = false; this.shieldCount++; this.hooks.shield(1); this.hooks.sound?.("collect"); }
        if (target.kind === "delivery" && this.carryIndex !== null && this.player.position.clone().setY(0).distanceTo(target.position) < 1.6) this.submit(this.carryIndex);
      }
    }
    if (this.avatar && !this.reduced) { this.avatar.position.y = moving ? Math.abs(Math.sin(this.ambientTime * 12)) * 0.08 : 0; this.avatar.rotation.z = moving ? Math.sin(this.ambientTime * 12) * 0.035 : 0; }
    if (this.carryMesh && !this.reduced) this.carryMesh.rotation.y += delta;
    for (const target of this.targets) { if (target.kind === "answer") { const chosen = target.index === this.selected, scale = chosen ? 1.035 : 1; target.mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), this.reduced ? 1 : Math.min(1, delta * 12)); } }
  }

  private onResize() { const width = this.host.clientWidth, height = this.host.clientHeight; if (!width || !height) return; this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height); this.pausedRendered = false; }
  private clearDynamic() {
    this.targets = [];
    this.clearGroup(this.dynamic); this.clearGroup(this.route); this.clearGroup(this.feedback); this.feedbackLife = 0;
    if (this.carryMesh) { this.player.remove(this.carryMesh); this.disposeTree(this.carryMesh, false); }
  }
  private disposeTree(root: THREE.Object3D, disposeShared = true) {
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose(); this.geometries.delete(object.geometry);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) if (disposeShared || this.privateMaterials.has(material)) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) { value.dispose(); this.textures.delete(value); }
          material.dispose(); this.privateMaterials.delete(material);
        }
      }
      if (object instanceof THREE.Sprite) { if (object.material.map) { object.material.map.dispose(); this.textures.delete(object.material.map); } object.material.dispose(); }
    });
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resize.disconnect(); this.listeners.forEach((remove) => remove());
    this.disposeTree(this.scene); this.geometries.forEach((geometry) => geometry.dispose()); this.materials.forEach((material) => material.dispose()); this.textures.forEach((texture) => texture.dispose()); this.privateMaterials.forEach((material) => material.dispose());
    this.geometries.clear(); this.materials.clear(); this.textures.clear(); this.privateMaterials.clear(); this.listeners = [];
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}
