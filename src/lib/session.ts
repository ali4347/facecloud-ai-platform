import type { Role } from '../data/mock'

export interface Session {
  token?: string
  role: Role
  email: string
  name: string
  initials: string
  emailVerified?: boolean
}

/** Per-role identity used only when no session is readable. */
const FALLBACK: Record<Role, { name: string; email: string; initials: string }> = {
  user:      { name: 'Ali Hassan',     email: 'user@facecloud.ai',      initials: 'AH' },
  admin:     { name: 'Ali Hassan',     email: 'admin@dtm.io',           initials: 'AH' },
  moderator: { name: 'Vaneeza Sohaib', email: 'moderator@facecloud.ai', initials: 'VS' },
}

/**
 * The signed-in person, or null.
 *
 * Every surface that shows who is logged in reads through here. Several pages
 * used to carry a hardcoded name instead, so a dashboard could greet the wrong
 * person — which is exactly what it did.
 */
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem('facecloud_session')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.role) return null
    return parsed as Session
  } catch {
    // Malformed or blocked storage — treat it as signed out.
    return null
  }
}

/**
 * Identity to display for a portal. Falls back to the role's demo account when
 * the session is missing or belongs to a different role.
 */
export function getSessionUser(role: Role): { name: string; email: string; initials: string } {
  const base = FALLBACK[role]
  const session = getSession()
  if (!session || session.role !== role) return base
  return {
    name:     session.name     || base.name,
    email:    session.email    || base.email,
    initials: session.initials || base.initials,
  }
}

/** First name, for greetings. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}
