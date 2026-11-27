import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, FileDown, Loader2, Maximize2, RefreshCw, ShieldOff, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { GradientButton } from '../../components/ui/GradientButton'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { Modal } from '../../components/ui/Modal'
import { ItemStatusBadge, RequestStatusBadge } from '../../components/downloads/StatusChips'
import {
  decideDownloadRequest, getModeratorImagePreview, getOrgDownloadRequest, listOrgImages, revokeDownloadGrant, type OrgImageRow,
} from '../../lib/api/moderatorConsole'
import { errorCodeOf, type DownloadRequest, type DownloadRequestItem } from '../../lib/api/downloads'
import { ApiError } from '../../lib/api/client'
import {
  ARTIFACT_LABEL, DENIAL_REASONS, GRANT_STATE_LABEL, OPEN_STATUSES, buildDecision, countsLine, denialLabel, grantState, planDecision,
  requestErrorSentence, type DecisionAction, type ReasonInput,
} from '../../lib/downloadApproval'
import { chooseModeratorOrganization, useModeratorOrganization } from '../../lib/moderationData'
import { useCurrentUserId } from '../../lib/useCurrentUserId'
import { formatDateTime } from '../../lib/utils'

const ACTION_LABEL: Record<DecisionAction, string> = {
  approve_all: 'Approve all', approve_selected: 'Approve selected', deny_selected: 'Deny selected', deny_all: 'Deny all',
}

/** The variant the moderator preview route has for what was requested (a saved edit is shown as its enhanced photo). */
const previewVariant = (item: DownloadRequestItem) => (item.artifact_type === 'original' ? 'original' : 'enhanced')

function ReasonFields({ value, onChange, idPrefix, compact = false }: { value: ReasonInput; onChange: (next: ReasonInput) => void; idPrefix: string; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-[minmax(0,14rem)_1fr]'}`}>
      <label className="text-xs font-semibold text-ink space-y-1" htmlFor={`${idPrefix}-code`}>
        <span className="block">Reason</span>
        <select id={`${idPrefix}-code`} value={value.code} onChange={e => onChange({ ...value, code: e.target.value })} className="fc-input w-full !py-1.5">
          <option value="">Choose a reason…</option>
          {DENIAL_REASONS.map(reason => <option key={reason.code} value={reason.code}>{reason.label}{reason.code === 'other' ? ' (explain)' : ''}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-ink space-y-1" htmlFor={`${idPrefix}-text`}>
        <span className="block">Explanation {value.code === 'other' ? <span className="text-error">(required)</span> : <span className="font-normal text-ink-faint">(optional, the member sees it)</span>}</span>
        <input id={`${idPrefix}-text`} value={value.text} maxLength={500} onChange={e => onChange({ ...value, text: e.target.value })} className="fc-input w-full !py-1.5" />
      </label>
    </div>
  )
}

function DownloadRequestReviewLive() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const requestId = Number(id)
  const { organizationId: workingId, teams, resolving } = useModeratorOrganization()
  const askedOrg = Number(params.get('organization'))
  const known = Number.isInteger(askedOrg) && teams.some(team => team.id === askedOrg)
  const orgId = known ? askedOrg : workingId

  // A link from a notification names the organization; switch the panel to it so the rest of the panel matches.
  useEffect(() => { if (known && askedOrg !== workingId) chooseModeratorOrganization(askedOrg) }, [known, askedOrg, workingId])

  const [data, setData] = useState<DownloadRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<{ status: number; text: string } | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const reload = () => setReloadToken(n => n + 1)

  useEffect(() => {
    if (resolving || orgId === null || !Number.isInteger(requestId)) return
    const controller = new AbortController()
    setLoading(true)
    getOrgDownloadRequest(orgId, requestId, controller.signal)
      .then(answer => { if (!controller.signal.aborted) { setData(answer); setLoadError(null) } })
      .catch(caught => { if (!controller.signal.aborted) setLoadError({ status: caught instanceof ApiError ? caught.status : 0, text: caught instanceof Error ? caught.message : 'Could not load the request.' }) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [orgId, requestId, resolving, reloadToken])

  // The quality verdict and score of each photo, from the organization's accepted photos (requested photos are always accepted ones).
  const [quality, setQuality] = useState<Map<number, OrgImageRow>>(new Map())
  useEffect(() => {
    if (orgId === null) return
    const controller = new AbortController()
    listOrgImages(orgId, 'accepted', '', controller.signal)
      .then(rows => { if (!controller.signal.aborted) setQuality(new Map(rows.map(row => [row.id, row]))) })
      .catch(() => { /* the decision does not depend on it */ })
    return () => controller.abort()
  }, [orgId])

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [reason, setReason] = useState<ReasonInput>({ code: '', text: '' })
  const [overrides, setOverrides] = useState<Record<number, ReasonInput>>({})
  const [overrideOpen, setOverrideOpen] = useState<Set<number>>(new Set())
  const [pendingAction, setPendingAction] = useState<DecisionAction | null>(null)
  const [deciding, setDeciding] = useState(false)
  const [decideError, setDecideError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [preview, setPreview] = useState<DownloadRequestItem | null>(null)
  const [revoking, setRevoking] = useState<DownloadRequestItem | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeBusy, setRevokeBusy] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  // A new copy of the request (after a decision or a reload) starts the selection afresh.
  useEffect(() => { setSelected(new Set()); setOverrides({}); setOverrideOpen(new Set()) }, [data?.version, data?.id])

  const items = useMemo(() => data?.items ?? [], [data])
  const pendingIds = items.filter(item => item.status === 'pending').map(item => item.id)
  /* One's own request is recognised by user id (GET /api/user/profile/), not by e-mail. The controls wait until that answer is in;
     if the id cannot be had they are shown, because the server is the final authority and refuses a self-decision
     (403 cannot_decide_own_request, explained when it happens). */
  const me = useCurrentUserId()
  const isOwn = Boolean(data && me.id !== null && data.requester.id === me.id)
  const identityKnown = me.settled
  const open = Boolean(data && OPEN_STATUSES.includes(data.status))
  const canDecide = open && identityKnown && !isOwn && pendingIds.length > 0

  const toggle = (itemId: number) => setSelected(current => { const next = new Set(current); if (next.has(itemId)) next.delete(itemId); else next.add(itemId); return next })
  const plan = pendingAction ? planDecision(pendingAction, pendingIds, [...selected]) : null
  const built = pendingAction && data ? buildDecision(pendingAction, pendingIds, [...selected], reason, overrides, data.version) : null

  const decide = async () => {
    if (!data || orgId === null || !built || 'error' in built) return
    setDeciding(true); setDecideError(null)
    try {
      const answer = await decideDownloadRequest(orgId, data.id, built.body)
      setData(answer)
      setPendingAction(null)
      setReason({ code: '', text: '' })
      setNotice({ kind: 'ok', text: `Decision saved. ${countsLine(answer)}.` })
    } catch (caught) {
      const code = errorCodeOf(caught)
      const sentence = requestErrorSentence(code, caught instanceof Error ? caught.message : 'The decision could not be saved.')
      if (code === 'request_closed' || code === 'item_already_decided' || code === 'request_changed') {
        // Someone else changed it: show the latest state and let the moderator decide again from there.
        setPendingAction(null)
        setNotice({ kind: 'error', text: sentence })
        reload()
      } else if (caught instanceof ApiError && caught.status === 404) {
        setPendingAction(null)
        setNotice({ kind: 'error', text: 'This request is not visible to you any more (the member may have left your scope).' })
        reload()
      } else {
        setDecideError(sentence)
      }
    } finally {
      setDeciding(false)
    }
  }

  const revoke = async () => {
    if (!revoking?.grant || orgId === null) return
    setRevokeBusy(true); setRevokeError(null)
    try {
      await revokeDownloadGrant(orgId, revoking.grant.id, revokeReason)
      setRevoking(null); setRevokeReason('')
      setNotice({ kind: 'ok', text: `The approval for ${revoking.image_name} was withdrawn.` })
      reload()
    } catch (caught) {
      setRevokeError(caught instanceof Error ? caught.message : 'The approval could not be withdrawn.')
    } finally {
      setRevokeBusy(false)
    }
  }

  const back = <Link to="/moderator/download-requests" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline mb-4"><ArrowLeft className="w-3.5 h-3.5" />All download requests</Link>

  if (!Number.isInteger(requestId) || (loadError && !loading)) {
    const hidden = !Number.isInteger(requestId) || loadError?.status === 404
    return (
      <div className="page-enter">
        {back}
        <div className="fc-card py-14 text-center" role="alert">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-error" />
          <p className="text-sm font-semibold text-ink">{hidden ? 'This request does not exist or is not one you may review.' : loadError?.text}</p>
          {hidden && <p className="text-xs text-ink-mute mt-1">A moderator sees only the requests of the members they look after.</p>}
          {!hidden && <button type="button" onClick={reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button>}
        </div>
      </div>
    )
  }

  if (loading && !data) {
    return <p className="py-20 text-center text-xs text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading the request…</p>
  }
  if (!data || orgId === null) return null

  const denies = plan ? plan.deny.length > 0 : false
  return (
    <div className="page-enter">
      {back}
      <PageHeader title={`Download request #${data.id}`} subtitle={`${data.requester.username} · ${countsLine(data)}`} action={<RequestStatusBadge status={data.status} />} />

      <dl className="fc-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5">
        <div><dt className="text-ink-faint">Requested by</dt><dd className="font-semibold text-ink break-words">{data.requester.username}<span className="block font-normal text-ink-mute">{data.requester.email}</span></dd></div>
        <div><dt className="text-ink-faint">Sent</dt><dd className="font-semibold text-ink">{formatDateTime(data.created_at)}</dd></div>
        <div><dt className="text-ink-faint">Photos</dt><dd className="font-semibold text-ink">{data.counts.total}</dd></div>
        <div><dt className="text-ink-faint">Decided</dt><dd className="font-semibold text-ink">{data.decided_at ? formatDateTime(data.decided_at) : 'Not yet'}</dd></div>
        <div className="col-span-2 sm:col-span-4"><dt className="text-ink-faint">Message</dt><dd className="text-ink whitespace-pre-wrap break-words">{data.requester_message || <span className="text-ink-faint">No message.</span>}</dd></div>
      </dl>

      {isOwn && open && (
        <p role="status" className="p-3 mb-4 rounded-2xl text-xs border bg-surface-mute border-line text-ink-soft">{requestErrorSentence('cannot_decide_own_request', '')}</p>
      )}
      {notice && (
        <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`p-3 mb-4 rounded-2xl text-xs border flex items-start justify-between gap-3 ${notice.kind === 'ok' ? 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]' : 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]'}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {canDecide && (
        <div className="fc-card p-4 mb-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink">{selected.size} of {pendingIds.length} undecided selected</span>
            {selected.size < pendingIds.length
              ? <button type="button" className="text-xs font-semibold text-accent hover:underline cursor-pointer" onClick={() => setSelected(new Set(pendingIds))}>Select all</button>
              : <button type="button" className="text-xs font-semibold text-ink-mute hover:text-ink cursor-pointer" onClick={() => setSelected(new Set())}>Clear</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" leftIcon={<Check className="w-3.5 h-3.5" />} onClick={() => { setDecideError(null); setPendingAction('approve_all') }}>Approve all</GradientButton>
            <GradientButton size="sm" variant="secondary" disabled={selected.size === 0} onClick={() => { setDecideError(null); setPendingAction('approve_selected') }}>Approve selected</GradientButton>
            <GradientButton size="sm" variant="secondary" disabled={selected.size === 0} onClick={() => { setDecideError(null); setPendingAction('deny_selected') }}>Deny selected</GradientButton>
            <GradientButton size="sm" variant="danger" onClick={() => { setDecideError(null); setPendingAction('deny_all') }}>Deny all</GradientButton>
          </div>
          <p className="text-[11px] text-ink-faint">“Approve selected” denies the other undecided photos with the reason you give; “Deny selected” leaves the others to decide later. Each approval lasts the organization’s set number of hours.</p>
        </div>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map(item => {
          const pending = item.status === 'pending'
          const state = item.grant ? grantState(item.grant) : null
          const score = quality.get(item.image_id)?.overall_score
          return (
            <li key={item.id} className={`fc-card overflow-hidden ${selected.has(item.id) ? 'ring-2 ring-accent' : ''}`}>
              <div className="relative h-44 bg-surface-mute">
                <AuthedImage
                  load={signal => getModeratorImagePreview(orgId, item.image_id, previewVariant(item), 256, signal)}
                  cacheKey={`mdr-${orgId}-${item.image_id}-${previewVariant(item)}`}
                  alt={item.image_name}
                  className="w-full h-full !border-0"
                  rounded="rounded-none"
                />
                {canDecide && pending && (
                  <label className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-surface/90 border border-line flex items-center justify-center cursor-pointer">
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} className="w-4 h-4 accent-[#F97316] cursor-pointer" aria-label={`Select ${item.image_name}`} />
                  </label>
                )}
                <button type="button" onClick={() => setPreview(item)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface/90 border border-line cursor-pointer" aria-label={`Larger preview of ${item.image_name}`}>
                  <Maximize2 className="w-3.5 h-3.5 text-ink" />
                </button>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink truncate" title={item.image_name}>{item.image_name}</p>
                  <ItemStatusBadge status={item.status} />
                </div>
                <p className="text-[11px] text-ink-faint">{ARTIFACT_LABEL[item.artifact_type]}{typeof score === 'number' ? ` · quality ${Math.round(score)}/100` : ''}{quality.get(item.image_id) ? ' · accepted' : ''}</p>
                {item.status === 'denied' && <p className="text-xs text-ink-mute"><span className="font-semibold text-error">{denialLabel(item.denial_reason_code)}</span>{item.denial_reason_text ? `: ${item.denial_reason_text}` : ''}</p>}
                {item.grant && state && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-mute">
                    <span>{GRANT_STATE_LABEL[state]}{state === 'active' ? ` until ${formatDateTime(item.grant.expires_at)}` : ''}</span>
                    {state === 'active' && !isOwn && (
                      <button type="button" onClick={() => { setRevokeError(null); setRevoking(item) }} className="inline-flex items-center gap-1 text-xs font-bold text-error hover:underline cursor-pointer">
                        <ShieldOff className="w-3.5 h-3.5" />Withdraw approval
                      </button>
                    )}
                  </div>
                )}
                {canDecide && pending && (
                  overrideOpen.has(item.id) ? (
                    <div className="pt-1 space-y-1">
                      <ReasonFields compact idPrefix={`r-${item.id}`} value={overrides[item.id] ?? { code: '', text: '' }} onChange={next => setOverrides(current => ({ ...current, [item.id]: next }))} />
                      <button type="button" className="text-[11px] font-semibold text-ink-mute hover:text-ink cursor-pointer" onClick={() => { setOverrideOpen(c => { const n = new Set(c); n.delete(item.id); return n }); setOverrides(c => { const n = { ...c }; delete n[item.id]; return n }) }}>Use the general reason</button>
                    </div>
                  ) : (
                    <button type="button" className="text-[11px] font-semibold text-accent hover:underline cursor-pointer" onClick={() => setOverrideOpen(c => new Set(c).add(item.id))}>Own reason if denied</button>
                  )
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {pendingAction && plan && (
        <ConfirmDialog
          title={`${ACTION_LABEL[pendingAction]}?`}
          confirmLabel={ACTION_LABEL[pendingAction]}
          busyLabel="Saving…"
          busy={deciding}
          danger={plan.approve.length === 0}
          error={decideError ?? (built && 'error' in built && (reason.code || !denies) ? built.error : null)}
          confirmDisabled={!built || 'error' in built}
          onConfirm={() => void decide()}
          onCancel={() => setPendingAction(null)}
        >
          <div className="space-y-3 text-left">
            <p>
              {plan.approve.length > 0 && <>Approve <strong>{plan.approve.length}</strong> photo{plan.approve.length === 1 ? '' : 's'}. </>}
              {plan.deny.length > 0 && <>Deny <strong>{plan.deny.length}</strong> photo{plan.deny.length === 1 ? '' : 's'}. </>}
              {plan.untouched.length > 0 && <>{plan.untouched.length} stay{plan.untouched.length === 1 ? 's' : ''} undecided. </>}
              {data.requester.username} is told when every photo is decided. A decision cannot be undone, but an approval can be withdrawn later.
            </p>
            {denies && <ReasonFields idPrefix="general" value={reason} onChange={setReason} />}
          </div>
        </ConfirmDialog>
      )}

      {revoking && (
        <ConfirmDialog
          title="Withdraw this approval?"
          confirmLabel="Withdraw approval"
          busyLabel="Withdrawing…"
          busy={revokeBusy}
          error={revokeError}
          danger
          onConfirm={() => void revoke()}
          onCancel={() => setRevoking(null)}
        >
          <div className="space-y-2 text-left">
            <p>{revoking.image_name} can no longer be downloaded with this approval. A copy already downloaded cannot be recalled.</p>
            <label className="block text-xs font-semibold text-ink space-y-1">
              <span className="block">Reason <span className="font-normal text-ink-faint">(optional)</span></span>
              <input value={revokeReason} maxLength={500} onChange={e => setRevokeReason(e.target.value)} className="fc-input w-full !py-1.5" />
            </label>
          </div>
        </ConfirmDialog>
      )}

      {preview && (
        <Modal title={preview.image_name} onClose={() => setPreview(null)} huge>
          <AuthedImage
            load={signal => getModeratorImagePreview(orgId, preview.image_id, previewVariant(preview), 1024, signal)}
            cacheKey={`mdr-large-${orgId}-${preview.image_id}-${previewVariant(preview)}`}
            alt={preview.image_name}
            className="w-full max-h-[70vh] !object-contain"
          />
          <p className="text-xs">{ARTIFACT_LABEL[preview.artifact_type]} · a preview of at most 1024 px; the file itself is never shown here.</p>
        </Modal>
      )}
    </div>
  )
}

export default function DownloadRequestReview() {
  return <NeedsApi title="Download request" icon={FileDown}><DownloadRequestReviewLive /></NeedsApi>
}
