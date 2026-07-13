import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Stage {
  label: string
  status: 'done' | 'active' | 'pending' | 'failed'
  time?: string
}

interface ProcessingTimelineProps {
  stages: Stage[]
  className?: string
}

const stageConfig = {
  done: { icon: CheckCircle, cls: 'bg-green-100 text-success border-success/30', line: 'bg-success' },
  active: { icon: AlertCircle, cls: 'bg-soft-blue text-primary border-primary/30 animate-pulse', line: 'bg-border' },
  pending: { icon: Clock, cls: 'bg-slate-100 text-muted border-transparent', line: 'bg-border' },
  failed: { icon: XCircle, cls: 'bg-red-100 text-error border-red-200', line: 'bg-border' },
}

export function ProcessingTimeline({ stages, className }: ProcessingTimelineProps) {
  return (
    <div className={cn('flex items-start gap-0 overflow-x-auto pb-2', className)}>
      {stages.map((stage, i) => {
        const cfg = stageConfig[stage.status]
        const IconComp = cfg.icon
        return (
          <div key={stage.label} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', cfg.cls)}>
                <IconComp className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-dark whitespace-nowrap">{stage.label}</p>
              {stage.time && <p className="text-[10px] text-muted">{stage.time}</p>}
            </div>
            {i < stages.length - 1 && (
              <div className={cn('h-0.5 w-8 sm:w-16 mx-1 flex-shrink-0', cfg.line)} />
            )}
          </div>
        )
      })}
    </div>
  )
}
