export type Appearance = 'dark' | 'light'

const STORAGE_KEY = 'facecloud_theme'

/**
 * Appearance of the authenticated app shell.
 *
 * Dark is the default, matching the marketing site. The choice is stored per
 * browser; it is deliberately not a system-preference follow, because the
 * public pages are dark regardless and a visitor arriving from them expects
 * the app to look the same until they say otherwise.
 */
export function getStoredAppearance(): Appearance {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    // Private mode or blocked storage — fall back to the default.
    return 'dark'
  }
}

export function storeAppearance(appearance: Appearance): void {
  try {
    localStorage.setItem(STORAGE_KEY, appearance)
  } catch {
    // Non-fatal: the choice simply does not survive a reload.
  }
}
