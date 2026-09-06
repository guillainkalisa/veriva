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
    isAdmin: role === 'admin',
    isSecurity: role === 'security',
    isLecturer: role === 'lecturer',

    canManageUsers:       is('admin'),
    canManageOrg:         is('admin'),
    canManageStudents:    is('admin'),
    canManageDevices:     is('admin'),
    canManageLoans:       is('admin'),

    canManageCourses:     is('admin', 'lecturer'),
    canManageAttendance:  is('admin', 'lecturer'),
    canRecordClassNFC:    is('admin', 'lecturer'),

    canVerifyDevice:      is('admin', 'security'),
    canRunNFCStation:     is('admin', 'security'),
    canRecordCampusNFC:   is('admin', 'security'),
    canViewCampusEntries: is('admin', 'security'),
    canLookupCard:        is('admin', 'security'),
    canManageIncidents:   is('admin', 'security'),
    canResolveIncidents:  is('admin'),
  }
}
