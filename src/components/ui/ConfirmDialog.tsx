import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  children: React.ReactNode
  confirmLabel: string
  /** Shown instead of the label while the action runs. */
  busyLabel?: string
  busy?: boolean
  error?: string | null
  /** Destructive actions are red. */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** A small modal for actions that cannot be undone. Escape cancels; focus starts on Cancel so Enter is safe. */
export function ConfirmDialog({
  title, children, confirmLabel, busyLabel, busy = false, error, danger = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px]"
      onMouseDown={e => { if (e.target === e.currentTarget && !busy) onCancel() }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-soft-lg p-6 space-y-4">
        <h2 id="confirm-title" className="text-base font-bold text-ink">{title}</h2>
        <div className="text-sm text-ink-mute space-y-2">{children}</div>
        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="fc-btn-secondary text-xs py-2 px-4">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={`text-xs font-bold py-2 px-4 rounded-xl text-white inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-accent hover:opacity-90'}`}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
