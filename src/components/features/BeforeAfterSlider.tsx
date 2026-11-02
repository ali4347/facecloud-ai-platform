import { useState, useRef, useCallback } from 'react'
import { cn } from '../../lib/utils'

interface BeforeAfterSliderProps {
  className?: string
  beforeLabel?: string
  afterLabel?: string
  beforeColor?: string
  afterColor?: string
  beforeSrc?: string
  afterSrc?: string
  beforeStyle?: React.CSSProperties
  afterStyle?: React.CSSProperties
  /** External position value for auto-demo (0-100). Once user drags, external updates are ignored. */
  initialPosition?: number
}

export function BeforeAfterSlider({
  className,
  beforeLabel = 'Original',
  afterLabel = 'Enhanced',
  beforeColor = '#1e293b',
  afterColor = '#3b82f6',
  beforeSrc,
  afterSrc,
  beforeStyle,
  afterStyle,
  initialPosition,
}: BeforeAfterSliderProps) {
  // The handle follows the auto-demo value until the person moves it; from then on their own position wins. It is worked
  // out while rendering (not copied into state by an effect), so the 60-per-second demo costs one render a frame, not two.
  const [moved, setMoved] = useState<number | null>(null)
  const position = moved ?? initialPosition ?? 50
  const setPosition = (next: number | ((pos: number) => number)) =>
    setMoved(prev => (typeof next === 'function' ? next(prev ?? initialPosition ?? 50) : next))
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setMoved(Math.round((x / rect.width) * 100))
  }, [])

  // Dragging event listeners (pointer capture/document listeners)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId)
    }
    updatePosition(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    updatePosition(e.clientX)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false)
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPosition(pos => Math.max(0, pos - 2))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPosition(pos => Math.min(100, pos + 2))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setPosition(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setPosition(100)
    }
  }

  const hasImages = beforeSrc && afterSrc

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Compare the original and FaceCloud AI-enhanced image"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={position}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        'relative select-none rounded-3xl overflow-hidden cursor-col-resize h-72 sm:h-96 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]',
        className
      )}
      style={{ touchAction: 'pan-y' }} // prevent scrolling only horizontally
    >
      {/* Before (left) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={hasImages ? { background: '#000' } : { background: `linear-gradient(135deg, ${beforeColor} 0%, #0f172a 100%)` }}
      >
        {hasImages ? (
          <img
            src={beforeSrc}
            alt="Original unprocessed portrait"
            className="w-full h-full object-cover"
            style={{ ...beforeStyle, objectPosition: 'center 30%' }}
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <MockFaceDisplay tint={beforeColor} dark />
        )}
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase rounded-full border border-white/10">
            {beforeLabel}
          </span>
        </div>
      </div>

      {/* After (right, clipped) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          ...(hasImages ? { background: '#000' } : { background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)' }),
        }}
      >
        {hasImages ? (
          <img
            src={afterSrc}
            alt="AI enhanced portrait"
            className="w-full h-full object-cover"
            style={{ ...afterStyle, objectPosition: 'center 30%' }}
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <MockFaceDisplay tint={afterColor} />
        )}
        <div className="absolute top-4 right-4 z-20">
          <span className="px-3 py-1 bg-[#F97316]/25 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase rounded-full border border-[#F97316]/30">
            {afterLabel} ✨
          </span>
        </div>
      </div>

      {/* Divider handle */}
      <div
        className={cn(
          "absolute top-0 bottom-0 z-10 flex items-center justify-center pointer-events-none",
          dragging && "scale-105"
        )}
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-0.5 h-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
        <div className="absolute w-8 h-8 rounded-full bg-black/80 border border-white/40 shadow-2xl flex items-center justify-center ring-2 ring-[#F97316]/40 backdrop-blur-sm transition-transform duration-200">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 5l-3 5 3 5M13 5l3 5-3 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function MockFaceDisplay({ tint, dark = false }: { tint: string; dark?: boolean }) {
  return (
    <svg width="140" height="180" viewBox="0 0 140 180" fill="none" className="opacity-80">
      {/* Face outline */}
      <ellipse cx="70" cy="90" rx="55" ry="65" fill={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)'} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      {/* Eyes */}
      <ellipse cx="52" cy="78" rx="8" ry="5" fill="rgba(255,255,255,0.4)" />
      <ellipse cx="88" cy="78" rx="8" ry="5" fill="rgba(255,255,255,0.4)" />
      <circle cx="52" cy="78" r="3" fill={dark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'} />
      <circle cx="88" cy="78" r="3" fill={dark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'} />
      {/* Nose */}
      <path d="M70 85 L64 100 L76 100" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mouth */}
      <path d="M55 112 Q70 122 85 112" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Scan corners (enhanced version only) */}
      {!dark && (
        <>
          <path d="M20 25 L20 15 L30 15" stroke={tint} strokeWidth="2" strokeLinecap="round" />
          <path d="M110 25 L110 15 L100 15" stroke={tint} strokeWidth="2" strokeLinecap="round" />
          <path d="M20 155 L20 165 L30 165" stroke={tint} strokeWidth="2" strokeLinecap="round" />
          <path d="M110 155 L110 165 L100 165" stroke={tint} strokeWidth="2" strokeLinecap="round" />
          <circle cx="52" cy="78" r="12" stroke={tint} strokeWidth="1" strokeDasharray="3 2" fill="none" />
          <circle cx="88" cy="78" r="12" stroke={tint} strokeWidth="1" strokeDasharray="3 2" fill="none" />
        </>
      )}
    </svg>
  )
}
