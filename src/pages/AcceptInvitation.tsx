import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Loader2, Lock, User, XCircle } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { PasswordInput } from '../components/ui/PasswordInput'
import {
  acceptAccountInvitation, inspectAccountInvitation, invitationFieldErrors,
  type AccountInvitationPreview, type InvitationFieldErrors,
} from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { USE_API } from '../lib/api/config'
import type { Role } from '../data/mock'
import { messageFor } from '../lib/useApiResource'
import { formatDateTime } from '../lib/utils'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const labelStyle = { color: 'rgb(var(--a-ink) / 0.42)' }
const mutedStyle = { color: 'rgb(var(--a-ink) / 0.55)' }
const dangerStyle = { color: 'var(--a-danger)' }
const iconStyle = { color: 'rgb(var(--a-ink) / 0.35)' }
const leadingIcon = (Icon: typeof Lock) => <Icon className="absolute left-4 top-3.5 w-4 h-4 pointer-events-none z-10" style={iconStyle} />

/** Each account type signs in on its own page; tokens are kept per portal, so this page never signs anyone in itself. */
const SIGN_IN: Record<Role, { to: string; label: string }> = {
  user: { to: '/login', label: 'Go to sign in' },
  moderator: { to: '/moderator/login', label: 'Go to moderator sign in' },
  admin: { to: '/admin/login', label: 'Go to administrator sign in' },
}
const signInFor = (role: string) => SIGN_IN[role as Role] ?? SIGN_IN.user

/** The role in words; one this app does not know is shown as the server wrote it. */
function roleWords(invitation: AccountInvitationPreview): string {
  if (invitation.role === 'moderator') return invitation.organization_name ? `Moderator for ${invitation.organization_name}` : 'Moderator'
  if (invitation.role === 'admin') return 'Administrator'
  if (invitation.role === 'user') return 'User'
  return String(invitation.role)
}

type Check =
  | { kind: 'checking' }
  | { kind: 'invalid'; message: string }
  | { kind: 'failed'; message: string }
  | { kind: 'ready'; invitation: AccountInvitationPreview }

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 mb-5 rounded-2xl text-sm break-words" role="alert"
      style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', ...dangerStyle }}>
      {children}
    </div>
  )
}

/** After a refusal, put the cursor in the first field the server complained about. */
const focusField = (id: string) => document.getElementById(id)?.focus()

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="text-xs whitespace-pre-line break-words" style={dangerStyle}>{message}</p> : null
}

/**
 * The page the emailed account invitation links to: /accept-invitation?token=…
 *
 * An administrator invites someone by email; they open the link here, see what the invitation is for, and choose their
 * own username and password. This is not the team invitation at /invitations/:token, which joins an organization.
 */
export default function AcceptInvitation() {
  useDocumentTitle('Create your account')
  const [searchParams, setSearchParams] = useSearchParams()
  /* The link carries a secret that can create an administrator account. It is read once and then removed from the
     address bar, so it does not linger in the browser history (the email-verification page does the same). */
  const [token] = useState(() => searchParams.get('token')?.trim() ?? '')
  useEffect(() => {
    if (searchParams.has('token')) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const [check, setCheck] = useState<Check>({ kind: 'checking' })
  const [attempt, setAttempt] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<InvitationFieldErrors>({})
  const [mismatch, setMismatch] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [created, setCreated] = useState<{ username: string; email: string; dashboard: Role } | null>(null)
  const createdHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!USE_API || !token) return
    const controller = new AbortController()
    setCheck({ kind: 'checking' })
    inspectAccountInvitation(token, controller.signal)
      .then(invitation => { if (!controller.signal.aborted) setCheck({ kind: 'ready', invitation }) })
      .catch(caught => {
        if (controller.signal.aborted) return
        /* Only a 404 means the invitation itself is no good. A throttle, a network error or a server error says nothing
           about it, so those offer another try instead of telling the person to ask for a new link. */
        setCheck(caught instanceof ApiError && caught.isNotFound
          ? { kind: 'invalid', message: caught.message }
          : { kind: 'failed', message: messageFor(caught) })
      })
    return () => controller.abort()
  }, [token, attempt])

  useEffect(() => { if (created) createdHeading.current?.focus() }, [created])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (check.kind !== 'ready' || submitting) return
    setFieldErrors({}); setConflict(false)
    if (password !== confirm) { setMismatch(true); focusField('accept-confirm'); return }
    setMismatch(false)
    setSubmitting(true)
    try {
      const accepted = await acceptAccountInvitation({ token, username: username.trim(), password })
      setCreated({ username: accepted.user.username || username.trim(), email: check.invitation.email, dashboard: accepted.dashboard })
    } catch (caught) {
      const errors = invitationFieldErrors(caught)
      if (errors.token) {
        // Used, cancelled or expired since the page opened: the form can no longer work.
        setCheck({ kind: 'invalid', message: errors.token })
      } else {
        setFieldErrors(errors)
        setConflict(caught instanceof ApiError && caught.status === 409)
        if (errors.username) focusField('accept-username')
        else if (errors.password) focusField('accept-password')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const noLink = (
    <div className="text-center space-y-4">
      <XCircle className="w-10 h-10 mx-auto" style={dangerStyle} />
      <h1 className="text-xl font-bold text-ink">This link is incomplete</h1>
      <p className="text-sm" style={mutedStyle}>
        The invitation code is missing from the address. Open the link in your invitation email again, or ask the person who invited you to send a new one.
      </p>
      <Link to="/login" className="fc-btn-secondary w-full">Go to sign in</Link>
    </div>
  )

  const body = (() => {
    if (!USE_API) {
      return <p className="text-sm text-center" style={mutedStyle}>Invitations need the live FaceCloud backend; this demo build has none.</p>
    }
    if (!token) return noLink

    if (created) {
      const signIn = signInFor(created.dashboard)
      return (
        <div className="text-center space-y-4">
          <CheckCircle className="w-10 h-10 mx-auto" style={{ color: 'var(--a-success)' }} />
          <h1 ref={createdHeading} tabIndex={-1} className="text-xl font-bold text-ink outline-none">Account created</h1>
          <p className="text-sm break-words" style={mutedStyle}>
            Your account <strong className="text-ink">{created.username}</strong> is ready. Sign in with <strong className="text-ink break-all">{created.email}</strong> and the password you just chose.
          </p>
          <Link to={signIn.to} className="fc-btn-primary w-full">{signIn.label}</Link>
        </div>
      )
    }

    if (check.kind === 'checking') {
      return (
        <div className="text-center py-6" role="status">
          <Loader2 className="w-6 h-6 mx-auto animate-spin" style={mutedStyle} />
          <p className="text-xs mt-3" style={mutedStyle}>Checking your invitation…</p>
        </div>
      )
    }

    if (check.kind === 'invalid') {
      return (
        <div className="text-center space-y-4">
          <XCircle className="w-10 h-10 mx-auto" style={dangerStyle} />
          <h1 className="text-xl font-bold text-ink">This invitation can't be used</h1>
          <p role="alert" className="text-sm font-semibold text-ink break-words">{check.message}</p>
          <p className="text-sm" style={mutedStyle}>Ask the person who invited you to send a new link. If you already created your account, sign in instead.</p>
          <Link to="/login" className="fc-btn-secondary w-full">Go to sign in</Link>
        </div>
      )
    }

    if (check.kind === 'failed') {
      return (
        <div className="text-center space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto" style={{ color: 'var(--a-warning)' }} />
          <h1 className="text-xl font-bold text-ink">Couldn't check your invitation</h1>
          <p role="alert" className="text-sm break-words" style={mutedStyle}>{check.message}</p>
          <button type="button" className="fc-btn-primary w-full" onClick={() => setAttempt(n => n + 1)}>Try again</button>
        </div>
      )
    }

    const { invitation } = check
    const signIn = signInFor(invitation.role)
    return (
      <>
        <h1 className="text-xl font-bold text-ink mb-1">Create your account</h1>
        <p className="text-sm mb-5" style={{ color: 'rgb(var(--a-ink) / 0.48)' }}>
          You were invited to FaceCloud. Choose a username and password to finish.
        </p>

        <dl className="mb-5 p-4 rounded-2xl space-y-3 text-sm" style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.22)' }}>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Email</dt>
            <dd className="text-ink font-semibold break-all">{invitation.email}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Account type</dt>
            <dd className="text-ink font-semibold break-words">{roleWords(invitation)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Link valid until</dt>
            <dd className="text-ink">{formatDateTime(invitation.expires_at)}</dd>
          </div>
        </dl>

        {fieldErrors.other && (
          <Notice>
            {fieldErrors.other}
            {conflict && <> <Link to={signIn.to} className="underline font-semibold">Sign in instead</Link></>}
          </Notice>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="accept-username" className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Username</label>
            <div className="relative">
              {leadingIcon(User)}
              <input id="accept-username" className="fc-input !pl-11" value={username}
                onChange={e => { setUsername(e.target.value); setFieldErrors(f => ({ ...f, username: undefined })) }}
                autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={150} required
                aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'accept-username-error' : undefined} />
            </div>
            <FieldError id="accept-username-error" message={fieldErrors.username} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="accept-password" className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Password</label>
            <PasswordInput id="accept-password" leading={leadingIcon(Lock)} value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })) }}
              className="fc-input !pl-11" autoComplete="new-password" required
              aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'accept-password-error' : undefined} />
            <FieldError id="accept-password-error" message={fieldErrors.password} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="accept-confirm" className="text-[10px] font-bold uppercase tracking-widest" style={labelStyle}>Confirm password</label>
            <PasswordInput id="accept-confirm" leading={leadingIcon(Lock)} value={confirm}
              onChange={e => { setConfirm(e.target.value); setMismatch(false) }}
              className="fc-input !pl-11" autoComplete="new-password" required
              aria-invalid={mismatch} aria-describedby={mismatch ? 'accept-confirm-error' : undefined} />
            <FieldError id="accept-confirm-error" message={mismatch ? 'The two passwords do not match.' : undefined} />
          </div>

          <button type="submit" className="fc-btn-primary w-full mt-2" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </>
    )
  })()

  return <AuthShell roleLabel="Create Account">{body}</AuthShell>
}
