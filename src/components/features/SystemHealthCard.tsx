import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'
import type { ServiceRow } from '../../lib/api/adminSystem'
import { serviceNote } from '../../lib/adminHealth'
import { formatBytes } from '../../lib/imageData'
import { formatDateTime } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface SystemHealthCardProps {
  service: ServiceRow
}

const statusConfig = {
  operational: { icon: CheckCircle, cls: 'bg-green-50 border-green-200', iconCls: 'text-success', badge: 'bg-green-100 text-success', label: 'Operational' },
  degraded: { icon: AlertTriangle, cls: 'bg-amber-50 border-amber-500/30', iconCls: 'text-warning', badge: 'bg-amber-100 text-warning', label: 'Degraded' },
  down: { icon: XCircle, cls: 'bg-red-500/10 border-red-500/30', iconCls: 'text-error', badge: 'bg-red-500/20 text-error', label: 'Down' },
}

/** One service as the backend checked it: its state, how long the check took, and the backend's own note. */
export function SystemHealthCard({ service }: SystemHealthCardProps) {
  const cfg = statusConfig[service.status as keyof typeof statusConfig] ?? statusConfig.degraded
  const IconComp = cfg.icon

  return (
    <div className={cn('border rounded-2xl p-4 transition-all', cfg.cls)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconComp className={cn('w-4 h-4 flex-shrink-0', cfg.iconCls)} />
          <p className="text-sm font-semibold text-ink">{service.name}</p>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', cfg.badge)}>
          {statusConfig[service.status as keyof typeof statusConfig] ? cfg.label : service.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {service.latency_ms !== null && (
          <div>
            <p className="text-ink-mute">Check took</p>
            <p className="font-semibold text-ink flex items-center gap-1"><Activity className="w-3 h-3" /> {service.latency_ms} ms</p>
          </div>
        )}
        {service.workers !== undefined && (
          <div>
            <p className="text-ink-mute">Workers</p>
            <p className="font-semibold text-ink">{service.workers}</p>
          </div>
        )}
        {service.queue_size !== undefined && (
          <div>
            <p className="text-ink-mute">Queue</p>
            <p className="font-semibold text-ink">{service.queue_size === null ? 'Unknown' : `${service.queue_size} waiting`}</p>
          </div>
        )}
        {service.available_bytes !== undefined && (
          <div>
            <p className="text-ink-mute">Free space</p>
            <p className="font-semibold text-ink">{formatBytes(service.available_bytes)}</p>
          </div>
        )}
      </div>
      {service.detail && <p className="text-[11px] text-ink-mute mt-2">{serviceNote(service.detail)}</p>}
      <p className="text-[10px] text-ink-mute mt-2">Checked {formatDateTime(service.checked_at)}</p>
    </div>
  )
}
