import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Loader2, Mail, XCircle } from 'lucide-react'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'
import { acceptInvitation, previewInvitation, type InvitationPreview } from '../lib/api/organizations'
import { USE_API } from '../lib/api/config'
import { getSession } from '../lib/session'
import { messageFor } from '../lib/useApiResource'
import { formatDateTime } from '../lib/utils'

/** The page the invitation email links to: who is inviting, then join once signed in with the invited email. */
export default function InvitationAccept() {
  const { token = '' } = useParams<{ token: string }>()
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [loading, setLoading] = useState(USE_API)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const session = getSession()

  useEffect(() => {
    if (!USE_API) return
    const controller = new AbortController()
    setLoading(true)
    previewInvitation(token, controller.signal)
      .then(p => { if (!controller.signal.aborted) setPreview(p) })
      .catch(e => { if (!controller.signal.aborted) setProblem(messageFor(e)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token])

  const join = async () => {
    setJoining(true); setJoinError(null)
    try { await acceptInvitation(token); setJoined(true) } catch (caught) { setJoinError(messageFor(caught)) } finally { setJoining(false) }
  }

  const sameEmail = Boolean(preview && session && session.email.toLowerCase() === preview.email.toLowerCase())
  const asModerator = preview?.role === 'moderator'

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6" style={{ background: 'rgb(var(--a-surface-soft))' }}>
      <div className="w-full max-w-md relative z-10 space-y-5">
        <div className="text-center"><FaceCloudLogo variant="full" size="lg" roleLabel="Invitation" href="/" priority={true} className="mx-auto" tone="app" /></div>
        <div className="fc-panel-strong p-8 text-center space-y-5">
          {!USE_API && <p className="text-sm text-ink-mute">Invitations need the live FaceCloud backend; this demo build has none.</p>}
          {USE_API && loading && <div className="py-6"><Loader2 className="w-6 h-6 mx-auto animate-spin text-ink-faint" /><p className="text-xs text-ink-faint mt-3">Checking the invitation…</p></div>}

          {problem && (
            <>
              <XCircle className="w-10 h-10 mx-auto text-[#EF4444]" />
              <p role="alert" className="text-sm font-semibold text-ink">{problem}</p>
              <p className="text-xs text-ink-mute">Ask whoever invited you to send a new invitation.</p>
              <Link to="/" className="text-xs font-bold text-[#FB923C] hover:underline">Go to the home page</Link>
            </>
          )}

          {preview && !joined && (
            <>
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.28)' }}><Mail className="w-8 h-8 text-[#FB923C]" /></div>
              <div>
                <h1 className="text-lg font-bold text-ink">Join {preview.organization_name}</h1>
                <p className="text-xs text-ink-mute mt-2">You were invited as a {asModerator ? 'moderator' : 'member'} with <strong className="text-ink">{preview.email}</strong>.</p>
                <p className="text-[10px] text-ink-faint mt-1">The invitation is open until {formatDateTime(preview.expires_at)}.</p>
              </div>

              {sameEmail ? (
                <>
                  <button type="button" onClick={join} disabled={joining} className="fc-btn-primary w-full justify-center py-3 text-sm font-bold disabled:opacity-60">{joining ? 'Joining…' : `Join ${preview.organization_name}`}</button>
                  {joinError && <p role="alert" className="text-xs text-red-500">{joinError}</p>}
                </>
              ) : (
                <div className="space-y-3 text-xs text-ink-mute">
                  {session
                    ? <p>You are signed in as <strong className="text-ink">{session.email}</strong>, but this invitation is for <strong className="text-ink">{preview.email}</strong>. Sign in with that address to join.</p>
                    : <p>Sign in, or create an account, with <strong className="text-ink">{preview.email}</strong>. Then open this invitation link again to join.</p>}
                  <div className="flex gap-3">
                    <Link to="/login" className="fc-btn-primary flex-1 justify-center py-2.5 text-xs font-bold">Sign in</Link>
                    <Link to="/register" className="fc-btn-secondary flex-1 justify-center py-2.5 text-xs font-bold">Create account</Link>
                  </div>
                </div>
              )}
            </>
          )}

          {joined && preview && (
            <>
              <CheckCircle className="w-10 h-10 mx-auto text-[#10B981]" />
              <h1 className="text-lg font-bold text-ink">You joined {preview.organization_name}</h1>
              {asModerator
                ? <><p className="text-xs text-ink-mute">As a moderator, sign in on the moderator page to review the team's photos.</p><Link to="/moderator/login" className="fc-btn-primary justify-center py-2.5 text-xs font-bold">Moderator sign-in</Link></>
                : <><p className="text-xs text-ink-mute">When you upload photos you can now choose to submit them to this team.</p><Link to="/dashboard" className="fc-btn-primary justify-center py-2.5 text-xs font-bold">Go to my dashboard</Link></>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
