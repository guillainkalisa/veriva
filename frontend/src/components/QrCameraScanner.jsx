import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { CameraOff } from 'lucide-react'

// Opens the camera (the back one on phones) and reports the first QR code it
// reads. Unmount the component to release the camera.
export default function QrCameraScanner({ onScan }) {
  const videoRef = useRef(null)
  const onScanRef = useRef(onScan)
  const [error, setError] = useState(null)

  onScanRef.current = onScan

  useEffect(() => {
    if (!window.isSecureContext) {
      setError('The camera only works over HTTPS (or on localhost).')
      return
    }

    let done = false
    const scanner = new QrScanner(
      videoRef.current,
      ({ data }) => {
        if (done) return
        done = true
        scanner.stop()
        onScanRef.current(data)
      },
      { preferredCamera: 'environment', highlightScanRegion: true, returnDetailedScanResult: true },
    )

    scanner.start().catch((err) => {
      const message = String(err?.message ?? err)
      setError(/not ?allowed|permission/i.test(message)
        ? 'Camera access was blocked. Allow it in the browser and try again.'
        : 'No camera found on this device.')
    })

    return () => scanner.destroy()
  }, [])

  if (error) {
    return (
      <div className="aspect-video rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <CameraOff size={28} className="text-gray-400" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  // The library draws its scan-region overlay next to the video, so it needs a positioned parent.
  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
    </div>
  )
}
