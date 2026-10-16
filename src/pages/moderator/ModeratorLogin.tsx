import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { FaceCloudLogo } from '../../components/branding/FaceCloudLogo'
import { signInToPortal } from '../../lib/api/auth'
import { ApiError } from '../../lib/api/client'
import { USE_API } from '../../lib/api/config'

export default function ModeratorLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(USE_API ? '' : 'moderator@facecloud.ai')
  const [password, setPassword] = useState(USE_API ? '' : 'password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    /* With VITE_USE_API=true this is a real sign-in against the backend; the
       mock path below keeps the demo working until every screen is migrated. */
    if (USE_API) {
      try {
        const result = await signInToPortal(email.trim(), password, 'moderator')
        if (result.kind === 'wrong-portal') {
          setError('This account does not have moderator access.')
        } else {
          navigate('/moderator')
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    await new Promise(r => setTimeout(r, 800))
    setLoading(false)

    if (email === 'moderator@facecloud.ai' && password === 'password') {
      const session = {
        token: 'mock-jwt-moderator-token-lmn-45678',
        role: 'moderator',
        email: 'moderator@facecloud.ai',
        name: 'Vaneeza Sohaib',
        initials: 'VS',
        emailVerified: true
      }
      localStorage.setItem('facecloud_session', JSON.stringify(session))
      navigate('/moderator')
    } else {
      setError('Invalid credentials. Use moderator@facecloud.ai / password')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(79,255,176,0.14), transparent 38%),' +
          'radial-gradient(circle at 80% 85%, rgba(249, 115, 22,0.14), transparent 38%),' +
          'rgb(var(--a-surface-soft))',
      }}
    >
      {/* Animated ambient layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[5%] w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'rgba(79,255,176,0.06)' }} />
        <div className="absolute bottom-[8%] right-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(249, 115, 22,0.08)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        
        {/* Logo */}
        <div className="text-center">
          <FaceCloudLogo variant="full" size="lg" roleLabel="Moderator Portal" href="/" priority={true} className="mx-auto" tone="app" />
        </div>

        {/* Card */}
        <div className="fc-panel-strong p-8">
          <h2 className="text-xl font-bold text-ink mb-1">Moderator Access</h2>
          <p className="text-sm mb-6" style={{ color: 'rgb(var(--a-ink) / 0.48)' }}>
            Audit low quality uploads and cluster mappings.
          </p>

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
                Moderator Email
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
                Moderator Password
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

            <button 
              type="submit" 
              className="fc-btn-primary w-full mt-2"
              style={{
                background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                color: 'rgb(var(--a-surface-soft))',
                boxShadow: '0 4px 20px rgba(79,255,176,0.30), inset 0 1px 0 rgb(var(--a-ink) / 0.40)'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In as Moderator'}
            </button>
          </form>
        </div>

        {/* Footnotes */}
          {/* The other staff portal is reachable by direct link only, so it is
              not advertised here either. */}
        <div className="text-center space-y-3 text-xs" style={{ color: 'rgb(var(--a-ink) / 0.38)' }}>
          <div className="flex justify-center gap-5">
            <Link to="/login" className="hover:text-ink transition-colors">User Login</Link>
            <Link to="/" className="hover:text-ink transition-colors">Home Page</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
