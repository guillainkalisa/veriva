import { NavLink } from 'react-router-dom'
import { LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Slogan from './Slogan'
import { NAV, ROLE_LABEL, ROLE_BADGE } from '../nav'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const role = user?.role
  const navItems = NAV.filter((item) => item.roles.includes(role))

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-900 flex flex-col z-20">
      <div className="p-6 border-b border-brand-800">
        <div className="flex flex-col items-center gap-3">
          <img src="/veriva-logo-white.svg" alt="VERIVA" className="w-14 h-14" />
          <Slogan className="text-white" />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
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
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE_BADGE[role] || ROLE_BADGE.student}`}>
              {ROLE_LABEL[role] || 'Unknown'}
            </span>
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
