import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, RefreshCw, UserPlus, Users as UsersIcon } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { GradientButton } from '../../components/ui/GradientButton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { NewAccountForm, CreatedAccountNotice } from '../../components/admin/NewAccountForm'
import type { NewAccount } from '../../components/admin/NewAccountForm'
import { createAdminUser, sendAdminPasswordReset, setAdminUserSuspended, type AccountType } from '../../lib/api/adminUsers'
import { UserDetailsDialog } from '../../components/admin/UserDetailsDialog'
import { teamsOf, useAdminOrganizations } from '../../lib/useAdminOrganizations'
import { USE_API } from '../../lib/api/config'
import { USERS_PAGE_SIZE, useAdminUserList, type AccountRow as UserRow } from '../../lib/useAdminUserList'
import { formatDate } from '../../lib/utils'
import { initialsFrom } from '../../lib/session'
import type { Role } from '../../data/mock'

const roleBadge = (role: Role) => {
  const map = { user: 'info', admin: 'purple', moderator: 'warning' } as const
  return <StatusBadge status={map[role]} label={role.charAt(0).toUpperCase() + role.slice(1)} dot={false} />
}

export default function UsersPage() {
  // The top-bar search opens this screen with ?q= already filled in.
  const [params] = useSearchParams()
  const urlSearch = params.get('q') ?? ''
  const [search, setSearch] = useState(urlSearch)
  const [page, setPage] = useState(1)
  const orgs = useAdminOrganizations()
  useEffect(() => { setSearch(urlSearch); setPage(1) }, [urlSearch])
  const [formOpen, setFormOpen] = useState(false)
  const [justCreated, setJustCreated] = useState<NewAccount | null>(null)
  const [addedInDemo, setAddedInDemo] = useState<UserRow[]>([])
  const [demoSuspended, setDemoSuspended] = useState<Record<string, boolean>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [toSuspend, setToSuspend] = useState<UserRow | null>(null)
  const [suspendError, setSuspendError] = useState<string | null>(null)

  // Personal users (only their own private workspace) and organization users can be listed apart.
  const [accountType, setAccountType] = useState<'' | AccountType>('')
  const [detailsFor, setDetailsFor] = useState<UserRow | null>(null)
  const [toReset, setToReset] = useState<UserRow | null>(null)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [okNotice, setOkNotice] = useState<string | null>(null)

  const { data, loading, error, isDemo, reload } = useAdminUserList(search, page, undefined, accountType || undefined)

  const sendReset = async (user: UserRow) => {
    setResetBusy(true); setResetError(null); setOkNotice(null)
    try {
      const answer = await sendAdminPasswordReset(Number(user.id))
      setToReset(null)
      setOkNotice(answer?.detail || `A password reset link was sent to ${user.email}.`)
    } catch (caught) {
      setResetError(caught instanceof Error ? caught.message : 'The reset link could not be sent.')
    } finally {
      setResetBusy(false)
    }
  }

  const users = useMemo(() => {
    const first = page === 1 && !search.trim() ? addedInDemo : []
    return [...first, ...(data?.rows ?? [])].map(u => ({
      ...u, suspended: u.id in demoSuspended ? demoSuspended[u.id] : u.suspended,
    }))
  }, [data, addedInDemo, demoSuspended, page, search])

  const total = (data?.count ?? 0) + addedInDemo.length
  const lastPage = Math.max(1, Math.ceil((data?.count ?? 0) / USERS_PAGE_SIZE))

  /* Live: the backend creates the account and the list is read again. Demo: kept for the session only. */
  const handleCreate = async (account: NewAccount) => {
    if (USE_API) {
      await createAdminUser({ username: account.username, email: account.email, ...(account.password ? { password: account.password } : {}), role: account.role, ...(account.organizationId !== undefined ? { organization_id: account.organizationId } : {}) })
      reload()
    } else {
      setAddedInDemo(rows => [{
        id: `demo-${Date.now()}`, name: account.username, email: account.email, role: account.role,
        suspended: false, uploads: 0, lastLogin: null, joinedAt: new Date().toISOString(),
      }, ...rows])
    }
    setJustCreated(account)
    setFormOpen(false)
  }

  const changeSuspended = async (user: UserRow, suspend: boolean) => {
    setNotice(null); setSuspendError(null)
    if (isDemo) {
      setDemoSuspended(map => ({ ...map, [user.id]: suspend }))
      setToSuspend(null)
      return
    }
    setBusyId(user.id)
    try {
      await setAdminUserSuspended(Number(user.id), suspend)
      setToSuspend(null)
      reload()
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : 'Could not change the account.'
      if (suspend) setSuspendError(text); else setNotice(text)
    } finally {
      setBusyId(null)
    }
  }

  /* Suspending signs the person out, so it asks first (in the same dialog as the rest of the console); reactivating does not. */
  const toggleSuspended = (user: UserRow) => {
    if (user.suspended) { void changeSuspended(user, false); return }
    setSuspendError(null)
    setToSuspend(user)
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Users"
        subtitle={loading ? 'Loading…' : `${total} registered user${total === 1 ? '' : 's'}`}
        action={
          <GradientButton leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => { setJustCreated(null); setFormOpen(true) }}>
            Add User
          </GradientButton>
        }
      />

      <div className="space-y-5">
        {isDemo && (
          <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            Showing demo data, and nothing changed here is saved. Set <code className="fc-kbd">VITE_USE_API=true</code> to manage the real accounts.
          </div>
        )}

        {notice && (
          <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
            {notice}
          </div>
        )}
        {okNotice && (
          <div role="status" className="p-3 rounded-2xl text-xs bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981]">{okNotice}</div>
        )}

        {justCreated && <CreatedAccountNotice account={justCreated} demo={!USE_API} onDismiss={() => setJustCreated(null)} />}

        {formOpen && (
          <NewAccountForm
            title="New user"
            subtitle="Creates a sign-in for a person. Choose Moderator to give them the moderator panel."
            roles={['user', 'moderator']}
            organizations={teamsOf(orgs.data)}
            organizationsError={orgs.error}
            onRetryOrganizations={orgs.reload}
            onCreate={handleCreate}
            onCancel={() => setFormOpen(false)}
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput placeholder="Search users…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-72" />
          {USE_API && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Account type">
              {([['', 'All accounts'], ['personal', 'Personal'], ['organization', 'In an organization']] as const).map(([value, label]) => (
                <button key={value || 'all'} type="button" aria-pressed={accountType === value} onClick={() => { setAccountType(value); setPage(1) }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${accountType === value ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface-mute border-line text-ink-mute hover:text-ink'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="fc-card overflow-hidden">
          {loading && (
            <div className="text-center py-16 text-ink-faint">
              <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
              <p className="text-xs font-semibold">Loading users...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16">
              <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
              <p className="text-xs font-semibold text-ink">{error}</p>
              <button type="button" onClick={reload}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />Try again
              </button>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <EmptyState
              icon={UsersIcon}
              title={search ? 'No user matches that search' : 'No users yet'}
              description={search ? 'Try a different name or email.' : 'Add the first user with the button above.'}
            />
          )}

          {!loading && !error && users.length > 0 && (
            <DataTable
              data={users as unknown as Record<string, unknown>[]}
              getKey={row => String(row.id)}
              columns={[
                { key: 'name', label: 'User', render: row => (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #EA580C, #F97316)', boxShadow: '0 0 10px rgba(249,115,22,0.15)' }}
                    >
                      {initialsFrom(String(row.name))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{String(row.name)}</p>
                      <p className="text-xs text-ink-mute">{String(row.email)}</p>
                    </div>
                  </div>
                )},
                { key: 'role', label: 'Role', render: row => roleBadge(row.role as Role) },
                // Personal: only their own private workspace. Organization: also an active member of shared organizations.
                ...(users.some(u => u.accountType) ? [{ key: 'accountType', label: 'Account', render: (row: Record<string, unknown>) => (
                  <span className="text-xs text-ink-soft">{row.accountType === 'organization' ? `Organization${row.sharedOrganizations ? ` · ${String(row.sharedOrganizations)}` : ''}` : row.accountType === 'personal' ? 'Personal' : '—'}</span>
                ) }] : []),
                { key: 'suspended', label: 'Status', render: row => (
                  <StatusBadge status={row.suspended ? 'error' : 'success'} label={row.suspended ? 'Suspended' : 'Active'} />
                )},
                // Hidden rather than guessed when the backend does not report a count.
                ...(users.some(u => u.uploads !== null) ? [{ key: 'uploads', label: 'Uploads', render: (row: Record<string, unknown>) => (
                  <span className="text-sm font-semibold text-ink-soft">{row.uploads === null ? '—' : String(row.uploads)}</span>
                ) }] : []),
                // The backend stamps last_login on every successful sign-in; null means the account never signed in.
                { key: 'lastLogin', label: 'Last sign-in', render: row => (
                  <span className="text-sm text-ink-mute">{row.lastLogin ? formatDate(String(row.lastLogin)) : 'Never'}</span>
                )},
                { key: 'joinedAt', label: 'Joined', render: row => <span className="text-sm text-ink-mute">{formatDate(String(row.joinedAt))}</span> },
                { key: 'actions', label: 'Actions', render: row => (
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {USE_API && (
                      <button type="button" onClick={() => setDetailsFor(row as unknown as UserRow)} className="text-xs font-medium text-ink-soft hover:underline cursor-pointer">Details</button>
                    )}
                    {USE_API && !row.suspended && (
                      <button type="button" onClick={() => { setResetError(null); setToReset(row as unknown as UserRow) }} className="text-xs font-medium text-[#FB923C] hover:underline cursor-pointer">Reset password</button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => toggleSuspended(row as unknown as UserRow)}
                      className={`text-xs font-medium hover:underline cursor-pointer disabled:opacity-50 ${row.suspended ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
                    >
                      {row.suspended ? 'Activate' : 'Suspend'}
                    </button>
                  </div>
                )},
              ]}
            />
          )}
        </div>

        {!error && data && data.count > USERS_PAGE_SIZE && (
          <div className="flex items-center justify-between text-xs text-ink-mute">
            <span>Page {page} of {lastPage}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-xl border border-line bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" />Previous</button>
              <button type="button" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-line bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1">Next<ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {detailsFor && <UserDetailsDialog userId={Number(detailsFor.id)} name={detailsFor.name} onClose={() => setDetailsFor(null)} />}

      {toReset && (
        <ConfirmDialog title={`Send ${toReset.name} a password reset link?`} confirmLabel="Send reset link" busyLabel="Sending…" busy={resetBusy} error={resetError}
          onConfirm={() => void sendReset(toReset)} onCancel={() => setToReset(null)}>
          <p>{toReset.email} gets an e-mail with a link to choose a new password. You never see the password or the link.</p>
        </ConfirmDialog>
      )}

      {toSuspend && (
        <ConfirmDialog title={`Suspend ${toSuspend.name}?`} confirmLabel="Suspend" busyLabel="Suspending…" danger busy={busyId === toSuspend.id} error={suspendError}
          onConfirm={() => void changeSuspended(toSuspend, true)} onCancel={() => setToSuspend(null)}>
          <p>{toSuspend.name} is signed out on every device and cannot sign in until you activate the account again. Their photos are kept.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
