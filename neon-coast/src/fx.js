import * as THREE from '../vendor/three.module.min.js';
import { particleTex } from './textures.js';

class ParticlePool {
  constructor(scene, max, additive) {
    this.max = max; this.n = 0; this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.maxLife = new Float32Array(max); this.grow = new Float32Array(max); this.grav = new Float32Array(max); this.drag = new Float32Array(max); this.a0 = new Float32Array(max); this.shape = new Float32Array(max); // shape 1 = flat ring (rain splash), 0 = soft blob
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('shape', new THREE.BufferAttribute(this.shape, 1).setUsage(THREE.DynamicDrawUsage));
    // `ambient` (non-additive pool only) multiplies the particle colour, so smoke and dust are not lit at night: see setAmbient. (1,1,1) = unchanged.
    this.mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { map: { value: particleTex() }, fogColor: { value: new THREE.Color() }, fogNear: { value: 100 }, fogFar: { value: 800 }, ambient: { value: new THREE.Vector3(1, 1, 1) } },
      vertexShader: `attribute float psize; attribute float alpha; attribute float shape; attribute vec3 color; varying vec3 vC; varying float vA; varying float vF; varying float vS; varying float vSq; uniform float fogNear,fogFar;
        void main(){ vC=color; vA=alpha; vS=shape; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=min(psize*(420.0/max(1.0,-mv.z)), 110.0); vF=smoothstep(fogNear,fogFar,-mv.z);
          vSq=clamp(abs(cameraPosition.y-position.y)/max(distance(cameraPosition,position),0.01),0.22,1.0); gl_Position=projectionMatrix*mv; }`, // vSq: how flat a ground ring looks from here (sine of the viewing elevation)
      fragmentShader: `uniform sampler2D map; uniform vec3 fogColor; uniform vec3 ambient; varying vec3 vC; varying float vA; varying float vF; varying float vS; varying float vSq;
        void main(){ float a=texture2D(map,gl_PointCoord).a;
          if(vS>0.5){ vec2 q=(gl_PointCoord-0.5)*2.0; q.y/=vSq; float r=length(q); a=smoothstep(0.5,0.72,r)*(1.0-smoothstep(0.84,1.0,r)); } // thin ring, squashed into the ground plane
          gl_FragColor=vec4(mix(${additive ? 'vC' : 'vC*ambient'},${additive ? 'vec3(0.0)' : 'fogColor'},vF*0.8),a*vA*(1.0-vF*${additive ? '1.0' : '0.5'})); }` });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; scene.add(this.points); g.setDrawRange(0, 0);
  }
  emit(x, y, z, vx, vy, vz, life, size, r, g, b, alpha, opts = {}) {
    let i; if (this.n < this.max) i = this.n++; else i = Math.floor(Math.random() * this.max);
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = this.maxLife[i] = life; this.size[i] = size; this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b; this.alpha[i] = this.a0[i] = alpha; this.grow[i] = opts.grow || 0; this.grav[i] = opts.grav ?? 0; this.drag[i] = opts.drag ?? 0; this.shape[i] = opts.ring ? 1 : 0;
  }
  // multiplier on the particle colour: color (THREE.Color or {x,y,z}) times intensity. Only the normal-blended pool reads it.
  setAmbient(color, intensity = 1) { this.mat.uniforms.ambient.value.set((color.r ?? color.x ?? 1) * intensity, (color.g ?? color.y ?? 1) * intensity, (color.b ?? color.z ?? 1) * intensity); }
  update(dt) {
    const n = this.n; let w = 0;
    for (let i = 0; i < n; i++) {
      const l = this.life[i] - dt; if (l <= 0) continue;
      if (w !== i) { for (let k = 0; k < 3; k++) { this.pos[w * 3 + k] = this.pos[i * 3 + k]; this.vel[w * 3 + k] = this.vel[i * 3 + k]; this.col[w * 3 + k] = this.col[i * 3 + k]; } this.maxLife[w] = this.maxLife[i]; this.size[w] = this.size[i]; this.a0[w] = this.a0[i]; this.grow[w] = this.grow[i]; this.grav[w] = this.grav[i]; this.drag[w] = this.drag[i]; this.shape[w] = this.shape[i]; }
      this.life[w] = l; const d = 1 - this.drag[w] * dt; this.vel[w * 3] *= d; this.vel[w * 3 + 2] *= d; this.vel[w * 3 + 1] = this.vel[w * 3 + 1] * d - this.grav[w] * dt;
      this.pos[w * 3] += this.vel[w * 3] * dt; this.pos[w * 3 + 1] += this.vel[w * 3 + 1] * dt; this.pos[w * 3 + 2] += this.vel[w * 3 + 2] * dt; if (this.pos[w * 3 + 1] < 0.05 && this.grav[w] > 0) { this.pos[w * 3 + 1] = 0.05; this.vel[w * 3 + 1] = 0; }
      this.size[w] += this.grow[w] * dt; const f = l / this.maxLife[w]; this.alpha[w] = this.a0[w] * (f < 0.5 ? f * 2 : 1);
      w++;
    }
    this.n = w; const g = this.geo; g.attributes.position.needsUpdate = g.attributes.color.needsUpdate = g.attributes.psize.needsUpdate = g.attributes.alpha.needsUpdate = g.attributes.shape.needsUpdate = true; g.setDrawRange(0, w);
  }
}

export class Effects {
  constructor(scene) {
    this.scene = scene; this.add = new ParticlePool(scene, 1800, true); this.norm = new ParticlePool(scene, 1800, false);
    // One shared light for muzzle flashes and explosions (an explosion has priority). It is never hidden, only dimmed to intensity 0,
    // so the number of lights in every lit shader stays constant and no program is recompiled when a shot is fired.
    this.fxLight = new THREE.PointLight(0xffc070, 0, 40, 2); scene.add(this.fxLight); this.flashT = 0; this.boomT = 0;
    const tp = new Float32Array(64 * 6); this.tracerPos = tp; const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3).setUsage(THREE.DynamicDrawUsage)); this.tracerLife = new Float32Array(64);
    this.tracers = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.85 })); this.tracers.frustumCulled = false; scene.add(this.tracers); tg.setDrawRange(0, 0);
    this.fires = []; this.marks = [];
  }
  // Ambient light on smoke, dust, blood and splashes (the additive fire/spark pool and the muzzle flash stay unlit): multiplier = color * intensity.
  setAmbient(color, intensity = 1) { this.norm.setAmbient(color, intensity); }
  setFog(color, near, far) { for (const p of [this.add, this.norm]) { p.mat.uniforms.fogColor.value.copy(color); p.mat.uniforms.fogNear.value = near; p.mat.uniforms.fogFar.value = far; } }
  sparks(x, y, z, n = 8, speed = 6) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, e = Math.random() * 2 - 0.5, s = speed * (0.4 + Math.random()); this.add.emit(x, y, z, Math.cos(a) * s, e * s * 0.6 + 2, Math.sin(a) * s, 0.25 + Math.random() * 0.3, 0.5 + Math.random() * 0.5, 1, 0.8, 0.4, 1, { grav: 14, drag: 1 }); } }
  dust(x, y, z, n = 6, r = 0.6, g = 0.55, b = 0.5) { for (let i = 0; i < n; i++) this.norm.emit(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 2, 0.8 + Math.random(), (Math.random() - 0.5) * 2, 0.6 + Math.random() * 0.6, 1.2, r, g, b, 0.45, { grow: 2.5, drag: 2 }); }
  blood(x, y, z, n = 10) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 1 + Math.random() * 3; this.norm.emit(x, y, z, Math.cos(a) * s, Math.random() * 3, Math.sin(a) * s, 0.3 + Math.random() * 0.4, 0.35 + Math.random() * 0.3, 0.55, 0.05, 0.05, 0.9, { grav: 12 }); } }
  splash(x, y, z, amount = 1) { /* no raindrops on a shop floor (interiorAt) */ if (Math.random() > amount * 0.7 || this.scene.userData.interiorAt?.(x, z) != null) return; for (let i = 0; i < 2; i++) this.norm.emit(x + (Math.random() - 0.5) * 0.3, y, z + (Math.random() - 0.5) * 0.3, 0, 0, 0, 0.3, 0.15, 0.72, 0.78, 0.85, 0.35, { grow: 0.83, ring: true }); } // two flat rings that widen from 0.15 to 0.4 m
  spray(x, z, vx, vz, amount = 1) { if (Math.random() > amount * 0.6) return; this.norm.emit(x + (Math.random() - 0.5) * 0.4, 0.1 + Math.random() * 0.15, z + (Math.random() - 0.5) * 0.4, vx + (Math.random() - 0.5) * 1.5, 0.5 + Math.random() * 1.1, vz + (Math.random() - 0.5) * 1.5, 0.32 + Math.random() * 0.22, 0.2, 0.78, 0.82, 0.88, 0.22, { grav: 7, grow: 0.8, drag: 2.0 }); }
  smoke(x, y, z, n = 2, dark = 0.35, size = 1.2) { for (let i = 0; i < n; i++) this.norm.emit(x + (Math.random() - 0.5) * 0.8, y, z + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.2, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 1.2, 1.4 + Math.random() * 1.6, size, dark, dark, dark, 0.5, { grow: 2.2, drag: 0.8 }); }
  fire(x, y, z, n = 3, big = 1) { for (let i = 0; i < n; i++) { const k = Math.random(); this.add.emit(x + (Math.random() - 0.5) * 1.2 * big, y, z + (Math.random() - 0.5) * 1.2 * big, (Math.random() - 0.5), 2 + Math.random() * 2.5, (Math.random() - 0.5), 0.35 + Math.random() * 0.45, (1.2 + Math.random()) * big, 1, 0.35 + k * 0.4, 0.05, 0.8, { grow: -1.2, drag: 1 }); } }
  muzzle(x, y, z, dx, dy, dz) { if (this.boomT <= 0) { const L = this.fxLight; L.position.set(x, y, z); L.color.setHex(0xffc070); L.distance = 40; L.intensity = 60; this.flashT = 0.05; } for (let i = 0; i < 4; i++) this.add.emit(x + dx * 0.3, y + dy * 0.3, z + dz * 0.3, dx * 6 + (Math.random() - 0.5) * 3, dy * 6 + Math.random() * 2, dz * 6 + (Math.random() - 0.5) * 3, 0.08, 0.9, 1, 0.85, 0.5, 1); }
  tracer(x0, y0, z0, x1, y1, z1) { let i = 0; for (; i < 64; i++) if (this.tracerLife[i] <= 0) break; if (i === 64) i = 0; const p = this.tracerPos; p[i * 6] = x0; p[i * 6 + 1] = y0; p[i * 6 + 2] = z0; p[i * 6 + 3] = x1; p[i * 6 + 4] = y1; p[i * 6 + 5] = z1; this.tracerLife[i] = 0.06; }
  explosion(x, y, z) {
    const L = this.fxLight; L.position.set(x, y + 1.5, z); L.color.setHex(0xff8030); L.distance = 90; L.intensity = 900; this.boomT = 0.5; this.flashT = 0;
    for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, e = Math.random() * Math.PI / 2, s = 4 + Math.random() * 11; this.add.emit(x, y + 0.5, z, Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 3, Math.sin(a) * Math.cos(e) * s, 0.6 + Math.random() * 0.9, 2.5 + Math.random() * 3, 1, 0.45 + Math.random() * 0.35, 0.08, 0.9, { drag: 2.2, grow: 2 }); }
    for (let i = 0; i < 50; i++) { const a = Math.random() * 6.28, s = 1 + Math.random() * 5; this.norm.emit(x, y + 1, z, Math.cos(a) * s, 2 + Math.random() * 5, Math.sin(a) * s, 2.5 + Math.random() * 3, 2.5, 0.15, 0.14, 0.13, 0.7, { drag: 1.2, grow: 3 }); }
    this.sparks(x, y + 1, z, 40, 16);
    this.fires.push({ x, y: y + 0.6, z, until: performance.now() + 22000, smokeUntil: performance.now() + 40000 });
  }
  update(dt) {
    this.add.update(dt); this.norm.update(dt);
    if (this.boomT > 0) { this.boomT -= dt; this.fxLight.intensity = this.boomT > 0 ? this.boomT / 0.5 * 900 : 0; }
    else if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.fxLight.intensity = 0; }
    const now = performance.now(); this.fires = this.fires.filter(f => now < f.smokeUntil);
    for (const f of this.fires) { if (now < f.until) { this.fire(f.x, f.y, f.z, 2, 1.4); if (Math.random() < 0.5) this.smoke(f.x, f.y + 1.5, f.z, 1, 0.12, 1.8); } else if (Math.random() < 0.25) this.smoke(f.x, f.y + 1, f.z, 1, 0.2, 1.5); }
    let any = false; for (let i = 0; i < 64; i++) if (this.tracerLife[i] > 0) { this.tracerLife[i] -= dt; if (this.tracerLife[i] <= 0) { const p = this.tracerPos; p[i * 6 + 3] = p[i * 6]; p[i * 6 + 4] = p[i * 6 + 1]; p[i * 6 + 5] = p[i * 6 + 2]; } any = true; }
    this.tracers.geometry.attributes.position.needsUpdate = true; this.tracers.geometry.setDrawRange(0, any ? 128 : 0);
  }
}
