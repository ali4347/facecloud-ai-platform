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

/* The `gradient` prop name is kept so callers don't change; on the light
   surface each option is a flat tint rather than a glow. */
const accentConfig = {
  blue:    { iconBg: '#EEF0FE', iconColor: '#4F46E5' },
  purple:  { iconBg: '#EEF0FE', iconColor: '#4338CA' },
  teal:    { iconBg: '#ECFEFF', iconColor: '#0891B2' },
  emerald: { iconBg: '#ECFDF5', iconColor: '#059669' },
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
              background: isPositive ? '#ECFDF5' : '#FEF2F2',
              color: isPositive ? '#047857' : '#B91C1C',
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
