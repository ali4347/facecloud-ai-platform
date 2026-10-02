import { cn } from '../../lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'muted' | 'processing'
  label: string
  dot?: boolean
  className?: string
}

/* Badge palette on the dark card: a 12% tint, a matching hairline, and text
   from the light end of each ramp so it stays legible. */
const statusConfig = {
  success:    { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', text: '#34D399', dot: '#10B981' },
  warning:    { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', text: '#FCD34D', dot: '#F59E0B' },
  error:      { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)', text: '#F87171', dot: '#EF4444' },
  info:       { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.28)', text: '#FB923C', dot: '#F97316' },
  purple:     { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.28)', text: '#A78BFA', dot: '#8B5CF6' },
  muted:      { bg: 'rgb(var(--a-surface-mute))', border: 'rgb(var(--a-line))', text: 'rgb(var(--a-ink-mute))', dot: 'rgb(var(--a-ink-faint))' },
  processing: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.28)', text: '#FB923C', dot: '#F97316' },
}

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const cfg = statusConfig[status]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', className)}
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

/**
 * The pipeline's own verdict on a photo, which is not the same as whether the
 * upload worked: `display_status` from the API says accepted, rejected or sent
 * to a moderator. The older mock statuses are kept so unmigrated screens still
 * render while they wait their turn.
 */
export function uploadStatusBadge(status: string) {
  switch (status) {
    case 'accepted':     return <StatusBadge status="success"    label="Accepted" />
    case 'needs_review': return <StatusBadge status="warning"    label="In review" />
    case 'queued':       return <StatusBadge status="info"       label="Queued" />
    case 'processing':   return <StatusBadge status="processing" label="Processing" />
    case 'failed':       return <StatusBadge status="error"      label="Failed" />
    case 'cancelled':    return <StatusBadge status="muted"      label="Cancelled" />
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
