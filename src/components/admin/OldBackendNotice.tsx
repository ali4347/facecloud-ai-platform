import { AlertTriangle } from 'lucide-react'

/** Shown when the backend answers in the older shape: it is behind backend PR #86 and needs updating. */
export function OldBackendNotice({ what }: { what: string }) {
  return (
    <div role="status" className="p-3 mb-5 rounded-2xl text-xs flex items-start gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-ink-soft">
      <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
      <span>
        The backend you are connected to is older than backend PR #86, so {what}. Update it
        (<code className="fc-kbd">git pull origin main</code> in the backend folder, then restart it) to get the full details.
      </span>
    </div>
  )
}
