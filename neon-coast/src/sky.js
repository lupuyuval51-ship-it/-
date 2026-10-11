import * as THREE from '../vendor/three.module.min.js';
import { clamp, lerp, damp, mulberry } from './utils.js';
import { cloudTex } from './textures.js';

// Colour keyframes by sun height (-1..1): [sunY, top, horizon, sunColor]
const KEYS = [
  [-0.35, 0x060a1f, 0x090d1e, 0x000000],
  [-0.12, 0x0a1030, 0x2a2650, 0x7a3a3a],
  [0.0, 0x2b3b7a, 0xff7a4a, 0xffa25a],
  [0.12, 0x4a86d8, 0xffa870, 0xffc27e], // golden hour (17:30 in summer sits here): warm horizon and a gold sun, not the pale pastel of before
  [0.45, 0x3f8ae4, 0xb6dff6, 0xfff1d4],
  [1.0, 0x2f7fdc, 0xc6e8fb, 0xfff6e6],
];
const tmpB = new THREE.Color();
// Module scratch objects: Sky.update runs every frame and must not allocate.
const WHITE = new THREE.Color(1, 1, 1);
// Rain greys the sky towards RAIN_TINT; by night the target is a very dark blue-grey, so night rain no longer lifts the sky to mid-grey.
const RAIN_TINT = new THREE.Color(), RAIN_TINT_DAY = new THREE.Color(0x6a7280), RAIN_TINT_NIGHT = new THREE.Color(0x161a22);
// Light pollution of the city: a magenta-orange glow on the horizon and on the underside of clouds at night, and the colour the fog takes on
const CITY_GLOW = new THREE.Color(0.42, 0.16, 0.30), CITY_FOG = new THREE.Color(0.105, 0.04, 0.075); // CITY_FOG = CITY_GLOW * 0.25
// Rain: the drops are placed entirely in the vertex shader inside a box of RAIN_BOX metres around the camera. The box is periodic, and 70 s
// is a whole number of periods in every axis (28 m/s down through 40 m, 4 m/s of wind across 70 m), so the clock may wrap at RAIN_PERIOD.
const RAIN_MAX = 2400, RAIN_PERIOD = 70;
const GROUND_DAY = new THREE.Color(0x7a6450), GROUND_NIGHT = new THREE.Color(0x141a2e); // warm bounce light by day, deep blue at night
const _snap = new THREE.Vector3(), _moonDir = new THREE.Vector3(), _moonLight = new THREE.Vector3();
// writes the interpolated key colour into `out` and returns it
function keyColor(sunY, k, out) { for (let i = 1; i < KEYS.length; i++) if (sunY <= KEYS[i][0]) { const t = clamp((sunY - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0]), 0, 1); return out.setHex(KEYS[i - 1][k]).lerp(tmpB.setHex(KEYS[i][k]), t); } return out.setHex(KEYS[KEYS.length - 1][k]); }

export class Sky {
  constructor(scene, renderer, quality) {
    this.scene = scene; this.renderer = renderer; this.rain = 0; this.weather = 'clear';
    this.hemi = new THREE.HemisphereLight(0xbfe4fa, 0x5a4a3a, 1.0); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.5); this.sun.castShadow = quality !== 'low';
    const sh = this.sun.shadow; sh.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024); sh.camera.near = 1; sh.camera.far = 420; sh.camera.left = -88; sh.camera.right = 88; sh.camera.top = 88; sh.camera.bottom = -88; sh.bias = -0.0004; sh.normalBias = 0.35; sh.radius = quality === 'high' ? 2.5 : 1.5;
    scene.add(this.sun); scene.add(this.sun.target);
    this.domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color() }, night: { value: 0 }, rain: { value: 0 },
        cloudMap: { value: cloudTex() }, time: { value: 0 }, cover: { value: 0.38 }, cityGlow: { value: CITY_GLOW }, moonDir: { value: new THREE.Vector3(0, 1, 0) } },
      vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z=gl_Position.w; }`,
      fragmentShader: `uniform vec3 top,horizon,sunDir,sunColor,cityGlow,moonDir; uniform float night,rain,time,cover; uniform sampler2D cloudMap; varying vec3 vDir;
        float hash(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
        void main(){ vec3 d=normalize(vDir); float h=max(d.y,0.0); vec3 col=mix(horizon,top,pow(h,0.55)); if(d.y<0.0) col=mix(horizon,horizon*0.5,min(1.0,-d.y*4.0));
        float gold=smoothstep(0.02,0.1,sunDir.y)*(1.0-smoothstep(0.16,0.3,sunDir.y)); col=mix(col,sunColor*1.1,0.7*gold*exp(-h*1.4)); // golden hour: the sky a little above the horizon takes the warm sun colour (the blue top mixed with the horizon went lilac)
        float sd=max(dot(d,sunDir),0.0); col+=sunColor*(pow(sd,900.0)*3.0+pow(sd,24.0)*0.55+pow(sd,4.0)*0.2)*(1.0-rain*0.7);
        vec3 g=floor(d*260.0); float s=hash(g); float star=step(0.9965,s)*smoothstep(0.02,0.2,d.y)*night*(0.5+0.5*hash(g+1.0)); col+=vec3(star)*(1.0-rain);
        col+=cityGlow*exp(-max(d.y,0.0)*7.0)*night*0.55;
        col+=vec3(0.6,0.65,0.8)*pow(max(dot(d,moonDir),0.0),60.0)*0.25*night;
        { // clouds: sampled for every pixel (uniform control flow keeps the texture derivatives valid); c is 0 at and below the horizon
          vec2 cuv=d.xz/(h+0.12)*0.22+vec2(time*0.004,time*0.0015);
          float n=0.65*texture2D(cloudMap,cuv).a+0.35*texture2D(cloudMap,cuv*2.7+0.3).a;
          float c=smoothstep(1.0-cover,1.35-cover,n)*smoothstep(0.0,0.12,d.y);
          vec3 lit=mix(horizon*1.05,sunColor*1.35+top*0.25,pow(max(dot(d,sunDir),0.0),6.0));
          vec3 cloudCol=mix(lit,mix(horizon,top,0.5)*0.55,n);
          cloudCol+=cityGlow*night*mix(0.6,0.16,rain)*(0.35+0.65*n)*exp(-h*2.2); // lit from below by the city; weaker under rain, where the whole sky is cloud
          col=mix(col,cloudCol,c*0.9);
        }
        col=mix(col,vec3(0.45,0.48,0.55),rain*0.6*(1.0-night)); gl_FragColor=vec4(col,1.0); }`,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 18), this.domeMat); this.dome.frustumCulled = false; scene.add(this.dome);
    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false })); scene.add(this.sunMesh);
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false })); scene.add(this.moon);
    scene.fog = new THREE.Fog(0xbfe4fa, 150, 700);
    // rain: one InstancedMesh of camera-facing streaks, animated in the vertex shader (no per-frame JS loop). The seed of every drop travels in the
    // translation of its instance matrix (0..1 in each axis, scaled by the box in the shader).
    const rnd = mulberry(5150), m = new THREE.Matrix4();
    this.rainU = { time: { value: 0 }, origin: { value: new THREE.Vector3() }, alpha: { value: 0 }, tint: { value: new THREE.Color() } };
    const rainMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: this.rainU,
      vertexShader: `uniform float time, alpha; uniform vec3 origin; varying float vA;
        const vec3 BOX = vec3(70.0, 40.0, 70.0); const vec3 VEL = vec3(4.0, -28.0, 0.0);
        void main(){
          vec3 rel = mod(instanceMatrix[3].xyz * BOX + VEL * time - origin, BOX) - BOX * 0.5;   // drop position relative to the camera-snapped origin
          vec3 wp = origin + rel, toCam = cameraPosition - wp, dir = normalize(VEL); float dc = length(toCam);
          vec3 side = cross(dir, toCam); float sl = length(side); side = sl > 1e-4 ? side / sl : vec3(1.0, 0.0, 0.0);
          float w = max(0.02, dc * 0.0011);                                                    // never thinner than about a pixel
          vec3 p = wp + dir * (position.y * 0.9) + side * (position.x * w);                   // 0.9 m long streak along the fall direction, facing the camera
          vA = alpha * (1.0 - smoothstep(24.0, 35.0, length(rel.xz))) * (1.0 - smoothstep(14.0, 20.0, abs(rel.y))) * smoothstep(1.2, 2.6, dc) * clamp(0.02 / w, 0.35, 1.0); // 35 m cylinder, nothing within 1.2 m of the camera
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform vec3 tint; varying float vA; void main(){ if (vA < 0.004) discard; gl_FragColor = vec4(tint, vA); }` });
    this.rainMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), rainMat, RAIN_MAX);
    for (let i = 0; i < RAIN_MAX; i++) { m.makeTranslation(rnd(), rnd(), rnd()); this.rainMesh.setMatrixAt(i, m); }
    this.rainMesh.count = quality === 'low' ? RAIN_MAX / 2 : RAIN_MAX; this.rainMesh.frustumCulled = false; this.rainMesh.visible = false; scene.add(this.rainMesh);
    this._rainT = 0; this._time = 0;
    this.sunDir = new THREE.Vector3(); this.night = 0; this.skyColor = new THREE.Color(); this.fogColor = new THREE.Color();
    this._top = new THREE.Color(); this._hor = new THREE.Color(); this._sunC = new THREE.Color();
    // returned (and refilled) by every update(); callers use it within the same frame
    this._env = { night: 0, sunY: 0, sunDir: this.sunDir, skyColor: this.skyColor, fogColor: this.fogColor, fogNear: 0, fogFar: 0, rain: 0, top: this._top, horizon: this._hor, sunColor: this._sunC };
  }
  setWeather(w) { this.weather = w; }
  // half as many rain streaks on the low tier; Game.setQuality should call this
  setQuality(q) { this.rainMesh.count = q === 'low' ? RAIN_MAX / 2 : RAIN_MAX; }
  // hours: 0..24 fractional
  update(dt, hours, focus, camera) {
    const a = (hours - 6) / 12 * Math.PI; const sd = this.sunDir.set(Math.cos(a), Math.sin(a), 0.35).normalize();
    const sunY = sd.y; const night = this.night = 1 - THREE.MathUtils.smoothstep(sunY, -0.14, 0.12);
    this.rain = damp(this.rain, this.weather === 'rain' ? 1 : 0, 0.5, dt);
    const top = keyColor(sunY, 1, this._top), hor = keyColor(sunY, 2, this._hor), sunC = keyColor(sunY, 3, this._sunC);
    RAIN_TINT.copy(RAIN_TINT_DAY).lerp(RAIN_TINT_NIGHT, night); top.lerp(RAIN_TINT, this.rain * 0.55); hor.lerp(RAIN_TINT, this.rain * 0.5);
    this._time = (this._time + dt) % 20000; // 20000 s is a whole number of periods of both cloud layers, so the wrap is invisible
    const du = this.domeMat.uniforms; du.top.value.copy(top); du.horizon.value.copy(hor); du.sunDir.value.copy(sd); du.sunColor.value.copy(sunC); du.night.value = night; du.rain.value = this.rain; du.time.value = this._time; du.cover.value = lerp(0.38, 0.92, this.rain);
    this.dome.position.copy(camera.position);
    this.sunMesh.position.copy(camera.position).addScaledVector(sd, 1300); this.sunMesh.visible = sunY > -0.06; this.sunMesh.material.color.copy(sunC);
    this.moon.position.copy(camera.position).addScaledVector(_moonDir.set(-sd.x * 0.6, Math.max(0.5, -sd.y), -sd.z * 0.6).normalize(), 1300); this.moon.visible = night > 0.3; du.moonDir.value.copy(_moonDir);
    // lights
    const day = clamp(sunY * 3, 0, 1); const dayLight = day * (1 - this.rain * 0.55);
    const texel = 2 * 88 / (this.sun.shadow.mapSize.x || 2048); focus = _snap.set(Math.round(focus.x / texel) * texel, 0, Math.round(focus.z / texel) * texel);
    if (sunY > 0.03) { this.sun.position.copy(focus).addScaledVector(sd, 220); this.sun.intensity = lerp(0.2, 3.3, dayLight); this.sun.color.copy(sunC); }
    else { const md = _moonLight.set(-sd.x, Math.max(0.35, -sd.y), -sd.z).normalize(); this.sun.position.copy(focus).addScaledVector(md, 220); this.sun.intensity = 0.5 * (1 - this.rain * 0.5); this.sun.color.setHex(0x8fa4ff); }
    this.sun.target.position.copy(focus);
    // ambient: a pale sky tint by day (the sky colour itself at night), warm ground bounce by day, deep blue at night
    this.hemi.color.copy(top).lerp(WHITE, 0.75 * day).lerp(sunC, 0.6 * day * (1 - THREE.MathUtils.smoothstep(sunY, 0.1, 0.5))); // golden hour: the fill light takes the warm sun colour, so the facades are not washed blue-lilac this.hemi.groundColor.copy(GROUND_DAY).lerp(GROUND_NIGHT, night); this.hemi.intensity = lerp(0.5, 0.6, dayLight);
    // fog: horizon colour, denser in rain and at night
    this.fogColor.copy(hor).lerp(top, 0.35 * night).lerp(CITY_FOG, night * 0.5); this.skyColor.copy(top); // the fog picks up the glow of the city at night
    const near = lerp(150, 45, this.rain) * (1 - night * 0.35), far = lerp(720, 320, this.rain) * (1 - night * 0.3);
    this.scene.fog.color.copy(this.fogColor); this.scene.fog.near = near; this.scene.fog.far = far;
    this.exposure = lerp(1.12, 1.18, night) * (1 - this.rain * 0.12);
    // rain: only the uniforms change, the streaks move on the GPU
    const r = this.rain; this.rainMesh.visible = r > 0.02;
    if (this.rainMesh.visible) {
      const u = this.rainU, cp = camera.position; this._rainT = (this._rainT + dt) % RAIN_PERIOD;
      this._in = (this._in || 0) + (((this.scene.userData.interiorAt?.(cp.x, cp.z) ?? null) !== null ? 1 : 0) - (this._in || 0)) * Math.min(1, dt * 8); // indoors (a shop interior, see shops.js) the rain stops falling through the ceiling
      u.time.value = this._rainT; u.origin.value.set(Math.round(cp.x), Math.round(cp.y), Math.round(cp.z)); u.alpha.value = 0.25 * r * (1 - this._in);
      const t = u.tint.value; t.copy(this.fogColor); t.r += 0.07 * night; t.g += 0.08 * night; t.b += 0.11 * night; // streaks catch some light at night
    }
    const env = this._env; env.night = night; env.sunY = sunY; env.fogNear = near; env.fogFar = far; env.rain = r;
    return env;
  }
}
