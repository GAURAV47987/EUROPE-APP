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
- **Itinerary** — a timeline of day cards, each with a colored rail node
  and a city-tinted header band; tap any item to check it off.
- **City guides** — per-city weather, currency, tips, must-go highlights,
  things to do/eat, and restaurants. Weather shows a real forecast (via
  Open-Meteo, free/no key) once that city's trip dates fall within the
  ~16-day forecast horizon, cached for a few hours; otherwise falls back
  to the static seasonal estimate.
- **Budget tracker** — log expenses by description, amount, currency,
  category, and city; running totals per currency, plus a combined
  "Total (≈ AUD)" card that converts every currency logged (AUD, EUR,
  HUF, CZK, USD) into one grand total using the same rates as the
  category breakdown below it. Tapping a category in that breakdown
  filters the expense list to just that category — tap it again (or
  the "Showing: ___" chip) to clear the filter.
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
- **"Postcard Journal" theme** — kraft-paper background with a subtle
  linen texture, ink-navy headings, and a stamp-red/tape-gold accent
  pair, applied through the same CSS custom properties used everywhere
  else in the app. Signature touches: a rotated passport-stamp badge on
  the splash screen, a dashed postmark-style chip for the header's
  day/countdown status, and a washi-tape "Today" marker that pins itself
  to the current day's card on the Itinerary page while travelling.
- **Dark mode** — a header toggle, defaulting to system preference,
  persisted to `localStorage`; implemented via CSS custom properties so
  every surface/text/border token swaps in one place (a "night desk"
  variant of the Postcard Journal theme).
- Tab transitions, a check-off "pop" animation, and hover/press feedback
  throughout — all disabled under `prefers-reduced-motion`.
- **Icon-grid navigation** — a clean home screen: the eight cities'
  always-visible scrollable rail on top, then all seven tools (Itinerary,
  Budget, Convert, Pack, Docs, Ask, Reels) as a grid of colored tiles
  underneath (matching the budget category palette), replacing the old
  scrolling pill row. Itinerary is a tool like any other now — tapping
  its tile opens the day-by-day view + route map on a dedicated page,
  instead of it living permanently on the home screen underneath the
  nav — so the home screen stays a lightweight launcher no matter how
  many tools get added. Every non-home tile opens with a back-to-Home
  button and a grid quick-jump popover to reach any other tool in one
  tap. Tapping a city still swaps content in place on the home screen
  rather than opening a separate page.
- **Edge-swipe to go back** — a rightward drag starting from the screen's
  left edge (like iOS's native back gesture) returns to the home screen
  from any tool page or city, and steps back one level at a time inside
  nested views (e.g. Reels' city detail → Reels' city grid → Home).
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
- **Reels** — TikTok/Reels content-shoot ideas, static content grounded in
  the real itinerary, no AI call needed. Opening any city shows a "Cross
  city" section first — 16 ideas that need one clip from every stop
  (outfit check, coffee rating, golden hour, etc.), tracked separately
  per city so checking one off in Athens doesn't hide it in Ios and you
  don't reach the end of the trip missing a clip — plus a spot to add
  your own idea, which then shows up (unchecked) in every other city too.
  Below that are that city's own landmark/food/vlog/duo ideas, and a
  "Your ideas" box at the end of every city to jot down anything else
  worth shooting there. Everything is a checklist just like the packing
  list — tap an idea once you've shot it and it crosses off, with a
  per-city progress ring counting all of it together. Note: ideas either
  of you type into these boxes currently save to that device only —
  they're not yet synced to the paired phone the way budget/checklist
  progress is.
- **Reminders** — set a reminder (title, date, time, optional notes,
  and how far ahead to alert) and it generates a real `.ics` calendar
  file that gets added to your phone's own Calendar app — a genuine OS
  notification, no backend or push-notification setup required. Comes
  with two quick-add suggestions pre-filled from the actual itinerary
  (the Athens→Ios and Ios→Paros ferry check-ins). No server, so nothing
  to keep alive — each person adds reminders straight to their own
  phone's calendar.
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
