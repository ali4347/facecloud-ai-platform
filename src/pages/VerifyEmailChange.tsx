import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { confirmEmailChange } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { USE_API } from '../lib/api/config'
import { messageFor } from '../lib/useApiResource'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const mutedStyle = { color: 'rgb(var(--a-ink) / 0.55)' }

type Outcome =
  | { kind: 'checking' }
  | { kind: 'confirmed'; already: boolean }
  | { kind: 'invalid'; message: string }
  | { kind: 'throttled'; message: string }
  | { kind: 'failed'; message: string }

/**
 * Landing page for the link emailed to a new address after the email was changed: /verify-email-change/:uid/:token
 *
 * Opening the link is what confirms the address, so the page asks the server once as it opens. Until then the account cannot sign in at all (the
 * change marks it unverified and signs its sessions out), so every outcome says what to do next.
 */
export default function VerifyEmailChange() {
  useDocumentTitle('Confirm your email address')
  const { uid = '', token = '' } = useParams()
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'checking' })
  const [attempt, setAttempt] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!USE_API) return
    const controller = new AbortController()
    setOutcome({ kind: 'checking' })
    confirmEmailChange(uid, token, controller.signal)
      .then(result => { if (!controller.signal.aborted) setOutcome({ kind: 'confirmed', already: result.alreadyConfirmed }) })
      .catch(caught => {
        if (controller.signal.aborted) return
        /* 400 is the link itself (no such account, or a wrong, used-up or expired token). 429 and everything else say nothing about the
           link, so they offer another try rather than calling it invalid. */
        if (caught instanceof ApiError && caught.status === 400) setOutcome({ kind: 'invalid', message: caught.message })
        else if (caught instanceof ApiError && caught.isThrottled) setOutcome({ kind: 'throttled', message: caught.message })
        else setOutcome({ kind: 'failed', message: messageFor(caught) })
      })
    return () => controller.abort()
  }, [uid, token, attempt])

  // Move the reader to the outcome, since the page changes under them when the answer arrives.
  useEffect(() => { if (outcome.kind !== 'checking') heading.current?.focus() }, [outcome.kind])

  const retry = <button type="button" className="fc-btn-primary w-full" onClick={() => setAttempt(n => n + 1)}>Try again</button>
  const title = (text: string) => <h1 ref={heading} tabIndex={-1} className="text-xl font-bold text-ink outline-none">{text}</h1>

  const body = (() => {
    if (!USE_API) return <p className="text-sm text-center" style={mutedStyle}>Confirming an email address needs the live FaceCloud backend; this demo build has none.</p>
    switch (outcome.kind) {
      case 'checking':
        return (
          <div className="text-center py-6" role="status">
            <Loader2 className="w-6 h-6 mx-auto animate-spin" style={mutedStyle} />
            <p className="text-xs mt-3" style={mutedStyle}>Confirming your email address…</p>
          </div>
        )
      case 'confirmed':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="w-10 h-10 mx-auto" style={{ color: 'var(--a-success)' }} />
            {title('Your email address is confirmed')}
            <p className="text-sm" style={mutedStyle}>
              {outcome.already ? 'This address was already confirmed, so there was nothing more to do. ' : ''}You can sign in again now.
            </p>
            <Link to="/login" className="fc-btn-primary w-full">Sign in</Link>
          </div>
        )
      case 'invalid':
        return (
          <div className="text-center space-y-4">
            <XCircle className="w-10 h-10 mx-auto" style={{ color: 'var(--a-danger)' }} />
            {title('This link is no longer valid')}
            <p className="text-sm" style={mutedStyle}>
              It may have expired, or a newer email may have replaced it. Use the latest email we sent to your new address.
              If you can sign in, you can start the change again from Settings.
            </p>
            <p role="alert" className="text-xs break-words" style={{ color: 'rgb(var(--a-ink) / 0.42)' }}>The server said: {outcome.message}</p>
            <Link to="/login" className="fc-btn-secondary w-full">Go to sign in</Link>
            <p className="text-xs" style={mutedStyle}>Cannot sign in? <Link to="/contact" className="underline font-semibold">Contact us</Link>.</p>
          </div>
        )
      case 'throttled':
        return (
          <div className="text-center space-y-4">
            <AlertTriangle className="w-10 h-10 mx-auto" style={{ color: 'var(--a-warning)' }} />
            {title('Too many tries')}
            <p role="alert" className="text-sm break-words" style={mutedStyle}>{outcome.message}</p>
            {retry}
          </div>
        )
      case 'failed':
        return (
          <div className="text-center space-y-4">
            <AlertTriangle className="w-10 h-10 mx-auto" style={{ color: 'var(--a-warning)' }} />
            {title("Couldn't confirm your email address")}
            <p role="alert" className="text-sm break-words" style={mutedStyle}>{outcome.message}</p>
            {retry}
          </div>
        )
    }
  })()

  return <AuthShell roleLabel="Confirm Email">{body}</AuthShell>
}
