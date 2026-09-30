import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'
import animationData from '../assets/success-tick.json'

// The tick is drawn in three source colours; each tone swaps them for its own.
const SOURCE = { '26,94,255': 'accent', '94,147,237': 'mid', '197,210,231': 'track' }

const TONES = {
  brand:   { accent: '#2563eb', mid: '#60a5fa', track: '#dbeafe', halo: 'bg-brand-500' },
  success: { accent: '#16a34a', mid: '#4ade80', track: '#dcfce7', halo: 'bg-green-500' },
  light:   { accent: '#ffffff', mid: '#e0e7ff', track: '#ffffff', halo: 'bg-white' },
}

// Frames where the circle and tick draw in; the export blanks out after 111.
const DRAW = [21, 72]

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)

const cache = {}
function dataFor(tone) {
  if (cache[tone]) return cache[tone]
  const data = structuredClone(animationData)
  const paint = (items) => items.forEach((item) => {
    if (item.ty === 'st' && !item.c.a) {
      const role = SOURCE[item.c.k.slice(0, 3).map((v) => Math.round(v * 255)).join(',')]
      if (role) item.c.k = [...hexToRgb(TONES[tone][role]), 1]
    }
    if (item.it) paint(item.it)
  })
  data.assets.forEach((asset) => asset.layers.forEach((layer) => paint(layer.shapes ?? [])))
  return (cache[tone] = data)
}

export default function SuccessTick({ tone = 'brand', size = 24, className = '' }) {
  const container = useRef(null)

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: dataFor(tone),
    })
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      anim.goToAndStop(DRAW[1], true)
    } else {
      anim.setSpeed(1.3)
      anim.playSegments(DRAW, true)
    }
    return () => anim.destroy()
  }, [tone])

  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }} role="img" aria-label="Done">
      <span aria-hidden className={`absolute inset-[20%] rounded-full ${TONES[tone].halo} animate-tick-halo motion-reduce:hidden`} />
      <span ref={container} className="relative block w-full h-full" />
    </span>
  )
}
