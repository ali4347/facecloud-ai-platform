import { apiFetch, ApiError } from './client'
import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from './tokens'
import type { Role } from '../../data/mock'
import { initialsFrom, saveSession } from '../session'

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
 * Sign up straight from an organization invitation, in one step.
 *
 * The invitation was sent to that mailbox, so the address counts as verified: the account is created verified, the
 * invitation is accepted and the person is signed in, all together. The email must be the invited one. A moderator
 * invitation lands in the moderator portal (`dashboard: "moderator"`), whose tokens and session are kept apart from the
 * user portal's, so they are stored under that portal. A wrong or used token answers the same single 404 sentence as the
 * preview; show it as it is.
 */
export async function registerFromInvitation(input: {
  fullName: string; email: string; password: string; passwordConfirm: string; invitationToken: string
}): Promise<SignedIn> {
  const data = await apiFetch<TokenPayload>('/api/auth/register/', {
    body: {
      full_name: input.fullName,
      email: input.email,
      password: input.password,
      password_confirm: input.passwordConfirm,
      invitation_token: input.invitationToken,
    },
    anonymous: true,
  })
  if (!data.access) throw new ApiError(0, 'The account was created, but you were not signed in. Please sign in.')
  const portal = (data.dashboard ?? data.role ?? 'user') as Role
  setAccessToken(data.access, portal)
  if (data.refresh) setRefreshToken(data.refresh, portal)
  const user = data.user ?? { email: input.email }
  const name = displayNameOf(user)
  saveSession({ role: portal, email: user.email, name, initials: initialsFrom(name), emailVerified: true })
  return { kind: 'signed-in', role: portal, dashboard: portal, user }
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

/**
 * Confirm a changed email address from the link emailed to the new one (`/verify-email-change/<uid>/<token>`). A GET that does
 * the work, so ask once per visit; asking again is harmless. Anonymous, and limited to 10 requests an hour (then 429, with how long to wait).
 *
 * 200 "Email verified successfully." the first time and 200 "Email is already verified." after that (a used link, or an address that
 * was never waiting); 400 "Invalid link." (no such account) or "Invalid or expired token.". An unverified account cannot sign in, so
 * until this succeeds the person is locked out.
 */
export async function confirmEmailChange(uidb64: string, token: string, signal?: AbortSignal): Promise<{ alreadyConfirmed: boolean }> {
  const data = await apiFetch<{ detail?: string }>(
    `/api/auth/verify-email/change/${encodeURIComponent(uidb64)}/${encodeURIComponent(token)}/`, { anonymous: true, signal },
  )
  // The server answers both successes with 200 and tells them apart only by the sentence.
  return { alreadyConfirmed: /already/i.test(data?.detail ?? '') }
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

/** What an emailed account invitation is for. `organization_name` is set for a moderator and null otherwise. */
export interface AccountInvitationPreview {
  email: string
  role: Role
  expires_at: string
  organization_name: string | null
}

/**
 * Look at an administrator's account invitation before creating the account (the link in the email is
 * /accept-invitation?token=…). Anonymous, and throttled to 30 requests an hour together with `acceptAccountInvitation`.
 * A wrong, used, cancelled or expired token answers one 404 sentence; show it as it is.
 */
export function inspectAccountInvitation(token: string, signal?: AbortSignal): Promise<AccountInvitationPreview> {
  return apiFetch<AccountInvitationPreview>('/api/auth/invitations/inspect/', { body: { token }, anonymous: true, signal })
}

/** The account that was created. `dashboard` says which portal's sign-in page it belongs to. */
export interface AcceptedAccountInvitation {
  role: Role
  dashboard: Role
  user: ApiUser
}

/**
 * Create the invited account. The email and the role are the invitation's; the person chooses the username and password.
 *
 * The answer carries sign-in tokens like a login does, and they are deliberately dropped: tokens are kept per portal, and
 * this page is the user portal's address, so a moderator's or an administrator's tokens would be filed under the wrong one.
 * The caller sends the person to that account's own sign-in page instead.
 *
 * Refusals: 400 with per-field messages (`username`, `password`, and `token` when the invitation was used or has expired
 * in the meantime), 409 when the address already has an account. Read the per-field messages with `invitationFieldErrors`.
 */
export async function acceptAccountInvitation(input: {
  token: string; username: string; password: string
}): Promise<AcceptedAccountInvitation> {
  const data = await apiFetch<TokenPayload>('/api/auth/invitations/accept/', { body: input, anonymous: true })
  const role = (data.role ?? data.dashboard ?? 'user') as Role
  return { role, dashboard: (data.dashboard ?? role) as Role, user: data.user ?? { email: '' } }
}

/** The messages the server attached to each field of the invitation form, and the one it could not attach to a field. */
export interface InvitationFieldErrors { username?: string; password?: string; token?: string; other?: string }

/**
 * Split a refused `acceptAccountInvitation` into the field messages the server wrote. DRF sends a field's message as a string
 * or as a list of strings (a password can fail several rules at once); the list is joined into separate lines. Anything that
 * is not about a field (a 409, a 429, the network) is returned as `other`, in the server's own words.
 */
export function invitationFieldErrors(error: unknown): InvitationFieldErrors {
  if (!(error instanceof ApiError)) return { other: 'Could not create the account. Please try again.' }
  const lines = (value: unknown): string | undefined => {
    const list = (Array.isArray(value) ? value : [value]).filter((line): line is string => typeof line === 'string' && line.trim() !== '')
    return list.length ? list.join('\n') : undefined
  }
  const body = error.status === 400 && error.body && typeof error.body === 'object' ? error.body as Record<string, unknown> : {}
  const found: InvitationFieldErrors = { username: lines(body.username), password: lines(body.password), token: lines(body.token) }
  if (found.username || found.password || found.token) return found
  return { other: error.message }
}

/** The name to show for a signed-in person. */
export function displayNameOf(user: ApiUser): string {
  return user.full_name?.trim() || user.username || user.email
}

export type Portal = 'user' | 'admin' | 'moderator'

export type PortalSignIn =
  | { kind: 'ok'; dashboard: Role }
  | { kind: 'wrong-portal' }

/**
 * Sign in and remember who it was, for the user, admin and moderator login screens.
 *
 * All three use the same endpoint; the backend's `dashboard` says which portal
 * the account belongs to. Each screen passes its own portal, and an account that
 * belongs elsewhere is signed straight back out (its tokens are revoked rather than
 * just forgotten), so nobody sits logged in behind the wrong door: a user cannot use
 * the staff screens, and staff cannot sign in on the user screen. Each portal has
 * its own sign-in page.
 */
export async function signInToPortal(
  identifier: string, password: string, portal: Portal
): Promise<PortalSignIn> {
  const result = await login(identifier, password)

  if (result.dashboard !== portal) {
    await logout()
    return { kind: 'wrong-portal' }
  }

  const name = displayNameOf(result.user)
  saveSession({
    role: result.role,
    email: result.user.email,
    name,
    initials: initialsFrom(name),
    emailVerified: true,
  })
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

/** Save the display name. Returns the name as the backend stored it. */
export async function updateProfileName(fullName: string): Promise<string> {
  const user = await apiFetch<ApiUser>('/api/user/profile/', { method: 'PATCH', body: { full_name: fullName } })
  return displayNameOf(user)
}

/**
 * Change the password. The backend ends every session on success (including
 * this one), so the caller must send the person back to sign in.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch('/api/user/change-password/', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  })
  clearTokens()
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
