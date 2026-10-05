import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { THEME } from './theme.js';

// `?snap` jumps the camera straight to each keyframe (handy for screenshots / slow devices)
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('snap');
// layout width (excludes overflow), so fixed full-screen elements can't feed back into it
const viewW = () => document.documentElement.clientWidth || innerWidth || 1;
export const isMobile = () => viewW() < 860;

/**
 * One full-screen WebGL stage per page: renderer + bloom + camera + frame loop.
 * Returns null when WebGL is unavailable so pages degrade to plain HTML.
 */
export function createStage({
  fov = 55,
  bloom = THEME.bloom,
  fog = 0.02,
  background = THEME.horizon, // horizon colour; the sky gradient fades up from it
} = {}) {
  const canvas = document.getElementById('scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    document.body.classList.add('no-webgl');
    return null;
  }
  const w = viewW;
  const h = () => innerHeight || 1;

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(w(), h(), false); // CSS sizes the canvas
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps whites white

  const scene = new THREE.Scene();
  scene.background = skyTexture(background);
  if (fog) scene.fog = new THREE.FogExp2(background, fog);

  const camera = new THREE.PerspectiveCamera(fov, w() / h(), 0.1, 600);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(w(), h()), bloom.strength, bloom.radius, bloom.threshold);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  const pointer = new THREE.Vector2(0, 0); // NDC, for parallax + picking
  const client = { x: -1, y: -1 };
  addEventListener('pointermove', (e) => {
    client.x = e.clientX;
    client.y = e.clientY;
    pointer.set((e.clientX / w()) * 2 - 1, -(e.clientY / h()) * 2 + 1);
  });

  const resizeCbs = [];
  let size = [w(), h()];
  function resize() {
    size = [w(), h()];
    camera.aspect = size[0] / size[1];
    camera.updateProjectionMatrix();
    renderer.setSize(size[0], size[1], false);
    composer.setSize(size[0], size[1]);
    resizeCbs.forEach((cb) => cb());
  }
  addEventListener('resize', resize);

  const frameCbs = [];
  const clock = new THREE.Clock();
  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    if (size[0] !== w() || size[1] !== h()) resize(); // catches viewport changes that skip the resize event
    frameCbs.forEach((cb) => cb(dt, time));
    composer.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    renderer, scene, camera, composer, bloomPass, pointer, client,
    onFrame: (cb) => frameCbs.push(cb),
    onResize: (cb) => resizeCbs.push(cb),
  };
}

/** Bright daylight sky: soft lavender overhead fading to a warm white horizon. */
function skyTexture(horizon) {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  const [top, mid, warm] = THEME.sky;
  grd.addColorStop(0, top);
  grd.addColorStop(0.5, mid);
  grd.addColorStop(0.82, warm);
  grd.addColorStop(1, horizon);
  g.fillStyle = grd;
  g.fillRect(0, 0, 2, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Standard lighting rig shared by the pages — bright daylight. */
export function addLights(scene, { ambient = 0.35, key = '#ffffff', rim = '#dfe2e6' } = {}) {
  scene.add(new THREE.AmbientLight('#ffffff', ambient + 0.75));
  scene.add(new THREE.HemisphereLight('#ffffff', '#eceef0', 1.2));
  const k = new THREE.DirectionalLight(key, 1.8);
  k.position.set(8, 14, 6);
  scene.add(k);
  const r = new THREE.DirectionalLight(rim, 1.0);
  r.position.set(-10, 6, -8);
  scene.add(r);
}
