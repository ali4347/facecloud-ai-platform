import { useEffect, useState } from 'react'
import { Building2, Loader2, Lock, User } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { getAdminUserDetail, type AdminUserDetail } from '../../lib/api/adminUsers'
import { formatBytes } from '../../lib/imageData'
import { messageFor } from '../../lib/useApiResource'
import { formatDate } from '../../lib/utils'

/**
 * One account as the Platform Administrator sees it: personal or organization, every organization it belongs to (its
 * private workspace marked as such) and what it stores. Read-only; the actions stay on the Users list.
 */
export function UserDetailsDialog({ userId, name, onClose }: { userId: number; name: string; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAdminUserDetail(userId, controller.signal)
      .then(answer => { if (!controller.signal.aborted) setDetail(answer) })
      .catch(caught => { if (!controller.signal.aborted) setError(messageFor(caught)) })
    return () => controller.abort()
  }, [userId])

  const shared = (detail?.organizations ?? []).filter(o => !o.is_personal)
  const personal = (detail?.organizations ?? []).filter(o => o.is_personal)

  return (
    <Modal title={`Account · ${name}`} onClose={onClose} wide>
      {error && <p role="alert" className="text-xs text-[#F87171]">{error}</p>}
      {!detail && !error && <p className="text-xs text-ink-faint flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading the account…</p>}
      {detail && (
        <div className="space-y-4 text-xs">
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><dt className="text-ink-faint">E-mail</dt><dd className="font-semibold text-ink break-all">{detail.email}</dd></div>
            <div><dt className="text-ink-faint">Account type</dt><dd className="font-semibold text-ink">
              {detail.account_type === 'organization' ? `Organization (${detail.shared_organization_count ?? shared.length})` : detail.account_type === 'personal' ? 'Personal' : '—'}</dd></div>
            <div><dt className="text-ink-faint">Role</dt><dd className="font-semibold text-ink capitalize">{detail.role}</dd></div>
            <div><dt className="text-ink-faint">Status</dt><dd className="font-semibold text-ink">{detail.is_suspended ? 'Suspended' : detail.is_active ? 'Active' : 'Inactive'}{detail.is_email_verified ? ' · verified' : ' · not verified'}</dd></div>
            <div><dt className="text-ink-faint">Joined</dt><dd className="font-semibold text-ink">{formatDate(detail.date_joined)}</dd></div>
            <div><dt className="text-ink-faint">Last sign-in</dt><dd className="font-semibold text-ink">{detail.last_login ? formatDate(detail.last_login) : 'Never'}</dd></div>
            <div><dt className="text-ink-faint">Photos uploaded</dt><dd className="font-semibold text-ink">{detail.uploads_count ?? detail.usage?.images ?? '—'}</dd></div>
            <div><dt className="text-ink-faint">Storage (originals, trash included)</dt><dd className="font-semibold text-ink">{typeof detail.usage?.storage_bytes === 'number' ? formatBytes(detail.usage.storage_bytes) : '—'}</dd></div>
            {typeof detail.active_sessions === 'number' && <div><dt className="text-ink-faint">Signed-in devices</dt><dd className="font-semibold text-ink">{detail.active_sessions}</dd></div>}
          </dl>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Workspaces</p>
            <ul className="divide-y divide-line border border-line rounded-2xl">
              {personal.map(o => (
                <li key={o.id} className="flex items-center gap-2 p-2.5"><User className="w-3.5 h-3.5 text-ink-faint" />
                  <span className="flex-1 text-ink">Personal workspace</span><span className="text-ink-faint flex items-center gap-1"><Lock className="w-3 h-3" />Private to them</span></li>
              ))}
              {shared.map(o => (
                <li key={o.id} className="flex items-center gap-2 p-2.5"><Building2 className="w-3.5 h-3.5 text-accent" />
                  <span className="flex-1 text-ink font-semibold">{o.name}</span><span className="text-ink-mute capitalize">{o.role} · {o.status}</span></li>
              ))}
              {personal.length === 0 && shared.length === 0 && <li className="p-2.5 text-ink-faint">No workspace yet.</li>}
            </ul>
            <p className="text-[10px] text-ink-faint">Personal photos are never shown to an organization’s staff; only photos submitted to an organization are.</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
