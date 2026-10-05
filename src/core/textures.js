import * as THREE from 'three';
import { THEME } from './theme.js';

let glow;
/** Soft radial dot used for stars, glows and particles. */
export function glowTexture() {
  if (glow) return glow;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(c);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

/** Emissive window grid for city buildings. */
export function windowTexture(lit = 0.35, tint = '#c3c7cd', bg = '#000') {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 124; y += 8) {
    for (let x = 4; x < 60; x += 8) {
      if (Math.random() < lit) {
        g.fillStyle = Math.random() < 0.2 ? '#9fb4c8' : tint;
        g.globalAlpha = 0.5 + Math.random() * 0.5;
        g.fillRect(x, y, 4, 5);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * Text label as a camera-facing sprite. `worldHeight` is the sprite height in world units.
 * Lines: [{ text, size, weight, color }]
 */
export function labelSprite(lines, { worldHeight = 1, pad = 28, border = null, bg = THEME.labelBg, align = 'left', icon = null } = {}) {
  const ratio = 2;
  const ctx = document.createElement('canvas').getContext('2d');
  const fontOf = (l) => `${l.weight || 600} ${l.size * ratio}px "Space Grotesk", system-ui, sans-serif`;
  let width = 0;
  let height = pad * ratio;
  lines.forEach((l) => {
    ctx.font = fontOf(l);
    width = Math.max(width, ctx.measureText(l.text).width);
    height += l.size * ratio * 1.25;
  });
  const textH = height - pad * ratio;
  height += pad * ratio * 0.8;
  width += pad * ratio * 2;
  const iconSize = icon ? textH : 0;
  const iconGap = icon ? pad * ratio * 0.6 : 0;
  width += iconSize + iconGap;

  const c = ctx.canvas;
  c.width = Math.ceil(width);
  c.height = Math.ceil(height);
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    roundRect(g, 1, 1, c.width - 2, c.height - 2, 22 * ratio);
    g.fill();
  }
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = 2 * ratio;
    roundRect(g, 2, 2, c.width - 4, c.height - 4, 22 * ratio);
    g.stroke();
  }
  let y = pad * ratio;
  lines.forEach((l) => {
    g.font = fontOf(l);
    g.fillStyle = l.color ? readable(l.color) : THEME.ink;
    g.textBaseline = 'top';
    g.textAlign = align;
    const x = align === 'center' ? c.width / 2 : pad * ratio + iconSize + iconGap;
    g.fillText(l.text, x, y);
    y += l.size * ratio * 1.25;
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (icon) drawIcon(g, icon, pad * ratio, pad * ratio, iconSize, () => (tex.needsUpdate = true));
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  sprite.scale.set((worldHeight * c.width) / c.height, worldHeight, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/** App-icon tile: real icon on white, or a coloured lettermark. */
function drawIcon(g, { url, letter, color }, x, y, size, onLoad) {
  g.fillStyle = url ? '#ffffff' : color;
  roundRect(g, x, y, size, size, size * 0.26);
  g.fill();
  if (!url) {
    g.fillStyle = '#14111e';
    g.font = `700 ${size * 0.5}px "Space Grotesk", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(letter, x + size / 2, y + size / 2 + size * 0.03);
    return;
  }
  const img = new Image();
  img.onload = () => {
    const box = size * 0.74;
    const k = Math.min(box / (img.naturalWidth || box), box / (img.naturalHeight || box));
    const w = (img.naturalWidth || box) * k;
    const h = (img.naturalHeight || box) * k;
    g.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
    onLoad();
  };
  img.src = url;
}

/** Lighten dark accent colours so label text stays readable on the dark theme. */
function readable(hex) {
  const c = new THREE.Color(hex);
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return lum < 0.45 ? '#' + c.lerp(new THREE.Color('#ffffff'), Math.min(0.6, 0.55 - lum)).getHexString() : hex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Wait for the display font so canvas labels render in it. */
export async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('700 48px "Space Grotesk"'),
      document.fonts.load('500 48px "Space Grotesk"'),
    ]);
  } catch {
    /* fall back to system font */
  }
}
