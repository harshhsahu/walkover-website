import '../styles/main.css';
import * as THREE from 'three';
import { mountLayout, initReveal, ink } from '../core/layout.js';
import { createStage, addLights, isMobile, reduceMotion } from '../core/stage.js';
import { anchorTracker, sampleKeys, damp } from '../core/scroll.js';
import { fontsReady } from '../core/textures.js';
import { makeStars, makeGround, makeSeed, makeSignpost } from '../core/world.js';
import { MILESTONES } from '../data/milestones.js';

mountLayout('visionary');

// one section per milestone, alternating sides (the signpost sits opposite the text)
document.getElementById('journey').innerHTML = MILESTONES.map((m, i) => `
  <section class="section${i % 2 ? '' : ' right'}" data-anchor>
    <div class="copy reveal">
      <div class="box" style="--c:${m.color}">
        <span class="num" style="color:${ink(m.color)};margin-bottom:10px">${m.year}</span>
        <h3>${m.title}</h3><p class="muted">${m.text}</p>
      </div>
    </div>
  </section>`).join('');
initReveal();

const tracker = anchorTracker([...document.querySelectorAll('[data-anchor]')]);
const stage = createStage({ fog: 0.02 });

if (stage) {
  await fontsReady();
  const { scene, camera } = stage;
  addLights(scene);
  const stars = makeStars();
  scene.add(stars);
  scene.add(makeGround());

  const ORB = new THREE.Vector3(5, 2.6, -4);
  const orb = makeSeed({ size: 1.1 });
  orb.position.copy(ORB);
  scene.add(orb);

  // the timeline runs along +x
  const sx = (i) => 16 + i * 10;
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ORB.x, 0.04, -4), new THREE.Vector3(sx(MILESTONES.length), 0.04, -4)]),
    new THREE.LineDashedMaterial({ color: '#E8462D', dashSize: 0.4, gapSize: 0.3, transparent: true, opacity: 0.6 })
  );
  line.computeLineDistances();
  scene.add(line);
  const signs = MILESTONES.map((m, i) => {
    const s = makeSignpost(m);
    s.position.set(sx(i), 0, -4);
    scene.add(s);
    return s;
  });

  const m = isMobile();
  const KEYS = [
    m ? { cam: [ORB.x, 4, 9], look: [ORB.x, 4.2, -4], energy: 1 } : { cam: [ORB.x - 1, 3, 8], look: [ORB.x - 4.5, 2.6, -4], energy: 1 },
    ...MILESTONES.map((_, i) => {
      const x = sx(i);
      const dir = i % 2 ? 1 : -1; // text on the right for even i → sign appears left
      return m ? { cam: [x, 2.4, 6], look: [x, 1.4, -4], energy: 0 } : { cam: [x - dir * 0.5, 2.4, 4.5], look: [x - dir * 3.4, 2.6, -4], energy: 0 };
    }),
    { cam: [sx(2), 9, 24], look: [sx(2), 1, -4], energy: 0.3 },
    { cam: [ORB.x, 3, 10], look: [ORB.x, 2.6, -4], energy: 1 },
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
    orb.userData.update(time, s.energy);
    signs.forEach((sg) => sg.userData.update(time));
  });
}
