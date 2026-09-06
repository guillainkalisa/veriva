# VERIVA backend

Django 5 + DRF. Serves the REST API under `/api/v1/` and the Django admin at `/admin/`.

## Apps

| App | Responsibility |
|---|---|
| `accounts` | `CustomUser` with a `role` field, JWT login/logout, role-based permission classes |
| `campus` | administrative `Directorate` units; devices and incidents can be routed to one |
| `students` | students, the `College > School > Department > Programme` hierarchy (UR Law 71/2013), NFC cards |
| `devices` | laptop records, QR generation, borrow/lend loans |
| `attendance` | courses, class sessions, attendance records, campus entry/exit log |
| `verification` | security incident reports, dashboard aggregation |

`config/` holds settings, the root URLconf and the WSGI/ASGI entrypoints.

## Setup

```bash
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python manage.py migrate
venv/bin/python seed.py
venv/bin/python manage.py runserver
```

`DATABASE_URL` is read from the environment (see `.env.example`). Without it, set one
in `.env` or fall back to SQLite for local work.

## Notes

- QR payload is JSON signed into `Device.qr_data`; `devices/verify/` matches the scanned
  string against the stored value.
- NFC readers behave as keyboards: they type the card UID and press Enter. The NFC
  station page captures that and calls `attendance/campus-nfc-tap/`.
- Permission classes live in `accounts/permissions.py`; each ViewSet picks one.
