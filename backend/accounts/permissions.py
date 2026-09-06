from rest_framework.permissions import BasePermission, SAFE_METHODS

# The three operational roles. `student` accounts exist in the enum but have no
# self-service surface yet, so they get no API access.
STAFF_ROLES = {'admin', 'security', 'lecturer'}


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


class IsAdminOrSecurity(RolePermission):
    write_roles = {'admin', 'security'}


class IsAdminOrLecturer(RolePermission):
    write_roles = {'admin', 'lecturer'}


class IsStaff(RolePermission):
    """Any operational role. Read-only utility endpoints (dashboards, summaries)."""
    write_roles = STAFF_ROLES


class IsAdminOrReadOnly(RolePermission):
    write_roles = {'admin'}
    read_roles = STAFF_ROLES


class IsAdminOrSecurityOrReadOnly(RolePermission):
    write_roles = {'admin', 'security'}
    read_roles = STAFF_ROLES


class IsAdminOrLecturerOrReadOnly(RolePermission):
    write_roles = {'admin', 'lecturer'}
    read_roles = STAFF_ROLES
