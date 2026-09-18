import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'
import type { SystemService } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface SystemHealthCardProps {
  service: SystemService
}

const statusConfig = {
  operational: {
    icon: CheckCircle,
    cls: 'bg-green-50 border-green-200',
    iconCls: 'text-success',
    badge: 'bg-green-100 text-success',
    label: 'Operational',
  },
  degraded: {
    icon: AlertTriangle,
    cls: 'bg-amber-50 border-amber-200',
    iconCls: 'text-warning',
    badge: 'bg-amber-100 text-warning',
    label: 'Degraded',
  },
  outage: {
    icon: XCircle,
    cls: 'bg-red-50 border-red-200',
    iconCls: 'text-error',
    badge: 'bg-red-100 text-error',
    label: 'Outage',
  },
}

export function SystemHealthCard({ service }: SystemHealthCardProps) {
  const cfg = statusConfig[service.status]
  const IconComp = cfg.icon

  return (
    <div className={cn('border rounded-2xl p-4 transition-all', cfg.cls)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconComp className={cn('w-4 h-4 flex-shrink-0', cfg.iconCls)} />
          <p className="text-sm font-semibold text-ink">{service.name}</p>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', cfg.badge)}>
          {cfg.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-ink-mute">Uptime</p>
          <p className="font-semibold text-ink">{service.uptime}</p>
        </div>
        {service.latency && (
          <div>
            <p className="text-ink-mute">Latency</p>
            <p className="font-semibold text-ink flex items-center gap-1">
              <Activity className="w-3 h-3" /> {service.latency}
            </p>
          </div>
        )}
      </div>
      <p className="text-[10px] text-ink-mute mt-2">Checked {formatDateTime(service.lastChecked)}</p>
    </div>
  )
}
