import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { requestPasswordReset } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { USE_API } from '../lib/api/config'

const labelStyle = { color: 'rgb(var(--a-ink) / 0.42)' }

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Demo mode has no server to send mail, so the screen says so plainly.
      if (USE_API) await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(
        err instanceof ApiError && err.isThrottled
          ? 'Too many attempts. Please wait a few minutes and try again.'
          : err instanceof ApiError ? err.message : 'Could not send the email. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell roleLabel="Account Recovery">
      {sent ? (
        <div className="text-center space-y-4">
          <CheckCircle className="w-10 h-10 mx-auto" style={{ color: '#4ADE80' }} />
          <h2 className="text-xl font-bold text-ink">Check your email</h2>
          {USE_API ? (
            <p className="text-sm" style={{ color: 'rgb(var(--a-ink) / 0.55)' }}>
              If an account exists for <span className="font-semibold text-ink">{email}</span>, we have sent a
              link to reset the password. The link works once and expires after a short time.
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'rgb(var(--a-ink) / 0.55)' }}>
              This is the demo, so no email is sent. With the live service connected, the reset link
              arrives in your inbox.
            </p>
          )}
          <Link to="/login" className="fc-btn-primary w-full block">Back to sign in</Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-ink mb-1">Forgot your password?</h2>
          <p className="text-sm mb-6" style={{ color: 'rgb(var(--a-ink) / 0.48)' }}>
            Enter your account email and we will send you a link to choose a new one.
          </p>

          {error && (
            <div className="p-3 mb-5 rounded-2xl text-sm" role="alert"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgb(var(--a-ink) / 0.35)' }} />
                <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="fc-input !pl-11" autoComplete="email" required />
              </div>
            </div>
            <button type="submit" className="fc-btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: 'rgb(var(--a-ink) / 0.38)' }}>
            Remembered it?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#FB923C' }}>Back to sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}
