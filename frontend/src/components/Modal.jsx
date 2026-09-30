import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [open])

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white w-full ${sizes[size]} max-h-[92dvh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-xl animate-sheet-in sm:animate-fade-in motion-reduce:animate-none`}>
        <span aria-hidden className="sm:hidden mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between px-4 py-3 sm:p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
