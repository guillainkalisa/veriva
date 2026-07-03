import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()
  const role = user?.role

  return {
    role,
    isAdmin:    role === 'admin',
    isSecurity: role === 'security',
    isLecturer: role === 'lecturer',
    canManageStudents: role === 'admin',
    canManageDevices:  role === 'admin',
    canManageCourses:  role === 'admin' || role === 'lecturer',
    canManageAttendance: role === 'admin' || role === 'lecturer',
    canManageIncidents:  role === 'admin' || role === 'security',
    canResolveIncidents: role === 'admin',
    canVerifyDevice:     role === 'admin' || role === 'security',
  }
}
