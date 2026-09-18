import { useCallback, useEffect, useState } from 'react'

export type Appearance = 'dark' | 'light'

const STORAGE_KEY = 'facecloud_theme'
const CHANGE_EVENT = 'facecloud:appearance'

/**
 * Light / dark appearance for the whole site.
 *
 * The choice lives on <html data-theme>, which is what every stylesheet rule
 * keys off, and is stored per browser. Dark is the default: FaceCloud's brand
 * is the black-and-orange marketing site, so that is what a first-time visitor
 * should see. Orange stays the accent in both appearances.
 */
export function getStoredAppearance(): Appearance {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    // Private mode or blocked storage — fall back to the default.
    return 'dark'
  }
}

/** Paint the appearance. Safe to call before React mounts. */
export function applyAppearance(appearance: Appearance): void {
  document.documentElement.dataset.theme = appearance
}

export function storeAppearance(appearance: Appearance): void {
  try {
    localStorage.setItem(STORAGE_KEY, appearance)
  } catch {
    // Non-fatal: the choice simply does not survive a reload.
  }
}

/**
 * Read and change the appearance from a component.
 *
 * The custom event keeps separate consumers in step — the marketing navbar and
 * the dashboard topbar each own a toggle, and a route change can swap which one
 * is mounted without the icon falling out of sync.
 */
export function useAppearance(): [Appearance, () => void] {
  const [appearance, setAppearance] = useState<Appearance>(getStoredAppearance)

  useEffect(() => {
    applyAppearance(appearance)
  }, [appearance])

  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Appearance>).detail
      setAppearance(current => (current === next ? current : next))
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])

  const toggle = useCallback(() => {
    setAppearance(current => {
      const next: Appearance = current === 'dark' ? 'light' : 'dark'
      storeAppearance(next)
      applyAppearance(next)
      window.dispatchEvent(new CustomEvent<Appearance>(CHANGE_EVENT, { detail: next }))
      return next
    })
  }, [])

  return [appearance, toggle]
}
