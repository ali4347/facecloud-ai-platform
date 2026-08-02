import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants = {
  primary:   'text-white font-semibold active:scale-[0.98]',
  secondary: 'text-white/85 font-semibold active:scale-[0.97]',
  ghost:     'font-medium active:scale-[0.97]',
  danger:    'font-semibold active:scale-[0.97]',
}

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3 text-[15px] rounded-2xl gap-2',
}

export function GradientButton({
  variant = 'primary', size = 'md', leftIcon, rightIcon, children, className, ...props
}: GradientButtonProps) {
  const getStyle = () => {
    switch (variant) {
      case 'primary':   return {
        background: 'linear-gradient(135deg, #F97316, #FB923C)',
        boxShadow: '0 4px 20px rgba(249, 115, 22,0.35), inset 0 1px 0 rgba(255,255,255,0.20)',
      }
      case 'secondary': return {
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(12px)',
      }
      case 'ghost':     return { color: 'rgba(255,255,255,0.55)' }
      case 'danger':    return {
        background: 'rgba(239,68,68,0.18)',
        border: '1px solid rgba(239,68,68,0.35)',
      }
    }
  }

  return (
    <button
      className={cn(
        'inline-flex items-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      style={getStyle()}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
