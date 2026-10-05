// Walkover's products. `era` groups them on the Walk: origin (2009), growth (after 2011), ai (after 2022).
// `shape` picks the landmark built in the 3D city; `icon` is a file in /public/icons (null → lettermark).
// TODO(walkover team): confirm descriptions and links marked url: null.
export const ERAS = {
  origin: { label: '2009', title: 'Where it started' },
  growth: { label: 'After 2011', title: 'One idea becomes many' },
  ai: { label: 'After 2022', title: 'The AI-first wave' },
};

export const PRODUCTS = [
  {
    id: 'msg91', name: 'MSG91', domain: 'Communication', era: 'origin', color: '#2f80ed', shape: 'tower',
    icon: 'msg91-icon-blue.svg', url: 'https://msg91.com/in',
    desc: 'Cloud communication platform delivering 1B+ SMS a month — omnichannel customer engagement at scale.',
    pos: [-6, -127], height: 16,
  },
  {
    id: 'giddh', name: 'Giddh', domain: 'Finance', era: 'growth', color: '#5c6bf0', shape: 'vault',
    icon: 'Giddh-icon.svg', url: 'https://giddh.com/in',
    desc: 'Cloud accounting that automates financial management and tax compliance for businesses.',
    pos: [6, -127], height: 9,
  },
  {
    id: 'space', name: 'Space', domain: 'Collaboration', era: 'growth', color: '#ffa31a', shape: 'cluster',
    icon: 'space-icon.svg', url: null,
    desc: 'A shared space for teams to talk, plan and keep work moving together.',
    pos: [-14, -131], height: 8,
  },
  {
    id: 'workspace91', name: 'Workspace91', domain: 'Workspace', era: 'growth', color: '#14b8a6', shape: 'stack',
    icon: 'workspace91-icon.svg', url: 'https://workspace91.com/',
    desc: 'Business workspace — email, chat and the everyday tools a team runs on.',
    pos: [14, -131], height: 10,
  },
  {
    id: 'viasocket', name: 'viaSocket', domain: 'Automation', era: 'growth', color: '#ff4d6d', shape: 'bridge',
    icon: 'viasocket.svg', url: 'https://viasocket.com/',
    desc: 'AI automation platform to connect apps and automate workflows without writing code.',
    pos: [-21, -138], height: 10,
  },
  {
    id: 'superform', name: 'Superform', domain: 'Automation', era: 'growth', color: '#84cc16', shape: 'cylinder',
    icon: 'socket-superform-icon.svg', url: null,
    desc: 'Smart forms that collect data and kick off workflows the moment they are submitted.',
    pos: [21, -138], height: 8,
  },
  {
    id: 'dotsale', name: 'Dotsale', domain: 'Commerce', era: 'growth', color: '#10b981', shape: 'dome',
    icon: 'dotsale.svg', url: null,
    desc: 'Tools to set up, run and grow online sales.',
    pos: [-8, -140], height: 7,
  },
  {
    id: 'docstar', name: 'DocStar', domain: 'Workspace', era: 'growth', color: '#cbd5e1', shape: 'stack',
    icon: 'docstar.svg', url: 'https://docstar.io/',
    desc: 'All-in-one workspace to write docs and blogs, test APIs and build websites.',
    pos: [8, -140], height: 13,
  },
  {
    id: 'gtwy', name: 'GTWY AI', domain: 'Artificial Intelligence', era: 'ai', color: '#8b5cf6', shape: 'dome',
    icon: 'gtwy.png', url: 'https://gtwy.ai/',
    desc: 'No-code platform to plug AI into your product, build chatbots and automate with agents.',
    pos: [-7, -153], height: 7,
  },
  {
    id: 'rangers', name: 'Rangers', domain: 'Artificial Intelligence', era: 'ai', color: '#eab308', shape: 'tower',
    icon: null, url: null,
    desc: 'AI agents that take on real work for teams.',
    pos: [7, -153], height: 14,
  },
  {
    id: '50agents', name: '50 Agents', domain: 'Artificial Intelligence', era: 'ai', color: '#ff6b35', shape: 'cluster',
    icon: '50agents.svg', url: 'https://50agents.com/',
    desc: 'Smart AI assistant and notetaker — meeting summaries, insights and process automation.',
    pos: [-15, -157], height: 12,
  },
  {
    id: 'dbdash', name: 'DB Dash', domain: 'Data', era: 'ai', color: '#22d3ee', shape: 'vault',
    icon: null, url: 'https://dbdash.com/',
    desc: 'A no-code database — build tables, views and dashboards for your data.',
    pos: [15, -157], height: 9,
  },
  {
    id: 'tob', name: 'Things of Brand', domain: 'Design & Brand', era: 'ai', color: '#ec4899', shape: 'cylinder',
    icon: 'thingsofbrand.svg', url: 'https://thingsofbrand.com/',
    desc: 'Brand asset management that keeps logos and identity consistent across every product.',
    pos: [-22, -150], height: 11,
  },
  {
    id: 'embarko', name: 'Embarko', domain: 'Artificial Intelligence', era: 'ai', color: '#7dd3fc', shape: 'bridge',
    icon: null, url: 'https://embarko.ai/',
    desc: 'AI-powered onboarding that gets new people productive faster.',
    pos: [22, -150], height: 9,
  },
];

export const DOMAINS = [...new Set(PRODUCTS.map((p) => p.domain))];

export const iconURL = (p) => (p.icon ? `/icons/${p.icon}` : null);

/** App-icon style tile: the real icon on white, or a coloured lettermark. */
export const iconHTML = (p, size = 40) =>
  p.icon
    ? `<span class="app-icon" style="--s:${size}px"><img src="${iconURL(p)}" alt="" loading="lazy"></span>`
    : `<span class="app-icon letter" style="--s:${size}px;--c:${p.color}">${p.name[0]}</span>`;
