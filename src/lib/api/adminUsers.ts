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
