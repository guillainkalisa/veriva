# VERIVA frontend

React 18 + Vite + Tailwind. Talks to the backend through `/api/v1/`.

## Structure

- `src/api/` — one module per backend resource; all requests go through `client.js`,
  which attaches the JWT and refreshes it on a 401
- `src/pages/` — one folder per route (`dashboard`, `students`, `devices`, `attendance`,
  `campus`, `courses`, `verification`, `nfc`, `auth`)
- `src/components/` — shared UI (layout, sidebar, modal, page header, stat card, ...)
- `src/hooks/` — `useAuth` (session + login/logout), `useRole` (per-role capability flags)

## Development

```bash
npm install
npm run dev
```

Vite proxies `/api` and `/media` to `localhost:8000`, so start the backend too.

## Routing

`App.jsx` wraps everything in `AuthProvider`. `PrivateRoute` redirects anonymous users
to `/login` and enforces `roles` where a route sets them. `/nfc-station` renders
full-screen without the sidebar for use at a campus gate.
