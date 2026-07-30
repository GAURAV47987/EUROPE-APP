# Europe & Greek Islands Trip Planner

A hosted trip planner for a Sydney → Athens → Ios → Paros → Budapest →
Prague → Český Krumlov → Hallstatt → Vienna → Sydney itinerary
(23 Aug – 15 Sep), rebuilt from a Claude artifact into a standalone
Vite + React + Tailwind app.

## Features

- **Itinerary** — full day-by-day schedule with times, booking status, and
  travel notes; tap any item to check it off.
- **City guides** — per-city weather, currency, tips, must-go highlights,
  things to do/eat, and restaurants.
- **Budget tracker** — log expenses by description, amount, currency,
  category, and city; running totals per currency.
- All progress (checklist + budget) is saved automatically to the
  browser's `localStorage` — no backend required.

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
