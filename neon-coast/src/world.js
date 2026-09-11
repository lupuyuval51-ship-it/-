import * as THREE from '../vendor/three.module.min.js';
import { CITY } from './config.js';
import { GeoBuilder, StaticGrid, mulberry, clamp, xform, M4, mergeGeometries } from './utils.js';
import { FACADES, facadeTextures, asphaltTex, sidewalkTex, sandTex, grassTex, roofTex, plankTex, neonSign, billboard, crossTex, storefrontTextures, shadowTex, cloudTex, AWNINGS, facadeNormal, facadeORM, storefrontNormal, storefrontORM, asphaltNormal, sidewalkNormal, plankNormal, sandNormal } from './textures.js';

const { road, sidewalk, pitch, gridX, gridZ } = CITY;
const HALF = road / 2;
const FLOOR = 3.5;

// Points of interest: block index, which lot corner, look and map colour
export const POI_DEFS = [
  { id: 'safehouse', block: [1, 1], facade: 'deco', floors: 5, sign: ['THE PALMS', '#7cff8a'], color: '#7cff8a', label: 'safehouse', type: 'safehouse' },
  { id: 'guns',      block: [3, 5], facade: 'tower', floors: 2, sign: ['NEON ARMS', '#ff4fa3'], color: '#ff4fa3', label: 'shopGuns', type: 'guns' },
  { id: 'guns2',     block: [7, 6], facade: 'brick', floors: 3, sign: ['COAST GUNS', '#ff4fa3'], color: '#ff4fa3', label: 'shopGuns2', type: 'guns' },
  { id: 'guns3',     block: [0, 3], facade: 'concrete', floors: 2, sign: ['BIG IRON', '#ff4fa3'], color: '#ff4fa3', label: 'shopGuns3', type: 'guns' },
  { id: 'spray',     block: [7, 2], facade: 'concrete', floors: 2, sign: ['SPRAY & GO', '#c084fc'], color: '#c084fc', label: 'shopSpray', type: 'spray', garage: true },
  { id: 'spray2',    block: [3, 0], facade: 'brick', floors: 2, sign: ['AUTO STAR', '#c084fc'], color: '#c084fc', label: 'shopSpray2', type: 'spray', garage: true },
  { id: 'hospital',  block: [2, 6], facade: 'white', floors: 7, sign: ['SUNRISE HOSPITAL', '#ff5a5a'], color: '#ff5a5a', label: 'shopHospital', type: 'hospital', cross: true },
  { id: 'hospital2', block: [8, 3], facade: 'white', floors: 5, sign: ['PALM MEDICAL', '#ff5a5a'], color: '#ff5a5a', label: 'shopHospital2', type: 'hospital', cross: true },
  { id: 'police',    block: [6, 6], facade: 'concrete', floors: 3, sign: ['POLICE', '#4d8cff'], color: '#4d8cff', label: 'police', type: 'police' },
  { id: 'police2',   block: [1, 4], facade: 'concrete', floors: 4, sign: ['POLICE', '#4d8cff'], color: '#4d8cff', label: 'police2', type: 'police' },
  { id: 'dealer',    block: [8, 4], facade: 'glass', floors: 2, sign: ['COAST MOTORS', '#3ce8f5'], color: '#3ce8f5', label: 'shopCars', type: 'dealer' },
  { id: 'bank',      block: [5, 3], facade: 'white', floors: 9, sign: ['SOLARA BANK', '#ffd34e'], color: '#ffd34e', label: 'bank', type: 'bank', noMarker: true },
  { id: 'taxi',      block: [4, 1], facade: 'brick', floors: 3, sign: ['TAXI', '#ffd34e'], color: '#ffd34e', label: 'taxi', type: 'giver', mission: 'taxi' },
  { id: 'ricky',     block: [2, 1], facade: 'pink', floors: 4, sign: ["RICKY'S", '#ff9a3c'], color: '#ffd34e', label: 'race', type: 'giver', mission: 'ricky' },
  { id: 'dana',      block: [8, 1], facade: 'mint', floors: 3, sign: ['GARAGE 8', '#3ce8f5'], color: '#ffd34e', label: 'race', type: 'giver', mission: 'dana' },
  { id: 'burger',    block: [5, 1], facade: 'pink', floors: 2, sign: ['NEON BURGER', '#ff9a3c'], color: '#ff9a3c', label: 'shopBurger', type: 'burger' },
  { id: 'burger2',   block: [4, 6], facade: 'mint', floors: 2, sign: ['NEON BURGER', '#ff9a3c'], color: '#ff9a3c', label: 'shopBurger2', type: 'burger' },
  { id: 'clothes',   block: [6, 3], facade: 'white', floors: 3, sign: ['SUNSET', '#ff9ad5'], color: '#ff9ad5', label: 'shopClothes', type: 'clothes' },
  { id: 'casino',    block: [9, 2], facade: 'glass', floors: 6, sign: ['CASINO', '#ffd34e'], color: '#ffd34e', label: 'casino', type: 'casino' },
];
export const PARKS = [[2, 3], [6, 1]];
const SIGN_TEXTS = [['מלון', '#ff4fa3'], ['CLUB', '#3ce8f5'], ['BAR', '#ff9a3c'], ['סושי', '#7cff8a'], ['24/7', '#ffd34e'], ['NEON', '#ff4fa3'], ['קפה', '#ffb347'], ['PIZZA', '#ff5a5a'], ['DISCO', '#c084fc'], ['מסעדה', '#3ce8f5'], ['HOTEL', '#ffd34e'], ['ספא', '#7cff8a'], ['CASINO', '#ff9a3c'], ['LIVE', '#ff4fa3'], ['ביטוח', '#3ce8f5'], ['SUSHI', '#7cff8a'], ['GYM', '#ff5a5a'], ['פרחים', '#ff9ad5'], ['TATTOO', '#c084fc'], ['VINYL', '#ffd34e']];
const BILLBOARDS = [['SOLARA', 'the drink of the coast', '#ff4fa3', '#ff9a3c'], ['COAST MOTORS', 'drive tomorrow today', '#3ce8f5', '#1f4e9b'], ['NEON FM', '98.6 – all night long', '#c084fc', '#ff4fa3'], ['סאנרייז', 'בית חולים – פתוח 24/7', '#ff5a5a', '#ffb347'], ['PALM SPA', 'relax. repeat.', '#7cff8a', '#3ce8f5'], ['SOLARA BANK', 'your money, our vault', '#ffd34e', '#ff9a3c']];

export class World {
  constructor(scene, quality = 'high') {
    this.scene = scene; this.quality = quality; this.grid = new StaticGrid(24); this.rng = mulberry(20240915);
    this.pois = {}; this.parkingSpots = []; this.lampPositions = []; this.signs = []; this.lights = []; this.markers = [];
    this.buildGraph(); this.buildGround(); this.buildBlocks(); this.buildRoadMarkings(); this.buildProps(); this.buildStreetProps(); this.buildTrafficLights(); this.buildBeach(); this.buildBeachExtras(); this.buildClouds(); this.buildOutskirts(); this.buildMapImage();
  }

  // ---------------- road graph ----------------
  buildGraph() {
    this.nodes = []; this.segments = [];
    for (let j = 0; j <= gridZ; j++) for (let i = 0; i <= gridX; i++) this.nodes.push({ i, j, x: CITY.roadX(i), z: CITY.roadZ(j), out: [], idx: this.nodes.length });
    const N = (i, j) => this.nodes[j * (gridX + 1) + i];
    for (let j = 0; j <= gridZ; j++) for (let i = 0; i <= gridX; i++) {
      if (i < gridX) this.addSeg(N(i, j), N(i + 1, j), true);
      if (j < gridZ) this.addSeg(N(i, j), N(i, j + 1), false);
    }
    this.nodeAt = N;
  }
  addSeg(a, b, horizontal) {
    const s = { a, b, horizontal, idx: this.segments.length, len: Math.abs(b.x - a.x + b.z - a.z) };
    this.segments.push(s); a.out.push({ seg: s, dir: 1, to: b }); b.out.push({ seg: s, dir: -1, to: a });
  }
  // lane centre-line for a segment direction. dir=+1 a->b. lane 0 inner, 1 outer (right-hand traffic)
  lane(seg, dir, lane) {
    const A = dir > 0 ? seg.a : seg.b, B = dir > 0 ? seg.b : seg.a;
    const fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx, off = 1.75 + lane * 3.5;
    return { sx: A.x + fx * HALF + rx * off, sz: A.z + fz * HALF + rz * off, ex: B.x - fx * HALF + rx * off, ez: B.z - fz * HALF + rz * off, fx, fz, rx, rz, len: seg.len - road, from: A, to: B };
  }
  nearestLane(x, z) {
    let best = null, bd = Infinity;
    for (const seg of this.segments) for (const dir of [1, -1]) for (let l = 0; l < 2; l++) {
      const L = this.lane(seg, dir, l); const t = clamp(((x - L.sx) * L.fx + (z - L.sz) * L.fz) / L.len, 0, 1);
      const px = L.sx + L.fx * t * L.len, pz = L.sz + L.fz * t * L.len, d = (px - x) ** 2 + (pz - z) ** 2;
      if (d < bd) { bd = d; best = { seg, dir, lane: l, t, px, pz, L }; }
    }
    return best;
  }
  randomLanePoint() { const seg = this.segments[Math.floor(Math.random() * this.segments.length)], dir = Math.random() < 0.5 ? 1 : -1, lane = Math.random() < 0.6 ? 0 : 1, L = this.lane(seg, dir, lane), t = 0.1 + Math.random() * 0.8; return { seg, dir, lane, t, x: L.sx + L.fx * t * L.len, z: L.sz + L.fz * t * L.len, heading: Math.atan2(-L.fz, L.fx), L }; }
  randomSidewalkPoint() {
    const seg = this.segments[Math.floor(Math.random() * this.segments.length)], side = Math.random() < 0.5 ? 1 : -1; const A = seg.a, B = seg.b;
    const fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx, t = 0.1 + Math.random() * 0.8, off = side * (HALF + sidewalk / 2);
    return { x: A.x + fx * (HALF + t * (seg.len - road)) + rx * off, z: A.z + fz * (HALF + t * (seg.len - road)) + rz * off, seg, side };
  }
  // sidewalk waypoint graph: corners of every block (used by pedestrians)
  sidewalkCorner(bi, bj, cx, cz) { // block bi,bj corner cx,cz in {0,1}
    return { x: CITY.roadX(bi + cx) + (cx ? -1 : 1) * (HALF + sidewalk / 2), z: CITY.roadZ(bj + cz) + (cz ? -1 : 1) * (HALF + sidewalk / 2) };
  }
  isRoad(x, z) { const fx = ((x - CITY.roadX(0) + HALF) % pitch + pitch) % pitch, fz = ((z - CITY.roadZ(0) + HALF) % pitch + pitch) % pitch; return fx < road || fz < road; }

  // ---------------- ground ----------------
  buildGround() {
    const mats = this.mats = {
      asphalt: new THREE.MeshStandardMaterial({ map: asphaltTex(), normalMap: asphaltNormal(), normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.92, metalness: 0.02 }),
      sidewalk: new THREE.MeshStandardMaterial({ map: sidewalkTex(), normalMap: sidewalkNormal(), normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.95 }),
      grass: new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 }),
      sand: new THREE.MeshStandardMaterial({ map: sandTex(), normalMap: sandNormal(), normalScale: new THREE.Vector2(0.5, 0.5), roughness: 1 }),
      roof: new THREE.MeshStandardMaterial({ map: roofTex(), roughness: 0.95 }),
      plank: new THREE.MeshStandardMaterial({ map: plankTex(), normalMap: plankNormal(), normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.9 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.8 }),
      white: new THREE.MeshBasicMaterial({ color: 0xf2f2f2, side: THREE.DoubleSide }),
      yellow: new THREE.MeshBasicMaterial({ color: 0xf2c230, side: THREE.DoubleSide }),
      prop: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.1 }),
      leaf: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
    };
    const g = new GeoBuilder(); g.plane(CITY.minX - 6, CITY.minZ - 6, CITY.maxX, CITY.maxZ + 6, 0, 6);
    const ground = new THREE.Mesh(g.build(), mats.asphalt); ground.receiveShadow = true; this.scene.add(ground);
    // outskirts ground: a frame around the city rectangle, never overlapping the asphalt
    const o = new GeoBuilder(); const X0 = CITY.minX - 6, X1 = CITY.maxX, Z0 = CITY.minZ - 6, Z1 = CITY.maxZ + 6, F = 900;
    o.plane(X0 - F, Z0 - F, X1 + F, Z0, -0.04, 12); o.plane(X0 - F, Z1, X1 + F, Z1 + F, -0.04, 12);
    o.plane(X0 - F, Z0, X0, Z1, -0.04, 12); o.plane(X1, Z0, X1 + F, Z1, -0.04, 12);
    const outer = new THREE.Mesh(o.build(), mats.grass); outer.receiveShadow = true; this.scene.add(outer);
    // invisible boundary walls
    const B = 30, big = 1000;
    this.grid.add({ x0: CITY.minX - B - 5, x1: CITY.minX - B, z0: -big, z1: big, y0: 0, y1: 50, type: 'wall' });
    this.grid.add({ x0: CITY.oceanX + 14, x1: CITY.oceanX + 19, z0: -big, z1: big, y0: 0, y1: 50, type: 'wall' });
    this.grid.add({ x0: -big, x1: big, z0: CITY.minZ - B - 5, z1: CITY.minZ - B, y0: 0, y1: 50, type: 'wall' });
    this.grid.add({ x0: -big, x1: big, z0: CITY.maxZ + B, z1: CITY.maxZ + B + 5, y0: 0, y1: 50, type: 'wall' });
    this.bounds = { minX: CITY.minX - B + 1, maxX: CITY.oceanX + 13, minZ: CITY.minZ - B + 1, maxZ: CITY.maxZ + B - 1 };
  }

  // ---------------- blocks, lots and buildings ----------------
  buildBlocks() {
    const rng = this.rng; const facadeBuilders = new Map(); const roofB = new GeoBuilder(), walkB = new GeoBuilder(), grassB = new GeoBuilder(), lotB = new GeoBuilder(), lineB = new GeoBuilder();
    const fb = id => { if (!facadeBuilders.has(id)) facadeBuilders.set(id, new GeoBuilder()); return facadeBuilders.get(id); };
    this.storeBuilders = [new GeoBuilder(), new GeoBuilder(), new GeoBuilder(), new GeoBuilder(), new GeoBuilder()]; this.awningB = new GeoBuilder(); this.shadowB = new GeoBuilder(); this.towerLights = [];
    const cx = (gridX - 1) / 2, cz = (gridZ - 1) / 2, maxD = Math.hypot(cx, cz);
    this.buildings = [];
    const poiByBlock = new Map(POI_DEFS.map(p => [p.block.join(','), p]));
    for (let bj = 0; bj < gridZ; bj++) for (let bi = 0; bi < gridX; bi++) {
      const x0 = CITY.roadX(bi) + HALF, z0 = CITY.roadZ(bj) + HALF, x1 = x0 + CITY.block, z1 = z0 + CITY.block;
      const isPark = PARKS.some(p => p[0] === bi && p[1] === bj);
      if (isPark) { grassB.box(x0, 0, z0, x1, 0.15, z1, { uvU: 8, uvV: 8 }); walkB.box(x0, 0, z0, x1, 0.14, z1, { uvU: 4, uvV: 4 }); this.buildPark(x0, z0, x1, z1, walkB); continue; }
      walkB.box(x0, 0, z0, x1, 0.15, z1, { uvU: 4, uvV: 4 });
      const d = Math.hypot(bi - cx, bj - cz) / maxD, tall = Math.pow(1 - d, 2.2);
      const poi = poiByBlock.get(bi + ',' + bj);
      const cols = d < 0.35 ? 2 : (rng() < 0.5 ? 2 : 3), rows = d < 0.35 ? 2 : (rng() < 0.5 ? 2 : 3);
      const inner0x = x0 + sidewalk, inner0z = z0 + sidewalk, lw = (CITY.block - 2 * sidewalk) / cols, lh = (CITY.block - 2 * sidewalk) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const lx0 = inner0x + c * lw, lz0 = inner0z + r * lh, lx1 = lx0 + lw, lz1 = lz0 + lh; const isPoiLot = poi && r === 0 && c === 0;
        if (!isPoiLot && d > 0.4 && rng() < 0.13) { this.buildParking(lx0, lz0, lx1, lz1, lotB, lineB); continue; }
        const gap = 1 + rng() * 1.6;
        let bx0 = lx0 + gap, bz0 = lz0 + gap, bx1 = lx1 - gap, bz1 = lz1 - gap;
        let floors = Math.round(2 + tall * 34 + rng() * 5 + (rng() < 0.08 ? 10 : 0)); let style = FACADES[Math.floor(rng() * FACADES.length)];
        if (d > 0.55 && style.id === 'tower') style = FACADES[1]; if (d < 0.25 && rng() < 0.5) style = rng() < 0.5 ? FACADES[0] : FACADES[6];
        if (isPoiLot) { floors = poi.floors; style = FACADES.find(f => f.id === poi.facade); bx0 = lx0 + 1; bz0 = lz0 + 1; bx1 = lx1 - 1; bz1 = lz1 - 1; }
        const h = floors * FLOOR;
        this.addBuilding(fb(style.id), roofB, bx0, bz0, bx1, bz1, h, style, rng, isPoiLot ? poi : null);
        // signs on the street-facing side(s)
        const frontZ = r === 0, frontX = c === 0;
        if (isPoiLot) { this.addSign(bx0, bx1, bz0, poi.sign[0], poi.sign[1], 'south', h, 1.3, poi); this.pois[poi.id] = { ...poi, x: (bx0 + bx1) / 2, z: z0 + 1.5, bx0, bx1, bz0, bz1, h, blockX0: x0, blockZ0: z0 }; }
        else if (floors <= 14 && rng() < 0.42) { const s = SIGN_TEXTS[Math.floor(rng() * SIGN_TEXTS.length)]; if (frontZ) this.addSign(bx0, bx1, bz0, s[0], s[1], 'south', h, 1); else if (r === rows - 1) this.addSign(bx0, bx1, bz1, s[0], s[1], 'north', h, 1); else if (frontX) this.addSignX(bx0, bz0, bz1, s[0], s[1], 'west', h); else if (c === cols - 1) this.addSignX(bx1, bz0, bz1, s[0], s[1], 'east', h); }
        if (floors <= 6 && !isPoiLot && rng() < 0.2) this.addBillboard((bx0 + bx1) / 2, h, (bz0 + bz1) / 2, rng);
        if (floors <= 16 && rng() < 0.75) { const var_ = Math.floor(rng() * 5); if (frontZ) this.addStorefront(bx0, bx1, bz0, 'south', var_); if (r === rows - 1) this.addStorefront(bx0, bx1, bz1, 'north', var_); if (frontX) this.addStorefrontX(bx0, bz0, bz1, 'west', var_); if (c === cols - 1) this.addStorefrontX(bx1, bz0, bz1, 'east', var_); }
      }
    }
    // materials + meshes
    this.facadeMats = [];
    for (const [id, b] of facadeBuilders) {
      const style = FACADES.find(f => f.id === id), tex = facadeTextures(style); const orm = facadeORM(style);
      const m = new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, normalMap: facadeNormal(style), normalScale: new THREE.Vector2(0.85, 0.85), roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, envMapIntensity: 1.1 });
      m.userData.glow = tex.glow; this.facadeMats.push(m);
      const mesh = new THREE.Mesh(b.build(), m); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh);
    }
    const roofs = new THREE.Mesh(roofB.build(), this.mats.roof); roofs.castShadow = true; roofs.receiveShadow = true; this.scene.add(roofs);
    this.storeMats = [];
    this.storeBuilders.forEach((b, i) => { if (!b.count) return; const tex = storefrontTextures(i); const orm = storefrontORM(i); const m = new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, normalMap: storefrontNormal(i), normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, envMapIntensity: 1.2 }); this.storeMats.push(m); const mesh = new THREE.Mesh(b.build(), m); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh); });
    if (this.awningB.count) { const aw = new THREE.Mesh(this.awningB.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide })); aw.castShadow = true; this.scene.add(aw); }
    if (this.shadowB.count) this.scene.add(new THREE.Mesh(this.shadowB.build(), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: 0x000000, opacity: 0.55, side: THREE.DoubleSide })));
    if (this.towerLights.length) { this.towerLightMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020 }), this.towerLights.length); const m = new THREE.Matrix4(); this.towerLights.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); this.towerLightMesh.setMatrixAt(i, m); }); this.scene.add(this.towerLightMesh); }
    const walks = new THREE.Mesh(walkB.build(), this.mats.sidewalk); walks.receiveShadow = true; this.scene.add(walks);
    if (grassB.count) { const gr = new THREE.Mesh(grassB.build(), this.mats.grass); gr.receiveShadow = true; this.scene.add(gr); }
    if (lotB.count) { const lot = new THREE.Mesh(lotB.build(), this.mats.asphalt); lot.receiveShadow = true; this.scene.add(lot); }
    if (lineB.count) this.scene.add(new THREE.Mesh(lineB.build(), this.mats.white));
  }
  addBuilding(fb, roofB, x0, z0, x1, z1, h, style, rng, poi) {
    fb.box(x0, 0, z0, x1, h, z1, { uvU: 8, uvV: 14, top: false });
    roofB.box(x0, h - 0.01, z0, x1, h + 0.3, z1, { uvU: 4, uvV: 4, sides: true });
    roofB.box(x0 - 0.12, h, z0 - 0.12, x1 + 0.12, h + 0.55, z0 + 0.3, { uvU: 2, uvV: 2 }); roofB.box(x0 - 0.12, h, z1 - 0.3, x1 + 0.12, h + 0.55, z1 + 0.12, { uvU: 2, uvV: 2 }); roofB.box(x0 - 0.12, h, z0, x0 + 0.3, h + 0.55, z1, { uvU: 2, uvV: 2 }); roofB.box(x1 - 0.3, h, z0, x1 + 0.12, h + 0.55, z1, { uvU: 2, uvV: 2 });
    this.addContactShadow(x0, z0, x1, z1, 0.16);
    this.grid.add({ x0, z0, x1, z1, y0: 0, y1: h, type: 'building' }); this.buildings.push({ x0, z0, x1, z1, h });
    const floors = Math.round(h / FLOOR), w = x1 - x0, d = z1 - z0;
    if (floors >= 16 && rng() < 0.6) { // stepped crown
      const in0 = 2 + rng() * 3, hh = FLOOR * (2 + Math.floor(rng() * 5));
      fb.box(x0 + in0, h, z0 + in0, x1 - in0, h + hh, z1 - in0, { uvU: 8, uvV: 14, top: false }); roofB.box(x0 + in0, h + hh - 0.01, z0 + in0, x1 - in0, h + hh + 0.3, z1 - in0, { uvU: 4, uvV: 4 });
      if (rng() < 0.6) { const ah = 6 + rng() * 10; roofB.box((x0 + x1) / 2 - 0.25, h + hh, (z0 + z1) / 2 - 0.25, (x0 + x1) / 2 + 0.25, h + hh + ah, (z0 + z1) / 2 + 0.25, { uvU: 1, uvV: 1 }); this.towerLights.push({ x: (x0 + x1) / 2, y: h + hh + ah + 0.3, z: (z0 + z1) / 2 }); } else this.towerLights.push({ x: (x0 + x1) / 2, y: h + hh + 0.6, z: (z0 + z1) / 2 });
    } else if (floors >= 4) {
      const n = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) { const ax = x0 + 2 + rng() * (w - 6), az = z0 + 2 + rng() * (d - 6), s = 1.2 + rng() * 1.6; roofB.box(ax, h, az, ax + s, h + 0.8 + rng() * 1.2, az + s * 0.8, { uvU: 1, uvV: 1 }); }
      if (rng() < 0.3) { const ax = x0 + 3 + rng() * (w - 8), az = z0 + 3 + rng() * (d - 8); roofB.box(ax, h, az, ax + 2.4, h + 3.2, az + 2.4, { uvU: 1, uvV: 1 }); }
    }
    if (poi?.garage) { // dark garage opening on the south face
      const m = new THREE.Mesh(new THREE.PlaneGeometry((x1 - x0) * 0.6, 4.2), new THREE.MeshBasicMaterial({ color: 0x08090c })); m.position.set((x0 + x1) / 2, 2.1, z0 - 0.05); m.rotation.y = Math.PI; this.scene.add(m);
    }
    if (poi?.cross) { const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: crossTex() })); m.position.set((x0 + x1) / 2, h - 3, z0 - 0.06); m.rotation.y = Math.PI; this.scene.add(m); }
  }
  addStorefront(x0, x1, z, side, v) {
    const b = this.storeBuilders[v]; const w = x1 - x0; if (w < 7) return; const d = 0.22; const zz0 = side === 'south' ? z - d : z - 0.02, zz1 = side === 'south' ? z + 0.02 : z + d;
    b.box(x0 + 0.3, 0, zz0, x1 - 0.3, 4.4, zz1, { uvU: 6, uvV: 4.4, top: true });
    const col = new THREE.Color(AWNINGS[v % AWNINGS.length]); const az = side === 'south' ? z - d : z + d; const dir = side === 'south' ? -1 : 1;
    this.awningB.quad([x0 + 0.5, 3.35, az], [x1 - 0.5, 3.35, az], [x1 - 0.5, 2.85, az + dir * 1.3], [x0 + 0.5, 2.85, az + dir * 1.3], [0, 0.9, dir * 0.4], null, col);
  }
  addStorefrontX(x, z0, z1, side, v) {
    const b = this.storeBuilders[v]; const w = z1 - z0; if (w < 7) return; const d = 0.22; const xx0 = side === 'west' ? x - d : x - 0.02, xx1 = side === 'west' ? x + 0.02 : x + d;
    b.box(xx0, 0, z0 + 0.3, xx1, 4.4, z1 - 0.3, { uvU: 6, uvV: 4.4, top: true });
    const col = new THREE.Color(AWNINGS[v % AWNINGS.length]); const ax = side === 'west' ? x - d : x + d; const dir = side === 'west' ? -1 : 1;
    this.awningB.quad([ax, 3.35, z1 - 0.5], [ax, 3.35, z0 + 0.5], [ax + dir * 1.3, 2.85, z0 + 0.5], [ax + dir * 1.3, 2.85, z1 - 0.5], [dir * 0.4, 0.9, 0], null, col);
  }
  addContactShadow(x0, z0, x1, z1, y) {
    const w = 1.6, b = this.shadowB; const q = (a, bb, c, d) => b.quad(a, bb, c, d, [0, 1, 0], [[1, 0], [1, 1], [0, 1], [0, 0]]);
    q([x0, y, z0 - w], [x1, y, z0 - w], [x1, y, z0], [x0, y, z0]);
    q([x1, y, z1 + w], [x0, y, z1 + w], [x0, y, z1], [x1, y, z1]);
    q([x0 - w, y, z1], [x0 - w, y, z0], [x0, y, z0], [x0, y, z1]);
    q([x1 + w, y, z0], [x1 + w, y, z1], [x1, y, z1], [x1, y, z0]);
  }
  addSign(x0, x1, z, text, color, side, h, scale = 1, poi) {
    const w = Math.min(10 * scale, (x1 - x0) * 0.8), y = Math.min(h - 1.5, poi ? 7.5 : 4.8 + Math.random() * 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: neonSign(text, color), transparent: false }));
    m.position.set((x0 + x1) / 2, y, z + (side === 'south' ? -0.08 : 0.08)); m.rotation.y = side === 'south' ? Math.PI : 0; this.scene.add(m); this.signs.push(m);
  }
  addSignX(x, z0, z1, text, color, side, h) {
    const w = Math.min(10, (z1 - z0) * 0.8), y = Math.min(h - 1.5, 4.8 + Math.random() * 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: neonSign(text, color) }));
    m.position.set(x + (side === 'west' ? -0.08 : 0.08), y, (z0 + z1) / 2); m.rotation.y = side === 'west' ? -Math.PI / 2 : Math.PI / 2; this.scene.add(m); this.signs.push(m);
  }
  addBillboard(x, h, z, rng) {
    const b = BILLBOARDS[Math.floor(rng() * BILLBOARDS.length)], rot = Math.floor(rng() * 4) * Math.PI / 2;
    const grp = new THREE.Group(); grp.position.set(x, h, z); grp.rotation.y = rot;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.3, 0.3), this.mats.dark); frame.position.y = 5.2; grp.add(frame);
    for (const px of [-3.6, 3.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), this.mats.dark); p.position.set(px, 1.6, 0); grp.add(p); }
    const face = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: billboard(b[0], b[1], b[2], b[3]) })); face.position.set(0, 5.2, 0.2); grp.add(face);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), this.mats.dark); back.position.set(0, 5.2, -0.2); back.rotation.y = Math.PI; grp.add(back);
    this.scene.add(grp);
  }
  buildParking(x0, z0, x1, z1, lotB, lineB) {
    lotB.box(x0, 0.15, z0, x1, 0.17, z1, { uvU: 6, uvV: 6, sides: false });
    const n = Math.floor((x1 - x0 - 4) / 3.2); const zc = (z0 + z1) / 2;
    for (let i = 0; i < n; i++) { const x = x0 + 2 + i * 3.2; lineB.strip(x, zc - 4, Math.PI / 2, 5.5, 0.15, 0.18); if (i < n - 1 && Math.random() < 0.55) this.parkingSpots.push({ x: x + 1.6, z: zc - 4, heading: Math.PI / 2 }); }
    lineB.strip(x0 + 2 + n * 3.2, zc - 4, Math.PI / 2, 5.5, 0.15, 0.18);
  }
  buildPark(x0, z0, x1, z1, walkB) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; walkB.box(cx - 2, 0.14, z0, cx + 2, 0.17, z1, { uvU: 4, uvV: 4, sides: false }); walkB.box(x0, 0.14, cz - 2, x1, 0.17, cz + 2, { uvU: 4, uvV: 4, sides: false });
    const f = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 0.8, 24), this.mats.sidewalk); f.position.set(cx, 0.4, cz); this.scene.add(f); this.grid.add({ x0: cx - 4, x1: cx + 4, z0: cz - 4, z1: cz + 4, y0: 0, y1: 1, type: 'prop' });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x3aa0c8, roughness: 0.2, metalness: 0.3 })); water.position.set(cx, 0.75, cz); this.scene.add(water);
    this.parks = this.parks || []; this.parks.push({ x0, z0, x1, z1, cx, cz });
    for (let i = 0; i < 26; i++) { const x = x0 + 3 + Math.random() * (x1 - x0 - 6), z = z0 + 3 + Math.random() * (z1 - z0 - 6); if (Math.abs(x - cx) < 4 || Math.abs(z - cz) < 4) continue; this.treeSpots = this.treeSpots || []; this.treeSpots.push({ x, z, s: 0.8 + Math.random() * 0.6 }); this.grid.add({ x0: x - 0.35, x1: x + 0.35, z0: z - 0.35, z1: z + 0.35, y0: 0, y1: 4, type: 'pole' }); }
  }

  // ---------------- road markings ----------------
  buildRoadMarkings() {
    const w = new GeoBuilder(), y = new GeoBuilder(); const Y = 0.012;
    for (const seg of this.segments) {
      const A = seg.a, B = seg.b, ang = seg.horizontal ? 0 : Math.PI / 2, len = seg.len - road, cx = (A.x + B.x) / 2, cz = (A.z + B.z) / 2, fx = seg.horizontal ? 1 : 0, fz = seg.horizontal ? 0 : 1, rx = -fz, rz = fx;
      y.strip(cx + rx * 0.18, cz + rz * 0.18, ang, len, 0.12, Y); y.strip(cx - rx * 0.18, cz - rz * 0.18, ang, len, 0.12, Y);
      w.strip(cx + rx * 6.85, cz + rz * 6.85, ang, len, 0.12, Y); w.strip(cx - rx * 6.85, cz - rz * 6.85, ang, len, 0.12, Y);
      for (let s = -len / 2 + 3; s < len / 2 - 3; s += 6) for (const side of [3.5, -3.5]) w.strip(cx + fx * s + rx * side, cz + fz * s + rz * side, ang, 3, 0.12, Y);
    }
    for (const n of this.nodes) for (const o of n.out) { // crosswalk + stop line at each approach
      const fx = Math.sign(o.to.x - n.x), fz = Math.sign(o.to.z - n.z), rx = -fz, rz = fx, ang = fx ? 0 : Math.PI / 2;
      const bx = n.x + fx * (HALF + 1.6), bz = n.z + fz * (HALF + 1.6);
      for (let k = -6; k <= 6; k++) w.strip(bx + rx * k * 1.1, bz + rz * k * 1.1, ang, 2.4, 0.55, Y);
      w.strip(n.x + fx * (HALF + 3.4) + rx * 3.5, n.z + fz * (HALF + 3.4) + rz * 3.5, ang, 0.35, 6.6, Y);
      // lane arrows for traffic arriving at this node (they travel along -f): straight in the inner lane, right turn in the outer lane
      const ax = n.x + fx * (HALF + 13), az = n.z + fz * (HALF + 13); const tf = [-fx, -fz]; const tr = [-tf[1], tf[0]]; // right of travel
      const arrow = (cx, cz, dir, turn) => { const [dx, dz] = dir; const [px, pz] = [-dz, dx];
        w.strip(cx - dx * 1.0, cz - dz * 1.0, Math.atan2(-dz, dx), 2.4, 0.3, Y);
        w.tri([cx + dx * 0.3 + px * 0.65, Y, cz + dz * 0.3 + pz * 0.65], [cx + dx * 1.6, Y, cz + dz * 1.6], [cx + dx * 0.3 - px * 0.65, Y, cz + dz * 0.3 - pz * 0.65]);
        if (turn) { const [qx, qz] = turn; w.strip(cx - dx * 0.4 + qx * 0.6, cz - dz * 0.4 + qz * 0.6, Math.atan2(-qz, qx), 1.2, 0.3, Y); w.tri([cx - dx * 0.4 + qx * 1.1 + dx * 0.55, Y, cz - dz * 0.4 + qz * 1.1 + dz * 0.55], [cx - dx * 0.4 + qx * 2.0, Y, cz - dz * 0.4 + qz * 2.0], [cx - dx * 0.4 + qx * 1.1 - dx * 0.55, Y, cz - dz * 0.4 + qz * 1.1 - dz * 0.55]); } };
      arrow(ax + tr[0] * 1.75, az + tr[1] * 1.75, tf, null); arrow(ax + tr[0] * 5.25, az + tr[1] * 5.25, tf, tr);
    }
    this.scene.add(new THREE.Mesh(w.build(), this.mats.white)); this.scene.add(new THREE.Mesh(y.build(), this.mats.yellow));
  }

  // ---------------- props: lamps, palms, trees ----------------
  buildProps() {
    // street lamps
    const poleGeo = mergeGeometries([
      xform(new THREE.CylinderGeometry(0.1, 0.16, 7, 7), M4(0, 3.5, 0), new THREE.Color(0x8a8f99)),
      xform(new THREE.BoxGeometry(1.8, 0.14, 0.14), M4(0.85, 6.9, 0), new THREE.Color(0x8a8f99)),
    ]);
    const lampSpots = [];
    for (const seg of this.segments) {
      const A = seg.a, B = seg.b, fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx;
      for (let s = 16; s < seg.len - road - 8; s += 26) for (const side of [1, -1]) {
        const x = A.x + fx * (HALF + s) + rx * side * (HALF + 0.8), z = A.z + fz * (HALF + s) + rz * side * (HALF + 0.8);
        const rot = Math.atan2(rz * side, -rx * side); // arm (local +x) points toward the road
        lampSpots.push({ x, z, rot });
        this.grid.add({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15, y0: 0, y1: 7, type: 'pole' });
      }
    }
    const poles = new THREE.InstancedMesh(poleGeo, this.mats.prop, lampSpots.length); poles.castShadow = true;
    this.lampHeads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.18, 0.3), new THREE.MeshBasicMaterial({ color: 0x9a9fa8 }), lampSpots.length);
    const m = new THREE.Matrix4();
    lampSpots.forEach((L, i) => {
      m.compose(new THREE.Vector3(L.x, 0, L.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, L.rot, 0)), new THREE.Vector3(1, 1, 1)); poles.setMatrixAt(i, m);
      const hx = L.x + Math.cos(L.rot) * 1.7, hz = L.z - Math.sin(L.rot) * 1.7;
      m.compose(new THREE.Vector3(hx, 6.85, hz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, L.rot, 0)), new THREE.Vector3(1, 1, 1)); this.lampHeads.setMatrixAt(i, m);
      this.lampPositions.push({ x: hx, y: 6.6, z: hz });
    });
    this.scene.add(poles); this.scene.add(this.lampHeads);
    // palms along the beach and the coast road, trees in parks
    const trunk = xform(new THREE.CylinderGeometry(0.16, 0.3, 8, 7), M4(0, 4, 0, 0, 0, 0.06), new THREE.Color(0x8a6a48));
    const fronds = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; fronds.push(xform(new THREE.PlaneGeometry(0.9, 3.6, 1, 3), M4(Math.cos(a) * 1.5, 8.2 - 0.4, Math.sin(a) * 1.5, -0.9, -a + Math.PI / 2, 0), new THREE.Color(0x3f8f3a).offsetHSL(0, 0, (i % 3) * 0.05))); }
    const coco = xform(new THREE.SphereGeometry(0.5, 6, 5), M4(0, 7.9, 0), new THREE.Color(0x6b4a2b));
    const palmGeo = mergeGeometries([trunk, coco, ...fronds]);
    const palmSpots = [];
    for (let z = CITY.minZ + 10; z < CITY.maxZ; z += 11) { palmSpots.push({ x: CITY.beachX + 6 + Math.random() * 3, z, s: 0.8 + Math.random() * 0.5 }); if (Math.random() < 0.5) palmSpots.push({ x: CITY.beachX + 22 + Math.random() * 14, z: z + 4, s: 0.7 + Math.random() * 0.5 }); }
    for (const t of (this.treeSpots || [])) palmSpots.push(t);
    const palms = new THREE.InstancedMesh(palmGeo, this.mats.leaf, palmSpots.length); palms.castShadow = true;
    palmSpots.forEach((p, i) => { m.compose(new THREE.Vector3(p.x, 0, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.random() * 6.28, 0)), new THREE.Vector3(p.s, p.s, p.s)); palms.setMatrixAt(i, m); this.grid.add({ x0: p.x - 0.3, x1: p.x + 0.3, z0: p.z - 0.3, z1: p.z + 0.3, y0: 0, y1: 6, type: 'pole' }); });
    this.scene.add(palms);
  }

  // ---------------- street furniture ----------------
  buildStreetProps() {
    const col = h => new THREE.Color(h); const B = (w, h, d, x, y, z, c) => xform(new THREE.BoxGeometry(w, h, d), M4(x, y, z), col(c)); const CY = (r0, r1, h, x, y, z, c, seg = 10) => xform(new THREE.CylinderGeometry(r0, r1, h, seg), M4(x, y, z), col(c));
    const kinds = {
      bench: { geo: mergeGeometries([B(1.8, 0.08, 0.5, 0, 0.45, 0, 0x8a5a34), B(1.8, 0.4, 0.06, 0, 0.72, -0.24, 0x8a5a34), B(0.08, 0.45, 0.5, -0.8, 0.22, 0, 0x2a2d33), B(0.08, 0.45, 0.5, 0.8, 0.22, 0, 0x2a2d33)]), every: 44, offset: 2.3, rot: 0, box: 0.9 },
      bin: { geo: mergeGeometries([CY(0.3, 0.26, 0.9, 0, 0.45, 0, 0x2f5f3a, 12), CY(0.32, 0.32, 0.06, 0, 0.93, 0, 0x1e1e22, 12)]), every: 31, offset: 2.4, rot: 0, box: 0.35 },
      hydrant: { geo: mergeGeometries([CY(0.14, 0.16, 0.7, 0, 0.35, 0, 0xd8322a, 8), CY(0.18, 0.18, 0.08, 0, 0.72, 0, 0xd8322a, 8), B(0.5, 0.1, 0.12, 0, 0.45, 0, 0xd8322a)]), every: 57, offset: 1.0, rot: 0, box: 0.2 },
      mailbox: { geo: mergeGeometries([B(0.5, 0.5, 0.45, 0, 1.0, 0, 0x2b4fa8), B(0.5, 0.15, 0.45, 0, 1.3, 0, 0x2b4fa8), B(0.1, 0.8, 0.1, 0, 0.4, 0, 0x2a2d33)]), every: 83, offset: 2.4, rot: 0, box: 0.3 },
      planter: { geo: mergeGeometries([B(1.2, 0.5, 0.6, 0, 0.25, 0, 0x8a8a86), xform(new THREE.SphereGeometry(0.42, 8, 6), M4(-0.3, 0.75, 0, 0, 0, 0, 1, 0.8, 1), col(0x3f8f3a)), xform(new THREE.SphereGeometry(0.42, 8, 6), M4(0.3, 0.75, 0, 0, 0, 0, 1, 0.8, 1), col(0x4aa03f))]), every: 38, offset: 2.3, rot: 0, box: 0.65 },
      busstop: { geo: mergeGeometries([B(0.12, 2.6, 0.12, -1.4, 1.3, -0.5, 0x4a4d55), B(0.12, 2.6, 0.12, 1.4, 1.3, -0.5, 0x4a4d55), B(3.2, 0.1, 1.4, 0, 2.6, 0, 0x2a2d33), B(3.0, 1.3, 0.08, 0, 1.6, -0.5, 0x5fa8cc), B(2.4, 0.06, 0.4, 0, 0.5, -0.2, 0x8a5a34), B(0.6, 0.5, 0.06, -0.9, 2.2, -0.55, 0xffd34e)]), every: 156, offset: 2.2, rot: 0, box: 1.6 },
    };
    const spots = {}; for (const k in kinds) spots[k] = [];
    const roadWidth = HALF; let phase = 0;
    for (const seg of this.segments) {
      const A = seg.a, B_ = seg.b, fx = Math.sign(B_.x - A.x), fz = Math.sign(B_.z - A.z), rx = -fz, rz = fx; phase++;
      for (const k in kinds) { const K = kinds[k]; const start = 12 + ((phase * 13 + k.length * 7) % K.every);
        for (let sdist = start; sdist < seg.len - road - 8; sdist += K.every) { const side = ((phase + Math.floor(sdist / K.every)) % 2) ? 1 : -1;
          const x = A.x + fx * (HALF + sdist) + rx * side * (roadWidth + K.offset), z = A.z + fz * (HALF + sdist) + rz * side * (roadWidth + K.offset);
          const rot = Math.atan2(rx * side, rz * side) + Math.PI; // face the road
          spots[k].push({ x, z, rot }); this.grid.add({ x0: x - K.box, x1: x + K.box, z0: z - K.box, z1: z + K.box, y0: 0, y1: 2, type: 'pole' }); } }
    }
    const m = new THREE.Matrix4();
    for (const k in kinds) { const list = spots[k]; if (!list.length) continue; const mesh = new THREE.InstancedMesh(kinds[k].geo, this.mats.prop, list.length); mesh.castShadow = true; mesh.receiveShadow = true;
      list.forEach((p, i) => { m.compose(new THREE.Vector3(p.x, 0.15, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, 0)), new THREE.Vector3(1, 1, 1)); mesh.setMatrixAt(i, m); }); this.scene.add(mesh); }
  }
  buildClouds() {
    const tex = cloudTex(); this.cloudMats = [];
    for (const [y, sc, op] of [[380, 1.0, 0.85], [470, 1.6, 0.55]]) { const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: op, color: 0xffffff }); mat.map = tex.clone(); mat.map.needsUpdate = true; mat.map.repeat.set(3 * sc, 3 * sc); mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200), mat); mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.renderOrder = -1; this.scene.add(mesh); this.cloudMats.push({ mat, speed: 0.0012 / sc, baseOp: op }); }
  }
  buildBeachExtras() {
    const col = h => new THREE.Color(h); const m = new THREE.Matrix4(); const rng = mulberry(4242);
    const umb = c => mergeGeometries([xform(new THREE.CylinderGeometry(0.04, 0.05, 2.3, 6), M4(0, 1.15, 0), col(0xf0f0f0)), xform(new THREE.ConeGeometry(1.5, 0.55, 10, 1, true), M4(0, 2.35, 0), col(c))]);
    const towel = c => xform(new THREE.BoxGeometry(1.0, 0.03, 1.9), M4(0, 0.03, 0), col(c));
    const sets = [[umb(0xff4fa3), 'u1'], [umb(0xffd34e), 'u2'], [umb(0x3ce8f5), 'u3'], [towel(0xff9ad5), 't1'], [towel(0x9ad0ff), 't2'], [towel(0xfff1c8), 't3']];
    const spots = sets.map(() => []);
    for (let z = CITY.minZ + 20; z < CITY.maxZ - 20; z += 9) { if (Math.abs(z) < 22 || Math.abs(z + 200) < 14) continue; if (rng() < 0.55) { const x = CITY.beachX + 14 + rng() * 22; const u = Math.floor(rng() * 3); spots[u].push({ x, z, rot: rng() * 6.28 }); const t = 3 + Math.floor(rng() * 3); spots[t].push({ x: x + 1.2, z: z + 1.4, rot: rng() * 0.6 }); if (rng() < 0.5) spots[3 + Math.floor(rng() * 3)].push({ x: x - 1.4, z: z + 0.8, rot: rng() * 0.6 }); } }
    sets.forEach(([geo], i) => { const list = spots[i]; if (!list.length) return; const mesh = new THREE.InstancedMesh(geo, this.mats.leaf, list.length); mesh.castShadow = true; list.forEach((p, k) => { m.compose(new THREE.Vector3(p.x, 0.02, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, 0)), new THREE.Vector3(1, 1, 1)); mesh.setMatrixAt(k, m); if (i < 3) this.grid.add({ x0: p.x - 0.1, x1: p.x + 0.1, z0: p.z - 0.1, z1: p.z + 0.1, y0: 0, y1: 2, type: 'pole' }); }); this.scene.add(mesh); });
    // boats
    const boatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 });
    for (const [x, z, c] of [[CITY.oceanX + 60, 60, 0xf4f4f4], [CITY.oceanX + 110, -90, 0x2b4fa8], [CITY.oceanX + 85, 250, 0xff4fa3], [CITY.oceanX + 140, 160, 0xf4f4f4]]) {
      const geo = mergeGeometries([xform(new THREE.BoxGeometry(7, 1.2, 2.6), M4(0, 0.4, 0), col(c)), xform(new THREE.BoxGeometry(2.6, 1.1, 2.0), M4(-0.5, 1.5, 0), col(0xf4f4f4)), xform(new THREE.BoxGeometry(2.4, 0.6, 1.8), M4(-0.5, 2.3, 0), col(0x0f1c2c)), xform(new THREE.BoxGeometry(0.1, 4, 0.1), M4(1.5, 3, 0), col(0x8a8f99))]);
      const b = new THREE.Mesh(geo, boatMat); b.position.set(x, -0.1, z); b.rotation.y = Math.random() * 6.28; b.castShadow = true; this.scene.add(b); this.boats = this.boats || []; this.boats.push(b);
    }
  }
  // ---------------- traffic lights ----------------
  buildTrafficLights() {
    const heads = []; this.lightNodes = [];
    const poleGeo = mergeGeometries([
      xform(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 6), M4(0, 2.6, 0), new THREE.Color(0x35383f)),
      xform(new THREE.BoxGeometry(0.34, 1.0, 0.3), M4(0, 4.7, 0), new THREE.Color(0x1d1f24)),
    ]);
    for (const n of this.nodes) {
      if (n.i === 0 || n.i === gridX || n.j === 0 || n.j === gridZ) continue;
      const rec = { node: n, offset: Math.random() * 20, heads: [], state: null }; this.lightNodes.push(rec); n.light = rec;
      for (const o of n.out) { // a head facing traffic arriving FROM o.to
        const fx = Math.sign(o.to.x - n.x), fz = Math.sign(o.to.z - n.z); // direction toward the neighbour; incoming traffic travels -f
        const rx = fz, rz = -fx; // right side of incoming traffic (which travels along -f): right = (-(-fz), (-fx)) = (fz, -fx)
        const x = n.x + fx * (HALF + 0.9) + rx * (HALF + 0.9), z = n.z + fz * (HALF + 0.9) + rz * (HALF + 0.9);
        const rot = Math.atan2(fx, fz); // face toward incoming cars (looking along +f from the stop line means facing them)
        heads.push({ x, z, rot, axis: o.seg.horizontal ? 'ew' : 'ns', rec });
        this.grid.add({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15, y0: 0, y1: 5, type: 'pole' });
      }
    }
    const poles = new THREE.InstancedMesh(poleGeo, this.mats.prop, heads.length);
    this.lightLamps = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ color: 0xffffff }), heads.length * 3);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    heads.forEach((h, i) => {
      q.setFromEuler(new THREE.Euler(0, h.rot, 0)); m.compose(new THREE.Vector3(h.x, 0, h.z), q, one); poles.setMatrixAt(i, m);
      for (let k = 0; k < 3; k++) { const ly = 5.02 - k * 0.3, off = new THREE.Vector3(0, ly, 0.16).applyQuaternion(q); m.compose(new THREE.Vector3(h.x + off.x, ly, h.z + off.z), q, one); this.lightLamps.setMatrixAt(i * 3 + k, m); this.lightLamps.setColorAt(i * 3 + k, new THREE.Color(0x222222)); }
      h.rec.heads.push({ base: i * 3, axis: h.axis });
    });
    this.scene.add(poles); this.scene.add(this.lightLamps); this.lightLamps.instanceColor.needsUpdate = true;
  }
  // phase: 0-8 NS green, 8-10 NS yellow, 10-18 EW green, 18-20 EW yellow
  lightState(node, axis, t) {
    if (!node.light) return 'g'; const p = (t + node.light.offset) % 20;
    if (axis === 'ns') return p < 8 ? 'g' : p < 10 ? 'y' : 'r'; return p < 10 ? 'r' : p < 18 ? 'g' : 'y';
  }
  updateTrafficLights(t) {
    const c = new THREE.Color(); let dirty = false;
    for (const rec of this.lightNodes) {
      const s = this.lightState(rec.node, 'ns', t) + this.lightState(rec.node, 'ew', t); if (s === rec.state) continue; rec.state = s; dirty = true;
      for (const h of rec.heads) { const st = h.axis === 'ns' ? s[0] : s[1]; this.lightLamps.setColorAt(h.base, c.set(st === 'r' ? 0xff2a2a : 0x2a0a0a).multiplyScalar(st === 'r' ? 2.2 : 1)); this.lightLamps.setColorAt(h.base + 1, c.set(st === 'y' ? 0xffc21a : 0x2a1f05).multiplyScalar(st === 'y' ? 2.2 : 1)); this.lightLamps.setColorAt(h.base + 2, c.set(st === 'g' ? 0x2aff5a : 0x062a10).multiplyScalar(st === 'g' ? 2.2 : 1)); }
    }
    if (dirty) this.lightLamps.instanceColor.needsUpdate = true;
  }

  // ---------------- beach, pier, ocean ----------------
  buildBeach() {
    const g = new GeoBuilder(); g.plane(CITY.beachX - 1, CITY.minZ - 300, CITY.oceanX + 8, CITY.maxZ + 300, 0.02, 8);
    const sand = new THREE.Mesh(g.build(), this.mats.sand); sand.receiveShadow = true; this.scene.add(sand);
    // ocean shader
    this.oceanMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, skyColor: { value: new THREE.Color(0x7fc4e8) }, deep: { value: new THREE.Color(0x0b3d63) }, shallow: { value: new THREE.Color(0x2fa8c9) }, night: { value: 0 }, fogColor: { value: new THREE.Color(0x000000) }, fogNear: { value: 100 }, fogFar: { value: 800 } },
      vertexShader: `uniform float time; varying vec3 vPos; varying vec3 vNorm; varying float vFog;
        void main(){ vec3 p=position; float w=sin(p.x*0.08+time*1.3)*0.25+sin(p.z*0.11-time*0.9)*0.2+sin((p.x+p.z)*0.05+time*0.6)*0.3; p.y+=w;
        float dx=cos(p.x*0.08+time*1.3)*0.02+cos((p.x+p.z)*0.05+time*0.6)*0.015; float dz=-cos(p.z*0.11-time*0.9)*0.022+cos((p.x+p.z)*0.05+time*0.6)*0.015;
        vNorm=normalize(vec3(-dx,1.0,-dz)); vPos=p; vec4 mv=modelViewMatrix*vec4(p,1.0); vFog=-mv.z; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 sunDir,skyColor,deep,shallow,fogColor; uniform float night,fogNear,fogFar,time; varying vec3 vPos; varying vec3 vNorm; varying float vFog;
        void main(){ vec3 V=normalize(cameraPosition-vPos); float fres=pow(1.0-max(dot(V,vNorm),0.0),3.0); float shore=smoothstep(0.0,60.0,vPos.x-${CITY.oceanX.toFixed(1)});
        vec3 col=mix(shallow,deep,shore); col=mix(col,skyColor,fres*0.7); vec3 H=normalize(V+sunDir); float spec=pow(max(dot(H,vNorm),0.0),180.0)*(1.0-night)*1.6; col+=vec3(spec);
        float foam=smoothstep(0.85,1.0,sin(vPos.x*0.5-time*1.5+sin(vPos.z*0.2)*2.0))*(1.0-shore)*0.35; col+=vec3(foam); col*=mix(1.0,0.28,night);
        float f=smoothstep(fogNear,fogFar,vFog); col=mix(col,fogColor,f); gl_FragColor=vec4(col,1.0); }`,
    });
    const geo = new THREE.PlaneGeometry(1200, 1800, 120, 120); geo.rotateX(-Math.PI / 2);
    const ocean = new THREE.Mesh(geo, this.oceanMat); ocean.position.set(CITY.oceanX + 600, -0.35, 0); this.scene.add(ocean); this.ocean = ocean;
    // pier
    const pz = -200, px0 = CITY.oceanX - 10, px1 = CITY.oceanX + 90; const pb = new GeoBuilder(); pb.box(px0, 0.6, pz - 4.5, px1, 1.0, pz + 4.5, { uvU: 3, uvV: 3 });
    for (let x = px0 + 4; x < px1; x += 8) for (const zz of [pz - 3.6, pz + 3.6]) pb.box(x - 0.25, -1, zz - 0.25, x + 0.25, 0.7, zz + 0.25, { uvU: 1, uvV: 1 });
    for (let x = px0; x < px1; x += 2.5) for (const zz of [pz - 4.5, pz + 4.5]) pb.box(x, 1.0, zz - 0.08, x + 0.12, 2.0, zz + 0.08, { uvU: 1, uvV: 1 });
    const pier = new THREE.Mesh(pb.build(), this.mats.plank); pier.castShadow = true; pier.receiveShadow = true; this.scene.add(pier);
    const hut = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 5), new THREE.MeshStandardMaterial({ color: 0xd94f4f, roughness: 0.8 })); hut.position.set(px1 - 5, 2.6, pz); hut.castShadow = true; this.scene.add(hut);
    this.grid.add({ x0: px1 - 8, x1: px1 - 2, z0: pz - 2.5, z1: pz + 2.5, y0: 0, y1: 5, type: 'building' });
    this.grid.add({ x0: px0, x1: px1, z0: pz - 4.7, z1: pz - 4.4, y0: 0, y1: 3, type: 'pole' }); this.grid.add({ x0: px0, x1: px1, z0: pz + 4.4, z1: pz + 4.7, y0: 0, y1: 3, type: 'pole' });
    // pier ramp so cars can drive on
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 9), this.mats.plank); ramp.position.set(px0 - 2.5, 0.55, pz); ramp.rotation.z = 0.2; this.scene.add(ramp);
    this.pier = { x0: px0, x1: px1, z: pz, y: 1.0 };
    this.pois.docks = { id: 'docks', x: px1 - 14, z: pz, color: '#ffd34e', label: 'docks', noMarker: true, y: 1.0 };
    this.pois.fixer = { id: 'fixer', x: px1 - 10, z: pz + 3.2, color: '#e0e0e0', label: 'fixer', type: 'giver', mission: 'fixer', y: 1.0 };
    // beach club at z=0
    const cb = new GeoBuilder(); const cx0 = CITY.beachX + 6, cx1 = CITY.beachX + 30, cz0 = -14, cz1 = 14;
    const fb = new GeoBuilder(); fb.box(cx0, 0, cz0, cx1, 7, cz1, { uvU: 8, uvV: 14, top: false }); cb.box(cx0, 6.99, cz0, cx1, 7.3, cz1, { uvU: 4, uvV: 4 });
    const style = FACADES[2], tex = facadeTextures(style), corm = facadeORM(style); const mat = new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, normalMap: facadeNormal(style), normalScale: new THREE.Vector2(0.85, 0.85), roughnessMap: corm, metalnessMap: corm, roughness: 1, metalness: 1 }); mat.userData.glow = tex.glow; this.facadeMats.push(mat);
    const club = new THREE.Mesh(fb.build(), mat); club.castShadow = true; club.receiveShadow = true; this.scene.add(club); this.scene.add(new THREE.Mesh(cb.build(), this.mats.roof));
    this.grid.add({ x0: cx0, x1: cx1, z0: cz0, z1: cz1, y0: 0, y1: 7, type: 'building' });
    this.addSignX(cx0, cz0, cz1, 'BEACH CLUB', '#ff4fa3', 'west', 7);
    this.pois.club = { id: 'club', x: cx0 - 4, z: 0, color: '#ffd34e', label: 'beachClub', mission: 'lior' };
    // lifeguard towers
    for (const z of [-120, 90, 220]) { const t = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 3), new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })); t.position.set(CITY.oceanX - 12, 3.8, z); t.castShadow = true; this.scene.add(t); for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), this.mats.dark); l.position.set(CITY.oceanX - 12 + dx, 1.3, z + dz); this.scene.add(l); } this.grid.add({ x0: CITY.oceanX - 13.5, x1: CITY.oceanX - 10.5, z0: z - 1.5, z1: z + 1.5, y0: 0, y1: 5, type: 'building' }); }
  }
  buildOutskirts() {
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x3c5a3a, roughness: 1 }); const geo = new THREE.SphereGeometry(1, 16, 12);
    const spots = []; for (let i = 0; i < 14; i++) spots.push({ x: CITY.minX - 260 - Math.random() * 300, z: CITY.minZ - 200 + Math.random() * (CITY.maxZ - CITY.minZ + 400) });
    for (let i = 0; i < 8; i++) { spots.push({ x: CITY.minX + Math.random() * (CITY.maxX - CITY.minX), z: CITY.minZ - 260 - Math.random() * 250 }); spots.push({ x: CITY.minX + Math.random() * (CITY.maxX - CITY.minX), z: CITY.maxZ + 260 + Math.random() * 250 }); }
    const hills = new THREE.InstancedMesh(geo, hillMat, spots.length); const m = new THREE.Matrix4();
    spots.forEach((s, i) => { const r = 120 + Math.random() * 200, h = 40 + Math.random() * 90; m.compose(new THREE.Vector3(s.x, -h * 0.5, s.z), new THREE.Quaternion(), new THREE.Vector3(r, h, r * (0.6 + Math.random() * 0.6))); hills.setMatrixAt(i, m); });
    this.scene.add(hills);
  }

  // ---------------- minimap image ----------------
  buildMapImage() {
    const pad = 40; this.mapX0 = CITY.minX - pad; this.mapZ0 = CITY.minZ - pad; this.mapScale = 1.25; // px per metre
    const W = Math.ceil((CITY.oceanX + 120 - this.mapX0) * this.mapScale), H = Math.ceil((CITY.maxZ + pad - this.mapZ0) * this.mapScale);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'); const S = this.mapScale, X = x => (x - this.mapX0) * S, Z = z => (z - this.mapZ0) * S;
    ctx.fillStyle = '#8fae7a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6d3a3'; ctx.fillRect(X(CITY.beachX), 0, W, H); ctx.fillStyle = '#2f7fb8'; ctx.fillRect(X(CITY.oceanX), 0, W, H);
    ctx.fillStyle = '#c9c4bb'; ctx.fillRect(X(CITY.minX), Z(CITY.minZ), (CITY.maxX - CITY.minX) * S, (CITY.maxZ - CITY.minZ) * S);
    for (let bj = 0; bj < gridZ; bj++) for (let bi = 0; bi < gridX; bi++) { const x0 = CITY.roadX(bi) + HALF, z0 = CITY.roadZ(bj) + HALF; const park = PARKS.some(p => p[0] === bi && p[1] === bj); ctx.fillStyle = park ? '#6fb35e' : '#a49f96'; ctx.fillRect(X(x0), Z(z0), CITY.block * S, CITY.block * S); }
    ctx.fillStyle = '#7d7871'; for (const b of this.buildings) ctx.fillRect(X(b.x0), Z(b.z0), (b.x1 - b.x0) * S, (b.z1 - b.z0) * S);
    ctx.fillStyle = '#a07a52'; ctx.fillRect(X(this.pier.x0), Z(this.pier.z - 4.5), (this.pier.x1 - this.pier.x0) * S, 9 * S);
    ctx.fillStyle = '#b8d9c9'; ctx.fillRect(X(CITY.beachX + 6), Z(-14), 24 * S, 28 * S);
    this.mapCanvas = c;
  }
  mapPx(x, z) { return [(x - this.mapX0) * this.mapScale, (z - this.mapZ0) * this.mapScale]; }

  // ---------------- per-frame ----------------
  setNight(f, sunDir, skyColor, fogColor, fogNear, fogFar, sunColor, rain = 0) {
    for (const m of this.facadeMats) m.emissiveIntensity = f * (m.userData.glow ?? 0.5) * 1.15;
    for (const m of this.storeMats) m.emissiveIntensity = f * 1.05;
    if (this.cloudMats) for (const c of this.cloudMats) { c.mat.color.copy(sunColor || skyColor).lerp(new THREE.Color(0x2a3350), f * 0.9).lerp(new THREE.Color(0x6a7280), rain * 0.6); c.mat.opacity = c.baseOp * (1 - f * 0.35) * (1 + rain * 0.3); }
    this.mats.asphalt.roughness = 0.92 - rain * 0.68; this.mats.asphalt.metalness = 0.02 + rain * 0.5; this.mats.asphalt.normalScale.setScalar(0.7 - rain * 0.45); this.mats.sidewalk.roughness = 0.95 - rain * 0.5; this.mats.sidewalk.metalness = rain * 0.3; this.mats.asphalt.envMapIntensity = 1 + rain * 1.4;
    this.lampHeads.material.color.setHex(0x9a9fa8).lerp(new THREE.Color(0xffe2b0), f).multiplyScalar(1 + f * 1.0);
    for (const sg of this.signs) sg.material.color.setScalar(1.0 + f * 0.75);
    this.oceanMat.uniforms.night.value = f; this.oceanMat.uniforms.sunDir.value.copy(sunDir); this.oceanMat.uniforms.skyColor.value.copy(skyColor); this.oceanMat.uniforms.fogColor.value.copy(fogColor); this.oceanMat.uniforms.fogNear.value = fogNear; this.oceanMat.uniforms.fogFar.value = fogFar;
  }
  update(dt, t) { this.oceanMat.uniforms.time.value = t; this.updateTrafficLights(t); if (this.cloudMats) for (const c of this.cloudMats) c.mat.map.offset.x += c.speed * dt; if (this.towerLightMesh) this.towerLightMesh.material.color.setHex(Math.floor(t * 1.4) % 2 ? 0xff2020 : 0x3a0808).multiplyScalar(Math.floor(t * 1.4) % 2 ? 2.4 : 1); if (this.boats) for (const b of this.boats) { b.position.y = -0.1 + Math.sin(t * 0.9 + b.position.x) * 0.15; b.rotation.z = Math.sin(t * 0.7 + b.position.z) * 0.04; } }
}
