import { useState, useEffect, useRef } from 'react'

const FORWARD_VIDEO_SRC = '/videos/facecloud-hero-forward.mp4'
const REVERSE_VIDEO_SRC = '/videos/facecloud-hero-reverse.mp4'
const POSTER_SRC = '/videos/facecloud-hero-poster.jpg'

type PlaybackDirection = 'forward' | 'reverse'

export function BackgroundVideo() {
  const [playbackDirection, setPlaybackDirection] = useState<PlaybackDirection>('forward')
  const forwardVideoRef = useRef<HTMLVideoElement>(null)
  const reverseVideoRef = useRef<HTMLVideoElement>(null)
  const motionWrapperRef = useRef<HTMLDivElement>(null)

  // Preload reverse video on mount
  useEffect(() => {
    reverseVideoRef.current?.load()
  }, [])

  // Auto-play forward video on mount or when playable
  const handleForwardCanPlay = () => {
    if (playbackDirection === 'forward') {
      forwardVideoRef.current?.play().catch(() => {})
    }
  }

  const handleForwardEnded = async () => {
    const forward = forwardVideoRef.current
    const reverse = reverseVideoRef.current

    if (!forward || !reverse) return

    forward.pause()
    reverse.currentTime = 0

    setPlaybackDirection('reverse')

    try {
      await reverse.play()
    } catch {
      // Fallback: if autoplay blocked, restart forward video
      handleReverseError()
    }
  }

  const handleReverseEnded = async () => {
    const forward = forwardVideoRef.current
    const reverse = reverseVideoRef.current

    if (!forward || !reverse) return

    reverse.pause()
    forward.currentTime = 0

    setPlaybackDirection('forward')

    try {
      await forward.play()
    } catch {
      // Keep initial reverse frame visible if playback is blocked
    }
  }

  const handleReverseError = () => {
    setPlaybackDirection('forward')
    const forward = forwardVideoRef.current
    if (forward) {
      forward.currentTime = 0
      forward.play().catch(() => {})
    }
  }

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const activeVideo =
        playbackDirection === 'forward'
          ? forwardVideoRef.current
          : reverseVideoRef.current

      if (document.hidden) {
        forwardVideoRef.current?.pause()
        reverseVideoRef.current?.pause()
      } else {
        activeVideo?.play().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [playbackDirection])

  // Desktop subtle mouse parallax on shared motion wrapper
  useEffect(() => {
    const wrapper = motionWrapperRef.current
    if (!wrapper) return

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
        wrapper.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.18)`
      })
    }

    window.addEventListener('mousemove', handleMove, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', handleMove)
      if (wrapper) wrapper.style.transform = ''
    }
  }, [])

  const getVideoClass = (direction: PlaybackDirection) => {
    const active = playbackDirection === direction

    return [
      'pointer-events-none absolute inset-0',
      'h-full w-full object-cover',
      'scale-[1.08] lg:scale-[1.18]',
      'origin-center will-change-transform',
      'transition-opacity duration-100 ease-linear',
      active ? 'opacity-100 z-[1]' : 'opacity-0 z-0',
    ].join(' ')
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-black">
      {/* Shared Parallax Motion Wrapper */}
      <div ref={motionWrapperRef} className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Forward Video */}
        <video
          ref={forwardVideoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={POSTER_SRC}
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={handleForwardCanPlay}
          onEnded={handleForwardEnded}
          className={getVideoClass('forward')}
        >
          <source src={FORWARD_VIDEO_SRC} type="video/mp4" />
        </video>

        {/* Reverse Video */}
        <video
          ref={reverseVideoRef}
          muted
          playsInline
          preload="metadata"
          poster={POSTER_SRC}
          aria-hidden="true"
          tabIndex={-1}
          onEnded={handleReverseEnded}
          onError={handleReverseError}
          className={getVideoClass('reverse')}
        >
          <source src={REVERSE_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      {/* Restrained readability overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.04)_45%,rgba(0,0,0,0.34)_100%)]"
      />

      {/* Subtle orange atmospheric glow — bottom center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            'radial-gradient(ellipse 55% 30% at 50% 80%, rgba(249,115,22,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
