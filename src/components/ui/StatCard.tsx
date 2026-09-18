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

/* The `gradient` prop name is kept so callers don't change; each option is a
   flat tint on the card rather than a glow. */
const accentConfig = {
  blue:    { iconBg: 'rgba(249,115,22,0.12)', iconColor: '#F97316' },
  purple:  { iconBg: 'rgba(249,115,22,0.12)', iconColor: '#EA580C' },
  teal:    { iconBg: 'rgba(56,189,248,0.12)', iconColor: '#38BDF8' },
  emerald: { iconBg: 'rgba(16,185,129,0.12)', iconColor: '#10B981' },
}

export function StatCard({ title, value, change, changeLabel, icon: Icon, gradient = 'blue', delay = 0, className }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0
  const accent = accentConfig[gradient]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn('fc-card p-5', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent.iconBg }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: accent.iconColor }} />
        </div>

        {change !== undefined && (
          <div
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full"
            style={{
              background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: isPositive ? '#34D399' : '#F87171',
            }}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <p className="text-[26px] font-semibold text-ink tracking-tight leading-none">{value}</p>
      <p className="text-[13px] mt-2 text-ink-mute">{title}</p>
      {changeLabel && <p className="text-[11px] mt-1 text-ink-faint">{changeLabel}</p>}
    </motion.div>
  )
}
