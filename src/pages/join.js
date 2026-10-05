import '../styles/main.css';
import * as THREE from 'three';
import { mountLayout, initReveal } from '../core/layout.js';
import { createStage, addLights, isMobile, reduceMotion } from '../core/stage.js';
import { anchorTracker, sampleKeys, damp } from '../core/scroll.js';
import { fontsReady } from '../core/textures.js';
import { makeStars, makeGround, makeSeed, makeTree, makePlantedIdea } from '../core/world.js';
import { wireForm, ideaFormHTML, ideaFormLabels, ideaSubject } from '../core/forms.js';
import { PRODUCTS } from '../data/products.js';

mountLayout('join');
document.getElementById('idea-slot').innerHTML = ideaFormHTML;
initReveal();

const tracker = anchorTracker([...document.querySelectorAll('[data-anchor]')]);
const stage = createStage({ fog: 0.02 });
let plant = () => {};

if (stage) {
  await fontsReady();
  const { scene, camera } = stage;
  addLights(scene);
  const stars = makeStars({ count: 3000 });
  scene.add(stars);
  scene.add(makeGround());

  // a garden of grown ideas around one fresh seed
  const garden = [];
  const spots = [[-7, -6], [-3, -10], [4, -9], [8, -5], [-9, -14], [10, -13], [1, -16]];
  spots.forEach(([x, z], i) => {
    const tr = makeTree({ height: 3.5 + (i % 3), depth: 3, seed: 3 + i * 13, leafColor: PRODUCTS[i].color });
    tr.position.set(x, 0, z);
    tr.userData.setGrowth(1);
    scene.add(tr);
    garden.push(tr);
  });
  const seed = makeSeed();
  seed.position.set(0, 1, -2);
  scene.add(seed);

  const planted = [];
  plant = (text) => {
    const n = planted.length;
    const g = makePlantedIdea(text, { seed: 29 + n * 5, title: 'YOUR IDEA' });
    g.position.set(((n % 3) - 1) * 2.4, 0, -2 + Math.floor(n / 3) * -2.4);
    scene.add(g);
    seed.visible = false;
    planted.push(g);
  };

  const m = isMobile();
  const KEYS = [
    { cam: m ? [0, 3.5, 9] : [-1, 2.6, 7], look: m ? [0, 3, -4] : [3, 2, -6] },
    { cam: [6, 8, 10], look: [0, 1, -10] },
    { cam: m ? [0, 4, 6] : [-3, 3.5, 5], look: m ? [0, 1.5, -3] : [2.4, 1.6, -3] },
    { cam: [0, 14, 12], look: [0, 0, -10] },
  ];

  let t = tracker.t;
  const look = new THREE.Vector3();
  stage.onFrame((dt, time) => {
    t = damp(t, tracker.t, reduceMotion ? 20 : 3, dt);
    const s = sampleKeys(KEYS, t);
    camera.position.set(s.cam[0] + stage.pointer.x * 0.4, s.cam[1] + stage.pointer.y * 0.25, s.cam[2]);
    look.set(...s.look);
    camera.lookAt(look);
    stars.position.copy(camera.position);
    seed.userData.update(time, 0.5);
    planted.forEach((g) => g.userData.update(time));
    garden.forEach((g, i) => (g.rotation.y = Math.sin(time * 0.3 + i) * 0.05));
  });
}

wireForm(document.querySelector('.idea-form'), {
  subject: ideaSubject,
  labels: ideaFormLabels,
  onSubmit: (d) => plant(d.idea.trim()),
});
