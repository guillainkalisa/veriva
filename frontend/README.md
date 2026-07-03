Frontend (React + Vite) — VERIVA
================================

Overview
--------

The frontend is a Vite React application using TailwindCSS. It consumes the backend REST APIs via small API helper modules in `frontend/src/api/`.

Key folders
-----------

- `src/api/` — API clients (attendance.js, auth.js, devices.js, students.js, verification.js)
- `src/pages/` — route pages (dashboard, attendance, devices, students, verification)
- `src/components/` — shared components and UI primitives
- `src/hooks/` — custom hooks (authentication, role checks)

Development
-----------

Use the scripts in `package.json`:

```bash
cd frontend
npm install
npm run dev
```

Configuration
-------------
API base URL is configured in `frontend/src/api/client.js`. Update it if the backend runs on a non-default host or port.
