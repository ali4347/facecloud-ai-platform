/**
 * Token storage.
 *
 * The access token is held in memory only: it lasts 15 minutes, and keeping it
 * out of localStorage means a cross-site scripting bug cannot read a working
 * credential straight off the disk. The refresh token has to survive a reload,
 * so it is stored — and it **rotates**, meaning each refresh returns a new one
 * that replaces the old. Storing the newest is not optional; miss a rotation
 * and the session is dead.
 */
import { currentPortal, refreshKey, type Portal } from '../portal'

/* Every function takes the portal it is for and defaults to the page the person is on, so the user, admin and
   moderator portals each have their own tokens and never see one another's. */
const accessTokens: Record<Portal, string | null> = { user: null, admin: null, moderator: null }

export function getAccessToken(portal: Portal = currentPortal()): string | null {
  return accessTokens[portal]
}

export function setAccessToken(token: string | null, portal: Portal = currentPortal()): void {
  accessTokens[portal] = token
}

export function getRefreshToken(portal: Portal = currentPortal()): string | null {
  try {
    return localStorage.getItem(refreshKey(portal))
  } catch {
    return null
  }
}

export function setRefreshToken(token: string | null, portal: Portal = currentPortal()): void {
  try {
    if (token) localStorage.setItem(refreshKey(portal), token)
    else localStorage.removeItem(refreshKey(portal))
  } catch {
    // Blocked storage: the session simply will not survive a reload.
  }
}

export function clearTokens(portal: Portal = currentPortal()): void {
  accessTokens[portal] = null
  setRefreshToken(null, portal)
}
