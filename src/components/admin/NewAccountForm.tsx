import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserCog, Wand2, X } from 'lucide-react'
import { GradientButton } from '../ui/GradientButton'
import { PasswordInput } from '../ui/PasswordInput'
import { ChartCard } from '../ui/ChartCard'
import type { AdminOrganization } from '../../lib/api/adminOrganizations'
import { ModeratorReasonField } from './ModeratorReasonField'
import { normalizeReason, reasonProblem, serverReasonError } from '../../lib/moderatorReason'
import { userSeats } from '../../lib/seats'

export type NewAccountRole = 'user' | 'moderator'

export interface NewAccount {
  username: string
  email: string
  /** Empty when the person is e-mailed a link to choose their own (the default). */
  password: string
  role: NewAccountRole
  /** Set for a moderator: the organization they work for. */
  organizationId?: number
  /** Set for a moderator: why the administrator assigns them (backend `reason`, kept in the organization's audit trail). */
  reason?: string
}

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'

/** A readable random password: no look-alike characters, so it can be read out or typed from a note. */
function generatePassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
}

/**
 * The administrator's "create an account for someone" form.
 *
 * It hands the account to `onCreate`, which does the real work (or, in the demo build, keeps it for
 * the session). If `onCreate` throws, the message is shown here and what was typed is kept, so the
 * administrator can fix one field instead of retyping everything.
 */
export function NewAccountForm({ title, subtitle, roles, organizations = [], organizationsError = null, onRetryOrganizations, onCreate, onCancel }: {
  title: string
  subtitle: string
  roles: NewAccountRole[]
  /** The teams a moderator can be placed in. A moderator must belong to one, so the form insists on a choice. */
  organizations?: AdminOrganization[]
  /** Why the list of teams could not be loaded; shown instead of "there is no organization yet", which would be untrue. */
  organizationsError?: string | null
  onRetryOrganizations?: () => void
  onCreate: (account: NewAccount) => Promise<void> | void
  onCancel: () => void
}) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  /* By default the person chooses their own password from an e-mailed link, so the administrator never knows it. */
  const [passwordMode, setPasswordMode] = useState<'link' | 'set'>('link')
  const [role, setRole] = useState<NewAccountRole>(roles[0])
  const [organizationId, setOrganizationId] = useState<number | ''>(organizations.length === 1 ? organizations[0].id : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Only a moderator assignment needs a reason (backend PR #176); an ordinary account does not.
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (passwordMode === 'set' && password.length < 8) { setError('The password needs at least 8 characters.'); return }
    if (passwordMode === 'set' && password !== confirm) { setError('The two passwords do not match.'); return }
    if (role === 'moderator' && organizationId === '') { setError('Choose the organization this moderator works for.'); return }
    setReasonError('')
    if (role === 'moderator') {
      const problem = reasonProblem(reason)
      if (problem) { setReasonError(problem); return }
    }
    setBusy(true)
    try {
      await onCreate({
        username: username.trim(), email: email.trim(), password: passwordMode === 'set' ? password : '', role,
        ...(role === 'moderator' && organizationId !== '' ? { organizationId } : {}),
        ...(role === 'moderator' ? { reason: normalizeReason(reason) } : {}),
      })
    } catch (caught) {
      // The server's own sentence about the reason goes under the field; anything else above the form.
      const aboutReason = serverReasonError(caught)
      if (aboutReason) setReasonError(aboutReason)
      else setError(caught instanceof Error ? caught.message : 'Could not create the account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        {error && (
          <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="new-username" className={labelClass}>Username</label>
            <input id="new-username" className="fc-input" value={username} autoComplete="off"
              onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-email" className={labelClass}>Email</label>
            <input id="new-email" type="email" className="fc-input" value={email} autoComplete="off"
              onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className={labelClass}>Password</legend>
          <label className="flex items-start gap-2 text-xs text-ink-soft cursor-pointer">
            <input type="radio" name="password-mode" className="mt-0.5 accent-[#F97316]" checked={passwordMode === 'link'} onChange={() => setPasswordMode('link')} />
            <span><strong className="text-ink">E-mail them a link to choose their own</strong> (recommended): you never know their password.</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-ink-soft cursor-pointer">
            <input type="radio" name="password-mode" className="mt-0.5 accent-[#F97316]" checked={passwordMode === 'set'} onChange={() => setPasswordMode('set')} />
            <span>Set a password now and hand it over yourself.</span>
          </label>
        </fieldset>

        {passwordMode === 'set' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="new-password" className={labelClass}>Password</label>
              <button type="button" className="text-[11px] font-semibold text-[#FB923C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                onClick={() => { const p = generatePassword(); setPassword(p); setConfirm(p) }}>
                <Wand2 className="w-3 h-3" />Generate
              </button>
            </div>
            <PasswordInput id="new-password" className="fc-input" value={password}
              autoComplete="new-password" onChange={e => setPassword(e.target.value)} required={passwordMode === 'set'} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-confirm" className={labelClass}>Confirm password</label>
            <PasswordInput id="new-confirm" className="fc-input" value={confirm}
              autoComplete="new-password" onChange={e => setConfirm(e.target.value)} required={passwordMode === 'set'} />
          </div>
        </div>
        )}

        {roles.length > 1 && (
          <div className="space-y-1.5 max-w-[16rem]">
            <label htmlFor="new-role" className={labelClass}>Role</label>
            <select id="new-role" className="fc-input" value={role}
              onChange={e => setRole(e.target.value as NewAccountRole)}>
              {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        )}

        {role === 'moderator' && (
          <div className="space-y-1.5 max-w-sm">
            <label htmlFor="new-organization" className={labelClass}>Organization</label>
            {organizationsError ? (
              <p role="alert" className="text-xs text-[#F87171]">
                The organizations could not be loaded: {organizationsError}
                {onRetryOrganizations && <> <button type="button" onClick={onRetryOrganizations} className="font-semibold text-[#FB923C] hover:underline cursor-pointer">Try again</button></>}
              </p>
            ) : organizations.length === 0 ? (
              <p className="text-xs text-ink-mute">There is no organization yet. <Link to="/admin/organizations" className="font-semibold text-[#FB923C] hover:underline">Create one first</Link>: a moderator works for an organization and only sees its data.</p>
            ) : (
              <>
                <select id="new-organization" className="fc-input" value={organizationId} onChange={e => setOrganizationId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="">Choose an organization…</option>
                  {organizations.map(o => {
                    const roleFull = Boolean(o.usage && o.limits && o.limits.moderators !== null && o.usage.moderators >= o.limits.moderators)
                    const planFull = Boolean(userSeats(o.usage, o.limits)?.full)          // the plan's total user limit
                    const seatsFull = roleFull || planFull
                    return <option key={o.id} value={o.id} disabled={seatsFull}>{o.name}{planFull ? ' (plan full)' : roleFull ? ' (moderator seats full)' : o.limits?.moderators != null && o.usage ? ` (${o.usage.moderators} of ${o.limits.moderators} moderators)` : ''}</option>
                  })}
                </select>
                <p className="text-[10px] text-ink-faint">The moderator will only see this organization's members and photos.</p>
              </>
            )}
          </div>
        )}

        {role === 'moderator' && (
          <ModeratorReasonField id="new-moderator-reason" value={reason} onChange={value => { setReason(value); setReasonError('') }} error={reasonError} />
        )}

        <div className="flex gap-2 pt-1">
          <GradientButton type="submit" disabled={busy || (role === 'moderator' && (organizations.length === 0 || Boolean(organizationsError)))} leftIcon={<UserCog className="w-4 h-4" />}>
            {busy ? 'Creating…' : 'Create account'}
          </GradientButton>
          <GradientButton type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</GradientButton>
        </div>
      </form>
    </ChartCard>
  )
}

/** Shown once after an account is created, because the password is not kept anywhere to show later. */
export function CreatedAccountNotice({ account, demo = false, onDismiss }: { account: NewAccount; demo?: boolean; onDismiss: () => void }) {
  return (
    <div className="p-4 rounded-2xl text-xs border bg-[#10B981]/10 border-[#10B981]/25 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[#10B981]">Account created{demo ? ' (demo — nothing is saved)' : ''}</p>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-ink-mute hover:text-ink cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      {account.password ? (
        <>
          <p className="text-ink-soft">
            Share these sign-in details with <span className="font-semibold text-ink">{account.username}</span> now.
            The sign-in screens take the email address. The password is not shown again.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div><p className={labelClass}>Email (sign in with this)</p><p className="fc-kbd inline-block mt-1">{account.email}</p></div>
            <div><p className={labelClass}>Password</p><p className="fc-kbd inline-block mt-1">{account.password}</p></div>
          </div>
        </>
      ) : (
        <p className="text-ink-soft">
          {demo ? 'In the live app, ' : ''}<span className="font-semibold text-ink">{account.email}</span> {demo ? 'would get' : 'was sent'} a link to choose a password. They sign in with this e-mail address once they have set it. Nobody else ever sees the password.
        </p>
      )}
    </div>
  )
}
