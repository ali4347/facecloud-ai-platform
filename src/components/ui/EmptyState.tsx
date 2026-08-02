import type { LucideIcon } from 'lucide-react'
import { GradientButton } from './GradientButton'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(249, 115, 22,0.10)', border: '1px solid rgba(249, 115, 22,0.20)' }}
      >
        <Icon className="w-8 h-8" style={{ color: '#FB923C' }} />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm max-w-xs mb-5" style={{ color: 'rgba(255,255,255,0.48)' }}>{description}</p>
      {action && (
        <GradientButton onClick={action.onClick} size="sm">
          {action.label}
        </GradientButton>
      )}
    </div>
  )
}
