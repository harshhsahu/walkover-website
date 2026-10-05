import * as THREE from 'three';

const UI = 'a, button, input, textarea, select, label, summary, .box, .card, .nav, .hud, .side-card, .filters';

/**
 * Hover / click picking for 3D objects, ignoring the pointer while it is over page UI.
 * `getTargets` returns the meshes to test; each must carry an identifying userData.
 */
export function createPicker(stage, getTargets, { onChange, onClick } = {}) {
  const ray = new THREE.Raycaster();
  let current = null;
  let overUI = false;

  addEventListener('pointermove', (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overUI = !!el?.closest(UI);
  });

  stage.onFrame(() => {
    let hit = null;
    if (!overUI && stage.client.x >= 0) {
      ray.setFromCamera(stage.pointer, stage.camera);
      hit = ray.intersectObjects(getTargets(), false)[0]?.object ?? null;
    }
    if (hit !== current) {
      current = hit;
      document.body.style.cursor = hit ? 'pointer' : '';
      onChange?.(hit);
    }
  });

  addEventListener('click', (e) => {
    if (current && !overUI) onClick?.(current, e);
  });

  return { get current() { return current; } };
}
