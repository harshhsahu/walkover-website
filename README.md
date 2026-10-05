# Walkover — 3D website

A multi-page three.js site for Walkover built around one story: **an idea (seed) → the Walk → the Lab → roots → a city of products → your plot**.

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:5174
npm run build    # static site in dist/
```

## Pages

| Page | File | 3D scene |
|---|---|---|
| The Walk (home) | `index.html` · `src/pages/home.js` | Scroll-driven walk: seed → milestone signposts → Lab → growing tree & roots → product city → "your plot" (plant-an-idea form) |
| Worlds | `worlds.html` · `src/pages/worlds.js` | City tour, one district per product; hover/click landmarks |
| The Lab | `lab.html` · `src/pages/lab.js` | Workshop of experiments with one empty "your bench" |
| Visionary | `visionary.html` · `src/pages/visionary.js` | Pushpendra Agrawal's timeline |
| Footprints | `footprints.html` · `src/pages/footprints.js` | Alumni trail 2009 → today: lanterns by join year, filters, journey cards, "add your footprint" form |
| Join | `join.html` · `src/pages/join.js` | Garden of grown ideas; internships, careers, plant-an-idea, contact |

## Where to edit things

- **Products** — `src/data/products.js` (name, domain, colour, URL, landmark shape & position)
- **Milestones** — `src/data/milestones.js`
- **Alumni** — `src/data/alumni.js` ⚠️ currently **sample data** (invented people). Replace with real, consented stories and set `IS_SAMPLE = false` to remove the "sample" badges.
- **Colours / theme** — `src/core/theme.js` (3D) and the `:root` tokens in `src/styles/main.css` (UI)
- **Forms** — `src/core/forms.js`. There is no backend yet: forms build a pre-filled email to `info@walkover.in` that the visitor sends from their mail app. Replace `wireForm`'s mailto step with an API call when a backend exists.

## Structure

```
src/core/   stage (renderer, bloom, loop) · scroll (keyframes) · world (seed, footprints, signposts, tree, roots)
            lab · city · picker (hover/click) · layout (nav, footer, reveal) · forms · textures · theme
src/data/   products · milestones · alumni
src/pages/  one entry per page
prototype/  the first single-page prototype (kept for reference)
```
# walkover-website
