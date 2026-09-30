import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'
import animationData from '../assets/menu-toggle.json'

// Frame ranges inside the animation: lines morph into an X, then back.
const TO_CLOSE_ICON = [30, 62]
const TO_MENU_ICON = [84, 112]

export default function MenuToggle({ open, onClick }) {
  const container = useRef(null)
  const anim = useRef(null)
  const mounted = useRef(false)

  useEffect(() => {
    anim.current = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData,
    })
    anim.current.goToAndStop(0, true)
    return () => anim.current.destroy()
  }, [])

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const segment = open ? TO_CLOSE_ICON : TO_MENU_ICON
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      anim.current.goToAndStop(segment[1], true)
    } else {
      anim.current.playSegments(segment, true)
    }
  }, [open])

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      className="flex items-center justify-center w-10 h-10 rounded-lg active:bg-brand-800 active:scale-95 transition-[background-color,transform] duration-300 ease-ios"
    >
      <span ref={container} className="block w-11 h-11" />
    </button>
  )
}
