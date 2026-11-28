import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, Send, XCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { GradientButton } from '../ui/GradientButton'
import { AuthedImage } from '../ui/AuthedImage'
import { AccessChip } from './StatusChips'
import { getPhotoPicture } from '../../lib/api/images'
import {
  checkDownloadEligibility, createDownloadRequest, errorCodeOf, ineligibleItemsOf,
  type ArtifactType, type DownloadRequest, type EligibilityCheck, type EligibilityItem,
} from '../../lib/api/downloads'
import { ARTIFACT_LABEL, newClientToken, requestErrorSentence } from '../../lib/downloadApproval'

export interface RequestCandidate {
  id: number
  name: string
  organizationId: number
}

interface RequestDownloadDialogProps {
  candidates: RequestCandidate[]
  /** Names for the organizations among the candidates (id → name); an unknown one is called "Organization {id}". */
  organizationNames?: Record<number, string>
  /** What to ask for. A refused original download asks for the original; the gallery asks for the enhanced photo. */
  initialArtifact?: ArtifactType
  /** Only for `edited`: the saved edit. */
  artifactId?: number
  onClose: () => void
  /** Called once a request exists (also when a retry returned the one already made). */
  onCreated?: (request: DownloadRequest) => void
}

const MESSAGE_LIMIT = 500

/**
 * "Request download access": the photos picked, what each one's state is, an optional note, and one request.
 * The backend decides eligibility; this only shows its answer and sends the eligible photos.
 */
export function RequestDownloadDialog({
  candidates, organizationNames = {}, initialArtifact = 'enhanced', artifactId, onClose, onCreated,
}: RequestDownloadDialogProps) {
  const organizations = useMemo(() => [...new Set(candidates.map(c => c.organizationId))], [candidates])
  const [organizationId, setOrganizationId] = useState(organizations[0])
  const [artifact, setArtifact] = useState<ArtifactType>(initialArtifact)
  const [message, setMessage] = useState('')
  const [check, setCheck] = useState<EligibilityCheck | null>(null)
  const [checking, setChecking] = useState(true)
  const [checkError, setCheckError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [refused, setRefused] = useState<Map<number, EligibilityItem>>(new Map())
  const [created, setCreated] = useState<{ request: DownloadRequest; replay: boolean } | null>(null)
  /* One token per selection: a retry of the same request sends it again and gets the same request back.
     Changing what is asked for (organization or file) is a different request, so it gets a new token. */
  const [clientToken, setClientToken] = useState(newClientToken)

  const shown = useMemo(() => candidates.filter(c => c.organizationId === organizationId), [candidates, organizationId])
  const requestedItems = (ids: number[]) => ids.map(id => ({ image_id: id, artifact_type: artifact, ...(artifact === 'edited' && artifactId ? { artifact_id: artifactId } : {}) }))

  useEffect(() => {
    const controller = new AbortController()
    setChecking(true); setCheckError(''); setRefused(new Map()); setSubmitError('')
    checkDownloadEligibility(organizationId, requestedItems(shown.map(c => c.id)), controller.signal)
      .then(answer => { if (!controller.signal.aborted) setCheck(answer) })
      .catch(caught => { if (!controller.signal.aborted) setCheckError(caught instanceof Error ? caught.message : 'Could not check these photos.') })
      .finally(() => { if (!controller.signal.aborted) setChecking(false) })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, artifact, shown])

  const answerFor = (id: number): EligibilityItem | undefined => refused.get(id) ?? check?.items.find(item => item.image_id === id)
  const eligibleIds = shown.filter(c => { const a = answerFor(c.id); return a?.eligible && !refused.has(c.id) }).map(c => c.id)
  const blockedByReviewer = check !== null && !check.reviewer_available
  const notRequired = check !== null && !check.approval_required
  const canSubmit = !checking && !submitting && !created && eligibleIds.length > 0 && !blockedByReviewer && !notRequired && message.length <= MESSAGE_LIMIT

  const changeScope = (next: () => void) => { next(); setClientToken(newClientToken()) }

  const submit = async () => {
    setSubmitting(true); setSubmitError('')
    try {
      const answer = await createDownloadRequest(organizationId, requestedItems(eligibleIds), clientToken, message)
      setCreated({ request: answer.request, replay: !answer.created })
      onCreated?.(answer.request)
    } catch (caught) {
      const code = errorCodeOf(caught)
      if (code === 'items_not_eligible') {
        // Nothing was saved: mark what the server refused, so the rest can be sent as a new request.
        setRefused(new Map(ineligibleItemsOf(caught).map(item => [item.image_id, { ...item, eligible: false, access_state: answerFor(item.image_id)?.access_state ?? 'not_requested' }])))
        setClientToken(newClientToken())
      }
      setSubmitError(requestErrorSentence(code, caught instanceof Error ? caught.message : 'The request could not be sent.'))
    } finally {
      setSubmitting(false)
    }
  }

  const orgName = (id: number) => organizationNames[id] ?? `Organization ${id}`

  return (
    <Modal
      title={created ? 'Request sent' : 'Request download access'}
      onClose={onClose}
      busy={submitting}
      wide
      footer={created ? (
        <>
          <GradientButton variant="secondary" size="sm" onClick={onClose}>Close</GradientButton>
          <Link to={`/dashboard/download-requests/${created.request.id}`} onClick={onClose} className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-br from-accent to-accent-soft text-white">
            View request
          </Link>
        </>
      ) : (
        <>
          <GradientButton variant="secondary" size="sm" onClick={onClose} disabled={submitting}>Cancel</GradientButton>
          <GradientButton size="sm" onClick={() => void submit()} disabled={!canSubmit} leftIcon={submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}>
            {submitting ? 'Sending…' : `Send request${eligibleIds.length ? ` for ${eligibleIds.length} photo${eligibleIds.length === 1 ? '' : 's'}` : ''}`}
          </GradientButton>
        </>
      )}
    >
      {created ? (
        <div className="space-y-2" role="status">
          <p className="flex items-start gap-2 text-ink"><CheckCircle2 className="w-4 h-4 mt-0.5 text-[#10B981] flex-shrink-0" />
            {created.replay ? 'This request had already been sent; nothing was sent twice.' : `Your request #${created.request.id} for ${created.request.counts.total} photo${created.request.counts.total === 1 ? '' : 's'} was sent to the moderators of ${created.request.organization_name}.`}
          </p>
          <p className="text-xs">You will get a notification when it is decided. Approved photos can then be downloaded from the request’s page.</p>
        </div>
      ) : (
        <>
          <p className="text-xs leading-relaxed">
            {orgName(organizationId)} requires a moderator’s approval before photos can be downloaded. Choose what you need and send one request; only the photos listed as ready are included.
          </p>

          <div className="flex flex-wrap gap-3 items-end">
            {organizations.length > 1 && (
              <label className="text-xs font-semibold text-ink space-y-1">
                <span className="block">Organization</span>
                <select value={organizationId} onChange={e => changeScope(() => setOrganizationId(Number(e.target.value)))} className="fc-input !w-auto !py-1.5" disabled={submitting}>
                  {organizations.map(id => <option key={id} value={id}>{orgName(id)} ({candidates.filter(c => c.organizationId === id).length})</option>)}
                </select>
              </label>
            )}
            {initialArtifact !== 'edited' && (
              <label className="text-xs font-semibold text-ink space-y-1">
                <span className="block">File</span>
                <select value={artifact} onChange={e => changeScope(() => setArtifact(e.target.value as ArtifactType))} className="fc-input !w-auto !py-1.5" disabled={submitting}>
                  <option value="enhanced">{ARTIFACT_LABEL.enhanced}</option>
                  <option value="original">{ARTIFACT_LABEL.original}</option>
                </select>
              </label>
            )}
          </div>
          {organizations.length > 1 && (
            <p className="text-[11px] text-ink-faint">Your selection has photos from {organizations.length} organizations. A request covers one organization; send one for each.</p>
          )}

          {blockedByReviewer && (
            <p role="alert" className="p-3 rounded-2xl text-xs border bg-[#F59E0B]/10 border-[#F59E0B]/25 text-[#F59E0B] flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{requestErrorSentence('no_eligible_reviewer', '')}
            </p>
          )}
          {notRequired && (
            <p role="status" className="p-3 rounded-2xl text-xs border bg-surface-mute border-line text-ink-soft">{requestErrorSentence('approval_not_required', '')}</p>
          )}
          {checkError && <p role="alert" className="text-xs text-error">{checkError}</p>}

          <ul className="divide-y divide-line border border-line rounded-2xl max-h-[44vh] overflow-y-auto" aria-busy={checking}>
            {shown.map(candidate => {
              const answer = answerFor(candidate.id)
              const ok = Boolean(answer?.eligible) && !refused.has(candidate.id)
              return (
                <li key={candidate.id} className={`flex items-center gap-3 p-2.5 ${ok ? '' : 'opacity-75'}`}>
                  <AuthedImage load={signal => getPhotoPicture(candidate.id, 256, signal)} cacheKey={`req-${candidate.id}`} alt={candidate.name} box={48} rounded="rounded-lg" restricted={answer ? answer.access_state !== 'granted' : false} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate" title={candidate.name}>{candidate.name}</p>
                    {checking ? <p className="text-[11px] text-ink-faint">Checking…</p>
                      : ok ? <p className="text-[11px] text-[#10B981] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Ready to request</p>
                      : <p className="text-[11px] text-ink-mute flex items-start gap-1"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-error" />{answer?.detail || 'Cannot be requested.'}</p>}
                  </div>
                  {answer && <AccessChip state={answer.access_state} />}
                </li>
              )
            })}
          </ul>

          <label className="block text-xs font-semibold text-ink space-y-1">
            <span className="block">Message to the moderator <span className="font-normal text-ink-faint">(optional)</span></span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
              maxLength={MESSAGE_LIMIT}
              rows={3}
              className="fc-input w-full resize-y"
              placeholder="For example: for the client album, due Friday."
              disabled={submitting}
            />
            <span className="block text-right text-[10px] font-normal text-ink-faint">{message.length}/{MESSAGE_LIMIT}</span>
          </label>

          {submitError && <p role="alert" className="p-3 rounded-2xl text-xs border bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]">{submitError}</p>}
        </>
      )}
    </Modal>
  )
}
