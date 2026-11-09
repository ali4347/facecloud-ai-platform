import { X } from 'lucide-react'
import type { Notice } from '../../lib/useNotice'

export function NoticeBar({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  if (!notice) return null
  return (
    <div
      role="status"
      className={`p-3 rounded-2xl text-xs border flex items-start justify-between gap-3 ${
        notice.kind === 'ok' ? 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]' : 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]'
      }`}
    >
      <span>{notice.text}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}
