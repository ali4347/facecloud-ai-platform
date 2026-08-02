import { useEffect, useRef } from 'react'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260725_114042_d2ed2a89-f2fa-449b-9609-da456344257b.mp4'

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleCanPlay = () => {
    videoRef.current?.play().catch(() => {})
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches

    if (reducedMotion || !desktop || !finePointer) return

    let frame = 0

    const handleMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const x = ((event.clientX / window.innerWidth) - 0.5) * 10
        const y = ((event.clientY / window.innerHeight) - 0.5) * 8
        video.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.18)`
      })
    }

    window.addEventListener('mousemove', handleMove, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', handleMove)
      if (video) video.style.transform = ''
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onCanPlay={handleCanPlay}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover scale-[1.08] lg:scale-[1.18] origin-center will-change-transform"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Restrained readability overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.04)_45%,rgba(0,0,0,0.34)_100%)]"
      />

      {/* Subtle orange atmospheric glow — bottom center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            'radial-gradient(ellipse 55% 30% at 50% 80%, rgba(249,115,22,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
