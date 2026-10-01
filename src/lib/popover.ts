/**
 * The topbar holds two popovers — notifications and the user menu. Opening one
 * should close the other, so they announce themselves here rather than each
 * knowing about the other.
 */
const EVENT = 'facecloud:popover'

export function announcePopoverOpen(id: string): void {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: id }))
}

/** Call `close` when a different popover opens. */
export function onOtherPopoverOpen(id: string, close: () => void): () => void {
  const handler = (e: Event) => {
    if ((e as CustomEvent<string>).detail !== id) close()
  }
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
