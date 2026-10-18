import { useState } from 'react'
import { AlertTriangle, Link2, Loader2, RefreshCw } from 'lucide-react'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { StatusBadge } from '../ui/StatusBadge'
import { ApiError } from '../../lib/api/client'
import { listShareLinks, revokeShareLink, shareTarget, type ShareLinkRecord } from '../../lib/api/shares'
import { useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const BADGE: Record<string, 'success' | 'warning' | 'muted'> = { active: 'success', expired: 'warning', revoked: 'muted' }

/**
 * The secure links this person has made, with how often each was opened, and the way to stop one from working.
 * A link itself is never shown again (only its hash is stored), so this lists facts, not addresses.
 */
export function ShareLinksPanel() {
  const { data, loading, error, reload } = useApiResource(signal => listShareLinks(signal), () => [] as ShareLinkRecord[], [])
  const [toRevoke, setToRevoke] = useState<ShareLinkRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [revokeError, setRevokeError] = useState('')

  const links = data ?? []

  const confirm = async () => {
    if (!toRevoke) return
    setBusy(true); setRevokeError('')
    try {
      await revokeShareLink(toRevoke.id)
      setToRevoke(null)
      reload()
    } catch (caught) {
      setRevokeError(caught instanceof ApiError ? caught.message : 'Could not stop this link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fc-card overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-line flex items-center gap-2">
        <Link2 className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-bold text-ink">Your secure links</h2>
      </div>

      {loading && <div className="py-10 text-center text-ink-faint"><Loader2 className="w-5 h-5 mx-auto animate-spin" /></div>}

      {!loading && error && (
        <div className="py-10 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button type="button" onClick={reload} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button>
        </div>
      )}

      {!loading && !error && links.length === 0 && (
        <p className="py-10 text-center text-xs text-ink-mute">You have not made any secure links yet.</p>
      )}

      {!loading && !error && links.length > 0 && (
        <ul className="divide-y divide-line">
          {links.map(link => (
            <li key={link.id} className="px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink flex items-center gap-2">
                  {link.label || shareTarget(link)}
                  <StatusBadge status={BADGE[link.state] ?? 'muted'} label={link.state} dot={false} />
                </p>
                <p className="text-xs text-ink-mute mt-0.5">
                  {shareTarget(link)} · made {formatDateTime(link.created_at)}
                  {link.state === 'active' && link.expires_at ? ` · ends ${formatDateTime(link.expires_at)}` : ''}
                  {` · opened ${link.access_count} time${link.access_count === 1 ? '' : 's'}`}
                  {link.last_accessed_at ? `, last ${formatDateTime(link.last_accessed_at)}` : ''}
                </p>
              </div>
              {link.state === 'active' && (
                <button type="button" onClick={() => { setRevokeError(''); setToRevoke(link) }}
                  className="text-xs font-bold text-error hover:underline cursor-pointer">Stop this link</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {toRevoke && (
        <ConfirmDialog title="Stop this link?" confirmLabel="Stop link" busyLabel="Stopping…" danger busy={busy} error={revokeError || null}
          onConfirm={() => void confirm()} onCancel={() => setToRevoke(null)}>
          <p>Anyone who has this link will no longer be able to open it. This cannot be undone; you can make a new link at any time.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
