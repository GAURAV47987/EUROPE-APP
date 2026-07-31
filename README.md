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
  things to do/eat, and restaurants. Weather shows a real forecast (via
  Open-Meteo, free/no key) once that city's trip dates fall within the
  ~16-day forecast horizon, cached for a few hours; otherwise falls back
  to the static seasonal estimate.
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
- **Icon-grid navigation** — Itinerary, Budget, Convert, Pack, Docs, Ask,
  and Reels sit in a grid of colored tiles (matching the budget category
  palette), replacing the old scrolling pill row now that there are
  seven of them. Tapping a non-Itinerary tile opens a dedicated page with
  a back-to-Itinerary button and a grid quick-jump popover to reach any
  other tool in one tap. The eight cities keep their own always-visible,
  scrollable rail underneath, unchanged — tapping one still swaps content
  in place rather than opening a separate page.
- **Edge-swipe to go back** — a rightward drag starting from the screen's
  left edge (like iOS's native back gesture) returns to Itinerary from
  any tool page or city, and steps back one level at a time inside
  nested views (e.g. Reels' city detail → Reels' city grid → Itinerary).
  Scoped to a thin edge strip so it never fights normal scrolling, the
  cities rail, or the map's own drag/pan.
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
  dictation mic) a quick note like "40 euros lunch in Athens" or "$10 for
  food", and a local, offline, zero-cost parser picks out the amount,
  currency, category, and city — pre-filled into the expense form for a
  one-tap confirm instead of manual typing. Snapping a photo of a receipt
  instead sends it to a vision-capable AI model (via Groq's free API,
  through a Supabase Edge Function) to read the total and fill in the
  same fields.
- **Ask** — a simple AI chat for trip questions ("best restaurants in
  Budapest?", "rainy day in Vienna?"), aware of the route and dates.
  Backed by the same Groq-powered edge function as receipt scanning. See
  `supabase/functions/groq-assist`.
- **Reels** — TikTok/Reels content-shoot ideas per city (landmark &
  scenery, food, a mini-vlog outline, duo/couple shots), curated per city
  and grounded in the real itinerary — static content, no AI call needed.
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
  once online, then reloading fully offline. A refresh button in the
  header (next to dark mode) forces the latest deployed version to take
  over immediately, instead of needing to fully close and reopen the app.

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
