import { cn } from '../../lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'muted' | 'processing'
  label: string
  dot?: boolean
  className?: string
}

/* Light-surface badge palette: a soft tint, a matching hairline, and text dark
   enough to clear AA against the tint. */
const statusConfig = {
  success:    { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', dot: '#059669' },
  warning:    { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', dot: '#D97706' },
  error:      { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', dot: '#DC2626' },
  info:       { bg: '#EEF0FE', border: '#C7CBFB', text: '#4338CA', dot: '#4F46E5' },
  purple:     { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', dot: '#7C3AED' },
  muted:      { bg: '#F1F3F7', border: '#E6E9EF', text: '#64748B', dot: '#94A3B8' },
  processing: { bg: '#EEF0FE', border: '#C7CBFB', text: '#4338CA', dot: '#4F46E5' },
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
