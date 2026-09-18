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
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-accent-tint">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-[15px] font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-[13px] max-w-xs mb-5 text-ink-mute leading-relaxed">{description}</p>
      {action && (
        <GradientButton onClick={action.onClick} size="sm">
          {action.label}
        </GradientButton>
      )}
    </div>
  )
}
