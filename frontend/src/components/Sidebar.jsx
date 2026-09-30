import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Slogan from './Slogan'
import { NAV, ROLE_LABEL, ROLE_BADGE } from '../nav'

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const role = user?.role
  const navItems = NAV.filter((item) => item.roles.includes(role))
  const { pathname } = useLocation()
  const navRef = useRef(null)
  const [pill, setPill] = useState(null)

  useLayoutEffect(() => {
    const place = () => {
      const active = navRef.current?.querySelector('[aria-current="page"]')
      setPill((prev) => active
        ? { top: active.offsetTop, height: active.offsetHeight, animate: Boolean(prev) }
        : null)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [pathname, navItems.length])

  return (
    <aside
      className={`fixed bottom-0 left-0 top-[calc(3.5rem+env(safe-area-inset-top))] lg:top-0 z-40 w-72 max-w-[85vw] lg:w-64 bg-brand-900 flex flex-col lg:pt-safe pb-safe transition-transform duration-500 ease-ios motion-reduce:transition-none lg:translate-x-0 ${
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      <div className="hidden lg:block px-6 py-5 border-b border-brand-800">
        <div className="flex flex-col items-center gap-2.5">
          <img src="/veriva-logo-white.svg" alt="VERIVA" className="w-12 h-12" />
          <Slogan className="text-white" />
        </div>
      </div>

      <nav ref={navRef} className="relative flex-1 p-4 space-y-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:theme(colors.brand.700)_transparent]">
        {pill && (
          <span
            aria-hidden
            className={`absolute left-4 right-4 top-0 rounded-lg bg-brand-700 shadow-md shadow-black/20 ring-1 ring-white/10 ${
              pill.animate ? 'transition-[transform,height] duration-500 ease-ios motion-reduce:transition-none' : ''
            }`}
            style={{ transform: `translateY(${pill.top}px)`, height: pill.height }}
          />
        )}
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded-lg text-sm font-medium transition-[color,background-color,transform] duration-300 ease-ios active:scale-[0.97] group ${
                isActive ? 'text-white' : 'text-brand-200 hover:bg-brand-800/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={`transition-transform duration-300 ease-ios ${isActive ? 'scale-110' : ''}`} />
                <span className="flex-1">{label}</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-brand-800">
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
