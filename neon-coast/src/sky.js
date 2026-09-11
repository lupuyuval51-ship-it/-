import * as THREE from '../vendor/three.module.min.js';
import { clamp, lerp, damp } from './utils.js';

// Colour keyframes by sun height (-1..1): [sunY, top, horizon, sunColor]
const KEYS = [
  [-0.35, 0x03050f, 0x090d1e, 0x000000],
  [-0.12, 0x0a1030, 0x2a2650, 0x7a3a3a],
  [0.0, 0x2b3b7a, 0xff7a4a, 0xffa25a],
  [0.12, 0x4a86d8, 0xffb98a, 0xffd2a0],
  [0.45, 0x3f8ae4, 0xb6dff6, 0xfff1d4],
  [1.0, 0x2f7fdc, 0xc6e8fb, 0xfff6e6],
];
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
function keyColor(sunY, k) { for (let i = 1; i < KEYS.length; i++) if (sunY <= KEYS[i][0]) { const t = clamp((sunY - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0]), 0, 1); return tmpA.setHex(KEYS[i - 1][k]).lerp(tmpB.setHex(KEYS[i][k]), t).clone(); } return tmpA.setHex(KEYS[KEYS.length - 1][k]).clone(); }

export class Sky {
  constructor(scene, renderer, quality) {
    this.scene = scene; this.renderer = renderer; this.rain = 0; this.weather = 'clear';
    this.hemi = new THREE.HemisphereLight(0xbfe4fa, 0x5a4a3a, 1.0); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.5); this.sun.castShadow = quality !== 'low';
    const sh = this.sun.shadow; sh.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024); sh.camera.near = 1; sh.camera.far = 420; sh.camera.left = -88; sh.camera.right = 88; sh.camera.top = 88; sh.camera.bottom = -88; sh.bias = -0.0004; sh.normalBias = 0.35; sh.radius = quality === 'high' ? 2.5 : 1.5;
    scene.add(this.sun); scene.add(this.sun.target);
    this.domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color() }, night: { value: 0 }, rain: { value: 0 } },
      vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z=gl_Position.w; }`,
      fragmentShader: `uniform vec3 top,horizon,sunDir,sunColor; uniform float night,rain; varying vec3 vDir;
        float hash(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
        void main(){ vec3 d=normalize(vDir); float h=max(d.y,0.0); vec3 col=mix(horizon,top,pow(h,0.55)); if(d.y<0.0) col=mix(horizon,horizon*0.5,min(1.0,-d.y*4.0));
        float sd=max(dot(d,sunDir),0.0); col+=sunColor*(pow(sd,900.0)*3.0+pow(sd,24.0)*0.35+pow(sd,4.0)*0.08)*(1.0-rain*0.7);
        vec3 g=floor(d*260.0); float s=hash(g); float star=step(0.9965,s)*smoothstep(0.02,0.2,d.y)*night*(0.5+0.5*hash(g+1.0)); col+=vec3(star)*(1.0-rain);
        col=mix(col,vec3(0.45,0.48,0.55)*(1.0-night*0.85),rain*0.6); gl_FragColor=vec4(col,1.0); }`,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 18), this.domeMat); this.dome.frustumCulled = false; scene.add(this.dome);
    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false })); scene.add(this.sunMesh);
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false })); scene.add(this.moon);
    scene.fog = new THREE.Fog(0xbfe4fa, 150, 700);
    // rain
    const N = 1400; const pos = new Float32Array(N * 6); this.rainN = N; this.rainPos = pos;
    for (let i = 0; i < N; i++) { pos[i * 6] = (Math.random() - 0.5) * 70; pos[i * 6 + 1] = Math.random() * 40; pos[i * 6 + 2] = (Math.random() - 0.5) * 70; pos[i * 6 + 3] = pos[i * 6]; pos[i * 6 + 4] = pos[i * 6 + 1] - 0.9; pos[i * 6 + 5] = pos[i * 6 + 2]; }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rainMesh = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xb8c4d8, transparent: true, opacity: 0 })); this.rainMesh.frustumCulled = false; this.rainMesh.visible = false; scene.add(this.rainMesh);
    this.sunDir = new THREE.Vector3(); this.night = 0; this.skyColor = new THREE.Color(); this.fogColor = new THREE.Color();
  }
  setWeather(w) { this.weather = w; }
  // hours: 0..24 fractional
  update(dt, hours, focus, camera) {
    const a = (hours - 6) / 12 * Math.PI; const sd = this.sunDir.set(Math.cos(a), Math.sin(a), 0.35).normalize();
    const sunY = sd.y; const night = this.night = 1 - THREE.MathUtils.smoothstep(sunY, -0.14, 0.12);
    this.rain = damp(this.rain, this.weather === 'rain' ? 1 : 0, 0.5, dt);
    const top = keyColor(sunY, 1), hor = keyColor(sunY, 2), sunC = keyColor(sunY, 3);
    const rainTint = new THREE.Color(0x6a7280); top.lerp(rainTint, this.rain * 0.55); hor.lerp(rainTint, this.rain * 0.5);
    this.domeMat.uniforms.top.value.copy(top); this.domeMat.uniforms.horizon.value.copy(hor); this.domeMat.uniforms.sunDir.value.copy(sd); this.domeMat.uniforms.sunColor.value.copy(sunC); this.domeMat.uniforms.night.value = night; this.domeMat.uniforms.rain.value = this.rain;
    this.dome.position.copy(camera.position);
    this.sunMesh.position.copy(camera.position).addScaledVector(sd, 1300); this.sunMesh.visible = sunY > -0.06; this.sunMesh.material.color.copy(sunC);
    this.moon.position.copy(camera.position).addScaledVector(new THREE.Vector3(-sd.x * 0.6, Math.max(0.5, -sd.y), -sd.z * 0.6).normalize(), 1300); this.moon.visible = night > 0.3;
    // lights
    const day = clamp(sunY * 3, 0, 1); const dayLight = day * (1 - this.rain * 0.55);
    const texel = 2 * 88 / (this.sun.shadow.mapSize.x || 2048); const snap = new THREE.Vector3(Math.round(focus.x / texel) * texel, 0, Math.round(focus.z / texel) * texel); focus = snap;
    if (sunY > 0.03) { this.sun.position.copy(focus).addScaledVector(sd, 220); this.sun.intensity = lerp(0.2, 2.8, dayLight); this.sun.color.copy(sunC); }
    else { const md = new THREE.Vector3(-sd.x, Math.max(0.35, -sd.y), -sd.z).normalize(); this.sun.position.copy(focus).addScaledVector(md, 220); this.sun.intensity = 0.5 * (1 - this.rain * 0.5); this.sun.color.setHex(0x8fa4ff); }
    this.sun.target.position.copy(focus);
    this.hemi.color.copy(top).lerp(new THREE.Color(0xfff4e4), 0.58 * day); this.hemi.groundColor.setHex(0x3a3028).lerp(new THREE.Color(0x141a2e), night); this.hemi.intensity = lerp(0.78, 1.25, dayLight);
    // fog: horizon colour, denser in rain and at night
    this.fogColor.copy(hor).lerp(top, 0.35 * night); this.skyColor.copy(top);
    const near = lerp(150, 45, this.rain) * (1 - night * 0.35), far = lerp(720, 320, this.rain) * (1 - night * 0.3);
    this.scene.fog.color.copy(this.fogColor); this.scene.fog.near = near; this.scene.fog.far = far;
    this.exposure = lerp(1.0, 1.18, night) * (1 - this.rain * 0.12);
    // rain particles
    const r = this.rain; this.rainMesh.visible = r > 0.02; this.rainMesh.material.opacity = 0.35 * r;
    if (this.rainMesh.visible) {
      const p = this.rainPos, N = this.rainN, cx = camera.position.x, cz = camera.position.z; const fall = 28 * dt, wind = 4 * dt;
      for (let i = 0; i < N; i++) { const o = i * 6; p[o + 1] -= fall; p[o + 4] -= fall; p[o] += wind; p[o + 3] += wind;
        if (p[o + 1] < 0) { p[o] = cx + (Math.random() - 0.5) * 70; p[o + 1] = 30 + Math.random() * 12; p[o + 2] = cz + (Math.random() - 0.5) * 70; p[o + 3] = p[o]; p[o + 4] = p[o + 1] - 0.9; p[o + 5] = p[o + 2]; }
        else if (Math.abs(p[o] - cx) > 40 || Math.abs(p[o + 2] - cz) > 40) { p[o] = cx + (Math.random() - 0.5) * 70; p[o + 2] = cz + (Math.random() - 0.5) * 70; p[o + 3] = p[o]; p[o + 5] = p[o + 2]; } }
      this.rainMesh.geometry.attributes.position.needsUpdate = true;
    }
    return { night, sunDir: sd, skyColor: this.skyColor, fogColor: this.fogColor, fogNear: near, fogFar: far, rain: r, top, horizon: hor, sunColor: sunC };
  }
}
