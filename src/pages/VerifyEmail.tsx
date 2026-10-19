import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mail, CheckCircle, RefreshCw } from 'lucide-react'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'
import {
  verifyEmail, resendVerificationLink, getPendingRegistration, clearPendingRegistration,
} from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { USE_API } from '../lib/api/config'
import { readSessionRaw, saveSession } from '../lib/session'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [error, setError] = useState('')

  /* The emailed link carries `registration_id` and `token`. They are read once
     and then removed from the address bar, so the token does not linger in the
     browser history or get copied along when someone shares the screen. */
  const [fromLink] = useState(() => ({
    registrationId: searchParams.get('registration_id') ?? '',
    token: searchParams.get('token') ?? '',
  }))
  useEffect(() => {
    if (searchParams.has('token') || searchParams.has('registration_id')) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const pending = getPendingRegistration()
  const registrationId = fromLink.registrationId || pending?.id || ''
  const canVerify = !USE_API || (fromLink.registrationId !== '' && fromLink.token !== '')

  const finish = () => {
    clearPendingRegistration()
    setSuccess(true)
    setToastMessage('Email address verified successfully!')
    setTimeout(() => navigate('/login'), 1500)
  }

  /* The backend's own wording is kept, including its 429s: they say how long to wait. */
  const messageFor = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback

  const handleVerify = async () => {
    setError('')
    setLoading(true)

    /* With VITE_USE_API=true this confirms the link with the backend, which
       creates the account. The demo path below only flips a local flag. */
    if (USE_API) {
      try {
        await verifyEmail(fromLink.registrationId, fromLink.token)
        finish()
      } catch (err) {
        setError(messageFor(err, 'Could not verify the email. Please try again.'))
      } finally {
        setLoading(false)
      }
      return
    }

    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    localStorage.setItem('fc_email_verified', 'true')
    const sessionStr = readSessionRaw('user')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        session.emailVerified = true
        saveSession(session)
      } catch (_) { /* ignore */ }
    }
    finish()
  }

  const handleResend = async () => {
    setError('')
    if (!USE_API) {
      setToastMessage('A new verification email has been sent.')
      setTimeout(() => setToastMessage(''), 3000)
      return
    }
    if (!registrationId) {
      setError('We cannot tell which sign-up this is. Please create the account again to get a new link.')
      return
    }
    try {
      await resendVerificationLink(registrationId)
      setToastMessage('If the sign-up is still open, a new link is on its way.')
      setTimeout(() => setToastMessage(''), 4000)
    } catch (err) {
      setError(messageFor(err, 'Could not send a new link. Please try again.'))
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(249, 115, 22,0.18), transparent 38%),' +
          'radial-gradient(circle at 80% 80%, rgba(79,255,176,0.10), transparent 38%),' +
          'rgb(var(--a-surface-soft))',
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'rgba(249, 115, 22,0.08)' }} />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(79,255,176,0.07)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Logo */}
        <div className="text-center">
          <FaceCloudLogo variant="full" size="lg" roleLabel="Verify Identity" href="/" priority={true} className="mx-auto" tone="app" />
        </div>

        {/* Card */}
        <div className="fc-panel-strong p-8 text-center space-y-5">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
            style={{
              background: success ? 'rgba(79,255,176,0.12)' : 'rgba(249, 115, 22,0.12)',
              border: `1px solid ${success ? 'rgba(79,255,176,0.28)' : 'rgba(249, 115, 22,0.28)'}`,
              boxShadow: success ? '0 0 30px rgba(79,255,176,0.15)' : '0 0 30px rgba(249, 115, 22,0.15)',
              transition: 'all 0.4s ease',
            }}
          >
            {success
              ? <CheckCircle className="w-8 h-8" style={{ color: '#4FFFB0' }} />
              : <Mail className="w-8 h-8" style={{ color: '#FB923C' }} />
            }
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink">
              {success ? 'Email Verified!' : 'Confirm Email Address'}
            </h2>
            <p className="text-xs leading-relaxed max-w-xs mx-auto"
              style={{ color: 'rgb(var(--a-ink) / 0.50)' }}>
              {success
                ? 'Redirecting you to login…'
                : USE_API && !canVerify
                  ? `We sent a verification link${pending?.maskedEmail ? ` to ${pending.maskedEmail}` : ' to your email'}. Open the link in that email to confirm your registration.`
                  : 'We sent a verification link to your email. Click below to confirm your registration.'}
            </p>
          </div>

          {error && !success && (
            <div
              role="alert"
              className="p-3 rounded-2xl text-xs font-semibold"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#F87171',
              }}
            >
              {error}
            </div>
          )}

          {toastMessage && !success && (
            <div
              className="p-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'rgba(79,255,176,0.10)',
                border: '1px solid rgba(79,255,176,0.22)',
                color: '#4FFFB0',
              }}
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {toastMessage}
            </div>
          )}

          <div className="space-y-3 pt-1">
            <button onClick={handleVerify} className="fc-btn-primary w-full" disabled={loading || success || !canVerify}>
              {loading ? 'Verifying…' : success ? 'Verified ✓' : 'Verify Email'}
            </button>
            <button onClick={handleResend} className="fc-btn-secondary w-full" disabled={success}>
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Verification Link
            </button>
          </div>
        </div>

        <div className="text-center text-xs" style={{ color: 'rgb(var(--a-ink) / 0.35)' }}>
          <Link to="/login" className="hover:text-ink transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
