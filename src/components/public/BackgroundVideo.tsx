import { useEffect, useRef } from 'react'

const VIDEO_SRC = 'https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8'

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<import('hls.js').default | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — native HLS
      video.src = VIDEO_SRC
      video.play().catch(() => {})
    } else {
      // Non-Safari — use hls.js
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled || !video) return
        if (Hls.isSupported()) {
          const hls = new Hls({ startLevel: -1, autoStartLoad: true })
          hlsRef.current = hls
          hls.loadSource(VIDEO_SRC)
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {})
          })
        } else {
          // Final fallback: try direct src
          video.src = VIDEO_SRC
          video.play().catch(() => {})
        }
      })
    }

    return () => {
      cancelled = true
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Black overlay — base darkness */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Radial vignette — edges darker */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.82) 100%)',
        }}
      />

      {/* Subtle blue-mint atmospheric glow — bottom center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 30% at 50% 80%, rgba(249, 115, 22,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Very subtle top glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 20% at 50% 0%, rgba(79,255,176,0.04) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}
