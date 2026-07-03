Backend (Django) — VERIVA
=========================

Overview
--------

The backend is built with Django and Django REST Framework. It provides REST APIs for managing users, students, devices, attendance records, and verification incidents. Data is stored in `db.sqlite3` by default.

Key apps
--------

- `accounts` — user models, authentication, permissions
- `students` — student records and management
- `devices` — reader devices and utilities
- `attendance` — attendance records and reporting
- `verification` — incident and verification workflows

Important files
---------------

- `manage.py` — Django management entrypoint
- `requirements.txt` — Python dependencies
- `seed.py` — helper to populate initial/demo data
- App folders: `accounts/`, `students/`, `devices/`, `attendance/`, `verification/`

Running locally
---------------

Follow the Quick start in [docs/README.md](../docs/README.md). The backend serves the API at `http://127.0.0.1:8000/` by default when using `python manage.py runserver`.

Where to find APIs
------------------

Each Django app defines URL routes in its `urls.py`. API views and serializers are under each app's `views.py` and `serializers.py`.

Examples
--------
- API helpers: look in `accounts/serializers.py`, `attendance/views.py`, and `devices/utils.py` for implementation patterns.
