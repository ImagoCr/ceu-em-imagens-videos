// Reel "Comunhão espiritual": capela à luz de vitral, em three.js. Tudo é função de t (determinístico).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TL = await (await fetch('timeline.json')).json();
const W = innerWidth, H = innerHeight;
window.DUR = TL.dur;

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = u => u * u * (3 - 2 * u);
const eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const eo = u => 1 - Math.pow(1 - u, 3);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const n1 = x => { const i = Math.floor(x), f = x - i, h = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; return lerp(h(i), h(i + 1), ss(f)); };
const line = id => TL.lines.find(l => l.id === id);
const scene = k => TL.scenes.find(s => s.scene === k);
const sceneAt = t => TL.scenes.find(s => t >= s.t0 && t < s.t1) || TL.scenes[TL.scenes.length - 1];
// envelope de presença de um elemento numa lista de cenas, com fade nas bordas
function presence(t, scenes, fin = 1.2, fout = 1.0) {
  let v = 0;
  for (const k of scenes) { const s = scene(k); v = Math.max(v, seg(t, s.t0 - .2, s.t0 - .2 + fin) * (1 - seg(t, s.t1 - fout * .5, s.t1 + fout * .5))); }
  // cenas consecutivas não piscam entre si
  for (let i = 0; i < scenes.length - 1; i++) if (scenes[i + 1] === scenes[i] + 1) { const b = scene(scenes[i]).t1; if (Math.abs(t - b) < fout) v = Math.max(v, 1); }
  return v;
}

// ---------- renderer ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const sceneG = new THREE.Scene();
sceneG.background = new THREE.Color(0x020205);
sceneG.fog = new THREE.FogExp2(0x05060c, 0.035);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 80);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(sceneG, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.55, 0.55, 0.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- texturas de canvas ----------
function canvasTex(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const glowTex = canvasTex(256, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.55)'); r.addColorStop(.5, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
const flameTex = canvasTex(128, (g, s) => {
  const r = g.createRadialGradient(s / 2, s * .62, 0, s / 2, s * .62, s * .42); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(.35, 'rgba(255,190,80,.9)'); r.addColorStop(.7, 'rgba(255,110,20,.35)'); r.addColorStop(1, 'rgba(255,80,0,0)');
  g.fillStyle = r; g.beginPath(); g.moveTo(s / 2, s * .04); g.bezierCurveTo(s * .78, s * .4, s * .8, s * .78, s / 2, s * .96); g.bezierCurveTo(s * .2, s * .78, s * .22, s * .4, s / 2, s * .04); g.fill();
});
const raysTex = canvasTex(1024, (g, s) => {
  const c = s / 2; g.translate(c, c); const N = 72;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, long = i % 2 === 0, L = long ? s * .48 : s * .34, w = long ? .028 : .02;
    const gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); gr.addColorStop(0, 'rgba(255,220,140,0)'); gr.addColorStop(.28, 'rgba(255,214,120,.95)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(Math.cos(a - w) * s * .14, Math.sin(a - w) * s * .14); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + w) * s * .14, Math.sin(a + w) * s * .14); g.fill();
  }
});
const hostTex = canvasTex(512, (g, s) => {
  const c = s / 2; const r = g.createRadialGradient(c, c * .9, 0, c, c, c); r.addColorStop(0, '#fffdf4'); r.addColorStop(.85, '#f4ead2'); r.addColorStop(1, '#d8c7a0');
  g.fillStyle = r; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(150,120,70,.35)'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c * .86, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(c, c * .42); g.lineTo(c, c * 1.58); g.moveTo(c * .58, c * .86); g.lineTo(c * 1.42, c * .86); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(c + 6, c * .42 + 4); g.lineTo(c + 6, c * 1.58 + 4); g.moveTo(c * .58, c * .86 + 7); g.lineTo(c * 1.42, c * .86 + 7); g.stroke();
});

// ---------- arquitetura ----------
const WIN = { x: 0, y: 2.6, z: -14, w: 2.25, yb: 6.6 };   // lanceta gótica: meia largura w, arranque do arco em yb (local)
const uni = { uTime: { value: 0 }, uGlow: { value: 0 }, uWarm: { value: 0 }, uCandle: { value: 0 } };

const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }`;

// vitral (emissivo, HDR para o bloom)
const winMat = new THREE.ShaderMaterial({
  uniforms: uni, transparent: true, depthWrite: false,
  vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: NOISE + /* glsl */`
  varying vec2 vP; uniform float uTime, uGlow, uWarm;
  const float w = ${WIN.w.toFixed(3)}, yb = ${WIN.yb.toFixed(3)};
  float inside(vec2 p, float m){ if (abs(p.x) > w - m || p.y < m) return 0.; if (p.y < yb) return 1.;
    return step(distance(p, vec2(w, yb)), 2.*w - m) * step(distance(p, vec2(-w, yb)), 2.*w - m); }
  vec3 pal(float r){ if (r < .46) return vec3(.06,.16,.95); if (r < .7) return vec3(.85,.04,.10); if (r < .84) return vec3(1.,.72,.16); if (r < .93) return vec3(.08,.6,.3); return vec3(.95,.95,.8); }
  void main(){
    vec2 p = vP; float m0 = inside(p, 0.);
    if (m0 < .5) discard;
    float border = 1. - inside(p, .32);
    float lead = 0.; vec3 col;
    // medalhão central: hóstia branca em anel dourado
    vec2 mc = vec2(0., 5.2); float d = distance(p, mc);
    if (d < 1.45) {
      if (d < 1.0) { col = vec3(1.,.97,.86); float cr = step(abs(p.x), .07) * step(abs(p.y - mc.y - .08), .62) + step(abs(p.y - mc.y - .2), .07) * step(abs(p.x), .42); col = mix(col, vec3(.75,.55,.25), clamp(cr,0.,1.)*.55); }
      else { float a = atan(p.y - mc.y, p.x); float k = fract(a / 6.2832 * 16.); col = mix(vec3(1.,.74,.2), vec3(.9,.1,.12), step(.5, k)); lead = max(lead, 1. - smoothstep(.0, .035, abs(k - .5) * .9)); }
      lead = max(lead, 1. - smoothstep(.02, .06, abs(d - 1.0))); lead = max(lead, 1. - smoothstep(.02, .06, abs(d - 1.45)));
    } else if (border > .5) {
      float k = fract(p.y * 1.6 + p.x * .2); col = mix(vec3(.9,.06,.12), vec3(1.,.75,.2), step(.62, k));
      lead = 1. - smoothstep(.02, .05, min(abs(k - .62), min(k, 1. - k)) / 1.6);
    } else {
      // losangos cortados à mão (grade girada 45° com jitter)
      vec2 q = mat2(.7071,-.7071,.7071,.7071) * p * 1.55; q += .12 * vec2(vn(p*1.3), vn(p*1.3 + 7.)) ;
      vec2 id = floor(q), f = fract(q); col = pal(h21(id));
      float e = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)); lead = 1. - smoothstep(.03, .075, e);
      col *= .82 + .36 * vn(id * 3.1 + q * 4.);
    }
    float edge = 1. - inside(p, .07); lead = max(lead, edge);
    float rim = 1. - smoothstep(.0, .05, abs(inside(p, .32) - inside(p, .36)));
    lead = max(lead, rim * border);
    // textura do vidro: estrias, bolhas, nuvens de espessura
    float tex = .78 + .3 * fbm(p * vec2(9., 2.) + 3.) - .12 * step(.985, h21(floor(p * 40.)));
    float sun = .65 + .35 * fbm(p * .35 + vec2(uTime * .04, 0.));
    vec3 light = mix(vec3(1.,.97,.92), vec3(1.,.82,.55), uWarm);
    vec3 c = col * tex * sun * light * (0.05 + 1.55 * uGlow);
    c = mix(c, vec3(.012,.01,.008), lead);
    gl_FragColor = vec4(c, 1.);
  }`
});
const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(2 * WIN.w + .2, WIN.yb + 2 * WIN.w * .87 + .2).translate(0, (WIN.yb + 2 * WIN.w * .87) / 2, 0), winMat);
winMesh.position.set(WIN.x, WIN.y, WIN.z); sceneG.add(winMesh);

// parede de pedra com brilho do vitral
const wallMat = new THREE.ShaderMaterial({
  uniforms: uni,
  vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: NOISE + /* glsl */`varying vec2 vP; uniform float uGlow, uWarm, uCandle;
  void main(){
    vec2 p = vP; vec2 b = vec2(p.x / 1.4 + .5 * mod(floor(p.y / .7), 2.), p.y / .7); vec2 f = fract(b);
    float joint = 1. - smoothstep(.0, .05, min(min(f.x, 1. - f.x) * 1.4, min(f.y, 1. - f.y) * .7));
    float stone = .55 + .45 * fbm(p * 1.7) ; stone *= 1. - .55 * joint;
    vec2 wc = vec2(0., ${(WIN.y + 6).toFixed(2)}); float g = exp(-pow(distance(p, wc) / 7.5, 2.));
    vec3 tint = mix(vec3(.35,.45,1.), vec3(1.,.7,.4), uWarm * .6 + .2);
    vec3 c = vec3(.52,.45,.38) * stone * (.018 + .13 * g * uGlow * tint) + vec3(1.,.55,.2) * stone * .07 * uCandle * exp(-pow(distance(p, vec2(0., 1.)) / 6., 2.));
    gl_FragColor = vec4(c, 1.);
  }`
});
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30).translate(0, 15, 0), wallMat); wall.position.z = WIN.z - .05; sceneG.add(wall);

// piso de lajes com a mancha colorida projetada pelo vitral
const floorMat = new THREE.ShaderMaterial({
  uniforms: uni,
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: NOISE + /* glsl */`varying vec3 vW; uniform float uGlow, uWarm, uCandle, uTime;
  void main(){
    vec2 p = vW.xz;
    vec2 q = p * vec2(.55, .48) + .25 * vec2(vn(p * .7), vn(p * .7 + 5.)); vec2 f = fract(q);
    float joint = 1. - smoothstep(.0, .04, min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)));
    float stone = (.6 + .4 * fbm(p * 1.3)) * (.7 + .3 * h21(floor(q))) * (1. - .6 * joint);
    // mancha: o vitral estendido no chão (mais longe = topo da janela), borrada e dessaturada
    vec2 pc = vec2(p.x / 1.15, (p.y + 1.5) / 2.6);
    float pat = smoothstep(1., .55, length(pc * vec2(1., .9))) ;
    vec2 lq = mat2(.7071,-.7071,.7071,.7071) * vec2(p.x, p.y * .45) * 1.2; float r = h21(floor(lq));
    vec3 pcol = r < .5 ? vec3(.25,.35,1.) : r < .75 ? vec3(1.,.25,.3) : r < .9 ? vec3(1.,.8,.4) : vec3(.4,.9,.6);
    pcol = mix(pcol, vec3(dot(pcol, vec3(.33))), .25) * (.7 + .3 * vn(lq * 2.));
    vec3 light = mix(vec3(1.), vec3(1.,.8,.55), uWarm);
    vec3 c = vec3(.5,.44,.38) * stone * (.012 + 1.25 * pat * uGlow * pcol * light)
           + vec3(1.,.55,.22) * stone * .55 * uCandle * exp(-pow(distance(p, vec2(0., -4.)) / 3.2, 2.));
    gl_FragColor = vec4(c, 1.);
  }`
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), floorMat); floor.position.z = -4; sceneG.add(floor);

// colunas
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a4f45, roughness: .92 });
for (const x of [-5.2, 5.2]) for (const z of [-1.5, -6.5, -11.5]) {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.55, .62, 16, 24), stoneMat); col.position.set(x, 8, z); sceneG.add(col);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, .6, 1.6), stoneMat); base.position.set(x, .3, z); sceneG.add(base);
}
// altar com toalha
const altar = new THREE.Group(); altar.position.set(0, 0, -4.5); sceneG.add(altar);
const aBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 1.3), stoneMat); aBody.position.y = .55; altar.add(aBody);
const cloth = new THREE.Mesh(new THREE.BoxGeometry(4.5, .05, 1.45), new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: .8 })); cloth.position.y = 1.125; altar.add(cloth);
const front = new THREE.Mesh(new THREE.BoxGeometry(4.5, .5, .02), new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: .85 })); front.position.set(0, .88, .735); altar.add(front);
const goldBand = new THREE.Mesh(new THREE.BoxGeometry(4.5, .05, .025), new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: .9, roughness: .3, emissive: 0x3a2808 })); goldBand.position.set(0, .66, .74); altar.add(goldBand);

// velas
const candles = [];
const waxMat = new THREE.MeshStandardMaterial({ color: 0xf3e8d0, roughness: .6, emissive: 0x2a1606 });
[-1.75, -1.15, 1.15, 1.75].forEach((x, i) => {
  const h = i % 3 === 0 ? .95 : .75;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, h, 20), waxMat); c.position.set(x, 1.15 + h / 2, -4.6); sceneG.add(c);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .08, 24), goldBand.material); holder.position.set(x, 1.19, -4.6); sceneG.add(holder);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: new THREE.Color(2.2, 1.6, 1.0), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  fl.position.set(x, 1.15 + h + .13, -4.6); sceneG.add(fl);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.0, .55, .2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  gl.position.copy(fl.position); sceneG.add(gl);
  candles.push({ fl, gl, i, on: .25 + i * .32 });
});
const candleLight = new THREE.PointLight(0xffa04a, 0, 14, 1.6); candleLight.position.set(0, 2.1, -4.0); sceneG.add(candleLight);
const winLight = new THREE.DirectionalLight(0x9fb4ff, 0); winLight.position.set(0, 9, -13); winLight.target.position.set(0, 0, -2); sceneG.add(winLight, winLight.target);
const amb = new THREE.HemisphereLight(0x223355, 0x0a0604, .25); sceneG.add(amb);

// raios de luz volumétricos (cones aditivos)
const rayMat = (tint, k) => new THREE.ShaderMaterial({
  uniforms: { ...uni, uTint: { value: new THREE.Color(...tint) }, uK: { value: k }, uAmt: { value: 0 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: NOISE + /* glsl */`varying vec2 vUv; varying vec3 vN, vV; uniform float uTime, uK, uAmt; uniform vec3 uTint;
  void main(){
    float side = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
    float along = smoothstep(1., .82, vUv.y) * smoothstep(0., .45, vUv.y);   // ~0 junto à janela e no chão
    float streak = .55 + .45 * fbm(vec2(vUv.x * 18. + uK * 9., vUv.y * 1.5 - uTime * .03));
    gl_FragColor = vec4(uTint * side * along * streak * uAmt * .03, 1.);
  }`
});
const rays = [];
[[[.75, .82, 1.0], 0, 1.0, 2.9, 0], [[1.0, .75, .45], .9, .7, 1.7, 1], [[.6, .55, 1.0], -1.0, .6, 1.6, 2]].forEach(([tint, dx, amt, rb, k]) => {
  const top = new THREE.Vector3(WIN.x + dx * .6, WIN.y + 6.5, WIN.z + .1), bot = new THREE.Vector3(dx * 1.6, 0, -.8);
  const len = top.distanceTo(bot);
  const g = new THREE.CylinderGeometry(1.3 * (k ? .6 : 1), rb, len, 48, 1, true);
  const m = new THREE.Mesh(g, rayMat(tint, k));
  m.position.copy(top).add(bot).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
  sceneG.add(m); rays.push({ m, amt });
});

// poeira em suspensão (mais brilhante dentro do feixe)
function points(n, seed, attrs, vs, fs, extraU = {}) {
  const r = mulberry(seed), g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  for (const [name, size, fn] of attrs) { const a = new Float32Array(n * size); for (let i = 0; i < n; i++) { const v = fn(r, i); for (let j = 0; j < size; j++) a[i * size + j] = v[j]; } g.setAttribute(name, new THREE.BufferAttribute(a, size)); }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  const m = new THREE.ShaderMaterial({ uniforms: { ...uni, ...extraU, uTex: { value: glowTex } }, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m); sceneG.add(p); return p;
}
const dust = points(2600, 7, [['aB', 4, r => [lerp(-6, 6, r()), lerp(0, 11, r()), lerp(-13, 4, r()), r()]]],
  `attribute vec4 aB; uniform float uTime, uGlow; varying float vA;
   void main(){
     vec3 p = aB.xyz + vec3(sin(uTime * .13 + aB.w * 40.) * .35, mod(aB.y + uTime * (.04 + .05 * aB.w), 11.) - aB.y, cos(uTime * .11 + aB.w * 23.) * .3);
     vec3 a = vec3(${WIN.x.toFixed(1)}, ${(WIN.y + 6.5).toFixed(1)}, ${WIN.z.toFixed(1)}), b = vec3(0., 0., -.8);
     vec3 ab = b - a; float h = clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.); float d = length(p - a - ab * h);
     float inBeam = exp(-pow(d / (1.2 + 1.8 * h), 2.)) * smoothstep(0., .25, h);
     vec4 mv = modelViewMatrix * vec4(p, 1.);
     vA = (.05 + .9 * inBeam * uGlow) * (.5 + .5 * sin(uTime * 1.3 + aB.w * 90.));
     gl_PointSize = (14. + 22. * aB.w) / -mv.z * ${(H / 1920).toFixed(3)} * 6.; gl_Position = projectionMatrix * mv;
   }`,
  `uniform sampler2D uTex; varying float vA; void main(){ vec4 c = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vec3(1.,.93,.8) * c.a * vA, 1.); }`);

// coração de luz (partículas que se juntam)
const heartShape = (r) => { let x, y; do { x = lerp(-1.2, 1.2, r()); y = lerp(-1.1, 1.0, r()); } while (Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y > 0); return [x, y]; };
const heartPts = points(1800, 11, [
  ['aT', 3, r => { const edge = r() < .55; let [x, y] = heartShape(r); if (edge) { const a = r() * Math.PI * 2; x = 16 * Math.pow(Math.sin(a), 3) / 17; y = (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17 + .08; } return [x * .85, y * .85, (r() - .5) * .25]; }],
  ['aS', 4, r => [lerp(-5, 5, r()), lerp(-3.5, 5, r()), lerp(-4, 4, r()), r()]]],
  `attribute vec3 aT; attribute vec4 aS; uniform float uTime, uForm, uScale, uBurst, uAmt; varying float vA;
   void main(){
     float k = clamp(uForm * 1.35 - aS.w * .35, 0., 1.); k = k * k * (3. - 2. * k);
     vec3 tgt = aT * uScale * (1. + .04 * sin(uTime * 2.2)) ; tgt.x += sin(uTime * .9 + aS.w * 30.) * .02;
     vec3 p = mix(aS.xyz, tgt, k);
     vec3 dir = normalize(aT + vec3(0., 0., .3) + 1e-3); p += dir * uBurst * (1.5 + 3. * aS.w);
     vec4 mv = modelViewMatrix * vec4(p, 1.);
     vA = uAmt * (.35 + .65 * k) * (.6 + .4 * sin(uTime * 3. + aS.w * 70.)) * (1. - .7 * clamp(uBurst / 2., 0., 1.));
     gl_PointSize = (8. + 12. * aS.w) / -mv.z * ${(H / 1920).toFixed(3)} * 7.; gl_Position = projectionMatrix * mv;
   }`,
  `uniform sampler2D uTex; uniform vec3 uCol; varying float vA; void main(){ vec4 c = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uCol * c.a * vA, 1.); }`,
  { uForm: { value: 0 }, uScale: { value: 1 }, uBurst: { value: 0 }, uAmt: { value: 0 }, uCol: { value: new THREE.Color(1.2, .85, .55) } });
const heartGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.0, .55, .3), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
sceneG.add(heartGlow);

// Hóstia com resplendor
const host = new THREE.Group(); sceneG.add(host);
const hostDisc = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .04, 72).rotateX(Math.PI / 2), [
  new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.2, 1.0) }), new THREE.MeshBasicMaterial({ map: hostTex, color: new THREE.Color(1.05, 1.0, .9), transparent: true }), new THREE.MeshBasicMaterial({ map: hostTex, color: new THREE.Color(1.2, 1.1, .9) })]);
const sunRays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTex, color: new THREE.Color(.95, .72, .38), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
sunRays.scale.set(3.4, 3.4, 1);
const sunRays2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTex, color: new THREE.Color(.5, .32, .14), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
sunRays2.scale.set(4.6, 4.6, 1);
const hostHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(.8, .55, .3), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
hostHalo.scale.set(2.6, 2.6, 1);
host.add(sunRays2, sunRays, hostHalo, hostDisc); hostDisc.position.z = .02;

// casa de luz (cena "aqui em casa")
const house = new THREE.Group(); sceneG.add(house);
const houseMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.0, .5), transparent: true });
const bar = (x1, y1, x2, y2, th = .045) => { const L = Math.hypot(x2 - x1, y2 - y1); const m = new THREE.Mesh(new THREE.BoxGeometry(L + th, th, th), houseMat); m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0); m.rotation.z = Math.atan2(y2 - y1, x2 - x1); house.add(m); };
bar(-1.1, -1, 1.1, -1); bar(-1.1, -1, -1.1, .55); bar(1.1, -1, 1.1, .55); bar(-1.35, .4, 0, 1.55); bar(1.35, .4, 0, 1.55); bar(.55, 1.05, .55, 1.45); bar(.85, .8, .85, 1.45); bar(.55, 1.45, .85, 1.45);
bar(-.75, -1, -.75, -.15); bar(-.25, -1, -.25, -.15); bar(-.75, -.15, -.25, -.15);
const hWin = new THREE.Mesh(new THREE.PlaneGeometry(.62, .52), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.1, .5), transparent: true })); hWin.position.set(.45, .05, -.01); house.add(hWin);
bar(.14, .05, .76, .05, .03); bar(.45, -.21, .45, .31, .03);
house.position.set(0, 3.45, -4.4);

// orbes dos quatro momentos
const orbs = [-1.65, -.55, .55, 1.65].map((x, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.1, .8, .4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); s.position.set(x, 2.15 + Math.sin(i / 3 * Math.PI) * .25, -4.3); sceneG.add(s); return s; });

// ---------- câmera ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CAM = {
  1: [[V(0, 1.55, 6.5), V(0, 4.2, -9)], [V(0, 1.7, 4.6), V(0, 4.0, -9)]],
  2: [[V(0, 2.5, 3.4), V(0, 3.75, -4.5)], [V(0, 3.2, .4), V(0, 3.85, -4.5)]],
  3: [[V(2.1, 3.4, 2.4), V(0, 3.9, -4.2)], [V(.9, 3.7, .9), V(0, 3.9, -4.2)]],
  4: [[V(-1.4, 3.0, 2.6), V(0, 3.7, -4.4)], [V(-.5, 3.3, 1.5), V(0, 3.7, -4.4)]],
  5: [[V(1.5, 3.9, 1.6), V(0, 3.9, -4.2)], [V(.4, 3.9, .6), V(0, 3.9, -4.2)]],
  6: [[V(0, 1.25, 3.2), V(0, 5.2, -8)], [V(0, 1.5, 1.2), V(0, 5.6, -8)]],
  7: [[V(0, 3.3, 5.0), V(0, 3.2, -6)], [V(0, 3.0, 3.6), V(0, 3.1, -6)]],
  8: [[V(0, 3.9, 1.5), V(0, 3.9, -4.2)], [V(0, 3.9, .3), V(0, 3.9, -4.2)]],
  9: [[V(0, 2.4, 3.2), V(0, 4.2, -8)], [V(0, 2.0, 6.2), V(0, 4.6, -9)]],
};
function camAt(t) {
  const sc = sceneAt(t), [A, B] = CAM[sc.scene], u = ss(seg(t, sc.t0, sc.t1));
  let p = A[0].clone().lerp(B[0], u), l = A[1].clone().lerp(B[1], u);
  const prev = TL.scenes.find(s => s.scene === sc.scene - 1);
  if (prev) { const w = eio(seg(t, sc.t0, sc.t0 + 1.8)); const [, PB] = CAM[prev.scene]; p = PB[0].clone().lerp(p, w); l = PB[1].clone().lerp(l, w); }
  // respiração leve de câmera na mão
  p.x += (n1(t * .35) - .5) * .06; p.y += (n1(t * .3 + 9) - .5) * .05;
  return [p, l];
}

// ---------- textos ----------
const TITLES = [
  ['l01', '', 'Com que idade você<br>descobriu <em>isso aqui</em>?', 'hook'],
  ['l02', 'Comunhão espiritual', 'os mesmos benefícios<br>da <em>comunhão sacramental</em>'],
  ['l03', 'Desde pequenas', 'as crianças já<br>podem aprender'],
  ['l04', '', 'O que é a<br><em>comunhão espiritual</em>?'],
  ['l05', 'Com todo o coração', 'dizer a Jesus que<br>você gostaria de<br><em>comungar agora</em>'],
  ['l06', 'Sem Missa agora?', 'recebê-lo<br><em>na sua alma</em>'],
  ['l07', 'Oração espontânea', 'do <em>seu jeito</em>'],
  ['l08', 'Aqui em casa', 'os filhos<br>aprendem cedo'],
  ['l09', 'Aos 2, 3 anos', '"Jesus, vem morar<br><em>no meu coração</em>."'],
  ['l10', '', 'Isso já é<br><em>comunhão espiritual</em>'],
  ['l11', 'O adulto também pode', 'fórmulas prontas<br>ou <em>do seu jeito</em>'],
  ['l12', '', '"Jesus, vem morar<br><em>na minha alma</em>."'],
  ['l13', 'Atenção', 'Não substitui a<br><em>comunhão sacramental</em>'],
  ['l14', 'Para o adulto', 'é dizer a Deus que<br><em>quer comungar</em>'],
  ['l15', 'Não é', '"quero, mas não<br>quero me esforçar"'],
  ['l16', 'É dizer', '"Assim que eu puder,<br><em>eu quero comungar</em>."'],
  ['l17', 'Quando fazer?', ''],
  ['l22', 'Não é fórmula mágica', 'É o coração dizendo:<br><em>"vem morar em mim"</em>'],
  ['l23', '', 'Um dos tesouros da<br><em>nossa fé católica</em>'],
  ['l24', 'E você?', 'Com que idade<br><em>descobriu isso</em>?'],
].map(([id, kicker, main, cls]) => ({ t0: line(id).t0 - .15, kicker, main, cls: cls || '', id }));
TITLES[0].t0 = 0.15;
TITLES.forEach((T, i) => { T.t1 = i < TITLES.length - 1 ? TITLES[i + 1].t0 - .05 : TL.dur; const s = sceneAt(line(T.id).t0); if (i < TITLES.length - 1 && sceneAt(TITLES[i + 1].t0) !== s) T.t1 = Math.min(T.t1, s.t1 - .1); });
const MOMENTS = [['l18', 'Durante o dia inteiro'], ['l19', 'Preparando-se para a Confissão'], ['l20', 'Sem Missa por perto, impedido'], ['l21', 'Querendo mudar de vida']].map(([id, txt]) => ({ t0: line(id).t0, txt }));
const CAPS = TL.lines.flatMap(l => l.caps);

const elT = document.getElementById('title'), elK = elT.querySelector('.kicker'), elM = elT.querySelector('.main');
const elList = document.getElementById('list'), elCap = document.getElementById('cap'), elCta = document.getElementById('cta');
elList.innerHTML = MOMENTS.map(m => `<div class="it"><span class="dot"></span><span>${m.txt}</span></div>`).join('');
const items = [...elList.children];
let lastTitle = null, lastCap = null;
function drawText(t) {
  const T = TITLES.find(x => t >= x.t0 && t < x.t1);
  if (T !== lastTitle) { elK.textContent = T ? T.kicker : ''; elK.style.display = T && T.kicker ? '' : 'none'; elM.innerHTML = T ? T.main : ''; elT.className = T ? T.cls : ''; lastTitle = T; }
  if (T) {
    const a = eo(seg(t, T.t0, T.t0 + .55)) * (1 - seg(t, T.t1 - .3, T.t1));
    elT.style.opacity = a; elT.style.transform = `translateY(${(1 - eo(seg(t, T.t0, T.t0 + .7))) * 34}px)`;
    elK.style.letterSpacing = `${.5 - .18 * eo(seg(t, T.t0, T.t0 + 1.2))}em`;
  } else elT.style.opacity = 0;
  const s7 = scene(7);
  const la = seg(t, s7.t0 + 1.0, s7.t0 + 1.6) * (1 - seg(t, s7.t1 - .5, s7.t1));
  elList.style.opacity = la;
  items.forEach((it, i) => { const m = MOMENTS[i]; const on = seg(t, m.t0 - .1, m.t0 + .45); const cur = t >= m.t0 && (i === 3 || t < MOMENTS[i + 1].t0);
    it.style.opacity = on * (cur ? 1 : .55); it.style.transform = `translateX(${(1 - eo(on)) * -40}px) scale(${cur ? 1.04 : 1})`; it.style.transformOrigin = 'left center'; });
  const c = CAPS.find(x => t >= x.t0 && t < x.t1 + .25);
  if (c !== lastCap) { elCap.textContent = c ? c.text : ''; lastCap = c; }
  elCap.style.opacity = c ? seg(t, c.t0 - .05, c.t0 + .08) : 0;
  const s9 = scene(9), ca = seg(t, line('l24').t1 - .6, line('l24').t1);
  elCta.style.opacity = ca; elCta.style.transform = `scale(${.92 + .08 * eo(ca)})`;
}

// ---------- render(t) ----------
const tmpV = new THREE.Vector3();
window.render = (t) => {
  const s1 = scene(1);
  uni.uTime.value = t;
  // o vitral "acende" no gancho; esquenta na cena final (luz de tarde)
  const glow = .12 + .88 * eio(seg(t, 1.0, 4.0)) + .08 * presence(t, [2, 6]) + .05 * presence(t, [8]);
  uni.uGlow.value = glow * (.94 + .06 * n1(t * .4));
  uni.uWarm.value = .25 + .5 * seg(t, scene(8).t0, scene(9).t1) + .2 * presence(t, [4]);
  // velas acendem uma a uma no início
  let cAll = 0;
  candles.forEach(c => { const on = eo(seg(t, c.on, c.on + .5)); const fk = .82 + .18 * n1(t * 9 + c.i * 7) + .06 * n1(t * 23 + c.i);
    c.fl.scale.set(.16 * fk * on, .32 * (.9 + .2 * n1(t * 7 + c.i * 3)) * on, 1); c.fl.material.opacity = on;
    c.gl.scale.setScalar(1.1 * fk * on); c.gl.material.opacity = .55 * on; cAll += on * fk / 4; });
  uni.uCandle.value = cAll;
  candleLight.intensity = 9 * cAll; winLight.intensity = 1.1 * glow; amb.intensity = .15 + .2 * glow;
  rays.forEach(r => { r.m.material.uniforms.uAmt.value = r.amt * glow; r.m.material.uniforms.uTime.value = t; });
  dust.material.uniforms.uTime.value = t;

  // Hóstia: sobe do altar na cena 2, volta nas cenas 6 e 9
  const hp = presence(t, [2, 6, 9], 1.6, 1.4);
  const rise = eo(seg(t, scene(2).t0, scene(2).t0 + 3.2));
  host.position.set(0, lerp(2.2, 3.85, t < scene(3).t0 ? rise : 1) + Math.sin(t * .8) * .04, -4.5);
  host.visible = hp > .001; host.scale.setScalar(lerp(.6, 1, hp));
  hostDisc.material.forEach(m => { m.opacity = hp; m.transparent = true; });
  sunRays.material.opacity = hp * .9; sunRays.material.rotation = t * .05;
  sunRays2.material.opacity = hp * .55; sunRays2.material.rotation = -t * .03 + .04;
  hostHalo.material.opacity = hp * .45;
  hostDisc.lookAt(camera.position);

  // coração: forma-se na cena 3, encolhe para dentro da casa na 4, volta na 5, explode em ouro na 8
  const hpres = presence(t, [3, 4, 5, 7, 8, 9], 1.5, 1.2);
  const s3 = scene(3), s4 = scene(4), s5 = scene(5), s7 = scene(7), s8 = scene(8), s9 = scene(9);
  const form = Math.max(seg(t, s3.t0 + .3, s3.t0 + 5.5), t > s3.t0 + 5.5 ? 1 : 0) * (1 - .85 * seg(t, s7.t0, s7.t0 + 1.2) * (1 - seg(t, s8.t0 - 1.2, s8.t0 + .3)));
  const inHouse = seg(t, s4.t0, s4.t0 + 1.6) * (1 - seg(t, s5.t0 - .4, s5.t0 + 1.2));
  const burst = eo(seg(t, line('l23').t0 - .2, line('l23').t0 + 2.6)) * 2.2 * (1 - seg(t, s9.t0 + .5, s9.t0 + 2.5));
  const hu = heartPts.material.uniforms;
  hu.uForm.value = form; hu.uScale.value = lerp(1.05, .2, inHouse) * lerp(1, 1.25, seg(t, s8.t0, line('l23').t0)) * lerp(1, .55, seg(t, s9.t0, s9.t0 + 2));
  hu.uBurst.value = burst; hu.uAmt.value = hpres * lerp(1, .4, presence(t, [9]) * seg(t, s9.t0, s9.t0 + 2));
  hu.uCol.value.setRGB(lerp(1.15, 1.35, presence(t, [8])), lerp(.8, .9, presence(t, [8])), lerp(.52, .3, presence(t, [8])));
  heartPts.position.set(0, lerp(3.95, 3.47, inHouse) + lerp(0, 1.2, presence(t, [9]) * seg(t, s9.t0, s9.t0 + 2)), lerp(-4.2, -4.38, inHouse));
  heartPts.rotation.y = Math.sin(t * .25) * .25;
  heartGlow.position.copy(heartPts.position); heartGlow.material.opacity = hpres * form * .3 * (1 + .6 * presence(t, [8]));
  heartGlow.scale.setScalar(2.4 * hu.uScale.value * (1 + .4 * presence(t, [8])) + 2 * burst);

  const hs = presence(t, [4], 1.4, 1.2);
  house.visible = hs > .001; houseMat.opacity = hs * (.85 + .15 * n1(t * 2)); hWin.material.opacity = hs * .55;
  house.scale.setScalar(lerp(.5, .62, eo(hs))); house.rotation.y = Math.sin(t * .3) * .12;

  const op = presence(t, [7], 1, 1);
  orbs.forEach((o, i) => { const m = MOMENTS[i]; const on = eo(seg(t, m.t0 - .1, m.t0 + .6)); const cur = t >= m.t0 && (i === 3 || t < MOMENTS[i + 1].t0);
    o.material.opacity = op * on * (cur ? 1 : .6); o.scale.setScalar((cur ? 1.25 : .85) * (.9 + .1 * n1(t * 3 + i)) * on + .001); });

  const [p, l] = camAt(t); camera.position.copy(p); camera.lookAt(l);
  composer.render();
  drawText(t);
};

await document.fonts.ready;
await Promise.all(['500 84px Garamond', 'italic 500 84px Garamond', '600 84px Garamond', '800 54px Montserrat', '600 34px Montserrat'].map(f => document.fonts.load(f, 'Comunhão é')));
window.render(0);
window.READY = true;
