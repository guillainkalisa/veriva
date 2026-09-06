# API Reference

Base URL: `/api/v1/`. All endpoints require a JWT `Authorization: Bearer <access>`
header except `auth/login/` and `auth/token/refresh/`. Writes are restricted by role
(see the permission classes in `accounts/permissions.py`).

List endpoints are paginated (`?page=`, 20 per page) and most support `?search=` and
`?ordering=` plus the filters noted below.

## Auth — `accounts/`

| Method | Path | Notes |
|---|---|---|
| POST | `auth/login/` | returns `access`, `refresh`, and `user` |
| POST | `auth/token/refresh/` | new access token from a refresh token |
| POST | `auth/logout/` | blacklists the refresh token |
| GET/PATCH | `auth/me/` | current user |
| POST | `auth/change-password/` | `old_password`, `new_password` |
| GET/POST | `auth/users/` | admin only |
| GET/PATCH/DELETE | `auth/users/<id>/` | admin only |

## Students — `students/`

| Method | Path | Notes |
|---|---|---|
| GET/POST | `students/` | filters: `is_active`, `college`, `school`, `department`, `program`, `year_of_study` |
| GET/PATCH/DELETE | `students/<id>/` | |
| POST | `students/<id>/assign-nfc/` | body `uid`; admin only |
| POST | `students/<id>/nfc-status/` | `action` = deactivate \| report_lost \| reactivate; admin only |
| GET | `students/by_department/` | `?department_id=&year=` |
| GET | `students/by_program/` | `?program_id=&year=` |
| GET | `students/nfc-lookup/` | `?uid=` — student behind a card |
| CRUD | `students/colleges/`, `students/schools/`, `students/departments/`, `students/programs/` | organisation hierarchy (College → School → Department → Programme); write = admin; child lists filter by parent id, e.g. `?college=1` |

## Campus — `campus/`

| Method | Path | Notes |
|---|---|---|
| CRUD | `campus/directorates/` | administrative offices (Law 71/2013 admin wing); write = admin; filter by `wing` |

## Devices — `devices/`

| Method | Path | Notes |
|---|---|---|
| GET/POST | `devices/` | QR generated on create; `managing_directorate` optional; filters: `is_active`, `brand`, `owner` |
| GET/PATCH/DELETE | `devices/<id>/` | |
| POST | `devices/<id>/regenerate-qr/` | |
| POST | `devices/verify/` | body `qr_data` — returns device, owner, active loan |
| CRUD | `devices/loans/` | admin only |
| POST | `devices/loans/<id>/close/` | |

## Attendance — `attendance/`

| Method | Path | Notes |
|---|---|---|
| CRUD | `attendance/courses/` | write = admin or lecturer |
| CRUD | `attendance/sessions/` | write = admin or lecturer |
| POST | `attendance/sessions/<id>/close/` | |
| GET | `attendance/sessions/<id>/records/` | |
| CRUD | `attendance/records/` | |
| POST | `attendance/nfc-tap/` | `nfc_uid`, `session_id` — record attendance |
| CRUD | `attendance/campus-entries/` | admin or security |
| POST | `attendance/campus-nfc-tap/` | `nfc_uid`, `gate` — toggles entry/exit |
| GET | `attendance/summary/` | today's totals |

## Verification — `verification/`

| Method | Path | Notes |
|---|---|---|
| CRUD | `verification/incidents/` | admin or security; `handling_directorate` optional; filters: `type`, `severity`, `is_resolved` |
| POST | `verification/incidents/<id>/resolve/` | `resolution_notes`; admin only |
| GET | `verification/dashboard/` | aggregated counts for students, devices, attendance, incidents |
