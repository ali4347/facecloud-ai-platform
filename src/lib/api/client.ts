import { API_URL } from './config'
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './tokens'

export class ApiError extends Error {
  readonly status: number
  /** Parsed body, when the server sent one. Field errors live here. */
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  /** The backend answers 404 — not 403 — for someone else's record. */
  get isNotFound() { return this.status === 404 }
  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isThrottled() { return this.status === 429 }
}

/** Pull a readable sentence out of DRF's several error shapes. */
function messageFrom(body: unknown, status: number): string {
  if (typeof body === 'string' && body.trim()) return body
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const detail = record.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && typeof detail[0] === 'string') return detail[0]
    // Field errors: {"email": ["already in use"]}
    for (const value of Object.values(record)) {
      if (typeof value === 'string') return value
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    }
  }
  return `Request failed (${status}).`
}

/** True when the backend says the access token expired rather than was revoked. */
function isExpiredToken(body: unknown): boolean {
  return Boolean(
    body && typeof body === 'object' && (body as Record<string, unknown>).code === 'token_not_valid'
  )
}

/* One refresh at a time.
   When several requests expire together they would each fire a refresh, and
   because refresh tokens rotate only the first would succeed — the rest would
   invalidate the session they were trying to save. Everyone waits on the same
   promise instead. */
let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) return false
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!response.ok) {
        clearTokens()
        return false
      }
      const data = await response.json()
      setAccessToken(data.access ?? null)
      // The response carries a new refresh token; the old one is now dead.
      if (data.refresh) setRefreshToken(data.refresh)
      return Boolean(data.access)
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export interface RequestOptions {
  method?: string
  /** Sent as JSON. Use `formData` for file uploads instead. */
  body?: unknown
  formData?: FormData
  /** Skip the Authorization header — for login, register, password reset. */
  anonymous?: boolean
  signal?: AbortSignal
}

/**
 * One call to the API.
 *
 * Adds the bearer token, parses the response, and on an expired access token
 * refreshes once and retries. A revoked token is not retried: refreshing cannot
 * fix it, so the caller is told to send the person back to sign in.
 */
export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, 'No API URL is configured. Set VITE_API_URL.')
  }

  /* After a page reload the access token is gone -- it lives in memory only --
     while the refresh token is still on disk. Exchanging it here rather than
     waiting for a 401 is what keeps someone signed in across a refresh: the
     401 for a *missing* credential carries no `token_not_valid` code, so the
     retry path below cannot recognise it and would sign the person out while
     a perfectly good refresh token sat unused. */
  if (!getAccessToken() && !options.anonymous && getRefreshToken()) {
    await refreshAccessToken()
  }

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {}
    if (!options.formData) headers['Content-Type'] = 'application/json'

    const token = getAccessToken()
    if (token && !options.anonymous) headers.Authorization = `Bearer ${token}`

    return fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.body || options.formData ? 'POST' : 'GET'),
      headers,
      body: options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: options.signal,
    })
  }

  let response = await send()

  if (response.status === 401 && !options.anonymous) {
    const body = await response.clone().json().catch(() => null)
    if (isExpiredToken(body) && (await refreshAccessToken())) {
      response = await send()
    }
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const parsed = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(parsed, response.status), parsed)
  }
  return parsed as T
}
