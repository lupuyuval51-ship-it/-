import * as THREE from '../vendor/three.module.min.js';

// HDR render target → bloom (two blurred levels) → composite with ACES tone mapping, grade, vignette and grain.
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
export class Post {
  constructor(renderer, quality) {
    this.renderer = renderer; this.quality = quality; this.enabled = quality !== 'low'; this.w = 1; this.h = 1;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); this.scene = new THREE.Scene(); this.scene.add(this.quad);
    this.threshold = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, threshold: { value: 1.0 }, soft: { value: 0.6 } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float threshold, soft; varying vec2 vUv; void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(threshold - soft, threshold + soft, l); gl_FragColor = vec4(c * k, 1.0); }` });
    this.blur = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2(1, 0) } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb * 0.2270270270; c += (texture2D(tDiffuse, vUv + dir * 1.3846153846).rgb + texture2D(tDiffuse, vUv - dir * 1.3846153846).rgb) * 0.3162162162; c += (texture2D(tDiffuse, vUv + dir * 3.2307692308).rgb + texture2D(tDiffuse, vUv - dir * 3.2307692308).rgb) * 0.0702702703; gl_FragColor = vec4(c, 1.0); }` });
    this.composite = new THREE.ShaderMaterial({ uniforms: { tScene: { value: null }, tBloom1: { value: null }, tBloom2: { value: null }, strength: { value: 0.9 }, exposure: { value: 1.0 }, night: { value: 0 }, rain: { value: 0 }, time: { value: 0 }, hurt: { value: 0 }, gray: { value: 0 } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tScene, tBloom1, tBloom2; uniform float strength, exposure, night, rain, time, hurt, gray; varying vec2 vUv;
        vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(vec3(0.0031308), c)); }
        void main(){ vec3 col = texture2D(tScene, vUv).rgb; vec3 bloom = texture2D(tBloom1, vUv).rgb * 0.65 + texture2D(tBloom2, vUv).rgb * 0.55; col += bloom * strength;
          col *= exposure; col = aces(col);
          col = mix(col, col * vec3(0.93, 1.0, 1.10), night * 0.4); col = mix(col, col * vec3(0.9, 0.96, 1.0), rain * 0.3);
          float lum = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(col, vec3(lum) * 0.8, gray);
          float vig = smoothstep(1.25, 0.3, length((vUv - 0.5) * vec2(1.25, 1.0))); col *= mix(0.68, 1.0, vig);
          col = mix(col, vec3(0.55, 0.02, 0.02), hurt * (1.0 - vig) * 0.9);
          float g = fract(sin(dot(vUv * vec2(1237.0, 917.0) + fract(time), vec2(12.9898, 78.233))) * 43758.5453); col += (g - 0.5) * 0.028;
          gl_FragColor = vec4(toSRGB(col), 1.0); }` });
    this.targets = []; this.setSize(renderer.domElement.width, renderer.domElement.height);
  }
  setSize(w, h) {
    if (!this.enabled) return; if (w === this.w && h === this.h && this.rt) return; this.w = w; this.h = h; for (const t of this.targets) t.dispose(); this.targets = [];
    const mk = (sw, sh, o = {}) => { const t = new THREE.WebGLRenderTarget(Math.max(1, sw | 0), Math.max(1, sh | 0), { type: THREE.HalfFloatType, depthBuffer: !!o.depth, samples: o.samples || 0, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); this.targets.push(t); return t; };
    this.rt = mk(w, h, { depth: true, samples: this.quality === 'high' ? 4 : 0 });
    this.bright = mk(w / 2, h / 2); this.a1 = mk(w / 4, h / 4); this.b1 = mk(w / 4, h / 4); this.a2 = mk(w / 8, h / 8); this.b2 = mk(w / 8, h / 8);
  }
  pass(mat, tex, target, dir) { mat.uniforms.tDiffuse.value = tex; if (dir) mat.uniforms.dir.value.set(dir[0] / target.width, dir[1] / target.height); this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.scene, this.cam); }
  render(scene, camera, u = {}) {
    const R = this.renderer;
    if (!this.enabled) { R.setRenderTarget(null); R.render(scene, camera); return; }
    R.setRenderTarget(this.rt); R.render(scene, camera);
    this.pass(this.threshold, this.rt.texture, this.bright);
    this.pass(this.blur, this.bright.texture, this.a1, [1, 0]); this.pass(this.blur, this.a1.texture, this.b1, [0, 1]);
    this.pass(this.blur, this.b1.texture, this.a2, [1, 0]); this.pass(this.blur, this.a2.texture, this.b2, [0, 1]);
    const c = this.composite.uniforms; c.tScene.value = this.rt.texture; c.tBloom1.value = this.b1.texture; c.tBloom2.value = this.b2.texture; c.night.value = u.night || 0; c.rain.value = u.rain || 0; c.time.value = u.time || 0; c.hurt.value = u.hurt || 0; c.gray.value = u.gray || 0; c.exposure.value = u.exposure || 1; c.strength.value = u.strength ?? 0.9;
    this.quad.material = this.composite; R.setRenderTarget(null); R.render(this.scene, this.cam);
  }
}
