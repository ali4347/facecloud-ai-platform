import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

/* Primary is solid ink rather than a gradient — on a light surface the flat
   dark button is what reads as "the action". The component name is unchanged
   so every existing caller keeps working. */
const variants = {
  primary:   'bg-ink text-white font-medium shadow-pill hover:bg-slate-800 active:scale-[0.98]',
  secondary: 'bg-surface text-ink-soft font-medium border border-line hover:bg-surface-mute hover:border-line-strong active:scale-[0.98]',
  ghost:     'text-ink-mute font-medium hover:bg-surface-mute hover:text-ink active:scale-[0.98]',
  danger:    'bg-red-50 text-red-600 font-medium border border-red-200 hover:bg-red-100 active:scale-[0.98]',
}

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs rounded-[10px] gap-1.5',
  md: 'px-4 py-2.5 text-[13px] rounded-xl gap-2',
  lg: 'px-6 py-3 text-sm rounded-[14px] gap-2',
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
