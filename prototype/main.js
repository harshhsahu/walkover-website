import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */
const PRODUCTS = [
  { name: 'MSG91', domain: 'Communication', color: '#ff6a3d', url: 'https://msg91.com/in',
    desc: 'Cloud communication platform delivering 1B+ SMS a month — omnichannel customer engagement at scale.' },
  { name: 'viaSocket', domain: 'Automation', color: '#3dd6ff', url: 'https://viasocket.com/',
    desc: 'AI automation platform to connect apps and automate workflows without writing code.' },
  { name: 'GTWY AI', domain: 'Artificial Intelligence', color: '#9b7bff', url: 'https://gtwy.ai/',
    desc: 'No-code platform to plug AI into your product, build chatbots and automate with agents.' },
  { name: 'Giddh', domain: 'Finance', color: '#3dffa8', url: 'https://giddh.com/in',
    desc: 'Cloud accounting that automates financial management and tax compliance for businesses.' },
  { name: 'Things of Brand', domain: 'Design & Brand', color: '#ff3d9a', url: 'https://thingsofbrand.com/',
    desc: 'Brand asset management that keeps logos and identity consistent across every product.' },
  { name: '50 Agents AI', domain: 'Artificial Intelligence', color: '#c6a8ff', url: 'https://chat.walkover.in/12496',
    desc: 'Smart AI assistant and notetaker — meeting summaries, insights and process automation.' },
  { name: 'DocStar', domain: 'Workspace', color: '#ffd23d', url: 'https://techdoc.walkover.in/login',
    desc: 'All-in-one workspace to write docs and blogs, test APIs and build websites.' },
];

/* ------------------------------------------------------------------ */
/* DOM: product cards, counters, reveal                                */
/* ------------------------------------------------------------------ */
const grid = document.getElementById('product-grid');
PRODUCTS.forEach((p, i) => {
  const a = document.createElement('a');
  a.className = 'card reveal';
  a.href = p.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.style.setProperty('--c', p.color);
  a.dataset.index = i;
  a.innerHTML = `<div class="dot"></div><small>${p.domain}</small><h3>${p.name}</h3><p>${p.desc}</p><span class="go">Visit ${p.name} ↗</span>`;
  grid.appendChild(a);
});

document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('.panel > *:not(.grid), .stat, .steps li, .pillars div').forEach((el) => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    const counter = e.target.querySelector?.('[data-count]');
    if (counter && !counter.dataset.done) {
      counter.dataset.done = '1';
      const end = +counter.dataset.count;
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / 1400);
        counter.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ------------------------------------------------------------------ */
/* Three.js                                                            */
/* ------------------------------------------------------------------ */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  document.body.classList.add('no-webgl');
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05060d');
scene.fog = new THREE.FogExp2('#05060d', 0.018);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
camera.position.set(0, 1.5, 14);

const labelRenderer = new CSS2DRenderer({ element: document.getElementById('labels') });
labelRenderer.setSize(innerWidth, innerHeight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.5, 0.35);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight('#8088ff', 0.25));
const coreLight = new THREE.PointLight('#ffb23d', 60, 40, 1.6);
scene.add(coreLight);
const rim = new THREE.DirectionalLight('#7b6cff', 1.2);
rim.position.set(-10, 6, -8);
scene.add(rim);

// Soft round sprite texture for points & glows
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.6)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const glowTex = makeGlowTexture();

/* Starfield ---------------------------------------------------------- */
function makeStars(count, rMin, rMax, size, opacity) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = [new THREE.Color('#ffffff'), new THREE.Color('#ffd9b0'), new THREE.Color('#b9c2ff')];
  for (let i = 0; i < count; i++) {
    const r = rMin + Math.random() * (rMax - rMin);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    const c = palette[(Math.random() * palette.length) | 0];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size, map: glowTex, vertexColors: true, transparent: true, opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  return new THREE.Points(geo, mat);
}
const starsFar = makeStars(5000, 80, 200, 0.9, 0.8);
const starsNear = makeStars(1200, 25, 80, 0.35, 0.6);
scene.add(starsFar, starsNear);

/* Universe group: core + orbits ------------------------------------- */
const universe = new THREE.Group();
scene.add(universe);

// Core — the "idea" at the heart of Walkover
const core = new THREE.Group();
universe.add(core);

const coreUniforms = { uTime: { value: 0 } };
const coreMat = new THREE.MeshStandardMaterial({
  color: '#ff7a3d', emissive: '#ff5a1f', emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.1, flatShading: true,
});
coreMat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = coreUniforms.uTime;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;')
    .replace('#include <begin_vertex>', `
      vec3 transformed = position;
      float n = sin(position.x * 3.1 + uTime * 1.3) * sin(position.y * 2.7 + uTime * 0.9) * sin(position.z * 3.3 + uTime * 1.1);
      transformed += normal * n * 0.14;
    `);
};
const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 5), coreMat);
core.add(coreMesh);

const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.0, 1),
  new THREE.MeshBasicMaterial({ color: '#ffb23d', wireframe: true, transparent: true, opacity: 0.22 })
);
core.add(shell);

const shell2 = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.6, 0),
  new THREE.MeshBasicMaterial({ color: '#7b6cff', wireframe: true, transparent: true, opacity: 0.12 })
);
core.add(shell2);

const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: '#ff8a3d', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
}));
coreGlow.scale.setScalar(6.5);
core.add(coreGlow);

const coreLabel = document.createElement('div');
coreLabel.className = 'planet-label';
coreLabel.textContent = 'WALKOVER';
coreLabel.style.borderColor = '#ffb23d';
const coreLabelObj = new CSS2DObject(coreLabel);
coreLabelObj.position.set(0, 2.9, 0);
core.add(coreLabelObj);

// Planets
const planets = [];
const planetMeshes = [];
PRODUCTS.forEach((p, i) => {
  const radius = 4.2 + i * 1.35;
  const tilt = new THREE.Euler((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.45);
  const orbit = new THREE.Group();
  orbit.rotation.copy(tilt);
  universe.add(orbit);

  // Ring path
  const pts = new THREE.EllipseCurve(0, 0, radius, radius).getPoints(160).map((v) => new THREE.Vector3(v.x, 0, v.y));
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.16 })
  );
  orbit.add(ring);

  const size = 0.32 + (i === 0 ? 0.22 : 0) + Math.random() * 0.12;
  const color = new THREE.Color(p.color);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 48, 48),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.2 })
  );
  mesh.userData.index = i;
  orbit.add(mesh);
  planetMeshes.push(mesh);

  // A thin moon ring on some planets for variety
  if (i % 2 === 0) {
    const pr = new THREE.Mesh(
      new THREE.RingGeometry(size * 1.5, size * 1.75, 64),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
    );
    pr.rotation.x = Math.PI / 2.4;
    mesh.add(pr);
  }

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glow.scale.setScalar(size * 6);
  mesh.add(glow);

  const el = document.createElement('div');
  el.className = 'planet-label';
  el.textContent = p.name;
  el.style.borderColor = p.color + '66';
  const label = new CSS2DObject(el);
  label.position.set(0, size + 0.15, 0);
  mesh.add(label);

  planets.push({
    data: p, orbit, ring, mesh, glow, label: el, radius, size,
    angle: Math.random() * Math.PI * 2,
    speed: (0.16 / Math.sqrt(radius)) * (reduceMotion ? 0.2 : 1),
    hover: 0,
  });
});

// Network lines: core <-> planets, and planet <-> planet neighbours
const netGeo = new THREE.BufferGeometry();
const netPositions = new Float32Array((PRODUCTS.length * 2 - 1) * 2 * 3);
netGeo.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
const netMat = new THREE.LineBasicMaterial({ color: '#ffb23d', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
const network = new THREE.LineSegments(netGeo, netMat);
universe.add(network);

// Idea stream — particles spiralling into the core (vision section)
const IDEAS = 900;
const ideaGeo = new THREE.BufferGeometry();
const ideaPos = new Float32Array(IDEAS * 3);
const ideaSeed = Array.from({ length: IDEAS }, () => ({
  t: Math.random(), a: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 8, s: 0.04 + Math.random() * 0.08,
}));
ideaGeo.setAttribute('position', new THREE.BufferAttribute(ideaPos, 3));
const ideaMat = new THREE.PointsMaterial({
  size: 0.18, map: glowTex, color: '#ffd28a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
});
const ideas = new THREE.Points(ideaGeo, ideaMat);
universe.add(ideas);

/* ------------------------------------------------------------------ */
/* Scroll choreography                                                 */
/* ------------------------------------------------------------------ */
const isMobile = () => innerWidth < 860;
// One keyframe per <section>, in document order.
const KEYS = () => {
  const m = isMobile();
  return [
    { cam: [0, 1.5, m ? 26 : 17], look: [0, 0, 0], uni: [m ? 0 : 10, m ? -6 : -0.5, 0], rotX: 0.15, ideas: 0, net: 0.12, labels: 1 }, // hero
    { cam: [0, 6, 22], look: [0, 0, 0], uni: [0, -1, 0], rotX: 0.3, ideas: 0, net: 0.2, labels: 0.6 }, // stats
    { cam: [0, 16, 14], look: [0, -2, 0], uni: [0, 0, 0], rotX: 0.05, ideas: 0, net: 0.35, labels: 1 }, // domains
    { cam: [0, 0.5, m ? 14 : 11], look: [0, 0, 0], uni: [m ? 0 : 7.5, m ? -4 : 0, 0], rotX: 0.6, ideas: 1, net: 0.1, labels: 0 }, // vision
    { cam: [-4, 2, 13], look: [0, 0, 0], uni: [m ? 0 : -6, m ? 3 : 0, 0], rotX: 0.4, ideas: 0.3, net: 0.15, labels: 0 }, // founder
    { cam: [0, -6, 18], look: [0, 0, 0], uni: [0, 0, 0], rotX: -0.2, ideas: 0, net: 0.25, labels: 0.4 }, // culture
    { cam: [0, 1, 28], look: [0, 0, 0], uni: [0, 0, 0], rotX: 0.2, ideas: 0.6, net: 0.4, labels: 0 }, // join
  ];
};

const sections = [...document.querySelectorAll('main > section')];
let scrollT = 0;
function readScroll() {
  // Each section's keyframe is hit exactly when the section is centred in the viewport.
  const mid = scrollY + innerHeight * 0.5;
  const centers = sections.map((s) => s.offsetTop + s.offsetHeight * 0.5);
  if (mid <= centers[0]) { scrollT = 0; return; }
  for (let i = 0; i < centers.length - 1; i++) {
    if (mid < centers[i + 1]) { scrollT = i + (mid - centers[i]) / (centers[i + 1] - centers[i]); return; }
  }
  scrollT = centers.length - 1;
}
addEventListener('scroll', readScroll, { passive: true });
readScroll();

const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const smooth = (t) => t * t * (3 - 2 * t);
function sample(t) {
  const keys = KEYS();
  const i = Math.min(Math.floor(t), keys.length - 1);
  const j = Math.min(i + 1, keys.length - 1);
  const k = smooth(t - i);
  const a = keys[i], b = keys[j];
  return {
    cam: lerp3(a.cam, b.cam, k), look: lerp3(a.look, b.look, k), uni: lerp3(a.uni, b.uni, k),
    rotX: a.rotX + (b.rotX - a.rotX) * k, ideas: a.ideas + (b.ideas - a.ideas) * k, net: a.net + (b.net - a.net) * k, labels: a.labels + (b.labels - a.labels) * k,
  };
}

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */
const pointer = new THREE.Vector2(-10, -10);
const parallax = { x: 0, y: 0 };
let clientX = 0, clientY = 0;
addEventListener('pointermove', (e) => {
  clientX = e.clientX; clientY = e.clientY;
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
});

const raycaster = new THREE.Raycaster();
const tooltip = document.getElementById('tooltip');
let hovered = -1;
let cardHovered = -1;

const cards = [...document.querySelectorAll('.card')];
cards.forEach((c) => {
  c.addEventListener('mouseenter', () => (cardHovered = +c.dataset.index));
  c.addEventListener('mouseleave', () => (cardHovered = -1));
});

function isOverUI(x, y) {
  const el = document.elementFromPoint(x, y);
  return el && el.closest('a, button, .card, .stat, .steps li, .pillars, .nav, h1, h2, .lead');
}

function updateHover() {
  if (isOverUI(clientX, clientY)) { setHovered(-1); return; }
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(planetMeshes, false)[0];
  setHovered(hit ? hit.object.userData.index : -1);
}

function setHovered(i) {
  if (i === hovered) {
    if (i >= 0) positionTooltip();
    return;
  }
  hovered = i;
  document.body.style.cursor = i >= 0 ? 'pointer' : '';
  cards.forEach((c) => c.classList.toggle('active', +c.dataset.index === i));
  if (i >= 0) {
    const p = PRODUCTS[i];
    tooltip.innerHTML = `<small>${p.domain}</small><b style="color:${p.color}">${p.name}</b><p>${p.desc}</p>`;
    tooltip.classList.add('show');
    positionTooltip();
  } else tooltip.classList.remove('show');
}
function positionTooltip() {
  const x = Math.min(clientX + 18, innerWidth - 280);
  const y = Math.min(clientY + 18, innerHeight - 140);
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

addEventListener('click', (e) => {
  if (hovered < 0 || isOverUI(e.clientX, e.clientY)) return;
  const card = cards[hovered];
  card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  card.classList.add('active');
  setTimeout(() => card.classList.remove('active'), 1800);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
  readScroll();
});

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */
const clock = new THREE.Clock();
let smoothT = scrollT;
const lookAt = new THREE.Vector3();
const tmp = new THREE.Vector3();
const corePos = new THREE.Vector3();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  coreUniforms.uTime.value = time;

  smoothT += (scrollT - smoothT) * Math.min(1, dt * 3.5);
  const s = sample(smoothT);

  parallax.x += (pointer.x * 0.8 - parallax.x) * dt * 2;
  parallax.y += (pointer.y * 0.5 - parallax.y) * dt * 2;

  camera.position.set(s.cam[0] + parallax.x, s.cam[1] + parallax.y, s.cam[2]);
  lookAt.set(...s.look);
  camera.lookAt(lookAt);

  universe.position.set(...s.uni);
  universe.rotation.x = s.rotX;
  universe.rotation.y += dt * 0.03;

  // Core
  core.rotation.y += dt * 0.25;
  shell.rotation.x -= dt * 0.15;
  shell2.rotation.z += dt * 0.08;
  const pulse = 1 + Math.sin(time * 1.6) * 0.03 + s.ideas * 0.15;
  coreMesh.scale.setScalar(pulse);
  coreGlow.material.opacity = 0.3 + s.ideas * 0.3 + Math.sin(time * 2) * 0.05;
  coreLight.position.copy(universe.position);

  // Planets
  const anyHover = hovered >= 0 || cardHovered >= 0;
  planets.forEach((p, i) => {
    const active = hovered === i || cardHovered === i;
    p.hover += ((active ? 1 : 0) - p.hover) * Math.min(1, dt * 8);
    p.angle += dt * p.speed * (1 - p.hover * 0.9);
    p.mesh.position.set(Math.cos(p.angle) * p.radius, Math.sin(p.angle * 2 + i) * 0.15, Math.sin(p.angle) * p.radius);
    p.mesh.rotation.y += dt * 0.5;
    p.mesh.scale.setScalar(1 + p.hover * 0.8);
    p.mesh.material.emissiveIntensity = 0.4 + p.hover * 1.2;
    p.ring.material.opacity = 0.14 + p.hover * 0.5;
    p.label.style.opacity = active ? 1 : (anyHover ? 0.25 : s.labels);
  });

  // Network
  core.getWorldPosition(corePos);
  universe.worldToLocal(corePos);
  let k = 0;
  const local = planets.map((p) => universe.worldToLocal(p.mesh.getWorldPosition(new THREE.Vector3())));
  local.forEach((v) => {
    netPositions.set([corePos.x, corePos.y, corePos.z, v.x, v.y, v.z], k); k += 6;
  });
  for (let i = 0; i < local.length - 1; i++) {
    const a = local[i], b = local[i + 1];
    netPositions.set([a.x, a.y, a.z, b.x, b.y, b.z], k); k += 6;
  }
  netGeo.attributes.position.needsUpdate = true;
  netMat.opacity = s.net;

  // Idea stream
  ideaMat.opacity = s.ideas * 0.9;
  if (s.ideas > 0.01) {
    for (let i = 0; i < IDEAS; i++) {
      const d = ideaSeed[i];
      d.t -= dt * d.s * (reduceMotion ? 0.3 : 1);
      if (d.t <= 0) { d.t = 1; d.a = Math.random() * Math.PI * 2; d.y = (Math.random() - 0.5) * 8; }
      const r = 1.4 + d.t * 16;
      const a = d.a + (1 - d.t) * 4;
      ideaPos[i * 3] = Math.cos(a) * r;
      ideaPos[i * 3 + 1] = d.y * d.t;
      ideaPos[i * 3 + 2] = Math.sin(a) * r;
    }
    ideaGeo.attributes.position.needsUpdate = true;
  }

  coreLabel.style.opacity = s.labels;
  starsFar.rotation.y = time * 0.004;
  starsNear.rotation.y = -time * 0.008;
  tmp.set(0, smoothT * 0.15, 0);
  starsNear.rotation.x = tmp.y;

  updateHover();
  composer.render();
  labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
