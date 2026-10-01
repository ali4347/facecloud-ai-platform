import { cn } from '../../lib/utils'
import { useAvatar, findPreset } from '../../lib/avatar'

interface AvatarProps {
  /** Account the avatar belongs to; avatars are stored per account. */
  email: string
  initials: string
  /** Rendered size in pixels. */
  size?: number
  /** Colour used when the account has not chosen an avatar yet. */
  fallbackColor?: string
  className?: string
  /** Decorative when a label sits next to it. */
  alt?: string
}

/**
 * One rendering of a person's avatar, used by the topbar, the sidebar and
 * Settings, so a change shows up everywhere at once.
 */
export function Avatar({
  email, initials, size = 36, fallbackColor = '#F97316', className, alt,
}: AvatarProps) {
  const [avatar] = useAvatar(email)

  const dimensions = { width: size, height: size }

  if (avatar?.kind === 'photo') {
    return (
      <img
        src={avatar.dataUrl}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        style={dimensions}
        className={cn('rounded-full object-cover flex-shrink-0', className)}
      />
    )
  }

  const preset = avatar?.kind === 'preset' ? findPreset(avatar.id) : undefined
  const background = preset
    ? `linear-gradient(135deg, ${preset.from}, ${preset.to})`
    : fallbackColor

  return (
    <span
      style={{ ...dimensions, background, fontSize: Math.round(size * 0.34) }}
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 select-none',
        className
      )}
      aria-hidden={alt ? undefined : true}
      aria-label={alt}
      role={alt ? 'img' : undefined}
    >
      {initials}
    </span>
  )
}
