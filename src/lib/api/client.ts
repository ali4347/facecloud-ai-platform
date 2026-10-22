import { API_URL } from './config'
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './tokens'
import { currentPortal } from '../portal'

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

/**
 * A few backend errors arrive as the text of a Python object, "[ErrorDetail(string='…', code='invalid')]" (the batch
 * retry refusal does). Show the sentence inside, not the object.
 */
function plain(text: string): string {
  const inside = text.match(/ErrorDetail\(string=(["'])(.*?)\1,\s*code=/)
  return inside ? inside[2] : text
}

/** "Request was throttled. Expected available in 3405 seconds." becomes a sentence a person can act on. */
function throttledSentence(text: string): string {
  const seconds = Number(text.match(/available in (\d+) second/i)?.[1])
  if (!Number.isFinite(seconds)) return 'Too many requests. Please wait a little and try again.'
  const wait = seconds < 90 ? `${seconds} seconds` : seconds < 5400 ? `about ${Math.round(seconds / 60)} minutes` : `about ${Math.round(seconds / 3600)} hours`
  return `Too many requests. You can try again in ${wait}.`
}

/** Pull a readable sentence out of DRF's several error shapes. */
function messageFrom(body: unknown, status: number): string {
  if (status === 429) return throttledSentence(JSON.stringify(body ?? ''))
  if (typeof body === 'string' && body.trim()) return plain(body)
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const detail = record.detail
    if (typeof detail === 'string') return plain(detail)
    if (Array.isArray(detail) && typeof detail[0] === 'string') return plain(detail[0])
    // Field errors: {"email": ["already in use"]}
    for (const value of Object.values(record)) {
      if (typeof value === 'string') return plain(value)
      if (Array.isArray(value) && typeof value[0] === 'string') return plain(value[0])
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
/** `invalid`: the refresh token is no good, sign in again. `unavailable`: the server could not answer, so the session may still be fine. */
type RefreshOutcome = 'ok' | 'invalid' | 'unavailable'
let refreshInFlight: Promise<RefreshOutcome> | null = null

/** Fired when the session cannot be recovered; the app shell sends the person back to sign in. */
export const SESSION_LOST_EVENT = 'facecloud:session-lost'

async function refreshAccessToken(): Promise<RefreshOutcome> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async (): Promise<RefreshOutcome> => {
    const refresh = getRefreshToken()
    if (!refresh) return 'invalid'
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!response.ok) {
        // A server error says nothing about the token, so it is kept for the next try.
        if (response.status >= 500) return 'unavailable'
        clearTokens()
        return 'invalid'
      }
      const data = await response.json()
      setAccessToken(data.access ?? null)
      // The response carries a new refresh token; the old one is now dead.
      if (data.refresh) setRefreshToken(data.refresh)
      return data.access ? 'ok' : 'invalid'
    } catch {
      return 'unavailable'
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
 * One call to the API, returned unparsed.
 *
 * Adds the bearer token, and on an expired access token refreshes once and
 * retries. A revoked token is not retried: refreshing cannot fix it, so the
 * caller is told to send the person back to sign in. `apiFetch` reads JSON out
 * of this; `apiFetchBlob` reads binary, so neither has to repeat the auth.
 */
async function request(path: string, options: RequestOptions = {}): Promise<Response> {
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
    if ((await refreshAccessToken()) === 'unavailable') {
      throw new ApiError(503, 'FaceCloud could not reach the server to restore your session. Please try again in a moment.')
    }
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
    if (isExpiredToken(body) && (await refreshAccessToken()) === 'ok') {
      response = await send()
    }
  }

  /* Still refused after every recovery: the session is gone. Say so once, so the app can sign the person
     out instead of leaving them on a page full of "credentials were not provided". */
  if (response.status === 401 && !options.anonymous) {
    clearTokens()
    window.dispatchEvent(new Event(SESSION_LOST_EVENT))
  }

  return response
}

/**
 * The body is not JSON: an error page (Django's debug page after a crash, a 404 page) or the wrong server altogether.
 * Say what that usually means instead of the browser's "Unexpected token '<'".
 */
function pageInsteadOfJson(status: number): ApiError {
  const message = status >= 500
    ? `The server had an internal error (HTTP ${status}). The backend terminal shows why; after updating the backend, run "python manage.py migrate" and restart it.`
    : status === 404
      ? 'The server does not know this address (HTTP 404). The backend may be an older version, or VITE_API_URL points to the wrong place.'
      : status >= 400
        ? `The server answered with an error page instead of data (HTTP ${status}).`
        : 'This address answered with a web page, not the API. Check that VITE_API_URL points to the backend.'
  return new ApiError(status, message)
}

/**
 * Reads that are asking for the same thing at the same moment share one request.
 *
 * A page is built from several parts (the sidebar, the top bar, the screen itself) that each ask for the same list when
 * they appear, so one page load used to send the same GET up to eight times and used up the server's hourly allowance
 * (1000 requests per person) in a few dozen page views. Only requests *in flight* are shared: once one answers, the next
 * ask goes to the server again, so nothing is ever served stale. A caller's own `signal` still cancels its own wait.
 */
const sharedReads = new Map<string, Promise<unknown>>()

/** How many changes (anything that is not a read) this page has made so far; a cached list is stale once this number moves. */
let changesMade = 0
export const changesSoFar = (): number => changesMade

const waitFor = <T>(shared: Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) return shared
  if (signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'))
    signal.addEventListener('abort', onAbort, { once: true })
    shared.then(
      value => { signal.removeEventListener('abort', onAbort); resolve(value) },
      error => { signal.removeEventListener('abort', onAbort); reject(error) },
    )
  })
}

/** One call to the API, with a JSON body in and a parsed body out. */
export function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (options.body || options.formData ? 'POST' : 'GET')
  // Anything that changes data ends the sharing, so a read that follows a change always asks the server afresh.
  if (method !== 'GET') { changesMade += 1; sharedReads.clear(); return load<T>(path, options) }
  const key = `${currentPortal()}|${options.anonymous ? 'anon' : 'auth'}|${path}`
  let shared = sharedReads.get(key) as Promise<T> | undefined
  if (!shared) {
    const started: Promise<T> = load<T>(path, { ...options, signal: undefined }).finally(() => { if (sharedReads.get(key) === started) sharedReads.delete(key) })
    shared = started
    sharedReads.set(key, started)
  }
  return waitFor(shared, options.signal)
}

async function load<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await request(path, options)

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try { parsed = JSON.parse(text) } catch { throw pageInsteadOfJson(response.status) }
  }

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(parsed, response.status), parsed)
  }
  return parsed as T
}

/**
 * One call to the API that answers with a file rather than JSON.
 *
 * Needed because the API authenticates with a bearer header, which an
 * `<img src>` or `<a download>` cannot send: the bytes have to be fetched here
 * and handed to the browser as an object URL. An error still comes back as
 * JSON, so it is parsed the same way and raised as the same ApiError.
 */
export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await request(path, options)

  if (!response.ok) {
    const parsed = await response.json().catch(() => null)
    throw new ApiError(response.status, messageFrom(parsed, response.status), parsed)
  }
  return response.blob()
}
