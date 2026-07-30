# Europe & Greek Islands Trip Planner

A hosted trip planner for a Sydney → Athens → Ios → Paros → Budapest →
Prague → Český Krumlov → Hallstatt → Vienna → Sydney itinerary
(23 Aug – 15 Sep), rebuilt from a Claude artifact into a standalone
Vite + React + Tailwind app.

## Features

- **Home screen** — a splash screen shown on every visit: "EUROPE 2026"
  headline, an animated route dots strip, and a live-ticking
  days/hrs/min/sec countdown to the actual Sydney departure flight (falls
  back to "Day N of 24" while travelling, or a wrap-up message after).
  Tap "Enter Trip Planner" to reach the app below.
- **Itinerary** — a route-overview mini-map (numbered, city-colored pins
  connected in trip order) followed by a timeline of day cards, each with
  a colored rail node and a city-tinted header band; tap any item to check
  it off.
- **City guides** — per-city weather, currency, tips, must-go highlights,
  things to do/eat, and restaurants.
- **Budget tracker** — log expenses by description, amount, currency,
  category, and city; running totals per currency.
- **Currency converter** — convert between AUD/EUR/HUF/CZK/USD, plus a
  quick-reference table of common amounts converted to AUD. Fetches live
  rates from a CDN-hosted rate feed when online and caches the last known
  rates in `localStorage`, so it still works with no signal (falling back
  to built-in approximate rates on first offline load).
- **City maps** — an interactive Leaflet/OpenStreetMap view per city with
  pins for sights, areas, beaches, food & drink, and the hotel. Landmark
  pins are accurate; hotel/small-venue pins are best-effort approximations.
- **Packing list** — a checklist for two travellers, covering everything
  from Athens/island heat to Hallstatt evening cold, with a circular
  progress ring.
- **Trip countdown** — the header shows days until departure, "Day N of 24"
  and current city while travelling, or a wrap-up message afterward.
- **Budget breakdown chart** — spend by category, normalized to AUD, using
  a colorblind-validated categorical palette (see `dataviz` skill) with
  direct labels on every bar.
- **Dark mode** — a header toggle, defaulting to system preference,
  persisted to `localStorage`; implemented via CSS custom properties so
  every surface/text/border token swaps in one place.
- Tab transitions, a check-off "pop" animation, and hover/press feedback
  throughout — all disabled under `prefers-reduced-motion`.
- **Split navigation** — the four tools (Itinerary/Budget/Convert/Pack)
  stay in a fixed, always-visible row; the eight cities live in their own
  visually distinct scrollable rail underneath.
- All progress (checklist + budget + cached FX rates + packing list +
  theme) is saved automatically to the browser's `localStorage` — no
  backend required.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static site to `dist/`.

## Deploy

This is a static SPA and can be hosted anywhere that serves static files:

- **Vercel**: import the repo, framework preset "Vite", no config needed.
- **Netlify**: build command `npm run build`, publish directory `dist`.
- **GitHub Pages**: run `npm run build` and publish the `dist/` folder
  (e.g. via `gh-pages` or a GitHub Actions workflow).
