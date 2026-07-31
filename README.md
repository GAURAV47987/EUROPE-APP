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
  A swipe-to-enter slider (drag the handle to the end, tap it, or focus +
  Enter/Space) folds the screen away in 3D (CSS `perspective` +
  `rotateX`) to reveal the app underneath, already rendered so the fold
  uncovers it in real time rather than cutting to a blank page.
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
- **Cross-device sync** (optional) — tap the sync icon in the header to
  create a shared trip or join one with a code, so budget and checklist
  progress stay in sync between two devices (e.g. you and your
  partner). Backed by Supabase: anonymous auth (no accounts/passwords)
  plus membership-gated Row Level Security — a device can only read or
  write a trip it has actually joined via the pairing code, enforced
  server-side, not just by keeping the code secret. Falls back to the
  local cache if the cloud is unreachable. See `src/supabase.js` and
  the schema/RLS/RPC setup in the project's Supabase SQL Editor history.
- **Smart add (budget)** — type or speak (via your keyboard's built-in
  dictation mic) a quick note like "40 euros lunch in Athens", or snap a
  photo of a receipt, and it's parsed into a description, amount,
  currency, category, and city — pre-filled into the expense form for a
  one-tap confirm instead of manual typing. Powered by a Supabase Edge
  Function calling Google's Gemini API (free tier). See
  `supabase/functions/parse-expense`.
- **Documents** — upload tickets, passport scans, and booking
  confirmations (images or PDFs, up to 20MB) once paired via sync; view
  or delete them from either synced device. Stored in a private Supabase
  Storage bucket with the same membership-gated Row Level Security as the
  budget/checklist sync, so only devices that joined the trip can reach
  its files — never a public link.
- **Installable (PWA)** — "Add to Home Screen" on iOS/Android for a real
  home-screen icon that opens full-screen, no browser chrome. A service
  worker (via `vite-plugin-pwa`) precaches the app shell on first visit,
  so it opens instantly with zero signal afterward — verified by loading
  once online, then reloading fully offline.

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
