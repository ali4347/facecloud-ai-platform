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
      transition={{ duration: 0.45, delay, ease: [0.16,1,0.3,1] }}
      className={cn('fc-panel p-6', className)}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </motion.div>
  )
}
