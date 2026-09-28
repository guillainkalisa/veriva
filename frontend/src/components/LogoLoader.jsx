import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'
import animationData from '../assets/veriva-logo.json'
import Slogan from './Slogan'

export default function LogoLoader({ className = 'w-24 sm:w-28 lg:w-32' }) {
  const container = useRef(null)

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    })
    return () => anim.destroy()
  }, [])

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label="Loading">
      <div ref={container} className={`aspect-square ${className}`} />
      <Slogan animated />
    </div>
  )
}
