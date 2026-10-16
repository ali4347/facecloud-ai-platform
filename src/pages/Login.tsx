import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Lock, Mail, AlertTriangle } from 'lucide-react'
import { PasswordInput } from '../components/ui/PasswordInput'
import { signInToPortal } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { USE_API } from '../lib/api/config'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  /* The demo account is pre-filled only in demo mode; a real sign-in starts empty. */
  const [email, setEmail] = useState(USE_API ? '' : 'user@facecloud.ai')
  const [password, setPassword] = useState(USE_API ? '' : 'password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sessionExpired = (location.state as { sessionExpired?: boolean } | null)?.sessionExpired === true

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    /* With VITE_USE_API=true this is a real sign-in against the backend; the
       mock path below keeps the demo working until every screen is migrated. */
    if (USE_API) {
      try {
        const result = await signInToPortal(email.trim(), password, 'any')
        if (result.kind !== 'ok') return // only the staff screens can be sent to the wrong portal
        navigate(result.dashboard === 'admin' ? '/admin'
               : result.dashboard === 'moderator' ? '/moderator'
               : '/dashboard')
      } catch (err) {
        // The backend answers the same way for wrong password, unverified and
        // suspended accounts, on purpose. Show its message rather than guessing.
        setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    if (email === 'user@facecloud.ai' && password === 'password') {
      const session = {
        token: 'mock-jwt-user-token-xyz-12345',
        role: 'user',
        email: 'user@facecloud.ai',
        name: 'Ijaz Ahmad',
        initials: 'IA',
        emailVerified: localStorage.getItem('fc_email_verified') === 'true',
      }
      localStorage.setItem('facecloud_session', JSON.stringify(session))
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Use user@facecloud.ai / password')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(249, 115, 22,0.18), transparent 38%),' +
          'radial-gradient(circle at 80% 85%, rgba(234, 88, 12,0.14), transparent 38%),' +
          'rgb(var(--a-surface-soft))',
      }}
    >
      {/* Animated ambient layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[5%] w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'rgba(249, 115, 22,0.08)' }} />
        <div className="absolute bottom-[8%] right-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(234, 88, 12,0.08)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Logo */}
        <div className="text-center">
          <FaceCloudLogo variant="full" size="lg" roleLabel="User Portal" href="/" priority={true} className="mx-auto" tone="app" />
        </div>

        {/* Card */}
        <div className="fc-panel-strong p-8">
          <h2 className="text-xl font-bold text-ink mb-1">Welcome Back</h2>
          <p className="text-sm mb-6" style={{ color: 'rgb(var(--a-ink) / 0.48)' }}>
            Access your AI-enhanced image workspace.
          </p>

          {/* Session-expired banner */}
          {sessionExpired && (
            <div
              className="p-3 mb-5 rounded-2xl text-sm flex items-start gap-2.5"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#FCD34D',
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Your session has expired — please log in again.</span>
            </div>
          )}

          {error && (
            <div
              className="p-3 mb-5 rounded-2xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#F87171',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'rgb(var(--a-ink) / 0.42)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgb(var(--a-ink) / 0.35)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="fc-input !pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'rgb(var(--a-ink) / 0.42)' }}>
                Password
              </label>
              <PasswordInput
                leading={
                  <Lock
                    className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none z-10"
                    style={{ color: 'rgb(var(--a-ink) / 0.35)' }}
                  />
                }
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="fc-input !pl-11"
                required
              />
            </div>

            <div className="flex justify-end -mt-1">
              <Link to="/forgot-password" className="text-xs font-semibold transition-colors hover:underline"
                style={{ color: '#FB923C' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="fc-btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Authenticating…' : 'Sign In as User'}
            </button>
          </form>
        </div>

        {/* Links */}
        <div className="text-center space-y-3 text-xs" style={{ color: 'rgb(var(--a-ink) / 0.38)' }}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors"
              style={{ color: '#FB923C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FB923C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#FB923C')}
            >
              Create Account
            </Link>
          </p>
          <div className="flex justify-center gap-5">
            {/* Staff portals are reachable by direct link only (/admin, /moderator),
                so they are not advertised to people signing in as users. */}
            {[{ to: '/', label: 'Home' }].map(l => (
              <Link key={l.to} to={l.to}
                className="hover:text-ink transition-colors"
                style={{ color: 'rgb(var(--a-ink) / 0.35)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
