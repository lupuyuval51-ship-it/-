import * as THREE from '../vendor/three.module.min.js';

// Full-screen pipeline: HDR scene → SSAO → bloom → sun shafts → tone map/grade → FXAA.
// Tone mapping lives here only; the renderer must stay on NoToneMapping.
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Copies a grade vector given as THREE.Vector3, [r,g,b] or {x,y,z}; a missing value becomes the neutral `d` on every channel.
function setV3(dst, s, d) {
  if (!s) dst.set(d, d, d); else if (s.isVector3) dst.copy(s); else if (Array.isArray(s)) dst.set(s[0] ?? d, s[1] ?? d, s[2] ?? d); else dst.set(s.x ?? d, s.y ?? d, s.z ?? d);
}

export class Post {
  constructor(renderer, quality) {
    this.renderer = renderer; this.targets = []; this.w = 0; this.h = 0; this._projInv = new THREE.Matrix4();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); this.quad.frustumCulled = false; this.scene.add(this.quad);

    this.threshold = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tDiffuse: { value: null }, threshold: { value: 1.02 }, soft: { value: 0.45 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float threshold, soft; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(threshold - soft, threshold + soft, l); gl_FragColor = vec4(c * k, 1.0); }` });

    this.blur = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2(1, 0) } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb * 0.2270270270; c += (texture2D(tDiffuse, vUv + dir * 1.3846153846).rgb + texture2D(tDiffuse, vUv - dir * 1.3846153846).rgb) * 0.3162162162; c += (texture2D(tDiffuse, vUv + dir * 3.2307692308).rgb + texture2D(tDiffuse, vUv - dir * 3.2307692308).rgb) * 0.0702702703; gl_FragColor = vec4(c, 1.0); }` });

    // Horizon-based ambient occlusion from the depth buffer; normals come from depth derivatives.
    this.ssao = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tDepth: { value: null }, projInv: { value: new THREE.Matrix4() }, proj: { value: new THREE.Matrix4() }, res: { value: new THREE.Vector2() }, radius: { value: 1.4 }, intensity: { value: 1.15 }, bias: { value: 0.035 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDepth; uniform mat4 projInv, proj; uniform vec2 res; uniform float radius, intensity, bias; varying vec2 vUv;
        vec3 viewPos(vec2 uv, float d){ vec4 c = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return c.xyz / c.w; }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          float d = texture2D(tDepth, vUv).x;
          if (d >= 0.99995) { gl_FragColor = vec4(1.0); return; }
          vec3 p = viewPos(vUv, d);
          vec3 n = normalize(cross(dFdx(p), dFdy(p)));
          vec3 t = normalize(cross(n, abs(n.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)));
          vec3 b = cross(n, t);
          float ang = hash(vUv * res) * 6.2831853;
          float occ = 0.0;
          for (int i = 0; i < 12; i++) {
            float fi = float(i);
            float a = ang + fi * 2.3999632;
            float r = radius * sqrt((fi + 0.5) / 12.0);
            vec3 s = p + (t * cos(a) + b * sin(a)) * r + n * radius * 0.25;
            vec4 sp = proj * vec4(s, 1.0); sp.xyz /= sp.w;
            vec2 suv = sp.xy * 0.5 + 0.5;
            if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
            float sd = texture2D(tDepth, suv).x;
            if (sd >= 0.99995) continue;
            float sz = viewPos(suv, sd).z;
            float diff = sz - s.z;
            if (diff > bias) occ += smoothstep(0.0, 1.0, radius / max(0.0001, abs(p.z - sz)));
          }
          gl_FragColor = vec4(vec3(clamp(1.0 - occ / 12.0 * intensity, 0.0, 1.0)), 1.0);
        }` });

    this.aoBlur = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, projInv: { value: new THREE.Matrix4() }, dir: { value: new THREE.Vector2(1, 0) } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform mat4 projInv; uniform vec2 dir; varying vec2 vUv;
        float viewZ(vec2 uv){ vec4 c = projInv * vec4(uv * 2.0 - 1.0, texture2D(tDepth, uv).x * 2.0 - 1.0, 1.0); return c.z / c.w; }
        void main(){ float zc = viewZ(vUv); float sum = texture2D(tDiffuse, vUv).r * 0.4; float wsum = 0.4;
          float tol = 0.05 + 0.03 * abs(zc); // gate on linear view depth: raw depth is non-linear, so at a few metres it rejected nearly every tap and the SSAO grain survived
          for (int i = 1; i <= 6; i++) { float f = float(i); float w = 0.2 / f; // 6 taps a side: the per-pixel rotation of the 12 samples averages out (3 taps left grain on dark facades and the sky)
            vec2 o = dir * f;
            float w1 = w * step(abs(viewZ(vUv + o) - zc), tol), w2 = w * step(abs(viewZ(vUv - o) - zc), tol);
            sum += texture2D(tDiffuse, vUv + o).r * w1 + texture2D(tDiffuse, vUv - o).r * w2; wsum += w1 + w2; }
          gl_FragColor = vec4(vec3(sum / max(wsum, 0.0001)), 1.0); }` });

    this.shaftMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tDiffuse: { value: null }, sunPos: { value: new THREE.Vector2(0.5, 0.5) }, density: { value: 0.72 }, decay: { value: 0.94 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 sunPos; uniform float density, decay; varying vec2 vUv;
        void main(){ vec2 delta = (vUv - sunPos) * density / 20.0; vec2 uv = vUv; float illum = 1.0; vec3 col = vec3(0.0);
          for (int i = 0; i < 20; i++) { uv -= delta; col += texture2D(tDiffuse, clamp(uv, 0.0, 1.0)).rgb * illum; illum *= decay; }
          gl_FragColor = vec4(col / 20.0, 1.0); }` });

    this.composite = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, vertexShader: VS,
      uniforms: { tScene: { value: null }, tBloom1: { value: null }, tBloom2: { value: null }, tAO: { value: null }, tShafts: { value: null },
        useBloom: { value: 0 }, useAO: { value: 0 }, useShafts: { value: 0 }, strength: { value: 0.7 }, shaftStrength: { value: 0 }, shaftColor: { value: new THREE.Color(1, 1, 1) },
        exposure: { value: 1 }, night: { value: 0 }, rain: { value: 0 }, time: { value: 0 }, hurt: { value: 0 }, gray: { value: 0 }, speed: { value: 0 },
        lift: { value: new THREE.Vector3(0, 0, 0) }, gain: { value: new THREE.Vector3(1, 1, 1) }, sat: { value: 1 }, vigFloor: { value: 0.66 } },
      fragmentShader: `uniform sampler2D tScene, tBloom1, tBloom2, tAO, tShafts; uniform vec3 shaftColor, lift, gain;
        uniform float useBloom, useAO, useShafts, strength, shaftStrength, exposure, night, rain, time, hurt, gray, speed, sat, vigFloor; varying vec2 vUv;
        vec3 aces(vec3 x){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
        void main(){
          vec2 off = (vUv - 0.5);
          float ca = (speed * 0.004 + hurt * 0.003);
          vec3 col;
          if (ca > 0.0001) { col.r = texture2D(tScene, vUv + off * ca).r; col.g = texture2D(tScene, vUv).g; col.b = texture2D(tScene, vUv - off * ca).b; }
          else col = texture2D(tScene, vUv).rgb;
          if (speed > 0.001) { vec3 sum = col; for (int i = 1; i <= 4; i++) sum += texture2D(tScene, vUv - off * float(i) * 0.011 * speed).rgb;
            col = mix(col, sum / 5.0, clamp(speed * length(off) * 2.4, 0.0, 0.85)); }
          if (useAO > 0.5) { float ao = texture2D(tAO, vUv).r; col *= mix(1.0, ao, 0.85); }
          if (useBloom > 0.5) col += (texture2D(tBloom1, vUv).rgb * 0.62 + texture2D(tBloom2, vUv).rgb * 0.5) * strength;
          if (useShafts > 0.5) col += texture2D(tShafts, vUv).rgb * shaftColor * shaftStrength;
          col *= exposure; col = aces(col);
          col = lift + col * (gain - lift); col = mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, sat); // time-of-day grade (neutral at lift 0, gain 1, sat 1)
          col = mix(col, col * vec3(0.94, 0.99, 1.09), night * 0.5);
          col = mix(col, col * vec3(0.88, 0.95, 1.0), rain * 0.35);
          col = mix(col, clamp((col - 0.5) * 1.06 + 0.5, 0.0, 1.0), 0.55);
          float lum = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(col, vec3(lum) * 0.8, gray);
          float vig = smoothstep(1.3, 0.32, length(off * vec2(1.25, 1.0))); col *= mix(vigFloor, 1.0, vig);
          col = mix(col, vec3(0.5, 0.015, 0.015), hurt * (1.0 - vig) * 0.62);
          float g = fract(sin(dot(vUv * vec2(1237.0, 917.0) + fract(time), vec2(12.9898, 78.233))) * 43758.5453);
          gl_FragColor = vec4(toSRGB(col) + (g - 0.5) * (2.0 / 255.0), 1.0); // dither of one 8-bit step in display space; grain added in linear space speckled every dark pixel at night
        }` });

    this.fxaa = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tDiffuse: { value: null }, texel: { value: new THREE.Vector2() } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 texel; varying vec2 vUv;
        float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
        void main(){
          vec3 rgbM = texture2D(tDiffuse, vUv).rgb; float lM = luma(rgbM);
          float lNW = luma(texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * texel).rgb);
          float lNE = luma(texture2D(tDiffuse, vUv + vec2( 1.0, -1.0) * texel).rgb);
          float lSW = luma(texture2D(tDiffuse, vUv + vec2(-1.0,  1.0) * texel).rgb);
          float lSE = luma(texture2D(tDiffuse, vUv + vec2( 1.0,  1.0) * texel).rgb);
          float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
          float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
          if (lMax - lMin < max(0.0312, lMax * 0.125)) { gl_FragColor = vec4(rgbM, 1.0); return; }
          vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
          float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
          float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
          dir = clamp(dir * rcp, -8.0, 8.0) * texel;
          vec3 rgbA = 0.5 * (texture2D(tDiffuse, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tDiffuse, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
          vec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(tDiffuse, vUv - dir * 0.5).rgb + texture2D(tDiffuse, vUv + dir * 0.5).rgb);
          float lB = luma(rgbB);
          gl_FragColor = vec4((lB < lMin || lB > lMax) ? rgbA : rgbB, 1.0);
        }` });

    this.setQuality(quality);
  }

  setQuality(q) { this.quality = q; this.level = q === 'low' ? 0 : q === 'med' ? 1 : 2; this.w = 0; this.h = 0; }

  setSize(w, h) {
    w = Math.max(1, w | 0); h = Math.max(1, h | 0);
    if (w === this.w && h === this.h && this.rt) return;
    this.w = w; this.h = h;
    for (const t of this.targets) { if (t.depthTexture) t.depthTexture.dispose(); t.dispose(); }
    this.targets = [];
    const mk = (sw, sh, o = {}) => { const t = new THREE.WebGLRenderTarget(Math.max(1, Math.round(sw)), Math.max(1, Math.round(sh)), { type: o.byte ? THREE.UnsignedByteType : THREE.HalfFloatType, depthBuffer: !!o.depth, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }); this.targets.push(t); return t; };
    this.rt = mk(w, h, { depth: true });
    if (this.level >= 2) { const dt = new THREE.DepthTexture(w, h); dt.minFilter = THREE.NearestFilter; dt.magFilter = THREE.NearestFilter; this.rt.depthTexture = dt; }
    this.ldr = mk(w, h, { byte: true });
    if (this.level >= 1) { this.bright = mk(w / 2, h / 2); this.a1 = mk(w / 4, h / 4); this.b1 = mk(w / 4, h / 4); this.a2 = mk(w / 8, h / 8); this.b2 = mk(w / 8, h / 8); this.shafts = mk(w / 4, h / 4); }
    // single-channel occlusion: 8 bit targets are plenty (and half the bandwidth of half-float RGBA)
    if (this.level >= 2) { this.aoRaw = mk(w / 2, h / 2, { byte: true }); this.aoTmp = mk(w / 2, h / 2, { byte: true }); this.ao = mk(w / 2, h / 2, { byte: true }); }
  }

  pass(mat, target) { this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.scene, this.cam); }
  blurPass(src, dst, dx, dy) { this.blur.uniforms.tDiffuse.value = src.texture; this.blur.uniforms.dir.value.set(dx / dst.width, dy / dst.height); this.pass(this.blur, dst); }

  render(scene, camera, u = {}) {
    const R = this.renderer;
    R.setRenderTarget(this.rt); R.render(scene, camera);
    const c = this.composite.uniforms;
    c.useAO.value = 0; c.useBloom.value = 0; c.useShafts.value = 0;

    if (this.level >= 2 && this.rt.depthTexture) {
      const s = this.ssao.uniforms; s.tDepth.value = this.rt.depthTexture;
      s.proj.value.copy(camera.projectionMatrix); s.projInv.value.copy(camera.projectionMatrix).invert();
      s.res.value.set(this.aoRaw.width, this.aoRaw.height);
      this.pass(this.ssao, this.aoRaw);
      const ab = this.aoBlur.uniforms; ab.tDepth.value = this.rt.depthTexture; ab.projInv.value.copy(s.projInv.value);
      ab.tDiffuse.value = this.aoRaw.texture; ab.dir.value.set(1 / this.aoRaw.width, 0); this.pass(this.aoBlur, this.aoTmp);
      ab.tDiffuse.value = this.aoTmp.texture; ab.dir.value.set(0, 1 / this.aoRaw.height); this.pass(this.aoBlur, this.ao);
      c.tAO.value = this.ao.texture; c.useAO.value = 1;
    }
    if (this.level >= 1) {
      this.threshold.uniforms.tDiffuse.value = this.rt.texture; this.pass(this.threshold, this.bright);
      this.blurPass(this.bright, this.a1, 1, 0); this.blurPass(this.a1, this.b1, 0, 1);
      this.blurPass(this.b1, this.a2, 1, 0); this.blurPass(this.a2, this.b2, 0, 1);
      c.tBloom1.value = this.b1.texture; c.tBloom2.value = this.b2.texture; c.useBloom.value = 1; c.strength.value = u.strength ?? 0.7;
      if (u.shaftStrength > 0.002 && u.sunPos) {
        this.shaftMat.uniforms.tDiffuse.value = this.b1.texture; this.shaftMat.uniforms.sunPos.value.copy(u.sunPos); this.pass(this.shaftMat, this.shafts);
        c.tShafts.value = this.shafts.texture; c.useShafts.value = 1; c.shaftStrength.value = u.shaftStrength; if (u.sunColor) c.shaftColor.value.copy(u.sunColor);
      }
    }
    c.tScene.value = this.rt.texture; c.night.value = u.night || 0; c.rain.value = u.rain || 0; c.time.value = u.time || 0;
    c.hurt.value = u.hurt || 0; c.gray.value = u.gray || 0; c.exposure.value = u.exposure ?? 1; c.speed.value = u.speed || 0;
    setV3(c.lift.value, u.lift, 0); setV3(c.gain.value, u.gain, 1); c.sat.value = u.sat ?? 1; c.vigFloor.value = u.vigFloor ?? 0.66; // colour grade; all neutral when the caller sets nothing
    this.pass(this.composite, this.ldr);
    this.fxaa.uniforms.tDiffuse.value = this.ldr.texture; this.fxaa.uniforms.texel.value.set(1 / this.w, 1 / this.h);
    this.pass(this.fxaa, null);
  }
}
