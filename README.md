# Clout client

React 19 + Vite + React Router + Tailwind CSS v4.

## Run it locally
```bash
cd client
npm install
npm run dev          # http://localhost:5173, proxies /api to http://localhost:4000
```
Start the server first (see server/README.md) so the proxy has something to talk to.

## Styling
Tailwind v4 is wired in via `@tailwindcss/vite` (see `vite.config.js`). Design tokens
(colors, radii, font) are defined once in `src/styles/global.css` under `@theme`, and every
reusable pattern (`.btn`, `.card`, `.pill`, `.input`, the admin table, etc.) is a named class
built with `@apply` in the same file — the JSX just uses `className="btn blue"` etc., same as
before. Add new one-off styling directly as Tailwind utility classes in JSX; add a new
repeated pattern as a new class in `global.css`.

**Watch for utility-name collisions:** a custom class in `@layer components` with the same
name as a real Tailwind utility (e.g. `table`, `grow`) will have that one property silently
overridden, because Tailwind's `utilities` layer always wins over `components` regardless of
specificity. Before naming a new shared class, quickly check it isn't a real Tailwind utility.

## Build
```bash
npm run build   # outputs to dist/, deploy to Vercel (vercel.json handles SPA routing)
```
Set `VITE_API_URL` (see `.env.example`) to your API's origin in production.
