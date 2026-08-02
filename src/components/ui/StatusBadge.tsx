import { cn } from '../../lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'muted' | 'processing'
  label: string
  dot?: boolean
  className?: string
}

const statusConfig = {
  success:    { bg: 'rgba(79,255,176,0.10)',   border: 'rgba(79,255,176,0.25)',   text: '#4FFFB0',           dot: '#4FFFB0' },
  warning:    { bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.25)',   text: '#FCD34D',           dot: '#F59E0B' },
  error:      { bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.25)',    text: '#F87171',           dot: '#EF4444' },
  info:       { bg: 'rgba(249, 115, 22,0.12)',    border: 'rgba(249, 115, 22,0.25)',   text: '#FB923C',           dot: '#F97316' },
  purple:     { bg: 'rgba(234, 88, 12,0.12)',   border: 'rgba(234, 88, 12,0.25)',   text: '#A78BFA',           dot: '#EA580C' },
  muted:      { bg: 'rgba(255,255,255,0.06)',  border: 'rgba(255,255,255,0.12)',  text: 'rgba(255,255,255,0.52)', dot: 'rgba(255,255,255,0.35)' },
  processing: { bg: 'rgba(249, 115, 22,0.12)',    border: 'rgba(249, 115, 22,0.25)',   text: '#FB923C',           dot: '#F97316' },
}

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const cfg = statusConfig[status]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', className)}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', status === 'processing' && 'animate-pulse')}
          style={{ background: cfg.dot }}
        />
      )}
      {label}
    </span>
  )
}

export function uploadStatusBadge(status: string) {
  switch (status) {
    case 'completed':  return <StatusBadge status="success"    label="Completed" />
    case 'rejected':   return <StatusBadge status="error"      label="Rejected" />
    case 'enhancing':  return <StatusBadge status="processing" label="Enhancing" />
    case 'validating': return <StatusBadge status="info"       label="Validating" />
    case 'resizing':   return <StatusBadge status="warning"    label="Resizing" />
    case 'grouping':   return <StatusBadge status="purple"     label="Grouping" />
    case 'uploaded':   return <StatusBadge status="muted"      label="Uploaded" />
    default:           return <StatusBadge status="muted"      label={status} />
  }
}
