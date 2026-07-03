VERIVA Documentation
====================

Overview
--------

VERIVA is a student attendance and verification system consisting of a Django backend and a React + Vite frontend. The backend exposes REST APIs and stores data in SQLite by default. The frontend is a Vite-powered React app that consumes the backend APIs.

Quick links
-----------

- Backend: backend/
- Frontend: frontend/
- Database (SQLite): backend/db.sqlite3

Quick start
-----------

Backend (development):

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python seed.py
python manage.py runserver
```

Frontend (development):

```bash
cd frontend
npm install
npm run dev
```

Where to edit
-------------

- Backend Django apps: `accounts/`, `attendance/`, `devices/`, `students/`, `verification/`
- Frontend React source: `frontend/src/`
- Frontend API helpers: `frontend/src/api/`

Files created by docs generation
-------------------------------

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
