import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Lock, Mail } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@dtm.io')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)

    if (email === 'admin@dtm.io' && password === 'password') {
      const session = {
        token: 'mock-jwt-admin-token-abc-98765',
        role: 'admin',
        email: 'admin@dtm.io',
        name: 'Ali Hassan',
        initials: 'AH',
        emailVerified: true
      }
      localStorage.setItem('facecloud_session', JSON.stringify(session))
      navigate('/admin')
    } else {
      setError('Invalid credentials. Use admin@dtm.io / password')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(123,97,255,0.18), transparent 38%),' +
          'radial-gradient(circle at 80% 85%, rgba(0,132,255,0.14), transparent 38%),' +
          '#000000',
      }}
    >
      {/* Animated ambient layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[5%] w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'rgba(123,97,255,0.08)' }} />
        <div className="absolute bottom-[8%] right-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(0,132,255,0.08)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        
        {/* Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center group">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #7B61FF, #0084FF)',
                boxShadow: '0 0 24px rgba(123,97,255,0.50)',
              }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">FaceCloud</span>
          </Link>
          <span className="block text-[9px] font-bold uppercase tracking-[0.22em]"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            Admin Console Access
          </span>
        </div>

        {/* Card */}
        <div className="fc-panel-strong p-8">
          <h2 className="text-xl font-bold text-white mb-1">Console Authentication</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.48)' }}>
            Manage global users, logs, and services.
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
                style={{ color: 'rgba(255,255,255,0.42)' }}>
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.35)' }} />
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
                style={{ color: 'rgba(255,255,255,0.42)' }}>
                Console Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.35)' }} />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="fc-input !pl-11"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="fc-btn-primary w-full mt-2"
              style={{
                background: 'linear-gradient(135deg, #7B61FF 0%, #0084FF 100%)',
                boxShadow: '0 4px 20px rgba(123,97,255,0.35), inset 0 1px 0 rgba(255,255,255,0.20)'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>
        </div>

        {/* Footnotes */}
        <div className="text-center space-y-3 text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
          <div className="flex justify-center gap-5">
            <Link to="/login" className="hover:text-white transition-colors">User Login</Link>
            <Link to="/moderator/login" className="hover:text-white transition-colors">Moderator Portal</Link>
            <Link to="/" className="hover:text-white transition-colors">Home Page</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
