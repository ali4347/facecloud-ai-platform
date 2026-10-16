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
}

/** Every account, newest first. Administrator only. */
export function listAdminUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/api/user/admin/users/', { signal })
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
