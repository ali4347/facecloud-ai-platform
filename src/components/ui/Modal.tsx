import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { inShell } from '../../lib/inShell'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  /** Buttons along the bottom. */
  footer?: React.ReactNode
  /** Keeps Escape and a click outside from closing it (an action is running). */
  busy?: boolean
  wide?: boolean
  /** Nearly the whole screen, for looking at a photo. */
  huge?: boolean
}

/**
 * A dialog over the page, drawn inside the app shell like the other dialogs so the glass styling reaches it (and above the sidebar and the floating nav: see inShell).
 * Escape and the close button close it; focus moves into it and comes back to where it was.
 */
export function Modal({ title, onClose, children, footer, busy = false, wide = false, huge = false }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const latest = useRef({ busy, onClose })
  latest.current = { busy, onClose }

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !latest.current.busy) latest.current.onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [])

  return inShell(
    <div
      className="fixed inset-0 z-[70] flex overflow-y-auto p-4 bg-black/60 backdrop-blur-[2px]"
      onMouseDown={event => { if (event.target === event.currentTarget && !latest.current.busy) latest.current.onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`m-auto w-full ${huge ? 'max-w-5xl' : wide ? 'max-w-2xl' : 'max-w-md'} rounded-3xl border outline-none flex flex-col max-h-[calc(100dvh-2rem)]`}
      >
        <header className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <h2 id={titleId} className="flex-1 min-w-0 text-[16px] font-semibold text-ink truncate">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="p-2 rounded-xl border border-line text-ink-mute hover:bg-surface-mute hover:text-ink cursor-pointer disabled:opacity-60">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 text-sm text-ink-mute">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-line">{footer}</footer>}
      </div>
    </div>
  )
}
