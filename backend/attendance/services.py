from .models import AttendanceRecord


def course_eligibility(course):
    """Per-student attendance progress for a course, measured against its
    active roster and its closed sessions only (a session that hasn't
    happened yet doesn't count against anyone)."""
    closed_sessions = list(course.sessions.filter(is_open=False))
    required_minutes = sum(s.scheduled_minutes for s in closed_sessions)
    session_ids = [s.id for s in closed_sessions]

    counted_by_student = {}
    if session_ids:
        records = AttendanceRecord.objects.filter(session_id__in=session_ids).select_related('session')
        for record in records:
            counted_by_student[record.student_id] = (
                counted_by_student.get(record.student_id, 0) + record.counted_minutes
            )

    results = []
    for enrollment in course.enrollments.filter(is_active=True).select_related('student'):
        counted = counted_by_student.get(enrollment.student_id, 0)
        percent = round(counted / required_minutes * 100, 1) if required_minutes else 0
        results.append({
            'student': enrollment.student,
            'counted_minutes': counted,
            'required_minutes': required_minutes,
            'percent': percent,
            'eligible': percent >= course.min_attendance_percent,
        })
    return results
