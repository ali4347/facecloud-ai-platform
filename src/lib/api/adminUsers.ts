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
  full_name?: string
  /**
   * `personal`: only their own private workspace. `organization`: an active member of at least one shared organization
   * (they still have a private workspace too). Missing on a backend older than PR #176.
   */
  account_type?: 'personal' | 'organization'
  /** In how many shared organizations the account is an active member. */
  shared_organization_count?: number
}

export type AccountType = 'personal' | 'organization'

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
  params: { q?: string; role?: 'user' | 'moderator' | 'admin'; status?: 'active' | 'suspended' | 'inactive'; accountType?: AccountType; page: number; pageSize: number },
  signal?: AbortSignal,
): Promise<AdminUserPage> {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.pageSize) })
  if (params.q) query.set('q', params.q)
  if (params.role) query.set('role', params.role)
  if (params.status) query.set('status', params.status)
  if (params.accountType) query.set('account_type', params.accountType)
  return apiFetch<AdminUserPage>(`/api/user/admin/users/?${query}`, { signal })
}

/** Suspend or reactivate an account. A reason, when given, is stored with the suspension; reactivating clears it on the backend. */
export function setAdminUserSuspended(id: number, suspended: boolean, reason = ''): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/user/admin/users/${id}/`, {
    method: 'PATCH',
    body: suspended && reason ? { is_suspended: true, suspension_reason: reason } : { is_suspended: suspended },
  })
}

export interface NewAccountRequest {
  username: string
  email: string
  /** Leave out to e-mail the person a link to choose their own password (the administrator never knows it). */
  password?: string
  role: 'user' | 'moderator'
  /** The organization a moderator works for. Required for a moderator once there is more than one organization. */
  organization_id?: number
}

/**
 * Create an already-verified account for someone. Without `password` the person is e-mailed a link to choose their own
 * (recommended: the administrator never knows it); with one, the administrator hands it over themselves.
 *
 * The backend never e-mails or returns a password. A moderator is placed in the one
 * shared organization, or refused with a plain message when there is none or several. Errors come
 * back as field messages (email, username, password, role) or a `detail`; ApiError carries them.
 */
export function createAdminUser(request: NewAccountRequest): Promise<AdminUser> {
  return apiFetch<AdminUser>('/api/user/admin/users/', { method: 'POST', body: request })
}

/** One account in detail: every organization it belongs to (its private workspace marked `is_personal`) and what it stores. */
export interface AdminUserDetail extends AdminUser {
  display_name?: string
  organization_name?: string
  job_title?: string
  country?: string
  active_sessions?: number
  organizations?: { id: number; name: string; is_personal: boolean; role: 'owner' | 'moderator' | 'member'; status: string }[]
  /** `storage_bytes` = the size of the person's original uploads, trash included. */
  usage?: { upload_batches?: number; storage_bytes?: number; [key: string]: number | undefined }
}

export function getAdminUserDetail(id: number, signal?: AbortSignal): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/api/user/admin/users/${id}/`, { signal })
}

/**
 * E-mail the person a link to choose a new password. Nothing secret comes back: no password, no token.
 * Refused for a suspended or inactive account, and for an administrator account unless the caller is a superuser.
 */
export function sendAdminPasswordReset(id: number): Promise<{ detail?: string }> {
  return apiFetch<{ detail?: string }>(`/api/user/admin/users/${id}/password-reset/`, { method: 'POST' })
}
