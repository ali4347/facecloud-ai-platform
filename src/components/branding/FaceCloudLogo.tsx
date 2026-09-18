import { useId } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export interface FaceCloudLogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'wordmark' | 'light' | 'dark'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  showText?: boolean
  showSubtitle?: boolean
  roleLabel?: string
  className?: string
  href?: string
  priority?: boolean
  decorative?: boolean
  /** Where the logo sits. 'app' is the dashboard shell, which themes its own
   *  text colours; 'dark' is the black marketing site. */
  tone?: 'dark' | 'app'
}

/* Two tones so the same mark works on the marketing pages and in the app
   shell. The mark itself is brand orange in both; only the wordmark colours
   differ, and in the shell they follow the appearance tokens. */
const toneConfig = {
  dark: {
    cloudFrom: '#F97316', cloudTo: '#EA580C',
    faceFrom:  '#FB923C', faceTo:  '#FDBA74',
    faceText:  'text-white',
    cloudText: 'bg-gradient-to-r from-[#FB923C] to-[#F97316] bg-clip-text text-transparent',
    subText:   'text-white/35',
    roleText:  'bg-gradient-to-r from-[#FB923C] to-[#F97316] bg-clip-text text-transparent',
    ring:      'focus-visible:ring-[#F97316] hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]',
  },
  app: {
    cloudFrom: '#F97316', cloudTo: '#EA580C',
    faceFrom:  '#FB923C', faceTo:  '#FDBA74',
    faceText:  'text-ink',
    cloudText: 'text-accent',
    subText:   'text-ink-faint',
    roleText:  'text-accent',
    ring:      'focus-visible:ring-accent',
  },
} as const

// Map size to classes for outer container and SVG dimensions
const sizeClasses = {
  xs: 'h-5',
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-16',
  hero: 'h-24 md:h-28',
}

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
  hero: 'text-4xl md:text-5xl',
}

const subTextSizes = {
  xs: 'text-[6px]',
  sm: 'text-[7px]',
  md: 'text-[8px]',
  lg: 'text-[9px]',
  xl: 'text-[11px]',
  hero: 'text-[13px] md:text-[14px]',
}

export function FaceCloudLogo({
  variant = 'horizontal',
  size = 'md',
  showText = true,
  showSubtitle = true,
  roleLabel,
  className,
  href,
  decorative = false,
  tone = 'dark',
}: FaceCloudLogoProps) {

  const t = toneConfig[tone]
  /* Gradient ids must be unique per instance: two logos of different tones on
     one page would otherwise share a single <defs> and render the same colour. */
  const uid = useId().replace(/:/g, '')
  const cloudGradId = `fcCloud-${uid}`
  const faceGradId = `fcFace-${uid}`

  // Active variant determination
  let activeVariant = variant
  if (!showText && (variant === 'full' || variant === 'horizontal' || variant === 'icon' || variant === 'wordmark')) {
    activeVariant = 'icon'
  } else if (!showSubtitle && variant === 'full') {
    activeVariant = 'horizontal'
  }

  // Pure SVG icon representing FaceCloud (Cloud + Biometric Scan)
  const renderSvgIcon = () => (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("object-contain h-full w-auto", sizeClasses[size])}
      aria-hidden={decorative ? "true" : undefined}
    >
      <defs>
        <linearGradient id={cloudGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={t.cloudFrom} />
          <stop offset="100%" stopColor={t.cloudTo} />
        </linearGradient>
        <linearGradient id={faceGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={t.faceFrom} />
          <stop offset="100%" stopColor={t.faceTo} />
        </linearGradient>
      </defs>
      
      {/* Cloud Outline */}
      <path
        d="M28.5 28.5A5.5 5.5 0 0 0 34 23c0-2.45-1.63-4.52-3.92-5.16A7.5 7.5 0 0 0 16.5 14.5c0 .43.04.86.12 1.28A5.5 5.5 0 0 0 11 21c0 2.68 1.95 4.9 4.58 5.38"
        stroke={`url(#${cloudGradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Face Scan Brackets */}
      <path d="M12 16h-3v-3" stroke={`url(#${faceGradId})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M28 16h3v-3" stroke={`url(#${faceGradId})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 28h-3v3" stroke={`url(#${faceGradId})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M28 28h3v3" stroke={`url(#${faceGradId})`} strokeWidth="2" strokeLinecap="round" />
      
      {/* Stylized Center Face Scan Target */}
      <circle cx="20" cy="22" r="5" stroke={`url(#${faceGradId})`} strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M20 14v16M12 22h16" stroke={`url(#${faceGradId})`} strokeWidth="1" strokeOpacity="0.4" />
    </svg>
  )

  // Wordmark Text Component
  const renderWordmark = () => (
    <div className={cn(
      "flex flex-col justify-center",
      activeVariant === 'full' ? "items-center text-center mt-2.5" : "items-start ml-3"
    )}>
      <div className="flex items-baseline">
        <span className={cn("font-extrabold tracking-tight", t.faceText, textSizes[size])} style={{ fontFamily: "'Space Mono', monospace" }}>
          Face
        </span>
        <span className={cn("font-medium tracking-tight", t.cloudText, textSizes[size])} style={{ fontFamily: "'Space Mono', monospace" }}>
          Cloud
        </span>
      </div>
      {showSubtitle && (
        <span className={cn("font-bold tracking-[0.25em] uppercase font-mono", t.subText, subTextSizes[size])}>
          AI Platform
        </span>
      )}
    </div>
  )

  // Layout selection based on variant
  const renderLayout = () => {
    switch (activeVariant) {
      case 'icon':
        return renderSvgIcon()
      case 'wordmark':
        return renderWordmark()
      case 'full':
        return (
          <div className="flex flex-col items-center justify-center">
            {renderSvgIcon()}
            {renderWordmark()}
          </div>
        )
      case 'horizontal':
      case 'light':
      case 'dark':
      default:
        return (
          <div className="flex items-center">
            {renderSvgIcon()}
            {renderWordmark()}
          </div>
        )
    }
  }

  const innerContent = (
    <>
      {renderLayout()}
      {roleLabel && (
        <span className={cn(
          "block font-bold tracking-wider uppercase leading-none font-mono",
          t.roleText,
          activeVariant === 'full' ? "mt-2.5 text-[10px]" : "mt-1.5 text-[10px]"
        )}>
          {roleLabel}
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link
        to={href}
        className={cn(
          "inline-flex flex-col focus-visible:outline-none focus-visible:ring-2 rounded-xl transition-all duration-300 hover:opacity-90",
          t.ring,
          activeVariant === 'full' ? "items-center" : "items-start",
          className
        )}
      >
        {innerContent}
      </Link>
    )
  }

  return (
    <div className={cn(
      "inline-flex flex-col",
      activeVariant === 'full' ? "items-center" : "items-start",
      className
    )}>
      {innerContent}
    </div>
  )
}
