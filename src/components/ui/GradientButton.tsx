import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

/* Primary is the brand orange with white text, matching the marketing site's
   main action. The component name is unchanged so every caller keeps working. */
const variants = {
  primary:   'bg-gradient-to-br from-accent to-accent-soft text-white font-semibold shadow-[0_4px_18px_rgba(249,115,22,0.30)] hover:shadow-[0_6px_26px_rgba(249,115,22,0.45)] active:scale-[0.98]',
  secondary: 'bg-surface text-ink-soft font-medium border border-line hover:bg-surface-mute hover:border-line-strong active:scale-[0.98]',
  ghost:     'text-ink-mute font-medium hover:bg-surface-mute hover:text-ink active:scale-[0.98]',
  danger:    'bg-red-500/10 text-red-400 font-medium border border-red-500/30 hover:bg-red-500/20 active:scale-[0.98]',
}

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs rounded-full gap-1.5',
  md: 'px-4 py-2.5 text-[13px] rounded-full gap-2',
  lg: 'px-6 py-3 text-sm rounded-full gap-2',
}

export function GradientButton({
  variant = 'primary', size = 'md', leftIcon, rightIcon, children, className, ...props
}: GradientButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
