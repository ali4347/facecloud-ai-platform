import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, CheckCircle, Loader2, Mail, XCircle } from 'lucide-react'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'
import { acceptInvitation, previewInvitation, type InvitationPreview } from '../lib/api/organizations'
import { ApiError } from '../lib/api/client'
import { USE_API } from '../lib/api/config'
import { getSession } from '../lib/session'
import { forgetPersonCaches } from '../lib/personCache'
import { messageFor } from '../lib/useApiResource'
import { formatDateTime } from '../lib/utils'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const ROLE_WORD: Record<InvitationPreview['role'], string> = { owner: 'the owner', moderator: 'a moderator', member: 'a member' }

/** The acceptance refusals, said for a person rather than as status codes. */
function acceptError(caught: unknown): string {
  if (caught instanceof ApiError && caught.status === 403) return 'Sign in with the invited e-mail address to accept this invitation.'
  if (caught instanceof ApiError && caught.status === 409) return 'This invitation was already used, cancelled or has expired. Ask for a new one.'
  return messageFor(caught)
}

/**
 * The page the invitation e-mail links to. It says who is inviting and to what, then:
 *  - signed in with the invited address: accept (the membership is created only now, by this explicit step);
 *  - signed in with another address: say so, and offer to sign in with the invited one;
 *  - not signed in: sign in (and come back here) or create the account from the invitation.
 * Nothing joins an organization because an e-mail address happens to match; only accepting this link does.
 */
export default function InvitationAccept() {
  useDocumentTitle('Invitation')
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
    try {
      await acceptInvitation(token)
      // The person's organizations just changed: the menus must ask the server again rather than show the old list.
      forgetPersonCaches()
      setJoined(true)
    } catch (caught) { setJoinError(acceptError(caught)) } finally { setJoining(false) }
  }

  const sameEmail = Boolean(preview && session && session.email.toLowerCase() === preview.email.toLowerCase())
  const role = preview?.role ?? 'member'
  const asOwner = role === 'owner'
  const here = `/invitations/${encodeURIComponent(token)}`
  const signInHref = `/login?next=${encodeURIComponent(here)}`

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
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.28)' }}>
                {asOwner ? <Building2 className="w-8 h-8 text-[#FB923C]" /> : <Mail className="w-8 h-8 text-[#FB923C]" />}
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink">{asOwner ? `Become the owner of ${preview.organization_name}` : `Join ${preview.organization_name}`}</h1>
                <p className="text-xs text-ink-mute mt-2">You were invited as {ROLE_WORD[role]} with <strong className="text-ink break-all">{preview.email}</strong>.</p>
                {asOwner && (
                  <p className="text-xs text-ink-mute mt-2">
                    As the owner you manage the organization’s people, reports and subscription, and invite its moderators. Your personal photos stay private: nothing you uploaded before is moved into the organization.
                  </p>
                )}
                <p className="text-[10px] text-ink-faint mt-1">The invitation is open until {formatDateTime(preview.expires_at)}.</p>
              </div>

              {sameEmail ? (
                <>
                  <button type="button" onClick={join} disabled={joining} className="fc-btn-primary w-full justify-center py-3 text-sm font-bold disabled:opacity-60">
                    {joining ? 'Accepting…' : asOwner ? 'Accept and become the owner' : `Join ${preview.organization_name}`}
                  </button>
                  {joinError && <p role="alert" className="text-xs text-red-500">{joinError}</p>}
                </>
              ) : (
                <div className="space-y-3 text-xs text-ink-mute">
                  {session
                    ? <p>You are signed in as <strong className="text-ink break-all">{session.email}</strong>, but this invitation is for <strong className="text-ink break-all">{preview.email}</strong>. Sign in with that address to accept it.</p>
                    : <p>Already have an account with <strong className="text-ink break-all">{preview.email}</strong>? Sign in and you come back here to accept. New here? Create your account from this invitation{asOwner ? ': you become the owner as soon as it is created' : ''}.</p>}
                  <div className="flex gap-3">
                    <Link to={signInHref} className="fc-btn-primary flex-1 justify-center py-2.5 text-xs font-bold">Sign in</Link>
                    {!session && <Link to={`/register?invitation=${encodeURIComponent(token)}`} className="fc-btn-secondary flex-1 justify-center py-2.5 text-xs font-bold">Create account</Link>}
                  </div>
                </div>
              )}
            </>
          )}

          {joined && preview && (
            <>
              <CheckCircle className="w-10 h-10 mx-auto text-[#10B981]" />
              <h1 className="text-lg font-bold text-ink">{asOwner ? `You are now the owner of ${preview.organization_name}` : `You joined ${preview.organization_name}`}</h1>
              {asOwner
                ? <><p className="text-xs text-ink-mute">The organization is active. Start by inviting its moderators from My Organization.</p><Link to="/dashboard/organization" className="fc-btn-primary justify-center py-2.5 text-xs font-bold">Open My Organization</Link></>
                : role === 'moderator'
                  ? <><p className="text-xs text-ink-mute">As a moderator, sign in on the moderator page to review the team's photos.</p><Link to="/moderator/login" className="fc-btn-primary justify-center py-2.5 text-xs font-bold">Moderator sign-in</Link></>
                  : <><p className="text-xs text-ink-mute">When you upload photos you can now choose to submit them to this team. Your personal photos stay private.</p><Link to="/dashboard" className="fc-btn-primary justify-center py-2.5 text-xs font-bold">Go to my dashboard</Link></>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
