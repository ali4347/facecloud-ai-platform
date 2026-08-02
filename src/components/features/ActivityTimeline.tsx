import type { ActivityEvent } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { Upload, Zap, CheckCircle, Download, Camera, Users, XCircle, LogIn, Shield, Mail } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActivityTimelineProps {
  events: ActivityEvent[]
}

const typeConfig = {
  upload: { icon: Upload, color: 'bg-primary/10 text-primary' },
  enhance: { icon: Zap, color: 'bg-[#EA580C]/15 text-[#EA580C]' },
  validate: { icon: CheckCircle, color: 'bg-[#10B981]/15 text-[#10B981]' },
  download: { icon: Download, color: 'bg-[#FB923C]/15 text-[#FB923C]' },
  live: { icon: Camera, color: 'bg-[#F59E0B]/15 text-[#F59E0B]' },
  group: { icon: Users, color: 'bg-[#F97316]/15 text-[#F97316]' },
  reject: { icon: XCircle, color: 'bg-[#EF4444]/15 text-[#EF4444]' },
  login: { icon: LogIn, color: 'bg-white/[0.05] text-white/50' },
  admin: { icon: Shield, color: 'bg-[#EA580C]/15 text-[#EA580C]' },
  email: { icon: Mail, color: 'bg-[#FB923C]/15 text-[#FB923C]' },
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
