/**
 * A `?next=` address is followed after signing in only when it is a page of this app that a signed-in user may be
 * sent to: an invitation link, or the user dashboard. Anything else (another site, `//host`, `javascript:`, the admin
 * or moderator portals) is ignored, so a crafted sign-in link cannot send someone elsewhere.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some(c => c.charCodeAt(0) < 32)) return null
  const path = value.split(/[?#]/)[0]
  if (/^\/invitations\/[^/]+$/.test(path)) return value
  if (path === '/dashboard' || path.startsWith('/dashboard/')) return value
  return null
}
