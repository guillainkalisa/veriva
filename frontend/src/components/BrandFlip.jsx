import { useEffect, useState } from 'react'
import Slogan from './Slogan'

// Phone header badge: the logo on the front, the slogan on the back. It turns
// over while the menu is open, and a tap flips it by hand.
export default function BrandFlip({ showSlogan = false, className = '' }) {
  const [tapped, setTapped] = useState(false)
  const flipped = showSlogan !== tapped

  useEffect(() => setTapped(false), [showSlogan])

  return (
    <button
      type="button"
      onClick={() => setTapped((t) => !t)}
      aria-label="VERIVA — Identity secured, Trust assured"
      className={`relative w-28 h-10 [perspective:600px] ${className}`}
    >
      <span
        className={`absolute inset-0 [transform-style:preserve-3d] transition-transform duration-700 ease-ios motion-reduce:transition-none ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <span className="absolute inset-0 flex items-center justify-end pr-1 [backface-visibility:hidden]">
          <img src="/veriva-logo-white.svg" alt="" className="w-8 h-8" />
        </span>
        <span className="absolute inset-0 flex items-center justify-end pr-1 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <Slogan compact className="text-white" />
        </span>
      </span>
    </button>
  )
}
