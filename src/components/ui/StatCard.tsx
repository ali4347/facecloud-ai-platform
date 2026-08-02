import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  gradient?: 'blue' | 'purple' | 'teal' | 'emerald'
  delay?: number
  className?: string
}

const accentConfig = {
  blue:    { iconBg: 'rgba(249, 115, 22,0.15)',   iconBorder: 'rgba(249, 115, 22,0.28)',   iconColor: '#FB923C' },
  purple:  { iconBg: 'rgba(234, 88, 12,0.15)',  iconBorder: 'rgba(234, 88, 12,0.28)',  iconColor: '#A78BFA' },
  teal:    { iconBg: 'rgba(249, 115, 22,0.15)',  iconBorder: 'rgba(249, 115, 22,0.28)',  iconColor: '#FB923C' },
  emerald: { iconBg: 'rgba(79,255,176,0.12)',  iconBorder: 'rgba(79,255,176,0.25)',  iconColor: '#4FFFB0' },
}

export function StatCard({ title, value, change, changeLabel, icon: Icon, gradient = 'blue', delay = 0, className }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0
  const accent = accentConfig[gradient]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16,1,0.3,1] }}
      className={cn('fc-panel fc-glass-hover p-5 overflow-hidden relative', className)}
    >
      {/* Subtle corner glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent.iconColor}22 0%, transparent 70%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div
            className="p-2.5 rounded-2xl"
            style={{ background: accent.iconBg, border: `1px solid ${accent.iconBorder}` }}
          >
            <Icon className="w-4 h-4" style={{ color: accent.iconColor }} />
          </div>

          {/* Trend badge */}
          {change !== undefined && (
            <div
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{
                background: isPositive ? 'rgba(79,255,176,0.10)' : 'rgba(239,68,68,0.10)',
                color: isPositive ? '#4FFFB0' : '#F87171',
              }}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{title}</p>
        {changeLabel && (
          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{changeLabel}</p>
        )}
      </div>
    </motion.div>
  )
}
