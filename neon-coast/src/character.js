import * as THREE from '../vendor/three.module.min.js';
import { mergeGeometries, xform, M4 } from './utils.js';

// One shared material for every character; colours live in the vertices so a whole ped is 7 draw calls.
const charMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.02 });
const gunMat = new THREE.MeshStandardMaterial({ color: 0x202228, roughness: 0.4, metalness: 0.5 });
const C = hex => new THREE.Color(hex);
const part = (w, h, d, hex, x = 0, y = 0, z = 0) => xform(new THREE.BoxGeometry(w, h, d), M4(x, y, z), C(hex));
const mesh = geos => { const m = new THREE.Mesh(mergeGeometries(geos), charMat); m.castShadow = true; return m; };

export const SKINS = [0xf1c7a8, 0xd9a47e, 0xb97c55, 0x8a5a3c, 0x5c3a25, 0xffd9b8];
export const SHIRTS = [0xffffff, 0x1c2540, 0xd1345b, 0x2aa198, 0xf5c542, 0x7b4fbf, 0x2f2f2f, 0xff7f50, 0x8fd18b, 0xe8e0d0, 0xff4fa3, 0x3ce8f5];
export const PANTS = [0x22304a, 0x1a1a1a, 0x7a6a55, 0x3a3f4a, 0x50607a, 0xc9c1b1, 0x5a3a2a];
export const HAIRS = [0x1a120e, 0x3b2716, 0x6b4a2b, 0xd9b27a, 0x2b2b2b, 0xa33a2a, 0xffffff];

export function randomLook() {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  return { skin: pick(SKINS), shirt: pick(SHIRTS), pants: pick(PANTS), hair: pick(HAIRS), hat: Math.random() < 0.15 ? pick(SHIRTS) : null, shorts: Math.random() < 0.3 };
}
export const LOOKS = {
  player: { skin: 0xd9a47e, shirt: 0xff4fa3, pants: 0x1c2540, hair: 0x1a120e, jacket: 0x14161c },
  cop: { skin: 0xd9a47e, shirt: 0x1f3a7a, pants: 0x14213d, hair: 0x2b2b2b, hat: 0x14213d, badge: true },
  swat: { skin: 0xb97c55, shirt: 0x1a1d24, pants: 0x1a1d24, hair: 0x111111, hat: 0x0e0f12, armor: 0x2a2e38 },
  gang: { skin: 0x8a5a3c, shirt: 0x2e8b57, pants: 0x1a1a1a, hair: 0x1a120e, band: 0x2eff7a },
};

// Character faces local +z. Pivot at the feet.
export function makeCharacter(look) {
  const g = new THREE.Group(); const top = look.armor || look.shirt;
  const legLen = look.shorts ? 0.45 : 0.86;
  const legGeo = side => { const parts = [part(0.2, legLen, 0.22, look.pants, 0, -legLen / 2, 0), part(0.22, 0.1, 0.32, 0x1a1a1a, 0, -0.86, 0.05)]; if (look.shorts) parts.push(part(0.19, 0.42, 0.21, look.skin, 0, -0.66, 0)); return parts; };
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(0.12, 0.86, 0); legR.position.set(-0.12, 0.86, 0); legL.add(mesh(legGeo(1))); legR.add(mesh(legGeo(-1)));
  const torsoParts = [part(0.5, 0.6, 0.28, top, 0, 0.3, 0)];
  if (look.jacket) { torsoParts.push(part(0.54, 0.5, 0.31, look.jacket, 0, 0.27, 0)); torsoParts.push(part(0.2, 0.5, 0.33, look.shirt, 0, 0.27, 0)); }
  if (look.badge) torsoParts.push(part(0.08, 0.08, 0.02, 0xffd34e, 0.15, 0.42, 0.15));
  const torso = new THREE.Group(); torso.position.y = 0.86; torso.add(mesh(torsoParts));
  const headParts = [part(0.26, 0.28, 0.26, look.skin, 0, 0.14, 0), part(0.28, 0.1, 0.28, look.hair, 0, 0.29, -0.01), part(0.28, 0.2, 0.08, look.hair, 0, 0.16, -0.12)];
  if (look.hat) { headParts.push(part(0.3, 0.12, 0.3, look.hat, 0, 0.33, 0)); headParts.push(part(0.3, 0.03, 0.14, look.hat, 0, 0.28, 0.2)); }
  if (look.band) headParts.push(part(0.28, 0.06, 0.28, look.band, 0, 0.27, 0));
  const head = new THREE.Group(); head.position.set(0, 0.62, 0); head.add(mesh(headParts)); torso.add(head);
  const armGeo = () => [part(0.15, 0.32, 0.15, top, 0, -0.16, 0), part(0.14, 0.34, 0.14, look.skin, 0, -0.48, 0)];
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(0.33, 0.55, 0); armR.position.set(-0.33, 0.55, 0); armL.add(mesh(armGeo())); armR.add(mesh(armGeo()));
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.42), gunMat); gun.position.set(0, -0.66, 0.16); gun.visible = false; gun.castShadow = true; armR.add(gun);
  torso.add(armL); torso.add(armR); g.add(legL); g.add(legR); g.add(torso);
  const parts = { legL, legR, torso, head, armL, armR, gun };
  const ch = { group: g, parts, look, phase: 0,
    setGun(v, long) { gun.visible = v; gun.scale.z = long ? 1.6 : 1; },
    animate(dt, state) {
      const p = parts;
      if (state.dead) { g.rotation.z = Math.PI / 2 * (state.deadDir || 1); g.rotation.x = 0; g.position.y = 0.16; for (const a of [p.armL, p.armR]) a.rotation.set(0.4, 0, 0); p.legL.rotation.set(0, 0, 0); p.legR.rotation.set(0.15, 0, 0); return; }
      g.rotation.z = 0;
      if (state.sitting) { p.legL.rotation.x = p.legR.rotation.x = -1.4; p.armL.rotation.x = p.armR.rotation.x = -1.0; p.torso.rotation.x = 0; return; }
      const sp = state.speed || 0; const rate = 6 + sp * 8; this.phase += dt * rate * (state.moving ? 1 : 0);
      const amp = state.moving ? 0.45 + sp * 0.5 : 0; const s = Math.sin(this.phase);
      p.legL.rotation.x = s * amp; p.legR.rotation.x = -s * amp;
      p.torso.rotation.x = state.moving ? 0.08 + sp * 0.18 : 0; p.torso.position.y = 0.86 + (state.moving ? Math.abs(Math.cos(this.phase)) * 0.045 * (0.5 + sp) : Math.sin(performance.now() * 0.002) * 0.01);
      if (state.aiming) { p.armR.rotation.x = -Math.PI / 2 - (state.pitch || 0); p.armR.rotation.z = 0.1; p.armL.rotation.x = state.long ? -Math.PI / 2 - (state.pitch || 0) + 0.15 : -s * amp * 0.5; p.armL.rotation.z = state.long ? -0.55 : 0; }
      else if (state.punch) { p.armR.rotation.x = -1.4 + Math.sin(state.punch * Math.PI) * -0.8; p.armR.rotation.z = 0; p.armL.rotation.x = -0.6; p.armL.rotation.z = 0; }
      else { p.armR.rotation.x = -s * amp * 0.8; p.armL.rotation.x = s * amp * 0.8; p.armR.rotation.z = 0.08; p.armL.rotation.z = -0.08; }
      p.head.rotation.x = state.aiming ? (state.pitch || 0) * 0.5 : 0;
    } };
  return ch;
}
