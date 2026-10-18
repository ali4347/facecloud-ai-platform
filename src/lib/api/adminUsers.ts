import { apiFetch } from './client'

/** One account as the administrator sees it (the backend's AdminUserSerializer). */
export interface AdminUser {
  id: number
  username: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  is_email_verified: boolean
  is_suspended: boolean
  suspension_reason: string
  is_active: boolean
  date_joined: string
  /** Null if the account has never signed in. */
  last_login?: string | null
  /** How many photos the account uploaded. Missing on a backend older than PR #86. */
  uploads_count?: number
}

/** Every account, newest first. Administrator only. */
export function listAdminUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/api/user/admin/users/', { signal })
}

export interface AdminUserPage { count: number; next: string | null; previous: string | null; results: AdminUser[] }

/**
 * One page of accounts, searched and filtered by the server (`?q=` matches username, email and name).
 * Without `page` the backend answers a plain array, so the page number is always sent here.
 */
export function listAdminUsersPage(
  params: { q?: string; role?: 'user' | 'moderator' | 'admin'; status?: 'active' | 'suspended' | 'inactive'; page: number; pageSize: number },
  signal?: AbortSignal,
): Promise<AdminUserPage> {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.pageSize) })
  if (params.q) query.set('q', params.q)
  if (params.role) query.set('role', params.role)
  if (params.status) query.set('status', params.status)
  return apiFetch<AdminUserPage>(`/api/user/admin/users/?${query}`, { signal })
}

/** Suspend or reactivate an account. Reactivating clears the stored reason on the backend. */
export function setAdminUserSuspended(id: number, suspended: boolean): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/user/admin/users/${id}/`, {
    method: 'PATCH',
    body: { is_suspended: suspended },
  })
}

export interface NewAccountRequest {
  username: string
  email: string
  password: string
  role: 'user' | 'moderator'
}

/**
 * Create an already-verified account for someone, with a password the administrator hands over.
 *
 * The backend sends no email and never returns the password. A moderator is placed in the one
 * shared organization, or refused with a plain message when there is none or several. Errors come
 * back as field messages (email, username, password, role) or a `detail`; ApiError carries them.
 */
export function createAdminUser(request: NewAccountRequest): Promise<AdminUser> {
  return apiFetch<AdminUser>('/api/user/admin/users/', { method: 'POST', body: request })
}
