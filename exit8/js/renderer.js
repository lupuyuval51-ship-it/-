/* EXIT 8 — a small WebGL2 renderer.
 * One texture array holds every surface. Static geometry carries baked lighting per vertex;
 * moving objects are lit from a light sample taken at their position each frame.
 * Coordinates: X right, Y up, Z forward (left-handed view space). */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});
  const STRIDE = 20; // pos3 nor3 uv2 layer1 lit3 dyn3 emis3 mat2
  E.STRIDE = STRIDE;

  const M4 = {
    ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
      return o;
    },
    translate(x, y, z) { const m = M4.ident(); m[12] = x; m[13] = y; m[14] = z; return m; },
    scale(x, y, z) { const m = M4.ident(); m[0] = x; m[5] = y; m[10] = z; return m; },
    /** Rotation about Y that maps local +Z to (sin a, 0, cos a). */
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); },
    rotX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
    rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    /** Matrix whose columns are the given axes (local X, Y, Z → world). */
    basis(x, y, z) { return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, 0, 0, 0, 1]); },
    chain() { let m = arguments[0]; for (let i = 1; i < arguments.length; i++) m = M4.mul(m, arguments[i]); return m; },
    perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) / (far - near); m[11] = 1; m[14] = -2 * far * near / (far - near);
      return m;
    },
    view(ex, ey, ez, yaw, pitch) {
      const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
      const f = [sy * cp, sp, cy * cp], r = [cy, 0, -sy];
      const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
      const m = new Float32Array(16);
      m[0] = r[0]; m[4] = r[1]; m[8] = r[2]; m[12] = -(r[0] * ex + r[1] * ey + r[2] * ez);
      m[1] = u[0]; m[5] = u[1]; m[9] = u[2]; m[13] = -(u[0] * ex + u[1] * ey + u[2] * ez);
      m[2] = f[0]; m[6] = f[1]; m[10] = f[2]; m[14] = -(f[0] * ex + f[1] * ey + f[2] * ez);
      m[15] = 1;
      return m;
    },
  };
  E.M4 = M4;

  const VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNor;
layout(location=2) in vec2 aUV;
layout(location=3) in float aLayer;
layout(location=4) in vec3 aLit;
layout(location=5) in vec3 aDyn;
layout(location=6) in vec3 aEmis;
layout(location=7) in vec2 aMat;
uniform mat4 uVP;
uniform mat4 uModel;
out vec3 vPos; out vec3 vNor; out vec2 vUV; flat out float vLayer;
out vec3 vLit; out vec3 vDyn; out vec3 vEmis; out vec2 vMat;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vPos = wp.xyz; vNor = mat3(uModel) * aNor; vUV = aUV; vLayer = aLayer;
  vLit = aLit; vDyn = aDyn; vEmis = aEmis; vMat = aMat;
  gl_Position = uVP * wp;
}`;

  const FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray uTex;
uniform vec3 uCam; uniform float uDyn; uniform float uTime; uniform vec2 uRes;
uniform float uObj; uniform vec3 uObjLight; uniform vec3 uObjDir; uniform vec4 uTintOv;
uniform vec4 uSpecPos[6]; uniform vec3 uSpecCol[6];
uniform vec3 uFog; uniform float uFogD; uniform float uExposure; uniform vec4 uFlash; uniform float uGrain;
uniform float uVig; uniform float uDesat; uniform vec3 uGrade;
in vec3 vPos; in vec3 vNor; in vec2 vUV; flat in float vLayer;
in vec3 vLit; in vec3 vDyn; in vec3 vEmis; in vec2 vMat;
out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec4 t = texture(uTex, vec3(vUV, vLayer));
  if (t.a < 0.5) discard;
  vec3 alb = t.rgb * t.rgb;
  vec3 N = normalize(vNor);
  vec3 lit;
  if (uObj > 0.5) {
    vec3 tint = uTintOv.a > 0.5 ? uTintOv.rgb : vLit;
    float sh = 0.45 + 0.55 * max(dot(N, uObjDir), 0.0);
    lit = tint * uObjLight * sh;
  } else {
    lit = vLit + vDyn * uDyn;
  }
  vec3 col = alb * lit;
  col += alb * vEmis * (vMat.x > 0.5 ? uDyn : 1.0) * (uTintOv.a > 0.5 ? 0.0 : 1.0);
  if (vMat.y > 0.0) {
    vec3 V = normalize(uCam - vPos);
    float gate = clamp(dot(lit, vec3(0.9)), 0.0, 1.0);
    vec3 s = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      vec3 L = uSpecPos[i].xyz - vPos;
      float d = length(L);
      L /= d;
      vec3 H = normalize(L + V);
      float sp = pow(max(dot(N, H), 0.0), 70.0) * max(dot(N, L), 0.0);
      s += uSpecCol[i] * sp * uSpecPos[i].w / (1.0 + 0.1 * d * d);
    }
    col += s * vMat.y * gate;
  }
  float dist = length(vPos - uCam);
  col = mix(uFog, col, exp(-dist * uFogD));
  col *= uExposure;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(lum) * uGrade, uDesat);
  vec2 q = gl_FragCoord.xy / uRes - 0.5;
  col *= clamp(1.0 - dot(q, q) * uVig, 0.0, 1.0);
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  col = mix(col, uFlash.rgb, uFlash.a);
  o = vec4(col, 1.0);
}`;

  E.createRenderer = function (canvas) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    if (!gl) return null;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const U = {};
    ['uVP', 'uModel', 'uTex', 'uCam', 'uDyn', 'uTime', 'uRes', 'uObj', 'uObjLight', 'uObjDir', 'uTintOv',
      'uSpecPos', 'uSpecCol', 'uFog', 'uFogD', 'uExposure', 'uFlash', 'uGrain', 'uVig', 'uDesat', 'uGrade'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(U.uTex, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    const IDENT = M4.ident();
    let tex = null, texSize = 512;

    function uploadTextures(canvases, size) {
      texSize = size;
      if (tex) gl.deleteTexture(tex);
      tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.floor(Math.log2(size)) + 1, gl.RGBA8, size, size, canvases.length);
      canvases.forEach((c, i) => gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, size, size, 1, gl.RGBA, gl.UNSIGNED_BYTE, c));
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    }

    function updateLayer(i, canvas) {
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, texSize, texSize, 1, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    }

    function createMesh(packed) {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, packed.data, gl.STATIC_DRAW);
      const sizes = [3, 3, 2, 1, 3, 3, 3, 2];
      let off = 0;
      sizes.forEach((n, i) => {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, n, gl.FLOAT, false, STRIDE * 4, off * 4);
        off += n;
      });
      const ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, packed.index, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      return { vao, vbo, ibo, count: packed.index.length };
    }

    function deleteMesh(m) {
      if (!m) return;
      gl.deleteVertexArray(m.vao); gl.deleteBuffer(m.vbo); gl.deleteBuffer(m.ibo);
    }

    let width = 1, height = 1;
    function resize(dpr) {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (w !== canvas.width || h !== canvas.height) { canvas.width = w; canvas.height = h; }
      width = w; height = h;
    }

    const specPos = new Float32Array(24), specCol = new Float32Array(18);
    /** cam: {x,y,z,yaw,pitch,fov}; p: {time, dyn, spec:[{x,y,z,w,col}], exposure, fog, fogD, flash, grain} */
    function begin(cam, p) {
      gl.viewport(0, 0, width, height);
      const fa = p.flash[3];
      gl.clearColor(p.fog[0] + (p.flash[0] - p.fog[0]) * fa, p.fog[1] + (p.flash[1] - p.fog[1]) * fa, p.fog[2] + (p.flash[2] - p.fog[2]) * fa, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(prog);
      const proj = M4.perspective(cam.fov, width / height, 0.04, 120);
      gl.uniformMatrix4fv(U.uVP, false, M4.mul(proj, M4.view(cam.x, cam.y, cam.z, cam.yaw, cam.pitch)));
      gl.uniform3f(U.uCam, cam.x, cam.y, cam.z);
      gl.uniform1f(U.uDyn, p.dyn);
      gl.uniform1f(U.uTime, p.time);
      gl.uniform2f(U.uRes, width, height);
      gl.uniform3fv(U.uFog, p.fog);
      gl.uniform1f(U.uFogD, p.fogD);
      gl.uniform1f(U.uExposure, p.exposure);
      gl.uniform4fv(U.uFlash, p.flash);
      gl.uniform1f(U.uGrain, p.grain);
      gl.uniform1f(U.uVig, p.vig == null ? 0.85 : p.vig);
      gl.uniform1f(U.uDesat, p.desat || 0);
      gl.uniform3fv(U.uGrade, p.grade || [1, 1, 1]);
      specPos.fill(0); specCol.fill(0);
      for (let i = 0; i < 6 && i < p.spec.length; i++) {
        const s = p.spec[i];
        specPos.set([s.x, s.y, s.z, s.w], i * 4);
        specCol.set(s.col, i * 3);
      }
      gl.uniform4fv(U.uSpecPos, specPos);
      gl.uniform3fv(U.uSpecCol, specCol);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    }

    function drawStatic(mesh) {
      gl.uniform1f(U.uObj, 0);
      gl.uniform4f(U.uTintOv, 0, 0, 0, 0);
      gl.uniformMatrix4fv(U.uModel, false, IDENT);
      gl.bindVertexArray(mesh.vao);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
    }

    /** light: {col:[r,g,b], dir:[x,y,z]}; tintOv: optional [r,g,b] that replaces material colour. */
    function drawObj(mesh, model, light, tintOv) {
      gl.uniform1f(U.uObj, 1);
      gl.uniform3fv(U.uObjLight, light.col);
      gl.uniform3fv(U.uObjDir, light.dir);
      if (tintOv) gl.uniform4f(U.uTintOv, tintOv[0], tintOv[1], tintOv[2], 1); else gl.uniform4f(U.uTintOv, 0, 0, 0, 0);
      gl.uniformMatrix4fv(U.uModel, false, model);
      gl.bindVertexArray(mesh.vao);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
    }

    return { gl, uploadTextures, updateLayer, createMesh, deleteMesh, resize, begin, drawStatic, drawObj, size: () => [width, height] };
  };
})(typeof window !== 'undefined' ? window : globalThis);
