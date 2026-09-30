import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'
import animationData from '../assets/veriva-logo.json'
import Slogan from './Slogan'

function paint(items, color) {
  for (const item of items) {
    if ((item.ty === 'fl' || item.ty === 'st') && !item.c.a) item.c.k = color
    if (item.it) paint(item.it, color)
  }
}

// `light` is the all-white logo for dark screens such as the card stations.
const whiteData = structuredClone(animationData)
whiteData.layers.forEach((layer) => paint(layer.shapes ?? [], [1, 1, 1, 1]))

export default function LogoLoader({ tone = 'dark', className = 'w-24 sm:w-28 lg:w-32' }) {
  const container = useRef(null)

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: tone === 'light' ? whiteData : animationData,
    })
    return () => anim.destroy()
  }, [tone])

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label="Loading">
      <div ref={container} className={`aspect-square ${className}`} />
      <Slogan animated tone={tone} />
    </div>
  )
}
