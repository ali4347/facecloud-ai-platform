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
  /** Where the logo sits. 'app' follows the light / dark appearance; 'dark' is
   *  a surface that is always dark (the hero video, a photo), so it always
   *  gets the dark-background treatment. */
  tone?: 'dark' | 'app'
}

/*
 * The official FaceCloud logo, as approved artwork, never redrawn.
 *
 * Every file under public/branding/ is cut from the approved logo files
 * (see WORK_LOG, 2026-10-26): the stacked logo is the approved lockup as
 * delivered; the icon and the wordmark are the two halves of it; the
 * horizontal lockup puts those two halves side by side for bars that are too
 * short for the stacked logo. Each has a light-background and a
 * dark-background treatment (the dark one carries the approved glow and the
 * dark-grey "Face"), and the right one is chosen by CSS from the page's
 * appearance, so no JavaScript runs on a theme change.
 *
 * Intrinsic sizes are written here so the browser reserves the space before
 * the image arrives, and the image is only ever scaled by height, so it
 * cannot be stretched.
 */
const ASSETS = {
  full:       { light: { src: '/branding/facecloud-logo-full.png',            w: 1199, h: 704 }, dark: { src: '/branding/facecloud-logo-dark.png',            w: 893,  h: 576 } },
  horizontal: { light: { src: '/branding/facecloud-logo-horizontal.png',      w: 1540, h: 360 }, dark: { src: '/branding/facecloud-logo-horizontal-dark.png', w: 1421, h: 360 } },
  icon:       { light: { src: '/branding/facecloud-logo-icon.png',            w: 873,  h: 505 }, dark: { src: '/branding/facecloud-logo-icon-dark.png',       w: 540,  h: 374 } },
  wordmark:   { light: { src: '/branding/facecloud-wordmark.png',             w: 1229, h: 229 }, dark: { src: '/branding/facecloud-wordmark-dark.png',        w: 893,  h: 181 } },
} as const

type Lockup = keyof typeof ASSETS

/* Text colours for the words that are not part of the artwork (the "AI
   Platform" line and a portal's role label). */
const toneConfig = {
  dark: {
    subText:  'text-white/40',
    roleText: 'bg-gradient-to-r from-[#FB923C] to-[#F97316] bg-clip-text text-transparent',
    ring:     'focus-visible:ring-[#F97316] hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]',
  },
  app: {
    subText:  'text-ink-faint',
    roleText: 'text-accent',
    ring:     'focus-visible:ring-accent',
  },
} as const

/* Heights. A row lockup (icon, horizontal, wordmark) is sized like a line of
   chrome; the stacked logo needs about twice that to stay readable. */
const rowHeights = {
  xs: 'h-5', sm: 'h-7', md: 'h-9', lg: 'h-12', xl: 'h-16', hero: 'h-24 md:h-28',
}
const stackedHeights = {
  xs: 'h-12', sm: 'h-16', md: 'h-20', lg: 'h-28', xl: 'h-36', hero: 'h-48 md:h-56',
}
const subTextSizes = {
  xs: 'text-[6px]', sm: 'text-[7px]', md: 'text-[8px]', lg: 'text-[9px]', xl: 'text-[11px]', hero: 'text-[13px] md:text-[14px]',
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
  tone = 'dark',
}: FaceCloudLogoProps) {
  const t = toneConfig[tone]

  // Which lockup to draw. The older 'light' / 'dark' names meant the horizontal lockup.
  let lockup: Lockup = variant === 'light' || variant === 'dark' ? 'horizontal' : variant
  if (!showText && lockup !== 'wordmark') lockup = 'icon'
  const stacked = lockup === 'full'
  const heightClass = stacked ? stackedHeights[size] : rowHeights[size]
  const alt = decorative ? '' : lockup === 'icon' ? 'FaceCloud' : 'FaceCloud AI'

  const picture = (treatment: 'light' | 'dark', extra: string) => {
    const a = ASSETS[lockup][treatment]
    return (
      <img
        key={treatment}
        src={a.src}
        width={a.w}
        height={a.h}
        alt={alt}
        aria-hidden={decorative ? 'true' : undefined}
        draggable={false}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('block w-auto max-w-none select-none', heightClass, extra)}
      />
    )
  }

  /* On an always-dark surface only the dark treatment is drawn. Everywhere
     else both are in the page and the stylesheet shows the one that matches
     the appearance (see .fc-logo-on-light / .fc-logo-on-dark in index.css). */
  const artwork = tone === 'dark'
    ? picture('dark', '')
    : [picture('light', 'fc-logo-on-light'), picture('dark', 'fc-logo-on-dark')]

  const innerContent = (
    <>
      {artwork}
      {stacked && showSubtitle && (
        <span className={cn('mt-2 font-bold tracking-[0.25em] uppercase font-mono', t.subText, subTextSizes[size])}>
          AI Platform
        </span>
      )}
      {roleLabel && (
        <span className={cn('block font-bold tracking-wider uppercase leading-none font-mono text-[10px]', t.roleText, stacked ? 'mt-2.5' : 'mt-1.5')}>
          {roleLabel}
        </span>
      )}
    </>
  )

  const layout = cn('inline-flex flex-col', stacked ? 'items-center text-center' : 'items-start', className)

  if (href) {
    return (
      <Link
        to={href}
        aria-label={decorative ? undefined : 'FaceCloud home'}
        className={cn(layout, 'focus-visible:outline-none focus-visible:ring-2 rounded-xl transition-all duration-300 hover:opacity-90', t.ring)}
      >
        {innerContent}
      </Link>
    )
  }

  return <div className={layout}>{innerContent}</div>
}
