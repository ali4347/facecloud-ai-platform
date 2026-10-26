import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Save } from 'lucide-react'
import { ChartCard } from '../ui/ChartCard'
import { GradientButton } from '../ui/GradientButton'
import { PasswordInput } from '../ui/PasswordInput'
import { ApiError } from '../../lib/api/client'
import { USE_API } from '../../lib/api/config'
import { changePassword, updateProfileName } from '../../lib/api/auth'
import { clearSession, updateSessionName, useSessionUser } from '../../lib/session'
import type { Role } from '../../data/mock'

const loginPath: Record<Role, string> = { user: '/login', admin: '/admin/login', moderator: '/moderator/login' }

/**
 * The account cards every portal shares: the display name, and the password.
 * The user portal has its own fuller Settings page; the administrator's and
 * the moderator's settings pages mount this. Same endpoints as the user's
 * page (`/api/user/profile/`, `/api/user/change-password/`), which serve any
 * signed-in account.
 */
export function AccountSettings({ role }: { role: Role }) {
  const navigate = useNavigate()
  const account = useSessionUser(role)

  const [name, setName] = useState(account.name)
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null); setNameSaved(false)
    if (!name.trim()) { setNameError('Please enter your name.'); return }
    setSavingName(true)
    try {
      const saved = USE_API ? await updateProfileName(name.trim()) : name.trim()
      updateSessionName(role, saved || name.trim())
      setNameSaved(true)
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : 'Could not save your name.')
    } finally {
      setSavingName(false)
    }
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    if (!current || !next) { setPwError('Enter your current and new password.'); return }
    if (next !== confirm) { setPwError('The new passwords do not match.'); return }
    if (!USE_API) { setPwError('The password cannot be changed in the demo build.'); return }
    setBusy(true)
    try {
      await changePassword(current, next)
      clearSession(role)
      navigate(loginPath[role], { replace: true, state: { notice: 'Your password was changed. Please sign in again.' } })
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : 'Could not change your password. Please try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <ChartCard title="Profile" subtitle={account.email}>
        <form onSubmit={saveName} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="account-name" className="text-xs font-semibold text-ink block mb-1.5">Full Name</label>
            <input id="account-name" className="fc-input" value={name} onChange={e => { setName(e.target.value); setNameSaved(false) }} autoComplete="name" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <GradientButton type="submit" leftIcon={<Save className="w-4 h-4" />} disabled={savingName}>{savingName ? 'Saving…' : 'Save'}</GradientButton>
            {nameSaved && <span role="status" className="text-xs text-emerald-500 font-medium inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Saved</span>}
            {nameError && <span role="alert" className="text-xs text-red-500">{nameError}</span>}
          </div>
        </form>
      </ChartCard>

      <ChartCard title="Password" subtitle="Changing it signs you out on every device">
        <form onSubmit={submitPassword} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="account-current-password" className="text-xs font-semibold text-ink block mb-1.5">Current Password</label>
            <PasswordInput id="account-current-password" className="fc-input" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="account-new-password" className="text-xs font-semibold text-ink block mb-1.5">New Password</label>
            <PasswordInput id="account-new-password" className="fc-input" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="account-confirm-password" className="text-xs font-semibold text-ink block mb-1.5">Confirm New Password</label>
            <PasswordInput id="account-confirm-password" className="fc-input" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <GradientButton type="submit" variant="secondary" disabled={busy}>{busy ? 'Updating…' : 'Update Password'}</GradientButton>
            {pwError && <span role="alert" className="text-xs text-red-500">{pwError}</span>}
          </div>
        </form>
      </ChartCard>
    </>
  )
}
