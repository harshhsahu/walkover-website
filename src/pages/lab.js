import '../styles/main.css';
import * as THREE from 'three';
import { mountLayout } from '../core/layout.js';
import { createStage, addLights, isMobile, reduceMotion } from '../core/stage.js';
import { anchorTracker, sampleKeys, damp } from '../core/scroll.js';
import { fontsReady } from '../core/textures.js';
import { makeStars, makeGround } from '../core/world.js';
import { buildLab } from '../core/lab.js';

mountLayout('lab');

const tracker = anchorTracker([...document.querySelectorAll('[data-anchor]')]);
const stage = createStage({ fog: 0.014 });

if (stage) {
  await fontsReady();
  const { scene, camera } = stage;
  addLights(scene, { ambient: 0.4 });
  const stars = makeStars({ count: 2500 });
  scene.add(stars);
  scene.add(makeGround());
  const lab = buildLab();
  scene.add(lab);

  const m = isMobile();
  const KEYS = [
    { cam: m ? [0, 3, 8] : [-1.5, 3.2, 4.5], look: m ? [0, 2.4, -10] : [3, 1.6, -9] },
    { cam: [2, 2.4, 2], look: [-3.8, 1.8, -6] },
    { cam: [-2, 2.6, -6], look: [3.8, 1.8, -12] },
    { cam: [0, 7, 0], look: [0, 0, -14] },
    { cam: m ? [1, 2.4, -11] : [-1.5, 2.2, -12], look: m ? [4, 1.4, -20] : [5.5, 1.6, -20] },
    { cam: [0, 10, 12], look: [0, 0, -12] },
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
    lab.userData.update(time);
  });
}
