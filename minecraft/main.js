import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import {
  World, BLOCKS, BLOCK_INFO, HOTBAR, CHUNK_W, CHUNK_D, CHUNK_H, localIndex,
  raycast, createBody, moveBody, isGrounded, overlapsBlock,
} from './world.js';

const RENDER_RADIUS = 4;      // chunks around the player
const BUILDS_PER_FRAME = 3;   // chunk meshes built per frame, to avoid stutter
const REACH = 6;
const WALK_SPEED = 4.5;
const JUMP_SPEED = 8.5;
const GRAVITY = 28;
const MOUSE_SENSITIVITY = 0.0022;

// Faces of a unit cube. `n` is the outward normal, `corners` wind CCW so the
// front face points out of the block.
const FACES = [
  { n: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], shade: 0.8, tint: 'side' },
  { n: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], shade: 0.8, tint: 'side' },
  { n: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], shade: 1.0, tint: 'top' },
  { n: [0, -1, 0], corners: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]], shade: 0.5, tint: 'bottom' },
  { n: [0, 0, 1], corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], shade: 0.9, tint: 'side' },
  { n: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], shade: 0.9, tint: 'side' },
];

const world = new World(Math.floor(Math.random() * 1_000_000));

// ---------- Renderer & scene ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const SKY = 0x9fd8ff;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, RENDER_RADIUS * CHUNK_W * 0.6, RENDER_RADIUS * CHUNK_W * 1.05);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 300);
camera.rotation.order = 'YXZ';

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(0.4, 1, 0.25);
scene.add(sun);

const blockMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });

const outline = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }),
);
outline.visible = false;
scene.add(outline);

// ---------- Chunk meshes ----------

const meshes = new Map();   // "cx,cz" -> THREE.Mesh
let buildQueue = [];        // [{cx, cz}] nearest first

function buildChunkGeometry(cx, cz) {
  const { data } = world.chunk(cx, cz);
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  const ox = cx * CHUNK_W;
  const oz = cz * CHUNK_D;

  for (let y = 0; y < CHUNK_H; y++) {
    for (let z = 0; z < CHUNK_D; z++) {
      for (let x = 0; x < CHUNK_W; x++) {
        const id = data[localIndex(x, y, z)];
        if (id === BLOCKS.AIR) continue;
        const info = BLOCK_INFO[id];
        const wx = ox + x;
        const wz = oz + z;

        for (const face of FACES) {
          const [dx, dy, dz] = face.n;
          if (world.get(wx + dx, y + dy, wz + dz) !== BLOCKS.AIR) continue;

          const c = info[face.tint];
          const start = positions.length / 3;
          for (const [px, py, pz] of face.corners) {
            positions.push(wx + px, y + py, wz + pz);
            normals.push(dx, dy, dz);
            colors.push(c[0] * face.shade, c[1] * face.shade, c[2] * face.shade);
          }
          indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

function removeMesh(key) {
  const mesh = meshes.get(key);
  if (!mesh) return;
  scene.remove(mesh);
  mesh.geometry.dispose();
  meshes.delete(key);
}

function buildMesh(cx, cz) {
  const key = World.key(cx, cz);
  removeMesh(key);
  const mesh = new THREE.Mesh(buildChunkGeometry(cx, cz), blockMaterial);
  mesh.userData = { cx, cz };
  scene.add(mesh);
  meshes.set(key, mesh);
}

// Keeps the chunk meshes around the player up to date: queues missing ones
// (nearest first) and drops the ones that are now far away.
let streamedChunk = null;
function streamChunks() {
  const pcx = Math.floor(body.x / CHUNK_W);
  const pcz = Math.floor(body.z / CHUNK_D);
  if (streamedChunk && streamedChunk.cx === pcx && streamedChunk.cz === pcz) return;
  streamedChunk = { cx: pcx, cz: pcz };

  for (const [key, mesh] of meshes) {
    const { cx, cz } = mesh.userData;
    if (Math.abs(cx - pcx) > RENDER_RADIUS + 1 || Math.abs(cz - pcz) > RENDER_RADIUS + 1) {
      removeMesh(key);
    }
  }

  const wanted = [];
  for (let dz = -RENDER_RADIUS; dz <= RENDER_RADIUS; dz++) {
    for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      if (!meshes.has(World.key(cx, cz))) wanted.push({ cx, cz, d: dx * dx + dz * dz });
    }
  }
  wanted.sort((a, b) => a.d - b.d);
  buildQueue = wanted;
}

function processBuildQueue() {
  for (let i = 0; i < BUILDS_PER_FRAME && buildQueue.length; i++) {
    const { cx, cz } = buildQueue.shift();
    buildMesh(cx, cz);
  }
}

// ---------- Player ----------

const SPAWN = { x: 0.5, z: 0.5 };
const body = createBody(SPAWN.x, 0, SPAWN.z);

function respawn() {
  const top = world.surfaceY(Math.floor(SPAWN.x), Math.floor(SPAWN.z));
  body.x = SPAWN.x;
  body.z = SPAWN.z;
  body.y = top + 1;
  body.vy = 0;
}
respawn();

let yaw = 0;
let pitch = 0;
let selected = 0;
const keys = {};
let locked = false;

// ---------- Input ----------

const overlay = document.getElementById('overlay');
const hotbarEl = document.getElementById('hotbar');
const hudEl = document.getElementById('hud');

function selectSlot(index) {
  selected = (index + HOTBAR.length) % HOTBAR.length;
  for (const [i, el] of [...hotbarEl.children].entries()) {
    el.classList.toggle('sel', i === selected);
  }
}

HOTBAR.forEach((id, i) => {
  const slot = document.createElement('div');
  slot.className = 'slot';
  const c = BLOCK_INFO[id].top;
  slot.innerHTML = `<div class="swatch" style="background:rgb(${c.map((v) => Math.round(v * 255)).join(',')})"></div><span class="num">${i + 1}</span>`;
  slot.title = BLOCK_INFO[id].name;
  slot.addEventListener('click', () => selectSlot(i));
  hotbarEl.appendChild(slot);
});
selectSlot(0);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') e.preventDefault();
  keys[e.code] = true;
  const digit = /^Digit([1-9])$/.exec(e.code);
  if (digit) selectSlot(Number(digit[1]) - 1);
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

overlay.addEventListener('click', () => renderer.domElement.requestPointerLock());

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  overlay.hidden = locked;
  if (!locked) for (const k in keys) keys[k] = false;
});

document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  yaw -= e.movementX * MOUSE_SENSITIVITY;
  pitch -= e.movementY * MOUSE_SENSITIVITY;
  pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
});

document.addEventListener('mousedown', (e) => {
  if (!locked) return;
  if (e.button === 0) breakTarget();
  else if (e.button === 2) placeBlock();
});

document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('wheel', (e) => {
  if (!locked) return;
  selectSlot(selected + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });

// ---------- Block interaction ----------

let target = null;

function updateTarget() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const eye = camera.position;
  target = raycast(world, eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, REACH);
  if (target) {
    outline.visible = true;
    outline.position.set(target.block.x + 0.5, target.block.y + 0.5, target.block.z + 0.5);
  } else {
    outline.visible = false;
  }
}

function rebuildChunks(dirty) {
  for (const [cx, cz] of dirty) {
    if (meshes.has(World.key(cx, cz))) buildMesh(cx, cz);
  }
}

function breakTarget() {
  if (!target) return;
  const { x, y, z } = target.block;
  rebuildChunks(world.set(x, y, z, BLOCKS.AIR));
}

function placeBlock() {
  if (!target) return;
  const { x, y, z } = target.place;
  if (y < 0 || y >= CHUNK_H) return;
  if (world.get(x, y, z) !== BLOCKS.AIR) return;
  if (overlapsBlock(body, { x, y, z })) return;
  rebuildChunks(world.set(x, y, z, HOTBAR[selected]));
}

// ---------- Update loop ----------

function updatePlayer(dt) {
  let mx = 0;
  let mz = 0;
  if (locked) {
    const forward = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const side = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    if (forward || side) {
      const s = Math.sin(yaw);
      const c = Math.cos(yaw);
      const vx = -s * forward + c * side;
      const vz = -c * forward - s * side;
      const len = Math.hypot(vx, vz);
      mx = (vx / len) * WALK_SPEED;
      mz = (vz / len) * WALK_SPEED;
    }
    if (body.onGround && keys.Space) body.vy = JUMP_SPEED;
  }

  body.vy = Math.max(body.vy - GRAVITY * dt, -50);
  const hit = moveBody(world, body, mx * dt, body.vy * dt, mz * dt);
  if (hit.y) body.vy = 0;
  body.onGround = isGrounded(world, body);

  if (body.y < -20) respawn();
}

function updateHud() {
  hudEl.textContent =
    `x ${body.x.toFixed(1)}  y ${body.y.toFixed(1)}  z ${body.z.toFixed(1)}`;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  updatePlayer(dt);
  camera.position.set(body.x, body.y + 1.6, body.z);
  camera.rotation.set(pitch, yaw, 0);

  streamChunks();
  processBuildQueue();
  updateTarget();
  updateHud();

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// The frame loop queues and builds the chunks around the player; physics
// uses world data directly, so the player never falls through missing meshes.
requestAnimationFrame(frame);
