import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    localStorage.setItem('fc_draft_user', JSON.stringify({ name, email, password }))
    localStorage.setItem('fc_email_verified', 'false')
    navigate('/verify-email')
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[5%] w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'rgba(249, 115, 22,0.07)' }} />
        <div className="absolute bottom-[8%] right-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(234, 88, 12,0.07)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Logo */}
        <div className="text-center">
          <FaceCloudLogo variant="full" size="lg" roleLabel="Create Account" href="/" priority={true} className="mx-auto" tone="app" />
        </div>

        {/* Card */}
        <div className="fc-panel-strong p-8">
          <h2 className="text-xl font-bold text-ink mb-1">Get Started</h2>
          <p className="text-sm mb-6" style={{ color: 'rgb(var(--a-ink) / 0.48)' }}>
            Create your profile to process faces with AI.
          </p>

          {error && (
            <div className="p-3 mb-5 rounded-2xl text-sm"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { label: 'Full Name',        icon: User,  type: 'text',     placeholder: 'e.g. Ali Hassan',            val: name,            set: setName },
              { label: 'Email Address',    icon: Mail,  type: 'email',    placeholder: 'e.g. user@facecloud.ai',     val: email,           set: setEmail },
              { label: 'Password',         icon: Lock,  type: 'password', placeholder: '',                           val: password,        set: setPassword },
              { label: 'Confirm Password', icon: Lock,  type: 'password', placeholder: '',                           val: confirmPassword, set: setConfirmPassword },
            ].map(f => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'rgb(var(--a-ink) / 0.42)' }}>
                  {f.label}
                </label>
                <div className="relative">
                  <f.icon className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none"
                    style={{ color: 'rgb(var(--a-ink) / 0.35)' }} />
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    className="fc-input !pl-11"
                    required
                  />
                </div>
              </div>
            ))}

            <button type="submit" className="fc-btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Registering…' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs" style={{ color: 'rgb(var(--a-ink) / 0.38)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold transition-colors"
            style={{ color: '#FB923C' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FB923C')}
            onMouseLeave={e => (e.currentTarget.style.color = '#FB923C')}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
