import '../styles/main.css';
import * as THREE from 'three';
import { mountLayout, tooltip, initReveal, ink, productTip } from '../core/layout.js';
import { createStage, addLights, isMobile, reduceMotion } from '../core/stage.js';
import { anchorTracker, sampleKeys, damp } from '../core/scroll.js';
import { fontsReady } from '../core/textures.js';
import { makeStars, makeGround } from '../core/world.js';
import { buildCity } from '../core/city.js';
import { createPicker } from '../core/picker.js';
import { PRODUCTS, DOMAINS, ERAS, iconHTML } from '../data/products.js';

mountLayout('worlds');

document.getElementById('domain-tags').innerHTML = DOMAINS.map((d) => `<li>${d}</li>`).join('');
document.getElementById('districts').innerHTML = PRODUCTS.map((p, i) => `
  <section class="section${i % 2 ? ' right' : ''}" data-anchor data-id="${p.id}">
    <div class="copy reveal">
      <span class="eyebrow" style="color:${ink(p.color)}">District ${String(i + 1).padStart(2, '0')} · ${p.domain} · ${ERAS[p.era].label}</span>
      <div class="district-head">${iconHTML(p, 56)}<h2 style="margin:0">${p.name}</h2></div>
      <p class="lead">${p.desc}</p>
      ${p.url ? `<div class="cta-row"><a class="btn ghost" href="${p.url}" target="_blank" rel="noopener">Visit ${p.name} ↗</a></div>` : ''}
    </div>
  </section>`).join('');
initReveal();

const anchors = [...document.querySelectorAll('[data-anchor]')];
const tracker = anchorTracker(anchors);
const stage = createStage({ fog: 0.006 });

if (stage) {
  await fontsReady();
  const { scene, camera } = stage;
  addLights(scene);
  const stars = makeStars({ count: isMobile() ? 2000 : 4000 });
  scene.add(stars);
  const ground = makeGround();
  ground.position.z = -142;
  scene.add(ground);
  const city = buildCity({ mobile: isMobile() });
  scene.add(city);

  const CENTER = new THREE.Vector3(0, 0, -142);
  const keys = () => {
    const m = isMobile();
    const k = [{ cam: [0, 30, -96], look: [0, 2, -142], orbit: 1 }];
    city.userData.landmarks.forEach((l, i) => {
      const { x, z } = l.group.position;
      // the AI district sits behind the older rows, so view it from the far side of the city
      const back = l.product.era === 'ai';
      const dz = back ? -1 : 1;
      const side = (i % 2 ? -1 : 1) * dz; // text left → landmark on the right, and vice versa
      const h = l.top;
      k.push(m
        ? { cam: [x, h * 0.7 + 6, z + 16 * dz], look: [x, h * 0.75, z], orbit: 0 }
        : { cam: [x - side * 1.5, h * 0.6 + 5, z + 21 * dz], look: [x - side * 5, h * 0.5, z], orbit: 0 });
    });
    k.push({ cam: [0, 44, -110], look: [0, 0, -142], orbit: 1 });
    return k;
  };
  let KEYS = keys();
  stage.onResize(() => (KEYS = keys()));

  let hovered = null;
  createPicker(stage, () => city.userData.hits, {
    onChange(hit) {
      const p = hit?.userData.product;
      hovered = p?.id ?? null;
      if (p) tooltip.show(productTip(p), stage.client.x, stage.client.y);
      else tooltip.hide();
    },
    onClick: (hit) => hit.userData.product.url && window.open(hit.userData.product.url, '_blank', 'noopener'),
  });
  addEventListener('pointermove', (e) => hovered && tooltip.move(e.clientX, e.clientY));

  let t = tracker.t;
  const look = new THREE.Vector3();
  const pos = new THREE.Vector3();
  let spin = 0;
  stage.onFrame((dt, time) => {
    t = damp(t, tracker.t, reduceMotion ? 20 : 3, dt);
    const s = sampleKeys(KEYS, t);
    if (!reduceMotion) spin += dt * 0.06 * s.orbit;
    // orbit around the city centre on the overview shots
    pos.set(...s.cam).sub(CENTER).applyAxisAngle(THREE.Object3D.DEFAULT_UP, spin * s.orbit).add(CENTER);
    camera.position.set(pos.x + stage.pointer.x * 0.5, pos.y + stage.pointer.y * 0.3, pos.z);
    look.set(...s.look);
    camera.lookAt(look);
    stars.position.copy(camera.position);
    const focus = PRODUCTS[Math.round(t) - 1]?.id ?? null; // district currently in view
    city.userData.update(dt, time, hovered ?? focus);
  });
}
