import { useState } from 'react'
import { AlertTriangle, UserCog, Wand2, X } from 'lucide-react'
import { GradientButton } from '../ui/GradientButton'
import { PasswordInput } from '../ui/PasswordInput'
import { ChartCard } from '../ui/ChartCard'
import { USE_API } from '../../lib/api/config'

export type NewAccountRole = 'user' | 'moderator'

export interface NewAccount {
  username: string
  email: string
  password: string
  role: NewAccountRole
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
 * Against the live API the submit button is off: the backend can list accounts and
 * change their role or suspension, but has no endpoint that creates an account for
 * someone else, and calling one that does not exist would only fail. In demo mode
 * the account is handed to `onCreate` and lives for the session.
 */
export function NewAccountForm({ title, subtitle, roles, onCreate, onCancel }: {
  title: string
  subtitle: string
  roles: NewAccountRole[]
  onCreate: (account: NewAccount) => void
  onCancel: () => void
}) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<NewAccountRole>(roles[0])
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('The password needs at least 8 characters.'); return }
    if (password !== confirm) { setError('The two passwords do not match.'); return }
    onCreate({ username: username.trim(), email: email.trim(), password, role })
  }

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        {USE_API && (
          <div className="p-3 rounded-2xl text-xs flex items-start gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-ink-soft">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <span>
              The backend cannot create an account for someone else yet — it only lists accounts and changes their
              role. This form is ready, and is switched on once that endpoint exists.
            </span>
          </div>
        )}

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
              autoComplete="new-password" onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-confirm" className={labelClass}>Confirm password</label>
            <PasswordInput id="new-confirm" className="fc-input" value={confirm}
              autoComplete="new-password" onChange={e => setConfirm(e.target.value)} required />
          </div>
        </div>

        {roles.length > 1 && (
          <div className="space-y-1.5 max-w-[16rem]">
            <label htmlFor="new-role" className={labelClass}>Role</label>
            <select id="new-role" className="fc-input" value={role}
              onChange={e => setRole(e.target.value as NewAccountRole)}>
              {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <GradientButton type="submit" disabled={USE_API} leftIcon={<UserCog className="w-4 h-4" />}>
            Create account
          </GradientButton>
          <GradientButton type="button" variant="secondary" onClick={onCancel}>Cancel</GradientButton>
        </div>
      </form>
    </ChartCard>
  )
}

/** Shown once after an account is created, because the password is not kept anywhere to show later. */
export function CreatedAccountNotice({ account, onDismiss }: { account: NewAccount; onDismiss: () => void }) {
  return (
    <div className="p-4 rounded-2xl text-xs border bg-[#10B981]/10 border-[#10B981]/25 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[#10B981]">Account created (demo)</p>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-ink-mute hover:text-ink cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-ink-soft">
        Share these sign-in details with <span className="font-semibold text-ink">{account.username}</span> now.
        The password is not shown again.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <div><p className={labelClass}>Username</p><p className="fc-kbd inline-block mt-1">{account.username}</p></div>
        <div><p className={labelClass}>Password</p><p className="fc-kbd inline-block mt-1">{account.password}</p></div>
      </div>
    </div>
  )
}
