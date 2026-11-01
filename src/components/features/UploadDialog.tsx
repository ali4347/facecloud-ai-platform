import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import UploadSingle from '../../pages/user/UploadSingle'
import UploadMultiple from '../../pages/user/UploadMultiple'
import UploadZip from '../../pages/user/UploadZip'
import { UPLOAD_KINDS, UploadArt, type UploadKind } from './uploadKinds'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * The upload, as a popup over whatever page the person is on: the "+" in the bottom bar opens it, so they never leave
 * the page they were reading.
 *
 * It first asks what is being sent (one photo, several, a ZIP), then shows that upload screen itself, the same one the
 * Upload Center opens as a page, so the two cannot drift apart. Moving to another page (a link in a result) closes it.
 * Escape and the close button close it; a click outside does not, because a half-picked batch is easy to lose that way.
 * Rendered inside the app shell (not into <body>) so the glass styling that is scoped to it reaches the popup.
 */
export function UploadDialog({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [kind, setKind] = useState<UploadKind | null>(null)
  const chosen = UPLOAD_KINDS.find(option => option.kind === kind) ?? null

  // Callers pass a fresh function on some renders; the latest one is read at the moment it is needed.
  const latestClose = useRef(onClose)
  latestClose.current = onClose

  // A link inside a result takes the person to another page: the popup has done its job.
  const { pathname } = useLocation()
  const openedOn = useRef(pathname)
  useEffect(() => { if (pathname !== openedOn.current) latestClose.current() }, [pathname])

  // The page behind does not scroll; focus goes into the popup and comes back to the "+" afterwards.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow; previous?.focus?.() }
  }, [])
  useEffect(() => { panelRef.current?.focus() }, [kind])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { latestClose.current(); return }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.getClientRects().length > 0)
      if (items.length === 0) { event.preventDefault(); panel.focus(); return }
      const first = items[0], last = items[items.length - 1], active = document.activeElement
      if (!panel.contains(active) || active === panel) { event.preventDefault(); (event.shiftKey ? last : first).focus() }
      else if (event.shiftKey && active === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const rise = reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }
  const settle = reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
  // Opening springs; closing is a quick fade so the page is free again at once.
  const leave = reduced
    ? { opacity: 0, transition: { duration: 0.12 } }
    : { opacity: 0, y: 18, scale: 0.97, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const } }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-[3px] sm:items-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.18 } }} transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={rise} animate={settle} exit={leave}
        transition={reduced ? { duration: 0.15 } : { type: 'spring', bounce: 0.16, duration: 0.5 }}
        style={{ transformOrigin: '50% 100%' }}
        className="relative flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] border outline-none sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]"
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          {chosen && (
            <button
              type="button"
              onClick={() => setKind(null)}
              aria-label="Back to the upload types"
              className="rounded-xl border border-line p-2 text-ink-mute hover:bg-surface-mute hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[17px] font-semibold leading-tight tracking-tight text-ink">
              {chosen ? chosen.cta : 'New upload'}
            </h2>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-mute">
              {chosen ? chosen.line : 'What would you like to send? Every photo is checked and enhanced for you.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the upload window"
            className="rounded-xl border border-line p-2 text-ink-mute hover:bg-surface-mute hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {!chosen ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {UPLOAD_KINDS.map(option => (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => setKind(option.kind)}
                  className="fc-card group flex cursor-pointer flex-col gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <UploadArt kind={option.kind} compact className="h-28 sm:h-36" />
                  <span className="px-1.5 pb-1.5">
                    <span className="block text-[15px] font-semibold text-ink">{option.cta}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink-mute">{option.line}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <ErrorBoundary key={chosen.kind}>
              {chosen.kind === 'single' && <UploadSingle embedded />}
              {chosen.kind === 'multiple' && <UploadMultiple embedded />}
              {chosen.kind === 'zip' && <UploadZip embedded />}
            </ErrorBoundary>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
