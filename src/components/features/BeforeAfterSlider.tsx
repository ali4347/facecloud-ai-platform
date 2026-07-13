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
}

export function BeforeAfterSlider({
  className,
  beforeLabel = 'Original',
  afterLabel = 'Enhanced',
  beforeColor = '#1e293b',
  afterColor = '#3b82f6',
  beforeSrc,
  afterSrc,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) updatePosition(e.clientX)
  }, [dragging, updatePosition])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX)
  }, [updatePosition])

  const hasImages = beforeSrc && afterSrc

  return (
    <div
      ref={containerRef}
      className={cn('relative select-none rounded-3xl overflow-hidden cursor-col-resize h-72 sm:h-96', className)}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={onTouchMove}
      onTouchEnd={() => setDragging(false)}
    >
      {/* Before (left) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={hasImages ? { background: '#000' } : { background: `linear-gradient(135deg, ${beforeColor} 0%, #0f172a 100%)` }}
      >
        {hasImages ? (
          <img src={beforeSrc} alt="Before" className="w-full h-full object-contain" draggable={false} />
        ) : (
          <MockFaceDisplay tint={beforeColor} dark />
        )}
        <div className="absolute bottom-3 left-3 z-20">
          <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
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
          <img src={afterSrc} alt="After" className="w-full h-full object-contain" draggable={false} />
        ) : (
          <MockFaceDisplay tint={afterColor} />
        )}
        <div className="absolute bottom-3 right-3 z-20">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full ring-1 ring-white/30">
            {afterLabel} ✨
          </span>
        </div>
      </div>

      {/* Divider handle */}
      <div
        className="absolute top-0 bottom-0 z-10 flex items-center justify-center"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <div className="w-0.5 h-full bg-white/80 shadow-lg" />
        <div className="absolute w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center ring-2 ring-primary-200">
          <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 5l-3 5 3 5M13 5l3 5-3 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
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
