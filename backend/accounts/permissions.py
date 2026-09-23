from rest_framework.permissions import BasePermission, SAFE_METHODS

# Operational roles. `student` accounts exist in the enum but have no
# self-service surface yet, so they get no API access.
SECURITY_ROLES = {'admin', 'security_chief', 'security'}
STAFF_ROLES = {'admin', 'security_chief', 'security', 'lecturer', 'hod', 'dean'}


def role_of(request):
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None
    return getattr(user, 'role', None)


class RolePermission(BasePermission):
    """Grant full access to `write_roles`; if `read_roles` is set, also grant
    SAFE_METHODS (GET/HEAD/OPTIONS) to those roles."""
    write_roles = frozenset()
    read_roles = None

    def has_permission(self, request, view):
        role = role_of(request)
        if role is None:
            return False
        if role in self.write_roles:
            return True
        if self.read_roles is not None and request.method in SAFE_METHODS:
            return role in self.read_roles
        return False


class IsAdmin(RolePermission):
    write_roles = {'admin'}


class IsAdminOrSecurityChief(RolePermission):
    write_roles = {'admin', 'security_chief'}


class IsAdminOrSecurity(RolePermission):
    """Admin, the security chief, and gate guards."""
    write_roles = SECURITY_ROLES


class IsAdminOrLecturer(RolePermission):
    write_roles = {'admin', 'lecturer'}


class IsStaff(RolePermission):
    """Any operational role. Read-only utility endpoints (dashboards, summaries)."""
    write_roles = STAFF_ROLES


class IsAdminOrReadOnly(RolePermission):
    write_roles = {'admin'}
    read_roles = STAFF_ROLES


class IsAdminOrSecurityOrReadOnly(RolePermission):
    write_roles = SECURITY_ROLES
    read_roles = STAFF_ROLES


class IsAdminOrLecturerOrReadOnly(RolePermission):
    write_roles = {'admin', 'lecturer'}
    read_roles = STAFF_ROLES


class IsCourseOwnerOrAdmin(RolePermission):
    """Any staff role may read; only admin or the course's own lecturer may write.
    `obj` may be a Course, or anything with a `course` FK (e.g. AttendanceSession)."""
    write_roles = {'admin', 'lecturer'}
    read_roles = STAFF_ROLES

    def has_object_permission(self, request, view, obj):
        role = role_of(request)
        if role == 'admin':
            return True
        if request.method in SAFE_METHODS:
            return role in self.read_roles
        course = obj if hasattr(obj, 'lecturer') else obj.course
        return course.lecturer_id == request.user.id


class IsCourseOwnerOrAdminStrict(RolePermission):
    """Like IsCourseOwnerOrAdmin, but with no 'any staff can read' shortcut -
    even GET requires exact ownership. For nested per-course student data
    (roster, enrollable students) where any-lecturer read would leak other
    lecturers' students."""
    write_roles = {'admin', 'lecturer'}

    def has_object_permission(self, request, view, obj):
        role = role_of(request)
        if role == 'admin':
            return True
        course = obj if hasattr(obj, 'lecturer') else obj.course
        return course.lecturer_id == request.user.id


class IsCourseManagerOrAdmin(RolePermission):
    """Courses are created and assigned by admin/HoD/dean, not by lecturers -
    a lecturer only ever operates on a course already assigned to them
    (setting their attendance threshold, opening sessions, enrolling
    students), never creates or deletes one. Any staff role may read.
    `obj` is a Course."""
    write_roles = {'admin', 'lecturer', 'hod', 'dean'}
    read_roles = STAFF_ROLES

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if role_of(request) == 'lecturer' and view.action in ('create', 'destroy'):
            return False
        return True

    def has_object_permission(self, request, view, obj):
        role = role_of(request)
        if role == 'admin':
            return True
        if request.method in SAFE_METHODS:
            return role in self.read_roles
        if role == 'lecturer':
            return obj.lecturer_id == request.user.id
        if role == 'hod':
            return obj.department_id is not None and obj.department_id == request.user.assigned_department_id
        if role == 'dean':
            return obj.department_id is not None and obj.department.school_id == request.user.assigned_school_id
        return False
