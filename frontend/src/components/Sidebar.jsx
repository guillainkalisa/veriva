import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Laptop, CalendarCheck,
  ShieldAlert, DoorOpen, LogOut, BookOpen, ChevronRight, ScanLine, Wifi
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const ALL_NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',      roles: ['admin', 'security', 'lecturer'] },
  { to: '/students',   icon: Users,           label: 'Students',       roles: ['admin', 'lecturer'] },
  { to: '/devices',    icon: Laptop,          label: 'Devices',        roles: ['admin'] },
  { to: '/verify',     icon: ScanLine,        label: 'Verify Device',  roles: ['admin', 'security'] },
  { to: '/attendance', icon: CalendarCheck,   label: 'Attendance',     roles: ['admin', 'lecturer'] },
  { to: '/nfc-station', icon: Wifi,            label: 'NFC Station',    roles: ['admin', 'security'] },
  { to: '/campus',     icon: DoorOpen,        label: 'Campus Entries', roles: ['admin', 'security'] },
  { to: '/courses',    icon: BookOpen,        label: 'Courses',        roles: ['admin', 'lecturer'] },
  { to: '/incidents',  icon: ShieldAlert,     label: 'Incidents',      roles: ['admin', 'security'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navItems = ALL_NAV.filter((item) => item.roles.includes(user?.role))

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-900 flex flex-col z-20">
      <div className="p-6 border-b border-brand-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <ShieldAlert size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">VERIVA</h1>
            <p className="text-brand-300 text-xs mt-0.5">Campus Verification</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-brand-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.full_name?.[0] ?? user?.username?.[0] ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.full_name || user?.username}
            </p>
            <p className="text-brand-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-brand-200 hover:bg-brand-800 hover:text-white text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
