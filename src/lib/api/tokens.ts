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
const REFRESH_KEY = 'facecloud_refresh'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Blocked storage: the session simply will not survive a reload.
  }
}

export function clearTokens(): void {
  accessToken = null
  setRefreshToken(null)
}
