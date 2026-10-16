import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck, UserCog, UserPlus, Wand2, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { GradientButton } from '../../components/ui/GradientButton'
import { EmptyState } from '../../components/ui/EmptyState'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { ChartCard } from '../../components/ui/ChartCard'
import { listAdminUsers } from '../../lib/api/adminUsers'
import { USE_API } from '../../lib/api/config'
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

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'

/** A readable random password: no look-alike characters, so it can be read out or typed from a note. */
function generatePassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
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
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [formError, setFormError] = useState('')
  const [justCreated, setJustCreated] = useState<{ username: string; password: string } | null>(null)
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

  const resetForm = () => {
    setUsername(''); setEmail(''); setPassword(''); setConfirm(''); setFormError('')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (password.length < 8) { setFormError('The password needs at least 8 characters.'); return }
    if (password !== confirm) { setFormError('The two passwords do not match.'); return }
    /* Only reachable in demo mode: with the API on, the button is disabled because
       the backend has no endpoint that creates an account for someone else. */
    setAddedInDemo(rows => [{
      id: `demo-${Date.now()}`, username: username.trim(), email: email.trim(),
      suspended: false, joinedAt: new Date().toISOString(),
    }, ...rows])
    setJustCreated({ username: username.trim(), password })
    resetForm()
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

      {justCreated && (
        <div className="p-4 rounded-2xl text-xs border bg-[#10B981]/10 border-[#10B981]/25 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-[#10B981]">Moderator account created (demo)</p>
            <button type="button" onClick={() => setJustCreated(null)} aria-label="Dismiss" className="text-ink-mute hover:text-ink cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-ink-soft">
            Share these sign-in details with <span className="font-semibold text-ink">{justCreated.username}</span> now.
            The password is not shown again.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div><p className={labelClass}>Username</p><p className="fc-kbd inline-block mt-1">{justCreated.username}</p></div>
            <div><p className={labelClass}>Password</p><p className="fc-kbd inline-block mt-1">{justCreated.password}</p></div>
          </div>
        </div>
      )}

      {formOpen && (
        <ChartCard title="New moderator" subtitle="Creates a sign-in for a moderator, who reaches the moderator panel by its direct link">
          <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
            {USE_API && (
              <div className="p-3 rounded-2xl text-xs flex items-start gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-ink-soft">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <span>
                  The backend cannot create an account for someone else yet — it only lists accounts and changes their
                  role. This form is ready, and is switched on once that endpoint exists.
                </span>
              </div>
            )}

            {formError && (
              <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
                {formError}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="mod-username" className={labelClass}>Username</label>
                <input id="mod-username" className="fc-input" value={username} autoComplete="off"
                  onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mod-email" className={labelClass}>Email</label>
                <input id="mod-email" type="email" className="fc-input" value={email} autoComplete="off"
                  onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="mod-password" className={labelClass}>Password</label>
                  <button type="button" className="text-[11px] font-semibold text-[#FB923C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    onClick={() => { const p = generatePassword(); setPassword(p); setConfirm(p) }}>
                    <Wand2 className="w-3 h-3" />Generate
                  </button>
                </div>
                <PasswordInput id="mod-password" className="fc-input" value={password}
                  autoComplete="new-password" onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mod-confirm" className={labelClass}>Confirm password</label>
                <PasswordInput id="mod-confirm" className="fc-input" value={confirm}
                  autoComplete="new-password" onChange={e => setConfirm(e.target.value)} required />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <GradientButton type="submit" disabled={USE_API} leftIcon={<UserCog className="w-4 h-4" />}>
                Create account
              </GradientButton>
              <GradientButton type="button" variant="secondary" onClick={() => { resetForm(); setFormOpen(false) }}>
                Cancel
              </GradientButton>
            </div>
          </form>
        </ChartCard>
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
