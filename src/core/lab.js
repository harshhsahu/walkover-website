import * as THREE from 'three';
import { labelSprite } from './textures.js';
import { glowSprite } from './world.js';
import { THEME } from './theme.js';

const EXPERIMENTS = [
  { label: 'Messaging prototype', color: '#e8432f', make: () => new THREE.TorusKnotGeometry(0.45, 0.12, 120, 12) },
  { label: 'Automation flows', color: '#0e9fd8', make: 'rings' },
  { label: 'AI agents', color: '#6d4cf0', make: 'cloud' },
  { label: 'Ledger engine', color: '#13a86b', make: 'stack' },
  { label: 'Brand kits', color: '#e0307f', make: 'helix' },
];

function experiment({ color, make }) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.3 });
  if (typeof make === 'function') {
    g.add(new THREE.Mesh(make(), mat));
  } else if (make === 'rings') {
    [0.35, 0.55, 0.75].forEach((r, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 12, 64), mat);
      m.rotation.set(i * 0.9, i * 0.5, 0);
      m.userData.spin = 0.6 + i * 0.4;
      g.add(m);
    });
  } else if (make === 'cloud') {
    const geo = new THREE.IcosahedronGeometry(0.6, 2);
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.06 })));
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), mat));
    g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })));
  } else if (make === 'stack') {
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.7 - i * 0.12, 0.14, 0.7 - i * 0.12), mat);
      m.position.y = i * 0.2 - 0.3;
      m.userData.spin = (i % 2 ? -1 : 1) * (0.3 + i * 0.2);
      g.add(m);
    }
  } else if (make === 'helix') {
    const sg = new THREE.SphereGeometry(0.06, 12, 12);
    for (let i = 0; i < 24; i++) {
      const a = i * 0.55;
      [0, Math.PI].forEach((off) => {
        const m = new THREE.Mesh(sg, mat);
        m.position.set(Math.cos(a + off) * 0.3, i * 0.05 - 0.6, Math.sin(a + off) * 0.3);
        g.add(m);
      });
    }
  }
  g.add(glowSprite(color, 2.6, 0.35));
  return g;
}

function bench(color, empty = false) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.08, 1.2),
    new THREE.MeshStandardMaterial({ color: THEME.bench, roughness: 0.5, metalness: 0.4, transparent: empty, opacity: empty ? 0.35 : 1 })
  );
  top.position.y = 0.95;
  g.add(top);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(top.geometry),
    empty
      ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08 })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })
  );
  edges.position.copy(top.position);
  if (empty) edges.computeLineDistances();
  g.add(edges);
  if (!empty) {
    const legGeo = new THREE.BoxGeometry(0.06, 0.95, 0.06);
    const legMat = new THREE.MeshStandardMaterial({ color: THEME.benchLeg });
    [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(([x, z]) => {
      const l = new THREE.Mesh(legGeo, legMat);
      l.position.set(x, 0.475, z);
      g.add(l);
    });
    const lamp = new THREE.PointLight(color, 4, 5, 2);
    lamp.position.set(0, 2.2, 0);
    g.add(lamp);
  }
  return g;
}

/**
 * The Lab — a workshop of glowing experiments with one empty bench "for you".
 * Built around local origin; benches run down -z.
 */
export function buildLab({ withLabels = true } = {}) {
  const group = new THREE.Group();

  // room outline
  const room = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(14, 6, 30)),
    new THREE.LineBasicMaterial({ color: THEME.labLine, transparent: true, opacity: 0.6 })
  );
  room.position.set(0, 3, -12);
  group.add(room);
  // ceiling light strips
  for (let i = 0; i < 6; i++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(10, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: '#e7e9ec' }));
    strip.position.set(0, 5.9, -1 - i * 4.6);
    group.add(strip);
  }
  // floor panel
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 30),
    new THREE.MeshStandardMaterial({ color: THEME.labFloor, roughness: 0.6, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.015, -12);
  group.add(floor);

  const slots = [[-4, -4], [4, -4], [-4, -12], [4, -12], [-4, -20]];
  const items = EXPERIMENTS.map((e, i) => {
    const b = bench(e.color);
    b.position.set(slots[i][0], 0, slots[i][1]);
    b.rotation.y = slots[i][0] < 0 ? 0.25 : -0.25;
    const ex = experiment(e);
    ex.position.y = 2;
    b.add(ex);
    if (withLabels) {
      const l = labelSprite([{ text: e.label, size: 30, weight: 600 }], { worldHeight: 0.42, border: e.color + '66' });
      l.position.y = 3.15;
      b.add(l);
    }
    group.add(b);
    return { bench: b, ex, phase: i };
  });

  // the empty bench
  const empty = bench('#E8462D', true);
  empty.position.set(4, 0, -20);
  empty.rotation.y = -0.25;
  const spot = new THREE.Mesh(
    new THREE.CircleGeometry(1.8, 48),
    new THREE.MeshBasicMaterial({ color: '#E8462D', transparent: true, opacity: 0.18, depthWrite: false })
  );
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = 0.03;
  empty.add(spot);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.6, 6, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#E8462D', transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.y = 3;
  empty.add(beam);
  const yours = labelSprite(
    [{ text: 'RESERVED', size: 20, weight: 500, color: '#E8462D' }, { text: 'Your bench', size: 40, weight: 700 }],
    { worldHeight: 0.8, border: '#E8462D' }
  );
  yours.position.y = 2.4;
  empty.add(yours);
  group.add(empty);

  group.userData.update = (time) => {
    items.forEach(({ ex, phase }) => {
      ex.rotation.y = time * 0.6 + phase;
      ex.position.y = 2 + Math.sin(time * 1.4 + phase) * 0.1;
      ex.children.forEach((c) => {
        if (c.userData.spin) c.rotation.y += c.userData.spin * 0.01;
      });
    });
    yours.position.y = 2.4 + Math.sin(time * 2) * 0.06;
    spot.material.opacity = 0.16 + (Math.sin(time * 2) + 1) * 0.06;
  };
  group.userData.emptyBench = empty;
  return group;
}
