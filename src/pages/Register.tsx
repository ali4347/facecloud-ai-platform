import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'
import { register, registerFromInvitation, savePendingRegistration } from '../lib/api/auth'
import { previewInvitation, type InvitationPreview } from '../lib/api/organizations'
import { ApiError } from '../lib/api/client'
import { USE_API } from '../lib/api/config'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Arriving from an organization invitation link: the address is the invited one, and signing up joins the organization too.
  const invitationToken = useSearchParams()[0].get('invitation') ?? ''
  /* From an invitation, signing in comes back to that invitation to accept it (Login follows only safe addresses: see safeNext). */
  const signInHref = invitationToken ? `/login?next=${encodeURIComponent(`/invitations/${encodeURIComponent(invitationToken)}`)}` : '/login'
  const [invite, setInvite] = useState<InvitationPreview | null>(null)
  const [inviteProblem, setInviteProblem] = useState('')
  const [emailTaken, setEmailTaken] = useState(false)
  useEffect(() => {
    if (!USE_API || !invitationToken) return
    const controller = new AbortController()
    previewInvitation(invitationToken, controller.signal)
      .then(p => { if (!controller.signal.aborted) { setInvite(p); setEmail(p.email) } })
      .catch(err => { if (!controller.signal.aborted) setInviteProblem(err instanceof ApiError ? err.message : 'This invitation could not be checked.') })
    return () => controller.abort()
  }, [invitationToken])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)

    /* With VITE_USE_API=true the account is created for real: the backend emails
       a verification link and the account exists once it is opened. The password
       goes to the backend and nowhere else — it is never kept in the browser. */
    if (USE_API && invitationToken && invite) {
      try {
        const signedIn = await registerFromInvitation({ fullName: name, email: email.trim(), password, passwordConfirm: confirmPassword, invitationToken })
        // A new owner goes straight to their organization; a moderator to the moderator panel; anyone else to their dashboard.
        navigate(invite.role === 'owner' ? '/dashboard/organization' : signedIn.dashboard === 'moderator' ? '/moderator' : '/dashboard', { replace: true })
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Could not create the account. Please try again.'
        setEmailTaken(err instanceof ApiError && /already|exists|registered|taken/i.test(message))
        setError(message)
      } finally {
        setLoading(false)
      }
      return
    }
    if (USE_API) {
      try {
        const { registrationId, maskedEmail } = await register({
          fullName: name, email: email.trim(), password, passwordConfirm: confirmPassword,
        })
        savePendingRegistration({ id: registrationId, maskedEmail })
        navigate('/verify-email')
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not create the account. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
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
          <h1 className="text-xl font-bold text-ink mb-1">Get Started</h1>
          <p className="text-sm mb-6" style={{ color: 'rgb(var(--a-ink) / 0.48)' }}>
            Create your profile to process faces with AI.
          </p>
          {!invitationToken && (
            <p className="text-[11px] text-ink-faint -mt-4 mb-5">
              This creates a personal account: your photos are private to you. You join an organization only by accepting an invitation from it.
            </p>
          )}

          {invite && (
            <div className="p-3 mb-5 rounded-2xl text-xs" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', color: 'rgb(var(--a-ink-soft))' }}>
              {invite.role === 'owner'
                ? <>You were invited to be the owner of <strong className="text-ink">{invite.organization_name}</strong>. Creating your account here accepts the invitation: you become its owner at once (the link already proved your e-mail address). Your personal photos stay private.</>
                : <>You were invited to <strong className="text-ink">{invite.organization_name}</strong> as a {invite.role}. Creating your account here joins it at once; there is no email to confirm.</>}
            </div>
          )}
          {inviteProblem && (
            <div role="alert" className="p-3 mb-5 rounded-2xl text-xs" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
              {inviteProblem} Ask whoever invited you for a new invitation.
            </div>
          )}
          {error && (
            <div role="alert" className="p-3 mb-5 rounded-2xl text-sm"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
              {error}
              {emailTaken && invitationToken && <> <Link to={signInHref} className="font-semibold underline">Sign in</Link> with that address and you come straight back to the invitation to accept it.</>}
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
                <label htmlFor={`register-${f.label.replace(/\s+/g, '-').toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'rgb(var(--a-ink) / 0.42)' }}>
                  {f.label}
                </label>
                <div className="relative">
                  <f.icon className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none"
                    style={{ color: 'rgb(var(--a-ink) / 0.35)' }} />
                  <input
                    id={`register-${f.label.replace(/\s+/g, '-').toLowerCase()}`}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    readOnly={f.label === 'Email Address' && invite !== null}
                    className="fc-input !pl-11"
                    required
                  />
                </div>
              </div>
            ))}

            <button type="submit" className="fc-btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Registering…' : invite ? (invite.role === 'owner' ? `Create account and become the owner` : `Create account and join ${invite.organization_name}`) : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs" style={{ color: 'rgb(var(--a-ink) / 0.38)' }}>
          Already have an account?{' '}
          <Link to={signInHref} className="font-semibold transition-colors"
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
