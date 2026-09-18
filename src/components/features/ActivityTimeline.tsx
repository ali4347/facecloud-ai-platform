import type { ActivityEvent } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { Upload, Zap, CheckCircle, Download, Camera, Users, XCircle, LogIn, Shield, Mail } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActivityTimelineProps {
  events: ActivityEvent[]
}

const typeConfig = {
  upload: { icon: Upload, color: 'bg-accent/10 text-accent' },
  enhance: { icon: Zap, color: 'bg-[#4338CA]/15 text-[#4338CA]' },
  validate: { icon: CheckCircle, color: 'bg-[#059669]/15 text-[#059669]' },
  download: { icon: Download, color: 'bg-[#6366F1]/15 text-[#6366F1]' },
  live: { icon: Camera, color: 'bg-[#D97706]/15 text-[#D97706]' },
  group: { icon: Users, color: 'bg-[#4F46E5]/15 text-[#4F46E5]' },
  reject: { icon: XCircle, color: 'bg-[#DC2626]/15 text-[#DC2626]' },
  login: { icon: LogIn, color: 'bg-surface-mute text-ink-mute' },
  admin: { icon: Shield, color: 'bg-[#4338CA]/15 text-[#4338CA]' },
  email: { icon: Mail, color: 'bg-[#6366F1]/15 text-[#6366F1]' },
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
                <p className="text-sm text-ink leading-snug">{event.message}</p>
                <p className="text-xs text-ink-mute mt-0.5">{formatDateTime(event.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
