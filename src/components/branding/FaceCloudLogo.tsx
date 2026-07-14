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
}

const variantPaths = {
  full: '/branding/facecloud-logo-full.png',
  horizontal: '/branding/facecloud-logo-horizontal.png',
  icon: '/branding/facecloud-logo-icon.png',
  wordmark: '/branding/facecloud-wordmark.png',
  light: '/branding/facecloud-logo-light.png',
  dark: '/branding/facecloud-logo-dark.png',
}

const sizeClasses = {
  xs: 'h-5',
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-16',
  hero: 'h-24 md:h-28',
}

const ratioClasses = {
  full: 'aspect-square',
  horizontal: 'aspect-[3.6/1]',
  icon: 'aspect-square',
  wordmark: 'aspect-[4.5/1]',
  light: 'aspect-square',
  dark: 'aspect-square',
}

export function FaceCloudLogo({
  variant = 'horizontal',
  size = 'md',
  showText = true,
  showSubtitle = true,
  roleLabel,
  className,
  href,
  priority = false,
  decorative = false,
}: FaceCloudLogoProps) {
  // Determine actual variant to render based on options
  let activeVariant = variant
  if (!showText && (variant === 'full' || variant === 'horizontal' || variant === 'wordmark')) {
    activeVariant = 'icon'
  } else if (!showSubtitle && variant === 'full') {
    activeVariant = 'horizontal'
  }

  // Determine source image path
  const src = variantPaths[activeVariant]

  // Image component
  const imgElement = (
    <img
      src={src}
      alt={decorative ? "" : "FaceCloud AI Platform logo"}
      aria-hidden={decorative ? "true" : undefined}
      loading={priority ? "eager" : "lazy"}
      className={cn(
        "object-contain w-auto max-w-full transition-all duration-300",
        sizeClasses[size],
        ratioClasses[activeVariant]
      )}
    />
  )

  // Wrap in link if href or redirect is set
  const logoContent = href ? (
    <Link
      to={href}
      className={cn(
        "inline-flex flex-col items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0084FF] rounded-xl transition-all duration-300 hover:opacity-90 hover:drop-shadow-[0_0_8px_rgba(22,139,255,0.3)]",
        className
      )}
    >
      {imgElement}
      {roleLabel && (
        <span className="block text-[10px] font-bold tracking-wider uppercase mt-1 bg-gradient-to-r from-[#60B1FF] to-[#168BFF] bg-clip-text text-transparent leading-none">
          {roleLabel}
        </span>
      )}
    </Link>
  ) : (
    <div className={cn("inline-flex flex-col items-start", className)}>
      {imgElement}
      {roleLabel && (
        <span className="block text-[10px] font-bold tracking-wider uppercase mt-1 bg-gradient-to-r from-[#60B1FF] to-[#168BFF] bg-clip-text text-transparent leading-none">
          {roleLabel}
        </span>
      )}
    </div>
  )

  return logoContent
}
