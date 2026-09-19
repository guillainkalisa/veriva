import { useAuth } from './useAuth'
import { ROLE_LABEL } from '../nav'

// Mirrors the backend permission matrix (accounts/permissions.py).
// The API is the real gate; these flags just keep the UI honest.
export function useRole() {
  const { user } = useAuth()
  const role = user?.role ?? null
  const is = (...roles) => roles.includes(role)

  return {
    role,
    roleLabel: ROLE_LABEL[role] ?? 'Unknown',
    assignedGates: user?.assigned_gates ?? [],

    isAdmin: role === 'admin',
    isSecurityChief: role === 'security_chief',
    isSecurityGuard: role === 'security',
    isLecturer: role === 'lecturer',
    isHod: role === 'hod',
    isDean: role === 'dean',

    assignedDepartment: user?.assigned_department ?? null,
    assignedDepartmentName: user?.assigned_department_name ?? null,
    assignedSchool: user?.assigned_school ?? null,
    assignedSchoolName: user?.assigned_school_name ?? null,

    canManageUsers:       is('admin'),
    canManageOrg:         is('admin'),
    canManageStudents:    is('admin'),
    canManageDevices:     is('admin'),
    canManageLoans:       is('admin'),
    canManageGates:       is('admin'),

    canManageCourses:     is('admin', 'lecturer', 'hod', 'dean'),
    canManageAttendance:  is('admin', 'lecturer'),
    canRecordClassNFC:    is('admin', 'lecturer'),

    canVerifyDevice:      is('admin', 'security_chief', 'security'),
    canRunNFCStation:     is('admin', 'security_chief', 'security'),
    canRecordCampusNFC:   is('admin', 'security_chief', 'security'),
    canViewCampusEntries: is('admin', 'security_chief', 'security'),
    canLookupCard:        is('admin', 'security_chief', 'security'),
    canManageIncidents:   is('admin', 'security_chief', 'security'),
    canResolveIncidents:  is('admin', 'security_chief'),

    seesAllGates:         is('admin', 'security_chief'),
  }
}
