import { useEffect, useRef } from 'react'
import { useAppearance } from '../../lib/theme'

/* One seamless loop for both appearances: the footage's last second is blended into its first (baked with ffmpeg), so it neither jumps nor plays
   backwards. The poster is its first frame, so nothing else shows while it loads. The earlier forward / reverse cuts of the dark portrait and the
   light appearance's matte cut are no longer used here; their files are still in public/videos. */
const VIDEO_SRC = '/videos/facecloud-hero-sunset.mp4'
const POSTER_SRC = '/videos/facecloud-hero-sunset-poster.jpg'
const PLAYBACK_RATE = 0.7

export function BackgroundVideo() {
  const [appearance] = useAppearance()
  const light = appearance === 'light'
  const videoRef = useRef<HTMLVideoElement>(null)
  // Someone who asked for less motion sees the still poster, not the video.
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches).current

  // Pause while the tab is hidden, and carry on when it comes back.
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current
      if (!video || reducedMotion) return
      if (document.hidden) video.pause()
      else video.play().catch(() => {})
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [reducedMotion])

  // Slower than real time: the footage plays at 0.7x. The rate is set again whenever playback starts, because a browser can reset it.
  const slow = () => { const video = videoRef.current; if (video) { video.defaultPlaybackRate = PLAYBACK_RATE; video.playbackRate = PLAYBACK_RATE } }

  return (
    <div className="fc-hero-ground absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Keyed by the appearance so the video remounts cleanly (it stays still: the cursor does not move or zoom it); in the
          light appearance its edges fade out, so no rectangle of the video's frame can show against the page. */}
      <div
        key={appearance}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={light ? {
          WebkitMaskImage: 'radial-gradient(ellipse 62% 72% at 50% 56%, #000 52%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 62% 72% at 50% 56%, #000 52%, transparent 100%)',
        } : undefined}
      >
        <video
          ref={videoRef}
          autoPlay={!reducedMotion}
          loop
          muted
          playsInline
          preload={reducedMotion ? 'none' : 'auto'}
          poster={POSTER_SRC}
          aria-hidden="true"
          tabIndex={-1}
          onLoadedMetadata={slow}
          onPlay={slow}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover scale-[1.08] lg:scale-[1.18] origin-center will-change-transform"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      {light ? (
        /* A soft cream veil behind the headline, so dark text stays readable over the portrait */
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{ background: 'radial-gradient(ellipse 48% 42% at 50% 52%, rgba(243,236,228,0.34) 0%, transparent 70%)' }}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
