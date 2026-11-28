import type { AccessState, DownloadRequestStatus, RequestItemStatus } from '../../lib/api/downloads'
import {
  ACCESS_STATE_LABEL, ACCESS_STATE_TONE, ITEM_STATUS_LABEL, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, TONE,
} from '../../lib/downloadApproval'

const chip = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap'

export function RequestStatusBadge({ status }: { status: DownloadRequestStatus }) {
  return <span className={`${chip} ${TONE[REQUEST_STATUS_TONE[status]]}`}>{REQUEST_STATUS_LABEL[status] ?? status}</span>
}

export function ItemStatusBadge({ status }: { status: RequestItemStatus }) {
  const tone = status === 'approved' ? TONE.ok : status === 'denied' ? TONE.bad : TONE.waiting
  return <span className={`${chip} ${tone}`}>{ITEM_STATUS_LABEL[status] ?? status}</span>
}

/** The access a member already has to one image (from requests/check/). "Not requested" is not shown: it is the normal case. */
export function AccessChip({ state, title }: { state: AccessState; title?: string }) {
  if (state === 'not_requested') return null
  return <span className={`${chip} ${TONE[ACCESS_STATE_TONE[state]]}`} title={title}>{ACCESS_STATE_LABEL[state] ?? state}</span>
}
