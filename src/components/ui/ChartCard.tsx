import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ChartCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ChartCard({ title, subtitle, action, children, className, delay = 0 }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn('fc-card p-6', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink leading-tight">{title}</h3>
          {subtitle && <p className="text-[12px] mt-1 text-ink-mute leading-snug">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </motion.div>
  )
}
