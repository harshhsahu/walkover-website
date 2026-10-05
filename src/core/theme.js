// One place for the 3D colour palette — Walkover brand: white, Walkover red, charcoal.
export const BRAND = {
  red: '#E8462D',
  redDeep: '#B83824',
  redSoft: '#D95A48',
  charcoal: '#222528',
};

export const THEME = {
  sky: ['#1a1625', '#1f1830', '#24203a', '#2a2540'], // dark space gradient
  horizon: '#2a2540', // fog + bottom of the sky
  ground: '#1a1625',
  grid: '#3a3850',
  ink: '#e9e9ee', // label text, kept under the bloom threshold
  labelBg: 'rgba(42, 37, 64, 0.95)',
  accent: BRAND.red,
  building: '#2a2540',
  windowBg: '#3a3850',
  fillerTint: '#5a5a6a',
  footprintDim: '#3a3a4a',
  wood: '#4a3a30',
  bench: '#2a2540',
  benchLeg: '#4a4a6a',
  labFloor: '#1f1a35',
  labLine: '#4a4a6a',
  bloom: { strength: 0.35, radius: 0.45, threshold: 0.92 },
  dust: [BRAND.red, BRAND.redSoft, '#6a7a8a', '#4a5a7a', '#1a1a3a'],
};
