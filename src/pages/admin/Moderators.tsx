import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { GradientButton } from '../../components/ui/GradientButton'
import { EmptyState } from '../../components/ui/EmptyState'
import { NewAccountForm, CreatedAccountNotice } from '../../components/admin/NewAccountForm'
import type { NewAccount } from '../../components/admin/NewAccountForm'
import { createAdminUser } from '../../lib/api/adminUsers'
import { teamsOf, useAdminOrganizations } from '../../lib/useAdminOrganizations'
import { USE_API } from '../../lib/api/config'
import { USERS_PAGE_SIZE, useAdminUserList, type AccountRow } from '../../lib/useAdminUserList'
import { formatDate } from '../../lib/utils'

export default function Moderators() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [justCreated, setJustCreated] = useState<NewAccount | null>(null)
  const [addedInDemo, setAddedInDemo] = useState<AccountRow[]>([])

  const [page, setPage] = useState(1)
  const orgs = useAdminOrganizations()
  const { data, loading, error, isDemo, reload } = useAdminUserList(search, page, 'moderator')

  const moderators = useMemo(
    () => [...(page === 1 && !search.trim() ? addedInDemo : []), ...(data?.rows ?? [])],
    [data, addedInDemo, page, search],
  )

  const total = (data?.count ?? 0) + addedInDemo.length
  const lastPage = Math.max(1, Math.ceil((data?.count ?? 0) / USERS_PAGE_SIZE))

  /* Live: the backend creates the account and the list is read again. Demo: kept for the session only. */
  const handleCreate = async (account: NewAccount) => {
    if (USE_API) {
      await createAdminUser({ username: account.username, email: account.email, password: account.password, role: 'moderator', ...(account.organizationId !== undefined ? { organization_id: account.organizationId } : {}) })
      reload()
    } else {
      setAddedInDemo(rows => [{
        id: `demo-${Date.now()}`, name: account.username, email: account.email, role: 'moderator', uploads: null, lastLogin: null,
        suspended: false, joinedAt: new Date().toISOString(),
      }, ...rows])
    }
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

      {justCreated && <CreatedAccountNotice account={justCreated} demo={!USE_API} onDismiss={() => setJustCreated(null)} />}

      {formOpen && (
        <NewAccountForm
          title="New moderator"
          subtitle="Creates a sign-in for a moderator, who reaches the moderator panel by its direct link"
          roles={['moderator']}
          organizations={teamsOf(orgs.data)}
            organizationsError={orgs.error}
            onRetryOrganizations={orgs.reload}
          onCreate={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      )}

      <div className="flex items-center gap-3">
        <SearchInput placeholder="Search moderators…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-72" />
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
              { key: 'name', label: 'Moderator', render: row => (
                <div>
                  <p className="text-sm font-semibold text-ink">{String(row.name)}</p>
                  <p className="text-xs text-ink-mute">{String(row.email)}</p>
                </div>
              )},
              { key: 'suspended', label: 'Status', render: row => (
                <StatusBadge status={row.suspended ? 'error' : 'success'} label={row.suspended ? 'Suspended' : 'Active'} />
              )},
              // The backend stamps last_login on every successful sign-in; null means the account never signed in.
              { key: 'lastLogin', label: 'Last sign-in', render: row => (
                <span className="text-sm text-ink-mute">{row.lastLogin ? formatDate(String(row.lastLogin)) : 'Never'}</span>
              )},
              { key: 'joinedAt', label: 'Created', render: row => (
                <span className="text-sm text-ink-mute">{formatDate(String(row.joinedAt))}</span>
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
  )
}
