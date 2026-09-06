import {
  LayoutDashboard, Users, Laptop, ScanLine, Wifi,
  DoorOpen, CalendarCheck, BookOpen, ShieldAlert,
} from 'lucide-react'

// Single source of truth for navigation AND route access.
// `roles` = which roles may open the page; the API enforces the real boundary.
export const NAV = [
  { path: '/',            label: 'Dashboard',      icon: LayoutDashboard, roles: ['admin', 'security', 'lecturer'] },
  { path: '/students',    label: 'Students',       icon: Users,           roles: ['admin', 'security', 'lecturer'] },
  { path: '/devices',     label: 'Devices',        icon: Laptop,          roles: ['admin'] },
  { path: '/verify',      label: 'Verify Device',  icon: ScanLine,        roles: ['admin', 'security'] },
  { path: '/nfc-station', label: 'NFC Station',    icon: Wifi,            roles: ['admin', 'security'], fullscreen: true },
  { path: '/campus',      label: 'Campus Entries', icon: DoorOpen,        roles: ['admin', 'security'] },
  { path: '/attendance',  label: 'Attendance',     icon: CalendarCheck,   roles: ['admin', 'lecturer'] },
  { path: '/courses',     label: 'Courses',        icon: BookOpen,        roles: ['admin', 'lecturer'] },
  { path: '/incidents',   label: 'Incidents',      icon: ShieldAlert,     roles: ['admin', 'security'] },
]

export const ROLE_LABEL = {
  admin: 'Administrator',
  security: 'Security Officer',
  lecturer: 'Lecturer',
  student: 'Student',
}

export const ROLE_BADGE = {
  admin: 'bg-brand-100 text-brand-700',
  security: 'bg-amber-100 text-amber-700',
  lecturer: 'bg-emerald-100 text-emerald-700',
  student: 'bg-gray-100 text-gray-600',
}

export const canAccess = (path, role) => {
  const item = NAV.find((n) => n.path === path)
  return !!item && item.roles.includes(role)
}
