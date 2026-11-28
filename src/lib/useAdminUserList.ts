import { useEffect, useState } from 'react'
import { listAdminUsersPage, type AccountType } from './api/adminUsers'
import { useApiResource, type AsyncState } from './useApiResource'
import { mockUsers } from '../data/mock'
import type { Role } from '../data/mock'

export const USERS_PAGE_SIZE = 20

export interface AccountRow {
  id: string
  name: string
  email: string
  role: Role
  suspended: boolean
  /** Why the account was suspended, when the administrator wrote a reason. */
  suspensionReason?: string
  /** Photos the account uploaded; null where the backend does not report it. */
  uploads: number | null
  /** Null if the account never signed in (or the demo data, which has no sign-ins). */
  lastLogin: string | null
  joinedAt: string
  /** Personal only, or in at least one shared organization; null where the backend does not say (older than PR #176). */
  accountType?: AccountType | null
  /** Shared organizations the account is an active member of. */
  sharedOrganizations?: number | null
}

export interface AccountPage { count: number; rows: AccountRow[] }

/** The search box's text, held back until typing pauses so each keystroke is not a request. */
function useDebounced(value: string, ms = 300): string {
  const [held, setHeld] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setHeld(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return held
}

/**
 * One page of accounts, searched by the server (live) or filtered here (demo build).
 * `role` limits the list to one kind of account; leave it out to list everyone.
 */
export function useAdminUserList(search: string, page: number, role?: Role, accountType?: AccountType): AsyncState<AccountPage> & { query: string } {
  const query = useDebounced(search.trim())
  const state = useApiResource<AccountPage>(
    async signal => {
      const result = await listAdminUsersPage({ q: query || undefined, role, accountType, page, pageSize: USERS_PAGE_SIZE }, signal)
      // An older backend ignores ?role= and ?account_type=, so the rows are narrowed here too (an unknown type is kept).
      const rows = result.results.filter(u => (!role || u.role === role) && (!accountType || !u.account_type || u.account_type === accountType))
      return {
        // A backend older than PR #86 ignores ?role=, so the list is narrowed here and the count follows what is left.
        count: rows.length < result.results.length ? rows.length : result.count,
        rows: rows.map(u => ({
          id: String(u.id), name: u.username, email: u.email, role: u.role,
          suspended: u.is_suspended || !u.is_active, suspensionReason: u.suspension_reason || undefined, uploads: u.uploads_count ?? null,
          lastLogin: u.last_login ?? null, joinedAt: u.date_joined,
          accountType: u.account_type ?? null, sharedOrganizations: u.shared_organization_count ?? null,
        })),
      }
    },
    () => {
      const q = query.toLowerCase()
      const rows = mockUsers
        .filter(u => (!role || u.role === role) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
        .map((u): AccountRow => ({
          id: u.id, name: u.name, email: u.email, role: u.role, suspended: u.status !== 'active',
          uploads: u.uploads, lastLogin: null, joinedAt: u.joinedAt, accountType: null, sharedOrganizations: null,
        }))
      return { count: rows.length, rows }
    },
    [query, page, role, accountType],
  )
  return { ...state, query }
}
