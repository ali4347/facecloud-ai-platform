import { apiFetch, ApiError } from './client'
import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from './tokens'
import type { Role } from '../../data/mock'
import { initialsFrom } from '../session'

export interface ApiUser {
  id?: number | string
  username?: string
  email: string
  /** First and last name, or the username when the person has no name on record. */
  full_name?: string
  first_name?: string
  last_name?: string
  [key: string]: unknown
}

/** A completed sign-in. */
export interface SignedIn {
  kind: 'signed-in'
  role: Role
  /** Which dashboard to open; the backend sends the same value as `role`. */
  dashboard: Role
  user: ApiUser
}

export type LoginResult = SignedIn

interface TokenPayload {
  access?: string
  refresh?: string
  role?: Role
  dashboard?: Role
  user?: ApiUser
}

function storeSession(data: TokenPayload): SignedIn {
  setAccessToken(data.access ?? null)
  if (data.refresh) setRefreshToken(data.refresh)
  const role = (data.role ?? 'user') as Role
  return {
    kind: 'signed-in',
    role,
    dashboard: (data.dashboard ?? role) as Role,
    user: data.user ?? { email: '' },
  }
}

/**
 * Sign in with a username or an email.
 *
 * Wrong credentials, an unverified account and a suspended account all come
 * back as 400 with the same kind of message, deliberately, so that accounts
 * cannot be enumerated. Show the message as it arrives rather than inventing
 * one. Repeated failures answer 429 with a `Retry-After` header.
 */
export async function login(identifier: string, password: string): Promise<LoginResult> {
  const data = await apiFetch<TokenPayload>('/api/auth/login/', {
    body: { identifier, password },
    anonymous: true,
  })
  /* A successful sign-in always carries tokens. An answer without them means the
     backend wants a further step this app does not have; treating it as signed in
     would leave a session with no credentials behind, so refuse it plainly. */
  if (!data.access) {
    throw new ApiError(0, 'This account needs a sign-in step that is not available here. Please contact support.')
  }
  return storeSession(data)
}

/**
 * Start registration. No account exists until the emailed link is opened, so
 * keep the returned id and send the person to the "check your email" screen.
 * The username is left out on purpose: the backend derives one from the email.
 */
export async function register(input: {
  fullName: string; email: string; password: string; passwordConfirm: string
}): Promise<{ registrationId: string; maskedEmail: string }> {
  const data = await apiFetch<{ registration_id: string; email?: string }>('/api/auth/register/', {
    body: {
      full_name: input.fullName,
      email: input.email,
      password: input.password,
      password_confirm: input.passwordConfirm,
    },
    anonymous: true,
  })
  return { registrationId: data.registration_id, maskedEmail: data.email ?? '' }
}

/**
 * Finish registration with the two values from the emailed link. The account
 * exists afterwards. Opening a link that was already used answers success too
 * (without saying whose account it is), so both cases read as "go and sign in".
 */
export async function verifyEmail(registrationId: string, token: string): Promise<void> {
  await apiFetch('/api/auth/verify-email/', {
    body: { registration_id: registrationId, token },
    anonymous: true,
  })
}

/** Email a fresh link and retire the old one. Has a cooldown; a 429 says how long to wait. */
export async function resendVerificationLink(registrationId: string): Promise<void> {
  await apiFetch('/api/auth/verify-email/resend/', {
    body: { registration_id: registrationId },
    anonymous: true,
  })
}

/* The registration in progress, kept for this browser tab only. It holds the
   public id and the masked address (never the password) so the "check your
   email" screen can offer a resend without the person typing anything again. */
const PENDING_KEY = 'fc_pending_registration'

export interface PendingRegistration { id: string; maskedEmail: string }

export function savePendingRegistration(pending: PendingRegistration): void {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending)) } catch { /* blocked storage */ }
}

export function getPendingRegistration(): PendingRegistration | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? 'null')
    return parsed && typeof parsed.id === 'string' ? parsed : null
  } catch {
    return null
  }
}

export function clearPendingRegistration(): void {
  try { sessionStorage.removeItem(PENDING_KEY) } catch { /* blocked storage */ }
}

/** Always answers the same way, so never reveal whether the address exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch('/api/auth/password-reset/', { body: { email }, anonymous: true })
}

/** Completes the emailed link at /reset-password/{uid}/{token}. */
export async function confirmPasswordReset(
  uidb64: string, token: string, newPassword: string
): Promise<void> {
  await apiFetch('/api/auth/password-reset/confirm/', {
    body: { uidb64, token, new_password: newPassword },
    anonymous: true,
  })
}

/** The name to show for a signed-in person. */
export function displayNameOf(user: ApiUser): string {
  return user.full_name?.trim() || user.username || user.email
}

export type Portal = 'any' | 'admin' | 'moderator'

export type PortalSignIn =
  | { kind: 'ok'; dashboard: Role }
  | { kind: 'wrong-portal' }

/**
 * Sign in and remember who it was, for the user, admin and moderator login screens.
 *
 * All three use the same endpoint; the backend's `dashboard` says which portal
 * the account belongs to. The admin and moderator screens pass their portal, and
 * an account that belongs elsewhere is signed straight back out — its tokens are
 * revoked rather than just forgotten — so a user cannot sit logged in behind the
 * staff door. The user screen passes 'any' and routes by `dashboard`.
 */
export async function signInToPortal(
  identifier: string, password: string, portal: Portal
): Promise<PortalSignIn> {
  const result = await login(identifier, password)

  if (portal !== 'any' && result.dashboard !== portal) {
    await logout()
    return { kind: 'wrong-portal' }
  }

  const name = displayNameOf(result.user)
  localStorage.setItem('facecloud_session', JSON.stringify({
    role: result.role,
    email: result.user.email,
    name,
    initials: initialsFrom(name),
    emailVerified: true,
  }))
  return { kind: 'ok', dashboard: result.dashboard }
}

/** Sign out this device. The tokens are cleared even if the call fails. */
export async function logout(): Promise<void> {
  const refresh = getRefreshToken()
  try {
    if (refresh) await apiFetch('/api/user/logout/', { body: { refresh } })
  } catch {
    // Already invalid server-side; clearing locally is what matters.
  } finally {
    clearTokens()
  }
}

/** Revoke every session for this account. */
export async function logoutEverywhere(): Promise<void> {
  try {
    await apiFetch('/api/user/logout-all/', { method: 'POST' })
  } finally {
    clearTokens()
  }
}

export function getProfile(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/user/profile/')
}

/**
 * Re-establish the session on a page load.
 *
 * The access token lives in memory only, so after a reload there is a stored
 * refresh token and nothing else. Exchanging it here is what keeps someone
 * signed in across a refresh.
 */
export async function restoreSession(): Promise<ApiUser | null> {
  if (!getRefreshToken()) return null
  try {
    return await getProfile()
  } catch {
    clearTokens()
    return null
  }
}
