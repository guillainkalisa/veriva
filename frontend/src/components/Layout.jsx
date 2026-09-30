import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import BrandFlip from './BrandFlip'
import MenuToggle from './MenuToggle'
import Sidebar from './Sidebar'
import { NAV } from '../nav'

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const title = NAV.find((n) => n.path === pathname)?.label ?? 'VERIVA'

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen)
    return () => document.body.classList.remove('overflow-hidden')
  }, [menuOpen])

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div
        aria-hidden
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-500 ease-ios ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <header className="lg:hidden sticky top-0 z-50 grid grid-cols-[7rem_1fr_7rem] items-center gap-2 px-2 pt-safe h-[calc(3.5rem+env(safe-area-inset-top))] bg-brand-900 text-white shadow-md shadow-black/10">
        <MenuToggle open={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
        <p className="text-center font-semibold truncate">{title}</p>
        <BrandFlip showSlogan={menuOpen} className="justify-self-end" />
      </header>

      <main className="flex-1 min-w-0 lg:ml-64 px-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-8">
        <div key={pathname} className="animate-page-in motion-reduce:animate-none">
          {children}
        </div>
      </main>
    </div>
  )
}
