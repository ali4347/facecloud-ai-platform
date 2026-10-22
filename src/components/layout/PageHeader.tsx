import { cn } from '../../lib/utils'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  useDocumentTitle(title)
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold text-ink tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-ink-mute mt-1 leading-snug">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  )
}
