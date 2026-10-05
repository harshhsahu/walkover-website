import * as THREE from 'three';

/**
 * Scroll position as a float over a list of anchor elements:
 * t === i exactly when anchor i is centred in the viewport.
 */
export function anchorTracker(anchors) {
  let t = 0;
  const read = () => {
    const mid = innerHeight * 0.5;
    const centers = anchors.map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height * 0.5;
    });
    if (mid <= centers[0]) return (t = 0);
    for (let i = 0; i < centers.length - 1; i++) {
      if (mid < centers[i + 1]) return (t = i + (mid - centers[i]) / (centers[i + 1] - centers[i]));
    }
    return (t = centers.length - 1);
  };
  addEventListener('scroll', read, { passive: true });
  addEventListener('resize', read);
  read();
  return { get t() { return t; }, read };
}

/** 0..1 progress of the viewport through one element (0 = its top hits the viewport top). */
export function elementProgress(el) {
  const r = el.getBoundingClientRect();
  const span = r.height - innerHeight;
  return span > 0 ? THREE.MathUtils.clamp(-r.top / span, 0, 1) : 0;
}

const smooth = (x) => x * x * (3 - 2 * x);

/** Interpolate keyframe objects (numbers and number arrays) at float index t, with smoothstep easing. */
export function sampleKeys(keys, t) {
  const i = THREE.MathUtils.clamp(Math.floor(t), 0, keys.length - 1);
  const j = Math.min(i + 1, keys.length - 1);
  const k = smooth(THREE.MathUtils.clamp(t - i, 0, 1));
  const a = keys[i];
  const b = keys[j];
  const out = {};
  for (const key in a) {
    const va = a[key];
    const vb = b[key] ?? va;
    out[key] = Array.isArray(va) ? va.map((v, n) => v + (vb[n] - v) * k) : va + (vb - va) * k;
  }
  return out;
}

/** Smooth a moving scalar towards a target (frame-rate independent). */
export const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Local 0..1 window of a float t: 0 before `from`, 1 after `to`. */
export const windowOf = (t, from, to) => THREE.MathUtils.clamp((t - from) / (to - from), 0, 1);
