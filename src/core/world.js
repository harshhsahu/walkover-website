import * as THREE from 'three';
import { glowTexture, labelSprite } from './textures.js';
import { THEME } from './theme.js';

// soft halos use normal blending so they stay visible on the white theme
const additive = (color, opacity = 1) => ({
  map: glowTexture(), color, transparent: true, opacity, depthWrite: false,
});

export function glowSprite(color, size, opacity = 0.6) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial(additive(color, opacity)));
  s.scale.setScalar(size);
  return s;
}

/* Starfield --------------------------------------------------------- */
/* Floating colourful dust in the sky (stars in the old dark theme). */
export function makeStars({ count = 4000, rMin = 80, rMax = 220, size = 0.9, opacity = 0.8 } = {}) {
  count = Math.round(count * 0.35);
  opacity *= 0.7;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = THEME.dust.map((c) => new THREE.Color(c));
  for (let i = 0; i < count; i++) {
    const r = rMin + Math.random() * (rMax - rMin);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random() * 1.6 - 0.6); // bias to the upper sky
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    const c = palette[(Math.random() * palette.length) | 0];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size, vertexColors: true, fog: false, ...additive('#ffffff', opacity),
  }));
}

/* Ground with a faint grid that fades into the fog ------------------ */
export function makeGround({ size = 600, color = THEME.ground, grid = THEME.grid } = {}) {
  const group = new THREE.Group();
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 })
  );
  plane.rotation.x = -Math.PI / 2;
  group.add(plane);
  const g = new THREE.GridHelper(size, size / 2, grid, grid);
  g.material.transparent = true;
  g.material.opacity = 0.7;
  g.position.y = 0.01;
  group.add(g);
  return group;
}

/* The idea seed ----------------------------------------------------- */
export function makeSeed({ color = '#E8462D', size = 0.45 } = {}) {
  const group = new THREE.Group();
  const uniforms = { uTime: { value: 0 } };
  // deep emissive so the seed reads as solid brand red (not pink) under bright daylight
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: new THREE.Color(color).multiplyScalar(0.55), emissiveIntensity: 1, roughness: 0.35, metalness: 0.1, flatShading: true,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `
        vec3 transformed = position;
        float n = sin(position.x * 9.0 + uTime * 1.7) * sin(position.y * 8.0 + uTime * 1.3) * sin(position.z * 9.5 + uTime);
        transformed += normal * n * 0.06;
      `);
  };
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 4), mat);
  core.scale.set(0.85, 1.15, 0.85);
  group.add(core);
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size * 1.9, 1),
    new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.55 })
  );
  group.add(shell);
  const halo = glowSprite(color, size * 6, 0.22);
  group.add(halo);
  const light = new THREE.PointLight(color, 10, 12, 1.8);
  group.add(light);

  // motes orbiting the seed
  const MOTES = 120;
  const mp = new Float32Array(MOTES * 3);
  const seeds = Array.from({ length: MOTES }, () => [Math.random() * 6.28, 0.8 + Math.random() * 1.6, (Math.random() - 0.5) * 1.6, 0.2 + Math.random() * 0.6]);
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: 0.07, ...additive('#D95A48', 0.9) }));
  group.add(motes);

  group.userData.update = (time, energy = 0) => {
    uniforms.uTime.value = time;
    core.rotation.y = time * 0.4;
    shell.rotation.y = -time * 0.2;
    shell.rotation.x = time * 0.13;
    const pulse = 1 + Math.sin(time * 2) * 0.05 + energy * 0.1;
    core.scale.set(0.85 * pulse, 1.15 * pulse, 0.85 * pulse);
    halo.material.opacity = 0.16 + Math.sin(time * 2) * 0.04 + energy * 0.08;
    seeds.forEach(([a, r, y, s], i) => {
      const ang = a + time * s;
      mp[i * 3] = Math.cos(ang) * r;
      mp[i * 3 + 1] = y + Math.sin(time * s + a) * 0.2;
      mp[i * 3 + 2] = Math.sin(ang) * r;
    });
    mg.attributes.position.needsUpdate = true;
  };
  return group;
}

/* Footprints along a curve that light up once walked ----------------- */
export function makeFootprints(curve, { spacing = 0.9, color = '#E8462D' } = {}) {
  const length = curve.getLength();
  const count = Math.floor(length / spacing);
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, 0.11, 0.22, 0, Math.PI * 2);
  const toe = new THREE.Shape();
  toe.absellipse(0, 0.3, 0.08, 0.08, 0, Math.PI * 2);
  const geo = new THREE.ShapeGeometry([shape, toe]);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const zs = new Float32Array(count);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const u = i / count;
    const p = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const side = new THREE.Vector3().crossVectors(tan, up).normalize().multiplyScalar(i % 2 ? 0.2 : -0.2);
    dummy.position.copy(p).add(side);
    dummy.position.y = 0.02;
    dummy.rotation.set(0, Math.atan2(-tan.x, -tan.z) + Math.PI, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    zs[i] = p.z;
  }
  const lit = new THREE.Color(color);
  const dim = new THREE.Color(THEME.footprintDim);
  for (let i = 0; i < count; i++) mesh.setColorAt(i, dim);
  let lastZ = Infinity;
  mesh.userData.update = (cameraZ) => {
    if (Math.abs(cameraZ - lastZ) < 0.2) return;
    lastZ = cameraZ;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const ahead = zs[i] - (cameraZ - 6); // positive = already walked past / just in front
      const k = THREE.MathUtils.clamp(ahead / 3, 0, 1);
      mesh.setColorAt(i, c.copy(dim).lerp(lit, k));
    }
    mesh.instanceColor.needsUpdate = true;
  };
  return mesh;
}

/* Milestone signpost ------------------------------------------------- */
export function makeSignpost({ year, title, color }) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2 })
  );
  post.position.y = 1.6;
  group.add(post);
  const base = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.42, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.03;
  group.add(base);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), new THREE.MeshBasicMaterial({ color }));
  orb.position.y = 3.3;
  group.add(orb);
  orb.add(glowSprite(color, 1.6, 0.7));
  const label = labelSprite(
    [{ text: year, size: 22, weight: 500, color }, { text: title, size: 38, weight: 700 }],
    { worldHeight: 0.9, border: color + '66' }
  );
  label.position.y = 4.1;
  group.add(label);
  group.userData.update = (time) => {
    orb.position.y = 3.3 + Math.sin(time * 1.5 + group.position.z) * 0.08;
  };
  return group;
}

/* A recursive glowing tree that can grow from 0..1 ------------------- */
export function makeTree({ height = 6, depth = 4, leafColor = '#13a86b', seed = 7 } = {}) {
  const group = new THREE.Group();
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const branches = [];
  const tips = [];
  const mat = new THREE.MeshStandardMaterial({ color: THEME.wood, roughness: 0.7 }); // plain dark wood

  function grow(start, dir, len, radius, level, startAt) {
    const end = start.clone().add(dir.clone().multiplyScalar(len));
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3((rand() - 0.5) * len * 0.2, 0, (rand() - 0.5) * len * 0.2));
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const geo = new THREE.TubeGeometry(curve, 16, radius, 6, false);
    const mesh = new THREE.Mesh(geo, mat);
    const span = 1 / (depth + 1);
    branches.push({ mesh, from: startAt, to: startAt + span, total: geo.index.count });
    geo.setDrawRange(0, 0);
    group.add(mesh);
    if (level >= depth) {
      tips.push({ pos: end, at: startAt + span * 0.6 }); // leaves bloom as the last twigs finish
      return;
    }
    const kids = level === 0 ? 3 : 2 + (rand() < 0.5 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      const a = (k / kids) * Math.PI * 2 + rand() * 1.2;
      const tilt = 0.45 + rand() * 0.35;
      const nd = new THREE.Vector3(Math.cos(a) * tilt, 1, Math.sin(a) * tilt).normalize().lerp(dir, 0.35).normalize();
      grow(end, nd, len * (0.62 + rand() * 0.1), radius * 0.62, level + 1, startAt + span);
    }
  }
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), height * 0.38, height * 0.035, 0, 0);

  const leafGeo = new THREE.IcosahedronGeometry(0.3, 1);
  const leaves = tips.map((t) => {
    const leafMat = new THREE.MeshBasicMaterial({ color: leafColor });
    const m = new THREE.Mesh(leafGeo, leafMat);
    m.position.copy(t.pos);
    m.scale.setScalar(0);
    m.add(glowSprite(leafColor, 1.4, 0.5));
    group.add(m);
    return { mesh: m, at: t.at };
  });

  group.userData.setGrowth = (g) => {
    branches.forEach((b) => {
      const k = THREE.MathUtils.clamp((g - b.from) / (b.to - b.from), 0, 1);
      const n = Math.floor((b.total * k) / 3) * 3;
      b.mesh.geometry.setDrawRange(0, n);
      b.mesh.visible = n > 0;
    });
    leaves.forEach((l) => {
      const k = THREE.MathUtils.clamp((g - l.at) / 0.12, 0, 1);
      l.mesh.scale.setScalar(k);
      l.mesh.visible = k > 0;
    });
  };
  group.userData.setGrowth(0);
  return group;
}

/* Roots that run along the ground from a point to several targets ---- */
export function makeRoots(origin, targets, { color = '#E8462D' } = {}) {
  const group = new THREE.Group();
  const lines = targets.map((target, i) => {
    const pts = [];
    const o = origin.clone();
    const t = target.clone();
    const ctrl = o.clone().lerp(t, 0.5).add(new THREE.Vector3((i % 2 ? 1 : -1) * (2 + i), 0, 0));
    const curve = new THREE.QuadraticBezierCurve3(o, ctrl, t);
    for (let k = 0; k <= 80; k++) {
      const p = curve.getPoint(k / 80);
      p.y = 0.05;
      pts.push(p);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: target.userData?.color || color, transparent: true, opacity: 0.85 }));
    geo.setDrawRange(0, 0);
    group.add(line);
    return { line, n: pts.length, delay: (i % 4) * 0.08 };
  });
  group.userData.setGrowth = (g) => {
    lines.forEach((l) => {
      const k = THREE.MathUtils.clamp((g - l.delay) / (1 - 0.3), 0, 1);
      l.line.geometry.setDrawRange(0, Math.floor(l.n * k));
    });
  };
  return group;
}

/* A planted idea: a seed falls, a sapling grows, then the idea's label fades in. */
export function makePlantedIdea(text, { leafColor = '#E8462D', seed = 29, title = 'NEW IDEA' } = {}) {
  const g = new THREE.Group();
  const s = makeSeed({ size: 0.2 });
  s.position.y = 7;
  g.add(s);
  const sapling = makeTree({ height: 3.2, depth: 3, seed, leafColor });
  g.add(sapling);
  const short = text.length > 42 ? text.slice(0, 40) + '…' : text;
  const label = labelSprite([{ text: title, size: 18, weight: 500, color: '#E8462D' }, { text: short, size: 28, weight: 600 }], { worldHeight: 0.75, border: '#E8462D66' });
  label.position.y = 4.2;
  label.material.opacity = 0;
  g.add(label);
  const t0 = performance.now() / 1000;
  g.userData.update = (time) => {
    const age = performance.now() / 1000 - t0;
    const fall = Math.min(1, age / 1.1);
    s.position.y = 7 * (1 - fall * fall) + 0.2;
    s.userData.update(time, 0);
    s.visible = age < 1.6;
    sapling.userData.setGrowth(THREE.MathUtils.clamp((age - 1.1) / 2.6, 0, 1));
    label.material.opacity = THREE.MathUtils.clamp((age - 2.6) / 0.8, 0, 1);
  };
  return g;
}
