import * as THREE from '../vendor/three.module.min.js';

// Skid marks: a ring buffer of ground quads written when tyres slip.
export class SkidMarks {
  constructor(scene, max = 700) {
    this.max = max; this.n = 0; this.pos = new Float32Array(max * 18); this.alpha = new Float32Array(max * 6);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage)); g.setDrawRange(0, 0);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, vertexShader: `attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: `varying float vA; void main(){ gl_FragColor = vec4(0.06, 0.06, 0.07, vA); }` });
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; scene.add(this.mesh); this.last = new Map();
  }
  // call per wheel per frame while slipping. id: unique wheel key
  mark(id, x, z, y, strength) {
    const prev = this.last.get(id); this.last.set(id, { x, z, y });
    if (!prev || Math.hypot(prev.x - x, prev.z - z) > 3 || Math.abs(prev.y - y) > 0.5) return;
    let dx = x - prev.x, dz = z - prev.z; const l = Math.hypot(dx, dz); if (l < 0.05) return; dx /= l; dz /= l; const rx = -dz * 0.13, rz = dx * 0.13; const yy = y + 0.02;
    const i = this.n % this.max; const o = i * 18; const p = this.pos; const a = Math.min(0.75, strength);
    const quad = [[prev.x - rx, yy, prev.z - rz], [x - rx, yy, z - rz], [x + rx, yy, z + rz], [prev.x - rx, yy, prev.z - rz], [x + rx, yy, z + rz], [prev.x + rx, yy, prev.z + rz]];
    for (let k = 0; k < 6; k++) { p[o + k * 3] = quad[k][0]; p[o + k * 3 + 1] = quad[k][1]; p[o + k * 3 + 2] = quad[k][2]; this.alpha[i * 6 + k] = a; }
    this.n++; const g = this.mesh.geometry; g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.setDrawRange(0, Math.min(this.n, this.max) * 6);
  }
  forget(id) { this.last.delete(id); }
}
