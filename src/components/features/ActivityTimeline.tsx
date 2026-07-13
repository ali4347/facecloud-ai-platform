import type { ActivityEvent } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { Upload, Zap, CheckCircle, Download, Camera, Users, XCircle, LogIn, Shield, Mail } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActivityTimelineProps {
  events: ActivityEvent[]
}

const typeConfig = {
  upload: { icon: Upload, color: 'bg-primary/10 text-primary' },
  enhance: { icon: Zap, color: 'bg-purple-100 text-purple-700' },
  validate: { icon: CheckCircle, color: 'bg-green-100 text-success' },
  download: { icon: Download, color: 'bg-sky-100 text-sky-700' },
  live: { icon: Camera, color: 'bg-amber-100 text-warning' },
  group: { icon: Users, color: 'bg-indigo-100 text-indigo-700' },
  reject: { icon: XCircle, color: 'bg-red-100 text-error' },
  login: { icon: LogIn, color: 'bg-slate-100 text-muted' },
  admin: { icon: Shield, color: 'bg-purple-100 text-purple-700' },
  email: { icon: Mail, color: 'bg-teal-100 text-teal-700' },
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {events.map((event) => {
          const cfg = typeConfig[event.type]
          const IconComp = cfg.icon
          return (
            <div key={event.id} className="relative flex gap-4 pl-4">
              <div className={cn('relative z-10 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                <IconComp className="w-4 h-4" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm text-dark leading-snug">{event.message}</p>
                <p className="text-xs text-muted mt-0.5">{formatDateTime(event.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
