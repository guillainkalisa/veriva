import {
  LayoutDashboard, Users, Laptop, ScanLine, Wifi,
  DoorOpen, CalendarCheck, BookOpen, ShieldAlert, Fingerprint,
} from 'lucide-react'

const SECURITY = ['admin', 'security_chief', 'security']

// Single source of truth for navigation AND route access.
// `roles` = which roles may open the page; the API enforces the real boundary.
export const NAV = [
  { path: '/',            label: 'Dashboard',      icon: LayoutDashboard, roles: ['admin', 'security_chief', 'security', 'lecturer', 'hod', 'dean'] },
  { path: '/students',    label: 'Students',       icon: Users,           roles: ['admin', 'security_chief', 'security', 'lecturer'] },
  { path: '/devices',     label: 'Devices',        icon: Laptop,          roles: ['admin'] },
  { path: '/verify',      label: 'Verify Device',  icon: ScanLine,        roles: ['admin', 'security_chief', 'security'] },
  { path: '/nfc-station', label: 'NFC Station',    icon: Wifi,            roles: SECURITY, fullscreen: true },
  { path: '/campus',      label: 'Campus Entries', icon: DoorOpen,        roles: SECURITY },
  { path: '/gates',       label: 'Gates',          icon: Fingerprint,     roles: ['admin'] },
  { path: '/attendance',  label: 'Attendance',     icon: CalendarCheck,   roles: ['admin', 'lecturer'] },
  { path: '/attendance/scan', label: 'Session Check-in', icon: Wifi,      roles: ['admin', 'lecturer'], fullscreen: true },
  { path: '/courses',     label: 'Courses',        icon: BookOpen,        roles: ['admin', 'lecturer', 'hod', 'dean'] },
  { path: '/incidents',   label: 'Incidents',      icon: ShieldAlert,     roles: SECURITY },
]

export const ROLE_LABEL = {
  admin: 'Administrator',
  security_chief: 'Security Chief',
  security: 'Security Guard',
  lecturer: 'Lecturer',
  hod: 'Head of Department',
  dean: 'Dean',
  student: 'Student',
}

export const ROLE_BADGE = {
  admin: 'bg-brand-100 text-brand-700',
  security_chief: 'bg-orange-100 text-orange-700',
  security: 'bg-amber-100 text-amber-700',
  lecturer: 'bg-emerald-100 text-emerald-700',
  hod: 'bg-teal-100 text-teal-700',
  dean: 'bg-indigo-100 text-indigo-700',
  student: 'bg-gray-100 text-gray-600',
}

export const canAccess = (path, role) => {
  const item = NAV.find((n) => n.path === path)
  return !!item && item.roles.includes(role)
}
