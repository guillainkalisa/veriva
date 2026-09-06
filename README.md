# VERIVA

Smart Student Identity & Device Verification System for the University of Rwanda.

VERIVA gives campus security and lecturers one place to verify who a student is, what
laptop belongs to them, and where they are on campus. Students carry an NFC card;
laptops carry a printed QR code tied to their owner. Taps and scans are checked
against a single backend so a shared card, a swapped laptop, or an unregistered
person shows up immediately.

## Features

- NFC student cards — issue, deactivate, report lost/stolen
- Laptop registration with an auto-generated QR code bound to the owner
- Campus entry/exit logging from an NFC station at the gates
- Classroom attendance by NFC tap against an open session
- Security incident reports with severity and resolution tracking
- Dashboard with live campus figures

## Stack

| Layer | Choice |
|---|---|
| Backend | Django 5 + Django REST Framework |
| Auth | JWT (SimpleJWT), 4 roles: admin, security, lecturer, student |
| Database | PostgreSQL (SQLite works for local dev) |
| Frontend | React 18 + Vite, React Router, Tailwind |
| QR / NFC | `qrcode` for generation; NFC readers act as USB keyboards into the NFC station |

## Layout

```
backend/          Django project
  config/         settings, root urls, wsgi/asgi
  accounts/       users, auth, role permissions
  campus/         administrative directorates (device/incident ownership)
  students/       students, College>School>Department>Programme, NFC cards
  devices/        laptops, QR codes, loans
  attendance/     courses, sessions, records, campus entries
  verification/   incident reports, dashboard stats
frontend/         React app
  src/api/        one module per backend resource
  src/pages/      one folder per route
docs/             API reference
```

## Running locally

Backend:

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python manage.py migrate
venv/bin/python seed.py        # demo users + sample data
venv/bin/python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend proxies `/api` and `/media` to `localhost:8000`, so run both.

Seeded logins: `admin / admin1234`, `security01 / security1234`, `lecturer01 / lecturer1234`.

## API

All routes are under `/api/v1/`. See [docs/API_REFERENCE.md](docs/API_REFERENCE.md).
