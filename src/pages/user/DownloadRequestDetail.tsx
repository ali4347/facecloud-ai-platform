import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Download, FileArchive, FileDown, Loader2, RefreshCw, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { GradientButton } from '../../components/ui/GradientButton'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ItemStatusBadge, RequestStatusBadge } from '../../components/downloads/StatusChips'
import {
  cancelDownloadRequest, downloadRequestItemFile, downloadRequestZip, errorCodeOf, getMyDownloadRequest,
  type DownloadRequest, type DownloadRequestItem,
} from '../../lib/api/downloads'
import { ApiError, approvalRefusalOf } from '../../lib/api/client'
import { getPhotoPicture } from '../../lib/api/images'
import {
  ARTIFACT_LABEL, GRANT_STATE_LABEL, TONE, countsLine, denialLabel, downloadable, grantState, refusalSentence, requestErrorSentence, type GrantState,
} from '../../lib/downloadApproval'
import { useApiResource } from '../../lib/useApiResource'
import { saveBlob } from '../../lib/saveBlob'
import { formatDateTime } from '../../lib/utils'

const GRANT_TONE: Record<GrantState, string> = { active: TONE.ok, expired: TONE.neutral, revoked: TONE.bad, used_up: TONE.neutral }

function ItemRow({ item, checked, onToggle }: { item: DownloadRequestItem; checked: boolean; onToggle: () => void }) {
  const state = item.grant ? grantState(item.grant) : null
  const canDownload = downloadable(item)
  return (
    <li className="flex items-start gap-3 p-3">
      <input
        type="checkbox"
        className="mt-4 w-4 h-4 accent-[#F97316] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        checked={checked}
        disabled={!canDownload}
        onChange={onToggle}
        aria-label={`Select ${item.image_name} for download`}
      />
      <AuthedImage
        load={signal => getPhotoPicture(item.image_id, 256, signal)}
        cacheKey={`dlr-${item.id}-${state ?? item.status}`}
        alt={item.image_name}
        box={56}
        rounded="rounded-lg"
        restricted={!canDownload}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-ink truncate" title={item.image_name}>{item.image_name}</p>
        <p className="text-[11px] text-ink-faint">{ARTIFACT_LABEL[item.artifact_type] ?? item.artifact_type}{item.reviewed_at ? ` · decided ${formatDateTime(item.reviewed_at)}` : ''}</p>
        {item.status === 'denied' && (
          <p className="text-xs text-ink-mute"><span className="font-semibold text-error">{denialLabel(item.denial_reason_code)}</span>{item.denial_reason_text ? `: ${item.denial_reason_text}` : ''}</p>
        )}
        {item.grant && state && (
          <p className="text-xs text-ink-mute flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${GRANT_TONE[state]}`}>{GRANT_STATE_LABEL[state]}</span>
            {state === 'active' && <span>until {formatDateTime(item.grant.expires_at)}</span>}
            {state === 'expired' && <span>ended {formatDateTime(item.grant.expires_at)}</span>}
            {state === 'revoked' && item.grant.revoke_reason && <span>{item.grant.revoke_reason}</span>}
            {item.grant.max_uses > 0 && <span>· {item.grant.use_count} of {item.grant.max_uses} downloads used</span>}
          </p>
        )}
      </div>
      <ItemStatusBadge status={item.status} />
    </li>
  )
}

function DownloadRequestDetailLive() {
  const { id } = useParams()
  const requestId = Number(id)
  const valid = Number.isInteger(requestId) && requestId > 0
  const { data, loading, error, reload } = useApiResource<DownloadRequest | null>(
    signal => getMyDownloadRequest(requestId, signal), () => null, [requestId], { skip: !valid },
  )
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState<'' | 'selected' | 'zip' | 'cancel'>('')
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const items = useMemo(() => data?.items ?? [], [data])
  const ready = items.filter(item => downloadable(item))
  const toggle = (itemId: number) => setSelected(current => { const next = new Set(current); if (next.has(itemId)) next.delete(itemId); else next.add(itemId); return next })

  /* A refusal here means the approval changed after the page loaded (expired, withdrawn, used up): say which and show the new state. */
  const explain = (caught: unknown, fallback: string) => {
    const refusal = caught instanceof ApiError ? approvalRefusalOf(caught.body) : null
    setNotice({ kind: 'error', text: refusal ? refusalSentence(refusal.reason, refusal.message) : caught instanceof Error ? caught.message : fallback })
    if (refusal) { setSelected(new Set()); reload() }
  }

  const downloadSelected = async () => {
    if (!data) return
    setBusy('selected'); setNotice(null)
    let saved = 0
    try {
      for (const item of items.filter(i => selected.has(i.id))) {
        const { blob, filename } = await downloadRequestItemFile(data.id, item.id)
        saveBlob(blob, filename ?? item.image_name)
        saved += 1
      }
      setNotice({ kind: 'ok', text: `${saved} photo${saved === 1 ? '' : 's'} downloaded.` })
      setSelected(new Set())
    } catch (caught) {
      explain(caught, 'The download failed.')
    } finally {
      setBusy('')
    }
  }

  const downloadZip = async () => {
    if (!data) return
    setBusy('zip'); setNotice(null)
    try {
      const { blob, filename } = await downloadRequestZip(data.id)
      saveBlob(blob, filename ?? `facecloud-request-${data.id}.zip`)
      setNotice({ kind: 'ok', text: 'The ZIP of your approved photos was downloaded.' })
    } catch (caught) {
      explain(caught, 'The ZIP could not be downloaded.')
    } finally {
      setBusy('')
    }
  }

  const cancel = async () => {
    if (!data) return
    setBusy('cancel'); setCancelError(null)
    try {
      await cancelDownloadRequest(data.id)
      setConfirmCancel(false)
      setNotice({ kind: 'ok', text: 'The request was cancelled.' })
      reload()
    } catch (caught) {
      setCancelError(requestErrorSentence(errorCodeOf(caught), caught instanceof Error ? caught.message : 'The request could not be cancelled.'))
      if (errorCodeOf(caught) === 'request_closed') reload()
    } finally {
      setBusy('')
    }
  }

  if (!valid || (error && !loading)) {
    const notFound = !valid || /not found|404/i.test(error ?? '')
    return (
      <div className="page-enter">
        <Link to="/dashboard/download-requests" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline mb-4"><ArrowLeft className="w-3.5 h-3.5" />All requests</Link>
        <div className="fc-card py-14 text-center" role="alert">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-error" />
          <p className="text-sm font-semibold text-ink">{notFound ? 'This request does not exist or is not yours.' : error}</p>
          {!notFound && <button type="button" onClick={reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button>}
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return <p className="py-20 text-center text-xs text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading the request…</p>
  }

  return (
    <div className="page-enter">
      <Link to="/dashboard/download-requests" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline mb-4"><ArrowLeft className="w-3.5 h-3.5" />All requests</Link>
      <PageHeader
        title={`Download request #${data.id}`}
        subtitle={`${data.organization_name} · ${countsLine(data)}`}
        action={<RequestStatusBadge status={data.status} />}
      />

      <dl className="fc-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-5">
        <div><dt className="text-ink-faint">Sent</dt><dd className="font-semibold text-ink">{formatDateTime(data.created_at)}</dd></div>
        <div><dt className="text-ink-faint">Decided</dt><dd className="font-semibold text-ink">{data.decided_at ? formatDateTime(data.decided_at) : data.status === 'cancelled' ? 'Cancelled' : 'Not yet'}</dd></div>
        <div><dt className="text-ink-faint">Photos</dt><dd className="font-semibold text-ink">{data.counts.total}</dd></div>
        {data.requester_message && <div className="sm:col-span-3"><dt className="text-ink-faint">Your message</dt><dd className="text-ink whitespace-pre-wrap break-words">{data.requester_message}</dd></div>}
      </dl>

      {notice && (
        <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`p-3 mb-4 rounded-2xl text-xs border flex items-start justify-between gap-3 ${notice.kind === 'ok' ? 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]' : 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]'}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {ready.length > 0 && (
          <>
            <GradientButton size="sm" disabled={busy !== '' || selected.size === 0} onClick={() => void downloadSelected()}
              leftIcon={busy === 'selected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}>
              Download selected{selected.size ? ` (${selected.size})` : ''}
            </GradientButton>
            <GradientButton size="sm" variant="secondary" disabled={busy !== ''} onClick={() => void downloadZip()}
              leftIcon={busy === 'zip' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileArchive className="w-3.5 h-3.5" />}>
              Download all approved (ZIP)
            </GradientButton>
            {selected.size < ready.length && (
              <button type="button" className="text-xs font-semibold text-accent hover:underline cursor-pointer" onClick={() => setSelected(new Set(ready.map(item => item.id)))}>Select all ready</button>
            )}
          </>
        )}
        <div className="flex-1" />
        {data.status === 'pending' && (
          <GradientButton size="sm" variant="danger" disabled={busy !== ''} onClick={() => { setCancelError(null); setConfirmCancel(true) }}>Cancel request</GradientButton>
        )}
      </div>
      {ready.length === 0 && data.counts.approved > 0 && (
        <p className="text-xs text-ink-mute mb-3">No approval on this request can be used any more. Request the photos again from My Images if you still need them.</p>
      )}

      <ul className="fc-card divide-y divide-line">
        {items.map(item => <ItemRow key={item.id} item={item} checked={selected.has(item.id)} onToggle={() => toggle(item.id)} />)}
      </ul>

      {confirmCancel && (
        <ConfirmDialog
          title="Cancel this request?"
          confirmLabel="Cancel request"
          busyLabel="Cancelling…"
          busy={busy === 'cancel'}
          error={cancelError}
          danger
          onConfirm={() => void cancel()}
          onCancel={() => setConfirmCancel(false)}
        >
          The moderators will no longer see it. You can send a new request for these photos later.
        </ConfirmDialog>
      )}
    </div>
  )
}

export default function DownloadRequestDetail() {
  return <NeedsApi title="Download request" icon={FileDown}><DownloadRequestDetailLive /></NeedsApi>
}
