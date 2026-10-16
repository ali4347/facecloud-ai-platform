import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Lock, CheckCircle } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { PasswordInput } from '../components/ui/PasswordInput'
import { confirmPasswordReset } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'

const labelStyle = { color: 'rgb(var(--a-ink) / 0.42)' }
const lockIcon = (
  <Lock className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none z-10"
    style={{ color: 'rgb(var(--a-ink) / 0.35)' }} />
)

/** Landing page for the link in the reset email: /reset-password/:uid/:token */
export default function ResetPassword() {
  const { uid = '', token = '' } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await confirmPasswordReset(uid, token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(
        err instanceof ApiError && err.isThrottled
          ? 'Too many attempts. Please wait a few minutes and try again.'
          : err instanceof ApiError ? err.message : 'Could not reset the password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell roleLabel="Account Recovery">
      {done ? (
        <div className="text-center space-y-4">
          <CheckCircle className="w-10 h-10 mx-auto" style={{ color: '#4ADE80' }} />
          <h2 className="text-xl font-bold text-ink">Password updated</h2>
          <p className="text-sm" style={{ color: 'rgb(var(--a-ink) / 0.55)' }}>
            You can now sign in with your new password. Taking you to the sign-in page…
          </p>
          <Link to="/login" className="fc-btn-primary w-full block">Sign in</Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-ink mb-1">Choose a new password</h2>
          <p className="text-sm mb-6" style={{ color: 'rgb(var(--a-ink) / 0.48)' }}>
            Pick something you have not used before. You will be signed out on your other devices.
          </p>

          {error && (
            <div className="p-3 mb-5 rounded-2xl text-sm" role="alert"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
              {error}{' '}
              <Link to="/forgot-password" className="underline font-semibold">Request a new link</Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>
                New Password
              </label>
              <PasswordInput id="new-password" leading={lockIcon} value={password}
                onChange={e => setPassword(e.target.value)} className="fc-input !pl-11"
                autoComplete="new-password" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>
                Confirm Password
              </label>
              <PasswordInput id="confirm-password" leading={lockIcon} value={confirm}
                onChange={e => setConfirm(e.target.value)} className="fc-input !pl-11"
                autoComplete="new-password" required />
            </div>
            <button type="submit" className="fc-btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
