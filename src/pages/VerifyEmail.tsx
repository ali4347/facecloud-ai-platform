import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, CheckCircle, RefreshCw } from 'lucide-react'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleVerify = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    localStorage.setItem('fc_email_verified', 'true')
    const sessionStr = localStorage.getItem('facecloud_session')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        session.emailVerified = true
        localStorage.setItem('facecloud_session', JSON.stringify(session))
      } catch (_) { /* ignore */ }
    }
    setSuccess(true)
    setToastMessage('Email address verified successfully!')
    setTimeout(() => navigate('/login'), 1500)
  }

  const handleResend = () => {
    setToastMessage('A new verification email has been sent.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(0,132,255,0.18), transparent 38%),' +
          'radial-gradient(circle at 80% 80%, rgba(79,255,176,0.10), transparent 38%),' +
          '#000000',
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'rgba(0,132,255,0.08)' }} />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(79,255,176,0.07)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Logo */}
        <div className="text-center">
          <FaceCloudLogo variant="full" size="lg" roleLabel="Verify Identity" href="/" priority={true} className="mx-auto" />
        </div>

        {/* Card */}
        <div className="fc-panel-strong p-8 text-center space-y-5">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
            style={{
              background: success ? 'rgba(79,255,176,0.12)' : 'rgba(0,132,255,0.12)',
              border: `1px solid ${success ? 'rgba(79,255,176,0.28)' : 'rgba(96,177,255,0.28)'}`,
              boxShadow: success ? '0 0 30px rgba(79,255,176,0.15)' : '0 0 30px rgba(0,132,255,0.15)',
              transition: 'all 0.4s ease',
            }}
          >
            {success
              ? <CheckCircle className="w-8 h-8" style={{ color: '#4FFFB0' }} />
              : <Mail className="w-8 h-8" style={{ color: '#60B1FF' }} />
            }
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {success ? 'Email Verified!' : 'Confirm Email Address'}
            </h2>
            <p className="text-xs leading-relaxed max-w-xs mx-auto"
              style={{ color: 'rgba(255,255,255,0.50)' }}>
              {success
                ? 'Redirecting you to login…'
                : 'We sent a verification link to your email. Click below to confirm your registration.'}
            </p>
          </div>

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
            <button onClick={handleVerify} className="fc-btn-primary w-full" disabled={loading || success}>
              {loading ? 'Verifying…' : success ? 'Verified ✓' : 'Verify Email'}
            </button>
            <button onClick={handleResend} className="fc-btn-secondary w-full" disabled={success}>
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Verification Link
            </button>
          </div>
        </div>

        <div className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <Link to="/login" className="hover:text-white transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
