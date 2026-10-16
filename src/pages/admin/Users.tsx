import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, UserPlus, Users as UsersIcon } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { GradientButton } from '../../components/ui/GradientButton'
import { EmptyState } from '../../components/ui/EmptyState'
import { NewAccountForm, CreatedAccountNotice } from '../../components/admin/NewAccountForm'
import type { NewAccount } from '../../components/admin/NewAccountForm'
import { listAdminUsers, setAdminUserSuspended } from '../../lib/api/adminUsers'
import { useApiResource } from '../../lib/useApiResource'
import { mockUsers } from '../../data/mock'
import { formatDate } from '../../lib/utils'
import { initialsFrom } from '../../lib/session'
import type { Role } from '../../data/mock'

interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  suspended: boolean
  /** Only the demo data has an upload count; the accounts API does not report one. */
  uploads: number | null
  joinedAt: string
}

const roleBadge = (role: Role) => {
  const map = { user: 'info', admin: 'purple', moderator: 'warning' } as const
  return <StatusBadge status={map[role]} label={role.charAt(0).toUpperCase() + role.slice(1)} dot={false} />
}

const demoUsers = (): UserRow[] =>
  mockUsers.map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    suspended: u.status !== 'active', uploads: u.uploads, joinedAt: u.joinedAt,
  }))

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [justCreated, setJustCreated] = useState<NewAccount | null>(null)
  const [addedInDemo, setAddedInDemo] = useState<UserRow[]>([])
  const [demoSuspended, setDemoSuspended] = useState<Record<string, boolean>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, loading, error, isDemo, reload } = useApiResource<UserRow[]>(
    async signal => (await listAdminUsers(signal)).map(u => ({
      id: String(u.id), name: u.username, email: u.email, role: u.role,
      suspended: u.is_suspended || !u.is_active, uploads: null, joinedAt: u.date_joined,
    })),
    demoUsers,
    [],
  )

  const users = useMemo(() => {
    const all = [...addedInDemo, ...(data ?? [])].map(u => ({
      ...u, suspended: u.id in demoSuspended ? demoSuspended[u.id] : u.suspended,
    }))
    const q = search.trim().toLowerCase()
    return q ? all.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : all
  }, [data, addedInDemo, demoSuspended, search])

  const total = (data?.length ?? 0) + addedInDemo.length

  /* Only reachable in demo mode: with the API on, the form's button is disabled. */
  const handleCreate = (account: NewAccount) => {
    setAddedInDemo(rows => [{
      id: `demo-${Date.now()}`, name: account.username, email: account.email, role: account.role,
      suspended: false, uploads: 0, joinedAt: new Date().toISOString(),
    }, ...rows])
    setJustCreated(account)
    setFormOpen(false)
  }

  const toggleSuspended = async (user: UserRow) => {
    const suspend = !user.suspended
    if (suspend && !window.confirm(`Suspend ${user.name}? They are signed out and cannot sign in until reactivated.`)) return
    setNotice(null)
    if (isDemo) {
      setDemoSuspended(map => ({ ...map, [user.id]: suspend }))
      return
    }
    setBusyId(user.id)
    try {
      await setAdminUserSuspended(Number(user.id), suspend)
      reload()
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Could not change the account.')
    } finally {
      setBusyId(null)
    }
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

        {justCreated && <CreatedAccountNotice account={justCreated} onDismiss={() => setJustCreated(null)} />}

        {formOpen && (
          <NewAccountForm
            title="New user"
            subtitle="Creates a sign-in for a person. Choose Moderator to give them the moderator panel."
            roles={['user', 'moderator']}
            onCreate={handleCreate}
            onCancel={() => setFormOpen(false)}
          />
        )}

        <div className="flex items-center gap-3">
          <SearchInput placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
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
                { key: 'suspended', label: 'Status', render: row => (
                  <StatusBadge status={row.suspended ? 'error' : 'success'} label={row.suspended ? 'Suspended' : 'Active'} />
                )},
                ...(isDemo ? [{ key: 'uploads', label: 'Uploads', render: (row: Record<string, unknown>) => (
                  <span className="text-sm font-semibold text-ink-soft">{String(row.uploads)}</span>
                ) }] : []),
                { key: 'joinedAt', label: 'Joined', render: row => <span className="text-sm text-ink-mute">{formatDate(String(row.joinedAt))}</span> },
                { key: 'actions', label: 'Actions', render: row => (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => toggleSuspended(row as unknown as UserRow)}
                    className={`text-xs font-medium hover:underline cursor-pointer disabled:opacity-50 ${row.suspended ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
                  >
                    {row.suspended ? 'Activate' : 'Suspend'}
                  </button>
                )},
              ]}
            />
          )}
        </div>
      </div>
    </div>
  )
}
