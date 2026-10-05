import '../styles/main.css';
import * as THREE from 'three';
import { mountLayout, tooltip, initReveal, ink, productTip } from '../core/layout.js';
import { createStage, addLights, isMobile, reduceMotion } from '../core/stage.js';
import { anchorTracker, sampleKeys, damp, windowOf } from '../core/scroll.js';
import { fontsReady, labelSprite } from '../core/textures.js';
import { makeStars, makeGround, makeSeed, makeFootprints, makeSignpost, makeTree, makeRoots, makePlantedIdea } from '../core/world.js';
import { buildLab } from '../core/lab.js';
import { buildCity } from '../core/city.js';
import { createPicker } from '../core/picker.js';
import { wireForm, ideaFormHTML, ideaFormLabels, ideaSubject } from '../core/forms.js';
import { PRODUCTS, ERAS, iconHTML } from '../data/products.js';
import { MILESTONES } from '../data/milestones.js';

mountLayout('home');

/* ---------- DOM content ---------- */
document.querySelectorAll('.milestone').forEach((box) => {
  const m = MILESTONES[+box.dataset.m];
  box.style.setProperty('--c', m.color);
  const icons = m.era ? `<div class="icon-row">${PRODUCTS.filter((p) => p.era === m.era).map((p) => `<span class="tip" title="${p.name}">${iconHTML(p, 36)}</span>`).join('')}</div>` : '';
  box.innerHTML = `<span class="num" style="color:${ink(m.color)};margin-bottom:10px">${m.year}</span><h3>${m.title}</h3><p class="muted">${m.text}</p>${icons}`;
});

const card = (p) => {
  const inner = `<div class="card-head">${iconHTML(p, 44)}<div><small>${p.domain}</small><h3>${p.name}</h3></div></div><p>${p.desc}</p>`;
  return p.url
    ? `<a class="card reveal" href="${p.url}" target="_blank" rel="noopener" style="--c:${p.color}" data-id="${p.id}">${inner}<span class="go">Visit ${p.name} ↗</span></a>`
    : `<div class="card reveal soon" style="--c:${p.color}" data-id="${p.id}">${inner}<span class="go">Link coming soon</span></div>`;
};
const grid = document.getElementById('product-grid');
grid.innerHTML = Object.entries(ERAS).map(([era, e]) =>
  `<div class="era-head"><b>${e.label}</b><span>${e.title}</span></div>${PRODUCTS.filter((p) => p.era === era).map(card).join('')}`
).join('');

document.getElementById('idea-slot').innerHTML = ideaFormHTML;
initReveal();

/* ---------- chapter rail ---------- */
const anchors = [...document.querySelectorAll('[data-anchor]')];
const chapterOf = anchors.map((a) => +a.closest('[data-ch]').dataset.ch);
const railLinks = [...document.querySelectorAll('.rail a')];
const tracker = anchorTracker(anchors);

/* ---------- 3D ---------- */
const stage = createStage({ fog: 0.009 });
let activeProduct = null;

if (stage) {
  await fontsReady();
  const { scene, camera } = stage;
  addLights(scene, { ambient: 0.3 });

  const stars = makeStars({ count: isMobile() ? 2000 : 4500 });
  scene.add(stars);
  const ground = makeGround();
  ground.position.z = -90;
  scene.add(ground);

  // the seed
  const seed = makeSeed();
  seed.position.set(0, 1.1, 0);
  scene.add(seed);

  // the walk path + footprints
  const pathPts = [];
  for (let z = 4; z >= -178; z -= 6) pathPts.push(new THREE.Vector3(Math.sin(z * 0.07) * 0.9 * (z < -110 ? 0 : 1), 0, z));
  const path = new THREE.CatmullRomCurve3(pathPts);
  const footprints = makeFootprints(path);
  scene.add(footprints);

  // milestone signposts
  const signZ = (i) => -12 - i * 9;
  const signX = (i) => (i % 2 ? 2.6 : -2.6);
  const signs = MILESTONES.map((m, i) => {
    const s = makeSignpost(m);
    s.position.set(signX(i), 0, signZ(i));
    scene.add(s);
    return s;
  });

  // the lab
  const lab = buildLab();
  lab.position.z = -58;
  scene.add(lab);

  // growth: tree + roots to the city
  const TREE = new THREE.Vector3(-3.5, 0, -96);
  const tree = makeTree({ height: 7.5, depth: 4 });
  tree.position.copy(TREE);
  scene.add(tree);
  const city = buildCity({ mobile: isMobile() });
  scene.add(city);
  const rootTargets = PRODUCTS.map((p) => Object.assign(new THREE.Vector3(p.pos[0], 0, p.pos[1]), { userData: { color: p.color } }));
  const roots = makeRoots(TREE, rootTargets);
  scene.add(roots);

  // your plot
  const PLOT = new THREE.Vector3(0, 0, -174);
  const plot = new THREE.Group();
  plot.position.copy(PLOT);
  const plotEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(6, 0.01, 6)),
    new THREE.LineDashedMaterial({ color: '#E8462D', dashSize: 0.3, gapSize: 0.18 })
  );
  plotEdge.computeLineDistances();
  plot.add(plotEdge);
  const plotFill = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshBasicMaterial({ color: '#E8462D', transparent: true, opacity: 0.05, depthWrite: false })
  );
  plotFill.rotation.x = -Math.PI / 2;
  plotFill.position.y = 0.02;
  plot.add(plotFill);
  const plotLabel = labelSprite([{ text: 'YOUR PLOT', size: 26, weight: 600, color: '#E8462D' }], { worldHeight: 0.5, border: '#E8462D66' });
  plotLabel.position.set(0, 0.6, 3.6);
  plot.add(plotLabel);
  scene.add(plot);

  const planted = [];
  function plantIdea(text) {
    const n = planted.length;
    const g = makePlantedIdea(text, { seed: 11 + n * 7, leafColor: PRODUCTS[n % PRODUCTS.length].color });
    g.position.set(((n % 3) - 1) * 1.8, 0, ((Math.floor(n / 3) % 3) - 1) * 1.8);
    plot.add(g);
    planted.push(g);
  }

  wireForm(document.querySelector('.idea-form'), {
    subject: ideaSubject,
    labels: ideaFormLabels,
    onSubmit: (d) => plantIdea(d.idea.trim()),
  });

  /* ---------- camera keyframes, one per [data-anchor] ---------- */
  const keys = () => {
    const m = isMobile();
    const k = [];
    // 0 seed
    k.push(m ? { cam: [0, 2.6, 7.5], look: [0, 2.6, 0], energy: 1 } : { cam: [2.2, 2, 8], look: [-2.4, 1.5, 0], energy: 1 });
    // 1-5 milestones
    MILESTONES.forEach((_, i) => {
      const x = signX(i), z = signZ(i);
      k.push(m ? { cam: [x * 0.2, 2.4, z + 9], look: [x * 0.4, 1.4, z], energy: 0 } : { cam: [-x * 0.35, 1.9, z + 6.5], look: [x * 0.3, 2.5, z], energy: 0 });
    });
    // 6 lab overview, 7 your bench
    k.push({ cam: [0, 3.4, -52], look: [0, 1.6, -68], energy: 0 });
    k.push(m ? { cam: [1.5, 2.4, -68], look: [4, 1.3, -78], energy: 0 } : { cam: [0, 2.2, -70], look: [2.6, 1.6, -78], energy: 0 });
    // 8 growth
    k.push(m ? { cam: [-1, 3.5, -82], look: [-3.5, 3, -96], energy: 0 } : { cam: [2, 3.2, -84], look: [-1.2, 3.8, -96], energy: 0 });
    // 9 city overview, 10 city cards
    k.push({ cam: [0, 17, -103], look: [0, 4, -138], energy: 0 });
    k.push({ cam: [18, 11, -118], look: [0, 5, -142], energy: 0 });
    // 11 plot
    k.push(m ? { cam: [0, 6, -162], look: [0, 0.5, -174], energy: 0 } : { cam: [1.5, 5, -162], look: [-3.2, 1.2, -174], energy: 0 });
    return k;
  };
  let KEYS = keys();
  stage.onResize(() => (KEYS = keys()));

  /* ---------- picking: city landmarks ---------- */
  const cards = [...grid.querySelectorAll('.card')];
  const setActive = (id) => {
    activeProduct = id;
    cards.forEach((c) => c.classList.toggle('active', c.dataset.id === id));
  };
  cards.forEach((c) => {
    c.addEventListener('mouseenter', () => setActive(c.dataset.id));
    c.addEventListener('mouseleave', () => setActive(null));
  });
  createPicker(stage, () => city.userData.hits, {
    onChange(hit) {
      const p = hit?.userData.product;
      setActive(p?.id ?? null);
      if (p) tooltip.show(productTip(p), stage.client.x, stage.client.y);
      else tooltip.hide();
    },
    onClick(hit) {
      const { url } = hit.userData.product;
      if (url) window.open(url, '_blank', 'noopener');
    },
  });
  addEventListener('pointermove', (e) => activeProduct && tooltip.move(e.clientX, e.clientY));

  /* ---------- frame ---------- */
  let t = tracker.t;
  const look = new THREE.Vector3();
  const par = { x: 0, y: 0 };

  stage.onFrame((dt, time) => {
    t = damp(t, tracker.t, reduceMotion ? 20 : 3.2, dt);
    const s = sampleKeys(KEYS, t);
    par.x = damp(par.x, stage.pointer.x * 0.35, 2, dt);
    par.y = damp(par.y, stage.pointer.y * 0.2, 2, dt);
    camera.position.set(s.cam[0] + par.x, s.cam[1] + par.y, s.cam[2]);
    look.set(...s.look);
    camera.lookAt(look);
    stars.position.copy(camera.position);

    seed.userData.update(time, s.energy);
    footprints.userData.update(camera.position.z);
    signs.forEach((sg) => sg.userData.update(time));
    lab.userData.update(time);
    tree.userData.setGrowth(windowOf(t, 7.15, 7.95));
    roots.userData.setGrowth(windowOf(t, 7.8, 9));
    city.userData.update(dt, time, activeProduct);
    plotFill.material.opacity = 0.04 + (Math.sin(time * 2) + 1) * 0.03;

    planted.forEach((g) => g.userData.update(time));
  });
} else {
  wireForm(document.querySelector('.idea-form'), { subject: ideaSubject, labels: ideaFormLabels });
}

const updateRail = () => {
  const ch = chapterOf[Math.round(tracker.t)] ?? 0;
  railLinks.forEach((a) => a.classList.toggle('on', +a.dataset.ch === ch));
};
addEventListener('scroll', updateRail, { passive: true });
updateRail();
