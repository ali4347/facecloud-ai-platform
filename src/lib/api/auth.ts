import { apiFetch } from './client'
import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from './tokens'
import type { Role } from '../../data/mock'

export interface ApiUser {
  id?: number | string
  username?: string
  email: string
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

/** The account has two-factor on; finish with `verifyTwoFactor`. */
export interface TwoFactorRequired {
  kind: 'two-factor'
  loginToken: string
}

export type LoginResult = SignedIn | TwoFactorRequired

interface TokenPayload {
  access?: string
  refresh?: string
  role?: Role
  dashboard?: Role
  user?: ApiUser
  two_factor_required?: boolean
  login_token?: string
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
  if (data.two_factor_required && data.login_token) {
    return { kind: 'two-factor', loginToken: data.login_token }
  }
  return storeSession(data)
}

/** Second step for an account with two-factor on. Accepts a recovery code too. */
export async function verifyTwoFactor(loginToken: string, code: string): Promise<SignedIn> {
  const data = await apiFetch<TokenPayload>('/api/auth/2fa/verify/', {
    body: { login_token: loginToken, code },
    anonymous: true,
  })
  return storeSession(data)
}

/**
 * Start registration. No account exists until the emailed six-digit code is
 * verified, so keep the returned id and send the person to the code screen.
 */
export async function register(
  username: string, email: string, password: string
): Promise<{ registrationId: string }> {
  const data = await apiFetch<{ registration_id: string }>('/api/auth/register/', {
    body: { username, email, password },
    anonymous: true,
  })
  return { registrationId: data.registration_id }
}

/** Finish registration with the six-digit code. The account exists after this. */
export async function verifyEmail(registrationId: string, code: string): Promise<void> {
  await apiFetch('/api/auth/verify-email/', {
    body: { registration_id: registrationId, code },
    anonymous: true,
  })
}

/** Send a fresh code. Has a cooldown; a 429 means "wait and try again". */
export async function resendVerificationCode(registrationId: string): Promise<void> {
  await apiFetch('/api/auth/verify-email/resend/', {
    body: { registration_id: registrationId },
    anonymous: true,
  })
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
