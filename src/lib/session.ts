import { useCallback, useEffect, useState } from 'react'
import type { Role } from '../data/mock'
import { currentPortal, sessionKey } from './portal'

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

/** The stored session of one portal, as text, or null. The user, admin and moderator sessions are kept apart. */
export function readSessionRaw(portal: Role): string | null {
  try {
    return localStorage.getItem(sessionKey(portal))
  } catch {
    return null
  }
}

/** Remember a signed-in person under their own portal. */
export function saveSession(session: Session): void {
  localStorage.setItem(sessionKey(session.role), JSON.stringify(session))
}

/** Forget one portal's session (this page's portal unless told otherwise); the other portals stay signed in. */
export function clearSession(portal: Role = currentPortal()): void {
  try {
    localStorage.removeItem(sessionKey(portal))
  } catch {
    // Blocked storage: there is nothing stored to clear.
  }
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
    const raw = readSessionRaw(currentPortal())
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

const SESSION_CHANGE = 'facecloud:session'

/** Initials from a display name: first letters of the first two words. */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const letters = (parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
  return letters.toUpperCase()
}

/**
 * Change the display name on the signed-in session.
 *
 * The name lives on the session rather than being duplicated into the profile
 * record, so there is one copy and nothing can drift out of step. Initials are
 * derived rather than stored separately for the same reason.
 */
export function updateSessionName(role: Role, name: string): void {
  const session = getSession()
  if (!session || session.role !== role) return
  const trimmed = name.trim()
  if (!trimmed) return
  const next: Session = { ...session, name: trimmed, initials: initialsFrom(trimmed) }
  try {
    saveSession(next)
  } catch {
    return
  }
  window.dispatchEvent(new Event(SESSION_CHANGE))
}

/** Identity for a portal, re-read whenever the session changes. */
export function useSessionUser(role: Role): { name: string; email: string; initials: string } {
  const [user, setUser] = useState(() => getSessionUser(role))

  const refresh = useCallback(() => setUser(getSessionUser(role)), [role])

  useEffect(() => {
    refresh()
    window.addEventListener(SESSION_CHANGE, refresh)
    return () => window.removeEventListener(SESSION_CHANGE, refresh)
  }, [refresh])

  return user
}
