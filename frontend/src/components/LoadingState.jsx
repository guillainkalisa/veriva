import { createPortal } from 'react-dom'
import LogoLoader from './LogoLoader'

// Page loaders float in the middle of the content area (below the phone top
// bar, right of the desktop sidebar); `inline` keeps the loader in place,
// e.g. inside a modal.
export default function LoadingState({ inline = false }) {
  if (inline) {
    return (
      <div className="flex items-center justify-center py-12">
        <LogoLoader className="w-20 sm:w-24" />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-[50vh]" />
      {createPortal(
        <div className="fixed inset-x-0 bottom-0 top-14 lg:top-0 lg:left-64 z-10 flex items-center justify-center pointer-events-none animate-fade-in">
          <LogoLoader />
        </div>,
        document.body,
      )}
    </>
  )
}
