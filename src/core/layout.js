// Shared chrome for every page: nav, footer, reveal-on-scroll, counters, tooltip.
import { iconHTML } from '../data/products.js';
const LINKS = [
  { href: '/', label: 'The Walk', id: 'home' },
  { href: '/worlds.html', label: 'Worlds', id: 'worlds' },
  { href: '/lab.html', label: 'The Lab', id: 'lab' },
  { href: '/visionary.html', label: 'Visionary', id: 'visionary' },
  { href: '/footprints.html', label: 'Footprints', id: 'footprints' },
];

export function mountLayout(active) {
  const header = document.createElement('header');
  header.className = 'nav';
  header.innerHTML = `
    <a href="/" class="brand" aria-label="Walkover home"><img class="brand-mark" src="/icons/walkover.png" alt="" width="32" height="32">walkover</a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><span></span><span></span></button>
    <nav id="nav-links">
      ${LINKS.map((l) => `<a href="${l.href}"${l.id === active ? ' aria-current="page"' : ''}>${l.label}</a>`).join('')}
      <a href="/join.html" class="nav-cta"${active === 'join' ? ' aria-current="page"' : ''}>Join the Walk</a>
    </nav>`;
  document.body.prepend(header);
  const btn = header.querySelector('.menu-btn');
  btn.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="foot-brand">
      <a href="/" class="brand"><img class="brand-mark" src="/icons/walkover.png" alt="" width="32" height="32">walkover</a>
      <p>A journey to innovation — from Indore, for the world.</p>
    </div>
    <div class="foot-cols">
      <div><h4>Explore</h4>${LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}</div>
      <div><h4>Join</h4><a href="/join.html#idea">Plant your idea</a><a href="/join.html#paths">Internships &amp; careers</a><a href="/footprints.html#add">Add your footprint</a></div>
      <div><h4>Contact</h4><a href="mailto:info@walkover.in">info@walkover.in</a><a href="tel:+917312560056">+91 731 256 0056</a><a href="https://walkover.in" target="_blank" rel="noopener">walkover.in ↗</a></div>
    </div>
    <p class="foot-legal">© ${new Date().getFullYear()} Walkover Web Solutions Pvt. Ltd. · LIC Tower, Scheme No. 54, Indore</p>`;
  document.body.append(footer);

  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.setAttribute('role', 'status');
  document.body.append(tip);

  initReveal();
}

export function initReveal(root = document) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        if (e.target.dataset.count) countUp(e.target);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12 }
  );
  root.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
}

function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const end = +el.dataset.count;
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / 1400);
    el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Floating tooltip that follows the pointer. */
export const tooltip = {
  show(html, x, y) {
    const t = document.querySelector('.tooltip');
    t.innerHTML = html;
    t.classList.add('show');
    this.move(x, y);
  },
  move(x, y) {
    const t = document.querySelector('.tooltip');
    t.style.left = Math.min(x + 18, innerWidth - t.offsetWidth - 12) + 'px';
    t.style.top = Math.min(y + 18, innerHeight - t.offsetHeight - 12) + 'px';
  },
  hide() {
    document.querySelector('.tooltip')?.classList.remove('show');
  },
};

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Lighten a dark accent so it reads as text on the dark theme. */
export function ink(hex) {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (lum >= 0.45) return hex;
  const k = Math.min(0.6, 0.55 - lum);
  return '#' + rgb.map((v) => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0')).join('');
}

export const productTip = (p) =>
  `<div class="tip-head">${iconHTML(p, 34)}<div><small>${p.domain}</small><b style="color:${ink(p.color)}">${p.name}</b></div></div><p>${p.desc}</p><em>${p.url ? 'Click to visit ↗' : 'Link coming soon'}</em>`;
