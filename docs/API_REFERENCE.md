API Reference — VERIVA (brief)
=================================

This document lists where the API endpoints live and how to find them. It is not an exhaustive endpoint-by-endpoint reference, but points you to the source files to inspect and extend.

Where to look
-------------

- App URL modules: `backend/accounts/urls.py`, `backend/attendance/urls.py`, `backend/devices/urls.py`, `backend/students/urls.py`, `backend/verification/urls.py` — these register endpoint paths.
- Views: each app's `views.py` contains the endpoint implementations.
- Serializers: request/response shapes live in each app's `serializers.py`.

Common endpoints (examples)
---------------------------

- Authentication: implemented in `accounts/` (token endpoints using Simple JWT)
- Students CRUD: `students/` app exposes student creation and listing endpoints
- Devices: register and manage devices via `devices/` app
- Attendance: record and query attendance in `attendance/`
- Verification: incident reports and verification flows in `verification/`

How to expand this reference
----------------------------

1. Open the app's `urls.py` to get path patterns.
2. Match paths to view names in `views.py`.
3. Inspect `serializers.py` for request/response fields.
