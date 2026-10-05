import * as THREE from 'three';
import { PRODUCTS, iconURL } from '../data/products.js';
import { labelSprite, windowTexture, glowTexture } from './textures.js';
import { glowSprite } from './world.js';
import { THEME } from './theme.js';

function bodyMat(color, facade = THEME.building) {
  // light facades with tinted glass windows
  const tex = windowTexture(0.6, color, THEME.windowBg);
  return new THREE.MeshStandardMaterial({ color: facade, map: tex, roughness: 0.55, metalness: 0.05 });
}

function withEdges(mesh, color, opacity = 0.9) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  mesh.add(e);
  return mesh;
}

/** Each product gets a distinct landmark silhouette. Returns { group, top, hits }. */
function landmark(p) {
  const g = new THREE.Group();
  const hits = [];
  const H = p.height;
  const facade = '#' + new THREE.Color(p.color).lerp(new THREE.Color('#ffffff'), 0.2).getHexString();
  const add = (geo, x, y, z, mat = bodyMat(p.color, facade)) => {
    const m = withEdges(new THREE.Mesh(geo, mat), p.color);
    m.position.set(x, y, z);
    m.userData.product = p;
    hits.push(m);
    g.add(m);
    return m;
  };
  let top = H;
  switch (p.shape) {
    case 'tower': {
      add(new THREE.BoxGeometry(2.6, H, 2.6), 0, H / 2, 0);
      add(new THREE.BoxGeometry(1.6, 3, 1.6), 0, H + 1.5, 0);
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4), new THREE.MeshBasicMaterial({ color: p.color }));
      ant.position.y = H + 5;
      g.add(ant);
      top = H + 7;
      break;
    }
    case 'bridge': {
      add(new THREE.BoxGeometry(1.8, H, 1.8), -2.2, H / 2, 0);
      add(new THREE.BoxGeometry(1.8, H * 0.8, 1.8), 2.2, (H * 0.8) / 2, 0);
      add(new THREE.BoxGeometry(4.4, 0.5, 1.2), 0, H * 0.62, 0);
      add(new THREE.BoxGeometry(4.4, 0.3, 0.9), 0, H * 0.35, 0);
      top = H + 1;
      break;
    }
    case 'dome': {
      add(new THREE.CylinderGeometry(3, 3.2, 2, 32), 0, 1, 0);
      const dome = add(new THREE.SphereGeometry(2.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), 0, 2, 0,
        new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.35, transparent: true, opacity: 0.55, roughness: 0.1 }));
      dome.children[0].material.opacity = 0.35;
      top = 5.5;
      break;
    }
    case 'vault': {
      add(new THREE.BoxGeometry(4, H * 0.45, 4), 0, (H * 0.45) / 2, 0);
      add(new THREE.BoxGeometry(3, H * 0.35, 3), 0, H * 0.45 + (H * 0.35) / 2, 0);
      add(new THREE.BoxGeometry(2, H * 0.2, 2), 0, H * 0.8 + (H * 0.2) / 2, 0);
      top = H + 1.5;
      break;
    }
    case 'cylinder': {
      add(new THREE.CylinderGeometry(1.4, 1.8, H, 24), 0, H / 2, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.06, 8, 64), new THREE.MeshBasicMaterial({ color: p.color }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = H * 0.7;
      ring.userData.spin = true;
      g.add(ring);
      top = H + 1.5;
      break;
    }
    case 'cluster': {
      [[-1.2, 0, H], [1.1, 0.6, H * 0.75], [0, -1.3, H * 0.55]].forEach(([x, z, h]) => add(new THREE.BoxGeometry(1.3, h, 1.3), x, h / 2, z));
      top = H + 1.5;
      break;
    }
    case 'stack': {
      for (let i = 0; i < 5; i++) {
        const h = H / 5;
        const m = add(new THREE.BoxGeometry(3 - i * 0.35, h, 3 - i * 0.35), (i % 2 ? 0.4 : -0.4), h / 2 + i * h, 0);
        m.rotation.y = i * 0.25;
      }
      top = H + 1.5;
      break;
    }
  }
  const beacon = glowSprite(p.color, 4, 0.7);
  beacon.position.y = top - 0.5;
  g.add(beacon);
  const light = new THREE.PointLight(p.color, 30, 18, 1.6);
  light.position.y = top * 0.6;
  g.add(light);
  const label = labelSprite(
    [{ text: p.domain.toUpperCase(), size: 18, weight: 500, color: p.color }, { text: p.name, size: 38, weight: 700 }],
    { worldHeight: 1.4, border: p.color + '88', icon: { url: iconURL(p), letter: p.name[0], color: p.color } }
  );
  label.position.y = top + 1.4;
  g.add(label);
  g.position.set(p.pos[0], 0, p.pos[1]);
  return { group: g, top, hits, label, beacon, product: p };
}

/**
 * The product city: one landmark per product, filler skyline around it and
 * glowing "messages" travelling between the landmarks.
 */
export function buildCity({ mobile = false } = {}) {
  const group = new THREE.Group();
  const landmarks = PRODUCTS.map(landmark);
  landmarks.forEach((l) => group.add(l.group));

  // filler skyline
  const spots = [];
  for (let x = -26; x <= 26; x += 3.6) {
    for (let z = -118; z >= -166; z -= 3.6) {
      if (Math.abs(x) < 2.6) continue; // main street
      const nearLandmark = PRODUCTS.some((p) => Math.hypot(p.pos[0] - x, p.pos[1] - z) < 5);
      if (nearLandmark || Math.random() < (mobile ? 0.45 : 0.2)) continue;
      spots.push([x + (Math.random() - 0.5), z + (Math.random() - 0.5)]);
    }
  }
  const filler = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bodyMat(THEME.fillerTint), spots.length);
  const d = new THREE.Object3D();
  spots.forEach(([x, z], i) => {
    const dist = Math.hypot(x, z + 142);
    const h = THREE.MathUtils.clamp(2 + Math.random() * 7 - dist * 0.12, 1.2, 9);
    const w = 1.6 + Math.random() * 1.2;
    d.position.set(x, h / 2, z);
    d.scale.set(w, h, w);
    d.updateMatrix();
    filler.setMatrixAt(i, d.matrix);
  });
  group.add(filler);

  // street glow
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 52),
    new THREE.MeshBasicMaterial({ color: '#E8462D', transparent: true, opacity: 0.14, depthWrite: false })
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0.03, -142);
  group.add(street);

  // messages between landmarks
  const N = mobile ? 160 : 360;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const msgs = Array.from({ length: N }, () => newMsg());
  function newMsg() {
    const a = (Math.random() * landmarks.length) | 0;
    let b = (Math.random() * landmarks.length) | 0;
    if (b === a) b = (b + 1) % landmarks.length;
    return { a, b, t: Math.random(), s: 0.15 + Math.random() * 0.25 };
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const particles = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.35, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false,
  }));
  group.add(particles);
  const tops = landmarks.map((l) => new THREE.Vector3(l.group.position.x, l.top * 0.8, l.group.position.z));
  const colors = landmarks.map((l) => new THREE.Color(l.product.color));
  const v = new THREE.Vector3();
  const mid = new THREE.Vector3();

  const hits = landmarks.flatMap((l) => l.hits);

  group.userData = {
    landmarks,
    hits,
    update(dt, time, activeId = null) {
      msgs.forEach((m, i) => {
        m.t += dt * m.s;
        if (m.t >= 1) Object.assign(m, newMsg(), { t: 0 });
        const A = tops[m.a];
        const B = tops[m.b];
        mid.copy(A).lerp(B, 0.5);
        mid.y += 6 + A.distanceTo(B) * 0.25;
        const t = m.t;
        v.set(0, 0, 0).addScaledVector(A, (1 - t) * (1 - t)).addScaledVector(mid, 2 * (1 - t) * t).addScaledVector(B, t * t);
        pos.set([v.x, v.y, v.z], i * 3);
        const c = colors[m.a];
        col.set([c.r, c.g, c.b], i * 3);
      });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      landmarks.forEach((l) => {
        const on = activeId === l.product.id;
        const s = on ? 1.35 : 1;
        l.beacon.scale.lerp(new THREE.Vector3(4 * s, 4 * s, 1), 0.15);
        l.beacon.material.opacity = (on ? 0.95 : 0.6) + Math.sin(time * 2 + l.top) * 0.08;
        l.group.children.forEach((c) => {
          if (c.userData.spin) c.rotation.z = time * 0.5;
        });
      });
    },
  };
  return group;
}
