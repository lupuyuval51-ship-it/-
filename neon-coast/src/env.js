import * as THREE from '../vendor/three.module.min.js';

// Procedural sky cubemap → PMREM environment so paint, glass and wet asphalt reflect the sky.
export class EnvMap {
  constructor(renderer, scene) { this.renderer = renderer; this.scene = scene; this.pmrem = new THREE.PMREMGenerator(renderer); this.pmrem.compileCubemapShader(); this.key = ''; this.rt = null; this.canvases = []; for (let i = 0; i < 6; i++) { const c = document.createElement('canvas'); c.width = c.height = 32; this.canvases.push(c); } }
  update(top, horizon, sunColor, sunDir, night) {
    const key = [top.getHex(), horizon.getHex(), Math.round(night * 20), Math.round(sunDir.y * 10)].join(','); if (key === this.key) return; this.key = key;
    const S = 32; const t = '#' + top.getHexString(), h = '#' + horizon.getHexString(); const ground = new THREE.Color(0x2a2620).lerp(new THREE.Color(0x0b0d16), night);
    const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
    faces.forEach((f, i) => {
      const ctx = this.canvases[i].getContext('2d');
      if (f === 'py') { ctx.fillStyle = t; ctx.fillRect(0, 0, S, S); }
      else if (f === 'ny') { ctx.fillStyle = '#' + ground.getHexString(); ctx.fillRect(0, 0, S, S); }
      else { const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, t); g.addColorStop(0.5, h); g.addColorStop(0.52, '#' + ground.clone().lerp(horizon, 0.3).getHexString()); g.addColorStop(1, '#' + ground.getHexString()); ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // sun highlight on the face it points to
        const dir = { px: [1, 0, 0], nx: [-1, 0, 0], pz: [0, 0, 1], nz: [0, 0, -1] }[f]; const d = dir[0] * sunDir.x + dir[2] * sunDir.z;
        if (d > 0.3 && sunDir.y > -0.05) { const u = f === 'px' ? (0.5 - sunDir.z * 0.5) : f === 'nx' ? (0.5 + sunDir.z * 0.5) : f === 'pz' ? (0.5 + sunDir.x * 0.5) : (0.5 - sunDir.x * 0.5); const v = 0.5 - sunDir.y * 0.5; const r = ctx.createRadialGradient(u * S, v * S, 0, u * S, v * S, S * 0.35); r.addColorStop(0, '#' + sunColor.getHexString()); r.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.9 * d; ctx.fillStyle = r; ctx.fillRect(0, 0, S, S); ctx.globalAlpha = 1; }
      }
    });
    const cube = new THREE.CubeTexture(this.canvases); cube.colorSpace = THREE.SRGBColorSpace; cube.needsUpdate = true;
    const rt = this.pmrem.fromCubemap(cube); if (this.rt) this.rt.dispose(); this.rt = rt; this.scene.environment = rt.texture; this.scene.environmentIntensity = 1 - night * 0.45; cube.dispose();
  }
}
