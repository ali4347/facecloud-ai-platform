import type { Role } from '../data/mock'

/**
 * The three doors into the app: the user dashboard, the admin console and the moderator panel.
 *
 * A browser keeps one localStorage per site, shared by every tab. When all three portals wrote their session and
 * refresh token under the same two keys, signing in as an administrator in one tab replaced the user's session in
 * another: the user tab was then sent to "Access Denied", or silently carried the administrator's token. Each portal
 * now has its own keys, so they can be signed in side by side and each one signs out on its own.
 */
export type Portal = Role

/** Which portal a path belongs to. Public pages, the user login and the user dashboard are all "user". */
export function portalForPath(path: string): Portal {
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin'
  if (path === '/moderator' || path.startsWith('/moderator/')) return 'moderator'
  return 'user'
}

/** The portal of the page the person is on right now. */
export function currentPortal(): Portal {
  return portalForPath(window.location.pathname)
}

export const sessionKey = (portal: Portal) => `facecloud_session:${portal}`
export const refreshKey = (portal: Portal) => `facecloud_refresh:${portal}`
export const wasSignedInKey = (portal: Portal) => `fc_was_logged_in:${portal}`

const LEGACY_SESSION = 'facecloud_session'
const LEGACY_REFRESH = 'facecloud_refresh'
const LEGACY_FLAG = 'fc_was_logged_in'

/**
 * Before the portals had their own keys there was one shared session. Whoever was signed in then keeps their session:
 * it is moved to its portal's keys once, and the shared keys are removed.
 */
function migrateSharedSession(): void {
  try {
    const raw = localStorage.getItem(LEGACY_SESSION)
    if (raw) {
      const role = JSON.parse(raw)?.role as Portal | undefined
      if (role === 'user' || role === 'admin' || role === 'moderator') {
        if (!localStorage.getItem(sessionKey(role))) localStorage.setItem(sessionKey(role), raw)
        const refresh = localStorage.getItem(LEGACY_REFRESH)
        if (refresh && !localStorage.getItem(refreshKey(role))) localStorage.setItem(refreshKey(role), refresh)
        localStorage.setItem(wasSignedInKey(role), '1')
      }
    }
    localStorage.removeItem(LEGACY_SESSION)
    localStorage.removeItem(LEGACY_REFRESH)
    localStorage.removeItem(LEGACY_FLAG)
  } catch {
    // Blocked or malformed storage: nothing to carry over.
  }
}

migrateSharedSession()
