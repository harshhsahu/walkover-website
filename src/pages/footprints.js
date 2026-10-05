import '../styles/main.css';
import * as THREE from 'three';
import { mountLayout, tooltip, escapeHtml, ink } from '../core/layout.js';
import { createStage, addLights, isMobile, reduceMotion } from '../core/stage.js';
import { elementProgress, damp } from '../core/scroll.js';
import { fontsReady, labelSprite } from '../core/textures.js';
import { makeStars, makeGround, makeFootprints, glowSprite } from '../core/world.js';
import { createPicker } from '../core/picker.js';
import { wireForm } from '../core/forms.js';
import { ALUMNI, IS_SAMPLE } from '../data/alumni.js';

mountLayout('footprints');

const TEAM_COLORS = {
  Engineering: '#0e9fd8', Design: '#e0307f', Product: '#6d4cf0', Growth: '#e8a400',
  'Customer Success': '#13a86b', Infrastructure: '#e8432f', AI: '#8b5cf6', People: '#E8462D',
};
const colorOf = (p) => TEAM_COLORS[p.team] || '#E8462D';
const FIRST = 2009;
const LAST = new Date().getFullYear();
const people = ALUMNI.map((p, i) => ({ ...p, id: i }));

/* ---------- stats ---------- */
const setCount = (id, n) => (document.getElementById(id).dataset.count = n);
setCount('s-total', people.length);
setCount('s-founders', people.filter((p) => p.founder).length);
setCount('s-years', LAST - FIRST + 1);
setCount('s-teams', new Set(people.map((p) => p.team)).size);
if (!IS_SAMPLE) document.querySelectorAll('[data-sample]').forEach((el) => el.remove());

/* ---------- filters (two synced filter bars) ---------- */
const FILTERS = ['All', 'Founders', ...Object.keys(TEAM_COLORS).filter((t) => people.some((p) => p.team === t))];
let filter = 'All';
const matches = (p) => filter === 'All' || (filter === 'Founders' ? p.founder : p.team === filter);
const bars = [...document.querySelectorAll('.filters')];
bars.forEach((bar) => {
  bar.innerHTML = FILTERS.map((f) => `<button type="button" data-f="${f}" aria-pressed="${f === filter}">${f}</button>`).join('');
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    filter = b.dataset.f;
    applyFilter();
  });
});

/* ---------- list of journeys ---------- */
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const years = (p) => `${p.joined}${p.left ? ` – ${p.left}` : ' – now'}`;
const list = document.getElementById('people');
function personCardHTML(p) {
  return `<button type="button" class="card person" data-id="${p.id}" style="--c:${colorOf(p)}">
    <div class="person-head"><div class="avatar" style="--c:${colorOf(p)}">${escapeHtml(initials(p.name))}</div>
      <div><h3>${escapeHtml(p.name)}${p.founder ? '<span class="badge">Founder</span>' : ''}</h3><p>${escapeHtml(p.role)} · ${years(p)}</p></div></div>
    <p class="q">“${escapeHtml(p.quote)}”</p>
    <small>Now · ${escapeHtml(p.now)}</small>
  </button>`;
}
const renderList = () => (list.innerHTML = people.map(personCardHTML).join(''));
renderList();
list.addEventListener('click', (e) => {
  const c = e.target.closest('.person');
  if (c) openPerson(people[+c.dataset.id]);
});

/* ---------- side card ---------- */
const card = document.getElementById('person-card');
const body = card.querySelector('.person-body');
let selected = null;
function openPerson(p) {
  selected = p;
  tooltip.hide();
  body.innerHTML = `
    <div class="person-head"><div class="avatar" style="--c:${colorOf(p)}">${escapeHtml(initials(p.name))}</div>
      <div><h3>${escapeHtml(p.name)}${IS_SAMPLE && !p.mine ? '<span class="badge">Sample</span>' : ''}${p.mine ? '<span class="badge">Pending review</span>' : ''}</h3>
      <p>${escapeHtml(p.role)}</p></div></div>
    <p class="quote">${escapeHtml(p.quote)}</p>
    <dl class="facts">
      <dt>At Walkover</dt><dd>${years(p)}</dd>
      ${p.team ? `<dt>Team</dt><dd>${escapeHtml(p.team)}</dd>` : ''}
      ${p.product ? `<dt>Product</dt><dd>${escapeHtml(p.product)}</dd>` : ''}
      <dt>Now</dt><dd>${escapeHtml(p.now)}${p.founder ? ' <span class="badge">Founder</span>' : ''}</dd>
      ${p.built ? `<dt>Built</dt><dd>${escapeHtml(p.built)}</dd>` : ''}
    </dl>
    ${p.linkedin ? `<div class="cta-row" style="margin-top:18px"><a class="btn ghost small" href="${encodeURI(p.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a></div>` : ''}`;
  card.style.setProperty('--c', colorOf(p));
  card.classList.add('show');
  card.setAttribute('aria-hidden', 'false');
}
function closePerson() {
  selected = null;
  card.classList.remove('show');
  card.setAttribute('aria-hidden', 'true');
}
card.querySelector('.close').addEventListener('click', closePerson);
addEventListener('keydown', (e) => e.key === 'Escape' && closePerson());

/* ---------- 3D trail ---------- */
const trailEl = document.getElementById('trail');
const yearEl = document.getElementById('year');
const zOfYear = (y) => -(y - FIRST) * 12;
const xOfZ = (z) => Math.sin(z * 0.045) * 4;
let lanterns = [];
let addLantern = () => {};

const stage = createStage({ fog: 0.012 });
if (stage) {
  await fontsReady();
  const { scene, camera } = stage;
  addLights(scene, { ambient: 0.3 });
  const stars = makeStars({ count: isMobile() ? 2000 : 4000 });
  scene.add(stars);
  const ground = makeGround();
  ground.position.z = zOfYear((FIRST + LAST) / 2);
  scene.add(ground);

  const END = zOfYear(LAST + 1);
  const pts = [];
  for (let z = 8; z >= END - 8; z -= 4) pts.push(new THREE.Vector3(xOfZ(z), 0, z));
  const path = new THREE.CatmullRomCurve3(pts);
  const prints = makeFootprints(path, { spacing: 1 });
  scene.add(prints);

  // year markers
  for (let y = FIRST; y <= LAST; y++) {
    const z = zOfYear(y);
    const x = xOfZ(z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.32, 64), new THREE.MeshBasicMaterial({ color: '#E8462D', transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.03, z);
    scene.add(ring);
    const label = labelSprite([{ text: String(y), size: 44, weight: 700, color: '#E8462D' }], { worldHeight: 0.9, bg: null });
    label.position.set(x - 6, 0.6, z);
    scene.add(label);
  }

  // lanterns
  const hitGeo = new THREE.SphereGeometry(0.55, 12, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const orbGeo = new THREE.SphereGeometry(0.32, 24, 24);
  const starGeo = new THREE.OctahedronGeometry(0.42, 0);
  let seedN = 1;
  const rand = () => ((seedN = (seedN * 16807) % 2147483647) / 2147483647);
  addLantern = (p) => {
    const color = colorOf(p);
    const z = zOfYear(p.joined) - 1.5 - rand() * 9;
    const side = rand() < 0.5 ? -1 : 1;
    const x = xOfZ(z) + side * (1.6 + rand() * 2.6);
    const y = 1.3 + rand() * 1.4;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const orb = new THREE.Mesh(p.founder ? starGeo : orbGeo, new THREE.MeshBasicMaterial({ color }));
    g.add(orb);
    const glow = glowSprite(color, 2.8, 0.6);
    g.add(glow);
    const string = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -y, 0)]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
    );
    g.add(string);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData.person = p;
    g.add(hit);
    const name = labelSprite([{ text: p.name, size: 26, weight: 600 }], { worldHeight: 0.42, border: color + '88' });
    name.position.y = 0.85;
    name.material.opacity = 0;
    g.add(name);
    scene.add(g);
    const l = { p, g, orb, glow, hit, name, baseY: y, phase: rand() * 6, on: 1, hover: 0 };
    lanterns.push(l);
    return l;
  };
  people.forEach((p) => addLantern(p));

  let hovered = null;
  createPicker(stage, () => lanterns.filter((l) => l.on > 0.5).map((l) => l.hit), {
    onChange(hit) {
      const p = hit?.userData.person ?? null;
      hovered = p;
      if (p) tooltip.show(`<small>${p.joined} · ${escapeHtml(p.team || 'Walkover')}</small><b style="color:${ink(colorOf(p))}">${escapeHtml(p.name)}</b><p>${escapeHtml(p.role)}<br/>Now: ${escapeHtml(p.now)}</p><em>Click to read the journey</em>`, stage.client.x, stage.client.y);
      else tooltip.hide();
    },
    onClick: (hit) => openPerson(hit.userData.person),
  });
  addEventListener('pointermove', (e) => hovered && tooltip.move(e.clientX, e.clientY));

  let z = 8;
  let over = 0;
  const look = new THREE.Vector3();
  let shownYear = null;
  stage.onFrame((dt, time) => {
    const p = elementProgress(trailEl);
    const r = trailEl.getBoundingClientRect();
    const past = THREE.MathUtils.clamp((innerHeight - r.bottom) / innerHeight, 0, 1); // scrolled beyond the trail
    z = damp(z, THREE.MathUtils.lerp(9, END + 4, p), reduceMotion ? 20 : 3, dt);
    over = damp(over, past, 3, dt);
    const cx = xOfZ(z);
    const walkCam = new THREE.Vector3(cx + stage.pointer.x * 0.6, 2.4 + stage.pointer.y * 0.3, z);
    const walkLook = new THREE.Vector3(xOfZ(z - 10), 1.6, z - 10);
    const topCam = new THREE.Vector3(14, 60, zOfYear(FIRST) + 20);
    const topLook = new THREE.Vector3(0, 0, zOfYear((FIRST + LAST) / 2));
    camera.position.lerpVectors(walkCam, topCam, over);
    look.lerpVectors(walkLook, topLook, over);
    camera.lookAt(look);
    stars.position.copy(camera.position);
    prints.userData.update(z);

    const year = THREE.MathUtils.clamp(Math.floor(FIRST - (z - 4) / 12), FIRST, LAST);
    if (year !== shownYear) {
      shownYear = year;
      yearEl.textContent = year;
    }

    lanterns.forEach((l) => {
      const target = matches(l.p) ? 1 : 0.15;
      l.on = damp(l.on, target, 6, dt);
      const isH = hovered === l.p || selected === l.p;
      l.hover = damp(l.hover, isH ? 1 : 0, 10, dt);
      l.g.position.y = l.baseY + Math.sin(time * 1.2 + l.phase) * 0.12;
      l.orb.rotation.y = time;
      l.orb.scale.setScalar((0.5 + l.on * 0.5) * (1 + l.hover * 0.6));
      l.glow.material.opacity = 0.1 + l.on * 0.5 + l.hover * 0.3;
      const dist = Math.abs(l.g.position.z - z + 7);
      l.name.material.opacity = Math.max(l.hover, THREE.MathUtils.clamp(1 - dist / 6, 0, 1) * l.on) * (1 - over);
    });
  });
}

function applyFilter() {
  bars.forEach((bar) => bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === filter)));
  list.querySelectorAll('.person').forEach((c) => (c.hidden = !matches(people[+c.dataset.id])));
}

/* ---------- add your footprint ---------- */
wireForm(document.getElementById('footprint-form'), {
  subject: (d) => `Footprint for the Walkover trail — ${d.name}`,
  labels: { name: 'Name', role: 'Role at Walkover', joined: 'Joined', left: 'Left', now: 'Now', quote: 'What Walkover taught me', linkedin: 'LinkedIn', consent: 'Consent to publish' },
  onSubmit(d) {
    const joined = THREE.MathUtils.clamp(+d.joined || LAST, FIRST, LAST);
    const p = {
      id: people.length, name: d.name.trim(), role: d.role.trim(), team: '', product: '', joined, left: +d.left || null,
      now: d.now.trim(), founder: /found/i.test(d.now), built: '', quote: d.quote.trim(), linkedin: /^https?:\/\//.test(d.linkedin) ? d.linkedin : null, mine: true,
    };
    people.push(p);
    renderList();
    applyFilter();
    addLantern(p);
    openPerson(p);
  },
});
