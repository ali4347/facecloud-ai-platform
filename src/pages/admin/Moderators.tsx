import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { GradientButton } from '../../components/ui/GradientButton'
import { EmptyState } from '../../components/ui/EmptyState'
import { NewAccountForm, CreatedAccountNotice } from '../../components/admin/NewAccountForm'
import type { NewAccount } from '../../components/admin/NewAccountForm'
import { listAdminUsers } from '../../lib/api/adminUsers'
import { useApiResource } from '../../lib/useApiResource'
import { mockUsers } from '../../data/mock'
import { formatDate } from '../../lib/utils'

interface ModeratorRow {
  id: string
  username: string
  email: string
  suspended: boolean
  joinedAt: string
}

const demoModerators = (): ModeratorRow[] =>
  mockUsers
    .filter(u => u.role === 'moderator')
    .map(u => ({
      id: u.id, username: u.name, email: u.email,
      suspended: u.status !== 'active', joinedAt: u.joinedAt,
    }))

export default function Moderators() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [justCreated, setJustCreated] = useState<NewAccount | null>(null)
  const [addedInDemo, setAddedInDemo] = useState<ModeratorRow[]>([])

  const { data, loading, error, isDemo, reload } = useApiResource<ModeratorRow[]>(
    async signal => (await listAdminUsers(signal))
      .filter(u => u.role === 'moderator')
      .map(u => ({
        id: String(u.id), username: u.username, email: u.email,
        suspended: u.is_suspended || !u.is_active, joinedAt: u.date_joined,
      })),
    demoModerators,
    [],
  )

  const moderators = useMemo(() => {
    const all = [...addedInDemo, ...(data ?? [])]
    const q = search.trim().toLowerCase()
    return q ? all.filter(m => m.username.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) : all
  }, [data, addedInDemo, search])

  const total = (data?.length ?? 0) + addedInDemo.length

  /* Only reachable in demo mode: with the API on, the form's button is disabled. */
  const handleCreate = (account: NewAccount) => {
    setAddedInDemo(rows => [{
      id: `demo-${Date.now()}`, username: account.username, email: account.email,
      suspended: false, joinedAt: new Date().toISOString(),
    }, ...rows])
    setJustCreated(account)
    setFormOpen(false)
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Moderators"
        subtitle={loading ? 'Loading…' : `${total} moderator${total === 1 ? '' : 's'}`}
        action={
          <GradientButton leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => { setJustCreated(null); setFormOpen(true) }}>
            Create moderator
          </GradientButton>
        }
      />

      {isDemo && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data, and nothing created here is saved. Set <code className="fc-kbd">VITE_USE_API=true</code> to see the real moderators.
        </div>
      )}

      {justCreated && <CreatedAccountNotice account={justCreated} onDismiss={() => setJustCreated(null)} />}

      {formOpen && (
        <NewAccountForm
          title="New moderator"
          subtitle="Creates a sign-in for a moderator, who reaches the moderator panel by its direct link"
          roles={['moderator']}
          onCreate={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      )}

      <div className="flex items-center gap-3">
        <SearchInput placeholder="Search moderators…" value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
      </div>

      <div className="fc-card overflow-hidden">
        {loading && (
          <div className="text-center py-16 text-ink-faint">
            <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
            <p className="text-xs font-semibold">Loading moderators...</p>
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

        {!loading && !error && moderators.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title={search ? 'No moderator matches that search' : 'No moderators yet'}
            description={search ? 'Try a different name or email.' : 'Create the first moderator with the button above.'}
          />
        )}

        {!loading && !error && moderators.length > 0 && (
          <DataTable
            data={moderators as unknown as Record<string, unknown>[]}
            getKey={row => String(row.id)}
            columns={[
              { key: 'username', label: 'Moderator', render: row => (
                <div>
                  <p className="text-sm font-semibold text-ink">{String(row.username)}</p>
                  <p className="text-xs text-ink-mute">{String(row.email)}</p>
                </div>
              )},
              { key: 'suspended', label: 'Status', render: row => (
                <StatusBadge status={row.suspended ? 'error' : 'success'} label={row.suspended ? 'Suspended' : 'Active'} />
              )},
              { key: 'joinedAt', label: 'Created', render: row => (
                <span className="text-sm text-ink-mute">{formatDate(String(row.joinedAt))}</span>
              )},
            ]}
          />
        )}
      </div>
    </div>
  )
}
