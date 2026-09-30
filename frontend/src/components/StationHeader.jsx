import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

// Header for the full-screen kiosk pages. They hide the sidebar, so Back is
// the only way out; it falls back to `exitTo` when the page was opened directly.
export default function StationHeader({ title, exitTo, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const exit = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate(exitTo, { replace: true })
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sm:py-4 border-b border-brand-800">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={exit}
          className="flex items-center -ml-2 pl-1 pr-3 py-1.5 rounded-lg text-brand-200 text-sm font-medium hover:text-white hover:bg-brand-800/60 active:scale-95 transition-[color,background-color,transform] duration-300 ease-ios"
        >
          <ChevronLeft size={22} /> Back
        </button>
        <span className="h-8 w-px bg-brand-800" />
        <img src="/veriva-logo-white.svg" alt="VERIVA" className="w-9 h-9" />
        <p className="text-white font-semibold text-sm sm:text-base">{title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </header>
  )
}
